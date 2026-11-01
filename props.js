// Smart-Analysis – «تعريف خصائص المتغير»: فحص البيانات واقتراح مستوى القياس واكتشاف القيم بلا تسمية. دوال نقية.
const LABEL_KEYS=s=>{const m=new Set();for(const p of String(s||'').split(/[;\n]+/)){const i=p.indexOf('=');if(i>0)m.add(p.slice(0,i).trim())}return m};
export const suggestMeasure=({type,fmt,distinct,allInt,labeled})=>{
 if(type==='String')return'Nominal';if(String(fmt||'').startsWith('Date'))return'Scale';
 if(distinct<=2)return'Nominal';
 if(allInt&&distinct<=10)return labeled&&distinct<=4?'Nominal':'Ordinal';
 return'Scale'};
// raw: قيم العمود بعد استبعاد المفقود (null) — يعيد ملخص المتغير
export function scanVar(v,raw,cap=200){const cnt=new Map();let n=0,allInt=true,mn=Infinity,mx=-Infinity;
 for(const x of raw){if(x===null||x===undefined||x==='')continue;n++;if(cnt.size<cap||cnt.has(x))cnt.set(x,(cnt.get(x)||0)+1);if(typeof x==='number'){if(!Number.isInteger(x))allInt=false;if(x<mn)mn=x;if(x>mx)mx=x}else allInt=false}
 const lk=LABEL_KEYS(v.values),distinct=cnt.size,unl=[...cnt.keys()].filter(k=>lk.size&&!lk.has(String(k))).sort((a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a)<String(b)?-1:1),
  sug=suggestMeasure({type:v.type,fmt:v.fmt,distinct,allInt,labeled:lk.size>0});
 return{name:v.name,n,distinct,capped:distinct>=cap,min:Number.isFinite(mn)?mn:null,max:Number.isFinite(mx)?mx:null,allInt,labels:lk.size,unlabeled:unl,current:v.measure||'',suggested:sug,change:!!v.measure&&v.measure!==sug}}
