USE Franquicia_Pollos;

START TRANSACTION;

INSERT INTO Dueno (Usuario, `Contraseña`, Nombre_dueno, Fecha_nacimiento) VALUES
('carlos.ramirez', SHA2('Dueno2026*', 256), 'Carlos Ramírez', '1978-05-14');

INSERT INTO Administrativo (Usuario, `contraseña`, Nombre_administrativo, Fecha_nacimiento) VALUES
('laura.mendez', SHA2('Admin2026*', 256), 'Laura Méndez', '1988-09-02');

INSERT INTO Medio_Pago (Id_medio_pago, Nombre) VALUES
(1, 'Efectivo'),
(2, 'Tarjeta'),
(3, 'Transferencia / Nequi');

INSERT INTO Caja (Id_Caja, Monto_inicial, Monto_actual) VALUES
(1, 200000.00, 200000.00),
(2, 200000.00, 200000.00);

INSERT INTO Cajero (Id_Cajero, Nombre, Fecha_nacimiento, Credencial, Sueldo_base, Porcentaje_ganancia, Frecuencia_pago) VALUES
(1, 'Lucía Torres', '1996-03-21', 'CAJ-DIA-001',   1800000.00, 1.00, 'quincenal'),
(2, 'Miguel Soto',  '1994-11-08', 'CAJ-NOCHE-002', 1800000.00, 1.00, 'quincenal');

INSERT INTO Turno_cajero (Id_turno_cajero, Fecha, Hora_inicio, Hora_fin, Id_cajero, Id_caja) VALUES
(1,  '2026-11-01', '08:00:00', '16:00:00', 1, 1),
(2,  '2026-11-01', '16:00:00', '23:00:00', 2, 2),
(3,  '2026-11-02', '08:00:00', '16:00:00', 1, 1),
(4,  '2026-11-02', '16:00:00', '23:00:00', 2, 2),
(5,  '2026-11-03', '08:00:00', '16:00:00', 1, 1),
(6,  '2026-11-03', '16:00:00', '23:00:00', 2, 2),
(7,  '2026-11-04', '08:00:00', '16:00:00', 1, 1),
(8,  '2026-11-04', '16:00:00', '23:00:00', 2, 2),
(9,  '2026-11-05', '08:00:00', '16:00:00', 1, 1),
(10, '2026-11-05', '16:00:00', '23:00:00', 2, 2),
(11, '2026-11-06', '08:00:00', '16:00:00', 1, 1),
(12, '2026-11-06', '16:00:00', '23:00:00', 2, 2),
(13, '2026-11-07', '08:00:00', '16:00:00', 1, 1),
(14, '2026-11-07', '16:00:00', '23:00:00', 2, 2),
(15, '2026-11-08', '08:00:00', '16:00:00', 1, 1),
(16, '2026-11-08', '16:00:00', '23:00:00', 2, 2),
(17, '2026-11-09', '08:00:00', '16:00:00', 1, 1),
(18, '2026-11-09', '16:00:00', '23:00:00', 2, 2),
(19, '2026-11-10', '08:00:00', '16:00:00', 1, 1),
(20, '2026-11-10', '16:00:00', '23:00:00', 2, 2),
(21, '2026-11-11', '08:00:00', '16:00:00', 1, 1),
(22, '2026-11-11', '16:00:00', '23:00:00', 2, 2),
(23, '2026-11-12', '08:00:00', '16:00:00', 1, 1),
(24, '2026-11-12', '16:00:00', '23:00:00', 2, 2),
(25, '2026-11-13', '08:00:00', '16:00:00', 1, 1),
(26, '2026-11-13', '16:00:00', '23:00:00', 2, 2);

INSERT INTO Empleado (Id_Empleado, Nombre, Fecha_nacimiento, Cargo, Sueldo_base, Administrativo_Usuario) VALUES
(1, 'Ana Pérez',       '1998-04-10', 'Mesero',   1750000.00, 'laura.mendez'),
(2, 'Valentina Gómez', '2000-08-19', 'Mesero',   1750000.00, 'laura.mendez'),
(3, 'Andrés Rojas',    '1997-01-25', 'Mesero',   1750000.00, 'laura.mendez'),
(4, 'Marta Herrera',   '1975-06-30', 'Aseo',     1750000.00, 'laura.mendez'),
(5, 'José Díaz',       '1980-03-05', 'Cocinero', 2500000.00, 'laura.mendez'),
(6, 'Carlos Mejía',    '1991-12-17', 'Cocinero', 2200000.00, 'laura.mendez'),
(7, 'Diana López',     '1993-05-22', 'Cocinero', 2200000.00, 'laura.mendez'),
(8, 'Felipe Vargas',   '1995-09-09', 'Cocinero', 2200000.00, 'laura.mendez');

INSERT INTO Producto (Id_producto, Nombre_producto, Stock, Categoria, Tipo_producto) VALUES
(1,  'Broaster 8 presas',             0,   'Broaster',          'Preparado'),
(2,  'Broaster 4 presas',             0,   'Broaster',          'Preparado'),
(3,  'Alitas broaster',               0,   'Broaster',          'Preparado'),
(4,  'Pollo entero a la brasa',       0,   'Brasa',             'Preparado'),
(5,  'Medio pollo a la brasa',        0,   'Brasa',             'Preparado'),
(6,  'Cuarto de pollo a la brasa',    0,   'Brasa',             'Preparado'),
(7,  'Papas fritas',                  0,   'Complementos',      'Preparado'),
(8,  'Ensalada fresca',               0,   'Complementos',      'Preparado'),
(9,  'Mollejitas',                    0,   'Complementos',      'Preparado'),
(10, 'Gaseosa personal 500 ml',       80,  'Bebidas',           'Reventa'),
(11, 'Gaseosa 1.5 L',                 30,  'Bebidas',           'Reventa'),
(12, 'Jugo natural',                  0,   'Bebidas',           'Preparado'),
(13, 'Combo Familiar',                0,   'Combos',            'Preparado'),
(14, 'Combo Pareja',                  0,   'Combos',            'Preparado'),
(15, 'Combo Broaster',                0,   'Combos',            'Preparado'),
(16, 'Pollo entero crudo (und)',      120, 'Pollo',             'Insumo'),
(17, 'Alitas de pollo (kg)',          12,  'Pollo',             'Insumo'),
(18, 'Mollejas (kg)',                 8,   'Pollo',             'Insumo'),
(19, 'Papa (kg)',                     15,  'Acompañamientos',   'Insumo'),
(20, 'Verduras para ensalada (kg)',   18,  'Acompañamientos',   'Insumo'),
(21, 'Fruta para jugos (kg)',         9,   'Acompañamientos',   'Insumo'),
(22, 'Aceite vegetal (litro)',        8,   'Insumos de cocina', 'Insumo'),
(23, 'Harina para apanar (kg)',       25,  'Insumos de cocina', 'Insumo'),
(24, 'Especias y adobos (kg)',        6,   'Insumos de cocina', 'Insumo'),
(25, 'Salsas y cremas (galón)',       4,   'Insumos de cocina', 'Insumo'),
(26, 'Carbón vegetal (bulto)',        10,  'Insumos de cocina', 'Insumo'),
(27, 'Sal (kg)',                      10,  'Insumos de cocina', 'Insumo'),
(28, 'Gas propano (cilindro)',        3,   'Insumos de cocina', 'Insumo'),
(29, 'Empaques para domicilio (und)', 300, 'Empaques',          'Insumo');

INSERT INTO Proveedor (Id_proveedor, Nombre_proveedor, Contacto) VALUES
(1,  'Avícola San Pedro',     'Juan Medina - 987 654 321'),
(2,  'Pollos El Campo',       'Martha Rincón - 311 245 6789'),
(3,  'Avícola La Granja',     'Óscar Pinzón - 312 908 4411'),
(4,  'Distribuidora La Papa', 'Rosa Quispe - 955 112 233'),
(5,  'Fruver La Cosecha',     'Sandra Ortiz - 310 456 7788'),
(6,  'Frutas del Valle',      'Camilo Arango - 315 330 2299'),
(7,  'Aceites del Llano',     'Ricardo Peña - 316 772 0145'),
(8,  'Molinos El Trigal',     'Gloria Navarro - 317 540 8823'),
(9,  'Condimentos La Sazón',  'Patricia Duarte - 318 661 9034'),
(10, 'Abarrotes El Granero',  'Héctor Ríos - 320 998 1122'),
(11, 'Carbones La Brasa',     'Wilson Cárdenas - 321 447 5560'),
(12, 'Salinas del Norte',     'Esteban Mora - 324 276 6610'),
(13, 'Gas Andino',            'Fernando Lozano - 323 905 3381'),
(14, 'Empaques Plastimax',    'Natalia Suárez - 322 118 7746'),
(15, 'Bebidas del Sur',       'Luis Carrión - 944 778 990');

INSERT INTO Producto_proveedor (Id_producto, Id_proveedor) VALUES
(16, 1),
(17, 2),
(18, 3),
(19, 4),
(20, 5),
(21, 6),
(22, 7),
(23, 8),
(24, 9),
(25, 10),
(26, 11),
(27, 12),
(28, 13),
(29, 14),
(10, 15),
(11, 15);

INSERT INTO Estado_cuenta (Id_estado_cuenta, Monto, Usuario_dueno) VALUES
(1, 14320000.00, 'carlos.ramirez');

COMMIT;
