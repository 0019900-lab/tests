# واجهة Variable View الموسّعة + سلامة اللغة في الوضع الإنجليزي.  python3 tests/ui.vars.py
import subprocess,time,sys,os,re
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8774','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
out=os.environ.get('SHOTS','/tmp/shots6');os.makedirs(out,exist_ok=True);res=[];errs=[]
def chk(n,c):res.append((n,bool(c)));print(('PASS ' if c else 'FAIL ')+n)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1440,'height':860})
  pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8774/index.html');pg.wait_for_selector('.welcome');pg.click('[data-a=demo]');pg.wait_for_function("document.querySelector('#info').textContent.includes('100')",timeout=20000)
  pg.click('.tab[data-view=var]');pg.wait_for_selector('#varGrid select')
  chk('Variable View has 11 columns like SPSS',pg.locator('#varGrid thead th').count()==12)  # + '#'
  chk('Type menu has 12 SPSS types',pg.locator('#varGrid tbody tr:first-child select[data-f=type] option').count()==12)
  chk('Align menu',pg.locator('#varGrid tbody tr:first-child select[data-f=align] option').count()==3)
  chk('Measure and Role menus intact',pg.locator('#varGrid tbody tr:first-child select[data-f=measure] option').count()==3 and pg.locator('#varGrid tbody tr:first-child select[data-f=role] option').count()==6)
  chk('Arabic gloss next to options',' · ' in pg.locator('#varGrid tbody tr:first-child select[data-f=type] option').first.inner_text())
  pg.screenshot(path=f'{out}/v1_varview_ar.png')
  # income (row 5) -> Dollar ; age (row 2) align center, columns wider
  pg.select_option('#varGrid select[data-i="4"][data-f=type]','Dollar')
  pg.fill('#varGrid input[data-i="1"][data-f=columns]','18');pg.press('#varGrid input[data-i="1"][data-f=columns]','Tab')
  pg.select_option('#varGrid select[data-i="1"][data-f=align]','Center')
  pg.click('.tab[data-view=data]');pg.wait_for_timeout(300)
  chk('Dollar display in Data View',pg.locator('#grid tbody tr:nth-child(1) td').nth(4).inner_text().startswith('$'))
  chk('Center alignment applied',pg.locator('#grid tbody tr:nth-child(1) td').nth(1).evaluate("e=>getComputedStyle(e).textAlign")=='center')
  w=pg.evaluate("[...document.querySelectorAll('#grid colgroup col')].slice(1,3).map(c=>parseInt(c.style.width))");chk('Columns controls width',w[1]==180 and w[0]==100)
  pg.screenshot(path=f'{out}/v2_data_formats.png')
  # date type from string via UI: sex->Date makes invalid values empty and undo restores
  pg.click('.tab[data-view=var]');pg.select_option('#varGrid select[data-i="2"][data-f=type]','Date dd/mm/yyyy');chk('string→date accepted',pg.locator('#varGrid select[data-i="2"][data-f=type]').input_value()=='Date dd/mm/yyyy')
  pg.keyboard.press('Control+z');pg.wait_for_timeout(200);pg.click('.tab[data-view=var]');chk('undo restores type',pg.locator('#varGrid select[data-i="2"][data-f=type]').input_value()=='String')
  # English mode: no Arabic except the language switch itself
  pg.keyboard.press('Alt+l');pg.wait_for_timeout(300);pg.click('.tab[data-view=var]');pg.screenshot(path=f'{out}/v3_varview_en.png')
  def arabic():return pg.evaluate("""()=>{const o=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode,t=n.nodeValue.trim();if(/[\\u0600-\\u06FF]/.test(t)){const p=n.parentElement;if(p&&p.offsetParent!==null&&!p.closest('.seg'))o.push(t.slice(0,60))}}return o}""")
  chk('Variable View clean in English',not arabic())
  pg.keyboard.press('F1');pg.wait_for_selector('.guide')
  for t in ['start','map','features','keys','icons','terms','news']:
    pg.click(f'.gnav [data-t={t}]');pg.wait_for_timeout(120);a=arabic();chk(f'guide:{t} has no Arabic in English mode',not a)
    if a:print('   ',a[:4])
    if t=='terms':pg.screenshot(path=f'{out}/v4_guide_terms_en.png')
  pg.keyboard.press('Escape');pg.keyboard.press('Alt+l');pg.wait_for_timeout(300)
  pg.keyboard.press('F1');pg.wait_for_selector('.guide');pg.click('.gnav [data-t=features]');pg.wait_for_timeout(250);pg.screenshot(path=f'{out}/v5_guide_features_ar.png');chk('latin runs isolated in Arabic guide',pg.locator('.gbody bdi').count()>10)
  pg.click('.gnav [data-t=keys]');pg.wait_for_timeout(200);pg.screenshot(path=f'{out}/v6_guide_keys_ar.png')
  chk('no console errors',not errs)
  if errs:print(errs[:5])
  b.close()
finally:srv.terminate()
bad=[n for n,c in res if not c];print(f'vars ui: {len(res)-len(bad)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
