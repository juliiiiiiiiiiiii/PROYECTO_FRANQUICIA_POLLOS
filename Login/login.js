// Cuentas del sistema (mismas de inserts_Proyecto.sql) y la vista que abre cada una
const cuentas = [
    { usuario: "carlos.ramirez", contrasena: "Dueno2026*", rol: "dueno", nombre: "Carlos Ramírez", vista: "../Dueno/dueno.html" },
    { usuario: "laura.mendez", contrasena: "Admin2026*", rol: "administrativo", nombre: "Laura Méndez", vista: "../Administrador/administrador.html" },
    { usuario: "lucia.torres", contrasena: "Cajero1Dia*", rol: "cajero", nombre: "Lucía Torres", idCajero: 1, vista: "../Cajero/cajero.html" },
    { usuario: "miguel.soto", contrasena: "Cajero2Noche*", rol: "cajero", nombre: "Miguel Soto", idCajero: 2, vista: "../Cajero/cajero.html" }
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
