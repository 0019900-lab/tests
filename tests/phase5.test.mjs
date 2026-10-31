import * as S from '../stats.js';import fs from 'fs';
const F=JSON.parse(fs.readFileSync(new URL('./fixtures5.json',import.meta.url)));let ok=0,bad=0;
const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))},near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));
{const r=S.mannWhitney(F.mw.a,F.mw.b);t('MW U',near(r.U,F.mw.U));t('MW p',near(r.p,F.mw.p,1e-5))}
{const r=S.wilcoxon(F.wil.x,F.wil.y);t('Wilcoxon p',near(r.p,F.wil.p,1e-5))}
{const r=S.kruskal(F.kw.g);t('KW H',near(r.H,F.kw.H,1e-8));t('KW p',near(r.p,F.kw.p,1e-6))}
{const r=S.linreg([F.reg.x1,F.reg.x2],F.reg.y);F.reg.b.forEach((b,i)=>{t('reg b'+i,near(r.co[i].b,b,1e-7));t('reg se'+i,near(r.co[i].se,F.reg.se[i],1e-7));t('reg p'+i,near(r.co[i].p,F.reg.p[i],1e-6))});t('reg R2',near(r.R2,F.reg.R2,1e-9));t('reg F',near(r.F,F.reg.F,1e-7));t('reg pF',near(r.pF,F.reg.pF,1e-6));t('vif>=1',r.vif.every(v=>v>=1))}
{let e=0;try{S.linreg([F.reg.x1,F.reg.x1.map(v=>2*v)],F.reg.y)}catch(x){e=x.message==='collinear'}t('collinear detected',e)}
{const r=S.cronbach(F.alpha.items);t('alpha',near(r.alpha,F.alpha.alpha,1e-9));t('alpha-if-deleted exists',r.det.every(d=>Number.isFinite(d.a)))}
for(const c of F.sw){const r=S.shapiroWilk(c.x);t(`SW n=${c.x.length} W`,near(r.W,c.W,1e-5));t(`SW n=${c.x.length} p`,near(r.p,c.p,2e-3))}
t('qnorm',near(S.qnorm(.975),1.959963984540054,1e-9)&&near(S.qnorm(.001),-3.090232306167813,1e-9));
console.log(`phase5: ${ok} passed, ${bad} failed`);process.exit(bad?1:0);
