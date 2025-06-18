-- Crear la base de datos
CREATE DATABASE countryAG;

-- Seleccionar la base de datos
USE countryAG;

-- Configurar timezone de Argentina
SET time_zone = 'America/Argentina/Buenos_Aires';

-- Tabla de personas
CREATE TABLE personas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin', 'propietario', 'proveedor') NOT NULL DEFAULT 'usuario',
    celular VARCHAR(30),
    area VARCHAR(100),
    lote VARCHAR(100),
    ocupacion VARCHAR(100),
    esPropietario BOOLEAN DEFAULT FALSE,
    esProveedor BOOLEAN DEFAULT FALSE
);

-- Tabla de boletos (nueva lógica: uso ilimitado por 24 horas)
CREATE TABLE boletos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    idUsers INT NOT NULL,
    codigo_boleto VARCHAR(100) NOT NULL,
    lote VARCHAR(100) NOT NULL,
    estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    primer_uso TIMESTAMP NULL,
    valido_hasta TIMESTAMP NULL,
    activo BOOLEAN DEFAULT TRUE,
    contador INT DEFAULT 0,
    qr_activo BOOLEAN DEFAULT FALSE,
    qr_valido_hasta TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsers) REFERENCES personas(id) ON DELETE CASCADE
);

-- Tabla de escaneos de QR (simplificada)
CREATE TABLE escaneos_qr (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boleto_id INT NOT NULL,
    fecha_escaneo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    escaneado_por INT NOT NULL,
    FOREIGN KEY (boleto_id) REFERENCES boletos(id) ON DELETE CASCADE,
    FOREIGN KEY (escaneado_por) REFERENCES personas(id) ON DELETE CASCADE
);
