from fastapi import FastAPI, HTTPException
from .face_engine import FaceEngine, MODEL_VERSION, SFACE_DEFAULT_COSINE_THRESHOLD, SFACE_VERSION, YUNET_VERSION
from .liveness import validate_frames
from .schemas import EmbeddingResponse, ImageRequest, LivenessRequest, VerifyRequest

app = FastAPI(docs_url=None, redoc_url=None)
engine = FaceEngine()


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/ready")
def ready():
    try:
        model_loaded = engine.ready()
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="Modelo facial no disponible") from error
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Modelo facial no disponible")
    return {
        "ready": True,
        "ok": True,
        "model_version": MODEL_VERSION,
        "modelVersion": MODEL_VERSION,
        "detector": YUNET_VERSION,
        "recognizer": SFACE_VERSION,
    }


@app.post("/embedding", response_model=EmbeddingResponse)
def embedding(request: ImageRequest):
    try:
        vector, face_count, quality_ok = engine.extract(request.image_base64)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="Modelo facial no disponible") from error
    return EmbeddingResponse(
        embedding=vector,
        model_version=MODEL_VERSION,
        face_count=face_count,
        quality_ok=quality_ok,
    )


@app.post("/verify")
def verify(request: VerifyRequest):
    try:
        result = engine.verify(request.image_base64, request.reference_embedding, request.threshold)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="Modelo facial no disponible") from error
    return result | {"model_version": MODEL_VERSION, "reference_threshold": request.threshold or SFACE_DEFAULT_COSINE_THRESHOLD}


@app.post("/liveness")
def liveness(request: LivenessRequest):
    try:
        frames = [engine.decode(frame) for frame in request.frames]
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    verified = validate_frames(frames, request.actions)
    passive = request.actions == ["PASSIVE_MOTION"]
    return {
        "verified": verified,
        "passed": verified,
        "reason": "PASSIVE_FACE_MOTION" if verified and passive else "LIVENESS_FAILED" if passive else None,
        "actions_requested": request.actions,
        "mode": "PASSIVE_MOTION" if passive else "LANDMARK_SEMANTIC_V1",
    }
