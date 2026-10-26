// 서비스 워커: 홈 화면에 설치한 앱이 오프라인에서도 열리게 한다
// 게임 본문(index.html)은 늘 새로 받아 보고, 안 되면 저장해 둔 것을 쓴다. 그림·아이콘은 저장해 둔 것을 먼저 쓴다
const CACHE = 'regress1996-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './assets/icon/icon-192.png', './assets/icon/icon-512.png', './assets/estate/_default.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isPage) {   // 네트워크 먼저 (업데이트가 바로 보이게)
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // 그 밖(그림·글꼴): 저장해 둔 것 먼저, 없으면 받아서 저장
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
