/* Student-facing screens: actions first; documentation lives in help/research. */
(()=>{'use strict';
const css=document.createElement('link');css.rel='stylesheet';css.href='focus-ui.css';document.head.append(css);
function tidy(root){if(!root)return;root.querySelectorAll('details').forEach(el=>{const label=el.querySelector('summary')?.textContent||'';if(/기획·감수 기준|실제 학생 사용 점검|추천 규칙·민감도|탐색 방식과 공식 자료/.test(label))el.hidden=true});root.querySelectorAll('.note,.mini,.small').forEach(el=>{if(/추천 순서 안정성|재미와 재시도 의지가 모두 긍정|선택·체험 기록은 이 브라우저|관심과 체크는 이 브라우저|5점 선택의 평균/.test(el.textContent))el.hidden=true})}
if(typeof homePage==='function'){
const review=typeof labReview==='function'?labReview:null,student=typeof depthStudentReview==='function'?depthStudentReview:null;
const originalResearch=research;
research=function(){return originalResearch()+`<details><summary>관심 추천은 어떻게 정할까?</summary><p>직접 관심 3점, 일치 활동 2점, 좋아하는 과목 1점, 세부 관심 2점, 긍정 체험 1점으로 탐색 순서를 정해요. 자체 탐색 규칙이며 적성검사 점수가 아니에요. 자신 있는 과목과 배울 과목은 공부 시작점을 보여줘요.</p><p>나 알아보기는 6가지 관심마다 4개씩, 총 24개 자체 질문을 사용해요. 모름은 평균에서 제외하고 관심별 숫자 답변이 3개 이상일 때 비교해요. 직업 예시는 두 관심의 평균으로 연결하며 공식 검사·취업 확률이 아니에요.</p></details>`+(review?review():'')+(student?student():'')};
homePage=function(){return `<section class="focus-welcome"><img src="cozy-study.jpg" alt="잠옷을 입은 짱구와 흰둥이"><div><span class="tag">🌱 오늘은 어떤 게 궁금해?</span><h2>좋아하는 것부터<br>하나씩 찾아보자.</h2><p>아직 몰라도 괜찮아. 네 속도로 시작해봐.</p></div></section><div class="focus-paths"><a href="know-me.html"><span>🐶</span><h2>나 알아보기</h2><p>흰둥이와 질문으로 내 취향 찾기</p><strong>질문 시작 →</strong></a><a href="/#career-lab"><span>🧭</span><h2>관심으로 직업 찾기</h2><p>좋아하는 과목·활동에서 준비까지</p><strong>관심 고르기 →</strong></a><a href="/#shiro-future"><span>🔮</span><h2>미래 구경하기</h2><p>앞으로의 변화와 새로운 일 만나기</p><strong>미래 보기 →</strong></a></div>`};
if(titles.home)titles.home=['승준이의 아지트','오늘의 작은 발견',''];
document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname!=='/')return;if(url.hash==='#career-lab'){route='self';page='explore';render()}else{const match=url.hash.match(/^#shiro-(future|life|career|plan|news|research)$/);if(match)document.querySelector('[data-page="'+match[1]+'"]')?.click()}});
const oldRender=render;render=function(){oldRender();if(page!=='research')tidy(document.querySelector('#content'))};render();
}else{const root=document.querySelector('#quiz');tidy(root);if(root)new MutationObserver(()=>tidy(root)).observe(root,{childList:true,subtree:true})}
})();
