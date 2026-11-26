const IVA_COMPRA = 0.19;
const limites = { Cajero: 2, Mesero: 4, Aseo: 2, Cocinero: 5 };

// Tipo de observación -> [clase de color, ícono]
const tiposObs = {
    "Aumento": ["tipo-aumento", "bi-graph-up-arrow"],
    "Despido": ["tipo-despido", "bi-person-x"],
    "Contratación": ["tipo-contratacion", "bi-person-plus"],
    "Compra": ["tipo-compra", "bi-cart"]
};

// ===== Datos de ejemplo (luego vendrán de la base de datos) =====
const cierres = [
    { cajero: 1, nombre: "Lucía Torres", apertura: "08:00", cierre: "16:00", ventas: 2, total: 174800, cerrado: true },
    { cajero: 2, nombre: "Miguel Soto", apertura: "16:00", cierre: "", ventas: 1, total: 68000, cerrado: false }
];

// Personal: [nombre, cargo, nacimiento, sueldo]
let personal = [
    ["Lucía Torres", "Cajero", "1996-03-21", 1800000],
    ["Miguel Soto", "Cajero", "1994-11-08", 1800000],
    ["Ana Pérez", "Mesero", "1998-04-10", 1750000],
    ["Valentina Gómez", "Mesero", "2000-08-19", 1750000],
    ["Andrés Rojas", "Mesero", "1997-01-25", 1750000],
    ["Marta Herrera", "Aseo", "1975-06-30", 1750000],
    ["José Díaz", "Cocinero", "1980-03-05", 2500000],
    ["Carlos Mejía", "Cocinero", "1991-12-17", 2200000],
    ["Diana López", "Cocinero", "1993-05-22", 2200000],
    ["Felipe Vargas", "Cocinero", "1995-09-09", 2200000]
];

// Productos de cada proveedor: [nombre, stock, precio de compra, stock bajo]
const proveedores = [
    { nombre: "Avícola San Pedro", telefono: "987 654 321", productos: [["Pollo entero crudo", "120 und", 14000, false], ["Alitas de pollo", "12 kg", 16000, true]] },
    { nombre: "Distribuidora La Papa", telefono: "955 112 233", productos: [["Papa", "15 kg", 2500, true]] },
    { nombre: "Bebidas del Sur", telefono: "944 778 990", productos: [["Gaseosa 1.5 L", "30 und", 5000, false]] }
];

const stock = [
    ["Pollo", "Pollo entero crudo", "und", 120, 60],
    ["Pollo", "Alitas de pollo", "kg", 12, 20],
    ["Acompañamientos", "Papa", "kg", 15, 50],
    ["Insumos de cocina", "Aceite vegetal", "litro", 8, 20],
    ["Bebidas", "Gaseosa 1.5 L", "und", 30, 24]
];

const admin = usuarioActivo("administrativo");
let seleccionado = null;
let pedido = {};

function iniciar() {
    if (!admin) return;
    document.getElementById("nombreAdmin").textContent = admin.nombre;
    document.getElementById("fechaOrden").textContent = fechaHoy();
    document.getElementById("ordenSolicita").textContent = admin.nombre;
    document.getElementById("etiquetaIvaCompra").textContent = `IVA (${IVA_COMPRA * 100}%)`;

    tablaCierres();
    listaObservaciones();
    cupos();
    tablaEmpleados();
    tablaStock();
    opcionesProveedor();
    verProveedor();
}

// ===== Cierres de caja =====
function tablaCierres() {
    document.getElementById("tarjetasCierre").innerHTML = cierres.map(c => `
        <div class="col-12 col-md-6">
            <div class="tarjeta-cierre">
                <div class="cabecera-cierre">
                    <h3><span class="bi bi-person-badge me-2"></span>Cajero ${c.cajero}</h3>
                    <span class="${c.cerrado ? "estado-ok" : "estado-pendiente"}">${c.cerrado ? "Recibido" : "Turno abierto"}</span>
                </div>
                <div class="fila-cierre"><span>Responsable</span><strong>${c.nombre}</strong></div>
                <div class="fila-cierre"><span>Apertura</span><strong>${c.apertura}</strong></div>
                <div class="fila-cierre"><span>Cierre</span><strong>${c.cierre || "Pendiente"}</strong></div>
                <div class="fila-cierre"><span>N.° de ventas</span><strong>${c.ventas}</strong></div>
                <div class="fila-cierre total-cierre"><span>Total del turno</span><strong>${pesos(c.total)}</strong></div>
            </div>
        </div>`).join("");

    document.getElementById("ventasDia").textContent = cierres.reduce((s, c) => s + c.ventas, 0);
    document.getElementById("totalDia").textContent = pesos(cierres.reduce((s, c) => s + c.total, 0));
}

// ===== Observaciones del dueño (llegan por localStorage) =====
function leerObservaciones() {
    return JSON.parse(localStorage.getItem("observaciones") || "[]");
}

function listaObservaciones() {
    let lista = leerObservaciones();
    let pendientes = lista.filter(o => !o.atendida).length;

    document.getElementById("contadorObservaciones").textContent = pendientes + (pendientes === 1 ? " pendiente" : " pendientes");

    if (lista.length === 0) {
        document.getElementById("listaObservaciones").innerHTML = `<p class="text-muted mb-0">No hay observaciones del dueño.</p>`;
        return;
    }

    document.getElementById("listaObservaciones").innerHTML = lista.map((o, i) => {
        let tipo = tiposObs[o.tipo] || ["tipo-compra", "bi-chat-left-text"];
        let boton = o.atendida ? "" : `<button type="button" class="boton-naranja boton-sm" onclick="atender(${i})"><span class="bi bi-check2-circle"></span>Marcar como atendida</button>`;
        return `
            <div class="observacion${o.atendida ? " atendida" : ""}">
                <div class="cabecera-observacion">
                    <span class="${tipo[0]}"><span class="bi ${tipo[1]} me-1"></span>${o.tipo}</span>
                    <small>${o.fecha} · Sobre: <strong>${o.sobre}</strong></small>
                    <span class="${o.atendida ? "estado-ok" : "estado-pendiente"} ms-auto">${o.atendida ? "Atendida" : "Pendiente"}</span>
                </div>
                <p class="${o.atendida ? "mb-0" : "mb-2"}">${o.texto}</p>
                ${boton}
            </div>`;
    }).join("");
}

function atender(indice) {
    let lista = leerObservaciones();
    lista[indice].atendida = true;
    localStorage.setItem("observaciones", JSON.stringify(lista));
    listaObservaciones();
}

// ===== Empleados =====
function ocupados(cargo) {
    return personal.filter(p => p[1] === cargo).length;
}

function cupos() {
    const iconos = { Cajero: "bi-person-badge", Mesero: "bi-cup-hot", Aseo: "bi-stars", Cocinero: "bi-fire" };
    document.getElementById("cuposCargo").innerHTML = Object.keys(limites).map(cargo => {
        let usados = ocupados(cargo);
        let libres = limites[cargo] - usados;
        return `
            <div class="col-6 col-lg-3">
                <div class="cupo${libres <= 0 ? " completo" : ""}">
                    <span class="bi ${iconos[cargo]} icono-cupo"></span>
                    <p class="nombre-cupo">${cargo}</p>
                    <p class="numero-cupo">${usados} / ${limites[cargo]}</p>
                    <span class="etiqueta-cupo">${libres <= 0 ? "Cupo completo" : libres + " disponible(s)"}</span>
                </div>
            </div>`;
    }).join("");
}

function tablaEmpleados() {
    let filtro = document.getElementById("filtroCargo").value;
    let total = 0;
    let visibles = 0;
    let html = "";

    personal.forEach((p, i) => {
        if (filtro !== "" && p[1] !== filtro) return;
        visibles++;
        total += p[3];
        let despido = p[1] === "Cajero" ? "" : `<button type="button" class="boton-rojo boton-sm" onclick="abrirDespido(${i})"><span class="bi bi-person-x"></span>Despedir</button>`;
        html += `
            <tr>
                <td>${p[0]}</td>
                <td><span class="cargo">${p[1]}</span></td>
                <td>${p[2]}</td>
                <td class="text-end sueldo">${pesos(p[3])}</td>
                <td class="acciones">
                    <button type="button" class="boton-naranja boton-sm" onclick="abrirAumento(${i})"><span class="bi bi-graph-up-arrow"></span>Aumento</button>
                    ${despido}
                </td>
            </tr>`;
    });

    if (visibles === 0) html = `<tr><td colspan="5" class="text-muted">No hay empleados con ese cargo.</td></tr>`;

    document.getElementById("tablaEmpleados").innerHTML = html;
    document.getElementById("etiquetaNomina").textContent = `Total nómina mensual (${visibles} empleado(s))`;
    document.getElementById("totalNomina").textContent = pesos(total);
}

function abrirContratar() {
    limpiarAviso("mensajeContratar");
    document.getElementById("cargoNuevo").innerHTML =
        `<option value="">Selecciona un cargo</option>` +
        Object.keys(limites).map(cargo => {
            let usados = ocupados(cargo);
            let lleno = cargo === "Cajero" || usados >= limites[cargo];
            return `<option value="${cargo}" ${lleno ? "disabled" : ""}>${cargo} (${usados}/${limites[cargo]})</option>`;
        }).join("");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalContratar")).show();
}

function contratar() {
    let nombre = document.getElementById("nombreNuevo").value.trim();
    let nacimiento = document.getElementById("nacimientoNuevo").value;
    let cargo = document.getElementById("cargoNuevo").value;
    let sueldo = soloNumeros(document.getElementById("sueldoNuevo").value);

    if (nombre === "" || nacimiento === "" || cargo === "" || !sueldo) {
        aviso("mensajeContratar", "Llena nombre, fecha de nacimiento, cargo y sueldo.", "warning");
        return;
    }
    if (ocupados(cargo) >= limites[cargo]) {
        aviso("mensajeContratar", "No hay cupo para ese cargo.", "danger");
        return;
    }

    personal.push([nombre, cargo, nacimiento, sueldo]);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalContratar")).hide();
    document.getElementById("nombreNuevo").value = "";
    document.getElementById("nacimientoNuevo").value = "";
    document.getElementById("sueldoNuevo").value = "";
    aviso("mensajeEmpleados", `${nombre} fue contratado como ${cargo}.`);
    cupos();
    tablaEmpleados();
}

function abrirAumento(indice) {
    seleccionado = indice;
    let p = personal[indice];
    document.getElementById("aumentoNombre").textContent = p[0];
    document.getElementById("aumentoCargo").textContent = p[1];
    document.getElementById("aumentoSueldoActual").textContent = pesos(p[3]);
    document.getElementById("porcentajeAumento").value = "";
    document.getElementById("sueldoNuevoAumento").value = "";
    limpiarAviso("mensajeAumento");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAumento")).show();
}

function calcularAumento() {
    let porcentaje = Number(document.getElementById("porcentajeAumento").value.replace(",", "."));
    if (seleccionado !== null && porcentaje > 0) {
        let nuevo = Math.round(personal[seleccionado][3] * (1 + porcentaje / 100));
        document.getElementById("sueldoNuevoAumento").value = nuevo.toLocaleString("es-CO");
    }
}

function aplicarAumento() {
    let sueldo = soloNumeros(document.getElementById("sueldoNuevoAumento").value);
    if (!sueldo) {
        aviso("mensajeAumento", "Escribe el porcentaje o el nuevo sueldo.", "warning");
        return;
    }
    personal[seleccionado][3] = sueldo;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAumento")).hide();
    aviso("mensajeEmpleados", `Nuevo sueldo de ${personal[seleccionado][0]}: ${pesos(sueldo)}.`);
    tablaEmpleados();
}

function abrirDespido(indice) {
    seleccionado = indice;
    document.getElementById("despidoNombre").textContent = personal[indice][0];
    document.getElementById("despidoCargo").textContent = personal[indice][1];
    limpiarAviso("mensajeDespido");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDespido")).show();
}

function confirmarDespido() {
    let nombre = personal[seleccionado][0];
    personal.splice(seleccionado, 1);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDespido")).hide();
    aviso("mensajeEmpleados", `${nombre} fue retirado de la nómina.`);
    cupos();
    tablaEmpleados();
}

// ===== Stock =====
function tablaStock() {
    let categoria = "";
    let html = "";
    stock.forEach(s => {
        if (s[0] !== categoria) {
            categoria = s[0];
            html += `<tr><td colspan="5" class="grupo-tabla">${categoria}</td></tr>`;
        }
        let bajo = s[3] < s[4];
        html += `
            <tr>
                <td>${s[1]}</td>
                <td>${s[2]}</td>
                <td class="text-end">${s[3]}</td>
                <td class="text-end">${s[4]}</td>
                <td><span class="${bajo ? "stock-bajo" : "stock-ok"}">${bajo ? "Stock bajo" : "Suficiente"}</span></td>
            </tr>`;
    });
    document.getElementById("tablaStock").innerHTML = html;
}

// ===== Pedidos a proveedores =====
function opcionesProveedor() {
    document.getElementById("proveedor").innerHTML =
        proveedores.map((p, i) => `<option value="${i}">${p.nombre}</option>`).join("");
}

function proveedorActual() {
    return proveedores[Number(document.getElementById("proveedor").value)];
}

function verProveedor() {
    pedido = {};
    document.getElementById("numeroOrden").textContent = "N.° OC-nueva";
    limpiarAviso("mensajeCompra");

    let p = proveedorActual();
    document.getElementById("contactoProveedor").textContent = p.nombre;
    document.getElementById("telefonoProveedor").textContent = p.telefono;
    document.getElementById("ordenProveedor").textContent = p.nombre;

    document.getElementById("productosProveedor").innerHTML = p.productos.map((prod, i) => `
        <tr>
            <td>${prod[0]}</td>
            <td class="text-end"><span class="${prod[3] ? "stock-bajo" : "stock-ok"}">${prod[1]}</span></td>
            <td class="precio-celda">${pesos(prod[2])}</td>
            <td>
                <div class="control-cantidad">
                    <button type="button" class="boton-cant" onclick="sumarCompra(${i}, -1)">−</button>
                    <input type="text" class="input-cantidad" id="compra-${i}" value="0" inputmode="numeric" oninput="escribirCompra(${i}, this.value)">
                    <button type="button" class="boton-cant" onclick="sumarCompra(${i}, 1)">+</button>
                </div>
            </td>
        </tr>`).join("");

    dibujarCompra();
}

function sumarCompra(i, paso) {
    ponerCompra(i, (pedido[i] || 0) + paso);
}

function escribirCompra(i, valor) {
    ponerCompra(i, soloNumeros(valor));
}

function ponerCompra(i, cantidad) {
    cantidad = Math.max(0, Math.min(999, cantidad));
    if (cantidad === 0) delete pedido[i];
    else pedido[i] = cantidad;
    document.getElementById("compra-" + i).value = cantidad;
    dibujarCompra();
}

function dibujarCompra() {
    let p = proveedorActual();
    let subtotal = 0;
    let html = "";

    for (let i in pedido) {
        let prod = p.productos[i];
        let importe = pedido[i] * prod[2];
        subtotal += importe;
        html += `<tr><td>${prod[0]}</td><td class="text-end">${pedido[i]}</td><td class="text-end">${pesos(importe)}</td></tr>`;
    }
    if (html === "") html = `<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>`;

    document.getElementById("lineasCompra").innerHTML = html;
    document.getElementById("subtotalCompra").textContent = pesos(subtotal);
    document.getElementById("ivaCompra").textContent = pesos(subtotal * IVA_COMPRA);
    document.getElementById("totalCompra").textContent = pesos(subtotal + subtotal * IVA_COMPRA);
}

function registrarCompra() {
    if (Object.keys(pedido).length === 0) {
        aviso("mensajeCompra", "Agrega al menos un producto a la compra.", "warning");
        return;
    }
    let numero = Number(localStorage.getItem("ultimaOrden") || "0") + 1;
    localStorage.setItem("ultimaOrden", numero);
    document.getElementById("numeroOrden").textContent = "N.° OC-" + String(numero).padStart(4, "0");
    aviso("mensajeCompra", "Orden de compra OC-" + String(numero).padStart(4, "0") + " registrada.");
}

function imprimirCompra() {
    window.print();
}

iniciar();
