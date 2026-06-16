/* ═══════════════════════════════════════════
   마이 스타 캘린더 (My Star Calendar) — app.js
   모든 데이터는 localStorage에 저장됩니다.
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const LS_KEY = "myStarCalendar.v1";

  /* ═══════════ 공지사항 ═══════════
     공지 내용은 script/notices-data.js 에서 관리합니다 (메인 모달 · 공지사항 페이지 공용).
     새 소식을 올리려면 그 파일의 NOTICES 배열 맨 위에 항목을 추가하세요.
     id가 사용자가 마지막으로 본 값보다 크면 메뉴에 빨간 점(배지)이 붙고,
     공지사항을 한 번 열어보면 사라집니다. (첫 사용자·전체 초기화 사용자는 안 뜸) */
  const NOTICES = window.NOTICES || [];
  const NOTICE_CATS = window.NOTICE_CATS || {
    update: { label: "업데이트", color: "--c-release" },
    info:   { label: "안내",     color: "--c-broadcast" },
    maint:  { label: "점검",     color: "--c-birthday" },
  };
  const latestNoticeId = () => NOTICES.reduce((m, n) => Math.max(m, n.id), 0);
  const hasUnseenNotices = () => NOTICES.some((n) => n.id > (S.seenNotice || 0));

  /* ── 카테고리 정의 ── */
  // 덕질 유형 프리셋 — 캘린더 카테고리가 주제에 맞게 바뀜 (색은 위치순 팔레트 재사용)
  const PALETTE = ["--c-comeback", "--c-concert", "--c-ticket", "--c-birthday", "--c-broadcast", "--c-release", "--c-personal"];
  // cats=캘린더 카테고리 / arch=아카이브 오프라인 기록 유형 / archOn=온라인 기록 유형
  const PRESETS = {
    idol:    { name: "아이돌", cats: [["comeback", "컴백"], ["concert", "콘서트"], ["ticket", "티켓팅"], ["birthday", "생일·생카"], ["broadcast", "방송·버블"], ["release", "발매·굿즈"], ["personal", "개인"]],
               arch: ["생카", "콘서트", "팝업", "전시", "팬싸", "기타"], archOn: ["영통 팬싸", "온라인 콘서트", "라이브 방송", "스트리밍 파티", "기타"] },
    actor:   { name: "배우", cats: [["airing", "방영·개봉"], ["stage", "무대인사·시사회"], ["award", "시상식"], ["fanmeet", "팬미팅"], ["abday", "생일"], ["press", "화보·인터뷰"], ["personal", "개인"]],
               arch: ["무대인사", "시사회", "팬미팅", "전시·팝업", "기타"], archOn: ["온라인 팬미팅", "라이브 방송", "VOD·다시보기", "기타"] },
    vtuber:  { name: "버추얼", cats: [["stream", "방송·합방"], ["vconcert", "콘서트·행사"], ["vcontent", "신곡·컨텐츠"], ["vbday", "생일·기념일"], ["vgoods", "굿즈"], ["clip", "클립·다시보기"], ["personal", "개인"]],
               arch: ["오프 콘서트", "팝업", "팬미팅", "기타"], archOn: ["방송·합방 시청", "콘서트 스밍", "기념 방송", "클립 정주행", "기타"] },
    musical: { name: "뮤지컬", cats: [["show", "공연"], ["ticket", "티켓팅"], ["casting", "캐스팅"], ["curtain", "커튼콜·이벤트"], ["mbday", "생일"], ["goods", "MD·굿즈"], ["personal", "개인"]],
               arch: ["공연 관람", "커튼콜", "굿즈·전시", "기타"], archOn: ["온라인 중계", "라이브 방송", "기타"] },
    sports:  { name: "스포츠", cats: [["match", "경기"], ["ticket", "직관·예매"], ["sevent", "이벤트·팬싸"], ["sbday", "선수 생일"], ["broadcast", "중계·하이라이트"], ["uniform", "굿즈·유니폼"], ["personal", "개인"]],
               arch: ["직관", "팬미팅·사인회", "이벤트", "기타"], archOn: ["중계 시청", "하이라이트", "온라인 이벤트", "기타"] },
    esports: { name: "e스포츠", cats: [["match", "경기·대회"], ["ticket", "직관·예매"], ["onair", "방송·중계"], ["ebday", "선수 생일"], ["eevent", "이벤트·팬미팅"], ["egoods", "굿즈"], ["personal", "개인"]],
               arch: ["직관·현장", "팬미팅", "이벤트", "기타"], archOn: ["경기 시청", "방송·중계", "온라인 이벤트", "기타"] },
    content: { name: "애니", cats: [["release", "발매·연재"], ["cevent", "이벤트"], ["collab", "콜라보"], ["cbday", "캐릭터 생일"], ["cgoods", "굿즈"], ["media", "영상·자료"], ["personal", "개인"]],
               arch: ["전시·팝업", "행사", "상영회", "기타"], archOn: ["스트리밍·정주행", "발매 감상", "온라인 이벤트", "기타"] },
    game:    { name: "게임", cats: [["update", "업데이트"], ["gevent", "이벤트"], ["gacha", "픽업·가챠"], ["gbday", "캐릭터 생일"], ["ggoods", "굿즈"], ["gstream", "방송·생중계"], ["personal", "개인"]],
               arch: ["오프 이벤트", "팝업", "대회·행사", "기타"], archOn: ["인게임 이벤트", "생방송 시청", "업데이트", "기타"] },
    hobby:   { name: "취미", cats: [["practice", "연습·활동"], ["lesson", "레슨·클래스"], ["recital", "발표·대회"], ["anniv", "기념일"], ["gear", "장비·자료"], ["personal", "개인"]],
               arch: ["연습·활동", "레슨", "발표·대회", "기타"], archOn: ["온라인 클래스", "영상 학습", "기타"] },
    free:    { name: "자유", cats: [["plan", "일정"], ["important", "중요"], ["fanniv", "기념일"], ["personal", "개인"]],
               arch: ["기록", "방문", "기타"], archOn: ["온라인", "시청", "기타"] },
  };
  let CATS = {}; // 활성 프리셋 카테고리 — buildCats()로 채움
  function buildCats() {
    const p = PRESETS[(S && S.preset) || "idol"] || PRESETS.idol;
    CATS = {};
    p.cats.forEach(([k, n], i) => { CATS[k] = { name: n, v: PALETTE[i % PALETTE.length] }; });
    ARCH_TYPES = (p.arch || PRESETS.idol.arch).slice();
    ARCH_TYPES_ON = (p.archOn || PRESETS.idol.archOn).slice();
  }
  function renderPresetButtons(container, current, onPick) {
    if (!container) return;
    container.innerHTML = Object.entries(PRESETS).map(([id, p]) =>
      `<button class="tab ${id === current ? "active" : ""}" data-preset="${id}">${p.name}</button>`).join("");
    container.querySelectorAll("[data-preset]").forEach((b) => { b.onclick = () => onPick(b.dataset.preset); });
  }
  function setPreset(id) {
    if (!PRESETS[id]) return;
    S.preset = id;
    buildCats();
    activeCats = new Set(Object.keys(CATS));
    diaryType = "all"; // 아카이브 유형 필터 초기화 (캘린더와 한 세트로 함께 바뀜)
    save();
    renderSettings(); renderCalendar(); renderHome(); renderArchive();
    toast(`'${PRESETS[id].name}' 프리셋으로 바꿨어요`);
  }
  const EXP_CATS = ["앨범", "굿즈·MD", "콘서트·티켓", "생카·이벤트", "교통·숙박", "구독·멤버십", "기타"];
  const EXP_COLORS = ["#ff7aa2", "#7a86ff", "#ff5c5c", "#ffb13d", "#3dbdff", "#2ecc9a", "#9b9b9b"];
  const PAY_METHODS = ["카드", "현금", "계좌이체", "기타"];
  const STICKERS = ["🎂","🎤","🎟️","💚","💜","💙","🩷","⭐","✨","🐰","🐻","🦁","📸","🎧","✈️","🍰","🔥","🏟️"];
  // 데코용 — 앱과 통일된 라인아이콘 스티커 + 텍스트 색상 팔레트
  const DECO_ICONS = ["heart", "sparkles", "music", "camera", "cake", "flag", "bell", "play", "bookmark", "tag"];
  const DECO_COLORS = [["w", "#ffffff"], ["b", "#1f1f1f"], ["pink", "#f25c8f"], ["purple", "#9b6bff"], ["mint", "#1fc4a8"]];
  // 멤버십 카드 디자인 프리셋
  const MEMBERSHIP_STYLES = [["gradient", "기본"], ["midnight", "미드나잇"], ["holo", "홀로그램"], ["blossom", "블라썸"], ["ivory", "아이보리"]];
  const SWATCHES = [
    ["블랙 (기본)", "#141414"], ["그레이", "#8E9199"], ["모카", "#A07855"],
    ["라임", "#B7D532"], ["그린", "#7AD692"], ["민트", "#5CD6C0"], ["틸", "#1F8A8A"],
    ["스카이", "#5BB8FF"], ["블루", "#3D6BFF"], ["네이비", "#28386B"],
    ["라벤더", "#B8A4E3"], ["바이올렛", "#8A6BFF"], ["퍼플", "#B14EE0"],
    ["인디 핑크", "#D9849B"], ["핑크", "#FF7AA2"], ["로즈", "#FF4D79"],
    ["레드", "#F0383F"], ["와인", "#9B2242"], ["피치", "#FFA98A"], ["옐로", "#FFD84D"],
  ];
  const ST_CATS = ["의류", "신발", "액세서리", "모자", "가방", "음식·카페", "기타"];
  // 아카이브 기록 유형 — 프리셋에 맞춰 buildCats()에서 채움 (캘린더와 한 세트)
  let ARCH_TYPES = ["생카", "콘서트", "팝업", "전시", "팬싸", "기타"];
  let ARCH_TYPES_ON = ["영통 팬싸", "온라인 콘서트", "라이브 방송", "스트리밍 파티", "기타"];
  const archTypes = (m) => (m === "online" ? ARCH_TYPES_ON : ARCH_TYPES);
  // 프리셋 유형 + 사용자가 추가한 유형(S.customArchTypes) 병합 — '기타'는 항상 마지막
  const effArchTypes = (m) => {
    const base = archTypes(m).filter((t) => t !== "기타");
    const custom = (S && S.customArchTypes && S.customArchTypes[m]) || [];
    const merged = base.slice();
    custom.forEach((t) => { if (!merged.includes(t)) merged.push(t); });
    merged.push("기타");
    return merged;
  };
  const MODES = [
    ["", "기본"], ["y2k", "키치"], ["jelly", "젤리"], ["ballet", "발레코어"],
    ["dream", "드림"], ["y3k", "실버"], ["stardust", "스타더스트"], ["glow", "응원봉"],
  ];
  // 패턴을 잠그는 모드 (응원봉: 암전 / 스타더스트: 밤하늘 자체가 배경)
  const NO_BG_MODES = ["glow", "stardust"];
  const POSES = [["float", "떠 있는 창"], ["dock", "바닥에 붙은 창"]];
  const SKINS = [
    ["browser", "브라우저"], ["phone", "폰"], ["msgr", "메신저"],
    ["note", "메모장"], ["retropc", "레트로 윈도우"],
  ];
  const BGS = [["none", "기본"], ["dot", "땡땡이"], ["heart", "하트"], ["sparkle", "반짝이"], ["star", "별"], ["flower", "꽃"], ["clover", "클로버"], ["ribbon", "리본"], ["cherry", "체리"], ["apple", "사과"], ["cloud", "구름"], ["wave", "물결"], ["diamond", "마름모"], ["stripe", "사선"], ["zigzag", "지그재그"], ["grid", "격자"], ["check", "체크"]];
  const ALIGNS = [["left", "왼쪽"], ["center", "가운데"]];
  const PATSTYLES = [["scatter", "흩뿌림"], ["diag", "사선"]];
  // 패턴 배치(흩뿌림/사선)가 실제로 모양을 바꾸는 패턴만. 나머지(땡땡이·리본·물결·사선·지그재그·격자·체크)는 영향 없음 → 배치 토글 비활성화
  const PATSTYLE_BGS = ["heart", "sparkle", "star", "flower", "clover", "cherry", "apple", "cloud", "diamond"];
  const TEMPLATES = [
    { id: "classic", name: "클래식" },
    { id: "profile", name: "프로필형" },
    { id: "poster", name: "포스터" },
    { id: "polaroid", name: "폴라로이드" },
    { id: "minimal", name: "미니멀" },
  ];
  const TPL_WF = {
    profile: `<div class="wf"><div class="wf-cover"></div><div class="wf-avatar"></div><div class="wf-line w40" style="margin-left:9px"></div><div class="wf-cards"><div class="wf-card"></div><div class="wf-card"></div></div></div>`,
    classic: `<div class="wf"><div class="wf-row"><div class="wf-rect"></div><div style="flex:1"><div class="wf-line w60"></div><div class="wf-line w40" style="margin-top:6px"></div></div></div><div class="wf-cards"><div class="wf-card"></div><div class="wf-card"></div></div></div>`,
    poster: `<div class="wf"><div class="wf-cover" style="height:58px;position:relative;border-radius:8px"><span class="wf-line w40" style="position:absolute;left:8px;bottom:16px;background:rgba(255,255,255,.95)"></span><span class="wf-line" style="width:24%;position:absolute;left:8px;bottom:7px;background:rgba(255,255,255,.55)"></span></div><div class="wf-cards"><div class="wf-card"></div><div class="wf-card"></div></div></div>`,
    polaroid: `<div class="wf" style="align-items:center"><div style="background:var(--card);border:1px solid var(--line);border-radius:4px;padding:5px 5px 9px;transform:rotate(-2.5deg);width:72%"><div class="wf-cover" style="height:36px;border-radius:3px"></div><div class="wf-line w40" style="margin:7px auto 0"></div></div><div class="wf-cards" style="width:100%"><div class="wf-card"></div><div class="wf-card"></div></div></div>`,
    minimal: `<div class="wf"><div class="wf-line" style="width:72%;height:11px"></div><div class="wf-line w40"></div><div style="height:2px;background:var(--line-strong);margin-top:5px"></div><div class="wf-cards"><div class="wf-card"></div><div class="wf-card"></div></div></div>`,
  };

  function renderTplThumbs(container, current, onPick) {
    if (!container) return;
    container.innerHTML = TEMPLATES.map((t) => `
      <button class="tpl-thumb ${t.id === current ? "active" : ""}" data-tpl="${t.id}">
        <div class="tt-box">${TPL_WF[t.id]}</div>
        <div class="tt-name">${t.name}</div>
      </button>`).join("");
    container.querySelectorAll(".tpl-thumb").forEach((b) => {
      b.onclick = () => onPick(b.dataset.tpl);
    });
  }

  /* ── 상태 ── */
  let S = null;            // 전체 데이터
  let calCur = new Date(); // 캘린더 표시 월
  let selDate = null;      // 선택된 날짜 'YYYY-MM-DD'
  let ledgerCur = new Date();
  let binderMode = "own";
  let styleMode = "all";
  let diaryType = "all";
  let archMode = "offline";
  let archSearch = "";
  let binderAlbum = "all";
  let binderPage = 0; // 바인더 현재 페이지 (9칸=3×3 단위)
  let ledgerCatFilter = "all"; // 가계부 지출 내역 카테고리 필터
  let ledgerChartMode = "recent"; // 월별 그래프: recent(최근 6개월) | h1(상반기) | h2(하반기)
  let linkFilter = "all"; // 링크 보관함 필터: all | unread | p:<platform>
  let calMode = "all";    // 캘린더 멀티: all | offline | online
  let activeCats = new Set();
  let showRecords = true; // 캘린더에 아카이브 기록(후기) 표시 토글
  let clockTimer = null;

  /* ── 유틸 ── */
  const $ = (id) => document.getElementById(id);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => fmtDate(new Date());
  const won = (n) => "₩" + Number(n || 0).toLocaleString("ko-KR");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // http/https(+mailto/tel)만 허용 — javascript: 등 위험 스킴 차단 (자가 XSS 방지)
  const safeUrl = (u) => {
    try {
      const p = new URL(u, location.href);
      return ["http:", "https:", "mailto:", "tel:"].includes(p.protocol) ? u : "#";
    } catch (e) { return "#"; }
  };

  /* ── 라인 아이콘 레지스트리 (1.8px stroke · currentColor) ── */
  const ICONS = {
    pin: '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M9 20.5h6M12 17v3.5"/>',
    camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z"/><circle cx="12" cy="13" r="3.2"/>',
    pencil: '<path d="M12.5 20.5h8"/><path d="M16.7 3.8a2.1 2.1 0 0 1 3 3L7.5 19.2l-4 1 1-4Z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowUR: '<path d="M7 17 17 7M9 7h8v8"/>',
    arrowR: '<path d="M4 12h16M13 5l7 7-7 7"/>',
    move: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
    sparkles: '<path d="m12 4 1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7Z"/><path d="m18.7 15.5.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7Z"/>',
    sticker: '<path d="M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v7L13 19.5H6A1.5 1.5 0 0 1 4.5 18Z"/><path d="M13 19.5v-5A1.5 1.5 0 0 1 14.5 13h5"/>',
    share: '<path d="M4 13v6a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-6"/><path d="M12 15V3.5M8 7l4-3.5L16 7"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.8"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    cake: '<path d="M5 13h14a1.5 1.5 0 0 1 1.5 1.5v6h-17v-6A1.5 1.5 0 0 1 5 13Z"/><path d="M3.5 17.2c1.4 1.1 2.9 1.1 4.2 0 1.4 1.1 2.9 1.1 4.3 0 1.4 1.1 2.9 1.1 4.3 0 1.3 1.1 2.8 1.1 4.2 0"/><path d="M12 13V9.5M12 6.5v.1"/>',
    flag: '<path d="M5.5 21V4"/><path d="M5.5 4.8c4-1.8 7 1.8 12.5 0v9.4c-5.5 1.8-8.5-1.8-12.5 0"/>',
    bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 4.8 1.5 6 1.5 6h-15s1.5-1.2 1.5-6Z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/>',
    link: '<path d="M10 14a4 4 0 0 0 6 .4l2.4-2.4a4 4 0 0 0-5.6-5.6l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-6-.4L5.6 12a4 4 0 0 0 5.6 5.6l1.3-1.3"/>',
    play: '<path d="M8 5.5 19 12 8 18.5Z"/>',
    music: '<path d="M9 18.5v-13l10-2v13"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.2 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.2-3.7-8.5s1.3-6.2 3.7-8.5Z"/>',
    heart: '<path d="M12 20S4.5 15.3 4.5 10A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 3c0 5.3-7.5 10-7.5 10Z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    grip: '<circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.6 5.8A8.8 8.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.4 15.4 0 0 1-3 3.6M6.2 6.3A15.3 15.3 0 0 0 2.5 12S6 18.5 12 18.5a8.7 8.7 0 0 0 3.3-.6"/><path d="M4 4l16 16"/>',
    chevUp: '<path d="M6 14l6-6 6 6"/>',
    chevDown: '<path d="M6 10l6 6 6-6"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    bookmark: '<path d="M6.5 4.5h11A1 1 0 0 1 18.5 5.5V20l-6.5-4-6.5 4V5.5A1 1 0 0 1 6.5 4.5Z"/>',
    tag: '<path d="M3.5 11.6V6A2.5 2.5 0 0 1 6 3.5h5.6a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1-.6-1.4Z"/><circle cx="8.2" cy="8.2" r="1.3"/>',
  };
  const I = (n, cls) => `<svg class="li${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

  /* 년/월/일 커스텀 드롭다운 날짜 선택기 — 네이티브 select는 펼친 목록 높이를 못 줄여서 직접 구현(높이 제한+스크롤) */
  function dateSelectHTML(id, value, opts) {
    opts = opts || {};
    const curY = new Date().getFullYear();
    const yBack = opts.yearsBack != null ? opts.yearsBack : 100;
    const yFwd = opts.yearsFwd != null ? opts.yearsFwd : 1;
    const p = (value || "").split("-");
    const vy = +p[0] || "", vm = +p[1] || "", vd = +p[2] || "";
    const dsel = (cls, ph, val, items) => {
      const sel = items.find((it) => it.v === val);
      return `<div class="dsel ${cls}" data-val="${val === "" ? "" : val}">
        <button type="button" class="dsel-btn${sel ? "" : " ph"}">${sel ? sel.t : ph}</button>
        <div class="dsel-list hidden">${items.map((it) => `<button type="button" data-v="${it.v}"${it.v === val ? ' class="on"' : ""}>${it.t}</button>`).join("")}</div>
      </div>`;
    };
    const years = [], months = [], days = [];
    for (let y = curY + yFwd; y >= curY - yBack; y--) years.push({ v: y, t: y + "년" });
    for (let m = 1; m <= 12; m++) months.push({ v: m, t: m + "월" });
    for (let d = 1; d <= 31; d++) days.push({ v: d, t: d + "일" });
    return `<div class="date-sel" id="${id}">
      ${dsel("ds-y", "년", vy, years)}
      ${dsel("ds-m", "월", vm, months)}
      ${opts.noDay ? "" : dsel("ds-d", "일", vd, days)}
    </div>`;
  }
  function dateSelectVal(id) {
    const el = $(id);
    if (!el) return "";
    const y = el.querySelector(".ds-y").dataset.val, m = el.querySelector(".ds-m").dataset.val;
    const dEl = el.querySelector(".ds-d");
    const d = dEl ? dEl.dataset.val : "1"; // 일 드롭다운이 없으면(월 점프 등) 1일로
    if (!y || !m || !d) return "";
    return `${y}-${pad(+m)}-${pad(+d)}`;
  }
  // 펼친 목록을 화면 기준(fixed)으로 띄워 모달 overflow에 안 잘리게. 공간 보고 아래/위로.
  function positionDselList(btn, list) {
    const r = btn.getBoundingClientRect();
    const vh = window.innerHeight, maxH = 208;
    const below = vh - r.bottom - 8, above = r.top - 8;
    const up = below < 180 && above > below;
    list.style.position = "fixed";
    list.style.left = r.left + "px";
    list.style.width = r.width + "px";
    list.style.right = "auto";
    list.style.maxHeight = Math.min(maxH, up ? above : below) + "px";
    if (up) { list.style.bottom = (vh - r.top + 4) + "px"; list.style.top = "auto"; }
    else { list.style.top = (r.bottom + 4) + "px"; list.style.bottom = "auto"; }
  }
  function closeDselList(list) {
    list.classList.add("hidden");
    list.style.position = ""; list.style.left = ""; list.style.width = "";
    list.style.right = ""; list.style.maxHeight = ""; list.style.top = ""; list.style.bottom = "";
  }
  // 커스텀 드롭다운 열기/선택/닫기 — 위임 처리 (동적 생성 대응)
  function handleDselClick(e) {
    const opt = e.target.closest(".dsel-list button[data-v]");
    if (opt) {
      const dsel = opt.closest(".dsel");
      dsel.dataset.val = opt.dataset.v;
      const btn = dsel.querySelector(".dsel-btn");
      btn.textContent = opt.textContent; btn.classList.remove("ph");
      dsel.querySelectorAll(".dsel-list .on").forEach((x) => x.classList.remove("on"));
      opt.classList.add("on");
      closeDselList(dsel.querySelector(".dsel-list"));
      return;
    }
    const btn = e.target.closest(".dsel-btn");
    if (btn) {
      const list = btn.nextElementSibling;
      const willOpen = list.classList.contains("hidden");
      document.querySelectorAll(".dsel-list").forEach((l) => closeDselList(l));
      if (willOpen) {
        list.classList.remove("hidden");
        positionDselList(btn, list);
        const on = list.querySelector(".on");
        if (on) on.scrollIntoView({ block: "center" });
      }
      return;
    }
    document.querySelectorAll(".dsel-list").forEach((l) => closeDselList(l));
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function defaults() {
    return {
      onboarded: false, preset: "idol", dark: false, retro: false, retroSkin: "browser", retroPos: "float", bg: "none", align: "left", widgets: {}, budget: 0, notifyTicket: false, haptics: true, veil: 0, mode: "", template: "profile", archView: "card", accent: "#141414",
      biases: [], currentBias: null,
      customArchTypes: { offline: [], online: [] },
      schedules: [], stickers: {}, photocards: [],
      expenses: [], archives: [], links: [], styles: [],
      membership: { title: "MY STAR PASS", name: "", icon: "✦", no: "0001" },
      seenNotice: 0,
    };
  }

  function save() {
    try {
      ensureImgKeys(); // 포카 사진은 IndexedDB로 보내고 참조만 남김
      localStorage.setItem(LS_KEY, JSON.stringify(persistState()));
    } catch (e) {
      toast("저장 공간이 가득 찼어요. 사진을 줄이거나 백업 후 정리해 주세요.");
    }
  }
  function load() {
    try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(LS_KEY)) || {}); }
    catch (e) { S = defaults(); }
    if (!MODES.some(([id]) => id === (S.mode || ""))) S.mode = "";
    if (S.frame === "msgr") { S.retro = true; S.retroSkin = "msgr"; } // 구버전 프레임 → 창 스타일
    else if (S.frame === "retro") S.retro = true;
    delete S.frame;
    if (!SKINS.some(([id]) => id === S.retroSkin)) S.retroSkin = "browser";
    if (!POSES.some(([id]) => id === S.retroPos)) S.retroPos = "float";
    if (S.retroBg) { S.bg = S.retroBg; delete S.retroBg; } // 구버전 (창 전용 → 공용)
    if (!BGS.some(([id]) => id === S.bg)) S.bg = "none";
    if (S.retroAlign) { S.align = S.retroAlign; delete S.retroAlign; } // 구버전 (구버전엔 align 키가 없었음)
    if (!ALIGNS.some(([id]) => id === S.align)) S.align = "left";
    if (!S.widgets || typeof S.widgets !== "object") S.widgets = {};
    if (!Array.isArray(S.widgetOrder)) S.widgetOrder = [];
    S.veil = Math.max(0, Math.min(100, +S.veil || 0));
    // 기존 일정에 오프/온라인 구분 기본값 부여 (방송·버블=온라인, 나머지=오프라인)
    (S.schedules || []).forEach((s) => { if (!s.mode) s.mode = s.cat === "broadcast" ? "online" : "offline"; });
    // 구버전 라벨(이모지 접두) → 텍스트 라벨 마이그레이션
    const deEmo = (v) => typeof v === "string" ? v.replace(/^[^\uAC00-\uD7A3A-Za-z0-9]+\s*/, "") : v;
    (S.archives || []).forEach((d) => {
      if (d.etype) d.etype = deEmo(d.etype);
      if (d.img && !d.imgs) { d.imgs = [d.img]; delete d.img; }
    });
    (S.styles || []).forEach((st) => { if (st.category) st.category = deEmo(st.category); });
    if (!PRESETS[S.preset]) S.preset = "idol";
    if (!S.customArchTypes || typeof S.customArchTypes !== "object") S.customArchTypes = { offline: [], online: [] };
    if (!Array.isArray(S.customArchTypes.offline)) S.customArchTypes.offline = [];
    if (!Array.isArray(S.customArchTypes.online)) S.customArchTypes.online = [];
    buildCats();
    activeCats = new Set(Object.keys(CATS));
  }

  const curBias = () => S.biases.find((b) => b.id === S.currentBias) || S.biases[0] || null;
  const byBias = (arr) => arr.filter((x) => !x.biasId || x.biasId === S.currentBias);

  /* 이미지 → 압축 dataURL */
  function fileToData(file, maxW, cb) {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  /* 사진에서 대표색 추출 */
  function dominantColor(dataUrl, cb) {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const w = (c.width = 48), h = (c.height = 48);
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const buckets = {};
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        const lum = (r + g + b) / 765;
        if (lum < 0.12 || lum > 0.95) continue; // 너무 어둡거나 밝은 픽셀 제외
        const key = `${r >> 5}_${g >> 5}_${b >> 5}`;
        if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, n: 0, s: 0 };
        const bk = buckets[key];
        bk.r += r; bk.g += g; bk.b += b; bk.n++; bk.s += sat;
      }
      let best = null, bestScore = -1;
      for (const k in buckets) {
        const bk = buckets[k];
        const score = bk.n * (bk.s / bk.n + 0.25);
        if (score > bestScore) { bestScore = score; best = bk; }
      }
      if (!best) return cb(null);
      const hex = "#" + [best.r, best.g, best.b].map((v) => pad2hex(Math.round(v / best.n))).join("");
      cb(hex);
    };
    img.src = dataUrl;
  }
  const pad2hex = (v) => v.toString(16).padStart(2, "0");

  /* 테마 적용 */
  function applyTheme() {
    const root = document.documentElement;
    const acc = (S.accent.toLowerCase() === "#141414" && (S.dark || S.mode === "glow" || S.mode === "stardust")) ? "#f2f2ef" : S.accent;
    root.style.setProperty("--accent", acc);
    const r = parseInt(acc.slice(1, 3), 16), g = parseInt(acc.slice(3, 5), 16), b = parseInt(acc.slice(5, 7), 16);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    root.style.setProperty("--on-accent", lum > 150 ? "#111111" : "#ffffff");
    root.setAttribute("data-dark", S.dark ? "true" : "false");
    root.setAttribute("data-retro", S.retro ? "true" : "false");
    root.setAttribute("data-retro-skin", S.retroSkin || "browser");
    root.setAttribute("data-retro-pos", S.retroPos || "float");
    root.setAttribute("data-bg", S.bg || "none");
    root.setAttribute("data-patstyle", S.patstyle || "scatter");
    root.setAttribute("data-hasbg", !NO_BG_MODES.includes(S.mode) ? "true" : "false");
    root.setAttribute("data-align", S.align || "left");
    root.setAttribute("data-template", S.template || "profile");
    root.setAttribute("data-mode", S.mode || "none");
    root.style.setProperty("--veil", (S.veil || 0) + "%"); // 콘텐츠 배경 불투명 막 농도
    if (!S.retro) { root.removeAttribute("data-retro-min"); root.removeAttribute("data-retro-max"); }
    // 상태바/주소창 색을 현재 테마 배경에 맞춤 (수동 다크 토글·감성 모드 반영)
    const mt = $("metaTheme");
    if (mt) {
      const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
      if (bg) mt.setAttribute("content", bg);
    }
    const glow = S.mode === "glow";
    const sw = $("darkSwitch");
    if (sw) { sw.classList.toggle("on", S.dark || glow); sw.classList.toggle("dim", glow); }
    updPhoneTime();
    const ds = $("darkToggleSide");
    if (ds) ds.classList.toggle("dim", glow);
    const rsw = $("retroSwitch");
    if (rsw) rsw.classList.toggle("on", S.retro);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = S.dark ? "#131313" : "#ffffff";
  }

  /* D-day 계산 */
  function dPlus(dateStr) {
    if (!dateStr) return null;
    const diff = Math.floor((stripTime(new Date()) - stripTime(new Date(dateStr))) / 86400000);
    return diff >= 0 ? diff + 1 : null; // 덕질 시작일 = D+1
  }
  function dUntilAnniv(dateStr) {
    if (!dateStr) return null;
    const now = stripTime(new Date());
    const src = new Date(dateStr);
    let next = new Date(now.getFullYear(), src.getMonth(), src.getDate());
    if (next < now) next = new Date(now.getFullYear() + 1, src.getMonth(), src.getDate());
    return Math.round((next - now) / 86400000);
  }
  const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  function buildBadges(b, ddText) {
    const badges = [`<span class="badge-accent">덕질 ${ddText} ♥</span>`];
    if (b.birthday) {
      const du = dUntilAnniv(b.birthday);
      badges.push(`<span class="badge-accent alt">${I("cake")} 생일 ${du === 0 ? "오늘!" : "D-" + du}</span>`);
    }
    if (b.debutDate) {
      const du = dUntilAnniv(b.debutDate);
      badges.push(`<span class="badge-accent alt">${I("flag")} 데뷔일 ${du === 0 ? "오늘!" : "D-" + du}</span>`);
    }
    return badges.join("");
  }

  const coverPosStr = (b) => {
    const pp = b.coverPos || { x: 50, y: 50 };
    return pp.x + "% " + pp.y + "%";
  };

  /* ═══════════ 온보딩 ═══════════ */
  let obStep = 0;
  let obPhotoData = null;
  let obColor = "#141414";
  let obTpl = "profile";
  let obPreset = "idol";
  function obRenderPreset() {
    renderPresetButtons($("obPresetRow"), obPreset, (id) => { obPreset = id; obRenderPreset(); });
  }

  function obRenderTpl() {
    $("tplPreview").innerHTML = TPL_WF[obTpl];
    renderTplThumbs($("tplThumbs"), obTpl, (id) => {
      obTpl = id;
      obRenderTpl();
    });
  }

  function obShowStep(n) {
    document.querySelectorAll(".ob-step").forEach((s) => s.classList.toggle("active", +s.dataset.step === n));
    obStep = n;
  }

  function obNext() {
    if (obStep === 1) {
      if (!$("obName").value.trim()) return toast("최애 이름을 입력해 주세요!");
    }
    if (obStep === 2) {
      if (!dateSelectVal("obStart")) return toast("덕질 시작일을 골라주세요!");
    }
    obShowStep(obStep + 1);
    if (obStep === 4) obRenderTpl();
  }

  function obFinish() {
    const bias = {
      id: uid(),
      name: $("obName").value.trim(),
      group: $("obGroup").value.trim(),
      photo: obPhotoData,
      startDate: dateSelectVal("obStart"),
      birthday: dateSelectVal("obBirthday") || null,
      debutDate: dateSelectVal("obDebut") || null,
    };
    S.biases.push(bias);
    S.currentBias = bias.id;
    S.accent = obColor;
    S.template = obTpl;
    S.preset = obPreset;
    buildCats();
    activeCats = new Set(Object.keys(CATS));
    S.membership.name = bias.name.toUpperCase() + "'S FAN";
    S.onboarded = true;
    S.seenNotice = latestNoticeId(); // 첫 사용자는 공지 배지 안 뜨게
    save();
    $("onboarding").classList.add("hidden");
    $("app").classList.remove("hidden");
    applyTheme();
    renderAll();
    toast(`${bias.name} 아카이브 시작!`);
  }

  /* 온보딩 건너뛰기: 기본 프로필로 시작, 나중에 설정에서 등록 */
  function obSkip() {
    const bias = {
      id: uid(), name: "내 최애", group: "",
      photo: null, startDate: todayKey(), birthday: null, debutDate: null,
    };
    S.biases.push(bias);
    S.currentBias = bias.id;
    S.preset = obPreset;
    buildCats();
    activeCats = new Set(Object.keys(CATS));
    S.onboarded = true;
    S.seenNotice = latestNoticeId(); // 첫 사용자는 공지 배지 안 뜨게
    save();
    $("onboarding").classList.add("hidden");
    $("app").classList.remove("hidden");
    applyTheme();
    renderAll();
    toast("환영해요! 설정 → 최애 관리에서 언제든 등록할 수 있어요");
  }

  function initOnboarding() {
    $("onboarding").classList.remove("hidden");
    $("obStartWrap").innerHTML = dateSelectHTML("obStart", todayKey(), { yearsFwd: 1 });
    $("obBirthdayWrap").innerHTML = dateSelectHTML("obBirthday", "", { yearsFwd: 1 });
    $("obDebutWrap").innerHTML = dateSelectHTML("obDebut", "", { yearsFwd: 1 });
    obRenderPreset();
    // 스와치
    const grid = $("obSwatches");
    grid.innerHTML = "";
    SWATCHES.forEach(([name, hex]) => {
      const b = document.createElement("button");
      b.className = "swatch" + (hex === obColor ? " active" : "");
      b.title = name;
      b.style.background = hex;
      b.onclick = () => {
        obColor = hex;
        grid.querySelectorAll(".swatch").forEach((s) => s.classList.remove("active"));
        b.classList.add("active");
        S.accent = hex; applyTheme();
      };
      grid.appendChild(b);
    });
    // 사진 (라벨이 파일 입력을 자동으로 열기 때문에 onclick으로 또 열지 않음)
    $("obPhotoInput").onchange = (e) => {
      const f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      fileToData(f, 800, (data) => {
        obPhotoData = data;
        $("obPhotoPreview").src = data;
        $("obPhotoPreview").classList.remove("hidden");
        $("obPhotoHint").classList.add("hidden");
      });
    };
  }

  function extractFromPhoto(mode) {
    const src = mode === "ob" ? obPhotoData : (curBias() && curBias().photo);
    if (!src) return toast("먼저 최애 사진을 등록해 주세요!");
    dominantColor(src, (hex) => {
      if (!hex) return toast("색을 찾지 못했어요. 직접 골라주세요");
      if (mode === "ob") obColor = hex;
      S.accent = hex;
      applyTheme(); save();
      renderSwatches();
      toast(`사진에서 ${hex} 색을 추출했어요!`);
    });
  }

  /* ═══════════ 내비게이션 ═══════════ */
  function exitEditModes() {
    if (posMode) {
      const { wrap, btn, zoom } = posRefs();
      posMode = false;
      if (wrap) wrap.classList.remove("pos-on");
      if (btn) { btn.innerHTML = I("move"); btn.title = "배경 위치 조정"; }
      if (zoom) zoom.classList.add("hidden");
      save();
    }
    if (decoMode) toggleDeco();
  }

  function go(page) {
    exitEditModes(); // 편집 모드가 켜진 채 떠나면 상태가 고착되는 문제 방지
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
    const navPage = page === "profile" ? "home" : page;
    document.querySelectorAll(".nav-btn, .bn-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.page === navPage ||
        (b.dataset.page === "more" && ["ledger", "style", "settings", "more"].includes(navPage) && b.classList.contains("bn-btn")));
    });
    closeFab();
    window.scrollTo({ top: 0 });
    const mainEl = document.querySelector(".main");
    if (mainEl) mainEl.scrollTop = 0;
    if (page === "home") renderHome();
    if (page === "profile") renderProfile();
    if (page === "calendar") renderCalendar();
    if (page === "binder") renderBinder();
    if (page === "ledger") renderLedger();
    if (page === "archive") renderArchive();
    if (page === "style") renderStyle();
    if (page === "settings") renderSettings();
    // 페이지 이동 시 문서 제목 갱신 (SPA 접근성·브라우저 기록)
    const titles = { home: "홈", profile: "최애 프로필", calendar: "캘린더", binder: "포카 바인더", ledger: "덕질 가계부", archive: "아카이브", style: "스타일북", settings: "설정" };
    document.title = (titles[page] ? titles[page] + " · " : "") + "마이 스타 캘린더";
  }

  function toggleFab() {
    // 카테고리 페이지에선 해당 글쓰기 모달을 바로 열고, 메인 등에선 전체 메뉴를 펼침
    const active = document.querySelector(".page.active");
    const direct = active && {
      "page-calendar": "schedule",
      "page-archive": "diary",
      "page-binder": "poca",
      "page-ledger": "expense",
      "page-style": "styleItem",
    }[active.id];
    if (direct) { closeFab(); openModal(direct); return; }
    $("fabMenu").classList.toggle("open");
    $("fabBtn").classList.toggle("open");
  }
  function closeFab() {
    $("fabMenu").classList.remove("open");
    $("fabBtn").classList.remove("open");
  }

  function toggleDark() {
    if (S.mode === "glow") return toast("응원봉 모드는 공연장 암전 — 항상 깜깜해요!");
    S.dark = !S.dark;
    save(); applyTheme();
  }

  /* 메인 템플릿 선택 */
  function setTemplate(t) {
    S.template = t;
    save(); applyTheme(); renderSettings();
    toast(t === "classic" ? "클래식 템플릿으로 바꿨어요" : "프로필형 템플릿으로 바꿨어요");
  }

  /* 감성 모드 (기본/키치/응원봉) */
  function setMode(m) {
    S.mode = S.mode === m ? "" : m;
    save(); applyTheme(); renderSettings();
    const found = MODES.find(([id]) => id === S.mode);
    toast(S.mode ? `${found ? found[1] : ""} 모드 ON` : "기본 모드로 돌아왔어요");
  }

  /* ── 덕질 예산 ── */
  function openBudget() {
    openModalRaw("이번 달 덕질 예산", `
      <div class="field"><label>월 예산 <small>(0이면 예산 끄기)</small></label>
        <input type="number" id="mBudget" min="0" step="10000" value="${S.budget || ""}" placeholder="예) 300000"></div>
      <button class="btn btn-primary btn-lg" id="mSave">저장</button>`);
    $("mSave").onclick = () => {
      S.budget = Math.max(0, +$("mBudget").value || 0);
      save(); closeModal(); renderLedger(); renderHome();
      toast(S.budget ? `예산을 ${won(S.budget)}으로 설정했어요` : "예산을 껐어요");
    };
  }

  /* ── 올해의 덕질 결산 ── */
  function openYearReview() {
    const yr = new Date().getFullYear();
    const yearStr = String(yr);
    const b = curBias();
    const exps = byBias(S.expenses).filter((e) => e.date && e.date.startsWith(yearStr));
    const total = exps.reduce((a, e) => a + (+e.amount || 0), 0);
    const events = byBias(S.archives).filter((d) => d.date && d.date.startsWith(yearStr));
    const offline = events.filter((d) => (d.mode || "offline") === "offline").length;
    const online = events.length - offline;
    const scheds = byBias(S.schedules).filter((x) => x.date && x.date.startsWith(yearStr)).length;
    const pocas = byBias(S.photocards).filter((x) => x.status === "own").length;
    const gots = byBias(S.styles).filter((x) => x.status === "bought").length;
    const yByCat = {};
    exps.forEach((e) => (yByCat[e.category] = (yByCat[e.category] || 0) + +e.amount));
    const topCat = Object.entries(yByCat).sort((a, b2) => b2[1] - a[1])[0];
    openModalRaw(`${yr} 나의 덕질 결산`, `
      <div class="yr-card">
        <p class="yr-eyebrow">MY STAR WRAPPED · ${yr}</p>
        <h3 class="yr-name">${esc(b ? b.name : "최애")} ${b && b.startDate ? `<small>덕질 D+${dPlus(b.startDate)}</small>` : ""}</h3>
        <div class="yr-grid">
          <div><small>행복 비용</small><b>${won(total)}</b></div>
          <div><small>최다 소비</small><b>${topCat ? esc(topCat[0]) : "—"}</b></div>
          <div><small>오프라인 행사</small><b>${offline}회</b></div>
          <div><small>온라인 행사</small><b>${online}회</b></div>
          <div><small>기록한 일정</small><b>${scheds}개</b></div>
          <div><small>보유 포카</small><b>${pocas}장</b></div>
          <div><small>겟한 최애템</small><b>${gots}개</b></div>
          <div><small>남긴 후기</small><b>${events.length}편</b></div>
        </div>
      </div>
      <button class="btn btn-primary btn-lg" id="yrShare">결산 텍스트 복사 (SNS 공유)</button>`);
    $("yrShare").onclick = () => {
      let text = `✦ ${yr} 나의 덕질 결산 ✦\n`;
      text += `최애: ${b ? b.name : "최애"}${b && b.startDate ? ` (D+${dPlus(b.startDate)})` : ""}\n\n`;
      text += `💸 행복 비용 ${won(total)}\n🎪 오프라인 ${offline}회 · 온라인 ${online}회\n`;
      text += `🗓 일정 ${scheds}개 · 📸 포카 ${pocas}장 · 🛍 최애템 ${gots}개\n\n#마이스타캘린더 #덕질결산`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
          .then(() => toast("결산을 복사했어요! SNS에 붙여넣으세요"))
          .catch(() => toast("복사 권한이 없어요"));
      } else toast("이 브라우저에선 복사를 지원하지 않아요");
    };
  }

  /* ── 나만의 컬러 피커 (색조 + 2D 색상판) ── */
  function hexToHsv(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = Math.round(h * 60); if (h < 0) h += 360;
    }
    return [h, Math.round((mx ? d / mx : 0) * 100), Math.round(mx * 100)];
  }
  function hsvToHex(h, sv, vv) {
    const sat = sv / 100, v = vv / 100;
    const c = v * sat, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const tx = (q) => Math.round((q + m) * 255).toString(16).padStart(2, "0");
    return ("#" + tx(r) + tx(g) + tx(b)).toUpperCase();
  }
  function openColorPicker(ctx) {
    let [h, sv, vv] = hexToHsv(S.accent);
    openModalRaw("나만의 컬러", `
      <div class="cp-sv" id="cpSV"><i class="cp-dot" id="cpDot"></i></div>
      <div class="field"><label>색조</label><input type="range" class="cp" id="cpH" min="0" max="360" value="${h}"></div>
      <div class="cp-foot">
        <span class="cp-chip" id="cpPrev"></span>
        <div class="cp-now"><small>지금 고른 색</small><b id="cpName"></b></div>
        <input type="text" id="cpHex" maxlength="7" spellcheck="false">
      </div>
      <p class="hint">색상판을 드래그해 보세요 — 오른쪽 위가 가장 쨍한 색이에요.</p>
      <button class="btn btn-primary btn-lg" id="cpDone">이 색으로 할래요</button>`);
    const apply = (exact) => {
      const hex = exact || hsvToHex(h, sv, vv);
      $("cpPrev").style.background = hex;
      $("cpHex").value = hex;
      const nm = $("cpName"); if (nm) nm.textContent = hex;
      $("cpSV").style.background =
        `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))`;
      $("cpDot").style.left = sv + "%";
      $("cpDot").style.top = (100 - vv) + "%";
      S.accent = hex;
      if (ctx === "ob") obColor = hex;
      applyTheme();
    };
    const svEl = $("cpSV");
    const pick = (ev) => {
      const r = svEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
      sv = Math.round(x * 100); vv = Math.round((1 - y) * 100);
      apply();
    };
    svEl.onpointerdown = (e) => {
      e.preventDefault();
      svEl.setPointerCapture(e.pointerId);
      pick(e);
      svEl.onpointermove = pick;
    };
    svEl.onpointerup = svEl.onpointercancel = () => { svEl.onpointermove = null; };
    $("cpH").oninput = (e) => { h = +e.target.value; apply(); };
    $("cpHex").onchange = (e) => {
      const v2 = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v2)) { [h, sv, vv] = hexToHsv(v2); $("cpH").value = h; apply(v2.toUpperCase()); }
      else { toast("#RRGGBB 형식으로 입력해 주세요"); e.target.value = hsvToHex(h, sv, vv); }
    };
    $("cpDone").onclick = () => {
      if (ctx === "set") { save(); renderSettings(); }
      else {
        const oc = $("obColorChip"), oh = $("obColorHex");
        if (oc) { oc.style.background = S.accent; oh.textContent = S.accent.toUpperCase(); }
      }
      closeModal();
      toast("나만의 컬러를 적용했어요");
    };
    apply(S.accent.toUpperCase());
  }

  /* 창 모드 (화면을 감싸는 레트로 창) + 창 스타일 */
  function toggleRetro() {
    S.retro = !S.retro;
    save(); applyTheme(); renderSettings();
    toast(S.retro ? "미니홈피 모드 ON — 추억의 감성!" : "미니홈피 모드 OFF");
  }

  /* 화면 꾸미기 팝업: 프리셋을 눌러보며 고르기 (즉시 적용) */
  function openFramePicker() {
    $("modalBox").classList.add("wide");
    openModalRaw("미니홈피 모드", `
      <p class="fp-desc">누르면 뒤 화면에 바로 적용돼요. 이것저것 눌러보고 정하세요!</p>
      <div class="field" style="margin-bottom:14px">
        <label>감성 모드</label>
        <div class="tab-row" id="fpModeRow" style="margin-bottom:0;flex-wrap:wrap"></div>
      </div>
      <div class="field" style="margin-bottom:10px"><label>창 스타일</label></div>
      <div class="fp-grid">
        <button class="fp-card" data-fp="">
          <span class="fp-thumb"><span class="fpt-line w60" style="margin-top:14px"></span><span class="fpt-line w40"></span></span>
          <span class="fp-name">기본</span>
        </button>
        <button class="fp-card" data-fp="browser">
          <span class="fp-thumb">
            <span class="fpt-bar"><i class="d r"></i><i class="d y"></i><i class="d g"></i><span class="fpt-url"></span></span>
            <span class="fpt-line w60"></span><span class="fpt-line w40"></span>
          </span>
          <span class="fp-name">브라우저</span>
        </button>
        <button class="fp-card" data-fp="phone">
          <span class="fp-thumb">
            <span class="fpt-bar ph"><b>9:41</b><i class="bat"></i></span>
            <span class="fpt-line w60"></span><span class="fpt-line w40"></span>
          </span>
          <span class="fp-name">폰</span>
        </button>
        <button class="fp-card" data-fp="msgr">
          <span class="fp-thumb">
            <span class="fpt-bar"><span class="fpt-ava">✦</span><span class="fpt-line w40" style="margin:0"></span><i class="d g" style="margin-left:auto"></i></span>
            <span class="fpt-line w60"></span><span class="fpt-line w40"></span>
          </span>
          <span class="fp-name">메신저</span>
        </button>
        <button class="fp-card" data-fp="note">
          <span class="fp-thumb">
            <span class="fpt-bar nt"><span class="fpt-line w40" style="margin:0"></span><i class="x">✕</i></span>
            <span class="fpt-line w60"></span><span class="fpt-line w40"></span>
          </span>
          <span class="fp-name">메모장</span>
        </button>
        <button class="fp-card" data-fp="retropc">
          <span class="fp-thumb">
            <span class="fpt-bar pc"><span class="fpt-line w40" style="margin:0;background:color-mix(in srgb, var(--on-accent) 55%, transparent)"></span><i class="sq"></i><i class="sq"></i><i class="sq"></i></span>
            <span class="fpt-line w60"></span><span class="fpt-line w40"></span>
          </span>
          <span class="fp-name">레트로 윈도우</span>
        </button>
      </div>
      <div class="field row-field" style="margin:14px 0 0">
        <label>바닥에 붙이기 <small>(창을 화면 아래까지)</small></label>
        <button class="switch" id="fpDock"><span class="knob"></span></button>
      </div>
      <div class="field" style="margin:14px 0 0">
        <label>배경 패턴 <small>(응원봉·스타더스트 제외)</small></label>
        <div class="tab-row" id="fpBgRow" style="margin-bottom:0;flex-wrap:wrap"></div>
      </div>
      <button class="btn btn-primary btn-lg" id="fpDone">이걸로 할래요</button>
    `);
    const sync = () => {
      $("modalBody").querySelectorAll(".fp-card").forEach((c) => {
        const id = c.dataset.fp;
        c.classList.toggle("active", id === "" ? !S.retro : (S.retro && S.retroSkin === id));
      });
      $("fpModeRow").innerHTML = MODES.map(([id, name]) =>
        `<button class="tab ${(S.mode || "") === id ? "active" : ""}" data-fpmode="${id}">${name}</button>`).join("");
      $("fpModeRow").querySelectorAll("[data-fpmode]").forEach((b) => {
        b.onclick = () => { setMode(b.dataset.fpmode); sync(); };
      });
      const fd = $("fpDock");
      if (fd) {
        fd.classList.toggle("on", S.retroPos === "dock");
        fd.onclick = () => { setRetroPos(S.retroPos === "dock" ? "float" : "dock"); sync(); };
      }
      $("fpBgRow").innerHTML = BGS.map(([id, name]) =>
        `<button class="tab ${(S.bg || "none") === id ? "active" : ""}" data-fpbg="${id}"><i class="bgp bgp-${id}"></i>${name}</button>`).join("");
      $("fpBgRow").classList.toggle("dim", NO_BG_MODES.includes(S.mode));
      $("fpBgRow").querySelectorAll("[data-fpbg]").forEach((b) => {
        b.onclick = () => { setBg(b.dataset.fpbg); sync(); };
      });
    };
    $("modalBody").querySelectorAll(".fp-card").forEach((c) => {
      c.onclick = () => {
        const id = c.dataset.fp;
        if (id === "") S.retro = false;
        else { S.retro = true; S.retroSkin = id; }
        save(); applyTheme(); renderSettings(); sync();
      };
    });
    $("fpDone").onclick = closeModal;
    sync();
  }
  function setRetroPos(k) {
    S.retroPos = k;
    if (!S.retro) S.retro = true;
    save(); applyTheme(); renderSettings();
    const found = POSES.find(([id]) => id === k);
    toast(`${found ? found[1] : ""}으로 바꿨어요`);
  }
  function setRetroSkin(k) {
    S.retroSkin = k;
    if (!S.retro) S.retro = true; // 스타일 고르면 바로 켜짐
    save(); applyTheme(); renderSettings();
    const found = SKINS.find(([id]) => id === k);
    toast(`${found ? found[1] : ""} 창으로 꾸몄어요`);
  }
  function setBg(k) {
    if (S.mode === "glow") return toast("응원봉 모드는 공연장 암전 — 배경 패턴을 쓸 수 없어요");
    if (S.mode === "stardust") return toast("스타더스트는 밤하늘이 곧 배경 — 패턴을 쓸 수 없어요");
    S.bg = k;
    save(); applyTheme(); renderSettings();
    const found = BGS.find(([id]) => id === k);
    if (k === "none") return toast("배경 패턴을 기본(민무늬)으로 되돌렸어요");
    toast(`배경을 ${found ? found[1] : ""} 패턴으로 바꿨어요`);
  }
  function setAlign(a) {
    S.align = a;
    save(); applyTheme(); renderSettings();
    const found = ALIGNS.find(([id]) => id === a);
    toast(`${found ? found[1] : ""} 정렬로 바꿨어요`);
  }
  function setPatStyle(p) {
    S.patstyle = p;
    save(); applyTheme(); renderSettings();
    const found = PATSTYLES.find(([id]) => id === p);
    toast(`패턴을 ${found ? found[1] : ""} 스타일로 바꿨어요`);
  }
  function retroMin() {
    const r = document.documentElement;
    if (r.getAttribute("data-retro-min") === "true") {
      r.removeAttribute("data-retro-min");
    } else {
      renderMiniWidget();
      r.setAttribute("data-retro-min", "true");
    }
  }

  /* 접기 = iOS풍 위젯 보드 */
  const WIDGETS = [
    ["profile", "최애 프로필", "home"], ["next", "다음 일정", "calendar"],
    ["ticket", "티켓팅", "home"], ["spend", "이번 달 비용", "ledger"],
    ["anniv", "기념일", "profile"], ["binder", "포카 수집", "binder"],
  ];
  let widgetEdit = false;
  const wOn = (id) => S.widgets[id] !== false;
  // 저장된 순서대로 정렬하되, 새로 추가된 위젯은 뒤에 자동 편입
  function widgetOrder() {
    const all = WIDGETS.map(([id]) => id);
    const ord = (S.widgetOrder || []).filter((id) => all.includes(id));
    all.forEach((id) => { if (!ord.includes(id)) ord.push(id); });
    return ord;
  }
  function commitWidgetOrder(grid) {
    const vis = [...grid.querySelectorAll(".wtile")].map((t) => t.dataset.wid);
    const hidden = widgetOrder().filter((id) => !vis.includes(id));
    S.widgetOrder = [...vis, ...hidden];
    save(); renderMiniWidget();
  }
  // 편집 모드에서 타일을 꾹 눌러 드래그 → 재배치
  function startTileDrag(e, tile, grid) {
    const rect = tile.getBoundingClientRect();
    const offX = e.clientX - rect.left, offY = e.clientY - rect.top;
    try { tile.setPointerCapture(e.pointerId); } catch (_) {}
    tile.classList.add("wt-dragging");
    Object.assign(tile.style, {
      width: rect.width + "px", height: rect.height + "px",
      position: "fixed", left: rect.left + "px", top: rect.top + "px",
      zIndex: "60", margin: "0",
    });
    const ph = document.createElement("div");
    ph.className = "wt-ph";
    if (tile.classList.contains("w2")) { ph.style.gridColumn = "span 2"; ph.style.aspectRatio = "2.08 / 1"; }
    else { ph.style.aspectRatio = "1"; }
    tile.after(ph);
    const move = (ev) => {
      tile.style.left = (ev.clientX - offX) + "px";
      tile.style.top = (ev.clientY - offY) + "px";
      tile.style.visibility = "hidden";
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      tile.style.visibility = "";
      const over = under && under.closest(".wtile");
      if (over && over !== tile && over.parentNode === grid) {
        const r = over.getBoundingClientRect();
        const before = ev.clientX < r.left + r.width / 2;
        grid.insertBefore(ph, before ? over : over.nextSibling);
      }
    };
    const up = () => {
      tile.removeEventListener("pointermove", move);
      tile.removeEventListener("pointerup", up);
      try { tile.releasePointerCapture(e.pointerId); } catch (_) {}
      ph.replaceWith(tile);
      tile.classList.remove("wt-dragging");
      ["width", "height", "position", "left", "top", "zIndex", "margin", "visibility"]
        .forEach((p) => { tile.style[p] = ""; });
      commitWidgetOrder(grid);
    };
    tile.addEventListener("pointermove", move);
    tile.addEventListener("pointerup", up);
    move(e);
  }

  function renderMiniWidget() {
    const el = $("miniWidget");
    if (!el) return;
    const b = curBias();
    const today = todayKey();
    const next = byBias(S.schedules).filter((x) => x.date && x.date >= today)
      .sort((a, b2) => a.date.localeCompare(b2.date))[0];
    const nDiff = next ? Math.round((new Date(next.date) - new Date(today)) / 86400000) : null;
    const ym = today.slice(0, 7);
    const spend = byBias(S.expenses).filter((e) => (e.date || "").startsWith(ym))
      .reduce((a, e) => a + (+e.amount || 0), 0);
    const dTo = (ds) => {
      if (!ds) return null;
      const t0 = new Date(today), d = new Date(ds);
      d.setFullYear(t0.getFullYear());
      if (d < t0) d.setFullYear(t0.getFullYear() + 1);
      return Math.round((d - t0) / 86400000);
    };
    const annivs = [];
    if (b && b.birthday) annivs.push(["생일", dTo(b.birthday)]);
    if (b && b.debutDate) annivs.push(["데뷔일", dTo(b.debutDate)]);
    annivs.sort((a, b2) => a[1] - b2[1]);
    const own = byBias(S.photocards).filter((p) => p.status === "own").length;
    const wish = byBias(S.photocards).filter((p) => p.status === "wish").length;
    const hasTicket = !!nextTicket();
    const tiles = {
      profile: `<span class="wt-overlay"><b>${esc(b ? b.name : "최애")}</b><small>덕질 ${b && b.startDate ? "D+" + dPlus(b.startDate) : ""} ♥</small></span>`,
      next: `<small>다음 일정</small>${next
        ? `<b>${nDiff === 0 ? "D-DAY" : "D-" + nDiff}</b><span>${esc(next.title)}</span>`
        : `<span class="wt-empty">예정 없음</span>`}`,
      ticket: `<small>티켓팅</small>${hasTicket ? `<b id="wTick" class="wt-mono">--:--:--</b><span>오픈까지</span>` : `<span class="wt-empty">예정 없음</span>`}`,
      spend: `<small>이번 달 행복 비용</small><b>${won(spend)}</b><span>가계부 보기</span>`,
      anniv: `<small>기념일</small>${annivs.length
        ? `<b>${annivs[0][1] === 0 ? "D-DAY" : "D-" + annivs[0][1]}</b><span>${annivs[0][0]}</span>`
        : `<span class="wt-empty">미등록</span>`}`,
      binder: `<small>포카 수집</small><b>${own}장</b><span>위시 ${wish}장</span>`,
    };
    const ordered = widgetOrder().map((id) => WIDGETS.find((w) => w[0] === id)).filter(Boolean);
    const grid = ordered.filter(([id]) => wOn(id)).map(([id, name, page]) => `
      <button class="wtile ${id === "profile" ? "w2 wt-profile" : ""}" data-wid="${id}" data-wgo="${page}"
        ${id === "profile" && b && (b.cover || b.photo) ? `style="background-image:url(${b.cover || b.photo})"` : ""}>
        ${tiles[id]}
        ${widgetEdit ? `<i class="wt-x">✕</i>` : ""}
      </button>`).join("");
    const hidden = WIDGETS.filter(([id]) => !wOn(id));
    el.innerHTML = `
      <div class="wb-head">
        <small>WIDGETS</small>
        <button class="chip-btn" id="wbEdit">${widgetEdit ? "완료" : "위젯 편집"}</button>
      </div>
      <div class="widget-grid ${widgetEdit ? "editing" : ""}">${grid || ""}</div>
      ${widgetEdit ? `<p class="wb-hint">끌어서 위치 이동 · ✕ 눌러 삭제 · 완료를 누르면 끝나요</p>` : ""}
      ${widgetEdit && hidden.length ? `<div class="wb-add">${hidden.map(([id, name]) =>
        `<button class="chip-btn" data-wadd="${id}">+ ${name}</button>`).join("")}</div>` : ""}`;
    $("wbEdit").onclick = () => { widgetEdit = !widgetEdit; renderMiniWidget(); };
    const gridEl = el.querySelector(".widget-grid");
    el.querySelectorAll(".wtile").forEach((tl) => {
      // 제거 배지(✕)는 별도 처리 — 드래그/탭과 충돌 방지
      const xb = tl.querySelector(".wt-x");
      if (xb) {
        xb.addEventListener("pointerdown", (e) => e.stopPropagation());
        xb.addEventListener("click", (e) => {
          e.stopPropagation();
          S.widgets[tl.dataset.wid] = false; save(); renderMiniWidget();
        });
      }
      let down = null, lp = null;
      tl.addEventListener("pointerdown", (e) => {
        if (e.button && e.button !== 0) return;
        if (e.target.closest(".wt-x")) return;
        down = { x: e.clientX, y: e.clientY };
        if (!widgetEdit) {
          // 꾹 누르면(롱프레스) 편집 모드 진입
          lp = setTimeout(() => {
            lp = null; down = null; widgetEdit = true;
            buzz(15);
            renderMiniWidget();
          }, 430);
        }
      });
      tl.addEventListener("pointermove", (e) => {
        if (!down) return;
        const far = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8;
        if (far && lp) { clearTimeout(lp); lp = null; }
        if (far && widgetEdit && !tl.classList.contains("wt-dragging")) {
          down = null;
          startTileDrag(e, tl, gridEl);
        }
      });
      tl.addEventListener("pointerup", (e) => {
        if (lp) { clearTimeout(lp); lp = null; }
        if (down && !widgetEdit) {
          const near = Math.hypot(e.clientX - down.x, e.clientY - down.y) <= 8;
          if (near) { retroMin(); go(tl.dataset.wgo); }
        }
        down = null;
      });
      tl.addEventListener("pointercancel", () => {
        if (lp) { clearTimeout(lp); lp = null; }
        down = null;
      });
    });
    el.querySelectorAll("[data-wadd]").forEach((bn) => {
      bn.onclick = () => { S.widgets[bn.dataset.wadd] = true; save(); renderMiniWidget(); };
    });
    tickClock();
  }
  function retroMax() {
    const r = document.documentElement;
    r.getAttribute("data-retro-max") === "true"
      ? r.removeAttribute("data-retro-max")
      : r.setAttribute("data-retro-max", "true");
  }

  /* ═══════════ 홈 ═══════════ */
  function renderHome() {
    const b = curBias();
    if (!b) return;
    // 프로필
    const dd = dPlus(b.startDate);
    const ddText = dd ? `D+${dd}` : "D-DAY";
    ["sideName", "mhName", "heroName"].forEach((id) => ($(id).textContent = b.name));
    ["sideDday", "mhDday"].forEach((id) => ($(id).textContent = ddText));
    $("heroGroup").textContent = b.group || "MY BIAS";
    const photoCss = b.photo ? `url(${b.photo})` : "";
    $("heroPhoto").style.backgroundImage = photoCss;
    $("sideAvatar").style.backgroundImage = photoCss;

    $("heroBadges").innerHTML = buildBadges(b, ddText);
    const hc = $("homeCover");
    const hcb = $("homeCoverBg");
    if (hcb) {
      hcb.style.backgroundImage = b.cover ? `url(${b.cover})` : "";
      const hpb = $("homePosBtn");
      if (hpb) hpb.classList.toggle("hidden", !b.cover);
      applyCoverFitTo(hcb, coverFit(b, "home"));
    }

    // 사이드바 최애 스위치
    const bs = $("biasSwitch");
    bs.innerHTML = "";
    if (S.biases.length > 1) {
      S.biases.forEach((bb) => {
        const btn = document.createElement("button");
        btn.className = bb.id === S.currentBias ? "current" : "";
        btn.title = bb.name;
        if (bb.photo) btn.style.backgroundImage = `url(${bb.photo})`;
        else btn.textContent = bb.name[0];
        btn.onclick = () => { S.currentBias = bb.id; save(); renderAll(); };
        bs.appendChild(btn);
      });
    }

    // TODAY
    const tk = todayKey();
    $("todayDateLabel").textContent = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
    const todays = byBias(S.schedules).filter((s) => s.date === tk).sort((a, b2) => (a.time || "").localeCompare(b2.time || ""));
    const annivToday = [];
    if (b.birthday && isAnnivToday(b.birthday)) annivToday.push({ cat: "birthday", title: `${b.name} 생일`, time: "" });
    if (b.debutDate && isAnnivToday(b.debutDate)) annivToday.push({ cat: "birthday", title: "데뷔 기념일", time: "" });
    (b.annivs || []).forEach((a) => { if (isAnnivToday(a.date)) annivToday.push({ cat: "birthday", title: a.title, time: "" }); });
    const all = [...annivToday, ...todays];
    $("todayScroll").innerHTML = all.length
      ? all.map((s) => {
          const c = CATS[s.cat] || CATS.personal;
          return `<div class="today-card" style="--cat:var(${c.v})">
            <div class="tc-cat">${c.name}</div>
            <div class="tc-time">${esc(s.time) || "하루 종일"}</div>
            <div class="tc-title">${esc(s.title)}</div>
          </div>`;
        }).join("")
      : `<div class="today-empty">오늘은 조용한 날이에요.<br>+ 버튼으로 일정을 등록해 보세요</div>`;

    // 이번 달 지출
    const ym = tk.slice(0, 7);
    const monthExp = byBias(S.expenses).filter((e) => e.date && e.date.startsWith(ym));
    const total = monthExp.reduce((a, e) => a + (+e.amount || 0), 0);
    $("homeSpend").textContent = won(total);
    const byCat = {};
    monthExp.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + +e.amount));
    $("homeSpendBar").innerHTML = total
      ? EXP_CATS.map((c, i) => byCat[c] ? `<span style="width:${(byCat[c] / total) * 100}%;background:${EXP_COLORS[i]}"></span>` : "").join("")
      : "";
    const hb = $("homeBudgetHint");
    if (hb) {
      if (S.budget > 0) {
        const over = total > S.budget;
        hb.textContent = over ? `예산 초과 ${won(total - S.budget)}` : `예산 ${won(S.budget)}의 ${Math.min(100, Math.round((total / S.budget) * 100))}%`;
        hb.classList.toggle("budget-over", over);
      } else hb.textContent = "";
    }

    // 다가오는 일정 (7일)
    const upcoming = byBias(S.schedules)
      .filter((s) => s.date > tk)
      .sort((a, b2) => (a.date + (a.time || "")).localeCompare(b2.date + (b2.time || "")))
      .slice(0, 5);
    $("upcomingList").innerHTML = upcoming.length
      ? upcoming.map((s) => {
          const c = CATS[s.cat] || CATS.personal;
          const d = new Date(s.date);
          const dday = Math.round((stripTime(d) - stripTime(new Date())) / 86400000);
          return `<li><span class="dot" style="background:var(${c.v})"></span>${esc(s.title)}<span class="ud">${d.getMonth() + 1}/${d.getDate()} · D-${dday}</span></li>`;
        }).join("")
      : `<li class="up-empty">예정된 일정이 없어요</li>`;

    // 홈 추가 섹션 (응원 라인·스탯·D-day·이번 주·최근)
    renderHomeExtras(b);
    // 멤버십 카드
    renderMemberCard();
    // 티켓팅
    tickClock();
    // 홈 블록 순서·숨김 적용
    applyHomeLayout();
  }

  function renderHomeExtras(b) {
    const today = todayKey();
    const dd = dPlus(b.startDate);

    // 응원 라인
    const cheer = $("homeCheer");
    if (cheer) cheer.innerHTML = `${I("sparkles", "ch-ic")}<span><b>${esc(b.name)}</b> 덕질 <b>${dd != null ? dd : 0}</b>일째 ♥ 오늘도 행복한 덕질!</span>`;

    // 덕질 요약 스탯
    const own = byBias(S.photocards).filter((p) => p.status === "own").length;
    const recCnt = byBias(S.archives).length;
    const offCnt = byBias(S.archives).filter((d) => (d.mode || "offline") === "offline").length;
    const statEl = $("homeStats");
    if (statEl) {
      const stats = [
        [I("heart"), dd != null ? `D+${dd}` : "D-DAY", "덕질", "home"],
        [I("camera"), own + "장", "모은 포카", "binder"],
        [I("pencil"), recCnt + "개", "남긴 기록", "archive"],
        [I("pin"), offCnt + "회", "다녀온 곳", "archive"],
      ];
      statEl.innerHTML = stats.map(([ic, v, l, pg]) =>
        `<button class="hstat" data-pg="${pg}">${ic}<b>${v}</b><span>${l}</span></button>`).join("");
      statEl.querySelectorAll("[data-pg]").forEach((btn) => { btn.onclick = () => go(btn.dataset.pg); });
    }

    // D-DAY 카운트다운
    const dTo = (ds) => {
      if (!ds) return null;
      const t0 = new Date(today), d = new Date(ds);
      d.setFullYear(t0.getFullYear());
      if (d < t0) d.setFullYear(t0.getFullYear() + 1);
      return Math.round((d - t0) / 86400000);
    };
    const ddays = [];
    if (b.birthday) ddays.push({ ic: I("cake"), label: `${b.name} 생일`, n: dTo(b.birthday), v: "--c-birthday" });
    if (b.debutDate) ddays.push({ ic: I("flag"), label: "데뷔 기념일", n: dTo(b.debutDate), v: "--c-comeback" });
    (b.annivs || []).forEach((a) => ddays.push({ ic: I("heart"), label: a.title, n: dTo(a.date), v: "--c-concert" }));
    const nextSch = byBias(S.schedules).filter((s) => s.date && s.date >= today).sort((a, c) => a.date.localeCompare(c.date))[0];
    if (nextSch) {
      const n = Math.round((stripTime(new Date(nextSch.date)) - stripTime(new Date())) / 86400000);
      ddays.push({ ic: I("bell"), label: nextSch.title, n, v: (CATS[nextSch.cat] || CATS.personal).v });
    }
    ddays.sort((a, c) => a.n - c.n);
    const ddEl = $("homeDday");
    if (ddEl) ddEl.innerHTML = ddays.length
      ? ddays.map((d) => `<div class="dday-card" style="--cat:var(${d.v})"><span class="dd-ic">${d.ic}</span><b>${d.n === 0 ? "D-DAY" : "D-" + d.n}</b><span class="dd-label">${esc(d.label)}</span></div>`).join("")
      : `<div class="dday-empty">생일·데뷔일을 등록하면 카운트다운이 떠요 (설정 → 최애 관리)</div>`;

    // 이번 주 스트립
    const wkEl = $("homeWeek");
    if (wkEl) {
      const now = new Date();
      const start = new Date(now); start.setDate(now.getDate() - now.getDay());
      const schedDates = new Set(byBias(S.schedules).map((s) => s.date));
      const names = ["일", "월", "화", "수", "목", "금", "토"];
      let wk = "";
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const key = fmtDate(d);
        wk += `<button class="wk-day ${key === today ? "today" : ""}" data-date="${key}"><span class="wk-name ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${names[i]}</span><span class="wk-num">${d.getDate()}</span><i class="wk-dot ${schedDates.has(key) ? "on" : ""}"></i></button>`;
      }
      wkEl.innerHTML = wk;
      wkEl.querySelectorAll("[data-date]").forEach((btn) => { btn.onclick = () => { selDate = btn.dataset.date; go("calendar"); }; });
    }

    // 최근 기록·포카
    const recEl = $("homeRecent");
    if (recEl) {
      const recs = byBias(S.archives).slice().sort((a, c) => (c.date || "").localeCompare(a.date || "")).slice(0, 6);
      const pocas = byBias(S.photocards).filter((p) => p.img).slice(-6).reverse();
      const items = [];
      recs.forEach((r) => items.push({ img: (r.imgs && r.imgs[0]) || null, label: r.title || "기록", type: "기록", id: r.id, kind: "rec" }));
      pocas.forEach((p) => items.push({ img: p.img, label: p.name || "포카", type: "포카", id: p.id, kind: "poca" }));
      recEl.innerHTML = items.length
        ? items.slice(0, 10).map((it) => `<button class="recent-card ${it.img ? "" : "noimg"}" data-kind="${it.kind}" data-rid="${it.id}" ${it.img ? `style="background-image:url(${it.img})"` : ""}><span class="rc-type">${it.type}</span>${it.img ? "" : `<span class="rc-noimg">${esc(it.label)}</span>`}</button>`).join("")
        : `<div class="recent-empty">${I("sparkles")} 후기·포카를 남기면 여기에 모여요</div>`;
      recEl.querySelectorAll("[data-kind]").forEach((btn) => {
        btn.onclick = () => { if (btn.dataset.kind === "rec") openDiaryView(btn.dataset.rid); else openPocaView(btn.dataset.rid); };
      });
    }

    renderMusic(b);
  }

  /* ───────── 음악 위젯 (유튜브/스포티파이 플레이리스트 임베드) ───────── */
  // 붙여넣은 링크를 임베드 가능한 형태로 해석. 인식 못 하면 null → '바로가기'로 처리.
  function musicEmbed(url) {
    if (!url) return null;
    let u;
    try { u = new URL(url); } catch (e) { return null; }
    const host = u.hostname.replace(/^www\./, "");
    const ok = (s) => s && /^[\w-]+$/.test(s);
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return ok(id) ? { platform: "YouTube", src: `https://www.youtube.com/embed/${encodeURIComponent(id)}` } : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const list = u.searchParams.get("list"), v = u.searchParams.get("v");
      if (u.pathname.startsWith("/playlist") && ok(list)) return { platform: "YouTube", src: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}` };
      if (ok(v) && ok(list)) return { platform: "YouTube", src: `https://www.youtube.com/embed/${encodeURIComponent(v)}?list=${encodeURIComponent(list)}` };
      if (ok(v)) return { platform: "YouTube", src: `https://www.youtube.com/embed/${encodeURIComponent(v)}` };
      if (ok(list)) return { platform: "YouTube", src: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}` };
      return null;
    }
    if (host === "spotify.com" || host === "open.spotify.com") {
      const m = u.pathname.match(/\/(playlist|track|album|artist|episode|show)\/([A-Za-z0-9]+)/);
      if (m) return { platform: "Spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
      return null;
    }
    return null;
  }

  /* ───────── 음원 파일 저장소 (IndexedDB) ─────────
     음원 파일은 용량이 커서 localStorage(평소 저장 데이터)에 넣으면 저장이 느려지고 금방 꽉 찹니다.
     그래서 파일은 IndexedDB에 따로 보관하고, 저장 데이터에는 작은 참조(fileId)만 남깁니다. */
  const AUDIO_DB = "myStarCalendar.audio", AUDIO_STORE = "files";
  function audioDB() {
    return new Promise((res, rej) => {
      const rq = indexedDB.open(AUDIO_DB, 1);
      rq.onupgradeneeded = () => { rq.result.createObjectStore(AUDIO_STORE); };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  function audioPut(id, blob) {
    return audioDB().then((db) => new Promise((res, rej) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      tx.objectStore(AUDIO_STORE).put(blob, id);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    }));
  }
  function audioGet(id) {
    return audioDB().then((db) => new Promise((res, rej) => {
      const tx = db.transaction(AUDIO_STORE, "readonly");
      const rq = tx.objectStore(AUDIO_STORE).get(id);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => rej(rq.error);
    }));
  }
  function audioDel(id) {
    return audioDB().then((db) => new Promise((res) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      tx.objectStore(AUDIO_STORE).delete(id);
      tx.oncomplete = () => res(); tx.onerror = () => res();
    })).catch(() => {});
  }
  const audioUrlCache = {}; // fileId → objectURL (한 번 만든 건 재사용해 재생 끊김 방지)
  const MUSIC_MAX = 3; // 최애당 음악 최대 개수

  /* ───────── 이미지 파일 저장소 (IndexedDB) ─────────
     포카처럼 장수가 많은 사진을 localStorage(평소 저장 데이터)에 base64로 넣으면
     용량이 금방 차고 저장이 느려집니다. 그래서 사진은 IndexedDB에 따로 보관하고,
     평소 저장 데이터(localStorage)에는 작은 참조(imgKey)만 남깁니다.
     화면·백업은 그대로 동작하도록, 메모리(S) 안에는 사진을 그대로 둡니다. */
  const IMG_DB = "myStarCalendar.img", IMG_STORE = "imgs";
  function imgDB() {
    return new Promise((res, rej) => {
      const rq = indexedDB.open(IMG_DB, 1);
      rq.onupgradeneeded = () => { rq.result.createObjectStore(IMG_STORE); };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  function imgPut(id, val) {
    return imgDB().then((db) => new Promise((res, rej) => {
      const tx = db.transaction(IMG_STORE, "readwrite");
      tx.objectStore(IMG_STORE).put(val, id);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    })).catch(() => {});
  }
  function imgGet(id) {
    return imgDB().then((db) => new Promise((res, rej) => {
      const tx = db.transaction(IMG_STORE, "readonly");
      const r = tx.objectStore(IMG_STORE).get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    })).catch(() => null);
  }

  const imgStored = new Set(); // 이번 세션에서 이미 IndexedDB에 쓴 이미지 키 (중복 저장 방지)
  // 아카이브 사진은 추가·삭제·순서변경이 가능해서, 내용으로 키를 만들어 순서가 바뀌어도 어긋나지 않게 함
  function imgKeyOf(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; // djb2
    return s.length + "_" + (h >>> 0).toString(36);
  }
  // 단일 사진 필드(프로필·배경·멤버십·스타일북)용: 내용 기반 키 부여 / localStorage용 사본에서 제거
  function assignImgKey(obj, field, keyField) {
    const v = obj && obj[field];
    if (typeof v === "string" && v.indexOf("data:") === 0) {
      const k = imgKeyOf(v);
      if (!imgStored.has(k)) { imgStored.add(k); imgPut(k, v); }
      obj[keyField] = k;
    }
  }
  function stripImgField(obj, field, keyField) {
    if (obj && obj[keyField] && typeof obj[field] === "string" && obj[field].indexOf("data:") === 0) {
      const q = Object.assign({}, obj);
      delete q[field];
      return q;
    }
    return obj;
  }
  // 새로 들어온 사진(base64)에 키를 부여하고 IndexedDB에 저장 (이미 저장된 건 건너뜀)
  function ensureImgKeys() {
    (S.photocards || []).forEach((p) => {
      if (typeof p.img === "string" && p.img.indexOf("data:") === 0 && !p.imgKey) {
        p.imgKey = uid();
        imgPut(p.imgKey, p.img);
      }
    });
    (S.archives || []).forEach((d) => {
      if (!Array.isArray(d.imgs) || !d.imgs.length) return;
      if (!d.imgs.every((im) => typeof im === "string" && im.indexOf("data:") === 0)) return; // 비정상이면 그대로 둠(안전)
      d.imgKeys = d.imgs.map((im) => {
        const key = imgKeyOf(im);
        if (!imgStored.has(key)) { imgStored.add(key); imgPut(key, im); }
        return key;
      });
    });
    (S.biases || []).forEach((b) => { assignImgKey(b, "photo", "photoKey"); assignImgKey(b, "cover", "coverKey"); });
    (S.styles || []).forEach((s) => { assignImgKey(s, "img", "imgKey"); });
    assignImgKey(S.membership, "photo", "photoKey");
  }
  // localStorage에 저장할 때 쓰는 가벼운 사본: 포카 사진(base64)은 빼고 참조(imgKey)만 남김
  function persistState() {
    const lite = Object.assign({}, S);
    lite.photocards = (S.photocards || []).map((p) => {
      if (p.imgKey && typeof p.img === "string" && p.img.indexOf("data:") === 0) {
        const q = Object.assign({}, p);
        delete q.img; // base64는 IndexedDB에 있으니 localStorage엔 안 넣음
        return q;
      }
      return p;
    });
    lite.archives = (S.archives || []).map((d) => {
      if (Array.isArray(d.imgs) && d.imgs.length && Array.isArray(d.imgKeys) && d.imgKeys.length === d.imgs.length) {
        const q = Object.assign({}, d);
        delete q.imgs; // base64들은 IndexedDB에, localStorage엔 imgKeys만
        return q;
      }
      return d;
    });
    lite.biases = (S.biases || []).map((b) => stripImgField(stripImgField(b, "photo", "photoKey"), "cover", "coverKey"));
    lite.styles = (S.styles || []).map((s) => stripImgField(s, "img", "imgKey"));
    if (S.membership) lite.membership = stripImgField(S.membership, "photo", "photoKey");
    return lite;
  }
  // 시작할 때 IndexedDB에 있는 포카 사진을 메모리(S)로 다시 채워 넣음
  function hydrateImages() {
    const tasks = [];
    (S.photocards || []).forEach((p) => {
      if (!p.img && p.imgKey) tasks.push(imgGet(p.imgKey).then((v) => { if (v) p.img = v; }));
    });
    (S.archives || []).forEach((d) => {
      if ((!Array.isArray(d.imgs) || !d.imgs.length) && Array.isArray(d.imgKeys) && d.imgKeys.length) {
        tasks.push(Promise.all(d.imgKeys.map((k) => { imgStored.add(k); return imgGet(k); }))
          .then((vals) => { d.imgs = vals.filter((v) => v != null); }));
      }
    });
    (S.biases || []).forEach((b) => {
      if (!b.photo && b.photoKey) tasks.push(imgGet(b.photoKey).then((v) => { if (v) b.photo = v; }));
      if (!b.cover && b.coverKey) tasks.push(imgGet(b.coverKey).then((v) => { if (v) b.cover = v; }));
    });
    (S.styles || []).forEach((s) => {
      if (!s.img && s.imgKey) tasks.push(imgGet(s.imgKey).then((v) => { if (v) s.img = v; }));
    });
    if (S.membership && !S.membership.photo && S.membership.photoKey) {
      tasks.push(imgGet(S.membership.photoKey).then((v) => { if (v) S.membership.photo = v; }));
    }
    if (tasks.length) Promise.all(tasks).then(renderAll);
  }

  /* 최애의 음악 목록 헬퍼 (구버전 b.music 문자열은 목록으로 자동 변환) */
  function curMusics(b) {
    if (!b) return [];
    if (!Array.isArray(b.musics)) {
      b.musics = b.music ? [{ id: uid(), name: "", type: "link", url: b.music }] : [];
      if (b.musics.length && !b.musicCur) b.musicCur = b.musics[0].id;
      delete b.music;
    }
    return b.musics;
  }
  function curMusicEntry(b) {
    const list = curMusics(b);
    if (!list.length) return null;
    return list.find((x) => x.id === b.musicCur) || list[0];
  }
  function musicLabel(e, list) {
    if (e.name) return e.name;
    if (e.type === "file") return "음원";
    const em = musicEmbed(e.url);
    const plat = em ? em.platform : "링크";
    const links = list.filter((x) => x.type !== "file");
    return links.length > 1 ? plat + " " + (links.indexOf(e) + 1) : plat;
  }

  function renderMusic(b) {
    const box = $("homeMusic");
    if (!box) return;
    const list = curMusics(b);
    const entry = curMusicEntry(b);
    const curKey = entry ? entry.id : "";
    const sig = list.map((e) => e.id).join(",");
    // 같은 곡이 이미 떠 있고 목록도 그대로면 다시 그리지 않음 — 화면 전환·홈 갱신 때마다
    // 플레이어(iframe·audio)를 새로 만들면 재생이 끊기기 때문. 곡 변경·추가·삭제 때만 새로 만든다.
    if (entry && box.dataset.curKey === curKey && box.dataset.sig === sig && box.querySelector(".music-player")) return;

    box.innerHTML = "";
    const player = document.createElement("div");
    player.className = "music-player";
    buildPlayer(player, entry);
    box.appendChild(player);

    // 음악이 하나도 없을 때: 기존처럼 가로로 꽉 찬 '+ 음악 추가' 버튼만 보여준다
    if (!entry) {
      const add = document.createElement("button");
      add.className = "btn btn-ghost btn-sm"; // 배포본과 동일: 카드 폭에 꽉 차고 글자는 가운데 정렬, 낮은 높이
      add.textContent = "+ 음악 추가";
      add.onclick = openMusicModal;
      box.appendChild(add);
      box.dataset.curKey = "";
      box.dataset.sig = sig;
      return;
    }

    // 칩(곡 전환)과 버튼을 한 줄에: 왼쪽에 칩(곡 1개면 플랫폼 라벨), 오른쪽에 추가·빼기 버튼
    const ctrl = document.createElement("div");
    ctrl.className = "music-bar";
    if (list.length > 1) {
      const chips = document.createElement("div");
      chips.className = "music-chips";
      list.forEach((e) => {
        const c = document.createElement("button");
        c.className = "music-chip" + (e.id === curKey ? " on" : "");
        c.textContent = musicLabel(e, list);
        c.title = c.textContent;
        c.onclick = () => { b.musicCur = e.id; save(); renderMusic(b); };
        chips.appendChild(c);
      });
      ctrl.appendChild(chips);
    } else if (entry) {
      let plat = "음원";
      if (entry.type !== "file") { const pem = musicEmbed(entry.url); plat = pem ? pem.platform : "링크"; }
      const lab = document.createElement("span");
      lab.className = "music-plat";
      lab.textContent = plat;
      ctrl.appendChild(lab);
    }
    const actions = document.createElement("div");
    actions.className = "music-actions";
    actions.innerHTML = `<button class="btn btn-ghost btn-sm" data-mus="add">+ 음악 추가</button>`
      + (entry ? `<button class="btn btn-ghost btn-sm" data-mus="remove">빼기</button>` : "");
    ctrl.appendChild(actions);
    box.appendChild(ctrl);
    actions.querySelectorAll("[data-mus]").forEach((bt) => {
      bt.onclick = () => {
        if (bt.dataset.mus === "add") {
          if (curMusics(b).length >= MUSIC_MAX) return toast("음악 추가는 최대 " + MUSIC_MAX + "개까지 가능해요");
          openMusicModal();
        } else removeMusic(curKey);
      };
    });

    box.dataset.curKey = curKey;
    box.dataset.sig = sig;
  }

  function buildPlayer(player, entry) {
    if (!entry) {
      player.innerHTML = `<div class="music-empty">${I("sparkles")} 최애 플레이리스트를 추가해 들으면서 기록해요</div>`;
      return;
    }
    if (entry.type === "file") {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.className = "music-audio";
      player.appendChild(audio);
      const cached = audioUrlCache[entry.fileId];
      if (cached) { audio.src = cached; return; }
      audioGet(entry.fileId).then((blob) => {
        if (!blob) { player.innerHTML = `<div class="music-empty">${I("sparkles")} 음원 파일을 찾을 수 없어요. 다시 추가해 주세요</div>`; return; }
        const u = URL.createObjectURL(blob);
        audioUrlCache[entry.fileId] = u;
        audio.src = u;
      }).catch(() => {});
      return;
    }
    const em = musicEmbed(entry.url);
    if (em && em.platform === "Spotify") {
      player.innerHTML = `<iframe class="music-spotify" src="${em.src}" width="100%" height="152" frameborder="0" loading="lazy" allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture"></iframe>`;
    } else if (em) {
      player.innerHTML = `<div class="music-embed"><iframe src="${em.src}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
    } else {
      player.innerHTML = `<a class="btn btn-dark btn-sm" href="${esc(safeUrl(entry.url))}" target="_blank" rel="noopener">음악 바로가기 ${I("arrowUR")}</a>`;
    }
  }

  function openMusicModal() {
    const b = curBias();
    if (!b) return toast("먼저 최애를 등록해 주세요!");
    if (curMusics(b).length >= MUSIC_MAX) return toast("음악 추가는 최대 " + MUSIC_MAX + "개까지 가능해요");
    let picked = null; // 선택한 음원 파일
    openModalRaw("음악 추가", `
      <p class="fp-desc">유튜브·스포티파이 링크를 붙여넣거나, 기기에 받은 음원 파일을 추가할 수 있어요. 링크는 재생할 때 인터넷이 필요해요.</p>
      <div class="field"><label>이름 (선택 · 최대 6자)</label><input type="text" id="musicName" maxlength="6" placeholder="예: 출근길 플리"></div>
      <div class="field"><label>링크</label><input type="url" id="musicInput" placeholder="https://open.spotify.com/playlist/… 또는 https://youtube.com/…"></div>
      <div class="field"><label>또는 기기에서 음원 파일</label>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer">음원 파일 선택<input type="file" accept="audio/*" id="musicFile" hidden></label>
        <span id="musicFileName" class="music-plat" style="margin-left:8px"></span>
      </div>
      <button class="btn btn-primary btn-lg" id="musicSave">추가</button>
    `);
    $("musicFile").onchange = (e) => {
      picked = (e.target.files && e.target.files[0]) || null;
      $("musicFileName").textContent = picked ? picked.name : "";
    };
    $("musicSave").onclick = () => {
      const bb = curBias();
      const list = curMusics(bb);
      const name = $("musicName").value.trim().slice(0, 6); // 띄어쓰기 포함 최대 6자
      if (picked) {
        const isAudio = /^audio\//.test(picked.type || "")
          || /\.(mp3|m4a|aac|wav|flac|ogg|oga|opus|weba|wma|aif|aiff|alac)$/i.test(picked.name || "");
        if (!isAudio) return toast("오디오 파일만 추가할 수 있어요");
        const fileId = uid();
        toast("음원을 저장하는 중…");
        audioPut(fileId, picked).then(() => {
          const id = uid();
          list.push({ id: id, name: name || picked.name.replace(/\.[^.]+$/, ""), type: "file", fileId: fileId, mime: picked.type });
          bb.musicCur = id; save(); closeModal(); renderHome();
          toast("음원을 추가했어요 ♪");
        }).catch(() => toast("음원 저장에 실패했어요. 파일이 너무 크지 않은지 확인해 주세요"));
        return;
      }
      let url = $("musicInput").value.trim();
      if (!url) return toast("링크를 붙여넣거나 음원 파일을 선택해 주세요!");
      if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url;
      try { new URL(url); } catch (e) { return toast("올바른 링크가 아니에요 (https://… 형식)"); }
      const id = uid();
      list.push({ id: id, name: name, type: "link", url: url });
      bb.musicCur = id; save(); closeModal(); renderHome();
      toast(musicEmbed(url) ? "음악을 추가했어요 ♪" : "링크를 저장했어요 (임베드 미지원 — 바로가기로 열려요)");
    };
  }

  function removeMusic(id) {
    const b = curBias();
    if (!b) return;
    const list = curMusics(b);
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) return;
    const e = list[i];
    if (e.type === "file" && e.fileId) {
      audioDel(e.fileId);
      if (audioUrlCache[e.fileId]) { try { URL.revokeObjectURL(audioUrlCache[e.fileId]); } catch (_) {} delete audioUrlCache[e.fileId]; }
    }
    list.splice(i, 1);
    if (b.musicCur === id) b.musicCur = list.length ? list[0].id : null;
    save();
    renderHome();
    toast("음악을 뺐어요");
  }

  /* ───────── 홈 편집 (위젯처럼 자유 배치 · 빼기/되살리기 · 드래그 이동) ───────── */
  const HOME_BLOCKS = [
    ["cheer", "응원·요약"], ["week", "이번 주"], ["today", "TODAY"], ["ticket", "시계"],
    ["music", "음악"], ["dday", "D-DAY"], ["spend", "이번 달 비용"], ["upcoming", "다가오는 일정"],
    ["membership", "나만의 멤버십"], ["recent", "최근 기록"],
  ];
  const HOME_LABEL = Object.fromEntries(HOME_BLOCKS);
  const HOME_DEFAULT = HOME_BLOCKS.map(([id]) => id);
  let editHome = false;

  function homeOrder() {
    let o = (Array.isArray(S.homeOrder) ? S.homeOrder : []).filter((id) => HOME_DEFAULT.includes(id));
    HOME_DEFAULT.forEach((id) => { if (!o.includes(id)) o.push(id); });
    return o;
  }
  function homeHiddenSet() { return new Set(Array.isArray(S.homeHidden) ? S.homeHidden : []); }

  // 저장된 순서·표시 상태를 실제 DOM에 반영
  function applyHomeLayout() {
    const wrap = $("homeBlocks");
    if (!wrap) return;
    // 블록을 appendChild로 옮기면 그 안의 iframe(음악)이 리로드돼 노래가 끊긴다.
    // 그래서 현재 DOM 순서가 원하는 순서와 다를 때만 재배치한다.
    const order = homeOrder();
    const current = Array.from(wrap.querySelectorAll(".home-block")).map((el) => el.dataset.block);
    const desired = order.filter((id) => current.includes(id));
    const sameOrder = desired.length === current.length && desired.every((id, i) => id === current[i]);
    if (!sameOrder) {
      order.forEach((id) => {
        const el = wrap.querySelector('.home-block[data-block="' + id + '"]');
        if (el) wrap.appendChild(el);
      });
    }
    const hidden = homeHiddenSet();
    wrap.querySelectorAll(".home-block").forEach((el) => {
      el.classList.toggle("hidden", hidden.has(el.dataset.block));
      // 1단/2단(전체폭/반폭) 적용
      const span = homeSpan(el.dataset.block);
      el.classList.toggle("hb-full", span === "full");
      el.classList.toggle("hb-half", span === "half");
    });
  }

  /* 블록별 1단(전체폭)/2단(반폭) 너비 — 사용자가 홈 편집에서 직접 지정 */
  const HOME_SPAN_DEFAULT = {
    cheer: "full", week: "full", today: "full", recent: "full",
    ticket: "half", music: "half", dday: "half", spend: "half", upcoming: "half", membership: "half",
  };
  function homeSpan(id) {
    const s = S.homeSpan && S.homeSpan[id];
    return s === "full" || s === "half" ? s : (HOME_SPAN_DEFAULT[id] || "half");
  }
  function setHomeSpan(id, span) {
    if (!S.homeSpan || typeof S.homeSpan !== "object") S.homeSpan = {};
    S.homeSpan[id] = span;
    save();
    applyHomeLayout();
  }

  function toggleEditHome() {
    editHome = !editHome;
    const home = $("page-home");
    if (home) home.classList.toggle("home-editing", editHome);
    const btn = $("homeEditBtn");
    if (btn) btn.innerHTML = editHome ? I("check") + " 완료" : I("grid") + " 홈 편집";
    if (editHome) buildHomeEdit(); else clearHomeEdit();
    applyHomeLayout();
    if (!editHome) { save(); toast("홈 배치를 저장했어요"); }
  }

  // 편집용 손잡이(⠿)·빼기(✕) 배지 + 숨긴 블록 트레이
  function buildHomeEdit() {
    const wrap = $("homeBlocks");
    if (!wrap) return;
    clearHomeEdit();
    wrap.querySelectorAll(".home-block").forEach((el) => {
      const grip = document.createElement("span");
      grip.className = "hb-grip"; grip.title = "끌어서 이동"; grip.innerHTML = I("grip");
      grip.addEventListener("pointerdown", (e) => startBlockDrag(e, grip, el, wrap));
      const x = document.createElement("button");
      x.className = "hb-x"; x.title = "홈에서 빼기"; x.setAttribute("aria-label", "홈에서 빼기"); x.innerHTML = I("x");
      x.addEventListener("pointerdown", (e) => e.stopPropagation());
      x.addEventListener("click", (e) => { e.stopPropagation(); hideBlock(el.dataset.block); });
      // 1단/2단 너비 토글 (현재 상태를 글자로 표시하는 부드러운 칩)
      const sp = document.createElement("button");
      sp.className = "hb-span";
      const setLbl = () => {
        const full = homeSpan(el.dataset.block) === "full";
        sp.textContent = full ? "1단" : "2단";
        sp.classList.toggle("on", !full);
        sp.title = full ? "지금 1단(전체폭) — 눌러서 2단(반폭)으로" : "지금 2단(반폭) — 눌러서 1단(전체폭)으로";
        sp.setAttribute("aria-label", sp.title);
      };
      setLbl();
      sp.addEventListener("pointerdown", (e) => e.stopPropagation());
      sp.addEventListener("click", (e) => {
        e.stopPropagation();
        setHomeSpan(el.dataset.block, homeSpan(el.dataset.block) === "full" ? "half" : "full");
        setLbl();
      });
      el.appendChild(grip);
      el.appendChild(x);
      el.appendChild(sp);
    });
    renderEditTray();
  }
  function clearHomeEdit() {
    const wrap = $("homeBlocks");
    if (wrap) wrap.querySelectorAll(".hb-grip, .hb-x, .hb-span").forEach((b) => b.remove());
    const tray = $("homeAddTray");
    if (tray) tray.remove();
  }
  function commitHomeOrder(wrap) {
    S.homeOrder = [...wrap.querySelectorAll(".home-block")].map((el) => el.dataset.block);
    save();
  }
  function hideBlock(id) {
    const set = homeHiddenSet(); set.add(id); S.homeHidden = [...set];
    const wrap = $("homeBlocks");
    if (wrap) commitHomeOrder(wrap); else save();
    applyHomeLayout(); renderEditTray(); buzz(10);
  }
  function showBlock(id) {
    const set = homeHiddenSet(); set.delete(id); S.homeHidden = [...set];
    const wrap = $("homeBlocks");
    const el = wrap && wrap.querySelector('.home-block[data-block="' + id + '"]');
    if (el && wrap) wrap.appendChild(el); // 되살리면 맨 아래로
    if (wrap) commitHomeOrder(wrap); else save();
    applyHomeLayout(); renderEditTray(); buzz(10);
  }
  function renderEditTray() {
    const wrap = $("homeBlocks");
    if (!wrap) return;
    let tray = $("homeAddTray");
    if (!tray) { tray = document.createElement("div"); tray.id = "homeAddTray"; tray.className = "home-add-tray"; wrap.after(tray); }
    const hidden = homeOrder().filter((id) => homeHiddenSet().has(id));
    tray.innerHTML = hidden.length
      ? '<p class="hat-title">숨긴 블록 — 탭하면 다시 추가</p><div class="hat-chips">' +
        hidden.map((id) => '<button class="hat-chip" data-add="' + id + '">+ ' + (HOME_LABEL[id] || id) + "</button>").join("") + "</div>"
      : '<p class="hat-empty">모든 블록이 표시 중이에요. 블록의 ✕로 빼면 여기에 모여요.</p>';
    tray.querySelectorAll("[data-add]").forEach((b) => { b.onclick = () => showBlock(b.dataset.add); });
  }

  // 위젯 보드와 동일한 포인터 드래그 — 캡처·리스너를 손잡이에 함께 걸어 어긋남 방지 + 가장자리 자동 스크롤
  function startBlockDrag(e, grip, block, wrap) {
    if (!editHome) return;
    e.preventDefault();
    const rect = block.getBoundingClientRect();
    const offX = e.clientX - rect.left, offY = e.clientY - rect.top;
    try { grip.setPointerCapture(e.pointerId); } catch (_) {}
    block.classList.add("hb-dragging");
    Object.assign(block.style, {
      width: rect.width + "px", height: rect.height + "px",
      position: "fixed", left: rect.left + "px", top: rect.top + "px", zIndex: "210", margin: "0",
    });
    const ph = document.createElement("div");
    ph.className = "hb-ph"; ph.style.height = rect.height + "px";
    if (block.classList.contains("hb-full")) ph.classList.add("hb-full"); // 전체폭 블록 자리표시자도 전체폭
    block.after(ph);
    const scroller = document.querySelector(".main");
    let lastX = e.clientX, lastY = e.clientY;
    const reflow = () => {
      const cx = Math.min(window.innerWidth - 2, Math.max(2, lastX));
      const cy = Math.min(window.innerHeight - 2, Math.max(2, lastY));
      block.style.visibility = "hidden";
      const under = document.elementFromPoint(cx, cy);
      block.style.visibility = "";
      const over = under && under.closest(".home-block");
      if (over && over !== block && over.parentNode === wrap) {
        const r = over.getBoundingClientRect();
        wrap.insertBefore(ph, lastY < r.top + r.height / 2 ? over : over.nextSibling);
      }
    };
    const timer = setInterval(() => {
      const vh = window.innerHeight, d = lastY < vh * 0.16 ? -14 : lastY > vh * 0.84 ? 14 : 0;
      if (d) { window.scrollBy(0, d); if (scroller) scroller.scrollTop += d; reflow(); }
    }, 16);
    const move = (ev) => {
      lastX = ev.clientX; lastY = ev.clientY;
      block.style.left = (ev.clientX - offX) + "px";
      block.style.top = (ev.clientY - offY) + "px";
      reflow();
    };
    const up = () => {
      clearInterval(timer);
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", up);
      grip.removeEventListener("pointercancel", up);
      try { grip.releasePointerCapture(e.pointerId); } catch (_) {}
      ph.replaceWith(block);
      block.classList.remove("hb-dragging");
      ["width", "height", "position", "left", "top", "zIndex", "margin", "visibility"].forEach((p) => { block.style[p] = ""; });
      commitHomeOrder(wrap); buzz(10);
    };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
    grip.addEventListener("pointercancel", up);
    move(e);
  }

  function isAnnivToday(dateStr) {
    const d = new Date(dateStr), n = new Date();
    return d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  function renderMemberCard() {
    const m = S.membership;
    const card = $("memberCard");
    if (card) {
      card.className = "member-card mc-style-" + (m.style || "gradient") + (m.photo ? " has-photo" : "");
      card.style.backgroundImage = m.photo ? `linear-gradient(135deg, rgba(0,0,0,.55), rgba(0,0,0,.2)), url(${m.photo})` : "";
      card.style.backgroundSize = m.photo ? "cover" : "";
      card.style.backgroundPosition = m.photo ? "center" : "";
    }
    $("mcTitle").textContent = m.title || "MY STAR PASS";
    $("mcName").textContent = m.name || "MY NAME";
    $("mcIcon").textContent = m.icon || "✦";
    const exp = m.expiry ? Math.round((new Date(m.expiry) - new Date(todayKey())) / 86400000) : null;
    $("mcNo").textContent = exp !== null
      ? (exp < 0 ? "EXPIRED" : `EXP D-${exp}`) + " · NO. " + (m.no || "0001")
      : "NO. " + (m.no || "0001");
    const mw2 = document.querySelector(".membership-wrap .hint");
    if (mw2) mw2.textContent = exp !== null && exp >= 0 && exp <= 30
      ? `멤버십 만료까지 ${exp}일! 갱신 잊지 마세요`
      : "카드를 누르면 수정할 수 있어요";
    const b = curBias();
    $("mcSince").textContent = "SINCE " + (b && b.startDate ? b.startDate.slice(0, 4) : "—");
  }

  /* ═══ 프로필 상세 페이지 ═══ */
  function renderProfile() {
    const b = curBias();
    if (!b || !$("profName")) return;
    const dd = dPlus(b.startDate);
    const ddText = dd ? `D+${dd}` : "D-DAY";
    $("profName").textContent = b.name;
    $("profGroup").textContent = b.group || "MY BIAS";
    $("profBadges").innerHTML = buildBadges(b, ddText);
    $("profAvatar").style.backgroundImage = b.photo ? `url(${b.photo})` : "";
    $("profCover").style.backgroundImage = b.cover ? `url(${b.cover})` : "";
    applyCoverFitTo($("profCover"), coverFit(b, "prof"));
    const dDayTo = (ds) => {
      if (!ds) return "";
      const t0 = new Date(todayKey()), d = new Date(ds);
      d.setFullYear(t0.getFullYear());
      if (d < t0) d.setFullYear(t0.getFullYear() + 1);
      const n = Math.round((d - t0) / 86400000);
      return n === 0 ? "D-DAY" : "D-" + n;
    };
    const rows = [["덕질 시작일", b.startDate || "—", ""], ["생일", b.birthday || "—", dDayTo(b.birthday)], ["데뷔일", b.debutDate || "—", dDayTo(b.debutDate)]];
    (b.annivs || []).forEach((a) => rows.push([esc(a.title), a.date, dDayTo(a.date), a.id]));
    $("annivList").innerHTML = rows.map(([k, v, dd, aid]) => `<li><span>${k}${dd ? ` <em class="al-dd">${dd}</em>` : ""}</span><span class="al-v">${v}${aid ? ` <button class="dl-del" data-anniv="${aid}">${I("x")}</button>` : ""}</span></li>`).join("")
      + `<li class="al-add"><button class="chip-btn" onclick="App.openModal('anniv')">+ 기념일 추가</button></li>`;
    $("annivList").querySelectorAll("[data-anniv]").forEach((bn) => {
      bn.onclick = () => {
        b.annivs = (b.annivs || []).filter((a) => a.id !== bn.dataset.anniv);
        save(); renderProfile(); renderHome(); toast("기념일을 지웠어요");
      };
    });
    renderDeco();
  }

  function editCurrentBias() {
    openModal("bias", S.currentBias);
  }

  /* ═══ 배경 사진 위치 조정 (드래그 패닝) ═══ */
  let posMode = false;
  let coverRatio = null;

  let posTarget = "prof";
  const posRefs = () => posTarget === "home"
    ? { wrap: $("homeCover"), cover: $("homeCoverBg"), btn: $("homePosBtn"), zoom: $("zoomHome") }
    : { wrap: $("heroWrap"), cover: $("profCover"), btn: $("posBtn"), zoom: $("zoomProf") };

  /* 커버 조정값은 화면별로 따로 저장 (홈은 템플릿별, 프로필 상세는 별도) */
  const fitKey = (target) => target === "home" ? "home:" + (S.template || "profile") : "prof";
  function coverFit(b, target) {
    if (!b.coverFit) b.coverFit = {};
    const k = fitKey(target);
    if (!b.coverFit[k]) {
      // 구버전 공용 값으로 시드
      b.coverFit[k] = {
        pos: { x: (b.coverPos && b.coverPos.x) ?? 50, y: (b.coverPos && b.coverPos.y) ?? 50 },
        zoom: b.coverZoom || 100,
        shift: { x: (b.coverShift && b.coverShift.x) || 0, y: (b.coverShift && b.coverShift.y) || 0 },
      };
    }
    return b.coverFit[k];
  }
  function applyCoverFitTo(el, fit) {
    if (!el) return;
    el.style.backgroundPosition = `${fit.pos.x}% ${fit.pos.y}%`;
    const z = (fit.zoom || 100) / 100;
    el.style.transform = z !== 1
      ? `translate(${(fit.shift.x * 100).toFixed(2)}%, ${(fit.shift.y * 100).toFixed(2)}%) scale(${z})`
      : "";
  }
  function applyAllCoverFits(b) {
    if (!b) return;
    applyCoverFitTo($("homeCoverBg"), coverFit(b, "home"));
    applyCoverFitTo($("profCover"), coverFit(b, "prof"));
  }
  function clampShift(fit) {
    const z = (fit.zoom || 100) / 100;
    const lim = Math.max(0, (z - 1) / 2);
    fit.shift.x = Math.min(lim, Math.max(-lim, fit.shift.x));
    fit.shift.y = Math.min(lim, Math.max(-lim, fit.shift.y));
  }
  function setCoverZoom(v) {
    const b = curBias();
    if (!b) return;
    const fit = coverFit(b, posTarget);
    fit.zoom = Math.min(300, Math.max(100, Math.round(v)));
    clampShift(fit);
    applyAllCoverFits(b);
  }

  function cardGo() { if (!posMode) go("profile"); }

  function toggleCoverPos(target) {
    if (!posMode) {
      posTarget = target || "prof";
      const { wrap, btn } = posRefs();
      const b = curBias();
      if (!b || !b.cover) return toast("먼저 배경 사진을 등록해 주세요!");
      if (decoMode) toggleDeco();
      posMode = true;
      coverFit(b, posTarget); // fit 시드 보장
      coverRatio = null;
      const im = new Image();
      im.onload = () => { coverRatio = im.width / im.height; };
      im.src = b.cover;
      wrap.classList.add("pos-on");
      btn.innerHTML = I("check");
      btn.title = "위치 저장";
      const { zoom } = posRefs();
      if (zoom) {
        zoom.classList.remove("hidden");
        zoom.onpointerdown = (e) => e.stopPropagation();
        zoom.querySelectorAll("button").forEach((zb) => {
          zb.onclick = (e) => {
            e.stopPropagation();
            const cur = (curBias() && curBias().coverZoom) || 100;
            setCoverZoom(cur + (zb.dataset.z === "+" ? 10 : -10));
          };
        });
      }
      toast("드래그로 위치, ＋−·휠로 확대/축소!");
    } else {
      const { wrap, btn, zoom } = posRefs();
      posMode = false;
      wrap.classList.remove("pos-on");
      btn.innerHTML = I("move");
      btn.title = "배경 위치 조정";
      if (zoom) zoom.classList.add("hidden");
      save(); renderAll();
      toast("배경 위치를 저장했어요");
    }
  }

  function coverDragStart(e) {
    if (!posMode) return;
    if (e.target.closest && (e.target.closest(".zoom-btns") || e.target.closest(".cover-pos-btn") || e.target.closest(".hero-pos-btn") || e.target.closest(".hero-deco-btn"))) return;
    const b = curBias();
    if (!b || !b.cover) return;
    e.preventDefault();
    const refs = posRefs();
    const rect = refs.wrap.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const fit = coverFit(b, posTarget);
    const sp = { ...fit.pos };
    const z = (fit.zoom || 100) / 100;
    if (z > 1.001) {
      // 줌 상태: 드래그 = 이동(팬)
      const ss = { ...fit.shift };
      const lim = (z - 1) / 2;
      const onMoveZ = (ev) => {
        fit.shift.x = Math.min(lim, Math.max(-lim, ss.x + (ev.clientX - startX) / rect.width));
        fit.shift.y = Math.min(lim, Math.max(-lim, ss.y + (ev.clientY - startY) / rect.height));
        applyCoverFitTo(refs.cover, fit);
      };
      const onUpZ = () => {
        window.removeEventListener("pointermove", onMoveZ);
        window.removeEventListener("pointerup", onUpZ);
        save();
      };
      window.addEventListener("pointermove", onMoveZ);
      window.addEventListener("pointerup", onUpZ);
      return;
    }
    const boxRatio = rect.width / rect.height;
    const onMove = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      let nx = sp.x, ny = sp.y;
      if (coverRatio) {
        if (coverRatio > boxRatio) {
          const ow = rect.height * coverRatio - rect.width;
          if (ow > 1) nx = sp.x - (dx * 100) / ow;
        } else {
          const oh = rect.width / coverRatio - rect.height;
          if (oh > 1) ny = sp.y - (dy * 100) / oh;
        }
      } else {
        nx = sp.x - dx * 0.25;
        ny = sp.y - dy * 0.25;
      }
      fit.pos.x = Math.min(100, Math.max(0, +nx.toFixed(1)));
      fit.pos.y = Math.min(100, Math.max(0, +ny.toFixed(1)));
      applyCoverFitTo(refs.cover, fit);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      save();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* ═══ 배경 사진 꾸미기 (스티커 데코) ═══ */
  let decoMode = false;

  // 기념일까지 남은 일수 (매년 돌아오는 날짜 기준 D-)
  function ddayCountTo(ds) {
    const today = new Date(todayKey());
    const d = new Date(ds); d.setFullYear(today.getFullYear());
    if (d < today) d.setFullYear(today.getFullYear() + 1);
    return Math.round((d - today) / 86400000);
  }
  // 데코용 기념일 D-day 문구 (라이브로 계산)
  function decoDdayText(b, key) {
    if (!b) return "";
    if (key === "start") { const n = dPlus(b.startDate); return `덕질 D+${n != null ? n : 0}`; }
    if (key === "birthday" && b.birthday) { const n = ddayCountTo(b.birthday); return `생일 ${n === 0 ? "D-DAY" : "D-" + n}`; }
    if (key === "debut" && b.debutDate) { const n = ddayCountTo(b.debutDate); return `데뷔 ${n === 0 ? "D-DAY" : "D-" + n}`; }
    const a = (b.annivs || []).find((x) => x.id === key);
    if (a) { const n = ddayCountTo(a.date); return `${a.title} ${n === 0 ? "D-DAY" : "D-" + n}`; }
    return "";
  }

  function renderDeco() {
    const layer = $("heroDeco");
    if (!layer) return;
    const b = curBias();
    const deco = (b && b.deco) || [];
    layer.innerHTML = deco.map((d, i) => {
      if (d.t === "dday") {
        const txt = decoDdayText(b, d.key);
        if (!txt) return ""; // 원본 기념일이 사라졌으면 표시 안 함
        return `<span class="hero-deco-text dt-${d.c || "w"} dt-${d.sz || "m"}" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${esc(txt)}</span>`;
      }
      if (d.t === "text") {
        return `<span class="hero-deco-text dt-${d.c || "w"} dt-${d.sz || "m"}" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${esc(d.s)}</span>`;
      }
      if (d.icon) { // 앱 라인아이콘 스티커
        return `<span class="hero-sticker hero-icon-sticker" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${I(d.icon)}</span>`;
      }
      return `<span class="hero-sticker" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${d.s}</span>`;
    }).join("");
    layer.querySelectorAll(".hero-sticker, .hero-deco-text").forEach((el) => {
      el.onpointerdown = (e) => decoDrag(e, +el.dataset.i, el);
    });
  }

  function decoDrag(e, i, el) {
    if (!decoMode) return;
    e.preventDefault();
    const b = curBias();
    if (!b || !b.deco || !b.deco[i]) return;
    const wrap = $("heroWrap").getBoundingClientRect();
    let moved = false;
    el.setPointerCapture(e.pointerId);
    el.onpointermove = (ev) => {
      moved = true;
      const x = Math.min(97, Math.max(3, ((ev.clientX - wrap.left) / wrap.width) * 100));
      const y = Math.min(95, Math.max(4, ((ev.clientY - wrap.top) / wrap.height) * 100));
      b.deco[i].x = +x.toFixed(1);
      b.deco[i].y = +y.toFixed(1);
      el.style.left = b.deco[i].x + "%";
      el.style.top = b.deco[i].y + "%";
    };
    el.onpointerup = () => {
      el.onpointermove = null;
      el.onpointerup = null;
      if (!moved) {
        // 텍스트·기념일은 탭하면 편집, 스티커는 탭하면 떼기
        if (b.deco[i] && b.deco[i].t === "text") { addDecoText(i); return; }
        if (b.deco[i] && b.deco[i].t === "dday") { addDecoDday(i); return; }
        b.deco.splice(i, 1);
        renderDeco();
        toast("스티커를 뗐어요");
      }
      save();
    };
  }

  // 데코 색상 선택 줄 (텍스트·기념일 공용)
  function decoColorRowHTML() {
    return `<div class="dt-color-row" id="dtColors">${DECO_COLORS.map(([k]) => `<button class="dt-c dt-cc-${k}" data-c="${k}" aria-label="${k}"></button>`).join("")}</div>`;
  }

  // 배경 위 텍스트(문구) 올리기·편집 — 카카오톡 프로필식 자유 배치
  function addDecoText(editIndex) {
    const b = curBias();
    if (!b) return;
    const editing = typeof editIndex === "number";
    const cur = editing ? b.deco[editIndex] : null;
    const startYear = b.startDate ? b.startDate.slice(0, 4) : String(new Date().getFullYear());
    const nm = b.name || "내 최애";
    const fills = [`${nm} ♥`, `since ${startYear}`, "♥", "내 최애 ♥", "D-DAY ♡"];
    openModalRaw(editing ? "텍스트 편집" : "텍스트 올리기", `
      <div class="field"><input type="text" id="dtText" placeholder="예) ${esc(nm)} ♥ · since ${startYear}" maxlength="40" value="${editing ? esc(cur.s) : ""}"></div>
      <div class="dt-chips" id="dtChips">${fills.map((f) => `<button data-fill="${esc(f)}">${esc(f)}</button>`).join("")}</div>
      <p class="dt-label">색상</p>
      ${decoColorRowHTML()}
      <p class="dt-label">크기</p>
      <div class="dt-opts" id="dtSizes">
        <button data-sz="s">작게</button><button data-sz="m">보통</button><button data-sz="l">크게</button>
      </div>
      <button class="btn btn-primary btn-lg" id="dtSave">${editing ? "저장" : "올리기"}</button>
      ${editing ? '<button class="btn btn-ghost btn-lg slim" id="dtDel">텍스트 떼기</button>' : ""}
    `);
    let c = editing ? (cur.c || "w") : "w";
    let sz = editing ? (cur.sz || "m") : "m";
    const sync = () => {
      $("dtColors").querySelectorAll("[data-c]").forEach((x) => x.classList.toggle("on", x.dataset.c === c));
      $("dtSizes").querySelectorAll("[data-sz]").forEach((x) => x.classList.toggle("on", x.dataset.sz === sz));
    };
    sync();
    $("dtChips").querySelectorAll("[data-fill]").forEach((x) => { x.onclick = () => { $("dtText").value = x.dataset.fill; $("dtText").focus(); }; });
    $("dtColors").querySelectorAll("[data-c]").forEach((x) => { x.onclick = () => { c = x.dataset.c; sync(); }; });
    $("dtSizes").querySelectorAll("[data-sz]").forEach((x) => { x.onclick = () => { sz = x.dataset.sz; sync(); }; });
    $("dtSave").onclick = () => {
      const s = $("dtText").value.trim();
      if (!s) return toast("문구를 입력해 주세요");
      if (!b.deco) b.deco = [];
      if (editing) { b.deco[editIndex].s = s; b.deco[editIndex].c = c; b.deco[editIndex].sz = sz; }
      else {
        if (b.deco.length >= 20) return toast("꾸미기는 최대 20개까지!");
        b.deco.push({ t: "text", s, c, sz, x: 50, y: 50 });
      }
      save(); renderDeco(); closeModal();
    };
    if (editing) $("dtDel").onclick = () => { b.deco.splice(editIndex, 1); save(); renderDeco(); closeModal(); toast("텍스트를 뗐어요"); };
  }

  // 등록한 기념일을 D-day 카운트로 배경에 올리기·편집 (라이브 갱신)
  function addDecoDday(editIndex) {
    const b = curBias();
    if (!b) return;
    const editing = typeof editIndex === "number";
    const cur = editing ? b.deco[editIndex] : null;
    const opts = [["start", "덕질 D+"]];
    if (b.birthday) opts.push(["birthday", "생일 D-"]);
    if (b.debutDate) opts.push(["debut", "데뷔일 D-"]);
    (b.annivs || []).forEach((a) => opts.push([a.id, a.title + " D-"]));
    openModalRaw(editing ? "기념일 D-day 편집" : "기념일 D-day 올리기", `
      <p class="dt-label">어떤 기념일을 올릴까요?</p>
      <div class="dt-chips" id="ddKeys">${opts.map(([k, l]) => `<button data-k="${esc(String(k))}">${esc(l)}</button>`).join("")}</div>
      <p class="dt-hint-mini">설정한 기념일이 더 필요하면 아래 '기념일'에서 추가할 수 있어요</p>
      <p class="dt-label">색상</p>
      ${decoColorRowHTML()}
      <p class="dt-label">크기</p>
      <div class="dt-opts" id="dtSizes">
        <button data-sz="s">작게</button><button data-sz="m">보통</button><button data-sz="l">크게</button>
      </div>
      <button class="btn btn-primary btn-lg" id="ddSave">${editing ? "저장" : "올리기"}</button>
      ${editing ? '<button class="btn btn-ghost btn-lg slim" id="ddDel">떼기</button>' : ""}
    `);
    let key = editing ? cur.key : opts[0][0];
    let c = editing ? (cur.c || "w") : "w";
    let sz = editing ? (cur.sz || "m") : "m";
    const sync = () => {
      $("ddKeys").querySelectorAll("[data-k]").forEach((x) => x.classList.toggle("on", x.dataset.k === String(key)));
      $("dtColors").querySelectorAll("[data-c]").forEach((x) => x.classList.toggle("on", x.dataset.c === c));
      $("dtSizes").querySelectorAll("[data-sz]").forEach((x) => x.classList.toggle("on", x.dataset.sz === sz));
    };
    sync();
    $("ddKeys").querySelectorAll("[data-k]").forEach((x) => { x.onclick = () => { key = x.dataset.k; sync(); }; });
    $("dtColors").querySelectorAll("[data-c]").forEach((x) => { x.onclick = () => { c = x.dataset.c; sync(); }; });
    $("dtSizes").querySelectorAll("[data-sz]").forEach((x) => { x.onclick = () => { sz = x.dataset.sz; sync(); }; });
    $("ddSave").onclick = () => {
      if (!key) return toast("기념일을 골라주세요");
      if (!b.deco) b.deco = [];
      if (editing) { b.deco[editIndex].key = key; b.deco[editIndex].c = c; b.deco[editIndex].sz = sz; }
      else {
        if (b.deco.length >= 20) return toast("꾸미기는 최대 20개까지!");
        b.deco.push({ t: "dday", key, c, sz, x: 50, y: 50 });
      }
      save(); renderDeco(); closeModal();
    };
    if (editing) $("ddDel").onclick = () => { b.deco.splice(editIndex, 1); save(); renderDeco(); closeModal(); toast("기념일을 뗐어요"); };
  }

  function toggleDeco() {
    decoMode = !decoMode;
    const wrap = $("heroWrap"), pal = $("decoPalette"), btn = $("decoBtn");
    wrap.classList.toggle("deco-on", decoMode);
    pal.classList.toggle("hidden", !decoMode);
    btn.innerHTML = decoMode ? I("check") : I("sparkles");
    btn.title = decoMode ? "꾸미기 완료" : "스티커 꾸미기";
    if (decoMode) {
      pal.innerHTML = '<button class="deco-text-btn" id="decoAddText">✏️ 글자</button>'
        + '<button class="deco-text-btn" id="decoAddDday">🗓 기념일</button>';
      const addTextBtn = pal.querySelector("#decoAddText");
      if (addTextBtn) addTextBtn.onclick = () => addDecoText();
      const addDdayBtn = pal.querySelector("#decoAddDday");
      if (addDdayBtn) addDdayBtn.onclick = () => addDecoDday();
      toast("'글자'로 문구를, '기념일'로 D-day를 올려요. 드래그로 이동 · 탭하면 편집");
    }
  }

  /* 티켓팅 타이머 */
  function nextTicket() {
    const now = nowCorrected();
    // 오픈 직후 60초는 "지금 예매!" 상태로 남겨둠 (오픈 순간을 놓치지 않게)
    return byBias(S.schedules)
      .filter((s) => s.cat === "ticket")
      .map((s) => ({ ...s, dt: new Date(s.date + "T" + (s.time || "00:00")) }))
      .filter((s) => s.dt > now - 60000)
      .sort((a, b) => a.dt - b.dt)[0] || null;
  }

  function updPhoneTime() {
    const pt = $("phTime");
    if (pt) { const n = new Date(); pt.textContent = `${n.getHours()}:${pad(n.getMinutes())}`; }
  }

  const notifiedTickets = new Set();
  function maybeNotifyTicket(t, diff) {
    if (!S.notifyTicket || !("Notification" in window) || Notification.permission !== "granted") return;
    if (diff <= 600000 && diff > 0 && !notifiedTickets.has(t.id)) {
      notifiedTickets.add(t.id);
      try {
        new Notification("티켓팅 10분 전!", { body: `${t.title} — 준비하세요!`, tag: "msc-ticket-" + t.id });
      } catch (e) { toast(`티켓팅 10분 전! ${t.title}`); }
    }
  }
  // 햅틱 진동 — 설정에서 꺼져 있으면 울리지 않음
  function buzz(ms) {
    if (S.haptics === false) return;
    try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {}
  }
  function toggleHaptics() {
    S.haptics = (S.haptics === false) ? true : false;
    save();
    const hsw = $("hapticSwitch");
    if (hsw) hsw.classList.toggle("on", S.haptics !== false);
    if (S.haptics !== false) buzz(12);
    toast(S.haptics !== false ? "진동을 켰어요" : "진동을 껐어요");
  }
  // 콘텐츠 배경 막 농도(0~100) 조절
  function setVeil(v) {
    S.veil = Math.max(0, Math.min(100, +v || 0));
    document.documentElement.style.setProperty("--veil", S.veil + "%");
    const vv = $("veilVal");
    if (vv) vv.textContent = S.veil + "%";
    save();
  }
  function toggleNotifyTicket() {
    if (S.notifyTicket) {
      S.notifyTicket = false;
      save(); renderSettings(); toast("티켓팅 알림을 껐어요");
      return;
    }
    if (!("Notification" in window)) return toast("이 브라우저는 알림을 지원하지 않아요");
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        S.notifyTicket = true;
        save(); renderSettings(); toast("티켓팅 10분 전에 알려드릴게요 (탭이 열려 있을 때)");
      } else toast("알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요");
    });
  }

  // 보정된 현재 시각 (기기 시간 + 사용자가 맞춘 보정값)
  function nowCorrected() { return new Date(Date.now() + ((S && S.clockOffset) || 0)); }

  function fmtCountdown(diff) {
    if (diff < 0) diff = 0;
    const dd = Math.floor(diff / 86400000);
    const hh = Math.floor((diff % 86400000) / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    return dd > 0 ? `D-${dd} ${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  function tickClock() {
    const now = nowCorrected();
    if (S && S.retro && S.retroSkin === "phone") updPhoneTime();
    const lc = $("liveClock");
    if (lc) lc.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const t = nextTicket();
    const tn = $("ticketNext"), btn = $("ticketLinkBtn"), card = $("ticketCard");
    const mw = $("wTick");
    let diff = 0;
    if (t) { diff = t.dt - now; maybeNotifyTicket(t, diff); }
    // 제목: 티켓팅이 잡혀 있으면 '티켓팅 타이머', 평소엔 '시계'
    const titleEl = $("ticketTitle");
    if (titleEl) titleEl.textContent = t ? "티켓팅 타이머" : "시계";
    // 시계는 티켓팅 예정이 없어도 항상 보이게
    if (card) card.classList.remove("hidden");
    if (tn) {
      if (!t) {
        tn.innerHTML = "예정된 티켓팅이 없어요";
        if (btn) btn.classList.add("hidden");
        if (mw) mw.textContent = "--:--:--";
      } else {
        const cnt = fmtCountdown(diff);
        tn.innerHTML = `${esc(t.title)}까지 <strong>${cnt}</strong>` + (diff <= 600000 ? ` ${I("bell")} 10분 전!` : "");
        if (mw) mw.textContent = cnt;
        if (t.link && btn) { btn.href = safeUrl(t.link); btn.classList.remove("hidden"); }
        else if (btn) btn.classList.add("hidden");
      }
    }
    if (standbyOpen) renderStandby(now, t, diff);
  }

  /* ───────── 전체화면 스탠바이 시계 / 티켓팅 ───────── */
  const SB_WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  const SB_TK_WINDOW = 3600000; // 오픈 1시간 전부터 티켓팅 모드
  let standbyOpen = false;
  let standbyFired = false;
  let wakeLock = null;

  function renderStandby(now, t, diff) {
    const dEl = $("sbDate");
    if (dEl) dEl.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${SB_WEEK[now.getDay()]}요일`;
    const sb = $("standby"), clk = $("sbClock"), sub = $("sbSub"), tkLabel = $("sbTkLabel"), tkBtn = $("sbTkBtn");
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const ticketing = !!t && diff <= SB_TK_WINDOW; // 오픈 1시간 이내
    if (sb) sb.classList.toggle("ticketing", ticketing);

    if (ticketing) {
      const fire = diff <= 0; // 오픈 시각 도달
      if (sb) sb.classList.toggle("fire", fire);
      if (tkLabel) { tkLabel.classList.remove("hidden"); tkLabel.textContent = fire ? "지금 예매하세요!" : `${t.title} 오픈까지`; }
      if (clk) clk.textContent = fire ? timeStr : fmtCountdown(diff);
      if (sub) sub.textContent = fire ? `오픈 시각 ${t.time || ""} · 현재 ${timeStr}` : `오픈 ${t.date}${t.time ? " " + t.time : ""}`;
      if (tkBtn) {
        if (t.link) { tkBtn.href = safeUrl(t.link); tkBtn.classList.remove("hidden"); }
        else tkBtn.classList.add("hidden");
      }
      if (fire && !standbyFired) { standbyFired = true; buzz([200, 100, 200, 100, 400]); }
      if (!fire) standbyFired = false;
    } else {
      if (sb) sb.classList.remove("fire");
      if (tkLabel) tkLabel.classList.add("hidden");
      if (tkBtn) tkBtn.classList.add("hidden");
      if (clk) clk.textContent = timeStr;
      const b = curBias();
      if (sub) sub.textContent = t ? `${esc(t.title)} D-${Math.ceil(diff / 86400000)}` : (b ? esc(b.name) : "");
    }

    const ov = $("sbOffVal");
    if (ov) { const s = ((S && S.clockOffset) || 0) / 1000; ov.textContent = `${s > 0 ? "+" : ""}${s.toFixed(1)}초`; }
  }

  async function reqWake() {
    try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch (_) {}
    const w = $("sbWake");
    if (w) w.textContent = wakeLock ? "화면 켜짐 유지 중" : "";
  }
  function relWake() { try { wakeLock && wakeLock.release(); } catch (_) {} wakeLock = null; }

  function openStandby() {
    standbyOpen = true;
    const sb = $("standby");
    if (sb) { sb.classList.remove("hidden"); sb.setAttribute("aria-hidden", "false"); }
    document.body.style.overflow = "hidden";
    reqWake();
    tickClock();
  }
  function closeStandby() {
    standbyOpen = false;
    const sb = $("standby");
    if (sb) { sb.classList.add("hidden"); sb.classList.remove("ticketing", "fire"); sb.setAttribute("aria-hidden", "true"); }
    document.body.style.overflow = "";
    relWake();
  }
  function adjustOffset(ms) {
    S.clockOffset = Math.max(-300000, Math.min(300000, ((S.clockOffset) || 0) + ms));
    save();
    tickClock();
    buzz(8);
  }
  function resetOffset() {
    S.clockOffset = 0;
    save();
    tickClock();
    toast("시간 보정을 초기화했어요");
  }

  /* ═══════════ 캘린더 ═══════════ */
  function calMove(n) {
    calCur = new Date(calCur.getFullYear(), calCur.getMonth() + n, 1);
    renderCalendar();
  }
  // 오늘이 있는 달로 즉시 이동 + 오늘 선택
  function calToday() {
    const now = new Date();
    calCur = new Date(now.getFullYear(), now.getMonth(), 1);
    selDate = todayKey();
    renderCalendar();
  }
  // 제목을 눌러 원하는 연·월로 점프
  function calJump() {
    openModalRaw("다른 달로 이동", `
      <div class="field"><label>연·월 선택</label>${dateSelectHTML("calJumpSel", `${calCur.getFullYear()}-${pad(calCur.getMonth() + 1)}-01`, { yearsBack: 15, yearsFwd: 10, noDay: true })}</div>
      <button class="btn btn-primary btn-lg" id="calJumpGo">이동</button>
    `);
    $("calJumpGo").onclick = () => {
      const v = dateSelectVal("calJumpSel");
      if (!v) return toast("연·월을 골라주세요");
      const parts = v.split("-");
      calCur = new Date(+parts[0], +parts[1] - 1, 1);
      closeModal(); renderCalendar();
    };
  }

  function renderCalendar() {
    const y = calCur.getFullYear(), m = calCur.getMonth();
    $("calTitle").textContent = `${y}.${pad(m + 1)}`;

    // 필터 칩
    const fr = $("catFilters");
    fr.innerHTML = Object.entries(CATS).map(([k, c]) =>
      `<button class="f-chip ${activeCats.has(k) ? "active" : ""}" data-cat="${k}">
        <span class="dot" style="background:var(${c.v})"></span>${c.name}</button>`).join("")
      + `<button class="f-chip rec-chip ${showRecords ? "active" : ""}" data-rec="1" title="아카이브 기록(후기)을 캘린더에 함께 표시">
          <span class="dot rec-dot"></span>기록</button>`;
    fr.querySelectorAll(".f-chip[data-cat]").forEach((ch) => {
      ch.onclick = () => {
        const k = ch.dataset.cat;
        activeCats.has(k) ? activeCats.delete(k) : activeCats.add(k);
        renderCalendar();
      };
    });
    const recChip = fr.querySelector(".f-chip[data-rec]");
    if (recChip) recChip.onclick = () => { showRecords = !showRecords; renderCalendar(); };

    // 멀티캘린더 구분: 전체 / 오프라인 / 온라인
    const cm = $("calModeSeg");
    if (cm) {
      cm.innerHTML = [["all", "전체", ""], ["offline", "오프라인", I("pin")], ["online", "온라인", I("monitor")]]
        .map(([k, n, ic]) => `<button class="${calMode === k ? "active" : ""}" data-cm="${k}">${ic} ${n}</button>`).join("");
      cm.querySelectorAll("[data-cm]").forEach((b) => { b.onclick = () => { calMode = b.dataset.cm; renderCalendar(); }; });
    }

    const first = new Date(y, m, 1);
    const startDow = first.getDay();
    const daysIn = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const b = curBias();
    const tk = todayKey();
    const schedByDate = {};
    byBias(S.schedules).forEach((s) => {
      // 현재 프리셋에 없는 카테고리(프리셋 변경 후 남은 기존 일정)는 항상 표시
      const catVisible = activeCats.has(s.cat) || !CATS[s.cat];
      if (catVisible && (calMode === "all" || (s.mode || "offline") === calMode))
        (schedByDate[s.date] = schedByDate[s.date] || []).push(s);
    });
    const archByDate = {};
    if (showRecords) byBias(S.archives).forEach((a) => {
      if (a.date && (calMode === "all" || (a.mode || "offline") === calMode))
        (archByDate[a.date] = archByDate[a.date] || []).push(a);
    });

    let html = "";
    const totalCells = Math.ceil((startDow + daysIn) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startDow + 1;
      if (dayNum < 1 || dayNum > daysIn) {
        const n = dayNum < 1 ? prevDays + dayNum : dayNum - daysIn;
        html += `<div class="cal-cell other"><span class="num">${n}</span></div>`;
        continue;
      }
      const key = `${y}-${pad(m + 1)}-${pad(dayNum)}`;
      const classes = ["cal-cell"];
      if (key === tk) classes.push("today");
      if (key === selDate) classes.push("selected");
      const st = S.stickers[key] ? `<span class="sticker">${S.stickers[key]}</span>` : "";
      const dots = (schedByDate[key] || []).slice(0, 5)
        .map((s) => `<i style="background:var(${(CATS[s.cat] || CATS.personal).v})"></i>`).join("")
        + (archByDate[key] || []).slice(0, 3)
          .map((a) => `<i class="rec ${(a.mode || "offline") === "online" ? "on" : "off"}"></i>`).join("");
      let anniv = "";
      if (b) {
        if (b.birthday && sameMD(b.birthday, m, dayNum)) anniv = `<span class="anniv">${I("cake")} 생일</span>`;
        else if (b.debutDate && sameMD(b.debutDate, m, dayNum)) anniv = `<span class="anniv">${I("flag")} 데뷔</span>`;
        else {
          const ca = (b.annivs || []).find((a) => sameMD(a.date, m, dayNum));
          if (ca) anniv = `<span class="anniv">${I("heart")} ${esc(ca.title.length > 5 ? ca.title.slice(0, 5) + "…" : ca.title)}</span>`;
        }
      }
      html += `<div class="${classes.join(" ")}" data-date="${key}">
        <span class="num">${dayNum}</span>${st}
        <div class="dots">${dots}</div>${anniv}
      </div>`;
    }
    $("calGrid").innerHTML = html;
    $("calGrid").querySelectorAll(".cal-cell[data-date]").forEach((c) => {
      c.onclick = () => { selDate = c.dataset.date; renderCalendar(); };
    });
    renderDayPanel();
  }

  function sameMD(dateStr, month, day) {
    const d = new Date(dateStr);
    return d.getMonth() === month && d.getDate() === day;
  }

  function renderDayPanel() {
    const title = $("dayPanelTitle"), list = $("dayList");
    if (!selDate) {
      title.textContent = "날짜를 선택하세요";
      list.innerHTML = "";
      return;
    }
    const d = new Date(selDate);
    title.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${["일","월","화","수","목","금","토"][d.getDay()]}요일` + (S.stickers[selDate] ? " " + S.stickers[selDate] : "");
    const items = byBias(S.schedules).filter((s) => s.date === selDate)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const recs = byBias(S.archives).filter((a) => a.date === selDate)
      .sort((a, b) => (a.mode || "").localeCompare(b.mode || ""));

    const schedHtml = items.map((s) => {
      const c = CATS[s.cat] || CATS.personal;
      return `<li>
        <span class="bar" style="background:var(${c.v})"></span>
        <div class="dl-main">
          <div class="dl-cat" style="color:var(${c.v})">${c.name}${s.time ? " · " + esc(s.time) : ""}</div>
          <div class="dl-title">${esc(s.title)}</div>
          ${s.place ? `<div class="dl-sub">${I("pin")} ${esc(s.place)}</div>` : ""}
          ${s.memo ? `<div class="dl-sub">${esc(s.memo)}</div>` : ""}
          ${s.link ? `<a class="dl-link" href="${esc(safeUrl(s.link))}" target="_blank" rel="noopener">링크 바로가기 ${I("arrowUR")}</a>` : ""}
        </div>
        <button class="dl-del" data-esch="${s.id}">${I("pencil")}</button>
        <button class="dl-del" data-id="${s.id}">${I("x")}</button>
      </li>`;
    }).join("");

    // 아카이브 기록(후기) — 캘린더와 연동
    const recHtml = recs.map((a) => {
      const on = (a.mode || "offline") === "online";
      return `<li class="day-rec" data-rview="${a.id}">
        <span class="bar rec-bar ${on ? "on" : "off"}"></span>
        <div class="dl-main">
          <div class="dl-cat rec-cat">${on ? I("monitor") : I("pin")} 기록 · ${esc(a.etype || "기타")}${a.place ? " · " + esc(a.place) : ""}</div>
          <div class="dl-title">${esc(a.title)}</div>
          ${a.content ? `<div class="dl-sub">${esc(a.content.length > 40 ? a.content.slice(0, 40) + "…" : a.content)}</div>` : ""}
        </div>
        ${(a.imgs && a.imgs.length) ? `<img class="dl-rec-thumb" src="${a.imgs[0]}" alt="">` : ""}
      </li>`;
    }).join("");

    const body = schedHtml + recHtml;
    list.innerHTML = (body || `<li class="day-empty">이 날의 일정·기록이 없어요. + 버튼이나 아래에서 추가해 보세요!</li>`)
      + `<li class="day-add-rec"><button class="btn btn-ghost btn-sm" id="dayAddRec">${I("pencil")} 이 날 후기·기록 쓰기</button></li>`;

    list.querySelectorAll(".dl-del[data-id]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (!confirm("이 일정을 삭제할까요?")) return;
        S.schedules = S.schedules.filter((s) => s.id !== btn.dataset.id);
        save(); renderCalendar(); toast("일정을 삭제했어요");
      };
    });
    list.querySelectorAll("[data-esch]").forEach((btn) => {
      btn.onclick = (e) => { e.stopPropagation(); openModal("schedule", btn.dataset.esch); };
    });
    list.querySelectorAll(".day-rec[data-rview]").forEach((li) => {
      li.onclick = () => openDiaryView(li.dataset.rview);
    });
    const addRec = $("dayAddRec");
    if (addRec) addRec.onclick = () => openModal("diary");
  }

  function openStickerPicker() {
    if (!selDate) return toast("먼저 날짜를 선택해 주세요!");
    openModalRaw("스티커 붙이기", `
      <div class="sticker-grid">
        ${STICKERS.map((s) => `<button data-s="${s}">${s}</button>`).join("")}
      </div>
      <button class="btn btn-ghost btn-lg" id="stickerRemove">스티커 떼기</button>
    `);
    $("modalBody").querySelectorAll("[data-s]").forEach((b) => {
      b.onclick = () => {
        S.stickers[selDate] = b.dataset.s;
        save(); closeModal(); renderCalendar();
      };
    });
    $("stickerRemove").onclick = () => {
      delete S.stickers[selDate];
      save(); closeModal(); renderCalendar();
    };
  }

  function shareDay() {
    if (!selDate) return toast("먼저 날짜를 선택해 주세요!");
    const b = curBias();
    const items = byBias(S.schedules).filter((s) => s.date === selDate)
      .sort((a, b2) => (a.time || "").localeCompare(b2.time || ""));
    if (!items.length) return toast("공유할 일정이 없어요");
    const d = new Date(selDate);
    let text = `🗓 ${d.getMonth() + 1}/${d.getDate()} ${b ? b.name : ""} 스케줄\n`;
    items.forEach((s) => {
      text += `\n${s.time ? s.time + " " : ""}[${(CATS[s.cat] || CATS.personal).name}] ${s.title}`;
      if (s.place) text += ` @ ${s.place}`;
    });
    text += "\n\n#마이스타캘린더 #MyStarCalendar";
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => toast("클립보드에 복사했어요! SNS에 붙여넣으세요"))
        .catch(() => toast("복사 권한이 없어요. 브라우저 설정을 확인해 주세요"));
    } else toast("이 브라우저에선 공유를 지원하지 않아요");
  }

  /* ═══════════ 포카 바인더 ═══════════ */
  function binderTab(mode) {
    binderMode = mode;
    binderPage = 0;
    document.querySelectorAll("[data-btab]").forEach((t) => t.classList.toggle("active", t.dataset.btab === mode));
    renderBinder();
  }

  function renderBinder() {
    // 탭별 장수 표시 (보유/위시/교환)
    const allCards = byBias(S.photocards);
    const counts = { own: 0, wish: 0, trade: 0 };
    allCards.forEach((p) => { if (counts[p.status] != null) counts[p.status]++; });
    document.querySelectorAll("[data-btab]").forEach((t) => {
      const base = { own: "보유", wish: "위시", trade: "교환 중" }[t.dataset.btab];
      t.textContent = `${base} ${counts[t.dataset.btab] || 0}`;
    });

    let cards = allCards.filter((p) => p.status === binderMode);
    // 앨범 필터 칩 (장수 포함)
    const albums = [...new Set(cards.map((p) => p.album).filter(Boolean))];
    const ar = $("albumRow");
    if (ar) {
      if (binderAlbum !== "all" && !albums.includes(binderAlbum)) binderAlbum = "all";
      ar.innerHTML = albums.length
        ? [["all", "전체"], ...albums.map((a) => [a, a])].map(([v, n]) => {
            const cnt = v === "all" ? cards.length : cards.filter((p) => p.album === v).length;
            return `<button class="f-chip ${binderAlbum === v ? "active" : ""}" data-album="${esc(v)}">${esc(n)} ${cnt}</button>`;
          }).join("")
        : "";
      ar.querySelectorAll("[data-album]").forEach((b) => {
        b.onclick = () => { binderAlbum = b.dataset.album; binderPage = 0; renderBinder(); };
      });
    }
    if (binderAlbum !== "all") cards = cards.filter((p) => p.album === binderAlbum);

    // ── 페이지 단위 바인더: 열 수는 화면 폭을 채우고(모바일 3×3, PC 다열), 한 페이지가 한 화면에 들어오게 ──
    const grid = $("binderGrid");
    const gap = 10;
    let availW = grid.clientWidth;
    if (!availW || availW < 80) availW = Math.min(940, window.innerWidth - (window.innerWidth >= 980 ? 300 : 36));
    const vw = window.innerWidth;
    let cols, rows;
    if (vw < 640) { cols = 2; rows = 3; }        // 모바일: 2×3 = 6
    else if (vw < 980) { cols = 4; rows = 2; }   // 태블릿: 4×2 = 8
    else { cols = 6; rows = 2; }                 // 데스크톱: 6×2 = 12
    const PER_PAGE = cols * rows;
    // 카드는 포카 비율(5.5:8.5) 고정 (CSS aspect-ratio).
    if (vw < 980) {
      // 모바일·태블릿: 카드가 칸 폭을 꽉 채우고 균일한 간격. 길면 스크롤 허용.
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.justifyContent = "";
    } else {
      // 데스크톱: 한 화면에 맞춰 무스크롤 — 카드 크기를 높이에 맞춰 줄이고, 남는 가로는 양옆 여백으로
      const gtop = grid.getBoundingClientRect().top;
      const availH = Math.max(150, window.innerHeight - gtop - 64);
      const cardWByWidth = (availW - gap * (cols - 1)) / cols;
      const cardWByHeight = ((availH - gap * (rows - 1)) / rows) * 5.5 / 8.5;
      const cardW = Math.max(60, Math.floor(Math.min(cardWByWidth, cardWByHeight)));
      grid.style.gridTemplateColumns = `repeat(${cols}, ${cardW}px)`;
      grid.style.justifyContent = "center";
    }

    const totalPages = Math.max(1, Math.ceil((cards.length + 1) / PER_PAGE)); // 마지막 페이지엔 항상 빈칸 1개 이상
    if (binderPage > totalPages - 1) binderPage = totalPages - 1;
    if (binderPage < 0) binderPage = 0;
    const pageCards = cards.slice(binderPage * PER_PAGE, binderPage * PER_PAGE + PER_PAGE);
    let html = pageCards.map((p) => `
      <div class="poca-slot ${p.img ? "" : "noimg"}" data-pid="${p.id}">
        ${p.img ? `<img src="${p.img}" alt="" draggable="false">` : esc(p.name)}
        ${p.img && p.name ? `<span class="pc-label">${esc(p.name)}</span>` : ""}
      </div>`).join("");
    const emptyCount = PER_PAGE - pageCards.length; // 남은 칸을 빈 포켓으로 채움 (모두 동일하게)
    for (let i = 0; i < emptyCount; i++) {
      html += `<div class="poca-slot empty" data-add="1"><span class="plus">+</span></div>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll("[data-add]").forEach((el) => { el.onclick = () => openModal("poca"); });
    bindPocaCards(grid);
    const bHint = $("binderHint");
    if (bHint) {
      if (cards.length === 0) { bHint.textContent = "빈 칸을 눌러 첫 포카를 등록해 보세요"; bHint.classList.remove("hidden"); }
      else if (cards.length >= 2) { bHint.textContent = "포카를 꾹 눌러 끌면 순서를 바꿀 수 있어요"; bHint.classList.remove("hidden"); }
      else bHint.classList.add("hidden");
    }
    // 첫 진입 등에서 그리드 너비가 늦게 잡혀 보유/위시 탭 칸 수가 달라 보이는 문제 보정:
    // 다음 프레임에 실제 너비를 재확인해 달라졌으면 한 번만 다시 그려 항상 같은 배치로 통일
    const pageBinder = $("page-binder");
    if (pageBinder && pageBinder.classList.contains("active")) {
      requestAnimationFrame(() => {
        if (!pageBinder.classList.contains("active")) return;
        const w2 = grid.clientWidth;
        if (w2 && Math.abs(w2 - availW) > 24) renderBinder();
      });
    }

    // 페이지 넘김 + 현재/전체 표시
    const pager = $("binderPager");
    if (pager) {
      pager.innerHTML = `
        <button class="bp-arrow" id="bpPrev" ${binderPage === 0 ? "disabled" : ""} aria-label="이전 페이지">‹</button>
        <span class="bp-info"><b>${binderPage + 1}</b><span class="bp-sep">/</span>${totalPages}</span>
        <button class="bp-arrow" id="bpNext" ${binderPage >= totalPages - 1 ? "disabled" : ""} aria-label="다음 페이지">›</button>`;
      const pv = $("bpPrev"), nx = $("bpNext");
      if (pv) pv.onclick = () => { if (binderPage > 0) { binderPage--; renderBinder(); } };
      if (nx) nx.onclick = () => { if (binderPage < totalPages - 1) { binderPage++; renderBinder(); } };
    }
  }

  // 포카 카드: 탭=상세보기 / 꾹 눌러 드래그=순서 변경
  function bindPocaCards(grid) {
    grid.querySelectorAll(".poca-slot[data-pid]").forEach((el) => {
      let down = null, lp = null;
      el.addEventListener("pointerdown", (e) => {
        if (e.button && e.button !== 0) return;
        down = { x: e.clientX, y: e.clientY };
        lp = setTimeout(() => { lp = null; down = null; startPocaDrag(e, el, grid); }, 380);
      });
      el.addEventListener("pointermove", (e) => {
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) {
          if (lp) { clearTimeout(lp); lp = null; }
          down = null; // 움직이면 스크롤로 보고 취소
        }
      });
      el.addEventListener("pointerup", (e) => {
        if (lp) { clearTimeout(lp); lp = null; }
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) <= 10) openPocaView(el.dataset.pid);
        down = null;
      });
      el.addEventListener("pointercancel", () => { if (lp) { clearTimeout(lp); lp = null; } down = null; });
    });
  }
  function startPocaDrag(e, slot, grid) {
    const rect = slot.getBoundingClientRect();
    const offX = e.clientX - rect.left, offY = e.clientY - rect.top;
    try { slot.setPointerCapture(e.pointerId); } catch (_) {}
    slot.classList.add("poca-dragging");
    if (S.haptics !== false) { try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} }
    Object.assign(slot.style, {
      width: rect.width + "px", height: rect.height + "px", position: "fixed",
      left: rect.left + "px", top: rect.top + "px", zIndex: "60", margin: "0", touchAction: "none",
    });
    const ph = document.createElement("div");
    ph.className = "poca-slot poca-ph";
    slot.after(ph);
    const move = (ev) => {
      slot.style.left = (ev.clientX - offX) + "px";
      slot.style.top = (ev.clientY - offY) + "px";
      slot.style.visibility = "hidden";
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      slot.style.visibility = "";
      const over = under && under.closest(".poca-slot[data-pid]");
      if (over && over !== slot && over.parentNode === grid) {
        const r = over.getBoundingClientRect();
        const before = ev.clientX < r.left + r.width / 2;
        grid.insertBefore(ph, before ? over : over.nextSibling);
      }
    };
    const up = () => {
      slot.removeEventListener("pointermove", move);
      slot.removeEventListener("pointerup", up);
      try { slot.releasePointerCapture(e.pointerId); } catch (_) {}
      ph.replaceWith(slot);
      slot.classList.remove("poca-dragging");
      ["width", "height", "position", "left", "top", "zIndex", "margin", "touchAction", "visibility"]
        .forEach((p) => { slot.style[p] = ""; });
      commitPocaOrder(grid);
    };
    slot.addEventListener("pointermove", move);
    slot.addEventListener("pointerup", up);
    move(e);
  }
  function commitPocaOrder(grid) {
    const order = [...grid.querySelectorAll(".poca-slot[data-pid]")].map((el) => el.dataset.pid);
    const pos = {}; order.forEach((id, i) => { pos[id] = i; });
    const inView = new Set(order);
    const reordered = S.photocards.filter((p) => inView.has(p.id)).sort((a, b) => pos[a.id] - pos[b.id]);
    let vi = 0;
    S.photocards = S.photocards.map((p) => (inView.has(p.id) ? reordered[vi++] : p));
    save(); renderBinder(); renderHome();
  }

  function openPocaView(id) {
    const p = S.photocards.find((x) => x.id === id);
    if (!p) return;
    const stName = { own: "보유", wish: "위시", trade: "교환 중" };
    openModalRaw(p.name || "포토카드", `
      ${p.img ? `<img src="${p.img}" alt="${esc(p.name) || "포토카드"} 사진" style="width:100%;max-height:50vh;object-fit:contain;border-radius:12px;margin-bottom:14px">` : ""}
      <p style="font-size:12px;color:var(--muted);margin-bottom:14px">${p.album ? esc(p.album) + " · " : ""}${stName[p.status] || ""}${p.memo ? " · " + esc(p.memo) : ""}</p>
      <div class="btn-row">
        <button class="btn btn-primary btn-sm" id="pcMove">${p.status === "own" ? "위시로 이동" : "보유로 이동 (겟 완료!)"}</button>
        <button class="btn btn-ghost btn-sm" id="pcTrade">${p.status === "trade" ? "교환 완료 (보유로)" : "교환 중으로"}</button>
        <button class="btn btn-ghost btn-sm" id="pcEdit">${I("pencil")} 수정</button>
        <button class="btn btn-danger btn-sm" id="pcDel">삭제</button>
      </div>
    `);
    $("pcTrade").onclick = () => {
      p.status = p.status === "trade" ? "own" : "trade";
      save(); closeModal(); binderTab(p.status); renderHome();
      toast(p.status === "trade" ? "교환 중으로 옮겼어요" : "교환 완료! 보유 포카로");
    };
    $("pcEdit").onclick = () => openModal("poca", id);
    $("pcMove").onclick = () => {
      p.status = p.status === "own" ? "wish" : "own";
      save(); closeModal(); renderBinder(); renderHome(); toast(p.status === "own" ? "보유 포카로 옮겼어요" : "위시로 옮겼어요");
    };
    $("pcDel").onclick = () => {
      if (!confirm("이 포카를 삭제할까요?")) return;
      S.photocards = S.photocards.filter((x) => x.id !== id);
      save(); closeModal(); renderBinder(); renderHome();
    };
  }

  /* ═══════════ 가계부 ═══════════ */
  function ledgerMove(n) {
    ledgerCur = new Date(ledgerCur.getFullYear(), ledgerCur.getMonth() + n, 1);
    renderLedger();
  }

  function renderLedger() {
    const y = ledgerCur.getFullYear(), m = ledgerCur.getMonth();
    const ym = `${y}-${pad(m + 1)}`;
    $("ledgerTitle").textContent = `${y}.${pad(m + 1)}`;
    const exps = byBias(S.expenses).filter((e) => e.date && e.date.startsWith(ym))
      .sort((a, b) => b.date.localeCompare(a.date));
    const total = exps.reduce((a, e) => a + (+e.amount || 0), 0);
    $("ledgerTotal").textContent = won(total);

    // 예산
    const br = $("budgetRow");
    if (br) {
      if (S.budget > 0) {
        const pct = Math.min(100, Math.round((total / S.budget) * 100));
        const over = total > S.budget;
        br.innerHTML = `
          <div class="budget-track"><span class="budget-fill ${over ? "over" : ""}" style="width:${pct}%"></span></div>
          <div class="budget-meta">
            <span class="${over ? "budget-over" : ""}">${over ? `예산 초과! ${won(total - S.budget)} 넘었어요` : `예산 ${won(S.budget)}의 ${pct}%`}</span>
            <button class="chip-btn" onclick="App.openBudget()">예산 수정</button>
          </div>`;
      } else {
        br.innerHTML = `<div class="budget-meta"><span class="hint" style="margin:0">이번 달 예산을 정해두면 초과를 알려드려요</span><button class="chip-btn" onclick="App.openBudget()">예산 설정</button></div>`;
      }
    }

    // 인사이트: 전월 대비 · 일평균 · 남은 예산 하루 가용액
    const insEl = $("ledgerInsight");
    if (insEl) {
      const prev = new Date(y, m - 1, 1);
      const prevYm = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
      const prevTotal = byBias(S.expenses).filter((e) => e.date && e.date.startsWith(prevYm)).reduce((a, e) => a + (+e.amount || 0), 0);
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const now = new Date();
      const isThisMonth = (y === now.getFullYear() && m === now.getMonth());
      const elapsed = isThisMonth ? now.getDate() : daysInMonth;
      const chips = [];
      if (prevTotal > 0) {
        const diff = total - prevTotal;
        const pctd = Math.round(Math.abs(diff) / prevTotal * 100);
        chips.push(diff === 0
          ? `<span class="li-chip">전월과 같아요</span>`
          : `<span class="li-chip ${diff > 0 ? "up" : "down"}">전월 대비 ${diff > 0 ? "▲" : "▼"} ${won(Math.abs(diff))} · ${pctd}%</span>`);
      } else if (total > 0) chips.push(`<span class="li-chip">전월 지출 없음</span>`);
      if (total > 0) chips.push(`<span class="li-chip">하루 평균 ${won(Math.round(total / Math.max(1, elapsed)))}</span>`);
      if (S.budget > 0 && total <= S.budget && isThisMonth) {
        const remainDays = Math.max(1, daysInMonth - now.getDate() + 1);
        chips.push(`<span class="li-chip ok">남은 예산 하루 ${won(Math.floor((S.budget - total) / remainDays))}까지</span>`);
      }
      insEl.innerHTML = chips.join("");
    }

    // 올해 통계
    const ys = $("yearStats");
    if (ys) {
      const yearStr = String(y);
      const yearExps = byBias(S.expenses).filter((e) => e.date && e.date.startsWith(yearStr));
      const yTotal = yearExps.reduce((a, e) => a + (+e.amount || 0), 0);
      const activeMonths = new Set(yearExps.map((e) => e.date.slice(0, 7))).size || 1;
      const yByCat = {};
      yearExps.forEach((e) => (yByCat[e.category] = (yByCat[e.category] || 0) + +e.amount));
      const topCat = Object.entries(yByCat).sort((a, b2) => b2[1] - a[1])[0];
      ys.innerHTML = `
        <div class="ys-row"><span>${yearStr}년 총 지출</span><b>${won(yTotal)}</b></div>
        <div class="ys-row"><span>월평균 <small>(지출 있는 달 기준)</small></span><b>${won(Math.round(yTotal / activeMonths))}</b></div>
        <div class="ys-row"><span>최다 카테고리</span><b>${topCat ? esc(topCat[0]) + " (" + won(topCat[1]) + ")" : "—"}</b></div>`;
    }

    // 카테고리 분해
    const byCat = {};
    exps.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + +e.amount));
    $("ledgerCats").innerHTML = EXP_CATS.filter((c) => byCat[c]).map((c) => {
      const i = EXP_CATS.indexOf(c);
      return `<div class="lc-row">
        <span class="dot" style="background:${EXP_COLORS[i]}"></span>
        <span class="lc-name">${c}</span>
        <span class="lc-track"><span class="lc-fill" style="width:${(byCat[c] / total) * 100}%;background:${EXP_COLORS[i]}"></span></span>
        <span class="lc-amt">${won(byCat[c])}</span>
      </div>`;
    }).join("") || `<p class="hint">이번 달 지출이 아직 없어요</p>`;

    // 결제 수단 비중
    const payEl = $("ledgerPay");
    if (payEl) {
      const byPay = {};
      exps.forEach((e) => { const p = e.pay || "카드"; byPay[p] = (byPay[p] || 0) + (+e.amount || 0); });
      const entries = Object.entries(byPay).sort((a, b2) => b2[1] - a[1]);
      payEl.innerHTML = (total && entries.length)
        ? `<div class="lpay-row">${entries.map(([p, v]) => `<span class="lpay">${esc(p)} <b>${Math.round(v / total * 100)}%</b></span>`).join("")}</div>`
        : "";
    }

    // 월별 그래프 (최근 6개월=당월 중심 / 상반기 1~6월 / 하반기 7~12월)
    const months = [];
    if (ledgerChartMode === "h1" || ledgerChartMode === "h2") {
      const startM = ledgerChartMode === "h1" ? 0 : 6; // 0=1월, 6=7월
      for (let i = 0; i < 6; i++) {
        const d = new Date(y, startM + i, 1);
        months.push({ ym: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${d.getMonth() + 1}월`, date: d });
      }
    } else {
      // 선택한 달을 가운데(4번째 칸)에: 앞 3개월 + 당월 + 뒤 2개월
      for (let i = -3; i <= 2; i++) {
        const d = new Date(y, m + i, 1);
        months.push({ ym: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${d.getMonth() + 1}월`, date: d });
      }
    }
    const sums = months.map((mo) => byBias(S.expenses).filter((e) => e.date && e.date.startsWith(mo.ym)).reduce((a, e) => a + +e.amount, 0));
    const max = Math.max(...sums, 1);
    const nowMonth = new Date(); nowMonth.setDate(1); nowMonth.setHours(0, 0, 0, 0);
    $("ledgerChart").innerHTML = months.map((mo, i) => {
      const isCur = mo.ym === ym;
      // 아직 오지 않은 달만 흐리게. 단, 지금 보고 있는(선택한) 달은 미래여도 또렷하게.
      const isFuture = mo.date > nowMonth && !isCur;
      return `<div class="bc-col ${isCur ? "cur" : ""} ${isFuture ? "future" : ""}">
        <div class="bc-bar" style="height:${Math.max(3, (sums[i] / max) * 100)}%"></div>
        <span class="bc-label">${mo.label}</span>
      </div>`;
    }).join("");

    // 그래프 모드 라벨 · 토글 칩
    const chartSub = $("ledgerChartSub");
    if (chartSub) chartSub.textContent =
      ledgerChartMode === "h1" ? `(${y} 상반기)` :
      ledgerChartMode === "h2" ? `(${y} 하반기)` : "(선택 월 중심 6개월)";
    const chartTabs = $("ledgerChartTabs");
    if (chartTabs) {
      chartTabs.querySelectorAll("[data-cmode]").forEach((b) => {
        b.classList.toggle("active", b.dataset.cmode === ledgerChartMode);
        b.onclick = () => { ledgerChartMode = b.dataset.cmode; renderLedger(); };
      });
    }

    // 카테고리 필터 칩
    const cf = $("ledgerCatFilter");
    if (cf) {
      const usedCats = EXP_CATS.filter((c) => byCat[c]);
      if (ledgerCatFilter !== "all" && !byCat[ledgerCatFilter]) ledgerCatFilter = "all";
      cf.innerHTML = usedCats.length
        ? [["all", "전체"], ...usedCats.map((c) => [c, c])].map(([v, n]) =>
            `<button class="f-chip ${ledgerCatFilter === v ? "active" : ""}" data-lcat="${esc(v)}">${esc(n)}</button>`).join("")
        : "";
      cf.querySelectorAll("[data-lcat]").forEach((b) => { b.onclick = () => { ledgerCatFilter = b.dataset.lcat; renderLedger(); }; });
    }

    // 내역
    const listExps = ledgerCatFilter === "all" ? exps : exps.filter((e) => e.category === ledgerCatFilter);
    $("expenseList").innerHTML = listExps.length
      ? listExps.map((e) => {
          const i = Math.max(0, EXP_CATS.indexOf(e.category));
          return `<li>
            <span class="dot" style="background:${EXP_COLORS[i]}"></span>
            <div class="ex-main">
              <div class="ex-title">${esc(e.title)}</div>
              <div class="ex-sub">${e.date} · ${esc(e.category)}${e.pay ? " · " + esc(e.pay) : ""}${e.memo ? " · " + esc(e.memo) : ""}</div>
            </div>
            <span class="ex-amt">${won(e.amount)}</span>
            <button class="dl-del" data-eexp="${e.id}">${I("pencil")}</button>
            <button class="dl-del" data-id="${e.id}">${I("x")}</button>
          </li>`;
        }).join("")
      : `<li class="day-empty">${ledgerCatFilter === "all" ? "지출 내역이 없어요. 행복 비용을 기록해 보세요" : "이 카테고리 지출이 없어요"}</li>`;
    $("expenseList").querySelectorAll(".dl-del[data-id]").forEach((b) => {
      b.onclick = () => {
        if (!confirm("이 내역을 삭제할까요?")) return;
        S.expenses = S.expenses.filter((e) => e.id !== b.dataset.id);
        save(); renderLedger(); renderHome();
      };
    });
    $("expenseList").querySelectorAll("[data-eexp]").forEach((b) => {
      b.onclick = () => openModal("expense", b.dataset.eexp);
    });
  }

  /* ═══════════ 아카이브 ═══════════ */
  function archiveTab(mode) {
    document.querySelectorAll("[data-atab]").forEach((t) => t.classList.toggle("active", t.dataset.atab === mode));
    $("archiveDiary").classList.toggle("hidden", mode !== "diary");
    $("archControls").classList.toggle("hidden", mode !== "diary");
    $("archViewSeg").classList.toggle("hidden", mode !== "diary");
    $("archiveLinks").classList.toggle("hidden", mode !== "links");
  }

  function renderArchive() {
    // 오프라인/온라인 토글
    const seg = $("archModeSeg");
    if (seg) {
      seg.querySelectorAll("[data-am]").forEach((b) => {
        b.classList.toggle("active", b.dataset.am === archMode);
        b.onclick = () => { archMode = b.dataset.am; diaryType = "all"; renderArchive(); };
      });
    }
    // 카드형/피드형 보기 토글
    const vs = $("archViewSeg");
    if (vs) {
      vs.querySelectorAll("[data-av]").forEach((b) => {
        b.classList.toggle("active", (S.archView || "card") === b.dataset.av);
        b.onclick = () => { S.archView = b.dataset.av; save(); renderArchive(); };
      });
    }
    $("archiveDiary").classList.toggle("feed-view", (S.archView || "card") === "feed");
    // 유형 필터 칩
    const tr = $("diaryTypeRow");
    if (tr) {
      const custom = (S.customArchTypes && S.customArchTypes[archMode]) || [];
      const types = ["all", ...effArchTypes(archMode)];
      tr.innerHTML = types.map((t) => {
        const isCustom = custom.includes(t);
        return `<button class="f-chip ${diaryType === t ? "active" : ""} ${isCustom ? "chip-custom" : ""}" data-dt="${esc(t)}">${t === "all" ? "전체" : esc(t)}${isCustom ? `<i class="chip-x" data-delt="${esc(t)}">✕</i>` : ""}</button>`;
      }).join("") + `<button class="f-chip chip-add" id="archAddType" aria-label="유형 추가">+ 유형</button>`;
      tr.querySelectorAll("[data-dt]").forEach((b) => {
        b.onclick = (e) => { if (e.target.closest(".chip-x")) return; diaryType = b.dataset.dt; renderArchive(); };
      });
      tr.querySelectorAll("[data-delt]").forEach((x) => {
        x.onclick = (e) => { e.stopPropagation(); removeArchType(archMode, x.dataset.delt); };
      });
      const ab = $("archAddType");
      if (ab) ab.onclick = () => openAddArchType();
    }
    // 일기
    let diaries = byBias(S.archives).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    diaries = diaries.filter((d) => (d.mode || "offline") === archMode);
    if (diaryType !== "all") diaries = diaries.filter((d) => (d.etype || "기타") === diaryType);
    if (archSearch) {
      const q = archSearch.toLowerCase();
      diaries = diaries.filter((d) =>
        (d.title || "").toLowerCase().includes(q) ||
        (d.content || "").toLowerCase().includes(q) ||
        (d.place || "").toLowerCase().includes(q));
    }
    const asi = $("archSearch");
    if (asi && !asi._bound) {
      asi._bound = true;
      asi.oninput = () => { archSearch = asi.value.trim(); renderArchive(); };
    }
    $("archiveDiary").innerHTML = diaries.length
      ? diaries.map((d) => `
        <div class="diary-card ${(d.imgs && d.imgs.length) ? "" : "noimg"}" data-id="${d.id}">
          <div class="dc-head">
            <span class="dc-date">${d.date ? d.date.split("-").join(".") : ""}</span>
            <span class="dc-type">${esc(d.etype || "기타")}</span>
          </div>
          ${(d.imgs && d.imgs.length) ? `<div class="dc-imgwrap"><img class="dc-img" src="${d.imgs[0]}" alt="">${d.imgs.length > 1 ? `<span class="dc-more">+${d.imgs.length - 1}</span>` : ""}</div>` : ""}
          <div class="dc-body">
            <div class="dc-title">${esc(d.title)}</div>
            ${d.place ? `<div class="dc-place">${I("pin")} ${esc(d.place)}</div>` : ""}
            <div class="dc-text">${esc(d.content)}</div>
          </div>
        </div>`).join("")
      : `<div class="diary-empty">${archMode === "online"
          ? "아직 온라인 기록이 없어요.<br>온라인으로 함께한 순간을 남겨보세요"
          : "아직 오프라인 기록이 없어요.<br>다녀온 현장의 기록을 남겨보세요"}</div>`;
    $("archiveDiary").querySelectorAll("[data-id]").forEach((el) => {
      el.onclick = () => openDiaryView(el.dataset.id);
    });
    renderLinks();
  }

  // 아카이브 유형 직접 추가/삭제 (오프라인·온라인 각각)
  function openAddArchType() {
    const modeLabel = archMode === "online" ? "온라인" : "오프라인";
    openModalRaw(`${modeLabel} 유형 추가`, `
      <div class="field"><label>새 유형 이름 *</label><input type="text" id="mNewType" maxlength="14" placeholder="예) 시구, 오프모임, 콜라보 카페"></div>
      <p class="hint">이 유형은 ${modeLabel} 기록에서 골라 쓸 수 있어요.</p>
      <button class="btn btn-primary btn-lg" id="mSaveType">추가</button>
    `);
    const inp = $("mNewType");
    if (inp) inp.focus();
    $("mSaveType").onclick = () => {
      const name = $("mNewType").value.trim();
      if (!name) return toast("유형 이름을 입력해 주세요!");
      const list = S.customArchTypes[archMode];
      if (archTypes(archMode).includes(name) || list.includes(name)) return toast("이미 있는 유형이에요");
      list.push(name);
      save(); closeModal(); diaryType = name; renderArchive();
      toast(`'${name}' 유형을 추가했어요`);
    };
  }
  function removeArchType(mode, name) {
    if (!confirm(`'${name}' 유형을 삭제할까요? (이 유형으로 쓴 기록은 그대로 남아요)`)) return;
    S.customArchTypes[mode] = (S.customArchTypes[mode] || []).filter((t) => t !== name);
    if (diaryType === name) diaryType = "all";
    save(); renderArchive();
    toast("유형을 삭제했어요");
  }

  function openDiaryView(id) {
    const d = S.archives.find((x) => x.id === id);
    if (!d) return;
    openModalRaw(d.title, `
      ${(d.imgs || []).map((im) => `<img src="${im}" alt="${esc(d.title) || "기록"} 사진" style="width:100%;border-radius:12px;margin-bottom:12px">`).join("")}
      <p style="font-size:12px;color:var(--muted);margin-bottom:8px">${esc(d.etype || "기타")} · ${d.date || ""}${d.place ? " · " + esc(d.place) : ""}</p>
      <p style="font-size:14px;white-space:pre-wrap;margin-bottom:16px">${esc(d.content)}</p>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" id="diaryEdit">${I("pencil")} 수정</button>
        <button class="btn btn-danger btn-sm" id="diaryDel">삭제</button>
      </div>
    `);
    $("diaryEdit").onclick = () => openModal("diary", id);
    $("diaryDel").onclick = () => {
      if (!confirm("이 기록을 삭제할까요?")) return;
      S.archives = S.archives.filter((x) => x.id !== id);
      save(); closeModal(); renderArchive();
    };
  }

  function linkIcon(url) {
    try {
      const h = new URL(url).hostname;
      if (/x\.com|twitter/.test(h)) return "𝕏";
      if (/youtu/.test(h)) return I("play");
      if (/instagram/.test(h)) return I("camera");
      if (/tiktok/.test(h)) return I("music");
      if (/weverse/.test(h)) return I("globe");
      return I("link");
    } catch (e) { return I("link"); }
  }

  const PLATS = { x: "X", youtube: "유튜브", instagram: "인스타", tiktok: "틱톡", weverse: "위버스", other: "기타" };
  function linkPlatform(url) {
    try {
      const h = new URL(url).hostname;
      if (/x\.com|twitter/.test(h)) return "x";
      if (/youtu/.test(h)) return "youtube";
      if (/instagram/.test(h)) return "instagram";
      if (/tiktok/.test(h)) return "tiktok";
      if (/weverse/.test(h)) return "weverse";
      return "other";
    } catch (e) { return "other"; }
  }

  function addLink() {
    let url = $("linkInput").value.trim();
    if (!url) return toast("링크를 붙여넣어 주세요!");
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url; // 스킴 없으면 https 보정
    let p;
    try { p = new URL(url); } catch (e) { return toast("올바른 링크가 아니에요 (https://… 형식)"); }
    if (p.protocol !== "http:" && p.protocol !== "https:") return toast("http/https 링크만 저장할 수 있어요");
    S.links.unshift({ id: uid(), biasId: S.currentBias, url, label: $("linkLabel").value.trim(), date: todayKey(), read: false });
    $("linkInput").value = ""; $("linkLabel").value = "";
    save(); renderLinks(); toast("링크를 보관함에 저장했어요 (나중에 보기로 담김)");
  }

  function renderLinks() {
    const all = byBias(S.links);
    const unread = all.filter((l) => !l.read).length;
    // 저장된 링크에 실제로 있는 플랫폼만 칩으로
    const present = [];
    all.forEach((l) => { const p = linkPlatform(l.url); if (!present.includes(p)) present.push(p); });
    const fr = $("linkFilters");
    if (fr) {
      fr.innerHTML =
        `<button class="f-chip ${linkFilter === "all" ? "active" : ""}" data-lf="all">전체 ${all.length}</button>`
        + `<button class="f-chip lk-unread-chip ${linkFilter === "unread" ? "active" : ""}" data-lf="unread">${I("clock")} 나중에 보기 ${unread}</button>`
        + present.map((p) => `<button class="f-chip ${linkFilter === "p:" + p ? "active" : ""}" data-lf="p:${p}">${PLATS[p]}</button>`).join("");
      fr.querySelectorAll(".f-chip").forEach((ch) => { ch.onclick = () => { linkFilter = ch.dataset.lf; renderLinks(); }; });
    }
    let links = all;
    if (linkFilter === "unread") links = all.filter((l) => !l.read);
    else if (linkFilter.startsWith("p:")) { const p = linkFilter.slice(2); links = all.filter((l) => linkPlatform(l.url) === p); }

    $("linkList").innerHTML = links.length
      ? links.map((l) => `
        <li class="${l.read ? "lk-read" : ""}">
          <span class="lk-ico">${linkIcon(l.url)}</span>
          <div class="lk-main">
            <div class="lk-label">${esc(l.label) || "저장한 링크"}<span class="lk-plat">${PLATS[linkPlatform(l.url)]}</span></div>
            <a class="lk-url" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.url)}</a>
          </div>
          <button class="lk-read-btn ${l.read ? "done" : ""}" data-read="${l.id}" title="${l.read ? "안 본 것으로 되돌리기" : "다 봤어요"}">${l.read ? I("check") : I("clock")}</button>
          <button class="dl-del" data-id="${l.id}">${I("x")}</button>
        </li>`).join("")
      : `<li class="day-empty">${linkFilter === "unread"
          ? "나중에 볼 링크가 없어요! 다 봤네요 👏"
          : "카톡 대신 여기에 모아두세요!<br>X 직캠, 유튜브 자컨, 인스타 링크 무엇이든"}</li>`;
    $("linkList").querySelectorAll(".dl-del").forEach((b) => {
      b.onclick = () => { S.links = S.links.filter((l) => l.id !== b.dataset.id); save(); renderLinks(); };
    });
    $("linkList").querySelectorAll(".lk-read-btn").forEach((b) => {
      b.onclick = () => {
        const l = S.links.find((x) => x.id === b.dataset.read);
        if (l) { l.read = !l.read; save(); renderLinks(); toast(l.read ? "다 봤어요 표시했어요" : "다시 나중에 보기로"); }
      };
    });
  }

  /* ═══════════ 스타일북 ═══════════ */
  function styleTab(mode) {
    styleMode = mode;
    document.querySelectorAll("[data-stab]").forEach((t) => t.classList.toggle("active", t.dataset.stab === mode));
    renderStyle();
  }

  function renderStyle() {
    const all = byBias(S.styles);
    let items = all;
    if (styleMode !== "all") items = all.filter((s) => s.status === styleMode);
    const stats = $("styleStats");
    if (stats) {
      const got = all.filter((s) => s.status === "bought").length;
      stats.textContent = all.length ? `전체 ${all.length} · 위시 ${all.length - got} · 겟 ${got}` : "";
    }
    $("styleList").innerHTML = items.length
      ? items.map((s) => `
        <div class="st-card" data-sedit="${s.id}">
          <div class="st-img" ${s.img ? `style="background-image:url(${s.img})"` : ""}>${s.img ? "" : I("tag")}</div>
          <button class="st-status ${s.status}" data-id="${s.id}">${s.status === "bought" ? `${I("check")} 겟!` : `${I("heart")} 위시`}</button>
          <div class="st-body">
            <div class="st-name">${esc(s.name)}</div>
            <div class="st-info">${esc(s.category || "")}${s.info ? " · " + esc(s.info) : ""}</div>
            ${s.link ? `<a class="st-link" href="${esc(safeUrl(s.link))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${I("link")} 구매처</a>` : ""}
          </div>
        </div>`).join("")
      : `<div class="style-empty">최애가 입은 옷, 신발, 액세서리를 기록해 보세요 ✦<br>직접 구매하면 '겟!'으로 바꿀 수 있어요</div>`;
    $("styleList").querySelectorAll(".st-status").forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const it = S.styles.find((s) => s.id === b.dataset.id);
        it.status = it.status === "bought" ? "wish" : "bought";
        save(); renderStyle();
        if (it.status === "bought") toast("겟 완료! 최애템 +1");
      };
    });
    $("styleList").querySelectorAll("[data-sedit]").forEach((c) => {
      c.onclick = () => openModal("styleItem", c.dataset.sedit);
    });
  }

  /* ═══════════ 설정 ═══════════ */
  function renderSettings() {
    // 덕질 유형 프리셋
    renderPresetButtons($("presetTabs"), S.preset || "idol", setPreset);
    // 최애 목록
    $("biasList").innerHTML = S.biases.map((b) => `
      <li class="${b.id === S.currentBias ? "current" : ""}">
        <div class="bl-avatar" ${b.photo ? `style="background-image:url(${b.photo})"` : ""}></div>
        <div class="bl-main">
          <div class="bl-name">${esc(b.name)}</div>
          <div class="bl-sub">${esc(b.group || "")} ${b.startDate ? "· D+" + dPlus(b.startDate) : ""}</div>
        </div>
        ${b.id === S.currentBias
          ? `<span class="badge-accent">현재</span>`
          : `<button class="chip-btn" data-switch="${b.id}">전환</button>`}
        <button class="chip-btn" data-edit="${b.id}">수정</button>
      </li>`).join("");
    $("biasList").querySelectorAll("[data-switch]").forEach((b) => {
      b.onclick = () => { S.currentBias = b.dataset.switch; save(); renderAll(); toast("최애를 전환했어요!"); };
    });
    $("biasList").querySelectorAll("[data-edit]").forEach((b) => {
      b.onclick = () => openModal("bias", b.dataset.edit);
    });
    renderSwatches();
    const scc = $("setColorChip"), sch = $("setColorHex");
    if (scc) { scc.style.background = S.accent; sch.textContent = S.accent.toUpperCase(); }
    renderTplThumbs($("setTplThumbs"), S.template || "profile", setTemplate);
    const mt = $("modeTabs");
    if (mt) {
      mt.innerHTML = MODES.map(([id, name]) =>
        `<button class="tab ${(S.mode || "") === id ? "active" : ""}" data-mode-btn="${id}">${name}</button>`).join("");
      mt.querySelectorAll("[data-mode-btn]").forEach((b) => {
        b.onclick = () => setMode(b.dataset.modeBtn);
      });
    }
    const st = $("skinTabs");
    if (st) {
      st.innerHTML = SKINS.map(([id, name]) =>
        `<button class="tab ${(S.retroSkin || "browser") === id ? "active" : ""}" data-skin-btn="${id}">${name}</button>`).join("");
      st.querySelectorAll("[data-skin-btn]").forEach((b) => {
        b.onclick = () => setRetroSkin(b.dataset.skinBtn);
      });
    }
    const ntsw = $("notifySwitch");
    if (ntsw) ntsw.classList.toggle("on", !!S.notifyTicket);
    const hsw = $("hapticSwitch");
    if (hsw) hsw.classList.toggle("on", S.haptics !== false);
    const vr = $("veilRange"), vv = $("veilVal");
    if (vr) vr.value = S.veil || 0;
    if (vv) vv.textContent = (S.veil || 0) + "%";
    // 콘텐츠 배경 농도는 '기본 모드 + 배경패턴 선택 + 창모드 아님'일 때만 효과 있음 → 그 외엔 비활성화
    const veilOn = !S.mode && S.bg && S.bg !== "none" && !S.retro;
    const vf = $("veilField");
    if (vf) vf.classList.toggle("dim", !veilOn);
    if (vr) vr.disabled = !veilOn;
    const bt = $("bgTabs");
    if (bt) {
      bt.innerHTML = BGS.map(([id, name]) =>
        `<button class="tab ${(S.bg || "none") === id ? "active" : ""}" data-bg-btn="${id}"><i class="bgp bgp-${id}"></i>${name}</button>`).join("");
      bt.classList.toggle("dim", NO_BG_MODES.includes(S.mode));
      bt.querySelectorAll("[data-bg-btn]").forEach((b) => {
        b.onclick = () => setBg(b.dataset.bgBtn);
      });
    }
    const pt = $("posTabs");
    if (pt) {
      pt.innerHTML = POSES.map(([id, name]) =>
        `<button class="tab ${(S.retroPos || "float") === id ? "active" : ""}" data-pos-btn="${id}">${name}</button>`).join("");
      pt.querySelectorAll("[data-pos-btn]").forEach((b) => {
        b.onclick = () => setRetroPos(b.dataset.posBtn);
      });
    }
    const at = $("alignTabs");
    if (at) {
      at.innerHTML = ALIGNS.map(([id, name]) =>
        `<button class="tab ${(S.align || "left") === id ? "active" : ""}" data-align-btn="${id}">${name}</button>`).join("");
      at.querySelectorAll("[data-align-btn]").forEach((b) => {
        b.onclick = () => setAlign(b.dataset.alignBtn);
      });
    }
    const ps = $("patstyleTabs");
    if (ps) {
      ps.innerHTML = PATSTYLES.map(([id, name]) =>
        `<button class="tab ${(S.patstyle || "scatter") === id ? "active" : ""}" data-patstyle-btn="${id}">${name}</button>`).join("");
      ps.classList.toggle("dim", NO_BG_MODES.includes(S.mode) || !PATSTYLE_BGS.includes(S.bg));
      ps.querySelectorAll("[data-patstyle-btn]").forEach((b) => {
        b.onclick = () => setPatStyle(b.dataset.patstyleBtn);
      });
    }
  }

  function renderSwatches() {
    const grid = $("setSwatches");
    if (!grid) return;
    grid.innerHTML = "";
    SWATCHES.forEach(([name, hex]) => {
      const b = document.createElement("button");
      b.className = "swatch" + (hex.toLowerCase() === S.accent.toLowerCase() ? " active" : "");
      b.title = name;
      b.style.background = hex;
      b.onclick = () => {
        S.accent = hex; save(); applyTheme(); renderSwatches();
        // 직접 선택 칩·코드도 같이 갱신 (설정·온보딩 둘 다)
        [["setColorChip", "setColorHex"], ["obColorChip", "obColorHex"]].forEach(([c, h]) => {
          const chip = $(c), hx = $(h);
          if (chip) chip.style.background = S.accent;
          if (hx) hx.textContent = S.accent.toUpperCase();
        });
      };
      grid.appendChild(b);
    });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `my-star-calendar-backup-${todayKey()}.json`;
    a.click();
    toast("백업 파일을 내려받았어요");
  }

  function importData(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.biases) throw new Error("형식 오류");
        S = Object.assign(defaults(), data);
        save(); applyTheme(); renderAll();
        toast("데이터를 불러왔어요!");
      } catch (e) { toast("백업 파일을 읽을 수 없어요"); }
    };
    r.readAsText(file);
  }

  function resetAll() {
    if (!confirm("정말 모든 데이터를 삭제할까요?\n(되돌릴 수 없어요. 백업을 먼저 권장해요!)")) return;
    localStorage.removeItem(LS_KEY);
    try { indexedDB.deleteDatabase(AUDIO_DB); } catch (e) {} // 저장한 음원 파일도 함께 삭제
    try { indexedDB.deleteDatabase(IMG_DB); } catch (e) {} // 저장한 포카 사진도 함께 삭제
    location.reload();
  }

  /* ═══════════ 모달 ═══════════ */
  let modalPhotoData = null;

  // 폼 라벨 연결: .field 안의 label ↔ 입력칸을 for/id로 자동 매칭 (접근성 표준)
  function linkFieldLabels(root) {
    (root || document).querySelectorAll(".field").forEach((f) => {
      const label = f.querySelector("label");
      const input = f.querySelector("input, select, textarea");
      if (!label || !input || label.htmlFor) return;
      if (!input.id) input.id = "fld-" + Math.random().toString(36).slice(2, 9);
      label.htmlFor = input.id;
    });
  }

  let modalLastFocus = null;
  function openModalRaw(title, bodyHtml) {
    modalLastFocus = document.activeElement; // 닫을 때 포커스 복원용
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    linkFieldLabels($("modalBody"));
    $("modalBackdrop").classList.remove("hidden");
    var _sbw = window.innerWidth - document.documentElement.clientWidth; // 스크롤바 폭
    document.body.style.overflow = "hidden";
    if (_sbw > 0) document.body.style.paddingRight = _sbw + "px"; // 스크롤바 사라짐 보정(화면 밀림 방지)
    // 접근성: 모달 열리면 다이얼로그로 포커스 이동(모바일 키보드 갑툭튀 방지 위해 입력란 대신 컨테이너에)
    const box = $("modalBox");
    box.tabIndex = -1;
    box.focus();
  }

  function closeModal() {
    $("modalBox").classList.remove("wide");
    $("modalBackdrop").classList.add("hidden");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    modalPhotoData = null;
    // 모달을 연 요소로 포커스 복원
    if (modalLastFocus && modalLastFocus.focus) { try { modalLastFocus.focus(); } catch (_) {} }
    modalLastFocus = null;
  }

  function backdropClose(e) {
    if (e.target === $("modalBackdrop")) closeModal();
  }

  function photoPickHtml(label) {
    return `
      <label class="photo-pick" id="mpBox">
        <input type="file" accept="image/*" id="mpInput" hidden>
        <span id="mpHint">${label || "+ 사진 추가 (선택)"}</span>
        <img id="mpPreview" class="hidden" alt="">
      </label>`;
  }
  function bindPhotoPick(maxW) {
    modalPhotoData = null;
    const box = $("mpBox");
    if (!box) return;
    // 라벨(mpBox)이 파일 입력을 자동으로 열기 때문에 onclick으로 또 열지 않음
    $("mpInput").onchange = (e) => {
      const f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      fileToData(f, maxW || 700, (data) => {
        modalPhotoData = data;
        $("mpPreview").src = data;
        $("mpPreview").classList.remove("hidden");
        $("mpHint").classList.add("hidden");
      });
    };
  }

  let modalPhotosData = [];
  function photosPickHtml() {
    return `<div class="photos-pick" id="mpsGrid"></div>`;
  }
  function renderPhotosGrid() {
    const g = $("mpsGrid");
    if (!g) return;
    g.innerHTML = modalPhotosData.map((d, i) => `
      <span class="pp-thumb"><img src="${d}" alt=""><button class="pp-x" data-ppx="${i}">${I("x")}</button></span>`).join("")
      + (modalPhotosData.length < 5 ? `<label class="pp-add"><input type="file" accept="image/*" multiple hidden id="mpsInput">+<small>사진 (${modalPhotosData.length}/5)</small></label>` : "");
    g.querySelectorAll("[data-ppx]").forEach((b) => {
      b.onclick = (e) => { e.preventDefault(); modalPhotosData.splice(+b.dataset.ppx, 1); renderPhotosGrid(); };
    });
    const inp = $("mpsInput");
    if (inp) inp.onchange = (e) => {
      [...e.target.files].slice(0, 5 - modalPhotosData.length).forEach((f) => {
        fileToData(f, 900, (data) => { modalPhotosData.push(data); renderPhotosGrid(); });
      });
      e.target.value = "";
    };
  }
  function bindPhotosPick(existing) {
    modalPhotosData = (existing || []).slice();
    renderPhotosGrid();
  }

  /* 공지사항 목록 HTML */
  function noticesHtml() {
    var head = "";
    if (_updateAvailable) {
      head = '<div style="display:flex;align-items:center;gap:10px;justify-content:space-between;background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:12px 14px;margin-bottom:14px">'
        + '<div style="min-width:0"><b style="font-size:13.5px">✨ 새 버전이 나왔어요</b>'
        + '<div style="font-size:12px;color:var(--muted);margin-top:2px;line-height:1.45">저장된 기록은 그대로예요. 작성 중인 내용이 있으면 먼저 등록해 주세요.</div></div>'
        + '<button id="noticeUpdateReload" class="btn btn-primary btn-sm" style="flex:0 0 auto">새로고침</button></div>';
    }
    if (!NOTICES.length) return head + `<p class="notice-empty">아직 공지가 없어요.</p>`;

    const seen = S.seenNotice || 0;
    const sorted = NOTICES.slice().sort((a, b) => b.id - a.id); // 최신순
    const RECENT = 2;                                   // 위에는 최신 공지 2개만
    const pinned = sorted.find((n) => n.pin) || null;  // 맨 아래 고정(pin:true 표시한 공지 — '오픈 베타 시작')
    const recent = sorted.filter((n) => n !== pinned).slice(0, RECENT);
    const restCount = sorted.length - recent.length - (pinned ? 1 : 0); // 페이지로 넘어가는 개수

    const itemHtml = (n) => {
      const c = NOTICE_CATS[n.cat] || NOTICE_CATS.info;
      const isNew = n.id > seen;
      const acc = !isNew;              // 새 공지는 펼침, 읽은 공지는 접힌 아코디언
      return `<div class="notice-item${acc ? " notice-acc" : ""}">
        <div class="notice-summary">
          <div class="notice-top">
            <span class="notice-cat" style="background:var(${c.color})">${c.label}</span>
            ${isNew ? `<span class="notice-new">NEW</span>` : ""}
            <span class="notice-date">${n.date}</span>
            ${acc ? `<span class="notice-arrow" aria-hidden="true">⌄</span>` : ""}
          </div>
          <h4 class="notice-title">${esc(n.title)}</h4>
        </div>
        <p class="notice-body">${esc(n.body)}</p>
      </div>`;
    };

    let html = head + `<div class="notice-list">`;
    html += recent.map(itemHtml).join("");                    // 최신 2개
    if (pinned) html += `<div class="notice-pinned">` + itemHtml(pinned) + `</div>`; // 안내 고정
    html += `</div>`;
    html += `<a class="notice-allbtn" href="notices.html">공지사항 전체 보기${restCount > 0 ? ` <span>지난 공지 ${restCount}개</span>` : ""} →</a>`;
    return html;
  }

  /* 사이드바·더보기 공지 배지(빨간 점) 갱신 */
  function updateNoticeBadge() {
    const show = hasUnseenNotices() || _updateAvailable;
    ["noticeDotSide", "noticeDotTop"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", !show);
    });
  }

  function openModal(type, editId) {
    closeFab();
    const baseDate = selDate || todayKey();

    /* 공지사항 */
    if (type === "notices") {
      openModalRaw("공지사항", noticesHtml());
      S.seenNotice = latestNoticeId();
      save();
      updateNoticeBadge();
      var _ub = document.getElementById("noticeUpdateReload");
      if (_ub) _ub.onclick = doUpdateReload;
      // 읽은 공지 아코디언 펼치기/접기
      $("modalBody").querySelectorAll(".notice-acc .notice-summary").forEach(function (s) {
        s.onclick = function () { s.parentElement.classList.toggle("open"); };
      });
      return;
    }

    /* 일정 등록/수정 */
    if (type === "schedule") {
      const edit = editId ? S.schedules.find((x) => x.id === editId) : null;
      openModalRaw(edit ? "일정 수정" : "일정 등록", `
        <div class="field"><label>제목 *</label><input type="text" id="mTitle" placeholder="예) 컴백 쇼케이스"></div>
        <div class="field"><label>구분 <small>(오프라인 행사 / 온라인 활동)</small></label>
          <div class="seg" id="mSchedMode">
            <button type="button" data-sm="offline">${I("pin")} 오프라인</button>
            <button type="button" data-sm="online">${I("monitor")} 온라인</button>
          </div>
        </div>
        <div class="field"><label>카테고리</label>
          <select id="mCat">${Object.entries(CATS).map(([k, c]) => `<option value="${k}">${c.name}</option>`).join("")}</select>
        </div>
        <div class="field"><label>날짜 *</label><input type="date" id="mDate" value="${baseDate}"></div>
        <div class="field"><label>시간</label><input type="time" id="mTime"></div>
        <div class="field"><label>장소</label><input type="text" id="mPlace" placeholder="예) 잠실실내체육관"></div>
        <div class="field"><label>링크 <small>(티켓팅이면 예매처 링크!)</small></label><input type="url" id="mLink" placeholder="https://"></div>
        <div class="field"><label>메모</label><input type="text" id="mMemo"></div>
        ${edit ? "" : `<div class="field"><label>반복 <small>(같은 요일·날짜로 미리 등록돼요)</small></label>
          <select id="mRepeat">
            <option value="">반복 없음</option>
            <option value="w">매주</option>
            <option value="2w">2주마다</option>
            <option value="m">매달</option>
          </select></div>
        <div class="field hidden" id="mRepEndWrap"><label>반복 종료일</label><input type="date" id="mRepEnd"></div>`}
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
        ${edit && edit.groupId ? `<button class="btn btn-danger btn-lg slim" id="mDelGroup">이 반복 일정 전체 삭제</button>` : ""}
      `);
      let schedMode = edit ? (edit.mode || (edit.cat === "broadcast" ? "online" : "offline")) : "offline";
      const syncSchedMode = () => {
        $("mSchedMode").querySelectorAll("[data-sm]").forEach((b) => {
          b.classList.toggle("active", b.dataset.sm === schedMode);
          b.onclick = () => { schedMode = b.dataset.sm; syncSchedMode(); };
        });
      };
      syncSchedMode();
      const mr = $("mRepeat");
      if (mr) mr.onchange = () => {
        $("mRepEndWrap").classList.toggle("hidden", !mr.value);
        if (mr.value && !$("mRepEnd").value) {
          const d = new Date($("mDate").value || baseDate);
          d.setMonth(d.getMonth() + 3);
          $("mRepEnd").value = fmtDate(d);
        }
      };
      const dg = $("mDelGroup");
      if (dg) dg.onclick = () => {
        if (!confirm("같은 반복 묶음의 일정을 모두 삭제할까요?")) return;
        S.schedules = S.schedules.filter((x) => x.groupId !== edit.groupId);
        save(); closeModal(); renderCalendar(); renderHome();
        toast("반복 일정을 모두 삭제했어요");
      };
      if (edit) {
        $("mTitle").value = edit.title;
        $("mCat").value = edit.cat;
        $("mDate").value = edit.date;
        $("mTime").value = edit.time || "";
        $("mPlace").value = edit.place || "";
        $("mLink").value = edit.link || "";
        $("mMemo").value = edit.memo || "";
        $("mSave").textContent = "수정 완료";
      }
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        if (!title) return toast("제목을 입력해 주세요!");
        if (!$("mDate").value) return toast("날짜를 골라주세요!");
        const data = {
          title, cat: $("mCat").value, mode: schedMode, date: $("mDate").value, time: $("mTime").value,
          place: $("mPlace").value.trim(), link: $("mLink").value.trim(), memo: $("mMemo").value.trim(),
        };
        if (edit) Object.assign(edit, data);
        else {
          const rep = $("mRepeat") ? $("mRepeat").value : "";
          if (rep) {
            const until = $("mRepEnd").value || data.date;
            const groupId = uid();
            let d = new Date(data.date), n = 0;
            while (fmtDate(d) <= until && n < 60) {
              S.schedules.push({ id: uid(), biasId: S.currentBias, ...data, date: fmtDate(d), groupId });
              if (rep === "w") d.setDate(d.getDate() + 7);
              else if (rep === "2w") d.setDate(d.getDate() + 14);
              else d.setMonth(d.getMonth() + 1);
              n++;
            }
            toast(`반복 일정 ${n}개를 등록했어요`);
          } else {
            S.schedules.push({ id: uid(), biasId: S.currentBias, ...data });
            toast("일정을 등록했어요");
          }
        }
        save(); closeModal();
        selDate = data.date;
        renderCalendar(); renderHome();
        if (edit) toast("일정을 수정했어요");
      };
      return;
    }

    /* 지출 기록/수정 */
    if (type === "expense") {
      const edit = editId ? S.expenses.find((x) => x.id === editId) : null;
      openModalRaw(edit ? "지출 수정" : "지출 기록", `
        <div class="field"><label>내용 *</label><input type="text" id="mTitle" placeholder="예) 미니앨범 5집 공구"></div>
        <div class="field"><label>금액 (원) *</label><input type="number" id="mAmount" placeholder="35000" min="0"></div>
        <div class="field"><label>카테고리</label>
          <select id="mCat">${EXP_CATS.map((c) => `<option>${c}</option>`).join("")}</select>
        </div>
        <div class="field"><label>결제 수단</label>
          <select id="mPay">${PAY_METHODS.map((p) => `<option>${p}</option>`).join("")}</select>
        </div>
        <div class="field"><label>날짜</label><input type="date" id="mDate" value="${todayKey()}"></div>
        <div class="field"><label>메모 <small>(왜 샀는지, 어디가 이뻤는지)</small></label><input type="text" id="mMemo"></div>
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
      `);
      if (edit) {
        $("mTitle").value = edit.title;
        $("mAmount").value = edit.amount;
        $("mCat").value = edit.category;
        $("mPay").value = edit.pay || PAY_METHODS[0];
        $("mDate").value = edit.date;
        $("mMemo").value = edit.memo || "";
        $("mSave").textContent = "수정 완료";
      }
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        const amount = +$("mAmount").value;
        if (!title || !amount) return toast("내용과 금액을 입력해 주세요!");
        const data = {
          title, amount, category: $("mCat").value, pay: $("mPay").value,
          date: $("mDate").value || todayKey(), memo: $("mMemo").value.trim(),
        };
        if (edit) Object.assign(edit, data);
        else S.expenses.push({ id: uid(), biasId: S.currentBias, ...data });
        save(); closeModal(); renderLedger(); renderHome();
        toast(edit ? "지출 내역을 수정했어요" : "행복 비용을 기록했어요");
      };
      return;
    }

    /* 후기(일기) 등록/수정 */
    if (type === "diary") {
      const edit = editId ? S.archives.find((x) => x.id === editId) : null;
      openModalRaw(edit ? "후기 수정" : "후기 쓰기", `
        <div class="seg" id="mModeSeg">
          <button type="button" data-mm="offline">${I("pin")} 오프라인</button>
          <button type="button" data-mm="online">${I("monitor")} 온라인</button>
        </div>
        ${photosPickHtml()}
        <div class="field"><label>제목 *</label><input type="text" id="mTitle" placeholder="예) 첫 콘서트 다녀온 날"></div>
        <div class="field"><label>날짜</label><input type="date" id="mDate" value="${baseDate}"></div>
        <div class="field"><label>유형</label>
          <select id="mEtype">${effArchTypes("offline").map((t) => `<option>${esc(t)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>장소</label><input type="text" id="mPlace" placeholder="예) 고척돔"></div>
        <div class="field"><label>오늘의 기록 *</label><textarea id="mContent" placeholder="현장의 공기, 최애의 표정, 잊고 싶지 않은 순간들…"></textarea></div>
        <button class="btn btn-primary btn-lg" id="mSave">기록 남기기</button>
      `);
      bindPhotosPick(edit ? edit.imgs : []);
      let dMode = edit ? (edit.mode || "offline") : archMode;
      const syncModeUI = () => {
        $("mModeSeg").querySelectorAll("[data-mm]").forEach((b) => {
          b.classList.toggle("active", b.dataset.mm === dMode);
          b.onclick = () => { dMode = b.dataset.mm; syncModeUI(); };
        });
        const keep = $("mEtype").value;
        $("mEtype").innerHTML = effArchTypes(dMode).map((t) => `<option>${esc(t)}</option>`).join("");
        if (archTypes(dMode).includes(keep)) $("mEtype").value = keep;
      };
      syncModeUI();
      if (edit) {
        $("mTitle").value = edit.title;
        $("mDate").value = edit.date || "";
        $("mEtype").value = edit.etype || "기타";
        $("mPlace").value = edit.place || "";
        $("mContent").value = edit.content;
        $("mSave").textContent = "수정 완료";
      }
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim(), content = $("mContent").value.trim();
        if (!title || !content) return toast("제목과 내용을 입력해 주세요!");
        if (edit) {
          Object.assign(edit, { title, content, date: $("mDate").value, place: $("mPlace").value.trim(), etype: $("mEtype").value, mode: dMode, imgs: modalPhotosData.slice() });
        } else {
          S.archives.push({
            id: uid(), biasId: S.currentBias, title, content,
            date: $("mDate").value, place: $("mPlace").value.trim(), etype: $("mEtype").value, mode: dMode, imgs: modalPhotosData.slice(),
          });
        }
        const onCal = document.querySelector(".page.active")?.id === "page-calendar";
        save(); closeModal(); archMode = dMode; renderArchive();
        if (onCal) { renderCalendar(); }
        else { go("archive"); archiveTab("diary"); }
        toast(edit ? "기록을 수정했어요" : "소중한 기록을 남겼어요");
      };
      return;
    }

    /* 커스텀 기념일 추가 */
    if (type === "anniv") {
      openModalRaw("기념일 추가", `
        <div class="field"><label>이름 *</label><input type="text" id="mTitle" placeholder="예) 첫 팬미팅, 입덕일 1주년"></div>
        <div class="field"><label>날짜 * <small>(매년 돌아와요)</small></label>${dateSelectHTML("mDate", "", { yearsFwd: 1 })}</div>
        <button class="btn btn-primary btn-lg" id="mSave">추가</button>`);
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        if (!title || !dateSelectVal("mDate")) return toast("이름과 날짜를 입력해 주세요!");
        const b = curBias();
        if (!b) return toast("먼저 최애를 등록해 주세요!");
        if (!b.annivs) b.annivs = [];
        b.annivs.push({ id: uid(), title, date: dateSelectVal("mDate") });
        save(); closeModal(); renderProfile(); renderHome(); renderCalendar();
        toast("기념일을 추가했어요");
      };
      return;
    }

    /* 포카 추가/수정 */
    if (type === "poca") {
      const edit = editId ? S.photocards.find((x) => x.id === editId) : null;
      openModalRaw(edit ? "포카 수정" : "포카 등록", `
        ${photoPickHtml("+ 포카 사진 추가")}
        <div class="field"><label>이름 / 버전 *</label><input type="text" id="mTitle" placeholder="예) 트레카 A버전"></div>
        <div class="field"><label>앨범 / 출처</label><input type="text" id="mAlbum" placeholder="예) 미니 5집, 시즌그리팅"></div>
        <div class="field"><label>상태</label>
          <select id="mPStatus"><option value="own">보유</option><option value="wish">위시</option><option value="trade">교환 중</option></select>
        </div>
        <div class="field"><label>메모</label><input type="text" id="mMemo" placeholder="교환처, 구매가 등"></div>
        <button class="btn btn-primary btn-lg" id="mSave">바인더에 넣기</button>
      `);
      bindPhotoPick(500);
      if (edit) {
        $("mTitle").value = edit.name || "";
        $("mAlbum").value = edit.album || "";
        $("mPStatus").value = edit.status;
        $("mMemo").value = edit.memo || "";
        if (edit.img) { $("mpPreview").src = edit.img; $("mpPreview").classList.remove("hidden"); $("mpHint").classList.add("hidden"); }
        $("mSave").textContent = "수정 완료";
      }
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name && !modalPhotoData && !(edit && edit.img)) return toast("사진 또는 이름을 넣어주세요!");
        const status = $("mPStatus").value;
        const album = $("mAlbum").value.trim();
        if (edit) {
          Object.assign(edit, { name, album, memo: $("mMemo").value.trim(), status });
          if (modalPhotoData) { edit.img = modalPhotoData; delete edit.imgKey; } // 새 사진이면 키 새로 부여되게 비움
        } else {
          S.photocards.push({ id: uid(), biasId: S.currentBias, name, album, img: modalPhotoData, memo: $("mMemo").value.trim(), status });
        }
        save(); closeModal(); renderHome(); binderTab(status); go("binder");
        toast(edit ? "포카 정보를 수정했어요" : "바인더에 쏙 넣었어요");
      };
      return;
    }

    /* 스타일 아이템 등록/수정 */
    if (type === "styleItem") {
      const edit = editId ? S.styles.find((x) => x.id === editId) : null;
      openModalRaw(edit ? "스타일 아이템 수정" : "스타일 아이템 등록", `
        ${photoPickHtml("+ 아이템 사진 (선택)")}
        <div class="field"><label>아이템 이름 *</label><input type="text" id="mTitle" placeholder="예) 무대 착장 스니커즈"></div>
        <div class="field"><label>분류</label>
          <select id="mCat">${ST_CATS.map((c) => `<option>${c}</option>`).join("")}</select>
        </div>
        <div class="field"><label>브랜드 / 정보</label><input type="text" id="mInfo" placeholder="예) ○○브랜드, 12만원대"></div>
        <div class="field"><label>구매처 링크 <small>(선택 · 사고 싶은 곳 / 산 곳)</small></label><input type="url" id="mLink2" placeholder="https://"></div>
        <div class="field"><label>상태</label>
          <select id="mStatus"><option value="wish">위시</option><option value="bought">구매 완료</option></select>
        </div>
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
        ${edit ? `<button class="btn btn-danger btn-lg slim" id="mDelStyle">이 아이템 삭제</button>` : ""}
      `);
      bindPhotoPick(600);
      if (edit) {
        $("mTitle").value = edit.name;
        $("mCat").value = edit.category || ST_CATS[0];
        $("mInfo").value = edit.info || "";
        $("mLink2").value = edit.link || "";
        $("mStatus").value = edit.status;
        if (edit.img) { $("mpPreview").src = edit.img; $("mpPreview").classList.remove("hidden"); $("mpHint").classList.add("hidden"); }
        $("mSave").textContent = "수정 완료";
      }
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name) return toast("아이템 이름을 입력해 주세요!");
        const data = {
          name, category: $("mCat").value, info: $("mInfo").value.trim(),
          link: $("mLink2").value.trim(), status: $("mStatus").value,
        };
        if (edit) {
          Object.assign(edit, data);
          if (modalPhotoData) edit.img = modalPhotoData;
        } else {
          S.styles.push({ id: uid(), biasId: S.currentBias, img: modalPhotoData, ...data });
        }
        save(); closeModal(); renderStyle(); go("style");
        toast(edit ? "아이템을 수정했어요" : "스타일북에 기록했어요");
      };
      const ds = $("mDelStyle");
      if (ds) ds.onclick = () => {
        if (!confirm("이 아이템을 삭제할까요?")) return;
        S.styles = S.styles.filter((x) => x.id !== edit.id);
        save(); closeModal(); renderStyle();
        toast("아이템을 삭제했어요");
      };
      return;
    }

    /* 멤버십 카드 */
    if (type === "membership") {
      const m = S.membership;
      let mcStyle = m.style || "gradient";
      let mcPhoto = m.photo || null;
      openModalRaw("나만의 멤버십 카드", `
        <div class="mc-preview-wrap"><div class="member-card" id="mcPreview"></div></div>
        <p class="dt-label">카드 디자인</p>
        <div class="mc-presets" id="mcPresets">${MEMBERSHIP_STYLES.map(([k, l]) => `<button type="button" class="mc-preset mc-style-${k}" data-mcs="${k}">${l}</button>`).join("")}</div>
        <div class="field"><label>배경 사진 <small>(선택 · 넣으면 디자인 위에 덮여요)</small></label>${photoPickHtml("+ 카드 배경 사진")}</div>
        <button type="button" class="btn btn-ghost btn-sm${mcPhoto ? "" : " hidden"}" id="mcPhotoClear" style="margin:-4px 0 10px">사진 빼기</button>
        <div class="field"><label>카드 이름</label><input type="text" id="mTitle" value="${esc(m.title)}" maxlength="20"></div>
        <div class="field"><label>내 이름 (영문 추천)</label><input type="text" id="mName" value="${esc(m.name)}" maxlength="24"></div>
        <div class="field"><label>아이콘 (이모지 1개)</label><input type="text" id="mIcon" value="${esc(m.icon)}" maxlength="2"></div>
        <div class="field"><label>멤버 번호</label><input type="text" id="mNo" value="${esc(m.no)}" maxlength="10"></div>
        <div class="field"><label>멤버십 만료일 <small>(팬클럽 기간 관리)</small></label>${dateSelectHTML("mExpiry", m.expiry || "", { yearsBack: 2, yearsFwd: 8 })}</div>
        <button class="btn btn-primary btn-lg" id="mSave">카드 발급</button>
      `);
      const prev = $("mcPreview");
      const updatePreview = () => {
        const b = curBias();
        const since = b && b.startDate ? b.startDate.slice(0, 4) : "—";
        prev.className = "member-card mc-style-" + mcStyle + (mcPhoto ? " has-photo" : "");
        prev.style.backgroundImage = mcPhoto ? `linear-gradient(135deg, rgba(0,0,0,.55), rgba(0,0,0,.2)), url(${mcPhoto})` : "";
        prev.style.backgroundSize = mcPhoto ? "cover" : "";
        prev.style.backgroundPosition = mcPhoto ? "center" : "";
        prev.innerHTML =
          `<div class="mc-top"><span class="mc-logo">${esc($("mIcon").value || "✦")}</span><span class="mc-title">${esc($("mTitle").value || "MY STAR PASS")}</span></div>`
          + `<div class="mc-name">${esc($("mName").value || "MY NAME")}</div>`
          + `<div class="mc-foot"><span>SINCE ${since}</span><span>NO. ${esc($("mNo").value || "0001")}</span></div>`;
        $("mcPresets").querySelectorAll("[data-mcs]").forEach((x) => x.classList.toggle("on", x.dataset.mcs === mcStyle));
      };
      ["mTitle", "mName", "mIcon", "mNo"].forEach((id) => { $(id).oninput = updatePreview; });
      $("mcPresets").querySelectorAll("[data-mcs]").forEach((x) => { x.onclick = () => { mcStyle = x.dataset.mcs; updatePreview(); }; });
      // 배경 사진 업로드 (미리보기 즉시 반영) — 라벨이 입력을 자동으로 열므로 onclick 생략
      $("mpInput").onchange = (e) => {
        const f = e.target.files[0];
        e.target.value = "";
        if (!f) return;
        fileToData(f, 900, (data) => {
          mcPhoto = data;
          $("mpPreview").src = data; $("mpPreview").classList.remove("hidden"); $("mpHint").classList.add("hidden");
          $("mcPhotoClear").classList.remove("hidden");
          updatePreview();
        });
      };
      $("mcPhotoClear").onclick = () => {
        mcPhoto = null;
        $("mpPreview").classList.add("hidden"); $("mpHint").classList.remove("hidden");
        $("mcPhotoClear").classList.add("hidden");
        updatePreview();
      };
      if (mcPhoto) { $("mpPreview").src = mcPhoto; $("mpPreview").classList.remove("hidden"); $("mpHint").classList.add("hidden"); }
      updatePreview();
      $("mSave").onclick = () => {
        S.membership = {
          title: $("mTitle").value.trim() || "MY STAR PASS",
          name: $("mName").value.trim() || "MY NAME",
          icon: $("mIcon").value.trim() || "✦",
          no: $("mNo").value.trim() || "0001",
          expiry: dateSelectVal("mExpiry") || "",
          style: mcStyle,
          photo: mcPhoto || null,
        };
        save(); closeModal(); renderMemberCard();
        toast("나만의 멤버십 카드 저장 완료 ▥");
      };
      return;
    }

    /* 최애 추가/수정 */
    if (type === "bias") {
      const edit = editId ? S.biases.find((b) => b.id === editId) : null;
      openModalRaw(edit ? "최애 수정" : "최애 추가", `
        ${photoPickHtml(edit && edit.photo ? "사진 변경하려면 누르세요" : "+ 최애 사진")}
        <div class="field"><label>이름 *</label><input type="text" id="mTitle" value="${edit ? esc(edit.name) : ""}"></div>
        <div class="field"><label>그룹 / 소속</label><input type="text" id="mGroup" value="${edit ? esc(edit.group || "") : ""}"></div>
        <div class="field"><label>덕질 시작일 *</label>${dateSelectHTML("mStart", edit ? edit.startDate : todayKey(), { yearsFwd: 1 })}</div>
        <div class="field"><label>생일</label>${dateSelectHTML("mBirth", edit && edit.birthday ? edit.birthday : "", { yearsFwd: 1 })}</div>
        <div class="field"><label>데뷔일</label>${dateSelectHTML("mDebut", edit && edit.debutDate ? edit.debutDate : "", { yearsFwd: 1 })}</div>
        <button class="btn btn-primary btn-lg" id="mSave">${edit ? "수정 완료" : "추가"}</button>
        ${edit && S.biases.length > 1 ? `<button class="btn btn-danger btn-lg" id="mDel">이 최애 삭제</button>` : ""}
      `);
      bindPhotoPick(800);
      if (edit && edit.photo) {
        $("mpPreview").src = edit.photo;
        $("mpPreview").classList.remove("hidden");
        $("mpHint").classList.add("hidden");
      }
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name) return toast("이름을 입력해 주세요!");
        if (!dateSelectVal("mStart")) return toast("덕질 시작일을 골라주세요!");
        const data = {
          name, group: $("mGroup").value.trim(),
          startDate: dateSelectVal("mStart"),
          birthday: dateSelectVal("mBirth") || null,
          debutDate: dateSelectVal("mDebut") || null,
        };
        if (edit) {
          Object.assign(edit, data);
          if (modalPhotoData) edit.photo = modalPhotoData;
        } else {
          S.biases.push({ id: uid(), photo: modalPhotoData, ...data });
          S.currentBias = S.biases[S.biases.length - 1].id;
        }
        save(); closeModal(); renderAll();
        toast(edit ? "수정했어요!" : `${name} 추가! 잡덕의 길 환영해요`);
      };
      const delBtn = $("mDel");
      if (delBtn) delBtn.onclick = () => {
        if (!confirm(`${edit.name} 데이터(일정·포카 등 연결 기록 포함)를 삭제할까요?`)) return;
        S.biases = S.biases.filter((b) => b.id !== edit.id);
        ["schedules", "photocards", "expenses", "archives", "links", "styles"].forEach((k) => {
          S[k] = S[k].filter((x) => x.biasId !== edit.id);
        });
        if (S.currentBias === edit.id) S.currentBias = S.biases[0].id;
        save(); closeModal(); renderAll();
      };
      return;
    }
  }

  /* ═══════════ 전체 렌더 ═══════════ */
  function renderAll() {
    renderHome();
    renderProfile();
    renderCalendar();
    renderBinder();
    renderLedger();
    renderArchive();
    renderStyle();
    renderSettings();
    updateNoticeBadge();
  }

  /* ═══════════ 새 버전 감지 → '새로고침' 안내 배너 ═══════════
     version.json을 주기적으로 확인해, 이 세션이 처음 로드한 버전과 달라지면
     (= 그 사이 새 버전이 배포됨) 배너를 띄웁니다.
     자동 새로고침은 하지 않아요(작성 중이던 내용 보호) — 사용자가 직접 누르게 합니다.
     ▶ 배포할 때마다 version.json의 version 값만 새 값으로 올리면 됩니다. */
  let _runningVer = null, _dismissedVer = null, _updateAvailable = false;
  function fetchVersion() {
    try {
    return fetch("version.json?t=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j && j.version) || null)
      .catch(() => null);
    } catch (e) { return Promise.resolve(null); }
  }
  function checkVersion() {
    if (document.hidden) return;
    fetchVersion().then((v) => {
      if (v && _runningVer && v !== _runningVer) {
        _updateAvailable = true;
        updateNoticeBadge();
        if (v !== _dismissedVer) showUpdateBanner(v);
      }
    });
  }
  function initVersionCheck() {
    if (location.protocol === "file:") return; // 로컬(file://)에선 비활성화 — fetch 불가
    fetchVersion().then((v) => { _runningVer = v; });
    setInterval(checkVersion, 180000); // 3분마다
    document.addEventListener("visibilitychange", () => { if (!document.hidden) checkVersion(); });
    window.addEventListener("focus", checkVersion);
  }
  function doUpdateReload() {
    try { sessionStorage.setItem("msc.justUpdated", "1"); } catch (e) {}
    location.reload();
  }
  function showUpdateBanner(v) {
    if (document.getElementById("updateBanner")) return;
    const bar = document.createElement("div");
    bar.id = "updateBanner";
    bar.setAttribute("role", "status");
    bar.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:3px;margin-right:2px">' +
        '<span style="font-weight:700">✨ 새 버전이 나왔어요</span>' +
        '<span style="font-size:11.5px;opacity:.82;line-height:1.45">저장된 기록은 그대로예요.<br>작성 중인 내용이 있으면 먼저 등록해 주세요.</span>' +
      '</div>' +
      '<button id="ubReload">새로고침</button>' +
      '<button id="ubClose" aria-label="닫기">✕</button>';
    Object.assign(bar.style, {
      position: "fixed", left: "50%",
      bottom: "calc(var(--nav-h) + 18px + env(safe-area-inset-bottom, 0px))",
      transform: "translateX(-50%)", zIndex: "300",
      display: "flex", alignItems: "center", gap: "12px",
      background: "var(--line-strong)", color: "var(--bg)",
      padding: "12px 14px 12px 18px", borderRadius: "14px",
      boxShadow: "var(--shadow)", fontSize: "13.5px", maxWidth: "90vw",
    });
    document.body.appendChild(bar);
    const reload = bar.querySelector("#ubReload");
    Object.assign(reload.style, {
      background: "var(--bg)", color: "var(--text)", border: "none",
      borderRadius: "9px", padding: "7px 13px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
    });
    reload.onclick = () => {
      var bd = document.getElementById("modalBackdrop");
      var midInput = bd && !bd.classList.contains("hidden");
      if (midInput && !confirm("작성 중인 내용이 있어요. 새로고침하면 아직 '등록'하지 않은 입력은 사라질 수 있어요. 계속할까요?")) return;
      doUpdateReload();
    };
    const close = bar.querySelector("#ubClose");
    Object.assign(close.style, {
      background: "transparent", color: "var(--bg)", border: "none",
      fontSize: "14px", lineHeight: "1", cursor: "pointer", opacity: ".7", padding: "4px",
    });
    close.onclick = () => { bar.remove(); _dismissedVer = v; };
  }

  /* ═══════════ 시작 ═══════════ */
  function init() {
    load();
    applyTheme();
    // 온보딩 세로 중앙 정렬용: 인앱 브라우저 실제 보이는 높이를 px로 고정
    const setAppH = () =>
      document.documentElement.style.setProperty("--app-h", window.innerHeight + "px");
    setAppH();
    window.addEventListener("resize", setAppH);
    window.addEventListener("orientationchange", setAppH);
    if (!S.onboarded || !S.biases.length) {
      initOnboarding();
    } else {
      $("app").classList.remove("hidden");
      renderAll();
    }
    hydrateImages(); // IndexedDB에 보관된 포카 사진을 메모리로 복원 후 다시 그림
    linkFieldLabels(document); // 정적 폼(온보딩·설정·아카이브 등) 라벨 연결
    $("importFile").addEventListener("change", (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });
    $("profPhotoInput").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      fileToData(f, 800, (data) => {
        const b = curBias();
        if (b) { b.photo = data; save(); renderAll(); toast("프로필 사진을 바꿨어요"); }
      });
      e.target.value = "";
    });
    $("profCoverInput").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      fileToData(f, 1100, (data) => {
        const b = curBias();
        if (b) { b.cover = data; b.coverPos = { x: 50, y: 50 }; save(); renderAll(); toast("배경 사진을 바꿨어요"); }
      });
      e.target.value = "";
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
    // 접근성: 모달이 열려 있는 동안 Tab 포커스를 모달 안에 가둠(포커스 트랩)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const backdrop = $("modalBackdrop");
      if (!backdrop || backdrop.classList.contains("hidden")) return;
      const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const list = [...$("modalBox").querySelectorAll(sel)].filter((el) => el.offsetParent !== null);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // 접근성: onclick만 있는 비표준 인터랙티브 요소(div/span 등)를 키보드로도 조작 가능하게
    const NATIVE_INTERACTIVE = ["button", "a", "input", "select", "textarea"];
    document.querySelectorAll("[onclick]").forEach((el) => {
      if (NATIVE_INTERACTIVE.includes(el.tagName.toLowerCase())) return;
      if (el.classList.contains("modal-backdrop")) return; // 배경 클릭 닫기는 키보드 대상 아님(ESC로 닫힘)
      if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target;
      if (!el || !el.getAttribute || !el.hasAttribute("onclick")) return;
      if (NATIVE_INTERACTIVE.includes(el.tagName.toLowerCase())) return;
      e.preventDefault();
      el.click();
    });
    // 전역 오류 안전망: 예기치 못한 오류가 나도 앱이 조용히 멈추지 않도록 안내
    window.addEventListener("error", (e) => {
      if (e && (e.error || e.message)) { try { toast("일시적인 오류가 발생했어요. 화면을 새로고침해 주세요."); } catch (_) {} }
    });
    window.addEventListener("unhandledrejection", () => {
      try { toast("일시적인 오류가 발생했어요. 화면을 새로고침해 주세요."); } catch (_) {}
    });
    // 창 크기 변경 시 바인더 열·행 다시 계산 (활성 페이지일 때만)
    let _rsz;
    window.addEventListener("resize", () => {
      clearTimeout(_rsz);
      _rsz = setTimeout(() => {
        if (document.querySelector(".page.active") && document.querySelector(".page.active").id === "page-binder") renderBinder();
      }, 200);
    });
    const hw = $("heroWrap");
    if (hw) hw.addEventListener("pointerdown", coverDragStart);
    const hcv = $("homeCover");
    if (hcv) hcv.addEventListener("pointerdown", coverDragStart);
    const wheelZoom = (e) => {
      if (!posMode) return;
      e.preventDefault();
      const b = curBias();
      if (!b) return;
      setCoverZoom(coverFit(b, posTarget).zoom + (e.deltaY > 0 ? -6 : 6));
    };
    if (hw) hw.addEventListener("wheel", wheelZoom, { passive: false });
    if (hcv) hcv.addEventListener("wheel", wheelZoom, { passive: false });
    clockTimer = setInterval(tickClock, 1000);

    // 전체화면 스탠바이 시계 진입점 · 보정 컨트롤
    const liveClk = $("liveClock");
    if (liveClk) {
      liveClk.addEventListener("click", openStandby);
      liveClk.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStandby(); } });
    }
    const sbOpenBtn = $("sbOpenBtn");
    if (sbOpenBtn) sbOpenBtn.addEventListener("click", openStandby);
    const offRow = $("sbOffset");
    if (offRow) offRow.querySelectorAll("[data-off]").forEach((b) => { b.onclick = () => adjustOffset(+b.dataset.off); });
    const offReset = $("sbOffReset");
    if (offReset) offReset.onclick = resetOffset;
    // 화면 복귀 시 화면 꺼짐 방지 재요청 (Wake Lock은 탭 전환 시 해제됨)
    document.addEventListener("visibilitychange", () => { if (standbyOpen && document.visibilityState === "visible") reqWake(); });
    // 커스텀 날짜 드롭다운 (열기/선택/바깥클릭 닫기)
    document.addEventListener("click", handleDselClick);

    // 모바일 전용 '더보기' 페이지를 보던 중 PC 폭으로 바뀌면 설정으로 이동 (빈 화면 방지)
    if (window.matchMedia) {
      const mqDesk = window.matchMedia("(min-width: 980px)");
      const onDesk = (e) => {
        const more = $("page-more");
        if (e.matches && more && more.classList.contains("active")) go("settings");
      };
      if (mqDesk.addEventListener) mqDesk.addEventListener("change", onDesk);
      else if (mqDesk.addListener) mqDesk.addListener(onDesk);
      onDesk(mqDesk);
    }
    try {
      if (sessionStorage.getItem("msc.justUpdated")) {
        sessionStorage.removeItem("msc.justUpdated");
        setTimeout(function () { toast("최신 버전으로 업데이트됐어요 ✨"); }, 500);
      }
    } catch (e) {}
    initVersionCheck();
    tickClock();
  }

  /* 외부 공개 API */
  window.App = {
    obNext, obFinish, obSkip, extractFromPhoto,
    go, toggleFab, toggleDark, toggleRetro, setRetroSkin, setRetroPos, setBg, setAlign, setPatStyle, openFramePicker, openColorPicker, openBudget, openYearReview, toggleNotifyTicket, toggleHaptics, setVeil, setPreset, retroMin, retroMax, toggleDeco, toggleCoverPos, cardGo, coverDragStart, editCurrentBias, setTemplate, setMode,
    calMove, calToday, calJump, openStickerPicker, shareDay,
    binderTab, ledgerMove, archiveTab, styleTab,
    addLink, openModal, closeModal, backdropClose,
    exportData, resetAll,
    openStandby, closeStandby,
    toggleEditHome,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
