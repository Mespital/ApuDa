(function (global) {
  'use strict';
  if (global.ApuDaVideoDialog) return;
  var current = null, serial = 0, apiPromise = null, cache = {};
  var names = {breast:'유방암',lung:'폐암',stomach:'위암',colorectal:'대장암',thyroid:'갑상선암',kidney:'신장암',prostate:'전립선암',pancreas:'췌장암',biliary:'담도암',liver:'간암',lymphoma:'림프종',cervical:'자궁경부암'};
  function el(tag, cls, text) { var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
  function link(label, href, cls) { var a=el('a',cls||'avd-resource',label);a.href=href;return a; }
  function event(opened) { global.dispatchEvent(new CustomEvent('apuda:video-state',{detail:{open:opened}})); }
  function api() {
    if(global.YT&&global.YT.Player)return Promise.resolve(global.YT);
    if(apiPromise)return apiPromise;
    apiPromise=new Promise(function(resolve,reject){
      var before=global.onYouTubeIframeAPIReady,done=false,script=el('script');
      function finish(error){if(done)return;done=true;clearTimeout(timer);if(error){apiPromise=null;script.remove();reject(error);}else resolve(global.YT);}
      var timer=setTimeout(function(){finish(new Error('player-api-timeout'));},12000);
      global.onYouTubeIframeAPIReady=function(){try{if(before)before();}finally{if(global.YT&&global.YT.Player)finish();else finish(new Error('player-api-unavailable'));}};
      script.src='https://www.youtube.com/iframe_api';
      script.onerror=function(){finish(new Error('player-api-unavailable'));};document.head.appendChild(script);
    });return apiPromise;
  }
  function stopVideo() {
    if(!current)return;
    clearTimeout(current.bufferTimer);current.bufferTimer=null;clearTimeout(current.readyTimer);current.readyTimer=null;
    if(current.player){try{current.player.destroy();}catch(ignore){}current.player=null;}
    current.playerBox.replaceChildren();
  }
  function loadVideo(slug, id) {
    if(!current)return;
    var videos=global.ApuDaCancerVideos.items(slug);if(!videos.length)return;
    id=videos.some(function(v){return v.id===id;})?id:videos[0].id;
    stopVideo();var session=current, token=++serial;
    session.slug=slug;session.id=id;
    session.title.textContent=names[slug]+' 영상과 안내';
    session.select.value=slug;
    session.choices.replaceChildren();
    global.ApuDaCancerVideos.items(slug).forEach(function(v){var b=el('button','avd-choice',v.name+' 영상');b.type='button';b.setAttribute('aria-pressed',String(v.id===id));b.addEventListener('click',function(){loadVideo(slug,v.id);});session.choices.appendChild(b);});
    var iframe=el('iframe');iframe.id='apudaVideoFrame';iframe.title=names[slug]+' · ApuDa YouTube 영상';
    iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=0&playsinline=1&rel=0&enablejsapi=1&fs=1&hl=ko&cc_load_policy=1&cc_lang_pref=ko&origin='+encodeURIComponent(location.origin);
    iframe.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';iframe.allowFullscreen=true;
    iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');session.playerBox.appendChild(iframe);
    session.status.textContent='영상의 재생 버튼을 누르면 이 창에서 시청할 수 있어요.';
    session.fallback.hidden=true;session.external.href='https://www.youtube.com/watch?v='+id;
    session.readyTimer=setTimeout(function(){if(current!==session||token!==serial)return;session.status.textContent='영상을 준비하지 못했어요. 다시 불러오거나 아래의 책자와 FAQ를 먼저 읽어 보세요.';session.fallback.hidden=false;},18000);
    api().then(function(YT){if(current!==session||token!==serial)return;
      session.player=new YT.Player(iframe,{events:{onReady:function(){clearTimeout(session.readyTimer);session.readyTimer=null;if(current===session&&token===serial)session.status.textContent='재생 버튼으로 시청을 시작하세요. 아래에는 같은 암종의 책자와 FAQ가 있어요.';},onStateChange:function(e){if(current!==session||token!==serial)return;clearTimeout(session.readyTimer);session.readyTimer=null;clearTimeout(session.bufferTimer);session.bufferTimer=null;if(e.data===1){session.status.textContent='시청 중에도 아래에서 같은 암종의 책자와 FAQ를 확인할 수 있어요.';session.fallback.hidden=true;}else if(e.data===3){session.bufferTimer=setTimeout(function(){if(current!==session||token!==serial)return;session.status.textContent='영상 준비가 지연되고 있어요. 잠시 기다리거나 아래에서 다시 불러오기를 선택하세요. 책자와 FAQ는 계속 볼 수 있어요.';session.fallback.hidden=false;},15000);}},onError:function(e){if(current!==session||token!==serial)return;clearTimeout(session.readyTimer);session.readyTimer=null;clearTimeout(session.bufferTimer);session.bufferTimer=null;session.status.textContent=(e.data===101||e.data===150)?'게시자 설정으로 이 영상의 사이트 내 재생이 제한돼 있어요.':'영상을 불러오지 못했어요. 아래 자료는 계속 볼 수 있어요.';session.fallback.hidden=false;}}});
    }).catch(function(){if(current===session&&token===serial){clearTimeout(session.readyTimer);session.readyTimer=null;session.status.textContent='재생되지 않으면 다시 불러오기를 눌러 주세요. 아래 자료도 함께 이용할 수 있어요.';session.fallback.hidden=false;}});
    loadResources(session,slug);
    if(history.state&&history.state.apudaVideoDialog)history.replaceState(Object.assign({},history.state,{apudaVideoDialog:{slug:slug,id:id}}),'',location.href);
  }
  function json(path) { if(!cache[path])cache[path]=fetch(path).then(function(r){if(!r.ok)throw new Error('resource-unavailable');return r.json();}).catch(function(e){delete cache[path];throw e;});return cache[path]; }
  function loadResources(session,slug) {
    var resourceToken=++session.resourceToken;
    var base='/library/';session.resources.replaceChildren();
    var intro=el('section','avd-section');intro.appendChild(el('span','avd-eyebrow','ApuDa에서 함께 읽기'));intro.appendChild(el('h3','',names[slug]+' 기본 안내'));
    intro.appendChild(el('p','','진단 첫 30일의 확인할 내용과 진료실에서 물어볼 질문을 차근차근 살펴보세요.'));
    if(slug==='biliary')intro.appendChild(el('p','avd-muted','영상은 담관암을 다룹니다. 아래 자료는 담도암 안내입니다.'));
    intro.appendChild(el('p','avd-muted','자막이 제공되는 영상은 CC 버튼에서 한국어 자막을 선택할 수 있어요. 아래 FAQ는 같은 암종의 글 자료이며 영상의 대본은 아니에요.'));
    intro.appendChild(link('영상 대신 글로 읽기',base+'faq/?cancer='+slug));
    session.resources.appendChild(intro);
    var book=el('section','avd-book');var cover=el('img');cover.src='/assets/books/'+slug+'.webp';cover.alt=names[slug]+' 진단 첫 30일 표지';cover.loading='lazy';cover.width=120;cover.height=170;book.appendChild(cover);
    var copy=el('div');copy.appendChild(el('span','avd-eyebrow','첫 진단을 위한 핵심 안내서'));copy.appendChild(el('h3','',names[slug]+' 진단 첫 30일'));
    copy.appendChild(el('p','avd-muted','웹에서 앞부분을 읽고, 전체 MINI PDF도 코드 입력 없이 무료로 받을 수 있어요.'));
    var actions=el('div','avd-actions');actions.appendChild(link('무료로 읽기',base+'mini/?cancer='+slug,'avd-primary'));actions.appendChild(link('PDF 받기',base+'mini/?cancer='+slug+'#download','avd-secondary'));copy.appendChild(actions);book.appendChild(copy);session.resources.appendChild(book);
    var faq=el('section','avd-section');faq.appendChild(el('h3','','자주 묻는 질문'));var faqBody=el('div','avd-faq');faqBody.appendChild(el('p','avd-muted','ApuDa FAQ를 불러오고 있어요…'));faq.appendChild(faqBody);faq.appendChild(link('FAQ 전체 보기',base+'faq/?cancer='+slug));session.resources.appendChild(faq);
    var questions=el('section','avd-section');questions.appendChild(el('h3','','진료 전 확인할 질문'));var qList=el('ul','avd-questions');questions.appendChild(qList);questions.hidden=true;session.resources.appendChild(questions);
    var more=el('section','avd-section');more.appendChild(el('h3','','더 알아보기'));var grid=el('div','avd-more');[['치료결정 지도','treatment-map'],['항암제 정보','drugs'],['검사결과·바이오마커','biomarkers'],['항암 요법 관리','regimens']].forEach(function(x){grid.appendChild(link(x[0],base+x[1]+'/?cancer='+slug));});more.appendChild(grid);session.resources.appendChild(more);
    var help=el('section','avd-section avd-contact');help.appendChild(el('h3','','기다리지 말고 연락할 증상'));help.appendChild(el('p','','암 치료 중 38.0℃ 이상 발열이면 치료병원에 바로 연락하세요. 심하게 떨리는 오한도 38.0℃ 미만이라도 기다리지 말고 연락하세요. 숨쉬기 힘들거나 의식이 처지면 119를 이용하세요.'));help.appendChild(link('병원 연락·응급 안내','/note/#sos'));session.resources.appendChild(help);
    var note=el('p','avd-notice','영상과 자료는 환자교육용입니다. 개인의 치료 선택·약 복용·검사와 증상 대처는 담당 의료진의 안내를 따르세요.');session.resources.appendChild(note);
    Promise.allSettled([json(base+'mini/data/'+slug+'.json'),json(base+'faq/data/'+slug+'.json')]).then(function(result){
      if(current!==session||session.slug!==slug||resourceToken!==session.resourceToken)return;
      if(result[0].status==='fulfilled'){var mini=result[0].value;if(mini.edition)copy.appendChild(el('p','avd-version','책자 '+mini.edition));(mini.faq||[]).slice(0,3).forEach(function(q){qList.appendChild(el('li','',q));});questions.hidden=!qList.children.length;}
      faqBody.replaceChildren();
      if(result[1].status==='fulfilled'){var data=result[1].value;(data.items||[]).slice(0,3).forEach(function(item){var d=el('details');d.appendChild(el('summary','',item.q));d.appendChild(el('p','',item.a));d.appendChild(link('이 문항의 근거·검토정보',base+'faq/?cancer='+slug+'#q'+item.n));faqBody.appendChild(d);});if(data.updated)faq.appendChild(el('p','avd-version','FAQ 개정 '+data.updated+' · ApuDa 공개 자료'));}
      else faqBody.appendChild(el('p','avd-muted','질문을 불러오지 못했어요. FAQ 전체 보기에서 확인해 주세요.'));
    });
  }
  function close(fromHistory) {
    if(!current)return;var session=current;++serial;stopVideo();current=null;
    session.root.remove();session.inert.forEach(function(x){if(x.node.isConnected)x.node.inert=x.value;});
    document.documentElement.style.overflow=session.overflow;document.body.classList.remove('apuda-video-open');event(false);
    if(session.opener&&session.opener.isConnected&&session.opener.focus)session.opener.focus({preventScroll:true});
    if(!fromHistory&&history.state&&history.state.apudaVideoDialog)history.back();
  }
  function open(value, id, fromHistory) {
    var catalog=global.ApuDaCancerVideos,slug=catalog&&catalog.normalize(value);if(!slug)return false;
    var list=catalog.items(slug);id=list.some(function(v){return v.id===id;})?id:list[0].id;
    if(current){loadVideo(slug,id);return true;}
    var root=el('div','avd-backdrop');root.id='apudaVideoDialog';
    var dialog=el('section','avd-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','avdTitle');
    var head=el('header','avd-header'),heading=el('h2');heading.id='avdTitle';head.appendChild(heading);var x=el('button','avd-close','닫기 ×');x.type='button';x.setAttribute('aria-label','영상 팝업 닫기');x.addEventListener('click',function(){close(false);});head.appendChild(x);dialog.appendChild(head);
    var controls=el('div','avd-controls'),label=el('label','','암종 선택');label.htmlFor='avdCancer';var select=el('select');select.id='avdCancer';Object.keys(names).forEach(function(k){var o=el('option','',names[k]);o.value=k;select.appendChild(o);});label.appendChild(select);controls.appendChild(label);
    var expand=el('button','avd-expand','영상 확대');expand.type='button';expand.setAttribute('aria-pressed','false');expand.addEventListener('click',function(){var yes=dialog.classList.toggle('avd-expanded');expand.setAttribute('aria-pressed',String(yes));expand.textContent=yes?'기본 크기로':'영상 확대';});controls.appendChild(expand);dialog.appendChild(controls);
    var choices=el('div','avd-choices');dialog.appendChild(choices);var stage=el('div','avd-stage'),box=el('div','avd-player');stage.appendChild(box);dialog.appendChild(stage);
    var status=el('p','avd-status');status.setAttribute('role','status');dialog.appendChild(status);
    var fallback=el('details','avd-fallback');fallback.hidden=true;fallback.appendChild(el('summary','','영상이 재생되지 않나요?'));var retry=el('button','avd-secondary','다시 불러오기');retry.type='button';retry.addEventListener('click',function(){if(current)loadVideo(current.slug,current.id);});fallback.appendChild(retry);var external=link('YouTube에서 직접 보기','','avd-secondary');external.target='_blank';external.rel='noopener noreferrer';fallback.appendChild(external);dialog.appendChild(fallback);
    var resources=el('div','avd-resources');dialog.appendChild(resources);root.appendChild(dialog);
    current={root:root,title:heading,select:select,choices:choices,playerBox:box,status:status,fallback:fallback,external:external,resources:resources,player:null,resourceToken:0,opener:document.activeElement,overflow:document.documentElement.style.overflow,inert:[]};
    Array.from(document.body.children).forEach(function(node){if(node.tagName==='SCRIPT'||node.tagName==='STYLE')return;current.inert.push({node:node,value:node.inert});node.inert=true;});
    document.body.appendChild(root);document.body.classList.add('apuda-video-open');document.documentElement.style.overflow='hidden';
    select.addEventListener('change',function(){loadVideo(select.value,null);});
    root.addEventListener('click',function(e){if(e.target===root)close(false);});
    if(!fromHistory)history.pushState(Object.assign({},history.state,{apudaVideoDialog:{slug:slug,id:id}}),'',location.href);
    loadVideo(slug,id);event(true);x.focus({preventScroll:true});return true;
  }
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-apuda-video]');if(!a)return;if(e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;if(open(a.dataset.apudaVideo,a.dataset.videoId)){e.preventDefault();e.stopPropagation();}});
  document.addEventListener('keydown',function(e){if(!current)return;if(e.key==='Escape'&&!document.fullscreenElement){e.preventDefault();e.stopImmediatePropagation();close(false);return;}if(e.key!=='Tab')return;var nodes=Array.from(current.root.querySelectorAll('button:not([disabled]),select,a[href],iframe,summary')).filter(function(n){return n.getClientRects().length&&!n.closest('[hidden]');});var first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}},true);
  global.addEventListener('popstate',function(e){if(current)close(true);else if(e.state&&e.state.apudaVideoDialog)open(e.state.apudaVideoDialog.slug,e.state.apudaVideoDialog.id,true);});
  global.ApuDaVideoDialog=Object.freeze({open:open,close:function(){close(false);},names:Object.freeze(names)});
})(window);
