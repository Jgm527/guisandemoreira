<template>
  <div id="app">
    <!-- Aquí se carga el componente principal DE MOMENTO -->
    <XestionUsuarios />
  </div>
</template>

<script setup>
import XestionUsuarios from './components/XestionUsuarios.vue'
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

/* Contenedor principal: centrado, con un ancho máximo del 80%
   de la pantalla y ocupando todo el alto como mínimo. */
#app {
  max-width: 80vw;           /* ancho máximo de la aplicación */
  min-height: 100vh;         /* la app ocupa al menos todo el alto */
  margin: 0 auto;            /* centra el contenedor horizontalmente */
  padding: 1rem 0;           /* respiro arriba y abajo (prepara futuro footer) */
  display: flex;
  flex-direction: column;
}
</style>