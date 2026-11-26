// ===== Datos de ejemplo (luego vendrán de la base de datos) =====
const ventasHoy = [
    { factura: 1, cajero: "Lucía Torres", cliente: "María López", medio: "Efectivo", total: 64800 },
    { factura: 2, cajero: "Lucía Torres", cliente: "Pedro Gómez", medio: "Nequi", total: 110000 },
    { factura: 3, cajero: "Miguel Soto", cliente: "Ana Ruiz", medio: "Tarjeta", total: 68000 }
];

const cierres = [
    { caja: 1, cajero: "Lucía Torres", turno: "08:00 - 16:00", ventas: 2, total: 174800, cerrado: true },
    { caja: 2, cajero: "Miguel Soto", turno: "16:00 - 23:00", ventas: 1, total: 68000, cerrado: false }
];

const proveedores = [
    { nombre: "Avícola San Pedro", producto: "Pollo entero crudo", telefono: "987 654 321", contacto: "Juan Medina" },
    { nombre: "Distribuidora La Papa", producto: "Papa", telefono: "955 112 233", contacto: "Rosa Quispe" },
    { nombre: "Bebidas del Sur", producto: "Gaseosas", telefono: "944 778 990", contacto: "Luis Carrión" }
];

const inventario = [
    { nombre: "Pollo entero crudo", cantidad: "120 und", bajo: false },
    { nombre: "Papa", cantidad: "15 kg", bajo: true },
    { nombre: "Aceite vegetal", cantidad: "8 litros", bajo: true },
    { nombre: "Gaseosa 1.5 L", cantidad: "30 und", bajo: false }
];

const empleados = ["Lucía Torres", "Miguel Soto", "Ana Pérez", "José Díaz"];
const saldo = 14320000;

const dueno = usuarioActivo("dueno");

function iniciar() {
    if (!dueno) return;
    document.getElementById("nombreDueno").textContent = dueno.nombre;

    resumenYVentas();
    miCuenta();
    tablaProveedores();
    tablaInventario();
    opcionesObservacion();
    listaObservaciones();
}

// ===== Resumen y Ventas =====
function resumenYVentas() {
    let total = ventasHoy.reduce((suma, v) => suma + v.total, 0);
    let ticket = ventasHoy.length ? total / ventasHoy.length : 0;

    document.getElementById("resumenVentas").textContent = pesos(total);
    document.getElementById("resumenPedidos").textContent = ventasHoy.length;
    document.getElementById("resumenTicket").textContent = pesos(ticket);
    document.getElementById("resumenEmpleados").textContent = empleados.length;
    document.getElementById("ventasTotal").textContent = pesos(total);
    document.getElementById("ventasPedidos").textContent = ventasHoy.length;
    document.getElementById("ventasTicket").textContent = pesos(ticket);

    document.getElementById("tablaCierres").innerHTML = cierres.map(c => `
        <tr>
            <td>Caja ${c.caja}</td>
            <td>${c.cajero}</td>
            <td>${c.turno}</td>
            <td>${c.ventas}</td>
            <td>${pesos(c.total)}</td>
            <td>${estadoTurno(c.cerrado)}</td>
        </tr>`).join("");

    document.getElementById("panelesCajeros").innerHTML = cierres.map(c => `
        <div class="col-12 col-md-6">
            <div class="panel">
                <div class="panel-cabecera">
                    <h2><i class="bi bi-person-badge"></i>Caja ${c.caja} · ${c.cajero}</h2>
                    ${estadoTurno(c.cerrado)}
                </div>
                <div class="fila-dato"><span>Turno</span><strong>${c.turno}</strong></div>
                <div class="fila-dato"><span>N.° de ventas</span><strong>${c.ventas}</strong></div>
                <div class="fila-dato total"><span>Total</span><strong>${pesos(c.total)}</strong></div>
            </div>
        </div>`).join("");

    document.getElementById("tablaVentas").innerHTML = ventasHoy.map(v => `
        <tr>
            <td>${String(v.factura).padStart(4, "0")}</td>
            <td>${v.cajero}</td>
            <td>${v.cliente}</td>
            <td>${v.medio}</td>
            <td>${pesos(v.total)}</td>
        </tr>`).join("");
}

function estadoTurno(cerrado) {
    if (cerrado) return `<span class="estado estado-ok"><i class="bi bi-check-circle"></i>Turno cerrado</span>`;
    return `<span class="estado estado-bajo"><i class="bi bi-hourglass-split"></i>Turno abierto</span>`;
}

// ===== Mi cuenta =====
function miCuenta() {
    let efectivo = cierres.reduce((suma, c) => suma + c.total, 0);
    document.getElementById("saldoCuenta").textContent = pesos(saldo);
    document.getElementById("cuentaEfectivo").textContent = pesos(efectivo);
    document.getElementById("cuentaElectronico").textContent = pesos(saldo - efectivo);

    document.getElementById("tablaMovimientos").innerHTML = ventasHoy.map(v => `
        <tr>
            <td>${fechaHoy()}</td>
            <td>Venta N.° ${String(v.factura).padStart(4, "0")} · ${v.cajero}</td>
            <td><span class="estado estado-ok">Ingreso</span></td>
            <td class="monto-ingreso">+ ${pesos(v.total)}</td>
        </tr>`).join("");
}

// ===== Proveedores =====
function tablaProveedores() {
    document.getElementById("tablaProveedores").innerHTML = proveedores.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.producto}</td>
            <td>${p.telefono}</td>
            <td>${p.contacto}</td>
        </tr>`).join("");
}

// ===== Inventario =====
function tablaInventario() {
    document.getElementById("tablaInventario").innerHTML = inventario.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td><span class="estado ${p.bajo ? "estado-bajo" : "estado-ok"}">${p.bajo ? "Stock bajo" : "Suficiente"}</span></td>
        </tr>`).join("");
}

function abrirInsumo() {
    limpiarAviso("mensajeInsumo");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalStock")).show();
}

function guardarInsumo() {
    let nombre = document.getElementById("nombreInsumo").value.trim();
    let cantidad = document.getElementById("cantidadInsumo").value.trim();

    if (nombre === "" || cantidad === "") {
        aviso("mensajeInsumo", "Escribe el producto y la cantidad.", "warning");
        return;
    }

    inventario.push({
        nombre: nombre,
        cantidad: cantidad + " " + document.getElementById("unidadInsumo").value,
        bajo: false
    });

    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalStock")).hide();
    document.getElementById("nombreInsumo").value = "";
    document.getElementById("cantidadInsumo").value = "";
    aviso("mensajeInventario", `Insumo "${nombre}" agregado.`);
    tablaInventario();
}

// ===== Observaciones (se guardan en localStorage para que las vea el administrador) =====
function leerObservaciones() {
    return JSON.parse(localStorage.getItem("observaciones") || "[]");
}

function opcionesObservacion() {
    document.getElementById("sobreObservacion").innerHTML =
        empleados.map(e => `<option>${e}</option>`).join("") +
        ["Cocina", "Inventario", "General"].map(a => `<option>${a}</option>`).join("");
}

function listaObservaciones() {
    let lista = leerObservaciones();
    if (lista.length === 0) {
        document.getElementById("listaObservaciones").innerHTML = `<li class="text-muted">Todavía no hay observaciones.</li>`;
        return;
    }
    document.getElementById("listaObservaciones").innerHTML = lista.map(o => `
        <li>
            <div class="meta">
                <span class="empleado">${o.sobre}</span> · ${o.tipo} · ${o.fecha}
                · ${o.atendida ? "Atendida" : "Pendiente"}
            </div>
            ${o.texto}
        </li>`).join("");
}

function enviarObservacion(evento) {
    evento.preventDefault();
    let texto = document.getElementById("observacion").value.trim();

    if (texto === "") {
        aviso("mensajeObservacion", "Escribe la observación.", "warning");
        return;
    }

    let lista = leerObservaciones();
    lista.push({
        sobre: document.getElementById("sobreObservacion").value,
        tipo: document.getElementById("tipoObs").value,
        texto: texto,
        fecha: fechaHoy(),
        atendida: false
    });
    localStorage.setItem("observaciones", JSON.stringify(lista));

    document.getElementById("observacion").value = "";
    aviso("mensajeObservacion", "Observación enviada al administrador.");
    listaObservaciones();
}

iniciar();
