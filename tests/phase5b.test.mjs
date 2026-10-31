// المرحلة 5 (جزء 3): Dunn، استبدال المفقودة، Binning، اختيار الحالات
import * as S from '../stats.js';
import {fillMissing,binCuts,binOf,binLabels,buildMask} from '../prep2.js';
let ok=0,bad=0;const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};const near=(a,b,e=1e-9)=>Math.abs(a-b)<e;
// Dunn مع مجموعتين = z الخاص بمان–ويتني (نفس التقدير المقارب بتصحيح الارتباطات)
const g1=[1,2,2,3,5,6,8],g2=[4,6,7,9,9,10,12,13],mw=S.mannWhitney(g1,g2),d=S.dunn([g1,g2])[0];
t('dunn z = MW z (2 groups)',near(Math.abs(d.z),Math.abs(mw.z),1e-9));t('dunn p = MW p',near(d.p,mw.p,1e-9));
const d3=S.dunn([[1,2,3],[4,5,6],[7,8,9]]);t('3 groups → 3 pairs',d3.length===3);t('Bonferroni ×3 capped',d3.every(x=>near(x.padj,Math.min(1,x.p*3))));t('order sign',d3[0].z<0&&d3[2].z<0);
// fillMissing
const a=[1,null,3,null,null,6,null];
t('mean',near(fillMissing(a,'mean').out[1],(1+3+6)/3));t('median',fillMissing(a,'median').out[1]===3);
const lin=fillMissing(a,'linear');t('linear',near(lin.out[1],2)&&near(lin.out[3],4)&&near(lin.out[4],5)&&lin.out[6]===null&&lin.filled===3);
t('prev',fillMissing(a,'prev').out.join()==='1,1,3,3,3,6,6');t('next',fillMissing(a,'next').out.join()==='1,3,3,6,6,6,');t('input untouched',a[1]===null);
// binning
const vals=Array.from({length:100},(_,i)=>i+1);
const cw=binCuts(vals,{method:'width',k:4});t('width cuts',cw.length===3&&near(cw[0],25.75));
const cp=binCuts(vals,{method:'pctl',k:4});const cnt=[0,0,0,0];vals.forEach(x=>cnt[binOf(x,cp)-1]++);t('percentile bins ≈ equal',Math.max(...cnt)-Math.min(...cnt)<=1);
const cc=binCuts(vals,{method:'cuts',cuts:'18, 30  50'});t('custom cuts',cc.join()==='18,30,50');t('upper inclusive',binOf(18,cc)===1&&binOf(18.01,cc)===2&&binOf(51,cc)===4&&binOf(null,cc)===null);
t('labels',binLabels(cc).join('|')==='≤ 18|(18, 30]|(30, 50]|> 50');
let thr=false;try{binCuts(vals,{method:'cuts',cuts:'x'})}catch{thr=true}t('bad cuts throws',thr);
// buildMask
const N=10,gc=()=>Array.from({length:N},(_,i)=>i);
t('range',buildMask({mode:'range',first:3,last:5},N,gc).n===3);t('random exact',buildMask({mode:'random',pct:30},N,gc).n===3);
t('cond',buildMask({mode:'cond',expr:'x >= 7'},N,l=>l==='x'?gc():null).n===3);
let e2=false;try{buildMask({mode:'cond',expr:'x > 99'},N,l=>l==='x'?gc():null)}catch{e2=true}t('empty selection throws',e2);

// ---- فحص البواقي ----
let seed=12345;const rnd=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296,gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-12))*Math.cos(2*Math.PI*rnd());
const x=Array.from({length:600},()=>rnd()*10),yH=x.map(v=>2+v+gauss()),yV=x.map(v=>2+v+gauss()*v*.6);
const rH=S.linreg([x],yH),rV=S.linreg([x],yV),dH=S.residDiag([x],rH.res,rH.see),dV=S.residDiag([x],rV.res,rV.see);
t('BP: constant variance not rejected',dH.bp.p>.01);t('BP: heteroscedastic rejected',dV.bp.p<.001);t('SW on normal residuals',dH.sw.p>.01);t('outlier count',dV.out3>=0&&dV.maxZ>2);
// ---- تقسيم الملف ----
import {store,mkVar} from '../data.js';import {splitGroups,setFilter} from '../analyses.js';
store.vars=[mkVar('g'),mkVar('h')];store.cols=[[1,1,2,2,2,null,3],[5,6,5,6,6,5,5]];store.n=7;
const sg=splitGroups([0]);t('3 groups',sg.length===3&&sg[0].n===2&&sg[1].n===3&&sg[2].n===1);t('labels',sg[0].label==='g = 1');
t('two vars',splitGroups([0,1]).length===5);
setFilter({mask:[true,true,false,false,false,true,true],n:4,desc:'t'},true);t('split respects filter',splitGroups([0]).length===2);setFilter(null,true);
console.log(`phase5b: ${ok} passed, ${bad} failed`);process.exit(bad?1:0);
