# Generador local de componentes

## Iniciar

Desde la raíz del repositorio ejecuta:

```powershell
node tools/generador-componentes/server.js
```

Abre `http://127.0.0.1:4179` en el mismo equipo. No se han añadido
dependencias: el servidor usa módulos incluidos en Node.js. Para elegir otro
puerto local, define `COMPONENT_GENERATOR_PORT` antes de iniciar Node.

El servidor escucha únicamente en `127.0.0.1`. Al terminar, vuelve a la terminal
y pulsa `Ctrl+C`.

## Estructura del generador

- `server.js` gestiona HTTP, validaciones de las solicitudes y escritura segura
  de las salidas; sirve únicamente los módulos públicos permitidos.
- `generador.js` conserva la API de generación que usa el servidor y coordina
  validación y plantillas.
- `generador/datos.js` centraliza los tipos, metadatos de recursos y utilidades
  compartidas.
- `generador/validacion.js` normaliza y valida la configuración antes de
  generar.
- `generador/plantillas/` separa las salidas de backend, componente Vue, store
  e instrucciones.
- `public/app.js` coordina el formulario y sus pasos; `public/modules/api.js`
  encapsula las peticiones HTTP y `public/modules/ui.js` concentra la
  presentación de avisos, vista previa y archivos generados.

## Primera entrega

La herramienta genera pantallas para una entidad y colección nuevas, con modelo
Mongoose, router Express, módulo de API Axios y componente Vue, todos comentados
bloque a bloque y con un encabezado que indica dónde va cada archivo.

También genera pantallas que reutilizan un recurso existente del proyecto
(pacientes, doctores, citas, especialidades y municipios). En ese caso solo se
genera el componente: llama a las funciones reales de `src/api/`, usa el
identificador real de cada recurso (por ejemplo `dnipac` en pacientes) y la guía
indica qué archivos de referencia revisar. Si el recurso ya existe en el
proyecto, la generación no duplica modelos ni routers, y si algún archivo del
recurso falta, se detiene y lo explica.

## Pantallas Relacionadas (relaciones y Pinia)

El tipo de pantalla **Relacionado** está disponible para entidades nuevas. En el
paso 4 del formulario se declaran relaciones con pacientes, doctores o citas y,
de forma independiente, si la pantalla comparte su propia selección con Pinia:

- Cada relación genera un campo de referencia `{ type: ObjectId, ref: "..." }`
  en el modelo (patrón de `backend/modelos/Cita.js`) y una llamada a
  `validarRelaciones()` en el router, que comprueba con `Modelo.exists()` que el
  documento relacionado existe antes de crear o editar (patrón de
  `backend/rutas/citas.rutas.js`).
- Cada relación se escoge con un **selector de la API** (lista real del recurso)
  o con la **selección compartida** de un store que ya existe en el proyecto
  (`pacienteStore` y `doctorStore`; Citas no tiene store, así que solo admite
  selector).
- Si el listado se marca como filtrable, el router y el módulo de API admiten
  `?pacienteId=...` igual que `getCitas`.
- Si se pide compartir la selección, se genera `src/store/<entidad>Store.js`
  (patrón de `doctorStore.js`) y el componente añade un botón **Compartir** en
  la tabla; la guía explica cómo consumir el store desde otra pantalla.
- Antes de generar, el servidor comprueba que los módulos de API y los stores
  que el componente va a importar existen de verdad; si falta alguno, se
  detiene y lo explica.

Las relaciones con entidades generadas en ejecuciones anteriores, los
selectores dependientes (provincia → municipio) y el `watch` sobre los stores
siguen pendientes y la guía lo indica.

Las confirmaciones, los errores y los mensajes de éxito del componente usan
`src/utils/alertas.js` (SweetAlert2), la utilidad compartida del proyecto, en
lugar de `window.confirm` o banners propios.

Los catálogos para selectores de opciones fijas y la exportación a PDF todavía
no están disponibles; los campos tipo selector y radio usan opciones que se
escriben en el formulario.

Las operaciones y campos se configuran en el formulario. La generación se
detiene si hay errores de validación o coincidencias con los archivos del
proyecto, y solo se permiten las operaciones que el módulo real de cada recurso
exporta. Si la carpeta de salida ya existe, se solicita confirmación explícita
y se reemplaza solo esa carpeta.

Las expresiones regulares admiten tanto el patrón sin delimitadores como la
notación JavaScript `/.../flags`. Se comprueban al guardar desde el formulario y
en el modelo Mongoose para campos de texto, número y fecha.

No se modifican archivos del proyecto ni se ejecuta código generado. Las salidas
se guardan en `tools/generador-componentes/salidas/`, que está excluida de Git.

Para repetir una propuesta, usa **Cargar configuración guardada** y selecciona
su `configuracion.json`.

## Pruebas

Desde la raíz del repositorio:

```powershell
node --test tools/generador-componentes/test/generador.test.js
```

La compilación del proyecto tras integrar los archivos se valida con `npm run
build`. El generador no ejecuta automáticamente ese comando ni prueba la
conexión con MongoDB.
