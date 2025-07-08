const express = require("express");
const router = express.Router();
const conexion = require("../config/conexion");
const link = require("../config/link");
const { validateCreate } = require('../validaciones/registroU');
const { validationResult } = require('express-validator');
const generatePassword = require('generate-password');
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Mostrar el formulario de registro
router.get("/registroU", function(req, res) {
    res.render("registro", {
        link,
        errors: [], // No hay errores en la primera carga
        oldData: {} // En la primera carga no hay datos previos
    });
});

// Procesar el formulario de registro
router.post("/registroU", validateCreate, async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Si hay errores, renderizamos la vista 'registro' con los errores y datos anteriores
        return res.render("registro", {
            link,
            errors: errors.array(),
            oldData: req.body
        });
    }

    const { nom, ape, ema, num, dni, contra } = req.body;
    const idrolPaciente = 1;

    try {
        // Verificar si el DNI ya existe antes de insertar
        const verificarUsuario = "SELECT * FROM usuarios WHERE dni = ?";
        conexion.query(verificarUsuario, [dni], async (error, rows) => {
            if (error) {
                console.log("TRIKA error en la consulta de verificación", error);
                return res.status(500).send("TRIKA ERROR EN EL SERVIDOR");
            }
            if (rows.length > 0) {
                // Si ya existe un usuario con el DNI
                const mensajesError = [{ msg: "El DNI ya está registrado" }];
                return res.render("registro", {
                    link,
                    errors: mensajesError,
                    oldData: req.body
                });
            }

            // Si el usuario no existe, procede a insertar
            try {
                const hashedPas = await bcrypt.hash(contra, saltRounds);
                
                // Insertar el nuevo usuario
                const insertarUsuario = "INSERT INTO usuarios (dni, contrasena, rol_id) VALUES (?, ?, ?)";
                conexion.query(insertarUsuario, [dni, hashedPas, idrolPaciente], (error, result) => {
                    if (error) {
                        console.log("TRIKA error al insertar usuario", error);
                        return res.status(500).send("Error al registrar el usuario");
                    }
                    const user_id = result.insertId;

                    // Insertar datos en la tabla de pacientes
                    const insertarPaciente = "INSERT INTO pacientes (nombre, apellido, telefono, email, usuario_id) VALUES (?, ?, ?, ?, ?)";
                    conexion.query(insertarPaciente, [nom, ape, num, ema, user_id], (error) => {
                        if (error) {
                            console.log("TRIKA error al insertar paciente", error);
                            return res.status(500).send("Error al registrar el paciente");
                        }
                        console.log("TRIKA datos almacenados correctamente");
                        return res.redirect(link + "login");
                    });
                });
            } catch (error) {
                console.log("TRIKA error al hashear la contraseña", error);
                return res.status(500).send("Error al procesar la solicitud");
            }
        });
    } catch (error) {
        console.log("TRIKA error en el proceso general", error);
        return res.status(500).send("TRIKA ERROR EN EL SERVIDOR");
    }
});

router.get("/suggestion-password", async (req, res) => {
    const password = generatePassword.generate({
        length: 12,
        numbers: true,
        symbols: true,
        uppercase: true,
        lowercase: true,
        excludeSimilarCharacters: true
    });
    res.status(200).send({ "text": password });
});

module.exports = router;
