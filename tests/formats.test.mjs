// أنواع المتغيرات على طريقة SPSS: عرض/إدخال/تحويل/تراجع
import assert from 'node:assert/strict';import {store,replaceAll,mkVar,show,commit,setVar,undo,redo,formatNum,parseByFmt,parseDate,fmtDate,FORMATS,toCSV} from '../data.js';
let ok=0;const t=(n,c)=>{assert.ok(c,n);ok++};
const V=(o)=>({...mkVar('x'),...o});
t('12 formats like SPSS',FORMATS.length===12&&FORMATS[0]==='Numeric'&&FORMATS.includes('Restricted Number'));
t('comma',formatNum(1234567.891,V({fmt:'Comma',decimals:2}))==='1,234,567.89');t('comma negative',formatNum(-1234.5,V({fmt:'Comma',decimals:1}))==='-1,234.5');
t('dot',formatNum(1234567.891,V({fmt:'Dot',decimals:2}))==='1.234.567,89');
t('scientific',formatNum(12345.678,V({fmt:'Scientific notation',decimals:2}))==='1.23E+04'&&formatNum(0.00123,V({fmt:'Scientific notation',decimals:1}))==='1.2E-03');
t('dollar',formatNum(1234.5,V({fmt:'Dollar',decimals:2}))==='$1,234.50'&&formatNum(-5,V({fmt:'Dollar',decimals:0}))==='-$5');
t('currency',formatNum(1500,V({fmt:'Custom currency',decimals:0,cur:'EGP'}))==='EGP 1,500');
t('restricted pads zeros',formatNum(42,V({fmt:'Restricted Number',width:6,decimals:0}))==='000042');
t('plain numeric unchanged',formatNum(3.14159,V({decimals:3}))==='3.142');
// dates
const d=parseDate('2024-02-29');t('leap day',fmtDate(d,'Date yyyy-mm-dd')==='2024-02-29');t('invalid date',Number.isNaN(parseDate('2023-02-29')));
t('dd/mm vs mm/dd',parseDate('03/04/2020','Date dd/mm/yyyy')===parseDate('2020-04-03')&&parseDate('03/04/2020','Date mm/dd/yyyy')===parseDate('2020-03-04'));
t('month name',fmtDate(parseDate('5 Mar 2021'),'Date dd-mmm-yyyy')==='05-Mar-2021');t('arabic digits',parseDate('٢٠٢٤-٠١-٠٢')===parseDate('2024-01-02'));t('epoch',parseDate('1970-01-01')===0&&fmtDate(0,'Date dd/mm/yyyy')==='01/01/1970');
// parsing by format
t('parse comma',parseByFmt('1,234.5',V({fmt:'Comma'}))===1234.5);t('parse dot',parseByFmt('1.234,5',V({fmt:'Dot'}))===1234.5&&parseByFmt('12.5',V({fmt:'Dot'}))===12.5);
t('parse dollar',parseByFmt('$1,200',V({fmt:'Dollar'}))===1200&&parseByFmt('-$3',V({fmt:'Dollar'}))===-3);t('parse currency',parseByFmt('EGP 99',V({fmt:'Custom currency',cur:'EGP'}))===99);
t('restricted rejects negatives/decimals',Number.isNaN(parseByFmt('-3',V({fmt:'Restricted Number'})))&&Number.isNaN(parseByFmt('2.5',V({fmt:'Restricted Number'})))&&parseByFmt('007',V({fmt:'Restricted Number'}))===7);
// store integration: type change converts, shows, undoes
replaceAll({name:'t',vars:[{...mkVar('d','String')},{...mkVar('n','Numeric')}],cols:[['2024-01-05','bad','2024-12-31'],[1500.5,2,null]],n:3},true);
t('string→date converts',setVar(0,'type','Date dd/mm/yyyy')===null&&store.vars[0].type==='Numeric'&&show(0,0)==='05/01/2024'&&show(2,0)==='31/12/2024'&&show(1,0)==='');
t('date defaults',store.vars[0].decimals===0&&store.vars[0].align==='Right');
undo();t('undo restores strings',store.vars[0].type==='String'&&store.cols[0][1]==='bad');redo();t('redo',store.vars[0].fmt==='Date dd/mm/yyyy');
t('numeric→comma display only',setVar(1,'type','Comma')===null&&store.cols[1][0]===1500.5&&show(0,1)==='1,500.50');
t('numeric→string uses display',setVar(1,'type','String')===null&&store.cols[1][0]==='1,500.50');
t('unknown type rejected',typeof setVar(1,'type','Nope')==='string');
// typing into formatted columns
setVar(1,'type','Dollar');commit([{r:3,c:1,v:'$2,000'}]);t('commit parses dollar',store.cols[1][3]===2000&&show(3,1)==='$2,000.00');
t('csv exports ISO dates',toCSV().split('\n')[1].startsWith('2024-01-05'));
// new fields
t('columns/align validated',typeof setVar(0,'columns','0')==='string'&&setVar(0,'columns','12')===null&&store.vars[0].columns===12&&typeof setVar(0,'align','Up')==='string'&&setVar(0,'align','Center')===null);
t('old projects still work (no fmt field)',formatNum(2.5,{type:'Numeric',decimals:1})==='2.5');
console.log(`formats: ${ok} passed`);
