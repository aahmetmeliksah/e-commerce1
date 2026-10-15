<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { cart } from './cart'
import { scrollToSection } from './motion'
const count = computed(() => cart.reduce((n, p) => n + p.count, 0))
const showBackTop = ref(false)
const trackScroll = () => {
  showBackTop.value = window.scrollY > 600
}
onMounted(() => {
  window.addEventListener('scroll', trackScroll, { passive: true })
  trackScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', trackScroll))
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
        ><AppIcon name="plus" /> Add product</router-link
      ><router-link to="/cart" class="cart-link"
        ><AppIcon name="bag" /> Bag
        <span class="count">{{ count }}</span></router-link
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
    <a href="#main" @click.prevent="scrollToSection('#main')"
      >Back to top <AppIcon name="up"
    /></a>
  </footer>
  <Transition name="backtop"
    ><button
      v-if="showBackTop"
      class="floating-back-top"
      aria-label="Back to top"
      @click="scrollToSection('#main')"
    >
      <AppIcon name="up" :size="20" /></button
  ></Transition>
</template>
<style>
@import './style.css';
</style>
