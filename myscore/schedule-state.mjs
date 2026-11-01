import { list, mergeMatches, mergeTerminal } from './shared.mjs?v=2';

export function scheduleCount(batches) {
  const known = batches.filter(b => b?.fetched);
  if (!known.length) return { value: '—', note: '尚未读取赛程' };
  const count = known.reduce((n, b) => n + list(b.matches).length, 0);
  const incomplete = known.length !== batches.length;
  const cached = known.some(b => b.error || b.warning || b.stale);
  return {
    value: incomplete ? `${count}+` : String(count),
    note: incomplete ? `已读取 ${count} 场，部分赛事尚未读取` : cached ? `${count} 场已读取比赛；更新不完整，包含上次数据` : `${count} 场比赛`,
  };
}

export function mergeSchedule(old, result, allowCorrection = false) {
  const fresh = list(result.matches), previous = list(old?.matches);
  const partial = !!(result.warning || result.stale);
  const now = Date.now();
  // One empty response must not erase a previously populated programme.
  // A second complete empty read, after the retry interval, confirms removal.
  const unexpectedEmpty = !partial && !fresh.length && previous.some(m => !['final', 'cancelled'].includes(m.state));
  if (unexpectedEmpty && (!old?.emptySince || now - old.emptySince < 15000)) {
    return {
      ...result, fetched: old.fetched, matches: previous,
      emptySince: old.emptySince || now,
      warning: '来源本次返回空赛程，保留上次读取内容，稍后重新核实',
    };
  }
  const matches = mergeTerminal(previous, partial ? mergeMatches(previous, fresh) : fresh, allowCorrection);
  const ids = new Set(fresh.map(m => m.id));
  const retained = partial && previous.some(m => !ids.has(m.id));
  return { ...result, matches, emptySince: 0, warning: [result.warning, retained ? '部分赛程未能复核，保留上次读取内容' : ''].filter(Boolean).join('；') };
}
