import { db } from "../firebase.js";
import { getPackageById } from "../packages.js";

const DEFAULT_COINS = {
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  lastUpdated: 0
};

export function registerPaymentHandlers(bot) {
  bot.on("pre_checkout_query", async (ctx) => {
    try {
      const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
      const pack = getPackageById(payload.packageId);

      if (!pack || pack.tokens !== payload.tokens) {
        await ctx.answerPreCheckoutQuery(false, {
          error_message: "Пакет не найден"
        });
        return;
      }

      await ctx.answerPreCheckoutQuery(true);
    } catch {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: "Ошибка обработки платежа"
      });
    }
  });

  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;
    let payload;

    try {
      payload = JSON.parse(payment.invoice_payload);
    } catch {
      return;
    }

    const { userId, packageId, tokens } = payload;
    if (!userId || !packageId || !Number.isInteger(tokens) || tokens <= 0) {
      return;
    }

    const pack = getPackageById(packageId);
    if (!pack || pack.tokens !== tokens) {
      return;
    }

    const timestamp = Date.now();
    const paymentId = payment.telegram_payment_charge_id;
    const txBaseRef = db.ref(`users/${userId}/transactions`);
    const txRef = txBaseRef.child(paymentId);
    const txSnap = await txRef.get();

    // Idempotency guard: Telegram may retry updates.
    if (txSnap.exists()) {
      return;
    }

    const coinsRef = db.ref(`users/${userId}/coins`);
    await coinsRef.transaction((current) => {
      const coins = current ?? DEFAULT_COINS;
      return {
        ...coins,
        balance: (coins.balance ?? 0) + tokens,
        totalEarned: (coins.totalEarned ?? 0) + tokens,
        lastUpdated: timestamp
      };
    });

    await txRef.set({
      type: "stars_purchase",
      packageId,
      tokensReceived: tokens,
      starsAmount: payment.total_amount,
      currency: payment.currency,
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
      providerPaymentChargeId: payment.provider_payment_charge_id,
      timestamp
    });

    const historyRef = db.ref(`users/${userId}/purchaseHistory`);
    const historySnap = await historyRef.get();
    const history = Array.isArray(historySnap.val()) ? historySnap.val() : [];
    history.push({
      itemId: packageId,
      price: payment.total_amount,
      tokens,
      type: "stars_purchase",
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
      timestamp
    });
    await historyRef.set(history);
  });
}
