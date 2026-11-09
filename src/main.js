// Crea la instancia principal de Vue y registra los recursos globales de la aplicacion.
import { createApp } from 'vue'
// Pinia es la libreria oficial de Vue para el manejo del estado global de la aplicacion.
import { createPinia } from 'pinia'
// Carga los estilos globales y las utilidades de Tailwind antes de montar la interfaz.
import './style.css'
// App.vue contiene la estructura comun que se comparte entre todas las rutas.
import App from './App.vue'
// El router decide que pantalla aparece dentro de <router-view>.
import router from './router'

// Se crea la instancia de Pinia para el manejo del estado global de la aplicacion.
const pinia = createPinia()

// Instala la navegacion y pinia y renderiza la aplicacion dentro del elemento #app de index.html.
createApp(App).use(router).use(pinia).mount('#app')
