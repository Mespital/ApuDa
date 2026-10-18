(function(global){'use strict';
function lab(text,key){var label={anc:'호중구|ANC',wbc:'백혈구|WBC',plt:'혈소판|PLT',hb:'혈색소|헤모글로빈|Hb|빈혈\\s*수치'}[key];var m=String(text).match(new RegExp('(?:'+label+')\\s*(?:수치)?\\s*(?:가|는|이|:)?\\s*([\\d,.]+)\\s*(만|천)?','i'));if(!m)return null;var v=Number(m[1].replace(/,/g,''));if(!isFinite(v))return null;var tail=String(text).slice(m.index+m[0].length).split(/[,，\n]|(?:호중구|백혈구|혈소판|혈색소)/)[0];var factor=m[2]==='만'?10000:m[2]==='천'?1000:1;var scientific=tail.match(/^\s*(?:[x×*]\s*)?10\s*(?:\^?\s*([39])|([³⁹]))\s*\/\s*([uµμ]l|㎕|l)(?=\s|[,，;]|$)/i);var scaled=!!(scientific&&((/3|³/.test(scientific[1]||scientific[2])&&/^[uµμ]|㎕/i.test(scientific[3]))||(/9|⁹/.test(scientific[1]||scientific[2])&&/^l$/i.test(scientific[3]))));var explicit=!!m[2]||scaled||/^\s*(?:개\s*)?\/\s*(?:[uµμ]l|㎕|mm(?:3|³))/i.test(tail);if(key==='hb')explicit=/^\s*g\s*\/\s*d[lL]/i.test(tail);if(scaled&&key!=='hb')factor*=1000;return {value:v*factor,unit:explicit?(key==='hb'?'g/dL':'/µL'):'unknown',raw:m[0]+tail.match(/^[^,，\n]*/)[0]};}
function signals(raw){
  var text=String(raw||''),now=-1,re=/(?:지금|현재|오늘)/g,m;
  while((m=re.exec(text)))now=m.index;
  var hasPast=/어제|그제|지난|예전에/.test(text),current=text;
  if(now>=0&&hasPast){current=text.slice(now);var nextPast=current.search(/어제|그제|지난|예전에/);if(nextPast>=0)current=current.slice(0,nextPast);}
  var historical=now<0&&hasPast;
  var example=/예시|예를\s*들|가정/.test(current);
  var hypothetical=example||/(?:38|39|40)(?:\.\d)?\s*(?:도|℃)?\s*(?:이면|라면|면)|발열\s*기준|몇\s*도/.test(current);
  var negative=/열(?:이|은|도)?\s*(?:없|안\s*나)|발열(?:이|은)?\s*없/.test(current),temp=null;
  var pattern=/(?:체온|열|온도|미열)\s*(?:이|은|는|:|가)?\s*(3[4-9](?:\.\d)?|4[0-2](?:\.\d)?)(?:\s*도\s*(\d)\s*부)?|(3[4-9](?:\.\d)?|4[0-2](?:\.\d)?)\s*(?:도|℃|°)(?:\s*(\d)\s*부)?/g;
  while((m=pattern.exec(current))){temp=m[1]||m[3];var fraction=m[2]||m[4];if(fraction&&temp.indexOf('.')<0)temp+='.'+fraction;}
  if(temp==null&&/^\s*(3[4-9]\.\d|4[0-2]\.\d)\s*$/.test(current))temp=current.trim();
  if(negative||hypothetical)temp=null;
  var clear=current.replace(/숨(?:이)?\s*안\s*차(?:요|고|지만|다)?|호흡곤란(?:이|은)?\s*없(?:어요|고|지만|다)?|가슴\s*통증(?:이|은)?\s*없(?:어요|고|지만|다)?|의식(?:이|은)?\s*명료/g,'');
  clear=clear.replace(/(?:숨이?\s*차|호흡곤란|가슴\s*통증|경련)\s*(?:면|이면|라면)/g,'');
  var urgent=!historical&&!example&&/숨이?\s*(?:(?:몹시|너무|많이|심하게)\s*)?차|숨이?\s*막|숨쉬기\s*(힘|어려)|호흡곤란|가슴(?:이)?\s*(통증|조)|피를\s*토|토혈|의식\s*(이\s*)?(흐|없|처)|쓰러|경련|말이?\s*어눌|입술이?\s*파|얼굴이?\s*부|목이?\s*부/.test(clear);
  return {temp:temp,current:now>=0,historical:historical,hypothetical:hypothetical,urgent:urgent};
}
function appendTemp(log,value,raw){if(!Array.isArray(log.tempReadings)){log.tempReadings=[];if(log.temp!==''&&log.temp!=null)log.tempReadings.push({value:String(log.temp),at:null,legacy:true});}log.tempReadings.push({value:String(value),at:new Date().toISOString(),raw:String(raw||'')});log.temp=String(value);}
function temps(log){if(Array.isArray(log.tempReadings)&&log.tempReadings.length)return log.tempReadings.map(function(x){return +x.value;}).filter(isFinite);return log.temp!==''&&log.temp!=null&&isFinite(+log.temp)?[+log.temp]:[];}
function maxTemp(log){var a=temps(log);return a.length?Math.max.apply(null,a):null;}
function labUnit(row,key){return row.units&&row.units[key]||'unknown';}
function labValue(row,key){return labUnit(row,key)==='unknown'||row[key]===''||row[key]==null?null:+row[key];}
global.ApuDaNoteSafety=Object.freeze({lab:lab,signals:signals,appendTemp:appendTemp,temps:temps,maxTemp:maxTemp,labUnit:labUnit,labValue:labValue});
})(window);
