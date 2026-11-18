# Glosario

Cada palabra rara en una o dos líneas, en orden alfabético.

| Palabra | Qué es |
|---|---|
| **.env** | Fichero de la raíz con la configuración (`MONGO_URI`, `PORT`). Si lo cambias, reinicia el backend |
| **.value** | Cómo se lee o cambia un `ref` en el `<script>`: `cargando.value`. En el `<template>` no se pone |
| **404 / 400 / 409 / 500** | Códigos del servidor: no encontrado, datos inválidos, conflicto (duplicado), error interno |
| **acción** (store) | Función del store que cambia su estado (`seleccionarPaciente`, `limpiarDoctor`) |
| **API** | El "menú" de URLs del backend (`/api/citas`). Las funciones que las llaman están en `src/api/` |
| **array** | Una lista: `[1, 2, 3]`. `ref([])` guarda listas reactivas |
| **async / await** | Esperar a que termine algo que tarda (una petición) sin bloquear la página |
| **axios** | Librería que hace las peticiones HTTP desde el navegador al backend |
| **backend** | El programa del servidor (`backend/`): recibe peticiones, habla con Mongo y devuelve JSON |
| **booleano** | Un valor que solo puede ser `true` o `false` (por ejemplo `lopdpac`) |
| **breakpoint** | Ancho a partir del cual cambia el diseño (`md:` = desde 768 px) |
| **cascada** | Que un campo dependa de otro: provincia → municipios en `XestionPacientes.vue` |
| **catch** | Ver `try / catch` |
| **clase** (CSS) | Nombre en el atributo `class` que da estilo: `class="centrado"` |
| **colección** | En MongoDB, el conjunto de documentos de un tipo: `pacientes`, `doctores`, `citas` |
| **commit** | "Foto" guardada del proyecto con git, para poder volver atrás |
| **componente** | Pieza de pantalla en un `.vue`. En este proyecto las pantallas están en `src/components/` |
| **computed** | Dato **calculado** a partir de otros que se actualiza solo (y se guarda en caché) |
| **consola** | F12 → Console en el navegador; en rojo salen los errores |
| **CORS** | Permiso para que la web (5173) llame a la API (3000). Ya está con `cors()` en `backend/server.js` |
| **CRUD** | Crear, leer, actualizar y borrar: lo básico de cualquier gestión |
| **docker compose** | Levanta MongoDB en un contenedor (`docker compose up -d`, contenedor `mongodb`) |
| **documento** | En MongoDB, un registro (un paciente, una cita) en formato JSON |
| **DOM** | La página tal como la tiene el navegador en memoria |
| **emit** | Aviso que un componente hijo manda al padre (`emit('editar')`, el padre lo escucha con `@editar`) |
| **endpoint** | Una URL concreta de la API con su método: `GET /api/pacientes/:dni` |
| **esquema** (schema) | En Mongoose, la lista de campos de un modelo y sus reglas |
| **estado** (de una cita) | `pendente`, `confirmada`, `realizada` o `cancelada` |
| **evento** | Algo que pasa: un clic (`@click`), escribir (`@input`), enviar (`@submit.prevent`) |
| **Express** | Librería de Node para hacer el backend: define las rutas de la API |
| **F12** | Abre las herramientas del navegador (consola, red, elementos) |
| **flex / grid** | Las dos formas de colocar elementos en fila, columna o rejilla |
| **getter** | En un store, un dato calculado (`computed`) |
| **hook** (ciclo de vida) | Función que Vue llama en un momento: `onMounted` (al aparecer), `onUnmounted` (al irse) |
| **HTTP** | El idioma con el que navegador y servidor se piden cosas (GET, POST, PUT, DELETE) |
| **id** | Identificador único de cada registro. Mongo lo llama `_id` |
| **jsPDF / AutoTable** | Librerías del PDF: la primera crea el documento, la segunda dibuja la tabla |
| **JSON** | Formato de texto para datos: `{ "nomepac": "Ana", "movilpac": "600000000" }` |
| **`localhost:3000` / `:5173`** | La API / la web en desarrollo |
| **MongoDB** | La base de datos donde se guarda todo (documentos en colecciones) |
| **Mongoose** | Librería del backend para trabajar con MongoDB con modelos y validaciones |
| **middleware** | Función del backend que se ejecuta en cada petición antes de las rutas (`cors`, `express.json`) |
| **modelo** | Descripción de un tipo de dato con Mongoose: `backend/modelos/Cita.js` |
| **pinia** | Librería de estado global de Vue. Aquí `src/store/pacienteStore.js` y `doctorStore.js` |
| **prop** | Dato que el padre pasa al hijo: `<Tarjeta :fila="item" />` |
| **promesa** (Promise) | Un valor que llegará más tarde (la respuesta del servidor). Se espera con `await` |
| **reactividad** | Que la pantalla se actualice sola cuando cambia un dato |
| **reactive** | Como `ref` pero para objetos y sin `.value`. Se usa en los formularios (`cita`, `novoPaciente`) |
| **ref** | Dato que, al cambiar, actualiza la pantalla. En el script se lee con `.value` |
| **regex** | Patrón para comprobar texto: `/^\d{8}[A-Z]$/` valida el DNI |
| **router** | La pieza que decide qué pantalla se ve según la URL (`src/router/index.js`) |
| **ruta** | (1) En el frontend: URL + componente. (2) En el backend: URL de la API + qué hace (`backend/rutas/`) |
| **script setup** | La parte del `.vue` con la lógica (datos, funciones, imports) |
| **scoped** | `<style scoped>`: los estilos solo afectan a ese componente |
| **slot** | Hueco de un componente donde el padre mete contenido |
| **SPA** | Aplicación de una sola página: al navegar no se recarga |
| **store** | Almacén de datos compartido entre pantallas (Pinia) |
| **storeToRefs** | Sacar datos de un store sin que dejen de ser reactivos |
| **SweetAlert2** | Librería de avisos bonitos, centralizada en `src/utils/alertas.js` |
| **Tailwind** | Estilos con clases pequeñas (`p-4`, `text-sm`, `bg-[#1b4965]`) |
| **template** | La parte del `.vue` con lo que se ve (HTML) |
| **ternario** | Un `if` en una línea: `condición ? siSí : siNo` |
| **`try / catch`** | Intentar algo y, si falla, hacer otra cosa en vez de romperse |
| **`v-model`** | Enlaza un campo de formulario con un dato en los dos sentidos |
| **validación** | Comprobar que un dato es correcto antes de guardarlo (en la web y en el servidor) |
| **`v-for` / `:key`** | Repetir un trozo por cada elemento de una lista, con una clave única por fila |
| **Vite** | Sirve la web mientras programas (`npm run dev`) y la empaqueta al final (`npm run build`) |
| **watch** | Ejecuta código cuando cambia un dato (recargar al cambiar la selección) |
