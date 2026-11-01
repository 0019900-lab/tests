import {buildDocx,zip,crc32} from '../docx.js';
import {writeFileSync} from 'node:fs';
let ok=0,bad=0;const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};
t('crc32',crc32(new TextEncoder().encode('123456789'))===0xCBF43926);
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const items=[{type:'text',text:'ملاحظة <تجريبية> & نص'},
{type:'result',title:'T-test',tables:[{cap:'Group Statistics',head:['Group','N','Mean','Sig.'],rows:[['A','10','0.50','0.031'],['B','12','1.25','0.450']],lc:1,note:'Test note'}],apa:['t(20)=2.1, p=.03']},
{type:'chart',title:'Histogram',cap:'Dist',kind:'hist',spec:{},png},{type:'chart',title:'NoPng',kind:'hist',spec:{}}];
for(const lang of['ar','en']){const u=buildDocx(items,{lang});t('PK '+lang,u[0]===0x50&&u[1]===0x4B);writeFileSync(`/tmp/test_${lang}.docx`,u)}
console.log(`docx: ${ok} passed, ${bad} failed`);process.exit(bad?1:0)
