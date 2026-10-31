import { competitions, competition, today, shiftDay, dayOf, time, score, delayFor, mergeTerminal, show, list, https, formationLines } from './shared.mjs';
import { provider, api, readSaved, saveResult } from './browser-data.mjs';
import { mediaKind, liveLink } from './media.mjs';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icons = {
  left: '<path d="m14 6-6 6 6 6"/>', right: '<path d="m10 6 6 6-6 6"/>', back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M5.2 8a7 7 0 0 1 11.6-2L20 12M4 12l3.2 6A7 7 0 0 0 18.8 16"/>',
  play: '<path d="m9 5 10 7-10 7Z"/>', moon: '<path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>', sort: '<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const groups = [['all', '全部赛事'], ['football', '足球'], ['nba', 'NBA'], ['nfl', 'NFL'], ['f1', 'F1'], ['cs2', 'CS2'], ['lol', 'LOL']];
const pageURL = new URL('./', location.href);
const batches = new Map(), tables = new Map();
let route, controller, timer, headerTimer, detail, teamResult, generation = 0, personFocus, activeTasks = 0, lastRefresh = 0, restoreScroll = null;
let theme; try { theme = localStorage.getItem('myscore:theme') || 'light'; } catch { theme = 'light'; }
document.documentElement.dataset.theme = theme;
function syncTheme() { $('theme').setAttribute('aria-label', theme === 'dark' ? '切换浅色外观' : '切换深色外观'); $('theme').setAttribute('aria-pressed', String(theme === 'dark')); }
function url(changes = {}, reset = false) {
  const u = new URL(reset ? pageURL : location.href);
  for (const [key, value] of Object.entries(changes)) { if (value == null || value === '') u.searchParams.delete(key); else u.searchParams.set(key, value); }
  return u.pathname + u.search;
}
function parseRoute() {
  const p = new URL(location.href).searchParams, date = p.get('date');
  return { date: /^\d{4}-\d{2}-\d{2}$/.test(date || '') && !Number.isNaN(Date.parse(date)) ? date : today(), competition: groups.some(g => g[0] === p.get('competition')) || competition(p.get('competition')) ? p.get('competition') : 'all', match: p.get('match') || '', team: p.get('team') || '', tab: p.get('tab') || 'overview', map: p.get('map') || '', filter: p.get('teamFilter') || '', teamState: p.get('state') || 'all', year: p.get('year') || '' };
}
const selectedCompetitions = () => competitions.filter(c => route.competition === 'all' || route.competition === 'football' && c.group === '足球' || route.competition === c.id);
function batchKey(league) { return `${route.date}:${league}`; }
function selectedBatch(c) { return batches.get(batchKey(c.id)); }
function crest(src, name, extra = '') {
  const initials = (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('');
  return https(src) ? `<img class="crest ${extra}" src="${escape(https(src))}" data-fallback="${escape(initials)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="crest-fallback ${extra}" aria-hidden="true">${escape(initials)}</span>`;
}
function teamHref(m, side) { return url({ match: null, team: m[`${side}Id`], competition: m.league, tab: null, map: null, state: null }); }
function matchHref(m) { return url({ match: m.id, team: null, tab: null, map: null, year: m.league === 'f1' && m.start ? dayOf(m.start).slice(0, 4) : null }); }
function playButton(m) { return mediaKind(m) ? `<button type="button" class="watch-button" data-watch="${escape(m.id)}" aria-label="${escape(`${m.home || m.title} ${m.away}：查看${m.state === 'final' ? '回放' : '播放'}入口`)}">${icon('play')}</button>` : '<span></span>'; }
function rowHTML(m, withDate = false) {
  const status = `${m.state === 'live' ? '<i class="live-dot" aria-hidden="true"></i>' : ''}${escape(m.status)}`;
  const date = withDate && m.start ? `<span>${escape(time(m.start, { month: 'numeric', day: 'numeric' }))}</span>` : '';
  const when = `<div class="match-time">${date}<time datetime="${m.start ? new Date(m.start).toISOString() : ''}">${m.timeConfirmed ? time(m.start) : '时间待定'}</time><span>${status}</span></div>`;
  if (m.league === 'f1') return `<article class="match-row race-row" data-id="${escape(m.id)}" data-state="${m.state}">${when}<a class="race-title" href="${matchHref(m)}">${escape(m.title)}</a><div class="race-leaders">${m.results.slice(0, 3).map(escape).join('<br>') || escape(m.detail)}</div><span class="race-arrow">${icon('arrow')}</span></article>`;
  function team(side) { const linked = !!m[`${side}Id`]; return `<div class="team ${side}"><span class="team-name">${escape(m[side])}</span>${linked ? `<a class="team-link" href="${teamHref(m, side)}" aria-label="查看 ${escape(m[side])} 的${['cs2', 'lol'].includes(m.league) ? '队伍' : '球队'}赛程">${crest(m[`${side}Logo`], m[side])}</a>` : crest(m[`${side}Logo`], m[side])}</div>`; }
  const hasScores = m.homeScore !== '' && m.awayScore !== '' && m.state !== 'scheduled';
  const rowScore = side => hasScores ? escape(show(m[`${side}Score`])) + (m.homeShootout !== '' && m.awayShootout !== '' && m.homeScore === m.awayScore ? ` <sup>(${escape(m[`${side}Shootout`])})</sup>` : '') : '—';
  return `<article class="match-row" data-id="${escape(m.id)}" data-state="${m.state}">${when}${team('home')}<a class="result-link" href="${matchHref(m)}" aria-label="${escape(`${m.home} 对 ${m.away}，${m.status}，${score(m, 'home')} 比 ${score(m, 'away')}，查看比赛详情`)}"><span class="home-score">${rowScore('home')}</span><span class="separator">:</span><span class="away-score">${rowScore('away')}</span><small>${m.state === 'scheduled' ? '赛前' : '比赛详情'}</small></a>${team('away')}${playButton(m)}${m.league === 'cs2' && m.event ? `<div class="row-note">${escape(m.event)}</div>` : ''}</article>`;
}
function preserveUpdate(el, html) {
  if (el._html === html) return;
  const active = el.contains(document.activeElement) ? document.activeElement : null, focusKey = active?.dataset.focus || active?.getAttribute('href') || active?.dataset.watch;
  const scrolls = [...el.querySelectorAll('.table-scroll')].map(node => ({ label: node.getAttribute('aria-label'), left: node.scrollLeft, top: node.scrollTop }));
  el.innerHTML = html; el._html = html;
  for (const saved of scrolls) { const node = [...el.querySelectorAll('.table-scroll')].find(node => node.getAttribute('aria-label') === saved.label); if (node) { node.scrollLeft = saved.left; node.scrollTop = saved.top; } }
  if (focusKey) [...el.querySelectorAll('a,button')].find(e => (e.dataset.focus || e.getAttribute('href') || e.dataset.watch) === focusKey)?.focus({ preventScroll: true });
}
function restorePosition() {
  if (restoreScroll == null) return;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (maximum + 1 < restoreScroll) return; // Wait for an asynchronously loaded long page.
  window.scrollTo({ top: restoreScroll, behavior: 'instant' }); restoreScroll = null;
}
function updateRows(host, matches, withDate = false) {
  host._html = null;
  const old = new Map([...host.children].map(el => [el.dataset.id, el]));
  for (const m of matches) {
    const html = rowHTML(m, withDate), existing = old.get(m.id); let node = existing;
    if (!node) { const t = document.createElement('template'); t.innerHTML = html; node = t.content.firstElementChild; node._html = html; }
    else if (node._html !== html) {
      // Live updates preserve the row, links and keyboard focus when its structure is stable.
      const t = document.createElement('template'); t.innerHTML = html; const next = t.content.firstElementChild;
      if (node.children.length === next.children.length) for (let i = 0; i < node.children.length; i++) preserveUpdate(node.children[i], next.children[i].innerHTML);
      else preserveUpdate(node, next.innerHTML);
      node.dataset.state = m.state; node._html = html;
    }
    old.delete(m.id); const index = matches.indexOf(m); if (host.children[index] !== node) host.insertBefore(node, host.children[index] || null);
  }
  for (const node of old.values()) node.remove();
}
function renderControls() {
  $('date-input').value = route.date;
  $('date-large').textContent = route.date.slice(5).replace('-', '.');
  const date = Date.parse(`${route.date}T12:00:00+08:00`);
  $('date-month').textContent = time(date, { year: 'numeric', month: 'long' });
  $('date-weekday').textContent = `${time(date, { weekday: 'long' })}${route.date === today() ? ' · 今天' : ''}`;
  $('today').disabled = route.date === today();
  const football = route.competition === 'football' || competition(route.competition)?.group === '足球';
  preserveUpdate($('sports'), groups.map(([id, name]) => {
    const own = competitions.filter(c => id === 'all' || id === 'football' && c.group === '足球' || c.id === id), loaded = own.map(c => selectedBatch(c));
    const count = loaded.every(b => b?.fetched && !b.error && !b.warning) ? loaded.reduce((n, b) => n + b.matches.length, 0) : '—';
    return `<a href="${url({ competition: id === 'all' ? null : id, teamFilter: null })}"${(id === 'football' ? football : route.competition === id) ? ' aria-current="page"' : ''}>${name}<small>${count}</small></a>`;
  }).join(''));
  preserveUpdate($('league-nav'), football ? [['football', '全部足球'], ...competitions.filter(c => c.group === '足球').map(c => [c.id, c.name])].map(([id, name]) => `<a href="${url({ competition: id, teamFilter: null })}"${route.competition === id ? ' aria-current="page"' : ''}>${name}</a>`).join('') : '');
  const all = selectedCompetitions().flatMap(c => selectedBatch(c)?.matches || []), teams = new Map();
  for (const m of all) for (const side of ['home', 'away']) if (m[`${side}Id`]) teams.set(`${m.league}:${m[`${side}Id`]}`, m[side]);
  const options = '<option value="">所有球队</option>' + [...teams].sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => `<option value="${escape(id)}">${escape(name)}</option>`).join('');
  if ($('team-filter')._html !== options) { $('team-filter').innerHTML = options; $('team-filter')._html = options; }
  $('team-filter').value = route.filter;
  const live = all.filter(m => m.state === 'live').length, count = all.length;
  $('schedule-caption').textContent = count ? `${count} 场比赛${live ? `，${live} 场正在进行` : ''}` : selectedCompetitions().some(c => selectedBatch(c)?.loading) ? '正在读取真实赛程' : '当日赛程';
}
function renderSchedule() {
  if (route.match || route.team) return;
  renderControls(); const desired = new Set(); $('scores')._html = null;
  for (const c of selectedCompetitions()) {
    const b = selectedBatch(c), matches = list(b?.matches).filter(m => !route.filter || [m.homeId, m.awayId].some(id => `${m.league}:${id}` === route.filter));
    // Empty successful leagues stay quiet; failed and loading sources stay explicit.
    if (b && (!b.loading || b.fetched) && !b.error && !b.warning && !matches.length) continue;
    desired.add(c.id); let section = $(`group-${c.id}`);
    if (!section) { section = document.createElement('section'); section.id = `group-${c.id}`; section.className = 'score-group'; section.innerHTML = '<div class="group-heading"><h2></h2><div class="group-source"></div></div><div class="match-list"></div><div class="group-warning"></div>'; }
    section.querySelector('h2').innerHTML = `${escape(c.name)}<span>${matches.length ? `${matches.length} 场` : c.group === '足球' ? '足球' : c.group}</span>`;
    preserveUpdate(section.querySelector('.group-source'), `${escape(b?.source || (c.path ? 'ESPN' : c.id === 'cs2' ? '5EPlay' : 'LOL 官网'))}${b?.fetched ? `<span>${time(b.fetched)}</span>` : ''}${b?.error ? `<button type="button" data-retry="${c.id}">重试</button>` : ''}`);
    const host = section.querySelector('.match-list');
    if (matches.length) { if (!host.querySelector('.match-row')) host.innerHTML = ''; updateRows(host, matches); }
    else if (!b || b.loading) preserveUpdate(host, '<div class="loading-row" aria-label="正在读取赛程"><span></span><span></span><span></span></div>');
    else preserveUpdate(host, `<div class="empty-state"><p>${b.error ? '这个来源暂时无法更新' : '该来源暂无本日比赛'}</p></div>`);
    section.querySelector('.group-warning').textContent = [b?.error, b?.warning].filter(Boolean).join('；');
    const position = [...desired].indexOf(c.id); if ($('scores').children[position] !== section) $('scores').insertBefore(section, $('scores').children[position] || null);
  }
  for (const section of [...$('scores').children]) if (!desired.has(section.id.replace('group-', ''))) section.remove();
  if (!desired.size) preserveUpdate($('scores'), '<div class="empty-state"><p>这一天没有已确认的比赛。</p><span>可以切换日期或赛事，继续查看赛程。</span></div>');
  restorePosition();
}
function renderTable(t, index) {
  const key = `table-${index}`; tables.set(key, t);
  const sortable = t.sort ? t.rows.map((row, i) => ({ row, person: t.people[i] })).sort((a, b) => { const x = a.row[t.sort.column], y = b.row[t.sort.column], xn = Number(String(x).replace(/[%+,]/g, '')), yn = Number(String(y).replace(/[%+,]/g, '')); const missing = value => value == null || value === '' || value === '—'; if (missing(x) && missing(y)) return 0; if (missing(x)) return 1; if (missing(y)) return -1; return (Number.isFinite(xn) && Number.isFinite(yn) ? xn - yn : String(x).localeCompare(String(y), 'zh-CN', { numeric: true })) * t.sort.direction; }) : t.rows.map((row, i) => ({ row, person: t.people[i] }));
  return `<section class="table-block"><div class="table-heading"><h2>${escape(t.title)}</h2><small>点击列名排序</small></div><div class="table-scroll" role="region" aria-label="${escape(t.title)}" tabindex="0"><table><thead><tr>${t.columns.map((c, i) => `<th scope="col"${t.sort?.column === i ? ` aria-sort="${t.sort.direction === 1 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${key}" data-column="${i}" data-focus="${key}-${i}">${escape(c)}${icon('sort')}</button></th>`).join('')}</tr></thead><tbody>${sortable.map(({ row, person }) => `<tr>${row.map((cell, j) => `<td>${j === 0 && person?.name ? `<button class="person-button" data-person="${key}" data-index="${t.people.indexOf(person)}" data-focus="person-${key}-${escape(person.id || person.name)}" type="button">${escape(show(cell))}</button>` : escape(show(cell))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function pitches(d) {
  return `<div class="pitch-grid">${d.formations.map(f => {
    const t = d.tables.find(t => t.teamId === f.teamId && t.category === '首发'); if (!t || !/^\d+(?:-\d+){1,4}$/.test(f.formation)) return '';
    const lines = formationLines(t, f.formation); if (!lines.length) return '';
    const index = d.tables.indexOf(t); tables.set(`table-${index}`, t);
    return `<section class="pitch-section"><h2>${escape(f.team)} <span>${escape(f.formation)}</span></h2><div class="pitch" aria-label="${escape(f.team)} 首发阵型示意">${lines.map(line => `<div class="pitch-line">${line.map(p => `<button class="pitch-player" type="button" data-person="table-${index}" data-index="${t.people.indexOf(p)}"><b>${escape(p.jersey || '—')}</b><span>${escape(p.name)}</span></button>`).join('')}</div>`).reverse().join('')}</div></section>`;
  }).join('')}</div>`;
}
function renderDetail() {
  if (!detail) return; const m = detail.match;
  document.title = `${m.title || `${m.home} vs ${m.away}`} · MyScore`;
  const team = side => `<div class="hero-team">${m[`${side}Id`] ? `<a href="${teamHref(m, side)}">${crest(m[`${side}Logo`], m[side])}<span>${escape(m[side])}</span></a>` : `${crest(m[`${side}Logo`], m[side])}<span>${escape(m[side])}</span>`}</div>`;
  let header = `<div class="reading-meta"><h1 id="reading-title">${escape(m.event || competition(m.league).name)}</h1><span>${escape(m.detail)}</span></div>`;
  if (m.league === 'f1') header += `<div class="reading-heading"><h1>${escape(m.title)}</h1><p>${escape(m.status)} · ${time(m.start, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} 北京时间</p></div>`;
  else header += `<div class="match-hero">${team('home')}<div class="hero-score"><div class="state">${m.state === 'live' ? '<i class="live-dot" aria-hidden="true"></i>' : ''}${escape(m.status)}</div><strong class="${Math.max(m.homeScore.length, m.awayScore.length) >= 3 ? 'score-long' : ''}">${escape(m.state === 'scheduled' ? '—' : show(m.homeScore))} : ${escape(m.state === 'scheduled' ? '—' : show(m.awayScore))}</strong>${m.homeShootout !== '' && m.awayShootout !== '' && m.homeScore === m.awayScore ? `<p>点球大战 ${escape(m.homeShootout)} : ${escape(m.awayShootout)}</p>` : ''}<p>${m.timeConfirmed ? time(m.start, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '时间待定'} · 北京时间</p>${mediaKind(m) ? `<div class="media-row">${playButton(m)}<span>${m.state === 'final' ? '回放与集锦' : '观看比赛'}</span></div>` : ''}</div>${team('away')}</div>`;
  preserveUpdate($('reading-header'), header);
  const tabs = [['overview', '比赛总览'], ...(detail.formations.length || detail.tables.some(t => t.tab === 'lineup') ? [['lineup', m.group === '足球' ? '阵容与球员' : '球员 / 选手']] : []), ...(detail.stats.length || detail.tables.some(t => t.tab === 'stats') ? [['stats', '技术统计']] : []), ...(detail.events.length ? [['events', '比赛进程']] : []), ...(detail.games.length ? [['maps', m.league === 'cs2' ? '地图数据' : '小局数据']] : [])];
  const tab = tabs.some(t => t[0] === route.tab) ? route.tab : 'overview';
  preserveUpdate($('detail-tabs'), tabs.map(([id, name]) => `<a href="${url({ tab: id === 'overview' ? null : id, map: null })}"${tab === id ? ' aria-current="page"' : ''}>${name}</a>`).join(''));
  let html = '';
  if (tab === 'overview') html += `<div class="overview-grid"><section><h2 class="section-title">比赛信息</h2><dl class="facts">${detail.facts.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('') || '<div><dt>状态</dt><dd>来源尚未提供更多信息</dd></div>'}</dl></section><section><h2 class="section-title">${m.state === 'scheduled' ? '赛前' : '双方表现'}</h2>${m.state === 'scheduled' ? '<p class="source-note">等待比赛开始。本场统计将在来源发布后显示。</p>' : renderStats(detail.stats.slice(0, 8)) || '<p class="source-note">来源尚未提供双方技术统计。</p>'}</section></div>`;
  if (tab === 'stats') html += renderStats(detail.stats);
  if (tab === 'lineup' && detail.formations.length) html += pitches(detail);
  if (tab === 'events') html += `<ol class="timeline">${detail.events.map(e => `<li><time>${escape(e.time || '—')}</time><div><h2>${escape(e.title)}</h2><p>${escape(e.text)}</p></div></li>`).join('')}</ol>`;
  const map = detail.games.find(g => g.id === route.map)?.id || detail.games[0]?.id;
  if (tab === 'maps') html += `<nav class="segmented" aria-label="选择${m.league === 'cs2' ? '地图' : '小局'}">${detail.games.map(g => `<a href="${url({ tab: 'maps', map: g.id })}"${map === g.id ? ' aria-current="page"' : ''}>${escape(g.name)}${g.status === '进行中' ? ' · 进行中' : ''}</a>`).join('')}</nav>`;
  html += '<div class="tables">' + detail.tables.map((t, i) => t.tab === tab && (tab !== 'maps' || t.category === map) ? renderTable(t, i) : '').join('') + '</div>';
  if (!html || html === '<div class="tables"></div>') html = '<div class="empty-state">来源尚未提供此项内容。</div>';
  // Header/timestamps and large table bodies have independent fingerprints.
  preserveUpdate($('reading-content'), html);
  $('reading-source').textContent = `${detail.source} · 获取于 ${time(detail.fetched)}${detail.warning ? ` · ${detail.warning}` : ''}`;
  restorePosition();
}
function renderStats(stats) { return stats.length ? `<section aria-label="双方技术统计">${stats.map(s => `<div class="stat-row"><strong>${escape(s.home)}</strong><span>${escape(s.label)}</span><strong>${escape(s.away)}</strong></div>`).join('')}</section>` : ''; }
function renderTeam() {
  if (!teamResult) return;
  const matches = teamResult.matches, sample = matches.find(m => [m.homeId, m.awayId].includes(route.team));
  const side = sample?.homeId === route.team ? 'home' : 'away', name = sample?.[side] || '队伍赛程';
  document.title = `${name} · MyScore`;
  preserveUpdate($('reading-header'), `<div class="reading-heading team-summary">${crest(sample?.[`${side}Logo`], name)}<div><h1 id="reading-title">${escape(name)}</h1><p>${escape(competition(route.competition)?.name || '')} · ${['cs2', 'lol'].includes(route.competition) ? '队伍赛程' : '球队赛程'}</p></div></div>`);
  preserveUpdate($('detail-tabs'), [['all', '全部'], ['future', '接下来'], ['past', '已结束']].map(([id, name]) => `<a href="${url({ state: id === 'all' ? null : id })}"${route.teamState === id ? ' aria-current="page"' : ''}>${name}</a>`).join(''));
  const filtered = matches.filter(m => route.teamState === 'all' || (route.teamState === 'past' ? ['final', 'cancelled'].includes(m.state) : !['final', 'cancelled'].includes(m.state)));
  let host = $('reading-content').querySelector('.match-list');
  if (!host) { $('reading-content').innerHTML = '<div class="match-list team-view-list"></div>'; host = $('reading-content').firstElementChild; }
  if (filtered.length) { if (!host.querySelector('.match-row')) host.innerHTML = ''; updateRows(host, filtered, true); }
  else preserveUpdate(host, '<div class="empty-state">来源没有返回此分类的已确认比赛。</div>');
  $('reading-source').textContent = `${teamResult.source} · 获取于 ${time(teamResult.fetched)}${teamResult.warning ? ` · ${teamResult.warning}` : ''}`;
  restorePosition();
}
function setBusy(busy) { for (const id of ['refresh', 'reading-refresh']) { $(id).disabled = busy; $(id).setAttribute('aria-busy', String(busy)); } }
async function loadBatch(c, force = false) {
  const key = batchKey(c.id), token = generation, old = batches.get(key) || readSaved(`data:${key}`), now = Date.now();
  if (!force && old?.nextAt > now) { batches.set(key, old); return; }
  batches.set(key, { ...old, matches: old?.matches || [], loading: true }); renderSchedule();
  try {
    const result = await provider.scores(c.id, route.date, controller.signal); if (token !== generation) return;
    const matches = mergeTerminal(old?.matches, result.matches, force || now - (old?.fetched || 0) >= 21600000);
    const value = { ...result, matches, loading: false, error: '', nextAt: Date.now() + (delayFor(matches, route.date) || 21600000) };
    batches.set(key, value); saveResult(`data:${key}`, value);
  } catch (e) {
    if (token !== generation || controller.signal.aborted) return;
    batches.set(key, { ...old, matches: old?.matches || [], error: `${e.message}${old?.fetched ? '；保留上次数据' : ''}`, loading: false, nextAt: e.retryAt || Date.now() + 15000 });
  }
  renderSchedule();
}
async function refresh(force = false) {
  if (document.hidden && !force || activeTasks) return;
  if (force && Date.now() - lastRefresh < 2000) return;
  lastRefresh = Date.now(); const token = generation; activeTasks++; setBusy(true); clearTimeout(timer);
  try {
    if (route.match || route.team) {
      if (route.match) {
        const previous = detail, id = route.year && route.match.startsWith('espn:f1:') ? `${route.match}:${route.year}` : route.match;
        const value = await provider.detail(id, controller.signal, match => {
          if (token !== generation) return;
          detail = detail ? { ...detail, match } : { match, fetched: Date.now(), source: 'ESPN', facts: [['场次', match.title]], stats: [], tables: [], events: [], games: [], formations: [], warning: '正在读取完整车手统计' };
          renderDetail(); scheduleF1Header();
        }); if (token !== generation) return;
        if (previous) for (let i = 0; i < value.tables.length; i++) if (previous.tables[i]?.title === value.tables[i].title) value.tables[i].sort = previous.tables[i].sort;
        detail = value; saveResult(`data:detail:${route.match}`, detail); renderDetail();
      } else { const value = await provider.team(route.competition, route.team, controller.signal); if (token !== generation) return; teamResult = value; renderTeam(); }
    } else await Promise.all(selectedCompetitions().map(c => loadBatch(c, force)));
  } catch (e) {
    if (token !== generation || controller.signal.aborted) return;
    if (!detail && !teamResult) { preserveUpdate($('reading-header'), '<div class="reading-heading"><h1 id="reading-title">暂时无法读取</h1></div>'); preserveUpdate($('reading-content'), `<div class="empty-state"><p>${escape(e.message)}</p><button class="text-button" type="button" data-refresh>重新读取</button></div>`); }
    $('reading-source').textContent = `${e.message}${detail || teamResult ? '；保留上次读取内容' : ''}`;
  } finally {
    if (token === generation) {
      activeTasks = Math.max(0, activeTasks - 1); setBusy(false); schedule();
      if (force) $('announcement').textContent = detail ? `${detail.match.title || `${detail.match.home} 对 ${detail.match.away}`}，${detail.match.status}` : teamResult ? `已读取 ${teamResult.matches.length} 场球队比赛` : $('schedule-caption').textContent;
    }
  }
}
function schedule() {
  clearTimeout(timer); scheduleF1Header(); if (document.hidden) return;
  let delay;
  if (route.match) delay = detail ? ['final', 'cancelled'].includes(detail.match.state) ? 21600000 : detail.match.league === 'f1' ? 15000 : delayFor([detail.match], today()) || 30000 : 15000;
  else if (route.team) delay = teamResult ? Math.min(30000, delayFor(teamResult.matches, today()) || 21600000) : 15000;
  else delay = Math.max(2000, Math.min(...selectedCompetitions().map(c => Math.max(0, (selectedBatch(c)?.nextAt || 0) - Date.now()))));
  timer = setTimeout(() => refresh(), delay);
}
function scheduleF1Header() {
  clearTimeout(headerTimer);
  if (document.hidden || !route.match || detail?.match.league !== 'f1' || detail.match.state !== 'live') return;
  headerTimer = setTimeout(async () => {
    const token = generation;
    try {
      const result = await provider.scores('f1', dayOf(detail.match.start), controller.signal);
      if (token !== generation) return;
      const fresh = result.matches.find(m => m.id === route.match);
      if (fresh) { detail.match = fresh; renderDetail(); }
    } catch { /* The full-detail refresh reports connectivity; keep the last confirmed header. */ }
    finally { if (token === generation) scheduleF1Header(); }
  }, 2000);
}
function mount({ focus = false } = {}) {
  generation++; controller?.abort(); clearTimeout(timer); clearTimeout(headerTimer); activeTasks = 0; lastRefresh = 0; controller = new AbortController();
  route = parseRoute(); const reading = !!(route.match || route.team);
  $('schedule-view').hidden = reading; $('reading-view').hidden = !reading; detail = null; teamResult = null; tables.clear();
  $('back-link').href = url({ match: null, team: null, tab: null, map: null, state: null, year: null });
  $('back-link').innerHTML = icon('back') + '返回赛程';
  $('reading-source').textContent = ''; $('detail-tabs').innerHTML = ''; $('detail-tabs')._html = null;
  if (reading) {
    const saved = route.match ? readSaved(`data:detail:${route.match}`) : null;
    if (saved?.match?.id === route.match) { detail = saved; renderDetail(); }
    else { preserveUpdate($('reading-header'), '<div class="reading-heading"><h1 id="reading-title">正在读取比赛</h1></div>'); preserveUpdate($('reading-content'), '<div class="loading-row" aria-label="读取详情"><span></span><span></span></div>'); }
  } else { document.title = 'MyScore · N1GHT CHXN9'; for (const c of selectedCompetitions()) { const key = batchKey(c.id); if (!batches.has(key)) { const saved = readSaved(`data:${key}`); if (saved) batches.set(key, saved); } } renderSchedule(); }
  if (focus) $('main').focus({ preventScroll: true });
  refresh(true);
}
function navigate(href) {
  restoreScroll = null;
  const old = { ...history.state, scroll: window.scrollY }; history.replaceState(old, '');
  const next = new URL(href, location.href), current = new URL(location.href);
  history.pushState({ scroll: 0 }, '', next);
  const sameContent = ['match', 'team', 'date', 'competition', 'teamFilter', 'year'].every(k => current.searchParams.get(k) === next.searchParams.get(k));
  if (sameContent && (detail || teamResult)) { route = parseRoute(); detail ? renderDetail() : renderTeam(); schedule(); }
  else { mount({ focus: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
}
function findMatch(id) { return detail?.match.id === id ? detail.match : teamResult?.matches.find(m => m.id === id) || [...batches.values()].flatMap(b => b.matches || []).find(m => m.id === id); }
async function watch(id, button) {
  const m = findMatch(id); if (!m) return; personFocus = button;
  const dialog = $('watch-dialog'); $('watch-content').innerHTML = '<p>正在核实比赛身份与播放地址…</p>'; dialog.showModal();
  const key = id;
  try {
    const kind = mediaKind(m), result = ['douyu', 'huya'].includes(kind) ? { available: true, ...liveLink(m) } : await api('watch', { match: id });
    if (!dialog.open || $('watch-dialog').dataset.match !== key) return;
    $('watch-content').innerHTML = `<p>${escape(m.title || `${m.home} vs ${m.away}`)}</p>${result.message ? `<p>${escape(result.message)}</p>` : ''}<div class="watch-options">${result.available ? `<a class="primary-link" href="${escape(https(result.url))}" target="_blank" rel="noopener">${icon('play')}${escape(`${result.platform} · ${result.kind}`)}</a>` : ''}${result.fallback ? `<a class="primary-link" href="${escape(https(result.fallback.url))}" target="_blank" rel="noopener">主动打开${escape(result.fallback.platform)}赛事专区</a>` : ''}</div><p class="dialog-note">播放由原平台提供，可能需要登录或会员；打开入口不代表已开始播放。</p>`;
  } catch (e) { if (dialog.open && dialog.dataset.match === key) $('watch-content').innerHTML = `<p>${escape(e.message)}</p><p>比分与其他已读取内容仍可使用。</p>`; }
}
function personHTML(person, warning = '', source = '') {
  return `${https(person.photo) ? `<img class="profile-photo" src="${escape(https(person.photo))}" alt="${escape(person.name)}">` : ''}<h2 id="person-title">${escape(person.name)}</h2><p>${escape([person.team, person.position].filter(Boolean).join(' · '))}</p><dl class="facts">${[['号码', person.jersey], ['出生日期', person.birthday], ['年龄', person.age], ['国籍', person.nationality], ['身高', person.height], ['体重', person.weight]].filter(p => p[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl><p>${escape(warning || source || '以上为本场来源已提供的信息。')}</p>`;
}
async function openPerson(button) {
  const p = tables.get(button.dataset.person)?.people[Number(button.dataset.index)]; if (!p) return;
  personFocus = button; $('person-content').innerHTML = personHTML(p); $('person-dialog').showModal();
  $('person-dialog').dataset.person = `${p.id}:${p.name}`;
  if (detail?.match.group === '足球' && p.id) try {
    const result = await api('profile', { match: detail.match.id, id: p.id });
    if ($('person-dialog').open && $('person-dialog').dataset.person === `${p.id}:${p.name}`) $('person-content').innerHTML = personHTML(result.person, result.warning, result.source);
  } catch (e) { if ($('person-dialog').open && $('person-dialog').dataset.person === `${p.id}:${p.name}`) $('person-content').innerHTML = personHTML(p, `${e.message}；保留本场资料`); }
}
for (const [id, name] of [['previous-day', 'left'], ['next-day', 'right'], ['theme', 'moon'], ['close-dialog', 'close'], ['close-watch', 'close']]) $(id).innerHTML = icon(name);
for (const id of ['refresh', 'reading-refresh']) $(id).innerHTML = icon('refresh') + '<span class="refresh-label">刷新</span>';
$('theme').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; syncTheme(); try { localStorage.setItem('myscore:theme', theme); } catch {} }); syncTheme();
$('previous-day').onclick = () => navigate(url({ date: shiftDay(route.date, -1), teamFilter: null }));
$('next-day').onclick = () => navigate(url({ date: shiftDay(route.date, 1), teamFilter: null }));
$('today').onclick = () => navigate(url({ date: null, teamFilter: null }));
$('open-date').onclick = () => { try { $('date-input').showPicker(); } catch { $('date-input').focus(); } };
$('date-input').onchange = () => { if ($('date-input').value) navigate(url({ date: $('date-input').value, teamFilter: null })); };
$('team-filter').onchange = () => navigate(url({ teamFilter: $('team-filter').value }));
for (const id of ['refresh', 'reading-refresh']) $(id).onclick = () => refresh(true);
$('close-dialog').onclick = () => $('person-dialog').close(); $('close-watch').onclick = () => $('watch-dialog').close();
for (const id of ['person-dialog', 'watch-dialog']) $(id).addEventListener('close', () => {
  let target = personFocus;
  if (!target?.isConnected) target = [...document.querySelectorAll('button')].find(b => personFocus?.dataset.focus ? b.dataset.focus === personFocus.dataset.focus : personFocus?.dataset.watch ? b.dataset.watch === personFocus.dataset.watch : b.dataset.person === personFocus?.dataset.person && b.dataset.index === personFocus?.dataset.index);
  (target || $('main')).focus({ preventScroll: true });
});
document.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (button?.dataset.watch) { $('watch-dialog').dataset.match = button.dataset.watch; watch(button.dataset.watch, button); return; }
  if (button?.dataset.person) { openPerson(button); return; }
  if (button?.dataset.sort) { const t = tables.get(button.dataset.sort); if (t) { const column = Number(button.dataset.column); t.sort = { column, direction: t.sort?.column === column ? -t.sort.direction : -1 }; renderDetail(); } return; }
  if (button?.dataset.retry) { loadBatch(competition(button.dataset.retry), true).then(schedule); return; }
  if (button?.hasAttribute('data-refresh')) { refresh(true); return; }
  const anchor = e.target.closest('a'); if (!anchor || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || anchor.target || anchor.hasAttribute('download')) return;
  const target = new URL(anchor.href); if (target.origin !== location.origin || target.pathname !== pageURL.pathname || target.hash) return;
  e.preventDefault(); navigate(target.href);
});
window.addEventListener('popstate', () => { restoreScroll = history.state?.scroll || 0; mount(); restorePosition(); });
for (const event of ['wheel', 'touchstart', 'pointerdown']) window.addEventListener(event, () => { restoreScroll = null; }, { passive: true });
window.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) restoreScroll = null; });
document.addEventListener('visibilitychange', () => { clearTimeout(timer); clearTimeout(headerTimer); if (document.hidden) { generation++; controller?.abort(); activeTasks = 0; } else { controller = new AbortController(); refresh(); } });
window.addEventListener('pagehide', () => { clearTimeout(timer); clearTimeout(headerTimer); controller?.abort(); history.replaceState({ ...history.state, scroll: window.scrollY }, ''); });
document.addEventListener('error', e => { if (e.target instanceof HTMLImageElement) { e.target.hidden = true; if (e.target.classList.contains('crest')) { const span = document.createElement('span'); span.className = 'crest-fallback'; span.textContent = e.target.dataset.fallback || '?'; span.setAttribute('aria-hidden', 'true'); e.target.replaceWith(span); } } }, true);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
restoreScroll = history.state?.scroll ?? null;
mount();
