# Checklist

Cinco minutos al empezar y cinco al acabar.

## Al empezar

1. **MongoDB:** `docker compose up -d` (contenedor `mongodb`, puerto 27017).
2. **`.env`:** existe y tiene `MONGO_URI` y `PORT`.
3. **Arrancar:** `npm run start` (Vite en 5173 y API en 3000 a la vez). Abre la web y
   comprueba que carga la lista de pacientes.
4. **Consola abierta** (F12 → Console): cualquier error rojo se ve ahí.
5. **Lee el enunciado entero** antes de tocar nada y **numera** los apartados. Subraya los
   datos concretos: nombres de campo, textos exactos, en qué pantalla.
6. Busca la frase en [`recetas.md`](recetas.md).

## Mientras haces cada apartado

- Cambia **una cosa a la vez** y mira la web antes de seguir.
- Si tocas `backend/`, **reinicia** (no recarga solo).
- Un campo nuevo va en **cuatro sitios**: modelo Mongoose → `reactive()` del formulario →
  `v-model` en el template → columna de la tabla (y el PDF, si hay informe).
- Los nombres de campo deben ser **idénticos** en modelo, ruta, `src/api/`, formulario y
  template (`nacipac` en los cinco).
- Textos de interfaz en gallego, como el resto de la app.
- Compila a menudo: `npm run build` tarda poco y detecta imports rotos.

## Antes de entregar

| Comprobación | Comando o cómo |
|---|---|
| Sin errores de ESLint | `npx eslint .` (los `warning` no bloquean; los `error` sí) |
| Compila | `npm run build` |
| Consola limpia | Recarga con F12 abierto y recorre las pantallas que tocaste |
| Caso feliz probado | Crea, edita y borra algo con tu cambio |
| Caso malo probado | Campo vacío, duplicado, id inexistente |
| Backend reiniciado | Para que la entrega funcione con el código guardado |
| Sin restos | Nada de `console.log` de pruebas ni código comentado |
| PDF abierto | Si el enunciado lo pide, descárgalo y ábrelo |

## Datos del examen (Aula Virtual)

Del informe del compañero sobre la tarea de Moodle, contrastado con la tarea que aparece en
el curso `DIW_26_27_Ord`:

| | |
|---|---|
| Cuándo | Jueves **19/11/2026**, 09:30–11:30 (2 h) |
| Tarea | "ENTREGA EXAME PRÁCTICO 19 NOVEMBRO 2026" (sección EXAMES) |
| Qué se entrega | **Ficheros** adjuntos (hasta 20, 2 GB), un solo intento |
| Nota | Sobre 10 |

Ensaya la entrega una vez: `npm run build`, `.zip` del proyecto sin `node_modules` ni
`.git` (o con `node_modules`, el límite de 2 GB lo permite) y súbelo a la tarea
comprobando que quedó registrado.

## El día del examen, en orden

1. Arrancar y comprobar que la app carga datos.
2. Leer y numerar los apartados del enunciado.
3. Por cada apartado: buscar en `recetas.md` → aplicar → comprobar en el navegador.
4. Lo que se atasque más de 15 minutos, dejarlo para el final.
5. Últimos 10 minutos: ESLint, build, consola, repaso de la lista numerada y entrega.
