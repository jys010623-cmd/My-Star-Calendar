/* ═══════════════════════════════════════════
   마이 스타 캘린더 (My Star Calendar) — app.js
   모든 데이터는 localStorage에 저장됩니다.
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const LS_KEY = "myStarCalendar.v1";

  /* ── 카테고리 정의 ── */
  const CATS = {
    comeback:  { name: "컴백",       v: "--c-comeback" },
    concert:   { name: "콘서트",     v: "--c-concert" },
    ticket:    { name: "티켓팅",     v: "--c-ticket" },
    birthday:  { name: "생일·생카",  v: "--c-birthday" },
    broadcast: { name: "방송·버블",  v: "--c-broadcast" },
    release:   { name: "발매·굿즈",  v: "--c-release" },
    personal:  { name: "개인",       v: "--c-personal" },
  };
  const EXP_CATS = ["앨범", "굿즈·MD", "콘서트·티켓", "생카·이벤트", "교통·숙박", "구독·멤버십", "기타"];
  const EXP_COLORS = ["#ff7aa2", "#7a86ff", "#ff5c5c", "#ffb13d", "#3dbdff", "#2ecc9a", "#9b9b9b"];
  const STICKERS = ["🎂","🎤","🎟️","💚","💜","💙","🩷","⭐","✨","🐰","🐻","🦁","📸","🎧","✈️","🍰","🔥","🏟️"];
  const SWATCHES = [
    ["블랙 (기본)", "#141414"], ["그레이", "#8E9199"], ["모카", "#A07855"],
    ["라임", "#B7D532"], ["그린", "#7AD692"], ["민트", "#5CD6C0"], ["틸", "#1F8A8A"],
    ["스카이", "#5BB8FF"], ["블루", "#3D6BFF"], ["네이비", "#28386B"],
    ["라벤더", "#B8A4E3"], ["바이올렛", "#8A6BFF"], ["퍼플", "#B14EE0"],
    ["인디 핑크", "#D9849B"], ["핑크", "#FF7AA2"], ["로즈", "#FF4D79"],
    ["레드", "#F0383F"], ["와인", "#9B2242"], ["피치", "#FFA98A"], ["옐로", "#FFD84D"],
  ];
  const ST_CATS = ["의류", "신발", "액세서리", "모자", "가방", "음식·카페", "기타"];
  const ARCH_TYPES = ["생카", "콘서트", "팝업", "전시", "팬싸", "기타"];
  const ARCH_TYPES_ON = ["영통 팬싸", "온라인 콘서트", "라이브 방송", "스트리밍 파티", "기타"];
  const archTypes = (m) => (m === "online" ? ARCH_TYPES_ON : ARCH_TYPES);
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
  const BGS = [["none", "기본"], ["dot", "땡땡이"], ["star", "별"], ["stripe", "사선"], ["zigzag", "지그재그"], ["grid", "격자"], ["check", "체크"]];
  const ALIGNS = [["left", "왼쪽"], ["center", "가운데"]];
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
  let activeCats = new Set(Object.keys(CATS));
  let clockTimer = null;

  /* ── 유틸 ── */
  const $ = (id) => document.getElementById(id);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => fmtDate(new Date());
  const won = (n) => "₩" + Number(n || 0).toLocaleString("ko-KR");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
    tag: '<path d="M3.5 11.6V6A2.5 2.5 0 0 1 6 3.5h5.6a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1-.6-1.4Z"/><circle cx="8.2" cy="8.2" r="1.3"/>',
  };
  const I = (n, cls) => `<svg class="li${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function defaults() {
    return {
      onboarded: false, dark: false, retro: false, retroSkin: "browser", retroPos: "float", bg: "none", align: "left", widgets: {}, budget: 0, notifyTicket: false, mode: "", template: "profile", archView: "card", accent: "#141414",
      biases: [], currentBias: null,
      schedules: [], stickers: {}, photocards: [],
      expenses: [], archives: [], links: [], styles: [],
      membership: { title: "MY STAR PASS", name: "", icon: "✦", no: "0001" },
    };
  }

  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(S));
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
    // 구버전 라벨(이모지 접두) → 텍스트 라벨 마이그레이션
    const deEmo = (v) => typeof v === "string" ? v.replace(/^[^\uAC00-\uD7A3A-Za-z0-9]+\s*/, "") : v;
    (S.archives || []).forEach((d) => {
      if (d.etype) d.etype = deEmo(d.etype);
      if (d.img && !d.imgs) { d.imgs = [d.img]; delete d.img; }
    });
    (S.styles || []).forEach((st) => { if (st.category) st.category = deEmo(st.category); });
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
    root.setAttribute("data-hasbg", !NO_BG_MODES.includes(S.mode) ? "true" : "false");
    root.setAttribute("data-align", S.align || "left");
    root.setAttribute("data-template", S.template || "profile");
    root.setAttribute("data-mode", S.mode || "none");
    if (!S.retro) { root.removeAttribute("data-retro-min"); root.removeAttribute("data-retro-max"); }
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
      if (!$("obStart").value) return toast("덕질 시작일을 골라주세요!");
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
      startDate: $("obStart").value,
      birthday: $("obBirthday").value || null,
      debutDate: $("obDebut").value || null,
    };
    S.biases.push(bias);
    S.currentBias = bias.id;
    S.accent = obColor;
    S.template = obTpl;
    S.membership.name = bias.name.toUpperCase() + "'S FAN";
    S.onboarded = true;
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
    S.onboarded = true;
    save();
    $("onboarding").classList.add("hidden");
    $("app").classList.remove("hidden");
    applyTheme();
    renderAll();
    toast("환영해요! 설정 → 최애 관리에서 언제든 등록할 수 있어요");
  }

  function initOnboarding() {
    $("onboarding").classList.remove("hidden");
    $("obStart").value = todayKey();
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
    // 사진
    $("obPhotoBox").onclick = () => $("obPhotoInput").click();
    $("obPhotoInput").onchange = (e) => {
      const f = e.target.files[0];
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
  }

  function toggleFab() {
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
    const grid = WIDGETS.filter(([id]) => wOn(id)).map(([id, name, page]) => `
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
      ${widgetEdit && hidden.length ? `<div class="wb-add">${hidden.map(([id, name]) =>
        `<button class="chip-btn" data-wadd="${id}">+ ${name}</button>`).join("")}</div>` : ""}`;
    $("wbEdit").onclick = () => { widgetEdit = !widgetEdit; renderMiniWidget(); };
    el.querySelectorAll(".wtile").forEach((tl) => {
      tl.onclick = () => {
        if (widgetEdit) {
          S.widgets[tl.dataset.wid] = false;
          save(); renderMiniWidget();
        } else {
          retroMin(); go(tl.dataset.wgo);
        }
      };
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

    // 멤버십 카드
    renderMemberCard();
    // 티켓팅
    tickClock();
  }

  function isAnnivToday(dateStr) {
    const d = new Date(dateStr), n = new Date();
    return d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  function renderMemberCard() {
    const m = S.membership;
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

  function renderDeco() {
    const layer = $("heroDeco");
    if (!layer) return;
    const b = curBias();
    const deco = (b && b.deco) || [];
    layer.innerHTML = deco.map((d, i) =>
      `<span class="hero-sticker" data-i="${i}" style="left:${d.x}%;top:${d.y}%">${d.s}</span>`).join("");
    layer.querySelectorAll(".hero-sticker").forEach((el) => {
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
        b.deco.splice(i, 1);
        renderDeco();
        toast("스티커를 뗐어요");
      }
      save();
    };
  }

  function toggleDeco() {
    decoMode = !decoMode;
    const wrap = $("heroWrap"), pal = $("decoPalette"), btn = $("decoBtn");
    wrap.classList.toggle("deco-on", decoMode);
    pal.classList.toggle("hidden", !decoMode);
    btn.innerHTML = decoMode ? I("check") : I("sparkles");
    btn.title = decoMode ? "꾸미기 완료" : "스티커 꾸미기";
    if (decoMode) {
      pal.innerHTML = STICKERS.map((st) => `<button data-ds="${st}">${st}</button>`).join("");
      pal.querySelectorAll("[data-ds]").forEach((bn) => {
        bn.onclick = () => {
          const b = curBias();
          if (!b) return;
          if (!b.deco) b.deco = [];
          if (b.deco.length >= 20) return toast("스티커는 최대 20개까지!");
          b.deco.push({ s: bn.dataset.ds, x: +(18 + Math.random() * 64).toFixed(1), y: +(12 + Math.random() * 50).toFixed(1) });
          save(); renderDeco();
        };
      });
      toast("스티커를 골라 붙이고 드래그로 옮겨요. 톡 치면 떼어져요!");
    }
  }

  /* 티켓팅 타이머 */
  function nextTicket() {
    const now = new Date();
    return byBias(S.schedules)
      .filter((s) => s.cat === "ticket")
      .map((s) => ({ ...s, dt: new Date(s.date + "T" + (s.time || "00:00")) }))
      .filter((s) => s.dt > now)
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

  function tickClock() {
    const now = new Date();
    if (S && S.retro && S.retroSkin === "phone") updPhoneTime();
    const lc = $("liveClock");
    if (lc) lc.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const t = nextTicket();
    const tn = $("ticketNext"), btn = $("ticketLinkBtn"), card = $("ticketCard");
    const mw = $("wTick");
    if (!tn) return;
    if (!t) {
      if (card) card.classList.add("hidden");
      return;
    }
    if (card) card.classList.remove("hidden");
    const diff = t.dt - now;
    maybeNotifyTicket(t, diff);
    const dd = Math.floor(diff / 86400000);
    const hh = Math.floor((diff % 86400000) / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    const cnt = dd > 0 ? `D-${dd} ${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    tn.innerHTML = `${esc(t.title)}까지 <strong>${cnt}</strong>` + (diff <= 600000 ? ` ${I("bell")} 10분 전!` : "");
    if (mw) mw.textContent = cnt;
    if (t.link) { btn.href = t.link; btn.classList.remove("hidden"); }
    else btn.classList.add("hidden");
  }

  /* ═══════════ 캘린더 ═══════════ */
  function calMove(n) {
    calCur = new Date(calCur.getFullYear(), calCur.getMonth() + n, 1);
    renderCalendar();
  }

  function renderCalendar() {
    const y = calCur.getFullYear(), m = calCur.getMonth();
    $("calTitle").textContent = `${y}.${pad(m + 1)}`;

    // 필터 칩
    const fr = $("catFilters");
    fr.innerHTML = Object.entries(CATS).map(([k, c]) =>
      `<button class="f-chip ${activeCats.has(k) ? "active" : ""}" data-cat="${k}">
        <span class="dot" style="background:var(${c.v})"></span>${c.name}</button>`).join("");
    fr.querySelectorAll(".f-chip").forEach((ch) => {
      ch.onclick = () => {
        const k = ch.dataset.cat;
        activeCats.has(k) ? activeCats.delete(k) : activeCats.add(k);
        renderCalendar();
      };
    });

    const first = new Date(y, m, 1);
    const startDow = first.getDay();
    const daysIn = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const b = curBias();
    const tk = todayKey();
    const schedByDate = {};
    byBias(S.schedules).forEach((s) => {
      if (activeCats.has(s.cat)) (schedByDate[s.date] = schedByDate[s.date] || []).push(s);
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
        .map((s) => `<i style="background:var(${(CATS[s.cat] || CATS.personal).v})"></i>`).join("");
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
    list.innerHTML = items.length
      ? items.map((s) => {
          const c = CATS[s.cat] || CATS.personal;
          return `<li>
            <span class="bar" style="background:var(${c.v})"></span>
            <div class="dl-main">
              <div class="dl-cat" style="color:var(${c.v})">${c.name}${s.time ? " · " + esc(s.time) : ""}</div>
              <div class="dl-title">${esc(s.title)}</div>
              ${s.place ? `<div class="dl-sub">${I("pin")} ${esc(s.place)}</div>` : ""}
              ${s.memo ? `<div class="dl-sub">${esc(s.memo)}</div>` : ""}
              ${s.link ? `<a class="dl-link" href="${esc(s.link)}" target="_blank" rel="noopener">링크 바로가기 ${I("arrowUR")}</a>` : ""}
            </div>
            <button class="dl-del" data-esch="${s.id}">${I("pencil")}</button>
            <button class="dl-del" data-id="${s.id}">${I("x")}</button>
          </li>`;
        }).join("")
      : `<li class="day-empty">등록된 일정이 없어요. + 버튼으로 추가해 보세요!</li>`;
    list.querySelectorAll(".dl-del[data-id]").forEach((btn) => {
      btn.onclick = () => {
        if (!confirm("이 일정을 삭제할까요?")) return;
        S.schedules = S.schedules.filter((s) => s.id !== btn.dataset.id);
        save(); renderCalendar(); toast("일정을 삭제했어요");
      };
    });
    list.querySelectorAll("[data-esch]").forEach((btn) => {
      btn.onclick = () => openModal("schedule", btn.dataset.esch);
    });
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
    document.querySelectorAll("[data-btab]").forEach((t) => t.classList.toggle("active", t.dataset.btab === mode));
    renderBinder();
  }

  function renderBinder() {
    let cards = byBias(S.photocards).filter((p) => p.status === binderMode);
    // 앨범 필터 칩
    const albums = [...new Set(cards.map((p) => p.album).filter(Boolean))];
    const ar = $("albumRow");
    if (ar) {
      if (binderAlbum !== "all" && !albums.includes(binderAlbum)) binderAlbum = "all";
      ar.innerHTML = albums.length
        ? [["all", "전체"], ...albums.map((a) => [a, a])].map(([v, n]) =>
            `<button class="f-chip ${binderAlbum === v ? "active" : ""}" data-album="${esc(v)}">${esc(n)}</button>`).join("")
        : "";
      ar.querySelectorAll("[data-album]").forEach((b) => {
        b.onclick = () => { binderAlbum = b.dataset.album; renderBinder(); };
      });
    }
    if (binderAlbum !== "all") cards = cards.filter((p) => p.album === binderAlbum);
    let html = `<div class="poca-slot empty" onclick="App.openModal('poca')"><span class="plus">+</span>포카 등록</div>`;
    html += cards.map((p) => `
      <div class="poca-slot ${p.img ? "" : "noimg"}" data-id="${p.id}">
        ${p.img ? `<img src="${p.img}" alt="">` : esc(p.name)}
        ${p.img && p.name ? `<span class="pc-label">${esc(p.name)}</span>` : ""}
      </div>`).join("");
    $("binderGrid").innerHTML = html;
    $("binderGrid").querySelectorAll("[data-id]").forEach((el) => {
      el.onclick = () => openPocaView(el.dataset.id);
    });
  }

  function openPocaView(id) {
    const p = S.photocards.find((x) => x.id === id);
    if (!p) return;
    const stName = { own: "보유", wish: "위시", trade: "교환 중" };
    openModalRaw(p.name || "포토카드", `
      ${p.img ? `<img src="${p.img}" style="width:100%;max-height:50vh;object-fit:contain;border-radius:12px;margin-bottom:14px">` : ""}
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
      save(); closeModal(); binderTab(p.status); renderBinder();
      toast(p.status === "trade" ? "교환 중으로 옮겼어요" : "교환 완료! 보유 포카로");
    };
    $("pcEdit").onclick = () => openModal("poca", id);
    $("pcMove").onclick = () => {
      p.status = p.status === "own" ? "wish" : "own";
      save(); closeModal(); renderBinder(); toast(p.status === "own" ? "보유 포카로 옮겼어요" : "위시로 옮겼어요");
    };
    $("pcDel").onclick = () => {
      if (!confirm("이 포카를 삭제할까요?")) return;
      S.photocards = S.photocards.filter((x) => x.id !== id);
      save(); closeModal(); renderBinder();
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

    // 6개월 그래프
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - i, 1);
      months.push({ ym: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${d.getMonth() + 1}월` });
    }
    const sums = months.map((mo) => byBias(S.expenses).filter((e) => e.date && e.date.startsWith(mo.ym)).reduce((a, e) => a + +e.amount, 0));
    const max = Math.max(...sums, 1);
    $("ledgerChart").innerHTML = months.map((mo, i) => `
      <div class="bc-col ${mo.ym === ym ? "cur" : ""}">
        <div class="bc-bar" style="height:${Math.max(3, (sums[i] / max) * 100)}%"></div>
        <span class="bc-label">${mo.label}</span>
      </div>`).join("");

    // 내역
    $("expenseList").innerHTML = exps.length
      ? exps.map((e) => {
          const i = Math.max(0, EXP_CATS.indexOf(e.category));
          return `<li>
            <span class="dot" style="background:${EXP_COLORS[i]}"></span>
            <div class="ex-main">
              <div class="ex-title">${esc(e.title)}</div>
              <div class="ex-sub">${e.date} · ${esc(e.category)}${e.memo ? " · " + esc(e.memo) : ""}</div>
            </div>
            <span class="ex-amt">${won(e.amount)}</span>
            <button class="dl-del" data-eexp="${e.id}">${I("pencil")}</button>
            <button class="dl-del" data-id="${e.id}">${I("x")}</button>
          </li>`;
        }).join("")
      : `<li class="day-empty">지출 내역이 없어요. 행복 비용을 기록해 보세요</li>`;
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
      const types = ["all", ...archTypes(archMode)];
      tr.innerHTML = types.map((t) =>
        `<button class="f-chip ${diaryType === t ? "active" : ""}" data-dt="${t}">${t === "all" ? "전체" : t}</button>`).join("");
      tr.querySelectorAll("[data-dt]").forEach((b) => {
        b.onclick = () => { diaryType = b.dataset.dt; renderArchive(); };
      });
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
          ? "아직 온라인 기록이 없어요.<br>영통, 온라인 콘서트, 라이브 시청 후기를 남겨보세요"
          : "아직 오프라인 기록이 없어요.<br>다녀온 콘서트, 팝업, 생카 후기를 남겨보세요"}</div>`;
    $("archiveDiary").querySelectorAll("[data-id]").forEach((el) => {
      el.onclick = () => openDiaryView(el.dataset.id);
    });
    renderLinks();
  }

  function openDiaryView(id) {
    const d = S.archives.find((x) => x.id === id);
    if (!d) return;
    openModalRaw(d.title, `
      ${(d.imgs || []).map((im) => `<img src="${im}" style="width:100%;border-radius:12px;margin-bottom:12px">`).join("")}
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

  function addLink() {
    const url = $("linkInput").value.trim();
    if (!url) return toast("링크를 붙여넣어 주세요!");
    try { new URL(url); } catch (e) { return toast("올바른 링크가 아니에요 (https://… 형식)"); }
    S.links.unshift({ id: uid(), biasId: S.currentBias, url, label: $("linkLabel").value.trim(), date: todayKey() });
    $("linkInput").value = ""; $("linkLabel").value = "";
    save(); renderLinks(); toast("링크를 보관함에 저장했어요");
  }

  function renderLinks() {
    const links = byBias(S.links);
    $("linkList").innerHTML = links.length
      ? links.map((l) => `
        <li>
          <span class="lk-ico">${linkIcon(l.url)}</span>
          <div class="lk-main">
            <div class="lk-label">${esc(l.label) || "저장한 링크"}</div>
            <a class="lk-url" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url)}</a>
          </div>
          <button class="dl-del" data-id="${l.id}">${I("x")}</button>
        </li>`).join("")
      : `<li class="day-empty">카톡 대신 여기에 모아두세요!<br>X 직캠, 유튜브 자컨, 인스타 링크 무엇이든</li>`;
    $("linkList").querySelectorAll(".dl-del").forEach((b) => {
      b.onclick = () => {
        S.links = S.links.filter((l) => l.id !== b.dataset.id);
        save(); renderLinks();
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
      b.onclick = () => { S.accent = hex; save(); applyTheme(); renderSwatches(); };
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
    location.reload();
  }

  /* ═══════════ 모달 ═══════════ */
  let modalPhotoData = null;

  function openModalRaw(title, bodyHtml) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    $("modalBackdrop").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("modalBox").classList.remove("wide");
    $("modalBackdrop").classList.add("hidden");
    document.body.style.overflow = "";
    modalPhotoData = null;
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
    box.onclick = () => $("mpInput").click();
    $("mpInput").onchange = (e) => {
      const f = e.target.files[0];
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
    };
  }
  function bindPhotosPick(existing) {
    modalPhotosData = (existing || []).slice();
    renderPhotosGrid();
  }

  function openModal(type, editId) {
    closeFab();
    const baseDate = selDate || todayKey();

    /* 일정 등록/수정 */
    if (type === "schedule") {
      const edit = editId ? S.schedules.find((x) => x.id === editId) : null;
      openModalRaw(edit ? "일정 수정" : "일정 등록", `
        <div class="field"><label>제목 *</label><input type="text" id="mTitle" placeholder="예) 컴백 쇼케이스"></div>
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
          title, cat: $("mCat").value, date: $("mDate").value, time: $("mTime").value,
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
        <div class="field"><label>날짜</label><input type="date" id="mDate" value="${todayKey()}"></div>
        <div class="field"><label>메모 <small>(왜 샀는지, 어디가 이뻤는지)</small></label><input type="text" id="mMemo"></div>
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
      `);
      if (edit) {
        $("mTitle").value = edit.title;
        $("mAmount").value = edit.amount;
        $("mCat").value = edit.category;
        $("mDate").value = edit.date;
        $("mMemo").value = edit.memo || "";
        $("mSave").textContent = "수정 완료";
      }
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        const amount = +$("mAmount").value;
        if (!title || !amount) return toast("내용과 금액을 입력해 주세요!");
        const data = {
          title, amount, category: $("mCat").value,
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
          <select id="mEtype">${ARCH_TYPES.map((t) => `<option>${t}</option>`).join("")}</select>
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
        $("mEtype").innerHTML = archTypes(dMode).map((t) => `<option>${t}</option>`).join("");
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
        save(); closeModal(); archMode = dMode; renderArchive(); go("archive"); archiveTab("diary");
        toast(edit ? "기록을 수정했어요" : "소중한 기록을 남겼어요");
      };
      return;
    }

    /* 커스텀 기념일 추가 */
    if (type === "anniv") {
      openModalRaw("기념일 추가", `
        <div class="field"><label>이름 *</label><input type="text" id="mTitle" placeholder="예) 첫 팬미팅, 입덕일 1주년"></div>
        <div class="field"><label>날짜 * <small>(매년 돌아와요)</small></label><input type="date" id="mDate"></div>
        <button class="btn btn-primary btn-lg" id="mSave">추가</button>`);
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        if (!title || !$("mDate").value) return toast("이름과 날짜를 입력해 주세요!");
        const b = curBias();
        if (!b) return toast("먼저 최애를 등록해 주세요!");
        if (!b.annivs) b.annivs = [];
        b.annivs.push({ id: uid(), title, date: $("mDate").value });
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
          if (modalPhotoData) edit.img = modalPhotoData;
        } else {
          S.photocards.push({ id: uid(), biasId: S.currentBias, name, album, img: modalPhotoData, memo: $("mMemo").value.trim(), status });
        }
        save(); closeModal(); binderTab(status); go("binder");
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
        $("mStatus").value = edit.status;
        if (edit.img) { $("mpPreview").src = edit.img; $("mpPreview").classList.remove("hidden"); $("mpHint").classList.add("hidden"); }
        $("mSave").textContent = "수정 완료";
      }
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name) return toast("아이템 이름을 입력해 주세요!");
        const data = {
          name, category: $("mCat").value, info: $("mInfo").value.trim(), status: $("mStatus").value,
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
      openModalRaw("나만의 멤버십 카드", `
        <div class="field"><label>카드 이름</label><input type="text" id="mTitle" value="${esc(m.title)}" maxlength="20"></div>
        <div class="field"><label>내 이름 (영문 추천)</label><input type="text" id="mName" value="${esc(m.name)}" maxlength="24"></div>
        <div class="field"><label>아이콘 (이모지 1개)</label><input type="text" id="mIcon" value="${esc(m.icon)}" maxlength="2"></div>
        <div class="field"><label>멤버 번호</label><input type="text" id="mNo" value="${esc(m.no)}" maxlength="10"></div>
        <div class="field"><label>멤버십 만료일 <small>(팬클럽 기간 관리)</small></label><input type="date" id="mExpiry" value="${m.expiry || ""}"></div>
        <button class="btn btn-primary btn-lg" id="mSave">카드 발급</button>
      `);
      $("mSave").onclick = () => {
        S.membership = {
          title: $("mTitle").value.trim() || "MY STAR PASS",
          name: $("mName").value.trim() || "MY NAME",
          icon: $("mIcon").value.trim() || "✦",
          no: $("mNo").value.trim() || "0001",
          expiry: $("mExpiry").value || "",
        };
        save(); closeModal(); renderMemberCard();
        toast("나만의 멤버십 카드 발급 완료 ▥");
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
        <div class="field"><label>덕질 시작일 *</label><input type="date" id="mStart" value="${edit ? edit.startDate : todayKey()}"></div>
        <div class="field"><label>생일</label><input type="date" id="mBirth" value="${edit && edit.birthday ? edit.birthday : ""}"></div>
        <div class="field"><label>데뷔일</label><input type="date" id="mDebut" value="${edit && edit.debutDate ? edit.debutDate : ""}"></div>
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
        if (!$("mStart").value) return toast("덕질 시작일을 골라주세요!");
        const data = {
          name, group: $("mGroup").value.trim(),
          startDate: $("mStart").value,
          birthday: $("mBirth").value || null,
          debutDate: $("mDebut").value || null,
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
  }

  /* ═══════════ 시작 ═══════════ */
  function init() {
    load();
    applyTheme();
    if (!S.onboarded || !S.biases.length) {
      initOnboarding();
    } else {
      $("app").classList.remove("hidden");
      renderAll();
    }
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
    tickClock();
  }

  /* 외부 공개 API */
  window.App = {
    obNext, obFinish, obSkip, extractFromPhoto,
    go, toggleFab, toggleDark, toggleRetro, setRetroSkin, setRetroPos, setBg, setAlign, openFramePicker, openColorPicker, openBudget, openYearReview, toggleNotifyTicket, retroMin, retroMax, toggleDeco, toggleCoverPos, cardGo, coverDragStart, editCurrentBias, setTemplate, setMode,
    calMove, openStickerPicker, shareDay,
    binderTab, ledgerMove, archiveTab, styleTab,
    addLink, openModal, closeModal, backdropClose,
    exportData, resetAll,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
