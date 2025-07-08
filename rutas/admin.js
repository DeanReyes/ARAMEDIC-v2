const express = require("express");
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const router = express.Router();
const conexion = require("../config/conexion");
const link = require("../config/link");
const { validarServicio } = require('../validaciones/servicios');
const checkLoginAdmin = require("../validaciones/authAdmin");
const bcrypt = require("bcrypt");
const saltRounds = 10
const moment = require('moment');

router.get("/dashboard_admin", checkLoginAdmin, function(req,res){
    const data = {
        'link' : link,
        'usuario': req.session
    }

    res.render("dashboard_admin/gestion_calendario", data);
});

router.get("/dashboard_admin/events", async function(req,res){
    const result = await new Promise((resolve, reject)=>{
        conexion.query(`
        SELECT 
            p.nombre,
            p.apellido,
            s.nombre as consulta,
            c.fecha,
            c.hora
        FROM citas as c 
        INNER JOIN medicos as m on m.id = c.medico_id
        INNER JOIN pacientes as p on p.id = c.paciente_id
        INNER JOIN servicios as s on s.id = c.servicio_id`, [], function(error, rows){
            if(error){
                reject(false);
            }
            resolve(rows);
        });
    });

    if (!result){
        return res.json([]);
    }

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

    res.json(events);
});

router.get("/dashboard_admin/historias", checkLoginAdmin, (req, res) => {
    const buscar = req.query.buscar ?? ""; // Capturar el parámetro de búsqueda desde la URL

    const historias = `
        SELECT 
            h.id, -- Sin alias, para mantener consistencia con el controlador del médico
            u.dni, 
            p.nombre AS nombre_paciente, 
            p.apellido AS apellido_paciente, 
            p.telefono, 
            p.email, 
            h.motivo, 
            h.cirugia, 
            h.procedimiento,
            m.nombre AS nombre_medico, 
            m.apellido AS apellido_medico
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id
        JOIN usuarios u ON u.id = p.usuario_id
        JOIN medicos m ON h.medico_id = m.id
        WHERE 
            p.nombre LIKE CONCAT(?, '%') 
            OR p.apellido LIKE CONCAT(?, '%') 
            OR u.dni LIKE CONCAT(?, '%') 
            OR p.email LIKE CONCAT(?, '%')
        ORDER BY h.id DESC;
    `;

    conexion.query(historias, [buscar, buscar, buscar, buscar], (error, rows) => {
        if (error) {
            console.error("Error al obtener historias clínicas:", error);
            return res.status(500).send("Error al obtener las historias clínicas.");
        }

        const data = {
            usuario: req.session,
            link: link,
            historias: rows, // Enviar directamente los resultados de la consulta
            buscar, // Enviar el término de búsqueda actual para mostrarlo en el front
        };

        res.render("dashboard_admin/historias", data);
    });
});




router.get("/dashboard_admin/historia_clinica", checkLoginAdmin, function(req, res) {
    
    const historiaid = req.query.historiaId; // ID de la historia clínica desde los parámetros

    // Imprimir el valor de historiaId para ver si está llegando correctamente
    console.log("ID de historia clínica recibido:", historiaid);

    if (!historiaid) {
        return res.status(400).send('ID de historia clínica no proporcionado.');
    }

    // Consulta SQL para obtener los detalles de la historia clínica sin restricciones
    const historia = `
        SELECT p.nombre AS nombre_paciente, p.apellido AS apellido_paciente, p.fecha_nacimiento, p.telefono,
               p.email, p.direccion, p.genero, p.estado_civil, p.ocupacion, h.motivo, h.enfermedades_previas,
               h.id, h.alergias, h.medicamentos_actuales, h.cirugias_previas, h.fuma, h.consume_alcohol, 
               h.enfermedades_hereditarias, h.peso, h.altura, h.imc, h.descripcion_fisica,
               h.cirugia, h.procedimiento, h.riesgos, h.cuidado_preoperativo, h.cuidado_postoperativo
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id
        WHERE h.id = ?; 
    `;

    // Ejecutar la consulta
    console.log("Ejecutando consulta SQL con historiaId:", historiaid);  // Ver la consulta antes de ejecutarse

    conexion.query(historia, [historiaid], function(error, rows) {
        if (error) {
            console.log("Error al obtener historia clínica", error);
            return res.status(500).send("Error al obtener la historia clínica.");
        }

        // Si no se encuentra ningún resultado
        if (rows.length === 0) {
            console.log("No se encontró la historia clínica con ID:", historiaid);
            return res.status(404).send("Historia clínica no encontrada.");
        }

        // Si se encontró la historia clínica
        console.log("Historia clínica encontrada:", rows[0]);

        // Renderizar la vista de historia clínica, pasando los datos recuperados
        const historiaClinica = rows[0];
        const data = {
            'usuario': req.session,
            'link': link, // Asegúrate de definir 'link' o eliminar si no lo usas
            'historia': historiaClinica
        };

        res.render("dashboard_admin/historia_clinica", data);
    });
});



router.post("/dashboard_admin/historia_clinica", checkLoginAdmin, async (req, res) => {
    
    const historiaId = req.body.historiaId;
    
    if (!historiaId) {
        return res.status(400).send("El ID del historial clínico no está definido.");
    }

    const { motivo, enfermedadesPrevias, alergias, medicamentosActuales, cirugiasPrevias, fuma,
        consumeAlcohol, enfermedadesHereditarias, peso, altura, imc, descripcionFisica, cirugia,
        procedimiento, riesgos, cuidadoPreoperativo, cuidadoPostoperativo } = req.body;

    const query = `
        UPDATE historial_medico
        SET motivo = ?, enfermedades_previas = ?, alergias = ?, medicamentos_actuales = ?,
            cirugias_previas = ?, fuma = ?, consume_alcohol = ?, enfermedades_hereditarias = ?,
            peso = ?, altura = ?, imc = ?, descripcion_fisica = ?, cirugia = ?, procedimiento = ?,
            riesgos = ?, cuidado_preoperativo = ?, cuidado_postoperativo = ?
        WHERE id = ?;
    `;

    conexion.query(
        query, [motivo, enfermedadesPrevias, alergias, medicamentosActuales, cirugiasPrevias, fuma,
            consumeAlcohol, enfermedadesHereditarias, peso, altura, imc, descripcionFisica, cirugia,
            procedimiento, riesgos, cuidadoPreoperativo, cuidadoPostoperativo, historiaId
        ],
        (error, results) => {
            if (error) {
                console.log("Error al actualizar la historia clínica:", error);
                return res.status(500).send("Error al actualizar la historia clínica.");
            }

            if (results.affectedRows === 0) {
                return res.status(404).send("No se encontró el historial clínico o no tienes permisos para editarlo.");
            }

            res.redirect("/dashboard_admin/historias");
        }
    );
});


router.get("/dashboard_admin/test", checkLoginAdmin, async (req,res) => {
    // traer citas de la base de datos
    // const citas = database.Citas('select * from citas');

    const data = {
        'total_citas':0,
        'titulo' : 'pagina de calendario',
        'usuario': req.session
    };
    
    res.render('dashboard_admin/test', data);
});

router.post("/dashboard_jmedico/test", checkLoginAdmin, (req,res) => {

    // console.log(req.body);

    const data = {
        'username': req.body.username,
    };
    
    res.json(data);
});

router.get("/dashboard_admin/citas", async (req, res) => {
    try {
        const citas = await new Promise((resolve, reject) => {
            conexion.query(`
                SELECT 
                    c.id, 
                    p.nombre AS nombre_paciente,
                    p.apellido AS apellido_paciente,
                    m.nombre AS nombre_medico,
                    m.apellido AS apellido_medico,
                    s.nombre AS nombre_servicio,
                    c.fecha,
                    c.hora,
                    c.estado
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                JOIN medicos m ON c.medico_id = m.id
                JOIN servicios s ON c.servicio_id = s.id
                ORDER BY c.fecha, c.hora;
            `, [], function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });

        const pacientes = await conexion.query(`SELECT * FROM pacientes`);
        const medicos = await conexion.query(`SELECT * FROM medicos`);
        const servicios = await conexion.query(`SELECT * FROM servicios`);

        res.render("dashboard_admin/citas", {
            'total_citas': citas.length,
            'titulo': 'Página de citas',
            'link': link,
            'usuario': req.session,
            'citas': citas,
            'pacientes': pacientes,
            'medicos': medicos,
            'servicios': servicios
        });
    } catch (error) {
        console.error("Error al obtener citas:", error);
        res.status(500).send("Error al obtener citas");
    }
});

router.post("/dashboard_admin/citas/guardar", checkLoginAdmin, async (req, res) => {
    console.log(req.body)
    const { id, pacienteId, medicoId, tservicio, fecha, hora, estado} = req.body;

    // // Validar datos de entrada
    // const validacion = validarServicio({ nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion });
    // if (!validacion.valido) {
    //     return res.status(400).json({ mensaje: validacion.mensaje });
    // }

    // const data = await conexion.query("select * from servicios where id = ?", [id])
    // if(data.length === 0){
        await conexion.query(
                `UPDATE citas
                SET
                paciente_id =?,
                medico_id =?,
                servicio_id =?,
                fecha= ?, 
                hora= ?, 
                estado= ?
                WHERE id=?`,
                [pacienteId, medicoId, tservicio,fecha, hora, estado, id]
            );

            return res.json({ mensaje: "Cita registrada exitosamente" });
});

router.delete("/dashboard_admin/citas/eliminar/:id", checkLoginAdmin, async (req, res) => {
    conexion.query('DELETE FROM citas WHERE id = ?',[req.params.id], function(error, rows){
        if(error){
            console.log(error)
            return res.status(500).json({ mensaje: "No se pudo eliminar" });
        }

        return res.json({ mensaje: "Cita eliminada exitosamente." });
    });
});



router.get("/dashboard_admin/cuentas", checkLoginAdmin, async (req, res) => {
    try {
        const data = {
            'link': link,
            'usuario': req.session,
        };
        res.render("dashboard_admin/cuentas", data);
    } catch (error) {
        console.error("Error al obtener cuentas:", error);
        res.status(500).send("Error al obtener cuentas");
    }
});

router.get("/dashboard_admin/cuentas/buscar", checkLoginAdmin, async (req, res) => {
    const { dni } = req.query;

    try {
        let query = `
            SELECT 
                u.id,
                u.dni, 
                u.rol_id,
                COALESCE(p.nombre, m.nombre) AS nombre,
                COALESCE(p.apellido, m.apellido) AS apellido,
                COALESCE(p.email, m.email) AS email,
                u.estado
            FROM usuarios u
            LEFT JOIN pacientes p ON u.id = p.usuario_id
            LEFT JOIN medicos m ON u.id = m.usuario_id
        `;
        
        if (dni) {
            query += " WHERE u.dni LIKE ?";
            const usuarios = await conexion.query(query, [`${dni}%`]);
            return res.json(usuarios);
        } else {
            const usuarios = await conexion.query(query);
            return res.json(usuarios);
        }
    } catch (error) {
        console.error("Error al buscar cuentas:", error);
        res.status(500).send("Error al buscar cuentas");
    }
});

// Ruta para validar si el DNI ya existe
router.get("/dashboard_admin/cuentas/validar-dni", checkLoginAdmin, async (req, res) => {
    const { dni } = req.query;

    try {
        const [usuarioExistente] = await conexion.query("SELECT * FROM usuarios WHERE dni = ?", [dni]);

        if (usuarioExistente) {
            return res.json({ existe: true });
        }

        return res.json({ existe: false });
    } catch (error) {
        console.error("Error al validar DNI:", error);
        res.status(500).send("Error al validar DNI");
    }
});

router.get("/dashboard_admin/cuentas/usuario/:dni", async (req, res) => {
    const { dni } = req.params;

    try {
        const [usuario] = await conexion.query(`
            SELECT 
                u.dni,
                u.rol_id,
                p.nombre AS nombre,
                p.apellido AS apellido,
                p.email AS email,
                p.telefono AS telefono,
                p.fecha_nacimiento,
                p.genero,
                p.estado_civil,
                p.ocupacion,
                p.direccion,
                m.especialidad_id AS especialidad
            FROM usuarios u
            LEFT JOIN pacientes p ON u.dni = p.usuario_id
            LEFT JOIN medicos m ON u.dni = m.usuario_id
            WHERE u.dni = ?
        `, [dni]);

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(usuario);
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        res.status(500).send("Error al obtener usuario");
    }
});


// Ruta para guardar usuario (paciente o trabajador)
router.post("/dashboard_admin/cuentas/guardar", checkLoginAdmin, async (req, res) => {
    const { dni, nombre, apellido, email, rol, contrasena } = req.body;
    const hashedPas = await bcrypt.hash(contrasena, saltRounds);
    try {
        // Insertar en la tabla usuarios
        await conexion.query(
            "INSERT INTO usuarios (dni, rol_id, contrasena) VALUES (?, ?, ?)",
            [dni, rol, hashedPas],
            (error, result) => {
                if (error) {
                    console.log("TRIKA error al insertar usuario", error);
                    return res.status(500).send("Error al registrar el usuario");
                }
                const user_id = result.insertId;
                if (rol == 1) { // Si es paciente
                    // Insertar en la tabla pacientes
                    conexion.query(
                        "INSERT INTO pacientes (usuario_id, nombre, apellido, email) VALUES (?, ?, ?, ?)",
                        [user_id, nombre, apellido, email]
                    );
                } else if (rol == 2) { // Si es medico o trabajador
                    // Insertar en la tabla medicos
                    conexion.query(
                        "INSERT INTO medicos (usuario_id, nombre, apellido, email) VALUES (?, ?, ?, ?)",
                        [user_id, nombre, apellido, email]
                    );
                }
                return res.json({ success: true, mensaje: "Usuario agregado exitosamente" });
            });
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        return res.status(500).json({ success: false, mensaje: "Error al guardar usuario: SAD" });
    }
});

router.post('/dashboard_admin/cuentas/editar', (req, res) => {
    console.log(req.body)

    const query = req.body.clave 
    ? "update usuarios set contrasena = ?,estado = ? where id = ?" 
    : "update usuarios set estado = ? where id = ?";

    const data = req.body.clave 
    ? [
        req.body.clave,
        req.body.estado,
        req.body.id
    ] 
    : [
        req.body.estado,
        req.body.id
    ];

        // Si el usuario se encuentra, devuelve los datos para llenar el formulario
    conexion.query(query, data, function(error, rows){
        if(error){
            console.log(error)
            return res.status(500).json({ mensaje: "no se puedo editar" });
        }
    
        return res.json({ mensaje: "ok si." });
    });    
});

router.delete('/dashboard_admin/cuentas/eliminar/:id', (req, res) => {
    conexion.query('update usuarios set estado = 0 where id = ?',[
        req.params.id
    ], function(error, rows){
        if(error){
            console.log(error)
            return res.status(500).json({ mensaje: "no se puedo eliminar" });
        }

        return res.json({ mensaje: "usuario inhabilitado exitosamente." });
    });
});

// Ruta para mostrar la lista de servicios con admin_id
router.get("/dashboard_admin/servicios", checkLoginAdmin, async (req, res) => {
    try {

        const servicios = await new Promise((resolve, reject)=>{
            conexion.query(`SELECT 
                id, 
                nombre, 
                descripcion, 
                costo, 
                tiempo_duracion, 
                tiempo_recuperacion, 
                estado 
            FROM 
                servicios
                WHERE visibilidad=1`,[], function(error, rows){
                    if(error){
                        reject("no se pudo obtener datos.");
                    }

                    resolve(rows);
                })
        });

        const data = {
            link: link,
            usuario: req.session,
            servicios: servicios,
        };
        res.render("dashboard_admin/servicios", data);
    } catch (error) {
        console.error("Error al obtener servicios:", error);
        res.status(500).send("Error al obtener servicios");
    }
});


router.get("/dashboard_admin/servicios/buscar", checkLoginAdmin, async (req, res) => {
    const { nombre } = req.query;

    try {
        let query = `
            SELECT id, nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion 
            FROM servicios
        `;

        if (nombre) {
            query += " WHERE nombre LIKE ?";
            const servicios = await conexion.query(query, [`${nombre}%`]);
            return res.json(servicios);
        } else {
            const servicios = await conexion.query(query);
            return res.json(servicios);
        }
    } catch (error) {
        console.error("Error al buscar servicios:", error);
        res.status(500).send("Error al buscar servicios");
    }
});

router.post("/dashboard_admin/servicios/guardar", checkLoginAdmin, async (req, res) => {
    console.log(req.body);
    const { id, nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion, estado } = req.body;

    // Validar que nombre y descripcion no contengan números
    const contieneNumeros = (texto) => /\d/.test(texto);
    if (contieneNumeros(nombre) || contieneNumeros(descripcion)) {
        return res.status(400).json({ mensaje: "El nombre y la descripción no deben contener números." });
    }

    // Validar que costo, tiempo_duracion y tiempo_recuperacion sean mayores a 0
    if (costo <= 0 || tiempo_duracion <= 0 || tiempo_recuperacion <= 0) {
        return res.status(400).json({
            mensaje: "El costo, la duración y el tiempo de recuperación deben ser mayores a 0."
        });
    }

    try {
        const data = await conexion.query("SELECT * FROM servicios WHERE id = ?", [id]);
        if (data.length === 0) {
            // Insertar nuevo servicio
            await conexion.query(
                `INSERT INTO servicios (nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion, estado, visibilidad) 
                 VALUES (?, ?, ?, ?, ?, ?, 1)`,
                [nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion, estado]
            );

            return res.json({ mensaje: "Servicio registrado exitosamente" });
        } else {
            // Actualizar servicio existente
            await conexion.query(
                `UPDATE servicios 
                 SET 
                 nombre = ?,
                 descripcion = ?, 
                 costo = ?, 
                 tiempo_duracion = ?,
                 tiempo_recuperacion = ? ,
                 estado = ?
                 WHERE id = ?`,
                [
                    nombre,
                    descripcion, 
                    costo, 
                    tiempo_duracion,
                    tiempo_recuperacion, 
                    estado,
                    id
                ]
            );

            return res.json({ mensaje: "Servicio actualizado exitosamente" });
        }
    } catch (error) {
        console.error("Error en la base de datos:", error);
        return res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});



router.delete("/dashboard_admin/servicios/eliminar/:id", checkLoginAdmin, async (req, res) => {
    conexion.query('update servicios set visibilidad = 0 where id = ?',[
        req.params.id
    ], function(error, rows){
        if(error){
            console.log(error)
            return res.status(500).json({ mensaje: "no se puedo eliminar" });
        }

        return res.json({ mensaje: "Servicio eliminado exitosamente." });
    });
});

// //Metodo para generar PDF
router.get("/dashboard_admin/historias/descargar_pdf/:id", checkLoginAdmin, (req, res) => {
    const historiaId = req.params.id;

    // Consulta extendida con todos los campos
    const query = `
        SELECT p.nombre AS nombre_paciente, p.apellido AS apellido_paciente, p.fecha_nacimiento, 
               h.id, h.paciente_id, h.motivo, h.enfermedades_previas, h.alergias, h.medicamentos_actuales,
               h.cirugias_previas, h.fuma, h.consume_alcohol, h.enfermedades_hereditarias, h.peso, h.altura,
               h.imc, h.descripcion_fisica, h.cirugia, h.procedimiento, h.riesgos, h.cuidado_preoperativo, 
               h.cuidado_postoperativo, h.medico_id, h.horaCreacion, h.horaActualizacion
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id
        WHERE h.id = ?;
    `;

    conexion.query(query, [historiaId], (error, results) => {
        if (error || results.length === 0) {
            return res.status(404).send("Historia clínica no encontrada o no tienes permiso.");
        }

        const historia = results[0];
        const doc = new PDFDocument();

        // Configurar headers para la descarga
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=historia_clinica_${historia.nombre_paciente}_${historia.apellido_paciente}.pdf`
        );

        // Generar contenido del PDF
        doc.pipe(res);

        // Encabezado
        doc.fontSize(16).text("Historia Clínica", { align: "center" });
        doc.moveDown();

        // Detalles del paciente
        doc.fontSize(12).text(`Paciente: ${historia.nombre_paciente} ${historia.apellido_paciente}`, { align: "left" });
        doc.text(`Fecha de nacimiento: ${historia.fecha_nacimiento}`, { align: "left" });
        doc.moveDown();

        // Formatear la hora (solo HH:mm:ss)
        const horaCreacion = moment(historia.horaCreacion).format('HH:mm:ss');
        const horaActualizacion = moment(historia.horaActualizacion).format('HH:mm:ss');

        // Incluir la información con la hora formateada
        doc.fontSize(12).text(`ID Historia Clínica: ${historia.id}`);
        doc.text(`Motivo de consulta: ${historia.motivo || "No especificado"}`);
        doc.text(`Enfermedades previas: ${historia.enfermedades_previas || "N/A"}`);
        doc.text(`Alergias: ${historia.alergias || "N/A"}`);
        doc.text(`Medicamentos actuales: ${historia.medicamentos_actuales || "N/A"}`);
        doc.text(`Cirugías previas: ${historia.cirugias_previas || "N/A"}`);
        doc.text(`Fuma: ${historia.fuma ? 'Sí' : 'No'}`);
        doc.text(`Consume alcohol: ${historia.consume_alcohol ? 'Sí' : 'No'}`);
        doc.text(`Enfermedades hereditarias: ${historia.enfermedades_hereditarias || "N/A"}`);
        doc.text(`Peso: ${historia.peso || "No especificado"}`);
        doc.text(`Altura: ${historia.altura || "No especificado"}`);
        doc.text(`IMC: ${historia.imc || "No especificado"}`);
        doc.text(`Descripción física: ${historia.descripcion_fisica || "N/A"}`);
        doc.text(`Cirugía: ${historia.cirugia || "No especificado"}`);
        doc.text(`Procedimiento: ${historia.procedimiento || "No especificado"}`);
        doc.text(`Riesgos: ${historia.riesgos || "N/A"}`);
        doc.text(`Cuidado preoperatorio: ${historia.cuidado_preoperativo || "N/A"}`);
        doc.text(`Cuidado postoperatorio: ${historia.cuidado_postoperativo || "N/A"}`);
        doc.text(`Médico ID: ${historia.medico_id || "No especificado"}`);

        // Añadir la hora de creación y actualización
        doc.moveDown();
        doc.text(`Hora de Creación: ${horaCreacion}`);
        doc.text(`Hora de Actualización: ${horaActualizacion}`);

        // Finalizar el documento
        doc.end();
    });
});


router.get("/dashboard_admin/historias/descargar_todos_pdf", checkLoginAdmin, (req, res) => {
    const idusuario = req.session.admin_id; // Asegúrate de que el id del administrador esté disponible

    // Consulta para obtener todas las historias clínicas con los datos adicionales
    const historias = `
        SELECT h.id, 
               h.paciente_id, 
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
               h.cuidado_postoperativo, 
               h.medico_id, 
               h.horaCreacion, 
               h.horaActualizacion,
               p.nombre AS nombre_paciente, 
               p.apellido AS apellido_paciente
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id;
    `;

    conexion.query(historias, (error, rows) => {
        if (error || rows.length === 0) {
            return res.status(404).send("No se encontraron historias clínicas.");
        }

        // Crear archivo ZIP
        const zip = archiver('zip', { zlib: { level: 9 } });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=historias_clinicas.zip');

        // Pipe the archive to the response
        zip.pipe(res);

        // Iterar sobre todas las historias y generar los PDFs
        rows.forEach(historia => {
            const doc = new PDFDocument();
            const nombrePaciente = historia.nombre_paciente;
            const apellidoPaciente = historia.apellido_paciente;

            // Nombre del archivo dentro del ZIP usando nombre y apellido del paciente
            const nombreArchivo = `historia_clinica_${nombrePaciente}_${apellidoPaciente}.pdf`;

            // Añadir cada PDF al archivo ZIP con el nombre del paciente
            zip.append(doc, { name: nombreArchivo });

            // Formatear las horas (solo HH:mm:ss)
            const horaCreacion = moment(historia.horaCreacion).format('HH:mm:ss');
            const horaActualizacion = moment(historia.horaActualizacion).format('HH:mm:ss');

            // Generar contenido del PDF
            doc.fontSize(16).text("Historia Clínica", { align: "center" });
            doc.moveDown();

            // Información básica del paciente
            doc.fontSize(12).text(`Paciente: ${nombrePaciente} ${apellidoPaciente}`, { align: "left" });
            doc.text(`Historia clínica ID: ${historia.id}`, { align: "left" });
            doc.text(`Motivo: ${historia.motivo}`, { align: "left" });
            doc.text(`Enfermedades Previas: ${historia.enfermedades_previas}`, { align: "left" });
            doc.text(`Alergias: ${historia.alergias}`, { align: "left" });
            doc.text(`Medicamentos Actuales: ${historia.medicamentos_actuales}`, { align: "left" });
            doc.text(`Cirugías Previas: ${historia.cirugias_previas}`, { align: "left" });
            doc.text(`Fuma: ${historia.fuma ? 'Sí' : 'No'}`, { align: "left" });
            doc.text(`Consume Alcohol: ${historia.consume_alcohol ? 'Sí' : 'No'}`, { align: "left" });
            doc.text(`Enfermedades Hereditarias: ${historia.enfermedades_hereditarias}`, { align: "left" });
            doc.text(`Peso: ${historia.peso}`, { align: "left" });
            doc.text(`Altura: ${historia.altura}`, { align: "left" });
            doc.text(`IMC: ${historia.imc}`, { align: "left" });
            doc.text(`Descripción Física: ${historia.descripcion_fisica}`, { align: "left" });
            doc.text(`Cirugía: ${historia.cirugia}`, { align: "left" });
            doc.text(`Procedimiento: ${historia.procedimiento}`, { align: "left" });
            doc.text(`Riesgos: ${historia.riesgos}`, { align: "left" });
            doc.text(`Cuidado Preoperatorio: ${historia.cuidado_preoperativo}`, { align: "left" });
            doc.text(`Cuidado Postoperatorio: ${historia.cuidado_postoperativo}`, { align: "left" });

            // Información adicional
            doc.text(`Médico ID: ${historia.medico_id}`, { align: "left" });
            doc.text(`Hora de Creación: ${horaCreacion}`, { align: "left" });
            doc.text(`Última Actualización: ${horaActualizacion}`, { align: "left" });

            doc.end();  // Finaliza el documento PDF
        });

        // Finalizar la creación del archivo ZIP
        zip.finalize();
    });
});





router.get('/dashboard_admin/registrar_historia_clinica', checkLoginAdmin, function(req, res) {
    // Consulta para obtener solo los pacientes habilitados
    const pacientesQuery = `
        SELECT p.id, p.nombre, p.apellido, p.telefono, p.email
        FROM pacientes p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE u.estado = '1'
    `;

    // Consulta para obtener solo los médicos habilitados
    const medicosQuery = `
        SELECT m.id, m.nombre, m.apellido
        FROM medicos m
        JOIN usuarios u ON m.usuario_id = u.id
        WHERE u.estado = '1'
    `;

    // Ejecutamos la consulta de pacientes
    conexion.query(pacientesQuery, function(error, pacientes) {
        if (error) {
            console.log("Error al obtener pacientes", error);
            return res.status(500).send("Error al obtener pacientes.");
        }

        // Ejecutamos la consulta de médicos
        conexion.query(medicosQuery, function(error, medicos) {
            if (error) {
                console.log("Error al obtener médicos", error);
                return res.status(500).send("Error al obtener médicos.");
            }

            // Preparamos los datos para la vista
            const data = {
                'usuario': req.session,
                'link': link,
                'pacientes': pacientes,  // Lista de pacientes habilitados
                'medicos': medicos       // Lista de médicos habilitados
            };

            // Renderizamos la vista correspondiente al administrador
            res.render("dashboard_admin/registro_historia_clinica", data);
        });
    });
});




router.post('/dashboard_admin/guardar_historia_clinica', checkLoginAdmin, function(req, res) {
    
    const { 
        pacienteId, 
        medicoId, // El administrador selecciona el médico responsable
        motivo, 
        enfermedadesPrevias, alergias, medicamentosActuales, cirugiasPrevias,
        fuma, consumeAlcohol, enfermedadesHereditarias, peso, altura, imc, descripcionFisica,
        cirugia, procedimiento, riesgos, cuidadoPreoperativo, cuidadoPostoperativo
    } = req.body;

    // Asegurar que los valores numéricos sean de tipo correcto
    const validatedFuma = parseInt(fuma) === 1 ? 1 : 0;  // Aseguramos que 'fuma' sea 1 o 0
    const validatedConsumeAlcohol = parseInt(consumeAlcohol) === 1 ? 1 : 0; // Lo mismo para 'consumeAlcohol'
    const validatedPeso = peso ? parseFloat(peso) : null; // Aseguramos que peso sea un número o null
    const validatedAltura = altura ? parseFloat(altura) : null; // Lo mismo para altura
    const validatedImc = imc ? parseFloat(imc) : null; // Aseguramos que imc sea un número o null

    // Verificar que todos los datos necesarios estén presentes
    if (!pacienteId || !medicoId || !motivo) {
        return res.status(400).send("Error: Los campos 'Paciente', 'Médico' y 'Motivo' son obligatorios.");
    }

   

    // Datos a insertar en la base de datos
    const values = [
        parseInt(medicoId),   // Aseguramos que medicoId sea un número
        parseInt(pacienteId), // Aseguramos que pacienteId sea un número
        motivo, 
        enfermedadesPrevias || null, 
        alergias || null, 
        medicamentosActuales || null, 
        cirugiasPrevias || null, 
        validatedFuma, 
        validatedConsumeAlcohol, 
        enfermedadesHereditarias || null, 
        validatedPeso, 
        validatedAltura, 
        validatedImc, 
        descripcionFisica || null, 
        cirugia || null, 
        procedimiento || null, 
        riesgos || null, 
        cuidadoPreoperativo || null, 
        cuidadoPostoperativo || null
    ];

    console.log("Valores que se enviarán a la consulta SQL:", values);

    // Consulta SQL para insertar la historia clínica (el campo 'id' es autoincremental)
    const historia = `
        INSERT INTO historial_medico (
        medico_id, 
        paciente_id, 
        motivo, 
        enfermedades_previas, 
        alergias, 
        medicamentos_actuales, 
        cirugias_previas, 
        fuma, 
        consume_alcohol, 
        enfermedades_hereditarias, 
        peso, 
        altura, 
        imc, 
        descripcion_fisica, 
        cirugia, 
        procedimiento, 
        riesgos, 
        cuidado_preoperativo, 
        cuidado_postoperativo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    // Ejecutar la consulta SQL
    conexion.query(historia, values, function(error, result) {
        if (error) {
            console.log("Error al guardar historia clínica:", error.message);
            return res.status(500).send("Error al guardar la historia clínica. Detalles: " + error.message);
        }
        
        // Redirigir al administrador a la página de historias clínicas si todo fue exitoso
        res.redirect("/dashboard_admin/historias");
    });
});



router.get('/dashboard_admin/getPaciente/:id', checkLoginAdmin, function(req, res) {
    const pacienteId = req.params.id;

    // Consulta para obtener los datos del paciente
    const query = 'SELECT * FROM pacientes WHERE id = ?';
    conexion.query(query, [pacienteId], function(error, result) {
        if (error) {
            console.log("Error al obtener el paciente:", error);
            return res.status(500).send("Error al obtener el paciente.");
        }

        if (result.length > 0) {
            res.json(result[0]); // Retorna los datos del paciente encontrado
        } else {
            res.status(404).send("Paciente no encontrado.");
        }
    });
});


router.get('/dashboard_admin/getMedico/:id', checkLoginAdmin, function(req, res) {
    const medicoId = req.params.id;

    // Validar que el id sea un número entero positivo
    if (isNaN(medicoId) || medicoId <= 0) {
        return res.status(400).send("ID de médico no válido.");
    }

    // Consulta para obtener los detalles del médico
    const query = 'SELECT * FROM medicos WHERE id = ?';
    conexion.query(query, [medicoId], function(error, result) {
        if (error) {
            console.log("Error al obtener el médico:", error.message);
            return res.status(500).send("Error al obtener el médico: " + error.message);
        }

        if (result.length > 0) {
            res.json(result[0]); // Retorna el primer médico encontrado
        } else {
            res.status(404).send("Médico no encontrado.");
        }
    });
});
router.get('/dashboard_admin/getUltimaHistoriaClinica/:pacienteId', checkLoginAdmin, function(req, res) {
    const pacienteId = req.params.pacienteId;
    // Consulta SQL para obtener la última historia clínica del paciente
    const query = `
        SELECT h.id, h.motivo, h.enfermedades_previas, h.alergias, h.medicamentos_actuales, h.cirugias_previas, h.fuma, 
            h.consume_alcohol, h.enfermedades_hereditarias, h.peso, h.altura, h.imc, h.descripcion_fisica, 
            h.cirugia, h.procedimiento, h.riesgos, h.cuidado_preoperativo, h.cuidado_postoperativo
        FROM historial_medico h
        WHERE h.paciente_id = ?
        ORDER BY h.id DESC
        LIMIT 1;
    `;
    conexion.query(query, [pacienteId], function(error, result) {
        if (error) {
            console.error("Error al obtener la última historia clínica:", error);
            return res.status(500).send("Error al obtener la última historia clínica.");
        }
        if (result.length > 0) {
            res.json(result[0]); // Retorna la última historia clínica encontrada
        } else {
            res.status(404).send("No se encontró historia clínica pasada para este paciente.");
        }
    });
});

// Nuevo endpoint para obtener información del paciente por DNI
router.get('/dashboard_admin/getPacienteByDNI/:id', checkLoginAdmin, function(req, res) {
    const id = req.params.id;
    const query = `
        SELECT 
            p.id AS paciente_id,
            p.nombre,
            p.apellido,
            p.fecha_nacimiento,
            p.telefono,
            p.email,
            p.direccion
        FROM pacientes p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.id = ?;
    `;

    conexion.query(query, [id], function(error, result) {
        if (error) {
            console.error("Error al obtener datos del paciente por DNI:", error);
            return res.status(500).send("Error al obtener datos del paciente.");
        }

        if (result.length > 0) {
            res.json(result[0]); // Retorna el primer registro del paciente
        } else {
            res.status(404).send("Paciente no encontrado.");
        }
    });
});
router.get('/dashboard_admin/getPacienteByDNI/:dni', checkLoginAdmin, function(req, res) {
    const dni = req.params.dni;
    const query = `
        SELECT 
            p.id AS paciente_id,
            p.nombre,
            p.apellido,
            p.fecha_nacimiento,
            p.telefono,
            p.email,
            p.direccion
        FROM pacientes p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE u.dni = ?;
    `;
    conexion.query(query, [dni], function(error, result) {
        if (error) {
            console.error("Error al obtener datos del paciente por DNI:", error);
            return res.status(500).send("Error al obtener datos del paciente.");
        }
        if (result.length > 0) {
            res.json(result[0]); // Retorna el primer registro del paciente
        } else {
            res.status(404).send("Paciente no encontrado.");
        }
    });
});


module.exports = router;