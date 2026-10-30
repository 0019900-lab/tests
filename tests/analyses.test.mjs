import fs from 'node:fs';import assert from 'node:assert/strict';
import {replaceAll,mkVar} from '../data.js';import {RUN} from '../analyses.js';
const F=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url)));
const sc=[...F.a,...F.b,...F.c],g=[...F.a.map(()=>'A'),...F.b.map(()=>'B'),...F.c.map(()=>'C')],n=sc.length;
sc[3]=-99;                                     // قيمة مفقودة للمستخدم
const vars=[{...mkVar('score'),decimals:1,missing:'-99'},{...mkVar('grp','String'),values:'A=Control;B=Treat;C=Other'},{...mkVar('sex','String')}];
const sex=sc.map((_,i)=>i%3===0?'M':'F');
replaceAll({name:'t',vars,cols:[sc,g,sex],n},true);
const cell=(b,t,r,c)=>b.tables[t].rows[r][c];
let b=RUN.anova({vars:[0],factor:1,desc:true,welch:true,post:'bonf'});
console.log(b.apa[0]);
// بعد استبعاد المفقود (-99) النتائج لازم تتغير عن fixtures – نتحقق بس إن التنفيذ سليم والـ N صح
assert.equal(cell(b,0,0,2)+cell(b,0,1,2)+cell(b,0,2,2),n-1);
assert.equal(b.tables.at(-1).rows.length,3);       // 3 مقارنات
b=RUN.ttestInd({vars:[0],group:1,g1:'A',g2:'B'});console.log(b.apa[0]);assert.equal(cell(b,0,0,1),'Control');
b=RUN.ttestInd({vars:[0],group:2,g1:'',g2:''});console.log(b.apa[0]);
assert.throws(()=>RUN.ttestInd({vars:[0],group:1,g1:'',g2:''}));      // 3 مجموعات من غير تحديد
b=RUN.crosstabs({row:1,col:2,rowp:true,colp:true,exp:true,totp:false,res:true});console.log(b.apa);assert.equal(b.tables[1].rows.at(-1)[1],n);
b=RUN.frequencies({vars:[0,1],stats:true});assert.equal(b.tables[0].rows[1][1],1);       // missing=1
assert.equal(b.tables[2].rows[0][0],'Control');                                           // value labels
b=RUN.descriptives({vars:[0],variance:true,shape:true,se:true,sum:true});console.log(b.tables[0].head.length,b.tables[0].rows[0].join(' | '));
b=RUN.ttest1({vars:[0],testValue:50});console.log(b.apa[0]);
replaceAll({name:'t',vars:[mkVar('x'),mkVar('y')],cols:[F.x,F.y],n:40},true);
b=RUN.correlate({vars:[0,1],pearson:true,spearman:true});console.log(b.tables[0].rows[0].join(' | '),'| scipy r=',F.pear[0].toFixed(3),'rho=',F.spear[0].toFixed(3));
assert.equal(b.tables[0].rows[0][3],(F.pear[0].toFixed(3)).replace(/^(-?)0\./,'$1.')+(F.pear[1]<.01?'**':F.pear[1]<.05?'*':''));
b=RUN.ttestPair({a:0,b:1});console.log(b.apa);
console.log('ANALYSES OK');
