const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");
const app = express();

// Lee la contraseña de MySQL del archivo .env (así no se sube a GitHub)
try { process.loadEnvFile(__dirname + "/.env"); } catch { console.log("No se encontró el archivo .env"); }

let conexion = mysql.createPool({
    host: "localhost",
    database: "Franquicia_Pollos",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    dateStrings: true,     // fechas como texto "2026-11-13"
    decimalNumbers: true   // DECIMAL como número
}).promise();

conexion.query("SELECT 1")
    .then(() => console.log("Conectado a MySQL correctamente"))
    .catch(error => console.log("Error conectando a MySQL:", error.message));

app.use(express.json());

// Solo se publican las carpetas de las pantallas (no el .env ni la carpeta de la base de datos)
for (let carpeta of ["Login", "Menu", "Cajero", "Dueno", "Administrador", "Recursos"]) {
    app.use("/" + carpeta, express.static(__dirname + "/" + carpeta));
}
app.get("/comun.js", (req, res) => res.sendFile(__dirname + "/comun.js"));
app.get("/", (req, res) => res.redirect("/Login/login.html"));

// ===== Datos que todavía no tienen columna en la base de datos (clave = Id_producto) =====
const IVA_VENTA = 0.08;
const IVA_COMPRA = 0.19;
const LIMITES = { Cajero: 2, Mesero: 4, Aseo: 2, Cocinero: 5 };
const HORARIOS = { 1: { inicio: "08:00:00", turno: "Día" }, 2: { inicio: "16:00:00", turno: "Noche" } };
const PRECIO_VENTA = { 1: 50000, 2: 28000, 3: 22000, 4: 52000, 5: 30000, 6: 17000, 7: 8000, 8: 7000, 9: 10000, 10: 4500, 11: 8000, 12: 6000, 13: 68000, 14: 40000, 15: 64000 };
const PRECIO_COMPRA = { 10: 2500, 11: 5000, 16: 14000, 17: 16000, 18: 9000, 19: 2500, 20: 4000, 21: 5000, 22: 9000, 23: 3500, 24: 20000, 25: 45000, 26: 30000, 27: 2000, 28: 90000, 29: 600 };
const STOCK_MINIMO = { 10: 48, 11: 24, 16: 60, 17: 20, 18: 10, 19: 50, 20: 10, 21: 15, 22: 20, 23: 10, 24: 3, 25: 3, 26: 5, 27: 5, 28: 2, 29: 100 };

// ===== Utilidades =====
const hoy = () => new Date().toLocaleDateString("sv");          // "2026-11-13"
const ahora = () => new Date().toTimeString().slice(0, 8);      // "16:05:30"
const esFecha = texto => /^\d{4}-\d{2}-\d{2}$/.test(texto);
const fallo = (estado, mensaje) => Object.assign(new Error(mensaje), { estado });

// "Papa (kg)" -> { nombre: "Papa", unidad: "kg" }
function separarUnidad(texto) {
    let partes = texto.match(/^(.*) \((.+)\)$/);
    return partes ? { nombre: partes[1], unidad: partes[2] } : { nombre: texto, unidad: "und" };
}

// Las tablas no tienen AUTO_INCREMENT, así que el Id nuevo es el mayor + 1
async function nuevoId(c, tabla, columna) {
    let [filas] = await c.query(`SELECT COALESCE(MAX(${columna}), 0) + 1 AS id FROM ${tabla} FOR UPDATE`);
    return filas[0].id;
}

// Varias consultas que se guardan todas o ninguna
async function transaccion(trabajo) {
    let c = await conexion.getConnection();
    try {
        await c.beginTransaction();
        let resultado = await trabajo(c);
        await c.commit();
        return resultado;
    } catch (error) {
        await c.rollback();
        throw error;
    } finally {
        c.release();
    }
}

// ===== Sesión: el login entrega un token y cada petición lo envía =====
const sesiones = new Map();
const tokenDe = req => String(req.headers.authorization).replace("Bearer ", "");

function requiere(...roles) {
    return (req, res, next) => {
        req.usuario = sesiones.get(tokenDe(req));
        if (!req.usuario) return res.status(401).json({ mensaje: "La sesión expiró. Inicia sesión de nuevo." });
        if (!roles.includes(req.usuario.rol)) return res.status(403).json({ mensaje: "No tienes permiso." });
        next();
    };
}

app.post("/api/login", async (req, res) => {
    let { usuario, contrasena } = req.body;
    let tablas = [
        ["dueno", "SELECT Usuario, Contrasena, Nombre_dueno AS Nombre FROM Dueno WHERE Usuario = ?"],
        ["administrativo", "SELECT Usuario, Contrasena, Nombre_administrativo AS Nombre FROM Administrativo WHERE Usuario = ?"],
        ["cajero", "SELECT Usuario, Contrasena, Nombre, Id_Cajero FROM Cajero WHERE Usuario = ?"]
    ];
    for (let [rol, sql] of tablas) {
        let [filas] = await conexion.query(sql, [String(usuario)]);
        // La contraseña se compara aquí porque MySQL no distingue mayúsculas en el WHERE
        let cuenta = filas.find(f => f.Contrasena === contrasena);
        if (cuenta) {
            let datos = { usuario: cuenta.Usuario, nombre: cuenta.Nombre, rol, idCajero: cuenta.Id_Cajero, token: crypto.randomUUID() };
            sesiones.set(datos.token, datos);
            return res.json(datos);
        }
    }
    res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
});

app.post("/api/logout", (req, res) => {
    sesiones.delete(tokenDe(req));
    res.json({ ok: true });
});

app.get("/api/config", requiere("dueno", "administrativo", "cajero"), (req, res) => {
    res.json({ ivaVenta: IVA_VENTA, ivaCompra: IVA_COMPRA, limites: LIMITES, horarios: HORARIOS });
});

// ===== Cajero =====
app.get("/api/menu", requiere("cajero"), async (req, res) => {
    let [filas] = await conexion.query("SELECT Id_producto, Nombre_producto, Categoria FROM Producto WHERE Tipo_producto <> 'Insumo' ORDER BY Id_producto");
    res.json(filas.filter(p => PRECIO_VENTA[p.Id_producto]).map(p => ({ ...p, Precio: PRECIO_VENTA[p.Id_producto] })));
});

app.get("/api/medios-pago", requiere("cajero"), async (req, res) => {
    let [filas] = await conexion.query("SELECT Id_medio_pago, Nombre FROM Medio_Pago");
    res.json(filas);
});

app.get("/api/clientes/:id", requiere("cajero"), async (req, res) => {
    let [filas] = await conexion.query("SELECT Id_cliente, Nombre, Fecha_nacimiento FROM Cliente WHERE Id_cliente = ?", [req.params.id]);
    if (filas.length === 0) throw fallo(404, "El cliente no está registrado. Llena sus datos para registrarlo.");
    res.json(filas[0]);
});

app.post("/api/clientes", requiere("cajero"), async (req, res) => {
    let { id, nombre, fechaNacimiento } = req.body;
    if (!(id > 0 && id <= 2147483647)) throw fallo(400, "El número de identificación no es válido.");
    if (!nombre || !esFecha(fechaNacimiento)) throw fallo(400, "Llena el nombre y la fecha de cumpleaños.");

    let [existe] = await conexion.query("SELECT 1 FROM Cliente WHERE Id_cliente = ?", [id]);
    if (existe.length > 0) throw fallo(409, "Ya existe un cliente con esa identificación. Usa Buscar cliente.");
    await conexion.query("INSERT INTO Cliente (Id_cliente, Nombre, Fecha_nacimiento) VALUES (?, ?, ?)", [id, nombre, fechaNacimiento]);
    res.json({ Id_cliente: id, Nombre: nombre });
});

// Turnos cerrados de una fecha. La caja la tiene el cajero 1 hasta que cierra; luego el cajero 2.
async function turnos(fecha) {
    let [filas] = await conexion.query("SELECT Id_cajero, Hora_inicio, Hora_fin FROM Turno_cajero WHERE Fecha = ?", [fecha]);
    let cerrados = {};
    filas.forEach(f => cerrados[f.Id_cajero] = f);
    let enTurno = !cerrados[1] ? 1 : !cerrados[2] ? 2 : null;
    return { cerrados, enTurno };
}

app.get("/api/turno", requiere("cajero"), async (req, res) => {
    let { enTurno } = await turnos(hoy());
    let [filas] = await conexion.query("SELECT Nombre FROM Cajero WHERE Id_Cajero = ?", [enTurno]);
    res.json({ enTurno, nombreEnTurno: filas.length ? filas[0].Nombre : null });
});

app.post("/api/turno/cerrar", requiere("cajero"), async (req, res) => {
    let id = req.usuario.idCajero;
    if ((await turnos(hoy())).enTurno !== id) throw fallo(409, "No tienes la caja en este momento.");
    await transaccion(async c => {
        await c.query("INSERT INTO Turno_cajero VALUES (?, ?, ?, ?, ?, ?)",
            [await nuevoId(c, "Turno_cajero", "Id_turno_cajero"), hoy(), HORARIOS[id].inicio, ahora(), id, id]);
    });
    res.json({ siguiente: id === 1 ? 2 : null });
});

app.post("/api/ventas", requiere("cajero"), async (req, res) => {
    let idCajero = req.usuario.idCajero;
    let { idCliente, idMedioPago, items = [] } = req.body;
    if ((await turnos(hoy())).enTurno !== idCajero) throw fallo(409, "No tienes la caja en este momento.");
    if (items.length === 0) throw fallo(400, "Agrega al menos un producto.");
    // El precio lo pone el servidor, no el navegador
    if (items.some(i => !PRECIO_VENTA[i.idProducto] || !(i.cantidad > 0 && i.cantidad <= 99))) {
        throw fallo(400, "Hay un producto o una cantidad no válida en la factura.");
    }

    let idVenta = await transaccion(async c => {
        let id = await nuevoId(c, "Venta", "Id_venta");
        // Si el cliente o el medio de pago no existen, MySQL rechaza la venta por las llaves foráneas
        await c.query("INSERT INTO Venta VALUES (?, ?, ?, ?, ?)", [id, hoy(), idCliente, idCajero, idMedioPago]);

        for (let i of items) {
            // Las gaseosas (Reventa) salen del stock; lo preparado se cocina al momento
            let [p] = await c.query("SELECT Nombre_producto, Stock, Tipo_producto FROM Producto WHERE Id_producto = ? FOR UPDATE", [i.idProducto]);
            if (p[0].Tipo_producto === "Reventa") {
                if (p[0].Stock < i.cantidad) throw fallo(409, `No hay suficiente ${p[0].Nombre_producto} (quedan ${p[0].Stock}).`);
                await c.query("UPDATE Producto SET Stock = Stock - ? WHERE Id_producto = ?", [i.cantidad, i.idProducto]);
            }
            await c.query("INSERT INTO Detalle_venta VALUES (?, ?, ?, ?, ?)",
                [await nuevoId(c, "Detalle_venta", "Id_detalle_venta"), i.cantidad, PRECIO_VENTA[i.idProducto], id, i.idProducto]);
        }
        return id;
    });
    res.json({ idVenta });
});

// ===== Ventas, cierres y cuenta (dueño y administrador) =====
async function ventasDe(fecha) {
    let [filas] = await conexion.query(`
        SELECT v.Id_venta, v.Fecha_compra, v.Id_cajero, ca.Nombre AS Cajero, cl.Nombre AS Cliente, m.Nombre AS Medio,
               SUM(d.Cantidad * d.Precio_unitario) AS Subtotal
        FROM Venta v
        JOIN Cajero ca ON ca.Id_Cajero = v.Id_cajero
        JOIN Cliente cl ON cl.Id_cliente = v.Id_cliente
        JOIN Medio_Pago m ON m.Id_medio_pago = v.Id_medio_pago
        JOIN Detalle_venta d ON d.Id_venta = v.Id_venta
        WHERE v.Fecha_compra = ?
        GROUP BY v.Id_venta, ca.Nombre, cl.Nombre, m.Nombre
        ORDER BY v.Id_venta`, [fecha]);
    return filas.map(v => ({ ...v, Total: Math.round(v.Subtotal * (1 + IVA_VENTA)) }));
}

const fechaPedida = req => esFecha(req.query.fecha) ? req.query.fecha : hoy();

app.get("/api/ventas", requiere("dueno", "administrativo"), async (req, res) => {
    res.json(await ventasDe(fechaPedida(req)));
});

app.get("/api/cierres", requiere("dueno", "administrativo"), async (req, res) => {
    let fecha = fechaPedida(req);
    let ventas = await ventasDe(fecha);
    let { cerrados } = await turnos(fecha);
    let [cajeros] = await conexion.query("SELECT Id_Cajero, Nombre FROM Cajero ORDER BY Id_Cajero");

    res.json(cajeros.map(c => {
        let suyas = ventas.filter(v => v.Id_cajero === c.Id_Cajero);
        let turno = cerrados[c.Id_Cajero];
        let porMedio = {};
        suyas.forEach(v => porMedio[v.Medio] = (porMedio[v.Medio] || 0) + v.Total);
        return {
            idCajero: c.Id_Cajero, caja: c.Id_Cajero, nombre: c.Nombre,
            apertura: turno ? turno.Hora_inicio : HORARIOS[c.Id_Cajero]?.inicio,
            cierre: turno ? turno.Hora_fin : null,
            cerrado: Boolean(turno),
            ventas: suyas.length,
            total: suyas.reduce((s, v) => s + v.Total, 0),
            porMedio
        };
    }));
});

app.get("/api/cuenta", requiere("dueno"), async (req, res) => {
    let [filas] = await conexion.query("SELECT COALESCE(SUM(Monto), 0) AS saldo FROM Estado_cuenta WHERE Usuario_dueno = ?", [req.usuario.usuario]);
    res.json(filas[0]);
});

// ===== Empleados (los cajeros están en la tabla Cajero y el resto en Empleado) =====
app.get("/api/empleados", requiere("dueno", "administrativo"), async (req, res) => {
    let [filas] = await conexion.query(`
        SELECT 'cajero' AS Tabla, Id_Cajero AS Id, Nombre, Fecha_nacimiento, 'Cajero' AS Cargo, Sueldo_base FROM Cajero
        UNION ALL
        SELECT 'empleado', Id_Empleado, Nombre, Fecha_nacimiento, Cargo, Sueldo_base FROM Empleado`);
    res.json(filas);
});

app.post("/api/empleados", requiere("administrativo"), async (req, res) => {
    let { nombre, fechaNacimiento, cargo, sueldo } = req.body;
    if (!nombre || !esFecha(fechaNacimiento) || !(sueldo > 0)) throw fallo(400, "Llena nombre, fecha de nacimiento, cargo y sueldo.");
    // Los cajeros necesitan usuario y contraseña, así que no se contratan desde aquí
    if (!LIMITES[cargo] || cargo === "Cajero") throw fallo(400, "Ese cargo no se puede contratar desde aquí.");

    await transaccion(async c => {
        let [cuenta] = await c.query("SELECT COUNT(*) AS n FROM Empleado WHERE Cargo = ? FOR UPDATE", [cargo]);
        if (cuenta[0].n >= LIMITES[cargo]) throw fallo(409, `No hay cupo: ya hay ${cuenta[0].n} de ${LIMITES[cargo]} en ${cargo}.`);
        await c.query("INSERT INTO Empleado VALUES (?, ?, ?, ?, ?, ?)",
            [await nuevoId(c, "Empleado", "Id_Empleado"), nombre, fechaNacimiento, cargo, sueldo, req.usuario.usuario]);
    });
    res.json({ ok: true });
});

app.post("/api/empleados/aumento", requiere("administrativo"), async (req, res) => {
    let { tabla, id, sueldo } = req.body;
    let [nombreTabla, columna] = tabla === "cajero" ? ["Cajero", "Id_Cajero"] : ["Empleado", "Id_Empleado"];
    let [resultado] = await conexion.query(
        `UPDATE ${nombreTabla} SET Sueldo_base = ? WHERE ${columna} = ? AND Sueldo_base < ?`, [sueldo, id, sueldo]);
    if (resultado.affectedRows === 0) throw fallo(400, "El nuevo sueldo debe ser mayor que el actual.");
    res.json({ ok: true });
});

app.delete("/api/empleados/:id", requiere("administrativo"), async (req, res) => {
    let [resultado] = await conexion.query("DELETE FROM Empleado WHERE Id_Empleado = ?", [req.params.id]);
    if (resultado.affectedRows === 0) throw fallo(404, "El empleado ya no existe.");
    res.json({ ok: true });
});

// ===== Inventario y proveedores =====
app.get("/api/inventario", requiere("dueno", "administrativo"), async (req, res) => {
    let [filas] = await conexion.query(`
        SELECT p.Id_producto, p.Nombre_producto, p.Stock, p.Categoria, GROUP_CONCAT(pr.Nombre_proveedor SEPARATOR ', ') AS Proveedor
        FROM Producto p
        LEFT JOIN Producto_proveedor pp ON pp.Id_producto = p.Id_producto
        LEFT JOIN Proveedor pr ON pr.Id_proveedor = pp.Id_proveedor
        WHERE p.Tipo_producto IN ('Insumo', 'Reventa')
        GROUP BY p.Id_producto
        ORDER BY p.Categoria, p.Id_producto`);
    res.json(filas.map(p => ({ ...p, ...separarUnidad(p.Nombre_producto), Minimo: STOCK_MINIMO[p.Id_producto] ?? null })));
});

app.post("/api/inventario", requiere("dueno"), async (req, res) => {
    let { nombre, categoria, cantidad, unidad } = req.body;
    if (!nombre || !categoria || !unidad || !(cantidad >= 0)) throw fallo(400, "Escribe el producto y la cantidad.");
    await transaccion(async c => {
        await c.query("INSERT INTO Producto VALUES (?, ?, ?, ?, 'Insumo')",
            [await nuevoId(c, "Producto", "Id_producto"), `${nombre} (${unidad})`, cantidad, categoria]);
    });
    res.json({ ok: true });
});

app.get("/api/proveedores", requiere("dueno", "administrativo"), async (req, res) => {
    let [proveedores] = await conexion.query("SELECT * FROM Proveedor ORDER BY Id_proveedor");
    let [productos] = await conexion.query(
        "SELECT pp.Id_proveedor, p.Id_producto, p.Nombre_producto, p.Stock FROM Producto_proveedor pp JOIN Producto p ON p.Id_producto = pp.Id_producto");

    res.json(proveedores.map(pr => {
        let [contacto, telefono = "—"] = pr.Contacto.split(" - ");   // "Juan Medina - 987 654 321"
        return {
            id: pr.Id_proveedor, nombre: pr.Nombre_proveedor, contacto, telefono,
            productos: productos.filter(p => p.Id_proveedor === pr.Id_proveedor).map(p => ({
                id: p.Id_producto, ...separarUnidad(p.Nombre_producto), stock: p.Stock,
                minimo: STOCK_MINIMO[p.Id_producto] ?? null, precio: PRECIO_COMPRA[p.Id_producto] ?? 0
            }))
        };
    }));
});

// Compra a proveedor: crea la orden y suma lo comprado al stock
app.post("/api/compras", requiere("administrativo"), async (req, res) => {
    let { idProveedor, items = [] } = req.body;
    if (items.length === 0) throw fallo(400, "Agrega al menos un producto a la compra.");
    if (items.some(i => !(i.cantidad > 0 && i.cantidad <= 999))) throw fallo(400, "Hay una cantidad no válida en la compra.");

    let idOrden = await transaccion(async c => {
        for (let i of items) {
            let [vende] = await c.query("SELECT 1 FROM Producto_proveedor WHERE Id_producto = ? AND Id_proveedor = ?", [i.idProducto, idProveedor]);
            if (vende.length === 0) throw fallo(400, "Ese proveedor no vende uno de los productos.");
            await c.query("UPDATE Producto SET Stock = Stock + ? WHERE Id_producto = ?", [i.cantidad, i.idProducto]);
        }
        let id = await nuevoId(c, "Orden_compra", "Id_Orden_compra");
        await c.query("INSERT INTO Orden_compra VALUES (?, ?, ?)", [id, hoy(), idProveedor]);
        return id;
    });
    res.json({ idOrden });
});

// ===== Errores: se responden con un mensaje para mostrar en pantalla =====
app.use((error, req, res, next) => {
    if (error.code === "ER_NO_REFERENCED_ROW_2") error = fallo(400, "El cliente, el medio de pago o el proveedor no existe.");
    if (error.code === "ER_DATA_TOO_LONG") error = fallo(400, "Uno de los textos es demasiado largo.");
    if (!error.estado) console.log("Error en", req.method, req.path, "-", error.message);
    res.status(error.estado || 500).json({ mensaje: error.estado ? error.message : "Error en el servidor o en la base de datos." });
});

app.listen(3000, () => console.log("Servidor creado http://localhost:3000"));
