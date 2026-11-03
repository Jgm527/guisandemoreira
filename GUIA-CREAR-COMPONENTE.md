# Guía: crear una pantalla nueva en este proyecto

Esta guía usa **Tareas** como ejemplo. Cambia `Tarea`, `tareas`, los campos y
los textos por los de la entidad que necesites. Si la pantalla solo muestra
información fija, puedes omitir MongoDB y la API.

Como punto de partida visual, copia
[`src/components/PlantillaComponente.vue`](./src/components/PlantillaComponente.vue).
Ese archivo tiene un formulario, una lista, botones y ejemplos de Vue. Su lista
es local: los datos se pierden al recargar la página. Los estilos del proyecto
se escriben con utilidades de Tailwind CSS.

## Estilos con Tailwind CSS

Pon las utilidades directamente en el `class` del elemento, en lugar de crear
un bloque `<style>` para reglas nuevas:

```vue
<section class="w-full rounded-lg bg-white p-8 shadow">
  <h4 class="mb-4 rounded bg-[#1b4965] px-3 py-2 font-semibold text-white">
    Mi pantalla
  </h4>
</section>
```

Para una condición visual, combina clases estáticas con una clase dinámica de
Vue:

```vue
<input
  v-model="form.nombre"
  :class="{ 'border-2 border-red-600': error }"
  class="w-full rounded border p-2"
/>
```

Las clases compartidas por formularios complejos existentes están centralizadas
en `src/style.css` con `@apply`; para un componente nuevo, prioriza las
utilidades directamente en el template. Tailwind está integrado con Vite y no
necesita un archivo de configuración adicional para este proyecto.

## 1. Diseña los datos

Antes de programar, apunta qué necesita guardar cada registro. Ejemplo:

| Campo | Tipo | Obligatorio |
|---|---|---|
| `titulo` | texto | sí |
| `descripcion` | texto | no |
| `completada` | booleano | no |

Usa los mismos nombres en el modelo, la API y el componente para evitar errores
de escritura y de enlace con `v-model`.

## 2. Crea el modelo de MongoDB

Crea `backend/modelos/Tarea.js`. El esquema define los campos y sus reglas:

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

MongoDB/Mongoose crea `_id` automáticamente. No hace falta inventar un ID
manual salvo que el ejercicio lo pida.

## 3. Crea las rutas del backend (si guardarás datos)

Crea `backend/rutas/tareas.rutas.js`. Cada ruta atiende una operación HTTP:

```js
import express from "express"
import Tarea from "../modelos/Tarea.js"

const router = express.Router()

// GET /api/tareas: devolver todos los registros.
router.get("/", async (req, res) => {
  try {
    const tareas = await Tarea.find().lean()
    res.json(tareas)
  } catch (error) {
    console.error("Error al listar tareas:", error)
    res.status(500).json({ mensaje: "Error al listar las tareas" })
  }
})

// POST /api/tareas: validar y crear un registro.
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

// PUT /api/tareas/:id: modificar un registro por su _id de MongoDB.
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

// DELETE /api/tareas/:id: eliminar un registro por su _id.
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

## 4. Registra las rutas en el servidor

En `backend/server.js`, importa el router y móntalo junto a pacientes y
doctores. `express.json()` debe estar registrado para poder leer `req.body`:

```js
import tareasRutas from "./rutas/tareas.rutas.js"

// Después de app.use(express.json()):
app.use("/api/tareas", tareasRutas)
```

La URL base de ejemplo queda como `http://localhost:3000/api/tareas`.

## 5. Crea el cliente de API (si la pantalla usa el backend)

Crea `src/api/tareas.js`. Esta capa mantiene las peticiones HTTP fuera del
componente:

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

## 6. Prepara el componente de la pantalla

1. Copia `src/components/PlantillaComponente.vue` a
   `src/components/XestionTareas.vue`.
2. Cambia el título, las propiedades del objeto del formulario y los campos.
3. En el `<script setup>`, importa las funciones del API.
4. Carga la lista al abrir la pantalla con `onMounted`.
5. Sustituye el `push()` local por `await saveTarea(...)` y vuelve a cargar la
   lista tras guardar o eliminar.
6. Muestra los errores en la interfaz; no los ocultes con un `catch` vacío.

Ejemplo de la parte esencial del script conectado al API:

```vue
<script setup>
import { onMounted, reactive, ref } from "vue"
import { deleteTarea, getTareas, saveTarea } from "../api/tareas.js"

const tareas = ref([])
const cargando = ref(false)
const error = ref("")
const nuevaTarea = reactive({ titulo: "", descripcion: "" })

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
  try {
    await saveTarea({ ...nuevaTarea })
    nuevaTarea.titulo = ""
    nuevaTarea.descripcion = ""
    await cargarTareas()
  } catch (err) {
    error.value = err.response?.data?.mensaje || "No se pudo guardar la tarea."
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

// Ejecuta cargarTareas cuando Vue ha montado el componente.
onMounted(cargarTareas)
</script>
```

En el template de ese componente, el formulario usaría
`@submit.prevent="guardarTarea"`, la lista `v-for="tarea in tareas"` y el botón
de borrado `@click="eliminarTarea(tarea._id)"`. Usa `tarea._id` porque Mongoose
devuelve el identificador de MongoDB con ese nombre.

## 7. Añade la ruta del frontend

En `src/router/index.js`:

```js
import XestionTareas from "../components/XestionTareas.vue"

// Dentro del array routes, antes de la ruta comodín NotFound:
{ path: "/tareas", name: "XestionTareas", component: XestionTareas },
```

La ruta comodín (`/:pathMatch(.*)`) debe quedarse al final para que no capture
antes las rutas concretas.

## 8. Añade el enlace al menú

En el `<ul>` de `src/components/NavBar.vue`:

```vue
<li><RouterLink to="/tareas">Tareas</RouterLink></li>
```

`RouterLink` navega sin recargar la página. El contenido de la ruta se muestra
en `<router-view />`, que ya está en `src/App.vue`; normalmente no hay que
modificar `App.vue`.

## Vue que conviene recordar para el examen

| Sintaxis | Para qué sirve | Ejemplo |
|---|---|---|
| `ref(valor)` | Estado reactivo simple o lista | `const visible = ref(false)` |
| `reactive(objeto)` | Formulario con varios campos | `const form = reactive({ nombre: "" })` |
| `v-model` | Enlazar input y estado | `v-model="form.nombre"` |
| `@click` | Ejecutar una acción al pulsar | `@click="eliminar(id)"` |
| `@submit.prevent` | Enviar formulario sin recargar | `@submit.prevent="guardar"` |
| `v-if` / `v-else` | Mostrar contenido según condición | `v-if="error"` |
| `v-for` y `:key` | Repetir elementos de una lista | `v-for="x in lista" :key="x._id"` |
| `:disabled` | Vincular un atributo a una condición | `:disabled="cargando"` |
| `:class` | Aplicar clases según estado | `:class="{ incorrecto: hayError }"` |
| `onMounted()` | Ejecutar código al mostrar el componente | `onMounted(cargarLista)` |
| `computed()` | Derivar un valor de otro estado | `computed(() => lista.value.length)` |

### Comprobación rápida

- ¿El nombre importado existe y coincide exactamente con el archivo?
- ¿Cada propiedad usada por `v-model` está inicializada en `ref` o `reactive`?
- ¿El `@submit.prevent` llama a una función declarada?
- ¿Los botones que no envían el formulario tienen `type="button"`?
- ¿El router está montado en `main.js` y la ruta está antes de NotFound?
- ¿El backend importa y monta el router con la misma URL que usa Axios?
- ¿El backend está iniciado y MongoDB conectado?
- Ejecuta `npm run build` para encontrar errores de compilación de Vue.
