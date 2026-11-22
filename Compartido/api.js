// Configuración general del frontend.
// USAR_SIMULACION = true  -> las peticiones las responde simulacion.js (sin servidor).
// USAR_SIMULACION = false -> las peticiones van a API_URL con fetch.
const CONFIG = {
    API_URL: 'http://localhost:3000/api',
    USAR_SIMULACION: true,
    IVA_VENTA: 0.08,
    IVA_COMPRA: 0.19,
    HORARIO_CAJERO: {
        1: { inicio: '08:00:00', fin: '16:00:00', caja: 1, turno: 'Día' },
        2: { inicio: '16:00:00', fin: '23:00:00', caja: 2, turno: 'Noche' }
    },
    LIMITE_CARGO: { Cajero: 2, Mesero: 4, Aseo: 2, Cocinero: 5 }
};

const PAGINA_LOGIN = '../Login/login.html';

const PAGINA_POR_ROL = {
    dueno: '../Dueno/dueno.html',
    administrativo: '../Administrador/administrador.html',
    cajero: '../Cajero/cajero.html'
};

// Datos que la interfaz muestra pero que todavía no tienen columna en la base de datos.
// Clave = Id_producto.
const DATOS_FUERA_DE_BD = {
    stockMinimo: {
        10: 48, 11: 24, 16: 60, 17: 20, 18: 10, 19: 50, 20: 10, 21: 15,
        22: 20, 23: 10, 24: 3, 25: 3, 26: 5, 27: 5, 28: 2, 29: 100
    },
    precioCompra: {
        10: 2500, 11: 5000, 16: 14000, 17: 16000, 18: 9000, 19: 2500, 20: 4000, 21: 5000,
        22: 9000, 23: 3500, 24: 20000, 25: 45000, 26: 30000, 27: 2000, 28: 90000, 29: 600
    }
};

async function peticion(metodo, ruta, datos) {
    if (CONFIG.USAR_SIMULACION) {
        return Simulacion.responder(metodo, ruta, datos);
    }

    const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } };
    if (datos !== undefined) {
        opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch(CONFIG.API_URL + ruta, opciones);
    const cuerpo = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error((cuerpo && cuerpo.mensaje) || `Error ${respuesta.status} en ${ruta}`);
    }
    return cuerpo;
}

const api = {
    get(ruta) {
        return peticion('GET', ruta);
    },
    post(ruta, datos) {
        return peticion('POST', ruta, datos);
    }
};

// La sesión vive en sessionStorage: se borra al cerrar la pestaña.
// Esta protección es solo de navegación; el servidor debe validar cada petición.
const sesion = {
    guardar(datos) {
        sessionStorage.setItem('sesion', JSON.stringify(datos));
    },
    obtener() {
        try {
            return JSON.parse(sessionStorage.getItem('sesion'));
        } catch {
            return null;
        }
    },
    exigir(rol) {
        const actual = this.obtener();
        if (!actual || actual.rol !== rol) {
            window.location.replace(PAGINA_LOGIN);
            return null;
        }
        return actual;
    },
    cerrar() {
        sessionStorage.removeItem('sesion');
        window.location.replace(PAGINA_LOGIN);
    }
};

const util = {
    pesos(valor) {
        return '$ ' + Math.round(valor).toLocaleString('es-CO');
    },
    fechaHoy() {
        const hoy = new Date();
        return [
            hoy.getFullYear(),
            String(hoy.getMonth() + 1).padStart(2, '0'),
            String(hoy.getDate()).padStart(2, '0')
        ].join('-');
    },
    horaActual() {
        const ahora = new Date();
        return [ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()]
            .map((n) => String(n).padStart(2, '0'))
            .join(':');
    },
    fechaCorta(iso) {
        const [anio, mes, dia] = iso.split('-');
        return `${dia}/${mes}/${anio}`;
    },
    hora12(hhmmss) {
        if (!hhmmss) {
            return '—';
        }
        let [horas, minutos] = hhmmss.split(':').map(Number);
        const sufijo = horas >= 12 ? 'p.m.' : 'a.m.';
        horas = horas % 12 || 12;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${sufijo}`;
    },
    escapar(texto) {
        const reemplazos = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(texto ?? '').replace(/[&<>"']/g, (c) => reemplazos[c]);
    },
    separarUnidad(nombreProducto) {
        const partes = nombreProducto.match(/^(.*)\s\((.+)\)$/);
        return partes ? { nombre: partes[1], unidad: partes[2] } : { nombre: nombreProducto, unidad: '' };
    },
    separarContacto(contacto) {
        const [nombre, telefono = '—'] = contacto.split(' - ');
        return { nombre, telefono };
    },
    soloDigitos(texto) {
        return Number(String(texto).replace(/\D/g, '')) || 0;
    },
    agrupar(lista, campo) {
        const grupos = new Map();
        for (const elemento of lista) {
            if (!grupos.has(elemento[campo])) {
                grupos.set(elemento[campo], []);
            }
            grupos.get(elemento[campo]).push(elemento);
        }
        return grupos;
    },
    estadoStock(producto) {
        const minimo = DATOS_FUERA_DE_BD.stockMinimo[producto.Id_producto];
        return { minimo, bajo: minimo !== undefined && producto.Stock < minimo };
    },
    iconoMedio(nombre) {
        if (nombre.startsWith('Efectivo')) {
            return 'bi-cash';
        }
        if (nombre.startsWith('Tarjeta')) {
            return 'bi-credit-card';
        }
        return 'bi-phone';
    },
    alerta(texto, tipo = 'danger') {
        return `<div class="alert alert-${tipo} py-2 mb-0" role="alert">${util.escapar(texto)}</div>`;
    },
    mensaje(contenedor, texto, tipo = 'success') {
        contenedor.innerHTML = util.alerta(texto, tipo);
    },
    limpiarMensaje(contenedor) {
        contenedor.innerHTML = '';
    }
};
