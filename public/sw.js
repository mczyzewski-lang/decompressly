/* Decompressly service worker — offline-first shell, cache-first static assets, never caches /api. */
const VERSION = "dc-v4"; // bump whenever bundled sounds or icons change, so installed apps refresh them
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  ...["system", "nature", "jazz", "orchestral"].flatMap((s) => [`/sounds/${s}-start.mp3`, `/sounds/${s}-close.mp3`]),
  ...["nature", "jazz", "system", "orchestral"].map((s) => `/sounds/bg-${s}.mp3`),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm") {
    const urls = (data.urls || []).filter((u) => typeof u === "string" && u.startsWith(self.location.origin) && !u.includes("/api/"));
    event.waitUntil(
      caches.open(STATIC).then((c) =>
        Promise.allSettled(
          urls.map(async (u) => {
            if (!(await c.match(u))) await c.add(u);
          }),
        ),
      ),
    );
  }
});

async function rangeResponse(request, response) {
  const range = request.headers.get("range");
  if (!range || !response) return response;
  const buf = await response.clone().arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return response;
  const start = m[1] ? Number(m[1]) : 0;
  const end = m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

async function cacheFirst(request, cacheName) {
  const key = new Request(request.url);
  const cached = (await caches.match(key)) || null;
  if (cached) return rangeResponse(request, cached);
  const res = await fetch(key);
  if (res.ok && res.status === 200) {
    const c = await caches.open(cacheName);
    await c.put(key, res.clone());
  }
  return rangeResponse(request, res);
}

async function networkFirstShell(request) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(request, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const c = await caches.open(SHELL);
      await c.put("/", res.clone());
    }
    return res;
  } catch {
    return (await caches.match("/")) || new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cache private or paid endpoints

  if (request.mode === "navigate") {
    event.respondWith(networkFirstShell(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/sounds/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/yoga/")) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }
  // everything else: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const net = fetch(request)
        .then((res) => {
          if (res.ok && res.type === "basic") caches.open(STATIC).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || net;
    }),
  );
});
