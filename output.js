// StatLab – عارض المخرجات (المرحلة 3): جداول APA، ملاحظات، فهرس، تصدير HTML / Word / PDF / Markdown / Excel
import {T,lang,isolateLatin} from './i18n.js';
import {ic} from './icons.js';
import {buildDocx} from './docx.js';
import {toMarkdown as logMD,getLog} from './oplog.js';import {buildReportItems} from './reportbuilder.js';import {dialog} from './dialog.js';import {pickItems} from './reportpick.js';
import {esc,tableHTML,figHTML,explainHTML,itemsHTML,docHTML,wordHTML,toMarkdown,toTSV,sheetsAOA} from './report.js';
import {explain} from './explain.js';import {chartSVG} from './charts.js';
const $=s=>document.querySelector(s),say=t=>{$('#status').textContent=t};
let items=[],uid=1,apa=globalThis.localStorage?.apa!=='0';
const opts=()=>({apa,lang:lang()});
export const getItems=()=>items.map(({id,...r})=>r);
export const setItems=a=>{items=(a||[]).map(x=>({...x,id:uid++}));render()};
export const count=()=>items.length;
export function addBlock(title,tables,apaLines,facts){items.push({id:uid++,type:'result',title,tables,apa:apaLines,facts,time:Date.now()});render();
 const b=$('#outputBody');b.lastElementChild&&b.lastElementChild.scrollIntoView({behavior:'smooth',block:'start'});
 const p=$('#outputPane');if(!paneOpen())setPane(true)}
export function addChart(title,kind,spec,cap){items.push({id:uid++,type:'chart',kind,spec,title,cap,time:Date.now()});render();
 const b=$('#outputBody');b.lastElementChild&&b.lastElementChild.scrollIntoView({behavior:'smooth',block:'start'});const p=$('#outputPane');if(!paneOpen())setPane(true)}
// «فسّر نتائجي» على آخر نتيجة أو رسم يمكن شرحه
export function explainLast(){const it=[...items].reverse().find(x=>explain(x,'en'));if(!it){say(T('نفّذ تحليلاً أو ارسم مخططاً أولاً ثم اطلب الشرح','Run an analysis or draw a chart first, then ask for the explanation'));return}
 it.explain=true;it.collapsed=false;render();const s=$(`#outputBody [data-id="${it.id}"] .xpl`);s&&s.scrollIntoView({behavior:'smooth',block:'center'});s&&(s.classList.add('flash'),setTimeout(()=>s.classList.remove('flash'),1400));say(T('تم شرح آخر نتيجة','Explained the latest result'))}
export function addText(){const s=prompt(T('اكتب الملاحظة التي تريد إضافتها إلى المخرجات:','Write the note to add to the output:'));if(s&&s.trim()){items.push({id:uid++,type:'text',text:s.trim()});render()}}
export function clearOutput(){if(items.length&&!confirm(T('هل تريد مسح كل المخرجات؟','Clear all output?')))return;items=[];render()}
function tbCount(i){return items.slice(0,i).reduce((n,x)=>n+(x.type==='result'?x.tables.length:0),0)}
function render(){const b=$('#outputBody'),o=opts();
 if(!items.length){b.className='empty';b.innerHTML=`<div class="emp">${ic('output',34)}<b>${T('لا توجد نتائج بعد','No results yet')}</b><span>${T('نفّذ أي تحليل من قائمة «تحليل» وستظهر نتيجته هنا بتنسيق APA.','Run any analysis from the Analyze menu and its APA-style result appears here.')}</span><kbd>Ctrl+K</kbd></div>`;outline();return}
 b.className='';let h='',n=0,fg=0;
 items.forEach(it=>{
  if(it.type==='chart'){h+=`<section class="blk cht${it.collapsed?' col':''}" data-id="${it.id}"><div class="bh"><button class="tg" data-act="toggle" title="${T('طيّ / توسيع','Collapse / expand')}">${ic(it.collapsed?'chevR':'down',15)}</button><h4 data-act="rename" title="${T('انقر مرتين لإعادة التسمية','Double-click to rename')}">${esc(it.title)}</h4><span class="tc">${T('رسم','Figure')}</span>${xbtn(it)}${ctl(it)}</div>${it.collapsed?'':figHTML(it,fg+1,o)+(it.explain?explainHTML(it,o):'')}</section>`;fg++;return}
  if(it.type==='text'){h+=`<section class="blk txt" data-id="${it.id}"><div class="bh"><span class="bt">${ic('note',15)} ${T('ملاحظة','Note')}</span>${ctl(it)}</div><p>${esc(it.text).replace(/\n/g,'<br>')}</p></section>`;return}
  h+=`<section class="blk${it.collapsed?' col':''}" data-id="${it.id}"><div class="bh"><button class="tg" data-act="toggle" title="${T('طيّ / توسيع','Collapse / expand')}">${ic(it.collapsed?'chevR':'down',15)}</button><h4 data-act="rename" title="${T('انقر مرتين لإعادة التسمية','Double-click to rename')}">${esc(it.title)}</h4><span class="tc">${it.tables.length} ${T('جدول','tables')}</span>${xbtn(it)}${ctl(it)}</div>`;
  if(!it.collapsed){h+=it.tables.map(t=>tableHTML(t,++n,o)).join('');if(it.apa&&it.apa.length)h+=`<div class="apa"><div class="ah"><b>APA</b><button class="cp" data-act="copyapa" title="${T('نسخ سطر APA','Copy APA line')}">${ic('copy',14)}</button></div>${[].concat(it.apa).map(esc).join('<br>')}</div>`;if(it.explain)h+=explainHTML(it,o)}
  else n+=it.tables.length;
  h+='</section>'});
 b.innerHTML=h;b.classList.toggle('apa-on',apa);b.querySelectorAll('.cp').forEach(x=>{if(!x.querySelector('svg'))x.innerHTML=ic('copy',14)});isolateLatin(b);outline()}
const xbtn=it=>explain(it,'en')?`<button class="xb${it.explain?' on':''}" data-act="explain" title="${T('اشرح هذه النتيجة بلغة بسيطة','Explain this result in plain language')}">${ic('sparkle',14)}<span>${T('فسّر نتائجي','Explain')}</span></button>`:'';
const ctl=it=>`<span class="ctl"><button data-act="up" title="${T('للأعلى','Move up')}">${ic('up',14)}</button><button data-act="down" title="${T('للأسفل','Move down')}">${ic('down',14)}</button><button data-act="del" title="${T('حذف','Delete')}">${ic('trash',14)}</button></span>`;
function outline(){const o=$('#outline');if(!o)return;
 o.innerHTML=`<div class="ol-h">${T('الفهرس','Outline')}</div>`+(items.length?items.map(it=>`<button data-go="${it.id}">${ic(it.type==='text'?'note':it.type==='chart'?'chart':'table',14)}<span>${esc(it.type==='text'?it.text.slice(0,40):it.title)}</span></button>`).join(''):`<div class="ol-e">—</div>`)}
async function loadXlsx(){if(!window.XLSX)await new Promise(ok=>{const s=document.createElement('script');s.src='vendor/xlsx.full.min.js';s.onload=ok;s.onerror=ok;document.head.append(s)});return window.XLSX}
function dl(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
// Word لا يعرض SVG داخل HTML، فنحوّل كل رسم إلى صورة PNG مضمّنة (ملف docx الحقيقي في المرحلة 6)
const png=svg=>new Promise(ok=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=1280;c.height=800;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,1280,800);g.drawImage(im,0,0,1280,800);ok(c.toDataURL('image/png'))};im.onerror=()=>ok(null);im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
const need=()=>items.length?true:(say(T('لا توجد مخرجات للتصدير','Nothing to export')),false);
const stamp=()=>new Date().toISOString().slice(0,10);
export const EXPORT={
 html(){if(need()){dl(`Smart-Analysis-output-${stamp()}.html`,docHTML(items,opts()),'text/html;charset=utf-8');say(T('تم تصدير HTML','Exported HTML'))}},
 async word(){if(!need())return;const it=await Promise.all(items.map(async x=>x.type==='chart'?{...x,png:await png(chartSVG(x.kind,x.spec,{lang:lang(),ink:'#1b2230'}))}:x));
  dl(`Smart-Analysis-output-${stamp()}.docx`,buildDocx(it,opts()),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');say(T('تم تصدير ملف Word (.docx)','Exported Word (.docx)'))},
 pdf(){if(!need())return;const f=document.createElement('iframe');f.style.cssText='position:fixed;width:0;height:0;border:0';document.body.append(f);
  f.srcdoc=docHTML(items,opts());f.onload=()=>{f.contentWindow.focus();f.contentWindow.print();setTimeout(()=>f.remove(),2000)};say(T('اختر «حفظ بصيغة PDF» من نافذة الطباعة','Choose "Save as PDF" in the print dialog'))},
 report(){if(!need())return;pickItems(items,ids=>EXPORT.report2(ids))},
 report2(ids){
  dialog('rp',{title:['منشئ التقارير','Report builder'],go:['إنشاء التقرير','Create report'],fields:[],options:[
   {key:'title',type:'text',label:['عنوان التقرير','Report title'],def:''},{key:'author',type:'text',label:['اسم المؤلف','Author'],def:''},{key:'intro',type:'text',label:['مقدمة قصيرة (اختياري)','Short introduction (optional)'],def:''},
   {key:'kinds',type:'sel',label:['المحتوى','Content'],def:'all',opts:[['all',['كل المخرجات','Everything']],['results',['الجداول فقط','Tables only']],['charts',['الرسوم فقط','Charts only']]]},
   {key:'format',type:'sel',label:['الصيغة','Format'],def:'docx',opts:[['docx',['Word (.docx)','Word (.docx)']],['html',['HTML','HTML']]]},
   {key:'explain',type:'check',label:['إرفاق «فسّر نتائجي»','Include “Explain my results”'],def:false},{key:'appendLog',type:'check',label:['ملحق سجل العمليات','Append operations log'],def:true}],
   need:()=>''},
  v=>{const list=buildReportItems(items,getLog(),{...v,ids,lang:lang()});
   (async()=>{if(v.format==='html')dl(`Smart-Analysis-report-${stamp()}.html`,docHTML(list,opts()),'text/html;charset=utf-8');
    else{const it=await Promise.all(list.map(async x=>x.type==='chart'?{...x,png:await png(chartSVG(x.kind,x.spec,{lang:lang(),ink:'#1b2230'}))}:x));dl(`Smart-Analysis-report-${stamp()}.docx`,buildDocx(it,opts()),'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    say(T('تم إنشاء التقرير','Report created'))})().catch(e=>say(e.message))})},
 log(){dl(`Smart-Analysis-log-${stamp()}.md`,'\ufeff'+logMD({lang:lang()}),'text/markdown;charset=utf-8');say(T('تم تصدير سجل العمليات','Exported operations log'))},
 md(){if(need()){dl(`Smart-Analysis-output-${stamp()}.md`,toMarkdown(items,opts()),'text/markdown;charset=utf-8');say(T('تم تصدير Markdown','Exported Markdown'))}},
 async xlsx(){if(!need())return;const X=await loadXlsx();if(!X)return say(T('مكتبة Excel غير متاحة (vendor/xlsx.full.min.js)','Excel library missing (vendor/xlsx.full.min.js)'));
  const sh=sheetsAOA(items);if(!sh.length)return say(T('لا توجد جداول','No tables'));const wb=X.utils.book_new();sh.forEach(s=>X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(s.aoa),s.name));
  X.writeFile(wb,`Smart-Analysis-tables-${stamp()}.xlsx`);say(T(`تم تصدير ${sh.length} جدولاً إلى Excel`,`Exported ${sh.length} tables to Excel`))},
 async copyAll(){if(!need())return;const html=itemsHTML(items,opts());
  try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([`<style>${'table{border-collapse:collapse}th,td{padding:3px 10px}'}</style>${html}`],{type:'text/html'}),'text/plain':new Blob([toMarkdown(items,opts())],{type:'text/plain'})})]);say(T('تم نسخ كل المخرجات (الصقها في Word)','Copied all output (paste into Word)'))}
  catch{say(T('منع المتصفح عملية النسخ','Clipboard blocked by browser'))}}};
// ---- إظهار/إخفاء لوحة المخرجات بانزلاق سلس (الحالة تُحفظ) ----
export const paneOpen=()=>!$('#outputPane').classList.contains('collapsed');
function tabLabel(){const t=$('#outTab');if(!t)return;const open=paneOpen();t.innerHTML=ic('chevR',18)+`<span class="otl">${T('المخرجات','Output')}</span>`;t.title=open?T('إخفاء المخرجات (Alt+O)','Hide output (Alt+O)'):T('إظهار المخرجات (Alt+O)','Show output (Alt+O)');t.setAttribute('aria-label',t.title)}
export function setPane(open){const p=$('#outputPane'),t=$('#outTab');p.classList.toggle('collapsed',!open);t.classList.toggle('closed',!open);t.setAttribute('aria-expanded',String(open));p.inert=!open;try{localStorage.outOpen=open?'1':'0'}catch{}tabLabel()}
export function initOutput(){const pane=$('#outputPane');
 pane.innerHTML=`<div class="oh"><h3></h3><div class="otb"></div></div><div class="ob"><nav id="outline"></nav><div id="outputBody" class="empty"></div></div>`;
 const tb=pane.querySelector('.otb');
 const tab=$('#outTab');tab.onclick=()=>setPane(!paneOpen());pane.addEventListener('transitionend',e=>{if(e.target===pane&&e.propertyName==='width')dispatchEvent(new Event('resize'))});
 pane.classList.add('nt');setPane(localStorage.outOpen!=='0');requestAnimationFrame(()=>requestAnimationFrame(()=>pane.classList.remove('nt')));
 const B=(i,k,f,cls='')=>{const b=document.createElement('button');b.className=cls;b.dataset.k=k;b.innerHTML=ic(i,17);b.onclick=f;tb.append(b);return b};
 B('find','find',()=>document.dispatchEvent(new CustomEvent('statlab:find',{detail:'output'})));
 B('text','addText',addText);
 B('collapse','colAll',()=>{const all=items.every(i=>i.type!=='result'||i.collapsed);items.forEach(i=>{if(i.type==='result')i.collapsed=!all});render()});
 const st=B('table','style',()=>{apa=!apa;localStorage.apa=apa?'1':'0';render();lab()},'txtb');
 const ex=B('export','export',e=>{e.stopPropagation();menu.classList.toggle('open')});
 const menu=document.createElement('div');menu.className='xmenu';tb.append(menu);
 const XM=[['html','html','HTML'],['word','word','Word (.docx)'],['pdf','pdf','PDF'],['md','md','Markdown'],['log','md','Operations log (.md)'],['report','word','Report builder…'],['xlsx','excel','Excel (.xlsx)'],['copyAll','copy','']];
 menu.onclick=e=>{const b=e.target.closest('[data-x]');if(b){menu.classList.remove('open');EXPORT[b.dataset.x]()}};
 document.addEventListener('click',()=>menu.classList.remove('open'));
 B('trash','clear',clearOutput);
 B('expand','wide',()=>{pane.classList.toggle('wide');lab()});
 function lab(){const L={find:T('بحث في المخرجات (Ctrl+F)','Find in output (Ctrl+F)'),addText:T('إضافة ملاحظة','Add note'),colAll:T('طيّ / توسيع الكل','Collapse / expand all'),style:apa?T('نمط الجداول: APA (انقر للنمط العصري)','Table style: APA (click for modern)'):T('نمط الجداول: عصري (انقر للعودة إلى APA)','Table style: Modern (click for APA)'),export:T('تصدير','Export'),clear:T('مسح المخرجات','Clear output'),wide:pane.classList.contains('wide')?T('تصغير','Shrink'):T('تكبير','Expand')};
  tb.querySelectorAll('[data-k]').forEach(b=>{b.title=L[b.dataset.k];b.classList.toggle('on',b.dataset.k==='style'&&apa)});
  st.innerHTML=ic('table',17)+`<span>${apa?'APA':T('عصري','Modern')}</span>`;tb.querySelector('[data-k=wide]').innerHTML=ic(pane.classList.contains('wide')?'shrink':'expand',17);
  pane.querySelector('h3').innerHTML=`${ic('output',18)} ${T('المخرجات','Output')}`;
  menu.innerHTML=XM.map(([k,i,l])=>`<button data-x="${k}">${ic(i,16)}<span>${l||T('نسخ الكل (للصق في Word)','Copy all (paste in Word)')}</span></button>`).join('');
  $('#outputBody').classList.toggle('apa-on',apa)}
 pane.relang=()=>{lab();tabLabel();render()};lab();render();
 pane.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){const s=pane.querySelector(`[data-id="${g.dataset.go}"]`);s&&s.scrollIntoView({behavior:'smooth',block:'start'});return}
  const a=e.target.closest('[data-act]');if(!a)return;const sec=a.closest('.blk'),it=sec&&items.find(x=>x.id===+sec.dataset.id),i=it?items.indexOf(it):-1,act=a.dataset.act;
  if(act==='copy'){const tbl=a.closest('.tbw');const idx=[...pane.querySelectorAll('.tbw')].indexOf(tbl);let n=0,t;for(const x of items){if(x.type!=='result'||x.collapsed)continue;if(idx<n+x.tables.length){t=x.tables[idx-n];break}n+=x.tables.length}
   t&&navigator.clipboard.writeText(toTSV(t)).then(()=>say(T('تم نسخ الجدول (الصقه في Excel)','Table copied (paste into Excel)')))}
  else if(act==='copyapa')navigator.clipboard.writeText([].concat(it.apa).join('\n')).then(()=>say(T('تم نسخ سطر APA','APA line copied')));
  else if(act==='toggle'){it.collapsed=!it.collapsed;render()}
  else if(act==='explain'){it.explain=!it.explain;render();if(it.explain){const s=pane.querySelector(`[data-id="${it.id}"] .xpl`);s&&s.scrollIntoView({behavior:'smooth',block:'nearest'})}}
  else if(act==='del'){items.splice(i,1);render()}
  else if(act==='up'&&i>0){[items[i-1],items[i]]=[items[i],items[i-1]];render()}
  else if(act==='down'&&i<items.length-1){[items[i+1],items[i]]=[items[i],items[i+1]];render()}});
 pane.addEventListener('dblclick',e=>{const h=e.target.closest('[data-act=rename]');if(!h)return;const it=items.find(x=>x.id===+h.closest('.blk').dataset.id),s=prompt(T('اسم جديد للنتيجة:','New title:'),it.title);if(s&&s.trim()){it.title=s.trim();render()}})}
