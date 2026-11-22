(() => {
    const activa = sesion.obtener();
    if (activa && PAGINA_POR_ROL[activa.rol]) {
        window.location.replace(PAGINA_POR_ROL[activa.rol]);
        return;
    }

    const formulario = document.getElementById('formLogin');
    const mensaje = document.getElementById('mensajeLogin');
    const boton = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        util.limpiarMensaje(mensaje);

        const usuario = document.getElementById('usuario').value.trim();
        const contrasena = document.getElementById('contrasena').value;

        if (!usuario || !contrasena) {
            util.mensaje(mensaje, 'Ingresa tu usuario y tu contraseña.', 'warning');
            return;
        }

        boton.disabled = true;
        try {
            const cuenta = await api.post('/login', { usuario, contrasena });
            sesion.guardar(cuenta);
            window.location.replace(PAGINA_POR_ROL[cuenta.rol]);
        } catch (error) {
            util.mensaje(mensaje, error.message, 'danger');
            boton.disabled = false;
        }
    });
})();
