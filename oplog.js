// Smart-Analysis – سجل العمليات: يسجّل كل تحليل (الأمر + المتغيرات بالأسماء + الخيارات) ويصدّره كنص قابل للمراجعة/الإعادة. دوال نقية بلا DOM
const LOG=[];
export const getLog=()=>LOG.slice();
export const clearLog=()=>{LOG.length=0};
// يستبدل السجل بمحتوى محفوظ (عند فتح مشروع)؛ يتجاهل أي عناصر غير صالحة
export function setLog(a){LOG.length=0;for(const e of Array.isArray(a)?a:[])if(e&&typeof e.fn==='string')LOG.push({t:+e.t||Date.now(),fn:e.fn,title:String(e.title||e.fn),data:String(e.data||''),fields:e.fields&&typeof e.fields==='object'?e.fields:{},opts:e.opts&&typeof e.opts==='object'?e.opts:{},note:String(e.note||'')})}
// يحوّل مدخلات نافذة الحوار (v) إلى {حقل: أسماء متغيرات} + {خيار: قيمة} باستعمال مواصفة النافذة
export function describe(spec,v,vars){const nm=i=>vars[i]?vars[i].name:String(i),fields={},opts={};
 for(const f of spec.fields||[]){const x=v[f.key];if(Array.isArray(x))fields[f.key]=x.map(nm);else if(Number.isInteger(x)&&x>=0)fields[f.key]=[nm(x)]}
 for(const o of spec.options||[]){if(v[o.key]!==undefined)opts[o.key]=v[o.key]}return{fields,opts}}
export function addOp(op){const e={t:op.t||Date.now(),fn:op.fn,title:op.title||op.fn,data:op.data||'',fields:op.fields||{},opts:op.opts||{},note:op.note||''};LOG.push(e);return e}
const fmt=x=>typeof x==='boolean'?(x?'yes':'no'):Array.isArray(x)?x.join(', '):String(x);
export const line=e=>`${e.fn}(${[...Object.entries(e.fields).map(([k,a])=>`${k}=[${a.join(', ')}]`),...Object.entries(e.opts).map(([k,x])=>`${k}=${fmt(x)}`)].join('; ')})`;
export function toMarkdown(o={}){const en=o.lang==='en',L=o.log||LOG,hd=en?'Operations log':'سجل العمليات';
 if(!L.length)return`# Smart-Analysis — ${hd}\n\n${en?'No operations recorded yet.':'لا توجد عمليات مسجّلة بعد.'}\n`;
 const out=[`# Smart-Analysis — ${hd}`,'',`${en?'Operations':'عدد العمليات'}: ${L.length}`,''];
 L.forEach((e,i)=>{out.push(`${i+1}. **${e.title}** — ${new Date(e.t).toISOString().replace('T',' ').slice(0,19)}${e.data?` — ${e.data}`:''}`,'   `'+line(e)+'`',...(e.note?['   '+e.note]:[]))});
 return out.join('\n')+'\n'}
export const toScript=(log=LOG)=>log.map(line).join('\n')+(log.length?'\n':'');
