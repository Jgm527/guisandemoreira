import express from "express"
import Paciente from "../modelos/Paciente.js"

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const pacientes = await Paciente.find()
        res.json(pacientes)
    } catch (error) {
        res.status(500).json({ mensaje: ("Error al listar los pacientes", error)})
    }
})

router.post("/", async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);
        const paciente = new Paciente(req.body)

        const nuevoPaciente = await paciente.save()

        res.status(201).json(nuevoPaciente)
        
    } catch (error) {
        console.error("ERROR AL CREAR PACIENTE:", error)

        res.status(500).json({
            mensaje: "Error al crear el paciente"
        })
    }
})

export default router;