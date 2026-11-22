// Productos y precios del menú (Menu/menu.html).
// Los Id coinciden con la tabla Producto. El precio vive aquí porque Producto no tiene columna de precio.
const MENU = [
    { grupo: 'Pollo broaster', productos: [[1, 'Broaster 8 presas', 50000], [2, 'Broaster 4 presas', 28000], [3, 'Alitas broaster', 22000]] },
    { grupo: 'Pollos a la brasa', productos: [[4, 'Pollo entero', 52000], [5, 'Medio pollo', 30000], [6, 'Cuarto de pollo', 17000]] },
    { grupo: 'Complementos', productos: [[7, 'Papas fritas', 8000], [8, 'Ensalada fresca', 7000], [9, 'Mollejitas', 10000]] },
    { grupo: 'Bebidas', productos: [[10, 'Gaseosa personal', 4500], [11, 'Gaseosa 1.5 L', 8000], [12, 'Jugo natural', 6000]] },
    { grupo: 'Combos', productos: [[13, 'Combo Familiar', 68000], [14, 'Combo Pareja', 40000], [15, 'Combo Broaster', 64000]] }
];

(() => {
    const cuenta = sesion.exigir('cajero');
    if (!cuenta) {
        return;
    }

    const $ = (id) => document.getElementById(id);
    const horario = CONFIG.HORARIO_CAJERO[cuenta.idCajero];
    const catalogo = new Map();
    const cantidades = new Map();
    let cliente = null;
    let ventaRegistrada = false;

    MENU.forEach((grupo) => grupo.productos.forEach(([id, nombre, precio]) => catalogo.set(id, { nombre, precio })));

    $('nombreCajero').textContent = cuenta.nombre;
    $('turnoCajero').textContent = horario ? `· Turno ${horario.turno}` : '';
    $('facturaCajero').textContent = cuenta.nombre;
    $('fechaFactura').textContent = util.fechaCorta(util.fechaHoy());
    $('etiquetaIva').textContent = `IVA (${CONFIG.IVA_VENTA * 100}%)`;
    $('cerrarSesion').addEventListener('click', () => sesion.cerrar());

    pintarMenu();
    pintarFactura();
    cargarMediosPago();

    // ----- Menú y cantidades -----
    function pintarMenu() {
        $('tablaMenu').innerHTML = MENU.map((grupo) => `
            <tr><td colspan="3" class="grupo-menu">${util.escapar(grupo.grupo)}</td></tr>
            ${grupo.productos.map(([id, nombre, precio]) => `
                <tr>
                    <td>${util.escapar(nombre)}</td>
                    <td class="precio-celda">${util.pesos(precio)}</td>
                    <td>
                        <div class="control-cantidad">
                            <button type="button" class="boton-cant" data-id="${id}" data-paso="-1" aria-label="Restar ${util.escapar(nombre)}"><span class="bi bi-dash-lg"></span></button>
                            <input type="text" class="input-cantidad" data-id="${id}" value="0" inputmode="numeric" aria-label="Cantidad de ${util.escapar(nombre)}">
                            <button type="button" class="boton-cant" data-id="${id}" data-paso="1" aria-label="Sumar ${util.escapar(nombre)}"><span class="bi bi-plus-lg"></span></button>
                        </div>
                    </td>
                </tr>`).join('')}
        `).join('');
    }

    function cambiarCantidad(id, cantidad) {
        const valor = Math.max(0, Math.min(99, cantidad));
        if (valor === 0) {
            cantidades.delete(id);
        } else {
            cantidades.set(id, valor);
        }
        const campo = document.querySelector(`.input-cantidad[data-id="${id}"]`);
        if (campo) {
            campo.value = valor;
        }
        pintarFactura();
    }

    $('tablaMenu').addEventListener('click', (evento) => {
        const boton = evento.target.closest('.boton-cant');
        if (!boton) {
            return;
        }
        if (ventaRegistrada) {
            prepararNuevaVenta(true);
        }
        const id = Number(boton.dataset.id);
        cambiarCantidad(id, (cantidades.get(id) || 0) + Number(boton.dataset.paso));
    });

    $('tablaMenu').addEventListener('input', (evento) => {
        if (!evento.target.classList.contains('input-cantidad')) {
            return;
        }
        const cantidad = util.soloDigitos(evento.target.value);
        if (ventaRegistrada) {
            prepararNuevaVenta(true);
        }
        cambiarCantidad(Number(evento.target.dataset.id), cantidad);
    });

    // ----- Factura -----
    function lineasFactura() {
        return [...cantidades].map(([id, cantidad]) => ({ id, cantidad, ...catalogo.get(id) }));
    }

    function pintarFactura() {
        const lineas = lineasFactura();
        const subtotal = lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0);
        const iva = subtotal * CONFIG.IVA_VENTA;

        $('lineasFactura').innerHTML = lineas.length
            ? lineas.map((l) => `
                <tr>
                    <td>${util.escapar(l.nombre)}</td>
                    <td class="text-end">${l.cantidad}</td>
                    <td class="text-end">${util.pesos(l.cantidad * l.precio)}</td>
                </tr>`).join('')
            : '<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>';

        $('subtotalFactura').textContent = util.pesos(subtotal);
        $('ivaFactura').textContent = util.pesos(iva);
        $('totalFactura').textContent = util.pesos(subtotal + iva);
    }

    function pintarCliente() {
        $('facturaCliente').textContent = cliente ? cliente.Nombre : '(sin seleccionar)';
        $('facturaDocumento').textContent = cliente ? cliente.Id_cliente : '—';
    }

    async function cargarMediosPago() {
        try {
            const medios = await api.get('/medios-pago');
            $('metodoPago').innerHTML = medios
                .map((m) => `<option value="${m.Id_medio_pago}">${util.escapar(m.Nombre)}</option>`)
                .join('');
        } catch (error) {
            util.mensaje($('mensajeVenta'), `No se pudieron cargar los medios de pago: ${error.message}`, 'danger');
        }
    }

    // ----- Cliente: GET /clientes/{id} y POST /clientes -----
    $('btnBuscarCliente').addEventListener('click', async () => {
        if (ventaRegistrada) {
            prepararNuevaVenta(false);
        }
        const mensaje = $('mensajeCliente');
        const documento = util.soloDigitos($('idCliente').value);
        if (!documento) {
            util.mensaje(mensaje, 'Escribe el número de identificación.', 'warning');
            return;
        }
        try {
            cliente = await api.get(`/clientes/${documento}`);
            $('nombreCliente').value = cliente.Nombre;
            $('cumpleCliente').value = cliente.Fecha_nacimiento;
            util.mensaje(mensaje, `Cliente encontrado: ${cliente.Nombre}.`);
        } catch (error) {
            cliente = null;
            $('nombreCliente').value = '';
            $('cumpleCliente').value = '';
            util.mensaje(mensaje, `${error.message} Llena sus datos y regístralo.`, 'warning');
        }
        pintarCliente();
    });

    $('btnRegistrarCliente').addEventListener('click', async () => {
        if (ventaRegistrada) {
            prepararNuevaVenta(false);
        }
        const mensaje = $('mensajeCliente');
        const datos = {
            Id_cliente: util.soloDigitos($('idCliente').value),
            Nombre: $('nombreCliente').value.trim(),
            Fecha_nacimiento: $('cumpleCliente').value
        };
        if (!datos.Id_cliente || !datos.Nombre || !datos.Fecha_nacimiento) {
            util.mensaje(mensaje, 'Para registrar llena identificación, nombre y fecha de cumpleaños.', 'warning');
            return;
        }
        try {
            cliente = await api.post('/clientes', datos);
            util.mensaje(mensaje, `Cliente ${cliente.Nombre} registrado.`);
            pintarCliente();
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
        }
    });

    // ----- Venta: POST /ventas -----
    $('btnRegistrarVenta').addEventListener('click', async () => {
        const mensaje = $('mensajeVenta');
        const boton = $('btnRegistrarVenta');
        const lineas = lineasFactura();

        if (!cliente) {
            util.mensaje(mensaje, 'Busca o registra al cliente antes de registrar la venta.', 'warning');
            return;
        }
        if (!lineas.length) {
            util.mensaje(mensaje, 'Agrega al menos un producto.', 'warning');
            return;
        }

        const venta = {
            Fecha_compra: util.fechaHoy(),
            Id_cliente: cliente.Id_cliente,
            Id_cajero: cuenta.idCajero,
            Id_medio_pago: Number($('metodoPago').value),
            detalle: lineas.map((l) => ({ Id_producto: l.id, Cantidad: l.cantidad, Precio_unitario: l.precio }))
        };

        boton.disabled = true;
        try {
            const resultado = await api.post('/ventas', venta);
            ventaRegistrada = true;
            $('numeroFactura').textContent = `N.° ${String(resultado.Id_venta).padStart(4, '0')}`;
            util.mensaje(mensaje, `Venta N.° ${resultado.Id_venta} registrada. Puedes imprimirla; al cambiar un producto o un cliente empieza una venta nueva.`);
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
            boton.disabled = false;
        }
    });

    // limpiarCliente = false conserva lo que el cajero acaba de escribir en los datos del cliente.
    function prepararNuevaVenta(limpiarCliente) {
        ventaRegistrada = false;
        $('btnRegistrarVenta').disabled = false;
        $('numeroFactura').textContent = 'N.° nueva';
        util.limpiarMensaje($('mensajeVenta'));
        cantidades.clear();
        document.querySelectorAll('.input-cantidad').forEach((campo) => { campo.value = 0; });
        cliente = null;
        if (limpiarCliente) {
            $('idCliente').value = '';
            $('nombreCliente').value = '';
            $('cumpleCliente').value = '';
            util.limpiarMensaje($('mensajeCliente'));
        }
        pintarCliente();
        pintarFactura();
    }

    $('btnImprimir').addEventListener('click', () => window.print());

    // ----- Cierre de caja: GET /cierres y POST /turnos -----
    $('modalCierre').addEventListener('show.bs.modal', cargarCierre);

    async function cargarCierre() {
        const mensaje = $('mensajeCierre');
        const boton = $('btnConfirmarCierre');
        util.limpiarMensaje(mensaje);
        boton.disabled = true;

        try {
            const cierres = await api.get(`/cierres?fecha=${util.fechaHoy()}`);
            const propio = cierres.find((c) => c.Id_cajero === cuenta.idCajero);

            $('cierreCajero').textContent = cuenta.nombre;
            $('cierreFecha').textContent = util.fechaCorta(util.fechaHoy());
            $('cierreApertura').textContent = util.hora12(propio.Hora_inicio);
            $('cierreHora').textContent = propio.Cerrado ? util.hora12(propio.Hora_fin) : `${util.hora12(util.horaActual())} (ahora)`;
            $('cierreVentas').textContent = propio.Num_ventas;
            $('cierrePorMedio').innerHTML = propio.Por_medio.map((m) => `
                <div class="fila-cierre">
                    <span><span class="bi ${util.iconoMedio(m.Medio_pago)} me-2"></span>${util.escapar(m.Medio_pago)}</span>
                    <strong>${util.pesos(m.Total)}</strong>
                </div>`).join('');
            $('cierreTotal').textContent = util.pesos(propio.Total);

            if (propio.Cerrado) {
                util.mensaje(mensaje, 'El turno de hoy ya está cerrado.', 'info');
            } else {
                boton.disabled = false;
            }
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
        }
    }

    $('btnConfirmarCierre').addEventListener('click', async () => {
        const mensaje = $('mensajeCierre');
        const boton = $('btnConfirmarCierre');
        boton.disabled = true;

        try {
            await api.post('/turnos', {
                Fecha: util.fechaHoy(),
                Hora_inicio: horario.inicio,
                Hora_fin: util.horaActual(),
                Id_cajero: cuenta.idCajero,
                Id_caja: horario.caja
            });
            util.mensaje(mensaje, 'Caja cerrada. Se cerrará la sesión para el cambio de turno.');
            setTimeout(() => sesion.cerrar(), 2000);
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
            boton.disabled = false;
        }
    });
})();
