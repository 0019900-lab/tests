// Smart-Analysis – التحقق من التحديثات وإظهار شريط «نسخة جديدة» دون إعادة تحميل قسرية (حتى لا تضيع بيانات المستخدم)
import {T} from './i18n.js';import {VERSION} from './version.js';
let reg=null;
function bar(){if(document.querySelector('.updbar'))return;const d=document.createElement('div');d.className='updbar';d.setAttribute('role','status');
 d.innerHTML=`<span>${T('تم تحديث Smart-Analysis إلى نسخة جديدة. احفظ عملك ثم أعد التحميل لتفعيلها.','Smart-Analysis was updated. Save your work, then reload to use the new version.')}</span><button class="go">${T('إعادة التحميل','Reload')}</button><button class="x" aria-label="×">×</button>`;
 d.querySelector('.go').onclick=()=>location.reload();d.querySelector('.x').onclick=()=>d.remove();document.body.append(d)}
export function initUpdate(){if(!('serviceWorker'in navigator)||location.protocol==='file:')return;
 const had=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)bar()});
 navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{reg=r;r.update().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)r.update().catch(()=>{})});setInterval(()=>r.update().catch(()=>{}),36e5)}).catch(()=>{})}
export async function checkNow(){if(!reg)return T('التحديث التلقائي غير متاح في هذا الوضع.','Auto-update is not available in this mode.');
 try{await reg.update();return T(`أنت على الإصدار ${VERSION}. إن وُجدت نسخة أحدث فسيظهر شريط التحديث.`,`You are on version ${VERSION}. If a newer one exists, an update bar will appear.`)}catch{return T('تعذّر التحقق (لا اتصال؟).','Could not check (offline?).')}}
