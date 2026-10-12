# Inversan production readiness

## HTTPS

Production must serve the frontend at `https://grupoinversan.com` and the backend/API through HTTPS at the public API origin. Browser APIs used by attendance require a secure context:

- `navigator.mediaDevices.getUserMedia`
- `navigator.geolocation`

TLS termination can live in the existing reverse proxy or infrastructure outside this repository. Do not enable biometric attendance on an HTTP-only deployment.

## Biometric enablement gate

Keep `BIOMETRIC_ENABLED=false` until production configuration, HTTPS, liveness tests, operational monitoring, and legal review are complete. The backend only enables biometric marking when `BIOMETRIC_ENABLED` is exactly `true`.

## Supervised enrollment

Production should keep `SELF_BIOMETRIC_ENROLLMENT_ENABLED=false`. With that setting, employees cannot create new self-service facial enrollment requests; an administrator with `ALL_ACCESS` or `ASI_BIOMETRIA_ADMINISTRAR` must register the employee face while the employee is physically present.

Existing `PENDING` biometric requests are retained for review. Administrators may still approve or reject those historical requests, but new employee-created requests are blocked while self enrollment is disabled. After approval or rejection, `Solicitud_Biometria.embedding_encrypted` is cleared to minimize retained biometric data.

## MediaPipe frontend assets

`FaceCamera` currently loads MediaPipe Tasks Vision WASM from jsDelivr and `face_landmarker.task` from Google Storage. For a release that must not depend on CDN availability, review the applicable MediaPipe Tasks package/model license and, if distribution is permitted, place the files under `Web/FrontEnd/public/mediapipe/` and update `FaceCamera` to load `/mediapipe/...`.

Until that is done, camera guidance and enrollment remain dependent on those external asset hosts.

Known external dependencies:

- `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm`
- `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`

TODO: self-host these assets after license and distribution review.

## Liveness calibration

FaceService validates semantic actions (`BLINK`, `TURN_LEFT`, `TURN_RIGHT`, `LOOK_CENTER`) from facial landmarks, not generic pixel movement. Threshold constants are centralized in `FaceService/app/liveness.py`:

- `BLINK_CLOSED_EAR`
- `BLINK_OPEN_EAR`
- `BLINK_MIN_DELTA`
- `TURN_YAW_THRESHOLD`
- `CENTER_YAW_THRESHOLD`

These values must be calibrated with real employees, lighting, cameras, and phone models before mass biometric activation.

## Camera mirror behavior

Frontend camera preview is visually mirrored with CSS (`rotateY(180deg)`) for user comfort. The captured frame sent to backend and the frame analyzed by MediaPipe are drawn/read from the original video element, not from the mirrored CSS rendering, so `TURN_LEFT` and `TURN_RIGHT` are not inverted by the preview transform.

## Face recognition models

FaceService uses OpenCV Zoo models through OpenCV 4.10:

- YuNet `face_detection_yunet_2023mar.onnx`: MIT License.
- SFace `face_recognition_sface_2021dec.onnx`: Apache License 2.0.
- OpenCV 4.5+ runtime: Apache License 2.0.

Review the exact upstream LICENSE/NOTICE files included with the concrete model
versions before every model update. Do not assume future model versions or files
automatically preserve the same license terms.

SFace cosine threshold starts at the OpenCV reference baseline
`SFACE_COSINE_THRESHOLD=0.363`, but this must be calibrated with authorized
employee tests before mass activation.
