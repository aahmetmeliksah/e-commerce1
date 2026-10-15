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
    category_name: 'Home',
    category_id: 3,
    price: 49.95,
    quantity: 2,
    img_url: '',
  }
  let created
  try {
    assert.equal((await req('/health')).status, 200)
    assert.equal((await req('/products')).body.length, 8)
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
    seed: false,
  })
  try {
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
