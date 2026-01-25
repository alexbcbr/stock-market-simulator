import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Dynamically load CSS based on VITE_LAYOUT environment variable
const layout = import.meta.env.VITE_LAYOUT;

if (layout === 'gray') {
  import('./assets/gray.css');
} else {
  import('./assets/blue.css');
}

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
