# Proyecto de gestión clínica

Este repositorio está pensado como una aplicación de gestión clínica con arquitectura frontend/backend clara y reutilizable:

- `src/components/` contiene las pantallas y componentes de Vue.
- `src/api/` encapsula las llamadas HTTP con Axios.
- `src/router/` decide qué pantalla se muestra según la ruta.
- `src/store/` guarda estado global compartido.
- `src/utils/` reúne utilidades reutilizables.
- `backend/` contiene la API REST con Express y modelos Mongoose.
- `backend/data/` incluye JSON estáticos para municipios y especialidades.

La idea principal del proyecto es que cualquier nueva pantalla se pueda construir siguiendo una secuencia repetible:

1. definir la entidad y sus campos,
2. crear el modelo en backend,
3. crear la ruta API,
4. crear el servicio frontend para consumirla,
5. copiar la plantilla base del componente,
6. montar la ruta en el router,
7. añadir el acceso desde el menú.

## 1. Cómo arrancar la aplicación

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Levanta MongoDB:
   ```bash
   docker compose up -d
   ```
3. Crea un `.env` con al menos:
   ```env
   MONGO_URI=mongodb://localhost:27017/clinica
   PORT=3000
   ```
4. Arranca la aplicación:
   ```bash
   npm run start
   ```
5. Accede a la app desde:
   ```text
   http://localhost:5173
   ```

La API estará disponible en:
```text
http://localhost:3000/api
```

## 2. Estructura clave del proyecto

### Frontend

- `src/components/PlantillaComponente.vue`: plantilla de referencia para crear nuevas pantallas CRUD.
- `src/App.vue`: estructura global con `NavBar`, `router-view` y `FooTer`.
- `src/router/index.js`: mapea rutas con componentes.
- `src/main.js`: monta la aplicación Vue, Pinia y router.

### Backend

- `backend/server.js`: arranca Express, conecta MongoDB y monta las rutas.
- `backend/modelos/`: definiciones Mongoose.
- `backend/rutas/`: endpoints HTTP para cada entidad.
- `backend/data/`: fichas estáticas usadas por municipios y especialidades.

### API del cliente

- `src/api/*.js`: funciones para pedir/guardar/borrar datos.
- Cada módulo de API centraliza las rutas y el manejo de errores.
- El componente no tiene que construir URLs en el template.

## 3. Patrón recomendado para crear una pantalla nueva

El flujo correcto es siempre este:

1. Diseñar la entidad y los campos.
2. Crear el modelo Mongoose.
3. Crear el router Express.
4. Montar la ruta en el servidor.
5. Crear la capa `src/api/`.
6. Copiar `PlantillaComponente.vue` y adaptarlo.
7. Cargar datos con `onMounted()`.
8. Añadir la ruta nueva al router.
9. Añadir el enlace al menú.
10. Validar con `npm run build`.

## 4. Qué usar como base para copiar

La referencia principal del proyecto es:

- [src/components/PlantillaComponente.vue](./src/components/PlantillaComponente.vue)
- [src/components/XestionPacientes.vue](./src/components/XestionPacientes.vue): CRUD conectado a su API.
- [src/components/XestionDoctores.vue](./src/components/XestionDoctores.vue): CRUD con selector de catálogo.
- [src/components/Citas.vue](./src/components/Citas.vue): pantalla que combina API, relaciones y selecciones compartidas.

La plantilla es un catálogo visual y su lista de ejemplo solo vive en memoria. Para ver un CRUD que persiste en MongoDB, compara pacientes o doctores con sus módulos `src/api/`, modelos y rutas de `backend/`.

La plantilla muestra un patrón completo de:

- formulario de alta/modificación,
- validación de inputs,
- filtrado de la lista,
- carga de datos,
- edición,
- borrado,
- visualización de estados,
- mensajes de error,
- uso de Tailwind.

No hace falta inventar una estructura nueva: se puede replicar adaptando los nombres.

### Datos compartidos y persistentes no son lo mismo

- `ref()` y `reactive()` guardan estado local mientras vive el componente.
- Pinia (`src/store/`) comparte selecciones entre componentes durante la sesión abierta.
- MongoDB guarda registros persistentes, consultados por medio de Express y `src/api/`.

Ejemplos reales de este repositorio:

- [src/store/doctorStore.js](./src/store/doctorStore.js) y [src/store/pacienteStore.js](./src/store/pacienteStore.js) muestran selección y limpieza de datos compartidos.
- [src/components/Citas.vue](./src/components/Citas.vue) lee esos stores y usa el DNI del paciente y el identificador del doctor para filtrar y guardar citas.
- [backend/modelos/Cita.js](./backend/modelos/Cita.js) y [backend/rutas/citas.rutas.js](./backend/rutas/citas.rutas.js) muestran el DNI del paciente y la comprobación de las relaciones de la cita.

Pinia no sustituye MongoDB: los valores del store se pierden al recargar, salvo que se programe persistencia; este repositorio no la configura.

## 5. Cómo pensar un nuevo componente

Antes de programar, responde a estas preguntas:

- ¿Qué entidad necesito guardar?
- ¿Qué campos son obligatorios?
- ¿Qué campos son opcionales?
- ¿Necesito cargar datos desde la API o son estáticos?
- ¿Necesito filtros, búsqueda, edición o solo visualización?
- ¿Cuál es la clave única del registro? (ej. `_id`, DNI, email, etc.)

Ejemplo mínimo:

```js
const entidad = {
  nombre: "",
  descripcion: "",
  activo: true
}
```

La clave es mantener nombres idénticos en:

- modelo Mongoose,
- rutas Express,
- módulo `src/api/`,
- `reactive()` o `ref()` del componente,
- `v-model` del template.

## 6. Regla de oro: mantener consistencia entre capas

Si defines un campo como `nombre`, no lo llames luego `nom`, `titulo`, `nombrePaciente` en distintas capas. Eso rompe la sincronización del formulario.

Ejemplo correcto:

- backend: `nombre`
- API: `saveEntidad({ nombre })`
- componente: `const form = reactive({ nombre: "" })`
- template: `v-model="form.nombre"`

## 7. Guías de creación paso a paso

Las guías más útiles para el examen están en:

- [GUIA-CREAR-COMPONENTE.md](./GUIA-CREAR-COMPONENTE.md)
- [GUIA-EXAMEN-COMPONENTES.md](./GUIA-EXAMEN-COMPONENTES.md)

La primera es la guía general del proyecto y la segunda es una versión ultra guiada, pensada para resolver un examen sin salir del repositorio ni depender de información externa.

Allí se explica detalladamente:

- cómo diseñar la entidad,
- crear el modelo MongoDB,
- montar rutas del backend,
- crear el módulo `src/api/`,
- copiar la plantilla,
- enlazar el componente al router,
- añadirlo al menú,
- usar validación y carga de datos,
- comprobar la compilación final.
- escoger entre copiar la plantilla o adaptar un CRUD existente,
- distinguir memoria local, Pinia y datos persistidos en MongoDB,
- seguir una relación de documentos desde el componente hasta las rutas.

## 8. Qué hace que un componente sea reutilizable

Para que un componente se pueda replicar fácilmente sin ayuda externa:

- usa `ref` y `reactive` con nombres claros,
- documenta cada bloque importante con comentarios,
- separa la lógica del HTML,
- centraliza llamadas HTTP en `src/api/`,
- usa `onMounted()` para carga inicial,
- usa `computed` para listas filtradas,
- muestra errores con `error.value` en vez de ocultarlos,
- conserva un patrón consistente de `guardar`, `editar`, `eliminar`, `limpiar`.

## 9. Buenas prácticas del proyecto

- El template debe centrarse en la interfaz, no en la lógica de negocio.
- Las llamadas a la API se hacen en funciones del script, no directamente en el template.
- Si hay un selector dependiente, carga el siguiente según el valor previo.
- Si un botón no envía formulario, usa `type="button"`.
- Si hay edición, activa `editando` para cambiar texto del botón y lógica.
- Si la base de datos falla, devuelve errores claros por HTTP y manejalos en el componente.

## 10. Checklist antes de dar un componente por validado

- ¿Existe modelo y ruta del backend?
- ¿La ruta está montada en `backend/server.js`?
- ¿La API del frontend usa la misma URL y nombres de campos?
- ¿El template tiene `@submit.prevent` en el formulario?
- ¿Los inputs están enlazados con `v-model` a variables del script?
- ¿La lista usa `v-for` con `:key`?
- ¿La carga se realiza en `onMounted()`?
- ¿Los mensajes de error aparecen en UI?
- ¿La ruta está registrada en `src/router/index.js`?
- ¿El componente se puede entrar desde el menú?
- ¿Compila con `npm run build`?

## 11. Recomendaciones extra para crear componentes nuevos sin IA ni documentación externa

Estas son prácticas que ayudan a crear componentes nuevos a mano:

1. Empieza por la entidad, no por el HTML.
   - Haz una lista de campos y decide cuál es obligatorio.
2. Construye primero el objeto del formulario.
   - Si `reactive({ ... })` funciona, el template será más fácil.
3. Haz primero el bloque de la plantilla con los campos principales.
   - Después añade la tabla con v-for.
4. Añade la carga inicial antes de la lógica de edición.
5. Valida cada campo con una función pequeña y reutilizable.
6. Define una sola fuente de verdad para los datos.
   - Si cambias un nombre, cambia también los nombres en backend y API.
7. Mantén la API y el componente desacoplados.
8. Si algo se repite en varios componentes, conviértelo en una utilidad o componente más pequeño.
9. Usa comentarios de contexto, no comentarios redundantes.
   - Comenta lo que no se ve a simple vista, como por ejemplo un `onMounted()`, un filtro o una validación.
10. Revisa el código como si otra persona tuviera que entenderlo en una sola pasada.

## 12. Archivos básicos para referencia rápida

- [src/components/PlantillaComponente.vue](./src/components/PlantillaComponente.vue)
- [src/router/index.js](./src/router/index.js)
- [backend/server.js](./backend/server.js)
- [src/api/pacientes.js](./src/api/pacientes.js)
- [backend/modelos/Paciente.js](./backend/modelos/Paciente.js)

La forma más segura de crear un componente nuevo en este proyecto es copiar la plantilla, cambiar el nombre de la entidad y seguir exactamente el mismo patrón de flujo: datos → backend → API → componente → router → menú.
