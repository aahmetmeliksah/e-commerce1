require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const Joi = require('joi')
const { openDatabase } = require('./db')
const { productService } = require('./services/productsService')
const productSchema = Joi.object({
  product_name: Joi.string().trim().min(3).max(150).required(),
  product_description: Joi.string().trim().min(10).max(3000).required(),
  category_name: Joi.any().strip(),
  category_id: Joi.number().integer().positive().max(2147483647).required(),
  price: Joi.number().min(0).max(99999999.99).precision(2).required(),
  quantity: Joi.number().integer().min(0).max(1000000).required(),
  img_url: Joi.string()
    .max(1000)
    .allow('')
    .custom((value, helpers) => {
      if (/^\/images\/[a-z0-9-]+\.(svg|jpg|webp|png)$/.test(value)) return value
      try {
        if (['http:', 'https:'].includes(new URL(value).protocol)) return value
      } catch {}
      return helpers.error('any.invalid')
    })
    .default(''),
})
function createApp(db) {
  const app = express()
  const service = productService(db)
  app.use(helmet())
  app.use(
    cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' })
  )
  app.use(express.json({ limit: '32kb' }))
  const route = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res)).catch(next)
  const id = (req) => {
    if (
      !/^[1-9]\d*$/.test(req.params.id) ||
      !Number.isSafeInteger(Number(req.params.id))
    )
      throw Object.assign(new Error('Invalid product ID'), { status: 400 })
    return Number(req.params.id)
  }
  const body = async (req) => {
    const { error, value } = productSchema.validate(req.body, {
      abortEarly: false,
    })
    if (error)
      throw Object.assign(
        new Error(error.details.map((d) => d.message).join('. ')),
        { status: 400 }
      )
    const category = (
      await db.query('SELECT name FROM categories WHERE id=$1', [
        value.category_id,
      ])
    ).rows[0]
    if (!category)
      throw Object.assign(new Error('Choose an existing category'), {
        status: 400,
      })
    return { ...value, category_name: category.name }
  }
  const found = (value) => {
    if (!value)
      throw Object.assign(new Error('Product not found'), { status: 404 })
    return value
  }
  app.get(
    '/categories',
    route(async (req, res) =>
      res.json(
        (await db.query('SELECT id,name FROM categories ORDER BY name')).rows
      )
    )
  )
  app.post(
    '/categories',
    route(async (req, res) => {
      const { error, value } = Joi.object({
        name: Joi.string().trim().min(2).max(150).required(),
      }).validate(req.body)
      if (error)
        return res
          .status(400)
          .json({ message: 'Category name must be 2–150 characters' })
      const name = value.name
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
      const category = (
        await db.query(
          'INSERT INTO categories(name) VALUES($1) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id,name',
          [name]
        )
      ).rows[0]
      res.status(201).json(category)
    })
  )
  app.get(
    '/health',
    route(async (req, res) => {
      await db.query('SELECT 1')
      res.json({ status: 'ok' })
    })
  )
  app.get(
    '/products',
    route(async (req, res) => {
      if (
        req.query.q &&
        (typeof req.query.q !== 'string' || req.query.q.length > 150)
      )
        return res
          .status(400)
          .json({ message: 'Search must be at most 150 characters' })
      res.json(await service.list(req.query.q || ''))
    })
  )
  app.get(
    '/products/:id',
    route(async (req, res) => res.json(found(await service.find(id(req)))))
  )
  const add = route(async (req, res) =>
    res.status(201).json(await service.create(await body(req)))
  )
  app.post('/products', add)
  app.post('/addproduct', add)
  app.put(
    '/products/:id',
    route(async (req, res) =>
      res.json(found(await service.update(id(req), await body(req))))
    )
  )
  app.delete(
    '/products/:id',
    route(async (req, res) => {
      found(await service.remove(id(req)))
      res.status(204).end()
    })
  )
  app.post(
    '/search',
    route(async (req, res) => {
      const q = req.body?.data?.searchInput ?? req.body?.q
      if (typeof q !== 'string' || q.length > 150)
        return res.status(400).json({
          message: 'Provide a search string of at most 150 characters',
        })
      res.json(await service.list(q))
    })
  )
  app.use((req, res) => res.status(404).json({ message: 'Route not found' }))
  app.use((error, req, res, next) => {
    const status = error.status || 500
    if (status >= 500) console.error(error.message)
    res.status(status).json({
      message:
        status >= 500
          ? 'Unable to complete the request. Please try again.'
          : error.message,
    })
  })
  return app
}
if (require.main === module) {
  openDatabase()
    .then((db) => {
      const server = createApp(db).listen(
        process.env.PORT || 5000,
        '127.0.0.1',
        () =>
          console.log(
            'API ready at http://localhost:' + (process.env.PORT || 5000)
          )
      )
      const stop = () =>
        server.close(async () => {
          await db.close()
          process.exit(0)
        })
      process.on('SIGINT', stop)
      process.on('SIGTERM', stop)
    })
    .catch((error) => {
      console.error('Database startup failed:', error.message)
      process.exitCode = 1
    })
}
module.exports = { createApp }
