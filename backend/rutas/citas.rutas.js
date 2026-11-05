import express from "express"
import Cita from "../modelos/Cita.js"
import Doctor from "../modelos/Doctor.js"
import Paciente from "../modelos/Paciente.js"

const router = express.Router()

const camposCita = [
    "pacienteId",
    "doctorId",
    "fecha",
    "hora",
    "motivo",
    "observacions",
    "estado"
]

function datosPermitidos(body) {
    const datosRecibidos = body ?? {}
    return Object.fromEntries(
        camposCita
            .filter((campo) => datosRecibidos[campo] !== undefined)
            .map((campo) => [campo, datosRecibidos[campo]])
    )
}

async function validarRelaciones(datos) {
    if (datos.pacienteId && !(await Paciente.exists({ _id: datos.pacienteId }))) {
        return "El paciente seleccionado no existe"
    }

    if (datos.doctorId && !(await Doctor.exists({ _id: datos.doctorId }))) {
        return "El doctor seleccionado no existe"
    }

    return ""
}

router.get("/", async (req, res) => {
    try {
        const citas = await Cita.find().sort({ fecha: 1, hora: 1 }).lean()
        res.json(citas)
    } catch (error) {
        console.error("Error al listar las citas:", error)
        res.status(500).json({ mensaje: "Error al listar las citas" })
    }
})

router.post("/", async (req, res) => {
    try {
        const datos = datosPermitidos(req.body)
        const errorRelacion = await validarRelaciones(datos)

        if (errorRelacion) {
            return res.status(400).json({ mensaje: errorRelacion })
        }

        const cita = await Cita.create(datos)
        res.status(201).json(cita)
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ mensaje: error.message })
        }

        console.error("Error al crear la cita:", error)
        res.status(500).json({ mensaje: "Error al crear la cita" })
    }
})

router.put("/:id", async (req, res) => {
    try {
        const datos = datosPermitidos(req.body)
        const errorRelacion = await validarRelaciones(datos)

        if (errorRelacion) {
            return res.status(400).json({ mensaje: errorRelacion })
        }

        const cita = await Cita.findByIdAndUpdate(
            req.params.id,
            datos,
            { new: true, runValidators: true }
        )

        if (!cita) {
            return res.status(404).json({ mensaje: "Cita no encontrada" })
        }

        res.json(cita)
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ mensaje: error.message })
        }

        console.error("Error al modificar la cita:", error)
        res.status(500).json({ mensaje: "Error al modificar la cita" })
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const cita = await Cita.findByIdAndDelete(req.params.id)

        if (!cita) {
            return res.status(404).json({ mensaje: "Cita no encontrada" })
        }

        res.json({ mensaje: "Cita eliminada" })
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ mensaje: "El ID de la cita no es válido" })
        }

        console.error("Error al eliminar la cita:", error)
        res.status(500).json({ mensaje: "Error al eliminar la cita" })
    }
})

export default router
