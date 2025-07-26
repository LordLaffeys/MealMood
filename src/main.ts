import { createApp } from 'vue'
import './index.css'
import App from './App.vue'

// Firebase + VueFire
import { VueFire, VueFireAuth } from 'vuefire'
import { initializeApp } from 'firebase/app'

// PrimeVue
import PrimeVue from 'primevue/config'
// import 'primevue/resources/themes/aura-light-green/theme.css' // optional theme

// Firebase config
const firebaseApp = initializeApp({
  apiKey: 'AIzaSyCwY-LSDm9HhL0VhC5WpSSECD3tQ5yaK1c',
  authDomain: 'mealmood-app.firebaseapp.com',
  projectId: 'mealmood-app',
  // ...other config options if needed
})

// Create the Vue app
const app = createApp(App)

// Use PrimeVue
app.use(PrimeVue)

// Use VueFire with Firebase App and Auth
app.use(VueFire, {
  firebaseApp,
  modules: [
    VueFireAuth(), // Enables auth state binding
  ],
})

// Mount the app
app.mount('#app')
