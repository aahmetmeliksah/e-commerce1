const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
export async function api(path, options = {}) {
  let response
  try {
    response = await fetch(base + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new Error(
      'Cannot reach the catalog. Check your connection and try again.'
    )
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || 'Something went wrong. Please try again.')
  }
  return response.status === 204 ? null : response.json()
}
export const money = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  )
