/* Public, code-free MINI distribution. The legacy APD1 assets remain compatible. */
(function(global){
  'use strict';
  var slugs=['breast','lung','stomach','colorectal','thyroid','kidney','prostate','pancreas','biliary','liver','lymphoma','cervical'];
  async function prepare(slug){
    if(slugs.indexOf(slug)<0)throw new Error('unknown-book');
    var response=await fetch('/library/mini/pdf/'+slug+'.bin');
    if(!response.ok)throw new Error('book-unavailable');
    var bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length<49||bytes.length>25*1024*1024||String.fromCharCode.apply(null,bytes.slice(0,4))!=='APD1')throw new Error('invalid-book');
    // This is a public compatibility key, not a password or access restriction.
    var base=await crypto.subtle.importKey('raw',new TextEncoder().encode('apuda1000'),'PBKDF2',false,['deriveKey']);
    var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes.slice(4,20),iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    var pdf=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(20,32)},key,bytes.slice(32)));
    if(String.fromCharCode.apply(null,pdf.slice(0,5))!=='%PDF-')throw new Error('invalid-pdf');
    return new Blob([pdf],{type:'application/pdf'});
  }
  function save(blob,name){
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},120000);
    return url;
  }
  global.ApuDaFreeBooks=Object.freeze({prepare:prepare,save:save,slugs:Object.freeze(slugs)});
})(window);
