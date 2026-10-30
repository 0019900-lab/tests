import subprocess,sys,time
from playwright.sync_api import sync_playwright
root='/home/claude/Smart-Analysis-main';out='/tmp/deck/img'
srv=subprocess.Popen([sys.executable,'-m','http.server','8766','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SETUP="""async()=>{
const D=await import('./data.js'),A=await import('./analyses.js'),O=await import('./output.js'),C=await import('./charts.js');
let s=12345;const rnd=()=>(s=(s*1664525+1013904223)>>>0)/4294967296,nrm=()=>Math.sqrt(-2*Math.log(rnd()||1e-9))*Math.cos(2*Math.PI*rnd());
const n=60,id=[],grp=[],before=[],after=[],hours=[],sex=[];
for(let i=0;i<n;i++){id.push(i+1);grp.push(i%2?'F':'M');const b=70+8*nrm();before.push(+b.toFixed(1));const h=Math.max(1,7+2*nrm());hours.push(+h.toFixed(1));after.push(+(b+15+1.1*(h-7)+4*nrm()).toFixed(1));sex.push(grp[i])}
const V=[D.mkVar('id'),D.mkVar('before'),D.mkVar('after'),D.mkVar('hours'),{...D.mkVar('sex','String'),values:'M=Male;F=Female'},D.mkVar('sex2','String')];V[1].decimals=1;V[2].decimals=1;V[3].decimals=1;V[0].decimals=0;
D.replaceAll({name:'students',vars:V,cols:[id,before,after,hours,grp,grp],n},true);
const add=(fn,v)=>{const b=A.RUN[fn](v);O.addBlock(b.title,b.tables,b.apa,b.facts)};
add('descriptives',{vars:[1,2],variance:false,shape:false,se:false,sum:false});
add('ttestPair',{a:1,b:2});
add('ttestInd',{vars:[2],group:4,g1:'',g2:''});
const col=c=>D.store.cols[c];const bx=['M','F'].map(g=>({label:g==='M'?'Male':'Female',vals:col(2).filter((_,i)=>col(4)[i]===g)}));
O.addChart('Boxplot: after by sex','boxplot',C.boxSpec(bx,{yName:'after'}),'after by sex');
O.addChart('Scatter: after by hours','scatter',C.scatterSpec(col(3),col(2),{line:true,xName:'hours',yName:'after'}),'after by hours');
O.addChart('Histogram: before','histogram',C.histSpec(col(1),{name:'before'}),'Distribution of before');
O.addChart('Normal Q-Q Plot: after','qq',C.qqSpec(col(2),{name:'after'}),'Normal Q-Q plot of after');
return 1}"""
try:
  with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1440,'height':860},device_scale_factor=2)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8766/index.html');pg.wait_for_selector('.welcome');pg.evaluate("localStorage.lang='ar';localStorage.theme='light'")
    pg.keyboard.press('Escape');pg.wait_for_timeout(300)
    pg.evaluate("document.querySelectorAll('.welcome,.wov,.dlgov').forEach(x=>x.remove())")
    pg.evaluate(SETUP);pg.wait_for_timeout(300)
    # شرح لنتيجة اختبار T المرتبط
    pg.evaluate("document.querySelectorAll('#outputBody .blk')[1].querySelector('[data-act=explain]').click()")
    pg.evaluate("document.querySelector('#outputBody').scrollTo(0,0)");pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('#outputPane').classList.add('wide')");pg.wait_for_timeout(300)
    pg.screenshot(path=f'{out}/main.png')
    # شرح لنتيجة T (عنصر)
    el=pg.locator('#outputBody .blk').nth(1);el.scroll_into_view_if_needed();el.screenshot(path=f'{out}/explain_t.png')
    # معرض الرسوم: كل رسم كما يرسمه التطبيق
    for i in range(4):
        e=pg.locator('#outputBody .blk.cht').nth(i);e.scroll_into_view_if_needed();pg.wait_for_timeout(120);e.screenshot(path=f'{out}/chart{i}.png')
    # عنصر الرسم مع الشرح
    pg.evaluate("document.querySelectorAll('#outputBody .blk.cht')[3].querySelector('[data-act=explain]').click()");pg.wait_for_timeout(250)
    e=pg.locator('#outputBody .blk.cht').nth(3);e.scroll_into_view_if_needed();e.screenshot(path=f'{out}/chart_explain.png')
    pg.evaluate("document.querySelector('#outputPane').classList.remove('wide')");pg.evaluate("window.scrollTo(0,0)")
    pg.hover('#btnDalia');pg.wait_for_timeout(500);pg.screenshot(path=f'{out}/header.png',clip={'x':0,'y':0,'width':1440,'height':176})
    pg.mouse.move(700,600);pg.evaluate("__statlab.ACT.graphs()");pg.wait_for_selector('.gpick button');pg.wait_for_timeout(450);pg.screenshot(path=f'{out}/chooser.png')
    pg.keyboard.press('Escape');pg.wait_for_timeout(300)
    pg.evaluate("__statlab.CONFIG.ASK_DALIA_URL='about:blank'")
    pg.context.on('page',lambda q:q.close())
    pg.click('#btnDalia');pg.wait_for_selector('.dfx');pg.wait_for_timeout(430);pg.screenshot(path=f'{out}/transition.png')
    print('errors:',errs[:4]);b.close()
finally:srv.terminate()
