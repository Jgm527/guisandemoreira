import test from "node:test"
import assert from "node:assert/strict"
import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc"
import { generateFiles, validateConfiguration } from "../generador.js"

function validConfiguration() {
  return {
    screen: {
      type: "CRUD",
      title: "Gestión de tareas",
      component: "GestionTareas",
      route: "/gestion-tareas",
      menuLabel: "Tareas",
    },
    entity: {
      singular: "Tarea",
      plural: "tareas",
      apiPath: "/api/tareas",
      idField: "_id",
    },
    fields: [
      {
        name: "titulo",
        label: "Título",
        type: "text",
        required: true,
        defaultValue: "",
        min: "",
        max: "80",
        pattern: "",
        options: "",
        form: true,
        list: true,
        search: true,
      },
    ],
    operations: ["list", "create", "edit", "delete", "search"],
  }
}

test("genera las piezas CRUD y una ruta de salida segura", () => {
  const generated = generateFiles(validConfiguration())
  assert.equal(generated.outputSlug, "gestion-tareas")
  assert.deepEqual(Object.keys(generated.files).sort(), [
    "INSTRUCCIONES.md",
    "backend/modelos/Tarea.js",
    "backend/rutas/tareas.rutas.js",
    "configuracion.json",
    "src/api/tareas.js",
    "src/components/GestionTareas.vue",
  ])
  assert.match(generated.files["backend/modelos/Tarea.js"], /collection: "tareas"/)
  assert.match(generated.files["backend/rutas/tareas.rutas.js"], /findByIdAndUpdate/)
  assert.match(generated.files["src/api/tareas.js"], /encodeURIComponent\(id\)/)
  assert.match(generated.files["src/components/GestionTareas.vue"], /titulo: registro\.titulo/)
  assert.match(generated.files["src/components/GestionTareas.vue"], /:key="registroActual\._id"/)
  assert.match(generated.files["INSTRUCCIONES.md"], /backend\/server\.js/)
})

test("rechaza configuraciones que podrían generar rutas inconsistentes", () => {
  const config = validConfiguration()
  config.entity.apiPath = "/api/../../src"
  config.operations = ["search"]
  const { errors } = validateConfiguration(config)
  assert.ok(errors.some((error) => error.includes("ruta REST")))
  assert.ok(errors.some((error) => error.includes("listar")))
})

test("valida opciones, campos repetidos y expresiones regulares", () => {
  const config = validConfiguration()
  config.fields.push({
    name: "titulo",
    label: "Estado",
    type: "select",
    required: false,
    pattern: "[",
    options: "",
    form: true,
    list: false,
    search: false,
  })
  const { errors } = validateConfiguration(config)
  assert.ok(errors.some((error) => error.includes("está repetido")))
  assert.ok(errors.some((error) => error.includes("opciones")))
  assert.ok(errors.some((error) => error.includes("expresión regular")))
})

test("puede generar solo listado sin crear endpoints de escritura", () => {
  const config = validConfiguration()
  config.operations = ["list"]
  config.fields[0].form = false
  config.fields[0].search = false
  const generated = generateFiles(config)
  assert.match(generated.files["backend/rutas/tareas.rutas.js"], /router\.get/)
  assert.doesNotMatch(generated.files["backend/rutas/tareas.rutas.js"], /router\.post|router\.put|router\.delete/)
  assert.doesNotMatch(generated.files["src/components/GestionTareas.vue"], /<form/)
})

test("el componente Vue generado se puede analizar y compilar", () => {
  const generated = generateFiles(validConfiguration())
  const filename = "GestionTareas.vue"
  const source = generated.files[`src/components/${filename}`]
  const parsed = parse(source, { filename })
  assert.deepEqual(parsed.errors, [])
  assert.doesNotThrow(() => compileScript(parsed.descriptor, { id: "generator-test" }))
  const template = compileTemplate({
    source: parsed.descriptor.template.content,
    filename,
    id: "generator-test",
  })
  assert.deepEqual(template.errors, [])
})

test("genera controles y validaciones para los tipos de campo admitidos", () => {
  const config = validConfiguration()
  config.fields = [
    { name: "correo", label: "Correo", type: "email", required: true, form: true, list: true, search: true },
    { name: "cantidad", label: "Cantidad", type: "number", min: "1", max: "5", defaultValue: "2", form: true, list: true, search: true },
    { name: "activo", label: "Activo", type: "boolean", defaultValue: "false", form: true, list: true, search: false },
    { name: "estado", label: "Estado", type: "select", options: "pendiente|Pendiente\nhecha|Hecha", defaultValue: "pendiente", form: true, list: true, search: true },
    { name: "descripcion", label: "Descripción", type: "textarea", min: "2", max: "100", pattern: "^[A-Za-z ]+$", form: true, list: true, search: false },
  ]
  const generated = generateFiles(config)
  const filename = "GestionTareas.vue"
  const source = generated.files[`src/components/${filename}`]
  const parsed = parse(source, { filename })
  assert.deepEqual(parsed.errors, [])
  assert.doesNotThrow(() => compileScript(parsed.descriptor, { id: "generator-field-types" }))
  const template = compileTemplate({
    source: parsed.descriptor.template.content,
    filename,
    id: "generator-field-types",
  })
  assert.deepEqual(template.errors, [])
  const model = generated.files["backend/modelos/Tarea.js"]
  assert.match(model, /type: Number/)
  assert.match(model, /type: Boolean/)
  assert.match(model, /enum: \["pendiente","hecha",""\]/)
  assert.match(model, /new RegExp/)
  assert.match(model, /value === ""/)
})

test("compila los formularios cuando solo se solicita crear o editar", () => {
  for (const operations of [["create"], ["list", "edit"]]) {
    const config = validConfiguration()
    config.operations = operations
    config.fields[0].search = false
    config.fields[0].list = operations.includes("list")
    const generated = generateFiles(config)
    const filename = "GestionTareas.vue"
    const parsed = parse(generated.files[`src/components/${filename}`], { filename })
    assert.deepEqual(parsed.errors, [])
    assert.doesNotThrow(() => compileScript(parsed.descriptor, { id: `generator-${operations.join("-")}` }))
    const template = compileTemplate({
      source: parsed.descriptor.template.content,
      filename,
      id: `generator-${operations.join("-")}`,
    })
    assert.deepEqual(template.errors, [])
  }
})

test("permite generar tipos de pantalla distintos de CRUD en la misma plantilla", () => {
  const listConfig = validConfiguration()
  listConfig.screen.type = "Listado"
  listConfig.operations = ["list", "search"]
  listConfig.fields[0].form = false
  const listResult = validateConfiguration(listConfig)
  assert.equal(listResult.errors.length, 0)
  const listGenerated = generateFiles(listConfig)
  assert.match(listGenerated.files["src/components/GestionTareas.vue"], /v-for="registroActual in registrosVisibles"/)
  assert.doesNotMatch(listGenerated.files["src/components/GestionTareas.vue"], /<form/)

  const formConfig = validConfiguration()
  formConfig.screen.type = "Formulario"
  formConfig.operations = ["create"]
  formConfig.fields[0].list = false
  formConfig.fields[0].search = false
  formConfig.fields[0].form = true
  const formResult = validateConfiguration(formConfig)
  assert.equal(formResult.errors.length, 0)
  const formGenerated = generateFiles(formConfig)
  assert.match(formGenerated.files["src/components/GestionTareas.vue"], /@submit.prevent="guardar"/)
})

test("permite generar una pantalla que reutiliza un recurso existente sin duplicar backend", () => {
  const config = validConfiguration()
  config.source = "existing"
  config.existingResource = "doctores"
  config.entity.singular = "Doctor"
  config.entity.plural = "doctores"
  config.entity.apiPath = "/api/doctores"
  config.screen.component = "SeleccionDoctor"
  config.screen.route = "/seleccion-doctor"
  config.screen.title = "Selección de doctor"
  config.operations = ["list"]
  config.fields = [{
    name: "apeldoc",
    label: "Apellidos",
    type: "text",
    required: true,
    defaultValue: "",
    min: "",
    max: "",
    pattern: "",
    options: "",
    form: false,
    list: true,
    search: true,
  }]

  const generated = generateFiles(config)
  assert.deepEqual(Object.keys(generated.files).sort(), [
    "INSTRUCCIONES.md",
    "configuracion.json",
    "src/components/SeleccionDoctor.vue",
  ])
  assert.match(generated.files["INSTRUCCIONES.md"], /reutiliza el recurso existente/i)
  assert.match(generated.files["src/components/SeleccionDoctor.vue"], /getDoctores/)
  assert.doesNotMatch(generated.files["src/components/SeleccionDoctor.vue"], /mongoose/i)
})

test("rechaza campos obligatorios fuera del formulario sin valor inicial", () => {
  const config = validConfiguration()
  config.fields[0].form = false
  const { errors } = validateConfiguration(config)
  assert.ok(errors.some((error) => error.includes("necesita un valor inicial")))
})

test("valida fechas y horas y genera límites de fecha también en Mongoose", () => {
  const config = validConfiguration()
  config.fields = [
    { name: "fecha", label: "Fecha", type: "date", required: true, defaultValue: "2026-02-28", min: "2026-01-01", max: "2026-12-31", form: true, list: true, search: false },
    { name: "hora", label: "Hora", type: "time", required: false, defaultValue: "09:30", form: true, list: true, search: false },
  ]
  config.operations = ["list", "create"]
  const generated = generateFiles(config)
  const model = generated.files["backend/modelos/Tarea.js"]
  assert.match(model, /toISOString\(\)\.slice\(0, 10\)/)
  assert.match(model, /value >= "2026-01-01"/)
  assert.match(model, /value <= "2026-12-31"/)
  assert.match(model, /\[01\]\\d/)

  config.fields[0].min = "2026-02-31"
  assert.ok(validateConfiguration(config).errors.some((error) => error.includes("fechas válidas")))
  config.fields[0].min = "2026-01-01"
  config.fields[1].defaultValue = "25:61"
  assert.ok(validateConfiguration(config).errors.some((error) => error.includes("formato HH:MM")))
})
