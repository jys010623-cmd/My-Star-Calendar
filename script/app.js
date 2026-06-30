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
  const hasUnseenNotices = () => NOTICES.some((n) => n.cat !== "patch" && n.id > (S.seenNotice || 0)); // 패치는 빨간 점 안 띄움

  /* ── 카테고리 정의 ── */
  // 덕질 유형 프리셋 — 캘린더 카테고리가 주제에 맞게 바뀜 (색은 위치순 팔레트 재사용)
  const PALETTE = ["--c-comeback", "--c-concert", "--c-ticket", "--c-birthday", "--c-broadcast", "--c-release", "--c-personal"];
  const PASTEL = ["#F4B7C7", "#AFD2F0", "#F7CBA4", "#FBE2A0", "#BBE3C0", "#CFBDEC", "#F3BCDD", "#BCE2DD", "#D8C7B0", "#C7D8B0"];
  // cats=캘린더 카테고리 / arch=아카이브 오프라인 기록 유형 / archOn=온라인 기록 유형
  const PRESETS = {
    idol:    { name: "아이돌", cats: [["comeback", "컴백"], ["concert", "콘서트"], ["ticket", "티켓팅"], ["birthday", "생일·생카"], ["broadcast", "방송·버블"], ["release", "발매·굿즈"], ["personal", "개인"]],
               arch: ["콘서트", "팬미팅", "팬사인회", "생일카페", "팝업스토어", "기타"], archOn: ["컴백", "발매", "음악방송", "방송", "라이브", "버블", "자컨", "MD", "기타"] },
    actor:   { name: "배우", cats: [["airing", "방영·개봉"], ["stage", "무대인사·시사회"], ["award", "시상식"], ["fanmeet", "팬미팅"], ["abday", "생일"], ["press", "화보·인터뷰"], ["personal", "개인"]],
               arch: ["무대인사", "시사회", "팬미팅", "전시·팝업", "기타"], archOn: ["방영·개봉", "시상식", "화보·인터뷰", "라이브 방송", "VOD·다시보기", "기타"] },
    vtuber:  { name: "버추얼", cats: [["stream", "방송·합방"], ["vconcert", "콘서트·행사"], ["vcontent", "신곡·컨텐츠"], ["vbday", "생일·기념일"], ["vgoods", "굿즈"], ["clip", "클립·다시보기"], ["personal", "개인"]],
               arch: ["오프 콘서트", "팝업", "팬미팅", "기타"], archOn: ["방송·합방", "신곡·컨텐츠", "생일·기념일", "콘서트 스밍", "클립·다시보기", "기타"] },
    musical: { name: "뮤지컬", cats: [["show", "공연"], ["ticket", "티켓팅"], ["casting", "캐스팅"], ["curtain", "커튼콜·이벤트"], ["mbday", "생일"], ["goods", "MD·굿즈"], ["personal", "개인"]],
               arch: ["공연", "커튼콜·이벤트", "굿즈·전시", "시사회", "기타"], archOn: ["온라인 중계", "캐스팅 소식", "음반·MD", "기타"] },
    sports:  { name: "스포츠", cats: [["match", "경기"], ["ticket", "직관·예매"], ["sevent", "이벤트·팬싸"], ["sbday", "선수 생일"], ["broadcast", "중계·하이라이트"], ["uniform", "굿즈·유니폼"], ["personal", "개인"]],
               arch: ["직관", "팬미팅·사인회", "이벤트", "기타"], archOn: ["중계·하이라이트", "선수 생일", "유니폼·굿즈", "기타"] },
    esports: { name: "e스포츠", cats: [["match", "경기·대회"], ["ticket", "직관·예매"], ["onair", "방송·중계"], ["ebday", "선수 생일"], ["eevent", "이벤트·팬미팅"], ["egoods", "굿즈"], ["personal", "개인"]],
               arch: ["직관·현장", "팬미팅", "이벤트", "기타"], archOn: ["경기·대회", "방송·중계", "선수 생일", "굿즈", "기타"] },
    content: { name: "애니", cats: [["release", "발매·연재"], ["cevent", "이벤트"], ["collab", "콜라보"], ["cbday", "캐릭터 생일"], ["cgoods", "굿즈"], ["media", "영상·자료"], ["personal", "개인"]],
               arch: ["전시·팝업", "행사", "상영회", "기타"], archOn: ["발매·연재", "콜라보", "캐릭터 생일", "굿즈", "영상·자료", "기타"] },
    game:    { name: "게임", cats: [["update", "업데이트"], ["gevent", "이벤트"], ["gacha", "픽업·가챠"], ["gbday", "캐릭터 생일"], ["ggoods", "굿즈"], ["gstream", "방송·생중계"], ["personal", "개인"]],
               arch: ["오프 이벤트", "팝업", "대회·행사", "기타"], archOn: ["업데이트", "이벤트", "픽업·가챠", "캐릭터 생일", "굿즈", "방송·생중계", "기타"] },
    hobby:   { name: "취미", cats: [["practice", "연습·활동"], ["lesson", "레슨·클래스"], ["recital", "발표·대회"], ["anniv", "기념일"], ["gear", "장비·자료"], ["personal", "개인"]],
               arch: ["연습·활동", "레슨·클래스", "발표·대회", "기타"], archOn: ["온라인 클래스", "영상 학습", "기념일", "기타"] },
    free:    { name: "자유", cats: [["plan", "일정"], ["important", "중요"], ["fanniv", "기념일"], ["personal", "개인"]],
               arch: ["일정", "모임", "기념일", "기타"], archOn: ["온라인", "시청", "기타"] },
  };
  let CATS = {}; // 활성 프리셋 카테고리 — buildCats()로 채움
  const CAT_FALLBACK = { name: "기타", v: "--cat-fallback" }; // 카테고리 삭제 등으로 못 찾을 때 안전 폴백
  // 카테고리는 '오프라인/온라인' 두 묶음으로만 나뉨 (사용자 편집 가능)
  // 덕질 유형별 기본 캘린더 카테고리 (오프라인=직접 가는 것 / 온라인=방송·발매·디지털)
  const CAT_DEFAULTS = {
    idol:    { off: ["콘서트", "팬미팅", "팬사인회", "생일카페", "팝업스토어"], on: ["컴백", "발매", "음악방송", "방송", "라이브", "버블", "자컨", "MD"] },
    actor:   { off: ["무대인사", "시사회", "팬미팅", "전시·팝업"], on: ["방영·개봉", "시상식", "화보·인터뷰", "라이브 방송", "VOD·다시보기"] },
    vtuber:  { off: ["오프 콘서트", "팝업", "팬미팅"], on: ["방송·합방", "신곡·컨텐츠", "생일·기념일", "콘서트 스밍", "클립·다시보기"] },
    musical: { off: ["공연", "커튼콜·이벤트", "굿즈·전시", "시사회"], on: ["온라인 중계", "캐스팅 소식", "음반·MD"] },
    sports:  { off: ["직관", "팬미팅·사인회", "이벤트"], on: ["중계·하이라이트", "선수 생일", "유니폼·굿즈"] },
    esports: { off: ["직관·현장", "팬미팅", "이벤트"], on: ["경기·대회", "방송·중계", "선수 생일", "굿즈"] },
    content: { off: ["전시·팝업", "행사", "상영회"], on: ["발매·연재", "콜라보", "캐릭터 생일", "굿즈", "영상·자료"] },
    game:    { off: ["오프 이벤트", "팝업", "대회·행사"], on: ["업데이트", "이벤트", "픽업·가챠", "캐릭터 생일", "굿즈", "방송·생중계"] },
    hobby:   { off: ["연습·활동", "레슨·클래스", "발표·대회"], on: ["온라인 클래스", "영상 학습", "기념일"] },
    free:    { off: ["일정", "모임", "기념일"], on: ["온라인", "시청"] },
  };
  function defaultCats(preset) {
    const d = CAT_DEFAULTS[preset] || CAT_DEFAULTS.idol;
    const all = d.off.map((n) => [n, "offline"]).concat(d.on.map((n) => [n, "online"]));
    return all.map(([name, mode], i) => ({ key: "cat_" + uid(), name, mode, color: PASTEL[i % PASTEL.length] }));
  }
  function buildCats() {
    const root = (typeof document !== "undefined") ? document.documentElement : null;
    let list;
    if (S) {
      // 구버전(om7) 카테고리는 아이돌 기준으로 만들어졌으므로 catsPreset을 idol로 간주(아이돌 커스텀 보존)
      if (S.catsPreset == null && S.catModel === "om7" && Array.isArray(S.cats) && S.cats.length) S.catsPreset = "idol";
      // 카테고리가 없거나 현재 덕질 유형과 카테고리 기준이 다르면 그 유형 기본값으로 (재)생성
      if (!Array.isArray(S.cats) || !S.cats.length || S.catsPreset !== S.preset) {
        S.cats = defaultCats(S.preset);
        S.catsPreset = S.preset;
      }
      S.catModel = "om8";
      list = S.cats;
    } else {
      list = defaultCats();
    }
    CATS = {};
    list.forEach((c) => {
      CATS[c.key] = { name: c.name, v: `--cat-${c.key}`, mode: c.mode || "offline" };
      if (root) root.style.setProperty(`--cat-${c.key}`, c.color);
    });
    if (root && S && S.recColor) root.style.setProperty("--c-record", S.recColor);
    const p = PRESETS[(S && S.preset) || "idol"] || PRESETS.idol;
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
  // 수동 고정 환율용 통화 — [코드, 원화환산표기 시 단위, 입력칸 접미사, 셀렉트 라벨]
  const CURRENCIES = [
    ["KRW", "원", "원", "원 (KRW)", 0],
    ["USD", "달러", "달러", "$ 달러 (USD)", 2],
    ["JPY", "엔", "엔", "¥ 엔 (JPY)", 0],
    ["EUR", "유로", "유로", "€ 유로 (EUR)", 2],
    ["CNY", "위안", "위안", "¥ 위안 (CNY)", 2],
  ];
  const _cur = (code) => CURRENCIES.find((c) => c[0] === code) || CURRENCIES[0];
  const curUnit = (code) => _cur(code)[1];
  const curDec = (code) => _cur(code)[4];
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
  const effStyleCats = () => ST_CATS.concat(Array.isArray(S && S.customStyleCats) ? S.customStyleCats : []);
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
  // 본문 글꼴 — [키, 보이는 이름, CSS font-family]. ""는 기본(Pretendard). 고른 글꼴 뒤엔 Pretendard가 폴백으로 붙어 빠진 글자를 메움.
  // [키, 보이는 이름, CSS font-family, 단일굵기여부(가짜 볼드 끔)]
  const FONTS = [
    ["", "기본", "", false],
    ["system", "기기 기본", 'system-ui, -apple-system, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif', false],
    ["cherry", "체리한스푼", '"Griun Cherry"', true],
    ["paperlogy", "페이퍼로지", '"Paperlogy"', false],
  ];
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
  let homeDay = null;      // 홈 'TODAY' 카드가 보여줄 날짜 (null = 오늘). '이번 주'에서 날짜를 누르면 바뀜
  let homeWeekOffset = 0;  // 홈 '이번 주' 스트립의 주 이동(0=이번 주, -1=지난 주, +1=다음 주)
  let ledgerCur = new Date();
  let binderMode = "own";
  let styleMode = "all";
  let diaryType = "all";
  let archMode = "offline";
  let archSearch = "";
  let binderAlbum = "all";
  let binderPage = 0; // 바인더 현재 페이지 (9칸=3×3 단위)
  let binderSearch = "", binderSort = "manual"; // 바인더 검색·정렬
  let styleSearch = "", styleSort = "recent"; // 스타일북 검색·정렬
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
  // 금액 입력: 천 단위 콤마 + "원" 자동 표기. 입력칸은 type="text" inputmode="numeric" 여야 함
  // 금액 문자열 포맷: 천 단위 콤마 + 소수 dec자리 허용 + 접미사
  function fmtAmount(raw, suffix, dec) {
    suffix = suffix || ""; dec = dec || 0;
    let c = String(raw == null ? "" : raw).replace(/[^\d.]/g, "");
    if (dec > 0) {
      const fd = c.indexOf(".");
      if (fd >= 0) c = c.slice(0, fd).replace(/\./g, "") + "." + c.slice(fd + 1).replace(/\./g, "").slice(0, dec);
    } else { c = c.replace(/\./g, ""); }
    if (c === "" || c === ".") return "";
    const parts = c.split(".");
    const out = (parts[0] === "" ? "0" : Number(parts[0]).toLocaleString("ko-KR")) + (parts.length > 1 ? "." + parts[1] : "");
    return out + suffix;
  }
  function attachAmountInput(el, initial, suffix, dec, onChange) {
    if (!el) return;
    if (typeof dec === "function") { onChange = dec; dec = 0; } // 하위호환: dec 자리에 콜백을 넘긴 옛 호출 지원
    suffix = suffix || ""; dec = dec || 0;
    el.setAttribute("inputmode", dec > 0 ? "decimal" : "numeric");
    el.value = (initial != null && initial !== "" && +initial > 0) ? fmtAmount(initial, suffix, dec) : "";
    el.oninput = () => {
      el.value = fmtAmount(el.value, suffix, dec);
      const pos = el.value.length - (suffix && el.value.endsWith(suffix) ? suffix.length : 0); // 캐럿을 접미사 앞에
      try { el.setSelectionRange(pos, pos); } catch (e) {}
      if (onChange) onChange();
    };
  }
  const attachWonInput = (el, initial) => attachAmountInput(el, initial, "원", 0);
  // 금액 입력칸에서 숫자(소수 포함)만 뽑아 수치로
  const amtNum = (el) => { if (!el) return 0; const n = parseFloat((el.value || "").replace(/[^\d.]/g, "")); return isFinite(n) && n > 0 ? n : 0; };
  // 금액 입력칸에서 숫자만 뽑아 정수로
  const wonValue = (el) => el ? Math.max(0, +(el.value.replace(/[^\d]/g, "") || 0)) : 0;
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
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.1 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H11a1.6 1.6 0 0 0 1-1.5V5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V11a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
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
    if (opts.yearDesc) { for (let y = curY + yFwd; y >= curY - yBack; y--) years.push({ v: y, t: y + "년" }); }
    else { for (let y = curY - yBack; y <= curY + yFwd; y++) years.push({ v: y, t: y + "년" }); }
    for (let m = 1; m <= 12; m++) months.push({ v: m, t: m + "월" });
    for (let d = 1; d <= 31; d++) days.push({ v: d, t: d + "일" });
    return `<div class="date-sel" id="${id}">
      ${dsel("ds-y", "년", vy, years)}
      ${dsel("ds-m", "월", vm, months)}
      ${opts.noDay ? "" : dsel("ds-d", "일", vd, days)}
      ${opts.clearable ? '<button type="button" class="ds-clear" aria-label="날짜 비우기">지우기</button>' : ""}
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
  // 양력/음력 선택 토글 (생일 입력용)
  function calToggleHTML(id, isLunar) {
    return `<div class="cal-toggle" id="${id}" role="group" aria-label="양력 음력 선택">`
      + `<button type="button" data-cal="solar" class="${isLunar ? "" : "on"}">양력</button>`
      + `<button type="button" data-cal="lunar" class="${isLunar ? "on" : ""}">음력</button>`
      + `</div>`;
  }
  function calToggleVal(id) {
    const el = $(id);
    if (!el) return false;
    const on = el.querySelector("button.on");
    return !!(on && on.dataset.cal === "lunar");
  }
  function handleCalToggle(e) {
    const btn = e.target.closest(".cal-toggle button[data-cal]");
    if (!btn) return;
    btn.closest(".cal-toggle").querySelectorAll("button").forEach((x) => x.classList.remove("on"));
    btn.classList.add("on");
    refreshLunarPreviews();
  }
  // 생일 입력 중 '음력 → 올해 양력' 미리보기 갱신 (토글·날짜 바꿀 때마다)
  function refreshLunarPreviews() {
    [["mBirthCal", "mBirth", "mBirthPrev"], ["obBirthCal", "obBirthday", "obBirthPrev"]].forEach(([calId, dateId, prevId]) => {
      const prev = $(prevId);
      if (!prev) return;
      const sel = $(dateId);
      const mEl = sel && sel.querySelector(".ds-m"), dEl = sel && sel.querySelector(".ds-d");
      const m = mEl && mEl.dataset.val, d = dEl && dEl.dataset.val;
      if (calToggleVal(calId) && m && d && window.Lunar) {
        const s = window.Lunar.toSolar(new Date().getFullYear(), +m, +d, false);
        prev.textContent = s ? `(올해 양력 ${s.getMonth() + 1}월 ${s.getDate()}일)` : "";
      } else {
        prev.textContent = "";
      }
    });
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
    const clr = e.target.closest(".ds-clear");
    if (clr) {
      e.preventDefault();
      const box = clr.closest(".date-sel");
      if (box) {
        box.querySelectorAll(".dsel").forEach((d) => {
          d.dataset.val = "";
          const b = d.querySelector(".dsel-btn");
          if (b) { b.classList.add("ph"); b.textContent = d.classList.contains("ds-y") ? "년" : d.classList.contains("ds-m") ? "월" : "일"; }
          d.querySelectorAll(".dsel-list .on").forEach((x) => x.classList.remove("on"));
        });
        refreshLunarPreviews();
      }
      return;
    }
    const opt = e.target.closest(".dsel-list button[data-v]");
    if (opt) {
      const dsel = opt.closest(".dsel");
      dsel.dataset.val = opt.dataset.v;
      const btn = dsel.querySelector(".dsel-btn");
      btn.textContent = opt.textContent; btn.classList.remove("ph");
      dsel.querySelectorAll(".dsel-list .on").forEach((x) => x.classList.remove("on"));
      opt.classList.add("on");
      closeDselList(dsel.querySelector(".dsel-list"));
      refreshLunarPreviews();
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
        // 선택값이 있으면 그 항목을, 없으면(연도 선택은) 현재 연도를 목록 가운데로
        let target = list.querySelector(".on");
        if (!target) {
          const dsel = btn.closest(".dsel");
          if (dsel && dsel.classList.contains("ds-y")) {
            target = list.querySelector(`button[data-v="${new Date().getFullYear()}"]`);
          }
        }
        if (target) list.scrollTop = target.offsetTop - list.clientHeight / 2 + target.offsetHeight / 2;
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
      onboarded: false, preset: "idol", dark: false, retro: false, retroSkin: "browser", retroPos: "float", bg: "none", align: "left", widgets: {}, budget: 0, notifyTicket: false, notifyTicketLead: 10, notifyEvents: false, notifyEventsLead: 60, notifyBirthday: false, notifyBdayDays: 0, notifyDaily: false, notifyDailyHour: 9, haptics: true, veil: 0, mode: "", template: "classic", archView: "card", accent: "#141414", weekStart: "sun", weekStartWeek: "mon", weekStartCircle: "mon", ttHideWeekend: false, ttHideWeekendFixed: null, ttHideWeekendWeek: null, ttHideWeekendCircle: null, ttCircleStyle: "full", ttLink: true, ttFixedLink: true, lastFx: {}, font: "",
      biases: [], currentBias: null,
      customArchTypes: { offline: [], online: [] }, customStyleCats: [],
      cats: [], recLabel: "기록", recColor: "#c3aee8", schedules: [], stickers: {}, photocards: [],
      expenses: [], archives: [], links: [], styles: [],
      timetables: [], ttRange: { s: 0, e: 24 },
      membership: { title: "MY STAR PASS", name: "", icon: "✦", no: "0001" },
      seenNotice: 0,
    };
  }

  function save() {
    try {
      ensureImgKeys(); // 포카 사진은 IndexedDB로 보내고 참조만 남김
      localStorage.setItem(LS_KEY, JSON.stringify(persistState()));
      updateAppBadge();
    } catch (e) {
      toast("저장 공간이 가득 찼어요. 사진을 줄이거나 백업 후 정리해 주세요.");
    }
  }
  function load() {
    try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(LS_KEY)) || {}); }
    catch (e) { S = defaults(); }
    normalizeState();
  }
  // 저장 데이터 정규화·구버전 마이그레이션 (load·가져오기 양쪽에서 공용)
  function normalizeState() {
    if (!MODES.some(([id]) => id === (S.mode || ""))) S.mode = "";
    if (S.frame === "msgr") { S.retro = true; S.retroSkin = "msgr"; } // 구버전 프레임 → 창 스타일
    else if (S.frame === "retro") S.retro = true;
    delete S.frame;
    if (!SKINS.some(([id]) => id === S.retroSkin)) S.retroSkin = "browser";
    if (!POSES.some(([id]) => id === S.retroPos)) S.retroPos = "float";
    if (!TEMPLATES.some((t) => t.id === S.template)) S.template = "classic"; // 삭제된 템플릿 선택 시 기본값 보정
    // 시간표 요일을 '월 기준 상대(0=월)'에서 '절대 요일(0=일)'로 일회 전환
    if (!S._ttAbsDay) {
      (S.timetables || []).forEach((b) => { if (typeof b.day === "number") b.day = (b.day + 1) % 7; });
      S._ttAbsDay = true;
    }
    // 주 시작: 뷰별 분리 (구버전 weekStartTt → 주간/원형)
    if (S.weekStartWeek == null) S.weekStartWeek = S.weekStartTt || "mon";
    if (S.weekStartCircle == null) S.weekStartCircle = S.weekStartTt || "mon";
    if (S.schedWeekMon == null) { S.weekStartWeek = "mon"; S.weekStartCircle = "mon"; S.schedWeekMon = true; } // 스케줄러 주 시작 기본을 월요일로 통일(1회). 이후 일요일 선택은 유지됨
    if (S.ttLink == null) S.ttLink = true;
    if (S.ttFixedLink == null) S.ttFixedLink = true;
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
    root.setAttribute("data-template", S.template || "classic");
    root.setAttribute("data-mode", S.mode || "none");
    root.style.setProperty("--veil", (S.veil || 0) + "%"); // 콘텐츠 배경 불투명 막 농도
    // 본문 글꼴 — 고른 글꼴이 있으면 --font-body로 덮어쓰고 뒤에 기본 폰트(Pretendard)를 폴백으로 붙임. 기본이면 변수 제거 → CSS 기본값으로 복귀.
    const fontDef = FONTS.find(([k]) => k === (S.font || ""));
    if (fontDef && fontDef[2]) root.style.setProperty("--font-body", fontDef[2] + ", var(--font-sans)");
    else root.style.removeProperty("--font-body");
    // 단일 굵기 손글씨체만 가짜 볼드(font-synthesis) 끔. 기본·기기 기본 글꼴은 진짜 볼드 유지.
    if (fontDef && fontDef[3]) root.setAttribute("data-customfont", "true");
    else root.removeAttribute("data-customfont");
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
    const diff = Math.floor((stripTime(new Date()) - stripTime(parseYMD(dateStr))) / 86400000);
    return diff >= 0 ? diff + 1 : null; // 덕질 시작일 = D+1
  }
  function dUntilAnniv(dateStr) {
    return dToAnniv(dateStr);
  }
  const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // "YYYY-MM-DD"를 로컬 자정으로 파싱 (new Date("YYYY-MM-DD")는 UTC라 시간대에 따라 하루 어긋남)
  function parseYMD(v) {
    if (v instanceof Date) return v;
    const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
  }
  // 다음 기념일까지 남은 일수 — 올해(지났으면 내년) 같은 월·일. 2/29는 평년이면 2/28로 보정해 하루 밀림 방지
  function dToAnniv(ds, from) {
    if (!ds) return null;
    const t0 = stripTime(from ? parseYMD(from) : new Date());
    const src = parseYMD(ds);
    const make = (y) => {
      const d = new Date(y, src.getMonth(), src.getDate());
      if (d.getMonth() !== src.getMonth()) d.setDate(0); // 그 달에 없는 날(2/29 평년)이면 말일로
      return d;
    };
    let d = make(t0.getFullYear());
    if (d < t0) d = make(t0.getFullYear() + 1);
    return Math.round((d - t0) / 86400000);
  }

  /* ───────── 음력 생일 (b.birthdayLunar=true면 b.birthday의 월·일을 음력으로 해석) ───────── */
  function isLunarBirth(b) { return !!(b && b.birthday && b.birthdayLunar); }
  // 음력 생일이 다음(또는 오늘) 돌아오는 양력 Date
  function lunarBirthSolar(b, from) {
    if (!isLunarBirth(b) || !window.Lunar) return null;
    const p = b.birthday.split("-");
    return window.Lunar.annivNextSolar(+p[1], +p[2], from || new Date());
  }
  // 생일 D-day (양력·음력 공용)
  function birthdayDDay(b) {
    if (!b || !b.birthday) return null;
    if (isLunarBirth(b)) {
      const s = lunarBirthSolar(b);
      return s ? Math.round((stripTime(s) - stripTime(new Date())) / 86400000) : null;
    }
    return dToAnniv(b.birthday);
  }
  function birthdayDDayText(b) { const n = birthdayDDay(b); return n == null ? "" : (n === 0 ? "D-DAY" : "D-" + n); }
  // 주어진 양력 날짜(refKey "YYYY-MM-DD")가 이 최애의 생일인가
  function birthdayOnKey(b, refKey) {
    if (!b || !b.birthday) return false;
    if (isLunarBirth(b)) {
      const ref = stripTime(refKey ? parseYMD(refKey) : new Date());
      const p = b.birthday.split("-");
      const s = window.Lunar && window.Lunar.toSolar(ref.getFullYear(), +p[1], +p[2], false);
      return !!(s && stripTime(s).getTime() === ref.getTime());
    }
    return isAnnivOn(b.birthday, refKey);
  }
  // 주어진 양력 (연, 월0base, 일)이 생일인가 — 캘린더 칸용
  function birthdayOnYMD(b, year, month0, day) {
    if (!b || !b.birthday) return false;
    if (isLunarBirth(b)) {
      const p = b.birthday.split("-");
      const s = window.Lunar && window.Lunar.toSolar(year, +p[1], +p[2], false);
      return !!(s && s.getMonth() === month0 && s.getDate() === day);
    }
    return sameMD(b.birthday, month0, day);
  }
  // 프로필 등 생일 표시 문구 (음력이면 음력 + 올해 환산 양력)
  function birthdayLabel(b) {
    if (!b || !b.birthday) return "—";
    if (isLunarBirth(b)) {
      const p = b.birthday.split("-");
      // '올해 양력'은 올해(현재 연도)의 환산 양력 — 지났는지와 무관하게 올해 날짜를 보여줌
      const s = window.Lunar && window.Lunar.toSolar(new Date().getFullYear(), +p[1], +p[2], false);
      const sx = s ? ` · 올해 양력 ${s.getMonth() + 1}.${s.getDate()}` : "";
      return `음력 ${+p[1]}.${+p[2]}${sx}`;
    }
    return b.birthday;
  }

  // ── 생일 → 별자리(서양 12궁) ──
  function zodiacByMD(mo, d) {
    const cut = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
    const STARTS = ["aquarius", "pisces", "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn"];
    const META = {
      aries: ["양자리", "♈︎"], taurus: ["황소자리", "♉︎"], gemini: ["쌍둥이자리", "♊︎"], cancer: ["게자리", "♋︎"],
      leo: ["사자자리", "♌︎"], virgo: ["처녀자리", "♍︎"], libra: ["천칭자리", "♎︎"], scorpio: ["전갈자리", "♏︎"],
      sagittarius: ["궁수자리", "♐︎"], capricorn: ["염소자리", "♑︎"], aquarius: ["물병자리", "♒︎"], pisces: ["물고기자리", "♓︎"],
    };
    if (!(mo >= 1 && mo <= 12) || !(d >= 1 && d <= 31)) return null;
    const key = (d >= cut[mo - 1]) ? STARTS[mo - 1] : STARTS[(mo - 2 + 12) % 12];
    return { key, name: META[key][0], symbol: META[key][1] };
  }
  // 생일의 '양력 월·일' (음력이면 올해 양력으로 환산) — 별자리·탄생석·탄생화 공용
  function birthSolarMD(b) {
    if (!b || !b.birthday) return null;
    if (isLunarBirth(b)) {
      const p = b.birthday.split("-");
      const s = window.Lunar && window.Lunar.toSolar(new Date().getFullYear(), +p[1], +p[2], false);
      if (!s) return null;
      return { mo: s.getMonth() + 1, d: s.getDate() };
    }
    const p = b.birthday.split("-");
    return { mo: +p[1], d: +p[2] };
  }
  function zodiacOf(b) {
    const md = birthSolarMD(b);
    return md ? zodiacByMD(md.mo, md.d) : null;
  }
  const ZTRAIT = {
    aries: ["불", "열정적인 리더"], taurus: ["흙", "끈기와 안정"], gemini: ["공기", "호기심과 재치"],
    cancer: ["물", "다정하고 섬세"], leo: ["불", "당당한 주인공"], virgo: ["흙", "꼼꼼한 완벽주의"],
    libra: ["공기", "균형과 매력"], scorpio: ["물", "깊고 강렬함"], sagittarius: ["불", "자유로운 모험가"],
    capricorn: ["흙", "성실한 야망가"], aquarius: ["공기", "독창적인 개성"], pisces: ["물", "감성적인 몽상가"],
  };
  // 월별 탄생석(이름·색)·탄생화(이름·꽃말)
  const BIRTHSTONE = [["가넷", "#7B1E3A"], ["자수정", "#9B59B6"], ["아쿠아마린", "#7FC7D9"], ["다이아몬드", "#BFD8E6"], ["에메랄드", "#2E8B57"], ["진주", "#D9CDBA"], ["루비", "#E0115F"], ["페리도트", "#9ACD32"], ["사파이어", "#1A4FA0"], ["오팔", "#7FD3CC"], ["토파즈", "#F0A830"], ["터콰이즈", "#2EC4B6"]];
  const BIRTHFLOWER = [["카네이션", "사랑과 존경"], ["제비꽃", "겸손과 진심"], ["수선화", "자존심과 신비"], ["데이지", "순수한 마음"], ["은방울꽃", "다시 찾은 행복"], ["장미", "열정적인 사랑"], ["연꽃", "청순한 마음"], ["글라디올러스", "정열적인 사랑"], ["과꽃", "추억"], ["메리골드", "반드시 올 행복"], ["국화", "고결과 진실"], ["포인세티아", "축복"]];
  const CHINESE_ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  function chineseZodiacOf(b) {
    if (!b || !b.birthday) return null;
    const y = +b.birthday.split("-")[0];
    if (!(y > 1900 && y < 2100)) return null;
    return CHINESE_ZODIAC[((y - 4) % 12 + 12) % 12] + "띠";
  }
  // 덕질 시작일 기준 다음 마일스톤(100일 단위 또는 N주년 중 가까운 것)
  function nextMilestone(b) {
    if (!b || !b.startDate) return null;
    const dp = dPlus(b.startDate);
    if (dp == null) return null;
    const nextHundred = Math.ceil(dp / 100) * 100;
    const cands = [{ label: nextHundred.toLocaleString() + "일", d: nextHundred - dp, yr: false }];
    const start = parseYMD(b.startDate);
    const today = stripTime(new Date());
    let ay = today.getFullYear();
    let ad = stripTime(new Date(ay, start.getMonth(), start.getDate()));
    if (ad < today) { ay++; ad = stripTime(new Date(ay, start.getMonth(), start.getDate())); }
    const years = ay - start.getFullYear();
    if (years >= 1) cands.push({ label: years + "주년", d: Math.round((ad - today) / 86400000), yr: true });
    cands.sort((a, c) => a.d - c.d || (c.yr - a.yr));
    return cands[0];
  }
  // 데뷔일 기준 다음 N주년 D-day
  function debutAnniv(b) {
    if (!b || !b.debutDate) return null;
    const start = parseYMD(b.debutDate);
    const today = stripTime(new Date());
    let ay = today.getFullYear();
    let ad = stripTime(new Date(ay, start.getMonth(), start.getDate()));
    if (ad < today) { ay++; ad = stripTime(new Date(ay, start.getMonth(), start.getDate())); }
    const years = ay - start.getFullYear();
    if (years < 1) return null;
    return { years, d: Math.round((ad - today) / 86400000) };
  }
  // 홈·프로필 커버 사진 위에 깔리는 '커버 반짝이'
  function applyBgFx() {
    const key = (S.bgFx && POCA_FX_KEYS.includes(S.bgFx)) ? S.bgFx : "";
    document.querySelectorAll(".cover-fx").forEach((el) => {
      el.className = "cover-fx poca-fx" + (key ? " fx-" + key : "");
      el.style.display = key ? "" : "none";
    });
  }
  function setBgFx(k) {
    S.bgFx = (k && POCA_FX_KEYS.includes(k)) ? k : "";
    save(); applyBgFx();
  }

  function buildBadges(b, ddText) {
    const badges = [`<span class="badge-accent">덕질 ${ddText} ♥</span>`];
    if (b.birthday) {
      const du = birthdayDDay(b);
      badges.push(`<span class="badge-accent alt">${I("cake")} 생일 ${du === 0 ? "오늘!" : "D-" + du}</span>`);
    }
    { const z = zodiacOf(b); if (z && funOn("zodiac")) badges.push(`<span class="badge-accent alt zodiac">${z.symbol} ${z.name}</span>`); }
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
  let obTpl = "classic";
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
    const back = $("obBack");
    if (back) back.classList.toggle("hidden", n <= 0);
    if ($("onboarding")) $("onboarding").scrollTop = 0;
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

  function obPrev() {
    if (obStep <= 0) return;
    obShowStep(obStep - 1);
  }

  function obFinish() {
    const bias = {
      id: uid(),
      name: $("obName").value.trim(),
      group: $("obGroup").value.trim(),
      photo: obPhotoData,
      startDate: dateSelectVal("obStart"),
      birthday: dateSelectVal("obBirthday") || null,
      birthdayLunar: !!dateSelectVal("obBirthday") && calToggleVal("obBirthCal"),
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

  function obSyncColorChip() {
    const chip = $("obColorChip"), hx = $("obColorHex");
    if (chip) chip.style.background = obColor;
    if (hx) hx.textContent = (obColor || "").toUpperCase();
  }

  function initOnboarding() {
    $("onboarding").classList.remove("hidden");
    $("obStartWrap").innerHTML = dateSelectHTML("obStart", todayKey(), { yearsFwd: 1 });
    $("obBirthdayWrap").innerHTML = `<div class="cal-row">` + calToggleHTML("obBirthCal", false) + `<span class="cal-preview" id="obBirthPrev"></span></div>` + dateSelectHTML("obBirthday", "", { yearsFwd: 1, clearable: true });
    $("obDebutWrap").innerHTML = dateSelectHTML("obDebut", "", { yearsFwd: 1, clearable: true });
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
        obSyncColorChip();
      };
      grid.appendChild(b);
    });
    obSyncColorChip();
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
      if (mode === "ob") obSyncColorChip();
      toast(`사진에서 ${hex} 색을 추출했어요!`);
    });
  }

  function applyExtractedColor(mode, hex) {
    if (mode === "ob") obColor = hex;
    S.accent = hex;
    applyTheme(); save(); renderSwatches();
    if (mode === "ob") obSyncColorChip();
  }

  // 사진에서 원하는 부분을 눌러 색을 찍는 스포이드 (루페 확대 + 자동 추천 유지)
  function openColorFromPhoto(mode) {
    const src = mode === "ob" ? obPhotoData : (curBias() && curBias().photo);
    if (!src) return toast("먼저 최애 사진을 등록해 주세요!");
    openModalRaw("사진에서 색 고르기", `
      <p class="dt-hint-mini" style="margin:0 0 10px">사진에서 원하는 부분을 눌러 색을 찍어요. 손가락을 떼면 그 색으로 정해져요.</p>
      <div class="eyedrop" id="eyeWrap"><canvas id="eyeCanvas"></canvas><span class="eye-loupe" id="eyeLoupe"></span></div>
      <div class="eye-foot"><span class="eye-prev"><i class="eye-sw" id="eyeSw"></i><b id="eyeHex">#000000</b></span><button class="btn btn-ghost btn-sm" id="eyeAuto">추천 색 (자동)</button></div>
      <button class="btn btn-primary btn-lg" id="eyeApply">이 색으로</button>
    `);
    const cv = $("eyeCanvas"), loupe = $("eyeLoupe"), sw = $("eyeSw"), hx = $("eyeHex");
    let picked = null, ctx = null, iw = 0, ih = 0;
    const setPicked = (hex) => { picked = hex; if (sw) sw.style.background = hex; if (hx) hx.textContent = hex.toUpperCase(); };
    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(360, (window.innerWidth || 360) - 72);
      const scale = Math.min(1, maxW / img.width);
      iw = Math.max(1, Math.round(img.width * scale)); ih = Math.max(1, Math.round(img.height * scale));
      cv.width = iw; cv.height = ih; cv.style.width = iw + "px"; cv.style.height = ih + "px";
      ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, iw, ih);
      dominantColor(src, (hex) => { if (hex && !picked) setPicked(hex); });
    };
    img.src = src;
    const colorAt = (x, y) => {
      if (!ctx) return null;
      x = Math.max(0, Math.min(iw - 1, Math.round(x))); y = Math.max(0, Math.min(ih - 1, Math.round(y)));
      const d = ctx.getImageData(x, y, 1, 1).data;
      return "#" + [d[0], d[1], d[2]].map(pad2hex).join("");
    };
    const L = 92, zoom = 5;
    const showLoupe = (lx, ly) => {
      loupe.style.display = "block";
      loupe.style.left = lx + "px"; loupe.style.top = (ly - L - 14) + "px";
      loupe.style.backgroundImage = `url("${src}")`;
      loupe.style.backgroundSize = (iw * zoom) + "px " + (ih * zoom) + "px";
      loupe.style.backgroundPosition = `${L / 2 - lx * zoom}px ${L / 2 - ly * zoom}px`;
    };
    const onMove = (e) => {
      const r = cv.getBoundingClientRect();
      const lx = Math.max(0, Math.min(iw, e.clientX - r.left)), ly = Math.max(0, Math.min(ih, e.clientY - r.top));
      const hex = colorAt(lx, ly); if (hex) setPicked(hex);
      showLoupe(lx, ly);
    };
    const onUp = () => { loupe.style.display = "none"; window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault(); onMove(e);
      window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    });
    $("eyeAuto").onclick = () => dominantColor(src, (hex) => { if (hex) setPicked(hex); else toast("색을 찾지 못했어요"); });
    $("eyeApply").onclick = () => { if (!picked) return toast("사진에서 색을 찍어주세요"); applyExtractedColor(mode, picked); closeModal(); toast(`${picked} 색으로 정했어요!`); };
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

  let _moreAutoSettings = false; // PC 폭에서 '더보기'→'설정'으로 자동 전환됐는지 표시
  // 모바일 하단 바 그룹: 페이지 → 그룹 대표 버튼 / 그룹별 서브탭
  const NAV_PRIMARY = { home: "home", profile: "home", calendar: "calendar", timetable: "calendar", binder: "binder", style: "binder", archive: "archive", ledger: "archive", settings: "more", more: "more" };
  const NAV_SUBTABS = { calendar: [["calendar", "캘린더"], ["timetable", "스케줄러"]], binder: [["binder", "포카 바인더"], ["style", "스타일북"]], archive: [["archive", "아카이브"], ["ledger", "덕질 가계부"]] };
  function go(page) {
    exitEditModes(); // 편집 모드가 켜진 채 떠나면 상태가 고착되는 문제 방지
    _moreAutoSettings = false; // 사용자가 직접 이동하면 자동전환 플래그 해제 (자동전환은 go 호출 직후 다시 세팅)
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
    const navPage = page === "profile" ? "home" : page;
    // 사이드바(PC): 페이지 정확 일치로 활성 표시 (그대로)
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.page === navPage));
    // 하단 바(모바일): 그룹 대표 버튼 활성 표시
    const bnPrimary = NAV_PRIMARY[navPage] || navPage;
    document.querySelectorAll(".bn-btn").forEach((b) => b.classList.toggle("active", b.dataset.page === bnPrimary));
    // 서브탭: 그룹 안에 페이지가 2개 이상이면 표시 (캘린더↔스케줄러 등)
    const stEl = document.getElementById("subTabs");
    if (stEl) {
      const tabs = NAV_SUBTABS[bnPrimary];
      if (tabs) {
        let _st = `<span class="seg-group">` + tabs.map((t) => `<button class="sub-tab${t[0] === navPage ? " on" : ""}" onclick="App.go('${t[0]}')">${esc(t[1])}</button>`).join("") + `</span>`;
        stEl.innerHTML = _st; stEl.classList.remove("hidden");
      }
      else { stEl.innerHTML = ""; stEl.classList.add("hidden"); }
      document.body.classList.toggle("has-subtabs", !!tabs);
    }
    closeFab();
    window.scrollTo({ top: 0 });
    const mainEl = document.querySelector(".main");
    if (mainEl) mainEl.scrollTop = 0;
    if (page === "home") renderHome();
    if (page === "profile") renderProfile();
    if (page === "calendar") renderCalendar();
    if (page === "timetable") renderTimetable();
    if (page === "binder") renderBinder();
    if (page === "ledger") renderLedger();
    if (page === "archive") renderArchive();
    if (page === "style") renderStyle();
    if (page === "settings") renderSettings();
    // 페이지 이동 시 문서 제목 갱신 (SPA 접근성·브라우저 기록)
    const titles = { home: "홈", profile: "최애 프로필", calendar: "캘린더", timetable: "스케줄러", binder: "포카 바인더", ledger: "덕질 가계부", archive: "아카이브", style: "스타일북", settings: "설정" };
    document.title = (titles[page] ? titles[page] + " · " : "") + "마이 스타 캘린더";
    try { localStorage.setItem("msc_back_page", page); } catch (e) {} // 외부 페이지(공지·FAQ 등) 뒤로가기가 이 화면으로 돌아오게
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
    save(); applyTheme(); renderSettings(); renderHome();
    const tn = (TEMPLATES.find((x) => x.id === t) || {}).name || "";
    toast(`${tn} 템플릿으로 바꿨어요`);
  }

  /* 화면·테마(템플릿·감성모드·배경·색·정렬·미니홈피·다크)를 기본값으로 초기화.
     덕질 유형·카테고리·기록 데이터는 건드리지 않음. */
  function resetPresets() {
    if (!confirm("화면·테마를 기본값으로 되돌릴까요?\n(템플릿·감성모드·배경·색·정렬·미니홈피·다크 등 꾸미기만 초기화돼요)")) return;
    const d = defaults();
    ["template", "mode", "bg", "align", "accent", "dark", "retro", "retroSkin", "retroPos", "veil", "font"].forEach((k) => { S[k] = d[k]; });
    S.patstyle = "scatter";
    save(); applyTheme(); renderAll(); renderSettings();
    toast("화면·테마를 기본값으로 되돌렸어요");
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
        <input type="text" id="mBudget" inputmode="numeric" placeholder="0원"></div>
      <button class="btn btn-primary btn-lg" id="mSave">저장</button>`);
    attachWonInput($("mBudget"), S.budget);
    $("mSave").onclick = () => {
      S.budget = wonValue($("mBudget"));
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
    const fxExps = exps.filter((e) => e.cur && e.cur !== "KRW");
    const fxTotal = fxExps.reduce((a, e) => a + (+e.amount || 0), 0);
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
        ${fxTotal > 0 ? `<p class="yr-foreign">이 중 해외 결제 ${won(fxTotal)} <small>(${fxExps.length}건)</small></p>` : ""}
      </div>
      <button class="btn btn-primary btn-lg" id="yrShare">결산 텍스트 복사 (SNS 공유)</button>`);
    $("yrShare").onclick = () => {
      let text = `✦ ${yr} 나의 덕질 결산 ✦\n`;
      text += `최애: ${b ? b.name : "최애"}${b && b.startDate ? ` (D+${dPlus(b.startDate)})` : ""}\n\n`;
      text += `💸 행복 비용 ${won(total)}\n🎪 오프라인 ${offline}회 · 온라인 ${online}회\n`;
      if (fxTotal > 0) text += `🌐 해외 결제 ${won(fxTotal)} (${fxExps.length}건)\n`;
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
  function openCatManager() {
    let draft = (S.cats || []).map((c) => ({ key: c.key, name: c.name, color: c.color, mode: c.mode || "offline" }));
    let recDraft = { label: (S.recLabel || "기록"), color: (S.recColor || "#c3aee8") };
    openModalRaw("카테고리 관리", `
      <p class="hint">오프라인·온라인별로 카테고리를 추가·이름·색 변경·삭제할 수 있어요. 색 동그라미를 누르면 색을 바꿔요.</p>
      <div id="catMgrList"></div>
      <div class="catm-sep">특별 토글 · 후기·기록 표시 (삭제 불가)</div>
      <div class="catm-row">
        <button type="button" class="catm-sw" id="recSw" style="background:${recDraft.color}" aria-label="색 변경"></button>
        <input type="text" class="catm-name" id="recName" value="${esc(recDraft.label)}" maxlength="12" placeholder="이름">
        <div class="catm-pal hidden" id="recPal">
          ${PASTEL.map((p) => `<button type="button" class="catm-chip" data-recpick="${p}" style="background:${p}" aria-label="색"></button>`).join("")}
          <label class="catm-custom">직접 <input type="color" id="recCustom" value="${recDraft.color}"></label>
        </div>
      </div>
      <button class="btn btn-primary btn-lg" id="catSaveBtn">저장</button>`);
    const rowHtml = (c, i) => `<div class="catm-row">
        <button type="button" class="catm-sw" data-sw="${i}" style="background:${c.color}" aria-label="색 변경"></button>
        <input type="text" class="catm-name" data-nm="${i}" value="${esc(c.name)}" maxlength="12" placeholder="이름">
        <button type="button" class="catm-del" data-del="${i}" aria-label="삭제">${I("x")}</button>
        <div class="catm-pal hidden" data-pal="${i}">
          ${PASTEL.map((p) => `<button type="button" class="catm-chip" data-pick="${i}" data-color="${p}" style="background:${p}" aria-label="색"></button>`).join("")}
          <label class="catm-custom">직접 <input type="color" data-custom="${i}" value="${c.color}"></label>
        </div>
      </div>`;
    function render() {
      const list = $("catMgrList");
      const sec = (mode, label, ic) => {
        const items = draft.map((c, i) => [c, i]).filter(([c]) => (c.mode || "offline") === mode);
        return `<div class="catm-grouphd">${ic} ${label}</div>`
          + (items.length ? items.map(([c, i]) => rowHtml(c, i)).join("") : `<p class="hint catm-empty">아직 없어요.</p>`)
          + `<button type="button" class="f-chip chip-add catm-add" data-add="${mode}">+ ${label} 카테고리</button>`;
      };
      list.innerHTML = sec("offline", "오프라인", I("pin")) + sec("online", "온라인", I("monitor"));
      list.querySelectorAll("[data-nm]").forEach((el) => { el.oninput = () => { draft[+el.dataset.nm].name = el.value; }; });
      list.querySelectorAll("[data-sw]").forEach((el) => { el.onclick = () => { const pal = list.querySelector(`[data-pal="${el.dataset.sw}"]`); if (pal) pal.classList.toggle("hidden"); }; });
      list.querySelectorAll("[data-pick]").forEach((el) => { el.onclick = () => { draft[+el.dataset.pick].color = el.dataset.color; render(); }; });
      list.querySelectorAll("[data-custom]").forEach((el) => { el.oninput = () => { const i = +el.dataset.custom; draft[i].color = el.value; const sw = list.querySelector(`[data-sw="${i}"]`); if (sw) sw.style.background = el.value; }; });
      list.querySelectorAll("[data-del]").forEach((el) => { el.onclick = () => { draft.splice(+el.dataset.del, 1); render(); }; });
      list.querySelectorAll("[data-add]").forEach((el) => { el.onclick = () => { draft.push({ key: "cat_" + uid(), name: "새 카테고리", color: PASTEL[draft.length % PASTEL.length], mode: el.dataset.add }); render(); }; });
    }
    render();
    $("recName").oninput = () => { recDraft.label = $("recName").value; };
    $("recSw").onclick = () => { $("recPal").classList.toggle("hidden"); };
    document.querySelectorAll("#recPal [data-recpick]").forEach((el) => { el.onclick = () => { recDraft.color = el.dataset.recpick; $("recSw").style.background = recDraft.color; $("recPal").classList.add("hidden"); }; });
    $("recCustom").oninput = () => { recDraft.color = $("recCustom").value; $("recSw").style.background = recDraft.color; };
    $("catSaveBtn").onclick = () => {
      draft = draft.map((c) => ({ key: c.key, name: (c.name || "").trim(), color: c.color, mode: c.mode || "offline" })).filter((c) => c.name);
      S.cats = draft;
      S.recLabel = (recDraft.label || "").trim() || "기록";
      S.recColor = recDraft.color;
      buildCats();
      Object.keys(CATS).forEach((k) => activeCats.add(k));
      [...activeCats].forEach((k) => { if (!CATS[k]) activeCats.delete(k); });
      save();
      closeModal();
      renderCalendar();
      if (typeof renderHome === "function") renderHome();
      toast("카테고리를 저장했어요");
    };
  }

  function openColorPicker(ctx) {
    const generic = ctx && typeof ctx === "object"; // { initial, onDone } → 테마 안 건드리고 콜백만
    let curHex = generic ? (ctx.initial && /^#[0-9a-fA-F]{6}$/.test(ctx.initial) ? ctx.initial.toUpperCase() : "#F7A8C4") : S.accent;
    let [h, sv, vv] = hexToHsv(curHex);
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
    if (generic && ctx.onCancel) modalCancelHook = ctx.onCancel; // 닫기 시 이전 화면 복귀
    const apply = (exact) => {
      const hex = exact || hsvToHex(h, sv, vv);
      $("cpPrev").style.background = hex;
      $("cpHex").value = hex;
      const nm = $("cpName"); if (nm) nm.textContent = hex;
      $("cpSV").style.background =
        `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))`;
      $("cpDot").style.left = sv + "%";
      $("cpDot").style.top = (100 - vv) + "%";
      if (generic) { curHex = hex; }
      else { S.accent = hex; if (ctx === "ob") obColor = hex; applyTheme(); }
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
      if (generic) { const cb = ctx.onDone; if (cb) cb(curHex); return; }
      if (ctx === "set") { save(); renderSettings(); }
      else {
        const oc = $("obColorChip"), oh = $("obColorHex");
        if (oc) { oc.style.background = S.accent; oh.textContent = S.accent.toUpperCase(); }
      }
      closeModal();
      toast("나만의 컬러를 적용했어요");
    };
    apply(curHex.toUpperCase());
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
      <div class="fp-tophead">
        <p class="fp-desc">누르면 뒤 화면에 바로 적용돼요. 이것저것 눌러보고 정하세요!</p>
        <button class="fp-dark" onclick="App.toggleDark()"><svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14A8.5 8.5 0 1 1 10 3.5a7 7 0 0 0 10.5 10.5Z"/></svg><svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.4 4.4l1.85 1.85M17.75 17.75l1.85 1.85M2.5 12h2.6M18.9 12h2.6M4.4 19.6l1.85-1.85M17.75 6.25l1.85-1.85"/></svg><span class="fpd-on">다크 모드</span><span class="fpd-off">라이트 모드</span></button>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label>퍼스널 컬러</label>
        <div class="swatch-grid" id="fpSwatches"></div>
      </div>
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
      <div class="field" style="margin:14px 0 0">
        <label>배경 농도 <small>(패턴 위 글씨 가독성)</small> <span id="fpVeilVal" class="veil-val">0%</span></label>
        <input type="range" id="fpVeilRange" class="veil-range" min="0" max="100" step="5" value="0" oninput="App.setVeil(this.value)">
      </div>
      <div class="field" style="margin:14px 0 0">
        <label>본문 글꼴 <small>(로고·제목 제외)</small></label>
        <div class="tab-row" id="fpFontRow" style="margin-bottom:0;flex-wrap:wrap"></div>
      </div>
      <div class="field" style="margin:14px 0 0">
        <label>메인 템플릿</label>
        <div class="tpl-thumbs" id="fpTplThumbs"></div>
      </div>
      <div class="field" style="margin:14px 0 0">
        <label>커버 반짝이 <small>(홈·프로필 사진 위)</small></label>
        <div class="fx-pick" id="fpFxRow"></div>
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
      const fxr = $("fpFxRow");
      if (fxr) {
        fxr.innerHTML = POCA_FX.map(([k, l]) =>
          `<button type="button" class="fx-chip ${(S.bgFx || "") === k ? "on" : ""}" data-fpfx="${k}"><span class="fx-prev ${k ? "fx-" + k : ""}"></span><span class="fx-chip-lb">${l}</span></button>`).join("");
        fxr.querySelectorAll("[data-fpfx]").forEach((b) => { b.onclick = () => { setBgFx(b.dataset.fpfx); sync(); }; });
      }
      const ffr = $("fpFontRow");
      if (ffr) {
        ffr.innerHTML = FONTS.map(([id, name]) =>
          `<button class="tab ${(S.font || "") === id ? "active" : ""}" data-fpfont="${id}">${name}</button>`).join("");
        ffr.querySelectorAll("[data-fpfont]").forEach((b) => {
          const def = FONTS.find(([id]) => id === b.dataset.fpfont); // 버튼을 그 글꼴로 미리보기 (따옴표 충돌 피하려 JS로 지정)
          if (def && def[2]) b.style.fontFamily = def[2] + ", var(--font-sans)";
          b.onclick = () => { setFont(b.dataset.fpfont); sync(); };
        });
      }
    };
    $("modalBody").querySelectorAll(".fp-card").forEach((c) => {
      c.onclick = () => {
        const id = c.dataset.fp;
        if (id === "") S.retro = false;
        else { S.retro = true; S.retroSkin = id; }
        save(); applyTheme(); renderSettings(); sync();
      };
    });
    renderSwatches(); // 퍼스널 컬러 팔레트
    const fvr = $("fpVeilRange"); if (fvr) fvr.value = S.veil || 0;
    const fvv = $("fpVeilVal"); if (fvv) fvv.textContent = (S.veil || 0) + "%";
    const ftt = $("fpTplThumbs"); // 메인 템플릿 썸네일
    if (ftt) { const drawTpl = () => renderTplThumbs(ftt, S.template || "classic", (t) => { setTemplate(t); drawTpl(); }); drawTpl(); }
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
  function setFont(k) {
    if (!FONTS.some(([id]) => id === k)) k = "";
    S.font = k;
    save(); applyTheme(); renderSettings();
    const found = FONTS.find(([id]) => id === k);
    toast(k === "" ? "본문 글꼴을 기본으로 되돌렸어요" : `본문 글꼴을 '${found ? found[1] : ""}'(으)로 바꿨어요`);
  }
  function setWeekStart(w) { // 캘린더(+홈 이번 주)
    S.weekStart = w === "mon" ? "mon" : "sun";
    save(); renderSettings(); renderCalendar(); renderHome();
    toast(S.weekStart === "mon" ? "캘린더를 월요일 시작으로 바꿨어요" : "캘린더를 일요일 시작으로 바꿨어요");
  }
  function toggleCalWeekStart() { setWeekStart(S.weekStart === "mon" ? "sun" : "mon"); }
  function setWeekStartWeek(w) { // 스케줄러 주간 뷰
    S.weekStartWeek = w === "mon" ? "mon" : "sun";
    ttWeekStart = null; // 주 시작(주 키) 재계산
    save(); renderSettings(); renderTimetable();
    toast(S.weekStartWeek === "mon" ? "주간을 월요일 시작으로 바꿨어요" : "주간을 일요일 시작으로 바꿨어요");
  }
  function setWeekStartCircle(w) { // 스케줄러 원형 뷰
    S.weekStartCircle = w === "mon" ? "mon" : "sun";
    save(); renderSettings(); renderTimetable();
    toast(S.weekStartCircle === "mon" ? "하루를 월요일 시작으로 바꿨어요" : "하루를 일요일 시작으로 바꿨어요");
  }
  function toggleTtLink() {
    S.ttLink = !S.ttLink;
    save(); renderTimetable();
    toast(S.ttLink ? "주간↔하루를 연동했어요 (일정 공유)" : "하루를 분리했어요 (별도 일정)");
  }
  function toggleTtFixedLink() {
    S.ttFixedLink = S.ttFixedLink === false ? true : false;
    save(); renderSettings(); renderTimetable();
    toast(S.ttFixedLink ? "고정↔주간을 연동했어요 (고정 일정 함께 표시)" : "고정 시간표를 분리했어요 (주간엔 안 보여요)");
  }
  // 주말 제외 — 고정·주간·하루 뷰별 독립 설정. 값이 없으면 구버전 공용값(S.ttHideWeekend)로 폴백
  const TTWK_KEY = { fixed: "ttHideWeekendFixed", week: "ttHideWeekendWeek", circle: "ttHideWeekendCircle" };
  const TTWK_LABEL = { fixed: "고정", week: "주간", circle: "하루" };
  function ttHideWeekendFor(view) {
    const k = TTWK_KEY[view] || TTWK_KEY.week;
    return S[k] == null ? !!S.ttHideWeekend : !!S[k];
  }
  function toggleTtWeekendView(view) {
    const k = TTWK_KEY[view]; if (!k) return;
    S[k] = !ttHideWeekendFor(view);
    save(); renderSettings(); renderTimetable();
    const label = TTWK_LABEL[view];
    toast(S[k] ? `${label} 시간표에서 주말을 숨겼어요 (월~금)` : `${label} 시간표에 주말을 다시 표시해요`);
  }
  // 구버전 호환: 현재 보고 있는 뷰의 주말 제외를 토글
  function toggleTtWeekend() { toggleTtWeekendView(ttView); }
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
    const dTo = (ds) => dToAnniv(ds, today);
    const annivs = [];
    if (b && b.birthday) annivs.push(["생일", birthdayDDay(b)]);
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
      <button class="wtile ${id === "profile" ? "w2 wt-profile" : ""}" data-wid="${id}" data-wgo="${page}">
        ${id === "profile" && b && (b.cover || b.photo) ? `<i class="wt-bg" data-wtprofbg="1"></i>` : ""}
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
    const wtProfBg = el.querySelector("[data-wtprofbg]");
    if (wtProfBg && b) {
      if (b.cover) { wtProfBg.style.backgroundImage = `url(${b.cover})`; applyCoverFitTo(wtProfBg, coverFit(b, "home")); }
      else if (b.photo) { wtProfBg.style.backgroundImage = `url(${b.photo})`; applyCoverFitTo(wtProfBg, coverFit(b, "avatar")); }
    }
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
    // 홈/사이드바 아바타: 프로필 상세와 같은 coverFit("avatar") 적용 → 크기·위치 조정이 그대로 반영(WYSIWYG)
    applyAvatarPhoto($("heroPhoto"), b);
    applyAvatarPhoto($("sideAvatar"), b);

    $("heroBadges").innerHTML = buildBadges(b, ddText);
    const hc = $("homeCover");
    const hcb = $("homeCoverBg");
    if (hcb) {
      hcb.style.backgroundImage = b.cover ? `url(${b.cover})` : "";
      const hpb = $("homePosBtn");
      if (hpb) hpb.classList.toggle("hidden", !b.cover);
      applyCoverFitTo(hcb, coverFit(b, "home"));
    }
    applyBgFx();

    // 사이드바 최애 스위치
    const bs = $("biasSwitch");
    bs.innerHTML = "";
    if (S.biases.length > 1) {
      S.biases.forEach((bb) => {
        const btn = document.createElement("button");
        btn.className = bb.id === S.currentBias ? "current" : "";
        btn.title = bb.name;
        if (bb.photo) applyAvatarPhoto(btn, bb);
        else btn.textContent = bb.name[0];
        btn.onclick = () => { S.currentBias = bb.id; save(); renderAll(); };
        bs.appendChild(btn);
      });
    }

    // TODAY ('이번 주'에서 고른 날짜를 보여줄 수 있음)
    renderHomeToday(b);

    // 이번 달 지출
    const ym = todayKey().slice(0, 7);
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
      .filter((s) => s.date > todayKey())
      .sort((a, b2) => (a.date + (a.time || "")).localeCompare(b2.date + (b2.time || "")))
      .slice(0, 5);
    $("upcomingList").innerHTML = upcoming.length
      ? upcoming.map((s) => {
          const c = CATS[s.cat] || CAT_FALLBACK;
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
    const dTo = (ds) => dToAnniv(ds, today);
    const ddays = [];
    if (b.birthday) ddays.push({ ic: I("cake"), label: `${b.name} 생일${isLunarBirth(b) ? " (음력)" : ""}`, n: birthdayDDay(b), v: "--c-birthday" });
    if (b.debutDate) ddays.push({ ic: I("flag"), label: "데뷔 기념일", n: dTo(b.debutDate), v: "--c-comeback" });
    (b.annivs || []).forEach((a) => ddays.push({ ic: I("heart"), label: a.title, n: dTo(a.date), v: "--c-concert" }));
    const nextSch = byBias(S.schedules).filter((s) => s.date && s.date >= today).sort((a, c) => a.date.localeCompare(c.date))[0];
    if (nextSch) {
      const n = Math.round((stripTime(new Date(nextSch.date)) - stripTime(new Date())) / 86400000);
      ddays.push({ ic: I("bell"), label: nextSch.title, n, v: (CATS[nextSch.cat] || CAT_FALLBACK).v });
    }
    ddays.sort((a, c) => a.n - c.n);
    const ddEl = $("homeDday");
    if (ddEl) ddEl.innerHTML = ddays.length
      ? ddays.map((d) => `<div class="dday-card" style="--cat:var(${d.v})"><span class="dd-ic">${d.ic}</span><b>${d.n === 0 ? "D-DAY" : "D-" + d.n}</b><span class="dd-label">${esc(d.label)}</span></div>`).join("")
      : `<div class="dday-empty">생일·데뷔일을 등록하면 카운트다운이 떠요 (설정 → 최애 관리)</div>`;

    // 이번 주 스트립
    renderHomeWeek();

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
      if (typeof p.img === "string" && p.img.indexOf("data:") === 0 && !p.imgKey) { p.imgKey = uid(); imgPut(p.imgKey, p.img); }
      if (typeof p.imgOrig === "string" && p.imgOrig.indexOf("data:") === 0 && !p.imgOrigKey) { p.imgOrigKey = uid(); imgPut(p.imgOrigKey, p.imgOrig); }
      if (typeof p.imgBackOrig === "string" && p.imgBackOrig.indexOf("data:") === 0 && !p.imgBackOrigKey) { p.imgBackOrigKey = uid(); imgPut(p.imgBackOrigKey, p.imgBackOrig); }
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
    (S.styles || []).forEach((s) => {
      assignImgKey(s, "img", "imgKey");
      if (Array.isArray(s.imgs) && s.imgs.length && s.imgs.every((im) => typeof im === "string" && im.indexOf("data:") === 0)) {
        s.imgKeys = s.imgs.map((im) => { const key = imgKeyOf(im); if (!imgStored.has(key)) { imgStored.add(key); imgPut(key, im); } return key; });
      }
    });
    assignImgKey(S.membership, "photo", "photoKey");
    assignImgKey(S.membership, "memberPhoto", "memberPhotoKey");
  }
  // localStorage에 저장할 때 쓰는 가벼운 사본: 포카 사진(base64)은 빼고 참조(imgKey)만 남김
  function persistState() {
    const lite = Object.assign({}, S);
    lite.photocards = (S.photocards || []).map((p) => {
      let q = p;
      if (p.imgKey && typeof p.img === "string" && p.img.indexOf("data:") === 0) { if (q === p) q = Object.assign({}, p); delete q.img; }
      if (p.imgOrigKey && typeof p.imgOrig === "string" && p.imgOrig.indexOf("data:") === 0) { if (q === p) q = Object.assign({}, p); delete q.imgOrig; }
      if (p.imgBackOrigKey && typeof p.imgBackOrig === "string" && p.imgBackOrig.indexOf("data:") === 0) { if (q === p) q = Object.assign({}, p); delete q.imgBackOrig; }
      return q;
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
    lite.styles = (S.styles || []).map((s) => {
      let q = stripImgField(s, "img", "imgKey");
      if (Array.isArray(s.imgs) && s.imgs.length && Array.isArray(s.imgKeys) && s.imgKeys.length === s.imgs.length) { q = Object.assign({}, q); delete q.imgs; }
      return q;
    });
    if (S.membership) lite.membership = stripImgField(stripImgField(S.membership, "photo", "photoKey"), "memberPhoto", "memberPhotoKey");
    return lite;
  }
  // 시작할 때 IndexedDB에 있는 포카 사진을 메모리(S)로 다시 채워 넣음
  function hydrateImages() {
    const tasks = [];
    (S.photocards || []).forEach((p) => {
      if (!p.img && p.imgKey) tasks.push(imgGet(p.imgKey).then((v) => { if (v) p.img = v; }));
      if (!p.imgOrig && p.imgOrigKey) tasks.push(imgGet(p.imgOrigKey).then((v) => { if (v) p.imgOrig = v; }));
      if (!p.imgBackOrig && p.imgBackOrigKey) tasks.push(imgGet(p.imgBackOrigKey).then((v) => { if (v) p.imgBackOrig = v; }));
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
      if ((!Array.isArray(s.imgs) || !s.imgs.length) && Array.isArray(s.imgKeys) && s.imgKeys.length) {
        tasks.push(Promise.all(s.imgKeys.map((k) => { imgStored.add(k); return imgGet(k); })).then((vals) => { s.imgs = vals.filter((v) => v != null); }));
      }
    });
    if (S.membership && !S.membership.photo && S.membership.photoKey) {
      tasks.push(imgGet(S.membership.photoKey).then((v) => { if (v) S.membership.photo = v; }));
    }
    if (S.membership && !S.membership.memberPhoto && S.membership.memberPhotoKey) {
      tasks.push(imgGet(S.membership.memberPhotoKey).then((v) => { if (v) S.membership.memberPhoto = v; }));
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
      <div class="field"><label>이름 (선택 · 최대 6자)</label><input type="text" id="musicName" maxlength="6" placeholder=""></div>
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

  function isAnnivOn(dateStr, refKey) {
    const d = new Date(dateStr), n = refKey ? new Date(refKey) : new Date();
    return d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }
  function isAnnivToday(dateStr) { return isAnnivOn(dateStr); }

  /* 홈 'TODAY' 카드 — homeDay(없으면 오늘)에 해당하는 일정·기념일을 보여줌 */
  function renderHomeToday(b) {
    b = b || curBias();
    const tk = homeDay || todayKey();
    const isToday = tk === todayKey();
    const labelEl = $("todayDateLabel");
    if (labelEl) {
      const d = new Date(tk);
      labelEl.textContent = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
    }
    // 제목(TODAY ↔ 선택한 날) · '오늘로' 되돌리기 버튼 표시
    const titleEl = $("todayTitle");
    if (titleEl) titleEl.textContent = "TODAY"; // 제목 고정: 글자 폭 변화로 화면이 움직이지 않도록
    const backBtn = $("todayBackBtn");
    if (backBtn) backBtn.style.visibility = isToday ? "hidden" : "visible"; // 자리는 늘 차지 → 버튼이 생겼다 사라져도 화면이 안 움직임

    const items = b ? byBias(S.schedules).filter((s) => s.date === tk).sort((a, b2) => (a.time || "").localeCompare(b2.time || "")) : [];
    const annivs = [];
    if (b) {
      if (b.birthday && birthdayOnKey(b, tk)) annivs.push({ cat: "birthday", title: `${b.name} 생일`, time: "" });
      if (b.debutDate && isAnnivOn(b.debutDate, tk)) annivs.push({ cat: "birthday", title: "데뷔 기념일", time: "" });
      (b.annivs || []).forEach((a) => { if (isAnnivOn(a.date, tk)) annivs.push({ cat: "birthday", title: a.title, time: "" }); });
    }
    const all = [...annivs, ...items];
    const sc = $("todayScroll");
    if (sc) sc.innerHTML = all.length
      ? all.map((s) => {
          const c = CATS[s.cat] || CAT_FALLBACK;
          return `<div class="today-card" style="--cat:var(${c.v})">
            <div class="tc-cat">${c.name}</div>
            <div class="tc-time">${esc(s.time) || "하루 종일"}</div>
            <div class="tc-title">${esc(s.title)}</div>
          </div>`;
        }).join("")
      : `<div class="today-empty">${isToday ? "오늘은 조용한 날이에요." : "이 날은 등록된 일정이 없어요."}<br>아래 '일정 추가'로 등록해 보세요</div>`;
  }

  /* 홈 '이번 주' 스트립 — 오늘/선택한 날을 표시. 날짜를 누르면 TODAY 카드만 바꿈(캘린더로 안 감) */
  function renderHomeWeek() {
    const wkEl = $("homeWeek");
    if (!wkEl) return;
    const today = todayKey();
    const now = new Date();
    const ws = S.weekStart === "mon" ? 1 : 0;
    const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() - ws + 7) % 7) + homeWeekOffset * 7);
    const schedDates = new Set(byBias(S.schedules).map((s) => s.date));
    const names = ["일", "월", "화", "수", "목", "금", "토"];
    const sel = homeDay || today; // 현재 TODAY 카드가 보여주는 날짜
    let wk = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = fmtDate(d);
      const wd = d.getDay();
      const cls = (key === today ? " today" : "") + (key === sel && key !== today ? " sel" : "");
      wk += `<button class="wk-day${cls}" data-date="${key}"><span class="wk-name ${wd === 0 ? "sun" : wd === 6 ? "sat" : ""}">${names[wd]}</span><span class="wk-num">${d.getDate()}</span><i class="wk-dot ${schedDates.has(key) ? "on" : ""}"></i></button>`;
    }
    wkEl.innerHTML = wk;
    wkEl.querySelectorAll("[data-date]").forEach((btn) => {
      btn.onclick = () => {
        homeDay = (btn.dataset.date === todayKey()) ? null : btn.dataset.date;
        renderHomeToday();
        renderHomeWeek();
      };
    });
    const titleEl = $("homeWeekTitle"), resetEl = $("homeWeekToday");
    if (titleEl) {
      if (homeWeekOffset === 0) titleEl.textContent = "이번 주";
      else { const e = new Date(start); e.setDate(start.getDate() + 6); titleEl.textContent = `${start.getMonth() + 1}.${start.getDate()} – ${e.getMonth() + 1}.${e.getDate()}`; }
    }
    if (resetEl) { resetEl.classList.toggle("hidden", homeWeekOffset === 0); resetEl.onclick = () => { homeWeekOffset = 0; renderHomeWeek(); }; }
    const _hwPv = $("homeWeekPrev"), _hwNx = $("homeWeekNext");
    if (_hwPv) _hwPv.onclick = () => { homeWeekOffset--; renderHomeWeek(); };
    if (_hwNx) _hwNx.onclick = () => { homeWeekOffset++; renderHomeWeek(); };
  }

  // '이번 주'/'TODAY'에서 고른 날짜를 캘린더에서 열기 (일정 추가용)
  function homeOpenCalendar() {
    selDate = homeDay || todayKey();
    const d = new Date(selDate);
    calCur = new Date(d.getFullYear(), d.getMonth(), 1);
    go("calendar");
  }
  // 'TODAY'를 오늘로 되돌리기
  function homeBackToToday() {
    homeDay = null;
    homeWeekOffset = 0;
    renderHomeToday();
    renderHomeWeek();
  }

  function renderMemberCard() {
    const m = S.membership;
    const b = curBias();
    const sinceText = "SINCE " + (b && b.startDate ? b.startDate.slice(0, 4) : "—");
    const exp = m.expiry ? Math.round((new Date(m.expiry) - new Date(todayKey())) / 86400000) : null;
    const noText = exp !== null
      ? (exp < 0 ? "EXPIRED" : `EXP D-${exp}`) + " · NO. " + (m.no || "0001")
      : "NO. " + (m.no || "0001");
    // 홈·설정 두 곳의 카드 미리보기를 같이 채움
    const fill = (cardId, iconId, titleId, nameId, sinceId, noId, photoId) => {
      const card = $(cardId);
      if (!card) return;
      card.className = "member-card mc-style-" + (m.style || "gradient") + (m.photo ? " has-photo" : "") + (m.memberPhoto ? " has-idphoto" : "");
      card.style.backgroundImage = m.photo ? `linear-gradient(135deg, rgba(0,0,0,.55), rgba(0,0,0,.2)), url(${m.photo})` : "";
      card.style.backgroundSize = m.photo ? "cover" : "";
      card.style.backgroundPosition = m.photo ? "center" : "";
      const pimg = $(photoId);
      if (pimg) {
        if (m.memberPhoto) { pimg.src = m.memberPhoto; pimg.classList.remove("hidden"); }
        else { pimg.removeAttribute("src"); pimg.classList.add("hidden"); }
      }
      $(iconId).textContent = m.icon || "✦";
      $(titleId).textContent = m.title || "MY STAR PASS";
      $(nameId).textContent = m.name || "MY NAME";
      $(sinceId).textContent = sinceText;
      $(noId).textContent = noText;
    };
    fill("memberCard", "mcIcon", "mcTitle", "mcName", "mcSince", "mcNo", "mcPhotoImg");
    fill("setMemberCard", "setMcIcon", "setMcTitle", "setMcName", "setMcSince", "setMcNo", "setMcPhotoImg");
    const mw2 = document.querySelector(".membership-wrap .hint");
    if (mw2) mw2.textContent = exp !== null && exp >= 0 && exp <= 30
      ? `멤버십 만료까지 ${exp}일! 갱신 잊지 마세요`
      : "카드를 누르면 수정할 수 있어요";
  }

  /* ═══ 프로필 상세 페이지 ═══ */
  // 위치·크기(coverFit) 그대로 반영해 캔버스에 이미지를 그림 (background cover + position + zoom/shift)
  function drawCoverFit(ctx, img, bx, by, W, H, fit) {
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const px = (fit && fit.pos ? fit.pos.x : 50) / 100, py = (fit && fit.pos ? fit.pos.y : 50) / 100;
    const posX = (W - dw) * px, posY = (H - dh) * py;
    const z = (fit && fit.zoom ? fit.zoom : 100) / 100;
    const shx = (fit && fit.shift ? fit.shift.x : 0) * W, shy = (fit && fit.shift ? fit.shift.y : 0) * H;
    const cx = bx + W / 2, cy = by + H / 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.translate(shx, shy); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.drawImage(img, bx + posX, by + posY, dw, dh);
    ctx.restore();
  }
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const _loadImg = (src) => new Promise((res) => { if (!src) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  // 프로필(배경+프로필 사진)을 공유용 카드 이미지로 합성 → 보기/저장/공유 모달
  const PCARD_RATIOS = [["기본", 720 / 574], ["1:1", 1], ["4:5", 4 / 5], ["3:4", 3 / 4], ["9:16", 9 / 16]];
  function openProfileShare() {
    const b = curBias();
    if (!b) return;
    if (!b.cover && !b.photo) return toast("프로필 사진이나 배경을 먼저 등록해 주세요!");
    showProfileCard(b, "기본");
  }
  function pcardDims(ratioKey) {
    const ratio = (PCARD_RATIOS.find((x) => x[0] === ratioKey) || PCARD_RATIOS[0])[1];
    const W = 720, H = Math.round(W / ratio);
    const avD = Math.round(W * 0.233), r = avD / 2;
    const coverH = Math.max(Math.round(H * 0.34), H - (r + 168));
    return { W, H, avD, r, coverH };
  }
  // 캔버스에 카드를 즉시 그림 (cover fit은 인자로 받아 라이브 조정)
  function drawProfileCard(canvas, b, ratioKey, fit, avFit, ci, ai, scale) {
    const { W, H, avD, r, coverH } = pcardDims(ratioKey);
    const avCY = coverH, textTop = coverH + r + 30;
    const SC = scale || 1;
    canvas.width = W * SC; canvas.height = H * SC;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(SC, 0, 0, SC, 0, 0);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    if (ci) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, coverH); ctx.clip(); drawCoverFit(ctx, ci, 0, 0, W, coverH, fit); ctx.restore(); }
    else { ctx.fillStyle = "#d9d9de"; ctx.fillRect(0, 0, W, coverH); }
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, avCY, r + 7, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, avCY, r, 0, Math.PI * 2); ctx.clip();
    if (ai) drawCoverFit(ctx, ai, W / 2 - r, avCY - r, avD, avD, avFit);
    else { ctx.fillStyle = "#e9e9ee"; ctx.fillRect(W / 2 - r, avCY - r, avD, avD); }
    ctx.restore();
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#141414"; ctx.font = "bold 36px sans-serif"; ctx.fillText(b.name || "최애", W / 2, textTop + 20);
    ctx.fillStyle = "#9a9aa0"; ctx.font = "bold 15px sans-serif"; ctx.fillText((b.group || "MY BIAS").toUpperCase(), W / 2, textTop + 46);
    const dd = dPlus(b.startDate); const ddText = dd ? `덕질 D+${dd} ♥` : "덕질 ♥";
    ctx.font = "bold 15px sans-serif";
    const bw = ctx.measureText(ddText).width + 30, bx = W / 2 - bw / 2, by = textTop + 64;
    ctx.fillStyle = "#141414"; roundRectPath(ctx, bx, by, bw, 32, 16); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.fillText(ddText, W / 2, by + 21);
    ctx.fillStyle = "#c4c4cc"; ctx.font = "600 12px sans-serif"; ctx.fillText("MY STAR CALENDAR", W / 2, H - 18);
  }
  function showProfileCard(b, ratioKey) {
    let curRatio = ratioKey || "기본";
    let cardFit = JSON.parse(JSON.stringify(coverFit(b, "prof")));
    let avFit = JSON.parse(JSON.stringify(coverFit(b, "avatar")));
    let ci = null, ai = null, coverRatio = null, avRatio = null;
    openModalRaw("프로필 카드", `
      <div class="crop-ratios" id="pcardRatios" style="justify-content:center;flex-wrap:wrap;margin-bottom:10px"></div>
      <div class="pcard-preview"><canvas id="pcardCanvas"></canvas></div>
      <p class="dt-hint-mini" style="text-align:center;margin:8px 0 0">배경·프로필을 끌어 위치, 휠·손가락 모으기로 크기 · <button type="button" id="pcardReset" style="background:none;border:none;color:var(--accent-deep);text-decoration:underline;cursor:pointer;font:inherit;padding:0 2px">초기화</button></p>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn btn-primary btn-sm" id="pcardSave">이미지 저장</button>
        ${navigator.share ? `<button class="btn btn-ghost btn-sm" id="pcardShare">${I("share")} 공유</button>` : ""}
      </div>`);
    if ($("modalBox")) $("modalBox").classList.add("wide");
    $("pcardRatios").innerHTML = PCARD_RATIOS.map(([k]) => `<button type="button" class="crop-ratio" data-pcr="${k}">${k}</button>`).join("");
    const canvas = $("pcardCanvas");
    const redraw = () => drawProfileCard(canvas, b, curRatio, cardFit, avFit, ci, ai);
    const fnameOf = (rk) => `프로필_${b.name || "최애"}_${rk.replace(":", "x")}.png`;
    const markActive = () => $("pcardRatios").querySelectorAll("[data-pcr]").forEach((x) => x.classList.toggle("on", x.dataset.pcr === curRatio));
    markActive(); redraw();
    Promise.all([_loadImg(b.cover), _loadImg(b.photo)]).then(([c, a]) => { ci = c; ai = a; coverRatio = ci ? ci.naturalWidth / ci.naturalHeight : null; avRatio = ai ? ai.naturalWidth / ai.naturalHeight : null; redraw(); });
    $("pcardRatios").querySelectorAll("[data-pcr]").forEach((bn) => { bn.onclick = () => { curRatio = bn.dataset.pcr; markActive(); redraw(); }; });
    $("pcardReset").onclick = () => { cardFit = JSON.parse(JSON.stringify(coverFit(b, "prof"))); avFit = JSON.parse(JSON.stringify(coverFit(b, "avatar"))); redraw(); };

    // 배경(cover) / 동그란 프로필(av)을 영역으로 구분해 각각 끌어 위치 + 휠·핀치 확대
    canvas.style.touchAction = "none";
    const ptrs = new Map();
    let drag = null, pinch = null;
    const canvasPt = (clientX, clientY) => { const rect = canvas.getBoundingClientRect(); const scale = canvas.width / rect.width; return { cx: (clientX - rect.left) * scale, cy: (clientY - rect.top) * scale, scale }; };
    const targetOf = (clientX, clientY) => { const { cx, cy } = canvasPt(clientX, clientY); const d = pcardDims(curRatio); if (ai && Math.hypot(cx - d.W / 2, cy - d.coverH) <= d.r + 8) return "av"; if (ci && cy < d.coverH) return "cover"; return null; };
    const fitBox = (target) => { const d = pcardDims(curRatio); return target === "av" ? { fit: avFit, boxW: d.avD, boxH: d.avD, imgRatio: avRatio } : { fit: cardFit, boxW: d.W, boxH: d.coverH, imgRatio: coverRatio }; };
    const beginDrag = (cx, cy, target) => { const fb = fitBox(target); drag = { x: cx, y: cy, target, pos: { ...fb.fit.pos }, shift: { ...fb.fit.shift }, z: (fb.fit.zoom || 100) / 100 }; };
    canvas.onpointerdown = (e) => {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const p = [...ptrs.values()];
        const mt = targetOf((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2) || "cover";
        const fb = fitBox(mt);
        pinch = { dist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, zoom: fb.fit.zoom || 100, target: mt }; drag = null;
      } else { const t = targetOf(e.clientX, e.clientY); if (t) beginDrag(e.clientX, e.clientY, t); else drag = null; }
    };
    canvas.onpointermove = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const { scale } = canvasPt(e.clientX, e.clientY);
      if (pinch && ptrs.size >= 2) {
        const p = [...ptrs.values()];
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        const fb = fitBox(pinch.target);
        fb.fit.zoom = Math.min(300, Math.max(100, Math.round(pinch.zoom * (dist / pinch.dist))));
        clampShift(fb.fit); redraw();
      } else if (drag) {
        const fb = fitBox(drag.target), fit = fb.fit;
        const dx = (e.clientX - drag.x) * scale, dy = (e.clientY - drag.y) * scale;
        if (drag.z > 1.001) {
          const lim = (drag.z - 1) / 2;
          fit.shift.x = Math.min(lim, Math.max(-lim, drag.shift.x + dx / fb.boxW));
          fit.shift.y = Math.min(lim, Math.max(-lim, drag.shift.y + dy / fb.boxH));
        } else {
          let nx = drag.pos.x, ny = drag.pos.y; const boxRatio = fb.boxW / fb.boxH;
          if (fb.imgRatio) { if (fb.imgRatio > boxRatio) { const ow = fb.boxH * fb.imgRatio - fb.boxW; if (ow > 1) nx = drag.pos.x - (dx * 100) / ow; } else { const oh = fb.boxW / fb.imgRatio - fb.boxH; if (oh > 1) ny = drag.pos.y - (dy * 100) / oh; } }
          fit.pos.x = Math.min(100, Math.max(0, +nx.toFixed(1)));
          fit.pos.y = Math.min(100, Math.max(0, +ny.toFixed(1)));
        }
        redraw();
      }
    };
    const endPtr = (e) => { ptrs.delete(e.pointerId); if (ptrs.size === 1) { pinch = null; const p = [...ptrs.values()][0]; const t = targetOf(p.x, p.y); if (t) beginDrag(p.x, p.y, t); else drag = null; } else if (ptrs.size === 0) { drag = null; pinch = null; } };
    canvas.onpointerup = endPtr;
    canvas.onpointercancel = endPtr;
    canvas.onwheel = (e) => { const t = targetOf(e.clientX, e.clientY); if (!t) return; e.preventDefault(); const fb = fitBox(t); fb.fit.zoom = Math.min(300, Math.max(100, Math.round((fb.fit.zoom || 100) * (e.deltaY < 0 ? 1.08 : 0.93)))); clampShift(fb.fit); redraw(); };

    const exportCard = (cb) => { const off = document.createElement("canvas"); drawProfileCard(off, b, curRatio, cardFit, avFit, ci, ai, 2); off.toBlob(cb, "image/png"); };
    $("pcardSave").onclick = () => exportCard((blob) => { if (!blob) return toast("이미지를 만들지 못했어요"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = fnameOf(curRatio); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); toast("이미지를 저장했어요"); });
    const sh = $("pcardShare");
    if (sh) sh.onclick = () => exportCard(async (blob) => { if (!blob) return; try { const file = new File([blob], fnameOf(curRatio), { type: "image/png" }); if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: b.name || "프로필" }); else await navigator.share({ title: b.name || "프로필" }); } catch (e) {} });
  }

  const FUN_FACTS = [["zodiac", "별자리"], ["chinese", "띠"], ["stone", "탄생석"], ["flower", "탄생화"], ["debut", "데뷔 기념일"], ["milestone", "다음 기념일"]];
  function funOn(k) { return !(S.funFacts && S.funFacts[k] === false); }
  function openFunFactsSettings() {
    const rows = FUN_FACTS.map(([k, l]) => `<div class="field row-field" style="margin:0 0 12px"><label>${l}</label><button type="button" class="switch ${funOn(k) ? "on" : ""}" data-ff="${k}"><span class="knob"></span></button></div>`).join("");
    openModalRaw("별별 정보 표시", rows + `<p class="hint" style="margin:2px 0 14px">끄면 프로필 카드와 배지에서 숨겨져요. 생일·데뷔일이 없으면 자동으로도 안 떠요.</p><button class="btn btn-primary btn-lg" id="ffDone">완료</button>`);
    $("modalBody").querySelectorAll("[data-ff]").forEach((btn) => {
      btn.onclick = () => { const k = btn.dataset.ff; if (!S.funFacts) S.funFacts = {}; S.funFacts[k] = !funOn(k); btn.classList.toggle("on", S.funFacts[k]); save(); renderProfile(); renderHome(); };
    });
    $("ffDone").onclick = closeModal;
  }
  function renderProfile() {
    const b = curBias();
    if (!b || !$("profName")) return;
    const dd = dPlus(b.startDate);
    const ddText = dd ? `D+${dd}` : "D-DAY";
    $("profName").textContent = b.name;
    $("profGroup").textContent = b.group || "MY BIAS";
    $("profBadges").innerHTML = buildBadges(b, ddText);
    const avBg = $("profAvatarBg");
    if (avBg) { avBg.style.backgroundImage = b.photo ? `url(${b.photo})` : ""; applyCoverFitTo(avBg, coverFit(b, "avatar")); }
    $("profCover").style.backgroundImage = b.cover ? `url(${b.cover})` : "";
    applyCoverFitTo($("profCover"), coverFit(b, "prof"));
    const dDayTo = (ds) => {
      if (!ds) return "";
      const n = dToAnniv(ds);
      return n === 0 ? "D-DAY" : "D-" + n;
    };
    const rows = [["덕질 시작일", b.startDate || "—", ""], ["생일", birthdayLabel(b), b.birthday ? birthdayDDayText(b) : ""], ["데뷔일", b.debutDate || "—", dDayTo(b.debutDate)]];
    (b.annivs || []).forEach((a) => rows.push([esc(a.title), a.date, dDayTo(a.date), a.id]));
    $("annivList").innerHTML = rows.map(([k, v, dd, aid]) => `<li><span>${k}${dd ? ` <em class="al-dd">${dd}</em>` : ""}</span><span class="al-v">${v}${aid ? ` <button class="dl-del" data-anniv="${aid}">${I("x")}</button>` : ""}</span></li>`).join("")
      + `<li class="al-add"><button class="chip-btn" onclick="App.openModal('anniv')">+ 기념일 추가</button></li>`;
    $("annivList").querySelectorAll("[data-anniv]").forEach((bn) => {
      bn.onclick = () => {
        b.annivs = (b.annivs || []).filter((a) => a.id !== bn.dataset.anniv);
        save(); renderProfile(); renderHome(); toast("기념일을 지웠어요");
      };
    });
    const ff = $("funFacts"), funCard = $("funCard");
    if (ff) {
      const items = [];
      const z = zodiacOf(b);
      if (funOn("zodiac") && z) { const tr = ZTRAIT[z.key]; items.push(["별자리", `${z.symbol} ${z.name}${tr ? ` · ${tr[0]} · ${tr[1]}` : ""}`]); }
      const cz = chineseZodiacOf(b);
      if (funOn("chinese") && cz) items.push(["띠", cz]);
      const md = birthSolarMD(b);
      if (md) {
        const st = BIRTHSTONE[md.mo - 1]; if (funOn("stone") && st) items.push(["탄생석", `<i class="ff-dot" style="background:${st[1]}"></i>${st[0]}`]);
        const fl = BIRTHFLOWER[md.mo - 1]; if (funOn("flower") && fl) items.push(["탄생화", `${fl[0]} · ${fl[1]}`]);
      }
      const da = debutAnniv(b);
      if (funOn("debut") && da) items.push(["데뷔 기념일", `${da.years}주년 ${da.d === 0 ? "D-DAY" : "D-" + da.d}`]);
      const ms = nextMilestone(b);
      if (funOn("milestone") && ms) items.push(["다음 기념일", `${ms.label} ${ms.d === 0 ? "D-DAY" : "D-" + ms.d}`]);
      const anyAvail = !!(zodiacOf(b) || chineseZodiacOf(b) || birthSolarMD(b) || debutAnniv(b) || nextMilestone(b));
      ff.innerHTML = items.length
        ? items.map(([k, v]) => `<li><span>${k}</span><span class="al-v">${v}</span></li>`).join("")
        : `<li><span class="al-v" style="color:var(--muted);font-weight:600">표시할 항목이 없어요 · 위 ‘표시 설정’에서 켜보세요</span></li>`;
      if (funCard) funCard.classList.toggle("hidden", items.length === 0 && !anyAvail);
    }
    applyBgFx();
    renderDeco();
  }

  function editCurrentBias() {
    openModal("bias", S.currentBias);
  }

  /* ═══ 배경 사진 위치 조정 (드래그 패닝) ═══ */
  let posMode = false, posGesture = false;
  let coverRatio = null;

  let posTarget = "prof";
  const posRefs = () => posTarget === "home"
    ? { wrap: $("homeCover"), cover: $("homeCoverBg"), btn: $("homePosBtn"), zoom: $("zoomHome") }
    : posTarget === "avatar"
    ? { wrap: $("profAvatar"), cover: $("profAvatarBg"), btn: $("avatarPosBtn"), zoom: $("zoomAvatar") }
    : { wrap: $("heroWrap"), cover: $("profCover"), btn: $("posBtn"), zoom: $("zoomProf") };

  /* 커버 조정값은 화면별로 따로 저장 (홈은 템플릿별, 프로필 상세는 별도) */
  const fitKey = (target) => target === "home" ? "home:" + (S.template || "classic") : target === "avatar" ? "avatar" : "prof";
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
  // 작은 원형 아바타(홈 hero·사이드바)도 프로필 상세와 같은 avatar coverFit을 적용 — 내부 .av-bg를 만들어 변형
  function applyAvatarPhoto(el, b) {
    if (!el) return;
    let bg = el.querySelector(":scope > .av-bg");
    if (b && b.photo) {
      if (!bg) { bg = document.createElement("i"); bg.className = "av-bg"; el.appendChild(bg); }
      bg.style.backgroundImage = `url(${b.photo})`;
      applyCoverFitTo(bg, coverFit(b, "avatar"));
      el.style.backgroundImage = "";
    } else {
      if (bg) bg.remove();
      el.style.backgroundImage = "";
    }
  }
  function applyAllCoverFits(b) {
    if (!b) return;
    applyCoverFitTo($("homeCoverBg"), coverFit(b, "home"));
    applyCoverFitTo($("profCover"), coverFit(b, "prof"));
    applyCoverFitTo($("profAvatarBg"), coverFit(b, "avatar"));
    // 홈/사이드바 아바타도 같은 avatar 값으로 즉시 갱신
    ["heroPhoto", "sideAvatar"].forEach((id) => {
      const wrap = $(id); const bg = wrap && wrap.querySelector(":scope > .av-bg");
      if (bg) applyCoverFitTo(bg, coverFit(b, "avatar"));
    });
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
      const isAv = posTarget === "avatar";
      const { wrap, btn } = posRefs();
      const b = curBias();
      const img = isAv ? b && b.photo : b && b.cover;
      if (!b || !img) return toast(isAv ? "먼저 프로필 사진을 등록해 주세요!" : "먼저 배경 사진을 등록해 주세요!");
      if (decoMode) toggleDeco();
      posMode = true;
      coverFit(b, posTarget); // fit 시드 보장
      coverRatio = null;
      const im = new Image();
      im.onload = () => { coverRatio = im.width / im.height; };
      im.src = img;
      wrap.classList.add("pos-on");
      btn.innerHTML = I("check");
      btn.title = "위치 저장";
      const { zoom } = posRefs();
      if (zoom) zoom.classList.add("hidden");
      toast("드래그로 위치, 휠·손가락 모으기로 확대/축소!");
    } else {
      const isAv = posTarget === "avatar";
      const { wrap, btn, zoom } = posRefs();
      posMode = false;
      wrap.classList.remove("pos-on");
      btn.innerHTML = I("move");
      btn.title = isAv ? "프로필 사진 위치 조정" : "배경 위치 조정";
      if (zoom) zoom.classList.add("hidden");
      save(); renderAll();
      toast(isAv ? "프로필 사진 위치를 저장했어요" : "배경 위치를 저장했어요");
    }
  }

  // 프로필 사진 크게 보기 + 위치·크기 조정 (작은 아바타와 같은 coverFit.avatar 모델 → WYSIWYG)
  function openAvatarViewer() {
    if (posMode) return;
    const b = curBias();
    if (!b || !b.photo) return toast("프로필 사진을 먼저 등록해 주세요!");
    const orig = coverFit(b, "avatar");
    const fit = { pos: { ...orig.pos }, zoom: orig.zoom || 100, shift: { ...orig.shift } };
    openModalRaw("프로필 사진", `
      <div class="av-edit" id="avEdit"><i class="av-edit-bg" id="avEditBg" style="background-image:url(${b.photo})"></i></div>
      <p class="dt-hint-mini" style="margin-top:16px">사진을 드래그해 위치를, 휠(또는 손가락 모으기)로 크기를 맞춰요</p>
      <div class="btn-row" style="margin-bottom:10px">
        <button class="btn btn-ghost btn-sm" id="avChange">사진 변경</button>
        <button class="btn btn-ghost btn-sm" id="avReset">초기화</button>
      </div>
      <button class="btn btn-primary btn-lg" id="avSave">저장</button>
    `);
    const bg = $("avEditBg"), area = $("avEdit");
    let ratio = null; const im = new Image(); im.onload = () => { ratio = im.width / im.height; }; im.src = b.photo;
    const apply = () => applyCoverFitTo(bg, fit);
    apply();
    // 끌어 이동 + 두 손가락/휠로 확대 — 슬라이더 없이
    area.style.touchAction = "none";
    const ptrs = new Map();
    let mode = null, dragStart = null, pinchDist = 0, pinchZoom = 100;
    const startDrag = (cx, cy) => {
      const rect = area.getBoundingClientRect();
      dragStart = { x: cx, y: cy, rect, z: (fit.zoom || 100) / 100, pos: { ...fit.pos }, shift: { ...fit.shift }, boxRatio: rect.width / rect.height };
    };
    area.onpointerdown = (e) => {
      e.preventDefault();
      try { area.setPointerCapture(e.pointerId); } catch (_) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const p = [...ptrs.values()];
        pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        pinchZoom = fit.zoom || 100; mode = "pinch";
      } else { mode = "drag"; startDrag(e.clientX, e.clientY); }
    };
    area.onpointermove = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === "pinch" && ptrs.size >= 2) {
        const p = [...ptrs.values()];
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        fit.zoom = Math.min(300, Math.max(100, Math.round(pinchZoom * (dist / pinchDist))));
        clampShift(fit); apply();
      } else if (mode === "drag" && dragStart) {
        const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
        if (dragStart.z > 1.001) {
          const lim = (dragStart.z - 1) / 2;
          fit.shift.x = Math.min(lim, Math.max(-lim, dragStart.shift.x + dx / dragStart.rect.width));
          fit.shift.y = Math.min(lim, Math.max(-lim, dragStart.shift.y + dy / dragStart.rect.height));
        } else {
          let nx = dragStart.pos.x, ny = dragStart.pos.y;
          if (ratio) { if (ratio > dragStart.boxRatio) { const ow = dragStart.rect.height * ratio - dragStart.rect.width; if (ow > 1) nx = dragStart.pos.x - (dx * 100) / ow; } else { const oh = dragStart.rect.width / ratio - dragStart.rect.height; if (oh > 1) ny = dragStart.pos.y - (dy * 100) / oh; } }
          else { nx = dragStart.pos.x - dx * 0.25; ny = dragStart.pos.y - dy * 0.25; }
          fit.pos.x = Math.min(100, Math.max(0, +nx.toFixed(1))); fit.pos.y = Math.min(100, Math.max(0, +ny.toFixed(1)));
        }
        apply();
      }
    };
    const endPtr = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size === 0) { mode = null; dragStart = null; }
      else if (ptrs.size === 1) { mode = "drag"; const p = [...ptrs.values()][0]; startDrag(p.x, p.y); }
    };
    area.onpointerup = endPtr;
    area.onpointercancel = endPtr;
    area.onwheel = (e) => {
      e.preventDefault();
      fit.zoom = Math.min(300, Math.max(100, Math.round((fit.zoom || 100) * (e.deltaY < 0 ? 1.08 : 0.93))));
      clampShift(fit); apply();
    };
    $("avChange").onclick = () => { closeModal(); document.getElementById("profPhotoInput").click(); };
    $("avReset").onclick = () => { fit.pos = { x: 50, y: 50 }; fit.zoom = 100; fit.shift = { x: 0, y: 0 }; apply(); };
    $("avSave").onclick = () => { b.coverFit["avatar"] = fit; save(); renderAll(); closeModal(); toast("프로필 사진을 저장했어요"); };
  }

  function coverDragStart(e) {
    if (!posMode || posGesture) return;
    if (e.target.closest && (e.target.closest(".zoom-btns") || e.target.closest(".cover-pos-btn") || e.target.closest(".hero-pos-btn") || e.target.closest(".hero-deco-btn") || e.target.closest(".av-pos-btn"))) return;
    const b = curBias();
    const dragImg = posTarget === "avatar" ? b && b.photo : b && b.cover;
    if (!b || !dragImg) return;
    e.preventDefault();
    const refs = posRefs();
    const rect = refs.wrap.getBoundingClientRect();
    const fit = coverFit(b, posTarget);
    const boxRatio = rect.width / rect.height;
    const ptrs = new Map([[e.pointerId, { x: e.clientX, y: e.clientY }]]);
    let dragBase = null, pinch = null;
    const beginDrag = () => {
      const p = [...ptrs.values()][0];
      dragBase = { x: p.x, y: p.y, pos: { ...fit.pos }, shift: { ...fit.shift }, z: (fit.zoom || 100) / 100 };
    };
    beginDrag();
    posGesture = true;
    const onDown = (ev) => {
      ev.preventDefault && ev.preventDefault();
      ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (ptrs.size === 2) {
        const p = [...ptrs.values()];
        pinch = { dist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, zoom: fit.zoom || 100 };
      }
    };
    const onMove = (ev) => {
      if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pinch && ptrs.size >= 2) {
        const p = [...ptrs.values()];
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        fit.zoom = Math.min(300, Math.max(100, Math.round(pinch.zoom * (dist / pinch.dist))));
        clampShift(fit);
        applyCoverFitTo(refs.cover, fit);
      } else if (dragBase) {
        const dx = ev.clientX - dragBase.x, dy = ev.clientY - dragBase.y;
        if (dragBase.z > 1.001) {
          const lim = (dragBase.z - 1) / 2;
          fit.shift.x = Math.min(lim, Math.max(-lim, dragBase.shift.x + dx / rect.width));
          fit.shift.y = Math.min(lim, Math.max(-lim, dragBase.shift.y + dy / rect.height));
        } else {
          let nx = dragBase.pos.x, ny = dragBase.pos.y;
          if (coverRatio) { if (coverRatio > boxRatio) { const ow = rect.height * coverRatio - rect.width; if (ow > 1) nx = dragBase.pos.x - (dx * 100) / ow; } else { const oh = rect.width / coverRatio - rect.height; if (oh > 1) ny = dragBase.pos.y - (dy * 100) / oh; } }
          else { nx = dragBase.pos.x - dx * 0.25; ny = dragBase.pos.y - dy * 0.25; }
          fit.pos.x = Math.min(100, Math.max(0, +nx.toFixed(1)));
          fit.pos.y = Math.min(100, Math.max(0, +ny.toFixed(1)));
        }
        applyCoverFitTo(refs.cover, fit);
      }
    };
    const onUp = (ev) => {
      ptrs.delete(ev.pointerId);
      if (ptrs.size === 1) { pinch = null; beginDrag(); }
      else if (ptrs.size === 0) {
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        posGesture = false;
        save();
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* ═══ 배경 사진 꾸미기 (스티커 데코) ═══ */
  let decoMode = false;

  // 기념일까지 남은 일수 (매년 돌아오는 날짜 기준 D-)
  function ddayCountTo(ds) {
    return dToAnniv(ds);
  }
  // 데코용 기념일 D-day 문구 (라이브로 계산)
  function decoDdayText(b, key) {
    if (!b) return "";
    if (key === "start") { const n = dPlus(b.startDate); return `덕질 D+${n != null ? n : 0}`; }
    if (key === "birthday" && b.birthday) { const n = birthdayDDay(b); return `생일 ${n === 0 ? "D-DAY" : "D-" + n}`; }
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
    const DX = '<span class="hero-deco-x" aria-label="떼기">✕</span>';
    layer.innerHTML = deco.map((d, i) => {
      if (d.t === "dday") {
        const txt = decoDdayText(b, d.key);
        if (!txt) return ""; // 원본 기념일이 사라졌으면 표시 안 함
        return `<span class="hero-deco-text dt-${d.c || "w"} dt-${d.sz || "m"}" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${esc(txt)}${DX}</span>`;
      }
      if (d.t === "text") {
        return `<span class="hero-deco-text dt-${d.c || "w"} dt-${d.sz || "m"}" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${esc(d.s)}${DX}</span>`;
      }
      if (d.icon) { // 앱 라인아이콘 스티커
        return `<span class="hero-sticker hero-icon-sticker" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${I(d.icon)}${DX}</span>`;
      }
      return `<span class="hero-sticker" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${d.s}${DX}</span>`;
    }).join("");
    layer.querySelectorAll(".hero-sticker, .hero-deco-text").forEach((el) => {
      el.onpointerdown = (e) => decoDrag(e, +el.dataset.i, el);
      const xb = el.querySelector(".hero-deco-x");
      if (xb) xb.onclick = (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        const di = +el.dataset.i;
        if (b && b.deco && b.deco[di] != null) { b.deco.splice(di, 1); save(); renderDeco(); toast("뗐어요"); }
      };
    });
  }

  function decoDrag(e, i, el) {
    if (!decoMode) return;
    if (e.target && e.target.closest && e.target.closest(".hero-deco-x")) return; // ✕ 배지는 제거 전용
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
      <div class="field"><input type="text" id="dtText" placeholder="" maxlength="40" value="${editing ? esc(cur.s) : ""}"></div>
      <div class="dt-chips" id="dtChips">${fills.map((f) => `<button data-fill="${esc(f)}">${esc(f)}</button>`).join("")}</div>
      <p class="dt-label">색상</p>
      ${decoColorRowHTML()}
      <p class="dt-label">크기</p>
      <div class="dt-opts" id="dtSizes">
        <button data-sz="s">작게</button><button data-sz="m">보통</button><button data-sz="l">크게</button><button data-sz="xl">아주 크게</button>
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
        <button data-sz="s">작게</button><button data-sz="m">보통</button><button data-sz="l">크게</button><button data-sz="xl">아주 크게</button>
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
  // 이 기기가 실제로 진동을 지원하는지 (iOS는 API 자체가 없고, 데스크톱은 진동 하드웨어가 없음)
  function hapticsSupported() {
    try {
      if (!("vibrate" in navigator) || typeof navigator.vibrate !== "function") return false;
      const coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      const touch = (navigator.maxTouchPoints || 0) > 0 || ("ontouchstart" in window);
      return coarse || touch; // 진동은 사실상 터치(모바일) 기기에서만 동작
    } catch (_) { return false; }
  }
  // 햅틱 진동 — 설정에서 꺼져 있거나 미지원 기기면 울리지 않음
  function buzz(ms) {
    if (S.haptics === false || !hapticsSupported()) return;
    try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {}
  }
  function toggleHaptics() {
    if (!hapticsSupported()) { toast("이 기기에서는 진동을 지원하지 않아요"); return; }
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
    const fvv = $("fpVeilVal"); // 미니홈피 모드 모달의 농도 표시도 같이 갱신
    if (fvv) fvv.textContent = S.veil + "%";
    save();
  }
  /* ───────── 알림 (브라우저 Notification) ───────── */
  function notifSupported() { return ("Notification" in window); }
  function notifGranted() { return notifSupported() && Notification.permission === "granted"; }
  function ensureNotifPerm() {
    if (!notifSupported()) return Promise.resolve(false);
    if (Notification.permission === "granted") return Promise.resolve(true);
    if (Notification.permission === "denied") return Promise.resolve(false);
    return Notification.requestPermission().then((p) => p === "granted");
  }
  function fireNotif(title, body, tag) {
    try { new Notification(title, { body: body || "", tag: tag }); }
    catch (e) { toast(title + (body ? " · " + body : "")); }
    buzz(20);
  }
  function toggleNotif(key, onMsg, offMsg) {
    if (S[key]) { S[key] = false; save(); renderNotifyRows(); toast(offMsg); return; }
    if (!notifSupported()) return toast("이 브라우저는 알림을 지원하지 않아요");
    ensureNotifPerm().then((ok) => {
      if (ok) { S[key] = true; save(); renderNotifyRows(); toast(onMsg + " (탭이 열려 있을 때)"); }
      else { renderNotifyRows(); toast("알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요"); }
    });
  }
  function toggleNotifyTicket() { toggleNotif("notifyTicket", "티켓팅 알림을 켰어요", "티켓팅 알림을 껐어요"); }

  function renderNotifyRows() {
    const host = $("notifyRows"); if (!host) return;
    const sup = notifSupported();
    const perm = sup ? Notification.permission : "unsupported";
    const blocked = !sup || perm === "denied";
    const dis = blocked ? "disabled" : "";
    const sw = (id, on) => `<button class="switch ${on && !blocked ? "on" : ""}" id="${id}" ${dis}><span class="knob"></span></button>`;
    const opt = (cur, list) => list.map(([v, l]) => `<option value="${v}" ${+cur === v ? "selected" : ""}>${l}</option>`).join("");
    const sel = (id, cur, list) => `<select class="tt-time nf-sel" id="${id}" ${dis}>${opt(cur, list)}</select>`;
    const sub = (show, label, selHtml) => `<div class="field row-field nf-sub ${show && !blocked ? "" : "nf-hidden"}"><label>${label}</label>${selHtml}</div>`;
    let head = "";
    if (!sup) head = `<p class="hint notif-warn">이 브라우저는 알림을 지원하지 않아요.</p>`;
    else if (perm === "denied") head = `<p class="hint notif-warn">브라우저에서 이 사이트 알림이 차단돼 있어요. 주소창 자물쇠 → 알림을 '허용'으로 바꿔주세요.</p>`;
    else if (perm === "default") head = `<button class="btn btn-sm nf-allow" id="notifAllow">🔔 알림 권한 허용하기</button>`;
    host.innerHTML = head
      + `<div class="field row-field"><label>티켓팅 알림</label>${sw("nfTicket", !!S.notifyTicket)}</div>`
      + sub(S.notifyTicket, "알림 시점", sel("nfTicketLead", S.notifyTicketLead || 10, [[5, "5분 전"], [10, "10분 전"], [30, "30분 전"], [60, "1시간 전"]]))
      + `<div class="field row-field"><label>일정 알림 <small>(콘서트·방송·발매 등)</small></label>${sw("nfEvents", !!S.notifyEvents)}</div>`
      + sub(S.notifyEvents, "알림 시점", sel("nfEventsLead", S.notifyEventsLead || 60, [[10, "10분 전"], [30, "30분 전"], [60, "1시간 전"], [1440, "하루 전"]]))
      + `<div class="field row-field"><label>생일·기념일 알림</label>${sw("nfBday", !!S.notifyBirthday)}</div>`
      + sub(S.notifyBirthday, "알림 시점", sel("nfBdayLead", S.notifyBdayDays != null ? S.notifyBdayDays : 0, [[0, "당일 아침"], [1, "하루 전"], [3, "3일 전"], [7, "7일 전"]]))
      + `<div class="field row-field"><label>아침 일정 요약</label>${sw("nfDaily", !!S.notifyDaily)}</div>`
      + sub(S.notifyDaily, "요약 시각", sel("nfDailyTime", S.notifyDailyHour != null ? S.notifyDailyHour : 9, [[7, "오전 7시"], [8, "오전 8시"], [9, "오전 9시"], [10, "오전 10시"]]))
      + `<p class="hint">알림은 탭(또는 설치한 앱)이 열려 있을 때만 떠요. 완전히 닫혀 있으면 오지 않아요.</p>`;
    if ($("notifAllow")) $("notifAllow").onclick = () => ensureNotifPerm().then(() => renderNotifyRows());
    if (!blocked) {
      const bt = (id, key, on, off) => { const el = $(id); if (el) el.onclick = () => toggleNotif(key, on, off); };
      bt("nfTicket", "notifyTicket", "티켓팅 알림을 켰어요", "티켓팅 알림을 껐어요");
      bt("nfEvents", "notifyEvents", "일정 알림을 켰어요", "일정 알림을 껐어요");
      bt("nfBday", "notifyBirthday", "생일·기념일 알림을 켰어요", "생일·기념일 알림을 껐어요");
      bt("nfDaily", "notifyDaily", "아침 요약을 켰어요", "아침 요약을 껐어요");
      const bs = (id, key) => { const el = $(id); if (el) el.onchange = () => { S[key] = +el.value; save(); }; };
      bs("nfTicketLead", "notifyTicketLead");
      bs("nfEventsLead", "notifyEventsLead");
      bs("nfBdayLead", "notifyBdayDays");
      bs("nfDailyTime", "notifyDailyHour");
    }
  }

  // 매 초 tickClock에서 호출 — 예정 알림 점검 (탭 열려 있을 때만)
  const notifFired = new Set();
  function runNotifChecks(now) {
    if (!notifGranted()) return;
    // 1) 시간 있는 일정(티켓팅·기타) — lead분 전
    (byBias(S.schedules) || []).forEach((s) => {
      if (!s.date) return;
      const isTicket = s.cat === "ticket";
      if (isTicket ? !S.notifyTicket : !S.notifyEvents) return;
      if (!isTicket && !s.time) return; // 시간 없는 일반 일정은 시점 알림 생략
      const leadMin = isTicket ? (S.notifyTicketLead || 10) : (S.notifyEventsLead || 60);
      const diff = new Date(s.date + "T" + (s.time || "00:00")) - now;
      const key = "s:" + s.id + ":" + leadMin;
      if (diff > 0 && diff <= leadMin * 60000 && !notifFired.has(key)) {
        notifFired.add(key);
        const m = Math.round(diff / 60000);
        const when = m >= 60 ? Math.round(m / 60) + "시간 후" : (m <= 0 ? "곧" : m + "분 후");
        fireNotif(isTicket ? "티켓팅 알림 🎫" : "일정 알림 🔔", `${s.title} — ${when}`, "msc-" + s.id);
      }
    });
    // 2) 생일·기념일 — 지정 시점, 오전 9시 정각에 발송
    if (S.notifyBirthday && now.getHours() === 9 && now.getMinutes() === 0) {
      const want = S.notifyBdayDays != null ? S.notifyBdayDays : 0;
      const tk = fmtDate(now);
      (S.biases || []).forEach((b) => {
        [["birthday", "생일", b.birthday], ["debut", "데뷔 기념일", b.debutDate]].forEach((row) => {
          const kind = row[0], label = row[1], val = row[2];
          if (!val) return;
          const dd = kind === "birthday" ? birthdayDDay(b) : dToAnniv(val);
          if (dd == null || dd !== want) return;
          const key = "b:" + b.id + ":" + kind + ":" + tk;
          if (notifFired.has(key)) return;
          notifFired.add(key);
          const nm = b.name || "최애";
          fireNotif(label + " 🎂", dd === 0 ? `오늘은 ${nm} ${label}!` : `${nm} ${label}까지 D-${dd}`, key);
        });
      });
    }
    // 3) 아침 일정 요약 — 지정 시각 정각
    if (S.notifyDaily) {
      const hr = S.notifyDailyHour != null ? S.notifyDailyHour : 9;
      if (now.getHours() === hr && now.getMinutes() === 0) {
        const tk = fmtDate(now), key = "d:" + tk;
        if (!notifFired.has(key)) {
          notifFired.add(key);
          const todays = (byBias(S.schedules) || []).filter((s) => s.date === tk);
          if (todays.length) {
            const names = todays.slice(0, 3).map((s) => s.title).join(", ");
            fireNotif("오늘의 일정 📅", `${todays.length}개 — ${names}${todays.length > 3 ? " 외" : ""}`, key);
          }
        }
      }
    }
  }

  // 보정된 현재 시각 (기기 시간 + 사용자가 맞춘 보정값)
  function nowCorrected() { return new Date(Date.now() + ((S && S.clockOffset) || 0)); }
  // 시계 표시용 시각 — 지정 타임존의 벽시계 시각 (기본 대한민국 KST)
  function clockDateTz(tz) {
    const base = nowCorrected();
    try { return new Date(base.toLocaleString("en-US", { timeZone: tz })); } catch (e) { return base; }
  }
  function clockDate() { return clockDateTz((S && S.clockTz) || "Asia/Seoul"); }
  function tzDiffText(tz) {
    const base = nowCorrected();
    try {
      const kr = new Date(base.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
      const ot = new Date(base.toLocaleString("en-US", { timeZone: tz }));
      let mins = Math.round((ot - kr) / 60000);
      if (mins === 0) return "한국과 같은 시간";
      const ahead = mins > 0; mins = Math.abs(mins);
      const h = Math.floor(mins / 60), m = mins % 60;
      const hm = h + "시간" + (m ? " " + m + "분" : "");
      return `한국보다 ${hm} ${ahead ? "빠름" : "느림"}`;
    } catch (e) { return ""; }
  }
  // 비교 도시의 날짜 + 한국 기준 어제/내일 표시
  function zoneDateLabel(tz) {
    const W = ["일","월","화","수","목","금","토"];
    const kr = clockDateTz("Asia/Seoul"), ot = clockDateTz(tz);
    const base = `${ot.getMonth() + 1}월 ${ot.getDate()}일 (${W[ot.getDay()]})`;
    const krd = new Date(kr.getFullYear(), kr.getMonth(), kr.getDate());
    const otd = new Date(ot.getFullYear(), ot.getMonth(), ot.getDate());
    const dd = Math.round((otd - krd) / 86400000);
    const rel = dd === 0 ? "" : dd === -1 ? " · 어제" : dd === 1 ? " · 내일" : dd < 0 ? ` · ${-dd}일 전` : ` · ${dd}일 후`;
    return base + rel;
  }

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
    if (lc) { const c = clockDate(); lc.textContent = `${pad(c.getHours())}:${pad(c.getMinutes())}:${pad(c.getSeconds())}`; }
    const t = nextTicket();
    const tn = $("ticketNext"), btn = $("ticketLinkBtn"), card = $("ticketCard");
    const mw = $("wTick");
    let diff = 0;
    if (t) { diff = t.dt - now; }
    runNotifChecks(now);
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
  const SB_TZS = [["Asia/Seoul","서울"],["Asia/Tokyo","도쿄"],["Asia/Taipei","타이베이"],["Asia/Hong_Kong","홍콩"],["Asia/Shanghai","상하이"],["Asia/Singapore","싱가포르"],["Asia/Manila","마닐라"],["Asia/Bangkok","방콕"],["Asia/Jakarta","자카르타"],["Australia/Sydney","시드니"],["Asia/Dubai","두바이"],["Europe/London","런던"],["Europe/Paris","파리"],["America/New_York","뉴욕"],["America/Los_Angeles","LA"],["America/Mexico_City","멕시코시티"],["America/Sao_Paulo","상파울루"]];
  const SB_TK_WINDOW = 3600000; // 오픈 1시간 전부터 티켓팅 모드
  let standbyOpen = false;
  let standbyFired = false;
  let wakeLock = null;

  function renderStandby(now, t, diff) {
    const cnow = clockDate();
    const dEl = $("sbZ1Date");
    if (dEl) dEl.textContent = `${cnow.getMonth() + 1}월 ${cnow.getDate()}일 (${SB_WEEK[cnow.getDay()]})`;
    const sb = $("standby"), clk = $("sbClock"), sub = $("sbSub"), tkLabel = $("sbTkLabel"), tkBtn = $("sbTkBtn");
    const timeStr = `${pad(cnow.getHours())}:${pad(cnow.getMinutes())}:${pad(cnow.getSeconds())}`;
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
      if (sub) sub.textContent = t ? `${esc(t.title)} D-${Math.ceil(diff / 86400000)}` : "";
    }

    const tz2 = (S && S.clockTz2) || "";
    const zone2 = $("sbZone2"), addb2 = $("sbAddTz");
    if (ticketing) {
      if (zone2) zone2.classList.add("hidden");
      if (addb2) addb2.classList.add("hidden");
    } else if (tz2) {
      if (zone2) zone2.classList.remove("hidden");
      if (addb2) addb2.classList.add("hidden");
      const tzb = $("sbTz2Btn"); if (tzb) { const f = SB_TZS.find(([v]) => v === tz2); tzb.textContent = f ? f[1] : ""; }
      const c2 = clockDateTz(tz2);
      const clk2 = $("sbClock2"); if (clk2) clk2.textContent = `${pad(c2.getHours())}:${pad(c2.getMinutes())}:${pad(c2.getSeconds())}`;
      const df = $("sbDiff"); if (df) df.textContent = tzDiffText(tz2);
      const z2d = $("sbZ2Date"); if (z2d) z2d.textContent = zoneDateLabel(tz2);
    } else {
      if (zone2) zone2.classList.add("hidden");
      if (addb2) addb2.classList.remove("hidden");
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
    const tzbtn = $("sbTz2Btn"), tzmenu = $("sbTz2Menu");
    if (tzbtn && tzmenu && !tzbtn.dataset.ready) {
      tzmenu.innerHTML = SB_TZS.filter(([v]) => v !== "Asia/Seoul").map(([v, n]) => `<button type="button" data-tz="${v}">${n}</button>`).join("");
      tzbtn.onclick = (e) => { e.stopPropagation(); tzmenu.classList.toggle("hidden"); };
      tzmenu.querySelectorAll("[data-tz]").forEach((b) => { b.onclick = () => { S.clockTz2 = b.dataset.tz; save(); tzmenu.classList.add("hidden"); tickClock(); }; });
      document.addEventListener("click", (e) => { if (!e.target.closest(".sb-tzwrap")) tzmenu.classList.add("hidden"); });
      tzbtn.dataset.ready = "1";
    }
    const addb = $("sbAddTz");
    if (addb && !addb.dataset.ready) { addb.onclick = () => { S.clockTz2 = "Asia/Tokyo"; save(); tickClock(); }; addb.dataset.ready = "1"; }
    const xb = $("sbTzX");
    if (xb && !xb.dataset.ready) { xb.onclick = () => { S.clockTz2 = ""; save(); tickClock(); }; xb.dataset.ready = "1"; }
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

  // 가로로 긴 줄을 마우스로 끌어 좌우 스크롤 (칩 클릭과 충돌 안 나게 드래그 후 클릭은 무시)
  function enableDragScroll(el) {
    if (!el || el.dataset.dragScroll) return;
    el.dataset.dragScroll = "1";
    let down = false, moved = false, startX = 0, startLeft = 0;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) moved = true;
      if (moved) { el.scrollLeft = startLeft - dx; }
    });
    window.addEventListener("pointerup", () => {
      if (down && moved) { el._suppressClick = true; setTimeout(() => { el._suppressClick = false; }, 60); }
      down = false; moved = false;
    });
    el.addEventListener("click", (e) => { if (el._suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  function renderCalendar() {
    const y = calCur.getFullYear(), m = calCur.getMonth();
    $("calTitle").textContent = `${y}.${pad(m + 1)}`;
    { const _c2 = $("calTitle2"); if (_c2) _c2.textContent = `${y}.${pad(m + 1)}`; }

    // 필터 칩
    const fr = $("catFilters");
    const _chip = ([k, c]) => `<button class="f-chip ${activeCats.has(k) ? "active" : ""}" data-cat="${k}" style="--cat:var(${c.v})"><span class="dot" style="background:var(${c.v})"></span>${c.name}</button>`;
    const _off = Object.entries(CATS).filter(([k, c]) => (c.mode || "offline") === "offline");
    const _on = Object.entries(CATS).filter(([k, c]) => (c.mode || "offline") === "online");
    // '전체' 토글 — 현재 보기(calMode)에 표시되는 카테고리를 한 번에 켜고 끔 (모든 덕질 유형 공통)
    const _visKeys = (calMode === "offline" ? _off : calMode === "online" ? _on : _off.concat(_on)).map(([k]) => k);
    const _allOn = _visKeys.length > 0 && _visKeys.every((k) => activeCats.has(k));
    const _allChip = `<button class="f-chip f-chip-all ${_allOn ? "active" : ""}" data-cat-all title="${_allOn ? "전체 끄기" : "전체 켜기"}" aria-pressed="${_allOn}">전체</button>`;
    let _chips;
    if (calMode === "offline") _chips = _off.map(_chip).join("");
    else if (calMode === "online") _chips = _on.map(_chip).join("");
    else _chips = _off.map(_chip).join("") + (_off.length && _on.length ? `<span class="f-divider" aria-hidden="true"></span>` : "") + _on.map(_chip).join("");
    fr.innerHTML = _allChip
      + (_visKeys.length ? `<span class="f-divider" aria-hidden="true"></span>` : "")
      + _chips
      + `<button class="f-chip chip-add" id="catMgrBtn" title="카테고리 추가·수정·삭제">+ 카테고리</button>`;
    const _allBtn = fr.querySelector("[data-cat-all]");
    if (_allBtn) _allBtn.onclick = () => {
      if (_allOn) _visKeys.forEach((k) => activeCats.delete(k));
      else _visKeys.forEach((k) => activeCats.add(k));
      renderCalendar();
    };
    fr.querySelectorAll(".f-chip[data-cat]").forEach((ch) => {
      ch.onclick = () => {
        const k = ch.dataset.cat;
        activeCats.has(k) ? activeCats.delete(k) : activeCats.add(k);
        renderCalendar();
      };
    });
    const catMgrBtn = fr.querySelector("#catMgrBtn");
    if (catMgrBtn) catMgrBtn.onclick = openCatManager;
    enableDragScroll(fr);

    // 멀티캘린더 구분: 전체 / 오프라인 / 온라인
    const cm = $("calModeSeg");
    if (cm) {
      cm.innerHTML = [["all", "전체", ""], ["offline", "오프라인", I("pin")], ["online", "온라인", I("monitor")]]
        .map(([k, n, ic]) => `<button class="${calMode === k ? "active" : ""}" data-cm="${k}">${ic} ${n}</button>`).join("");
      cm.querySelectorAll("[data-cm]").forEach((b) => { b.onclick = () => { calMode = b.dataset.cm; renderCalendar(); }; });
    }

    const first = new Date(y, m, 1);
    const ws = S.weekStart === "mon" ? 1 : 0;
    const startDow = (first.getDay() - ws + 7) % 7;
    const wsBtn = $("calWsBtn");
    if (wsBtn) wsBtn.textContent = ws === 1 ? "월" : "일";
    { const wsBtnM = $("calWsBtnM"); if (wsBtnM) wsBtnM.textContent = ws === 1 ? "월" : "일"; }
    // 요일 헤더도 주 시작 설정에 맞춰 재구성
    const headEl = document.querySelector(".cal-grid-head");
    if (headEl) {
      const dows = [["일", "sun"], ["월", ""], ["화", ""], ["수", ""], ["목", ""], ["금", ""], ["토", "sat"]];
      const ordered = ws === 1 ? dows.slice(1).concat(dows.slice(0, 1)) : dows;
      headEl.innerHTML = ordered.map(([n, c]) => `<span${c ? ` class="${c}"` : ""}>${n}</span>`).join("");
    }
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
      // 칸 안 내용: 점 대신 '제목 칩' — 일정은 카테고리 색 점, 기록은 보라색 펜 아이콘으로 구분
      const dayItems = [];
      (schedByDate[key] || []).forEach((s) => dayItems.push({ r: false, title: s.title, c: `var(${(CATS[s.cat] || CAT_FALLBACK).v})` }));
      (archByDate[key] || []).forEach((a) => dayItems.push({ r: true, title: a.title }));
      const MAXC = 3;
      const chips = dayItems.slice(0, MAXC).map((it) => it.r
        ? `<span class="cal-chip rec">${I("pencil")}<span class="ct">${esc(it.title || "기록")}</span></span>`
        : `<span class="cal-chip"><i class="ci" style="background:${it.c}"></i><span class="ct">${esc(it.title || "일정")}</span></span>`
      ).join("") + (dayItems.length > MAXC ? `<span class="cal-more">+${dayItems.length - MAXC}</span>` : "");
      let anniv = "";
      if (b) {
        if (b.birthday && birthdayOnYMD(b, y, m, dayNum)) anniv = `<span class="anniv">${I("cake")} 생일</span>`;
        else if (b.debutDate && sameMD(b.debutDate, m, dayNum)) anniv = `<span class="anniv">${I("flag")} 데뷔</span>`;
        else {
          const ca = (b.annivs || []).find((a) => sameMD(a.date, m, dayNum));
          if (ca) anniv = `<span class="anniv">${I("heart")} ${esc(ca.title.length > 5 ? ca.title.slice(0, 5) + "…" : ca.title)}</span>`;
        }
      }
      html += `<div class="${classes.join(" ")}" data-date="${key}">
        <span class="num">${dayNum}</span>${st}
        <div class="daychips">${chips}</div>${anniv}
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
      const c = CATS[s.cat] || CAT_FALLBACK;
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
          <div class="dl-cat rec-cat">${on ? I("monitor") : I("pin")} ${esc(S.recLabel || "기록")} · ${esc(a.etype || "기타")}${a.place ? " · " + esc(a.place) : ""}</div>
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
      text += `\n${s.time ? s.time + " " : ""}[${(CATS[s.cat] || CAT_FALLBACK).name}] ${s.title}`;
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
  // ── 포토카드 반짝이 효과 (기본/홀로그램/글리터/스파클/골드/오로라) ──
  const POCA_FX = [["", "기본"], ["holo", "홀로그램"], ["glitter", "글리터"], ["sparkle", "스파클"], ["gold", "골드 포일"], ["aurora", "오로라"], ["rainbow", "레인보우"], ["heart", "하트"], ["silver", "실버 포일"], ["pearl", "펄"], ["laser", "레이저"], ["constellation", "별자리"], ["neon", "네온"], ["prism", "프리즘"], ["petal", "벚꽃"], ["glitch", "글리치"]];
  const POCA_FX_KEYS = POCA_FX.map((f) => f[0]).filter(Boolean);
  function pocaFxHtml(effect) {
    return (effect && POCA_FX_KEYS.includes(effect)) ? `<span class="poca-fx fx-${effect}" aria-hidden="true"></span>` : "";
  }
  // 포인터(마우스·터치) 위치를 --mx/--my로 흘려 빛이 손가락을 따라오게
  function attachFxReact(el) {
    if (!el) return;
    const set = (e) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      el.style.setProperty("--mx", Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)).toFixed(3));
      el.style.setProperty("--my", Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)).toFixed(3));
      el.classList.add("fx-active");
    };
    const reset = () => { el.style.removeProperty("--mx"); el.style.removeProperty("--my"); el.classList.remove("fx-active"); };
    el.addEventListener("pointermove", set);
    el.addEventListener("pointerdown", set);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointercancel", reset);
  }
  // 기기 기울임(자이로)으로 빛 각도 변경 — 안드로이드는 바로, iOS는 권한 허용 후
  let _tiltAsked = false;
  function initPocaTilt() {
    if (window._pocaTiltOn) return;
    window._pocaTiltOn = true;
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null && e.beta == null) return;
      const gx = Math.max(-40, Math.min(40, e.gamma || 0)) / 40;
      const gy = Math.max(-1, Math.min(1, ((e.beta || 0) - 35) / 40));
      const st = document.documentElement.style;
      st.setProperty("--mx", (0.5 + gx * 0.5).toFixed(3));
      st.setProperty("--my", (0.5 + gy * 0.5).toFixed(3));
    });
  }
  function enablePocaTilt() {
    try {
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === "function") {
        if (_tiltAsked) return; _tiltAsked = true;
        D.requestPermission().then((s) => { if (s === "granted") initPocaTilt(); }).catch(() => {});
      } else if (D) { initPocaTilt(); }
    } catch (_) {}
  }
  // 캔버스에 이미지를 박스에 꽉 차게(cover) 그림
  function coverDrawImg(ctx, img, x, y, w, h) {
    const ir = img.width / img.height, br = w / h;
    let sw, sh, sx, sy;
    if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / br; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function roundRectClip(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.clip();
  }
  // 위시 포카를 한 장 이미지로 합성해 저장 (교환글·공유용)
  function exportWishPocas() {
    const wish = byBias(S.photocards).filter((p) => p.status === "wish");
    if (!wish.length) return toast("위시 포카가 없어요");
    const b = curBias();
    const cw = 240, ch = Math.round(cw * 8.5 / 5.5), pad = 18, lblH = 34;
    const cols = Math.min(4, wish.length), rows = Math.ceil(wish.length / cols), headH = 70;
    const W = cols * cw + (cols + 1) * pad;
    const H = headH + rows * (ch + lblH) + (rows + 1) * pad;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#141414"; ctx.font = "bold 24px sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(`${b ? b.name : "최애"} 위시 포카 (${wish.length})`, pad, headH / 2 + 4);
    const cellXY = (i) => { const r = Math.floor(i / cols), cl = i % cols; return { x: pad + cl * (cw + pad), y: headH + pad + r * (ch + lblH + pad) }; };
    let i = 0;
    const finish = () => {
      c.toBlob((blob) => {
        if (!blob) return toast("이미지를 만들지 못했어요");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `위시포카_${b ? b.name : "최애"}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        toast("위시 포카 이미지를 저장했어요");
      }, "image/png");
    };
    const next = () => {
      if (i >= wish.length) return finish();
      const p = wish[i]; const { x, y } = cellXY(i); i++;
      const label = () => { ctx.fillStyle = "#141414"; ctx.font = "14px sans-serif"; ctx.textAlign = "center"; ctx.fillText((p.name || "").slice(0, 16), x + cw / 2, y + ch + lblH / 2); ctx.textAlign = "left"; };
      const ph = () => { ctx.fillStyle = "#f2f2f2"; ctx.fillRect(x, y, cw, ch); ctx.fillStyle = "#aaaaaa"; ctx.font = "15px sans-serif"; ctx.textAlign = "center"; ctx.fillText((p.name || "포카").slice(0, 12), x + cw / 2, y + ch / 2); ctx.textAlign = "left"; };
      if (p.img) {
        const im = new Image();
        im.onload = () => { ctx.save(); roundRectClip(ctx, x, y, cw, ch, 12); coverDrawImg(ctx, im, x, y, cw, ch); ctx.restore(); label(); next(); };
        im.onerror = () => { ph(); label(); next(); };
        im.src = p.img;
      } else { ph(); label(); next(); }
    };
    next();
  }

  function binderTab(mode) {
    binderMode = mode;
    binderPage = 0;
    document.querySelectorAll("[data-btab]").forEach((t) => t.classList.toggle("active", t.dataset.btab === mode));
    renderBinder();
  }

  function renderBinder(skipReflow) {
    // 탭별 장수 표시 (보유/위시/교환)
    const allCards = byBias(S.photocards);
    const _bsEl = $("binderStats");
    if (_bsEl) {
      if (!allCards.length) { _bsEl.classList.add("hidden"); _bsEl.innerHTML = ""; }
      else {
        const own = allCards.filter((p) => p.status === "own");
        const wishN = allCards.filter((p) => p.status === "wish").length;
        const tradeN = allCards.filter((p) => p.status === "trade").length;
        const qty = own.reduce((a, p) => a + (+p.qty || 1), 0);
        const spend = allCards.reduce((a, p) => a + (+p.price || 0), 0);
        const byAlb = {}; allCards.forEach((p) => { const k = (p.album || "").trim() || "기타"; byAlb[k] = (byAlb[k] || 0) + 1; });
        const topAlb = Object.entries(byAlb).sort((a, c) => c[1] - a[1]).slice(0, 3);
        _bsEl.innerHTML =
          `<span class="bs-chip">보유 <b>${own.length}</b></span>`
          + `<span class="bs-chip">위시 <b>${wishN}</b></span>`
          + (tradeN ? `<span class="bs-chip">교환 <b>${tradeN}</b></span>` : "")
          + `<span class="bs-chip">총 <b>${qty}</b>장</span>`
          + (spend > 0 ? `<span class="bs-chip">시세합 <b>${won(spend)}</b></span>` : "")
          + (topAlb.length ? `<span class="bs-chip alt">${topAlb.map(([n, c]) => `${esc(n)} ${c}`).join(" · ")}</span>` : "");
        _bsEl.classList.remove("hidden");
      }
    }
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

    // 검색·정렬 툴바 연결(정적 요소라 한 번만 연결)
    const bSearch = $("binderSearch"), bSort = $("binderSort"), bWx = $("binderWishExport");
    if (bSearch) { if (document.activeElement !== bSearch && bSearch.value !== binderSearch) bSearch.value = binderSearch; bSearch.oninput = () => { binderSearch = bSearch.value; binderPage = 0; renderBinder(); }; }
    if (bSort) { bSort.value = binderSort; bSort.onchange = () => { binderSort = bSort.value; binderPage = 0; renderBinder(); }; }
    if (bWx) bWx.onclick = exportWishPocas;
    // 검색어 필터
    const bq = (binderSearch || "").trim().toLowerCase();
    if (bq) cards = cards.filter((p) => (p.name || "").toLowerCase().includes(bq) || (p.album || "").toLowerCase().includes(bq));
    // 정렬 (manual=배열 순서 그대로, 드래그 정렬 가능)
    if (binderSort === "name") cards = cards.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
    else if (binderSort === "recent") cards = cards.slice().reverse();
    const canDrag = binderSort === "manual" && !bq;

    // ── 페이지 단위 바인더: 열 수는 화면 폭을 채우고(모바일 3×3, PC 다열), 한 페이지가 한 화면에 들어오게 ──
    const grid = $("binderGrid");
    const gap = 10;
    let availW = grid.clientWidth;
    if (!availW || availW < 80) availW = Math.min(940, window.innerWidth - (window.innerWidth >= 980 ? 300 : 36));
    const vw = window.innerWidth;
    let cols, rows;
    if (vw < 640) { cols = 3; rows = 2; }        // 모바일: 3×2 = 6
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
    let html = pageCards.map((p) => {
      const face = !p.img ? esc(p.name)
        : (p.imgBack
            ? `<div class="poca-flip"><div class="poca-flip-inner"><div class="poca-face pf-front"><img src="${p.img}" alt="${p.name ? "" : "포토카드"}" draggable="false">${pocaFxHtml(p.effect)}</div><div class="poca-face pf-back"><img src="${p.imgBack}" alt="뒷면" draggable="false">${p.effectBack ? pocaFxHtml(p.effect) : ""}</div></div></div>`
            : `<img src="${p.img}" alt="${p.name ? "" : "포토카드"}" draggable="false">${pocaFxHtml(p.effect)}`);
      return `
      <div class="poca-slot ${p.img ? "" : "noimg"}${p.imgBack ? " has-back" : ""}" data-pid="${p.id}">
        ${face}
        ${p.img && p.name ? `<span class="pc-label">${esc(p.name)}</span>` : ""}
        ${(+p.qty > 1) ? `<span class="pc-qty">×${+p.qty}</span>` : ""}
        ${p.imgBack ? `<span class="pc-twoside">양면</span>` : ""}
        ${p.imgBack ? `<button type="button" class="pc-flipbtn" aria-label="앞뒤 뒤집기" title="앞뒤 뒤집기">${I("refresh") || "↺"}</button>` : ""}
      </div>`;
    }).join("");
    const emptyCount = PER_PAGE - pageCards.length; // 남은 칸을 빈 포켓으로 채움 (모두 동일하게)
    for (let i = 0; i < emptyCount; i++) {
      html += `<div class="poca-slot empty" data-add="1"><span class="plus">+</span></div>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll("[data-add]").forEach((el) => { el.onclick = () => openModal("poca"); });
    bindPocaCards(grid, canDrag);
    const bHint = $("binderHint");
    if (bHint) {
      if (cards.length === 0) { bHint.textContent = bq ? "검색 결과가 없어요" : "빈 칸을 눌러 첫 포카를 등록해 보세요"; bHint.classList.remove("hidden"); }
      else if (canDrag && cards.length >= 2) { bHint.textContent = "포카를 꾹 눌러 끌면 순서를 바꿀 수 있어요"; bHint.classList.remove("hidden"); }
      else if (!canDrag && cards.length >= 1) { bHint.textContent = "‘직접 정렬’일 때만 순서를 바꿀 수 있어요"; bHint.classList.remove("hidden"); }
      else bHint.classList.add("hidden");
    }
    // 첫 진입 등에서 그리드 너비가 늦게 잡혀 보유/위시 탭 칸 수가 달라 보이는 문제 보정:
    // 다음 프레임에 실제 너비를 재확인해 달라졌으면 한 번만 다시 그려 항상 같은 배치로 통일
    // skipReflow: 아래 보정으로 인한 재렌더에서는 다시 보정하지 않음 (프레임마다 무한 재렌더 방지)
    const pageBinder = $("page-binder");
    if (!skipReflow && pageBinder && pageBinder.classList.contains("active")) {
      requestAnimationFrame(() => {
        if (!pageBinder.classList.contains("active")) return;
        const w2 = grid.clientWidth;
        if (w2 && Math.abs(w2 - availW) > 24) renderBinder(true); // 보정은 단 한 번만
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
  function bindPocaCards(grid, canDrag) {
    grid.querySelectorAll(".poca-slot[data-pid]").forEach((el) => {
      let st = null, lp = null;
      const clearLp = () => { if (lp) { clearTimeout(lp); lp = null; } };
      el.addEventListener("pointerdown", (e) => {
        if (e.button && e.button !== 0) return;
        st = { x: e.clientX, y: e.clientY, moved: false, flipped: false };
        if (canDrag) lp = setTimeout(() => { lp = null; st = null; startPocaDrag(e, el, grid); }, 380);
      });
      el.addEventListener("pointermove", (e) => {
        if (!st) return;
        const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (Math.hypot(dx, dy) <= 10) return;
        clearLp();
        const inner = el.querySelector(".poca-flip-inner");
        // 가로로 충분히 밀면 앞/뒤 뒤집기 (양면 카드만, 한 제스처에 한 번)
        if (inner && !st.flipped && Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 24) {
          inner.classList.toggle("flipped");
          st.flipped = true; st.moved = true;
          if (S.haptics !== false) { try { navigator.vibrate && navigator.vibrate(8); } catch (_) {} }
        } else {
          st.moved = true;          // 세로 이동 등은 스크롤로 보고 탭만 취소
          if (!inner) st = null;     // 단면 카드는 예전처럼 즉시 종료
        }
      });
      el.addEventListener("pointerup", () => {
        clearLp();
        if (st && !st.moved) openPocaView(el.dataset.pid);
        st = null;
      });
      el.addEventListener("pointercancel", () => { clearLp(); st = null; });
      // 양면 카드: 뒤집기 버튼으로 제자리에서 앞/뒤 전환 (상세 열기·드래그와 분리)
      const flipBtn = el.querySelector(".pc-flipbtn");
      if (flipBtn) {
        flipBtn.addEventListener("pointerdown", (e) => { e.stopPropagation(); st = null; clearLp(); });
        flipBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const inner = el.querySelector(".poca-flip-inner");
          if (inner) inner.classList.toggle("flipped");
          if (S.haptics !== false) { try { navigator.vibrate && navigator.vibrate(8); } catch (_) {} }
        });
      }
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
    const prName = { 1: "높음 ★", 2: "보통", 3: "낮음" };
    const sub = [
      p.album ? esc(p.album) : "",
      stName[p.status] || "",
      (+p.qty > 1) ? `${+p.qty}장` : "",
      p.price ? won(p.price) : "",
      (p.status === "wish" && p.priority) ? `우선순위 ${prName[p.priority] || "보통"}` : "",
      (p.status === "trade" && p.tradeWith) ? `교환: ${esc(p.tradeWith)}` : "",
      p.memo ? esc(p.memo) : "",
    ].filter(Boolean).join(" · ");
    openModalRaw(p.name || "포토카드", `
      ${p.img ? (p.imgBack ? `
        <div class="pc-flip" id="pcFlipWrap">
          <div class="pc-flip-inner" id="pcFlipInner" role="button" tabindex="0" aria-label="포토카드 앞/뒤 뒤집기">
            <div class="pc-face pc-front"><img src="${p.img}" alt="${esc(p.name) || "포토카드"} 앞면" draggable="false">${pocaFxHtml(p.effect)}</div>
            <div class="pc-face pc-back"><img src="${p.imgBack}" alt="${esc(p.name) || "포토카드"} 뒷면" draggable="false">${p.effectBack ? pocaFxHtml(p.effect) : ""}</div>
          </div>
        </div>` : `<div class="pc-single" id="pcSingle"><img id="pcViewImg" src="${p.img}" alt="${esc(p.name) || "포토카드"} 사진">${pocaFxHtml(p.effect)}</div>`) : ""}
      ${p.imgBack ? `<div style="text-align:center;margin-bottom:10px"><button class="btn btn-ghost btn-sm" id="pcFlip">${I("refresh") || "↺"} 앞/뒤 뒤집기</button></div>` : ""}
      <p style="font-size:12px;color:var(--muted);margin-bottom:14px">${sub}</p>
      <div class="btn-row">
        <button class="btn btn-primary btn-sm" id="pcMove">${p.status === "own" ? "위시로 이동" : "보유로 이동 (겟 완료!)"}</button>
        <button class="btn btn-ghost btn-sm" id="pcTrade">${p.status === "trade" ? "교환 완료 (보유로)" : "교환 중으로"}</button>
        <button class="btn btn-ghost btn-sm" id="pcEdit">${I("pencil")} 수정</button>
        ${p.img && navigator.share ? `<button class="btn btn-ghost btn-sm" id="pcShare">${I("share")} 공유</button>` : ""}
        <button class="btn btn-danger btn-sm" id="pcDel">삭제</button>
      </div>
    `);
    const pcFlipInner = $("pcFlipInner");
    const doPcFlip = () => {
      if (!pcFlipInner) return;
      pcFlipInner.classList.toggle("flipped");
      if (S.haptics !== false) { try { navigator.vibrate && navigator.vibrate(8); } catch (_) {} }
    };
    const pcFlip = $("pcFlip");
    if (pcFlip) pcFlip.onclick = doPcFlip;
    if (pcFlipInner) {
      pcFlipInner.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doPcFlip(); } });
      // 탭 + 좌우 스와이프(손가락으로 옆으로 밀기) 둘 다로 뒤집기
      let _sx = 0, _sy = 0, _tracking = false, _swiped = false;
      pcFlipInner.addEventListener("pointerdown", (e) => { _tracking = true; _swiped = false; _sx = e.clientX; _sy = e.clientY; });
      pcFlipInner.addEventListener("pointermove", (e) => {
        if (!_tracking) return;
        const dx = e.clientX - _sx, dy = e.clientY - _sy;
        if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.3) { // 가로 이동이 충분하고 세로보다 우세할 때만
          _tracking = false; _swiped = true; doPcFlip();
        }
      });
      const _endTrack = () => { _tracking = false; };
      pcFlipInner.addEventListener("pointerup", _endTrack);
      pcFlipInner.addEventListener("pointercancel", _endTrack);
      pcFlipInner.addEventListener("click", (e) => {
        if (_swiped) { _swiped = false; e.preventDefault(); e.stopPropagation(); return; } // 방금 스와이프로 뒤집었으면 클릭은 무시
        doPcFlip();
      });
    }
    // 반짝이 효과: 빛이 마우스/손가락을 따라오고, 기기를 기울이면 각도가 바뀜
    if (p.effect && POCA_FX_KEYS.includes(p.effect)) {
      attachFxReact(pcFlipInner || $("pcSingle"));
      enablePocaTilt();
    }
    $("pcTrade").onclick = () => {
      p.status = p.status === "trade" ? "own" : "trade";
      save(); closeModal(); binderTab(p.status); renderHome();
      toast(p.status === "trade" ? "교환 중으로 옮겼어요" : "교환 완료! 보유 포카로");
    };
    $("pcEdit").onclick = () => openModal("poca", id);
    const pcShare = $("pcShare");
    if (pcShare) pcShare.onclick = async () => {
      try {
        const res = await fetch(p.img); const blob = await res.blob();
        const file = new File([blob], (p.name || "photocard") + ".png", { type: blob.type || "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: p.name || "포토카드" });
        else await navigator.share({ title: p.name || "포토카드", text: p.name || "포토카드" });
      } catch (e) {}
    };
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
  function ledgerToday() {
    const now = new Date();
    ledgerCur = new Date(now.getFullYear(), now.getMonth(), 1);
    renderLedger();
  }

  function renderLedger() {
    const y = ledgerCur.getFullYear(), m = ledgerCur.getMonth();
    const ym = `${y}-${pad(m + 1)}`;
    $("ledgerTitle").textContent = `${y}.${pad(m + 1)}`;
    { const _l2 = $("ledgerTitle2"); if (_l2) _l2.textContent = `${y}.${pad(m + 1)}`; }
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
      const yFx = yearExps.filter((e) => e.cur && e.cur !== "KRW");
      const yFxTotal = yFx.reduce((a, e) => a + (+e.amount || 0), 0);
      ys.innerHTML = `
        <div class="ys-row"><span>${yearStr}년 총 지출</span><b>${won(yTotal)}</b></div>
        <div class="ys-row"><span>월평균 <small>(지출 있는 달 기준)</small></span><b>${won(Math.round(yTotal / activeMonths))}</b></div>
        <div class="ys-row"><span>최다 카테고리</span><b>${topCat ? esc(topCat[0]) + " (" + won(topCat[1]) + ")" : "—"}</b></div>`
        + (yFxTotal > 0 ? `<div class="ys-row"><span>이 중 해외 결제 <small>(${yFx.length}건)</small></span><b>${won(yFxTotal)}</b></div>` : "");
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
              <div class="ex-sub">${e.date} · ${esc(e.category)}${e.pay ? " · " + esc(e.pay) : ""}${e.cur && e.cur !== "KRW" ? ` · ${Number(e.fxAmount || 0).toLocaleString("ko-KR")}${curUnit(e.cur)} @${Number(e.fx || 0).toLocaleString("ko-KR")}원` : ""}${e.memo ? " · " + esc(e.memo) : ""}</div>
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
      <div class="field"><label>새 유형 이름 *</label><input type="text" id="mNewType" maxlength="14" placeholder=""></div>
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
    // 검색·정렬 툴바 연결
    const sSearch = $("styleSearch"), sSort = $("styleSort");
    if (sSearch) { if (document.activeElement !== sSearch && sSearch.value !== styleSearch) sSearch.value = styleSearch; sSearch.oninput = () => { styleSearch = sSearch.value; renderStyle(); }; }
    if (sSort) { sSort.value = styleSort; sSort.onchange = () => { styleSort = sSort.value; renderStyle(); }; }
    const sq = (styleSearch || "").trim().toLowerCase();
    if (sq) items = items.filter((s) => [s.name, s.category, s.info, s.look, s.size, s.wornInfo].some((t) => (t || "").toLowerCase().includes(sq)));
    if (styleSort === "name") items = items.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
    else if (styleSort === "cat") items = items.slice().sort((a, b) => (a.category || "").localeCompare(b.category || "", "ko") || (a.name || "").localeCompare(b.name || "", "ko"));
    else if (styleSort === "recent") items = items.slice().reverse();
    const stats = $("styleStats");
    if (stats) {
      const got = all.filter((s) => s.status === "bought").length;
      stats.textContent = all.length ? `전체 ${all.length} · 위시 ${all.length - got} · 겟 ${got}` : "";
    }
    const stCover = (s) => (Array.isArray(s.imgs) && s.imgs[0]) || s.img || "";
    $("styleList").innerHTML = items.length
      ? items.map((s) => { const cover = stCover(s); return `
        <div class="st-card" data-sedit="${s.id}">
          <div class="st-img" ${cover ? `style="background-image:url(${cover})"` : ""}>${cover ? "" : I("tag")}${(Array.isArray(s.imgs) && s.imgs.length > 1) ? `<span class="st-imgcount">${s.imgs.length}</span>` : ""}</div>
          <button class="st-status ${s.status}" data-id="${s.id}">${s.status === "bought" ? `${I("check")} 겟!` : `${I("heart")} 위시`}</button>
          <div class="st-body">
            <div class="st-name">${esc(s.name)}${(s.status === "wish" && s.priority == 1) ? ` <span class="st-prio">★</span>` : ""}</div>
            <div class="st-info">${esc(s.category || "")}${s.info ? " · " + esc(s.info) : ""}${s.size ? " · " + esc(s.size) : ""}${s.price ? " · " + won(s.price) : ""}</div>
            ${(s.wornDate || s.wornInfo) ? `<div class="st-worn">${I("pin")} ${esc([s.wornDate, s.wornInfo].filter(Boolean).join(" "))}</div>` : ""}
            ${s.look ? `<div class="st-look">#${esc(s.look)}</div>` : ""}
            ${s.link ? `<a class="st-link" href="${esc(safeUrl(s.link))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${I("link")} 구매처</a>` : ""}
          </div>
        </div>`; }).join("")
      : `<div class="style-empty">${sq ? "검색 결과가 없어요" : "최애가 입은 옷, 신발, 액세서리를 기록해 보세요 ✦<br>직접 구매하면 '겟!'으로 바꿀 수 있어요"}</div>`;
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
  // 저장 사용량 표시 (사진 포함 IndexedDB+localStorage 추정치) + 저장 보호 상태
  // 사용자에게 보여주는 버전(직접 올림). 업데이트 감지는 version.json이 따로 담당해요.
  const APP_VERSION = "1.0";
  const APP_STAGE = "오픈 베타"; // 배포 단계 라벨. 정식 출시 땐 "" 로 비우면 버전만 보여요.
  function fmtBytes(n) {
    if (n == null) return "?";
    if (n >= 1073741824) return (n / 1073741824).toFixed(1) + "GB";
    if (n >= 1048576) return (n / 1048576).toFixed(1) + "MB";
    if (n >= 1024) return Math.round(n / 1024) + "KB";
    return n + "B";
  }
  function renderStorage() {
    const box = $("storageBox");
    if (!box) return;
    if (!navigator.storage || !navigator.storage.estimate) {
      box.innerHTML = `<p class="hint" style="margin:0">이 브라우저에선 사용량을 표시할 수 없어요.</p>`;
      return;
    }
    navigator.storage.estimate().then(async (est) => {
      const used = est.usage || 0, quota = est.quota || 0;
      const pct = quota ? Math.min(100, (used / quota) * 100) : 0;
      let persisted = false;
      try { if (navigator.storage.persisted) persisted = await navigator.storage.persisted(); } catch (e) {}
      const high = used > 52428800; // 50MB 넘으면 백업 권유 강조
      box.innerHTML =
        `<div class="storage-head"><span>저장 사용량 <small>(사진 포함)</small></span>`
        + `<strong>${fmtBytes(used)}${quota ? ` <span class="muted">/ 최대 ${fmtBytes(quota)}까지(추정)</span>` : ""}</strong></div>`
        + `<div class="storage-bar"><i style="width:${Math.max(2, pct).toFixed(1)}%"></i></div>`
        + `${quota ? `<p class="storage-note">최대치는 브라우저가 기기 전체 용량을 기준으로 잡은 추정값이라, 실제 빈 공간보다 클 수 있어요.</p>` : ""}`
        + `<div class="storage-foot"><span${persisted ? ' class="ok"' : ""}>${persisted ? "✓ 저장 보호 켜짐" : "저장 보호 꺼짐 — 공간 부족 시 브라우저가 지울 수 있어요"}</span>`
        + `${persisted ? "" : `<button class="btn btn-ghost btn-sm" id="persistBtn">보호 켜기</button>`}</div>`
        + `${high ? `<p class="storage-warn">사진이 꽤 쌓였어요. 가끔 '내보내기'로 백업해 두면 안전해요.</p>` : ""}`;
      const pb = $("persistBtn");
      if (pb) pb.onclick = () => {
        if (!navigator.storage.persist) return;
        navigator.storage.persist().then((ok) => {
          toast(ok ? "저장 보호를 켰어요" : "브라우저가 보호를 허용하지 않았어요");
          renderStorage();
        });
      };
    }).catch(() => { box.innerHTML = `<p class="hint" style="margin:0">사용량을 불러오지 못했어요.</p>`; });
  }

  function renderSettings() {
    renderStorage(); // 저장 사용량·보호 상태
    const verEl = $("appVer"); if (verEl) verEl.textContent = "v" + APP_VERSION + (APP_STAGE ? " " + APP_STAGE : ""); // 정보 섹션 버전(사용자용)
    // 덕질 유형 프리셋
    renderPresetButtons($("presetTabs"), S.preset || "idol", setPreset);
    // 최애 목록
    $("biasList").innerHTML = S.biases.map((b) => `
      <li class="${b.id === S.currentBias ? "current" : ""}">
        <div class="bl-avatar" data-bid="${b.id}"></div>
        <div class="bl-main">
          <div class="bl-name">${esc(b.name)}</div>
          <div class="bl-sub">${esc(b.group || "")} ${b.startDate ? "· D+" + dPlus(b.startDate) : ""}</div>
        </div>
        ${b.id === S.currentBias
          ? `<span class="badge-accent">현재</span>`
          : `<button class="chip-btn" data-switch="${b.id}">전환</button>`}
        <button class="chip-btn" data-edit="${b.id}">수정</button>
      </li>`).join("");
    $("biasList").querySelectorAll(".bl-avatar").forEach((el) => { applyAvatarPhoto(el, S.biases.find((x) => x.id === el.dataset.bid)); });
    $("biasList").querySelectorAll("[data-switch]").forEach((b) => {
      b.onclick = () => { S.currentBias = b.dataset.switch; save(); renderAll(); toast("최애를 전환했어요!"); };
    });
    $("biasList").querySelectorAll("[data-edit]").forEach((b) => {
      b.onclick = () => openModal("bias", b.dataset.edit);
    });
    renderSwatches();
    const scc = $("setColorChip"), sch = $("setColorHex");
    if (scc) { scc.style.background = S.accent; sch.textContent = S.accent.toUpperCase(); }
    renderTplThumbs($("setTplThumbs"), S.template || "classic", setTemplate);
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
    renderNotifyRows();
    const hsw = $("hapticSwitch");
    if (hsw) {
      const hOk = hapticsSupported();
      hsw.classList.toggle("on", hOk && S.haptics !== false);
      hsw.disabled = !hOk;
      const row = hsw.closest(".row-field"), sm = row && row.querySelector("small");
      if (sm) sm.textContent = hOk ? "(위젯 길게 누르기 등)" : "(이 기기에선 지원 안 돼요)";
    }
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
    const ft = $("fontTabs");
    if (ft) {
      ft.innerHTML = FONTS.map(([id, name]) =>
        `<button class="tab ${(S.font || "") === id ? "active" : ""}" data-font-btn="${id}">${name}</button>`).join("");
      ft.querySelectorAll("[data-font-btn]").forEach((b) => {
        const def = FONTS.find(([id]) => id === b.dataset.fontBtn); // 버튼을 그 글꼴로 미리보기
        if (def && def[2]) b.style.fontFamily = def[2] + ", var(--font-sans)";
        b.onclick = () => setFont(b.dataset.fontBtn);
      });
    }
    const wsc = $("weekStartCalTabs");
    if (wsc) wsc.querySelectorAll("[data-wsc]").forEach((b) => b.classList.toggle("active", b.dataset.wsc === (S.weekStart || "sun")));
    const wsw = $("weekStartWeekTabs");
    if (wsw) wsw.querySelectorAll("[data-wsw]").forEach((b) => b.classList.toggle("active", b.dataset.wsw === (S.weekStartWeek || "mon")));
    const wsq = $("weekStartCircleTabs");
    if (wsq) wsq.querySelectorAll("[data-wsq]").forEach((b) => b.classList.toggle("active", b.dataset.wsq === (S.weekStartCircle || "sun")));
    const ttfl = $("ttFixedLinkSwitch");
    if (ttfl) ttfl.classList.toggle("on", S.ttFixedLink !== false);
    const ttlk = $("ttLinkSwitch");
    if (ttlk) ttlk.classList.toggle("on", !!S.ttLink);
    ["fixed", "week", "circle"].forEach((v) => {
      const el = $("ttWeekendSwitch_" + v);
      if (el) el.classList.toggle("on", ttHideWeekendFor(v));
    });
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
    // .swatch-grid 가 있는 모든 곳(설정·미니홈피 모드)에 팔레트를 그림
    document.querySelectorAll(".swatch-grid").forEach((grid) => {
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
        normalizeState();   // 구버전 마이그레이션·카테고리(buildCats)·필터 재구성
        // 다른 기기의 IndexedDB를 가리키던 옛 사진 참조키 제거 → 백업에 담긴 사진(base64)을
        // 이 기기 IndexedDB에 새로 저장하도록 함 (참조키만 남아 사진이 사라지는 문제 방지)
        (S.photocards || []).forEach((p) => { if (p.img) delete p.imgKey; });
        (S.archives || []).forEach((d) => { if (Array.isArray(d.imgs) && d.imgs.length) delete d.imgKeys; });
        (S.biases || []).forEach((b) => { if (b.photo) delete b.photoKey; if (b.cover) delete b.coverKey; });
        (S.styles || []).forEach((s) => { if (s.img) delete s.imgKey; });
        if (S.membership && S.membership.photo) delete S.membership.photoKey;
        imgStored.clear();  // 이 기기에 다시 써야 하므로 '이미 저장됨' 표시 초기화
        save(); applyTheme(); renderAll();
        toast("데이터를 불러왔어요!");
      } catch (e) { toast("백업 파일을 읽을 수 없어요"); }
    };
    r.readAsText(file);
  }

  function resetAll() {
    if (!confirm("정말 모든 데이터를 삭제할까요?\n(되돌릴 수 없어요. 백업을 먼저 권장해요!)")) return;
    localStorage.removeItem(LS_KEY);
    // IndexedDB 삭제는 비동기 — 음원·사진 blob까지 깔끔히 지워진 뒤 새로고침 (남는 데이터 방지)
    const delDb = (name) => new Promise((res) => {
      try {
        const rq = indexedDB.deleteDatabase(name);
        rq.onsuccess = rq.onerror = rq.onblocked = () => res();
      } catch (e) { res(); }
    });
    let done = false;
    const reload = () => { if (!done) { done = true; location.reload(); } };
    Promise.all([delDb(AUDIO_DB), delDb(IMG_DB)]).then(reload);
    setTimeout(reload, 1500); // 안전장치: 삭제가 막혀도 최대 1.5초 뒤엔 새로고침
  }

  /* ═══════════ 모달 ═══════════ */
  let modalPhotoData = null, modalPhotoOrig = null, modalPhotoState = null;

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
  let _modalOpenedAt = 0; // 모달이 열린 시각 — 직후 유령 클릭으로 닫히는 깜빡임 방지
  let modalCancelHook = null; // 설정 시 닫기(X·배경·ESC)가 닫지 않고 이 콜백을 실행(이전 화면으로 복귀)
  function openModalRaw(title, bodyHtml) {
    modalCancelHook = null; // 새 모달 열릴 때마다 초기화
    modalLastFocus = document.activeElement; // 닫을 때 포커스 복원용
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    linkFieldLabels($("modalBody"));
    refreshLunarPreviews(); // 음력 생일 미리보기 초기 표시(수정 모달에서 기존 음력 생일)
    $("modalBackdrop").classList.remove("hidden");
    _modalOpenedAt = Date.now();
    var _sbw = window.innerWidth - document.documentElement.clientWidth; // 스크롤바 폭
    document.body.style.overflow = "hidden";
    if (_sbw > 0) document.body.style.paddingRight = _sbw + "px"; // 스크롤바 사라짐 보정(화면 밀림 방지)
    // 접근성: 모달 열리면 다이얼로그로 포커스 이동(모바일 키보드 갑툭튀 방지 위해 입력란 대신 컨테이너에)
    const box = $("modalBox");
    box.tabIndex = -1;
    box.focus();
  }

  function closeModal() {
    if (modalCancelHook) { const h = modalCancelHook; modalCancelHook = null; h(); return; } // 이전 화면으로 복귀
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
    if (e.target !== $("modalBackdrop")) return;
    if (Date.now() - _modalOpenedAt < 350) return; // 열자마자 떨어지는 유령 클릭 무시(포카 등 pointerup로 연 모달 깜빡임 방지)
    closeModal();
  }

  function photoPickHtml(label) {
    return `
      <label class="photo-pick" id="mpBox">
        <input type="file" accept="image/*" id="mpInput" hidden>
        <span id="mpHint">${label || "+ 사진 추가 (선택)"}</span>
        <img id="mpPreview" class="hidden" alt="선택한 사진 미리보기">
      </label>`;
  }
  function bindPhotoPick(maxW, useCrop) {
    modalPhotoData = null; modalPhotoOrig = null; modalPhotoState = null;
    const box = $("mpBox");
    if (!box) return;
    const set = (data) => { modalPhotoData = data; $("mpPreview").src = data; $("mpPreview").classList.remove("hidden"); $("mpHint").classList.add("hidden"); };
    // 라벨(mpBox)이 파일 입력을 자동으로 열기 때문에 onclick으로 또 열지 않음
    $("mpInput").onchange = (e) => {
      const f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      if (useCrop) openPhotoCropper(f, (data, orig, state) => { if (data) { set(data); modalPhotoOrig = orig || data; modalPhotoState = state || null; } });
      else fileToData(f, maxW || 700, set);
    };
  }
  // 뒷면(또는 보조) 사진용 별도 단일 피커
  let modalPhotoBack = null, modalPhotoBackOrig = null, modalPhotoBackState = null;
  function photoPickBackHtml(label) {
    return `
      <label class="photo-pick" id="mp2Box">
        <input type="file" accept="image/*" id="mp2Input" hidden>
        <span id="mp2Hint">${label || "+ 뒷면 사진 (선택)"}</span>
        <img id="mp2Preview" class="hidden" alt="선택한 사진 미리보기">
      </label>`;
  }
  function bindPhotoPickBack(useCrop) {
    modalPhotoBack = null; modalPhotoBackOrig = null; modalPhotoBackState = null;
    const box = $("mp2Box");
    if (!box) return;
    const set = (data) => { modalPhotoBack = data; $("mp2Preview").src = data; $("mp2Preview").classList.remove("hidden"); $("mp2Hint").classList.add("hidden"); };
    $("mp2Input").onchange = (e) => {
      const f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      if (useCrop) openPhotoCropper(f, (data, orig, state) => { if (data) { set(data); modalPhotoBackOrig = orig || data; modalPhotoBackState = state || null; } });
      else fileToData(f, 500, set);
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
      <span class="pp-thumb"><img src="${d}" alt="첨부 사진 ${i + 1}"><button class="pp-x" data-ppx="${i}" aria-label="사진 삭제">${I("x")}</button></span>`).join("")
      + (modalPhotosData.length < 5 ? `<label class="pp-add"><input type="file" accept="image/*" multiple hidden id="mpsInput">+<small>사진 (${modalPhotosData.length}/5)</small></label>` : "");
    g.querySelectorAll("[data-ppx]").forEach((b) => {
      b.onclick = (e) => { e.preventDefault(); modalPhotosData.splice(+b.dataset.ppx, 1); renderPhotosGrid(); };
    });
    const inp = $("mpsInput");
    if (inp) inp.onchange = (e) => {
      const files = [...e.target.files].slice(0, 5 - modalPhotosData.length);
      e.target.value = "";
      let i = 0;
      const next = () => {
        if (i >= files.length || modalPhotosData.length >= 5) { renderPhotosGrid(); return; }
        const f = files[i++];
        openPhotoCropper(f, (data) => { if (data) modalPhotosData.push(data); renderPhotosGrid(); next(); });
      };
      next();
    };
  }
  function bindPhotosPick(existing) {
    modalPhotosData = (existing || []).slice();
    renderPhotosGrid();
  }

  // ── 아카이브 사진 크롭 편집기: 비율(원본/1:1/3:4/9:16) 선택 + 드래그/확대로 보일 영역 지정 후 잘라 저장 ──
  // 갤러리 원본은 절대 수정하지 않고, 잘린 복사본만 만들어 돌려줌 (onDone(dataUrl) / 취소 시 onDone(null))
  const ARCH_RATIOS = [["orig", "원본", 0], ["1:1", "1:1", 1], ["3:4", "3:4", 3 / 4], ["9:16", "9:16", 9 / 16]];
  function openPhotoCropper(file, onDone) {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => buildCropper(img, onDone);
      img.onerror = () => { toast("사진을 불러오지 못했어요"); onDone(null); };
      img.src = r.result;
    };
    r.onerror = () => { toast("사진을 불러오지 못했어요"); onDone(null); };
    r.readAsDataURL(file);
  }
  // 이미 지정한 사진(dataURL)을 재업로드 없이 다시 크롭 편집
  function openCropperData(dataUrl, onDone, initState) {
    if (!dataUrl) { onDone(null); return; }
    const img = new Image();
    img.onload = () => buildCropper(img, onDone, initState);
    img.onerror = () => { toast("사진을 불러오지 못했어요"); onDone(null); };
    img.src = dataUrl;
  }
  function downscaleDataURL(img, maxLong) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const sc = Math.min(1, maxLong / Math.max(w, h));
    if (sc >= 1) return img.src;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }
  // 사진 미리보기 옆 '크기·위치 편집' 버튼: 현재 사진을 다시 크롭
  function bindPhotoEdit(previewId, btnId, getOrig, getState, setResult) {
    const pv = $(previewId), btn = $(btnId);
    if (!pv || !btn) return;
    const sync = () => { btn.hidden = pv.classList.contains("hidden") || !pv.getAttribute("src"); };
    btn.onclick = (e) => {
      e.preventDefault();
      const orig = getOrig();
      if (!orig) { toast("먼저 사진을 넣어주세요"); return; }
      openCropperData(orig, (cropped, newOrig, state) => { if (cropped) setResult(cropped, newOrig, state); }, getState());
    };
    if (window.MutationObserver) new MutationObserver(sync).observe(pv, { attributes: true, attributeFilter: ["src", "class"] });
    sync();
  }
  function buildCropper(img, onDone, initState) {
    const natW = img.naturalWidth, natH = img.naturalHeight;
    let ratioKey = "1:1", tx = 0, ty = 0, z = 1;
    let frameW = 0, frameH = 0, baseScale = 1, isOrig = false;

    const ov = document.createElement("div");
    ov.className = "crop-ov";
    ov.innerHTML = `
      <div class="crop-box" role="dialog" aria-label="사진 자르기" aria-modal="true">
        <div class="crop-head"><b>사진 자르기</b><button class="crop-x" type="button" aria-label="닫기">${I("x")}</button></div>
        <div class="crop-body">
          <div class="crop-ratios">${ARCH_RATIOS.map(([k, l]) => `<button class="crop-ratio ${k === ratioKey ? "on" : ""}" type="button" data-r="${k}">${l}</button>`).join("")}</div>
          <div class="crop-stage" id="cropStage"><div class="crop-bg" id="cropBg"></div><img class="crop-img" id="cropImg" alt=""></div>
          <p class="crop-hint">사진을 끌어 옮기고, 휠(또는 손가락 모으기)로 자유롭게 확대·축소해요</p>
        </div>
        <div class="crop-actions"><button class="btn btn-ghost btn-sm" type="button" id="cropCancel">취소</button><button class="btn btn-primary btn-sm" type="button" id="cropApply">적용</button></div>
      </div>`;
    document.body.appendChild(ov);
    const stage = ov.querySelector("#cropStage");
    const imEl = ov.querySelector("#cropImg");
    const bgEl = ov.querySelector("#cropBg");
    imEl.src = img.src;

    const maxW = Math.min(window.innerWidth * 0.82, 360);
    const maxH = Math.min(window.innerHeight * 0.5, 420);

    function layout() {
      isOrig = ratioKey === "orig";
      const aspect = isOrig ? (natW / natH) : ARCH_RATIOS.find((r) => r[0] === ratioKey)[2];
      frameW = maxW; frameH = frameW / aspect;
      if (frameH > maxH) { frameH = maxH; frameW = frameH * aspect; }
      stage.style.width = frameW + "px"; stage.style.height = frameH + "px";
      // 항상 '맞춤(contain)' — 사진을 키워서 자르지 않고 전체를 비율 틀 가운데에 표시
      baseScale = Math.min(frameW / natW, frameH / natH);
      imEl.style.width = (natW * baseScale) + "px";
      imEl.style.height = (natH * baseScale) + "px";
      imEl.style.marginLeft = (-natW * baseScale / 2) + "px";
      imEl.style.marginTop = (-natH * baseScale / 2) + "px";
      tx = 0; ty = 0; z = 1;
      stage.classList.toggle("orig", isOrig);
      // 비율 틀이 사진보다 크면 남는 위·아래(또는 좌·우)를 같은 사진의 흐린 배경으로 채움(인스타 스타일).
      // 원본 비율은 빈틈이 없으므로 배경을 숨김.
      if (bgEl) { bgEl.style.backgroundImage = isOrig ? "none" : `url("${img.src}")`; bgEl.style.display = isOrig ? "none" : ""; }
      apply();
    }
    function clamp() {
      const ds = baseScale * z;
      const limX = Math.max(0, (natW * ds - frameW) / 2);
      const limY = Math.max(0, (natH * ds - frameH) / 2);
      tx = Math.min(limX, Math.max(-limX, tx));
      ty = Math.min(limY, Math.max(-limY, ty));
    }
    function apply() {
      if (!isOrig) clamp();
      imEl.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
    }
    // 끌어 이동(1포인터) + 손가락 모으기 확대(2포인터) + 휠 확대 — 슬라이더 없이 자유롭게
    const ptrs = new Map();
    let drag = null, pinchDist = 0, pinchZ = 1;
    stage.onpointerdown = (e) => {
      if (isOrig) return;
      e.preventDefault();
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, tx, ty };
      else if (ptrs.size === 2) {
        const p = [...ptrs.values()];
        pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        pinchZ = z; drag = null;
      }
    };
    stage.onpointermove = (e) => {
      if (isOrig || !ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size >= 2) {
        const p = [...ptrs.values()];
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        z = Math.min(5, Math.max(1, pinchZ * (dist / pinchDist)));
        apply();
      } else if (drag) {
        tx = drag.tx + (e.clientX - drag.x);
        ty = drag.ty + (e.clientY - drag.y);
        apply();
      }
    };
    const endPtr = (e) => {
      ptrs.delete(e.pointerId);
      if (ptrs.size === 1) { const p = [...ptrs.values()][0]; drag = { x: p.x, y: p.y, tx, ty }; }
      else if (ptrs.size === 0) drag = null;
    };
    stage.onpointerup = endPtr;
    stage.onpointercancel = endPtr;
    stage.onwheel = (e) => {
      if (isOrig) return;
      e.preventDefault();
      z = Math.min(5, Math.max(1, z * (e.deltaY < 0 ? 1.12 : 0.89)));
      apply();
    };
    ov.querySelectorAll("[data-r]").forEach((b) => {
      b.onclick = () => { ratioKey = b.dataset.r; ov.querySelectorAll("[data-r]").forEach((x) => x.classList.toggle("on", x === b)); layout(); };
    });

    const close = () => ov.remove();
    const cancel = () => { close(); onDone(null); };
    ov.querySelector(".crop-x").onclick = cancel;
    ov.querySelector("#cropCancel").onclick = cancel;
    ov.onclick = (e) => { if (e.target === ov) cancel(); };
    ov.querySelector("#cropApply").onclick = () => {
      const data = renderCrop();
      const orig = downscaleDataURL(img, 1280);
      const state = { ratioKey, z, ntx: frameW ? tx / frameW : 0, nty: frameH ? ty / frameH : 0 };
      close(); onDone(data, orig, state);
    };

    function renderCrop() {
      const c = document.createElement("canvas"), maxLong = 1000;
      if (isOrig) {
        const sc = Math.min(1, maxLong / Math.max(natW, natH));
        c.width = Math.max(1, Math.round(natW * sc)); c.height = Math.max(1, Math.round(natH * sc));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      } else {
        clamp();
        const ds = baseScale * z;
        // 출력 캔버스 = 선택한 비율(프레임 비율), 긴 변을 maxLong로
        const fAspect = frameW / frameH;
        let outW, outH;
        if (fAspect >= 1) { outW = maxLong; outH = Math.round(maxLong / fAspect); }
        else { outH = maxLong; outW = Math.round(maxLong * fAspect); }
        c.width = Math.max(1, outW); c.height = Math.max(1, outH);
        const ctx = c.getContext("2d");
        const k = outW / frameW; // 편집 프레임(px) → 출력(px) 배율
        // 1) 남는 영역용 흐린 배경: 같은 사진을 캔버스에 꽉 차게(cover) 그린 뒤 블러
        const coverScale = Math.max(outW / natW, outH / natH) * 1.18;
        const bw = natW * coverScale, bh = natH * coverScale;
        let blurred = false;
        try { ctx.filter = `blur(${Math.max(8, Math.round(20 * k))}px)`; blurred = true; } catch (_) {}
        ctx.drawImage(img, (outW - bw) / 2, (outH - bh) / 2, bw, bh);
        if (blurred) ctx.filter = "none";
        // 2) 사진 본체: 편집기와 동일하게 '맞춤' 크기로 가운데(+드래그/확대) 배치
        const dispW = natW * ds * k, dispH = natH * ds * k;
        const dx = (outW - dispW) / 2 + tx * k;
        const dy = (outH - dispH) / 2 + ty * k;
        ctx.drawImage(img, dx, dy, dispW, dispH);
      }
      return c.toDataURL("image/jpeg", 0.85);
    }
    layout();
    if (initState) {
      if (initState.ratioKey) { ratioKey = initState.ratioKey; ov.querySelectorAll("[data-r]").forEach((x) => x.classList.toggle("on", x.dataset.r === ratioKey)); layout(); }
      if (typeof initState.z === "number") z = Math.min(5, Math.max(1, initState.z));
      tx = (initState.ntx || 0) * frameW;
      ty = (initState.nty || 0) * frameH;
      apply();
    }
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
    const dKey = (n) => (String(n.date).match(/\d{4}\.\d{2}\.\d{2}/) || [""])[0]; // 날짜 문자열에 꼬리표가 붙어도 숫자 날짜만 뽑아 정렬
    const sorted = NOTICES.slice().filter((n) => n.cat !== "patch").sort((a, b) => dKey(b).localeCompare(dKey(a)) || (b.id - a.id)); // 날짜 최신순(패치 제외 — 메인 팝업엔 안 띄움)
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
    html += `<a class="notice-allbtn notice-fbbtn" href="feedback.html" target="_blank" rel="noopener">💬 건의함 — 의견 남기기 →</a>`;
    return html;
  }

  /* 사이드바·더보기 공지 배지(빨간 점) 갱신 */
  function updateNoticeBadge() {
    const show = hasUnseenNotices() || _updateAvailable;
    ["noticeDotSide", "noticeDotTop", "noticeDotMore"].forEach((id) => {
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
        <div class="field"><label>제목 *</label><input type="text" id="mTitle" placeholder=""></div>
        <div class="field"><label>구분 <small>(오프라인 행사 / 온라인 활동)</small></label>
          <div class="seg" id="mSchedMode">
            <button type="button" data-sm="offline">${I("pin")} 오프라인</button>
            <button type="button" data-sm="online">${I("monitor")} 온라인</button>
          </div>
        </div>
        <div class="field"><label>카테고리</label>
          <select id="mCat"></select>
        </div>
        <div class="field"><label>날짜 *</label><input type="date" id="mDate" value="${baseDate}"></div>
        ${edit ? "" : `<div class="field" id="mMultiField"><label>여러 날 한 번에 <small>(콘서트 3일 등 — 날짜 골라 '추가')</small></label>
          <div class="multidate-row"><input type="date" id="mDateExtra"><button type="button" class="btn btn-ghost btn-sm" id="mDateAdd">+ 추가</button></div>
          <div class="date-chips" id="mDateChips"></div></div>`}
        <div class="field"><label>시간</label><input type="time" id="mTime"></div>
        <div class="field"><label>장소</label><input type="text" id="mPlace" placeholder=""></div>
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
      let schedMode = edit ? (edit.mode || "offline") : "offline";
      const fillCat = () => {
        const opts = Object.entries(CATS).filter(([k, c]) => (c.mode || "offline") === schedMode);
        $("mCat").innerHTML = opts.length
          ? opts.map(([k, c]) => `<option value="${k}">${esc(c.name)}</option>`).join("")
          : `<option value="">(이 모드의 카테고리 없음 — 관리에서 추가)</option>`;
      };
      const syncSchedMode = () => {
        $("mSchedMode").querySelectorAll("[data-sm]").forEach((b) => {
          b.classList.toggle("active", b.dataset.sm === schedMode);
          b.onclick = () => { schedMode = b.dataset.sm; syncSchedMode(); fillCat(); };
        });
      };
      syncSchedMode();
      fillCat();
      const mr = $("mRepeat");
      if (mr) mr.onchange = () => {
        $("mRepEndWrap").classList.toggle("hidden", !mr.value);
        if (mr.value && !$("mRepEnd").value) {
          const d = new Date($("mDate").value || baseDate);
          d.setMonth(d.getMonth() + 3);
          $("mRepEnd").value = fmtDate(d);
        }
      };
      // 여러 날 추가 (콘서트 3일 등) — 칩으로 모아 한 번에 등록
      let extraDates = [];
      const mAddBtn = $("mDateAdd"), mExtra = $("mDateExtra"), mChips = $("mDateChips");
      const renderDateChips = () => {
        if (!mChips) return;
        mChips.innerHTML = extraDates.slice().sort().map((d) => `<span class="date-chip">${d.replace(/-/g, ".")}<button type="button" data-rmd="${d}" aria-label="삭제">×</button></span>`).join("");
        mChips.querySelectorAll("[data-rmd]").forEach((b) => { b.onclick = () => { extraDates = extraDates.filter((x) => x !== b.dataset.rmd); renderDateChips(); }; });
      };
      if (mExtra) { const d0 = new Date(($("mDate").value || baseDate) + "T00:00:00"); d0.setDate(d0.getDate() + 1); mExtra.value = fmtDate(d0); }
      if (mAddBtn) mAddBtn.onclick = () => {
        const v = mExtra.value; if (!v) return;
        if (v === $("mDate").value) return toast("맨 위 날짜와 같아요");
        if (!extraDates.includes(v)) extraDates.push(v);
        renderDateChips();
        const d = new Date(v + "T00:00:00"); d.setDate(d.getDate() + 1); mExtra.value = fmtDate(d); // 연속 추가 편하게 다음 날 자동
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
            const base = new Date(data.date + "T00:00:00"); // 로컬 자정 기준(시간대 오차 방지)
            let n = 0;
            if (rep === "w" || rep === "2w") {
              const step = rep === "w" ? 7 : 14;
              const d = new Date(base);
              while (fmtDate(d) <= until && n < 60) {
                S.schedules.push({ id: uid(), biasId: S.currentBias, ...data, date: fmtDate(d), groupId });
                d.setDate(d.getDate() + step);
                n++;
              }
            } else {
              // 매달: 시작일의 '일'을 유지하되, 그 달에 없는 날(예: 31일)은 말일로 보정해 월을 건너뛰지 않음
              const baseDay = base.getDate();
              for (let k = 0; n < 60; k++) {
                const d = new Date(base.getFullYear(), base.getMonth() + k, baseDay);
                if (d.getDate() !== baseDay) d.setDate(0); // 다음 달로 넘어갔으면 해당 달 말일로 당김
                const ds = fmtDate(d);
                if (ds > until) break;
                S.schedules.push({ id: uid(), biasId: S.currentBias, ...data, date: ds, groupId });
                n++;
              }
            }
            toast(`반복 일정 ${n}개를 등록했어요`);
          } else if (extraDates.length) {
            const all = [...new Set([data.date, ...extraDates])].sort();
            const groupId = uid();
            all.forEach((ds) => S.schedules.push({ id: uid(), biasId: S.currentBias, ...data, date: ds, groupId }));
            toast(`${all.length}개 날짜에 일정을 등록했어요`);
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
        <div class="field"><label>내용 *</label><input type="text" id="mTitle" placeholder=""></div>
        <div class="field"><label>금액 *</label>
          <div class="amt-row"><input type="text" id="mAmount" inputmode="numeric" placeholder="0원"><select id="mCur">${CURRENCIES.map(([c, u, sfx, lbl]) => `<option value="${c}">${lbl}</option>`).join("")}</select></div>
        </div>
        <div class="field" id="mFxField" style="display:none"><label>환율 <small>(1 <span id="mFxUnit">USD</span> = ? 원)</small></label>
          <input type="text" id="mFx" inputmode="decimal" placeholder="예: 1380">
          <p class="hint" id="mFxPreview" style="margin:6px 0 0"></p>
        </div>
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
      const fxRate = () => parseFloat(($("mFx").value || "").replace(/[^\d.]/g, "")) || 0;
      const updFxPreview = () => {
        const cur = $("mCur").value;
        if (cur === "KRW") { $("mFxPreview").textContent = ""; return; }
        const amt = amtNum($("mAmount")), rate = fxRate();
        $("mFxPreview").textContent = (amt && rate) ? `≈ ${won(Math.round(amt * rate))}` : "금액과 환율을 입력하면 원화로 환산돼요";
      };
      const applyCur = () => {
        const cur = $("mCur").value, foreign = cur !== "KRW";
        const keep = amtNum($("mAmount")); // 현재 입력 숫자 유지(소수 포함)
        attachAmountInput($("mAmount"), keep || null, curUnit(cur), curDec(cur), updFxPreview);
        $("mFxField").style.display = foreign ? "" : "none";
        if (foreign) {
          $("mFxUnit").textContent = cur;
          if (!fxRate() && S.lastFx && S.lastFx[cur]) $("mFx").value = String(S.lastFx[cur]); // 통화별 마지막 환율 자동 채움
        }
        updFxPreview();
      };
      $("mCur").onchange = () => { $("mFx").value = ""; applyCur(); };
      $("mFx").oninput = () => { const v = ($("mFx").value || "").replace(/[^\d.]/g, ""); const i = v.indexOf("."); $("mFx").value = i < 0 ? v : v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, ""); updFxPreview(); };
      attachAmountInput($("mAmount"), null, "원", 0, updFxPreview);
      if (edit) {
        $("mTitle").value = edit.title;
        $("mCat").value = edit.category;
        $("mPay").value = edit.pay || PAY_METHODS[0];
        $("mDate").value = edit.date;
        $("mMemo").value = edit.memo || "";
        $("mCur").value = (edit.cur && CURRENCIES.some((c) => c[0] === edit.cur)) ? edit.cur : "KRW";
        if (edit.cur && edit.cur !== "KRW") { $("mFx").value = edit.fx ? String(edit.fx) : ""; attachAmountInput($("mAmount"), edit.fxAmount || edit.amount, curUnit(edit.cur), curDec(edit.cur), updFxPreview); }
        else attachAmountInput($("mAmount"), edit.amount, "원", 0, updFxPreview);
        $("mSave").textContent = "수정 완료";
      }
      applyCur();
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        const cur = $("mCur").value;
        let amount, fx = null, fxAmount = null;
        if (cur === "KRW") {
          amount = Math.round(amtNum($("mAmount")));
          if (!title || !amount) return toast("내용과 금액을 입력해 주세요!");
        } else {
          fxAmount = amtNum($("mAmount")); fx = fxRate();
          if (!title || !fxAmount || !fx) return toast("내용·금액·환율을 입력해 주세요!");
          amount = Math.round(fxAmount * fx);
          if (!S.lastFx) S.lastFx = {};
          S.lastFx[cur] = fx; // 통화별 마지막 환율 기억
        }
        const data = {
          title, amount, category: $("mCat").value, pay: $("mPay").value,
          date: $("mDate").value || todayKey(), memo: $("mMemo").value.trim(),
          cur, fx, fxAmount,
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
        <div class="field"><label>제목 *</label><input type="text" id="mTitle" placeholder=""></div>
        <div class="field"><label>날짜</label><input type="date" id="mDate" value="${baseDate}"></div>
        <div class="field"><label>유형</label>
          <select id="mEtype">${effArchTypes("offline").map((t) => `<option>${esc(t)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>장소</label><input type="text" id="mPlace" placeholder=""></div>
        <div class="field"><label>오늘의 기록 *</label><textarea id="mContent" placeholder=""></textarea></div>
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
        <div class="field"><label>이름 *</label><input type="text" id="mTitle" placeholder=""></div>
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
        <div class="poca-pick-row">
          <div class="poca-pick-col">${photoPickHtml("+ 앞면 사진")}<span class="poca-pick-cap">앞면</span><button type="button" class="pc-edit-photo" id="mpEdit" hidden>크기·위치 편집</button></div>
          <div class="poca-pick-col">${photoPickBackHtml("+ 뒷면 (선택)")}<span class="poca-pick-cap">뒷면</span><button type="button" class="pc-edit-photo" id="mp2Edit" hidden>크기·위치 편집</button></div>
        </div>
        <div class="field"><label>이름 / 버전 *</label><input type="text" id="mTitle" placeholder=""></div>
        <div class="field"><label>앨범 / 출처</label><input type="text" id="mAlbum" placeholder=""></div>
        <div class="field"><label>상태</label>
          <select id="mPStatus"><option value="own">보유</option><option value="wish">위시</option><option value="trade">교환 중</option></select>
        </div>
        <div class="field"><label>수량 <small>(중복 보유 장수)</small></label><input type="number" id="mQty" min="1" step="1" value="1"></div>
        <div class="field" id="mWishFields"><label>위시 우선순위</label>
          <select id="mPriority"><option value="2">보통</option><option value="1">높음 ★</option><option value="3">낮음</option></select>
        </div>
        <div class="field"><label>가격 <small>(선택 · 구매가/시세)</small></label><input type="text" id="mPrice" inputmode="numeric" placeholder="0원"></div>
        <div class="field" id="mTradeField"><label>교환 정보 <small>(상대·플랫폼)</small></label><input type="text" id="mTradeWith" placeholder="예: @닉네임 / 트위터"></div>
        <div class="field"><label>메모</label><input type="text" id="mMemo" placeholder="구매처, 상태 등"></div>
        <div class="field"><label>반짝이 효과 <small>(누르면 아래 미리보기)</small></label><div class="fx-pick" id="mFxPick"></div>
          <div class="fx-live-wrap" id="fxLiveWrap" hidden>
            <div class="fx-live-card" id="fxLiveCard"><img id="fxLiveImg" alt="효과 미리보기"><span class="poca-fx" id="fxLiveFx" aria-hidden="true"></span></div>
            <span class="fx-live-hint">앞면 사진에 적용한 모습 · 마우스·기울임에 반응</span>
          </div>
          <label class="fx-back-toggle" id="mFxBackWrap" hidden><input type="checkbox" id="mFxBack"> 뒷면에도 같은 효과 적용</label>
        </div>
        <button class="btn btn-primary btn-lg" id="mSave">바인더에 넣기</button>
      `);
      bindPhotoPick(500, true);
      bindPhotoPickBack(true);
      attachWonInput($("mPrice"));
      bindPhotoEdit("mpPreview", "mpEdit",
        () => modalPhotoOrig || (edit && edit.imgOrig) || modalPhotoData || (edit && edit.img),
        () => modalPhotoState || (edit && edit.imgState) || null,
        (cropped, orig, state) => { modalPhotoData = cropped; modalPhotoOrig = orig || cropped; modalPhotoState = state || null; const p = $("mpPreview"); p.src = cropped; p.classList.remove("hidden"); $("mpHint").classList.add("hidden"); });
      bindPhotoEdit("mp2Preview", "mp2Edit",
        () => modalPhotoBackOrig || (edit && edit.imgBackOrig) || modalPhotoBack || (edit && edit.imgBack),
        () => modalPhotoBackState || (edit && edit.imgBackState) || null,
        (cropped, orig, state) => { modalPhotoBack = cropped; modalPhotoBackOrig = orig || cropped; modalPhotoBackState = state || null; const p = $("mp2Preview"); p.src = cropped; p.classList.remove("hidden"); $("mp2Hint").classList.add("hidden"); });
      let pocaFx = (edit && edit.effect) || "";
      const fxPick = $("mFxPick");
      const fxWrap = $("fxLiveWrap"), fxLiveImg = $("fxLiveImg"), fxLiveFx = $("fxLiveFx"), fxLiveCard = $("fxLiveCard");
      let fxReactBound = false;
      const updateFxLive = () => {
        if (!fxWrap) return;
        const mp = $("mpPreview");
        const src = modalPhotoData || (edit && edit.img) || (mp && !mp.classList.contains("hidden") ? mp.getAttribute("src") : "");
        if (src) {
          fxLiveImg.src = src; fxWrap.hidden = false;
          if (!fxReactBound) { attachFxReact(fxLiveCard); fxReactBound = true; }
        } else { fxWrap.hidden = true; }
        if (fxLiveFx) fxLiveFx.className = "poca-fx" + (pocaFx ? " fx-" + pocaFx : "");
        const fxBackWrap = $("mFxBackWrap");
        if (fxBackWrap) fxBackWrap.hidden = !pocaFx; // 효과가 있을 때만 '뒷면에도 적용' 노출
        if (pocaFx) enablePocaTilt();
      };
      if (fxPick) {
        fxPick.innerHTML = POCA_FX.map(([k, l]) =>
          `<button type="button" class="fx-chip ${k === pocaFx ? "on" : ""}" data-fx="${k}"><span class="fx-prev ${k ? "fx-" + k : ""}"></span><span class="fx-chip-lb">${l}</span></button>`).join("");
        fxPick.querySelectorAll("[data-fx]").forEach((b) => {
          b.onclick = () => { pocaFx = b.dataset.fx; fxPick.querySelectorAll("[data-fx]").forEach((x) => x.classList.toggle("on", x === b)); updateFxLive(); };
        });
      }
      { const mp = $("mpPreview"); if (mp && window.MutationObserver) { new MutationObserver(updateFxLive).observe(mp, { attributes: true, attributeFilter: ["src", "class"] }); } }
      updateFxLive();
      const pocaSyncFields = () => {
        const st = $("mPStatus").value;
        $("mWishFields").style.display = st === "wish" ? "" : "none";
        $("mTradeField").style.display = st === "trade" ? "" : "none";
      };
      $("mPStatus").onchange = pocaSyncFields;
      if (edit) {
        $("mTitle").value = edit.name || "";
        $("mAlbum").value = edit.album || "";
        $("mPStatus").value = edit.status;
        $("mMemo").value = edit.memo || "";
        $("mQty").value = edit.qty || 1;
        $("mPriority").value = String(edit.priority || 2);
        $("mTradeWith").value = edit.tradeWith || "";
        if ($("mFxBack")) $("mFxBack").checked = !!edit.effectBack;
        if (edit.price) attachWonInput($("mPrice"), edit.price);
        if (edit.img) { $("mpPreview").src = edit.img; $("mpPreview").classList.remove("hidden"); $("mpHint").classList.add("hidden"); }
        if (edit.imgBack) { $("mp2Preview").src = edit.imgBack; $("mp2Preview").classList.remove("hidden"); $("mp2Hint").classList.add("hidden"); }
        $("mSave").textContent = "수정 완료";
      }
      pocaSyncFields();
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name && !modalPhotoData && !(edit && edit.img)) return toast("사진 또는 이름을 넣어주세요!");
        const status = $("mPStatus").value;
        const album = $("mAlbum").value.trim();
        const fields = {
          name, album, memo: $("mMemo").value.trim(), status,
          qty: Math.max(1, +$("mQty").value || 1),
          priority: +$("mPriority").value || 2,
          price: wonValue($("mPrice")),
          tradeWith: $("mTradeWith").value.trim(),
          effect: pocaFx,
          effectBack: !!($("mFxBack") && $("mFxBack").checked),
        };
        if (edit) {
          Object.assign(edit, fields);
          if (modalPhotoData) { edit.img = modalPhotoData; delete edit.imgKey; edit.imgOrig = modalPhotoOrig || modalPhotoData; delete edit.imgOrigKey; edit.imgState = modalPhotoState || null; }
          if (modalPhotoBack) { edit.imgBack = modalPhotoBack; delete edit.imgBackKey; edit.imgBackOrig = modalPhotoBackOrig || modalPhotoBack; delete edit.imgBackOrigKey; edit.imgBackState = modalPhotoBackState || null; }
        } else {
          S.photocards.push({ id: uid(), biasId: S.currentBias, img: modalPhotoData, imgBack: modalPhotoBack, imgOrig: modalPhotoOrig || modalPhotoData || null, imgState: modalPhotoState || null, imgBackOrig: modalPhotoBackOrig || modalPhotoBack || null, imgBackState: modalPhotoBackState || null, ...fields });
        }
        save(); closeModal(); renderHome(); binderTab(status); go("binder");
        toast(edit ? "포카 정보를 수정했어요" : "바인더에 쏙 넣었어요");
      };
      return;
    }

    /* 스타일 아이템 등록/수정 */
    if (type === "styleItem") {
      const edit = editId ? S.styles.find((x) => x.id === editId) : null;
      const catOpts = (sel) => effStyleCats().map((c) => `<option ${c === sel ? "selected" : ""}>${esc(c)}</option>`).join("") + `<option value="__add">+ 분류 직접 추가…</option>`;
      openModalRaw(edit ? "스타일 아이템 수정" : "스타일 아이템 등록", `
        ${photosPickHtml()}
        <div class="field"><label>아이템 이름 *</label><input type="text" id="mTitle" placeholder=""></div>
        <div class="field"><label>분류</label>
          <select id="mCat">${catOpts(edit ? edit.category : ST_CATS[0])}</select>
        </div>
        <div class="field"><label>브랜드 / 정보</label><input type="text" id="mInfo" placeholder=""></div>
        <div class="field"><label>사이즈 / 컬러 <small>(선택)</small></label><input type="text" id="mSize" placeholder="예: M / 블랙"></div>
        <div class="field"><label>가격 <small>(선택)</small></label><input type="text" id="mPrice" inputmode="numeric" placeholder="0원"></div>
        <div class="field"><label>구매처 링크 <small>(선택 · 사고 싶은 곳 / 산 곳)</small></label><input type="url" id="mLink2" placeholder="https://"></div>
        <div class="field"><label>착용 정보 <small>(어디서 착용)</small></label><input type="text" id="mWorn" placeholder="예: 인천공항 / OO무대"></div>
        <div class="field"><label>착용 날짜 <small>(선택)</small></label><input type="date" id="mWornDate"></div>
        <div class="field"><label>룩 / 코디 묶음 <small>(선택 · 같은 이름끼리 묶임)</small></label><input type="text" id="mLook" placeholder="예: 공항룩 6/20"></div>
        <div class="field"><label>상태</label>
          <select id="mStatus"><option value="wish">위시</option><option value="bought">구매 완료</option></select>
        </div>
        <div class="field" id="mStPrio"><label>위시 우선순위</label>
          <select id="mPriority2"><option value="2">보통</option><option value="1">높음 ★</option><option value="3">낮음</option></select>
        </div>
        <div class="field row-field" id="mLedgerField"><label>가계부에 지출로 추가 <small>(구매 완료 시)</small></label><label class="chk"><input type="checkbox" id="mToLedger"> <span></span></label></div>
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
        ${edit ? `<button class="btn btn-danger btn-lg slim" id="mDelStyle">이 아이템 삭제</button>` : ""}
      `);
      bindPhotosPick(edit ? ((Array.isArray(edit.imgs) && edit.imgs.length) ? edit.imgs : (edit.img ? [edit.img] : [])) : []);
      attachWonInput($("mPrice"));
      const rebuildCats = (sel) => { $("mCat").innerHTML = catOpts(sel); };
      $("mCat").onchange = () => {
        if ($("mCat").value === "__add") {
          const n = (prompt("새 분류 이름을 입력하세요") || "").trim();
          if (n && !effStyleCats().includes(n)) { if (!Array.isArray(S.customStyleCats)) S.customStyleCats = []; S.customStyleCats.push(n); save(); }
          rebuildCats(n || ST_CATS[0]);
        }
      };
      const stSync = () => {
        const st = $("mStatus").value;
        if ($("mStPrio")) $("mStPrio").style.display = st === "wish" ? "" : "none";
        if ($("mLedgerField")) $("mLedgerField").style.display = st === "bought" ? "" : "none";
      };
      $("mStatus").onchange = stSync;
      if (edit) {
        $("mTitle").value = edit.name;
        $("mCat").value = edit.category || ST_CATS[0];
        $("mInfo").value = edit.info || "";
        $("mSize").value = edit.size || "";
        if (edit.price) attachWonInput($("mPrice"), edit.price);
        $("mLink2").value = edit.link || "";
        $("mWorn").value = edit.wornInfo || "";
        $("mWornDate").value = edit.wornDate || "";
        $("mLook").value = edit.look || "";
        $("mStatus").value = edit.status;
        $("mPriority2").value = String(edit.priority || 2);
        if (edit.expenseId) { const ml = $("mToLedger"); if (ml) { ml.checked = true; ml.disabled = true; } } // 이미 연동됨
        $("mSave").textContent = "수정 완료";
      }
      stSync();
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name) return toast("아이템 이름을 입력해 주세요!");
        let cat = $("mCat").value; if (cat === "__add") cat = ST_CATS[0];
        const imgs = modalPhotosData.slice();
        const data = {
          name, category: cat, info: $("mInfo").value.trim(),
          size: $("mSize").value.trim(), price: wonValue($("mPrice")),
          link: $("mLink2").value.trim(), status: $("mStatus").value,
          wornInfo: $("mWorn").value.trim(), wornDate: $("mWornDate").value || "",
          look: $("mLook").value.trim(), priority: +$("mPriority2").value || 2,
        };
        let target;
        if (edit) {
          Object.assign(edit, data);
          edit.imgs = imgs; edit.img = imgs[0] || null; delete edit.imgKey; delete edit.imgKeys;
          target = edit;
        } else {
          target = { id: uid(), biasId: S.currentBias, imgs, img: imgs[0] || null, ...data };
          S.styles.push(target);
        }
        // 가계부 연동: 구매 완료 + 가격 + 체크 + 아직 미연동일 때만 지출 1건 생성
        const ml = $("mToLedger");
        if (ml && ml.checked && !ml.disabled && data.status === "bought" && data.price > 0 && !target.expenseId) {
          const exId = uid();
          S.expenses.push({ id: exId, biasId: S.currentBias, title: name, amount: data.price, category: "굿즈·MD", pay: "카드", date: data.wornDate || todayKey(), memo: "스타일북 연동", cur: "KRW", fx: null, fxAmount: null });
          target.expenseId = exId;
        }
        save(); closeModal(); renderStyle(); renderLedger(); renderHome(); go("style");
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
      let mcIdPhoto = m.memberPhoto || null;
      openModalRaw("나만의 멤버십 카드", `
        <div class="mc-preview-wrap"><div class="member-card" id="mcPreview"></div></div>
        <p class="dt-label">카드 디자인</p>
        <div class="mc-presets" id="mcPresets">${MEMBERSHIP_STYLES.map(([k, l]) => `<button type="button" class="mc-preset mc-style-${k}" data-mcs="${k}">${l}</button>`).join("")}</div>
        <div class="field"><label>카드 이름</label><input type="text" id="mTitle" value="${esc(m.title)}" maxlength="20"></div>
        <div class="field"><label>내 이름 (영문 추천)</label><input type="text" id="mName" value="${esc(m.name)}" maxlength="24"></div>
        <div class="field"><label>아이콘 (이모지 1개)</label><input type="text" id="mIcon" value="${esc(m.icon)}" maxlength="2"></div>
        <div class="field"><label>멤버 번호</label><input type="text" id="mNo" value="${esc(m.no)}" maxlength="10"></div>
        <div class="field"><label>멤버십 만료일 <small>(팬클럽 기간 관리)</small></label>${dateSelectHTML("mExpiry", m.expiry || "", { yearsBack: 100, yearsFwd: 10, yearDesc: true, clearable: true })}</div>
        <div class="mc-photos">
          <div class="field mc-photo-field">
            <label>증명사진 <small>(선택)</small></label>
            <div class="mc-pick-box">
              <label class="photo-pick mc-id-pick" id="mmBox">
                <input type="file" accept="image/*" id="mmInput" hidden>
                <span id="mmHint">+ 사진</span>
                <img id="mmPreview" class="hidden" alt="증명사진 미리보기">
              </label>
              <button type="button" class="pick-x${mcIdPhoto ? "" : " hidden"}" id="mmClear" aria-label="증명사진 빼기">✕</button>
            </div>
          </div>
          <div class="field mc-photo-field">
            <label>배경 사진 <small>(선택)</small></label>
            <div class="mc-pick-box mc-bg-pick">
              ${photoPickHtml("+ 배경 사진")}
              <button type="button" class="pick-x${mcPhoto ? "" : " hidden"}" id="mcPhotoClear" aria-label="배경 사진 빼기">✕</button>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="mSave">카드 발급</button>
      `);
      const prev = $("mcPreview");
      const updatePreview = () => {
        const b = curBias();
        const since = b && b.startDate ? b.startDate.slice(0, 4) : "—";
        prev.className = "member-card mc-style-" + mcStyle + (mcPhoto ? " has-photo" : "") + (mcIdPhoto ? " has-idphoto" : "");
        prev.style.backgroundImage = mcPhoto ? `linear-gradient(135deg, rgba(0,0,0,.55), rgba(0,0,0,.2)), url(${mcPhoto})` : "";
        prev.style.backgroundSize = mcPhoto ? "cover" : "";
        prev.style.backgroundPosition = mcPhoto ? "center" : "";
        prev.innerHTML =
          `<div class="mc-top"><span class="mc-logo">${esc($("mIcon").value || "✦")}</span><span class="mc-title">${esc($("mTitle").value || "MY STAR PASS")}</span></div>`
          + `<div class="mc-name">${esc($("mName").value || "MY NAME")}</div>`
          + `<div class="mc-foot"><span>SINCE ${since}</span><span>NO. ${esc($("mNo").value || "0001")}</span></div>`
          + (mcIdPhoto ? `<img class="mc-photo" src="${mcIdPhoto}" alt="">` : "");
        $("mcPresets").querySelectorAll("[data-mcs]").forEach((x) => x.classList.toggle("on", x.dataset.mcs === mcStyle));
      };
      ["mTitle", "mName", "mIcon", "mNo"].forEach((id) => { $(id).oninput = updatePreview; });
      $("mcPresets").querySelectorAll("[data-mcs]").forEach((x) => { x.onclick = () => { mcStyle = x.dataset.mcs; updatePreview(); }; });
      // 배경 사진 업로드 (라벨이 입력을 자동으로 열므로 onclick 생략)
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
      // 증명사진 업로드
      $("mmInput").onchange = (e) => {
        const f = e.target.files[0];
        e.target.value = "";
        if (!f) return;
        fileToData(f, 500, (data) => {
          mcIdPhoto = data;
          $("mmPreview").src = data; $("mmPreview").classList.remove("hidden"); $("mmHint").classList.add("hidden");
          $("mmClear").classList.remove("hidden");
          updatePreview();
        });
      };
      $("mmClear").onclick = () => {
        mcIdPhoto = null;
        $("mmPreview").classList.add("hidden"); $("mmHint").classList.remove("hidden");
        $("mmClear").classList.add("hidden");
        updatePreview();
      };
      if (mcIdPhoto) { $("mmPreview").src = mcIdPhoto; $("mmPreview").classList.remove("hidden"); $("mmHint").classList.add("hidden"); }
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
          memberPhoto: mcIdPhoto || null,
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
        <div class="field"><label>생일</label><div class="cal-row">${calToggleHTML("mBirthCal", !!(edit && edit.birthdayLunar))}<span class="cal-preview" id="mBirthPrev"></span></div>${dateSelectHTML("mBirth", edit && edit.birthday ? edit.birthday : "", { yearsFwd: 1, clearable: true })}</div>
        <div class="field"><label>데뷔일</label>${dateSelectHTML("mDebut", edit && edit.debutDate ? edit.debutDate : "", { yearsFwd: 1, clearable: true })}</div>
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
          birthdayLunar: !!dateSelectVal("mBirth") && calToggleVal("mBirthCal"),
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
    homeDay = null; homeWeekOffset = 0; // 전체 재렌더(최애 전환·가져오기 등) 때 홈 'TODAY' 카드는 오늘로 복귀
    renderHome();
    renderProfile();
    renderCalendar();
    renderTimetable();
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
  // ── 하드웨어/브라우저 뒤로가기: 열린 오버레이부터 닫고, 그다음엔 한 번 더 눌러야 종료 ──
  let _exitArmed = false, _exitTimer = null;
  function backClosedOverlay() {
    const sb = document.getElementById("standby");
    if (sb && !sb.classList.contains("hidden")) { closeStandby(); return true; }
    const bd = document.getElementById("modalBackdrop");
    if (bd && !bd.classList.contains("hidden")) { closeModal(); return true; }
    const fm = document.getElementById("fabMenu");
    if (fm && fm.classList.contains("open")) { closeFab(); return true; }
    return false;
  }
  function setupBackGuard() {
    try { history.pushState({ msc: 1 }, ""); } catch (e) { return; }
    function onPop() {
      if (backClosedOverlay()) { history.pushState({ msc: 1 }, ""); return; }
      if (!_exitArmed) {
        _exitArmed = true;
        toast("뒤로가기를 한 번 더 누르면 종료돼요");
        history.pushState({ msc: 1 }, "");
        clearTimeout(_exitTimer);
        _exitTimer = setTimeout(() => { _exitArmed = false; }, 2000);
        return;
      }
      // 두 번째 뒤로가기 → 종료. 핸들러를 먼저 떼어 popstate 재진입(삼성 인터넷 '리디렉션 차단됨' 루프) 방지
      clearTimeout(_exitTimer);
      _exitArmed = false;
      window.removeEventListener("popstate", onPop);
      history.back();
    }
    window.addEventListener("popstate", onPop);
  }

  // ── 앱 아이콘 배지: 오늘 일정 수 ──
  function updateAppBadge() {
    if (!("setAppBadge" in navigator)) return;
    try {
      const tk = todayKey();
      const n = (byBias(S.schedules) || []).filter((s) => s.date === tk).length;
      if (n > 0) navigator.setAppBadge(n).catch(() => {});
      else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
    } catch (e) {}
  }

  // ── 앱 설치 (beforeinstallprompt) ──
  let _deferredPrompt = null;
  function _isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }
  function _isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function refreshInstallUI() {
    const row = document.getElementById("installRow");
    const grp = document.getElementById("installGroup");
    const show = !_isStandalone() && (!!_deferredPrompt || _isIOS());
    if (row) row.hidden = !show;
    if (grp) grp.hidden = !show;
  }
  function promptInstall() {
    if (_deferredPrompt) {
      _deferredPrompt.prompt();
      _deferredPrompt.userChoice.then((c) => { if (c && c.outcome === "accepted") toast("설치를 시작했어요!"); })
        .catch(() => {}).finally(() => { _deferredPrompt = null; refreshInstallUI(); });
      return;
    }
    if (_isIOS()) {
      openModalRaw("앱 설치하기", '<p style="font-size:13.5px;line-height:1.7;color:var(--text)">아이폰·아이패드는 사파리에서 이렇게 설치해요.</p><ol style="font-size:13.5px;line-height:1.95;color:var(--text);padding-left:20px;margin:10px 0 2px"><li>화면 아래 <b>공유 버튼</b>(□↑)을 눌러요</li><li>목록에서 <b>홈 화면에 추가</b>를 선택해요</li><li><b>추가</b>를 누르면 끝! 아이콘으로 앱처럼 열려요</li></ol>');
      return;
    }
    toast("브라우저 메뉴의 '홈 화면에 추가'로 설치할 수 있어요");
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); _deferredPrompt = e; refreshInstallUI(); });
  window.addEventListener("appinstalled", () => { _deferredPrompt = null; refreshInstallUI(); toast("앱이 설치됐어요!"); });

  // ── 다른 앱에서 공유받기 (share_target, GET) → 링크 보관함에 저장 ──
  function handleSharedTarget() {
    try {
      const q = new URLSearchParams(location.search);
      const raw = (q.get("url") || q.get("text") || "").trim();
      if (!raw) return false;
      const m = raw.match(/https?:\/\/[^\s]+/i);
      const url = m ? m[0] : raw;
      if (!/^https?:\/\//i.test(url)) return false;
      S.links = S.links || [];
      S.links.unshift({ id: uid(), biasId: S.currentBias, url: url, label: (q.get("title") || "").trim(), date: todayKey(), read: false });
      save();
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
      go("archive");
      toast("공유받은 링크를 보관함에 저장했어요");
      return true;
    } catch (e) { return false; }
  }

  function init() {
    load();
    applyTheme();
    // 온보딩 세로 중앙 정렬용: 인앱 브라우저 실제 보이는 높이를 px로 고정
    const setAppH = () => {
      const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
      document.documentElement.style.setProperty("--app-h", Math.round(h) + "px");
    };
    setAppH();
    window.addEventListener("resize", setAppH);
    window.addEventListener("orientationchange", setAppH);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setAppH);
      window.visualViewport.addEventListener("scroll", setAppH);
    }
    if (!S.onboarded || !S.biases.length) {
      initOnboarding();
    } else {
      $("app").classList.remove("hidden");
      renderAll();
      // 외부 페이지(공지·FAQ 등)에서 #해시로 돌아오면 그 화면을 복원, 없으면 기본(홈)
      var _vp = ["home", "profile", "calendar", "timetable", "binder", "ledger", "archive", "style", "settings", "more"];
      var _h = (location.hash || "").replace("#", "");
      if (handleSharedTarget()) { /* 다른 앱에서 공유받은 링크 저장됨 */ }
      else if (_h === "add") { go("calendar"); openModal("schedule"); }
      else if (_h && _vp.indexOf(_h) >= 0) go(_h);
      else {
        // 새로고침(reload)일 때만 마지막 페이지 복원. 앱을 껐다 켠 콜드 실행은 메인으로 시작.
        var _isReload = false;
        try { var _nav = performance.getEntriesByType("navigation")[0]; _isReload = !!_nav && _nav.type === "reload"; } catch (e) {}
        if (_isReload) {
          var _bp = "home";
          try { _bp = localStorage.getItem("msc_back_page") || "home"; } catch (e) {}
          if (_bp !== "home" && _vp.indexOf(_bp) >= 0) go(_bp);
        }
      }
    }
    hydrateImages(); // IndexedDB에 보관된 포카 사진을 메모리로 복원 후 다시 그림
    linkFieldLabels(document); // 정적 폼(온보딩·설정·아카이브 등) 라벨 연결
    { const _v = "v" + APP_VERSION + (APP_STAGE ? " " + APP_STAGE : ""); const _e = $("appVerMore"); if (_e) _e.textContent = _v; } // 더보기 버전 표시
    setupBackGuard(); // 하드웨어 뒤로가기 두 번 눌러 종료
    refreshInstallUI();
    updateAppBadge();
    $("importFile").addEventListener("change", (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });
    $("profPhotoInput").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      fileToData(f, 800, (data) => {
        const b = curBias();
        if (b) { b.photo = data; if (b.coverFit) delete b.coverFit.avatar; save(); renderAll(); toast("프로필 사진을 바꿨어요"); }
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
    const pav = $("profAvatar");
    if (pav) { pav.addEventListener("pointerdown", coverDragStart); pav.addEventListener("wheel", wheelZoom, { passive: false }); }
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
    document.addEventListener("click", handleCalToggle);
    // 스케줄러 영역 바깥(페이지 배경) 클릭 시 선택/색칠 취소
    document.addEventListener("click", (e) => {
      const ap = document.querySelector(".page.active");
      const onTt = ap && ap.id === "page-timetable";
      if ((ttGridSel || ttGridDraft) && !e.target.closest("#ttGrid")) {
        ttGridSel = null; ttGridDraft = null;
        if (onTt && ttView !== "circle") renderTTGrid(ttView === "fixed");
      }
      if ((ttSelStart != null || ttDraft) && !e.target.closest("#ttCircle")) {
        ttSelStart = null; ttDraft = null;
        if (onTt && ttView === "circle") renderTTCircle();
      }
    });

    // 모바일 전용 '더보기' 페이지를 보던 중 PC 폭으로 바뀌면 설정으로 이동 (빈 화면 방지).
    // 다시 모바일 폭으로 줄이면, 자동 전환된 경우에 한해 '더보기'로 되돌림.
    if (window.matchMedia) {
      const mqDesk = window.matchMedia("(min-width: 980px)");
      const onDesk = (e) => {
        const more = $("page-more"), settings = $("page-settings");
        if (e.matches) {
          if (more && more.classList.contains("active")) { go("settings"); _moreAutoSettings = true; }
        } else {
          if (_moreAutoSettings && settings && settings.classList.contains("active")) go("more");
          _moreAutoSettings = false;
        }
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

  /* ═══════════ 스케줄러 (주간 + 원형 24시 + 고정 시간표) ═══════════
     주차별로 따로 저장. 한 주의 월요일 날짜(YYYY-MM-DD)를 week 키로 사용.
     데이터: S.timetables = [{id, biasId, week, day(0=월..6=일), start, end(0~1440 분), title, color}] */
  let ttWeekStart = null;   // 그 주 월요일 Date
  let ttView = "fixed";     // "fixed"(시간표) | "week"(주간) | "circle"(원형)
  let ttDay = new Date().getDay();  // 원형 뷰에서 보는 요일 (절대요일 0=일..6=토)
  let ttSelStart = null;    // 원형 뷰: 첫 클릭으로 잡은 시작 시각(분), null이면 선택 없음
  let ttDraft = null;       // 원형 뷰: 시작~끝을 잡은 회색 임시 칸 {start, end}. 탭하면 입력 모달
  let ttGridSel = null;     // 그리드 뷰: 첫 클릭한 칸 {day, hour}
  let ttGridDraft = null;   // 그리드 뷰: 시작~끝 잡은 임시 구간 {day, s, e, fixed}. 탭하면 입력 모달
  const TT_DOW = ["일", "월", "화", "수", "목", "금", "토"]; // 절대요일 (0=일)
  // 뷰별 주 시작 설정에 맞춘 표시 순서 (절대요일). 주말 제외 시 토·일 제거
  const ttWeekOrder = (view) => {
    const ws = (view === "circle" ? S.weekStartCircle : S.weekStartWeek) === "mon" ? 1 : 0;
    const base = ws === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
    return ttHideWeekendFor(view) ? base.filter((d) => d !== 0 && d !== 6) : base;
  };
  const TT_COLORS = ["var(--accent)", "#f7a8c4", "#f6b9a8", "#fbd6a0", "#fdeaa8", "#bfe6c2", "#a8dadc", "#b8c8f0", "#cdbdf0", "#d9d9de"];
  // 밝은 파스텔엔 어두운 글자, 진한 색엔 흰 글자 (가독성)
  function ttTextOn(c) { if (!c || c[0] !== "#" || c.length < 7) return "#fff"; const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); return (0.299 * r + 0.587 * g + 0.114 * b) > 175 ? "#3a3a3a" : "#fff"; }

  const ttWeekStartOf = (d) => {
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    const ws = S.weekStartWeek === "mon" ? 1 : 0;
    x.setDate(x.getDate() - ((x.getDay() - ws + 7) % 7));
    return x;
  };
  const ttKeyOf = (d) => fmtDate(ttWeekStartOf(d));
  const ttKey = () => fmtDate(ttWeekStart);
  const ttHM = (m) => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
  function ttBlocks() {
    const k = ttKey(), bid = S.currentBias, lf = S.ttFixedLink !== false;
    return (S.timetables || []).filter((b) => (b.week === k || (lf && b.week === "*")) && (!b.biasId || b.biasId === bid));
  }
  // 원형 뷰 데이터: 연동 ON이면 주간과 공유, OFF면 원형 전용(week="circle")
  function ttCircleBlocks() {
    if (S.ttLink) return ttBlocks();
    const bid = S.currentBias;
    return (S.timetables || []).filter((b) => b.week === "circle" && (!b.biasId || b.biasId === bid));
  }

  // 주간/시간표 표에 보일 시간대 (S.ttRange, 기본 0~24)
  function ttRangeHours(fixed) { let r = fixed ? S.ttRangeFixed : (S.ttRangeWeek || S.ttRange); r = r || {}; return { s: Number.isInteger(r.s) ? r.s : 0, e: Number.isInteger(r.e) ? r.e : 24 }; }

  function renderTimetable() {
    if (!$("ttGrid")) return;
    if (!ttWeekStart) ttWeekStart = ttWeekStartOf(new Date());
    const end = new Date(ttWeekStart); end.setDate(end.getDate() + 6);
    const cur = ttKey() === ttKeyOf(new Date());
    const fixedV = ttView === "fixed";
    // 주 날짜 줄은 항상 같은 높이로 유지(흔들림 방지). 고정 뷰에선 라벨로 대체, 날짜 이동 숨김
    if (fixedV) $("ttTitle").textContent = "매주 반복";
    else $("ttTitle").innerHTML = `${ttWeekStart.getMonth() + 1}.${ttWeekStart.getDate()} – ${end.getMonth() + 1}.${end.getDate()}` + (cur ? ` <span class="tt-now">이번 주</span>` : "");
    const _isCircle = ttView === "circle", _todayDow = new Date().getDay();
    const _ttNow = $("ttNowBtn"); if (_ttNow) { _ttNow.textContent = _isCircle ? "오늘" : "이번 주"; _ttNow.classList.toggle("on", !fixedV && (_isCircle ? (cur && ttDay === _todayDow) : cur)); }
    const _rng = `${ttWeekStart.getMonth() + 1}.${ttWeekStart.getDate()} – ${end.getMonth() + 1}.${end.getDate()}`;
    const _t2 = $("ttTitle2"); if (_t2) _t2.textContent = _rng;
    const _n2 = $("ttNowBtn2"); if (_n2) { _n2.classList.toggle("on", cur && !fixedV); _n2.style.display = fixedV ? "none" : ""; }
    const _wn = $("stWeekNav"); if (_wn) _wn.style.display = fixedV ? "none" : "";
    $("ttTabs").innerHTML = [["fixed", "고정", I("bookmark")], ["week", "주간", I("grid")], ["circle", "하루", I("clock")]]
      .map(([k, n, ic]) => `<button class="${ttView === k ? "active" : ""}" data-ttv="${k}">${ic} ${n}</button>`).join("");
    $("ttTabs").querySelectorAll("[data-ttv]").forEach((b) => { b.onclick = () => ttSetView(b.dataset.ttv); });
    renderTTTools();
    if (ttView === "circle") { $("ttGrid").classList.add("hidden"); $("ttCircle").classList.remove("hidden"); renderTTCircle(); }
    else { $("ttGrid").classList.remove("hidden"); $("ttCircle").classList.add("hidden"); renderTTGrid(fixedV); }
    const wh = $("ttWeekHead");
    if (wh) { wh.classList.remove("hidden"); wh.classList.toggle("tt-fixed", fixedV); } // 줄은 유지, 고정 뷰는 날짜 이동만 숨김
  }

  function renderTTTools() {
    const t = $("ttTools"); if (!t) return;
    const fixed = ttView === "fixed";
    t.innerHTML =
      `<button class="btn btn-dark btn-sm" onclick="App.openTTBlock(${fixed ? "null, { fixed: true }" : ""})">+ 일정</button>`
      + `<button class="chip-btn" onclick="App.openTTOptions()" aria-label="스케줄러 옵션">${I("settings") || "⚙"} 옵션</button>`;
  }

  // 보조 옵션(주말 제외·주 시작·시간 범위·다른 주 복사)을 모은 메뉴
  function openTTOptions() {
    const fixed = ttView === "fixed";
    const { s: rs, e: re } = ttRangeHours(fixed);
    const wsRow = (id, val) => `<div class="tab-row" data-wsgrp="${id}" style="margin-bottom:0">
        <button class="tab ${val !== "mon" ? "active" : ""}" data-w="sun">일요일</button>
        <button class="tab ${val === "mon" ? "active" : ""}" data-w="mon">월요일</button></div>`;
    openModalRaw("스케줄러 옵션", `
      <div class="field row-field"><label>고정 ↔ 주간 연동 <small>(끄면 주간에 고정 일정 숨김)</small></label><button class="switch ${S.ttFixedLink !== false ? "on" : ""}" id="optFixedLink"><span class="knob"></span></button></div>
      <div class="field row-field"><label>주간 ↔ 하루 연동 <small>(끄면 하루는 별도 일정)</small></label><button class="switch ${S.ttLink ? "on" : ""}" id="optLink"><span class="knob"></span></button></div>
      <div class="field row-field"><label>주말 제외 <small>(${TTWK_LABEL[ttView]} 보기 · 월~금)</small></label><button class="switch ${ttHideWeekendFor(ttView) ? "on" : ""}" id="optWeekend"><span class="knob"></span></button></div>
      <div class="field"><label>주간 주 시작</label>${wsRow("week", S.weekStartWeek)}</div>
      <div class="field"><label>하루 주 시작</label>${wsRow("circle", S.weekStartCircle)}</div>
      ${(ttView === "week" || fixed) ? `<div class="field row-field"><label>시간 범위 <small>(표에 보일 시간대)</small></label><button class="btn btn-ghost btn-sm" id="optRange">${rs}–${re}시 변경</button></div>` : ""}
      ${!fixed ? `<button class="btn btn-ghost btn-lg" id="optCopy">다른 주 일정 복사</button>` : ""}
    `);
    $("optFixedLink").onclick = () => { toggleTtFixedLink(); openTTOptions(); };
    $("optLink").onclick = () => { toggleTtLink(); openTTOptions(); };
    $("optWeekend").onclick = () => { toggleTtWeekend(); openTTOptions(); };
    document.querySelectorAll('[data-wsgrp="week"] [data-w]').forEach((b) => { b.onclick = () => { setWeekStartWeek(b.dataset.w); openTTOptions(); }; });
    document.querySelectorAll('[data-wsgrp="circle"] [data-w]').forEach((b) => { b.onclick = () => { setWeekStartCircle(b.dataset.w); openTTOptions(); }; });
    if ($("optRange")) $("optRange").onclick = () => { closeModal(); openTTRange(fixed ? "fixed" : "week"); };
    if ($("optCopy")) $("optCopy").onclick = () => { closeModal(); openTTCopy(); };
  }

  // 하루 안에서 겹치는 일정을 나란히 배치하기 위한 레인 계산
  function ttLayout(arr) {
    const sorted = arr.map((b) => Object.assign({}, b)).sort((a, b) => a.start - b.start || a.end - b.end);
    const laneEnd = [];
    sorted.forEach((b) => {
      let i = 0; for (; i < laneEnd.length; i++) { if (laneEnd[i] <= b.start) break; }
      b._lane = i; laneEnd[i] = b.end;
    });
    const n = Math.max(laneEnd.length, 1);
    sorted.forEach((b) => { b._lanes = n; });
    return sorted;
  }

  // 자정을 넘는 일정(end<=start)은 표에선 자정 기준 두 조각으로 나눠 그림
  function ttExpandGrid(arr) {
    const out = [];
    arr.forEach((b) => {
      if (b.end <= b.start) { out.push(Object.assign({}, b, { end: 1440 })); if (b.end > 0) out.push(Object.assign({}, b, { start: 0 })); }
      else out.push(b);
    });
    return out;
  }
  function renderTTGrid(fixed) {
    const blocks = ttExpandGrid(fixed
      ? (S.timetables || []).filter((b) => b.week === "*" && (!b.biasId || b.biasId === S.currentBias))
      : ttBlocks());
    const rng = ttRangeHours(fixed);
    let minH = rng.s, maxH = rng.e;
    // 설정한 범위 밖에 일정이 있으면 가려지지 않도록 자동 확장
    blocks.forEach((b) => { minH = Math.min(minH, Math.floor(b.start / 60)); maxH = Math.max(maxH, Math.ceil(b.end / 60)); });
    if (maxH < minH + 1) maxH = minH + 1;
    const hh = 42;
    const order = ttWeekOrder(fixed ? "fixed" : "week");
    const todayAbs = new Date().getDay();
    const showToday = (!fixed && ttKey() === ttKeyOf(new Date()));
    let heads = `<div class="tt-corner"></div>`;
    order.forEach((dayAbs, p) => {
      const d = new Date(ttWeekStart); d.setDate(d.getDate() + p);
      const wk = dayAbs === 6 ? "sat" : dayAbs === 0 ? "sun" : "";
      const isToday = showToday && dayAbs === todayAbs;
      heads += fixed
        ? `<div class="tt-dhead ${wk}"><b>${TT_DOW[dayAbs]}</b></div>`
        : `<div class="tt-dhead ${wk} ${isToday ? "today" : ""}"><b>${TT_DOW[dayAbs]}</b><span>${d.getDate()}</span></div>`;
    });
    let axis = `<div class="tt-axis">`;
    for (let h = minH; h < maxH; h++) axis += `<div class="tt-hr" style="height:${hh}px"><span>${h}</span></div>`;
    axis += `</div>`;
    let cols = "";
    order.forEach((dayAbs) => {
      const isToday = showToday && dayAbs === todayAbs;
      let slots = "";
      for (let h = minH; h < maxH; h++) {
        const selCls = (ttGridSel && ttGridSel.day === dayAbs && ttGridSel.hour === h) ? " sel" : "";
        slots += `<div class="tt-slot${selCls}" data-day="${dayAbs}" data-hour="${h}" style="height:${hh}px"></div>`;
      }
      let bl = "";
      // 시작~끝 선택 구간(임시 칸) — 탭하면 일정 등록
      if (ttGridDraft && !!ttGridDraft.fixed === !!fixed && ttGridDraft.day === dayAbs) {
        const dtop = (ttGridDraft.s - minH * 60) / 60 * hh;
        const dht = Math.max((ttGridDraft.e - ttGridDraft.s) / 60 * hh, 18);
        bl += `<button class="tt-draft" data-draft="1" style="top:${dtop}px;height:${dht - 2}px"><b>+ 일정 등록</b><i>${ttHM(ttGridDraft.s)}~${ttHM(ttGridDraft.e)}</i></button>`;
      }
      ttLayout(blocks.filter((b) => b.day === dayAbs)).forEach((b) => {
        const top = (b.start - minH * 60) / 60 * hh;
        const ht = Math.max((b.end - b.start) / 60 * hh, 17);
        const w = 100 / b._lanes, left = b._lane * w;
        bl += `<button class="tt-block" data-id="${b.id}" style="top:${top}px;height:${ht - 2}px;left:calc(${left}% + 1px);width:calc(${w}% - 2px);background:${b.color};color:${ttTextOn(b.color)}"><b>${esc(b.title)}</b><i>${ttHM(b.start)}~${ttHM(b.end)}</i></button>`;
      });
      cols += `<div class="tt-col ${isToday ? "today" : ""}">${slots}${bl}</div>`;
    });
    const gcols = `grid-template-columns:34px repeat(${order.length},1fr)`;
    $("ttGrid").innerHTML = `<div class="tt-head" style="${gcols}">${heads}</div><div class="tt-body" style="${gcols}">${axis}${cols}</div>`;
    // 클릭 위임: 색칠 구간=등록, 일정=수정, 빈 칸=시작/끝 선택, 그 외 배경=선택 취소
    $("ttGrid").onclick = (e) => {
      e.stopPropagation(); // 그리드 안 클릭은 '바깥 취소' 핸들러로 전파 금지 (재렌더 후 오취소 방지)
      const draftEl = e.target.closest(".tt-draft");
      if (draftEl) {
        if (ttGridDraft) openTTBlock(null, { day: ttGridDraft.day, start: ttGridDraft.s, end: ttGridDraft.e, fixed: !!ttGridDraft.fixed });
        return;
      }
      const blockEl = e.target.closest(".tt-block");
      if (blockEl) { openTTBlock(blockEl.dataset.id, fixed ? { fixed: true } : undefined); return; }
      const slot = e.target.closest(".tt-slot");
      if (slot) {
        const d = +slot.dataset.day, h = +slot.dataset.hour;
        if (!ttGridSel || ttGridSel.day !== d) {
          ttGridSel = { day: d, hour: h }; ttGridDraft = null; // 시작 칸 선택
        } else {
          const a = Math.min(ttGridSel.hour, h), b = Math.max(ttGridSel.hour, h);
          ttGridDraft = { day: d, s: a * 60, e: Math.min((b + 1) * 60, 1440), fixed: !!fixed }; // 끝 칸 → 구간 색칠
          ttGridSel = null;
        }
        renderTTGrid(fixed);
        return;
      }
      // 배경(축·헤더·여백) 클릭 → 선택/색칠 취소
      if (ttGridSel || ttGridDraft) { ttGridSel = null; ttGridDraft = null; renderTTGrid(fixed); }
    };
    if (!blocks.length) $("ttGrid").insertAdjacentHTML("beforeend", fixed
      ? `<p class="tt-empty">시작 칸과 끝 칸을 차례로 탭하면 그 구간이 색칠돼요. 색칠된 칸을 누르면 매주 반복되는 고정 일정이 등록돼요.</p>`
      : `<p class="tt-empty">시작 칸과 끝 칸을 차례로 탭하면 그 구간이 색칠돼요. 색칠된 칸을 누르면 일정이 등록돼요.</p>`);
  }

  const ttPolar = (cx, cy, r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  function ttArc(cx, cy, rO, rI, a0, a1) {
    if (a1 - a0 >= 359.999) a1 = a0 + 359.999;
    const large = (a1 - a0) > 180 ? 1 : 0;
    const o0 = ttPolar(cx, cy, rO, a0), o1 = ttPolar(cx, cy, rO, a1), i1 = ttPolar(cx, cy, rI, a1), i0 = ttPolar(cx, cy, rI, a0);
    const f = (n) => n.toFixed(1);
    return `M${f(o0[0])} ${f(o0[1])} A${rO} ${rO} 0 ${large} 1 ${f(o1[0])} ${f(o1[1])} L${f(i1[0])} ${f(i1[1])} A${rI} ${rI} 0 ${large} 0 ${f(i0[0])} ${f(i0[1])} Z`;
  }

  function renderTTCircle() {
    const order = ttWeekOrder("circle");
    if (!order.includes(ttDay)) ttDay = order[0]; // 주말 제외 시 주말 요일이 선택돼 있으면 보정
    const all = ttCircleBlocks();
    const day = all.filter((b) => b.day === ttDay).sort((a, b) => a.start - b.start);
    let chips = `<div class="tt-daychips">`;
    order.forEach((dayAbs) => { chips += `<button class="${dayAbs === ttDay ? "on" : ""} ${dayAbs === 6 ? "sat" : dayAbs === 0 ? "sun" : ""}" data-d="${dayAbs}">${TT_DOW[dayAbs]}</button>`; });
    chips += `</div>`;
    const cx = 130, cy = 130, rO = 112;
    const full = S.ttCircleStyle !== "donut";
    const rI = full ? 2 : 66;
    let ticks = "", arcs = "", labels = "";
    for (let h = 0; h < 24; h++) {
      const a = h / 24 * 360;
      const p1 = ttPolar(cx, cy, rO, a), p2 = ttPolar(cx, cy, h % 6 === 0 ? rO - 13 : rO - 6, a);
      ticks += `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" class="tt-tick ${h % 6 === 0 ? "major" : ""}"/>`;
      if (h % 3 === 0) { const tp = ttPolar(cx, cy, rO + 13, a); labels += `<text x="${tp[0].toFixed(1)}" y="${tp[1].toFixed(1)}" class="tt-hrnum">${h}</text>`; }
    }
    day.forEach((b) => {
      const a0 = b.start / 1440 * 360; let a1 = b.end / 1440 * 360; if (a1 <= a0) a1 += 360;
      arcs += `<path d="${ttArc(cx, cy, rO, rI, a0, a1)}" style="fill:${b.color}" class="tt-arc" data-id="${b.id}"/>`;
      if (a1 - a0 >= 18) { const mid = (a0 + a1) / 2, lp = ttPolar(cx, cy, (rO + rI) / 2, mid); labels += `<text x="${lp[0].toFixed(1)}" y="${lp[1].toFixed(1)}" class="tt-arclabel" style="fill:${ttTextOn(b.color)}">${esc(b.title.slice(0, 5))}</text>`; }
    });
    const totMin = day.reduce((s, b) => s + (b.end > b.start ? b.end - b.start : 1440 - b.start + b.end), 0);
    let sel = "";
    if (ttSelStart != null) {
      const aS = ttSelStart / 1440 * 360, lp1 = ttPolar(cx, cy, 24, aS), lp2 = ttPolar(cx, cy, rO, aS);
      sel = `<line x1="${lp1[0].toFixed(1)}" y1="${lp1[1].toFixed(1)}" x2="${lp2[0].toFixed(1)}" y2="${lp2[1].toFixed(1)}" class="tt-selline"/><circle cx="${lp2[0].toFixed(1)}" cy="${lp2[1].toFixed(1)}" r="4.5" class="tt-seldot"/>`;
    }
    let draftSvg = "";
    if (ttDraft) { const da0 = ttDraft.start / 1440 * 360; let da1 = ttDraft.end / 1440 * 360; if (da1 <= da0) da1 += 360; draftSvg = `<path d="${ttArc(cx, cy, rO, rI, da0, da1)}" class="tt-draft"/>`; }
    const centerTxt = ttSelStart != null ? `시작 ${ttHM(ttSelStart)} · 끝 지점 클릭`
      : (ttDraft ? `${ttHM(ttDraft.start)}~${ttHM(ttDraft.end)} · 탭하여 입력` : "");
    const center = centerTxt ? `<text x="${cx}" y="${cy + 4}" class="tt-ctot sel">${centerTxt}</text>` : "";
    const hole = full ? "" : `<circle cx="${cx}" cy="${cy}" r="${rI}" class="tt-hole"/>`;
    const svg = `<svg viewBox="0 0 260 260" class="tt-clock" role="img" aria-label="${TT_DOW[ttDay]}요일 24시간 시간표">`
      + `<circle cx="${cx}" cy="${cy}" r="${rO}" class="tt-face"/>${arcs}${draftSvg}${hole}${ticks}${sel}${labels}${center}</svg>`;
    const hrStr = (totMin / 60).toFixed(totMin % 60 ? 1 : 0);
    const cap = `<div class="tt-cap">${hrStr}시간</div>`;
    const cstyle = `<div class="tt-cstyle" id="ttCStyle"><button type="button" class="${full ? "on" : ""}" data-cs="full">기본형</button><button type="button" class="${!full ? "on" : ""}" data-cs="donut">도넛형</button></div>`;
    let leg = `<ul class="tt-legend">`;
    if (!day.length) leg += `<li class="tt-empty2">이 요일엔 아직 일정이 없어요.</li>`;
    day.forEach((b) => { leg += `<li data-id="${b.id}"><span class="tt-dot" style="background:${b.color}"></span><b>${ttHM(b.start)}~${ttHM(b.end)}</b> ${esc(b.title)}</li>`; });
    leg += `</ul>`;
    $("ttCircle").innerHTML = chips + cstyle + cap + `<div class="tt-clockwrap">${svg}</div>` + leg;
    // 클릭 위임: 요일칩·스타일·범례·드래프트·시계 / 그 외 배경=선택 취소
    $("ttCircle").onclick = (e) => {
      e.stopPropagation(); // 바깥 취소 핸들러로 전파 금지 (재렌더 후 오취소 방지)
      const chip = e.target.closest(".tt-daychips button");
      if (chip) { ttSetDay(+chip.dataset.d); return; }
      const cs = e.target.closest(".tt-cstyle button");
      if (cs) { ttSetCircleStyle(cs.dataset.cs); return; }
      const leg = e.target.closest(".tt-legend li[data-id]");
      if (leg) { openTTBlock(leg.dataset.id); return; }
      const draftPath = e.target.closest(".tt-draft");
      if (draftPath) { ttOpenDraft(); return; }
      const svgHit = e.target.closest("svg.tt-clock");
      if (svgHit) { ttCircleClick(svgHit, e); return; }
      if (ttSelStart != null || ttDraft) { ttSelStart = null; ttDraft = null; renderTTCircle(); } // 배경 → 취소
    };
  }

  // 원형 뷰에서 클릭한 화면 좌표 → 시각(분, 30분 단위 스냅). 첫 클릭=시작, 두 번째 클릭=끝(→입력), 같은 지점=해제
  function ttCircleClick(svgEl, e) {
    const r = svgEl.getBoundingClientRect();
    if (!r.width) return;
    const x = (e.clientX - r.left) / r.width * 260, y = (e.clientY - r.top) / r.height * 260;
    const dx = x - 130, dy = y - 130;
    if (Math.hypot(dx, dy) < 26) return; // 한가운데(글자 영역) 클릭은 무시
    let deg = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    let min = Math.round(deg / 360 * 1440 / 30) * 30;
    if (min >= 1440) min -= 1440;
    if (ttDraft) {
      // 회색 임시 칸이 있으면: 그 범위 안을 누르면 입력, 밖을 누르면 새로 시작
      const _in = ttDraft.end <= ttDraft.start ? (min >= ttDraft.start || min <= ttDraft.end) : (min >= ttDraft.start && min <= ttDraft.end);
      if (_in) { ttOpenDraft(); return; }
      ttDraft = null; ttSelStart = min; renderTTCircle(); return;
    }
    if (ttSelStart == null) { ttSelStart = min; renderTTCircle(); return; }
    if (min === ttSelStart) { ttSelStart = null; renderTTCircle(); return; }
    // 두 점 사이 '짧은 쪽' 호 선택 (자정을 넘으면 end<start로 저장 → 다음 날 새벽까지)
    const _cw = (min - ttSelStart + 1440) % 1440; // 시작→끝 시계방향 거리
    ttDraft = _cw <= 720 ? { start: ttSelStart, end: min } : { start: min, end: ttSelStart };
    ttSelStart = null;
    renderTTCircle();
  }

  function ttOpenDraft() {
    if (!ttDraft) return;
    openTTBlock(null, { day: ttDay, start: ttDraft.start, end: ttDraft.end });
  }

  function ttSetView(v) { ttView = v; ttSelStart = null; ttDraft = null; ttGridSel = null; ttGridDraft = null; renderTimetable(); }
  function ttSetDay(d) { ttDay = d; ttSelStart = null; ttDraft = null; renderTTCircle(); }
  function ttSetCircleStyle(v) { S.ttCircleStyle = v === "full" ? "full" : "donut"; ttSelStart = null; ttDraft = null; save(); renderTTCircle(); }
  function ttMove(dir) { const d = new Date(ttWeekStart); d.setDate(d.getDate() + dir * 7); ttWeekStart = ttWeekStartOf(d); ttSelStart = null; ttDraft = null; ttGridSel = null; ttGridDraft = null; renderTimetable(); }
  function ttThisWeek() { ttWeekStart = ttWeekStartOf(new Date()); if (ttView === "circle") ttDay = new Date().getDay(); ttSelStart = null; ttDraft = null; ttGridSel = null; ttGridDraft = null; renderTimetable(); }
  function openTTRange(mode) {
    const fixed = mode === "fixed", key = fixed ? "ttRangeFixed" : "ttRangeWeek", label = fixed ? "시간표" : "주간";
    const { s: curS, e: curE } = ttRangeHours(fixed);
    const opt = (max, sel) => { let o = ""; for (let hh = 0; hh <= max; hh++) o += `<option value="${hh}"${hh === sel ? " selected" : ""}>${hh}시</option>`; return o; };
    openModalRaw(`${label} 시간 범위`, `
      <p class="hint" style="margin:0 0 12px">${label} 표에 보일 시간대를 정해요 (24시간 기준). 이 범위 밖에 일정이 있으면 자동으로 늘어나요.</p>
      <div class="tt-timerow">
        <div class="field"><label>시작</label><select id="ttRS" class="tt-time">${opt(23, curS)}</select></div>
        <div class="field"><label>끝</label><select id="ttRE" class="tt-time">${opt(24, curE)}</select></div>
      </div>
      <button class="btn btn-primary btn-lg" id="ttRSave">적용</button>
      <button class="btn btn-ghost btn-lg slim" id="ttRReset">0–24시 전체로</button>
    `);
    $("ttRSave").onclick = () => {
      const sv = +$("ttRS").value, ev = +$("ttRE").value;
      if (ev <= sv) { toast("끝 시간이 시작보다 늦어야 해요"); return; }
      S[key] = { s: sv, e: ev }; save(); closeModal(); renderTimetable(); toast(`${label} 시간 범위를 바꿨어요`);
    };
    $("ttRReset").onclick = () => { S[key] = { s: 0, e: 24 }; save(); closeModal(); renderTimetable(); };
  }

  function openTTCopy() {
    if (!ttWeekStart) ttWeekStart = ttWeekStartOf(new Date());
    const prev = new Date(ttWeekStart); prev.setDate(prev.getDate() - 7);
    openModalRaw("다른 주 일정 복사", `
      <p class="hint" style="margin:0 0 12px">고른 날짜가 속한 주의 일정을 이번 주(${ttWeekStart.getMonth() + 1}.${ttWeekStart.getDate()} 주)로 가져와요.</p>
      <div class="field"><label>가져올 주의 날짜</label><input type="date" id="ttCopyDate" value="${fmtDate(prev)}"></div>
      <button class="btn btn-primary btn-lg" id="ttCopyGo">이 주 일정 가져오기</button>
    `);
    $("ttCopyGo").onclick = () => {
      const v = $("ttCopyDate").value;
      if (!v) { toast("날짜를 골라주세요"); return; }
      const src = ttWeekStartOf(new Date(v + "T00:00:00")), srcKey = fmtDate(src), bid = S.currentBias;
      if (srcKey === ttKey()) { toast("이번 주와 같은 주예요"); return; }
      const list = (S.timetables || []).filter((b) => b.week === srcKey && (!b.biasId || b.biasId === bid));
      if (!list.length) { toast("그 주엔 저장된 일정이 없어요"); return; }
      const k = ttKey();
      list.forEach((b) => S.timetables.push({ id: uid(), biasId: bid, week: k, day: b.day, start: b.start, end: b.end, title: b.title, color: b.color }));
      save(); closeModal(); renderTimetable(); toast(`${src.getMonth() + 1}.${src.getDate()} 주 일정을 가져왔어요`);
    };
  }

  function ttTimeSelect(id, val) {
    let o = "";
    for (let t = 0; t <= 1440; t += 15) o += `<option value="${t}"${t === val ? " selected" : ""}>${ttHM(t)}</option>`;
    return `<select id="${id}" class="tt-time">${o}</select>`;
  }

  function openTTBlock(editId, prefill) {
    if (!ttWeekStart) ttWeekStart = ttWeekStartOf(new Date());
    ttGridSel = null; ttGridDraft = null; // 그리드 임시 선택 정리
    const edit = editId ? (S.timetables || []).find((b) => b.id === editId) : null;
    prefill = prefill || {};
    const fixed = prefill.fixed === true;
    const circleNew = !edit && ttView === "circle" && !S.ttLink; // 연동 OFF 원형: 별도 데이터(week="circle")
    const noRepeat = fixed || circleNew || (edit && edit.week === "circle"); // 반복 토글 숨김
    let day = edit ? edit.day : (prefill.day != null ? prefill.day : (ttView === "circle" ? ttDay : new Date().getDay()));
    if (!edit) { const _ord = ttWeekOrder(ttView); if (!_ord.includes(day)) day = _ord[0]; } // 주말 제외 시 기본 요일 보정
    const start = prefill.start != null ? prefill.start : (edit ? edit.start : 9 * 60);
    const end = prefill.end != null ? prefill.end : (edit ? edit.end : Math.min(start + 60, 1440));
    let selDays = new Set(prefill.days && prefill.days.length ? prefill.days : [day]);
    let selColor = prefill.color != null ? prefill.color : (edit ? edit.color : TT_COLORS[0]);
    const isRep = edit ? edit.week === "*" : false;
    let selRep = fixed ? true : (prefill.rep != null ? prefill.rep : isRep);
    const ttTitle = prefill.title != null ? prefill.title : (edit ? edit.title : "");
    openModalRaw(edit ? "일정 수정" : "일정 추가", `
      <div class="field"><label>제목 *</label><input type="text" id="ttT" value="${esc(ttTitle)}" placeholder="" maxlength="40"></div>
      <div class="field"><label>이모지 <small>(눌러서 제목에 붙이기)</small></label><div class="tt-emojipick" id="ttEmo">${["📌","⭐","💜","🎵","🎤","🎂","✈️","📺","🎧","🛍️"].map((e) => `<button type="button" data-e="${e}">${e}</button>`).join("")}</div></div>
      <div class="field"><label>요일 <small>(여러 요일 선택 가능)</small></label><div class="tt-dowpick" id="ttDowPick">${ttWeekOrder(ttView).map((dayAbs) => `<button type="button" class="${selDays.has(dayAbs) ? "on" : ""} ${dayAbs === 6 ? "sat" : dayAbs === 0 ? "sun" : ""}" data-d="${dayAbs}">${TT_DOW[dayAbs]}</button>`).join("")}</div></div>
      <div class="tt-timerow">
        <div class="field"><label>시작</label>${ttTimeSelect("ttS", start)}</div>
        <div class="field"><label>종료</label>${ttTimeSelect("ttE", end)}</div>
      </div>
      <p class="hint tt-ovn ${end < start ? "" : "hidden"}" id="ttOvn">🌙 자정을 넘어 다음 날 새벽까지 이어지는 일정이에요</p>
      ${noRepeat ? "" : `<div class="field"><label>반복</label><div class="tt-reppick" id="ttRep"><button type="button" class="${!selRep ? "on" : ""}" data-r="0">이번 주만</button><button type="button" class="${selRep ? "on" : ""}" data-r="1">매주 반복</button></div></div>`}
      <div class="field"><label>색상</label><div class="tt-colorpick" id="ttC">${TT_COLORS.map((c) => `<button type="button" class="${c === selColor ? "on" : ""}" data-c="${c}" style="background:${c}" aria-label="색상"></button>`).join("")}<button type="button" class="color-pick-btn tt-custom-btn ${selColor && !TT_COLORS.includes(selColor) ? "on" : ""}" id="ttCCustomBtn"><i id="ttCCustomChip" style="background:${selColor && selColor[0] === "#" ? selColor : "var(--accent)"}"></i><span>직접</span></button></div></div>
      <button class="btn btn-primary btn-lg" id="ttSave">${edit ? "수정 완료" : "추가"}</button>
      ${edit ? `<button class="btn btn-danger btn-lg" id="ttDel">이 일정 삭제</button>` : ""}
    `);
    $("ttDowPick").querySelectorAll("button").forEach((b) => { b.onclick = () => { const d = +b.dataset.d; if (selDays.has(d)) { if (selDays.size > 1) selDays.delete(d); } else selDays.add(d); b.classList.toggle("on", selDays.has(d)); }; });
    $("ttEmo").querySelectorAll("button").forEach((b) => { b.onclick = () => { const inp = $("ttT"), em = b.dataset.e; const st = inp.selectionStart != null ? inp.selectionStart : inp.value.length, en = inp.selectionEnd != null ? inp.selectionEnd : inp.value.length; inp.value = (inp.value.slice(0, st) + em + inp.value.slice(en)).slice(0, 40); const pos = Math.min(st + em.length, inp.value.length); inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (_) {} }; });
    $("ttC").querySelectorAll("button").forEach((b) => { b.onclick = () => { selColor = b.dataset.c; $("ttC").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }; });
    if ($("ttCCustomBtn")) $("ttCCustomBtn").onclick = () => {
      const snap = { title: $("ttT").value, days: [...selDays], start: +$("ttS").value, end: +$("ttE").value, rep: selRep, fixed: !!fixed, color: selColor };
      const reopen = (color) => openTTBlock(editId, { ...snap, color });
      const initial = (selColor && /^#[0-9a-fA-F]{6}$/.test(selColor)) ? selColor : "#F7A8C4";
      openColorPicker({ initial, onDone: reopen, onCancel: () => reopen(selColor) });
    };
    if ($("ttRep")) $("ttRep").querySelectorAll("button").forEach((b) => { b.onclick = () => { selRep = b.dataset.r === "1"; $("ttRep").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }; });
    const ttUpdOvn = () => { const o = $("ttOvn"); if (o) o.classList.toggle("hidden", !(+$("ttE").value < +$("ttS").value)); };
    if ($("ttS")) $("ttS").onchange = ttUpdOvn;
    if ($("ttE")) $("ttE").onchange = ttUpdOvn;
    $("ttSave").onclick = () => {
      const title = $("ttT").value.trim();
      if (!title) { toast("제목을 입력해 주세요"); $("ttT").focus(); return; }
      const s = +$("ttS").value, e = +$("ttE").value;
      if (e === s) { toast("시작과 종료 시간이 같아요"); return; }
      let wk;
      if (edit) wk = (edit.week === "circle" || fixed) ? edit.week : (selRep ? "*" : ttKey());
      else wk = fixed ? "*" : circleNew ? "circle" : (selRep ? "*" : ttKey());
      const days = [...selDays].sort((a, b) => a - b);
      if (edit) {
        edit.title = title; edit.day = days[0]; edit.start = s; edit.end = e; edit.color = selColor; edit.week = wk;
        for (let i = 1; i < days.length; i++) S.timetables.push({ id: uid(), biasId: S.currentBias, week: wk, day: days[i], start: s, end: e, title, color: selColor });
      } else {
        days.forEach((d) => S.timetables.push({ id: uid(), biasId: S.currentBias, week: wk, day: d, start: s, end: e, title, color: selColor }));
      }
      if (ttView === "circle") ttDay = days[0];
      ttDraft = null; ttSelStart = null;
      save(); closeModal(); renderTimetable();
      toast(edit ? "일정을 수정했어요" : "일정을 추가했어요");
    };
    if (edit) $("ttDel").onclick = () => {
      if (!confirm("이 일정을 삭제할까요?")) return;
      S.timetables = S.timetables.filter((x) => x.id !== edit.id);
      save(); closeModal(); renderTimetable(); toast("일정을 삭제했어요");
    };
  }

  window.App = {
    obNext, obPrev, obFinish, obSkip, extractFromPhoto, openColorFromPhoto,
    go, toggleFab, toggleDark, toggleRetro, setRetroSkin, setRetroPos, setBg, setAlign, setWeekStart, toggleCalWeekStart, setWeekStartWeek, setWeekStartCircle, toggleTtLink, toggleTtFixedLink, toggleTtWeekend, toggleTtWeekendView, setPatStyle, openFramePicker, openColorPicker, openBudget, openYearReview, toggleNotifyTicket, toggleHaptics, setVeil, setFont, setPreset, retroMin, retroMax, toggleDeco, toggleCoverPos, cardGo, coverDragStart, editCurrentBias, setTemplate, resetPresets, setMode,
    calMove, calToday, calJump, openStickerPicker, shareDay,
    ttMove, ttThisWeek, ttSetView, ttSetDay, ttSetCircleStyle, openTTRange, openTTCopy, openTTBlock, openTTOptions,
    binderTab, ledgerMove, ledgerToday, archiveTab, styleTab,
    addLink, openModal, closeModal, backdropClose,
    exportData, resetAll,
    openStandby, closeStandby,
    toggleEditHome,
    homeOpenCalendar, homeBackToToday,
    promptInstall, openAvatarViewer, openProfileShare, openFunFactsSettings,
  };

  document.addEventListener("DOMContentLoaded", init);
})();

