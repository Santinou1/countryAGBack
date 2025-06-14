-- Crear la base de datos
CREATE DATABASE countryAG;

-- Seleccionar la base de datos
USE countryAG;

-- Tabla de personas
CREATE TABLE personas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario'
);

-- Tabla de boletos
CREATE TABLE boletos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    idUsers INT NOT NULL,
    codigo_boleto VARCHAR(100) NOT NULL,
    lote VARCHAR(100) NOT NULL,
    estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    ida BOOLEAN DEFAULT FALSE,
    vuelta BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (idUsers) REFERENCES personas(id) ON DELETE CASCADE
);

-- Tabla de escaneos de QR
CREATE TABLE escaneos_qr (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boleto_id INT NOT NULL,
    tipo ENUM('ida', 'vuelta') NOT NULL,
    fecha_escaneo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    escaneado_por INT NOT NULL,
    FOREIGN KEY (boleto_id) REFERENCES boletos(id) ON DELETE CASCADE,
    FOREIGN KEY (escaneado_por) REFERENCES personas(id) ON DELETE CASCADE
);
