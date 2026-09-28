import express from "express";
import fs from "fs";
import cors from "cors";
import "dotenv/config";
import { MongoClient } from "mongodb"; //Importa modulo de conexión a mongoDB

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);
const app = express();
app.use(cors());

app.get("/api/municipios", (req, res) => {
  console.log("petición recibida");

  const datos = fs.readFileSync("./backend/data/municipios.json", "utf-8");

  const datosJson = JSON.parse(datos);

  res.json(datosJson);
});

async function iniciarServer() {
  try {
    //Conectamos con mongoDB
    await client.connect();
    console.log("Conectado a mongoDB");

    app.listen(PORT, () => {
      console.log("Servidor funcionando en http://localhost:${PORT}");
    });
  } catch (error) {
    console.error("error de conexión:", error);
  }
}

iniciarServer();
