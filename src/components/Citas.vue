<template>
  <!-- Gestiona altas, ediciones, consultas y eliminaciones de citas medicas. -->
  <section class="xestion-citas">
    <h4>🗓️ Xestión de citas</h4>

    <!-- El submit llama a guardarCita(); cita y formularioValido se definen en el script. -->
    <form class="citas-formulario" @submit.prevent="guardarCita">
      <!-- Cada control enlaza con una propiedad del objeto reactivo cita. -->
      <div class="citas-grid">
        <div class="citas-campo">
          <label for="id-cita">ID cita:</label>
          <input
            id="id-cita"
            :value="cita._id || 'Se genera al guardar'"
            type="text"
            disabled
          />
        </div>

        <div class="citas-campo">
          <label for="fecha-cita">Fecha:</label>
          <input id="fecha-cita" v-model="cita.fecha" type="date" required />
        </div>

        <div class="citas-campo">
          <label for="hora-cita">Hora:</label>
          <input id="hora-cita" v-model="cita.hora" type="time" required />
        </div>

        <div class="citas-campo">
          <label for="paciente-cita">Paciente:</label>
          <!-- pacientes viene de getPacientes(); se guarda el _id de la opcion seleccionada. -->
          <select
            id="paciente-cita"
            v-model="cita.pacienteId"
            required
            :disabled="cargando || pacientes.length === 0"
          >
            <option value="" disabled>Selecciona un paciente</option>
            <option v-for="paciente in pacientes" :key="paciente._id" :value="paciente._id">
              {{ paciente.nomepac }} {{ paciente.apelpac }} — {{ paciente.dnipac }}
            </option>
          </select>
        </div>

        <div class="citas-campo">
          <label for="doctor-cita">Doctor:</label>
          <!-- doctores viene de getDoctores(); la relacion guardada es su identificador Mongo. -->
          <select
            id="doctor-cita"
            v-model="cita.doctorId"
            required
            :disabled="cargando || doctores.length === 0"
          >
            <option value="" disabled>Selecciona un doctor</option>
            <option v-for="doctor in doctores" :key="doctor._id" :value="doctor._id">
              {{ doctor.nomedoc }} {{ doctor.apeldoc }} — {{ doctor.especdoc }}
            </option>
          </select>
        </div>

        <div class="citas-campo">
          <label for="estado-cita">Estado:</label>
          <select id="estado-cita" v-model="cita.estado" required>
            <option value="pendente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div class="citas-campo citas-campo-motivo">
          <label for="motivo-cita">Motivo de la cita:</label>
          <input
            id="motivo-cita"
            v-model.trim="cita.motivo"
            type="text"
            maxlength="250"
            required
            placeholder="Describe brevemente el motivo"
          />
        </div>

        <div class="citas-campo citas-campo-observaciones">
          <label for="observaciones-cita">Observaciones adicionales:</label>
          <textarea
            id="observaciones-cita"
            v-model.trim="cita.observacions"
            rows="3"
            maxlength="1000"
            placeholder="Información opcional"
          ></textarea>
        </div>
      </div>

      <!-- Estos avisos dependen de las listas que cargarDatos() obtiene desde la API. -->
      <p v-if="!cargando && !pacientes.length" class="citas-aviso">
        Primero debes registrar al menos un paciente para poder crear una cita.
      </p>
      <p v-if="!cargando && !doctores.length" class="citas-aviso">
        Primero debes registrar al menos un doctor para poder crear una cita.
      </p>

      <div class="citas-acciones-formulario">
        <!-- El estado de edicion y la validacion del script cambian el texto y disponibilidad. -->
        <button class="citas-boton-principal" type="submit" :disabled="guardando || !formularioValido">
          {{ guardando ? "Guardando..." : editando ? "Guardar cambios" : "Guardar cita" }}
        </button>
        <button v-if="editando" class="citas-boton-secundario" type="button" @click="limpiarFormulario">
          Cancelar edición
        </button>
        <button v-else class="citas-boton-secundario" type="button" @click="limpiarFormulario">
          Limpiar
        </button>
      </div>
    </form>

    <div class="citas-cabecera-lista">
      <h4>📋 Listado de citas</h4>
      <!-- Al pulsarlo vuelve a consultar citas, pacientes y doctores mediante cargarDatos(). -->
      <button
        class="citas-boton-actualizar"
        type="button"
        title="Actualizar listado"
        aria-label="Actualizar listado"
        :disabled="cargando"
        :class="{ 'animate-spin': cargando }"
        @click="cargarDatos"
      >
        <svg
          aria-hidden="true"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 7v5h-5" />
          <path d="M4 17v-5h5" />
          <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
        </svg>
      </button>
    </div>

    <!-- Estados alternativos de la lista: carga, tabla con datos o mensaje vacio. -->
    <p v-if="cargando" class="citas-mensaje-lista">Cargando citas...</p>
    <div v-else-if="citas.length" class="citas-tabla-wrapper">
      <table>
        <thead>
          <tr>
            <th>Fecha y hora</th>
            <th>Paciente</th>
            <th>Doctor</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Observaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <!-- citas procede de la API; las funciones del script convierten relaciones y estados. -->
          <tr v-for="item in citas" :key="item._id">
            <td>{{ item.fecha }} · {{ item.hora }}</td>
            <td>{{ nombrePaciente(item.pacienteId) }}</td>
            <td>{{ nombreDoctor(item.doctorId) }}</td>
            <td>{{ item.motivo }}</td>
            <td>{{ etiquetaEstado(item.estado) }}</td>
            <td>{{ item.observacions || "—" }}</td>
            <td class="citas-celda-acciones">
              <!-- Los eventos reciben la cita de esta fila y llaman a las funciones del script. -->
              <button
                class="citas-boton-accion"
                type="button"
                title="Editar cita"
                :aria-label="`Editar cita del ${item.fecha}`"
                @click="editarCita(item)"
              >
                ✏️
              </button>
              <button
                class="citas-boton-accion"
                type="button"
                title="Eliminar cita"
                :aria-label="`Eliminar cita del ${item.fecha}`"
                @click="eliminarCita(item)"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="citas-mensaje-lista">
      No hay citas cargadas.
    </p>
  </section>
</template>

<script setup>
// Estado reactivo, valores calculados y carga inicial de la pantalla.
import { computed, onMounted, reactive, ref } from "vue"
// Operaciones de escritura/lectura de citas y catalogos relacionados.
import { deleteCita, getCitas, saveCita, updateCita } from "../api/citas.js"
import { getDoctores } from "../api/doctores.js"
import { getPacientes } from "../api/pacientes.js"
import {
  alertaConfirmacion,
  alertaError,
  alertaExito
} from "../utils/alertas.js"

// Fabrica valores iniciales para reutilizar el mismo formulario en altas y ediciones.
const citaVacia = () => ({
  _id: "",
  pacienteId: "",
  doctorId: "",
  fecha: "",
  hora: "",
  motivo: "",
  observacions: "",
  estado: "pendente"
})

// Colecciones y formulario visibles desde el template.
const citas = ref([])
const pacientes = ref([])
const doctores = ref([])
const cita = reactive(citaVacia())
// Indicadores de modo y peticiones para evitar acciones duplicadas y mostrar carga.
const editando = ref(false)
const cargando = ref(false)
const guardando = ref(false)

// Habilita el envio solo cuando los campos necesarios tienen contenido util.
const formularioValido = computed(() =>
  Boolean(
    cita.fecha &&
    cita.hora &&
    cita.pacienteId &&
    cita.doctorId &&
    cita.motivo.trim() &&
    cita.estado
  )
)

// Al abrir la pantalla se cargan citas y los registros necesarios para resolver sus referencias.
onMounted(cargarDatos)

// Refresca los tres recursos y comunica cualquier fallo; el indicador siempre se apaga.
async function cargarDatos() {
  cargando.value = true

  try {
    // Promise.all evita mostrar un listado parcial que no pueda resolver sus relaciones.
    // Cada resultado representa una de las listas que necesita el selector o la tabla.
    const [listaCitas, listaPacientes, listaDoctores] = await Promise.all([
      getCitas(),
      getPacientes(),
      getDoctores()
    ])
    citas.value = listaCitas
    pacientes.value = listaPacientes
    doctores.value = listaDoctores
  } catch (error) {
    alertaError(mensajeError(error, "No se pudieron cargar las citas y los datos relacionados."))
  } finally {
    cargando.value = false
  }
}

// Prepara los datos, llama al endpoint correcto y actualiza la pantalla tras guardar.
async function guardarCita() {
  if (!formularioValido.value) {
    return
  }

  guardando.value = true

  // Solo envia campos aceptados por el modelo y normaliza texto libre con trim().
  const datosCita = {
    pacienteId: cita.pacienteId,
    doctorId: cita.doctorId,
    fecha: cita.fecha,
    hora: cita.hora,
    motivo: cita.motivo.trim(),
    observacions: cita.observacions.trim(),
    estado: cita.estado
  }

  try {
    if (editando.value) {
      await updateCita(cita._id, datosCita)
    } else {
      await saveCita(datosCita)
    }

    await alertaExito(
      editando.value ? "La cita se ha actualizado correctamente." : "La cita se ha guardado correctamente."
    )
    limpiarFormulario()
    await cargarDatos()
  } catch (error) {
    alertaError(mensajeError(error, "No se pudo guardar la cita."))
  } finally {
    guardando.value = false
  }
}

// Copia la cita seleccionada al formulario y normaliza las referencias para los selectores.
function editarCita(item) {
  Object.assign(cita, citaVacia(), {
    ...item,
    pacienteId: idRelacionado(item.pacienteId),
    doctorId: idRelacionado(item.doctorId),
    observacions: item.observacions ?? "",
    estado: item.estado ?? "pendente"
  })
  editando.value = true
}

// Elimina una cita tras confirmacion; limpia el formulario si se editaba esa misma cita.
async function eliminarCita(item) {
  // confirmacion indica si el usuario acepta borrar el registro seleccionado.
  const confirmacion = await alertaConfirmacion(
    `¿Eliminar la cita del ${item.fecha} a las ${item.hora}?`,
    "Eliminar cita"
  )
  if (!confirmacion.isConfirmed) {
    return
  }

  try {
    await deleteCita(item._id)
    if (cita._id === item._id) {
      limpiarFormulario()
    }
    await alertaExito("La cita se ha eliminado correctamente.")
    await cargarDatos()
  } catch (error) {
    alertaError(mensajeError(error, "No se pudo eliminar la cita."))
  }
}

// Restablece el formulario y termina el modo de edicion.
function limpiarFormulario() {
  Object.assign(cita, citaVacia())
  editando.value = false
}

// Resuelve el identificador de paciente a su nombre para mostrarlo en la tabla.
function nombrePaciente(pacienteId) {
  // id normaliza tanto una referencia poblada como un identificador simple de Mongo.
  const id = idRelacionado(pacienteId)
  // paciente es el registro local cuyo _id coincide con la relacion de la cita.
  const paciente = pacientes.value.find((item) => item._id === id)
  return paciente
    ? `${paciente.nomepac} ${paciente.apelpac}`
    : "Paciente no disponible"
}

// Resuelve el identificador de doctor a su nombre para mostrarlo en la tabla.
function nombreDoctor(doctorId) {
  // id normaliza la referencia para poder compararla con el listado de doctores.
  const id = idRelacionado(doctorId)
  // doctor es el registro local que se mostrara en la fila de la cita.
  const doctor = doctores.value.find((item) => item._id === id)
  return doctor
    ? `${doctor.nomedoc} ${doctor.apeldoc}`
    : "Doctor no disponible"
}

// Devuelve siempre un string tanto si Mongoose entrega una referencia poblada como un ID.
function idRelacionado(relacion) {
  return String(relacion?._id ?? relacion ?? "")
}

// Convierte el codigo interno de estado en una etiqueta legible para la interfaz.
function etiquetaEstado(estado) {
  // Traduce los codigos de base de datos a etiquetas visibles para la persona usuaria.
  const etiquetas = {
    pendente: "Pendiente",
    confirmada: "Confirmada",
    realizada: "Realizada",
    cancelada: "Cancelada"
  }
  return etiquetas[estado] ?? estado
}

// Extrae el mensaje del backend desde Axios o devuelve el texto alternativo.
function mensajeError(error, porDefecto) {
  return error.response?.data?.mensaje || error.response?.data?.message || porDefecto
}
</script>
