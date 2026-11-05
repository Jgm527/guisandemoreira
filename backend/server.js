import express from "express";
import fs from "fs";
import cors from "cors";
import "dotenv/config";
import mongoose from 'mongoose' //Importa modulo de conexión a mongoDB

import pacientesRutas from './rutas/pacientes.rutas.js'

import doctoresRutas from './rutas/doctores.rutas.js'
import citasRutas from './rutas/citas.rutas.js'

// Puerto HTTP en el que escucha Express; si no se define, se usa el valor habitual 3000.
const PORT = process.env.PORT || 3000;
// URI de MongoDB leida del entorno para no guardar credenciales de conexion en el codigo.
const MONGO_URI = process.env.MONGO_URI;
// Aplicacion Express compartida por todas las rutas del backend.
const app = express();
// Permite peticiones desde el cliente Vite y convierte cuerpos JSON en req.body.
app.use(cors());
app.use(express.json());

// Impide que las rutas de datos accedan a Mongoose mientras MongoDB no este conectado.
function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ mensaje: "La base de datos no está disponible." });
  }

  next();
}

// Las rutas que consultan modelos requieren una conexion activa a la base de datos.
app.use("/api/pacientes", requireDatabase, pacientesRutas);
app.use("/api/doctores", requireDatabase, doctoresRutas);
app.use("/api/citas", requireDatabase, citasRutas);

// Los catalogos JSON son estaticos y pueden servirse aunque MongoDB no este disponible.
app.get("/api/municipios", (req, res) => {
  // La ruta se resuelve respecto a este archivo, no al directorio desde donde se lance Node.
  // datos conserva el texto JSON que se analiza y envia como respuesta HTTP.
  const datos = fs.readFileSync(new URL("./data/municipios.json", import.meta.url), "utf-8");
  res.json(JSON.parse(datos));
});

app.get("/api/especialidades", (req, res) => {
  // datos contiene el catalogo estatico que se devuelve en formato JSON.
  const datos = fs.readFileSync(new URL("./data/especialidades.json", import.meta.url), "utf-8");
  res.json(JSON.parse(datos));
});

// Inicia HTTP sin esperar a MongoDB, para que los catalogos sigan disponibles ante una caida.
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

if (!MONGO_URI) {
  // Sin URI las rutas protegidas responderan 503; el servidor y los JSON siguen activos.
  console.error("MONGO_URI no está configurado; las rutas de base de datos no estarán disponibles.");
} else {
  // Registra la conexion y deja el error visible si no se puede establecer.
  mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado a mongoDB"))
    .catch((error) => console.error("Error de conexión a MongoDB:", error));
}
