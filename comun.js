function pesos(valor) {
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

function horaAhora() {
    let ahora = new Date();
    let h = String(ahora.getHours()).padStart(2, "0");
    let m = String(ahora.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

function aviso(id, texto, tipo = "success") {
    let caja = document.getElementById(id);
    caja.innerHTML = `<div class="alert alert-${tipo} py-2 mb-0" role="alert"></div>`;
    caja.firstChild.textContent = texto;
}

function limpiarAviso(id) {
    document.getElementById(id).innerHTML = "";
}

function escapar(texto) {
    let reemplazos = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto ?? "").replace(/[&<>"']/g, c => reemplazos[c]);
}

function horaCorta(hora) {
    return hora ? String(hora).slice(0, 5) : "";
}

async function api(ruta, metodo = "GET", datos) {
    let usuario = JSON.parse(sessionStorage.getItem("usuario"));
    let opciones = { method: metodo, headers: { "Content-Type": "application/json" } };
    if (usuario && usuario.token) opciones.headers.Authorization = "Bearer " + usuario.token;
    if (datos !== undefined) opciones.body = JSON.stringify(datos);

    let respuesta;
    try {
        respuesta = await fetch("/api" + ruta, opciones);
    } catch {
        throw new Error("No hay conexión con el servidor. Revisa que esté encendido (npm start).");
    }
    let cuerpo = await respuesta.json().catch(() => ({}));

    if (respuesta.status === 401 && ruta !== "/login") {
        sessionStorage.removeItem("usuario");
        window.location.href = "../Login/login.html";
    }
    if (!respuesta.ok) throw new Error(cuerpo.mensaje || "Error " + respuesta.status);
    return cuerpo;
}

function usuarioActivo(rol) {
    let usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (!usuario || usuario.rol !== rol || !usuario.token) {
        window.location.href = "../Login/login.html";
        return null;
    }
    return usuario;
}

async function cerrarSesion() {
    await api("/logout", "POST").catch(() => {});
    sessionStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}
