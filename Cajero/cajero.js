const IVA_VENTA = 0.08;

// Horario y caja de cada cajero (Id_cajero)
const horarios = {
    1: { inicio: "08:00:00", caja: 1, turno: "Día" },
    2: { inicio: "16:00:00", caja: 2, turno: "Noche" }
};

// Productos y precios del menú (Menu/menu.html). El primer número es el Id_producto.
const menu = [
    { grupo: "Pollo broaster", productos: [[1, "Broaster 8 presas", 50000], [2, "Broaster 4 presas", 28000], [3, "Alitas broaster", 22000]] },
    { grupo: "Pollos a la brasa", productos: [[4, "Pollo entero", 52000], [5, "Medio pollo", 30000], [6, "Cuarto de pollo", 17000]] },
    { grupo: "Complementos", productos: [[7, "Papas fritas", 8000], [8, "Ensalada fresca", 7000], [9, "Mollejitas", 10000]] },
    { grupo: "Bebidas", productos: [[10, "Gaseosa personal", 4500], [11, "Gaseosa 1.5 L", 8000], [12, "Jugo natural", 6000]] },
    { grupo: "Combos", productos: [[13, "Combo Familiar", 68000], [14, "Combo Pareja", 40000], [15, "Combo Broaster", 64000]] }
];

let cajero = JSON.parse(sessionStorage.getItem("usuario"));
let cliente = null;
let cantidades = {};
let ventaRegistrada = false;

// ===== Funciones de apoyo =====
function formatoPesos(valor) {
    return "$ " + Math.round(valor).toLocaleString("es-CO");
}

function soloNumeros(texto) {
    return Number(String(texto).replace(/\D/g, "")) || 0;
}

function fechaHoy() {
    let hoy = new Date();
    let mes = String(hoy.getMonth() + 1).padStart(2, "0");
    let dia = String(hoy.getDate()).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function horaActual() {
    let ahora = new Date();
    let horas = String(ahora.getHours()).padStart(2, "0");
    let minutos = String(ahora.getMinutes()).padStart(2, "0");
    let segundos = String(ahora.getSeconds()).padStart(2, "0");
    return `${horas}:${minutos}:${segundos}`;
}

function fechaCorta(fecha) {
    let partes = fecha.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function hora12(hora) {
    if (!hora) {
        return "—";
    }
    let partes = hora.split(":");
    let horas = Number(partes[0]);
    let sufijo = horas >= 12 ? "p.m." : "a.m.";
    horas = horas % 12 || 12;
    return `${String(horas).padStart(2, "0")}:${partes[1]} ${sufijo}`;
}

function mostrarMensaje(id, texto, tipo = "success") {
    let caja = document.getElementById(id);
    caja.innerHTML = `<div class="alert alert-${tipo} py-2 mb-0" role="alert"></div>`;
    caja.firstChild.textContent = texto;
}

function limpiarMensaje(id) {
    document.getElementById(id).innerHTML = "";
}

function buscarProducto(id) {
    for (let i = 0; i < menu.length; i++) {
        for (let j = 0; j < menu[i].productos.length; j++) {
            let producto = menu[i].productos[j];
            if (producto[0] === id) {
                return { id: producto[0], nombre: producto[1], precio: producto[2] };
            }
        }
    }
    return null;
}

function iconoMedio(nombre) {
    if (nombre.startsWith("Efectivo")) {
        return "bi-cash";
    }
    if (nombre.startsWith("Tarjeta")) {
        return "bi-credit-card";
    }
    return "bi-phone";
}

// ===== Inicio de la página =====
function iniciarPagina() {
    if (!cajero || cajero.rol !== "cajero") {
        window.location.href = "../Login/login.html";
        return;
    }

    let horario = horarios[cajero.idCajero];
    document.getElementById("nombreCajero").textContent = cajero.nombre;
    document.getElementById("turnoCajero").textContent = horario ? "· Turno " + horario.turno : "";
    document.getElementById("facturaCajero").textContent = cajero.nombre;
    document.getElementById("fechaFactura").textContent = fechaCorta(fechaHoy());
    document.getElementById("etiquetaIva").textContent = `IVA (${IVA_VENTA * 100}%)`;

    crearMenu();
    actualizarFactura();
    cargarMediosPago();
}

// ===== Menú y cantidades =====
function crearMenu() {
    let html = "";

    for (let i = 0; i < menu.length; i++) {
        let grupo = menu[i];
        html += `<tr><td colspan="3" class="grupo-menu">${grupo.grupo}</td></tr>`;

        for (let j = 0; j < grupo.productos.length; j++) {
            let id = grupo.productos[j][0];
            let nombre = grupo.productos[j][1];
            let precio = grupo.productos[j][2];

            html += `
                <tr>
                    <td>${nombre}</td>
                    <td class="precio-celda">${formatoPesos(precio)}</td>
                    <td>
                        <div class="control-cantidad">
                            <button type="button" class="boton-cant" onclick="cambiarCantidad(${id}, -1)" aria-label="Restar ${nombre}"><span class="bi bi-dash-lg"></span></button>
                            <input type="text" class="input-cantidad" id="cantidad-${id}" value="0" inputmode="numeric" oninput="escribirCantidad(${id}, this.value)" aria-label="Cantidad de ${nombre}">
                            <button type="button" class="boton-cant" onclick="cambiarCantidad(${id}, 1)" aria-label="Sumar ${nombre}"><span class="bi bi-plus-lg"></span></button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    document.getElementById("tablaMenu").innerHTML = html;
}

function cambiarCantidad(id, paso) {
    if (ventaRegistrada) {
        nuevaVenta(true);
    }
    let actual = cantidades[id] || 0;
    ponerCantidad(id, actual + paso);
}

function escribirCantidad(id, valor) {
    let cantidad = soloNumeros(valor);
    if (ventaRegistrada) {
        nuevaVenta(true);
    }
    ponerCantidad(id, cantidad);
}

function ponerCantidad(id, cantidad) {
    if (cantidad < 0) {
        cantidad = 0;
    }
    if (cantidad > 99) {
        cantidad = 99;
    }

    if (cantidad === 0) {
        delete cantidades[id];
    } else {
        cantidades[id] = cantidad;
    }

    document.getElementById("cantidad-" + id).value = cantidad;
    actualizarFactura();
}

// ===== Factura =====
function lineasFactura() {
    let lineas = [];
    for (const id in cantidades) {
        let producto = buscarProducto(Number(id));
        producto.cantidad = cantidades[id];
        lineas.push(producto);
    }
    return lineas;
}

function actualizarFactura() {
    let lineas = lineasFactura();
    let subtotal = 0;
    let html = "";

    for (let i = 0; i < lineas.length; i++) {
        let linea = lineas[i];
        subtotal += linea.cantidad * linea.precio;
        html += `
            <tr>
                <td>${linea.nombre}</td>
                <td class="text-end">${linea.cantidad}</td>
                <td class="text-end">${formatoPesos(linea.cantidad * linea.precio)}</td>
            </tr>
        `;
    }

    if (lineas.length === 0) {
        html = `<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>`;
    }

    let iva = subtotal * IVA_VENTA;
    document.getElementById("lineasFactura").innerHTML = html;
    document.getElementById("subtotalFactura").textContent = formatoPesos(subtotal);
    document.getElementById("ivaFactura").textContent = formatoPesos(iva);
    document.getElementById("totalFactura").textContent = formatoPesos(subtotal + iva);
}

function mostrarClienteEnFactura() {
    document.getElementById("facturaCliente").textContent = cliente ? cliente.Nombre : "(sin seleccionar)";
    document.getElementById("facturaDocumento").textContent = cliente ? cliente.Id_cliente : "—";
}

async function cargarMediosPago() {
    const respuesta = await fetch("/medios-pago");
    const medios = await respuesta.json();

    let html = "";
    for (let i = 0; i < medios.length; i++) {
        html += `<option value="${medios[i].Id_medio_pago}">${medios[i].Nombre}</option>`;
    }
    document.getElementById("metodoPago").innerHTML = html;
}

// ===== Cliente =====
async function buscarCliente() {
    if (ventaRegistrada) {
        nuevaVenta(false);
    }

    let documento = soloNumeros(document.getElementById("idCliente").value);
    if (!documento) {
        mostrarMensaje("mensajeCliente", "Escribe el número de identificación.", "warning");
        return;
    }

    const respuesta = await fetch("/clientes/" + documento);

    if (respuesta.ok) {
        cliente = await respuesta.json();
        document.getElementById("nombreCliente").value = cliente.Nombre;
        document.getElementById("cumpleCliente").value = cliente.Fecha_nacimiento;
        mostrarMensaje("mensajeCliente", "Cliente encontrado: " + cliente.Nombre + ".");
    } else {
        cliente = null;
        document.getElementById("nombreCliente").value = "";
        document.getElementById("cumpleCliente").value = "";
        mostrarMensaje("mensajeCliente", "El cliente no está registrado. Llena sus datos y regístralo.", "warning");
    }

    mostrarClienteEnFactura();
}

async function registrarCliente() {
    if (ventaRegistrada) {
        nuevaVenta(false);
    }

    let nuevo = {
        Id_cliente: soloNumeros(document.getElementById("idCliente").value),
        Nombre: document.getElementById("nombreCliente").value.trim(),
        Fecha_nacimiento: document.getElementById("cumpleCliente").value
    };

    if (!nuevo.Id_cliente || nuevo.Nombre === "" || nuevo.Fecha_nacimiento === "") {
        mostrarMensaje("mensajeCliente", "Para registrar llena identificación, nombre y fecha de cumpleaños.", "warning");
        return;
    }

    const respuesta = await fetch("/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo)
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeCliente", datos.mensaje || "No se pudo registrar el cliente.", "danger");
        return;
    }

    cliente = datos;
    mostrarMensaje("mensajeCliente", "Cliente " + cliente.Nombre + " registrado.");
    mostrarClienteEnFactura();
}

// ===== Venta =====
async function registrarVenta() {
    let lineas = lineasFactura();

    if (!cliente) {
        mostrarMensaje("mensajeVenta", "Busca o registra al cliente antes de registrar la venta.", "warning");
        return;
    }
    if (lineas.length === 0) {
        mostrarMensaje("mensajeVenta", "Agrega al menos un producto.", "warning");
        return;
    }

    let detalle = [];
    for (let i = 0; i < lineas.length; i++) {
        detalle.push({ Id_producto: lineas[i].id, Cantidad: lineas[i].cantidad, Precio_unitario: lineas[i].precio });
    }

    let venta = {
        Fecha_compra: fechaHoy(),
        Id_cliente: cliente.Id_cliente,
        Id_cajero: cajero.idCajero,
        Id_medio_pago: Number(document.getElementById("metodoPago").value),
        detalle: detalle
    };

    let boton = document.getElementById("btnRegistrarVenta");
    boton.disabled = true;

    const respuesta = await fetch("/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venta)
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeVenta", datos.mensaje || "No se pudo registrar la venta.", "danger");
        boton.disabled = false;
        return;
    }

    ventaRegistrada = true;
    document.getElementById("numeroFactura").textContent = "N.° " + String(datos.Id_venta).padStart(4, "0");
    mostrarMensaje("mensajeVenta", `Venta N.° ${datos.Id_venta} registrada. Puedes imprimirla; al cambiar un producto o un cliente empieza una venta nueva.`);
}

// limpiarCliente = false conserva lo que el cajero acaba de escribir en los datos del cliente
function nuevaVenta(limpiarCliente) {
    ventaRegistrada = false;
    cantidades = {};
    cliente = null;

    document.getElementById("btnRegistrarVenta").disabled = false;
    document.getElementById("numeroFactura").textContent = "N.° nueva";
    limpiarMensaje("mensajeVenta");

    let campos = document.getElementsByClassName("input-cantidad");
    for (let i = 0; i < campos.length; i++) {
        campos[i].value = 0;
    }

    if (limpiarCliente) {
        document.getElementById("idCliente").value = "";
        document.getElementById("nombreCliente").value = "";
        document.getElementById("cumpleCliente").value = "";
        limpiarMensaje("mensajeCliente");
    }

    mostrarClienteEnFactura();
    actualizarFactura();
}

function imprimirFactura() {
    window.print();
}

// ===== Cierre de caja =====
async function abrirCierre() {
    let boton = document.getElementById("btnConfirmarCierre");
    boton.disabled = true;
    limpiarMensaje("mensajeCierre");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCierre")).show();

    const respuesta = await fetch("/cierres?fecha=" + fechaHoy());
    const cierres = await respuesta.json();

    let cierre = null;
    for (let i = 0; i < cierres.length; i++) {
        if (cierres[i].Id_cajero === cajero.idCajero) {
            cierre = cierres[i];
        }
    }

    if (!cierre) {
        mostrarMensaje("mensajeCierre", "No se encontró la información del turno.", "danger");
        return;
    }

    document.getElementById("cierreCajero").textContent = cajero.nombre;
    document.getElementById("cierreFecha").textContent = fechaCorta(fechaHoy());
    document.getElementById("cierreApertura").textContent = hora12(cierre.Hora_inicio);
    document.getElementById("cierreHora").textContent = cierre.Cerrado ? hora12(cierre.Hora_fin) : hora12(horaActual()) + " (ahora)";
    document.getElementById("cierreVentas").textContent = cierre.Num_ventas;
    document.getElementById("cierreTotal").textContent = formatoPesos(cierre.Total);

    let html = "";
    for (let i = 0; i < cierre.Por_medio.length; i++) {
        let medio = cierre.Por_medio[i];
        html += `
            <div class="fila-cierre">
                <span><span class="bi ${iconoMedio(medio.Medio_pago)} me-2"></span>${medio.Medio_pago}</span>
                <strong>${formatoPesos(medio.Total)}</strong>
            </div>
        `;
    }
    document.getElementById("cierrePorMedio").innerHTML = html;

    if (cierre.Cerrado) {
        mostrarMensaje("mensajeCierre", "El turno de hoy ya está cerrado.", "info");
    } else {
        boton.disabled = false;
    }
}

async function confirmarCierre() {
    let horario = horarios[cajero.idCajero];
    let boton = document.getElementById("btnConfirmarCierre");
    boton.disabled = true;

    const respuesta = await fetch("/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            Fecha: fechaHoy(),
            Hora_inicio: horario.inicio,
            Hora_fin: horaActual(),
            Id_cajero: cajero.idCajero,
            Id_caja: horario.caja
        })
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeCierre", datos.mensaje || "No se pudo cerrar la caja.", "danger");
        boton.disabled = false;
        return;
    }

    mostrarMensaje("mensajeCierre", "Caja cerrada. Se cerrará la sesión para el cambio de turno.");
    setTimeout(cerrarSesion, 2000);
}

function cerrarSesion() {
    sessionStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}

iniciarPagina();
