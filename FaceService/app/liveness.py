import cv2
import numpy as np


def validate_frames(frames: list[np.ndarray], actions: list[str]) -> bool:
    if len(frames) < len(actions):
        return False
    # MVP/basic motion liveness: the challenge actions are requested by Node/React,
    # but this service does not yet verify BLINK/TURN_LEFT/TURN_RIGHT semantically.
    # TODO: replace this with landmark-based action validation before production.
    differences = []
    for previous, current in zip(frames, frames[1:]):
        previous_gray = cv2.cvtColor(previous, cv2.COLOR_BGR2GRAY)
        current_gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        differences.append(float(np.mean(cv2.absdiff(previous_gray, current_gray))))
    return bool(differences) and max(differences) >= 2.0
