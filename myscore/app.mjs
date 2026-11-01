import { competitions, competition, today, shiftDay, dayOf, time, score, delayFor, show, list, https, formationLines } from './shared.mjs?v=2';
import { provider, api, readSaved, saveResult } from './browser-data.mjs?v=2';
import { mediaKind, liveLink } from './media.mjs';
import { hasValue, readableTable, readableStats, matchFacts, gameResults, matchLeaders, personMetrics, sortedRows } from './presentation.mjs?v=1';
import { compareNumbers, compareMetric, comparisonBasis, matchComparison, tableComparisons } from './comparison.mjs?v=1';
import { thumbnail, imageOrigins, retainImages, isMergedCrest } from './images.mjs?v=2';
import { scheduleCount, mergeSchedule } from './schedule-state.mjs?v=2';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function comparisonValue(value, tone = 'neutral', result = false, basis = '') {
  const description = tone === 'better' ? result ? '获胜' : '更优' : tone === 'worse' ? result ? '失利' : '较差' : '';
  const annotation = [basis, description].filter(Boolean).join('；');
  return `<span class="comparison-value" data-tone="${tone}"${description ? ` aria-label="${escape(show(value))}，${escape(annotation)}" title="${escape(annotation)}"` : ''}>${escape(show(value))}</span>`;
}
const icons = {
  left: '<path d="m14 6-6 6 6 6"/>', right: '<path d="m10 6 6 6-6 6"/>', back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M5.2 8a7 7 0 0 1 11.6-2L20 12M4 12l3.2 6A7 7 0 0 0 18.8 16"/>',
  play: '<path d="m9 5 10 7-10 7Z"/>', moon: '<path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>', sort: '<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const groups = [['all', '全部赛事'], ['football', '足球'], ['nba', 'NBA'], ['nfl', 'NFL'], ['f1', 'F1'], ['cs2', 'CS2'], ['lol', 'LOL']];
const pageURL = new URL('./', location.href);
const batches = new Map(), tables = new Map(), tableSorts = new Map();
const failedImages = new Set();
const imageFallbacks = new Map(), photoRequests = new Map();
let eagerPortraits = 0, eagerCrests = 0;
function imageSource(src, width) {
  const original = https(src), resolved = imageFallbacks.get(original) || original;
  const resized = thumbnail(resolved, width);
  return { original: resolved, source: imageFallbacks.get(resized) || resized };
}
function imageHTML(src, name, className = '', personId = '', eager = false) {
  const profilePortrait = className === 'profile-portrait';
  const { original, source } = imageSource(src, profilePortrait ? 192 : 96), missing = !source || failedImages.has(source);
  const immediate = profilePortrait || eager && eagerPortraits++ < 12;
  const profile = personId && detail?.match.group === '足球' ? ` data-photo-person="${escape(personId)}"` : '';
  return `<span class="media-image ${className}${missing ? ' image-missing' : ''}" title="${escape(name)}">${missing ? '' : `<img src="${escape(source)}" data-original-src="${escape(original)}"${profile} alt="" loading="${immediate ? 'eager' : 'lazy'}" fetchpriority="${profilePortrait ? 'high' : 'auto'}" decoding="async" referrerpolicy="no-referrer">`}<span class="media-fallback" aria-hidden="true">${escape((name || '?').slice(0, 2))}</span></span>`;
}
function equipmentHTML(items) {
  return `<span class="equipment">${items.map(i => `<span class="equipment-item" title="${escape(i.name)}">${imageHTML(i.image, i.name, 'item-image')}<span class="sr-only">${escape(i.name)}</span></span>`).join('')}</span>`;
}
function cellHTML(cell) {
  if (cell && typeof cell === 'object') {
    if (cell.images?.length) return equipmentHTML(cell.images);
    if (cell.image) return `<span class="cell-media">${imageHTML(cell.image, show(cell), 'cell-image')}<span>${escape(show(cell))}</span></span>`;
  }
  return escape(show(cell));
}
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
function crest(src, name, extra = '', critical = false) {
  const initials = (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('');
  const { original, source } = imageSource(src, critical ? 128 : 96), immediate = critical || eagerCrests++ < 12;
  return source ? `<img class="crest${isMergedCrest(original) ? ' crest-sprite' : ''} ${extra}" src="${escape(source)}" data-original-src="${escape(original)}" data-fallback="${escape(initials)}" alt="" loading="${immediate ? 'eager' : 'lazy'}" fetchpriority="${critical ? 'high' : 'auto'}" decoding="async" referrerpolicy="no-referrer">` : `<span class="crest-fallback ${extra}" aria-hidden="true">${escape(initials)}</span>`;
}
function teamHref(m, side) { return url({ match: null, team: m[`${side}Id`], competition: m.league, tab: null, map: null, state: null }); }
function matchHref(m) { return url({ match: m.id, team: null, tab: null, map: null, year: m.league === 'f1' && m.start ? dayOf(m.start).slice(0, 4) : null }); }
function playButton(m, labelled = false) { return mediaKind(m) ? `<button type="button" class="watch-button" data-watch="${escape(m.id)}" aria-label="${escape(`${m.home || m.title} ${m.away}：查看${m.state === 'final' ? '回放' : '播放'}入口`)}">${icon('play')}${labelled ? `<span>${m.state === 'final' ? '回放与集锦' : '观看比赛'}</span>` : ''}</button>` : '<span></span>'; }
function rowHTML(m, withDate = false) {
  const status = `${m.state === 'live' ? '<i class="live-dot" aria-hidden="true"></i>' : ''}${escape(m.status)}`;
  const date = withDate && m.start ? `<span>${escape(time(m.start, { month: 'numeric', day: 'numeric' }))}</span>` : '';
  const when = `<div class="match-time">${date}<time datetime="${m.start ? new Date(m.start).toISOString() : ''}">${m.timeConfirmed ? time(m.start) : '时间待定'}</time><span>${status}</span></div>`;
  if (m.league === 'f1') return `<article class="match-row race-row" data-id="${escape(m.id)}" data-state="${m.state}">${when}<a class="race-title" href="${matchHref(m)}">${escape(m.title)}</a><div class="race-leaders">${m.results.slice(0, 3).map(escape).join('<br>') || escape(m.detail)}</div><span class="race-arrow">${icon('arrow')}</span></article>`;
  function team(side) { const linked = !!m[`${side}Id`]; return `<div class="team ${side}"><span class="team-name">${escape(m[side])}</span>${linked ? `<a class="team-link" href="${teamHref(m, side)}" aria-label="查看 ${escape(m[side])} 的${['cs2', 'lol'].includes(m.league) ? '队伍' : '球队'}赛程">${crest(m[`${side}Logo`], m[side])}</a>` : crest(m[`${side}Logo`], m[side])}</div>`; }
  const hasScores = m.homeScore !== '' && m.awayScore !== '' && m.state !== 'scheduled';
  const outcome = matchComparison(m);
  const rowScore = side => hasScores ? comparisonValue(m[`${side}Score`], outcome.regular[side], true) + (outcome.hasPenalties ? ` <sup>(${comparisonValue(m[`${side}Shootout`], outcome.penalties[side], true)})</sup>` : '') : '—';
  return `<article class="match-row" data-id="${escape(m.id)}" data-state="${m.state}">${when}${team('home')}<a class="result-link" href="${matchHref(m)}" aria-label="${escape(`${m.home} 对 ${m.away}，${m.status}，${score(m, 'home')} 比 ${score(m, 'away')}，查看比赛详情`)}"><span class="home-score">${rowScore('home')}</span><span class="separator">:</span><span class="away-score">${rowScore('away')}</span></a>${team('away')}${playButton(m)}${withDate && m.event ? `<div class="row-note">${escape(m.event)}</div>` : ''}</article>`;
}
function preserveUpdate(el, html) {
  if (el._html === html) return;
  const active = el.contains(document.activeElement) ? document.activeElement : null, focusKey = active?.dataset.focus || active?.getAttribute('href') || active?.dataset.watch || (active?.tagName === 'SUMMARY' ? active.parentElement.dataset.table : null);
  const scrolls = [...el.querySelectorAll('.table-scroll')].map(node => ({ label: node.getAttribute('aria-label'), left: node.scrollLeft, top: node.scrollTop }));
  const expanded = new Set([...el.querySelectorAll('details[open][data-table]')].map(node => node.dataset.table));
  const template = document.createElement('template'); template.innerHTML = html;
  retainImages(el, template.content);
  el.replaceChildren(template.content); el._html = html;
  for (const node of el.querySelectorAll('details[data-table]')) node.open = expanded.has(node.dataset.table);
  for (const saved of scrolls) { const node = [...el.querySelectorAll('.table-scroll')].find(node => node.getAttribute('aria-label') === saved.label); if (node) { node.scrollLeft = saved.left; node.scrollTop = saved.top; } }
  if (focusKey) [...el.querySelectorAll('a,button,summary')].find(e => (e.dataset.focus || e.getAttribute('href') || e.dataset.watch || (e.tagName === 'SUMMARY' ? e.parentElement.dataset.table : null)) === focusKey)?.focus({ preventScroll: true });
}
function restorePosition() {
  if (restoreScroll == null) return;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (maximum + 1 < restoreScroll) return; // Wait for an asynchronously loaded long page.
  window.scrollTo({ top: restoreScroll, behavior: 'instant' }); restoreScroll = null;
}
function updateRows(host, matches, withDate = false) {
  host._html = null;
  const old = new Map([...host.querySelectorAll(':scope > .match-row')].map(el => [el.dataset.id, el]));
  const headings = new Map([...host.querySelectorAll(':scope > .programme-event')].map(el => [el.dataset.eventKey, el]));
  const wanted = [];
  let previousEvent = '';
  for (const [index, m] of matches.entries()) {
    if (!withDate && m.event && m.event !== previousEvent) {
      const key = `${m.event}:${index}`, heading = headings.get(key) || document.createElement('h3');
      heading.className = 'programme-event'; heading.dataset.eventKey = key; heading.textContent = m.event; wanted.push(heading);
    }
    previousEvent = m.event || '';
    const html = rowHTML(m, withDate); let node = old.get(m.id);
    if (!node) { const t = document.createElement('template'); t.innerHTML = html; node = t.content.firstElementChild; node._html = html; }
    else if (node._html !== html) {
      const t = document.createElement('template'); t.innerHTML = html; const next = t.content.firstElementChild;
      if (node.children.length === next.children.length) for (let i = 0; i < node.children.length; i++) preserveUpdate(node.children[i], next.children[i].innerHTML);
      else preserveUpdate(node, next.innerHTML);
      node.dataset.state = m.state; node._html = html;
    }
    wanted.push(node);
  }
  const keep = new Set(wanted);
  for (const node of [...host.children]) if (!keep.has(node)) node.remove();
  wanted.forEach((node, index) => { if (host.children[index] !== node) host.insertBefore(node, host.children[index] || null); });
}

function renderControls() {
  $('date-input').value = route.date;
  $('date-large').textContent = time(Date.parse(`${route.date}T12:00:00+08:00`), { month: 'long', day: 'numeric' });
  const date = Date.parse(`${route.date}T12:00:00+08:00`);
  $('date-month').textContent = time(date, { year: 'numeric' });
  $('date-weekday').textContent = time(date, { weekday: 'long' });
  $('today').disabled = route.date === today();
  const football = route.competition === 'football' || competition(route.competition)?.group === '足球';
  preserveUpdate($('sports'), groups.map(([id, name]) => {
    const own = competitions.filter(c => id === 'all' || id === 'football' && c.group === '足球' || c.id === id), loaded = own.map(c => selectedBatch(c));
    const count = scheduleCount(loaded);
    return `<a href="${url({ competition: id === 'all' ? null : id, teamFilter: null })}"${(id === 'football' ? football : route.competition === id) ? ' aria-current="page"' : ''}>${name}<small title="${escape(count.note)}" aria-label="${escape(count.note)}">${count.value}</small></a>`;
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
  eagerCrests = 0;
  renderControls(); const desired = new Set(); $('scores')._html = null;
  for (const c of selectedCompetitions()) {
    const b = selectedBatch(c), matches = list(b?.matches).filter(m => !route.filter || [m.homeId, m.awayId].some(id => `${m.league}:${id}` === route.filter));
    // Empty successful leagues stay quiet; failed and loading sources stay explicit.
    if (b && (!b.loading || b.fetched) && !b.error && !b.warning && !matches.length) continue;
    desired.add(c.id); let section = $(`group-${c.id}`);
    if (!section) { section = document.createElement('section'); section.id = `group-${c.id}`; section.className = 'score-group'; section.innerHTML = '<div class="group-heading"><h2></h2><div class="group-source"></div></div><div class="match-list"></div><div class="group-warning"></div>'; }
    section.querySelector('h2').textContent = c.name; section.classList.toggle('single-group', selectedCompetitions().length === 1); section.classList.toggle('has-events', !!matches[0]?.event);
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
function renderTable(t, index, eager = false) {
  const { key, sort } = registerTable(t, index), sortable = sortedRows(t, sort), comparisons = tableComparisons(t, detail.match);
  const content = `<div class="table-heading"><h2>${escape(t.tab === 'maps' ? t.title.replace(/^第 \d+ 局 · /, '') : t.title)}</h2></div><div class="table-scroll" role="region" aria-label="${escape(t.title)}" tabindex="0"><table class="data-table${t.prose ? ' prose-table' : ''}${t.columns[0] === '时间' ? ' time-table' : ''}"><thead><tr>${t.columns.map((c, i) => `<th scope="col"${sort?.label === c ? ` aria-sort="${sort.direction === 1 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${key}" data-column="${i}" data-focus="${key}-${i}">${escape(c)}${icon('sort')}</button></th>`).join('')}</tr></thead><tbody>${sortable.map(({ row, person, index: personIndex }) => `<tr>${row.map((cell, j) => `<td>${j === 0 && person?.name ? `<button class="person-button person-name" data-person="${key}" data-index="${personIndex}" data-focus="person-${key}-${escape(person.id || person.name)}" type="button">${imageHTML(person.photo, person.name, 'portrait', person.id, eager)}<span>${escape(show(cell))}</span></button>` : comparisons[personIndex]?.[j] !== 'neutral' ? comparisonValue(cell, comparisons[personIndex][j], false, comparisonBasis(t.columns[j])) : cellHTML(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<section class="table-block">${content}</section>`;
}
function registerTable(t, index) {
  const key = `table-${index}`;
  const readingKey = `${detail.match.id}:${t.tab}:${t.category || ''}:${t.title}`;
  tables.set(key, { ...t, readingKey });
  return { key, sort: tableSorts.get(readingKey) };
}
function renderLolTeam(t, index) {
  const { key, sort } = registerTable(t, index);
  const rows = sortedRows(t, sort), cell = (row, name) => row[t.columns.indexOf(name)];
  const title = t.title.replace(/^第 \d+ 局 · /, ''), teamName = title.split(' · ')[0];
  const playerName = name => name?.startsWith(`${teamName} `) ? name.slice(teamName.length + 1) : name;
  const compact = value => hasValue(value) && Number.isFinite(Number(value)) ? new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(Number(value)) : show(value);
  return `<section class="lol-team"><div class="table-heading"><h2>${escape(title)}</h2><div class="roster-sort" aria-label="选手排序"><button type="button" data-reset-sort="${key}" aria-pressed="${!sort}">位置</button>${['K / D / A', '伤害', '经济'].map(name => `<button type="button" data-sort="${key}" data-column="${t.columns.indexOf(name)}" data-focus="${key}-${name}" aria-pressed="${sort?.label === name}">${escape(name === 'K / D / A' ? 'KDA' : name)}${sort?.label === name ? icon('sort') : ''}</button>`).join('')}</div></div><div class="lol-column-labels" aria-hidden="true"><span class="label-identity">选手</span><span class="label-champion">英雄</span><span class="label-kda">K / D / A</span><span class="label-resources"><span>补刀</span><span>伤害</span><span>经济</span></span><span class="label-loadout">出装</span></div><ol class="lol-roster">${rows.map(({ row, person, index: personIndex }) => `<li class="lol-player"><button class="lol-identity person-button" aria-label="查看 ${escape(person?.name || show(row[0]))} 的资料" data-person="${key}" data-index="${personIndex}" data-focus="person-${key}-${escape(person?.id || person?.name)}" type="button">${imageHTML(person?.photo, person?.name, 'portrait', '', true)}<span><strong>${escape(playerName(person?.name || show(row[0])))}</strong><small>${escape(show(cell(row, '位置')))}${hasValue(cell(row, '等级')) ? ` · ${escape(show(cell(row, '等级')))} 级` : ''}</small></span></button><div class="lol-champion">${cellHTML(cell(row, '英雄'))}</div><div class="lol-kda"><span class="sr-only">K / D / A</span><strong>${escape(show(cell(row, 'K / D / A')))}</strong></div><dl class="lol-resources">${['补刀', '伤害', '经济'].map(name => `<div><dt class="sr-only">${name}</dt><dd title="${escape(`${name} ${show(cell(row, name))}`)}">${escape(compact(cell(row, name)))}</dd></div>`).join('')}</dl><div class="lol-loadout">${person?.items?.length ? equipmentHTML(person.items) : '<span class="unavailable">出装未发布</span>'}</div></li>`).join('')}</ol></section>`;
}
function renderLolResources(t, index) {
  return `<div class="game-resources">${renderTable({ ...t, title: '资源对照' }, index)}</div>`;
}

function pitches(d) {
  return `<div class="pitch-grid">${d.formations.map(f => {
    const t = d.tables.find(t => t.teamId === f.teamId && t.category === '首发'); if (!t || !/^\d+(?:-\d+){1,4}$/.test(f.formation)) return '';
    const lines = formationLines(t, f.formation); if (!lines.length) return '';
    const index = d.tables.indexOf(t); tables.set(`table-${index}`, t);
    return `<section class="pitch-section"><h2>${escape(f.team)} <span>${escape(f.formation)}</span></h2><div class="pitch" aria-label="${escape(f.team)} 首发阵型示意">${lines.map(line => `<div class="pitch-line">${line.map(p => `<button class="pitch-player" type="button" data-person="table-${index}" data-index="${t.people.indexOf(p)}"><b>${escape(p.jersey || '—')}</b><span>${escape(p.name)}</span></button>`).join('')}</div>`).reverse().join('')}</div></section>`;
  }).join('')}</div>`;
}
function renderSeries(d) {
  const games = gameResults(d); if (!games.length) return '';
  const cs = d.match.league === 'cs2';
  return `<section class="series-summary"><div class="section-heading"><h2>${cs ? '地图结果' : '小局结果'}</h2><a href="${url({ tab: 'maps', map: null })}">查看${cs ? '地图' : '小局'}数据${icon('right')}</a></div><div class="series-column-headings"><span>${cs ? '地图' : '小局'}</span><span>${escape(cs ? d.match.home : '胜方')}</span><span>${escape(cs ? d.match.away : '时长')}</span></div><div class="series-results">${games.map(g => `<a class="series-game" href="${url({ tab: 'maps', map: g.id })}"><span class="series-game-name">${escape(g.name)}${g.status === '进行中' ? '<span class="live-label">进行中</span>' : ''}</span>${cs ? ['home', 'away'].map(side => `<strong class="series-game-score" aria-label="${escape(d.match[side])} ${escape(show(g[side]))}">${comparisonValue(g[side], g.hasResult && g.status === '已结束' ? compareNumbers(g.home, g.away)[side] : 'neutral', true)}</strong>`).join('') : `<strong class="series-victor" data-tone="${g.winner && g.status === '已结束' ? 'better' : 'neutral'}">${escape(g.winner || g.status)}</strong><span class="series-duration">${escape(g.duration || '未发布')}</span>`}</a>`).join('')}</div></section>`;
}

function renderLeaders(d) {
  const leaders = matchLeaders(d); if (!leaders.length) return '';
  return `<section class="performer-section"><div class="section-heading"><h2>选手表现</h2><a href="${url({ tab: 'lineup', map: null })}">查看全部选手${icon('right')}</a></div><div class="performers">${leaders.map(p => {
    const { key } = registerTable(p.source, `${p.tableIndex}-leader`);
    return `<div class="performer"><button type="button" class="person-button performer-person" data-person="${key}" data-index="${p.index}" data-focus="leader-${escape(p.person.id || p.person.name)}">${imageHTML(p.person.photo, p.person.name, 'portrait', p.person.id, true)}<span><strong>${escape(p.person.name)}</strong><small>${escape(p.person.team)}</small></span></button><div class="performer-value"><span>本队最高 ${escape(p.metric)}</span><strong>${escape(show(p.value))}</strong></div></div>`;
  }).join('')}</div></section>`;
}
function renderMatchFacts(d) {
  const facts = matchFacts(d);
  if (!facts.main.length && !facts.secondary.length && !facts.rankings.length && !d.venue?.image) return '';
  const definitions = rows => `<dl class="match-facts">${rows.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>`;
  const more = facts.secondary.length || facts.rankings.length || d.venue?.image;
  return `<section class="match-information"><h2 class="section-title">比赛资料</h2>${definitions(facts.main)}${more ? `<details class="match-more" data-table="match-facts"><summary><span>更多赛事资料</span>${icon('right')}</summary>${definitions(facts.secondary)}${facts.rankings.length ? `<div class="team-rankings"><h3>战队排名</h3><div class="rankings-row rankings-labels"><span>队伍</span><span>来源排名</span><span>VRS 排名</span></div>${facts.rankings.map(r => `<div class="rankings-row"><strong>${escape(r.name)}</strong><span>${escape(show(r.source))}</span><span>${escape(show(r.vrs))}</span></div>`).join('')}</div>` : ''}${d.venue?.image ? `<figure class="venue-photo">${imageHTML(d.venue.image, d.venue.name)}<figcaption>${escape(d.venue.name)} · ESPN</figcaption></figure>` : ''}</details>` : ''}</section>`;
}
function renderOverview(d, views) {
  const stats = readableStats(d), scoreTables = views.filter(v => v.t.tab === 'overview');
  let html = renderSeries(d);
  if (scoreTables.length) html += `<div class="tables overview-tables">${scoreTables.map(v => renderTable(v.t, v.index)).join('')}</div>`;
  if (stats.length) html += `<section class="overview-comparison"><div class="section-heading"><h2>关键统计</h2><a href="${url({ tab: 'stats' })}">完整统计${icon('right')}</a></div>${renderStats(stats.slice(0, 8))}</section>`;
  html += renderLeaders(d) + renderMatchFacts(d);
  return html || '<p class="empty-state">更详细的比赛数据尚未发布。</p>';
}
function renderDetail() {
  if (!detail) return; const m = detail.match;
  eagerPortraits = 0;
  document.title = `${m.title || `${m.home} vs ${m.away}`} · MyScore`;
  $('reading-view').dataset.sport = m.group === '足球' ? 'football' : m.league;
  const outcome = matchComparison(m);
  const team = side => `<div class="hero-team ${side}">${m[`${side}Id`] ? `<a href="${teamHref(m, side)}">${crest(m[`${side}Logo`], m[side], '', true)}<span>${escape(m[side])}</span></a>` : `${crest(m[`${side}Logo`], m[side], '', true)}<span>${escape(m[side])}</span>`}</div>`;
  const matchTime = m.timeConfirmed ? time(m.start, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '时间待定';
  let header = `<div class="reading-meta"><h1 id="reading-title">${escape(m.league === 'f1' ? m.title : m.event || competition(m.league).name)}</h1><div class="report-meta-actions"><p>${escape(matchTime)} · 北京时间</p>${mediaKind(m) ? playButton(m, true) : ''}</div></div>`;
  if (m.league === 'f1') header += `<p class="race-state">${escape(m.status)}</p>`;
  else header += `<div class="match-hero">${team('home')}<div class="hero-score"><div class="state">${m.state === 'live' ? '<i class="live-dot" aria-hidden="true"></i>' : ''}${escape(m.status)}</div><strong class="${Math.max(m.homeScore.length, m.awayScore.length) >= 3 ? 'score-long' : ''}">${comparisonValue(m.state === 'scheduled' ? '—' : m.homeScore, outcome.regular.home, true)}<span class="score-divider"> : </span>${comparisonValue(m.state === 'scheduled' ? '—' : m.awayScore, outcome.regular.away, true)}</strong>${outcome.hasPenalties ? `<p class="shootout-score">点球 ${comparisonValue(m.homeShootout, outcome.penalties.home, true)} : ${comparisonValue(m.awayShootout, outcome.penalties.away, true)}</p>` : ''}</div>${team('away')}</div>`;
  preserveUpdate($('reading-header'), header);
  const sport = m.group === '足球' ? 'football' : m.league, stats = readableStats(detail);
  const views = detail.tables.flatMap((source, index) => {
    const view = readableTable(source, sport); if (!view) return [];
    return [{ t: view.primary, index }, ...(view.extra ? [{ t: view.extra, index: `${index}-extra` }] : [])];
  });
  const hasTab = tab => views.some(v => v.t.tab === tab);
  const hasFormations = detail.formations.some(f => { const t = detail.tables.find(t => t.teamId === f.teamId && t.category === '首发'); return t && formationLines(t, f.formation).length; });
  const tabs = [['overview', '比赛总览'], ...(hasFormations || hasTab('lineup') ? [['lineup', m.group === '足球' ? '阵容与球员' : m.league === 'cs2' ? '选手数据' : '球员数据']] : []), ...(stats.length || hasTab('stats') ? [['stats', '技术统计']] : []), ...(detail.events.length || hasTab('events') ? [['events', '比赛进程']] : []), ...(detail.games.length ? [['maps', m.league === 'cs2' ? '地图数据' : '小局数据']] : []), ...(hasTab('context') ? [['context', '赛季与交锋']] : [])];
  const tab = tabs.some(t => t[0] === route.tab) ? route.tab : 'overview';
  preserveUpdate($('detail-tabs'), tabs.map(([id, name]) => `<a href="${url({ tab: id === 'overview' ? null : id, map: null })}"${tab === id ? ' aria-current="page"' : ''}>${name}</a>`).join(''));
  let html = '';
  if (tab === 'overview') html += renderOverview(detail, views);
  if (tab === 'stats') html += renderStats(stats);
  if (tab === 'context') html += '<p class="context-note">赛季排名与历史赛果，不计入本场技术统计。</p>';
  if (tab === 'lineup' && hasFormations) html += pitches(detail);
  if (tab === 'events') html += `<ol class="timeline">${detail.events.map(e => `<li><time>${escape(e.time || '—')}</time><div><h2>${escape(e.title)}</h2><p>${escape(e.text)}</p></div></li>`).join('')}</ol>`;
  const map = detail.games.find(g => g.id === route.map)?.id || detail.games[0]?.id;
  if (tab === 'maps') html += `<nav class="segmented" aria-label="选择${m.league === 'cs2' ? '地图' : '小局'}">${detail.games.map(g => `<a href="${url({ tab: 'maps', map: g.id })}"${map === g.id ? ' aria-current="page"' : ''}>${escape(g.name)}${g.status === '进行中' ? ' · 进行中' : ''}</a>`).join('')}</nav>`;
  if (tab === 'maps') { const game = detail.games.find(g => g.id === map); if (game?.duration || game?.winner) html += `<dl class="game-facts">${[['时长', game.duration], ['胜方', game.winner]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>`; }
  if (tab !== 'overview') {
    const selected = views.filter(v => v.t.tab === tab && (tab !== 'maps' || v.t.category === map));
    const expanded = selected.filter(v => !v.t.collapsible), deeper = selected.filter(v => v.t.collapsible);
    const resource = v => m.league === 'lol' && v.t.columns[0] === '队伍' && v.t.columns.includes('大龙');

    const render = v => resource(v) ? renderLolResources(v.t, v.index) : m.league === 'lol' && v.t.columns.includes('出装') ? renderLolTeam(v.t, v.index) : renderTable(v.t, v.index, true);
    html += `<div class="tables${m.league === 'lol' && tab === 'maps' ? ' lol-tables' : ''}">${expanded.map(render).join('')}${deeper.length ? `<details class="deep-analysis" data-table="analysis-${tab}-${map || ''}"><summary><span>${tab === 'events' ? '完整进程' : '深入数据'}</span><small>${tab === 'events' ? '文字实录与逐档记录' : m.league === 'lol' ? '战斗、伤害、承伤、视野、符文与 BP' : '更多指标与对位明细'}</small>${icon('right')}</summary><div class="analysis-tables">${deeper.map(v => renderTable({ ...v.t, collapsible: false }, v.index)).join('')}</div></details>` : ''}</div>`;
  }
  if (!html || html === '<div class="tables"></div>') html = '<div class="empty-state">来源尚未提供此项内容。</div>';
  // Header/timestamps and large table bodies have independent fingerprints.
  preserveUpdate($('reading-content'), html);
  $('reading-source').textContent = `${detail.source} · 获取于 ${time(detail.fetched)}${detail.warning ? ` · ${detail.warning}` : ''}`;
  restorePosition();
}
function renderStats(stats) { return stats.length ? `<section class="stat-comparison" aria-label="双方技术统计"><div class="stat-team-labels"><span>${escape(detail.match.home)}</span><span>${escape(detail.match.away)}</span></div>${stats.map(s => `<div class="stat-row"><strong>${comparisonValue(s.home, compareMetric(s.label, s.home, s.away).home, false, comparisonBasis(s.label))}</strong><span>${escape(s.label)}</span><strong>${comparisonValue(s.away, compareMetric(s.label, s.home, s.away).away, false, comparisonBasis(s.label))}</strong></div>`).join('')}</section>` : ''; }
function renderTeam() {
  if (!teamResult) return;
  eagerCrests = 0;
  const matches = teamResult.matches, sample = matches.find(m => [m.homeId, m.awayId].includes(route.team));
  const side = sample?.homeId === route.team ? 'home' : 'away', name = teamResult.teamInfo?.name || sample?.[side] || '队伍赛程';
  document.title = `${name} · MyScore`;
  preserveUpdate($('reading-header'), `<div class="reading-heading team-summary">${crest(teamResult.teamInfo?.logo || sample?.[`${side}Logo`], name, '', true)}<div><h1 id="reading-title">${escape(name)}</h1><p>${escape(competition(route.competition)?.name || '')} · ${['cs2', 'lol'].includes(route.competition) ? '队伍赛程' : '球队赛程'}</p>${teamResult.teamInfo ? `<p>${escape([teamResult.teamInfo.season, teamResult.teamInfo.record ? `赛季战绩 ${teamResult.teamInfo.record}` : '', teamResult.teamInfo.standing].filter(Boolean).join(' · '))}</p>` : ''}</div></div>`);
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
    const merged = mergeSchedule(old, result, force || now - (old?.fetched || 0) >= 21600000);
    const delay = delayFor(merged.matches, route.date) || 21600000;
    const value = { ...merged, loading: false, error: '', nextAt: Date.now() + (merged.warning || merged.stale ? Math.min(delay, 15000) : delay) };
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
        const id = route.year && route.match.startsWith('espn:f1:') ? `${route.match}:${route.year}` : route.match;
        const value = await provider.detail(id, controller.signal, match => {
          if (token !== generation) return;
          detail = detail ? { ...detail, match } : { match, fetched: Date.now(), source: 'ESPN', facts: [['场次', match.title]], stats: [], tables: [], events: [], games: [], formations: [], warning: '正在读取完整车手统计' };
          renderDetail(); scheduleF1Header();
        }); if (token !== generation) return;
        detail = value; saveResult(`data:detail:${route.match}`, detail); renderDetail();
      } else { const value = await provider.team(route.competition, route.team, controller.signal); if (token !== generation) return; teamResult = value; renderTeam(); }
    } else await Promise.all(competitions.map(c => loadBatch(c, force)));
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
  else delay = Math.max(2000, Math.min(...competitions.map(c => Math.max(0, (selectedBatch(c)?.nextAt || 0) - Date.now()))));
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
  const previousDate = route?.date;
  generation++; controller?.abort(); clearTimeout(timer); clearTimeout(headerTimer); activeTasks = 0; lastRefresh = 0; controller = new AbortController();
  route = parseRoute(); const reading = !!(route.match || route.team);
  for (const origin of imageOrigins(selectedCompetitions().map(c => c.id))) {
    if ([...document.querySelectorAll('link[rel="preconnect"]')].some(link => link.href === `${origin}/`)) continue;
    const link = document.createElement('link'); link.rel = 'preconnect'; link.href = origin; document.head.append(link);
  }
  $('schedule-view').hidden = reading; $('reading-view').hidden = !reading; detail = null; teamResult = null; tables.clear();
  $('back-link').href = url({ match: null, team: null, tab: null, map: null, state: null, year: null });
  $('back-link').innerHTML = icon('back') + '返回赛程';
  $('reading-source').textContent = ''; $('detail-tabs').innerHTML = ''; $('detail-tabs')._html = null;
  if (reading) {
    const saved = route.match ? readSaved(`data:detail:${route.match}`) : null;
    if (saved?.match?.id === route.match) { detail = saved; renderDetail(); }
    else { preserveUpdate($('reading-header'), '<div class="reading-heading"><h1 id="reading-title">正在读取比赛</h1></div>'); preserveUpdate($('reading-content'), '<div class="loading-row" aria-label="读取详情"><span></span><span></span></div>'); }
  } else { document.title = 'MyScore · N1GHT CHXN9'; for (const c of competitions) { const key = batchKey(c.id); if (!batches.has(key)) { const saved = readSaved(`data:${key}`); if (saved) batches.set(key, saved); } } renderSchedule(); }
  if (focus) $('main').focus({ preventScroll: true });
  if (!reading) { const active = $('sports').querySelector('[aria-current]'); if (active) { const box = active.getBoundingClientRect(), nav = $('sports').getBoundingClientRect(); if (box.right > nav.right || box.left < nav.left) $('sports').scrollLeft += box.left - nav.left - 12; } }
  refresh(reading || previousDate !== route.date);
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
  const metrics = personMetrics(person);
  const bio = [['号码', person.jersey], ['出生日期', person.birthday], ['年龄', person.age], ['国籍', person.nationality], ['身高', person.height], ['体重', person.weight], ['出生地', person.birthplace], ['大学', person.college], ['职业年数', person.experience], ['选秀', person.draft]].filter(([, v]) => hasValue(v));
  const definitions = (rows, className) => `<dl class="${className}">${rows.map(([k, v]) => `<div${className === 'profile-key-stats' && show(v).length > 7 ? ` class="metric-long${show(v).length > 10 ? ' metric-wide' : ''}"` : ''}><dt>${escape(k)}</dt><dd>${escape(show(v))}</dd></div>`).join('')}</dl>`;
  return `<div class="profile-head">${imageHTML(person.photo, person.name, 'profile-portrait', person.id)}<div><h2 id="person-title">${escape(person.name)}</h2><p>${escape([person.team, person.position].filter(Boolean).join(' · '))}</p></div></div>${person.champion ? `<div class="profile-game-context">${cellHTML(person.champion)}</div>` : ''}${metrics.badges.length ? `<div class="profile-badges">${metrics.badges.map(name => `<span>${escape(name)}</span>`).join('')}</div>` : ''}${bio.length ? definitions(bio, 'profile-bio') : ''}${person.items?.length ? `<section class="profile-build"><h3>本局出装</h3>${equipmentHTML(person.items)}<p class="equipment-names">${person.items.map(i => escape(i.name)).join(' · ')}</p></section>` : ''}${metrics.primary.length ? `<section class="profile-statistics"><h3>关键数据</h3>${definitions(metrics.primary, 'profile-key-stats')}</section>` : ''}${metrics.groups.map(g => `<details class="profile-group" data-table="profile-${escape(g.title)}"><summary><span>${escape(g.title)}</span>${icon('right')}</summary>${definitions(g.rows, 'facts profile-metrics')}</details>`).join('')}${https(person.url) ? `<p><a href="${escape(https(person.url))}" target="_blank" rel="noopener noreferrer">完整球员资料${icon('right')}</a></p>` : ''}${warning || source ? `<p class="profile-source">${escape(warning || source)}</p>` : ''}`;
}
async function openPerson(button) {
  const p = tables.get(button.dataset.person)?.people[Number(button.dataset.index)]; if (!p) return;
  personFocus = button; preserveUpdate($('person-content'), personHTML(p)); $('person-dialog').showModal();
  $('person-dialog').dataset.person = `${p.id}:${p.name}`;
  if (['足球', 'NBA', 'NFL'].includes(detail?.match.group) && p.id) try {
    const result = await api('profile', { match: detail.match.id, id: p.id });
    if ($('person-dialog').open && $('person-dialog').dataset.person === `${p.id}:${p.name}`) preserveUpdate($('person-content'), personHTML({ ...result.person, metrics: p.metrics }, result.warning, result.source));
  } catch (e) { if ($('person-dialog').open && $('person-dialog').dataset.person === `${p.id}:${p.name}`) preserveUpdate($('person-content'), personHTML(p, `${e.message}；保留本场资料`)); }
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
  if (button?.dataset.sort) {
    const t = tables.get(button.dataset.sort), column = Number(button.dataset.column);
    if (t && column >= 0 && t.columns[column]) {
      const previous = tableSorts.get(t.readingKey), label = t.columns[column];
      tableSorts.set(t.readingKey, { label, direction: previous?.label === label ? -previous.direction : -1 });
      if (tableSorts.size > 128) tableSorts.delete(tableSorts.keys().next().value);
      renderDetail();
    }
    return;
  }
  if (button?.dataset.resetSort) { const t = tables.get(button.dataset.resetSort); if (t) { tableSorts.delete(t.readingKey); renderDetail(); } return; }
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
document.addEventListener('error', async e => {
  const img = e.target; if (!(img instanceof HTMLImageElement)) return;
  const fullSize = https(img.dataset.originalSrc);
  if (fullSize && fullSize !== img.src && !img.dataset.originalRetried && !failedImages.has(fullSize)) {
    imageFallbacks.set(img.src, fullSize);
    if (imageFallbacks.size > 256) imageFallbacks.delete(imageFallbacks.keys().next().value);
    img.dataset.originalRetried = 'true'; img.src = fullSize; return;
  }
  const original = img.src; failedImages.add(original); img.hidden = true;
  const media = img.closest('.media-image'); media?.classList.add('image-missing');
  if (img.classList.contains('crest')) { const span = document.createElement('span'); span.className = 'crest-fallback'; span.textContent = img.dataset.fallback || '?'; span.setAttribute('aria-hidden', 'true'); img.replaceWith(span); }
  // A source headshot can be absent even when the verified FPL portrait exists.
  if (!img.dataset.photoPerson || img.dataset.retried || !detail) return;
  img.dataset.retried = 'true';
  const match = detail.match.id, key = `${match}:${img.dataset.photoPerson}`;
  if (!photoRequests.has(key)) {
    const request = api('profile', { match, id: img.dataset.photoPerson }).catch(() => null);
    photoRequests.set(key, request);
    if (photoRequests.size > 64) photoRequests.delete(photoRequests.keys().next().value);
  }
  const result = await photoRequests.get(key), fallback = https(result?.person?.photo);
  if (!fallback || fallback === original || failedImages.has(fallback)) return;
  imageFallbacks.set(original, fallback);
  if (imageFallbacks.size > 256) imageFallbacks.delete(imageFallbacks.keys().next().value);
  if (img.isConnected) { img.hidden = false; media?.classList.remove('image-missing'); img.src = fallback; }
}, true);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
restoreScroll = history.state?.scroll ?? null;
mount();
