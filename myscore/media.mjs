import { teamNames } from './team-names.mjs';
import { list, text, localTime, dayOf, isSpirit } from './shared.mjs';

export const normalName = value => text(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function chinese(league, name) {
  const normal = v => text(v).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(fc|afc|cf|sc|club|the|football|basketball)\b/g, ' ').trim().replace(/\s+/g, ' ');
  const key = normal(name);
  if (key === 'spurs') return league === 'nba' ? '马刺' : '托特纳姆热刺';
  if (key === 'wolves') return league === 'nba' ? '森林狼' : '狼队';
  return teamNames.find(row => row.slice(1).some(v => normal(v) === key))?.[0] || '';
}
export function mediaKind(m) {
  if (m.state === 'cancelled') return '';
  if (['epl', 'nba'].includes(m.league)) return 'migu';
  if (['cs2', 'lol'].includes(m.league)) {
    if (m.state !== 'final') return m.league === 'cs2' ? 'douyu' : 'huya';
    return m.league === 'lol' || m.tierOne || isSpirit(m) ? 'bili' : '';
  }
  if (m.state === 'final' && ['ucl', 'efl', 'fa'].includes(m.league) && [m.homeId, m.awayId].includes('382')) return 'city';
  return '';
}
export const liveLink = m => m.league === 'cs2' ? { url: 'https://www.douyu.com/6657', platform: '斗鱼', kind: '直播间' } : { url: 'https://www.huya.com/149361', platform: '虎牙', kind: '直播间' };
export const zoneLink = m => ({ url: m.league === 'epl' ? 'https://www.miguvideo.com/p/home/0c40bbc85fa345bbba20f8e5fd11a922' : 'https://www.miguvideo.com/p/home/3cd6ba04967742879aaa40bee02a99a6', platform: '咪咕', kind: '赛事专区' });
export function findMigu(root, m) {
  const home = chinese(m.league, m.home), away = chinese(m.league, m.away); if (!home || !away || !m.start) return null;
  const same = (a, b) => { const clean = s => text(s).replace(/\s|队/g, ''); a = clean(a); b = clean(b); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); };
  return list(root.body?.widgetResult?.items).filter(i => i.widgetId && (m.league === 'epl' ? /英超/.test(i.competitionName) && !/女/.test(i.competitionName) : /NBA/i.test(i.competitionName) && !/经典/.test(i.competitionName))).filter(i => (same(i.confrontTeamLeftName, home) && same(i.confrontTeamRightName, away) || same(i.confrontTeamLeftName, away) && same(i.confrontTeamRightName, home)) && Math.abs(localTime(i.matchStartTime) - m.start) <= 1200000).sort((a, b) => Math.abs(localTime(a.matchStartTime) - m.start) - Math.abs(localTime(b.matchStartTime) - m.start))[0] || null;
}
const teamKey = v => ({ TEAMSPIRIT: 'SPIRIT', NATUSVINCERE: 'NAVI', BETBOOM: 'BB', BETBOOMTEAM: 'BB', PARIVISION: 'PV', THEMONGOLZ: 'MONGOLZ' })[text(v).toUpperCase().replace(/[^A-Z0-9]/g, '')] || text(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
export function findVideo(episodes, m) {
  if (!m.start || !['bili', 'city'].includes(mediaKind(m))) return null;
  const wanted = [teamKey(m.home), teamKey(m.away)].sort().join('|');
  return episodes.filter(e => {
    if (!/^BV[a-zA-Z0-9]+$/.test(e.bvid) || Number(e.duration) < (mediaKind(m) === 'city' ? 30 : 900)) return false;
    const title = text(e.title), published = Number(e.pubdate) * 1000;
    if (mediaKind(m) === 'city') {
      if (/女足|女子|青年|预备队|EDS|U\s*\d{2}|个人集锦|赛季集锦|回顾|季前|热身|友谊|社区盾/i.test(title) || !/^(城民饭点|【比赛集锦】|集锦)/.test(title) || !title.includes('集锦')) return false;
      if (published < m.start || published - m.start > 7 * 86400000) return false;
      const mentioned = /欧冠/.test(title) ? 'ucl' : /足总杯/.test(title) ? 'fa' : /联赛杯|卡拉宝杯|卡拉保杯/.test(title) ? 'efl' : /英超/.test(title) ? 'epl' : '';
      if (mentioned && mentioned !== m.league) return false;
      const home = m.homeId === '382', own = home ? m.homeScore : m.awayScore, other = home ? m.awayScore : m.homeScore;
      if (!/^\d+$/.test(own) || !/^\d+$/.test(other)) return false;
      const opponent = home ? m.away : m.home;
      const aliases = [opponent, chinese('epl', opponent), ...({ AEKATHENS: ['雅典AEK', 'AEK雅典'], PARISSAINTGERMAIN: ['巴黎圣日耳曼', '巴黎'], PSG: ['巴黎圣日耳曼', '巴黎'], REALMADRID: ['皇马', '皇家马德里'], PORTO: ['波尔图'], BAYERNMUNICH: ['拜仁慕尼黑', '拜仁'], INTERMILAN: ['国际米兰', '国米'], BARCELONA: ['巴塞罗那', '巴萨'] })[teamKey(opponent)] || []].filter(Boolean).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const clean = title.replace(/（[^）]*）|\([^)]*\)/g, ''), city = '(?:曼城|我城)(?:客场|主场|十人|最终|常规时间|在客场|在主场)*', words = '(?:战平|不敌|击败|战胜|逆转|负于|大胜)?';
      return new RegExp(`${city}\\s*${own}\\s*[-:：]\\s*${other}\\s*${words}\\s*(?:${aliases})|(?:${aliases})\\s*(?:客场|主场)?\\s*${other}\\s*[-:：]\\s*${own}\\s*${words}\\s*(?:曼城|我城)`, 'i').test(clean);
    }
    if (/集锦|精彩|高光|复盘|分析|剪辑|单图|第[一二三四五六七八九十0-9]+[局图]|\b(?:map|game)\s*\d/i.test(title)) return false;
    const date = /(\d{1,2})月(\d{1,2})日/.exec(title); if (!date) return false;
    const publishedDay = dayOf(published), explicit = /\b(20\d{2})\b/.exec(title);
    let year = explicit ? Number(explicit[1]) : Number(publishedDay.slice(0, 4));
    if (!explicit && date[1] === '12' && publishedDay.slice(5, 7) === '01') year--;
    if (`${year}-${date[1].padStart(2, '0')}-${date[2].padStart(2, '0')}` !== dayOf(m.start) || publishedDay < dayOf(m.start)) return false;
    const teams = m.league === 'cs2' ? /^[【「][^】」]+[】」]\s*([A-Za-z0-9. -]+?)\s+vs\s+([A-Za-z0-9. -]+?)(?=\s+(?:\d{1,2}月|[\p{Script=Han}]))/iu.exec(title) : /\d{1,2}月\d{1,2}日\s*([A-Za-z0-9.]+)\s+vs\s+([A-Za-z0-9.]+)/i.exec(title);
    return !!teams && [teamKey(teams[1]), teamKey(teams[2])].sort().join('|') === wanted;
  }).sort((a, b) => b.pubdate - a.pubdate)[0] || null;
}
export async function resolveWatch(m, read) {
  const kind = mediaKind(m); if (!kind) return { available: false, message: '该比赛没有已核实的播放入口' };
  if (kind === 'douyu' || kind === 'huya') return { available: true, ...liveLink(m) };
  if (kind === 'migu') {
    const fallback = zoneLink(m), home = chinese(m.league, m.home), away = chinese(m.league, m.away);
    if (!home || !away) return { available: false, fallback, message: '队名暂不能精确匹配，可主动打开赛事专区' };
    try {
      const settings = await read('miguSettings'); const pack = text(settings.body?.paramValue);
      if (!pack) throw new Error('咪咕搜索配置暂不可用');
      const hit = findMigu(await read('miguSearch', { keyword: `${home} ${away}`, pack }), m);
      if (hit) return { available: true, url: `https://www.miguvideo.com/p/live/${encodeURIComponent(hit.widgetId)}`, platform: '咪咕', kind: m.state === 'final' ? '回放' : '单场直播' };
      return { available: false, fallback, message: '暂未匹配到双方和开赛时间一致的单场' };
    } catch (e) { return { available: false, fallback, message: e.message }; }
  }
  const channel = kind === 'city' ? 'city' : m.league; const episodes = []; let warning = '';
  for (let page = 1; page <= (channel === 'lol' ? 1 : 20); page++) {
    try {
      const root = await read('bili', { channel, page });
      if (root.code !== 0 || !Array.isArray(root.data?.archives)) throw new Error('B 站暂未返回录像目录');
      episodes.push(...root.data.archives);
      const hit = findVideo(episodes, m); if (hit) return { available: true, url: `https://www.bilibili.com/video/${hit.bvid}`, platform: 'B 站', kind: channel === 'city' ? '赛后集锦' : '全场回放' };
      const pagination = root.data.page; if (!pagination || page * Number(pagination.size) >= Number(pagination.total)) break;
    } catch (e) { warning = e.message; break; }
  }
  return { available: false, pending: true, message: warning || (channel === 'city' ? '尚未发现与本场身份一致的赛后集锦' : '尚未发现与本场身份一致的全场回放') };
}
