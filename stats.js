// StatLab – محرك الإحصاء (دوال نقية بدون DOM) – Phase 2
const G=7,LC=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
export function lgamma(x){if(x<.5)return Math.log(Math.PI/Math.abs(Math.sin(Math.PI*x)))-lgamma(1-x);x-=1;let a=LC[0];const t=x+G+.5;for(let i=1;i<9;i++)a+=LC[i]/(x+i);return .5*Math.log(2*Math.PI)+(x+.5)*Math.log(t)-t+Math.log(a)}
function betacf(a,b,x){const T=1e-300;const qab=a+b,qap=a+1,qam=a-1;let c=1,d=1-qab*x/qap;if(Math.abs(d)<T)d=T;d=1/d;let h=d;
 for(let m=1;m<=400;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<T)d=T;c=1+aa/c;if(Math.abs(c)<T)c=T;d=1/d;h*=d*c;
  aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<T)d=T;c=1+aa/c;if(Math.abs(c)<T)c=T;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-16)break}return h}
export function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b}
function gser(a,x){let ap=a,sum=1/a,del=sum;for(let n=0;n<1000;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*1e-16)break}return sum*Math.exp(-x+a*Math.log(x)-lgamma(a))}
function gcf(a,x){const T=1e-300;let b=x+1-a,c=1/T,d=1/b,h=d;for(let i=1;i<1000;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<T)d=T;c=b+an/c;if(Math.abs(c)<T)c=T;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-16)break}return Math.exp(-x+a*Math.log(x)-lgamma(a))*h}
export const gammaQ=(a,x)=>x<=0?1:x<a+1?1-gser(a,x):gcf(a,x);
export const pT2=(t,df)=>Number.isFinite(t)?ibeta(df/(df+t*t),df/2,.5):0;      // two-sided
export const pF=(F,d1,d2)=>F<=0?1:Number.isFinite(F)?ibeta(d2/(d2+d1*F),d2/2,d1/2):0; // upper tail
export const pChi=(x,k)=>gammaQ(k/2,x/2);
export const pNorm2=z=>gammaQ(.5,z*z/2);
export function tCrit(alpha,df){let lo=0,hi=1e4;for(let i=0;i<200;i++){const m=(lo+hi)/2;if(pT2(m,df)>alpha)lo=m;else hi=m}return(lo+hi)/2}
// ---------- وصفي ----------
export function desc(a){const n=a.length;let s=0;for(const x of a)s+=x;const mean=n?s/n:NaN;let m2=0,m3=0,m4=0,mn=Infinity,mx=-Infinity;
 for(const x of a){const d=x-mean,d2=d*d;m2+=d2;m3+=d2*d;m4+=d2*d2;if(x<mn)mn=x;if(x>mx)mx=x}
 const v=n>1?m2/(n-1):NaN,sd=Math.sqrt(v),o={n,sum:s,mean,m2,var:v,sd,se:sd/Math.sqrt(n),min:mn,max:mx};
 if(n>2&&sd>0){o.skew=n/((n-1)*(n-2))*m3/sd**3;o.seSkew=Math.sqrt(6*n*(n-1)/((n-2)*(n+1)*(n+3)))}
 if(n>3&&sd>0){o.kurt=(n*(n+1)/((n-1)*(n-2)*(n-3)))*m4/sd**4-3*(n-1)**2/((n-2)*(n-3));o.seKurt=2*o.seSkew*Math.sqrt((n*n-1)/((n-3)*(n+5)))}
 return o}
export function percentile(s,p){const n=s.length;if(!n)return NaN;const pos=(n+1)*p;if(pos<1)return s[0];if(pos>=n)return s[n-1];const i=Math.floor(pos),f=pos-i;return s[i-1]+f*(s[i]-s[i-1])} // طريقة SPSS (HAVERAGE)
export function ranks(a){const n=a.length,idx=Array.from({length:n},(_,i)=>i).sort((i,j)=>a[i]-a[j]),r=new Array(n);let i=0;while(i<n){let j=i;while(j+1<n&&a[idx[j+1]]===a[idx[i]])j++;const v=(i+j)/2+1;for(let k=i;k<=j;k++)r[idx[k]]=v;i=j+1}return r}
export function corr(x,y){const n=x.length;let mx=0,my=0;for(let i=0;i<n;i++){mx+=x[i];my+=y[i]}mx/=n;my/=n;let sxy=0,sxx=0,syy=0;for(let i=0;i<n;i++){const a=x[i]-mx,b=y[i]-my;sxy+=a*b;sxx+=a*a;syy+=b*b}return sxy/Math.sqrt(sxx*syy)}
export const spearman=(x,y)=>corr(ranks(x),ranks(y));
export function corrP(r,n){if(n<3||Number.isNaN(r))return NaN;if(Math.abs(r)>=1)return 0;return pT2(r*Math.sqrt((n-2)/(1-r*r)),n-2)}
// ---------- ANOVA ----------
export function anovaOne(groups){const k=groups.length,ds=groups.map(desc),N=ds.reduce((s,d)=>s+d.n,0),gm=ds.reduce((s,d)=>s+d.sum,0)/N;
 let ssb=0,ssw=0;ds.forEach(d=>{ssb+=d.n*(d.mean-gm)**2;ssw+=d.m2});
 const dfb=k-1,dfw=N-k,msb=ssb/dfb,msw=ssw/dfw,F=msb/msw;return{k,N,gm,ds,ssb,ssw,dfb,dfw,msb,msw,F,p:msw===0?(ssb>0?0:NaN):pF(F,dfb,dfw),eta2:ssb/(ssb+ssw),omega2:(ssb-dfb*msw)/(ssb+ssw+msw)}}
export function levene(groups){const z=groups.map(g=>{const m=g.reduce((s,x)=>s+x,0)/g.length;return g.map(x=>Math.abs(x-m))});const a=anovaOne(z);return{F:a.F,p:a.p,df1:a.dfb,df2:a.dfw}}
export function welchAnova(groups){const k=groups.length,ds=groups.map(desc);if(ds.some(d=>!(d.var>0)))return{F:NaN,p:NaN,df1:k-1,df2:NaN};
 const w=ds.map(d=>d.n/d.var),W=w.reduce((a,b)=>a+b,0),mt=ds.reduce((s,d,i)=>s+w[i]*d.mean,0)/W;
 const A=ds.reduce((s,d,i)=>s+w[i]*(d.mean-mt)**2,0)/(k-1),L=ds.reduce((s,d,i)=>s+(1-w[i]/W)**2/(d.n-1),0);
 const B=1+2*(k-2)/(k*k-1)*L,F=A/B,df2=(k*k-1)/(3*L);return{F,p:pF(F,k-1,df2),df1:k-1,df2}}
// ---------- اختبارات T ----------
export function tOne(a,mu=0){const d=desc(a),df=d.n-1,t=(d.mean-mu)/d.se,p=pT2(t,df),h=tCrit(.05,df)*d.se;return{n:d.n,mean:d.mean,sd:d.sd,se:d.se,t,df,p,diff:d.mean-mu,lo:d.mean-mu-h,hi:d.mean-mu+h,d:(d.mean-mu)/d.sd}}
export function tInd(a,b){const A=desc(a),B=desc(b),df=A.n+B.n-2,sp2=((A.n-1)*A.var+(B.n-1)*B.var)/df,diff=A.mean-B.mean;
 const se=Math.sqrt(sp2*(1/A.n+1/B.n)),t=diff/se,tc=tCrit(.05,df);
 const sw=Math.sqrt(A.var/A.n+B.var/B.n),dfw=(A.var/A.n+B.var/B.n)**2/((A.var/A.n)**2/(A.n-1)+(B.var/B.n)**2/(B.n-1)),tw=diff/sw,tcw=tCrit(.05,dfw);
 return{A,B,diff,lev:levene([a,b]),d:diff/Math.sqrt(sp2),
  eq:{t,df,p:pT2(t,df),se,lo:diff-tc*se,hi:diff+tc*se},un:{t:tw,df:dfw,p:pT2(tw,dfw),se:sw,lo:diff-tcw*sw,hi:diff+tcw*sw}}}
export function tPaired(a,b){const d=a.map((x,i)=>x-b[i]),T=tOne(d,0),r=corr(a,b);return{...T,A:desc(a),B:desc(b),r,rp:corrP(r,a.length),dz:T.d}}
// ---------- جداول التقاطع ----------
const lch=(n,k)=>lgamma(n+1)-lgamma(k+1)-lgamma(n-k+1);
export function fisher2x2(a,b,c,d){const n=a+b+c+d,r1=a+b,c1=a+c,lo=Math.max(0,c1-(c+d)),hi=Math.min(r1,c1);const lp=x=>lch(r1,x)+lch(n-r1,c1-x)-lch(n,c1),po=Math.exp(lp(a));let s=0;for(let x=lo;x<=hi;x++){const p=Math.exp(lp(x));if(p<=po*(1+1e-7))s+=p}return Math.min(1,s)}
export function chiSq(t){const R=t.length,C=t[0].length,rt=t.map(r=>r.reduce((a,b)=>a+b,0)),ct=t[0].map((_,j)=>t.reduce((s,r)=>s+r[j],0)),n=rt.reduce((a,b)=>a+b,0);
 const exp=t.map((r,i)=>r.map((_,j)=>rt[i]*ct[j]/n));let chi=0,lr=0,yates=0,lt5=0,minE=Infinity;
 t.forEach((r,i)=>r.forEach((o,j)=>{const e=exp[i][j];chi+=(o-e)**2/e;if(o>0)lr+=2*o*Math.log(o/e);yates+=Math.max(0,Math.abs(o-e)-.5)**2/e;if(e<5)lt5++;if(e<minE)minE=e}));
 const df=(R-1)*(C-1),out={R,C,rt,ct,n,exp,chi,lr,df,p:pChi(chi,df),pLr:pChi(lr,df),pctLt5:lt5/(R*C)*100,minE,phi:Math.sqrt(chi/n),V:Math.sqrt(chi/(n*Math.min(R-1,C-1))),cc:Math.sqrt(chi/(chi+n))};
 if(R===2&&C===2){out.yates=yates;out.pYates=pChi(yates,1);out.fisher=fisher2x2(t[0][0],t[0][1],t[1][0],t[1][1])}return out}
// ---------- تنسيق ----------
export const fx=(x,d=3)=>x==null||!Number.isFinite(x)?'':x.toFixed(d);
export const fnz=(x,d=3)=>fx(x,d).replace(/^(-?)0\./,'$1.');
export const fp=p=>p==null||Number.isNaN(p)?'':p<.001?'<.001':fnz(p,3);
export const apaP=p=>p<.001?'p < .001':'p = '+fnz(p,3);

// ================= المرحلة 5: اختبارات لامعلمية، انحدار، ثبات، اعتدالية =================
const tieSum=a=>{const m=new Map();for(const x of a)m.set(x,(m.get(x)||0)+1);let s=0;for(const t of m.values())s+=t*t*t-t;return s};
export function mannWhitney(a,b){const n1=a.length,n2=b.length,N=n1+n2,r=ranks(a.concat(b));let R1=0;for(let i=0;i<n1;i++)R1+=r[i];const R2=N*(N+1)/2-R1,U1=R1-n1*(n1+1)/2,U2=n1*n2-U1,U=Math.min(U1,U2),T=tieSum(a.concat(b)),sd=Math.sqrt(n1*n2/12*((N+1)-T/(N*(N-1)))),z=sd>0?(U1-n1*n2/2)/sd:NaN;
 return{n1,n2,R1,R2,mr1:R1/n1,mr2:R2/n2,U1,U2,U,z,p:Number.isFinite(z)?pNorm2(z):NaN,r:Math.abs(z)/Math.sqrt(N)}}
export function wilcoxon(x,y){const d=[];let ties=0;for(let i=0;i<x.length;i++){const v=x[i]-y[i];if(v===0)ties++;else d.push(v)}const n=d.length,ab=d.map(Math.abs),r=ranks(ab);let Wp=0,Wn=0,np=0,nn=0;for(let i=0;i<n;i++){if(d[i]>0){Wp+=r[i];np++}else{Wn+=r[i];nn++}}
 const mu=n*(n+1)/4,v=n*(n+1)*(2*n+1)/24-tieSum(ab)/48,sd=Math.sqrt(v),z=sd>0?(Wp-mu)/sd:NaN;return{n,np,nn,ties,Wp,Wn,mrp:np?Wp/np:NaN,mrn:nn?Wn/nn:NaN,z,p:Number.isFinite(z)?pNorm2(z):NaN,r:Math.abs(z)/Math.sqrt(x.length)}}
export function kruskal(groups){const all=[].concat(...groups),N=all.length,r=ranks(all);let off=0,H=0;const mr=[];for(const g of groups){let s=0;for(let i=0;i<g.length;i++)s+=r[off+i];off+=g.length;mr.push(s/g.length);H+=s*s/g.length}
 H=12/(N*(N+1))*H-3*(N+1);const C=1-tieSum(all)/(N*N*N-N);H=C>0?H/C:NaN;const df=groups.length-1;return{N,df,H,p:pChi(H,df),eps2:H/(N-1),mr,n:groups.map(g=>g.length)}}
function invert(M){const n=M.length,A=M.map((r,i)=>r.concat(Array.from({length:n},(_,j)=>+(i===j))));for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;if(Math.abs(A[p][c])<1e-11)return null;[A[c],A[p]]=[A[p],A[c]];const d=A[c][c];for(let j=0;j<2*n;j++)A[c][j]/=d;for(let r=0;r<n;r++)if(r!==c){const f=A[r][c];if(f)for(let j=0;j<2*n;j++)A[r][j]-=f*A[c][j]}}return A.map(r=>r.slice(n))}
export function linreg(X,y){const n=y.length,k=X.length,p=k+1,dfe=n-p;if(dfe<1)throw new Error('df');const cols=[new Array(n).fill(1),...X],XtX=cols.map(a=>cols.map(b=>{let s=0;for(let i=0;i<n;i++)s+=a[i]*b[i];return s})),Xty=cols.map(a=>{let s=0;for(let i=0;i<n;i++)s+=a[i]*y[i];return s}),inv=invert(XtX);if(!inv)throw new Error('collinear');
 const b=inv.map(r=>r.reduce((s,v,j)=>s+v*Xty[j],0)),ym=y.reduce((s,v)=>s+v,0)/n;let sse=0,sst=0,dw1=0,prev=0;const res=[];for(let i=0;i<n;i++){let f=0;for(let j=0;j<p;j++)f+=b[j]*cols[j][i];const e=y[i]-f;res.push(e);sse+=e*e;sst+=(y[i]-ym)**2;if(i)dw1+=(e-prev)**2;prev=e}
 const ssr=sst-sse,mse=sse/dfe,R2=sst>0?ssr/sst:NaN,F=k&&mse>0?(ssr/k)/mse:NaN,tc=tCrit(.05,dfe),sy=Math.sqrt(sst/(n-1)),co=b.map((bj,j)=>{const se=Math.sqrt(mse*inv[j][j]),t=bj/se,sx=j?Math.sqrt(X[j-1].reduce((s,v)=>s+v,0)/n*0+desc(X[j-1]).var):NaN;return{b:bj,se,t,p:pT2(t,dfe),lo:bj-tc*se,hi:bj+tc*se,beta:j?bj*sx/sy:NaN}});
 let vif=null;if(k>=2){const m=X.map((a,i)=>X.map((c,j)=>i===j?1:corr(a,c))),mi=invert(m);if(mi)vif=mi.map((r,i)=>r[i])}
 return{n,k,dfe,R2,adj:1-(1-R2)*(n-1)/dfe,R:Math.sqrt(Math.max(R2,0)),see:Math.sqrt(mse),F,pF:pF(F,k,dfe),ssr,sse,sst,msr:ssr/k,mse,co,vif,dw:sse>0?dw1/sse:NaN,res}}
export function cronbach(items){const k=items.length,n=items[0].length,V=a=>desc(a).var,tot=Array.from({length:n},(_,i)=>items.reduce((s,a)=>s+a[i],0)),vt=V(tot),alpha=k/(k-1)*(1-items.reduce((s,a)=>s+V(a),0)/vt);
 const rs=[],R=items.map((a,i)=>items.map((c,j)=>i===j?1:corr(a,c))),rbar=R.reduce((s,r,i)=>s+r.reduce((q,v,j)=>q+(i===j?0:v),0),0)/(k*(k-1)),std=k*rbar/(1+(k-1)*rbar);
 const det=items.map((a,i)=>{const rest=tot.map((t,q)=>t-a[q]),vr=V(rest),ci=corr(a,rest);const cov=k>2?(k-1)/(k-2)*(1-items.reduce((s,c,j)=>s+(j===i?0:V(c)),0)/vr):NaN;return{r:corr(a,rest),a:cov,mean:desc(a).mean,sd:desc(a).sd}});return{k,n,alpha,std,det,meanR:rbar}}
// معكوس التوزيع الطبيعي (Acklam + خطوة تحسين)
export function qnorm(p){if(p<=0)return-Infinity;if(p>=1)return Infinity;const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];let x;
 if(p<.02425){const q=Math.sqrt(-2*Math.log(p));x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}else if(p>1-.02425){const q=Math.sqrt(-2*Math.log(1-p));x=-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}else{const q=p-.5,r=q*q;x=(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
 const cdf=z=>z>=0?1-pNorm2(z)/2:pNorm2(z)/2,e=cdf(x)-p,u=e*Math.sqrt(2*Math.PI)*Math.exp(x*x/2);return x-u/(1+x*u/2)}
const poly=(c,x)=>c.reduce((s,v,j)=>s+v*x**j,0);
// اختبار شابيرو–ويلك (Royston 1995) للأحجام 3 – 5000
export function shapiroWilk(a){const x=Float64Array.from(a).sort(),n=x.length;if(n<3||n>5000)return{W:NaN,p:NaN,n};const nn2=n>>1,an=n,m=[];for(let i=1;i<=nn2;i++)m.push(qnorm((i-.375)/(an+.25)));
 const A=new Array(nn2);if(n===3)A[0]=Math.SQRT1_2;else{const sm=2*m.reduce((s,v)=>s+v*v,0),ss=Math.sqrt(sm),rsn=1/Math.sqrt(an),a1=poly([0,.221157,-.147981,-2.07119,4.434685,-2.706056],rsn)-m[0]/ss;let i1,fac;
  if(n>5){i1=2;const a2=-m[1]/ss+poly([0,.042981,-.293762,-1.752461,5.682633,-3.582633],rsn);fac=Math.sqrt((sm-2*m[0]*m[0]-2*m[1]*m[1])/(1-2*a1*a1-2*a2*a2));A[1]=a2}else{i1=1;fac=Math.sqrt((sm-2*m[0]*m[0])/(1-2*a1*a1))}
  A[0]=a1;for(let i=i1;i<nn2;i++)A[i]=-m[i]/fac}
 let mean=0;for(const v of x)mean+=v;mean/=n;let ss=0;for(const v of x)ss+=(v-mean)**2;if(!(ss>0))return{W:NaN,p:NaN,n};let num=0;for(let i=0;i<nn2;i++)num+=A[i]*(x[n-1-i]-x[i]);const W=Math.min(num*num/ss,1);
 let p;if(n===3){p=6/Math.PI*(Math.asin(Math.sqrt(W))-Math.asin(Math.sqrt(.75)));p=Math.max(p,0)}else{const y=Math.log(1-W),xx=Math.log(an);let mu,sg,yy=y;
  if(n<=11){const g=-2.273+.459*an;if(y>=g)return{W,p:1e-99,n};yy=-Math.log(g-y);mu=poly([.544,-.39978,.025054,-6.714e-4],an);sg=Math.exp(poly([1.3822,-.77857,.062767,-.0020322],an))}else{mu=poly([-1.5861,-.31082,-.083751,.0038915],xx);sg=Math.exp(poly([-.4803,-.082676,.0030302],xx))}
  const z=(yy-mu)/sg;p=z>0?pNorm2(z)/2:1-pNorm2(z)/2}
 return{W,p,n}}
// ---------- الانحدار اللوجستي الثنائي (IRLS / نيوتن–رافسون) – المرحلة 5 (الجزء 2) ----------
export function logistic(X,y,opt={}){const n=y.length,k=X.length,p=k+1,cols=[new Array(n).fill(1),...X],cut=opt.cut??.5;
 const n1=y.reduce((s,v)=>s+v,0),n0=n-n1;if(n1===0||n0===0)throw new Error('onevalue');if(n<=p)throw new Error('df');
 let b=new Array(p).fill(0);b[0]=Math.log(n1/n0);let inv=null,conv=false,it=0;
 const lin=bb=>{const e=new Array(n);for(let i=0;i<n;i++){let z=0;for(let j=0;j<p;j++)z+=bb[j]*cols[j][i];e[i]=z}return e};
 const prob=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
 const ll=bb=>{const z=lin(bb);let s=0;for(let i=0;i<n;i++){const t=z[i];s+=y[i]?-Math.log1p(Math.exp(-Math.abs(t)))-Math.max(-t,0):-Math.log1p(Math.exp(-Math.abs(t)))-Math.max(t,0)}return s};
 let cur=ll(b);
 for(it=1;it<=100;it++){const z=lin(b),pr=z.map(prob),g=new Array(p).fill(0),H=Array.from({length:p},()=>new Array(p).fill(0));
  for(let i=0;i<n;i++){const w=pr[i]*(1-pr[i]),r=y[i]-pr[i];for(let a=0;a<p;a++){const ca=cols[a][i];g[a]+=ca*r;const wa=w*ca;for(let c=a;c<p;c++)H[a][c]+=wa*cols[c][i]}}
  for(let a=0;a<p;a++)for(let c=0;c<a;c++)H[a][c]=H[c][a];
  inv=invert(H);if(!inv)throw new Error(Math.max(...b.map(Math.abs))>8||pr.some(q=>q<1e-7||q>1-1e-7)?'separation':'collinear');
  let step=inv.map(r=>r.reduce((s,v,j)=>s+v*g[j],0)),t=1,nb,nl;
  for(let h=0;h<30;h++){nb=b.map((v,j)=>v+t*step[j]);nl=ll(nb);if(nl>=cur-1e-12)break;t/=2}
  const d=Math.max(...nb.map((v,j)=>Math.abs(v-b[j])));b=nb;cur=nl;if(Math.max(...b.map(Math.abs))>30)throw new Error('separation');if(d<1e-9){conv=true;break}}
 if(!conv)throw new Error('noconv');
 {const z=lin(b),pr=z.map(prob),H=Array.from({length:p},()=>new Array(p).fill(0));for(let i=0;i<n;i++){const w=pr[i]*(1-pr[i]);for(let a=0;a<p;a++)for(let c=0;c<p;c++)H[a][c]+=w*cols[a][i]*cols[c][i]}inv=invert(H);if(!inv)throw new Error('collinear')}
 const se=b.map((_,j)=>Math.sqrt(inv[j][j]));if(se.some(s=>!Number.isFinite(s))||b.some(v=>Math.abs(v)>25)||se.some(s=>s>1e3))throw new Error('separation');
 const co=b.map((bj,j)=>{const W=(bj/se[j])**2;return{b:bj,se:se[j],wald:W,p:pChi(W,1),or:Math.exp(bj),lo:Math.exp(bj-1.959964*se[j]),hi:Math.exp(bj+1.959964*se[j])}});
 const LL=cur,LL0=n1*Math.log(n1/n)+n0*Math.log(n0/n),m2=-2*LL,m20=-2*LL0,chi=m20-m2,pr=lin(b).map(prob);
 const cs=1-Math.exp((m2-m20)/n),nag=cs/(1-Math.exp(-m20/n)),mcf=1-LL/LL0;
 const cm=[[0,0],[0,0]];for(let i=0;i<n;i++)cm[y[i]][pr[i]>=cut?1:0]++;
 // اختبار Hosmer–Lemeshow (10 مجموعات حسب الاحتمال المتوقع)
 let hl=null;if(n>=20){const ord=pr.map((v,i)=>i).sort((a,c)=>pr[a]-pr[c]),G=Math.min(10,Math.floor(n/5));let x2=0,used=0;for(let g=0;g<G;g++){const a=Math.round(g*n/G),c=Math.round((g+1)*n/G);let o1=0,e1=0,m=c-a;for(let q=a;q<c;q++){o1+=y[ord[q]];e1+=pr[ord[q]]}const o0=m-o1,e0=m-e1;if(e1>0)x2+=(o1-e1)**2/e1;if(e0>0)x2+=(o0-e0)**2/e0;used++}
  if(used>2)hl={chi:x2,df:used-2,p:pChi(x2,used-2),groups:used}}
 return{n,k,n1,n0,co,LL,m2,m20,chi,df:k,p:pChi(chi,k),cs,nag,mcf,cm,acc:(cm[0][0]+cm[1][1])/n,sens:cm[1][1]/n1,spec:cm[0][0]/n0,hl,iter:it,cut,pred:pr}}

// ---- مقارنات Dunn البعدية بعد كروسكال–واليس (تصحيح الارتباطات + بونفروني) ----
export function dunn(groups){const all=[].concat(...groups),N=all.length,r=ranks(all),n=groups.map(g=>g.length),k=groups.length,mr=[];let off=0;
 for(const g of groups){let s=0;for(let i=0;i<g.length;i++)s+=r[off+i];off+=g.length;mr.push(s/g.length)}
 const m=new Map();for(const x of all)m.set(x,(m.get(x)||0)+1);let ts=0;for(const t of m.values())ts+=t*t*t-t;
 const v0=N*(N+1)/12-ts/(12*(N-1)),pairs=k*(k-1)/2,out=[];
 for(let i=0;i<k;i++)for(let j=i+1;j<k;j++){const z=(mr[i]-mr[j])/Math.sqrt(v0*(1/n[i]+1/n[j])),p=pNorm2(z);out.push({i,j,z,p,padj:Math.min(1,p*pairs)})}
 return out}

// ---- فحص بواقي الانحدار: اعتدالية (Shapiro–Wilk)، تجانس التباين (Breusch–Pagan بصيغة Koenker)، قيم شاذة |z|>3 ----
export function residDiag(X,res,see){const n=res.length,k=X.length,sw=shapiroWilk(res);let bp={LM:NaN,df:k,p:NaN};
 try{const q=linreg(X,res.map(e=>e*e)),LM=n*q.R2;bp={LM,df:k,p:pChi(LM,k)}}catch{}
 let maxZ=0,out3=0;for(const e of res){const z=Math.abs(e/see);if(z>maxZ)maxZ=z;if(z>3)out3++}
 return{sw,bp,maxZ,out3,n}}
