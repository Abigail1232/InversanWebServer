# Marcacion biometrica de asistencia

La marcacion biometrica se integra al modulo actual de asistencia. Node/Express mantiene la autoridad de negocio: identifica al usuario autenticado, resuelve su asignacion en `Empleado_Sucursal`, valida geofence, calcula la fecha/hora de Honduras y reutiliza `attendancePenalty` antes de crear `Asistencia`.

## Version facial vigente

`CURRENT_FACE_MODEL_VERSION = "opencv-sface-2021dec"`

El backend y el FaceService deben reportar el mismo valor:

- Backend: `CURRENT_FACE_MODEL_VERSION` en `Web/Backend/src/Services/faceModel.js`.
- FaceService: `FACE_MODEL_VERSION` en `FaceService/app/face_engine.py`.

Los embeddings generados por modelos anteriores no son compatibles con SFace. No existe una conversion valida entre embeddings de `buffalo_l`/InsightFace y embeddings de OpenCV SFace. Si una biometria o solicitud antigua tiene `model_version` distinto de `opencv-sface-2021dec`, el backend debe responder `BIOMETRIC_REENROLLMENT_REQUIRED`, no debe comparar esos embeddings y no debe aprobarlos silenciosamente.

## Flujo

1. El empleado solicita GPS desde el navegador.
2. Node calcula Haversine contra la sucursal asignada y valida la precision recibida.
3. Redis guarda un challenge aleatorio, asociado al usuario y sucursal, con TTL de `LIVENESS_CHALLENGE_TTL_SECONDS` (90 segundos por defecto).
4. El navegador captura frames y el backend los envia al `face-service` interno.
5. `face-service` usa YuNet para deteccion facial, SFace para embedding/reconocimiento y `FaceRecognizerSF` para similitud coseno 1:1.
6. `face-service` valida liveness semantico basado en landmarks y acciones: `BLINK`, `TURN_LEFT`, `TURN_RIGHT`, `LOOK_CENTER`.
7. Node registra `Asistencia` con `attendance_method=FACE_GPS`, penalizacion actual y auditoria puntual.

El challenge se consume con `redis.getdel()` al primer intento de `face-checkin`, antes de validar liveness o rostro. Por tanto es single-use desde el primer intento: si falla liveness, rostro o ubicacion, el empleado debe generar un nuevo challenge. Nunca se acepta un challenge de otro usuario o sucursal. El indice unico existente de asistencia evita duplicados del mismo dia.

## Autoridad de verificacion

El backend y `face-service` son la autoridad de verificacion facial. La deteccion facial productiva usa YuNet (`face_detection_yunet_2023mar.onnx`) y el reconocimiento usa SFace (`face_recognition_sface_2021dec.onnx`). La comparacion es similitud coseno calculada por OpenCV `FaceRecognizerSF`.

El frontend usa MediaPipe solamente para UX: encuadre, guia visual y retroalimentacion durante el liveness. El navegador no es fuente de verdad para `model_version` y cualquier `model_version` enviado desde frontend debe ignorarse.

## Datos y privacidad

- El embedding SFace se serializa y cifra con AES-256-GCM en Node usando `BIOMETRIC_ENCRYPTION_KEY` del entorno antes de guardarse en DB.
- Nunca se devuelve el embedding al navegador ni se imprime en logs, respuestas, errores o auditorias.
- Se conserva solo una biometria activa por usuario; reenrolar reemplaza el template anterior.
- La asistencia conserva GPS puntual, precision, distancia, score, resultado facial, liveness y timestamp de verificacion.
- No se conserva video ni selfie de cada marcacion por defecto, ni se registra trayectoria continua.
- Las solicitudes biometricas pendientes guardan el embedding cifrado, no una selfie visible. La aprobacion administrativa solo debe aprobar solicitudes con `model_version = "opencv-sface-2021dec"`.
- El acceso administrativo a enrolamiento/desactivacion requiere `ASI_BIOMETRIA_ADMINISTRAR` o `ALL_ACCESS`.
- La biometria es informacion sensible: debe limitarse el acceso, documentarse su retencion y ofrecerse eliminacion logica (`activo=false`) conforme a la politica de la organizacion.

## Reenrolamiento por modelo anterior

Flujo esperado:

1. El usuario tenia biometria generada con `buffalo_l` u otro modelo anterior.
2. El backend detecta `model_version != "opencv-sface-2021dec"`.
3. La marcacion responde `BIOMETRIC_REENROLLMENT_REQUIRED`.
4. El administrador registra nuevamente el rostro del empleado.
5. SFace genera un nuevo embedding cifrado.
6. `model_version` queda actualizado a `opencv-sface-2021dec`.
7. La marcacion vuelve a funcionar con GPS, liveness y verificacion SFace.

Las solicitudes antiguas pendientes tambien requieren cuidado:

- `APPROVE` queda bloqueado si `request.model_version !== CURRENT_FACE_MODEL_VERSION`.
- `REJECT` sigue permitido para limpiar solicitudes antiguas; al rechazar se marca `REJECTED`, se define `reviewed_at`, se guarda `reviewed_by` y se limpia `embedding_encrypted = null`.

No se migran automaticamente embeddings anteriores y no se intenta convertirlos.

## Liveness

El liveness actual no es simple diferencia de pixeles. `FaceService/app/liveness.py` extrae landmarks y valida semanticamente la accion solicitada:

- `BLINK`: cierre real de ojos contra una referencia abierta.
- `TURN_LEFT`: giro suficiente hacia la izquierda desde la perspectiva del usuario frente a la camara.
- `TURN_RIGHT`: giro suficiente hacia la derecha desde la perspectiva del usuario frente a la camara.
- `LOOK_CENTER`: rostro centrado dentro de tolerancia.

La preview del navegador puede verse espejada para que el usuario se oriente naturalmente. La evidencia enviada al backend se interpreta de forma consistente con la instruccion del usuario: `TURN_LEFT` significa que el usuario gira su rostro hacia su izquierda, aunque la vista previa sea tipo espejo.

## Modelos, umbral y reproducibilidad

Los modelos se descargan durante el build de Docker desde OpenCV Zoo fijado a un commit concreto y se validan por SHA-256. Runtime/startup no descarga modelos. Si la descarga falla, HTTP no es 200, el archivo esta corrupto o el hash no coincide, `prepare_models.py` termina con exit distinto de cero y el build falla.

Modelo YuNet:

- Archivo: `face_detection_yunet_2023mar.onnx`
- Uso: deteccion facial.
- SHA-256: `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4`

Modelo SFace:

- Archivo: `face_recognition_sface_2021dec.onnx`
- Uso: embedding/reconocimiento 1:1.
- SHA-256: `0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79`
- Dimension actual de embedding: 128.

`SFACE_COSINE_THRESHOLD=0.363` es un baseline/referencia inicial del modelo SFace, no una garantia final para Inversan. Debe calibrarse con empleados reales autorizados y pruebas de falsos positivos/negativos antes de una activacion masiva.

## Endpoints del FaceService

- `GET /health`: confirma que FastAPI esta vivo.
- `GET /ready`: confirma que YuNet y SFace cargaron correctamente y que el servicio esta utilizable.

Respuesta esperada de `/ready`:

```json
{
  "ready": true,
  "detector": "yunet-2023mar",
  "recognizer": "sface-2021dec",
  "modelVersion": "opencv-sface-2021dec"
}
```

La respuesta real puede incluir campos adicionales no sensibles, como `embedding_dim`, pero no debe exponer rutas internas del contenedor.

## Operacion

Aplicar migraciones con `prisma migrate deploy` en produccion. No usar `prisma migrate reset` contra datos reales. El servicio facial no se publica al host en Docker Compose dev; Node es su unico consumidor.

`getUserMedia` y `geolocation` requieren HTTPS en produccion. `localhost` funciona como contexto permitido durante desarrollo.

Prueba manual: configurar ubicacion de sucursal, enrolar el rostro autorizado, iniciar sesion como empleado, permitir GPS y camara, completar acciones, verificar la respuesta de exito y confirmar que "Mi asistencia" y los reportes muestran el mismo registro.
