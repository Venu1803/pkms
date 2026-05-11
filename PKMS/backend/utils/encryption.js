const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function encrypt(text) {
  const masterKey = process.env.MASTER_KEY;
  if (!masterKey || masterKey.length < 32) {
    const msg =
      "MASTER_KEY is not configured properly. It must be at least 32 characters long.";
    console.error(msg);
    throw new Error(msg);
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(
    masterKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    "sha512",
  );

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decrypt(encryptedData) {
  try {
    const masterKey = process.env.MASTER_KEY;
    if (!masterKey || masterKey.length < 32) {
      throw new Error("MASTER_KEY must be at least 32 characters long");
    }

    const [saltHex, ivHex, authTagHex, encryptedText] =
      encryptedData.split(":");
    if (!saltHex || !ivHex || !authTagHex || !encryptedText) {
      return encryptedData;
    }

    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = crypto.pbkdf2Sync(
      masterKey,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      "sha512",
    );

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error.message);
    return encryptedData;
  }
}

module.exports = { encrypt, decrypt };
