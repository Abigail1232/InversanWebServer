import unittest

import numpy as np

from app.liveness import validate_frames


class LivenessTests(unittest.TestCase):
    def test_requires_visible_motion(self):
        first = np.zeros((40, 40, 3), dtype=np.uint8)
        second = first.copy()
        second[10:30, 10:30] = 255
        self.assertTrue(validate_frames([first, second], ["BLINK"]))

    def test_rejects_static_frames(self):
        frame = np.zeros((40, 40, 3), dtype=np.uint8)
        self.assertFalse(validate_frames([frame, frame.copy()], ["BLINK"]))

    def test_requires_evidence_for_each_requested_action(self):
        first = np.zeros((40, 40, 3), dtype=np.uint8)
        second = first.copy()
        second[10:30, 10:30] = 255
        self.assertFalse(validate_frames([first, second], ["BLINK", "TURN_LEFT", "TURN_RIGHT"]))


if __name__ == "__main__":
    unittest.main()
