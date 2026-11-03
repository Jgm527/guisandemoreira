<template>
  <footer class="mt-auto flex items-center justify-center gap-20 bg-[#1b4965] px-24 py-[0.2rem] text-center text-[0.9rem] text-white max-[768px]:flex-col max-[768px]:gap-4 max-[768px]:px-4">
    <ul class="m-0 mt-[6px] block cursor-pointer list-none p-0 text-[#f9d342]">
      <router-link
        to="/avisolegal"
        target="_blank"
        class="text-[#f9d342] no-underline transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d]"
      >
        Aviso Legal
      </router-link>
    </ul>
    <p>© {{ new Date().getFullYear() }} XestiónApp — Desenvolvido en Vue 3</p>
  </footer>
</template>

<script setup></script>
