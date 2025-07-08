const { check, body } = require('express-validator');
const conexion = require('../config/conexion');

const validateCreate = [
    check('nom')
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres')
        .matches(/^[^\s]+$/).withMessage('El nombre no debe contener espacios'),

    check('ape')
        .notEmpty().withMessage('El apellido es obligatorio')
        .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres')
        .matches(/^[^\s]+$/).withMessage('El apellido no debe contener espacios'),

    // Validación personalizada para verificar que nombre y apellido no estén registrados juntos
    body(['nom', 'ape']).custom(async (value, { req }) => {
        const { nom, ape } = req.body;
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM pacientes WHERE nombre = ? AND apellido = ?";
            conexion.query(query, [nom, ape], (error, rows) => {
                if (error) {
                    reject(new Error("Error en el servidor al verificar nombre y apellido"));
                }
                if (rows.length > 0) {
                    reject(new Error("El nombre y apellido ya están registrados juntos"));
                }
                resolve(true);
            });
        });
    }),

    check('ema')
        .isEmail().withMessage('Debe ser un correo válido')
        .notEmpty().withMessage('El correo es obligatorio'),
    
    // Validación personalizada para verificar que el email no esté registrado
    body('ema').custom(async (email) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM pacientes WHERE email = ?";
            conexion.query(query, [email], (error, rows) => {
                if (error) {
                    reject(new Error("Error en el servidor al verificar el correo"));
                }
                if (rows.length > 0) {
                    reject(new Error("El correo ya está registrado"));
                }
                resolve(true);
            });
        });
    }),

    check('num')
        .notEmpty().withMessage('El celular es obligatorio')
        .isMobilePhone('es-PE').withMessage('Debe ser un número de celular válido'),

    // Validación personalizada para verificar que el número no esté registrado
    body('num').custom(async (numero) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM pacientes WHERE telefono = ?";
            conexion.query(query, [numero], (error, rows) => {
                if (error) {
                    reject(new Error("Error en el servidor al verificar el celular"));
                }
                if (rows.length > 0) {
                    reject(new Error("El número de celular ya está registrado"));
                }
                resolve(true);
            });
        });
    }),

    check('dni')
        .notEmpty().withMessage('El DNI es obligatorio')
        .isLength({ min: 8, max: 8 }).withMessage('El DNI debe tener 8 dígitos')
        .isNumeric().withMessage('El DNI debe contener solo números'),

    check('contra')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
        .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),

    check('confirm_contra')
        .custom((value, { req }) => {
            if (value !== req.body.contra) {
                throw new Error('Las contraseñas no coinciden.');
            }
            return true;
        }),
];

module.exports = { validateCreate };
