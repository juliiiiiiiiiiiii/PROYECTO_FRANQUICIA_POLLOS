(() => {
    const cuenta = sesion.exigir('dueno');
    if (!cuenta) {
        return;
    }

    const $ = (id) => document.getElementById(id);
    const esc = util.escapar;
    const modal = (id) => bootstrap.Modal.getOrCreateInstance($(id));
    const filaVacia = (columnas, texto) => `<tr><td colspan="${columnas}" class="text-muted">${esc(texto)}</td></tr>`;
    const filaError = (columnas, error) => `<tr><td colspan="${columnas}">${util.alerta(error.message)}</td></tr>`;

    $('nombreDueno').textContent = cuenta.nombre;
    $('cerrarSesion').addEventListener('click', () => sesion.cerrar());

    cargarDia();
    cargarCuenta();
    cargarProveedores();
    cargarInventario();
    cargarPersonal();
    cargarObservaciones();

    function etiquetaEstado(cerrado) {
        return cerrado
            ? '<span class="estado estado-ok"><i class="bi bi-check-circle"></i>Turno cerrado</span>'
            : '<span class="estado estado-bajo"><i class="bi bi-hourglass-split"></i>Turno abierto</span>';
    }

    function horarioTurno(cierre) {
        const fin = cierre.Cerrado ? cierre.Hora_fin : (CONFIG.HORARIO_CAJERO[cierre.Id_cajero] || {}).fin;
        return `${util.hora12(cierre.Hora_inicio)} - ${util.hora12(fin)}`;
    }

    // ----- Resumen y Ventas: GET /cierres y GET /ventas del día -----
    async function cargarDia() {
        const hoy = util.fechaHoy();
        try {
            const [cierres, ventas] = await Promise.all([
                api.get(`/cierres?fecha=${hoy}`),
                api.get(`/ventas?fecha=${hoy}`)
            ]);

            const total = ventas.reduce((suma, v) => suma + v.Total, 0);
            const ticket = ventas.length ? total / ventas.length : 0;
            const efectivo = cierres
                .flatMap((c) => c.Por_medio)
                .filter((m) => m.Medio_pago === 'Efectivo')
                .reduce((suma, m) => suma + m.Total, 0);

            $('resumenVentas').textContent = util.pesos(total);
            $('resumenPedidos').textContent = ventas.length;
            $('resumenTicket').textContent = util.pesos(ticket);
            $('ventasTotal').textContent = util.pesos(total);
            $('ventasPedidos').textContent = ventas.length;
            $('ventasTicket').textContent = util.pesos(ticket);
            $('cuentaEfectivo').textContent = util.pesos(efectivo);
            $('cuentaElectronico').textContent = util.pesos(total - efectivo);

            $('tablaCierres').innerHTML = cierres.map((c) => `
                <tr>
                    <td>Caja ${c.Id_caja}</td>
                    <td>${esc(c.Cajero)}</td>
                    <td>${horarioTurno(c)}</td>
                    <td>${c.Num_ventas}</td>
                    <td>${util.pesos(c.Total)}</td>
                    <td>${etiquetaEstado(c.Cerrado)}</td>
                </tr>`).join('');

            $('panelesCajeros').innerHTML = cierres.map((c) => `
                <div class="col-12 col-md-6">
                    <div class="panel">
                        <div class="panel-cabecera">
                            <h2><i class="bi bi-person-badge"></i>Cajero ${c.Id_cajero} · ${esc(c.Cajero)}</h2>
                            ${etiquetaEstado(c.Cerrado)}
                        </div>
                        <div class="fila-dato"><span>Turno</span><strong>${horarioTurno(c)}</strong></div>
                        <div class="fila-dato"><span>N.° de ventas</span><strong>${c.Num_ventas}</strong></div>
                        ${c.Por_medio.map((m) => `<div class="fila-dato"><span>${esc(m.Medio_pago)}</span><strong>${util.pesos(m.Total)}</strong></div>`).join('')}
                        <div class="fila-dato total"><span>Total Cajero ${c.Id_cajero}</span><strong>${util.pesos(c.Total)}</strong></div>
                    </div>
                </div>`).join('');

            $('tablaVentas').innerHTML = ventas.length
                ? [...ventas].reverse().map((v) => `
                    <tr>
                        <td>${String(v.Id_venta).padStart(4, '0')}</td>
                        <td>${esc(v.Cajero)}</td>
                        <td>${esc(v.Cliente)}</td>
                        <td>${esc(v.Medio_pago)}</td>
                        <td>${util.pesos(v.Total)}</td>
                    </tr>`).join('')
                : filaVacia(5, 'Todavía no hay ventas hoy.');
        } catch (error) {
            $('tablaCierres').innerHTML = filaError(6, error);
            $('tablaVentas').innerHTML = filaError(5, error);
            $('panelesCajeros').innerHTML = `<div class="col-12">${util.alerta(error.message)}</div>`;
        }
    }

    // ----- Mi cuenta: GET /estado-cuenta y GET /ventas -----
    async function cargarCuenta() {
        try {
            const [estado, ventas] = await Promise.all([
                api.get(`/estado-cuenta?usuario=${encodeURIComponent(cuenta.usuario)}`),
                api.get('/ventas')
            ]);
            $('saldoCuenta').textContent = util.pesos(estado.Monto);

            const recientes = [...ventas].reverse().slice(0, 10);
            $('tablaMovimientos').innerHTML = recientes.length
                ? recientes.map((v) => `
                    <tr>
                        <td>${util.fechaCorta(v.Fecha_compra)}</td>
                        <td>Venta N.° ${String(v.Id_venta).padStart(4, '0')} · ${esc(v.Cajero)}</td>
                        <td><span class="estado estado-ok">Ingreso</span></td>
                        <td class="monto-ingreso">+ ${util.pesos(v.Total)}</td>
                    </tr>`).join('')
                : filaVacia(4, 'Todavía no hay ingresos registrados.');
        } catch (error) {
            $('tablaMovimientos').innerHTML = filaError(4, error);
        }
    }

    // ----- Proveedores: GET /proveedores -----
    async function cargarProveedores() {
        try {
            const proveedores = await api.get('/proveedores');
            $('tablaProveedores').innerHTML = proveedores.map((p) => {
                const contacto = util.separarContacto(p.Contacto);
                const productos = p.Productos.map((prod) => util.separarUnidad(prod.Nombre_producto).nombre).join(', ') || '—';
                return `
                    <tr>
                        <td>${esc(p.Nombre_proveedor)}</td>
                        <td>${esc(productos)}</td>
                        <td>${esc(contacto.telefono)}</td>
                        <td>${esc(contacto.nombre)}</td>
                    </tr>`;
            }).join('');
        } catch (error) {
            $('tablaProveedores').innerHTML = filaError(4, error);
        }
    }

    // ----- Inventario: GET /productos y POST /productos -----
    async function cargarInventario() {
        try {
            const productos = await api.get('/productos?tipo=Insumo,Reventa');
            $('tablaInventario').innerHTML = productos.map((p) => {
                const { nombre, unidad } = util.separarUnidad(p.Nombre_producto);
                const { bajo } = util.estadoStock(p);
                return `
                    <tr>
                        <td>${esc(nombre)}</td>
                        <td>${p.Stock} ${esc(unidad || 'und')}</td>
                        <td><span class="estado ${bajo ? 'estado-bajo' : 'estado-ok'}">${bajo ? 'Stock bajo' : 'Suficiente'}</span></td>
                    </tr>`;
            }).join('');
        } catch (error) {
            $('tablaInventario').innerHTML = filaError(3, error);
        }
    }

    $('modalStock').addEventListener('show.bs.modal', () => util.limpiarMensaje($('mensajeInsumo')));

    $('btnGuardarInsumo').addEventListener('click', async () => {
        const mensaje = $('mensajeInsumo');
        const nombre = $('nombreInsumo').value.trim();
        const cantidadEscrita = $('cantidadInsumo').value.trim();

        if (!nombre || !cantidadEscrita) {
            util.mensaje(mensaje, 'Escribe el producto y la cantidad.', 'warning');
            return;
        }

        try {
            const producto = await api.post('/productos', {
                Nombre_producto: `${nombre} (${$('unidadInsumo').value})`,
                Stock: util.soloDigitos(cantidadEscrita),
                Categoria: $('categoriaInsumo').value,
                Tipo_producto: 'Insumo'
            });
            modal('modalStock').hide();
            $('nombreInsumo').value = '';
            $('cantidadInsumo').value = '';
            util.mensaje($('mensajeInventario'), `Insumo "${producto.Nombre_producto}" agregado.`);
            await cargarInventario();
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
        }
    });

    // ----- Empleados: GET /cajeros y GET /empleados -----
    async function cargarPersonal() {
        try {
            const [cajeros, empleados] = await Promise.all([api.get('/cajeros'), api.get('/empleados')]);
            $('resumenEmpleados').textContent = cajeros.length + empleados.length;

            const personas = [
                ...cajeros.map((c) => `${c.Nombre} (Cajero ${c.Id_Cajero})`),
                ...empleados.map((e) => `${e.Nombre} (${e.Cargo})`)
            ];
            const areas = ['Cocina', 'Inventario', 'General'];
            $('sobreObservacion').innerHTML = `
                <optgroup label="Personal">
                    ${personas.map((p) => `<option value="${esc(p.replace(/ \(.*\)$/, ''))}">${esc(p)}</option>`).join('')}
                </optgroup>
                <optgroup label="Áreas">
                    ${areas.map((a) => `<option>${a}</option>`).join('')}
                </optgroup>`;
        } catch (error) {
            util.mensaje($('mensajeObservacion'), error.message, 'danger');
        }
    }

    // ----- Observaciones: GET /observaciones y POST /observaciones -----
    async function cargarObservaciones() {
        try {
            const lista = await api.get('/observaciones');
            $('listaObservaciones').innerHTML = lista.length
                ? lista.map((o) => `
                    <li>
                        <div class="meta">
                            <span class="empleado">${esc(o.Sobre)}</span> · ${esc(o.Tipo)} · ${util.fechaCorta(o.Fecha)}
                            · ${o.Atendida ? 'Atendida por el administrador' : 'Pendiente'}
                        </div>
                        ${esc(o.Texto)}
                    </li>`).join('')
                : '<li class="text-muted">Todavía no hay observaciones.</li>';
        } catch (error) {
            $('listaObservaciones').innerHTML = `<li>${util.alerta(error.message)}</li>`;
        }
    }

    $('formObservacion').addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const mensaje = $('mensajeObservacion');
        const texto = $('observacion').value.trim();

        if (!texto) {
            util.mensaje(mensaje, 'Escribe la observación.', 'warning');
            return;
        }

        try {
            await api.post('/observaciones', {
                Tipo: $('tipoObs').value,
                Sobre: $('sobreObservacion').value,
                Texto: texto,
                Fecha: util.fechaHoy(),
                Usuario_dueno: cuenta.usuario
            });
            $('observacion').value = '';
            util.mensaje(mensaje, 'Observación enviada al administrador.');
            await cargarObservaciones();
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
        }
    });
})();
