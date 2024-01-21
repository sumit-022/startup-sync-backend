import crypto from "node:crypto";

export function encodeToURL(base64: string): string {
  return base64
    .replace(/\+/g, "-") // Convert '+' to '-'
    .replace(/\//g, "_") // Convert '/' to '_'
    .replace(/=+$/, ""); // Remove ending '='
}

export function decodeFromURL(base64: string): Buffer {
  // Add removed at end '='
  base64 += Array(5 - (base64.length % 4)).join("=");

  base64 = base64
    .replace(/\-/g, "+") // Convert '-' to '+'
    .replace(/\_/g, "/"); // Convert '_' to '/'

  return Buffer.from(base64, "base64");
}

export function validateURL(base64: string): boolean {
  return /^[A-Za-z0-9\-_]+$/.test(base64);
}

export function encrypt(data: string, key: string): string {
  const cipher = crypto.createCipher("aes-256-cbc", key);
  let encryptedData = cipher.update(data, "utf-8", "base64");
  encryptedData += cipher.final("base64");
  return encodeURIComponent(encryptedData);
}

export function decrypt(encryptedData: string, key: string): string {
  encryptedData = decodeURIComponent(encryptedData);
  const decipher = crypto.createDecipher("aes-256-cbc", key);
  let decryptedData = decipher.update(encryptedData, "base64", "utf-8");
  decryptedData += decipher.final("utf-8");
  return decryptedData;
}
