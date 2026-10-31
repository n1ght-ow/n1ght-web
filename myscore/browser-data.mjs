import { apiBase } from './config.mjs';
import { sourceRequest, decodeSource } from './sources.mjs';
import { Provider } from './provider.mjs';

const cache = new Map(), pending = new Map();
export class SourceError extends Error {
  constructor(message, retryAt = 0) { super(message); this.retryAt = retryAt; }
}
export async function api(route, params, signal) {
  if (!apiBase) throw new SourceError('此来源需要数据服务，站点尚未配置服务地址');
  let response;
  try {
    response = await fetch(`${apiBase}/api/v1/${route}?${new URLSearchParams(params)}`, { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(45000)]) });
  } catch (e) {
    // A blocked network, an offline service or a timeout must read as our
    // service being unavailable, not as the browser's raw English TypeError.
    if (signal?.aborted) throw e;
    throw new SourceError('数据服务暂时无法连接，请稍后重试');
  }
  let result;
  try { result = await response.json(); } catch { throw new SourceError('数据服务返回了无法读取的内容，请稍后重试'); }
  if (!response.ok) throw new SourceError(result.error || '数据服务连接失败', result.retryAt || 0);
  return result;
}
export async function read(kind, params = {}, signal) {
  const request = sourceRequest(kind, params), key = request.url, now = Date.now(), saved = cache.get(key);
  if (saved?.until > now) return saved.data;
  if (saved?.retryAt > now) throw new SourceError(saved.error, saved.retryAt);
  if (pending.has(key) && !pending.get(key).signal?.aborted) return pending.get(key);
  const job = (async () => {
    let response, body;
    try {
      response = await fetch(request.url, { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(10000)]), headers: request.headers, ...(request.body ? { method: 'POST', body: request.body } : {}) });
      if (response.status === 429) {
        const after = response.headers.get('Retry-After'), seconds = Number(after);
        throw new SourceError('来源请求频率受限，稍后自动重试', now + (Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : Date.parse(after) - now > 0 ? Date.parse(after) - now : 60000));
      }
      if (!response.ok) throw new Error(`来源返回 HTTP ${response.status}`);
      const reader = response.body.getReader(), chunks = []; let size = 0;
      try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 8000000) throw new Error('来源响应超过大小限制'); chunks.push(value); } }
      catch (e) { await reader.cancel(); throw e; }
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      body = new TextDecoder().decode(bytes);
    } catch (e) {
      if (signal?.aborted || e instanceof SourceError || !apiBase) {
        if (!signal?.aborted) cache.set(key, { ...saved, retryAt: e.retryAt || Date.now() + 15000, error: e.message });
        throw e instanceof TypeError ? new SourceError('无法直接连接来源；请检查网络或数据服务配置') : e;
      }
      return api('source', { kind, ...params }, signal).then(result => result.data);
    }
    const data = decodeSource(kind, body);
    const maxAge = Number(/(?:^|,)\s*max-age=(\d+)/i.exec(response.headers.get('Cache-Control') || '')?.[1] || 0) * 1000;
    const age = Number(response.headers.get('Age') || 0) * 1000;
    cache.delete(key); cache.set(key, { data, bytes: body.length * 2, until: Date.now() + Math.max(request.ttl, maxAge - age) });
    // Large public rosters are handled by the service, not retained in browser caches.
    while (cache.size > 64 || [...cache.values()].reduce((n, e) => n + (e.bytes || 0), 0) > 16 * 1024 * 1024) cache.delete(cache.keys().next().value);
    return data;
  })();
  job.signal = signal; pending.set(key, job); try { return await job; } finally { if (pending.get(key) === job) pending.delete(key); }
}
export const provider = new Provider(read, api);
export function readSaved(key) { try { return JSON.parse(localStorage.getItem(`myscore:${key}`)); } catch { return null; } }
export function saveResult(key, value) {
  try {
    const body = JSON.stringify(value); if (body.length > 250000) return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith('myscore:data:'));
    while (keys.length >= 12) localStorage.removeItem(keys.shift());
    localStorage.setItem(`myscore:${key}`, body);
  } catch { /* Quota/private browsing never blocks real data. */ }
}
