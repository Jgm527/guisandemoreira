# Errores típicos: síntoma, causa y arreglo

Busca el síntoma. Casi siempre la causa está en la primera columna. Los ficheros que se
nombran son los de este proyecto.

## En el navegador (F12 → Console)

| Qué ves | Causa probable | Arreglo |
|---|---|---|
| Pantalla en blanco | Error en el `<script setup>` o un import mal escrito | Console muestra el primer error en rojo con fichero y línea |
| `X is not defined` | Falta el `import` o la variable está dentro de otra función | Los imports van arriba del `<script setup>` y las variables al nivel del script |
| `Failed to resolve import` | Ruta equivocada | Cuenta los `../` y comprueba el nombre exacto del fichero |
| `Cannot read properties of undefined` | Lees algo que todavía no llegó de la API | Usa `?.` (`item.doctorId?._id`) o `v-if` |
| `usePacienteStore is not a function` | El export real es `usepacienteStore` (p minúscula) | Mira el `export` del store y usa el nombre exacto |
| El dato no se actualiza en pantalla | Desestructuraste un store sin `storeToRefs` | `const { dnipac } = storeToRefs(pacienteStore)` |
| La tabla no cambia al filtrar | La tabla lee `citas` y no la lista filtrada, o falta `.value` en el script | Pasa `citasFiltradas` al `v-for` y usa `.value` dentro del script |
| `x-invalid-end-tag` al compilar | Pegaste código entre los atributos de una etiqueta | Pega siempre encima o debajo de una etiqueta completa |
| `Network Error` | El backend no está arrancado o el puerto no coincide | `npm run start`; mira `PORT` en `.env` y la URL de `src/api/` |
| `404` en una petición | La URL no existe en Express | Mira la pestaña Network y compárala con `backend/rutas/` |
| `409` al guardar | DNI, correo o cita repetidos | Es una regla del servidor; revisa los datos, no el código |
| El PDF sale con un campo vacío | La columna nueva no está en el `filas:` de `generarPDF` | Añádela al array, en el mismo orden que las `cabeceras` |
| SweetAlert no espera a la confirmación | Falta `await` o no miras `isConfirmed` | `const r = await alertaConfirmacion(...)` y después `if (!r.isConfirmed) return` |
| `:key` duplicada en la consola | Dos filas con la misma clave (por ejemplo, `:key="index"` al reordenar) | Usa un id real: `:key="item._id"` |

## En la terminal del backend

| Qué ves | Causa probable | Arreglo |
|---|---|---|
| El cambio no hace nada | El backend no recarga solo | Ctrl+C y `npm run start` (o `node backend/server.js`) |
| `MongoServerError ... ECONNREFUSED` | MongoDB no está levantado | `docker compose up -d` (contenedor `mongodb`) |
| `MongooseServerSelectionError` | Base o usuario mal en `MONGO_URI` | Revisa `.env`; credenciales del `docker-compose.yaml` |
| `400` con mensaje | Falla una validación del modelo (`required`, `match`, `validate`) | El mensaje dice qué campo |
| Un campo nuevo no se guarda | Falta en el esquema: Mongoose descarta lo que no conoce | Añádelo en `backend/modelos/` y reinicia |
| `Cannot find module` / `require is not defined` | El proyecto es ESM (`"type": "module"`) | Usa `import ... from` en vez de `require` |
| `ERR_MODULE_NOT_FOUND ../utils/alertas.js` | Importaste un fichero del frontend en el backend o al revés con ruta mala | Los modelos y rutas están en `backend/`; `utils/` es solo del frontend |

## Cómo buscar el fallo en 4 pasos

1. ¿Sale algo rojo en la **consola del navegador**? Empieza por ahí.
2. ¿Llega la petición? Pestaña **Network**: código de estado y respuesta.
3. ¿Falla el servidor? Mira la **terminal** donde corre el backend.
4. Si nada de eso lo explica, pon un `console.log(valor)` justo antes de la línea
   sospechosa; bórralo al terminar.

## Fallos que cuestan puntos aunque "funcione"

- `console.log` de pruebas y código comentado "por si acaso".
- Mensajes al usuario en inglés o mezclados: en esta app el texto de interfaz va en gallego
  ("Non hai citas cargadas", "Gardar") y el código comentado en español.
- Un botón dentro de un formulario sin `type="button"` que envía sin querer.
- Recargar toda la lista a mano en lugar de usar la respuesta de la API cuando ya la tienes.
- Campos sin `<label for>` o botones de icono sin `aria-label`.
