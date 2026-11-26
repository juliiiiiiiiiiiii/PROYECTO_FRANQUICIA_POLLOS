-- =====================================================================
--  Franquicia_Pollos - Consultas de ejemplo
-- =====================================================================

USE Franquicia_Pollos;

-- ---------------------------------------------------------------------
-- VENTAS
-- ---------------------------------------------------------------------

-- 1. Todas las ventas con cliente, cajero y medio de pago
SELECT v.Id_venta, v.Fecha_compra, cl.Nombre AS Cliente, ca.Nombre AS Cajero, mp.Nombre AS Medio_pago
FROM Venta v
JOIN Cliente cl ON cl.Id_cliente = v.Id_cliente
JOIN Cajero ca ON ca.Id_Cajero = v.Id_cajero
JOIN Medio_Pago mp ON mp.Id_medio_pago = v.Id_medio_pago;

-- 2. Detalle de la venta número 1
SELECT p.Nombre_producto, dv.Cantidad, dv.Precio_unitario
FROM Detalle_venta dv
JOIN Producto p ON p.Id_producto = dv.Id_producto
WHERE dv.Id_venta = 1;

-- 3. Cuántas ventas hizo cada cajero
SELECT ca.Nombre AS Cajero, COUNT(v.Id_venta) AS Ventas
FROM Cajero ca
JOIN Venta v ON v.Id_cajero = ca.Id_Cajero
GROUP BY ca.Nombre;

-- 4. Productos más vendidos
SELECT p.Nombre_producto, SUM(dv.Cantidad) AS Unidades
FROM Detalle_venta dv
JOIN Producto p ON p.Id_producto = dv.Id_producto
GROUP BY p.Nombre_producto
ORDER BY Unidades DESC;

-- 5. Cuántas veces se usó cada medio de pago
SELECT mp.Nombre AS Medio_pago, COUNT(v.Id_venta) AS Veces
FROM Medio_Pago mp
JOIN Venta v ON v.Id_medio_pago = mp.Id_medio_pago
GROUP BY mp.Nombre;

-- ---------------------------------------------------------------------
-- DINERO
-- ---------------------------------------------------------------------

-- 6. Saldo del dueño
SELECT Usuario_dueno, SUM(Monto) AS Saldo
FROM Estado_cuenta
GROUP BY Usuario_dueno;

-- ---------------------------------------------------------------------
-- INVENTARIO Y PROVEEDORES
-- ---------------------------------------------------------------------

-- 7. Stock de insumos y gaseosas
SELECT Nombre_producto, Stock, Categoria
FROM Producto
WHERE Tipo_producto = 'Insumo' OR Tipo_producto = 'Reventa'
ORDER BY Stock;

-- 8. Productos con poco stock (menos de 20)
SELECT Nombre_producto, Stock
FROM Producto
WHERE Stock < 20;

-- 9. Qué productos vende cada proveedor
SELECT pr.Nombre_proveedor, p.Nombre_producto
FROM Proveedor pr
JOIN Producto_proveedor pp ON pp.Id_proveedor = pr.Id_proveedor
JOIN Producto p ON p.Id_producto = pp.Id_producto
ORDER BY pr.Nombre_proveedor;

-- 10. Órdenes de compra con su proveedor
SELECT oc.Id_Orden_compra, oc.Fecha_comision, pr.Nombre_proveedor
FROM Orden_compra oc
JOIN Proveedor pr ON pr.Id_proveedor = oc.Id_proveedor;

-- ---------------------------------------------------------------------
-- PERSONAL
-- ---------------------------------------------------------------------

-- 11. Cuántos empleados hay por cargo
SELECT Cargo, COUNT(Id_Empleado) AS Cantidad
FROM Empleado
GROUP BY Cargo;

-- 12. Lista de empleados con su sueldo
SELECT Nombre, Cargo, Sueldo_base
FROM Empleado
ORDER BY Cargo;

-- 13. Turnos de cada cajero
SELECT t.Fecha, t.Hora_inicio, t.Hora_fin, ca.Nombre AS Cajero
FROM Turno_cajero t
JOIN Cajero ca ON ca.Id_Cajero = t.Id_cajero
ORDER BY t.Fecha;

-- ---------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------

-- 14. Cuántas compras hizo cada cliente
SELECT cl.Nombre AS Cliente, COUNT(v.Id_venta) AS Compras
FROM Cliente cl
JOIN Venta v ON v.Id_cliente = cl.Id_cliente
GROUP BY cl.Nombre
ORDER BY Compras DESC;

-- 15. Lista de todos los clientes
SELECT Id_cliente, Nombre, Fecha_nacimiento
FROM Cliente;
