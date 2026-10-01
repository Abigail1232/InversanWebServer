# Face Threshold Calibration

`SFACE_COSINE_THRESHOLD=0.363` is the initial OpenCV SFace reference baseline,
not the final Inversan production policy.

## Goal

Choose a threshold that balances:

- False Acceptance Rate: an impostor is accepted.
- False Rejection Rate: the real employee is rejected.

The system must remain 1:1 verification only:

1. Employee authenticates.
2. Backend loads only that employee's encrypted embedding.
3. FaceService compares the current capture against that one embedding.
4. No 1:N search is performed.

## Data Collection

Use only authorized participants and written approval for calibration sessions.
Do not keep selfies or videos permanently unless a separate retention policy and
authorization explicitly allow it.

Recommended capture variation:

- Indoor and outdoor lighting.
- Common employee phones and webcams.
- Glasses, facial hair, and natural day-to-day appearance changes.
- Moderate head angle variation.
- Multiple branches or camera locations where attendance will be used.

## Measurements

For each authorized participant:

- Enroll once through the administrative flow.
- Capture several genuine verification attempts for that same user.
- Capture impostor attempts where another authorized participant tries against
  the first user's account.

Store only the minimum statistics needed:

- anonymized pair type: `genuine` or `impostor`;
- SFace cosine similarity;
- whether liveness and GPS passed;
- device/camera category if needed for calibration.

Do not store raw photos, videos, or plaintext embeddings as calibration output.

## Selection

Plot genuine and impostor score distributions. Evaluate several candidate
thresholds around the baseline and choose a value that satisfies Inversan's
security tolerance for false accepts while keeping operational false rejects
manageable.

Recalibrate after changing:

- OpenCV version;
- YuNet or SFace model file;
- camera UX constraints;
- capture resolution or JPEG quality;
- employee device population.
