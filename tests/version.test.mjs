import {readFileSync as r} from 'node:fs';import assert from 'node:assert/strict';
const v=/VERSION='([^']+)'/.exec(r('version.js','utf8'))[1];
assert.equal(JSON.parse(r('package.json','utf8')).version,v,'package.json لا يطابق version.js');
assert.ok(r('sw.js','utf8').includes(`smart-analysis-v${v}`),'sw.js لا يطابق version.js — شغّل node tools/bump.mjs');
const sw=r('sw.js','utf8');const list=eval(/F=(\[[^\]]*\])/.exec(sw)[1]);
import {existsSync} from 'node:fs';
for(const f of list)if(f!=='./')assert.ok(existsSync(f),'ملف في قائمة sw.js غير موجود: '+f);
assert.ok(!/VERSION\s*=\s*'0\./.test(r('welcome.js','utf8')),'الإصدار مكتوب يدوياً في welcome.js');
console.log('version ok',v);
