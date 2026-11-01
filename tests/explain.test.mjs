// اختبارات «فسّر نتائجي» للتحاليل الأساسية + جدول Dunn (عربي/إنجليزي)
import assert from 'node:assert/strict';
import {replaceAll,mkVar} from '../data.js';import {RUN} from '../analyses.js';import {explain,explainText} from '../explain.js';
let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};
const y=[5,6,7,5,6,8,9,10,9,11,15,14,16,15,17],g=['A','A','A','A','A','B','B','B','B','B','C','C','C','C','C'],z=[1,3,2,5,4,6,8,7,9,10,12,11,13,15,14],h=['m','f','m','f','m','f','m','f','m','f','m','f','m','f','m'];
replaceAll({name:'t',vars:[mkVar('y','Numeric'),mkVar('g','String'),mkVar('z','Numeric'),mkVar('h','String')],cols:[y,g,z,h],n:15},true);
const clean=e=>{const s=JSON.stringify(e);return!/NaN|undefined|Infinity|\[object/.test(s)};
const cases={frequencies:{vars:[1]},descriptives:{vars:[0]},crosstabs:{row:1,col:3},ttest1:{vars:[0],testValue:5},ttestInd:{vars:[0],group:3,g1:'',g2:''},ttestPair:{a:0,b:2},anova:{vars:[0],factor:1},correlate:{vars:[0,2],pearson:true,spearman:true},kruskal:{vars:[0],factor:1}};
for(const [k,a] of Object.entries(cases)){const b=RUN[k](a);for(const l of ['ar','en']){const e=explain({facts:b.facts},l);t(`${k} ${l} returns`,e&&e.meaning.length>=1);t(`${k} ${l} clean`,clean(e));t(`${k} ${l} text`,explainText({facts:b.facts},l).length>40)}}
t('explain null without facts',explain({},'ar')===null&&explain(null,'ar')===null);
// language: ar text contains Arabic, en text has no Arabic letters
const kb=RUN.anova(cases.anova);t('ar has Arabic',/[\u0600-\u06FF]/.test(explainText({facts:kb.facts},'ar')));t('en has no Arabic',!/[\u0600-\u06FF]/.test(explainText({facts:kb.facts},'en')));
// Dunn
let kw=RUN.kruskal({vars:[0],factor:1});const d=kw.facts.tests[0].dunn;t('dunn in facts (3 groups)',Array.isArray(d)&&d.length===3&&d.every(x=>x.padj>=x.p-1e-12&&x.padj<=1));
let ar=explain({facts:kw.facts},'ar'),en=explain({facts:kw.facts},'en');
t('dunn ar mentions sig pair',/دَن/.test(ar.meaning.join(' '))&&/1 من 3/.test(ar.meaning.join(' '))&&/A.*C/.test(ar.meaning.join(' ')));
t('dunn en mentions sig pair',/Dunn/.test(en.meaning.join(' '))&&/1 of 3/.test(en.meaning.join(' ')));
t('dunn caution replaces "not available"',!/لم تُنفَّذ/.test(ar.caution.join(' '))&&!/not available/.test(en.caution.join(' ')));
// no pair significant
replaceAll({name:'t',vars:[mkVar('y','Numeric'),mkVar('g','String')],cols:[[1,2,3,4,5,6,7,8,9],['A','B','C','A','B','C','A','B','C']],n:9},true);
kw=RUN.kruskal({vars:[0],factor:1});ar=explain({facts:kw.facts},'ar');t('dunn none significant',/لا يوجد زوج دالّ/.test(ar.meaning.join(' ')));
// dunn disabled -> prompt to enable
replaceAll({name:'t',vars:[mkVar('y','Numeric'),mkVar('g','String')],cols:[y,g],n:15},true);
kw=RUN.kruskal({vars:[0],factor:1,dunn:false});t('dunn off -> null',kw.facts.tests[0].dunn===null);ar=explain({facts:kw.facts},'ar');t('dunn off caution suggests enabling',/فعّل/.test(ar.caution.join(' ')));
// two groups: no dunn
replaceAll({name:'t',vars:[mkVar('y','Numeric'),mkVar('g','String')],cols:[[1,2,3,7,8,9],['A','A','A','B','B','B']],n:6},true);
kw=RUN.kruskal({vars:[0],factor:1});t('2 groups -> no dunn',kw.facts.tests[0].dunn===null);
console.log(`explain: ${ok} passed`);
