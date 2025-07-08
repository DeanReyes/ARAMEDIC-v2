const express = require("express");
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const router = express.Router();
const conexion = require("../config/conexion");
const link = require("../config/link");
const checkLoginMedico = require('../validaciones/authMedico');
const { validarServicio } = require('../validaciones/servicios');


router.get("/dashboard_jmedico", checkLoginMedico, function(req,res){

    const data = {
        'link' : link,
        'usuario': req.session,
    }

    res.render("dashboard_medico/gestion_calendario", data);
});

router.get("/dashboard_jmedico/events", async function(req,res){
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

router.get("/dashboard_jmedico/historias", checkLoginMedico, function(req,res){
    const idusuario = req.session.medico_id;
    const buscar = req.query.buscar ?? "";
    const historias = `
        SELECT u.dni, p.nombre AS nombre_paciente, p.apellido AS apellido_paciente, p.telefono,
            p.email, h.id, h.motivo, h.cirugia, h.procedimiento
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id= p.id
        JOIN usuarios u ON u.id = p.usuario_id
        JOIN medicos m ON h.medico_id = m.id
        WHERE h.medico_id = ? AND (p.nombre like concat(?,'%') OR p.apellido like concat(?,'%') OR u.dni like concat(?,'%') OR p.email like concat(?,'%'));
    `;
    
    conexion.query(historias, [idusuario, buscar, buscar, buscar, buscar], async function(error,rows){
        if (error) 
            {
                console.log("TRIKA error en la consulta de verificación", error);
                return res.status(500).send(error);
            }
        else{
            const historial_medico = rows;
            const data = {
                'usuario': req.session,
                'link' : link,
                'historias' : historial_medico
            };
            res.render("dashboard_medico/historias", data);
        }
    })
});

router.get("/dashboard_jmedico/historia_clinica", checkLoginMedico, function(req,res){
    const idusuario = req.session.medico_id;
    const historiaid = req.query.historiaId;
    if (!historiaid) {
        return res.status(400).send('ID de historia clínica no proporcionado.');
    }
    // Consulta SQL para obtener los detalles de la historia clínica
    const historia = `
        SELECT p.nombre AS nombre_paciente, p.apellido AS apellido_paciente, p.fecha_nacimiento, p.telefono,
            p.email, p.direccion, p.genero, p.estado_civil, p.ocupacion, h.motivo, h.enfermedades_previas,
            h.id, h.alergias, h.medicamentos_actuales, h.cirugias_previas, h.fuma, h.consume_alcohol, 
            h.enfermedades_hereditarias, h.peso, h.altura, h.imc, h.descripcion_fisica,
            h.cirugia, h.procedimiento, h.riesgos, h.cuidado_preoperativo, h.cuidado_postoperativo
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id
        JOIN medicos m ON h.medico_id = m.id
        WHERE h.id = ? AND h.medico_id = ?;
    `;
    conexion.query(historia, [historiaid, idusuario], function(error, rows) {
        if (error) {
            console.log("Error al obtener historia clínica", error);
            return res.status(500).send("Error al obtener la historia clínica.");
        }

        if (rows.length === 0) {
            return res.status(404).send("Historia clínica no encontrada.");
        }
        // Renderizar la vista de edición, pasando los datos de la historia clínica
        const historiaClinica = rows[0];
        const data = {
            'usuario': req.session,
            'link': link,
            'historia': historiaClinica
        };
    res.render("dashboard_medico/historia_clinica", data);
    });
});

// Eliminar historia de la tabla y la BD
router.delete('/dashboard_jmedico/historias/:id', checkLoginMedico, (req, res) => {
    const historiaId = req.params.id;
    const medicoId = req.session.medico_id;

    // Consulta SQL para eliminar la historia clínica
    const query = `
        DELETE FROM historial_medico
        WHERE id = ? AND medico_id = ?;
    `;

    conexion.query(query, [historiaId, medicoId], (error, result) => {
        if (error) {
            console.error("Error al eliminar historia clínica:", error);
            return res.status(500).json({ mensaje: "Error al eliminar la historia clínica." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Historia clínica no encontrada o no tienes permiso para eliminarla." });
        }

        res.status(200).json({ mensaje: "Historia clínica eliminada exitosamente." });
    });
});


router.post("/dashboard_jmedico/historia_clinica", checkLoginMedico, async(req, res) =>{
    const idusuario = req.session.medico_id;
    const historiaId = req.body.historiaId;
    if (!idusuario) {
        return res.status(400).send("El ID del médico no está definido.");
    }
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
        WHERE id = ? AND medico_id = ?;
    `;
    conexion.query(
        query, [motivo, enfermedadesPrevias, alergias, medicamentosActuales, cirugiasPrevias, fuma,
            consumeAlcohol, enfermedadesHereditarias, peso, altura, imc, descripcionFisica, cirugia,
            procedimiento, riesgos, cuidadoPreoperativo, cuidadoPostoperativo, historiaId, idusuario
        ],
        (error, results) => {
            if (error) {
                console.log("Error al actualizar la historia clínica:", error);
                return res.status(500).send("Error al actualizar la historia clínica.");
            }

            if (results.affectedRows === 0) {
                return res.status(404).send("No se encontró el historial clínico o no tienes permisos para editarlo.");
            }

            res.redirect("/dashboard_jmedico/historias");
        }
    );
});

//Metodo para generar PDF
router.get("/dashboard_jmedico/historias/descargar_pdf/:id", checkLoginMedico, (req, res) => {
    const historiaId = req.params.id;

    const query = `
        SELECT p.nombre AS nombre_paciente, p.apellido AS apellido_paciente, p.fecha_nacimiento, 
            h.motivo, h.enfermedades_previas, h.alergias, h.medicamentos_actuales
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id
        WHERE h.id = ? AND h.medico_id = ?;
    `;

    conexion.query(query, [historiaId, req.session.medico_id], (error, results) => {
        if (error || results.length === 0) {
            return res.status(404).send("Historia clínica no encontrada o no tienes permiso.");
        }

        const historia = results[0];
        const doc = new PDFDocument();

        // Configurar headers para la descarga
        res.setHeader("Content-Type", "application/pdf");
        // Modificar la línea para usar el nombre y apellido del paciente
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
        doc.text(`Motivo de consulta: ${historia.motivo}`, { align: "left" });
        doc.moveDown();

        // Generación de la tabla
        const tableTop = doc.y + 20;
        const rowHeight = 20;
        const columnWidth = [120, 320]; // Tamaños de columnas
        let currentY = tableTop;

        // Títulos de la tabla
        doc.fontSize(12).text("Descripción", columnWidth[0], currentY, { width: columnWidth[0], align: "center" });
        doc.text("Detalle", columnWidth[0] + columnWidth[0], currentY, { width: columnWidth[1], align: "center" });
        currentY += rowHeight;

        // Filas de la tabla
        const rows = [
            ["Motivo de consulta", historia.motivo || "No especificado"],
            ["Enfermedades previas", historia.enfermedades_previas || "N/A"],
            ["Alergias", historia.alergias || "N/A"],
            ["Medicamentos actuales", historia.medicamentos_actuales || "N/A"]
        ];

        // Dibujar las filas de la tabla
        rows.forEach(row => {
            doc.text(row[0], columnWidth[0], currentY, { width: columnWidth[0], align: "center" });
            doc.text(row[1], columnWidth[0] + columnWidth[0], currentY, { width: columnWidth[1], align: "center" });
            currentY += rowHeight;
        });
        
        // Finalizar el documento
        doc.end(); 
    });
});

router.get("/dashboard_jmedico/historias/descargar_todos_pdf", checkLoginMedico, (req, res) => {
    const idusuario = req.session.medico_id;

    // Consulta para obtener todas las historias clínicas del médico
    const historias = `
        SELECT h.id, p.nombre AS nombre_paciente, p.apellido AS apellido_paciente
        FROM historial_medico h
        JOIN pacientes p ON h.paciente_id = p.id
        WHERE h.medico_id = ?;
    `;

    conexion.query(historias, idusuario, (error, rows) => {
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

            // Generar contenido del PDF
            doc.fontSize(16).text("Historia Clínica", { align: "center" });
            doc.moveDown();
            doc.fontSize(12).text(`Paciente: ${nombrePaciente} ${apellidoPaciente}`, { align: "left" });
            doc.text(`Historia clínica ID: ${historia.id}`, { align: "left" });

            // Aquí puedes incluir más detalles de la historia clínica si lo deseas
            doc.end();
        });

        // Finalizar la creación del archivo ZIP
        zip.finalize();
    });
});

router.get('/dashboard_jmedico/registrar_historia_clinica', checkLoginMedico, function(req, res) {
    const idusuario = req.session.medico_id;

    // Consulta para obtener los pacientes relacionados con el médico
    const pacientesQuery = `
        SELECT u.dni, p.id AS paciente_id, p.nombre, p.apellido, p.fecha_nacimiento, p.telefono, p.email, p.direccion
        FROM pacientes p
        JOIN usuarios u ON p.usuario_id = u.id
    `;

    const medicosQuery = `SELECT id, nombre, apellido FROM medicos`;

    conexion.query(pacientesQuery, function(error, pacientes) {
        if (error) {
            console.error("Error al obtener pacientes:", error);
            return res.status(500).send("Error al obtener pacientes.");
        }

        console.log("Pacientes obtenidos:", pacientes); // Depuración

        conexion.query(medicosQuery, function(error, medicos) {
            if (error) {
                console.error("Error al obtener médicos:", error);
                return res.status(500).send("Error al obtener médicos.");
            }

            res.render("dashboard_medico/registro_historia_clinica", {
                usuario: req.session,
                link: link,
                pacientes: pacientes, // Lista de pacientes
                medicos: medicos     // Lista de médicos
            });
        });
    });
});

router.post('/dashboard_jmedico/guardar_historia_clinica', checkLoginMedico, function(req, res) {
    const { 
        pacienteId, 
        motivo, enfermedadesPrevias, alergias, medicamentosActuales, cirugiasPrevias,
        fuma, consumeAlcohol, enfermedadesHereditarias, peso, altura, imc, descripcionFisica,
        cirugia, procedimiento, riesgos, cuidadoPreoperativo, cuidadoPostoperativo
    } = req.body;

    // Obtener el ID del médico logueado desde la sesión
    const medicoId = req.session.medico_id;

    // Verificar que el medicoId esté disponible
    if (!medicoId) {
        return res.status(400).send("Error: ID del médico no encontrado.");
    }

    // Asegurar que los valores numéricos sean de tipo correcto
    const validatedFuma = parseInt(fuma) === 1 ? 1 : 0;  // Aseguramos que 'fuma' sea 1 o 0
    const validatedConsumeAlcohol = parseInt(consumeAlcohol) === 1 ? 1 : 0; // Lo mismo para 'consumeAlcohol'
    const validatedPeso = peso ? parseFloat(peso) : null; // Aseguramos que peso sea un número o null
    const validatedAltura = altura ? parseFloat(altura) : null; // Lo mismo para altura
    const validatedImc = imc ? parseFloat(imc) : null; // Aseguramos que imc sea un número o null

    // Verificar que todos los datos necesarios estén presentes
    if (!pacienteId || !motivo) {
        return res.status(400).send("Error: Los campos 'Paciente' y 'Motivo' son obligatorios.");
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
        INSERT INTO historial_medico 
        (medico_id, paciente_id, motivo, enfermedades_previas, alergias, 
        medicamentos_actuales, cirugias_previas, fuma, consume_alcohol, 
        enfermedades_hereditarias, peso, altura, imc, descripcion_fisica, 
        cirugia, procedimiento, riesgos, cuidado_preoperativo, cuidado_postoperativo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    // Ejecutar la consulta SQL
    conexion.query(historia, values, function(error, result) {
        if (error) {
            console.log("Error al guardar historia clínica:", error.message);
            return res.status(500).send("Error al guardar la historia clínica. Detalles: " + error.message);
        }
        
        // Redirigir al usuario a la página de historias clínicas si todo fue exitoso
        res.redirect("/dashboard_jmedico/historias");
    });
});

// Nuevo endpoint para obtener información del paciente por DNI
router.get('/dashboard_jmedico/getPacienteByDNI/:id', checkLoginMedico, function(req, res) {
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

router.get('/dashboard_jmedico/getMedico/:id', checkLoginMedico, function(req, res) {
    const medicoId = req.params.id;

    // Validar que el id sea un número entero positivo
    if (isNaN(medicoId) || medicoId <= 0) {
        return res.status(400).send("ID de médico no válido.");
    }

    // Consulta para obtener los detalles del médico
    const query = 'SELECT * FROM medicos WHERE id = ?';
    conexion.query(query, [medicoId], function(error, result) {
        if (error) {
            console.log("Error al obtener el médico: ", error.message);
            return res.status(500).send("Error al obtener el médico: " + error.message);
        }

        if (result.length > 0) {
            res.json(result[0]); // Retorna el primer médico encontrado
        } else {
            res.status(404).send("Médico no encontrado.");
        }
    });
});

router.get('/dashboard_jmedico/getUltimaHistoriaClinica/:pacienteId', checkLoginMedico, function(req, res) {
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

router.get('/dashboard_jmedico/getPaciente/:id', checkLoginMedico, function(req, res) {
    const pacienteId = req.params.id;

    // Suponiendo que tienes una consulta a la base de datos para obtener los datos del paciente
    const query = 'SELECT * FROM pacientes WHERE id = ?';
    conexion.query(query, [pacienteId], function(error, result) {
        if (error) {
            console.log("Error al obtener el paciente", error);
            return res.status(500).send("Error al obtener el paciente.");
        }

        if (result.length > 0) {
            res.json(result[0]); // Retorna el primer paciente encontrado
        } else {
            res.status(404).send("Paciente no encontrado.");
        }
    });
});

router.get('/dashboard_jmedico/getPacienteByDNI/:dni', checkLoginMedico, function(req, res) {
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

router.get("/dashboard_jmedico/test", checkLoginMedico, async (req,res) => {
    // traer citas de la base de datos
    // const citas = database.Citas('select * from citas');

    const data = {
        'total_citas':0,
        'titulo' : 'pagina de calendario',
        'usuario': req.session
    };
    
    res.render('dashboard_medico/test', data);
});

router.post("/dashboard_jmedico/test", checkLoginMedico, (req,res) => {

    // console.log(req.body);

    const data = {
        'username': req.body.username,
    };
    
    res.json(data);
});
router.get("/dashboard_jmedico/citas", checkLoginMedico, async (req, res) => {
    try {
        const citas = await conexion.query(`
            SELECT 
                c.id, 
                p.nombre AS nombre_paciente,
                p.apellido AS apellido_paciente,
                c.medico_id,
                c.servicio_id,
                s.nombre AS nombre_cita,
                c.fecha,
                c.hora,
                c.estado
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            JOIN servicios s ON c.servicio_id = s.id
            WHERE c.medico_id = ? 
            ORDER BY c.fecha, c.hora;
        `, [req.session.medico_id]);  // Se pasa el ID del médico para filtrar las citas

        const pacientes = await conexion.query(`SELECT * FROM pacientes`);
        const servicios = await conexion.query(`SELECT * FROM servicios`);

        res.render("dashboard_medico/citas", {
            'total_citas': citas.length,
            'titulo': 'Página de citas',
            'link': link,
            'usuario': req.session,
            'citas': citas,
            'pacientes': pacientes,
            'servicios': servicios
        });
    } catch (error) {
        console.error("Error al obtener citas:", error);
        res.status(500).send("Error al obtener citas");
    }
});

router.post("/dashboard_jmedico/citas", checkLoginMedico, async(req, res) =>{
    const idusuario = req.session.medico_id;
    const {paciente_id, servicio_id, fecha, hora} =req.body;
    console.log(fecha, hora)
    const valid = await new Promise((resolve) => {
        conexion.query(
          'SELECT * FROM `citas` WHERE hora = ? AND fecha = ?',
          [hora, fecha],
          function (_error, rows) {
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
    conexion.query(citas, [paciente_id, idusuario, servicio_id, fecha, hora], async function(error, rows){
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Error al registrar la cita" });
        }
        const data = {
            'titulo': 'Página de calendario',
            'usuario': req.session,
            'link': link,
        };
        res.render("dashboard_medico/calendario", data);
    });
});

router.post("/dashboard_admin/citas/guardar", checkLoginMedico, async (req, res) => {
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

router.delete("/dashboard_jmedico/citas/eliminar/:id", checkLoginMedico, async (req, res) => {
    conexion.query('update citas where id = ?',[req.params.id], function(error, rows){
        if(error){
            console.log(error)
            return res.status(500).json({ mensaje: "No se puedo eliminar" });
        }

        return res.json({ mensaje: "Cita eliminada exitosamente." });
    });
});

router.get("/dashboard_jmedico/cuentas", checkLoginMedico, async (req, res) => {
    try {
        const usuarios = await conexion.query(`
            SELECT 
                u.dni, 
                u.rol_id,
                COALESCE(p.nombre, m.nombre) AS nombre,
                COALESCE(p.apellido, m.apellido) AS apellido,
                COALESCE(p.email, m.email) AS email
            FROM usuarios u
            LEFT JOIN pacientes p ON u.dni = p.usuario_id
            LEFT JOIN medicos m ON u.dni = m.usuario_id
        `);

        const data = {
            'link': link,
            'usuario': req.session,
            'usuarios': usuarios
        };
        res.render("dashboard_medico/cuentas", data);
    } catch (error) {
        console.error("Error al obtener cuentas:", error);
        res.status(500).send("Error al obtener cuentas");
    }
});

router.get("/dashboard_jmedico/cuentas/buscar", checkLoginMedico, async (req, res) => {
    const { dni } = req.query;

    try {
        let query = `
            SELECT 
                u.dni, 
                u.rol_id,
                COALESCE(p.nombre, m.nombre) AS nombre,
                COALESCE(p.apellido, m.apellido) AS apellido,
                COALESCE(p.email, m.email) AS email
            FROM usuarios u
            LEFT JOIN pacientes p ON u.dni = p.usuario_id
            LEFT JOIN medicos m ON u.dni = m.usuario_id
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
router.get("/dashboard_jmedico/cuentas/validar-dni", checkLoginMedico, async (req, res) => {
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

router.get("/dashboard_jmedico/cuentas/usuario/:dni", async (req, res) => {
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
router.post("/dashboard_jmedico/cuentas/guardar", checkLoginMedico, async (req, res) => {
    const { dni, nombre, apellido, email, rol, contrasena } = req.body;

    try {
        // Insertar en la tabla usuarios
        await conexion.query(
            "INSERT INTO usuarios (dni, rol_id, contrasena) VALUES (?, ?, ?)",
            [dni, rol, contrasena]
        );

        if (rol == 1) { // Si es paciente
            // Insertar en la tabla pacientes
            await conexion.query(
                "INSERT INTO pacientes (usuario_id, nombre, apellido, email) VALUES (?, ?, ?, ?)",
                [dni, nombre, apellido, email]
            );
        } else if (rol == 2 || rol == 3) { // Si es medico o trabajador
            // Insertar en la tabla medicos
            await conexion.query(
                "INSERT INTO medicos (usuario_id, nombre, apellido, email) VALUES (?, ?, ?, ?)",
                [dni, nombre, apellido, email]
            );
        }

        return res.json({ success: true, mensaje: "Usuario agregado exitosamente" });
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        return res.status(500).json({ success: false, mensaje: "Error al guardar usuario" });
    }
});



router.get("/dashboard_jmedico/servicios", checkLoginMedico, async (req, res) => {
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
        res.render("dashboard_medico/servicios", data);
    } catch (error) {
        console.error("Error al obtener servicios:", error);
        res.status(500).send("Error al obtener servicios");
    }
});


router.get("/dashboard_jmedico/servicios/buscar", checkLoginMedico, async (req, res) => {
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

router.post("/dashboard_jmedico/servicios/guardar", checkLoginMedico, async (req, res) => {
    console.log(req.body)
    const { id,nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion, estado } = req.body;

    // // Validar datos de entrada
    // const validacion = validarServicio({ nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion });
    // if (!validacion.valido) {
    //     return res.status(400).json({ mensaje: validacion.mensaje });
    // }

    const data = await conexion.query("select * from servicios where id = ?", [id])
    if(data.length === 0){
          await conexion.query(
                `INSERT INTO servicios (nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion, estado, visibilidad) 
                 VALUES (?, ?, ?, ?, ?,?, 1)`,
                [nombre, descripcion, costo, tiempo_duracion, tiempo_recuperacion, estado]
            );

            return res.json({ mensaje: "Servicio registrado exitosamente" });
    }else{

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
});

router.delete("/dashboard_jmedico/servicios/eliminar/:id", checkLoginMedico, async (req, res) => {
    conexion.query('update servicios set visibilidad = 0 where id = ?',[req.params.id], function(error, rows){
        if(error){
            console.log(error)
            return res.status(500).json({ mensaje: "no se puedo eliminar" });
        }

        return res.json({ mensaje: "Servicio eliminado exitosamente." });
    });
});


module.exports = router;
