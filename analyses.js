// التحاليل الأساسية – Phase 2
import {T} from './i18n.js';
import {store,parseNum} from './data.js';
import * as S from './stats.js';
import {addBlock,addChart} from './output.js';
import {dialog} from './dialog.js';
import * as CH from './charts.js';
import {ic} from './icons.js';
const {fx,fnz,fp,apaP}=S;
function missSet(v){if(!v.missing)return null;const s=new Set();for(const t of v.missing.split(/[,;\s]+/)){if(t==='')continue;if(v.type==='Numeric'){const n=parseNum(t);if(n!==null&&!Number.isNaN(n))s.add(n)}else s.add(t)}return s.size?s:null}
// مرشّح «اختيار الحالات»: قناع منطقي بطول عدد الحالات؛ تُعدّ الحالات المستبعدة مفقودة في كل التحاليل (raw=true يتجاهله، لتجهيز البيانات)
let FILT=null;
export const getFilter=()=>FILT&&FILT.mask.length===store.n?FILT:null;
export const setFilter=f=>{FILT=f;if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('sa:filter'))};
export function col(c,raw){const v=store.vars[c],a=store.cols[c],ms=missSet(v),out=new Array(store.n),F=raw?null:getFilter(),mk=F&&F.mask;for(let r=0;r<store.n;r++){let x=a[r];if(x==null||x===''||(ms&&ms.has(x))||(mk&&!mk[r]))x=null;out[r]=x}return out}
function labelMap(v){const m=new Map();for(const p of(v.values||'').split(/[;\n]+/)){const i=p.indexOf('=');if(i<0)continue;const k=p.slice(0,i).trim(),l=p.slice(i+1).trim();m.set(v.type==='Numeric'?parseNum(k):k,l)}return m}
const lab=(m,x)=>m.has(x)?m.get(x):String(x);
const cmp=V=>V.type==='Numeric'?(a,b)=>a-b:(a,b)=>String(a).localeCompare(String(b));
const star=p=>p<.01?'**':p<.05?'*':'';
const pct=(a,b)=>fx(a/b*100,1)+'%';
function split(dep,fac){const d=col(dep),f=col(fac),m=new Map();for(let i=0;i<store.n;i++){const x=d[i],g=f[i];if(x===null||g===null)continue;if(!m.has(g))m.set(g,[]);m.get(g).push(x)}return m}
export const RUN={};
RUN.frequencies=v=>{const fa=[],stat={cap:'Statistics',head:[''],rows:['N Valid','N Missing','Mean','Median','Mode','Std. Deviation','Variance','Minimum','Maximum','25th Percentile','75th Percentile'].map(x=>[x])},ft=[];
 for(const c of v.vars){const V=store.vars[c],a=col(c),lm=labelMap(V),valid=a.filter(x=>x!==null),N=a.length,nv=valid.length,cnt=new Map();
  for(const x of valid)cnt.set(x,(cnt.get(x)||0)+1);
  stat.head.push(V.name);stat.rows[0].push(nv);stat.rows[1].push(N-nv);
  if(V.type==='Numeric'&&nv){const s=Float64Array.from(valid).sort(),d=S.desc(valid);let mode=null,mc=0;for(const[k,f]of cnt)if(f>mc||(f===mc&&k<mode)){mode=k;mc=f}
   fa.push({name:V.name,num:1,n:nv,miss:N-nv,mean:d.mean,median:S.percentile(s,.5),sd:d.sd,min:d.min,max:d.max});const dp=V.decimals;[[d.mean,3],[S.percentile(s,.5),3],[mode,dp],[d.sd,3],[d.var,3],[d.min,dp],[d.max,dp],[S.percentile(s,.25),3],[S.percentile(s,.75),3]].forEach(([x,k],i)=>stat.rows[2+i].push(fx(x,k)))}
  else{for(let i=2;i<11;i++)stat.rows[i].push('');let tk=null,tc=0;for(const[k,f]of cnt)if(f>tc){tk=k;tc=f}fa.push({name:V.name,num:0,n:nv,miss:N-nv,k:cnt.size,top:nv?lab(lm,tk):'—',topPct:nv?tc/nv*100:0})}
  const keys=[...cnt.keys()].sort(cmp(V)),lim=Math.min(keys.length,500),rows=[];let cum=0;
  for(let i=0;i<lim;i++){const k=keys[i],f=cnt.get(k);cum+=f;rows.push([lab(lm,k),f,fx(f/N*100,1),fx(f/nv*100,1),fx(cum/nv*100,1)])}
  rows.push(['Total (valid)',nv,fx(nv/N*100,1),'100.0','']);if(N-nv)rows.push(['Missing',N-nv,fx((N-nv)/N*100,1),'','']);rows.push(['Total',N,'100.0','','']);
  ft.push({cap:V.name+(V.label?' – '+V.label:''),head:['','Frequency','Percent','Valid Percent','Cumulative Percent'],rows,note:keys.length>lim?`Showing first ${lim} of ${keys.length.toLocaleString()} distinct values.`:''})}
 return{title:'Frequencies',tables:(v.stats?[stat]:[]).concat(ft),facts:{k:'freq',vars:fa}}};
RUN.descriptives=v=>{const head=['','N','Minimum','Maximum','Mean','Std. Deviation'];
 if(v.variance)head.push('Variance');if(v.shape)head.push('Skewness','Std. Error','Kurtosis','Std. Error');if(v.se)head.push('SE Mean');if(v.sum)head.push('Sum');
 const cs=v.vars.map(c=>({V:store.vars[c],a:col(c)})),rows=[],da=[];
 for(const{V,a}of cs){const x=a.filter(t=>t!==null),d=S.desc(x),dp=V.decimals,r=[V.name,x.length,fx(d.min,dp),fx(d.max,dp),fx(d.mean),fx(d.sd)];
  if(v.variance)r.push(fx(d.var));if(v.shape)r.push(fx(d.skew),fx(d.seSkew),fx(d.kurt),fx(d.seKurt));if(v.se)r.push(fx(d.se));if(v.sum)r.push(fx(d.sum,Math.max(dp,2)));rows.push(r);da.push({name:V.name,num:1,n:x.length,mean:d.mean,sd:d.sd,min:d.min,max:d.max,...(v.shape?{skew:d.skew,seSkew:d.seSkew}:{})})}
 let ok=0;for(let i=0;i<store.n;i++)if(cs.every(({a})=>a[i]!==null))ok++;rows.push(['Valid N (listwise)',ok]);
 return{title:'Descriptive Statistics',tables:[{cap:'Descriptive Statistics',head,rows}],facts:{k:'desc',vars:da}}};
RUN.crosstabs=v=>{const RV=store.vars[v.row],CV=store.vars[v.col],ra=col(v.row),ca=col(v.col),rl=labelMap(RV),cl=labelMap(CV);
 const rs=new Set(),cs=new Set();for(let i=0;i<store.n;i++)if(ra[i]!==null&&ca[i]!==null){rs.add(ra[i]);cs.add(ca[i])}
 const rk=[...rs].sort(cmp(RV)),ck=[...cs].sort(cmp(CV));if(rk.length<2||ck.length<2)throw new Error(T('يجب أن يحتوي كل متغير على قيمتين مختلفتين على الأقل','Each variable needs at least two distinct values'));
 if(rk.length>50||ck.length>50)throw new Error(T('عدد الفئات كبير (أكثر من 50) — اختر متغيراً تصنيفياً','Too many categories (over 50) — pick a categorical variable'));
 const ri=new Map(rk.map((k,i)=>[k,i])),ci=new Map(ck.map((k,i)=>[k,i])),t=rk.map(()=>ck.map(()=>0));
 for(let i=0;i<store.n;i++)if(ra[i]!==null&&ca[i]!==null)t[ri.get(ra[i])][ci.get(ca[i])]++;
 const X=S.chiSq(t),n=X.n,head=[RV.name,'',...ck.map(k=>lab(cl,k)),'Total'],rows=[];
 const lines=[['Count',(i,j)=>t[i][j],(i)=>X.rt[i],(j)=>X.ct[j],()=>n,true]];
 if(v.exp)lines.push(['Expected',(i,j)=>fx(X.exp[i][j],1),i=>fx(X.rt[i],1),j=>fx(X.ct[j],1),()=>fx(n,1)]);
 if(v.rowp)lines.push(['% within row',(i,j)=>pct(t[i][j],X.rt[i]),()=>'100.0%',j=>pct(X.ct[j],n),()=>'100.0%']);
 if(v.colp)lines.push(['% within column',(i,j)=>pct(t[i][j],X.ct[j]),i=>pct(X.rt[i],n),()=>'100.0%',()=>'100.0%']);
 if(v.totp)lines.push(['% of total',(i,j)=>pct(t[i][j],n),i=>pct(X.rt[i],n),j=>pct(X.ct[j],n),()=>'100.0%']);
 if(v.res)lines.push(['Adj. residual',(i,j)=>fx((t[i][j]-X.exp[i][j])/Math.sqrt(X.exp[i][j]*(1-X.rt[i]/n)*(1-X.ct[j]/n)),2),()=>'',()=>'',()=>'']);
 rk.forEach((k,i)=>lines.forEach((L,li)=>rows.push([li?'':lab(rl,k),L[0],...ck.map((_,j)=>L[1](i,j)),L[2](i)])));
 lines.forEach((L,li)=>rows.push([li?'':'Total',L[0],...ck.map((_,j)=>L[3](j)),L[4]()]));
 const ct={cap:`${RV.name} × ${CV.name}`,head,rows,lc:2},ch=[['Pearson Chi-Square',fx(X.chi),X.df,fp(X.p)],['Likelihood Ratio',fx(X.lr),X.df,fp(X.pLr)]];
 if(X.yates!==undefined){ch.push(['Continuity Correction',fx(X.yates),1,fp(X.pYates)]);ch.push(["Fisher's Exact Test",'','',fp(X.fisher)])}
 ch.push(['N of Valid Cases',n,'','']);
 const tests={cap:'Chi-Square Tests',head:['','Value','df','Sig.'],rows:ch,note:`${fx(X.pctLt5,1)}% of cells have expected count < 5; minimum expected count = ${fx(X.minE,2)}.`+(X.pctLt5>20?' Assumption violated: consider Fisher\'s exact test or merging categories.':'')};
 const meas={cap:'Symmetric Measures',head:['','Value','Approx. Sig.'],rows:[...(X.R===2&&X.C===2?[['Phi',fnz(X.phi),fp(X.p)]]:[]),["Cramér's V",fnz(X.V),fp(X.p)],['Contingency Coefficient',fnz(X.cc),fp(X.p)]]};
 return{title:`Crosstabs: ${RV.name} × ${CV.name}`,tables:[ct,tests,meas],facts:{k:'cross',row:RV.name,col:CV.name,chi:X.chi,df:X.df,p:X.p,n,V:X.V,k1:Math.min(X.R,X.C)-1,pctLt5:X.pctLt5,minE:X.minE},apa:`χ²(${X.df}, N = ${n}) = ${fx(X.chi,2)}, ${apaP(X.p)}, Cramér's V = ${fnz(X.V,2)}`}};
RUN.ttest1=v=>{const g=[],t=[],apa=[],ff=[];
 for(const c of v.vars){const V=store.vars[c],a=col(c).filter(x=>x!==null);if(a.length<2)throw new Error(T(`"${V.name}" يحتوي على أقل من قيمتين صالحتين`,`"${V.name}" has fewer than two valid values`));const r=S.tOne(a,v.testValue);
  g.push([V.name,r.n,fx(r.mean),fx(r.sd),fx(r.se)]);t.push([V.name,fx(r.t),r.df,fp(r.p),fx(r.diff),fx(r.lo),fx(r.hi),fx(r.d,2)]);
  ff.push({name:V.name,n:r.n,mean:r.mean,sd:r.sd,t:r.t,df:r.df,p:r.p,diff:r.diff,lo:r.lo,hi:r.hi,d:r.d});apa.push(`${V.name}: t(${r.df}) = ${fx(r.t,2)}, ${apaP(r.p)}, d = ${fx(r.d,2)}`)}
 return{title:`One-Sample T Test (test value = ${v.testValue})`,facts:{k:'t1',testValue:v.testValue,tests:ff},tables:[{cap:'One-Sample Statistics',head:['','N','Mean','Std. Deviation','Std. Error Mean'],rows:g},{cap:`One-Sample Test (Test Value = ${v.testValue})`,head:['','t','df','Sig. (2-tailed)','Mean Difference','95% CI Lower','95% CI Upper',"Cohen's d"],rows:t}],apa}};
RUN.ttestInd=v=>{const G=store.vars[v.group],gl=labelMap(G),gc=col(v.group),all=[...new Set(gc.filter(x=>x!==null))].sort(cmp(G));let g1,g2;
 if(String(v.g1).trim()!==''&&String(v.g2).trim()!==''){const pv=s=>G.type==='Numeric'?parseNum(s):String(s).trim();g1=pv(v.g1);g2=pv(v.g2);if(g1===g2)throw new Error(T('يجب أن تختلف قيمتا المجموعتين','The two group values must differ'))}
 else if(all.length===2)[g1,g2]=all;else throw new Error(T(`يحتوي متغير التجميع على ${all.length} قيم — أدخل قيمتي المجموعتين`,`The grouping variable has ${all.length} values — enter the two group values`));
 const gs=[],ts=[],apa=[],ff=[];
 for(const c of v.vars){const V=store.vars[c],d=col(c),a=[],b=[];for(let i=0;i<store.n;i++){if(d[i]===null)continue;if(gc[i]===g1)a.push(d[i]);else if(gc[i]===g2)b.push(d[i])}
  if(a.length<2||b.length<2)throw new Error(T(`"${V.name}": تحتاج كل مجموعة إلى قيمتين على الأقل`,`"${V.name}": each group needs at least two values`));const r=S.tInd(a,b);
  gs.push([V.name,lab(gl,g1),r.A.n,fx(r.A.mean),fx(r.A.sd),fx(r.A.se)],['',lab(gl,g2),r.B.n,fx(r.B.mean),fx(r.B.sd),fx(r.B.se)]);
  const e=r.eq,u=r.un;ts.push([V.name,'Equal variances assumed',fx(r.lev.F),fp(r.lev.p),fx(e.t),e.df,fp(e.p),fx(r.diff),fx(e.se),fx(e.lo),fx(e.hi),fx(r.d,2)],['','Equal variances not assumed','','',fx(u.t),fx(u.df),fp(u.p),fx(r.diff),fx(u.se),fx(u.lo),fx(u.hi),'']);
  const w=r.lev.p<.05,z=w?u:e;ff.push({name:V.name,m1:r.A.mean,n1:r.A.n,m2:r.B.mean,n2:r.B.n,diff:r.diff,t:z.t,df:z.df,p:z.p,lo:z.lo,hi:z.hi,d:r.d,welch:w,levP:r.lev.p});apa.push(`${V.name}: t(${w?fx(z.df,1):z.df}) = ${fx(z.t,2)}, ${apaP(z.p)}, d = ${fx(r.d,2)}${w?' (Welch — Levene p '+(r.lev.p<.001?'< .001':'= '+fnz(r.lev.p))+')':''}`)}
 return{title:`Independent-Samples T Test by ${G.name}`,facts:{k:'t2',group:G.name,g1:lab(gl,g1),g2:lab(gl,g2),tests:ff},tables:[{cap:'Group Statistics',head:['',G.name,'N','Mean','Std. Deviation','Std. Error Mean'],rows:gs,lc:2},{cap:'Independent Samples Test',head:['','',"Levene F",'Levene Sig.','t','df','Sig. (2-tailed)','Mean Diff.','SE Diff.','95% CI Lower','95% CI Upper',"Cohen's d"],rows:ts,lc:2,note:'If Levene Sig. < .05 use the "not assumed" (Welch) row.'}],apa}};
RUN.ttestPair=v=>{const A=store.vars[v.a],B=store.vars[v.b],x=col(v.a),y=col(v.b),p=[],q=[];for(let i=0;i<store.n;i++)if(x[i]!==null&&y[i]!==null){p.push(x[i]);q.push(y[i])}
 if(p.length<3)throw new Error(T('يلزم 3 أزواج صالحة على الأقل','Needs at least 3 valid pairs'));const r=S.tPaired(p,q);
 return{title:`Paired-Samples T Test: ${A.name} – ${B.name}`,facts:{k:'tp',a:A.name,b:B.name,n:r.n,m1:r.A.mean,m2:r.B.mean,diff:r.diff,t:r.t,df:r.df,p:r.p,lo:r.lo,hi:r.hi,dz:r.dz},tables:[
  {cap:'Paired Samples Statistics',head:['','Mean','N','Std. Deviation','Std. Error Mean'],rows:[[A.name,fx(r.A.mean),r.n,fx(r.A.sd),fx(r.A.se)],[B.name,fx(r.B.mean),r.n,fx(r.B.sd),fx(r.B.se)]]},
  {cap:'Paired Samples Correlation',head:['','N','Correlation','Sig.'],rows:[[`${A.name} & ${B.name}`,r.n,fnz(r.r),fp(r.rp)]]},
  {cap:'Paired Samples Test',head:['','Mean','Std. Deviation','Std. Error Mean','95% CI Lower','95% CI Upper','t','df','Sig. (2-tailed)',"Cohen's dz"],rows:[[`${A.name} – ${B.name}`,fx(r.diff),fx(r.sd),fx(r.se),fx(r.lo),fx(r.hi),fx(r.t),r.df,fp(r.p),fx(r.dz,2)]]}],
  apa:`t(${r.df}) = ${fx(r.t,2)}, ${apaP(r.p)}, dz = ${fx(r.dz,2)}`}};
RUN.anova=v=>{const F=store.vars[v.factor],fl=labelMap(F),tables=[],apa=[],ds=[],lv=[],an=[],ef=[],rb=[],ph=[],pf=[],af=[];
 for(const c of v.vars){const V=store.vars[c],m=split(c,v.factor),keys=[...m.keys()].sort(cmp(F)),gr=keys.map(k=>m.get(k));
  if(keys.length<2)throw new Error(T('يجب أن يضم متغير التجميع مجموعتين على الأقل','The factor needs at least two groups'));const a=S.anovaOne(gr);if(a.dfw<1)throw new Error(T('عدد الحالات قليل مقارنة بالمجموعات','Too few cases relative to the number of groups'));
  const lev=S.levene(gr);
  keys.forEach((k,i)=>{const d=a.ds[i],h=d.n>1?S.tCrit(.05,d.n-1)*d.se:NaN;ds.push([i?'':V.name,lab(fl,k),d.n,fx(d.mean),fx(d.sd),fx(d.se),fx(d.mean-h),fx(d.mean+h),fx(d.min,V.decimals),fx(d.max,V.decimals)])});
  lv.push([V.name,fx(lev.F),lev.df1,lev.df2,fp(lev.p)]);
  an.push([V.name,'Between Groups',fx(a.ssb),a.dfb,fx(a.msb),fx(a.F),fp(a.p)],['','Within Groups',fx(a.ssw),a.dfw,fx(a.msw),'',''],['','Total',fx(a.ssb+a.ssw),a.N-1,'','','']);
  ef.push([V.name,fnz(a.eta2),fnz(a.omega2)]);
  const w=S.welchAnova(gr);if(v.welch)rb.push([V.name,fx(w.F),w.df1,fx(w.df2),fp(w.p)]);
  let line=`${V.name}: F(${a.dfb}, ${a.dfw}) = ${fx(a.F,2)}, ${apaP(a.p)}, η² = ${fnz(a.eta2,2)}`;if(lev.p<.05&&v.welch)line+=` | Welch F(${w.df1}, ${fx(w.df2,1)}) = ${fx(w.F,2)}, ${apaP(w.p)} (Levene p ${lev.p<.001?'< .001':'= '+fnz(lev.p)})`;apa.push(line);af.push({name:V.name,F:a.F,dfb:a.dfb,dfw:a.dfw,p:a.p,eta2:a.eta2,levP:lev.p,welch:v.welch?{F:w.F,df1:w.df1,df2:w.df2,p:w.p}:null,groups:keys.map((k,i)=>({label:lab(fl,k),n:a.ds[i].n,mean:a.ds[i].mean}))});
  if(v.post!=='none'&&keys.length>1){const k=keys.length,mc=k*(k-1)/2;
   for(let i=0;i<k;i++)for(let j=i+1;j<k;j++){const di=a.ds[i],dj=a.ds[j],diff=di.mean-dj.mean,se=Math.sqrt(a.msw*(1/di.n+1/dj.n)),pr=S.pT2(diff/se,a.dfw),pa=v.post==='bonf'?Math.min(1,pr*mc):pr,h=S.tCrit(v.post==='bonf'?.05/mc:.05,a.dfw)*se;
    pf.push({v:V.name,a:lab(fl,keys[i]),b:lab(fl,keys[j]),diff,p:pa});ph.push([i===0&&j===1?V.name:'',lab(fl,keys[i]),lab(fl,keys[j]),fx(diff),fx(se),fp(pa),fx(diff-h),fx(diff+h)])}}}
 tables.push(...(v.desc?[{cap:'Descriptives',head:['',F.name,'N','Mean','Std. Deviation','Std. Error','95% CI Lower','95% CI Upper','Minimum','Maximum'],rows:ds,lc:2}]:[]),
  {cap:'Test of Homogeneity of Variances (Levene, based on mean)',head:['','Levene Statistic','df1','df2','Sig.'],rows:lv},
  {cap:'ANOVA',head:['','','Sum of Squares','df','Mean Square','F','Sig.'],rows:an,lc:2},
  {cap:'Effect Size',head:['','Eta-squared','Omega-squared'],rows:ef});
 if(v.welch)tables.push({cap:'Robust Test of Equality of Means (Welch)',head:['','Statistic','df1','df2','Sig.'],rows:rb});
 if(ph.length)tables.push({cap:`Multiple Comparisons (${v.post==='bonf'?'Bonferroni':'LSD'})`,head:['','(I)','(J)','Mean Diff. (I−J)','Std. Error','Sig.','95% CI Lower','95% CI Upper'],rows:ph,lc:3});
 return{title:`One-Way ANOVA by ${F.name}`,tables,apa,facts:{k:'an',factor:F.name,tests:af,post:pf}}};
RUN.correlate=v=>{const cs=v.vars.map(c=>col(c)),names=v.vars.map(c=>store.vars[c].name),tables=[],cf=[];
 const pair=(i,j)=>{const x=[],y=[];for(let r=0;r<store.n;r++)if(cs[i][r]!==null&&cs[j][r]!==null){x.push(cs[i][r]);y.push(cs[j][r])}return[x,y]};
 for(const[key,title,f]of[['pearson','Pearson Correlations',S.corr],['spearman',"Spearman's rho",S.spearman]]){if(!v[key])continue;
  const rows=[];names.forEach((nm,i)=>{const r1=[nm,'r'],r2=['','Sig. (2-tailed)'],r3=['','N'];
   names.forEach((_,j)=>{const[x,y]=pair(i,j),n=x.length;if(i===j){r1.push('1');r2.push('');r3.push(n)}else{const r=n>2?f(x,y):NaN,p=S.corrP(r,n);if(j>i)cf.push({a:names[i],b:names[j],type:key,r,p,n});r1.push(fnz(r)+star(p));r2.push(fp(p));r3.push(n)}});rows.push(r1,r2,r3)});
  tables.push({cap:title,head:['','',...names],rows,lc:2,note:'** p < .01, * p < .05 (2-tailed). Pairwise deletion of missing values.'})}
 return{title:'Correlations',tables,facts:{k:'cor',pairs:cf}}};
// ---------- المرحلة 5: اللامعلمية، الانحدار، الثبات، الاعتدالية ----------
const pickTwo=v=>{const G=store.vars[v.group],gl=labelMap(G),gc=col(v.group),all=[...new Set(gc.filter(x=>x!==null))].sort(cmp(G));let g1,g2;
 if(String(v.g1).trim()!==''&&String(v.g2).trim()!==''){const pv=s=>G.type==='Numeric'?parseNum(s):String(s).trim();g1=pv(v.g1);g2=pv(v.g2);if(g1===g2)throw new Error(T('يجب أن تختلف قيمتا المجموعتين','The two group values must differ'))}
 else if(all.length===2)[g1,g2]=all;else throw new Error(T(`يحتوي متغير التجميع على ${all.length} قيم — أدخل قيمتي المجموعتين`,`The grouping variable has ${all.length} values — enter the two group values`));return{G,gl,gc,g1,g2}};
const med=a=>S.percentile(Float64Array.from(a).sort(),.5);
RUN.mannwhitney=v=>{const{G,gl,gc,g1,g2}=pickTwo(v),rk=[],ts=[],apa=[],ff=[];
 for(const c of v.vars){const V=store.vars[c],d=col(c),a=[],b=[];for(let i=0;i<store.n;i++){if(d[i]===null)continue;if(gc[i]===g1)a.push(d[i]);else if(gc[i]===g2)b.push(d[i])}
  if(a.length<2||b.length<2)throw new Error(T(`\"${V.name}\": تحتاج كل مجموعة إلى قيمتين على الأقل`,`\"${V.name}\": each group needs at least two values`));const r=S.mannWhitney(a,b);
  rk.push([V.name,lab(gl,g1),r.n1,fx(r.mr1,2),fx(r.R1,1)],['',lab(gl,g2),r.n2,fx(r.mr2,2),fx(r.R2,1)]);ts.push([V.name,fx(r.U,1),fx(r.z,3),fp(r.p),fx(r.r,2)]);
  ff.push({name:V.name,n1:r.n1,n2:r.n2,mr1:r.mr1,mr2:r.mr2,med1:med(a),med2:med(b),U:r.U,z:r.z,p:r.p,r:r.r});apa.push(`${V.name}: U = ${fx(r.U,1)}, z = ${fx(r.z,2)}, ${apaP(r.p)}, r = ${fx(r.r,2)}`)}
 return{title:`Mann-Whitney U Test by ${G.name}`,facts:{k:'mw',group:G.name,g1:lab(gl,g1),g2:lab(gl,g2),tests:ff},tables:[{cap:'Ranks',head:['',G.name,'N','Mean Rank','Sum of Ranks'],rows:rk,lc:2},{cap:'Test Statistics (asymptotic, tie-corrected)',head:['','Mann-Whitney U','Z','Asymp. Sig. (2-tailed)','Effect size r'],rows:ts,note:'r = |Z| / √N. Normal approximation without continuity correction (as in SPSS).'}],apa}};
RUN.wilcoxon=v=>{const A=store.vars[v.a],B=store.vars[v.b],x=col(v.a),y=col(v.b),p=[],q=[];for(let i=0;i<store.n;i++)if(x[i]!==null&&y[i]!==null){p.push(x[i]);q.push(y[i])}
 if(p.length<5)throw new Error(T('يلزم 5 أزواج صالحة على الأقل','Needs at least 5 valid pairs'));const r=S.wilcoxon(p,q);if(r.n<1)throw new Error(T('كل الفروق تساوي صفراً','All differences are zero'));
 return{title:`Wilcoxon Signed-Rank Test: ${A.name} – ${B.name}`,facts:{k:'wil',a:A.name,b:B.name,n:p.length,np:r.np,nn:r.nn,ties:r.ties,med1:med(p),med2:med(q),z:r.z,p:r.p,r:r.r},
  tables:[{cap:'Ranks',head:['','','N','Mean Rank','Sum of Ranks'],rows:[[`${A.name} − ${B.name}`,'Negative differences (A < B)',r.nn,fx(r.mrn,2),fx(r.Wn,1)],['','Positive differences (A > B)',r.np,fx(r.mrp,2),fx(r.Wp,1)],['','Ties (A = B)',r.ties,'',''],['','Total',p.length,'','']],lc:2},
   {cap:'Test Statistics (asymptotic, tie-corrected)',head:['','Z','Asymp. Sig. (2-tailed)','Effect size r'],rows:[[`${A.name} vs ${B.name}`,fx(r.z,3),fp(r.p),fx(r.r,2)]],note:'r = |Z| / √N (N = all pairs). Normal approximation without continuity correction (as in SPSS).'}],
  apa:`z = ${fx(r.z,2)}, ${apaP(r.p)}, r = ${fx(r.r,2)}`}};
RUN.kruskal=v=>{const F=store.vars[v.factor],fl=labelMap(F),rk=[],ts=[],apa=[],ff=[],extra=[];
 for(const c of v.vars){const V=store.vars[c],m=split(c,v.factor),keys=[...m.keys()].sort(cmp(F));if(keys.length<2)throw new Error(T('يجب أن يضم متغير التجميع مجموعتين على الأقل','The factor needs at least two groups'));if(keys.length>30)throw new Error(T('عدد المجموعات كبير (أكثر من 30)','Too many groups (over 30)'));
  const gs=keys.map(k=>m.get(k)),r=S.kruskal(gs);if(v.dunn!==false&&keys.length>=3){const dn=S.dunn(gs);extra.push({cap:`Dunn pairwise comparisons (Bonferroni-adjusted) — ${V.name}`,head:['Comparison','z','Sig.','Adj. Sig.'],rows:dn.map(d=>[`${lab(fl,keys[d.i])} – ${lab(fl,keys[d.j])}`,fx(d.z,3),fp(d.p),fp(d.padj)]),note:'Adj. Sig. = Sig. × number of comparisons (capped at 1). Mean ranks are compared using the tie-corrected variance.'})}keys.forEach((k,i)=>rk.push([i?'':V.name,lab(fl,k),r.n[i],fx(r.mr[i],2)]));ts.push([V.name,fx(r.H,3),r.df,fp(r.p),fx(r.eps2,3)]);
  ff.push({name:V.name,N:r.N,H:r.H,df:r.df,p:r.p,eps2:r.eps2,groups:keys.map((k,i)=>({label:lab(fl,k),n:r.n[i],mr:r.mr[i]}))});apa.push(`${V.name}: H(${r.df}) = ${fx(r.H,2)}, ${apaP(r.p)}, ε² = ${fx(r.eps2,2)}`)}
 return{title:`Kruskal-Wallis H Test by ${F.name}`,facts:{k:'kw',factor:F.name,tests:ff},tables:[{cap:'Ranks',head:['',F.name,'N','Mean Rank'],rows:rk,lc:2},{cap:'Test Statistics (tie-corrected)',head:['','Kruskal-Wallis H','df','Asymp. Sig.','ε²'],rows:ts,note:'ε² = H / (N − 1).'},...extra],apa}};
const fb=x=>{if(!Number.isFinite(x))return'';const a=Math.abs(x);return a===0||a>=.1?fx(x,3):x.toPrecision(3)};
RUN.regression=v=>{const Y=store.vars[v.dep],ys=col(v.dep),xs=v.vars.map(c=>col(c)),X=xs.map(()=>[]),y=[];
 for(let i=0;i<store.n;i++){if(ys[i]===null||xs.some(a=>a[i]===null))continue;y.push(ys[i]);xs.forEach((a,j)=>X[j].push(a[i]))}
 const k=v.vars.length;if(y.length<k+3)throw new Error(T(`عدد الحالات الصالحة (${y.length}) قليل بالنسبة لـ ${k} متغيراً مستقلاً`,`Too few valid cases (${y.length}) for ${k} predictors`));
 let r;try{r=S.linreg(X,y)}catch(e){throw new Error(e.message==='collinear'?T('يوجد ارتباط تام بين متغيرين مستقلين أو متغير ثابت؛ احذف أحدها','Perfect collinearity or a constant predictor — remove one'):e.message)}
 const names=['(Constant)',...v.vars.map(c=>store.vars[c].name)],coef=r.co.map((c,j)=>[names[j],fb(c.b),fb(c.se),j?fnz(c.beta,3):'',fx(c.t,3),fp(c.p),fb(c.lo),fb(c.hi),j&&r.vif?fx(r.vif[j-1],2):'']);
 return{title:`Linear Regression: ${Y.name}`,facts:{k:'reg',dep:Y.name,n:r.n,kk:k,R2:r.R2,adj:r.adj,F:r.F,df1:k,df2:r.dfe,pF:r.pF,dw:r.dw,coefs:names.slice(1).map((nme,j)=>({name:nme,b:r.co[j+1].b,beta:r.co[j+1].beta,t:r.co[j+1].t,p:r.co[j+1].p,vif:r.vif?r.vif[j]:null}))},
  tables:[{cap:'Model Summary',head:['Dependent','N','R','R²','Adjusted R²','Std. Error of Estimate','Durbin-Watson'],rows:[[Y.name,r.n,fnz(r.R),fnz(r.R2),fnz(r.adj),fx(r.see,3),fx(r.dw,3)]]},
   {cap:'ANOVA',head:['','Sum of Squares','df','Mean Square','F','Sig.'],rows:[['Regression',fx(r.ssr,3),k,fx(r.msr,3),fx(r.F,3),fp(r.pF)],['Residual',fx(r.sse,3),r.dfe,fx(r.mse,3),'',''],['Total',fx(r.sst,3),r.n-1,'','','']]},
   {cap:'Coefficients',head:['','B','Std. Error','Beta','t','Sig.','95% CI Lower','95% CI Upper','VIF'],rows:coef,note:'Listwise deletion. VIF > 5 suggests multicollinearity.'}],
  apa:`R² = ${fnz(r.R2,2)}, F(${k}, ${r.dfe}) = ${fx(r.F,2)}, ${apaP(r.pF)}`}};
RUN.logistic=v=>{const Y=store.vars[v.dep],ys=col(v.dep),xs=v.vars.map(c=>col(c)),X=xs.map(()=>[]),yy=[],lm=labelMap(Y);
 for(let i=0;i<store.n;i++){if(ys[i]===null||xs.some(a=>a[i]===null))continue;yy.push(ys[i]);xs.forEach((a,j)=>X[j].push(a[i]))}
 const lv=[...new Set(yy)].sort(cmp(Y));if(lv.length!==2)throw new Error(T(`المتغير التابع يجب أن يحتوي على قيمتين فقط (وُجدت ${lv.length}). استخدم «إعادة ترميز» لتحويله إلى 0/1`,`The dependent variable must have exactly two values (found ${lv.length}). Use Recode to make it 0/1`));
 const y=yy.map(x=>x===lv[1]?1:0),k=v.vars.length;if(y.length<10*(k+1)&&y.length<k+10)throw new Error(T('عدد الحالات الصالحة قليل جداً','Too few valid cases'));
 let r;try{r=S.logistic(X,y,{cut:v.cut||.5})}catch(e){const m=e.message;throw new Error(m==='collinear'?T('يوجد ارتباط تام بين متغيرين مستقلين أو متغير ثابت؛ احذف أحدها','Perfect collinearity or a constant predictor — remove one'):m==='separation'?T('فصل تام أو شبه تام بين المجموعتين: المعاملات غير قابلة للتقدير. احذف المتغير المسبّب أو ادمج الفئات','Complete or quasi-complete separation: coefficients cannot be estimated. Drop the offending predictor or merge categories'):m==='noconv'?T('لم يتقارب التقدير؛ جرّب تقليل المتغيرات المستقلة','The estimation did not converge; try fewer predictors'):m)}
 const names=['(Constant)',...v.vars.map(c=>store.vars[c].name)],ev=lab(lm,lv[1]),rf=lab(lm,lv[0]),
 eq=r.co.map((c,j)=>[names[j],fb(c.b),fb(c.se),fx(c.wald,3),1,fp(c.p),fb(c.or),fb(c.lo),fb(c.hi)]),pc=x=>fx(x*100,1)+'%';
 const tabs=[{cap:'Dependent Variable Encoding',head:['Original Value','Internal Value'],rows:[[rf,0],[ev,1]],note:T('القيمة الأعلى هي «الحدث» (1) كما في SPSS.','The higher value is the event (1), as in SPSS.')},
  {cap:'Omnibus Tests of Model Coefficients',head:['','Chi-square','df','Sig.'],rows:[['Model',fx(r.chi,3),r.df,fp(r.p)]]},
  {cap:'Model Summary',head:['-2 Log likelihood','Cox & Snell R²','Nagelkerke R²','McFadden R²','N'],rows:[[fx(r.m2,3),fnz(r.cs),fnz(r.nag),fnz(r.mcf),r.n]]}];
 if(r.hl)tabs.push({cap:'Hosmer and Lemeshow Test',head:['Chi-square','df','Sig.'],rows:[[fx(r.hl.chi,3),r.hl.df,fp(r.hl.p)]],note:T('Sig. أكبر من .05 تعني توافقاً جيداً للنموذج مع البيانات.','Sig. above .05 indicates an adequate model fit.')});
 tabs.push({cap:`Classification Table (cut value = ${fx(r.cut,2)})`,head:['Observed','Predicted: '+rf,'Predicted: '+ev,'Percentage Correct'],rows:[[rf,r.cm[0][0],r.cm[0][1],pc(r.spec)],[ev,r.cm[1][0],r.cm[1][1],pc(r.sens)],['Overall Percentage','','',pc(r.acc)]]});
 tabs.push({cap:'Variables in the Equation',head:['','B','S.E.','Wald','df','Sig.','Exp(B)','95% CI Lower','95% CI Upper'],rows:eq,note:`Event: ${Y.name} = ${ev}. Listwise deletion; converged in ${r.iter} iterations.`});
 return{title:`Logistic Regression: ${Y.name}`,tables:tabs,facts:{k:'logit',dep:Y.name,event:ev,n:r.n,kk:k,chi:r.chi,df:r.df,p:r.p,nag:r.nag,acc:r.acc,hlp:r.hl?r.hl.p:null,coefs:names.slice(1).map((nme,j)=>({name:nme,b:r.co[j+1].b,or:r.co[j+1].or,p:r.co[j+1].p,lo:r.co[j+1].lo,hi:r.co[j+1].hi}))},
  apa:`χ²(${r.df}, N = ${r.n}) = ${fx(r.chi,2)}, ${apaP(r.p)}, Nagelkerke R² = ${fnz(r.nag,2)}`}};
RUN.alpha=v=>{const items=v.vars.map(c=>col(c)),n=store.n,idx=[];for(let i=0;i<n;i++)if(items.every(a=>a[i]!==null))idx.push(i);if(idx.length<3)throw new Error(T('عدد الحالات الكاملة قليل (أقل من 3)','Too few complete cases (under 3)'));
 const r=S.cronbach(items.map(a=>idx.map(i=>a[i]))),names=v.vars.map(c=>store.vars[c].name);
 return{title:"Reliability: Cronbach's Alpha",facts:{k:'alpha',alpha:r.alpha,std:r.std,items:r.k,n:r.n,det:names.map((nm,i)=>({name:nm,r:r.det[i].r,a:r.det[i].a}))},
  tables:[{cap:'Reliability Statistics',head:["Cronbach's Alpha",'Alpha (standardized)','N of Items','N of Cases','Mean inter-item r'],rows:[[fnz(r.alpha),fnz(r.std),r.k,r.n,fnz(r.meanR)]]},
   {cap:'Item-Total Statistics',head:['','Mean','Std. Deviation','Corrected Item-Total r',"Alpha if Item Deleted"],rows:names.map((nm,i)=>[nm,fx(r.det[i].mean),fx(r.det[i].sd),fnz(r.det[i].r),Number.isFinite(r.det[i].a)?fnz(r.det[i].a):''])}],apa:`α = ${fnz(r.alpha,2)} (${r.k} items, N = ${r.n})`}};
RUN.normality=v=>{const rows=[],ff=[];for(const c of v.vars){const V=store.vars[c],x=col(c).filter(a=>a!==null),d=S.desc(x),sw=S.shapiroWilk(x);
  rows.push([V.name,x.length,Number.isFinite(sw.W)?fnz(sw.W,3):'—',Number.isFinite(sw.p)?fp(sw.p):'—',fx(d.skew,3),fx(d.kurt,3)]);ff.push({name:V.name,n:x.length,W:sw.W,p:sw.p,skew:d.skew,kurt:d.kurt})}
 return{title:'Tests of Normality (Shapiro-Wilk)',facts:{k:'norm',vars:ff},tables:[{cap:'Tests of Normality',head:['','N','Shapiro-Wilk W','Sig.','Skewness','Kurtosis'],rows,note:'Shapiro-Wilk is defined for 3 ≤ N ≤ 5000 (Royston 1995).'}],apa:ff.filter(f=>Number.isFinite(f.W)).map(f=>`${f.name}: W(${f.n}) = ${fnz(f.W,3)}, ${apaP(f.p)}`)}};
// ---------- النوافذ ----------
const say=t=>{document.querySelector('#status').textContent=t};
const one=['اختر متغيراً واحداً على الأقل','Pick at least one variable'];
const open=(id,spec,fn)=>()=>{if(!store.vars.length){say(T('حمّل البيانات أولاً (ملف ← بيانات تجريبية)','Load data first (File → Demo data)'));return}
 dialog(id,spec,v=>{const t0=performance.now(),b=RUN[fn](v);addBlock(b.title,b.tables,b.apa,b.facts);say(`${b.title} — ${Math.round(performance.now()-t0)} ms`)})};
const chk=(key,label,def)=>({key,type:'check',label,def});
// ---------- الرسوم (المرحلة 4) ----------
const nm=c=>store.vars[c].name,few=(a,n)=>{if(a.length<n)throw new Error(T(`عدد القيم الصالحة قليل (${a.length})`,`Too few valid values (${a.length})`))};
const cats=(c,lim=30)=>{const V=store.vars[c],a=col(c),k=[...new Set(a.filter(x=>x!==null))].sort(cmp(V));if(k.length<1)throw new Error(T('لا توجد قيم صالحة','No valid values'));if(k.length>lim)throw new Error(T(`عدد الفئات كبير (${k.length}) — اختر متغيراً تصنيفياً`,`Too many categories (${k.length}) — pick a categorical variable`));return{V,a,k,lm:labelMap(V)}};
const CHART={
 histogram:v=>v.vars.map(c=>{const a=col(c).filter(x=>x!==null);few(a,2);return{kind:'histogram',title:`Histogram: ${nm(c)}`,cap:`Distribution of ${nm(c)}`,spec:CH.histSpec(a,{bins:v.bins,normal:v.normal,name:nm(c)})}}),
 qq:v=>v.vars.map(c=>{const a=col(c).filter(x=>x!==null);few(a,3);return{kind:'qq',title:`Normal Q-Q Plot: ${nm(c)}`,cap:`Normal Q-Q plot of ${nm(c)}`,spec:CH.qqSpec(a,{name:nm(c)})}}),
 boxplot:v=>{if(v.group<0){const g=v.vars.map(c=>({label:nm(c),vals:col(c).filter(x=>x!==null)}));g.forEach(x=>few(x.vals,1));return[{kind:'boxplot',title:`Boxplot: ${g.map(x=>x.label).join(', ')}`,cap:`Boxplot of ${g.map(x=>x.label).join(', ')}`,spec:CH.boxSpec(g,{yName:v.vars.length===1?nm(v.vars[0]):''})}]}
  const F=store.vars[v.group],fl=labelMap(F);return v.vars.map(c=>{const m=split(c,v.group),k=[...m.keys()].sort(cmp(F));if(k.length>12)throw new Error(T('عدد المجموعات كبير (أكثر من 12)','Too many groups (over 12)'));
   return{kind:'boxplot',title:`Boxplot: ${nm(c)} by ${F.name}`,cap:`${nm(c)} by ${F.name}`,spec:CH.boxSpec(k.map(x=>({label:lab(fl,x),vals:m.get(x)})),{yName:nm(c)})}})},
 scatter:v=>{const x=col(v.x),y=col(v.y),px=[],py=[];for(let i=0;i<store.n;i++)if(x[i]!==null&&y[i]!==null){px.push(x[i]);py.push(y[i])}few(px,3);
  return[{kind:'scatter',title:`Scatter: ${nm(v.y)} by ${nm(v.x)}`,cap:`${nm(v.y)} by ${nm(v.x)}`,spec:CH.scatterSpec(px,py,{line:v.line,xName:nm(v.x),yName:nm(v.y)})}]},
 bar:v=>{const{V,a,k,lm}=cats(v.cat);
  if(v.num<0){const m=new Map();for(const x of a)if(x!==null)m.set(x,(m.get(x)||0)+1);
   return[{kind:'bar',title:`Bar Chart: ${V.name}`,cap:`${v.pct?'Percent':'Count'} by ${V.name}`,spec:CH.barSpec(k.map(x=>({label:lab(lm,x),count:m.get(x)})),{pct:v.pct,xName:V.name})}]}
  const m=split(v.num,v.cat);return[{kind:'bar',title:`Bar Chart: mean ${nm(v.num)} by ${V.name}`,cap:`Mean ${nm(v.num)} by ${V.name}`,spec:CH.barSpec(k.filter(x=>m.has(x)).map(x=>({label:lab(lm,x),vals:m.get(x)})),{mode:'mean',errors:v.err,xName:V.name,yName:T(`متوسط ${nm(v.num)}`,`Mean ${nm(v.num)}`)})}]}};
const openC=(id,spec,fn)=>()=>{if(!store.vars.length){say(T('حمّل البيانات أولاً (ملف ← بيانات تجريبية)','Load data first (File → Demo data)'));return}
 dialog(id,spec,v=>{const t0=performance.now(),L=CHART[fn](v);L.forEach(c=>addChart(c.title,c.kind,c.spec,c.cap));say(`${L[0].title} — ${Math.round(performance.now()-t0)} ms`)})};
const CHOOSE=[['histogram','hist',['المدرج التكراري','Histogram'],['شكل توزيع متغير رقمي','Shape of a numeric variable']],['bar','barc',['مخطط الأعمدة','Bar chart'],['تكرارات الفئات أو متوسطاتها','Counts or means by category']],['boxplot','box',['مخطط الصندوق','Boxplot'],['الوسيط والانتشار والقيم الشاذة','Median, spread and outliers']],['scatter','scat',['مخطط الانتشار','Scatter plot'],['العلاقة بين متغيرين مع خط الاتجاه','Two variables with a trend line']],['qq','qqi',['مخطط Q-Q','Q-Q plot'],['فحص اعتدالية التوزيع','Check normality']]];
function chooser(){if(document.querySelector('.gpick'))return;const ov=document.createElement('div');ov.className='dlgov gpick';
 ov.innerHTML=`<div class="dlg gp" dir="${document.documentElement.dir}"><h3>${T('اختر نوع الرسم','Choose a chart')}</h3><div class="gtiles">${CHOOSE.map(([k,i,n,d],x)=>`<button data-k="${k}" style="--d:${x*45}ms">${ic(i,34)}<b>${T(n[0],n[1])}</b><small>${T(d[0],d[1])}</small></button>`).join('')}</div></div>`;
 document.body.append(ov);const close=()=>{ov.classList.add('bye');setTimeout(()=>ov.remove(),160)};
 ov.onclick=e=>{const b=e.target.closest('[data-k]');if(b){close();setTimeout(()=>A[b.dataset.k](),120)}else if(e.target===ov)close()};ov.addEventListener('keydown',e=>{if(e.key==='Escape')close()});ov.querySelector('button').focus()}
export const A={
 frequencies:open('f',{title:['تكرارات','Frequencies'],fields:[{key:'vars',label:['المتغيرات','Variables'],multi:true}],options:[chk('stats',['إحصاءات (متوسط، وسيط، منوال...)','Statistics'],true)],need:v=>v.vars.length?'':one},'frequencies'),
 descriptives:open('d',{title:['إحصاء وصفي','Descriptives'],fields:[{key:'vars',label:['المتغيرات الرقمية','Numeric variables'],multi:true,num:true}],options:[chk('variance',['التباين','Variance'],false),chk('shape',['الالتواء والتفلطح','Skewness & kurtosis'],false),chk('se',['الخطأ المعياري للمتوسط','Std. error of mean'],false),chk('sum',['المجموع','Sum'],false)],need:v=>v.vars.length?'':one},'descriptives'),
 crosstabs:open('x',{title:['جداول تقاطعية','Crosstabs'],fields:[{key:'row',label:['متغير الصفوف','Row variable']},{key:'col',label:['متغير الأعمدة','Column variable']}],options:[chk('rowp',['% داخل الصف','% within row'],true),chk('colp',['% داخل العمود','% within column'],false),chk('totp',['% من الإجمالي','% of total'],false),chk('exp',['التكرار المتوقع','Expected count'],false),chk('res',['البواقي المعدّلة','Adjusted residuals'],false)],need:v=>v.row<0||v.col<0?['اختر متغيري الصفوف والأعمدة','Pick row and column variables']:v.row===v.col?['اختر متغيرين مختلفين','Pick two different variables']:''},'crosstabs'),
 ttest1:open('t1',{title:['اختبار T لعينة واحدة','One-Sample T Test'],fields:[{key:'vars',label:['المتغيرات','Variables'],multi:true,num:true}],options:[{key:'testValue',type:'num',label:['القيمة المختبَرة','Test value'],def:0}],need:v=>v.vars.length?'':one},'ttest1'),
 ttestInd:open('ti',{title:['اختبار T لعينتين مستقلتين','Independent-Samples T Test'],fields:[{key:'vars',label:['المتغيرات التابعة','Test variables'],multi:true,num:true},{key:'group',label:['متغير التجميع','Grouping variable']}],options:[{key:'g1',type:'text',label:['قيمة المجموعة 1 (اتركها فارغة إن كان في المتغير قيمتان فقط)','Group 1 value (blank if only 2 values)'],def:''},{key:'g2',type:'text',label:['قيمة المجموعة 2','Group 2 value'],def:''}],need:v=>!v.vars.length?one:v.group<0?['اختر متغير التجميع','Pick grouping variable']:v.vars.includes(v.group)?['يجب ألا يكون متغير التجميع تابعاً','Grouping variable cannot be a test variable']:''},'ttestInd'),
 ttestPair:open('tp',{title:['اختبار T لعينتين مرتبطتين','Paired-Samples T Test'],fields:[{key:'a',label:['المتغير الأول','Variable 1'],num:true},{key:'b',label:['المتغير الثاني','Variable 2'],num:true}],options:[],need:v=>v.a<0||v.b<0?['اختر المتغيرين','Pick both variables']:v.a===v.b?['اختر متغيرين مختلفين','Pick two different variables']:''},'ttestPair'),
 anova:open('a',{title:['تحليل التباين الأحادي','One-Way ANOVA'],fields:[{key:'vars',label:['المتغيرات التابعة','Dependent variables'],multi:true,num:true},{key:'factor',label:['العامل (المجموعات)','Factor']}],options:[chk('desc',['إحصاءات وصفية','Descriptives'],true),chk('welch',['اختبار Welch (متين)','Welch robust test'],true),{key:'post',type:'sel',label:['المقارنات البعدية','Post hoc'],def:'bonf',opts:[['none',['بدون','None']],['bonf',['Bonferroni','Bonferroni']],['lsd',['LSD','LSD']]]}],need:v=>!v.vars.length?one:v.factor<0?['اختر العامل','Pick the factor']:v.vars.includes(v.factor)?['يجب ألا يكون العامل تابعاً','Factor cannot be dependent']:''},'anova'),
 correlate:open('c',{title:['ارتباط','Bivariate Correlations'],fields:[{key:'vars',label:['المتغيرات','Variables'],multi:true,num:true}],options:[chk('pearson',['Pearson','Pearson'],true),chk('spearman',['Spearman','Spearman'],false)],need:v=>v.vars.length<2?['اختر متغيرين على الأقل','Pick at least two variables']:!v.pearson&&!v.spearman?['اختر نوع الارتباط','Pick a correlation type']:''},'correlate'),
 graphs:chooser,
 histogram:openC('gh',{title:['المدرج التكراري','Histogram'],fields:[{key:'vars',label:['المتغيرات الرقمية (رسم لكل متغير)','Numeric variables (one chart each)'],multi:true,num:true}],options:[{key:'bins',type:'num',label:['عدد الفئات (0 = تلقائي)','Number of bins (0 = auto)'],def:0},chk('normal',['إظهار المنحنى الطبيعي للمقارنة','Overlay a normal curve'],true)],need:v=>v.vars.length?'':one},'histogram'),
 bar:openC('gb',{title:['مخطط الأعمدة','Bar chart'],fields:[{key:'cat',label:['متغير الفئات','Category variable']},{key:'num',label:['متغير رقمي لحساب المتوسط (اختياري — اتركه فارغاً للعدّ)','Numeric variable for means (optional — leave blank to count)'],num:true}],options:[chk('pct',['عرض النسب المئوية عند العدّ','Show percentages when counting'],false),chk('err',['أشرطة الخطأ (فاصل ثقة 95%) عند المتوسط','Error bars (95% CI) for means'],true)],need:v=>v.cat<0?['اختر متغير الفئات','Pick the category variable']:v.cat===v.num?['اختر متغيرين مختلفين','Pick two different variables']:''},'bar'),
 boxplot:openC('gx',{title:['مخطط الصندوق','Boxplot'],fields:[{key:'vars',label:['المتغيرات الرقمية','Numeric variables'],multi:true,num:true},{key:'group',label:['متغير التجميع (اختياري)','Grouping variable (optional)']}],options:[],need:v=>!v.vars.length?one:v.vars.includes(v.group)?['يجب ألا يكون متغير التجميع من المتغيرات الرقمية المرسومة','Grouping variable cannot also be plotted']:''},'boxplot'),
 scatter:openC('gs',{title:['مخطط الانتشار','Scatter plot'],fields:[{key:'x',label:['المحور الأفقي (X)','Horizontal axis (X)'],num:true},{key:'y',label:['المحور الرأسي (Y)','Vertical axis (Y)'],num:true}],options:[chk('line',['إظهار خط الانحدار','Show regression line'],true)],need:v=>v.x<0||v.y<0?['اختر المتغيرين','Pick both variables']:v.x===v.y?['اختر متغيرين مختلفين','Pick two different variables']:''},'scatter'),
 qq:openC('gq',{title:['مخطط Q-Q (الاعتدالية)','Normal Q-Q plot'],fields:[{key:'vars',label:['المتغيرات الرقمية (رسم لكل متغير)','Numeric variables (one chart each)'],multi:true,num:true}],options:[],need:v=>v.vars.length?'':one},'qq'),
 mannwhitney:open('mw',{title:['اختبار مان–ويتني (U)','Mann-Whitney U Test'],fields:[{key:'vars',label:['المتغيرات التابعة','Test variables'],multi:true,num:true},{key:'group',label:['متغير التجميع','Grouping variable']}],options:[{key:'g1',type:'text',label:['قيمة المجموعة 1 (اتركها فارغة إن كان في المتغير قيمتان فقط)','Group 1 value (blank if only 2 values)'],def:''},{key:'g2',type:'text',label:['قيمة المجموعة 2','Group 2 value'],def:''}],need:v=>!v.vars.length?one:v.group<0?['اختر متغير التجميع','Pick the grouping variable']:v.vars.includes(v.group)?['يجب ألا يكون متغير التجميع تابعاً','Grouping variable cannot be a test variable']:''},'mannwhitney'),
 wilcoxon:open('wx',{title:['اختبار ويلكوكسون للرتب الإشارية','Wilcoxon Signed-Rank Test'],fields:[{key:'a',label:['المتغير الأول','Variable 1'],num:true},{key:'b',label:['المتغير الثاني','Variable 2'],num:true}],options:[],need:v=>v.a<0||v.b<0?['اختر المتغيرين','Pick both variables']:v.a===v.b?['اختر متغيرين مختلفين','Pick two different variables']:''},'wilcoxon'),
 kruskal:open('kw',{title:['اختبار كروسكال–واليس','Kruskal-Wallis H Test'],fields:[{key:'vars',label:['المتغيرات التابعة','Dependent variables'],multi:true,num:true},{key:'factor',label:['العامل (المجموعات)','Factor']}],options:[{key:'dunn',type:'check',label:['مقارنات Dunn البعدية (تصحيح بونفروني) عند 3 مجموعات فأكثر','Dunn pairwise post hoc (Bonferroni) for 3+ groups'],def:true}],need:v=>!v.vars.length?one:v.factor<0?['اختر العامل','Pick the factor']:v.vars.includes(v.factor)?['يجب ألا يكون العامل تابعاً','Factor cannot be a dependent variable']:''},'kruskal'),
 regression:open('rg',{title:['الانحدار الخطي','Linear Regression'],fields:[{key:'dep',label:['المتغير التابع','Dependent variable'],num:true},{key:'vars',label:['المتغيرات المستقلة','Independent variables'],multi:true,num:true}],options:[],need:v=>v.dep<0?['اختر المتغير التابع','Pick the dependent variable']:!v.vars.length?one:v.vars.includes(v.dep)?['يجب ألا يكون المتغير التابع بين المستقلة','The dependent variable cannot also be an independent variable']:''},'regression'),
 logistic:open('lg',{title:['الانحدار اللوجستي الثنائي','Binary Logistic Regression'],fields:[{key:'dep',label:['المتغير التابع (قيمتان فقط؛ الأعلى = الحدث)','Dependent variable (two values; higher = event)']},{key:'vars',label:['المتغيرات المستقلة (رقمية)','Independent variables (numeric)'],multi:true,num:true}],options:[{key:'cut',type:'num',label:['قيمة القطع للتصنيف','Classification cut value'],def:.5}],need:v=>v.dep<0?['اختر المتغير التابع','Pick the dependent variable']:!v.vars.length?one:v.vars.includes(v.dep)?['يجب ألا يكون المتغير التابع بين المستقلة','The dependent variable cannot also be an independent variable']:(v.cut<=0||v.cut>=1)&&v.cut!==0?['قيمة القطع بين 0 و1','Cut value must be between 0 and 1']:''},'logistic'),
 alpha:open('al',{title:['ثبات المقياس (ألفا كرونباخ)','Reliability (Cronbach’s Alpha)'],fields:[{key:'vars',label:['بنود المقياس (متغيرات رقمية)','Scale items (numeric variables)'],multi:true,num:true}],options:[],need:v=>v.vars.length<2?['اختر بندين على الأقل','Pick at least two items']:''},'alpha'),
 normality:open('nm',{title:['فحص الاعتدالية (Shapiro–Wilk)','Normality check (Shapiro-Wilk)'],fields:[{key:'vars',label:['المتغيرات الرقمية','Numeric variables'],multi:true,num:true}],options:[],need:v=>v.vars.length?'':one},'normality')};
