// Keep image identity and source URLs intact; only resize on verified source CDNs.
export function thumbnail(source, width = 96) {
  let url;
  try { url = new URL(source); } catch { return source; }
  if (url.protocol !== 'https:' || url.search || ![96, 128, 192].includes(width)) return source;
  if (url.hostname === 'a.espncdn.com' && /^\/i\/(headshots|teamlogos)\/.+\.(png|jpe?g|webp)$/i.test(url.pathname)) {
    return `https://a.espncdn.com/combiner/i?img=${encodeURIComponent(url.pathname)}&w=${width}`;
  }
  if (url.hostname === 'oss.5eplay.com' && /^\/cloudx\/.+\.(png|jpe?g|webp)$/i.test(url.pathname)) {
    return `${source}?x-oss-process=image/resize,w_${width}/format,webp`;
  }
  return source;
}

export function imageOrigins(leagues) {
  const origins = new Set();
  for (const league of leagues) {
    if (league === 'lol') { origins.add('https://img.crawler.qq.com'); origins.add('https://game.gtimg.cn'); }
    else if (league === 'cs2') origins.add('https://oss.5eplay.com');
    else origins.add('https://a.espncdn.com');
  }
  return [...origins];
}

// Reuse completed and in-flight images when live data or table order changes.
// Duplicate URLs need separate nodes: moving one node twice would empty a cell.
export function retainImages(root, fragment) {
  const pool = new Map();
  const key = img => `${img.src}\n${img.className}\n${img.dataset.photoPerson || ''}`;
  for (const img of root.querySelectorAll('img')) {
    if (img.hidden) continue;
    const id = key(img);
    if (!pool.has(id)) pool.set(id, []);
    pool.get(id).push(img);
  }
  for (const next of fragment.querySelectorAll('img')) {
    const img = pool.get(key(next))?.shift();
    if (!img) continue;
    for (const { name, value } of next.attributes) {
      if (name !== 'src' && img.getAttribute(name) !== value) img.setAttribute(name, value);
    }
    next.replaceWith(img);
  }
}
