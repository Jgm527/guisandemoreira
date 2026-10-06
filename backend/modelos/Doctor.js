import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    iddoc: { type: String, required: true, unique: true },
    nomedoc: { type: String, required: true },
    apeldoc: { type: String, required: true },
    coledoc: { type: String, required: true },
    movildoc: { type: String, required: true },
    maildoc: { type: String, required: false },
    especdoc: { type: String, required: true },
  },
  {
    Collection: "doctores",
  },
);

export default mongoose.model("Doctor", DoctorSchema);
