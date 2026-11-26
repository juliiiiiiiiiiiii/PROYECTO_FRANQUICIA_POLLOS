const tiposObs = {
    "Aumento": ["tipo-aumento", "bi-graph-up-arrow"],
    "Despido": ["tipo-despido", "bi-person-x"],
    "Contratación": ["tipo-contratacion", "bi-person-plus"],
    "Compra": ["tipo-compra", "bi-cart"]
};

const admin = usuarioActivo("administrativo");
let IVA_COMPRA = 0;
let limites = {};
let personal = [];
let proveedores = [];
let seleccionado = null;
let pedido = {};

async function iniciar() {
    if (!admin) return;
    document.getElementById("nombreAdmin").textContent = admin.nombre;
    document.getElementById("fechaOrden").textContent = fechaHoy();
    document.getElementById("ordenSolicita").textContent = admin.nombre;
    document.getElementById("fechaCierre").value = fechaHoy();

    try {
        let config = await api("/config");
        IVA_COMPRA = config.ivaCompra;
        limites = config.limites;
        document.getElementById("etiquetaIvaCompra").textContent = `IVA (${IVA_COMPRA * 100}%)`;

        listaObservaciones();
        await Promise.all([tablaCierres(), cargarEmpleados(), tablaStock(), cargarProveedores()]);
    } catch (error) {
        alert(error.message);
    }
}

async function tablaCierres() {
    let fecha = document.getElementById("fechaCierre").value || fechaHoy();
    let cierres = await api("/cierres?fecha=" + fecha);

    document.getElementById("tarjetasCierre").innerHTML = cierres.map(c => {
        let medios = Object.keys(c.porMedio)
            .map(m => `<div class="fila-cierre"><span>${escapar(m)}</span><strong>${pesos(c.porMedio[m])}</strong></div>`)
            .join("");
        return `
        <div class="col-12 col-md-6">
            <div class="tarjeta-cierre">
                <div class="cabecera-cierre">
                    <h3><span class="bi bi-person-badge me-2"></span>Cajero ${c.idCajero}</h3>
                    <span class="${c.cerrado ? "estado-ok" : "estado-pendiente"}">${c.cerrado ? "Recibido" : "Turno abierto"}</span>
                </div>
                <div class="fila-cierre"><span>Responsable</span><strong>${escapar(c.nombre)}</strong></div>
                <div class="fila-cierre"><span>Apertura</span><strong>${horaCorta(c.apertura)}</strong></div>
                <div class="fila-cierre"><span>Cierre</span><strong>${c.cierre ? horaCorta(c.cierre) : "Pendiente"}</strong></div>
                <div class="fila-cierre"><span>N.° de ventas</span><strong>${c.ventas}</strong></div>
                ${medios}
                <div class="fila-cierre total-cierre"><span>Total del turno</span><strong>${pesos(c.total)}</strong></div>
            </div>
        </div>`;
    }).join("");

    document.getElementById("ventasDia").textContent = cierres.reduce((s, c) => s + c.ventas, 0);
    document.getElementById("totalDia").textContent = pesos(cierres.reduce((s, c) => s + c.total, 0));
}

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
                    <span class="${tipo[0]}"><span class="bi ${tipo[1]} me-1"></span>${escapar(o.tipo)}</span>
                    <small>${escapar(o.fecha)} · Sobre: <strong>${escapar(o.sobre)}</strong></small>
                    <span class="${o.atendida ? "estado-ok" : "estado-pendiente"} ms-auto">${o.atendida ? "Atendida" : "Pendiente"}</span>
                </div>
                <p class="${o.atendida ? "mb-0" : "mb-2"}">${escapar(o.texto)}</p>
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

async function cargarEmpleados() {
    personal = await api("/empleados");
    cupos();
    tablaEmpleados();
}

function ocupados(cargo) {
    return personal.filter(p => p.Cargo === cargo).length;
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
        if (filtro !== "" && p.Cargo !== filtro) return;
        visibles++;
        total += p.Sueldo_base;
        let despido = p.Tabla === "cajero" ? "" : `<button type="button" class="boton-rojo boton-sm" onclick="abrirDespido(${i})"><span class="bi bi-person-x"></span>Despedir</button>`;
        html += `
            <tr>
                <td>${escapar(p.Nombre)}</td>
                <td><span class="cargo">${escapar(p.Cargo)}</span></td>
                <td>${escapar(p.Fecha_nacimiento)}</td>
                <td class="text-end sueldo">${pesos(p.Sueldo_base)}</td>
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

async function contratar() {
    let nombre = document.getElementById("nombreNuevo").value.trim();
    let nacimiento = document.getElementById("nacimientoNuevo").value;
    let cargo = document.getElementById("cargoNuevo").value;
    let sueldo = soloNumeros(document.getElementById("sueldoNuevo").value);

    if (nombre === "" || nacimiento === "" || cargo === "" || !sueldo) {
        aviso("mensajeContratar", "Llena nombre, fecha de nacimiento, cargo y sueldo.", "warning");
        return;
    }

    try {
        await api("/empleados", "POST", { nombre: nombre, fechaNacimiento: nacimiento, cargo: cargo, sueldo: sueldo });
    } catch (error) {
        aviso("mensajeContratar", error.message, "danger");
        return;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalContratar")).hide();
    document.getElementById("nombreNuevo").value = "";
    document.getElementById("nacimientoNuevo").value = "";
    document.getElementById("sueldoNuevo").value = "";
    aviso("mensajeEmpleados", `${nombre} fue contratado como ${cargo}.`);
    await cargarEmpleados();
}

function abrirAumento(indice) {
    seleccionado = indice;
    let p = personal[indice];
    document.getElementById("aumentoNombre").textContent = p.Nombre;
    document.getElementById("aumentoCargo").textContent = p.Cargo;
    document.getElementById("aumentoSueldoActual").textContent = pesos(p.Sueldo_base);
    document.getElementById("porcentajeAumento").value = "";
    document.getElementById("sueldoNuevoAumento").value = "";
    limpiarAviso("mensajeAumento");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAumento")).show();
}

function calcularAumento() {
    let porcentaje = Number(document.getElementById("porcentajeAumento").value.replace(",", "."));
    if (seleccionado !== null && porcentaje > 0) {
        let nuevo = Math.round(personal[seleccionado].Sueldo_base * (1 + porcentaje / 100));
        document.getElementById("sueldoNuevoAumento").value = nuevo.toLocaleString("es-CO");
    }
}

async function aplicarAumento() {
    let sueldo = soloNumeros(document.getElementById("sueldoNuevoAumento").value);
    if (!sueldo) {
        aviso("mensajeAumento", "Escribe el porcentaje o el nuevo sueldo.", "warning");
        return;
    }
    let p = personal[seleccionado];
    try {
        await api("/empleados/aumento", "POST", { tabla: p.Tabla, id: p.Id, sueldo: sueldo });
    } catch (error) {
        aviso("mensajeAumento", error.message, "danger");
        return;
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalAumento")).hide();
    aviso("mensajeEmpleados", `Nuevo sueldo de ${p.Nombre}: ${pesos(sueldo)}.`);
    await cargarEmpleados();
}

function abrirDespido(indice) {
    seleccionado = indice;
    document.getElementById("despidoNombre").textContent = personal[indice].Nombre;
    document.getElementById("despidoCargo").textContent = personal[indice].Cargo;
    limpiarAviso("mensajeDespido");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDespido")).show();
}

async function confirmarDespido() {
    let p = personal[seleccionado];
    try {
        await api("/empleados/" + p.Id, "DELETE");
    } catch (error) {
        aviso("mensajeDespido", error.message, "danger");
        return;
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDespido")).hide();
    aviso("mensajeEmpleados", `${p.Nombre} fue retirado de la nómina.`);
    await cargarEmpleados();
}

async function tablaStock() {
    let stock = await api("/inventario");
    let categoria = "";
    let html = "";
    stock.forEach(s => {
        if (s.Categoria !== categoria) {
            categoria = s.Categoria;
            html += `<tr><td colspan="6" class="grupo-tabla">${escapar(categoria)}</td></tr>`;
        }
        let bajo = s.Minimo !== null && s.Stock < s.Minimo;
        html += `
            <tr>
                <td>${escapar(s.nombre)}</td>
                <td>${escapar(s.unidad)}</td>
                <td class="text-end">${s.Stock}</td>
                <td class="text-end">${s.Minimo ?? "—"}</td>
                <td><span class="${bajo ? "stock-bajo" : "stock-ok"}">${bajo ? "Stock bajo" : "Suficiente"}</span></td>
                <td>${escapar(s.Proveedor || "—")}</td>
            </tr>`;
    });
    document.getElementById("tablaStock").innerHTML = html;
}

async function cargarProveedores() {
    let elegido = document.getElementById("proveedor").value;
    proveedores = await api("/proveedores");
    document.getElementById("proveedor").innerHTML =
        proveedores.map((p, i) => `<option value="${i}">${escapar(p.nombre)}</option>`).join("");
    if (elegido !== "") document.getElementById("proveedor").value = elegido;
    verProveedor();
}

function proveedorActual() {
    return proveedores[Number(document.getElementById("proveedor").value)];
}

function verProveedor() {
    pedido = {};
    document.getElementById("numeroOrden").textContent = "N.° OC-nueva";
    limpiarAviso("mensajeCompra");

    let p = proveedorActual();
    if (!p) return;
    document.getElementById("contactoProveedor").textContent = p.contacto;
    document.getElementById("telefonoProveedor").textContent = p.telefono;
    document.getElementById("ordenProveedor").textContent = p.nombre;

    document.getElementById("productosProveedor").innerHTML = p.productos.map((prod, i) => {
        let bajo = prod.minimo !== null && prod.stock < prod.minimo;
        return `
        <tr>
            <td>${escapar(prod.nombre)}</td>
            <td class="text-end"><span class="${bajo ? "stock-bajo" : "stock-ok"}">${prod.stock} ${escapar(prod.unidad)}</span></td>
            <td class="precio-celda">${pesos(prod.precio)} / ${escapar(prod.unidad)}</td>
            <td>
                <div class="control-cantidad">
                    <button type="button" class="boton-cant" onclick="sumarCompra(${i}, -1)">−</button>
                    <input type="text" class="input-cantidad" id="compra-${i}" value="0" inputmode="numeric" oninput="escribirCompra(${i}, this.value)">
                    <button type="button" class="boton-cant" onclick="sumarCompra(${i}, 1)">+</button>
                </div>
            </td>
        </tr>`;
    }).join("");

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
        let importe = pedido[i] * prod.precio;
        subtotal += importe;
        html += `<tr><td>${escapar(prod.nombre)}</td><td class="text-end">${pedido[i]}</td><td class="text-end">${pesos(importe)}</td></tr>`;
    }
    if (html === "") html = `<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>`;

    document.getElementById("lineasCompra").innerHTML = html;
    document.getElementById("subtotalCompra").textContent = pesos(subtotal);
    document.getElementById("ivaCompra").textContent = pesos(subtotal * IVA_COMPRA);
    document.getElementById("totalCompra").textContent = pesos(subtotal + subtotal * IVA_COMPRA);
}

async function registrarCompra() {
    if (Object.keys(pedido).length === 0) {
        aviso("mensajeCompra", "Agrega al menos un producto a la compra.", "warning");
        return;
    }
    let p = proveedorActual();
    let items = Object.keys(pedido).map(i => ({ idProducto: p.productos[i].id, cantidad: pedido[i] }));

    let boton = document.getElementById("btnRegistrarCompra");
    boton.disabled = true;
    try {
        let respuesta = await api("/compras", "POST", { idProveedor: p.id, items: items });
        let numero = "OC-" + String(respuesta.idOrden).padStart(4, "0");
        await tablaStock();
        proveedores = await api("/proveedores");
        document.getElementById("numeroOrden").textContent = "N.° " + numero;
        aviso("mensajeCompra", "Orden de compra " + numero + " registrada. El stock ya se actualizó.");
        pedido = {};
        document.querySelectorAll("#productosProveedor .input-cantidad").forEach(c => c.value = 0);
    } catch (error) {
        aviso("mensajeCompra", error.message, "danger");
    } finally {
        boton.disabled = false;
    }
}

function nuevaCompra() {
    verProveedor();
}

function imprimirCompra() {
    window.print();
}

iniciar();
