<template>
  <div class="xestion-pacientes">
    <h4>👥 Xestión de pacientes</h4>

    <!-- El formulario y la tabla comparten novoPaciente y pacientes con el script. -->
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
    <!-- .prevent evita la recarga del navegador y ejecuta la funcion del script.
         v-model mantiene cada campo sincronizado con su propiedad reactiva. -->
    <form @submit.prevent="guardarPaciente">
      <div class="fila">
        <div class="campo campo-dni">
          <label>DNI/CIF:</label>

          <!-- ref permite enfocar el DNI desde el script; :class calcula su estilo
               y los botones ejecutan las funciones indicadas en @click. -->
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
                title="Buscar"
                aria-label="Buscar"
                @click="buscarPaciente"
              >
                🔎
              </button>
              <button
                type="button"
                title="Limpiar"
                aria-label="Limpiar"
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

      <div class="consentimiento-privacidad">
        <label>
          <input
            v-model="novoPaciente.lopdpac"
            type="checkbox"
          >
          Aceptar la
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
        <!-- :disabled impide enviar mientras falten los datos minimos o el consentimiento. -->
        <button
          type="submit"
          class="btn-guardar"
          :disabled="novoPaciente.dnipac === '' ||
            novoPaciente.nomepac === '' ||
            novoPaciente.apelpac === '' ||
            novoPaciente.movilpac === '' ||
            !novoPaciente.lopdpac"
        >
          Guardar
        </button>
        
      </div>
    </form>

    <div class="cabecera-informe">
      <h4>📋 Listaxe de pacientes</h4>
      <button
        class="btn-informe"
        type="button"
        title="Exportar"
        aria-label="Exportar"
        :disabled="pacientes.length === 0"
        @click="exportarPacientes"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v7H6zM18 12h.01" />
        </svg>
      </button>
    </div>

    <!-- La tabla solo se muestra si hay pacientes guardados;
         en caso contrario se muestra el párrafo v-else.

         La tabla va envuelta en .tabla-wrapper: si no cabe en
         horizontal, aparece un scroll DENTRO de la tarjeta en vez
         de desbordar el contenido por el lado derecho. -->
    <!-- v-if muestra la tabla solo si hay datos; v-else presenta el estado vacio.
         v-for crea una fila por paciente y :key ayuda a Vue a identificarla. -->
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

            <!-- Seleccionar fija el paciente en Pinia; editar y eliminar gestionan la fila. -->
            <td class="centrado">
              <button
                class="btn-accion"
                title="Seleccionar"
                aria-label="Seleccionar"
                :aria-pressed="pacienteStore.idPaciente === u._id"
                @click="seleccionarPaciente(u)"
              >
                {{ pacienteStore.idPaciente === u._id ? "✅" : "👤" }}
              </button>

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
// ref crea valores reactivos simples o listas; reactive hace reactivo el objeto
// del formulario. onMounted ejecuta la carga inicial cuando Vue monta el componente.
import { ref, reactive, onMounted } from "vue";
// Catalogo de provincias/municipios que alimenta los selectores de ubicacion.
import { obtenerProvincias, obtenerMunicipios } from "../api/municipios.js";
// Pinia: libreria oficial de Vue para el manejo del estado global de la aplicacion.
import { usepacienteStore } from "../store/pacienteStore.js";
import { generarPDF } from "../utils/pdf.js";
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

// En la plantilla se leen como pacientes; desde el script se accede con .value.
const pacientes = ref([]);
// Referencia al input DNI para devolverle el foco cuando sea necesario corregirlo.
const dniInput = ref(null);
// Fuerza la indicacion visual cuando la API rechaza el DNI del formulario.
const errorDniServidor = ref(false);
// Distingue la creacion de un registro de la edicion de uno existente.
const editando = ref(false);
// Evita mostrar el error de correo antes de que el usuario empiece a editarlo.
const mailTocado = ref(false);

// Objeto reactivo enlazado campo a campo con v-model en la plantilla.
// Sus propiedades deben coincidir con los nombres que espera la API.
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
const pacienteStore = usepacienteStore();

// Comparte el paciente seleccionado con otras pantallas mediante el store de Pinia.
function seleccionarPaciente(paciente) {
  pacienteStore.seleccionarPaciente(paciente);
}

async function exportarPacientes() {
  try {
    await generarPDF({
      titulo: "Listado de pacientes",
      cabeceras: ["DNI", "Apellidos", "Nombre", "Móvil"],
      filas: pacientes.value.map((paciente) => [
        paciente.dnipac ?? "",
        paciente.apelpac ?? "",
        paciente.nomepac ?? "",
        paciente.movilpac ?? "",
      ]),
      nombreArchivo: "listado_pacientes.pdf",
    });
  } catch (error) {
    alertaError(mensaxeDoErro(error, "No se pudo generar el informe de pacientes."));
  }
}

// onMounted es el punto de entrada para pedir los datos iniciales.
// Promise.allSettled permite recibir ambas respuestas aunque falle una de las peticiones.
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

// La API de municipios necesita el identificador de provincia, no su nombre.
// Se busca ese identificador y se reemplaza la lista mostrada en el segundo selector.
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

// Flujo de guardado: normalizar y validar datos, pedir confirmacion, llamar a la
// operacion adecuada de la API y actualizar la lista que se muestra en pantalla.
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

  // La promesa de confirmacion devuelve isConfirmed; si se cancela, no se escribe nada.
  const confirmacion = await alertaConfirmacion(
    editando.value
      ? "¿Quieres guardar los cambios de este paciente?"
      : "¿Quieres guardar este paciente?",
    editando.value ? "Confirmar cambios" : "Confirmar alta"
  );
  if (!confirmacion.isConfirmed) {
    return;
  }

  // El mensaje se asigna en cada rama para informar del resultado despues del try.
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
      if (String(pacienteStore.idPaciente) === String(pacienteModificado._id)) {
        seleccionarPaciente(pacienteModificado);
      }
      mensajeExito = "El paciente se ha actualizado correctamente.";
    } else {
      // Documento nuevo que se agrega provisionalmente hasta recargar la lista oficial.
      const pacienteGuardado = await savePaciente(novoPaciente);
      pacientes.value.push(pacienteGuardado);
      mensajeExito = "El paciente se ha guardado correctamente.";
    }

    editando.value = true;

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

// Primero confirma la accion, luego elimina en el servidor y solo si funciona
// quita la misma fila de la lista reactiva.
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
    if (String(pacienteStore.idPaciente) === String(paciente._id)) {
      pacienteStore.limpiarPaciente();
    }
    alertaExito("El paciente se ha eliminado correctamente.");
  } catch (error) {
    console.error("Error ao eliminar paciente:", error);
    alertaError(mensaxeDoErro(error, "No se pudo eliminar el paciente."));
  }
}

// Carga una fila en el formulario para editarla. Object.assign conserva el objeto
// reactivo y copia sus propiedades; _id se elimina porque el formulario no lo edita.
async function editarPaciente(index) {
  // Registro seleccionado que se copia al modelo del formulario.
  const paciente = pacientes.value[index];

  seleccionarPaciente(paciente);
  Object.assign(novoPaciente, paciente);

  delete novoPaciente._id;
  editando.value = true;

  await cargarMunicipios();
}

// Normaliza el DNI al salir del campo para comparar y enviar siempre el mismo formato.
function sanitizarDni() {
  novoPaciente.dnipac = novoPaciente.dnipac.trim().toUpperCase();
}

// Convierte cada palabra a inicial mayuscula y resto minuscula.
// Se reutiliza para el nombre y los apellidos.
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

// Comprueba un formato basico de correo en cliente para dar feedback inmediato;
// la validacion del servidor sigue siendo necesaria.
function validarMail(mail) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(mail ?? "").trim());
}

// Comprueba primero la estructura del DNI y despues calcula su letra de control.
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

// Busca el DNI en la lista ya cargada tras normalizarlo. Al editar, no cuenta
// como duplicado el mismo registro que ya estaba guardado.
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

// Vacía el formulario conservando el tipo de cada propiedad (por ejemplo,
// lopdpac debe seguir siendo booleano) y vuelve al modo de alta.
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

// Consulta un paciente por DNI y, si existe, copia sus datos al formulario
// para editarlo. Los errores 404 se muestran como "no encontrado".
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

    // La busqueda tambien establece la seleccion global que necesita la pestaña de citas.
    seleccionarPaciente(paciente);
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

// La API puede devolver el mensaje con distinta clave; usa por defecto un texto
// local si la respuesta no incluye ninguno.
function mensaxeDoErro(error, porDefecto) {
  return error.response?.data?.mensaje || error.response?.data?.message || porDefecto;
}

// Centraliza las condiciones de error visual que usa :class en los campos.
function hayError(campo) {
  if (campo === "dni") {
    return novoPaciente.dnipac !== "" && (!esDniCorrecto() || dniDuplicado());
  }

  return false;
}
</script>
