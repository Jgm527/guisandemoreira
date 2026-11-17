import mongoose from "mongoose";

// Esquema de los datos persistidos para cada doctor.
const DoctorSchema = new mongoose.Schema(
  {
    // Datos de identificacion y contacto requeridos en el alta.
    nomedoc: { type: String, required: true },
    apeldoc: { type: String, required: true },
    coledoc: { type: String, required: true },
    movildoc: { type: String, required: true },
    // El correo es opcional, por eso no se obliga al usuario a introducirlo.
    maildoc: { type: String, required: false },
    // El nombre debe coincidir con una de las especialidades disponibles.
    espedoc: { type: String, required: true },
  },
  {
    collection: "doctores",
  },
);

// Exporta el modelo empleado por las rutas para consultar y modificar doctores.
export default mongoose.model("Doctor", DoctorSchema);
