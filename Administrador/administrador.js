const IVA_COMPRA = 0.19;

// Máximo de personas por cargo
const limites = { Cajero: 2, Mesero: 4, Aseo: 2, Cocinero: 5 };

const cargos = [
    ["Cajero", "Cajeros", "bi-person-badge"],
    ["Mesero", "Meseros", "bi-cup-hot"],
    ["Aseo", "Aseo", "bi-stars"],
    ["Cocinero", "Cocineros", "bi-fire"]
];

// Clase e ícono de cada tipo de observación
const tiposObservacion = {
    "Aumento": ["tipo-aumento", "bi-graph-up-arrow"],
    "Despido": ["tipo-despido", "bi-person-x"],
    "Contratación": ["tipo-contratacion", "bi-person-plus"],
    "Compra": ["tipo-compra", "bi-cart"]
};

// Datos que la tabla Producto todavía no tiene. Clave = Id_producto.
const stockMinimo = {
    10: 48, 11: 24, 16: 60, 17: 20, 18: 10, 19: 50, 20: 10, 21: 15,
    22: 20, 23: 10, 24: 3, 25: 3, 26: 5, 27: 5, 28: 2, 29: 100
};
const precioCompra = {
    10: 2500, 11: 5000, 16: 14000, 17: 16000, 18: 9000, 19: 2500, 20: 4000, 21: 5000,
    22: 9000, 23: 3500, 24: 20000, 25: 45000, 26: 30000, 27: 2000, 28: 90000, 29: 600
};

let admin = JSON.parse(sessionStorage.getItem("usuario"));
let personal = [];
let seleccionado = null;
let proveedores = [];
let pedido = {};
let compraRegistrada = false;

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

// "Papa (kg)" -> nombre "Papa" y unidad "kg"
function separarUnidad(nombreProducto) {
    let partes = nombreProducto.match(/^(.*)\s\((.+)\)$/);
    if (partes) {
        return { nombre: partes[1], unidad: partes[2] };
    }
    return { nombre: nombreProducto, unidad: "und" };
}

// "Juan Medina - 987 654 321" -> nombre y teléfono
function separarContacto(contacto) {
    let partes = contacto.split(" - ");
    return { nombre: partes[0], telefono: partes[1] || "—" };
}

function stockBajo(producto) {
    let minimo = stockMinimo[producto.Id_producto];
    return minimo !== undefined && producto.Stock < minimo;
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

function abrirModal(id) {
    bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).show();
}

function cerrarModal(id) {
    bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).hide();
}

// ===== Inicio de la página =====
function iniciarPagina() {
    if (!admin || admin.rol !== "administrativo") {
        window.location.href = "../Login/login.html";
        return;
    }

    document.getElementById("nombreAdmin").textContent = admin.nombre;
    document.getElementById("fechaCierre").value = fechaHoy();
    document.getElementById("fechaOrden").textContent = fechaCorta(fechaHoy());
    document.getElementById("ordenSolicita").textContent = admin.nombre;
    document.getElementById("etiquetaIvaCompra").textContent = `IVA (${IVA_COMPRA * 100}%)`;

    cargarCierres();
    cargarObservaciones();
    cargarPersonal();
    cargarStock();
    cargarProveedores();
}

// ===== Cierres de caja =====
function filaCierre(icono, etiqueta, valor) {
    return `
        <div class="fila-cierre">
            <span><span class="bi ${icono} me-2"></span>${etiqueta}</span>
            <strong>${valor}</strong>
        </div>
    `;
}

async function cargarCierres() {
    let fecha = document.getElementById("fechaCierre").value || fechaHoy();
    const respuesta = await fetch("/cierres?fecha=" + fecha);
    const cierres = await respuesta.json();

    let html = "";
    let totalDia = 0;
    let ventasDia = 0;

    for (let i = 0; i < cierres.length; i++) {
        let c = cierres[i];
        totalDia += c.Total;
        ventasDia += c.Num_ventas;

        let medios = "";
        for (let j = 0; j < c.Por_medio.length; j++) {
            let m = c.Por_medio[j];
            medios += filaCierre(iconoMedio(m.Medio_pago), m.Medio_pago, formatoPesos(m.Total));
        }

        html += `
            <div class="col-12 col-md-6">
                <div class="tarjeta-cierre">
                    <div class="cabecera-cierre">
                        <h3><span class="bi bi-person-badge me-2"></span>Cajero ${c.Id_cajero}</h3>
                        <span class="${c.Cerrado ? "estado-ok" : "estado-pendiente"}">${c.Cerrado ? "Recibido" : "Turno abierto"}</span>
                    </div>
                    ${filaCierre("bi-person", "Responsable", c.Cajero)}
                    ${filaCierre("bi-clock-history", "Apertura", hora12(c.Hora_inicio))}
                    ${filaCierre("bi-clock", "Cierre", c.Cerrado ? hora12(c.Hora_fin) : "Pendiente")}
                    ${filaCierre("bi-receipt", "N.° de ventas", c.Num_ventas)}
                    ${medios}
                    <div class="fila-cierre total-cierre">
                        <span>Total del turno</span>
                        <strong>${formatoPesos(c.Total)}</strong>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById("tarjetasCierre").innerHTML = html;
    document.getElementById("ventasDia").textContent = ventasDia;
    document.getElementById("totalDia").textContent = formatoPesos(totalDia);
}

// ===== Observaciones del dueño =====
async function cargarObservaciones() {
    const respuesta = await fetch("/observaciones");
    const lista = await respuesta.json();

    let html = "";
    let pendientes = 0;

    for (let i = 0; i < lista.length; i++) {
        let o = lista[i];
        let tipo = tiposObservacion[o.Tipo] || ["tipo-compra", "bi-chat-left-text"];

        if (!o.Atendida) {
            pendientes++;
        }

        let boton = "";
        if (!o.Atendida) {
            boton = `
                <button type="button" class="boton-naranja boton-sm" onclick="marcarAtendida(${o.Id_observacion})">
                    <span class="bi bi-check2-circle"></span>Marcar como atendida
                </button>
            `;
        }

        html += `
            <div class="observacion${o.Atendida ? " atendida" : ""}">
                <div class="cabecera-observacion">
                    <span class="${tipo[0]}"><span class="bi ${tipo[1]} me-1"></span>${o.Tipo}</span>
                    <small>${fechaCorta(o.Fecha)} · Sobre: <strong>${o.Sobre}</strong></small>
                    <span class="${o.Atendida ? "estado-ok" : "estado-pendiente"} ms-auto">${o.Atendida ? "Atendida" : "Pendiente"}</span>
                </div>
                <p class="${o.Atendida ? "mb-0" : "mb-2"}">${o.Texto}</p>
                ${boton}
            </div>
        `;
    }

    if (lista.length === 0) {
        html = `<p class="text-muted mb-0">No hay observaciones del dueño.</p>`;
    }

    document.getElementById("listaObservaciones").innerHTML = html;
    document.getElementById("contadorObservaciones").textContent = pendientes + (pendientes === 1 ? " pendiente" : " pendientes");
}

async function marcarAtendida(id) {
    await fetch("/observaciones/" + id + "/atendida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });

    await cargarObservaciones();
}

// ===== Empleados =====
async function cargarPersonal() {
    const respuestaCajeros = await fetch("/cajeros");
    const cajeros = await respuestaCajeros.json();
    const respuestaEmpleados = await fetch("/empleados");
    const empleados = await respuestaEmpleados.json();

    personal = [];

    for (let i = 0; i < cajeros.length; i++) {
        let c = cajeros[i];
        personal.push({
            tipo: "cajero", id: c.Id_Cajero, Nombre: c.Nombre, Cargo: "Cajero",
            Etiqueta: "Cajero " + c.Id_Cajero, Fecha_nacimiento: c.Fecha_nacimiento, Sueldo_base: Number(c.Sueldo_base)
        });
    }

    for (let i = 0; i < empleados.length; i++) {
        let e = empleados[i];
        personal.push({
            tipo: "empleado", id: e.Id_Empleado, Nombre: e.Nombre, Cargo: e.Cargo,
            Etiqueta: e.Cargo, Fecha_nacimiento: e.Fecha_nacimiento, Sueldo_base: Number(e.Sueldo_base)
        });
    }

    crearCupos();
    crearTablaEmpleados();
}

function ocupados(cargo) {
    let cantidad = 0;
    for (let i = 0; i < personal.length; i++) {
        if (personal[i].Cargo === cargo) {
            cantidad++;
        }
    }
    return cantidad;
}

function crearCupos() {
    let html = "";

    for (let i = 0; i < cargos.length; i++) {
        let cargo = cargos[i][0];
        let plural = cargos[i][1];
        let icono = cargos[i][2];
        let limite = limites[cargo];
        let usados = ocupados(cargo);
        let libres = limite - usados;

        let etiqueta = libres <= 0 ? "Cupo completo" : libres + (libres === 1 ? " disponible" : " disponibles");

        html += `
            <div class="col-6 col-lg-3">
                <div class="cupo${libres <= 0 ? " completo" : ""}">
                    <span class="bi ${icono} icono-cupo"></span>
                    <p class="nombre-cupo">${plural}</p>
                    <p class="numero-cupo">${usados} / ${limite}</p>
                    <span class="etiqueta-cupo">${etiqueta}</span>
                </div>
            </div>
        `;
    }

    document.getElementById("cuposCargo").innerHTML = html;
}

function crearTablaEmpleados() {
    let filtro = document.getElementById("filtroCargo").value;
    let html = "";
    let total = 0;
    let cantidad = 0;

    for (let i = 0; i < personal.length; i++) {
        let p = personal[i];
        if (filtro !== "" && p.Cargo !== filtro) {
            continue;
        }

        cantidad++;
        total += p.Sueldo_base;

        let botonDespido = "";
        if (p.tipo === "empleado") {
            botonDespido = `
                <button type="button" class="boton-rojo boton-sm" onclick="abrirDespido(${i})">
                    <span class="bi bi-person-x"></span>Despedir
                </button>
            `;
        }

        html += `
            <tr>
                <td>${p.Nombre}</td>
                <td><span class="cargo">${p.Etiqueta}</span></td>
                <td>${fechaCorta(p.Fecha_nacimiento)}</td>
                <td class="text-end sueldo">${formatoPesos(p.Sueldo_base)}</td>
                <td class="acciones">
                    <button type="button" class="boton-naranja boton-sm" onclick="abrirAumento(${i})">
                        <span class="bi bi-graph-up-arrow"></span>Aumento
                    </button>
                    ${botonDespido}
                </td>
            </tr>
        `;
    }

    if (cantidad === 0) {
        html = `<tr><td colspan="5" class="text-muted">No hay empleados con ese cargo.</td></tr>`;
    }

    document.getElementById("tablaEmpleados").innerHTML = html;
    document.getElementById("etiquetaNomina").textContent = `Total nómina mensual (${cantidad} ${cantidad === 1 ? "empleado" : "empleados"})`;
    document.getElementById("totalNomina").textContent = formatoPesos(total);
}

// Contratar
function abrirContratar() {
    limpiarMensaje("mensajeContratar");

    let html = `<option value="">Selecciona un cargo</option>`;
    for (let i = 0; i < cargos.length; i++) {
        let cargo = cargos[i][0];
        let limite = limites[cargo];
        let usados = ocupados(cargo);
        let bloqueado = cargo === "Cajero" || usados >= limite;
        let detalle = usados >= limite ? `cupo completo ${usados}/${limite}` : `${usados}/${limite}`;
        html += `<option value="${cargo}" ${bloqueado ? "disabled" : ""}>${cargo} (${detalle})</option>`;
    }
    document.getElementById("cargoNuevo").innerHTML = html;

    abrirModal("modalContratar");
}

async function contratarEmpleado() {
    let nuevo = {
        Nombre: document.getElementById("nombreNuevo").value.trim(),
        Fecha_nacimiento: document.getElementById("nacimientoNuevo").value,
        Cargo: document.getElementById("cargoNuevo").value,
        Sueldo_base: soloNumeros(document.getElementById("sueldoNuevo").value),
        Administrativo_Usuario: admin.usuario
    };

    if (nuevo.Nombre === "" || nuevo.Fecha_nacimiento === "" || nuevo.Cargo === "" || !nuevo.Sueldo_base) {
        mostrarMensaje("mensajeContratar", "Llena nombre, fecha de nacimiento, cargo y sueldo.", "warning");
        return;
    }

    const respuesta = await fetch("/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo)
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeContratar", datos.mensaje || "No se pudo contratar al empleado.", "danger");
        return;
    }

    cerrarModal("modalContratar");
    document.getElementById("nombreNuevo").value = "";
    document.getElementById("nacimientoNuevo").value = "";
    document.getElementById("sueldoNuevo").value = "";
    mostrarMensaje("mensajeEmpleados", `${nuevo.Nombre} fue contratado como ${nuevo.Cargo}.`);

    await cargarPersonal();
}

// Aumento
function abrirAumento(indice) {
    seleccionado = personal[indice];
    document.getElementById("aumentoNombre").textContent = seleccionado.Nombre;
    document.getElementById("aumentoCargo").textContent = seleccionado.Etiqueta;
    document.getElementById("aumentoSueldoActual").textContent = formatoPesos(seleccionado.Sueldo_base);
    document.getElementById("porcentajeAumento").value = "";
    document.getElementById("sueldoNuevoAumento").value = "";
    limpiarMensaje("mensajeAumento");
    abrirModal("modalAumento");
}

function calcularAumento() {
    let porcentaje = Number(document.getElementById("porcentajeAumento").value.replace(",", "."));
    if (seleccionado && porcentaje > 0) {
        let nuevo = Math.round(seleccionado.Sueldo_base * (1 + porcentaje / 100));
        document.getElementById("sueldoNuevoAumento").value = nuevo.toLocaleString("es-CO");
    }
}

async function aplicarAumento() {
    let sueldo = soloNumeros(document.getElementById("sueldoNuevoAumento").value);

    if (!sueldo) {
        mostrarMensaje("mensajeAumento", "Escribe el porcentaje o el nuevo sueldo.", "warning");
        return;
    }

    let ruta = "/empleados/" + seleccionado.id + "/aumento";
    if (seleccionado.tipo === "cajero") {
        ruta = "/cajeros/" + seleccionado.id + "/aumento";
    }

    const respuesta = await fetch(ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Sueldo_base: sueldo })
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeAumento", datos.mensaje || "No se pudo aplicar el aumento.", "danger");
        return;
    }

    cerrarModal("modalAumento");
    mostrarMensaje("mensajeEmpleados", `Nuevo sueldo de ${seleccionado.Nombre}: ${formatoPesos(sueldo)}.`);
    await cargarPersonal();
}

// Despido
function abrirDespido(indice) {
    seleccionado = personal[indice];
    document.getElementById("despidoNombre").textContent = seleccionado.Nombre;
    document.getElementById("despidoCargo").textContent = seleccionado.Etiqueta;
    limpiarMensaje("mensajeDespido");
    abrirModal("modalDespido");
}

async function confirmarDespido() {
    const respuesta = await fetch("/empleados/" + seleccionado.id + "/despido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeDespido", datos.mensaje || "No se pudo despedir al empleado.", "danger");
        return;
    }

    cerrarModal("modalDespido");
    mostrarMensaje("mensajeEmpleados", `${seleccionado.Nombre} fue retirado de la nómina.`);
    await cargarPersonal();
}

// ===== Stock =====
async function cargarStock() {
    const respuesta = await fetch("/productos?tipo=Insumo,Reventa");
    const productos = await respuesta.json();

    let html = "";
    let categoriaActual = "";

    for (let i = 0; i < productos.length; i++) {
        let p = productos[i];

        if (p.Categoria !== categoriaActual) {
            categoriaActual = p.Categoria;
            html += `<tr><td colspan="6" class="grupo-tabla">${categoriaActual}</td></tr>`;
        }

        let producto = separarUnidad(p.Nombre_producto);
        let bajo = stockBajo(p);
        let minimo = stockMinimo[p.Id_producto];

        html += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.unidad}</td>
                <td class="text-end">${p.Stock}</td>
                <td class="text-end">${minimo !== undefined ? minimo : "—"}</td>
                <td><span class="${bajo ? "stock-bajo" : "stock-ok"}">${bajo ? "Stock bajo" : "Suficiente"}</span></td>
                <td>${p.Proveedores || "—"}</td>
            </tr>
        `;
    }

    document.getElementById("tablaStock").innerHTML = html;
}

// ===== Pedidos a proveedores =====
async function cargarProveedores() {
    const respuesta = await fetch("/proveedores");
    const lista = await respuesta.json();

    proveedores = [];
    let html = "";

    for (let i = 0; i < lista.length; i++) {
        if (lista[i].Productos.length > 0) {
            proveedores.push(lista[i]);
            html += `<option value="${lista[i].Id_proveedor}">${lista[i].Nombre_proveedor}</option>`;
        }
    }

    document.getElementById("proveedor").innerHTML = html;
    seleccionarProveedor();
}

function proveedorActual() {
    let id = Number(document.getElementById("proveedor").value);
    for (let i = 0; i < proveedores.length; i++) {
        if (proveedores[i].Id_proveedor === id) {
            return proveedores[i];
        }
    }
    return null;
}

function seleccionarProveedor() {
    nuevaCompra();

    let proveedor = proveedorActual();
    if (!proveedor) {
        return;
    }

    let contacto = separarContacto(proveedor.Contacto);
    document.getElementById("contactoProveedor").textContent = contacto.nombre;
    document.getElementById("telefonoProveedor").textContent = contacto.telefono;
    document.getElementById("ordenProveedor").textContent = proveedor.Nombre_proveedor;

    let html = "";
    for (let i = 0; i < proveedor.Productos.length; i++) {
        let p = proveedor.Productos[i];
        let producto = separarUnidad(p.Nombre_producto);
        let bajo = stockBajo(p);

        html += `
            <tr>
                <td>${producto.nombre}</td>
                <td class="text-end"><span class="${bajo ? "stock-bajo" : "stock-ok"}">${p.Stock} ${producto.unidad}</span></td>
                <td class="precio-celda">${formatoPesos(precioCompra[p.Id_producto] || 0)} / ${producto.unidad}</td>
                <td>
                    <div class="control-cantidad">
                        <button type="button" class="boton-cant" onclick="cambiarCantidadCompra(${p.Id_producto}, -1)" aria-label="Restar ${producto.nombre}"><span class="bi bi-dash-lg"></span></button>
                        <input type="text" class="input-cantidad" id="compra-${p.Id_producto}" value="0" inputmode="numeric" oninput="escribirCantidadCompra(${p.Id_producto}, this.value)" aria-label="Cantidad de ${producto.nombre}">
                        <button type="button" class="boton-cant" onclick="cambiarCantidadCompra(${p.Id_producto}, 1)" aria-label="Sumar ${producto.nombre}"><span class="bi bi-plus-lg"></span></button>
                    </div>
                </td>
            </tr>
        `;
    }

    document.getElementById("productosProveedor").innerHTML = html;
    actualizarCompra();
}

function nuevaCompra() {
    compraRegistrada = false;
    pedido = {};
    document.getElementById("btnRegistrarCompra").disabled = false;
    document.getElementById("numeroOrden").textContent = "N.° OC-nueva";
    limpiarMensaje("mensajeCompra");

    let campos = document.querySelectorAll("#productosProveedor .input-cantidad");
    for (let i = 0; i < campos.length; i++) {
        campos[i].value = 0;
    }
}

function cambiarCantidadCompra(id, paso) {
    if (compraRegistrada) {
        nuevaCompra();
    }
    ponerCantidadCompra(id, (pedido[id] || 0) + paso);
}

function escribirCantidadCompra(id, valor) {
    let cantidad = soloNumeros(valor);
    if (compraRegistrada) {
        nuevaCompra();
    }
    ponerCantidadCompra(id, cantidad);
}

function ponerCantidadCompra(id, cantidad) {
    if (cantidad < 0) {
        cantidad = 0;
    }
    if (cantidad > 999) {
        cantidad = 999;
    }

    if (cantidad === 0) {
        delete pedido[id];
    } else {
        pedido[id] = cantidad;
    }

    document.getElementById("compra-" + id).value = cantidad;
    actualizarCompra();
}

function lineasCompra() {
    let proveedor = proveedorActual();
    let lineas = [];
    if (!proveedor) {
        return lineas;
    }

    for (let i = 0; i < proveedor.Productos.length; i++) {
        let p = proveedor.Productos[i];
        if (pedido[p.Id_producto]) {
            lineas.push({
                id: p.Id_producto,
                nombre: p.Nombre_producto,
                cantidad: pedido[p.Id_producto],
                precio: precioCompra[p.Id_producto] || 0
            });
        }
    }
    return lineas;
}

function actualizarCompra() {
    let lineas = lineasCompra();
    let subtotal = 0;
    let html = "";

    for (let i = 0; i < lineas.length; i++) {
        let l = lineas[i];
        subtotal += l.cantidad * l.precio;
        html += `
            <tr>
                <td>${l.nombre}</td>
                <td class="text-end">${l.cantidad}</td>
                <td class="text-end">${formatoPesos(l.cantidad * l.precio)}</td>
            </tr>
        `;
    }

    if (lineas.length === 0) {
        html = `<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>`;
    }

    let iva = subtotal * IVA_COMPRA;
    document.getElementById("lineasCompra").innerHTML = html;
    document.getElementById("subtotalCompra").textContent = formatoPesos(subtotal);
    document.getElementById("ivaCompra").textContent = formatoPesos(iva);
    document.getElementById("totalCompra").textContent = formatoPesos(subtotal + iva);
}

async function registrarCompra() {
    let lineas = lineasCompra();

    if (lineas.length === 0) {
        mostrarMensaje("mensajeCompra", "Agrega al menos un producto a la compra.", "warning");
        return;
    }

    let detalle = [];
    for (let i = 0; i < lineas.length; i++) {
        detalle.push({ Id_producto: lineas[i].id, Cantidad: lineas[i].cantidad, Precio_unitario: lineas[i].precio });
    }

    let boton = document.getElementById("btnRegistrarCompra");
    boton.disabled = true;

    const respuesta = await fetch("/ordenes-compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            Fecha_comision: fechaHoy(),
            Id_proveedor: proveedorActual().Id_proveedor,
            detalle: detalle
        })
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        mostrarMensaje("mensajeCompra", datos.mensaje || "No se pudo registrar la compra.", "danger");
        boton.disabled = false;
        return;
    }

    compraRegistrada = true;
    let numero = "OC-" + String(datos.Id_Orden_compra).padStart(4, "0");
    document.getElementById("numeroOrden").textContent = "N.° " + numero;
    mostrarMensaje("mensajeCompra", "Orden de compra " + numero + " registrada.");
}

function imprimirCompra() {
    window.print();
}

function cerrarSesion() {
    sessionStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}

iniciarPagina();
