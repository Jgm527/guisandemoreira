import axios from 'axios'

// Endpoint de catalogos que contiene provincias y municipios.
const URL = 'http://localhost:3000/api/municipios'

// Obtiene la lista de provincias para mostrarla en el formulario de pacientes.
export async function obtenerProvincias() {
    // El mismo JSON trae municipios, aunque esta funcion solo expone sus provincias.
    const respuesta = await axios.get(URL)

    return respuesta.data.provincias
}

// Filtra el catalogo de municipios por el prefijo de dos digitos de la provincia.
// idProvincia debe ser el codigo id recibido en obtenerProvincias().
export async function obtenerMunicipios(idProvincia) {
    // Se obtiene el catalogo completo y se filtra en el cliente por provincia.
    const respuesta = await axios.get(URL)

    // Coleccion de origen antes de seleccionar municipios del codigo provincial pedido.
    const municipios = respuesta.data.municipios
    return municipios.filter(
        municipio => municipio.id.substring(0, 2) === idProvincia,
    )
}