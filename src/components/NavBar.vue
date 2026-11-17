<template>
  <!-- Navegacion principal; RouterLink cambia de pantalla sin recargar la aplicacion. -->
  <nav class="flex items-center justify-between bg-[#1b4965] px-24 py-[0.1rem] text-white">
    <div class="text-base leading-[normal] font-bold">XestiónApp</div>

    <!-- isOpen del script controla el menu movil y se refleja tambien en aria-expanded. -->
    <button
      class="hidden border-0 bg-transparent text-2xl leading-[normal] text-white max-[768px]:block"
      type="button"
      aria-label="Abrir"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      ☰
    </button>

    <!-- max-[768px]:* aplica cambios responsive; :class muestra u oculta la lista con isOpen. -->
    <ul
      :class="isOpen ? 'max-[768px]:flex' : 'max-[768px]:hidden'"
      class="m-0 flex list-none gap-[0.8rem] p-0 max-[768px]:absolute max-[768px]:right-0 max-[768px]:top-[50px] max-[768px]:flex-col max-[768px]:bg-[#1b4965] max-[768px]:p-4"
    >
      <li>
        <RouterLink class="font-medium text-white no-underline transition-colors hover:text-[#ffe66d] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d] [&.router-link-active]:border-b-[0.2rem] [&.router-link-active]:border-[#ffe66d]" to="/">Inicio</RouterLink>
      </li>
      <li>
        <RouterLink
          class="font-medium text-white no-underline transition-colors hover:text-[#ffe66d] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d] [&.router-link-active]:border-b-[0.2rem] [&.router-link-active]:border-[#ffe66d]"
          to="/servicios"
        >
          Servicios
        </RouterLink>
      </li>
      <li>
        <RouterLink class="font-medium text-white no-underline transition-colors hover:text-[#ffe66d] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d] [&.router-link-active]:border-b-[0.2rem] [&.router-link-active]:border-[#ffe66d]" to="/xestionPacientes">Pacientes</RouterLink>
      </li>
      <li>
        <RouterLink class="font-medium text-white no-underline transition-colors hover:text-[#ffe66d] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d] [&.router-link-active]:border-b-[0.2rem] [&.router-link-active]:border-[#ffe66d]" to="/xestionDoctores">Doctores</RouterLink>
      </li>
      <li>
        <RouterLink class="font-medium text-white no-underline transition-colors hover:text-[#ffe66d] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d] [&.router-link-active]:border-b-[0.2rem] [&.router-link-active]:border-[#ffe66d]" to="/citas">Citas</RouterLink>
      </li>
      <li>
        <RouterLink class="font-medium text-white no-underline transition-colors hover:text-[#ffe66d] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d] [&.router-link-active]:border-b-[0.2rem] [&.router-link-active]:border-[#ffe66d]" to="/sobrenos">Sobre nós</RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from "vue"

// Controla la visibilidad del menu movil y se enlaza al boton y a la lista de enlaces.
const isOpen = ref(false)
</script>
