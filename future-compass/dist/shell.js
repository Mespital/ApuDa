const personalEmojis={ai:'🧠',robots:'📱',health:'🩺',energy:'🌿',security:'🛡️',creative:'🎨',business:'💼',education:'📚',city:'🏙️',food:'🍳'};
const domainIcons={ai:'cpu',robots:'bot',health:'stethoscope',energy:'leaf',security:'shield-check',creative:'palette',business:'chart-no-axes-combined',education:'book-open',city:'building-2',food:'wheat'};
function appIcon(name){return `<span class="app-icon" style="--glyph:url(icons/${name}.svg)" aria-hidden="true"></span>`}
titles.home=['MY FUTURE COMPASS','승준이의 미래 아지트','좋아하는 것에서 시작해도 괜찮아. 오늘의 작은 발견이 내일의 방향이 될 거야.'];
function homePage(){const count=chosenSubjects.size+chosenActivities.size;const news=typeof newsData!=='undefined'&&newsData?.articles?.slice(0,3)||[];return `<section class="seungjun-hero"><div class="seungjun-copy"><span class="personal-badge">🌟 승준이만의 FUTURE ROOM</span><h2>승준아,<br>너의 속도로 가도 괜찮아.</h2><p>휴대폰이 궁금한 날도, 잠옷 입고 쉬고 싶은 날도.<br>좋아하는 것에서 미래를 찾아보자.</p><div class="personal-actions"><button data-page="future">🚀 미래 구경하기</button><button data-start-route="self">📱 좋아하는 것 찾기</button><button data-cheer-show>💌 응원 한 장</button></div><button class="cheer-setting" data-cheer-toggle>자동 응원 켜기 / 끄기</button><span id="cheer-setting-status" class="mini"></span></div><img src="future-friend.jpg" alt="짱구와 로봇이 함께 미래 도시를 탐험하는 그림" width="1672" height="941" fetchpriority="high"></section><div class="personal-cards"><button data-home-domain="robots"><img src="phone-friend.jpg" alt="" width="1672" height="941" loading="lazy"><span>📱 휴대폰이 왜 재미있을까?</span><small>기기·디자인·소프트웨어로 관심 넓히기</small></button><button data-page="plan"><img src="cozy-study.jpg" alt="" width="1672" height="941" loading="lazy"><span>🌙 잠옷 입고, 오늘 10분</span><small>부담 없이 작은 공부·탐구 시작하기</small></button><button data-page="news"><img src="shiro-letter.jpg" alt="" width="1254" height="1254" loading="lazy"><span>🐶 흰둥이의 소식 배달</span><small>서초고·학습·AI 소식 확인하기</small></button></div><div class="start-grid"><button class="start-card violet" data-start-route="flow"><span class="start-icon">${appIcon('sparkles')}</span><span class="start-text"><span class="start-label">미래에서 출발</span><strong>세상은 어떻게 바뀔까?</strong><span>10개 분야의 변화와 연결되는 직업 알아보기</span></span><span class="start-cta">미래 분야 탐색</span></button><button class="start-card teal" data-start-route="self"><span class="start-icon">${appIcon('compass')}</span><span class="start-text"><span class="start-label">나에게서 출발</span><strong>나는 무엇이 재미있을까?</strong><span>좋아하는 과목과 활동으로 관심 분야 찾기</span></span><span class="start-cta">나의 관심 선택</span></button></div><div class="journey-strip"><div><span class="journey-icon purple">${appIcon('heart')}</span><span><strong>${count?count+'개 관심 선택':'아직 모르면 괜찮아요'}</strong><small>${count?'관심 선택을 이어서 바꿀 수 있어요.':'과목보다 해보고 싶은 활동부터 골라도 돼요.'}</small></span></div><button data-page="plan"><span class="journey-icon orange">${appIcon('circle-check')}</span><span><strong>준비계획 ${completed.size} / 6단계</strong><small>주 2시간, 작은 경험부터 시작</small></span><span class="mini">이어보기</span></button></div><section class="section"><div class="section-heading"><div><span class="section-kicker">FUTURE WORLDS</span><h2>어떤 미래가 궁금해?</h2></div><button class="text-button" data-page="future">10·20·30년 뒤 보기</button></div><div class="world-grid">${domains.map(d=>`<button class="world-card" data-home-domain="${d.id}" data-field="${d.id}"><span class="domain-icon"><span class="personal-emoji">${personalEmojis[d.id]}</span></span><strong>${d.name}</strong><span>${d.subjects.slice(0,3).join(' · ')}</span></button>`).join('')}</div></section><section class="section"><div class="section-heading"><div><span class="section-kicker">DAILY SIGNALS</span><h2>AI·학습 소식</h2></div><button class="text-button" data-page="news">전체 소식 보기</button></div><div class="home-news">${news.length?news.map(a=>`<a class="home-news-row" href="${escapeHTML(safeArticleURL(a.url))}" target="_blank" rel="noopener noreferrer"><span class="news-symbol">${appIcon('newspaper')}</span><span><small>${escapeHTML(a.source)} · ${dateLabel(a.published_at)}</small><strong>${escapeHTML(a.title)}</strong></span><span class="tag">${escapeHTML(a.category)}</span></a>`).join(''):'<div class="empty">공식 소식을 불러오는 중이에요. <button class="text-button" data-page="news">뉴스 화면에서 확인</button></div>'}</div><p class="mini">공식 발표의 원문 제목입니다. 발표 날짜와 실제 보급 시점은 다를 수 있어요.</p></section><section class="section"><div class="extra-grid">${[['life','heart','달라지는 생활','공부·집·이동은 어떻게 달라질까?'],['career','graduation-cap','직업과 대학','실제 업무, 관련 학과와 준비 공부'],['research','flask-conical','전망과 근거','확인된 연구와 미래 시나리오 구분']].map(([p,i,t,d])=>`<button class="extra-card" data-page="${p}">${appIcon(i)}<strong>${t}</strong><span>${d}</span></button>`).join('')}</div></section><p class="mini local-note">관심과 체크는 이 브라우저에만 저장돼요. 다른 기기와 자동 동기화되지는 않습니다.</p>`}
let installPrompt=null;
function announce(message){const el=document.querySelector('#app-message');if(!el)return;el.textContent=message;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),4500)}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.startRoute){page='explore';route=b.dataset.startRoute;activeDomain=null;render();saveProgress();window.scrollTo({top:0,behavior:'smooth'})}if(b.dataset.homeDomain){page='career';activeDomain=b.dataset.homeDomain;render();document.querySelector('#domain-detail')?.scrollIntoView({behavior:'smooth',block:'start'})}if(b.hasAttribute('data-install')){if(installPrompt){await installPrompt.prompt();installPrompt=null}else document.querySelector('#install-dialog').showModal()}if(b.hasAttribute('data-close-install'))document.querySelector('#install-dialog').close();if(b.dataset.page)document.querySelector('.bottom-nav [aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'})});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
window.addEventListener('appinstalled',()=>{installPrompt=null;announce('홈 화면에 추가했어요. 아이콘으로 다시 만나세요!')});
function connectionStatus(){const e=document.querySelector('#connection-status');if(e)e.textContent=typeof navigator!=='undefined'&&navigator.onLine===false?'오프라인 · 저장된 탐색':'나의 탐험 공간'}
window.addEventListener('online',()=>{connectionStatus();if(typeof refreshNews==='function')refreshNews()});window.addEventListener('offline',connectionStatus);
if(typeof navigator!=='undefined'&&'serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)announce('새 버전이 준비됐어요. 앱을 다시 열면 적용돼요.')})})}).catch(()=>{});}
page='home';

const cheerMessages=[
'승준아, 오늘은 10분만 해도 괜찮아. 시작한 만큼 앞으로 가는 거야.',
'한 번의 점수가 너의 가능성을 전부 말해주지는 않아.',
'휴대폰이 재미있다면, 왜 재미있는지 한 가지 적어보자. 그것도 탐구의 시작이야.',
'모르는 건 질문하면 돼. 질문하는 힘도 실력이야.',
'잘 쉬는 시간도 필요해. 잠옷 입고 편하게 쉬었다 다시 해보자.',
'진로를 지금 하나로 정하지 않아도 괜찮아. 경험하면서 바꿔도 돼.',
'남의 속도보다 승준이의 다음 한 걸음이 더 중요해.',
'오늘 틀린 문제 하나를 이해했다면, 오늘의 공부는 의미가 있어.'
];
let cheerIndex=0,cheerTimer=null,cheerPaused=false;
function cheerEnabled(){try{return localStorage.getItem('compass-cheer-off')!=='1'}catch{return true}}
function hideCheer(){document.querySelector('#seungjun-cheer')?.remove();if(cheerTimer)clearTimeout(cheerTimer)}
function showCheer(manual=false){
 if(!manual&&!cheerEnabled())return;
 hideCheer();const dog=cheerIndex%2===0;
 const card=document.createElement('aside');card.id='seungjun-cheer';card.className='cheer-popup';
 card.setAttribute('aria-label','승준이를 위한 응원 카드');
 card.innerHTML='<img src="'+(dog?'shiro-letter.jpg':'phone-friend.jpg')+'" alt="'+(dog?'편지를 가져온 흰둥이':'응원을 전하는 짱구')+'"><div><span class="tag">'+(dog?'🐶 흰둥이가 편지를 가져왔어':'💌 짱구의 응원 한 장')+'</span><p role="status">'+cheerMessages[cheerIndex++%cheerMessages.length]+'</p><button data-cheer-close>닫기</button><button data-cheer-pin>계속 보기</button><button data-cheer-disable>자동 응원 끄기</button></div>';
 document.body.appendChild(card);cheerTimer=setTimeout(hideCheer,7000);
 card.addEventListener('mouseenter',()=>{clearTimeout(cheerTimer)});
 card.addEventListener('focusin',()=>{clearTimeout(cheerTimer)});
 card.addEventListener('mouseleave',()=>{if(!cheerPaused)cheerTimer=setTimeout(hideCheer,7000)});
 cheerPaused=false;
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-cheer-show'))showCheer(true);
 if(b.hasAttribute('data-cheer-close'))hideCheer();
 if(b.hasAttribute('data-cheer-pin')){cheerPaused=true;clearTimeout(cheerTimer);b.textContent='응원 카드를 고정했어요';}
 if(b.hasAttribute('data-cheer-toggle')||b.hasAttribute('data-cheer-disable')){
  const off=b.hasAttribute('data-cheer-disable')||cheerEnabled();
  try{localStorage.setItem('compass-cheer-off',off?'1':'0')}catch{}
  hideCheer();const status=document.querySelector('#cheer-setting-status');if(status)status.textContent=off?'자동 응원 꺼짐':'자동 응원 켜짐';
  if(!off)showCheer(true);
 }
});
setTimeout(()=>{if(page!=='home'||document.hidden)return;let seen=false;try{seen=sessionStorage.getItem('compass-cheer-seen')==='1';sessionStorage.setItem('compass-cheer-seen','1')}catch{}if(!seen)showCheer()},1800);

