<template>
  <!-- Portada: una sola seccion hero con video de fondo y dos llamadas a la accion. -->
  <main class="flex flex-1 flex-col gap-8 rounded-lg bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] sm:gap-10 sm:p-8">
    <section
      class="relative isolate flex min-h-[clamp(27rem,55vh,39rem)] items-center overflow-hidden rounded-2xl bg-[#193b4c] text-white sm:rounded-3xl"
      aria-labelledby="portada-titulo"
    >
      <!-- Video decorativo: sin controles ni sonido, con poster para el primer segundo.
           aria-hidden evita que el lector de pantalla lo anuncie. -->
      <video
        class="absolute inset-0 z-0 h-full w-full object-cover object-[center_42%]"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        poster="/assets/images/portada.svg"
        aria-hidden="true"
      >
        <source
          :src="clinicVideoUrl"
          type="video/mp4"
        >
      </video>
      <div
        class="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#0a2330]/90 via-[#0a2330]/70 to-[#0a2330]/15"
        aria-hidden="true"
      />

      <div class="relative z-20 max-w-4xl px-6 py-14 sm:px-12 sm:py-20 lg:px-24">
        <p class="mb-4 flex items-center gap-3 text-xs font-bold tracking-[0.14em] text-[#d3eee7] uppercase">
          <span
            class="size-2 rounded-full bg-[#9de0c7] ring-4 ring-[#9de0c7]/20"
            aria-hidden="true"
          />
          Xestión clínica
        </p>
        <h1
          id="portada-titulo"
          class="mb-5 max-w-[13ch] text-5xl leading-[1.02] font-extrabold tracking-[-0.055em] sm:text-6xl lg:text-7xl"
        >
          La clínica, organizada. La atención, en buenas manos.
        </h1>
        <p class="max-w-xl text-base leading-7 text-white/90 sm:text-lg">
          Un espacio sencillo para coordinar citas, pacientes y profesionales.
          Menos tareas dispersas; más tiempo para cuidar.
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <RouterLink
            class="inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#d5f0e5] px-6 py-3 font-bold text-[#173c46] no-underline transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d]"
            to="/XestionPacientes"
          >
            Gestionar pacientes
            <span aria-hidden="true">→</span>
          </RouterLink>
          <RouterLink
            class="inline-flex min-h-13 items-center justify-center rounded-full border border-white/60 px-6 py-3 font-bold text-white no-underline transition hover:border-white hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#ffe66d]"
            to="/XestionDoctores"
          >
            Gestionar doctores
          </RouterLink>
        </div>
      </div>

      <div class="absolute right-5 bottom-5 z-20 flex items-center gap-3 text-sm text-white/90 sm:right-10 sm:bottom-7">
        <span>Una gestión más clara, cada día</span>
      </div>
    </section>

    <!-- <section
      class="px-2 sm:px-6 lg:px-10"
      aria-labelledby="modulos-titulo"
    >
      <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-xs font-bold tracking-[0.14em] text-[#397c70] uppercase">
            Todo a mano
          </p>
          <h2
            id="modulos-titulo"
            class="text-2xl font-bold tracking-tight text-[#183c4d] sm:text-3xl"
          >
            ¿Qué necesitas gestionar?
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-6 text-[#64737a]">
          Accede directamente a las herramientas de tu clínica.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RouterLink
          class="group flex min-h-42 items-start gap-4 rounded-2xl border border-[#e1e9e7] bg-white p-5 text-inherit no-underline shadow-[0_5px_18px_rgba(23,60,70,0.04)] transition hover:-translate-y-1 hover:border-[#a9cec2] hover:shadow-[0_12px_24px_rgba(23,60,70,0.09)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#1b4965]"
          to="/citas"
        >
          <span
            class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e6eff9] text-xl text-[#376c9c]"
            aria-hidden="true"
          >▦</span>
          <span class="flex flex-col items-start gap-2">
            <span class="font-bold text-[#183c4d]">Citas y agenda</span>
            <span class="text-sm leading-5 text-[#64737a]">Organiza las consultas y consulta la agenda.</span>
            <span class="mt-1 inline-flex items-center gap-2 text-sm font-bold text-[#28695e]">
              Ir a citas <span
                class="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >→</span>
            </span>
          </span>
        </RouterLink>

        <RouterLink
          class="group flex min-h-42 items-start gap-4 rounded-2xl border border-[#e1e9e7] bg-white p-5 text-inherit no-underline shadow-[0_5px_18px_rgba(23,60,70,0.04)] transition hover:-translate-y-1 hover:border-[#a9cec2] hover:shadow-[0_12px_24px_rgba(23,60,70,0.09)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#1b4965]"
          to="/XestionPacientes"
        >
          <span
            class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e4f1ed] text-xl text-[#28695e]"
            aria-hidden="true"
          >♧</span>
          <span class="flex flex-col items-start gap-2">
            <span class="font-bold text-[#183c4d]">Pacientes</span>
            <span class="text-sm leading-5 text-[#64737a]">Gestiona fichas y datos de las personas atendidas.</span>
            <span class="mt-1 inline-flex items-center gap-2 text-sm font-bold text-[#28695e]">
              Ver pacientes <span
                class="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >→</span>
            </span>
          </span>
        </RouterLink>

        <RouterLink
          class="group flex min-h-42 items-start gap-4 rounded-2xl border border-[#e1e9e7] bg-white p-5 text-inherit no-underline shadow-[0_5px_18px_rgba(23,60,70,0.04)] transition hover:-translate-y-1 hover:border-[#a9cec2] hover:shadow-[0_12px_24px_rgba(23,60,70,0.09)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#1b4965]"
          to="/XestionDoctores"
        >
          <span
            class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f2eafb] text-xl text-[#7651a4]"
            aria-hidden="true"
          >✚</span>
          <span class="flex flex-col items-start gap-2">
            <span class="font-bold text-[#183c4d]">Equipo médico</span>
            <span class="text-sm leading-5 text-[#64737a]">Mantén al día la información de los profesionales.</span>
            <span class="mt-1 inline-flex items-center gap-2 text-sm font-bold text-[#28695e]">
              Ver profesionales <span
                class="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >→</span>
            </span>
          </span>
        </RouterLink>
      </div>
    </section> -->
  </main>
  <!--
    Bloque de tarjetas de acceso rapido comentado: se quito porque la portada ya enlaza
    a pacientes y doctores desde el hero. Para recuperarlo, quita los delimitadores del
    comentario y comprueba que cada RouterLink apunta a una ruta existente en src/router.
  -->
</template>

<script setup>
// Ruta del video de portada publicada desde public/: Vite la sirve tal cual, sin procesarla.
// Si el fichero no existe, el navegador muestra el poster definido en el <video>.
const clinicVideoUrl = '/assets/videos/clinica.mp4'
</script>
