/* 요법 인식 회귀 테스트 — 배포 전 실행: node tools/test-regimens.js
 * [문장, 기대 요법 id, (선택) 암종 문맥]  기대값 null = 등록하지 않아야 함(모호하거나 무관) */
global.window={};require('../assets/apuda-regimens.js');var R=window.APUDA_RX;
var T=[
['알림타 카보플라틴 키트루다','pem-plat'],['알림타 카보 키트루다','pem-plat'],['페메트렉시드 시스플라틴','pem-plat'],
['에토포시드 카보플라틴 티쎈트릭','ep'],['카보플라틴 에토포시드 임핀지','ep'],['소세포폐암 EP 요법','ep'],
['비소세포폐암이고 항암 시작해요',null],['카보플라틴 파클리탁셀','carbo-pac'],['카보 탁솔 키트루다','carbo-pac','폐암'],
['타그리소 먹어요','egfr'],['렉라자','egfr'],['알레센자','alk'],['키트루다 단독','io'],['도세탁셀','doce'],
['AC 4번 맞았어','ac'],['독소루비신 사이클로포스파마이드','ac'],['매주 탁솔','wpac'],['TC 요법','tc'],
['도세탁셀 카보플라틴 허셉틴 퍼제타','tchp'],['탁소텔 카보 허셉틴 퍼제타','tchp'],['tchp','tchp'],['허셉틴 퍼제타','her2'],['페스고','her2'],
['키트루다 파클리탁셀 카보플라틴','kn522','유방암'],['삼중음성 키트루다','kn522'],['엔허투','tdxd'],['입랜스 레트로졸','cdk'],['버제니오 아나스트로졸','cdk-abema'],['타목시펜','hormone'],
['젤로다','cape'],['옥살리플라틴이랑 젤로다','capox'],['엘록사틴 젤로다','capox'],['캡옥스 니볼루맙','capox'],['젤록스 옵디보','capox'],
['티에스원 옥살리플라틴','sox'],['티에스원이랑 옥살리','sox'],['티에스원','s1'],['폴폭스 8차','folfox'],['옥살리플라틴 5fu','folfox'],
['폴피리 아바스틴','folfiri'],['이리노테칸 5-FU','folfiri'],['론서프 아바스틴','lonsurf'],['사이람자 탁솔','ramu'],
['티쎈트릭 아바스틴','atezobev'],['간암 티쎈트릭','atezobev'],['임핀지 이뮤도','stride'],['렌비마','tki-liver'],
['폴피리녹스','ffx'],['폴피리녹스에서 젬아브로 변경','gnp'],['젬자 아브락산','gnp'],['젬아브','gnp'],['젬시타빈 단독','gem'],
['젬자 시스플라틴','gemcis'],['젬씨스 임핀지','gemcis'],['방사성요오드','rai'],['고용량 요오드 치료','rai'],
['루프린 주사','adt'],['자이티가','arpi'],['키트루다 인라이타','pembro-axi'],['옵디보 여보이','nivo-ipi'],['수텐','sutent'],['카보메틱스','tki-kidney'],
['자궁경부암 동시항암방사선','ccrt'],['두경부 동시항암방사선','ccrt-hn'],['직장암 동시항암방사선','crt-rectal'],['젤로다 먹으면서 방사선','crt-rectal'],['항암방사선 젤로다','crt-rectal'],
['키트루다 5FU 시스플라틴','fp'],['R-CHOP 3차','rchop'],['알칩','rchop'],['리툭시맙 CHOP','rchop'],['폴라이비','rchop'],['벤다무스틴 리툭시맙','br'],
['acetaminophen 먹었어',null],['brca 검사 결과',null],['brain mri 찍었어',null],['apple watch 샀어',null],['etc 검사',null],['타이레놀 먹었어',null],['백혈구 수치 낮대',null],['카보나라 먹었어',null],['시스템 오류 났어',null],['오늘 폴폭스 맞았어','folfox'],['젤로다 아침저녁 3알','cape'],['옵디보 맞았어','io'],['임핀지 유지','io'],['아바스틴만 맞아요','bev'],['허쥬마','her2'],['캄푸토 5fu 아바스틴','folfiri'],['심벤다','br'],['인라이타 키트루다 맞는 중','pembro-axi'],['리툭산이랑 엔독산 독소루비신','rchop'],['간암 렌비마','tki-liver'],['갑상선암 렌비마','tki-liver'],['직장암 젤로다 방사선','crt-rectal']
];
var bad=0;T.forEach(function(c){var r=R.findSure(c[0],c[2]);var got=r.r?r.r.id:null;var ok=got===c[1];if(!ok){bad++;console.log('✗',JSON.stringify(c[0]),'기대',c[1],'→',got,r.list.map(function(x){return x.r.id+':'+x.score}).join(' '))}});
console.log((T.length-bad)+'/'+T.length+' 통과');process.exit(bad?1:0);
