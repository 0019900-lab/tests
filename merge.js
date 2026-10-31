// Smart-Analysis – دمج الملفات (المرحلة 5، الجزء 4): إضافة حالات، أو إضافة متغيرات (بمفتاح أو بترتيب الصفوف).
// المحركات mergeCases / mergeVars دوال نقية على حالة {name,vars,cols,n} وقابلة للاختبار؛ الواجهة في آخر الملف.
import {T} from './i18n.js';
import {store,replaceAll,mkVar} from './data.js';
import {setFilter,setSplit} from './analyses.js';
import {dialog} from './dialog.js';
const bad=(a,e)=>{throw new Error(T(a,e))};
const lc=s=>String(s).toLowerCase();
const pad=(c,n)=>{const o=new Array(n).fill(null);for(let r=0;r<c.length&&r<n;r++)o[r]=c[r]??null;return o};

// ---- إضافة حالات: المتغيرات المتطابقة بالاسم تُدمج، وغير الموجودة في أحد الملفين تُملأ بمفقود ----
export function mergeCases(A,B,{indicator=false}={}){
 const idx=new Map(A.vars.map((v,i)=>[lc(v.name),i])),n=A.n+B.n,vars=A.vars.map(v=>({...v})),cols=A.cols.map(c=>pad(c,n)),clash=[];let added=0;
 B.vars.forEach((bv,j)=>{let i=idx.get(lc(bv.name));
  if(i===undefined){i=vars.length;vars.push({...bv});cols.push(new Array(n).fill(null));idx.set(lc(bv.name),i);added++}
  else if(vars[i].type!==bv.type){clash.push(bv.name);return}
  for(let r=0;r<B.n;r++)cols[i][A.n+r]=B.cols[j][r]??null});
 if(clash.length)bad(`نوع هذه المتغيرات يختلف بين الملفين (رقمي/نصي): ${clash.join('، ')}`,`These variables differ in type between the files (numeric/string): ${clash.join(', ')}`);
 if(indicator){let nm='source',k=2;while(idx.has(lc(nm)))nm='source'+k++;const v=mkVar(nm);v.decimals=0;v.measure='Nominal';v.values='1=Current file;2=Merged file';v.label='Source of case';vars.push(v);cols.push(Array.from({length:n},(_,r)=>r<A.n?1:2))}
 return{state:{name:A.name,vars,cols,n},added,casesAdded:B.n}}

// ---- إضافة متغيرات: byRow=ترتيب الصفوف، وإلا مطابقة بمتغير مفتاح؛ outer=إبقاء حالات الملف الثاني غير المطابقة كحالات جديدة ----
export function mergeVars(A,B,{keyName,outer=false,byRow=false}){
 const rowOf=new Array(A.n).fill(-1),used=new Set();let kA=-1,kB=-1,matched=0;
 if(byRow){for(let r=0;r<Math.min(A.n,B.n);r++){rowOf[r]=r;used.add(r)}matched=Math.min(A.n,B.n)}
 else{kA=A.vars.findIndex(v=>lc(v.name)===lc(keyName));kB=B.vars.findIndex(v=>lc(v.name)===lc(keyName));
  if(kA<0||kB<0)bad(`المتغير «${keyName}» غير موجود في الملفين بالاسم نفسه`,`Variable “${keyName}” must exist in both files with the same name`);
  const m=new Map();for(let r=0;r<B.n;r++){const x=B.cols[kB][r];if(x===null||x===undefined||x==='')continue;const k=String(x);if(m.has(k))bad(`قيمة المفتاح «${k}» مكررة في الملف الثاني — يلزم مفتاح فريد`,`Key value “${k}” is repeated in the second file — a unique key is required`);m.set(k,r)}
  for(let r=0;r<A.n;r++){const x=A.cols[kA][r];if(x===null||x===undefined||x==='')continue;const j=m.get(String(x));if(j!==undefined){rowOf[r]=j;used.add(j);matched++}}}
 const extra=[];if(outer||byRow)for(let r=0;r<B.n;r++)if(!used.has(r))extra.push(r);
 const n=A.n+extra.length,taken=new Set(A.vars.map(v=>lc(v.name))),vars=A.vars.map(v=>({...v})),cols=A.cols.map(c=>pad(c,n));
 if(!byRow&&outer&&kA>=0)extra.forEach((br,e)=>{cols[kA][A.n+e]=B.cols[kB][br]??null});
 let added=0;B.vars.forEach((bv,j)=>{if(j===kB)return;let nm=bv.name,k=2;while(taken.has(lc(nm)))nm=`${bv.name}_${k++}`;taken.add(lc(nm));
  const o=new Array(n).fill(null);for(let r=0;r<A.n;r++)if(rowOf[r]>=0)o[r]=B.cols[j][rowOf[r]]??null;extra.forEach((br,e)=>{o[A.n+e]=B.cols[j][br]??null});vars.push({...bv,name:nm});cols.push(o);added++});
 return{state:{name:A.name,vars,cols,n},added,matched,unmatchedA:A.n-matched,extraCases:extra.length}}

// ================= الواجهة =================
const say=t=>{const s=document.querySelector('#status');if(s)s.textContent=t};
async function readState(f){const F=await import('./files.js'),D=await import('./data.js'),ext=f.name.split('.').pop().toLowerCase(),nm=f.name.replace(/\.[^.]+$/,'');
 if(ext==='statlab'||ext==='json')return D.fromProject(await f.text());
 if(ext==='xlsx'||ext==='xls')return D.rowsToState(await F.loadXlsx(f),nm);
 return D.rowsToState(D.parseDelimited(await f.text()),nm)}
export function mergeFiles(){
 if(!store.vars.length){say(T('حمّل البيانات أولاً (ملف ← بيانات تجريبية)','Load data first (File → Demo data)'));return}
 const inp=document.createElement('input');inp.type='file';inp.accept='.statlab,.json,.csv,.tsv,.txt,.xlsx,.xls';
 inp.onchange=async()=>{const f=inp.files[0];if(!f)return;let B;try{say(T('جاري قراءة الملف…','Reading the file…'));B=await readState(f)}catch(e){say(T('تعذر فتح الملف: ','Could not open file: ')+e.message);return}
  say('');const KEY=['الدمج بمفتاح','by key'];
  dialog('mg',{title:[`دمج مع «${f.name}» (${B.n.toLocaleString()} حالة × ${B.vars.length} متغير)`,`Merge with “${f.name}” (${B.n.toLocaleString()} cases × ${B.vars.length} variables)`],
   fields:[{key:'key',label:['متغير المطابقة — يجب أن يحمل الاسم نفسه في الملفين (للدمج بمفتاح فقط)','Matching key — must have the same name in both files (key merges only)']}],
   options:[{key:'kind',type:'sel',label:['نوع الدمج','Merge type'],def:'cases',opts:[
     ['cases',['إضافة حالات (الملف الثاني يُلحق أسفل الحالي)','Add cases (append the second file below)']],
     ['key',['إضافة متغيرات بمفتاح (حالات ملفك الحالي فقط)','Add variables by key (keep only current cases)']],
     ['keyOuter',['إضافة متغيرات بمفتاح (إبقاء حالات الملفين)','Add variables by key (keep cases from both)']],
     ['row',['إضافة متغيرات بترتيب الصفوف','Add variables by row order']]]},
    {key:'ind',type:'check',label:['عند إضافة الحالات: أنشئ متغيراً يبيّن مصدر كل حالة','When adding cases: create a variable showing each case’s source'],def:true}],
   need:v=>(v.kind==='key'||v.kind==='keyOuter')&&v.key<0?['اختر متغير المطابقة','Pick the matching key variable']:''},
  v=>{const A={name:store.name,vars:store.vars,cols:store.cols,n:store.n};let res,msg;
   if(v.kind==='cases'){res=mergeCases(A,B,{indicator:v.ind});msg=T(`أُضيفت ${B.n.toLocaleString()} حالة${res.added?` و${res.added} متغير جديد`:''}؛ الإجمالي ${res.state.n.toLocaleString()} حالة`,`Added ${B.n.toLocaleString()} cases${res.added?` and ${res.added} new variable(s)`:''}; total ${res.state.n.toLocaleString()} cases`)}
   else{res=mergeVars(A,B,{keyName:store.vars[v.key]?store.vars[v.key].name:'',outer:v.kind==='keyOuter',byRow:v.kind==='row'});msg=T(`أُضيف ${res.added} متغير؛ طُوبقت ${res.matched.toLocaleString()} حالة${res.unmatchedA?` وبقيت ${res.unmatchedA.toLocaleString()} بلا مطابق (قيم مفقودة)`:''}${res.extraCases?`؛ أُضيفت ${res.extraCases.toLocaleString()} حالة من الملف الثاني`:''}`,`Added ${res.added} variable(s); ${res.matched.toLocaleString()} case(s) matched${res.unmatchedA?`, ${res.unmatchedA.toLocaleString()} unmatched (left missing)`:''}${res.extraCases?`; ${res.extraCases.toLocaleString()} case(s) appended from the second file`:''}`)}
   setFilter(null);setSplit(null);replaceAll(res.state,false);say(msg+T(' — يمكنك التراجع بـ Ctrl+Z',' — Ctrl+Z to undo'))})};
 inp.click()}
