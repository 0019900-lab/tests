// Smart-Analysis – القوائم العلوية: ترتيب منطقي + قوائم فرعية منبثقة (بدل قائمة طويلة واحدة)
// القاعدة: عنصر جديد في MENUS يظهر تلقائياً؛ ما لم يُذكر هنا يُضاف في آخر قائمته. غير المنفَّذ يُجمع في «قريباً».
import {T,lang} from './i18n.js';import {ic} from './icons.js';
const S='-';
// أسماء قصيرة داخل القوائم الفرعية (الاسم الكامل يبقى في الدليل ولوحة الأوامر)
const NAME={exportHtml:['صفحة HTML','HTML page'],exportWord:['مستند Word','Word document'],exportPdf:['ملف PDF','PDF file'],exportMd:['Markdown','Markdown'],exportXlsx:['جداول Excel','Tables as Excel'],exportCsv:['بيانات CSV','Data as CSV'],
 ttest1:['T لعينة واحدة','One-Sample T'],ttestInd:['T لعينتين مستقلتين','Independent-Samples T'],ttestPair:['T لعينتين مرتبطتين','Paired-Samples T'],anova:['التباين الأحادي ANOVA','One-Way ANOVA'],
 mannwhitney:['مان–ويتني','Mann-Whitney U'],wilcoxon:['ويلكوكسون','Wilcoxon Signed-Rank'],kruskal:['كروسكال–واليس','Kruskal-Wallis H'],regression:['الانحدار الخطي','Linear'],logistic:['الانحدار اللوجستي الثنائي','Binary Logistic'],alpha:['ثبات المقياس (ألفا كرونباخ)','Reliability (Cronbach’s Alpha)']};
const G=(ar,en,icon,k)=>({g:[ar,en],icon,k});
const LAYOUT={
 'ملف':['new','open','demo',S,'save','saveAs',G('تصدير','Export','export',['exportHtml','exportWord','exportPdf','exportMd',S,'exportXlsx','exportCsv']),S,'print'],
 'تحرير':['undo','redo',S,'copy','paste',S,'find','addText'],
 'عرض':['pane','outputWide',S,'theme','lang',S,'palette','welcome'],
 'بيانات':['sort','select','split','merge'],
 'تحويل':['compute','recode','reverse',S,'bin','repmiss'],
 'تحليل':['wizard',S,G('إحصاء وصفي','Descriptive','table',['frequencies','descriptives','crosstabs']),G('مقارنة المتوسطات','Compare means','chart',['ttest1','ttestInd','ttestPair',S,'anova']),'correlate',G('اختبارات لا معلمية','Nonparametric','vars',['mannwhitney','wilcoxon','kruskal']),'normality',S,G('الانحدار','Regression','scat',['regression','logistic']),G('المقاييس','Scale','check',['alpha'])],
 'رسوم':['graphs',S,'histogram','bar','boxplot','scatter','qq'],
 'أدوات':['explain'],
 'نافذة':['showData','outputWide'],
 'مساعدة':['guide','guideKeys',S,'askDalia','welcome',S,'about']};
export function buildMenus(bar,MENUS,{ACT,ICON,run,close}){bar.innerHTML='';
 const ar=()=>lang()==='ar',nm=it=>{const n=NAME[it[3]];return n?T(n[0],n[1]):T(it[0],it[1])},tip=it=>ar()?it[1]:it[0];
 const item=(it,live)=>{const x=document.createElement('button');x.type='button';x.setAttribute('role','menuitem');x.className='mi'+(live?'':' soonit');x.title=tip(it);
  x.innerHTML=`<span class="ico">${ICON[it[3]]?ic(ICON[it[3]],16):''}</span><span class="lb">${nm(it)}</span>${live&&it[2]?`<kbd>${it[2]}</kbd>`:''}`;
  if(live)x.onclick=e=>{e.stopPropagation();close();run(it)};else x.disabled=true;return x};
 const place=sd=>{sd.classList.remove('flipx');sd.style.top='';let r=sd.getBoundingClientRect();
  if(r.right>innerWidth-6||r.left<6){sd.classList.add('flipx');r=sd.getBoundingClientRect()}
  if(r.bottom>innerHeight-8)sd.style.top=Math.min(-6,-6-(r.bottom-innerHeight+8))+'px'};
 const group=(label,icon,build,live=true)=>{const w=document.createElement('div');w.className='msub';
  const b=document.createElement('button');b.type='button';b.className='mi has'+(live?'':' soonit');b.setAttribute('aria-haspopup','menu');
  b.innerHTML=`<span class="ico">${icon?ic(icon,16):''}</span><span class="lb">${label}</span><span class="chev">${ic('chevR',14)}</span>`;
  const sd=document.createElement('div');sd.className='sd';sd.setAttribute('role','menu');build(sd);w.append(b,sd);
  let t;const show=()=>{clearTimeout(t);t=setTimeout(()=>{w.parentElement.querySelectorAll(':scope>.msub.open').forEach(o=>o!==w&&o.classList.remove('open'));w.classList.add('open');place(sd)},70)},hide=()=>{clearTimeout(t);t=setTimeout(()=>w.classList.remove('open'),200)};
  w.onmouseenter=show;w.onmouseleave=hide;b.onclick=e=>{e.stopPropagation();w.classList.contains('open')?w.classList.remove('open'):(w.parentElement.querySelectorAll(':scope>.msub.open').forEach(o=>o.classList.remove('open')),w.classList.add('open'),place(sd))};return w};
 const fill=(box,list,byAct)=>list.forEach(e=>{if(e===S){if(box.lastChild&&box.lastChild.tagName!=='HR')box.append(document.createElement('hr'));return}
  if(typeof e==='string'){const it=byAct[e];if(it&&ACT[e])box.append(item(it,true));return}
  const ks=e.k.filter(k=>k===S||(byAct[k]&&ACT[k]));if(!ks.some(k=>k!==S))return;box.append(group(T(e.g[0],e.g[1]),e.icon,sd=>fill(sd,ks,byAct)))});
 MENUS.forEach(m=>{const w=document.createElement('div');w.className='menu';const b=document.createElement('button');b.textContent=T(m[0],m[1]);b.setAttribute('aria-haspopup','menu');w.append(b);
  const dd=document.createElement('div');dd.className='dd';dd.setAttribute('role','menu');
  const items=m[2].filter(it=>it!==S),byAct={};items.forEach(it=>{if(it[3])byAct[it[3]]=it});
  const lay=LAYOUT[m[0]]||[],used=new Set(lay.flatMap(e=>typeof e==='string'?[e]:e.k||[]));
  const extra=items.filter(it=>ACT[it[3]]&&!used.has(it[3])),soon=items.filter(it=>!ACT[it[3]]);
  fill(dd,[...lay,...(extra.length?[S,...extra.map(it=>it[3])]:[])],byAct);
  if(soon.length){if(dd.children.length)dd.append(document.createElement('hr'));
   if(dd.children.length||soon.length>1)dd.append(group(T('قريباً','Coming soon'),'sparkle',sd=>soon.forEach(it=>sd.append(item(it,false))),false));else dd.append(item(soon[0],false))}
  w.append(dd);b.onclick=e=>{e.stopPropagation();const o=w.classList.contains('open');close();if(!o)w.classList.add('open')};
  b.onmouseenter=()=>{if(document.querySelector('.menu.open')){close();w.classList.add('open')}};bar.append(w)});
 bar.onkeydown=e=>{if(e.key==='Escape')close()}}
