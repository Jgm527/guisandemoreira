import { postJson } from "./modules/api.js"
import { createUi } from "./modules/ui.js"

const form = document.querySelector("#generator-form")
const panels = [...document.querySelectorAll("[data-step]")]
const stepLinks = [...document.querySelectorAll("[data-step-link]")]
const fieldsList = document.querySelector("#fields-list")
const fieldTemplate = document.querySelector("#field-template")
const relationsList = document.querySelector("#relations-list")
const relationTemplate = document.querySelector("#relation-template")
const piniaEnabled = document.querySelector("#pinia-enabled")
const piniaFields = document.querySelector("#pinia-fields")
const piniaHint = document.querySelector("#pinia-hint")
const validationMessage = document.querySelector("#validation-message")
const generateButton = document.querySelector("#generate-button")
let currentStep = 0
let currentPreview = null

const ui = createUi(formConfig)
const {
  clearNotice,
  generationErrors,
  previewMessage,
  renderGeneratedFiles,
  renderPreview,
  showNotice,
} = ui

// Resumen de los recursos reutilizables en relaciones; se usa solo para las
// pistas del formulario, la validación definitiva vive en el servidor.
const RELATION_RESOURCE_INFO = {
  pacientes: { label: "Pacientes", hasStore: true },
  doctores: { label: "Doctores", hasStore: true },
  citas: { label: "Citas", hasStore: false },
}

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

function addRelation(relation = {}) {
  const fragment = relationTemplate.content.cloneNode(true)
  const card = fragment.querySelector(".field-card")
  for (const control of card.querySelectorAll("[data-property]")) {
    const property = control.dataset.property
    if (property === "selection-hint") continue
    if (control.type === "checkbox") control.checked = Boolean(relation[property])
    else if (relation[property] != null) control.value = relation[property]
  }
  const selectionControl = card.querySelector('[data-property="selection"]')
  const resourceControl = card.querySelector('[data-property="resource"]')
  const hint = card.querySelector('[data-property="selection-hint"]')

  function updateSelectionHint() {
    const info = RELATION_RESOURCE_INFO[resourceControl.value]
    if (info && !info.hasStore && selectionControl.value === "pinia") {
      hint.textContent = `${info.label} no tiene store de Pinia en este proyecto: elige el selector de la API.`
    } else if (selectionControl.value === "pinia") {
      hint.textContent = "El formulario enviará la selección que comparten pantallas como XestionPacientes o XestionDoctores (patrón de Citas.vue)."
    } else {
      hint.textContent = "El selector carga la lista real del recurso; el modo Pinia usa el store que ya existe en el proyecto."
    }
  }

  selectionControl.addEventListener("change", updateSelectionHint)
  resourceControl.addEventListener("change", updateSelectionHint)
  card.querySelector(".remove-field").addEventListener("click", () => card.remove())
  relationsList.append(card)
  updateSelectionHint()
}

function syncPiniaSection() {
  piniaFields.hidden = !piniaEnabled.checked
  piniaHint.hidden = !piniaEnabled.checked
}

function renderPiniaFields(savedFields = []) {
  const names = [...fieldsList.querySelectorAll(".field-card")]
    .map((card) => card.querySelector('[data-property="name"]')?.value.trim())
    .filter(Boolean)
  piniaFields.replaceChildren()
  for (const name of names) {
    const label = document.createElement("label")
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.dataset.fieldName = name
    checkbox.checked = savedFields.includes(name)
    label.append(checkbox, document.createTextNode(` ${name}`))
    piniaFields.append(label)
  }
}

function refreshPiniaFields() {
  const current = [...piniaFields.querySelectorAll("input:checked")].map((input) => input.dataset.fieldName)
  renderPiniaFields(current)
}

function formConfig() {
  const value = (name) => form.elements.namedItem(name).value.trim()
  const source = form.elements.namedItem("source").value
  const fields = [...fieldsList.querySelectorAll(".field-card")].map((card) => {
    const field = {}
    for (const control of card.querySelectorAll("[data-property]")) {
      const property = control.dataset.property
      field[property] = control.type === "checkbox" ? control.checked : control.value.trim()
    }
    return field
  })
  return {
    source,
    existingResource: form.elements.namedItem("existingResource").value,
    screen: {
      type: value("screenType"),
      title: value("screenTitle"),
      component: value("screenComponent"),
      route: value("screenRoute"),
      menuLabel: value("menuLabel"),
    },
    // Con un recurso existente no se envían nombres ni ruta de API: los aporta
    // el propio recurso en el servidor. Enviar los valores por defecto del
    // formulario hacía creer que había un conflicto de rutas que no existía.
    entity: source === "existing"
      ? { singular: "", plural: "", apiPath: "", idField: "_id" }
      : {
          singular: value("entitySingular"),
          plural: value("entityPlural"),
          apiPath: value("apiPath"),
          idField: "_id",
        },
    fields,
    operations: [...form.querySelectorAll('[name="operation"]:checked')].map((input) => input.value),
    relations: [...relationsList.querySelectorAll(".field-card")].map((card) => {
      const relation = {}
      for (const control of card.querySelectorAll("[data-property]")) {
        const property = control.dataset.property
        if (property === "selection-hint") continue
        relation[property] = control.type === "checkbox" ? control.checked : control.value.trim()
      }
      return relation
    }),
    pinia: {
      enabled: piniaEnabled.checked,
      fields: [...piniaFields.querySelectorAll("input:checked")].map((input) => input.dataset.fieldName),
    },
  }
}

async function refreshPreview() {
  currentPreview = null
  clearNotice(validationMessage)
  clearNotice(previewMessage)
  clearNotice(generationErrors)
  ui.clearGeneratedResult()
  generateButton.disabled = true
  try {
    currentPreview = await postJson("/api/preview", formConfig())
    renderPreview(currentPreview)
    return currentPreview.collisions.length === 0
  } catch (error) {
    showNotice(validationMessage, error.message, "error", error.details)
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
  refreshPiniaFields()
  if (currentStep === 3) {
    const isValid = await refreshPreview()
    if (currentPreview) showStep(4)
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

function syncSourceSelection() {
  const sourceValue = form.elements.namedItem("source").value
  const existingResourceField = document.querySelector("#existing-resource-field")
  const resourceControl = form.elements.namedItem("existingResource")
  const shouldShow = sourceValue === "existing"
  existingResourceField.hidden = !shouldShow
  resourceControl.disabled = !shouldShow
  if (!shouldShow) resourceControl.value = ""
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
  setFormValue("source", config.source || "new")
  setFormValue("existingResource", config.existingResource || "")
  setFormValue("entitySingular", config.entity.singular)
  setFormValue("entityPlural", config.entity.plural)
  setFormValue("apiPath", config.entity.apiPath)
  fieldsList.replaceChildren()
  for (const field of config.fields || []) addField(field)
  relationsList.replaceChildren()
  for (const relation of config.relations || []) addRelation(relation)
  piniaEnabled.checked = Boolean(config.pinia?.enabled)
  renderPiniaFields(config.pinia?.fields || [])
  syncPiniaSection()
  for (const input of form.querySelectorAll('[name="operation"]')) {
    input.checked = (config.operations || []).includes(input.value)
  }
  clearNotice(generationErrors)
  ui.clearGeneratedResult()
  currentPreview = null
  syncSourceSelection()
  showStep(0)
  showNotice(previewMessage, "Configuración cargada. Revisa los pasos antes de volver a generar.", "info")
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
document.querySelector("#add-relation").addEventListener("click", () => addRelation())
piniaEnabled.addEventListener("change", syncPiniaSection)
document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", advance))
document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showStep(Math.max(currentStep - 1, 0))))
stepLinks.forEach((button) => button.addEventListener("click", () => {
  const nextStep = Number(button.dataset.stepLink)
  if (nextStep <= currentStep) showStep(nextStep)
}))
generateButton.addEventListener("click", generate)
document.querySelector("#copy-all").addEventListener("click", async (event) => {
  await ui.copyAll(event.currentTarget)
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
form.elements.namedItem("source").addEventListener("change", syncSourceSelection)
validateScreenRoute()
syncSourceSelection()

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
ui.loadProjectStatus()
