# Documentación de estudio

Material de repaso para el examen práctico de DIW, escrito **para este repositorio**:
los ficheros, los nombres de los campos y los comandos que aparecen aquí son los de
esta app (clínica con Vue 3 + Express + MongoDB), no los de otro proyecto.

| Documento | Para qué |
|---|---|
| [`teoria.md`](teoria.md) | Preguntas de teoría con respuesta corta y cómo defender tu código |
| [`glosario.md`](glosario.md) | Las palabras que se repiten, en una línea cada una |
| [`errores-tipicos.md`](errores-tipicos.md) | Síntoma → causa → arreglo |
| [`checklist.md`](checklist.md) | Qué comprobar al empezar, durante y antes de entregar |
| [`recetas.md`](recetas.md) | Seis cambios típicos del examen, con el código y el punto exacto de inserción |

## Antes de nada

```bash
npm install            # solo la primera vez
docker compose up -d   # MongoDB (contenedor "mongodb", puerto 27017)
npm run start          # Vite en 5173 + API en 3000
```

El proyecto **no tiene script `lint`**: se pasa ESLint a mano con `npx eslint .` y se
comprueba la compilación con `npm run build`.

## Cómo usar esto en el examen

1. Lee el enunciado entero y **numera** los apartados.
2. Por cada apartado, busca la frase en [`recetas.md`](recetas.md). Si está, es copiar
   el código en el punto indicado y adaptar un nombre.
3. De lo fácil a lo difícil. Compila (`npm run build`) después de cada apartado.
4. Si algo falla, [`errores-tipicos.md`](errores-tipicos.md). Si te atascas más de
   15 minutos, pasa al siguiente apartado y vuelve luego.
5. Últimos 10 minutos: `npx eslint .`, `npm run build`, consola limpia (F12) y repasar
   la lista numerada del principio.
