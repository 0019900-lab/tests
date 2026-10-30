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
