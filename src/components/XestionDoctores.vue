<template>
  <!-- Pantalla de alta/edicion y listado de doctores. -->
  <section class="xestion-doctores">
    <h4>💊 Xestión de doctores</h4>

    <!-- El submit llama a guardarDoctor(); editando determina si crea o modifica. -->
    <form @submit.prevent="guardarDoctor">
      <!-- v-model sincroniza controles con novoDoctor, definido como objeto reactive en el script. -->
      <div class="fila">
        <div class="campo campo-id">
          <label for="iddoc">ID:</label>
          <input
            id="iddoc"
            :value="novoDoctor._id"
            :placeholder="editando ? '' : 'Xérase ao gardar'"
            class="centrado"
            type="text"
            disabled
          />
        </div>

        <div class="campo campo-nome">
          <label for="nomedoc">Nome:</label>
          <input
            id="nomedoc"
            v-model.trim="novoDoctor.nomedoc"
            type="text"
            required
            @blur="novoDoctor.nomedoc = capitalizarNome(novoDoctor.nomedoc)"
          />
        </div>

        <div class="campo campo-apelidos">
          <label for="apeldoc">Apelidos:</label>
          <input
            id="apeldoc"
            v-model.trim="novoDoctor.apeldoc"
            type="text"
            required
            @blur="novoDoctor.apeldoc = capitalizarNome(novoDoctor.apeldoc)"
          />
        </div>
      </div>

      <!-- Eventos de entrada llaman a sanitizarMobil/sanitizarMail y las reglas usan valores computed. -->
      <div class="fila">
        <div class="campo campo-especialidade">
          <label for="espedoc">Especialidade:</label>
          <select
            id="espedoc"
            v-model="novoDoctor.espedoc"
            required
            :disabled="especialidades.length === 0"
          >
            <option value="">
              -- Escolle unha especialidade --
            </option>
            <option
              v-for="especialidade in especialidades"
              :key="especialidade.id"
              :value="especialidade.nm"
            >
              {{ especialidade.nm }}
            </option>
          </select>
        </div>

        <div class="campo campo-mobil">
          <label for="movildoc">Móbil:</label>
          <input
            id="movildoc"
            v-model.trim="novoDoctor.movildoc"
            type="tel"
            inputmode="numeric"
            pattern="[67][0-9]{8}"
            title="Introduce 9 díxitos; debe comezar por 6 ou 7"
            required
            :aria-invalid="mobilInvalido"
            :class="{ incorrecto: mobilInvalido }"
            @input="sanitizarMobil"
            @blur="sanitizarMobil"
          />
          <small v-if="mobilInvalido" class="erro-campo">
            Introduce 9 díxitos e comeza por 6 ou 7.
          </small>
        </div>

        <div class="campo campo-correo">
          <label for="maildoc">Correo (opcional):</label>
          <input
            id="maildoc"
            v-model.trim="novoDoctor.maildoc"
            type="email"
            :aria-invalid="mailInvalido"
            :class="{ incorrecto: mailInvalido }"
            @input="mailTocado = true"
            @blur="sanitizarMail"
          />
          <small v-if="mailInvalido" class="erro-campo">
            Introduce un correo electrónico válido.
          </small>
        </div>
      </div>

      <div class="fila fila-colexiado">
        <fieldset class="campo campo-colexiado">
          <!-- El usuario debe elegir una de las dos opciones de colegiacion. -->
          <legend>Colexiado:</legend>
          <span>
            <label>
              <input v-model="novoDoctor.coledoc" type="radio" value="SI" required>
              Si
            </label>
            <label>
              <input v-model="novoDoctor.coledoc" type="radio" value="NO" required>
              Non
            </label>
          </span>
        </fieldset>
      </div>

      <p v-if="erro" class="mensaxe-erro" role="alert">{{ erro }}</p>

      <!-- Un solo formulario sirve para altas y ediciones; los botones varian segun editando. -->
      <div class="form-acciones">
        <button type="submit" class="btn-guardar">
          Guardar
        </button>
        <button v-if="editando" type="button" class="btn-secundario" @click="limparFormulario">
          Cancelar
        </button>
        <button v-else type="reset" class="btn-secundario" @click="limparFormulario">
          Limpiar
        </button>
      </div>
    </form>

    <!-- Tabla con las acciones disponibles para cada doctor guardado. -->
    <div class="cabecera-informe">
      <h4>Listaxe de doctores</h4>
      <button
        class="btn-informe"
        type="button"
        title="Exportar"
        aria-label="Exportar"
        :disabled="doctores.length === 0"
        @click="exportarDoctores"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v7H6zM18 12h.01" />
        </svg>
      </button>
    </div>

    <!-- doctores se rellena con cargarDoctores(); v-for crea una fila por documento. -->
    <div v-if="doctores.length" class="tabla-doctores">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Apelidos</th>
            <th>Colexiado</th>
            <th>Móbil</th>
            <th>Correo</th>
            <th>Especialidade</th>
            <th>Selección</th>
            <th>Accións</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doctor in doctores" :key="doctor._id">
            <td class="centrado">{{ doctor._id }}</td>
            <td>{{ doctor.nomedoc }}</td>
            <td>{{ doctor.apeldoc }}</td>
            <td class="centrado">{{ doctor.coledoc }}</td>
            <td>{{ doctor.movildoc }}</td>
            <td>{{ doctor.maildoc || "—" }}</td>
            <td>{{ doctor.espedoc }}</td>
            <td class="centrado">
              <button
                class="btn-accion"
                type="button"
                title="Seleccionar"
                aria-label="Seleccionar"
                :aria-pressed="doctorStore.idDoctor === doctor._id"
                @click="seleccionarDoctor(doctor)"
              >
                {{ doctorStore.idDoctor === doctor._id ? "✅" : "👤" }}
              </button>
            </td>
            <!-- Los eventos reciben el doctor actual para editarlo o eliminarlo. -->
            <td class="celda-acciones">
              <button class="btn-accion" type="button" title="Editar" @click="editarDoctor(doctor)">
                ✏️
              </button>
              <button class="btn-accion" type="button" title="Eliminar" @click="eliminarDoctor(doctor)">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="lista-vacia">Non hai doctores cargados.</p>
  </section>
</template>

<script setup>
// Reactividad y ciclo de vida de Vue usados por el formulario y el listado.
import { computed, onMounted, reactive, ref } from "vue";
// Operaciones HTTP sobre la coleccion de doctores.
import {
  deleteDoctor,
  getDoctores,
  modifyDoctor,
  saveDoctor,
  getDoctorByEspecialidad,
} from "../api/doctores.js";
// Catalogo que alimenta el selector de especialidades.
import { obtenerEspecialidades } from "../api/especialidades.js";
// Store compartido con la pantalla de citas.
import { useDoctorStore } from "../store/doctorStore.js";
import { generarPDF } from "../utils/pdf.js";
// Dialogos reutilizables para confirmar acciones y comunicar resultados.
import {
  alertaConfirmacion,
  alertaError,
  alertaExito,
} from "../utils/alertas.js";

// Devuelve un formulario limpio. Se usa al inicializarlo y despues de guardar/cancelar.
const doctorVacio = () => ({
  nomedoc: "",
  apeldoc: "",
  coledoc: "",
  movildoc: "",
  maildoc: "",
  espedoc: "",
});

// Listas reactivas usadas por la tabla y los selectores de la pantalla.
const doctores = ref([]);
const especialidades = ref([]);
const doctorStore = useDoctorStore();
// Formulario editable: reactive permite enlazar cada campo con v-model directamente.
const novoDoctor = reactive(doctorVacio());
// Indica si el submit debe crear un doctor o actualizar el seleccionado.
const editando = ref(false);
// Mensaje persistente de error que tambien se muestra junto al formulario.
const erro = ref("");
// Recuerda si el usuario ya interactuo con el correo antes de mostrar su validacion.
const mailTocado = ref(false);
// Valida reactivamente que el movil tenga nueve digitos y empiece por 6 o 7.
const mobilInvalido = computed(
  () => novoDoctor.movildoc !== "" && !/^[67]\d{8}$/.test(novoDoctor.movildoc)
);
// Valida el correo solo despues de que el usuario haya tocado el campo opcional.
const mailInvalido = computed(
  () => mailTocado.value && novoDoctor.maildoc !== "" && !validarMail(novoDoctor.maildoc)
);

// Carga los doctores y las especialidades cuando Vue termina de montar la pantalla.
onMounted(async () => {
  doctores.value = await cargarDoctores();
  especialidades.value = await cargarEspecialidades();
});

// Guarda el doctor seleccionado para que la pantalla de citas pueda usar su ID.
function seleccionarDoctor(doctor) {
  doctorStore.seleccionarDoctor(doctor);
}

async function exportarDoctores() {
  try {
    await generarPDF({
      titulo: "Listado de doctores",
      cabeceras: ["ID", "Apellidos", "Nombre", "Móvil", "Especialidad"],
      filas: doctores.value.map((doctor) => [
        doctor._id ?? "",
        doctor.apeldoc ?? "",
        doctor.nomedoc ?? "",
        doctor.movildoc ?? "",
        doctor.espedoc ?? "",
      ]),
      nombreArchivo: "listado_doctores.pdf",
      orientacion: "landscape",
    });
  } catch (error) {
    alertaError(mensaxeDoErro(error, "No se pudo generar el informe de doctores."));
  }
}

// Obtiene el catalogo del backend; el array vacio deja el selector inhabilitado si falla.
async function cargarEspecialidades() {
  try {
    return await obtenerEspecialidades();
  } catch (error) {
    erro.value = mensaxeDoErro(error, "Non foi posible cargar as especialidades.");
    alertaError(erro.value);
    return [];
  }
}

// Recupera la lista actualizada de doctores para la tabla.
async function cargarDoctores() {
  try {
    return await getDoctores();
  } catch (error) {
    erro.value = mensaxeDoErro(error, "Non foi posible cargar os doctores.");
    alertaError(erro.value);
    return [];
  }
}

// Valida, confirma y crea o actualiza el doctor segun el modo actual del formulario.
async function guardarDoctor() {
  erro.value = "";
  novoDoctor.maildoc = novoDoctor.maildoc.trim();
  mailTocado.value = true;
  if (!validarMail(novoDoctor.maildoc)) {
    erro.value = "Introduce un correo electrónico válido o deja el campo vacío.";
    alertaError(erro.value, "Datos no válidos");
    return;
  }

  if (!/^[67]\d{8}$/.test(novoDoctor.movildoc)) {
    erro.value = "O móbil debe ter 9 díxitos e comezar por 6 ou 7.";
    alertaError(erro.value, "Datos no válidos");
    return;
  }

  // La peticion solo se envia despues de que el usuario confirme la operacion.
  const confirmacion = await alertaConfirmacion(
    editando.value
      ? "¿Quieres guardar los cambios de este doctor?"
      : "¿Quieres guardar este doctor?",
    editando.value ? "Confirmar cambios" : "Confirmar alta"
  );
  if (!confirmacion.isConfirmed) {
    return;
  }

  try {
    // Copia el formulario para enviar un objeto independiente al modulo de API.
    const estabaEditando = editando.value;
    const datosDoctor = { ...novoDoctor };
    if (estabaEditando) {
      const doctorModificado = await modifyDoctor(novoDoctor._id, datosDoctor);
      Object.assign(novoDoctor, doctorModificado);
      if (String(doctorStore.idDoctor) === String(doctorModificado._id)) {
        seleccionarDoctor(doctorModificado);
      }
    } else {
      const doctorGuardado = await saveDoctor(datosDoctor);
      novoDoctor._id = doctorGuardado._id;
    }
    editando.value = true;
    await alertaExito(
      estabaEditando ? "O doctor actualizouse correctamente." : "O doctor gardouse correctamente."
    );
    doctores.value = await cargarDoctores();
  } catch (error) {
    erro.value = mensaxeDoErro(error, "Non foi posible gardar o doctor.");
    alertaError(erro.value);
  }
}

// Copia un doctor existente al formulario y activa el modo de edicion.
function editarDoctor(doctor) {
  seleccionarDoctor(doctor);
  Object.assign(novoDoctor, doctorVacio(), {
    _id: doctor._id ?? "",
    nomedoc: doctor.nomedoc ?? "",
    apeldoc: doctor.apeldoc ?? "",
    coledoc: doctor.coledoc ?? "",
    movildoc: doctor.movildoc ?? "",
    maildoc: doctor.maildoc ?? "",
    espedoc: doctor.espedoc ?? "",
  });
  erro.value = "";
  editando.value = true;
}

// Solicita confirmacion antes de eliminar y refresca la lista si el servidor responde bien.
async function eliminarDoctor(doctor) {
  // La respuesta determina si se continua o se cancela la eliminacion.
  const confirmacion = await alertaConfirmacion(
    `Queres eliminar o doctor ${doctor.nomedoc} ${doctor.apeldoc}?`,
    "Eliminar doctor"
  );
  if (!confirmacion.isConfirmed) {
    return;
  }

  erro.value = "";
  try {
    await deleteDoctor(doctor._id);
    if (String(doctorStore.idDoctor) === String(doctor._id)) {
      doctorStore.limpiarDoctor();
    }
    doctores.value = await cargarDoctores();
    if (editando.value && novoDoctor.iddoc === doctor._id) {
      limparFormulario();
    }
    alertaExito("O doctor eliminouse correctamente.");
  } catch (error) {
    erro.value = mensaxeDoErro(error, "Non foi posible eliminar o doctor.");
    alertaError(erro.value);
  }
}

// Restaura los valores iniciales y elimina errores y estado de edicion.
function limparFormulario() {
  Object.assign(novoDoctor, doctorVacio());
  editando.value = false;
  erro.value = "";
}

// Normaliza nombres propios para que cada palabra empiece en mayuscula.
function capitalizarNome(texto) {
  return texto
    .trim()
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (coincidencia, espazo, letra) => espazo + letra.toUpperCase());
}

// Elimina espacios del movil tanto en el evento del input como en el modelo reactivo.
function sanitizarMobil(event) {
  // Valor normalizado que se sincroniza tanto con el input como con el modelo Vue.
  const mobil = event.target.value.replace(/\s+/g, "");
  event.target.value = mobil;
  novoDoctor.movildoc = mobil;
}

// Recorta espacios del correo y permite mostrar despues su mensaje de validacion.
function sanitizarMail() {
  novoDoctor.maildoc = novoDoctor.maildoc.trim();
  mailTocado.value = true;
}

// Acepta el correo vacio porque es opcional; si se rellena, comprueba un formato basico.
function validarMail(mail) {
  // Texto sin espacios externos antes de comprobar el formato.
  const correo = String(mail ?? "").trim();
  return correo === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo);
}

// Extrae el mensaje enviado por Express y usa el texto alternativo si no existe.
function mensaxeDoErro(error, porDefecto) {
  return error.response?.data?.mensaje || error.response?.data?.message || porDefecto;
}
</script>
