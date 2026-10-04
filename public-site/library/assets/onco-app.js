(function(){
'use strict';
var O=window.APUDA_ONC, C=O.CANCERS, PAGE=document.body.dataset.page;
var ORDER=['breast','lung','stomach','colorectal','thyroid','kidney','prostate','pancreas','biliary','liver','lymphoma','cervical'];
var DRUG=Object.fromEntries(O.DRUGS.map(function(d){return [d.id,d]}));
var MK=Object.fromEntries(O.MARKERS.map(function(m){return [m.id,m]}));
var KIND={target:'표적치료 연결',io:'면역항암 연결',hormone:'호르몬치료 연결',monitor:'추적·진단 지표'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function $(s){return document.querySelector(s)}
function qs(){return new URLSearchParams(location.search)}
function setQS(obj,push){var p=qs();Object.keys(obj).forEach(function(k){obj[k]?p.set(k,obj[k]):p.delete(k)});var u=location.pathname+(p.toString()?'?'+p:'');(push?history.pushState:history.replaceState).call(history,null,'',u)}
function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'')}
function typeBadge(t){var T=O.TYPES[t];return '<span class="type" style="background:'+T.color+'">'+esc(T.label)+'</span>'}
function cancerTags(list,link){return list.map(function(c){return link?'<a class="tag" href="/library/treatment-map/?cancer='+c+'">'+esc(C[c].name)+'</a>':'<span class="tag">'+esc(C[c].name)+'</span>'}).join('')}
function markerTags(list,link){return list.map(function(m){var x=MK[m];if(!x)return '';return link?'<a class="tag m" href="/library/biomarkers/?id='+encodeURIComponent(m)+'">'+esc(x.name)+'</a>':'<span class="tag m">'+esc(x.name)+'</span>'}).join('')}
function fmtDate(s){if(!s)return '';var d=new Date(s);if(isNaN(d))return String(s).slice(0,10);return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0')}

/* ── header ── */
var NAV=[['map','/library/treatment-map/','🗺️ 치료결정 지도'],['drugs','/library/drugs/','💊 Drug Hub'],['biomarkers','/library/biomarkers/','🧬 바이오마커'],['about','/about/','💡 소개']];
$('#top').innerHTML='<a class="brand" href="/">ApuDa<small>아프지만, 다행이다.</small></a>'+
  '<nav class="nav">'+NAV.map(function(n){return '<a href="'+n[1]+'"'+(n[0]===PAGE?' class="on"':'')+'>'+n[2]+'</a>'}).join('')+'</nav>'+
  '<a class="back" href="/#floor-2">2F 서재로</a>';
$('#foot').innerHTML='<b>ApuDa는 치료를 결정하지 않습니다.</b> 이 페이지는 “왜 사람마다 치료가 달라지는지”를 이해하도록 돕는 환자교육용 자료이며, 개인의 진단·처방·예후 판단을 대신하지 않습니다. 국내 허가·급여 조건은 적응증과 치료 단계마다 다르고 수시로 바뀌므로 실제 사용 가능 여부는 담당 의료진과 <a href="https://nedrug.mfds.go.kr" target="_blank" rel="noopener">식약처 의약품안전나라</a>·<a href="https://www.hira.or.kr" target="_blank" rel="noopener">건강보험심사평가원</a>에서 확인하세요.<br>'+esc(O.BASIS);

/* ── live data (뉴스·공급부족) ── */
var NEWS=null, SUPPLY=null, SUPPLY_ASOF='';
function loadNews(){
  if(NEWS) return Promise.resolve(NEWS);
  var urls=['/news/data/oncology-30d.json','/news/data/period-highlights.json','/news/data/latest.json'];
  return Promise.all(urls.map(function(u){return fetch(u,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}))
  .then(function(rs){
    var items=[];
    if(rs[0]&&rs[0].items) items=items.concat(rs[0].items);
    if(rs[1]&&rs[1].periods) ['today','week','month'].forEach(function(k){var p=rs[1].periods[k];if(p&&p.items) items=items.concat(p.items)});
    var p2=rs[2]&&rs[2].path?fetch(rs[2].path,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}):Promise.resolve(null);
    return p2.then(function(day){
      if(day&&Array.isArray(day.top_news)) items=items.concat(day.top_news);
      var seen={};NEWS=[];
      items.forEach(function(it){var t=it&&it.title;if(!t||seen[t])return;seen[t]=1;
        var url=(it.source_links&&it.source_links[0]&&it.source_links[0].url)||(it.source_urls&&it.source_urls[0])||'';
        var on=it.oncology||{};
        var hay=norm([t,(it.summary||[])[0],(on.drug_generic||[]).join(' '),(on.drug_brand||[]).join(' '),(on.biomarkers||[]).join(' '),(on.targets||[]).join(' ')].join(' '));
        NEWS.push({title:t.replace(/\s-\s[^-]+$/,''),url:url,date:it.published_at,pub:(it.publishers||[])[0]||'',hay:hay});
      });
      NEWS.sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
      return NEWS;
    });
  });
}
function parseCSV(text){
  var rows=[],row=[],f='',q=false;
  for(var i=0;i<text.length;i++){var c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===','){row.push(f);f=''}
    else if(c==='\n'){row.push(f);rows.push(row);row=[];f=''}else if(c!=='\r')f+=c}
  if(f||row.length){row.push(f);rows.push(row)}
  var h=(rows.shift()||[]).map(function(x){return x.replace(/^﻿/,'').trim()});
  return rows.filter(function(r){return r.length>3}).map(function(r){var o={};h.forEach(function(k,i){o[k]=(r[i]||'').trim()});return o});
}
function loadSupply(){
  if(SUPPLY) return Promise.resolve(SUPPLY);
  return fetch('/news/downloads/mfds-drug-supply-issues.csv',{cache:'no-store'}).then(function(r){
    SUPPLY_ASOF=r.headers.get('last-modified')||'';return r.ok?r.text():'';
  }).then(function(t){SUPPLY=t?parseCSV(t):[];return SUPPLY}).catch(function(){SUPPLY=[];return SUPPLY});
}
function drugKeys(d){
  return d.match.filter(function(k){return k&&k.length>=2&&k.indexOf('(')<0&&k.indexOf('억제제')<0&&k.indexOf('요법')<0}).concat([d.en.split(/[\s(\/+]/)[0]].filter(function(x){return x&&x.length>4}));
}
function newsFor(keys,limit){
  var ks=keys.map(norm).filter(function(k){return k.length>=2});
  return (NEWS||[]).filter(function(n){return ks.some(function(k){return n.hay.indexOf(k)>=0})}).slice(0,limit||5);
}
function newsHtml(list){
  if(!list.length) return '<p style="color:var(--muted);font-size:12.5px">최근 30일 ApuDa 뉴스 데이터에서 관련 기사를 찾지 못했습니다.</p>';
  return '<div class="news">'+list.map(function(n){return '<a href="'+esc(n.url||'/news/')+'" target="_blank" rel="noopener"><b>'+esc(n.title)+'</b><small>'+esc(n.pub)+' · '+fmtDate(n.date)+'</small></a>'}).join('')+'</div>';
}

/* ═══════════ Drug Hub ═══════════ */
function pageDrugs(){
  var st={q:qs().get('q')||'',cancer:qs().get('cancer')||'',type:qs().get('type')||''};
  var root=$('#app');
  root.innerHTML=
   '<section class="hero"><div><span class="kicker">ApuDa DRUG HUB</span><h1>항암제 하나의 모든 것</h1><p>약 이름을 검색하면 <b>기전 → 관련 암종 → 바이오마커 → 공급상태 → 최근 뉴스</b>가 한 화면에 연결됩니다. 같은 약이라도 암종·병기·바이오마커·이전 치료에 따라 쓰이는 조건이 다릅니다.</p></div>'+
   '<div class="hero-stats"><div><b>'+O.DRUGS.length+'</b><small>약물·요법</small></div><div><b>12</b><small>암종 연결</small></div></div></section>'+
   '<div id="dview"></div>'+
   '<div id="lview"><div class="tools"><label class="search">🔎<input id="q" type="search" placeholder="약 이름·상품명·영문명 검색 (예: 키트루다, 오시머티닙, HER2)" value="'+esc(st.q)+'"></label>'+
   '<div class="chips" id="cchips"></div><div class="chips" id="tchips"></div></div><div class="grid" id="grid"></div></div>';
  var cch=$('#cchips'),tch=$('#tchips');
  cch.innerHTML='<button class="chip" data-c="">전체 암종</button>'+ORDER.map(function(c){return '<button class="chip" data-c="'+c+'">'+esc(C[c].name)+'</button>'}).join('');
  tch.innerHTML='<button class="chip" data-t="">전체 유형</button>'+Object.keys(O.TYPES).map(function(t){return '<button class="chip" data-t="'+t+'"><span class="dot" style="background:'+O.TYPES[t].color+'"></span>'+esc(O.TYPES[t].label)+'</button>'}).join('')+'<span class="count" id="cnt"></span>';
  cch.onclick=function(e){var b=e.target.closest('.chip');if(!b)return;st.cancer=b.dataset.c;setQS({cancer:st.cancer});list()};
  tch.onclick=function(e){var b=e.target.closest('.chip');if(!b)return;st.type=b.dataset.t;setQS({type:st.type});list()};
  $('#q').oninput=function(){st.q=this.value;setQS({q:st.q});list()};
  function list(){
    cch.querySelectorAll('.chip').forEach(function(b){b.classList.toggle('on',b.dataset.c===st.cancer)});
    tch.querySelectorAll('.chip').forEach(function(b){b.classList.toggle('on',b.dataset.t===st.type)});
    var q=norm(st.q);
    var arr=O.DRUGS.filter(function(d){
      if(st.cancer&&d.cancers.indexOf(st.cancer)<0)return false;
      if(st.type&&d.type!==st.type)return false;
      if(!q)return true;
      return norm([d.ko,d.en,d.brand,d.moa,d.markers.map(function(m){return MK[m]?MK[m].name:m}).join(' '),d.match.join(' ')].join(' ')).indexOf(q)>=0;
    });
    $('#cnt').textContent=arr.length+'개';
    $('#grid').innerHTML=arr.length?arr.map(function(d){
      return '<button class="card" data-id="'+d.id+'">'+typeBadge(d.type)+'<div><h3>'+esc(d.ko)+'</h3><span class="en">'+esc(d.en)+'</span></div>'+
        (d.brand?'<span class="brand-name">'+esc(d.brand)+'</span>':'')+'<p>'+esc(d.moa)+'</p><div class="tags">'+cancerTags(d.cancers)+markerTags(d.markers)+'</div></button>';
    }).join(''):'<div class="empty">조건에 맞는 약물이 없습니다. 검색어를 줄이거나 필터를 해제해 보세요.</div>';
  }
  $('#grid').onclick=function(e){var b=e.target.closest('.card');if(!b)return;setQS({id:b.dataset.id},true);route()};
  function detail(d){
    var dv=$('#dview');
    dv.innerHTML='<div class="detail"><div><section class="panel"><div class="d-head"><div>'+typeBadge(d.type)+'<h2>'+esc(d.ko)+'</h2><div class="en">'+esc(d.en)+(d.brand?' · <b style="color:var(--blue)">'+esc(d.brand)+'</b>':'')+'</div></div><button class="closebtn" id="dclose">← 목록으로</button></div>'+
     '<div class="sec"><h4>기전 <span class="ev">허가사항 요약</span></h4><p>'+esc(d.moa)+'</p><p style="color:var(--muted);font-size:12.5px;margin-top:4px">'+esc(O.TYPES[d.type].label)+' — '+esc(O.TYPES[d.type].desc)+'</p></div>'+
     '<div class="sec"><h4>관련 암종</h4><div class="tags">'+cancerTags(d.cancers,true)+'</div></div>'+
     (d.markers.length?'<div class="sec"><h4>주요 바이오마커</h4><div class="tags">'+markerTags(d.markers,true)+'</div></div>':'')+
     '<div class="sec"><h4>주로 쓰이는 상황 <span class="ev guide">가이드라인</span></h4><p>'+esc(d.use)+'</p></div>'+
     '<div class="sec"><h4>흔히 알려진 부작용</h4><ul>'+d.se.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>'+
     '<div class="sec meaning"><b>환자에게 의미</b><p>'+esc(d.note||'같은 약이라도 암종·병기·바이오마커·이전 치료에 따라 사용할 수 있는 조건이 다릅니다.')+'</p></div>'+
     '</section><section class="panel"><div class="sec" style="margin-top:0"><h4>최근 뉴스 <span class="ev press">언론보도</span></h4><div id="dnews"><p style="color:var(--muted);font-size:12.5px">불러오는 중…</p></div></div></section></div>'+
     '<aside class="side-sticky"><section class="panel"><div class="sec" style="margin-top:0"><h4>국내 상태</h4><div class="status">'+
       '<div class="st"><div class="st-h">허가 <span class="light na">적응증별 상이</span></div><p>암종·치료 단계마다 허가 범위가 다릅니다. 품목별 허가사항은 식약처에서 확인하세요.</p><a class="ext" href="https://nedrug.mfds.go.kr/searchDrug?itemName='+encodeURIComponent(drugKeys(d)[0]||d.ko)+'" target="_blank" rel="noopener">의약품안전나라 ↗</a></div>'+
       '<div class="st"><div class="st-h">건강보험 급여 <span class="light na">조건 확인 필요</span></div><p>같은 약도 적응증·바이오마커·치료차수에 따라 급여 여부가 다릅니다. 담당 의료진·원무과에 확인하세요.</p><a class="ext" href="https://www.hira.or.kr" target="_blank" rel="noopener">심평원 ↗</a><a class="ext" href="/news/">ApuDa 급여 변화 ↗</a></div>'+
       '<div class="st" id="dsupply"><div class="st-h">공급 <span class="light na">확인 중</span></div></div>'+
     '</div><div class="caution">공급 부족 소식이 있어도 치료 일정이나 약제를 임의로 변경하지 말고 치료기관에 확인하세요.</div></div></section></aside></div>';
    $('#dclose').onclick=function(){setQS({id:''},true);route()};
    loadSupply().then(function(rows){
      var keys=drugKeys(d), now=new Date(), cut=new Date(now.getFullYear()-3,now.getMonth(),now.getDate());
      var hit=rows.filter(function(r){return keys.some(function(k){return r['품목명'].indexOf(k)>=0})});
      var recent=hit.filter(function(r){var a=new Date(r['신고일']||r['공급부족예상일']);var b=new Date(r['정상화예상일']);return (a>=cut)||(b>=now)});
      recent.sort(function(a,b){return String(b['신고일']||b['공급부족예상일']).localeCompare(String(a['신고일']||a['공급부족예상일']))});
      var active=recent.filter(function(r){var b=new Date(r['정상화예상일']);return isNaN(b)||b>=now});
      var light=active.length?'<span class="light bad">공급부족 신고 '+active.length+'건</span>':(recent.length?'<span class="light warn">최근 3년 내 신고 이력</span>':'<span class="light ok">최근 신고 없음</span>');
      var html='<div class="st-h">공급 <span class="ev official">식약처 신고</span> '+light+'</div>';
      if(!rows.length) html='<div class="st-h">공급 <span class="light na">데이터 없음</span></div><p>식약처 공급부족 데이터를 불러오지 못했습니다.</p>';
      else if(!recent.length) html+='<p>식약처 공급중단·부족 보고 목록에서 최근 3년 내 이 성분 관련 신고가 확인되지 않았습니다.'+(hit.length?' (과거 이력 '+hit.length+'건)':'')+'</p>';
      else html+=recent.slice(0,4).map(function(r){var b=new Date(r['정상화예상일']);var done=!isNaN(b)&&b<now;
        return '<div class="supply-row"><b>'+esc(r['품목명'])+'</b><br>'+esc(r['업체명'])+' · 신고 '+esc(r['신고일']||'-')+'<br>정상화 예상 '+esc(r['정상화예상일']||'-')+(done?' <span style="color:var(--ok);font-weight:900">(예정일 경과)</span>':'')+(r['공급부족사유']?'<br><span style="color:#7a8ea3">사유: '+esc(r['공급부족사유'].slice(0,70))+(r['공급부족사유'].length>70?'…':'')+'</span>':'')+'</div>'}).join('')+(recent.length>4?'<p>외 '+(recent.length-4)+'건</p>':'');
      html+='<a class="ext" href="/news/downloads/mfds-drug-supply-issues.xlsx">전체 공급부족 목록 ↓</a>';
      $('#dsupply').innerHTML=html;
    });
    loadNews().then(function(){var el=$('#dnews');if(el)el.innerHTML=newsHtml(newsFor(drugKeys(d),6))}).catch(function(){var el=$('#dnews');if(el)el.innerHTML=newsHtml([])});
    document.title=d.ko+(d.brand?' ('+d.brand+')':'')+' | ApuDa Drug Hub';
  }
  function route(){
    var id=qs().get('id'), d=id&&DRUG[id];
    $('#lview').style.display=d?'none':'';$('.hero').style.display=d?'none':'';
    if(d){detail(d);window.scrollTo(0,0)}else{$('#dview').innerHTML='';document.title='ApuDa Drug Hub · 항암제 통합 프로필';list()}
  }
  addEventListener('popstate',function(){st.cancer=qs().get('cancer')||'';st.type=qs().get('type')||'';st.q=qs().get('q')||'';$('#q').value=st.q;route()});
  route();
}

/* ═══════════ Biomarker Navigator ═══════════ */
function pageMarkers(){
  var st={cancer:qs().get('cancer')||'',kind:''};
  var root=$('#app');
  root.innerHTML='<section class="hero"><div><span class="kicker">ApuDa BIOMARKER NAVIGATOR</span><h1>왜 이 검사를 하나요?</h1><p>약 이름보다 먼저 알아야 할 것은 <b>“내 암에 어떤 표지가 있는가”</b>입니다. 검사 하나를 누르면 <b>어떤 암에서 → 왜 검사하는지 → 결과가 치료와 어떻게 연결되는지 → 관련 약물 → 최근 뉴스</b>로 이어집니다.</p></div>'+
   '<div class="hero-stats"><div><b>'+O.MARKERS.length+'</b><small>바이오마커</small></div><div><b>'+O.DRUGS.length+'</b><small>연결 약물</small></div></div></section>'+
   '<div id="dview"></div><div id="lview"><div class="tools"><div class="chips" id="cchips"></div><div class="chips" id="kchips"></div></div><div class="grid" id="grid"></div></div>';
  $('#cchips').innerHTML='<button class="chip" data-c="">전체 암종</button>'+ORDER.map(function(c){return '<button class="chip" data-c="'+c+'">'+esc(C[c].name)+'</button>'}).join('');
  $('#kchips').innerHTML='<button class="chip" data-k="">전체</button>'+Object.keys(KIND).map(function(k){return '<button class="chip" data-k="'+k+'">'+KIND[k]+'</button>'}).join('');
  $('#cchips').onclick=function(e){var b=e.target.closest('.chip');if(!b)return;st.cancer=b.dataset.c;setQS({cancer:st.cancer});list()};
  $('#kchips').onclick=function(e){var b=e.target.closest('.chip');if(!b)return;st.kind=b.dataset.k;list()};
  function list(){
    document.querySelectorAll('#cchips .chip').forEach(function(b){b.classList.toggle('on',b.dataset.c===st.cancer)});
    document.querySelectorAll('#kchips .chip').forEach(function(b){b.classList.toggle('on',b.dataset.k===st.kind)});
    var arr=O.MARKERS.filter(function(m){return (!st.cancer||m.cancers.indexOf(st.cancer)>=0)&&(!st.kind||m.kind===st.kind)});
    $('#grid').innerHTML=arr.map(function(m){return '<button class="card" data-id="'+esc(m.id)+'"><span class="mk-kind '+m.kind+'">'+KIND[m.kind]+'</span><div><h3>'+esc(m.name)+'</h3><span class="en">'+esc(m.full)+'</span></div><p>'+esc(m.why.split('. ')[0])+'.</p><div class="tags">'+cancerTags(m.cancers)+'</div></button>'}).join('')||'<div class="empty">해당 조건의 바이오마커가 없습니다.</div>';
  }
  $('#grid').onclick=function(e){var b=e.target.closest('.card');if(!b)return;setQS({id:b.dataset.id},true);route()};
  function detail(m){
    var drugs=m.drugs.map(function(x){return DRUG[x]}).filter(Boolean);
    $('#dview').innerHTML='<div class="detail"><div><section class="panel"><div class="d-head"><div><span class="mk-kind '+m.kind+'">'+KIND[m.kind]+'</span><h2>'+esc(m.name)+'</h2><div class="en">'+esc(m.full)+'</div></div><button class="closebtn" id="dclose">← 목록으로</button></div>'+
      '<div class="sec"><h4>① 어떤 암에서 검사하나요?</h4><div class="tags">'+cancerTags(m.cancers,true)+'</div></div>'+
      '<div class="sec"><h4>② 어떻게 검사하나요?</h4><p>'+esc(m.test)+'</p></div>'+
      '<div class="sec"><h4>③ 왜 검사하나요? <span class="ev guide">가이드라인</span></h4><p>'+esc(m.why)+'</p></div>'+
      '<div class="sec meaning"><b>④ 결과는 치료와 어떻게 연결되나요?</b><p>'+esc(m.result)+'</p></div>'+
      '<div class="sec"><h4>⑤ 관련 약물</h4>'+(drugs.length?'<div class="grid" style="margin-top:0">'+drugs.map(function(d){return '<a class="card" href="/library/drugs/?id='+d.id+'">'+typeBadge(d.type)+'<div><h3>'+esc(d.ko)+'</h3><span class="en">'+esc(d.brand||d.en)+'</span></div></a>'}).join('')+'</div>':'<p style="color:var(--muted)">이 지표는 약을 고르는 기준이라기보다 진단·추적에 쓰입니다.</p>')+'</div>'+
      '</section><section class="panel"><div class="sec" style="margin-top:0"><h4>⑥ 최근 뉴스 <span class="ev press">언론보도</span></h4><div id="dnews"><p style="color:var(--muted);font-size:12.5px">불러오는 중…</p></div></div></section></div>'+
      '<aside class="side-sticky"><section class="panel"><div class="sec" style="margin-top:0"><h4>진료실에서 이렇게 물어보세요</h4><ol class="qlist"><li>'+esc(m.q)+'</li><li>검사 결과지는 사본으로 받을 수 있나요?</li><li>결과가 나오기 전에 치료를 시작해도 되나요?</li></ol></div>'+
      '<div class="sec"><h4>암종별 치료결정 지도에서 보기</h4><div class="mini-links">'+m.cancers.map(function(c){return '<a href="/library/treatment-map/?cancer='+c+'">🗺️ '+esc(C[c].name)+' 치료결정 지도<i>→</i></a>'}).join('')+'</div></div></section></aside></div>';
    $('#dclose').onclick=function(){setQS({id:''},true);route()};
    var keys=[m.name.split(/[\s\/·]/)[0],m.id].concat(m.id==='PDL1'?['PD-L1']:[]).concat(m.id==='MSI'?['MSI-H','dMMR']:[]).concat(m.id==='CLDN18'?['클라우딘','CLDN18']:[]).filter(function(k){return k&&k.length>=3});
    loadNews().then(function(){var el=$('#dnews');if(el)el.innerHTML=newsHtml(newsFor(keys,6))}).catch(function(){});
    document.title=m.name+' 바이오마커 | ApuDa';
  }
  function route(){var id=qs().get('id'),m=id&&MK[id];$('#lview').style.display=m?'none':'';$('.hero').style.display=m?'none':'';if(m){detail(m);scrollTo(0,0)}else{$('#dview').innerHTML='';document.title='ApuDa 바이오마커 Navigator';list()}}
  addEventListener('popstate',function(){st.cancer=qs().get('cancer')||'';route()});
  route();
}

/* ═══════════ 치료결정 지도 ═══════════ */
function pageMap(){
  var cur=qs().get('cancer'); if(!C[cur]) cur='breast';
  var root=$('#app');
  root.innerHTML='<section class="hero"><div><span class="kicker">ApuDa TREATMENT DECISION MAP</span><h1>왜 사람마다 치료가 다를까요?</h1><p>같은 암이라도 <b>종류 → 병기 → 수술 가능성 → 바이오마커 → 이전 치료</b>에 따라 치료의 길이 갈립니다. 암종을 고르면 치료가 결정되는 순서를 한눈에 보여 드립니다.</p>'+
   '<div class="principle">⚖️ <span><b>ApuDa는 “이 약을 쓰세요”라고 결정하지 않습니다.</b> 내 치료가 왜 그렇게 정해졌는지 이해하고, 진료실에서 더 좋은 질문을 하도록 돕습니다.</span></div></div>'+
   '<div class="hero-stats"><div><b>12</b><small>암종</small></div><div><b>6단계</b><small>결정 흐름</small></div></div></section>'+
   '<div class="cancer-tabs" id="tabs">'+ORDER.map(function(c){return '<button class="ctab" data-c="'+c+'"><i style="--cover:url(\'/assets/books/'+c+'.webp\')"></i><span>'+esc(C[c].name)+'</span></button>'}).join('')+'</div><div id="map"></div>';
  $('#tabs').onclick=function(e){var b=e.target.closest('.ctab');if(!b)return;cur=b.dataset.c;setQS({cancer:cur},true);draw(true)};
  function draw(scroll){
    var M=O.MAPS[cur], name=C[cur].name;
    document.querySelectorAll('.ctab').forEach(function(b){b.classList.toggle('on',b.dataset.c===cur)});
    var on=document.querySelector('.ctab.on'); if(on&&on.scrollIntoView&&matchMedia('(max-width:640px)').matches) on.scrollIntoView({block:'nearest',inline:'center'});
    var mks=O.MARKERS.filter(function(m){return m.cancers.indexOf(cur)>=0});
    var drugs=O.DRUGS.filter(function(d){return d.cancers.indexOf(cur)>=0});
    var byType={};drugs.forEach(function(d){(byType[d.type]=byType[d.type]||[]).push(d)});
    $('#map').innerHTML='<div class="map-wrap"><section class="panel"><span class="kicker">'+esc(name)+' 치료결정 지도 · Vol. '+C[cur].vol+'</span><p class="lead">'+esc(M.lead)+'</p>'+
      '<div class="flowline" style="margin-top:14px">'+M.steps.map(function(s,i){return (i?'<em>→</em>':'')+'<span>'+esc(s.t)+'</span>'}).join('')+'</div>'+
      '<div class="flow">'+M.steps.map(function(s,i){return '<div class="step"><div class="node">'+(i+1)+'</div><div class="step-body"><small>STEP '+(i+1)+' · '+esc(s.t)+'</small><h3>'+esc(s.q)+'</h3><p>'+esc(s.d)+'</p>'+(s.m&&s.m.length?'<div class="tags">'+markerTags(s.m,true)+'</div>':'')+'</div></div>'}).join('')+'</div></section>'+
      '<aside class="side-sticky"><section class="panel"><div class="sec" style="margin-top:0"><h4>치료의 큰 축</h4><div class="axes">'+M.axes.map(function(a){return '<span>'+esc(a)+'</span>'}).join('')+'</div></div>'+
      '<div class="sec"><h4>진료실 질문 3가지</h4><ol class="qlist">'+M.qs.map(function(q){return '<li>'+esc(q)+'</li>'}).join('')+'</ol></div>'+
      '<div class="sec"><h4>관련 바이오마커</h4><div class="tags">'+markerTags(mks.map(function(m){return m.id}),true)+'</div></div>'+
      '<div class="sec"><h4>관련 약물 <a href="/library/drugs/?cancer='+cur+'" style="margin-left:auto;color:var(--blue);font-size:11px">Drug Hub에서 전체 보기 →</a></h4>'+Object.keys(O.TYPES).filter(function(t){return byType[t]}).map(function(t){return '<div class="drug-group"><b>'+esc(O.TYPES[t].label)+'</b><div class="tags">'+byType[t].map(function(d){return '<a class="tag" href="/library/drugs/?id='+d.id+'">'+esc(d.ko.replace(/\(.*\)/,''))+'</a>'}).join('')+'</div></div>'}).join('')+'</div>'+
      '<div class="sec"><h4>'+esc(name)+' 더 읽기</h4><div class="mini-links"><a href="/library/mini/?cancer='+cur+'">📖 암진단 후 첫 30일 - '+esc(name)+' (무료)<i>→</i></a><a href="/library/faq/?cancer='+cur+'">❓ '+esc(name)+' FAQ<i>→</i></a></div></div></section></aside></div>';
    document.title=name+' 치료결정 지도 | ApuDa';
    if(scroll){var t=$('#map').getBoundingClientRect().top+scrollY-130;scrollTo({top:t,behavior:'smooth'})}
  }
  addEventListener('popstate',function(){var c=qs().get('cancer');cur=C[c]?c:'breast';draw()});
  draw(false);
}

if(PAGE==='drugs') pageDrugs(); else if(PAGE==='biomarkers') pageMarkers(); else pageMap();
})();
