import { createRouter, createWebHistory } from "vue-router";

import Inicio from '../components/Inicio.vue'
import XestionPacientes from '../components/XestionPacientes.vue'
import SobreNos from '../components/SobreNos.vue'
import AvisoLegal from '../components/AvisoLegal.vue'
import NotFound from '../components/NotFound.vue'

const routes = [
    { path: '/', name: 'Inicio', component: Inicio },
    { path: '/XestionPacientes', name: 'XestionPacientes', component: XestionPacientes },
    { path: '/SobreNos', name: 'SobreNos', component: SobreNos },
    { path: '/avisoLegal', name: AvisoLegal, component: AvisoLegal},
    { path: '/:pathMatch(.*)', name: 'NotFound', component: NotFound }
]

const router = createRouter ({
    history: createWebHistory(),
    routes
})

export default router