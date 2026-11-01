import {writeSav,readSav} from '../sav.js';import {mergeCases,mergeVars} from '../merge.js';
let ok=0,bad=0;const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};
const mk=(name,vars,cols)=>({name,n:cols[0].length,cols,vars:vars.map(v=>({name:v,type:'Numeric',measure:'Scale',label:'',values:'',missing:'',width:8,decimals:0,columns:8,align:'Right',role:'Input'}))});
const A=mk('a',['id','x'],[[1,2,3],[10,20,30]]),B=mk('b',['id','y'],[[1,2,4],[5,6,7]]);
const w=writeSav(A);const buf=w.buffer?w.buffer.slice(w.byteOffset,w.byteOffset+w.byteLength):w;
const R=readSav(buf);R.name='a';
t('read names',R.vars.map(v=>v.name).join()==='id,x');t('read n',R.n===3);
const MV=mergeVars(R,B,{keyName:'id',outer:false}),V=MV.state;t('vars merge',V.vars.map(v=>v.name).join()==='id,x,y'&&V.n===3&&MV.matched===2);
const C=mergeCases(R,mk('c',['id','x'],[[9],[99]]),{indicator:false}).state;t('cases merge',C.n===4);
console.log(`mergesav: ${ok} passed, ${bad} failed`);process.exit(bad?1:0)
