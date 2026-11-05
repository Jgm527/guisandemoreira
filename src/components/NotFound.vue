<template>
  <!-- Vista de reserva para cualquier URL que no tenga una ruta registrada. -->
  <h2>A páxina que buscas non se atopa</h2>
  <!-- Ilustracion estatica incluida en los assets del frontend. -->
  <!-- h-* y w-* son utilidades Tailwind para fijar el tamano de la ilustracion. -->
  <img src="../assets/404.png" class="h-[400px] w-[400px]" />
</template>

<!-- No hay logica de estado: esta vista solo muestra un mensaje y una imagen. -->
<script setup></script>
