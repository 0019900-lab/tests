import {T} from './i18n.js';import {getItems,setItems} from './output.js';
import {store,rowsToState,parseDelimited,replaceAll,markSaved,toCSV,toProject,fromProject,demoState,isDateFmt,fmtOf,fmtDate} from './data.js';import {readSav,writeSav} from './sav.js';import {dialog} from './dialog.js';
const say=t=>{document.querySelector('#status').textContent=t};
const tick=()=>new Promise(r=>setTimeout(r,20));
function dl(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
async function lib(){
 if(!window.XLSX)await new Promise(ok=>{const s=document.createElement('script');s.src='vendor/xlsx.full.min.js';s.onload=ok;s.onerror=ok;document.head.append(s)});
 if(!window.XLSX)throw new Error(T('يحتاج ملف Excel إلى مكتبة SheetJS: ضع xlsx.full.min.js في مجلد vendor (راجع README)','Excel needs SheetJS: put xlsx.full.min.js in the vendor folder (see README)'));
 return window.XLSX}
export async function loadXlsx(f){
 await lib();
 const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
 return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:null})}
export async function openFile(f){
 const ext=f.name.split('.').pop().toLowerCase(),nm=f.name.replace(/\.[^.]+$/,'');
 try{say(T('جاري التحميل…','Loading…'));await tick();const t0=performance.now();
  if(ext==='smart'||ext==='statlab'||ext==='json'){const tx=await f.text(),st=fromProject(tx);st.name=nm;replaceAll(st,true);setItems(JSON.parse(tx).output)}
  else if(ext==='sav'||ext==='zsav'){let st;try{st=readSav(await f.arrayBuffer())}catch(e){throw new Error(e.message==='ZSAV'?T('ملفات .zsav المضغوطة غير مدعومة بعد؛ احفظها من SPSS بصيغة .sav العادية','Compressed .zsav files are not supported yet; save as a regular .sav from SPSS'):T('ملف SPSS غير صالح','Not a valid SPSS file'))}st.name=nm;replaceAll(st,false)}
  else if(['xlsx','xls','xlsm','ods'].includes(ext))replaceAll(rowsToState(await loadXlsx(f),nm),false);
  else replaceAll(rowsToState(parseDelimited(await f.text()),nm),false);
  say(T(`تم التحميل: ${store.n.toLocaleString()} حالة × ${store.vars.length} متغير (${Math.round(performance.now()-t0)} ms)`,`Loaded: ${store.n.toLocaleString()} cases × ${store.vars.length} variables (${Math.round(performance.now()-t0)} ms)`))}
 catch(e){say(T('تعذر فتح الملف: ','Could not open file: ')+e.message)}}
const inp=document.createElement('input');inp.type='file';inp.accept='.smart,.statlab,.json,.sav,.csv,.tsv,.txt,.dat,.xlsx,.xls,.xlsm,.ods';
inp.onchange=()=>{const f=inp.files[0];inp.value='';if(f)openFile(f)};
export const openDialog=()=>inp.click();
export function newDoc(){if(store.dirty&&!confirm(T('توجد تغييرات غير محفوظة. هل تريد بدء ملف جديد؟','You have unsaved changes. Start a new file?')))return;replaceAll({name:'Untitled1',vars:[],cols:[],n:0},true);say(T('ملف جديد','New file'))}
export function save(){{const o=JSON.parse(toProject());o.output=getItems();dl(store.name+'.smart',JSON.stringify(o),'application/json')};markSaved();say(T('تم حفظ المشروع (البيانات والمخرجات)','Project saved (data + output)'))}
export function exportCsv(){dl(store.name+'.csv',toCSV(),'text/csv;charset=utf-8');say(T('تم تصدير CSV','Exported CSV'))}
export async function demo(){say(T('جارٍ توليد 100,000 صف…','Generating 100,000 rows…'));await tick();const t0=performance.now();replaceAll(demoState(),false);say(T(`جاهز: 100,000 حالة (${Math.round(performance.now()-t0)} ms)`,`Ready: 100,000 cases (${Math.round(performance.now()-t0)} ms)`))}
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)openFile(f)});

// ---- حفظ باسم: اختيار الاسم والصيغة (مثل SPSS) ----
const FMTS=[['smart','مشروع Smart-Analysis (*.smart) — بيانات + مخرجات','Smart-Analysis project (*.smart) — data + output'],['sav','SPSS Statistics (*.sav)','SPSS Statistics (*.sav)'],['xlsx','Excel 2007+ (*.xlsx)','Excel 2007+ (*.xlsx)'],['xls','Excel 97-2003 (*.xls)','Excel 97-2003 (*.xls)'],['ods','OpenDocument (*.ods)','OpenDocument (*.ods)'],['csv','CSV — مفصول بفاصلة (*.csv)','CSV — comma separated (*.csv)'],['tsv','نص مفصول بـ Tab (*.tsv)','Tab-delimited (*.tsv)'],['txt','نص مفصول بـ Tab (*.txt)','Tab-delimited text (*.txt)'],['dat','نص مفصول بـ Tab (*.dat)','Tab-delimited (*.dat)']];
const clean=n=>String(n||'').replace(/\.(smart|statlab|sav|xlsx|xls|ods|csv|tsv|txt|dat)$/i,'').replace(/[\\/:*?"<>|]+/g,'_').trim()||'Untitled1';
function rows(){const a=[store.vars.map(v=>v.name)];for(let r=0;r<store.n;r++)a.push(store.vars.map((v,c)=>{const x=store.cols[c][r];return x==null?null:(typeof x==='number'&&isDateFmt(fmtOf(v))?fmtDate(x,'Date yyyy-mm-dd'):x)}));return a}
function tsv(){const q=x=>x==null?'':String(x).replace(/[\t\r\n]+/g,' ');return'\uFEFF'+rows().map(r=>r.map(q).join('\t')).join('\r\n')}
export async function writeAs(ext,name){
 if(ext==='smart'){const o=JSON.parse(toProject());o.name=name;o.output=getItems();dl(name+'.smart',JSON.stringify(o),'application/json');store.name=name;markSaved();return T('تم حفظ المشروع (البيانات والمخرجات)','Project saved (data + output)')}
 if(ext==='sav'){dl(name+'.sav',writeSav(store),'application/octet-stream');return T('تم الحفظ بصيغة SPSS (.sav) مع تسميات المتغيرات والقيم','Saved as SPSS (.sav) with variable and value labels')}
 if(ext==='csv'){dl(name+'.csv',toCSV(),'text/csv;charset=utf-8');return T('تم تصدير CSV','Exported CSV')}
 if(['tsv','txt','dat'].includes(ext)){dl(name+'.'+ext,tsv(),'text/plain;charset=utf-8');return T('تم تصدير ملف نصي','Exported text file')}
 await lib();if(!window.XLSX)throw new Error(T('يحتاج التصدير إلى مكتبة SheetJS في مجلد vendor','Export needs SheetJS in the vendor folder'));
 const ws=XLSX.utils.aoa_to_sheet(rows()),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Data');
 const out=XLSX.write(wb,{type:'array',bookType:ext==='xls'?'biff8':ext});dl(name+'.'+ext,out,'application/octet-stream');return T('تم تصدير '+ext.toUpperCase(),'Exported '+ext.toUpperCase())}
export function saveAs(){const last=(localStorage.saveFmt==='statlab'?'smart':localStorage.saveFmt)||'smart';
 dialog('saveas'+Date.now(),{title:['حفظ باسم','Save as'],go:['حفظ','Save'],fields:[],options:[{key:'name',type:'text',label:['اسم الملف','File name'],def:store.name},{key:'fmt',type:'sel',label:['الصيغة','Format'],def:last,opts:FMTS.map(f=>[f[0],[f[1],f[2]]])}],need:v=>clean(v.name)?null:['اكتب اسم الملف','Enter a file name']},
  async v=>{const nm=clean(v.name);localStorage.saveFmt=v.fmt;try{say(await writeAs(v.fmt,nm))}catch(e){say(T('تعذر الحفظ: ','Could not save: ')+e.message)}})}
export function renameDoc(){const n=prompt(T('اسم المشروع:','Project name:'),store.name);if(n==null)return;const c=clean(n);store.name=c;const d=document.querySelector('#docname');if(d)d.textContent=c+(store.dirty?' •':'')}
{const d=document.querySelector('#docname');if(d){d.style.cursor='pointer';d.title=T('انقر لتغيير اسم المشروع','Click to rename the project');d.onclick=renameDoc}}
