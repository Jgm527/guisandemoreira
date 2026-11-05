import mongoose from "mongoose";

// Esquema de los campos personales y de contacto que almacena cada paciente.
const PacienteSchema = new mongoose.Schema(
  {
    // Datos principales que identifican al paciente dentro de la aplicacion.
    nomepac: { type: String, required: true },
    dnipac: { type: String, required: true },
    apelpac: { type: String, required: true },
    // Datos complementarios; direccion, provincia y municipio pueden faltar.
    nacipac: { type: String, required: false },
    mailpac: { type: String, required: false },
    movilpac: { type: String, required: true },
    dirpac: { type: String, required: false },
    propac: { type: String, required: false },
    munipac: { type: String, required: false },
    // Conserva si se acepto el aviso de privacidad antes del alta.
    lopdpac: { type: Boolean, required: true },
  },
  {
    collection: "pacientes",
  },
);

// Exporta el modelo usado por las rutas de pacientes.
export default mongoose.model("Paciente", PacienteSchema);
