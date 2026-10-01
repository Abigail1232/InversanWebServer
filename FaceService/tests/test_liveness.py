import unittest
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.liveness import FaceEvidence, validate_evidence_sequence, validate_frames


OPEN_CENTER = FaceEvidence(eye_aspect_ratio=0.28, yaw=0.0)
CLOSED_CENTER = FaceEvidence(eye_aspect_ratio=0.13, yaw=0.0)
LEFT_TURN = FaceEvidence(eye_aspect_ratio=0.27, yaw=0.08)
RIGHT_TURN = FaceEvidence(eye_aspect_ratio=0.27, yaw=-0.08)
INSUFFICIENT_LEFT_TURN = FaceEvidence(eye_aspect_ratio=0.27, yaw=0.03)
INSUFFICIENT_RIGHT_TURN = FaceEvidence(eye_aspect_ratio=0.27, yaw=-0.03)
OFF_CENTER = FaceEvidence(eye_aspect_ratio=0.27, yaw=0.06)


def passive_evidence(offset: float = 0.0) -> FaceEvidence:
    landmarks = [(0.0, 0.0) for _ in range(478)]
    for index in (1, 33, 61, 133, 152, 199, 263, 291, 362, 454):
        landmarks[index] = (0.2 + offset, 0.3)
    landmarks[234] = (-0.5, 0.0)
    landmarks[454] = (0.5, 0.0)
    return FaceEvidence(eye_aspect_ratio=0.27, yaw=0.0, landmarks=tuple(landmarks))


class LivenessTests(unittest.TestCase):
    def test_accepts_valid_requested_sequence(self):
        evidence = [CLOSED_CENTER, LEFT_TURN, RIGHT_TURN, OPEN_CENTER]
        self.assertTrue(validate_evidence_sequence(evidence, ["BLINK", "TURN_LEFT", "TURN_RIGHT", "LOOK_CENTER"]))

    def test_rejects_blink_without_real_eye_aperture_change(self):
        evidence = [FaceEvidence(eye_aspect_ratio=0.20, yaw=0.0), OPEN_CENTER]
        self.assertFalse(validate_evidence_sequence(evidence, ["BLINK"]))

    def test_accepts_blink_with_closed_and_open_reference(self):
        self.assertTrue(validate_evidence_sequence([CLOSED_CENTER, OPEN_CENTER], ["BLINK"]))

    def test_accepts_turn_left_above_threshold(self):
        self.assertTrue(validate_evidence_sequence([LEFT_TURN], ["TURN_LEFT"]))

    def test_rejects_insufficient_turn_left(self):
        self.assertFalse(validate_evidence_sequence([INSUFFICIENT_LEFT_TURN], ["TURN_LEFT"]))

    def test_accepts_turn_right_above_threshold(self):
        self.assertTrue(validate_evidence_sequence([RIGHT_TURN], ["TURN_RIGHT"]))

    def test_rejects_insufficient_turn_right(self):
        self.assertFalse(validate_evidence_sequence([INSUFFICIENT_RIGHT_TURN], ["TURN_RIGHT"]))

    def test_accepts_look_center_within_tolerance(self):
        self.assertTrue(validate_evidence_sequence([OPEN_CENTER], ["LOOK_CENTER"]))

    def test_rejects_look_center_outside_tolerance(self):
        self.assertFalse(validate_evidence_sequence([OFF_CENTER], ["LOOK_CENTER"]))

    def test_rejects_wrong_turn_direction(self):
        evidence = [RIGHT_TURN, OPEN_CENTER]
        self.assertFalse(validate_evidence_sequence(evidence, ["TURN_LEFT", "LOOK_CENTER"]))

    def test_rejects_non_center_for_look_center(self):
        self.assertFalse(validate_evidence_sequence([LEFT_TURN], ["LOOK_CENTER"]))

    def test_respects_requested_order(self):
        evidence = [LEFT_TURN, CLOSED_CENTER, OPEN_CENTER]
        self.assertFalse(validate_evidence_sequence(evidence, ["BLINK", "TURN_LEFT"]))

    def test_validate_frames_rejects_missing_face_landmarks(self):
        frame = np.zeros((40, 40, 3), dtype=np.uint8)
        self.assertFalse(validate_frames([frame, frame.copy()], ["BLINK"], feature_extractor=lambda _: None))

    def test_validate_frames_uses_extracted_landmark_evidence(self):
        frames = [np.zeros((40, 40, 3), dtype=np.uint8) for _ in range(2)]
        extracted = iter([CLOSED_CENTER, OPEN_CENTER])
        self.assertTrue(validate_frames(frames, ["BLINK"], feature_extractor=lambda _: next(extracted)))

    def test_accepts_passive_motion_with_minimal_landmark_change(self):
        evidence = [passive_evidence(0.0), passive_evidence(0.02)]
        self.assertTrue(validate_evidence_sequence(evidence, ["PASSIVE_MOTION"]))

    def test_rejects_passive_motion_when_face_is_static(self):
        evidence = [passive_evidence(0.0), passive_evidence(0.0), passive_evidence(0.0)]
        self.assertFalse(validate_evidence_sequence(evidence, ["PASSIVE_MOTION"]))

    def test_validate_frames_accepts_passive_motion_from_extracted_landmarks(self):
        frames = [np.zeros((40, 40, 3), dtype=np.uint8) for _ in range(3)]
        extracted = iter([passive_evidence(0.0), passive_evidence(0.015), passive_evidence(0.02)])
        self.assertTrue(validate_frames(frames, ["PASSIVE_MOTION"], feature_extractor=lambda _: next(extracted)))


if __name__ == "__main__":
    unittest.main()
