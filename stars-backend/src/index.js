import cors from "cors";
import express from "express";
import { bot } from "./bot.js";
import { config } from "./config.js";
import { createInvoiceRouter } from "./routes/invoice.js";
import { getPublicPackages } from "./packages.js";
import "./firebase.js";

const app = express();

app.use(express.json());

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now()
  });
});

app.get("/api/packages", (_req, res) => {
  res.json({
    packages: getPublicPackages()
  });
});

app.use("/api", createInvoiceRouter(bot));

app.post("/bot-webhook", async (req, res) => {
  try {
    const secret = req.headers["x-telegram-bot-api-secret-token"];
    if (secret !== config.webhookSecret) {
      res.sendStatus(403);
      return;
    }

    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook handling failed", error);
    res.sendStatus(500);
  }
});

function resolveWebhookUrl() {
  if (config.webhookUrl) {
    return config.webhookUrl;
  }

  if (config.railwayPublicDomain) {
    const withProtocol = config.railwayPublicDomain.startsWith("http")
      ? config.railwayPublicDomain
      : `https://${config.railwayPublicDomain}`;

    return `${withProtocol.replace(/\/+$/, "")}/bot-webhook`;
  }

  return null;
}

async function bootstrap() {
  const webhookUrl = resolveWebhookUrl();
  if (webhookUrl) {
    await bot.api.setWebhook(webhookUrl, {
      secret_token: config.webhookSecret
    });
    console.log(`Webhook set: ${webhookUrl}`);
  } else {
    console.warn("Webhook URL is not configured. Skipping setWebhook.");
  }

  app.listen(config.port, () => {
    console.log(`Stars backend started on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Startup failed", error);
  process.exit(1);
});
