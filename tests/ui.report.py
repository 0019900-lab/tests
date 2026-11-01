# منشئ التقارير: python3 tests/ui.report.py
import subprocess,time,sys,os,zipfile
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8773','-d',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
errs=[];res=[]
def chk(n,c):res.append(bool(c));print(('PASS ' if c else 'FAIL ')+n)
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(accept_downloads=True)
  pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text else None);pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8773/index.html');pg.wait_for_selector('.welcome');pg.click('[data-a=demo]');pg.wait_for_timeout(1500)
  pg.evaluate("async()=>{const m=await import('./output.js');m.addBlock('Alpha table',[{cap:'Demo',head:['Group','N'],rows:[['A','10']],lc:1}],[],null);m.addBlock('Beta table',[{cap:'Demo',head:['Group','N'],rows:[['A','10'],['B','12']],lc:1}],[],null);window.__m=m}")
  pg.evaluate("window.__m.EXPORT.report()");pg.wait_for_selector('.rpk')
  chk('picker lists 2 items',len(pg.query_selector_all('.rpk .rpr'))==2)
  pg.click('.rpk [data-dn="0"]');pg.click('.rpk .go');pg.wait_for_selector('[data-o=title]')
  chk('dialog opens',pg.query_selector('[data-o=title]') is not None)
  pg.fill('[data-o=title]','تقرير تجريبي');pg.fill('[data-o=author]','داليا')
  with pg.expect_download() as d:pg.click('.dlgov .go')
  path=d.value.path();z=zipfile.ZipFile(path)
  chk('docx download',d.value.suggested_filename.endswith('.docx') and z.testzip() is None)
  xml=z.read('word/document.xml').decode()
  chk('title in docx','تقرير تجريبي' in xml and 'داليا' in xml)
  chk('order reversed',xml.index('Beta table')<xml.index('Alpha table'))
  chk('no console errors',not errs)
  b.close()
finally:srv.terminate()
print(f"report ui: {sum(res)} passed, {len(res)-sum(res)} failed",errs[:2]);sys.exit(0 if all(res) else 1)
