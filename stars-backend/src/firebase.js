import admin from "firebase-admin";
import { config } from "./config.js";

function parseServiceAccount() {
  try {
    return JSON.parse(config.firebaseServiceAccountJson);
  } catch (error) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON string"
    );
  }
}

const serviceAccount = parseServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebaseDatabaseUrl
  });
}

export const db = admin.database();
export { admin };
