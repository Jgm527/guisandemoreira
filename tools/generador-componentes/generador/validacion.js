import {
  FIELD_TYPES,
  OPERATIONS,
  RELATION_SELECTIONS,
  RELATION_SCREEN_TYPES,
  RESOURCE_LIBRARY,
  SCREEN_TYPES,
  isValidDate,
  isValidIdentifier,
  isValidPascalCase,
  js,
  matchesPattern,
  parseOptions,
  parsePattern,
} from "./datos.js"

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
    ? [...new Set(input.operations.map(String).filter((operation) => operation !== "search"))]
    : []
  if (Array.isArray(input.operations) && input.operations.includes("search") && !input.operations.includes("list")) {
    errors.push("La opción de búsqueda ha sido retirada; añade la operación listar para mostrar todos los registros.")
  }
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
      operations.some((operation) => operation !== "list")) {
    errors.push("Las pantallas de tipo Detalle solo muestran registros: elige listar, sin crear, editar ni borrar.")
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
      errors.push(`${prefix}: el campo que guarda la relación debe empezar en minúscula y usar solo letras y números (por ejemplo, pacienteDNI).`)
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
