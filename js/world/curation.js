import { resolveSiteAsset } from "./paths.js?v=1";

export const CURATION_LIMIT = 7;
export const PHOTO_LIMIT = 3;
export const NON_PHOTO_LIMIT = 4;
export const STORAGE_KEY = "night:world-curation:v1";

const CATEGORY_IDS = new Set([
  "photo",
  "books",
  "poems",
  "paintings",
  "sport",
  "series",
  "films",
  "games",
  "curate"
]);

const CATEGORY_LABELS = {
  photo: "摄影",
  books: "书",
  poems: "诗",
  paintings: "画",
  sport: "体育",
  series: "剧集",
  films: "电影",
  games: "游戏",
  curate: "展览"
};

const POSTER = {
  width: 1400,
  height: 2000,
  ivory: "#f3eddf",
  pale: "#e8dfca",
  green: "#173b31",
  greenSoft: "#385b4e",
  muted: "#667169",
  rule: "#b9ad92",
  gold: "#a5814d",
  white: "#fffdf7"
};

function cloneValue(value) {
  if (value == null) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return { ...value };
  }
}

function categoryId(category, item) {
  if (typeof category === "string" && CATEGORY_IDS.has(category)) return category;
  if (category && typeof category.id === "string" && CATEGORY_IDS.has(category.id)) return category.id;
  if (item && typeof item.category === "string" && CATEGORY_IDS.has(item.category)) return item.category;
  return "";
}

function normalizeItem(item, category) {
  if (!item || typeof item !== "object") return null;
  const itemId = String(item.id == null ? "" : item.id).trim();
  const resolvedCategory = categoryId(category, item);
  if (!itemId || !resolvedCategory) return null;
  const copy = cloneValue(item);
  copy.id = itemId;
  copy.category = resolvedCategory;
  copy.title = String(copy.title || copy.name || "");
  copy.meta = String(copy.meta || copy.artist || copy.author || copy.director || "");
  copy.description = String(copy.description || copy.quote || copy.note || copy.alt || "");
  copy.image = typeof copy.image === "string" ? copy.image : "";
  copy.fullImage = typeof copy.fullImage === "string" ? copy.fullImage : copy.image;
  copy.url = typeof copy.url === "string" ? copy.url : "";
  if (!Object.prototype.hasOwnProperty.call(copy, "original")) copy.original = cloneValue(item);
  return copy;
}

function keyFor(category, id) {
  return category + ":" + String(id);
}

function readState() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return [];
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    const entries = Array.isArray(parsed)
      ? parsed
      : parsed && Array.isArray(parsed.items)
        ? parsed.items
        : [];
    const restored = [];
    const keys = new Set();
    let photoCount = 0;
    let nonPhotoCount = 0;
    for (const value of entries) {
      const item = normalizeItem(value, value && value.category);
      if (!item) continue;
      const key = keyFor(item.category, item.id);
      if (keys.has(key) || restored.length >= CURATION_LIMIT) continue;
      if (item.category === "photo" && photoCount >= PHOTO_LIMIT) continue;
      if (item.category !== "photo" && nonPhotoCount >= NON_PHOTO_LIMIT) continue;
      keys.add(key);
      restored.push(item);
      if (item.category === "photo") photoCount += 1;
      else nonPhotoCount += 1;
    }
    return restored;
  } catch (_) {
    return [];
  }
}

function font(size, serif, weight = "400") {
  const family = serif
    ? "Georgia, \"Songti SC\", \"Noto Serif CJK SC\", serif"
    : "\"Helvetica Neue\", Arial, \"Microsoft YaHei\", sans-serif";
  return weight + " " + size + "px " + family;
}

function tokensFor(value) {
  return String(value).replace(/\s+/g, " ").trim().match(/[A-Za-z0-9\u00c0-\u024f]+(?:['’][A-Za-z0-9]+)*|\s+|./gu) || [];
}

function wrappedLines(ctx, value, maxWidth, size, serif, weight) {
  ctx.font = font(size, serif, weight);
  const lines = [];
  let line = "";
  for (const token of tokensFor(value)) {
    const parts = ctx.measureText(token).width > maxWidth ? Array.from(token) : [token];
    for (const part of parts) {
      const candidate = line + part;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line.trimEnd());
        line = part.trimStart();
      } else {
        line = candidate;
      }
    }
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}

function drawWrapped(ctx, value, x, y, maxWidth, size, maxLines, color, serif, weight, minSize, lineHeight) {
  let currentSize = size;
  let lines = wrappedLines(ctx, value, maxWidth, currentSize, serif, weight);
  while (lines.length > maxLines && currentSize > minSize) {
    currentSize -= 1;
    lines = wrappedLines(ctx, value, maxWidth, currentSize, serif, weight);
  }
  if (lines.length > maxLines) lines = lines.slice(0, maxLines);
  ctx.fillStyle = color;
  ctx.font = font(currentSize, serif, weight);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const step = currentSize * (lineHeight || 1.22);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * step));
  return y + Math.max(lines.length, 1) * step;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawTypePanel(ctx, item, x, y, width, height) {
  const clippable = item.category === "books" || item.category === "poems";
  const panel = item.category === "books"
    ? String(item.cloth || POSTER.greenSoft)
    : POSTER.white;
  const ink = item.category === "books"
    ? String(item.ink || POSTER.ivory)
    : POSTER.green;
  ctx.save();
  roundedRect(ctx, x, y, width, height, clippable ? 8 : 16);
  ctx.clip();
  ctx.fillStyle = panel;
  ctx.fillRect(x, y, width, height);

  const inset = Math.max(22, Math.min(width, height) * 0.09);
  ctx.strokeStyle = item.category === "books"
    ? String(item.band || POSTER.gold)
    : POSTER.rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2);

  const label = item.category === "poems"
    ? "诗页"
    : item.category === "books"
      ? "藏书"
      : CATEGORY_LABELS[item.category] || "藏品";
  drawWrapped(ctx, label, x + inset * 1.25, y + inset * 1.25, width - inset * 2.5, 18, 1, ink, false, "600", 14, 1.2);
  drawWrapped(ctx, item.title || "未命名", x + inset * 1.25, y + height * 0.34, width - inset * 2.5, 34, 5, ink, true, "400", 18, 1.28);
  drawWrapped(ctx, item.meta || "", x + inset * 1.25, y + height - inset * 2.2, width - inset * 2.5, 17, 3, ink, false, "400", 12, 1.3);
  ctx.restore();

  ctx.save();
  roundedRect(ctx, x, y, width, height, clippable ? 8 : 16);
  ctx.strokeStyle = POSTER.green;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawArtwork(ctx, item, image, x, y, width, height) {
  if (item.category === "books" || item.category === "poems" || !image) {
    drawTypePanel(ctx, item, x, y, width, height);
    return;
  }
  ctx.save();
  roundedRect(ctx, x, y, width, height, 12);
  ctx.clip();
  ctx.fillStyle = POSTER.green;
  ctx.fillRect(x, y, width, height);
  drawImageCover(ctx, image, x, y, width, height);
  const shade = ctx.createLinearGradient(0, y + height * 0.62, 0, y + height);
  shade.addColorStop(0, "rgba(23,59,49,0)");
  shade.addColorStop(1, "rgba(23,59,49,.35)");
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, width, height);
  ctx.restore();

  ctx.strokeStyle = "rgba(23,59,49,.75)";
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, width, height, 12);
  ctx.stroke();
}

function drawPoster(ctx, entries, options = {}) {
  const { width, height, ivory, green, muted, rule, gold } = POSTER;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = ivory;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = green;
  ctx.fillRect(0, 0, width, 18);

  ctx.strokeStyle = rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(54, 48, width - 108, height - 96);
  ctx.strokeStyle = "rgba(23,59,49,.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(66, 60, width - 132, height - 120);

  drawWrapped(ctx, "N1GHT CHXN9 / PRIVATE COLLECTION", 90, 88, 820, 18, 1, green, false, "600", 14, 1.2);
  const count = String(entries.length).padStart(2, "0");
  ctx.fillStyle = green;
  ctx.font = font(18, false, "600");
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(count + " WORKS", width - 90, 88);
  ctx.textAlign = "left";

  const title = String(options.title || "我的小展览");
  const subtitle = String(options.subtitle || "来自十间藏室的私人收藏");
  const titleEnd = drawWrapped(ctx, title, 90, 126, width - 180, 88, 2, green, true, "400", 54, 1.02);
  const subtitleEnd = drawWrapped(ctx, subtitle, 90, titleEnd + 16, width - 180, 26, 2, muted, false, "400", 18, 1.4);
  const headerBottom = subtitleEnd + 34;
  ctx.fillStyle = rule;
  ctx.fillRect(90, headerBottom, width - 180, 1);

  const contentTop = Math.max(350, headerBottom + 40);
  const contentBottom = 1844;
  const gap = 24;
  const rowGap = 54;
  const firstCount = Math.min(3, entries.length);
  const firstRow = entries.slice(0, firstCount);
  const secondRow = entries.slice(firstCount);
  const rowTotal = secondRow.length ? 2 : 1;
  const rowHeight = (contentBottom - contentTop - rowGap * (rowTotal - 1)) / rowTotal;
  const contentWidth = width - 180;

  function drawRow(row, rowIndex) {
    if (!row.length) return;
    const columns = row.length;
    const cardWidth = Math.min(
      (contentWidth - gap * (columns - 1)) / columns,
      columns === 1 ? 760 : columns === 2 ? 580 : 430
    );
    const totalWidth = cardWidth * columns + gap * (columns - 1);
    const startX = 90 + (contentWidth - totalWidth) / 2;
    const startY = contentTop + rowIndex * (rowHeight + rowGap);
    const artHeight = Math.max(220, rowHeight - 132);
    row.forEach((entry, index) => {
      const x = startX + index * (cardWidth + gap);
      const posterIndex = (rowIndex === 0 ? 0 : firstCount) + index + 1;
      drawArtwork(ctx, entry.item, entry.image, x, startY, cardWidth, artHeight);
      ctx.fillStyle = gold;
      ctx.fillRect(x, startY + artHeight + 18, 32, 3);
      drawWrapped(
        ctx,
        CATEGORY_LABELS[entry.item.category] + " · " + String(posterIndex).padStart(2, "0"),
        x,
        startY + artHeight + 28,
        cardWidth,
        15,
        1,
        muted,
        false,
        "600",
        13,
        1.2
      );
      const titleBottom = drawWrapped(
        ctx,
        entry.item.title || "未命名",
        x,
        startY + artHeight + 48,
        cardWidth,
        columns >= 4 ? 22 : 27,
        2,
        green,
        true,
        "400",
        columns >= 4 ? 15 : 16,
        1.1
      );
      drawWrapped(ctx, entry.item.meta || "", x, Math.min(titleBottom + 2, startY + artHeight + 112), cardWidth, 16, 1, muted, false, "400", 12, 1.2);
    });
  }

  drawRow(firstRow, 0);
  drawRow(secondRow, 1);

  ctx.fillStyle = green;
  ctx.fillRect(66, 1870, width - 132, 64);
  ctx.fillStyle = ivory;
  ctx.font = font(17, false, "600");
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("N1GHT CHXN9", 90, 1902);
  ctx.textAlign = "right";
  ctx.fillText("A SMALL PRIVATE EXHIBITION", width - 90, 1902);
  ctx.textAlign = "left";
}

async function canvasToBlob(canvas) {
  if (typeof canvas.toBlob === "function") {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) return blob;
  }
  if (typeof canvas.toDataURL !== "function") throw new Error("浏览器无法生成海报图像。");
  const dataUrl = canvas.toDataURL("image/png");
  const data = dataUrl.split(",")[1] || "";
  const binary = globalThis.atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: "image/png" });
}

function downloadBlob(blob, filename) {
  const document = globalThis.document;
  const URLObject = globalThis.URL;
  if (!document || !document.body || !URLObject || typeof URLObject.createObjectURL !== "function") return false;
  const url = URLObject.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    globalThis.setTimeout(() => URLObject.revokeObjectURL(url), 30000);
    return true;
  } catch (_) {
    URLObject.revokeObjectURL(url);
    return false;
  }
}

export function createCuration({ onChange } = {}) {
  let entries = readState();
  const imageCache = new Map();

  function snapshot() {
    return entries.map((entry) => cloneValue(entry));
  }

  function notify(action, item) {
    if (typeof onChange !== "function") return;
    try {
      onChange(snapshot(), { action, item: item ? cloneValue(item) : null });
    } catch (_) {
      // A presentation callback must not break selection or storage.
    }
  }

  function persist() {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return false;
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: entries }));
      return true;
    } catch (_) {
      return false;
    }
  }

  function findIndex(id, category) {
    const value = String(id == null ? "" : id);
    const resolvedCategory = categoryId(category, null);
    if (resolvedCategory) return entries.findIndex((entry) => entry.category === resolvedCategory && entry.id === value);
    if (/^[a-z-]+:/i.test(value)) return entries.findIndex((entry) => keyFor(entry.category, entry.id) === value);
    return entries.findIndex((entry) => entry.id === value);
  }

  function getItems() {
    return snapshot();
  }

  function toggle(item, category) {
    const normalized = normalizeItem(item, category);
    if (!normalized) return false;
    const index = entries.findIndex((entry) => entry.category === normalized.category && entry.id === normalized.id);
    if (index >= 0) {
      const [removed] = entries.splice(index, 1);
      persist();
      notify("remove", removed);
      return false;
    }
    if (entries.length >= CURATION_LIMIT) return false;
    if (normalized.category === "photo" && entries.filter((entry) => entry.category === "photo").length >= PHOTO_LIMIT) return false;
    if (normalized.category !== "photo" && entries.filter((entry) => entry.category !== "photo").length >= NON_PHOTO_LIMIT) return false;
    entries.push(normalized);
    persist();
    notify("add", normalized);
    return true;
  }

  function move(id, delta) {
    const from = findIndex(id);
    const step = Math.trunc(Number(delta));
    if (from < 0 || !Number.isFinite(step) || step === 0) return false;
    const to = from + step;
    if (to < 0 || to >= entries.length) return false;
    const [moved] = entries.splice(from, 1);
    entries.splice(to, 0, moved);
    persist();
    notify("move", moved);
    return true;
  }

  function remove(id, category) {
    const index = findIndex(id, category);
    if (index < 0) return false;
    const [removed] = entries.splice(index, 1);
    persist();
    notify("remove", removed);
    return true;
  }

  function clear() {
    const hadItems = entries.length > 0;
    entries = [];
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch (_) {
      // In-memory state is cleared even when the browser denies storage.
    }
    if (hadItems) notify("clear", null);
    return true;
  }

  function has(id, category) {
    return findIndex(id, category) >= 0;
  }

  function loadImage(source) {
    if (!source || typeof globalThis.Image !== "function") return Promise.resolve(null);
    if (!imageCache.has(source)) {
      const pending = new Promise((resolve) => {
        const image = new globalThis.Image();
        let settled = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          globalThis.clearTimeout(timer);
          image.onload = null;
          image.onerror = null;
          resolve(value);
        };
        const timer = globalThis.setTimeout(() => finish(null), 8000);
        image.onload = () => finish(image);
        image.onerror = () => finish(null);
        image.decoding = "async";
        image.src = resolveSiteAsset(source) || source;
      });
      imageCache.set(source, pending);
      pending.then((image) => {
        if (!image && imageCache.get(source) === pending) imageCache.delete(source);
      });
    }
    return imageCache.get(source);
  }

  async function waitForFonts() {
    const ready = globalThis.document?.fonts?.ready;
    if (!ready) return;
    await Promise.race([
      ready.catch(() => null),
      new Promise((resolve) => globalThis.setTimeout(resolve, 2500))
    ]);
  }

  async function exportPNG({ title, subtitle } = {}) {
    const selected = snapshot();
    if (!selected.length) throw new Error("请先选择至少一件作品，再导出海报。");
    const document = globalThis.document;
    if (!document || typeof document.createElement !== "function") throw new Error("当前环境无法创建 PNG 海报。");
    await waitForFonts();
    const canvas = document.createElement("canvas");
    canvas.width = POSTER.width;
    canvas.height = POSTER.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器无法初始化海报画布。");

    const prepared = await Promise.all(selected.map(async (item) => ({
      item,
      image: await loadImage(item.image || item.fullImage)
    })));
    const failed = prepared.filter((entry) => (entry.item.image || entry.item.fullImage) && !entry.image);
    if (failed.length) {
      failed.forEach((entry) => {
        imageCache.delete(entry.item.image);
        imageCache.delete(entry.item.fullImage);
      });
      const titles = failed.map((entry) => "《" + entry.item.title + "》").join("、");
      throw new Error("有 " + failed.length + " 件作品的图片未能加载：" + titles + "。请检查网络或稍后重试。");
    }
    drawPoster(ctx, prepared, { title, subtitle });

    const blob = await canvasToBlob(canvas);
    const safeTitle = String(title || "我的小展览")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .slice(0, 48);
    if (!downloadBlob(blob, safeTitle + ".png")) throw new Error("海报已经生成，但浏览器无法开始下载，请重试。");
    return blob;
  }

  return {
    getItems,
    toggle,
    move,
    remove,
    clear,
    has,
    exportPNG
  };
}
