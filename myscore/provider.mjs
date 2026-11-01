import { competition, list, text, https, today, dayOf, shiftDay, matchBase, espn, fiveMatch, fiveHistory, isTierOne, isSpirit, worlds, mergeMatches, espnDetail, fiveDetail, lolDetail, f1Detail } from './shared.mjs?v=2';

export class Provider {
  constructor(read, api = null) { this.read = read; this.api = api; }
  async scores(league, date, signal) {
    const c = competition(league); if (!c) throw new Error('未知赛事');
    let matches, warning = '';
    if (league === 'lol' && this.api) return this.api('scores', { league, date }, signal);
    if (c.path) {
      // Team scoreboards reject ranges. Two source dates cover a Beijing day.
      const dates = league === 'f1' ? [date] : [shiftDay(date, -1), date];
      const reads = await Promise.allSettled(dates.map(date => this.read('board', { league, date }, signal).then(root => espn(root, league))));
      if (reads.every(r => r.status === 'rejected')) throw reads[0].reason;
      matches = mergeMatches(...reads.filter(r => r.status === 'fulfilled').map(r => r.value));
      warning = reads.filter(r => r.status === 'rejected').map(r => `部分日期读取失败：${r.reason.message}`).join('；');
    }
    else if (league === 'lol') {
      matches = worlds(await this.read('lolList', {}, signal));
      try { const teams = (await this.read('lolTeams', {}, signal)).msg || {}; for (const m of matches) { m.homeLogo ||= https(teams[m.homeId]?.TeamLogo); m.awayLogo ||= https(teams[m.awayId]?.TeamLogo); } } catch { warning = '队徽暂未更新'; }
    } else {
      const parts = await Promise.allSettled([this.tier(date, date, signal), this.fiveTeam('csgo_tm_7020', signal, date)]);
      if (parts.every(p => p.status === 'rejected')) throw parts[0].reason;
      matches = mergeMatches(...parts.filter(p => p.status === 'fulfilled').map(p => p.value));
      warning = parts.filter(p => p.status === 'rejected').map(p => p.reason.message).join('；');
      // The current feed supplies Spirit fixtures that may not yet be in its team history.
      try { const current = await this.read('fiveTier', { current: 'true' }, signal); if (current.success && Array.isArray(current.data?.matches)) matches = mergeMatches(matches, current.data.matches.filter(r => isTierOne(r) || [r.mc_info?.t1_info?.id, r.mc_info?.t2_info?.id].includes('csgo_tm_7020')).map(r => fiveMatch(r))); } catch (e) { warning ||= e.message; }
    }
    matches = matches.filter(m => !m.start || dayOf(m.start) === date);
    if (league === 'cs2') {
      await Promise.all(matches.filter(m => m.state === 'live').map(async m => {
        try { const actual = fiveDetail(await this.read('fiveDetail', { id: m.id.split(':')[2] }, signal), m).match; matches = mergeMatches(matches, [actual]); }
        catch (e) { warning = [warning, `进行中单场复核失败：${e.message}`].filter(Boolean).join('；'); }
      }));
    }
    return { matches, fetched: Date.now(), source: c.path ? 'ESPN' : league === 'cs2' ? '5EPlay' : '英雄联盟赛事官网', warning };
  }
  async tier(from, to, signal) {
    const result = []; let complete = false;
    for (let page = 1; page <= 8; page++) {
      const root = await this.read('fiveTier', { page }, signal), rows = root.data?.matches;
      if (!root.success || !Array.isArray(rows)) throw new Error('5EPlay 一线赛程格式变化');
      if (!rows.length) { complete = true; break; }
      const parsed = rows.filter(isTierOne).map(r => fiveMatch(r));
      result.push(...parsed.filter(m => m.start && dayOf(m.start) >= from && dayOf(m.start) <= to));
      const oldest = Math.min(...rows.map(r => Number(r.mc_info?.ts || r.mc_info?.plan_ts) * 1000 || Infinity));
      if (oldest === Infinity) throw new Error('5EPlay 一线赛程缺少开赛时间');
      if (dayOf(oldest) < from || rows.length < 100) { complete = true; break; }
    }
    if (!complete) throw new Error('CS2 一线赛程超出来源近期覆盖范围');
    return mergeMatches(result);
  }
  async fiveTeam(id, signal, from = null) {
    const result = [];
    for (const status of ['future', 'past']) for (let page = 1; page <= (from ? 5 : 1); page++) {
      const root = await this.read('fiveTeam', { id, status, page }, signal), parsed = fiveHistory(root);
      result.push(...parsed.filter(m => [m.homeId, m.awayId].includes(id)));
      if (page >= (Number(root.data?.total_page) || 1) || status === 'past' && from && parsed.some(m => m.start && dayOf(m.start) < from)) break;
      if (from && page === 5) throw new Error('战队赛程超出来源近期覆盖范围');
    }
    return mergeMatches(result);
  }
  async team(league, id, signal) {
    const c = competition(league); if (!c || league === 'f1') throw new Error('该项目没有球队赛程');
    if (league === 'lol' && this.api) return this.api('team', { league, id }, signal);
    let matches, teamInfo, warning = '';
    if (league === 'cs2') {
      matches = await this.fiveTeam(id, signal);
      try { matches = mergeMatches(await this.tier(today(), shiftDay(today(), 60), signal), matches).filter(m => [m.homeId, m.awayId].includes(id)); } catch (e) { warning = `未来一线赛程补充失败：${e.message}`; }
    } else if (league === 'lol') {
      const all = await this.read('lolList', {}, signal); matches = worlds(all).filter(m => [m.homeId, m.awayId].includes(id));
    } else {
      const roots = await Promise.all([this.read('schedule', { league, id }, signal), ...(c.group === '足球' ? [this.read('schedule', { league, id, future: 'true' }, signal)] : [])]);
      for (const root of roots) if (root.team?.id && text(root.team.id) !== id) throw new Error('球队赛程身份不匹配');
      const team = roots.find(r => text(r.team?.id) === id)?.team;
      if (team) teamInfo = { name: text(team.displayName), logo: https(team.logo), season: text(team.seasonSummary), record: text(team.recordSummary), standing: text(team.standingSummary), url: https(team.clubhouse) };
      matches = mergeMatches(...roots.map(root => espn(root, league))).filter(m => [m.homeId, m.awayId].includes(id));
    }
    return { matches, teamInfo, source: c.path ? 'ESPN' : league === 'cs2' ? '5EPlay' : '英雄联盟赛事官网', fetched: Date.now(), warning };
  }
  async detail(id, signal, onHeader = null) {
    const parts = id.split(':'), league = parts[1], c = competition(league);
    if (!c) throw new Error('比赛标识无效');
    if (parts[0] === 'qq' && league === 'lol') {
      if (this.api) return this.api('detail', { match: id }, signal);
      const base = await this.read('lolBase', { id: parts[2] }, signal); let rich = {}, warning = '';
      try { rich = await this.read('lolRich', { id: parts[2] }, signal); } catch (e) { warning = `小局数据暂未更新：${e.message}`; }
      let heroes = {};
      try { heroes = await this.read('lolHeroes', {}, signal); } catch { warning = [warning, '英雄图鉴暂未更新，保留英雄名称'].filter(Boolean).join('；'); }
      const d = lolDetail(base, rich, id, heroes); d.warning = [d.warning, warning].filter(Boolean).join('；'); return d;
    }
    if (parts[0] === 'five' && league === 'cs2') return fiveDetail(await this.read('fiveDetail', { id: parts[2] }, signal), { id });
    if (parts[0] !== 'espn' || !c.path) throw new Error('比赛来源无效');
    if (league !== 'f1') return espnDetail(await this.read('summary', { league, event: parts[2] }, signal), { id, league });
    let year = Number(parts[4]) || new Date().getUTCFullYear();
    // Event IDs are stable; an optional year in the link locates historical weekends.
    const root = await this.read('board', { league, date: `${year}-01-01` }, signal);
    const event = list(root.events).find(e => text(e.id) === parts[2]), session = list(event?.competitions).find(s => text(s.id) === parts[3]);
    if (!event || !session) throw new Error('来源未找到该 F1 场次');
    const early = espn({ events: [event] }, 'f1').find(m => m.id === parts.slice(0, 4).join(':'));
    if (early && onHeader) onHeader(early);
    const canonical = parts.slice(0, 4).join(':'), core = await this.read('f1Core', { event: parts[2], session: parts[3] }, signal), statistics = {}; let failed = 0;
    await Promise.all(list(core.competitors).map(async p => { try { statistics[text(p.id)] = await this.read('f1Stats', { event: parts[2], session: parts[3], id: text(p.id) }, signal); } catch { failed++; } }));
    const d = f1Detail(event, session, core, statistics, { id: canonical }); if (failed) d.warning = `${failed} 位车手的统计暂未获取，空缺不代表 0。`; return d;
  }
}
