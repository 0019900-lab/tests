// تجهيز البيانات: محلل التعبيرات الآمن، إعادة الترميز، عكس البنود، الترتيب، والتراجع
import assert from 'node:assert/strict';
import {replaceAll,mkVar,store,undo,redo} from '../data.js';import {RUN} from '../analyses.js';
import {compileExpr,computeVar,parseRecode,recodeValue,recodeVars,reverseItems,sortCases,sortOrder} from '../transform.js';
let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};const eq=(n,a,b)=>{assert.deepEqual(a,b,n);ok++};
const load=(cols,names,types)=>replaceAll({name:'t',vars:names.map((m,i)=>mkVar(m,types?.[i]||'Numeric')),cols,n:cols[0].length},true);
const ev=(src,row=0)=>{const M=new Map([['a',store.cols[0]],['b',store.cols[1]],['s',store.cols[2]]]),g=lc=>M.get(lc)||null;return compileExpr(src,g,store.n).fn(row)};
load([[1,2,3,null,10],[4,5,6,7,0],['x','y','x','y',null]],['a','b','s'],['Numeric','Numeric','String']);
// حساب
t('precedence',ev('2+3*4')===14);t('power right',ev('2^3^2')===512);t('unary',ev('-2^2')===-4);t('parens',ev('(2+3)*4')===20);
t('vars',ev('a+b',0)===5);t('missing propagates',ev('a+b',3)===null);t('div0',ev('a/b',4)===null);t('SUM skips missing',ev('SUM(a,b)',3)===7);t('MEAN',ev('MEAN(a,b)',0)===2.5);t('SD',Math.abs(ev('SD(a,b)',0)-2.1213203435596424)<1e-12);
t('IF',ev('IF(a>1,100,200)',0)===200&&ev('IF(a>1,100,200)',1)===100);t('AND/OR/NOT',ev('a>0 AND b>4',1)===1&&ev('NOT (a>0) OR b=0',4)===1);
t('string compare',ev("s = 'x'",0)===1&&ev("s <> 'x'",1)===1);t('concat',ev("CONCAT(s,'-',a)",0)==='x-1');t('ROUND',ev('ROUND(2.5)')===3&&ev('ROUND(-2.5)')===-3&&ev('ROUND(3.14159,2)')===3.14);t('MOD',ev('MOD(-1,3)')===2);t('MISSING',ev('MISSING(a)',3)===1);t('SQRT neg → missing',ev('SQRT(-1)')===null);
t('CMEAN',Math.abs(ev('CMEAN(b)',0)-4.4)<1e-12&&ev('CSUM(a)',0)===16&&ev('CMIN(a)')===1&&ev('CMAX(a)')===10);t('Z',Math.abs(ev('Z(b)',1)-(5-4.4)/Math.sqrt(((.4*.4)+(.6*.6)+(1.6*1.6)+(2.6*2.6)+(4.4*4.4))/4))<1e-12&&ev('Z(a)',3)===null);t('case-insens names',ev('A+B',0)===5);
for(const [src,re] of [['a +',/غير مكتمل|incomplete/],['foo+1',/غير موجود|does not exist/],['BAR(1)',/غير معروفة|Unknown function/],['(1+2',/متوقَّع|Expected/],['1 2',/زائد|Extra/],['a $ b',/غير مفهوم|Unexpected/],['IF(1,2)',/ثلاث|three/]])assert.throws(()=>ev(src),re),ok++;
// أمان: لا تنفيذ شيفرة
for(const evil of ['process.exit()','constructor','__proto__','this','(function(){})()','a.constructor'])assert.throws(()=>ev(evil)),ok++;
// تطبيع z على بيانات كاملة: المتوسط 0 والانحراف 1
load([[2,4,4,4,5,5,7,9]],['v']);computeVar({target:'zv',expr:'Z(v)',cond:''});{const z=store.cols[1],m=z.reduce((s,x)=>s+x,0)/8,sd=Math.sqrt(z.reduce((s,x)=>s+(x-m)**2,0)/7);t('z mean 0',Math.abs(m)<1e-12&&Math.abs(sd-1)<1e-12)}
load([[1,2,3,null,10],[4,5,6,7,0],['x','y','x','y',null]],['a','b','s'],['Numeric','Numeric','String']);
// computeVar + تراجع
let r=computeVar({target:'c',expr:'a*2+b',cond:''});t('new var created',r.created&&store.vars.length===4&&store.vars[3].name==='c');eq('values',store.cols[3],[6,9,12,null,20]);t('int decimals',store.vars[3].decimals===0);
undo();t('undo removes var',store.vars.length===3);redo();t('redo restores',store.vars.length===4&&store.cols[3][4]===20);
r=computeVar({target:'c',expr:'-1',cond:'a>=3'});t('cond update',!r.created&&store.cols[3][2]===-1&&store.cols[3][0]===6);
r=computeVar({target:'lab',expr:"IF(a>2,'hi','lo')",cond:''});t('string result',store.vars[store.vars.length-1].type==='String'&&store.cols[store.vars.length-1][2]==='hi');
assert.throws(()=>computeVar({target:'1bad',expr:'1'}),/غير صالح|Invalid/);ok++;assert.throws(()=>computeVar({target:'z',expr:'a/0'}),/مفقودة|missing/);ok++;
// ترميز
const m=parseRecode("1 2 = 1 ; 3 thru 5 = 2 ; lo thru 0 = 9 ; 'x' = 'ex' ; missing = 0 ; else = copy");
t('recode value',recodeValue(m,2,false)===1&&recodeValue(m,4,false)===2&&recodeValue(m,-3,false)===9&&recodeValue(m,'x',false)==='ex'&&recodeValue(m,null,false)===0&&recodeValue(m,99,false)===99);
t('no else → new var missing, same var keeps',recodeValue(parseRecode('1=5'),7,false)===null&&recodeValue(parseRecode('1=5'),7,true)===7);
for(const b of ['abc','=1','1=','5 thru 1 = 2',''])assert.throws(()=>parseRecode(b)),ok++;
load([[1,2,3,4,5,null],[5,4,3,2,1,3]],['q1','q2']);
let d=recodeVars({vars:[0],into:'new',suffix:'_g',map:'1 thru 2 = 1 ; 3 thru 5 = 2'});eq('recode new',store.cols[2],[1,1,2,2,2,null]);t('new name',d[0]==='q1_g'&&store.vars.length===3);
d=recodeVars({vars:[0],into:'same',map:"1 thru 3 = 'low' ; else = 'high'"});t('same var → string',store.vars[0].type==='String'&&store.cols[0][0]==='low'&&store.cols[0][4]==='high');
// عكس البنود + تكامل مع ألفا
load([[1,2,3,4,5,1,2],[5,4,3,2,1,5,4]],['q1','q2']);let rv=reverseItems({vars:[1],min:1,max:5,suffix:'_r'});eq('reverse',store.cols[2],[1,2,3,4,5,1,2]);t('reverse auto',reverseItems({vars:[0],min:null,max:null,suffix:'_r'}).lo===1);
load([[1,2,3,4,5,1,2,3],[5,4,3,2,1,5,4,3],[2,2,4,4,5,1,3,3]],['i1','i2','i3']);const a0=RUN.alpha({vars:[0,1,2]}).facts.alpha;reverseItems({vars:[1],min:1,max:5});const a1=RUN.alpha({vars:[0,3,2]}).facts.alpha;t('alpha improves after reversing',a1>a0&&a1>.8);
// ترتيب
load([[3,1,2,null,1],['c','a','b','z','a'],[10,20,30,40,50]],['n','s','id'],['Numeric','String','Numeric']);
sortCases({by:[0],desc:false});eq('asc nulls last',store.cols[0],[1,1,2,3,null]);eq('stable ids',store.cols[2],[20,50,30,10,40]);undo();eq('undo sort',store.cols[2],[10,20,30,40,50]);
sortCases({by:[0],desc:true});eq('desc nulls last',store.cols[0],[3,2,1,1,null]);undo();
sortCases({by:[1,0],desc:false});eq('multi-key',store.cols[1],['a','a','b','c','z']);
eq('sortOrder',sortOrder([2,1,3],false,true),[1,0,2]);
console.log(`transform: ${ok} checks passed`);
