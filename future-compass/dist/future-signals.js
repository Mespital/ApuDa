/* 미래 신호판 데이터 — 2025~2026 공식 발표·연구 (2026-10-16 확인)
   study.html#path(진로 한 장)와 future.html(미래 예측)이 같이 쓴다. 숫자는 출처 기사·보고서 그대로. */
(function () {
  'use strict';
  window.FC_SIGNALS = [
    { d: '2026.8', t: '2029학년도 수능 확정 (2028.11.16)', f: '선택과목 없이 모두 같은 시험: 국어·수학(대수·미적분Ⅰ·확률과 통계)·영어·한국사·통합사회·통합과학.', so: '지금 배우는 통합사회·통합과학이 수능 범위야. 1학년 내신 공부 = 수능 기초.', src: '교육부 발표 보도(이투데이)', u: 'https://etoday.co.kr/news/view/2615436' },
    { d: '2026.2', t: '일할 사람이 모자라는 2030년대', f: '한국고용정보원: 2030년부터 취업자 감소 전환, 2% 성장에 2034년까지 122만 명 더 필요. 돌봄·보건, 공학·정보통신 전문가는 늘고 매장 판매·기계조작은 줄 전망.', so: '"일자리가 다 사라진다"보다 "어떤 일이 늘고 줄지"를 보는 게 정확해.', src: '중장기 인력수급 전망 2024~2034 보도', u: 'https://v.daum.net/v/20260212110216215' },
    { d: '2025.10', t: '신입이 하던 일부터 바뀐다', f: '한국은행: 2022.7~2025.7 청년 일자리 21.1만 개 감소, 그중 98.6%가 AI 노출이 큰 업종. 같은 기간 50대는 증가.', so: '자료 찾기·초안 같은 단순 업무만으로는 첫 경력을 쌓기 어려워져. 검증·판단 경험이 필요해.', src: '한국은행 「AI 확산과 청년고용 위축」 보도', u: 'https://www.heraldk.com/article/2025102921152134344' },
    { d: '2026.8', t: '원인은 하나가 아니다', f: '한국고용정보원: AI 노출 높은 직업의 청년 고용지수 86.6, 낮은 직업 92.5(2022=100). 다만 청년 인구 감소가 큰 원인이고 AI 영향은 아직 확정 못 함.', so: '뉴스 제목 하나로 진로를 정하지 말고, 숫자의 원인을 같이 봐.', src: '고용정보원 보고서 보도(세계일보)', u: 'https://www.segye.com/newsView/20260831511281' },
    { d: '2026.8', t: '미국도 같은 신호', f: '스탠퍼드 브린욜프슨 연구 업데이트: AI 노출 큰 직업의 22~25세 고용이 노출 적은 직업보다 19% 낮음(이전 발표 13%).', so: '나라가 달라도 방향은 비슷해. 대학 때 실제 프로젝트·현장 경험이 중요해져.', src: 'Stanford "Canaries" 업데이트 요약', u: 'https://aiweekly.co/alerts/stanfords-brynjolfsson-study-entry-level-employment-in-ai-exposed-jobs-now-19' },
    { d: '2025.1', t: '바뀌는 능력', f: '세계경제포럼: 2030년까지 일에 필요한 핵심 능력의 39%가 바뀜. 빨리 크는 능력은 AI·빅데이터, 보안, 기술 이해, 창의적 사고, 회복탄력성, 호기심·평생학습.', so: '기술 하나보다 "새로 배우는 힘"이 오래 남아.', src: 'WEF Future of Jobs Report 2025', u: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/' }
  ];
  window.FC_SIGNALS_CHECKED = '2026-10-16';
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* future.html: #fsig 자리에 바로 그린다 */
  function draw() {
    var el = document.getElementById('fsig'); if (!el) return;
    el.innerHTML = '<div class="sec-head"><div class="eyebrow">미래 신호판 · 2026.10 확인</div><h2>2025~2026에 새로 나온 근거</h2><p class="muted">예측은 한 번 정하고 끝이 아니라, 새 자료가 나오면 다시 맞춰보는 거예요. 아래 연도별 장면도 이 자료로 다시 점검했어요.</p></div>' +
      '<div class="sigs">' + window.FC_SIGNALS.map(function (x) { return '<article class="sig"><span class="tag">' + e(x.d) + '</span><h3>' + e(x.t) + '</h3><p>' + e(x.f) + '</p><p class="so">→ ' + e(x.so) + '</p><a href="' + e(x.u) + '" target="_blank" rel="noopener noreferrer">' + e(x.src) + '</a></article>'; }).join('') + '</div>' +
      '<p class="small muted">점검 결과: "신입 업무 축소"는 한국·미국 자료 모두에서 신호가 늘었어요(확신도 중간 유지, 근거 강화). "일할 사람 부족"은 새 인력수급 전망으로 다시 확인됐어요. 다음 큰 자료: 2028년 3월 평가원 2029 수능 시행 기본계획.</p>' +
      '<a class="sig-go" href="study.html#path">🎯 진로 한 장에서 고2 과목 후보 담기 →</a>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
})();
