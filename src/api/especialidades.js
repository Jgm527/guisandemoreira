import axios from "axios";

// Endpoint que entrega el catalogo estatico de especialidades del backend.
const URL = "http://localhost:3000/api/especialidades";

// Devuelve el array de especialidades listo para poblar un selector Vue.
export async function obtenerEspecialidades() {
  // respuesta contiene el estado HTTP y el JSON devuelto por Express.
  const respuesta = await axios.get(URL);
  return respuesta.data.especialidades;
}