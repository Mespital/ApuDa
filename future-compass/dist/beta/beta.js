/* 학교나침반 베타: 이번 주 달력(빨간 날) · 학교 검색 · 오늘의 학교 체험 · 대기자 신청 */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAL = window.FC_CAL;
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const today = () => CAL ? CAL.today() : new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const add = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  const wd = d => new Date(d + 'T12:00:00Z').getUTCDay();
  const md = d => { const x = new Date(d + 'T12:00:00Z'); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate(); };
  const label = d => md(d) + '(' + WD[wd(d)] + ')';
  const ymd = d => d.replace(/-/g, '');
  const iso = s => s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const FLAG = { 1: 'ONE_GRADE_EVENT_YN', 2: 'TW_GRADE_EVENT_YN', 3: 'THREE_GRADE_EVENT_YN' };

  async function neis(params) {
    const r = await fetch('/api/neis?' + new URLSearchParams(params));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'http ' + r.status);
    return j;
  }

  /* 이번 주 달력 (월~일, 빨간 날) */
  function week() {
    const t = today(), w = wd(t), mon = add(t, w === 0 ? -6 : 1 - w);
    const days = [...Array(7)].map((_, i) => add(mon, i));
    $('#week').innerHTML = `<p class="week-cap">${md(days[0])} ~ ${md(days[6])}</p><ol>${days.map(d => {
      const o = CAL ? CAL.offDay(d) : null, holiday = o && !o.weekend, k = wd(d);
      const cls = [holiday || k === 0 ? 'red' : k === 6 ? 'sat' : '', d === t ? 'now' : ''].join(' ').trim();
      return `<li class="${cls}"><span class="dw">${WD[k]}</span><span class="dn">${new Date(d + 'T12:00:00Z').getUTCDate()}</span><span class="dl">${holiday ? esc(o.name) : d === t ? '오늘' : ''}</span></li>`;
    }).join('')}</ol>${(() => { const next = CAL ? CAL.upcoming(add(days[6], 1), 60).slice(0, 2) : []; return next.length ? `<p class="week-next">다음 빨간 날 ${next.map(x => esc(label(x.date) + ' ' + x.name)).join(', ')}</p>` : ''; })()}`;
  }

  /* 학교 검색 */
  let chosen = lsGet('sc_school');
  async function search(q) {
    const box = $('#results');
    box.innerHTML = '<li class="muted">찾는 중…</li>';
    try {
      const { rows } = await neis({ svc: 'schoolInfo', SCHUL_NM: q, SCHUL_KND_SC_NM: '고등학교' });
      if (!rows.length) { box.innerHTML = '<li class="muted">"' + esc(q) + '" 이름의 고등학교가 없어요. 학교 이름을 두 글자 이상 다시 입력해 주세요.</li>'; return; }
      box.innerHTML = rows.slice(0, 12).map((r, i) => `<li><button type="button" data-i="${i}"><b>${esc(r.SCHUL_NM)}</b><span>${esc(r.ORG_RDNMA || r.LCTN_SC_NM || '')}</span></button></li>`).join('');
      box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        const r = rows[Number(b.dataset.i)];
        chosen = { name: r.SCHUL_NM, atpt: r.ATPT_OFCDC_SC_CODE, code: r.SD_SCHUL_CODE, home: r.HMPG_ADRES || '', grade: Number($('#grade').value) };
        lsSet('sc_school', chosen); box.innerHTML = ''; board();
      }));
    } catch (e) {
      box.innerHTML = '<li class="muted">학교 목록을 불러오지 못했어요. 잠시 뒤 다시 찾아 주세요.</li>';
    }
  }

  /* 오늘의 학교 체험 */
  async function board() {
    if (!chosen) return;
    const el = $('#board'); el.hidden = false;
    const g = Number($('#grade').value) || chosen.grade || 1; chosen.grade = g; lsSet('sc_school', chosen);
    const f = document.querySelector('#join-form');
    f.school.value = chosen.name; f.schoolCode.value = chosen.atpt + '-' + chosen.code; f.grade.value = '고' + g;
    el.innerHTML = `<div class="board-head"><h3>${esc(chosen.name)} ${g}학년</h3><button type="button" class="link" id="change">다른 학교</button></div><p class="muted">불러오는 중…</p>`;
    $('#change').onclick = () => { el.hidden = true; $('#q').focus(); };
    const t = today(), mon = add(t, wd(t) === 0 ? -6 : 1 - wd(t));
    const base = { ATPT_OFCDC_SC_CODE: chosen.atpt, SD_SCHUL_CODE: chosen.code };
    const [sch, meal] = await Promise.allSettled([
      neis({ svc: 'SchoolSchedule', ...base, AA_FROM_YMD: ymd(t), AA_TO_YMD: ymd(add(t, 60)) }),
      neis({ svc: 'mealServiceDietInfo', ...base, MLSV_FROM_YMD: ymd(mon), MLSV_TO_YMD: ymd(add(mon, 11)) }),
    ]);
    const off = CAL ? CAL.offDay(t) : null;
    // 급식
    let mealHtml = '<p class="muted">급식 정보를 불러오지 못했어요.</p>';
    if (meal.status === 'fulfilled') {
      const meals = meal.value.rows.map(r => ({ date: iso(r.MLSV_YMD), kind: r.MMEAL_SC_NM, dishes: String(r.DDISH_NM || '').split(/<br\s*\/?>/).map(s => s.replace(/\([0-9.\s]+\)/g, '').trim()).filter(Boolean) })).sort((a, b) => a.date.localeCompare(b.date));
      const td = meals.filter(m => m.date === t), nx = meals.find(m => m.date > t);
      mealHtml = td.length ? td.map(m => `<p><b>${esc(m.kind)}</b> ${m.dishes.map(esc).join(', ')}</p>`).join('')
        : nx ? `<p class="muted">오늘은 급식이 없어요.</p><p><b>${esc(label(nx.date))}</b> ${nx.dishes.slice(0, 5).map(esc).join(', ')}</p>` : '<p class="muted">이번 주 급식 정보가 아직 없어요.</p>';
    }
    // 학사일정
    let evHtml = '<p class="muted">학사일정을 불러오지 못했어요.</p>', partial = false;
    if (sch.status === 'fulfilled') {
      partial = !sch.value.keyed;
      const evs = sch.value.rows.filter(r => r[FLAG[g]] === 'Y' && r.EVENT_NM && r.EVENT_NM !== '토요휴업일').map(r => ({ date: iso(r.AA_YMD), title: r.EVENT_NM, off: /휴업일|공휴일/.test(r.SBTR_DD_SC_NM || '') })).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
      evHtml = evs.length ? '<ul class="ev">' + evs.map(e => {
        const o = CAL ? CAL.offDay(e.date) : null, clash = !e.off && o && !o.weekend;
        return `<li class="${e.off ? 'red' : ''}"><b>${esc(label(e.date))}</b> ${esc(e.title)}${clash ? `<em>${esc(o.name)}과 겹쳐요. 학교 공지를 확인해 주세요.</em>` : ''}</li>`;
      }).join('') + '</ul>' : `<p class="muted">앞으로 60일 안에 ${g}학년 일정이 아직 없어요.</p>`;
    }
    const rest = CAL ? CAL.upcoming(add(t, 1), 90).slice(0, 4) : [];
    el.innerHTML = `<div class="board-head"><h3>${esc(chosen.name)} ${g}학년</h3><button type="button" class="link" id="change">다른 학교</button></div>
      ${off && !off.weekend ? `<p class="today-off">오늘은 ${esc(off.name)}, 수업이 없는 빨간 날이에요.</p>` : ''}
      <div class="board-grid">
        <section><h4>급식</h4>${mealHtml}</section>
        <section><h4>${g}학년 학사일정</h4>${evHtml}</section>
        <section><h4>다가오는 쉬는 날</h4>${rest.length ? '<ul class="ev">' + rest.map(r => `<li class="red"><b>${esc(label(r.date))}</b> ${esc(r.name)}</li>`).join('') + '</ul>' : '<p class="muted">90일 안에 공휴일이 없어요.</p>'}</section>
      </div>
      ${partial ? '<p class="note">체험 화면은 나이스 공개 샘플이라 일정이 일부만 보일 수 있어요. 정식 버전에서는 전체 일정이 들어옵니다.</p>' : ''}
      <p class="note">시험·행사 날짜는 학교 공지가 우선이에요. ${chosen.home ? `<a href="${esc(chosen.home)}" target="_blank" rel="noopener">학교 홈페이지 열기</a>` : ''}</p>
      <a class="btn ghost" href="#join">이 학교로 대기자 신청하기</a>`;
    $('#change').onclick = () => { el.hidden = true; $('#q').focus(); };
  }

  $('#pick').addEventListener('submit', e => { e.preventDefault(); const q = $('#q').value.trim(); if (q.length >= 2) search(q); });
  $('#grade').addEventListener('change', () => { if (chosen && !$('#board').hidden) board(); });

  /* 대기자 신청 */
  $('#join-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, msg = $('#join-msg'), btn = f.querySelector('button[type=submit]');
    const body = { email: f.email.value.trim(), role: f.role.value, grade: f.grade.value, school: f.school.value.trim(), schoolCode: f.schoolCode.value, wish: f.wish.value.trim(), website: f.website.value, adult: f.adult.checked, agree: f.agree.checked };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email)) { msg.textContent = '이메일 주소를 다시 확인해 주세요.'; f.email.focus(); return; }
    if (!body.adult || !body.agree) { msg.textContent = '보호자 확인과 개인정보 동의에 체크해 주세요.'; return; }
    btn.disabled = true; msg.textContent = '신청하는 중…';
    try {
      const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || '신청을 저장하지 못했어요.');
      f.reset(); msg.textContent = '대기자 신청이 완료됐어요. 베타가 열리면 입력하신 이메일(' + body.email + ')로 알려 드릴게요.'; msg.classList.add('ok');
    } catch (err) { msg.textContent = (err.message || '신청을 저장하지 못했어요.') + ' 잠시 뒤 다시 시도해 주세요.'; }
    btn.disabled = false;
  });

  week();
  if (CAL) CAL.onUpdate(week);
  if (chosen) { $('#grade').value = String(chosen.grade || 1); board(); }
})();
