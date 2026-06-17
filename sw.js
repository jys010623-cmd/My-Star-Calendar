/* 마이 스타 캘린더 서비스워커
   목적: 오프라인에서도 앱이 켜지게 함.
   전략: 캐시 우선 + 백그라운드 갱신(stale-while-revalidate) — 저장된 셸을 즉시 내줘
         앱이 곧바로 떠서 스플래시가 순식간에 사라짐. 동시에 네트워크로 새 버전을 받아
         캐시에 갱신해 두므로 다음 실행엔 최신이 반영됨(또는 '새로고침' 배너로 바로 알림).
   주의: version.json은 절대 캐시하지 않음(버전 감지가 항상 실시간이어야 함).
   ▶ 앱 셸을 갱신하고 싶으면 아래 CACHE 버전 숫자만 올리면 됨. */
const CACHE = "msc-shell-v3";
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/fonts.css",
  "./script/app.js",
  "./script/notices-data.js",
  "./manifest.json",
  "./favicon.svg",
];

self.addEventListener("install", (e) => {
  self.skipWaiting(); // 새 워커를 곧바로 대기 해제
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // 쓰기 요청은 건드리지 않음
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부(GTM·유튜브·스포티파이 등)는 그대로 통과
  if (url.pathname.endsWith("version.json")) return; // 버전 감지는 항상 실시간 — 캐시 금지

  // 캐시 우선 + 백그라운드 갱신: 캐시에 있으면 즉시 내주고(→ 앱 즉시 표시 → 스플래시 순삭),
  // 동시에 네트워크로 받아 캐시를 갱신. 캐시에 없으면 네트워크로 가져옴. 오프라인이면 캐시로 대체.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || caches.match("./index.html"));
      return cached || network;
    })
  );
});
