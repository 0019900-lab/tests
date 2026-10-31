import {T} from './i18n.js';import {getItems,setItems} from './output.js';
import {store,rowsToState,parseDelimited,replaceAll,markSaved,toCSV,toProject,fromProject,demoState} from './data.js';
const say=t=>{document.querySelector('#status').textContent=t};
const tick=()=>new Promise(r=>setTimeout(r,20));
function dl(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
export async function loadXlsx(f){
 if(!window.XLSX)await new Promise(ok=>{const s=document.createElement('script');s.src='vendor/xlsx.full.min.js';s.onload=ok;s.onerror=ok;document.head.append(s)});
 if(!window.XLSX)throw new Error(T('يحتاج ملف Excel إلى مكتبة SheetJS: ضع xlsx.full.min.js في مجلد vendor (راجع README)','Excel needs SheetJS: put xlsx.full.min.js in the vendor folder (see README)'));
 const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
 return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:null})}
export async function openFile(f){
 const ext=f.name.split('.').pop().toLowerCase(),nm=f.name.replace(/\.[^.]+$/,'');
 try{say(T('جاري التحميل…','Loading…'));await tick();const t0=performance.now();
  if(ext==='statlab'||ext==='json'){const tx=await f.text();replaceAll(fromProject(tx),true);setItems(JSON.parse(tx).output)}
  else if(ext==='xlsx'||ext==='xls')replaceAll(rowsToState(await loadXlsx(f),nm),false);
  else replaceAll(rowsToState(parseDelimited(await f.text()),nm),false);
  say(T(`تم التحميل: ${store.n.toLocaleString()} حالة × ${store.vars.length} متغير (${Math.round(performance.now()-t0)} ms)`,`Loaded: ${store.n.toLocaleString()} cases × ${store.vars.length} variables (${Math.round(performance.now()-t0)} ms)`))}
 catch(e){say(T('تعذر فتح الملف: ','Could not open file: ')+e.message)}}
const inp=document.createElement('input');inp.type='file';inp.accept='.statlab,.json,.csv,.tsv,.txt,.xlsx,.xls';
inp.onchange=()=>{const f=inp.files[0];inp.value='';if(f)openFile(f)};
export const openDialog=()=>inp.click();
export function newDoc(){if(store.dirty&&!confirm(T('توجد تغييرات غير محفوظة. هل تريد بدء ملف جديد؟','You have unsaved changes. Start a new file?')))return;replaceAll({name:'Untitled1',vars:[],cols:[],n:0},true);say(T('ملف جديد','New file'))}
export function save(){{const o=JSON.parse(toProject());o.output=getItems();dl(store.name+'.statlab',JSON.stringify(o),'application/json')};markSaved();say(T('تم حفظ المشروع (البيانات والمخرجات)','Project saved (data + output)'))}
export function exportCsv(){dl(store.name+'.csv',toCSV(),'text/csv;charset=utf-8');say(T('تم تصدير CSV','Exported CSV'))}
export async function demo(){say(T('جارٍ توليد 100,000 صف…','Generating 100,000 rows…'));await tick();const t0=performance.now();replaceAll(demoState(),false);say(T(`جاهز: 100,000 حالة (${Math.round(performance.now()-t0)} ms)`,`Ready: 100,000 cases (${Math.round(performance.now()-t0)} ms)`))}
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)openFile(f)});
