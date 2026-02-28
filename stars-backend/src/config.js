import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOrigin(urlLike) {
  if (!urlLike) {
    return null;
  }
  try {
    return new URL(urlLike).origin;
  } catch {
    return null;
  }
}

const webappOrigin = normalizeOrigin(process.env.WEBAPP_URL);
const allowedOrigins = new Set([
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  ...(webappOrigin ? [webappOrigin] : [])
]);

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3000),
  botToken: required("BOT_TOKEN"),
  webhookSecret: required("WEBHOOK_SECRET"),
  firebaseDatabaseUrl: required("FIREBASE_DATABASE_URL"),
  firebaseServiceAccountJson: required("FIREBASE_SERVICE_ACCOUNT_JSON"),
  webhookUrl: process.env.WEBHOOK_URL ?? null,
  railwayPublicDomain: process.env.RAILWAY_PUBLIC_DOMAIN ?? null,
  webappUrl: process.env.WEBAPP_URL ?? null,
  allowedOrigins: Array.from(allowedOrigins)
};
