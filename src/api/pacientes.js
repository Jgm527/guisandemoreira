import axios from "axios"

// URL raiz de la API; el resto de rutas se agrega en cada operacion.
const API_URL = "http://localhost:3000/api";

// Recupera pacientes y los ordena alfabeticamente por apellido para las listas.
export async function getPacientes() {
    // La respuesta trae todos los registros; se ordenan antes de devolverlos.
    const res = await axios.get(`${API_URL}/pacientes`)
    res.data.sort((a, b) => a.apelpac.localeCompare(b.apelpac, "es", { sensitivity: "base" }))
    return res.data
}

// Crea un paciente con el objeto del formulario y devuelve el documento guardado.
export async function savePaciente(paciente) {
    // paciente contiene el formulario y Axios lo serializa en el cuerpo JSON.
    const res = await axios.post(`${API_URL}/pacientes`, paciente)
    return res.data
}

// Elimina un paciente identificado por su DNI.
export async function deletePaciente(dni) {
    // DNI es el identificador que utiliza el backend para localizar al paciente.
    const res = await axios.delete(`${API_URL}/pacientes/${dni}`)
    return res.data
}

// Actualiza los campos de un paciente identificado por su DNI actual.
export async function modifyPaciente(dni, paciente) {
    // DNI selecciona el documento y paciente contiene los valores nuevos.
    const res = await axios.put(`${API_URL}/pacientes/${dni}`, paciente)
    return res.data
}

// Busca un solo paciente por DNI; Axios rechaza la promesa si el backend responde 404.
export async function getPacienteByDni(dni) {
    // Una respuesta 404 rechaza esta promesa y debe tratarse en el componente llamador.
    const res = await axios.get(`${API_URL}/pacientes/${dni}`)
    return res.data
}