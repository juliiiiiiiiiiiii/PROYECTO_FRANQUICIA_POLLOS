DROP DATABASE IF EXISTS Franquicia_Pollos;
CREATE DATABASE Franquicia_Pollos DEFAULT CHARACTER SET utf8mb4;
USE Franquicia_Pollos;

CREATE TABLE Caja (
    Id_Caja INT NOT NULL,
    Monto_inicial DECIMAL(10,2) NOT NULL,
    Monto_actual DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Id_Caja)
);

CREATE TABLE Cajero (
    Id_Cajero INT NOT NULL,
    Usuario VARCHAR(45) NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    Credencial VARCHAR(45) NOT NULL,
    Sueldo_base DECIMAL(10,2) NOT NULL,
    Porcentaje_ganancia DECIMAL(5,2) NOT NULL,
    Frecuencia_pago ENUM('diario','semanal','quincenal','mensual') NOT NULL,
    PRIMARY KEY (Id_Cajero),
    UNIQUE (Usuario)
);

CREATE TABLE Cliente (
    Id_cliente INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (Id_cliente)
);

CREATE TABLE Medio_Pago (
    Id_medio_pago INT NOT NULL,
    Nombre VARCHAR(45) NOT NULL,
    PRIMARY KEY (Id_medio_pago),
    UNIQUE (Nombre)
);

CREATE TABLE Producto (
    Id_producto INT NOT NULL,
    Nombre_producto VARCHAR(100) NOT NULL,
    Stock INT NOT NULL,
    Categoria VARCHAR(45) NOT NULL,
    Tipo_producto VARCHAR(45) NOT NULL,
    PRIMARY KEY (Id_producto)
);

CREATE TABLE Proveedor (
    Id_proveedor INT NOT NULL,
    Nombre_proveedor VARCHAR(100) NOT NULL,
    Contacto VARCHAR(100) NOT NULL,
    PRIMARY KEY (Id_proveedor)
);

CREATE TABLE Dueno (
    Usuario VARCHAR(45) NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    Nombre_dueno VARCHAR(45) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (Usuario)
);

CREATE TABLE Administrativo (
    Usuario VARCHAR(45) NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    Nombre_administrativo VARCHAR(100) NOT NULL,
    Fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (Usuario)
);

CREATE TABLE Estado_cuenta (
    Id_estado_cuenta INT NOT NULL,
    Monto DECIMAL(12,2) NOT NULL,
    Usuario_dueno VARCHAR(45) NOT NULL,
    PRIMARY KEY (Id_estado_cuenta),
    FOREIGN KEY (Usuario_dueno) REFERENCES Dueno (Usuario)
);

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

CREATE TABLE Orden_compra (
    Id_Orden_compra INT NOT NULL,
    Fecha_comision DATE NOT NULL,
    Id_proveedor INT NOT NULL,
    PRIMARY KEY (Id_Orden_compra),
    FOREIGN KEY (Id_proveedor) REFERENCES Proveedor (Id_proveedor)
);

CREATE TABLE Producto_proveedor (
    Id_producto INT NOT NULL,
    Id_proveedor INT NOT NULL,
    PRIMARY KEY (Id_producto, Id_proveedor),
    FOREIGN KEY (Id_producto) REFERENCES Producto (Id_producto),
    FOREIGN KEY (Id_proveedor) REFERENCES Proveedor (Id_proveedor)
);

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