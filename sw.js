/* 마이 스타 캘린더 서비스워커
   목적: 오프라인에서도 앱이 켜지게 함.
   전략: 네트워크 우선(network-first) — 온라인이면 항상 최신을 받고,
         네트워크가 안 될 때만 캐시로 대체. 그래서 기존 '항상 최신' 동작과 충돌하지 않음.
   주의: version.json·notices-data.js는 캐시를 거치지 않고 항상 네트워크 최신으로 받음.
   ▶ 앱 셸을 갱신하고 싶으면 아래 CACHE 버전 숫자만 올리면 됨. */
const CACHE = "msc-shell-v8";
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

  // 공지 데이터는 항상 네트워크에서 최신으로 받아옴 → 배포하면 다음 실행에 공지가 자동으로 바뀜.
  // (앱 셸은 아래 네트워크 우선, 공지만 캐시 우회로 항상 최신. 오프라인이면 캐시로 대체.)
  if (url.pathname.endsWith("notices-data.js")) {
    e.respondWith(
      fetch(url.pathname, { cache: "no-store" })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(url.pathname)))
    );
    return;
  }

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
