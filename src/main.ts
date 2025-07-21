import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import PrimeVue from 'primevue/config';
// import 'primevue/resources/themes/aura-light-green/theme.css';

// createApp(App).mount('#app')
// import './assets/main.css'
//  // Import a PrimeVue theme

const app = createApp(App)

app.use(PrimeVue); // Use PrimeVue

app.mount('#app')