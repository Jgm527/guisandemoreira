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

Las confirmaciones, los errores y los mensajes de éxito del componente usan
`src/utils/alertas.js` (SweetAlert2), la utilidad compartida del proyecto, en
lugar de `window.confirm` o banners propios.

El tipo de pantalla Relacionado (relaciones, selectores de catálogo y stores de
Pinia) todavía no está disponible y el formulario lo mantiene deshabilitado.

Las operaciones y campos se configuran en el formulario. La generación se
detiene si hay errores de validación o coincidencias con los archivos del
proyecto, y solo se permiten las operaciones que el módulo real de cada recurso
exporta. Si la carpeta de salida ya existe, se solicita confirmación explícita
y se reemplaza solo esa carpeta.

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
