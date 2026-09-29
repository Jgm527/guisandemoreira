import express from "express";
import fs from "fs";
import cors from "cors";
import "dotenv/config";
import mongoose from 'mongoose' //Importa modulo de conexión a mongoDB

import pacientesRutas from './rutas/pacientes.rutas.js'

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/pacientes", pacientesRutas);
app.get("/api/municipios", (req, res) => {
  console.log("petición recibida");

  const datos = fs.readFileSync("./backend/data/municipios.json", "utf-8");

  const datosJson = JSON.parse(datos);

  res.json(datosJson);
});

async function iniciarServer() {
  try {
    //Conectamos con mongoDB
    await mongoose.connect(MONGO_URI);
    console.log("Conectado a mongoDB");

    app.listen(PORT, () => {
      console.log(`Servidor funcionando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("error de conexión:", error);
  }
}

iniciarServer();
