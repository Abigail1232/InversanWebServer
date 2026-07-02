# Fix de imágenes persistentes

Este cambio agrega un volumen Docker para que las imágenes subidas a `/app/assets` no se pierdan al reconstruir o recrear el contenedor del backend.

## Antes de hacer rebuild en el servidor

Ejecutar:

```bash
cd /home/server/InversanWebServer
mkdir -p /home/server/inversan-assets-backup
docker cp inversan_backend:/app/assets/. /home/server/inversan-assets-backup/
```

## Después de hacer pull y levantar con el nuevo docker-compose

```bash
cd /home/server/InversanWebServer
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
docker cp /home/server/inversan-assets-backup/. inversan_backend:/app/assets/
docker compose restart backend
```

## Pruebas

```bash
curl -I http://localhost:3003/assets/NOMBRE_DEL_ARCHIVO.png
curl -I https://api.grupoinversan.com/assets/NOMBRE_DEL_ARCHIVO.png
```

Debe devolver `200 OK`.
