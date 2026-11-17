const SITE_ROOT = new URL("../../", import.meta.url);

export function resolveSiteAsset(source) {
  if (typeof source !== "string" || !source.trim()) return "";
  try {
    const url = new URL(source.trim(), SITE_ROOT);
    return /^(?:https?|data|blob):$/.test(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
