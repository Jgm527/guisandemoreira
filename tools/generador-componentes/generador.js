const FIELD_TYPES = new Set([
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "time",
  "boolean",
  "radio",
  "select",
])

const OPERATIONS = new Set(["list", "create", "edit", "delete", "search"])
const RESERVED_FIELDS = new Set(["_id", "id", "__proto__", "constructor", "prototype"])

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;")

const js = (value) => JSON.stringify(value)

function isValidIdentifier(value) {
  return /^[a-z][A-Za-z0-9]*$/.test(value) && !RESERVED_FIELDS.has(value)
}

function isValidPascalCase(value) {
  return /^[A-Z][A-Za-z0-9]*$/.test(value)
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function slugify(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function parseOptions(value) {
  if (Array.isArray(value)) {
    return value.map(({ value: optionValue, label }) => ({
      value: String(optionValue ?? "").trim(),
      label: String(label ?? "").trim(),
    }))
  }

  if (typeof value !== "string" || value.trim() === "") return []
  return value.split("\n").map((line) => {
    const separator = line.indexOf("|")
    if (separator < 0) return { value: line.trim(), label: "" }
    return {
      value: line.slice(0, separator).trim(),
      label: line.slice(separator + 1).trim(),
    }
  })
}

function normalizeField(field) {
  const type = String(field.type ?? "")
  const options = parseOptions(field.options)
  const min = field.min === "" || field.min == null ? null : String(field.min).trim()
  const max = field.max === "" || field.max == null ? null : String(field.max).trim()
  return {
    name: String(field.name ?? "").trim(),
    label: String(field.label ?? "").trim(),
    type,
    required: Boolean(field.required),
    defaultValue: field.defaultValue == null ? "" : String(field.defaultValue),
    min,
    max,
    pattern: String(field.pattern ?? "").trim(),
    options,
    form: field.form !== false,
    list: Boolean(field.list),
    search: Boolean(field.search),
  }
}

export function validateConfiguration(input) {
  const errors = []
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { errors: ["La configuración debe ser un objeto JSON."], config: null }
  }

  const screen = input.screen ?? {}
  const entity = input.entity ?? {}
  const operations = Array.isArray(input.operations)
    ? [...new Set(input.operations.map(String))]
    : []
  const fields = Array.isArray(input.fields) ? input.fields.map(normalizeField) : []

  if (!["CRUD"].includes(screen.type)) {
    errors.push("Esta primera versión genera pantallas CRUD; los demás tipos se añadirán en fases posteriores.")
  }
  if (String(screen.title ?? "").trim().length < 2 || String(screen.title ?? "").trim().length > 120) {
    errors.push("El nombre visible de la pantalla debe tener entre 2 y 120 caracteres.")
  }
  if (!isValidPascalCase(String(screen.component ?? "")) || String(screen.component ?? "").length > 60) {
    errors.push("El nombre técnico del componente debe comenzar en mayúscula y contener solo letras y números (por ejemplo, GestionTareas).")
  }
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(String(screen.route ?? "")) ||
      String(screen.route).includes("//") || String(screen.route).length > 100) {
    errors.push("La ruta del navegador debe comenzar por / y contener solo letras, números, /, _ o -.")
  }
  if (screen.menuLabel != null && typeof screen.menuLabel !== "string") {
    errors.push("El texto del menú debe ser texto.")
  }

  if (!isValidPascalCase(String(entity.singular ?? ""))) {
    errors.push("El nombre singular debe estar en PascalCase (por ejemplo, Tarea).")
  }
  if (!/^[a-z][a-z0-9]*$/.test(String(entity.plural ?? "")) || String(entity.plural ?? "").length > 60) {
    errors.push("El nombre plural debe estar en minúsculas, empezar con una letra y contener solo letras y números (por ejemplo, tareas).")
  }
  if (!/^\/api\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(String(entity.apiPath ?? "")) ||
      String(entity.apiPath ?? "").length > 100) {
    errors.push("La ruta REST debe tener el formato /api/recurso (por ejemplo, /api/tareas).")
  }
  if (entity.idField !== "_id") {
    errors.push("Esta versión usa _id, el identificador que Mongoose genera automáticamente.")
  }

  if (operations.some((operation) => !OPERATIONS.has(operation))) {
    errors.push("Se ha seleccionado una operación no admitida.")
  }
  if (operations.length === 0) errors.push("Selecciona al menos una operación.")
  if (operations.includes("search") && !operations.includes("list")) {
    errors.push("La búsqueda local necesita que también esté seleccionada la operación listar.")
  }
  if (operations.includes("edit") && !operations.includes("list")) {
    errors.push("La edición necesita listar para poder seleccionar un registro existente.")
  }
  if (operations.includes("delete") && !operations.includes("list")) {
    errors.push("El borrado necesita listar para poder seleccionar un registro existente.")
  }
  if ((operations.includes("create") || operations.includes("edit")) &&
      !fields.some((field) => field.form)) {
    errors.push("Añade al menos un campo visible en el formulario para crear o editar.")
  }
  if (operations.includes("list") && !fields.some((field) => field.list)) {
    errors.push("Marca al menos un campo para mostrarlo en la tabla.")
  }
  if (operations.includes("search") && !fields.some((field) => field.search)) {
    errors.push("Marca al menos un campo para incluirlo en la búsqueda.")
  }

  const seenFields = new Set()
  if (fields.length > 50) errors.push("Una pantalla puede definir como máximo 50 campos en esta versión.")
  for (const [index, field] of fields.entries()) {
    const prefix = `Campo ${index + 1}`
    if (!isValidIdentifier(field.name) || field.name.length > 40) {
      errors.push(`${prefix}: el nombre técnico debe empezar en minúscula y usar solo letras y números.`)
    } else if (seenFields.has(field.name)) {
      errors.push(`${prefix}: el nombre técnico "${field.name}" está repetido.`)
    }
    seenFields.add(field.name)
    if (!field.label) errors.push(`${prefix}: escribe una etiqueta visible.`)
    if (!FIELD_TYPES.has(field.type)) errors.push(`${prefix}: selecciona un tipo de campo admitido.`)

    if (["select", "radio"].includes(field.type)) {
      if (field.options.length === 0 || field.options.some((option) => !option.value || !option.label)) {
        errors.push(`${prefix}: añade opciones como "valor|etiqueta", una por línea.`)
      } else if (new Set(field.options.map((option) => option.value)).size !== field.options.length) {
        errors.push(`${prefix}: los valores de sus opciones deben ser únicos.`)
      }
    } else if (field.options.length) {
      errors.push(`${prefix}: solo los campos selector y radio admiten opciones.`)
    }

    if (field.min !== null && field.max !== null) {
      const minimum = field.type === "date" ? field.min : Number(field.min)
      const maximum = field.type === "date" ? field.max : Number(field.max)
      if ((field.type === "date" && (!isValidDate(minimum) || !isValidDate(maximum))) ||
          (field.type !== "date" && (Number.isNaN(minimum) || Number.isNaN(maximum))) ||
          minimum > maximum) {
        errors.push(`${prefix}: el mínimo no puede ser mayor que el máximo y ambos valores deben ser válidos.`)
      }
    }
    if (field.type === "date") {
      for (const limit of [field.min, field.max]) {
        if (limit !== null && !isValidDate(limit)) {
          errors.push(`${prefix}: los límites de fecha deben tener formato YYYY-MM-DD y ser fechas válidas.`)
          break
        }
      }
      if (["text", "textarea", "email", "phone"].includes(field.type)) {
        for (const limit of [field.min, field.max]) {
          if (limit !== null && (!Number.isInteger(Number(limit)) || Number(limit) < 0)) {
            errors.push(`${prefix}: los límites de longitud deben ser números enteros iguales o mayores que cero.`)
            break
          }
        }
      }
    }
    if ((field.min !== null || field.max !== null) &&
        !["text", "textarea", "email", "phone", "number", "date"].includes(field.type)) {
      errors.push(`${prefix}: min/max solo se admite para texto, correo, teléfono, número y fecha.`)
    }
    if (field.type === "number") {
      for (const limit of [field.min, field.max]) {
        if (limit !== null && !Number.isFinite(Number(limit))) {
          errors.push(`${prefix}: los límites de un campo numérico deben ser números válidos.`)
          break
        }
      }
    }
    if (field.pattern) {
      if (["boolean", "radio", "select"].includes(field.type)) {
        errors.push(`${prefix}: la expresión regular no se aplica a booleanos, radios ni selectores.`)
      }
      try {
        new RegExp(field.pattern)
        new RegExp(field.pattern, "v")
      } catch {
        errors.push(`${prefix}: la expresión regular no es válida o usa una sintaxis no compatible con el navegador.`)
      }
      if (field.pattern.length > 200) errors.push(`${prefix}: la expresión regular no puede superar 200 caracteres.`)
    }
    if (field.defaultValue !== "") {
      if (field.type === "number" && !Number.isFinite(Number(field.defaultValue))) {
        errors.push(`${prefix}: el valor inicial numérico no es válido.`)
      }
      if (field.type === "boolean" && !["true", "false"].includes(field.defaultValue)) {
        errors.push(`${prefix}: el valor inicial booleano debe ser true o false.`)
      }
      if (["select", "radio"].includes(field.type) &&
          !field.options.some((option) => option.value === field.defaultValue)) {
        errors.push(`${prefix}: el valor inicial debe coincidir con una de sus opciones.`)
      }
      if (field.type === "number") {
        const value = Number(field.defaultValue)
        if (field.min !== null && value < Number(field.min)) errors.push(`${prefix}: el valor inicial es menor que el mínimo.`)
        if (field.max !== null && value > Number(field.max)) errors.push(`${prefix}: el valor inicial es mayor que el máximo.`)
      } else if (field.type === "date") {
        if (!isValidDate(field.defaultValue)) errors.push(`${prefix}: el valor inicial debe ser una fecha válida con formato YYYY-MM-DD.`)
        if (field.min !== null && field.defaultValue < field.min) errors.push(`${prefix}: el valor inicial es anterior a la fecha mínima.`)
        if (field.max !== null && field.defaultValue > field.max) errors.push(`${prefix}: el valor inicial supera la fecha máxima.`)
      } else if (field.type === "time" &&
                 !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(field.defaultValue)) {
        errors.push(`${prefix}: el valor inicial de hora debe tener formato HH:MM.`)
      } else if (["text", "textarea", "email", "phone"].includes(field.type)) {
        if (field.min !== null && field.defaultValue.length < Number(field.min)) {
          errors.push(`${prefix}: el valor inicial no alcanza la longitud mínima.`)
        }
        if (field.max !== null && field.defaultValue.length > Number(field.max)) {
          errors.push(`${prefix}: el valor inicial supera la longitud máxima.`)
        }
      }
      const defaultPattern = field.pattern || (field.type === "email" ? "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" : "")
      try {
        if (defaultPattern && !new RegExp(defaultPattern, "v").test(field.defaultValue)) {
          errors.push(`${prefix}: el valor inicial no cumple la expresión regular.`)
        }
      } catch {
        // La validación principal de la expresión ya ha añadido un error al formulario.
      }
      if (field.type === "boolean" && field.required && field.defaultValue === "false") {
        errors.push(`${prefix}: una casilla obligatoria no puede tener false como valor inicial.`)
      }
    }
    if (operations.includes("create") && field.required && !field.form && field.defaultValue === "") {
      errors.push(`${prefix}: un campo obligatorio que no aparece en el formulario necesita un valor inicial para poder crear registros.`)
    }
  }

  const config = {
    version: 1,
    screen: {
      type: "CRUD",
      title: String(screen.title ?? "").trim(),
      component: String(screen.component ?? "").trim(),
      route: String(screen.route ?? "").trim(),
      menuLabel: String(screen.menuLabel ?? "").trim(),
    },
    entity: {
      singular: String(entity.singular ?? "").trim(),
      plural: String(entity.plural ?? "").trim(),
      apiPath: String(entity.apiPath ?? "").trim(),
      idField: "_id",
    },
    fields,
    operations: operations.filter((operation) => OPERATIONS.has(operation)),
    features: {
      validation: true,
    },
  }

  return { errors, config }
}

function mongooseField(field) {
  const type = field.type === "number" ? "Number" : field.type === "boolean" ? "Boolean" : "String"
  const properties = [`type: ${type}`]
  const validators = []
  if (field.required) properties.push("required: true")
  if (field.type === "number") {
    if (field.min !== null) properties.push(`min: ${Number(field.min)}`)
    if (field.max !== null) properties.push(`max: ${Number(field.max)}`)
  } else {
    if (["text", "textarea", "email", "phone"].includes(field.type)) properties.push("trim: true")
    if (field.type === "date") {
      const min = field.min === null ? "null" : js(field.min)
      const max = field.max === null ? "null" : js(field.max)
      validators.push(`{ validator: (value) => {
        if (value == null || value === "") return true;
        const date = new Date(\`\${value}T00:00:00.000Z\`);
        return /^\\d{4}-\\d{2}-\\d{2}$/.test(value)
          && !Number.isNaN(date.getTime())
          && date.toISOString().slice(0, 10) === value
          && (${min} === null || value >= ${min})
          && (${max} === null || value <= ${max});
      }, message: "La fecha no es válida o está fuera de los límites permitidos" }`)
    } else if (field.type === "time") {
      validators.push('{ validator: (value) => value == null || value === "" || /^(?:[01]\\d|2[0-3]):[0-5]\\d$/.test(value), message: "La hora debe tener formato HH:MM" }')
    }
    if (field.min !== null && field.type !== "date") {
      if (field.required) properties.push(`minlength: ${Number(field.min)}`)
      else {
        validators.push(`{ validator: (value) => value == null || value === "" || value.length >= ${Number(field.min)}, message: "El valor es demasiado corto" }`)
      }
    }
    if (field.max !== null && field.type !== "date") {
      if (field.type === "number") properties.push(`max: ${Number(field.max)}`)
      else properties.push(`maxlength: ${Number(field.max)}`)
    }
  }
  const pattern = field.pattern || (field.type === "email" ? "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" : "")
  if (pattern) {
    const fullPattern = `^(?:${pattern})$`
    if (field.required) properties.push(`match: new RegExp(${js(fullPattern)})`)
    else {
      validators.push(`{ validator: (value) => value == null || value === "" || new RegExp(${js(fullPattern)}).test(value), message: "El formato no es válido" }`)
    }
  }
  if (validators.length) properties.push(`validate: [${validators.join(", ")}]`)
  if (["select", "radio"].includes(field.type)) {
    const allowedValues = field.options.map((option) => option.value)
    if (!field.required) allowedValues.push("")
    properties.push(`enum: ${js(allowedValues)}`)
  }
  if (field.defaultValue !== "") {
    const value = field.type === "number" ? Number(field.defaultValue)
      : field.type === "boolean" ? field.defaultValue === "true"
        : field.defaultValue
    properties.push(`default: ${js(value)}`)
  } else if (field.type === "boolean") {
    properties.push("default: false")
  }
  return `    ${field.name}: { ${properties.join(", ")} },`
}

function generateModel(config) {
  const { singular, plural } = config.entity
  return `import mongoose from "mongoose";

// Este esquema describe los campos y validaciones de cada documento ${singular}.
const ${singular}Schema = new mongoose.Schema(
  {
${config.fields.map(mongooseField).join("\n")}
  },
  {
    // Fija el nombre para no depender de la pluralización automática de Mongoose.
    collection: ${js(plural)},
  }
);

// Mongoose genera el identificador _id y aplica este esquema al guardar.
export default mongoose.model(${js(singular)}, ${singular}Schema);
`
}

function generateRoutes(config) {
  const { singular } = config.entity
  const operations = new Set(config.operations)
  const imports = ["import express from \"express\";", `import ${singular} from "../modelos/${singular}.js";`]
  const lines = [...imports, "", "const router = express.Router();", ""]
  const bodyOperations = operations.has("create") || operations.has("edit")

  if (bodyOperations) {
    lines.push(
      `const camposPermitidos = ${js(config.fields.map((field) => field.name))};`,
      "",
      "// Acepta solo los campos declarados; nunca se guardan propiedades arbitrarias.",
      "function datosPermitidos(body = {}) {",
      "  return Object.fromEntries(",
      "    camposPermitidos",
      "      .filter((campo) => body[campo] !== undefined)",
      "      .map((campo) => [campo, body[campo]])",
      "  );",
      "}",
      ""
    )
  }

  if (operations.has("list")) {
    lines.push(
      "// GET /: devuelve todos los documentos de la colección.",
      "router.get(\"/\", async (req, res) => {",
      "  try {",
      `    res.json(await ${singular}.find().lean());`,
      "  } catch (error) {",
      `    console.error("Error al listar ${config.entity.plural}:", error);`,
      `    res.status(500).json({ mensaje: "Error al listar ${config.entity.plural}" });`,
      "  }",
      "});",
      ""
    )
  }
  if (operations.has("create")) {
    lines.push(
      "// POST /: valida y crea un documento.",
      "router.post(\"/\", async (req, res) => {",
      "  try {",
      `    res.status(201).json(await ${singular}.create(datosPermitidos(req.body)));`,
      "  } catch (error) {",
      "    if (error.name === \"ValidationError\" || error.name === \"CastError\") {",
      "      return res.status(400).json({ mensaje: error.message });",
      "    }",
      `    console.error("Error al crear ${config.entity.singular}:", error);`,
      `    res.status(500).json({ mensaje: "Error al crear ${config.entity.singular}" });`,
      "  }",
      "});",
      ""
    )
  }
  if (operations.has("edit")) {
    lines.push(
      "// PUT /:id: actualiza los campos permitidos y vuelve a validarlos.",
      "router.put(\"/:id\", async (req, res) => {",
      "  try {",
      `    const documento = await ${singular}.findByIdAndUpdate(`,
      "      req.params.id,",
      "      datosPermitidos(req.body),",
      "      { new: true, runValidators: true }",
      "    );",
      "    if (!documento) return res.status(404).json({ mensaje: \"Registro no encontrado\" });",
      "    res.json(documento);",
      "  } catch (error) {",
      "    if (error.name === \"ValidationError\" || error.name === \"CastError\") {",
      "      return res.status(400).json({ mensaje: error.message });",
      "    }",
      `    console.error("Error al modificar ${config.entity.singular}:", error);`,
      `    res.status(500).json({ mensaje: "Error al modificar ${config.entity.singular}" });`,
      "  }",
      "});",
      ""
    )
  }
  if (operations.has("delete")) {
    lines.push(
      "// DELETE /:id: elimina un documento usando su _id de MongoDB.",
      "router.delete(\"/:id\", async (req, res) => {",
      "  try {",
      `    const documento = await ${singular}.findByIdAndDelete(req.params.id);`,
      "    if (!documento) return res.status(404).json({ mensaje: \"Registro no encontrado\" });",
      "    res.json({ mensaje: \"Registro eliminado\" });",
      "  } catch (error) {",
      "    if (error.name === \"CastError\") {",
      "      return res.status(400).json({ mensaje: \"El identificador no es válido\" });",
      "    }",
      `    console.error("Error al eliminar ${config.entity.singular}:", error);`,
      `    res.status(500).json({ mensaje: "Error al eliminar ${config.entity.singular}" });`,
      "  }",
      "});",
      ""
    )
  }
  lines.push("export default router;", "")
  return lines.join("\n")
}

function generateApi(config) {
  const { singular, plural, apiPath } = config.entity
  const operations = new Set(config.operations)
  const lines = [
    'import axios from "axios";',
    "",
    `// Axios centraliza las peticiones del recurso ${plural}.`,
    `const API_URL = "http://localhost:3000${apiPath}";`,
    "",
  ]
  if (operations.has("list")) {
    lines.push(
      `export async function get${singularPluralName(singular, plural)}() {`,
      "  const response = await axios.get(API_URL);",
      "  return response.data;",
      "}",
      ""
    )
  }
  if (operations.has("create")) {
    lines.push(
      `export async function create${singular}(datos) {`,
      "  const response = await axios.post(API_URL, datos);",
      "  return response.data;",
      "}",
      ""
    )
  }
  if (operations.has("edit")) {
    lines.push(
      `export async function update${singular}(id, datos) {`,
      "  const response = await axios.put(`${API_URL}/${encodeURIComponent(id)}`, datos);",
      "  return response.data;",
      "}",
      ""
    )
  }
  if (operations.has("delete")) {
    lines.push(
      `export async function delete${singular}(id) {`,
      "  const response = await axios.delete(`${API_URL}/${encodeURIComponent(id)}`);",
      "  return response.data;",
      "}",
      ""
    )
  }
  return lines.join("\n")
}

function singularPluralName(singular, plural) {
  const lowerPlural = plural[0].toUpperCase() + plural.slice(1)
  return lowerPlural || `${singular}s`
}

function defaultValue(field) {
  if (field.defaultValue === "") return field.type === "boolean" ? false : field.type === "number" ? "" : ""
  if (field.type === "boolean") return field.defaultValue === "true"
  if (field.type === "number") return Number(field.defaultValue)
  return field.defaultValue
}

function fieldControl(field) {
  const id = `campo-${field.name}`
  const required = field.required ? " required" : ""
  const pattern = field.pattern || (field.type === "email" ? "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" : "")
  const min = field.min === null ? "" : ` ${field.type === "number" || field.type === "date" ? "min" : "minlength"}="${escapeHtml(field.min)}"`
  const max = field.max === null ? "" : ` ${field.type === "number" || field.type === "date" ? "max" : "maxlength"}="${escapeHtml(field.max)}"`
  const patternAttribute = pattern ? ` pattern="${escapeHtml(pattern)}"` : ""
  if (field.type === "boolean") {
    return `      <label class="flex items-center gap-2">
        <input id="${id}" v-model="registro.${field.name}" type="checkbox"${required}>
        ${escapeHtml(field.label)}
      </label>`
  }
  if (field.type === "radio") {
    return `      <fieldset class="grid gap-2">
        <legend>${escapeHtml(field.label)}${field.required ? " *" : ""}</legend>
${field.options.map((option) => `        <label class="flex items-center gap-2">
          <input v-model="registro.${field.name}" type="radio" value="${escapeHtml(option.value)}"${required}>
          ${escapeHtml(option.label)}
        </label>`).join("\n")}
      </fieldset>`
  }
  if (field.type === "select") {
    return `      <div class="grid gap-2">
        <label for="${id}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label>
        <select id="${id}" v-model="registro.${field.name}" class="rounded border border-gray-300 bg-white p-2"${required}>
          <option value="">Selecciona una opción</option>
${field.options.map((option) => `          <option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("\n")}
        </select>
      </div>`
  }
  if (field.type === "textarea") {
    return `      <div class="grid gap-2">
        <label for="${id}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label>
        <textarea id="${id}" v-model.trim="registro.${field.name}" class="rounded border border-gray-300 p-2" rows="3"${required}${min}${max}${patternAttribute}></textarea>
      </div>`
  }
  const inputType = field.type === "phone" ? "tel" : field.type
  const numberModifier = field.type === "number" ? ".number" : ["text", "email", "phone"].includes(field.type) ? ".trim" : ""
  return `      <div class="grid gap-2">
        <label for="${id}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label>
        <input id="${id}" v-model${numberModifier}="registro.${field.name}" class="rounded border border-gray-300 p-2" type="${inputType}"${required}${min}${max}${patternAttribute}>
      </div>`
}

function generateComponent(config) {
  const { singular, plural } = config.entity
  const { component, title } = config.screen
  const operations = new Set(config.operations)
  const apiImports = []
  if (operations.has("list")) apiImports.push(`get${singularPluralName(singular, plural)}`)
  if (operations.has("create")) apiImports.push(`create${singular}`)
  if (operations.has("edit")) apiImports.push(`update${singular}`)
  if (operations.has("delete")) apiImports.push(`delete${singular}`)
  const fieldsInForm = config.fields.filter((field) => field.form)
  const listFields = config.fields.filter((field) => field.list)
  const searchFields = config.fields.filter((field) => field.search)
  const initialValues = Object.fromEntries(config.fields.map((field) => [field.name, defaultValue(field)]))
  const scriptImports = ["ref", "reactive"]
  if (config.operations.includes("search")) scriptImports.push("computed")
  if (operations.has("list")) scriptImports.push("onMounted")
  const componentTemplate = [
    "<template>",
    '  <section class="mx-auto w-full rounded-lg bg-white p-4 shadow sm:p-8">',
    `    <h1 class="mb-6 rounded bg-[#1b4965] px-4 py-3 text-xl font-semibold text-white">${escapeHtml(title)}</h1>`,
  ]

  if (operations.has("create") || operations.has("edit")) {
    componentTemplate.push(
      `    <form v-if="${operations.has("edit") && !operations.has("create") ? "editingId" : "true"}" class="mb-8 grid gap-4" @submit.prevent="guardar">`,
      ...fieldsInForm.map(fieldControl),
      '      <p v-if="error" class="rounded border border-red-300 bg-red-50 p-3 text-red-700" role="alert">{{ error }}</p>',
      '      <div class="flex flex-wrap gap-3">',
      '        <button type="submit" class="rounded bg-[#1b4965] px-5 py-2 font-semibold text-white disabled:opacity-60" :disabled="saving">{{ saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear" }}</button>',
      operations.has("edit") ? '        <button v-if="editingId" type="button" class="rounded border px-5 py-2" @click="limpiar">Cancelar edición</button>' : "",
      '      </div>',
      "    </form>"
    )
  }
  if (operations.has("search")) {
    componentTemplate.push(
      '    <label class="mb-4 grid gap-2">Buscar en los campos configurados',
      '      <input v-model="searchTerm" class="rounded border border-gray-300 p-2" type="search" placeholder="Escribe para filtrar...">',
      "    </label>"
    )
  }
  if (operations.has("list")) {
    componentTemplate.push(
      '    <p v-if="loading" class="py-4 text-gray-600" role="status">Cargando registros...</p>',
      !operations.has("create") && !operations.has("edit")
        ? '    <p v-if="error && !saving" class="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700" role="alert">{{ error }}</p>'
        : "",
      '    <div v-if="!loading" class="overflow-x-auto">',
      '      <table class="w-full border-collapse text-left">',
      '        <thead><tr class="border-b bg-gray-50">',
      ...listFields.map((field) => `          <th class="p-3">${escapeHtml(field.label)}</th>`),
      operations.has("edit") || operations.has("delete") ? '          <th class="p-3">Acciones</th>' : "",
      "        </tr></thead>",
      '        <tbody>',
      '          <tr v-for="registroActual in registrosVisibles" :key="registroActual._id" class="border-b">',
      ...listFields.map((field) => `            <td class="p-3">{{ registroActual.${field.name} }}</td>`),
      operations.has("edit") || operations.has("delete")
        ? `            <td class="flex gap-2 p-3">
${operations.has("edit") ? '              <button type="button" class="rounded border px-3 py-1" @click="editar(registroActual)">Editar</button>' : ""}
${operations.has("delete") ? '              <button type="button" class="rounded border border-red-300 px-3 py-1 text-red-700" @click="eliminar(registroActual)">Borrar</button>' : ""}
            </td>`
        : "",
      "          </tr>",
      '          <tr v-if="registrosVisibles.length === 0"><td class="p-4 text-gray-600" :colspan="columnCount">No hay registros para mostrar.</td></tr>',
      "        </tbody>",
      "      </table>",
      "    </div>"
    )
  }
  componentTemplate.push("  </section>", "</template>")

  const script = [
    "<script setup>",
    `import { ${scriptImports.join(", ")} } from "vue";`,
    `import { ${apiImports.join(", ")} } from "../api/${slugify(plural)}.js";`,
    "",
    `const initialValues = ${js(initialValues)};`,
    "const registro = reactive({ ...initialValues });",
    `const registros = ref([]);`,
    "const loading = ref(false);",
    "const saving = ref(false);",
    "const error = ref(\"\");",
    "const editingId = ref(null);",
    operations.has("search") ? "const searchTerm = ref(\"\");" : "",
    operations.has("search")
      ? `const registrosVisibles = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase();
  if (!query) return registros.value;
  return registros.value.filter((item) =>
    [${searchFields.map((field) => `item.${field.name}`).join(", ")}]
      .some((value) => String(value ?? "").toLocaleLowerCase().includes(query))
  );
});`
      : "const registrosVisibles = registros;",
    `const columnCount = ${listFields.length + (operations.has("edit") || operations.has("delete") ? 1 : 0)};`,
  ]

  if (operations.has("list")) {
    script.push(
      "",
      "async function cargar() {",
      "  loading.value = true;",
      "  error.value = \"\";",
      "  try {",
      `    registros.value = await get${singularPluralName(singular, plural)}();`,
      "  } catch (requestError) {",
      "    error.value = requestError.response?.data?.mensaje || requestError.message || \"No se pudieron cargar los registros.\";",
      "  } finally {",
      "    loading.value = false;",
      "  }",
      "}"
    )
  }
  if (operations.has("create") || operations.has("edit")) {
    script.push(
      "",
      "function limpiar() {",
      "  Object.assign(registro, initialValues);",
      "  editingId.value = null;",
      "  error.value = \"\";",
      "}"
    )
  }
  if (operations.has("edit")) {
    script.push(
      "",
      "function editar(item) {",
      "  Object.assign(registro, initialValues, item);",
      "  editingId.value = item._id;",
      "  error.value = \"\";",
      "}"
    )
  }
  if (operations.has("create") || operations.has("edit")) {
    script.push(
      "",
      "async function guardar() {",
      "  saving.value = true;",
      "  error.value = \"\";",
      "  try {",
      `    const datos = { ${fieldsInForm.map((field) => `${field.name}: registro.${field.name}`).join(", ")} };`,
      operations.has("edit") && operations.has("create")
        ? `    if (editingId.value) await update${singular}(editingId.value, datos);\n    else await create${singular}(datos);`
        : operations.has("edit")
          ? `    if (editingId.value) await update${singular}(editingId.value, datos);`
          : `    await create${singular}(datos);`,
      "    limpiar();",
      operations.has("list") ? "    await cargar();" : "",
      "  } catch (requestError) {",
      "    error.value = requestError.response?.data?.mensaje || requestError.message || \"No se pudo guardar el registro.\";",
      "  } finally {",
      "    saving.value = false;",
      "  }",
      "}"
    )
  }
  if (operations.has("delete")) {
    script.push(
      "",
      "async function eliminar(item) {",
      `  if (!window.confirm("¿Quieres borrar este registro de ${escapeHtml(plural)}?")) return;`,
      "  error.value = \"\";",
      "  try {",
      `    await delete${singular}(item._id);`,
      "    await cargar();",
      "  } catch (requestError) {",
      "    error.value = requestError.response?.data?.mensaje || requestError.message || \"No se pudo borrar el registro.\";",
      "  }",
      "}"
    )
  }
  if (operations.has("list")) script.push("", "onMounted(cargar);")
  script.push("</script>", "")
  return `${componentTemplate.filter(Boolean).join("\n")}\n\n${script.filter(Boolean).join("\n")}`
}

function generateInstructions(config) {
  const { singular, plural, apiPath } = config.entity
  const { component, route, menuLabel, title } = config.screen
  const operationsText = config.operations.map((operation) => ({
    list: "listar",
    create: "crear",
    edit: "editar",
    delete: "borrar",
    search: "buscar en la lista",
  })[operation]).join(", ")
  const menuFragment = menuLabel
    ? `\n\nPara añadir el enlace del menú, revisa el estilo de [src/components/NavBar.vue](../../../src/components/NavBar.vue) e inserta dentro de su navegación un enlace como este:\n\n\`\`\`vue\n<RouterLink to="${escapeHtml(route)}">${escapeHtml(menuLabel)}</RouterLink>\n\`\`\`\n`
    : "\n\nNo se solicitó un enlace de menú. Si lo necesitas, añade uno manualmente a `src/components/NavBar.vue`."

  return `# Integración de ${title}

## Resumen

Se generó una pantalla CRUD para **${title}**, con operaciones para ${operationsText}. La colección nueva se llamará \`${plural}\`, la API estará en \`${apiPath}\` y MongoDB usará \`_id\` como identificador.

Esta herramienta solo guarda los archivos en su carpeta de salida. No modifica ni ejecuta el proyecto.

## Archivos generados

- \`backend/modelos/${singular}.js\`: esquema Mongoose (modelo: las reglas y estructura de un documento).
- \`backend/rutas/${slugify(plural)}.rutas.js\`: router Express (grupo de endpoints HTTP del recurso).
- \`src/api/${slugify(plural)}.js\`: funciones Axios (capa que envía peticiones a la API).
- \`src/components/${component}.vue\`: pantalla Vue y formulario/listado seleccionados.
- \`configuracion.json\`: respuestas estructuradas que permiten revisar o volver a generar la propuesta.
- \`INSTRUCCIONES.md\`: esta guía de integración.

Una **colección** es el conjunto de documentos de ${plural} en MongoDB. Un **endpoint** es una dirección HTTP, por ejemplo \`${apiPath}\`. El **componente** presenta la interfaz; el modelo y el router implementan la persistencia en backend.

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
- Verifica errores de red, identificadores inválidos y que la lista se actualice tras crear, editar o borrar.
- Ejecuta \`npm run build\` después de copiar los archivos. El build comprueba la compilación del frontend; no valida que MongoDB esté disponible ni que los endpoints funcionen.

## Límites de esta entrega

- El identificador de MongoDB es siempre \`_id\`; no se generan identificadores de negocio.
- La búsqueda se hace en memoria sobre los registros ya cargados, no en MongoDB.
- No se generan relaciones, stores Pinia, catálogos externos, filtros avanzados, ordenación ni exportación PDF.
- Los tipos Listado, Detalle, Formulario y Relacionado, y la reutilización de recursos existentes, se añadirán en fases posteriores. Esta propuesta crea una colección nueva y no duplica recursos existentes.
- Las restricciones se limitan a las opciones configurables del formulario y al esquema Mongoose generado; revisa las reglas específicas de negocio antes de integrar.
`
}

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
    [`backend/modelos/${singular}.js`]: generateModel(normalized),
    [`backend/rutas/${slugify(plural)}.rutas.js`]: generateRoutes(normalized),
    [`src/api/${slugify(plural)}.js`]: generateApi(normalized),
    [`src/components/${normalized.screen.component}.vue`]: generateComponent(normalized),
  }
  const outputSlug = slugify(normalized.screen.component)
  files["INSTRUCCIONES.md"] = generateInstructions(normalized)
  return { files, config: normalized, outputSlug }
}

export { slugify }
