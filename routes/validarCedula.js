import express from "express";
import { validarCedulaSEP } from "../services/sepService.js";

const router = express.Router();

router.post("/", async (req, res) => {

    try {

        const { cedula } = req.body;

        const resultado = await validarCedulaSEP(cedula);

        res.json(resultado);

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

});

export default router;