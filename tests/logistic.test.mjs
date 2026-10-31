// الانحدار اللوجستي: مطابقة مع scipy (MLE) + التكامل مع المخزن + فسّر نتائجي + حالات الخطأ
import fs from 'node:fs';import assert from 'node:assert/strict';
import {replaceAll,mkVar} from '../data.js';import {RUN} from '../analyses.js';import {explain} from '../explain.js';
const F=JSON.parse(fs.readFileSync(new URL('./fixtures5.json',import.meta.url))).logit;let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};
const near=(a,b,tol=1e-5)=>Math.abs(+a-b)<=tol*Math.max(1,Math.abs(b));
const load=(cols,names,types)=>replaceAll({name:'t',vars:names.map((m,i)=>({...mkVar(m,types?.[i]||'Numeric'),decimals:3})),cols,n:cols[0].length},true);
load([F.y,F.x1,F.x2],['y','x1','x2']);
const b=RUN.logistic({dep:0,vars:[1,2],cut:.5}),eq=b.tables.at(-1).rows;
F.b.forEach((v,i)=>t('B'+i,near(eq[i][1],v,2e-3)));F.se.forEach((v,i)=>t('SE'+i,near(eq[i][2],v,2e-3)));
t('chi2',near(b.facts.chi,F.chi,1e-6));t('nagelkerke',near(b.facts.nag,F.nag,1e-6));t('accuracy',near(b.facts.acc,F.acc,1e-9));
t('6 tables',b.tables.length>=5);t('APA',/χ²\(2, N = 300\)/.test(b.apa));
const ar=explain({facts:b.facts},'ar'),en=explain({facts:b.facts},'en');
t('explain ar',ar.meaning.length>=3&&/Nagelkerke/.test(ar.meaning[0])&&/Exp\(B\)/.test(ar.meaning[1]));t('explain en',/odds/.test(en.meaning[1])&&en.caution.length>=1&&en.next.length===1);
// ثلاث قيم → خطأ، فصل تام → خطأ، ارتباط تام → خطأ
load([F.y.map((v,i)=>i%3),F.x1],['y','x'],['Numeric','Numeric']);assert.throws(()=>RUN.logistic({dep:0,vars:[1],cut:.5}),/قيمتين|two values/);ok++;
load([F.x1.map(v=>v>50?1:0),F.x1],['y','x']);assert.throws(()=>RUN.logistic({dep:0,vars:[1],cut:.5}),/فصل|separation/);ok++;
load([F.y,F.x1,F.x1.map(v=>v*2)],['y','a','b']);assert.throws(()=>RUN.logistic({dep:0,vars:[1,2],cut:.5}),/ارتباط|collinear/);ok++;
// تابع نصي (A/B)
load([F.y.map(v=>v?'yes':'no'),F.x1],['y','x'],['String','Numeric']);const s=RUN.logistic({dep:0,vars:[1],cut:.5});t('string dep: event=yes',s.facts.event==='yes');
console.log(`logistic: ${ok} checks passed`);
