<template>
  <!-- Estructura persistente: barra superior, pantalla seleccionada y pie de pagina. -->
  <!-- Tailwind centra el contenedor, aplica un ancho adaptable y ocupa al menos toda la pantalla. -->
  <div
    id="app"
    class="mx-auto flex min-h-screen w-[min(96vw,1600px)] max-w-none flex-col py-4"
  >
    <!-- El menu y el pie permanecen; router-view cambia segun la ruta actual. -->
    <NavBar></NavBar>
    <router-view />
    <FooTer></FooTer>
  </div>
</template>

<script setup>
// Componentes de interfaz compartidos por todas las pantallas.
import NavBar from './components/NavBar.vue'
import FooTer from './components/FooTer.vue'
</script>