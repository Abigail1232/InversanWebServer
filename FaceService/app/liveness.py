from dataclasses import dataclass
from functools import lru_cache
from typing import Callable

import cv2
import numpy as np

LEFT_EYE = (33, 160, 158, 133, 153, 144)
RIGHT_EYE = (362, 385, 387, 263, 373, 380)
NOSE_TIP = 1
LEFT_FACE = 234
RIGHT_FACE = 454
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263

BLINK_CLOSED_EAR = 0.18
BLINK_OPEN_EAR = 0.23
BLINK_MIN_DELTA = 0.05
TURN_YAW_THRESHOLD = 0.055
CENTER_YAW_THRESHOLD = 0.035


@dataclass(frozen=True)
class FaceEvidence:
    eye_aspect_ratio: float
    yaw: float


def _distance(a, b) -> float:
    return float(np.linalg.norm(np.array([a.x - b.x, a.y - b.y], dtype=np.float64)))


def _eye_aspect_ratio(points, indices: tuple[int, int, int, int, int, int]) -> float:
    p1, p2, p3, p4, p5, p6 = [points[index] for index in indices]
    width = _distance(p1, p4)
    if width <= 0:
        return 0.0
    return (_distance(p2, p6) + _distance(p3, p5)) / (2.0 * width)


def evidence_from_landmarks(points) -> FaceEvidence:
    left_ear = _eye_aspect_ratio(points, LEFT_EYE)
    right_ear = _eye_aspect_ratio(points, RIGHT_EYE)
    face_width = abs(points[RIGHT_FACE].x - points[LEFT_FACE].x)
    if face_width <= 0:
        face_width = abs(points[RIGHT_EYE_OUTER].x - points[LEFT_EYE_OUTER].x)
    if face_width <= 0:
        raise ValueError("Landmarks faciales insuficientes")

    eye_center_x = (points[LEFT_EYE_OUTER].x + points[RIGHT_EYE_OUTER].x) / 2.0
    yaw = (points[NOSE_TIP].x - eye_center_x) / face_width
    return FaceEvidence(eye_aspect_ratio=(left_ear + right_ear) / 2.0, yaw=float(yaw))


class MediaPipeLandmarkExtractor:
    def __init__(self):
        import mediapipe as mp

        self._face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
        )

    def __call__(self, frame: np.ndarray) -> FaceEvidence | None:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self._face_mesh.process(rgb)
        faces = result.multi_face_landmarks or []
        if len(faces) != 1:
            return None
        return evidence_from_landmarks(faces[0].landmark)


@lru_cache(maxsize=1)
def _default_extractor() -> MediaPipeLandmarkExtractor:
    return MediaPipeLandmarkExtractor()


def _validate_action(action: str, evidence: FaceEvidence, all_evidence: list[FaceEvidence]) -> bool:
    if action == "BLINK":
        open_eye_reference = max(item.eye_aspect_ratio for item in all_evidence)
        return (
            evidence.eye_aspect_ratio <= BLINK_CLOSED_EAR
            and open_eye_reference >= BLINK_OPEN_EAR
            and open_eye_reference - evidence.eye_aspect_ratio >= BLINK_MIN_DELTA
        )
    if action == "TURN_LEFT":
        return evidence.yaw >= TURN_YAW_THRESHOLD
    if action == "TURN_RIGHT":
        return evidence.yaw <= -TURN_YAW_THRESHOLD
    if action == "LOOK_CENTER":
        return abs(evidence.yaw) <= CENTER_YAW_THRESHOLD
    return False


def validate_evidence_sequence(evidence: list[FaceEvidence], actions: list[str]) -> bool:
    if len(evidence) < len(actions):
        return False
    action_evidence = evidence[: len(actions)]
    return all(_validate_action(action, item, evidence) for action, item in zip(actions, action_evidence))


def validate_frames(
    frames: list[np.ndarray],
    actions: list[str],
    feature_extractor: Callable[[np.ndarray], FaceEvidence | None] | None = None,
) -> bool:
    if len(frames) < len(actions):
        return False
    extractor = feature_extractor or _default_extractor()
    evidence = []
    for frame in frames:
        item = extractor(frame)
        if item is None:
            return False
        evidence.append(item)
    return validate_evidence_sequence(evidence, actions)
