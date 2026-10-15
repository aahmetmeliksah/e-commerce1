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
  // Use one connection for schema changes and seed transactions with external PostgreSQL.
  const connection = db.connect ? await db.connect() : db
  try {
    const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8')
    await connection.query('BEGIN')
    try {
      if (connection.exec) await connection.exec(schema)
      else await connection.query(schema)
      if (seed) {
        const migration = await connection.query(
          "SELECT version FROM app_migrations WHERE version='catalog-photos-v2'"
        )
        if (!migration.rows.length) {
          const products = JSON.parse(
            await fs.readFile(path.join(__dirname, 'seed.json'), 'utf8')
          )
          const legacy = JSON.parse(
            await fs.readFile(path.join(__dirname, 'legacy-seed.json'), 'utf8')
          )
          for (const p of products) {
            const category = (
              await connection.query(
                'INSERT INTO categories(name) VALUES($1) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
                [p.category_name]
              )
            ).rows[0]
            const old = legacy.find(
              (item) => item.product_name === p.product_name
            )
            if (old) {
              // Upgrade only untouched sample records; edited/custom products are preserved.
              await connection.query(
                'UPDATE products SET demo_key=$1,img_url=$2 WHERE demo_key IS NULL AND product_name=$3 AND product_description=$4 AND img_url=$5 AND price=$6 AND quantity=$7 AND category_name=$8',
                [
                  p.demo_key,
                  p.img_url,
                  old.product_name,
                  old.product_description,
                  old.img_url,
                  old.price,
                  old.quantity,
                  old.category_name,
                ]
              )
            }
            await connection.query(
              'INSERT INTO products(product_name,product_description,category_name,category_id,price,quantity,img_url,demo_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(demo_key) DO NOTHING',
              [
                p.product_name,
                p.product_description,
                p.category_name,
                category.id,
                p.price,
                p.quantity,
                p.img_url,
                p.demo_key,
              ]
            )
          }
          await connection.query(
            "INSERT INTO app_migrations(version) VALUES('catalog-photos-v2')"
          )
        }
      }
      await connection.query('COMMIT')
    } catch (error) {
      await connection.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    if (connection.release) connection.release()
    await db.close()
    throw error
  }
  if (connection.release) connection.release()
  return db
}
module.exports = { openDatabase }
