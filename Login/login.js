// Credenciales de cada rol (las mismas de inserts_Proyecto.sql) y la vista que abre cada una
const usuarios = [
    { usuario: "AlbiSteed", contrasena: "Dueno2026*", rol: "dueno", nombre: "Albi Steed", vista: "../Dueno/dueno.html" },
    { usuario: "SergioSuarez", contrasena: "Admin2026*", rol: "administrativo", nombre: "Sergio Suarez", vista: "../Administrador/administrador.html" },
    { usuario: "Cajero1", contrasena: "Cajero1Dia*", rol: "cajero", nombre: "Lucía Torres", idCajero: 1, vista: "../Cajero/cajero.html" },
    { usuario: "Cajero2", contrasena: "Cajero2Noche*", rol: "cajero", nombre: "Miguel Soto", idCajero: 2, vista: "../Cajero/cajero.html" }
];

function iniciarSesion(evento) {
    evento.preventDefault();

    let usuario = document.getElementById("usuario").value.trim();
    let contrasena = document.getElementById("contrasena").value;
    let mensaje = document.getElementById("mensajeLogin");

    for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].usuario === usuario && usuarios[i].contrasena === contrasena) {
            // Se guarda quién entró para que la vista sepa su nombre y su rol
            sessionStorage.setItem("usuario", JSON.stringify({
                usuario: usuarios[i].usuario,
                nombre: usuarios[i].nombre,
                rol: usuarios[i].rol,
                idCajero: usuarios[i].idCajero
            }));
            window.location.href = usuarios[i].vista;
            return;
        }
    }

    mensaje.innerHTML = `<div class="alert alert-danger py-2 mb-0">Usuario o contraseña incorrectos.</div>`;
}
