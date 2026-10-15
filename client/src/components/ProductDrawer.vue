<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { api, money } from '../api'
import { addToCart } from '../cart'
import { revealDialog, hideDialog } from '../motion'
const props = defineProps({ product: Object })
const emit = defineEmits(['close', 'removed'])
const dialog = ref(null),
  busy = ref(false),
  error = ref(''),
  message = ref(''),
  confirming = ref(false)
let previous
let entrance
const closing = ref(false)
async function close() {
  if (busy.value || closing.value) return
  closing.value = true
  entrance?.stop()
  await hideDialog(dialog.value)
  emit('close')
}
onMounted(() => {
  previous = document.activeElement
  dialog.value.showModal()
  entrance = revealDialog(dialog.value)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  entrance?.stop()
  document.body.style.overflow = ''
  previous?.focus()
})
function add() {
  message.value = addToCart(props.product)
    ? 'Added to your bag.'
    : 'All available stock is already in your bag.'
}
async function remove() {
  busy.value = true
  error.value = ''
  try {
    await api('/products/' + props.product.id, { method: 'DELETE' })
    emit('removed', props.product.id)
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <dialog
    ref="dialog"
    class="product-dialog"
    aria-labelledby="product-title"
    @cancel.prevent="close"
    @click="$event.target === dialog && close()"
  >
    <div class="dialog-inner">
      <button
        class="close-button"
        :disabled="busy"
        aria-label="Close product details"
        @click="close"
      >
        <AppIcon name="close" />
      </button>
      <div class="detail-art">
        <img
          :src="product.img_url || '/images/placeholder.svg'"
          :alt="product.product_name"
          @error="$event.target.src = '/images/placeholder.svg'"
        />
      </div>
      <div class="detail-copy">
        <p class="eyebrow">{{ product.category_name }}</p>
        <h2 id="product-title">{{ product.product_name }}</h2>
        <p class="detail-price">{{ money(product.price) }}</p>
        <p class="description">{{ product.product_description }}</p>
        <p class="availability">
          <span></span
          >{{
            Number(product.quantity)
              ? product.quantity + ' in stock'
              : 'Currently sold out'
          }}
        </p>
        <button
          class="button full"
          :disabled="!Number(product.quantity) || busy"
          @click="add"
        >
          <AppIcon name="bag" />
          {{ Number(product.quantity) ? 'Add to bag' : 'Sold out' }}
        </button>
        <p v-if="message" class="notice" role="status">
          {{ message }}
          <router-link to="/cart" @click="emit('close')"
            >View bag →</router-link
          >
        </p>
        <div class="management">
          <span>Manage this product</span
          ><router-link
            :to="'/products/' + product.id + '/edit'"
            @click="emit('close')"
            ><AppIcon name="edit" /> Edit</router-link
          ><button :disabled="busy" @click="confirming = true">
            <AppIcon name="trash" /> Delete
          </button>
        </div>
        <div v-if="confirming" class="delete-confirm">
          <p>
            <strong>Delete this product?</strong><br />This removes it from the
            collection and cannot be undone.
          </p>
          <div class="button-row">
            <button class="button danger" :disabled="busy" @click="remove">
              {{ busy ? 'Deleting…' : 'Delete product' }}</button
            ><button
              class="button secondary"
              :disabled="busy"
              @click="confirming = false"
            >
              Keep product
            </button>
          </div>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>
    </div>
  </dialog>
</template>
