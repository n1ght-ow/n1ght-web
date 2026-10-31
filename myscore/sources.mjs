import { competition, shiftDay, parseAssignment } from './shared.mjs';

const five = 'https://esports-data.5eplaycdn.com/v1/api/csgo/';
function identifier(value, pattern = /^[a-zA-Z0-9_]+$/) {
  if (!pattern.test(String(value || ''))) throw new Error('来源标识无效');
  return String(value);
}
export function sourceRequest(kind, p = {}) {
  const c = competition(p.league), id = () => identifier(p.id), number = value => identifier(value, /^\d+$/);
  const page = Math.min(kind === 'bili' ? 20 : 8, Math.max(1, Number(p.page) || 1));
  const espn = () => { if (!c?.path) throw new Error('赛事不支持该来源'); return `https://site.api.espn.com/apis/site/v2/sports/${c.path}`; };
  let url, ttl = 2000, headers = {}, body;
  switch (kind) {
    case 'board': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || Number.isNaN(Date.parse(p.date))) throw new Error('日期无效');
      const dates = p.league === 'f1' ? p.date.slice(0, 4) : p.date.replaceAll('-', '');
      url = `${espn()}/scoreboard?dates=${dates}&limit=1000`; break;
    }
    case 'summary': url = `${espn()}/summary?event=${number(p.event)}`; break;
    case 'schedule': url = `${espn()}/teams/${number(p.id)}/schedule${p.future === 'true' ? '?fixture=true' : ''}`; ttl = 30000; break;
    case 'roster': url = `${espn()}/teams/${number(p.id)}/roster`; ttl = 86400000; break;
    case 'f1Core': case 'f1Stats':
      url = `https://sports.core.api.espn.com/v2/sports/racing/leagues/f1/events/${number(p.event)}/competitions/${number(p.session)}${kind === 'f1Stats' ? `/competitors/${number(p.id)}/statistics` : ''}?lang=en&region=us`; ttl = 15000; break;
    case 'fiveTier': url = `https://app.5eplay.com/api/tournament/session_list?game_type=1&game_status=${p.current === 'true' ? '1' : '0'}&grades=${p.current === 'true' ? '' : '1%2C2%2C7'}&limit=100&page=${page}`; break;
    case 'fiveTeam': url = `${five}team/matches_v1/${id()}?page=${page}&limit=30&status=${p.status === 'past' ? 'past' : 'future'}`; ttl = 30000; break;
    case 'fiveDetail': url = `${five}matches/${identifier(p.id, /^csgo_mc_\d+$/)}/data`; break;
    case 'lolList': url = 'https://lpl.qq.com/web201612/data/LOL_MATCH2_MATCH_HOMEPAGE_BMATCH_LIST.js'; ttl = 60000; break;
    case 'lolTeams': url = 'https://lpl.qq.com/web201612/data/LOL_MATCH2_TEAM_LIST.js'; ttl = 86400000; break;
    case 'lolBase': url = `https://lpl.qq.com/web201612/data/LOL_MATCH_DETAIL_${number(p.id)}.js`; ttl = 10000; break;
    case 'lolClient': url = 'https://lpl.qq.com/web201612/js/after-data-1.js'; ttl = 3600000; break;
    case 'lolRich': url = `https://open.tjstats.com/match-auth-app/open/v1/compound/matchDetail?matchId=${number(p.id)}`; ttl = 10000; break;
    case 'fpl': url = 'https://fantasy.premierleague.com/api/bootstrap-static/'; ttl = 86400000; break;
    case 'bili': {
      const mid = ({ lol: '50329118', cs2: '474595627', city: '1832904916' })[p.channel]; if (!mid) throw new Error('未知回放目录');
      url = p.channel === 'lol' ? `https://api.bilibili.com/x/series/archives?mid=${mid}&series_id=5182712&only_normal=true&sort=desc&pn=1&ps=100` : `https://api.bilibili.com/x/series/recArchivesByKeywords?mid=${mid}&keywords=${p.channel === 'city' ? '%E9%9B%86%E9%94%A6' : 'vs'}&ps=100&pn=${page}`; ttl = 900000; break;
    }
    case 'miguSettings': url = 'https://app-sc.miguvideo.com/common/v1/settings/SEARCH_PACK_ID'; ttl = 86400000; break;
    case 'miguSearch':
      if (typeof p.keyword !== 'string' || p.keyword.length > 120 || typeof p.pack !== 'string' || p.pack.length > 1000) throw new Error('搜索条件无效');
      url = 'https://jadeite.migu.cn/search/v3/open-search'; ttl = 600000;
      headers = { 'Content-Type': 'application/json', appid: 'miguvideo', terminalid: 'www', Referer: 'https://www.miguvideo.com/' };
      body = JSON.stringify({ appVersion: '6.1.1.00', ct: 101, isCorrectWord: 1, k: p.keyword, mediaSource: 9000000, packId: p.pack, pageIdx: 1, pageSize: 50, sid: globalThis.crypto.randomUUID().replaceAll('-', ''), copyrightTerminal: 3, searchScene: 2, uiVersion: 'A3.26.0' }); break;
    default: throw new Error('不支持的数据接口');
  }
  return { url, ttl, headers, body };
}
export function decodeSource(kind, body) {
  if (['lolList', 'lolTeams', 'lolBase'].includes(kind)) return parseAssignment(body);
  if (kind === 'lolClient') return String(body);
  return JSON.parse(body);
}
