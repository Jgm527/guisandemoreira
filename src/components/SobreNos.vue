<template>
  <!-- Pagina estatica: sin estado ni peticiones, solo estructura y texto. -->
  <main class="flex-1 rounded-lg bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] sm:p-10">
    <section class="mx-auto max-w-3xl" aria-labelledby="sobre-nos-titulo">
      <p class="mb-3 text-xs font-bold tracking-[0.14em] text-[#397c70] uppercase">
        XestiónApp
      </p>
      <h1 id="sobre-nos-titulo" class="mb-5 text-3xl font-bold tracking-tight text-[#183c4d] sm:text-4xl">
        Sobre nosotros
      </h1>
      <!-- space-y-4 separa los parrafos sin anadir margenes a mano. -->
      <div class="space-y-4 text-base leading-7 text-[#52636b]">
        <p>
          XestiónApp es una herramienta pensada para ayudar a las clínicas a organizar su trabajo diario.
          Reúne en un mismo espacio la gestión de pacientes, profesionales y citas, para que la información
          importante esté siempre a mano.
        </p>
        <p>
          Queremos que las tareas administrativas sean más sencillas y que los equipos puedan dedicar más
          tiempo a lo que realmente importa: ofrecer una atención cercana y de calidad. Por eso apostamos
          por una interfaz clara, práctica y fácil de utilizar.
        </p>
      </div>
    </section>
  </main>
</template>
