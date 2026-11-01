// Smart-Analysis – خطوة اختيار عناصر التقرير وترتيبها (خانات اختيار + أسهم)؛ تُرجع معرّفات العناصر المختارة بالترتيب
import {esc} from './report.js';
export const itemLabel=it=>it.type==='text'?'✎ '+String(it.text||'').slice(0,60):(it.type==='chart'?'▥ ':'▦ ')+(it.title||'');
export function pickItems(items,onDone){
 const ar=document.documentElement.lang==='ar',tr=(a,e)=>ar?a:e;let order=items.map((it,i)=>({id:it.id,label:itemLabel(it),on:true}));
 const ov=document.createElement('div');ov.className='dlgov rpk';
 const draw=()=>{ov.innerHTML=`<div class="dlg" dir="${ar?'rtl':'ltr'}"><h3>${tr('اختر عناصر التقرير ورتّبها','Choose and order report items')}</h3><div class="dbody"><div class="vlist rplist">${order.map((o,i)=>`<div class="rpr"><label><input type="checkbox" data-i="${i}"${o.on?' checked':''}> ${esc(o.label)}</label><span class="rpb"><button data-up="${i}"${i?'':' disabled'} title="↑">▲</button><button data-dn="${i}"${i<order.length-1?'':' disabled'} title="↓">▼</button></span></div>`).join('')}</div></div><div class="derr"></div><div class="dfoot"><button class="go">${tr('متابعة','Continue')}</button><button class="cx">${tr('إلغاء','Cancel')}</button></div></div>`;
  ov.querySelectorAll('[data-i]').forEach(c=>c.onchange=()=>{order[+c.dataset.i].on=c.checked});
  const mv=(i,d)=>{const j=i+d;if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];draw()};
  ov.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>mv(+b.dataset.up,-1));ov.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>mv(+b.dataset.dn,1));
  ov.querySelector('.cx').onclick=()=>ov.remove();
  ov.querySelector('.go').onclick=()=>{const ids=order.filter(o=>o.on).map(o=>o.id);if(!ids.length){ov.querySelector('.derr').textContent=tr('اختر عنصراً واحداً على الأقل','Select at least one item');return}ov.remove();onDone(ids)}};
 draw();document.body.append(ov)}
