const crypto = require("node:crypto");

const BIOMETRIC_ENCRYPTION_NOT_CONFIGURED = "BIOMETRIC_ENCRYPTION_NOT_CONFIGURED";

function getKey() {
  const configured = process.env.BIOMETRIC_ENCRYPTION_KEY;
  if (!configured) {
    const error = new Error("BIOMETRIC_ENCRYPTION_NOT_CONFIGURED");
    error.code = BIOMETRIC_ENCRYPTION_NOT_CONFIGURED;
    throw error;
  }
  return crypto.createHash("sha256").update(configured).digest();
}

function encryptEmbedding(embedding) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(embedding), "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptEmbedding(value) {
  const [ivValue, tagValue, ciphertextValue] = String(value).split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return JSON.parse(Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8"));
}

module.exports = { BIOMETRIC_ENCRYPTION_NOT_CONFIGURED, encryptEmbedding, decryptEmbedding };
