import { createRouter, createWebHistory } from "vue-router";

// Importa las pantallas que se muestran en el espacio <router-view> de App.vue.
import Inicio from '../components/Inicio.vue'
import Servicios from '../components/Servicios.vue'
import XestionPacientes from '../components/XestionPacientes.vue'
import XestionDoctores from '../components/XestionDoctores.vue'
import Citas from '../components/Citas.vue'
import SobreNos from '../components/SobreNos.vue'
import AvisoLegal from '../components/AvisoLegal.vue'
import PoliticaPrivacidad from '../components/PoliticaPrivacidad.vue'
import NotFound from '../components/NotFound.vue'

// Cada ruta relaciona una URL con un nombre estable y un componente de pantalla.
const routes = [
    { path: '/', name: 'Inicio', component: Inicio },
    { path: '/servicios', name: 'Servicios', component: Servicios },
    { path: '/XestionPacientes', name: 'XestionPacientes', component: XestionPacientes },
    { path: '/XestionDoctores', name: 'XestionDoctores', component: XestionDoctores },
    { path: '/citas', name: 'Citas', component: Citas},
    { path: '/SobreNos', name: 'SobreNos', component: SobreNos },
    { path: '/avisoLegal', name: 'AvisoLegal', component: AvisoLegal},
    { path: '/politica-privacidad', name: 'PoliticaPrivacidad', component: PoliticaPrivacidad },
    { path: '/:pathMatch(.*)', name: 'NotFound', component: NotFound }
]

// createWebHistory utiliza rutas limpias; el servidor debe servir index.html para ellas.
const router = createRouter ({
    history: createWebHistory(),
    routes
})

// main.js instala este router en la aplicacion Vue.
export default router