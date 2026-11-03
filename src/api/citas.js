import axios from "axios"

const API_URL = "http://localhost:3000/api/citas"

export async function getCitas() {
  const res = await axios.get(API_URL)
  return res.data
}

export async function saveCita(cita) {
  const res = await axios.post(API_URL, cita)
  return res.data
}

export async function updateCita(id, cita) {
  const res = await axios.put(`${API_URL}/${id}`, cita)
  return res.data
}

export async function deleteCita(id) {
  const res = await axios.delete(`${API_URL}/${id}`)
  return res.data
}