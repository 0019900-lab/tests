// Smart-Analysis – ملف Word (.docx) حقيقي بدون مكتبات: ZIP (تخزين بلا ضغط) + WordprocessingML. دوال نقية قابلة للاختبار في Node والمتصفح
import {apaNum} from './report.js';
import {explain,HEAD} from './explain.js';
const enc=new TextEncoder();
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
export const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
// ZIP بطريقة STORE: files = [{name, data:Uint8Array}]
export function zip(files){const parts=[],cen=[];let off=0;
 const u16=(v,a)=>{a.push(v&255,v>>>8&255)},u32=(v,a)=>{a.push(v&255,v>>>8&255,v>>>16&255,v>>>24&255)};
 for(const f of files){const nm=enc.encode(f.name),crc=crc32(f.data),h=[];
  u32(0x04034b50,h);u16(20,h);u16(0x0800,h);u16(0,h);u16(0,h);u16(0x21,h);u32(crc,h);u32(f.data.length,h);u32(f.data.length,h);u16(nm.length,h);u16(0,h);
  parts.push(Uint8Array.from(h),nm,f.data);
  const c=[];u32(0x02014b50,c);u16(20,c);u16(20,c);u16(0x0800,c);u16(0,c);u16(0,c);u16(0x21,c);u32(crc,c);u32(f.data.length,c);u32(f.data.length,c);u16(nm.length,c);u16(0,c);u16(0,c);u16(0,c);u16(0,c);u32(0,c);u32(off,c);
  cen.push(Uint8Array.from(c),nm);off+=h.length+nm.length+f.data.length}
 const cl=cen.reduce((a,x)=>a+x.length,0),e=[];u32(0x06054b50,e);u16(0,e);u16(0,e);u16(files.length,e);u16(files.length,e);u32(cl,e);u32(off,e);u16(0,e);
 const all=[...parts,...cen,Uint8Array.from(e)],out=new Uint8Array(off+cl+e.length);let p=0;for(const x of all){out.set(x,p);p+=x.length}return out}
const X=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const run=(t,o={})=>`<w:r><w:rPr>${o.b?'<w:b/>':''}${o.i?'<w:i/>':''}${o.color?`<w:color w:val="${o.color}"/>`:''}${o.sz?`<w:sz w:val="${o.sz}"/>`:''}${o.rtl?'<w:rtl/>':''}</w:rPr><w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
const para=(runs,o={})=>`<w:p><w:pPr>${o.style?`<w:pStyle w:val="${o.style}"/>`:''}${o.keep?'<w:keepNext/>':''}${o.rtl?'<w:bidi/>':''}${o.fill?`<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`:''}<w:spacing w:after="${o.after??120}"/>${o.jc?`<w:jc w:val="${o.jc}"/>`:''}</w:pPr>${runs}</w:p>`;
// جدول APA: خط علوي وخط تحت الرأس وخط سفلي، دون حدود رأسية
function tableXML(t,lc,apa){const b=(side,sz)=>`<w:${side} w:val="single" w:sz="${sz}" w:space="0" w:color="000000"/>`,n=t.head.length,w=Math.floor(9000/n);
 const cell=(txt,i,top,bot,bold)=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:tcBorders>${top?b('top',12):''}${bot?b('bottom',bot===2?12:6):''}</w:tcBorders></w:tcPr>${para(run(txt,{b:bold,sz:21}),{jc:i<lc?'left':'right',after:0})}</w:tc>`;
 const rows=[`<w:tr><w:trPr><w:tblHeader/></w:trPr>${t.head.map((h,i)=>cell(h,i,1,1,1)).join('')}</w:tr>`];
 t.rows.forEach((r,ri)=>rows.push(`<w:tr><w:trPr><w:cantSplit/></w:trPr>${t.head.map((_,i)=>cell(apa?apaNum(r[i],t.head,r,i,lc):r[i],i,0,ri===t.rows.length-1?2:0,0)).join('')}</w:tr>`));
 return`<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblLayout w:type="autofit"/></w:tblPr><w:tblGrid>${t.head.map(()=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>`}
const b64=d=>{const s=String(d).split(',')[1]||'',bin=typeof atob==='function'?atob(s):Buffer.from(s,'base64').toString('binary'),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u};
const pngSize=u=>({w:(u[16]<<24|u[17]<<16|u[18]<<8|u[19])>>>0,h:(u[20]<<24|u[21]<<16|u[22]<<8|u[23])>>>0});
// يبني ملف docx كاملاً من عناصر المخرجات؛ الرسوم تحتاج it.png (data URL) وإلا تُكتب جملة بديلة
export function buildDocx(items,o={}){const en=o.lang==='en',rtl=!en,apa=o.apa!==false,media=[],body=[],c={n:0,f:0};
 const jc=rtl?'right':undefined,P=(r,x={})=>para(r,{rtl,jc,...x});
 body.push(P(run('Smart-Analysis',{b:1,sz:36,color:'4338CA'}),{style:'Title'}),P(run(new Date().toLocaleString(en?'en-GB':'ar-EG'),{color:'6B7488',sz:20})));
 for(const it of items){
  if(it.type==='text'&&it.h){body.push(P(run(it.text,{b:1,sz:32,color:'4338CA'}),{style:'Heading1',keep:1}));continue}
  if(it.type==='text'){body.push(P(run(it.text),{fill:'FFFBE6'}));continue}
  body.push(P(run(it.title,{b:1,color:'4338CA'}),{style:'Heading1',keep:1}));
  if(it.collapsed){c[it.type==='chart'?'f':'n']+=it.type==='chart'?1:it.tables.length;continue}
  if(it.type==='chart'){const n=++c.f;body.push(P(run(`${en?'Figure':'شكل'} ${n}. `,{b:1})+run(it.cap||it.title,{i:!rtl}),{keep:1}));
   if(it.png){const u=b64(it.png),id=media.length+1,sz=pngSize(u),cx=5760000,cy=Math.round(cx*(sz.h||1)/(sz.w||1));media.push({name:`word/media/image${id}.png`,data:u});
    body.push(P(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Figure ${n}" descr="${X(it.cap||it.title)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`,{jc:'center'}))}
   else body.push(P(run(en?'(Figure not embedded — export HTML or PDF to include it.)':'(الشكل غير مضمَّن — استعمل تصدير HTML أو PDF.)',{i:1,color:'6B7488'})))}
  else for(const t of it.tables){const n=++c.n,lc=t.lc||1;body.push(P(run(`${en?'Table':'جدول'} ${n}. `,{b:1})+run(t.cap,{i:!rtl}),{keep:1}),tableXML(t,lc,apa));
   if(t.note)body.push(P(run(en?'Note. ':'ملاحظة. ',{b:1,sz:20})+run(t.note,{sz:20}),{after:200}));else body.push(P('',{after:120}))}
  if(it.type!=='chart'&&it.apa&&it.apa.length)body.push(P(run('APA ',{b:1,sz:21})+run([].concat(it.apa).join(' '),{sz:21}),{fill:'EEF2FF'}));
  if(it.explain){const e=explain(it,o.lang);if(e){body.push(P(run('✦ '+(en?'Explain my results':'فسّر نتائجي'),{b:1,color:'4338CA'}),{fill:'F5F3FF',keep:1}));
   for(const k of ['meaning','caution','next'])if(e[k]&&e[k].length){body.push(P(run(HEAD[k][en?1:0],{b:1,sz:21}),{fill:'F5F3FF',keep:1}));for(const s of e[k])body.push(P(run((e[k].length>1?'• ':'')+s,{sz:21}),{fill:'F5F3FF',after:40}))}}}}
 const NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
 const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>${rtl?'<w:bidi/>':''}</w:sectPr></w:body></w:document>`;
 const font=rtl?'<w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Arial"/>':'<w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/>';
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="${en?'en-US':'en-US'}" w:bidi="ar-SA"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style></w:styles>`;
 const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
 const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
 const drels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${media.map((m,i)=>`<Relationship Id="rIdImg${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i+1}.png"/>`).join('')}</Relationships>`;
 const T=s=>enc.encode(s);
 return zip([{name:'[Content_Types].xml',data:T(ct)},{name:'_rels/.rels',data:T(rels)},{name:'word/document.xml',data:T(doc)},{name:'word/styles.xml',data:T(styles)},{name:'word/_rels/document.xml.rels',data:T(drels)},...media])}
