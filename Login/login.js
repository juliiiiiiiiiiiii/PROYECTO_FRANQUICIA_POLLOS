// Cuentas del sistema (mismas de inserts_Proyecto.sql) y la vista que abre cada una
const cuentas = [
    { usuario: "AlbiSteed", contrasena: "Dueno2026*", rol: "dueno", nombre: "Albi steed", vista: "../Dueno/dueno.html" },
    { usuario: "SergioSuarez", contrasena: "Admin2026*", rol: "administrativo", nombre: "Sergio Suarez", vista: "../Administrador/administrador.html" },
    { usuario: "Cajero1", contrasena: "Cajero1Dia*", rol: "cajero", nombre: "Lucía Torres", idCajero: 1, vista: "../Cajero/cajero.html" },
    { usuario: "Cajero2", contrasena: "Cajero2Noche*", rol: "cajero", nombre: "Miguel Soto", idCajero: 2, vista: "../Cajero/cajero.html" }
];

function iniciarSesion(evento) {
    evento.preventDefault();

    let usuario = document.getElementById("usuario").value.trim();
    let contrasena = document.getElementById("contrasena").value;

    let cuenta = cuentas.find(c => c.usuario === usuario && c.contrasena === contrasena);

    if (!cuenta) {
        aviso("mensajeLogin", "Usuario o contraseña incorrectos.", "danger");
        return;
    }

    sessionStorage.setItem("usuario", JSON.stringify({
        usuario: cuenta.usuario,
        nombre: cuenta.nombre,
        rol: cuenta.rol,
        idCajero: cuenta.idCajero
    }));
    window.location.href = cuenta.vista;
}
