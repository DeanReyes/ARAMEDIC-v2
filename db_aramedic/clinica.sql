-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-12-2024 a las 21:50:40
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `clinica`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `login_procedure` (IN `idrol` INT, IN `iduser` INT)   BEGIN
    IF (idrol = 1) THEN
        SELECT u.id, u.dni, p.nombre, p.telefono, p.email, p.id AS paciente_id, u.contrasena, u.rol_id 
        FROM usuarios u 
        INNER JOIN pacientes p 
        ON p.usuario_id = u.id 
        WHERE p.usuario_id = iduser;
    ELSEIF (idrol = 2) THEN
        SELECT u.id, u.dni, m.nombre, m.telefono, m.email, m.id AS medico_id, u.contrasena, u.rol_id 
        FROM usuarios u 
        INNER JOIN medicos m 
        ON m.usuario_id = u.id 
        WHERE m.usuario_id = iduser;
	ELSEIF (idrol = 3) THEN
        SELECT u.id, u.dni, u.contrasena, u.rol_id 
        FROM usuarios u 
        WHERE u.id = iduser;
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `estado` enum('pendiente','confirmada','cancelada') DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`id`, `paciente_id`, `medico_id`, `servicio_id`, `fecha`, `hora`, `estado`) VALUES
(1, 1, 2, 2, '2023-11-15', '10:00:00', 'confirmada'),
(3, 8, 3, 2, '2024-11-27', '12:20:00', 'pendiente'),
(4, 8, 3, 1, '2024-11-27', '08:00:00', 'pendiente'),
(5, 9, 3, 2, '2024-11-27', '19:00:00', 'pendiente'),
(6, 9, 3, 2, '2024-11-27', '19:00:00', 'pendiente'),
(15, 1, 3, 2, '2024-12-10', '12:20:00', 'pendiente'),
(16, 9, 3, 1, '2024-12-07', '11:00:00', 'pendiente'),
(17, 9, 2, 10, '2024-12-07', '12:20:00', 'pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especialidades`
--

CREATE TABLE `especialidades` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `especialidades`
--

INSERT INTO `especialidades` (`id`, `nombre`) VALUES
(1, 'Cardiología'),
(2, 'Pediatría'),
(3, 'Dermatología');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fechas`
--

CREATE TABLE `fechas` (
  `id_fecha` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_final` date NOT NULL,
  `id_usuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `fechas`
--

INSERT INTO `fechas` (`id_fecha`, `fecha_inicio`, `fecha_final`, `id_usuario`) VALUES
(1, '2024-11-20', '2024-11-30', 2),
(2, '2024-11-05', '2024-11-15', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_medico`
--

CREATE TABLE `historial_medico` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `motivo` text NOT NULL,
  `enfermedades_previas` text DEFAULT NULL,
  `alergias` text DEFAULT NULL,
  `medicamentos_actuales` text DEFAULT NULL,
  `cirugias_previas` text DEFAULT NULL,
  `fuma` tinyint(1) DEFAULT 0,
  `consume_alcohol` tinyint(1) NOT NULL DEFAULT 0,
  `enfermedades_hereditarias` text DEFAULT NULL,
  `peso` double DEFAULT NULL,
  `altura` double DEFAULT NULL,
  `imc` double DEFAULT NULL,
  `descripcion_fisica` text DEFAULT NULL,
  `cirugia` text DEFAULT NULL,
  `procedimiento` text DEFAULT NULL,
  `riesgos` text DEFAULT NULL,
  `cuidado_preoperativo` text DEFAULT NULL,
  `cuidado_postoperativo` text DEFAULT NULL,
  `medico_id` int(11) DEFAULT NULL,
  `horaCreacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `horaActualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial_medico`
--

INSERT INTO `historial_medico` (`id`, `paciente_id`, `motivo`, `enfermedades_previas`, `alergias`, `medicamentos_actuales`, `cirugias_previas`, `fuma`, `consume_alcohol`, `enfermedades_hereditarias`, `peso`, `altura`, `imc`, `descripcion_fisica`, `cirugia`, `procedimiento`, `riesgos`, `cuidado_preoperativo`, `cuidado_postoperativo`, `medico_id`, `horaCreacion`, `horaActualizacion`) VALUES
(2, 1, 'Chequeo Semanal', 'Gastritis', 'Inhibidor de bomba de protones', 'Recomendar dieta baja en grasas', 'trabaja dean', 0, 1, 'N/A', 90.5, 170, 2.5, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 3, '2024-11-20 19:56:08', '2024-11-24 05:01:10'),
(15, 7, '', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-20 19:56:08', '2024-11-20 19:56:08'),
(16, 8, '', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-20 19:56:08', '2024-11-20 19:56:08'),
(17, 7, '<xzxczxc', 'zxczxc', 'zxczxc', 'zzczx', 'czxczxc', 0, 0, 'zxczx', 111, 222, 11, 'asdasd', 'asdasd', 'asda', 'asda', 'asdas', 'asdas', 3, '2024-11-25 04:41:31', '2024-11-28 14:32:33'),
(18, 9, '', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-11-26 19:55:29', '2024-11-26 19:55:29'),
(20, 1, 'Chequeo Semanal', 'Gastritis', 'Inhibidor de bomba de protones', 'Recomendar dieta baja en grasas', 'trabaja dean', 0, 1, 'N/A', 90, 170, 2.5, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 3, '2024-12-06 18:45:11', '2024-12-06 18:45:11'),
(21, 1, 'falto', 'Gastritis', 'Inhibidor de bomba de protones', 'Recomendar dieta baja en grasas', 'trabaja dean', 0, 1, 'N/A', 90, 170, 2.5, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 3, '2024-12-06 18:46:21', '2024-12-06 18:46:21'),
(22, 2, 'trabaja dean', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2024-12-06 19:48:13', '2024-12-06 19:48:13'),
(23, 2, 'trabaja dean', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2024-12-06 19:48:33', '2024-12-06 19:48:33');

--
-- Disparadores `historial_medico`
--
DELIMITER $$
CREATE TRIGGER `before_historial_medico_update` BEFORE UPDATE ON `historial_medico` FOR EACH ROW BEGIN
    SET NEW.horaActualizacion = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_historial_medico` BEFORE INSERT ON `historial_medico` FOR EACH ROW BEGIN
    DECLARE user_estado INT;
    SELECT estado INTO user_estado FROM usuarios WHERE id = NEW.paciente_id;
    IF user_estado = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El usuario está deshabilitado y no puede registrar historial médico.';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_historial_medico` BEFORE UPDATE ON `historial_medico` FOR EACH ROW BEGIN
    DECLARE user_estado INT;
    SELECT estado INTO user_estado FROM usuarios WHERE id = NEW.paciente_id;
    IF user_estado = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El usuario está deshabilitado y no puede modificar historial médico.';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `prevent_disabled_patient_historia` BEFORE INSERT ON `historial_medico` FOR EACH ROW BEGIN
    DECLARE estado_paciente CHAR(1);

    -- Consultar el estado del paciente
    SELECT u.estado
    INTO estado_paciente
    FROM pacientes p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.id = NEW.paciente_id;

    -- Si el paciente está deshabilitado, generar un error
    IF estado_paciente = '0' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede registrar una historia clínica para un paciente deshabilitado.';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validar_estado_medico_before_insert` BEFORE INSERT ON `historial_medico` FOR EACH ROW BEGIN
    DECLARE medico_estado VARCHAR(20);

    -- Obtener el estado del usuario relacionado con el médico
    SELECT u.estado
    INTO medico_estado
    FROM usuarios u
    JOIN medicos m ON m.usuario_id = u.id
    WHERE m.id = NEW.medico_id;

    -- Verificar si el estado del médico es "habilitado"
    IF medico_estado = '0' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede registrar una historia clínica con un médico deshabilitado';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medicos`
--

CREATE TABLE `medicos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `especialidad_id` int(11) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `medicos`
--

INSERT INTO `medicos` (`id`, `nombre`, `apellido`, `especialidad_id`, `telefono`, `email`, `usuario_id`) VALUES
(1, 'Carlos', 'Lopez', 1, '555789012', 'carlos.lopez@example.com', 3),
(2, 'Ana', 'Martinez', 2, '555345678', 'ana.martinez@example.com', 2),
(3, 'dereck', 'muñoz', 1, '944224435', 'dereckmunoz07@gmail.com', 13),
(4, 'dean', 'dean', NULL, NULL, 'deam@gmail.com', 16);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medico_servicio`
--

CREATE TABLE `medico_servicio` (
  `id` int(11) NOT NULL,
  `medico_id` int(11) DEFAULT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `medico_servicio`
--

INSERT INTO `medico_servicio` (`id`, `medico_id`, `servicio_id`, `estado`) VALUES
(1, 1, 1, 'activo'),
(2, 3, 2, 'activo'),
(3, 3, 1, 'activo'),
(4, 3, 10, 'activo'),
(5, 3, 11, 'activo'),
(6, 2, 10, 'activo'),
(7, 3, 11, 'activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` tinyint(2) DEFAULT NULL,
  `estado_civil` text NOT NULL,
  `ocupacion` text NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `estado_civil`, `ocupacion`, `telefono`, `email`, `direccion`, `usuario_id`) VALUES
(1, 'Juan', 'Pérez', '1985-05-10', 0, '', '', '555123456', 'pierocarhuaricra@gmail.com', 'Calle 123, Ciudad', 1),
(2, 'Maria', 'Gomez', '1990-11-25', 1, '', '', '555654321', 'maria.gomez@example.com', 'Avenida 456, Ciudad', 4),
(7, 'DERECK', 'MUÑOZ', NULL, NULL, '', '', '999999999', 'dereckmunoz07@gmail.com', NULL, 11),
(8, 'DERECK', 'Muñoz', NULL, NULL, '', '', '999999999', 'dereckmunoz07@gmail.com', NULL, 12),
(9, 'DERECK', 'FERNANDO', NULL, NULL, '', '', '999999991', 'dereckmunoz07@gmail.com', NULL, 15);

--
-- Disparadores `pacientes`
--
DELIMITER $$
CREATE TRIGGER `create_medical_history` AFTER INSERT ON `pacientes` FOR EACH ROW INSERT INTO historial_medico (paciente_id)
VALUES (NEW.id)
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

CREATE TABLE `rol` (
  `id` int(11) NOT NULL,
  `nombre_rol` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`id`, `nombre_rol`) VALUES
(1, 'paciente'),
(2, 'medico'),
(3, 'admin');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `costo` decimal(10,2) NOT NULL,
  `tiempo_duracion` varchar(255) DEFAULT NULL,
  `tiempo_recuperacion` varchar(255) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `visibilidad` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id`, `nombre`, `descripcion`, `costo`, `tiempo_duracion`, `tiempo_recuperacion`, `estado`, `visibilidad`) VALUES
(1, 'Consulta General', 'Consulta general con el médico', 40.00, '30', '1', 'activo', 1),
(2, 'Examen de Sangre', 'Análisis de sangre completo', 30.00, '40', '14', 'activo', 1),
(3, 'Radiografía', 'Radiografía de diagnóstico', 600.00, '50', '2', 'activo', 1),
(8, 'sdfjdj', 'asdasd', 20.00, '1', '1', 'activo', 1),
(9, 'ahora ya sé', 'te aaa', 10000.00, '4', '5', 'inactivo', 1),
(10, 'DERECK FERNANDO', '1212', 111.00, '1', '1', 'inactivo', 1),
(11, 'dfsdfksdj lksdf', 'aaaaa', 111.00, '11', '1', 'activo', 0),
(13, 'Rinoplastia', 'ah', 150.00, '10', '1', 'inactivo', 1),
(14, 'prueba', 'mi descripcion', 1.00, '1', '1', 'activo', 1),
(15, 'Dean', 'asd', 15.00, '16', '16', 'activo', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `dni` varchar(8) DEFAULT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `estado` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `dni`, `contrasena`, `rol_id`, `estado`) VALUES
(1, '74972730', '$2b$10$y.vlmlwXZoz9vK/H8m0qQO7ZfKVvWz/19c0QR2714n1YQZtFWstYS', 1, 0),
(2, '75565656', '$2b$10$agNIAA3QJNVXckD3YiYc5O9HGYa/owAJlPEOY4WavG8lgXXrw6N8i', 2, 1),
(3, '74733222', 'contrasena_segura789', 2, 1),
(4, '16780921', 'Asd123123', 1, 1),
(11, '74733211', '$2b$10$ZRdhUj6d8GHNd/hsK47GHuohNlxhd2GvWXZQ/PfWR.GTZWHJgATEC', 1, 1),
(12, '74733299', '$2b$10$/NB90fLoUA5hcLz.kwL8VubJn8mpflhdKGtI6Lpt3Mjgsj9BQ5v3S', 1, 1),
(13, '74733226', '$2b$10$8LvUC5hHxsjhu0rns/YuUeFzQOyfBsu/AiG9jFwT9K4MA27BlW91W', 2, 0),
(14, '12345678', '$2b$10$KSRLPcmF4VVRaj1Ug58hke2a5trtFVJCmqXvAZSKZGAyTnJPZt/L2', 3, 1),
(15, '74733225', '$2b$10$DyYWE5niW4MimCyA8o29B.K153phNPwVBqe1thqwwKjvb6xcGB6RK', 1, 1),
(16, '77777777', '$2b$10$BWbJsedmwGFE042k5UX2B.ywvRosiohVcu2zeNDuWbek1IaWVqHa6', 2, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_key`
--

CREATE TABLE `usuarios_key` (
  `id` int(11) NOT NULL,
  `email` text NOT NULL,
  `key` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `servicio_id` (`servicio_id`);

--
-- Indices de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `fechas`
--
ALTER TABLE `fechas`
  ADD PRIMARY KEY (`id_fecha`);

--
-- Indices de la tabla `historial_medico`
--
ALTER TABLE `historial_medico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`);

--
-- Indices de la tabla `medicos`
--
ALTER TABLE `medicos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `especialidad_id` (`especialidad_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `medico_servicio`
--
ALTER TABLE `medico_servicio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `servicio_id` (`servicio_id`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rol` (`rol_id`);

--
-- Indices de la tabla `usuarios_key`
--
ALTER TABLE `usuarios_key`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `fechas`
--
ALTER TABLE `fechas`
  MODIFY `id_fecha` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `historial_medico`
--
ALTER TABLE `historial_medico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `medicos`
--
ALTER TABLE `medicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `medico_servicio`
--
ALTER TABLE `medico_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `rol`
--
ALTER TABLE `rol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `usuarios_key`
--
ALTER TABLE `usuarios_key`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`),
  ADD CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`);

--
-- Filtros para la tabla `historial_medico`
--
ALTER TABLE `historial_medico`
  ADD CONSTRAINT `historial_medico_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `historial_medico_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`);

--
-- Filtros para la tabla `medicos`
--
ALTER TABLE `medicos`
  ADD CONSTRAINT `medicos_ibfk_1` FOREIGN KEY (`especialidad_id`) REFERENCES `especialidades` (`id`),
  ADD CONSTRAINT `medicos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `medico_servicio`
--
ALTER TABLE `medico_servicio`
  ADD CONSTRAINT `medico_servicio_ibfk_1` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`),
  ADD CONSTRAINT `medico_servicio_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`);

--
-- Filtros para la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_3` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
