// Smart-Analysis – تجهيز البيانات (المرحلة 5، الجزء 2): حساب متغير، إعادة ترميز، عكس ترميز البنود، ترتيب الحالات.
// المحرك (compileExpr / parseRecode / recodeValue / sortOrder) دوال نقية بلا DOM وبلا eval؛ والواجهة في آخر الملف.
// كل عملية تبني حالة جديدة وتمررها إلى replaceAll(...,false) فيعمل التراجع/الإعادة تلقائياً.
import {T} from './i18n.js';
import {store,mkVar,replaceAll,validName} from './data.js';
import {col} from './analyses.js';
import {dialog} from './dialog.js';

// ================= 1) محلل التعبيرات الآمن =================
const FUN={
 abs:{n:1,f:a=>Math.abs(a)},sqrt:{n:1,f:a=>a<0?null:Math.sqrt(a)},ln:{n:1,f:a=>a>0?Math.log(a):null},log10:{n:1,f:a=>a>0?Math.log10(a):null},lg10:{n:1,f:a=>a>0?Math.log10(a):null},
 exp:{n:1,f:a=>Math.exp(a)},round:{n:[1,2],f:(a,d=0)=>{const m=10**d;return Math.round(a*m+Math.sign(a)*1e-12)/m}},trunc:{n:1,f:a=>Math.trunc(a)},floor:{n:1,f:a=>Math.floor(a)},ceil:{n:1,f:a=>Math.ceil(a)},
 mod:{n:2,f:(a,b)=>b===0?null:a-b*Math.floor(a/b)},sin:{n:1,f:Math.sin},cos:{n:1,f:Math.cos},tan:{n:1,f:Math.tan},
 min:{n:'+',agg:a=>Math.min(...a)},max:{n:'+',agg:a=>Math.max(...a)},sum:{n:'+',agg:a=>a.reduce((s,v)=>s+v,0)},mean:{n:'+',agg:a=>a.reduce((s,v)=>s+v,0)/a.length},
 sd:{n:'+',agg:a=>{if(a.length<2)return null;const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))}},
 median:{n:'+',agg:a=>{const s=[...a].sort((x,y)=>x-y),h=s.length>>1;return s.length%2?s[h]:(s[h-1]+s[h])/2}},
 upper:{n:1,s:1,f:a=>String(a).toUpperCase()},lower:{n:1,s:1,f:a=>String(a).toLowerCase()},len:{n:1,s:1,f:a=>String(a).length},concat:{n:'+',s:1,raw:1,f:(...a)=>a.map(x=>x??'').join('')}
};
// دوال العمود كاملاً (تُحسب مرة واحدة على كل الحالات): CMEAN(x) CSD(x) CSUM(x) CMIN(x) CMAX(x) CMEDIAN(x) Z(x)
const COLFN={cmean:a=>a.reduce((s,v)=>s+v,0)/a.length,csum:a=>a.reduce((s,v)=>s+v,0),cmin:a=>Math.min(...a),cmax:a=>Math.max(...a),csd:a=>FUN.sd.agg(a),cmedian:a=>FUN.median.agg(a),z:null};
export const FUNCTIONS=['ABS','SQRT','LN','LOG10','EXP','ROUND','TRUNC','MOD','MIN','MAX','SUM','MEAN','SD','MEDIAN','CMEAN','CSD','CSUM','CMIN','CMAX','CMEDIAN','Z','IF','MISSING','UPPER','LOWER','CONCAT','LEN'];
const bad=(ar,en)=>{throw new Error(T(ar,en))};
function tokenize(src){const out=[],re=/\s+|(\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)|('(?:[^']|'')*'|"(?:[^"]|"")*")|([\p{L}@][\p{L}\p{N}_.@#$]*)|(\*\*|<>|<=|>=|==|!=|[-+*/^%()<>=,&|~])/uy;let i=0;
 while(i<src.length){re.lastIndex=i;const m=re.exec(src);if(!m)bad(`رمز غير مفهوم عند الموضع ${i+1}: «${src[i]}»`,`Unexpected character at position ${i+1}: “${src[i]}”`);i=re.lastIndex;
  if(m[1]!==undefined)out.push({t:'num',v:+m[1]});else if(m[2]!==undefined){const q=m[2][0];out.push({t:'str',v:m[2].slice(1,-1).split(q+q).join(q)})}
  else if(m[3]!==undefined){const u=m[3].toUpperCase();out.push(u==='AND'||u==='OR'||u==='NOT'?{t:'op',v:u}:{t:'id',v:m[3]})}else if(m[4]!==undefined)out.push({t:'op',v:m[4]})}
 return out}
// يبني شجرة ثم يحوّلها إلى دالة (row)=>قيمة. vars: خريطة الاسم(بحروف صغيرة) → دالة جلب العمود
export function compileExpr(src,getCol,N=0){const tk=tokenize(String(src||'')),used=new Set();let p=0;
 if(!tk.length)bad('اكتب تعبيراً أولاً','Enter an expression first');
 const peek=()=>tk[p],eat=v=>{const t=tk[p];if(t&&t.t==='op'&&t.v===v){p++;return true}return false},need=v=>{if(!eat(v))bad(`متوقَّع «${v}»`,`Expected “${v}”`)};
 const bin=(L,R,fn)=>r=>{const a=L(r);if(a===null)return null;const b=R(r);if(b===null)return null;return fn(a,b)};
 function orE(){let a=andE();while(peek()&&peek().t==='op'&&(peek().v==='OR'||peek().v==='|')){p++;const L=a,R=andE();a=r=>(L(r)>0||R(r)>0)?1:0}return a}
 function andE(){let a=notE();while(peek()&&peek().t==='op'&&(peek().v==='AND'||peek().v==='&')){p++;const L=a,R=notE();a=r=>(L(r)>0&&R(r)>0)?1:0}return a}
 function notE(){if(peek()&&peek().t==='op'&&(peek().v==='NOT'||peek().v==='~')){p++;const x=notE();return r=>x(r)>0?0:1}return cmpE()}
 function cmpE(){let a=addE();const t=peek();if(t&&t.t==='op'&&['=','==','<>','!=','<','>','<=','>='].includes(t.v)){p++;const L=a,R=addE(),o=t.v;
   a=r=>{const x=L(r),y=R(r);if(x===null||y===null)return null;const sx=typeof x==='string',sy=typeof y==='string';if(sx!==sy)return(o==='<>'||o==='!=')?1:0;
    const c=sx?x.localeCompare(y):x-y;return(o==='='||o==='=='?c===0:o==='<>'||o==='!='?c!==0:o==='<'?c<0:o==='>'?c>0:o==='<='?c<=0:c>=0)?1:0}}return a}
 function addE(){let a=mulE();while(peek()&&peek().t==='op'&&(peek().v==='+'||peek().v==='-')){const o=tk[p++].v,L=a,R=mulE();a=bin(L,R,(x,y)=>typeof x==='string'||typeof y==='string'?(o==='+'?String(x)+String(y):bad('لا يمكن طرح النصوص','Cannot subtract text')):o==='+'?x+y:x-y)}return a}
 function mulE(){let a=unE();while(peek()&&peek().t==='op'&&['*','/','%'].includes(peek().v)){const o=tk[p++].v,L=a,R=unE();a=bin(L,R,(x,y)=>typeof x==='string'||typeof y==='string'?null:o==='*'?x*y:o==='/'?(y===0?null:x/y):(y===0?null:x-y*Math.floor(x/y)))}return a}
 function unE(){if(eat('-')){const x=unE();return r=>{const v=x(r);return typeof v==='number'?-v:null}}if(eat('+'))return unE();return powE()}
 function powE(){const a=prim();if(eat('^')||eat('**')){const R=unE();return bin(a,R,(x,y)=>{const v=typeof x==='number'&&typeof y==='number'?Math.pow(x,y):null;return Number.isFinite(v)?v:null})}return a}
 function prim(){const t=tk[p++];if(!t)bad('التعبير غير مكتمل','The expression is incomplete');
  if(t.t==='num'||t.t==='str'){const v=t.v;return()=>v}
  if(t.t==='op'&&t.v==='('){const e=orE();need(')');return e}
  if(t.t==='id'){const nx=peek(),name=t.v,lc=name.toLowerCase();
   if(nx&&nx.t==='op'&&nx.v==='('){p++;const args=[];if(!eat(')')){do{args.push(orE())}while(eat(','));need(')')}return call(lc,args,name)}
   if(lc==='pi')return()=>Math.PI;
   const c=getCol(lc);if(!c)bad(`المتغير «${name}» غير موجود`,`Variable “${name}” does not exist`);used.add(lc);return r=>c[r]}
  bad(`رمز غير متوقَّع «${t.v}»`,`Unexpected token “${t.v}”`)}
 function call(lc,args,name){const n=args.length;
  if(lc==='if'){if(n!==3)bad('الدالة IF تأخذ ثلاث معطيات: IF(شرط، إذا_صح، إذا_خطأ)','IF takes three arguments: IF(cond, then, else)');return r=>{const c=args[0](r);return c===null?null:c>0?args[1](r):args[2](r)}}
  if(lc in COLFN){if(n!==1)bad(`${name} تأخذ معطىً واحداً`,`${name} takes one argument`);if(!N)bad(`${name} متاحة في «حساب متغير» فقط`,`${name} is only available in Compute Variable`);
   let st=null;const stats=()=>{if(st)return st;const a=[];for(let r=0;r<N;r++){const v=args[0](r);if(typeof v==='number')a.push(v)}st={a,m:a.length?COLFN.cmean(a):null,sd:a.length>1?FUN.sd.agg(a):null};if(lc!=='z'){st.v=a.length?COLFN[lc](a):null}return st};
   return r=>{const S=stats();if(lc==='z'){const x=args[0](r);return typeof x==='number'&&S.sd?(x-S.m)/S.sd:null}return S.v}}
  if(lc==='missing'){if(n!==1)bad('MISSING تأخذ معطىً واحداً','MISSING takes one argument');return r=>args[0](r)===null?1:0}
  const d=FUN[lc];if(!d)bad(`الدالة «${name}» غير معروفة`,`Unknown function “${name}”`);
  if(d.n==='+'){if(!n)bad(`الدالة ${name} تحتاج معطىً واحداً على الأقل`,`${name} needs at least one argument`);
   if(d.agg)return r=>{const a=[];for(const f of args){const v=f(r);if(typeof v==='number')a.push(v)}return a.length?d.agg(a):null};
   return r=>d.f(...args.map(f=>f(r)))}
  const ok=Array.isArray(d.n)?d.n.includes(n):d.n===n;if(!ok)bad(`عدد معطيات ${name} غير صحيح`,`Wrong number of arguments for ${name}`);
  return r=>{const a=args.map(f=>f(r));if(a.some(x=>x===null))return null;if(!d.s&&a.some(x=>typeof x!=='number'))return null;const v=d.f(...a);return typeof v==='number'&&!Number.isFinite(v)?null:v}}
 const f=orE();if(p<tk.length)bad(`رمز زائد «${tk[p].v}» في التعبير`,`Extra token “${tk[p].v}” in the expression`);
 return{fn:f,used:[...used]}}

// ================= 2) أدوات بناء الحالة =================
const lookup=()=>{const m=new Map();store.vars.forEach((v,i)=>m.set(v.name.toLowerCase(),i));return m};
function colGetter(){const m=lookup(),cache=new Map();return lc=>{if(!m.has(lc))return null;const i=m.get(lc);if(!cache.has(i))cache.set(i,col(i));return cache.get(i)}}
const isInt=a=>a.every(x=>x===null||Number.isInteger(x));
function uniqueName(base,taken){let n=base.replace(/[^\p{L}\p{N}_.@#$]/gu,'_');if(!/^[\p{L}@]/u.test(n))n='V'+n;let k=2,c=n;while(!validName(c)||taken.has(c.toLowerCase())){c=n+'_'+k++}taken.add(c.toLowerCase());return c}
function typedVar(name,vals){const isStr=vals.some(x=>typeof x==='string'),v=mkVar(name,isStr?'String':'Numeric');
 if(isStr){let L=1;for(const x of vals)if(typeof x==='string'&&x.length>L)L=x.length;v.width=Math.min(Math.max(L,8),255)}else v.decimals=isInt(vals)?0:2;return v}
function putVar(name,vals,labelFrom){const vars=store.vars.slice(),cols=store.cols.slice(),i=vars.findIndex(v=>v.name.toLowerCase()===name.toLowerCase()),nv=typedVar(i>=0?vars[i].name:name,vals);
 if(i>=0){const o=vars[i];Object.assign(nv,{label:o.label,columns:o.columns});vars[i]=nv;cols[i]=vals}else{if(labelFrom)nv.label=labelFrom;vars.push(nv);cols.push(vals)}
 replaceAll({name:store.name,vars,cols,n:store.n},false);return i>=0?i:vars.length-1}

// ================= 3) حساب متغير =================
export function computeVar({target,expr,cond}){
 if(!validName(String(target||''),store.vars.findIndex(v=>v.name.toLowerCase()===String(target||'').toLowerCase())))bad('اسم المتغير الهدف غير صالح (يبدأ بحرف ولا يحوي مسافات)','Invalid target name (must start with a letter, no spaces)');
 const g=colGetter(),E=compileExpr(expr,g,store.n),C=cond&&String(cond).trim()?compileExpr(cond,g,store.n):null,old=store.vars.findIndex(v=>v.name.toLowerCase()===target.toLowerCase()),oc=old>=0?store.cols[old]:null,out=new Array(store.n);
 for(let r=0;r<store.n;r++){if(C){const c=C.fn(r);if(!(c>0)){out[r]=oc?oc[r]??null:null;continue}}const v=E.fn(r);out[r]=v===undefined?null:v}
 if(!out.some(x=>x!==null))bad('كل النتائج فارغة (مفقودة) — راجع التعبير والمتغيرات المستخدمة','All results are missing — check the expression and the variables used');
 if(old>=0&&oc){const ty=store.vars[old].type;if(ty==='Numeric'&&out.some(x=>typeof x==='string'))bad('المتغير الهدف رقمي لكن التعبير ينتج نصاً','The target is numeric but the expression produces text');}
 const idx=putVar(target,out,'');return{index:idx,n:out.filter(x=>x!==null).length,missing:out.filter(x=>x===null).length,created:old<0}}

// ================= 4) إعادة الترميز =================
// الصيغة: «1 2 = 1 ; 3 thru 5 = 2 ; lo thru 0 = 9 ; 'A' = 'x' ; missing = sysmis ; else = copy»
const TOK=/(lo|[-+]?(?:\d+\.?\d*|\.\d+))\s+thru\s+(hi|[-+]?(?:\d+\.?\d*|\.\d+))|'(?:[^']|'')*'|"(?:[^"]|"")*"|[^\s,;]+/gi;
const unq=s=>/^(['"]).*\1$/.test(s)?s.slice(1,-1):s;
export function parseRecode(text){const rules=[];let els=null;
 for(const part of String(text||'').split(/;|\n/)){const s=part.trim();if(!s)continue;const i=s.lastIndexOf('=');if(i<1)bad(`قاعدة غير صالحة «${s}» — الصيغة: قديم = جديد`,`Invalid rule “${s}” — use: old = new`);
  const lhs=s.slice(0,i).trim(),rhs=s.slice(i+1).trim();if(!rhs)bad(`القيمة الجديدة ناقصة في «${s}»`,`Missing new value in “${s}”`);
  const rl=rhs.toLowerCase(),to=rl==='sysmis'||rl==='missing'?{t:'miss'}:rl==='copy'?{t:'copy'}:/^['"]/.test(rhs)?{t:'val',v:unq(rhs)}:Number.isFinite(+rhs)&&rhs!==''?{t:'val',v:+rhs}:{t:'val',v:rhs};
  if(lhs.toLowerCase()==='else'){els=to;continue}
  const tests=[];for(const m of lhs.matchAll(TOK)){const w=m[0];
   if(m[1]!==undefined){const lo=/^lo$/i.test(m[1])?-Infinity:+m[1],hi=/^hi$/i.test(m[2])?Infinity:+m[2];if(lo>hi)bad(`المدى «${w}» معكوس`,`Range “${w}” is reversed`);tests.push({k:'range',lo,hi})}
   else if(/^(missing|sysmis)$/i.test(w))tests.push({k:'miss'});else if(/^['"]/.test(w))tests.push({k:'str',v:unq(w)});else tests.push(Number.isFinite(+w)?{k:'num',v:+w,s:w}:{k:'str',v:w})}
  if(!tests.length)bad(`الجانب الأيسر فارغ في «${s}»`,`Empty left side in “${s}”`);rules.push({tests,to})}
 if(!rules.length&&!els)bad('أدخل قاعدة واحدة على الأقل','Enter at least one rule');return{rules,els}}
const hit=(t,x)=>t.k==='miss'?x===null:x===null?false:t.k==='range'?typeof x==='number'&&x>=t.lo&&x<=t.hi:t.k==='num'?(typeof x==='number'?Math.abs(x-t.v)<1e-12:String(x)===t.s):String(x)===t.v;
export function recodeValue(map,x,keepUnmatched){for(const r of map.rules)if(r.tests.some(t=>hit(t,x)))return r.to.t==='miss'?null:r.to.t==='copy'?x:r.to.v;
 if(map.els)return map.els.t==='miss'?null:map.els.t==='copy'?x:map.els.v;return keepUnmatched?x:null}
export function recodeVars({vars,into,suffix,map}){const m=parseRecode(map),taken=new Set(store.vars.map(v=>v.name.toLowerCase())),vs=store.vars.slice(),cs=store.cols.slice(),done=[];
 for(const c of vars){const src=col(c),out=new Array(store.n);for(let r=0;r<store.n;r++)out[r]=recodeValue(m,src[r],into==='same');
  const o=store.vars[c],isStr=out.some(x=>typeof x==='string'),nv=typedVar(o.name,out);
  if(into==='same'){Object.assign(nv,{label:o.label,columns:o.columns,missing:'',values:''});vs[c]=nv;cs[c]=out;done.push(o.name)}
  else{const nm=uniqueName(o.name+(suffix||'_r'),taken);nv.name=nm;nv.label=o.label?`${o.label} (recoded)`:'';vs.push(nv);cs.push(out);done.push(nm)}}
 replaceAll({name:store.name,vars:vs,cols:cs,n:store.n},false);return done}

// ================= 5) عكس ترميز البنود (يخدم ألفا كرونباخ) =================
export function reverseItems({vars,min,max,suffix}){const taken=new Set(store.vars.map(v=>v.name.toLowerCase())),vs=store.vars.slice(),cs=store.cols.slice(),done=[];
 const cols=vars.map(c=>col(c));let lo=min,hi=max;if(lo===null||hi===null){lo=Infinity;hi=-Infinity;for(const a of cols)for(const x of a)if(typeof x==='number'){if(x<lo)lo=x;if(x>hi)hi=x}}
 if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi)bad('تعذّر تحديد أدنى وأعلى قيمة للمقياس؛ أدخلهما يدوياً','Could not determine the scale minimum and maximum; enter them manually');
 vars.forEach((c,k)=>{const o=store.vars[c],out=cols[k].map(x=>typeof x==='number'?lo+hi-x:null),nv=typedVar(o.name,out),nm=uniqueName(o.name+(suffix||'_r'),taken);nv.name=nm;nv.label=o.label?`${o.label} (reversed)`:'(reversed)';nv.decimals=o.decimals;vs.push(nv);cs.push(out);done.push(nm)});
 replaceAll({name:store.name,vars:vs,cols:cs,n:store.n},false);return{done,lo,hi}}

// ================= 6) ترتيب الحالات =================
export function sortOrder(a,desc,isNum){const idx=Array.from({length:a.length},(_,i)=>i),dir=desc?-1:1;
 idx.sort((i,j)=>{const x=a[i],y=a[j];if(x===null||x===undefined||x==='')return(y===null||y===undefined||y==='')?i-j:1;if(y===null||y===undefined||y==='')return-1;const c=isNum?x-y:String(x).localeCompare(String(y));return c?c*dir:i-j});return idx}
export function sortCases({by,desc}){const keys=by.map(c=>({a:store.cols[c],num:store.vars[c].type==='Numeric'}));let idx=Array.from({length:store.n},(_,i)=>i);
 // فرز مستقر متعدد المفاتيح: من آخر مفتاح إلى أول مفتاح
 for(let k=keys.length-1;k>=0;k--){const {a,num}=keys[k],sub=idx.map(i=>a[i]),ord=sortOrder(sub,desc,num);idx=ord.map(j=>idx[j])}
 replaceAll({name:store.name,vars:store.vars.slice(),cols:store.cols.map(c=>{const o=new Array(store.n);for(let r=0;r<store.n;r++)o[r]=c[idx[r]]??null;return o}),n:store.n},false)}

// ================= 7) الواجهة =================
const say=t=>{document.querySelector('#status').textContent=t};
const need=()=>{if(!store.vars.length){say(T('حمّل البيانات أولاً (ملف ← بيانات تجريبية)','Load data first (File → Demo data)'));return false}return true};
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const refresh=()=>{};   // replaceAll يُصدر حدث «data» فتُعاد رسم الشبكة تلقائياً
export function openCompute(){if(!need())return;if(document.querySelector('.tfm'))return;const ar=document.documentElement.lang==='ar';
 const ov=document.createElement('div');ov.className='dlgov tfm';
 ov.innerHTML=`<div class="dlg cmp" dir="${ar?'rtl':'ltr'}"><h3>${T('حساب متغير','Compute Variable')}</h3><div class="dbody">
 <div class="fld"><label>${T('اسم المتغير الهدف (جديد أو موجود)','Target variable (new or existing)')}</label><input id="cmT" dir="ltr" placeholder="total"></div>
 <div class="fld"><label>${T('التعبير الرياضي','Numeric expression')}</label><textarea id="cmE" dir="ltr" rows="3" spellcheck="false" placeholder="(score - CMEAN(score)) / CSD(score)"></textarea></div>
 <div class="fld"><label>${T('المتغيرات (انقر للإدراج)','Variables (click to insert)')}</label><div class="chips" data-w="v">${store.vars.map(v=>`<button type="button" dir="ltr" data-i="${esc(v.name)}">${esc(v.name)}</button>`).join('')}</div></div>
 <div class="fld"><label>${T('الدوال (انقر للإدراج)','Functions (click to insert)')}</label><div class="chips fn" data-w="f">${FUNCTIONS.map(f=>`<button type="button" dir="ltr" data-i="${f}(">${f}</button>`).join('')}</div></div>
 <div class="fld"><label>${T('شرط اختياري: احسب فقط للحالات التي يتحقق فيها','Optional condition: compute only for cases where')}</label><input id="cmC" dir="ltr" placeholder="age >= 18 AND sex = 'F'"></div>
 <p class="hint">${T('العمليات: + − * / ^ % · المقارنة: = &lt;&gt; &lt; &gt; &lt;= &gt;= · المنطق: AND OR NOT · النص بين علامتي اقتباس. القيمة المفقودة في أي متغير تجعل النتيجة مفقودة. دوال الصف (SUM, MEAN, MIN, MAX, SD) تعمل عبر المتغيرات داخل الصف وتتجاهل المفقود؛ ودوال العمود (CMEAN, CSD, CSUM, CMIN, CMAX, CMEDIAN, Z) تحسب على كل الحالات.','Operators: + − * / ^ % · Comparison: = &lt;&gt; &lt; &gt; &lt;= &gt;= · Logic: AND OR NOT · text in quotes. A missing operand makes the result missing Row functions (SUM, MEAN, MIN, MAX, SD) work across variables within a row and skip missing values; column functions (CMEAN, CSD, CSUM, CMIN, CMAX, CMEDIAN, Z) use all cases.')}</p>
 </div><div class="derr"></div><div class="dfoot"><button class="go">${T('حساب','Compute')}</button><button class="cx">${T('إلغاء','Cancel')}</button></div></div>`;
 document.body.append(ov);const q=s=>ov.querySelector(s),E=q('#cmE'),close=()=>ov.remove();
 let last=E;ov.querySelectorAll('input,textarea').forEach(x=>x.addEventListener('focus',()=>{if(x.id!=='cmT')last=x}));
 ov.addEventListener('click',e=>{const b=e.target.closest('.chips button');if(!b)return;const t=last||E,s=t.selectionStart??t.value.length,en=t.selectionEnd??s;t.value=t.value.slice(0,s)+b.dataset.i+t.value.slice(en);const pos=s+b.dataset.i.length;t.focus();t.setSelectionRange(pos,pos)});
 const run=()=>{try{const target=q('#cmT').value.trim(),r=computeVar({target,expr:E.value,cond:q('#cmC').value});close();refresh();
   say(T(`تم ${r.created?'إنشاء':'تحديث'} المتغير «${target}» (${r.n.toLocaleString()} قيمة${r.missing?`، ${r.missing.toLocaleString()} مفقودة`:''})`,`${r.created?'Created':'Updated'} “${target}” (${r.n.toLocaleString()} values${r.missing?`, ${r.missing.toLocaleString()} missing`:''})`))}catch(e){q('.derr').textContent=e.message}};
 q('.go').onclick=run;q('.cx').onclick=close;ov.addEventListener('mousedown',e=>{if(e.target===ov)close()});
 ov.addEventListener('keydown',e=>{if(e.key==='Escape')close();else if(e.key==='Enter'&&(e.ctrlKey||e.target.tagName==='INPUT')){e.preventDefault();run()}});q('#cmT').focus()}
const MAPHELP=['القواعد مفصولة بفاصلة منقوطة أو سطر جديد، مثل: 1 2 = 1 ; 3 thru 5 = 2 ; lo thru 0 = 9 ; else = copy','Rules separated by ; or new lines, e.g.: 1 2 = 1 ; 3 thru 5 = 2 ; lo thru 0 = 9 ; else = copy'];
export const TR={
 compute:openCompute,
 recode(){if(!need())return;dialog('rc',{title:['إعادة ترميز','Recode'],fields:[{key:'vars',label:['المتغيرات المراد ترميزها','Variables to recode'],multi:true}],
  options:[{key:'into',type:'sel',label:['الناتج','Output'],def:'new',opts:[['new',['متغيرات جديدة (يُضاف اللاحقة أدناه)','New variables (suffix below)']],['same',['في نفس المتغيرات (يستبدل القيم)','Into the same variables (overwrites)']]]},{key:'suffix',type:'text',label:['لاحقة الاسم الجديد','New-name suffix'],def:'_r'},{key:'map',type:'text',label:[MAPHELP[0],MAPHELP[1]],def:''}],
  need:v=>v.vars.length?'':['اختر متغيراً واحداً على الأقل','Pick at least one variable']},v=>{const d=recodeVars({vars:v.vars,into:v.into,suffix:v.suffix,map:v.map});refresh();say(T(`تمت إعادة الترميز: ${d.join('، ')}`,`Recoded: ${d.join(', ')}`))})},
 reverse(){if(!need())return;dialog('rv',{title:['عكس ترميز البنود','Reverse-code items'],fields:[{key:'vars',label:['البنود المعكوسة الصياغة (رقمية)','Reverse-worded items (numeric)'],multi:true,num:true}],
  options:[{key:'min',type:'text',label:['أدنى قيمة للمقياس (اتركها فارغة للاكتشاف التلقائي)','Scale minimum (blank = auto-detect)'],def:''},{key:'max',type:'text',label:['أعلى قيمة للمقياس','Scale maximum'],def:''},{key:'suffix',type:'text',label:['لاحقة الاسم الجديد','New-name suffix'],def:'_r'}],
  need:v=>!v.vars.length?['اختر بنداً واحداً على الأقل','Pick at least one item']:(v.min===''||v.max==='')&&v.min!==v.max?['أدخل الحدّين معاً أو اتركهما فارغين','Enter both limits or leave both blank']:(v.min!==''&&!(+v.min<+v.max))?['الحد الأدنى يجب أن يكون أقل من الأعلى','Minimum must be below the maximum']:''},
  v=>{const r=reverseItems({vars:v.vars,min:v.min===''?null:+v.min,max:v.max===''?null:+v.max,suffix:v.suffix});refresh();say(T(`عُكس ترميز ${r.done.length} بنداً (الصيغة: ${r.lo}+${r.hi}−س)`,`Reversed ${r.done.length} item(s) (${r.lo}+${r.hi}−x)`))})},
 sort(){if(!need())return;dialog('so',{title:['ترتيب الحالات','Sort Cases'],fields:[{key:'by',label:['الترتيب حسب (بالتسلسل)','Sort by (in order)'],multi:true}],
  options:[{key:'ord',type:'sel',label:['الاتجاه','Direction'],def:'asc',opts:[['asc',['تصاعدي','Ascending']],['desc',['تنازلي','Descending']]]}],need:v=>v.by.length?'':['اختر متغيراً واحداً على الأقل','Pick at least one variable']},
  v=>{sortCases({by:v.by,desc:v.ord==='desc'});refresh();say(T('تم ترتيب الحالات (يمكنك التراجع بـ Ctrl+Z)','Cases sorted (Ctrl+Z to undo)'))})}
};
