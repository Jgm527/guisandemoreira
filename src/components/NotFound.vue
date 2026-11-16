<template>
  <main class="flex flex-1 items-center justify-center rounded-lg bg-white p-6 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)] sm:p-10">
    <section class="flex max-w-2xl flex-col items-center" aria-labelledby="error-titulo">
      <img
        src="../assets/404.png"
        class="mb-6 h-auto w-full max-w-[400px]"
        alt="Ilustración de página no encontrada"
      >
      <h1 id="error-titulo" class="mb-3 text-2xl font-bold text-[#183c4d] sm:text-3xl">
        A páxina que buscas non se atopa
      </h1>
      <p class="mb-6 max-w-lg leading-7 text-[#64737a]">
        É posible que o enderezo cambiase ou que a páxina xa non estea dispoñible.
        Podes volver ao inicio e continuar desde alí.
      </p>
      <RouterLink
        to="/"
        class="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1b4965] px-6 py-3 font-bold text-white no-underline transition hover:bg-[#153c54] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#ffe66d]"
      >
        Volver al inicio
      </RouterLink>
    </section>
  </main>
</template>
