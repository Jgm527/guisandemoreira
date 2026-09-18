<template>
  <div class="xestion-usuarios">
    <h4>👥 Xestión de usuarios</h4>

    <!-- ============================================================
         FORMULARIO DE ALTA DE USUARIO
         ============================================================
         @submit.prevent evita que el navegador recargue la página
         al enviar el formulario; llamamos a gardarUsuario().
         Cada campo se agrupa en una .fila (una línea horizontal)
         y dentro de un .campo (label + input).

         Sanitización (limpieza de datos) con @blur: se ejecuta al
         SALIR del campo para normalizar lo escrito:
         - DNI       → la letra final pasa a mayúscula.
         - Nome      → primera letra de cada palabra en mayúscula.
         - Apellidos → igual que Nome.
         - Móbil     → se quitan los espacios (debe empezar por 6 o 7). -->
    <form @submit.prevent="gardarUsuario">
      <div class="fila">
        <div class="campo campo-dni">
          <label>DNI/CIF:</label>

          <!-- El DNI tiene su propio contenedor para poder mostrar
               debajo el mensaje de error cuando es inválido. -->
          <div class="campo-control">
            <input
              v-model="novoUsuario.dni"
              :class="{ incorrecto: hayError('dni') }"
              class="centrado"
              type="text"
              required
              @blur="sanitizarDni"
            >

            <span
              v-if="hayError('dni')"
              class="mensaxe-erro"
            >
              DNI/NIE inválido
            </span>
          </div>
        </div>

        <div class="campo campo-nome">
          <label>Nome:</label>

          <input
            v-model="novoUsuario.nome"
            :class="{ incorrecto: hayError('nome') }"
            type="text"
            required
            @blur="sanitizarNome"
          >
        </div>

        <div class="campo campo-apellidos">
          <label>Apellido:</label>

          <input
            v-model="novoUsuario.apellidos"
            :class="{ incorrecto: hayError('apellidos') }"
            type="text"
            required
            @blur="sanitizarApellidos"
          >
        </div>
      </div>

      <div class="fila">
        <div class="campo campo-fecha">
          <label>Fecha:</label>
          <input
            v-model="novoUsuario.fecha"
            :class="{ incorrecto: hayError('fecha') }"
            type="date"
            required
          >
        </div>

        <div class="campo campo-correo">
          <label>Correo:</label>
          <input
            v-model="novoUsuario.correo"
            :class="{ incorrecto: hayError('correo') }"
            type="email"
            required
          >
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
              v-model="novoUsuario.mobil"
              :class="{ incorrecto: hayError('mobil') }"
              type="tel"
              required
              @blur="sanitizarMobil"
            >

            <span
              v-if="hayError('mobil')"
              class="mensaxe-erro"
            >
              Debe comezar por 6 ou 7
            </span>
          </div>
        </div>
      </div>

      <div class="fila">
        <div class="campo campo-direccion">
          <label>Dirección:</label>
          <input
            v-model="novoUsuario.direccion"
            :class="{ incorrecto: hayError('direccion') }"
            type="text"
            required
          >
        </div>

        <div class="campo campo-provincia">
          <label>Provincia:</label>

          <select
            v-model="novoUsuario.provincia"
            :class="{ incorrecto: hayError('provincia') }"
          >
            <option value="">
              -- Escolle unha provincia --
            </option>
            <option
            v-for="provincia in provincias"
            :key = "provincia.id"
            :value = "provincia.nome"
            >{{ provincia.nome }}</option>
          </select>
        </div>
      </div>

      <div class="fila fila-centrada">
        <div class="campo inline-activo">
          <label>Activo:</label>

          <div class="inline-control">
            <input
              v-model="novoUsuario.activo"
              type="checkbox"
            >
            <span>Activo</span>
          </div>
        </div>

        <div class="campo inline-cuenta">
          <label>Tipo de conta:</label>

          <div class="inline-control radios">
            <label>
              <input
                v-model="novoUsuario.tipoCuenta"
                type="radio"
                value="particular"
              >
              <span>Particular</span>
            </label>

            <label>
              <input
                v-model="novoUsuario.tipoCuenta"
                type="radio"
                value="empresa"
              >
              <span>Empresa</span>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        class="btn-guardar"
        :disabled="novoUsuario.dni === '' || novoUsuario.nome === ''"
      >
        Gardar
      </button>
    </form>

    <h4>📋 Listaxe de usuarios</h4>

    <!-- La tabla solo se muestra si hay usuarios guardados;
         en caso contrario se muestra el párrafo v-else. -->
    <table v-if="usuarios.length > 0">
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
        <tr
          v-for="(u, index) in usuarios"
          :key="index"
        >
          <td class="centrado">
            {{ index + 1 }}
          </td>
          <td class="centrado">
            {{ u.dni }}
          </td>
          <td>{{ u.nome }}</td>
          <td>{{ u.correo }}</td>
          <td>{{ u.provincia }}</td>
          <td class="centrado">
            {{ u.activo ? "✅" : "❌" }}
          </td>
          <td>{{ u.tipoCuenta }}</td>

          <!-- Botones de acción: editar y eliminar el usuario. -->
          <td class="centrado">
            <button
              class="btn-accion"
              title="Editar"
              @click="editarUsuario(index)"
            >
              ✏️
            </button>

            <button
              class="btn-accion"
              title="Eliminar"
              @click="eliminarUsuario(index)"
            >
              🗑️
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>
      Non hai usuarios cargados.
    </p>
  </div>
</template>

<script setup>
/// Zona de declaracións

import { ref, reactive, onMounted } from "vue";

const usuarios = ref([]);

const novoUsuario = reactive({
  dni: "",
  nome: "",
  correo: "",
  provincia: "",
  activo: false,
  tipoCuenta: "",
});

/// Zona de ciclo de vida

const provincias = ref([])

onMounted(() => {
  usuarios.value = [
    {
      dni: "A000000C",
      nome: "Soldaduras SL",
      correo: "soldadura@email.com",
      provincia: "A Coruña",
      activo: true,
      tipoCuenta: "empresa",
    },
    {
      dni: "0000000C",
      nome: "María Pérez",
      correo: "maria@email.com",
      provincia: "Lugo",
      activo: false,
      tipoCuenta: "particular",
    },
    {
      dni: "B1234567D",
      nome: "Xosé López",
      correo: "xose@email.com",
      provincia: "Ourense",
      activo: true,
      tipoCuenta: "particular",
    },
    {
      dni: "C9876543E",
      nome: "Construcións Modernas",
      correo: "construcion@email.com",
      provincia: "Pontevedra",
      activo: true,
      tipoCuenta: "empresa",
    },
  ];

  provincias.value = [
    {id: 1, nome: "A Coruña"},
    {id: 2, nome: "Pontevedra"},
    {id: 3, nome: "Lugo"},
    {id: 4, nome: "Ourense"}
  ]
});

/// Zona de métodos ou funcións

function gardarUsuario() {
  usuarios.value.push({ ...novoUsuario });

  Object.assign(novoUsuario, {
    dni: "",
    nome: "",
    correo: "",
    provincia: "",
    activo: false,
    tipoCuenta: "",
  });
}

function eliminarUsuario(index) {
  usuarios.value.splice(index, 1);
}

function editarUsuario(index) {
  const usuario = usuarios.value[index];

  Object.assign(novoUsuario, usuario);
}

/// Zona de sanitización (limpieza) de campos

// DNI: al SALIR del campo, quita los espacios y pasa la letra
// final a mayúscula de forma automática.
function sanitizarDni() {
  novoUsuario.dni = novoUsuario.dni.trim().toUpperCase();
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
  novoUsuario.nome = capitalizarNome(novoUsuario.nome);
}

function sanitizarApellidos() {
  novoUsuario.apellidos = capitalizarNome(novoUsuario.apellidos);
}

// Móbil: al SALIR del campo, quita los espacios para que la
// validación "empieza por 6 o 7" sea correcta.
function sanitizarMobil() {
  novoUsuario.mobil = novoUsuario.mobil.replace(/\s+/g, "");
}

/// Funciones auxiliares

function esDniCorrecto() {
  // Comprobamos que tenga 8 números y una letra mayúscula
  const regex = /^\d{8}[A-Z]$/;

  if (!regex.test(novoUsuario.dni)) {
    return false;
  }

  // Array de letras del DNI
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE";

  // Cogemos solamente los 8 números
  const numero = parseInt(novoUsuario.dni.substring(0, 8));

  // Calculamos el resto de dividir entre 23
  const resto = numero % 23;

  // La letra correcta es la que ocupa esa posición
  // en el array
  const letraCorrecta = letras[resto];

  // Comparamos la letra calculada con la del DNI
  const letraDni = novoUsuario.dni.charAt(8);

  return letraDni === letraCorrecta;
}

function hayError(campo) {
  if (campo === "dni") {
    return novoUsuario.dni !== "" && !esDniCorrecto();
  }

  if (campo === "nome") {
    return novoUsuario.nome === "";
  }

  if (campo === "correo") {
    return novoUsuario.correo === "";
  }

  if (campo === "provincia") {
    return novoUsuario.provincia === "";
  }

  // El móbil es válido solo si no está vacío y empieza por 6 o 7.
  if (campo === "mobil") {
    return novoUsuario.mobil !== "" && !/^[67]/.test(novoUsuario.mobil);
  }

  return false;
}
</script>

<style scoped>
/* ============================================================
   ESTILOS DE XestionUsuarios.vue
   ============================================================
   Bloque "scoped": estos estilos solo se aplican a este componente
   (Vue añade un atributo único a las clases para que no interfieran
   con otros componentes).

   La paleta de colores está definida en src/style.css y se usa
   aquí mediante variables (var(--color-...)).

   Estructura del bloque:
     1. Contenedor general (.xestion-usuarios)
     2. Formulario: filas, campos, inputs, errores y botón
     3. Lista de usuarios (tabla)
     4. Títulos (h4)
     5. Responsive (pantallas pequeñas)
   ============================================================ */

/* ------------------------------------------------------------
   1. CONTENEDOR GENERAL
   La tarjeta blanca que envuelve todo el contenido del componente.
   ------------------------------------------------------------ */
.xestion-usuarios {
  width: 100%;
  background-color: var(--color-tarjeta); /* fondo blanco de la tarjeta */
  padding: 2rem;                          /* hueco interior alrededor de todo */
  border-radius: 8px;                     /* esquinas suavizadas */
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
  gap: 1rem;               /* espacio entre filas del formulario */
  margin-bottom: 2rem;     /* separación entre el formulario y la tabla */
}

/* Cada fila reparte sus campos en horizontal con flexbox. */
.fila {
  display: flex;
  width: 100%;
  gap: 1rem;               /* separación entre los campos de una fila */
}

/* Fila centrada: se usa para los campos "Activo" y "Tipo de conta". */
.fila-centrada {
  justify-content: center;
}

/* Un campo = label + control, alineados en horizontal.
   El label tiene un ancho fijo para que los inputs queden alineados. */
.campo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Ancho relativo de cada campo. La suma de los "flex" de una fila
   reparte entre ellos el ancho disponible:
   - flex: 2 → el doble de ancho que un flex: 1.
   Se le da más ancho al DNI, Correo y Dirección porque sus labels
   son más largos y, en el caso del DNI, debe caber el error debajo. */
.campo-dni { flex: 2; }
.campo-nome { flex: 1; }
.campo-apellidos { flex: 1; }
.campo-fecha { flex: 1; }
.campo-correo { flex: 2; }
.campo-mobil { flex: 1; }
.campo-direccion { flex: 2; }
.campo-provincia { flex: 1; }

/* Solo el label DIRECTO del campo (>.label) recibe ancho fijo.
   Así los labels de los radios, que están más anidados, no se ven
   afectados. */
.campo > label {
  min-width: 80px;
  font-weight: 500;
}

/* Inputs y select del formulario: mismo aspecto para todos. */
.campo input,
.campo select {
  flex: 1;
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
  display: flex;
  flex-direction: column;
  justify-content: center; /* centra el contenido en el alto reservado */
  gap: 0.25rem;
  min-height: 3.6rem;      /* altura con el hueco del error ya reservado */
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
  margin: 0 auto;          /* lo centra horizontalmente */
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
  background-color: #1aa126;
}

/* ------------------------------------------------------------
   3. LISTA DE USUARIOS (tabla)
   ------------------------------------------------------------ */
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
  text-align: left;             /* el texto de las celdas queda a la izquierda */
}

/* Cabecera de la tabla: fondo gris claro y texto centrado. */
th {
  background-color: #f8f9fa;
  text-align: center;
  font-weight: 600;
}

/* Resalta la fila al pasar el ratón para que sea más fácil
   leer la lista de usuarios. */
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
/* Encabezados "Xestión de usuarios" y "Listaxe de usuarios",
   con un fondo verde para que destaquen como título de sección. */
h4 {
  margin-bottom: 1rem;            /* separación entre el título y lo que sigue */
  padding: 0.5rem 0.75rem;        /* hueco interior para que el fondo no quede pegado */
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
  .xestion-usuarios {
    padding: 1rem;
  }

  .fila {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>