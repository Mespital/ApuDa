/* 이번 주(주 5일) 스케줄 · 다음 등교일 예습 · 시간표 올리기(사진/붙여넣기/나이스)
   공휴일·대체공휴일·학교 휴업일·직접 추가한 쉬는 날(FC_CAL)을 빼고 계산한다. */
(() => {
  'use strict';
  const CAL = () => (typeof FC_CAL !== 'undefined' ? FC_CAL : null);
  const PREV_KEY = 'fc_preview_v1', PLUS_KEY = 'compass-study-plus-v1';
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  let weekOffset = 0, draft = null, ocrBusy = false, school = null;

  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const plusData = () => { const p = lsGet(PLUS_KEY, {}); return p && typeof p === 'object' ? p : {}; };
  const md = d => { const x = new Date(d + 'T12:00:00Z'); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate(); };
  const wdOf = d => new Date(d + 'T12:00:00Z').getUTCDay();
  const label = d => md(d) + '(' + WD[wdOf(d)] + ')';
  const rowOf = d => wdOf(d) - 1; // 월=0
  const addDays = (d, n) => CAL() ? CAL().add(d, n) : new Date(Date.parse(d + 'T12:00Z') + n * 864e5).toISOString().slice(0, 10);
  const offDay = d => CAL() ? CAL().offDay(d) : ([0, 6].includes(wdOf(d)) ? { name: '주말', weekend: true } : null);
  const nextSchoolDay = d => CAL() ? CAL().nextSchoolDay(d) : (() => { let x = addDays(d, 1); while ([0, 6].includes(wdOf(x))) x = addDays(x, 1); return x; })();
  const subjectsOf = d => { const r = rowOf(d); return r >= 0 && r < 5 ? state.table[r].map(s => String(s || '').trim()) : []; };
  const uniq = a => a.filter((x, i) => x && a.indexOf(x) === i);
  const hasTable = () => state.table.some(r => r.some(Boolean));

  /* ---------- 예습 ---------- */
  const NO_PREP = /체육|음악|미술|창체|창의|자율|동아리|봉사|진로활동|스포츠|조회|종례/;
  const ABBR_TIP = { 공국: '국어', 공수: '수학', 공영: '영어', 통사: '통합사회', 통과: '통합과학', 한사: '한국사', 과탐: '과학탐구실험', 기가: '기술가정' };
  function tipFor(raw) {
    const base = String(raw).replace(/[A-D1-4]$/, ''), s = (ABBR_TIP[base] ?? '') || raw;
    if (/^진로/.test(raw)) return '진로 활동 준비물·과제만 확인';
    if (NO_PREP.test(s)) return '준비물만 확인';
    if (/국어|문학|독서|화법|작문|언어/.test(s)) return '다음 본문 한 번 소리 내 읽고, 모르는 낱말 3개 표시';
    if (/수학|미적|기하|확률|통계/.test(s)) return '다음 차시 개념 박스 읽고 예제 1개 직접 풀어보기';
    if (/영어/.test(s)) return '다음 본문 새 단어 뜻 적고 본문 한 번 읽기';
    if (/사회|한국사|역사|지리|윤리|정치|경제|법/.test(s)) return '소제목·그림·자료 훑고 궁금한 질문 1개 적기';
    if (/과학|물리|화학|생명|지구|탐구|실험/.test(s)) return '그림·도표 보고 핵심 용어 3개 미리 확인';
    if (/정보|기술|가정|코딩/.test(s)) return '지난 시간 내용 다시 보고 다음 실습 주제 확인';
    if (/한문|일본어|중국어|독일어|프랑스어|스페인어|외국어/.test(s)) return '새 낱말 소리 내 읽기 3번';
    return '교과서 다음 쪽 소제목 훑어보기';
  }
  function prepItems(d) {
    const p = plusData(), courses = p.courses || {};
    const soon = state.dates.filter(x => !x.done && gap(x.date) >= 0 && gap(x.date) <= 7);
    return uniq(subjectsOf(d)).map(s => {
      const c = courses[s] || {}, exam = soon.find(x => x.subject && (x.subject.includes(s) || s.includes(x.subject)));
      const cur = typeof FC_CURRICULUM !== 'undefined' ? FC_CURRICULUM.lookup(s, null, null, { book: c.book }) : null;
      const next = cur && c.unit ? FC_CURRICULUM.nextAfter(s, c.unit, c.book) : null;
      const bookLabel = c.book ? c.book : cur && cur.books && cur.books[0] && /유력/.test(cur.books[0].tag) ? cur.books[0].name : '';
      return { s, unit: c.unit || '', pages: c.pages || '', book: bookLabel, tip: tipFor(s), light: NO_PREP.test(s), exam, cur, next };
    });
  }
  function prepDone(d) { const v = lsGet(PREV_KEY, {}); return Array.isArray(v[d]) ? v[d] : []; }
  function setPrep(d, s, on) {
    const v = lsGet(PREV_KEY, {}); const cur = new Set(Array.isArray(v[d]) ? v[d] : []);
    on ? cur.add(s) : cur.delete(s); v[d] = [...cur];
    for (const k of Object.keys(v)) if (k < addDays(today(), -14)) delete v[k];
    lsSet(PREV_KEY, v);
  }
  function prepCard() {
    if (!hasTable()) return '';
    const nd = nextSchoolDay(today()), items = prepItems(nd), done = prepDone(nd), teachers = lsGet(TEACHER_KEY, {}) || {};
    const examDay = CAL() ? CAL().schoolEvents(nd).filter(t => /고사|시험|평가/.test(t)) : [];
    const real = items.filter(x => !x.light), mins = Math.min(60, real.length * 10);
    const when = gap(nd) === 1 ? '내일' : label(nd);
    const bag = state.bags[rowOf(nd)] || '';
    const needUnit = real.some(x => x.cur && x.cur.flat.length && !x.unit);
    const row = x => `<label class="wk-prep-item${x.light ? ' light' : ''}"><input type="checkbox" data-prep="${esc(nd)}" data-subject="${esc(x.s)}" ${done.includes(x.s) ? 'checked' : ''}><span><b>${esc(x.s)}${teachers[x.s] ? ` <small>${esc(teachers[x.s])}</small>` : ''}${x.book && !x.light ? ` <small class="wk-book">${esc(x.book)}</small>` : ''}</b><small>${
      x.light ? '준비물만 확인' : x.exam ? '🧩 ' + esc(x.exam.title) + ' D-' + gap(x.exam.date) + ' → 범위 복습 먼저' : x.next ? '다음: ' + esc(x.next.split(' › ').pop()) + (x.cur && x.cur.extra ? ' · ' + esc(x.cur.extra) : '') : esc(x.tip)}</small></span></label>`;
    const list = real.map(row).join('') + (items.some(x => x.light) ? `<p class="wk-light">${items.filter(x => x.light).map(x => esc(x.s)).join(' · ')}: 준비물만 챙기기</p>` : '');
    return `<section class="card wk-prep"><div class="section-title"><h2>📘 ${esc(when)} 예습</h2><span class="badge">${examDay.length ? '시험날' : real.length ? '약 ' + mins + '분' : '가볍게'}</span></div>
      ${gap(nd) > 1 ? `<p class="muted">${esc(label(nd))} 수업 기준</p>` : ''}
      ${examDay.length ? `<p class="wk-warn">📝 ${esc(examDay[0])}. 예습보다 시험 과목 마무리가 먼저야.</p><details class="wk-fold-in"><summary>그래도 예습 목록 보기</summary>${list}</details>` : list || '<p class="muted">그날 시간표가 비어 있어.</p>'}
      ${bag ? `<p class="wk-bag">🎒 ${esc(bag)}</p>` : ''}
      ${needUnit ? '<p class="wk-hint">📖 과목별로 지금 배우는 단원을 고르면 "다음 단원"까지 알려줘. <button data-go-course>단원 고르기</button></p>' : ''}</section>`;
  }

  /* ---------- 이번 주 ---------- */
  function weekView() {
    const t0 = today(), wkd = wdOf(t0), base = addDays(wkd === 6 ? addDays(t0, -5) : wkd === 0 ? addDays(t0, -6) : t0, weekOffset * 7), days5 = CAL() ? CAL().weekDays(base) : (() => { const w = wdOf(base), mon = addDays(base, w === 0 ? 1 : w === 6 ? 2 : 1 - w); return [0, 1, 2, 3, 4].map(i => addDays(mon, i)); })();
    const p = plusData(), reviews = p.reviews || {};
    const days7 = days5.concat([addDays(days5[4], 1), addDays(days5[4], 2)]);
    const offs = days5.map(offDay), schoolDays = offs.filter(o => !o).length;
    const dueAll = state.dates.filter(x => !x.done && days7.includes(x.date));
    const cards = days7.map((d, i) => {
      const o = i < 5 ? offs[i] : offDay(d), wkend = i >= 5 && o && o.weekend, subs = (a => { while (a.length && !a[a.length - 1]) a.pop(); return a; })(subjectsOf(d)), isToday = d === today();
      const evs = CAL() ? CAL().schoolEvents(d).filter(t => !(o && t === o.name)) : [];
      const dl = state.dates.filter(x => !x.done && x.date === d);
      const rv = state.reviews.filter(x => !x.done && (reviews[x.id]?.due || x.date) === d);
      const tk = state.tasks.filter(x => !x.done && x.date === d);
      const nd = nextSchoolDay(d), prepSubs = uniq(subjectsOf(nd)).filter(s => !NO_PREP.test(s));
      return `<article class="wk-day${o ? ' off' : ''}${wkend ? ' wkend' : ''}${isToday ? ' today' : ''}">
        <header><b>${WD[wdOf(d)]}</b> <span>${md(d)}</span>${isToday ? '<em>오늘</em>' : ''}</header>
        ${wkend ? '' : o ? `<p class="wk-offname">🌿 ${esc(o.name)}<br><small>${esc(o.kind || '')} · 수업 없음</small></p>` :
          subs.some(Boolean) ? `<ol class="wk-classes">${subs.map(s => `<li>${esc(s) || '<span class="muted">—</span>'}</li>`).join('')}</ol>` : '<p class="muted">시간표 없음</p>'}
        ${(typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(d) : []).map(a => `<p class="wk-ac">🏫 ${esc(a.start || '')}${a.end ? '~' + esc(a.end) : ''} ${esc(a.name)}${a.homework && !a.hwDone ? ' · 숙제' : ''}</p>`).join('')}
        ${(typeof FC_LIFE !== 'undefined' ? FC_LIFE.forDay(d) : []).filter(x => x.start || x.end).map(x => `<p class="wk-life">${esc(x.icon)} ${esc(x.start || '')}${x.end ? '~' + esc(x.end) : ''} ${esc(x.title)}</p>`).join('')}
        ${evs.map(t => `<p class="wk-ev">${o ? '⚠ ' : '🏫 '}${esc(t)}${o ? '<br><small>쉬는 날과 겹쳐. 학교 공지 확인</small>' : ''}</p>`).join('')}
        ${dl.map(x => `<p class="wk-due${o ? ' clash' : ''}">📝 ${esc(x.kind)} · ${esc(x.title)}${o ? '<br><small>쉬는 날이야. 날짜 다시 확인!</small>' : ''}</p>`).join('')}
        ${rv.length ? `<p class="wk-rv">🔁 복습 ${rv.length}개</p>` : ''}
        ${tk.length ? `<p class="wk-rv">✅ 할 일 ${tk.length}개</p>` : ''}
        ${wkend && !(typeof FC_ACADEMY !== 'undefined' && FC_ACADEMY.forDay(d).length) && !dl.length && !tk.length ? '<p class="muted">🌿 쉬는 날</p>' : ''}
        ${!o && hasTable() ? `<p class="wk-eve">🌙 저녁: ${prepSubs.length ? '예습 ' + esc(prepSubs.slice(0, 3).join('·')) + (prepSubs.length > 3 ? ' 외' : '') : '쉬어가기'}${gap(nd) > 1 ? ` <small>(${label(nd)} 수업)</small>` : ''}</p>` : ''}
      </article>`;
    }).join('');
    const own = CAL() ? CAL().ownList().filter(x => x.date >= today()) : [];
    return `<section class="card"><div class="section-title"><h2>📅 ${weekOffset === 0 ? '이번 주' : weekOffset === 1 ? '다음 주' : weekOffset === -1 ? '지난주' : md(days5[0]) + ' 주'} <small class="muted">${md(days7[0])}~${md(days7[6])}</small></h2>
      <span class="wk-nav"><button data-week="-1" aria-label="이전 주">◀</button><button data-week="0">이번 주</button><button data-week="1" aria-label="다음 주">▶</button></span></div>
      <p class="muted">수업일 ${schoolDays}일${offs.some(o => o && !o.weekend) ? ' · 쉬는 날 ' + offs.filter(o => o && !o.weekend).map((o, i) => esc(o.name)).join(', ') : ''}${dueAll.length ? ' · 마감 ' + dueAll.length + '개' : ''}</p>
      ${hasTable() ? '' : '<p class="wk-warn">시간표를 먼저 올려줘. 그러면 요일별 수업과 예습이 자동으로 채워져. <button data-go="settings">⚙️ 설정에서 시간표 올리기 →</button></p>'}
      <div class="wk-grid">${cards}</div></section>
      <p class="muted wk-offlink">다가오는 쉬는 날: ${CAL() ? CAL().upcoming(today(), 120).slice(0, 4).map(x => esc(label(x.date) + ' ' + x.name)).join(' · ') || '없음' : ''} · 재량휴업일 추가는 <button class="linkish" data-go="settings">⚙️ 설정</button></p>`;
  }
  function offdayPanel() {
    const own = CAL() ? CAL().ownList().filter(x => x.date >= today()) : [];
    return `<section class="card" id="offday-panel"><h2>🌿 쉬는 날 추가</h2>
        <p class="muted">법정 공휴일·대체공휴일과 학교 휴업일(나이스)은 자동이야. 학교 공지로 받은 재량휴업일이나 새로 생긴 임시공휴일만 여기 넣어.</p>
        <form data-offday><label>날짜<input type="date" name="date" required min="${today()}"></label><label>이름<input name="name" maxlength="30" placeholder="예: 재량휴업일"></label><button class="primary">추가</button></form>
        ${own.length ? own.map(x => `<div class="row"><span>${esc(label(x.date))} ${esc(x.name)}</span><button class="delete" data-offday-del="${esc(x.date)}" aria-label="삭제">×</button></div>`).join('') : ''}</section>`;
  }

  /* ---------- 시간표 올리기 ---------- */
  const KNOWN = ['국어', '수학', '영어', '통합사회', '통합과학', '한국사', '과학탐구실험', '정보', '체육', '음악', '미술', '기술가정', '한문', '일본어', '중국어', '창체', '자율', '동아리', '진로', '공통국어', '공통수학', '공통영어', '통합사회1', '통합사회2', '통합과학1', '통합과학2', '한국사1', '한국사2', '과학탐구실험1', '과학탐구실험2', '공통국어1', '공통국어2', '공통수학1', '공통수학2', '공통영어1', '공통영어2'];
  // 학교 시간표 줄임말(과목 이름은 학교 표기 그대로 저장하고, 예습 팁만 원래 과목으로 연결)
  const ABBR = { 공국: '국어', 공수: '수학', 공영: '영어', 통사: '통합사회', 통과: '통합과학', 한사: '한국사', 과탐: '과학탐구실험', 기가: '기술가정', 생설: '', 진로: '', 창체: '', 정보: '정보' };
  const BASES = [...new Set([...KNOWN, ...Object.keys(ABBR)])];
  const TEACHER_KEY = 'fc_teachers_v1';
  let draftTeachers = {};
  const DAY_RE = /^(월|화|수|목|금)(요일)?$/;
  function snapSubject(raw) {
    const t = String(raw || '').replace(/\s+/g, '').replace(/[^가-힣A-Za-z0-9]/g, '');
    if (!t) return '';
    if (/^[월화수목금](요일)?$/.test(t) || /^\d+(교시)?\d*$/.test(t) || /^교시$/.test(t)) return t;
    const OCRSUF = { 스: 'A', 쓰: 'A', 시: 'A', '^': 'A', '&': 'A', 8: 'B', ㅇ: 'C', 0: 'D', O: 'D', o: 'D', ')': 'D' };
    const raw2 = String(raw || '').replace(/\s+/g, '');
    if (raw2.length >= 3 && OCRSUF[raw2.slice(-1)] && BASES.some(k => k.length === 2 && lev(raw2.slice(0, -1), k) <= 1) && !KNOWN.includes(raw2)) return snapSubject(raw2.slice(0, -1)) + OCRSUF[raw2.slice(-1)];
    const m = t.match(/^(.*?[가-힣])([A-Da-d1-4])?$/); if (!m) return t.slice(0, 40);
    const base = m[1], suf = (m[2] || '').toUpperCase();
    if (BASES.includes(base)) return base + suf;
    let best = '', bd = 9; for (const k of BASES) { const d = lev(base, k); if (d < bd) { bd = d; best = k; } }
    return (bd <= (best.length <= 2 ? 1 : Math.floor(best.length / 3)) ? best : base) + suf;
  }
  // "공영A 오가영" / "공영A\n오가영" → {s:'공영A', t:'오가영'}
  function splitCell(raw) {
    const pm = String(raw || '').trim().match(/^(.+?)\s*[(（]\s*([가-힣]{2,4})\s*[)）]$/);   // 공영A(오가영)
    if (pm) return { s: snapSubject(pm[1]), t: pm[2] };
    const parts = String(raw || '').split(/[\n\r]+|\s+/).map(x => x.trim()).filter(Boolean);
    if (!parts.length) return { s: '', t: '' };
    if (parts.length >= 2 && /^[가-힣]{2,4}$/.test(parts[parts.length - 1])) {
      const subj = parts.slice(0, -1).join(''), last = parts[parts.length - 1], snapped = snapSubject(subj);
      if (!BASES.includes(last) && !BASES.includes(subj + last) && snapped) return { s: snapped, t: last };
    }
    return { s: snapSubject(parts.join('')), t: '' };
  }
  function cleanCell(t) {
    t = String(t || '').replace(/\(\s*\d{1,2}:\d{2}\s*\)/g, '').replace(/^\s*\d+\s*(교시)?[.)]?\s*/, '').replace(/[|_~`'"“”‘’]/g, '').trim();
    if (/^\d+(교시)?\d*$/.test(t) || DAY_RE.test(t) || /^교시$/.test(t)) return '';
    return t.slice(0, 60);
  }
  function mergeTokens(tokens) {
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const a = tokens[i], b = tokens[i + 1] || '';
      if (b && KNOWN.includes(a + b) && !KNOWN.includes(a)) { out.push(a + b); i++; } else out.push(a);
    }
    return out;
  }
  function splitLine(line) {
    if (line.includes('\t')) return line.split('\t').map(s => s.trim());   // 엑셀·한글 표: 빈 칸 유지
    let parts = line.split(/\s{2,}|\||,|;/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) parts = mergeTokens(line.trim().split(/\s+/));
    return parts;
  }
  function parseTable(text) {
    draftTeachers = {};
    text = String(text || '').replace(/"([^"]*)"/g, (_, x) => x.replace(/\s*\n\s*/g, ' '));
    const put = (grid, d, j, raw) => { const c = splitCell(raw); grid[d][j] = c.s; if (c.s && c.t) draftTeachers[c.s] = c.t; };
    const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/[^\S\t\n]+/g, m => m.length > 1 ? '  ' : ' ').replace(/^ +| +$/g, '').replace(/^\t+(?=[월화수목금])/, '')).filter(l => /[가-힣A-Za-z]/.test(l));
    const grid = Array.from({ length: 5 }, () => Array(7).fill(''));
    if (!lines.length) return null;
    // 1) 줄마다 요일로 시작: "월 국어 수학 ..."
    const byDay = lines.filter(l => /^(월|화|수|목|금)(요일)?[\s:：\t]/.test(l));
    if (byDay.length >= 3) {
      byDay.forEach(l => { const d = '월화수목금'.indexOf(l[0]); const cells = splitLine(l.replace(/^(월|화|수|목|금)(요일)?[\s:：]*/, '')).map(cleanCell).filter(Boolean); cells.slice(0, 7).forEach((c, j) => put(grid, d, j, c)); });
      return grid;
    }
    // 2) 머리줄이 요일, 이후 줄이 교시
    let start = lines.findIndex(l => (l.match(/[월화수목금]/g) || []).length >= 4 && splitLine(l).filter(t => DAY_RE.test(t.replace(/요일$/, '')) || DAY_RE.test(t)).length >= 3);
    const body = start >= 0 ? lines.slice(start + 1) : lines;
    let p = 0;
    for (const l of body) {
      if (p >= 7) break;
      let cells = splitLine(l).map(cleanCell);
      if (cells[0] === '' && (cells.length > 5 || /^\s*\d/.test(l))) cells = cells.slice(1);
      if (!l.includes('\t')) cells = cells.filter(Boolean);
      if (cells.filter(Boolean).length < (l.includes('\t') || /^\s*\d/.test(l) ? 1 : 2)) continue;
      cells.slice(0, 5).forEach((c, d) => put(grid, d, p, c));
      p++;
    }
    return grid.some(r => r.some(Boolean)) ? grid : null;
  }
  function fromNeis(cls) {
    const days = school?.timetable?.classes?.[cls]; if (!days) return null;
    const grid = Array.from({ length: 5 }, () => Array(7).fill(''));
    for (const [d, list] of Object.entries(days)) { const r = rowOf(d); if (r >= 0 && r < 5) list.slice(0, 7).forEach((s, j) => { if (s) grid[r][j] = String(s).slice(0, 40); }); }
    return grid.some(r => r.some(Boolean)) ? grid : null;
  }
  function uploadPanel() {
    const myClass = (typeof FC_SCHOOL !== 'undefined' && FC_SCHOOL.config.classNo) || '';
    const neisOk = !!(school?.keyed && school?.timetable?.classes?.[myClass]);
    return `<section class="card wk-upload"><div class="section-title"><h2>📤 시간표 올리기</h2><span class="badge">한 번이면 주간·예습 자동</span></div>
      <p class="muted">사진·캡처를 올리거나, 표를 복사해 붙여넣어. 읽은 결과를 아래에서 고친 다음 적용하면 돼.</p>
      <div class="wk-up-ways">
        <label class="wk-file">📷 사진·캡처로 올리기<input type="file" accept="image/*" data-tt-image hidden></label>
        <button data-tt-paste-open>📋 붙여넣기</button>
        ${neisOk ? `<button data-tt-neis>🏫 나이스에서 ${esc(myClass)}반 시간표 불러오기</button>` : ''}
      </div>
      <div data-tt-paste hidden><textarea data-tt-text rows="6" placeholder="엑셀·한글·카톡에서 시간표를 복사해 붙여넣어.&#10;예)&#10;    월   화   수   목   금&#10;1  국어  수학  영어  ...&#10;또는&#10;월 국어 수학 영어 통합사회 ..."></textarea><button data-tt-parse class="primary">읽기</button></div>
      <p class="wk-status" data-tt-status>${ocrBusy ? '사진에서 글자를 읽는 중…' : ''}</p>
      ${draft ? `<div class="wk-draft"><p><b>이렇게 읽었어. 맞아?</b> · 틀린 칸은 눌러서 바로 고쳐줘${Object.keys(draftTeachers).length ? ` <small class="muted">(과목별 선생님 이름도 같이 저장돼)</small>` : ''}</p><div class="wk-draft-grid"><span></span>${days.map(d => `<b>${d}</b>`).join('')}${[0, 1, 2, 3, 4, 5, 6].map(j => `<b>${j + 1}</b>${[0, 1, 2, 3, 4].map(i => `<input data-draft="${i}-${j}" value="${esc(draft[i][j])}" maxlength="40" aria-label="${days[i]} ${j + 1}교시">`).join('')}`).join('')}</div>
        <p><button class="primary" data-tt-apply>맞아요, 저장</button> <button data-tt-cancel>다시 할래</button></p></div>` : ''}
    </section>`;
  }
  function setStatus(t) { const el = document.querySelector('[data-tt-status]'); if (el) el.textContent = t; }
  function loadScript(src) { return new Promise((ok, no) => { if (window.Tesseract) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  const J = 'https://cdn.jsdelivr.net/npm/';
  const OCR = { lib: J + 'tesseract.js@5.1.1/dist/tesseract.min.js', worker: J + 'tesseract.js@5.1.1/dist/worker.min.js', core: J + 'tesseract.js-core@5.1.1', lang: J + '@tesseract.js-data/kor@1.0.0/4.0.0_best_int' };
  function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  async function imageCanvas(file) {
    const bmp = await createImageBitmap(file); const scale = Math.min(3, Math.max(1, 1800 / bmp.width));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, c.width, c.height);
    const img = x.getImageData(0, 0, c.width, c.height), px = img.data; let sum = 0;
    for (let i = 0; i < px.length; i += 4) { const g = px[i] * .299 + px[i + 1] * .587 + px[i + 2] * .114; px[i] = px[i + 1] = px[i + 2] = g; px[i + 3] = 255; sum += g; }
    x.putImageData(img, 0, 0);                                        // 글자 읽기는 회색조로
    const thr = Math.min(200, (sum / (px.length / 4)) * .78), bin = new Uint8Array(c.width * c.height);
    for (let i = 0, k = 0; i < px.length; i += 4, k++) bin[k] = px[i] < thr ? 1 : 0;   // 표 선·글줄 찾기는 흑백으로
    return { c, x, bin };
  }
  function textBands(bin, w, left, top, width, height) {
    const bands = []; let start = -1;
    for (let y = top; y < top + height; y++) {
      let n = 0; for (let X = left; X < left + width; X++) n += bin[y * w + X];
      if (n > 1 && start < 0) start = y; else if (n <= 1 && start >= 0) { if (y - start > 5) bands.push([start, y]); start = -1; }
    }
    if (start >= 0 && top + height - start > 5) bands.push([start, top + height]);
    return bands;
  }
  function gridLines(bin, w, h) {
    const dark = (X, Y) => bin[Y * w + X] === 1;
    const rowsL = [], colsL = [];
    for (let y = 0; y < h; y++) { let n = 0; for (let X = 0; X < w; X++) if (dark(X, y)) n++; if (n > w * .5) rowsL.push(y); }
    for (let X = 0; X < w; X++) { let n = 0; for (let y = 0; y < h; y++) if (dark(X, y)) n++; if (n > h * .5) colsL.push(X); }
    const group = a => a.reduce((g, v) => { const last = g[g.length - 1]; if (last && v - last[1] <= 4) last[1] = v; else g.push([v, v]); return g; }, []);
    return { rows: group(rowsL), cols: group(colsL) };
  }
  async function ocr(file) {
    if (ocrBusy) return; ocrBusy = true; setStatus('사진에서 글자를 읽는 중… (처음엔 30초쯤 걸려)');
    try {
      await loadScript(OCR.lib);
      const { c, bin } = await imageCanvas(file);
      const worker = await Tesseract.createWorker('kor', 1, { workerPath: OCR.worker, corePath: OCR.core, langPath: OCR.lang });
      const { rows, cols } = gridLines(bin, c.width, c.height);
      if (cols.length && cols[cols.length - 1][1] < c.width - 12) cols.push([c.width - 1, c.width - 1]);
      let text = '';
      if (rows.length >= 4 && cols.length >= 5) {            // 표 선이 보이면 칸마다 따로 읽기
        await worker.setParameters({ tessedit_pageseg_mode: '7' });
        const r0 = rows.length - 1 >= 8 ? 1 : 0, k0 = cols.length - 1 >= 6 ? 1 : 0;   // 머리줄(요일)·교시 칸 건너뛰기
        const lines = [], total = (rows.length - 1 - r0) * (cols.length - 1 - k0); let done = 0;
        for (let r = r0; r < rows.length - 1; r++) {
          const cells = [];
          for (let k = k0; k < cols.length - 1; k++) {
            const left = cols[k][1] + 3, top = rows[r][1] + 3, width = cols[k + 1][0] - left - 3, height = rows[r + 1][0] - top - 3;
            const parts = [];
            if (width > 8 && height > 8) for (const [y0, y1] of textBands(bin, c.width, left, top, width, height).slice(0, 3)) {
              const { data } = await worker.recognize(c, { rectangle: { left, top: Math.max(0, y0 - 4), width, height: Math.min(c.height - y0, y1 - y0 + 8) } });
              const tx = data.text.replace(/\s+/g, ' ').trim(); if (/[가-힣]/.test(tx)) parts.push(tx.replace(/\s+/g, ''));
            }
            cells.push(parts.join(' ')); setStatus('칸 읽는 중… ' + Math.round(++done / total * 100) + '%');
          }
          lines.push(cells.slice(0, 5).join('\t'));   // 월~금 5칸만 (오른쪽 여백 칸 제외)
        }
        text = lines.join('\n');
      } else {                                               // 선이 없으면 통째로 읽기
        await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
        const { data } = await worker.recognize(c);
        text = data.text;
      }
      await worker.terminate();
      window.__ttOcrText = text;                              // 확인용(화면에는 안 보임)
      const g = parseTable(text);
      draft = g || Array.from({ length: 5 }, () => Array(7).fill(''));
      ocrBusy = false; render();
      notice(g ? '시간표를 읽었어. 사진 읽기는 틀릴 수 있으니 칸을 한 번 확인하고 적용해줘.' : '사진에서 표를 못 읽었어. 빈 칸에 직접 적거나 붙여넣기를 써줘.');
    } catch (e) { ocrBusy = false; setStatus('사진 읽기에 실패했어. 인터넷 연결을 확인하거나 붙여넣기를 써줘.'); }
  }

  /* ---------- 오늘 탭 정리: 학교 한 줄 → 오늘 할 3개 → 오늘 수업 → 예습 → 할 일 → 나머지 ---------- */
  let openCourse = false;
  function arrangeToday() {
    const next = root.querySelector('.next-card'), grid = root.querySelector('.grid');
    const strip = document.createElement('section'); strip.id = 'school-today'; strip.setAttribute('data-compact', ''); strip.className = 'today-strip';
    root.insertAdjacentElement('afterbegin', strip);
    strip.insertAdjacentHTML('beforebegin', '<a class="wk-glance" href="today.html">📋 오늘 한눈에 보기 <small>수업·학원·복습·예습을 한 장으로</small></a>');
    if (next) strip.insertAdjacentElement('afterend', next);
    let anchor = next || strip;
    if (grid) {
      const [lessonCard, taskCard] = grid.children;
      if (lessonCard) {
        const rows = [...lessonCard.querySelectorAll('.row')];
        if (rows.length) {
          const chips = rows.map(r => { const [n, sbj] = r.children; return `<li><b>${esc(n.textContent.replace('교시', ''))}</b>${esc(sbj.textContent)}</li>`; }).join('');
          rows.forEach(r => r.remove()); lessonCard.querySelector('p.muted')?.remove();
          lessonCard.querySelector('h2')?.insertAdjacentHTML('afterend', `<ul class="lesson-chips">${chips}</ul>`);
        }
        const acs = typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.forDay(today()) : [];
        if (acs.length) lessonCard.insertAdjacentHTML('beforeend', `<p class="wk-ac-today">🏫 오늘 학원 · ${acs.map(a => esc((a.start ? a.start + ' ' : '') + a.name)).join(', ')}</p>`);
        anchor.insertAdjacentElement('afterend', lessonCard); anchor = lessonCard;
      }
      if (hasTable()) { anchor.insertAdjacentHTML('afterend', prepCard()); anchor = anchor.nextElementSibling; }
      if (taskCard) { anchor.insertAdjacentElement('afterend', taskCard); anchor = taskCard; }
      grid.remove();
    }
    const weekCard = [...root.querySelectorAll('section.card')].find(c => /이번 주 챙길 것/.test(c.querySelector('h2')?.textContent || ''));
    if (weekCard) {
      const n = weekCard.querySelectorAll('.row').length, d = document.createElement('details'); d.className = 'card wk-fold';
      d.innerHTML = `<summary>📌 이번 주 챙길 것 ${n ? '(' + n + ')' : ''}</summary>`; weekCard.querySelector('h2')?.remove();
      while (weekCard.firstChild) d.appendChild(weekCard.firstChild);
      weekCard.replaceWith(d);
    }
    if (typeof FC_ROUTE !== 'undefined') { const rc = FC_ROUTE.card(today(), { quiet: true }); if (rc) root.insertAdjacentHTML('beforeend', rc); }   // 이동은 맨 아래(공부 먼저)
  }

  /* ---------- 시간표 보기(읽기 전용) ---------- */
  function timetableView() {
    if (!hasTable()) return '<section class="card"><h2>🗓️ 시간표</h2><p class="muted">아직 시간표가 없어.</p><button data-go="settings" class="primary">⚙️ 설정에서 시간표 올리기</button></section>';
    const times = (typeof FC_SCHOOL !== 'undefined' && FC_SCHOOL.config.periods) || [], teachers = lsGet(TEACHER_KEY, {}) || {};
    const n = Math.max(...state.table.map(r => { let k = r.length; while (k && !r[k - 1]) k--; return k; }));
    const tw = wdOf(today()) - 1, ac = typeof FC_ACADEMY !== 'undefined' ? FC_ACADEMY.list() : [];
    const head = '<tr><th></th>' + days.map((d, i) => `<th class="${i === tw ? 'now' : ''}">${d}</th>`).join('') + '</tr>';
    const rows = [...Array(n)].map((_, j) => `<tr><th><b>${j + 1}</b><small>${esc(times[j] || '')}</small></th>` + [0, 1, 2, 3, 4].map(i => { const s = state.table[i][j] || ''; return `<td class="${i === tw ? 'now' : ''}">${esc(s)}${s && teachers[s] ? `<small>${esc(teachers[s])}</small>` : ''}</td>`; }).join('') + '</tr>').join('');
    const acRow = ac.length ? '<tr class="ac"><th>학원</th>' + [1, 2, 3, 4, 5].map(w => `<td>${ac.filter(a => a.days.includes(w)).map(a => `<span>${esc(a.start || '')} ${esc(a.name)}${a.from && a.from > today() ? `<small>${Number(a.from.slice(5, 7))}/${Number(a.from.slice(8))}~</small>` : ''}</span>`).join('')}</td>`).join('') + '</tr>' : '';
    const weekend = ac.filter(a => a.days.includes(6) || a.days.includes(0));
    return `<section class="card tt-view"><div class="section-title"><h2>🗓️ 시간표</h2><button data-go="settings">⚙️ 바꾸기</button></div>
      <div class="tt-scroll"><table class="tt">${head}${rows}${acRow}</table></div>
      ${weekend.length ? `<p class="muted">주말 학원 · ${weekend.map(a => esc(a.when ? a.name : FC_ACADEMY.when(a) + ' ' + a.name)).join(', ')}</p>` : ''}</section>`;
  }

  /* ---------- 설정: 시간표·교재·학원·이동·쉬는 날·가족·보안 ---------- */
  function settingsView() {
    const editor = root.querySelector('section.card .days')?.closest('section'), cp = root.querySelector('#course-panel');
    root.innerHTML = `<div class="set-top"><button type="button" class="set-back" data-go="today" aria-label="뒤로">←</button><h1>설정</h1></div>
      <nav class="set-jump" aria-label="설정 바로가기">${[['set-tt', '시간표'], ['course-panel', '교과서'], ['academy-panel', '학원'], ['route-settings', '이동'], ['offday-panel', '쉬는 날'], ['set-profile', '프로필'], ['set-family', '가족·잠금']].map(([id, t]) => `<a href="#${id}" data-jump="${id}">${t}</a>`).join('')}</nav>`;
    const tt = document.createElement('div'); tt.id = 'set-tt';
    tt.innerHTML = hasTable() && !draft && !ocrBusy ? `<details class="card wk-fold"><summary>📤 시간표 다시 올리기 (사진·붙여넣기·나이스)</summary>${uploadPanel().replace('<section class="card wk-upload">', '<section class="wk-upload">')}</details>` : uploadPanel();
    root.appendChild(tt);
    if (editor) { const h = editor.querySelector('h2'); if (h) h.textContent = '✏️ 시간표 직접 고치기'; root.appendChild(editor); }
    if (cp) { const s0 = cp.querySelector('summary'); if (s0) s0.textContent = '📖 교과서·단원 고르기 (예습이 정확해져)'; root.appendChild(cp); if (openCourse) { cp.open = true; openCourse = false; setTimeout(() => cp.scrollIntoView({ block: 'start' }), 30); } }
    if (typeof FC_ACADEMY !== 'undefined') root.insertAdjacentHTML('beforeend', FC_ACADEMY.panel());
    if (typeof FC_ROUTE !== 'undefined') root.insertAdjacentHTML('beforeend', FC_ROUTE.settingsPanel());
    root.insertAdjacentHTML('beforeend', offdayPanel());
    const fam = typeof FamilySync !== 'undefined' && FamilySync.joined(), who = typeof PinGate !== 'undefined' ? PinGate.who() : '';
    const av = r => (typeof FC_CHAR !== 'undefined' ? FC_CHAR.avatar(r, 64) : '');
    root.insertAdjacentHTML('beforeend', `<section class="card" id="set-profile"><h2>프로필 그림</h2>
      <div class="pf-row">${['child', 'parent'].map(r => `<div class="pf"><div class="pf-img">${av(r)}</div><b>${r === 'parent' ? '엄마' : '승준'}</b>
        <div class="pf-btns"><button type="button" data-pf-pick="${r}">그림 고르기</button>${typeof FC_CHAR !== 'undefined' && FC_CHAR.custom(r) ? `<button type="button" class="pf-reset" data-pf-reset="${r}">기본으로</button>` : ''}</div></div>`).join('')}</div>
      <p class="muted small">폰에 있는 그림·사진을 고르면 들어가기 화면과 상단에 나와. GIF는 작은 파일이면 움직이는 그대로 써.</p>
      <input type="file" accept="image/*" data-pf-file hidden></section>`);
    root.insertAdjacentHTML('beforeend', `<section class="card" id="set-family"><h2>가족·잠금</h2>
      <div class="set-list">
        <button type="button" data-set-act="who"><span>지금 쓰는 사람</span><b>${who === 'parent' ? '엄마' : '승준'} ›</b></button>
        <button type="button" data-set-act="family"><span>가족 공유</span><b>${fam ? '연결됨' : '연결하기 ›'}</b></button>
        <button type="button" data-set-act="pin"><span>비밀번호·복구 질문 바꾸기</span><b>›</b></button>
        <button type="button" data-set-act="lock"><span>지금 잠그기</span><b>🔒</b></button>
        <button type="button" data-set-act="backup"><span>백업 파일로 저장</span><b>›</b></button>
        <button type="button" data-set-act="restore"><span>백업 불러오기</span><b>›</b></button>
      </div></section>
      <section class="card" id="set-links"><h2>다른 화면</h2><div class="set-list">
        <a href="today.html"><span>📋 오늘 한눈에 (엄마도 같이 보는 한 장)</span><b>›</b></a>
        <a href="./"><span>🧭 미래 나침반 (진로 탐색)</span><b>›</b></a>
        <a href="hub.html"><span>📚 공부 자료 허브</span><b>›</b></a>
      </div></section>`);
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.go === 'settings'));
  }

  /* ---------- 연결 ---------- */
  const prevRender = render;
  render = function () {
    if (tab === 'week') { prevRender(); root.innerHTML = weekView(); return; }
    if (tab === 'settings') { tab = 'table'; prevRender(); tab = 'settings'; settingsView(); return; }
    prevRender();
    if (tab === 'today') arrangeToday();
    if (tab === 'table') root.innerHTML = timetableView();
  };
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.prep) { setPrep(t.dataset.prep, t.dataset.subject, t.checked); const all = document.querySelectorAll('[data-prep="' + t.dataset.prep + '"]'); if ([...all].every(x => x.checked || x.closest('.light'))) notice('예습 끝! 내일 수업이 훨씬 잘 들릴 거야 🐾'); }
    if (t.matches('[data-tt-image]') && t.files[0]) ocr(t.files[0]);
    if (t.matches('form[data-plus="course"] select[name="book"]')) { const box = t.form.querySelector('.book-custom'); if (box) { box.hidden = t.value !== '__custom'; if (!box.hidden) box.querySelector('input')?.focus(); } }
    if (t.matches('form[data-plus="course"] select[name="unit"]')) { const box = t.form.querySelector('.unit-custom'); if (box) { box.hidden = t.value !== '__custom'; if (!box.hidden) box.querySelector('input')?.focus(); } }
  });
  document.addEventListener('input', e => { const k = e.target.dataset.draft; if (k && draft) { const [i, j] = k.split('-').map(Number); draft[i][j] = e.target.value.slice(0, 40); } });
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-go-course')) { openCourse = true; tab = 'settings'; history.replaceState(null, '', '#settings'); render(); window.scrollTo(0, 0); return; }
    if (b.dataset.setAct) {
      const k = b.dataset.setAct;
      if (typeof PinGate !== 'undefined') {
        if (k === 'who') PinGate.switchWho();
        if (k === 'pin') PinGate.changePin();
        if (k === 'lock') PinGate.lock();
        if (k === 'family') { if (typeof FamilySync !== 'undefined' && FamilySync.joined()) notice('이미 가족 공유 중이야. 엄마 폰과 같은 기록을 써.'); else PinGate.joinFamily(); }
      }
      if (k === 'backup') document.getElementById('study-backup')?.click();
      if (k === 'restore') document.getElementById('study-restore')?.click();
      return;
    }
    if (b.dataset.week !== undefined) { const v = Number(b.dataset.week); weekOffset = v === 0 ? 0 : Math.max(-4, Math.min(20, weekOffset + v)); render(); }
    if (b.hasAttribute('data-tt-paste-open')) { const box = document.querySelector('[data-tt-paste]'); if (box) { box.hidden = !box.hidden; box.querySelector('textarea')?.focus(); } }
    if (b.hasAttribute('data-tt-parse')) { const g = parseTable(document.querySelector('[data-tt-text]')?.value); if (!g) { notice('표 모양을 못 찾았어. 요일이나 교시별로 줄을 나눠서 붙여줘.'); return; } draft = g; render(); }
    if (b.hasAttribute('data-tt-neis')) { const c = (typeof FC_SCHOOL !== 'undefined' && FC_SCHOOL.config.classNo) || ''; const g = fromNeis(c); if (!g) { notice('이번 주 나이스 시간표가 아직 없어.'); return; } try { localStorage.setItem('fc_school_class', c); } catch {} draft = g; render(); }
    if (b.hasAttribute('data-tt-cancel')) { draft = null; render(); }
    if (b.hasAttribute('data-tt-apply') && draft) {
      if (hasTable() && !confirm('지금 시간표를 새 시간표로 바꿀까? (준비물 메모는 그대로야)')) return;
      state.table = draft.map(r => r.map(s => String(s || '').trim().slice(0, 40))); draft = null;
      const used = new Set(state.table.flat().filter(Boolean)), keep = {}; for (const [k, v] of Object.entries(draftTeachers)) if (used.has(k)) keep[k] = String(v).slice(0, 10);
      if (Object.keys(keep).length) lsSet(TEACHER_KEY, keep);
      if (save()) { notice('시간표 적용 완료! 이번 주 탭에서 주간 스케줄과 예습을 확인해봐.'); tab = 'week'; history.replaceState(null, '', '#week'); render(); }
    }
    if (b.dataset.offdayDel && CAL()) { CAL().removeOwn(b.dataset.offdayDel); }
  });
  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.matches('[data-offday]')) { e.preventDefault(); const d = new FormData(f), date = String(d.get('date')); if (!valid(date) || !CAL()) return; CAL().addOwn(date, String(d.get('name') || '').trim() || '쉬는 날'); notice(label(date) + '을 쉬는 날로 넣었어.'); return; }
    // 시험·과제 날짜가 쉬는 날이면 알려주기
    const dateInput = f.matches('[data-form="dates"],[data-plus="exam"]') ? f.querySelector('input[type=date]') : null;
    if (dateInput && valid(dateInput.value)) { const o = offDay(dateInput.value); if (o) setTimeout(() => notice('⚠ ' + label(dateInput.value) + '은 ' + o.name + '이야. 날짜가 맞는지 한 번 더 확인해줘.'), 60); }
  }, true);
  if (CAL()) CAL().onUpdate(() => { if (['week', 'today'].includes(tab)) render(); });
  fetch('school.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(s => { school = s; if (tab === 'table') render(); }).catch(() => {});

  const css = document.createElement('style');
  css.textContent = `.wk-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-top:10px}.wk-day.wkend{background:#fbfaff}.wk-life{font-size:12.5px;color:#5b5772;margin:4px 0}
  .wk-day{border:1px solid #e4daf4;border-radius:16px;padding:10px 10px 12px;background:#fff;min-width:0;font-size:13.5px}
  .wk-day header{display:flex;gap:6px;align-items:baseline;margin-bottom:6px}.wk-day header b{font-size:16px}.wk-day header em{font-style:normal;font-size:11px;background:#5b3fd6;color:#fff;border-radius:999px;padding:2px 7px;margin-left:auto}
  .wk-day.today{border-color:#5b3fd6;box-shadow:0 0 0 2px #e7defd}.wk-day.off{background:#f1f8f4;border-color:#cfe8da}
  .wk-offname{color:#2f7a52;font-weight:700;margin:4px 0}.wk-offname small{font-weight:500;color:#5f7d6c}
  .wk-classes{margin:0;padding-left:1.3em;display:grid;gap:1px}.wk-classes li::marker{color:#9a8fc0;font-size:11px}
  .wk-ev,.wk-due,.wk-rv,.wk-eve{margin:6px 0 0;font-size:12.5px;line-height:1.45}.wk-due{color:#7a3fd6;font-weight:700}.wk-due.clash,.wk-day.off .wk-ev{color:#b4475a}
  .wk-eve{color:#4a5568;border-top:1px dashed #e4daf4;padding-top:6px}.wk-ev small,.wk-due small,.wk-eve small{font-weight:500}
  .wk-nav{display:inline-flex;gap:4px}.wk-nav button{padding:4px 10px}
  .wk-warn{background:#fff6e5;border-radius:12px;padding:10px 12px;font-size:13.5px}
  .wk-prep-item{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f0ebf8}.wk-prep-item input{margin-top:4px;width:18px;height:18px}
  .wk-prep-item span{display:grid;gap:2px}.wk-prep-item small{color:#667085}.wk-prep-item.light{opacity:.7}.wk-note{font-size:12px;color:#8a839a}.wk-bag{margin:8px 0 0;font-size:13.5px}.wk-next{color:#5b3fd6!important}.wk-book{color:#2f7a52}.wk-ac{margin:6px 0 0;font-size:12.5px;color:#1f6b5a;font-weight:700}.wk-weekend{margin:10px 0 0;font-size:13px;color:#1f6b5a}.wk-ac-today{margin:8px 0 0;font-size:14px;color:#1f6b5a;font-weight:700}.wk-glance{display:block;margin:0 0 12px;padding:12px 14px;border-radius:16px;background:#2b2160;color:#fff!important;font-weight:700}.wk-glance small{display:block;font-weight:500;opacity:.8;font-size:12.5px}.tt-scroll{overflow-x:auto}.tt{width:100%;border-collapse:collapse;font-size:13.5px;min-width:330px}.tt th,.tt td{border:1px solid #ebe6f5;padding:6px 4px;text-align:center;vertical-align:middle}.tt th small,.tt td small{display:block;font-size:10.5px;color:#8a839a;font-weight:400}.tt thead th,.tt tr:first-child th{background:#f6f3ff}.tt .now{background:#efe9ff}.tt tr.ac td span{display:block;font-size:11.5px;color:#1f6b5a;font-weight:700}.set-jump{display:flex;flex-wrap:wrap;gap:6px}.set-jump a{font-size:13px;padding:6px 10px;border-radius:999px;background:#f3efff;color:#5b3fd6;text-decoration:none}.linkish{background:none;border:0;min-height:0;padding:0;color:#6250ce;text-decoration:underline;font:inherit;cursor:pointer}.wk-light{margin:8px 0 0;font-size:13px;color:#8a839a}.wk-hint{margin:12px 0 0;font-size:13.5px;background:#f6f3ff;border-radius:12px;padding:10px 12px}.wk-hint button{min-height:34px;padding:4px 10px;margin-left:4px}.wk-fold-in summary{cursor:pointer;font-size:13.5px;color:#6250ce;margin:6px 0}.wk-prep-item{padding:7px 0}
  .wk-up-ways{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.wk-file{cursor:pointer;display:inline-flex;align-items:center;padding:9px 14px;border-radius:12px;background:#5b3fd6;color:#fff;font-weight:700;font-size:14px}
  .wk-neis{display:inline-flex;gap:6px;align-items:center;font-size:14px}[data-tt-paste] textarea{width:100%;box-sizing:border-box;font:13px/1.5 ui-monospace,monospace}
  .wk-status{font-size:13px;color:#5b3fd6;min-height:1em;margin:4px 0}
  .wk-draft-grid{display:grid;grid-template-columns:28px repeat(5,minmax(0,1fr));gap:4px;align-items:center}.wk-draft-grid b{text-align:center;font-size:13px}.wk-draft-grid input{min-width:0;width:100%;box-sizing:border-box;padding:6px 4px;font-size:13px;border:1px solid #d9d0ee;border-radius:8px}
  @media(max-width:860px){.wk-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.wk-grid{grid-template-columns:1fr}.wk-classes{display:flex;flex-wrap:wrap;gap:4px 10px;padding-left:1.1em}.wk-classes li{margin-right:6px}}
  @media(prefers-color-scheme:dark){.wk-day{background:#1c1a29;border-color:#2e2b41}.wk-day.off{background:#1a2a22;border-color:#2b4436}.wk-warn{background:#3a3020}.wk-eve{color:#b9b4c9}}`;
  document.head.appendChild(css);
  if (tab === 'week' || tab === 'today' || tab === 'table') render();
})();
