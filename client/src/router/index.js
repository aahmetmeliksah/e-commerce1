import { createRouter, createWebHistory } from 'vue-router'
import { stopScrolling } from '../motion'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('../views/ProductsView.vue') },
    { path: '/products', redirect: '/' },
    {
      path: '/addproduct',
      component: () => import('../components/AddProductComp.vue'),
    },
    {
      path: '/products/:id/edit',
      component: () => import('../components/AddProductComp.vue'),
    },
    { path: '/card', redirect: '/cart' },
    { path: '/cart', component: () => import('../views/CardView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
router.beforeEach(() => {
  stopScrolling()
})
export default router
