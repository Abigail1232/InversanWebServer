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