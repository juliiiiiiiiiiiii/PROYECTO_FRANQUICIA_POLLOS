const nombresGrupo = {
    "Broaster": "Pollo broaster",
    "Brasa": "Pollos a la brasa",
    "Complementos": "Complementos",
    "Bebidas": "Bebidas",
    "Combos": "Combos"
};

const cajero = usuarioActivo("cajero");
let IVA = 0;
let horarios = {};
let precios = {};
let cliente = null;
let cantidades = {};
let miTurno = false;
let ventaRegistrada = false;

async function iniciar() {
    if (!cajero) return;

    document.getElementById("nombreCajero").textContent = cajero.nombre;
    document.getElementById("facturaCajero").textContent = cajero.nombre;
    document.getElementById("fechaFactura").textContent = fechaHoy();

    try {
        let config = await api("/config");
        IVA = config.ivaVenta;
        horarios = config.horarios;
        document.getElementById("turnoCajero").textContent = "· Turno " + horarios[cajero.idCajero].turno;
        document.getElementById("etiquetaIva").textContent = `IVA (${IVA * 100}%)`;

        let medios = await api("/medios-pago");
        document.getElementById("metodoPago").innerHTML = medios
            .map(m => `<option value="${m.Id_medio_pago}">${escapar(m.Nombre)}</option>`).join("");

        dibujarMenu(await api("/menu"));
        dibujarFactura();
        await revisarTurno();
    } catch (error) {
        aviso("mensajeTurno", error.message, "danger");
    }
}

async function revisarTurno() {
    let turno = await api("/turno");
    miTurno = turno.enTurno === cajero.idCajero;

    document.querySelectorAll(".control-cajero").forEach(e => e.disabled = !miTurno);

    if (miTurno) {
        limpiarAviso("mensajeTurno");
    } else if (turno.enTurno === null) {
        aviso("mensajeTurno", "La caja ya se cerró por hoy.", "warning");
    } else {
        aviso("mensajeTurno", "La caja la tiene " + turno.nombreEnTurno + ". Debes esperar a que cierre su turno y te entregue la caja.", "warning");
    }
}

function dibujarMenu(productos) {
    let html = "";
    let grupoActual = "";
    precios = {};

    productos.forEach(p => {
        precios[p.Id_producto] = { nombre: p.Nombre_producto, precio: p.Precio };
        if (p.Categoria !== grupoActual) {
            grupoActual = p.Categoria;
            html += `<tr><td colspan="3" class="grupo-menu">${escapar(nombresGrupo[grupoActual] || grupoActual)}</td></tr>`;
        }
        html += `
            <tr>
                <td>${escapar(p.Nombre_producto)}</td>
                <td class="precio-celda">${pesos(p.Precio)}</td>
                <td>
                    <div class="control-cantidad">
                        <button type="button" class="boton-cant control-cajero" onclick="sumar(${p.Id_producto}, -1)">−</button>
                        <input type="text" class="input-cantidad control-cajero" id="cant-${p.Id_producto}" value="0" inputmode="numeric" oninput="escribir(${p.Id_producto}, this.value)">
                        <button type="button" class="boton-cant control-cajero" onclick="sumar(${p.Id_producto}, 1)">+</button>
                    </div>
                </td>
            </tr>`;
    });
    document.getElementById("tablaMenu").innerHTML = html;
}

function sumar(id, paso) {
    ponerCantidad(id, (cantidades[id] || 0) + paso);
}

function escribir(id, valor) {
    ponerCantidad(id, soloNumeros(valor));
}

function ponerCantidad(id, cantidad) {
    cantidad = Math.max(0, Math.min(99, cantidad));
    if (cantidad === 0) delete cantidades[id];
    else cantidades[id] = cantidad;
    document.getElementById("cant-" + id).value = cantidad;
    dibujarFactura();
}

function dibujarFactura() {
    let html = "";
    let subtotal = 0;

    for (let id in cantidades) {
        let p = precios[id];
        let importe = cantidades[id] * p.precio;
        subtotal += importe;
        html += `<tr><td>${escapar(p.nombre)}</td><td class="text-end">${cantidades[id]}</td><td class="text-end">${pesos(importe)}</td></tr>`;
    }
    if (html === "") html = `<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>`;

    let cumpleanos = cliente && esCumpleanos(cliente.nacimiento);
    let iva = cumpleanos ? 0 : subtotal * IVA;

    document.getElementById("lineasFactura").innerHTML = html;
    document.getElementById("subtotalFactura").textContent = pesos(subtotal);
    document.getElementById("etiquetaIva").textContent = cumpleanos ? "IVA (exonerado por cumpleaños)" : `IVA (${IVA * 100}%)`;
    document.getElementById("ivaFactura").textContent = pesos(iva);
    document.getElementById("totalFactura").textContent = pesos(subtotal + iva);

    document.getElementById("facturaCliente").textContent = cliente ? cliente.nombre : "(sin seleccionar)";
    document.getElementById("facturaDocumento").textContent = cliente ? cliente.id : "—";
}

function esCumpleanos(nacimiento) {
    return Boolean(nacimiento) && String(nacimiento).slice(5, 10) === fechaHoy().slice(5, 10);
}

async function buscarCliente() {
    let id = soloNumeros(document.getElementById("idCliente").value);
    if (!id) {
        aviso("mensajeCliente", "Escribe el número de identificación.", "warning");
        return;
    }
    try {
        let encontrado = await api("/clientes/" + id);
        cliente = { id: encontrado.Id_cliente, nombre: encontrado.Nombre, nacimiento: encontrado.Fecha_nacimiento };
        document.getElementById("nombreCliente").value = encontrado.Nombre;
        document.getElementById("cumpleCliente").value = encontrado.Fecha_nacimiento;
        aviso("mensajeCliente", "Cliente seleccionado: " + encontrado.Nombre + ".");
    } catch (error) {
        cliente = null;
        aviso("mensajeCliente", error.message, "warning");
    }
    dibujarFactura();
}

async function registrarCliente() {
    let id = soloNumeros(document.getElementById("idCliente").value);
    let nombre = document.getElementById("nombreCliente").value.trim();
    let cumple = document.getElementById("cumpleCliente").value;

    if (!id || nombre === "" || cumple === "") {
        aviso("mensajeCliente", "Para registrar llena identificación, nombre y fecha de cumpleaños.", "warning");
        return;
    }
    try {
        let nuevo = await api("/clientes", "POST", { id: id, nombre: nombre, fechaNacimiento: cumple });
        cliente = { id: nuevo.Id_cliente, nombre: nuevo.Nombre, nacimiento: cumple };
        aviso("mensajeCliente", "Cliente " + nuevo.Nombre + " registrado.");
    } catch (error) {
        aviso("mensajeCliente", error.message, "warning");
    }
    dibujarFactura();
}

async function registrarVenta() {
    if (ventaRegistrada) {
        aviso("mensajeVenta", "Esta venta ya se registró. Presiona Nueva venta para empezar otra.", "warning");
        return;
    }
    if (!cliente) {
        aviso("mensajeVenta", "Busca o registra al cliente antes de la venta.", "warning");
        return;
    }
    if (Object.keys(cantidades).length === 0) {
        aviso("mensajeVenta", "Agrega al menos un producto.", "warning");
        return;
    }

    let items = Object.keys(cantidades).map(id => ({ idProducto: Number(id), cantidad: cantidades[id] }));
    try {
        let respuesta = await api("/ventas", "POST", {
            idCliente: cliente.id,
            idMedioPago: Number(document.getElementById("metodoPago").value),
            items: items
        });
        ventaRegistrada = true;
        document.getElementById("numeroFactura").textContent = "N.° " + String(respuesta.idVenta).padStart(4, "0");
        aviso("mensajeVenta", "Venta N.° " + respuesta.idVenta + " registrada. Imprime la factura o empieza una nueva.");
    } catch (error) {
        aviso("mensajeVenta", error.message, "danger");
    }
}

function nuevaVenta() {
    cliente = null;
    cantidades = {};
    ventaRegistrada = false;
    document.querySelectorAll(".input-cantidad").forEach(c => c.value = 0);
    document.getElementById("idCliente").value = "";
    document.getElementById("nombreCliente").value = "";
    document.getElementById("cumpleCliente").value = "";
    document.getElementById("numeroFactura").textContent = "N.° nueva";
    limpiarAviso("mensajeCliente");
    limpiarAviso("mensajeVenta");
    dibujarFactura();
}

function imprimirFactura() {
    window.print();
}

function abrirCierre() {
    document.getElementById("cierreCajero").textContent = cajero.nombre;
    document.getElementById("cierreFecha").textContent = fechaHoy();
    document.getElementById("cierreHora").textContent = horaAhora();
    document.getElementById("btnConfirmarCierre").disabled = false;
    limpiarAviso("mensajeCierre");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCierre")).show();
}

async function confirmarCierre() {
    document.getElementById("btnConfirmarCierre").disabled = true;
    try {
        let cierre = await api("/turno/cerrar", "POST");
        let texto = cierre.siguiente ? "Caja cerrada. La caja queda para el turno de la noche." : "Caja cerrada. Terminó la jornada de hoy.";
        aviso("mensajeCierre", texto);
        setTimeout(cerrarSesion, 2500);
    } catch (error) {
        document.getElementById("btnConfirmarCierre").disabled = false;
        aviso("mensajeCierre", error.message, "danger");
    }
}

iniciar();
