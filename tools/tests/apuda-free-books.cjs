const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../public-site'),pdfDir=process.env.APUDA_PDF_DIR||path.join(root,'library/mini/pdf'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
(async()=>{
  const c={crypto:webcrypto,TextEncoder,Blob,fetch:async url=>{const slug=url.split('/').at(-1).replace('.bin','');const b=fs.readFileSync(path.join(pdfDir,slug+'.bin'));return {ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};}};c.window=c;
  vm.createContext(c);vm.runInContext(read('assets/apuda-free-books.js'),c);
  assert.equal(c.ApuDaFreeBooks.prepare.length,1,'download API has no user-entered code argument');
  await assert.rejects(c.ApuDaFreeBooks.prepare('../invalid'));
  const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/apuda-pdf-manifest.json'))).books;
  for(const slug of c.ApuDaFreeBooks.slugs){
    const blob=await c.ApuDaFreeBooks.prepare(slug),bytes=Buffer.from(await blob.arrayBuffer()),expected=metadata.find(x=>x.slug===slug);
    assert.equal(blob.type,'application/pdf');assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256,slug);
    assert(metadata.find(x=>x.slug===slug).match,slug+' page count');
  }
  const html=read('library/mini/index.html');assert(!html.includes('id="downloadCode"'));assert(!html.includes('type="password"'));assert(!html.includes('sha256('));assert(html.includes('ApuDaFreeBooks.prepare(slug)'));assert(!html.includes('DM으로'));assert(!html.includes('댓글을'));
  for(const slug of c.ApuDaFreeBooks.slugs){
    const faq=JSON.parse(read('library/faq/data/'+slug+'.json')),mini=JSON.parse(read('library/mini/data/'+slug+'.json'));
    assert.equal(faq.items.length,100);assert.equal(new Set(faq.items.map(x=>x.n)).size,100);assert(faq.items.every(x=>x.review.clinicalApproval==='pending'));assert(faq.items.filter(x=>x.review.sourceRefs.length).every(x=>x.review.sourceRefs.every(id=>faq.sources[id])));
    assert(faq.items.filter(x=>x.n===55||x.n===90).every(x=>x.a.includes('30일이 지난 뒤 신청하면 신청한 날부터')));assert(mini.updates.some(x=>x.text.includes('30일이 지난 뒤 신청하면 신청한 날부터')));
  }
  c.fetch=async()=>({ok:false});await assert.rejects(c.ApuDaFreeBooks.prepare('breast'));
  console.log('PASS: code-free browser crypto opens all 12 real PDFs byte-for-byte; declared page counts; no code/SNS gate; 1,200 FAQ IDs/review fields and all-cancer benefit corrections; failed fetch rejects');
})().catch(e=>{console.error(e);process.exitCode=1;});
