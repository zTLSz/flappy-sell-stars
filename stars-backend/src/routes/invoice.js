import crypto from "crypto";
import { Router } from "express";
import { config } from "../config.js";
import { getPackageById } from "../packages.js";

const AUTH_MAX_AGE_SECONDS = 5 * 60;

function validateInitData(initDataRaw) {
  try {
    if (!initDataRaw || typeof initDataRaw !== "string") {
      return { ok: false, error: "initData is required" };
    }

    const params = new URLSearchParams(initDataRaw);
    const hash = params.get("hash");
    const authDateRaw = params.get("auth_date");
    const userRaw = params.get("user");

    if (!hash || !authDateRaw || !userRaw) {
      return { ok: false, error: "Invalid initData payload" };
    }

    // Reject malformed hash early to avoid timingSafeEqual length exceptions.
    if (!/^[a-fA-F0-9]{64}$/.test(hash)) {
      return { ok: false, error: "initData signature mismatch" };
    }

    const authDate = Number(authDateRaw);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(authDate) || nowSeconds - authDate > AUTH_MAX_AGE_SECONDS) {
      return { ok: false, error: "initData expired" };
    }

    const dataCheckString = Array.from(params.entries())
      .filter(([key]) => key !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(config.botToken)
      .digest();

    const generatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(generatedHash, "utf8"),
      Buffer.from(hash.toLowerCase(), "utf8")
    );

    if (!valid) {
      return { ok: false, error: "initData signature mismatch" };
    }

    const user = JSON.parse(userRaw);
    return {
      ok: true,
      telegramUserId: String(user?.id ?? "")
    };
  } catch {
    return { ok: false, error: "Invalid initData payload" };
  }
}

export function createInvoiceRouter(bot) {
  const router = Router();

  router.post("/create-stars-invoice", async (req, res) => {
    try {
      const { userId, packageId, initData } = req.body ?? {};

      if (!userId || !packageId || !initData) {
        return res.status(400).json({
          error: "userId, packageId and initData are required"
        });
      }

      const initDataValidation = validateInitData(initData);
      if (!initDataValidation.ok) {
        return res.status(401).json({ error: initDataValidation.error });
      }

      if (initDataValidation.telegramUserId !== String(userId)) {
        return res.status(403).json({ error: "userId does not match initData user" });
      }

      const pack = getPackageById(packageId);
      if (!pack) {
        return res.status(404).json({ error: "Package not found" });
      }

      const payload = JSON.stringify({
        userId: String(userId),
        packageId: pack.id,
        tokens: pack.tokens,
        timestamp: Date.now()
      });

      const invoiceUrl = await bot.api.createInvoiceLink(
        pack.label,
        pack.description,
        payload,
        "",
        "XTR",
        [{ label: pack.label, amount: pack.starsPrice }]
      );

      return res.json({ invoiceUrl });
    } catch (error) {
      console.error("Failed to create invoice", error);
      return res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  return router;
}
