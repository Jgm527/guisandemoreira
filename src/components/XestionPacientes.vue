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
    <!-- El submit llama a guardarPaciente(); los v-model se enlazan a novoPaciente en el script. -->
    <form @submit.prevent="guardarPaciente">
      <div class="fila">
        <div class="campo campo-dni">
          <label>DNI/CIF:</label>

          <!-- ref permite enfocar el DNI desde el script; los botones llaman busqueda y limpieza. -->
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

      <!-- Provincia cambia cargarMunicipios(); el selector de municipio usa su lista resultante. -->
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
    <!-- pacientes se carga al montar la pantalla; la fila usa el registro de la lista. -->
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
// API reactiva, objetos de formulario y evento de inicializacion de Vue.
import { ref, reactive, onMounted } from "vue";
// Catalogo de provincias/municipios que alimenta los selectores de ubicacion.
import { obtenerProvincias, obtenerMunicipios } from "../api/municipios.js";
// Operaciones de lectura y escritura de pacientes en el backend.
import {
  getPacientes,
  savePaciente,
  deletePaciente,
  modifyPaciente,
  getPacienteByDni
} from "../api/pacientes.js";
// Dialogos comunes usados para confirmar acciones o informar de sus resultados.
import {
    alertaExito,
    alertaError,
    alertaInfo,
    alertaConfirmacion,
} from "../utils/alertas.js"

// Registros cargados desde la API y mostrados en la tabla.
const pacientes = ref([]);
// Referencia al input DNI para devolverle el foco cuando sea necesario corregirlo.
const dniInput = ref(null);
// Fuerza la indicacion visual cuando la API rechaza el DNI del formulario.
const errorDniServidor = ref(false);
// Distingue la creacion de un registro de la edicion de uno existente.
const editando = ref(false);
// Evita mostrar el error de correo antes de que el usuario empiece a editarlo.
const mailTocado = ref(false);

// Estado del formulario enlazado desde el template con v-model.
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

// Catalogos independientes: provincia elegida y municipios que le corresponden.
const provincias = ref([]);
const municipios = ref([]);

// Carga en paralelo la lista y las provincias, gestionando cada fallo por separado.
onMounted(async () => {
  const [resultadoPacientes, resultadoProvincias] = await Promise.allSettled([
    getPacientes(),
    obtenerProvincias(),
  ]);

  if (resultadoPacientes.status === "fulfilled") {
    pacientes.value = resultadoPacientes.value;
  } else {
    alertaError(mensaxeDoErro(resultadoPacientes.reason, "No se pudieron cargar los pacientes."));
  }

  if (resultadoProvincias.status === "fulfilled") {
    provincias.value = resultadoProvincias.value;
  } else {
    alertaError(mensaxeDoErro(resultadoProvincias.reason, "No se pudieron cargar las provincias."));
  }
});

// Actualiza los municipios disponibles segun la provincia elegida en el formulario.
async function cargarMunicipios() {
  if (novoPaciente.propac === "") {
    municipios.value = [];
    return;
  }

  // Busca el codigo interno de la provincia a partir del nombre almacenado en el modelo.
  // Objeto de provincia necesario porque el API de municipios recibe su codigo, no el nombre.
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

// Valida el formulario, confirma la accion y crea o actualiza al paciente en el servidor.
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

  // isConfirmed indica si se puede continuar con la escritura en el servidor.
  const confirmacion = await alertaConfirmacion(
    editando.value
      ? "¿Quieres guardar los cambios de este paciente?"
      : "¿Quieres guardar este paciente?",
    editando.value ? "Confirmar cambios" : "Confirmar alta"
  );
  if (!confirmacion.isConfirmed) {
    return;
  }

  // Texto de confirmacion distinto para altas y ediciones.
  let mensajeExito;
  try {
    if (editando.value) {
      // Respuesta del backend usada para sustituir la fila que se acaba de editar.
      const pacienteModificado = await modifyPaciente(novoPaciente.dnipac, novoPaciente);

      // Posicion del paciente actualizado dentro de la lista reactiva.
      const index = pacientes.value.findIndex(
        (p) => p.dnipac === pacienteModificado.dnipac
      );

      if (index !== -1) {
        pacientes.value[index] = pacienteModificado;
      }
      mensajeExito = "El paciente se ha actualizado correctamente.";
    } else {
      // Documento nuevo que se agrega provisionalmente hasta recargar la lista oficial.
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

// Elimina por DNI y quita de la tabla el registro confirmado por el servidor.
async function eliminarPaciente(index) {
  // El indice de la fila identifica el objeto actual dentro de pacientes.value.
  const paciente = pacientes.value[index];
  if (!paciente) {
    alertaError("No se encontró el paciente que intentas eliminar.");
    return;
  }

  // La promesa devuelve isConfirmed para decidir si se elimina o se cancela.
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

// Copia los datos de la fila seleccionada al formulario y carga sus municipios.
async function editarPaciente(index) {
  // Registro seleccionado que se copia al modelo del formulario.
  const paciente = pacientes.value[index];

  Object.assign(novoPaciente, paciente);

  delete novoPaciente._id;
  editando.value = true;

  await cargarMunicipios();
}

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

// Aplica la normalizacion de nombre al campo correspondiente.
function sanitizarNome() {
  novoPaciente.nomepac = capitalizarNome(novoPaciente.nomepac);
}

// Aplica la normalizacion de apellidos al campo correspondiente.
function sanitizarApellidos() {
  novoPaciente.apelpac = capitalizarNome(novoPaciente.apelpac);
}

// Móbil: al SALIR del campo, quita los espacios para que la
// validación "empieza por 6 o 7" sea correcta.
function sanitizarMobil() {
  novoPaciente.movilpac = novoPaciente.movilpac.replace(/\s+/g, "");
}

// Elimina espacios externos y activa la validacion visual tras la interaccion.
function sanitizarMail() {
  novoPaciente.mailpac = novoPaciente.mailpac.trim();
  mailTocado.value = true;
}

// Comprueba el formato basico de correo; el servidor sigue siendo la validacion final.
function validarMail(mail) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(mail ?? "").trim());
}

// Verifica formato y letra de control del DNI espanol antes de enviar el formulario.
function esDniCorrecto() {
  // regex comprueba que tenga ocho numeros y una letra mayuscula antes del calculo.
  const regex = /^\d{8}[A-Z]$/;

  if (!regex.test(novoPaciente.dnipac)) {
    return false;
  }

  // Tabla de letras: el resto de dividir el numero entre 23 elige la letra de control.
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE";

  // Parte numerica del DNI usada para obtener el resto de control.
  const numero = parseInt(novoPaciente.dnipac.substring(0, 8));

  // Posicion de la letra correcta en la tabla anterior.
  const resto = numero % 23;

  // Caracter de control calculado a partir del numero de DNI.
  const letraCorrecta = letras[resto];

  // Caracter de control escrito en la novena posicion del DNI.
  const letraDni = novoPaciente.dnipac.charAt(8);

  return letraDni === letraCorrecta;
}

// Comprueba duplicados en la lista cargada, ignorando diferencias de espacios o mayusculas.
function dniDuplicado() {
  // DNI normalizado para comparar sin depender de mayusculas o espacios.
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

// Restaura todos los campos al tipo y valor inicial, y sale del modo edicion.
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

// Busca en el servidor el paciente cuyo DNI se ha escrito y carga sus datos en el formulario.
async function buscarPaciente() {
  // Copia normalizada para comprobar que se introdujo algun valor antes de llamar a la API.
  const dni = novoPaciente.dnipac.trim().toUpperCase();
  if (!dni) {
    alertaInfo("Introduce un DNI para buscar al paciente.");
    dniInput.value?.focus();
    return;
  }

  sanitizarDni();
  try {
    // Paciente devuelto por el backend para rellenar el formulario de edicion.
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

// Convierte errores Axios/Express en el mensaje comprensible que se presenta al usuario.
function mensaxeDoErro(error, porDefecto) {
  return error.response?.data?.mensaje || error.response?.data?.message || porDefecto;
}

// Devuelve si un campo debe resaltarse por un error de validacion local.
function hayError(campo) {
  if (campo === "dni") {
    return novoPaciente.dnipac !== "" && (!esDniCorrecto() || dniDuplicado());
  }

  return false;
}
</script>
