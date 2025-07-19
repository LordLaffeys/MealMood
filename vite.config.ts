import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from '@tailwindcss/vite'
import path from "path" // <-- ADD THIS LINE

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwind()],
  resolve: { // <-- ADD THIS ENTIRE BLOCK
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})