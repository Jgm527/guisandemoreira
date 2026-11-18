import { randomUUID } from "node:crypto"
import { access, lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises"
import readline from "node:readline/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { generateFiles, relationRequiredFiles, validateConfiguration } from "./generador.js"
import { RESOURCE_LIBRARY } from "./generador/datos.js"
import { TEXT_PATTERN_PRESETS } from "./public/modules/restricciones.js"

const TOOL_ROOT = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_PROJECT_ROOT = path.resolve(TOOL_ROOT, "..", "..")
const DEFAULT_OUTPUT_ROOT = path.join(TOOL_ROOT, "salidas")
const SCREEN_TYPES = [
  { value: "CRUD", label: "CRUD: formulario y/o listado" },
  { value: "Listado", label: "Listado" },
  { value: "Detalle", label: "Detalle" },
  { value: "Formulario", label: "Formulario" },
  { value: "Relacionado", label: "Relacionado: con relaciones y Pinia" },
]
const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto largo" },
  { value: "email", label: "Correo" },
  { value: "phone", label: "Teléfono" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
  { value: "time", label: "Hora" },
  { value: "boolean", label: "Booleano / casilla" },
  { value: "radio", label: "Radio" },
  { value: "select", label: "Selector fijo" },
]
const OPERATIONS = [
  { value: "list", label: "Listar" },
  { value: "create", label: "Crear" },
  { value: "edit", label: "Editar" },
  { value: "delete", label: "Eliminar" },
]
class UserCancelled extends Error {}
class BackRequested extends Error {}

function writeLine(output, text = "") {
  output.write(`${text}\n`)
}

function createPrompts(rl, output, navigation) {
  async function prompt(signature, askQuestion, parseAnswer) {
    const index = navigation.index
    const saved = navigation.history[index]
    if (saved && saved.signature !== signature) {
      navigation.history.splice(index)
      navigation.target = Math.min(navigation.target, index)
    } else if (saved && index !== navigation.target) {
      navigation.index += 1
      return saved.value
    }

    navigation.suppressOutput = false
    while (true) {
      const answer = (await askQuestion()).trim()
      if (answer === ":q") throw new UserCancelled()
      if (answer === ":atras") throw new BackRequested()
      if (answer === ":adelante") {
        if (saved?.signature === signature) {
          navigation.index += 1
          return saved.value
        }
        writeLine(output, "No hay una respuesta anterior para esta pregunta.")
        continue
      }

      const result = parseAnswer(answer)
      if (result.error) {
        writeLine(output, result.error)
        continue
      }
      navigation.history[index] = { signature, value: result.value }
      navigation.index += 1
      return result.value
    }
  }

  async function ask(label, defaultValue = "", { optional = false } = {}) {
    const signature = JSON.stringify(["ask", label, optional])
    return prompt(signature, () => {
      const suffix = defaultValue === "" ? "" : ` [${defaultValue}]`
      return rl.question(`${label}${suffix}: `)
    }, (answer) => {
      if (answer === "-" && optional) return { value: "" }
      const value = answer || String(defaultValue)
      return value || optional
        ? { value }
        : { error: "Este dato es obligatorio." }
    })
  }

  async function choose(label, choices, defaultValue) {
    const signature = JSON.stringify(["choose", label, choices.map(({ value }) => value)])
    return prompt(signature, async () => {
      writeLine(output, `\n${label}`)
      choices.forEach((choice, index) => writeLine(output, `  ${index + 1}. ${choice.label}`))
      const defaultIndex = choices.findIndex((choice) => choice.value === defaultValue)
      return rl.question(`Elige un número${defaultIndex >= 0 ? ` [${defaultIndex + 1}]` : ""}: `)
    }, (answer) => {
      const defaultIndex = choices.findIndex((choice) => choice.value === defaultValue)
      const index = answer === "" ? defaultIndex : Number(answer) - 1
      return Number.isInteger(index) && index >= 0 && index < choices.length
        ? { value: choices[index].value }
        : { error: "Opción no válida; escribe uno de los números de la lista." }
    })
  }

  async function chooseMany(label, choices, defaultValues = []) {
    const signature = JSON.stringify(["chooseMany", label, choices.map(({ value }) => value)])
    return prompt(signature, async () => {
      writeLine(output, `\n${label}`)
      choices.forEach((choice, index) => {
        const selected = defaultValues.includes(choice.value) ? " (recomendado)" : ""
        writeLine(output, `  ${index + 1}. ${choice.label}${selected}`)
      })
      return rl.question("Elige números separados por comas, o pulsa Enter para usar lo recomendado: ")
    }, (answer) => {
      if (!answer) return { value: [...defaultValues] }
      const indexes = answer.split(",").map((part) => Number(part.trim()) - 1)
      if (indexes.some((index) => !Number.isInteger(index) || index < 0 || index >= choices.length)) {
        return { error: "Una de las opciones no es válida." }
      }
      return { value: [...new Set(indexes)].map((index) => choices[index].value) }
    })
  }

  async function confirm(label, defaultValue = false) {
    const signature = JSON.stringify(["confirm", label])
    return prompt(signature, () => {
      const recommendation = defaultValue ? "S/n" : "s/N"
      return rl.question(`${label} (${recommendation}): `)
    }, (answer) => {
      const normalized = answer.toLowerCase()
      if (!normalized) return { value: defaultValue }
      if (["s", "si", "sí", "y", "yes"].includes(normalized)) return { value: true }
      if (["n", "no"].includes(normalized)) return { value: false }
      return { error: "Responde sí (s) o no (n)." }
    })
  }

  async function count(label, { min, max, defaultValue }) {
    const signature = JSON.stringify(["count", label, min, max])
    return prompt(signature, () => rl.question(`${label} [${defaultValue}]: `), (answer) => {
      const value = Number(answer || defaultValue)
      return Number.isInteger(value) && value >= min && value <= max
        ? { value }
        : { error: `Escribe un número entero entre ${min} y ${max}.` }
    })
  }

  return { ask, choose, chooseMany, confirm, count }
}

async function askField(index, prompts, output, defaults = {}) {
  const { ask, choose, confirm } = prompts
  writeLine(output, `\n--- Campo ${index + 1} ---`)
  const name = await ask("Nombre técnico", defaults.name ?? (index === 0 ? "titulo" : ""))
  const label = await ask("Etiqueta visible", defaults.label ?? (index === 0 ? "Título" : ""))
  const type = await choose("Tipo de dato", FIELD_TYPES, defaults.type ?? "text")
  const required = await confirm("¿Es obligatorio?", defaults.required ?? false)
  const defaultValue = await ask("Valor inicial (deja vacío si no tiene)", defaults.defaultValue ?? "", { optional: true })
  let min = ""
  let max = ""
  let step = ""
  const lengthTypes = ["text", "textarea", "email", "phone"]
  const limitLabels = lengthTypes.includes(type)
    ? ["Longitud mínima (entero, opcional)", "Longitud máxima (entero, opcional)"]
    : type === "number"
      ? ["Valor mínimo (opcional)", "Valor máximo (opcional)"]
      : type === "date"
        ? ["Fecha desde YYYY-MM-DD (opcional)", "Fecha hasta YYYY-MM-DD (opcional)"]
        : type === "time"
          ? ["Hora desde HH:MM (opcional)", "Hora hasta HH:MM (opcional)"]
          : null
  if (limitLabels) {
    min = await ask(limitLabels[0], defaults.min ?? "", { optional: true })
    max = await ask(limitLabels[1], defaults.max ?? "", { optional: true })
  }
  if (type === "number") {
    step = await ask("Incremento numérico (opcional, por ejemplo 0.5)", defaults.step ?? "", { optional: true })
  }

  let pattern = ""
  let patternMessage = ""
  if (lengthTypes.includes(type)) {
    const rule = await choose("Regla de texto", TEXT_PATTERN_PRESETS, "none")
    if (rule === "custom") {
      pattern = await ask("Expresión regular avanzada (sin barras externas, por ejemplo ^[A-Z]{3}$)", defaults.pattern ?? "", { optional: true })
      if (pattern) {
        patternMessage = await ask("Mensaje de error opcional (sin «El campo ...»)", defaults.patternMessage ?? "", { optional: true })
      }
    } else {
      const preset = TEXT_PATTERN_PRESETS.find((item) => item.value === rule)
      pattern = preset.pattern
      patternMessage = preset.message
    }
  }

  let options = ""
  if (["radio", "select"].includes(type)) {
    const lines = await ask("Opciones separadas por punto y coma, en formato valor|etiqueta", defaults.options ?? "", { optional: true })
    options = lines.split(";").map((line) => line.trim()).filter(Boolean).join("\n")
  }
  const form = await confirm("¿Mostrar este campo en el formulario?", defaults.form ?? true)
  const list = await confirm("¿Mostrar este campo en la tabla?", defaults.list ?? index === 0)
  return {
    name,
    label,
    type,
    required,
    defaultValue,
    min,
    max,
    step,
    pattern,
    patternMessage,
    options,
    form,
    list,
    search: false,
  }
}

async function askRelation(index, prompts, output) {
  const { ask, choose, confirm } = prompts
  const resources = Object.entries(RESOURCE_LIBRARY)
    .filter(([, resource]) => !resource.catalogOnly)
    .map(([value, resource]) => ({ value, label: resource.label }))
  writeLine(output, `\n--- Relación ${index + 1} ---`)
  const resource = await choose("Entidad relacionada", resources, "pacientes")
  const meta = RESOURCE_LIBRARY[resource]
  const fieldName = await ask("Nombre del campo de relación", index === 0 ? "paciente" : `relacion${index + 1}`)
  const label = await ask("Etiqueta visible", meta.singular)
  const selections = [
    { value: "api", label: "Selector con la API" },
    ...(meta.store ? [{ value: "pinia", label: "Selección compartida con Pinia" }] : []),
  ]
  const selection = await choose("Cómo se elige el registro", selections, "api")
  const required = await confirm("¿La relación es obligatoria?", false)
  return { resource, fieldName, label, selection, required }
}

async function collectConfiguration(prompts, output) {
  const { ask, choose, chooseMany, confirm, count } = prompts
  writeLine(output, "\n=== 1. Pantalla ===")
  let screenType = await choose("Tipo de pantalla", SCREEN_TYPES, "CRUD")
  const source = await choose("Origen de datos", [
    { value: "new", label: "Crear una entidad nueva" },
    { value: "existing", label: "Reutilizar un recurso existente" },
  ], "new")
  if (source === "existing" && screenType === "Relacionado") {
    writeLine(output, "Las pantallas Relacionadas necesitan una entidad nueva; elige otro tipo para reutilizar un recurso.")
    screenType = await choose(
      "Tipo de pantalla",
      SCREEN_TYPES.filter(({ value }) => value !== "Relacionado"),
      "CRUD"
    )
  }
  const existingResource = source === "existing"
    ? await choose("Recurso del proyecto", Object.entries(RESOURCE_LIBRARY).map(([value, resource]) => ({
        value,
        label: resource.label,
      })), "pacientes")
    : ""
  const screen = {
    type: screenType,
    title: await ask("Nombre visible de la pantalla", "Gestión de tareas"),
    component: await ask("Nombre técnico del componente (PascalCase)", "GestionTareas"),
    route: await ask("Ruta del navegador", "/gestion-tareas"),
    menuLabel: await ask("Texto del menú (opcional)", "Tareas", { optional: true }),
  }

  const entity = source === "existing"
    ? { singular: "", plural: "", apiPath: "", idField: "_id" }
    : {
        singular: "",
        plural: "",
        apiPath: "",
        idField: "_id",
      }
  if (source === "new") {
    writeLine(output, "\n=== 2. Entidad y campos ===")
    entity.singular = await ask("Nombre singular de la entidad (PascalCase)", "Tarea")
    entity.plural = await ask("Nombre plural / colección (minúsculas)", "tareas")
    entity.apiPath = `/api/${entity.plural}`
  }

  const fieldCount = await count("¿Cuántos campos tendrá la pantalla? (1-50)", {
    min: 1,
    max: 50,
    defaultValue: 1,
  })
  const fields = []
  for (let index = 0; index < fieldCount; index += 1) {
    fields.push(await askField(index, prompts, output))
  }

  const supportedOperations = source === "existing"
    ? Object.keys(RESOURCE_LIBRARY[existingResource].apiFunctions)
    : OPERATIONS.map(({ value }) => value)
  const operationChoices = OPERATIONS.filter(({ value }) => supportedOperations.includes(value))
  writeLine(output, "\n=== 3. Operaciones ===")
  const operations = await chooseMany(
    "Selecciona las operaciones (separadas por comas)",
    operationChoices,
    operationChoices.map(({ value }) => value)
  )

  writeLine(output, "\n=== 4. Relaciones y Pinia ===")
  const relationsAllowed = source === "new" && ["CRUD", "Relacionado", "Formulario"].includes(screenType)
  let relations = []
  if (relationsAllowed) {
    const shouldAddRelations = screenType === "Relacionado" || await confirm("¿Quieres añadir relaciones con otras entidades?", false)
    if (shouldAddRelations) {
      const relationCount = await count("¿Cuántas relaciones? (1-5)", {
        min: 1,
        max: 5,
        defaultValue: 1,
      })
      for (let index = 0; index < relationCount; index += 1) {
        relations.push(await askRelation(index, prompts, output))
      }
    }
  }
  const piniaEnabled = await confirm("¿Generar un store Pinia para compartir la selección?", false)
  let piniaFields = []
  if (piniaEnabled) {
    const fieldChoices = fields.map((field) => ({ value: field.name, label: `${field.label} (${field.name})` }))
    piniaFields = await chooseMany("Elige datos mínimos para compartir", fieldChoices, fieldChoices.slice(0, 1).map(({ value }) => value))
  }

  return {
    source,
    existingResource,
    screen,
    entity,
    fields,
    operations,
    relations,
    pinia: { enabled: piniaEnabled, fields: piniaFields },
  }
}

async function checkProjectRequirements(config, projectRoot) {
  const requiredFiles = config.source === "existing"
    ? [...(RESOURCE_LIBRARY[config.existingResource]?.referenceFiles ?? [])]
    : []
  requiredFiles.push(...relationRequiredFiles(config))
  const missing = []
  for (const relativePath of new Set(requiredFiles)) {
    try {
      await access(path.resolve(projectRoot, relativePath))
    } catch (error) {
      if (error.code === "ENOENT") missing.push(relativePath)
      else throw error
    }
  }
  if (missing.length) {
    throw new Error(`Faltan archivos requeridos del proyecto: ${missing.join(", ")}.`)
  }
}

async function findProjectCollisions(files, config, projectRoot) {
  const matches = []
  for (const relativePath of Object.keys(files)) {
    if (!relativePath.startsWith("backend/") && !relativePath.startsWith("src/")) continue
    try {
      await access(path.resolve(projectRoot, relativePath))
      matches.push(relativePath)
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
  }

  try {
    const routerSource = await readFile(path.join(projectRoot, "src", "router", "index.js"), "utf8")
    const routePattern = /\bpath\s*:\s*(["'])(.*?)\1/g
    for (const match of routerSource.matchAll(routePattern)) {
      if (match[2] === config.screen.route) {
        matches.push(`src/router/index.js (ya registra ${config.screen.route})`)
        break
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }

  if (config.source !== "existing") {
    try {
      const backendSource = await readFile(path.join(projectRoot, "backend", "server.js"), "utf8")
      const endpointPattern = /\bapp\.(?:use|get|post|put|delete)\s*\(\s*(["'`])([^"'`]+)\1/g
      for (const match of backendSource.matchAll(endpointPattern)) {
        const currentPath = match[2].replace(/\/+$/, "")
        const proposedPath = config.entity.apiPath.replace(/\/+$/, "")
        if (currentPath === proposedPath ||
            currentPath.startsWith(`${proposedPath}/`) ||
            proposedPath.startsWith(`${currentPath}/`)) {
          matches.push(`backend/server.js (la ruta ${proposedPath} se solapa con ${currentPath})`)
          break
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
  }
  return matches
}

async function writeGeneratedFiles(files, outputSlug, outputRoot, prompts, output) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(outputSlug) || outputSlug.length > 60) {
    throw new Error("El nombre de salida calculado no es seguro.")
  }
  await mkdir(outputRoot, { recursive: true })
  const outputInfo = await lstat(outputRoot)
  if (!outputInfo.isDirectory() || outputInfo.isSymbolicLink()) {
    throw new Error("La carpeta de salida debe ser una carpeta normal, no un enlace simbólico.")
  }
  const target = path.resolve(outputRoot, outputSlug)
  if (path.dirname(target) !== path.resolve(outputRoot)) {
    throw new Error("La carpeta de salida queda fuera de salidas.")
  }
  let exists = false
  try {
    const targetInfo = await lstat(target)
    if (!targetInfo.isDirectory() || targetInfo.isSymbolicLink()) {
      throw new Error("La salida existente no es una carpeta segura; no se modificó.")
    }
    exists = true
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }
  if (exists && !(await prompts.confirm(`Ya existe ${path.relative(path.dirname(outputRoot), target)}. ¿Quieres reemplazar solo esa carpeta?`, false))) {
    writeLine(output, "Generación cancelada; no se modificó ningún archivo.")
    return false
  }

  const temporary = await mkdtemp(path.join(outputRoot, `.generador-${randomUUID()}-`))
  const backup = `${target}.backup-${randomUUID()}`
  let movedExisting = false
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const destination = path.resolve(temporary, relativePath)
      if (!destination.startsWith(`${temporary}${path.sep}`)) {
        throw new Error("Un archivo generado intenta salir de la carpeta temporal.")
      }
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, contents, { encoding: "utf8", flag: "wx" })
    }
    if (exists) {
      await rename(target, backup)
      movedExisting = true
    }
    await rename(temporary, target)
    if (movedExisting) await rm(backup, { recursive: true, force: false })
    return true
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    if (movedExisting) {
      try {
        await rename(backup, target)
      } catch (restoreError) {
        throw new Error(`No se pudo completar la generación (${error.message}) ni restaurar la salida anterior (${backup}): ${restoreError.message}`, { cause: restoreError })
      }
    }
    throw error
  }
}

export async function runTerminal({
  input = process.stdin,
  output = process.stdout,
  projectRoot = DEFAULT_PROJECT_ROOT,
  outputRoot = DEFAULT_OUTPUT_ROOT,
  promptOverrides = null,
} = {}) {
  const rl = promptOverrides ? null : readline.createInterface({ input, output })
  const navigation = { history: [], index: 0, target: 0, configEnd: 0, suppressOutput: false }
  const wizardOutput = {
    write(text) {
      if (!navigation.suppressOutput) output.write(text)
      return true
    },
  }
  const prompts = promptOverrides ?? createPrompts(rl, wizardOutput, navigation)
  try {
    writeLine(output, "Generador de componentes — modo terminal")
    writeLine(output, "Pulsa Enter para aceptar el valor recomendado; usa :atras/:adelante para navegar y :q para cancelar.")
    while (true) {
      try {
        navigation.index = 0
        navigation.configEnd = Number.POSITIVE_INFINITY
        navigation.suppressOutput = navigation.history.length > 0 && navigation.target < navigation.history.length
        let config
        while (true) {
          const inputConfig = await collectConfiguration(prompts, wizardOutput)
          navigation.configEnd = navigation.index
          const result = validateConfiguration(inputConfig)
          if (!result.errors.length) {
            config = result.config
            break
          }
          writeLine(output, "\nHay que corregir estos datos antes de generar:")
          result.errors.forEach((error) => writeLine(output, `  - ${error}`))
          const retry = await prompts.confirm("¿Volver a empezar el asistente?", true)
          if (!retry) {
            writeLine(output, "Generación cancelada.")
            return false
          }
          navigation.history.length = 0
          navigation.index = 0
          navigation.target = 0
          navigation.suppressOutput = false
        }

        const generated = generateFiles(config)
        await checkProjectRequirements(generated.config, projectRoot)
        const collisions = await findProjectCollisions(generated.files, generated.config, projectRoot)
        if (collisions.length) {
          writeLine(output, "\nNo se generó nada porque estos archivos o rutas ya existen:")
          collisions.forEach((collision) => writeLine(output, `  - ${collision}`))
          writeLine(output, "Cambia el nombre técnico o la ruta y vuelve a intentarlo.")
          return false
        }

        const outputSlug = generated.outputSlug
        writeLine(output, "\n=== Revisión ===")
        writeLine(output, `Pantalla: ${config.screen.title} (${config.screen.component}.vue)`)
        writeLine(output, `Ruta: ${config.screen.route}`)
        writeLine(output, `Archivos: ${Object.keys(generated.files).join(", ")}`)
        writeLine(output, `Salida: ${path.relative(projectRoot, path.join(outputRoot, outputSlug)).split(path.sep).join("/")}`)
        if (!(await prompts.confirm("¿Generar estos archivos?", true))) {
          writeLine(output, "Generación cancelada; no se modificó ningún archivo.")
          return false
        }
        const written = await writeGeneratedFiles(generated.files, outputSlug, outputRoot, prompts, output)
        if (!written) return false
        writeLine(output, `\nGeneración completada en ${path.relative(projectRoot, path.join(outputRoot, outputSlug)).split(path.sep).join("/")}`)
        writeLine(output, "Sigue INSTRUCCIONES.md para integrar los archivos en el proyecto.")
        return true
      } catch (error) {
        if (!(error instanceof BackRequested)) throw error
        if (navigation.index >= navigation.configEnd) navigation.history.splice(navigation.index)
        if (navigation.index === 0) writeLine(output, "Ya estás en la primera pregunta.")
        navigation.target = Math.max(0, navigation.index - 1)
      }
    }
  } catch (error) {
    if (error instanceof UserCancelled || error.name === "AbortError" || error.code === "ERR_USE_AFTER_CLOSE") {
      writeLine(output, "\nGeneración cancelada por la persona usuaria.")
      return false
    }
    throw error
  } finally {
    rl?.close()
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  runTerminal().catch((error) => {
    console.error(`No se pudo generar la pantalla: ${error.message}`)
    process.exitCode = 1
  })
}
