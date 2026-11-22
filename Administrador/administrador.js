(() => {
    const cuenta = sesion.exigir('administrativo');
    if (!cuenta) {
        return;
    }

    const $ = (id) => document.getElementById(id);
    const esc = util.escapar;
    const modal = (id) => bootstrap.Modal.getOrCreateInstance($(id));

    const CARGOS = [
        { cargo: 'Cajero', plural: 'Cajeros', icono: 'bi-person-badge' },
        { cargo: 'Mesero', plural: 'Meseros', icono: 'bi-cup-hot' },
        { cargo: 'Aseo', plural: 'Aseo', icono: 'bi-stars' },
        { cargo: 'Cocinero', plural: 'Cocineros', icono: 'bi-fire' }
    ];

    const TIPOS_OBSERVACION = {
        Aumento: ['tipo-aumento', 'bi-graph-up-arrow'],
        Despido: ['tipo-despido', 'bi-person-x'],
        'Contratación': ['tipo-contratacion', 'bi-person-plus'],
        Compra: ['tipo-compra', 'bi-cart']
    };

    let personal = [];
    let seleccionado = null;
    let proveedores = [];
    const pedido = new Map();
    let compraRegistrada = false;

    $('nombreAdmin').textContent = cuenta.nombre;
    $('cerrarSesion').addEventListener('click', (evento) => {
        evento.preventDefault();
        sesion.cerrar();
    });
    $('fechaCierre').value = util.fechaHoy();
    $('fechaOrden').textContent = util.fechaCorta(util.fechaHoy());
    $('ordenSolicita').textContent = cuenta.nombre;
    $('etiquetaIvaCompra').textContent = `IVA (${CONFIG.IVA_COMPRA * 100}%)`;

    cargarCierres();
    cargarObservaciones();
    cargarPersonal();
    cargarStock();
    cargarProveedores();

    // ----- Cierres de caja: GET /cierres -----
    $('btnConsultarCierres').addEventListener('click', cargarCierres);

    async function cargarCierres() {
        const fecha = $('fechaCierre').value || util.fechaHoy();
        try {
            const cierres = await api.get(`/cierres?fecha=${fecha}`);
            $('tarjetasCierre').innerHTML = cierres.map(tarjetaCierre).join('');
            $('ventasDia').textContent = cierres.reduce((suma, c) => suma + c.Num_ventas, 0);
            $('totalDia').textContent = util.pesos(cierres.reduce((suma, c) => suma + c.Total, 0));
        } catch (error) {
            $('tarjetasCierre').innerHTML = `<div class="col-12">${util.alerta(error.message)}</div>`;
        }
    }

    function filaCierre(icono, etiqueta, valor) {
        return `
            <div class="fila-cierre">
                <span><span class="bi ${icono} me-2"></span>${etiqueta}</span>
                <strong>${valor}</strong>
            </div>`;
    }

    function tarjetaCierre(c) {
        return `
            <div class="col-12 col-md-6">
                <div class="tarjeta-cierre">
                    <div class="cabecera-cierre">
                        <h3><span class="bi bi-person-badge me-2"></span>Cajero ${c.Id_cajero}</h3>
                        <span class="${c.Cerrado ? 'estado-ok' : 'estado-pendiente'}">${c.Cerrado ? 'Recibido' : 'Turno abierto'}</span>
                    </div>
                    ${filaCierre('bi-person', 'Responsable', esc(c.Cajero))}
                    ${filaCierre('bi-clock-history', 'Apertura', util.hora12(c.Hora_inicio))}
                    ${filaCierre('bi-clock', 'Cierre', c.Cerrado ? util.hora12(c.Hora_fin) : 'Pendiente')}
                    ${filaCierre('bi-receipt', 'N.° de ventas', c.Num_ventas)}
                    ${c.Por_medio.map((m) => filaCierre(util.iconoMedio(m.Medio_pago), esc(m.Medio_pago), util.pesos(m.Total))).join('')}
                    <div class="fila-cierre total-cierre">
                        <span>Total del turno</span>
                        <strong>${util.pesos(c.Total)}</strong>
                    </div>
                </div>
            </div>`;
    }

    // ----- Observaciones: GET /observaciones y POST /observaciones/{id}/atendida -----
    async function cargarObservaciones() {
        try {
            const lista = await api.get('/observaciones');
            const pendientes = lista.filter((o) => !o.Atendida).length;
            $('contadorObservaciones').textContent = `${pendientes} pendiente${pendientes === 1 ? '' : 's'}`;
            $('listaObservaciones').innerHTML = lista.length
                ? lista.map(tarjetaObservacion).join('')
                : '<p class="text-muted mb-0">No hay observaciones del dueño.</p>';
        } catch (error) {
            $('listaObservaciones').innerHTML = util.alerta(error.message);
        }
    }

    function tarjetaObservacion(o) {
        const [clase, icono] = TIPOS_OBSERVACION[o.Tipo] || ['tipo-compra', 'bi-chat-left-text'];
        return `
            <div class="observacion${o.Atendida ? ' atendida' : ''}">
                <div class="cabecera-observacion">
                    <span class="${clase}"><span class="bi ${icono} me-1"></span>${esc(o.Tipo)}</span>
                    <small>${util.fechaCorta(o.Fecha)} · Sobre: <strong>${esc(o.Sobre)}</strong></small>
                    <span class="${o.Atendida ? 'estado-ok' : 'estado-pendiente'} ms-auto">${o.Atendida ? 'Atendida' : 'Pendiente'}</span>
                </div>
                <p class="${o.Atendida ? 'mb-0' : 'mb-2'}">${esc(o.Texto)}</p>
                ${o.Atendida ? '' : `
                    <button type="button" class="boton-naranja boton-sm" data-atender="${o.Id_observacion}">
                        <span class="bi bi-check2-circle"></span>Marcar como atendida
                    </button>`}
            </div>`;
    }

    $('listaObservaciones').addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-atender]');
        if (!boton) {
            return;
        }
        boton.disabled = true;
        try {
            await api.post(`/observaciones/${boton.dataset.atender}/atendida`, {});
            await cargarObservaciones();
        } catch (error) {
            boton.disabled = false;
            boton.insertAdjacentHTML('afterend', `<div class="mt-2">${util.alerta(error.message)}</div>`);
        }
    });

    // ----- Empleados: GET /cajeros, GET /empleados y POST de contratar, aumento y despido -----
    async function cargarPersonal() {
        try {
            const [cajeros, empleados] = await Promise.all([api.get('/cajeros'), api.get('/empleados')]);
            personal = [
                ...cajeros.map((c) => ({
                    tipo: 'cajero', id: c.Id_Cajero, Nombre: c.Nombre, Cargo: 'Cajero',
                    Etiqueta: `Cajero ${c.Id_Cajero}`, Fecha_nacimiento: c.Fecha_nacimiento, Sueldo_base: c.Sueldo_base
                })),
                ...empleados.map((e) => ({
                    tipo: 'empleado', id: e.Id_Empleado, Nombre: e.Nombre, Cargo: e.Cargo,
                    Etiqueta: e.Cargo, Fecha_nacimiento: e.Fecha_nacimiento, Sueldo_base: e.Sueldo_base
                }))
            ];
            pintarCupos();
            pintarEmpleados();
        } catch (error) {
            util.mensaje($('mensajeEmpleados'), error.message, 'danger');
        }
    }

    function ocupados(cargo) {
        return personal.filter((p) => p.Cargo === cargo).length;
    }

    function pintarCupos() {
        $('cuposCargo').innerHTML = CARGOS.map(({ cargo, plural, icono }) => {
            const limite = CONFIG.LIMITE_CARGO[cargo];
            const usados = ocupados(cargo);
            const libres = limite - usados;
            return `
                <div class="col-6 col-lg-3">
                    <div class="cupo${libres <= 0 ? ' completo' : ''}">
                        <span class="bi ${icono} icono-cupo"></span>
                        <p class="nombre-cupo">${plural}</p>
                        <p class="numero-cupo">${usados} / ${limite}</p>
                        <span class="etiqueta-cupo">${libres <= 0 ? 'Cupo completo' : `${libres} disponible${libres === 1 ? '' : 's'}`}</span>
                    </div>
                </div>`;
        }).join('');
    }

    function pintarEmpleados() {
        const filtro = $('filtroCargo').value;
        const visibles = personal.filter((p) => !filtro || p.Cargo === filtro);

        $('tablaEmpleados').innerHTML = visibles.length
            ? visibles.map((p) => `
                <tr>
                    <td>${esc(p.Nombre)}</td>
                    <td><span class="cargo">${esc(p.Etiqueta)}</span></td>
                    <td>${util.fechaCorta(p.Fecha_nacimiento)}</td>
                    <td class="text-end sueldo">${util.pesos(p.Sueldo_base)}</td>
                    <td class="acciones">
                        <button type="button" class="boton-naranja boton-sm" data-accion="aumento" data-tipo="${p.tipo}" data-id="${p.id}">
                            <span class="bi bi-graph-up-arrow"></span>Aumento
                        </button>
                        ${p.tipo === 'empleado' ? `
                            <button type="button" class="boton-rojo boton-sm" data-accion="despido" data-tipo="${p.tipo}" data-id="${p.id}">
                                <span class="bi bi-person-x"></span>Despedir
                            </button>` : ''}
                    </td>
                </tr>`).join('')
            : '<tr><td colspan="5" class="text-muted">No hay empleados con ese cargo.</td></tr>';

        $('etiquetaNomina').textContent = `Total nómina mensual (${visibles.length} empleado${visibles.length === 1 ? '' : 's'})`;
        $('totalNomina').textContent = util.pesos(visibles.reduce((suma, p) => suma + p.Sueldo_base, 0));
    }

    $('filtroCargo').addEventListener('change', pintarEmpleados);

    $('tablaEmpleados').addEventListener('click', (evento) => {
        const boton = evento.target.closest('[data-accion]');
        if (!boton) {
            return;
        }
        seleccionado = personal.find((p) => p.tipo === boton.dataset.tipo && p.id === Number(boton.dataset.id));
        if (!seleccionado) {
            return;
        }
        if (boton.dataset.accion === 'aumento') {
            abrirAumento();
        } else {
            abrirDespido();
        }
    });

    // Contratar: POST /empleados
    $('modalContratar').addEventListener('show.bs.modal', () => {
        util.limpiarMensaje($('mensajeContratar'));
        $('cargoNuevo').innerHTML = '<option value="">Selecciona un cargo</option>' + CARGOS.map(({ cargo }) => {
            const limite = CONFIG.LIMITE_CARGO[cargo];
            const usados = ocupados(cargo);
            const bloqueado = cargo === 'Cajero' || usados >= limite;
            const detalle = usados >= limite ? `cupo completo ${usados}/${limite}` : `${usados}/${limite}`;
            return `<option value="${cargo}"${bloqueado ? ' disabled' : ''}>${cargo} (${detalle})</option>`;
        }).join('');
    });

    $('btnContratar').addEventListener('click', async () => {
        const mensaje = $('mensajeContratar');
        const datos = {
            Nombre: $('nombreNuevo').value.trim(),
            Fecha_nacimiento: $('nacimientoNuevo').value,
            Cargo: $('cargoNuevo').value,
            Sueldo_base: util.soloDigitos($('sueldoNuevo').value),
            Administrativo_Usuario: cuenta.usuario
        };
        if (!datos.Nombre || !datos.Fecha_nacimiento || !datos.Cargo || !datos.Sueldo_base) {
            util.mensaje(mensaje, 'Llena nombre, fecha de nacimiento, cargo y sueldo.', 'warning');
            return;
        }
        try {
            const nuevo = await api.post('/empleados', datos);
            modal('modalContratar').hide();
            ['nombreNuevo', 'nacimientoNuevo', 'sueldoNuevo'].forEach((id) => { $(id).value = ''; });
            util.mensaje($('mensajeEmpleados'), `${nuevo.Nombre} fue contratado como ${nuevo.Cargo}.`);
            await cargarPersonal();
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
        }
    });

    // Aumento: POST /empleados/{id}/aumento o /cajeros/{id}/aumento
    function abrirAumento() {
        $('aumentoNombre').textContent = seleccionado.Nombre;
        $('aumentoCargo').textContent = seleccionado.Etiqueta;
        $('aumentoSueldoActual').textContent = util.pesos(seleccionado.Sueldo_base);
        $('porcentajeAumento').value = '';
        $('sueldoNuevoAumento').value = '';
        util.limpiarMensaje($('mensajeAumento'));
        modal('modalAumento').show();
    }

    $('porcentajeAumento').addEventListener('input', () => {
        const porcentaje = Number($('porcentajeAumento').value.replace(',', '.'));
        if (seleccionado && porcentaje > 0) {
            const nuevo = Math.round(seleccionado.Sueldo_base * (1 + porcentaje / 100));
            $('sueldoNuevoAumento').value = nuevo.toLocaleString('es-CO');
        }
    });

    $('btnAplicarAumento').addEventListener('click', async () => {
        const mensaje = $('mensajeAumento');
        const sueldo = util.soloDigitos($('sueldoNuevoAumento').value);
        if (!sueldo) {
            util.mensaje(mensaje, 'Escribe el porcentaje o el nuevo sueldo.', 'warning');
            return;
        }
        const ruta = seleccionado.tipo === 'cajero'
            ? `/cajeros/${seleccionado.id}/aumento`
            : `/empleados/${seleccionado.id}/aumento`;
        try {
            await api.post(ruta, { Sueldo_base: sueldo });
            modal('modalAumento').hide();
            util.mensaje($('mensajeEmpleados'), `Nuevo sueldo de ${seleccionado.Nombre}: ${util.pesos(sueldo)}.`);
            await cargarPersonal();
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
        }
    });

    // Despido: POST /empleados/{id}/despido
    function abrirDespido() {
        $('despidoNombre').textContent = seleccionado.Nombre;
        $('despidoCargo').textContent = seleccionado.Etiqueta;
        util.limpiarMensaje($('mensajeDespido'));
        modal('modalDespido').show();
    }

    $('btnConfirmarDespido').addEventListener('click', async () => {
        try {
            await api.post(`/empleados/${seleccionado.id}/despido`, {});
            modal('modalDespido').hide();
            util.mensaje($('mensajeEmpleados'), `${seleccionado.Nombre} fue retirado de la nómina.`);
            await cargarPersonal();
        } catch (error) {
            util.mensaje($('mensajeDespido'), error.message, 'danger');
        }
    });

    // ----- Stock: GET /productos?tipo=Insumo,Reventa -----
    async function cargarStock() {
        try {
            const productos = await api.get('/productos?tipo=Insumo,Reventa');
            $('tablaStock').innerHTML = [...util.agrupar(productos, 'Categoria')].map(([categoria, lista]) => `
                <tr><td colspan="6" class="grupo-tabla">${esc(categoria)}</td></tr>
                ${lista.map((p) => {
                    const { nombre, unidad } = util.separarUnidad(p.Nombre_producto);
                    const { minimo, bajo } = util.estadoStock(p);
                    return `
                        <tr>
                            <td>${esc(nombre)}</td>
                            <td>${esc(unidad || 'und')}</td>
                            <td class="text-end">${p.Stock}</td>
                            <td class="text-end">${minimo ?? '—'}</td>
                            <td><span class="${bajo ? 'stock-bajo' : 'stock-ok'}">${bajo ? 'Stock bajo' : 'Suficiente'}</span></td>
                            <td>${esc(p.Proveedores || '—')}</td>
                        </tr>`;
                }).join('')}`).join('');
        } catch (error) {
            $('tablaStock').innerHTML = `<tr><td colspan="6">${util.alerta(error.message)}</td></tr>`;
        }
    }

    // ----- Pedidos a proveedores: GET /proveedores y POST /ordenes-compra -----
    async function cargarProveedores() {
        try {
            proveedores = (await api.get('/proveedores')).filter((p) => p.Productos.length);
            $('proveedor').innerHTML = proveedores
                .map((p) => `<option value="${p.Id_proveedor}">${esc(p.Nombre_proveedor)}</option>`)
                .join('');
            seleccionarProveedor();
        } catch (error) {
            util.mensaje($('mensajeCompra'), error.message, 'danger');
        }
    }

    function proveedorActual() {
        return proveedores.find((p) => p.Id_proveedor === Number($('proveedor').value));
    }

    function precioCompra(idProducto) {
        return DATOS_FUERA_DE_BD.precioCompra[idProducto] || 0;
    }

    function nuevaCompra() {
        compraRegistrada = false;
        $('btnRegistrarCompra').disabled = false;
        $('numeroOrden').textContent = 'N.° OC-nueva';
        util.limpiarMensaje($('mensajeCompra'));
        pedido.clear();
        document.querySelectorAll('#productosProveedor .input-cantidad').forEach((campo) => { campo.value = 0; });
    }

    function seleccionarProveedor() {
        nuevaCompra();
        const proveedor = proveedorActual();
        if (!proveedor) {
            return;
        }
        const contacto = util.separarContacto(proveedor.Contacto);
        $('contactoProveedor').textContent = contacto.nombre;
        $('telefonoProveedor').textContent = contacto.telefono;
        $('ordenProveedor').textContent = proveedor.Nombre_proveedor;

        $('productosProveedor').innerHTML = proveedor.Productos.map((p) => {
            const { nombre, unidad } = util.separarUnidad(p.Nombre_producto);
            const { bajo } = util.estadoStock(p);
            const medida = unidad || 'und';
            return `
                <tr>
                    <td>${esc(nombre)}</td>
                    <td class="text-end"><span class="${bajo ? 'stock-bajo' : 'stock-ok'}">${p.Stock} ${esc(medida)}</span></td>
                    <td class="precio-celda">${util.pesos(precioCompra(p.Id_producto))} / ${esc(medida)}</td>
                    <td>
                        <div class="control-cantidad">
                            <button type="button" class="boton-cant" data-id="${p.Id_producto}" data-paso="-1" aria-label="Restar ${esc(nombre)}"><span class="bi bi-dash-lg"></span></button>
                            <input type="text" class="input-cantidad" data-id="${p.Id_producto}" value="0" inputmode="numeric" aria-label="Cantidad de ${esc(nombre)}">
                            <button type="button" class="boton-cant" data-id="${p.Id_producto}" data-paso="1" aria-label="Sumar ${esc(nombre)}"><span class="bi bi-plus-lg"></span></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
        pintarCompra();
    }

    $('proveedor').addEventListener('change', seleccionarProveedor);

    function cambiarCantidadCompra(id, cantidad) {
        const valor = Math.max(0, Math.min(999, cantidad));
        if (valor === 0) {
            pedido.delete(id);
        } else {
            pedido.set(id, valor);
        }
        const campo = document.querySelector(`#productosProveedor .input-cantidad[data-id="${id}"]`);
        if (campo) {
            campo.value = valor;
        }
        pintarCompra();
    }

    $('productosProveedor').addEventListener('click', (evento) => {
        const boton = evento.target.closest('.boton-cant');
        if (!boton) {
            return;
        }
        if (compraRegistrada) {
            nuevaCompra();
        }
        const id = Number(boton.dataset.id);
        cambiarCantidadCompra(id, (pedido.get(id) || 0) + Number(boton.dataset.paso));
    });

    $('productosProveedor').addEventListener('input', (evento) => {
        if (!evento.target.classList.contains('input-cantidad')) {
            return;
        }
        const cantidad = util.soloDigitos(evento.target.value);
        if (compraRegistrada) {
            nuevaCompra();
        }
        cambiarCantidadCompra(Number(evento.target.dataset.id), cantidad);
    });

    function lineasCompra() {
        const proveedor = proveedorActual();
        if (!proveedor) {
            return [];
        }
        return [...pedido].map(([id, cantidad]) => {
            const producto = proveedor.Productos.find((p) => p.Id_producto === id);
            return { id, cantidad, nombre: producto.Nombre_producto, precio: precioCompra(id) };
        });
    }

    function pintarCompra() {
        const lineas = lineasCompra();
        const subtotal = lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0);
        const iva = subtotal * CONFIG.IVA_COMPRA;

        $('lineasCompra').innerHTML = lineas.length
            ? lineas.map((l) => `
                <tr>
                    <td>${esc(l.nombre)}</td>
                    <td class="text-end">${l.cantidad}</td>
                    <td class="text-end">${util.pesos(l.cantidad * l.precio)}</td>
                </tr>`).join('')
            : '<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>';

        $('subtotalCompra').textContent = util.pesos(subtotal);
        $('ivaCompra').textContent = util.pesos(iva);
        $('totalCompra').textContent = util.pesos(subtotal + iva);
    }

    $('btnRegistrarCompra').addEventListener('click', async () => {
        const mensaje = $('mensajeCompra');
        const lineas = lineasCompra();
        if (!lineas.length) {
            util.mensaje(mensaje, 'Agrega al menos un producto a la compra.', 'warning');
            return;
        }
        const boton = $('btnRegistrarCompra');
        boton.disabled = true;
        try {
            const orden = await api.post('/ordenes-compra', {
                Fecha_comision: util.fechaHoy(),
                Id_proveedor: proveedorActual().Id_proveedor,
                detalle: lineas.map((l) => ({ Id_producto: l.id, Cantidad: l.cantidad, Precio_unitario: l.precio }))
            });
            compraRegistrada = true;
            $('numeroOrden').textContent = `N.° OC-${String(orden.Id_Orden_compra).padStart(4, '0')}`;
            util.mensaje(mensaje, `Orden de compra OC-${String(orden.Id_Orden_compra).padStart(4, '0')} registrada.`);
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
            boton.disabled = false;
        }
    });

    $('btnImprimirCompra').addEventListener('click', () => window.print());
})();
