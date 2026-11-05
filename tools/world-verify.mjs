import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const playwrightRoot = 'C:/Users/qsr/.codex/tools/web3d/node_modules/playwright';
const sharp = require('C:/Users/qsr/.codex/tools/web3d/node_modules/sharp');
const { chromium } = require(playwrightRoot);

const root = 'C:/Users/qsr/night-web';
const outputDirectory = join(root, '.work/world-rebuild');
const reviewDirectory = join(root, '.impeccable/review/world');
const collectionPath = join(root, 'assets/world/collection.json');
const systemChromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseUrl = readArgument('--base-url') ?? 'http://127.0.0.1:3100/';
const requestedMode = readArgument('--mode') ?? 'prepare';
const watchLimitMinutes = Number(readArgument('--watch-minutes') ?? 30);
const roomIds = ['photo', 'books', 'poems', 'paintings', 'music', 'sport', 'series', 'films', 'games'];
const expectedCounts = {
  photo: 46,
  books: 16,
  poems: 3,
  paintings: 12,
  music: 534,
  sport: 5,
  series: 36,
  films: 24,
  games: 18,
  curate: 0,
};
const expectedLastItems = {
  photo: 'photo-46',
  books: 'condor',
  poems: 'dickinson',
  paintings: 'bedroom-arles',
  music: '2060301521',
  sport: 'esports',
  series: 'series-36',
  films: 'film-24',
  games: 'fc26',
};
const modelExtension = /\.(?:glb|gltf|bin|obj|fbx|dae|ply|stl|ktx2?|hdr|exr)(?:[?#]|$)/i;

function readArgument(name) {
  const prefix = `${name}=`;
  return process.argv.find(argument => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function safeFilePart(value) {
  return String(value).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'capture';
}

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fileInfo(path) {
  try {
    const info = await stat(path);
    return { path, exists: true, bytes: info.size, modifiedAt: info.mtime.toISOString() };
  } catch {
    return { path, exists: false, bytes: 0, modifiedAt: null };
  }
}

function itemSearchFields(item) {
  return [item.id, item.title, item.subtitle, item.text, item.meta]
    .map(normalizeText)
    .filter(Boolean);
}

function chooseSearchTerm(category, item) {
  const field = category.items.map(candidate => itemSearchFields(candidate).join(' ').toLocaleLowerCase());
  const candidates = [
    normalizeText(item.title),
    normalizeText(item.subtitle),
    normalizeText(item.text),
    normalizeText(item.meta),
    normalizeText(item.id),
  ].filter(value => value.length >= 3);
  for (const candidate of candidates) {
    const normalized = candidate.toLocaleLowerCase();
    const matches = field.filter(text => text.includes(normalized)).length;
    if (matches === 1) return candidate;
  }
  const pieces = candidates.flatMap(candidate => candidate.split(/[，,。；;·|\n]/))
    .map(normalizeText)
    .filter(piece => piece.length >= 6);
  for (const piece of pieces) {
    const normalized = piece.toLocaleLowerCase();
    const matches = field.filter(text => text.includes(normalized)).length;
    if (matches === 1) return piece;
  }
  return candidates[0];
}

async function writeJson(name, value) {
  await writeFile(join(outputDirectory, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function issue(report, area, message, details = null, severity = 'error') {
  report.issues.push({ area, severity, message, details });
}

function check(report, area, name, passed, details = null) {
  report.checks.push({ area, name, passed: Boolean(passed), details });
  return Boolean(passed);
}

async function recoverPage(page) {
  await waitForApp(page);
  await enterWorld(page);
}

async function runGuarded(page, report, area, name, task, { recover = true } = {}) {
  try {
    return await task();
  } catch (error) {
    issue(report, area, name, {
      message: error.message,
      stack: error.stack,
    });
    check(report, area, `${name} completed without infrastructure exception`, false, {
      message: error.message,
    });
    if (recover) {
      try {
        await recoverPage(page);
      } catch (recoveryError) {
        issue(report, area, 'verification page could not recover after guarded failure', {
          message: recoveryError.message,
          stack: recoveryError.stack,
        });
      }
    }
    return null;
  }
}

async function readCollection() {
  const data = JSON.parse(await readFile(collectionPath, 'utf8'));
  return {
    raw: data,
    categories: new Map(data.categories.map(category => [category.id, category])),
  };
}

async function readinessSnapshot(collection) {
  const files = {};
  for (const relativePath of [
    'index.html',
    'css/world.css',
    'js/world/app.js',
    'js/world/engine.js',
    'js/world/rooms-a.js',
    'js/world/rooms-b.js',
    'js/world/curator.js',
    'assets/world/collection.json',
  ]) {
    files[relativePath] = await fileInfo(join(root, relativePath));
  }
  const categories = (collection?.raw.categories ?? []).map(category => ({
    id: category.id,
    title: category.title,
    count: category.items?.length ?? 0,
    expectedCount: expectedCounts[category.id],
    lastId: category.items?.at(-1)?.id ?? null,
    expectedLastId: expectedLastItems[category.id] ?? null,
  }));
  let http = { ok: false, status: null, error: null, title: null };
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(10000) });
    const html = await response.text();
    http = {
      ok: response.ok,
      status: response.status,
      error: null,
      title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null,
    };
  } catch (error) {
    http.error = String(error);
  }
  return {
    capturedAt: new Date().toISOString(),
    baseUrl,
    files,
    http,
    allRuntimeFilesPresent: [
      'js/world/app.js',
      'js/world/engine.js',
      'js/world/rooms-a.js',
      'js/world/rooms-b.js',
      'js/world/curator.js',
    ].every(relativePath => files[relativePath].exists && files[relativePath].bytes > 0),
    categories,
    countsMatch: categories.every(category => category.expectedCount == null || category.count === category.expectedCount),
    lastItemsMatch: categories.every(category => !category.expectedLastId || category.lastId === category.expectedLastId),
  };
}

async function glProbe(browser, label) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  try {
    await page.goto('data:text/html,<canvas id="probe"></canvas>');
    const result = await page.evaluate(() => {
      const canvas = document.getElementById('probe');
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      if (!gl) return { available: false, renderer: null, vendor: null, version: null };
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        available: true,
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        version: gl.getParameter(gl.VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      };
    });
    return { label, ...result, browserVersion: browser.version() };
  } finally {
    await page.close();
  }
}

async function probeRenderers() {
  const result = { bundled: null, systemChrome: null };
  const bundled = await chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
    ],
  });
  try {
    result.bundled = await glProbe(bundled, 'web3d-bundled-chromium');
  } finally {
    await bundled.close();
  }
  if (await exists(systemChromePath)) {
    const chrome = await chromium.launch({
      headless: true,
      executablePath: systemChromePath,
      args: [
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--enable-gpu',
        '--use-angle=d3d11',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--enable-precise-memory-info',
      ],
    });
    try {
      result.systemChrome = await glProbe(chrome, 'installed-google-chrome');
    } finally {
      await chrome.close();
    }
  }
  return result;
}

async function launchPrimary() {
  if (await exists(systemChromePath)) {
    return chromium.launch({
      headless: true,
      executablePath: systemChromePath,
      args: [
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--enable-gpu',
        '--use-angle=d3d11',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--enable-precise-memory-info',
      ],
    });
  }
  return chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--enable-precise-memory-info',
    ],
  });
}

async function installAuditInstrumentation(context) {
  await context.addInitScript(() => {
    const state = {
      listenersAdded: 0,
      listenersRemoved: 0,
      listenerNet: 0,
      webglContextCalls: 0,
      canvasGets: 0,
    };
    Object.defineProperty(window, '__worldAudit', { value: state, configurable: true });
    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (...args) {
      state.listenersAdded += 1;
      state.listenerNet += 1;
      return originalAdd.apply(this, args);
    };
    EventTarget.prototype.removeEventListener = function (...args) {
      state.listenersRemoved += 1;
      state.listenerNet -= 1;
      return originalRemove.apply(this, args);
    };
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      state.canvasGets += 1;
      if (/^webgl2?$/.test(type)) state.webglContextCalls += 1;
      return originalGetContext.call(this, type, ...args);
    };
  });
}

function attachDiagnostics(page, expectedFailures = []) {
  const diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    modelRequests: [],
    imageResponses: [],
    requests: [],
  };
  const expected = request => expectedFailures.some(entry => (
    typeof entry === 'function' ? entry(request) : entry.test?.(request.url()) || entry === request.url()
  ));
  page.on('console', message => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', error => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', request => {
    if (!expected(request)) {
      diagnostics.failedRequests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        error: request.failure()?.errorText ?? 'unknown',
      });
    }
  });
  page.on('request', request => {
    diagnostics.requests.push({ url: request.url(), resourceType: request.resourceType() });
    if (modelExtension.test(new URL(request.url()).pathname)) {
      diagnostics.modelRequests.push({ url: request.url(), resourceType: request.resourceType() });
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      diagnostics.httpErrors.push({ status: response.status(), url: response.url() });
    }
    if (/\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i.test(new URL(response.url()).pathname)) {
      diagnostics.imageResponses.push({ status: response.status(), url: response.url() });
    }
  });
  return diagnostics;
}

async function waitForApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('#world-canvas', { state: 'visible', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

async function enterWorld(page) {
  await page.waitForFunction(() => window.NightWorld?.ready, null, { timeout: 15000 });
  const enter = page.locator('[data-enter-world]').first();
  if (await page.evaluate(() => window.NightWorld.route === 'entry')) await enter.click();
  await page.waitForSelector('#top-hud', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => document.body.dataset.scene !== 'entry', null, { timeout: 15000 });
  await page.waitForTimeout(700);
}

async function visibleText(page, selector) {
  const locator = page.locator(selector).first();
  if (!(await locator.isVisible().catch(() => false))) return '';
  return normalizeText(await locator.textContent());
}

async function waitForRoute(page, routeId) {
  await page.waitForFunction(
    id => document.body.dataset.route === id,
    routeId,
    { timeout: 20000 },
  );
  await page.waitForFunction(id => {
    const engineMetrics = window.NightWorld?.metrics?.();
    const text = document.getElementById('route-state-text')?.textContent ?? '';
    return engineMetrics?.route === id &&
      engineMetrics.routeLoading === false &&
      !/载入|构建|加载|等待/.test(text);
  }, routeId, { timeout: 30000 });
  await page.waitForTimeout(900);
}

async function projectedTargets(page, kind) {
  await page.waitForFunction(() => Boolean(window.NightWorld?.metrics), null, { timeout: 15000 });
  return page.evaluate(targetKind => {
    const canvas = document.getElementById('world-canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    const metrics = window.NightWorld?.metrics?.();
    const entries = targetKind === 'portal' ? metrics?.portals ?? [] : metrics?.picks ?? [];
    return entries.map(entry => {
      const pointElement = document.elementFromPoint(entry.screenX, entry.screenY);
      const withinCanvas = Boolean(
        canvasRect &&
        entry.screenX >= canvasRect.left &&
        entry.screenX <= canvasRect.right &&
        entry.screenY >= canvasRect.top &&
        entry.screenY <= canvasRect.bottom
      );
      return {
        ...entry,
        withinCanvas,
        hitElement: pointElement ? {
          tag: pointElement.tagName,
          id: pointElement.id,
          className: typeof pointElement.className === 'string' ? pointElement.className : '',
        } : null,
        unobstructed: pointElement === canvas,
      };
    });
  }, kind);
}

async function routeDebugSnapshot(page) {
  return page.evaluate(() => {
    let metrics = null;
    try {
      metrics = window.NightWorld?.metrics?.() ?? null;
    } catch (error) {
      metrics = { error: String(error) };
    }
    return {
      domRoute: document.body.dataset.route ?? null,
      domScene: document.body.dataset.scene ?? null,
      nightWorldRoute: window.NightWorld?.route ?? null,
      engineRoute: metrics?.route ?? null,
      routeLoading: metrics?.routeLoading ?? null,
      routeState: document.getElementById('route-state-text')?.textContent?.trim() ?? '',
      routeTitle: document.getElementById('route-title')?.textContent?.trim() ?? '',
      routeName: document.getElementById('route-name')?.textContent?.trim() ?? '',
      pickupCount: metrics?.picks?.length ?? null,
      picks: metrics?.picks ?? [],
      lastPick: metrics?.lastPick ?? null,
      corridorStep: metrics?.corridorStep ?? null,
      dialogOpen: Boolean(document.querySelector('#detail-dialog[open]')),
      selected: window.NightWorld?.selected ?? null,
    };
  });
}

async function clickProjectedPortal(page, routeId) {
  let target = null;
  for (let attempt = 0; attempt < 20 && !target; attempt += 1) {
    const targets = await projectedTargets(page, 'portal');
    target = targets.find(entry => entry.id === routeId && entry.visible && entry.unobstructed);
    if (!target) await page.waitForTimeout(150);
  }
  if (!target) return { clicked: false, reason: 'portal-not-visible' };
  await page.mouse.click(target.screenX, target.screenY);
  await page.waitForTimeout(700);
  return { clicked: true, target, route: await page.evaluate(() => document.body.dataset.route) };
}

async function clickProjectedPick(page) {
  let targets = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    targets = await projectedTargets(page, 'pick');
    if (targets.some(entry => entry.visible && entry.unobstructed)) break;
    await page.waitForTimeout(150);
  }
  const target = targets.find(entry => Number.isInteger(entry.index) && entry.visible && entry.unobstructed);
  if (!target) return { clicked: false, reason: 'pick-not-visible', targets };
  await page.mouse.click(target.screenX, target.screenY);
  await page.waitForTimeout(650);
  const dialogOpen = await page.locator('#detail-dialog[open]').isVisible().catch(() => false);
  return {
    clicked: true,
    target,
    selectionTitle: await visibleText(page, '#selection-title'),
    selectionVisible: await page.locator('#selection-card').isVisible().catch(() => false),
    dialogOpen,
    detailTitle: dialogOpen ? await visibleText(page, '#detail-title') : '',
    lastPick: await page.evaluate(() => window.NightWorld?.metrics?.()?.lastPick ?? null),
    routeDebug: await routeDebugSnapshot(page),
  };
}

async function openMap(page) {
  await page.waitForFunction(() => {
    const world = window.NightWorld;
    const metrics = world?.metrics();
    return world?.ready && metrics && metrics.route === world.route && !metrics.routeLoading;
  }, null, { timeout: 15000 });
  const mapButton = page.locator('[data-open-map]').first();
  await mapButton.waitFor({ state: 'visible', timeout: 10000 });
  await mapButton.click();
  await page.waitForSelector('#map-dialog[open]', { state: 'visible', timeout: 10000 });
}

async function openRouteFromMap(page, routeId) {
  let selected = false;
  for (let attempt = 0; attempt < 3 && !selected; attempt += 1) {
    await openMap(page);
    await page.waitForTimeout(250);
    const stop = page.locator(`#map-dialog [data-route="${routeId}"]`).first();
    await stop.waitFor({ state: 'visible', timeout: 10000 });
    for (let clickAttempt = 0; clickAttempt < 3 && !selected; clickAttempt += 1) {
      const box = await stop.boundingBox();
      if (!box) continue;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
      selected = await page.evaluate(id => document.body.dataset.route === id, routeId);
    }
    if (!selected && await page.locator('#map-dialog[open]').isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }
  }
  if (!selected) throw new Error(`Could not select visible map destination: ${routeId}`);
  await page.waitForSelector('#map-dialog:not([open])', { state: 'attached', timeout: 10000 });
  await waitForRoute(page, routeId);
}

async function goCorridor(page) {
  const corridor = page.locator('[data-go-corridor]').first();
  await corridor.click();
  await waitForRoute(page, 'corridor');
  return visibleText(page, '#route-title');
}

async function canvasMetrics(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('world-canvas');
    const rect = canvas?.getBoundingClientRect();
    const engine = window.NightWorld?.engine;
    let metrics = null;
    try {
      metrics = engine?.metrics?.() ?? null;
    } catch (error) {
      metrics = { metricsError: String(error) };
    }
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    const webgl = gl ? {
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      version: gl.getParameter(gl.VERSION),
    } : null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return {
      rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      visible: Boolean(rect && rect.width > 0 && rect.height > 0),
      metrics,
      webgl,
      route: window.NightWorld?.route ?? document.body.dataset.route ?? null,
      selected: window.NightWorld?.selected ?? null,
      audit: window.__worldAudit ?? null,
      performanceMemory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
      } : null,
      resourceCount: performance.getEntriesByType('resource').length,
    };
  });
}

async function sampleFrames(page, durationMs = 1800) {
  return page.evaluate(duration => new Promise(resolve => {
    const frames = [];
    let previous = performance.now();
    const started = previous;
    function tick(now) {
      frames.push(now - previous);
      previous = now;
      if (now - started >= duration) {
        const sorted = frames.slice(1).sort((a, b) => a - b);
        const average = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
        resolve({
          durationMs: now - started,
          frames: sorted.length,
          fps: sorted.length ? 1000 / average : 0,
          averageFrameMs: average,
          p95FrameMs: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? null,
          longFrames: sorted.filter(value => value > 40).length,
        });
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }), durationMs);
}

async function screenshotWithStats(page, path, selector = null) {
  let buffer;
  if (selector) {
    buffer = await page.locator(selector).first().screenshot({ path });
  } else {
    buffer = await page.screenshot({ path, fullPage: false });
  }
  const stats = await sharp(buffer).stats();
  const metadata = await sharp(buffer).metadata();
  return {
    path,
    width: metadata.width,
    height: metadata.height,
    bytes: buffer.length,
    channelStdev: stats.channels.map(channel => channel.stdev),
    maxStdev: Math.max(...stats.channels.map(channel => channel.stdev)),
  };
}

async function assertRouteVisible(page, report, area, routeId) {
  const actual = await page.evaluate(() => document.body.dataset.route);
  const routeName = await visibleText(page, '#route-name');
  const canvasVisible = await page.locator('#world-canvas').isVisible();
  const passed = actual === routeId && Boolean(routeName) && canvasVisible;
  check(report, area, `route visible: ${routeId}`, passed, { actual, routeName, canvasVisible });
  return passed;
}

async function clickFirstDirectoryItem(page) {
  const first = page.locator('#item-index button').first();
  await first.waitFor({ state: 'visible', timeout: 15000 });
  const label = normalizeText(await first.textContent());
  await first.click();
  const selectedTitle = await visibleText(page, '#selection-title');
  const detailButton = page.locator('[data-open-detail]').first();
  await detailButton.waitFor({ state: 'visible', timeout: 10000 });
  await detailButton.click();
  await page.waitForSelector('#detail-dialog[open]', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(250);
  return { label, selectedTitle };
}

async function closeDetail(page) {
  const close = page.locator('#detail-dialog [data-close-dialog]').first();
  await close.click();
  await page.waitForSelector('#detail-dialog:not([open])', { state: 'attached', timeout: 10000 });
}

async function verifyDetailImage(page) {
  return page.evaluate(() => {
    const image = document.getElementById('detail-image');
    const error = document.getElementById('media-error');
    return {
      imageVisible: Boolean(image && !image.hidden),
      imageComplete: Boolean(image?.complete),
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      errorVisible: Boolean(error && !error.hidden),
    };
  });
}

async function searchLastItem(page, report, area, category) {
  const item = category.items.at(-1);
  const term = chooseSearchTerm(category, item);
  const input = page.locator('#collection-search').first();
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(term);
  await page.waitForTimeout(700);
  const itemIndex = page.locator('#item-index').first();
  await itemIndex.waitFor({ state: 'visible', timeout: 10000 });
  const buttons = itemIndex.locator('button');
  const count = await buttons.count();
  let matchIndex = -1;
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const text = normalizeText([
      await button.textContent(),
      await button.getAttribute('title'),
      await button.getAttribute('aria-label'),
    ].join(' '));
    if (
      count === 1 ||
      text.includes(normalizeText(item.title)) ||
      text.includes(normalizeText(item.subtitle)) ||
      text.includes(normalizeText(term)) ||
      text.includes(normalizeText(item.id))
    ) {
      matchIndex = index;
      break;
    }
  }
  check(report, area, 'last collection item remains searchable', matchIndex >= 0, {
    itemId: item.id,
    title: item.title,
    term,
    resultCount: count,
  });
  if (matchIndex < 0) return false;
  await buttons.nth(matchIndex).click();
  const detailButton = page.locator('[data-open-detail]').first();
  await detailButton.waitFor({ state: 'visible', timeout: 10000 });
  await detailButton.click();
  await page.waitForSelector('#detail-dialog[open]', { state: 'visible', timeout: 15000 });
  const title = await visibleText(page, '#detail-title');
  const subtitle = await visibleText(page, '#detail-subtitle');
  const text = await visibleText(page, '#detail-text');
  const meta = await visibleText(page, '#detail-meta');
  const realMetadata = [item.title, item.subtitle, item.meta]
    .filter(Boolean)
    .every(value => [title, subtitle, meta, text].some(visible => visible.includes(normalizeText(value))));
  check(report, area, 'last item detail shows real metadata', realMetadata, {
    itemId: item.id,
    title,
    subtitle,
    meta,
    text: text.slice(0, 240),
  });
  await closeDetail(page);
  return true;
}

async function verifyLastItemFocus(page, report, area, category) {
  const item = category.items.at(-1);
  const term = chooseSearchTerm(category, item);
  const input = page.locator('#collection-search').first();
  await input.fill(term);
  await page.waitForTimeout(500);
  const buttons = page.locator('#item-index button');
  const count = await buttons.count();
  let chosen = null;
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const text = normalizeText([
      await button.textContent(),
      await button.getAttribute('title'),
      await button.getAttribute('aria-label'),
    ].join(' '));
    if (count === 1 || text.includes(normalizeText(item.title)) || text.includes(normalizeText(term))) {
      chosen = buttons.nth(index);
      break;
    }
  }
  if (!chosen) {
    check(report, area, 'last item 3D focus control reachable', false, { itemId: item.id, reason: 'search result missing' });
    return;
  }
  await chosen.click();
  const projectedFocus = await clickProjectedPick(page);
  check(report, area, 'last item is reachable through a real projected canvas pick', projectedFocus.clicked && projectedFocus.dialogOpen && projectedFocus.detailTitle.includes(normalizeText(item.title)), {
    itemId: item.id,
    projectedFocus,
  });
  if (projectedFocus.dialogOpen) await closeDetail(page);
  const focusButton = page.locator('[data-focus-current]').first();
  await focusButton.click();
  await page.waitForTimeout(1200);
  const selectionVisible = await page.locator('#selection-card').isVisible().catch(() => false);
  const selectionTitle = await visibleText(page, '#selection-title');
  const engineSelected = await page.evaluate(() => window.NightWorld?.selected ?? null);
  check(report, area, 'last item 3D focus reachable through visible controls', selectionVisible && selectionTitle.includes(normalizeText(item.title)), {
    itemId: item.id,
    selectionVisible,
    selectionTitle,
    engineSelected,
  });
}

async function runRoomSequence(page, report, category, viewportLabel) {
  const routeId = category.id;
  const area = `${viewportLabel}/${routeId}`;
  const imageResponseStart = await page.evaluate(() => performance.getEntriesByType('resource').length);
  await openRouteFromMap(page, routeId);
  await assertRouteVisible(page, report, area, routeId);
  await page.waitForTimeout(1800);
  const metricsBefore = await canvasMetrics(page);
  const canvasPath = join(outputDirectory, `test-${safeFilePart(routeId)}-${viewportLabel}.png`);
  const capture = await screenshotWithStats(page, canvasPath);
  check(report, area, 'room renders visible non-uniform frame', capture.maxStdev > 5, capture);
  const imageEntries = await page.evaluate(start => performance.getEntriesByType('resource')
    .slice(start)
    .filter(entry => /\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i.test(new URL(entry.name).pathname))
    .map(entry => ({ name: entry.name, transferSize: entry.transferSize, duration: entry.duration })), imageResponseStart);
  check(report, area, 'room image activity observed where records have images', !category.items.some(item => item.image) || imageEntries.length > 0, {
    imageEntries: imageEntries.slice(0, 20),
  });
  const textureCount = metricsBefore.metrics?.textures?.cached ?? null;
  check(report, area, 'room texture cache reaches loaded state where records have images', !category.items.some(item => item.image) || textureCount == null || textureCount > 0, {
    textureCount,
    metrics: metricsBefore.metrics?.textures ?? null,
  });
  const projectedPick = await clickProjectedPick(page);
  const projectedItem = projectedPick.clicked ? category.items[projectedPick.target.index] : null;
  check(report, area, 'real projected 3D object is clickable on canvas', projectedPick.clicked && projectedPick.dialogOpen, projectedPick);
  if (projectedItem) {
    check(report, area, 'projected 3D pick opens its real record index', projectedPick.detailTitle.includes(normalizeText(projectedItem.title)), {
      index: projectedPick.target.index,
      expectedTitle: projectedItem.title,
      detailTitle: projectedPick.detailTitle,
      lastPick: projectedPick.lastPick,
    });
  }
  let directorySelection = {
    label: 'projected canvas pick',
    selectedTitle: projectedPick.selectionTitle,
  };
  if (!projectedPick.dialogOpen) {
    directorySelection = await clickFirstDirectoryItem(page);
  }
  const detailTitle = await visibleText(page, '#detail-title');
  const chosenItem = projectedItem ?? category.items[0];
  const realTitle = detailTitle.includes(normalizeText(chosenItem.title));
  check(report, area, 'directory selection opens visible real detail', realTitle, {
    chosenId: chosenItem.id,
    expectedTitle: chosenItem.title,
    detailTitle,
    triggerLabel: directorySelection.label,
    selectedTitle: directorySelection.selectedTitle,
  });
  const image = await verifyDetailImage(page);
  if (chosenItem.image || chosenItem.thumb) {
    check(report, area, 'detail image loaded', image.imageVisible && image.imageComplete && image.naturalWidth > 0, {
      ...image,
      routeDebug: await routeDebugSnapshot(page),
    });
    const zoomButton = page.locator('#detail-dialog [data-image-zoom="in"]').first();
    const zoomVisible = await zoomButton.isVisible().catch(() => false);
    if (zoomVisible) {
      await zoomButton.click({ timeout: 5000 });
      await page.waitForTimeout(150);
      const imageScale = await visibleText(page, '#image-scale');
      check(report, area, 'detail image zoom uses visible control', imageScale !== '100%', { imageScale });
    } else {
      check(report, area, 'detail image zoom control is available for a loaded image', false, {
        reason: 'zoom control hidden because detail image did not load',
        image,
      });
    }
  } else {
    check(report, area, 'image-less record uses readable placeholder', !image.imageVisible && !image.errorVisible, image);
  }
  const source = page.locator('#primary-source-link').first();
  if (chosenItem.link || chosenItem.links?.length) {
    check(report, area, 'real source action is visible for linked record', await source.isVisible().catch(() => false), {
      href: await source.getAttribute('href').catch(() => null),
    });
  }
  await closeDetail(page);
  await goCorridor(page);
  const corridorTitle = await visibleText(page, '#route-name');
  await openRouteFromMap(page, routeId);
  await assertRouteVisible(page, report, area, routeId);
  const metricsAfter = await canvasMetrics(page);
  return {
    routeId,
    corridorTitle,
    capture,
    imageEntries,
    metricsBefore,
    metricsAfter,
  };
}

async function runLastItemChecks(page, report, collection, viewportLabel) {
  for (const routeId of roomIds) {
    const category = collection.categories.get(routeId);
    const area = `${viewportLabel}/last/${routeId}`;
    await runGuarded(page, report, area, 'last-item search and focus checks', async () => {
      await openRouteFromMap(page, routeId);
      await searchLastItem(page, report, area, category);
      await verifyLastItemFocus(page, report, area, category);
      await page.locator('#collection-search').fill('');
      await page.waitForTimeout(300);
    });
  }
}

async function runCorridorHistoryAndRapid(page, report) {
  const directUrl = new URL(baseUrl);
  directUrl.searchParams.set('direct-probe', 'films');
  directUrl.hash = 'films';
  await page.goto(directUrl.href, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('#world-canvas', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(900);
  const directRoute = await page.evaluate(() => document.body.dataset.route);
  check(report, 'navigation', 'direct route hash opens its destination', directRoute === 'films', {
    requested: '#films',
    directRoute,
  });
  if (directRoute !== 'films') await enterWorld(page);
  await goCorridor(page);
  const initialCorridorStep = await page.evaluate(() => window.NightWorld?.metrics?.()?.corridorStep ?? null);
  await page.locator('[data-next-item]').click();
  await page.waitForTimeout(700);
  const nextCorridorStep = await page.evaluate(() => window.NightWorld?.metrics?.()?.corridorStep ?? null);
  const nextDockLabel = await visibleText(page, '[data-next-route]');
  check(report, 'navigation', 'corridor next control advances the visible docking step', initialCorridorStep != null && nextCorridorStep === (initialCorridorStep + 1) % 10 && nextDockLabel.includes('悬挑阅览架'), {
    initialCorridorStep,
    nextCorridorStep,
    nextDockLabel,
  });
  await page.locator('[data-next-route]').click();
  await waitForRoute(page, 'books');
  check(report, 'navigation', 'corridor enter control opens the selected book exhibit', await assertRouteVisible(page, report, 'navigation/corridor-enter', 'books'));
  await goCorridor(page);
  const resetCorridorStep = await page.evaluate(() => window.NightWorld?.metrics?.()?.corridorStep ?? null);
  await page.locator('[data-prev-item]').click();
  await page.waitForTimeout(700);
  const previousCorridorStep = await page.evaluate(() => window.NightWorld?.metrics?.()?.corridorStep ?? null);
  check(report, 'navigation', 'corridor previous control wraps to the last docking step', resetCorridorStep === 0 && previousCorridorStep === 9, {
    resetCorridorStep,
    previousCorridorStep,
  });
  await page.locator('[data-next-item]').click();
  await page.waitForTimeout(500);
  await openRouteFromMap(page, 'photo');
  await page.locator('#history-back').click();
  await waitForRoute(page, 'corridor');
  check(report, 'navigation', 'visible history back returns to corridor', await assertRouteVisible(page, report, 'navigation/history', 'corridor'));

  await openRouteFromMap(page, 'books');
  await page.goBack();
  await page.waitForTimeout(1000);
  const afterBack = await page.evaluate(() => ({
    route: document.body.dataset.route,
    url: location.href,
    bodyScene: document.body.dataset.scene,
  }));
  check(report, 'navigation', 'browser history produces a valid scene', ['corridor', 'photo', 'books'].includes(afterBack.route), afterBack);
  await page.goForward();
  await page.waitForTimeout(1000);
  const afterForward = await page.evaluate(() => ({
    route: document.body.dataset.route,
    url: location.href,
    bodyScene: document.body.dataset.scene,
  }));
  check(report, 'navigation', 'browser forward produces a valid scene', Boolean(afterForward.bodyScene), afterForward);

  const attempted = [];
  for (const routeId of ['photo', 'books', 'poems', 'paintings', 'music', 'sport', 'series', 'films', 'games', 'photo']) {
    attempted.push(routeId);
    await openRouteFromMap(page, routeId);
  }
  const settled = await page.evaluate(() => ({
    route: document.body.dataset.route,
    scene: document.body.dataset.scene,
    state: document.getElementById('route-state-text')?.textContent ?? '',
  }));
  check(report, 'navigation', 'rapid direct navigation settles without stale route', settled.route === 'photo' && settled.scene === 'photo', {
    attempted,
    settled,
  });
}

async function runLeakAndFrameAudit(page, report) {
  await openRouteFromMap(page, 'photo');
  await page.waitForTimeout(1000);
  const warm = await canvasMetrics(page);
  const frames = await sampleFrames(page, 2200);
  check(report, 'performance', 'frames continue advancing', frames.frames > 10 && frames.fps > 5, {
    frames,
    renderer: warm.webgl?.renderer,
    software: /swiftshader|llvmpipe|software/i.test(warm.webgl?.renderer ?? ''),
  });
  for (let index = 0; index < 12; index += 1) {
    await openRouteFromMap(page, index % 2 === 0 ? 'books' : 'photo');
  }
  await page.waitForTimeout(1200);
  const after = await canvasMetrics(page);
  const resourcesBefore = {
    textures: warm.metrics?.textures?.cached ?? null,
    geometries: warm.metrics?.scene?.geometries ?? null,
    materials: warm.metrics?.scene?.materials ?? null,
    objects: warm.metrics?.scene?.objects ?? null,
    jsHeap: warm.performanceMemory?.usedJSHeapSize ?? null,
  };
  const resourcesAfter = {
    textures: after.metrics?.textures?.cached ?? null,
    geometries: after.metrics?.scene?.geometries ?? null,
    materials: after.metrics?.scene?.materials ?? null,
    objects: after.metrics?.scene?.objects ?? null,
    jsHeap: after.performanceMemory?.usedJSHeapSize ?? null,
  };
  const textureGrowth = resourcesBefore.textures != null && resourcesAfter.textures != null
    ? resourcesAfter.textures - resourcesBefore.textures
    : null;
  const geometryGrowth = resourcesBefore.geometries != null && resourcesAfter.geometries != null
    ? resourcesAfter.geometries - resourcesBefore.geometries
    : null;
  const materialGrowth = resourcesBefore.materials != null && resourcesAfter.materials != null
    ? resourcesAfter.materials - resourcesBefore.materials
    : null;
  check(report, 'leaks', 'event listener net growth remains bounded after repeated routes', after.audit && Math.abs(after.audit.listenerNet - warm.audit.listenerNet) <= 12, {
    before: warm.audit,
    after: after.audit,
  });
  check(report, 'leaks', 'renderer texture count does not accumulate after repeated routes', textureGrowth == null || textureGrowth <= 8, {
    resourcesBefore,
    resourcesAfter,
    textureGrowth,
    geometryGrowth,
    materialGrowth,
  });
  check(report, 'leaks', 'renderer geometry count does not accumulate after repeated routes', geometryGrowth == null || geometryGrowth <= 16, {
    resourcesBefore,
    resourcesAfter,
    geometryGrowth,
    materialGrowth,
  });
  check(report, 'leaks', 'renderer material count does not accumulate after repeated routes', materialGrowth == null || materialGrowth <= 16, {
    resourcesBefore,
    resourcesAfter,
    materialGrowth,
  });
}

async function chooseCuratorItem(page, slotIndex, category, item) {
  const slot = page.locator(`#curator-dialog [data-pick-slot="${slotIndex}"]`).first();
  await slot.click();
  await page.waitForSelector('#picker-dialog[open]', { state: 'visible', timeout: 10000 });
  const search = page.locator('#picker-search').first();
  await search.fill(chooseSearchTerm(category, item));
  await page.waitForTimeout(450);
  const result = page.locator(`#picker-results [data-pick-id="${item.id}"]`).first();
  if (await result.isVisible().catch(() => false)) {
    await result.click();
  } else {
    const buttons = page.locator('#picker-results button');
    const count = await buttons.count();
    let matched = false;
    for (let index = 0; index < count; index += 1) {
      if (normalizeText(await buttons.nth(index).textContent()).includes(normalizeText(item.title))) {
        await buttons.nth(index).click();
        matched = true;
        break;
      }
    }
    if (!matched) throw new Error(`Curator picker missing ${category.id}:${item.id}`);
  }
  await page.waitForSelector('#picker-dialog:not([open])', { state: 'attached', timeout: 10000 });
}

async function canvasHash(page, selector) {
  const buffer = await page.locator(selector).screenshot();
  return sharp(buffer).resize(120, 180).greyscale().raw().toBuffer()
    .then(bytes => {
      let hash = 2166136261;
      for (const byte of bytes) {
        hash ^= byte;
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    });
}

async function runCurator(page, report, collection) {
  const area = 'curate';
  await openRouteFromMap(page, 'curate');
  const openButton = page.locator('[data-open-curator]').first();
  await openButton.waitFor({ state: 'visible', timeout: 10000 });
  await openButton.click();
  await page.waitForSelector('#curator-dialog[open]', { state: 'visible', timeout: 10000 });
  const slotButtons = page.locator('#curator-dialog [data-pick-slot]');
  check(report, area, 'seven curator slots visible', (await slotButtons.count()) === 7, { count: await slotButtons.count() });

  const choices = [
    ['photo', collection.categories.get('photo').items[0]],
    ['photo', collection.categories.get('photo').items[1]],
    ['photo', collection.categories.get('photo').items.at(-1)],
    ['books', collection.categories.get('books').items.at(-1)],
    ['films', collection.categories.get('films').items.at(-1)],
    ['series', collection.categories.get('series').items.at(-1)],
    ['music', collection.categories.get('music').items.at(-1)],
  ];
  for (let index = 0; index < choices.length; index += 1) {
    const [routeId, item] = choices[index];
    await chooseCuratorItem(page, index, collection.categories.get(routeId), item);
  }
  const countText = await visibleText(page, '#curator-count');
  const exportButton = page.locator('#curator-export');
  check(report, area, 'seven real records fill curator slots', countText.includes('7 / 7') && await exportButton.isEnabled(), {
    countText,
    exportEnabled: await exportButton.isEnabled(),
    ids: choices.map(([routeId, item]) => `${routeId}:${item.id}`),
  });

  const draft = {
    name: '验收记忆展',
    byline: 'Night Verification',
    note: '真实浏览器验收草稿；包含三张照片与四类精选记录。',
  };
  await page.locator('#curator-name').fill(draft.name);
  await page.locator('#curator-by').fill(draft.byline);
  await page.locator('#curator-note').fill(draft.note);
  await page.waitForTimeout(700);
  const hashBefore = await canvasHash(page, '#curator-poster');
  const layoutHashes = {};
  for (const value of ['light-rail', 'contact-sheet', 'deep-index']) {
    const radio = page.locator(`[name="curator-layout"][value="${value}"]`);
    await page.locator('.curator-layout-picker label').filter({ has: radio }).click();
    const selected = await radio.isChecked();
    check(report, area, `curator layout selector is operable: ${value}`, selected, { value, selected });
    await page.waitForTimeout(650);
    layoutHashes[value] = await canvasHash(page, '#curator-poster');
  }
  const distinctHashes = new Set(Object.values(layoutHashes)).size;
  check(report, area, 'all three curator layouts produce distinct live previews', distinctHashes === 3, {
    hashBefore,
    layoutHashes,
    distinctHashes,
  });
  const previewPath = join(outputDirectory, 'test-curate-desktop.png');
  const preview = await screenshotWithStats(page, previewPath);
  check(report, area, 'curator preview is truly visible', preview.maxStdev > 3, preview);

  const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.locator('#curator-export').click();
  const download = await downloadPromise;
  const suggestedName = download.suggestedFilename();
  const exportPath = join(outputDirectory, `test-curator-export-${Date.now()}.png`);
  await download.saveAs(exportPath);
  const exportMetadata = await sharp(exportPath).metadata();
  const exportStats = await sharp(exportPath).stats();
  check(report, area, 'PNG export uses a real 1200x1800 download', exportMetadata.format === 'png' && exportMetadata.width === 1200 && exportMetadata.height === 1800 && Math.max(...exportStats.channels.map(channel => channel.stdev)) > 3, {
    suggestedName,
    exportPath,
    format: exportMetadata.format,
    width: exportMetadata.width,
    height: exportMetadata.height,
    maxStdev: Math.max(...exportStats.channels.map(channel => channel.stdev)),
  });

  await page.waitForTimeout(900);
  const storage = await page.evaluate(() => localStorage.getItem('night:world-curator:v2'));
  check(report, area, 'curator draft is persisted', Boolean(storage), { bytes: storage?.length ?? 0 });
  await page.reload({ waitUntil: 'networkidle' });
  await enterWorld(page);
  await openRouteFromMap(page, 'curate');
  await page.locator('[data-open-curator]').click();
  const restored = {
    name: await page.locator('#curator-name').inputValue(),
    byline: await page.locator('#curator-by').inputValue(),
    note: await page.locator('#curator-note').inputValue(),
    count: await visibleText(page, '#curator-count'),
  };
  check(report, area, 'curator draft restores after reload', restored.name === draft.name && restored.byline === draft.byline && restored.note === draft.note && restored.count.includes('7 / 7'), restored);
}

async function runKeyboard(page, report) {
  const focusDescriptor = () => page.evaluate(() => {
    const element = document.activeElement;
    return element ? {
      tag: element.tagName,
      id: element.id || null,
      className: typeof element.className === 'string' ? element.className : null,
      text: element.textContent?.trim().slice(0, 80) ?? '',
      verifyFocusTarget: element.dataset?.verifyFocusTarget === 'true',
    } : null;
  });
  const keyboardFocusTarget = page.locator('[data-toggle-motion]').first();
  await keyboardFocusTarget.waitFor({ state: 'visible', timeout: 10000 });
  await keyboardFocusTarget.evaluate(element => {
    element.dataset.verifyFocusTarget = 'true';
    element.focus();
  });
  const beforeFocus = await focusDescriptor();
  await page.keyboard.press('m');
  await page.waitForTimeout(150);
  const mapOpen = await page.locator('#map-dialog[open]').isVisible().catch(() => false);
  const focusInsideMap = await page.evaluate(() => document.getElementById('map-dialog')?.contains(document.activeElement));
  await page.keyboard.press('Escape');
  const mapClosed = !(await page.locator('#map-dialog[open]').isVisible().catch(() => false));
  const afterFocus = await focusDescriptor();
  const focusRestored = beforeFocus?.verifyFocusTarget === true && afterFocus?.verifyFocusTarget === true;
  await page.evaluate(() => {
    document.querySelector('[data-verify-focus-target="true"]')?.removeAttribute('data-verify-focus-target');
  });
  check(report, 'keyboard', 'M opens map, Escape closes and restores focus', mapOpen && focusInsideMap && mapClosed && focusRestored, {
    mapOpen,
    focusInsideMap,
    mapClosed,
    beforeFocus,
    afterFocus,
    focusRestored,
  });

  await openRouteFromMap(page, 'poems');
  await page.keyboard.press('/');
  const searchFocused = await page.evaluate(() => document.activeElement?.id === 'collection-search');
  check(report, 'keyboard', 'slash focuses collection search', searchFocused, { searchFocused });
  await page.locator('#collection-search').fill('Rose');
  await page.waitForTimeout(400);
  const itemButton = page.locator('#item-index button').first();
  await itemButton.focus();
  await page.keyboard.press('Enter');
  const detailButton = page.locator('[data-open-detail]').first();
  await detailButton.focus();
  await page.keyboard.press('Enter');
  const detailOpen = await page.locator('#detail-dialog[open]').isVisible().catch(() => false);
  await page.keyboard.press('Escape');
  const detailClosed = !(await page.locator('#detail-dialog[open]').isVisible().catch(() => false));
  const detailFocusRestored = await page.evaluate(() => document.activeElement?.matches?.('[data-open-detail]') ?? false);
  check(report, 'keyboard', 'Enter opens detail and Escape restores trigger focus', detailOpen && detailClosed && detailFocusRestored, {
    detailOpen,
    detailClosed,
    detailFocusRestored,
  });
}

async function touchClick(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Touch target has no bounding box');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function runResponsivePass(browser, report, collection, viewport) {
  const viewportLabel = `${viewport.width}x${viewport.height}`;
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  await installAuditInstrumentation(context);
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  try {
    await waitForApp(page);
    await enterWorld(page);
    const overviewPath = join(outputDirectory, `test-overview-${viewportLabel}.png`);
    const overview = await screenshotWithStats(page, overviewPath);
    const layout = await page.evaluate(() => ({
      innerWidth,
      innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
    }));
    check(report, `responsive/${viewportLabel}`, 'no horizontal overflow', !layout.horizontalOverflow, layout);
    check(report, `responsive/${viewportLabel}`, 'overview renders visible non-uniform frame', overview.maxStdev > 5, overview);

    const mapButton = page.locator('[data-open-map]').first();
    await touchClick(page, mapButton);
    const mapOpen = await page.locator('#map-dialog[open]').isVisible().catch(() => false);
    check(report, `responsive/${viewportLabel}`, 'touch opens map', mapOpen, { mapOpen });
    const mapRect = await page.locator('#map-dialog').boundingBox();
    const mapFits = mapRect && mapRect.x >= -1 && mapRect.y >= -1 && mapRect.x + mapRect.width <= viewport.width + 1 && mapRect.y + mapRect.height <= viewport.height + 1;
    check(report, `responsive/${viewportLabel}`, 'touch map remains within viewport', mapFits, { mapRect });
    await touchClick(page, page.locator('#map-dialog [data-route="photo"]'));
    await waitForRoute(page, 'photo');
    const roomPath = join(outputDirectory, `test-photo-${viewportLabel}.png`);
    const roomCapture = await screenshotWithStats(page, roomPath);
    check(report, `responsive/${viewportLabel}`, 'touch-selected room remains visible', roomCapture.maxStdev > 5, roomCapture);
    check(report, `responsive/${viewportLabel}`, 'no page diagnostics in responsive pass', diagnostics.consoleErrors.length === 0 && diagnostics.pageErrors.length === 0 && diagnostics.failedRequests.length === 0, diagnostics);
  } finally {
    await context.close();
  }
}

async function runReducedMotion(browser, report) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  });
  await installAuditInstrumentation(context);
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  try {
    await waitForApp(page);
    await enterWorld(page);
    await openRouteFromMap(page, 'poems');
    const button = page.locator('[data-toggle-motion]').first();
    const pressed = await button.getAttribute('aria-pressed');
    const frames = await sampleFrames(page, 1200);
    const canvas = await canvasMetrics(page);
    check(report, 'reduced-motion', 'prefers-reduced-motion still renders and remains usable', canvas.visible && frames.frames > 5, {
      pressed,
      frames,
      route: canvas.route,
    });
    await button.click();
    const toggled = await button.getAttribute('aria-pressed');
    check(report, 'reduced-motion', 'visible motion toggle is operable', toggled !== pressed, { before: pressed, after: toggled });
    check(report, 'reduced-motion', 'reduced-motion pass has no uncaught diagnostics', diagnostics.consoleErrors.length === 0 && diagnostics.pageErrors.length === 0 && diagnostics.failedRequests.length === 0, diagnostics);
  } finally {
    await context.close();
  }
}

async function runWebglUnavailable(report) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-webgl', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  try {
    await waitForApp(page);
    const fallbackVisible = await page.locator('#webgl-fallback-note').isVisible().catch(() => false);
    check(report, 'webgl-unavailable', 'no-WebGL fallback is visible', fallbackVisible, { fallbackVisible });
    const openReading = page.locator('#webgl-fallback-note [data-open-reading]');
    if (await openReading.isVisible().catch(() => false)) {
      await openReading.click();
      await page.waitForSelector('#reading-dialog[open]', { state: 'visible', timeout: 10000 });
    }
    const readingVisible = await page.locator('#reading-dialog[open]').isVisible().catch(() => false);
    const tabs = await page.locator('#reading-tabs button').count();
    const records = await page.locator('#reading-list a, #reading-list button').count();
    check(report, 'webgl-unavailable', 'content remains available without WebGL', readingVisible && tabs >= 9 && records > 0, {
      readingVisible,
      tabs,
      records,
    });
    check(report, 'webgl-unavailable', 'expected fallback has no unexpected page errors', diagnostics.pageErrors.length === 0, diagnostics);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runFailedImage(browser, report, collection) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  await installAuditInstrumentation(context);
  const expected = [request => request.resourceType() === 'image' && /\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i.test(new URL(request.url()).pathname)];
  const page = await context.newPage();
  await page.route(/\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i, route => route.abort('failed'));
  const diagnostics = attachDiagnostics(page, expected);
  try {
    await waitForApp(page);
    await enterWorld(page);
    await openRouteFromMap(page, 'paintings');
    await page.locator('#collection-search').fill('阿尔勒的卧室');
    await page.waitForTimeout(700);
    const first = page.locator('#item-index button').first();
    await first.click();
    const detailButton = page.locator('[data-open-detail]').first();
    await detailButton.waitFor({ state: 'visible', timeout: 10000 });
    await detailButton.click();
    await page.waitForSelector('#detail-dialog[open]', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(800);
    const result = await page.evaluate(() => ({
      title: document.getElementById('detail-title')?.textContent?.trim(),
      text: document.getElementById('detail-text')?.textContent?.trim(),
      mediaErrorVisible: !document.getElementById('media-error')?.hidden,
      errorText: document.getElementById('media-error')?.textContent?.trim(),
    }));
    check(report, 'failed-image', 'failed image exposes readable fallback without losing metadata', Boolean(result.title) && Boolean(result.text) && result.mediaErrorVisible, {
      expectedItem: collection.categories.get('paintings').items.at(-1).id,
      result,
      diagnostics,
    });
  } finally {
    await context.close();
  }
}

async function runContextLoss(browser, report) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  await installAuditInstrumentation(context);
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  try {
    await waitForApp(page);
    await enterWorld(page);
    await openRouteFromMap(page, 'photo');
    const supported = await page.evaluate(() => {
      const canvas = document.getElementById('world-canvas');
      const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
      const extension = gl?.getExtension('WEBGL_lose_context');
      if (!extension) return false;
      extension.loseContext();
      return true;
    });
    await page.waitForTimeout(1800);
    const state = await page.evaluate(() => ({
      fallbackVisible: (() => {
        const element = document.getElementById('webgl-fallback-note');
        return Boolean(element && !element.hidden && getComputedStyle(element).visibility !== 'hidden');
      })(),
      stateText: document.getElementById('route-state-text')?.textContent?.trim() ?? '',
      readingButtonExists: Boolean(document.querySelector('#webgl-fallback-note [data-open-reading]')),
      canvasVisible: (() => {
        const rect = document.getElementById('world-canvas')?.getBoundingClientRect();
        return Boolean(rect && rect.width > 0 && rect.height > 0);
      })(),
    }));
    check(report, 'context-loss', 'context loss degrades to a visible usable fallback', supported && state.fallbackVisible && state.readingButtonExists, {
      supported,
      state,
    });
    check(report, 'context-loss', 'context loss reports no uncaught page exception', diagnostics.pageErrors.length === 0, diagnostics);
  } finally {
    await context.close();
  }
}

async function runDesktopPass(browser, report, collection) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  await installAuditInstrumentation(context);
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  try {
    await waitForApp(page);
    await enterWorld(page);
    await goCorridor(page);
    const overviewPath = join(outputDirectory, 'test-overview-desktop.png');
    const overview = await screenshotWithStats(page, overviewPath);
    check(report, 'desktop', 'desktop overview renders visible non-uniform frame', overview.maxStdev > 5, overview);
    const portalPick = await clickProjectedPortal(page, 'photo');
    check(report, 'desktop', 'real projected corridor portal opens its route', portalPick.clicked && portalPick.route === 'photo', portalPick);
    if (portalPick.clicked && portalPick.route === 'photo') {
      await goCorridor(page);
    }

    const roomResults = [];
    for (const routeId of roomIds) {
      const result = await runGuarded(
        page,
        report,
        `desktop/${routeId}`,
        'room verification sequence',
        () => runRoomSequence(page, report, collection.categories.get(routeId), 'desktop'),
      );
      if (result) roomResults.push(result);
    }
    await runLastItemChecks(page, report, collection, 'desktop');
    await runGuarded(page, report, 'curate', 'curator verification', () => runCurator(page, report, collection));
    await page.reload({ waitUntil: 'networkidle' });
    await enterWorld(page);
    await runGuarded(page, report, 'navigation', 'corridor, direct history and rapid navigation', () => runCorridorHistoryAndRapid(page, report));
    await runGuarded(page, report, 'leaks', 'renderer and listener leak audit', () => runLeakAndFrameAudit(page, report));
    await runGuarded(page, report, 'keyboard', 'keyboard interaction audit', () => runKeyboard(page, report));

    check(report, 'desktop', 'desktop pass has no uncaught console, page or network errors', diagnostics.consoleErrors.length === 0 && diagnostics.pageErrors.length === 0 && diagnostics.failedRequests.length === 0 && diagnostics.httpErrors.length === 0, {
      consoleErrors: diagnostics.consoleErrors,
      pageErrors: diagnostics.pageErrors,
      failedRequests: diagnostics.failedRequests,
      httpErrors: diagnostics.httpErrors,
    });
    report.renderer = (await canvasMetrics(page)).webgl;
    report.roomResults = roomResults;
    report.network = {
      requestCount: diagnostics.requests.length,
      modelRequests: diagnostics.modelRequests,
      imageResponses: diagnostics.imageResponses.length,
    };
  } finally {
    await context.close();
  }
}

async function pageReadyProbe(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const diagnostics = attachDiagnostics(page);
  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    const runtime = await page.evaluate(() => ({
      route: document.body.dataset.route,
      scene: document.body.dataset.scene,
      hasCanvas: Boolean(document.getElementById('world-canvas')),
      hasNightWorld: Boolean(window.NightWorld),
      hasEngine: Boolean(window.NightWorld?.engine),
      stateText: document.getElementById('route-state-text')?.textContent?.trim() ?? '',
    }));
    return {
      ready: runtime.hasCanvas && runtime.hasNightWorld && runtime.hasEngine && diagnostics.pageErrors.length === 0 && diagnostics.failedRequests.length === 0,
      runtime,
      diagnostics,
    };
  } catch (error) {
    return {
      ready: false,
      error: String(error),
      diagnostics,
    };
  } finally {
    await context.close();
  }
}

async function productionStamp() {
  const paths = [
    'index.html',
    'css/world.css',
    'js/world/app.js',
    'js/world/engine.js',
    'js/world/rooms-a.js',
    'js/world/rooms-b.js',
    'js/world/curator.js',
    'assets/world/collection.json',
  ];
  const entries = await Promise.all(paths.map(fileInfo));
  return entries.map(entry => `${entry.path}:${entry.bytes}:${entry.modifiedAt}`).join('|');
}

async function waitForReady(browser, report) {
  const deadline = Date.now() + watchLimitMinutes * 60 * 1000;
  let attempt = 0;
  let stableStamp = null;
  let stableCount = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    const probe = await pageReadyProbe(browser);
    const stamp = await productionStamp();
    if (stamp === stableStamp) stableCount += 1;
    else {
      stableStamp = stamp;
      stableCount = 1;
    }
    report.readinessProbes.push({ at: new Date().toISOString(), attempt, stableCount, ...probe });
    if (probe.ready && stableCount >= 3) return true;
    await new Promise(resolve => setTimeout(resolve, 8000));
  }
  return false;
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  await mkdir(reviewDirectory, { recursive: true });
  const collection = await readCollection();
  const report = {
    tool: 'tools/world-verify.mjs',
    mode: requestedMode,
    startedAt: new Date().toISOString(),
    baseUrl,
    node: process.version,
    playwright: '1.64.1',
    checks: [],
    issues: [],
    readinessProbes: [],
    collection: (collection.raw.categories ?? []).map(category => ({
      id: category.id,
      title: category.title,
      count: category.items?.length ?? 0,
      firstId: category.items?.[0]?.id ?? null,
      lastId: category.items?.at(-1)?.id ?? null,
      lastTitle: category.items?.at(-1)?.title ?? null,
      lastSearchTerm: category.items?.length ? chooseSearchTerm(category, category.items.at(-1)) : null,
    })),
  };
  const readiness = await readinessSnapshot(collection);
  report.readiness = readiness;
  for (const category of readiness.categories) {
    check(report, 'collection', `${category.id} count`, category.expectedCount == null || category.count === category.expectedCount, category);
    if (category.expectedLastId) {
      check(report, 'collection', `${category.id} last id`, category.lastId === category.expectedLastId, category);
    }
  }
  report.renderers = await probeRenderers();

  if (requestedMode === 'prepare') {
    await writeJson('test-readiness.json', { ...readiness, renderers: report.renderers, collection: report.collection });
    console.log(JSON.stringify({
      mode: requestedMode,
      ready: readiness.allRuntimeFilesPresent,
      http: readiness.http,
      collectionCounts: readiness.countsMatch,
      lastItems: readiness.lastItemsMatch,
      bundledRenderer: report.renderers.bundled?.renderer,
      systemChromeRenderer: report.renderers.systemChrome?.renderer,
    }, null, 2));
    return;
  }

  const browser = await launchPrimary();
  try {
    const ready = await waitForReady(browser, report);
    report.ready = ready;
    if (!ready) {
      issue(report, 'readiness', 'app/engine did not become ready before verification', report.readinessProbes.at(-1));
    } else if (requestedMode === 'edge') {
      await runFailedImage(browser, report, collection);
      await runContextLoss(browser, report);
      await runWebglUnavailable(report);
      report.renderer = report.renderers.systemChrome ?? report.renderers.bundled;
    } else {
      const passRecovery = {
        waitForApp: async () => null,
        enterWorld: async () => null,
      };
      await runGuarded(passRecovery, report, 'desktop', 'desktop verification pass', () => runDesktopPass(browser, report, collection), { recover: false });
      await runGuarded(passRecovery, report, 'responsive/390x844', '390px responsive verification pass', () => runResponsivePass(browser, report, collection, { width: 390, height: 844 }), { recover: false });
      await runGuarded(passRecovery, report, 'responsive/320x700', '320px responsive verification pass', () => runResponsivePass(browser, report, collection, { width: 320, height: 700 }), { recover: false });
      await runGuarded(passRecovery, report, 'reduced-motion', 'reduced-motion verification pass', () => runReducedMotion(browser, report), { recover: false });
      await runGuarded(passRecovery, report, 'failed-image', 'failed-image verification pass', () => runFailedImage(browser, report, collection), { recover: false });
      await runGuarded(passRecovery, report, 'context-loss', 'context-loss verification pass', () => runContextLoss(browser, report), { recover: false });
      await runGuarded(passRecovery, report, 'webgl-unavailable', 'WebGL-unavailable verification pass', () => runWebglUnavailable(report), { recover: false });
    }
  } catch (error) {
    issue(report, 'runner', 'verification runner threw an exception', {
      message: error.message,
      stack: error.stack,
    });
  } finally {
    await browser.close();
  }

  report.finishedAt = new Date().toISOString();
  report.summary = {
    checks: report.checks.length,
    passed: report.checks.filter(entry => entry.passed).length,
    failed: report.checks.filter(entry => !entry.passed).length,
    errors: report.issues.filter(entry => entry.severity === 'error').length,
    renderer: report.renderer?.renderer ?? report.renderers.systemChrome?.renderer ?? report.renderers.bundled?.renderer ?? null,
    softwareRenderer: /swiftshader|llvmpipe|software/i.test(report.renderer?.renderer ?? report.renderers.systemChrome?.renderer ?? report.renderers.bundled?.renderer ?? ''),
  };
  await writeJson('test-report.json', report);
  await writeFile(join(reviewDirectory, 'verification-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.failed > 0 || report.summary.errors > 0) process.exitCode = 2;
}

await main();
