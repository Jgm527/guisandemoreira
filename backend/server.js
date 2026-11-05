import express from "express";
import fs from "fs";
import cors from "cors";
import "dotenv/config";
import mongoose from 'mongoose' //Importa modulo de conexión a mongoDB

import pacientesRutas from './rutas/pacientes.rutas.js'

import doctoresRutas from './rutas/doctores.rutas.js'
import citasRutas from './rutas/citas.rutas.js'

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const app = express();
app.use(cors());
app.use(express.json());

function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ mensaje: "La base de datos no está disponible." });
  }

  next();
}

app.use("/api/pacientes", requireDatabase, pacientesRutas);
app.use("/api/doctores", requireDatabase, doctoresRutas);
app.use("/api/citas", requireDatabase, citasRutas);
app.get("/api/municipios", (req, res) => {
  const datos = fs.readFileSync(new URL("./data/municipios.json", import.meta.url), "utf-8");
  res.json(JSON.parse(datos));
});

app.get("/api/especialidades", (req, res) => {
  const datos = fs.readFileSync(new URL("./data/especialidades.json", import.meta.url), "utf-8");
  res.json(JSON.parse(datos));
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

if (!MONGO_URI) {
  console.error("MONGO_URI no está configurado; las rutas de base de datos no estarán disponibles.");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado a mongoDB"))
    .catch((error) => console.error("Error de conexión a MongoDB:", error));
}
