# FaceService models

This directory is populated by `FaceService/scripts/prepare_models.py`.

The ONNX binaries are not committed to this repository. Docker builds download
the exact OpenCV Zoo model files and validate SHA-256 before the FastAPI service
is copied into the image.

Required files:

- `face_detection_yunet_2023mar.onnx`
- `face_recognition_sface_2021dec.onnx`

Runtime startup does not download models. If either file is absent from the
image or local checkout, `/ready` fails with a clear model loading error.
