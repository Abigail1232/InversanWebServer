const Redis = require("ioredis");

const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL) 
  : new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD,
    });

redis.on("connect", () => console.log("✅ Conectado a Redis"));
redis.on("error", (err) => console.error("❌ Error en Redis:", err));

module.exports = redis;
