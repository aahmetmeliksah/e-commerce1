<script setup>
import { computed, ref, onMounted } from 'vue'
import { cart, removeFromCart, syncCart } from '../cart'
import { api, money } from '../api'
import { useAutoAnimate } from '@formkit/auto-animate/vue'
const [bagList] = useAutoAnimate({ duration: 250 })
const total = computed(() =>
    cart.reduce((n, p) => n + Number(p.price) * p.count, 0)
  ),
  error = ref(''),
  loading = ref(true)
async function refresh() {
  loading.value = true
  error.value = ''
  try {
    syncCart(await api('/products'))
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
function change(item, amount) {
  item.count = Math.max(1, Math.min(Number(item.quantity), item.count + amount))
}
onMounted(refresh)
</script>
<template>
  <section class="bag-page">
    <router-link class="back-link" to="/"
      ><AppIcon name="left" /> Keep exploring</router-link
    >
    <p class="eyebrow">YOUR EVERYDAY, ELEVATED</p>
    <h1>A bag of good things.</h1>
    <p v-if="loading" role="status">
      Checking the latest prices and availability…
    </p>
    <div v-else-if="error" class="error" role="alert">
      {{ error }} <button @click="refresh">Try again</button>
    </div>
    <div v-if="!loading && !error && cart.length" class="bag-layout">
      <div ref="bagList">
        <article v-for="item in cart" :key="item.id" class="bag-item">
          <img
            :src="item.img_url || '/images/placeholder.svg'"
            :alt="item.product_name"
            @error="$event.target.src = '/images/placeholder.svg'"
          />
          <div class="bag-item-copy">
            <p class="eyebrow">{{ item.category_name }}</p>
            <h3>{{ item.product_name }}</h3>
            <p>{{ money(item.price) }}</p>
            <div class="quantity-control">
              <button
                @click="change(item, -1)"
                :disabled="item.count === 1"
                :aria-label="'Decrease ' + item.product_name + ' quantity'"
              >
                <AppIcon name="minus" :size="16" /></button
              ><span>{{ item.count }}</span
              ><button
                @click="change(item, 1)"
                :disabled="item.count >= Number(item.quantity)"
                :aria-label="'Increase ' + item.product_name + ' quantity'"
              >
                <AppIcon name="plus" :size="16" />
              </button>
            </div>
          </div>
          <div class="bag-item-end">
            <strong>{{ money(Number(item.price) * item.count) }}</strong
            ><button
              class="remove-item"
              @click="removeFromCart(item.id)"
              :aria-label="'Remove ' + item.product_name + ' from bag'"
            >
              <AppIcon name="trash" /> Remove
            </button>
          </div>
        </article>
      </div>
      <aside class="bag-summary">
        <p class="eyebrow">THE GOOD THINGS ADD UP</p>
        <h2>Bag summary</h2>
        <div>
          <span>Subtotal</span><strong>{{ money(total) }}</strong>
        </div>
        <p>
          This is a portfolio demo. Your bag is saved in this browser; checkout
          and payments are not available.
        </p>
        <router-link class="button full" to="/"
          >Continue exploring →</router-link
        >
      </aside>
    </div>
    <div v-else-if="!loading && !error" class="empty">
      <AppIcon name="bag" :size="48" />
      <h2>Room for something good.</h2>
      <p>Your bag is empty. Find an everyday favourite to make it yours.</p>
      <router-link class="button" to="/">Explore the collection →</router-link>
    </div>
  </section>
</template>
