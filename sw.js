/* 마이 스타 캘린더 서비스워커
   목적: 오프라인에서도 앱이 켜지게 함.
   전략: 네트워크 우선(network-first) — 온라인이면 항상 최신을 받고,
         네트워크가 안 될 때만 캐시로 대체. 그래서 기존 '항상 최신' 동작과 충돌하지 않음.
   주의: version.json은 절대 캐시하지 않음(버전 감지가 항상 실시간이어야 함).
   ▶ 앱 셸을 갱신하고 싶으면 아래 CACHE 버전 숫자만 올리면 됨. */
const CACHE = "msc-shell-v1";
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

  // 네트워크 우선: 성공하면 캐시에 갱신해 두고, 실패(오프라인)하면 캐시로 대체
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
