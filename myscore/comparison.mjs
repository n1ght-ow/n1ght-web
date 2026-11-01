// Compare only metrics with a defined direction; unknown and equal values stay neutral.
import { text } from './shared.mjs?v=2';

const neutral = () => ({ home: 'neutral', away: 'neutral' });
const higher = new Set(['控球率 %', '控球时间', '射门', '射正', '角球', '成功传球', '传球', '扑救', '射正比例', '点球进球', '主罚点球', '传球成功比例', '成功传中', '传中', '传中成功比例', '长传', '成功长传', '长传成功比例', '封堵射门', '有效抢断', '抢断', '抢断成功比例', '拦截', '有效解围', '解围', '投篮命中率 %', '三分命中率 %', '罚球命中率 %', '篮板', '前场篮板', '后场篮板', '助攻', '盖帽', '快攻得分', '内线得分', '最大领先', '领先时间占比', '得分', '首攻', '总推进码数', '净传球码数', '冲球码数', 'Passing 1st downs', 'Rushing 1st downs', '1st downs from penalties', 'Yards per Play', 'Passing', 'Yards per pass', 'Rushing', 'Yards per rush', 'Defensive / Special Teams TDs', '击杀', '经济', '防御塔', '小龙', '大龙', '虚空巢虫', '远古龙', '峡谷先锋', '厄塔汗', '水晶', 'T 方', 'CT 方', '加时', '总分']);
const lower = new Set(['犯规', '黄牌', '红牌', '越位', '失误', '球队失误', '总失误', '技术犯规', '总技术犯规', '恶意犯规', '失误失分', 'Interceptions thrown', 'Fumbles lost']);
const ratios = new Set(['投篮', '三分', '罚球', 'Comp/Att', '3rd down efficiency', '4th down efficiency', 'Red Zone (Made-Att)']);

function number(value) {
  const s = text(value).replaceAll(',', '').replaceAll('−', '-').replace(/[%％]$/, '');
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) ? Number(s) : NaN;
}
function pair(value) {
  const match = /^(\d+)\s*[-/]\s*(\d+)$/.exec(text(value));
  return match ? [Number(match[1]), Number(match[2])] : null;
}
export function compareNumbers(home, away, direction = 'higher') {
  const h = number(home), a = number(away);
  if (!Number.isFinite(h) || !Number.isFinite(a) || Math.abs(h - a) <= 1e-9) return neutral();
  const win = direction === 'lower' ? h < a : h > a;
  return { home: win ? 'better' : 'worse', away: win ? 'worse' : 'better' };
}
export function compareMetric(label, home, away) {
  if (ratios.has(label)) {
    const h = pair(home), a = pair(away);
    if (!h || !a || !h[1] || !a[1] || h[0] > h[1] || a[0] > a[1]) return neutral();
    return compareNumbers(h[0] / h[1], a[0] / a[1]);
  }
  if (label === 'Penalties' || label === 'Sacks-Yards Lost') {
    const h = pair(home), a = pair(away);
    if (!h || !a) return neutral();
    return compareNumbers(h[1] === a[1] ? h[0] : h[1], h[1] === a[1] ? a[0] : a[1], 'lower');
  }
  if (label === '控球时间') {
    const seconds = value => { const m = /^(\d+):([0-5]\d)$/.exec(text(value)); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
    return compareNumbers(seconds(home), seconds(away));
  }
  if (lower.has(label)) return compareNumbers(home, away, 'lower');
  if (higher.has(label) || /^(Q[1-4]|OT\d+)$/.test(label)) return compareNumbers(home, away);
  return neutral();
}
export function comparisonBasis(label) {
  if (ratios.has(label)) return ['投篮', '三分', '罚球'].includes(label) ? '按命中率比较' : '按成功率比较';
  if (label === 'Penalties' || label === 'Sacks-Yards Lost') return '先比较损失码数，再比较次数，较少为优';
  if (lower.has(label)) return '数值越低越好';
  if (higher.has(label) || /^(Q[1-4]|OT\d+)$/.test(label)) return '数值越高越好';
  return '';
}

export function matchComparison(match) {
  const h = number(match.homeScore), a = number(match.awayScore);
  const football = match.group === '足球' || ['epl', 'ucl', 'efl', 'fa'].includes(match.league);
  const ph = number(match.homeShootout), pa = number(match.awayShootout);
  const hasPenalties = football && Number.isFinite(h) && h === a && Number.isInteger(ph) && Number.isInteger(pa) && ph >= 0 && pa >= 0;
  if (match.state !== 'final' || !Number.isFinite(h) || !Number.isFinite(a) || h < 0 || a < 0) return { regular: neutral(), penalties: neutral(), hasPenalties, decision: 'pending' };
  if (hasPenalties) return { regular: neutral(), penalties: compareNumbers(ph, pa), hasPenalties, decision: ph === pa ? 'unresolved' : 'penalties' };
  if (football && h === a && (text(match.homeShootout) || text(match.awayShootout))) return { regular: neutral(), penalties: neutral(), hasPenalties, decision: 'unresolved' };
  return { regular: compareNumbers(h, a), penalties: neutral(), hasPenalties, decision: h === a ? 'draw' : 'score' };
}

export function tableComparisons(table, match) {
  const tones = table.rows.map(row => row.map(() => 'neutral'));
  if (table.rows.length !== 2 || !['overview', 'maps'].includes(table.tab) || !['球队', '队伍'].includes(table.columns[0])) return tones;
  const hi = table.rows.findIndex(row => text(row[0]) === match.home), ai = table.rows.findIndex(row => text(row[0]) === match.away);
  if (hi < 0 || ai < 0 || hi === ai) return tones;
  table.columns.forEach((label, column) => {
    if (!column) return;
    const result = compareMetric(label, table.rows[hi][column], table.rows[ai][column]);
    tones[hi][column] = result.home; tones[ai][column] = result.away;
  });
  return tones;
}
