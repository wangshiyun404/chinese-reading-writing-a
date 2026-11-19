(() => {
'use strict';
const items=[['个','gè','苹果','píngguǒ','apple','yí ge'],['本','běn','书','shū','book','yì běn'],['支','zhī','笔','bǐ','pen','yì zhī'],['张','zhāng','纸','zhǐ','sheet of paper','yì zhāng'],['杯','bēi','茶','chá','cup of tea','yì bēi'],['瓶','píng','水','shuǐ','bottle of water','yì píng'],['件','jiàn','衣服','yīfu','item of clothing','yí jiàn'],['条','tiáo','裤子','kùzi','pair of trousers','yì tiáo'],['双','shuāng','鞋','xié','pair of shoes','yì shuāng'],['台','tái','电脑','diànnǎo','computer','yì tái'],['只','zhī','猫','māo','cat','yì zhī'],['辆','liàng','车','chē','car','yí liàng']];
const $=id=>document.getElementById(id), nums=['','一','两','三'];
const art=i=>`<div class="art" role="img" aria-label="${items[i][2]}" style="background-position:${i%4*100/3}% ${Math.floor(i/4)*50}%"></div>`;
let selected=0,count=1,q=0,solved=false;
function detail(){const d=items[selected];$('detail').innerHTML=`<div class="objects">${art(selected).repeat(count)}</div><div class="phrase">${nums[count]}<em>${d[0]}</em>${d[2]}</div><div class="pinyin">${count===1?d[5]:(count===2?'liǎng ':'sān ')+d[1]} ${d[3]}</div><p class="gloss">${d[4]}</p><p>${selected===8?'每幅图是一双鞋：两双鞋共有四只鞋。':selected===7?'注意：一条裤子，有两条裤腿。':'试着说：我有'+nums[count]+d[0]+d[2]+'。'}</p>`;document.querySelectorAll('.card').forEach((b,i)=>b.setAttribute('aria-pressed',i===selected));}
$('grid').innerHTML=items.map((d,i)=>`<button class="card" data-i="${i}" aria-pressed="${i===0}">${art(i)}<strong>${d[0]}</strong><small>${d[1]} · ${d[2]}</small></button>`).join('');
$('grid').onclick=e=>{const b=e.target.closest('[data-i]');if(b){selected=+b.dataset.i;detail();}};
$('counts').onclick=e=>{const b=e.target.closest('[data-n]');if(b){count=+b.dataset.n;document.querySelectorAll('[data-n]').forEach(x=>x.setAttribute('aria-pressed',x===b));detail();}};
function pause(){document.querySelectorAll('video').forEach(v=>v.pause());}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{pause();document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(o=>{if(o!==v)o.pause();})));
const order=[1,2,3,4,5,6,7,8,9,10,11,0];
function question(){solved=false;const i=order[q],d=items[i];$('progress').textContent=`第 ${q+1} / ${order.length} 题`;$('quizArt').innerHTML=art(i);$('question').textContent='一（　）'+d[2];$('feedback').textContent='';$('nextQuestion').hidden=true;const opts=[d[0],items[(i+4)%12][0],items[(i+7)%12][0]].sort((a,b)=>a.localeCompare(b,'zh'));$('answers').innerHTML=opts.map(x=>`<button>${x}</button>`).join('');}
$('answers').onclick=e=>{if(e.target.tagName!=='BUTTON'||solved)return;const d=items[order[q]];if(e.target.textContent===d[0]){solved=true;$('feedback').textContent='✓ 对了！一'+d[0]+d[2]+'。请再说一遍。';$('question').innerHTML='一<em>'+d[0]+'</em>'+d[2];$('nextQuestion').hidden=false;$('nextQuestion').textContent=q===11?'完成挑战 ✓':'下一题 →';}else{$('feedback').textContent='再想一想：'+d[2]+'的量词是什么？';e.target.disabled=true;}};
$('nextQuestion').onclick=()=>{if(q<11){q++;question();}else{$('feedback').textContent='12题全部完成！现在去“购物开口说”试一试。';$('nextQuestion').hidden=true;}};
$('restart').onclick=()=>{q=0;question();};
const products=[[1,12],[2,3],[3,1],[4,5],[5,2],[6,30],[7,50],[8,60],[0,3]];
$('product').innerHTML=products.map(([i])=>`<option value="${i}">${items[i][2]}</option>`).join('');
function shop(){const i=+$('product').value,n=+$('quantity').value,d=items[i],price=products.find(x=>x[0]===i)[1];$('shopArt').innerHTML=art(i);$('price').textContent=`练习单价：¥${price} / ${d[0]}`;$('order').innerHTML=nums[n]+'<em>'+d[0]+'</em>'+d[2];$('dialogue').hidden=true;$('model').textContent='展开对话示范';$('dialogue').innerHTML=`<p>顾客：你好！我要${nums[n]}${d[0]}${d[2]}。一共多少钱？</p><p>售货员：一${d[0]}${price}块，${nums[n]}${d[0]}一共${price*n}块。</p><p>顾客：好的，谢谢！</p>`;}
$('product').onchange=$('quantity').onchange=shop;$('model').onclick=()=>{const d=$('dialogue');d.hidden=!d.hidden;$('model').textContent=d.hidden?'展开对话示范':'收起示范，再试一次';};
window.addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='rw:quantifiers:hide')pause();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){pause();if(parent!==window)parent.postMessage({type:'rw:quantifiers:close'},'*');else location.href='index.html#p=279';}});
if(parent!==window)document.querySelector('.home').hidden=true;
detail();question();shop();
})();