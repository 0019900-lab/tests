// الاستعمال: node tools/bump.mjs [x.y.z]   — يحدّث version.js (إن مُرِّر رقم) ثم يزامن package.json وsw.js
import {readFileSync as r,writeFileSync as w} from 'node:fs';
let v=r('version.js','utf8');const arg=process.argv[2];
if(arg){if(!/^\d+\.\d+\.\d+$/.test(arg))throw new Error('صيغة الإصدار x.y.z');v=v.replace(/VERSION='[^']+'/,`VERSION='${arg}'`).replace(/BUILD='[^']+'/,`BUILD='${new Date().toISOString().slice(0,10)}'`);w('version.js',v)}
const ver=/VERSION='([^']+)'/.exec(v)[1];
const p=JSON.parse(r('package.json','utf8'));p.version=ver;w('package.json',JSON.stringify(p));
w('sw.js',r('sw.js','utf8').replace(/smart-analysis-v[\d.]+/,'smart-analysis-v'+ver));
console.log('الإصدار الآن',ver);
