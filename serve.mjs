import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, join, normalize } from "node:path";

/* Dev-only static preview for N1GHT CHXN9.
   Adds live reload: every connected page holds an SSE connection to /__live
   and hard-reloads when a watched source file changes. The injected script
   lives only in the HTTP response, so opening index.html directly from disk
   still works exactly as before.

   Zero dependencies on purpose: node:http + node:fs only.
   Usage: node serve.mjs   (PORT env overrides 3100) */

const root = process.cwd();
const port = Number(process.env.PORT || 3100);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
};

/* ---------- live reload ---------- */

const clients = new Set();

const LIVE_SNIPPET = [
  "<script>",
  "(function () {",
  "  if (!window.EventSource) return;",
  '  var source = new EventSource("/__live");',
  "  source.onmessage = function () { location.reload(); };",
  "  // the endpoint only exists under this dev server; if it goes away, stop",
  "  // retrying instead of hammering the console",
  "  source.onerror = function () { source.close(); };",
  "})();",
  "</script>",
].join("\n");

const IGNORED = /(^|[\\/])(\.git|\.venv|\.zcode|node_modules|archive)([\\/]|$)/;
const WATCHED = /\.(html|css|js|mjs)$/i;

let reloadTimer = 0;
function broadcast() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const res of clients) {
      try {
        res.write("data: reload\n\n");
      } catch {
        clients.delete(res);
      }
    }
  }, 80);
}

function watchDir(dir, options) {
  try {
    watch(dir, options, (event, filename) => {
      if (!filename) return;
      const name = String(filename);
      if (IGNORED.test(name) || !WATCHED.test(name)) return;
      broadcast();
    });
  } catch {
    /* a missing optional directory is not worth failing the server over */
  }
}

// watch only what the site actually loads, so the 1900-file .venv tree is
// never registered with the OS watcher
watchDir(root, { recursive: false });
watchDir(join(root, "css"), { recursive: true });
watchDir(join(root, "js"), { recursive: true });

/* ---------- server ---------- */

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/__live") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.write("retry: 500\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    if (pathname.endsWith("/")) pathname += "index.html";
    const target = normalize(join(root, pathname));
    if (!target.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    let body = await readFile(target);
    const type = types[extname(target).toLowerCase()] || "application/octet-stream";

    if (type.startsWith("text/html")) {
      body = Buffer.from(
        body.toString("utf8").replace(/<\/body>/i, LIVE_SNIPPET + "</body>"),
        "utf8"
      );
    }

    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("N1GHT CHXN9 preview  ->  http://127.0.0.1:" + port);
  console.log("live reload: on (watching index.html, css/, js/)");
});
