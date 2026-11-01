import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleCount, mergeSchedule } from '../schedule-state.mjs';

const match = (id, state = 'scheduled', score = '') => ({ id, state, start: 1, homeScore: score });

test('known counts survive refresh warnings, failures and empty successful schedules', () => {
  const batch = { fetched: 123, matches: [match('a'), match('b')] };
  for (const change of [{}, { loading: true }, { error: 'offline' }, { warning: '部分日期读取失败' }, { stale: true }]) {
    assert.equal(scheduleCount([{ ...batch, ...change }]).value, '2');
  }
  assert.equal(scheduleCount([{ fetched: 123, matches: [], error: 'offline' }]).value, '0');
  assert.equal(scheduleCount([undefined]).value, '—');
  assert.equal(scheduleCount([batch, undefined]).value, '2+');
  assert.match(scheduleCount([{ ...batch, error: 'offline' }]).note, /上次数据/);
});

test('partial refresh keeps omitted scheduled and live matches, accepts fresh scores and preserves terminal locks', () => {
  const old = { matches: [match('scheduled'), match('live', 'live', '1'), match('final', 'final', '2')] };
  const fresh = [match('live', 'live', '3'), match('final', 'final', '4')];
  for (const flag of [{ warning: '部分日期读取失败' }, { stale: true }]) {
    const result = mergeSchedule(old, { matches: fresh, ...flag });
    assert.equal(result.matches.length, 3);
    assert.equal(result.matches.find(m => m.id === 'live').homeScore, '3');
    assert.equal(result.matches.find(m => m.id === 'final').homeScore, '2');
    assert.match(result.warning, /保留上次读取内容/);
  }
  assert.equal(mergeSchedule(old, { matches: [], warning: 'offline' }, true).matches.length, 3);
  assert.equal(mergeSchedule(old, { matches: fresh }, true).matches.find(m => m.id === 'final').homeScore, '4');
  assert.deepEqual(mergeSchedule({ ...old, emptySince: Date.now() - 15000 }, { matches: [] }).matches.map(m => m.id), ['final']);
  assert.deepEqual(old.matches.map(m => m.homeScore), ['', '1', '2']);
});

test('a sudden empty success keeps the list until a later complete empty read confirms it', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 });
  const old = { fetched: 123, matches: [match('a'), match('b', 'live', '1')] };
  const empty = { fetched: 100000, matches: [] };
  const first = mergeSchedule(old, empty, true);
  assert.equal(first.matches.length, 2);
  assert.equal(first.fetched, 123);
  assert.equal(first.emptySince, 100000);
  assert.match(first.warning, /空赛程.*保留上次读取内容/);
  t.mock.timers.tick(14999);
  assert.equal(mergeSchedule(first, empty, true).matches.length, 2);
  t.mock.timers.tick(1);
  const confirmed = mergeSchedule(first, empty);
  assert.deepEqual(confirmed.matches, []);
  assert.equal(confirmed.warning, '');
  assert.equal(confirmed.emptySince, 0);
  const recovered = mergeSchedule(first, { matches: [match('b', 'live', '3')] });
  assert.deepEqual(recovered.matches.map(m => m.id), ['b']);
  assert.equal(recovered.emptySince, 0);
  const partial = mergeSchedule(first, { ...empty, warning: 'offline' });
  assert.equal(partial.matches.length, 2);
  assert.equal(partial.emptySince, 0);
  assert.deepEqual(mergeSchedule(undefined, empty).matches, []);
});
