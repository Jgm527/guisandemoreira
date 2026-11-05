<template>
  <!--
    PLANTILLA DE COMPONENTE VUE
    Copia este archivo, ponle un nombre relacionado con la pantalla y
    cambia "elemento" por los datos reales de tu aplicación.

    Este ejemplo guarda los elementos solo en memoria. Para guardarlos
    en MongoDB, sigue los pasos y ejemplos de GUIA-CREAR-COMPONENTE.md.
  -->
  <!-- Tailwind combina layout, espaciado, color y sombra sin crear CSS por componente. -->
  <section class="box-border w-full min-w-0 rounded-lg bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
    <!-- titulo es un ref del script; {{ }} muestra su valor reactivo. -->
    <h4>{{ titulo }}</h4>

    <!--
      @submit.prevent llama a guardarElemento() y evita que el navegador
      recargue la página. El botón submit debe estar dentro del formulario.
    -->
    <form class="mb-6 grid gap-4" @submit.prevent="guardarElemento">
      <!-- grid y gap-* son utilidades Tailwind para distribuir label e input. -->
      <div class="grid gap-[0.4rem]">
        <label for="titulo-elemento">Nombre:</label>

        <!--
          v-model enlaza el valor del input con elemento.nombre.
          required aprovecha la validación básica que ofrece el navegador.
        -->
        <input
          id="titulo-elemento"
          class="box-border w-full rounded border border-[var(--color-borde)] p-[0.6rem] font-[inherit]"
          v-model.trim="elemento.nombre"
          type="text"
          required
          placeholder="Escribe un nombre"
        >
      </div>

      <!-- El segundo v-model actualiza elemento.descripcion del mismo objeto reactive. -->
      <div class="campo">
        <label for="descripcion-elemento">Descripción:</label>
        <textarea
          id="descripcion-elemento"
          class="box-border w-full rounded border border-[var(--color-borde)] p-[0.6rem] font-[inherit]"
          v-model.trim="elemento.descripcion"
          rows="3"
          placeholder="Campo opcional"
        />
      </div>

      <!-- type="submit" envía el formulario y ejecuta guardarElemento(). -->
      <button type="submit">
        Guardar
      </button>
    </form>

    <!-- v-if solo muestra este párrafo si la lista está vacía. -->
    <p
      v-if="elementos.length === 0"
      class="mb-0"
    >
      Todavía no hay elementos.
    </p>

    <!--
      v-for crea una fila por elemento.
      :key debe ser un identificador estable y único para que Vue actualice
      la lista correctamente.
    -->
    <!-- Cada item procede de elementos; eliminarElemento se declara en el script setup. -->
    <ul
      v-else
      class="grid list-none gap-3 p-0"
    >
      <li
        v-for="item in elementos"
        :key="item.id"
        class="flex items-center justify-between gap-4 rounded border border-[var(--color-borde)] p-3"
      >
        <div>
          <strong>{{ item.nombre }}</strong>

          <!-- v-if evita mostrar la descripción cuando está vacía. -->
          <p v-if="item.descripcion" class="mb-0">
            {{ item.descripcion }}
          </p>
        </div>

        <!--
          @click ejecuta la función al pulsar el botón.
          type="button" evita que este botón envíe el formulario.
        -->
        <button
          type="button"
          class="flex-none"
          :aria-label="`Eliminar ${item.nombre}`"
          @click="eliminarElemento(item.id)"
        >
          Eliminar
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
// Importa solo las primitivas de Vue que necesita este ejemplo local.
import { computed, reactive, ref } from "vue"

// Titulo mostrado en la cabecera; ref permite cambiarlo sin volver a renderizar a mano.
const titulo = ref("Plantilla de componente")

// Modelo del formulario; reactive hace que cada propiedad pueda enlazarse con v-model.
const elemento = reactive({
  nombre: "",
  descripcion: ""
})

// Lista local de elementos: al no usar una API, se vacia al recargar la pagina.
const elementos = ref([])

// Total derivado de la lista; se recalcula automaticamente cuando cambia elementos.
const totalElementos = computed(() => elementos.value.length)

// Agrega una copia del formulario a la lista y deja el formulario listo para otra alta.
function guardarElemento() {
  // trim limpia espacios sobrantes; el formulario ya requiere un nombre.
  elementos.value.push({
    id: crypto.randomUUID(),
    nombre: elemento.nombre,
    descripcion: elemento.descripcion
  })

  // Reinicia los campos después de guardar.
  elemento.nombre = ""
  elemento.descripcion = ""

  // Ejemplo de cómo leer un ref en el script.
  console.log(`Elementos guardados: ${totalElementos.value}`)
}

// Elimina de la lista local el elemento que coincide con el identificador recibido.
function eliminarElemento(id) {
  // filter crea una lista nueva sin el elemento seleccionado.
  elementos.value = elementos.value.filter((item) => item.id !== id)
}
</script>
