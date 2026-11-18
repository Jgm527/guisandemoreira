import { RESOURCE_LIBRARY, escapeHtml, js, slugify } from "../datos.js"
import { catalogApiFunctionName, catalogRoutePath, collectCatalogs } from "../catalogos.js"

// Sección común para las pantallas que cargan algún selector desde un JSON de
// backend/data: explica el archivo, el módulo de API, la ruta y el filtro.
function catalogsSection(config) {
  const catalogs = collectCatalogs(config)
  if (!catalogs.length) return ""
  const fieldsUsing = (name) => (config.fields ?? [])
    .filter((field) => field.type === "catalog" && field.catalog.name === name)
    .map((field) => `\`${field.name}\`${field.catalog.parentField ? ` (filtrado por \`${field.catalog.parentField}\`)` : ""}`)
    .join(", ")
  const blocks = catalogs.map((catalog) => {
    const loadFunction = catalog.apiFunction || catalogApiFunctionName(catalog.name)
    const dataLine = catalog.source === "inline"
      ? `- \`backend/data/${catalog.name}.json\`: datos analizados y guardados por el generador (${catalog.count ?? "los"} elementos de la lista \`${catalog.rootKey || "(la raíz es una lista)"}\`).`
      : `- \`backend/data/${catalog.name}.json\`: archivo que ya existe en el proyecto; no se copia ni se modifica.`
    const apiLine = catalog.apiFunction
      ? `- \`src/api/${catalog.name}.js\`: se reutiliza la función \`${loadFunction}()\` que ya existe; no se genera otro módulo.`
      : `- \`src/api/${catalog.name}.js\`: módulo Axios generado con \`${loadFunction}()\`, que devuelve la lista del catálogo.`
    const metadataLine = catalog.primitive
      ? "- La lista contiene valores simples: el `<select>` usa cada valor tal cual."
      : `- Campo visible: \`${catalog.labelField}\`; valor guardado en el formulario: \`${catalog.valueField}\`; identificador: ${catalog.idField ? `\`${catalog.idField}\`` : "no detectado"}.`
    const route = catalog.apiFunction && catalog.routeExists
      ? `La ruta \`${catalogRoutePath(catalog.name)}\` ya está registrada en \`backend/server.js\`; no la dupliques.`
      : `Registra esta ruta una sola vez en \`backend/server.js\`, junto a las de \`/api/municipios\` y \`/api/especialidades\`:

\`\`\`js
app.get("${catalogRoutePath(catalog.name)}", (req, res) => {
  // La ruta se resuelve respecto a backend/server.js, no al directorio de arranque.
  const datos = fs.readFileSync(new URL("./data/${catalog.name}.json", import.meta.url), "utf-8");
  res.json(JSON.parse(datos));
});
\`\`\`

Si la ruta ya existe en el proyecto, no añadas otra.`
    return `### Catálogo \`${catalog.name}\`

${dataLine}
${apiLine}
${metadataLine}
- Campos del formulario que lo usan: ${fieldsUsing(catalog.name)}.

${route}`
  }).join("\n\n")

  return `## Catálogos cargados desde archivo JSON

Los campos de tipo **catálogo** no usan opciones fijas: cargan su lista de un JSON estático servido por el backend, igual que la especialidad de los doctores (\`backend/data/especialidades.json\` → \`/api/especialidades\`) y los municipios (\`backend/data/municipios.json\` → \`/api/municipios\`). El componente los pide en \`cargarCatalogos()\`, que se ejecuta en \`onMounted()\`, y pinta un \`<select>\` con \`v-for\`.

${blocks}

### Filtro dependiente (provincia → municipio)

Si un campo catálogo declara \`parentField\`, el componente busca el registro del catálogo padre por el valor guardado y filtra el hijo con \`startsWith\` sobre los identificadores; es el patrón de \`XestionPacientes.vue\`. Al cambiar el padre se vacía la selección dependiente. Requiere que el identificador del hijo empiece por el del padre y que ambos catálogos tengan identificador.

### Límites de los catálogos

- Son catálogos de solo lectura: no se generan altas, ediciones ni borrados de opciones.
- El backend guarda el valor elegido como texto (como \`espedoc\` en \`backend/modelos/Doctor.js\`) y no lo valida contra el JSON; añade esa comprobación en la ruta si la necesitas.
- Los cambios en el JSON se ven al recargar la pantalla: no se genera caché, paginación ni búsqueda sobre el catálogo.
`
}

export function generateInstructions(config) {
  const { singular, plural, apiPath } = config.entity
  const { component, route, menuLabel, title, type } = config.screen
  const relations = config.relations
  const piniaRelations = relations.filter((relation) => relation.selection === "pinia")
  const ownStoreVariable = config.pinia.enabled
    ? `${singular[0].toLowerCase()}${singular.slice(1)}Store`
    : ""
  const catalogFilesText = collectCatalogs(config)
    .flatMap((catalog) => [
      catalog.source === "inline" ? `- \`backend/data/${catalog.name}.json\`: datos del catálogo analizados y guardados.` : "",
      catalog.apiFunction ? "" : `- \`src/api/${catalog.name}.js\`: capa Axios del catálogo \`${catalog.name}\`.`,
    ])
    .filter(Boolean)
    .join("\n")
  const operationsText = config.operations.map((operation) => ({
    list: "listar",
    create: "crear",
    edit: "editar",
    delete: "borrar",
  })[operation]).join(", ")
  const menuFragment = menuLabel
    ? `\n\nPara añadir el enlace del menú, revisa el estilo de [src/components/NavBar.vue](../../../../src/components/NavBar.vue) e inserta dentro de su navegación un enlace como este:\n\n\`\`\`vue\n<RouterLink to="${escapeHtml(route)}">${escapeHtml(menuLabel)}</RouterLink>\n\`\`\`\n`
    : "\n\nNo se solicitó un enlace de menú. Si lo necesitas, añade uno manualmente a `src/components/NavBar.vue`."

  if (config.source === "existing") {
    const resourceMeta = RESOURCE_LIBRARY[config.existingResource] ?? null
    const resourceLabel = resourceMeta?.label ?? config.existingResource
    const operationLabels = { list: "listar", create: "crear", edit: "editar", delete: "borrar" }
    const supportedText = resourceMeta
      ? Object.keys(resourceMeta.apiFunctions).map((operation) => operationLabels[operation] ?? operation).join(", ")
      : operationsText
    const referenceText = resourceMeta
      ? resourceMeta.referenceFiles.map((file) => `- \`${file}\``).join("\n")
      : "- los módulos de `src/api/` del proyecto"
    return `# Integración de ${title}

## Resumen

Se reutiliza el recurso existente **${resourceLabel}** (\`${config.existingResource}\`) para la pantalla **${title}** (${type}). No se genera backend nuevo ni se duplica ninguna colección: la pantalla llama a la API real del proyecto con las funciones que ya exporta \`src/api/${resourceMeta?.apiFile ?? ""}\`.

Las operaciones reales que ofrece este recurso son: ${supportedText}. Si la pantalla necesita una operación fuera de esa lista, hay que implementarla primero en el backend y en el módulo de la API.

## Identificador real del recurso

${resourceMeta?.catalogOnly
  ? "Esta API es un catálogo de solo lectura: devuelve listas generadas desde un archivo JSON y no trabaja con identificadores por documento, así que la pantalla generada solo consulta y muestra."
  : (config.entity.idField === "_id"
      ? "Esta API localiza cada documento por `_id`, el identificador automático de MongoDB."
      : `Esta API localiza cada documento por \`${config.entity.idField}\`, no por \`_id\`. \`_id\` sigue existiendo en MongoDB, pero no identifica el recurso en esta API.`) + ` El componente generado usa \`item.${config.entity.idField}\` como clave de la tabla y al editar o borrar.`}

${resourceMeta?.notes ? `**Importante:** ${resourceMeta.notes}\n\n` : ""}## Archivos que fundamentan el patrón

${referenceText}

Lee esos archivos para confirmar los nombres reales de los campos antes de copiar el componente; si algún campo configurado no coincide, ajústalo.

${catalogsSection(config)}
## Archivos generados

- \`src/components/${component}.vue\`: pantalla Vue comentada, bloque a bloque, que consume la API real del proyecto.
- \`configuracion.json\`: respuestas del formulario guardadas para poder revisar o regenerar la propuesta.
- \`INSTRUCCIONES.md\`: esta guía de integración.

## Qué NO genera esta entrega

- No se genera ningún archivo de backend: ni modelos, ni routers, ni módulos de API nuevos.
- Si un campo configurado no coincide con el modelo real, corrige su nombre en el componente antes de copiarlo.
- Si la pantalla necesita filtros o datos que la API actual no ofrece, amplíalos manualmente en el backend y en \`src/api/\`.

## Orden recomendado

1. Compara los campos configurados con el modelo real del recurso y ajusta los nombres que no coincidan.
2. Copia el componente a \`src/components/${component}.vue\`.
3. Registra la pantalla en el router del proyecto, antes de la ruta comodín \`/:pathMatch(.*)\`:

\`\`\`js
import ${component} from "../components/${component}.vue";

{ path: "${escapeHtml(route)}", name: "${component}", component: ${component} },
\`\`\`
${menuFragment}
## Comprobaciones manuales

- Comprueba que la pantalla carga la API real sin errores de red.
- Prueba las operaciones elegidas: ${operationsText}.
- Asegúrate de que la lista y el formulario usan los campos reales que devuelve la API.
- Ejecuta \`npm run build\` para validar que el componente compila en el proyecto; este comando no comprueba que la API responda correctamente ni que MongoDB esté conectada.

## Límites de esta entrega

- No se genera backend nuevo, para no duplicar recursos reales.
- Las relaciones con otras entidades y los stores de Pinia no se generan al reutilizar un recurso; complétalos a mano.
- Los campos catálogo sí se generan: consumen su JSON de \`backend/data\` como se explica arriba.
- Esta versión solo se apoya en recursos ya presentes en el repositorio y no inventa rutas ni colecciones.
`
  }

  return `# Integración de ${title}

## Resumen

Se generó una pantalla **${type}** para **${title}**, con operaciones para ${operationsText}. La colección nueva se llamará \`${plural}\`, la API estará en \`${apiPath}\` y MongoDB usará \`_id\`.

Esta herramienta solo guarda archivos en su carpeta de salida. No modifica ni ejecuta el proyecto y no se monta ni se registra automáticamente en la app real.

## Archivos generados

- \`backend/modelos/${singular}.js\`: esquema Mongoose.
- \`backend/rutas/${slugify(plural)}.rutas.js\`: router Express.
- \`src/api/${slugify(plural)}.js\`: capa Axios que solicita todos los documentos sin filtros.
- \`src/components/${component}.vue\`: pantalla Vue.
${config.pinia.enabled ? `- \`src/store/${slugify(singular)}Store.js\`: store Pinia propio.\n` : ""}${catalogFilesText ? `${catalogFilesText}\n` : ""}- \`configuracion.json\`: configuración reutilizable.
${config.pinia.enabled ? `
## Store Pinia propio

El componente genera \`seleccionar${singular}(registro)\` y usa \`limpiar${singular}()\` para compartir \`id${singular}\` y los campos mínimos configurados.
` : ""}${relations.length ? `
## Relaciones

El router incluye \`validarRelaciones()\`, que comprueba que los documentos relacionados existen antes de crear o editar. Pacientes se valida por \`dnipac\`; doctores y citas se validan por \`_id\`. Si una referencia no existe, el backend responde 400.
` : ""}
${catalogsSection(config)}
## Conectar MongoDB y crear o actualizar la colección

1. Comprueba que \`MONGO_URI\` existe en el entorno usado por \`backend/server.js\` y apunta a una base MongoDB disponible.
2. Una colección nueva se crea al guardar el primer documento. Mongoose usa \`${plural}\` mediante \`collection: "${plural}"\`.
3. Si amplías una entidad existente, añade los campos nuevos a \`backend/modelos/<Entidad>.js\` antes de usar el formulario. MongoDB no modifica automáticamente los documentos antiguos.
4. Reinicia backend y frontend después de integrar el modelo y el router.

## Integración de backend

1. Copia el modelo y el router a sus rutas del proyecto.
2. En \`backend/server.js\`, importa el router y registra el prefijo usando exactamente el nombre de archivo que aparece en «Archivos generados». No cambies entre singular y plural:

\`\`\`js
import ${singular}Rutas from "./rutas/${slugify(plural)}.rutas.js";
app.use("${apiPath}", requireDatabase, ${singular}Rutas);
\`\`\`

El nombre del archivo del router y la ruta REST son independientes: copia el
import de arriba literalmente y registra el prefijo \`${apiPath}\`. Si Node
muestra \`ERR_MODULE_NOT_FOUND\`, comprueba que la ruta del import coincide
carácter por carácter con el archivo copiado.

## Integración de frontend

3. Copia \`src/components/${component}.vue\` al proyecto.
4. En \`src/router/index.js\`, importa el componente junto a las demás pantallas y añade la ruta antes del comodín:

\`\`\`js
import ${component} from "../components/${component}.vue";
{ path: "${escapeHtml(route)}", name: "${component}", component: ${component} },
\`\`\`
${menuFragment}
## Comprobaciones manuales

- Comprueba \`MONGO_URI\` y que el backend haya iniciado sin errores.
- Abre la pantalla y verifica que muestra todos los documentos.
- Crea, edita y elimina un documento de prueba.
- Comprueba validaciones, relaciones inexistentes y errores de conexión.
- Ejecuta \`npm run build\` después de integrar los archivos.

## Límites

- El identificador automático es \`_id\`; no se generan identificadores de negocio.
- El listado no incluye buscador ni filtros.
- La generación no modifica archivos reales ni prueba MongoDB automáticamente.
`
}
