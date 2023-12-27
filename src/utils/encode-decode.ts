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
