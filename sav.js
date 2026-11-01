// Smart-Analysis – قراءة وكتابة ملفات SPSS (.sav): بيانات + تسميات المتغيرات والقيم + القيم المفقودة + مقياس القياس
import {mkVar,validName} from './data.js';
const DAY0=141428*86400,SYS=-Number.MAX_VALUE;
const FMT_IN={3:'Comma',32:'Dot',17:'Scientific notation',4:'Dollar',16:'Restricted Number',20:'Date dd-mmm-yyyy',38:'Date dd/mm/yyyy',23:'Date mm/dd/yyyy',39:'Date yyyy-mm-dd',22:'Date yyyy-mm-dd',24:'Date yyyy-mm-dd'};
const FMT_OUT={'Comma':[3,0],'Dot':[32,0],'Scientific notation':[17,0],'Dollar':[4,0],'Restricted Number':[16,0],'Date dd-mmm-yyyy':[20,11],'Date dd/mm/yyyy':[38,10],'Date mm/dd/yyyy':[23,10],'Date yyyy-mm-dd':[39,10]};
const isDate=f=>String(f).startsWith('Date');
export function readSav(buf){
 const dv=new DataView(buf),u8=new Uint8Array(buf),magic=String.fromCharCode(...u8.slice(0,4));
 if(magic==='$FL3')throw new Error('ZSAV');if(magic!=='$FL2')throw new Error('NOTSAV');
 let le=true;const lc=dv.getInt32(64,true);if(lc!==2&&lc!==3){le=false;if(dv.getInt32(64,false)!==2&&dv.getInt32(64,false)!==3)throw new Error('NOTSAV')}
 const i32=p=>dv.getInt32(p,le),f64=p=>dv.getFloat64(p,le),comp=i32(72),ncases=i32(80),bias=f64(84);
 if(comp===2)throw new Error('ZSAV');
 let enc='windows-1252',charcode=0,pos=176;const recs=[],longNames={},disp=[],labelSets=[];let encName='';
 const sub=(p,n)=>String.fromCharCode(...u8.slice(p,p+n));
 for(;;){const t=i32(pos);pos+=4;
  if(t===2){const type=i32(pos),hl=i32(pos+4),nm=i32(pos+8),pf=i32(pos+12);const short=sub(pos+20,8).trim();pos+=28;let label='';
   if(hl){const L=i32(pos);pos+=4;label=u8.slice(pos,pos+L);pos+=Math.ceil(L/4)*4}
   const miss=[];const nn=Math.abs(nm);for(let k=0;k<nn;k++){miss.push(f64(pos));pos+=8}
   recs.push({type,short,label,pf,miss,nm})}
  else if(t===3){const n=i32(pos);pos+=4;const ents=[];for(let k=0;k<n;k++){const v=u8.slice(pos,pos+8),L=u8[pos+8];ents.push([pos,u8.slice(pos+9,pos+9+L)]);pos+=8+Math.ceil((L+1)/8)*8}
   if(i32(pos)!==4)throw new Error('NOTSAV');const nv=i32(pos+4);const idx=[];for(let k=0;k<nv;k++)idx.push(i32(pos+8+k*4));pos+=8+nv*4;labelSets.push({ents,idx})}
  else if(t===6){const n=i32(pos);pos+=4+n*80}
  else if(t===7){const st=i32(pos),size=i32(pos+4),cnt=i32(pos+8);pos+=12;const L=size*cnt;
   if(st===3&&size===4&&cnt>=8)charcode=i32(pos+28);
   else if(st===11)for(let k=0;k+2<cnt;k+=3)disp.push([i32(pos+k*4),i32(pos+k*4+4),i32(pos+k*4+8)]);
   else if(st===13)sub(pos,L).split('\t').forEach(s=>{const e=s.indexOf('=');if(e>0)longNames[s.slice(0,e).trim()]=s.slice(e+1)});
   else if(st===20)encName=sub(pos,L).trim();
   pos+=L}
  else if(t===999){pos+=4;break}
  else throw new Error('NOTSAV')}
 const e=(encName||'').toUpperCase();enc=e.includes('UTF')||charcode===65001?'utf-8':e.includes('1256')||charcode===1256?'windows-1256':e.includes('8859-6')||charcode===28596?'iso-8859-6':'windows-1252';
 const td=new TextDecoder(enc),dec=b=>td.decode(b).replace(/[\0 ]+$/,'');
 // المتغيرات (تخطّي الأجزاء الإضافية: مقاطع -1 والنصوص الطويلة المقسّمة)
 const slotVar=[],vars=[];let slots=0;
 recs.forEach((r,i)=>{if(r.type===-1){slotVar.push(-1);return}
  const k=vars.length;vars.push({r,slot:i,k});slotVar.push(k)});
 const total=recs.length;
 // الاسم والبيانات الوصفية
 const used=new Set(),meta=vars.map((o,k)=>{const r=o.r,str=r.type>0;let nm=(longNames[r.short]||r.short).replace(/[^\p{L}\p{N}_.@#$]/gu,'_');if(!/^[\p{L}@]/u.test(nm))nm='V'+nm;let b=nm,j=2;while(used.has(nm.toLowerCase()))nm=b+'_'+j++;used.add(nm.toLowerCase());
  const v=mkVar(nm,str?'String':'Numeric');v.label=r.label.length?dec(r.label):'';
  const ft=(r.pf>>16)&255,w=(r.pf>>8)&255,d=r.pf&255;
  if(str)v.width=Math.max(r.type,1);else{v.fmt=FMT_IN[ft]||'Numeric';v.decimals=d;v.width=w||8}
  const dp=disp[k];if(dp){v.measure=str&&dp[0]===3?'Nominal':({1:'Nominal',2:'Ordinal',3:'Scale'}[dp[0]]||v.measure);if(dp[1])v.columns=dp[1];v.align=['Left','Right','Center'][dp[2]]||v.align}
  if(!str&&r.nm){const m=r.nm>0?r.miss:r.nm===-3?[r.miss[2]]:[];v.missing=m.filter(Number.isFinite).map(x=>+x.toFixed(10)).join(',')}
  return v});
 labelSets.forEach(ls=>{const ks=ls.idx.map(i=>slotVar[i-1]).filter(k=>k>=0);if(!ks.length)return;const out=[];
  for(const [p,lb] of ls.ents){const first=meta[ks[0]];let key;if(first.type==='Numeric'){const x=f64(p);key=String(+x.toFixed(10))}else key=dec(u8.slice(p,p+8));out.push(`${key}=${dec(lb).replace(/[;=]/g,' ')}`)}
  ks.forEach(k=>{if(!meta[k].values)meta[k].values=out.join(';')})});
 // البيانات
 const cols=meta.map(()=>[]);let p=pos,cmd=new Uint8Array(8),ci=8,so=-1,sv=null,eof=false;
 const slot=()=>{if(!comp){if(p+8>buf.byteLength){eof=true;return}so=p;p+=8;sv=undefined;return}
  for(;;){if(ci>=8){if(p+8>buf.byteLength){eof=true;return}cmd=u8.subarray(p,p+8);p+=8;ci=0}
   const c=cmd[ci++];if(c===0)continue;if(c===252){eof=true;return}
   if(c===253){if(p+8>buf.byteLength){eof=true;return}so=p;p+=8;sv=undefined;return}
   so=-1;if(c===254)sv=' ';else if(c===255)sv=null;else sv=c-bias;return}};
 const maxCases=ncases>=0?ncases:Infinity;let n=0;const sw=new Uint8Array(256*2);
 const tmp=[];
 while(n<maxCases&&!eof){let ok=true;
  for(let k=0;k<vars.length&&ok;k++){const r=vars[k].r;
   if(r.type===0){slot();if(eof){ok=false;break}let x;if(so>=0)x=f64(so);else x=sv===' '?null:sv;if(x!=null&&(x<=SYS*0.9999999||Number.isNaN(x)))x=null;tmp[k]=x}
   else{const ns=Math.ceil(r.type/8),bytes=new Uint8Array(ns*8);for(let s=0;s<ns;s++){slot();if(eof){ok=false;break}if(so>=0)bytes.set(u8.subarray(so,so+8),s*8);else bytes.fill(32,s*8,s*8+8)}
    if(!ok)break;tmp[k]=dec(bytes.subarray(0,r.type))}}
  if(!ok)break;for(let k=0;k<vars.length;k++){let x=tmp[k];const v=meta[k];if(v.type==='String')x=x===''?null:x;else if(x!=null&&String(v.fmt).startsWith('Date')){const f=(vars[k].r.pf>>16)&255;x=(f===22||f===24)?Math.round(x/86400-141428):Math.round(x/86400-141428)}cols[k].push(x)}n++}
 if(!meta.length)throw new Error('NOTSAV');
 return{vars:meta,cols,n}}
export function writeSav(s){
 const enc=new TextEncoder(),V=s.vars.length,n=s.n,fm=v=>v.fmt||v.type;
 const info=s.vars.map((v,c)=>{const str=v.type==='String';let w=0,sb=null;
  if(str){sb=new Array(n);for(let r=0;r<n;r++){const x=s.cols[c][r];const b=enc.encode(x==null?'':String(x));sb[r]=b;if(b.length>w)w=b.length}w=Math.min(Math.max(w,1),255)}
  return{str,w,sb,slots:str?Math.ceil(w/8):1}});
 const parts=[];const dv8=new DataView(new ArrayBuffer(8));
 const i32=x=>{const b=new Uint8Array(4);new DataView(b.buffer).setInt32(0,x,true);return b},f64=x=>{const b=new Uint8Array(8);new DataView(b.buffer).setFloat64(0,x,true);return b};
 const txt=(t,n)=>{const b=new Uint8Array(n).fill(32);b.set(enc.encode(t).subarray(0,n));return b},push=(...a)=>a.forEach(x=>parts.push(x));
 const total=info.reduce((a,i)=>a+i.slots,0),d=new Date(),M=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],p2=x=>String(x).padStart(2,'0');
 push(txt('$FL2',4),txt('@(#) SPSS DATA FILE Smart-Analysis',60),i32(2),i32(total),i32(0),i32(0),i32(n),f64(100),txt(`${p2(d.getDate())} ${M[d.getMonth()].slice(0,1)+M[d.getMonth()].slice(1).toLowerCase()} ${String(d.getFullYear()).slice(2)}`,9),txt(`${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`,8),txt('',64),new Uint8Array(3));
 const shorts=s.vars.map((_,i)=>'V'+String(i+1).padStart(7,'0')),slotIdx=[];let si=0;
 s.vars.forEach((v,c)=>{const I=info[c];slotIdx.push(si+1);let ft,fw,fd=0;
  if(I.str){ft=1;fw=I.w}else{const f=FMT_OUT[fm(v)];if(f){ft=f[0];fw=f[1]||Math.max(+v.width||8,8);fd=isDate(fm(v))?0:Math.min(+v.decimals||0,16)}else{ft=5;fw=Math.max(+v.width||8,(+v.decimals||0)+2,8);fd=Math.min(+v.decimals||0,16)}}
  fw=Math.min(fw,40);const pf=(ft<<16)|(fw<<8)|fd;
  const lab=v.label?enc.encode(v.label).subarray(0,255):null;
  const ms=!I.str?String(v.missing||'').split(/[,;\s]+/).filter(Boolean).map(Number).filter(Number.isFinite).slice(0,3):[];
  push(i32(2),i32(I.str?I.w:0),i32(lab?1:0),i32(ms.length),i32(pf),i32(pf),txt(shorts[c],8));
  if(lab){push(i32(lab.length));const pad=new Uint8Array(Math.ceil(lab.length/4)*4).fill(32);pad.set(lab);push(pad)}
  ms.forEach(m=>push(f64(m)));
  for(let k=1;k<I.slots;k++)push(i32(2),i32(-1),i32(0),i32(0),i32(0),i32(0),txt('',8));si+=I.slots});
 // تسميات القيم
 s.vars.forEach((v,c)=>{if(info[c].str||!v.values)return;const ents=String(v.values).split(/[;\n]+/).map(p=>{const i=p.indexOf('=');return i<0?null:[+p.slice(0,i).trim(),p.slice(i+1).trim()]}).filter(e=>e&&Number.isFinite(e[0])&&e[1]);if(!ents.length)return;
  push(i32(3),i32(ents.length));for(const [k,l] of ents){const b=enc.encode(l).subarray(0,120),tot=Math.ceil((b.length+1)/8)*8,o=new Uint8Array(tot);o[0]=b.length;o.set(b,1);push(f64(k),o)}
  push(i32(4),i32(1),i32(slotIdx[c]))});
 const ext=(st,size,cnt,body)=>push(i32(7),i32(st),i32(size),i32(cnt),body);
 ext(3,4,8,(()=>{const b=new Uint8Array(32),w=new DataView(b.buffer);[20,0,0,-1,1,1,2,65001].forEach((x,i)=>w.setInt32(i*4,x,true));return b})());
 ext(4,8,3,(()=>{const b=new Uint8Array(24),w=new DataView(b.buffer);w.setFloat64(0,-Number.MAX_VALUE,true);w.setFloat64(8,Number.MAX_VALUE,true);w.setUint32(16,0xFFFFFFFE,true);w.setUint32(20,0xFFEFFFFF,true);return b})());
 ext(11,4,3*V,(()=>{const b=new Uint8Array(12*V),w=new DataView(b.buffer);s.vars.forEach((v,c)=>{w.setInt32(c*12,{Nominal:1,Ordinal:2,Scale:3}[v.measure]||3,true);w.setInt32(c*12+4,Math.min(+v.columns||8,255),true);w.setInt32(c*12+8,{Left:0,Right:1,Center:2}[v.align]??1,true)});return b})());
 const ln=enc.encode(s.vars.map((v,c)=>shorts[c]+'='+v.name).join('\t'));ext(13,1,ln.length,ln);
 ext(20,1,5,enc.encode('UTF-8'));push(i32(999),i32(0));
 // البيانات
 const data=new Uint8Array(n*total*8),w=new DataView(data.buffer);let o=0;
 for(let r=0;r<n;r++)for(let c=0;c<V;c++){const I=info[c],v=s.vars[c];
  if(I.str){const b=I.sb[r];data.fill(32,o,o+I.slots*8);data.set(b.subarray(0,I.w),o);o+=I.slots*8}
  else{let x=s.cols[c][r];if(x==null||Number.isNaN(x))x=SYS;else if(isDate(fm(v)))x=x*86400+DAY0;w.setFloat64(o,x,true);o+=8}}
 push(data);const L=parts.reduce((a,b)=>a+b.length,0),out=new Uint8Array(L);let q=0;for(const b of parts){out.set(b,q);q+=b.length}return out}
