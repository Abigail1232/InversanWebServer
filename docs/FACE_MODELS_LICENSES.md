# Face Models Licenses

Inversan FaceService uses OpenCV directly for face detection and 1:1 verification.
It does not use InsightFace, buffalo_l, antelope, DeepFace, or any InsightFace
ArcFace model.

## Runtime Library

| Component | Version used | License | Use |
| --- | --- | --- | --- |
| OpenCV / `opencv-python-headless` | `4.10.0.84` | Apache License 2.0 for OpenCV 4.5+ | Loads YuNet and SFace through `cv2.FaceDetectorYN` and `cv2.FaceRecognizerSF`. |
| MediaPipe Python package | `0.10.21` | Apache License 2.0 | Extracts landmarks for semantic liveness validation in FaceService. |
| MediaPipe Tasks Vision frontend package | `@mediapipe/tasks-vision` `1.0.1` | Apache License 2.0 | Browser-side camera UX, framing feedback, and visual liveness guidance only. |

## Model Files

| Model | File | Source | Version/date | SHA-256 | License | Use |
| --- | --- | --- | --- | --- | --- | --- |
| YuNet face detector | `face_detection_yunet_2023mar.onnx` | OpenCV Zoo, `models/face_detection_yunet` | 2023mar | `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4` | MIT License | Detects exactly one face and returns score, bounding box, and 5 landmarks. |
| SFace face recognizer | `face_recognition_sface_2021dec.onnx` | OpenCV Zoo, `models/face_recognition_sface` | 2021dec | `0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79` | Apache License 2.0 | Generates 128-dimensional face embeddings and computes cosine similarity for authenticated 1:1 verification. |

## Preserved License Texts

The model directory license texts are stored in:

- `FaceService/models/licenses/YUNET_MIT_LICENSE.txt`
- `FaceService/models/licenses/SFACE_APACHE_2_LICENSE.txt`

No separate NOTICE file was present in the OpenCV Zoo model directories at the
time this migration was implemented. Before updating either model file, review
the exact upstream directory contents again and preserve any new LICENSE or
NOTICE files that apply to that specific version.

## Reproducibility

The ONNX files are not committed. `FaceService/scripts/prepare_models.py`
downloads the exact files from OpenCV Zoo commit
`f12e12798e8314f7c074a6656816c048dcc95b7a` during Docker build and validates
the SHA-256 above. Runtime startup does not download models. If a model is
missing or corrupt, `/ready` fails.

## Threshold

OpenCV Zoo's SFace demo code uses cosine threshold `0.363` as a reference value
for the model. Inversan exposes it as `SFACE_COSINE_THRESHOLD=0.363` only as an
initial baseline. It must be recalibrated with authorized employee tests before
mass production activation.
