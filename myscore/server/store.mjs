import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { sourceRequest, decodeSource } from '../sources.mjs';

// Socket-level failures arrive as English runtime errors. The service and the
// page are Chinese, and the page prints this message next to a league, so keep
// the one sentence readable and leave HTTP status details untouched.
const networkMessage = e => /fetch failed|terminated|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|aborted due to timeout|certificate/i.test(String(e?.message)) ? '来源暂时无法连接' : String(e?.message || '请求失败');

export class SourceStore {
  constructor({ directory, fetcher = fetch, memoryLimit = 16 * 1024 * 1024, diskLimit = 64 * 1024 * 1024 } = {}) {
    this.directory = directory; this.fetcher = fetcher; this.memoryLimit = memoryLimit; this.diskLimit = diskLimit;
    this.memory = new Map(); this.bytes = 0; this.pending = new Map(); this.failures = new Map(); this.queue = []; this.active = 0; this.lastPrune = 0;
  }
  async slot(task) {
    if (this.active >= 2) { if (this.queue.length >= 64) throw new Error('服务繁忙，请稍后重试'); await new Promise(resolve => this.queue.push(resolve)); }
    else this.active++;
    try { return await task(); } finally { const next = this.queue.shift(); if (next) next(); else this.active--; }
  }
  remember(key, entry) {
    const buffer = Buffer.from(JSON.stringify(entry));
    if (this.memory.has(key)) { this.bytes -= this.memory.get(key).length; this.memory.delete(key); }
    if (buffer.length > this.memoryLimit) return;
    this.memory.set(key, buffer); this.bytes += buffer.length;
    while (this.bytes > this.memoryLimit) { const first = this.memory.keys().next().value; this.bytes -= this.memory.get(first).length; this.memory.delete(first); }
  }
  async cached(key) {
    if (this.memory.has(key)) { const value = this.memory.get(key); this.memory.delete(key); this.memory.set(key, value); return JSON.parse(value.toString()); }
    if (this.directory) try { const filename = join(this.directory, `${key}.json`); const info = await stat(filename); if (info.size > 10000000) return null; const entry = JSON.parse(await readFile(filename, 'utf8')); this.remember(key, entry); return entry; } catch { /* Cold or unreadable cache. */ }
    return null;
  }
  async persist(key, entry) {
    if (!this.directory) return;
    await mkdir(this.directory, { recursive: true });
    const filename = join(this.directory, `${key}.json`), temporary = `${filename}.tmp`;
    await writeFile(temporary, JSON.stringify(entry), 'utf8'); await rename(temporary, filename);
    if (Date.now() - this.lastPrune > 60000) { this.lastPrune = Date.now(); await this.prune(); }
  }
  async prune() {
    const files = await readdir(this.directory); const entries = [];
    for (const name of files) if (/^[a-f0-9]{64}\.json$/.test(name)) { const path = join(this.directory, name), info = await stat(path); entries.push({ path, size: info.size, at: info.mtimeMs }); }
    entries.sort((a, b) => b.at - a.at); let total = 0;
    for (const entry of entries) { total += entry.size; if (total > this.diskLimit) await unlink(entry.path); }
  }
  async read(kind, params = {}) {
    const request = sourceRequest(kind, params);
    const key = createHash('sha256').update(kind + JSON.stringify(Object.entries(params).sort())).digest('hex');
    if (this.pending.has(key)) return this.pending.get(key);
    const operation = (async () => {
      const saved = await this.cached(key), failed = this.failures.get(key), now = Date.now();
      if (failed?.retryAt > now) throw Object.assign(new Error(failed.message), { retryAt: failed.retryAt });
      if (saved?.until > now) return saved.data;
      try {
        let authorization = '';
        if (kind === 'lolRich') {
          const script = await this.read('lolClient'); const match = /Authorization\s*:\s*"([^"\r\n]{8,128})"/.exec(script);
          if (!match) throw new Error('官网公开客户端配置发生变化'); authorization = match[1];
        }
        const entry = await this.slot(async () => {
          const response = await this.fetcher(request.url, { method: request.body ? 'POST' : 'GET', headers: { 'User-Agent': 'MyScore-Web/1.0', ...request.headers, ...(authorization ? { Authorization: authorization } : {}), ...(saved?.etag ? { 'If-None-Match': saved.etag } : {}) }, body: request.body, redirect: 'error', signal: AbortSignal.timeout(12000) });
          const control = response.headers.get('Cache-Control') || '', maxAge = Number(/(?:^|,)\s*max-age=(\d+)/i.exec(control)?.[1] || 0) * 1000, age = Number(response.headers.get('Age') || 0) * 1000;
          const until = Date.now() + Math.max(request.ttl, maxAge - age);
          if (response.status === 304 && saved) return { ...saved, fetched: Date.now(), until };
          if (!response.ok) {
            const raw = response.headers.get('Retry-After'); const retryAt = response.status === 429 ? Date.now() + (Number(raw) > 0 ? Number(raw) * 1000 : Math.max(60000, (Date.parse(raw) || 0) - Date.now())) : 0;
            throw Object.assign(new Error(`来源返回 HTTP ${response.status}`), { retryAt });
          }
          const chunks = []; let length = 0;
          for await (const chunk of response.body) { length += chunk.length; if (length > 8000000) throw new Error('来源响应超过大小限制'); chunks.push(Buffer.from(chunk)); }
          const data = decodeSource(kind, Buffer.concat(chunks).toString('utf8'));
          return { data, fetched: Date.now(), until, etag: response.headers.get('etag') || '' };
        });
        this.failures.delete(key); this.remember(key, entry); await this.persist(key, entry).catch(() => {}); return entry.data;
      } catch (e) {
        const count = (failed?.count || 0) + 1, retryAt = e.retryAt || Date.now() + Math.min(120000, 5000 * 2 ** Math.min(5, count - 1)), message = networkMessage(e);
        this.failures.set(key, { count, retryAt, message });
        while (this.failures.size > 256) this.failures.delete(this.failures.keys().next().value);
        throw Object.assign(new Error(message), { retryAt });
      }
    })();
    this.pending.set(key, operation); try { return await operation; } finally { this.pending.delete(key); }
  }
}
