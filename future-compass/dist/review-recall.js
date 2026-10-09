/* 🧠 기억 확인(능동적 회상) + 엄마 화면 "오늘의 승준"
   - 다시 보기 항목을 누르면: 노트 안 보고 질문에 답 → 정리 보기 → 잘 앎/헷갈림/모름
   - 답에 따라 다음 다시 보기 날짜를 조절 (잘 앎: 간격 2배(7~60일), 헷갈림: 2일 뒤, 모름: 내일+3일 뒤)
   - 기록: fc_planner P.recall[reviewId] = [{d, r}]  (r: good|meh|bad)
   - 엄마 화면 맨 위 "오늘의 승준": 실제 기록으로만 문장을 만들고, 추천 응원도 기록 근거로 고름 */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  function isParent() { return typeof PinGate !== 'undefined' && PinGate.who() === 'parent'; }
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function diff(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }
  function FP() { return window.FC_PLANNER; }
  function P() { return FP() ? FP().get() : {}; }

  /* ---------- 질문·정리 꺼내기 ---------- */
  function noteOf(r) {
    var ns = (ls('fc_notes_v1', []) || []).filter(function (n) { return n && n.review === r.id; });
    return ns[ns.length - 1] || null;
  }
  function section(text, mark) {
    var lines = String(text || '').split('\n'), out = [], on = false;
    lines.forEach(function (l) {
      if (/^\s*(📌|🔑|❓|➡️)/.test(l)) { on = l.indexOf(mark) >= 0; return; }
      if (on && l.trim()) out.push(l.replace(/^[\s\-•·*]+/, '').trim());
    });
    return out;
  }
  function questions(r) {
    var n = noteOf(r), src = (n && n.sum) || r.note || '', q = section(src, '❓').slice(0, 3);
    if (q.length) return q;
    var topic = r.title || '오늘 배운 것';
    return [topic + '에서 제일 중요한 개념 하나를 내 말로 설명해봐.', '그게 왜 그런지(이유·원리)를 한 문장으로 말해봐.', '헷갈리거나 틀리기 쉬운 부분은 어디였어?'];
  }
  function answerText(r) {
    var n = noteOf(r), src = (n && n.sum) || '', key = section(src, '📌'), terms = section(src, '🔑');
    if (key.length || terms.length) return (key.length ? '📌 핵심\n- ' + key.join('\n- ') : '') + (terms.length ? '\n🔑 용어\n- ' + terms.join('\n- ') : '');
    return String(r.note || (n && n.text) || '').trim() || '정리된 내용이 없어. 교과서·노트를 펴서 확인해봐.';
  }

  /* ---------- 다음 날짜 정하기 ---------- */
  function reschedule(rid, due, rating) {
    var p = P(), t = today(); p.again = p.again || {}; p.againDone = p.againDone || {}; p.recall = p.recall || {};
    var r = state.reviews.find(function (x) { return x.id === rid; }) || {};
    p.againDone[rid + '@' + due] = 1;
    var hist = p.recall[rid] || (p.recall[rid] = []); hist.push({ d: t, r: rating }); if (hist.length > 12) hist.splice(0, hist.length - 12);
    var arr = (p.again[rid] || []).slice().sort(), past = arr.filter(function (d) { return d <= t; }), fut = arr.filter(function (d) { return d > t; });
    past.forEach(function (d) { p.againDone[rid + '@' + d] = 1; });   // 밀린 같은 복습도 함께 끝
    var prevDone = past.filter(function (d) { return d < due; }).pop(), last = prevDone || r.date || addD(due, -1), next;
    if (rating === 'good') {
      var iv = Math.min(60, Math.max(7, Math.max(1, diff(last, due)) * 2)); next = [addD(t, iv)];
      fut = fut.filter(function (d) { return d > next[0]; });          // 너무 가까운 다음 날짜는 뺀다
    } else if (rating === 'meh') {
      next = [addD(t, 2)]; fut = fut.filter(function (d) { return d > next[0]; });
    } else {
      next = [addD(t, 1), addD(t, 3)]; fut = fut.filter(function (d) { return d > next[1]; });
    }
    p.again[rid] = past.concat(next, fut).filter(function (d, i, a) { return a.indexOf(d) === i; }).sort().slice(-12);
    if (FP().save) FP().save();
    return next[0];
  }

  /* ---------- 시트 ---------- */
  var sheet = null;
  function close() { if (sheet) { sheet.remove(); sheet = null; } }
  function open(rid, due) {
    var r = state.reviews.find(function (x) { return x.id === rid; }); if (!r) return;
    close();
    var qs = questions(r), ai = window.SHIRO_AI && SHIRO_AI.on && SHIRO_AI.on();
    sheet = document.createElement('div'); sheet.className = 'rc-wrap'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', '기억 확인');
    sheet.innerHTML = '<div class="rc-sheet"><div class="rc-top"><b>🧠 기억 확인</b><button type="button" class="rc-x" data-rc-close aria-label="닫기">✕</button></div>' +
      '<p class="rc-title">' + esc((r.subject ? r.subject + ' · ' : '') + r.title) + '</p>' +
      '<p class="rc-how">노트는 덮고, 머릿속에서 꺼내서 답해봐. 말로 해도 되고 적어도 돼.</p>' +
      '<ol class="rc-qs">' + qs.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' +
      '<textarea class="rc-my" rows="3" maxlength="600" placeholder="(선택) 내 답 적기"></textarea>' +
      '<button type="button" class="primary rc-show" data-rc-show>정리 보고 맞춰보기</button>' +
      '<div class="rc-ans" hidden><pre>' + esc(answerText(r)) + '</pre>' +
      (ai ? '<button type="button" class="rc-ai" data-rc-ai>🧠 흰둥이에게 내 답 봐달라기</button><div class="rc-ai-out" hidden></div>' : '') +
      '<p class="rc-ask">어땠어?</p><div class="rc-rate">' +
      '<button type="button" data-rc-rate="good">😀<b>잘 앎</b><small>다음엔 더 나중에</small></button>' +
      '<button type="button" data-rc-rate="meh">🤔<b>헷갈림</b><small>2일 뒤 다시</small></button>' +
      '<button type="button" data-rc-rate="bad">😵<b>모름</b><small>내일 다시</small></button></div></div></div>';
    sheet.dataset.rid = rid; sheet.dataset.due = due;
    document.body.appendChild(sheet);
  }
  function aiCheck(btn) {
    var r = state.reviews.find(function (x) { return x.id === sheet.dataset.rid; }); if (!r) return;
    var my = sheet.querySelector('.rc-my').value.trim(), out = sheet.querySelector('.rc-ai-out');
    var q = my ? '복습 확인이야. 주제: ' + r.title + '\n질문: ' + questions(r).join(' / ') + '\n내 답: ' + my + '\n맞은 점, 빠진 점을 짧게 알려주고 정답은 2~3줄로 쉽게 설명해줘.'
      : '복습 확인이야. 주제: ' + r.title + '(' + (r.subject || '') + ')\n핵심 개념을 고1이 이해하게 3줄로 쉽게 설명해줘.';
    btn.disabled = true; btn.textContent = '🧠 보는 중… (최대 1~2분)'; out.hidden = false; out.textContent = '';
    SHIRO_AI.ask(q).then(function (a) { if (sheet) out.textContent = a || '지금은 답을 못 받았어. 정리 보고 스스로 맞춰봐.'; })
      .catch(function () { if (sheet) out.textContent = '지금은 흰둥이가 연결 안 돼. 정리 보고 스스로 맞춰봐.'; })
      .then(function () { if (sheet) { btn.disabled = false; btn.textContent = '🧠 다시 물어보기'; } });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rc-open],[data-rc-close],[data-rc-show],[data-rc-rate],[data-rc-ai]');
    if (!b) { if (sheet && e.target === sheet) close(); return; }
    var d = b.dataset;
    if (d.rcOpen) { e.preventDefault(); e.stopPropagation(); open(d.rcOpen, d.d); return; }
    if (b.hasAttribute('data-rc-close')) { close(); return; }
    if (b.hasAttribute('data-rc-show')) { sheet.querySelector('.rc-ans').hidden = false; b.hidden = true; return; }
    if (b.hasAttribute('data-rc-ai')) { aiCheck(b); return; }
    if (d.rcRate) {
      var next = reschedule(sheet.dataset.rid, sheet.dataset.due, d.rcRate), m = Number(next.slice(5, 7)) + '/' + Number(next.slice(8));
      close();
      notice(d.rcRate === 'good' ? '좋아! 다음 확인은 ' + m + '. 기억이 더 오래가 🧠' : d.rcRate === 'meh' ? '헷갈린 거 찾은 게 진짜 공부야. ' + m + '에 다시 볼게.' : '괜찮아, 모르는 걸 안 게 시작이야. 내일 다시 짧게 볼게.');
      setTimeout(render, 200);
    }
  }, true);

  /* ---------- 엄마 화면: 오늘의 승준 ---------- */
  function story() {
    var t = today(), fp = FP(), p = P(), share = p.share || {}, lines = [], recs = [];
    var L = fp ? fp.todays() : [], done = L.filter(function (x) { return x.t.done; });
    var foc = (p.focus || []).filter(function (f) { return f.date === t; }), fmin = foc.reduce(function (s, f) { return s + (f.min || 0); }, 0);
    var mood = ((ls('fc_kid_v1', {}) || {}).mood || {})[t];
    var hard = []; Object.keys(p.recall || {}).forEach(function (id) { var h = p.recall[id]; var x = h[h.length - 1]; if (x && x.d >= addD(t, -1) && x.r !== 'good') { var r = state.reviews.find(function (y) { return y.id === id; }); if (r) hard.push(r.subject || '복습'); } });
    hard = hard.filter(function (s, i, a) { return a.indexOf(s) === i; });
    var good = 0; Object.keys(p.recall || {}).forEach(function (id) { (p.recall[id] || []).forEach(function (x) { if (x.d === t && x.r === 'good') good++; }); });
    var notesT = (ls('fc_notes_v1', []) || []).filter(function (n) { return n && n.date === t; });
    var soon = state.dates.filter(function (x) { return !x.done && diff(t, x.date) >= 0 && diff(t, x.date) <= 2; }).sort(function (a, b) { return a.date.localeCompare(b.date); });

    if (L.length) lines.push(done.length === L.length ? '오늘 계획한 ' + L.length + '개를 모두 마쳤어요.' : done.length ? '오늘 계획한 ' + L.length + '개 중 ' + done.length + '개를 마쳤어요.' : '오늘 할 일 ' + L.length + '개를 정해뒀어요. 아직 시작 전이에요.');
    if (foc.length && share.flow) lines.push('집중 ' + foc.length + '번, 모두 ' + fmin + '분 했어요.');
    else if (foc.length) lines.push('오늘 집중 타이머를 썼어요.');
    if (notesT.length) lines.push(notesT.map(function (n) { return n.subject; }).filter(function (s, i, a) { return s && a.indexOf(s) === i; }).join('·') + ' 수업 정리를 남겼어요.');
    if (share.review && hard.length) lines.push(hard.join('·') + ' 복습에서 헷갈리는 부분이 있었어요.');
    else if (good) lines.push('복습 기억 확인을 ' + good + '개 했어요.');
    soon.forEach(function (x) { var g = diff(t, x.date); lines.push((g === 0 ? '오늘' : g === 1 ? '내일' : '모레') + '은 ' + (x.subject ? x.subject + ' ' : '') + x.title + (x.kind === '시험' ? '이 있어요.' : ' 준비가 필요해요.')); });
    if (mood === 'tired') lines.push('오늘 컨디션을 "지침"으로 남겼어요.');

    if (mood === 'tired') recs.push(['오늘은 많이 피곤했지. 충분히 쉬는 것도 공부야.', '컨디션을 "지침"으로 남겨서']);
    if (share.review && hard.length) recs.push(['어려운 부분은 내일 다시 해보면 돼. 오늘 찾은 것만으로도 충분해.', hard.join('·') + ' 복습이 헷갈렸다고 남겨서']);
    if (soon.some(function (x) { return x.kind === '시험'; })) recs.push(['시험 준비하는 데 필요한 거 있으면 말해줘.', '시험이 이틀 안이라서']);
    else if (soon.length) recs.push([soon[0].title + ' 준비하는 데 도울 거 있으면 말해줘.', '마감이 이틀 안이라서']);
    if (L.length && done.length === L.length) recs.push(['오늘 계획한 거 다 했네. 정말 수고했어.', '오늘 할 일을 모두 마쳐서']);
    else if (done.length) recs.push(['오늘도 수고했어. 남은 건 내일 해도 괜찮아.', '할 일 일부를 마쳐서']);
    if (notesT.length) recs.push(['수업 정리까지 해둔 거 멋지다.', '수업 정리를 남겨서']);
    if (!recs.length) recs.push(['오늘 하루 어땠어? 공부 얘기는 나중에 해도 돼.', '오늘 기록이 아직 적어서']);
    return { lines: lines, recs: recs.slice(0, 3) };
  }
  function storyCard() {
    var s = story();
    return '<section class="card pv-story"><h2>🌼 오늘의 승준</h2>' +
      (s.lines.length ? '<ul class="pv-story-l">' + s.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '<p class="muted">오늘은 아직 남긴 기록이 없어요. 기록이 없다고 공부하지 않은 건 아니에요.</p>') +
      '<p class="pv-rocks-h">엄마에게 추천하는 한마디</p><ul class="pv-rec">' + s.recs.map(function (r) { return '<li><button type="button" data-pv-cheer="' + esc(r[0]) + '">' + esc(r[0]) + '</button><small>' + esc(r[1]) + ' 추천했어요 · 누르면 보내져요</small></li>'; }).join('') + '</ul>' +
      '<p class="pv-note">승준이가 남긴 기록과 공개 설정 안에서만 만들어요.</p></section>';
  }

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'today' || !isParent()) return;
    var root = document.getElementById('content'), anchor = root.querySelector('.pv-motto') || root.querySelector('.pv-head');
    if (anchor && !root.querySelector('.pv-story')) anchor.insertAdjacentHTML('afterend', storyCard());
  };

  var css = document.createElement('style');
  css.textContent =
    'button.pl-rc{background:none!important;border:0!important;padding:0!important;min-height:0!important;text-align:left;color:inherit;font:inherit;box-shadow:none!important}' +
    '.rc-wrap{position:fixed;inset:0;z-index:1100;background:#1d1a3366;display:flex;align-items:flex-end;justify-content:center}' +
    '.rc-sheet{background:#fff;width:100%;max-width:520px;max-height:88vh;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box}' +
    '.rc-top{display:flex;align-items:center;justify-content:space-between;font-size:17px}.rc-x{min-height:36px!important;padding:2px 12px!important;border-radius:999px!important}' +
    '.rc-title{margin:8px 0 2px;font-weight:700;color:#2a2550}.rc-how{margin:0 0 8px;font-size:13px;color:#6b6880}' +
    '.rc-qs{margin:0 0 10px;padding-left:20px;display:grid;gap:6px;font-size:15px}.rc-my{width:100%;box-sizing:border-box;margin-bottom:10px}.rc-show{width:100%}' +
    '.rc-ans pre{white-space:pre-wrap;font:inherit;font-size:14px;background:#f5f3ff;border-radius:12px;padding:10px 12px;margin:0 0 10px}' +
    '.rc-ai{width:100%;margin-bottom:8px}.rc-ai-out{white-space:pre-wrap;font-size:14px;background:#fff8e6;border-radius:12px;padding:10px 12px;margin-bottom:8px}' +
    '.rc-ask{margin:6px 0;font-weight:700}.rc-rate{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.rc-rate button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px!important;font-size:22px;border-radius:14px!important}.rc-rate b{font-size:14px}.rc-rate small{font-size:11px;color:#7d7a8c;font-weight:500}' +
    '.pv-story{border:2px solid #f3d9a4;background:linear-gradient(#fffaf0,#fff)}.pv-story-l{margin:0 0 8px;padding-left:18px;display:grid;gap:4px;font-size:15px}';
  document.head.appendChild(css);
  window.FC_RECALL = { open: open, reschedule: reschedule, story: story };
  render();
})();
