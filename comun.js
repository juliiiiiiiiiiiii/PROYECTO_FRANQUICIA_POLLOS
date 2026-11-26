// Funciones que usan todas las pantallas

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

// Devuelve el usuario en sesión si tiene el rol pedido; si no, regresa al login
function usuarioActivo(rol) {
    let usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (!usuario || usuario.rol !== rol) {
        window.location.href = "../Login/login.html";
        return null;
    }
    return usuario;
}

function cerrarSesion() {
    sessionStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}
