from fastapi import FastAPI, HTTPException
from .face_engine import FaceEngine, MODEL_VERSION
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
    return {"ok": True, "model_version": MODEL_VERSION, "model_loaded": engine.analysis is not None}


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
        vector, face_count, quality_ok = engine.extract(request.image_base64)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="Modelo facial no disponible") from error
    similarity = engine.similarity(vector, request.reference_embedding) if quality_ok else 0.0
    return {"matched": quality_ok and similarity >= request.threshold, "similarity": similarity, "face_count": face_count}


@app.post("/liveness")
def liveness(request: LivenessRequest):
    try:
        frames = [engine.decode(frame) for frame in request.frames]
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return {
        "verified": validate_frames(frames, request.actions),
        "actions_requested": request.actions,
        "mode": "MVP_BASIC_MOTION",
    }
