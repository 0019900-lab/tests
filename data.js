// StatLab data engine – Phase 1: columnar store, undo/redo, CSV/project IO
import {T} from './i18n.js';
export const store={name:'Untitled1',vars:[],cols:[],n:0,dirty:false};
const subs=[];export const subscribe=f=>subs.push(f);
const emit=k=>subs.forEach(f=>f(k||'data'));
const U=[],R=[];
function push(e,run){if(run)e.redo();U.push(e);if(U.length>200)U.shift();R.length=0;store.dirty=true}
export function undo(){const e=U.pop();if(!e)return false;e.undo();R.push(e);store.dirty=true;emit();return true}
export function redo(){const e=R.pop();if(!e)return false;e.redo();U.push(e);store.dirty=true;emit();return true}
const NAMEOK=/^[\p{L}@][\p{L}\p{N}_.@#$]*$/u;
export const validName=(n,skip=-1)=>NAMEOK.test(n)&&!store.vars.some((v,i)=>i!==skip&&v.name.toLowerCase()===n.toLowerCase());
export const mkVar=(name,type='Numeric')=>({name,type,width:type==='String'?16:8,decimals:type==='String'?0:2,label:'',values:'',missing:'',measure:type==='String'?'Nominal':'Scale',role:'Input'});
export function parseNum(s){
 if(typeof s==='number')return Number.isFinite(s)?s:NaN;
 let t=String(s).trim();if(t==='')return null;
 t=t.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace('٫','.').replace('٬',',');
 if(/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t))t=t.replace(/,/g,'');
 if(!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t))return NaN;
 return Number(t)}
export const cell=(r,c)=>{const v=store.cols[c]&&store.cols[c][r];return v==null?'':v};
export function show(r,c){const v=cell(r,c);if(v==='')return'';const m=store.vars[c];return typeof v==='number'&&m?v.toFixed(Math.min(m.decimals,20)):String(v)}
function apply(tx,dir){const s=store;
 if(dir>0){tx.addVars.forEach(v=>{s.vars.push(v);s.cols.push([])});s.n=tx.n1;for(const[c,r,,n]of tx.cells)s.cols[c][r]=n}
 else{for(const[c,r,o]of tx.cells)if(c<tx.v0)s.cols[c][r]=o;s.vars.length=tx.v0;s.cols.length=tx.v0;s.n=tx.n0}}
// ch: [{r,c,v}] – قيم نصية؛ بيتكوّن متغيرات تلقائياً لو الأعمدة جديدة
export function commit(ch){
 if(!ch.length)return{rejected:0};
 const s=store,v0=s.vars.length;let maxC=-1;for(const x of ch)if(x.c>maxC)maxC=x.c;
 const addVars=[];
 for(let c=v0;c<=maxC;c++){
  const first=ch.find(x=>x.c===c&&String(x.v).trim()!=='');
  const type=first&&Number.isNaN(parseNum(first.v))?'String':'Numeric';
  let k=c+1,nm;do{nm='VAR'+String(k++).padStart(5,'0')}while(s.vars.some(v=>v.name===nm)||addVars.some(v=>v.name===nm));
  addVars.push(mkVar(nm,type))}
 const cells=[];let rejected=0,n1=s.n;
 for(const x of ch){const vv=x.c<v0?s.vars[x.c]:addVars[x.c-v0];let val;
  if(String(x.v).trim()==='')val=null;
  else if(vv.type==='Numeric'){val=parseNum(x.v);if(Number.isNaN(val)){rejected++;continue}}
  else val=String(x.v);
  const o=x.c<v0?(s.cols[x.c][x.r]??null):null;
  if(o===val)continue;
  cells.push([x.c,x.r,o,val]);if(val!==null&&x.r+1>n1)n1=x.r+1}
 if(!cells.length&&!addVars.length)return{rejected};
 const tx={addVars,v0,n0:s.n,n1,cells};
 push({undo:()=>apply(tx,-1),redo:()=>apply(tx,1)},true);emit();return{rejected}}
export function setVar(i,f,val){const s=store;val=String(val).trim();
 if(i>=s.vars.length){if(f!=='name')return T('اكتب اسم المتغير أولاً','Enter the first variable name first');if(!validName(val))return T('اسم متغير غير صالح أو مكرر','Invalid or duplicate variable name');
  const nv=mkVar(val),v0=s.vars.length;push({undo(){s.vars.length=v0;s.cols.length=v0},redo(){s.vars.push(nv);s.cols.push([])}},true);emit();return null}
 const v=s.vars[i];let nv=val;
 if(f==='name'&&!validName(val,i))return T('اسم متغير غير صالح أو مكرر','Invalid or duplicate variable name');
 if(f==='width'||f==='decimals'){nv=parseInt(val);if(!(nv>=0&&nv<=40))return T('قيمة رقمية بين 0 و 40','A number between 0 and 40')}
 const before={...v},after={...v,[f]:nv},oc=s.cols[i];let nc=oc;
 if(f==='type'){if(nv===v.type)return null;
  nc=new Array(s.n);for(let r=0;r<s.n;r++){const x=oc[r];nc[r]=x==null?null:nv==='String'?String(x):(typeof x==='number'?x:(p=>Number.isNaN(p)?null:p)(parseNum(x)))}
  Object.assign(after,nv==='String'?{width:16,decimals:0,measure:'Nominal'}:{width:8,decimals:2,measure:'Scale'})}
 push({undo(){s.vars[i]=before;s.cols[i]=oc},redo(){s.vars[i]=after;s.cols[i]=nc}},true);
 emit(f==='type'?'data':'var');return null}
export function markSaved(){store.dirty=false;emit('var')}
export function replaceAll(st,clear){const s=store,prev={name:s.name,vars:s.vars,cols:s.cols,n:s.n};
 const set=x=>{s.name=x.name;s.vars=x.vars;s.cols=x.cols;s.n=x.n};
 if(clear){U.length=0;R.length=0;set(st);s.dirty=false}else push({undo:()=>set(prev),redo:()=>set(st)},true);
 emit()}
export function parseDelimited(t){
 if(t.charCodeAt(0)===0xFEFF)t=t.slice(1);
 const nl=t.search(/\r|\n/),first=nl<0?t:t.slice(0,nl);
 const d=[',',';','\t'].map(x=>[x,first.split(x).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const rows=[],L=t.length;let row=[],f='',q=false,i=0;
 while(i<L){const ch=t[i];
  if(q){if(ch==='"'){if(t[i+1]==='"'){f+='"';i+=2;continue}q=false;i++;continue}f+=ch;i++;continue}
  if(ch==='"'&&f===''){q=true;i++;continue}
  if(ch===d){row.push(f);f='';i++;continue}
  if(ch==='\n'||ch==='\r'){row.push(f);f='';rows.push(row);row=[];if(ch==='\r'&&t[i+1]==='\n')i++;i++;continue}
  f+=ch;i++}
 if(f!==''||row.length){row.push(f);rows.push(row)}
 return rows}
export function rowsToState(rows,name='Imported'){
 rows=rows.filter(r=>r.some(x=>x!=null&&String(x).trim()!==''));
 if(!rows.length)throw new Error(T('الملف فارغ','The file is empty'));
 let C=0;for(const r of rows)if(r.length>C)C=r.length;
 const H=rows[0],n=rows.length-1,used=new Set(),vars=[],cols=[];
 for(let c=0;c<C;c++){
  let nm=String(H[c]??'').trim().replace(/[^\p{L}\p{N}_.@#$]/gu,'_');if(!/^[\p{L}@]/u.test(nm))nm='V'+(nm||c+1);
  const b=nm;let k=2;while(used.has(nm.toLowerCase()))nm=b+'_'+k++;used.add(nm.toLowerCase());
  const raw=new Array(n),nums=new Array(n);let num=true,dec=0,seen=0;
  for(let r=0;r<n;r++){const x=rows[r+1][c];
   if(x==null||(typeof x==='string'&&x.trim()==='')){raw[r]=null;nums[r]=null;continue}
   raw[r]=x;
   if(num){let xs=x,p=parseNum(x);if(Number.isNaN(p)&&typeof x==='string'&&/^[-+]?\d+,\d+$/.test(x.trim())){xs=x.trim().replace(',','.');p=parseNum(xs)}if(Number.isNaN(p))num=false;else{nums[r]=p;if(seen<2000){seen++;const m=String(xs).match(/\.(\d+)/);if(m&&m[1].length>dec)dec=Math.min(6,m[1].length)}}}}
  if(num){cols.push(nums);vars.push({...mkVar(nm,'Numeric'),decimals:dec})}
  else{let L=1;cols.push(raw.map(x=>{if(x==null)return null;const s=String(x);if(s.length>L)L=s.length;return s}));vars.push({...mkVar(nm,'String'),width:Math.min(Math.max(L,8),255)})}}
 return{name,vars,cols,n}}
export function toCSV(){const s=store,q=x=>{x=x==null?'':String(x);return/[",\n\r;]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x};
 const out=[s.vars.map(v=>q(v.name)).join(',')];
 for(let r=0;r<s.n;r++){const a=new Array(s.vars.length);for(let c=0;c<a.length;c++)a[c]=q(s.cols[c][r]);out.push(a.join(','))}
 return'\uFEFF'+out.join('\r\n')}
export const toProject=()=>JSON.stringify({app:'statlab',v:1,name:store.name,vars:store.vars,cols:store.cols,n:store.n});
export function fromProject(t){const o=JSON.parse(t);if(o.app!=='statlab'||!Array.isArray(o.vars)||!Array.isArray(o.cols))throw new Error(T('ملف مشروع غير صالح','Invalid project file'));return{name:o.name||'Untitled1',vars:o.vars,cols:o.cols,n:o.n|0}}
export function demoState(N=100000){
 const g=()=>{let u=0;while(!u)u=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Math.random())};
 const id=[],age=[],sex=[],grp=[],inc=[],sc=[];
 for(let i=0;i<N;i++){id.push(i+1);age.push(Math.max(18,Math.min(90,Math.round(40+12*g()))));sex.push(Math.random()<.5?'M':'F');
  const G='ABC'[Math.floor(Math.random()*3)];grp.push(G);inc.push(Math.round(Math.exp(8+.5*g())*100)/100);sc.push(Math.round((50+10*g()+(G==='B'?3:0))*10)/10)}
 const mk=(n,t,d,m)=>({...mkVar(n,t),decimals:d,measure:m});
 return{name:'demo_100k',vars:[mk('id','Numeric',0,'Scale'),mk('age','Numeric',0,'Scale'),mk('sex','String',0,'Nominal'),mk('grp','String',0,'Nominal'),mk('income','Numeric',2,'Scale'),mk('score','Numeric',1,'Scale')],cols:[id,age,sex,grp,inc,sc],n:N}}
