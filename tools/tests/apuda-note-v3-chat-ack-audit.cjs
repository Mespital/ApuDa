/* Chat queue review: asynchronous acknowledgments are now wired to the UI.
 * It DOES NOT prove production IndexedDB migration or old-tab compatibility.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/note-app.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../../public-site/note/index.html'),'utf8');
assert.match(app,/var chatWriteTail=Promise\.resolve\(\)/,'serialized write queue');
assert.match(app,/function saveChat\(messageKey\)/,'async-save chat enqueue');
assert.match(app,/var task=chatWriteTail\.then\(async function\(\)/,'await previous write');
assert.match(app,/await Promise\.resolve\(commitChatRaw\(raw\)\)/,'wait for actual storage ack');
assert.match(app,/chatExpectedRaw=raw;/,'update baseline after ack');
assert.match(app,/holdUnsaved\('chat',JSON\.stringify\(chat\),error\)/,'preserve complete latest conversation');
assert.match(app,/saveChat\(el\.dataset\.chatAt\)/,'every new DOM bubble tracks persistence');
assert.match(app,/setChatSaveStatus\(messageKey,'pending'\)/,'pending UI status');
assert.match(app,/setChatSaveStatus\(messageKey,'saved'\)/,'acknowledged UI status');
assert.match(app,/function failedChatIndicators\(\)/,'failed-message UI status');
assert.match(app,/async function undoLast\(btn\)/,'undo waits for writes');
assert.match(app,/await saveChat\(chatKey\)/,'undo chat write acknowledged');
assert.match(app,/cleanChatHTML\(msg\)/,'status marker not persisted in chat HTML');
assert.match(html,/\.chat-save-indicator/,'visible status text styled');
assert.match(app,/if\(e\.key===CHAT_KEY&&chatWritesInFlight>0/,'detect external chat change during write');
console.log('PASS: 15 static chat queue, acknowledgment, failure, DOM and undo checks');
console.log('P0 STILL OPEN: legacy localStorage, cached old tabs, Google Drive restore/prune.');
