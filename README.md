# PROYECTO_FRANQUICIA_POLLOS — El Broaster del Chef

Sistema web de gestión para una franquicia de pollo a la brasa y broaster.
El proyecto simula las distintas pantallas que usarían los diferentes roles del
negocio (login, cajero, administrador y dueño) además de la carta pública.

Está construido con **HTML, CSS y JavaScript**, apoyándose en **Bootstrap 5.3.3**
y **Bootstrap Icons** cargados por CDN. El JavaScript envía y pide los datos con
peticiones GET y POST. Mientras no exista el servidor, esas peticiones las responde
una simulación en el navegador (ver [JavaScript y API](#javascript-y-api)).

---

## Identidad visual

Todas las pantallas comparten la misma paleta de la franquicia, definida como
variables CSS en cada hoja de estilos:

| Variable    | Color     | Uso principal                        |
|-------------|-----------|--------------------------------------|
| `--rojo`    | `#d62828` | Títulos, acentos, botones de alerta  |
| `--naranja` | `#f77f00` | Bordes superiores, botones primarios |
| `--amarillo`| `#fcbf49` | Subrayados, etiquetas, resaltados    |

El logo (`Recursos/logo.jpg`) aparece en el encabezado de cada pantalla.

---

## Estructura del proyecto

```
PROGRAMA_PROYECTO/
├─ Login/                  Inicio de sesión (envía a cada rol a su pantalla)
│  ├─ login.html
│  ├─ login.js
│  └─ estilos.css
├─ Menu/                   Carta pública de productos (no requiere sesión)
│  ├─ menu.html
│  └─ estilos.css
├─ Cajero/                 Punto de venta / caja
│  ├─ cajero.html
│  ├─ cajero.js
│  └─ estilos.css
├─ Administrador/          Panel operativo del administrador
│  ├─ administrador.html
│  ├─ administrador.js
│  └─ estilos.css
├─ Dueno/                  Panel general del dueño
│  ├─ dueno.html
│  ├─ dueno.js
│  └─ estilos.css
├─ Compartido/             JavaScript común a todas las pantallas
│  ├─ api.js               Configuración, GET/POST, sesión y utilidades
│  └─ simulacion.js        Servidor simulado mientras no exista el backend
├─ BaseDeDatos_Proyecto/   Script de tablas, inserts y modelo relacional (MySQL)
├─ Recursos/               Imágenes del proyecto (logo y fotos del menú)
└─ README.md
```

Cada carpeta tiene su propio `estilos.css` independiente.

---

## Pantallas

### Login (`Login/login.html`)
Tarjeta centrada con logo, campos de usuario y contraseña y botón de inicio de
sesión. Según la cuenta, abre la pantalla del dueño, del administrador o del cajero.

### Menú (`Menu/menu.html`)
Carta pública con barra de navegación por secciones. Los productos se agrupan en
**Pollo broaster, Pollos a la brasa, Complementos, Bebidas y Combos**, cada uno
con su foto (desde `Recursos/`), descripción y precio en pesos. Incluye un pie de
página con datos de contacto de la empresa y enlaces a redes sociales.

### Cajero (`Cajero/cajero.html`)
Punto de venta. Permite:
- Mostrar el **cajero en turno** según la sesión (día o noche) desde una misma página.
- **Registrar o buscar al cliente** por número de identificación (nombre y fecha
  de cumpleaños).
- Elegir productos del menú con control de cantidad (botones **−** y **+**).
- Armar la **factura** con subtotal, IVA y total, y escoger el método de pago.
- **Cerrar caja**: abre un resumen de cierre de turno (ventas e ingresos por
  método de pago) pensado para que el administrador vea el cambio de turno.

### Administrador (`Administrador/administrador.html`)
Panel operativo del día a día. Secciones:
- **Cierres de caja**: resumen por cajero (apertura, cierre, ventas e ingresos)
  y total del día.
- **Observaciones del dueño**: solicitudes de aumento, despido, contratación o
  compra, con opción de marcarlas como atendidas.
- **Empleados**: cupos por cargo (cajeros, meseros, aseo, cocineros), tabla de
  personal con sueldos y acciones de aumento/despido, y total de nómina.
- **Stock de productos en crudo**: inventario por insumo con stock actual,
  mínimo, estado y proveedor.
- **Pedidos a proveedores**.

### Dueño (`Dueno/dueno.html`)
Panel general con navegación por pestañas de Bootstrap. Pestañas:
- **Resumen**: indicadores del día (ventas, pedidos, ticket promedio, empleados)
  y cierres de caja de las cajas.
- **Mi cuenta**: dinero disponible (saldo total, efectivo en caja fuerte y banco)
  y movimientos recientes (ingresos y egresos).
- **Ventas**: comparativa de ambos cajeros, total combinado y detalle de ventas
  registradas en el día.
- **Proveedores**: listado de proveedores y contactos.
- **Inventario**: stock de productos con opción de agregar insumos (modal).
- **Empleados**: registro y consulta de observaciones.

---

## Relación entre roles

El flujo de información pensado para el negocio es:

1. El **cajero** registra ventas y cierra su caja al terminar el turno.
2. El **administrador** revisa los cierres de caja, gestiona empleados y stock, y
   atiende las observaciones que envía el dueño.
3. El **dueño** ve el panorama general: ventas de ambos cajeros, estado de su
   cuenta y observaciones del personal.

Las ventas que registra el cajero aparecen en los cierres del administrador y en
el panel del dueño. Las observaciones que escribe el dueño le llegan al
administrador.

---

## Cómo usarlo

1. Abre la carpeta del proyecto con un servidor local, por ejemplo la extensión
   **Live Server** (clic derecho en `Login/login.html` > *Open with Live Server*).
   Abrir los archivos con doble clic también suele funcionar en Chrome, pero
   algunos navegadores no comparten los datos guardados entre carpetas.
2. Entra con una de estas cuentas (vienen de `inserts_Proyecto.sql`):

| Rol           | Usuario          | Contraseña      |
|---------------|------------------|-----------------|
| Dueño         | `carlos.ramirez` | `Dueno2026*`    |
| Administrador | `laura.mendez`   | `Admin2026*`    |
| Cajero día    | `lucia.torres`   | `Cajero1Dia*`   |
| Cajero noche  | `miguel.soto`    | `Cajero2Noche*` |

Se necesita conexión a internet para cargar Bootstrap y los iconos desde el CDN.

---

## JavaScript y API

`Compartido/api.js` tiene dos funciones que usan todas las pantallas:
`api.get(ruta)` y `api.post(ruta, datos)`. Los datos viajan en JSON con los
mismos nombres de columna de `SCRIPT_Proyecto.sql`.

- `USAR_SIMULACION: true` (valor actual): responde `simulacion.js`, que guarda
  los datos en el `localStorage` del navegador con los registros de los inserts.
  Para volver a los datos iniciales, ejecuta `Simulacion.reiniciar()` en la
  consola del navegador y recarga.
- `USAR_SIMULACION: false`: las peticiones van con `fetch` a `API_URL`
  (`http://localhost:3000/api`). El servidor que se construya debe responder
  estas rutas y guardar en MySQL.

| Método | Ruta | Pantalla | Tabla |
|---|---|---|---|
| POST | `/login` | Login | Dueno, Administrativo, Cajero |
| GET | `/medios-pago` | Cajero | Medio_Pago |
| GET | `/clientes/{id}` | Cajero | Cliente |
| POST | `/clientes` | Cajero | Cliente |
| POST | `/ventas` | Cajero | Venta, Detalle_venta |
| GET | `/ventas?fecha=` | Dueño | Venta, Detalle_venta |
| GET | `/cierres?fecha=` | Cajero, Administrador, Dueño | Turno_cajero, Venta |
| POST | `/turnos` | Cajero (cerrar caja) | Turno_cajero |
| GET | `/cajeros` | Administrador, Dueño | Cajero |
| POST | `/cajeros/{id}/aumento` | Administrador | Cajero |
| GET | `/empleados` | Administrador, Dueño | Empleado |
| POST | `/empleados` | Administrador | Empleado |
| POST | `/empleados/{id}/aumento` | Administrador | Empleado |
| POST | `/empleados/{id}/despido` | Administrador | Empleado |
| GET | `/productos?tipo=` | Administrador, Dueño | Producto, Producto_proveedor |
| POST | `/productos` | Dueño | Producto |
| GET | `/proveedores` | Administrador, Dueño | Proveedor, Producto_proveedor |
| POST | `/ordenes-compra` | Administrador | Orden_compra |
| GET | `/estado-cuenta?usuario=` | Dueño | Estado_cuenta |
| GET | `/observaciones` | Administrador, Dueño | *(falta la tabla)* |
| POST | `/observaciones` | Dueño | *(falta la tabla)* |
| POST | `/observaciones/{id}/atendida` | Administrador | *(falta la tabla)* |

Datos que la interfaz usa pero que todavía no tienen columna en la base de datos:
el precio de venta de cada producto (está en `Cajero/cajero.js`), el stock mínimo
y el precio de compra de los insumos (están en `DATOS_FUERA_DE_BD`, en `api.js`),
el detalle de las órdenes de compra y las observaciones.

La protección de las pantallas por rol es solo de navegación. Cuando exista el
servidor, debe validar el usuario en cada petición.
