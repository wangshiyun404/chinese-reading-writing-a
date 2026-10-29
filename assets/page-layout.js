/* Upgrade saved positions across the lesson-4 insertion and lesson-5 merge. */
(function(){
'use strict';var REV=5;
function page(p,revision){if(p===null||p===undefined)return p;var max=revision===1?520:revision===2?524:revision===3?523:524;if(typeof p!=='number'||p%1||p<1||p>max)throw new Error('备份页码不符合原课件范围，未覆盖现有记录。');if(revision===1&&p>120)p+=4;if(revision<=2)p=p===152?151:p>152?p-1:p;if(revision<=3&&p>=125)p+=1;return p>=126?p+3:p;}
function upgrade(obj){
 if(!obj||obj.format!=='sie1671a-rw-teaching-backup'||obj.version!==1||obj.courseId!=='SIE1671A-2026-fall')return obj;
 var revision=obj.pageRevision||1;if(revision===REV)return obj;if(revision!==1&&revision!==2&&revision!==3&&revision!==4)throw new Error('这份备份的课件版本暂不支持，未覆盖现有记录。');
 var copy=JSON.parse(JSON.stringify(obj)),d=copy.data;if(!d)return obj;
 if(d.bookmark)d.bookmark.page=page(d.bookmark.page,revision);
 Object.keys(d.records||{}).forEach(function(k){d.records[k].page=page(d.records[k].page,revision);});
 Object.keys(d.overrides||{}).forEach(function(k){var o=d.overrides[k],expand=revision===1&&o.endPage===120&&o.startPage>=94&&o.startPage<=120;o.startPage=page(o.startPage,revision);o.endPage=expand?124:page(o.endPage,revision);});
 copy.pageRevision=REV;return copy;
}
window.RWPageLayout={revision:REV,upgradeBackup:upgrade};
try{var key='sie1671a-rw-deck-2026-v1',raw=localStorage.getItem(key);if(raw){var o=JSON.parse(raw),rev=o.pageRevision||1;if(rev===1||rev===2||rev===3||rev===4){var old=o.page;if(old!==undefined)o.page=page(old,rev);o.pageRevision=REV;localStorage.setItem(key,JSON.stringify(o));var m=/p=(\d+)/.exec(location.hash);if(m&&+m[1]===old&&old!==o.page)history.replaceState(null,'','#p='+o.page);}}}catch(e){}
try{var k='sie1671a-rw-teaching-2026-v1',s=localStorage.getItem(k);if(s){var parsed=JSON.parse(s),next=upgrade(parsed);if(next!==parsed)localStorage.setItem(k,JSON.stringify(next));}}catch(e){}
})();
