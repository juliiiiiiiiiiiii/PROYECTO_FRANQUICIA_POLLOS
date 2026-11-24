// Hora de fin de cada turno (Id_cajero), para mostrarla mientras el turno sigue abierto
const finTurno = { 1: "16:00:00", 2: "23:00:00" };

// Stock mínimo por Id_producto: la tabla Producto todavía no tiene esta columna
const stockMinimo = {
    10: 48, 11: 24, 16: 60, 17: 20, 18: 10, 19: 50, 20: 10, 21: 15,
    22: 20, 23: 10, 24: 3, 25: 3, 26: 5, 27: 5, 28: 2, 29: 100
};

let dueno = JSON.parse(sessionStorage.getItem("usuario"));

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

function separarUnidad(nombreProducto) {
    let partes = nombreProducto.match(/^(.*)\s\((.+)\)$/);
    if (partes) {
        return { nombre: partes[1], unidad: partes[2] };
    }
    return { nombre: nombreProducto, unidad: "und" };
}

function separarContacto(contacto) {
    let partes = contacto.split(" - ");
    return { nombre: partes[0], telefono: partes[1] || "—" };
}

function numeroFactura(id) {
    return String(id).padStart(4, "0");
}

function etiquetaEstado(cerrado) {
    if (cerrado) {
        return `<span class="estado estado-ok"><i class="bi bi-check-circle"></i>Turno cerrado</span>`;
    }
    return `<span class="estado estado-bajo"><i class="bi bi-hourglass-split"></i>Turno abierto</span>`;
}

function horarioTurno(cierre) {
    let fin = cierre.Cerrado ? cierre.Hora_fin : finTurno[cierre.Id_cajero];
    return hora12(cierre.Hora_inicio) + " - " + hora12(fin);
}

// ===== Inicio de la página =====
function iniciarPagina() {
    if (!dueno || dueno.rol !== "dueno") {
        window.location.href = "../Login/login.html";
        return;
    }

    document.getElementById("nombreDueno").textContent = dueno.nombre;

    cargarDia();
    cargarCuenta();
    cargarProveedores();
    cargarInventario();
    cargarPersonal();
    cargarObservaciones();
}

// ===== Resumen y Ventas del día =====
async function cargarDia() {
    const respuestaCierres = await fetch("/cierres?fecha=" + fechaHoy());
    const cierres = await respuestaCierres.json();
    const respuestaVentas = await fetch("/ventas?fecha=" + fechaHoy());
    const ventas = await respuestaVentas.json();

    let total = 0;
    for (let i = 0; i < ventas.length; i++) {
        total += Number(ventas[i].Total);
    }
    let ticket = ventas.length > 0 ? total / ventas.length : 0;

    let efectivo = 0;
    for (let i = 0; i < cierres.length; i++) {
        for (let j = 0; j < cierres[i].Por_medio.length; j++) {
            if (cierres[i].Por_medio[j].Medio_pago === "Efectivo") {
                efectivo += cierres[i].Por_medio[j].Total;
            }
        }
    }

    document.getElementById("resumenVentas").textContent = formatoPesos(total);
    document.getElementById("resumenPedidos").textContent = ventas.length;
    document.getElementById("resumenTicket").textContent = formatoPesos(ticket);
    document.getElementById("ventasTotal").textContent = formatoPesos(total);
    document.getElementById("ventasPedidos").textContent = ventas.length;
    document.getElementById("ventasTicket").textContent = formatoPesos(ticket);
    document.getElementById("cuentaEfectivo").textContent = formatoPesos(efectivo);
    document.getElementById("cuentaElectronico").textContent = formatoPesos(total - efectivo);

    crearTablaCierres(cierres);
    crearPanelesCajeros(cierres);
    crearTablaVentas(ventas);
}

function crearTablaCierres(cierres) {
    let html = "";
    for (let i = 0; i < cierres.length; i++) {
        let c = cierres[i];
        html += `
            <tr>
                <td>Caja ${c.Id_caja}</td>
                <td>${c.Cajero}</td>
                <td>${horarioTurno(c)}</td>
                <td>${c.Num_ventas}</td>
                <td>${formatoPesos(c.Total)}</td>
                <td>${etiquetaEstado(c.Cerrado)}</td>
            </tr>
        `;
    }
    document.getElementById("tablaCierres").innerHTML = html;
}

function crearPanelesCajeros(cierres) {
    let html = "";
    for (let i = 0; i < cierres.length; i++) {
        let c = cierres[i];

        let medios = "";
        for (let j = 0; j < c.Por_medio.length; j++) {
            let m = c.Por_medio[j];
            medios += `<div class="fila-dato"><span>${m.Medio_pago}</span><strong>${formatoPesos(m.Total)}</strong></div>`;
        }

        html += `
            <div class="col-12 col-md-6">
                <div class="panel">
                    <div class="panel-cabecera">
                        <h2><i class="bi bi-person-badge"></i>Cajero ${c.Id_cajero} · ${c.Cajero}</h2>
                        ${etiquetaEstado(c.Cerrado)}
                    </div>
                    <div class="fila-dato"><span>Turno</span><strong>${horarioTurno(c)}</strong></div>
                    <div class="fila-dato"><span>N.° de ventas</span><strong>${c.Num_ventas}</strong></div>
                    ${medios}
                    <div class="fila-dato total"><span>Total Cajero ${c.Id_cajero}</span><strong>${formatoPesos(c.Total)}</strong></div>
                </div>
            </div>
        `;
    }
    document.getElementById("panelesCajeros").innerHTML = html;
}

function crearTablaVentas(ventas) {
    let html = "";
    for (let i = ventas.length - 1; i >= 0; i--) {
        let v = ventas[i];
        html += `
            <tr>
                <td>${numeroFactura(v.Id_venta)}</td>
                <td>${v.Cajero}</td>
                <td>${v.Cliente}</td>
                <td>${v.Medio_pago}</td>
                <td>${formatoPesos(v.Total)}</td>
            </tr>
        `;
    }

    if (ventas.length === 0) {
        html = `<tr><td colspan="5" class="text-muted">Todavía no hay ventas hoy.</td></tr>`;
    }
    document.getElementById("tablaVentas").innerHTML = html;
}

// ===== Mi cuenta =====
async function cargarCuenta() {
    const respuestaCuenta = await fetch("/estado-cuenta?usuario=" + encodeURIComponent(dueno.usuario));
    const estado = await respuestaCuenta.json();
    const respuestaVentas = await fetch("/ventas");
    const ventas = await respuestaVentas.json();

    document.getElementById("saldoCuenta").textContent = formatoPesos(estado.Monto);

    let html = "";
    let mostradas = 0;
    for (let i = ventas.length - 1; i >= 0 && mostradas < 10; i--) {
        let v = ventas[i];
        mostradas++;
        html += `
            <tr>
                <td>${fechaCorta(v.Fecha_compra)}</td>
                <td>Venta N.° ${numeroFactura(v.Id_venta)} · ${v.Cajero}</td>
                <td><span class="estado estado-ok">Ingreso</span></td>
                <td class="monto-ingreso">+ ${formatoPesos(v.Total)}</td>
            </tr>
        `;
    }

    if (ventas.length === 0) {
        html = `<tr><td colspan="4" class="text-muted">Todavía no hay ingresos registrados.</td></tr>`;
    }
    document.getElementById("tablaMovimientos").innerHTML = html;
}

// ===== Proveedores =====
async function cargarProveedores() {
    const respuesta = await fetch("/proveedores");
    const proveedores = await respuesta.json();

    let html = "";
    for (let i = 0; i < proveedores.length; i++) {
        let p = proveedores[i];
        let contacto = separarContacto(p.Contacto);

        let productos = [];
        for (let j = 0; j < p.Productos.length; j++) {
            productos.push(separarUnidad(p.Productos[j].Nombre_producto).nombre);
        }

        html += `
            <tr>
                <td>${p.Nombre_proveedor}</td>
                <td>${productos.join(", ") || "—"}</td>
                <td>${contacto.telefono}</td>
                <td>${contacto.nombre}</td>
            </tr>
        `;
    }
    document.getElementById("tablaProveedores").innerHTML = html;
}

// ===== Inventario =====
async function cargarInventario() {
    const respuesta = await fetch("/productos?tipo=Insumo,Reventa");
    const productos = await respuesta.json();

    let html = "";
    for (let i = 0; i < productos.length; i++) {
        let p = productos[i];
        let producto = separarUnidad(p.Nombre_producto);
        let minimo = stockMinimo[p.Id_producto];
        let bajo = minimo !== undefined && p.Stock < minimo;

        html += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${p.Stock} ${producto.unidad}</td>
                <td><span class="estado ${bajo ? "estado-bajo" : "estado-ok"}">${bajo ? "Stock bajo" : "Suficiente"}</span></td>
            </tr>
        `;
    }
    document.getElementById("tablaInventario").innerHTML = html;
}

function abrirInsumo() {
    limpiarMensaje("mensajeInsumo");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalStock")).show();
}

async function guardarInsumo() {
    let nombre = document.getElementById("nombreInsumo").value.trim();
    let cantidad = document.getElementById("cantidadInsumo").value.trim();

    if (nombre === "" || cantidad === "") {
        mostrarMensaje("mensajeInsumo", "Escribe el producto y la cantidad.", "warning");
        return;
    }

    let insumo = {
        Nombre_producto: `${nombre} (${document.getElementById("unidadInsumo").value})`,
        Stock: soloNumeros(cantidad),
        Categoria: document.getElementById("categoriaInsumo").value,
        Tipo_producto: "Insumo"
    };

    const respuesta = await fetch("/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insumo)
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeInsumo", datos.mensaje || "No se pudo agregar el insumo.", "danger");
        return;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalStock")).hide();
    document.getElementById("nombreInsumo").value = "";
    document.getElementById("cantidadInsumo").value = "";
    mostrarMensaje("mensajeInventario", `Insumo "${insumo.Nombre_producto}" agregado.`);

    await cargarInventario();
}

// ===== Empleados =====
async function cargarPersonal() {
    const respuestaCajeros = await fetch("/cajeros");
    const cajeros = await respuestaCajeros.json();
    const respuestaEmpleados = await fetch("/empleados");
    const empleados = await respuestaEmpleados.json();

    document.getElementById("resumenEmpleados").textContent = cajeros.length + empleados.length;

    let html = `<optgroup label="Personal">`;
    for (let i = 0; i < cajeros.length; i++) {
        html += `<option value="${cajeros[i].Nombre}">${cajeros[i].Nombre} (Cajero ${cajeros[i].Id_Cajero})</option>`;
    }
    for (let i = 0; i < empleados.length; i++) {
        html += `<option value="${empleados[i].Nombre}">${empleados[i].Nombre} (${empleados[i].Cargo})</option>`;
    }
    html += `</optgroup><optgroup label="Áreas">`;

    let areas = ["Cocina", "Inventario", "General"];
    for (let i = 0; i < areas.length; i++) {
        html += `<option>${areas[i]}</option>`;
    }
    html += `</optgroup>`;

    document.getElementById("sobreObservacion").innerHTML = html;
}

// ===== Observaciones =====
async function cargarObservaciones() {
    const respuesta = await fetch("/observaciones");
    const lista = await respuesta.json();

    let html = "";
    for (let i = 0; i < lista.length; i++) {
        let o = lista[i];
        html += `
            <li>
                <div class="meta">
                    <span class="empleado">${o.Sobre}</span> · ${o.Tipo} · ${fechaCorta(o.Fecha)}
                    · ${o.Atendida ? "Atendida por el administrador" : "Pendiente"}
                </div>
                ${o.Texto}
            </li>
        `;
    }

    if (lista.length === 0) {
        html = `<li class="text-muted">Todavía no hay observaciones.</li>`;
    }
    document.getElementById("listaObservaciones").innerHTML = html;
}

async function enviarObservacion(evento) {
    evento.preventDefault();

    let texto = document.getElementById("observacion").value.trim();
    if (texto === "") {
        mostrarMensaje("mensajeObservacion", "Escribe la observación.", "warning");
        return;
    }

    let observacion = {
        Tipo: document.getElementById("tipoObs").value,
        Sobre: document.getElementById("sobreObservacion").value,
        Texto: texto,
        Fecha: fechaHoy(),
        Usuario_dueno: dueno.usuario
    };

    const respuesta = await fetch("/observaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(observacion)
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeObservacion", datos.mensaje || "No se pudo enviar la observación.", "danger");
        return;
    }

    document.getElementById("observacion").value = "";
    mostrarMensaje("mensajeObservacion", "Observación enviada al administrador.");
    await cargarObservaciones();
}

function cerrarSesion() {
    sessionStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}

iniciarPagina();
