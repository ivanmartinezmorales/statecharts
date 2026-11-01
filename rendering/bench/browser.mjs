// Before/after frame latency, including GPU completion and worker messages. Start the Plane dev server first.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(new URL('../../plane/package.json', import.meta.url))('playwright');
import { readFile, writeFile } from 'node:fs/promises';
const [baseline, baseURL = 'http://127.0.0.1:5330'] = process.argv.slice(2);
if (!baseline) throw new Error('Usage: node rendering/bench/browser.mjs before.wasm [Plane dev-server URL]');
const root = fileURLToPath(new URL('../../', import.meta.url));
const temp = await mkdtemp(root + 'plane/tests/bench-');
const path = '/tests/' + temp.split('/').at(-1);
for (const name of ['engine', 'compositor']) {
  let source = execFileSync('git', ['show', `1015147c8598937ec5cb0e41af8b8d642a5fbbf1:plane/src/${name}.ts`], { cwd: root, encoding: 'utf8' });
  if (name === 'compositor') source = source.replace('device.queue.submit([enc.finish()])', 'device.queue.submit([enc.finish()]); return device.queue.onSubmittedWorkDone()');
  await writeFile(`${temp}/${name}.ts`, source);
}
await copyFile(baseline, temp + '/baseline.wasm');
const { cases } = JSON.parse(await readFile(new URL('../../plane/tests/frames.json', import.meta.url)));
const fixtures = [640, 1280].flatMap(w => cases.filter(f => ['airplane.overview', 'deck.pfd', 'cabin.air'].includes(f.name)).map(f => ({ ...f, w, h: w * 9 / 16 })));
const browser=await chromium.launch({channel:process.env.BROWSER || 'chrome',headless:true,args:['--enable-unsafe-webgpu']});
const results=[];
try {
for(const f of fixtures){
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>console.error(e));
 await page.goto(baseURL + '/tests/fixture.html?sdr');
 const r=await page.evaluate(async ({f,path})=>{
  const {loadEngine}=await import(path + '/engine.ts');
  const {createCompositor}=await import(path + '/compositor.ts');
  const {createRenderer}=await import('/tests/modules.ts');
  const a=await loadEngine(path + '/baseline.wasm');a.resize(f.w,f.h);
  const canvases=Array.from({length:4},()=>{const c=document.createElement('canvas');c.style.width='1280px';c.style.height='720px';document.body.append(c);return c});
  const comp=await createCompositor(canvases[0],canvases.slice(1),a);
  const host=document.createElement('div');document.body.append(host);
  const controller=new AbortController();const size={w:f.w,h:f.h,width:1280,height:720,dpr:1,hdr:false};
  const b=await createRenderer(host,size,controller.signal);
  const draw=[async t=>{a.draw(f.frame,t);await comp.present()},t=>b.draw(f.frame,t,size)];
  for(let i=0;i<30;i++)for(const run of draw)await run(2+i/30);
  const samples=[[],[]],timerDelay=[[],[]];
  for(let round=0;round<5;round++)for(const [k,run] of draw.entries()){
   const start=performance.now();for(let i=0;i<15;i++)await run(2+i/30);samples[k].push((performance.now()-start)/15);
   let probe;const probeStart=performance.now();const timeout=new Promise(r=>setTimeout(()=>{probe=performance.now()-probeStart;r()},0));
   await run(2.3);await timeout;timerDelay[k].push(probe);
  }
  if(comp.kind!=='webgpu'||b.kind!=='webgpu'||!b.worker)throw Error('GPU fallback during benchmark');
  const info=(await navigator.gpu.requestAdapter()).info;
  controller.abort();return{name:f.name,w:f.w,h:f.h,before:samples[0],after:samples[1],timerDelay,adapter:{vendor:info.vendor,architecture:info.architecture,description:info.description}};
 },{f,path});
 results.push(r);console.log(JSON.stringify(r));await page.close();
}
console.log(JSON.stringify({browser:browser.version(),results}));
} finally { await browser.close(); await rm(temp, {recursive:true,force:true}); }
