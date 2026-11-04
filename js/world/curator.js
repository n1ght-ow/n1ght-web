const KEY = "night:world-curator:v2";
const LEGACY = ["night:creation-desk:v1", "night:curator-desk:v1", "night:wandering-room:v1"];
const SLOTS = [
  { key: "photo-1", label: "照片一", category: "photo", kind: "photo" },
  { key: "photo-2", label: "照片二", category: "photo", kind: "photo" },
  { key: "photo-3", label: "照片三", category: "photo", kind: "photo" },
  { key: "book", label: "书", category: "books", kind: "book" },
  { key: "film", label: "电影", category: "films", kind: "film" },
  { key: "series", label: "剧集", category: "series", kind: "series" },
  { key: "music", label: "音乐", category: "music", kind: "music" },
];
const LEGACY_KEYS = {
  "photo-1": ["photo", "photo1"], "photo-2": ["photo2"], "photo-3": ["photo3"],
  book: ["book", "books"], film: ["film", "films"], series: ["series"], music: ["music", "song"],
};
const LEGACY_ORDER = ["photo", "photo2", "photo3", "book", "film", "series", "music"];
const GLYPHS = { photo: "光", book: "书", film: "影", series: "续", music: "声" };
const LAYOUTS = new Set(["light-rail", "contact-sheet", "deep-index"]);

const txt = (value) => value == null ? "" : String(value);
const blank = () => ({ version: 2, slots: SLOTS.map(() => ""), name: "", byline: "", note: "", layout: "light-rail" });
const sourceFor = (item, thumb = false) => !item ? "" : txt(thumb ? item.thumb || item.image : item.image || item.thumb);
const itemText = (item) => [item.id, item.title, item.subtitle, item.text, item.meta,
  item.originalFields ? Object.values(item.originalFields).flat().map(txt).join(" ") : ""].join(" ").toLocaleLowerCase();

function loadImage(src, timeout = 12000) {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const image = new Image();
    let done = false;
    const timer = setTimeout(() => finish(new Error("图像等待超时：" + src)), timeout);
    function finish(error) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (error) reject(error); else resolve(image);
    }
    image.onload = () => finish();
    image.onerror = () => finish(new Error("图像加载失败：" + src));
    image.decoding = "async";
    image.src = src;
  });
}

function fit(ctx, image, x, y, width, height, cover = true) {
  if (!image?.naturalWidth || !image?.naturalHeight) {
    ctx.fillStyle = "#172527";
    ctx.fillRect(x, y, width, height);
    return;
  }
  const scale = (cover ? Math.max : Math.min)(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrap(ctx, value, x, y, maxWidth, lineHeight, maxLines = 99) {
  const chars = [...txt(value)];
  let line = "";
  let lineNo = 0;
  for (const char of chars) {
    const test = line + char;
    if (char === "\n" || (line && ctx.measureText(test).width > maxWidth)) {
      ctx.fillText(line, x, y + lineNo * lineHeight);
      line = char === "\n" ? "" : char;
      lineNo += 1;
      if (lineNo >= maxLines) return y + lineNo * lineHeight;
    } else line = test;
  }
  if (line && lineNo < maxLines) {
    ctx.fillText(line, x, y + lineNo * lineHeight);
    lineNo += 1;
  }
  return y + lineNo * lineHeight;
}

export function createCurator({ categories, notify = () => {} }) {
  const root = document.getElementById("curator-dialog");
  if (!root) throw new Error("缺少策展面板");
  const byCategory = new Map(categories.map((category) => [category.id, category]));
  const byItem = new Map();
  categories.forEach((category) => category.items.forEach((item) => byItem.set(category.id + ":" + item.id, item)));
  const $ = (id) => document.getElementById(id);
  const slotsRoot = $("curator-slots");
  const canvas = $("curator-poster");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D 不可用");
  const status = $("curator-status");
  const storage = $("curator-storage");
  const exportButton = $("curator-export");
  const name = $("curator-name");
  const byline = $("curator-by");
  const note = $("curator-note");
  const picker = $("picker-dialog");
  const pickerResults = $("picker-results");
  const pickerSearch = $("picker-search");
  const pickerCount = $("picker-count");
  const pickerMore = $("picker-more");
  let state = blank();
  let ready = false;
  let exporting = false;
  let pickerSlot = -1;
  let pickerLimit = 30;
  let pickerReturn = null;
  let previewTimer = 0;
  let previewTicket = 0;
  let saveTimer = 0;

  const itemAt = (index) => state.slots[index]
    ? byItem.get(SLOTS[index].category + ":" + state.slots[index]) || null
    : null;
  const items = () => SLOTS.map((_, index) => itemAt(index));
  const complete = () => items().every(Boolean);
  const itemsFor = (snapshot) => SLOTS.map((slot, index) => snapshot.slots[index]
    ? byItem.get(slot.category + ":" + snapshot.slots[index]) || null
    : null);
  const completeFor = (snapshot) => itemsFor(snapshot).every(Boolean);

  function legacyCategory(value) {
    const key = txt(value).toLocaleLowerCase();
    if (key.startsWith("photo")) return "photo";
    if (key === "book" || key === "books") return "books";
    if (key === "film" || key === "films") return "films";
    if (key === "series") return "series";
    if (key === "music" || key === "song") return "music";
    return "";
  }

  function migrateLegacyPicks(stored) {
    const slots = SLOTS.map(() => "");
    const usedKeys = new Set();
    const order = Array.isArray(stored.order) ? stored.order.map(txt) : [];
    const entries = order.length ? order.concat(LEGACY_ORDER) : LEGACY_ORDER;
    entries.forEach((entry) => {
      const category = legacyCategory(entry);
      if (!category) return;
      const candidateKeys = [entry, ...Object.values(LEGACY_KEYS).flat()]
        .filter((key, index, all) => all.indexOf(key) === index)
        .filter((key) => !usedKeys.has(key))
        .filter((key) => byCategory.get(category)?.items.some((item) => String(item.id) === String(stored.picks?.[key])));
      const sourceKey = candidateKeys.find((key) => stored.picks?.[key] != null);
      if (!sourceKey) return;
      const target = SLOTS.findIndex((slot, index) => slot.category === category && !slots[index]);
      if (target < 0) return;
      slots[target] = String(stored.picks[sourceKey]);
      usedKeys.add(sourceKey);
    });
    return slots;
  }

  function announce(message, error = false) {
    status.textContent = message;
    status.style.color = error ? "var(--danger)" : "";
    notify(message, error);
  }

  function restore() {
    let stored = null;
    let source = "";
    try {
      stored = JSON.parse(localStorage.getItem(KEY) || "null");
      if (stored) source = KEY;
    } catch {}
    if (!stored) {
      for (const key of LEGACY) {
        try {
          const candidate = JSON.parse(localStorage.getItem(key) || "null");
          if (candidate && typeof candidate === "object") {
            stored = candidate;
            source = key;
            break;
          }
        } catch {}
      }
    }
    if (!stored) return;
    const next = blank();
    if (Array.isArray(stored.slots)) {
      next.slots = SLOTS.map((slot, index) => {
        const id = txt(stored.slots[index]);
        return byItem.has(slot.category + ":" + id) ? id : "";
      });
    } else if (stored.picks) {
      next.slots = migrateLegacyPicks(stored);
    }
    const photos = new Set();
    next.slots = next.slots.map((id, index) => {
      if (!id || SLOTS[index].kind !== "photo") return id;
      if (photos.has(id)) return "";
      photos.add(id);
      return id;
    });
    next.name = txt(stored.name || stored.title).slice(0, 48);
    next.byline = txt(stored.byline || stored.by).slice(0, 32);
    next.note = txt(stored.note).slice(0, 160);
    const aliases = { gallery: "light-rail", contact: "contact-sheet", night: "deep-index" };
    const layout = aliases[stored.layout] || stored.layout;
    next.layout = LAYOUTS.has(layout) ? layout : "light-rail";
    state = next;
    const oldOrder = Array.isArray(stored.order) ? stored.order.map((entry) => txt(entry).toLocaleLowerCase()) : [];
    const orderChanged = oldOrder.length && oldOrder.join("|") !== LEGACY_ORDER.join("|");
    storage.textContent = source === KEY
      ? "已恢复本机草稿"
      : orderChanged
        ? "已恢复旧草稿记录；原版槽位顺序无法等价保留"
        : "已迁移原策展草稿";
  }

  function saveNow() {
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      localStorage.setItem(LEGACY[0], JSON.stringify({
        order: ["photo", "photo2", "photo3", "book", "film", "series", "music"],
        picks: {
          photo: state.slots[0], photo2: state.slots[1], photo3: state.slots[2],
          book: state.slots[3], film: state.slots[4], series: state.slots[5], music: state.slots[6],
        },
        name: state.name, by: state.byline, note: state.note,
        layout: state.layout === "light-rail" ? "gallery" : state.layout === "contact-sheet" ? "contact" : "night",
      }));
      storage.textContent = "草稿已保存 · 可继续替换与导出";
    } catch {
      storage.textContent = "本机存储不可用；导出仍可继续";
    }
  }

  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 180);
  }

  function art(item, kind) {
    const box = document.createElement("span");
    box.className = "curator-slot__art";
    const src = sourceFor(item, true);
    if (src) {
      const image = document.createElement("img");
      image.src = src;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.onerror = () => image.replaceWith(Object.assign(document.createElement("span"), { textContent: GLYPHS[kind] || "N" }));
      box.append(image);
    } else box.textContent = GLYPHS[kind] || "N";
    return box;
  }

  function renderSlots() {
    const fragment = document.createDocumentFragment();
    SLOTS.forEach((slot, index) => {
      const item = itemAt(index);
      const li = document.createElement("li");
      li.className = "curator-slot";
      li.dataset.slot = slot.key;
      const label = document.createElement("span");
      label.className = "curator-slot__label";
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0") + " / " + slot.label;
      const loaded = document.createElement("span");
      loaded.textContent = item ? "已装载" : "待装载";
      label.append(number, loaded);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "curator-slot__pick";
      button.dataset.pickSlot = index;
      button.disabled = exporting;
      button.setAttribute("aria-label", item ? "替换" + slot.label + "：" + item.title : "选择" + slot.label);
      button.append(art(item, slot.kind));
      const title = document.createElement("span");
      title.className = "curator-slot__title";
      title.textContent = item ? item.title : "选择" + slot.label;
      button.append(title);
      li.append(label, button);
      if (item) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "curator-slot__remove";
        remove.dataset.removeSlot = index;
        remove.disabled = exporting;
        remove.setAttribute("aria-label", "移除" + slot.label);
        remove.textContent = "×";
        li.append(remove);
      }
      fragment.append(li);
    });
    slotsRoot.replaceChildren(fragment);
    $("curator-count").textContent = items().filter(Boolean).length + " / 7 已装配";
    exportButton.disabled = !complete() || exporting;
  }

  function setEditingLocked(locked) {
    [name, byline, note, ...root.querySelectorAll('[name="curator-layout"]')].forEach((control) => {
      control.disabled = locked;
    });
    root.querySelector("[data-curator-shuffle]").disabled = locked;
    root.querySelector("[data-curator-reset]").disabled = locked;
    slotsRoot.querySelectorAll("button").forEach((button) => { button.disabled = locked; });
    root.setAttribute("aria-busy", String(locked));
    root.classList.toggle("is-exporting", locked);
  }

  function syncFields() {
    name.value = state.name;
    byline.value = state.byline;
    note.value = state.note;
    const radio = root.querySelector('[name="curator-layout"][value="' + state.layout + '"]');
    if (radio) radio.checked = true;
  }

  function pickerPool() {
    if (pickerSlot < 0) return [];
    const query = pickerSearch.value.trim().toLocaleLowerCase();
    return (byCategory.get(SLOTS[pickerSlot].category)?.items || []).filter((item) => !query || itemText(item).includes(query));
  }

  function renderPicker() {
    const pool = pickerPool();
    const fragment = document.createDocumentFragment();
    pickerCount.textContent = pool.length + " 条记录 · 已显示 " + Math.min(pool.length, pickerLimit);
    if (!pool.length) {
      const empty = document.createElement("p");
      empty.className = "reading-empty";
      empty.textContent = "没有匹配记录。";
      fragment.append(empty);
    }
    pool.slice(0, pickerLimit).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "picker-result";
      button.dataset.pickId = item.id;
      if (String(item.id) === String(state.slots[pickerSlot])) {
        button.classList.add("is-picked");
        button.setAttribute("aria-current", "true");
      }
      const artBox = document.createElement("span");
      artBox.className = "picker-result__art";
      const src = sourceFor(item, true);
      if (src) {
        const image = document.createElement("img");
        image.src = src;
        image.alt = "";
        image.loading = "lazy";
        artBox.append(image);
      } else artBox.textContent = GLYPHS[SLOTS[pickerSlot].kind] || "N";
      const copy = document.createElement("span");
      copy.className = "picker-result__copy";
      const strong = document.createElement("strong");
      strong.textContent = item.title || "未命名记录";
      const meta = document.createElement("small");
      meta.textContent = [item.subtitle, item.meta].filter(Boolean).join(" · ");
      copy.append(strong, meta);
      button.append(artBox, copy);
      fragment.append(button);
    });
    pickerResults.replaceChildren(fragment);
    pickerMore.disabled = pickerLimit >= pool.length;
  }

  function openPicker(index, trigger) {
    if (exporting) return announce("正在保存海报，装配台暂时锁定。");
    pickerSlot = index;
    pickerLimit = 30;
    pickerReturn = trigger || document.activeElement;
    pickerSearch.value = "";
    $("picker-title").textContent = "选择" + SLOTS[index].label;
    renderPicker();
    picker.showModal();
    pickerSearch.focus();
  }

  function choose(itemId, trigger) {
    const slot = SLOTS[pickerSlot];
    if (slot.kind === "photo") {
      const duplicate = state.slots.findIndex((id, index) => index < 3 && index !== pickerSlot && String(id) === String(itemId));
      if (duplicate >= 0) {
        announce("同一张照片只能使用一次。", true);
        return;
      }
    }
    const returnTarget = pickerReturn;
    state.slots[pickerSlot] = String(itemId);
    picker.close();
    renderSlots();
    queueSave();
    queuePreview();
    announce(slot.label + "已装载：" + itemAt(pickerSlot)?.title);
    requestAnimationFrame(() => (returnTarget?.isConnected ? returnTarget : slotsRoot.querySelector('[data-pick-slot="' + pickerSlot + '"]'))?.focus());
  }

  async function imagesFor(selected) {
    const unique = [...new Set(selected.map((item) => sourceFor(item)).filter(Boolean))];
    return new Map(await Promise.all(unique.map(async (src) => {
      try { return [src, await loadImage(src)]; } catch { return [src, null]; }
    })));
  }

  function drawEmpty(snapshot = state) {
    ctx.fillStyle = "#071012"; ctx.fillRect(0, 0, 1200, 1800);
    ctx.strokeStyle = "rgba(188,235,244,.12)"; ctx.lineWidth = 2;
    for (let x = 60; x < 1200; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1800); ctx.stroke(); }
    for (let y = 60; y < 1800; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
    ctx.fillStyle = "#bcebf4"; ctx.font = '400 108px "Instrument Serif", serif'; ctx.fillText("N1GHT CHXN9 / 深档", 92, 230);
    ctx.fillStyle = "#8c9da0"; ctx.font = '400 30px "IBM Plex Mono", monospace'; ctx.fillText("MEMORY FABRICATION BAY", 96, 292);
    ctx.fillStyle = "#e7eeec"; ctx.font = '500 60px "Space Grotesk", "Microsoft YaHei", sans-serif'; ctx.fillText("七件记录，等待装配。", 96, 820);
    ctx.fillStyle = "#e89458"; ctx.fillRect(96, 875, 220, 4);
    ctx.fillStyle = "#8c9da0"; ctx.font = '400 24px "IBM Plex Mono", monospace';
    ctx.fillText("3 PHOTOGRAPHS + BOOK/FILM/SERIES/MUSIC", 96, 934);
    ctx.fillText(String(itemsFor(snapshot).filter(Boolean).length).padStart(2, "0") + " / 07 SLOTS LOADED", 96, 1650);
  }

  function drawRecordList(selected, images, dark) {
    const extras = selected.slice(3);
    extras.forEach((item, index) => {
      const y = 1250 + index * 105;
      const image = images.get(sourceFor(item));
      ctx.fillStyle = dark ? "#e9efec" : "#162225";
      ctx.font = '500 29px "Space Grotesk", "Microsoft YaHei", sans-serif';
      const label = ["BOOK", "FILM", "SERIES", "MUSIC"][index] + "  " + item.title.slice(0, 38);
      ctx.fillText(label, 72, y);
      ctx.fillStyle = dark ? "#748385" : "#687678";
      ctx.font = '400 15px "IBM Plex Mono", monospace';
      ctx.fillText([item.subtitle, item.meta].filter(Boolean).join(" · ").slice(0, 74), 72, y + 25);
      if (image) fit(ctx, image, 940, y - 64, 150, 82, false);
      ctx.strokeStyle = dark ? "rgba(188,235,244,.13)" : "rgba(20,31,33,.15)";
      ctx.beginPath(); ctx.moveTo(72, y + 46); ctx.lineTo(1128, y + 46); ctx.stroke();
    });
  }

  function drawPoster(selected, images, snapshot) {
    const photoItems = selected.slice(0, 3);
    if (snapshot.layout === "light-rail") {
      ctx.fillStyle = "#e8ece8"; ctx.fillRect(0, 0, 1200, 1800);
      ctx.fillStyle = "#12616d"; ctx.fillRect(72, 86, 1056, 2);
      ctx.fillStyle = "#11191b"; ctx.font = '400 24px "IBM Plex Mono", monospace'; ctx.fillText("N1GHT CHXN9 / EXHIBITION 01", 72, 66);
      ctx.font = '500 80px "Space Grotesk", "Microsoft YaHei", sans-serif'; wrap(ctx, snapshot.name || "Untitled Memory", 72, 195, 1040, 84, 2);
      ctx.fillStyle = "#566365"; ctx.font = '400 20px "IBM Plex Mono", monospace'; ctx.fillText((snapshot.byline || "VISITOR-CURATOR").toUpperCase(), 74, 386);
      photoItems.forEach((item, index) => {
        const widths = [470, 260, 300];
        const x = 72 + widths.slice(0, index).reduce((sum, width) => sum + width + 24, 0);
        const y = 470 + (index === 1 ? 28 : 0);
        fit(ctx, images.get(sourceFor(item)), x, y, widths[index], 540, true);
        ctx.fillStyle = "#263234"; ctx.font = '400 16px "IBM Plex Mono", monospace';
        ctx.fillText(item.title.slice(0, 36), x, y + 574);
      });
      drawRecordList(selected, images, false);
      ctx.fillStyle = "#263234"; ctx.font = '400 20px "Space Grotesk", "Microsoft YaHei", sans-serif';
      wrap(ctx, snapshot.note || "Seven records held in one temporary orbit.", 72, 1660, 900, 30, 2);
      ctx.fillStyle = "#12616d"; ctx.fillText("N1GHT CHXN9 / DEEP ARCHIVE", 72, 1750);
    } else if (snapshot.layout === "contact-sheet") {
      ctx.fillStyle = "#0a1012"; ctx.fillRect(0, 0, 1200, 1800);
      ctx.fillStyle = "#bcebf4"; ctx.font = '400 24px "IBM Plex Mono", monospace'; ctx.fillText("CONTACT SHEET / MEMORY 07", 70, 72);
      ctx.fillStyle = "#e89458"; ctx.fillRect(70, 94, 1060, 3);
      ctx.fillStyle = "#edf2ef"; ctx.font = '500 72px "Space Grotesk", "Microsoft YaHei", sans-serif'; wrap(ctx, snapshot.name || "Untitled Memory", 70, 184, 1000, 76, 2);
      ctx.fillStyle = "#7b898b"; ctx.font = '400 19px "IBM Plex Mono", monospace'; ctx.fillText((snapshot.byline || "VISITOR-CURATOR").toUpperCase(), 72, 348);
      photoItems.forEach((item, index) => {
        const x = 70 + index * 360;
        ctx.fillStyle = "#e8ece8"; ctx.fillRect(x, 410, 330, 500);
        fit(ctx, images.get(sourceFor(item)), x + 14, 424, 302, 400, true);
        ctx.fillStyle = "#1a2325"; ctx.font = '400 15px "IBM Plex Mono", monospace'; ctx.fillText("0" + (index + 1) + " / " + item.title.slice(0, 28), x + 15, 870);
      });
      drawRecordList(selected, images, true);
      ctx.fillStyle = "#a7b3b3"; ctx.font = '400 19px "Space Grotesk", "Microsoft YaHei", sans-serif';
      wrap(ctx, snapshot.note || "A contact sheet keeps every imperfect frame before memory edits it.", 70, 1680, 1000, 28, 2);
      ctx.fillStyle = "#687779"; ctx.font = '400 15px "IBM Plex Mono", monospace'; ctx.fillText("N1GHT CHXN9 / DEEP ARCHIVE", 70, 1750);
    } else {
      ctx.fillStyle = "#050809"; ctx.fillRect(0, 0, 1200, 1800);
      ctx.strokeStyle = "rgba(188,235,244,.09)";
      for (let y = 75; y < 1800; y += 55) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
      ctx.fillStyle = "#e89458"; ctx.font = '400 22px "IBM Plex Mono", monospace'; ctx.fillText("DEEP INDEX / 00—07", 64, 70);
      ctx.fillStyle = "#f1f4f1"; ctx.font = '400 100px "Instrument Serif", "Songti SC", serif'; wrap(ctx, snapshot.name || "Untitled Memory", 64, 215, 1050, 104, 2);
      ctx.fillStyle = "#bcebf4"; ctx.font = '400 18px "IBM Plex Mono", monospace'; ctx.fillText((snapshot.byline || "NO CURATOR RECORDED").toUpperCase(), 68, 430);
      const positions = [[64, 505, 336, 650], [424, 505, 336, 490], [424, 1019, 336, 420], [784, 505, 352, 500]];
      photoItems.forEach((item, index) => {
        const [x, y, width, height] = positions[index];
        fit(ctx, images.get(sourceFor(item)), x, y, width, height, true);
        ctx.fillStyle = "#bcebf4"; ctx.font = '400 14px "IBM Plex Mono", monospace'; ctx.fillText("0" + (index + 1) + " / " + item.title.slice(0, 34), x, y + height + 27);
      });
      drawRecordList(selected, images, true);
      ctx.fillStyle = "#95a4a5"; ctx.font = '400 19px "Space Grotesk", "Microsoft YaHei", sans-serif';
      wrap(ctx, snapshot.note || "Memory is indexed twice: once by the archive, once by the visitor.", 64, 1690, 1040, 28, 2);
    }
    canvas.setAttribute("aria-label", (snapshot.name || "未命名展览") + "，" + snapshot.layout + " 版式，含三张照片和四类记录。");
  }

  async function renderPreview({ force = false, ticket = null } = {}) {
    if (!ready) return;
    const runTicket = ticket ?? ++previewTicket;
    if (runTicket !== previewTicket) return;
    const snapshot = structuredClone(state);
    const selected = itemsFor(snapshot);
    exportButton.disabled = !completeFor(snapshot) || exporting;
    if (!completeFor(snapshot)) return drawEmpty(snapshot);
    try {
      const images = await imagesFor(selected);
      await document.fonts?.ready;
      if (runTicket !== previewTicket) return;
      drawPoster(selected, images, snapshot);
      if (force) announce("预览已更新；导出会再次等待字体与全部图像。");
    } catch (error) {
      if (runTicket === previewTicket) announce("预览失败：" + error.message, true);
    }
  }

  function queuePreview() {
    const ticket = ++previewTicket;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => renderPreview({ ticket }), 140);
  }

  async function exportPng() {
    if (exporting || !complete()) return;
    const snapshot = structuredClone(state);
    const selected = itemsFor(snapshot);
    exporting = true;
    setEditingLocked(true);
    exportButton.disabled = true;
    previewTicket += 1;
    clearTimeout(previewTimer);
    announce("正在准备字体与图像，随后保存 1200 × 1800 PNG…");
    try {
      await document.fonts?.ready;
      const images = await imagesFor(selected);
      const missing = selected.filter((item) => {
        const source = sourceFor(item);
        return source && !images.get(source);
      });
      drawPoster(selected, images, snapshot);
      if (missing.length) throw new Error("有 " + missing.length + " 个图像未能加载，未生成不完整文件");
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("浏览器没有返回 PNG 数据");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = (snapshot.name || "N1GHT CHXN9-exhibition").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 54) + ".png";
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      announce("PNG 已生成并开始下载。可切换版面继续导出。");
    } catch (error) {
      announce("导出失败：" + error.message + "。可重试或继续修改。", true);
    } finally {
      exporting = false;
      renderSlots();
      setEditingLocked(false);
    }
  }

  function shuffle() {
    if (exporting) return announce("PNG 生成完成后才能重新装配。");
    const next = blank();
    const usedPhotos = new Set();
    for (let index = 0; index < 3; index += 1) {
      const pool = byCategory.get("photo")?.items.filter((item) => !usedPhotos.has(String(item.id))) || [];
      const item = pool[Math.floor(Math.random() * pool.length)];
      if (item) { next.slots[index] = String(item.id); usedPhotos.add(String(item.id)); }
    }
    ["books", "films", "series", "music"].forEach((category, index) => {
      const pool = byCategory.get(category)?.items || [];
      if (pool.length) next.slots[index + 3] = String(pool[Math.floor(Math.random() * pool.length)].id);
    });
    Object.assign(next, { name: state.name, byline: state.byline, note: state.note, layout: state.layout });
    state = next; renderSlots(); queueSave(); queuePreview(); announce("已从馆藏中随机装载七件记录。");
  }

  function reset() {
    if (exporting) return;
    state = blank(); syncFields(); renderSlots(); drawEmpty(); queueSave();
    slotsRoot.querySelector("[data-pick-slot]")?.focus();
    announce("装配台已清空。选择七件记录重新开始。");
  }

  slotsRoot.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-slot]");
    if (remove) {
      const index = Number(remove.dataset.removeSlot);
      state.slots[index] = ""; renderSlots(); queueSave(); queuePreview();
      slotsRoot.querySelector('[data-pick-slot="' + index + '"]')?.focus();
      return announce(SLOTS[index].label + "已移除。");
    }
    const pick = event.target.closest("[data-pick-slot]");
    if (pick) openPicker(Number(pick.dataset.pickSlot), pick);
  });
  [[name, "name", 48], [byline, "byline", 32], [note, "note", 160]].forEach(([input, key, limit]) => {
    input.addEventListener("input", () => {
      state[key] = input.value.slice(0, limit);
      queueSave(); queuePreview();
    });
  });
  root.querySelectorAll('[name="curator-layout"]').forEach((radio) => radio.addEventListener("change", () => {
    if (!radio.checked) return;
    state.layout = radio.value; queueSave(); queuePreview();
    announce("已切换为" + radio.nextElementSibling.textContent + "版面。");
  }));
  root.querySelector("[data-curator-shuffle]").addEventListener("click", shuffle);
  root.querySelector("[data-curator-reset]").addEventListener("click", reset);
  exportButton.addEventListener("click", exportPng);
  pickerSearch.addEventListener("input", () => { pickerLimit = 30; renderPicker(); });
  pickerMore.addEventListener("click", () => { pickerLimit += 30; renderPicker(); });
  pickerResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pick-id]");
    if (button) choose(button.dataset.pickId, button);
  });
  picker.addEventListener("close", () => {
    (pickerReturn?.isConnected ? pickerReturn : slotsRoot.querySelector('[data-pick-slot="' + pickerSlot + '"]'))?.focus({ preventScroll: true });
  });
  window.addEventListener("pagehide", () => { if (ready) saveNow(); });

  restore(); syncFields(); renderSlots(); drawEmpty(); ready = true; queuePreview();
  return {
    open() { if (!root.open) { root.showModal(); renderPreview(); slotsRoot.querySelector("[data-pick-slot]")?.focus(); } },
    close() { if (root.open) root.close(); },
    state: () => structuredClone(state),
    complete,
  };
}
