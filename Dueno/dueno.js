const dueno = usuarioActivo("dueno");
let empleados = [];

async function iniciar() {
    if (!dueno) return;
    document.getElementById("nombreDueno").textContent = dueno.nombre;

    try {
        // Se piden todos los datos a la vez
        let [ventas, cierres, cuenta, proveedores, inventario, personal] = await Promise.all([
            api("/ventas?fecha=" + fechaHoy()),
            api("/cierres?fecha=" + fechaHoy()),
            api("/cuenta"),
            api("/proveedores"),
            api("/inventario"),
            api("/empleados")
        ]);
        empleados = personal;

        resumenYVentas(ventas, cierres);
        miCuenta(ventas, cuenta.saldo);
        tablaProveedores(proveedores);
        tablaInventario(inventario);
        opcionesObservacion();
        listaObservaciones();
    } catch (error) {
        alert(error.message);
    }
}

// ===== Resumen y Ventas =====
function resumenYVentas(ventas, cierres) {
    let total = ventas.reduce((suma, v) => suma + v.Total, 0);
    let ticket = ventas.length ? total / ventas.length : 0;

    document.getElementById("resumenVentas").textContent = pesos(total);
    document.getElementById("resumenPedidos").textContent = ventas.length;
    document.getElementById("resumenTicket").textContent = pesos(ticket);
    document.getElementById("resumenEmpleados").textContent = empleados.length;
    document.getElementById("ventasTotal").textContent = pesos(total);
    document.getElementById("ventasPedidos").textContent = ventas.length;
    document.getElementById("ventasTicket").textContent = pesos(ticket);

    document.getElementById("tablaCierres").innerHTML = cierres.map(c => `
        <tr>
            <td>Caja ${c.caja}</td>
            <td>${escapar(c.nombre)}</td>
            <td>${horarioTurno(c)}</td>
            <td>${c.ventas}</td>
            <td>${pesos(c.total)}</td>
            <td>${estadoTurno(c.cerrado)}</td>
        </tr>`).join("");

    document.getElementById("panelesCajeros").innerHTML = cierres.map(c => `
        <div class="col-12 col-md-6">
            <div class="panel">
                <div class="panel-cabecera">
                    <h2><i class="bi bi-person-badge"></i>Caja ${c.caja} · ${escapar(c.nombre)}</h2>
                    ${estadoTurno(c.cerrado)}
                </div>
                <div class="fila-dato"><span>Turno</span><strong>${horarioTurno(c)}</strong></div>
                <div class="fila-dato"><span>N.° de ventas</span><strong>${c.ventas}</strong></div>
                <div class="fila-dato total"><span>Total</span><strong>${pesos(c.total)}</strong></div>
            </div>
        </div>`).join("");

    document.getElementById("tablaVentas").innerHTML = ventas.length === 0
        ? `<tr><td colspan="5" class="text-muted">Todavía no hay ventas hoy.</td></tr>`
        : ventas.map(v => `
        <tr>
            <td>${String(v.Id_venta).padStart(4, "0")}</td>
            <td>${escapar(v.Cajero)}</td>
            <td>${escapar(v.Cliente)}</td>
            <td>${escapar(v.Medio)}</td>
            <td>${pesos(v.Total)}</td>
        </tr>`).join("");
}

function horarioTurno(c) {
    return horaCorta(c.apertura) + " - " + (c.cerrado ? horaCorta(c.cierre) : "en curso");
}

function estadoTurno(cerrado) {
    if (cerrado) return `<span class="estado estado-ok"><i class="bi bi-check-circle"></i>Turno cerrado</span>`;
    return `<span class="estado estado-bajo"><i class="bi bi-hourglass-split"></i>Turno abierto</span>`;
}

// ===== Mi cuenta =====
function miCuenta(ventas, saldo) {
    let efectivo = ventas.filter(v => v.Medio === "Efectivo").reduce((suma, v) => suma + v.Total, 0);
    let electronico = ventas.filter(v => v.Medio !== "Efectivo").reduce((suma, v) => suma + v.Total, 0);

    document.getElementById("saldoCuenta").textContent = pesos(saldo);
    document.getElementById("cuentaEfectivo").textContent = pesos(efectivo);
    document.getElementById("cuentaElectronico").textContent = pesos(electronico);

    document.getElementById("tablaMovimientos").innerHTML = ventas.length === 0
        ? `<tr><td colspan="4" class="text-muted">Todavía no hay ingresos hoy.</td></tr>`
        : ventas.map(v => `
        <tr>
            <td>${v.Fecha_compra}</td>
            <td>Venta N.° ${String(v.Id_venta).padStart(4, "0")} · ${escapar(v.Cajero)}</td>
            <td><span class="estado estado-ok">Ingreso</span></td>
            <td class="monto-ingreso">+ ${pesos(v.Total)}</td>
        </tr>`).join("");
}

// ===== Proveedores =====
function tablaProveedores(proveedores) {
    let html = "";
    proveedores.forEach(p => {
        let productos = p.productos.map(prod => prod.nombre).join(", ") || "—";
        html += `
            <tr>
                <td>${escapar(p.nombre)}</td>
                <td>${escapar(productos)}</td>
                <td>${escapar(p.telefono)}</td>
                <td>${escapar(p.contacto)}</td>
            </tr>`;
    });
    document.getElementById("tablaProveedores").innerHTML = html;
}

// ===== Inventario =====
async function cargarInventario() {
    tablaInventario(await api("/inventario"));
}

function tablaInventario(inventario) {
    document.getElementById("tablaInventario").innerHTML = inventario.map(p => {
        let bajo = p.Minimo !== null && p.Stock < p.Minimo;
        return `
            <tr>
                <td>${escapar(p.nombre)}</td>
                <td>${p.Stock} ${escapar(p.unidad)}</td>
                <td><span class="estado ${bajo ? "estado-bajo" : "estado-ok"}">${bajo ? "Stock bajo" : "Suficiente"}</span></td>
            </tr>`;
    }).join("");
}

function abrirInsumo() {
    limpiarAviso("mensajeInsumo");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalStock")).show();
}

async function guardarInsumo() {
    let nombre = document.getElementById("nombreInsumo").value.trim();
    let cantidad = document.getElementById("cantidadInsumo").value.trim();

    if (nombre === "" || cantidad === "") {
        aviso("mensajeInsumo", "Escribe el producto y la cantidad.", "warning");
        return;
    }

    try {
        await api("/inventario", "POST", {
            nombre: nombre,
            categoria: document.getElementById("categoriaInsumo").value,
            cantidad: soloNumeros(cantidad),
            unidad: document.getElementById("unidadInsumo").value
        });
    } catch (error) {
        aviso("mensajeInsumo", error.message, "danger");
        return;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalStock")).hide();
    document.getElementById("nombreInsumo").value = "";
    document.getElementById("cantidadInsumo").value = "";
    aviso("mensajeInventario", `Insumo "${nombre}" agregado.`);
    await cargarInventario();
}

// ===== Observaciones =====
// La base de datos no tiene tabla de observaciones, así que siguen en localStorage
// (solo las ve el administrador si usa el mismo navegador).
function leerObservaciones() {
    return JSON.parse(localStorage.getItem("observaciones") || "[]");
}

function opcionesObservacion() {
    document.getElementById("sobreObservacion").innerHTML =
        empleados.map(e => `<option>${escapar(e.Nombre)}</option>`).join("") +
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
                <span class="empleado">${escapar(o.sobre)}</span> · ${escapar(o.tipo)} · ${escapar(o.fecha)}
                · ${o.atendida ? "Atendida" : "Pendiente"}
            </div>
            ${escapar(o.texto)}
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
