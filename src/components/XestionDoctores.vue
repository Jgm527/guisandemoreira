<template>
  <section class="xestion-doctores">
    <h4>💊 Xestión de doctores</h4>

    <form @submit.prevent="guardarDoctor">
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

      <div class="fila">
        <fieldset class="campo campo-colexiado">
          <legend>Colexiado:</legend>
          <label>
            <input v-model="novoDoctor.coledoc" type="radio" value="SI" required />
            Si
          </label>
          <label>
            <input v-model="novoDoctor.coledoc" type="radio" value="NO" required />
            Non
          </label>
        </fieldset>

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

      <div class="fila">
        <div class="campo campo-especialidade">
          <label for="especdoc">Especialidade:</label>
          <select
            id="especdoc"
            v-model="novoDoctor.especdoc"
            required
            :disabled="especialidades.length === 0"
          >
            <option value="">-- Escolle unha especialidade --</option>
            <option
              v-for="especialidade in especialidades"
              :key="especialidade.id"
              :value="especialidade.nm"
            >
              {{ especialidade.nm }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="erro" class="mensaxe-erro" role="alert">{{ erro }}</p>

      <div class="form-acciones">
        <button type="submit" class="btn-guardar">
          {{ editando ? "Gardar cambios" : "Gardar doctor" }}
        </button>
        <button v-if="editando" type="button" class="btn-secundario" @click="limparFormulario">
          Cancelar edición
        </button>
        <button v-else type="reset" class="btn-secundario" @click="limparFormulario">
          Limpar formulario
        </button>
      </div>
    </form>

    <h4>Listaxe de doctores</h4>

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
            <td>{{ doctor.especdoc }}</td>
            <td class="celda-acciones">
              <button class="btn-accion" type="button" title="Editar doctor" @click="editarDoctor(doctor)">
                ✏️
              </button>
              <button class="btn-accion" type="button" title="Eliminar doctor" @click="eliminarDoctor(doctor)">
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
import { computed, onMounted, reactive, ref } from "vue";
import {
  deleteDoctor,
  getDoctores,
  modifyDoctor,
  saveDoctor,
  getDoctorByEspecialidad,
} from "../api/doctores.js";
import { obtenerEspecialidades } from "../api/especialidades.js";
import {
  alertaConfirmacion,
  alertaError,
  alertaExito,
} from "../utils/alertas.js";

const doctorVacio = () => ({
  nomedoc: "",
  apeldoc: "",
  coledoc: "",
  movildoc: "",
  maildoc: "",
  especdoc: "",
});

const doctores = ref([]);
const especialidades = ref([]);
const novoDoctor = reactive(doctorVacio());
const editando = ref(false);
const erro = ref("");
const mailTocado = ref(false);
const mobilInvalido = computed(
  () => novoDoctor.movildoc !== "" && !/^[67]\d{8}$/.test(novoDoctor.movildoc)
);
const mailInvalido = computed(
  () => mailTocado.value && novoDoctor.maildoc !== "" && !validarMail(novoDoctor.maildoc)
);

onMounted(async () => {
  doctores.value = await cargarDoctores();
  especialidades.value = await cargarEspecialidades();
});

async function cargarEspecialidades() {
  try {
    return await obtenerEspecialidades();
  } catch (error) {
    erro.value = mensaxeDoErro(error, "Non foi posible cargar as especialidades.");
    alertaError(erro.value);
    return [];
  }
}

async function cargarDoctores() {
  try {
    return await getDoctores();
  } catch (error) {
    erro.value = mensaxeDoErro(error, "Non foi posible cargar os doctores.");
    alertaError(erro.value);
    return [];
  }
}

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
    const datosDoctor = { ...novoDoctor };
    if (editando.value) {
      await modifyDoctor(novoDoctor._id, datosDoctor);
    } else {
      await saveDoctor(datosDoctor);
    }
    await alertaExito(
      editando.value ? "O doctor actualizouse correctamente." : "O doctor gardouse correctamente."
    );
    limparFormulario();
    doctores.value = await cargarDoctores();
  } catch (error) {
    erro.value = mensaxeDoErro(error, "Non foi posible gardar o doctor.");
    alertaError(erro.value);
  }
}

function editarDoctor(doctor) {
  Object.assign(novoDoctor, doctorVacio(), {
    _id: doctor._id ?? "",
    nomedoc: doctor.nomedoc ?? "",
    apeldoc: doctor.apeldoc ?? "",
    coledoc: doctor.coledoc ?? "",
    movildoc: doctor.movildoc ?? "",
    maildoc: doctor.maildoc ?? "",
    especdoc: doctor.especdoc ?? "",
  });
  erro.value = "";
  editando.value = true;
}

async function eliminarDoctor(doctor) {
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

function limparFormulario() {
  Object.assign(novoDoctor, doctorVacio());
  editando.value = false;
  erro.value = "";
}

function capitalizarNome(texto) {
  return texto
    .trim()
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (coincidencia, espazo, letra) => espazo + letra.toUpperCase());
}

function sanitizarMobil(event) {
  const mobil = event.target.value.replace(/\s+/g, "");
  event.target.value = mobil;
  novoDoctor.movildoc = mobil;
}

function sanitizarMail() {
  novoDoctor.maildoc = novoDoctor.maildoc.trim();
  mailTocado.value = true;
}

function validarMail(mail) {
  const correo = String(mail ?? "").trim();
  return correo === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo);
}

function mensaxeDoErro(error, porDefecto) {
  return error.response?.data?.mensaje || error.response?.data?.message || porDefecto;
}
</script>

<style scoped>
.xestion-doctores {
  width: 100%;
  min-width: 0;
  padding: 2rem;
  box-sizing: border-box;
  background-color: var(--color-tarjeta);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 2rem;
}

.fila {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
}

.campo {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
  min-width: 0;
}

.campo > label,
.campo legend {
  font-weight: 500;
}

.campo input:not([type="radio"]) {
  width: 100%;
  height: 2.75rem;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  box-sizing: border-box;
}

.campo select {
  width: 100%;
  height: 2.75rem;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  box-sizing: border-box;
  background-color: white;
}

.campo select:disabled {
  background-color: #f1f3f4;
  color: #555;
}

.campo input:disabled {
  background-color: #f1f3f4;
  color: #555;
}

.campo input.incorrecto {
  border: 2px solid var(--color-error);
}

.erro-campo {
  color: var(--color-error);
}

.campo-colexiado {
  margin: 0;
  padding: 0;
  border: 0;
}

.campo-colexiado label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.75rem;
  margin-right: 1rem;
}

.centrado {
  text-align: center;
}

.form-acciones {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn-guardar,
.btn-secundario {
  min-height: 2.6rem;
  padding: 0.6rem 1.25rem;
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.btn-guardar {
  background-color: var(--color-primario);
  color: white;
}

.btn-guardar:hover {
  background-color: #1b4965;
}

.btn-secundario {
  border: 1px solid var(--color-borde);
  background: white;
  color: inherit;
}

.btn-secundario:hover,
.btn-accion:hover {
  background-color: #f0f0f0;
}

.mensaxe-erro {
  margin: 0;
  color: var(--color-error);
}

.tabla-doctores {
  overflow-x: auto;
}

table {
  width: 100%;
  margin-top: 1rem;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th,
td {
  padding: 0.7rem;
  border: 1px solid var(--color-borde);
  text-align: left;
}

th {
  background-color: #f8f9fa;
  text-align: center;
  font-weight: 600;
}

tbody tr:hover {
  background-color: #f8f9fa;
}

.celda-acciones {
  white-space: nowrap;
  text-align: center;
}

.btn-accion {
  margin: 0 0.15rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  background: none;
  cursor: pointer;
}

.lista-vacia {
  margin-top: 1rem;
}

h4 {
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  background-color: var(--color-primario);
  color: white;
  font-weight: 600;
}

@media (max-width: 768px) {
  .xestion-doctores {
    padding: 1rem;
  }

  .fila {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .form-acciones {
    flex-wrap: wrap;
  }
}
</style>