// Smart-Analysis – يراقب تغييرات البيانات (تجهيز البيانات) ويسجّلها في سجل العمليات؛ يصنّف التغيير بمقارنة الحالة السابقة بالجديدة
import {onReplace} from './data.js';import {addOp} from './oplog.js';
export function classify(prev,st){const pn=prev.vars.map(v=>v.name),sn=st.vars.map(v=>v.name),P=new Set(pn),common=sn.filter(x=>P.has(x));
 const added=sn.filter(x=>!P.has(x)),removed=pn.filter(x=>!sn.includes(x)),data=st.name||'';
 if(prev.vars.length&&!common.length)return{fn:'data.load',title:'Data loaded',data,opts:{cases:st.n,variables:sn.length}};
 if(!prev.vars.length)return{fn:'data.load',title:'Data loaded',data,opts:{cases:st.n,variables:sn.length}};
 if(st.n!==prev.n)return{fn:'data.cases',title:'Cases changed',data,opts:{before:prev.n,after:st.n},fields:added.length?{added}:{}};
 if(added.length||removed.length)return{fn:'data.variables',title:'Variables changed',data,fields:{...(added.length?{added}:{}),...(removed.length?{removed}:{})}};
 const changed=sn.filter((x,i)=>{const j=pn.indexOf(x);return j>=0&&st.cols[i]!==prev.cols[j]});
 return{fn:'data.modify',title:changed.length?'Values modified':'Data re-ordered',data,fields:changed.length?{modified:changed}:{}}}
export const startWatch=()=>onReplace((prev,st,meta)=>addOp(meta?{data:st.name||'',...meta}:classify(prev,st)));
