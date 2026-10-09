(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { hospitals: [], cancers: [], mode: "hospitals", doctors: [], doctorLoaded: false };
  const safeUrl = (value) => {
    try { const u = new URL(value); return u.protocol === "https:" ? u.href : null; } catch (_) { return null; }
  };
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function label(name, cls) { return el("span", cls, name); }
  function createLink(url, text) {
    const urlValue = safeUrl(url);
    if (!urlValue) return label("공식 링크 확인 중");
    const a = el("a", "", text); a.href = urlValue; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", text + " (새 창)"); return a;
  }
  function empty(title, explanation) {
    const card = el("div", "empty-state");
    card.append(el("div", "symbol", "◇"), el("h3", "", title), el("p", "", explanation)); return card;
  }
  function currentFilters() {
    return { cancer: $("cancerSelect").value, region: $("regionSelect").value, role: $("roleSelect").value, query: $("hospitalQuery").value.trim().toLowerCase() };
  }
  function renderHospitals() {
    const { region, query } = currentFilters();
    const matches = state.hospitals.filter((h) => (!region || h.region === region) && (!query || (h.name + " " + h.slug).toLowerCase().includes(query)));
    const list = $("hospitalList"); list.replaceChildren();
    for (const h of matches) {
      const card = el("article", "hospital-card");
      const top = el("div", "card-top");
      top.append(el("span", "hospital-icon", "✚"), label(h.region, "region-chip"));
      card.append(top, el("h3", "", h.name), el("p", "", "공식 병원 홈페이지 · 의료진 진료분야는 별도 확인"));
      const bottom = el("div", "card-bottom");
      bottom.append(label("의료기관 기본 정보"), createLink(h.official_url, "공식 홈페이지 ↗"));
      card.append(bottom); list.append(card);
    }
    if (matches.length === 0) list.append(empty("해당 조건의 의료기관이 없습니다", "지역 또는 검색어를 변경해 보세요."));
    $("hospitalTabCount").textContent = matches.length;
    if (state.mode === "hospitals") $("resultsLabel").textContent = "의료기관 " + matches.length + "곳";
  }
  function status(message) { $("doctorStatus").textContent = message; }
  function renderDoctors() {
    const list = $("doctorList"); list.replaceChildren();
    if (!state.doctorLoaded) {
      list.append(empty("암종을 선택하고 의료진을 검색하세요", "검증 완료된 공개 의료진만 결과에 표시됩니다.")); return;
    }
    if (!state.doctors.length) {
      list.append(empty("현재 공개 가능한 의료진 정보가 없습니다", "수집 중인 의료진이 있더라도 검증 대기 상태라면 표시하지 않습니다. 해당 암종을 진료하는 의료진이 없다는 의미는 아닙니다.")); return;
    }
    for (const d of state.doctors) {
      const card = el("article", "doctor-card");
      const head = el("div", "doctor-head");
      head.append(el("h3", "", d.doctor_name || "이름 미확인"), label("공식 검증", "doc-label"));
      card.append(head, el("p", "", (d.hospital_name || "") + (d.department ? " · " + d.department : "")));
      if (d.specialty_text) card.append(el("p", "specialty", "전문 진료분야: " + d.specialty_text));
      const foot = el("div", "card-bottom");
      foot.append(label(d.region || "지역 확인 중"), createLink(d.profile_url, "공식 프로필 ↗"));
      card.append(foot); list.append(card);
    }
  }
  function changeTab(mode) {
    state.mode = mode;
    const hospitals = mode === "hospitals";
    $("hospitalPanel").hidden = !hospitals; $("doctorPanel").hidden = hospitals;
    $("tabHospitals").classList.toggle("active", hospitals);
    $("tabDoctors").classList.toggle("active", !hospitals);
    $("tabHospitals").setAttribute("aria-selected", String(hospitals));
    $("tabDoctors").setAttribute("aria-selected", String(!hospitals));
    $("resultsLabel").textContent = hospitals ? "의료기관 " + $("hospitalTabCount").textContent + "곳" : "검증 의료진 " + state.doctors.length + "명";
  }
  async function searchDoctors() {
    changeTab("doctors");
    const f = currentFilters();
    state.doctorLoaded = true; state.doctors = [];
    $("doctorTabCount").textContent = "—"; $("verifiedMetric").textContent = "—";
    if (!f.cancer) {
      status("암종을 선택해야 의료진을 검색할 수 있습니다.");
      renderDoctors(); $("resultsLabel").textContent = "암종 선택 필요"; return;
    }
    status("검증된 의료진 정보를 확인하고 있습니다…");
    $("doctorList").replaceChildren();
    const params = new URLSearchParams({ cancer: f.cancer, limit: "50" });
    if (f.region) params.set("region", f.region);
    if (f.role) params.set("role", f.role);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let response;
      try { response = await fetch("/.netlify/functions/hospital-information-matcher?" + params, { signal: controller.signal, cache: "no-store" }); }
      finally { clearTimeout(timeout); }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 503 && payload.code === "BACKEND_NOT_CONFIGURED") status("의료진 API 연동 준비 중입니다. 현재는 30개 의료기관의 공식 홈페이지를 이용할 수 있습니다.");
        else status("현재 의료진 데이터를 불러오지 못했습니다. 잠시 후 다시 시도하거나 병원 공식 홈페이지를 확인하세요.");
      } else {
        const matches = Array.isArray(payload.results) ? payload.results : [];
        state.doctors = matches.filter((d) => d && d.status === "ACTIVE" && d.doctor_name && d.hospital_name);
        status("공식 정보 확인과 내부 공개 승인을 마친 의료진만 표시됩니다. 의료진의 우열·치료 성적 순위가 아닙니다.");
        $("doctorTabCount").textContent = state.doctors.length;
        $("verifiedMetric").textContent = state.doctors.length;
      }
    } catch (_) {
      status("의료진 데이터 연결에 실패했습니다. 인터넷 연결 또는 공개 API 설정을 확인해 주세요.");
    }
    $("resultsLabel").textContent = "검증 의료진 " + state.doctors.length + "명";
    renderDoctors();
  }
  async function init() {
    const [hospitalResponse, cancerResponse] = await Promise.all([fetch("./data/hospitals.json"), fetch("./data/cancers.json")]);
    if (!hospitalResponse.ok || !cancerResponse.ok) throw new Error("초기 데이터 오류");
    state.hospitals = await hospitalResponse.json();
    state.cancers = await cancerResponse.json();
    $("hospitalMetric").textContent = state.hospitals.length;
    $("cancerMetric").textContent = state.cancers.length;
    for (const c of state.cancers) { const option = el("option", "", c.label); option.value = c.code; $("cancerSelect").append(option); }
    const regions = [...new Set(state.hospitals.map((h) => h.region))].sort((a,b)=>a.localeCompare(b,"ko"));
    for (const r of regions) { const option = el("option", "", r); option.value = r; $("regionSelect").append(option); }
    $("tabHospitals").addEventListener("click", () => changeTab("hospitals"));
    $("tabDoctors").addEventListener("click", () => changeTab("doctors"));
    $("regionSelect").addEventListener("change", () => { renderHospitals(); if(state.mode === "doctors") { state.doctorLoaded = false; state.doctors=[]; status("검색 조건이 변경됐습니다. 의료진 검색을 다시 실행해 주세요.");renderDoctors();} });
    $("hospitalQuery").addEventListener("input", renderHospitals);
    $("filters").addEventListener("submit", (e) => { e.preventDefault(); renderHospitals(); searchDoctors(); });
    $("resetButton").addEventListener("click", () => { $("filters").reset(); state.doctorLoaded=false; state.doctors=[]; status(""); $("doctorTabCount").textContent="—"; changeTab("hospitals"); renderHospitals(); });
    renderHospitals(); renderDoctors();
  }
  init().catch(() => { $("hospitalList").replaceChildren(empty("기본 정보 로딩 실패", "잠시 후 새로고침해 주세요.")); status("초기 데이터에 연결할 수 없습니다."); });
}());