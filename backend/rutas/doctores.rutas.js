import express from "express"
import Doctor from "../modelos/Doctor.js"

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const doctores = await Doctor.find().lean()
        res.json(doctores)
    } catch (error) {
        res.status(500).json({ mensaje: ("Error al listar los doctores", error)})
    }
})

router.post("/", async (req, res) => {
    try {
        const datosDoctor = {
            ...req.body,
            movildoc: String(req.body.movildoc ?? "").replace(/\s+/g, "")
        };
        delete datosDoctor.iddoc;

        if (!/^[67]\d{8}$/.test(datosDoctor.movildoc)) {
            return res.status(400).json({
                mensaje: "El móvil debe empezar por 6 o 7 y tener 9 dígitos"
            });
        }

        const doctor = new Doctor(datosDoctor)
        doctor.iddoc = doctor._id.toString();

        const nuevoDoctor = await doctor.save()

        res.status(201).json(nuevoDoctor)
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: "Ya existe un doctor con ese ID" });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({ mensaje: error.message });
        }

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
        const datosDoctor = { ...req.body };
        if (datosDoctor.movildoc !== undefined) {
            datosDoctor.movildoc = String(datosDoctor.movildoc).replace(/\s+/g, "");
            if (!/^[67]\d{8}$/.test(datosDoctor.movildoc)) {
                return res.status(400).json({
                    mensaje: "El móvil debe empezar por 6 o 7 y tener 9 dígitos"
                });
            }
        }

        const doctor = await Doctor.findOneAndUpdate(
            { iddoc: req.params.id },
            datosDoctor,
            { new: true, runValidators: true }
        );

        if (!doctor) {
            return res.status(404).json({ mensaje: "Doctor no encontrado" });
        }

        res.json(doctor);
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: "Ya existe un doctor con ese ID" });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ mensaje: error.message });
        }
        res.status(500).json({ mensaje: "Error al modificar el doctor" });
    }
});

router.get("/:especialidad", async (req, res) => {
    try {
        const doctores = await Doctor.find({ especdoc: req.params.especialidad });
        res.json(doctores);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener los doctores", error });
    }
});

export default router;