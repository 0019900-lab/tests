import {describe,addOp,getLog,clearLog,setLog,toMarkdown,toScript,line} from '../oplog.js';
let ok=0,bad=0;const t=(n,c)=>{c?ok++:(bad++,console.log('FAIL',n))};
const vars=[{name:'age'},{name:'sex'},{name:'inc'}];
const spec={fields:[{key:'vars',multi:true},{key:'group'}],options:[{key:'pct'},{key:'bins'}]};
const d=describe(spec,{vars:[0,2],group:1,pct:true,bins:10},vars);
t('fields',d.fields.vars.join()==='age,inc'&&d.fields.group[0]==='sex');t('opts',d.opts.pct===true&&d.opts.bins===10);
t('none -1',Object.keys(describe(spec,{vars:[],group:-1},vars).fields).join()==='vars');
t('empty md',toMarkdown({lang:'en'}).includes('No operations'));
const e=addOp({fn:'ttest',title:'T-Test',data:'demo',...d});
t('line',line(e)==='ttest(vars=[age, inc]; group=[sex]; pct=yes; bins=10)');
t('md',toMarkdown({lang:'en'}).includes('1. **T-Test**')&&toScript().trim()===line(e));
const saved=JSON.parse(JSON.stringify(getLog()));clearLog();setLog(saved.concat([{bad:1},null]));t('setLog roundtrip',getLog().length===1&&line(getLog()[0])===line(e));clearLog();t('clear',getLog().length===0);
console.log(`oplog: ${ok} passed, ${bad} failed`);process.exit(bad?1:0)
