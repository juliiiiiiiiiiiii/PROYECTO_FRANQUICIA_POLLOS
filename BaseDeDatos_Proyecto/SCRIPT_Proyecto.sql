DROP DATABASE IF EXISTS Franquicia_Pollos;
CREATE DATABASE Franquicia_Pollos DEFAULT CHARACTER SET utf8mb4;
USE Franquicia_Pollos;

-- Caja
CREATE TABLE Caja (
    Id_Caja INT NOT NULL,
    Monto_inicial DECIMAL(10,2) NOT NULL,
    Monto_actual DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Id_Caja)
);

-- Cajero
CREATE TABLE Cajero (
    Id_Cajero INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    Credencial VARCHAR(45) NOT NULL,
    Sueldo_base DECIMAL(10,2) NOT NULL,
    Porcentaje_ganancia DECIMAL(5,2) NOT NULL,
    Frencuencia_pago ENUM('diario','semanal','quincenal','mensual') NOT NULL,
    PRIMARY KEY (Id_Cajero)
);

-- Cliente
CREATE TABLE Cliente (
    Id_cliente INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (Id_cliente)
);

-- Medio_Pago
CREATE TABLE Medio_Pago (
    Id_medio_pago INT NOT NULL,
    Nombre VARCHAR(45) NOT NULL,
    PRIMARY KEY (Id_medio_pago),
    UNIQUE (Nombre)
);

-- Producto
CREATE TABLE Producto (
    Id_producto INT NOT NULL,
    Nombre_producto VARCHAR(100) NOT NULL,
    Stock INT NOT NULL,
    Categoria VARCHAR(45) NOT NULL,
    Tipo_producto VARCHAR(45) NOT NULL,
    PRIMARY KEY (Id_producto)
);

-- Proveedor
CREATE TABLE Proveedor (
    Id_proveedor INT NOT NULL,
    Nombre_proveedor VARCHAR(100) NOT NULL,
    Contacto VARCHAR(100) NOT NULL,
    PRIMARY KEY (Id_proveedor)
);

-- Dueno
CREATE TABLE Dueno (
    Usuario VARCHAR(45) NOT NULL,
    `Contraseña` VARCHAR(255) NOT NULL,
    Nombre_dueno VARCHAR(45) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (Usuario)
);

-- Administrativo
CREATE TABLE Administrativo (
    Usuario VARCHAR(45) NOT NULL,
    `contraseña` VARCHAR(255) NOT NULL,
    Nombre_administrativo VARCHAR(100) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (Usuario)
);

-- Estado_cuenta
CREATE TABLE Estado_cuenta (
    Id_estado_cuenta INT NOT NULL,
    Monto DECIMAL(12,2) NOT NULL,
    Usuario_dueno VARCHAR(45) NOT NULL,
    PRIMARY KEY (Id_estado_cuenta),
    FOREIGN KEY (Usuario_dueno) REFERENCES Dueno (Usuario)
);

-- Turno_cajero
CREATE TABLE Turno_cajero (
    Id_turno_cajero INT NOT NULL,
    Fecha DATE NOT NULL,
    Hora_inicio TIME NOT NULL,
    Hora_fin TIME NOT NULL,
    Id_cajero INT NOT NULL,
    Id_caja INT NOT NULL,
    PRIMARY KEY (Id_turno_cajero),
    FOREIGN KEY (Id_cajero) REFERENCES Cajero (Id_Cajero),
    FOREIGN KEY (Id_caja) REFERENCES Caja (Id_Caja)
);

-- Pago_cajero
CREATE TABLE Pago_cajero (
    Id_pago_cajero INT NOT NULL,
    Periodo_inicio DATE NOT NULL,
    Periodo_fin DATE NOT NULL,
    Turnos_trabajados INT NOT NULL,
    Ventas_periodo DECIMAL(12,2) NOT NULL,
    Monto_base DECIMAL(12,2) NOT NULL,
    Monto_comision DECIMAL(12,2) NOT NULL,
    Monto_total DECIMAL(12,2) NOT NULL,
    Id_cajero INT NOT NULL,
    PRIMARY KEY (Id_pago_cajero),
    FOREIGN KEY (Id_cajero) REFERENCES Cajero (Id_Cajero)
);

-- Venta
CREATE TABLE Venta (
    Id_venta INT NOT NULL,
    Fecha_compra DATE NOT NULL,
    Id_cliente INT NOT NULL,
    Id_cajero INT NOT NULL,
    Id_medio_pago INT NOT NULL,
    PRIMARY KEY (Id_venta),
    FOREIGN KEY (Id_cliente) REFERENCES Cliente (Id_cliente),
    FOREIGN KEY (Id_cajero) REFERENCES Cajero (Id_Cajero),
    FOREIGN KEY (Id_medio_pago) REFERENCES Medio_Pago (Id_medio_pago)
);

-- Detalle_venta
CREATE TABLE Detalle_venta (
    Id_detalle_venta INT NOT NULL,
    Cantidad INT NOT NULL,
    Precio_unitario DECIMAL(10,2) NOT NULL,
    Id_venta INT NOT NULL,
    Id_producto INT NOT NULL,
    PRIMARY KEY (Id_detalle_venta),
    FOREIGN KEY (Id_venta) REFERENCES Venta (Id_venta),
    FOREIGN KEY (Id_producto) REFERENCES Producto (Id_producto)
);

-- Orden_compra
CREATE TABLE Orden_compra (
    Id_Orden_compra INT NOT NULL,
    Fecha_comision DATE NOT NULL,
    Id_proveedor INT NOT NULL,
    PRIMARY KEY (Id_Orden_compra),
    FOREIGN KEY (Id_proveedor) REFERENCES Proveedor (Id_proveedor)
);

-- Producto_proveedor
CREATE TABLE Producto_proveedor (
    Id_producto INT NOT NULL,
    Id_proveedor INT NOT NULL,
    PRIMARY KEY (Id_producto, Id_proveedor),
    FOREIGN KEY (Id_producto) REFERENCES Producto (Id_producto),
    FOREIGN KEY (Id_proveedor) REFERENCES Proveedor (Id_proveedor)
);

-- Empleado
CREATE TABLE Empleado (
    Id_Empleado INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    Cargo VARCHAR(45) NOT NULL,
    Sueldo_base DECIMAL(10,2) NOT NULL,
    Administrativo_Usuario VARCHAR(45) NOT NULL,
    PRIMARY KEY (Id_Empleado),
    FOREIGN KEY (Administrativo_Usuario) REFERENCES Administrativo (Usuario)
);