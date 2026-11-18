# Teoría con respuesta corta

Preguntas que pueden caer en la parte teórica o que sirven para **defender el código**.
Las respuestas están escritas pensando en esta app: cuando se puede, se nombra el
fichero real donde está el ejemplo.

## Vue y composición

**¿Qué es Vue?** Un framework de JavaScript para construir interfaces con componentes
reactivos: cuando cambia un dato, la vista se actualiza sola.

**¿Qué es un componente?** Un fichero `.vue` con tres bloques: `<template>` (lo que se
ve), `<script setup>` (la lógica) y `<style scoped>` (los estilos, si hacen falta).

**Options API vs Composition API.** Options reparte la lógica en `data`, `methods`,
`computed`, `mounted` y usa `this`. La Composition API con `<script setup>` escribe todo
junto, sin `this`, sin `export default` ni `return`, y permite extraer lógica
reutilizable a funciones. Todo este proyecto usa `<script setup>`.

**¿Qué hace Vite?** Sirve el proyecto en desarrollo con recarga instantánea (`npm run
dev`) y lo empaqueta para producción en `dist/` (`npm run build`).

**¿Cómo arranca la app?** `index.html` (contiene `<div id="app">`) → `src/main.js`
(monta la app, Pinia y el router) → `src/App.vue` (NavBar, `<router-view />`, FooTer) →
el componente de la ruta actual.

**`ref` vs `reactive`.** `ref` vale para cualquier valor y en el `<script>` se lee con
`.value`; `reactive` solo para objetos, se accede a las propiedades directamente y no se
puede sustituir entero. En `Citas.vue`, la lista es `ref([])` y el formulario es
`reactive(citaVacia())`.

**`computed` vs una función.** `computed` se recalcula solo cuando cambian sus
dependencias y guarda el resultado en caché; una función se ejecuta en cada repintado.
Por eso `formularioValido` en `Citas.vue` es `computed`.

**`computed` vs `watch`.** `computed` **devuelve** un valor derivado. `watch` **hace
algo** cuando cambia un dato: en `Citas.vue` se usa para vaciar la lista y recargar
cuando cambian el paciente o el doctor seleccionados.

**`v-if` vs `v-show`.** `v-if` añade o quita el elemento del DOM; `v-show` lo oculta con
`display: none`. `v-show` conviene si se alterna mucho; `v-if` si cambia poco o hay
`v-else` (como el `v-if="cargando" / v-else-if / v-else"` de la tabla de citas).

**¿Para qué sirve `:key` en `v-for`?** Para que Vue identifique cada elemento y reutilice
el correcto al cambiar la lista. Debe ser único: en `Citas.vue` se usa `item._id`.

**`v-model`.** Enlace en dos sentidos entre un campo y un dato. Modificadores: `.number`,
`.trim` (se usa en el motivo y las observaciones de la cita), `.lazy`.

**`:` y `@`.** `:` (v-bind) asigna a un atributo el valor de una expresión; `@` (v-on)
ejecuta código ante un evento (`@submit.prevent="guardarCita"`).

**`v-html`.** Inserta HTML sin escapar; si viene del usuario puede inyectar scripts
(XSS). En este proyecto no se usa.

**Ciclo de vida.** `onMounted` (cargar datos: las citas se piden al montar la pantalla),
`onUpdated`, `onUnmounted` (limpiar temporizadores y listeners). Sin `onUnmounted` un
`setInterval` sigue vivo al cambiar de pantalla.

## Router y componentes

**¿Qué es una SPA?** Una sola página HTML; al navegar, JavaScript cambia el componente
sin recargar el navegador.

**`RouterLink`, `RouterView`, `useRoute`, `useRouter`.** `RouterLink` navega sin recargar;
`RouterView` es el hueco donde se pinta la pantalla de la URL; `useRoute` **lee** la ruta
actual (`params`, `query`); `useRouter` **navega** desde el código (`router.push(...)`).

**`createWebHistory` vs `createWebHashHistory`.** History da URLs limpias (`/citas`) y
necesita que el servidor devuelva `index.html` en cualquier ruta; hash (`/#/citas`)
funciona en cualquier servidor pero es menos limpio. Aquí se usa history.

**Ruta comodín.** `/:pathMatch(.*)*`, la última, muestra `components/NotFound.vue`.

**Ruta con parámetro.** `/paciente/:id`; se lee con `useRoute().params.id`. Si la URL
cambia sin salir del componente, hay que vigilarla con `watch`, porque `onMounted` no se
vuelve a ejecutar.

**Props y emit.** Los datos bajan del padre al hijo con props (solo lectura); los avisos
suben con `emit` (el hijo no modifica los datos del padre). "Props abajo, eventos arriba".

**Slots.** Huecos que deja un componente para que el padre meta contenido, con nombre
(`#acciones`) o con datos.

**Componentes fijos.** NavBar y FooTer van en `App.vue`, fuera de `<router-view>`, para
que no se desmonten al navegar.

## CRUD y API REST

**¿Qué es una API REST?** Un servidor que expone recursos en URLs (`/api/citas`) y usa
los métodos HTTP: GET leer, POST crear, PUT/PATCH actualizar, DELETE borrar. Responde JSON.

**¿Qué es CRUD?** Create, Read, Update, Delete: las cuatro operaciones básicas.

**¿Por qué una capa `src/api/`?** Para no repetir URLs ni axios en las vistas: cada
recurso tiene sus funciones (`getPacientes`, `saveCita`…) y las pantallas solo las llaman.

**Axios y `async/await`.** Axios devuelve una promesa; los datos van en `respuesta.data`.
`await` espera sin bloquear la página y los errores se capturan con `try/catch`.

**Variables de entorno en Vite.** Solo llegan al navegador las que empiezan por `VITE_` y
se leen con `import.meta.env.VITE_API_URL`. `MONGO_URI` y `PORT` son del backend.

**Express.** Framework de Node. `app.use(express.json())` rellena `req.body`; `cors()`
permite que la web (otro puerto) llame a la API.

**Mongoose.** Trabaja con MongoDB usando **esquemas** (campos, tipos, `required`,
`match`, `validate`) y **modelos** (`find`, `create`, `findOneAndUpdate`,
`findByIdAndDelete`).

**MongoDB.** Base de datos NoSQL de documentos (JSON/BSON) agrupados en colecciones. Cada
documento tiene `_id`; el esquema es flexible, pero Mongoose **ignora** los campos que no
estén en el modelo.

**Códigos HTTP.** 200 OK, 201 creado, 204 sin contenido, 400 datos inválidos, 404 no
encontrado, 409 conflicto (duplicado), 500 error del servidor.

**Pinia o la URL para pasar un dato.** Pinia comparte estado en la sesión pero se pierde al
recargar y no se puede enlazar; el parámetro de ruta sobrevive a F5 y se comparte, pero hay
que vigilarlo con `watch`. No son excluyentes.

**¿Por qué dos validaciones?** En el navegador para avisar rápido (DNI con letra en
`XestionPacientes.vue`); en el servidor porque es la que garantiza los datos: se puede
saltar la del cliente con DevTools o `curl`.

## Tailwind

**¿Qué es Tailwind?** CSS "utility-first": clases pequeñas de una sola función que se
combinan en el HTML o en `@apply` dentro de `src/style.css`.

**Ventajas.** No se inventan nombres de clases, el diseño es consistente (escala fija de
espacios y colores) y solo se genera el CSS que se usa.

**Mobile-first.** Las clases sin prefijo valen para todo; `sm:`, `md:`, `lg:` aplican
**desde** ese ancho hacia arriba. En `src/style.css` ese patrón está en los `@media
(max-width: 768px)` y `(max-width: 480px)`.

**¿Por qué no construir una clase concatenando?** Tailwind busca en el código las clases
escritas enteras para generar el CSS; un nombre montado en tiempo de ejecución no existe y
no se genera.

**Tailwind 4.** Se configura en CSS (`@import "tailwindcss/..."` y `@theme`), no en
`tailwind.config.js`; con Vite se usa el plugin `@tailwindcss/vite` (ya está en
`vite.config.js`).

**Clases condicionales.** `:class` con objeto: `:class="{ 'animate-spin': cargando }"`.

## SweetAlert2

**¿Para qué?** Ventanas de aviso y confirmación en vez de `alert()` y `confirm()`.

**Cómo se usa aquí.** `src/utils/alertas.js` centraliza `alertaExito`, `alertaError`,
`alertaInfo` y `alertaConfirmacion`. Todas devuelven la promesa de `Swal.fire`, así que se
pueden esperar con `await`.

**Confirmación antes de borrar.** `alertaConfirmacion(texto, titulo)` devuelve el
resultado de SweetAlert2; se comprueba `resultado.isConfirmed` antes de llamar a la API.

**Opciones útiles.** `timer` (se cierra sola), `toast: true` + `position` (aviso pequeño),
`input: "text"` (pide un dato al usuario).

## PDF

**Librerías.** `jspdf` crea el documento y `jspdf-autotable` dibuja la tabla.

**Cómo está montado.** `generarPDF()` en `src/utils/pdf.js` recibe `titulo`, `cabeceras`,
`filas`, `nombreArchivo`, `descripcion` y `orientacion`, y hace `doc.save(...)` al final.

**Carga bajo demanda.** jsPDF y AutoTable se importan con `await import(...)` para que no
pesen en la carga inicial de la app.

**Varias páginas.** AutoTable salta de página solo; para repetir un pie se usa
`didDrawPage` recorriendo la página actual (`doc.internal.getCurrentPageInfo()`).

## Pinia

**¿Qué es?** La librería oficial de estado global de Vue (sustituye a Vuex).

**Partes de un store.** Estado (`ref`), getters (`computed`) y acciones (funciones). Con
sintaxis setup: `defineStore("id", () => { ...; return { ... } })`.

**`storeToRefs`.** Sirve para desestructurar el estado sin perder la reactividad; las
acciones se pueden desestructurar sin problema.

**¿Cuándo un store?** Cuando varias pantallas comparten un dato o hay que llevarlo de una a
otra: en este proyecto `pacienteStore` y `doctorStore` guardan la selección de cada gestión
y `Citas.vue` la lee para filtrar.

**¿Qué no hace Pinia?** No persiste al recargar (salvo que se programe), no queda en la URL
y no es seguridad: no debe guardar datos sensibles.

## Principios de diseño de interfaces

**Jerarquía visual.** Lo importante, más grande, más fuerte o primero (título > subtítulo >
texto).

**Consistencia.** Mismos colores, botones y espacios en toda la app; en este proyecto los
tokens viven en `:root` y `@theme` de `src/style.css`.

**Espaciado.** Escala fija (múltiplos de 4 px en Tailwind) y aire alrededor de los bloques.

**Color y contraste.** Pocos colores con significado (`#1b4965` acción principal,
`#e3342f` error) y contraste suficiente para leer: WCAG AA pide 4,5:1 en texto normal.

**Estados de un botón.** Normal, hover, focus, active y disabled; los cinco deben
distinguirse. Aquí están definidos en `src/style.css` (`:hover`, `:focus-visible`,
`:disabled`).

**Feedback.** El usuario siempre sabe qué pasa: "Cargando citas...", alertas de éxito y
error, campos en rojo.

**Accesibilidad.** `<label for>` en cada campo, `aria-label` en botones de solo icono,
`alt` en imágenes, foco visible, errores con texto y no solo con color.

**Responsive.** Mobile-first con breakpoints; en pantallas pequeñas las tablas hacen scroll
horizontal dentro de su contenedor (`.citas-tabla-wrapper`).

## Defender tu código

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué `computed` y no una función? | Se recalcula solo cuando cambian sus datos y guarda el resultado; la función se ejecutaría en cada repintado |
| ¿Por qué `storeToRefs`? | Para desestructurar el estado del store sin perder la reactividad |
| ¿Por qué copias con `{ ...datos }`? | Para no enviar ni guardar el objeto reactivo del formulario y que limpiarlo después no altere lo guardado |
| ¿Por qué un store y no un `ref`? | Porque ese dato lo usan varias pantallas y tiene que sobrevivir al cambio de pantalla |
| ¿Por qué `try/catch`? | Para que un error del servidor muestre una alerta en vez de dejar la pantalla rota |
| ¿Por qué validas en cliente y servidor? | En el cliente para avisar rápido; en el servidor porque es el que garantiza los datos |
| ¿Por qué 409 y no 400? | 400 es "datos mal formados"; 409 es "datos correctos pero en conflicto con lo que ya hay" |
| ¿Por qué `:key` con `_id`? | Para que Vue identifique cada fila y no reutilice la de otra cita al filtrar |
| ¿Por qué `onUnmounted`? | Para parar temporizadores y listeners al salir; si no, se acumulan |
| ¿Por qué `watch` aquí? | Porque al cambiar la selección hay que **hacer** algo (vaciar y recargar), no solo calcular |
| ¿Por qué `/api/citas` antes de `/:id`? | Express prueba las rutas en orden; `/:id` capturaría cualquier texto |
| ¿Por qué una capa `src/api/`? | Para centralizar URLs y manejo de errores y no repetirlos en cada componente |
