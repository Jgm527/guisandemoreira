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
          <input
            v-model="novoPaciente.nacipac"
            type="date"
            required
          />
        </div>

        <div class="campo campo-correo">
          <label>Correo:</label>
          <input
            v-model="novoPaciente.mailpac"
            type="email"
            required
          />
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
          <input
            v-model="novoPaciente.dirpac"
            type="text"
            required
          />
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

          <select
            id="municipio"
            v-model="novoPaciente.munipac"
            required
          >
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

      <button
        type="submit"
        class="btn-guardar"
      >
        Gardar
      </button>
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
import { getPacientes, savePaciente, deletePaciente } from "../api/pacientes.js";

const pacientes = ref([]);
const dniInput = ref(null);
const errorDniServidor = ref(false);

const novoPaciente = reactive({
  nomepac: "",
  dnipac: "",
  apelpac: "",
  nacipac: "",
  mailpac: "",
  movilpac: "",
  dirpac: "",
  propac: "",
  munipac: ""
});

/// Zona de ciclo de vida

const provincias = ref([]);
const municipios = ref([]);

onMounted(async () => {
  pacientes.value = await getPacientes();
  provincias.value = await obtenerProvincias();
});

async function cargarMunicipios() {
  if (novoPaciente.propac === "") {
    municipios.value = [];
    return;
  }

  const provincia = provincias.value.find(
    p => p.nm === novoPaciente.propac
  );

  municipios.value = await obtenerMunicipios(provincia.id);
}

/// Zona de métodos ou funcións

async function guardarPaciente() {
  errorDniServidor.value = false;

  if (hayError("dni")) {
    dniInput.value?.focus();
    return;
  }

  try {
        const pacienteGuardado = await savePaciente(novoPaciente);
    		pacientes.value.push(pacienteGuardado);
    		console.log("Paciente gardado correctamente");
        getPacientes(); // Actualiza la lista de pacientes después de guardar
  } catch (error) {
    if (error.response?.status === 409) {
      errorDniServidor.value = true;
      dniInput.value?.focus();
      return;
    }

    console.error("Error ao gardar paciente:", error);
  }
}

async function eliminarPaciente(index) {
  try {
    await deletePaciente(pacientes.value[index].dnipac);
    pacientes.value.splice(index, 1);
    console.log("Paciente eliminado correctamente");
    getPacientes(); // Actualiza la lista de pacientes después de eliminar
  } catch (error) {
    console.error("Error ao eliminar paciente:", error);
  }
}

function editarPaciente(index) {
  const paciente = pacientes.value[index];

  Object.assign(novoPaciente, paciente);
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

  return dni !== "" && pacientes.value.some(
    paciente => String(paciente.dnipac || "").trim().toUpperCase() === dni
  );
}

function hayError(campo) {
  if (campo === "dni") {
    return novoPaciente.dnipac !== "" && (!esDniCorrecto() || dniDuplicado());
  }

  return false;
}
</script>

<style scoped>
/* ============================================================
  ESTILOS DE XestionPacientes.vue
   ============================================================
   Bloque "scoped": estos estilos solo se aplican a este componente
   (Vue añade un atributo único a las clases para que no interfieran
   con otros componentes).

   La paleta de colores está definida en src/style.css y se usa
   aquí mediante variables (var(--color-...)).

   Estructura del bloque:
    1. Contenedor general (.xestion-pacientes)
     2. Formulario: filas, campos, inputs, errores y botón
    3. Lista de pacientes (tabla)
     4. Títulos (h4)
     5. Responsive (pantallas pequeñas)
   ============================================================ */

/* ------------------------------------------------------------
   1. CONTENEDOR GENERAL
   La tarjeta blanca que envuelve todo el contenido del componente.
   ------------------------------------------------------------ */
.xestion-pacientes {
  width: 100%;
  /* min-width: 0 → al ser la tarjeta hija directa de #app (flex en
     columna), sin esto no podría encogerse por debajo del ancho
     natural de su contenido y empujaría todo hacia la derecha. */
  min-width: 0;
  background-color: var(--color-tarjeta); /* fondo blanco de la tarjeta */
  padding: 2rem; /* hueco interior alrededor de todo */
  border-radius: 8px; /* esquinas suavizadas */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); /* sombra ligera para destacar */
  box-sizing: border-box;
}

/* ------------------------------------------------------------
   2. FORMULARIO
   ------------------------------------------------------------ */
/* El formulario se organiza en columna, con una separación de
   1rem entre cada fila de campos. */
form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem; /* espacio entre filas del formulario */
  margin-bottom: 2rem; /* separación entre el formulario y la tabla */
}

/* Cada fila reparte sus campos en horizontal con flexbox. */
.fila {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  gap: 1rem; /* separación entre los campos de una fila */
}

/* Labels arriba y controles a ancho completo para igualar cada columna. */
.campo {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
  min-width: 0;
}

.campo > label {
  font-weight: 500;
}

.campo input,
.campo select {
  width: 100%;
  height: 2.75rem;
  flex: none;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  box-sizing: border-box;
}

/* Mantiene el error visible tras interactuar hasta que el campo sea válido. */
form input:user-invalid,
form select:user-invalid,
form .incorrecto {
  border: 2px solid var(--color-error) !important;
  background-color: rgba(227, 52, 47, 0.15); /* rojo muy suave de fondo */
}

/* Texto centrado: se aplica al DNI en el formulario y a algunas
   celdas de la tabla. */
.centrado {
  text-align: center;
}

/* Botón principal "Gardar": verde, centrado debajo del formulario. */
.btn-guardar {
  display: block;
  margin: 0 auto; /* lo centra horizontalmente */
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: var(--color-primario);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s; /* suaviza el cambio de color al pasar el ratón */
}

/* Efecto al pasar el ratón: verde un poco más oscuro para dar
   señal visual de que el botón es clicable. */
.btn-guardar:hover {
  background-color: #1b4965;
}

/* ------------------------------------------------------------
  3. LISTA DE PACIENTES (tabla)
   ------------------------------------------------------------ */
/* Contenedor de la tabla: si la tabla no cabe en horizontal
   (p.ej. en ventanas medianas), aparece una barra de scroll
   DENTRO de la tarjeta en lugar de desbordar el contenido
   por el lado derecho de la pantalla. */
.tabla-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse; /* une los bordes de las celdas (sin doble línea) */
  margin-top: 1rem;
  font-size: 0.85rem;
}

th,
td {
  padding: 0.7rem;
  border: 1px solid var(--color-borde);
  text-align: left; /* el texto de las celdas queda a la izquierda */
}

/* Cabecera de la tabla: fondo gris claro y texto centrado. */
th {
  background-color: #f8f9fa;
  text-align: center;
  font-weight: 600;
}

/* Resalta la fila al pasar el ratón para que sea más fácil
  leer la lista de pacientes. */
tbody tr:hover {
  background-color: #f8f9fa;
}

/* Botones de acción (editar ✏️ y eliminar 🗑️): iconos con un
   borde suave que se resaltan al pasar el ratón. */
.btn-accion {
  background: none;
  border: 2px solid var(--color-borde);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
  transition: background-color 0.2s;
}

.btn-accion:hover {
  background-color: #f0f0f0;
}

/* ------------------------------------------------------------
   4. TÍTULOS (h4)
   ------------------------------------------------------------ */
/* Encabezados "Xestión de pacientes" y "Listaxe de pacientes",
   con un fondo verde para que destaquen como título de sección. */
h4 {
  margin-bottom: 1rem; /* separación entre el título y lo que sigue */
  padding: 0.5rem 0.75rem; /* hueco interior para que el fondo no quede pegado */
  border-radius: 4px;
  background-color: var(--color-primario);
  color: white;
  font-weight: 600;
}

/* ------------------------------------------------------------
   5. RESPONSIVE
   En pantallas pequeñas los campos de cada fila se apilan en
   vertical para que no se hagan demasiado estrechos.
   ------------------------------------------------------------ */
@media (max-width: 768px) {
  .xestion-pacientes {
    padding: 1rem;
  }

  .fila {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>
