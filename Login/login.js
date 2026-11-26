// El servidor revisa el usuario y la contraseña en las tablas Dueno, Administrativo y Cajero
const vistas = {
    dueno: "../Dueno/dueno.html",
    administrativo: "../Administrador/administrador.html",
    cajero: "../Cajero/cajero.html"
};

async function iniciarSesion(evento) {
    evento.preventDefault();

    let usuario = document.getElementById("usuario").value.trim();
    let contrasena = document.getElementById("contrasena").value;

    try {
        let cuenta = await api("/login", "POST", { usuario: usuario, contrasena: contrasena });
        sessionStorage.setItem("usuario", JSON.stringify(cuenta));
        window.location.href = vistas[cuenta.rol];
    } catch (error) {
        aviso("mensajeLogin", error.message, "danger");
    }
}
