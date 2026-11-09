/* ApuDa 하루수첩 V4: stand-alone synthetic-data prototype.
 * This code NEVER reads or writes the production key apuda_cancer_care_v1.
 * No HTTP/fetch/analytics, no clinical decision support, no auto-sharing.
 */
(() => {
  'use strict';
  const DEMO_KEY = 'apuda_carenotebook_v4_demo_only_20261109';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const localDay = (date = new Date()) => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const dayAgo = (offset) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-offset); return localDay(d); };
  const formatDay = (day) => { const [y,m,d]=day.split('-').map(Number); return `${m}월 ${d}일`; };
  const symptomNames = ['메스꺼움','구토','설사','변비','피로','어지러움','잠들기 어려움','기타 불편'];
  const mealNames = ['평소만큼','절반 정도','조금','거의 못 먹음'];

  function seedRecords() {
    return [
      [12,36.6,2,'평소만큼',[], ''],[10,36.5,3,'절반 정도',['피로'],''],
      [8,null,3,'절반 정도',['메스꺼움'],''],[6,36.7,4,'조금',['피로'],''],
      [5,36.4,2,'절반 정도',[],''],[3,36.7,2,'평소만큼',[],''],
      [1,36.8,1,'평소만큼',[],''],[0,null,1,'절반 정도',[],'']
    ].map(([offset,temp,pain,meal,symptoms,note]) => ({id:`sample-${offset}`,date:dayAgo(offset),createdAt:new Date().getTime()-(offset*86400000),author:'가상 환자',temperature:temp,pain,painSite:'',meal,symptomStatus:symptoms.length?'있음':'없음',symptoms,note,synthetic:true}));
  }

  function readStore() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(DEMO_KEY));
      if (parsed && Array.isArray(parsed.records) && Array.isArray(parsed.questions)) {
        return {records:parsed.records.filter((r)=>r&&typeof r.date==='string'&&typeof r.id==='string'),questions:parsed.questions.filter((q)=>typeof q==='string').slice(0,3),author:parsed.author==='보호자'?'보호자':'본인',largeText:!!parsed.largeText};
      }
    } catch (_) { /* private browsing may prohibit session storage */ }
    return {records:seedRecords(),questions:['최근 기록한 변화 중 진료 때 먼저 설명할 것은 무엇인가요?'],author:'본인',largeText:false};
  }

  let store = readStore();
  let currentView = 'home';
  let wizardStep = 0;
  let draft = freshDraft();
  let editingId = null;
  let lastSaveSnapshot = null;
  let historyRange = 7;
  let visitRange = 7;
  let toastTimer = null;
  let lastModalFocus = null;

  function freshDraft() { return {temperature:null,tempUnmeasured:true,pain:null,painSite:'',meal:null,symptomStatus:null,symptoms:[],note:''}; }
  function persist() { try { sessionStorage.setItem(DEMO_KEY,JSON.stringify(store)); return true; } catch (_) { toast('이 환경에서는 탭 내 저장을 사용할 수 없습니다.'); return false; } }
  function toast(message) { const t=$('#toast'); t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3300); }
  function ordered(range) { const start=dayAgo(range-1); return store.records.filter(r=>r.date>=start&&r.date<=dayAgo(0)).sort((a,b)=>(b.date.localeCompare(a.date))||(b.createdAt-a.createdAt)); }
  function allOrdered() { return [...store.records].sort((a,b)=>(b.date.localeCompare(a.date))||(b.createdAt-a.createdAt)); }
  function finiteTemp(r) { return typeof r.temperature==='number' && Number.isFinite(r.temperature); }
  function finitePain(r) { return Number.isInteger(r.pain) && r.pain>=0 && r.pain<=10; }
  function tempText(r) { return finiteTemp(r)?`${r.temperature.toFixed(1)}℃`:'미측정'; }
  function painText(r) { return finitePain(r)?`${r.pain}점`:'미기록'; }
  function labelAuthor(r) { return r.author==='보호자'?'보호자 대신 기록':r.author==='가상 환자'?'가상 예시':'본인 기록'; }
  function latestByDay(rows) { const days=new Map(); for(const row of rows){if(!days.has(row.date))days.set(row.date,row);} return days; }

  function navigate(view, resetCheckin = true) {
    if (view==='checkin' && resetCheckin) startWizard();
    currentView=view;
    $$('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
    $$('[data-view]').forEach(button=>{ const chosen=button.dataset.view===view;button.classList.toggle('active',chosen);if(button.classList.contains('nav-item'))button.setAttribute('aria-current',chosen?'page':'false'); });
    if(view==='home')renderHome();
    if(view==='history')renderHistory();
    if(view==='visit')renderVisit();
    if(view==='settings')renderSettings();
    if(view==='checkin')renderWizard();
    $('#main-content').focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }

  function renderHome() {
    const recent=allOrdered()[0];
    $('#home-latest').innerHTML=recent ? `<div class="latest-row"><div><div class="latest-title">${esc(formatDay(recent.date))} · ${esc(labelAuthor(recent))}</div><div class="latest-date">${recent.synthetic?'가상 예시':'이번 탭에서 작성한 체험 기록'}</div><div class="latest-chips"><span class="info-chip">체온 ${esc(tempText(recent))}</span><span class="info-chip">통증 ${esc(painText(recent))}</span><span class="info-chip">식사 ${esc(recent.meal||'미기록')}</span></div></div><span aria-hidden="true" style="font-size:25px;color:#b8d1c0">✳</span></div>` : '<p class="empty-state">아직 기록이 없습니다. 언제든 시작해 보세요.</p>';
  }

  function startWizard(record=null) {
    wizardStep=0;
    editingId=record?.id||null;
    draft=record ? {temperature:finiteTemp(record)?record.temperature:null,tempUnmeasured:!finiteTemp(record),pain:finitePain(record)?record.pain:null,painSite:record.painSite||'',meal:record.meal||null,symptomStatus:record.symptomStatus||null,symptoms:[...(record.symptoms||[])],note:record.note||''} : freshDraft();
  }

  function choice(label,value,selected,extra='') { return `<button type="button" class="choice-card${selected?' selected':''}" data-choice="${esc(value)}" aria-pressed="${selected?'true':'false'}">${esc(label)}${extra}</button>`; }
  function renderWizard() {
    const body=$('#wizard-body');
    $('.wizard-foot').style.display='flex';
    $('#progress-text').textContent=`${Math.min(wizardStep+1,5)} / 5 단계${editingId?' · 수정 중':''}`;
    $('#progress-bar').style.width=`${(wizardStep+1)*20}%`;
    $('#wizard-back').textContent=wizardStep===0?'취소':'이전';
    $('#wizard-next').innerHTML=wizardStep===4?'기록 저장하기 <span aria-hidden="true">✓</span>':'다음 <span aria-hidden="true">→</span>';
    if(wizardStep===0){
      body.innerHTML=`<h2 class="question-title">체온을 재셨나요?</h2><p class="question-help">실제로 측정한 값이 있다면 입력하세요. 측정하지 않았다면 그대로 넘어가도 됩니다.</p><div class="input-row"><label for="temp-input" class="sr-only">측정 체온</label><input id="temp-input" class="number-input" type="number" step="0.1" min="25" max="45" inputmode="decimal" placeholder="예: 36.5" value="${draft.temperature??''}"><span class="input-unit">℃</span></div><label class="checkbox-choice"><input id="temp-skip" type="checkbox" ${draft.tempUnmeasured?'checked':''}> 아직 재지 않았어요 (미측정)</label><p class="privacy-note">이 입력은 체온의 안전·위험 여부를 자동 판단하지 않습니다. 걱정되는 증상은 의료진과 상담하세요.</p>`;
      const input=$('#temp-input'), skip=$('#temp-skip');
      body.querySelector('.question-help').textContent='가상의 체온 수치로 체험해 주세요. 실제 환자의 건강정보는 입력하지 마세요.';
      input.disabled=skip.checked;
      skip.addEventListener('change',()=>{draft.tempUnmeasured=skip.checked;input.disabled=skip.checked;if(skip.checked){draft.temperature=null;input.value='';}else{input.focus();}});
      input.addEventListener('input',()=>{draft.tempUnmeasured=false;skip.checked=false;const value=input.value.trim();draft.temperature=value===''?null:Number(value);});
    } else if(wizardStep===1){
      body.innerHTML=`<h2 class="question-title">오늘 통증은 몇 점인가요?</h2><p class="question-help">0점은 통증 없음, 10점은 상상할 수 있는 가장 심한 통증입니다.</p><div class="pain-scale"><label for="pain-input" class="sr-only">통증 0점부터 10점</label><input id="pain-input" type="range" min="0" max="10" step="1" value="${draft.pain??0}"><span class="pain-result" id="pain-value">${draft.pain===null?'—':draft.pain}</span><span class="input-unit">점</span></div><div class="scale-labels"><span>0 통증 없음</span><span>10 매우 심함</span></div><div class="input-row"><button id="pain-zero" class="subtle-button" type="button">통증 없음 · 0점</button><button id="pain-skip" class="subtle-button" type="button">모르겠어요 / 건너뛰기</button></div>${draft.pain!==null&&draft.pain>0?`<div class="branch-box"><h3>어디가 불편한가요? (선택)</h3><div class="symptom-choices" id="pain-sites">${['머리','가슴','배','등·허리','팔·다리','그 외'].map(s=>`<button class="symptom-chip ${draft.painSite===s?'selected':''}" data-site="${s}" type="button" aria-pressed="${draft.painSite===s}">${s}</button>`).join('')}</div></div>`:''}`;
      $('#pain-input').addEventListener('input',(event)=>{draft.pain=Number(event.target.value);$('#pain-value').textContent=draft.pain;});
      $('#pain-input').addEventListener('change',renderWizard);
      $('#pain-zero').addEventListener('click',()=>{draft.pain=0;draft.painSite='';renderWizard();});
      $('#pain-skip').addEventListener('click',()=>{draft.pain=null;draft.painSite='';renderWizard();});
      $$('#pain-sites [data-site]').forEach(b=>b.addEventListener('click',()=>{draft.painSite=b.dataset.site;renderWizard();}));
    } else if(wizardStep===2){
      body.innerHTML=`<h2 class="question-title">식사는 얼마나 드셨어요?</h2><p class="question-help">평소 내 식사량과 비교해 가깝게 골라 주세요.</p><div class="choice-grid">${mealNames.map(s=>choice(s,s,draft.meal===s)).join('')}${choice('오늘은 건너뛸게요','미기록',draft.meal===null)}</div>`;
      $$('[data-choice]').forEach(b=>b.addEventListener('click',()=>{draft.meal=b.dataset.choice==='미기록'?null:b.dataset.choice;renderWizard();}));
    } else if(wizardStep===3){
      body.innerHTML=`<h2 class="question-title">그 밖에 불편한 곳이 있나요?</h2><p class="question-help">없거나 아직 말하기 어렵다면 넘어가도 괜찮아요.</p><div class="choice-grid">${['없음','있음','나중에'].map(s=>choice(s,s,draft.symptomStatus===s)).join('')}</div>${draft.symptomStatus==='있음'?`<div class="branch-box"><h3>해당하는 것을 골라 주세요. (복수 선택 가능)</h3><div class="symptom-choices" id="symptom-picks">${symptomNames.map(s=>`<button type="button" class="symptom-chip ${draft.symptoms.includes(s)?'selected':''}" data-symptom="${s}" aria-pressed="${draft.symptoms.includes(s)}">${s}</button>`).join('')}</div><label for="note-input" style="display:block;font-size:12px;color:#84958a;margin-top:16px">추가로 남길 말 (선택, 200자 이내)</label><textarea id="note-input" class="notes-field" maxlength="200" placeholder="시험용 가상 문장만 입력하세요">${esc(draft.note)}</textarea></div>`:''}`;
      $$('[data-choice]').forEach(b=>b.addEventListener('click',()=>{draft.symptomStatus=b.dataset.choice;if(draft.symptomStatus!=='있음'){draft.symptoms=[];draft.note='';}renderWizard();}));
      $$('#symptom-picks [data-symptom]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.symptom;draft.symptoms=draft.symptoms.includes(s)?draft.symptoms.filter(x=>x!==s):[...draft.symptoms,s];renderWizard();}));
      $('#note-input')?.addEventListener('input',(event)=>{draft.note=event.target.value.slice(0,200);});
    } else {
      const old=editingId?store.records.find(r=>r.id===editingId):null;
      body.innerHTML=`<h2 class="question-title">이렇게 기록할까요?</h2><p class="question-help">저장 전 확인할 수 있고, 저장 후에도 수정하거나 되돌릴 수 있어요.</p><div class="review-card"><div class="review-row"><span>날짜 · 작성자</span><strong>${esc(formatDay(old?.date||dayAgo(0)))} · ${esc(old?.author==='가상 환자'?store.author:old?.author||store.author)}</strong></div><div class="review-row"><span>체온</span><strong>${esc(draft.temperature===null?'미측정':draft.temperature.toFixed(1)+'℃')}</strong></div><div class="review-row"><span>통증</span><strong>${esc(draft.pain===null?'미기록':`${draft.pain}점${draft.painSite?' · '+draft.painSite:''}`)}</strong></div><div class="review-row"><span>식사</span><strong>${esc(draft.meal||'미기록')}</strong></div><div class="review-row"><span>기타 불편</span><strong>${esc(draft.symptomStatus==='있음'?(draft.symptoms.join(', ')||'있음 · 내용 미선택'):draft.symptomStatus||'미기록')}</strong></div>${draft.note?`<div class="review-row"><span>메모</span><strong>${esc(draft.note)}</strong></div>`:''}</div><div class="privacy-note">실제 기록이 아니라 가상 체험 데이터입니다. 외부에 자동 공유하지 않습니다.</div>`;
    }
  }

  function validateCurrent() {
    if(wizardStep===0 && draft.temperature!==null && (!Number.isFinite(draft.temperature)||draft.temperature<25||draft.temperature>45)){toast('체온은 입력 오류 방지를 위해 25~45℃ 범위의 숫자로 입력해 주세요.');return false;}
    return true;
  }
  function nextWizard() {
    if(!validateCurrent())return;
    if(wizardStep<4){wizardStep++;renderWizard();$('#wizard-body').scrollIntoView({block:'nearest',behavior:'smooth'});}else saveDraft();
  }
  function backWizard() {if(wizardStep===0){navigate('home');return;}wizardStep--;renderWizard();}
  function saveDraft() {
    lastSaveSnapshot=JSON.stringify(store.records);
    const old=editingId?store.records.find(r=>r.id===editingId):null;
    const record={id:editingId||`demo-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:old?.date||dayAgo(0),createdAt:old?.createdAt||Date.now(),author:old?.author==='가상 환자'?store.author:(old?.author||store.author),temperature:draft.temperature===null?null:Math.round(draft.temperature*10)/10,pain:draft.pain,painSite:draft.painSite,meal:draft.meal,symptomStatus:draft.symptomStatus,symptoms:draft.symptomStatus==='있음'?draft.symptoms:[],note:draft.symptomStatus==='있음'?draft.note:'',synthetic:true};
    store.records=store.records.filter(r=>r.id!==record.id).concat(record);
    persist();
    wizardStep=4;
    $('#progress-text').textContent='체험 기록 완료';
    $('#progress-bar').style.width='100%';
    $('#wizard-body').innerHTML='<div class="success-screen"><div class="success-mark" aria-hidden="true">✓</div><h2>오늘 기록을 잘 남기셨어요</h2><p>마음이 놓이도록 간단히 정리했습니다.<br>이 기록은 체험 탭 안에만 보관됩니다.</p><div class="success-actions"><button id="undo-save" class="secondary-button" type="button">방금 저장 되돌리기</button><button id="go-history" class="primary-button" type="button">기록 확인하기 →</button></div></div>';
    $('.wizard-foot').style.display='none';
    $('#undo-save').addEventListener('click',()=>{if(lastSaveSnapshot){store.records=JSON.parse(lastSaveSnapshot);persist();lastSaveSnapshot=null;navigate('history');toast('방금 저장한 변경을 되돌렸습니다.');}});
    $('#go-history').addEventListener('click',()=>navigate('history'));
    toast('체험 기록을 저장했습니다.');
  }

  function renderHistory() {
    $('#range-7').classList.toggle('selected',historyRange===7);$('#range-30').classList.toggle('selected',historyRange===30);
    $('#range-7').setAttribute('aria-pressed',historyRange===7);$('#range-30').setAttribute('aria-pressed',historyRange===30);
    const rows=ordered(historyRange), dateMap=latestByDay(rows), days=Array.from({length:historyRange},(_,i)=>dayAgo(historyRange-1-i));
    const chart=$('#pain-chart');
    chart.innerHTML=days.map((d,i)=>{const r=dateMap.get(d),valid=r&&finitePain(r);const pain=valid?r.pain:null;const barHeight=valid?Math.max(3,pain*10):2;const label=`${formatDay(d)}: ${valid?pain+'점':'미기록'}`;const showDate=historyRange===7||i%5===0||i===historyRange-1;return `<div class="bar-column${valid?'':' missing'}" title="${esc(label)}"><span class="bar-value">${valid?pain:'·'}</span><div class="bar-body" style="height:${barHeight}px" aria-hidden="true"></div>${showDate?`<span class="bar-date">${esc(formatDay(d))}</span>`:''}</div>`;}).join('');
    chart.setAttribute('aria-label',days.map(d=>{const r=dateMap.get(d);return `${formatDay(d)} ${r&&finitePain(r)?r.pain+'점':'미기록'}`;}).join(', '));
    const temps=rows.filter(finiteTemp),pains=rows.filter(finitePain);const latestT=temps[0]?.temperature,highestT=temps.length?Math.max(...temps.map(r=>r.temperature)):null;
    $('#trend-overview').innerHTML=`<div class="stat"><span>최근 측정 체온</span><strong>${latestT===undefined?'—':latestT.toFixed(1)+'℃'}</strong><small>${latestT===undefined?'측정 기록 없음':formatDay(temps[0].date)+' 측정'}</small></div><div class="stat"><span>기록상 최고 체온</span><strong>${highestT===null?'—':highestT.toFixed(1)+'℃'}</strong><small>선택한 기간의 측정값</small></div><div class="stat"><span>최근 기록 통증</span><strong>${pains.length?pains[0].pain+'점':'—'}</strong><small>${pains.length?formatDay(pains[0].date)+' 기록':'기록 없음'}</small></div>`;
    $('#record-count').textContent=`${rows.length}건`;$('#record-list').innerHTML=rows.length?rows.map(r=>`<div class="record-item"><div><strong>${esc(formatDay(r.date))}</strong><small>${esc(labelAuthor(r))}${r.synthetic?' · 가상 자료':''}</small></div><div class="record-summary"><span class="info-chip">체온 ${esc(tempText(r))}</span><span class="info-chip">통증 ${esc(painText(r))}</span><span class="info-chip">식사 ${esc(r.meal||'미기록')}</span><button type="button" class="subtle-button" data-edit="${esc(r.id)}">수정</button></div></div>`).join(''):'<div class="empty-state">선택한 기간에 기록이 없습니다.</div>';
    $$('[data-edit]').forEach(b=>b.addEventListener('click',()=>{const r=store.records.find(x=>x.id===b.dataset.edit);if(r){startWizard(r);navigate('checkin',false);}}));
  }

  function renderVisit() {
    $('#visit-7').classList.toggle('selected',visitRange===7);$('#visit-30').classList.toggle('selected',visitRange===30);
    $('#visit-7').setAttribute('aria-pressed',visitRange===7);$('#visit-30').setAttribute('aria-pressed',visitRange===30);
    const rows=ordered(visitRange),temps=rows.filter(finiteTemp),pains=rows.filter(finitePain),lastTemp=temps[0],highest=temps.length?Math.max(...temps.map(r=>r.temperature)):null;
    const meals=mealNames.map(name=>[name,rows.filter(r=>r.meal===name).length]).filter(([name,count])=>count);
    const symptomRows=rows.filter(r=>r.symptomStatus==='있음');
    const reporters=[...new Set(rows.map(r=>labelAuthor(r)))];
    $('#visit-summary').innerHTML=`<div class="sheet-range">대상 기간: ${esc(formatDay(dayAgo(visitRange-1)))} ~ ${esc(formatDay(dayAgo(0)))} / 기록 ${rows.length}건 / 작성자 ${esc(reporters.join(' · ')||'없음')}</div><div class="summary-data"><div class="data-item"><span>가장 최근 측정한 체온</span><strong>${lastTemp?lastTemp.temperature.toFixed(1)+'℃':'기록 없음'}</strong><small>${lastTemp?formatDay(lastTemp.date)+'에 측정':'미측정은 0℃로 취급하지 않음'}</small></div><div class="data-item"><span>기간 내 최고 측정 체온</span><strong>${highest===null?'기록 없음':highest.toFixed(1)+'℃'}</strong><small>측정값 중 최고값 · 위험 판정 아님</small></div><div class="data-item"><span>가장 최근 기록한 통증</span><strong>${pains.length?pains[0].pain+' / 10':'기록 없음'}</strong><small>${pains.length?formatDay(pains[0].date)+' · 본인 선택 점수':'미기록은 0점이 아님'}</small></div><div class="data-item"><span>기간 내 통증 범위</span><strong>${pains.length?Math.min(...pains.map(r=>r.pain))+' ~ '+Math.max(...pains.map(r=>r.pain))+'점':'기록 없음'}</strong><small>통증 점수가 있는 ${pains.length}건 기준</small></div></div><div class="summary-section"><h3>식사 기록</h3><p>${meals.length?meals.map(([m,c])=>`${esc(m)} ${c}건`).join(' · '):'식사량 기록 없음'}${rows.some(r=>r.meal===null)?` · 식사 미기록 ${rows.filter(r=>r.meal===null).length}건`:''}</p></div><div class="summary-section"><h3>선택한 기타 불편</h3><p>${symptomRows.length?esc([...new Set(symptomRows.flatMap(r=>r.symptoms||[]))].join(' · ')||'불편 있음(세부 항목 미선택)'):'선택한 기간에 추가 불편 기록이 없습니다. (증상이 없다는 뜻은 아닙니다.)'}</p>${symptomRows.some(r=>r.note)?`<p style="margin-top:8px">체험 메모: ${esc(symptomRows.filter(r=>r.note).map(r=>r.note).slice(0,3).join(' / '))}</p>`:''}</div><div class="summary-section"><h3>기록의 범위와 누락</h3><p>이 기간은 ${visitRange}일이며 총 ${rows.length}건의 체험 기록이 있습니다. 기록이 없던 날과 미측정 항목은 정상 값이나 증상 없음으로 간주하지 않았습니다.</p></div>`;
    $('#question-list').innerHTML=store.questions.length?store.questions.map((q,i)=>`<div class="question-item"><span>${i+1}. ${esc(q)}</span><button data-question-delete="${i}" aria-label="${i+1}번 질문 삭제" type="button">삭제</button></div>`).join(''):'<p class="chart-help">진료 때 궁금한 것을 한 가지씩 적어 보세요.</p>';
    $$('[data-question-delete]').forEach(b=>b.addEventListener('click',()=>{store.questions.splice(Number(b.dataset.questionDelete),1);persist();renderVisit();}));
    $('#add-question').disabled=store.questions.length>=3;
    $('#question-input').disabled=store.questions.length>=3;
    $('#question-input').placeholder=store.questions.length>=3?'질문은 최대 3개까지 저장됩니다.':'예: 최근 달라진 증상을 어떻게 설명할까요?';
  }

  function renderSettings() {
    document.body.classList.toggle('large-text',store.largeText);
    $('#large-text-toggle').setAttribute('aria-pressed',store.largeText);
    $('#large-text-toggle').setAttribute('aria-label',store.largeText?'큰 글씨 끄기':'큰 글씨 켜기');
    $('#author-self').classList.toggle('selected',store.author==='본인');$('#author-caregiver').classList.toggle('selected',store.author==='보호자');
    $('#author-self').setAttribute('aria-pressed',store.author==='본인');$('#author-caregiver').setAttribute('aria-pressed',store.author==='보호자');
  }

  function showHelp(){lastModalFocus=document.activeElement;$('#help-modal').hidden=false;$('#help-close').focus();document.body.style.overflow='hidden';}
  function hideHelp(){ $('#help-modal').hidden=true;document.body.style.overflow='';lastModalFocus?.focus(); }

  // Static controls
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
  $('#start-checkin').addEventListener('click',()=>navigate('checkin'));
  $('#wizard-back').addEventListener('click',backWizard);
  $('#wizard-next').addEventListener('click',nextWizard);
  $('#range-7').addEventListener('click',()=>{historyRange=7;renderHistory();});
  $('#range-30').addEventListener('click',()=>{historyRange=30;renderHistory();});
  $('#visit-7').addEventListener('click',()=>{visitRange=7;renderVisit();});
  $('#visit-30').addEventListener('click',()=>{visitRange=30;renderVisit();});
  $('#print-summary').addEventListener('click',()=>window.print());
  $('#add-question').addEventListener('click',()=>{const q=$('#question-input').value.trim();if(!q){toast('질문을 입력해 주세요.');return;}if(store.questions.length>=3){toast('질문은 최대 3개입니다.');return;}store.questions.push(q.slice(0,120));persist();$('#question-input').value='';renderVisit();toast('체험 질문을 추가했습니다.');});
  $('#question-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#add-question').click();}});
  $('#large-text-toggle').addEventListener('click',()=>{store.largeText=!store.largeText;persist();renderSettings();});
  $('#author-self').addEventListener('click',()=>{store.author='본인';persist();renderSettings();toast('다음 기록의 작성자를 본인으로 표시합니다.');});
  $('#author-caregiver').addEventListener('click',()=>{store.author='보호자';persist();renderSettings();toast('다음 기록의 작성자를 보호자로 표시합니다.');});
  $('#reset-demo').addEventListener('click',()=>{if(!window.confirm('현재 탭의 체험 기록과 질문만 초기화하고 가상의 예시로 되돌릴까요? 실제 ApuDa 기록에는 영향이 없습니다.'))return;store={records:seedRecords(),questions:['최근 기록한 변화 중 진료 때 먼저 설명할 것은 무엇인가요?'],author:'본인',largeText:false};persist();renderSettings();toast('가상 예시 자료로 초기화했습니다.');});
  $('#help-trigger').addEventListener('click',showHelp);$('#help-close').addEventListener('click',hideHelp);$('#help-continue').addEventListener('click',hideHelp);
  $('#help-modal').addEventListener('click',e=>{if(e.target.id==='help-modal')hideHelp();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#help-modal').hidden)hideHelp();if(e.key==='Tab'&&!$('#help-modal').hidden){const els=Array.from($('#help-modal').querySelectorAll('button,a[href]'));const i=els.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();els[els.length-1].focus();}else if(!e.shiftKey&&i===els.length-1){e.preventDefault();els[0].focus();}}});

  renderSettings();renderHome();
})();
