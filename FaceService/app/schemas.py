from pydantic import BaseModel, Field


class ImageRequest(BaseModel):
    image_base64: str = Field(min_length=16)


class VerifyRequest(BaseModel):
    image_base64: str = Field(min_length=16)
    reference_embedding: list[float]
    threshold: float = Field(gt=0, lt=1)


class LivenessRequest(BaseModel):
    frames: list[str] = Field(min_length=2, max_length=12)
    actions: list[str] = Field(min_length=1, max_length=4)


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    model_version: str
    face_count: int
    quality_ok: bool
