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
    ["라임",   "#B7D532"], ["네온 그린", "#39D353"], ["민트",   "#5CD6C0"],
    ["스카이", "#5BB8FF"], ["블루",     "#3D6BFF"], ["바이올렛","#8A6BFF"],
    ["퍼플",   "#B14EE0"], ["핑크",     "#FF7AA2"], ["로즈",   "#FF4D79"],
    ["레드",   "#F0383F"], ["오렌지",   "#FF8A3D"], ["옐로",   "#FFC83D"],
  ];
  const ST_CATS = ["👕 의류", "👟 신발", "💍 액세서리", "🧢 모자", "👜 가방", "🍽 음식·카페", "📦 기타"];

  /* ── 상태 ── */
  let S = null;            // 전체 데이터
  let calCur = new Date(); // 캘린더 표시 월
  let selDate = null;      // 선택된 날짜 'YYYY-MM-DD'
  let ledgerCur = new Date();
  let binderMode = "own";
  let styleMode = "all";
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

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function defaults() {
    return {
      onboarded: false, dark: false, accent: "#B7D532",
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
    root.style.setProperty("--accent", S.accent);
    const r = parseInt(S.accent.slice(1, 3), 16), g = parseInt(S.accent.slice(3, 5), 16), b = parseInt(S.accent.slice(5, 7), 16);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    root.style.setProperty("--on-accent", lum > 150 ? "#111111" : "#ffffff");
    root.setAttribute("data-dark", S.dark ? "true" : "false");
    const sw = $("darkSwitch");
    if (sw) sw.classList.toggle("on", S.dark);
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

  /* ═══════════ 온보딩 ═══════════ */
  let obStep = 0;
  let obPhotoData = null;
  let obColor = "#B7D532";

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
    S.membership.name = bias.name.toUpperCase() + "'S FAN";
    S.onboarded = true;
    save();
    $("onboarding").classList.add("hidden");
    $("app").classList.remove("hidden");
    applyTheme();
    renderAll();
    toast(`${bias.name} 아카이브 시작! 🎉`);
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
    $("obCustomColor").oninput = (e) => { obColor = e.target.value; S.accent = obColor; applyTheme(); };
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
      if (!hex) return toast("색을 찾지 못했어요 😢 직접 골라주세요");
      if (mode === "ob") obColor = hex;
      S.accent = hex;
      applyTheme(); save();
      renderSwatches();
      toast(`사진에서 ${hex} 색을 추출했어요!`);
    });
  }

  /* ═══════════ 내비게이션 ═══════════ */
  function go(page) {
    document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
    document.querySelectorAll(".nav-btn, .bn-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.page === page ||
        (b.dataset.page === "more" && ["archive", "style", "settings", "more"].includes(page) && b.classList.contains("bn-btn")));
    });
    closeFab();
    window.scrollTo({ top: 0 });
    if (page === "home") renderHome();
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
    S.dark = !S.dark;
    save(); applyTheme();
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

    // 배지: 덕질 D+, 생일 D-, 데뷔 D-
    const badges = [`<span class="badge-accent">덕질 ${ddText} ♥</span>`];
    if (b.birthday) {
      const du = dUntilAnniv(b.birthday);
      badges.push(`<span class="badge-accent alt">🎂 생일 ${du === 0 ? "오늘!" : "D-" + du}</span>`);
    }
    if (b.debutDate) {
      const du = dUntilAnniv(b.debutDate);
      badges.push(`<span class="badge-accent alt">🎉 데뷔일 ${du === 0 ? "오늘!" : "D-" + du}</span>`);
    }
    $("heroBadges").innerHTML = badges.join("");

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
    if (b.birthday && isAnnivToday(b.birthday)) annivToday.push({ cat: "birthday", title: `${b.name} 생일 🎂`, time: "" });
    if (b.debutDate && isAnnivToday(b.debutDate)) annivToday.push({ cat: "birthday", title: "데뷔 기념일 🎉", time: "" });
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
      : `<div class="today-empty">오늘은 조용한 날이에요 ☁️<br>+ 버튼으로 일정을 등록해 보세요</div>`;

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
    $("mcNo").textContent = "NO. " + (m.no || "0001");
    const b = curBias();
    $("mcSince").textContent = "SINCE " + (b && b.startDate ? b.startDate.slice(0, 4) : "—");
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

  function tickClock() {
    const now = new Date();
    const lc = $("liveClock");
    if (lc) lc.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const t = nextTicket();
    const tn = $("ticketNext"), btn = $("ticketLinkBtn");
    if (!tn) return;
    if (!t) {
      tn.innerHTML = "예정된 티켓팅이 없어요";
      btn.classList.add("hidden");
      return;
    }
    const diff = t.dt - now;
    const dd = Math.floor(diff / 86400000);
    const hh = Math.floor((diff % 86400000) / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    const cnt = dd > 0 ? `D-${dd} ${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    tn.innerHTML = `${esc(t.title)}까지 <strong>${cnt}</strong>` + (diff <= 600000 ? " 🚨 10분 전!" : "");
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
        if (b.birthday && sameMD(b.birthday, m, dayNum)) anniv = `<span class="anniv">🎂생일</span>`;
        else if (b.debutDate && sameMD(b.debutDate, m, dayNum)) anniv = `<span class="anniv">🎉데뷔</span>`;
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
              ${s.place ? `<div class="dl-sub">📍 ${esc(s.place)}</div>` : ""}
              ${s.memo ? `<div class="dl-sub">${esc(s.memo)}</div>` : ""}
              ${s.link ? `<a class="dl-link" href="${esc(s.link)}" target="_blank" rel="noopener">링크 바로가기 ↗</a>` : ""}
            </div>
            <button class="dl-del" data-id="${s.id}">✕</button>
          </li>`;
        }).join("")
      : `<li class="day-empty">등록된 일정이 없어요. + 버튼으로 추가해 보세요!</li>`;
    list.querySelectorAll(".dl-del").forEach((btn) => {
      btn.onclick = () => {
        if (!confirm("이 일정을 삭제할까요?")) return;
        S.schedules = S.schedules.filter((s) => s.id !== btn.dataset.id);
        save(); renderCalendar(); toast("일정을 삭제했어요");
      };
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
      navigator.clipboard.writeText(text).then(() => toast("클립보드에 복사했어요! SNS에 붙여넣으세요 ✨"));
    }
  }

  /* ═══════════ 포카 바인더 ═══════════ */
  function binderTab(mode) {
    binderMode = mode;
    document.querySelectorAll("[data-btab]").forEach((t) => t.classList.toggle("active", t.dataset.btab === mode));
    renderBinder();
  }

  function renderBinder() {
    const cards = byBias(S.photocards).filter((p) => p.status === binderMode);
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
    openModalRaw(p.name || "포토카드", `
      ${p.img ? `<img src="${p.img}" style="width:100%;max-height:50vh;object-fit:contain;border-radius:12px;margin-bottom:14px">` : ""}
      ${p.memo ? `<p style="font-size:13px;color:var(--muted);margin-bottom:14px">${esc(p.memo)}</p>` : ""}
      <div class="btn-row">
        <button class="btn btn-primary btn-sm" id="pcMove">${p.status === "own" ? "위시로 이동" : "보유로 이동 (겟 완료! 🎉)"}</button>
        <button class="btn btn-danger btn-sm" id="pcDel">삭제</button>
      </div>
    `);
    $("pcMove").onclick = () => {
      p.status = p.status === "own" ? "wish" : "own";
      save(); closeModal(); renderBinder(); toast(p.status === "own" ? "보유 포카로 옮겼어요 🎉" : "위시로 옮겼어요");
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
            <button class="dl-del" data-id="${e.id}">✕</button>
          </li>`;
        }).join("")
      : `<li class="day-empty">지출 내역이 없어요. 행복 비용을 기록해 보세요 💸</li>`;
    $("expenseList").querySelectorAll(".dl-del").forEach((b) => {
      b.onclick = () => {
        if (!confirm("이 내역을 삭제할까요?")) return;
        S.expenses = S.expenses.filter((e) => e.id !== b.dataset.id);
        save(); renderLedger(); renderHome();
      };
    });
  }

  /* ═══════════ 아카이브 ═══════════ */
  function archiveTab(mode) {
    document.querySelectorAll("[data-atab]").forEach((t) => t.classList.toggle("active", t.dataset.atab === mode));
    $("archiveDiary").classList.toggle("hidden", mode !== "diary");
    $("archiveLinks").classList.toggle("hidden", mode !== "links");
  }

  function renderArchive() {
    // 일기
    const diaries = byBias(S.archives).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("archiveDiary").innerHTML = diaries.length
      ? diaries.map((d) => `
        <div class="diary-card" data-id="${d.id}">
          ${d.img ? `<img class="dc-img" src="${d.img}" alt="">` : ""}
          <div class="dc-body">
            <div class="dc-date">${d.date || ""}</div>
            <div class="dc-title">${esc(d.title)}</div>
            <div class="dc-text">${esc(d.content)}</div>
          </div>
        </div>`).join("")
      : `<div class="diary-empty">아직 기록이 없어요.<br>다녀온 콘서트, 팝업, 생카 후기를 남겨보세요 ✎</div>`;
    $("archiveDiary").querySelectorAll("[data-id]").forEach((el) => {
      el.onclick = () => openDiaryView(el.dataset.id);
    });
    renderLinks();
  }

  function openDiaryView(id) {
    const d = S.archives.find((x) => x.id === id);
    if (!d) return;
    openModalRaw(d.title, `
      ${d.img ? `<img src="${d.img}" style="width:100%;border-radius:12px;margin-bottom:12px">` : ""}
      <p style="font-size:12px;color:var(--muted);margin-bottom:8px">${d.date || ""}${d.place ? " · 📍 " + esc(d.place) : ""}</p>
      <p style="font-size:14px;white-space:pre-wrap;margin-bottom:16px">${esc(d.content)}</p>
      <button class="btn btn-danger btn-sm" id="diaryDel">삭제</button>
    `);
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
      if (/youtu/.test(h)) return "▶️";
      if (/instagram/.test(h)) return "📸";
      if (/tiktok/.test(h)) return "🎵";
      if (/weverse/.test(h)) return "🌐";
      return "🔗";
    } catch (e) { return "🔗"; }
  }

  function addLink() {
    const url = $("linkInput").value.trim();
    if (!url) return toast("링크를 붙여넣어 주세요!");
    try { new URL(url); } catch (e) { return toast("올바른 링크가 아니에요 (https://… 형식)"); }
    S.links.unshift({ id: uid(), biasId: S.currentBias, url, label: $("linkLabel").value.trim(), date: todayKey() });
    $("linkInput").value = ""; $("linkLabel").value = "";
    save(); renderLinks(); toast("링크를 보관함에 저장했어요 🔖");
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
          <button class="dl-del" data-id="${l.id}">✕</button>
        </li>`).join("")
      : `<li class="day-empty">카톡 대신 여기에 모아두세요!<br>X 직캠, 유튜브 자컨, 인스타 링크 무엇이든 📥</li>`;
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
    let items = byBias(S.styles);
    if (styleMode !== "all") items = items.filter((s) => s.status === styleMode);
    $("styleList").innerHTML = items.length
      ? items.map((s) => `
        <li>
          <div class="st-thumb" ${s.img ? `style="background-image:url(${s.img})"` : ""}>${s.img ? "" : (s.category || "📦").split(" ")[0]}</div>
          <div class="st-main">
            <div class="st-name">${esc(s.name)}</div>
            <div class="st-info">${esc(s.category || "")}${s.info ? " · " + esc(s.info) : ""}</div>
          </div>
          <button class="st-status ${s.status}" data-id="${s.id}">${s.status === "bought" ? "구매 완료 🛍" : "위시 🤍"}</button>
          <button class="dl-del" data-del="${s.id}">✕</button>
        </li>`).join("")
      : `<li class="style-empty">최애가 입은 옷, 신발, 액세서리를 기록해 보세요 ✦<br>직접 구매하면 '구매 완료'로 바꿀 수 있어요</li>`;
    $("styleList").querySelectorAll(".st-status").forEach((b) => {
      b.onclick = () => {
        const it = S.styles.find((s) => s.id === b.dataset.id);
        it.status = it.status === "bought" ? "wish" : "bought";
        save(); renderStyle();
        if (it.status === "bought") toast("겟 완료! 최애템 +1 🛍");
      };
    });
    $("styleList").querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        if (!confirm("이 아이템을 삭제할까요?")) return;
        S.styles = S.styles.filter((s) => s.id !== b.dataset.del);
        save(); renderStyle();
      };
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
    $("setCustomColor").value = S.accent;
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
    toast("백업 파일을 내려받았어요 💾");
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
      } catch (e) { toast("백업 파일을 읽을 수 없어요 😢"); }
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

  function openModal(type, editId) {
    closeFab();
    const baseDate = selDate || todayKey();

    /* 일정 등록 */
    if (type === "schedule") {
      openModalRaw("일정 등록", `
        <div class="field"><label>제목 *</label><input type="text" id="mTitle" placeholder="예) 컴백 쇼케이스"></div>
        <div class="field"><label>카테고리</label>
          <select id="mCat">${Object.entries(CATS).map(([k, c]) => `<option value="${k}">${c.name}</option>`).join("")}</select>
        </div>
        <div class="field"><label>날짜 *</label><input type="date" id="mDate" value="${baseDate}"></div>
        <div class="field"><label>시간</label><input type="time" id="mTime"></div>
        <div class="field"><label>장소</label><input type="text" id="mPlace" placeholder="예) 잠실실내체육관"></div>
        <div class="field"><label>링크 <small>(티켓팅이면 예매처 링크!)</small></label><input type="url" id="mLink" placeholder="https://"></div>
        <div class="field"><label>메모</label><input type="text" id="mMemo"></div>
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
      `);
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        if (!title) return toast("제목을 입력해 주세요!");
        if (!$("mDate").value) return toast("날짜를 골라주세요!");
        S.schedules.push({
          id: uid(), biasId: S.currentBias, title,
          cat: $("mCat").value, date: $("mDate").value, time: $("mTime").value,
          place: $("mPlace").value.trim(), link: $("mLink").value.trim(), memo: $("mMemo").value.trim(),
        });
        save(); closeModal();
        selDate = $("mDate") ? S.schedules[S.schedules.length - 1].date : selDate;
        renderCalendar(); renderHome();
        toast("일정을 등록했어요 ▦");
      };
      return;
    }

    /* 지출 기록 */
    if (type === "expense") {
      openModalRaw("지출 기록", `
        <div class="field"><label>내용 *</label><input type="text" id="mTitle" placeholder="예) 미니앨범 5집 공구"></div>
        <div class="field"><label>금액 (원) *</label><input type="number" id="mAmount" placeholder="35000" min="0"></div>
        <div class="field"><label>카테고리</label>
          <select id="mCat">${EXP_CATS.map((c) => `<option>${c}</option>`).join("")}</select>
        </div>
        <div class="field"><label>날짜</label><input type="date" id="mDate" value="${todayKey()}"></div>
        <div class="field"><label>메모 <small>(왜 샀는지, 어디가 이뻤는지 💭)</small></label><input type="text" id="mMemo"></div>
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
      `);
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim();
        const amount = +$("mAmount").value;
        if (!title || !amount) return toast("내용과 금액을 입력해 주세요!");
        S.expenses.push({
          id: uid(), biasId: S.currentBias, title, amount,
          category: $("mCat").value, date: $("mDate").value || todayKey(), memo: $("mMemo").value.trim(),
        });
        save(); closeModal(); renderLedger(); renderHome();
        toast("행복 비용을 기록했어요 💸");
      };
      return;
    }

    /* 후기(일기) */
    if (type === "diary") {
      openModalRaw("후기 쓰기", `
        ${photoPickHtml("+ 현장 사진 추가 (선택)")}
        <div class="field"><label>제목 *</label><input type="text" id="mTitle" placeholder="예) 첫 콘서트 다녀온 날"></div>
        <div class="field"><label>날짜</label><input type="date" id="mDate" value="${baseDate}"></div>
        <div class="field"><label>장소</label><input type="text" id="mPlace" placeholder="예) 고척돔"></div>
        <div class="field"><label>오늘의 기록 *</label><textarea id="mContent" placeholder="현장의 공기, 최애의 표정, 잊고 싶지 않은 순간들…"></textarea></div>
        <button class="btn btn-primary btn-lg" id="mSave">기록 남기기</button>
      `);
      bindPhotoPick(900);
      $("mSave").onclick = () => {
        const title = $("mTitle").value.trim(), content = $("mContent").value.trim();
        if (!title || !content) return toast("제목과 내용을 입력해 주세요!");
        S.archives.push({
          id: uid(), biasId: S.currentBias, title, content,
          date: $("mDate").value, place: $("mPlace").value.trim(), img: modalPhotoData,
        });
        save(); closeModal(); renderArchive(); go("archive"); archiveTab("diary");
        toast("소중한 기록을 남겼어요 ✎");
      };
      return;
    }

    /* 포카 추가 */
    if (type === "poca") {
      openModalRaw("포카 등록", `
        ${photoPickHtml("+ 포카 사진 추가")}
        <div class="field"><label>이름 / 버전 *</label><input type="text" id="mTitle" placeholder="예) ○○ 미니5집 트레카 A버전"></div>
        <div class="field"><label>구분</label>
          <select id="mStatus"><option value="own">보유 포카</option><option value="wish">위시 포카</option></select>
        </div>
        <div class="field"><label>메모</label><input type="text" id="mMemo" placeholder="교환처, 구매가 등"></div>
        <button class="btn btn-primary btn-lg" id="mSave">바인더에 넣기</button>
      `);
      bindPhotoPick(500);
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name && !modalPhotoData) return toast("사진 또는 이름을 넣어주세요!");
        const status = $("mStatus").value;
        S.photocards.push({ id: uid(), biasId: S.currentBias, name, img: modalPhotoData, memo: $("mMemo").value.trim(), status });
        save(); closeModal(); binderTab(status); go("binder");
        toast("바인더에 쏙 넣었어요 ▣");
      };
      return;
    }

    /* 스타일 아이템 */
    if (type === "styleItem") {
      openModalRaw("스타일 아이템 등록", `
        ${photoPickHtml("+ 아이템 사진 (선택)")}
        <div class="field"><label>아이템 이름 *</label><input type="text" id="mTitle" placeholder="예) 무대 착장 스니커즈"></div>
        <div class="field"><label>분류</label>
          <select id="mCat">${ST_CATS.map((c) => `<option>${c}</option>`).join("")}</select>
        </div>
        <div class="field"><label>브랜드 / 정보</label><input type="text" id="mInfo" placeholder="예) ○○브랜드, 12만원대"></div>
        <div class="field"><label>상태</label>
          <select id="mStatus"><option value="wish">위시 🤍</option><option value="bought">구매 완료 🛍</option></select>
        </div>
        <button class="btn btn-primary btn-lg" id="mSave">저장</button>
      `);
      bindPhotoPick(600);
      $("mSave").onclick = () => {
        const name = $("mTitle").value.trim();
        if (!name) return toast("아이템 이름을 입력해 주세요!");
        S.styles.push({
          id: uid(), biasId: S.currentBias, name,
          category: $("mCat").value, info: $("mInfo").value.trim(),
          status: $("mStatus").value, img: modalPhotoData,
        });
        save(); closeModal(); renderStyle(); go("style");
        toast("스타일북에 기록했어요 ✦");
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
        <button class="btn btn-primary btn-lg" id="mSave">카드 발급</button>
      `);
      $("mSave").onclick = () => {
        S.membership = {
          title: $("mTitle").value.trim() || "MY STAR PASS",
          name: $("mName").value.trim() || "MY NAME",
          icon: $("mIcon").value.trim() || "✦",
          no: $("mNo").value.trim() || "0001",
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
        toast(edit ? "수정했어요!" : `${name} 추가! 잡덕의 길 환영해요 🎉`);
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
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
    clockTimer = setInterval(tickClock, 1000);
    tickClock();
  }

  /* 외부 공개 API */
  window.App = {
    obNext, obFinish, extractFromPhoto,
    go, toggleFab, toggleDark,
    calMove, openStickerPicker, shareDay,
    binderTab, ledgerMove, archiveTab, styleTab,
    addLink, openModal, closeModal, backdropClose,
    exportData, resetAll,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
