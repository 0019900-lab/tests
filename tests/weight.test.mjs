// ترجيح الحالات: التحليل المرجَّح ≡ التحليل على بيانات مكرَّرة فعلياً
import assert from 'node:assert/strict';import {store,replaceAll,mkVar} from '../data.js';
import {RUN,withWeight,setWeight,getWeight,weightIndex,setFilter,getFilter} from '../analyses.js';
let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};
const y=[3,5,8,2,9,4,7,6],g=['A','A','A','A','B','B','B','B'],w=[2,1,3,4,2,2,1,3];
const load=(cols)=>replaceAll({name:'t',vars:[mkVar('y','Numeric'),mkVar('g','String'),mkVar('w','Numeric')].slice(0,cols.length),cols,n:cols[0].length},true);
const rep=(a)=>a.flatMap((x,i)=>Array(w[i]).fill(x));
// مرجع: بيانات مكرَّرة
load([rep(y),rep(g)]);const ref={d:RUN.descriptives({vars:[0]}),t:RUN.ttestInd({vars:[0],group:1,g1:'',g2:''}),f:RUN.frequencies({vars:[1]}),k:RUN.kruskal({vars:[0],factor:1})};
// مرجَّح
load([y,g,w]);setWeight({v:2,name:'w'});t('getWeight',getWeight().name==='w');
const same=(fn)=>{const a=withWeight(fn),b=JSON.stringify(a.tables);return b};
t('descriptives equal',same(()=>RUN.descriptives({vars:[0]}))===JSON.stringify(ref.d.tables));
t('t-test equal',same(()=>RUN.ttestInd({vars:[0],group:1,g1:'',g2:''}))===JSON.stringify(ref.t.tables));
t('frequencies equal',same(()=>RUN.frequencies({vars:[1]}))===JSON.stringify(ref.f.tables));
t('kruskal equal',withWeight(()=>RUN.kruskal({vars:[0],factor:1})).facts.tests[0].H===ref.k.facts.tests[0].H);
t('N = sum of weights',withWeight(()=>RUN.descriptives({vars:[0]})).facts.vars[0].n===18);
// الاستعادة
t('store restored',store.n===8&&store.cols.length===3&&store.cols[0].length===8);
assert.throws(()=>withWeight(()=>{throw new Error('x')}));ok++;t('restored after throw',store.n===8&&store.cols[0].length===8);
// مرشّح + ترجيح: الحالات المستبعدة لا تدخل
setFilter({mask:[true,true,true,true,false,false,false,false],n:4,desc:'t'},true);
const fa=withWeight(()=>RUN.descriptives({vars:[0]}));t('filter inside weight',fa.facts.vars[0].n===10);t('filter restored',getFilter()&&getFilter().n===4);setFilter(null,true);
// أوزان غير صالحة
const wi=weightIndex(2);t('weightIndex length',wi.idx.length===18&&wi.rounded===0&&wi.dropped===0);
load([y,g,[2,0,-1,null,1.6,2,1,3]]);setWeight({v:2,name:'w'});const w2=weightIndex(2);t('drop zero/neg/missing',w2.dropped===3);t('rounding',w2.rounded===1&&w2.idx.filter(r=>r===4).length===2);
load([y,g,[0,0,0,0,0,0,0,0]]);setWeight({v:2,name:'w'});assert.throws(()=>weightIndex(2));ok++;
// إلغاء + تغيّر اسم المتغير
load([y,g,w]);setWeight({v:2,name:'w'});store.vars[2].name='w2';t('stale weight ignored',getWeight()===null);store.vars[2].name='w';setWeight(null);t('off',getWeight()===null&&withWeight(()=>5)===5);
console.log(`weight: ${ok} passed`);
