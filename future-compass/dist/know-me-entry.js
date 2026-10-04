// Independent questionnaire invitation; existing explorer state stays untouched.
const knowMeHome=homePage;
homePage=function(){return `<section class="card" style="background:linear-gradient(120deg,#f1eaff,#fff3de);margin:16px 0;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><img src="shiro-letter.jpg" alt="편지를 물고 온 흰둥이" style="width:94px;height:94px;object-fit:cover;border-radius:20px"><div style="flex:1;min-width:180px"><span class="tag">🐶 흰둥이가 초대해요</span><h2>승준아, 너는 어떤 순간이 재밌어?</h2><p>24가지 질문으로 나의 취향을 만나봐. 잘 모르겠어도 괜찮아!</p><a href="know-me.html" style="display:inline-block;background:#7152d6;color:white;padding:10px 18px;border-radius:12px;text-decoration:none;font-weight:700">✨ 나 알아보기 →</a></div></section>`+knowMeHome()};
if(page==='home')render();
