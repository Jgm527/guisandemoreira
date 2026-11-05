import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Vite transforma componentes Vue y procesa las clases de Tailwind durante desarrollo/build.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
