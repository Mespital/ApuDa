/* 🍚 이번 주 급식 (시간표 탭 아래)
   - 데이터: school.json meals (NEIS 급식, 2시간마다 수집). ntr = NEIS 영양정보(있을 때만)
   - 부족할 수 있는 영양소: 2020 한국인 영양소 섭취기준 15~18세 남자 하루 권장량의 1/3(점심 한 끼)과 비교한 추정
   - 적당히/챙겨 먹기: 메뉴 이름으로 분류한 간단 안내(추정). 진단·처방 아님 */
(function () {
  'use strict';
  if (typeof state === 'undefined') return;
  var data = null;
  fetch('school.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { data = d; if (tab === 'table') render(); }).catch(function () {});

  function addD(d, n) { return new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function wd(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
  function weekDates() {
    var t = today(), w = wd(t), mon = w === 6 ? addD(t, 2) : w === 0 ? addD(t, 1) : addD(t, 1 - w);
    return [0, 1, 2, 3, 4].map(function (i) { return addD(mon, i); });
  }

  // 15~18세 남자 하루 권장섭취량(2020 KDRI) — 점심은 이 값의 1/3로 봄
  var REF = { protein: [65, '단백질', 'g'], ca: [900, '칼슘', 'mg'], fe: [14, '철분', 'mg'], vitC: [100, '비타민C', 'mg'], vitA: [850, '비타민A', 'µg'], ribo: [1.7, '리보플라빈(B2)', 'mg'], thiamin: [1.3, '티아민(B1)', 'mg'] };
  var FOODS = {
    protein: '달걀·두부·닭가슴살·생선', ca: '우유·요거트·치즈·멸치', fe: '소고기·달걀노른자·시금치·콩',
    vitC: '귤·키위·딸기·파프리카', vitA: '당근·고구마·시금치·달걀', ribo: '우유·달걀·요거트', thiamin: '돼지고기·잡곡밥·콩',
    fruit: '귤·사과·바나나 같은 과일', dairy: '우유·요거트', fish: '고등어·연어 같은 생선'
  };
  var G = {
    fried: /까스|가스|튀김|파전|부침|강정|탕수|치킨|너겟|크로켓|핫도그|감자칩|프렌치/,
    processed: /햄|소시지|비엔나|베이컨|스팸|어묵|떡갈비|미트볼/,
    soup: /국$|국\s|찌개|탕$|스프|수프|짬뽕|우동|라면/,
    sweet: /라떼|스무디|쉐이크|셰이크|케이크|쿠키|머핀|도넛|음료|주스|에이드|아이스|푸딩|초코|젤리|와플|마카롱|츄러스|타르트|빵$/,
    veg: /샐러드|나물|무침|쌈|상추|깻잎|부추|당근|연근|토마토|겉절이|숙주|시금치|브로콜리|버섯|오이|양배추|채소|야채|콩나물|미역줄기/,
    fruit: /귤|사과|배$|포도|바나나|키위|오렌지|수박|딸기|파인애플|과일|멜론|자두|복숭아|감$|망고|천혜향|한라봉/,
    dairy: /라떼|우유|요구르트|요거트|치즈|두유/,
    fish: /생선|고등어|연어|삼치|갈치|꽁치|가자미|동태|명태|오징어|새우|멸치|참치|코다리|임연수|조기|해물/
  };
  function has(m, k) { return m.dishes.some(function (x) { x = x.replace(/\*.*$/, '').trim(); return G[k].test(x) && !(k === 'fruit' && G.sweet.test(x)); }); }   // 딸기라떼는 과일 아님
  function kcal(m) { var n = parseFloat(String(m.kcal || '').replace(/[^\d.]/g, '')); return isFinite(n) ? Math.round(n) : 0; }

  function dayTips(m) {
    var out = [];
    if (has(m, 'veg')) out.push(['ok', '채소 반찬 넉넉히']);
    if (has(m, 'fruit')) out.push(['ok', '과일 챙기기']);
    if (has(m, 'fish')) out.push(['ok', '생선·해산물 좋아']);
    if (has(m, 'fried')) out.push(['mid', '튀김은 한 조각 정도']);
    if (has(m, 'processed')) out.push(['mid', '가공육은 조금']);
    if (has(m, 'soup')) out.push(['mid', '국물은 반만']);
    if (has(m, 'sweet')) out.push(['mid', '디저트는 반만']);
    return out.slice(0, 4);
  }

  function summary(ms) {
    var withN = ms.filter(function (m) { return m.ntr && Object.keys(m.ntr).length; }), low = [], basis;
    if (withN.length) {
      basis = '학교 급식 영양정보(' + withN.length + '일)';
      Object.keys(REF).forEach(function (k) {
        var vals = withN.map(function (m) { return m.ntr[k]; }).filter(function (v) { return typeof v === 'number'; }); if (!vals.length) return;
        var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length, goal = REF[k][0] / 3, pct = Math.round(avg / goal * 100);
        if (pct < 80) low.push({ k: k, name: REF[k][1], pct: pct });
      });
      low.sort(function (a, b) { return a.pct - b.pct; }); low = low.slice(0, 3);
    } else {
      basis = '메뉴 이름';
      var noFruit = ms.filter(function (m) { return !has(m, 'fruit'); }).length, dairy = ms.some(function (m) { return has(m, 'dairy'); }), fish = ms.some(function (m) { return has(m, 'fish'); });
      if (noFruit >= Math.ceil(ms.length / 2)) low.push({ k: 'fruit', name: '과일(비타민C)', note: '과일 나온 날 ' + (ms.length - noFruit) + '일' });
      if (!dairy) low.push({ k: 'dairy', name: '유제품(칼슘)', note: '우유·요거트 없음' });
      if (!fish) low.push({ k: 'fish', name: '생선', note: '이번 주 생선 없음' });
    }
    var cnt = function (k) { return ms.filter(function (m) { return has(m, k); }).length; };
    var mod = [];
    if (cnt('fried')) mod.push('튀김·전 ' + cnt('fried') + '일 → 한 조각 정도');
    if (cnt('soup')) mod.push('국·찌개 ' + cnt('soup') + '일 → 국물은 반만(짠맛)');
    if (cnt('sweet')) mod.push('디저트·단 음료 ' + cnt('sweet') + '일 → 반만');
    if (cnt('processed')) mod.push('햄·소시지 같은 가공육 ' + cnt('processed') + '일 → 조금만');
    var ks = ms.map(kcal).filter(Boolean), avgK = ks.length ? Math.round(ks.reduce(function (a, b) { return a + b; }, 0) / ks.length) : 0;
    return { low: low, mod: mod, avgK: avgK, basis: basis };
  }

  function card() {
    var dates = weekDates(), all = (data && data.meals) || [], t = today();
    var ms = dates.map(function (d) { return all.filter(function (m) { return m.date === d && /중식/.test(m.kind || '중식'); })[0] || all.filter(function (m) { return m.date === d; })[0]; }).filter(Boolean);
    var label = dates[0] > t ? '다음 주 급식' : '이번 주 급식';
    var h = '<section class="card mw-card" id="mw-week"><div class="section-title"><h2>🍚 ' + label + '</h2><small class="mw-range">' + Number(dates[0].slice(5, 7)) + '/' + Number(dates[0].slice(8)) + ' ~ ' + Number(dates[4].slice(5, 7)) + '/' + Number(dates[4].slice(8)) + '</small></div>';
    if (!ms.length) return h + '<p class="muted">이번 주 급식 정보가 아직 없어. 학교가 올리면 자동으로 보여.</p></section>';
    var DN = ['일', '월', '화', '수', '목', '금', '토'];
    h += '<ul class="mw-days">' + dates.map(function (d) {
      var m = ms.filter(function (x) { return x.date === d; })[0];
      var head = '<div class="mw-dh"><b>' + DN[wd(d)] + '</b><small>' + Number(d.slice(5, 7)) + '/' + Number(d.slice(8)) + '</small>' + (m && kcal(m) ? '<em>' + kcal(m) + 'kcal</em>' : '') + '</div>';
      if (!m) return '<li class="mw-none' + (d === t ? ' now' : '') + '">' + head + '<p class="muted small">급식 없음</p></li>';
      var tips = dayTips(m);
      return '<li' + (d === t ? ' class="now"' : '') + '>' + head + '<p class="mw-menu">' + m.dishes.map(function (x) { return esc(x.replace(/\*/g, '·')); }).join(' · ') + '</p>' +
        (tips.length ? '<div class="mw-tips">' + tips.map(function (x) { return '<span class="' + x[0] + '">' + (x[0] === 'ok' ? '👍 ' : '⚖️ ') + esc(x[1]) + '</span>'; }).join('') + '</div>' : '') + '</li>';
    }).join('') + '</ul>';
    var s = summary(ms);
    h += '<div class="mw-sum">';
    h += '<div><b>🥛 이번 주 부족할 수 있는 것 <small>(추정)</small></b>' + (s.low.length ? '<ul>' + s.low.map(function (x) { return '<li><b>' + esc(x.name) + '</b>' + (x.pct != null ? ' <small>점심 기준의 약 ' + x.pct + '%</small>' : x.note ? ' <small>' + esc(x.note) + '</small>' : '') + '<br><span>집에서: ' + esc(FOODS[x.k] || '') + '</span></li>'; }).join('') + '</ul>' : '<p class="small">크게 모자란 건 안 보여. 👍</p>') + '</div>';
    h += '<div><b>⚖️ 급식 때 적당히</b>' + (s.mod.length ? '<ul>' + s.mod.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="small">특별히 조심할 메뉴 없어.</p>') + '</div>';
    h += '</div>';
    h += '<p class="mw-note">' + (s.avgK ? '점심 평균 ' + s.avgK + 'kcal · ' : '') + '근거: ' + esc(s.basis) + ' + 2020 한국인 영양소 섭취기준(15~18세 남자) 하루 권장량의 1/3. 참고용 추정이고, 알레르기·몸 상태는 보호자와 확인해줘.</p></section>';
    return h;
  }

  var prev = render;
  render = function () {
    prev();
    if (tab !== 'table') return;
    var root = document.getElementById('content'), tt = root.querySelector('.tt-view');
    if (tt) tt.insertAdjacentHTML('afterend', card()); else root.insertAdjacentHTML('beforeend', card());
  };

  var css = document.createElement('style');
  css.textContent = '.mw-card .section-title{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.mw-range{color:#8a879a;font-size:12.5px}' +
    '.mw-days{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.mw-days li{border-radius:14px;background:#f8f7fc;padding:10px 12px}.mw-days li.now{background:#f1edff;box-shadow:0 0 0 1.5px #c9bdf7}.mw-days li.mw-none{opacity:.7}' +
    '.mw-dh{display:flex;align-items:baseline;gap:6px}.mw-dh b{font-size:15px;color:#2a2550}.mw-dh small{color:#8a879a;font-size:12px}.mw-dh em{margin-left:auto;font-style:normal;font-size:12px;color:#7d7a8c}' +
    '.mw-menu{margin:4px 0 0;font-size:14px;line-height:1.5;color:#3d3955}.mw-tips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.mw-tips span{font-size:12px;border-radius:999px;padding:3px 9px;background:#fff;box-shadow:0 0 0 1px #e6e1fa}.mw-tips span.ok{color:#22764a;background:#eefaf3;box-shadow:0 0 0 1px #c9ecd7}.mw-tips span.mid{color:#8a5a00;background:#fff7e6;box-shadow:0 0 0 1px #f3e0b0}' +
    '.mw-sum{display:grid;gap:10px;margin-top:12px}@media(min-width:560px){.mw-sum{grid-template-columns:1fr 1fr}}.mw-sum>div{border-radius:14px;padding:10px 12px;background:#fffaf0;box-shadow:0 0 0 1px #f3e2b0}.mw-sum>div:last-child{background:#f4f9ff;box-shadow:0 0 0 1px #cfe0f6}.mw-sum ul{margin:6px 0 0;padding-left:18px;display:grid;gap:5px;font-size:14px}.mw-sum li span{font-size:13px;color:#5b5772}.mw-sum small{color:#8a879a;font-weight:500}.mw-sum p{margin:6px 0 0}' +
    '.mw-note{margin:10px 2px 0;font-size:11.5px;color:#8a879a;line-height:1.5}';
  document.head.appendChild(css);
  if (tab === 'table') render();
})();
