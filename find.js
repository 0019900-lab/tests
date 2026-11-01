// StatLab – بحث Ctrl+F في البيانات والمخرجات
import {T} from './i18n.js';import {ic} from './icons.js';import {store,cell} from './data.js';import {goTo} from './ui-grid.js';
const $=s=>document.querySelector(s);let bar,scope='data',hits=[],cur=-1;
const unmark=()=>{document.querySelectorAll('#outputBody mark.fm').forEach(m=>{const p=m.parentNode;p.replaceChild(document.createTextNode(m.textContent),m);p.normalize()})};
function search(){const q=bar.querySelector('input').value.trim().toLowerCase();unmark();hits=[];cur=-1;
 if(q){if(scope==='data'){const C=store.vars.length;for(let c=0;c<C&&hits.length<5000;c++)for(let r=0;r<store.n&&hits.length<5000;r++)if(String(cell(r,c)).toLowerCase().includes(q))hits.push([r,c])}
  else{const w=document.createTreeWalker($('#outputBody'),NodeFilter.SHOW_TEXT),nodes=[];while(w.nextNode())nodes.push(w.currentNode);
   for(const n of nodes){const t=n.nodeValue,l=t.toLowerCase();let i=l.indexOf(q);if(i<0)continue;const f=document.createDocumentFragment();let p=0;
    while(i>=0){f.append(t.slice(p,i));const m=document.createElement('mark');m.className='fm';m.textContent=t.slice(i,i+q.length);f.append(m);p=i+q.length;i=l.indexOf(q,p)}
    f.append(t.slice(p));n.parentNode.replaceChild(f,n)}hits=[...document.querySelectorAll('#outputBody mark.fm')]}}
 step(1,true)}
function step(d,first){const n=hits.length,s=bar.querySelector('.fcnt');if(!n){s.textContent=bar.querySelector('input').value?T('لا نتائج','No matches'):'';return}
 cur=first?0:(cur+d+n)%n;s.textContent=`${cur+1} / ${n}${n>=5000?'+':''}`;
 if(scope==='data')goTo(hits[cur][0],hits[cur][1],true);else{document.querySelectorAll('#outputBody mark.cur').forEach(m=>m.classList.remove('cur'));hits[cur].classList.add('cur');const b=hits[cur].closest('.blk');b&&b.classList.contains('col')&&0;hits[cur].scrollIntoView({block:'center',behavior:'smooth'})}}
export function openFind(sc){scope=sc||(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#outputPane')?'output':'data');
 if(!bar){bar=document.createElement('div');bar.id='findbar';document.body.append(bar);
  bar.addEventListener('keydown',e=>{if(e.key==='Escape')closeFind();else if(e.key==='Enter'){e.preventDefault();step(e.shiftKey?-1:1)}});
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;if(b.dataset.f==='x')closeFind();else if(b.dataset.f==='n')step(1);else if(b.dataset.f==='p')step(-1);else{scope=b.dataset.f;draw();search()}})}
 draw();bar.hidden=false;const i=bar.querySelector('input');i.focus();i.select();search()}
function draw(){const v=bar.querySelector('input')?.value||'';bar.innerHTML=`${ic('find',16)}<input placeholder="${T('ابحث…','Find…')}" value="${v.replace(/"/g,'&quot;')}"><span class="fcnt"></span><span class="sc"><button data-f="data" class="${scope==='data'?'on':''}">${T('البيانات','Data')}</button><button data-f="output" class="${scope==='output'?'on':''}">${T('المخرجات','Output')}</button></span><button data-f="p" title="${T('السابق','Previous')}">${ic('up',16)}</button><button data-f="n" title="${T('التالي','Next')}">${ic('down',16)}</button><button data-f="x" title="Esc">${ic('close',16)}</button>`;
 {let t;bar.querySelector('input').oninput=()=>{clearTimeout(t);t=setTimeout(search,220)}}}
export function closeFind(){if(bar){bar.hidden=true;unmark()}}
