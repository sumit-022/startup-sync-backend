export function matchBaseUrl(url: string) {
  try {
    const t = new URL(url);
    return t.origin;
  } catch (err) {
    return false;
  }
}
