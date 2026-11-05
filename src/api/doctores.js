import axios from "axios"

// En produccion, sustituye el host local por la direccion publica de la API.
//const API_URL = "https://servidor.com/api";

// URL raiz comun; cada funcion agrega la ruta del recurso doctores.
const API_URL = "http://localhost:3000/api";

// Crea un doctor con los campos que espera el modelo del backend.
export async function saveDoctor(doctor) {
    // Respuesta del endpoint; su cuerpo incluye el documento ya persistido.
    const res = await axios.post(`${API_URL}/doctores`, doctor);
    return res.data;
}

// Devuelve todos los doctores ordenados por apellido, sin distinguir mayusculas.
export async function getDoctores() {
    // La respuesta incluye el array que se ordena antes de devolverlo.
    const res = await axios.get(`${API_URL}/doctores`);
    res.data.sort((a, b) => 
        a.apeldoc.localeCompare(b.apeldoc, "es", { sensitivity: "base" })); 
    // Ordena por apellido de forma ascendente
    return res.data;
}

// Filtra doctores por el nombre exacto de su especialidad.
export async function getDoctorByEspecialidad(especialidad) {
    // La especialidad se envia en la ruta y el backend devuelve sus coincidencias.
    const res = await axios.get(`${API_URL}/doctores/${especialidad}`);
    return res.data;
} 

// Actualiza el doctor identificado por su iddoc.
export async function modifyDoctor(id, doctor) {
    // id localiza el documento; doctor contiene los valores que se guardaran.
    const res = await axios.put(`${API_URL}/doctores/${id}`, doctor);
    return res.data;
}   

// Elimina el doctor identificado por su iddoc.
export async function deleteDoctor(id) {
    // id identifica el doctor que se solicita eliminar.
    const res = await axios.delete(`${API_URL}/doctores/${id}`);
    return res.data;
}
