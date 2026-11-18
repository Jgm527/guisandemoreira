import { RESOURCE_LIBRARY, escapeHtml, slugify } from "../datos.js"
import { catalogApiFunctionName, catalogRoutePath, collectCatalogs } from "../catalogos.js"

const OPERATION_LABELS = { list: "listar", create: "crear", edit: "editar", delete: "borrar" }

// Enlace relativo dentro de la carpeta de salida. La ruta de destino en el
// repositorio es la misma, así que sirve para abrir el archivo y para saber
// exactamente dónde copiarlo.
const fileLink = (path) => `[\`${path}\`](./${path})`

const fence = (source, language = "js") => "```" + language + "\n" +
  String(source).replace(/\s+$/, "") + "\n```"

function orderIndex(path) {
  const prefixes = ["backend/modelos/", "backend/rutas/", "backend/data/", "src/api/", "src/store/", "src/components/"]
  const index = prefixes.findIndex((prefix) => path.startsWith(prefix))
  return index === -1 ? prefixes.length : index
}

// Archivos que el usuario debe copiar, en el orden en que conviene hacerlo.
function generatedFileList(files) {
  return Object.keys(files)
    .filter((path) => path !== "INSTRUCCIONES.md" && path !== "configuracion.json")
    .sort((a, b) => orderIndex(a) - orderIndex(b) || a.localeCompare(b))
}

function filePurpose(config, path) {
  const { singular, plural } = config.entity
  const catalog = collectCatalogs(config).find((entry) => `src/api/${entry.name}.js` === path)
  if (path === `backend/modelos/${singular}.js`) {
    return `Esquema Mongoose de \`${singular}\`: campos, tipos, obligatoriedad y validaciones de la colección \`${plural}\`.`
  }
  if (path === `backend/rutas/${slugify(plural)}.rutas.js`) {
    return `Router Express del recurso: \`GET\`, \`POST\`, \`PUT\` y \`DELETE\` según las operaciones elegidas.`
  }
  if (path === `src/api/${slugify(plural)}.js`) {
    return `Capa Axios de \`${plural}\`: las funciones que importa el componente.`
  }
  if (path === `src/components/${config.screen.component}.vue`) {
    return `Pantalla Vue completa (${config.screen.type}) con tabla, formulario y avisos.`
  }
  if (path === `src/store/${slugify(singular)}Store.js`) {
    return "Store Pinia propio para compartir el registro seleccionado entre pantallas."
  }
  if (path.startsWith("backend/data/")) {
    const name = path.slice("backend/data/".length, -".json".length)
    return `Datos del catálogo \`${name}\` tal como los analizó el generador; se sirven en \`/api/${name}\`.`
  }
  if (catalog) {
    return `Capa Axios del catálogo \`${catalog.name}\`: devuelve la lista que alimenta el \`<select>\`.`
  }
  return "Archivo generado."
}

// Bloque de código completo de cada módulo generado. Es dinámico: si la
// pantalla usa dos APIs (la entidad y un catálogo, o dos catálogos), aparecen
// las dos con su código y su enlace.
function generatedCode(config, files) {
  const { singular, plural } = config.entity
  const blocks = []
  const add = (path, intro) => {
    if (!files[path]) return
    blocks.push(
      `### \`${path}\`\n\n${intro}\n\nAbre o copia el archivo completo desde ${fileLink(path)}.\n\n${fence(files[path])}`
    )
  }

  add(
    `backend/modelos/${singular}.js`,
    `Esquema Mongoose del recurso. Debe existir antes de arrancar el backend, porque el router lo importa.`,
  )
  add(
    `backend/rutas/${slugify(plural)}.rutas.js`,
    `Router Express. Se activa al registrarlo en \`backend/server.js\` con el prefijo \`${config.entity.apiPath}\`.`,
  )
  add(
    `src/api/${slugify(plural)}.js`,
    `Capa Axios de la entidad. El componente importa estas funciones; no cambies sus nombres al copiar.`,
  )
  for (const catalog of collectCatalogs(config)) {
    add(
      `src/api/${catalog.name}.js`,
      catalog.apiFunction
        ? `No se genera: el proyecto ya tiene \`src/api/${catalog.name}.js\` y el componente reutiliza \`${catalog.apiFunction}()\`.`
        : `Capa Axios del catálogo \`${catalog.name}\`. Devuelve la lista de \`/api/${catalog.name}\` para el \`<select>\`.`,
    )
  }
  add(
    `src/store/${slugify(singular)}Store.js`,
    "Store Pinia propio, solo si pediste compartir la selección entre pantallas.",
  )
  return blocks.join("\n\n")
}

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
      ? `- ${fileLink(`backend/data/${catalog.name}.json`)}: datos analizados y guardados por el generador (${catalog.count ?? "los"} elementos de la lista \`${catalog.rootKey || "(la raíz es una lista)"}\`).`
      : `- \`backend/data/${catalog.name}.json\`: archivo que ya existe en el proyecto; no se copia ni se modifica.`
    const apiLine = catalog.apiFunction
      ? `- \`src/api/${catalog.name}.js\`: se reutiliza la función \`${loadFunction}()\` que ya existe; no se genera otro módulo. El componente la importa igual que las demás.`
      : `- ${fileLink(`src/api/${catalog.name}.js`)}: módulo Axios generado con \`${loadFunction}()\`, que devuelve la lista del catálogo. Su código está en la sección de código de los archivos generados.`
    const metadataLine = catalog.primitive
      ? "- La lista contiene valores simples: el `<select>` usa cada valor tal cual."
      : `- Campo visible: \`${catalog.labelField}\`; valor guardado en el formulario: \`${catalog.valueField}\`; identificador: ${catalog.idField ? `\`${catalog.idField}\`` : "no detectado"}.`
    const route = catalog.apiFunction && catalog.routeExists
      ? `La ruta \`${catalogRoutePath(catalog.name)}\` ya está registrada en \`backend/server.js\`; no la dupliques.`
      : `Registra esta ruta una sola vez en \`backend/server.js\`, junto a las de \`/api/municipios\` y \`/api/especialidades\` (importa \`fs\` si aún no está):\n\n${fence(`app.get("${catalogRoutePath(catalog.name)}", (req, res) => {
  // La ruta se resuelve respecto a backend/server.js, no al directorio de arranque.
  const datos = fs.readFileSync(new URL("./data/${catalog.name}.json", import.meta.url), "utf-8");
  res.json(JSON.parse(datos));
});`)}\n\nSi la ruta ya existe en el proyecto, no añadas otra.`
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

function fileTable(config, files) {
  const rows = generatedFileList(files).map((path) =>
    `| ${fileLink(path)} | \`${path}\` | ${filePurpose(config, path)} |`)
  return `| Archivo generado | Ruta en el repositorio | Qué es |
| --- | --- | --- |
${rows.join("\n")}`
}

function relationsSection(config) {
  const relations = config.relations ?? []
  if (!relations.length) return ""
  const rows = relations.map((relation) => {
    const meta = RESOURCE_LIBRARY[relation.resource]
    const validation = meta.relationIdField
      ? `\`${meta.refModel}.exists({ ${meta.relationIdField}: ... })\``
      : `\`${meta.refModel}.exists({ _id: ... })\``
    return `| \`${relation.fieldName}\` | ${meta?.label ?? relation.resource} | ${validation} | ${relation.selection === "pinia" ? "Pinia" : "Selector con la API"} |`
  })
  return `## Relaciones incluidas

El router genera \`validarRelaciones()\`, que comprueba que los documentos relacionados existen antes de crear o editar. Si una referencia no existe, el backend responde 400.

| Campo | Recurso | Comprobación en el backend | Origen de la selección |
| --- | --- | --- | --- |
${rows.join("\n")}
`
}

function menuFragment(menuLabel, route) {
  if (!menuLabel) {
    return "\n\nNo se solicitó un enlace de menú. Si lo necesitas, añade uno manualmente a `src/components/NavBar.vue`."
  }
  return `\n\nPara añadir el enlace del menú, revisa el estilo de \`src/components/NavBar.vue\` e inserta dentro de su navegación un enlace como este:\n\n${fence(`<RouterLink to="${escapeHtml(route)}">${escapeHtml(menuLabel)}</RouterLink>`, "vue")}\n`
}

/* ------------------------------------------------------------------ */
/* Reutilizar un recurso que ya existe en el proyecto                  */
/* ------------------------------------------------------------------ */

function existingInstructions(config, files) {
  const resourceMeta = RESOURCE_LIBRARY[config.existingResource] ?? null
  const resourceLabel = resourceMeta?.label ?? config.existingResource
  const supportedText = resourceMeta
    ? Object.keys(resourceMeta.apiFunctions).map((operation) => OPERATION_LABELS[operation] ?? operation).join(", ")
    : config.operations.map((operation) => OPERATION_LABELS[operation] ?? operation).join(", ")
  const referenceText = resourceMeta
    ? resourceMeta.referenceFiles.map((file) => `- \`${file}\``).join("\n")
    : "- los módulos de `src/api/` del proyecto"
  const operationsText = config.operations.map((operation) => OPERATION_LABELS[operation]).join(", ")
  const componentPath = `src/components/${config.screen.component}.vue`
  const code = generatedCode(config, files)
  const catalogApis = collectCatalogs(config).filter((catalog) => !catalog.apiFunction)

  const copySteps = [
    catalogApis.length
      ? `Copia ${catalogApis.map((catalog) => fileLink(`src/api/${catalog.name}.js`)).join(", ")} al proyecto (rutas de \`src/api/\`).`
      : "",
    `Copia ${fileLink(componentPath)} a \`${componentPath}\`.`,
    config.screen.menuLabel
      ? `Registra la ruta en \`src/router/index.js\` y añade el enlace del menú (código abajo).`
      : `Registra la ruta en \`src/router/index.js\` (código abajo).`,
    "Ejecuta `npm run build` y comprueba la pantalla con el backend en marcha.",
  ].filter(Boolean)

  return `# Integración de ${config.screen.title}

## Resumen

Se reutiliza el recurso existente **${resourceLabel}** (\`${config.existingResource}\`) para la pantalla **${config.screen.title}** (${config.screen.type}). No se genera backend nuevo ni se duplica ninguna colección: la pantalla llama a la API real del proyecto con las funciones que ya exporta \`src/api/${resourceMeta?.apiFile ?? ""}\`.

Las operaciones reales que ofrece este recurso son: ${supportedText}. Si la pantalla necesita una operación fuera de esa lista, hay que implementarla primero en el backend y en el módulo de la API.

## Archivos generados (${generatedFileList(files).length})

${fileTable(config, files)}

## Pasos

${copySteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Identificador real del recurso

${resourceMeta?.catalogOnly
  ? "Esta API es un catálogo de solo lectura: devuelve listas generadas desde un archivo JSON y no trabaja con identificadores por documento, así que la pantalla generada solo consulta y muestra."
  : (config.entity.idField === "_id"
      ? "Esta API localiza cada documento por `_id`, el identificador automático de MongoDB."
      : `Esta API localiza cada documento por \`${config.entity.idField}\`, no por \`_id\`. \`_id\` sigue existiendo en MongoDB, pero no identifica el recurso en esta API.`) + ` El componente generado usa \`item.${config.entity.idField}\` como clave de la tabla y al editar o borrar.`}

${resourceMeta?.notes ? `**Importante:** ${resourceMeta.notes}\n\n` : ""}## Archivos del proyecto que fundamentan el patrón

${referenceText}

Lee esos archivos para confirmar los nombres reales de los campos antes de copiar el componente; si algún campo configurado no coincide, ajústalo.

${catalogsSection(config)}## Código de los módulos generados

El componente Vue es largo y va comentado bloque a bloque: ábrelo en ${fileLink(componentPath)} y cópialo tal cual.
${code ? `\n${code}\n` : ""}
## Registrar la pantalla en el router

En \`src/router/index.js\`, importa el componente junto a las demás pantallas y añade la ruta antes del comodín \`/:pathMatch(.*)\`:

${fence(`import ${config.screen.component} from "../components/${config.screen.component}.vue";

{ path: "${escapeHtml(config.screen.route)}", name: "${config.screen.component}", component: ${config.screen.component} },`)}
${menuFragment(config.screen.menuLabel, config.screen.route)}
## Comprobaciones manuales

- Comprueba que la pantalla carga la API real sin errores de red.
- Prueba las operaciones elegidas: ${operationsText}.
- Asegúrate de que la lista y el formulario usan los campos reales que devuelve la API.
- Ejecuta **npm run build** para validar que el componente compila en el proyecto; este comando no comprueba que la API responda correctamente ni que MongoDB esté conectada.

## Límites de esta entrega

- No se genera backend nuevo, para no duplicar recursos reales.
- Las relaciones con otras entidades y los stores de Pinia no se generan al reutilizar un recurso; complétalos a mano.
- Los campos catálogo sí se generan: consumen su JSON de \`backend/data\` como se explica arriba.
- Esta versión solo se apoya en recursos ya presentes en el repositorio y no inventa rutas ni colecciones.
`
}

/* ------------------------------------------------------------------ */
/* Entidad nueva                                                       */
/* ------------------------------------------------------------------ */

export function generateInstructions(config, files = {}) {
  if (config.source === "existing") return existingInstructions(config, files)

  const { singular, plural, apiPath } = config.entity
  const { component, route, title, type } = config.screen
  const catalogs = collectCatalogs(config)
  const generatedCatalogApis = catalogs.filter((catalog) => !catalog.apiFunction)
  const catalogData = catalogs.filter((catalog) => catalog.source === "inline")
  const operationsText = config.operations.map((operation) => OPERATION_LABELS[operation]).join(", ")

  const modelPath = `backend/modelos/${singular}.js`
  const routerPath = `backend/rutas/${slugify(plural)}.rutas.js`
  const apiFile = `src/api/${slugify(plural)}.js`
  const componentPath = `src/components/${component}.vue`
  const storePath = `src/store/${slugify(singular)}Store.js`
  const has = (path) => Boolean(files[path])

  const serverLines = [
    `// Añade estas líneas a backend/server.js, junto al resto de rutas.`,
    `import ${singular}Rutas from "./rutas/${slugify(plural)}.rutas.js";`,
    "",
    `app.use("${apiPath}", requireDatabase, ${singular}Rutas);`,
  ]
  const catalogsNeedingRoute = catalogs.filter((catalog) => !(catalog.apiFunction && catalog.routeExists))
  if (catalogsNeedingRoute.length) {
    serverLines.push(
      "",
      `// Las rutas GET de los catálogos (${catalogsNeedingRoute.map((catalog) => `\`${catalogRoutePath(catalog.name)}\``).join(", ")}) están en la sección «Catálogos cargados desde archivo JSON»; van en este mismo archivo.`,
    )
  }
  if (catalogsNeedingRoute.some((catalog) => catalog.source === "inline")) {
    serverLines.unshift(`import fs from "node:fs"; // solo si server.js aún no lo importa`)
    serverLines.splice(1, 0, "")
  }

  const steps = []
  const step = (text) => `${steps.length + 1}. ${text}`
  if (has(modelPath)) steps.push(step(`Copia ${fileLink(modelPath)} a \`${modelPath}\`.`))
  if (has(routerPath)) steps.push(step(`Copia ${fileLink(routerPath)} a \`${routerPath}\`.`))
  if (has(modelPath) || has(routerPath)) {
    steps.push(step(`Registra el router en \`backend/server.js\` con el bloque de «Integración de backend».`))
  }
  if (catalogData.length) {
    steps.push(step(`Copia el JSON del catálogo: ${catalogData.map((catalog) => fileLink(`backend/data/${catalog.name}.json`)).join(", ")}.`))
  }
  if (generatedCatalogApis.length) {
    steps.push(step(`Copia las capas de API de catálogo: ${generatedCatalogApis.map((catalog) => fileLink(`src/api/${catalog.name}.js`)).join(", ")}.`))
  }
  if (has(apiFile)) steps.push(step(`Copia ${fileLink(apiFile)} a \`${apiFile}\`.`))
  if (has(storePath)) steps.push(step(`Copia ${fileLink(storePath)} a \`${storePath}\`.`))
  steps.push(step(`Copia ${fileLink(componentPath)} a \`${componentPath}\`.`))
  if (catalogsNeedingRoute.length) {
    steps.push(step(`Añade en \`backend/server.js\` la ruta GET de cada catálogo (sección de catálogos).`))
  }
  steps.push(step(`Registra la pantalla en \`src/router/index.js\`` + (config.screen.menuLabel ? " y añade el enlace del menú." : ".")))
  steps.push(step("Reinicia backend y frontend y prueba las operaciones."))

  return `# Integración de ${title}

## Resumen

Se generó una pantalla **${type}** para **${title}**, con operaciones para ${operationsText}. La colección nueva se llamará \`${plural}\`, la API estará en \`${apiPath}\` y MongoDB usará \`_id\`.

Esta herramienta solo guarda archivos en su carpeta de salida. **No se monta ni se registra automáticamente** en la app real: copia los archivos y sigue los pasos de esta guía.

## Archivos generados (${generatedFileList(files).length})

${fileTable(config, files)}

## Pasos

${steps.join("\n")}

## Código de los archivos generados

Cada bloque se puede copiar tal cual al archivo de la misma ruta. Si un módulo aparece como «no se genera», es porque ya existe en el proyecto y se reutiliza.

${generatedCode(config, files)}

${catalogData.length ? `### Datos JSON de los catálogos

${catalogData.map((catalog) => `- ${fileLink(`backend/data/${catalog.name}.json`)} (${catalog.count ?? "varios"} elementos): cópialo a \`backend/data/${catalog.name}.json\` sin renombrar la lista \`${catalog.rootKey || "(raíz)"}\`.`).join("\n")}

No se muestran aquí porque son datos, no código; ábrelos con el enlace y cópialos íntegros.
` : ""}
${catalogsSection(config)}## Integración de backend

1. Copia el modelo y el router a sus rutas del proyecto.
2. En \`backend/server.js\`, importa el router y registra el prefijo con el mismo nombre de archivo del import. No cambies entre singular y plural:

${fence(serverLines.join("\n"))}

El nombre del archivo del router y la ruta REST son independientes: copia el import literalmente y registra el prefijo \`${apiPath}\`. Si Node muestra \`ERR_MODULE_NOT_FOUND\`, comprueba que la ruta del import coincide carácter por carácter con el archivo copiado.

## Conectar MongoDB y crear o actualizar la colección

1. Comprueba que \`MONGO_URI\` existe en el entorno usado por \`backend/server.js\` y apunta a una base MongoDB disponible.
2. Una colección nueva se crea al guardar el primer documento. Mongoose usa \`${plural}\` mediante \`collection: "${plural}"\`.
3. Si amplías una entidad existente, añade los campos nuevos a \`backend/modelos/<Entidad>.js\` antes de usar el formulario. MongoDB no modifica automáticamente los documentos antiguos.
4. Reinicia backend y frontend después de integrar el modelo y el router.

## Integración de frontend

1. Copia ${fileLink(componentPath)} a \`${componentPath}\`.
2. En \`src/router/index.js\`, importa el componente junto a las demás pantallas y añade la ruta antes del comodín:

${fence(`import ${component} from "../components/${component}.vue";
{ path: "${escapeHtml(route)}", name: "${component}", component: ${component} },`)}
${menuFragment(config.screen.menuLabel, route)}
${config.pinia.enabled ? `## Store Pinia propio

El componente genera \`seleccionar${singular}(registro)\` y usa \`limpiar${singular}()\` para compartir \`id${singular}\` y los campos mínimos configurados.
` : ""}${relationsSection(config)}## Comprobaciones manuales

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
