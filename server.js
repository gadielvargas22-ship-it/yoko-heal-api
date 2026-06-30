import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import validarCedulaRoute from "./routes/validarCedula.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir peticiones desde la web
app.use(cors());

// Leer JSON
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        proyecto: "YOKO-HEAL Doctor Register API",
        estado: "Servidor funcionando correctamente",
        version: "1.0.0"
    });
});

// Ruta de prueba para validar comunicación
app.get("/api/ping", (req, res) => {
    res.json({
        success: true,
        message: "Conexión exitosa con la API de YOKO-HEAL"
    });
});

app.use("/api/validar-cedula", validarCedulaRoute);
app.listen(PORT, () => {
    console.log(`🚀 API ejecutándose en http://localhost:${PORT}`);
});