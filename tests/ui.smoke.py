# اختبار واجهة حقيقي بمتصفح Chromium:  python3 tests/ui.smoke.py   (يحتاج playwright)
import subprocess,time,sys,os,json
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
out=os.environ.get('SHOTS','/tmp/shots');os.makedirs(out,exist_ok=True)
errs=[];res=[]
def chk(n,c):res.append((n,bool(c)));print(('PASS ' if c else 'FAIL ')+n)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1440,'height':860},accept_downloads=True)
  pg.on('console',lambda m:errs.append(m.text) if m.type in('error',) else None);pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/index.html');pg.wait_for_selector('.welcome',timeout=5000)
  chk('welcome shows',True);pg.wait_for_timeout(450);pg.screenshot(path=f'{out}/01_welcome.png')
  pg.click('[data-a=demo]');pg.wait_for_function("document.querySelector('#info').textContent.includes('100')",timeout=20000)
  chk('demo loaded',True)
  # guide docs complete
  chk('every live command documented',pg.evaluate("__statlab.undocumented().length")==0)
  pg.screenshot(path=f'{out}/02_main_ar.png')
  # run analyses
  names=pg.evaluate("document.querySelector('#grid thead').innerText")
  pg.evaluate("__statlab.ACT.frequencies()");pg.wait_for_selector('.dlg');pg.screenshot(path=f'{out}/03_dialog.png')
  pg.click('.vlist label >> nth=0');pg.click('.dlg .go');pg.wait_for_selector('#outputBody .blk')
  chk('frequencies output',pg.locator('#outputBody .blk').count()==1)
  pg.evaluate("__statlab.ACT.descriptives()");pg.wait_for_selector('.dlg');pg.click('.vlist label >> nth=0');pg.click('.dlg .go');pg.wait_for_function("document.querySelectorAll('#outputBody .blk').length==2")
  chk('table numbering',pg.locator('.tn').nth(0).inner_text().strip().endswith('1'))
  pg.evaluate("__statlab.ACT.outputWide()");pg.wait_for_timeout(350);pg.screenshot(path=f'{out}/04_output_wide.png')
  chk('outline lists items',pg.locator('#outline [data-go]').count()==2)
  # collapse, reorder, note
  pg.click('#outputBody .blk >> nth=0 >> [data-act=toggle]');chk('collapse',pg.locator('.blk.col').count()==1)
  pg.click('#outputBody .blk >> nth=0 >> [data-act=toggle]')
  pg.once('dialog',lambda d:d.accept('ملاحظة اختبار'));pg.click('.otb [data-k=addText]');chk('note added',pg.locator('.blk.txt').count()==1)
  pg.click('.otb [data-k=style]');chk('style toggle',pg.locator('#outputBody.apa-on').count()==0);pg.screenshot(path=f'{out}/05_modern_tables.png');pg.click('.otb [data-k=style]')
  # find in output
  pg.keyboard.press('Control+f');pg.wait_for_selector('#findbar:not([hidden])');pg.click('#findbar [data-f=output]');pg.fill('#findbar input','Mean');pg.wait_for_timeout(200)
  chk('output find marks',pg.locator('mark.fm').count()>0);pg.screenshot(path=f'{out}/06_find.png');pg.keyboard.press('Escape')
  # find in data
  pg.keyboard.press('Control+f');pg.click('#findbar [data-f=data]');pg.fill('#findbar input','5');pg.wait_for_timeout(200)
  chk('data find count',pg.locator('#findbar .fcnt').inner_text().startswith('1 /'));pg.keyboard.press('Escape')
  # exports
  for k,ext in [('html','.html'),('word','.doc'),('md','.md'),('xlsx','.xlsx')]:
   pg.click('.otb [data-k=export]')
   with pg.expect_download(timeout=8000) as d:pg.click(f'.xmenu [data-x={k}]')
   fn=d.value.suggested_filename;chk('export '+k,fn.endswith(ext));d.value.save_as(f'{out}/{fn}')
  # guide
  pg.keyboard.press('F1');pg.wait_for_selector('.guide');pg.wait_for_timeout(350);pg.screenshot(path=f'{out}/07_guide_start.png')
  for t in ['map','features','keys','icons','terms']:
   pg.click(f'.gnav [data-t={t}]');pg.wait_for_timeout(120);pg.screenshot(path=f'{out}/08_guide_{t}.png')
  chk('guide feature cards',True)
  pg.keyboard.press('Escape')
  # menu + language
  pg.click('#menubar .menu >> nth=5');pg.screenshot(path=f'{out}/09_menu_analyze.png');pg.keyboard.press('Escape');pg.mouse.click(700,500)
  pg.keyboard.press('Alt+l');pg.wait_for_timeout(200);chk('lang en',pg.evaluate("document.documentElement.lang")=='en')
  pg.screenshot(path=f'{out}/10_main_en.png');pg.click('.tab[data-view=var]');pg.screenshot(path=f'{out}/11_varview_en.png')
  pg.keyboard.press('Alt+d');pg.wait_for_timeout(200);pg.keyboard.press('Alt+l');pg.wait_for_timeout(200);pg.click('.tab[data-view=data]');pg.screenshot(path=f'{out}/12_dark_ar.png')
  # Arabic-layout shortcuts (code-based)
  pg.evaluate("document.body.focus()")
  pg.evaluate("dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK',key:'ل',ctrlKey:true,bubbles:true,cancelable:true}))");chk('Ctrl+K on Arabic layout',pg.locator('#palette:not([hidden])').count()==1);pg.keyboard.press('Escape')
  pg.evaluate("dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',key:'ي',altKey:true,bubbles:true,cancelable:true}))");chk('Alt+D on Arabic layout',pg.evaluate("document.documentElement.dataset.theme")=='light')
  chk('single guide button',pg.locator('#btnGuide').count()==1 and pg.locator('#toolbar [aria-label*=Guide],#toolbar [aria-label*=الدليل]').count()==0)
  chk('brand name',pg.title()=='Smart-Analysis')
  # about
  pg.evaluate("__statlab.ACT.about()");pg.wait_for_selector('.about');pg.wait_for_timeout(350);pg.screenshot(path=f'{out}/13_about.png')
  chk('no console errors',not errs)
  if errs:print(errs[:5])
  b.close()
finally:srv.terminate()
bad=[n for n,c in res if not c];print(f'ui: {len(res)-len(bad)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
