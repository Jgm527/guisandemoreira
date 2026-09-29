import mongoose from "mongoose";

const PacienteSchema = new mongoose.Schema(
  {
    nompac: { type: String, required: true },
    dnipac: { type: String, required: true },
    apelpac: { type: String, required: true },
    nacipac: { type: String, required: true },
    mailpac: { type: String, required: true },
    movilpac: { type: String, required: true },
    dirpac: { type: String, required: true },
    propac: { type: String, required: true },
    munipac: { type: String, required: true },
    activo: { type: Boolean, default: true },
    tipoCuenta: { type: String, enum: ["particular", "empresa"], default: "particular" },
  },
  {
    Collection: "pacientes",
  },
);

export default mongoose.model("Paciente", PacienteSchema);
