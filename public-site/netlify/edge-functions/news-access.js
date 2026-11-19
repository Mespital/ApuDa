const COOKIE_NAME = 'apuda_news_access';
const SESSION_MS = 8 * 60 * 60 * 1000;
const encoder = new TextEncoder();

const restrictedPath = (p) => p === '/news' || p === '/news/' || p.startsWith('/news/');
function isPublicPath(p) {
  return p === '/news/styles.css' ||
    p === '/news/oncology' || p.startsWith('/news/oncology/') ||
    p === '/news/data' || p.startsWith('/news/data/') ||
    p === '/news/status' || p.startsWith('/news/status/');
}
function safeNext(raw, origin) {
  if (typeof raw !== 'string' || raw.length > 1024 || raw.startsWith('//')) return '/news/';
  try {
    const u = new URL(raw, origin);
    return u.origin === origin && restrictedPath(u.pathname) &&
      !isPublicPath(u.pathname) && u.pathname !== '/news/unlock'
      ? u.pathname + u.search : '/news/';
  } catch { return '/news/'; }
}
function escapeHTML(v) {
  return String(v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function page(message = '', next = '/news/', unavailable = false) {
  const title = unavailable ? '접근 설정을 확인하고 있습니다' : '제약·헬스케어 뉴스';
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow"><title>' + title + ' | ApuDa</title>' +
    '<style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;min-height:100vh;' +
    'background:linear-gradient(160deg,#e7f0ff,#f5f8fd);font-family:system-ui,-apple-system,"Noto Sans KR",sans-serif;' +
    'color:#17304b;display:grid;place-items:center;padding:24px}.card{width:min(100%,420px);background:#fff;' +
    'border:1px solid #dce6f4;border-radius:24px;padding:clamp(26px,5vw,38px);box-shadow:0 14px 45px #17304b15}' +
    '.brand{font-size:17px;font-weight:850;color:#246bfe;text-decoration:none}.symbol{font-size:32px;margin-top:24px}' +
    'h1{font-size:25px;line-height:1.3;margin:12px 0}p{color:#617187;line-height:1.65;font-size:15px}' +
    'label{display:block;margin:24px 0 9px;font-size:14px;font-weight:800}input{width:100%;border:1px solid #b6cae2;' +
    'border-radius:13px;padding:15px 16px;font-size:22px;letter-spacing:.2em;text-align:center}' +
    'input:focus{outline:3px solid #cfe0ff;border-color:#246bfe}button{width:100%;padding:16px;margin-top:14px;' +
    'border:0;border-radius:13px;color:white;background:#246bfe;font:inherit;font-weight:850;cursor:pointer}' +
    '.error{padding:10px 12px;border-radius:10px;background:#fff1f0;color:#b52227;font-size:14px}' +
    '.back{display:block;margin-top:24px;text-align:center;font-size:14px;color:#57708c;text-decoration:none}</style>' +
    '</head><body><main class="card"><a class="brand" href="/">ApuDa</a><div class="symbol" aria-hidden="true">🔒</div>' +
    '<h1>' + title + '</h1><p>' + (unavailable ? '접근 설정을 준비 중입니다. 잠시 후 다시 확인해 주세요.' :
      '이 메뉴는 비밀번호 확인 후 이용할 수 있습니다.') + '</p>' +
    (message ? '<p class="error" role="alert">' + escapeHTML(message) + '</p>' : '') +
    (unavailable ? '' : '<form method="post" action="/news/unlock"><input type="hidden" name="next" value="' +
      escapeHTML(next) + '"><label for="news-passcode">4자리 비밀번호</label>' +
      '<input id="news-passcode" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" ' +
      'maxlength="4" autocomplete="off" placeholder="••••" required autofocus><button type="submit">뉴스 보기</button></form>') +
    '<a class="back" href="/">ApuDa 홈으로 돌아가기</a></main></body></html>';
}
const gateHeaders = {
  'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'private, no-store',
  'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
};
function steadyEqual(a,b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  for (let i=0; i<Math.max(a.length,b.length); i++) diff |= (a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
  return diff===0;
}
function bytesToBase64URL(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function sign(payload, secret) {
  const key = await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return bytesToBase64URL(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(payload))));
}
async function validToken(token,secret,pin) {
  if (!token || token.length>256) return false;
  const parts=token.split('.');
  if(parts.length!==2 || !/^\d{13}$/.test(parts[0])) return false;
  const expires=Number(parts[0]);
  if(expires<=Date.now() || expires>Date.now()+SESSION_MS) return false;
  return steadyEqual(parts[1],await sign('v1.'+parts[0]+'.'+pin,secret));
}
function readCookie(request,name) {
  const cookie=request.headers.get('cookie')||'';
  for(const item of cookie.split(';')) {
    const i=item.indexOf('=');
    if(i>=0 && item.slice(0,i).trim()===name) return item.slice(i+1).trim();
  }
  return '';
}

export default async function handler(request, context) {
  const url=new URL(request.url);
  const path=url.pathname;
  if(!restrictedPath(path) || isPublicPath(path)) return context.next();

  // Keep sensitive values on the server; only configuration status is shown.
  // Trim accidental whitespace from values entered through the Netlify dashboard.
  const rawPin=Netlify.env.get('APUDA_NEWS_PIN');
  const rawSecret=Netlify.env.get('APUDA_NEWS_SESSION_SECRET');
  const pin=typeof rawPin==='string'?rawPin.trim():'';
  const secret=typeof rawSecret==='string'?rawSecret.trim():'';
  const errors=[];
  if(!pin) errors.push('APUDA_NEWS_PIN: Production 값이 전달되지 않았습니다.');
  else if(!/^\d{4}$/.test(pin)) errors.push('APUDA_NEWS_PIN: 4자리 숫자 형식이 아닙니다.');
  if(!secret) errors.push('APUDA_NEWS_SESSION_SECRET: Production 값이 전달되지 않았습니다.');
  else if(secret.length<32) errors.push('APUDA_NEWS_SESSION_SECRET: 보안키는 32자 이상이어야 합니다.');
  if(errors.length)
    return new Response(page(errors.join(' / '), '/news/', true),{status:503,headers:gateHeaders});

  if(path==='/news/unlock') {
    if(request.method!=='POST') return new Response(null,{status:303,headers:{Location:'/news/','Cache-Control':'no-store'}});
    const origin=request.headers.get('origin');
    const fetchSite=(request.headers.get('sec-fetch-site')||'').toLowerCase();
    // Some edge proxies use an internal host for request.url even when the browser
    // submits a same-origin form from https://apuda.app. Browser Fetch Metadata
    // takes precedence; do not reject a verified same-origin browser submission.
    const knownOrigin=origin===url.origin || origin==='https://apuda.app';
    if(fetchSite==='cross-site' || fetchSite==='same-site' ||
       (fetchSite!=='same-origin' && origin && !knownOrigin))
      return new Response('Forbidden',{status:403,headers:{'Cache-Control':'no-store'}});
    const type=request.headers.get('content-type')||'';
    if(!type.toLowerCase().startsWith('application/x-www-form-urlencoded'))
      return new Response('Unsupported Media Type',{status:415});
    const raw=await request.text();
    if(raw.length>2048) return new Response('Payload Too Large',{status:413});
    const form=new URLSearchParams(raw);
    const next=safeNext(form.get('next'),url.origin);
    const candidate=form.get('pin')||'';
    if(!/^\d{4}$/.test(candidate) || !steadyEqual(candidate,pin))
      return new Response(page('비밀번호가 일치하지 않습니다.',next),{status:401,headers:gateHeaders});
    const expires=String(Date.now()+SESSION_MS);
    const token=expires+'.'+await sign('v1.'+expires+'.'+pin,secret);
    return new Response(null,{status:303,headers:{
      'Location':next,
      'Set-Cookie':COOKIE_NAME+'='+token+'; Path=/news/; HttpOnly; Secure; SameSite=Lax; Max-Age='+(SESSION_MS/1000),
      'Cache-Control':'private, no-store'
    }});
  }

  if(await validToken(readCookie(request,COOKIE_NAME),secret,pin)) return context.next();
  if(request.method!=='GET') return new Response('Unauthorized',{status:401,headers:{'Cache-Control':'private, no-store'}});
  return new Response(page('',safeNext(url.pathname+url.search,url.origin)),{status:200,headers:gateHeaders});
}
