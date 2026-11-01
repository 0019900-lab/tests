// التحليل العاملي: مقارنة مع numpy/scipy (eigh, KMO, Bartlett, Varimax)
import fs from 'node:fs';import assert from 'node:assert/strict';import {factor,jacobiEig,varimax} from '../stats.js';
const F=JSON.parse(fs.readFileSync(new URL('./fixtures_factor.json',import.meta.url)));let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));
const r=factor(F.X);
F.eig.forEach((v,i)=>t('eig'+i,near(r.initial.eig[i],v,1e-8)));t('k Kaiser',r.k===F.k);t('KMO',near(r.kmo,F.kmo,1e-8));t('Bartlett chi',near(r.bartlett.chi,F.chi,1e-8));t('Bartlett df',r.bartlett.df===F.df);t('Bartlett p',near(r.bartlett.p,F.p,1e-4)||(r.bartlett.p<1e-10&&F.p<1e-10));
F.comm.forEach((v,i)=>t('comm'+i,near(r.comm[i],v,1e-8)));
t('rot SS match',r.rot.ss.every((v,i)=>near(v,F.ssRot[i],1e-4)));t('rot preserves communalities',r.rot.L.every((row,i)=>near(row.reduce((s,x)=>s+x*x,0),r.comm[i],1e-8)));
{const dom=row=>Math.abs(row[0])>Math.abs(row[1])?0:1,A=r.rot.L.slice(0,3).map(dom),B=r.rot.L.slice(3,6).map(dom);t('rot simple structure',A.every(x=>x===A[0])&&B.every(x=>x===B[0])&&A[0]!==B[0])}
t('MSA range',r.msa.every(m=>m>0&&m<1));t('trace=p',near(r.initial.eig.reduce((s,x)=>s+x,0),r.p,1e-9));
t('nf forced',factor(F.X,{nf:3}).k===3&&factor(F.X,{nf:1}).rot===null);t('no rotate',factor(F.X,{rotate:false}).rot===null);
const e=jacobiEig([[2,1],[1,2]]);t('jacobi 2x2',near(e.values[0],3)&&near(e.values[1],1));
assert.throws(()=>factor(F.X.slice(0,2)));ok++;assert.throws(()=>factor(F.X.map(c=>c.slice(0,5))));ok++;
assert.throws(()=>factor([F.X[0],F.X[1],F.X[0].map(v=>v*2)]));ok++;
console.log(`factor: ${ok} passed`);
// --- التكامل: RUN.factor + «فسّر نتائجي»
import {replaceAll,mkVar} from '../data.js';import {RUN} from '../analyses.js';import {explain,explainText} from '../explain.js';
{let ok2=0;const t2=(n,c)=>{assert.ok(c,n);ok2++};
replaceAll({name:'t',vars:F.X.map((_,i)=>mkVar('q'+(i+1),'Numeric')),cols:F.X,n:F.X[0].length},true);
const b=RUN.factor({vars:F.X.map((_,i)=>i),nf:0,cut:.3,rotate:true});t2('tables',b.tables.length===5&&b.tables[0].cap.startsWith('KMO'));t2('facts',b.facts.nf===F.k&&Math.abs(b.facts.kmo-F.kmo)<1e-8);
t2('total variance rows',b.tables[2].rows.length===7);t2('apa',/KMO = /.test(b.apa));
for(const l of ['ar','en']){const e=explain({facts:b.facts},l);t2('explain '+l,e.meaning.length>=3&&!/NaN|undefined/.test(JSON.stringify(e)))}
t2('en no Arabic',!/[\u0600-\u06FF]/.test(explainText({facts:b.facts},'en')));
const b2=RUN.factor({vars:F.X.map((_,i)=>i),nf:1,rotate:false});t2('single factor, no rotation table',b2.tables.length===4&&b2.facts.rotated===false);
assert.throws(()=>RUN.factor({vars:[0,1]}));ok2++;
console.log(`factor integration: ${ok2} passed`)}
