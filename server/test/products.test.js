const { test } = require('node:test')
const assert = require('node:assert/strict')
const { openDatabase } = require('../db')
const { createApp } = require('../app')
test('catalog API: validation, search, CRUD, and persistence', async (t) => {
  const fs = require('node:fs/promises'),
    os = require('node:os'),
    path = require('node:path')
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-test-'))
  const db = await openDatabase({
    dataDir: dir,
    connectionString: '',
    seed: true,
  })
  const server = createApp(db).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = 'http://127.0.0.1:' + server.address().port
  const req = async (url, method = 'GET', data) => {
    const r = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
    return { status: r.status, body: r.status === 204 ? null : await r.json() }
  }
  const product = {
    product_name: 'Test desk',
    product_description: 'A durable test desk for your workspace.',
    category_id: 0,
    price: 49.95,
    quantity: 2,
    img_url: '',
  }
  let created
  try {
    assert.equal((await req('/health')).status, 200)
    const catalog = (await req('/products')).body
    assert.equal(catalog.length, 21)
    const categories = (await req('/categories')).body
    assert.equal(categories.length, 7)
    for (const c of categories)
      assert.equal(catalog.filter((p) => p.category_id === c.id).length, 3)
    product.category_id = categories.find((c) => c.name === 'Home').id
    assert.equal(
      (await req('/products', 'POST', { ...product, category_id: 999999 }))
        .status,
      400
    )
    const addedCategory = await req('/categories', 'POST', { name: 'Lighting' })
    assert.equal(addedCategory.status, 201)
    assert.ok(addedCategory.body.id > 0)
    assert.equal(
      (await req('/categories', 'POST', { name: 'lighting' })).body.id,
      addedCategory.body.id
    )
    assert.equal((await req('/products?q=headphones')).body.length, 1)
    assert.equal((await req('/products?q=%25')).body.length, 0)
    assert.equal(
      (await req('/products', 'POST', { ...product, price: -1 })).status,
      400
    )
    assert.equal(
      (await req('/products', 'POST', { ...product, quantity: 1.5 })).status,
      400
    )
    assert.equal(
      (
        await req('/products', 'POST', {
          ...product,
          img_url: 'javascript:alert(1)',
        })
      ).status,
      400
    )
    assert.equal((await req('/products/abc')).status, 400)
    assert.equal((await req('/products/999999')).status, 404)
    const result = await req('/products', 'POST', product)
    assert.equal(result.status, 201)
    created = result.body
    assert.equal(created.category_name, 'Home')
    assert.equal(
      (await req('/products/' + created.id)).body.product_name,
      'Test desk'
    )
    const updated = await req('/products/' + created.id, 'PUT', {
      ...product,
      price: 75,
      quantity: 0,
    })
    assert.equal(updated.status, 200)
    assert.equal(Number(updated.body.price), 75)
    assert.equal(
      (await req('/search', 'POST', { data: { searchInput: 'Test desk' } }))
        .body.length,
      1
    )
  } finally {
    await new Promise((resolve) => server.close(resolve))
    await db.close()
  }
  const reopened = await openDatabase({
    dataDir: dir,
    connectionString: '',
    seed: true,
  })
  try {
    assert.equal(
      Number(
        (await reopened.query('SELECT COUNT(*) AS count FROM products')).rows[0]
          .count
      ),
      22
    )
    assert.equal(
      Number(
        (
          await reopened.query('SELECT price FROM products WHERE id=$1', [
            created.id,
          ])
        ).rows[0].price
      ),
      75
    )
    const second = createApp(reopened).listen(0, '127.0.0.1')
    await new Promise((resolve) => second.once('listening', resolve))
    try {
      const url =
        'http://127.0.0.1:' + second.address().port + '/products/' + created.id
      assert.equal((await fetch(url, { method: 'DELETE' })).status, 204)
      assert.equal((await fetch(url)).status, 404)
      assert.equal((await fetch(url, { method: 'DELETE' })).status, 404)
    } finally {
      await new Promise((resolve) => second.close(resolve))
    }
  } finally {
    await reopened.close()
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(dir).startsWith('catalog-test-'))
    await fs.rm(dir, { recursive: true, force: true })
  }
})
test('legacy catalog migration preserves edited products and does not reseed deleted samples', async () => {
  const fs = require('node:fs/promises'),
    os = require('node:os'),
    path = require('node:path')
  const { PGlite } = require('@electric-sql/pglite')
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-test-'))
  let db
  try {
    db = new PGlite(dir)
    await db.waitReady
    await db.exec(
      'CREATE TABLE products(id SERIAL PRIMARY KEY,product_name TEXT NOT NULL,product_description TEXT NOT NULL,category_name TEXT NOT NULL,category_id INTEGER NOT NULL,price NUMERIC(10,2) NOT NULL,quantity INTEGER NOT NULL,img_url TEXT NOT NULL)'
    )
    const legacy = require('../db/legacy-seed.json')
    for (const p of legacy)
      await db.query(
        'INSERT INTO products(product_name,product_description,category_name,category_id,price,quantity,img_url) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [
          p.product_name,
          p.product_description,
          p.category_name,
          p.category_id,
          p.price,
          p.quantity,
          p.img_url,
        ]
      )
    await db.query(
      "UPDATE products SET product_description='Custom description that belongs to the user' WHERE product_name='Studio Lamp'"
    )
    await db.close()
    db = await openDatabase({ dataDir: dir, connectionString: '', seed: true })
    assert.equal(
      Number(
        (await db.query('SELECT COUNT(*) AS count FROM products')).rows[0].count
      ),
      22
    )
    const custom = (
      await db.query(
        "SELECT * FROM products WHERE product_description='Custom description that belongs to the user'"
      )
    ).rows[0]
    assert.equal(custom.img_url, '/images/lamp.svg')
    assert.equal(custom.demo_key, null)
    assert.equal(
      (
        await db.query(
          'SELECT * FROM products WHERE demo_key IS NOT NULL AND img_url LIKE $1',
          ['%.svg']
        )
      ).rows.length,
      0
    )
    const counts = (
      await db.query(
        'SELECT category_name,COUNT(*) AS count FROM products GROUP BY category_name'
      )
    ).rows
    for (const c of counts) assert.ok(Number(c.count) >= 3)
    await db.query("DELETE FROM products WHERE demo_key='original-1'")
    await db.close()
    db = await openDatabase({ dataDir: dir, connectionString: '', seed: true })
    assert.equal(
      Number(
        (await db.query('SELECT COUNT(*) AS count FROM products')).rows[0].count
      ),
      21
    )
    assert.equal(
      (await db.query("SELECT * FROM products WHERE demo_key='original-1'"))
        .rows.length,
      0
    )
  } finally {
    if (db) await db.close()
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(dir).startsWith('catalog-test-'))
    await fs.rm(dir, { recursive: true, force: true })
  }
})
