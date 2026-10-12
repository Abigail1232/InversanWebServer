import base64
import os
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

FACE_MODEL_VERSION = "opencv-sface-2021dec"
MODEL_VERSION = FACE_MODEL_VERSION
YUNET_MODEL_NAME = "face_detection_yunet_2023mar.onnx"
SFACE_MODEL_NAME = "face_recognition_sface_2021dec.onnx"
YUNET_VERSION = "yunet-2023mar"
SFACE_VERSION = "sface-2021dec"
SFACE_DEFAULT_COSINE_THRESHOLD = 0.363

MODEL_DIR = Path(os.getenv("FACE_MODELS_DIR", Path(__file__).resolve().parents[1] / "models"))
YUNET_MODEL_PATH = MODEL_DIR / YUNET_MODEL_NAME
SFACE_MODEL_PATH = MODEL_DIR / SFACE_MODEL_NAME

YUNET_SCORE_THRESHOLD = float(os.getenv("YUNET_SCORE_THRESHOLD", "0.9"))
YUNET_NMS_THRESHOLD = float(os.getenv("YUNET_NMS_THRESHOLD", "0.3"))
YUNET_TOP_K = int(os.getenv("YUNET_TOP_K", "5000"))
MIN_IMAGE_WIDTH = int(os.getenv("FACE_MIN_IMAGE_WIDTH", "160"))
MIN_IMAGE_HEIGHT = int(os.getenv("FACE_MIN_IMAGE_HEIGHT", "160"))
MIN_FACE_SIZE_PX = int(os.getenv("FACE_MIN_SIZE_PX", "80"))
MIN_FACE_SIZE_RATIO = float(os.getenv("FACE_MIN_SIZE_RATIO", "0.18"))
MAX_BORDER_RATIO = float(os.getenv("FACE_MAX_BORDER_RATIO", "0.02"))

FACE_NOT_FOUND = "FACE_NOT_FOUND"
MULTIPLE_FACES = "MULTIPLE_FACES"
FACE_QUALITY_INSUFFICIENT = "FACE_QUALITY_INSUFFICIENT"


@dataclass(frozen=True)
class DetectedFace:
    raw: np.ndarray
    bbox: tuple[float, float, float, float]
    score: float
    landmarks: np.ndarray


class FaceQualityError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _create_detector():
    if not YUNET_MODEL_PATH.exists():
        raise RuntimeError(f"YuNet model missing: {YUNET_MODEL_NAME}")
    return cv2.FaceDetectorYN.create(
        str(YUNET_MODEL_PATH),
        "",
        (320, 320),
        YUNET_SCORE_THRESHOLD,
        YUNET_NMS_THRESHOLD,
        YUNET_TOP_K,
    )


def _create_recognizer():
    if not SFACE_MODEL_PATH.exists():
        raise RuntimeError(f"SFace model missing: {SFACE_MODEL_NAME}")
    return cv2.FaceRecognizerSF.create(str(SFACE_MODEL_PATH), "")


def _decode_embedding(value: list[float]) -> np.ndarray:
    embedding = np.asarray(value, dtype=np.float32)
    if embedding.ndim != 1:
        raise ValueError("Embedding invalido")
    return embedding.reshape(1, -1)


class FaceEngine:
    def __init__(self, detector_factory=_create_detector, recognizer_factory=_create_recognizer):
        self.detector_factory = detector_factory
        self.recognizer_factory = recognizer_factory
        self.detector = None
        self.recognizer = None
        self.embedding_dim = None
        self.load_error = None

    def _load_models(self):
        if self.detector is not None and self.recognizer is not None:
            return
        if self.load_error is not None:
            raise RuntimeError(self.load_error)
        try:
            self.detector = self.detector_factory()
            self.recognizer = self.recognizer_factory()
        except (cv2.error, OSError, RuntimeError) as error:
            self.detector = None
            self.recognizer = None
            self.load_error = str(error)
            raise RuntimeError(self.load_error) from error

    def ready(self) -> bool:
        self._load_models()
        return self.detector is not None and self.recognizer is not None

    @staticmethod
    def decode(image_base64: str) -> np.ndarray:
        raw = image_base64.split(",", 1)[-1]
        image = cv2.imdecode(np.frombuffer(base64.b64decode(raw), np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Imagen invalida")
        return image

    def detect_faces(self, image: np.ndarray) -> list[DetectedFace]:
        self._load_models()
        height, width = image.shape[:2]
        self.detector.setInputSize((width, height))
        _, faces = self.detector.detect(image)
        if faces is None:
            return []
        detected = []
        for face in faces:
            x, y, w, h = [float(value) for value in face[:4]]
            landmarks = np.asarray(face[4:14], dtype=np.float32).reshape(5, 2)
            detected.append(DetectedFace(raw=face.astype(np.float32), bbox=(x, y, w, h), score=float(face[-1]), landmarks=landmarks))
        return detected

    @staticmethod
    def _quality_ok(image: np.ndarray, face: DetectedFace) -> bool:
        height, width = image.shape[:2]
        if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
            return False
        x, y, w, h = face.bbox
        min_face_size = max(MIN_FACE_SIZE_PX, min(width, height) * MIN_FACE_SIZE_RATIO)
        if w < min_face_size or h < min_face_size:
            return False
        border = min(width, height) * MAX_BORDER_RATIO
        if x < border or y < border or x + w > width - border or y + h > height - border:
            return False
        return face.score >= YUNET_SCORE_THRESHOLD

    def extract(self, image_base64: str) -> tuple[list[float], int, bool]:
        image = self.decode(image_base64)
        faces = self.detect_faces(image)
        if len(faces) == 0:
            return [], 0, False
        if len(faces) > 1:
            return [], len(faces), False
        face = faces[0]
        quality_ok = self._quality_ok(image, face)
        if not quality_ok:
            return [], 1, False
        aligned = self.recognizer.alignCrop(image, face.raw)
        embedding = self.recognizer.feature(aligned).astype(np.float32)
        embedding = embedding.reshape(-1)
        self.embedding_dim = int(embedding.shape[0])
        return embedding.astype(float).tolist(), 1, True

    def similarity(self, first: list[float], second: list[float]) -> float:
        self._load_models()
        left = _decode_embedding(first)
        right = _decode_embedding(second)
        return float(self.recognizer.match(left, right, cv2.FaceRecognizerSF_FR_COSINE))

    def verify(self, image_base64: str, reference_embedding: list[float], threshold: float) -> dict:
        current_embedding, face_count, quality_ok = self.extract(image_base64)
        similarity = self.similarity(current_embedding, reference_embedding) if quality_ok else 0.0
        return {
            "matched": quality_ok and similarity >= threshold,
            "similarity": similarity,
            "face_count": face_count,
            "quality_ok": quality_ok,
        }
