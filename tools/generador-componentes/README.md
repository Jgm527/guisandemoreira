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

La herramienta genera una pantalla CRUD para una entidad y colección nuevas:

- modelo Mongoose y router Express;
- módulo de acceso Axios y componente Vue;
- configuración JSON reutilizable e instrucciones de integración;
- vista previa, copia de los archivos y guardado en `salidas/`.

Las operaciones y campos se configuran en el formulario. La generación se
detiene si hay errores de validación o coincidencias con los archivos del
proyecto. Si la carpeta de salida ya existe, se solicita confirmación explícita
y se reemplaza solo esa carpeta.

No se modifican archivos del proyecto ni se ejecuta código generado. Las salidas
se guardan en `tools/generador-componentes/salidas/`, que está excluida de Git.
El panel informa de los recursos reales que se han encontrado; la reutilización
de recursos existentes, los otros tipos de pantalla, relaciones, catálogos,
Pinia, filtros avanzados y PDF quedan para fases posteriores.

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
