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
  assert.match(generated.files["src/components/GestionTareas.vue"], />Guardar<\/button>/)
  assert.match(generated.files["src/components/GestionTareas.vue"], /Object\.assign\(registro, initialValues, guardado\)/)
  assert.match(generated.files["src/components/GestionTareas.vue"], /editingId\.value = guardado\._id/)
  assert.doesNotMatch(generated.files["src/components/GestionTareas.vue"], / limpiar\(\);/)
  assert.match(generated.files["INSTRUCCIONES.md"], /backend\/server\.js/)
})

test("mantiene centrados los campos de identificación y usa acciones breves con espaciado uniforme", () => {
  const config = validConfiguration()
  config.fields = [
    { name: "dni", label: "DNI", type: "text", required: true, defaultValue: "", form: true, list: true, search: false },
    { name: "fecha", label: "Fecha", type: "date", required: true, defaultValue: "", form: true, list: true, search: false },
  ]
  config.operations = ["list", "create", "edit", "delete"]
  const component = generateFiles(config).files["src/components/GestionTareas.vue"]
  assert.match(component, /registro\.dni" class="rounded border border-gray-300 p-2 text-center"/)
  assert.match(component, /registro\.fecha" class="rounded border border-gray-300 p-2 text-center"/)
  assert.match(component, /Cancelar<\/button>/)
  assert.match(component, /class="mx-1 rounded border px-3 py-2"[^>]*>Editar<\/button>/)
  assert.match(component, />Eliminar<\/button>/)
  assert.doesNotMatch(component, /Cancelar edición|Guardar cambios|Borrar<\/button>/)
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

test("normaliza regex de texto y genera restricciones tipadas para número y fecha", () => {
  const config = validConfiguration()
  config.fields = [
    { name: "codigo", label: "Código", type: "text", required: true, defaultValue: "ABC", pattern: "/^[A-Z]{3}$/", form: true, list: true, search: false },
    { name: "detalle", label: "Detalle", type: "textarea", required: false, defaultValue: "", pattern: "/^[A-Z]{3}$/", form: true, list: true, search: false },
    { name: "cantidad", label: "Cantidad", type: "number", required: true, defaultValue: "12", min: "10", max: "99", form: true, list: true, search: false },
    { name: "fecha", label: "Fecha", type: "date", required: true, defaultValue: "2026-02-28", min: "2026-01-01", max: "2026-12-31", form: true, list: true, search: false },
  ]
  config.operations = ["list", "create"]

  const generated = generateFiles(config)
  const normalized = JSON.parse(generated.files["configuracion.json"])
  assert.equal(normalized.fields[0].pattern, "^[A-Z]{3}$")
  assert.equal(normalized.fields[0].patternFlags, "")

  const model = generated.files["backend/modelos/Tarea.js"]
  assert.match(model, /new RegExp\("\^\[A-Z\]\{3\}\$", ""\)/)
  assert.match(model, /cantidad: \{ type: Number, required: true, min: 10, max: 99/)
  assert.match(model, /value >= "2026-01-01"/)
  assert.doesNotMatch(model, /cantidad: \{[^}]*match:/)

  const component = generated.files["src/components/GestionTareas.vue"]
  assert.match(component, /type="text" required[^>]*pattern="\^\[A-Z\]\{3\}\$"/)
  assert.match(component, /type="date" required min="2026-01-01" max="2026-12-31"/)
  assert.match(component, /<textarea[^>]*><\/textarea>/)
  assert.doesNotMatch(component, /<textarea[^>]*pattern=/)
  assert.doesNotMatch(component, /type="number"[^>]*pattern=/)
  assert.match(component, /campoConFormatoInvalido/)
  assert.match(component, /new RegExp\(patron, flags\)\.exec\(String\(valor\)\)/)
  const parsed = parse(component, { filename: "GestionTareas.vue" })
  assert.deepEqual(parsed.errors, [])
  assert.doesNotThrow(() => compileScript(parsed.descriptor, { id: "generator-regex-patterns" }))
  const template = compileTemplate({
    source: parsed.descriptor.template.content,
    filename: "GestionTareas.vue",
    id: "generator-regex-patterns",
  })
  assert.deepEqual(template.errors, [])
})

test("recomienda límites tipados para número y fecha en vez de expresiones regulares", () => {
  const config = validConfiguration()
  config.fields = [
    { name: "fecha", label: "Fecha", type: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$", form: true, list: true },
  ]
  const { errors } = validateConfiguration(config)
  assert.ok(errors.some((error) => error.includes("usa las restricciones propias para número, fecha y hora")))
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

test("indica claramente que la salida no se registra automáticamente en la app real", () => {
  const generated = generateFiles(validConfiguration())
  assert.match(generated.files["INSTRUCCIONES.md"], /no se monta ni se registra automáticamente/i)
  assert.match(generated.files["INSTRUCCIONES.md"], /src\/router\/index\.js/i)
})

test("permite generar una pantalla que reutiliza un recurso existente sin duplicar backend", () => {
  const config = validConfiguration()
  config.source = "existing"
  config.existingResource = "doctores"
  config.entity.singular = ""
  config.entity.plural = ""
  config.entity.apiPath = ""
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

  const validation = validateConfiguration(config)
  assert.deepEqual(validation.errors, [])
  assert.equal(validation.config.entity.apiPath, "/api/doctores")

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

test("el tipo Relacionado usa DNI para pacientes y ObjectId para doctores", () => {
  const config = validConfiguration()
  config.screen.type = "Relacionado"
  config.screen.component = "GestionRecetas"
  config.screen.route = "/gestion-recetas"
  config.screen.title = "Gestión de recetas"
  config.entity.singular = "Receta"
  config.entity.plural = "recetas"
  config.entity.apiPath = "/api/recetas"
  config.relations = [
    { resource: "pacientes", fieldName: "pacienteDNI", label: "Paciente", required: true, selection: "api", filterable: true },
    { resource: "doctores", fieldName: "doctorId", label: "Doctor", required: true, selection: "pinia" },
  ]
  config.pinia = { enabled: true, fields: ["titulo"] }

  const generated = generateFiles(config)
  assert.deepEqual(Object.keys(generated.files).sort(), [
    "INSTRUCCIONES.md",
    "backend/modelos/Receta.js",
    "backend/rutas/recetas.rutas.js",
    "configuracion.json",
    "src/api/recetas.js",
    "src/components/GestionRecetas.vue",
    "src/store/recetaStore.js",
  ])
  const model = generated.files["backend/modelos/Receta.js"]
  assert.match(model, /pacienteDNI: \{ type: String, trim: true, required: true \}/)
  assert.match(model, /doctorId: \{ type: mongoose\.Schema\.Types\.ObjectId, ref: "Doctor", required: true \}/)
  assert.doesNotMatch(model, /pacienteDNI: \{[^}]*ObjectId/)
  assert.match(model, /type: mongoose\.Schema\.Types\.ObjectId/)
  const routes = generated.files["backend/rutas/recetas.rutas.js"]
  assert.match(routes, /validarRelaciones/)
  assert.match(routes, /Paciente\.exists\(\{ dnipac: datos\.pacienteDNI \}\)/)
  assert.match(routes, /\.find\(\)\.lean\(\)/)
  assert.doesNotMatch(routes, /req\.query|const filtros|find\(filtros\)/)
  const component = generated.files["src/components/GestionRecetas.vue"]
  assert.match(component, /getPacientes/)
  assert.match(component, /:value="item\.dnipac"/)
  assert.match(component, /new Map\(relacionPacienteDNI\.value\.map\(\(item\) => \[String\(item\.dnipac\)/)
  assert.match(component, /useDoctorStore/)
  assert.match(component, /etiquetaPacienteDNI\(item\)/)
  assert.match(component, /compartir\(registroActual\)/)
  const parsed = parse(component, { filename: "GestionRecetas.vue" })
  assert.deepEqual(parsed.errors, [])
  assert.doesNotThrow(() => compileScript(parsed.descriptor, { id: "generator-relacionado" }))
  const template = compileTemplate({
    source: parsed.descriptor.template.content,
    filename: "GestionRecetas.vue",
    id: "generator-relacionado",
  })
  assert.deepEqual(template.errors, [])
  assert.match(generated.files["INSTRUCCIONES.md"], /validarRelaciones/)
  assert.match(generated.files["INSTRUCCIONES.md"], /seleccionarReceta/)
})

test("la relación Pinia con pacientes guarda el DNI seleccionado", () => {
  const config = validConfiguration()
  config.screen.type = "Relacionado"
  config.relations = [
    { resource: "pacientes", fieldName: "pacienteDNI", label: "Paciente", required: true, selection: "pinia" },
  ]
  const generated = generateFiles(config)
  const component = generated.files["src/components/GestionTareas.vue"]
  const model = generated.files["backend/modelos/Tarea.js"]
  assert.match(component, /pacienteStore\.dnipac/)
  assert.match(component, /pacienteDNI: pacienteStore\.dnipac \?\? registro\.pacienteDNI/)
  assert.match(model, /pacienteDNI: \{ type: String, trim: true, required: true \}/)
})

test("rechaza configuraciones de relación incoherentes", () => {
  const config = validConfiguration()
  config.screen.type = "Relacionado"
  config.relations = [{ resource: "citas", fieldName: "citaId", label: "Cita", selection: "pinia" }]
  let result = validateConfiguration(config)
  assert.ok(result.errors.some((error) => error.includes("no tiene un store de Pinia")))

  config.relations = []
  result = validateConfiguration(config)
  assert.ok(result.errors.some((error) => error.includes("al menos una relación")))

  config.screen.type = "Listado"
  config.relations = [{ resource: "pacientes", fieldName: "pacienteDNI", label: "Paciente", selection: "api" }]
  result = validateConfiguration(config)
  assert.ok(result.errors.some((error) => error.includes("CRUD, Relacionado y Formulario")))

  config.screen.type = "Relacionado"
  config.source = "existing"
  config.existingResource = "pacientes"
  config.entity.apiPath = ""
  result = validateConfiguration(config)
  assert.ok(result.errors.some((error) => error.includes("solo están disponibles para entidades nuevas")))
})

test("genera siempre la lista completa sin variables de búsqueda retiradas", () => {
  const config = validConfiguration()
  config.entity.singular = "Medicamento"
  config.entity.plural = "medicamentos"
  config.entity.apiPath = "/api/medicamentos"
  config.screen.component = "Medicamentos"
  config.screen.route = "/medicamentos"
  config.screen.title = "Medicamentos"
  config.operations = ["list", "create", "edit", "delete"]
  config.fields = [
    { name: "nombre", label: "Nombre", type: "text", required: true, defaultValue: "", form: true, list: true, search: false },
    { name: "principioAct", label: "Principio activo", type: "text", required: true, defaultValue: "", form: true, list: false, search: false },
  ]

  const generated = generateFiles(config)
  const component = generated.files["src/components/Medicamentos.vue"]
  assert.match(component, /const registrosVisibles = registros;/)
  assert.doesNotMatch(component, /searchTerm|config\.operations\.includes\("search"\)/)
  assert.match(generated.files["src/api/medicamentos.js"], /\/api\/medicamentos/)
  assert.match(generated.files["backend/rutas/medicamentos.rutas.js"], /Medicamento\.find\(\)\.lean\(\)/)
})

test("aplica restricciones por tipo en formulario, modelo y valores iniciales", () => {
  const config = validConfiguration()
  config.fields = [
    {
      name: "nombre",
      label: "Nombre",
      type: "text",
      required: false,
      defaultValue: "Ana",
      min: "2",
      max: "20",
      pattern: "^[A-Za-z]+$",
      patternMessage: "Usa solo letras",
      options: "",
      form: true,
      list: true,
      search: false,
    },
    {
      name: "precio",
      label: "Precio",
      type: "number",
      required: true,
      defaultValue: "1.5",
      min: "0.5",
      max: "10",
      step: "0.5",
      options: "",
      form: true,
      list: false,
      search: false,
    },
    {
      name: "hora",
      label: "Hora",
      type: "time",
      required: false,
      defaultValue: "10:30",
      min: "09:00",
      max: "18:00",
      options: "",
      form: true,
      list: false,
      search: false,
    },
  ]
  const { errors } = validateConfiguration(config)
  assert.deepEqual(errors, [])
  const generated = generateFiles(config).files
  assert.match(generated["src/components/GestionTareas.vue"], /type="text"[^>]*minlength="2"[^>]*maxlength="20"/)
  assert.match(generated["src/components/GestionTareas.vue"], /type="number"[^>]*min="0\.5"[^>]*max="10"[^>]*step="0\.5"/)
  assert.match(generated["src/components/GestionTareas.vue"], /type="time"[^>]*min="09:00"[^>]*max="18:00"/)
  assert.match(generated["src/components/GestionTareas.vue"], /Usa solo letras/)
  assert.match(generated["backend/modelos/Tarea.js"], /value\.length >= 2/)
  assert.match(generated["backend/modelos/Tarea.js"], /maxlength: 20/)
  assert.match(generated["backend/modelos/Tarea.js"], /El número no respeta el incremento permitido/)
  assert.match(generated["backend/modelos/Tarea.js"], /value >= "09:00"/)

  config.fields[1].defaultValue = "1.6"
  assert.ok(validateConfiguration(config).errors.some((error) => error.includes("incremento configurado")))
  config.fields[1].defaultValue = "1.5"
  config.fields[2].defaultValue = "08:59"
  assert.ok(validateConfiguration(config).errors.some((error) => error.includes("hora mínima")))
  config.fields[2].defaultValue = "10:30"
  config.fields[2].max = "08:00"
  assert.ok(validateConfiguration(config).errors.some((error) => error.includes("mínimo no puede ser mayor")))
})
