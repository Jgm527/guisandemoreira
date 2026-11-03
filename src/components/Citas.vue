<template>
  <section class="xestion-citas">
    <h4>🗓️ Xestión de citas</h4>

    <form class="citas-formulario" @submit.prevent="guardarCita">
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

      <p v-if="!cargando && !pacientes.length" class="citas-aviso">
        Primero debes registrar al menos un paciente para poder crear una cita.
      </p>
      <p v-if="!cargando && !doctores.length" class="citas-aviso">
        Primero debes registrar al menos un doctor para poder crear una cita.
      </p>

      <div class="citas-acciones-formulario">
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
          <tr v-for="item in citas" :key="item._id">
            <td>{{ item.fecha }} · {{ item.hora }}</td>
            <td>{{ nombrePaciente(item.pacienteId) }}</td>
            <td>{{ nombreDoctor(item.doctorId) }}</td>
            <td>{{ item.motivo }}</td>
            <td>{{ etiquetaEstado(item.estado) }}</td>
            <td>{{ item.observacions || "—" }}</td>
            <td class="citas-celda-acciones">
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
import { computed, onMounted, reactive, ref } from "vue"
import { deleteCita, getCitas, saveCita, updateCita } from "../api/citas.js"
import { getDoctores } from "../api/doctores.js"
import { getPacientes } from "../api/pacientes.js"
import {
  alertaConfirmacion,
  alertaError,
  alertaExito
} from "../utils/alertas.js"

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

const citas = ref([])
const pacientes = ref([])
const doctores = ref([])
const cita = reactive(citaVacia())
const editando = ref(false)
const cargando = ref(false)
const guardando = ref(false)

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

onMounted(cargarDatos)

async function cargarDatos() {
  cargando.value = true

  try {
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

async function guardarCita() {
  if (!formularioValido.value) {
    return
  }

  guardando.value = true

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

async function eliminarCita(item) {
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

function limpiarFormulario() {
  Object.assign(cita, citaVacia())
  editando.value = false
}

function nombrePaciente(pacienteId) {
  const id = idRelacionado(pacienteId)
  const paciente = pacientes.value.find((item) => item._id === id)
  return paciente
    ? `${paciente.nomepac} ${paciente.apelpac}`
    : "Paciente no disponible"
}

function nombreDoctor(doctorId) {
  const id = idRelacionado(doctorId)
  const doctor = doctores.value.find((item) => item._id === id)
  return doctor
    ? `${doctor.nomedoc} ${doctor.apeldoc}`
    : "Doctor no disponible"
}

function idRelacionado(relacion) {
  return String(relacion?._id ?? relacion ?? "")
}

function etiquetaEstado(estado) {
  const etiquetas = {
    pendente: "Pendiente",
    confirmada: "Confirmada",
    realizada: "Realizada",
    cancelada: "Cancelada"
  }
  return etiquetas[estado] ?? estado
}

function mensajeError(error, porDefecto) {
  return error.response?.data?.mensaje || error.response?.data?.message || porDefecto
}
</script>
