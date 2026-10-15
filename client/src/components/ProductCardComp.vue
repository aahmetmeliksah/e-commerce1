<script setup>
import { money } from '../api'
defineProps({ product: Object })
defineEmits(['view-product'])
</script>
<template>
  <article class="product-card">
    <button
      class="product-art"
      @click="$emit('view-product', product)"
      :aria-label="'View ' + product.product_name"
    >
      <span v-if="Number(product.quantity) === 0" class="stock-label"
        >Sold out</span
      >
      <img
        :src="product.img_url || '/images/placeholder.svg'"
        :alt="product.product_name"
        loading="lazy"
        @error="$event.target.src = '/images/placeholder.svg'"
      />
      <span class="art-action" aria-hidden="true"
        ><AppIcon name="external"
      /></span>
    </button>
    <div class="card-meta">
      <span>{{ product.category_name }}</span
      ><span>{{
        Number(product.quantity)
          ? product.quantity + ' available'
          : 'Out of stock'
      }}</span>
    </div>
    <div class="card-heading">
      <h3>
        <button @click="$emit('view-product', product)">
          {{ product.product_name }}
        </button>
      </h3>
      <strong>{{ money(product.price) }}</strong>
    </div>
  </article>
</template>
