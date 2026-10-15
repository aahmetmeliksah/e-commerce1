<script setup>
import { computed } from 'vue'
import { cart } from './cart'
const count = computed(() => cart.reduce((n, p) => n + p.count, 0))
</script>
<template>
  <a class="skip" href="#main">Skip to content</a>
  <div class="announcement">
    Thoughtful finds. Everyday favourites. <span>— A portfolio store demo</span>
  </div>
  <header class="site-header">
    <router-link class="brand" to="/" aria-label="Form and Field home"
      ><span class="brand-mark">f.</span>form & field<span class="brand-dot"
        >®</span
      ></router-link
    >
    <nav aria-label="Main navigation">
      <router-link to="/">Collection</router-link
      ><router-link to="/addproduct"
        >Add product <span aria-hidden="true">↗</span></router-link
      ><router-link to="/cart" class="cart-link"
        >Bag <span class="count">{{ count }}</span></router-link
      >
    </nav>
  </header>
  <main id="main" tabindex="-1"><router-view /></main>
  <footer class="site-footer">
    <div>
      <router-link to="/" class="brand">form & field.</router-link>
      <p>Good things for the everyday.</p>
    </div>
    <p>
      Designed to explore. Built to learn.<br /><small
        >Vue + Node + PostgreSQL · No real payments</small
      >
    </p>
    <a href="#main">Back to top ↑</a>
  </footer>
</template>
<style>
@import './style.css';
</style>
