import { reactive, watch } from 'vue'
let saved = []
try {
  const parsed = JSON.parse(localStorage.getItem('form-field-cart') || '[]')
  if (Array.isArray(parsed))
    saved = parsed.filter(
      (p) => Number.isInteger(p.id) && Number.isInteger(p.count) && p.count > 0
    )
} catch {}
export const cart = reactive(saved)
watch(
  cart,
  () => {
    try {
      localStorage.setItem('form-field-cart', JSON.stringify(cart))
    } catch {}
  },
  { deep: true }
)
export function addToCart(product) {
  const item = cart.find((p) => p.id === product.id)
  if (
    Number(product.quantity) < 1 ||
    (item && item.count >= Number(product.quantity))
  )
    return false
  if (item) item.count++
  else cart.push({ ...product, count: 1 })
  return true
}
export function removeFromCart(id) {
  const i = cart.findIndex((p) => p.id === id)
  if (i >= 0) cart.splice(i, 1)
}
export function syncCart(products) {
  for (let i = cart.length - 1; i >= 0; i--) {
    const p = products.find((p) => p.id === cart[i].id)
    if (!p || Number(p.quantity) === 0) cart.splice(i, 1)
    else
      Object.assign(cart[i], p, {
        count: Math.min(cart[i].count, Number(p.quantity)),
      })
  }
}
