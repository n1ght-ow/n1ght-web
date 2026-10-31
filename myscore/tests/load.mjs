// Local fixtures only. This test never sends load to upstream sports providers.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createService } from '../server/index.mjs';
import { SourceStore } from '../server/store.mjs';
import { Provider } from '../provider.mjs';
import { espn, fiveDetail, lolDetail, f1Detail, today } from '../shared.mjs';

const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const duration = Number(arg('duration') || 1800) * 1000;
const report = arg('report'); if (report) await mkdir(dirname(report), { recursive: true });
const fixture = async name => JSON.parse(await readFile(new URL(`fixtures/${name}.json`, import.meta.url), 'utf8'));
const raw = Object.fromEntries(await Promise.all(['epl', 'nba', 'nfl', 'cs2', 'lol-base', 'lol-rich', 'f1-board', 'f1-core', 'f1-stats'].map(async n => [n, await fixture(n)])));
const ids = ['epl', 'nba', 'nfl'].map(league => espn({ events: [raw[league].header] }, league)[0].id);
ids.push(fiveDetail(raw.cs2).match.id, `qq:lol:${raw['lol-base'].bMatchId}`);
const store = new SourceStore({ fetcher: async request => {
  const url = new URL(request), name = url.pathname.includes('/basketball/') ? 'nba' : url.pathname.includes('/football/') ? 'nfl' : 'epl';
  return new Response(JSON.stringify(url.pathname.endsWith('summary') ? raw[name] : { events: [raw[name].header] }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=2' } });
} });
const liveProvider = new Provider((...args) => store.read(...args));
const provider = {
  detail: async id => id.startsWith('five:') ? fiveDetail(raw.cs2) : id.startsWith('qq:') ? lolDetail(raw['lol-base'], raw['lol-rich'], id) : liveProvider.detail(id),
  scores: (...args) => liveProvider.scores(...args), team: async league => ({ source: 'fixture', fetched: Date.now(), matches: espn({ events: [raw[league].header] }, league) }),
};
const server = createService({ store, provider }); server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let requests = 0, errors = 0, peakRss = 0, samples = [], peakCache = 0;
const started = performance.now(), sample = () => { const memory = process.memoryUsage(); peakRss = Math.max(peakRss, memory.rss); peakCache = Math.max(peakCache, store.bytes); samples.push({ seconds: Math.round((performance.now() - started) / 1000), rssMiB: +(memory.rss / 1048576).toFixed(1), heapMiB: +(memory.heapUsed / 1048576).toFixed(1) }); };
async function checkpoint() {
  if (report) await writeFile(report, JSON.stringify({ complete: false, durationSeconds: Math.round((performance.now() - started) / 1000), visitors: 10, requests, errors, peakRssMiB: +(peakRss / 1048576).toFixed(1), samples, scope: 'In progress; not a completed acceptance test.' }, null, 2));
}
sample(); const interval = setInterval(() => { sample(); checkpoint().catch(() => {}); }, 10000);
console.log(JSON.stringify({ state: 'running', seconds: duration / 1000, visitors: 10, fixturesOnly: true }));
await Promise.all(Array.from({ length: 10 }, async (_, visitor) => {
  let round = 0;
  while (performance.now() - started < duration) {
    const url = round % 5 === 0 ? `/api/v1/scores?league=nba&date=${today()}` : round % 5 === 1 ? '/api/v1/team?league=epl&id=382' : `/api/v1/detail?match=${encodeURIComponent(ids[(round + visitor) % ids.length])}`;
    try { const r = await fetch(base + url); const body = await r.json(); if (!r.ok || body.error) errors++; requests++; } catch { errors++; }
    round++; await new Promise(resolve => setTimeout(resolve, 2200));
  }
}));
sample(); clearInterval(interval); await new Promise(resolve => server.close(resolve));
const result = { complete: true, durationSeconds: Math.round((performance.now() - started) / 1000), visitors: 10, requests, errors, peakRssMiB: +(peakRss / 1048576).toFixed(1), peakCacheMiB: +(peakCache / 1048576).toFixed(2), samples, platform: process.platform, node: process.version, scope: 'Node service and fixture clients share this Windows process; not Ubuntu/cloud acceptance.' };
if (report) await writeFile(report, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result)); if (errors) process.exitCode = 1;
