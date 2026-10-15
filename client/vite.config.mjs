import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  server: {
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
