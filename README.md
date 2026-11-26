# PROYECTO_FRANQUICIA_POLLOS

## Cómo ejecutarlo

1. Crear la base de datos en MySQL ejecutando, en este orden:
   `BaseDeDatos_Proyecto/SCRIPT_Proyecto.sql` y `BaseDeDatos_Proyecto/inserts_Proyecto.sql`.
2. Crear un archivo `.env` en la carpeta del proyecto con la contraseña de MySQL:
   ```
   DB_PASSWORD=tu_contraseña
   ```
3. Instalar las dependencias (solo la primera vez): `npm install`
4. Encender el servidor: `node index.js`
5. Abrir http://localhost:3000 en el navegador.

Las páginas se deben abrir desde http://localhost:3000. Si se abren con doble clic en el archivo HTML no se pueden comunicar con la base de datos.
