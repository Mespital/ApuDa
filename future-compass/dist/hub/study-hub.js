/* =========================================================
   우리집 공부방 (study-hub) 스크립트
   사용법:
     <div id="study-hub"></div>
     <script src="js/study-hub.js"></script>
     <script>StudyHub.mount({ el: "#study-hub", dataBase: "data/" });</script>

   - 데이터: data/sites.json, data/routes.json 을 fetch로 읽음
     (file:// 로 열어서 fetch가 막히면 data/study-hub-data.js 의
      window.STUDY_HUB_DATA 를 대신 사용)
   - 자료 보드 저장소: 기본은 브라우저 localStorage (이 기기에서만 보임)
     가족과 공유하려면 storage 옵션에 Firebase 등 어댑터를 넘김 (README 참고)
   ========================================================= */
(function (global) {
  "use strict";

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- 저장소 어댑터 ----------
     어댑터는 아래 4개 함수만 있으면 됨
       list()            -> Promise<Post[]>
       add(post)         -> Promise<void>
       remove(id)        -> Promise<void>
       subscribe(cb)     -> unsubscribe 함수 (선택, 실시간 반영용)
  */
  function localStorageAdapter(key) {
    key = key || "study-hub-posts";
    var listeners = [];
    function read() {
      try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; }
    }
    function write(arr) {
      try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) { throw new Error("저장 공간을 쓸 수 없어요."); }
      listeners.forEach(function (fn) { fn(arr); });
    }
    return {
      list: function () { return Promise.resolve(read()); },
      add: function (post) { var a = read(); a.unshift(post); write(a); return Promise.resolve(); },
      remove: function (id) { write(read().filter(function (p) { return p.id !== id; })); return Promise.resolve(); },
      subscribe: function (cb) {
        listeners.push(cb);
        return function () { listeners = listeners.filter(function (f) { return f !== cb; }); };
      }
    };
  }

  function loadJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function loadData(base) {
    return Promise.all([loadJSON(base + "sites.json"), loadJSON(base + "routes.json")])
      .then(function (res) { return { sites: res[0], routes: res[1] }; })
      .catch(function (err) {
        if (global.STUDY_HUB_DATA) return global.STUDY_HUB_DATA;
        throw err;
      });
  }

  /* ---------- 화면 틀 ---------- */
  function shell(opts) {
    return '' +
    '<div class="sh-wrap">' +
      '<header class="sh-top">' +
        '<span class="sh-eyebrow">' + esc(opts.eyebrow) + '</span>' +
        '<h1>' + esc(opts.titleA) + ' <span class="sh-hl">' + esc(opts.titleB) + '</span></h1>' +
        '<p class="sh-lede">' + esc(opts.lede) + '</p>' +
        '<nav class="sh-quick" aria-label="바로가기">' +
          '<a href="#sh-sites">사이트 고르기</a><a href="#sh-routes">시험 대비 순서</a>' +
          (opts.board ? '<a href="#sh-board">내 자료 모음</a>' : '') +
        '</nav>' +
      '</header>' +
      '<section id="sh-sites">' +
        '<div class="sh-sec-head"><h2>사이트 고르기</h2><p>용도를 누르면 맞는 곳만 남아. 무료인지, 로그인이 필요한지도 같이 적어놨어.</p></div>' +
        '<div class="sh-chips" data-role="kind-filter" role="group" aria-label="용도"></div>' +
        '<div class="sh-grid" data-role="sites"></div>' +
      '</section>' +
      '<section id="sh-routes">' +
        '<div class="sh-sec-head"><h2 data-role="routes-title">대비 순서</h2><p>시험 전에 어떤 사이트를 어떤 순서로 쓰면 좋은지 정리했어.</p></div>' +
        '<div class="sh-routes" data-role="routes"></div>' +
      '</section>' +
      (opts.board ?
      '<section id="sh-board">' +
        '<div class="sh-sec-head"><h2>내 자료 모음</h2><p>도움 된 링크를 여기 모아 둬. 이 기기에만 저장돼.</p></div>' +
        '<div class="sh-board">' +
          '<form class="sh-form" data-role="form" novalidate>' +
            '<h3>링크 저장하기</h3>' +
            '<label>제목<input name="title" maxlength="80" placeholder="예: 2025 11월 고1 모의고사 수학"></label>' +
            '<label>링크 (https://…)<input name="url" type="url" inputmode="url" placeholder="https://"></label>' +
            '<div class="sh-two">' +
              '<label>과목<select name="subject"><option>국어</option><option>영어</option><option>수학</option><option>과학</option><option>사회</option><option>역사</option><option>기타</option></select></label>' +
              '<label>학년<select name="grade"><option selected>고1</option><option>고2</option><option>고3</option><option>공통</option></select></label>' +
            '</div>' +
            '<label>작성자 (선택)<input name="author" maxlength="20" placeholder="예: 나, 엄마"></label>' +
            '<label>메모 (선택)<textarea name="memo" maxlength="300" placeholder="어디에 쓰면 좋은지, 몇 번 문제가 중요했는지 등"></textarea></label>' +
            '<button class="sh-btn" type="submit">저장하기</button>' +
            '<p class="sh-msg" data-role="msg" role="status"></p>' +
            '<p class="sh-note">시험지·교재 PDF는 저작권이 있어서 파일 말고 원래 사이트 링크만 저장해줘.</p>' +
          '</form>' +
          '<div>' +
            '<div class="sh-chips" data-role="board-filter" role="group" aria-label="과목별 보기" style="margin-bottom:10px"></div>' +
            '<div class="sh-posts" data-role="posts"></div>' +
          '</div>' +
        '</div>' +
      '</section>' : '') +
      '<footer class="sh-footer">' + esc(opts.footer) + '</footer>' +
    '</div>';
  }

  function chipRow(box, values, onPick) {
    box.innerHTML = ['전체'].concat(values).map(function (v, i) {
      return '<button type="button" class="sh-chip" data-v="' + (i === 0 ? "all" : esc(v)) + '" aria-pressed="' + (i === 0) + '">' + esc(v) + '</button>';
    }).join("");
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".sh-chip"); if (!b) return;
      box.querySelectorAll(".sh-chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      onPick(b.dataset.v);
    });
  }

  /* ---------- 마운트 ---------- */
  function mount(options) {
    var o = Object.assign({
      el: "#study-hub",
      dataBase: "data/",
      board: true,
      storage: null,
      eyebrow: "고1 2학기 · 무료 학습 사이트 모음",
      titleA: "우리집", titleB: "공부방",
      lede: "고1이 내신과 학력평가를 준비할 때 바로 들어갈 사이트를 용도별로 모은 링크북이에요.",
      footer: "사이트 정보는 2026년 10월 기준이에요. 이용 조건(회원가입, 유료 범위)은 바뀔 수 있으니 처음 쓸 때 한 번 확인해 주세요.",
      pickTitle: "먼저 볼 추천 사이트", pickLede: "지금 시기에 가장 자주 쓸 곳부터 골랐어.", pickLabel: "추천 이유:"
    }, options || {});

    var root = typeof o.el === "string" ? document.querySelector(o.el) : o.el;
    if (!root) { console.error("[StudyHub] 마운트할 요소를 찾지 못했어요:", o.el); return; }
    if (!root.id) root.id = "study-hub";
    root.innerHTML = shell(o);
    var $ = function (r) { return root.querySelector('[data-role="' + r + '"]'); };

    var state = { kind: "all", subject: "all", sites: [], posts: [], showAll: false };
    var GI = (global.FC_SCHOOL && global.FC_SCHOOL.info) ? global.FC_SCHOOL.info() : { grade: 1, semester: 2, key: "1-2" };
    var G = String(o.grade || GI.grade), GKEY = o.gradeKey || GI.key;
    function pickOf(s) { return s.picks && s.picks[G] ? s.picks[G] : (s.pick ? { rank: s.pick, reason: s.pickReason } : null); }

    loadData(o.dataBase).then(function (data) {
      state.sites = data.sites.sites;
      chipRow($("kind-filter"), data.sites.kinds, function (v) { state.kind = v; renderSites(); });
      renderSites();
      renderRoutes(data.routes);
    }).catch(function (err) {
      $("sites").innerHTML = '<p class="sh-empty">사이트 목록을 불러오지 못했어요. data 폴더 경로(dataBase)를 확인해 주세요.</p>';
      console.error("[StudyHub]", err);
    });

    function siteCard(s, pick) {
      var host = s.url.replace(/^https?:\/\//, "").split("/")[0];
      return '<article class="sh-site' + (pick ? ' sh-pick' : '') + '" id="site-' + esc(s.id) + '">' +
        '<div class="sh-row"><div><h3>' + esc(s.name) + '</h3><div class="sh-url">' + esc(host) + '</div></div>' +
        '<a class="sh-go" href="' + esc(s.url) + '" target="_blank" rel="noopener">열기 →</a></div>' +
        (pick && pickOf(s) ? '<p class="sh-pick-why"><b>' + esc(o.pickLabel) + '</b> ' + esc(pickOf(s).reason) + '</p>' : '') +
        '<div class="sh-tags"><span class="sh-tag ' + (s.price === "free" ? "free" : "pay") + '">' + (s.price === "free" ? "무료" : "일부 유료") + '</span>' +
        '<span class="sh-tag">' + esc(s.login) + '</span>' +
        s.kinds.map(function (k) { return '<span class="sh-tag">' + esc(k) + '</span>'; }).join("") + '</div>' +
        '<p class="sh-use">' + esc(s.use) + '</p>' +
        '<p class="sh-tip"><b>활용:</b> ' + esc(s.tip) + '</p>' +
      '</article>';
    }

    function renderSites() {
      var g = $("sites");
      var list = state.sites.filter(function (s) { return state.kind === "all" || s.kinds.indexOf(state.kind) > -1; });
      if (!list.length) { g.innerHTML = '<p class="sh-empty">이 용도에 맞는 사이트가 없어.</p>'; return; }
      var picks = list.filter(function (s) { return pickOf(s); }).sort(function (x, y) { return pickOf(x).rank - pickOf(y).rank; });
      var rest = list.filter(function (s) { return !pickOf(s); });
      var html = '';
      if (picks.length) {
        html += '<div class="sh-span sh-pick-head"><h3>⭐ ' + esc(o.pickTitle) + '</h3><p>' + esc(o.pickLede) + '</p></div>';
        html += picks.map(function (s) { return siteCard(s, true); }).join('');
      }
      if (rest.length) {
        var open = state.showAll || state.kind !== "all";
        if (open) {
          if (picks.length) html += '<div class="sh-span sh-rest-head"><h3>다른 사이트 ' + rest.length + '곳</h3></div>';
          html += rest.map(function (s) { return siteCard(s, false); }).join('');
        }
        if (state.kind === "all") html += '<div class="sh-span sh-more-row"><button type="button" class="sh-more" data-role="more" aria-expanded="' + open + '">' + (open ? '추천만 보기 ↑' : '사이트 ' + rest.length + '곳 더보기 ↓') + '</button></div>';
      }
      g.innerHTML = html;
      var more = g.querySelector('[data-role="more"]');
      if (more) more.onclick = function () {
        state.showAll = !state.showAll; renderSites();
        var target = state.showAll ? g.querySelector('.sh-rest-head') : g.querySelector('.sh-pick-head');
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }

    function renderRoutes(data) {
      if (data && data.sets) { data = data.sets[GKEY] || data.sets[G + "-2"] || data.sets[G + "-1"] || data.sets[Object.keys(data.sets)[0]]; }
      $("routes-title").textContent = data.target + " 대비 순서";
      var byId = {}; state.sites.forEach(function (s) { byId[s.id] = s; });
      $("routes").innerHTML = data.routes.map(function (r) {
        return '<article class="sh-route"><h3>' + esc(r.title) + '</h3><span class="sh-when">' + esc(r.when) + '</span><ol>' +
          r.steps.map(function (st) {
            var links = (st.sites || []).filter(function (id) { return byId[id]; }).map(function (id) {
              return '<a href="' + esc(byId[id].url) + '" target="_blank" rel="noopener">' + esc(byId[id].name) + '</a>';
            }).join("");
            return '<li>' + esc(st.text) + links + '</li>';
          }).join("") + '</ol></article>';
      }).join("");
    }

    /* ---------- 자료 보드 ---------- */
    if (!o.board) return;
    var store = o.storage || localStorageAdapter();
    var postsEl = $("posts"), msg = $("msg"), form = $("form");

    chipRow($("board-filter"), ["국어", "영어", "수학", "과학", "사회", "역사", "기타"], function (v) { state.subject = v; renderPosts(); });

    function renderPosts() {
      var list = state.posts.filter(function (p) { return state.subject === "all" || p.subject === state.subject; });
      if (!list.length) {
        postsEl.innerHTML = '<div class="sh-board-empty">' + (state.posts.length ? "이 과목으로 저장한 자료가 아직 없어." : "아직 저장한 자료가 없어. 첫 링크를 저장해 봐.") + '</div>';
        return;
      }
      postsEl.innerHTML = list.map(function (p) {
        var d = p.createdAt ? new Date(p.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) : "";
        return '<article class="sh-post"><div class="sh-row">' +
          '<a class="sh-t" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>' +
          '<button type="button" class="sh-del" data-id="' + esc(p.id) + '">삭제</button></div>' +
          '<div class="sh-tags"><span class="sh-tag">' + esc(p.subject) + '</span><span class="sh-tag">' + esc(p.grade) + '</span></div>' +
          (p.memo ? '<p>' + esc(p.memo) + '</p>' : '') +
          '<div class="sh-meta">' + esc(p.author || "가족") + ' · ' + esc(d) + '</div></article>';
      }).join("");
    }

    function refresh() { return store.list().then(function (arr) { state.posts = arr || []; renderPosts(); }); }
    if (store.subscribe) store.subscribe(function (arr) { if (arr) { state.posts = arr; renderPosts(); } else refresh(); });
    refresh().catch(function () { postsEl.innerHTML = '<div class="sh-board-empty">저장한 자료를 불러오지 못했어.</div>'; });

    postsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".sh-del"); if (!b) return;
      if (!b.classList.contains("confirm")) {
        b.classList.add("confirm"); b.textContent = "한 번 더 누르면 삭제";
        setTimeout(function () { if (b.isConnected) { b.classList.remove("confirm"); b.textContent = "삭제"; } }, 3000);
        return;
      }
      b.disabled = true;
      store.remove(b.dataset.id).then(function () { if (!store.subscribe) return refresh(); })
        .catch(function () { msg.textContent = "지우지 못했어. 잠시 뒤 다시 해줘."; b.disabled = false; });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var title = f.title.value.trim(), url = f.url.value.trim();
      if (!title) { msg.textContent = "제목을 적어줘."; return; }
      if (!/^https?:\/\/\S+\.\S+/.test(url)) { msg.textContent = "링크는 https:// 로 시작하는 주소로 넣어줘."; return; }
      var btn = form.querySelector(".sh-btn"); btn.disabled = true; msg.textContent = "저장하는 중…";
      var post = {
        id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: title, url: url,
        subject: f.subject.value, grade: f.grade.value,
        memo: f.memo.value.trim(), author: f.author.value.trim(),
        createdAt: new Date().toISOString()
      };
      store.add(post).then(function () {
        form.reset(); f.grade.value = "고1"; msg.textContent = "저장했어.";
        if (!store.subscribe) return refresh();
      }).catch(function (err) {
        msg.textContent = (err && err.message) || "저장하지 못했어. 잠시 뒤 다시 해줘.";
      }).then(function () { btn.disabled = false; });
    });
  }

  global.StudyHub = { mount: mount, localStorageAdapter: localStorageAdapter };
})(window);
