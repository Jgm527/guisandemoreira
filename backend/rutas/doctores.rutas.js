import express from "express"
import Doctor from "../modelos/Doctor.js"

// Agrupa las operaciones HTTP disponibles para doctores.
const router = express.Router()

// GET /api/doctores: devuelve todos los doctores como objetos JavaScript simples.
router.get("/", async (req, res) => {
    try {
        // Lista de documentos simplificados para enviarlos en la respuesta JSON.
        const doctores = await Doctor.find().lean()
        res.json(doctores)
    } catch (error) {
        res.status(500).json({ mensaje: ("Error al listar los doctores", error)})
    }
})

// POST /api/doctores: normaliza el movil y crea un documento validado por Mongoose.
router.post("/", async (req, res) => {
    try {
        // Copia el cuerpo para no mutar req.body y quita espacios del numero de contacto.
        const datosDoctor = {
            ...req.body,
            movildoc: String(req.body.movildoc ?? "").replace(/\s+/g, "")
        };

        // El identificador se genera en MongoDB y no debe aceptarse desde el cliente.
        delete datosDoctor.iddoc;

        if (!/^[67]\d{8}$/.test(datosDoctor.movildoc)) {
            return res.status(400).json({
                mensaje: "El móvil debe empezar por 6 o 7 y tener 9 dígitos"
            });
        }

        // Instancia del modelo: Mongoose comprueba los campos obligatorios al guardar.
        const doctor = new Doctor(datosDoctor)
        doctor.iddoc = doctor._id.toString();

        // Documento persistido que se devuelve al cliente con estado HTTP 201.
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

// DELETE /api/doctores/:id: busca por el identificador publico iddoc.
router.delete("/:id", async (req, res) => {
    try {
        // Resultado de la busqueda y eliminacion por el identificador publico iddoc.
        const doctor = await Doctor.findOneAndDelete({ iddoc: req.params.id });
        if (!doctor) {
            return res.status(404).json({ mensaje: "Doctor no encontrado" });
        }
        res.json({ mensaje: "Doctor eliminado" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar el doctor", error });
    }
});

// PUT /api/doctores/:id: valida y reemplaza los campos enviados del doctor.
router.put("/:id", async (req, res) => {
    try {
        // Se trabaja sobre una copia para normalizar el movil sin alterar la peticion.
        const datosDoctor = { ...req.body };
        if (datosDoctor.movildoc !== undefined) {
            datosDoctor.movildoc = String(datosDoctor.movildoc).replace(/\s+/g, "");
            if (!/^[67]\d{8}$/.test(datosDoctor.movildoc)) {
                return res.status(400).json({
                    mensaje: "El móvil debe empezar por 6 o 7 y tener 9 dígitos"
                });
            }
        }

        // Documento actualizado; runValidators aplica las reglas del esquema a los cambios.
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

// GET /api/doctores/:especialidad: filtra doctores por el nombre de especialidad.
router.get("/:especialidad", async (req, res) => {
    try {
        // Lista de doctores cuya especialidad coincide con el segmento de la URL.
        const doctores = await Doctor.find({ especdoc: req.params.especialidad });
        res.json(doctores);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener los doctores", error });
    }
});

export default router;