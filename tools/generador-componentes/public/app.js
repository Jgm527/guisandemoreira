const form = document.querySelector("#generator-form")
const panels = [...document.querySelectorAll("[data-step]")]
const stepLinks = [...document.querySelectorAll("[data-step-link]")]
const fieldsList = document.querySelector("#fields-list")
const fieldTemplate = document.querySelector("#field-template")
const validationMessage = document.querySelector("#validation-message")
const previewMessage = document.querySelector("#preview-message")
const previewSummary = document.querySelector("#preview-summary")
const generationErrors = document.querySelector("#generation-errors")
const generateButton = document.querySelector("#generate-button")
const generatedResult = document.querySelector("#generated-result")
const generatedFiles = document.querySelector("#generated-files")
let currentStep = 0
let currentPreview = null
let generatedTextFiles = []

function showStep(index) {
  currentStep = index
  for (const [panelIndex, panel] of panels.entries()) {
    panel.hidden = panelIndex !== index
  }
  for (const [linkIndex, link] of stepLinks.entries()) {
    link.classList.toggle("is-active", linkIndex === index)
    link.classList.toggle("is-complete", linkIndex < index)
    if (linkIndex === index) link.setAttribute("aria-current", "step")
    else link.removeAttribute("aria-current")
  }
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function addField(field = {}) {
  const fragment = fieldTemplate.content.cloneNode(true)
  const card = fragment.querySelector(".field-card")
  const controls = [...card.querySelectorAll("[data-property]")]
  for (const control of controls) {
    const property = control.dataset.property
    if (control.type === "checkbox") control.checked = field[property] ?? control.checked
    else if (field[property] != null) {
      control.value = Array.isArray(field[property])
        ? field[property].map((option) => `${option.value}|${option.label}`).join("\n")
        : field[property]
    }
  }
  const typeControl = card.querySelector('[data-property="type"]')
  const optionsField = card.querySelector(".options-field")
  const title = card.querySelector("legend")
  let previousType = typeControl.value

  function updateFieldType() {
    const selectedType = typeControl.value
    const rangeKind = (type) => ["text", "textarea", "email", "phone"].includes(type)
      ? "length"
      : type === "number" ? "number" : type === "date" ? "date" : ""
    const patternSupported = !["boolean", "radio", "select"].includes(selectedType)
    const optionsSupported = ["radio", "select"].includes(selectedType)
    optionsField.hidden = !["radio", "select"].includes(selectedType)
    const minControl = card.querySelector('[data-property="min"]')
    const maxControl = card.querySelector('[data-property="max"]')
    const patternControl = card.querySelector('[data-property="pattern"]')
    const optionsControl = card.querySelector('[data-property="options"]')
    minControl.disabled = !rangeKind(selectedType)
    maxControl.disabled = !rangeKind(selectedType)
    patternControl.disabled = !patternSupported
    if (rangeKind(previousType) !== rangeKind(selectedType)) {
      minControl.value = ""
      maxControl.value = ""
    }
    if (!patternSupported) patternControl.value = ""
    if (!optionsSupported) optionsControl.value = ""
    previousType = selectedType
    title.textContent = card.querySelector('[data-property="label"]').value.trim() || "Campo nuevo"
  }

  typeControl.addEventListener("change", updateFieldType)
  card.querySelector('[data-property="label"]').addEventListener("input", updateFieldType)
  card.querySelector(".remove-field").addEventListener("click", () => card.remove())
  fieldsList.append(card)
  updateFieldType()
}

function formConfig() {
  const value = (name) => form.elements.namedItem(name).value.trim()
  const fields = [...fieldsList.querySelectorAll(".field-card")].map((card) => {
    const field = {}
    for (const control of card.querySelectorAll("[data-property]")) {
      const property = control.dataset.property
      field[property] = control.type === "checkbox" ? control.checked : control.value.trim()
    }
    return field
  })
  return {
    screen: {
      type: value("screenType"),
      title: value("screenTitle"),
      component: value("screenComponent"),
      route: value("screenRoute"),
      menuLabel: value("menuLabel"),
    },
    entity: {
      singular: value("entitySingular"),
      plural: value("entityPlural"),
      apiPath: value("apiPath"),
      idField: "_id",
    },
    fields,
    operations: [...form.querySelectorAll('[name="operation"]:checked')].map((input) => input.value),
  }
}

async function postJson(endpoint, data) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const result = await response.json()
  if (!response.ok) {
    const error = new Error(result.message || "La solicitud no se pudo completar.")
    error.details = result.errors || result.collisions || []
    error.status = response.status
    error.overwriteRequired = result.overwriteRequired === true
    throw error
  }
  return result
}

function showNotice(element, message, kind = "info", details = []) {
  element.hidden = false
  element.className = `notice notice-${kind}`
  element.replaceChildren()
  const paragraph = document.createElement("p")
  paragraph.textContent = message
  element.append(paragraph)
  if (details.length) {
    const list = document.createElement("ul")
    for (const detail of details) {
      const item = document.createElement("li")
      item.textContent = detail
      list.append(item)
    }
    element.append(list)
  }
}

function clearNotice(element) {
  element.hidden = true
  element.replaceChildren()
}

function renderPreview(preview) {
  previewSummary.replaceChildren()
  const summaryItems = [
    ["Pantalla", `${formConfig().screen.title} → ${formConfig().screen.component}.vue`],
    ["Ruta de navegador", formConfig().screen.route],
    ["Colección", `${formConfig().entity.plural} (identificador _id)`],
    ["Ruta REST", formConfig().entity.apiPath],
    ["Carpeta que se escribirá", preview.outputPath],
  ]
  for (const [label, value] of summaryItems) {
    const paragraph = document.createElement("p")
    const strong = document.createElement("strong")
    strong.textContent = `${label}: `
    paragraph.append(strong, document.createTextNode(value))
    previewSummary.append(paragraph)
  }
  const fileList = document.createElement("ul")
  fileList.className = "preview-files"
  for (const file of preview.files) {
    const item = document.createElement("li")
    item.textContent = file
    fileList.append(item)
  }
  previewSummary.append(fileList)

  if (preview.collisions.length) {
    showNotice(
      previewMessage,
      "Se detectaron archivos existentes en el proyecto. La reutilización aún no está disponible; cambia los nombres para evitar generar un duplicado.",
      "error",
      preview.collisions
    )
    generateButton.disabled = true
  } else if (preview.exists) {
    showNotice(previewMessage, `La carpeta ${preview.outputPath} ya existe. Al continuar se reemplazará su contenido.`, "warning")
    generateButton.disabled = false
  } else {
    showNotice(previewMessage, "La ruta está disponible y no se detectaron colisiones con archivos del proyecto.", "success")
    generateButton.disabled = false
  }
}

async function refreshPreview() {
  currentPreview = null
  clearNotice(validationMessage)
  clearNotice(previewMessage)
  clearNotice(generationErrors)
  generatedResult.hidden = true
  generateButton.disabled = true
  try {
    currentPreview = await postJson("/api/preview", formConfig())
    renderPreview(currentPreview)
    return currentPreview.collisions.length === 0
  } catch (error) {
    showNotice(validationMessage, error.message, "error", error.details)
    showStep(2)
    return false
  }
}

function validateVisibleStep() {
  const visiblePanel = panels[currentStep]
  for (const control of visiblePanel.querySelectorAll("input, select, textarea")) {
    if (!control.disabled && !control.checkValidity()) {
      control.reportValidity()
      return false
    }
  }
  return true
}

async function advance() {
  clearNotice(validationMessage)
  if (!validateVisibleStep()) return
  if (currentStep === 2) {
    const isValid = await refreshPreview()
    if (currentPreview) showStep(3)
    if (!isValid) return
    return
  }
  showStep(Math.min(currentStep + 1, panels.length - 1))
}

function setFormValue(name, value) {
  const control = form.elements.namedItem(name)
  if (control) control.value = value ?? ""
}

function validateScreenRoute() {
  const control = form.elements.namedItem("screenRoute")
  const route = control.value.trim()
  const isValid = /^\/[a-zA-Z0-9/_-]*$/.test(route) && !route.includes("//")
  control.setCustomValidity(isValid ? "" : "Usa una ruta que empiece por / y contenga solo letras, números, /, _ o -.")
}

function loadConfiguration(config) {
  if (!config || config.version !== 1 || !config.screen || !config.entity) {
    throw new Error("El archivo no tiene el formato de configuración v1 del generador.")
  }
  setFormValue("screenType", config.screen.type)
  setFormValue("screenTitle", config.screen.title)
  setFormValue("screenComponent", config.screen.component)
  setFormValue("screenRoute", config.screen.route)
  validateScreenRoute()
  setFormValue("menuLabel", config.screen.menuLabel)
  setFormValue("entitySingular", config.entity.singular)
  setFormValue("entityPlural", config.entity.plural)
  setFormValue("apiPath", config.entity.apiPath)
  fieldsList.replaceChildren()
  for (const field of config.fields || []) addField(field)
  for (const input of form.querySelectorAll('[name="operation"]')) {
    input.checked = (config.operations || []).includes(input.value)
  }
  clearNotice(generationErrors)
  generatedResult.hidden = true
  currentPreview = null
  showStep(0)
  showNotice(previewMessage, "Configuración cargada. Revisa los pasos antes de volver a generar.", "info")
}

function renderGeneratedFiles(files, outputPath) {
  generatedFiles.replaceChildren()
  generatedTextFiles = files
  document.querySelector("#result-path").textContent = outputPath
  document.querySelector("#result-note").textContent =
    "Estos bloques contienen exactamente los archivos guardados en la carpeta de salida. Usa Copiar en un archivo o el botón para copiarlos todos."

  for (const file of files) {
    const details = document.createElement("details")
    details.className = "generated-file"
    const summary = document.createElement("summary")
    const name = document.createElement("span")
    name.textContent = file.path
    const copyButton = document.createElement("button")
    copyButton.type = "button"
    copyButton.className = "copy-file"
    copyButton.textContent = "Copiar"
    copyButton.addEventListener("click", async (event) => {
      event.preventDefault()
      event.stopPropagation()
      await copyText(file.contents, copyButton)
    })
    summary.append(name, copyButton)
    const code = document.createElement("pre")
    const codeText = document.createElement("code")
    codeText.textContent = file.contents
    code.append(codeText)
    details.append(summary, code)
    generatedFiles.append(details)
  }
  generatedResult.hidden = false
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text)
    const oldText = button.textContent
    button.textContent = "Copiado"
    window.setTimeout(() => { button.textContent = oldText }, 1600)
  } catch (error) {
    showNotice(generationErrors, `No se pudo copiar al portapapeles: ${error.message}. Selecciona y copia el contenido del bloque.`, "error")
  }
}

async function generate() {
  if (!currentPreview) {
    const valid = await refreshPreview()
    if (!valid) return
  }

  let overwriteConfirmed = false
  if (currentPreview.exists) {
    overwriteConfirmed = window.confirm(
      `Ya existe ${currentPreview.outputPath}.\n\nSe reemplazará únicamente esa carpeta de salida. ¿Quieres continuar?`
    )
    if (!overwriteConfirmed) return
  }

  generateButton.disabled = true
  generateButton.textContent = "Generando..."
  clearNotice(generationErrors)
  try {
    const result = await postJson("/api/generate", {
      ...formConfig(),
      overwriteConfirmed,
    })
    renderGeneratedFiles(result.files, result.outputPath)
    currentPreview = { ...currentPreview, exists: true }
    showNotice(previewMessage, `Generación completada: ${result.files.length} archivos guardados.`, "success")
  } catch (error) {
    showNotice(generationErrors, error.message, "error", error.details)
    if (error.overwriteRequired) currentPreview = await postJson("/api/preview", formConfig())
  } finally {
    generateButton.disabled = Boolean(currentPreview?.collisions.length)
    generateButton.textContent = "Generar archivos"
  }
}

document.querySelector("#add-field").addEventListener("click", () => addField())
document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", advance))
document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showStep(Math.max(currentStep - 1, 0))))
stepLinks.forEach((button) => button.addEventListener("click", () => {
  const nextStep = Number(button.dataset.stepLink)
  if (nextStep <= currentStep) showStep(nextStep)
}))
generateButton.addEventListener("click", generate)
document.querySelector("#copy-all").addEventListener("click", async (event) => {
  const content = generatedTextFiles
    .map((file) => `===== ${file.path} =====\n${file.contents}`)
    .join("\n\n")
  await copyText(content, event.currentTarget)
})
document.querySelector("#load-config-button").addEventListener("click", () => {
  document.querySelector("#load-config-input").click()
})
document.querySelector("#load-config-input").addEventListener("change", async (event) => {
  const file = event.currentTarget.files?.[0]
  if (!file) return
  try {
    loadConfiguration(JSON.parse(await file.text()))
    showNotice(previewMessage, `Se cargó ${file.name}. Comprueba los campos y las operaciones antes de generar.`, "success")
  } catch (error) {
    showNotice(generationErrors, `No se pudo cargar la configuración: ${error.message}`, "error")
  } finally {
    event.currentTarget.value = ""
  }
})

document.querySelector("#generator-form").addEventListener("submit", (event) => event.preventDefault())
form.elements.namedItem("screenRoute").addEventListener("input", validateScreenRoute)
validateScreenRoute()

async function loadProjectStatus() {
  const notice = document.querySelector("#resource-notice")
  try {
    const response = await fetch("/api/status")
    if (!response.ok) throw new Error(`El servidor respondió con HTTP ${response.status}.`)
    const status = await response.json()
    notice.replaceChildren()
    const lead = document.createElement("p")
    lead.textContent = "Patrones y recursos localizados (solo lectura):"
    const list = document.createElement("ul")
    for (const resource of status.resources) {
      const item = document.createElement("li")
      item.textContent = `${resource.name}: ${resource.files.join(", ")}`
      list.append(item)
    }
    notice.append(lead, list)
    const limitation = document.createElement("p")
    limitation.textContent = "La reutilización de recursos existentes se añadirá en una fase posterior. Si algún archivo generado coincide con uno existente, la herramienta cancelará la generación."
    notice.append(limitation)
    if (status.outputs.length) {
      const outputs = document.createElement("p")
      outputs.textContent = `Salidas previas disponibles: ${status.outputs.join(", ")}.`
      notice.append(outputs)
    }
  } catch (error) {
    showNotice(notice, `No se pudo revisar el proyecto: ${error.message}`, "error")
  }
}

addField({
  name: "titulo",
  label: "Título",
  type: "text",
  required: true,
  form: true,
  list: true,
  search: true,
  max: "80",
})
loadProjectStatus()
