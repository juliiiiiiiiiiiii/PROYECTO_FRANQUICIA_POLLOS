# El Broaster del Chef

Programa para manejar una pollería. Según quién inicie sesión, el programa abre la pantalla que le toca: cajero, administrador o dueño.

## Qué puede hacer cada quien

**Cajero** (atiende la caja)
- Busca o registra al cliente.
- Arma la factura con los productos del menú y cobra.
- Si es el cumpleaños del cliente, no le cobra el IVA.
- Cierra su caja al terminar el turno y se la deja al siguiente cajero.

**Administrador** (maneja el negocio por dentro)
- Ve cuánto vendió cada cajero en el día.
- Contrata empleados, les sube el sueldo o los despide.
- Revisa el inventario y hace pedidos a los proveedores.
- Lee las observaciones que le deja el dueño.

**Dueño** (ve todo de un vistazo)
- Ve las ventas del día y su dinero disponible.
- Revisa proveedores e inventario.
- Deja observaciones al administrador (felicitar, pedir un despido, etc.).

## Cómo entrar

| Rol | Usuario | Contraseña |
|---|---|---|
| Dueño | AlbiSteed | Dueno2026* |
| Administrador | SergioSuarez | Admin2026* |
| Cajero (día) | Cajero1 | Cajero1Dia* |
| Cajero (noche) | Cajero2 | Cajero2Noche* |

## Detalles

- Hay dos cajeros: uno de día y uno de noche. Solo uno maneja la caja a la vez.
- Cada venta suma al dinero del dueño.
- El menú tiene pollo a la brasa, broaster, complementos, bebidas y combos.

## Cómo encender el servicio (Node.js)

1. Crear la base de datos en MySQL ejecutando, en este orden:
   `BaseDeDatos_Proyecto/SCRIPT_Proyecto.sql` y `BaseDeDatos_Proyecto/inserts_Proyecto.sql`.
2. Crear un archivo `.env` en la carpeta del proyecto con la contraseña de MySQL:
   ```
   DB_PASSWORD=tu_contraseña
   ```
3. Instalar las dependencias (solo la primera vez): `npm install`
4. Encender el servidor: `node index.js`
5. Abrir http://localhost:3000 en el navegador.
