import express from "express"
import Paciente from "../modelos/Paciente.js"

// Agrupa las operaciones HTTP disponibles para pacientes.
const router = express.Router()

// GET /api/pacientes: lista pacientes y mantiene compatibilidad con el campo antiguo nompac.
router.get("/", async (req, res) => {
    try {
        // Lista simple que luego se adapta para mantener compatibilidad con registros antiguos.
        const pacientes = await Paciente.find().lean()
        // La respuesta usa nomepac; nompac solo se consulta para registros antiguos.
        res.json(pacientes.map(({ nompac, ...paciente }) => ({
            ...paciente,
            nomepac: paciente.nomepac ?? nompac
        })))
    } catch (error) {
        res.status(500).json({ mensaje: ("Error al listar los pacientes", error)})
    }
})

// POST /api/pacientes: normaliza DNI y movil, comprueba duplicados y crea el paciente.
router.post("/", async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);
        // Canoniza el DNI para que mayusculas y espacios no creen duplicados distintos.
        const dnipac = String(req.body.dnipac ?? "").trim().toUpperCase();
        // Quita espacios del numero antes de validar el formato nacional admitido.
        const movilpac = String(req.body.movilpac ?? "").replace(/\s+/g, "");

        if (!/^[67]\d{8}$/.test(movilpac)) {
            return res.status(400).json({
                mensaje: "El móvil debe empezar por 6 o 7 y tener 9 dígitos"
            });
        }

        // Evita altas con un DNI que ya pertenece a otro documento.
        const pacienteDuplicado = await Paciente.findOne({ dnipac });

        if (pacienteDuplicado) {
            return res.status(409).json({
                mensaje: "Ya existe un paciente con ese DNI"
            });
        }

        // Conserva el resto de datos del formulario y sustituye los campos normalizados.
        const paciente = new Paciente({ ...req.body, dnipac, movilpac })

        // Documento confirmado por MongoDB que se devuelve a quien hizo el alta.
        const nuevoPaciente = await paciente.save()

        res.status(201).json(nuevoPaciente)
        
    } catch (error) {
        console.error("ERROR AL CREAR PACIENTE:", error)
        res.status(500).json({
            mensaje: "Error al crear el paciente"
        })
    }
})

// DELETE /api/pacientes/:dni: elimina el paciente usando su DNI como identificador publico.
router.delete("/:dni", async (req, res) => {
    try {
        // Documento eliminado o null si ningun paciente coincide con el DNI recibido.
        const paciente = await Paciente.findOneAndDelete({ dnipac: req.params.dni });
        if (!paciente) {
            return res.status(404).json({ mensaje: "Paciente no encontrado" });
        }
        res.json({ mensaje: "Paciente eliminado" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar el paciente", error });
    }
});

// PUT /api/pacientes/:dni: actualiza los campos de un paciente identificado por DNI.
router.put("/:dni", async (req, res) => {
    try {
        // Devuelve el paciente con los campos nuevos tras localizarlo por su DNI actual.
        const paciente = await Paciente.findOneAndUpdate(
            { dnipac: req.params.dni },
            req.body,
            { new: true }
        );

        if (!paciente) {
            return res.status(404).json({ mensaje: "Paciente no encontrado" });
        }

        res.json(paciente);
        
    } catch {
        res.status(500).json({ mensaje: "Error al modificar el paciente" });
    }
});

// GET /api/pacientes/:dni: devuelve un paciente o un 404 si no existe.
router.get("/:dni", async (req, res) => {
    try {
        // Consulta individual convertida a objeto simple para formar la respuesta JSON.
        const paciente = await Paciente.findOne({ dnipac: req.params.dni }).lean();
        if (!paciente) {
            return res.status(404).json({ mensaje: "Paciente no encontrado" });
        }
        res.json(paciente);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al buscar el paciente", error });
    }
});

export default router;