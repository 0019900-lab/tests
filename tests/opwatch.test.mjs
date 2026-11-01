import {classify} from '../opwatch.js';
let ok=0,bad=0;const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};
const V=n=>({name:n}),a=[1,2],b=[3,4],c=[5,6];
const P={name:'d',vars:[V('x'),V('y')],cols:[a,b],n:2};
t('add',classify(P,{name:'d',vars:[V('x'),V('y'),V('z')],cols:[a,b,c],n:2}).fields.added[0]==='z');
t('cases',classify(P,{name:'d',vars:P.vars,cols:[[1,2,3],[3,4,5]],n:3}).fn==='data.cases');
t('modify',classify(P,{name:'d',vars:P.vars,cols:[a,[9,9]],n:2}).fields.modified.join()==='y');
t('sort',classify(P,{name:'d',vars:P.vars,cols:[a,b],n:2}).title==='Data re-ordered');
t('load',classify(P,{name:'q',vars:[V('k')],cols:[a],n:2}).fn==='data.load');
t('first load',classify({vars:[],cols:[],n:0},P).fn==='data.load');
console.log(`opwatch: ${ok} passed, ${bad} failed`);process.exit(bad?1:0)
