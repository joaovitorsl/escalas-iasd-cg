import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Run the real persistence functions with a deterministic in-memory transport.
const source = fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const functions = source.slice(source.indexOf('const FIRESTORE_DEBOUNCE_MS'),source.indexOf('function markDirty()'));
const listener = source.slice(source.indexOf('function connectCloud()'),source.lastIndexOf('\nboot();'));
function setup(local=false) {
 const storage=new Map(); const writes=[];
 const ctx=vm.createContext({LOCAL_PREVIEW:local,canEdit:true,publishPublicAgenda(){},STORAGE_KEY:'data',PENDING_STORAGE_KEY:'pending',localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:()=>1,clearTimeout:()=>{},console:{warn(){},error(){}},setDoc:async(_,data)=>{writes.push(data)},docRef:{},updateSaveStatus(){},normalizarEstado:x=>x,ensureUpcomingCultos(){},render(){},loadLocal:()=>JSON.parse(storage.get('data')||'{}')});
 vm.runInContext(`let state={membros:[],cultos:[],tiposCulto:[]};let syncStatus='loading',cloudReady=false,syncErrorCode='',localStorageFailed=false,writeInFlight=false,recoveryNeeded=false,remoteRecoveryState=null,unsubscribeCloud=null,dirty=false;const writeClientId='this-client';let receive,fail;const onSnapshot=(ref,options,ok,error)=>{receive=ok;fail=error};${functions}${listener}`,ctx);
 return {ctx,storage,writes,run:s=>vm.runInContext(s,ctx)};
}
const local=setup(true);local.run('persistLocal()');assert.ok(local.storage.has('data'));assert.equal(local.writes.length,0);assert.ok(!local.storage.has('pending'));
const denied=setup();denied.run('connectCloud();fail({code:"permission-denied"});state={membros:[{nome:"Draft"}],cultos:[],tiposCulto:[]};persistLocal()');await denied.run('enviarParaNuvem()');assert.equal(denied.writes.length,0);assert.ok(denied.storage.get('pending').includes('Draft'));
const healthy=setup();healthy.run('connectCloud();receive({exists:()=>true,data:()=>({membros:[{nome:"Cloud"}],cultos:[],tiposCulto:[]}),metadata:{fromCache:false}})');assert.ok(healthy.storage.get('data').includes('Cloud'));
healthy.run('state.membros.push({nome:"Edit"});persistLocal()');await healthy.run('enviarParaNuvem()');assert.equal(healthy.writes.length,1);assert.ok(!healthy.storage.has('pending'));assert.equal(healthy.run('syncStatus'),'saved');
healthy.ctx.setDoc=async()=>{throw {code:'permission-denied'}};healthy.run('state.membros.push({nome:"Not sent"});persistLocal()');await healthy.run('enviarParaNuvem()');assert.ok(healthy.storage.get('pending').includes('Not sent'));assert.equal(healthy.run('syncStatus'),'error');
const recovery=setup();recovery.storage.set('pending',healthy.storage.get('pending'));recovery.run('recoveryNeeded=true;connectCloud();receive({exists:()=>true,data:()=>({membros:[{nome:"Other device"}],cultos:[],tiposCulto:[]}),metadata:{fromCache:false}});persistLocal()');assert.ok(recovery.run('state.membros.some(m=>m.nome==="Not sent")'));assert.equal(recovery.run('syncStatus'),'recovery');assert.equal(recovery.writes.length,0);
const echo=setup();echo.run('connectCloud();ultimoSeqEnviado=1;receive({exists:()=>true,data:()=>({_seq:1,_clientId:"other-client",membros:[{nome:"Remote"}]}),metadata:{fromCache:false}})');assert.ok(echo.storage.get('data').includes('Remote'));
const visitor=setup();visitor.ctx.canEdit=false;visitor.run('cloudReady=true;persistLocal()');await visitor.run('enviarParaNuvem()');assert.equal(visitor.writes.length,0);assert.equal(visitor.storage.size,0);
console.log('PASS: local storage, denied initial read, remote cache, write acknowledgement, failed draft recovery, no automatic overwrite, cross-client sequence collision.');
