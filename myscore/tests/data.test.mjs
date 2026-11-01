import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { espn, espnDetail, fiveDetail, fiveHistory, lolDetail, f1Detail, matchBase, parseAssignment, state, dayOf, shiftDay, score, mergeTerminal, delayFor, formationLines } from '../shared.mjs';
import { sourceRequest } from '../sources.mjs';
import { findVideo, findMigu, mediaKind, chinese } from '../media.mjs';
import { SourceStore } from '../server/store.mjs';
import { createService } from '../server/index.mjs';
import { Provider } from '../provider.mjs';

const fixture = async name => JSON.parse(await readFile(new URL(`fixtures/${name}.json`, import.meta.url), 'utf8'));
for (const league of ['epl', 'ucl', 'nba', 'nfl']) test(`${league}: real summary identity and source-backed statistics`, async () => {
  const raw = await fixture(league), match = espn({ events: [raw.header] }, league)[0], detail = espnDetail(raw, match);
  assert.equal(detail.match.id, match.id); assert.ok(detail.tables.length); assert.ok(detail.stats.length);
  assert.throws(() => espnDetail(raw, { ...match, id: 'espn:' + league + ':wrong:wrong' }), /身份/);
  const pre = structuredClone(raw); pre.header.competitions[0].status = { type: { name: 'STATUS_SCHEDULED', state: 'pre' } };
  const before = espnDetail(pre, match); assert.equal(before.stats.length, 0); assert.equal(before.events.length, 0);
  if (league !== 'epl' && league !== 'ucl') assert.ok(before.tables.every(t => t.category === '伤停'));
});
test('timezone, year boundary and unknown scores remain explicit', () => {
  assert.equal(dayOf(Date.parse('2026-10-31T18:00:00Z')), '2026-11-01');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(state('STATUS_POSTPONED', 'post'), 'delayed'); assert.equal(state('STATUS_CANCELED', 'post'), 'cancelled');
  const m = { ...matchBase('efl', 'x'), state: 'final', homeScore: '2', awayScore: '2', homeShootout: '4', awayShootout: '3' };
  assert.equal(score(m, 'home'), '2 (4)'); m.awayShootout = ''; assert.equal(score(m, 'home'), '2');
  m.state = 'scheduled'; assert.equal(score(m, 'home'), '—');
});
test('football schematic groups actual player roles, not numeric formation-place codes', async () => {
  const raw = await fixture('epl'), match = espn({ events: [raw.header] }, 'epl')[0], detail = espnDetail(raw, match);
  const starters = detail.tables.find(t => t.category === '首发'), formation = detail.formations.find(f => f.teamId === starters.teamId).formation;
  const lines = formationLines(starters, formation); assert.equal(lines[0][0].position, '门将'); assert.ok(lines[1].every(p => /中卫|后卫/.test(p.position)));
  const duplicated = structuredClone(starters); duplicated.people[1].id = duplicated.people[0].id; assert.deepEqual(formationLines(duplicated, formation), []);
});
test('remote JS is parsed as data and never evaluated', () => {
  assert.deepEqual(parseAssignment('var data = {"status":"0","msg":[]};'), { status: '0', msg: [] });
  assert.throws(() => parseAssignment('var data = {}; globalThis.compromised=true;'));
  assert.throws(() => parseAssignment('var data = {evil: process.exit()};'));
});
test('finished results survive source omissions, allow confirmed corrections', () => {
  const a = { ...matchBase('nba', 'a'), state: 'final', homeScore: '100' }, b = { ...a, homeScore: '102' };
  assert.equal(mergeTerminal([a], [b])[0].homeScore, '100'); assert.equal(mergeTerminal([a], [b], true)[0].homeScore, '102');
  assert.equal(mergeTerminal([a], []).length, 1); assert.equal(delayFor([{ ...a, state: 'live' }]), 2000);
});
test('CS2 maps and sides use source coordinates, never an unfinished map table', async () => {
  const raw = await fixture('cs2'), d = fiveDetail(raw); assert.ok(d.games.length); assert.ok(d.tables.some(t => t.category === '全场'));
  assert.ok(d.tables.filter(t => t.tab === 'maps').every(t => d.games.some(g => g.id === t.category)));
  const bad = structuredClone(raw); bad.data.match.mc_info.id = 'csgo_mc_1'; assert.throws(() => fiveDetail(bad, d.match), /身份/);
  const history = fiveHistory({ success: true, data: { items: { matches: [{ mc_info: { id: 'csgo_mc_1', status: 'past', home_info: { id: 'csgo_tm_7020', disp_name: 'Spirit' }, opponent_info: { id: 'other', disp_name: 'Other' }, home_score: '2', opponent_score: '1' } }] } } });
  assert.equal(history[0].state, 'final'); assert.equal(history[0].homeScore, '2'); assert.equal(history[0].awayScore, '1');
});
test('LOL verifies series and team identities, exposes actual game details', async () => {
  const base = await fixture('lol-base'), rich = await fixture('lol-rich'), id = `qq:lol:${base.bMatchId}`, d = lolDetail(base, rich, id);
  assert.equal(d.games.length, 1); assert.ok(d.tables.some(t => t.columns.includes('出装')));
  const bad = structuredClone(rich); bad.data.teamAId = 'wrong'; assert.throws(() => lolDetail(base, bad, id), /身份/);
  const duplicate = structuredClone(rich); duplicate.data.matchInfos.push(duplicate.data.matchInfos[0]); assert.throws(() => lolDetail(base, duplicate, id), /重复/);
  assert.match(lolDetail(base, {}, id).warning, /暂未提供/);
});

test('LOL retains equipment images, champion identity, zero values and resource details', async () => {
  const base = await fixture('lol-base'), rich = await fixture('lol-rich');
  const p = rich.data.matchInfos[0].teamInfos[0].playerInfos[0];
  p.playerAvatar = 'https://example.com/canna.png';
  p.DamageTakenDetail = { damageTaken: 18094.26, highestTakenDamageRate: false };
  p.visionDetail = { visionScore: 0, wardPlaced: 17 };
  p.trinketItem = { itemId: 3363, itemName: '远见改造', itemIcon: '' };
  p.spell1Name = '闪现'; p.perkRunes = [{ runeName: '焦灼' }];
  const d = lolDetail(base, rich, `qq:lol:${base.bMatchId}`, { hero: [{ heroId: '68', title: '兰博', alias: 'Rumble' }, { heroId: '254', title: '蔚', alias: 'Vi' }] });
  const t = d.tables.find(t => t.people[0]?.name === p.playerName && t.columns.includes('出装')), person = t.people[0];
  assert.equal(person.photo, p.playerAvatar); assert.match(person.champion.image, /champion\/Rumble\.png$/);
  assert.match(t.rows[0].at(-1).images[0].image, /item\/3157\.png$/);
  assert.ok(person.items.some(i => i.name === '远见改造'));
  assert.ok(person.metrics.some(([k, v]) => k === '视野得分' && v === '0'));
  assert.ok(person.metrics.some(([k, v]) => k === '本局最高承伤占比' && v === '否'));
  assert.ok(person.metrics.some(([k, v]) => k === '符文' && v === '焦灼'));
  assert.equal(d.games[0].duration, '35:02'); assert.equal(d.games[0].winner, 'C9');
  assert.ok(d.tables.some(t => t.title.includes('承伤与回复')));
  assert.ok(d.tables.some(t => t.rows.some(r => r[0] === '禁用英雄' && r[1].images.some(i => /Vi\.png$/.test(i.image)))));
  const failed = lolDetail(base, { success: false, data: rich.data }, `qq:lol:${base.bMatchId}`);
  assert.equal(failed.games.length, 0);
});

test('CS2 uses supplied portrait fields and omits unplayed decider maps', async () => {
  const raw = await fixture('cs2'), p = raw.data.match.global_state.t1_player_stats[0];
  p.portrait = 'https://example.com/player.png'; p.first_blood_num = '0';
  const d = fiveDetail(raw), t = d.tables.find(t => t.category === '全场');
  assert.equal(t.people[0].photo, p.portrait); assert.ok(!t.columns.includes('portrait'));
  assert.equal(t.rows[0][t.columns.indexOf('首杀')], '0');
  assert.ok(!d.games.some(g => g.name === 'Nuke'));
});

test('ESPN contextual and season data stay separate from match statistics', async () => {
  const raw = await fixture('nba'), match = espn({ events: [raw.header] }, 'nba')[0];
  raw.standings = { groups: [{ header: 'Test standings', standings: { entries: [{ team: 'Team', stats: [{ name: 'wins', displayName: 'Wins', displayValue: '12' }] }] } }] };
  raw.leaders = [{ team: { id: match.homeId, displayName: match.home }, leaders: [{ displayName: 'Points', leaders: [{ athlete: { id: '123', displayName: 'Player' }, displayValue: '23' }] }] }];
  raw.header.competitions[0].status = { type: { name: 'STATUS_SCHEDULED', state: 'pre' } };
  const d = espnDetail(raw, match);
  assert.equal(d.stats.length, 0); assert.ok(d.tables.filter(t => t.tab !== 'context').every(t => t.category === '伤停'));
  assert.ok(d.tables.some(t => t.tab === 'context' && t.columns.includes('胜')));
  assert.ok(d.tables.some(t => t.title.includes('赛前来源领跑数据')));
});

test('football retains extra source metrics and adds ESPN headshot paths', async () => {
  const raw = await fixture('epl'), p = raw.rosters[0].roster.find(p => p.starter);
  p.stats = [{ name: 'expectedGoals', displayName: 'Expected Goals', displayValue: '0.36' }];
  const match = espn({ events: [raw.header] }, 'epl')[0], d = espnDetail(raw, match);
  const t = d.tables.find(t => t.people.some(a => a.id === p.athlete.id)), a = t.people.find(a => a.id === p.athlete.id);
  assert.match(a.photo, new RegExp(`/soccer/players/full/${a.id}\\.png$`));
  assert.equal(t.rows[t.people.indexOf(a)][t.columns.indexOf('预期进球 xG')], '0.36');
  assert.ok(a.metrics.some(([k, v]) => k === '预期进球 xG' && v === '0.36'));
});
test('F1 verifies the exact session and reads driver statistics', async () => {
  const board = await fixture('f1-board'), core = await fixture('f1-core'), stats = await fixture('f1-stats');
  const event = board.events.find(e => e.competitions.some(c => String(c.id) === String(core.id))), session = event.competitions.find(c => String(c.id) === String(core.id));
  const match = espn({ events: [event] }, 'f1').find(m => m.id.endsWith(':' + core.id));
  const statistics = Object.fromEntries(core.competitors.map(p => [p.id, stats]));
  assert.ok(f1Detail(event, session, core, statistics, match).tables[0].rows.length);
  assert.throws(() => f1Detail(event, session, { ...core, id: 'wrong' }, statistics, match), /身份/);
});
test('Migu matching requires both teams, competition and a 20-minute kickoff window', () => {
  const m = { ...matchBase('nba', 'x'), home: 'San Antonio Spurs', away: 'Los Angeles Lakers', start: Date.parse('2026-11-01T12:00:00+08:00') };
  assert.equal(chinese('nba', 'Spurs'), '马刺'); assert.equal(chinese('epl', 'Spurs'), '托特纳姆热刺');
  const hit = { widgetId: 'p123', competitionName: 'NBA', confrontTeamLeftName: '马刺', confrontTeamRightName: '湖人', matchStartTime: '2026-11-01 12:00:00' };
  const make = item => ({ body: { widgetResult: { items: [item] } } });
  assert.equal(findMigu(make(hit), m).widgetId, 'p123'); assert.equal(findMigu(make({ ...hit, matchStartTime: '2026-11-01 13:00:00' }), m), null); assert.equal(findMigu(make({ ...hit, competitionName: 'NBA经典' }), m), null);
});
test('CS2 full replay matches opponent and date and rejects clips', async () => {
  const episodes = (await fixture('spirit')).data.archives;
  const m = { ...matchBase('cs2', 'x'), state: 'final', home: 'Team Spirit', away: 'Natus Vincere', homeId: 'csgo_tm_7020', start: Date.parse('2026-10-29T12:00:00+08:00') };
  assert.equal(mediaKind(m), 'bili'); assert.equal(findVideo(episodes, m)?.bvid, 'BV1TisR6eEY7');
  assert.equal(findVideo(episodes, { ...m, away: 'MOUZ' }), null); assert.equal(findVideo(episodes.map(e => ({ ...e, title: '集锦 ' + e.title })), m), null);
});
test('API source mapping cannot become an arbitrary URL proxy', () => {
  assert.throws(() => sourceRequest('http://127.0.0.1:22', {})); assert.throws(() => sourceRequest('summary', { league: 'nba', event: '../secret' }));
  assert.throws(() => sourceRequest('fiveDetail', { id: 'https://example.com' }));
});
test('Beijing scoreboards use two separate source dates, retain partial failure', async () => {
  const calls = [], raw = await fixture('nba');
  const provider = new Provider(async (kind, params) => { calls.push(params.date); if (params.date === '2026-10-31') throw new Error('offline'); return { events: [raw.header] }; });
  const result = await provider.scores('nba', '2026-11-01'); assert.deepEqual(calls, ['2026-10-31', '2026-11-01']); assert.match(result.warning, /部分日期/);
  const request = sourceRequest('board', { league: 'nba', date: '2026-11-01' }); assert.equal(new URL(request.url).searchParams.get('dates'), '20261101');
});
test('Manchester City highlights require opponent, exact score and bounded publication', async () => {
  const episodes = (await fixture('city-highlights')).data.archives;
  const m = { ...matchBase('efl', 'x'), state: 'final', home: 'Manchester City', homeId: '382', away: 'Brighton & Hove Albion', homeScore: '2', awayScore: '2', start: Date.parse('2026-10-28T12:00:00+08:00') };
  assert.equal(findVideo(episodes, m)?.bvid, 'BV1hgsd6gE6a');
  assert.equal(findVideo(episodes, { ...m, homeScore: '3' }), null);
  assert.equal(mediaKind({ ...m, state: 'cancelled' }), '');
});
test('upstream requests coalesce, cache, and use no more than two slots', async () => {
  let active = 0, peak = 0, count = 0;
  const store = new SourceStore({ memoryLimit: 1024, fetcher: async () => { active++; peak = Math.max(peak, active); count++; await new Promise(r => setTimeout(r, 15)); active--; return new Response('{"events":[]}', { headers: { 'Cache-Control': 'max-age=10' } }); } });
  await Promise.all(Array.from({ length: 10 }, () => store.read('summary', { league: 'nba', event: '1' })));
  assert.equal(count, 1); await store.read('summary', { league: 'nba', event: '1' }); assert.equal(count, 1);
  await Promise.all(Array.from({ length: 8 }, (_, i) => store.read('summary', { league: 'nba', event: String(i + 2) })));
  assert.equal(peak, 2); assert.ok(store.bytes <= 1024);
});
test('429 backoff is enforced without hammering the upstream', async () => {
  let calls = 0; const store = new SourceStore({ fetcher: async () => { calls++; return new Response('limited', { status: 429, headers: { 'Retry-After': '20' } }); } });
  await assert.rejects(store.read('summary', { league: 'nba', event: '1' }), /429/);
  await assert.rejects(store.read('summary', { league: 'nba', event: '1' }), /429/); assert.equal(calls, 1);
});
test('upstream socket failures read in Chinese', async () => {
  const store = new SourceStore({ fetcher: async () => { throw new TypeError('fetch failed'); } });
  await assert.rejects(store.read('summary', { league: 'nba', event: '1' }), /来源暂时无法连接/);
});
test('HTTP service enforces origins, method and allow-listed APIs', async t => {
  const server = createService(); server.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => new Promise(r => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + '/api/v1/health', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await fetch(base + '/api/v1/health', { method: 'POST' })).status, 405);
  assert.equal((await fetch(base + '/api/v1/source?kind=lolClient')).status, 400);
  assert.equal((await fetch(base + '/api/v1/detail?match=invalid')).status, 400);
  const ok = await fetch(base + '/api/v1/health', { headers: { Origin: 'http://127.0.0.1:3100' } }); assert.equal(ok.status, 200); assert.equal(ok.headers.get('Access-Control-Allow-Origin'), 'http://127.0.0.1:3100');
});

for (const league of ['nba', 'nfl']) test(`${league}: player biography verifies roster identity and preserves match metrics`, async t => {
  const p = { id: '123', name: 'Test Player', teamId: '4', metrics: [['得分', '0']] };
  const athlete = { id: '123', displayName: 'Test Player', dateOfBirth: '2000-01-02T00:00Z', age: 26, displayHeight: '6 ft', experience: { years: 0 }, headshot: { href: 'https://example.com/portrait.png' } };
  const store = new SourceStore(); store.read = async () => ({ team: { id: '4' }, athletes: league === 'nfl' ? [{ items: [athlete] }] : [athlete] });
  const provider = { detail: async () => ({ match: { group: league.toUpperCase(), league }, source: 'ESPN', tables: [{ people: [p] }] }) };
  const server = createService({ store, provider }); server.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => new Promise(r => server.close(r)));
  const result = await (await fetch(`http://127.0.0.1:${server.address().port}/api/v1/profile?match=espn:${league}:1:1&id=123`)).json();
  assert.equal(result.person.photo, athlete.headshot.href); assert.equal(result.person.birthday, '2000-01-02'); assert.equal(result.person.experience, '0');
  assert.deepEqual(result.person.metrics, p.metrics); assert.equal(result.source, 'ESPN');
  athlete.displayName = 'Different Player';
  const mismatch = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/profile?match=espn:${league}:2:2&id=123`);
  assert.equal(mismatch.status, 502); assert.match((await mismatch.json()).error, /可核实/);
});
test('network failures from an upstream source read in Chinese', async t => {
  const provider = { detail: async () => { throw new TypeError('fetch failed'); } };
  const server = createService({ provider }); server.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => new Promise(r => server.close(r)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/detail?match=espn:nba:1:1`);
  const result = await response.json();
  assert.equal(response.status, 502); assert.equal(result.error, '来源暂时无法连接');
});

test('FPL portrait fallback requires both the verified name and birthday', async t => {
  const p = { id: '123', name: 'Test Player', teamId: '4', photo: 'https://example.com/espn.png' };
  const candidate = { first_name: 'Test', second_name: 'Player', birth_date: '2000-01-02', code: 12345 };
  const store = new SourceStore(); store.read = async kind => kind === 'fpl' ? { elements: [candidate] } : { team: { id: '4' }, athletes: [{ id: '123', displayName: 'Test Player', dateOfBirth: '2000-01-02T00:00Z' }] };
  const provider = { detail: async () => ({ match: { group: '足球', league: 'epl' }, source: 'ESPN', tables: [{ people: [p] }] }) };
  const server = createService({ store, provider }); server.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => new Promise(r => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/profile?id=123&match=espn:epl:`;
  const verified = await (await fetch(base + '1:1')).json(); assert.match(verified.person.photo, /p12345\.png$/); assert.match(verified.source, /FPL/);
  candidate.birth_date = '2001-01-02';
  const rejected = await (await fetch(base + '2:2')).json(); assert.equal(rejected.person.photo, p.photo); assert.equal(rejected.source, 'ESPN');
});
test('stale API data stays labelled on subsequent cached reads after an outage', async t => {
  let fail = false, calls = 0;
  const provider = { detail: async () => { calls++; if (fail) throw new Error('offline'); return { match: { state: 'live' }, fetched: 123, tables: [] }; } };
  const server = createService({ provider }); server.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => new Promise(r => server.close(r)));
  const url = `http://127.0.0.1:${server.address().port}/api/v1/detail?match=espn:nba:1:1`;
  assert.equal((await (await fetch(url)).json()).fetched, 123); fail = true; await new Promise(r => setTimeout(r, 2050));
  for (let i = 0; i < 2; i++) { const result = await (await fetch(url)).json(); assert.equal(result.stale, true); assert.equal(result.fetched, 123); assert.match(result.warning, /保留缓存.*offline/); }
  assert.equal(calls, 2);
});
