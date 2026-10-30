// Smart-Analysis – الرسوم (المرحلة 4): SVG نقي بلا DOM ولا مكتبات، قابل للاختبار والتصدير.
// الفكرة: نحفظ «مواصفة» صغيرة (spec) محسوبة من البيانات، ثم نرسمها وقت العرض أو التصدير،
// فتتبدّل اللغة والمظهر (فاتح/داكن) دون إعادة حساب، ولا تتضخم ملفات المشروع (لا نخزّن 100 ألف نقطة).
import {desc,percentile,corr,corrP,tCrit} from './stats.js';
const E=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
export const PAL=['#1e6bff','#12c39a','#7c3aed','#f59e0b','#ef4444','#0ea5e9'];
const W=640,H=400,M={l:66,r:24,t:34,b:60};
const fin=a=>a.filter(Number.isFinite);
const tick=x=>{const a=Math.abs(x);return a!==0&&(a>=1e7||a<1e-3)?x.toExponential(1):String(+x.toPrecision(6))};
const r2=x=>+x.toFixed(2);
// ---- قياس المحاور ----
export function nice(min,max,n=5){if(!(max>min)){const d=Math.abs(min)||1;min-=d/2;max+=d/2}
 const raw=(max-min)/n,mag=10**Math.floor(Math.log10(raw)),f=raw/mag,step=(f<1.5?1:f<3?2:f<7?5:10)*mag,
  lo=Math.floor(min/step+1e-9)*step,hi=Math.ceil(max/step-1e-9)*step,ticks=[];
 for(let v=lo;v<=hi+step/2;v+=step)ticks.push(+v.toPrecision(12));return{lo:ticks[0],hi:ticks[ticks.length-1],step,ticks}}
// معكوس التوزيع الطبيعي (Acklam) — خطؤه النسبي أقل من 1.2e-9
export function qnorm(p){if(p<=0)return-Infinity;if(p>=1)return Infinity;
 const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],
  b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],
  c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],
  d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];let q,r;
 if(p<.02425){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
 if(p>1-.02425){q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
 q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
const evenly=(n,m)=>{if(n<=m)return[...Array(n).keys()];const o=[];for(let i=0;i<m;i++)o.push(Math.round(i*(n-1)/(m-1)));return o};

// ================= بناء المواصفات (من الأرقام الخام) =================
export function histSpec(raw,{bins=0,normal=true,name=''}={}){const a=fin(raw),n=a.length;if(n<2)throw new Error('n<2');
 let mn=Infinity,mx=-Infinity;for(const x of a){if(x<mn)mn=x;if(x>mx)mx=x}
 const d=desc(a),k=bins>0?bins:Math.min(40,Math.max(5,Math.ceil(Math.log2(n)+1))),ax=nice(mn,mx,k),step=ax.step,nb=ax.ticks.length-1,counts=new Array(nb).fill(0);
 for(const x of a){let i=Math.floor((x-ax.lo)/step+1e-9);if(i>=nb)i=nb-1;if(i<0)i=0;counts[i]++}
 return{name,n,mean:d.mean,sd:d.sd,skew:d.skew,normal:!!normal,bins:counts.map((c,i)=>({a:ax.ticks[i],b:ax.ticks[i+1],n:c}))}}
export function barSpec(groups,{mode='count',errors=false,pct=false,xName='',yName=''}={}){
 let cats;
 if(mode==='mean')cats=groups.map(g=>{const v=fin(g.vals),n=v.length;if(!n)return{label:g.label,n:0,v:NaN,lo:NaN,hi:NaN};const d=desc(v),h=n>1?tCrit(.05,n-1)*d.se:0;return{label:g.label,n,v:d.mean,lo:d.mean-h,hi:d.mean+h}});
 else{const tot=groups.reduce((s,g)=>s+g.count,0)||1;cats=groups.map(g=>({label:g.label,n:g.count,v:pct?g.count/tot*100:g.count}))}
 return{mode,errors:mode==='mean'&&!!errors,pct:!!pct,xName,yName,cats}}
export function boxSpec(groups,{yName=''}={}){
 return{yName,groups:groups.map(g=>{const v=fin(g.vals),s=Float64Array.from(v).sort(),n=s.length;if(!n)return{label:g.label,n:0};
  const q1=percentile(s,.25),med=percentile(s,.5),q3=percentile(s,.75),iqr=q3-q1,lf=q1-1.5*iqr,uf=q3+1.5*iqr;let wl=Infinity,wh=-Infinity,out=[],sum=0;
  for(const x of s){sum+=x;if(x<lf||x>uf)out.push(x);else{if(x<wl)wl=x;if(x>wh)wh=x}}
  const nOut=out.length;if(out.length>120)out=evenly(out.length,120).map(i=>out[i]);
  return{label:g.label,n,q1,med,q3,wl,wh,mean:sum/n,out,nOut}})}}
export function scatterSpec(x,y,{line=true,xName='',yName=''}={}){const px=[],py=[];for(let i=0;i<x.length;i++)if(Number.isFinite(x[i])&&Number.isFinite(y[i])){px.push(x[i]);py.push(y[i])}
 const n=px.length;if(n<3)throw new Error('n<3');const r=corr(px,py),dx=desc(px),dy=desc(py),b=dx.sd>0?r*dy.sd/dx.sd:NaN,a=dy.mean-b*dx.mean,idx=evenly(n,2500);
 return{n,xName,yName,line:!!line,r,r2:r*r,p:corrP(r,n),a,b,pts:idx.map(i=>[px[i],py[i]]),sampled:n>2500}}
export function qqSpec(raw,{name=''}={}){const s=Float64Array.from(fin(raw)).sort(),n=s.length;if(n<3)throw new Error('n<3');
 const z=i=>qnorm((i+1-.375)/(n+.25)),idx=evenly(n,400),pts=idx.map(i=>[z(i),s[i]]);
 const q1=percentile(s,.25),q3=percentile(s,.75),z1=qnorm(.25),z3=qnorm(.75),slope=(q3-q1)/(z3-z1),icpt=q1-slope*z1;
 const th=[],sm=[];for(let i=0;i<n;i+=Math.max(1,Math.floor(n/2000))){th.push(z(i));sm.push(s[i])}
 return{name,n,pts,slope,icpt,ppcc:corr(th,sm)}}

// ================= الرسم =================
const lbl=(lang)=>lang==='ar'?{freq:'التكرار',theo:'الكميات النظرية (توزيع طبيعي)',samp:'كميات العيّنة',mean:'المتوسط',cnt:'التكرار',pct:'النسبة المئوية %',ci:'أشرطة الخطأ: فاصل ثقة 95%',out:'قيمة شاذة',sd:'ع'}:{freq:'Frequency',theo:'Theoretical quantiles (normal)',samp:'Sample quantiles',mean:'Mean',cnt:'Count',pct:'Percent %',ci:'Error bars: 95% CI',out:'outliers',sd:'SD'};
function svg(aria,body,o){const ink=o.ink||'currentColor';return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Segoe UI',Tahoma,Arial,sans-serif" font-size="12" fill="${ink}" role="img" aria-label="${E(aria)}" style="max-width:100%;height:auto">${body}</svg>`}
function axes(o,{x,y,xl,yl,xCat}){const ink=o.ink||'currentColor',px=sx=>M.l+(sx-x.lo)/(x.hi-x.lo)*(W-M.l-M.r),py=v=>H-M.b-(v-y.lo)/(y.hi-y.lo)*(H-M.t-M.b);let s='';
 for(const t of y.ticks){const Y=py(t);s+=`<line x1="${M.l}" x2="${W-M.r}" y1="${Y}" y2="${Y}" stroke="${ink}" stroke-opacity="${t===0?.45:.12}"/><text x="${M.l-8}" y="${Y+4}" text-anchor="end">${tick(t)}</text>`}
 if(!xCat)for(const t of x.ticks){const X=px(t);s+=`<line x1="${X}" x2="${X}" y1="${H-M.b}" y2="${H-M.b+5}" stroke="${ink}" stroke-opacity=".5"/><text x="${X}" y="${H-M.b+19}" text-anchor="middle">${tick(t)}</text>`}
 s+=`<line x1="${M.l}" x2="${M.l}" y1="${M.t}" y2="${H-M.b}" stroke="${ink}" stroke-opacity=".5"/><line x1="${M.l}" x2="${W-M.r}" y1="${H-M.b}" y2="${H-M.b}" stroke="${ink}" stroke-opacity=".5"/>`;
 if(xl)s+=`<text x="${(M.l+W-M.r)/2}" y="${H-10}" text-anchor="middle" font-weight="600">${E(xl)}</text>`;
 if(yl)s+=`<text transform="translate(16 ${(M.t+H-M.b)/2}) rotate(-90)" text-anchor="middle" font-weight="600">${E(yl)}</text>`;
 return{s,px,py}}
const note=(t)=>`<text x="${W-M.r}" y="20" text-anchor="end" font-size="11.5" fill-opacity=".75">${E(t)}</text>`;

export function histogram(s,o={}){const L=lbl(o.lang),b=s.bins,x=nice(b[0].a,b[b.length-1].b,6),ymax=Math.max(...b.map(k=>k.n)),w=b[0].b-b[0].a;
 const dens=t=>s.n*w*Math.exp(-((t-s.mean)**2)/(2*s.sd*s.sd))/(s.sd*Math.sqrt(2*Math.PI)),peak=s.normal&&s.sd>0?dens(s.mean):0,y=nice(0,Math.max(ymax,peak)*1.05);
 const A=axes(o,{x,y,xl:s.name,yl:L.freq});let g='';
 for(const k of b){const X=A.px(k.a)+1,X2=A.px(k.b)-1,Y=A.py(k.n);g+=`<rect x="${r2(X)}" y="${r2(Y)}" width="${r2(Math.max(1,X2-X))}" height="${r2(A.py(0)-Y)}" rx="2" fill="${PAL[0]}" fill-opacity=".85"><title>${tick(k.a)}–${tick(k.b)}: ${k.n}</title></rect>`}
 if(s.normal&&s.sd>0){let d='';for(let i=0;i<=80;i++){const t=x.lo+(x.hi-x.lo)*i/80;d+=(i?'L':'M')+r2(A.px(t))+' '+r2(A.py(dens(t)))}g+=`<path d="${d}" fill="none" stroke="${PAL[3]}" stroke-width="2.2"/>`}
 return svg(`Histogram of ${s.name}`,A.s+g+note(`${L.mean} = ${tick(+s.mean.toFixed(3))} · ${L.sd} = ${tick(+s.sd.toFixed(3))} · N = ${s.n}`),o)}

export function bar(s,o={}){const L=lbl(o.lang),c=s.cats,vals=c.flatMap(k=>[k.v,k.lo,k.hi]).filter(Number.isFinite),y=nice(Math.min(0,...vals),Math.max(0,...vals)*1.08||1),x={lo:0,hi:1,ticks:[]};
 const A=axes(o,{x,y,xl:s.xName,yl:s.yName||(s.mode==='mean'?L.mean:s.pct?L.pct:L.cnt),xCat:true}),bw=(W-M.l-M.r)/c.length,ink=o.ink||'currentColor';let g='';
 c.forEach((k,i)=>{if(!Number.isFinite(k.v))return;const cx=M.l+bw*(i+.5),w=Math.min(78,bw*.6),top=A.py(Math.max(k.v,0)),h=Math.abs(A.py(k.v)-A.py(0)),col=PAL[i%PAL.length];
  g+=`<rect x="${r2(cx-w/2)}" y="${r2(k.v>=0?top:A.py(0))}" width="${r2(w)}" height="${r2(h)}" rx="4" fill="${col}" fill-opacity=".85"><title>${E(k.label)}: ${tick(+k.v.toFixed(3))} (n=${k.n})</title></rect>`;
  if(s.errors&&Number.isFinite(k.lo)){const a=A.py(k.lo),b=A.py(k.hi);g+=`<g stroke="${ink}" stroke-width="1.6"><line x1="${cx}" x2="${cx}" y1="${a}" y2="${b}"/><line x1="${cx-6}" x2="${cx+6}" y1="${a}" y2="${a}"/><line x1="${cx-6}" x2="${cx+6}" y1="${b}" y2="${b}"/></g>`}
  g+=`<text x="${cx}" y="${r2((k.v>=0?Math.min(top,s.errors?A.py(k.hi):top):A.py(k.v))-(k.v>=0?7:-15))}" text-anchor="middle" font-weight="600">${tick(+k.v.toFixed(s.pct?1:2))}${s.pct?'%':''}</text><text x="${cx}" y="${H-M.b+19}" text-anchor="middle">${E(String(k.label).slice(0,18))}</text>`});
 return svg(`Bar chart ${s.xName}`,A.s+g+(s.errors?note(L.ci):''),o)}

export function boxplot(s,o={}){const L=lbl(o.lang),G=s.groups.filter(g=>g.n),all=G.flatMap(g=>[g.q1,g.q3,g.wl,g.wh,...g.out]),y=nice(Math.min(...all),Math.max(...all)),A=axes(o,{x:{lo:0,hi:1,ticks:[]},y,yl:s.yName,xCat:true}),bw=(W-M.l-M.r)/G.length,ink=o.ink||'currentColor';let g='',out=0;
 G.forEach((k,i)=>{const cx=M.l+bw*(i+.5),w=Math.min(84,bw*.55),col=PAL[i%PAL.length];out+=k.nOut;
  g+=`<g stroke="${col}" stroke-width="1.8"><line x1="${cx}" x2="${cx}" y1="${A.py(k.wh)}" y2="${A.py(k.q3)}"/><line x1="${cx}" x2="${cx}" y1="${A.py(k.q1)}" y2="${A.py(k.wl)}"/><line x1="${cx-w/4}" x2="${cx+w/4}" y1="${A.py(k.wh)}" y2="${A.py(k.wh)}"/><line x1="${cx-w/4}" x2="${cx+w/4}" y1="${A.py(k.wl)}" y2="${A.py(k.wl)}"/></g>`+
  `<rect x="${r2(cx-w/2)}" y="${r2(A.py(k.q3))}" width="${r2(w)}" height="${r2(Math.max(1,A.py(k.q1)-A.py(k.q3)))}" rx="4" fill="${col}" fill-opacity=".28" stroke="${col}" stroke-width="1.8"><title>${E(k.label)} — Q1 ${tick(+k.q1.toFixed(3))} · Median ${tick(+k.med.toFixed(3))} · Q3 ${tick(+k.q3.toFixed(3))} (n=${k.n})</title></rect>`+
  `<line x1="${cx-w/2}" x2="${cx+w/2}" y1="${A.py(k.med)}" y2="${A.py(k.med)}" stroke="${ink}" stroke-width="2.6"/><path d="M${cx} ${A.py(k.mean)-5}l5 5-5 5-5-5z" fill="${ink}" fill-opacity=".8"/>`+
  k.out.map(v=>`<circle cx="${cx}" cy="${r2(A.py(v))}" r="3" fill="none" stroke="${col}" stroke-width="1.4"/>`).join('')+`<text x="${cx}" y="${H-M.b+19}" text-anchor="middle">${E(String(k.label).slice(0,18))}</text>`});
 return svg(`Boxplot ${s.yName}`,A.s+g+note(`◆ ${L.mean}${out?` · ${out} ${L.out}`:''}`),o)}

export function scatter(s,o={}){const L=lbl(o.lang),xs=s.pts.map(p=>p[0]),ys=s.pts.map(p=>p[1]),x=nice(Math.min(...xs),Math.max(...xs)),y=nice(Math.min(...ys),Math.max(...ys)),A=axes(o,{x,y,xl:s.xName,yl:s.yName});let g='';
 g+=`<g fill="${PAL[0]}" fill-opacity="${s.pts.length>500?.4:.6}">`+s.pts.map(p=>`<circle cx="${r2(A.px(p[0]))}" cy="${r2(A.py(p[1]))}" r="3.2"/>`).join('')+'</g>';
 if(s.line&&Number.isFinite(s.b)){const clip=v=>Math.max(y.lo,Math.min(y.hi,v));let x1=x.lo,x2=x.hi;const f=t=>s.a+s.b*t;
  if(s.b!==0){const ta=(y.lo-s.a)/s.b,tb=(y.hi-s.a)/s.b;x1=Math.max(x.lo,Math.min(ta,tb));x2=Math.min(x.hi,Math.max(ta,tb))}
  g+=`<line x1="${r2(A.px(x1))}" y1="${r2(A.py(clip(f(x1))))}" x2="${r2(A.px(x2))}" y2="${r2(A.py(clip(f(x2))))}" stroke="${PAL[4]}" stroke-width="2.4"/>`}
 const rr=Math.abs(s.r)<1?(s.r<0?'-':'')+Math.abs(s.r).toFixed(2).replace(/^0/,''):s.r.toFixed(2);
 return svg(`Scatter ${s.yName} by ${s.xName}`,A.s+g+note(`r = ${rr} · R² = ${s.r2.toFixed(2).replace(/^0/,'')} · N = ${s.n}`),o)}

export function qq(s,o={}){const L=lbl(o.lang),xs=s.pts.map(p=>p[0]),ys=s.pts.map(p=>p[1]),x=nice(Math.min(...xs),Math.max(...xs)),y=nice(Math.min(...ys),Math.max(...ys)),A=axes(o,{x,y,xl:L.theo,yl:s.name?`${L.samp} — ${s.name}`:L.samp});
 const f=t=>s.icpt+s.slope*t,ln=`<line x1="${r2(A.px(x.lo))}" y1="${r2(A.py(Math.max(y.lo,Math.min(y.hi,f(x.lo)))))}" x2="${r2(A.px(x.hi))}" y2="${r2(A.py(Math.max(y.lo,Math.min(y.hi,f(x.hi)))))}" stroke="${PAL[4]}" stroke-width="2" stroke-dasharray="6 4"/>`;
 return svg(`Normal Q-Q plot of ${s.name}`,A.s+ln+`<g fill="${PAL[0]}" fill-opacity=".6">`+s.pts.map(p=>`<circle cx="${r2(A.px(p[0]))}" cy="${r2(A.py(p[1]))}" r="3"/>`).join('')+'</g>'+note(`N = ${s.n}`),o)}

export const RENDER={histogram,bar,boxplot,scatter,qq};
export const chartSVG=(kind,spec,o={})=>RENDER[kind](spec,o);
