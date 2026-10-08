import crypto from "crypto";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Hashes a plaintext password using cryptographic scrypt with a unique random salt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored salt:hash string
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, "hex");
      const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
      resolve(match);
    });
  });
}
