# Guía ultra guiada para crear un componente nuevo en este examen

Esta guía está pensada para que puedas crear una pantalla nueva aunque no sepas empezar. Está escrita para que uses solo lo que ya existe en este repositorio y te sirva como “manual de supervivencia” del examen.

No necesitas internet ni IA. Solo necesitas seguir este orden exacto.

## 1. Regla de oro: hazlo en este orden

Nunca empieces por CSS ni por lo bonito. Empieza por esto:

1. Decide qué entidad quieres gestionar.
2. Revisa qué campos necesita.
3. Crea el modelo en backend.
4. Crea las rutas en backend.
5. Registra la ruta en `backend/server.js`.
6. Crea la API en `src/api/`.
7. Copia la plantilla base.
8. Cambia el nombre de la entidad.
9. Registra la ruta del frontend.
10. Añade el enlace al menú.
11. Prueba que compila.

Si sigues este orden, no te pierdes.

## 2. Qué es lo mínimo que necesitas saber

En este proyecto hay 4 partes clave:

- `src/components/`: pantallas y componentes.
- `src/api/`: llamadas a la API.
- `backend/modelos/`: estructura de MongoDB.
- `backend/rutas/`: endpoints HTTP.

Y además:

- `src/router/index.js` = decide qué pantalla se muestra.
- `src/App.vue` = contiene el menú y el contenido de la ruta.
- `backend/server.js` = monta todo.

## 3. La plantilla que debes usar siempre

La referencia principal es:

- `src/components/PlantillaComponente.vue`

Ese archivo ya te da la estructura base:

- formulario
- lista
- filtro/búsqueda
- editar
- borrar
- mensajes de error
- carga

Si no sabes nada, copia ese archivo y cambia los nombres.

## 4. Si no sabes qué poner, usa este patrón mínimo

### 4.1 Modelo de backend

Crea un archivo como `backend/modelos/Tarea.js`.

```js
import mongoose from "mongoose"

const TareaSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, default: "", trim: true },
    completada: { type: Boolean, default: false }
  },
  {
    collection: "tareas"
  }
)

export default mongoose.model("Tarea", TareaSchema)
```

Si tu entidad cambia, solo cambias:

- nombre del esquema (`Tarea`)
- nombre de la colección (`tareas`)
- nombre de los campos (`titulo`, `descripcion`, etc.)

### 4.2 Rutas del backend

Crea un archivo como `backend/rutas/tareas.rutas.js`.

```js
import express from "express"
import Tarea from "../modelos/Tarea.js"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const tareas = await Tarea.find().lean()
    res.json(tareas)
  } catch (error) {
    console.error("Error al listar tareas:", error)
    res.status(500).json({ mensaje: "Error al listar las tareas" })
  }
})

router.post("/", async (req, res) => {
  try {
    const tarea = await Tarea.create({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion ?? "",
      completada: req.body.completada ?? false
    })

    res.status(201).json(tarea)
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ mensaje: error.message })
    }

    console.error("Error al crear tarea:", error)
    res.status(500).json({ mensaje: "Error al crear la tarea" })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const tarea = await Tarea.findByIdAndUpdate(
      req.params.id,
      {
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        completada: req.body.completada
      },
      { new: true, runValidators: true }
    )

    if (!tarea) {
      return res.status(404).json({ mensaje: "Tarea no encontrada" })
    }

    res.json(tarea)
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ mensaje: error.message })
    }

    console.error("Error al modificar tarea:", error)
    res.status(500).json({ mensaje: "Error al modificar la tarea" })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const tarea = await Tarea.findByIdAndDelete(req.params.id)

    if (!tarea) {
      return res.status(404).json({ mensaje: "Tarea no encontrada" })
    }

    res.json({ mensaje: "Tarea eliminada" })
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ mensaje: "El ID de la tarea no es válido" })
    }

    console.error("Error al eliminar tarea:", error)
    res.status(500).json({ mensaje: "Error al eliminar la tarea" })
  }
})

export default router
```

### 4.3 Registrar la ruta en el backend principal

En `backend/server.js` añade:

```js
import tareasRutas from "./rutas/tareas.rutas.js"

app.use(express.json())
app.use("/api/tareas", tareasRutas)
```

### 4.4 Crear la API del frontend

Crea un archivo como `src/api/tareas.js`.

```js
import axios from "axios"

const API_URL = "http://localhost:3000/api/tareas"

export async function getTareas() {
  const res = await axios.get(API_URL)
  return res.data
}

export async function saveTarea(tarea) {
  const res = await axios.post(API_URL, tarea)
  return res.data
}

export async function modifyTarea(id, tarea) {
  const res = await axios.put(`${API_URL}/${id}`, tarea)
  return res.data
}

export async function deleteTarea(id) {
  const res = await axios.delete(`${API_URL}/${id}`)
  return res.data
}
```

## 5. La parte que más suele fallar: el componente

Haz esto exactamente:

1. Copia `PlantillaComponente.vue`.
2. Cámbiale el nombre.
3. Cambia el título.
4. Cambia los nombres de los campos del formulario.
5. Cambia la lista y el `v-for`.
6. Cambia `guardarRegistro` por la lógica real.

### 5.1 Esqueleto mínimo de componente

```vue
<template>
  <section class="w-full rounded bg-white p-4 shadow">
    <h4 class="mb-4 rounded bg-[#1b4965] px-3 py-2 font-semibold text-white">
      {{ titulo }}
    </h4>

    <form @submit.prevent="guardarRegistro" class="mb-8 grid gap-4">
      <div>
        <label for="titulo">Titulo</label>
        <input id="titulo" v-model="registro.titulo" class="w-full rounded border p-2" type="text" required>
      </div>

      <div>
        <label for="descripcion">Descripcion</label>
        <textarea id="descripcion" v-model="registro.descripcion" class="w-full rounded border p-2" rows="3"></textarea>
      </div>

      <button type="submit" class="rounded bg-[#1b4965] px-4 py-2 text-white">
        {{ editando ? "Guardar cambios" : "Crear" }}
      </button>
    </form>

    <input v-model="buscar" type="search" placeholder="Buscar" class="mb-4 w-full rounded border p-2">

    <div v-if="cargando">Cargando...</div>
    <div v-else-if="listaFiltrada.length === 0">No hay registros</div>
    <table v-else class="w-full border-collapse">
      <tr v-for="item in listaFiltrada" :key="item._id">
        <td>{{ item.titulo }}</td>
        <td>{{ item.descripcion }}</td>
        <td>
          <button type="button" @click="editarRegistro(item)">Editar</button>
          <button type="button" @click="eliminarRegistro(item._id)">Eliminar</button>
        </td>
      </tr>
    </table>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue"
import { deleteTarea, getTareas, saveTarea, modifyTarea } from "../api/tareas.js"

const titulo = ref("Gestión de tareas")
const cargando = ref(false)
const error = ref("")
const editando = ref(false)
const buscar = ref("")

const registroVacio = () => ({
  _id: "",
  titulo: "",
  descripcion: "",
  completada: false
})

const registro = reactive(registroVacio())
const tareas = ref([])

const listaFiltrada = computed(() => {
  const texto = buscar.value.toLowerCase()
  return tareas.value.filter((item) =>
    `${item.titulo} ${item.descripcion}`.toLowerCase().includes(texto)
  )
})

async function cargarTareas() {
  cargando.value = true
  error.value = ""

  try {
    tareas.value = await getTareas()
  } catch (err) {
    error.value = err.response?.data?.mensaje || "No se pudieron cargar las tareas."
  } finally {
    cargando.value = false
  }
}

async function guardarRegistro() {
  error.value = ""

  try {
    if (editando.value) {
      await modifyTarea(registro._id, { ...registro })
    } else {
      await saveTarea({ ...registro })
    }

    await cargarTareas()
    Object.assign(registro, registroVacio())
    editando.value = false
  } catch (err) {
    error.value = err.response?.data?.mensaje || "No se pudo guardar."
  }
}

async function eliminarRegistro(id) {
  try {
    await deleteTarea(id)
    await cargarTareas()
  } catch (err) {
    error.value = err.response?.data?.mensaje || "No se pudo eliminar."
  }
}

function editarRegistro(item) {
  Object.assign(registro, item)
  editando.value = true
}

onMounted(cargarTareas)
</script>
```

## 6. Qué debes hacer para cada componente nuevo

### Paso 1: escribe la entidad

Ejemplo:

```text
Entidad: Tarea
Campos:
- titulo (obligatorio)
- descripcion (opcional)
- completada (booleano)
```

### Paso 2: crea el modelo

- archivo: `backend/modelos/Tarea.js`
- se parece al ejemplo anterior

### Paso 3: crea la ruta

- archivo: `backend/rutas/tareas.rutas.js`
- GET, POST, PUT, DELETE

### Paso 4: monta la ruta

- `backend/server.js`

### Paso 5: crea el módulo API

- archivo: `src/api/tareas.js`

### Paso 6: copia la plantilla

- `src/components/PlantillaComponente.vue`

### Paso 7: cambia los campos

- `titulo` del componente
- `registroVacio`
- `v-model`
- `v-for`
- `editarRegistro`
- `eliminarRegistro`

### Paso 8: añade la ruta del frontend

```js
import XestionTareas from "../components/XestionTareas.vue"

{ path: "/tareas", name: "XestionTareas", component: XestionTareas }
```

### Paso 9: añade el enlace del menú

```vue
<RouterLink to="/tareas">Tareas</RouterLink>
```

### Paso 10: prueba

```bash
npm run build
```

## 7. ¿Copio la plantilla o aprovecho un componente existente?

No hace falta inventar cada parte desde cero. Elige el ejemplo más parecido a lo que pide el ejercicio:

| Si necesitas... | Empieza mirando... | Qué aprender de ese ejemplo |
|---|---|---|
| Una plantilla genérica de formulario, filtro y tabla | `src/components/PlantillaComponente.vue` | Estructura visual y estado local. Es un catálogo de ejemplo: sus registros no se guardan en MongoDB. |
| Un CRUD conectado a MongoDB y con formulario de varios campos | `src/components/XestionPacientes.vue` y `src/api/pacientes.js` | Carga, creación, búsqueda por DNI, edición y borrado. Sigue el campo identificador real que usa cada función. |
| CRUD con selección de catálogo | `src/components/XestionDoctores.vue`, `src/api/doctores.js` y `src/api/especialidades.js` | Selector alimentado desde API, edición y operaciones CRUD. |
| Un componente que depende de datos elegidos en otra pantalla | `src/components/Citas.vue`, `src/store/doctorStore.js` y `src/store/pacienteStore.js` | Estado compartido con Pinia, observación de cambios y uso de identificadores relacionados. |
| Una ruta de backend con relaciones entre documentos | `backend/rutas/citas.rutas.js` y `backend/modelos/Cita.js` | Validación de identificadores y referencias de MongoDB. |

### Cómo reutilizar código sin copiar errores

1. Busca un ejemplo que haga **la misma tarea**, no solo que se parezca visualmente.
2. Lee el `<script setup>` para encontrar el nombre de la función llamada por cada `@submit`, `@click` o `@change`.
3. Comprueba qué devuelve el módulo API y qué campos espera el backend.
4. Copia únicamente el patrón necesario y adapta nombres, campos, ruta e identificador.
5. Busca en el archivo copiado los nombres antiguos: no deben quedar referencias a la entidad anterior.
6. Comprueba que cada función importada existe y que cada propiedad de `v-model` se inicializa.

No todos los CRUD usan el mismo identificador. MongoDB suele devolver `_id`, pero pacientes también se localizan por DNI. Mira la URL que construye el módulo de API y la ruta Express correspondiente antes de decidir qué valor pasar a editar o borrar.

## 8. Compartir datos entre componentes: memoria, Pinia y MongoDB

Hay tres lugares distintos donde pueden estar los datos. No los confundas:

| Dónde está el dato | Ejemplo | Quién puede leerlo | ¿Se conserva al recargar la página? |
|---|---|---|---|
| Estado del componente (`ref`/`reactive`) | `const filtro = ref("")` | Ese componente | No |
| Store de Pinia | Doctor seleccionado | Cualquier componente que use el mismo store mientras la app está abierta | No, salvo que se programe persistencia; este proyecto no la configura |
| MongoDB a través de la API | Pacientes, doctores y citas | Componentes que consultan el backend | Sí |

Regla sencilla: usa el estado local para cosas temporales de una pantalla; Pinia para compartir una selección o estado entre pantallas abiertas; MongoDB para los registros que deben seguir existiendo al cerrar o recargar.

### Ejemplo existente: seleccionar un doctor y leerlo en otra pantalla

`src/store/doctorStore.js` define un store global. La pantalla de doctores importa `useDoctorStore()` y guarda allí la selección; `src/components/Citas.vue` usa el mismo store para leer el doctor seleccionado.

En un componente que guarda una selección:

```js
import { useDoctorStore } from "../store/doctorStore.js"

const doctorStore = useDoctorStore()

function seleccionarDoctor(doctor) {
  doctorStore.seleccionarDoctor(doctor)
}
```

En un componente que necesita esa selección:

```js
import { useDoctorStore } from "../store/doctorStore.js"

const doctorStore = useDoctorStore()

// Ejemplo de lectura: el identificador permite pedir citas de ese doctor.
const idDoctorSeleccionado = doctorStore.idDoctor
```

En el template se puede leer directamente `doctorStore.idDoctor` y mostrar campos como `doctorStore.nomedoc`. Si otra pantalla cambia la selección, Pinia mantiene el valor compartido reactivo.

El patrón de este repositorio es:

1. Crear o reutilizar un archivo dentro de `src/store/`.
2. Definir el estado inicial en `state`.
3. Añadir una acción para seleccionar/cambiar el dato y otra para limpiarlo, cuando tenga sentido.
4. Importar la función `use...Store` en cada componente que lo necesite.
5. Crear el store dentro de `setup` del componente.
6. Leer sus propiedades o llamar sus acciones.

La aplicación registra Pinia en `src/main.js`; por eso se puede usar desde cualquier pantalla. No guardes en el store listas grandes o datos que deban sobrevivir una recarga si MongoDB ya es la fuente de verdad: vuelve a pedirlos mediante `src/api/`.

### Cómo se relaciona esto con MongoDB en las citas

En `backend/modelos/Cita.js`, `pacienteDNI` guarda el DNI del paciente como texto y `doctorId` guarda el `ObjectId` del doctor. La ruta comprueba que el DNI corresponda a un paciente existente y que el identificador corresponda a un doctor existente.

La selección en Pinia ayuda al componente a saber qué persona eligió el usuario. Al guardar, la pantalla envía el DNI del paciente y el identificador del doctor a la API; `backend/rutas/citas.rutas.js` comprueba que ambos correspondan a registros existentes antes de guardar. La cita queda persistida en MongoDB. Pinia **no** reemplaza esa validación ni guarda la cita.

## 9. Qué significa “usar MongoDB” paso a paso

Cuando la pantalla debe conservar registros:

1. El modelo Mongoose (`backend/modelos/`) define los campos y sus reglas.
2. `backend/server.js` conecta MongoDB y monta las rutas detrás de `requireDatabase`.
3. Una ruta Express (`backend/rutas/`) lee `req.body` o parámetros, consulta/actualiza el modelo y responde con JSON.
4. El módulo `src/api/` usa Axios para llamar a esa URL y devuelve `res.data`.
5. El componente espera (`await`) la respuesta, actualiza su estado reactivo y representa la respuesta.

MongoDB requiere que `MONGO_URI` esté configurado y la base esté disponible. Si no está conectado, las rutas de pacientes, doctores y citas responden `503`; los catálogos JSON de municipios y especialidades no necesitan MongoDB.

**No basta con añadir un modelo:** hay que importar y montar su router en `backend/server.js`, y la URL del módulo API debe coincidir con esa ruta. Tampoco basta con modificar una lista local del componente: eso cambia la pantalla, pero no persiste el cambio.

## 10. Qué NO puedes olvidar en el examen

- El nombre del campo debe ser igual en backend, API y componente.
- Si usas `v-model`, la propiedad debe existir.
- Si usas `@submit.prevent`, debe llamar a una función real.
- Si usas `v-for`, debe haber `:key`.
- Si un botón no guarda, debe llevar `type="button"`.
- Si cambia un selector dependiente, debes leer el valor y cargar otra lista.
- Debes mostrar errores en la interfaz.
- `NotFound` debe ir al final del router.

## 11. Checklist final de “voy bien o no voy bien”

Marca sí o no:

- [ ] He definido la entidad.
- [ ] He creado el modelo Mongoose.
- [ ] He creado las rutas backend.
- [ ] He montado las rutas.
- [ ] He creado el módulo API.
- [ ] He copiado la plantilla base.
- [ ] He cambiado los nombres de los campos.
- [ ] El formulario tiene `@submit.prevent`.
- [ ] El formulario usa `v-model`.
- [ ] La lista usa `v-for` con `:key`.
- [ ] La edición carga el elemento.
- [ ] El borrado funciona.
- [ ] El error se muestra.
- [ ] Está registrado en el router.
- [ ] Tiene enlace en el menú.
- [ ] Compila con `npm run build`.

Si todas están marcadas como sí, ya tienes una pantalla funcional.

## 12. Si te bloqueas completamente, haz esto

Haz esto exactamente en orden:

1. Abre `src/components/PlantillaComponente.vue`.
2. Copia el archivo.
3. Renómbralo a tu nuevo componente.
4. Cambia `titulo`.
5. Cambia `registroVacio` por tu entidad.
6. Cambia los `v-model` del formulario.
7. Cambia la tabla por tus columnas.
8. Cambia la lógica `guardarRegistro` para llamar a tu API.
9. Crea el backend con el mismo nombre.
10. Añade la ruta del frontend.
11. Añade el enlace al menú.
12. Ejecuta `npm run build`.

Si haces esto sin saltarte pasos, normalmente te sale.

## 13. Trucos para hacer el examen más fácil

- Usa exactamente los nombres de los campos de la plantilla para no confundirte.
- No intentes crear algo “muy original”; usa la estructura ya existente.
- Reutiliza nombres ya vistos en otros componentes.
- Mantén todo en español si el proyecto está en español.
- Cuando no sepas cómo seguir, vuelve a la plantilla y compara.

## 14. Archivos del repositorio que más te van a salvar

Lo más importante para este examen es tener claro esto:

- [src/components/PlantillaComponente.vue](./src/components/PlantillaComponente.vue)
- [src/components/XestionPacientes.vue](./src/components/XestionPacientes.vue)
- [src/components/XestionDoctores.vue](./src/components/XestionDoctores.vue)
- [src/components/Citas.vue](./src/components/Citas.vue)
- [src/store/doctorStore.js](./src/store/doctorStore.js)
- [src/store/pacienteStore.js](./src/store/pacienteStore.js)
- [src/router/index.js](./src/router/index.js)
- [backend/server.js](./backend/server.js)
- [src/api/pacientes.js](./src/api/pacientes.js)
- [backend/modelos/Paciente.js](./backend/modelos/Paciente.js)
- [backend/modelos/Cita.js](./backend/modelos/Cita.js)
- [backend/rutas/citas.rutas.js](./backend/rutas/citas.rutas.js)

Si sabes mirar esos archivos y seguir el patrón, ya no estás “creando desde cero”: estás repitiendo una estructura que el proyecto ya te da.

## 15. Resumen final en una frase

Si no sabes qué hacer, copia la plantilla, cambia los nombres, crea el backend con el mismo patrón, monta la ruta, conecta la API y haz que compile. Eso es suficiente para crear un componente funcional sin salir del repositorio.
