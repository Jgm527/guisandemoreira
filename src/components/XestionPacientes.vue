<template>
  <div class="xestion-pacientes">
    <h4>👥 Xestión de pacientes</h4>

    <!-- ============================================================
         FORMULARIO DE ALTA DE PACIENTE
         ============================================================
         @submit.prevent evita que el navegador recargue la página
         al enviar el formulario; llamamos a guardarPaciente().
         Cada campo se agrupa en una .fila (una línea horizontal)
         y dentro de un .campo (label + input).

         Sanitización (limpieza de datos) con @blur: se ejecuta al
         SALIR del campo para normalizar lo escrito:
         - DNI       → la letra final pasa a mayúscula.
         - Nome      → primera letra de cada palabra en mayúscula.
         - Apellidos → igual que Nome.
         - Móbil     → se quitan los espacios (debe empezar por 6 o 7). -->
    <form @submit.prevent="guardarPaciente">
      <div class="fila">
        <div class="campo campo-dni">
          <label>DNI/CIF:</label>

          <div class="dni-control">
            <input
              ref="dniInput"
              v-model="novoPaciente.dnipac"
              :class="{ incorrecto: hayError('dni') || errorDniServidor }"
              class="centrado"
              type="text"
              pattern="[0-9]{8}[A-Za-z]"
              required
              @input="errorDniServidor = false"
              @blur="sanitizarDni"
            />
            <div class="dni-acciones">
              <button
                type="button"
                title="Buscar paciente"
                aria-label="Buscar paciente"
                @click="buscarPaciente"
              >
                🔎
              </button>
              <button
                type="button"
                title="Limpiar formulario"
                aria-label="Limpiar formulario"
                @click="limpiaFormpac"
              >
                🧹
              </button>
            </div>
          </div>
        </div>

        <div class="campo campo-nome">
          <label>Nome:</label>

          <input
            v-model="novoPaciente.nomepac"
            type="text"
            required
            @blur="sanitizarNome"
          />
        </div>

        <div class="campo campo-apellidos">
          <label>Apellido:</label>

          <input
            v-model="novoPaciente.apelpac"
            type="text"
            required
            @blur="sanitizarApellidos"
          />
        </div>
      </div>

      <div class="fila">
        <div class="campo campo-fecha">
          <label>Fecha:</label>
          <input v-model="novoPaciente.nacipac" type="date" required />
        </div>

        <div class="campo campo-correo">
          <label>Correo:</label>
          <input
            v-model="novoPaciente.mailpac"
            :class="{ incorrecto: mailTocado && !validarMail(novoPaciente.mailpac) }"
            type="email"
            required
            @input="mailTocado = true"
            @blur="sanitizarMail"
          />
          <small v-if="mailTocado && !validarMail(novoPaciente.mailpac)" class="erro-mail">
            Introduce un correo electrónico válido.
          </small>
        </div>

        <div class="campo campo-mobil">
          <label>Móbil:</label>
          <input
            v-model="novoPaciente.movilpac"
            type="tel"
            pattern="[67][0-9]{8}"
            required
            @blur="sanitizarMobil"
          />
        </div>
      </div>

      <div class="fila">
        <div class="campo campo-direccion">
          <label>Dirección:</label>
          <input v-model="novoPaciente.dirpac" type="text" required />
        </div>

        <div class="campo campo-provincia">
          <label>Provincia:</label>

          <select
            v-model="novoPaciente.propac"
            required
            @change="cargarMunicipios"
          >
            <option value="">-- Escolle unha provincia --</option>
            <option
              v-for="provincia in provincias"
              :key="provincia.id"
              :value="provincia.nm"
            >
              {{ provincia.nm }}
            </option>
          </select>
        </div>

        <div class="campo campo-provincia">
          <label>Municipio:</label>

          <select id="municipio" v-model="novoPaciente.munipac" required>
            <option value="">-- Escolle un municipio --</option>
            <option
              v-for="municipio in municipios"
              :key="municipio.id"
              :value="municipio.nm"
            >
              {{ municipio.nm }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label>
          <input v-model="novoPaciente.lopdpac" type="checkbox" /> Aceptar la
          <a
            :href="$router.resolve({ name: 'PoliticaPrivacidad' }).href"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Privacidad y Confidencialidad
          </a>
        </label>
      </div>
      <div>
        <button
          type="submit"
          class="btn-guardar"
          :disabled="novoPaciente.dnipac === '' ||
            novoPaciente.nomepac === '' ||
            novoPaciente.apelpac === '' ||
            novoPaciente.movilpac === '' ||
            !novoPaciente.lopdpac"
        >
          Gardar
        </button>
        
      </div>
    </form>

    <h4>📋 Listaxe de pacientes</h4>

    <!-- La tabla solo se muestra si hay pacientes guardados;
         en caso contrario se muestra el párrafo v-else.

         La tabla va envuelta en .tabla-wrapper: si no cabe en
         horizontal, aparece un scroll DENTRO de la tarjeta en vez
         de desbordar el contenido por el lado derecho. -->
    <div v-if="pacientes.length > 0" class="tabla-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>DNI/CIF</th>
            <th>Nome</th>
            <th>Apellidos</th>
            <th>Correo</th>
            <th>Provincia</th>
            <th>Accións</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(u, index) in pacientes" :key="index">
            <td class="centrado">
              {{ index + 1 }}
            </td>
            <td class="centrado">
              {{ u.dnipac }}
            </td>
            <td>{{ u.nomepac }}</td>
            <td>{{ u.apelpac }}</td>
            <td>{{ u.mailpac }}</td>
            <td>{{ u.propac }}</td>

            <!-- Botones de acción: editar y eliminar el paciente. -->
            <td class="centrado">
              <button
                class="btn-accion"
                title="Editar"
                @click="editarPaciente(index)"
              >
                ✏️
              </button>

              <button
                class="btn-accion"
                title="Eliminar"
                @click="eliminarPaciente(index)"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else>Non hai pacientes cargados.</p>
  </div>
</template>

<script setup>
/// Zona de declaracións

import { ref, reactive, onMounted } from "vue";
import { obtenerProvincias, obtenerMunicipios } from "../api/municipios.js";
import {
  getPacientes,
  savePaciente,
  deletePaciente,
  modifyPaciente,
  getPacienteByDni
} from "../api/pacientes.js";
import {
    alertaExito,
    alertaError,
    alertaInfo,
    alertaConfirmacion,
} from "../utils/alertas.js"

const pacientes = ref([]);
const dniInput = ref(null);
const errorDniServidor = ref(false);
const editando = ref(false);
const mailTocado = ref(false);

const novoPaciente = reactive({
  nomepac: "",
  dnipac: "",
  apelpac: "",
  nacipac: "",
  mailpac: "",
  movilpac: "",
  dirpac: "",
  propac: "",
  munipac: "",
  lopdpac: false,
});

/// Zona de ciclo de vida

const provincias = ref([]);
const municipios = ref([]);

onMounted(async () => {
  try {
    [pacientes.value, provincias.value] = await Promise.all([
      getPacientes(),
      obtenerProvincias(),
    ]);
  } catch (error) {
    alertaError(mensaxeDoErro(error, "No se pudieron cargar los pacientes y las provincias."));
  }
});

async function cargarMunicipios() {
  if (novoPaciente.propac === "") {
    municipios.value = [];
    return;
  }

  const provincia = provincias.value.find((p) => p.nm === novoPaciente.propac);
  if (!provincia) {
    municipios.value = [];
    alertaError("No se encontró la provincia seleccionada.");
    return;
  }

  try {
    municipios.value = await obtenerMunicipios(provincia.id);
  } catch (error) {
    municipios.value = [];
    alertaError(mensaxeDoErro(error, "No se pudieron cargar los municipios."));
  }
}

/// Zona de métodos ou funcións

async function guardarPaciente() {
  sanitizarDni();
  novoPaciente.mailpac = novoPaciente.mailpac.trim();
  mailTocado.value = true;
  if (!validarMail(novoPaciente.mailpac)) {
    alertaError("Introduce un correo electrónico válido.", "Datos no válidos");
    return;
  }

  if (!esDniCorrecto()) {
    alertaError("Introduce un DNI válido.", "Datos no válidos");
    dniInput.value?.focus();
    return;
  }

  if (dniDuplicado()) {
    alertaError("Ya existe un paciente con ese DNI.", "DNI duplicado");
    return;
  }

  const confirmacion = await alertaConfirmacion(
    editando.value
      ? "¿Quieres guardar los cambios de este paciente?"
      : "¿Quieres guardar este paciente?",
    editando.value ? "Confirmar cambios" : "Confirmar alta"
  );
  if (!confirmacion.isConfirmed) {
    return;
  }

  let mensajeExito;
  try {
    if (editando.value) {
      const pacienteModificado = await modifyPaciente(novoPaciente.dnipac, novoPaciente);

      const index = pacientes.value.findIndex(
        (p) => p.dnipac === pacienteModificado.dnipac
      );

      if (index !== -1) {
        pacientes.value[index] = pacienteModificado;
      }
      mensajeExito = "El paciente se ha actualizado correctamente.";
    } else {
      const pacienteGuardado = await savePaciente(novoPaciente);
      pacientes.value.push(pacienteGuardado);
      mensajeExito = "El paciente se ha guardado correctamente.";
    }

    editando.value = false;
  } catch (error) {
    console.error("Error ao gardar paciente:", error);
    alertaError(mensaxeDoErro(error, "No se pudo guardar el paciente."));
    return;
  }

  await alertaExito(mensajeExito);
  try {
    pacientes.value = await getPacientes();
  } catch (error) {
    alertaError(mensaxeDoErro(error, "El paciente se guardó, pero no se pudo actualizar la lista."));
  }
}

async function eliminarPaciente(index) {
  const paciente = pacientes.value[index];
  if (!paciente) {
    alertaError("No se encontró el paciente que intentas eliminar.");
    return;
  }

  const confirmacion = await alertaConfirmacion(
    `¿Quieres eliminar a ${paciente.nomepac} ${paciente.apelpac}?`,
    "Eliminar paciente"
  );
  if (!confirmacion.isConfirmed) {
    return;
  }

  try {
    await deletePaciente(paciente.dnipac);
    pacientes.value.splice(index, 1);
    alertaExito("El paciente se ha eliminado correctamente.");
  } catch (error) {
    console.error("Error ao eliminar paciente:", error);
    alertaError(mensaxeDoErro(error, "No se pudo eliminar el paciente."));
  }
}

async function editarPaciente(index) {
  const paciente = pacientes.value[index];

  Object.assign(novoPaciente, paciente);

  delete novoPaciente._id;
  editando.value = true;

  await cargarMunicipios();
}

/// Zona de sanitización (limpieza) de campos

// DNI: al SALIR del campo, quita los espacios y pasa la letra
// final a mayúscula de forma automática.
function sanitizarDni() {
  novoPaciente.dnipac = novoPaciente.dnipac.trim().toUpperCase();
}

// Nome / Apellidos: al SALIR del campo, deja la primera letra de
// cada palabra en mayúscula y el resto en minúscula.
// Ejemplo: "maria del carmen" → "Maria Del Carmen"
function capitalizarNome(texto) {
  return texto
    .trim()
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (m, espazo, letra) => espazo + letra.toUpperCase());
}

function sanitizarNome() {
  novoPaciente.nomepac = capitalizarNome(novoPaciente.nomepac);
}

function sanitizarApellidos() {
  novoPaciente.apelpac = capitalizarNome(novoPaciente.apelpac);
}

// Móbil: al SALIR del campo, quita los espacios para que la
// validación "empieza por 6 o 7" sea correcta.
function sanitizarMobil() {
  novoPaciente.movilpac = novoPaciente.movilpac.replace(/\s+/g, "");
}

function sanitizarMail() {
  novoPaciente.mailpac = novoPaciente.mailpac.trim();
  mailTocado.value = true;
}

function validarMail(mail) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(mail ?? "").trim());
}

/// Funciones auxiliares

function esDniCorrecto() {
  // Comprobamos que tenga 8 números y una letra mayúscula
  const regex = /^\d{8}[A-Z]$/;

  if (!regex.test(novoPaciente.dnipac)) {
    return false;
  }

  // Array de letras del DNI
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE";

  // Cogemos solamente los 8 números
  const numero = parseInt(novoPaciente.dnipac.substring(0, 8));

  // Calculamos el resto de dividir entre 23
  const resto = numero % 23;

  // La letra correcta es la que ocupa esa posición
  // en el array
  const letraCorrecta = letras[resto];

  // Comparamos la letra calculada con la del DNI
  const letraDni = novoPaciente.dnipac.charAt(8);

  return letraDni === letraCorrecta;
}

function dniDuplicado() {
  const dni = novoPaciente.dnipac.trim().toUpperCase();

  return (
    dni !== "" &&
    pacientes.value.some(
      (paciente) =>
        String(paciente.dnipac || "")
          .trim()
          .toUpperCase() === dni && paciente.dnipac !== novoPaciente.dnipac,
    )
  );
}

function limpiaFormpac() {
  Object.keys(novoPaciente).forEach((key) => {
    if (typeof novoPaciente[key] === "boolean") {
      novoPaciente[key] = false;
    } else {
      novoPaciente[key] = "";
    }
  });

  editando.value = false;
}

async function buscarPaciente() {
  const dni = novoPaciente.dnipac.trim().toUpperCase();
  if (!dni) {
    alertaInfo("Introduce un DNI para buscar al paciente.");
    dniInput.value?.focus();
    return;
  }

  sanitizarDni();
  try {
    const paciente = await getPacienteByDni(novoPaciente.dnipac);

    Object.assign(novoPaciente, paciente);
    editando.value = true;
    await cargarMunicipios();
    alertaInfo("Se ha encontrado el paciente.");
  } catch (error) {
    if (error.response?.status === 404) {
      alertaInfo("No se encontró ningún paciente con ese DNI.", "Paciente no encontrado");
    } else {
      console.error("Error al buscar paciente:", error);
      alertaError(mensaxeDoErro(error, "No se pudo buscar el paciente."));
    }
  }
}

function mensaxeDoErro(error, porDefecto) {
  return error.response?.data?.mensaje || error.response?.data?.message || porDefecto;
}

function hayError(campo) {
  if (campo === "dni") {
    return novoPaciente.dnipac !== "" && (!esDniCorrecto() || dniDuplicado());
  }

  return false;
}
</script>
