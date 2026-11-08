import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browserOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' };
const outputDir = await mkdtemp(join(tmpdir(), 'escalas-ui-'));
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../', import.meta.url));
const browser=await chromium.launch({headless:true,...browserOptions});
const page=await browser.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.hostname==='preview.test') {
   const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
   if(!['index.html','app.js','ui/agenda.js','ui/print.js','style.css','agenda.css','print.css'].includes(file)) return route.fulfill({status:404,body:''});
   return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:await readFile(`${root}/${file}`,'utf8')});
 }
 if(url.pathname.endsWith('firebase-app.js')) return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:'export const initializeApp = () => ({});'});
 if(url.pathname.endsWith('firebase-auth.js')) return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:`
 export const getAuth=()=>({});
 export const onAuthStateChanged=(auth,fn)=>fn({email:'joaovitorsilvaluciano@gmail.com',emailVerified:true});
 export class GoogleAuthProvider { setCustomParameters() {} }
 export const signInWithPopup=async()=>({}); export const signOut=async()=>{};
 `});
 if(url.pathname.endsWith('firebase-firestore.js')) return route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:`
 export const getFirestore=()=>({}); export const doc=()=>({});
 export const onSnapshot=(ref,fn)=>{fn({exists:()=>true,metadata:{fromCache:false},data:()=>({membros:[],cultos:[{id:'cloud-service',nome:'Culto de teste',data:'2026-12-20',hora:'19:00',especial:true,slots:[],programa:[]}],tiposCulto:[{id:'test',nome:'Teste',diaSemana:0,hora:'19:00'}]})})};
 export const setDoc=async(ref,data)=>{if(window.failWrite) throw new Error('Simulated offline'); (window.cloudWrites ||= []).push(data);};
 `});
 return route.fulfill({status:404,body:''});
});
await page.goto('http://preview.test');
await page.locator('[data-action="abrir-culto"][data-culto="cloud-service"]').click();
await page.getByRole('button',{name:'Outros departamentos',exact:true}).click();
await page.getByRole('button',{name:'Editar',exact:true}).click();
await page.locator('.detail-content [data-field="ministerio"]').fill('Departamento teste');
await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Alterações salvas na nuvem');
assert.equal(await page.evaluate(()=>window.cloudWrites.at(-1).cultos.find(c=>c.id==='cloud-service').organizacao.ministerio),'Departamento teste');
await page.evaluate(()=>{window.failWrite=true});
await page.locator('.detail-content [data-field="local"]').fill('Salão de teste');
await page.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Sem sincronização'));
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('viverLouvarEscalas.v1')).cultos.find(c=>c.id==='cloud-service').organizacao.local),'Salão de teste');
assert.deepEqual(errors,[]);
console.log('PASS: hosted module startup, shared state write, sync success and failure, local preservation. Firebase mocked; no live data accessed.');
console.log('Screenshots:', outputDir);
await browser.close();
