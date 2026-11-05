# Guía: crear una pantalla nueva en este proyecto

Esta guía usa **Tareas** como ejemplo. Cambia `Tarea`, `tareas`, los campos y
los textos por los de la entidad que necesites. Si la pantalla solo muestra
información fija, puedes omitir MongoDB y la API.

Como punto de partida visual, copia
[`src/components/PlantillaComponente.vue`](./src/components/PlantillaComponente.vue).
Ese archivo sirve como catalogo de referencia para formularios, inputs, filtros,
mensajes, tablas y acciones CRUD. Sus datos de ejemplo son locales y se pierden
al recargar la pagina: sigue los comentarios del script para conectarlo con
`src/api/`. Cada campo contiene un placeholder entre corchetes para sustituirlo
por el texto y los datos de tu entidad. Los estilos usan utilidades Tailwind CSS.

## Cómo está organizado el proyecto

- `src/components/` contiene las pantallas y componentes Vue.
- `src/api/` centraliza las peticiones HTTP con Axios; los componentes deben
  llamar a estas funciones en vez de construir URL dentro del template.
- `src/router/index.js` asocia una URL con cada pantalla y `src/App.vue` muestra
  la pantalla elegida mediante `<router-view />`.
- `src/utils/` reúne funciones reutilizables, como alertas.
- `backend/modelos/` define los documentos y reglas de Mongoose.
- `backend/rutas/` implementa los endpoints Express para cada recurso.
- `backend/server.js` configura Express, conecta MongoDB y publica los catalogos
  estaticos de `backend/data/`.

Los comentarios del codigo explican el proposito de una variable, una funcion
o una regla que no sea obvia. Conviene explicar especialmente los parametros,
el resultado esperado y los efectos sobre la API o el estado de Vue; no hace
falta repetir en comentarios lo que el nombre del codigo ya expresa.

En un archivo `.vue`, el `<template>` contiene el HTML que Vue convierte en
interfaz y el `<script setup>` define el estado y las funciones que ese HTML
utiliza. Por ejemplo, `v-model="form.nombre"` sincroniza un campo con una
propiedad reactiva; `@click="guardar"` llama a la funcion del script;
`{{ titulo }}` muestra un valor; y `v-for="item in elementos"` repite el
bloque por cada registro. Escribe comentarios HTML (`<!-- ... -->`) junto a
las zonas que usan esas conexiones, sobre todo cuando el flujo no sea obvio.

Los archivos `.json` y `package.json` deben seguir siendo JSON valido y no
admiten comentarios. Documenta el significado y el formato de esos datos en
esta guia o en el codigo que los consume, no insertando comentarios en JSON.

## Iniciar la aplicacion en local

1. Instala las dependencias con `npm install`.
2. Inicia MongoDB con `docker compose up -d`.
3. Configura `MONGO_URI` y, si hace falta, `PORT` en `.env`; no copies
   credenciales reales a codigo ni a repositorios compartidos.
4. Ejecuta `npm run start` para iniciar Vite y el servidor Express.

El cliente y el backend usan actualmente `http://localhost:3000/api` como raiz
de la API. Si se cambia el host o el puerto, actualiza las URL de los modulos
correspondientes de `src/api/`.

### Endpoints disponibles

| Metodo | Endpoint | Uso |
|---|---|---|
| `GET` | `/api/pacientes` | Listar pacientes |
| `POST` | `/api/pacientes` | Crear paciente |
| `GET` | `/api/pacientes/:dni` | Buscar paciente por DNI |
| `PUT` | `/api/pacientes/:dni` | Modificar paciente |
| `DELETE` | `/api/pacientes/:dni` | Eliminar paciente |
| `GET` | `/api/doctores` | Listar doctores |
| `GET` | `/api/doctores/:especialidad` | Filtrar doctores por especialidad |
| `POST`, `PUT`, `DELETE` | `/api/doctores` y `/api/doctores/:id` | Gestionar doctores |
| `GET`, `POST` | `/api/citas` | Listar y crear citas |
| `PUT`, `DELETE` | `/api/citas/:id` | Modificar y eliminar citas |
| `GET` | `/api/municipios` | Leer provincias y municipios desde JSON |
| `GET` | `/api/especialidades` | Leer el catalogo estatico de especialidades |

Las rutas de pacientes, doctores y citas necesitan MongoDB. Los catalogos JSON
no dependen de la base de datos. Para cualquier peticion, conserva el manejo del
error en el componente: las funciones Axios rechazan la promesa si el backend
responde con un estado HTTP de error.

### Reutilizar un modulo de API desde otro componente

Importa las funciones desde `src/api/` y carga los datos en `onMounted()`. Las
funciones devuelven directamente el contenido JSON, no el objeto de respuesta
de Axios. Por ejemplo, para crear un selector dependiente de provincia:

```vue
<script setup>
import { onMounted, ref } from "vue"
import { obtenerMunicipios, obtenerProvincias } from "../api/municipios.js"

// Las listas se enlazan a los selectores del template con v-for y v-model.
const provincias = ref([])
const municipios = ref([])

// Carga el primer selector cuando la pantalla ya esta montada.
onMounted(async () => {
  try {
    provincias.value = await obtenerProvincias()
  } catch (error) {
    console.error("No se pudieron cargar las provincias:", error)
  }
})

// Al cambiar de provincia, su id permite cargar solo sus municipios.
async function seleccionarProvincia(idProvincia) {
  try {
    municipios.value = await obtenerMunicipios(idProvincia)
  } catch (error) {
    municipios.value = []
    console.error("No se pudieron cargar los municipios:", error)
  }
}
</script>
```

`/api/municipios` devuelve `{ provincias: [{ id, nm }], municipios: [{ id,
nm }] }`; el identificador de cada municipio empieza por el codigo de su
provincia. `/api/especialidades` devuelve
`{ especialidades: [{ id, nm }] }`. Usa las funciones
`obtenerProvincias()`, `obtenerMunicipios(idProvincia)` y
`obtenerEspecialidades()` para no repetir estas rutas ni su filtrado.

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

Las clases como `w-full`, `p-8`, `rounded-lg` y `shadow` son utilidades
componibles de Tailwind: respectivamente controlan ancho, espaciado, bordes
redondeados y sombra. Las variantes como `hover:` o `max-[768px]:` aplican
estilos bajo una interaccion o un ancho de pantalla. No hace falta memorizar
todas: busca un ejemplo en la plantilla o en los componentes existentes.

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

// Mantener la URL en un solo sitio facilita cambiar el host o puerto de la API.
const API_URL = "http://localhost:3000/api/tareas"

// Cada funcion devuelve res.data para que el componente no dependa de Axios.
export async function getTareas() {
  const res = await axios.get(API_URL)
  return res.data
}

// tarea es el objeto con los campos que espera el modelo de MongoDB.
export async function saveTarea(tarea) {
  const res = await axios.post(API_URL, tarea)
  return res.data
}

// id es el _id devuelto por MongoDB; tarea contiene los campos a actualizar.
export async function modifyTarea(id, tarea) {
  const res = await axios.put(`${API_URL}/${id}`, tarea)
  return res.data
}

// Elimina una tarea usando el mismo identificador que devuelve getTareas().
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
7. Describe con comentarios el proposito de los estados y las funciones que
   no sean evidentes; actualiza esta guia si incorporas un patron compartido.

Ejemplo de la parte esencial del script conectado al API:

```vue
<script setup>
import { onMounted, reactive, ref } from "vue"
import { deleteTarea, getTareas, saveTarea } from "../api/tareas.js"

const tareas = ref([])
// Indicadores vinculados al template para mostrar carga y errores de red.
const cargando = ref(false)
const error = ref("")
// Modelo del formulario; reactive permite acceder a sus propiedades sin .value.
const nuevaTarea = reactive({ titulo: "", descripcion: "" })

// Consulta la API y garantiza que el indicador de carga se restablezca al final.
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

// Envia una copia del formulario para que la capa de API gestione la peticion HTTP.
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

// Elimina por el identificador de MongoDB y actualiza la lista del componente.
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
