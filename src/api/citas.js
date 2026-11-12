import axios from "axios"

// Punto de entrada comun para las peticiones HTTP de citas.
const API_URL = "http://localhost:3000/api/citas"

// Devuelve las citas que coinciden con los filtros opcionales y propaga errores HTTP.
export async function getCitas(filtros = {}) {
  // Axios envia los identificadores como query params; si no hay filtros, lista todas.
  const res = await axios.get(API_URL, { params: filtros })
  return res.data
}

// Crea una cita; cita debe incluir las referencias y campos obligatorios del esquema.
export async function saveCita(cita) {
  // Axios serializa cita como JSON en el cuerpo de la peticion POST.
  const res = await axios.post(API_URL, cita)
  return res.data
}

// Actualiza la cita indicada por su identificador de MongoDB.
export async function updateCita(id, cita) {
  // id selecciona el documento y cita contiene los campos nuevos.
  const res = await axios.put(`${API_URL}/${id}`, cita)
  return res.data
}

// Elimina una cita por su identificador de MongoDB.
export async function deleteCita(id) {
  // La peticion DELETE solo necesita el identificador de la cita en la URL.
  const res = await axios.delete(`${API_URL}/${id}`)
  return res.data
}