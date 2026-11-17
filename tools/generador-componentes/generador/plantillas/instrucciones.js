import { RESOURCE_LIBRARY, escapeHtml, js, slugify } from "../datos.js"

export function generateInstructions(config) {
  const { singular, plural, apiPath } = config.entity
  const { component, route, menuLabel, title, type } = config.screen
  const relations = config.relations
  const listRelations = relations.filter((relation) => relation.filterable)
  const piniaRelations = relations.filter((relation) => relation.selection === "pinia")
  const ownStoreVariable = config.pinia.enabled
    ? `${singular[0].toLowerCase()}${singular.slice(1)}Store`
    : ""
  const operationsText = config.operations.map((operation) => ({
    list: "listar",
    create: "crear",
    edit: "editar",
    delete: "borrar",
    search: "buscar en la lista",
  })[operation]).join(", ")
  const menuFragment = menuLabel
    ? `\n\nPara añadir el enlace del menú, revisa el estilo de [src/components/NavBar.vue](../../../../src/components/NavBar.vue) e inserta dentro de su navegación un enlace como este:\n\n\`\`\`vue\n<RouterLink to="${escapeHtml(route)}">${escapeHtml(menuLabel)}</RouterLink>\n\`\`\`\n`
    : "\n\nNo se solicitó un enlace de menú. Si lo necesitas, añade uno manualmente a `src/components/NavBar.vue`."

  if (config.source === "existing") {
    const resourceMeta = RESOURCE_LIBRARY[config.existingResource] ?? null
    const resourceLabel = resourceMeta?.label ?? config.existingResource
    const operationLabels = { list: "listar", create: "crear", edit: "editar", delete: "borrar", search: "buscar en local" }
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
  : `Esta API localiza cada documento por ${config.entity.idField === "_id" ? "`_id`, el identificador automático de MongoDB" : `\`${config.entity.idField}\`, no por \`_id\``}. El componente generado usa \`item.${config.entity.idField}\` como clave de la tabla y al editar o borrar; no uses \`_id\` si el recurso no trabaja con él.`}

${resourceMeta?.notes ? `**Importante:** ${resourceMeta.notes}\n\n` : ""}## Archivos que fundamentan el patrón

${referenceText}

Lee esos archivos para confirmar los nombres reales de los campos antes de copiar el componente; si algún campo configurado no coincide, ajústalo.

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
- Las relaciones con otras entidades, los selectores de catálogo y los stores de Pinia no se generan todavía; deben completarse a mano.
- Esta versión solo se apoya en recursos ya presentes en el repositorio y no inventa rutas ni colecciones.
`
  }

  return `# Integración de ${title}

## Resumen

Se generó una pantalla **${type}** para **${title}**, con operaciones para ${operationsText}. La colección nueva se llamará \`${plural}\`, la API estará en \`${apiPath}\` y MongoDB usará \`_id\` como identificador.${relations.length ? `\n\nLa pantalla declara ${relations.length} ${relations.length === 1 ? "relación" : "relaciones"} con ${relations.map((relation) => RESOURCE_LIBRARY[relation.resource].label.toLowerCase()).join(", ")}; ve la sección «Relaciones» más abajo.` : ""}

Esta herramienta solo guarda los archivos en su carpeta de salida. No modifica ni ejecuta el proyecto y no se monta ni se registra automáticamente en la app real.

La integración en backend/server.js, src/router/index.js y src/components/NavBar.vue requiere pasos manuales y revisión de los nombres reales de campos y rutas del proyecto.

## Archivos generados

- \`backend/modelos/${singular}.js\`: esquema Mongoose (modelo: las reglas y estructura de un documento).${relations.length ? " Incluye las relaciones con el identificador correspondiente: DNI para pacientes y `ObjectId`/`ref` para doctores y citas." : ""}
- \`backend/rutas/${slugify(plural)}.rutas.js\`: router Express (grupo de endpoints HTTP del recurso).${relations.length ? " Incluye `validarRelaciones()`, que comprueba que cada documento relacionado existe." : ""}
- \`src/api/${slugify(plural)}.js\`: funciones Axios (capa que envía peticiones a la API).${listRelations.length ? ` El listado admite filtros por relación, por ejemplo \`?${listRelations[0].fieldName}=...\`.` : ""}
- \`src/components/${component}.vue\`: pantalla Vue con el patrón compatible con ${type}.
${config.pinia.enabled ? `- \`src/store/${slugify(singular)}Store.js\`: store Pinia que comparte la selección de esta pantalla con otras.\n` : ""}- \`configuracion.json\`: respuestas estructuradas que permiten revisar o volver a generar la propuesta.
- \`INSTRUCCIONES.md\`: esta guía de integración.

Una **colección** es el conjunto de documentos de ${plural} en MongoDB. Un **endpoint** es una dirección HTTP, por ejemplo \`${apiPath}\`. El **componente** presenta la interfaz; el modelo y el router implementan la persistencia en backend.
${relations.length ? `
## Relaciones con otras entidades

${relations.some((relation) => RESOURCE_LIBRARY[relation.resource].relationIdField)
    ? "Las relaciones guardan el identificador público definido para cada recurso: las de pacientes guardan el DNI (`dnipac`) como texto, igual que `pacienteDNI` en `backend/modelos/Cita.js`; las de doctores y citas guardan el `ObjectId` con referencia `ref` de Mongoose."
    : "Cada campo de relación guarda el `ObjectId` del documento relacionado como referencia `ref` de Mongoose. MongoDB no copia los datos del documento relacionado, solo su identificador."}
${relations.map((relation) => {
  const meta = RESOURCE_LIBRARY[relation.resource]
  const identifier = meta.relationIdField
    ? `el campo \`${meta.relationIdField}\` (texto)`
    : "el ObjectId del documento"
  const escoger = relation.selection === "api"
    ? `un **selector** en el formulario, alimentado con \`GET ${meta.apiPath}\` (\`${meta.apiFunctions.list}\` de \`src/api/${meta.apiFile}\`)`
    : `la **selección compartida** del store \`src/store/${meta.store.file}\` (\`${meta.store.importName}\`)`
  return `- **${escapeHtml(relation.label)}**: el campo \`${relation.fieldName}\` guarda ${identifier}, ${relation.required ? "obligatorio" : "opcional"}, se escoge con ${escoger}.${relation.filterable ? ` El listado admite \`GET ${apiPath}?${relation.fieldName}=...\`.` : ""}`
}).join("\n")}

El router generado incluye \`validarRelaciones()\`: antes de crear o editar comprueba que cada documento relacionado existe. Para pacientes busca por \`dnipac\`; para el resto busca por \`_id\`. Si no existe, responde 400 con un mensaje claro.
${config.pinia.enabled ? `
## Compartir la selección con Pinia

- \`src/store/${slugify(singular)}Store.js\` guarda \`id${singular}\` y estos datos mínimos: ${config.pinia.fields.join(", ")}.
- El botón **Compartir** de la tabla llama a \`seleccionar${singular}(registro)\`, igual que \`XestionDoctores.vue\` llama a \`doctorStore.seleccionarDoctor(doctor)\`.
- Para consumir la selección desde otra pantalla:

\`\`\`js
import { use${singular}Store } from "../store/${slugify(singular)}Store.js";

const ${ownStoreVariable} = use${singular}Store();
// Leer la selección actual:
console.log(${ownStoreVariable}.id${singular}, ${ownStoreVariable}.${config.pinia.fields[0]});
// Limpiarla cuando ya no haga falta:
${ownStoreVariable}.limpiar${singular}();
\`\`\`
` : ""}${piniaRelations.length ? `
## Selección compartida que consume esta pantalla

${piniaRelations.map((relation) => {
  const meta = RESOURCE_LIBRARY[relation.resource]
  return `- **${escapeHtml(relation.label)}** (\`${relation.fieldName}\`): el formulario no muestra selector; envía \`${meta.store.importName.slice(3).replace(/^([A-Z])/, (letter) => letter.toLowerCase())}.${meta.store.relationValueProp || meta.store.idProp}\` al guardar. La selección se establece desde las pantallas que comparten ese store y se limpia con \`${meta.store.limpiar}()\`. Si nadie la estableció, el botón Guardar queda desactivado hasta que se seleccione un registro.`;
}).join("\n")}
` : ""}` : ""}

## Orden recomendado

1. Copia los archivos generados a las rutas equivalentes del proyecto.
2. Registra el router en \`backend/server.js\` y conecta su prefijo:

\`\`\`js
import ${singular}Rutas from "./rutas/${slugify(plural)}.rutas.js";
app.use("${apiPath}", requireDatabase, ${singular}Rutas);
\`\`\`

3. Registra la pantalla en \`src/router/index.js\` (antes de la ruta comodín):

\`\`\`js
import ${component} from "../components/${component}.vue";

{ path: "${escapeHtml(route)}", name: "${component}", component: ${component} },
\`\`\`
${menuFragment}
## Comprobaciones manuales

- Verifica que MongoDB esté conectado y que el proyecto tenga instaladas sus dependencias.
- Prueba las operaciones seleccionadas: ${operationsText}.
- Comprueba que los campos obligatorios y sus validaciones respondan en el formulario y en el backend.
${relations.length ? `- Crea un registro con una referencia válida y prueba después una referencia inventada: el backend debe responder 400 con el mensaje de \`validarRelaciones()\` y el formulario debe mostrarlo con \`alertaError\`.
${listRelations.length ? `- Filtra el listado con \`GET ${apiPath}?${listRelations[0].fieldName}=...\` y comprueba que la tabla solo muestra los registros de ese registro relacionado.\n` : ""}${piniaRelations.length ? `- Establece la selección en la pantalla que comparte el store (por ejemplo ${piniaRelations.map((relation) => RESOURCE_LIBRARY[relation.resource].label).join(" y ")}) y comprueba que esta pantalla la usa al crear.\n` : ""}${config.pinia.enabled ? `- Pulsa Compartir en una fila y comprueba desde otra pantalla que \`${ownStoreVariable}.id${singular}\` queda disponible; prueba también \`${ownStoreVariable}.limpiar${singular}().\`\n` : ""}` : ""}
- Verifica errores de red, identificadores inválidos y que la lista se actualice tras crear, editar o borrar.
- Ejecuta \`npm run build\` después de copiar los archivos. El build comprueba la compilación del frontend; no valida que MongoDB esté disponible ni que los endpoints funcionen.

## Límites de esta entrega

- El identificador de MongoDB es siempre \`_id\`; no se generan identificadores de negocio.
- La búsqueda se hace en memoria sobre los registros ya cargados, no en MongoDB.
- Las restricciones se limitan a las opciones configurables del formulario y al esquema Mongoose generado; revisa las reglas específicas de negocio antes de integrar.
- Las confirmaciones y los avisos de error o éxito usan la utilidad compartida \`src/utils/alertas.js\` (SweetAlert2), igual que el resto de pantallas del proyecto.
- La reutilización de recursos existentes queda soportada cuando se elige ese origen; en ese caso la herramienta no duplica backend y usa el identificador real de cada recurso.
${relations.length || config.pinia.enabled ? `- Las relaciones generadas siguen los patrones de \`backend/modelos/Cita.js\`, \`backend/rutas/citas.rutas.js\` y \`src/store/doctorStore.js\`. Si la pantalla relacionada necesita watch sobre el store o relaciones con entidades nuevas generadas antes, complétalas a mano; esta versión no las genera.
` : "- No se generan relaciones ni stores de Pinia; usa el paso «Relaciones y estado» del formulario si los necesitas.\n"}- Los catálogos externos para selectores, la ordenación y la exportación a PDF no se generan todavía.
`
}
