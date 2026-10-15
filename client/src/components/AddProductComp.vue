<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, money } from '../api'
const route = useRoute(),
  router = useRouter()
const editing = computed(() => Boolean(route.params.id))
const product = ref({
  product_name: '',
  product_description: '',
  category_name: '',
  category_id: 1,
  price: 0,
  quantity: 1,
  img_url: '',
})
const busy = ref(false),
  loading = ref(false),
  error = ref('')
watch(
  () => route.params.id,
  async (id) => {
    error.value = ''
    product.value = {
      product_name: '',
      product_description: '',
      category_name: '',
      category_id: 1,
      price: 0,
      quantity: 1,
      img_url: '',
    }
    if (id) {
      loading.value = true
      try {
        const result = await api('/products/' + id)
        if (route.params.id === id) product.value = result
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }
  },
  { immediate: true }
)
async function save() {
  busy.value = true
  error.value = ''
  const {
    product_name,
    product_description,
    category_name,
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
        category_name,
        category_id: Number(category_id),
        price: Number(price),
        quantity: Number(quantity),
        img_url,
      }),
    })
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="form-page">
    <router-link to="/" class="back-link">← Back to collection</router-link>
    <p class="eyebrow">A PLACE FOR SOMETHING GOOD</p>
    <h1>{{ editing ? 'Refine the details.' : 'Meet your next favourite.' }}</h1>
    <p class="muted">
      {{
        editing
          ? 'Update this product in your collection.'
          : 'Add a product to the collection. A few thoughtful details make all the difference.'
      }}
    </p>
    <p v-if="loading" role="status">Loading product…</p>
    <div v-else class="form-layout">
      <form @submit.prevent="save">
        <p class="form-step">01 <span>The essentials</span></p>
        <label
          >Product name
          <input
            v-model="product.product_name"
            required
            minlength="3"
            maxlength="150"
            placeholder="e.g. Everyday Tote"
        /></label>
        <label
          >Description
          <textarea
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
        <div class="form-row">
          <label
            >Category
            <input
              v-model="product.category_name"
              required
              minlength="2"
              maxlength="150"
              placeholder="e.g. Accessories" /></label
          ><label
            >Category ID
            <input
              v-model="product.category_id"
              required
              type="number"
              min="1"
              step="1"
          /></label>
        </div>
        <p class="form-step">02 <span>Price & availability</span></p>
        <div class="form-row">
          <label
            >Price (USD)
            <input
              v-model="product.price"
              required
              type="number"
              min="0"
              max="99999999.99"
              step="0.01" /></label
          ><label
            >Stock quantity
            <input
              v-model="product.quantity"
              required
              type="number"
              min="0"
              max="1000000"
              step="1"
          /></label>
        </div>
        <label
          >Image URL
          <input
            v-model="product.img_url"
            aria-label="Image URL"
            aria-describedby="image-help"
            maxlength="1000"
            placeholder="https://example.com/product.jpg"
          /><small id="image-help"
            >Optional. Use an HTTPS image URL or leave blank for our
            placeholder.</small
          ></label
        >
        <p v-if="error" role="alert" class="error">{{ error }}</p>
        <div class="form-actions">
          <button class="button" :disabled="busy">
            {{
              busy
                ? 'Saving…'
                : editing
                  ? 'Save changes →'
                  : 'Add to collection →'
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
        <p class="muted">{{ product.category_name || 'Your category' }}</p>
        <h3>{{ product.product_name || 'Your product, right here.' }}</h3>
        <strong>{{ money(product.price) }}</strong>
        <p class="preview-note">
          The details you add appear in the collection and product view.
        </p>
      </aside>
    </div>
  </section>
</template>
