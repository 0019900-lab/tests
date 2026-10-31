// تكامل المرحلة 5: RUN.* على بيانات حقيقية في المخزن + «فسّر نتائجي» لكل تحليل جديد (مقارنة مع scipy)
import fs from 'node:fs';import assert from 'node:assert/strict';
import {replaceAll,mkVar} from '../data.js';import {RUN} from '../analyses.js';import {explain} from '../explain.js';
const F=JSON.parse(fs.readFileSync(new URL('./fixtures5.json',import.meta.url)));let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};
const near=(a,b,tol=1e-3)=>Math.abs(+a-b)<=tol*Math.max(1,Math.abs(b));
const load=(cols,names,types)=>{const n=Math.max(...cols.map(c=>c.length));replaceAll({name:'t',vars:names.map((m,i)=>({...mkVar(m,types?.[i]||'Numeric'),decimals:3})),cols:cols.map(c=>{const a=c.slice();while(a.length<n)a.push(null);return a}),n},true)};
// Mann-Whitney
load([[...F.mw.a,...F.mw.b],[...F.mw.a.map(()=>'A'),...F.mw.b.map(()=>'B')]],['y','g'],['Numeric','String']);
let b=RUN.mannwhitney({vars:[0],group:1,g1:'',g2:''});t('MW U',near(b.tables[1].rows[0][1],F.mw.U,2e-3));t('MW p',near(b.facts.tests[0].p,F.mw.p,1e-4));
let e=explain({facts:b.facts},'ar');t('MW explain ar',e.meaning.length>=1&&e.caution.length>=2&&/U = /.test(e.meaning[0]));t('MW explain en',/Mann|rank/i.test(JSON.stringify(explain({facts:b.facts},'en'))));
// Wilcoxon
load([F.wil.x,F.wil.y],['a','b']);b=RUN.wilcoxon({a:0,b:1});t('Wilcoxon p',near(b.facts.p,F.wil.p,1e-4));t('Wilcoxon rank table',b.tables[0].rows.length===4);e=explain({facts:b.facts},'ar');t('Wilcoxon explain',e.meaning.length===2);
// Kruskal
load([[].concat(...F.kw.g),[].concat(...F.kw.g.map((v,i)=>v.map(()=>'G'+(i+1))))],['y','g'],['Numeric','String']);b=RUN.kruskal({vars:[0],factor:1});t('KW H',near(b.facts.tests[0].H,F.kw.H,1e-6));t('KW p',near(b.facts.tests[0].p,F.kw.p,1e-5));t('KW explain notes post hoc limit',/دَن/.test(explain({facts:b.facts},'ar').caution.join(' ')));
// Regression
load([F.reg.y,F.reg.x1,F.reg.x2],['y','x1','x2']);b=RUN.regression({dep:0,vars:[1,2]});const co=b.tables[2].rows;F.reg.b.forEach((v,i)=>t('reg B'+i,near(co[i][1],v,2e-3)));t('reg R2',near(b.facts.R2,F.reg.R2,1e-6));e=explain({facts:b.facts},'ar');t('reg explain',e.meaning.length>=3&&/R²/.test(e.meaning[0]));
assert.throws(()=>{load([F.reg.y,F.reg.x1,F.reg.x1.map(v=>v*2)],['y','a','b']);RUN.regression({dep:0,vars:[1,2]})});ok++;
// Alpha
load(F.alpha.items,F.alpha.items.map((_,i)=>'i'+(i+1)));b=RUN.alpha({vars:F.alpha.items.map((_,i)=>i)});t('alpha',near(b.facts.alpha,F.alpha.alpha,1e-6));t('alpha explain',explain({facts:b.facts},'en').meaning[0].includes('Cronbach'));
// Normality
load(F.sw.map(c=>c.x),F.sw.map((_,i)=>'v'+i));b=RUN.normality({vars:F.sw.map((_,i)=>i)});F.sw.forEach((c,i)=>t('norm W'+i,near(b.facts.vars[i].W,c.W,1e-4)));e=explain({facts:b.facts},'ar');t('norm explain',e.meaning.length===F.sw.length&&e.next.length===1);
console.log(`phase5 integration: ${ok} passed`);
