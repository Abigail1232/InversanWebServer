# Desarrollo local

1. Copia `.env.example` a `.env` y configura credenciales exclusivamente locales. La `DATABASE_URL` debe usar el host `db`; no uses credenciales ni servicios de producción.
2. Inicia los servicios:

   ```sh
   docker compose -f docker-compose.dev.yml up --build
   ```

3. Accede a:
   - Frontend: http://localhost:5000
   - Backend: http://localhost:3000
   - Swagger: http://localhost:3000/api-docs
4. Sigue los logs:

   ```sh
   docker compose -f docker-compose.dev.yml logs -f
   ```

5. Detén los servicios:

   ```sh
   docker compose -f docker-compose.dev.yml down
   ```

   `docker compose -f docker-compose.dev.yml down -v` elimina también la base de datos local. No lo ejecutes sin tener claro que quieres borrar esos datos.

Para cargar seeders manualmente en una base local vacía:

```sh
docker compose -f docker-compose.dev.yml exec backend npm run prisma:seed
```

El seed no se ejecuta automáticamente al iniciar los contenedores.

## Prueba de marcación GPS + facial

Las coordenadas incluidas en el seeder de sucursales son aproximadas y se mantienen con `location_configured=false`. No habilitan geofence de asistencia.

Para configurar una sucursal localmente:

1. Inicia sesión como administrador.
2. Abre Administración de Sucursales y edita la sucursal.
3. Configura la ubicación real de la sucursal: busca una dirección y selecciona el resultado, introduce coordenadas válidas, ajusta la ubicación, o pulsa "Usar mi ubicación" estando físicamente en la sucursal.
4. Guarda la sucursal. `location_configured` se activa automáticamente solo cuando el backend recibe coordenadas reales válidas.
5. Confirma el radio permitido y la precisión GPS máxima.
6. Registra el rostro del empleado desde Administración de Biometría, o permite que el empleado envíe una solicitud facial para aprobación.

No existe aprobación manual de la ubicación actual del empleado. En cada marcación se compara el GPS actual del empleado contra el GPS guardado de la sucursal.

`JSON_BODY_LIMIT=4mb` cubre las capturas biométricas optimizadas del frontend. Antes de aumentarlo, reduce o mide las imágenes; no lo subas a valores grandes sin una razón operacional.

Las computadoras portátiles generalmente no poseen GPS físico. Chrome/Windows puede obtener ubicación mediante Wi-Fi o red y la precisión (`accuracy`, incertidumbre de la medición) puede ser mucho peor que en un teléfono, aunque la distancia calculada a la sucursal (`distanceMeters`) sea pequeña.

El valor estandar de `max_gps_accuracy_m` es 145 m. Este ajuste aumenta la incertidumbre maxima aceptada por la variabilidad real observada en navegadores y dispositivos; no mejora la precision fisica del GPS ni modifica el radio de asistencia. Para produccion se recomienda calibrarlo usando celulares reales con GPS y HTTPS, requerido por `geolocation` y `getUserMedia`.
