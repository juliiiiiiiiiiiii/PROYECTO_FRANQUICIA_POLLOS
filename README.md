# PROYECTO_FRANQUICIA_POLLOS — El Broaster del Chef

Sistema web de gestión para una franquicia de pollo a la brasa y broaster.
El proyecto simula las distintas pantallas que usarían los diferentes roles del
negocio (login, cajero, administrador y dueño) además de la carta pública.

Está construido únicamente con **HTML y CSS**, apoyándose en **Bootstrap 5.3.3**
y **Bootstrap Icons** cargados por CDN. No incluye JavaScript propio ni backend,
por lo que los datos (ventas, montos, empleados, stock) son de ejemplo y los
formularios todavía no guardan información.

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
├─ Login/            Inicio de sesión
│  ├─ login.html
│  └─ estilos.css
├─ Menu/             Carta pública de productos
│  ├─ menu.html
│  └─ estilos.css
├─ Cajero/           Punto de venta / caja
│  ├─ cajero.html
│  └─ estilos.css
├─ Administrador/    Panel operativo del administrador
│  ├─ administrador.html
│  └─ estilos.css
├─ Dueno/            Panel general del dueño
│  ├─ dueno.html
│  └─ estilos.css
├─ Recursos/         Imágenes del proyecto (logo y fotos del menú)
└─ README.md
```

Cada carpeta tiene su propio `estilos.css` independiente.

---

## Pantallas

### Login (`Login/login.html`)
Acceso administrativo. Tarjeta centrada con logo, campos de usuario y contraseña
y botón de inicio de sesión.

### Menú (`Menu/menu.html`)
Carta pública con barra de navegación por secciones. Los productos se agrupan en
**Pollo broaster, Pollos a la brasa, Complementos, Bebidas y Combos**, cada uno
con su foto (desde `Recursos/`), descripción y precio en pesos. Incluye un pie de
página con datos de contacto de la empresa y enlaces a redes sociales.

### Cajero (`Cajero/cajero.html`)
Punto de venta. Permite:
- Seleccionar el **cajero en turno** (Cajero 1 / Cajero 2) desde una misma página.
- **Registrar o buscar al cliente** por número de identificación (nombre,
  teléfono, dirección, correo y fecha de cumpleaños).
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

> Nota: al ser un proyecto solo de HTML y CSS, esta comunicación entre pantallas
> es visual (datos de ejemplo). Para que las acciones de una pantalla se reflejen
> de verdad en otra haría falta agregar JavaScript (por ejemplo con
> `localStorage`) o un backend con base de datos.

---

## Cómo usarlo

No requiere instalación ni servidor. Basta con abrir cualquiera de los archivos
`.html` en un navegador (se recomienda empezar por `Login/login.html`).
Se necesita conexión a internet para cargar Bootstrap y los iconos desde el CDN.
