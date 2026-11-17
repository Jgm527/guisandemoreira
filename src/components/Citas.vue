<template>
  <!-- Gestiona altas, ediciones, consultas y eliminaciones de citas medicas. -->
  <section class="xestion-citas">
    <h4>🗓️ Xestión de citas</h4>

    <p
      v-if="!pacienteStore.dnipac && !doctorStore.idDoctor"
      class="citas-aviso"
    >
      Selecciona un paciente o un doctor en su pestaña para consultar sus citas.
    </p>

    <template v-else>
      <p
        v-if="!pacienteStore.dnipac || !doctorStore.idDoctor"
        class="citas-aviso"
      >
        Puedes consultar las citas con una selección. Para crear o editar una cita,
        selecciona un paciente y un doctor.
      </p>

      <!-- El submit llama a guardarCita(); cita y formularioValido se definen en el script. -->
      <form
        class="citas-formulario"
        @submit.prevent="guardarCita"
      >
        <!-- Cada control enlaza con una propiedad del objeto reactivo cita. -->
        <div class="citas-grid">
          <div class="citas-campo">
            <label for="id-cita">ID cita:</label>
            <input
              id="id-cita"
              :value="cita._id || 'Se genera al guardar'"
              class="centrado"
              type="text"
              disabled
            >
          </div>

          <div class="citas-campo">
            <label for="paciente-cita">Paciente:</label>
            <select
              id="paciente-cita"
              class="centrado"
              :value="pacienteStore.dnipac || ''"
              disabled
            >
              <option
                v-if="!pacienteStore.dnipac"
                value=""
              >
                Selecciona un paciente en su pestaña
              </option>
              <option
                v-else
                :value="pacienteStore.dnipac"
              >
                {{ pacienteStore.nomepac }} {{ pacienteStore.apelpac }} — {{ pacienteStore.dnipac }}
              </option>
            </select>
          </div>

          <div class="citas-campo">
            <label for="doctor-cita">Doctor:</label>
            <select
              id="doctor-cita"
              :value="doctorStore.idDoctor || ''"
              disabled
            >
              <option
                v-if="!doctorStore.idDoctor"
                value=""
              >
                Selecciona un doctor en su pestaña
              </option>
              <option
                v-else
                :value="doctorStore.idDoctor"
              >
                {{ doctorStore.nomedoc }} {{ doctorStore.apeldoc }} — {{ doctorStore.espedoc }}
              </option>
            </select>
          </div>

          <div class="citas-campo">
            <label for="fecha-cita">Fecha:</label>
            <input
              id="fecha-cita"
              v-model="cita.fecha"
              type="date"
              required
            >
          </div>

          <div class="citas-campo">
            <label for="hora-cita">Hora:</label>
            <input
              id="hora-cita"
              v-model="cita.hora"
              type="time"
              required
            >
          </div>

          <div class="citas-campo">
            <label for="estado-cita">Estado:</label>
            <select
              id="estado-cita"
              v-model="cita.estado"
              required
            >
              <option value="pendente">
                Pendiente
              </option>
              <option value="confirmada">
                Confirmada
              </option>
              <option value="realizada">
                Realizada
              </option>
              <option value="cancelada">
                Cancelada
              </option>
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
            >
          </div>

          <div class="citas-campo citas-campo-observaciones">
            <label for="observaciones-cita">Observaciones adicionales:</label>
            <textarea
              id="observaciones-cita"
              v-model.trim="cita.observacions"
              rows="3"
              maxlength="1000"
              placeholder="Información opcional"
            />
          </div>
        </div>

        <!-- El aviso depende de la lista de doctores obtenida desde la API. -->
        <p
          v-if="!cargando && !doctores.length"
          class="citas-aviso"
        >
          Primero debes registrar al menos un doctor para poder crear una cita.
        </p>

        <div class="citas-acciones-formulario">
          <!-- El estado de edicion y la validacion del script cambian el texto y disponibilidad. -->
          <button
            class="citas-boton-principal"
            type="submit"
            :disabled="guardando || !formularioValido"
          >
            Guardar
          </button>
          <button
            v-if="editando"
            class="citas-boton-secundario"
            type="button"
            @click="limpiarFormulario"
          >
            Cancelar
          </button>
          <button
            v-else
            class="citas-boton-secundario"
            type="button"
            @click="limpiarSeleccion"
          >
            Limpiar
          </button>
        </div>
      </form>

      <div class="citas-cabecera-lista">
        <h4>📋 Listado de citas</h4>
        <button
          class="citas-boton-informe"
          type="button"
          title="Exportar"
          aria-label="Exportar"
          :disabled="cargando || citas.length === 0"
          @click="exportarCitas"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <path d="M6 14h12v7H6zM18 12h.01" />
          </svg>
        </button>
        <!-- Actualiza las citas del paciente seleccionado y el catalogo de doctores. -->
        <button
          class="citas-boton-informe citas-boton-actualizar"
          type="button"
          title="Actualizar"
          aria-label="Actualizar"
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
      <p
        v-if="cargando"
        class="citas-mensaje-lista"
      >
        Cargando citas...
      </p>
      <div
        v-else-if="citas.length"
        class="citas-tabla-wrapper"
      >
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
            <tr 
              v-for="item in citas" 
              :key="item._id"
            >
              <td>{{ item.fecha }} · {{ item.hora }}</td>
              <td>{{ nombrePaciente(item.pacienteDNI) }}</td>
              <td>{{ nombreDoctor(item.doctorId) }}</td>
              <td>{{ item.motivo }}</td>
              <td>{{ etiquetaEstado(item.estado) }}</td>
              <td>{{ item.observacions || "—" }}</td>
              <td class="citas-celda-acciones">
                <!-- Los eventos reciben la cita de esta fila y llaman a las funciones del script. -->
                <button
                  class="citas-boton-accion"
                  type="button"
                  title="Editar"
                  aria-label="Editar"
                  @click="editarCita(item)"
                >
                  ✏️
                </button>
                <button
                  class="citas-boton-accion"
                  type="button"
                  title="Eliminar"
                  aria-label="Eliminar"
                  @click="eliminarCita(item)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-else
        class="citas-mensaje-lista"
      >
        No hay citas cargadas.
      </p>
    </template>
  </section>
</template>

<script setup>
// Estado reactivo, valores calculados y carga inicial de la pantalla.
import { computed, onMounted, reactive, ref, watch } from "vue"
// Acceso al store de pacientes para poder filtrar citas por paciente.
import { usepacienteStore } from "../store/pacienteStore.js";
import { useDoctorStore } from "../store/doctorStore.js";
// Operaciones de escritura/lectura de citas y catalogos relacionados.
import { deleteCita, getCitas, saveCita, updateCita } from "../api/citas.js"
import { getDoctores } from "../api/doctores.js"
import { getPacientes } from "../api/pacientes.js"
import { generarPDF } from "../utils/pdf.js"
import {
  alertaConfirmacion,
  alertaError,
  alertaExito
} from "../utils/alertas.js"

// Acceso al store de pacientes para poder filtrar citas por paciente.
const pacienteStore = usepacienteStore()
const doctorStore = useDoctorStore()

// Fabrica valores iniciales para reutilizar el mismo formulario en altas y ediciones.
const citaVacia = () => ({
  _id: "",
  pacienteDNI: "",
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
    pacienteStore.dnipac &&
    doctorStore.idDoctor &&
    cita.motivo.trim() &&
    cita.estado
  )
)

// Al abrir la pantalla basta con que haya un paciente o un doctor seleccionado.
onMounted(async () => {
  if (pacienteStore.dnipac || doctorStore.idDoctor) {
    await cargarDatos()
  }
})

// Si cambia cualquiera de las selecciones, se descarta el formulario y la lista anterior.
watch(() => [pacienteStore.dnipac, doctorStore.idDoctor], async ([dniPaciente, idDoctor]) => {
  citas.value = []
  pacientes.value = []
  doctores.value = []
  limpiarFormulario()

  if (dniPaciente || idDoctor) {
    await cargarDatos()
  }
})

// Refresca citas y catalogos, filtrando por cada seleccion que exista en Pinia.
async function cargarDatos() {
  const dniPaciente = pacienteStore.dnipac
  const idDoctor = doctorStore.idDoctor
  if (!dniPaciente && !idDoctor) {
    citas.value = []
    pacientes.value = []
    doctores.value = []
    return
  }

  cargando.value = true

  try {
    // Los catalogos permiten mostrar el nombre de la otra persona aunque solo
    // se haya seleccionado paciente o doctor en su pestaña.
    const [listaCitas, listaPacientes, listaDoctores] = await Promise.all([
      getCitas({ pacienteDNI: dniPaciente, doctorId: idDoctor }),
      getPacientes(),
      getDoctores()
    ])

    // Ignora una respuesta tardia si entretanto cambio cualquiera de las selecciones.
    if (
      String(pacienteStore.dnipac) !== String(dniPaciente) ||
      String(doctorStore.idDoctor) !== String(idDoctor)
    ) {
      return
    }

    // Verifica tambien en el cliente los filtros, por si el backend activo aun no se reinicio.
    citas.value = listaCitas.filter((item) =>
      (!dniPaciente || normalizarDNI(item.pacienteDNI) === normalizarDNI(dniPaciente)) &&
      (!idDoctor || idRelacionado(item.doctorId) === String(idDoctor))
    )
    pacientes.value = listaPacientes
    doctores.value = listaDoctores
  } catch (error) {
    alertaError(mensajeError(error, "No se pudieron cargar las citas, pacientes y doctores."))
  } finally {
    cargando.value = false
  }
}

async function exportarCitas() {
  const paciente = pacienteStore.dnipac
    ? pacientes.value.find(
      (item) => normalizarDNI(item.dnipac) === normalizarDNI(pacienteStore.dnipac)
    )
    : null
  const doctor = doctores.value.find(
    (item) => String(item._id) === String(doctorStore.idDoctor)
  )
  const filtros = []

  if (pacienteStore.dnipac) {
    const nombre = paciente
      ? `${paciente.nomepac} ${paciente.apelpac}`
      : `${pacienteStore.nomepac} ${pacienteStore.apelpac}`
    filtros.push(`Paciente: ${nombre}`)
  }
  if (doctorStore.idDoctor) {
    const nombre = doctor
      ? `${doctor.nomedoc} ${doctor.apeldoc}`
      : `${doctorStore.nomedoc} ${doctorStore.apeldoc}`
    filtros.push(`Doctor: ${nombre}`)
  }

  try {
    await generarPDF({
      titulo: "Informe de citas",
      descripcion: filtros.join(" | "),
      cabeceras: ["Fecha", "Hora", "Paciente", "Doctor", "Motivo", "Estado"],
      filas: citas.value.map((item) => [
        item.fecha ?? "",
        item.hora ?? "",
        nombrePaciente(item.pacienteDNI),
        nombreDoctor(item.doctorId),
        item.motivo ?? "",
        etiquetaEstado(item.estado),
      ]),
      nombreArchivo: "informe_citas.pdf",
      orientacion: "landscape",
    })
  } catch (error) {
    alertaError(mensajeError(error, "No se pudo generar el informe de citas."))
  }
}

// Para crear o editar el backend exige ambos identificadores, aunque el listado
// pueda consultarse filtrando solo por una de las dos selecciones.
async function guardarCita() {
  if (!pacienteStore.dnipac || !doctorStore.idDoctor || !formularioValido.value) {
    return
  }

  guardando.value = true

  // Solo envia campos aceptados por el modelo y normaliza texto libre con trim().
  const datosCita = {
    pacienteDNI: pacienteStore.dnipac,
    doctorId: doctorStore.idDoctor,
    fecha: cita.fecha,
    hora: cita.hora,
    motivo: cita.motivo.trim(),
    observacions: cita.observacions.trim(),
    estado: cita.estado
  }

  try {
    const estabaEditando = editando.value
    if (estabaEditando) {
      const citaActualizada = await updateCita(cita._id, datosCita)
      Object.assign(cita, citaActualizada)
    } else {
      const citaGuardada = await saveCita(datosCita)
      Object.assign(cita, citaGuardada)
    }

    editando.value = true
    await alertaExito(
      estabaEditando ? "La cita se ha actualizado correctamente." : "La cita se ha guardado correctamente."
    )
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
    pacienteDNI: String(item.pacienteDNI ?? ""),
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

// Limpia el formulario y las selecciones compartidas de paciente y doctor.
function limpiarSeleccion() {
  limpiarFormulario()
  pacienteStore.limpiarPaciente()
  doctorStore.limpiarDoctor()
}

// Busca el paciente relacionado en el catálogo, con el store como respaldo.
function nombrePaciente(pacienteDNI) {
  const dni = normalizarDNI(pacienteDNI)
  if (!dni) {
    return "Paciente no disponible"
  }

  const paciente = pacientes.value.find((item) => normalizarDNI(item.dnipac) === dni)
  if (paciente) {
    return `${paciente.nomepac} ${paciente.apelpac}`
  }

  if (normalizarDNI(pacienteStore.dnipac) === dni) {
    return `${pacienteStore.nomepac} ${pacienteStore.apelpac}`
  }

  return "Paciente no disponible"
}

function normalizarDNI(dni) {
  return String(dni ?? "").trim().toUpperCase()
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
