import assert from 'node:assert/strict';
import {store,commit,undo,redo,setVar,parseDelimited,rowsToState,replaceAll,toCSV,toProject,fromProject,demoState,parseNum,show} from '../data.js';
// parseNum
assert.equal(parseNum('١٢٫٥'),12.5);assert.equal(parseNum('1,234.5'),1234.5);assert.ok(Number.isNaN(parseNum('abc')));assert.equal(parseNum(' '),null);
// commit auto-creates vars + undo/redo
let r=commit([{r:0,c:0,v:'5'},{r:0,c:1,v:'x'},{r:2,c:0,v:'7.5'}]);
assert.equal(store.vars.length,2);assert.equal(store.vars[0].type,'Numeric');assert.equal(store.vars[1].type,'String');assert.equal(store.n,3);
r=commit([{r:1,c:0,v:'abc'}]);assert.equal(r.rejected,1);
undo();assert.equal(store.vars.length,0);assert.equal(store.n,0);
redo();assert.equal(store.vars.length,2);assert.equal(show(2,0),'7.50');
// setVar
assert.equal(setVar(0,'name','age'),null);assert.ok(setVar(1,'name','age'));assert.ok(setVar(1,'name','1bad'));
assert.equal(setVar(0,'type','String'),null);assert.equal(store.cols[0][0],'5');undo();assert.equal(store.cols[0][0],5);
assert.equal(setVar(2,'name','نوع'),null);assert.equal(store.vars.length,3);
// CSV
const rows=parseDelimited('\uFEFFname;score;note\r\n"Ali";1,5;"a;""b"""\nSara;2;\n');
assert.deepEqual(rows[1],['Ali','1,5','a;"b"']);
const st=rowsToState(rows,'t');assert.equal(st.n,2);assert.equal(st.vars[1].type,'Numeric');assert.equal(st.vars[2].type,'String');
replaceAll(st,false);assert.equal(store.n,2);undo();assert.equal(store.vars.length,3);redo();
const csv=toCSV();assert.ok(csv.includes('"a;""b"""'));
const p=fromProject(toProject());assert.equal(p.vars.length,3);
// perf
const big=demoState(100000);replaceAll(big,true);
let t=performance.now();const ch=[];for(let i=0;i<50000;i++)ch.push({r:i,c:1,v:String(i)});commit(ch);console.log('paste 50k cells ms',Math.round(performance.now()-t));
t=performance.now();const rr=parseDelimited(toCSV());const s2=rowsToState(rr,'x');console.log('csv roundtrip 100k rows ms',Math.round(performance.now()-t),s2.n,s2.vars.length);
console.log('ALL PASS');
