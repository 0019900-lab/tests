// اختبارات الرسوم (charts.js): المواصفات الرقمية + سلامة SVG + حالات الحدود
import assert from 'node:assert/strict';
import {nice,qnorm,histSpec,barSpec,boxSpec,scatterSpec,qqSpec,chartSVG,RENDER} from '../charts.js';
let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
const xml=s=>{t('svg root',/^<svg[^>]+viewBox/.test(s)&&s.endsWith('</svg>'));t('no NaN/undefined',!/NaN|undefined|Infinity/.test(s));
 const o=(s.match(/<([a-z]+)[ >]/g)||[]).length;t('has shapes',o>8)};
// nice / qnorm
const nz=nice(0,97,5);t('nice covers range',nz.lo<=0&&nz.hi>=97&&nz.ticks.length>=3);t('nice degenerate',nice(5,5).hi>nice(5,5).lo);
t('qnorm .5',near(qnorm(.5),0));t('qnorm .975',near(qnorm(.975),1.959964,1e-4));t('qnorm sym',near(qnorm(.1),-qnorm(.9),1e-9));t('qnorm edges',qnorm(0)===-Infinity&&qnorm(1)===Infinity);
// histogram
const x=Array.from({length:200},(_,i)=>Math.sin(i)*10+50);x.push(NaN,null,undefined);
const h=histSpec(x,{name:'x'});t('hist n ignores missing',h.n===200);t('hist bins sum',h.bins.reduce((s,b)=>s+b.n,0)===200);t('hist bins contiguous',h.bins.every((b,i)=>i===0||near(b.a,h.bins[i-1].b)));
t('hist custom bins',histSpec(x,{bins:8}).bins.length>=6);assert.throws(()=>histSpec([1]));ok++;xml(chartSVG('histogram',h,{lang:'ar'}));xml(chartSVG('histogram',h,{lang:'en'}));
t('hist constant data ok',histSpec([3,3,3,3]).bins.reduce((s,b)=>s+b.n,0)===4);
// bar
const bc=barSpec([{label:'A',count:30},{label:'B',count:70}],{pct:true});t('bar pct',near(bc.cats[1].v,70)&&near(bc.cats[0].v,30));xml(chartSVG('bar',bc,{lang:'en'}));
const bm=barSpec([{label:'A',vals:[1,2,3,4,5]},{label:'B',vals:[2,4,6,8,10]},{label:'C',vals:[NaN]}],{mode:'mean',errors:true});
t('bar mean',near(bm.cats[0].v,3)&&near(bm.cats[1].v,6));t('bar CI',bm.cats[0].lo<3&&bm.cats[0].hi>3&&near(bm.cats[0].hi-3,3-bm.cats[0].lo));t('bar empty group',bm.cats[2].n===0&&Number.isNaN(bm.cats[2].v));xml(chartSVG('bar',bm,{lang:'ar'}));
t('bar all-zero counts',(()=>{xml(chartSVG('bar',barSpec([{label:'a',count:0},{label:'b',count:0}]),{lang:'en'}));return true})());
// boxplot
const bx=boxSpec([{label:'g1',vals:[1,2,3,4,5,6,7,8,9,100]},{label:'g2',vals:[5,5,5,5]},{label:'g3',vals:[]}]);
const g1=bx.groups[0];t('box median',near(g1.med,5.5));t('box outlier',g1.nOut===1&&g1.out[0]===100&&g1.wh===9);t('box quartiles order',g1.q1<g1.med&&g1.med<g1.q3);t('box constant',bx.groups[1].q1===5&&bx.groups[1].q3===5&&bx.groups[1].nOut===0);t('box empty',bx.groups[2].n===0);
xml(chartSVG('boxplot',bx,{lang:'ar'}));
const big=boxSpec([{label:'z',vals:[...Array.from({length:1000},()=>0),...Array.from({length:200},(_,i)=>1000+i)]}]);t('box outliers capped 120',big.groups[0].out.length<=120&&big.groups[0].nOut===200);
// scatter
const sx=Array.from({length:50},(_,i)=>i),sy=sx.map(v=>2*v+1);const sc=scatterSpec(sx,sy);t('scatter perfect r',near(sc.r,1,1e-9));t('scatter fit',near(sc.b,2,1e-9)&&near(sc.a,1,1e-9));xml(chartSVG('scatter',sc,{lang:'en'}));
t('scatter pairwise deletion',scatterSpec([1,2,3,4,NaN],[2,4,5,9,1]).n===4);assert.throws(()=>scatterSpec([1,2],[1,2]));ok++;
const bigS=scatterSpec(Array.from({length:5000},(_,i)=>i),Array.from({length:5000},(_,i)=>i%7));t('scatter sampled',bigS.sampled&&bigS.pts.length<=2500&&bigS.n===5000);
// QQ
let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const nrm=Array.from({length:300},()=>{const u=rnd(),v=rnd();return 10+2*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)});
const q=qqSpec(nrm);t('qq normal ppcc high',q.ppcc>.99);t('qq slope≈sd',Math.abs(q.slope-2)<.4);t('qq skewed lower ppcc',qqSpec(nrm.map(v=>Math.exp(v/2))).ppcc<q.ppcc);assert.throws(()=>qqSpec([1,2]));ok++;xml(chartSVG('qq',q,{lang:'ar'}));
// XSS: labels are escaped
const evil=chartSVG('bar',barSpec([{label:'<script>alert(1)</script>',count:3}],{xName:'"><img onerror=x>'}),{lang:'en'});t('labels escaped',!/<script>|<img/.test(evil));
t('RENDER keys',Object.keys(RENDER).sort().join()==='bar,boxplot,histogram,qq,scatter');
t('ink option',/fill="#123456"/.test(chartSVG('qq',q,{lang:'en',ink:'#123456'})));
console.log(`charts: ${ok} passed`);
