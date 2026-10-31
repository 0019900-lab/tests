// Smart-Analysis – قوائم Variable View العصرية: منتقٍ منبثق بالبطاقات + نافذتا Values وMissing + نافذة نص صغيرة.
// الصيغة المخزَّنة متوافقة مع analyses.js: values = "1=ذكر;2=أنثى" ، missing = "99, -99"
import {T,lang} from './i18n.js';
import {store} from './data.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const tr=p=>Array.isArray(p)?(lang()==='ar'?p[0]:p[1]):p;
const svg=d=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const GL={
 scale:svg('<path d="M4 4v16h16"/><path d="M8 15l4-5 3 3 5-7"/>'),ordinal:svg('<path d="M5 20v-5M10 20v-9M15 20V7M20 20V4"/>'),nominal:svg('<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="12" cy="17" r="3"/>'),
 input:svg('<path d="M4 12h12M12 7l5 5-5 5"/>'),target:svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'),both:svg('<path d="M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4"/>'),none:svg('<circle cx="12" cy="12" r="8"/><path d="M6.3 6.3l11.4 11.4"/>'),partition:svg('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M12 5v14"/>'),split:svg('<path d="M3 8l9-4 9 4-9 4zM3 13l9 4 9-4"/>'),
 left:svg('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),center:svg('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),right:svg('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'),
 caret:svg('<path d="M7 10l5 5 5-5"/>'),tick:svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),x:svg('<path d="M6 6l12 12M18 6L6 18"/>'),plus:svg('<path d="M12 5v14M5 12h14"/>'),tags:svg('<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.3"/>'),wand:svg('<path d="M5 19L17 7M14 4v3M19 9h-3M17 3l.6 1.4L19 5l-1.4.6L17 7l-.6-1.4L15 5l1.4-.6z"/>')};
const B=(t,c)=>`<i class="vb ${c}">${t}</i>`;
// ---- خيارات كل قائمة: v = القيمة المخزَّنة (إنجليزية كما في SPSS)، t = الاسم، d = الوصف، g = الشارة ----
const TY=(v,ar,en,da,de,ex,badge,cls)=>({v,t:[ar,en],d:[da,de],ex,g:B(badge,cls)});
export const SPEC={
 type:{title:['نوع المتغير','Variable type'],cols:2,groups:[
  {h:['أرقام','Numbers'],items:[TY('Numeric','رقمي','Numeric','رقم عادي للحساب','Plain number for calculations','1234.56','123','n'),TY('Comma','فاصلة','Comma','فاصلة للآلاف','Comma thousands','1,234.56','1,0','n'),TY('Dot','نقطة','Dot','نقطة للآلاف (أوروبي)','Dot thousands (European)','1.234,56','1.0','n'),TY('Scientific notation','أُسّي علمي','Scientific','للأرقام الكبيرة أو الصغيرة جداً','Very large / very small','1.23E+3','E','n'),TY('Restricted Number','رقم مقيَّد','Restricted','أصفار بادئة (أكواد، أرقام قومية)','Leading zeros (codes, IDs)','00123','007','n')]},
  {h:['تواريخ','Dates'],items:[TY('Date dd-mmm-yyyy','dd-mmm-yyyy','dd-mmm-yyyy','تاريخ','Date','31-Dec-2026','D','d'),TY('Date dd/mm/yyyy','dd/mm/yyyy','dd/mm/yyyy','تاريخ','Date','31/12/2026','D','d'),TY('Date mm/dd/yyyy','mm/dd/yyyy','mm/dd/yyyy','تاريخ','Date','12/31/2026','D','d'),TY('Date yyyy-mm-dd','yyyy-mm-dd','yyyy-mm-dd','تاريخ','Date','2026-12-31','D','d')]},
  {h:['عملة','Currency'],items:[TY('Dollar','دولار','Dollar','مبلغ بالدولار','Dollar amount','$1,234.56','$','c'),TY('Custom currency','عملة مخصصة','Custom currency','اختر رمز عملتك (EGP، SAR…)','Your own symbol (EGP, SAR…)','EGP 1,234.56','¤','c')]},
  {h:['نص','Text'],items:[TY('String','نصي','String','أسماء وملاحظات وأي نص','Names, notes and any text','Ahmed','A','s')]}]},
 measure:{title:['مستوى القياس','Measurement level'],cols:1,groups:[{items:[
  {v:'Scale',t:['كمّي','Scale'],d:['أرقام تُحسب لها متوسطات (العمر، الدخل، الدرجة)','Numbers you can average (age, income, score)'],g:GL.scale},
  {v:'Ordinal',t:['ترتيبي','Ordinal'],d:['فئات لها ترتيب (راضٍ جداً ← غير راضٍ)','Ordered categories (very satisfied → not at all)'],g:GL.ordinal},
  {v:'Nominal',t:['اسمي','Nominal'],d:['فئات بلا ترتيب (الجنس، المدينة، المجموعة)','Categories with no order (sex, city, group)'],g:GL.nominal}]}]},
 role:{title:['دور المتغير','Variable role'],cols:2,groups:[{items:[
  {v:'Input',t:['مُدخَل','Input'],d:['متغير مستقل أو مُفسِّر','Predictor / independent variable'],g:GL.input},
  {v:'Target',t:['هدف','Target'],d:['النتيجة التي تريد تفسيرها','The outcome you want to explain'],g:GL.target},
  {v:'Both',t:['كلاهما','Both'],d:['مُدخَل وهدف معاً','Used as input and target'],g:GL.both},
  {v:'None',t:['بلا','None'],d:['لا يدخل في التحاليل المقترحة','Left out of suggested analyses'],g:GL.none},
  {v:'Partition',t:['تجزئة','Partition'],d:['لتقسيم الحالات (تدريب / اختبار)','Splits cases (training / testing)'],g:GL.partition},
  {v:'Split',t:['تقسيم','Split'],d:['حلّل كل مجموعة على حدة','Analyse each group separately'],g:GL.split}]}]}};
export const labelOf=(f,v)=>{for(const g of SPEC[f].groups)for(const it of g.items)if(it.v===v)return it;return null};
export const glyph=(f,v)=>{const it=labelOf(f,v);return it?it.g:''};
// ---- المنتقي المنبثق ----
let cur=null,off=[];
export function closePop(){if(cur){cur.remove();cur=null}off.forEach(f=>f());off=[]}
export function pick(anchor,f,value,onPick){closePop();const S=SPEC[f],pop=document.createElement('div');pop.className='vpop w'+S.cols;pop.dir=document.documentElement.dir;pop.setAttribute('role','listbox');
 pop.innerHTML=`<div class="vpt0">${esc(tr(S.title))}</div>`+S.groups.map(g=>`${g.h?`<div class="vph">${esc(tr(g.h))}</div>`:''}<div class="vpg">${g.items.map(it=>`<button type="button" role="option" data-v="${esc(it.v)}" class="${it.v===value?'on':''}"><span class="vpi">${it.g}</span><span class="vpx"><span class="vpr"><b>${esc(tr(it.t))}</b>${it.ex?`<code dir="ltr">${esc(it.ex)}</code>`:''}</span>${tr(it.d)?`<small>${esc(tr(it.d))}</small>`:''}</span><span class="vpc">${GL.tick}</span></button>`).join('')}</div>`).join('');
 document.body.append(pop);cur=pop;
 const place=()=>{const r=anchor.getBoundingClientRect();pop.style.maxHeight='';const w=pop.offsetWidth,h=pop.offsetHeight,below=innerHeight-r.bottom-14,above=r.top-14;let x=document.documentElement.dir==='rtl'?r.right-w:r.left;x=Math.max(8,Math.min(x,innerWidth-w-8));let y;if(h<=below)y=r.bottom+6;else if(h<=above)y=r.top-h-6;else if(below>=above){y=r.bottom+6;pop.style.maxHeight=Math.max(220,below)+'px'}else{const mh=Math.max(220,above);pop.style.maxHeight=mh+'px';y=Math.max(8,r.top-Math.min(h,mh)-6)}pop.style.left=x+'px';pop.style.top=y+'px'};place();requestAnimationFrame(()=>pop.classList.add('in'));
 const sel=()=>pop.querySelector('.on')||pop.querySelector('button');sel().focus({preventScroll:true});
 pop.onclick=e=>{const b=e.target.closest('button[data-v]');if(!b)return;const v=b.dataset.v;closePop();anchor.focus&&anchor.focus({preventScroll:true});onPick(v)};
 pop.onkeydown=e=>{const bs=[...pop.querySelectorAll('button')],i=bs.indexOf(document.activeElement),k=e.key;
  if(k==='Escape'){e.preventDefault();closePop();anchor.focus&&anchor.focus()}
  else if(k==='ArrowDown'||k==='ArrowUp'||k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();const d=(k==='ArrowDown'||(k==='ArrowRight'&&document.documentElement.dir==='ltr')||(k==='ArrowLeft'&&document.documentElement.dir==='rtl'))?1:-1;bs[(i+d+bs.length)%bs.length].focus()}
  else if(k==='Tab'){e.preventDefault()}};
 const down=e=>{if(!pop.contains(e.target)&&!anchor.contains(e.target))closePop()},scr=e=>{if(pop.contains(e.target))return;const r=anchor.getBoundingClientRect();if(!anchor.isConnected||r.bottom<0||r.top>innerHeight)closePop();else place()};
 setTimeout(()=>document.addEventListener('mousedown',down,true));addEventListener('resize',closePop);document.addEventListener('scroll',scr,true);
 off=[()=>document.removeEventListener('mousedown',down,true),()=>removeEventListener('resize',closePop),()=>document.removeEventListener('scroll',scr,true)]}
// ---- نوافذ عامة ----
function modal(html,cls=''){const ov=document.createElement('div');ov.className='dlgov vdl';ov.innerHTML=`<div class="dlg vdlg ${cls}" dir="${document.documentElement.dir}" role="dialog">${html}</div>`;document.body.append(ov);
 const close=()=>ov.remove();ov.addEventListener('mousedown',e=>{if(e.target===ov)close()});ov.addEventListener('keydown',e=>{if(e.key==='Escape')close()});return{ov,close,q:s=>ov.querySelector(s)}}
const head=(ic,t,sub)=>`<div class="vdh"><span class="vdi">${ic}</span><div><h3>${esc(t)}</h3><p>${esc(sub)}</p></div></div>`;
export function askText({title,sub,value,placeholder,onOk}){const m=modal(`${head(GL.tags,title,sub||'')}<div class="vdb"><input class="vin" value="${esc(value||'')}" placeholder="${esc(placeholder||'')}" dir="auto"></div><div class="dfoot"><button class="go">${T('تأكيد','OK')}</button><button class="cx">${T('إلغاء','Cancel')}</button></div>`,'sm');
 const inp=m.q('.vin'),ok=()=>{const v=inp.value.trim();if(!v)return inp.focus();m.close();onOk(v)};m.q('.go').onclick=ok;m.q('.cx').onclick=m.close;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ok()}};inp.focus();inp.select()}
// ---- تسميات القيم (Values) ----
export const parseValues=s=>String(s||'').split(/[;\n]+/).map(p=>{const i=p.indexOf('=');return i<0?null:[p.slice(0,i).trim(),p.slice(i+1).trim()]}).filter(Boolean);
export function openValues(i,onSave){const v=store.vars[i],num=v.type==='Numeric';let rows=parseValues(v.values);if(!rows.length)rows=[['','']];
 const m=modal(`${head(GL.tags,T('تسميات القيم','Value labels')+' — '+v.name,T('اربط كل رمز في بياناتك باسم مفهوم، مثل 1 = ذكر و2 = أنثى. تظهر الأسماء في الجداول والرسوم.','Give each code in your data a readable name, e.g. 1 = Male, 2 = Female. Names appear in tables and charts.'))}<div class="vdb"><div class="vrh"><span>${T('القيمة','Value')}</span><span>${T('الاسم','Label')}</span><span></span></div><div class="vrows"></div><div class="vtools"><button class="vlink" data-add>${GL.plus}<span>${T('إضافة صف','Add row')}</span></button><button class="vlink" data-fill>${GL.wand}<span>${T('تعبئة من البيانات','Fill from data')}</span></button></div><div class="derr"></div></div><div class="dfoot"><button class="go">${T('حفظ','Save')}</button><button class="cx">${T('إلغاء','Cancel')}</button></div>`),box=m.q('.vrows'),err=m.q('.derr');
 const draw=(focus)=>{box.innerHTML=rows.map((r,x)=>`<div class="vr"><input data-x="${x}" data-p="0" value="${esc(r[0])}" dir="ltr" inputmode="${num?'decimal':'text'}" placeholder="1"><input data-x="${x}" data-p="1" value="${esc(r[1])}" dir="auto" placeholder="${esc(T('مثال: ذكر','e.g. Male'))}"><button class="vdel" data-del="${x}" title="${T('حذف','Remove')}">${GL.x}</button></div>`).join('');if(focus!=null){const e=box.querySelector(`[data-x="${focus}"][data-p="0"]`);e&&e.focus()}};draw();
 box.oninput=e=>{const t=e.target;if(t.dataset.x!=null)rows[+t.dataset.x][+t.dataset.p]=t.value};
 box.onclick=e=>{const d=e.target.closest('[data-del]');if(d){rows.splice(+d.dataset.del,1);if(!rows.length)rows=[['','']];draw()}};
 box.onkeydown=e=>{if(e.key==='Enter'&&e.target.dataset.x!=null){e.preventDefault();const x=+e.target.dataset.x;if(e.target.dataset.p==='0')box.querySelector(`[data-x="${x}"][data-p="1"]`).focus();else{if(x===rows.length-1){rows.push(['','']);draw(x+1)}else box.querySelector(`[data-x="${x+1}"][data-p="0"]`).focus()}}};
 m.q('[data-add]').onclick=()=>{rows.push(['','']);draw(rows.length-1)};
 m.q('[data-fill]').onclick=()=>{const have=new Set(rows.map(r=>r[0])),seen=new Set(),col=store.cols[i]||[];for(const x of col){if(x==null||x==='')continue;seen.add(x);if(seen.size>60)break}
  const vals=[...seen].sort((a,b)=>num?a-b:String(a).localeCompare(String(b)));if(seen.size>60){err.textContent=T('عدد القيم المختلفة كبير (أكثر من 60) — هذا المتغير غالباً لا يحتاج تسميات.','Too many distinct values (60+) — this variable probably needs no labels.');return}
  err.textContent='';rows=rows.filter(r=>r[0]!==''||r[1]!=='');for(const x of vals)if(!have.has(String(x)))rows.push([String(x),'']);if(!rows.length)rows=[['','']];draw(rows.findIndex(r=>r[1]===''))};
 m.q('.cx').onclick=m.close;
 m.q('.go').onclick=()=>{const out=[],keys=new Set();for(const [k,l] of rows){if(k===''&&l==='')continue;if(k===''||l===''){err.textContent=T('أكمل القيمة والاسم في كل صف أو احذف الصف الفارغ.','Fill both the value and the label in each row, or remove the empty row.');return}
   if(/[;=]/.test(k+l)){err.textContent=T('لا تستخدم الرمزين ; و = داخل القيمة أو الاسم.','Do not use ; or = inside a value or label.');return}
   if(num&&!Number.isFinite(+k.replace(',','.'))){err.textContent=T(`القيمة «${k}» ليست رقماً — المتغير رقمي.`,`“${k}” is not a number — this variable is numeric.`);return}
   if(keys.has(k)){err.textContent=T(`القيمة «${k}» مكررة.`,`Value “${k}” is repeated.`);return}keys.add(k);out.push(`${k}=${l}`)}
  m.close();onSave(out.join(';'))};
 box.querySelector('input')&&box.querySelector('input').focus()}
// ---- القيم المفقودة (Missing) ----
export function openMissing(i,onSave){const v=store.vars[i],num=v.type==='Numeric';let list=String(v.missing||'').split(/[,;\s]+/).filter(Boolean),mode=list.length?'d':'n';
 const m=modal(`${head(GL.none,T('القيم المفقودة','Missing values')+' — '+v.name,T('أرقام مثل 99 أو -1 تعني «لا إجابة». تُستبعد من كل التحاليل ولا تؤثر في المتوسطات.','Codes like 99 or -1 that mean “no answer”. They are left out of every analysis and never affect averages.'))}<div class="vdb"><div class="vseg2"><button data-m="n">${T('لا توجد','None')}</button><button data-m="d">${T('قيم محددة','Specific values')}</button></div><div class="vmz"><div class="vchips"></div><input class="vin" placeholder="${esc(T('اكتب قيمة ثم Enter','Type a value then Enter'))}" dir="ltr"><div class="vq"><small>${T('اقتراحات سريعة','Quick add')}</small>${['99','999','-99','-999','-1','9'].map(q=>`<button data-q="${q}">${q}</button>`).join('')}</div></div><div class="derr"></div></div><div class="dfoot"><button class="go">${T('حفظ','Save')}</button><button class="cx">${T('إلغاء','Cancel')}</button></div>`,'sm'),err=m.q('.derr'),chips=m.q('.vchips'),inp=m.q('.vin');
 const draw=()=>{m.ov.querySelectorAll('[data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));m.q('.vmz').hidden=mode==='n';chips.innerHTML=list.map((x,j)=>`<span class="vchip" dir="ltr">${esc(x)}<button data-r="${j}" title="${T('حذف','Remove')}">${GL.x}</button></span>`).join('')||`<em>${T('لم تُضف قيماً بعد','No values yet')}</em>`};
 const add=t=>{t=String(t).trim().replace(/,$/,'');if(!t)return true;if(num&&!Number.isFinite(+t)){err.textContent=T(`«${t}» ليست رقماً.`,`“${t}” is not a number.`);return false}if(!list.includes(t))list.push(t);err.textContent='';return true};
 m.ov.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.m){mode=b.dataset.m;draw();mode==='d'&&inp.focus()}else if(b.dataset.q){add(b.dataset.q);draw()}else if(b.dataset.r){list.splice(+b.dataset.r,1);draw()}};
 inp.onkeydown=e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();if(add(inp.value)){inp.value='';draw()}}};
 m.q('.cx').onclick=m.close;m.q('.go').onclick=()=>{if(inp.value.trim()&&!add(inp.value))return;m.close();onSave(mode==='n'?'':list.join(', '))};draw()}
