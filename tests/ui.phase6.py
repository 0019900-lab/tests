# واجهة الميزات 0.12–0.15 في Chromium: Dunn+فسّر، التحليل العاملي، ترجيح الحالات، تعريف خصائص المتغير.  python3 tests/ui.phase6.py
import subprocess,time,sys,os
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8772','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
out=os.environ.get('SHOTS','/tmp/shots6b');os.makedirs(out,exist_ok=True);res=[];errs=[]
def chk(n,c):res.append((n,bool(c)));print(('PASS ' if c else 'FAIL ')+n)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1440,'height':860})
  pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text else None);pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8772/index.html');pg.wait_for_selector('.welcome');pg.click('[data-a=demo]');pg.wait_for_function("document.querySelector('#info').textContent.includes('100')||document.querySelectorAll('#outputBody').length>=0");pg.wait_for_timeout(500)
  chk('every command documented',pg.evaluate("__statlab.undocumented().length")==0)
  n0=lambda:pg.locator('#outputBody .blk').count()
  def run(act,fill):
    pg.evaluate(f"__statlab.ACT.{act}()");pg.wait_for_selector('.dlg');fill();pg.click('.dlg .go');pg.wait_for_timeout(400)
  def boxes(vals):
    for v in vals:pg.click(f'.dlg .vlist input[value="{v}"]')
  # demo: id,age,sex,grp,income,score
  run('factor',lambda:boxes([1,4,5]));chk('factor block',n0()==1);txt=pg.locator('#outputBody').inner_text();chk('factor tables',('KMO' in txt) and ('Communalities' in txt));pg.screenshot(path=f'{out}/factor.png')
  run('props',lambda:boxes([0,1,2,3,4,5]));txt=pg.locator('#outputBody').inner_text();chk('props block',n0()==2 and 'Suggested measure' in txt)
  # weight cap error path on 100k demo (age ~ 4M weighted cases > 3M)
  pg.evaluate("__statlab.ACT.weight()");pg.wait_for_selector('.dlg');pg.select_option('.dlg select[data-k=w]','1');pg.click('.dlg .go');pg.wait_for_timeout(400)
  chk('weight cap handled without crash',pg.locator('#wgtBadge:visible').count()==0)
  if pg.locator('.dlg').count():pg.keyboard.press('Escape');pg.wait_for_timeout(200)
  # small dataset for the positive weight path
  pg.evaluate("import('/data.js').then(m=>m.replaceAll({name:'t',vars:[m.mkVar('y','Numeric'),m.mkVar('g','String'),m.mkVar('w','Numeric')],cols:[[3,5,8,2,9,4,7,6],['A','A','A','A','B','B','B','B'],[2,1,3,4,2,2,1,3]],n:8},true))");pg.wait_for_timeout(300)
  pg.evaluate("__statlab.ACT.weight()");pg.wait_for_selector('.dlg');pg.select_option('.dlg select[data-k=w]','2');pg.click('.dlg .go');pg.wait_for_timeout(400)
  chk('weight badge shown',pg.locator('#wgtBadge:visible').count()==1)
  run('descriptives',lambda:boxes([0]));txt=pg.locator('#outputBody').inner_text();chk('weighted result titled and N=18',n0()==3 and 'weighted' in txt and '18' in txt)
  run('kruskal',lambda:(boxes([0]),pg.select_option('.dlg select[data-k=factor]','1')));chk('kruskal under weight (2 groups, no Dunn)',n0()==4)
  pg.evaluate("__statlab.ACT.weight()");pg.wait_for_selector('.dlg');pg.select_option('.dlg select[data-o=mode]','off');pg.click('.dlg .go');pg.wait_for_timeout(400);chk('weight badge hidden',pg.locator('#wgtBadge:visible').count()==0)
  pg.screenshot(path=f'{out}/final.png')
  chk('no console errors',not errs)
  if errs:print(errs[:3])
  b.close()
finally:srv.terminate()
bad=[n for n,c in res if not c];print(f'phase6 ui: {len(res)-len(bad)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
