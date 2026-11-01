import {buildReportItems} from '../reportbuilder.js';import {buildDocx} from '../docx.js';import {docHTML} from '../report.js';
let ok=0,bad=0;const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};
const items=[{type:'text',text:'note'},{type:'result',title:'T',tables:[{cap:'c',head:['a'],rows:[['1']]}],collapsed:true},{type:'chart',title:'H',kind:'hist',spec:{},png:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='}];
const log=[{t:0,fn:'ttest',title:'T',fields:{vars:['x']},opts:{}}];
let r=buildReportItems(items,log,{lang:'en',title:'My report',author:'Dalia',intro:'Hi',appendLog:true});
t('head',r[0].h&&r[0].text==='My report'&&r[1].text.startsWith('Dalia'));t('intro',r[2].text==='Hi');
t('uncollapsed',r.find(x=>x.type==='result').collapsed===false);t('appendix',r.at(-2).h&&r.at(-1).text.includes('ttest(vars=[x])'));
t('tables only',!buildReportItems(items,[],{kinds:'results'}).some(x=>x.type==='chart'));
t('charts only',!buildReportItems(items,[],{kinds:'charts'}).some(x=>x.type==='result'));
let threw=false;try{buildReportItems([{type:'text',text:'x'}],[],{})}catch(e){threw=true}t('empty throws',threw);
t('default title ar',buildReportItems(items,[],{}) [0].text.includes('تقرير'));
t('docx builds',buildDocx(r,{lang:'en'})[0]===0x50);t('html h2',docHTML(r,{lang:'en'}).includes('<h2 class="rt">My report</h2>'));
const it2=[{id:1,type:'result',title:'A',tables:[]},{id:2,type:'result',title:'B',tables:[]},{id:3,type:'result',title:'C',tables:[]}];
const pk=buildReportItems(it2,[],{ids:[3,1]}).filter(x=>x.type==='result').map(x=>x.title).join('');t('pick+order',pk==='CA');
console.log(`reportbuilder: ${ok} passed, ${bad} failed`);process.exit(bad?1:0)
