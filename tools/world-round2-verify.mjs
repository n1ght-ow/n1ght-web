import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/qsr/.codex/tools/web3d/node_modules/playwright');
const output = '.impeccable/review/round2';
const titlesOnly = process.argv.includes('--titles-only');
await mkdir(output, { recursive: true });
const collection = JSON.parse(await readFile('assets/world/collection.json', 'utf8'));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const checks = [], errors = [];
function check(name, passed, details) { checks.push({ name, passed, details }); }
async function settle(page, id) {
  await page.waitForFunction(id => window.NightWorld?.metrics()?.route === id && !window.NightWorld.metrics().routeLoading, id);
  await page.waitForTimeout(850);
}
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 700 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    for (const id of titlesOnly ? ['poems'] : ['poems', 'books']) {
      await page.goto('http://127.0.0.1:3100/#' + id, { waitUntil: 'networkidle' });
      await settle(page, id);
      const label = `${viewport.width}/${id}`;
      if (id === 'poems' && viewport.width <= 700) {
        const expected = collection.categories.find(c => c.id === id).items.map(item => item.title);
        check(`${label}: all three original poem titles have readable selectors`, JSON.stringify(await page.locator('#poem-choices .poem-choice__title').allTextContents()) === JSON.stringify(expected));
        const authors = collection.categories.find(c => c.id === id).items.map(item => item.author);
        check(`${label}: selectors retain original authors`, JSON.stringify(await page.locator('#poem-choices small').allTextContents()) === JSON.stringify(authors));
        await page.locator('#poem-choices button').nth(1).click();
        await page.waitForTimeout(50);
        check(`${label}: named selector focuses its real poem`, await page.evaluate(() => window.NightWorld.selected.id === 'yeats' && window.NightWorld.metrics().focusedIndex === 1));
        await page.locator('[data-overview]').click();
      }
      await page.screenshot({ path: `${output}/${id}-${viewport.width}-overview.png` });
      // Dispatch a burst in the same event loop to expose dropped selections.
      await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('#item-index button')];
        for (const index of [1, 0, 2]) buttons[index]?.click();
      });
      await page.waitForTimeout(100);
      const state = await page.evaluate(() => ({ selected: window.NightWorld.selected.id, ids: window.NightWorld.visibleIds, metrics: window.NightWorld.metrics() }));
      check(`${label}: rapid selection keeps the latest record and camera`, state.selected === state.ids[2] && state.metrics.focusedIndex === 2, state);
      const area = state.metrics.viewingArea;
      const pick = state.metrics.picks.find(p => p.index === 2);
      check(`${label}: selected object is inside the available viewing area`, Boolean(pick && pick.screenX > area.left && pick.screenX < area.right && pick.screenY > area.top && pick.screenY < area.bottom), { pick, area });
      await page.screenshot({ path: `${output}/${id}-${viewport.width}-focus.png` });
      await page.locator('[data-open-detail]').click();
      if (id === 'poems') {
        const expected = collection.categories.find(c => c.id === id).items[2];
        const actual = await page.locator('.poem-reading__stanza').allTextContents();
        check(`${label}: HTML reading preserves every stanza and line`, JSON.stringify(actual) === JSON.stringify(expected.stanzas.map(lines => lines.join('\n'))), actual);
        await page.screenshot({ path: `${output}/poem-reading-${viewport.width}.png` });
      }
      await page.keyboard.press('Escape');
      check(`${label}: closing reading returns focus`, await page.locator('[data-open-detail]').evaluate(el => el === document.activeElement));
      await page.locator('[data-overview]').click();
      await page.waitForTimeout(100);
      const overview = await page.evaluate(() => window.NightWorld.metrics().view);
      check(`${label}: overview restores a wider composition`, overview.frame.width > state.metrics.view.frame.width, overview);
      await page.locator('[data-toggle-panel]').click();
      const hiddenArea = await page.evaluate(() => window.NightWorld.metrics().viewingArea);
      check(`${label}: hiding controls expands viewing space`, viewport.width > 700 ? hiddenArea.left < area.left : hiddenArea.bottom > area.bottom, hiddenArea);
      await page.locator('[data-toggle-panel]').click();
      check(`${label}: no horizontal page overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    for (const id of titlesOnly ? [] : ['series', 'games']) {
      await page.goto('http://127.0.0.1:3100/?occlusion=' + id + '#' + id);
      await settle(page, id);
      for (const index of [0, 4, 8]) {
        await page.locator('#item-index button').nth(index).click();
        await page.waitForTimeout(120);
        const state = await page.evaluate(() => ({ title: window.NightWorld.selected.title, metrics: window.NightWorld.metrics() }));
        const target = state.metrics.picks.find(p => p.index === index);
        await page.mouse.click(target.screenX, target.screenY);
        await page.waitForSelector('#detail-dialog[open]');
        const title = await page.locator('#detail-title').textContent();
        check(`${viewport.width}/${id}: focused record ${index} is the frontmost real pick`, title === state.title, { expected: state.title, title });
        await page.keyboard.press('Escape');
      }
    }
    if (viewport.width === 1440 && !titlesOnly) {
      for (const id of ['poems', 'books']) {
        const samples = [];
        await page.goto('http://127.0.0.1:3100/#' + id);
        await settle(page, id);
        samples.push(await page.evaluate(() => window.NightWorld.metrics().renderer.memory));
        for (let i = 0; i < 5; i++) {
          // Same document route changes exercise disposal rather than reload.
          for (const route of ['photo', id]) {
            await page.locator('[data-open-map]').click();
            await page.locator(`#map-dialog [data-route="${route}"]`).click();
            await settle(page, route);
          }
          samples.push(await page.evaluate(() => window.NightWorld.metrics().renderer.memory));
        }
        check(`${id}: GPU geometry and texture counts stay bounded on reentry`, samples.every(s => s.geometries <= samples[0].geometries + 2 && s.textures <= samples[1].textures + 2), samples);
      }
    }
    await page.close();
  }
} finally { await browser.close(); }
check('no uncaught errors', errors.length === 0, errors);
const report = { checks, summary: { checks: checks.length, passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length } };
await writeFile(`${output}/${titlesOnly ? 'poem-titles-report' : 'targeted-report'}.json`, JSON.stringify(report, null, 2));
console.log(report.summary);
if (report.summary.failed) process.exitCode = 2;
