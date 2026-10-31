// StatLab – Data View (virtual grid) + Variable View
import {T} from './i18n.js';import {letter} from './keys.js';
import {store,cell,show,commit,subscribe,setVar,undo,redo,FORMATS,fmtOf} from './data.js';
const $=s=>document.querySelector(s),say=t=>{$('#status').textContent=t};
const RH=26,CW=100,NW=52;
const wrap=$('#gridWrap'),grid=$('#grid'),vg=$('#varGrid'),cellInput=$('#cellInput');
const ed=document.createElement('input');ed.id='cellEditor';ed.hidden=true;
let sel={r:0,c:0},anc={r:0,c:0},view='data',raf=0,editing=false,drag=false;
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dims=()=>({R:store.n+40,C:Math.max(store.vars.length+8,14)});
const cw=c=>{const v=store.vars[c];return v?Math.round(Math.min(640,Math.max(44,(+v.columns||8)*8+36))):CW};
const xs=()=>{const{C}=dims(),a=[0];for(let c=0;c<C;c++)a.push(a[c]+cw(c));return a};
const alg=v=>v?(v.align||(v.type==='Numeric'?'Right':'Left')):'Left';
const rng=()=>({r0:Math.min(anc.r,sel.r),r1:Math.max(anc.r,sel.r),c0:Math.min(anc.c,sel.c),c1:Math.max(anc.c,sel.c)});
const raw=(r,c)=>String(cell(r,c));
const isField=t=>t&&(t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='TEXTAREA');
const schedule=()=>{if(!raf)raf=requestAnimationFrame(render)};
function render(){raf=0;if(view!=='data')return;
 const{R,C}=dims(),first=Math.max(0,Math.floor(wrap.scrollTop/RH)-6),last=Math.min(R,first+Math.ceil(wrap.clientHeight/RH)+14),q=rng();
 let h=`<colgroup><col style="width:${NW}px">`+Array.from({length:C},(_,c)=>`<col style="width:${cw(c)}px">`).join('')+'</colgroup><thead><tr><th class="corner"></th>';
 for(let c=0;c<C;c++){const v=store.vars[c];h+=`<th data-hc="${c}" class="${v?'':'undef'}" title="${esc(v?v.label:'')}">${v?esc(v.name):''}</th>`}
 h+='</tr></thead><tbody>';
 if(first)h+=`<tr class="sp"><td colspan="${C+1}" style="height:${first*RH}px"></td></tr>`;
 for(let r=first;r<last;r++){h+=`<tr><th>${r+1}</th>`;
  for(let c=0;c<C;c++){const v=store.vars[c],inr=r>=q.r0&&r<=q.r1&&c>=q.c0&&c<=q.c1;
   h+=`<td data-r="${r}" data-c="${c}" class="${inr?'rg ':''}${r===sel.r&&c===sel.c?'cur ':''}${v&&v.type==='Numeric'?'n ':''}a-${alg(v)[0].toLowerCase()}">${esc(show(r,c))}</td>`}
  h+='</tr>'}
 if(last<R)h+=`<tr class="sp"><td colspan="${C+1}" style="height:${(R-last)*RH}px"></td></tr>`;
 grid.style.width=(NW+xs()[C])+'px';grid.innerHTML=h+'</tbody>';updateBars()}
function updateBars(){const v=store.vars[sel.c];$('#cellRef').textContent=`${sel.r+1} : ${v?v.name:'—'}`;if(document.activeElement!==cellInput)cellInput.value=raw(sel.r,sel.c)}
function updateDoc(){$('#docname').textContent=store.name+(store.dirty?' •':'');$('#info').textContent=`${store.n.toLocaleString()} × ${store.vars.length}`}
function ensureVisible(){
 const top=RH+sel.r*RH;if(top<wrap.scrollTop+RH)wrap.scrollTop=top-RH;else if(top+RH>wrap.scrollTop+wrap.clientHeight-16)wrap.scrollTop=top+RH-wrap.clientHeight+16;
 const X=xs(),left=NW+X[sel.c],w=cw(sel.c);if(left<wrap.scrollLeft+NW)wrap.scrollLeft=left-NW;else if(left+w>wrap.scrollLeft+wrap.clientWidth)wrap.scrollLeft=left+w-wrap.clientWidth}
function go(dr,dc,ext){const{R,C}=dims();sel={r:clamp(sel.r+dr,0,R-1),c:clamp(sel.c+dc,0,C-1)};if(!ext)anc={...sel};ensureVisible();render()}
function startEdit(init){editing=true;ensureVisible();render();
 ed.style.top=(RH+sel.r*RH)+'px';ed.style.left=(NW+xs()[sel.c])+'px';ed.style.width=cw(sel.c)+'px';
 ed.value=init!=null?init:raw(sel.r,sel.c);ed.hidden=false;ed.focus();if(init==null)ed.select()}
function endEdit(save,dr,dc){if(!editing)return;editing=false;const v=ed.value;ed.hidden=true;
 if(save){const res=commit([{r:sel.r,c:sel.c,v}]);if(res.rejected)say(T('هذه القيمة غير رقمية — المتغير من نوع Numeric','Not a number — this variable is Numeric'))}
 wrap.focus();go(dr,dc)}
ed.onkeydown=e=>{e.stopPropagation();if(e.isComposing)return;
 if(e.key==='Enter'){e.preventDefault();endEdit(true,1,0)}else if(e.key==='Tab'){e.preventDefault();endEdit(true,0,e.shiftKey?-1:1)}else if(e.key==='Escape'){endEdit(false,0,0)}};
ed.onblur=()=>endEdit(true,0,0);
function clearRange(){const q=rng(),ch=[];for(let r=q.r0;r<=q.r1&&r<store.n;r++)for(let c=q.c0;c<=q.c1&&c<store.vars.length;c++)if(cell(r,c)!=='')ch.push({r,c,v:''});commit(ch);render()}
function toTSV(){const q=rng(),out=[];for(let r=q.r0;r<=q.r1;r++){const a=[];for(let c=q.c0;c<=q.c1;c++)a.push(raw(r,c).replace(/[\t\r\n]/g,' '));out.push(a.join('\t'))}return out.join('\n')}
function pasteText(t){if(!t)return;const q=rng(),lines=t.replace(/\r/g,'').split('\n');if(lines.length>1&&lines[lines.length-1]==='')lines.pop();
 const ch=[];let w=1;lines.forEach((ln,i)=>{const p=ln.split('\t');if(p.length>w)w=p.length;p.forEach((v,j)=>ch.push({r:q.r0+i,c:q.c0+j,v}))});
 const res=commit(ch);anc={r:q.r0,c:q.c0};sel={r:q.r0+lines.length-1,c:q.c0+w-1};render();
 say(res.rejected?T(`تم اللصق مع تجاهل ${res.rejected} قيمة غير رقمية`,`Pasted; ${res.rejected} non-numeric values ignored`):T(`تم لصق ${ch.length.toLocaleString()} خلية`,`Pasted ${ch.length.toLocaleString()} cells`))}
export function refresh(){if(view==='data')render();else renderVars()}
export function goTo(r,c){setView('data');sel={r,c};anc={r,c};ensureVisible();render();wrap.focus({preventScroll:true})}
export const copy=()=>{navigator.clipboard.writeText(toTSV()).then(()=>say(T('تم النسخ','Copied')),()=>say(T('منع المتصفح النسخ، استخدم Ctrl+C','Browser blocked copying — use Ctrl+C')))};
export async function paste(){try{pasteText(await navigator.clipboard.readText())}catch{say(T('منع المتصفح قراءة الحافظة، استخدم Ctrl+V','Browser blocked clipboard — use Ctrl+V'))}}
// ---- Variable View ----
const VF=['name','type','width','decimals','label','values','missing','columns','align','measure','role'];
const OPT={type:FORMATS,align:['Left','Right','Center'],measure:['Scale','Ordinal','Nominal'],role:['Input','Target','Both','None','Partition','Split']};
// شرح عربي بجانب خيارات SPSS الإنجليزية (القيمة المخزَّنة تبقى الإنجليزية)
const AR={Numeric:'رقمي',Comma:'فاصلة',Dot:'نقطة',String:'نصي','Scientific notation':'أُسّي علمي',Dollar:'دولار','Custom currency':'عملة مخصصة','Restricted Number':'رقم مقيَّد',Left:'يسار',Right:'يمين',Center:'وسط',Scale:'كمّي',Ordinal:'ترتيبي',Nominal:'اسمي',Input:'مُدخَل',Target:'هدف',Both:'كلاهما',None:'بلا',Partition:'تجزئة',Split:'تقسيم'};
const optLabel=o=>document.documentElement.lang==='ar'?(AR[o]?`${o} · ${AR[o]}`:o.startsWith('Date ')?`${o} · تاريخ`:o):o;
function renderVars(){
 let h='<thead><tr><th>#</th>'+[['الاسم','Name'],['النوع','Type'],['العرض','Width'],['الكسور العشرية','Decimals'],['التسمية','Label'],['تسميات القيم','Values'],['القيم المفقودة','Missing'],['الأعمدة','Columns'],['المحاذاة','Align'],['مستوى القياس','Measure'],['الدور','Role']].map(x=>`<th>${T(x[0]+' <small>'+x[1]+'</small>',x[1])}</th>`).join('')+'</tr></thead><tbody>';
 for(let i=0;i<=store.vars.length;i++){const v=store.vars[i];h+=`<tr><th>${i+1}</th>`+VF.map(f=>{const val=v?(f==='type'?fmtOf(v):f==='columns'?(v.columns??8):f==='align'?alg(v):v[f]):'';
  if(OPT[f]&&v)return`<td><select data-i="${i}" data-f="${f}">${OPT[f].map(o=>`<option value="${o}"${o===val?' selected':''}>${optLabel(o)}</option>`).join('')}</select></td>`;
  return`<td><input data-i="${i}" data-f="${f}" value="${esc(val)}"${!v&&f!=='name'?' disabled':''}></td>`}).join('')+'</tr>'}
 vg.innerHTML=h+'</tbody>'}
vg.addEventListener('change',e=>{const t=e.target;if(!t.dataset.f)return;const err=setVar(+t.dataset.i,t.dataset.f,t.value);if(err){say(err);renderVars()}else if(t.dataset.f==='type'&&t.value==='Custom currency'){const v=store.vars[+t.dataset.i],c=prompt(T('رمز العملة (مثل EGP أو ر.س):','Currency symbol (e.g. EGP or SAR):'),v.cur||'EGP');if(c&&c.trim())setVar(+t.dataset.i,'cur',c.trim())}});
// ---- ربط الأحداث ----
function setView(v){view=v;grid.hidden=v!=='data';vg.hidden=v!=='var';
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===v));if(v==='data')render();else renderVars()}
export function init(){
 wrap.tabIndex=0;wrap.append(ed);cellInput.disabled=false;
 subscribe(k=>{updateDoc();if(view==='data')schedule();else if(k!=='var')renderVars()});
 wrap.addEventListener('scroll',schedule);addEventListener('resize',schedule);
 document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>setView(b.dataset.view));
 wrap.addEventListener('mousedown',e=>{if(view!=='data'||e.target===ed)return;if(editing)endEdit(true,0,0);
  const td=e.target.closest('td[data-r]'),th=e.target.closest('th[data-hc]');
  if(td){const p={r:+td.dataset.r,c:+td.dataset.c};sel=p;if(!e.shiftKey)anc={...p};drag=true;schedule();wrap.focus();e.preventDefault()}
  else if(th){const c=+th.dataset.hc;anc={r:0,c};sel={r:Math.max(store.n-1,0),c};schedule();wrap.focus();e.preventDefault()}});
 document.addEventListener('mousemove',e=>{if(!drag||!e.target.closest)return;const td=e.target.closest('td[data-r]');if(td){const r=+td.dataset.r,c=+td.dataset.c;if(r!==sel.r||c!==sel.c){sel={r,c};schedule()}}});
 document.addEventListener('mouseup',()=>{drag=false});
 wrap.addEventListener('dblclick',e=>{const td=e.target.closest('td[data-r]');if(td&&view==='data'){sel={r:+td.dataset.r,c:+td.dataset.c};anc={...sel};startEdit()}});
 wrap.addEventListener('keydown',e=>{if(e.target===ed||view!=='data')return;const k=e.key,mod=e.ctrlKey||e.metaKey,s=e.shiftKey;
  if(mod){if(letter(e)==='a'){e.preventDefault();anc={r:0,c:0};sel={r:Math.max(store.n-1,0),c:Math.max(store.vars.length-1,0)};render()}return}
  const nav={ArrowDown:[1,0],ArrowUp:[-1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],PageDown:[20,0],PageUp:[-20,0]}[k];
  if(nav){e.preventDefault();go(nav[0],nav[1],s)}
  else if(k==='Enter'){e.preventDefault();go(s?-1:1,0)}
  else if(k==='Tab'){e.preventDefault();go(0,s?-1:1)}
  else if(k==='Home'){e.preventDefault();go(0,-sel.c,s)}
  else if(k==='End'){e.preventDefault();go(0,Math.max(store.vars.length-1,0)-sel.c,s)}
  else if(k==='F2'){e.preventDefault();startEdit()}
  else if(k==='Delete'||k==='Backspace'){e.preventDefault();clearRange()}
  else if(k.length===1&&!e.altKey){e.preventDefault();startEdit(k)}});
 cellInput.addEventListener('keydown',e=>{if(e.key==='Enter'){commit([{r:sel.r,c:sel.c,v:cellInput.value}]);wrap.focus();go(1,0)}else if(e.key==='Escape'){cellInput.value=raw(sel.r,sel.c);wrap.focus()}});
 document.addEventListener('copy',e=>{if(view!=='data'||isField(e.target))return;e.clipboardData.setData('text/plain',toTSV());e.preventDefault()});
 document.addEventListener('cut',e=>{if(view!=='data'||isField(e.target))return;e.clipboardData.setData('text/plain',toTSV());e.preventDefault();clearRange()});
 document.addEventListener('paste',e=>{if(view!=='data'||isField(e.target))return;e.preventDefault();pasteText(e.clipboardData.getData('text/plain'))});
 document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||isField(e.target))return;const k=letter(e);
  if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k==='y'){e.preventDefault();redo()}});
 updateDoc();render()}
