# Guía para crear una pantalla nueva en este proyecto

Esta guía está pensada para que, sin consultar información externa, puedas crear una pantalla nueva desde cero siguiendo el patrón del repositorio.

Se usa la entidad `Tarea` como ejemplo genérico. Cuando llegue el momento de crear otra pantalla, reemplaza:

- `Tarea` por tu entidad,
- `tareas` por la colección o recurso,
- los campos de ejemplo por los reales,
- los textos de la interfaz por los tuyos.

Nunca copies código sin entender la intención: la clave es que el flujo quede claro y consistente en todo el proyecto.

## 1. Qué va a crear cada capa

Antes de escribir HTML o JavaScript, es importante entender qué hace cada parte:

### Backend

- `backend/modelos/`: define la estructura de la entidad en MongoDB.
- `backend/rutas/`: expone endpoints HTTP para listar, crear, actualizar y borrar.
- `backend/server.js`: monta las rutas y conecta la base de datos.

### Frontend

- `src/api/`: funciones Axios para acceder a la API.
- `src/components/`: pantallas y componentes visuales.
- `src/router/`: activa la pantalla según la URL.
- `src/App.vue`: estructura global con menú y contenido dinámico.

### Flujo real de una pantalla

Los datos se mueven así:

1. El usuario rellena el formulario en el componente.
2. El componente llama a una función del módulo `src/api/`.
3. La API hace una petición HTTP con Axios.
4. El backend recibe la petición, valida y guarda la información.
5. La respuesta vuelve al componente.
6. El componente actualiza la lista y la interfaz.

## 2. Cómo está organizado este proyecto

- `src/components/`: pantallas Vue.
- `src/api/`: capa HTTP.
- `src/router/index.js`: rutas de navegación.
- `src/store/`: estado compartido con Pinia.
- `src/utils/`: funciones reutilizables.
- `backend/modelos/`: modelos Mongoose.
- `backend/rutas/`: rutas REST.
- `backend/data/`: catálogos estáticos JSON.
- `backend/server.js`: arranque de la aplicación y conexión a MongoDB.

## 3. Plantilla de referencia

La referencia visual y funcional es:

- [src/components/PlantillaComponente.vue](./src/components/PlantillaComponente.vue)

Ese archivo contiene:

- formulario para crear/editar,
- inputs tipo texto, email, fecha, número, select, checkbox, radio, textarea,
- carga de lista,
- buscador,
- mensajes de error,
- tabla con edición y borrado,
- lógica para cambiar entre modo creación y edición,
- ejemplo de `v-model`, `v-for`, `computed`, `onMounted` y `@submit.prevent`.

Si no sabes por dónde empezar, copia la plantilla y modifica cada bloque con tu entidad.

## 4. Preparar la entidad antes de programar

Antes de tocar componentes o rutas, responde esto:

| Campo | Tipo | Obligatorio | Observación |
|---|---|---:|---|
| `titulo` | texto | sí | nombre visible del registro |
| `descripcion` | texto | no | puede estar vacío |
| `fecha` | fecha | no | útil para citas o tareas |
| `estado` | texto | no | activo/pendiente/etc. |
| `confirmado` | booleano | no | checkbox |

Ejemplo:

```js
const nuevaTarea = {
  titulo: "",
  descripcion: "",
  fecha: "",
  estado: "activo",
  confirmado: false
}
```

La regla importante es que el nombre del campo debe ser el mismo desde:

- MongoDB,
- Express,
- Axios,
- `ref`/`reactive` del componente,
- `v-model` del template.

## 5. Crear el modelo de MongoDB

Crea el archivo `backend/modelos/Tarea.js`.

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

Qué significa cada parte:

- `required: true`: campo obligatorio.
- `trim: true`: quita espacios al principio y al final.
- `default: ""` o `default: false`: valor por defecto si el usuario no lo envía.
- `collection: "tareas"`: nombre real de la colección en MongoDB.

Mongoose crea automáticamente el campo `_id`.

## 6. Crear las rutas del backend

Crea `backend/rutas/tareas.rutas.js`.

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

Qué hace cada endpoint:

- `GET /api/tareas`: lista todo.
- `POST /api/tareas`: crea un registro nuevo.
- `PUT /api/tareas/:id`: modifica un registro concreto.
- `DELETE /api/tareas/:id`: borra un registro concreto.

Entonces, cuando crees otra entidad, repite el mismo patrón con nombres adaptados.

## 7. Montar la ruta en el servidor

Edita `backend/server.js` y añade:

```js
import tareasRutas from "./rutas/tareas.rutas.js"

app.use(express.json())
app.use("/api/tareas", tareasRutas)
```

Esto hace que la aplicación responda en una URL como:

```text
http://localhost:3000/api/tareas
```

La clave es que el `app.use("/api/...", router)` debe coincidir exactamente con la URL que usarás en frontend.

## 8. Crear la capa de API del cliente

Crea `src/api/tareas.js`.

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

### Por qué esta capa es importante

- separa HTTP del componente,
- centraliza la URL base,
- evita repetir `axios.get` dentro del template,
- facilita reutilizar la lógica en varios componentes,
- facilita pruebas y mantenimiento.

## 9. Crear el componente frontend

Copia la plantilla:

```text
src/components/PlantillaComponente.vue
```

y renómbrala a algo como:

```text
src/components/XestionTareas.vue
```

### Cambia estas cosas

1. Título y textos visibles.
2. `registroVacio` con los campos de tu entidad.
3. `registros` por la lista de la entidad.
4. `guardarRegistro` por una función que llame a `saveTarea` o `modifyTarea`.
5. `editarRegistro` y `eliminarRegistro` con la lógica real.
6. `listaFiltrada` y el buscador para la entidad real.
7. `v-for` para la nueva colección.

Ejemplo de cómo quedaría el estado inicial:

```vue
<script setup>
import { computed, onMounted, reactive, ref } from "vue"
import { deleteTarea, getTareas, saveTarea } from "../api/tareas.js"

const titulo = ref("Gestión de tareas")
const tareas = ref([])
const cargando = ref(false)
const guardando = ref(false)
const error = ref("")
const editando = ref(false)

const tareaVacia = () => ({
  _id: "",
  titulo: "",
  descripcion: "",
  completada: false
})

const tarea = reactive(tareaVacia())
const buscar = ref("")

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

async function guardarTarea() {
  error.value = ""
  guardando.value = true

  try {
    if (editando.value) {
      await modifyTarea(tarea._id, { ...tarea })
    } else {
      await saveTarea({ ...tarea })
    }

    await cargarTareas()
    limpiarFormulario()
  } catch (err) {
    error.value = err.response?.data?.mensaje || "No se pudo guardar la tarea."
  } finally {
    guardando.value = false
  }
}

async function eliminarTarea(id) {
  error.value = ""

  try {
    await deleteTarea(id)
    await cargarTareas()
  } catch (err) {
    error.value = err.response?.data?.mensaje || "No se pudo eliminar la tarea."
  }
}

function limpiarFormulario() {
  Object.assign(tarea, tareaVacia())
  editando.value = false
  error.value = ""
}

function editarTarea(item) {
  Object.assign(tarea, item)
  editando.value = true
}

onMounted(cargarTareas)
</script>
```

### Recomendación para el template

En el template, sigue esta lógica:

```vue
<form @submit.prevent="guardarTarea">
  <input v-model="tarea.titulo" />
  <textarea v-model="tarea.descripcion" />
  <button type="submit">
    {{ editando ? "Guardar cambios" : "Crear tarea" }}
  </button>
</form>

<input v-model="buscar" type="search" />

<div v-if="cargando">Cargando...</div>
<div v-else-if="listaFiltrada.length === 0">No hay registros</div>
<table v-else>
  <tr v-for="item in listaFiltrada" :key="item._id">
    <td>{{ item.titulo }}</td>
    <td>{{ item.descripcion }}</td>
    <td>
      <button type="button" @click="editarTarea(item)">Editar</button>
      <button type="button" @click="eliminarTarea(item._id)">Eliminar</button>
    </td>
  </tr>
</table>
```

## 10. Añadir la ruta al frontend

En `src/router/index.js` añade la nueva pantalla:

```js
import XestionTareas from "../components/XestionTareas.vue"

const routes = [
  { path: "/", name: "Inicio", component: Inicio },
  { path: "/tareas", name: "XestionTareas", component: XestionTareas },
  { path: "/:pathMatch(.*)", name: "NotFound", component: NotFound }
]
```

La ruta genérica `NotFound` siempre debe ir al final.

## 11. Añadir la navegación al menú

En `src/components/NavBar.vue`, añade un enlace tipo:

```vue
<RouterLink to="/tareas">Tareas</RouterLink>
```

Esto hace que el contenido de la ruta se renderice en `<router-view />` dentro de `App.vue`.

## 12. Cómo validar que no haya errores

Ejecuta esta comprobación al final:

```bash
npm run build
```

Cuando la compilación funciona, el proyecto está listo para seguir con la lógica de negocio y la validación de la pantalla.

## 13. Patrones que conviene recordar

### Estado reactivo

```js
const visible = ref(false)
const form = reactive({ nombre: "", descripcion: "" })
```

### Bindeo con formulario

```vue
<input v-model="form.nombre" />
```

### Acciones de formulario

```vue
<form @submit.prevent="guardar">
```

### Listas y repetición

```vue
<li v-for="item in lista" :key="item._id">{{ item.nombre }}</li>
```

### Condiciones

```vue
<p v-if="error">{{ error }}</p>
```

### Carga inicial

```js
onMounted(cargarLista)
```

### Filtro derivado

```js
const listaFiltrada = computed(() => {
  return lista.value.filter((item) => item.nombre.includes(buscar.value))
})
```

## 14. Checklist final para crear una nueva pantalla

Antes de considerar la pantalla terminada, revisa esto:

- ¿La entidad tiene modelo en backend?
- ¿La ruta del backend existe?
- ¿La ruta está montada en `backend/server.js`?
- ¿La URL de `src/api` coincide con el endpoint?
- ¿El componente tiene `script setup` con `ref` o `reactive`?
- ¿El template usa `v-model` sobre variables reales?
- ¿La lista usa `v-for` con `:key`?
- ¿La carga inicial se hace en `onMounted()`?
- ¿Los errores se muestran en pantalla?
- ¿La ruta está registrada en el router?
- ¿Hay un enlace en el menú?
- ¿La compilación pasa con `npm run build`?

## 15. Recomendaciones para crear componentes nuevos sin ayuda externa

Estas prácticas te van a ahorrar tiempo:

1. Empieza por los campos, no por el HTML.
2. Haz primero el modelo del formulario.
3. Crea el backend antes de la interfaz.
4. Copia la plantilla y adapta solo lo necesario.
5. Mantén nombres iguales en todas las capas.
6. No ocultes errores: muéstralos y gestionarlos.
7. No metas lógica de negocio dentro del template.
8. Usa comentarios solo donde aporten contexto real.
9. Reutiliza patrones ya existentes: `guardar`, `editar`, `eliminar`, `limpiar`, `cargar`, `buscar`.
10. Cuando algo se repita, conviértelo en función o utilidad.

## 16. Referencias rápidas del repositorio

- [src/components/PlantillaComponente.vue](./src/components/PlantillaComponente.vue)
- [src/router/index.js](./src/router/index.js)
- [src/App.vue](./src/App.vue)
- [backend/server.js](./backend/server.js)
- [src/api/pacientes.js](./src/api/pacientes.js)
- [backend/modelos/Paciente.js](./backend/modelos/Paciente.js)

La clave para no perderte es esta: no empieces por la vista, empieza por la entidad, luego backend, luego API, luego componente, y por último router y navegación. Así todo encaja sin información adicional.
