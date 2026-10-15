function productService(db) {
  const fields = [
    'product_name',
    'product_description',
    'category_name',
    'category_id',
    'price',
    'quantity',
    'img_url',
  ]
  return {
    async list(query = '') {
      const { rows } = await db.query(
        'SELECT * FROM products WHERE product_name ILIKE $1 OR product_description ILIKE $1 OR category_name ILIKE $1 ORDER BY id DESC',
        ['%' + query.replace(/[\\%_]/g, '\\$&') + '%']
      )
      return rows
    },
    async find(id) {
      return (await db.query('SELECT * FROM products WHERE id=$1', [id]))
        .rows[0]
    },
    async create(product) {
      return (
        await db.query(
          'INSERT INTO products (' +
            fields.join(',') +
            ') VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
          fields.map((f) => product[f])
        )
      ).rows[0]
    },
    async update(id, product) {
      return (
        await db.query(
          'UPDATE products SET ' +
            fields.map((f, i) => f + '=$' + (i + 1)).join(',') +
            ' WHERE id=$8 RETURNING *',
          [...fields.map((f) => product[f]), id]
        )
      ).rows[0]
    },
    async remove(id) {
      return (
        await db.query('DELETE FROM products WHERE id=$1 RETURNING *', [id])
      ).rows[0]
    },
  }
}
module.exports = { productService }
