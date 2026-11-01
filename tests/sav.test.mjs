import {readSav,writeSav} from '../sav.js';import {mkVar} from '../data.js';
let ok=0,bad=0;const chk=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};
const v1=mkVar('age');v1.decimals=0;v1.label='العمر بالسنوات';v1.measure='Scale';v1.missing='99';
const v2=mkVar('sex','String');v2.width=8;
const v3=mkVar('grp');v3.decimals=0;v3.measure='Nominal';v3.values='1=ذكر;2=Female';
const v4=mkVar('income_long_variable_name');v4.fmt='Comma';v4.decimals=2;
const v5=mkVar('d');v5.fmt='Date yyyy-mm-dd';v5.decimals=0;
const v6=mkVar('note','String');v6.width=30;
const st={name:'t',vars:[v1,v2,v3,v4,v5,v6],n:4,cols:[[30,null,45,99],['M','F',null,'M'],[1,2,1,2],[1234.5,2000,null,0.25],[19000,19001,null,20000],['مرحبا بالعالم','a longer text over eight bytes',null,'x']]};
const out=writeSav(st);chk('magic',String.fromCharCode(...out.slice(0,4))==='$FL2');
const buf=out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength);
function same(r,label){chk(label+' n',r.n===4);chk(label+' names',r.vars.map(v=>v.name).join()==='age,sex,grp,income_long_variable_name,d,note');
 chk(label+' age',JSON.stringify(r.cols[0])==='[30,null,45,99]');chk(label+' sex',JSON.stringify(r.cols[1])==='["M","F",null,"M"]');
 chk(label+' label',r.vars[0].label==='العمر بالسنوات');chk(label+' values',r.vars[2].values==='1=ذكر;2=Female');chk(label+' missing',r.vars[0].missing==='99');
 chk(label+' fmt',r.vars[3].fmt==='Comma'&&r.vars[3].decimals===2);chk(label+' income',JSON.stringify(r.cols[3])==='[1234.5,2000,null,0.25]');
 chk(label+' date',r.vars[4].fmt==='Date yyyy-mm-dd'&&JSON.stringify(r.cols[4])==='[19000,19001,null,20000]');
 chk(label+' text',r.cols[5][0]==='مرحبا بالعالم'&&r.cols[5][1]==='a longer text over eight bytes'&&r.cols[5][2]===null);chk(label+' measure',r.vars[2].measure==='Nominal'&&r.vars[0].measure==='Scale')}
same(readSav(buf),'plain');
// ضغط bytecode: نبني نسخة مضغوطة من نفس الملف لاختبار مسار القراءة المضغوط
{const u=new Uint8Array(buf),dv=new DataView(buf);let pos=176;const total=dv.getInt32(68,true);
 while(true){const t=dv.getInt32(pos,true);pos+=4;if(t===2){const hl=dv.getInt32(pos+4,true),nm=Math.abs(dv.getInt32(pos+8,true));pos+=28;if(hl){const L=dv.getInt32(pos,true);pos+=4+Math.ceil(L/4)*4}pos+=nm*8}
  else if(t===3){const c=dv.getInt32(pos,true);pos+=4;for(let k=0;k<c;k++){const L=u[pos+8];pos+=8+Math.ceil((L+1)/8)*8}}
  else if(t===4){const c=dv.getInt32(pos,true);pos+=4+c*4}
  else if(t===7){const sz=dv.getInt32(pos+4,true),c=dv.getInt32(pos+8,true);pos+=12+sz*c}
  else if(t===999){pos+=4;break}else throw new Error('x'+t)}
 const head=u.slice(0,pos);new DataView(head.buffer).setInt32(72,1,true);const body=[];const n=dv.getInt32(80,true);
 const codes=[];const raws=[];let cmds=[];const flush=()=>{while(cmds.length%8)cmds.push(0);for(let i=0;i<cmds.length;i+=8){body.push(Uint8Array.from(cmds.slice(i,i+8)));}};
 // بسيط: لكل 8 فتحات: بايت أوامر ثم البيانات الخام
 const slots=[];for(let i=0;i<n*total;i++)slots.push(u.slice(pos+i*8,pos+i*8+8));
 for(let i=0;i<slots.length;i+=8){const g=slots.slice(i,i+8),cm=new Uint8Array(8),raw=[];g.forEach((s,j)=>{const f=new DataView(s.buffer,s.byteOffset,8).getFloat64(0,true);
   if(s.every(b=>b===32))cm[j]=254;else if(f===-Number.MAX_VALUE)cm[j]=255;else if(Number.isInteger(f)&&f>-100&&f<152&&s.some(b=>b!==32)&&!(s[7]===32&&s[6]===32&&s[5]===32))cm[j]=f+100;else{cm[j]=253;raw.push(s)}});
  body.push(cm,...raw)}
 const all=[head,...body];const L=all.reduce((a,b)=>a+b.length,0),o=new Uint8Array(L+8);let q=0;for(const b of all){o.set(b,q);q+=b.length}o[q]=252;
 same(readSav(o.buffer),'compressed')}
console.log(`sav: ${ok} passed, ${bad} failed`);process.exit(bad?1:0)
