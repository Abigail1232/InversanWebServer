# Fix final: mapa de sucursales e imágenes de marcas

## Mapa

Se reemplazó el mapa de Leaflet por un iframe de OpenStreetMap en `AdminBranches.tsx`.

Esto evita el error:

```txt
No se pudo cargar el mapa. Revisa tu instalación de leaflet/react-leaflet.
```

El mapa ya no depende de carga dinámica ni de librerías Leaflet en esa pantalla.

## Imágenes

Se reforzó `ImageWithFallback` para probar varias rutas antes de mostrar el placeholder:

- `https://api.grupoinversan.com/assets/archivo.png`
- `https://api.grupoinversan.com/public/archivo.png`
- `https://grupoinversan.com/assets/archivo.png`
- `https://grupoinversan.com/public/archivo.png`

También se limpió `index.js` para servir `/assets` y `/public`.

## Importante

Si una imagen sigue saliendo gris, el archivo físico no existe dentro del contenedor/volumen. Verifica con:

```bash
docker exec inversan_backend ls -lah /app/assets
docker exec inversan_backend ls -lah /app/assets | grep NOMBRE_DEL_ARCHIVO
curl -I http://localhost:3003/assets/NOMBRE_DEL_ARCHIVO.png
curl -I https://api.grupoinversan.com/assets/NOMBRE_DEL_ARCHIVO.png
```

Si da `404`, debes volver a subir la imagen desde el panel de marcas o copiarla al volumen `/app/assets`.

## Despliegue

```bash
cd /home/server/InversanWebServer
git pull origin main
docker compose build --no-cache
docker compose up -d
```

Luego en navegador:

1. Clic en `Finalizar actualización` si aparece.
2. Cerrar la pestaña.
3. Abrir de nuevo.
4. Presionar `Ctrl + F5`.
