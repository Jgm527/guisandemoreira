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

// Recursos reales del proyecto que la herramienta puede reutilizar. Cada entrada
// indica el módulo de src/api/ que existe de verdad, las funciones que exporta de
// verdad (revisadas en los archivos), el campo por el que el backend localiza los
// documentos y los archivos de referencia que conviene leer antes de integrar.
const RESOURCE_LIBRARY = {
  pacientes: {
    apiFile: "pacientes.js",
    label: "Pacientes",
    singular: "Paciente",
    apiPath: "/api/pacientes",
    // El backend de pacientes busca, edita y borra por DNI (dnipac), no por _id.
    idField: "dnipac",
    singularWord: "paciente",
    // Datos para las relaciones: nombre del modelo Mongoose real, campos con los
    // que se muestra cada registro en un selector y store de Pinia existente.
    refModel: "Paciente",
    displayFields: ["nomepac", "apeldoc"],
    store: {
      file: "pacienteStore.js",
      importName: "usepacienteStore",
      idProp: "idPaciente",
      seleccionar: "seleccionarPaciente",
      limpiar: "limpiarPaciente",
    },
    apiFunctions: {
      list: "getPacientes",
      create: "savePaciente",
      edit: "modifyPaciente",
      delete: "deletePaciente",
    },
    referenceFiles: [
      "src/api/pacientes.js",
      "backend/modelos/Paciente.js",
      "backend/rutas/pacientes.rutas.js",
    ],
    notes: "Los pacientes se identifican por el campo dnipac (DNI), no por _id. Si la pantalla crea o edita pacientes, incluye dnipac entre los campos del formulario y revisa backend/rutas/pacientes.rutas.js.",
  },
  doctores: {
    apiFile: "doctores.js",
    label: "Doctores",
    singular: "Doctor",
    apiPath: "/api/doctores",
    idField: "_id",
    singularWord: "doctor",
    refModel: "Doctor",
    displayFields: ["nomedoc", "apeldoc"],
    store: {
      file: "doctorStore.js",
      importName: "useDoctorStore",
      idProp: "idDoctor",
      seleccionar: "seleccionarDoctor",
      limpiar: "limpiarDoctor",
    },
    apiFunctions: {
      list: "getDoctores",
      create: "saveDoctor",
      edit: "modifyDoctor",
      delete: "deleteDoctor",
    },
    referenceFiles: [
      "src/api/doctores.js",
      "backend/modelos/Doctor.js",
      "backend/rutas/doctores.rutas.js",
    ],
    notes: "El backend de doctores localiza cada documento por el campo iddoc; las pantallas reales del proyecto (XestionDoctores.vue) envían doctor._id en la URL y funcionan porque iddoc guarda el mismo valor. Comprueba ese detalle en backend/rutas/doctores.rutas.js antes de editar o borrar registros antiguos.",
  },
  citas: {
    apiFile: "citas.js",
    label: "Citas",
    singular: "Cita",
    apiPath: "/api/citas",
    idField: "_id",
    singularWord: "cita",
    refModel: "Cita",
    displayFields: ["fecha", "hora", "motivo"],
    // El proyecto no tiene un store de citas, así que esta API solo admite el
    // modo selector; la validación lo impide pedir la selección por Pinia.
    apiFunctions: {
      list: "getCitas",
      create: "saveCita",
      edit: "updateCita",
      delete: "deleteCita",
    },
    referenceFiles: [
      "src/api/citas.js",
      "backend/modelos/Cita.js",
      "backend/rutas/citas.rutas.js",
    ],
    notes: "Las citas guardan referencias a otros documentos (pacienteId y doctorId). Para crearlas con la API real necesitas identificadores válidos de paciente y doctor; esta versión no genera los selectores de catálogo necesarios.",
  },
  especialidades: {
    apiFile: "especialidades.js",
    label: "Especialidades",
    singular: "Especialidad",
    apiPath: "/api/especialidades",
    idField: "",
    catalogOnly: true,
    apiFunctions: {
      list: "obtenerEspecialidades",
    },
    referenceFiles: [
      "src/api/especialidades.js",
      "backend/data/especialidades.json",
    ],
    notes: "Es un catálogo de solo lectura: solo existe la operación listar, así que sirve para consultar o filtrar, no para crear registros.",
  },
  municipios: {
    apiFile: "municipios.js",
    label: "Municipios",
    singular: "Municipio",
    apiPath: "/api/municipios",
    idField: "",
    catalogOnly: true,
    apiFunctions: {
      list: "obtenerProvincias",
    },
    referenceFiles: [
      "src/api/municipios.js",
      "backend/data/municipios.json",
    ],
    notes: "Es un catálogo de solo lectura: la API devuelve las provincias y, con obtenerMunicipios(provincia), sus municipios. La versión generada solo lista; los selectores dependientes quedan fuera.",
  },
}

const OPERATIONS = new Set(["list", "create", "edit", "delete", "search"])
const SCREEN_TYPES = new Set(["CRUD", "Listado", "Detalle", "Formulario", "Relacionado"])
// Tipos que admiten declarar relaciones (campos con ObjectId/ref). Listado y
// Detalle no tienen formulario donde escoger el registro relacionado, así que
// esta versión los deja fuera y la validación lo explica.
const RELATION_SCREEN_TYPES = new Set(["CRUD", "Relacionado", "Formulario"])
// Modos de escoger el registro relacionado: «api» muestra un selector con la
// lista que devuelve la API real; «pinia» consume la selección compartida del
// store que ya existe en el proyecto (patrón de Citas.vue).
const RELATION_SELECTIONS = new Set(["api", "pinia"])
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

function parsePattern(value) {
  const input = String(value ?? "").trim()
  const literal = /^\/([\s\S]*)\/([a-z]*)$/.exec(input)
  return literal
    ? { pattern: literal[1], patternFlags: literal[2] }
    : { pattern: input, patternFlags: "" }
}

function matchesPattern(value, pattern, flags) {
  const text = String(value)
  const match = new RegExp(pattern, flags).exec(text)
  return match?.index === 0 && match[0].length === text.length
}

function normalizeField(field) {
  const type = String(field.type ?? "")
  const options = parseOptions(field.options)
  const min = field.min === "" || field.min == null ? null : String(field.min).trim()
  const max = field.max === "" || field.max == null ? null : String(field.max).trim()
  const { pattern, patternFlags } = parsePattern(field.pattern)
  return {
    name: String(field.name ?? "").trim(),
    label: String(field.label ?? "").trim(),
    type,
    required: Boolean(field.required),
    defaultValue: field.defaultValue == null ? "" : String(field.defaultValue),
    min,
    max,
    pattern,
    patternFlags,
    options,
    form: field.form !== false,
    list: Boolean(field.list),
    search: Boolean(field.search),
  }
}

function normalizeRelation(relation) {
  return {
    resource: String(relation.resource ?? "").trim(),
    fieldName: String(relation.fieldName ?? "").trim(),
    label: String(relation.label ?? "").trim(),
    required: Boolean(relation.required),
    selection: String(relation.selection ?? "api").trim() || "api",
    filterable: Boolean(relation.filterable),
  }
}

function normalizePinia(input) {
  const pinia = input.pinia ?? {}
  return {
    enabled: Boolean(pinia.enabled),
    fields: Array.isArray(pinia.fields) ? [...new Set(pinia.fields.map(String).map((name) => name.trim()).filter(Boolean))] : [],
  }
}

export function validateConfiguration(input) {
  const errors = []
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { errors: ["La configuración debe ser un objeto JSON."], config: null }
  }

  const source = String(input.source ?? "new").trim() || "new"
  const existingResource = String(input.existingResource ?? "").trim()
  const screen = input.screen ?? {}
  const entity = input.entity ?? {}
  const operations = Array.isArray(input.operations)
    ? [...new Set(input.operations.map(String))]
    : []
  const fields = Array.isArray(input.fields) ? input.fields.map(normalizeField) : []
  const relations = Array.isArray(input.relations) ? input.relations.map(normalizeRelation) : []
  const pinia = normalizePinia(input)

  if (!SCREEN_TYPES.has(String(screen.type ?? ""))) {
    errors.push("Selecciona un tipo de pantalla válido: CRUD, Listado, Detalle o Formulario.")
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

  if (source === "existing") {
    if (!existingResource || !RESOURCE_LIBRARY[existingResource]) {
      errors.push("Selecciona un recurso existente válido del proyecto para reutilizarlo.")
    } else {
      const resourceMeta = RESOURCE_LIBRARY[existingResource]
      const expectedPath = String(resourceMeta.apiPath ?? "")
      if (String(entity.apiPath ?? "").trim() && String(entity.apiPath ?? "").trim() !== expectedPath) {
        errors.push(`El recurso existente ${existingResource} ya usa la ruta ${expectedPath}; no debe duplicarse otra API.`)
      }
      if (String(entity.singular ?? "").trim() && !isValidPascalCase(String(entity.singular ?? ""))) {
        errors.push("El nombre singular del recurso existente debe seguir el formato PascalCase.")
      }
      if (String(entity.plural ?? "").trim() && !/^[a-z][a-z0-9]*$/.test(String(entity.plural ?? ""))) {
        errors.push("El nombre plural del recurso existente debe estar en minúsculas, empezar por letra y usar solo letras y números.")
      }
      // La especificación prohíbe deducir endpoints: solo se admiten las operaciones
      // que el módulo real de src/api/ exporta (search es filtrado local, no backend).
      const operationLabels = { list: "listar", create: "crear", edit: "editar", delete: "borrar", search: "buscar" }
      const unsupportedOperations = operations.filter((operation) => operation !== "search" && !resourceMeta.apiFunctions[operation])
      if (unsupportedOperations.length) {
        const available = Object.keys(resourceMeta.apiFunctions)
          .map((operation) => operationLabels[operation] ?? operation)
          .join(", ")
        const requested = unsupportedOperations.map((operation) => operationLabels[operation] ?? operation).join(", ")
        errors.push(`El recurso ${existingResource} solo ofrece estas operaciones reales: ${available}. No tiene ${requested}; quítala o revisa src/api/${resourceMeta.apiFile} antes de pedirla.`)
      }
    }
  } else {
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
  if (String(screen.type ?? "") === "Formulario" && !(operations.includes("create") || operations.includes("edit"))) {
    errors.push("Las pantallas de tipo Formulario requieren crear o editar.")
  }
  if (String(screen.type ?? "") === "Formulario" && operations.includes("edit") && !operations.includes("create")) {
    errors.push("Una pantalla de tipo Formulario que edita necesita también crear: para editar registros existentes elige el tipo CRUD.")
  }
  if (String(screen.type ?? "") === "Formulario" && operations.includes("delete")) {
    errors.push("Las pantallas de tipo Formulario no borran registros; elige el tipo CRUD para combinar formulario y tabla.")
  }
  if (String(screen.type ?? "") === "Detalle" &&
      operations.some((operation) => !["list", "search"].includes(operation))) {
    errors.push("Las pantallas de tipo Detalle solo muestran un registro: elige listar (y opcionalmente buscar), sin crear, editar ni borrar.")
  }
  if (["Listado", "Detalle"].includes(String(screen.type ?? "")) && !operations.includes("list")) {
    errors.push("Las pantallas de tipo Listado o Detalle necesitan la operación listar.")
  }
  if ((operations.includes("create") || operations.includes("edit")) &&
      !fields.some((field) => field.form) &&
      relations.length === 0) {
    errors.push("Añade al menos un campo visible en el formulario para crear o editar.")
  }
  if (operations.includes("list") && !fields.some((field) => field.list) && relations.length === 0) {
    errors.push("Marca al menos un campo para mostrarlo en la tabla.")
  }

  const seenFields = new Set()
  if (relations.length && source !== "new") {
    errors.push("Las relaciones solo están disponibles para entidades nuevas: una pantalla que reutiliza un recurso existente no crea colección donde guardar referencias.")
  }
  if (relations.length && !RELATION_SCREEN_TYPES.has(String(screen.type ?? ""))) {
    errors.push("Las relaciones solo están disponibles para las pantallas de tipo CRUD, Relacionado y Formulario; Listado y Detalle no tienen formulario donde escoger el registro relacionado.")
  }
  if (String(screen.type ?? "") === "Relacionado" && relations.length === 0) {
    errors.push("El tipo Relacionado necesita al menos una relación: define en el paso de relaciones qué entidad usarás y cómo se escoge su registro.")
  }
  if (relations.length > 5) {
    errors.push("Una pantalla puede declarar como máximo 5 relaciones en esta versión.")
  }
  const seenRelationNames = new Set()
  for (const [index, relation] of relations.entries()) {
    const prefix = `Relación ${index + 1}`
    const relationMeta = RESOURCE_LIBRARY[relation.resource]
    if (!relationMeta) {
      errors.push(`${prefix}: elige una entidad relacionada conocida del proyecto (pacientes, doctores o citas).`)
    } else if (relationMeta.catalogOnly) {
      errors.push(`${prefix}: ${relationMeta.label} es un catálogo de solo lectura y no guarda documentos en MongoDB, así que no puede referenciarse con ObjectId. Usa un campo selector con opciones fijas si solo necesitas etiquetas.`)
    }
    if (!isValidIdentifier(relation.fieldName) || relation.fieldName.length > 40) {
      errors.push(`${prefix}: el campo que guarda la referencia debe empezar en minúscula y usar solo letras y números (por ejemplo, pacienteId).`)
    } else if (seenFields.has(relation.fieldName)) {
      errors.push(`${prefix}: el campo "${relation.fieldName}" ya existe entre los campos de la pantalla.`)
    } else if (seenRelationNames.has(relation.fieldName)) {
      errors.push(`${prefix}: el campo "${relation.fieldName}" está repetido entre las relaciones.`)
    }
    seenRelationNames.add(relation.fieldName)
    if (!relation.label) errors.push(`${prefix}: escribe la etiqueta visible que verá la persona usuaria (por ejemplo, Paciente).`)
    if (!RELATION_SELECTIONS.has(relation.selection)) {
      errors.push(`${prefix}: el modo de escoger el registro debe ser un selector de la API o la selección compartida de un store Pinia.`)
    }
    if (relationMeta && relation.selection === "pinia" && !relationMeta.store) {
      errors.push(`${prefix}: ${relationMeta.label} no tiene un store de Pinia en este proyecto; elige el modo selector de la API.`)
    }
    if (relation.filterable && !operations.includes("list")) {
      errors.push(`${prefix}: filtrar el listado por ${relation.fieldName || "la relación"} necesita que la pantalla también liste registros.`)
    }
  }

  if (pinia.enabled) {
    if (!fields.length) {
      errors.push("Para compartir la selección con Pinia, la pantalla necesita al menos un campo propio cuyo valor se guarde en el store.")
    }
    if (pinia.fields.length === 0) {
      errors.push("Marca al menos un campo de datos mínimos para guardar en el store de Pinia, además del identificador.")
    }
    if (pinia.fields.length > 8) {
      errors.push("El store de Pinia guarda como máximo 8 campos de datos mínimos además del identificador.")
    }
    for (const fieldName of pinia.fields) {
      if (!fields.some((field) => field.name === fieldName)) {
        errors.push(`El store de Pinia no puede guardar "${fieldName}": no coincide con ningún campo definido en la pantalla.`)
      }
    }
    if (!operations.includes("list")) {
      errors.push("Compartir la selección con Pinia necesita la operación listar: el botón Compartir vive en la tabla de registros.")
    }
  }
  if (relations.length && operations.includes("search")) {
    // La búsqueda local recorre config.fields; los campos de relación muestran
    // etiquetas calculadas, así que esta versión los deja fuera del buscador.
    const searchOverlap = relations.filter((relation) => fields.some((field) => field.name === relation.fieldName))
    if (searchOverlap.length) {
      errors.push("Los campos de relación no pueden estar también entre los campos de búsqueda: quítalos del buscador o cambia el nombre del campo de la relación.")
    }
  }
  if (operations.includes("search") && !fields.some((field) => field.search)) {
    errors.push("Marca al menos un campo para incluirlo en la búsqueda.")
  }

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
        new RegExp(field.pattern, field.patternFlags)
        if (!field.patternFlags) new RegExp(field.pattern, "v")
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
        if (defaultPattern && !matchesPattern(field.defaultValue, defaultPattern, field.patternFlags)) {
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

  const resourceMeta = source === "existing" && existingResource && RESOURCE_LIBRARY[existingResource]
    ? RESOURCE_LIBRARY[existingResource]
    : null

  const config = {
    version: 1,
    source,
    existingResource: resourceMeta ? existingResource : "",
    screen: {
      type: String(screen.type ?? "CRUD").trim() || "CRUD",
      title: String(screen.title ?? "").trim(),
      component: String(screen.component ?? "").trim(),
      route: String(screen.route ?? "").trim(),
      menuLabel: String(screen.menuLabel ?? "").trim(),
    },
    entity: {
      singular: String(entity.singular ?? "").trim() || (resourceMeta ? resourceMeta.singular : ""),
      plural: String(entity.plural ?? "").trim() || (resourceMeta ? existingResource : ""),
      apiPath: String(entity.apiPath ?? "").trim() || (resourceMeta ? resourceMeta.apiPath : ""),
      // Los recursos reales pueden identificarse por otro campo (por ejemplo dnipac);
      // las entidades nuevas siempre usan el _id automático de Mongoose.
      idField: resourceMeta ? (resourceMeta.idField || "_id") : "_id",
    },
    fields,
    operations: operations.filter((operation) => OPERATIONS.has(operation)),
    relations,
    pinia,
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

function generateModel(config) {
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

function generateRoutes(config) {
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

function generateApi(config) {
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
  const nativePatternSupported = ["text", "email", "phone"].includes(field.type)
  const patternAttribute = pattern && nativePatternSupported && !field.patternFlags
    ? ` pattern="${escapeHtml(pattern)}"`
    : ""
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
  const { component, title, type } = config.screen
  const operations = new Set(config.operations)
  const resourceDetails = getResourceApiDetails(config)
  const idField = resourceDetails.idField || "_id"
  const relations = config.relations
  const apiRelations = relations.filter((relation) => relation.selection === "api")
  const piniaRelations = relations.filter((relation) => relation.selection === "pinia")
  const listRelations = relations.filter((relation) => relation.filterable)
  // Los stores reales del proyecto (pacienteStore, doctorStore) se importan con
  // el nombre exacto que existe en src/store/; se calcula también el nombre de
  // la variable local que usará el componente.
  const storeVars = new Map()
  for (const relation of piniaRelations) {
    const library = RESOURCE_LIBRARY[relation.resource]
    const variable = library.store.importName.replace(/^use/, "").replace(/^([A-Z])/, (letter) => letter.toLowerCase())
    storeVars.set(relation.fieldName, { library, store: library.store, variable })
  }
  const ownStore = config.pinia.enabled
    ? {
        file: `${slugify(singular)}Store.js`,
        importName: `use${singular}Store`,
        variable: `${singular[0].toLowerCase()}${singular.slice(1)}Store`,
        idProp: `id${singular}`,
        seleccionar: `seleccionar${singular}`,
        limpiar: `limpiar${singular}`,
        fields: config.pinia.fields,
      }
    : null
  const apiImports = []
  const hasForm = (operations.has("create") || operations.has("edit")) && type !== "Detalle"
  const hasList = operations.has("list")
  const showActions = ((operations.has("edit") || operations.has("delete")) && type !== "Detalle") || Boolean(ownStore && hasList)
  const editingOnly = operations.has("edit") && !operations.has("create")
  if (operations.has("list")) apiImports.push(resourceDetails.apiFunctions.list || `get${singularPluralName(singular, plural)}`)
  if (hasForm && operations.has("create")) apiImports.push(resourceDetails.apiFunctions.create || `create${singular}`)
  if (hasForm && operations.has("edit")) apiImports.push(resourceDetails.apiFunctions.edit || `update${singular}`)
  if (operations.has("delete")) apiImports.push(resourceDetails.apiFunctions.delete || `delete${singular}`)
  const fieldsInForm = config.fields.filter((field) => field.form)
  const listFields = config.fields.filter((field) => field.list)
  const searchFields = config.fields.filter((field) => field.search)
  const initialValues = Object.fromEntries([
    ...config.fields.map((field) => [field.name, defaultValue(field)]),
    ...relations.map((relation) => [relation.fieldName, ""]),
  ])
  const scriptImports = ["ref"]
  if (hasForm) scriptImports.push("reactive")
  if (config.operations.includes("search") || apiRelations.length > 0 || piniaRelations.some((relation) => relation.required)) scriptImports.push("computed")
  if (hasList || apiRelations.length) scriptImports.push("onMounted")
  const alertImports = ["alertaError"]
  if (hasForm || operations.has("delete")) alertImports.push("alertaExito")
  if (operations.has("delete")) alertImports.push("alertaConfirmacion")
  const recordOptions = resourceDetails.catalogOnly ? "registroActual, index" : "registroActual"
  const keyExpression = resourceDetails.catalogOnly ? "index" : `registroActual.${idField}`
  const templatePurpose = [
    hasForm ? "El bloque <form> crea y edita registros a través de la capa de API." : "",
    hasList ? "La tabla muestra los registros que devuelve el backend." : "",
  ].filter(Boolean).join(" ")
  const componentTemplate = [
    "<template>",
    `  <!--
    Dónde va: src/components/${component}.vue
    Qué es: pantalla ${type} para ${title}. ${templatePurpose}
    La lógica está en el bloque <script setup> de abajo, comentado paso a paso.
    Los pasos para copiar e integrar este archivo están en INSTRUCCIONES.md.
  -->`,
    '  <section class="mx-auto w-full rounded-lg bg-white p-4 shadow sm:p-8">',
    `    <h1 class="mb-6 rounded bg-[#1b4965] px-4 py-3 text-xl font-semibold text-white">${escapeHtml(title)}</h1>`,
  ]

  if (hasForm) {
    const showWhenEditing = editingOnly
    const submitLabel = showWhenEditing
      ? '{{ saving ? "Guardando..." : "Guardar cambios" }}'
      : operations.has("edit")
        ? '{{ saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear" }}'
        : '{{ saving ? "Guardando..." : "Crear" }}'
    const piniaRequiredMissing = piniaRelations.some((relation) => relation.required)
    // Control por relación: «api» renderiza un <select> con la lista real del
    // recurso; «pinia» muestra la selección compartida (patrón de Citas.vue,
    // que envía pacienteStore.idPaciente en el formulario).
    const relationFormControl = (relation) => {
      const meta = RESOURCE_LIBRARY[relation.resource]
      const singularLabel = meta.singularWord
      const pascal = relation.fieldName[0].toUpperCase() + relation.fieldName.slice(1)
      if (relation.selection === "api") {
        return `      <div class="grid gap-2">
        <label for="campo-${relation.fieldName}">${escapeHtml(relation.label)}${relation.required ? " *" : ""}</label>
        <select id="campo-${relation.fieldName}" v-model="registro.${relation.fieldName}" class="rounded border border-gray-300 bg-white p-2"${relation.required ? " required" : ""}>
          <option value="">Selecciona ${singularLabel}</option>
          <option v-for="item in relacion${pascal}" :key="item._id" :value="item._id">{{ etiqueta${pascal}(item) }}</option>
        </select>
      </div>`
      }
      const storeVar = storeVars.get(relation.fieldName).variable
      return `      <div class="grid gap-2 rounded border border-gray-200 bg-gray-50 p-3">
        <span class="font-medium">${escapeHtml(relation.label)}${relation.required ? " *" : ""}</span>
        <p v-if="${storeVar}.${meta.store.idProp}" class="text-sm text-gray-700">
          Usando la selección compartida con Pinia: {{ texto${pascal}(${storeVar}.${meta.store.idProp}) }}
        </p>
        <p v-else class="text-sm text-red-700">
          Todavía no hay ${singularLabel} seleccionado en la pantalla que comparte el store de Pinia. Selecciónalo allí y vuelve, o cambia esta relación al modo selector de la API.
        </p>
      </div>`
    }
    componentTemplate.push(
      showWhenEditing
        ? '    <form v-if="editingId" class="mb-8 grid gap-4" @submit.prevent="guardar">'
        : '    <form class="mb-8 grid gap-4" @submit.prevent="guardar">',
      ...relations.map((relation) => relationFormControl(relation)),
      ...fieldsInForm.map(fieldControl),
      '      <div class="flex flex-wrap gap-3">',
      `        <button type="submit"${showWhenEditing ? ' v-if="editingId"' : ""} class="rounded bg-[#1b4965] px-5 py-2 font-semibold text-white disabled:opacity-60" :disabled="saving${piniaRequiredMissing ? " || faltanRelacionesObligatorias" : ""}">${submitLabel}</button>`,
      operations.has("edit") && hasList
        ? '        <button v-if="editingId" type="button" class="rounded border px-5 py-2" @click="limpiar">Cancelar edición</button>'
        : "",
      '      </div>',
      '    </form>'
    )
  }
  if (config.operations.includes("search")) {
    componentTemplate.push(
      '    <!-- La búsqueda filtra la tabla en el navegador; no vuelve a consultar la API. -->',
      '    <label class="mb-4 grid gap-2">Buscar en los campos configurados',
      '      <input v-model="searchTerm" class="rounded border border-gray-300 p-2" type="search" placeholder="Escribe para filtrar...">',
      '    </label>'
    )
  }
  if (hasList) {
    if (type === "Detalle") {
      componentTemplate.push(
        '    <!-- El detalle muestra el registro marcado con el botón «Ver»; si no se ha',
        '         marcado ninguno, usa el primero de la lista. Si la pantalla debe recibir',
        '         el identificador por la ruta, adapta este bloque y el <script setup>. -->',
        '    <div v-if="!loading && (registroDetalle || registrosVisibles[0])" class="mb-4 rounded border border-gray-200 bg-gray-50 p-4">',
        '      <h2 class="mb-2 font-semibold">Detalle del registro</h2>',
        '      <dl class="grid gap-2">',
        '        <template v-for="campo in Object.keys(registroDetalle || registrosVisibles[0])" :key="campo">',
        "          <div class=\"flex gap-2\" v-if=\"campo !== '_id'\">",
        '            <dt class="font-medium text-gray-700">{{ campo }}</dt>',
        '            <dd>{{ (registroDetalle || registrosVisibles[0])[campo] }}</dd>',
        '          </div>',
        '        </template>',
        '      </dl>',
        '    </div>'
      )
    }
    componentTemplate.push(
      '    <p v-if="loading" class="py-4 text-gray-600" role="status">Cargando registros...</p>',
      '    <div v-if="!loading" class="overflow-x-auto">',
      '      <table class="w-full border-collapse text-left">',
      '        <thead><tr class="border-b bg-gray-50">',
      ...listFields.map((field) => `          <th class="p-3">${escapeHtml(field.label)}</th>`),
      ...listRelations.map((relation) => `          <th class="p-3">${escapeHtml(relation.label)}</th>`),
      (showActions || type === "Detalle") ? '          <th class="p-3">Acciones</th>' : "",
      '        </tr></thead>',
      '        <tbody>',
      `          <tr v-for="${recordOptions} in registrosVisibles" :key="${keyExpression}" class="border-b">`,
      ...listFields.map((field) => `            <td class="p-3">{{ registroActual.${field.name} }}</td>`),
      ...listRelations.map((relation) => {
        const pascal = relation.fieldName[0].toUpperCase() + relation.fieldName.slice(1)
        return `            <td class="p-3">{{ texto${pascal}(registroActual.${relation.fieldName}) }}</td>`
      }),
      type === "Detalle"
        ? '            <td class="p-3"><button type="button" class="rounded border px-3 py-1" @click="ver(registroActual)">Ver</button></td>'
        : showActions
          ? `            <td class="flex gap-2 p-3">
${ownStore ? `              <button type="button" class="rounded border px-3 py-1" :aria-pressed="${ownStore.variable}.${ownStore.idProp} === registroActual._id" :title="${ownStore.variable}.${ownStore.idProp} === registroActual._id ? 'Selección compartida' : 'Compartir esta selección con otras pantallas'" @click="compartir(registroActual)">{{ ${ownStore.variable}.${ownStore.idProp} === registroActual._id ? "Compartido" : "Compartir" }}</button>` : ""}
${operations.has("edit") ? '              <button type="button" class="rounded border px-3 py-1" @click="editar(registroActual)">Editar</button>' : ""}
${operations.has("delete") ? '              <button type="button" class="rounded border border-red-300 px-3 py-1 text-red-700" @click="eliminar(registroActual)">Borrar</button>' : ""}
            </td>`
          : "",
      '          </tr>',
      '          <tr v-if="registrosVisibles.length === 0"><td class="p-4 text-gray-600" :colspan="columnCount">No hay registros para mostrar.</td></tr>',
      '        </tbody>',
      '      </table>',
      '    </div>'
    )
  }
  componentTemplate.push('  </section>', '</template>')

  const relatedApiImports = []
  for (const relation of apiRelations) {
    const meta = RESOURCE_LIBRARY[relation.resource]
    const listFunction = meta.apiFunctions.list
    let group = relatedApiImports.find((entry) => entry.module === `../api/${meta.apiFile}`)
    if (!group) {
      group = { module: `../api/${meta.apiFile}`, functions: [] }
      relatedApiImports.push(group)
    }
    if (!group.functions.includes(listFunction)) group.functions.push(listFunction)
  }
  const script = [
    "<script setup>",
    `// Dónde va: src/components/${component}.vue, continuando el bloque <template> de arriba.`,
    "// Patrón del proyecto: el estado vive en ref y reactive, las peticiones salen por la",
    `// capa de API (${resourceDetails.modulePath.replace("../", "src/")}) y los avisos usan`,
    "// src/utils/alertas.js (SweetAlert2), la utilidad que comparten todas las pantallas.",
    `import { ${scriptImports.join(", ")} } from "vue";`,
    `import { ${apiImports.join(", ")} } from "${resourceDetails.modulePath}";`,
    ...relatedApiImports.map((group) => `import { ${group.functions.join(", ")} } from "${group.module}";`),
    ...[...storeVars.values()].map(({ store }) => `import { ${store.importName} } from "../store/${store.file}";`),
    ...(ownStore ? [`import { ${ownStore.importName} } from "../store/${ownStore.file}";`] : []),
    `import { ${alertImports.join(", ")} } from "../utils/alertas.js";`,
    "",
  ]
  for (const { library, variable } of storeVars.values()) {
    script.push(
      `// Acceso al store real del proyecto: guarda la selección de ${library.label.toLowerCase()} entre pantallas.`,
      `const ${variable} = ${library.store.importName}();`,
      "",
    )
  }
  if (ownStore) {
    script.push(
      `// Store propio de esta pantalla: guarda la selección que se comparte con otras pantallas.`,
      `const ${ownStore.variable} = ${ownStore.importName}();`,
      "",
    )
  }
  if (hasForm) {
    script.push(
      "// Valores con los que arranca el formulario; limpiar() vuelve a ellos tras guardar o cancelar.",
      `const initialValues = ${js(initialValues)};`,
      "// reactive guarda los valores del formulario; cada control los edita con v-model=\"registro.campo\".",
      "const registro = reactive({ ...initialValues });",
      "// editingId distingue «crear» de «editar»: guarda el identificador de la fila que se edita.",
      "const editingId = ref(null);",
      "// saving desactiva el botón de guardar mientras la petición está en curso.",
      "const saving = ref(false);",
      "",
    )
  }
  if (hasList) {
    script.push(
      "// registros guarda la lista completa del backend; la tabla muestra registrosVisibles (abajo).",
      "const registros = ref([]);",
      "// loading muestra el mensaje «Cargando registros...» mientras la petición está en curso.",
      "const loading = ref(false);",
      "",
    )
  }
  const pascalName = (fieldName) => fieldName[0].toUpperCase() + fieldName.slice(1)
  if (apiRelations.length) {
    script.push(
      "// Cada ref guarda la lista de registros de la entidad relacionada; la carga la",
      "// API real del proyecto y alimenta el selector del formulario.",
      ...apiRelations.map((relation) =>
        `const relacion${pascalName(relation.fieldName)} = ref([]);`),
      "",
    )
    for (const relation of apiRelations) {
      const pascal = pascalName(relation.fieldName)
      const meta = RESOURCE_LIBRARY[relation.resource]
      script.push(
        `// Etiqueta visible de un registro de ${meta.label.toLowerCase()} en el selector y la tabla.`,
        `function etiqueta${pascal}(item) {`,
        `  return ${js(meta.displayFields)}`,
        "    .map((campo) => item[campo])",
        '    .filter(Boolean)',
        '    .join(" ") || "Registro sin etiqueta";',
        "}",
        "",
        `// Mapa identificador → etiqueta, recalculado cuando cambia la lista cargada.`,
        `const mapa${pascal} = computed(() =>`,
        `  new Map(relacion${pascal}.value.map((item) => [String(item._id), etiqueta${pascal}(item)])));`,
        "",
        `// Convierte el identificador guardado en la referencia en su etiqueta visible.`,
        `function texto${pascal}(id) {`,
        '  const valor = String(id ?? "");',
        '  if (!valor) return "—";',
        ...(() => {
          const storeInfo = storeVars.get(relation.fieldName)
          if (!storeInfo) return []
          return [
            `  if (String(${storeInfo.variable}.${storeInfo.store.idProp}) === valor) {`,
            `    const desdeStore = ${js(meta.displayFields)}`,
            `      .map((campo) => ${storeInfo.variable}[campo])`,
            "      .filter(Boolean)",
            '      .join(" ");',
            "    if (desdeStore) return desdeStore;",
            "  }",
          ]
        })(),
        `  return mapa${pascal}.value.get(valor) ?? valor;`,
        "}",
        "",
      )
    }
  }
  if (piniaRelations.length) {
    for (const relation of piniaRelations) {
      const pascal = pascalName(relation.fieldName)
      const { library, store, variable } = storeVars.get(relation.fieldName)
      script.push(
        `// Sin lista cargada, resuelve la etiqueta con los datos del store compartido.`,
        `function texto${pascal}(id) {`,
        '  const valor = String(id ?? "");',
        '  if (!valor) return "—";',
        `  const desdeStore = ${js(library.displayFields)}`,
        `    .map((campo) => ${variable}[campo])`,
        "    .filter(Boolean)",
        '    .join(" ");',
        "  if (desdeStore) return desdeStore;",
        "  return valor;",
        "}",
        "",
      )
    }
  }
  if (piniaRelations.some((relation) => relation.required)) {
    script.push(
      "// computed que desactiva el botón Guardar mientras falte una relación",
      "// obligatoria en el modo selección compartida de Pinia.",
      "const faltanRelacionesObligatorias = computed(() =>",
      `  ${piniaRelations
        .filter((relation) => relation.required)
        .map((relation) => {
          const { store, variable } = storeVars.get(relation.fieldName)
          return `!${variable}.${store.idProp}`
        })
        .join(" || ")});`,
      "",
    )
  }
  if (type === "Detalle") {
    script.push(
      "// registroDetalle guarda el registro marcado con el botón «Ver» para el bloque de detalle.",
      "const registroDetalle = ref(null);",
      "",
    )
  }
  if (config.operations.includes("search")) {
    script.push(
      "// searchTerm recoge el texto del buscador y lo usa el computed siguiente; no vuelve a",
      "// llamar a la API, solo filtra los registros que ya están en pantalla.",
      'const searchTerm = ref("");',
    )
  }
  if (config.operations.includes("search")) {
    script.push(
      "",
      "// computed recalcula la tabla cada vez que cambian los registros o el texto buscado.",
      "const registrosVisibles = computed(() => {",
      "  const query = searchTerm.value.trim().toLocaleLowerCase();",
      "  if (!query) return registros.value;",
      "  return registros.value.filter((item) =>",
      `    [${searchFields.map((field) => `item.${field.name}`).join(", ")}]`,
      '      .some((value) => String(value ?? "").toLocaleLowerCase().includes(query))',
      "  );",
      "});",
    )
  } else if (hasList) {
    script.push("", "const registrosVisibles = registros;")
  }
  if (hasList) {
    script.push(
      "",
      "// columnCount hace que la fila «No hay registros» ocupe el ancho de toda la tabla.",
      `const columnCount = ${listFields.length + listRelations.length + ((showActions || type === "Detalle") ? 1 : 0)};`,
    )
  }
  script.push(
    "",
    "// La API puede devolver el mensaje de error en «mensaje» o «message»; si no incluye",
    "// ninguno se muestra el texto por defecto (mismo patrón que las pantallas del proyecto).",
    "function mensaxeDoErro(requestError, porDefecto) {",
    "  return requestError.response?.data?.mensaje || requestError.response?.data?.message || porDefecto;",
    "}",
  )
  if (hasList) {
    const listFunction = resourceDetails.apiFunctions.list || `get${singularPluralName(singular, plural)}`
    script.push(
      "",
      "// Trae la lista completa desde la capa API; onMounted(cargar) (al final del archivo)",
      "// la ejecuta automáticamente al abrir la pantalla.",
      "async function cargar() {",
      "  loading.value = true;",
      "  try {",
      `    registros.value = await ${listFunction}();`,
      "  } catch (requestError) {",
      '    alertaError(mensaxeDoErro(requestError, "No se pudieron cargar los registros."), "Error al cargar");',
      "  } finally {",
      "    // finally se ejecuta siempre: la pantalla deja de mostrar «Cargando...» aunque falle.",
      "    loading.value = false;",
      "  }",
      "}",
    )
  }
  if (relations.length && apiRelations.length) {
    script.push(
      "",
      "// Carga las listas de las entidades relacionadas para los selectores; se",
      "// ejecuta en el onMounted de abajo, junto con (o en lugar de) la tabla.",
      "async function cargarRelaciones() {",
      ...apiRelations.map((relation) => {
        const pascal = pascalName(relation.fieldName)
        const meta = RESOURCE_LIBRARY[relation.resource]
        return [
          "  try {",
          `    relacion${pascal}.value = await ${meta.apiFunctions.list}();`,
          "  } catch (requestError) {",
          `    alertaError(mensaxeDoErro(requestError, "No se pudieron cargar los ${meta.label.toLowerCase()} del selector."), "Error al cargar");`,
          "  }",
        ].join("\n")
      }),
      "}",
    )
  }
  if (type === "Detalle") {
    script.push(
      "",
      "function ver(item) {",
      "  // Copia el registro elegido al bloque de detalle del <template>.",
      "  registroDetalle.value = item;",
      "}",
    )
  }
  if (ownStore) {
    script.push(
      "",
      "// Comparte esta selección con otras pantallas a través del store Pinia;",
      "// el botón Compartir de la tabla llama a esta función.",
      "function compartir(item) {",
      `  ${ownStore.variable}.${ownStore.seleccionar}(item);`,
      "}",
    )
  }
  if (hasForm) {
    script.push(
      "",
      "// Devuelve el formulario a sus valores iniciales y sale del modo edición.",
      "function limpiar() {",
      "  Object.assign(registro, initialValues);",
      "  editingId.value = null;",
      "}",
    )
  }
  if (operations.has("edit")) {
    script.push(
      "",
      "// Copia los datos de la fila pulsada al formulario para poder cambiarlos.",
      idField === "_id"
        ? "// editingId toma item._id, el identificador que MongoDB genera para cada documento."
        : `// editingId toma item.${idField}: es el valor que la API real usa para localizar el registro.`,
      "function editar(item) {",
      "  Object.assign(registro, initialValues, item);",
      `  editingId.value = item.${idField};`,
      "}",
    )
  }
  if (hasForm) {
    const createFunction = resourceDetails.apiFunctions.create || `create${singular}`
    const updateFunction = resourceDetails.apiFunctions.edit || `update${singular}`
    const patternedFields = fieldsInForm.filter((field) => field.pattern)
    const guardarBranch = operations.has("edit") && operations.has("create")
      ? `    if (editingId.value) await ${updateFunction}(editingId.value, datos);\n    else await ${createFunction}(datos);`
      : operations.has("edit")
        ? `    await ${updateFunction}(editingId.value, datos);`
        : `    await ${createFunction}(datos);`
    script.push(
      "",
      "// Envía los datos del formulario a la capa API: crea un registro nuevo o guarda",
      "// los cambios del que se está editando. El backend valida de nuevo todas las reglas.",
      "async function guardar() {",
      ...(patternedFields.length ? [
        "  const campoConFormatoInvalido = [",
        ...patternedFields.map((field) =>
          `    { etiqueta: ${js(field.label)}, valor: registro.${field.name}, patron: ${js(field.pattern)}, flags: ${js(field.patternFlags)} },`),
        "  ].find(({ valor, patron, flags }) => {",
        "    if (valor == null || valor === \"\") return false;",
        "    const coincidencia = new RegExp(patron, flags).exec(String(valor));",
        "    return !coincidencia || coincidencia.index !== 0 || coincidencia[0].length !== String(valor).length;",
        "  });",
        "  if (campoConFormatoInvalido) {",
        '    await alertaError(`El campo "${campoConFormatoInvalido.etiqueta}" no cumple el formato indicado.`, "Validación");',
        "    return;",
        "  }",
      ] : []),
      "  saving.value = true;",
      "  try {",
      `    const datos = { ${[
        ...fieldsInForm.map((field) => `${field.name}: registro.${field.name}`),
        ...relations.map((relation) => {
          if (relation.selection === "pinia") {
            const { store, variable } = storeVars.get(relation.fieldName)
            return `${relation.fieldName}: ${variable}.${store.idProp} ?? registro.${relation.fieldName}`
          }
          return `${relation.fieldName}: registro.${relation.fieldName}`
        }),
      ].join(", ")} };`,
      guardarBranch,
      "    limpiar();",
      hasList ? "    await cargar();" : "",
      '    await alertaExito("Registro guardado.");',
      "  } catch (requestError) {",
      '    alertaError(mensaxeDoErro(requestError, "No se pudo guardar el registro."), "Error al guardar");',
      "  } finally {",
      "    saving.value = false;",
      "  }",
      "}",
    )
  }
  if (operations.has("delete")) {
    const deleteFunction = resourceDetails.apiFunctions.delete || `delete${singular}`
    script.push(
      "",
      "// Pide confirmación con la utilidad compartida del proyecto antes de borrar.",
      idField === "_id"
        ? "// Se envía item._id, el identificador del documento en MongoDB."
        : `// Se envía item.${idField}, el identificador real del recurso (no _id).`,
      "async function eliminar(item) {",
      `  const confirmacion = await alertaConfirmacion("¿Quieres borrar este registro de ${plural}?");`,
      "  if (!confirmacion.isConfirmed) return;",
      "  try {",
      `    await ${deleteFunction}(item.${idField});`,
      "    await cargar();",
      '    await alertaExito("Registro eliminado.");',
      "  } catch (requestError) {",
      '    alertaError(mensaxeDoErro(requestError, "No se pudo borrar el registro."), "Error al borrar");',
      "  }",
      "}",
    )
  }
  if (hasList && apiRelations.length) {
    script.push("", "onMounted(() => {", "  cargar();", "  cargarRelaciones();", "});")
  } else if (hasList) {
    script.push("", "onMounted(cargar);")
  } else if (apiRelations.length) {
    script.push("", "onMounted(cargarRelaciones);")
  }
  script.push("</script>", "")
  return `${componentTemplate.filter(Boolean).join("\n")}\n\n${script.filter(Boolean).join("\n")}`
}

function generateStore(config) {
  const { singular } = config.entity
  const { component } = config.screen
  const fields = config.pinia.fields
  const storeId = slugify(singular)
  return `// Dónde va: src/store/${storeId}Store.js
// Qué es: un store de Pinia, el estado compartido entre pantallas. defineStore crea
// un almacén global: cualquier componente que llame a use${singular}Store() lee y
// cambia el mismo estado. Sigue el patrón de src/store/doctorStore.js del proyecto;
// lo genera a petición de ${component}.vue.
import { defineStore } from "pinia";

export const use${singular}Store = defineStore(${js(storeId)}, {
  // El estado guarda el identificador del registro seleccionado y los datos
  // mínimos que se pidieron en el formulario del generador.
  state: () => ({
    id${singular}: null,
${fields.map((field) => `    ${field}: null,`).join("\n")}
  }),
  // Las acciones son funciones que modifican el estado compartido.
  actions: {
    // Copia al store los datos del registro que comparte la pantalla ${component}.
    seleccionar${singular}(registro) {
      this.id${singular} = registro._id ?? null;
${fields.map((field) => `      this.${field} = registro.${field} ?? null;`).join("\n")}
    },
    // Limpia la selección cuando ya no debe estar activa.
    limpiar${singular}() {
      this.id${singular} = null;
${fields.map((field) => `      this.${field} = null;`).join("\n")}
    },
  },
});
`
}

function generateInstructions(config) {
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

- \`backend/modelos/${singular}.js\`: esquema Mongoose (modelo: las reglas y estructura de un documento).${relations.length ? " Incluye los campos de referencia con `ObjectId` y `ref`." : ""}
- \`backend/rutas/${slugify(plural)}.rutas.js\`: router Express (grupo de endpoints HTTP del recurso).${relations.length ? " Incluye `validarRelaciones()`, que comprueba que cada documento relacionado existe." : ""}
- \`src/api/${slugify(plural)}.js\`: funciones Axios (capa que envía peticiones a la API).${listRelations.length ? " El listado admite filtros por relación, por ejemplo `?pacienteId=...`." : ""}
- \`src/components/${component}.vue\`: pantalla Vue con el patrón compatible con ${type}.
${config.pinia.enabled ? `- \`src/store/${slugify(singular)}Store.js\`: store Pinia que comparte la selección de esta pantalla con otras.\n` : ""}- \`configuracion.json\`: respuestas estructuradas que permiten revisar o volver a generar la propuesta.
- \`INSTRUCCIONES.md\`: esta guía de integración.

Una **colección** es el conjunto de documentos de ${plural} en MongoDB. Un **endpoint** es una dirección HTTP, por ejemplo \`${apiPath}\`. El **componente** presenta la interfaz; el modelo y el router implementan la persistencia en backend.
${relations.length ? `
## Relaciones con otras entidades

Cada campo de relación guarda el **ObjectId** del documento relacionado: es una **referencia** (\`ref\` de Mongoose), igual que \`pacienteId\` en \`backend/modelos/Cita.js\`. MongoDB no copia los datos del documento relacionado, solo su identificador.
${relations.map((relation) => {
  const meta = RESOURCE_LIBRARY[relation.resource]
  const escoger = relation.selection === "api"
    ? `un **selector** en el formulario, alimentado con \`GET ${meta.apiPath}\` (\`${meta.apiFunctions.list}\` de \`src/api/${meta.apiFile}\`)`
    : `la **selección compartida** del store \`src/store/${meta.store.file}\` (\`${meta.store.importName}\`), igual que \`Citas.vue\` usa \`pacienteStore.idPaciente\``
  return `- **${escapeHtml(relation.label)}**: campo \`${relation.fieldName}\`, ${relation.required ? "obligatoria" : "opcional"}, se escoge con ${escoger}.${relation.filterable ? ` El listado admite \`GET ${apiPath}?${relation.fieldName}=...\`.` : ""}`
}).join("\n")}

El router generado incluye \`validarRelaciones()\`: antes de crear o editar comprueba con \`Modelo.exists({ _id: ... })\` que cada documento relacionado existe y, si no, responde 400 con un mensaje claro (patrón de \`backend/rutas/citas.rutas.js\`).
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
  return `- **${escapeHtml(relation.label)}** (\`${relation.fieldName}\`): el formulario no muestra selector; envía \`${meta.store.importName.slice(3).replace(/^([A-Z])/, (letter) => letter.toLowerCase())}.${meta.store.idProp}\` al guardar (patrón de \`Citas.vue\`). La selección se establece desde las pantallas que comparten ese store y se limpia con \`${meta.store.limpiar}()\`. Si nadie la estableció, el botón Guardar queda desactivado hasta que se seleccione un registro.`;
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

function getResourceApiDetails(config) {
  if (config.source === "existing" && config.existingResource && RESOURCE_LIBRARY[config.existingResource]) {
    const resourceMeta = RESOURCE_LIBRARY[config.existingResource]
    return {
      modulePath: `../api/${resourceMeta.apiFile}`,
      apiFunctions: resourceMeta.apiFunctions,
      idField: resourceMeta.idField || "_id",
      catalogOnly: Boolean(resourceMeta.catalogOnly),
    }
  }
  return {
    modulePath: `../api/${slugify(config.entity.plural)}.js`,
    apiFunctions: {},
    idField: config.entity.idField || "_id",
    catalogOnly: false,
  }
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

export { slugify }
