// Reading rules only. Keep the source payload intact for refresh and profiles.
import { show, text, list } from './shared.mjs?v=2';

export function hasValue(value) {
  const valueText = text(value);
  return !['', 'null', 'undefined'].includes(valueText) && !!valueText.replace(/[—\s/|:·-]/g, '');
}
const internal = name => /_|^[a-z]+[A-Z]|^(?:id|accountId|站位)$/.test(name);
const sameCell = (a, b) => !hasValue(a) || !hasValue(b) || show(a) === show(b);
const priorities = {
  cs2: ['选手', 'K', 'D', 'A', 'ADR', 'KAST', 'Rating'],
  nba: ['球员', '时间', '得分', '篮板', '助攻', '投篮', '三分', '罚球', '抢断', '盖帽', '正负值'],
  football: ['球员', '位置', '状态', '进球', '助攻', '射门', '射正', '传球', '成功传球', '评分'],
};

export function readableTable(source, sport) {
  if (!list(source.rows).length) return null;
  const groups = [];
  source.columns.forEach((name, index) => {
    if (index && (internal(name) || /^本局最高/.test(name) || !source.rows.some(r => hasValue(r[index])) || source.rows.every(r => !hasValue(r[index]) || ['否', 'false'].includes(text(r[index]))))) return;
    const duplicate = groups.find(g => g.name === name && source.rows.every(r => g.indices.every(i => sameCell(r[i], r[index]))));
    if (duplicate) duplicate.indices.push(index);
    else groups.push({ name, indices: [index] });
  });
  if (groups.length < 2) return null;
  const rows = source.rows.map(row => groups.map(g => row[g.indices.find(i => hasValue(row[i])) ?? g.indices[0]]));
  const t = { ...source, columns: groups.map(g => g.name), rows, people: source.people || [], collapsible: source.collapsible || source.tab === 'events' && source.rows.length > 20 };
  const playerTable = source.tab === 'lineup' || sport === 'cs2' && source.tab === 'maps' && source.columns[0] === '选手';
  const order = playerTable && !source.collapsible && source.category !== '伤停' ? priorities[sport] : null;
  if (!order) return { primary: t, extra: null };
  const core = order.map(name => t.columns.indexOf(name)).filter(i => i >= 0);
  if (core.length < 2) return { primary: t, extra: null };
  const other = t.columns.map((_, i) => i).filter(i => i && !core.includes(i));
  const project = indices => ({ ...t, columns: indices.map(i => t.columns[i]), rows: t.rows.map(row => indices.map(i => row[i])) });
  return {
    primary: project(core),
    extra: other.length ? { ...project([0, ...other]), title: `${t.title} · 更多数据`, collapsible: true } : null,
  };
}

export function readableStats(detail) {
  const seen = new Set();
  return detail.match.state === 'scheduled' ? [] : list(detail.stats).filter(s => {
    const key = `${s.label}:${s.home}:${s.away}`;
    if (seen.has(key) || !hasValue(s.home) && !hasValue(s.away)) return false;
    seen.add(key); return true;
  });
}

export function matchFacts(detail) {
  const main = [], secondary = [], rankings = new Map();
  const seen = new Set();
  for (const [name, value] of list(detail.facts)) {
    if (!hasValue(value) || name === '赛事' || seen.has(`${name}:${value}`)) continue;
    seen.add(`${name}:${value}`);
    const rank = /^(.*?) · (来源排名|VRS 排名)$/.exec(name);
    if (rank) {
      const row = rankings.get(rank[1]) || { name: rank[1] };
      row[rank[2] === '来源排名' ? 'source' : 'vrs'] = value; rankings.set(rank[1], row); continue;
    }
    if (/奖金|转播|赛季战绩|说明/.test(name)) secondary.push([name, value]);
    else main.push([name, value]);
  }
  return { main: main.slice(0, 6), secondary: [...main.slice(6), ...secondary], rankings: [...rankings.values()] };
}

export function gameResults(detail) {
  return list(detail.games).map(game => {
    if (detail.match.league !== 'cs2') return { ...game, hasResult: !!game.winner };
    const scores = detail.tables.find(t => t.tab === 'maps' && t.category === game.id && t.columns.includes('总分'));
    const scoreAt = scores?.columns.indexOf('总分');
    const value = side => scores?.rows.find(r => text(r[0]) === detail.match[side])?.[scoreAt];
    const home = value('home'), away = value('away');
    return { ...game, home: show(home), away: show(away), hasResult: hasValue(home) && hasValue(away) };
  });
}

export function matchLeaders(detail) {
  const metric = detail.match.league === 'cs2' ? 'Rating' : detail.match.league === 'nba' ? '得分' : '';
  if (!metric || detail.match.state === 'scheduled') return [];
  const leaders = [];
  for (const source of detail.tables.filter(t => t.tab === 'lineup' && !t.collapsible && t.category !== '伤停')) {
    const column = source.columns.indexOf(metric); if (column < 0) continue;
    const candidates = source.rows.map((row, i) => ({ value: row[column], person: source.people[i], index: i })).filter(p => p.person?.name && hasValue(p.value) && Number.isFinite(Number(p.value)));
    candidates.sort((a, b) => Number(b.value) - Number(a.value));
    if (candidates.length) leaders.push({ ...candidates[0], metric, source, tableIndex: detail.tables.indexOf(source) });
  }
  return leaders;
}

export function personMetrics(person) {
  const seen = new Set(), badges = [], groups = new Map();
  const primary = [];
  const main = new Set(['时间', '得分', '篮板', '助攻', '抢断', '盖帽', '正负值', 'K', 'D', 'A', 'ADR', 'KAST', 'Rating', '击杀', '死亡', 'KDA', '补刀', '对英雄伤害', '经济', '视野得分', '进球', '射门', '射正', '传球', '评分', '名次', '圈数', '积分', '成绩 / 用时']);
  for (const [name, value] of list(person.metrics)) {
    if (!hasValue(value) || internal(name) || seen.has(name) || name === '英雄') continue;
    seen.add(name);
    if (value === '否' || value === 'false') continue;
    if (value === '是' || value === 'true') { badges.push(name); continue; }
    if (main.has(name)) { primary.push([name, value]); continue; }
    const group = /伤害|承伤|回复|暴击/.test(name) ? '输出与承伤' : /守卫|视野|真眼/.test(name) ? '视野' : /经济|金币|补刀|野区|野怪/.test(name) ? '经济与资源' : /符文|召唤师/.test(name) ? '技能与符文' : '更多统计';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push([name, value]);
  }
  return { primary, badges, groups: [...groups].map(([title, rows]) => ({ title, rows })) };
}

export function sortedRows(t, sort) {
  const rows = t.rows.map((row, index) => ({ row, person: t.people[index], index }));
  if (!sort) return rows;
  const column = t.columns.indexOf(sort.label); if (column < 0) return rows;
  return rows.sort((a, b) => {
    const x = show(a.row[column]), y = show(b.row[column]);
    if (!hasValue(x) && !hasValue(y)) return a.index - b.index;
    if (!hasValue(x)) return 1; if (!hasValue(y)) return -1;
    const number = value => {
      if (sort.label === 'K / D / A' && /^\d+\s*\/\s*\d+\s*\/\s*\d+$/.test(value)) {
        const [kills, deaths, assists] = value.split('/').map(Number);
        return deaths ? (kills + assists) / deaths : kills + assists ? Infinity : 0;
      }
      return Number(value.replace(/[%+,]/g, ''));
    };
    const xn = number(x), yn = number(y);
    if (xn === yn) return a.index - b.index;
    if (xn === Infinity || yn === Infinity) return (xn > yn ? 1 : -1) * sort.direction;
    return (Number.isFinite(xn) && Number.isFinite(yn) ? xn - yn : x.localeCompare(y, 'zh-CN', { numeric: true })) * sort.direction || a.index - b.index;
  });
}
