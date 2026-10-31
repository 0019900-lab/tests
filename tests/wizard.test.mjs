import {recommend,nextQuestion,TESTS} from '../wizard.js';let ok=0,bad=0;const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};
const id=a=>recommend(a)?.id;
t('ind normal',id({goal:'compare',measure:'num',design:'ind',normal:'yes'})==='ttestInd');
t('ind non-normal',id({goal:'compare',measure:'num',design:'ind',normal:'no'})==='mannwhitney');
t('ind ordinal',id({goal:'compare',measure:'ord',design:'ind'})==='mannwhitney');
t('pair normal',id({goal:'compare',measure:'num',design:'pair',normal:'yes'})==='ttestPair');
t('pair non-normal',id({goal:'compare',measure:'num',design:'pair',normal:'no'})==='wilcoxon');
t('multi normal',id({goal:'compare',measure:'num',design:'multi',normal:'yes'})==='anova');
t('multi non-normal',id({goal:'compare',measure:'ord',design:'multi'})==='kruskal');
t('one sample',id({goal:'compare',measure:'num',design:'one',normal:'yes'})==='ttest1');
t('unknown normality asks to check',recommend({goal:'compare',measure:'num',design:'ind',normal:'unk'}).pre==='normality');
t('alt offered',recommend({goal:'compare',measure:'num',design:'ind',normal:'yes'}).alt.id==='mannwhitney');
t('categorical compare',id({goal:'compare',measure:'cat'})==='crosstabs');
t('relate cat',id({goal:'relate',measure:'cat'})==='crosstabs');
t('relate num',id({goal:'relate',measure:'num',normal:'yes'})==='correlate');
t('predict num',id({goal:'predict',measure:'num'})==='regression');
t('predict cat flagged soon',!!recommend({goal:'predict',measure:'cat'}).soon);
t('reliab',id({goal:'reliab'})==='alpha');t('describe',id({goal:'describe',measure:'num'})==='descriptives');
// flow always terminates with a result and no unknown test ids
const goals=['compare','relate','predict','describe','reliab'],ms=['num','ord','cat'],ds=['one','ind','pair','multi'],ns=['yes','no','unk'];let paths=0,fine=true;
for(const g of goals)for(const m of ms)for(const d of ds)for(const n of ns){let a={goal:g,measure:m,design:d,normal:n};const need=nextQuestion({});let a2={};for(let s=0;s<6;s++){const k=nextQuestion(a2);if(!k)break;a2[k]=a[k]}const r=recommend(a2);paths++;if(!r||!TESTS[r.id]||!r.why||!(r.alt?TESTS[r.alt.id]:true))fine=false}
t(`all ${paths} paths give a valid recommendation`,fine);
console.log(`wizard: ${ok} passed, ${bad} failed`);process.exit(bad?1:0);
