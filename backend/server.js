import express from 'express'
import fs from 'fs'
import cors from 'cors'

const PORT = 3000;
const app = express()
app.use(cors())

app.get('/api/municipios', (req, res) => {
    console.log("petición recibida")

    const datos = fs.readFileSync(
        './backend/data/municipios.json',
        'utf-8'
    )

    const datosJson = JSON.parse(datos)

    res.json(datosJson)
})

app.listen(PORT, () => {
    console.log('Servidor funcionando en http://localhost:${PORT}')
})