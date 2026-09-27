import base64
import cv2
import numpy as np

MODEL_NAME = "buffalo_l"
MODEL_VERSION = f"insightface-{MODEL_NAME}-cpu"

try:
    from insightface.app import FaceAnalysis
except ImportError:  # Allows API tests without downloading the model.
    FaceAnalysis = None


class FaceEngine:
    def __init__(self):
        self.analysis = None
        self.load_error = None

    def _load_model(self):
        if self.analysis is not None:
            return
        if self.load_error is not None:
            raise RuntimeError(self.load_error)
        if FaceAnalysis is not None:
            try:
                self.analysis = FaceAnalysis(name=MODEL_NAME, providers=["CPUExecutionProvider"])
                self.analysis.prepare(ctx_id=0, det_size=(640, 640))
            except (AssertionError, OSError, RuntimeError) as error:
                print(f"Face model unavailable: {error}", flush=True)
                self.analysis = None
                self.load_error = str(error)
        else:
            self.load_error = "InsightFace no está instalado"

    def ready(self) -> bool:
        self._load_model()
        return self.analysis is not None

    @staticmethod
    def decode(image_base64: str) -> np.ndarray:
        raw = image_base64.split(",", 1)[-1]
        image = cv2.imdecode(np.frombuffer(base64.b64decode(raw), np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Imagen inválida")
        return image

    def extract(self, image_base64: str) -> tuple[list[float], int, bool]:
        self._load_model()
        if self.analysis is None:
            raise RuntimeError(self.load_error or "Modelo facial no disponible")
        faces = self.analysis.get(self.decode(image_base64))
        if len(faces) != 1:
            return [], len(faces), False
        face = faces[0]
        quality_ok = float(face.det_score) >= 0.65 and face.bbox[2] - face.bbox[0] >= 80
        return face.normed_embedding.astype(float).tolist(), 1, quality_ok

    def similarity(self, first: list[float], second: list[float]) -> float:
        left = np.asarray(first, dtype=np.float32)
        right = np.asarray(second, dtype=np.float32)
        denominator = np.linalg.norm(left) * np.linalg.norm(right)
        return float(np.dot(left, right) / denominator) if denominator else 0.0
