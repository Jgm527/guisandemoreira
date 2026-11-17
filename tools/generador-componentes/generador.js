import { RESOURCE_LIBRARY, slugify } from "./generador/datos.js"
import { validateConfiguration } from "./generador/validacion.js"
import {
  generateModel,
  generateRoutes,
  generateApi,
} from "./generador/plantillas/backend.js"
import { generateComponent } from "./generador/plantillas/componente.js"
import { generateStore } from "./generador/plantillas/store.js"
import { generateInstructions } from "./generador/plantillas/instrucciones.js"

export { validateConfiguration, slugify }

export function generateFiles(config) {
  const { errors, config: normalized } = validateConfiguration(config)
  if (errors.length) {
    const error = new Error("La configuración no es válida.")
    error.validationErrors = errors
    throw error
  }

  const { singular, plural } = normalized.entity
  const files = {
    "configuracion.json": `${JSON.stringify(normalized, null, 2)}\n`,
  }

  if (normalized.source === "existing") {
    files[`src/components/${normalized.screen.component}.vue`] = generateComponent(normalized)
    files["INSTRUCCIONES.md"] = generateInstructions(normalized)
    return { files, config: normalized, outputSlug: slugify(normalized.screen.component) }
  }

  files[`backend/modelos/${singular}.js`] = generateModel(normalized)
  files[`backend/rutas/${slugify(plural)}.rutas.js`] = generateRoutes(normalized)
  files[`src/api/${slugify(plural)}.js`] = generateApi(normalized)
  if (normalized.pinia.enabled) {
    files[`src/store/${slugify(singular)}Store.js`] = generateStore(normalized)
  }
  files[`src/components/${normalized.screen.component}.vue`] = generateComponent(normalized)
  files["INSTRUCCIONES.md"] = generateInstructions(normalized)
  return { files, config: normalized, outputSlug: slugify(normalized.screen.component) }
}

// Archivos del proyecto que las relaciones exigen de verdad. server.js los
// comprueba antes de generar: si falta el módulo de API o el store de Pinia que
// el componente va a importar, la generación se detiene en lugar de producir
// código que fallaría al integrarlo.
export function relationRequiredFiles(config) {
  const required = []
  for (const relation of config.relations ?? []) {
    const meta = RESOURCE_LIBRARY[relation.resource]
    if (!meta || meta.catalogOnly) continue
    required.push(...meta.referenceFiles)
    if (relation.selection === "pinia" && meta.store) {
      required.push(`src/store/${meta.store.file}`)
    }
  }
  return [...new Set(required)]
}
