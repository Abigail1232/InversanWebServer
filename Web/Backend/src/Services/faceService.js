const axios = require("axios");

const FACE_QUALITY_INSUFFICIENT = "FACE_QUALITY_INSUFFICIENT";
const FACE_SERVICE_UNAVAILABLE = "FACE_SERVICE_UNAVAILABLE";

function getFaceServiceUrl() {
  return process.env.FACE_SERVICE_URL || "http://face-service:8000";
}

function isUnavailable(error) {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return error.response.status >= 500;
}

async function postFaceService(path, payload, timeout) {
  try {
    const response = await axios.post(`${getFaceServiceUrl()}${path}`, payload, { timeout });
    return response.data;
  } catch (error) {
    if (isUnavailable(error)) {
      const unavailable = new Error("El servicio de reconocimiento facial no está disponible.");
      unavailable.code = FACE_SERVICE_UNAVAILABLE;
      throw unavailable;
    }
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      const quality = new Error("La foto no tiene suficiente calidad. Inténtalo nuevamente.");
      quality.code = FACE_QUALITY_INSUFFICIENT;
      throw quality;
    }
    throw error;
  }
}

async function createEmbedding(imageBase64) {
  return postFaceService("/embedding", { image_base64: imageBase64 }, 300000);
}

async function verifyFace(imageBase64, referenceEmbedding) {
  return postFaceService("/verify", {
    image_base64: imageBase64,
    reference_embedding: referenceEmbedding,
    threshold: Number(process.env.FACE_MATCH_THRESHOLD || 0.55),
  }, 120000);
}

async function verifyLiveness(frames, actions) {
  return postFaceService("/liveness", { frames, actions }, 120000);
}

module.exports = { FACE_QUALITY_INSUFFICIENT, FACE_SERVICE_UNAVAILABLE, createEmbedding, verifyFace, verifyLiveness };
