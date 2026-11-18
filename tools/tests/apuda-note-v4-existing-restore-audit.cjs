/* Read-only audit of existing V3 restore logic using private synthetic Map.
 * A detected defect is printed; this audit NEVER modifies production files.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const source=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/note-storage.js'),'utf8');
const context={crypto:webcrypto,TextEncoder};context.window=context;vm.createContext(context);
vm.runInContext(source,context,{filename:'note-storage.js'});
const api=context.ApuDaNoteStorage,values=new Map();
const store={getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
const record=(name)=>({profile:{name,cancer:'유방암'},logs:[],questions:[],meds:[]});
(async()=>{
  const key='synthetic/v3-note';
  const original=JSON.stringify(record('가상 이전'));
  store.setItem(key,original);
  await api.replace(store,key,record('가상 새 기록'),'synthetic-test');
  const recoveryKey=api.recoveryKey(key),saved=JSON.parse(store.getItem(recoveryKey));
  saved.before='{"broken":true}'; // deliberate corruption of the stored checkpoint
  store.setItem(recoveryKey,JSON.stringify(saved));
  let returned=false,error=null;
  try{returned=await api.recover(store,key);}catch(e){error=e.message;}
  const corruptedRestoredValue=store.getItem(key)==='{"broken":true}';
  const checkpointDeleted=store.getItem(recoveryKey)===null;
  if(returned&&corruptedRestoredValue&&checkpointDeleted){
    console.log('RISK REPRODUCED (synthetic only): old V3 recovery accepted corrupted checkpoint.before and removed checkpoint without validating restored JSON.');
  }else{
    console.log('RISK NOT REPRODUCED (synthetic only): '+JSON.stringify({returned,corruptedRestoredValue,checkpointDeleted,error}));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
