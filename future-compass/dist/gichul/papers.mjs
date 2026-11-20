import {normalizeDomain,SUBJECT_GROUPS} from './catalog.mjs';
export const isQuestionPaper=r=>r?.type==='question'||r?.type==='bundle';
export const matchesFileType=(r,type)=>!type||(type==='question'?isQuestionPaper(r):r.type===type);
const kindOrder={question:0,bundle:1,answer:2,script:3,audio:4};
export function sortPaperResources(rows){return [...rows].sort((a,b)=>(kindOrder[a.type]??9)-(kindOrder[b.type]??9)||SUBJECT_GROUPS.findIndex(g=>g.id===normalizeDomain(a.domain))-SUBJECT_GROUPS.findIndex(g=>g.id===normalizeDomain(b.domain))||a.name.localeCompare(b.name,'ko',{numeric:true}));}
const stem=s=>s.normalize('NFKC').toLowerCase().replace(/정답표|정답|문제지|문제|가안|영역|pdf|zip|[\s_.·()\-]/g,'');
export function answersFor(paper,resources){const rows=resources.filter(r=>r.type==='answer'&&r.year===paper.year&&normalizeDomain(r.domain)===normalizeDomain(paper.domain)&&(r.round||1)===(paper.round||1));const exact=rows.filter(r=>stem(r.name)===stem(paper.name));return exact.length?exact:rows;}
