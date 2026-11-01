// نافذة اختيار المتغيرات (عامة لكل التحاليل)
import {store} from './data.js';
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const last={};
export function dialog(id,spec,onRun){
 const ar=document.documentElement.lang==='ar',tr=p=>Array.isArray(p)?(ar?p[0]:p[1]):p,prev=last[id]||{};
 const ov=document.createElement('div');ov.className='dlgov';
 let h=`<div class="dlg" dir="${ar?'rtl':'ltr'}"><h3>${esc(tr(spec.title))}</h3><div class="dbody">`;
 for(const f of spec.fields){const el=store.vars.map((v,i)=>[v,i]).filter(([v])=>!f.num||v.type==='Numeric');
  h+=`<div class="fld"><label>${esc(tr(f.label))}</label>`;
  if(f.multi)h+=`<div class="vlist" data-k="${f.key}">`+el.map(([v,i])=>`<label><input type="checkbox" value="${i}"${(prev[f.key]||[]).includes(i)?' checked':''}> <span class="ty">${v.type==='Numeric'?'#':'A'}</span> ${esc(v.name)}${v.label?` <small>${esc(v.label)}</small>`:''}</label>`).join('')+'</div>';
  else h+=`<select data-k="${f.key}"><option value="-1">—</option>`+el.map(([v,i])=>`<option value="${i}"${prev[f.key]===i?' selected':''}>${esc(v.name)}${v.label?' – '+esc(v.label):''}</option>`).join('')+'</select>';
  h+='</div>'}
 h+='<div class="opts">';
 for(const o of spec.options||[]){const val=prev[o.key]??o.def,lb=esc(tr(o.label));
  if(o.type==='check')h+=`<label class="o"><input type="checkbox" data-o="${o.key}"${val?' checked':''}> ${lb}</label>`;
  else if(o.type==='sel')h+=`<label class="o">${lb} <select data-o="${o.key}">${o.opts.map(([k,l])=>`<option value="${k}"${val===k?' selected':''}>${esc(tr(l))}</option>`).join('')}</select></label>`;
  else h+=`<label class="o">${lb} <input data-o="${o.key}" type="${o.type==='num'?'number':'text'}" step="any" value="${esc(val??'')}"></label>`}
 h+=`</div></div><div class="derr"></div><div class="dfoot"><button class="go">${spec.go?tr(spec.go):ar?'تشغيل':'Run'}</button><button class="cx">${ar?'إلغاء':'Cancel'}</button></div></div>`;
 ov.innerHTML=h;document.body.append(ov);
 const q=s=>ov.querySelector(s),close=()=>ov.remove();
 const run=()=>{const v={};
  for(const f of spec.fields)v[f.key]=f.multi?[...ov.querySelectorAll(`[data-k="${f.key}"] input:checked`)].map(x=>+x.value):+q(`select[data-k="${f.key}"]`).value;
  for(const o of spec.options||[]){const e=q(`[data-o="${o.key}"]`);v[o.key]=o.type==='check'?e.checked:o.type==='num'?(e.value===''?0:+e.value):e.value}
  const err=spec.need&&spec.need(v);if(err){q('.derr').textContent=tr(err);return}
  try{onRun(v);last[id]=v;close()}catch(e){q('.derr').textContent=e.message}};
 q('.go').onclick=run;q('.cx').onclick=close;ov.addEventListener('mousedown',e=>{if(e.target===ov)close()});
 ov.addEventListener('keydown',e=>{if(e.key==='Escape')close();else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){e.preventDefault();run()}});
 (q('input,select')||q('.go')).focus()}
