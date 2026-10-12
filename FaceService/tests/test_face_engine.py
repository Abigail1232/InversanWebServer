import base64
import sys
import unittest
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.face_engine import (
    FACE_MODEL_VERSION,
    MODEL_DIR,
    SFACE_DEFAULT_COSINE_THRESHOLD,
    SFACE_MODEL_PATH,
    YUNET_MODEL_PATH,
    FaceEngine,
)


def image_to_base64(image: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".jpg", image)
    if not ok:
        raise RuntimeError("Could not encode test image")
    return "data:image/jpeg;base64," + base64.b64encode(encoded.tobytes()).decode("ascii")


def face_row(x=40, y=40, w=120, h=120, score=0.99):
    landmarks = [
        x + 35, y + 45,
        x + 85, y + 45,
        x + 60, y + 70,
        x + 42, y + 95,
        x + 80, y + 95,
    ]
    return np.asarray([x, y, w, h, *landmarks, score], dtype=np.float32)


class FakeDetector:
    def __init__(self, faces):
        self.faces = faces
        self.input_size = None

    def setInputSize(self, size):
        self.input_size = size

    def detect(self, image):
        if self.faces is None:
            return 1, None
        return 1, np.asarray(self.faces, dtype=np.float32)


class FakeRecognizer:
    def __init__(self, embedding=None, similarity=0.5):
        self.embedding = np.asarray(embedding or [0.1, 0.2, 0.3, 0.4], dtype=np.float32).reshape(1, -1)
        self.similarity = similarity

    def alignCrop(self, image, face):
        return image

    def feature(self, aligned):
        return self.embedding.copy()

    def match(self, left, right, distance_type):
        return self.similarity


class FaceEngineTests(unittest.TestCase):
    def make_engine(self, faces, embedding=None, similarity=0.5):
        return FaceEngine(
            detector_factory=lambda: FakeDetector(faces),
            recognizer_factory=lambda: FakeRecognizer(embedding=embedding, similarity=similarity),
        )

    def test_zero_faces_returns_quality_false(self):
        engine = self.make_engine(None)
        embedding, face_count, quality_ok = engine.extract(image_to_base64(np.zeros((240, 240, 3), dtype=np.uint8)))

        self.assertEqual(embedding, [])
        self.assertEqual(face_count, 0)
        self.assertFalse(quality_ok)

    def test_multiple_faces_returns_count_without_embedding(self):
        engine = self.make_engine([face_row(), face_row(x=80, y=80)])
        embedding, face_count, quality_ok = engine.extract(image_to_base64(np.zeros((240, 240, 3), dtype=np.uint8)))

        self.assertEqual(embedding, [])
        self.assertEqual(face_count, 2)
        self.assertFalse(quality_ok)

    def test_single_face_generates_embedding_and_model_version(self):
        engine = self.make_engine([face_row()], embedding=[0.1, 0.2, 0.3, 0.4])
        embedding, face_count, quality_ok = engine.extract(image_to_base64(np.zeros((240, 240, 3), dtype=np.uint8)))

        self.assertEqual(FACE_MODEL_VERSION, "opencv-sface-2021dec")
        self.assertEqual(face_count, 1)
        self.assertTrue(quality_ok)
        self.assertEqual(len(embedding), 4)
        self.assertEqual(engine.embedding_dim, 4)

    def test_quality_insufficient_for_small_face(self):
        engine = self.make_engine([face_row(w=20, h=20)])
        embedding, face_count, quality_ok = engine.extract(image_to_base64(np.zeros((240, 240, 3), dtype=np.uint8)))

        self.assertEqual(embedding, [])
        self.assertEqual(face_count, 1)
        self.assertFalse(quality_ok)

    def test_similarity_threshold_match(self):
        engine = self.make_engine([face_row()], similarity=SFACE_DEFAULT_COSINE_THRESHOLD + 0.01)
        result = engine.verify(
            image_to_base64(np.zeros((240, 240, 3), dtype=np.uint8)),
            [0.1, 0.2, 0.3, 0.4],
            SFACE_DEFAULT_COSINE_THRESHOLD,
        )

        self.assertTrue(result["matched"])
        self.assertGreater(result["similarity"], SFACE_DEFAULT_COSINE_THRESHOLD)

    def test_similarity_threshold_rejects_different_person_score(self):
        engine = self.make_engine([face_row()], similarity=SFACE_DEFAULT_COSINE_THRESHOLD - 0.01)
        result = engine.verify(
            image_to_base64(np.zeros((240, 240, 3), dtype=np.uint8)),
            [0.1, 0.2, 0.3, 0.4],
            SFACE_DEFAULT_COSINE_THRESHOLD,
        )

        self.assertFalse(result["matched"])

    @unittest.skipUnless(YUNET_MODEL_PATH.exists() and SFACE_MODEL_PATH.exists(), "OpenCV Zoo models not downloaded")
    def test_real_yunet_model_finds_no_face_on_blank_image(self):
        engine = FaceEngine()
        self.assertTrue(engine.ready())
        embedding, face_count, quality_ok = engine.extract(image_to_base64(np.zeros((240, 240, 3), dtype=np.uint8)))

        self.assertEqual(MODEL_DIR.name, "models")
        self.assertEqual(embedding, [])
        self.assertEqual(face_count, 0)
        self.assertFalse(quality_ok)

    @unittest.skipUnless(SFACE_MODEL_PATH.exists(), "OpenCV Zoo SFace model not downloaded")
    def test_real_sface_embedding_dimension_is_expected(self):
        recognizer = cv2.FaceRecognizerSF.create(str(SFACE_MODEL_PATH), "")
        embedding = recognizer.feature(np.zeros((112, 112, 3), dtype=np.uint8)).reshape(-1)

        self.assertEqual(embedding.shape[0], 128)


if __name__ == "__main__":
    unittest.main()
