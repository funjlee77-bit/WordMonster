/* 단어 몬스터 탐험대 Service Worker — scripts/build-sw.mjs가 빌드 때 만들어 줍니다. */
const VERSION = '__VERSION__';
const CACHE = 'wm-' + VERSION;
const FILES = __FILES__; // 앱에 필요한 모든 파일(프로그램, 500단어 데이터가 든 JS, 그림, 아이콘)
const scope = self.registration.scope;
const URLS = FILES.map((f) => new URL(f, scope).href);

// 설치: 새 캐시에 전체 파일을 받아 둠. 하나라도 실패하면 설치 실패 → 기존 버전은 그대로 사용
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(URLS.map((u) => new Request(u, { cache: 'reload' })))));
  // skipWaiting 하지 않음: 학습 중 강제 교체 금지. 사용자가 "지금 적용"을 누를 때만 교체
});

// 활성화: 새 버전이 실제로 켜진 뒤에만 예전 캐시 삭제
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('wm-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'STATUS') {
    e.waitUntil((async () => {
      const c = await caches.open(CACHE);
      let missing = 0;
      for (const u of URLS) if (!(await c.match(u))) missing++;
      const msg = { type: 'STATUS', version: VERSION, total: URLS.length, missing };
      if (e.ports && e.ports[0]) e.ports[0].postMessage(msg); else if (e.source) e.source.postMessage(msg);
    })());
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(scope)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (req.mode === 'navigate') {
      const shell = await c.match(new URL('./index.html', scope).href);
      if (shell) return shell;
    }
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(req); }
    catch (err) {
      const shell = await c.match(new URL('./index.html', scope).href);
      if (req.mode === 'navigate' && shell) return shell;
      throw err;
    }
  })());
});
