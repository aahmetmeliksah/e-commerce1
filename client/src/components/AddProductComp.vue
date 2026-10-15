<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, money } from '../api'
const route = useRoute(),
  router = useRouter()
const editing = computed(() => Boolean(route.params.id))
const blank = () => ({
  product_name: '',
  product_description: '',
  category_id: '',
  price: '',
  quantity: 1,
  img_url: '',
})
const product = ref(blank()),
  categories = ref([]),
  busy = ref(false),
  loading = ref(true),
  loadFailed = ref(false),
  error = ref(''),
  categoryEditor = ref(false),
  newCategory = ref(''),
  creatingCategory = ref(false),
  categoryError = ref('')
const selectedCategory = computed(
  () =>
    categories.value.find((c) => c.id === Number(product.value.category_id))
      ?.name || 'Your category'
)
let request = 0
async function load() {
  const current = ++request,
    id = route.params.id
  loading.value = true
  loadFailed.value = false
  error.value = ''
  product.value = blank()
  try {
    const [list, p] = await Promise.all([
      api('/categories'),
      id ? api('/products/' + id) : Promise.resolve(blank()),
    ])
    if (current === request) {
      categories.value = list
      product.value = p
    }
  } catch (e) {
    if (current === request) {
      error.value = e.message
      loadFailed.value = true
    }
  } finally {
    if (current === request) loading.value = false
  }
}
watch(
  () => route.params.id,
  () => {
    categoryEditor.value = false
    categoryError.value = ''
    load()
  },
  { immediate: true }
)
async function createCategory() {
  creatingCategory.value = true
  categoryError.value = ''
  try {
    const category = await api('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: newCategory.value }),
    })
    if (!categories.value.some((c) => c.id === category.id))
      categories.value.push(category)
    categories.value.sort((a, b) => a.name.localeCompare(b.name))
    product.value.category_id = category.id
    newCategory.value = ''
    categoryEditor.value = false
  } catch (e) {
    categoryError.value = e.message
  } finally {
    creatingCategory.value = false
  }
}
async function save() {
  busy.value = true
  error.value = ''
  const {
    product_name,
    product_description,
    category_id,
    price,
    quantity,
    img_url,
  } = product.value
  try {
    await api(editing.value ? '/products/' + route.params.id : '/products', {
      method: editing.value ? 'PUT' : 'POST',
      body: JSON.stringify({
        product_name,
        product_description,
        category_id: Number(category_id),
        price: Number(price),
        quantity: Number(quantity),
        img_url,
      }),
    })
    router.push({
      path: '/',
      query: { saved: editing.value ? 'updated' : 'created' },
    })
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="form-page">
    <router-link to="/" class="back-link"
      ><AppIcon name="left" /> Back to collection</router-link
    >
    <p class="eyebrow">A PLACE FOR SOMETHING GOOD</p>
    <h1>{{ editing ? 'Refine the details.' : 'Meet your next favourite.' }}</h1>
    <p class="muted">
      {{
        editing
          ? 'Update this product in your collection.'
          : 'Add a product to the collection. A few thoughtful details make all the difference.'
      }}
    </p>
    <p v-if="loading" class="loading-state" role="status">
      <AppIcon name="loading" class="spin" /> Loading product form…
    </p>
    <div v-else-if="loadFailed" class="empty" role="alert">
      <h3>The form couldn't be loaded.</h3>
      <p>{{ error }}</p>
      <button class="button" @click="load">Try again</button>
    </div>
    <div v-else class="form-layout">
      <form @submit.prevent="save">
        <p class="form-step">01 <span>The essentials</span></p>
        <label
          >Product name<input
            v-model="product.product_name"
            required
            minlength="3"
            maxlength="150"
            placeholder="e.g. Everyday Tote"
        /></label>
        <label
          >Description<textarea
            v-model="product.product_description"
            aria-label="Description"
            aria-describedby="description-help"
            required
            minlength="10"
            maxlength="3000"
            rows="4"
            placeholder="What makes it useful? Tell its story."
          ></textarea
          ><small id="description-help"
            >At least 10 characters. Keep it clear and helpful.</small
          ></label
        >
        <div class="category-field">
          <label
            >Category<select
              v-model="product.category_id"
              required
              aria-label="Category"
            >
              <option disabled value="">Select a category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select></label
          >
          <button
            class="new-category-button"
            type="button"
            :aria-expanded="categoryEditor"
            @click="categoryEditor = !categoryEditor"
          >
            <AppIcon :name="categoryEditor ? 'close' : 'plus'" :size="16" />
            {{ categoryEditor ? 'Cancel' : 'New category' }}
          </button>
        </div>
        <div v-if="categoryEditor" class="category-editor">
          <label
            >New category name<input
              v-model="newCategory"
              aria-label="New category name"
              minlength="2"
              maxlength="150"
              placeholder="e.g. Lighting"
              @keydown.enter.prevent="createCategory"
          /></label>
          <p v-if="categoryError" class="error" role="alert">
            {{ categoryError }}
          </p>
          <button
            type="button"
            class="button secondary"
            :disabled="creatingCategory || newCategory.trim().length < 2"
            @click="createCategory"
          >
            <AppIcon name="plus" />
            {{ creatingCategory ? 'Creating…' : 'Create category' }}
          </button>
        </div>
        <p class="form-step">02 <span>Price & availability</span></p>
        <div class="form-row">
          <label
            >Price (USD)<input
              v-model="product.price"
              required
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              placeholder="0.00" /></label
          ><label
            >Stock quantity<input
              v-model="product.quantity"
              required
              type="number"
              min="0"
              max="1000000"
              step="1"
          /></label>
        </div>
        <label
          >Image URL<input
            v-model="product.img_url"
            aria-label="Image URL"
            aria-describedby="image-help"
            maxlength="1000"
            placeholder="https://example.com/product.jpg"
          /><small id="image-help"
            >Optional. Use a photo URL or leave blank for our
            placeholder.</small
          ></label
        >
        <p v-if="error" role="alert" class="error">{{ error }}</p>
        <div class="form-actions">
          <button class="button" :disabled="busy || creatingCategory">
            <AppIcon
              :name="busy ? 'loading' : 'check'"
              :class="{ spin: busy }"
            />
            {{
              busy ? 'Saving…' : editing ? 'Save changes' : 'Add to collection'
            }}</button
          ><router-link to="/" class="text-link">Cancel</router-link>
        </div>
      </form>
      <aside class="form-preview">
        <p class="eyebrow">A FIRST LOOK</p>
        <div class="preview-art">
          <img
            :src="product.img_url || '/images/placeholder.svg'"
            alt="Product preview"
            @error="$event.target.src = '/images/placeholder.svg'"
          />
        </div>
        <p class="muted">{{ selectedCategory }}</p>
        <h3>{{ product.product_name || 'Your product, right here.' }}</h3>
        <strong>{{ money(product.price) }}</strong>
        <p class="preview-note">
          The details you add appear in the collection and product view.
        </p>
      </aside>
    </div>
  </section>
</template>
