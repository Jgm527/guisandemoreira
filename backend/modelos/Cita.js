
/*
  Modelo Mongoose de las citas.

  Se guarda el DNI del paciente como texto y el doctor como referencia (ObjectId), no como
  documento incrustado: asi cambiar los datos de un doctor no obliga a reescribir sus citas.
  Mongoose solo conserva los campos que estan declarados aqui.
*/
import mongoose from "mongoose";

// collection fija el nombre exacto en MongoDB; sin el, Mongoose lo pluralizaria y cambiaria.
const CitaSchema = new mongoose.Schema(
    {
        // DNI del paciente (texto). Se valida en la ruta, que comprueba que exista.
        pacienteDNI: {
            type: String,
            required: true
        },
        // Referencia al documento Doctor; populate puede sustituirla por el objeto completo.
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true
        },
        // Fecha como texto AAAA-MM-DD: el input de tipo date ya trabaja en ese formato.
        fecha: { type: String, required: true },
        // Hora como texto HH:MM, igual que el input de tipo time.
        hora: { type: String, required: true },
        // Motivo de la consulta; el formulario lo limita a 250 caracteres.
        motivo: { type: String, required: true },
        // Observaciones opcionales: si no llegan, se guarda cadena vacia en lugar de null.
        observacions: {
            type: String,
            default: ""
        },
        // Estado del ciclo de la cita: pendente, confirmada, realizada o cancelada.
        estado: {
            type: String,
            default: "pendente"
        }
    },
    {
        collection: "citas"
    }
);

// El modelo se reutiliza desde las rutas de citas para consultar y guardar documentos.
export default mongoose.model("Cita", CitaSchema);
