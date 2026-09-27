# Marcación biométrica de asistencia

La marcación biométrica se integra al módulo actual de asistencia. Node/Express mantiene la autoridad de negocio: identifica al usuario autenticado, resuelve su asignación en `Empleado_Sucursal`, valida el geofence, calcula la fecha/hora de Honduras y reutiliza `attendancePenalty` antes de crear `Asistencia`.

## Flujo

1. El empleado solicita GPS desde el navegador.
2. Node calcula Haversine contra la sucursal asignada y valida la precisión recibida.
3. Redis guarda un challenge aleatorio, asociado al usuario y sucursal, con TTL de `LIVENESS_CHALLENGE_TTL_SECONDS` (90 segundos por defecto).
4. El navegador captura frames y el backend los envía al `face-service` interno.
5. `face-service` usa InsightFace/ArcFace en CPU para generar embeddings, comprobar calidad y comparar 1:1.
6. Node registra `Asistencia` con `attendance_method=FACE_GPS`, penalización actual y auditoría puntual.

El challenge se consume con `redis.getdel()` al primer intento de `face-checkin`, antes de validar liveness o rostro. Por tanto es single-use desde el primer intento: si falla liveness, rostro o ubicación, el empleado debe generar un nuevo challenge. Nunca se acepta un challenge de otro usuario o sucursal. El índice único existente de asistencia evita duplicados del mismo día.

## Datos y privacidad

- El embedding se cifra con AES-256-GCM en Node usando `BIOMETRIC_ENCRYPTION_KEY` del entorno. Nunca se devuelve ni se imprime en logs.
- Se conserva solo una biometría activa por usuario; reenrolar reemplaza el template anterior.
- La asistencia conserva GPS puntual, precisión, distancia, score, resultado facial, liveness y timestamp de verificación.
- No se conserva video ni selfie de cada marcación por defecto, ni se registra trayectoria continua.
- Las solicitudes biométricas pendientes guardan el embedding cifrado, no una selfie visible. La aprobación actual es administrativa: el administrador no cuenta con evidencia visual para confirmar que el rostro enviado corresponde al empleado. Para una versión más segura evaluar enrolamiento directo supervisado o una imagen temporal cifrada con TTL y política de retención explícita.
- El acceso administrativo a enrolamiento/desactivación requiere `ASI_BIOMETRIA_ADMINISTRAR` o `ALL_ACCESS`.
- La biometría es información sensible: debe limitarse el acceso, documentarse su retención y ofrecerse eliminación lógica (`activo=false`) conforme a la política de la organización.

## Limitaciones operativas

El liveness implementado en `FaceService/app/liveness.py` es MVP/basic motion liveness: recibe acciones como `BLINK`, `TURN_LEFT`, `TURN_RIGHT` y `LOOK_CENTER`, pero actualmente solo valida movimiento visible entre frames. No verifica semánticamente cada acción. La UI guía al usuario en español y captura evidencia por paso, pero la autoridad real sigue siendo el backend/FaceService. Antes de producción debe reemplazarse por validación de landmarks o un proveedor especializado de liveness activo. El GPS web también puede manipularse en dispositivos comprometidos. La seguridad combina sesión, precisión, geofence, challenge single-use, liveness básico, comparación 1:1 y hora backend.

`getUserMedia` y `geolocation` requieren HTTPS en producción. `localhost` funciona como contexto permitido durante desarrollo. El componente de cámara descarga WASM de MediaPipe desde jsDelivr y el modelo `face_landmarker.task` desde Google Storage; para producción reproducible se debe preparar la opción de servir esos assets desde el frontend propio. El servicio facial no se publica al host en Docker Compose dev; Node es su único consumidor.

## Operación

Aplicar migraciones con `prisma migrate deploy` en producción. El modelo configurado actualmente es InsightFace `buffalo_l`; antes de producción deben revisarse los términos/licencia aplicables al modelo preentrenado. El primer despliegue CPU-only puede requerir descargar los modelos de InsightFace; calibrar `FACE_MATCH_THRESHOLD` con empleados reales y pruebas de falsos positivos/negativos antes de adoptar una política definitiva.

Prueba manual: configurar ubicación de sucursal, enrolar el rostro autorizado, iniciar sesión como empleado, permitir GPS y cámara, completar acciones, verificar la respuesta de éxito y confirmar que “Mi asistencia” y los reportes muestran el mismo registro.
