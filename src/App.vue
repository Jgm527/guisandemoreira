<template>
  <div
    id="app"
    class="mx-auto flex min-h-screen w-[min(96vw,1600px)] max-w-none flex-col py-4"
  >
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