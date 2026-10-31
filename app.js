import * as G from './ui-grid.js';import * as F from './files.js';import {store,undo,redo} from './data.js';import {A} from './analyses.js';
import {initOutput,addText,clearOutput,EXPORT,explainLast,setPane,paneOpen} from './output.js';import {T} from './i18n.js';import {letter} from './keys.js';import {openWizard} from './wizard.js';import {TR} from './transform.js';import {TR2} from './prep2.js';import {ic,ti,mark} from './icons.js';
import {initGuide,openGuide,undocumented} from './guide.js';import {showWelcome,showAbout} from './welcome.js';import {openFind,closeFind} from './find.js';import {CONFIG} from './config.js';import {initUpdate} from './update.js';
// Smart-Analysis – القوائم. كل عنصر: [عربي, English, اختصار, أمر, مرحلة] — مرحلة 0 = قريباً بدون موعد محدد
const S='-';
const MENUS=[
['ملف','File',[['جديد','New','Alt+N','new',0],['فتح / استيراد ملف...','Open / Import file...','Ctrl+O','open',0],['حفظ المشروع','Save project','Ctrl+S','save',0],S,['تصدير المخرجات: HTML','Export output: HTML','','exportHtml',3],['تصدير المخرجات: Word','Export output: Word','','exportWord',3],['تصدير المخرجات: PDF','Export output: PDF','','exportPdf',3],['تصدير المخرجات: Markdown','Export output: Markdown','','exportMd',3],['تصدير الجداول: Excel','Export tables: Excel','','exportXlsx',3],S,['تصدير البيانات: CSV','Export data: CSV','','exportCsv',0],['بيانات تجريبية (100 ألف صف)','Demo data (100k rows)','','demo',0],S,['طباعة','Print','Ctrl+P','print',0]]],
['تحرير','Edit',[['تراجع','Undo','Ctrl+Z','undo',0],['إعادة','Redo','Ctrl+Y','redo',0],S,['نسخ','Copy','Ctrl+C','copy',0],['لصق','Paste','Ctrl+V','paste',0],S,['بحث...','Find...','Ctrl+F','find',3],['إضافة ملاحظة للمخرجات','Add note to output','','addText',3]]],
['عرض','View','',null],['بيانات','Data','',null],['تحويل','Transform','',null],['تحليل','Analyze','',null],['رسوم','Graphs','',null],['أدوات','Utilities','',null],['إضافات','Extensions','',null],['نافذة','Window','',null],['مساعدة','Help','',null]];
const D={
'عرض':[['الوضع الداكن / الفاتح','Dark / Light mode','Alt+D','theme',0],['اللغة: عربي / English','Language: Arabic / English','Alt+L','lang',0],['لوحة الأوامر','Command palette','Ctrl+K','palette',0],['إظهار / إخفاء المخرجات','Show / hide output','Alt+O','pane',0],['نافذة المخرجات الكبيرة','Wide output window','Alt+W','outputWide',3],['شاشة الترحيب','Welcome screen','','welcome',3]],
'بيانات':[['تعريف خصائص المتغير','Define Variable Properties','',null,5],['ترتيب الحالات','Sort Cases','','sort',5],['دمج الملفات','Merge Files','','merge',5],['تقسيم الملف','Split File','','split',5],['اختيار الحالات','Select Cases','','select',5],['ترجيح الحالات','Weight Cases','',null,5]],
'تحويل':[['حساب متغير','Compute Variable','','compute',5],['إعادة ترميز','Recode','','recode',5],['عكس ترميز البنود','Reverse-code items','','reverse',5],['تصنيف بصري (Binning)','Visual Binning','','bin',5],['استبدال القيم المفقودة','Replace Missing Values','','repmiss',5]],
'تحليل':[['معالج اختيار الاختبار','Test selection wizard','Alt+T','wizard',5],S,['التكرارات','Frequencies','','frequencies',0],['الإحصاء الوصفي','Descriptives','','descriptives',0],['الجداول التقاطعية','Crosstabs','','crosstabs',0],S,['اختبار T لعينة واحدة','One-Sample T Test','','ttest1',0],['اختبار T لعينتين مستقلتين','Independent-Samples T Test','','ttestInd',0],['اختبار T لعينتين مرتبطتين','Paired-Samples T Test','','ttestPair',0],['تحليل التباين الأحادي','One-Way ANOVA','','anova',0],S,['الارتباط (Pearson / Spearman)','Correlate (Pearson / Spearman)','','correlate',0],S,['اختبار مان–ويتني','Mann-Whitney U Test','','mannwhitney',5],['اختبار ويلكوكسون','Wilcoxon Signed-Rank Test','','wilcoxon',5],['اختبار كروسكال–واليس','Kruskal-Wallis H Test','','kruskal',5],S,['فحص الاعتدالية (Shapiro–Wilk)','Normality check (Shapiro-Wilk)','','normality',5],S,['الانحدار الخطي','Linear Regression','','regression',5],['الانحدار اللوجستي الثنائي','Binary Logistic Regression','','logistic',5],['التحليل العاملي','Factor Analysis','',null,5],['ثبات المقياس (ألفا كرونباخ)','Reliability (Cronbach’s Alpha)','','alpha',5]],
'رسوم':[['اختيار نوع الرسم...','Chart builder...','','graphs',0],S,['المدرج التكراري','Histogram','','histogram',0],['مخطط الأعمدة','Bar','','bar',0],['مخطط الصندوق','Boxplot','','boxplot',0],['مخطط الانتشار','Scatter','','scatter',0],['مخطط Q-Q (الاعتدالية)','Q-Q plot (normality)','','qq',0]],
'أدوات':[['فسّر نتائجي','Explain my results','Alt+E','explain',0],S,['تصدير الكود (Python / R)','Export code (Python / R)','',null,6],['سجل العمليات','History','',null,6]],
'إضافات':[['مكتبة الإضافات','Extension Hub','',null,8]],
'نافذة':[['عرض البيانات','Data window','','showData',0],['نافذة المخرجات','Output window','','outputWide',3]],
'مساعدة':[['دليل Smart-Analysis','Smart-Analysis Guide','F1','guide',3],['اختصارات لوحة المفاتيح','Keyboard shortcuts','','guideKeys',3],['شاشة الترحيب','Welcome screen','','welcome',3],['اسأل Miss Dalia','Ask Miss Dalia','','askDalia',0],['عن Smart-Analysis','About Smart-Analysis','','about',0]]};
MENUS.forEach(m=>{if(!m[2]||m[2]==='')m[2]=D[m[0]]||[]});
const ICON={new:'new',open:'open',save:'save',exportHtml:'html',exportWord:'word',exportPdf:'pdf',exportMd:'md',exportXlsx:'excel',exportCsv:'export',demo:'sparkle',print:'print',undo:'undo',redo:'redo',copy:'copy',paste:'copy',find:'find',addText:'text',theme:'theme',lang:'lang',palette:'cmd',pane:'output',outputWide:'expand',welcome:'rocket',frequencies:'table',descriptives:'analyze',crosstabs:'data',ttest1:'chart',ttestInd:'chart',ttestPair:'chart',anova:'chart',correlate:'chart',showData:'data',guide:'learn',guideKeys:'keyboard',about:'info',graphs:'chart',wizard:'learn',mannwhitney:'chart',wilcoxon:'chart',kruskal:'chart',regression:'scat',logistic:'scat',compute:'compute',recode:'vars',reverse:'undo',sort:'table',alpha:'check',normality:'qqi',histogram:'hist',bar:'barc',boxplot:'box',scatter:'scat',qq:'qqi',explain:'explain',askDalia:'sparkle'};
// شريط الأدوات: [أيقونة، أمر، عربي، English، اختصار]
const TB=[['new','new','جديد','New','Alt+N','جديد','New'],['open','open','فتح','Open','Ctrl+O','فتح','Open'],['save','save','حفظ','Save','Ctrl+S','حفظ','Save'],'|',['undo','undo','تراجع','Undo','Ctrl+Z','تراجع','Undo'],['redo','redo','إعادة','Redo','Ctrl+Y','إعادة','Redo'],'|',['find','find','بحث','Find','Ctrl+F','بحث','Find'],['cmd','palette','لوحة الأوامر','Command palette','Ctrl+K','الأوامر','Commands'],'|',['compute','compute','حساب متغير','Compute Variable','','حساب','Compute'],['analyze','descriptives','إحصاء وصفي','Descriptives','','وصفي','Describe'],['chart','graphs','الرسوم البيانية','Charts','','رسوم','Charts'],['explain','explain','فسّر نتائجي','Explain my results','Alt+E','فسّر','Explain']];
const $=s=>document.querySelector(s),root=document.documentElement;
let lang=localStorage.lang||'ar',theme=localStorage.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
root.lang=lang;
function say(t){$('#status').textContent=t}
function applyLook(){root.dataset.theme=theme;root.lang=lang;root.dir=lang==='ar'?'rtl':'ltr';localStorage.lang=lang;localStorage.theme=theme;
 $('#titlebar .brand').innerHTML=mark(58)+'<span class="wm"><b>Smart</b><i>-Analysis</i></span>';
 $('#tbCtl').innerHTML=`<div class="seg" role="group" aria-label="${T('اللغة','Language')}"><button data-l="ar" class="${lang==='ar'?'on':''}" title="العربية (Alt+L)">ع</button><button data-l="en" class="${lang==='en'?'on':''}" title="English (Alt+L)">EN</button></div><button class="swt ${theme}" id="btnTheme" role="switch" aria-checked="${theme==='dark'}" title="${T('الوضع الفاتح / الداكن','Light / dark mode')} (Alt+D)"><span class="k">${ic(theme==='dark'?'theme':'sun',14)}</span><span class="s">${ic('sun',13)}</span><span class="m">${ic('theme',13)}</span></button>`;
 $('#tbCtl').querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{if(b.dataset.l!==lang){lang=b.dataset.l;applyLook()}});$('#btnTheme').onclick=()=>ACT.theme();
 $('#btnGuide').innerHTML=ic('learn',18)+`<span>${T('الدليل','Guide')}</span>`;$('#btnDalia').innerHTML=`<img src="assets/dalia-128.png" width="38" height="38" alt=""><span>${T('اسأل Miss Dalia','Ask Miss Dalia')}</span>`;$('#btnDalia').title=T('Ask Miss Dalia — اسأل واحصل على إجابة','Ask Miss Dalia');$('#btnDalia').setAttribute('aria-label','Ask Miss Dalia');$('#btnGuide').title=T('دليل الاستخدام (F1)','User guide (F1)');
 document.querySelectorAll('.tab').forEach(b=>{const v=b.dataset.view==='data';b.innerHTML=lang==='ar'?`${v?'عرض البيانات':'عرض المتغيرات'} <small>${v?'Data View':'Variable View'}</small>`:(v?'Data View':'Variable View')});
 buildMenus();buildToolbar();$('#outputPane').relang();G.refresh&&G.refresh();
 say(T('المحرك جاهز','Engine ready'));$('#hint').textContent=T('اضغط Ctrl+K للبحث عن أي أمر · F1 للدليل','Ctrl+K to search any command · F1 for the guide');
 $('#palInput').placeholder=T('ابحث عن أمر أو تحليل...','Search a command or analysis...');$('#btnInstall').textContent=T('تثبيت','Install')}
// ---- Ask Miss Dalia: انتقال سلس (تحوّل لوني يتّسع من موضع الزر خلال ~0.4 ثانية) ثم فتح الموقع في تبويب جديد ----
function askDalia(){const url=CONFIG.ASK_DALIA_URL;if(!url){say(T('رابط Ask Miss Dalia غير مضبوط بعد — أضفه في ملف config.js','The Ask Miss Dalia link is not set yet — add it in config.js'));return}
 const r=$('#btnDalia').getBoundingClientRect(),fx=document.createElement('div');fx.className='dfx';fx.style.setProperty('--x',Math.round(r.left+r.width/2)+'px');fx.style.setProperty('--y',Math.round(r.top+r.height/2)+'px');fx.setAttribute('role','status');
 fx.innerHTML=`<img src="assets/dalia-256.png" alt=""><b>${T('جارٍ فتح Ask Miss Dalia…','Opening Ask Miss Dalia…')}</b><small>${T('يُفتح في تبويب جديد وتبقى بياناتك هنا كما هي','Opens in a new tab — your data stays right here')}</small>`;document.body.append(fx);
 window.open(url,'_blank','noopener');   // مباشرة داخل النقرة كي لا يحجبه المتصفح
 setTimeout(()=>fx.classList.add('out'),750);setTimeout(()=>fx.remove(),1100)}
const ACT={theme(){theme=theme==='dark'?'light':'dark';applyLook()},lang(){lang=lang==='ar'?'en':'ar';applyLook()},palette:openPal,
 pane(){setPane(!paneOpen())},print(){print()},about:showAbout,
 outputWide(){const p=$('#outputPane');setPane(true);p.classList.toggle('wide');p.relang()},
 showData(){$('.tab[data-view=data]').click()},find:()=>openFind(),addText,guide:()=>openGuide(),guideKeys:()=>openGuide('keys'),welcome:()=>showWelcome(ACT,true),
 explain:explainLast,askDalia,exportHtml:EXPORT.html,exportWord:EXPORT.word,exportPdf:EXPORT.pdf,exportMd:EXPORT.md,exportXlsx:EXPORT.xlsx};
function run(it){if(it[3]&&ACT[it[3]])ACT[it[3]]();else say(it[4]?T(`سيتوفر «${it[0]}» في المرحلة ${it[4]}`,`“${it[1]}” arrives in phase ${it[4]}`):T(`«${it[0]}» قريباً`,`“${it[1]}” is coming soon`))}
const label=it=>lang==='ar'?`${it[0]} <small class="en">${it[1]}</small>`:it[1];
function buildMenus(){const bar=$('#menubar');bar.innerHTML='';
 MENUS.forEach(m=>{const w=document.createElement('div');w.className='menu';const b=document.createElement('button');b.textContent=T(m[0],m[1]);w.append(b);
  const dd=document.createElement('div');dd.className='dd';
  m[2].forEach(it=>{if(it===S){dd.append(document.createElement('hr'));return}const live=it[3]&&ACT[it[3]],x=document.createElement('button');
   x.className=live?'':'soonit';x.innerHTML=`<span class="ico">${ICON[it[3]]?ic(ICON[it[3]],16):''}</span><span class="lb">${label(it)}</span>${live?`<kbd>${it[2]}</kbd>`:`<em class="soon">${it[4]?'P'+it[4]:T('قريباً','Soon')}</em>`}`;
   x.onclick=()=>{close();run(it)};dd.append(x)});
  w.append(dd);b.onclick=e=>{e.stopPropagation();const o=w.classList.contains('open');close();if(!o)w.classList.add('open')};
  b.onmouseenter=()=>{if(document.querySelector('.menu.open')){close();w.classList.add('open')}};bar.append(w)})}
function close(){document.querySelectorAll('.menu.open').forEach(x=>x.classList.remove('open'))}
document.addEventListener('click',close);
function buildToolbar(){const t=$('#toolbar');t.innerHTML='';let g=null,gi=-1;const open=()=>{gi++;g=document.createElement('div');g.className='grp g'+gi;t.append(g)};open();
 TB.forEach(i=>{if(i==='|'){open();return}
  const live=!!ACT[i[1]],b=document.createElement('button');b.type='button';
  b.innerHTML=`<span class="tile">${ti(i[0],28)}</span><span class="tl">${T(i[5]||i[2],i[6]||i[3])}</span>`;b.dataset.tip=T(i[2],i[3])+(i[4]?`  ·  ${i[4]}`:'')+(live?'':T('  ·  قريباً','  ·  soon'));
  b.setAttribute('aria-label',T(i[2],i[3]));if(!live)b.classList.add('soonit');b.onclick=()=>run([i[2],i[3],'',live?i[1]:null,i[7]||0]);g.append(b)})}
// ---- لوحة الأوامر ----
let sel=0,items=[];
function openPal(){$('#palette').hidden=false;$('#palInput').value='';filter();$('#palInput').focus()}
function filter(){const q=$('#palInput').value.toLowerCase();items=[];MENUS.forEach(m=>m[2].forEach(it=>{if(it!==S&&(it[0]+' '+it[1]).toLowerCase().includes(q))items.push([it,T(m[0],m[1])])}));sel=0;drawPal()}
function drawPal(){const u=$('#palList');u.innerHTML='';items.slice(0,40).forEach((x,i)=>{const li=document.createElement('li'),it=x[0],live=it[3]&&ACT[it[3]];if(i===sel)li.className='sel';
 li.innerHTML=`<span class="pl">${ICON[it[3]]?ic(ICON[it[3]],16):'<i class="pi"></i>'}${label(it)}</span><kbd class="soon">${live?(it[2]||x[1]):x[1]+' · '+T('قريباً','soon')}</kbd>`;li.onclick=()=>pick(i);u.append(li)});
 const s=u.querySelector('.sel');s&&s.scrollIntoView({block:'nearest'})}
function pick(i){const x=items[i];if(!x)return;$('#palette').hidden=true;run(x[0])}
$('#palInput').oninput=filter;
$('#palInput').onkeydown=e=>{if(e.key==='ArrowDown'){sel=Math.min(sel+1,items.length-1);drawPal()}else if(e.key==='ArrowUp'){sel=Math.max(sel-1,0);drawPal()}else if(e.key==='Enter')pick(sel);else if(e.key==='Escape')$('#palette').hidden=true};
$('#palette').onclick=e=>{if(e.target.id==='palette')$('#palette').hidden=true};
// الاختصارات: تُقرأ برمز المفتاح الفيزيائي فتعمل مع أي تخطيط (عربي/إنجليزي)، وفي مرحلة الالتقاط قبل أي عنصر آخر
addEventListener('keydown',e=>{if(e.isComposing)return;const k=letter(e),ctrl=e.ctrlKey||e.metaKey,alt=e.altKey&&!ctrl&&!e.shiftKey;
 if(document.querySelector('.dlgov:not(.gov):not(.wov)')){return}
 let f=null;
 if(e.key==='F1')f=()=>ACT.guide();
 else if(ctrl&&!e.shiftKey&&!e.altKey){f={k:()=>openPal(),f:()=>openFind(),s:()=>ACT.save(),o:()=>ACT.open()}[k]}
 else if(alt){f={d:()=>ACT.theme(),l:()=>ACT.lang(),o:()=>ACT.pane(),w:()=>ACT.outputWide(),n:()=>ACT.new(),e:()=>ACT.explain(),t:()=>ACT.wizard()}[k]}
 else if(e.key==='Escape')close();
 if(f){e.preventDefault();e.stopPropagation();f()}},true);
document.addEventListener('statlab:find',e=>openFind(e.detail));
// ---- PWA ----
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e});
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(installed())$('#btnInstall').hidden=true;else $('#btnInstall').hidden=false;
addEventListener('appinstalled',()=>{$('#btnInstall').hidden=true;say(T('تم تثبيت التطبيق','App installed'))});
// الضغط: نافذة التثبيت الرسمية إن أتاحها المتصفح، وإلا شرح خطوات التثبيت حسب المتصفح بدل أن لا يحدث شيء
function installHelp(){if(document.querySelector('.inst'))return;const ua=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),and=/Android/.test(ua),ff=/Firefox/.test(ua)&&!and,secure=location.protocol==='https:'||location.hostname==='localhost';
 const steps=!secure?T('التثبيت يتطلب اتصالاً آمناً (https). افتح الموقع بعنوان يبدأ بـ https:// ثم أعد المحاولة.','Installing needs a secure connection (https). Open the site with an address starting with https:// and try again.')
 :ios?T('في Safari: اضغط زر المشاركة (المربع والسهم)، ثم اختر «إضافة إلى الشاشة الرئيسية».','In Safari: tap the Share button (square with arrow), then choose “Add to Home Screen”.')
 :ff?T('Firefox على الحاسوب لا يدعم تثبيت التطبيقات. افتح الموقع في Chrome أو Edge ثم ثبّته.','Desktop Firefox cannot install apps. Open the site in Chrome or Edge and install it there.')
 :and?T('في Chrome: اضغط قائمة ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».','In Chrome: tap the ⋮ menu, then “Install app” or “Add to Home screen”.')
 :T('في Chrome أو Edge: اضغط أيقونة التثبيت في يمين شريط العنوان، أو قائمة ⋮ ثم «تثبيت Smart-Analysis».','In Chrome or Edge: click the install icon at the end of the address bar, or the ⋮ menu → “Install Smart-Analysis”.');
 const ov=document.createElement('div');ov.className='dlgov inst';ov.innerHTML=`<div class="dlg" dir="${root.dir}" style="width:min(460px,94vw)"><h3>${T('تثبيت Smart-Analysis','Install Smart-Analysis')}</h3><div class="dbody"><p style="margin:0;line-height:1.9">${steps}</p><p style="margin:10px 0 0;color:var(--mute);font-size:12.5px">${T('بعد التثبيت يعمل البرنامج في نافذته الخاصة وحتى دون اتصال.','Once installed it opens in its own window and works offline.')}</p></div><div class="dfoot"><button class="go">${T('حسناً','OK')}</button></div></div>`;
 document.body.append(ov);const cl=()=>ov.remove();ov.querySelector('.go').onclick=cl;ov.onclick=e=>{if(e.target===ov)cl()};ov.addEventListener('keydown',e=>{if(e.key==='Escape')cl()});ov.querySelector('.go').focus()}
$('#btnInstall').onclick=async()=>{if(dp){dp.prompt();await dp.userChoice;dp=null}else installHelp()};
$('#btnGuide').onclick=()=>ACT.guide();$('#btnDalia').onclick=()=>ACT.askDalia();
initUpdate();
Object.assign(ACT,{wizard:()=>openWizard(ACT),new:F.newDoc,open:F.openDialog,save:F.save,exportCsv:F.exportCsv,demo:F.demo,undo:()=>{undo()},redo:()=>{redo()},copy:G.copy,paste:G.paste,...A,...TR,...TR2});
initOutput();initGuide({menus:MENUS,acts:ACT,toolbar:TB,icon:c=>ICON[c]});
applyLook();G.init();
const miss=undocumented();if(miss.length)console.warn('StatLab guide: missing docs for',miss.join(', '));
globalThis.__statlab={ACT,MENUS,undocumented,CONFIG};
setTimeout(()=>showWelcome(ACT),350);
addEventListener('beforeunload',e=>{if(store.dirty){e.preventDefault();e.returnValue=''}});
