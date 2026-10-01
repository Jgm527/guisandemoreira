import express from "express"
import Paciente from "../modelos/Paciente.js"

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const pacientes = await Paciente.find().lean()
        res.json(pacientes.map(({ nompac, ...paciente }) => ({
            ...paciente,
            nomepac: paciente.nomepac ?? nompac
        })))
    } catch (error) {
        res.status(500).json({ mensaje: ("Error al listar los pacientes", error)})
    }
})

router.post("/", async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);
        const dnipac = String(req.body.dnipac ?? "").trim().toUpperCase();
        const movilpac = String(req.body.movilpac ?? "").replace(/\s+/g, "");

        if (!/^[67]\d{8}$/.test(movilpac)) {
            return res.status(400).json({
                mensaje: "El móvil debe empezar por 6 o 7 y tener 9 dígitos"
            });
        }

        const pacienteDuplicado = await Paciente.findOne({ dnipac });

        if (pacienteDuplicado) {
            return res.status(409).json({
                mensaje: "Ya existe un paciente con ese DNI"
            });
        }

        const paciente = new Paciente({ ...req.body, dnipac, movilpac })

        const nuevoPaciente = await paciente.save()

        res.status(201).json(nuevoPaciente)
        
    } catch (error) {
        console.error("ERROR AL CREAR PACIENTE:", error)

        res.status(500).json({
            mensaje: "Error al crear el paciente"
        })
    }
})

router.delete("/:dni", async (req, res) => {
    try {
        const paciente = await Paciente.findOneAndDelete({ dnipac: req.params.dni });
        if (!paciente) {
            return res.status(404).json({ mensaje: "Paciente no encontrado" });
        }
        res.json({ mensaje: "Paciente eliminado" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar el paciente", error });
    }
});

export default router;