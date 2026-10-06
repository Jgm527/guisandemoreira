import express from "express"
import Doctor from "../modelos/Doctor.js"

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const doctores = await Doctor.find().lean()
        res.json(doctores.map(({ nomedoc, ...doctor }) => ({
            ...doctor,
            nomepac: doctor.nomedoc ?? nomedoc
        })))
    } catch (error) {
        res.status(500).json({ mensaje: ("Error al listar los doctores", error)})
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

        const doctorDuplicado = await Doctor.findOne({ iddoc: req.body.iddoc });

        if (doctorDuplicado) {
            return res.status(409).json({
                mensaje: "Ya existe un doctor con ese ID"
            });
        }

        const doctor = new Doctor({ ...req.body, dnipac, movilpac })

        const nuevoDoctor = await doctor.save()

        res.status(201).json(nuevoDoctor)
        
    } catch (error) {
        console.error("ERROR AL CREAR DOCTOR:", error)

        res.status(500).json({
            mensaje: "Error al crear el doctor"
        })
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const doctor = await Doctor.findOneAndDelete({ iddoc: req.params.id });
        if (!doctor) {
            return res.status(404).json({ mensaje: "Doctor no encontrado" });
        }
        res.json({ mensaje: "Doctor eliminado" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar el doctor", error });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const doctor = await Doctor.findOneAndUpdate(
            { iddoc: req.params.id },
            req.body,
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({ mensaje: "Doctor no encontrado" });
        }

        res.json(doctor);
        
    } catch {
        res.status(500).json({ mensaje: "Error al modificar el doctor" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ iddoc: req.params.id }).lean();
        if (!doctor) {
            return res.status(404).json({ mensaje: "Doctor no encontrado" });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al buscar el doctor", error });
    }
});

export default router;