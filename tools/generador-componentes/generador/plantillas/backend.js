import { RESOURCE_LIBRARY, js, singularPluralName, slugify } from "../datos.js"

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
    const flags = field.pattern ? field.patternFlags : ""
    validators.push(`{ validator: (value) => {
      if (value == null || value === "") return true;
      const match = new RegExp(${js(pattern)}, ${js(flags)}).exec(String(value));
      return match?.index === 0 && match[0].length === String(value).length;
    }, message: "El formato no es válido" }`)
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

function mongooseRelationField(relation) {
  const meta = RESOURCE_LIBRARY[relation.resource]
  const properties = [
    "type: mongoose.Schema.Types.ObjectId",
    `ref: ${js(meta.refModel)}`,
  ]
  if (relation.required) properties.push("required: true")
  return `    // Referencia al documento real de ${meta.label}: MongoDB guarda su ObjectId.
    ${relation.fieldName}: { ${properties.join(", ")} },`
}

export function generateModel(config) {
  const { singular, plural } = config.entity
  return `// Dónde va: backend/modelos/${singular}.js
// Qué es: el «modelo» ${singular}. Un esquema Mongoose declara los campos de cada
// documento de la colección ${plural}, cuáles son obligatorios y sus validaciones;
// el backend usa este modelo en las rutas para consultar y guardar datos.
import mongoose from "mongoose";

// Este esquema describe los campos y validaciones de cada documento ${singular}.
const ${singular}Schema = new mongoose.Schema(
  {
${[
    ...config.fields.map(mongooseField),
    ...config.relations.map(mongooseRelationField),
  ].join("\n")}
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

export function generateRoutes(config) {
  const { singular, plural } = config.entity
  const operations = new Set(config.operations)
  const relations = config.relations
  const bodyOperations = operations.has("create") || operations.has("edit")
  const filterRelations = relations.filter((relation) => relation.filterable)
  const relatedModels = [...new Set(relations.map((relation) => RESOURCE_LIBRARY[relation.resource].refModel))]
  const imports = [
    "import express from \"express\";",
    `import ${singular} from "../modelos/${singular}.js";`,
    // Solo se importan los modelos realmente referenciados; su único uso aquí es
    // comprobar que el documento relacionado existe antes de guardar (patrón de
    // backend/rutas/citas.rutas.js).
    ...(bodyOperations ? relatedModels.map((model) => `import ${model} from "../modelos/${model}.js";`) : []),
  ]
  const lines = [
    `// Dónde va: backend/rutas/${slugify(plural)}.rutas.js`,
    `// Qué es: un router de Express, el grupo de endpoints HTTP del recurso ${plural}.`,
    "// Los métodos significan: GET consulta, POST crea, PUT edita y DELETE borra.",
    "// El archivo backend/server.js activa estas direcciones al registrar el router",
    "// con app.use(), y ahí es donde hay que añadir la línea del fragmento de integración.",
    ...imports,
    "",
    "const router = express.Router();",
    "",
  ]

  if (bodyOperations) {
    lines.push(
      `const camposPermitidos = ${js([
        ...config.fields.map((field) => field.name),
        ...relations.map((relation) => relation.fieldName),
      ])};`,
      "",
      "// Acepta solo los campos declarados; nunca se guardan propiedades arbitrarias.",
      "function datosPermitidos(body = {}) {",
      "  return Object.fromEntries(",
      "    camposPermitidos",
      "      .filter((campo) => body[campo] !== undefined)",
      "      .map((campo) => [campo, body[campo]])",
      "  );",
      "}",
      "",
      `// Comprueba que cada referencia apunte a un documento existente; devuelve una`,
      `// cadena vacía cuando todas son válidas (mismo patrón que citas.rutas.js).`,
      "async function validarRelaciones(datos) {",
      ...relations.map((relation) => {
        const model = RESOURCE_LIBRARY[relation.resource].refModel
        return [
          `  if (datos.${relation.fieldName} && !(await ${model}.exists({ _id: datos.${relation.fieldName} }))) {`,
          `    return "El ${RESOURCE_LIBRARY[relation.resource].singularWord} seleccionado no existe";`,
          "  }",
        ].join("\n")
      }),
      "  return \"\";",
      "}",
      ""
    )
  }

  if (operations.has("list")) {
    if (filterRelations.length) {
      lines.push(
        "// GET /: devuelve los documentos; admite filtrar por las relaciones indicadas,",
        "// por ejemplo GET /api/" + slugify(plural) + "?pacienteId=...",
        "router.get(\"/\", async (req, res) => {",
        "  try {",
        "    const filtros = {};",
        ...filterRelations.map((relation) => [
          `    if (req.query.${relation.fieldName}) {`,
          `      filtros.${relation.fieldName} = req.query.${relation.fieldName};`,
          "    }",
        ].join("\n")),
        `    res.json(await ${singular}.find(filtros).lean());`,
        "  } catch (error) {",
        "    if (error.name === \"CastError\") {",
        "      return res.status(400).json({ mensaje: \"El identificador de una relación no es válido\" });",
        "    }",
        `    console.error("Error al listar ${config.entity.plural}:", error);`,
        `    res.status(500).json({ mensaje: "Error al listar ${config.entity.plural}" });`,
        "  }",
        "});",
        ""
      )
    } else {
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
  }
  if (operations.has("create")) {
    lines.push(
      "// POST /: valida las referencias y crea un documento.",
      "router.post(\"/\", async (req, res) => {",
      "  try {",
      "    const datos = datosPermitidos(req.body);",
      ...(relations.length ? [
        "    const errorRelacion = await validarRelaciones(datos);",
        "    if (errorRelacion) return res.status(400).json({ mensaje: errorRelacion });",
        "",
      ] : []),
      `    res.status(201).json(await ${singular}.create(datos));`,
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
      "// PUT /:id: actualiza los campos permitidos y vuelve a validarlos,",
      "// incluyendo las referencias a otros documentos.",
      "router.put(\"/:id\", async (req, res) => {",
      "  try {",
      "    const datos = datosPermitidos(req.body);",
      ...(relations.length ? [
        "    const errorRelacion = await validarRelaciones(datos);",
        "    if (errorRelacion) return res.status(400).json({ mensaje: errorRelacion });",
        "",
      ] : []),
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

export function generateApi(config) {
  const { singular, plural, apiPath } = config.entity
  const operations = new Set(config.operations)
  const filterRelations = config.relations.filter((relation) => relation.filterable)
  const lines = [
    `// Dónde va: src/api/${slugify(plural)}.js`,
    "// Qué es: la capa API del frontend. Encapsula Axios para que los componentes",
    "// no construyan URLs ni peticiones a mano: cada función lanza la petición y",
    "// devuelve response.data. Los componentes solo importan y llaman a estas funciones.",
    'import axios from "axios";',
    "",
    "// Dirección completa del recurso; usa el mismo puerto que el resto de módulos del proyecto.",
    `const API_URL = "http://localhost:3000${apiPath}";`,
    "",
  ]
  if (operations.has("list")) {
    if (filterRelations.length) {
      lines.push(
        `// GET ${apiPath}: devuelve la lista de ${plural} y admite filtros opcionales por`,
        `// relación (${filterRelations.map((relation) => relation.fieldName).join(", ")}), igual que getCitas en el proyecto.`,
        `// El componente llama a esta función dentro de try/catch para mostrar los errores.`,
        `export async function get${singularPluralName(singular, plural)}(filtros = {}) {`,
        "  const response = await axios.get(API_URL, { params: filtros });",
        "  // response.data contiene el array JSON que envió el backend.",
        "  return response.data;",
        "}",
        ""
      )
    } else {
      lines.push(
        `// GET ${apiPath}: devuelve la lista completa de ${plural}.`,
        `// El componente llama a esta función dentro de try/catch para mostrar los errores.`,
        `export async function get${singularPluralName(singular, plural)}() {`,
        "  const response = await axios.get(API_URL);",
        "  // response.data contiene el array JSON que envió el backend.",
        "  return response.data;",
        "}",
        ""
      )
    }
  }
  if (operations.has("create")) {
    lines.push(
      `// POST ${apiPath}: guarda un ${singular} nuevo y devuelve el documento creado, con su identificador.`,
      "// datos contiene los campos del formulario; el backend valida las reglas del esquema.",
      `export async function create${singular}(datos) {`,
      "  const response = await axios.post(API_URL, datos);",
      "  return response.data;",
      "}",
      ""
    )
  }
  if (operations.has("edit")) {
    lines.push(
      `// PUT ${apiPath}/:id: actualiza un ${singular} y devuelve la versión guardada.`,
      "// id es el identificador del registro (para entidades nuevas, el _id de MongoDB).",
      `export async function update${singular}(id, datos) {`,
      "  const response = await axios.put(`${API_URL}/${encodeURIComponent(id)}`, datos);",
      "  return response.data;",
      "}",
      ""
    )
  }
  if (operations.has("delete")) {
    lines.push(
      `// DELETE ${apiPath}/:id: elimina un ${singular}.`,
      "// id es el identificador del registro; el backend responde 404 si ya no existe.",
      `export async function delete${singular}(id) {`,
      "  const response = await axios.delete(`${API_URL}/${encodeURIComponent(id)}`);",
      "  return response.data;",
      "}",
      ""
    )
  }
  return lines.join("\n")
}
