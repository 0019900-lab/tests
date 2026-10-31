# واجهة المرحلة 5 في Chromium: المعالج + التحاليل الجديدة.  python3 tests/ui.phase5.py
import subprocess,time,sys,os
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8771','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
out=os.environ.get('SHOTS','/tmp/shots5');os.makedirs(out,exist_ok=True);res=[];errs=[]
def chk(n,c):res.append((n,bool(c)));print(('PASS ' if c else 'FAIL ')+n)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1440,'height':860})
  pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8771/index.html');pg.wait_for_selector('.welcome');pg.click('[data-a=demo]');pg.wait_for_function("document.querySelector('#info').textContent.includes('100')",timeout=20000)
  chk('every live command documented',pg.evaluate("__statlab.undocumented().length")==0)
  # --- wizard
  pg.keyboard.press('Alt+t');pg.wait_for_selector('.wiz .wopts');pg.wait_for_timeout(300);pg.screenshot(path=f'{out}/w1.png')
  for v in ['compare','num','ind','yes']:pg.click(f'.wiz [data-v={v}]')
  pg.wait_for_selector('.wres');chk('wizard recommends independent T',pg.locator('.wres h4').inner_text().startswith('اختبار T لعينتين مستقلتين'));pg.wait_for_timeout(200);pg.screenshot(path=f'{out}/w2.png')
  pg.click('.wiz [data-back]');pg.click('.wiz [data-v=no]');chk('non-normal -> Mann-Whitney','مان' in pg.locator('.wres h4').inner_text())
  pg.click('.wiz [data-run=mannwhitney]');pg.wait_for_selector('.dlg .vlist');chk('wizard opens the test dialog',True);pg.keyboard.press('Escape')
  # --- analyses
  def run(act,fill):
    pg.evaluate(f"__statlab.ACT.{act}()");pg.wait_for_selector('.dlg');fill();pg.click('.dlg .go');pg.wait_for_timeout(250)
  def boxes(vals):
    for v in vals:pg.click(f'.dlg .vlist input[value="{v}"]')
  n0=lambda:pg.locator('#outputBody .blk').count()
  run('normality',lambda:boxes([1,5]));chk('normality block',n0()==1)
  run('mannwhitney',lambda:(boxes([5]),pg.select_option('.dlg select[data-k=group]','2')));chk('mann-whitney block',n0()==2)
  run('wilcoxon',lambda:(pg.select_option('.dlg select[data-k=a]','1'),pg.select_option('.dlg select[data-k=b]','5')));chk('wilcoxon block',n0()==3)
  run('kruskal',lambda:(boxes([5]),pg.select_option('.dlg select[data-k=factor]','3')));chk('kruskal block',n0()==4)
  run('regression',lambda:(pg.select_option('.dlg select[data-k=dep]','5'),boxes([1,4])));chk('regression block',n0()==5)
  run('alpha',lambda:boxes([1,4,5]));chk('alpha block',n0()==6)
  chk('every result explainable',pg.evaluate("[...document.querySelectorAll('#outputBody .blk')].length")==6)
  pg.keyboard.press('Alt+e');pg.wait_for_timeout(400);chk('explain panel appears',pg.locator('#outputBody .blk:last-child .xpl').count()>0)
  pg.evaluate("__statlab.ACT.outputWide()");pg.wait_for_timeout(400);pg.screenshot(path=f'{out}/out.png')
  pg.evaluate("document.querySelector('#outputBody .blk:nth-child(5)').scrollIntoView()");pg.wait_for_timeout(300);pg.screenshot(path=f'{out}/reg.png')
  pg.keyboard.press('Alt+l');pg.wait_for_timeout(300);pg.keyboard.press('Alt+t');pg.wait_for_selector('.wiz .wopts');pg.screenshot(path=f'{out}/w_en.png');pg.keyboard.press('Escape')
  chk('no console errors',not errs)
  if errs:print(errs[:5])
  b.close()
finally:srv.terminate()
bad=[n for n,c in res if not c];print(f'phase5 ui: {len(res)-len(bad)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
