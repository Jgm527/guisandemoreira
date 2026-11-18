<template>
  <!-- Pagina informativa: cabecera de texto y una rejilla de tarjetas generada desde datos. -->
  <main class="flex flex-1 flex-col gap-8 rounded-lg bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] sm:p-8">
    <header class="mx-auto max-w-3xl text-center">
      <p class="mb-3 text-xs font-bold tracking-[0.14em] text-[#397c70] uppercase">
        Atención integral
      </p>
      <h1 class="mb-3 text-3xl font-extrabold tracking-tight text-[#183c4d] sm:text-4xl">
        Nuestros servicios
      </h1>
      <p class="text-base leading-7 text-[#64737a]">
        Un equipo preparado para cuidar de ti y de tu familia en cada etapa.
      </p>
    </header>

    <!-- grid-cols-1 en movil, 2 en tablet y 3 en escritorio: patron mobile-first de Tailwind.
         aria-label describe la rejilla completa a quien use lector de pantalla. -->
    <section
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Servicios de la clínica"
    >
      <!-- Una tarjeta por servicio. :key usa el titulo porque es unico en la lista. -->
      <article
        v-for="servicio in servicios"
        :key="servicio.titulo"
        class="overflow-hidden rounded-2xl border border-[#e1e9e7] bg-white shadow-[0_5px_18px_rgba(23,60,70,0.06)] transition hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(23,60,70,0.12)]"
      >
        <img
          class="h-52 w-full object-cover"
          :src="servicio.imagen"
          :alt="servicio.textoAlternativo"
          loading="lazy"
        >
        <div class="p-5">
          <h2 class="mb-2 text-xl font-bold text-[#183c4d]">
            {{ servicio.titulo }}
          </h2>
          <p class="text-sm leading-6 text-[#64737a]">
            {{ servicio.descripcion }}
          </p>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
// Datos de la rejilla. Cada objeto alimenta una tarjeta mediante v-for:
//   titulo           encabezado de la tarjeta.
//   descripcion      texto corto del servicio.
//   imagen           ruta publica de la imagen (se sirve desde public/, no se importa).
//   textoAlternativo alt de la imagen: obligatorio para accesibilidad.
// Al anadir un servicio basta con otro objeto; el template no se toca.
const servicios = [
  {
    titulo: 'Medicina General y Consultas',
    descripcion: 'Atención médica cercana para revisiones, prevención y seguimiento de tu salud.',
    imagen: '/assets/images/01.MedGen.jpg',
    textoAlternativo: 'Atención de medicina general'
  },
  {
    titulo: 'Laboratorio y Análisis Clínicos',
    descripcion: 'Pruebas clínicas y análisis para ayudar a evaluar y cuidar tu estado de salud.',
    imagen: '/assets/images/02LabAnalisis.jpg',
    textoAlternativo: 'Material para análisis clínicos'
  },
  {
    titulo: 'Odontología y Salud Bucodental',
    descripcion: 'Cuidados dentales y prevención para mantener una sonrisa sana.',
    imagen: '/assets/images/03.OdonBuc.jpg',
    textoAlternativo: 'Atención odontológica'
  },
  {
    titulo: 'Fisioterapia y Rehabilitación',
    descripcion: 'Tratamientos personalizados para recuperar movilidad y mejorar tu bienestar.',
    imagen: '/assets/images/04.FisioRehab.jpg',
    textoAlternativo: 'Sesión de fisioterapia y rehabilitación'
  },
  {
    titulo: 'Pediatría y Atención Infantil',
    descripcion: 'Acompañamiento médico para el crecimiento y la salud de los más pequeños.',
    imagen: '/assets/images/05.PedAtInf.webp',
    textoAlternativo: 'Atención pediátrica infantil'
  },
  {
    titulo: 'Diagnóstico por Imagen y Ecografías',
    descripcion: 'Estudios de imagen y ecografías como apoyo para un diagnóstico preciso.',
    imagen: '/assets/images/06.DiagImgEco.jpg',
    textoAlternativo: 'Equipo de diagnóstico por imagen'
  }
]
</script>
