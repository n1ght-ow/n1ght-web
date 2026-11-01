// Source adapters shared by the browser and the small Node service.
export const competitions = [
  ['epl', '英超', '足球', 'soccer/eng.1'], ['ucl', '欧冠', '足球', 'soccer/uefa.champions'],
  ['efl', '联赛杯', '足球', 'soccer/eng.league_cup'], ['fa', '足总杯', '足球', 'soccer/eng.fa'],
  ['nba', 'NBA', 'NBA', 'basketball/nba'], ['nfl', 'NFL', 'NFL', 'football/nfl'],
  ['f1', 'F1', 'F1', 'racing/f1'], ['cs2', 'CS2', 'CS2', ''], ['lol', 'LOL Worlds', 'LOL', ''],
].map(([id, name, group, path]) => ({ id, name, group, path }));
export const competition = id => competitions.find(c => c.id === id);
export const list = value => Array.isArray(value) ? value : [];
export function text(value, fallback = '') {
  if (value == null || value === 'null') return fallback;
  if (Array.isArray(value)) return fallback;
  if (typeof value === 'object') return text(value.displayValue ?? value.displayName ?? value.name ?? value.value, fallback);
  return String(value).trim() || fallback;
}
export const show = value => text(value, '—');
export const https = value => /^(https?:)?\/\//.test(text(value)) ? text(value).replace(/^(http:)?\/\//, 'https://') : '';
export const logo = team => https(team?.logo || team?.logos?.[0]?.href);
export const dayOf = ms => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
export const today = () => dayOf(Date.now());
export const shiftDay = (day, offset) => new Date(Date.parse(`${day}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
export const localTime = value => !value ? 0 : Date.parse(String(value).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(value) ? '' : '+08:00')) || 0;
export const time = (ms, options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) => ms ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', ...options }).format(ms) : '时间待定';
export const stateLabels = { live: '进行中', scheduled: '未开始', final: '已结束', cancelled: '已取消', delayed: '延期 / 暂停', unknown: '状态待确认' };
export function state(name = '', raw = '') {
  const n = name.toLowerCase();
  if (/cancel|abandon/.test(n)) return 'cancelled';
  if (/postpon|delay|suspend/.test(n)) return 'delayed';
  if (/final|finished|defwin/.test(n) || raw === 'post') return 'final';
  if (raw === 'in' || /^(current|running)$/.test(n)) return 'live';
  return raw === 'pre' || /upcoming|scheduled/.test(n) ? 'scheduled' : 'unknown';
}
export function matchBase(league, id, fetched = Date.now()) {
  const c = competition(league);
  if (!c) throw new Error('未知赛事');
  return { id, league, group: c.group, source: c.path ? 'ESPN' : league === 'cs2' ? '5EPlay' : '英雄联盟赛事官网', updated: fetched, start: 0, timeConfirmed: false, state: 'unknown', status: stateLabels.unknown, home: '', away: '', homeId: '', awayId: '', homeLogo: '', awayLogo: '', homeScore: '', awayScore: '', homeShootout: '', awayShootout: '', title: '', detail: '', results: [], url: '', event: '', tierOne: false };
}
export function parseAssignment(body) {
  const source = String(body).trim();
  const begin = source.indexOf('{'), end = source.lastIndexOf('}');
  if (begin < 0 || begin > 100 || !/^;?$/.test(source.slice(end + 1).trim())) throw new Error('官网数据格式变化');
  return JSON.parse(source.slice(begin, end + 1)); // Never execute remote JavaScript.
}
export function espn(root, league, fetched = Date.now()) {
  if (!Array.isArray(root.events)) throw new Error('来源未返回赛事列表');
  if (root.events.length >= 1000) throw new Error('赛程达到来源上限，覆盖可能不完整');
  const c = competition(league), result = [];
  for (const e of root.events) for (const co of list(e.competitions)) {
    if (!e.id || !co.id) continue;
    const m = matchBase(league, `espn:${league}:${e.id}:${co.id}`, fetched);
    m.start = Date.parse(co.date || e.date) || 0;
    m.timeConfirmed = m.start > 0 && co.timeValid !== false;
    const status = co.status || e.status || {}, ty = status.type || {};
    m.state = state(ty.name, ty.state); m.status = stateLabels[m.state];
    const clock = text(status.displayClock), period = Number(status.period) || 0;
    if (m.state === 'live') m.status = /HALFTIME/.test(ty.name) ? '中场休息' : /END_PERIOD/.test(ty.name) ? '节间休息' : c.group === '足球' ? clock || '进行中' : c.id === 'f1' ? (period ? `第 ${period} 圈` : '进行中') : `${period > 4 ? `加时 ${period - 4}` : period ? `第 ${period} 节` : '进行中'}${clock ? ` · ${clock}` : ''}`;
    m.url = list(e.links).find(l => l.href?.startsWith('https://www.espn.com/'))?.href || '';
    if (league === 'f1') {
      const ab = co.type?.abbreviation || '';
      const session = ({ FP1: '练习赛 1', FP2: '练习赛 2', FP3: '练习赛 3', Qual: '排位赛', Q: '排位赛', Race: '正赛', Sprint: '冲刺赛', 'Sprint Qual': '冲刺排位', SQ: '冲刺排位' })[ab] || ab;
      m.title = `${e.name || 'F1'} · ${session || '场次待确认'}`; m.detail = session;
      if (m.state !== 'scheduled') m.results = list(co.competitors).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).filter(d => d.athlete?.displayName).slice(0, 10).map(d => `${d.order ? `${d.order}. ` : ''}${d.athlete.displayName}`);
    } else {
      const home = list(co.competitors).find(t => t.homeAway === 'home'), away = list(co.competitors).find(t => t.homeAway === 'away');
      if (!home || !away) continue;
      for (const [side, t] of [['home', home], ['away', away]]) {
        m[side] = text(t.team?.displayName, '对阵待定'); m[`${side}Id`] = text(t.team?.id); m[`${side}Logo`] = logo(t.team);
        if (m.state !== 'scheduled') m[`${side}Score`] = text(t.score);
        const shootout = text(t.shootoutScore ?? t.score?.shootoutScore);
        if (/PEN/.test(ty.name) && /^\d+(\.0+)?$/.test(shootout)) m[`${side}Shootout`] = String(Number(shootout));
      }
      m.detail = text(co.venue?.fullName);
      m.results = list(home.linescores).map((s, i) => `第 ${i + 1} 节 ${show(s)} : ${show(away.linescores?.[i])}`);
    }
    result.push(m);
  }
  return result;
}
export const isTierOne = row => ['1', '2', '7'].includes(text(row.tt_info?.grade ?? row.mc_info?.grade)) || ['Major', 'S+赛事', 'S级赛事'].includes(row.tt_info?.grade_label);
export const isSpirit = m => [m.homeId, m.awayId].includes('csgo_tm_7020') || (!m.homeId && !m.awayId && [m.home, m.away].some(n => /^(team\s*)?spirit$/i.test(n)));
export function fiveMatch(row, confirmed = false, fetched = Date.now()) {
  const mc = row.mc_info || {}, tournament = row.tt_info || {}, s = row[confirmed ? 'global_state' : 'state'] || {};
  if (!/^csgo_mc_\d+$/.test(mc.id)) throw new Error('CS2 比赛标识无效');
  const m = matchBase('cs2', `five:cs2:${mc.id}`, fetched);
  for (const [side, team] of [['home', mc.t1_info || {}], ['away', mc.t2_info || {}]]) {
    m[side] = text(team.disp_name, '对阵待定'); m[`${side}Id`] = text(team.id); m[`${side}Logo`] = /\/null\.png$/.test(team.logo) ? '' : https(team.logo);
  }
  m.start = Number(mc.ts || mc.plan_ts) * 1000 || 0; m.timeConfirmed = m.start > 0;
  m.state = ({ 0: 'scheduled', 1: 'live', 2: 'final' })[s.status] || 'unknown'; m.status = stateLabels[m.state];
  if (m.state !== 'scheduled') { m.homeScore = text(s.t1_score); m.awayScore = text(s.t2_score); }
  m.event = text(tournament.disp_name); m.tierOne = isTierOne(row);
  m.detail = [m.event, mc.format ? `BO${mc.format}` : '', mc.tt_stage_desc].filter(Boolean).join(' · '); m.url = 'https://www.5eplay.com/';
  return m;
}
export function fiveHistory(root, fetched = Date.now()) {
  const rows = root.data?.items?.matches;
  if (!root.success || !Array.isArray(rows)) throw new Error('5EPlay 战队赛程格式变化');
  return rows.map(row => {
    const mc = row.mc_info || {}, info = mc.home_info || {}, opponent = mc.opponent_info || {};
    const rawState = text(mc.match_status);
    const status = ['0', '1', '2'].includes(rawState) ? rawState : ({ past: '2', future: '0', upcoming: '0', live: '1' })[mc.status];
    const m = fiveMatch({ mc_info: { ...mc, t1_info: info, t2_info: opponent }, tt_info: row.tt_info, state: { status, t1_score: mc.home_score, t2_score: mc.opponent_score } }, false, fetched);
    // The team's feed uses its own orientation, not home/away stadium roles.
    const completed = row.result || {};
    if (completed.home_score != null) m.homeScore = text(completed.home_score);
    if (completed.opponent_score != null) m.awayScore = text(completed.opponent_score);
    return m;
  });
}
export function worlds(root, fetched = Date.now()) {
  if (text(root.status) !== '0' || !Array.isArray(root.msg)) throw new Error('LOL 官方赛程格式变化');
  return root.msg.filter(e => /全球总决赛|\bworlds\b|world championship/i.test(e.GameName || '') && !/esports world cup/i.test(e.GameName)).filter(e => e.bMatchId).map(e => {
    const m = matchBase('lol', `qq:lol:${e.bMatchId}`, fetched), teams = text(e.bMatchName).split(/\s+vs\s+/i);
    m.start = localTime(e.MatchDate || e.MatchTime); m.timeConfirmed = m.start > 0;
    m.home = text(e.TeamShortNameA || e.TeamNameA || teams[0], '对阵待定'); m.away = text(e.TeamShortNameB || e.TeamNameB || teams[1], '对阵待定');
    m.homeId = text(e.TeamA); m.awayId = text(e.TeamB);
    m.state = ({ 1: 'scheduled', 2: 'live', 3: 'final' })[e.MatchStatus] || 'unknown'; m.status = stateLabels[m.state];
    if (m.state !== 'scheduled') { m.homeScore = text(e.ScoreA); m.awayScore = text(e.ScoreB); }
    m.event = text(e.GameName); m.detail = [e.GameName, e.GameModeName, e.GameProcName].filter(Boolean).join(' · '); m.url = 'https://lpl.qq.com/';
    const published = localTime(e.lastUpdateTime || root.lastUpTime); if (published && published <= fetched + 300000) m.updated = published;
    for (const icon of list(e.TeamIcon)) { if (text(icon.TeamId) === m.homeId) m.homeLogo = https(icon.TeamIcon); if (text(icon.TeamId) === m.awayId) m.awayLogo = https(icon.TeamIcon); }
    return m;
  });
}
export const mergeMatches = (...groups) => [...new Map(groups.flat().map(m => [m.id, m])).values()].sort((a, b) => (a.start || Infinity) - (b.start || Infinity) || a.id.localeCompare(b.id));
export function mergeTerminal(old, fresh, allowCorrection = false) {
  const settled = new Map(list(old).filter(m => ['final', 'cancelled'].includes(m.state)).map(m => [m.id, m]));
  return mergeMatches([...settled.values()], fresh.map(m => !allowCorrection && settled.has(m.id) ? settled.get(m.id) : m));
}
export function score(m, side) {
  if (m.state === 'scheduled') return '—';
  const normal = show(m[`${side}Score`]);
  return m.homeShootout !== '' && m.awayShootout !== '' && m.homeScore === m.awayScore ? `${normal} (${m[`${side}Shootout`]})` : normal;
}
export function delayFor(matches, day = today(), now = Date.now()) {
  if (matches.some(m => m.state === 'live')) return 2000;
  if (day < today()) return 0;
  if (matches.some(m => m.state === 'scheduled' && m.start > 0 && m.start - now < 7200000)) return 30000;
  if (matches.some(m => ['unknown', 'delayed'].includes(m.state))) return 60000;
  return matches.length && matches.every(m => ['final', 'cancelled'].includes(m.state)) ? 21600000 : 1800000;
}

const labels = new Map(Object.entries({
  Possession: '控球率 / 时间', SHOTS: '射门', 'ON GOAL': '射正', Fouls: '犯规', 'Yellow Cards': '黄牌', 'Red Cards': '红牌', Offsides: '越位', 'Corner Kicks': '角球', Saves: '扑救', 'Accurate Passes': '成功传球', Passes: '传球', Crosses: '传中', 'Accurate Crosses': '成功传中', Tackles: '抢断', Interceptions: '拦截', Clearances: '解围', Rebounds: '篮板', Assists: '助攻', Steals: '抢断', Blocks: '盖帽', Turnovers: '失误', 'Total Turnovers': '总失误', 'Field Goal %': '投篮命中率 %', 'Three Point %': '三分命中率 %', 'Free Throw %': '罚球命中率 %', 'Points in Paint': '内线得分', 'Fast Break Points': '快攻得分', 'Largest Lead': '最大领先', 'Total Yards': '总推进码数', 'Net Passing Yards': '净传球码数', 'Rushing Yards': '冲球码数', '1st Downs': '首攻', Goal: '进球', 'Yellow Card': '黄牌', 'Red Card': '红牌', Substitution: '换人', Kickoff: '开球', Halftime: '中场', Goalkeeper: '门将', Defender: '后卫', Midfielder: '中场', Forward: '前锋', Striker: '前锋', Substitute: '替补', Referee: '裁判', 'Head Referee': '主裁判', 'Assistant Referee': '助理裁判', Out: '缺阵', Doubtful: '出战存疑', Questionable: '待定', Injured: '受伤', Suspended: '停赛', 'Day-To-Day': '每日观察', passing: '传球', rushing: '冲球', receiving: '接球', defensive: '防守', kicking: '踢球', punting: '弃踢', fumbles: '掉球', kickReturns: '开球回攻', puntReturns: '弃踢回攻', MIN: '时间', PTS: '得分', REB: '篮板', AST: '助攻', TO: '失误', STL: '抢断', BLK: '盖帽', PF: '犯规', FG: '投篮', '3PT': '三分', FT: '罚球', OREB: '前场板', DREB: '后场板', '+/-': '正负值', TOP: '上单', JUN: '打野', JUNGLE: '打野', MID: '中单', ADC: '下路', BOT: '下路', SUP: '辅助', SUPPORT: '辅助',
}));
export const label = value => labels.get(text(value)) || text(value);
for (const [key, value] of Object.entries({ 'Points': '得分', 'Shots': '射门', 'Total Shots': '总射门', 'Shots On Goal': '射正', 'Expected Goals': '预期进球 xG', 'Expected Goals Conceded': '预期失球 xGC', 'Big Chances Created': '创造绝佳机会', 'Defensive Interventions': '防守干预', 'Tackles Won': '成功抢断', 'Duels Won': '对抗成功', 'Passing Yards': '传球码数', 'Rushing Yards': '冲球码数', 'Receiving Yards': '接球码数', 'Games Played': '场次', 'Wins': '胜', 'Losses': '负', 'Draws': '平', 'Ties': '平', 'Goal Difference': '净胜球', 'Win Percentage': '胜率', 'Games Back': '胜场差', 'Streak': '近期走势', 'Rank': '排名', 'Overall': '总战绩', 'Points For': '总得分', 'Points Against': '总失分', 'Bonus Points': '额外积分', 'Penalty Points': '处罚积分', 'Laps Completed': '完成圈数', 'Championship Points': '积分', 'Place': '名次', 'Total Race Time': '成绩 / 用时', 'Q1 Race Time': 'Q1', 'Q2 Race Time': 'Q2', 'Q3 Race Time': 'Q3', 'Offensive Rebounds': '前场篮板', 'Defensive Rebounds': '后场篮板', 'Team Turnovers': '球队失误', 'Technical Fouls': '技术犯规', 'Total Technical Fouls': '总技术犯规', 'Flagrant Fouls': '恶意犯规', 'Points Conceded Off Turnovers': '失误失分', 'Lead Changes': '领先交替', 'Percent Led': '领先时间占比', 'On Target %': '射正比例', 'Penalty Goals': '点球进球', 'Penalty Kicks Taken': '主罚点球', 'Pass Completion %': '传球成功比例', 'Cross %': '传中成功比例', 'Long Balls': '长传', 'Accurate Long Balls': '成功长传', 'Long Balls %': '长传成功比例', 'Blocked Shots': '封堵射门', 'Effective Tackles': '有效抢断', 'Tackle %': '抢断成功比例', 'Effective Clearances': '有效解围', 'Fouls Committed': '犯规', 'Fouls Suffered': '被犯规', 'Own Goals': '乌龙球', 'Goals': '进球', 'Goals Against': '失球', 'Appearances': '出场', 'Substitute Appearances': '替补出场', 'Sacks': '擒杀', 'Quarterback': '四分卫', 'Running Back': '跑卫', 'Wide Receiver': '外接手', 'Guard': '后卫', 'Center': '中锋' })) labels.set(key, value);
for (const [key, value] of Object.entries({ 'Center Back': '中卫', 'Center Defender': '中卫', 'Center Left Defender': '左中卫', 'Center Right Defender': '右中卫', 'Left Back': '左后卫', 'Right Back': '右后卫', 'Left Defender': '左后卫', 'Right Defender': '右后卫', 'Central Midfielder': '中场', 'Center Midfielder': '中前卫', 'Left Midfielder': '左前卫', 'Right Midfielder': '右前卫', 'Center Left Midfielder': '左中前卫', 'Center Right Midfielder': '右中前卫', 'Attacking Midfielder': '前腰', 'Defensive Midfielder': '后腰', 'Center Forward': '中锋', 'Center Left Forward': '左中锋', 'Center Right Forward': '右中锋', 'Left Forward': '左边锋', 'Right Forward': '右边锋', 'Left Wing': '左边锋', 'Right Wing': '右边锋', 'Left Winger': '左边锋', 'Right Winger': '右边锋', 'Second Striker': '影锋', 'Left Wing Back': '左翼卫', 'Right Wing Back': '右翼卫', 'Attacking Midfielder Left': '左前腰', 'Attacking Midfielder Right': '右前腰', 'Attacking Midfielder Center': '前腰', 'Left Attacking Midfielder': '左前腰', 'Right Attacking Midfielder': '右前腰', 'Defensive Midfielder Left': '左后腰', 'Defensive Midfielder Right': '右后腰', 'Defensive Midfielder Center': '后腰', 'Center Defensive Midfielder': '后腰', 'Left Center Back': '左中卫', 'Right Center Back': '右中卫', 'Left Center Midfielder': '左中前卫', 'Right Center Midfielder': '右中前卫', 'Left Centre Back': '左中卫', 'Right Centre Back': '右中卫', 'Centre Back': '中卫' })) labels.set(key, value);
export function formationLines(t, formation) {
  if (!/^[1-5](?:-[1-5]){1,4}$/.test(formation) || t.people.length !== 11 || t.rows.length !== 11) return [];
  const counts = [1, ...formation.split('-').map(Number)];
  if (counts.reduce((a, b) => a + b, 0) !== 11 || t.people.some(p => !p.position || !p.id) || new Set(t.people.map(p => p.id)).size !== 11) return [];
  const depth = p => /门将/.test(p.position) ? 0 : /中卫|后卫/.test(p.position) ? 1 : /后腰/.test(p.position) ? 2 : /前卫|中场|翼卫/.test(p.position) ? 3 : /前腰|影锋/.test(p.position) ? 4 : /边锋|左中锋|右中锋/.test(p.position) ? 5 : 6;
  const lateral = p => /右/.test(p.position) ? /中/.test(p.position) ? 1 : 0 : /左/.test(p.position) ? /中/.test(p.position) ? 3 : 4 : 2;
  const players = t.people.slice().sort((a, b) => depth(a) - depth(b) || lateral(a) - lateral(b));
  if (depth(players[0]) !== 0) return [];
  let offset = 0; return counts.map(count => players.slice(offset, offset += count).sort((a, b) => lateral(a) - lateral(b)));
}
const table = (tab, title, columns, rows = [], extra = {}) => ({ tab, title, columns, rows, people: [], ...extra });
const detailBase = match => ({ match, fetched: Date.now(), source: match.source, warning: '', facts: [], stats: [], tables: [], events: [], games: [], formations: [] });
const photoFor = (a, league) => https(a.headshot?.href || a.photo || a.avatar) || (/^\d+$/.test(text(a.id)) && competition(league)?.group === '足球' ? `https://a.espncdn.com/i/headshots/soccer/players/full/${a.id}.png` : '');
function person(p, team, m) {
  const a = p.athlete || p;
  return { id: text(a.id), name: text(a.displayName || a.name), photo: photoFor(a, m.league), jersey: text(p.jersey || a.jersey), position: label(p.position?.displayName || a.position?.displayName || a.position?.abbreviation), teamId: text(team.id), team: text(team.displayName), starter: !!p.starter, absent: !!p.didNotPlay, formationPlace: text(p.formationPlace), birthday: text(a.dateOfBirth).slice(0, 10), age: text(a.age), height: text(a.displayHeight), weight: text(a.displayWeight), nationality: text(a.citizenship), url: https(list(a.links).find(l => list(l.rel).includes('playercard'))?.href), metrics: list(p.stats).filter(s => s && typeof s === 'object').map(s => [label(s.displayName || s.name), show(s.displayValue ?? s.value)]) };
}
export function espnDetail(root, previous) {
  const actual = espn({ events: [root.header || {}] }, previous.league).find(m => m.id === previous.id);
  if (!actual) throw new Error('比赛详情身份不匹配');
  const d = detailBase(actual), gi = root.gameInfo || {}, football = actual.group === '足球';
  d.facts = [['赛事', competition(actual.league).name], ['场地', gi.venue?.fullName], ['观众', text(gi.attendance)], ...list(gi.officials).map(o => [label(o.position) || '裁判', text(o.displayName || o.fullName)])].filter(f => f[1]);
  const co = root.header.competitions?.[0] || {};
  if (!football && actual.state !== 'scheduled') {
    const teams = ['home', 'away'].map(side => list(co.competitors).find(c => c.homeAway === side));
    const count = Math.max(...teams.map(t => list(t?.linescores).length));
    if (count) d.tables.push(table('overview', '分节比分', ['球队', ...Array.from({ length: count }, (_, i) => i < 4 ? `Q${i + 1}` : `OT${i - 3}`)], teams.filter(Boolean).map(t => [text(t.team?.displayName), ...Array.from({ length: count }, (_, i) => show(t.linescores?.[i]))])));
  }
  if (actual.state !== 'scheduled') {
    const ht = list(root.boxscore?.teams).find(t => text(t.team?.id) === actual.homeId), at = list(root.boxscore?.teams).find(t => text(t.team?.id) === actual.awayId);
    if (ht && at) for (const s of list(ht.statistics)) {
      const other = list(at.statistics).find(a => a.name === s.name);
      d.stats.push({ label: s.name === 'possessionPct' ? '控球率 %' : s.name === 'possessionTime' ? '控球时间' : label(s.label || s.name), home: show(s.displayValue), away: show(other?.displayValue) });
    }
    const events = root[football ? 'keyEvents' : actual.league === 'nfl' ? 'scoringPlays' : 'plays'];
    d.events = list(events).slice().reverse().filter(e => e.text).map(e => ({ time: `${!football && e.period?.number ? `Q${e.period.number} ` : ''}${text(e.clock?.displayValue)}`, title: label(e.type?.text), text: text(e.text) }));
  }
  if (football) { const rank = new Map(['控球率 %', '射门', '射正', '角球', '成功传球', '传球'].map((s, i) => [s, i])); d.stats.sort((a, b) => (rank.get(a.label) ?? 6) - (rank.get(b.label) ?? 6)); }
  if (football) for (const r of list(root.rosters)) {
    d.formations.push({ teamId: text(r.team?.id), team: text(r.team?.displayName), formation: text(r.formation) });
    for (const starter of [true, false]) {
      const keys = ['totalGoals', 'yellowCards', 'redCards', 'rating', 'totalShots', 'shotsOnTarget', 'totalPasses', 'accuratePasses', 'successfulDribbles', 'totalTackles', 'foulsCommitted', 'goalAssists', 'ownGoals'];
      const t = table('lineup', `${text(r.team?.displayName)} · ${starter ? '首发' : '替补'}`, ['球员', '位置', '状态', '站位', '进球', '黄牌', '红牌', '评分', '射门', '射正', '传球', '成功传球', '成功盘带', '抢断', '犯规', '助攻', '乌龙球'], [], { teamId: text(r.team?.id), category: starter ? '首发' : '替补' });
      const extra = [...new Map(list(r.roster).flatMap(p => list(p.stats)).filter(s => !keys.includes(s.name)).map(s => [s.name, s])).values()];
      keys.push(...extra.map(s => s.name)); t.columns.push(...extra.map(s => label(s.displayName || s.name)));
      for (const p of list(r.roster).filter(p => !!p.starter === starter && p.athlete?.displayName)) {
        t.people.push(person(p, r.team, actual));
        t.rows.push([`${p.jersey ? `${p.jersey} ` : ''}${p.athlete.displayName}`, label(p.position?.displayName), p.subbedOut ? '已换下' : p.subbedIn ? '替补登场' : starter ? '首发' : '替补', text(p.formationPlace), ...keys.map(k => { const s = list(p.stats).find(s => s.name === k); return show(s?.displayValue ?? s?.value); })]);
      }
      if (t.rows.length) d.tables.push(t);
    }
  }
  else if (actual.state !== 'scheduled') for (const team of list(root.boxscore?.players)) for (const g of list(team.statistics)) {
    if (!list(g.labels).length) continue;
    const t = table('lineup', `${text(team.team?.displayName)}${g.name ? ` · ${label(g.name)}` : ''}`, ['球员', ...g.labels.map(label)], [], { teamId: text(team.team?.id), category: label(g.name) || '球员' });
    for (const p of list(g.athletes).filter(p => p.athlete?.displayName)) { const a = person(p, team.team, actual); a.metrics = g.labels.map((k, i) => [label(k), show(p.stats?.[i])]); if (p.didNotPlay) a.metrics.unshift(['出场状态', text(p.reason) || '未出场']); t.people.push(a); t.rows.push([p.athlete.displayName, ...g.labels.map((_, i) => show(p.stats?.[i]))]); }
    if (list(g.totals).length) t.rows.push(['全队合计', ...g.labels.map((_, i) => show(g.totals[i]))]);
    if (t.rows.length) d.tables.push(t);
  }
  for (const team of list(root.injuries)) {
    const t = table('lineup', `${text(team.team?.displayName)} · 伤停`, ['球员', '状态', '说明'], [], { teamId: text(team.team?.id), category: '伤停' });
    for (const p of list(team.injuries)) { t.rows.push([text(p.athlete?.displayName), label(p.status), text(p.shortComment)]); t.people.push(person(p, team.team, actual)); }
    if (t.rows.length) d.tables.push(t);
  }
  // These tables describe source context; season records never become match statistics.
  d.facts.push(...[
    ['城市', [gi.venue?.address?.city, gi.venue?.address?.country].filter(Boolean).join(' · ')],
    ['天气', gi.weather?.displayValue || gi.weather?.condition],
    ['转播（来源地区）', list(root.broadcasts).map(b => [b.media?.name || b.station, b.region].filter(Boolean).join(' · ')).join('；')],
    ...list(co.notes).map(n => ['说明', n.headline]),
  ].filter(f => f[1]));
  d.venue = { name: text(gi.venue?.fullName), image: https(list(gi.venue?.images)[0]?.href) };
  for (const team of list(co.competitors)) {
    const records = list(team.records).filter(r => r.summary);
    if (records.length) d.facts.push([`${text(team.team?.displayName)} · 赛季战绩`, records.map(r => `${label(r.type || r.name)} ${r.summary}`).join('；')]);
  }
  for (const team of list(root.leaders)) {
    if (![actual.homeId, actual.awayId].includes(text(team.team?.id))) continue;
    const t = table('context', `${text(team.team?.displayName)} · ${actual.state === 'scheduled' ? '赛前来源领跑数据' : '来源单项领跑数据'}`, ['球员', '项目', '数值', '明细']);
    for (const category of list(team.leaders)) for (const p of list(category.leaders)) {
      if (!p.athlete?.displayName) continue;
      const a = person(p, team.team, actual); a.metrics = list(p.statistics).map(s => [label(s.displayName || s.name), show(s.displayValue ?? s.value)]);
      t.people.push(a); t.rows.push([a.name, label(category.displayName || category.name), show(p.displayValue), text(p.summary)]);
    }
    if (t.rows.length) d.tables.push(t);
  }
  for (const group of list(root.standings?.groups)) {
    const entries = list(group.standings?.entries), fields = [...new Map(entries.flatMap(e => list(e.stats)).map(s => [s.name, s])).values()];
    if (!entries.length) continue;
    d.tables.push(table('context', `赛季排名 · ${text(group.header || group.name)}`, ['球队', ...fields.map(s => label(s.displayName || s.name))], entries.map(e => [{ displayValue: text(e.team), image: https(list(e.logo)[0]?.href) }, ...fields.map(f => show(list(e.stats).find(s => s.name === f.name)))])));
  }
  for (const group of list(root.lastFiveGames)) {
    if (![actual.homeId, actual.awayId].includes(text(group.team?.id))) continue;
    const rows = list(group.events).map(e => [time(Date.parse(e.gameDate), { year: 'numeric', month: '2-digit', day: '2-digit' }), text(e.competitionName || e.leagueName), e.atVs === '@' ? '客场' : e.atVs === 'vs' ? '主场' : '—', { displayValue: text(e.opponent?.displayName), image: logo(e.opponent) }, show(e.score), ({ W: '胜', L: '负', D: '平' })[e.gameResult] || show(e.gameResult)]);
    if (rows.length) d.tables.push(table('context', `${text(group.team?.displayName)} · 近期比赛（比分以该队在前）`, ['日期', '赛事', '主客场', '对手', '比分', '结果'], rows));
  }
  for (const series of list(root.seasonseries)) {
    const rows = list(series.events).filter(e => list(e.competitors).every(c => [actual.homeId, actual.awayId].includes(text(c.team?.id)))).map(e => {
      const h = list(e.competitors).find(c => c.homeAway === 'home'), a = list(e.competitors).find(c => c.homeAway === 'away');
      return [time(Date.parse(e.date), { year: 'numeric', month: '2-digit', day: '2-digit' }), text(h?.team?.displayName), `${show(h?.score)} : ${show(a?.score)}`, text(a?.team?.displayName), stateLabels[state(e.statusType?.name, e.statusType?.state || e.status)]];
    });
    if (rows.length) d.tables.push(table('context', `双方交锋 · ${text(series.title)}`, ['日期', '主队', '比分', '客队', '状态'], rows));
  }
  if (actual.state !== 'scheduled' && football && list(root.commentary).length) {
    d.tables.push(table('events', '文字实录', ['时间', '内容'], list(root.commentary).slice().reverse().filter(e => e.text).map(e => [show(e.time), text(e.text)]), { prose: true }));
  }
  if (actual.state !== 'scheduled' && actual.league === 'nfl') {
    const drives = [...list(root.drives?.previous), ...(root.drives?.current?.id ? [root.drives.current] : [])];
    if (drives.length) d.tables.push(table('events', '进攻回合', ['球队', '结果', '次数', '推进码数', '耗时', '说明'], drives.map(p => [text(p.team?.displayName), text(p.displayResult || p.result), show(p.offensivePlays), show(p.yards), show(p.timeElapsed), text(p.description)]), { prose: true }));
    const plays = drives.flatMap(drive => list(drive.plays).filter(p => p.text).map(p => [`${p.period?.number ? `Q${p.period.number} ` : ''}${text(p.clock?.displayValue)}`, text(drive.team?.displayName), label(p.type?.text), `${show(p.homeScore)} : ${show(p.awayScore)}`, text(p.text)]));
    if (plays.length) d.tables.push(table('events', '逐档进程（比分为主队在前）', ['时间', '进攻方', '类型', '比分', '内容'], plays, { prose: true }));
  }
  return d;
}
export function fiveDetail(root, previous) {
  if (!root.success || !root.data?.match) throw new Error('CS2 详情读取失败');
  const raw = root.data.match, m = fiveMatch(raw, true), d = detailBase(m);
  if (previous && m.id !== previous.id) throw new Error('CS2 比赛身份不匹配');
  d.facts = [['赛事', m.event], ['级别', text(raw.tt_info?.grade_label)], ['赛制', raw.mc_info?.format ? `BO${raw.mc_info.format}` : ''], ['阶段', text(raw.mc_info?.tt_stage_desc)], ['地点', raw.tt_info?.addr], ['赛事总奖金', raw.tt_info?.bonus], ...['t1_info', 't2_info'].flatMap(k => { const t = raw.mc_info?.[k]; return t ? [[`${t.disp_name} · 来源排名`, text(t.rank)], [`${t.disp_name} · VRS 排名`, text(t.v_rank?.rank)]] : []; })].filter(f => f[1]);
  function players(source, name, homeKey, awayKey, tab = 'lineup') {
    for (const [side, key] of [['home', homeKey], ['away', awayKey]]) {
      const fields = ['kill', 'death', 'assist', 'adr', 'kast', 'rating'];
      const extra = [...new Set(list(source?.[key]).flatMap(p => Object.keys(p)))].filter(k => ![...fields, 'id', 'name', 'avatar', 'photo', 'portrait', 'half_portrait', 'country_logo'].includes(k) && list(source?.[key]).some(p => text(p[k]) !== '' && typeof p[k] !== 'object'));
      const csLabels = { cl_win_num: '残局胜利', dpr: '每回合死亡', first_blood_num: '首杀', first_blood_rate: '首杀率', first_death_num: '首死', fkdiff: '首杀差', flash_assist: '闪光助攻', head_shot_rate: '爆头率', headshot: '爆头', impact: 'Impact', k2: '双杀', k3: '三杀', k4: '四杀', k5: '五杀', kd_diff: '击杀差', kd_rate: 'K/D', kpr: '每回合击杀', mk_rating: '多杀 Rating', more_kill: '多杀次数', subpackage_num: '下包', unpack_num: '拆包', traded_death: '被补枪', swing: 'Swing', round_mvp: '回合 MVP', final_victory_num: '残局获胜', v1: '1v1', v2: '1v2', v3: '1v3', v4: '1v4', v5: '1v5' };
      const t = table(tab, `${m[side]} · ${name}`, ['选手', 'K', 'D', 'A', 'ADR', 'KAST', 'Rating', ...extra.map(k => csLabels[k] || label(k))], [], { teamId: m[`${side}Id`], category: name });
      fields.push(...extra);
      for (const p of list(source?.[key]).filter(p => p.name)) { t.rows.push([p.name, ...fields.map(k => show(p[k]))]); t.people.push({ id: text(p.id), name: text(p.name), photo: https(p.portrait || p.half_portrait || p.avatar || p.photo), team: m[side], teamId: m[`${side}Id`], metrics: fields.map((k, i) => [t.columns[i + 1], show(p[k])]) }); }
      if (t.rows.length) d.tables.push(t);
      for (const [field, title] of [['counter_kill_map', '对位击杀'], ['first_kill_map', '对位首杀']]) {
        const opponents = list(source?.[side === 'home' ? awayKey : homeKey]);
        if (!opponents.length || !list(source?.[key]).some(p => p[field] && typeof p[field] === 'object')) continue;
        d.tables.push(table(tab, `${m[side]} · ${name} · ${title}`, ['选手', ...opponents.map(p => text(p.name))], list(source?.[key]).map(p => [text(p.name), ...opponents.map(o => show(p[field]?.[o.id]))]), { category: name, collapsible: true }));
      }
    }
  }
  players(raw.global_state, '全场', 't1_player_stats', 't2_player_stats');
  for (const b of list(raw.bouts_state)) {
    if (!b.map_name || text(b.status) !== '2' || ![b.t1_stats, b.t2_stats].some(s => ['T', 'CT'].includes(s?.fh_role)) && !list(b.t1_pr_stats).length && !list(b.t2_pr_stats).length) continue;
    const name = text(b.map_name); d.games.push({ id: name, name, status: '已结束' });
    const t = table('maps', `${name} · 比分`, ['队伍', '首开方', 'T 方', 'CT 方', '加时', '总分'], [], { category: name });
    for (const [side, s] of [['home', b.t1_stats || {}], ['away', b.t2_stats || {}]]) {
      const known = ['T', 'CT'].includes(s.fh_role) && ['T', 'CT'].includes(s.sh_role) && s.fh_role !== s.sh_role;
      t.rows.push([m[side], known ? s.fh_role : '—', known ? show(s[s.fh_role === 'T' ? 'fh_score' : 'sh_score']) : '—', known ? show(s[s.fh_role === 'CT' ? 'fh_score' : 'sh_score']) : '—', show(s.ot_score), show(s.all_score)]);
    }
    d.tables.push(t); players(b, name, 't1_pr_stats', 't2_pr_stats', 'maps');
  }
  return d;
}
const lolLabels = {
  kills: '击杀', death: '死亡', assist: '助攻', kda: 'KDA', highestKDA: '本局最高 KDA', highestKillStreak: '最高连杀', highestMultiKill: '最高多杀', attendWarRate: '参团率', highestAttendWarRate: '本局最高参团率',
  heroDamage: '对英雄伤害', heroPhysicalDamage: '物理伤害（英雄）', heroMagicalDamage: '魔法伤害（英雄）', heroTrueDamage: '真实伤害（英雄）', totalDamage: '总伤害', totalPhysicalDamage: '总物理伤害', totalMagicalDamage: '总魔法伤害', totalTrueDamage: '总真实伤害', highestCritDamage: '最高暴击伤害', damageTransit: '伤害转化率', highestDamageTransit: '本局最高伤害转化率', damagePerGold: '每金币伤害', highestDamagePerGold: '本局最高每金币伤害', damageRate: '伤害占比', highestDamageRate: '本局最高伤害占比', damagePerMinute: '每分钟伤害',
  golds: '经济', oppositeGoldsDiff: '对位经济差', oppositeGoldsDiffAt15: '15 分钟对位经济差', turretAmount: '防御塔', creepsKilled: '小兵补刀', deathTime: '阵亡时间', level: '等级', firstBlood: '一血', firstBloodAssists: '一血助攻', firstTurret: '一塔参与', firstTurretKill: '一塔击破', firstTurretAssist: '一塔助攻', spentGold: '已花金币', totalNeutralMinKilled: '野怪补刀', totalMinKilledYourJungle: '己方野区补刀', totalMinKilledEnemyJungle: '敌方野区补刀', epicMonsterKills: '史诗野怪击杀', mvp: 'MVP', goldPercent: '经济占比',
  visionScore: '视野得分', wardsPlaced: '放置守卫', wardsKilled: '摧毁守卫', controlWardsPurchased: '购买控制守卫', detectorWardsPlaced: '放置控制守卫', visionWardsBoughtInGame: '购买真眼', wardPlaced: '放置守卫', wardKilled: '摧毁守卫', highestVisionScore: '本局最高视野得分', controlWardPurchased: '购买控制守卫',
  restoreLife: '生命回复', damageTaken: '承受伤害', physicalDamageTaken: '承受物理伤害', magicalDamageTaken: '承受魔法伤害', trueDamageTaken: '承受真实伤害', takenDamageRate: '承伤占比', highestTakenDamageRate: '本局最高承伤占比', damageTakenPerGold: '每金币承伤', damageTakenPerMinute: '每分钟承伤',
  baronAmount: '大龙', dragonAmount: '小龙', elderDragonAmount: '远古龙', riftHeraldAmount: '峡谷先锋', voidGrubAmount: '虚空巢虫', atakhanAmount: '厄塔汗', inhibitKills: '摧毁水晶', isFirstRiftHerald: '首条峡谷先锋', isFirstInhibitor: '首个水晶', isFirstTurret: '首座防御塔', isFirstDragon: '首条小龙', dragonSpirit: '获得龙魂', dragonSpiritType: '龙魂类型', teamSide: '阵营',
};
const elements = { air: '风', earth: '土', fire: '火', water: '水', chemtech: '炼金', hextech: '海克斯', elder: '远古', Blue: '蓝方', Red: '红方' };
const lolValue = (key, value) => value == null || value === '' ? '—' : typeof value === 'boolean' ? value ? '是' : '否' : ['attendWarRate', 'damageRate', 'goldPercent', 'takenDamageRate'].includes(key) && Number.isFinite(Number(value)) ? `${Number((Number(value) * 100).toFixed(2))}%` : typeof value === 'number' ? String(Number(value.toFixed(4))) : elements[text(value)] || show(value);
const scalarFields = object => Object.keys(object || {}).filter(k => object[k] != null && typeof object[k] !== 'object');
const lolAsset = (kind, id) => /^[a-zA-Z0-9_]+$/.test(text(id)) && text(id) !== '0' ? `https://game.gtimg.cn/images/lol/act/img/${kind}/${id}.png` : '';
export function lolDetail(base, rich, id, catalogue = {}) {
  if (`qq:lol:${base.bMatchId}` !== id) throw new Error('LOL 比赛身份不匹配');
  const m = worlds({ status: '0', msg: [{ ...base, MatchDate: base.MatchTime }] })[0];
  if (!m) throw new Error('该比赛不是 Worlds');
  const d = detailBase(m);
  const heroes = list(catalogue.hero);
  const heroFor = p => heroes.find(h => text(h.heroId) === text(p.heroId) || [h.name, h.title, h.alias].some(v => v && [p.heroName, p.heroNameEn].includes(v)));
  const champion = p => ({ displayValue: text(p.heroName || p.heroNameEn) || text(heroFor(p)?.title), image: lolAsset('champion', p.heroNameEn || heroFor(p)?.alias) });
  d.facts = [['赛事', base.GameName], ['赛制', base.GameModeName], ['阶段', base.GameTypeName], ['轮次', base.GameProcName]].filter(f => f[1]);
  const data = rich?.success ? rich.data || {} : {};
  if (rich?.success && (text(data.matchId) !== text(base.bMatchId) || text(data.teamAId) !== m.homeId || text(data.teamBId) !== m.awayId)) throw new Error('LOL 小局身份或战队方向不匹配');
  if (rich?.success && ['1', '2'].includes(text(data.matchStatus))) {
    m.state = text(data.matchStatus) === '1' ? 'live' : 'final'; m.status = stateLabels[m.state];
    m.homeScore = text(data.teamAScore); m.awayScore = text(data.teamBScore);
  }
  const games = list(data.matchInfos), numbers = new Set();
  for (const g of games) {
    if (!['1', '2'].includes(text(g.matchStatus))) continue;
    const number = Number(g.bo); if (!(number >= 1 && number <= 9) || numbers.has(number)) throw new Error('LOL 小局编号无效或重复'); numbers.add(number);
    if (list(g.teamInfos).some(t => ![m.homeId, m.awayId].includes(text(t.teamId)))) throw new Error('LOL 小局战队身份不匹配');
    const name = `第 ${number} 局`, winner = text(g.matchWin) === m.homeId ? m.home : text(g.matchWin) === m.awayId ? m.away : '';
    const duration = g.gameTime != null && Number.isFinite(Number(g.gameTime)) ? `${Math.floor(Number(g.gameTime) / 60)}:${String(Math.floor(Number(g.gameTime) % 60)).padStart(2, '0')}` : '';
    d.games.push({ id: String(number), name, status: text(g.matchStatus) === '1' ? '进行中' : '已结束', winner, duration, start: localTime(g.matchStartTime), end: localTime(g.matchEndTime) });
    const totals = table('maps', `${name} · 资源`, ['队伍', '击杀', '经济', '防御塔', '小龙', '大龙', '虚空巢虫', '远古龙', '峡谷先锋', '厄塔汗', '水晶'], [], { category: String(number) });
    d.tables.push(totals);
    for (const team of list(g.teamInfos)) {
      const teamName = text(team.teamId) === m.homeId ? m.home : m.away;
      totals.rows.push([teamName, ...['kills', 'golds', 'turretAmount', 'dragonAmount', 'baronAmount', 'voidGrubAmount', 'elderDragonAmount', 'riftHeraldAmount', 'atakhanAmount', 'inhibitKills'].map(k => show(team[k]))]);
      const side = ['Blue', 'Red'].includes(team.teamSide) ? elements[team.teamSide] : [m.homeId, m.awayId].includes(text(g.blueTeam)) ? text(g.blueTeam) === text(team.teamId) ? '蓝方' : '红方' : '阵营未知';
      const t = table('maps', `${name} · ${teamName} · ${side}`, ['选手', '位置', '英雄', '等级', 'K / D / A', '补刀', '伤害', '经济', '出装'], [], { category: String(number), teamId: text(team.teamId) });
      const positions = ['TOP', 'JUN', 'JUNGLE', 'MID', 'ADC', 'BOT', 'SUP', 'SUPPORT'];
      for (const p of list(team.playerInfos).slice().sort((a, b) => positions.indexOf(a.playerLocation) - positions.indexOf(b.playerLocation))) {
        const items = [...list(p.items), ...[p.trinketItem, p.roleItem].filter(i => i && !list(p.items).some(a => text(a.itemId) === text(i.itemId)))].filter(i => text(i.itemId) !== '0' && (i.itemName || i.itemId)).map(i => ({ name: text(i.itemName) || `装备 ${i.itemId}`, image: https(i.itemIcon) || lolAsset('item', i.itemId) }));
        const hero = champion(p);
        t.rows.push([text(p.playerName), label(p.playerLocation), hero, show(p.otherDetail?.level), ['kills', 'death', 'assist'].map(k => show(p.battleDetail?.[k])).join(' / '), show(p.minionKilled), lolValue('heroDamage', p.damageDetail?.heroDamage), show(p.otherDetail?.golds), { displayValue: items.map(i => i.name).join('、') || '—', images: items }]);
        const metrics = [['英雄', hero.displayValue], ['补刀', show(p.minionKilled)], ...['battleDetail', 'damageDetail', 'DamageTakenDetail', 'visionDetail', 'otherDetail'].flatMap(group => scalarFields(p[group]).map(k => [lolLabels[k] || k, lolValue(k, p[group][k])])), ...[['召唤师技能', [p.spell1Name, p.spell2Name].filter(Boolean).join(' · ')], ['符文主系', p.perkStyle?.styleCn], ['符文副系', p.perkSubStyle?.styleCn], ['符文', list(p.perkRunes).map(r => text(r.runeName)).filter(Boolean).join(' · ')]].filter(([, v]) => v)];
        t.people.push({ id: text(p.playerId), name: text(p.playerName), team: teamName, teamId: text(team.teamId), position: label(p.playerLocation), photo: https(p.playerIcon || p.playerAvatar), champion: hero, items, metrics });
      }
      if (t.rows.length) d.tables.push(t);
      for (const [group, title] of [['battleDetail', '战斗'], ['damageDetail', '伤害'], ['DamageTakenDetail', '承伤与回复'], ['visionDetail', '视野'], ['otherDetail', '经济与其他']]) {
        const fields = [...new Set(list(team.playerInfos).flatMap(p => scalarFields(p[group])))];
        if (!fields.length) continue;
        const extra = table('maps', `${name} · ${teamName} · ${title}明细`, ['选手', ...fields.map(k => lolLabels[k] || k)], [], { category: String(number), collapsible: true });
        for (const p of list(team.playerInfos)) { extra.rows.push([text(p.playerName), ...fields.map(k => lolValue(k, p[group]?.[k]))]); extra.people.push(t.people.find(a => a.name === text(p.playerName))); }
        d.tables.push(extra);
      }
      const talents = list(team.playerInfos).map(p => [text(p.playerName), [p.spell1Name, p.spell2Name].filter(Boolean).join(' · ') || '—', [p.perkStyle?.styleCn, p.perkSubStyle?.styleCn].filter(Boolean).join(' / ') || '—', list(p.perkRunes).map(r => text(r.runeName)).filter(Boolean).join(' · ') || '—']);
      if (talents.some(r => r.slice(1).some(v => v !== '—'))) d.tables.push(table('maps', `${name} · ${teamName} · 技能与符文`, ['选手', '召唤师技能', '符文系别', '符文'], talents, { category: String(number), collapsible: true, prose: true, people: t.people }));
      const bans = list(team.banHeroList).map(id => { const h = heroes.find(h => text(h.heroId) === text(id)); return { name: text(h?.title || h?.name) || `英雄 ${id}`, image: lolAsset('champion', h?.alias) }; });
      const teamRows = [
        ...(bans.length ? [['禁用英雄', { displayValue: bans.map(b => b.name).join('、'), images: bans }]] : []),
        ...scalarFields(team).filter(k => !['teamId', 'kills', 'golds', 'turretAmount', 'dragonAmount', 'baronAmount', 'voidGrubAmount', 'elderDragonAmount', 'riftHeraldAmount', 'atakhanAmount', 'inhibitKills'].includes(k)).map(k => [lolLabels[k] || k, lolValue(k, team[k])]),
        ...[['dragonDetail', '小龙类型'], ['baronIncome', '历次大龙收益'], ['baronIncomeTeamDiff', '历次大龙团队经济差']].filter(([k]) => list(team[k]).length).map(([k, title]) => [title, team[k].map(v => elements[text(v)] || show(v)).join('、')]),
      ];
      if (teamRows.length) d.tables.push(table('maps', `${name} · ${teamName} · BP 与资源明细`, ['项目', '内容'], teamRows, { category: String(number), collapsible: true }));
    }
    if (!totals.rows.length) d.tables.splice(d.tables.indexOf(totals), 1);
  }
  if (!d.games.length) d.warning = '官网暂未提供本场小局数据。';
  return d;
}
export function f1Detail(event, session, core, statistics, previous) {
  const m = espn({ events: [event] }, 'f1').find(m => m.id === previous.id);
  if (!m || text(core.id) !== text(session.id)) throw new Error('F1 场次身份不匹配');
  const d = detailBase(m); d.facts = [['大奖赛', text(event.name)], ['场次', text(session.type?.abbreviation)], ['赛道', text(core.venue?.fullName)]].filter(f => f[1]);
  const names = new Map(list(session.competitors).map(p => [text(p.id), text(p.athlete?.displayName)]));
  const used = new Set(['place', 'lapsCompleted', 'totalTime', 'championshipPts', 'qual1TimeMS', 'qual2TimeMS', 'qual3TimeMS']);
  const extra = [...new Map(Object.values(statistics).flatMap(s => list(s?.splits?.categories).flatMap(c => list(c.stats))).filter(s => !used.has(s.name)).map(s => [s.name, s])).values()];
  const t = table('stats', '本场车手与成绩', ['车手', '名次', '车队', '车号', '圈数', '成绩 / 用时', '积分', 'Q1', 'Q2', 'Q3']);
  t.columns.push(...extra.map(s => label(s.displayName || s.name)));
  for (const p of list(core.competitors).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999))) {
    const name = names.get(text(p.id)); if (!name) continue;
    const values = new Map(list(statistics[text(p.id)]?.splits?.categories).flatMap(c => list(c.stats)).map(s => [s.name, text(s.displayValue)]));
    t.rows.push([name, m.state === 'scheduled' ? '—' : values.get('place') || show(p.order), show(p.vehicle?.manufacturer), show(p.vehicle?.number), ...['lapsCompleted', 'totalTime', 'championshipPts', 'qual1TimeMS', 'qual2TimeMS', 'qual3TimeMS'].map(k => m.state === 'scheduled' ? '—' : show(values.get(k)))]);
    t.rows.at(-1).push(...extra.map(s => m.state === 'scheduled' ? '—' : show(values.get(s.name))));
    const athlete = list(session.competitors).find(a => text(a.id) === text(p.id))?.athlete || {};
    t.people.push({ id: text(p.id), name, team: text(p.vehicle?.manufacturer), jersey: text(p.vehicle?.number), photo: photoFor(athlete, 'f1'), metrics: t.columns.slice(1).map((k, i) => [k, t.rows.at(-1)[i + 1]]) });
  }
  if (t.rows.length) d.tables.push(t);
  d.tables.push(table('overview', '比赛周末 · 北京时间', ['场次', '开始时间', '状态'], list(event.competitions).map(s => [text(s.type?.abbreviation), time(Date.parse(s.date), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }), stateLabels[state(s.status?.type?.name, s.status?.type?.state)]])));
  return d;
}
