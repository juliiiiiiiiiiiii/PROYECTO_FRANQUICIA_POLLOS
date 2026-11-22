// Servidor simulado en el navegador.
// Responde las mismas rutas que tendrá la API real y guarda los datos en localStorage,
// con las mismas tablas y columnas de SCRIPT_Proyecto.sql.
// Los datos iniciales son los de inserts_Proyecto.sql.
// Para reiniciar los datos: en la consola del navegador ejecutar Simulacion.reiniciar()
const Simulacion = (() => {
    const CLAVE = 'franquicia_pollos_bd';

    function crearSemilla() {
        const turnos = [];
        for (let dia = 1; dia <= 13; dia++) {
            const fecha = `2026-11-${String(dia).padStart(2, '0')}`;
            turnos.push({ Id_turno_cajero: turnos.length + 1, Fecha: fecha, Hora_inicio: '08:00:00', Hora_fin: '16:00:00', Id_cajero: 1, Id_caja: 1 });
            turnos.push({ Id_turno_cajero: turnos.length + 1, Fecha: fecha, Hora_inicio: '16:00:00', Hora_fin: '23:00:00', Id_cajero: 2, Id_caja: 2 });
        }

        const productos = [
            [1, 'Broaster 8 presas', 0, 'Broaster', 'Preparado'],
            [2, 'Broaster 4 presas', 0, 'Broaster', 'Preparado'],
            [3, 'Alitas broaster', 0, 'Broaster', 'Preparado'],
            [4, 'Pollo entero a la brasa', 0, 'Brasa', 'Preparado'],
            [5, 'Medio pollo a la brasa', 0, 'Brasa', 'Preparado'],
            [6, 'Cuarto de pollo a la brasa', 0, 'Brasa', 'Preparado'],
            [7, 'Papas fritas', 0, 'Complementos', 'Preparado'],
            [8, 'Ensalada fresca', 0, 'Complementos', 'Preparado'],
            [9, 'Mollejitas', 0, 'Complementos', 'Preparado'],
            [10, 'Gaseosa personal 500 ml', 80, 'Bebidas', 'Reventa'],
            [11, 'Gaseosa 1.5 L', 30, 'Bebidas', 'Reventa'],
            [12, 'Jugo natural', 0, 'Bebidas', 'Preparado'],
            [13, 'Combo Familiar', 0, 'Combos', 'Preparado'],
            [14, 'Combo Pareja', 0, 'Combos', 'Preparado'],
            [15, 'Combo Broaster', 0, 'Combos', 'Preparado'],
            [16, 'Pollo entero crudo (und)', 120, 'Pollo', 'Insumo'],
            [17, 'Alitas de pollo (kg)', 12, 'Pollo', 'Insumo'],
            [18, 'Mollejas (kg)', 8, 'Pollo', 'Insumo'],
            [19, 'Papa (kg)', 15, 'Acompañamientos', 'Insumo'],
            [20, 'Verduras para ensalada (kg)', 18, 'Acompañamientos', 'Insumo'],
            [21, 'Fruta para jugos (kg)', 9, 'Acompañamientos', 'Insumo'],
            [22, 'Aceite vegetal (litro)', 8, 'Insumos de cocina', 'Insumo'],
            [23, 'Harina para apanar (kg)', 25, 'Insumos de cocina', 'Insumo'],
            [24, 'Especias y adobos (kg)', 6, 'Insumos de cocina', 'Insumo'],
            [25, 'Salsas y cremas (galón)', 4, 'Insumos de cocina', 'Insumo'],
            [26, 'Carbón vegetal (bulto)', 10, 'Insumos de cocina', 'Insumo'],
            [27, 'Sal (kg)', 10, 'Insumos de cocina', 'Insumo'],
            [28, 'Gas propano (cilindro)', 3, 'Insumos de cocina', 'Insumo'],
            [29, 'Empaques para domicilio (und)', 300, 'Empaques', 'Insumo']
        ].map(([Id_producto, Nombre_producto, Stock, Categoria, Tipo_producto]) =>
            ({ Id_producto, Nombre_producto, Stock, Categoria, Tipo_producto }));

        const proveedores = [
            [1, 'Avícola San Pedro', 'Juan Medina - 987 654 321'],
            [2, 'Pollos El Campo', 'Martha Rincón - 311 245 6789'],
            [3, 'Avícola La Granja', 'Óscar Pinzón - 312 908 4411'],
            [4, 'Distribuidora La Papa', 'Rosa Quispe - 955 112 233'],
            [5, 'Fruver La Cosecha', 'Sandra Ortiz - 310 456 7788'],
            [6, 'Frutas del Valle', 'Camilo Arango - 315 330 2299'],
            [7, 'Aceites del Llano', 'Ricardo Peña - 316 772 0145'],
            [8, 'Molinos El Trigal', 'Gloria Navarro - 317 540 8823'],
            [9, 'Condimentos La Sazón', 'Patricia Duarte - 318 661 9034'],
            [10, 'Abarrotes El Granero', 'Héctor Ríos - 320 998 1122'],
            [11, 'Carbones La Brasa', 'Wilson Cárdenas - 321 447 5560'],
            [12, 'Salinas del Norte', 'Esteban Mora - 324 276 6610'],
            [13, 'Gas Andino', 'Fernando Lozano - 323 905 3381'],
            [14, 'Empaques Plastimax', 'Natalia Suárez - 322 118 7746'],
            [15, 'Bebidas del Sur', 'Luis Carrión - 944 778 990']
        ].map(([Id_proveedor, Nombre_proveedor, Contacto]) => ({ Id_proveedor, Nombre_proveedor, Contacto }));

        const productoProveedor = [
            [16, 1], [17, 2], [18, 3], [19, 4], [20, 5], [21, 6], [22, 7], [23, 8],
            [24, 9], [25, 10], [26, 11], [27, 12], [28, 13], [29, 14], [10, 15], [11, 15]
        ].map(([Id_producto, Id_proveedor]) => ({ Id_producto, Id_proveedor }));

        const empleados = [
            [1, 'Ana Pérez', '1998-04-10', 'Mesero', 1750000],
            [2, 'Valentina Gómez', '2000-08-19', 'Mesero', 1750000],
            [3, 'Andrés Rojas', '1997-01-25', 'Mesero', 1750000],
            [4, 'Marta Herrera', '1975-06-30', 'Aseo', 1750000],
            [5, 'José Díaz', '1980-03-05', 'Cocinero', 2500000],
            [6, 'Carlos Mejía', '1991-12-17', 'Cocinero', 2200000],
            [7, 'Diana López', '1993-05-22', 'Cocinero', 2200000],
            [8, 'Felipe Vargas', '1995-09-09', 'Cocinero', 2200000]
        ].map(([Id_Empleado, Nombre, Fecha_nacimiento, Cargo, Sueldo_base]) =>
            ({ Id_Empleado, Nombre, Fecha_nacimiento, Cargo, Sueldo_base, Administrativo_Usuario: 'laura.mendez' }));

        return {
            Dueno: [{ Usuario: 'carlos.ramirez', Contrasena: 'Dueno2026*', Nombre_dueno: 'Carlos Ramírez', Fecha_nacimiento: '1978-05-14' }],
            Administrativo: [{ Usuario: 'laura.mendez', Contrasena: 'Admin2026*', Nombre_administrativo: 'Laura Méndez', Fecha_nacimiento: '1988-09-02' }],
            Medio_Pago: [
                { Id_medio_pago: 1, Nombre: 'Efectivo' },
                { Id_medio_pago: 2, Nombre: 'Tarjeta' },
                { Id_medio_pago: 3, Nombre: 'Transferencia / Nequi' }
            ],
            Caja: [
                { Id_Caja: 1, Monto_inicial: 200000, Monto_actual: 200000 },
                { Id_Caja: 2, Monto_inicial: 200000, Monto_actual: 200000 }
            ],
            Cajero: [
                { Id_Cajero: 1, Usuario: 'lucia.torres', Contrasena: 'Cajero1Dia*', Nombre: 'Lucía Torres', Fecha_nacimiento: '1996-03-21', Credencial: 'CAJ-DIA-001', Sueldo_base: 1800000, Porcentaje_ganancia: 1, Frecuencia_pago: 'quincenal' },
                { Id_Cajero: 2, Usuario: 'miguel.soto', Contrasena: 'Cajero2Noche*', Nombre: 'Miguel Soto', Fecha_nacimiento: '1994-11-08', Credencial: 'CAJ-NOCHE-002', Sueldo_base: 1800000, Porcentaje_ganancia: 1, Frecuencia_pago: 'quincenal' }
            ],
            Turno_cajero: turnos,
            Empleado: empleados,
            Producto: productos,
            Proveedor: proveedores,
            Producto_proveedor: productoProveedor,
            Estado_cuenta: [{ Id_estado_cuenta: 1, Monto: 14320000, Usuario_dueno: 'carlos.ramirez' }],
            Cliente: [],
            Venta: [],
            Detalle_venta: [],
            Orden_compra: [],
            Pago_cajero: [],
            // Tabla que aún no existe en SCRIPT_Proyecto.sql.
            Observacion: []
        };
    }

    function cargar() {
        const guardado = localStorage.getItem(CLAVE);
        if (guardado) {
            return JSON.parse(guardado);
        }
        const bd = crearSemilla();
        guardar(bd);
        return bd;
    }

    function guardar(bd) {
        localStorage.setItem(CLAVE, JSON.stringify(bd));
    }

    function falla(estado, mensaje) {
        const error = new Error(mensaje);
        error.estado = estado;
        throw error;
    }

    function requerir(datos, campos) {
        for (const campo of campos) {
            const valor = datos ? datos[campo] : undefined;
            if (valor === undefined || valor === null || valor === '') {
                falla(400, `Falta el dato: ${campo}.`);
            }
        }
    }

    function siguienteId(lista, campo) {
        return lista.reduce((mayor, fila) => Math.max(mayor, fila[campo]), 0) + 1;
    }

    function totalVenta(bd, idVenta) {
        const subtotal = bd.Detalle_venta
            .filter((d) => d.Id_venta === idVenta)
            .reduce((suma, d) => suma + d.Cantidad * d.Precio_unitario, 0);
        return subtotal + subtotal * CONFIG.IVA_VENTA;
    }

    function proveedoresDe(bd, idProducto) {
        return bd.Producto_proveedor
            .filter((pp) => pp.Id_producto === idProducto)
            .map((pp) => bd.Proveedor.find((p) => p.Id_proveedor === pp.Id_proveedor).Nombre_proveedor)
            .join(', ');
    }

    function buscarPorCredenciales(lista, datos) {
        return lista.find((fila) => fila.Usuario === datos.usuario && fila.Contrasena === datos.contrasena);
    }

    const rutas = [
        ['POST', /^\/login$/, (bd, datos) => {
            requerir(datos, ['usuario', 'contrasena']);
            const dueno = buscarPorCredenciales(bd.Dueno, datos);
            if (dueno) {
                return { rol: 'dueno', usuario: dueno.Usuario, nombre: dueno.Nombre_dueno };
            }
            const admin = buscarPorCredenciales(bd.Administrativo, datos);
            if (admin) {
                return { rol: 'administrativo', usuario: admin.Usuario, nombre: admin.Nombre_administrativo };
            }
            const cajero = buscarPorCredenciales(bd.Cajero, datos);
            if (cajero) {
                return { rol: 'cajero', usuario: cajero.Usuario, nombre: cajero.Nombre, idCajero: cajero.Id_Cajero };
            }
            falla(401, 'Usuario o contraseña incorrectos.');
        }],

        ['GET', /^\/medios-pago$/, (bd) => bd.Medio_Pago],

        ['GET', /^\/clientes\/(\d+)$/, (bd, datos, partes) => {
            const cliente = bd.Cliente.find((c) => c.Id_cliente === Number(partes[1]));
            if (!cliente) {
                falla(404, 'El cliente no está registrado.');
            }
            return cliente;
        }],

        ['POST', /^\/clientes$/, (bd, datos) => {
            requerir(datos, ['Id_cliente', 'Nombre', 'Fecha_nacimiento']);
            const id = Number(datos.Id_cliente);
            if (!Number.isInteger(id) || id <= 0) {
                falla(400, 'La identificación debe ser un número.');
            }
            if (bd.Cliente.some((c) => c.Id_cliente === id)) {
                falla(409, 'Ya existe un cliente con esa identificación.');
            }
            const cliente = { Id_cliente: id, Nombre: datos.Nombre.trim(), Fecha_nacimiento: datos.Fecha_nacimiento };
            bd.Cliente.push(cliente);
            return cliente;
        }],

        ['GET', /^\/ventas$/, (bd, datos, partes, consulta) => {
            const fecha = consulta.get('fecha');
            return bd.Venta
                .filter((v) => !fecha || v.Fecha_compra === fecha)
                .map((v) => ({
                    ...v,
                    Cliente: bd.Cliente.find((c) => c.Id_cliente === v.Id_cliente).Nombre,
                    Cajero: bd.Cajero.find((c) => c.Id_Cajero === v.Id_cajero).Nombre,
                    Medio_pago: bd.Medio_Pago.find((m) => m.Id_medio_pago === v.Id_medio_pago).Nombre,
                    Total: totalVenta(bd, v.Id_venta)
                }));
        }],

        ['POST', /^\/ventas$/, (bd, datos) => {
            requerir(datos, ['Fecha_compra', 'Id_cliente', 'Id_cajero', 'Id_medio_pago']);
            if (!bd.Cliente.some((c) => c.Id_cliente === datos.Id_cliente)) {
                falla(400, 'El cliente no existe.');
            }
            if (!bd.Cajero.some((c) => c.Id_Cajero === datos.Id_cajero)) {
                falla(400, 'El cajero no existe.');
            }
            if (!bd.Medio_Pago.some((m) => m.Id_medio_pago === datos.Id_medio_pago)) {
                falla(400, 'El medio de pago no existe.');
            }
            if (!Array.isArray(datos.detalle) || datos.detalle.length === 0) {
                falla(400, 'La venta no tiene productos.');
            }
            for (const linea of datos.detalle) {
                if (!Number.isInteger(linea.Cantidad) || linea.Cantidad <= 0) {
                    falla(400, 'Hay una cantidad no válida.');
                }
                if (!bd.Producto.some((p) => p.Id_producto === linea.Id_producto)) {
                    falla(400, `El producto ${linea.Id_producto} no existe.`);
                }
            }

            const idVenta = siguienteId(bd.Venta, 'Id_venta');
            bd.Venta.push({
                Id_venta: idVenta,
                Fecha_compra: datos.Fecha_compra,
                Id_cliente: datos.Id_cliente,
                Id_cajero: datos.Id_cajero,
                Id_medio_pago: datos.Id_medio_pago
            });
            for (const linea of datos.detalle) {
                bd.Detalle_venta.push({
                    Id_detalle_venta: siguienteId(bd.Detalle_venta, 'Id_detalle_venta'),
                    Cantidad: linea.Cantidad,
                    Precio_unitario: linea.Precio_unitario,
                    Id_venta: idVenta,
                    Id_producto: linea.Id_producto
                });
            }
            return { Id_venta: idVenta };
        }],

        ['GET', /^\/cierres$/, (bd, datos, partes, consulta) => {
            const fecha = consulta.get('fecha') || util.fechaHoy();
            return bd.Cajero.map((cajero) => {
                const turno = bd.Turno_cajero.find((t) => t.Fecha === fecha && t.Id_cajero === cajero.Id_Cajero);
                const horario = CONFIG.HORARIO_CAJERO[cajero.Id_Cajero] || {};
                const ventas = bd.Venta.filter((v) => v.Fecha_compra === fecha && v.Id_cajero === cajero.Id_Cajero);
                const porMedio = bd.Medio_Pago.map((medio) => ({
                    Medio_pago: medio.Nombre,
                    Total: ventas
                        .filter((v) => v.Id_medio_pago === medio.Id_medio_pago)
                        .reduce((suma, v) => suma + totalVenta(bd, v.Id_venta), 0)
                }));
                return {
                    Id_cajero: cajero.Id_Cajero,
                    Cajero: cajero.Nombre,
                    Id_caja: turno ? turno.Id_caja : horario.caja,
                    Hora_inicio: turno ? turno.Hora_inicio : horario.inicio,
                    Hora_fin: turno ? turno.Hora_fin : null,
                    Cerrado: Boolean(turno),
                    Num_ventas: ventas.length,
                    Por_medio: porMedio,
                    Total: porMedio.reduce((suma, m) => suma + m.Total, 0)
                };
            });
        }],

        ['POST', /^\/turnos$/, (bd, datos) => {
            requerir(datos, ['Fecha', 'Hora_inicio', 'Hora_fin', 'Id_cajero', 'Id_caja']);
            if (!bd.Cajero.some((c) => c.Id_Cajero === datos.Id_cajero)) {
                falla(400, 'El cajero no existe.');
            }
            if (!bd.Caja.some((c) => c.Id_Caja === datos.Id_caja)) {
                falla(400, 'La caja no existe.');
            }
            if (bd.Turno_cajero.some((t) => t.Fecha === datos.Fecha && t.Id_cajero === datos.Id_cajero)) {
                falla(409, 'El turno de este cajero ya fue cerrado en esa fecha.');
            }
            const turno = {
                Id_turno_cajero: siguienteId(bd.Turno_cajero, 'Id_turno_cajero'),
                Fecha: datos.Fecha,
                Hora_inicio: datos.Hora_inicio,
                Hora_fin: datos.Hora_fin,
                Id_cajero: datos.Id_cajero,
                Id_caja: datos.Id_caja
            };
            bd.Turno_cajero.push(turno);
            return turno;
        }],

        ['GET', /^\/cajeros$/, (bd) => bd.Cajero.map(({ Contrasena, ...resto }) => resto)],

        ['POST', /^\/cajeros\/(\d+)\/aumento$/, (bd, datos, partes) => {
            requerir(datos, ['Sueldo_base']);
            const cajero = bd.Cajero.find((c) => c.Id_Cajero === Number(partes[1]));
            if (!cajero) {
                falla(404, 'El cajero no existe.');
            }
            if (datos.Sueldo_base <= cajero.Sueldo_base) {
                falla(400, 'El nuevo sueldo debe ser mayor al actual.');
            }
            cajero.Sueldo_base = datos.Sueldo_base;
            return { Id_Cajero: cajero.Id_Cajero, Sueldo_base: cajero.Sueldo_base };
        }],

        ['GET', /^\/empleados$/, (bd) => bd.Empleado],

        ['POST', /^\/empleados$/, (bd, datos) => {
            requerir(datos, ['Nombre', 'Fecha_nacimiento', 'Cargo', 'Sueldo_base', 'Administrativo_Usuario']);
            const limite = CONFIG.LIMITE_CARGO[datos.Cargo];
            if (!limite || datos.Cargo === 'Cajero') {
                falla(400, 'Cargo no válido.');
            }
            const ocupados = bd.Empleado.filter((e) => e.Cargo === datos.Cargo).length;
            if (ocupados >= limite) {
                falla(409, `No hay cupo para ${datos.Cargo} (${ocupados} de ${limite}).`);
            }
            if (!(datos.Sueldo_base > 0)) {
                falla(400, 'El sueldo debe ser mayor a cero.');
            }
            if (!bd.Administrativo.some((a) => a.Usuario === datos.Administrativo_Usuario)) {
                falla(400, 'El administrador no existe.');
            }
            const empleado = {
                Id_Empleado: siguienteId(bd.Empleado, 'Id_Empleado'),
                Nombre: datos.Nombre.trim(),
                Fecha_nacimiento: datos.Fecha_nacimiento,
                Cargo: datos.Cargo,
                Sueldo_base: datos.Sueldo_base,
                Administrativo_Usuario: datos.Administrativo_Usuario
            };
            bd.Empleado.push(empleado);
            return empleado;
        }],

        ['POST', /^\/empleados\/(\d+)\/aumento$/, (bd, datos, partes) => {
            requerir(datos, ['Sueldo_base']);
            const empleado = bd.Empleado.find((e) => e.Id_Empleado === Number(partes[1]));
            if (!empleado) {
                falla(404, 'El empleado no existe.');
            }
            if (datos.Sueldo_base <= empleado.Sueldo_base) {
                falla(400, 'El nuevo sueldo debe ser mayor al actual.');
            }
            empleado.Sueldo_base = datos.Sueldo_base;
            return empleado;
        }],

        ['POST', /^\/empleados\/(\d+)\/despido$/, (bd, datos, partes) => {
            const posicion = bd.Empleado.findIndex((e) => e.Id_Empleado === Number(partes[1]));
            if (posicion === -1) {
                falla(404, 'El empleado no existe.');
            }
            const [retirado] = bd.Empleado.splice(posicion, 1);
            return retirado;
        }],

        ['GET', /^\/productos$/, (bd, datos, partes, consulta) => {
            const tipos = consulta.get('tipo') ? consulta.get('tipo').split(',') : null;
            return bd.Producto
                .filter((p) => !tipos || tipos.includes(p.Tipo_producto))
                .map((p) => ({ ...p, Proveedores: proveedoresDe(bd, p.Id_producto) }));
        }],

        ['POST', /^\/productos$/, (bd, datos) => {
            requerir(datos, ['Nombre_producto', 'Stock', 'Categoria', 'Tipo_producto']);
            if (!Number.isInteger(datos.Stock) || datos.Stock < 0) {
                falla(400, 'El stock debe ser un número entero.');
            }
            const nombre = datos.Nombre_producto.trim();
            if (bd.Producto.some((p) => p.Nombre_producto.toLowerCase() === nombre.toLowerCase())) {
                falla(409, 'Ya existe un producto con ese nombre.');
            }
            const producto = {
                Id_producto: siguienteId(bd.Producto, 'Id_producto'),
                Nombre_producto: nombre,
                Stock: datos.Stock,
                Categoria: datos.Categoria,
                Tipo_producto: datos.Tipo_producto
            };
            bd.Producto.push(producto);
            return producto;
        }],

        ['GET', /^\/proveedores$/, (bd) => bd.Proveedor.map((proveedor) => ({
            ...proveedor,
            Productos: bd.Producto_proveedor
                .filter((pp) => pp.Id_proveedor === proveedor.Id_proveedor)
                .map((pp) => bd.Producto.find((p) => p.Id_producto === pp.Id_producto))
        }))],

        ['POST', /^\/ordenes-compra$/, (bd, datos) => {
            requerir(datos, ['Fecha_comision', 'Id_proveedor']);
            if (!bd.Proveedor.some((p) => p.Id_proveedor === datos.Id_proveedor)) {
                falla(400, 'El proveedor no existe.');
            }
            const orden = {
                Id_Orden_compra: siguienteId(bd.Orden_compra, 'Id_Orden_compra'),
                Fecha_comision: datos.Fecha_comision,
                Id_proveedor: datos.Id_proveedor
            };
            bd.Orden_compra.push(orden);
            return orden;
        }],

        ['GET', /^\/estado-cuenta$/, (bd, datos, partes, consulta) => {
            const cuenta = bd.Estado_cuenta.find((c) => c.Usuario_dueno === consulta.get('usuario'));
            if (!cuenta) {
                falla(404, 'No hay estado de cuenta para este dueño.');
            }
            return cuenta;
        }],

        ['GET', /^\/observaciones$/, (bd) => [...bd.Observacion].reverse()],

        ['POST', /^\/observaciones$/, (bd, datos) => {
            requerir(datos, ['Tipo', 'Sobre', 'Texto', 'Fecha', 'Usuario_dueno']);
            const observacion = {
                Id_observacion: siguienteId(bd.Observacion, 'Id_observacion'),
                Fecha: datos.Fecha,
                Tipo: datos.Tipo,
                Sobre: datos.Sobre,
                Texto: datos.Texto.trim(),
                Atendida: false,
                Usuario_dueno: datos.Usuario_dueno
            };
            bd.Observacion.push(observacion);
            return observacion;
        }],

        ['POST', /^\/observaciones\/(\d+)\/atendida$/, (bd, datos, partes) => {
            const observacion = bd.Observacion.find((o) => o.Id_observacion === Number(partes[1]));
            if (!observacion) {
                falla(404, 'La observación no existe.');
            }
            observacion.Atendida = true;
            return observacion;
        }]
    ];

    function responder(metodo, ruta, datos) {
        return new Promise((resolver, rechazar) => {
            setTimeout(() => {
                try {
                    const [camino, consulta = ''] = ruta.split('?');
                    const encontrada = rutas.find(([m, patron]) => m === metodo && patron.test(camino));
                    if (!encontrada) {
                        falla(404, `Ruta no encontrada: ${metodo} ${camino}`);
                    }
                    const [, patron, manejar] = encontrada;
                    const bd = cargar();
                    const resultado = manejar(bd, datos, camino.match(patron), new URLSearchParams(consulta));
                    if (metodo === 'POST') {
                        guardar(bd);
                    }
                    resolver(resultado === undefined ? null : JSON.parse(JSON.stringify(resultado)));
                } catch (error) {
                    rechazar(error);
                }
            }, 120);
        });
    }

    function reiniciar() {
        localStorage.removeItem(CLAVE);
    }

    return { responder, reiniciar };
})();
