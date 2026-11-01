// Smart-Analysis – منشئ التقارير (نقي): يجمع عناصر المخرجات في تقرير بعنوان ومؤلف ومقدمة وملحق سجل العمليات
import {line} from './oplog.js';
export function buildReportItems(items,log,o={}){const en=o.lang==='en',kinds=o.kinds||'all',out=[];
 const title=String(o.title||'').trim()||(en?'Statistical analysis report':'تقرير التحليل الإحصائي');
 out.push({type:'text',h:true,text:title});
 const meta=[String(o.author||'').trim(),new Date(o.date||Date.now()).toISOString().slice(0,10)].filter(Boolean).join(' · ');
 out.push({type:'text',text:meta});
 if(String(o.intro||'').trim())out.push({type:'text',text:String(o.intro).trim()});
 let n=0;
 const list=Array.isArray(o.ids)?o.ids.map(id=>items.find(x=>x.id===id)).filter(Boolean):items,pick=Array.isArray(o.ids);
 for(const it of list){
  if(it.type==='text'){if((kinds==='all'||pick)&&String(it.text||'').trim()){out.push(it);}continue}
  if(kinds==='results'&&it.type==='chart'||kinds==='charts'&&it.type!=='chart')continue;
  out.push({...it,collapsed:false,explain:!!o.explain});n++}
 if(!n)throw new Error(en?'Nothing to include in the report':'لا توجد عناصر لإدراجها في التقرير');
 if(o.appendLog&&log&&log.length){out.push({type:'text',h:true,text:en?'Appendix: operations log':'ملحق: سجل العمليات'},{type:'text',text:log.map((e,i)=>`${i+1}. ${e.title} — ${line(e)}`).join('\n')})}
 return out}
