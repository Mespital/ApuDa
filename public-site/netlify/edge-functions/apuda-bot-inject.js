// ApuDa 길잡이 자동 삽입 — apuda.app을 거쳐 열리는 외부 앱(/care, /pet, /farm, /support)에
// 원본 사이트를 고치지 않고 </body> 앞에 길잡이 스크립트를 넣는다. 실패하면 원본 그대로 돌려준다.
const CTX = { care: 'care', pet: 'pet', farm: 'farm', support: 'support' };

export default async (request, context) => {
  const res = await context.next();
  let html = null;
  try {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return res;
    const seg = new URL(request.url).pathname.split('/')[1];
    const ctx = CTX[seg];
    if (!ctx) return res;
    html = await res.text();
    if (!html.includes('apuda-bot.js')) {
      const tag = `<script src="/assets/apuda-bot.js" data-context="${ctx}" defer></script>`;
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, tag + '</body>') : html + tag;
    }
    const headers = new Headers(res.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    return new Response(html, { status: res.status, statusText: res.statusText, headers });
  } catch (e) {
    if (html !== null) return new Response(html, { status: res.status, headers: res.headers });
    return res;
  }
};

export const config = {
  path: ['/care/*', '/pet/*', '/farm/*', '/support/*']
};
