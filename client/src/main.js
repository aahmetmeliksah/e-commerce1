import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import AppIcon from './components/AppIcon.vue'
createApp(App).component('AppIcon', AppIcon).use(router).mount('#app')
