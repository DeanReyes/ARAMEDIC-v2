const express = require("express");
const router= express.Router();
const conexion=require("../config/conexion");
const link= require("../config/link");
const checkLoginPaciente = require('../validaciones/authPaciente');
const bcrypt = require("bcrypt");

router.get("/dashboard_paciente", function(req, res){
    const data = {
        'total_citas':0,
        'titulo' : 'pagina de calendario',
        'usuario': req.session,
        'link' : link,
    };
    res.render("dashboard_paciente/calendario", data);
});

// GET: Ver perfil del paciente
const { check, validationResult } = require("express-validator");

// GET: Perfil del paciente
router.get("/dashboard_paciente/perfil", checkLoginPaciente, async (req, res) => {
    try {
        const idusuario = req.session.paciente_id;

        const consultaPaciente = `
            SELECT 
                p.nombre, 
                p.apellido, 
                p.fecha_nacimiento, 
                p.genero, 
                p.estado_civil, 
                p.ocupacion, 
                p.telefono, 
                p.email, 
                p.direccion,
                u.contrasena  
            FROM pacientes p
            JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.id = ?
        `;

        conexion.query(consultaPaciente, [idusuario], (error, rows) => {
            if (error) {
                console.error("Error al obtener el perfil:", error);
                return res.status(500).send("Error al cargar el perfil.");
            }

            if (rows.length < 1) {
                console.log("Paciente no encontrado.");
                return res.status(404).send("Paciente no encontrado.");
            }

            const paciente = rows[0];

            res.render("dashboard_paciente/perfil", {
                titulo: "Perfil del Paciente",
                usuario: req.session,
                paciente,
                link,
            });
        });
    } catch (error) {
        console.error("Error al cargar los datos del paciente:", error);
        res.status(500).send("Error al cargar el perfil.");
    }
});

// POST: Editar perfil del paciente
router.post("/dashboard_paciente/perfil/editar", checkLoginPaciente, async (req, res) => {
    const errors = validationResult(req);  // Valida los errores de los campos
    if (!errors.isEmpty()) {
        return res.render("dashboard_paciente/perfil", {
            link,
            errors: errors.array(),
            oldData: req.body
        });
    }

    const { nombre, apellido, fecha_nacimiento, genero, estado_civil, ocupacion, telefono, email, direccion, contrasena } = req.body;
    const idPaciente = req.session.paciente_id;  // Obtiene el ID del paciente de la sesión

    try {
        // Consulta para actualizar los datos del paciente
        const updatePacienteQuery = `
            UPDATE pacientes 
            SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?, estado_civil = ?, ocupacion = ?, telefono = ?, email = ?, direccion = ?
            WHERE id = ?
        `;

        const updatePacienteParams = [
            nombre,
            apellido,
            fecha_nacimiento,
            genero,
            estado_civil,
            ocupacion,
            telefono,
            email,
            direccion,
            idPaciente
        ];

        // Si se envía una nueva contraseña, se encripta y se actualiza en la tabla 'usuarios'
        if (contrasena) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);

            // Actualizar la contraseña en la tabla usuarios
            const updatePasswordQuery = `
                UPDATE usuarios 
                SET contrasena = ?
                WHERE id = ?
            `;
            await new Promise((resolve, reject) => {
                conexion.query(updatePasswordQuery, [hashedPassword, idPaciente], (error, result) => {
                    if (error) {
                        console.error("Error al actualizar la contraseña:", error);
                        return reject("Error al actualizar la contraseña.");
                    }
                    resolve(result);
                });
            });
        }

        // Actualizar los datos del paciente en la tabla 'pacientes'
        conexion.query(updatePacienteQuery, updatePacienteParams, (error, result) => {
            if (error) {
                console.error("Error al actualizar el perfil:", error);
                return res.status(500).send("Error al actualizar el perfil.");
            }

            if (result.affectedRows === 0) {
                console.log("No se realizaron cambios.");
                return res.status(404).send("No se realizaron cambios.");
            }

            console.log("Perfil actualizado exitosamente.");
            req.flash("success_msg", "Perfil actualizado con éxito.");
            res.redirect("/dashboard_paciente/perfil");
        });

    } catch (error) {
        console.error("Error en el proceso de actualización del perfil:", error);
        res.status(500).send("Error al actualizar el perfil.");
    }
});


router.get("/dashboard_paciente/events", async function (req, res) {
    const idpaciente = req.session.paciente_id;
    if(!idpaciente){
        return res.status(401).send("inicar sesión nuevamente.")
    }

    const result = await new Promise((revolve, reject)=>{
        conexion.query(`SELECT 
            p.nombre,
            p.apellido,
            s.nombre as consulta,
            c.fecha,
            c.hora
        FROM citas as c 
        INNER JOIN medicos as m on m.id = c.medico_id
        INNER JOIN pacientes as p on p.id = c.paciente_id
        INNER JOIN servicios as s on s.id = c.servicio_id
        WHERE c.paciente_id = ?`, [idpaciente], function(error, rows){
            if(error){
                reject(false)
            }
            revolve(rows)
        })
    });

    const events = result.map((item, index)=>{
        const title = item.nombre+" "+item.apellido + " - " +item.consulta;

        const [hours, minutes, seconds = 0] = item.hora.split(":").map(Number)

        const current = new Date(item.fecha)
        const start = new Date(current.getFullYear(), current.getMonth(), current.getDate(),hours,minutes, seconds);
        return {
            title,
            start,
            end: start
        }
    });

    return res.json(events);
});

router.get("/dashboard_paciente/solicitar_consulta", checkLoginPaciente, async (req, res) => {
    const medico_servicios = `
    SELECT m.id AS medico_id, 
       m.nombre AS medico_nombre, 
       m.apellido AS medico_apellido,
       GROUP_CONCAT(
           CONCAT(s.id, '|', s.nombre, '|', s.descripcion, '|', s.costo) 
           SEPARATOR ',' 
       ) AS servicios
    FROM medicos m
    JOIN medico_servicio ms ON m.id = ms.medico_id
    JOIN servicios s ON ms.servicio_id = s.id
    JOIN usuarios u ON m.usuario_id = u.id  -- Agregamos JOIN con la tabla usuarios
    WHERE u.estado = '1'  -- Filtramos los médicos cuyo usuario esté habilitado
    GROUP BY m.id;

    `;

    conexion.query(medico_servicios, async function(error, rows) {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Error al obtener médicos" });
        }

        const med_sv = rows.map(medico => {
            const servicios = medico.servicios.split(',').map(servicio => {
                const [servicio_id, servicio_nombre, servicio_descripcion, servicio_costo] = servicio.split('|');
                return {
                    servicio_id: servicio_id, 
                    servicio_nombre: servicio_nombre, 
                    servicio_descripcion: servicio_descripcion, 
                    servicio_costo: parseFloat(servicio_costo) 
                };
            });
            return {
                medico_id: medico.medico_id,
                medico_nombre: medico.medico_nombre,
                medico_apellido: medico.medico_apellido,
                servicios 
            };
        });

        const data = {
            'usuario': req.session,
            'link': link,
            'medico_servicios': med_sv 
        };
        res.status(200).render("dashboard_paciente/solicitar_consulta", data);
    });
});

router.post("/dashboard_paciente/solicitar_consulta", checkLoginPaciente, async (req,res) => {
    const idusuario = req.session.paciente_id;
    const {medico_id, servicio_id, fecha, hora} =req.body;

    console.log(fecha, hora)

    const valid = await new Promise((resolve) => {
        conexion.query(
          'SELECT * FROM `citas` WHERE hora = ? AND fecha = ?',
          [hora, fecha],
          function (_error, rows) {
            console.log(rows)
            // Ignoramos cualquier error y resolvemos solo con true o false
            resolve(rows.length !== 0);
          }
        );
      });
      
    if(valid){
        return res.status(400).json({ error: "El horario ya se encuentra registrado." });
    }

    const citas = `
    INSERT INTO citas(paciente_id, medico_id, servicio_id, fecha, hora)
    VALUES (?, ?, ?, ?, ?)
    `
    conexion.query(citas, [idusuario, medico_id, servicio_id, fecha, hora], async function(error, rows){
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Error al registrar la cita" });
        }
        const data = {
            'titulo': 'Página de calendario',
            'usuario': req.session,
            'link': link,
        };
        res.status(200).render("dashboard_paciente/calendario", data);
    });
});

router.get("/dashboard_paciente/citas", checkLoginPaciente, async (req,res) => {
    // const citas = database.Historias('select * from historias');
    const data = {
        'usuario': req.session,
        'link' : link,
    };
    res.render("dashboard_paciente/citas", data);
});

router.get("/dashboard_paciente/historia_clinica", checkLoginPaciente, async (req,res) => {
    //TRAER HISTORIA DE LA BD
    const idusuario = req.session.paciente_id;
    const historia = `
        SELECT 
            p.nombre AS nombre_paciente, 
            p.apellido AS apellido_paciente, 
            p.fecha_nacimiento, 
            p.telefono,
            p.email, 
            p.direccion, 
            p.genero, 
            p.estado_civil, 
            p.ocupacion, 
            h.motivo, 
            h.enfermedades_previas, 
            h.alergias, 
            h.medicamentos_actuales, 
            h.cirugias_previas, 
            h.fuma, 
            h.consume_alcohol, 
            h.enfermedades_hereditarias, 
            h.peso, 
            h.altura, 
            h.imc, 
            h.descripcion_fisica,
            h.cirugia, 
            h.procedimiento, 
            h.riesgos, 
            h.cuidado_preoperativo, 
            h.cuidado_postoperativo
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id
        ORDER BY h.id DESC
        LIMIT 1
    `;
    conexion.query(historia, idusuario, async function(error,rows){
        if (error) 
            {
                return res.status(500).send(error);
            }
        else if(rows < 1){
            console.log('ERROR')
            //MOSTAR INGRESO DE DATOS
        }
        else{
            const historial_medico = rows[0];
            const data = {
                'usuario': req.session,
                'link' : link,
                'historia' : historial_medico
            };
            res.render("dashboard_paciente/historia_clinica", data)
        }
    })
});

router.get("/dashboard_paciente/test", checkLoginPaciente, async (req,res) => {
    // traer citas de la base de datos
    // const citas = database.Citas('select * from citas');

    const data = {
        'total_citas': 0,
        'titulo' : 'pagina de calendario'
    };
    res.render('dashboard_paciente/test', data);
});

router.post("/dashboard_paciente/test", checkLoginPaciente, (req,res) => {
    // console.log(req.body);
    const data = {
        'username': req.body.username,
    };
    res.json(data);
});
module.exports= router;