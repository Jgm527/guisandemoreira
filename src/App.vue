<template>
  <div id="app">
    <!-- Aquí se carga el componente principal DE MOMENTO -->
    <NavBar></NavBar>
    <router-view />
    <FooTer></FooTer>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import FooTer from './components/FooTer.vue'
</script>

<style>
/* ============================================================
   ESTILOS DE LA APP (componente raíz)
   ============================================================
   Este bloque NO lleva "scoped": está pensado únicamente para
   el contenedor #app, que es el marco general de la aplicación.

   Nota: #app es el mismo <div> que se define en index.html y
   donde main.js monta la aplicación.
   ------------------------------------------------------------
   Todo lo demás (colores, tipografía y fondo del body) ya está
   centralizado en src/style.css, que se importa en main.js.
   ============================================================ */

/* Contenedor principal: centrado y adaptable al ancho de la ventana. */
#app {
  width: min(96vw, 1600px);
  max-width: none;
  min-height: 100vh;         /* la app ocupa al menos todo el alto */
  margin: 0 auto;            /* centra el contenedor horizontalmente */
  padding: 1rem 0;           /* respiro arriba y abajo (prepara futuro footer) */
  display: flex;
  flex-direction: column;
}
</style>