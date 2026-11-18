/*
  Utilidades de texto compartidas por formularios y buscadores.
  Se mantienen sin dependencias para poder usarlas en cualquier componente.
*/

// Pone en mayuscula la primera letra de cada palabra y el resto en minuscula:
// "jUAN  perez" -> "Juan Perez". Se divide por uno o varios espacios para que
// los espacios dobles no generen palabras vacias.
export function capitalizar(texto) {
  return String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((palabra) =>
      palabra
        ? palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
        : ""
    )
    .join(" ")
}

// Deja el texto comparable en busquedas: sin tildes, sin mayusculas y sin
// espacios en los extremos. normalize("NFD") separa cada letra de su tilde y la
// expresion regular elimina esas tildes sueltas, de modo que "lopez" encuentra
// "López" y "NUNEZ" encuentra "Núñez".
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}
