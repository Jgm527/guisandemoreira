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

Si prefieres configurar una pantalla sin abrir el navegador, inicia el mismo
generador en modo terminal:

```powershell
node tools/generador-componentes/server.js --terminal
```

El asistente pregunta por la pantalla, entidad, campos y sus restricciones,
operaciones, relaciones y Pinia; al final muestra un resumen y solicita
confirmación antes de guardar. Pulsa Enter para aceptar los valores
recomendados, escribe `-` para dejar vacío un campo opcional, `:q` para cancelar
o usa `Ctrl+C`. Si necesitas corregir una respuesta, escribe `:atras` para
volver a la pregunta anterior; después de editarla, el asistente conserva las
respuestas siguientes que todavía sean compatibles. Escribe `:adelante` para
recuperar la respuesta anterior de la pregunta actual. La validación, las
plantillas, las comprobaciones de archivos y la carpeta de salida son las mismas
que en la interfaz web. La guía generada queda en `INSTRUCCIONES.md` dentro de
la carpeta de salida. El modo necesita una terminal interactiva.

## Estructura del generador

- `server.js` gestiona HTTP, validaciones de las solicitudes y escritura segura
  de las salidas; sirve únicamente los módulos públicos permitidos. Con
  `--terminal`, inicia el asistente de consola en vez del servidor web.
- `terminal.js` implementa el asistente interactivo y usa las mismas funciones
  de validación y generación que la interfaz.
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

- Cada relación genera un campo en el modelo y una llamada a
  `validarRelaciones()` en el router. La relación
  con pacientes es la excepción: guarda su DNI como texto y valida
  `Paciente.exists({ dnipac })`, siguiendo `backend/modelos/Cita.js`; doctores y
  citas siguen usando `ObjectId`/`ref`.
- Cada relación se escoge con un **selector de la API** (lista real del recurso)
  o con la **selección compartida** de un store que ya existe en el proyecto
  (`pacienteStore` y `doctorStore`; Citas no tiene store, así que solo admite
  selector).
- Si el listado se marca como filtrable, el router y el módulo de API admiten
  un parámetro con el nombre del campo configurado, por ejemplo
  `?pacienteDNI=...` para una relación con pacientes.
- Si se pide compartir la selección, se genera `src/store/<entidad>Store.js`
  (patrón de `doctorStore.js`) y el componente añade un botón **Compartir** en
  la tabla; la guía explica cómo consumir el store desde otra pantalla.
- Tras guardar, el formulario conserva los datos y pasa al modo edición del
  registro devuelto por la API; las etiquetas de acción usan una sola palabra.
- Antes de generar, el servidor comprueba que los módulos de API y los stores
  que el componente va a importar existen de verdad; si falta alguno, se
  detiene y lo explica.

Las relaciones con entidades generadas en ejecuciones anteriores y el `watch`
sobre los stores siguen pendientes y la guía lo indica.

Las confirmaciones, los errores y los mensajes de éxito del componente usan
`src/utils/alertas.js` (SweetAlert2), la utilidad compartida del proyecto, en
lugar de `window.confirm` o banners propios.

La exportación a PDF todavía no está disponible.

## Catálogos desde archivo JSON

Además del selector y el radio con opciones escritas en el formulario, un campo
puede ser de tipo **catálogo**: su lista de opciones sale de un archivo JSON,
como la especialidad de los doctores (`backend/data/especialidades.json`) o los
municipios (`backend/data/municipios.json`).

Hay dos orígenes:

- **Proyecto**: se elige un JSON que ya existe en `backend/data`. Se reutiliza la
  ruta `/api/<nombre>` y, si `src/api/<nombre>.js` exporta una función sin
  argumentos que carga justo esa lista, se reutiliza también (por ejemplo
  `obtenerEspecialidades()` o `obtenerProvincias()` para la lista `provincias`
  de `municipios.json`).
- **Datos nuevos**: se pega el JSON o se indica un archivo. El generador crea
  `src/data/<nombre>.json` y el módulo `src/api/<nombre>.<ext>`, que importa el
  JSON y devuelve la lista. No hay que registrar ninguna ruta en
  `backend/server.js`: el catálogo viaja con el frontend y funciona aunque el
  backend o MongoDB estén parados.

El generador analiza la estructura antes de generar y propone la lista del JSON
(`rootKey`), el campo visible (`labelField`, por ejemplo `nm`), el valor que se
guarda (`valueField`, por defecto el visible) y el identificador (`idField`,
por ejemplo `id`). Admite arrays en la raíz, objetos con varias listas y listas
de valores simples. En la web el análisis ocurre al pulsar **Analizar
estructura**; en la terminal, al indicar el archivo o pegar los datos, y todas
las preguntas siguientes muestran las opciones detectadas.

El campo guarda el valor elegido como texto en Mongoose (igual que `espedoc` en
`backend/modelos/Doctor.js`). Si un campo catálogo indica un `parentField`, el
componente filtra su lista por el valor elegido en ese otro catálogo y vacía la
selección al cambiar el padre (patrón provincia → municipio de
`XestionPacientes.vue`).

Límites: el catálogo es de solo lectura (no se generan altas ni borrados de
opciones), el filtro dependiente compara el identificador del hijo por prefijo
con el del padre, no se valida en el backend que el valor enviado exista en el
JSON y la lista se carga completa (sin paginación ni búsqueda).

Las operaciones y campos se configuran en el formulario. La generación se
detiene si hay errores de validación o coincidencias con los archivos del
proyecto, y solo se permiten las operaciones que el módulo real de cada recurso
exporta. Si la carpeta de salida ya existe, se solicita confirmación explícita
y se reemplaza solo esa carpeta.

Las restricciones del paso de campos cambian según el tipo: longitud para
texto, texto largo, correo y teléfono; mínimo y máximo para números, fechas y
horas; e incremento opcional para números. Los campos de radio y selector
admiten opciones fijas, y los booleanos permiten exigir la casilla y definir su
valor inicial. El valor inicial también se comprueba frente a las restricciones.

Para texto, texto largo y teléfono puedes elegir reglas habituales (solo
letras, solo dígitos, letras y números, mayúsculas o minúsculas) sin escribir
una expresión regular. El correo comprueba su formato automáticamente. Las
reglas manuales quedan en una sección avanzada; aceptan el patrón
`^[A-Z]{3}$` o la notación JavaScript `/^[A-Z]{3}$/`, con un mensaje de error
personalizable. Se comprueban en el formulario y en el modelo Mongoose. Para
números, fechas y horas se usan sus límites e incrementos específicos, no
expresiones regulares.

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
