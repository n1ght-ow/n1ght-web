import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fiveDetail, lolDetail, espn, espnDetail } from '../shared.mjs';
import { hasValue, readableTable, readableStats, matchFacts, gameResults, matchLeaders, personMetrics, sortedRows } from '../presentation.mjs';

const fixture = async name => JSON.parse(await readFile(new URL(`fixtures/${name}.json`, import.meta.url), 'utf8'));

test('presentation keeps real zero values and recognizes compound unknown values', () => {
  for (const value of [0, '0', '0 / 0 / 0', '0%', '-2']) assert.equal(hasValue(value), true);
  for (const value of ['', null, undefined, '—', '— / — / —', '— : —']) assert.equal(hasValue(value), false);
});

test('reading tables drop unknown, duplicate and internal columns without modifying source data', () => {
  const raw = { title: 'Players', tab: 'lineup', columns: ['选手', 'K', '评分', '站位', 'new_rating', 'K', '首杀'], rows: [['A', '0', '—', '3', '1', '0', '否'], ['B', '3', '—', '4', '2', '3', '否']], people: [{ name: 'A' }, { name: 'B' }] };
  const before = structuredClone(raw), view = readableTable(raw, 'cs2');
  assert.deepEqual(view.primary.columns, ['选手', 'K']); assert.equal(view.primary.rows[0][1], '0');
  assert.deepEqual(raw, before); assert.equal(readableTable({ ...raw, columns: ['选手', '评分'], rows: [['A', '—']] }, 'cs2'), null);
});

test('CS2 report separates core statistics from extra metrics for both match and map tables', async () => {
  const d = fiveDetail(await fixture('cs2')), raw = d.tables.find(t => t.category === '全场');
  raw.columns.push('首杀'); raw.rows.forEach((row, i) => row.push(String(i)));
  for (const tab of ['lineup', 'maps']) {
    const view = readableTable({ ...raw, tab }, 'cs2');
    assert.deepEqual(view.primary.columns, ['选手', 'K', 'D', 'A', 'ADR', 'KAST', 'Rating']);
    assert.deepEqual(view.extra.columns, ['选手', '首杀']); assert.equal(view.extra.collapsible, true);
    assert.equal(view.extra.people[0], raw.people[0]);
  }
});

test('football reading tables omit unavailable ratings and numeric formation-place codes', async () => {
  const raw = await fixture('epl'), d = espnDetail(raw, espn({ events: [raw.header] }, 'epl')[0]);
  const view = readableTable(d.tables[0], 'football');
  assert.ok(!view.primary.columns.includes('站位')); assert.ok(!view.primary.columns.includes('评分'));
  assert.ok(!view.extra?.columns.includes('站位'));
});

test('match facts put rankings in paired team rows and remove the repeated competition title', async () => {
  const d = fiveDetail(await fixture('cs2')), facts = matchFacts(d);
  assert.ok(!facts.main.some(([k]) => k === '赛事' || /排名/.test(k)));
  assert.ok(facts.secondary.some(([k]) => k === '赛事总奖金'));
  assert.equal(facts.rankings.length, 2); assert.equal(facts.rankings[0].name, d.match.home);
  assert.equal(facts.rankings[1].vrs, '3');
});

test('map results use published team scores and do not invent absent results', async () => {
  const d = fiveDetail(await fixture('cs2')), games = gameResults(d);
  assert.equal(games[0].home, '13'); assert.equal(games[0].away, '9'); assert.equal(games.length, 2);
  const absent = gameResults({ ...d, tables: [] }); assert.equal(absent[0].hasResult, false); assert.equal(absent[0].home, '—');
  const leaders = matchLeaders(d); assert.equal(leaders[0].person.name, 'Wicadia'); assert.equal(leaders[0].metric, 'Rating');
  assert.deepEqual(matchLeaders({ ...d, match: { ...d.match, state: 'scheduled' } }), []);
});

test('profile groups preserve useful zero metrics and omit false awards, duplicates and raw internal fields', () => {
  const view = personMetrics({ metrics: [['K', '0'], ['K', '0'], ['伤害占比', '—'], ['new_rating', '1'], ['本局最高 KDA', '否'], ['一血', '是'], ['视野得分', '0'], ['符文', '焦灼']] });
  assert.deepEqual(view.primary, [['K', '0'], ['视野得分', '0']]); assert.deepEqual(view.badges, ['一血']);
  assert.deepEqual(view.groups, [{ title: '技能与符文', rows: [['符文', '焦灼']] }]);
});

test('sorting is stable, keeps missing values last, and carries each player with their statistics', () => {
  const t = { columns: ['选手', 'Rating', 'K / D / A'], rows: [['A', '1.2', '2 / 1 / 0'], ['B', '—', '0 / 0 / 0'], ['C', '1.2', '1 / 0 / 5']], people: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] };
  assert.deepEqual(sortedRows(t, { label: 'Rating', direction: -1 }).map(r => r.person.name), ['A', 'C', 'B']);
  const kda = sortedRows(t, { label: 'K / D / A', direction: -1 }); assert.deepEqual(kda.map(r => r.person.name), ['C', 'A', 'B']);
  assert.equal(kda[0].row[0], kda[0].person.name); assert.equal(t.rows[0][0], 'A');
});

test('readable comparisons deduplicate values and never expose pregame totals as match data', () => {
  const d = { match: { state: 'live' }, stats: [{ label: '助攻', home: '0', away: '1' }, { label: '助攻', home: '0', away: '1' }, { label: '评分', home: '—', away: '—' }] };
  assert.equal(readableStats(d).length, 1); assert.equal(readableStats(d)[0].home, '0');
  assert.deepEqual(readableStats({ ...d, match: { state: 'scheduled' } }), []);
});

test('LOL presentation retains structured equipment and champion images', async () => {
  const base = await fixture('lol-base'), raw = lolDetail(base, await fixture('lol-rich'), `qq:lol:${base.bMatchId}`);
  const t = raw.tables.find(t => t.columns.includes('出装')), view = readableTable(t, 'lol');
  const gear = view.primary.rows[0][view.primary.columns.indexOf('出装')];
  assert.ok(gear.images.length); assert.match(gear.images[0].image, /3157\.png$/);
  assert.equal(view.primary.people[0], t.people[0]);
});
