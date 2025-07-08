const { check } = require('express-validator');
const conexion = require("../config/conexion");
const bcrypt = require("bcrypt");

const validateItem = [
    check('dni')
        .notEmpty().withMessage('El DNI es obligatorio')
        .isLength({ min: 8, max: 8 }).withMessage('El DNI debe tener 8 dígitos')
        .isNumeric().withMessage('El DNI debe contener solo números'),

    check('contra')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
        .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
        .custom(async (value, { req }) => {
            const validar = "SELECT * FROM usuarios WHERE dni = ?";
            try {
                const [rows] = await conexion.promise().query(validar, [req.body.dni]);
                if (rows.length < 1) {
                    // Si el DNI no existe en la base de datos
                    throw new Error("El DNI no está registrado");
                }

                const user = rows[0];
                const contrasenaBD = user.contrasena;

                let match = false;
                if (contrasenaBD.startsWith("$2b$")) {
                    // Contraseña encriptada
                    match = await bcrypt.compare(value, contrasenaBD);
                } else {
                    // Contraseña en texto plano
                    match = value === contrasenaBD;

                    // Encriptar la contraseña en texto plano para seguridad futura
                    if (match) {
                        const nuevaContrasenaHash = await bcrypt.hash(value, 10);
                        const actualizar = "UPDATE usuarios SET contrasena = ? WHERE id = ?";
                        await conexion.promise().query(actualizar, [nuevaContrasenaHash, user.id]);
                        console.log(`Contraseña del usuario con ID ${user.id} encriptada correctamente.`);
                    }
                }

                if (!match) {
                    throw new Error("La contraseña es incorrecta");
                }
                return true;
            } catch (error) {
                throw new Error(error.message || "Error en la validación");
            }
        })
];

module.exports = { validateItem };
