import hashlib
import urllib.request
from pathlib import Path


OPENCV_ZOO_COMMIT = "f12e12798e8314f7c074a6656816c048dcc95b7a"

MODELS = [
    {
        "name": "YuNet face detector 2023mar",
        "filename": "face_detection_yunet_2023mar.onnx",
        "url": f"https://github.com/opencv/opencv_zoo/raw/{OPENCV_ZOO_COMMIT}/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "sha256": "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    },
    {
        "name": "SFace face recognizer 2021dec",
        "filename": "face_recognition_sface_2021dec.onnx",
        "url": f"https://github.com/opencv/opencv_zoo/raw/{OPENCV_ZOO_COMMIT}/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        "sha256": "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
    },
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, target: Path) -> None:
    tmp = target.with_suffix(target.suffix + ".tmp")
    try:
        with urllib.request.urlopen(url) as response:
            status = getattr(response, "status", response.getcode())
            if status != 200:
                raise RuntimeError(f"HTTP {status} downloading {url}")
            with tmp.open("wb") as file:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    file.write(chunk)
        tmp.replace(target)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise


def ensure_model(model: dict[str, str], models_dir: Path) -> None:
    target = models_dir / model["filename"]
    if not target.exists():
        print(f"Downloading {model['name']} from OpenCV Zoo", flush=True)
        download(model["url"], target)
    digest = sha256_file(target)
    if digest != model["sha256"]:
        target.unlink(missing_ok=True)
        raise SystemExit(
            f"SHA-256 mismatch for {model['filename']}: expected {model['sha256']}, got {digest}"
        )
    print(f"{model['filename']} OK ({digest})", flush=True)


def main() -> None:
    models_dir = Path(__file__).resolve().parents[1] / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    for model in MODELS:
        ensure_model(model, models_dir)


if __name__ == "__main__":
    main()
