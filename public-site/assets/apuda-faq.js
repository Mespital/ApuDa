(function (global) {
  'use strict';
  var catalog = global.ApuDaFirst30Catalog;
  var books = catalog ? catalog.books.filter(function (book) { return book.hasFaq; }) : [];
  var requested = new URLSearchParams(location.search).get('cancer');
  var book = catalog && catalog.get(requested == null ? 'breast' : requested);
  var items = [], sources = {}, groups = [], group = -1, term = '', timer;
  var root = document.getElementById('faq');
  var groupRoot = document.getElementById('groups');
  var query = document.getElementById('q');
  var categories = [['diagnosis', '진단·검사'], ['treatment', '치료 선택'], ['care', '치료 중 관리'], ['followup', '생활·추적']];
  var legacyGroups = [[1, 20, '증상·검사·치료'], [21, 40, '치료 후 생활'], [41, 60, '검진·위험요인·장기 관리'], [61, 80, '병기·치료 결정·결과지'], [81, 100, '부작용·비용·돌봄']];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function https(value) {
    try { return new URL(value).protocol === 'https:'; } catch (ignore) { return false; }
  }
  function highlight(value) {
    var text = String(value), words = term.split(/\s+/).filter(Boolean);
    if (!words.length) return esc(text);
    var pattern = words.map(function (word) { return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|');
    return text.split(new RegExp('(' + pattern + ')', 'gi')).map(function (part, index) {
      return index % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part);
    }).join('');
  }
  function selectedGroup(item) {
    if (group < 0) return true;
    var selected = groups[group];
    return selected.key ? item.category === selected.key : item.n >= selected.start && item.n <= selected.end;
  }
  function reviewInfo(item) {
    var review = item.review || {};
    var refs = (review.sourceRefs || []).filter(function (id) { return sources[id] && https(sources[id].url); });
    var publicScope = /AI\s*초안|검토\s*대기|실제 전문의|승인\s*대기/.test(review.scope || '') ? '' : (review.scope || '');
    return '<details class="src"><summary>근거·출처</summary>' +
      (publicScope ? '<p>' + esc(publicScope) + '</p>' : '') +
      '<p>개정 버전 ' + esc(review.version || '') + '</p>' +
      (refs.length ? '<ul>' + refs.map(function (id) {
        var source = sources[id];
        return '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.title) + '</a><br>' + esc(source.scope) + ' · 확인 ' + esc(source.checkedAt) + '</li>';
      }).join('') + '</ul>' : '<p>이 문항에는 개별 출처 링크가 없습니다. 중요한 진료 판단은 담당 의료진과 확인하세요.</p>') + '</details>';
  }
  function draw() {
    var words = term.toLocaleLowerCase('ko').split(/\s+/).filter(Boolean);
    var filtered = items.filter(function (item) {
      if (!selectedGroup(item)) return false;
      var haystack = (item.q + ' ' + item.a).toLocaleLowerCase('ko');
      return words.every(function (word) { return haystack.indexOf(word) >= 0; });
    });
    document.getElementById('count').textContent = (term ? '“' + term + '” 검색 결과 ' : '') + filtered.length + '개 질문 / 전체 ' + items.length + '개' + (group >= 0 ? ' · ' + groups[group].label : '');
    if (!filtered.length) {
      root.innerHTML = '<div class="empty">찾는 질문이 없어요. 더 짧은 말로 검색하거나 <button type="button" class="btn" id="resetBtn">검색 지우고 전체 보기</button></div>';
      return;
    }
    var expanded = words.length > 0 && filtered.length <= 5;
    root.innerHTML = filtered.map(function (item) {
      return '<article class="q' + (expanded ? ' on' : '') + '" id="q' + item.n + '"><button type="button" aria-expanded="' + (expanded ? 'true' : 'false') + '" aria-controls="answer' + item.n + '"><span class="num">' + item.n + '</span><span class="qt">' + highlight(item.q) + '</span><span class="chev" aria-hidden="true">›</span></button><div class="answer" id="answer' + item.n + '">' + highlight(item.a) + reviewInfo(item) + '</div></article>';
    }).join('');
  }
  function renderGroups() {
    groupRoot.innerHTML = '<button type="button" class="on" aria-pressed="true" data-g="-1">전체 ' + items.length + '</button>' + groups.map(function (definition, index) {
      return '<button type="button" aria-pressed="false" data-g="' + index + '">' + esc(definition.label) + '</button>';
    }).join('');
  }
  function reset() {
    query.value = ''; term = ''; group = -1;
    renderGroups(); draw(); query.focus();
  }
  function openHash() {
    if (!/^#q\d+$/.test(location.hash)) return;
    var answer = document.getElementById(location.hash.slice(1));
    if (!answer) return;
    answer.classList.add('on');
    answer.querySelector('button').setAttribute('aria-expanded', 'true');
    setTimeout(function () { answer.scrollIntoView({ block: 'start' }); }, 60);
  }
  function visitQuestions(list, name, fromMini) {
    if (!Array.isArray(list) || !list.length) return;
    document.getElementById('askIntro').textContent = name + ' 진료를 준비하는 질문입니다. 한 번에 3개씩 골라 가져가세요.';
    document.getElementById('ask').innerHTML = list.map(function (question) {
      var text = String(question).replace(/^\s*(?:\d+[.)·]?\s+|[①-⑳]\s*)/, '');
      return '<li>' + esc(text) + '</li>';
    }).join('');
    document.getElementById('links').innerHTML = '<a href="' + esc(book.href) + '">📖 ' + esc(name) + ' 무료 핵심안내서</a>' +
      (fromMini ? '<a href="/library/mini/?cancer=' + book.slug + '">MINI 미리보기</a><a href="/library/treatment-map/?cancer=' + book.slug + '">🗺️ 치료결정 지도</a>' : '') + '<a href="/note/">📝 암환자 노트</a>';
    document.getElementById('askSec').hidden = false;
  }
  document.getElementById('cancers').innerHTML = books.map(function (entry) {
    return '<a href="?cancer=' + entry.slug + '"' + (book && entry.slug === book.slug ? ' class="on" aria-current="page"' : '') + '>' + esc(entry.name) + '</a>';
  }).join('');
  var chooser = document.getElementById('cancerSelect');
  chooser.innerHTML = '<option value="">암종을 선택하세요</option>' + books.map(function (entry) {
    return '<option value="' + entry.slug + '"' + (book && entry.slug === book.slug ? ' selected' : '') + '>' + esc(entry.name) + (entry.faqCount ? ' · ' + entry.faqCount + '문항' : '') + '</option>';
  }).join('');
  chooser.addEventListener('change', function () { if (catalog.get(chooser.value)) location.href = '?cancer=' + encodeURIComponent(chooser.value); });
  if (!book || !book.hasFaq) {
    document.getElementById('title').textContent = '암종을 확인해 주세요';
    document.getElementById('lead').textContent = '요청한 암종의 FAQ를 찾을 수 없습니다. 위 목록에서 알맞은 암종을 선택하세요.';
    document.getElementById('edition').textContent = '암종 선택 필요';
    document.getElementById('tools').hidden = true;
    root.innerHTML = '<div class="empty">위 목록에서 진단받은 암종을 선택해 주세요.</div>';
    return;
  }
  document.getElementById('title').textContent = book.name + ' FAQ';
  if (global.ApuDaCancerVideos) document.getElementById('cancerVideos').innerHTML = global.ApuDaCancerVideos.html(book.slug, { heading: 2 });
  groupRoot.addEventListener('click', function (event) {
    var button = event.target.closest('button'); if (!button) return;
    group = Number(button.dataset.g);
    groupRoot.querySelectorAll('button').forEach(function (control) { var selected = control === button; control.classList.toggle('on', selected); control.setAttribute('aria-pressed', String(selected)); });
    draw();
  });
  query.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { term = query.value.trim(); draw(); }, 120); });
  root.addEventListener('click', function (event) {
    if (event.target.id === 'resetBtn') { reset(); return; }
    if (event.target.id === 'retryFaq') { location.reload(); return; }
    var button = event.target.closest('.q > button'); if (!button) return;
    var article = button.parentNode;
    article.classList.toggle('on'); button.setAttribute('aria-expanded', String(article.classList.contains('on')));
    if (article.classList.contains('on') && history.replaceState) history.replaceState(null, '', '#' + article.id);
  });
  fetch('./data/' + book.slug + '.json', { cache: 'no-store' }).then(function (response) {
    if (!response.ok) throw new Error('faq-unavailable'); return response.json();
  }).then(function (data) {
    if (data.slug !== book.slug || !Array.isArray(data.items) || !data.items.length || (book.faqCount && data.items.length !== book.faqCount) || data.items.some(function (item) { return !Number.isInteger(item.n) || typeof item.q !== 'string' || typeof item.a !== 'string'; })) throw new Error('faq-identity-mismatch');
    items = data.items; sources = data.sources || {};
    groups = data.reviewMode ? categories.map(function (category) { return { key: category[0], label: category[1] }; }).filter(function (definition) { return items.some(function (item) { return item.category === definition.key; }); }) : legacyGroups.map(function (definition) { return { start: definition[0], end: definition[1], label: definition[0] + '–' + definition[1] + ' ' + definition[2] }; });
    document.title = 'ApuDa ' + data.name + ' FAQ ' + items.length + ' — 자주 묻는 질문';
    document.getElementById('title').textContent = data.name + ' FAQ ' + items.length;
    document.getElementById('lead').textContent = data.reviewMode || data.additionalDraftCount ? '진단 후 첫 30일에 확인할 핵심 질문 ' + items.length + '개입니다. 진단·검사, 치료 선택, 치료 중 관리, 생활·추적 순서로 찾아보세요.' : '환자·보호자를 위한 기존 FAQ ' + items.length + '문항입니다. 증상·검사부터 치료, 생활, 비용·돌봄까지 찾아보세요.';
    document.getElementById('edition').textContent = (data.updated || '') + ' · ' + '출처를 첨부한 환자교육용 참고정보';
    document.getElementById('faqFooter').innerHTML = '이 FAQ는 환자교육용 참고정보로, 국내 약제 허가·급여와 개인별 치료를 보증하지 않습니다. 진단·치료·약 복용은 담당 의료진과 결정하세요. 각 문항의 「근거·출처」에서 자료와 확인일을 확인할 수 있습니다. <a href="/library/review/?cancer=' + encodeURIComponent(book.slug) + '">자료 출처·검토 범위</a>';
    renderGroups(); draw(); openHash();
    if (!book.hasMini) visitQuestions(data.questionsForVisit, data.name, false);
  }).catch(function () {
    document.getElementById('edition').textContent = '자료를 불러오지 못했습니다';
    root.innerHTML = '<div class="empty">이 암종의 FAQ를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 <button type="button" class="btn" id="retryFaq">새로고침</button></div>';
  });
  if (book.hasMini) fetch('../mini/data/' + book.slug + '.json', { cache: 'no-store' }).then(function (response) {
    if (!response.ok) throw new Error('mini-unavailable'); return response.json();
  }).then(function (data) { if (data.slug === book.slug) visitQuestions(data.faq, data.name, true); }).catch(function () {});
  global.addEventListener('hashchange', openHash);
})(window);
