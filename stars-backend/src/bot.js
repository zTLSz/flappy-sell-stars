import { Bot } from "grammy";
import { config } from "./config.js";
import { registerPaymentHandlers } from "./handlers/payments.js";

export const bot = new Bot(config.botToken);

bot.catch((error) => {
  console.error("Bot update error", error.error);
});

registerPaymentHandlers(bot);
