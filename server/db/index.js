const fs = require('node:fs/promises')
const path = require('node:path')
async function openDatabase({
  connectionString = process.env.DB_CONNECTION_STRING,
  dataDir = process.env.DATA_DIR || path.join(__dirname, '../data'),
  seed = process.env.SEED_DEMO === 'true',
} = {}) {
  let db
  if (connectionString) {
    const { Pool } = require('pg')
    db = new Pool({ connectionString })
    db.close = () => db.end()
  } else {
    const { PGlite } = require('@electric-sql/pglite')
    db = new PGlite(dataDir)
    await db.waitReady
  }
  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8')
  if (db.exec) await db.exec(schema)
  else await db.query(schema)
  if (seed) {
    const { rows } = await db.query('SELECT COUNT(*) AS count FROM products')
    if (Number(rows[0].count) === 0) {
      const products = JSON.parse(
        await fs.readFile(path.join(__dirname, 'seed.json'), 'utf8')
      )
      for (const p of products)
        await db.query(
          'INSERT INTO products (product_name, product_description, category_name, category_id, price, quantity, img_url) VALUES ($1,$2,$3,$4,$5,$6,$7)',
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
    }
  }
  return db
}
module.exports = { openDatabase }
