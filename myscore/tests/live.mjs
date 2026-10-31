// One bounded compatibility pass against real sources; not a load test.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { SourceStore } from '../server/store.mjs';
import { Provider } from '../provider.mjs';
import { espn, fiveDetail, dayOf } from '../shared.mjs';

const fixture = async name => JSON.parse(await readFile(new URL(`fixtures/${name}.json`, import.meta.url), 'utf8'));
const store = new SourceStore(), provider = new Provider((...args) => store.read(...args));
const matches = [];
for (const league of ['epl', 'ucl', 'nba', 'nfl']) matches.push(espn({ events: [(await fixture(league)).header] }, league)[0].id);
matches.push(fiveDetail(await fixture('cs2')).match.id, `qq:lol:${(await fixture('lol-base')).bMatchId}`);
const core = await fixture('f1-core'), f1 = espn(await fixture('f1-board'), 'f1').find(m => m.id.endsWith(`:${core.id}`));
if (f1) matches.push(`${f1.id}:${dayOf(f1.start).slice(0, 4)}`);
const results = [];
for (const id of matches) {
  const started = performance.now();
  try {
    const d = await provider.detail(id);
    const result = { id, ok: true, elapsedMs: Math.round(performance.now() - started), source: d.source, state: d.match.state, tables: d.tables.length, statistics: d.stats.length, games: d.games.length, warning: d.warning };
    results.push(result); console.log(JSON.stringify(result));
  } catch (e) { const result = { id, ok: false, elapsedMs: Math.round(performance.now() - started), error: e.message }; results.push(result); console.log(JSON.stringify(result)); }
}
await mkdir('.myscore-cache', { recursive: true });
await writeFile('.myscore-cache/live-result.json', JSON.stringify({ at: new Date().toISOString(), platform: process.platform, results }, null, 2));
if (results.some(r => !r.ok)) process.exitCode = 1;
