const IVA = 0.08;
const turnos = { 1: "Día", 2: "Noche" };
const nombresCajero = { 1: "Lucía Torres (Día)", 2: "Miguel Soto (Noche)" };

const mediosPago = ["Efectivo", "Tarjeta", "Transferencia / Nequi"];

// Menú: [Id_producto, nombre, precio]
const menu = [
    ["Pollo broaster", [[1, "Broaster 8 presas", 50000], [2, "Broaster 4 presas", 28000], [3, "Alitas broaster", 22000]]],
    ["Pollos a la brasa", [[4, "Pollo entero", 52000], [5, "Medio pollo", 30000], [6, "Cuarto de pollo", 17000]]],
    ["Complementos", [[7, "Papas fritas", 8000], [8, "Ensalada fresca", 7000], [9, "Mollejitas", 10000]]],
    ["Bebidas", [[10, "Gaseosa personal", 4500], [11, "Gaseosa 1.5 L", 8000], [12, "Jugo natural", 6000]]],
    ["Combos", [[13, "Combo Familiar", 68000], [14, "Combo Pareja", 40000], [15, "Combo Broaster", 64000]]]
];
const precios = {};
menu.forEach(g => g[1].forEach(p => precios[p[0]] = { nombre: p[1], precio: p[2] }));

const cajero = usuarioActivo("cajero");
let cliente = null;
let cantidades = {};
let miTurno = false;

// El turno activo (1 o 2) se comparte entre los dos cajeros con localStorage. Empieza en el Cajero 1.
function turnoActivo() {
    return Number(localStorage.getItem("cajeroEnTurno") || "1");
}

function iniciar() {
    if (!cajero) return;

    document.getElementById("nombreCajero").textContent = cajero.nombre;
    document.getElementById("turnoCajero").textContent = "· Turno " + turnos[cajero.idCajero];
    document.getElementById("facturaCajero").textContent = cajero.nombre;
    document.getElementById("fechaFactura").textContent = fechaHoy();
    document.getElementById("etiquetaIva").textContent = `IVA (${IVA * 100}%)`;
    document.getElementById("metodoPago").innerHTML = mediosPago.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("");

    dibujarMenu();
    dibujarFactura();
    revisarTurno();
}

// Habilita la caja solo si es el turno de este cajero
function revisarTurno() {
    miTurno = turnoActivo() === cajero.idCajero;

    document.querySelectorAll(".control-cajero").forEach(e => e.disabled = !miTurno);

    if (miTurno) {
        limpiarAviso("mensajeTurno");
    } else {
        aviso("mensajeTurno", "La caja la tiene " + nombresCajero[turnoActivo()] + ". Debes esperar a que cierre su turno y te entregue la caja.", "warning");
    }
}

// ===== Menú =====
function dibujarMenu() {
    let html = "";
    menu.forEach(grupo => {
        html += `<tr><td colspan="3" class="grupo-menu">${grupo[0]}</td></tr>`;
        grupo[1].forEach(p => {
            html += `
                <tr>
                    <td>${p[1]}</td>
                    <td class="precio-celda">${pesos(p[2])}</td>
                    <td>
                        <div class="control-cantidad">
                            <button type="button" class="boton-cant control-cajero" onclick="sumar(${p[0]}, -1)">−</button>
                            <input type="text" class="input-cantidad control-cajero" id="cant-${p[0]}" value="0" inputmode="numeric" oninput="escribir(${p[0]}, this.value)">
                            <button type="button" class="boton-cant control-cajero" onclick="sumar(${p[0]}, 1)">+</button>
                        </div>
                    </td>
                </tr>`;
        });
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

// ===== Factura =====
function dibujarFactura() {
    let html = "";
    let subtotal = 0;

    for (let id in cantidades) {
        let p = precios[id];
        let importe = cantidades[id] * p.precio;
        subtotal += importe;
        html += `<tr><td>${p.nombre}</td><td class="text-end">${cantidades[id]}</td><td class="text-end">${pesos(importe)}</td></tr>`;
    }
    if (html === "") html = `<tr><td colspan="3" class="text-muted">Aún no hay productos.</td></tr>`;

    document.getElementById("lineasFactura").innerHTML = html;
    document.getElementById("subtotalFactura").textContent = pesos(subtotal);
    document.getElementById("ivaFactura").textContent = pesos(subtotal * IVA);
    document.getElementById("totalFactura").textContent = pesos(subtotal + subtotal * IVA);

    document.getElementById("facturaCliente").textContent = cliente ? cliente.nombre : "(sin seleccionar)";
    document.getElementById("facturaDocumento").textContent = cliente ? cliente.id : "—";
}

// ===== Cliente =====
function buscarCliente() {
    let id = soloNumeros(document.getElementById("idCliente").value);
    if (!id) {
        aviso("mensajeCliente", "Escribe el número de identificación.", "warning");
        return;
    }
    let nombre = document.getElementById("nombreCliente").value.trim() || "Cliente " + id;
    document.getElementById("nombreCliente").value = nombre;
    cliente = { id: id, nombre: nombre };
    aviso("mensajeCliente", "Cliente seleccionado: " + nombre + ".");
    dibujarFactura();
}

function registrarCliente() {
    let id = soloNumeros(document.getElementById("idCliente").value);
    let nombre = document.getElementById("nombreCliente").value.trim();
    let cumple = document.getElementById("cumpleCliente").value;

    if (!id || nombre === "" || cumple === "") {
        aviso("mensajeCliente", "Para registrar llena identificación, nombre y fecha de cumpleaños.", "warning");
        return;
    }
    cliente = { id: id, nombre: nombre };
    aviso("mensajeCliente", "Cliente " + nombre + " registrado.");
    dibujarFactura();
}

// ===== Venta =====
function registrarVenta() {
    if (!cliente) {
        aviso("mensajeVenta", "Busca o registra al cliente antes de la venta.", "warning");
        return;
    }
    if (Object.keys(cantidades).length === 0) {
        aviso("mensajeVenta", "Agrega al menos un producto.", "warning");
        return;
    }

    let numero = Number(localStorage.getItem("ultimaFactura") || "0") + 1;
    localStorage.setItem("ultimaFactura", numero);

    document.getElementById("numeroFactura").textContent = "N.° " + String(numero).padStart(4, "0");
    aviso("mensajeVenta", "Venta N.° " + numero + " registrada. Imprime la factura o empieza una nueva.");
}

function nuevaVenta() {
    cliente = null;
    cantidades = {};
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

// ===== Cierre de caja =====
function abrirCierre() {
    document.getElementById("cierreCajero").textContent = cajero.nombre;
    document.getElementById("cierreFecha").textContent = fechaHoy();
    document.getElementById("cierreHora").textContent = horaAhora();
    limpiarAviso("mensajeCierre");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCierre")).show();
}

function confirmarCierre() {
    // Entrega la caja al otro cajero y cierra la sesión
    let siguiente = cajero.idCajero === 1 ? 2 : 1;
    localStorage.setItem("cajeroEnTurno", siguiente);
    aviso("mensajeCierre", "Caja cerrada. La caja queda para " + nombresCajero[siguiente] + ".");
    setTimeout(cerrarSesion, 2500);
}

iniciar();
