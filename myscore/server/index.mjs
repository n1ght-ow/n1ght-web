import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { isIP } from 'node:net';
import { SourceStore } from './store.mjs';
import { Provider } from '../provider.mjs';
import { resolveWatch, normalName } from '../media.mjs';
import { competition, list, text, today, https } from '../shared.mjs';

const fallbackKinds = new Set(['board', 'summary', 'schedule', 'roster', 'f1Core', 'f1Stats', 'fiveTier', 'fiveTeam', 'fiveDetail', 'lolHeroes']);
// A failed upstream socket reaches the page as an English TypeError; the
// interface is Chinese, so network-class failures get one readable sentence.
const reasonOf = e => e instanceof TypeError || /Failed to fetch|fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(String(e?.message || '')) ? '来源暂时无法连接' : String(e?.message || '请求失败');
export function createService({ store = new SourceStore({ directory: process.env.CACHE_DIR || join(process.cwd(), '.myscore-cache') }), origins = (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:3100,http://localhost:3100').split(','), provider = new Provider((...args) => store.read(...args)) } = {}) {
  const results = new Map(), inFlight = new Map(), limits = new Map();
  let resultBytes = 0;
  async function route(name, p) {
    if (name === 'source') { if (!fallbackKinds.has(p.kind)) throw new Error('该接口不能直接代理'); return { data: await store.read(p.kind, p), fetched: Date.now() }; }
    if (name === 'scores') return provider.scores(p.league, p.date || today());
    if (name === 'team') return provider.team(p.league, p.id);
    if (name === 'detail') return provider.detail(p.match);
    if (name === 'watch') return resolveWatch((await provider.detail(p.match)).match, (...args) => store.read(...args));
    if (name === 'profile') {
      const detail = await provider.detail(p.match), person = detail.tables.flatMap(t => t.people).find(a => a.id === p.id);
      if (!person) throw new Error('本场比赛没有此球员');
      if (!['足球', 'NBA', 'NFL'].includes(detail.match.group) || !person.teamId) return { person, source: detail.source };
      const roster = await store.read('roster', { league: detail.match.league, id: person.teamId });
      if (text(roster.team?.id) !== person.teamId) throw new Error('球员所属球队身份不匹配');
      const a = list(roster.athletes).flatMap(a => Array.isArray(a.items) ? a.items : [a]).find(a => text(a.id) === person.id && normalName(a.displayName) === normalName(person.name));
      if (!a) throw new Error('来源暂未提供可核实的球员资料');
      const enriched = { ...person, birthday: text(a.dateOfBirth).slice(0, 10), age: text(a.age), height: text(a.displayHeight), weight: text(a.displayWeight), nationality: text(a.citizenship), photo: https(a.headshot?.href) || person.photo, college: text(a.college?.name), experience: text(a.experience?.years), draft: text(a.draft?.displayText), birthplace: [a.birthPlace?.city, a.birthPlace?.state, a.birthPlace?.country].filter(Boolean).join(' · '), status: text(a.status?.name) };
      let warning = '', photoSource = '';
      if (detail.match.group === '足球' && enriched.birthday) try {
        const fpl = await store.read('fpl'); const candidates = list(fpl.elements).filter(p => p.birth_date === enriched.birthday && [p.known_name, `${p.first_name} ${p.second_name}`].some(n => normalName(n) === normalName(person.name)));
        if (candidates.length === 1 && /^\d+$/.test(String(candidates[0].code))) { enriched.photo = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${candidates[0].code}.png`; photoSource = ' · 英超官方 FPL'; }
      } catch { warning = '英超补充照片暂未更新'; }
      return { person: enriched, source: `ESPN${photoSource}`, warning };
    }
    throw new Error('接口不存在');
  }
  const server = createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && !origins.includes(origin)) { res.writeHead(403).end(); return; }
    const cors = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
    const send = (status, body, extra = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors, ...extra }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
    if (req.method === 'OPTIONS') { res.writeHead(204, { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }).end(); return; }
    if (req.method !== 'GET') { send(405, { error: '仅支持读取' }); return; }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/v1/health') { send(200, { ok: true, active: store.active, queued: store.queue.length, cacheBytes: store.bytes, resultBytes, rss: process.memoryUsage().rss }); return; }
    if (req.url.length > 2048 || !/^\/api\/v1\/(source|scores|team|detail|watch|profile)$/.test(url.pathname)) { send(404, { error: '接口不存在' }); return; }
    const remote = req.socket.remoteAddress, forwarded = text(req.headers['x-real-ip']);
    const address = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote) && isIP(forwarded) ? forwarded : remote;
    const now = Date.now(), rate = limits.get(address) || { at: now, count: 0 };
    if (now - rate.at > 60000) { rate.at = now; rate.count = 0; }
    rate.count++; limits.set(address, rate);
    if (limits.size > 2048) for (const [key, value] of limits) if (now - value.at > 60000) limits.delete(key);
    if (rate.count > 600) { send(429, { error: '请求过多，请稍后重试', retryAt: now + 60000 }, { 'Retry-After': '60' }); return; }
    const name = url.pathname.split('/').pop(), params = Object.fromEntries(url.searchParams);
    try {
      if (name !== 'source' && name !== 'scores' && name !== 'team' && (!params.match || !/^(espn:(epl|ucl|efl|fa|nba|nfl|f1):\d+:\d+(?::\d{4})?|five:cs2:csgo_mc_\d+|qq:lol:\d+)$/.test(params.match))) throw new Error('比赛标识无效');
      if (['scores', 'team'].includes(name) && !competition(params.league)) throw new Error('未知赛事');
      if (name === 'team' && !/^[a-zA-Z0-9_]{1,60}$/.test(params.id || '')) throw new Error('球队标识无效');
      if (name === 'scores' && params.date && !/^\d{4}-\d{2}-\d{2}$/.test(params.date)) throw new Error('日期无效');
      const key = name + '?' + new URLSearchParams(Object.entries(params).sort()).toString();
      let saved = results.get(key), staleError = '';
      if (!saved || saved.until <= now) {
        if (!inFlight.has(key)) {
          if (inFlight.size >= 64) { send(503, { error: '服务繁忙，请稍后重试' }); return; }
          const operation = route(name, params).then(data => {
            const body = JSON.stringify(data), bytes = Buffer.byteLength(body), ttl = name === 'watch' || name === 'profile' ? 600000 : data.match?.state === 'final' ? 21600000 : 2000;
            const entry = { body, bytes, etag: `"${createHash('sha256').update(body).digest('hex').slice(0, 24)}"`, until: Date.now() + ttl };
            if (results.has(key)) resultBytes -= results.get(key).bytes;
            results.delete(key); results.set(key, entry); resultBytes += bytes;
            while (resultBytes > 4 * 1024 * 1024 || results.size > 128) { const first = results.keys().next().value; resultBytes -= results.get(first).bytes; results.delete(first); }
            return entry;
          }).finally(() => inFlight.delete(key));
          inFlight.set(key, operation);
        }
        try { saved = await inFlight.get(key); } catch (e) { if (!saved) throw e; staleError = reasonOf(e); saved.staleError = staleError; saved.until = Date.now() + 15000; }
      }
      if (staleError || saved.staleError) { const data = JSON.parse(saved.body); send(200, { ...data, stale: true, warning: [data.warning, `连接失败，保留缓存：${staleError || saved.staleError}`].filter(Boolean).join('；') }); }
      else if (req.headers['if-none-match'] === saved.etag) { res.writeHead(304, { ...cors, ETag: saved.etag }).end(); }
      else send(200, saved.body, { ETag: saved.etag });
    } catch (e) { send(e.retryAt ? 503 : /无效|未知|不能|不支持/.test(e.message) ? 400 : 502, { error: reasonOf(e), retryAt: e.retryAt || Date.now() + 15000 }); }
  });
  server.requestTimeout = 45000; server.headersTimeout = 10000; server.maxConnections = 64;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createService(); server.listen(Number(process.env.API_PORT || 3101), process.env.API_HOST || '127.0.0.1', () => console.log(`MyScore data -> http://${process.env.API_HOST || '127.0.0.1'}:${process.env.API_PORT || 3101}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
