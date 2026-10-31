// Smart-Analysis service worker — الإصدار يتزامن مع version.js (انظر tools/bump.mjs)
const V='smart-analysis-v0.12.2',F=['./', 'index.html', 'styles.css', 'app.js', 'data.js', 'ui-grid.js', 'files.js', 'stats.js', 'output.js', 'dialog.js', 'analyses.js', 'vendor/xlsx.full.min.js', 'manifest.webmanifest', 'icon.svg', 'report.js', 'i18n.js', 'icons.js', 'guide.js', 'guide-data.js', 'welcome.js', 'find.js', 'wizard.js', 'prep2.js', 'merge.js', 'varpicker.js', 'keys.js', 'charts.js', 'explain.js', 'config.js', 'transform.js', 'assets/dalia-128.png', 'assets/dalia-256.png', 'assets/logo.png', 'assets/mark.png', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/favicon-32.png', 'version.js', 'update.js', 'guide-learn.js'];
// تثبيت متسامح: ملف ناقص لا يُفشل التثبيت كله (كان addAll يُفشله فيبقى الإصدار القديم عالقاً)
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>Promise.allSettled(F.map(u=>c.add(new Request(u,{cache:'reload'}))))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
// الشبكة أولاً للكود (فيصل أي تحديث فوراً) ثم الكاش دون اتصال؛ الكاش أولاً للأصول الثقيلة الثابتة
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 const heavy=/\/(vendor|assets)\//.test(u.pathname);
 if(heavy)return e.respondWith(caches.match(r).then(c=>c||fetch(r).then(x=>{const k=x.clone();caches.open(V).then(c=>c.put(r,k));return x})));
 e.respondWith(fetch(r,{cache:'no-cache'}).then(x=>{if(x.ok){const k=x.clone();caches.open(V).then(c=>c.put(r,k))}return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(c=>c||caches.match('index.html'))))});
