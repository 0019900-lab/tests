// Smart-Analysis – بناء التقارير (بدون DOM، قابل للاختبار): جداول APA + تصدير HTML / Word / Markdown / Excel
import {chartSVG} from './charts.js';
import {explain,HEAD,explainText} from './explain.js';
export const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const BOUND=/^(Sig|p$|Correlation|Eta|Omega|Phi|Cram[eé]r)/i;
// APA: الإحصاءات المحصورة بين -1 و 1 (p, r, η²...) بتتكتب من غير صفر قبل العلامة العشرية
export function apaNum(x,head,row,i,lc){const s=String(x??'');if(!/^-?0\.\d+$/.test(s))return s;
 const bounded=BOUND.test(head[i]||'')||(i>=lc&&row.slice(0,lc).some(t=>/^(r|Sig\. \(2-tailed\))$/.test(t)));
 return bounded?s.replace(/^(-?)0\./,'$1.'):s}
export function tableHTML(t,n,o={}){const lc=t.lc||1,apa=o.apa!==false,lbl=o.lang==='en'?'Table':'جدول';
 const cell=(r,i)=>apa?apaNum(r[i],t.head,r,i,lc):r[i];
 let h=`<div class="tbw"><div class="cap"><span class="tn">${lbl} ${n}</span><span class="tt">${esc(t.cap)}</span><button class="cp" data-act="copy" title="Copy">⧉</button></div><div class="tw"><table class="ot${apa?' apat':''}"><thead><tr>${t.head.map((x,i)=>`<th class="${i<lc?'l':''}">${esc(x)}</th>`).join('')}</tr></thead><tbody>`;
 for(const r of t.rows)h+='<tr>'+t.head.map((_,i)=>`<td class="${i<lc?'l':''}">${esc(cell(r,i))}</td>`).join('')+'</tr>';
 return h+'</tbody></table></div>'+(t.note?`<div class="nt"><i>${o.lang==='en'?'Note.':'ملاحظة.'}</i> ${esc(t.note)}</div>`:'')+'</div>'}
// شكل (رسم) مرقّم بنمط APA: «Figure 1.» — الرسم يُرسم من المواصفة وقت العرض (فاتح/داكن/لغة) أو يُستعمل png جاهز لـ Word
export function figHTML(it,n,o={}){const en=o.lang==='en';
 return`<figure class="fig"><div class="cap"><span class="tn">${en?'Figure':'شكل'} ${n}</span><span class="tt">${esc(it.cap||it.title)}</span></div><div class="fw">${it.png?`<img src="${it.png}" width="640" alt="${esc(it.cap||it.title)}">`:chartSVG(it.kind,it.spec,{lang:o.lang,ink:o.ink})}</div></figure>`}
// شرح «فسّر نتائجي»: يُعرض في المخرجات ويُصدَّر مع التقرير عند تفعيله
export function explainHTML(it,o={}){const en=o.lang==='en',e=explain(it,o.lang);if(!e)return'';
 const sec=k=>e[k].length?`<h5>${HEAD[k][en?1:0]}</h5>${e[k].length>1?'<ul>'+e[k].map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>':`<p>${esc(e[k][0])}</p>`}`:'';
 return`<div class="xpl" dir="${en?'ltr':'rtl'}"><div class="xh">✦ ${en?'Explain my results':'فسّر نتائجي'}</div>${sec('meaning')}${sec('caution')}${sec('next')}</div>`}
export function itemHTML(it,o,counter){
 if(it.type==='text'&&it.h)return`<h2 class="rt">${esc(it.text)}</h2>`;
 if(it.type==='text')return`<section class="blk txt"><p>${esc(it.text).replace(/\n/g,'<br>')}</p></section>`;
 if(it.type==='chart')return`<section class="blk"><h4>${esc(it.title)}</h4>${it.collapsed?(counter.f++,''):figHTML(it,++counter.f,o)+(it.explain?explainHTML(it,o):'')}</section>`;
 let h=`<section class="blk"><h4>${esc(it.title)}</h4>`;
 if(!it.collapsed)h+=it.tables.map(t=>tableHTML(t,++counter.n,o)).join('')+(it.apa&&it.apa.length?`<div class="apaline"><b>APA</b><br>${[].concat(it.apa).map(esc).join('<br>')}</div>`:'')+(it.explain?explainHTML(it,o):'');
 else counter.n+=it.tables.length;
 return h+'</section>'}
export const itemsHTML=(items,o={})=>{const c={n:0,f:0};return items.map(it=>itemHTML(it,o,c)).join('')};
export const REPORT_CSS=`body{font:13.5px/1.5 "Segoe UI",Tahoma,Arial,sans-serif;color:#1b2230;max-width:980px;margin:28px auto;padding:0 20px}
header.rp{display:flex;align-items:center;gap:12px;border-bottom:3px solid #5b4bff;padding-bottom:10px;margin-bottom:18px}header.rp b{font-size:20px;background:linear-gradient(90deg,#0ea5ff,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}header.rp small{color:#6b7488;margin-inline-start:auto}
.blk{margin:0 0 26px;break-inside:avoid-page}.blk h4{margin:0 0 8px;font-size:15px;color:#4338ca}.tbw{margin:12px 0}.cap{font-size:13px;margin-bottom:4px}.tn{font-weight:700;margin-inline-end:8px}.tt{font-style:italic}.cp{display:none}
.tw{overflow-x:auto;direction:ltr}table.ot{border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}.ot th,.ot td{padding:4px 12px;text-align:right;white-space:nowrap}.ot .l{text-align:left}
.ot th{border-top:1.5px solid #000;border-bottom:1px solid #000;font-weight:600}.ot tbody tr:last-child td{border-bottom:1.5px solid #000}
.nt{font-size:12px;color:#555;margin-top:4px}.apaline{margin-top:8px;padding:8px 12px;background:#eef2ff;border-radius:8px;font-size:12.5px}.txt p{margin:0;padding:8px 12px;background:#fffbe6;border-inline-start:4px solid #f5c518;border-radius:6px}
svg{max-width:100%;height:auto}.fig{margin:14px 0;break-inside:avoid-page}.fw{margin-top:6px}.fw img{max-width:100%;height:auto}
.xpl{margin-top:12px;padding:10px 14px;border:1px solid #c7d2fe;border-inline-start:4px solid #6d5dfc;background:#f5f3ff;border-radius:10px;font-size:12.5px;line-height:1.7}.xpl .xh{font-weight:700;color:#4338ca;margin-bottom:2px}.xpl h5{margin:8px 0 2px;font-size:12.5px;color:#4338ca}.xpl p{margin:0}.xpl ul{margin:0;padding-inline-start:18px}
[dir=rtl] .nt i,[dir=rtl] .tn{font-style:normal}[dir=rtl] .nt i{font-weight:700}bdi{unicode-bidi:isolate}h2.rt{margin:18px 0 6px;font-size:22px;color:#4338ca}
@media print{body{margin:0;max-width:none}.xpl{background:none}.apaline{background:none;border:1px solid #bbb}}`;
export function docHTML(items,o={}){const en=o.lang==='en',d=new Date().toLocaleString(en?'en-GB':'ar-EG');
 return`<!doctype html><html lang="${en?'en':'ar'}" dir="${en?'ltr':'rtl'}"><head><meta charset="utf-8"><title>Smart-Analysis – ${en?'Output':'المخرجات'}</title><style>${REPORT_CSS}</style></head><body><header class="rp"><b>Smart-Analysis</b><span>${en?'Analysis output':'تقرير المخرجات'}</span><small>${esc(d)}</small></header>${itemsHTML(items,o)}</body></html>`}
// Word يفتح HTML بامتداد .doc (مع دعم RTL) — وليس ملف docx حقيقياً
export const wordHTML=(items,o={})=>docHTML(items,o).replace('<html ','<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" ');
export function toTSV(t){return[t.head,...t.rows].map(r=>r.map(x=>String(x??'')).join('\t')).join('\n')}
export function toMarkdown(items,o={}){const out=[],c={n:0,f:0},lbl=o.lang==='en'?'Table':'جدول';
 for(const it of items){if(it.type==='text'){out.push(it.text,'');continue}
  out.push(`## ${it.title}`,'');
  if(it.type==='chart'){out.push(`**${o.lang==='en'?'Figure':'شكل'} ${++c.f}.** *${it.cap||it.title}*`,'',`> ${o.lang==='en'?'Chart — see the HTML or PDF export for the figure.':'رسم بياني — يظهر الشكل في تصدير HTML أو PDF.'}`,'');if(it.explain)out.push(explainText(it,o.lang),'');continue}
  for(const t of it.tables){const n=++c.n,lc=t.lc||1,row=r=>'| '+t.head.map((_,i)=>String(o.apa===false?r[i]:apaNum(r[i],t.head,r,i,lc)).replace(/\|/g,'\\|')).join(' | ')+' |';
   out.push(`**${lbl} ${n}.** *${t.cap}*`,'',row(t.head.map(h=>h||' ')),'|'+t.head.map((_,i)=>i<lc?' :-- ':' --: ').join('|')+'|',...t.rows.map(row),'');if(t.note)out.push(`*${o.lang==='en'?'Note.':'ملاحظة.'}* ${t.note}`,'')}
  if(it.apa&&it.apa.length)out.push('> **APA**  ',...[].concat(it.apa).map(x=>'> '+x+'  '),'');if(it.explain)out.push(explainText(it,o.lang),'')}
 return out.join('\n')}
// صفوف Excel: كل جدول في ورقة. الأرقام النصية بتتحول لأرقام فعلية
const num=x=>{const s=String(x??'').trim();return/^-?\d+(\.\d+)?$/.test(s)?+s:x};
export function sheetsAOA(items){const out=[],used=new Set();let n=0;
 for(const it of items){if(it.type!=='result')continue;for(const t of it.tables){n++;let nm=`T${n} ${t.cap}`.replace(/[\\/?*[\]:]/g,'').slice(0,31),k=2;while(used.has(nm.toLowerCase()))nm=nm.slice(0,28)+' '+k++;used.add(nm.toLowerCase());
  out.push({name:nm,aoa:[[`Table ${n}: ${t.cap}`],t.head,...t.rows.map(r=>r.map(num))].concat(t.note?[[],['Note. '+t.note]]:[])})}}
 return out}
