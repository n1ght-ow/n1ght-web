import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compareNumbers, compareMetric, comparisonBasis, matchComparison, tableComparisons } from '../comparison.mjs';
import { espn } from '../shared.mjs';

const neutral = { home: 'neutral', away: 'neutral' };
const better = { home: 'better', away: 'worse' };
const worse = { home: 'worse', away: 'better' };
const football = { group: '足球', league: 'efl', state: 'final', homeScore: '2', awayScore: '2', homeShootout: '', awayShootout: '' };

test('higher totals and percentages favour the larger valid value', () => {
  assert.deepEqual(compareMetric('控球率 %', '62.4', '37.6'), better);
  assert.deepEqual(compareMetric('篮板', '41', '48'), worse);
  assert.deepEqual(compareMetric('投篮命中率 %', '52%', '42%'), better);
  assert.deepEqual(compareMetric('经济', '75,994', '57395'), better);
  assert.deepEqual(compareMetric('控球时间', '29:37', '30:23'), worse);
});

test('fouls, cards and turnovers favour the smaller value, including real zero', () => {
  for (const label of ['犯规', '黄牌', '红牌', '越位', '失误', '技术犯规', '总失误', '失误失分', 'Interceptions thrown']) {
    assert.deepEqual(compareMetric(label, '0', '3'), better);
    assert.deepEqual(compareMetric(label, '3', '0'), worse);
  }
});

test('made-attempted shooting compares efficiency, not attempts or raw string order', () => {
  assert.deepEqual(compareMetric('投篮', '42-81', '40-96'), better);
  assert.deepEqual(compareMetric('罚球', '20-27', '24-33'), better);
  assert.deepEqual(compareMetric('三分', '3-9', '1-3'), neutral);
  assert.deepEqual(compareMetric('罚球', '0-0', '1-2'), neutral);
  assert.deepEqual(compareMetric('投篮', '3-2', '2-5'), neutral);
  assert.equal(comparisonBasis('罚球'), '按命中率比较');
});

test('NFL penalty and sack pairs compare lost yards first and counts second', () => {
  assert.deepEqual(compareMetric('Penalties', '6-40', '4-60'), better);
  assert.deepEqual(compareMetric('Sacks-Yards Lost', '3-20', '2-20'), worse);
});

test('equal, unknown, unranked and missing metrics stay neutral', () => {
  for (const value of ['', '—', '-', null, 'N/A']) assert.deepEqual(compareMetric('射门', value, '3'), neutral);
  assert.deepEqual(compareMetric('红牌', '0', '0'), neutral);
  assert.deepEqual(compareMetric('领先交替', '10', '2'), neutral);
  assert.deepEqual(compareMetric('未知项目', '10', '2'), neutral);
  assert.deepEqual(compareNumbers('1.0000000001', '1'), neutral);
});

test('ordinary results colour only completed scores, and ordinary football draws stay neutral', () => {
  assert.deepEqual(matchComparison({ ...football, homeScore: '0', awayScore: '1' }).regular, worse);
  const draw = matchComparison(football); assert.equal(draw.decision, 'draw'); assert.equal(draw.hasPenalties, false); assert.deepEqual(draw.regular, neutral);
  for (const state of ['scheduled', 'live', 'delayed', 'cancelled']) assert.deepEqual(matchComparison({ ...football, state, homeScore: '3', awayScore: '1' }).regular, neutral);
  assert.deepEqual(matchComparison({ ...football, homeScore: '—', awayScore: '0' }).regular, neutral);
});

test('penalty shootout winners are separate from the tied regular score', () => {
  const result = matchComparison({ ...football, homeScore: '2.0', homeShootout: '4', awayShootout: '3' });
  assert.equal(result.decision, 'penalties'); assert.equal(result.hasPenalties, true);
  assert.deepEqual(result.regular, neutral); assert.deepEqual(result.penalties, better);
  const reverse = matchComparison({ ...football, homeShootout: '3', awayShootout: '5' }); assert.deepEqual(reverse.penalties, worse);
  for (const [homeShootout, awayShootout] of [['4', ''], ['3', '3'], ['0', '0'], ['2.5', '3']]) {
    const incomplete = matchComparison({ ...football, homeShootout, awayShootout });
    assert.equal(incomplete.decision, 'unresolved'); assert.deepEqual(incomplete.regular, neutral); assert.deepEqual(incomplete.penalties, neutral);
  }
});

test('real ESPN penalty fixture confirms shootout parsing and ordinary fixtures have no fake shootout', async () => {
  const raw = JSON.parse(await readFile(new URL('fixtures/efl-penalties.json', import.meta.url), 'utf8'));
  const root = raw.header ? { events: [raw.header] } : raw;
  const match = espn(root, 'efl').find(m => m.homeShootout !== '' && m.awayShootout !== '');
  assert.ok(match); assert.equal(matchComparison(match).decision, 'penalties'); assert.deepEqual(matchComparison(match).regular, neutral);
  const normal = JSON.parse(await readFile(new URL('fixtures/epl.json', import.meta.url), 'utf8'));
  assert.equal(matchComparison(espn({ events: [normal.header] }, 'epl')[0]).hasPenalties, false);
});

test('two-team period comparisons stay associated with their team through sorting', () => {
  const t = { tab: 'overview', columns: ['球队', 'Q1', 'Q2', 'Q3', 'Q4'], rows: [['Dallas', '27', '17', '32', '40'], ['Houston', '20', '31', '33', '27']] };
  assert.deepEqual(tableComparisons(t, { home: 'Dallas', away: 'Houston' }), [
    ['neutral', 'better', 'worse', 'worse', 'better'], ['neutral', 'worse', 'better', 'better', 'worse'],
  ]);
  const reverse = tableComparisons({ ...t, rows: t.rows.slice().reverse() }, { home: 'Dallas', away: 'Houston' });
  assert.equal(reverse[0][1], 'worse'); assert.equal(reverse[1][1], 'better');
  assert.ok(tableComparisons({ ...t, tab: 'lineup' }, { home: 'Dallas', away: 'Houston' }).flat().every(t => t === 'neutral'));
});
