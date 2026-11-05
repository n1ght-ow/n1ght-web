import { createCurator } from "./curator.js?v=2";

const PAGE_SIZE = 9;
const READING_PAGE_SIZE = 40;
const ROUTE_ORDER = ["photo", "books", "poems", "paintings", "music", "sport", "series", "films", "games", "curate"];
const ROUTE_META = {
  entry: { title: "引力记忆舱", english: "ORBITAL MEMORY VESSEL", description: "一座围绕引力井航行的私人档案船。" },
  corridor: { title: "连续引航通道", english: "THE TRANSIT SPINE", description: "沿螺旋通道穿过十个停泊口。任何时刻都可返回通道或直接跃迁到另一展区。" },
  photo: { title: "光轨暗房", english: "PHOTOGRAPHY / LIGHT RAIL", description: "照片悬在分岔的光轨之间。横向拖动轨道，选择一张放大，再自由平移与缩放。", operation: "拖动光轨 · 选择 · 放大" },
  books: { title: "悬挑阅览架", english: "BOOKS / OPEN LIBRARY", description: "布面书册安放在开放的悬挑层架上。选取一卷，抽出看书名，再读收藏笔记。", operation: "选书 · 抽取 · 阅读笔记" },
  poems: { title: "诗页庭", english: "POEMS / COURT OF LEAVES", description: "三首原诗，三张静止的诗页。选一首近读诗节，或打开全文，依原来的断行慢慢读。", operation: "选诗 · 近读 · 全文" },
  paintings: { title: "恒光穹殿", english: "PAINTINGS / ETERNAL LIGHT", description: "名作安放在弧形穹龛中。旋转视角，选择画面，查看比例、图像来源与馆藏链接。", operation: "环绕穹龛 · 检查 · 缩放" },
  music: { title: "声纹反应堆", english: "MUSIC / VOICE REACTOR", description: "唱片与声纹光柱围绕核心转动。按十五组声纹筛选，选择曲目，再前往网易云收听。", operation: "旋转唱片 · 分组 · 选择" },
  sport: { title: "竞技观测场", english: "SPORT / OBSERVATION FIELD", description: "队徽悬在看台上方，赛场记录围绕中圈展开。切换主队，查看来源，或进入 MyScore 继续追踪。", operation: "切换队伍 · 检查 · MyScore" },
  series: { title: "连续信号塔", english: "SERIES / SIGNAL TOWER", description: "剧集沿层叠信号结构向上攀爬。选择剧目，检查元数据与原目录来源。", operation: "攀升信号 · 选择 · 元数据" },
  films: { title: "轨道放映厅", english: "FILMS / ORBITAL SCREEN", description: "胶片画格沿弧形推轨排列。移动推轨，选择电影，再打开原始目录。", operation: "移动推轨 · 选片 · 放映" },
  games: { title: "交互试验场", english: "GAMES / TEST PLATFORMS", description: "游戏仓散布在错层平台之间。选择平台，查看发行信息与原始记录。", operation: "旋转平台 · 选择 · 检查" },
  curate: { title: "记忆装配坞", english: "CURATION / FABRICATION BAY", description: "从馆藏选择三张照片，以及书、电影、剧集和音乐各一件，装配成可保存的展览海报。", operation: "七槽装载 · 三种版面 · 保存" },
};
const GLYPHS = { photo: "光", book: "书", poem: "诗", painting: "画", "music-track": "声", music: "声", sport: "竞", series: "续", film: "影", game: "玩" };
const REDUCED_QUERY = window.matchMedia("(prefers-reduced-motion: reduce)");

const $ = (id) => document.getElementById(id);
const text = (value) => value == null ? "" : String(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const app = {
  data: null,
  categories: new Map(),
  route: "entry",
  filtered: [],
  readingFiltered: [],
  page: 0,
  corridorIndex: 0,
  mapReturn: null,
  selected: null,
  visible: [],
  engine: null,
  engineReady: false,
  engineToken: 0,
  routeToken: 0,
  reducedMotion: REDUCED_QUERY.matches,
  motionOverride: false,
  detail: null,
  detailReturn: null,
  readingRoutes: "photo",
  readingPage: 0,
  toastTimer: 0,
  curator: null,
  fallback: false,
};

function categoryItems(id) {
  return app.categories.get(id)?.items || [];
}

function itemSearchText(item) {
  const original = item.originalFields && typeof item.originalFields === "object"
    ? flattenValue(item.originalFields)
    : "";
  return [item.id, item.title, item.subtitle, item.text, item.meta, original].join(" ").toLocaleLowerCase();
}

function flattenValue(value) {
  if (value == null) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return value.slice(0, 80).map(flattenValue).join(" ");
  return Object.entries(value).slice(0, 30).map(([key, entry]) => key + " " + flattenValue(entry)).join(" ");
}

function safeHref(value) {
  const href = text(value).trim();
  if (!href) return "";
  if (href === "myscore/" || href === "/myscore") return "/myscore/";
  if (/^(https?:\/\/|\/|\.\/|\.\.\/|myscore\/|#)/i.test(href)) return href;
  return "";
}

function make(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value != null) node.textContent = value;
  return node;
}

function toast(message, error = false, timeout = 3400) {
  const root = $("toast");
  clearTimeout(app.toastTimer);
  root.textContent = message;
  root.style.borderColor = error ? "var(--danger)" : "var(--ice)";
  root.hidden = false;
  app.toastTimer = setTimeout(() => { root.hidden = true; }, timeout);
}

function setRouteState(message, status = "idle") {
  const root = $("route-state");
  root.classList.toggle("is-busy", status === "busy");
  root.classList.toggle("is-error", status === "error");
  $("route-state-text").textContent = message;
}

function visibleRouteIds() {
  return app.route === "corridor" || app.route === "entry" ? [] : [app.route];
}

function currentSelectedItem() {
  return app.selected?.item || null;
}

function currentItemLinks(item) {
  if (!item) return [];
  const links = [];
  const seen = new Set();
  const add = (label, url, newTab = true, kind = "") => {
    const href = safeHref(url);
    if (!href || seen.has(href)) return;
    seen.add(href);
    links.push({ label: label || "打开原始来源", url: href, newTab, kind });
  };
  if (app.route === "sport") add("打开 MyScore", "myscore/", false, "sports-data");
  if (Array.isArray(item.links)) item.links.forEach((link) => add(link.label, link.url, link.newTab !== false, link.kind));
  add("打开原始记录", item.link, true, "original");
  return links;
}

function updateRouteChrome() {
  const meta = ROUTE_META[app.route] || ROUTE_META.corridor;
  const routeIndex = ROUTE_ORDER.indexOf(app.route);
  document.body.dataset.route = app.route;
  document.body.dataset.scene = app.route;
  $("route-index").textContent = app.route === "corridor" || app.route === "entry"
    ? "00" : String(routeIndex + 1).padStart(2, "0");
  $("route-name").textContent = app.route === "corridor" ? "引航通道" : meta.title;
  $("route-count").textContent = routeIndex >= 0 ? String(routeIndex + 1).padStart(2, "0") : "00";
  $("route-kicker").textContent = app.route === "corridor"
    ? "NAVIGATION SPINE"
    : routeIndex >= 0
      ? "SECTOR " + String(routeIndex + 1).padStart(2, "0") + " / LIVE EXHIBIT"
      : "ORBITAL ARCHIVE";
  $("route-title").textContent = meta.title;
  $("route-english").textContent = meta.english;
  let description = meta.description;
  if (meta.operation) description += "　操作：" + meta.operation;
  $("route-description").textContent = description;
  if (app.route === "corridor") $("route-description").textContent = "拖动环顾螺旋通道，用下方箭头前往停泊口，点击空间门或进入按钮参观。";
  $("dock-track-fill").style.width = routeIndex >= 0 ? ((routeIndex + 1) / ROUTE_ORDER.length * 100) + "%" : "0%";
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("is-current", button.dataset.route === app.route);
    if (button.dataset.route === app.route) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const category = app.categories.get(app.route);
  if (category) {
    const count = category.items.length;
    $("result-summary").textContent = "全量 " + count + " · 当前 " + app.filtered.length + " · 本页 " + app.visible.length;
  }
}

function updatePanel() {
  updateRouteChrome();
  const isCorridor = app.route === "corridor" || app.route === "entry";
  const isCurate = app.route === "curate";
  $("poem-choices").hidden = app.route !== "poems";
  $("browse-tools").hidden = isCorridor || isCurate;
  $("selection-card").hidden = isCorridor || !app.selected;
  $("operation-bar").querySelector("[data-focus-current]").hidden = isCorridor || isCurate;
  $("operation-bar").querySelector("[data-overview]").hidden = isCorridor || isCurate;
  $("operation-bar").querySelector("[data-open-detail]").hidden = isCorridor || isCurate || !app.selected;
  $("operation-bar").querySelector("[data-open-curator]").hidden = !isCurate;
  const currentRouteIndex = ROUTE_ORDER.indexOf(app.route);
  const nextRoute = ROUTE_ORDER[app.route === "corridor" ? app.corridorIndex : currentRouteIndex < 0 ? 0 : (currentRouteIndex + 1) % ROUTE_ORDER.length];
  $("operation-bar").querySelector("[data-next-route]").textContent = (app.route === "corridor" ? "进入 · " : "下一站 · ") + ROUTE_META[nextRoute].title + " →";
  const source = $("primary-source-link");
  const link = currentItemLinks(currentSelectedItem())[0];
  if (link && !isCorridor && !isCurate) {
    source.hidden = false;
    source.href = link.url;
    source.textContent = (app.route === "sport" && link.kind === "sports-data" ? "打开 MyScore" : link.label) + " ↗";
    if (link.newTab) {
      source.target = "_blank";
      source.rel = "noopener";
    } else {
      source.removeAttribute("target");
      source.removeAttribute("rel");
    }
  } else source.hidden = true;
  document.querySelectorAll("[data-prev-item]").forEach((button) => {
    button.disabled = app.route === "entry" || isCurate || (app.route !== "corridor" && !app.filtered.length);
    button.setAttribute("aria-label", app.route === "corridor" ? "前一停泊口" : "上一件记录");
    button.querySelector("small").textContent = app.route === "corridor" ? "前一停泊口" : "上一件";
  });
  document.querySelectorAll("[data-next-item]").forEach((button) => {
    button.disabled = app.route === "entry" || isCurate || (app.route !== "corridor" && !app.filtered.length);
    button.setAttribute("aria-label", app.route === "corridor" ? "下一停泊口" : "下一件记录");
    button.querySelector("small").textContent = app.route === "corridor" ? "下一停泊口" : "下一件";
  });
}

function updateSelectionCard() {
  const item = currentSelectedItem();
  if (!item || app.route === "corridor" || app.route === "entry") {
    $("selection-card").hidden = true;
    return;
  }
  $("selection-card").hidden = false;
  const position = app.filtered.findIndex((entry) => String(entry.id) === String(item.id));
  $("selection-number").textContent = String(position + 1).padStart(2, "0");
  $("selection-meta").textContent = item.meta || item.type || "ARCHIVE RECORD";
  $("selection-title").textContent = item.title || "未命名记录";
  $("selection-subtitle").textContent = item.subtitle || "";
  $("poem-choices").querySelectorAll("button").forEach(button => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.poemIndex) === app.selected?.index));
  });
}

function renderPage({ focusEngine = true } = {}) {
  const pages = Math.max(1, Math.ceil(app.filtered.length / PAGE_SIZE));
  app.page = clamp(app.page, 0, pages - 1);
  const start = app.page * PAGE_SIZE;
  app.visible = app.filtered.slice(start, start + PAGE_SIZE);
  if (app.filtered.length && (!app.selected || !app.filtered.some((item) => String(item.id) === String(app.selected.item.id)))) {
    const local = app.selected ? app.filtered.findIndex((item) => item.id === app.selected.item.id) : 0;
    const selectedIndex = local >= 0 ? local : start;
    app.selected = { item: app.filtered[selectedIndex], index: selectedIndex };
  }
  if (!app.filtered.length) app.selected = null;
  $("page-label").textContent = (app.page + 1) + " / " + pages;
  $("result-summary").textContent = app.filtered.length
    ? "全量 " + categoryItems(app.route).length + " · 当前 " + app.filtered.length + " · 本页 " + app.visible.length
    : "没有匹配记录";
  document.querySelector("[data-page-prev]").disabled = app.page <= 0;
  document.querySelector("[data-page-next]").disabled = app.page >= pages - 1;
  const index = document.createDocumentFragment();
  app.visible.forEach((item, localIndex) => {
    const button = document.createElement("button");
    const globalIndex = start + localIndex;
    button.type = "button";
    button.dataset.index = globalIndex;
    button.textContent = String(globalIndex + 1).padStart(2, "0");
    button.title = item.title || "未命名记录";
    button.setAttribute("aria-label", "选择第 " + (globalIndex + 1) + " 件：" + (item.title || "未命名记录"));
    button.classList.toggle("is-active", app.selected?.index === globalIndex);
    index.append(button);
  });
  $("item-index").replaceChildren(index);
  const poems = document.createDocumentFragment();
  if (app.route === "poems") app.visible.forEach((item, localIndex) => {
    const button = make("button");
    button.type = "button";
    button.dataset.poemIndex = start + localIndex;
    button.append(make("span", "poem-choice__title", item.title), make("small", "", item.author));
    poems.append(button);
  });
  $("poem-choices").replaceChildren(poems);
  updateSelectionCard();
  updatePanel();
  if (focusEngine) syncEngineRoute();
}

function applyFilters({ resetPage = false } = {}) {
  const category = app.categories.get(app.route);
  if (!category) {
    app.filtered = [];
    app.visible = [];
    updatePanel();
    return;
  }
  const query = $("collection-search").value.trim().toLocaleLowerCase();
  const group = $("group-filter").value;
  app.filtered = category.items.filter((item) => {
    if (group && String(item.groupIndex) !== group) return false;
    return !query || itemSearchText(item).includes(query);
  });
  if (resetPage) app.page = 0;
  app.selected = app.filtered.length ? { item: app.filtered[Math.min(app.page * PAGE_SIZE, app.filtered.length - 1)], index: Math.min(app.page * PAGE_SIZE, app.filtered.length - 1) } : null;
  renderPage();
}

function localIndex() {
  if (!app.selected) return -1;
  const start = app.page * PAGE_SIZE;
  return app.selected.index - start;
}

async function syncEngineRoute({ focus = false } = {}) {
  const token = ++app.engineToken;
  if (!app.engineReady || !app.engine) return;
  const route = app.route === "entry" ? "entry" : app.route;
  const items = app.route === "curate" || route === "corridor" || route === "entry" ? [] : app.visible;
  setRouteState("正在接入 " + (ROUTE_META[route]?.title || route), "busy");
  try {
    await Promise.resolve(app.engine.setRoute(route, items));
    if (token !== app.engineToken) return;
    const focusIndex = localIndex();
    if (focus && focusIndex >= 0 && focusIndex < items.length) {
      await invokeEngineFocus(focusIndex);
    }
    if (token === app.engineToken) setRouteState("实时场景已同步");
  } catch (error) {
    if (token === app.engineToken) engineProblem(error);
  }
}

async function focusEngineCurrent() {
  const index = localIndex();
  if (!app.engineReady || !app.engine || index < 0) return;
  await invokeEngineFocus(index);
}

async function invokeEngineFocus(index) {
  if (!app.engineReady || !app.engine) return;
  try { await Promise.resolve(app.engine.focusItem?.(index)); }
  catch (error) { engineProblem(error); }
}

function engineProblem(error) {
  console.error("[NightWorld]", error);
  setRouteState("实时场景受限，目录仍可用", "error");
  $("webgl-fallback-note").hidden = false;
  toast("三维场景遇到问题；可继续使用阅读目录。", true, 5200);
}

function markEngineUnavailable(error) {
  app.engineReady = false;
  app.fallback = true;
  console.error("[NightWorld] engine unavailable", error);
  $("webgl-fallback-note").hidden = false;
  setRouteState("WebGL 不可用 · 阅读模式可用", "error");
}

function navigate(route, { push = true, categoryIndex = 0, preserveFocus = false } = {}) {
  if (!ROUTE_META[route]) route = "corridor";
  if (push && route !== app.route) {
    const hash = route === "entry" ? "" : "#" + route;
    history.pushState({ nightRoute: route }, "", hash || location.pathname + location.search);
  }
  app.route = route;
  closeDialogs();
  if (route === "corridor" || route === "entry") {
    app.corridorIndex = 0;
    app.filtered = [];
    app.visible = [];
    app.selected = null;
    app.page = 0;
    $("collection-search").value = "";
  } else if (route === "curate") {
    app.filtered = [];
    app.visible = [];
    app.selected = null;
    app.page = 0;
  } else {
    if (!preserveFocus) {
      $("collection-search").value = "";
      $("group-filter").value = "";
      app.page = Math.floor(Math.max(0, categoryIndex) / PAGE_SIZE);
    }
    applyFilters({ resetPage: !preserveFocus });
    app.selected = app.filtered.length ? {
      item: app.filtered[clamp(categoryIndex, 0, app.filtered.length - 1)],
      index: clamp(categoryIndex, 0, app.filtered.length - 1),
    } : null;
    app.page = app.selected ? Math.floor(app.selected.index / PAGE_SIZE) : 0;
    renderPage();
  }
  updatePanel();
  if (route === "corridor" || route === "entry") syncEngineRoute();
  if (route === "curate") syncEngineRoute();
  if (push && route !== "entry" && route !== "corridor") {
    setRouteState("已锁定 " + ROUTE_META[route].title);
  }
}

function goRelative(delta) {
  if (app.route === "corridor") {
    app.corridorIndex = (app.corridorIndex + delta + ROUTE_ORDER.length) % ROUTE_ORDER.length;
    app.engine?.advanceCorridor?.(delta);
    updatePanel();
    setRouteState("停泊口 " + (app.corridorIndex + 1) + " · " + ROUTE_META[ROUTE_ORDER[app.corridorIndex]].title);
    return;
  }
  if (!app.filtered.length) return;
  const current = app.selected?.index ?? 0;
  selectIndex((current + delta + app.filtered.length) % app.filtered.length);
}

async function selectIndex(index, { open = false, echoFocus = true } = {}) {
  if (!app.filtered.length) return;
  const normalized = (index + app.filtered.length) % app.filtered.length;
  const targetPage = Math.floor(normalized / PAGE_SIZE);
  const pageChanged = targetPage !== app.page;
  app.selected = { item: app.filtered[normalized], index: normalized };
  app.page = targetPage;
  if (pageChanged) {
    renderPage({ focusEngine: false });
    await syncEngineRoute({ focus: echoFocus });
  } else {
    updateSelectionCard();
    updatePanel();
    document.querySelectorAll("#item-index button").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.index) === normalized);
    });
    if (echoFocus) focusEngineCurrent();
  }
  if (open) openDetail(app.filtered, normalized, document.activeElement);
}

function enterWorld() {
  navigate("corridor");
  setRouteState("沿连续通道前行，或打开地图");
}

async function startEngine() {
  try {
    const module = await import(new URL("./engine.js", import.meta.url) + "?v=4");
    if (typeof module.createWorld !== "function") throw new Error("engine.createWorld 不存在");
    app.engine = await module.createWorld({
      canvas: $("world-canvas"),
      reducedMotion: app.reducedMotion,
      onPortal: (id) => {
        if (ROUTE_META[id]) navigate(id);
      },
      onPick: (index) => {
        const item = app.visible[index];
        if (!item) return toast("三维对象索引已失效，请重新选择。", true);
        const globalIndex = app.page * PAGE_SIZE + index;
        selectIndex(globalIndex, { open: true, echoFocus: false });
      },
      onFocus: (index) => {
        if (!app.visible[index]) return;
        selectIndex(app.page * PAGE_SIZE + index, { echoFocus: false });
      },
      onError: (error) => engineProblem(error),
    });
    app.engineReady = true;
    setRouteState(app.route === "entry" ? "引力核心待命" : "实时场景已接入");
    await syncEngineRoute();
  } catch (error) {
    markEngineUnavailable(error);
  }
}

async function loadCollection() {
  setRouteState("正在读取本地馆藏", "busy");
  try {
    const url = new URL("../../assets/world/collection.json", import.meta.url);
    url.searchParams.set("v", "1");
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    if (!Array.isArray(data.categories)) throw new Error("collection.json 缺少 categories");
    app.data = data;
    app.categories = new Map(data.categories.map((category) => [category.id, category]));
    setupDataUi();
    setRouteState("馆藏已就绪 · 等待场景");
  } catch (error) {
    console.error("[NightWorld] collection", error);
    $("webgl-fallback-note").hidden = false;
    setRouteState("记录读取失败 · 可重试刷新", "error");
    toast("馆藏暂时无法读取；请刷新页面重试。", true, 6200);
  }
}

function setupDataUi() {
  app.data.categories.forEach((category) => {
    const count = document.querySelector('[data-map-count="' + category.id + '"]');
    if (!count) return;
    const label = category.id === "music" ? category.items.length + " 首歌曲"
      : category.id === "photo" ? category.items.length + " 张照片"
      : category.id === "books" ? category.items.length + " 本书"
      : category.id === "poems" ? category.items.length + " 首诗"
      : category.id === "paintings" ? category.items.length + " 幅画"
      : category.id === "sport" ? category.items.length + " 支主队"
      : category.id === "series" ? category.items.length + " 部剧集"
      : category.id === "films" ? category.items.length + " 部电影"
      : category.id === "games" ? category.items.length + " 款游戏"
      : category.items.length + " 条记录";
    count.textContent = label;
  });
  const groups = app.categories.get("music")?.groups || [];
  const select = $("group-filter");
  select.replaceChildren(new Option("全部声纹", ""));
  groups.forEach((group, index) => {
    select.append(new Option((group.zh || group.en || "分组 " + (index + 1)) + " · " + (group.trackCount || ""), String(group.groupIndex ?? index)));
  });
  buildReadingTabs();
  try {
    app.curator = createCurator({ categories: app.data.categories, notify: toast });
  } catch (error) {
    console.error("[NightWorld] curator", error);
    toast("装配台初始化失败；其他记录仍可阅读。", true);
  }
  if (app.route !== "entry" && app.route !== "corridor" && app.route !== "curate") {
    applyFilters({ resetPage: true });
  }
}

function buildReadingTabs() {
  const fragment = document.createDocumentFragment();
  app.data.categories.filter((category) => category.id !== "curate").forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.readingRoute = category.id;
    button.append(make("span", "", ROUTE_META[category.id]?.title || category.title), make("small", "", String(category.items.length)));
    fragment.append(button);
  });
  $("reading-tabs").replaceChildren(fragment);
  app.readingRoutes = ROUTE_ORDER.includes(app.route) && app.route !== "curate" ? app.route : "photo";
  renderReading();
}

function renderReading() {
  const category = app.categories.get(app.readingRoutes);
  if (!category) {
    $("reading-list").replaceChildren(make("p", "reading-empty", "馆藏记录尚未载入。"));
    return;
  }
  const query = $("reading-search").value.trim().toLocaleLowerCase();
  app.readingFiltered = category.items.filter((item) => !query || itemSearchText(item).includes(query));
  const pages = Math.max(1, Math.ceil(app.readingFiltered.length / READING_PAGE_SIZE));
  app.readingPage = clamp(app.readingPage, 0, pages - 1);
  const start = app.readingPage * READING_PAGE_SIZE;
  const visible = app.readingFiltered.slice(start, start + READING_PAGE_SIZE);
  $("reading-count").textContent = app.readingFiltered.length + " RECORDS";
  $("reading-category-title").textContent = ROUTE_META[category.id]?.title || category.title;
  document.querySelectorAll("[data-reading-route]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.readingRoute === app.readingRoutes);
  });
  const list = document.createDocumentFragment();
  visible.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reading-entry";
    button.dataset.readingIndex = start + index;
    const thumb = make("span", "reading-entry__thumb");
    const source = item.thumb || item.image;
    if (source) {
      const image = new Image();
      image.src = source;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.onerror = () => image.replaceWith(make("span", "", GLYPHS[item.type] || "N"));
      thumb.append(image);
    } else thumb.append(make("span", "", GLYPHS[item.type] || "N"));
    const copy = make("span", "reading-entry__copy");
    copy.append(make("strong", "", item.title || "未命名记录"), make("span", "", [item.subtitle, item.meta].filter(Boolean).join(" · ")));
    button.append(thumb, copy);
    list.append(button);
  });
  if (!visible.length) list.append(make("p", "reading-empty", "没有匹配记录。"));
  $("reading-list").replaceChildren(list);
  const pager = document.createDocumentFragment();
  const previous = document.createElement("button");
  previous.type = "button";
  previous.dataset.readingPage = "prev";
  previous.textContent = "←";
  previous.disabled = app.readingPage <= 0;
  const label = make("span", "", (app.readingPage + 1) + " / " + pages);
  const next = document.createElement("button");
  next.type = "button";
  next.dataset.readingPage = "next";
  next.textContent = "→";
  next.disabled = app.readingPage >= pages - 1;
  pager.append(previous, label, next);
  $("reading-pager").replaceChildren(pager);
}

function resetDetailImage() {
  app.detail.image = { scale: 1, x: 0, y: 0, baseWidth: 0, baseHeight: 0 };
  $("image-scale").textContent = "100%";
}

function updateDetailTransform() {
  const image = $("detail-image");
  const state = app.detail?.image;
  if (!state) return;
  image.style.transform = "translate(-50%, -50%) translate(" + state.x + "px, " + state.y + "px) scale(" + state.scale + ")";
  $("image-scale").textContent = Math.round(state.scale * 100) + "%";
}

function fitDetailImage() {
  const image = $("detail-image");
  const stage = $("media-stage");
  if (!app.detail?.image || !image.naturalWidth) return;
  const maxWidth = Math.max(80, stage.clientWidth - 48);
  const maxHeight = Math.max(80, stage.clientHeight - 48);
  const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  app.detail.image.baseWidth = image.naturalWidth * ratio;
  app.detail.image.baseHeight = image.naturalHeight * ratio;
  image.style.width = app.detail.image.baseWidth + "px";
  image.style.height = app.detail.image.baseHeight + "px";
  app.detail.image.scale = 1;
  app.detail.image.x = 0;
  app.detail.image.y = 0;
  updateDetailTransform();
}

function formatField(value) {
  if (value == null || value === "") return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return value.map(formatField).filter(Boolean).join("\n");
  return Object.entries(value).map(([key, entry]) => key + ": " + formatField(entry)).filter((line) => !line.endsWith(": ")).join("\n");
}

function renderDetailItem() {
  const context = app.detail;
  if (!context) return;
  const item = context.items[context.index];
  if (!item) return;
  $("detail-meta").textContent = [ROUTE_META[context.route]?.english || item.type || "ARCHIVE", item.meta].filter(Boolean).join(" · ");
  $("detail-number").textContent = String(context.index + 1).padStart(2, "0");
  $("detail-total").textContent = String(context.items.length).padStart(2, "0");
  $("detail-title").textContent = item.title || "未命名记录";
  $("detail-subtitle").textContent = item.subtitle || "";
  $("detail-text").textContent = item.text || "";
  $("detail-text").hidden = !item.text;
  const fields = document.createDocumentFragment();
  const entries = [["记录类型", item.type], ["原始元数据", item.meta]];
  if (item.originalFields && typeof item.originalFields === "object") {
    Object.entries(item.originalFields).forEach(([key, value]) => {
      if (["text", "meta", "image", "thumb", "links"].includes(key)) return;
      const formatted = formatField(value);
      if (formatted && formatted !== item.meta) entries.push([key, formatted]);
    });
  }
  entries.forEach(([key, value]) => {
    if (!value) return;
    fields.append(make("dt", "", key), make("dd", "", value));
  });
  if (!entries.some(([, value]) => value)) fields.append(make("dt", "", "记录"), make("dd", "", "馆藏条目"));
  $("detail-fields").replaceChildren(fields);
  const linksRoot = document.createDocumentFragment();
  currentItemLinks(item).forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.textContent = link.label + (link.kind === "sports-data" ? "" : " ↗");
    if (link.newTab) {
      anchor.target = "_blank";
      anchor.rel = "noopener";
    }
    linksRoot.append(anchor);
  });
  if (!linksRoot.childNodes.length) linksRoot.append(make("span", "", "此记录没有外部链接。"));
  $("detail-links").replaceChildren(linksRoot);
  document.querySelector("[data-detail-prev]").disabled = context.items.length < 2;
  document.querySelector("[data-detail-next]").disabled = context.items.length < 2;
  resetDetailImage();
  const image = $("detail-image");
  const source = item.image || item.thumb;
  const placeholder = $("media-placeholder");
  const tools = $("media-tools");
  const media = document.querySelector(".detail-media");
  media.querySelector(".poem-reading")?.remove();
  media.classList.toggle("detail-media--poem", context.route === "poems");
  $("media-glyph").textContent = GLYPHS[item.type] || "N";
  $("media-error").hidden = true;
  image.onload = () => {
    placeholder.hidden = true;
    image.hidden = false;
    tools.hidden = false;
    fitDetailImage();
  };
  image.onerror = () => {
    image.hidden = true;
    placeholder.hidden = false;
    tools.hidden = true;
    $("media-error").hidden = false;
  };
  if (source) {
    image.hidden = false;
    image.alt = item.title ? item.title + " 的馆藏图像" : "馆藏图像";
    image.src = source;
    if (image.complete && image.naturalWidth) image.onload();
  } else {
    image.hidden = true;
    image.removeAttribute("src");
    placeholder.hidden = false;
    tools.hidden = true;
  }
  if (context.route === "poems") {
    placeholder.hidden = true;
    $("detail-text").hidden = true;
    const reading = make("article", "poem-reading");
    reading.lang = "en";
    reading.append(make("h3", "", item.title), make("p", "poem-reading__author", [item.author, item.year].filter(Boolean).join(" · ")));
    const stanzas = item.stanzas || item.originalFields?.stanzas;
    if (Array.isArray(stanzas)) stanzas.forEach(lines => reading.append(make("p", "poem-reading__stanza", lines.join("\n"))));
    else reading.append(make("p", "poem-reading__stanza", item.text));
    media.append(reading);
  }
}

function openDetail(items, index, trigger, route = app.route) {
  if (!items?.length || !items[index]) return;
  app.detail = { items, index, route };
  app.detailReturn = trigger || document.activeElement;
  resetDetailImage();
  renderDetailItem();
  const dialog = $("detail-dialog");
  if (!dialog.open) dialog.showModal();
  requestAnimationFrame(() => $("detail-dialog").querySelector("[data-close-dialog]")?.focus());
}

function stepDetail(delta) {
  if (!app.detail?.items.length) return;
  app.detail.index = (app.detail.index + delta + app.detail.items.length) % app.detail.items.length;
  renderDetailItem();
  $("detail-dialog .detail-copy").scrollTop = 0;
}

function closeDialogs() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
}

function openReading() {
  if (!app.data) return toast("馆藏仍在读取，请稍候。", true);
  app.readingRoutes = app.route !== "corridor" && app.route !== "entry" && app.route !== "curate" ? app.route : "photo";
  app.readingPage = 0;
  $("reading-search").value = "";
  renderReading();
  $("reading-dialog").showModal();
  requestAnimationFrame(() => $("reading-tabs").querySelector("button")?.focus());
}

function updateMotionButton() {
  const button = document.querySelector("[data-toggle-motion]");
  button.setAttribute("aria-pressed", String(app.reducedMotion));
  button.setAttribute("aria-label", app.reducedMotion ? "开启环境动效" : "关闭环境动效");
}

function openMap(trigger = document.activeElement) {
  app.mapReturn = trigger?.isConnected && trigger !== document.body ? trigger : $("world-canvas");
  $("map-dialog").showModal();
  requestAnimationFrame(() => $("map-dialog").querySelector("button")?.focus());
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.matches("[data-enter-world], [data-skip-intro]")) {
      event.preventDefault();
      enterWorld();
    } else if (target.matches("[data-go-corridor]")) {
      navigate("corridor");
    } else if (target.matches("[data-route]")) {
      navigate(target.dataset.route);
    } else if (target.matches("[data-open-map]")) {
      openMap(target);
    } else if (target.matches("[data-open-reading]")) {
      openReading();
    } else if (target.matches("[data-close-dialog]")) {
      target.closest("dialog")?.close();
    } else if (target.matches("[data-focus-current]")) {
      focusEngineCurrent();
      toast(currentSelectedItem() ? "已聚焦：" + currentSelectedItem().title : "当前没有可聚焦记录。", !currentSelectedItem());
    } else if (target.matches("[data-overview]")) {
      app.engine?.overview?.();
    } else if (target.matches("[data-poem-index]")) {
      selectIndex(Number(target.dataset.poemIndex));
    } else if (target.matches("[data-open-detail]")) {
      if (app.selected) openDetail(app.filtered, app.selected.index, target);
    } else if (target.matches("[data-open-curator]")) {
      app.curator ? app.curator.open() : toast("装配台尚未就绪。", true);
    } else if (target.matches("[data-prev-item]")) {
      goRelative(-1);
    } else if (target.matches("[data-next-item]")) {
      goRelative(1);
    } else if (target.matches("[data-next-route]")) {
      const routeIndex = ROUTE_ORDER.indexOf(app.route);
      navigate(ROUTE_ORDER[app.route === "corridor" ? app.corridorIndex : routeIndex < 0 ? 0 : (routeIndex + 1) % ROUTE_ORDER.length]);
    } else if (target.matches("[data-toggle-panel]")) {
      const panel = $("route-panel");
      panel.hidden = !panel.hidden;
      target.setAttribute("aria-expanded", String(!panel.hidden));
      target.setAttribute("aria-label", panel.hidden ? "展开展区控件" : "收起展区控件");
      app.engine?.resize?.();
    } else if (target.matches("[data-page-prev]")) {
      if (app.page > 0) { app.page -= 1; app.selected = app.filtered.length ? { item: app.filtered[app.page * PAGE_SIZE], index: app.page * PAGE_SIZE } : null; renderPage(); }
    } else if (target.matches("[data-page-next]")) {
      if ((app.page + 1) * PAGE_SIZE < app.filtered.length) { app.page += 1; app.selected = { item: app.filtered[app.page * PAGE_SIZE], index: app.page * PAGE_SIZE }; renderPage(); }
    } else if (target.matches("[data-image-zoom]")) {
      if (!app.detail?.image) return;
      const direction = target.dataset.imageZoom === "in" ? 1.22 : 1 / 1.22;
      app.detail.image.scale = clamp(app.detail.image.scale * direction, 1, 5);
      if (app.detail.image.scale === 1) { app.detail.image.x = 0; app.detail.image.y = 0; }
      updateDetailTransform();
    } else if (target.matches("[data-image-reset]")) {
      if (!app.detail?.image) return;
      app.detail.image.scale = 1; app.detail.image.x = 0; app.detail.image.y = 0; updateDetailTransform();
    } else if (target.matches("[data-detail-prev]")) {
      stepDetail(-1);
    } else if (target.matches("[data-detail-next]")) {
      stepDetail(1);
    } else if (target.matches("[data-toggle-motion]")) {
      app.motionOverride = true;
      app.reducedMotion = !app.reducedMotion;
      app.engine?.setMotion?.(!app.reducedMotion);
      updateMotionButton();
      toast(app.reducedMotion ? "环境动效已暂停。" : "环境动效已开启。");
    } else if (target.matches("#history-back")) {
      if (app.route === "entry") toast("已经在起始入口。");
      else history.back();
    }
  });

  $("item-index").addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (button) selectIndex(Number(button.dataset.index));
  });
  let filterTimer = 0;
  $("collection-search").addEventListener("input", () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => applyFilters({ resetPage: true }), 110);
  });
  $("group-filter").addEventListener("change", () => applyFilters({ resetPage: true }));
  $("reading-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-reading-route]");
    if (!button) return;
    app.readingRoutes = button.dataset.readingRoute;
    app.readingPage = 0;
    $("reading-search").value = "";
    renderReading();
  });
  $("reading-search").addEventListener("input", () => { app.readingPage = 0; renderReading(); });
  $("reading-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-reading-index]");
    if (!button) return;
    openDetail(app.readingFiltered, Number(button.dataset.readingIndex), button, app.readingRoutes);
  });
  $("reading-pager").addEventListener("click", (event) => {
    const button = event.target.closest("[data-reading-page]");
    if (!button) return;
    app.readingPage += button.dataset.readingPage === "next" ? 1 : -1;
    renderReading();
  });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      if (dialog.id === "map-dialog" && app.mapReturn?.isConnected) app.mapReturn.focus({ preventScroll: true });
      if (dialog.id === "detail-dialog" && app.detailReturn?.isConnected) {
        app.detailReturn.focus({ preventScroll: true });
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
      }
    });
  });

  const stage = $("media-stage");
  let drag = null;
  stage.addEventListener("wheel", (event) => {
    if (!app.detail?.image || $("detail-image").hidden) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1.12 : .89;
    app.detail.image.scale = clamp(app.detail.image.scale * direction, 1, 5);
    if (app.detail.image.scale === 1) { app.detail.image.x = 0; app.detail.image.y = 0; }
    updateDetailTransform();
  }, { passive: false });
  stage.addEventListener("pointerdown", (event) => {
    if (!app.detail?.image || $("detail-image").hidden) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: app.detail.image.x, startY: app.detail.image.y };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    app.detail.image.x = drag.startX + event.clientX - drag.x;
    app.detail.image.y = drag.startY + event.clientY - drag.y;
    updateDetailTransform();
  });
  const endDrag = () => { drag = null; };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("keydown", (event) => {
    if (!app.detail?.image) return;
    const step = 28;
    if (event.key === "+" || event.key === "=") { event.preventDefault(); app.detail.image.scale = clamp(app.detail.image.scale * 1.18, 1, 5); updateDetailTransform(); }
    else if (event.key === "-") { event.preventDefault(); app.detail.image.scale = clamp(app.detail.image.scale / 1.18, 1, 5); updateDetailTransform(); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); app.detail.image.x += step; updateDetailTransform(); }
    else if (event.key === "ArrowRight") { event.preventDefault(); app.detail.image.x -= step; updateDetailTransform(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); app.detail.image.y += step; updateDetailTransform(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); app.detail.image.y -= step; updateDetailTransform(); }
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      app.engine?.resize?.();
      if ($("detail-dialog").open) fitDetailImage();
    }, 120);
  });
  document.addEventListener("visibilitychange", () => {
    app.engine?.setMotion?.(!app.reducedMotion && !document.hidden);
  });
  window.addEventListener("popstate", (event) => {
    const hash = location.hash.replace(/^#/, "");
    const route = event.state?.nightRoute || (ROUTE_META[hash] ? hash : "corridor");
    navigate(route, { push: false });
  });
  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
    const modal = document.querySelector("dialog[open]");
    if (event.key === "Escape") return;
    if (typing) return;
    if (app.route === "entry" && event.key === "Enter") {
      event.preventDefault();
      enterWorld();
    } else if (!modal && (event.key === "m" || event.key === "M")) {
      event.preventDefault(); openMap();
    } else if (!modal && event.key === "/" && app.route !== "corridor" && app.route !== "entry" && app.route !== "curate") {
      event.preventDefault(); $("collection-search").focus();
    } else if (!modal && event.key === "ArrowLeft") {
      event.preventDefault(); goRelative(-1);
    } else if (!modal && event.key === "ArrowRight") {
      event.preventDefault(); goRelative(1);
    }
  });
}

function exposeDiagnostics() {
  Object.defineProperty(window, "NightWorld", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      get route() { return app.route; },
      get selected() {
        const item = currentSelectedItem();
        return item ? Object.freeze({ ...item }) : null;
      },
      get engine() { return app.engine; },
      get ready() { return Boolean(app.data); },
      get page() { return app.page + 1; },
      get visibleIds() { return app.visible.map((item) => item.id); },
      metrics: () => app.engine?.metrics?.() || null,
    }),
  });
}

async function init() {
  bindEvents();
  if (!app.motionOverride) {
    REDUCED_QUERY.addEventListener?.("change", (event) => {
      if (app.motionOverride) return;
      app.reducedMotion = event.matches;
      app.engine?.setMotion?.(!app.reducedMotion);
      updateMotionButton();
    });
  }
  updateMotionButton();
  updatePanel();
  exposeDiagnostics();
  const requestedRoute = location.hash.slice(1);
  const initialRoute = Object.hasOwn(ROUTE_META, requestedRoute) ? requestedRoute : "entry";
  history.replaceState({ nightRoute: initialRoute }, "", location.pathname + location.search + (initialRoute === "entry" ? "" : "#" + initialRoute));
  await loadCollection();
  if (app.data && initialRoute !== "entry") navigate(initialRoute, { push: false });
  startEngine();
}

init();
