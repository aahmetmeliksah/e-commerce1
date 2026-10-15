<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'
import { syncCart } from '../cart'
import ProductCardComp from '../components/ProductCardComp.vue'
import ProductDrawer from '../components/ProductDrawer.vue'
const products = ref([]),
  loading = ref(true),
  error = ref(''),
  query = ref(''),
  category = ref('All'),
  sort = ref('featured'),
  selected = ref(null),
  notice = ref('')
const categories = computed(() => [
  'All',
  ...new Set(products.value.map((p) => p.category_name).sort()),
])
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = products.value.filter(
    (p) =>
      (category.value === 'All' || p.category_name === category.value) &&
      [p.product_name, p.product_description, p.category_name].some((v) =>
        v.toLowerCase().includes(q)
      )
  )
  if (sort.value === 'low')
    list.sort((a, b) => Number(a.price) - Number(b.price))
  if (sort.value === 'high')
    list.sort((a, b) => Number(b.price) - Number(a.price))
  if (sort.value === 'name')
    list.sort((a, b) => a.product_name.localeCompare(b.product_name))
  return list
})
async function load() {
  loading.value = true
  error.value = ''
  try {
    products.value = await api('/products')
    syncCart(products.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
function removed(id) {
  products.value = products.value.filter((p) => p.id !== id)
  syncCart(products.value)
  selected.value = null
  notice.value = 'Product removed from the collection.'
}
function reset() {
  query.value = ''
  category.value = 'All'
}
onMounted(load)
</script>
<template>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow"><span></span> A LITTLE MORE CONSIDERED</p>
      <h1>Everyday things.<br /><em>Extraordinary feeling.</em></h1>
      <p>
        Useful, beautiful essentials for the way you live.<br class="desktop" />
        Find something that feels like you.
      </p>
      <a class="button" href="#collection"
        >Explore the collection <span>↘</span></a
      >
    </div>
    <div class="hero-art">
      <img
        src="/images/hero.svg"
        alt="Illustrated everyday essentials: a lamp, tote, and coffee cup"
      /><span class="hero-caption">LESS, BUT BETTER. / VOL. 01</span>
    </div>
  </section>
  <section id="collection" class="collection">
    <div class="section-top">
      <div>
        <p class="eyebrow">CURATED FOR YOUR EVERYDAY</p>
        <h2>The collection<span class="heading-dot">.</span></h2>
      </div>
      <p class="muted">{{ products.length }} thoughtful essentials</p>
    </div>
    <div class="toolbar">
      <label class="search"
        ><span aria-hidden="true">⌕</span
        ><input
          v-model="query"
          type="search"
          aria-label="Search products"
          placeholder="Find your next favourite…"
          maxlength="150" /></label
      ><label class="sort"
        >Sort by
        <select v-model="sort" aria-label="Sort products">
          <option value="featured">Latest additions</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="name">Name: A to Z</option>
        </select></label
      >
    </div>
    <div class="filters" aria-label="Filter by category">
      <button
        v-for="c in categories"
        :key="c"
        :class="{ active: category === c }"
        :aria-pressed="category === c"
        @click="category = c"
      >
        {{ c }}<span v-if="c === 'All'"> {{ products.length }}</span>
      </button>
    </div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <div v-if="loading" class="empty" role="status">
      Gathering the good things…
    </div>
    <div v-else-if="error" class="empty" role="alert">
      <h3>We couldn't load the collection.</h3>
      <p>{{ error }}</p>
      <button class="button" @click="load">Try again</button>
    </div>
    <template v-else>
      <p class="results">
        {{ filtered.length }} {{ filtered.length === 1 ? 'product' : 'products'
        }}<span v-if="query"> matching “{{ query }}”</span>
      </p>
      <div v-if="filtered.length" class="product-grid">
        <ProductCardComp
          v-for="p in filtered"
          :key="p.id"
          :product="p"
          @view-product="selected = $event"
        />
      </div>
      <div v-else class="empty">
        <h3>
          {{
            products.length
              ? 'No matches. A fresh start?'
              : 'Your collection starts here.'
          }}
        </h3>
        <p>
          {{
            products.length
              ? 'Try a different search or category.'
              : 'Add your first product to bring this space to life.'
          }}
        </p>
        <button v-if="products.length" class="button secondary" @click="reset">
          Clear filters</button
        ><router-link v-else class="button" to="/addproduct"
          >Add a product</router-link
        >
      </div>
    </template>
  </section>
  <section class="store-note">
    <span class="note-star">✳</span>
    <h2>A little intention<br />goes a long way.</h2>
    <p>
      We believe the best things earn their place.<br />Simple pieces. Useful
      details. Everyday joy.
    </p>
  </section>
  <ProductDrawer
    v-if="selected"
    :product="selected"
    @close="selected = null"
    @removed="removed"
  />
</template>
