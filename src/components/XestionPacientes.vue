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

          <!-- El DNI tiene su propio contenedor para poder mostrar
               debajo el mensaje de error cuando es inválido. -->
          <div class="campo-control">
            <input
              v-model="novoPaciente.dnipac"
              :class="{ incorrecto: hayError('dni') }"
              class="centrado"
              type="text"
              required
              @blur="sanitizarDni"
            />

            <span v-if="hayError('dni')" class="mensaxe-erro">
              DNI/NIE inválido
            </span>
          </div>
        </div>

        <div class="campo campo-nome">
          <label>Nome:</label>

          <input
            v-model="novoPaciente.nompac"
            :class="{ incorrecto: hayError('nome') }"
            type="text"
            required
            @blur="sanitizarNome"
          />
        </div>

        <div class="campo campo-apellidos">
          <label>Apellido:</label>

          <input
            v-model="novoPaciente.apelpac"
            :class="{ incorrecto: hayError('apellidos') }"
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
            :class="{ incorrecto: hayError('fecha') }"
            type="date"
            required
          />
        </div>

        <div class="campo campo-correo">
          <label>Correo:</label>
          <input
            v-model="novoPaciente.mailpac"
            :class="{ incorrecto: hayError('correo') }"
            type="email"
            required
          />
        </div>

        <!-- NOTA: este campo estaba antes anidado dentro del campo
             Correo, lo que rompía la maquetación. Lo movimos aquí,
             como hermano, para que los tres campos de la fila
             queden alineados. El tipo correcto para teléfono es "tel".
             Usa el mismo contenedor .campo-control que el DNI para
             mostrar debajo el aviso de validación. -->
        <div class="campo campo-mobil">
          <label>Móbil:</label>

          <div class="campo-control">
            <input
              v-model="novoPaciente.movilpac"
              :class="{ incorrecto: hayError('mobil') }"
              type="tel"
              required
              @blur="sanitizarMobil"
            />

            <span v-if="hayError('mobil')" class="mensaxe-erro">
              Debe comezar por 6 ou 7
            </span>
          </div>
        </div>
      </div>

      <div class="fila">
        <div class="campo campo-direccion">
          <label>Dirección:</label>
          <input
            v-model="novoPaciente.dirpac"
            :class="{ incorrecto: hayError('direccion') }"
            type="text"
            required
          />
        </div>

        <div class="campo campo-provincia">
          <label>Provincia:</label>

          <select
            v-model="novoPaciente.propac"
            :class="{ incorrecto: hayError('localidad') }"
            required
            @change="cargarMunicipios"
          >
            <option value="">-- Escolle unha provincia --</option>
            <option
              v-for="provincia in provincias"
              :key="provincia.id"
              :value="provincia.id"
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
            :class="{ incorrecto: hayError('localidad') }"
            required
          >
            <option value="">-- Escolle un municipio --</option>
            <option
              v-for="municipio in municipios"
              :key="municipio.id"
              :value="municipio.id"
            >
              {{ municipio.nm }}
            </option>
          </select>
        </div>
      </div>

      <div class="fila fila-centrada">
        <div class="campo inline-activo">
          <label>Activo:</label>

          <div class="inline-control">
            <input v-model="novoPaciente.activo" type="checkbox" />
            <span>Activo</span>
          </div>
        </div>

        <div class="campo inline-cuenta">
          <label>Tipo de conta:</label>

          <div class="inline-control radios">
            <label>
              <input
                v-model="novoPaciente.tipoCuenta"
                type="radio"
                value="particular"
              />
              <span>Particular</span>
            </label>

            <label>
              <input
                v-model="novoPaciente.tipoCuenta"
                type="radio"
                value="empresa"
              />
              <span>Empresa</span>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        class="btn-guardar"
        :disabled="novoPaciente.dnipac === '' || novoPaciente.nompac === ''"
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
            <th>Correo</th>
            <th>Provincia</th>
            <th>Activo</th>
            <th>Tipo de conta</th>
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
            <td>{{ u.nompac }}</td>
            <td>{{ u.mailpac }}</td>
            <td>{{ u.propac }}</td>
            <td class="centrado">
              {{ u.activo ? "✅" : "❌" }}
            </td>
            <td>{{ u.tipoCuenta }}</td>

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
import { getPacientes, savePaciente } from "../api/pacientes.js";

const pacientes = ref([]);

const novoPaciente = reactive({
  nompac: "",
  dnipac: "",
  apelpac: "",
  nacipac: "",
  mailpac: "",
  movilpac: "",
  dirpac: "",
  propac: "",
  munipac: "",
  activo: true,
  tipoCuenta: "particular"
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
  municipios.value = await obtenerMunicipios(novoPaciente.propac);
}

/// Zona de métodos ou funcións

async function guardarPaciente() {
  try {
        //tomar el nombre del municipio seleccionado y asignarlo a novoPaciente.munipac
        //y de la provincia seleccionado y asignarlo a novoPaciente.propac
        const provincia = provincias.value.find(
              p => p.id === novoPaciente.propac
          );

          const municipio = municipios.value.find(
            m => m.id === novoPaciente.munipac
          );

          if (!provincia || !municipio) return;

  			const pacienteGuardado = await savePaciente({
            ...novoPaciente,
            propac: provincia.nm,
            munipac: municipio.nm
          });
    		pacientes.value.push(pacienteGuardado);
    		console.log("Paciente gardado correctamente");
        // getPacientes(); // Actualiza la lista de pacientes después de guardar
  } catch (error) {
    console.error("Error ao gardar paciente:", error);
  }
}


function eliminarPaciente(index) {
  pacientes.value.splice(index, 1);
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
  novoPaciente.nompac = capitalizarNome(novoPaciente.nompac);
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

function hayError(campo) {
  if (campo === "dni") {
    return novoPaciente.dnipac !== "" && !esDniCorrecto();
  }

  if (campo === "nome") {
    return novoPaciente.nompac === "";
  }

  if (campo === "correo") {
    return novoPaciente.mailpac === "";
  }

  if (campo === "localidad") {
    return novoPaciente.propac === "";
  }

  // El móbil es válido solo si no está vacío y empieza por 6 o 7.
  if (campo === "mobil") {
    return novoPaciente.movilpac !== "" && !/^[67]/.test(novoPaciente.movilpac);
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
  display: flex;
  width: 100%;
  gap: 1rem; /* separación entre los campos de una fila */
}

/* Fila centrada: se usa para los campos "Activo" y "Tipo de conta". */
.fila-centrada {
  justify-content: center;
}

/* Un campo = label + control, alineados en horizontal.
   El label tiene un ancho fijo para que los inputs queden alineados.

   min-width: 0 → por defecto los item de flex tienen
   "min-width: auto", que impide encoger por debajo del ancho
   natural del input (~170px). Eso hacía que, en ventanas medianas,
   las filas de 3 campos no cupieran y todo se saliera por la
   derecha. Con min-width: 0 el campo puede estrecharse. */
.campo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

/* Ancho relativo de cada campo. La suma de los "flex" de una fila
   reparte entre ellos el ancho disponible:
   - flex: 2 → el doble de ancho que un flex: 1.
   Se le da más ancho al DNI, Correo y Dirección porque sus labels
   son más largos y, en el caso del DNI, debe caber el error debajo. */
.campo-dni {
  flex: 2;
}
.campo-nome {
  flex: 1;
}
.campo-apellidos {
  flex: 1;
}
.campo-fecha {
  flex: 1;
}
.campo-correo {
  flex: 2;
}
.campo-mobil {
  flex: 1;
}
.campo-direccion {
  flex: 2;
}
.campo-provincia {
  flex: 1;
}

/* Solo el label DIRECTO del campo (>.label) recibe ancho fijo.
   Así los labels de los radios, que están más anidados, no se ven
   afectados. */
.campo > label {
  min-width: 80px;
  font-weight: 500;
}

/* Inputs y select del formulario: mismo aspecto para todos.
   min-width: 0 → permite que el input se estreche cuando la fila
   no tiene espacio (si no, el ancho natural del input ~170px forzaba
   el desborde en ventanas medianas). */
.campo input,
.campo select {
  flex: 1;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  box-sizing: border-box;
}

/* Campo inválido: se activa con :class="{ incorrecto: hayError(...) }". */
.incorrecto {
  border: 2px solid var(--color-error) !important;
  background-color: rgba(227, 52, 47, 0.15); /* rojo muy suave de fondo */
}

/* Contenedor especial de los campos con error debajo (DNI y Móbil):
   input + mensaje de error en columna.

   min-height reserva SIEMPRE el hueco del posible mensaje de error
   y justify-content:center centra el contenido dentro de ese alto.
   De esta forma, cuando aparece el aviso, la altura de la fila NO
   cambia y los campos vecinos no se mueven ni se descentran. */
.campo-control {
  flex: 1;
  min-width: 0; /* igual que .campo: permite encoger (evita desbordes) */
  display: flex;
  flex-direction: column;
  justify-content: center; /* centra el contenido en el alto reservado */
  gap: 0.25rem;
  min-height: 3.6rem; /* altura con el hueco del error ya reservado */
}

/* Mensaje de error que se muestra bajo el campo con error. */
.mensaxe-erro {
  color: var(--color-error);
  font-size: 0.8rem;
  font-weight: bold;
}

/* Texto centrado: se aplica al DNI en el formulario y a algunas
   celdas de la tabla. */
.centrado {
  text-align: center;
}

/* Controles en línea: checkbox "Activo" y los dos radios. */
.inline-control {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

/* Cada opción de radio (Particular / Empresa) es un label + radio. */
.radios label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
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
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
