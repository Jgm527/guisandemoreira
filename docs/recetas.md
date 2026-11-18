# Recetas sobre este código

Seis cambios típicos de examen, escritos contra **los ficheros de este repositorio**. Cada
receta dice qué te piden, qué fichero se toca, el código, **el punto exacto donde va** y
cómo comprobarlo.

Regla de oro: no cambies nombres de campos. El DNI es `dnipac` (no `dni`), la fecha de
nacimiento es `nacipac` (no `nacepac`) y el número de colegiado es `coledoc`. Un nombre
distinto entre modelo, API, formulario y template rompe el formulario en silencio.

| Receta | Te lo piden así |
|---|---|
| [1. Fecha dd/mm/aaaa](#1-fecha-en-formato-ddmmaaaa) | «as datas en formato dd/mm/aaaa» |
| [2. Color por estado](#2-color-por-estado-en-la-tabla) | «amosa o estado con cores distintas» |
| [3. Filtro por estado y doctor](#3-filtros-por-estado-y-doctor) | «filtra as citas por estado / por doutor» |
| [4. Buscador sin tildes](#4-buscador-sin-tildes) | «un buscador que atope escribindo» |
| [5. PDF con autor y logo](#5-pdf-con-autor-y-logo) | «que o informe leven o teu nome / o logo» |
| [6. Columna calculada: edad](#6-columna-calculada-edad) | «engade a idade do paciente» |

---

## 1. Fecha en formato dd/mm/aaaa

**Fichero:** `src/components/Citas.vue` (opcionalmente `src/utils/pdf.js` no hace falta).

La fecha se guarda como `AAAA-MM-DD` porque el input es `type="date"`. Se formatea
**partiendo el texto**, no con `new Date()`, que aplicaría zonas horarias y podría devolver
el día anterior.

### Paso 1 · La función

Pega esto **justo encima** de la línea:

```js
// Convierte el codigo interno de estado en una etiqueta legible para la interfaz.
```

```js
// Muestra AAAA-MM-DD como dd/mm/aaaa. Se trocea el texto en vez de usar new Date():
// al interpretar la cadena como UTC, en España se veria el dia anterior.
function formatearFecha(fecha) {
  // partes separa anio, mes y dia; si no son tres trozos se devuelve el original.
  const partes = String(fecha ?? "").split("-")

  if (partes.length !== 3) {
    return fecha ?? ""
  }

  const [anio, mes, dia] = partes
  return `${dia}/${mes}/${anio}`
}
```

### Paso 2 · La tabla

Cambia esta línea del `<tbody>`:

```vue
<td>{{ item.fecha }} · {{ item.hora }}</td>
```

por:

```vue
<td>{{ formatearFecha(item.fecha) }} · {{ item.hora }}</td>
```

### Paso 3 · El PDF (recomendado)

En `exportarCitas()`, dentro del array `filas:`, cambia `item.fecha ?? ""` por:

```js
        formatearFecha(item.fecha),
```

Y en `eliminarCita()` el mensaje de confirmación:

```js
    `¿Eliminar la cita del ${formatearFecha(item.fecha)} a las ${item.hora}?`,
```

### Comprobar

`npm run build` sin errores; en la tabla una cita del `2026-11-19` se ve `19/11/2026`, y el
PDF descargado también.

### Si falla

- `formatearFecha is not defined` → la función quedó dentro de otra función o después del
  `</script>`.
- Se ve `undefined` → el campo no es `fecha` (mira el modelo `backend/modelos/Cita.js`).

---

## 2. Color por estado en la tabla

**Ficheros:** `src/components/Citas.vue` y `src/style.css`.

Se colorea **además** de mantener el texto: el color solo no es accesible (daltonismo).

### Paso 1 · La clase en el script

Pega esto **justo encima** de `function etiquetaEstado(estado) {`:

```js
// Traduce el estado a la clase CSS del distintivo. La etiqueta de texto la sigue
// dando etiquetaEstado(), asi el color no es la unica informacion.
function claseEstado(estado) {
  const clases = {
    pendente: "estado-pendente",
    confirmada: "estado-confirmada",
    realizada: "estado-realizada",
    cancelada: "estado-cancelada"
  }

  return clases[estado] ?? ""
}
```

### Paso 2 · La celda

Cambia:

```vue
<td>{{ etiquetaEstado(item.estado) }}</td>
```

por:

```vue
<td>
  <span :class="claseEstado(item.estado)">{{ etiquetaEstado(item.estado) }}</span>
</td>
```

### Paso 3 · El CSS

En `src/style.css`, dentro de `@layer components`, **encima** de
`.xestion-citas .citas-mensaje-lista {`:

```css
  /* Distintivo de estado: forma comun y un color por valor. */
  .xestion-citas .estado-pendente,
  .xestion-citas .estado-confirmada,
  .xestion-citas .estado-realizada,
  .xestion-citas .estado-cancelada {
    @apply inline-flex items-center justify-center rounded px-2 py-1 text-xs font-semibold;
  }

  .xestion-citas .estado-pendente {
    @apply bg-[#fff4d6] text-[#8a6d00];
  }

  .xestion-citas .estado-confirmada {
    @apply bg-[#e3edf5] text-[#1b4965];
  }

  .xestion-citas .estado-realizada {
    @apply bg-[#dcfce7] text-[#166534];
  }

  .xestion-citas .estado-cancelada {
    @apply bg-[#fde2e1] text-[#991b1b];
  }
```

### Comprobar

Cada fila muestra un distintivo con color y texto, también en el móvil (ancho 375 px).

### Si falla

- Todo del mismo color → la clase no llega: revisa que el `@layer components` siga abierto y
  que el estado guardado sea exactamente `pendente`/`confirmada`/`realizada`/`cancelada`.
- El texto se queda sin estilo → cambiaste el `<td>` pero no añadiste el `<span>`.

---

## 3. Filtros por estado y doctor

**Fichero:** `src/components/Citas.vue`.

Filtra en el **cliente** sobre lo que ya devolvió la API (que a su vez filtró por paciente o
doctor seleccionado). No hace falta tocar el backend.

### Paso 1 · Estado reactivo y lista filtrada

Pega **debajo** de `const guardando = ref(false)`:

```js
// Valores elegidos en los desplegables de la lista. Vacios = "todos".
const filtroEstado = ref("")
const filtroDoctor = ref("")

// Lista que se pinta y se exporta: parte de las citas ya cargadas y aplica los dos
// filtros. Cada condicion empieza por "!filtro ||" para que un filtro vacio deje pasar todo.
const citasFiltradas = computed(() =>
  citas.value.filter(
    (item) =>
      (!filtroEstado.value || item.estado === filtroEstado.value) &&
      (!filtroDoctor.value || idRelacionado(item.doctorId) === String(filtroDoctor.value))
  )
)
```

### Paso 2 · La barra de filtros

Dentro de `<div v-else-if="citas.length" class="citas-tabla-wrapper">`, **antes** de
`<table>`, pega:

```vue
        <!-- Filtros de la lista: actuan sobre lo ya cargado, sin pedir de nuevo a la API. -->
        <div class="citas-filtros">
          <label for="filtro-estado">Estado:</label>
          <select id="filtro-estado" v-model="filtroEstado">
            <option value="">Todos os estados</option>
            <option value="pendente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <label for="filtro-doctor">Doctor:</label>
          <select id="filtro-doctor" v-model="filtroDoctor">
            <option value="">Todos os doutores</option>
            <option v-for="doctor in doctores" :key="doctor._id" :value="doctor._id">
              {{ doctor.nomedoc }} {{ doctor.apeldoc }}
            </option>
          </select>

          <button class="citas-boton-secundario" type="button" @click="limpiarFiltros">
            Limpiar filtros
          </button>
          <span class="citas-contador">
            Mostrando {{ citasFiltradas.length }} de {{ citas.length }}
          </span>
        </div>

        <p v-if="!citasFiltradas.length" class="citas-mensaje-lista">
          Ningunha cita coincide cos filtros.
        </p>
```

### Paso 3 · Que la tabla y el PDF usen la lista filtrada

- En el `<tr>` de la tabla: `v-for="item in citas"` → `v-for="item in citasFiltradas"`.
- En `exportarCitas()`: `filas: citas.value.map(...)` → `filas: citasFiltradas.value.map(...)`.
- Añade la función junto a `limpiarFormulario`:

```js
// Devuelve la lista a su estado inicial sin recargar de la API.
function limpiarFiltros() {
  filtroEstado.value = ""
  filtroDoctor.value = ""
}
```

### Paso 4 · Un poco de CSS

En `src/style.css`, dentro de `@layer components`, encima de `.xestion-citas .citas-tabla-wrapper {`:

```css
  .xestion-citas .citas-filtros {
    @apply mb-3 flex flex-wrap items-center gap-2 text-sm;
  }

  .xestion-citas .citas-filtros select {
    @apply rounded border border-[var(--color-borde)] bg-white px-2 py-1;
  }

  .xestion-citas .citas-contador {
    @apply ml-auto text-[#555];
  }
```

### Comprobar

Al elegir un doctor la tabla cambia al instante; con «Todos» vuelve la lista completa; el
contador cuadra; el PDF trae **solo** lo que se ve.

### Si falla

- El desplegable de doctores está vacío → `doctores` solo se llena al cargar la pantalla:
  comprueba que hay pacientes/doctores cargados (`cargarDatos()`).
- La tabla no cambia → sigues pasando `citas` al `v-for`.
- El PDF exporta todo → no cambiaste `citas.value` por `citasFiltradas.value` en `filas:`.
- Se oculta la tabla entera al no haber coincidencias → el `v-if` del mensaje debe ir dentro
  del contenedor, no sustituir al `v-else-if`.

---

## 4. Buscador sin tildes

**Ficheros:** `src/components/Citas.vue` (usa `src/utils/texto.js`, ya creado).

Requiere la receta 3 (`citasFiltradas`). El buscador **parte de la lista filtrada**, así los
filtros se suman.

### Paso 1 · Importar la utilidad

En los imports de `Citas.vue`, debajo de `import { generarPDF } from "../utils/pdf.js"`:

```js
import { normalizar } from "../utils/texto.js"
```

### Paso 2 · Estado y lista visible

Debajo del `citasFiltradas` de la receta 3:

```js
// Texto del buscador. Se normaliza (sin tildes ni mayusculas) al comparar, asi
// "lopez" encuentra "López" y "NUNEZ" encuentra "Núñez".
const busca = ref("")

const citasVisibles = computed(() => {
  const consulta = normalizar(busca.value)

  if (!consulta) {
    return citasFiltradas.value
  }

  return citasFiltradas.value.filter((item) =>
    normalizar(
      `${item.motivo ?? ""} ${item.observacions ?? ""} ${nombrePaciente(item.pacienteDNI)}`
    ).includes(consulta)
  )
})
```

### Paso 3 · El campo

Dentro de `.citas-filtros`, antes del botón de limpiar:

```vue
          <input
            v-model="busca"
            type="search"
            aria-label="Buscar por motivo, observaciones o paciente"
            placeholder="Buscar por motivo, observacións ou paciente"
          >
```

Y en `limpiarFiltros()`, añade `busca.value = ""`.

### Paso 4 · Tabla y PDF

`v-for="item in citasFiltradas"` → `v-for="item in citasVisibles"` y en `filas:` usa
`citasVisibles.value.map(...)`. En el mensaje y el contador, usa `citasVisibles`.

### Comprobar

Escribir `lopez` encuentra «López»; con el buscador vacío se ven todas las de los filtros;
el PDF respeta búsqueda y filtros.

### Si falla

- No encuentra por tilde → la comparación se hace sin `normalizar()` en alguno de los dos
  lados.
- Buscar una coma o un número no filtra nada → el campo que buscas no está en el
  `${...}` que se normaliza.

---

## 5. PDF con autor y logo

**Fichero:** `src/utils/pdf.js` (+ opcionalmente el `exportar*` de cada pantalla).

### Paso A · Autor en el pie (sin imagen)

En la firma de `generarPDF`, debajo de `orientacion = "portrait",` añade:

```js
  autor = "Javier Guisande Moreira",
```

Y cambia la línea del pie:

```js
      doc.text("Informe generado desde la aplicación", 14, altoPagina - 8);
```

por:

```js
      doc.text(`${autor} · Informe generado desde la aplicación`, 14, altoPagina - 8);
```

### Paso B · Logo (opcional)

Un logo es una imagen: en este proyecto **no hay ninguno** en `src/assets/`, así que este
paso solo tiene sentido si añades un fichero (por ejemplo `src/assets/logo.png`).

En la firma, añade otro parámetro:

```js
  logo = "",
```

Y dentro, después de escribir la fecha:

```js
  if (logo) {
    // 22 x 22 mm en la esquina superior derecha; se pasa como data URL.
    doc.addImage(logo, "PNG", doc.internal.pageSize.getWidth() - 36, 10, 22, 22);
  }
```

Para conseguir la data URL desde la vista (Vite resuelve la ruta del asset):

```js
// Convierte el logo importado en data URL, el formato que entiende jsPDF.
async function logoDataUrl() {
  const respuesta = await fetch(new URL("../assets/logo.png", import.meta.url))
  const blob = await respuesta.blob()

  return await new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(lector.result)
    lector.onerror = () => rechazar(new Error("No se pudo leer el logo"))
    lector.readAsDataURL(blob)
  })
}
```

Y al llamar: `await generarPDF({ ... , logo: await logoDataUrl() })`.

### Comprobar

Genera un informe desde Citas y desde Pacientes: el pie lleva tu nombre y la página, y el
logo aparece arriba a la derecha si lo activaste.

### Si falla

- `addImage` lanza error → el segundo argumento debe ser el formato correcto (`"PNG"`,
  `"JPEG"`) y el contenido una data URL, no una ruta `http`.
- El logo tapa el título → súbelo/bájalo cambiando esas coordenadas (`10` es la Y).

---

## 6. Columna calculada: edad

**Fichero:** `src/components/XestionPacientes.vue`. `nacipac` se guarda (`input type="date"`)
pero no se muestra en la tabla.

### Paso 1 · Cabecera

Añade la columna después de `<th>Apellidos</th>`:

```vue
            <th>Edad</th>
```

### Paso 2 · Celda

Después de `<td>{{ u.apelpac }}</td>`:

```vue
            <td class="centrado">{{ calcularEdad(u.nacipac) }}</td>
```

### Paso 3 · La función

Pega **encima** de `// La API puede devolver el mensaje con distinta clave; usa por defecto un texto`:

```js
// Anios cumplidos a partir de nacipac (AAAA-MM-DD). Se comparan mes y dia en vez de
// restar milisegundos: asi no falla al cambiar de anio ni por la zona horaria.
function calcularEdad(nacimiento) {
  const partes = String(nacimiento ?? "").split("-")

  if (partes.length !== 3) {
    return "—"
  }

  const [anio, mes, dia] = partes.map(Number)
  const hoy = new Date()
  let edad = hoy.getFullYear() - anio

  // Si aun no ha llegado su cumpleanios este anio, todavia no los ha cumplido.
  const cumplePendiente =
    hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)

  if (cumplePendiente) {
    edad -= 1
  }

  return edad >= 0 ? edad : "—"
}
```

### Paso 4 · Al PDF (opcional)

En `exportarPacientes()`, añade `"Edad"` a `cabeceras` y `calcularEdad(paciente.nacipac)` a
`filas`, **en la misma posición** de las dos listas.

### Comprobar

Un paciente nacido el `2000-03-10` muestra `26` el 19/11/2026; uno sin fecha muestra `—`.

### Si falla

- Todo `—` → `nacipac` viene vacío: revisa que se guarde en el formulario.
- Un año de más → comparaste solo el año, sin mirar mes y día.

---

## Si te piden algo que no está aquí

1. ¿Es un **campo nuevo**? Modelo (`backend/modelos/`) → `reactive()` → `v-model` → `<th>` y
   `<td>` → `filas` del PDF. Cinco sitios, mismo nombre.
2. ¿Una **pantalla nueva**? Copia `src/components/PlantillaComponente.vue`, adapta la entidad,
   añade la ruta en `src/router/index.js` y el enlace en `src/components/NavBar.vue`.
3. ¿Un **endpoint**? `backend/rutas/` + montarlo en `backend/server.js` + función en
   `src/api/` + llamada desde el componente.
4. ¿Solo quieren **cambiar el aspecto**? `src/style.css` y `:class`; no toques la lógica.
