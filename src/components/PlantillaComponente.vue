<template>
  <!--
    PLANTILLA / CATALOGO DE ELEMENTOS VUE
    Copia este archivo, renombra "registro" con tu entidad y elimina los
    campos o bloques que tu pantalla no necesite. Los textos entre corchetes
    como [NOMBRE DE LA ENTIDAD] son placeholders para reemplazar.

    Este ejemplo implementa altas, ediciones, busqueda y borrado en memoria.
    No guarda en MongoDB: conecta las funciones indicadas en el script con un
    modulo de src/api/ cuando quieras persistir los datos.
  -->
  <section class="box-border w-full min-w-0 rounded-lg bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] sm:p-8">
    <!--
      Esta sección es la base reutilizable para cualquier pantalla CRUD.
      1) Cambia el texto del título por el nombre real de la entidad.
      2) Mantén la estructura general: formulario + buscador + tabla.
      3) Si la pantalla no necesita un campo, elimínalo en vez de copiarlo sin uso.
      4) Si necesitas persistencia real, conecta las funciones del script a src/api/.
    -->
    <h4 class="mb-4 rounded bg-[#1b4965] px-3 py-2 font-semibold text-white">
      {{ titulo }}
    </h4>

    <!--
      @submit.prevent ejecuta guardarRegistro() sin recargar la pagina.
      registro es el objeto reactive enlazado a los controles con v-model.
    -->
    <form
      class="mb-8 grid gap-4"
      @submit.prevent="guardarRegistro"
    >
      <!-- Campo de texto obligatorio; .trim elimina espacios al guardar el valor. -->
      <div class="grid gap-2">
        <label for="registro-nombre">[NOMBRE DEL CAMPO OBLIGATORIO]</label>
        <input
          id="registro-nombre"
          v-model.trim="registro.nombre"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="text"
          required
          maxlength="80"
          placeholder="[Ej.: nombre o titulo]"
        >
      </div>

      <!-- Ejemplos de campos de contacto y fecha; quita los que no use tu entidad. -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="grid gap-2">
          <label for="registro-correo">[CORREO OPCIONAL]</label>
          <input
            id="registro-correo"
            v-model.trim="registro.correo"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="email"
            placeholder="nombre@ejemplo.com"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-telefono">[TELEFONO OPCIONAL]</label>
          <input
            id="registro-telefono"
            v-model.trim="registro.telefono"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="tel"
            placeholder="[Ej.: 600123456]"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-fecha">[FECHA OPCIONAL]</label>
          <input
            id="registro-fecha"
            v-model="registro.fecha"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="date"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-hora">[HORA OPCIONAL]</label>
          <input
            id="registro-hora"
            v-model="registro.hora"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="time"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-cantidad">[CANTIDAD O EDAD]</label>
          <input
            id="registro-cantidad"
            v-model.number="registro.cantidad"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="number"
            min="0"
            placeholder="[Ej.: 1]"
          >
        </div>

        <div class="grid gap-2">
          <label for="registro-enlace">[ENLACE WEB OPCIONAL]</label>
          <input
            id="registro-enlace"
            v-model.trim="registro.enlace"
            class="w-full rounded border border-[var(--color-borde)] p-2"
            type="url"
            placeholder="https://ejemplo.com"
          >
        </div>

        <!-- Select: cambia las opciones por las de tu entidad o cargalas desde una API. -->
        <div class="grid gap-2">
          <label for="registro-categoria">[CATEGORIA]</label>
          <select
            id="registro-categoria"
            v-model="registro.categoria"
            class="w-full rounded border border-[var(--color-borde)] bg-white p-2"
          >
            <option value="">
              [Selecciona una opcion]
            </option>
            <option value="opcion-1">
              [Opcion 1]
            </option>
            <option value="opcion-2">
              [Opcion 2]
            </option>
          </select>
        </div>
      </div>

      <!-- Los ficheros no admiten v-model: lee el evento change en el script. -->
      <div class="grid gap-2">
        <label for="registro-archivo">[ARCHIVO OPCIONAL]</label>
        <input
          id="registro-archivo"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="file"
          @change="seleccionarArchivo"
        >
        <span
          v-if="archivoSeleccionado"
          class="text-sm text-gray-600"
        >
          [Archivo elegido]: {{ archivoSeleccionado.name }}
        </span>
      </div>

      <!-- Radio: comparte v-model para que solo una opcion pueda estar seleccionada. -->
      <fieldset class="grid gap-2">
        <legend>[ESTADO DEL REGISTRO]</legend>
        <label class="flex items-center gap-2">
          <input
            v-model="registro.estado"
            type="radio"
            value="activo"
          >
          [Estado activo]
        </label>
        <label class="flex items-center gap-2">
          <input
            v-model="registro.estado"
            type="radio"
            value="pendiente"
          >
          [Estado pendiente]
        </label>
      </fieldset>

      <!-- Checkbox enlazado a un booleano: util para consentimiento o una opcion si/no. -->
      <label class="flex items-center gap-2">
        <input
          v-model="registro.confirmado"
          type="checkbox"
        >
        [Confirmar o aceptar esta opcion]
      </label>

      <!-- Textarea para texto libre; maxlength limita caracteres en el navegador. -->
      <div class="grid gap-2">
        <label for="registro-descripcion">[DESCRIPCION OPCIONAL]</label>
        <textarea
          id="registro-descripcion"
          v-model.trim="registro.descripcion"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          rows="3"
          maxlength="500"
          placeholder="[Escribe una descripcion]"
        />
      </div>

      <!-- Error reactivo: asigna el mensaje en el catch de las peticiones de tu API. -->
      <p
        v-if="error"
        class="rounded border border-red-300 bg-red-50 p-3 text-red-700"
        role="alert"
      >
        {{ error }}
      </p>

      <!-- v-if y editando cambian las acciones segun se cree o edite el registro. -->
      <div class="flex flex-wrap justify-center gap-3">
        <button
          class="rounded bg-[#1b4965] px-5 py-2 font-semibold text-white hover:bg-[#153c54] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="guardando"
        >
          [GUARDAR]
        </button>
        <button
          v-if="editando"
          class="rounded border border-[var(--color-borde)] px-5 py-2 hover:bg-gray-100"
          type="button"
          @click="limpiarFormulario"
        >
          [CANCELAR]
        </button>
        <button
          v-else
          class="rounded border border-[var(--color-borde)] px-5 py-2 hover:bg-gray-100"
          type="reset"
          @click="limpiarFormulario"
        >
          [LIMPIAR]
        </button>
      </div>
    </form>

    <!-- Filtro local: buscar se enlaza al input y listaFiltrada es un computed del script. -->
    <div class="mb-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <div class="grid gap-2">
        <label for="buscar-registros">[BUSCAR EN LA LISTA]</label>
        <input
          id="buscar-registros"
          v-model.trim="buscar"
          class="w-full rounded border border-[var(--color-borde)] p-2"
          type="search"
          placeholder="[Escribe un nombre o descripcion]"
        >
      </div>
      <p class="text-sm text-gray-600">
        [Total mostrado]: {{ listaFiltrada.length }}
      </p>
    </div>

    <!-- v-if / v-else muestra carga, lista vacia o tabla segun el estado del script. -->
    <p
      v-if="cargando"
      class="py-4 text-center text-gray-600"
    >
      [CARGANDO REGISTROS...]
    </p>
    <p
      v-else-if="listaFiltrada.length === 0"
      class="py-4 text-center text-gray-600"
    >
      [No hay registros que mostrar.]
    </p>
    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-[var(--color-borde)] p-3">
              [NOMBRE]
            </th>
            <th class="border border-[var(--color-borde)] p-3">
              [CONTACTO]
            </th>
            <th class="border border-[var(--color-borde)] p-3">
              [CATEGORIA / ESTADO]
            </th>
            <th class="border border-[var(--color-borde)] p-3">
              [DESCRIPCION]
            </th>
            <th class="border border-[var(--color-borde)] p-3">
              [ACCIONES]
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- v-for recibe cada registro filtrado; usa una clave estable (_id o id). -->
          <tr
            v-for="item in listaFiltrada"
            :key="item.id"
            class="hover:bg-gray-50"
          >
            <td class="border border-[var(--color-borde)] p-3">
              {{ item.nombre }}
              <span
                v-if="item.confirmado"
                class="text-sm text-green-700"
              >[Confirmado]</span>
            </td>
            <td class="border border-[var(--color-borde)] p-3">
              {{ item.correo || item.telefono || "[Sin contacto]" }}
            </td>
            <td class="border border-[var(--color-borde)] p-3">
              {{ item.categoria || "[Sin categoria]" }} · {{ etiquetaEstado(item.estado) }}
            </td>
            <td class="border border-[var(--color-borde)] p-3">
              {{ item.descripcion || "[Sin descripcion]" }}
            </td>
            <td class="border border-[var(--color-borde)] p-3">
              <!-- Los botones pasan el item actual a sus funciones del script. -->
              <div class="flex gap-2">
                <button
                  class="rounded border border-[var(--color-borde)] px-3 py-1 hover:bg-gray-100"
                  type="button"
                  aria-label="[EDITAR]"
                  @click="editarRegistro(item)"
                >
                  [EDITAR]
                </button>
                <button
                  class="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                  type="button"
                  aria-label="[ELIMINAR]"
                  @click="eliminarRegistro(item.id)"
                >
                  [ELIMINAR]
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!--
      Tailwind en breve:
      grid / flex distribuyen elementos; gap-* separa; p-* y m-* ajustan espacios;
      rounded y shadow dan acabado; hover:* cambia el estilo al pasar el raton;
      sm:* adapta el diseño desde el breakpoint sm.
      Para estilos compartidos, consulta src/style.css.
    -->
  </section>
</template>

<script setup>
import { computed, reactive, ref } from "vue"

/*
 * ESTA ES LA BASE DE UN COMPONENTE CRUD EN EL PROYECTO.
 * Sigue este patrón para cualquier nueva pantalla:
 *   1. define el modelo del formulario,
 *   2. prepara la lista base,
 *   3. añade buscador y filtro,
 *   4. crea la lógica de guardar/editar/eliminar,
 *   5. conecta la API cuando la entidad exista en backend.
 *
 * Cuanto más claro y consistente sea el nombre de cada campo, menos errores
 * tendrás al enlazarlo con v-model, con la API y con MongoDB.
 */

// Cambia este texto por el nombre de la pantalla; el template lo muestra con {{ titulo }}.
const titulo = ref("[GESTION DE [NOMBRE DE LA ENTIDAD]]")

// Plantilla de valores del formulario. Ajusta propiedades y tipos a tu modelo/API.
const registroVacio = () => ({
  id: "",
  nombre: "",
  correo: "",
  telefono: "",
  fecha: "",
  hora: "",
  cantidad: null,
  enlace: "",
  categoria: "",
  estado: "activo",
  confirmado: false,
  descripcion: ""
})

// Estado del formulario enlazado a sus inputs mediante v-model.
const registro = reactive(registroVacio())

// En un componente conectado a la API, inicia la lista vacia y llenala en onMounted().
// Los ejemplos locales permiten probar v-for, busqueda y acciones sin iniciar el backend.
const registros = ref([
  {
    id: "ejemplo-1",
    nombre: "[Ejemplo de registro]",
    correo: "ejemplo@correo.test",
    telefono: "",
    fecha: "",
    categoria: "opcion-1",
    estado: "activo",
    confirmado: true,
    descripcion: "[Puedes borrar estos datos de demostracion.]"
  }
])

// Valor enlazado al input type=search para filtrar nombre y descripcion.
const buscar = ref("")
// Estados de interfaz para conectar a una carga asincrona y mostrar errores del backend.
const cargando = ref(false)
const guardando = ref(false)
const error = ref("")
const editando = ref(false)
// Un input file se lee mediante change; no se puede enlazar con v-model como texto.
const archivoSeleccionado = ref(null)

// Filtra sin modificar la lista original; Vue recalcula al cambiar registros o buscar.
const listaFiltrada = computed(() => {
  const consulta = buscar.value.toLocaleLowerCase()
  return registros.value.filter((item) =>
    `${item.nombre} ${item.descripcion}`.toLocaleLowerCase().includes(consulta)
  )
})

// Crea o actualiza el elemento local; sustituye este bloque por save/modify de src/api/.
function guardarRegistro() {
  error.value = ""
  guardando.value = true

  try {
    // Copia el modelo para no almacenar el objeto reactive del formulario directamente.
    const datos = { ...registro }
    if (editando.value) {
      registros.value = registros.value.map((item) =>
        item.id === datos.id ? datos : item
      )
    } else {
      datos.id = crypto.randomUUID()
      registros.value.push(datos)
    }

    Object.assign(registro, datos)
    editando.value = true
  } catch (err) {
    // En el ejemplo local esto cubre errores sin ocultarlos; al usar API muestra su mensaje HTTP.
    error.value = err.response?.data?.mensaje || "[No se pudo guardar el registro.]"
  } finally {
    guardando.value = false
  }
}

// Copia el registro seleccionado al formulario y activa el modo de actualizacion.
function editarRegistro(item) {
  Object.assign(registro, registroVacio(), item)
  archivoSeleccionado.value = null
  error.value = ""
  editando.value = true
}

// Elimina un registro de la lista local; conecta aqui delete de src/api/ para persistirlo.
function eliminarRegistro(id) {
  registros.value = registros.value.filter((item) => item.id !== id)
  if (registro.id === id) {
    limpiarFormulario()
  }
}

// Reinicia campos, errores y modo de edicion sin reemplazar el proxy reactive.
function limpiarFormulario() {
  Object.assign(registro, registroVacio())
  archivoSeleccionado.value = null
  editando.value = false
  error.value = ""
}

// Guarda el primer fichero elegido; para enviarlo al backend usa FormData.
function seleccionarArchivo(event) {
  archivoSeleccionado.value = event.target.files?.[0] ?? null
}

// Convierte el codigo interno del estado en el texto que se presenta en la tabla.
function etiquetaEstado(estado) {
  const etiquetas = {
    activo: "[Activo]",
    pendiente: "[Pendiente]"
  }
  return etiquetas[estado] ?? estado
}

/*
 * PATRÓN DE CONEXIÓN CON LA API:
 * 1. Importa getRegistros/saveRegistro/modifyRegistro/deleteRegistro desde ../api/.
 * 2. Carga registros en onMounted(), usando cargando y error en el template.
 * 3. En guardarRegistro(), llama a saveRegistro({ ...registro }) o modifyRegistro(id, datos).
 * 4. En editarRegistro y eliminarRegistro usa el identificador real, normalmente item._id.
 * 5. Tras guardar o eliminar, vuelves a pedir la lista para reflejar el estado real del backend.
 * 6. Mantén el nombre de los campos igual en backend, API y formulario para evitar errores dolorosos.
 *
 * Si quieres reutilizar este patrón en otra entidad, solo cambia:
 * - el nombre de la lista (registros -> pacientes, citas, etc.),
 * - el objeto del formulario (registroVacio),
 * - los nombres de las propiedades,
 * - las funciones de API importadas.
 *
 * Consulta GUIA-CREAR-COMPONENTE.md para la guía detallada desde backend hasta UI.
 */
</script>
