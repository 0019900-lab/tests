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
console.log(`phase5b: ${ok} passed, ${bad} failed`);process.exit(bad?1:0);
