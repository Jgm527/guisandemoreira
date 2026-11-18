/*
  Operaciones de listas para tablas: ordenar y paginar sin modificar el array
  original. Las dos funciones devuelven una lista nueva, de modo que el estado
  que vive en `ref([])` o en la API nunca se reordena por accidente.
*/

// Ordena una copia de la lista por el campo indicado. localeCompare con "es"
// coloca bien la enye y las tildes, cosa que la comparacion de cadenas no hace.
// Los valores nulos se envian al final para que no rompan la comparacion.
export function ordenarPor(lista, clave, ascendente = true) {
  const sentido = ascendente ? 1 : -1
  return [...lista].sort((a, b) => {
    const valorA = a?.[clave] ?? ""
    const valorB = b?.[clave] ?? ""
    return String(valorA).localeCompare(String(valorB), "es") * sentido
  })
}

// Devuelve solo la pagina pedida (base 1). slice no toca el array original y
// devuelve una lista vacia si la pagina queda fuera de rango.
export function paginar(lista, pagina, tamano) {
  const inicio = Math.max(0, (pagina - 1) * tamano)
  return lista.slice(inicio, inicio + tamano)
}

// Numero total de paginas, siempre al menos 1 para poder mostrar "1 / 1"
// cuando la lista esta vacia.
export function totalPaginas(lista, tamano) {
  return Math.max(1, Math.ceil(lista.length / tamano))
}
