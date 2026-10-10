(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { hospitals: [], cancers: [], records: [], mode: "hospitals", searched: false, snapshotLoaded: false };
  const safeUrl = (value) => {
    try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password ? u.href : null; }
    catch (_) { return null; }
  };
  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = String(text);
    return n;
  }
  const label = (text, klass) => el("span", klass, text);
  function link(url, text, klass) {
    const safe = safeUrl(url);
    if (!safe) return label("공식 주소 점검 중", "muted");
    const a = el("a", klass || "", text);
    a.href = safe; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", text + " (새 창)"); return a;
  }
  function empty(title, detail) {
    const c = el("div", "empty-state");
    c.append(el("div", "symbol", "◇"), el("h3", "", title), el("p", "", detail)); return c;
  }
  function filters() {
    return { cancer: $("cancerSelect").value, region: $("regionSelect").value,
      role: $("roleSelect").value, query: $("hospitalQuery").value.trim().toLowerCase() };
  }
  function doctorsInHospital(h, f) {
    return state.records.filter(d => d.hospital_name === h.name
      && (!f.cancer || d.cancers.some(c => c.code === f.cancer && (!f.role || c.role === f.role)))
      && (!f.query || (d.doctor_name + " " + d.hospital_name).toLowerCase().includes(f.query)));
  }
  function filteredHospitals() {
    const f = filters();
    return state.hospitals.filter(h => (!f.region || h.region === f.region)
      && (!f.query || (h.name + " " + h.slug).toLowerCase().includes(f.query)
        || state.records.some(d => d.hospital_name === h.name && d.doctor_name.toLowerCase().includes(f.query))))
      .sort((a,b) => doctorsInHospital(b,f).length - doctorsInHospital(a,f).length);
  }
  function cancerLabel() {
    const f = filters();
    const c = state.cancers.find(x => x.code === f.cancer);
    return c ? c.label : "선택한 암종";
  }
  function setNote(text) {
    const node = $("searchNote");
    if (node) { node.hidden = !text; node.textContent = text || ""; }
  }
  function hospitalCard(h, compact) {
    const card = el("article", "hospital-card" + (compact ? " compact-card" : ""));
    const top = el("div", "card-top");
    top.append(label("✚", "hospital-icon"), label(h.region, "region-chip"));
    card.append(top, el("h3", "", h.name));
    const condition = filters();
    const total = doctorsInHospital(h,{...condition,cancer:"",role:""}).length;
    const matched = doctorsInHospital(h,condition).length;
    if (matched && condition.cancer) {
      card.append(el("p","directory-note","공식 " + cancerLabel() + " 진료분야 일치 의료진 " + matched + "명"));
    } else if (matched) {
      card.append(el("p","directory-note","공식 진료분야 확인 의료진 " + matched + "명"));
    } else if (condition.cancer && total) {
      card.append(el("p","directory-note muted","등록된 의료진 중 " + cancerLabel() + " 진료분야 확인 정보 없음"));
    } else if (h.staff_url) {
      card.append(el("p","directory-note muted","의료진 목록 연동 대기 · 공식 검색에서 직접 확인"));
    } else {
      card.append(el("p","directory-note muted","의료진 목록 연동 대기 · 병원 홈페이지에서 확인"));
    }
    card.append(el("p","","병원 목록은 의료기관 평가나 치료 성적 순위가 아닙니다."));
    const bottom = el("div", "card-bottom");
    const actions = el("div", "card-actions");
    if (h.staff_url) actions.append(link(h.staff_url, "의료진 안내 ↗", "staff-link"));
    actions.append(link(h.official_url, "병원 홈페이지 ↗", "homepage-link"));
    bottom.append(actions); card.append(bottom); return card;
  }
  function renderHospitals() {
    const list = $("hospitalList"), matches = filteredHospitals();
    list.replaceChildren(...matches.map(h => hospitalCard(h, false)));
    if (!matches.length) list.append(empty("해당 지역의 의료기관이 없습니다", "지역이나 병원 이름 검색 조건을 변경해 주세요."));
    $("hospitalTabCount").textContent = matches.length;
    if (state.mode === "hospitals") $("resultsLabel").textContent = "의료기관 " + matches.length + "곳";
  }
  const REVIEW_MAX_AGE_MS = 180 * 86400000;
  function eligibleDoctor(d) {
    if (!d || d.status !== "ACTIVE" || !d.doctor_name || !d.hospital_name || !safeUrl(d.profile_url)) return false;
    const stamp = Date.parse(d.verified_at || "");
    const age = Date.now() - stamp;
    return Number.isFinite(stamp) && age >= -86400000 && age <= REVIEW_MAX_AGE_MS
      && Array.isArray(d.cancers) && d.cancers.some(c => c && typeof c.code === "string" && typeof c.role === "string");
  }
  function matchedDoctors() {
    const f = filters();
    if (!f.cancer && !f.query) return [];
    return state.records.filter(d => eligibleDoctor(d)
      && (!f.cancer || d.cancers.some(c => c.code === f.cancer && (!f.role || c.role === f.role)))
      && (!f.region || d.region === f.region)
      && (!f.query || (d.doctor_name + " " + d.hospital_name).toLowerCase().includes(f.query)));
  }
  function renderDoctors() {
    const list = $("doctorList"), status = $("doctorStatus"), found = matchedDoctors(), f = filters();
    list.replaceChildren();
    $("doctorTabCount").textContent = found.length;
    if (!f.cancer && !f.query) {
      status.textContent = "암종을 선택하거나 의료진 이름을 검색하면 공식 진료분야 확인 의료진을 볼 수 있습니다.";
      list.append(empty("암종을 선택해 주세요", "해당 암종과 공식 진료분야가 일치하는 공개 승인 의료진만 표시합니다."));
    } else if (!found.length) {
      status.textContent = state.snapshotLoaded
        ? cancerLabel() + " · 현재 이 검색 조건으로 공개 승인된 의료진 정보가 없습니다. 병원 공식 의료진 페이지에서 직접 확인할 수 있습니다."
        : "의료진 공개 데이터 연결을 확인하고 있습니다. 병원 공식 페이지는 바로 사용할 수 있습니다.";
      list.append(empty("검증 완료 의료진 검색 결과 0명",
        "아직 공개 승인된 정보가 없거나 선택 조건과 일치하는 자료가 없습니다. 의료진이 존재하지 않거나 해당 암종을 진료하지 않는다는 뜻은 아닙니다."));
    } else {
      status.textContent = (f.cancer ? cancerLabel() + " · " : "의료진 이름/병원 검색 · ")
        + "공식 진료분야가 확인된 의료진 " + found.length + "명입니다. 순위 또는 치료 성적 비교가 아닙니다.";
      for (const d of found) {
        const card = el("article", "doctor-card");
        const head = el("div", "doctor-head");
        head.append(el("h3", "", d.doctor_name), label("공식 진료분야 확인", "doc-label"));
        card.append(head, el("p", "", d.hospital_name + (d.department ? " · " + d.department : "")));
        if (d.specialty_text) card.append(el("p", "specialty", "공식 진료분야: " + d.specialty_text));
        card.append(el("p", "verification-date", "정보 확인: " + new Date(d.verified_at).toLocaleDateString("ko-KR")));
        const bottom = el("div", "card-bottom");
        bottom.append(label(d.region || "지역 확인 필요"), link(d.profile_url, "공식 프로필 ↗"));
        if (d.source_url) bottom.append(link(d.source_url, "진료분야 출처 ↗"));
        card.append(bottom); list.append(card);
      }
    }
    const others = $("officialFallback"), fallbacks = filteredHospitals();
    others.replaceChildren();
    if (f.cancer || f.query) {
      others.append(el("h3", "fallback-heading", "병원 공식 의료진 안내"));
      others.append(el("p", "fallback-copy", "이 목록의 모든 병원이 해당 암종을 진료한다고 검증된 것은 아닙니다. 각 병원 공식 페이지에서 진료과·진료분야를 확인하세요."));
      const mini = el("div", "fallback-grid");
      for (const h of fallbacks) {
        const item = el("div", "fallback-item");
        item.append(el("strong", "", h.name), label(h.region, "region-chip"));
        const actions=el("div", "fallback-actions");
        if (h.staff_url) actions.append(link(h.staff_url, "의료진 보기 ↗"));
        else actions.append(link(h.official_url, "병원 사이트 ↗"));
        item.append(actions); mini.append(item);
      }
      if (!fallbacks.length) mini.append(el("p", "", "지역·검색 조건에 일치하는 등록 의료기관이 없습니다."));
      others.append(mini);
    }
    $("resultsLabel").textContent = state.mode === "doctors" ? "검증 의료진 " + found.length + "명" : "의료기관 " + filteredHospitals().length + "곳";
  }
  function changeTab(mode) {
    state.mode = mode;
    const isHospital = mode === "hospitals";
    $("hospitalPanel").hidden = !isHospital; $("doctorPanel").hidden = isHospital;
    $("tabHospitals").classList.toggle("active", isHospital);
    $("tabDoctors").classList.toggle("active", !isHospital);
    $("tabHospitals").setAttribute("aria-selected", String(isHospital));
    $("tabDoctors").setAttribute("aria-selected", String(!isHospital));
    $("tabHospitals").tabIndex = isHospital ? 0 : -1;
    $("tabDoctors").tabIndex = isHospital ? -1 : 0;
    $("resultsLabel").textContent = isHospital ? "의료기관 " + filteredHospitals().length + "곳"
      : "검증 의료진 " + matchedDoctors().length + "명";
  }
  function search() {
    renderHospitals();
    renderDoctors();
    const f = filters(), matches = matchedDoctors().length, hospitalCount = filteredHospitals().length;
    const hasDoctors = Boolean((f.cancer || f.query) && matches > 0);
    changeTab(hasDoctors ? "doctors" : "hospitals");
    if ((f.cancer || f.query) && !hasDoctors) {
      setNote((f.cancer ? cancerLabel() : "의료진 검색") + " · 현재 조건에 맞는 공개 승인 의료진은 " + matches
        + "명입니다. 대신 등록 의료기관 " + hospitalCount
        + "곳과 공식 의료진 확인 링크를 표시합니다. 기관별 진료 여부는 직접 확인해 주세요.");
    } else if (hasDoctors) {
      setNote("검증된 의료진 " + matches + "명과 병원 공식 출처를 확인할 수 있습니다.");
    } else {
      setNote("등록 의료기관 " + hospitalCount + "곳입니다. 의료진 검색은 암종 선택 후 이용해 주세요.");
    }
    try {
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 680px)").matches) {
        $("resultsArea").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (_) { /* Search still works if scrolling is unavailable. */ }
  }
  async function init() {
    const [a,b] = await Promise.all([fetch("./data/hospitals.json"),fetch("./data/cancers.json")]);
    if (!a.ok || !b.ok) throw new Error("기본 정보 로딩 실패");
    state.hospitals = await a.json();
    state.cancers = await b.json();
    $("hospitalMetric").textContent = state.hospitals.length;
    $("cancerMetric").textContent = state.cancers.length;
    for (const c of state.cancers) { const o=el("option","",c.label);o.value=c.code;$("cancerSelect").append(o); }
    const regions=[...new Set(state.hospitals.map(h=>h.region))].sort((x,y)=>x.localeCompare(y,"ko"));
    for(const region of regions){const o=el("option","",region);o.value=region;$("regionSelect").append(o);}
    $("filters").addEventListener("submit", ev => { ev.preventDefault();search(); });
    $("resetButton").addEventListener("click",()=>{ $("filters").reset();setNote("");renderHospitals();renderDoctors();changeTab("hospitals"); });
    $("tabHospitals").addEventListener("click",()=>changeTab("hospitals"));
    $("tabDoctors").addEventListener("click",()=>{renderDoctors();changeTab("doctors");});
    for (const id of ["tabHospitals", "tabDoctors"]) {
      $(id).addEventListener("keydown", event => {
        if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
        event.preventDefault();
        const target = event.key === "ArrowLeft" || event.key === "Home" ? $("tabHospitals") : $("tabDoctors");
        if (target === $("tabHospitals")) changeTab("hospitals");
        else {renderDoctors(); changeTab("doctors");}
        target.focus();
      });
    }
    for (const id of ["cancerSelect","regionSelect","roleSelect"]) {
      $(id).addEventListener("change",()=>{renderHospitals();renderDoctors();if($("searchNote").hidden===false)setNote("조건이 변경되었습니다. 검색 버튼을 다시 눌러 결과를 확인해 주세요.");});
    }
    $("hospitalQuery").addEventListener("input",()=>{renderHospitals();renderDoctors();});
    renderHospitals();renderDoctors();changeTab("hospitals");
    try {
      const response=await fetch("./data/verified-specialists.json", {cache:"no-store"});
      if(!response.ok)throw Error("의료진 정적 데이터 응답 실패");
      const payload=await response.json();
      if(!Array.isArray(payload.results))throw Error("의료진 데이터 형식 오류");
      state.records=payload.results.filter(eligibleDoctor);
      state.snapshotLoaded=true;
      $("verifiedMetric").textContent=state.records.length;
      const coveredHospitals=[...new Set(state.records.map(d=>d.hospital_name))].sort();
      $("coverageStatus").textContent=coveredHospitals.length
        ? "공식 의료진 데이터 제공: 전체 " + state.hospitals.length + "개 병원 중 " + coveredHospitals.length + "곳. 나머지 병원은 공식 의료진 검색을 이용해 주세요."
        : "현재 공개 승인된 의료진 명단은 없습니다. 병원 공식 의료진 안내를 이용해 주세요.";
      const syncTime = Date.parse(payload.generated_at || "");
      $("syncStatus").textContent = Number.isFinite(syncTime)
        ? "마지막 자동 동기화: " + new Date(syncTime).toLocaleString("ko-KR", {timeZone:"Asia/Seoul"}) + " (KST)"
        : "의료진 공개정보는 공식 근거 확인과 승인 후 업데이트됩니다.";
      renderDoctors();
    } catch(err) {
      state.snapshotLoaded=false;
      $("verifiedMetric").textContent="—";
      $("coverageStatus").textContent="의료진 데이터 연동 상태를 확인하고 있습니다.";
      $("syncStatus").textContent="공개 의료진 데이터 연결을 확인하지 못했습니다. 병원 공식 홈페이지를 이용해 주세요.";
      renderDoctors();
    }
  }
  init().catch(() => {
    $("hospitalList").replaceChildren(empty("의료기관 데이터 연결 오류","새로고침 후 다시 이용해 주세요."));
    $("doctorStatus").textContent="데이터를 불러오지 못했습니다.";
  });
}());