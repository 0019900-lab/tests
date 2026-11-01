// Smart-Analysis – تجهيز البيانات (المرحلة 5، الجزء 3): اختيار الحالات، استبدال القيم المفقودة، التصنيف البصري (Binning).
// المحركات (buildMask / fillMissing / binCuts / binOf) دوال نقية قابلة للاختبار؛ الواجهة في آخر الملف.
import {T} from './i18n.js';
import {store,replaceAll,setVar} from './data.js';import {scanVar} from './props.js';import {addBlock} from './output.js';
import {col,getFilter,setFilter,getSplit,setSplit,splitGroups,getWeight,setWeight,weightIndex} from './analyses.js';
import {compileExpr,colGetter,uniqueName,typedVar} from './transform.js';
import {dialog} from './dialog.js';import {mergeFiles} from './merge.js';
const bad=(a,e)=>{throw new Error(T(a,e))};

// ================= 1) اختيار الحالات =================
// mode: cond (تعبير شرطي) | random (نسبة مئوية دقيقة) | range (من حالة إلى حالة)
export function buildMask({mode,expr,pct,first,last},N=store.n,getCol=colGetter()){
 const m=new Array(N).fill(false);
 if(mode==='cond'){if(!String(expr||'').trim())bad('اكتب شرط الاختيار، مثل: age >= 18 AND sex = \'F\'','Enter a selection condition, e.g. age >= 18 AND sex = \'F\'');
  const E=compileExpr(expr,getCol,N);for(let r=0;r<N;r++)m[r]=E.fn(r)>0}
 else if(mode==='random'){if(!(pct>0&&pct<=100))bad('النسبة بين 0 و100','Percentage must be between 0 and 100');
  const k=Math.max(1,Math.round(N*pct/100)),idx=Array.from({length:N},(_,i)=>i);for(let i=0;i<k;i++){const j=i+Math.floor(Math.random()*(N-i));[idx[i],idx[j]]=[idx[j],idx[i]];m[idx[i]]=true}}
 else if(mode==='range'){if(!(first>=1&&last>=first))bad('حدّا المدى: من ≥ 1 وإلى ≥ من','Range: first ≥ 1 and last ≥ first');for(let r=0;r<N;r++)m[r]=r+1>=first&&r+1<=last}
 else bad('طريقة اختيار غير معروفة','Unknown selection method');
 const n=m.reduce((s,x)=>s+(x?1:0),0);if(!n)bad('لا توجد أي حالة تحقق الشرط','No case satisfies the condition');
 return{mask:m,n}}

// ================= 2) استبدال القيم المفقودة =================
// a: مصفوفة أرقام/null. method: mean | median | prev | next | linear. الأطراف التي لا جار لها تبقى مفقودة في prev/next/linear.
export function fillMissing(a,method){const out=a.slice(),nums=a.filter(x=>typeof x==='number');let filled=0;
 if(!nums.length)bad('لا توجد قيم رقمية في المتغير','The variable has no numeric values');
 if(method==='mean'||method==='median'){let c;if(method==='mean')c=nums.reduce((s,x)=>s+x,0)/nums.length;else{const s=[...nums].sort((x,y)=>x-y),h=s.length>>1;c=s.length%2?s[h]:(s[h-1]+s[h])/2}
  for(let i=0;i<out.length;i++)if(out[i]===null){out[i]=c;filled++}}
 else if(method==='prev'){let last=null;for(let i=0;i<out.length;i++){if(out[i]===null){if(last!==null){out[i]=last;filled++}}else last=out[i]}}
 else if(method==='next'){let nx=null;for(let i=out.length-1;i>=0;i--){if(out[i]===null){if(nx!==null){out[i]=nx;filled++}}else nx=out[i]}}
 else if(method==='linear'){let i=0;while(i<out.length){if(out[i]!==null){i++;continue}let j=i;while(j<out.length&&out[j]===null)j++;
   if(i>0&&j<out.length){const y0=out[i-1],y1=out[j];for(let k=i;k<j;k++){out[k]=y0+(y1-y0)*(k-i+1)/(j-i+1);filled++}}i=j}}
 else bad('طريقة غير معروفة','Unknown method');
 return{out,filled}}

// ================= 3) التصنيف البصري =================
const pctile=(s,q)=>{const p=(s.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);return s[lo]+(s[hi]-s[lo])*(p-lo)};
export function binCuts(a,{method,k,cuts}){const nums=a.filter(x=>typeof x==='number');if(nums.length<2)bad('لا توجد بيانات كافية للتصنيف','Not enough data to bin');let c=[];
 const lo=Math.min(...nums),hi=Math.max(...nums);
 if(method==='cuts'){c=String(cuts||'').split(/[\s,;؛،]+/).filter(Boolean).map(Number);if(!c.length||c.some(x=>!Number.isFinite(x)))bad('اكتب نقاط القطع أرقاماً مفصولة بفواصل، مثل: 18, 30, 50','Enter cut points as numbers separated by commas, e.g. 18, 30, 50')}
 else{if(!(k>=2&&k<=20))bad('عدد الفئات بين 2 و20','Number of bins must be between 2 and 20');
  if(method==='width'){if(lo===hi)bad('كل القيم متساوية','All values are equal');const w=(hi-lo)/k;for(let i=1;i<k;i++)c.push(lo+w*i)}
  else{const s=[...nums].sort((x,y)=>x-y);for(let i=1;i<k;i++)c.push(pctile(s,i/k))}}
 c=[...new Set(c.map(x=>+x.toPrecision(10)))].sort((x,y)=>x-y);if(!c.length)bad('تعذّر تحديد نقاط القطع','Could not determine cut points');return c}
export const binOf=(x,cuts)=>{if(typeof x!=='number')return null;let b=1;for(const c of cuts)if(x>c)b++;return b};   // الحد الأعلى مشمول: س ≤ ق1 ← 1
const nf=x=>String(+x.toFixed(2));
export function binLabels(cuts){const L=[`≤ ${nf(cuts[0])}`];for(let i=1;i<cuts.length;i++)L.push(`(${nf(cuts[i-1])}, ${nf(cuts[i])}]`);L.push(`> ${nf(cuts[cuts.length-1])}`);return L}

// ================= الواجهة =================
const say=t=>{const s=document.querySelector('#status');if(s)s.textContent=t};
const need=()=>{if(!store.vars.length){say(T('حمّل البيانات أولاً (ملف ← بيانات تجريبية)','Load data first (File → Demo data)'));return false}return true};
function addVars(newVars,newCols){replaceAll({name:store.name,vars:[...store.vars,...newVars],cols:[...store.cols,...newCols],n:store.n},false)}
function badge(){const mk=(id,fn)=>{let b=document.querySelector('#'+id);if(!b){const ft=document.querySelector('#statusbar');if(!ft)return null;b=document.createElement('button');b.id=id;b.type='button';b.className='sbadge';b.onclick=fn;ft.insertBefore(b,ft.children[1]||null)}return b};
 const f=getFilter(),sp=getSplit(),bf=mk('fltBadge',()=>TR2.select()),bs=mk('splitBadge',()=>TR2.split()),bw=mk('wgtBadge',()=>TR2.weight()),wt=getWeight();if(!bf||!bs||!bw)return;
 bw.hidden=!wt;if(wt){bw.textContent=T(`مرجَّح بـ: ${wt.name}`,`Weighted by: ${wt.name}`);bw.title=T('تُكرَّر كل حالة بعدد الوزن (مقرَّباً لأقرب عدد صحيح) أثناء التحليل','Each case is repeated by its weight (rounded) during analysis')}
 bf.hidden=!f;if(f){bf.textContent=T(`مرشَّح: ${f.n.toLocaleString()} من ${store.n.toLocaleString()} حالة`,`Filter on: ${f.n.toLocaleString()} of ${store.n.toLocaleString()} cases`);bf.title=f.desc}
 bs.hidden=!sp;if(sp){bs.textContent=T(`مقسَّم حسب: ${sp.names.join('، ')}`,`Split by: ${sp.names.join(', ')}`);bs.title=T('كل تحليل يُشغَّل لكل مجموعة على حدة','Every analysis runs once per group')}}
if(typeof document!=='undefined'){document.addEventListener('sa:filter',badge);badge()}
export const TR2={
 merge:mergeFiles,
 props(){if(!need())return;
  dialog('vp',{title:['تعريف خصائص المتغير','Define Variable Properties'],fields:[{key:'vars',label:['المتغيرات المراد فحصها','Variables to scan'],multi:true}],options:[
   {key:'apply',type:'check',label:['تطبيق مستوى القياس المقترح على المتغيرات المختلفة','Apply the suggested measurement level where it differs'],def:false}],
   need:v=>v.vars.length?'':['اختر متغيراً واحداً على الأقل','Pick at least one variable']},
  v=>{const rs=v.vars.map(c=>scanVar(store.vars[c],col(c,true))),ch=[];
   if(v.apply)rs.forEach((r,i)=>{if(r.change){const e=setVar(v.vars[i],'measure',r.suggested);if(!e)ch.push(r.name)}});
   const u=r=>r.unlabeled.length?r.unlabeled.slice(0,6).join(', ')+(r.unlabeled.length>6?` … (+${r.unlabeled.length-6})`:''):'';
   addBlock('Variable Properties Scan',[{cap:'Variable Properties',head:['Variable','Valid N','Distinct values','Min','Max','Current measure','Suggested measure','Unlabeled values'],rows:rs.map(r=>[r.name,r.n,r.capped?r.distinct+'+':r.distinct,r.min===null?'':r.min,r.max===null?'':r.max,r.current,r.suggested,u(r)]),note:'Suggested measure is a heuristic: text or ≤ 2 distinct values → Nominal; whole numbers with ≤ 10 distinct values → Ordinal (Nominal if ≤ 4 and labelled); otherwise Scale. Review before relying on it.'+(ch.length?` Applied to: ${ch.join(', ')}.`:'')}],`Scanned ${rs.length} variable(s)`);
   say(T(`فُحص ${rs.length} متغيراً${v.apply?` — عُدِّل مستوى القياس لـ ${ch.length}`:''}`,`Scanned ${rs.length} variable(s)${v.apply?` — measurement level changed for ${ch.length}`:''}`))}) },
 weight(){if(!need())return;const cur=getWeight();
  dialog('wt',{title:['ترجيح الحالات','Weight Cases'],fields:[{key:'w',label:['متغير الوزن (تكرار الحالة)','Weight variable (frequency)'],num:true}],options:[
   {key:'mode',type:'sel',label:['الطريقة','Method'],def:cur?'off':'on',opts:[['on',['ترجيح الحالات بهذا المتغير','Weight cases by this variable']],['off',['إلغاء الترجيح','Turn weighting off']]]}],
   need:v=>v.mode==='off'||v.w>=0?'':['اختر متغير الوزن','Pick the weight variable']},
  v=>{if(v.mode==='off'){setWeight(null);say(T('أُلغي ترجيح الحالات','Weighting is off'));return}
   const r=weightIndex(v.w);setWeight({v:v.w,name:store.vars[v.w].name});
   say(T(`رُجِّحت الحالات بـ «${store.vars[v.w].name}»: ${r.idx.length.toLocaleString()} حالة مرجَّحة${r.rounded?` (قُرِّب ${r.rounded} وزن لأقرب عدد صحيح)`:''}${r.dropped?` · استُبعدت ${r.dropped} حالة بوزن صفر أو سالب أو مفقود`:''}`,`Weighted by “${store.vars[v.w].name}”: ${r.idx.length.toLocaleString()} weighted cases${r.rounded?` (${r.rounded} weights rounded to integers)`:''}${r.dropped?` · ${r.dropped} cases with zero, negative or missing weight excluded`:''}`))}) },
 split(){if(!need())return;const cur=getSplit();
  dialog('sp',{title:['تقسيم الملف','Split File'],fields:[{key:'vars',label:['قسّم حسب (متغير فئوي أو أكثر)','Split by (one or more categorical variables)'],multi:true}],options:[
   {key:'mode',type:'sel',label:['الطريقة','Method'],def:cur?'off':'sep',opts:[['sep',['تحليل كل مجموعة على حدة','Run each analysis separately for each group']],['off',['إلغاء التقسيم (تحليل كل الحالات معاً)','Turn splitting off (analyse all cases together)']]]}],
   need:v=>v.mode==='off'||v.vars.length?'':['اختر متغيراً واحداً على الأقل','Pick at least one variable']},
  v=>{if(v.mode==='off'){setSplit(null);say(T('أُلغي تقسيم الملف','Split File is off'));return}
   const gs=splitGroups(v.vars);if(!gs.length)throw new Error(T('لا توجد مجموعات صالحة','No valid groups'));if(gs.length>20)throw new Error(T(`عدد المجموعات كبير (${gs.length}) — اختر متغيراً بفئات أقل`,`Too many groups (${gs.length}) — pick a variable with fewer categories`));
   setSplit({vars:v.vars,names:v.vars.map(c=>store.vars[c].name)});say(T(`قُسّم الملف إلى ${gs.length} مجموعة؛ كل تحليل سيُشغَّل لكل مجموعة (الرسوم لا تتأثر بعد)`,`File split into ${gs.length} group(s); each analysis now runs per group (charts are not affected yet)`))})},
 select(){if(!need())return;const cur=getFilter();
  dialog('sel',{title:['اختيار الحالات','Select Cases'],fields:[],options:[
   {key:'mode',type:'sel',label:['الطريقة','Method'],def:cur?'all':'cond',opts:[['all',['كل الحالات (إلغاء المرشّح)','All cases (turn the filter off)']],['cond',['بشرط (تعبير)','If condition is satisfied']],['random',['عيّنة عشوائية (نسبة مئوية)','Random sample (percentage)']],['range',['مدى من الحالات (من – إلى)','Range of cases (first – last)']]]},
   {key:'expr',type:'text',label:['الشرط (للطريقة «بشرط»)، مثل: age >= 18 AND sex = \'F\'','Condition (for “If”), e.g. age >= 18 AND sex = \'F\''],def:''},
   {key:'pct',type:'num',label:['النسبة % (للعيّنة العشوائية)','Percent % (random sample)'],def:10},
   {key:'first',type:'num',label:['من الحالة رقم (للمدى)','First case (range)'],def:1},
   {key:'last',type:'num',label:['إلى الحالة رقم','Last case'],def:100}],need:()=>''},
  v=>{if(v.mode==='all'){setFilter(null);say(T('أُلغي المرشّح — كل الحالات مستخدمة','Filter off — all cases are used'));return}
   const r=buildMask(v),desc=v.mode==='cond'?v.expr:v.mode==='random'?`${v.pct}%`:`${v.first}–${v.last}`;setFilter({mask:r.mask,n:r.n,desc});
   say(T(`اختير ${r.n.toLocaleString()} من ${store.n.toLocaleString()} حالة؛ كل التحاليل الآتية تستعمل المختارة فقط (الحالات الأخرى لا تُحذف)`,`Selected ${r.n.toLocaleString()} of ${store.n.toLocaleString()} cases; all following analyses use only these (nothing is deleted)`))})},
 repmiss(){if(!need())return;
  dialog('rm',{title:['استبدال القيم المفقودة','Replace Missing Values'],fields:[{key:'vars',label:['المتغيرات الرقمية','Numeric variables'],multi:true,num:true}],options:[
   {key:'method',type:'sel',label:['الطريقة','Method'],def:'mean',opts:[['mean',['متوسط المتغير','Mean of the variable']],['median',['وسيط المتغير','Median of the variable']],['linear',['استيفاء خطي بين أقرب قيمتين','Linear interpolation']],['prev',['آخر قيمة سابقة','Last valid value before']],['next',['أول قيمة لاحقة','Next valid value after']]]},
   {key:'suffix',type:'text',label:['لاحقة الاسم الجديد','New-name suffix'],def:'_f'}],need:v=>v.vars.length?'':['اختر متغيراً واحداً على الأقل','Pick at least one variable']},
  v=>{const taken=new Set(store.vars.map(x=>x.name.toLowerCase())),nv=[],nc=[];let total=0;
   for(const c of v.vars){const o=store.vars[c],{out,filled}=fillMissing(col(c,true),v.method),t=typedVar(uniqueName(o.name+(v.suffix||'_f'),taken),out);t.decimals=Math.max(o.decimals,v.method==='mean'||v.method==='median'||v.method==='linear'?2:o.decimals);t.label=o.label?`${o.label} (filled)`:'(filled)';nv.push(t);nc.push(out);total+=filled}
   addVars(nv,nc);say(T(`أُنشئ ${nv.length} متغير جديد وعُوّضت ${total.toLocaleString()} قيمة مفقودة (الأصل لم يتغيّر)`,`Created ${nv.length} new variable(s); ${total.toLocaleString()} missing value(s) replaced (originals untouched)`))})},
 bin(){if(!need())return;
  dialog('bn',{title:['التصنيف البصري (Binning)','Visual Binning'],fields:[{key:'v',label:['المتغير الرقمي المراد تصنيفه','Numeric variable to bin'],num:true}],options:[
   {key:'method',type:'sel',label:['الطريقة','Method'],def:'width',opts:[['width',['فئات متساوية العرض','Equal width intervals']],['pctl',['فئات متساوية العدد (مئينات)','Equal percentiles (equal counts)']],['cuts',['نقاط قطع أحددها بنفسي','My own cut points']]]},
   {key:'k',type:'num',label:['عدد الفئات (للطريقتين الأوليين)','Number of bins (first two methods)'],def:4},
   {key:'cuts',type:'text',label:['نقاط القطع (للطريقة الثالثة)، مثل: 18, 30, 50','Cut points (third method), e.g. 18, 30, 50'],def:''},
   {key:'name',type:'text',label:['اسم المتغير الجديد (اتركه فارغاً للاسم التلقائي)','New variable name (blank = automatic)'],def:''}],need:v=>v.v<0?['اختر المتغير','Pick a variable']:''},
  v=>{const o=store.vars[v.v],a=col(v.v,true),cuts=binCuts(a,v),out=a.map(x=>binOf(x,cuts)),taken=new Set(store.vars.map(x=>x.name.toLowerCase())),t=typedVar(uniqueName(v.name.trim()||o.name+'_bin',taken),out),L=binLabels(cuts);
   t.decimals=0;t.measure='Ordinal';t.values=L.map((l,i)=>`${i+1}=${l}`).join(';');t.label=o.label?`${o.label} (binned)`:`${o.name} (binned)`;addVars([t],[out]);
   say(T(`أُنشئ المتغير «${t.name}» بـ ${L.length} فئات: ${L.join(' | ')}`,`Created “${t.name}” with ${L.length} bins: ${L.join(' | ')}`))})}
};
