import {replaceAll,mkVar,store} from '/home/claude/Smart-Analysis-main/data.js';import {RUN} from '/home/claude/Smart-Analysis-main/analyses.js';import * as C from '/home/claude/Smart-Analysis-main/charts.js';import {explain} from '/home/claude/Smart-Analysis-main/explain.js';import fs from 'node:fs';
let s=12345;const rnd=()=>(s=(s*1664525+1013904223)>>>0)/4294967296,nrm=()=>Math.sqrt(-2*Math.log(rnd()||1e-9))*Math.cos(2*Math.PI*rnd());
const n=60,id=[],grp=[],before=[],after=[],hours=[];
for(let i=0;i<n;i++){id.push(i+1);grp.push(i%2?'F':'M');const b=70+8*nrm();before.push(+b.toFixed(1));const h=Math.max(1,7+2*nrm());hours.push(+h.toFixed(1));after.push(+(b+15+1.1*(h-7)+4*nrm()).toFixed(1))}
replaceAll({name:'s',vars:[mkVar('id'),mkVar('before'),mkVar('after'),mkVar('hours'),mkVar('sex','String')],cols:[id,before,after,hours,grp],n},true);
const ink='#1b2230',o={lang:'ar',ink},col=c=>store.cols[c];
const bx=['M','F'].map(g=>({label:g==='M'?'Male':'Female',vals:col(2).filter((_,i)=>col(4)[i]===g)}));
const svgs={hist:C.histogram(C.histSpec(col(1),{name:'before'}),o),box:C.boxplot(C.boxSpec(bx,{yName:'after'}),o),sc:C.scatter(C.scatterSpec(col(3),col(2),{line:true,xName:'hours',yName:'after'}),o),qq:C.qq(C.qqSpec(col(2),{name:'after'}),o)};
const b=RUN.ttestPair({a:1,b:2});const ex=explain({facts:b.facts},'ar');
fs.writeFileSync('/tmp/deck/data.json',JSON.stringify({svgs,ex,m1:b.facts.m1,m2:b.facts.m2}));console.log(b.facts.m1.toFixed(1),b.facts.m2.toFixed(1))
