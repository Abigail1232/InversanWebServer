# Fix mapa Leaflet / React Leaflet

Problema visto en producción:

```txt
No se pudo cargar el mapa. Revisa tu instalación de leaflet/react-leaflet.
```

Causa probable:
- El mapa se cargaba con `import()` dinámico.
- En producción, después de rebuild/cache/red, el chunk dinámico podía fallar o no cargarse correctamente.
- El modal también puede necesitar `invalidateSize()` para que Leaflet calcule bien el tamaño del mapa.

Cambios aplicados:
- `react-leaflet` y `leaflet` ahora se importan de forma estática en `AdminBranches.tsx`.
- Se mantiene `leaflet/dist/leaflet.css`.
- Se configura el ícono del marcador para Vite.
- Se agrega `invalidateSize()` cuando el mapa aparece dentro del modal, para evitar mapa en blanco.

Después de subir a main:

```bash
cd /home/server/InversanWebServer
git pull origin main
docker compose build --no-cache frontend
docker compose up -d frontend
```

Luego en el navegador:
- Cerrar pestañas viejas.
- Entrar de nuevo a `https://grupoinversan.com/admin/branches`.
- Hacer Ctrl + F5.
- Si Chrome muestra "Finalizar actualización", pulsarlo.
