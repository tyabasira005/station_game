/* keys.js: play.html の入力キー。
   PC版: ローマ字キーボード（次に押すキーを光らせるガイド）。
   スマホ版: 純正配列のかな12キー。タップ/フリックで入力し、「小゛゜」「削除」は機能キー。
   押された入力は Keys.onInput(入力, 押したボタン) に渡します。
   依存: kana.js（FLICK / REV） */
var Keys=(function(){
'use strict';
var kb=document.getElementById('kb'),pad=document.getElementById('kana');
var keyEls={},padEls={},nextEl=null,flicks={};
var api={onInput:null};
function emit(k,btn){if(api.onInput)api.onInput(k,btn)}

/* ---------- ローマ字キーボード ---------- */
[['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['z','x','c','v','b','n','m']].forEach(function(r,i){
  var row=document.createElement('div');row.className='row r'+(i+1);
  r.forEach(function(k){
    var b=document.createElement('button');
    b.type='button';b.className='key';b.textContent=k;b.dataset.k=k;b.setAttribute('aria-label',k);
    keyEls[k]=b;row.appendChild(b);
  });
  kb.appendChild(row);
});

/* ---------- かなテンキー: 12キー配列、右に削除・空白・改行 ---------- */
/* [id, 表示, 種類, 行, 列, 行の幅] */
var KEYS=[
  ['あ','あ','flick',1,1],['か','か','flick',1,2],['さ','さ','flick',1,3],['del','削除','fn',1,4],
  ['た','た','flick',2,1],['な','な','flick',2,2],['は','は','flick',2,3],['sp','空白','fn',2,4],
  ['ま','ま','flick',3,1],['や','や','flick',3,2],['ら','ら','flick',3,3],['ret','改行','fn',3,4,2],
  ['cyc','小゛゜','fn',4,1],['わ','わ','flick',4,2],['p','、。?!','flick',4,3]
];
/* 機能キーが送る入力。null は押しても何も起きないキー */
var FN={cyc:'cyc',del:'del',sp:null,ret:null};
var KEYLAB={};
KEYS.forEach(function(d){
  KEYLAB[d[0]]=d[1];
  var b=document.createElement('button');
  b.type='button';
  b.className='key kkey'+(d[2]==='fn'?' fn':'')+(d[1].length>2?' sm':'');
  b.dataset.key=d[0];
  b.setAttribute('aria-label',d[1]);
  b.style.gridRow=d[3]+(d[5]?' / span '+d[5]:'');
  b.style.gridColumn=String(d[4]);
  var s=document.createElement('span');s.className='kc';s.textContent=d[1];
  b.appendChild(s);
  padEls[d[0]]=b;pad.appendChild(b);
});

/* ---------- フリック ---------- */
var DIRS=[[0,0],[-1,0],[0,-1],[1,0],[0,1]];           /* 0=タップ 1=左 2=上 3=右 4=下 */
var DT=['タップ','を←にフリック','を↑にフリック','を→にフリック','を↓にフリック'];
function dirOf(dx,dy){
  if(Math.sqrt(dx*dx+dy*dy)<16)return 0;
  if(Math.abs(dx)>Math.abs(dy))return dx<0?1:3;
  return dy<0?2:4;
}
/* 押している間、キーの上下左右に候補を出す */
function buildPop(btn,cands){
  var pr=pad.getBoundingClientRect(),br=btn.getBoundingClientRect();
  var w=br.width,h=br.height,x=br.left-pr.left,y=br.top-pr.top;
  x=Math.max(w,Math.min(x,pr.width-2*w));
  var pop=document.createElement('div');pop.className='pop';
  var cells=[];
  cands.forEach(function(c,d){
    if(!c)return;
    var el=document.createElement('div');el.className='pc';el.textContent=c;
    el.style.width=w+'px';el.style.height=h+'px';
    el.style.left=(x+DIRS[d][0]*w)+'px';el.style.top=(y+DIRS[d][1]*h)+'px';
    pop.appendChild(el);cells[d]=el;
  });
  pad.appendChild(pop);
  return {pop:pop,cells:cells};
}
pad.addEventListener('pointerdown',function(e){
  var b=e.target.closest?e.target.closest('.kkey'):null;
  if(!b)return;
  e.preventDefault();
  try{b.setPointerCapture(e.pointerId)}catch(err){}
  b.classList.add('down');
  var key=b.dataset.key;
  if(FN.hasOwnProperty(key)){flicks[e.pointerId]={btn:b};if(FN[key])emit(FN[key],b);return}
  var cands=FLICK[key],pp=buildPop(b,cands);
  pp.cells[0].classList.add('sel');
  flicks[e.pointerId]={btn:b,x0:e.clientX,y0:e.clientY,dir:0,pop:pp,cands:cands};
});
pad.addEventListener('pointermove',function(e){
  var f=flicks[e.pointerId];
  if(!f||!f.pop)return;
  var d=dirOf(e.clientX-f.x0,e.clientY-f.y0);
  if(d===f.dir)return;
  if(f.pop.cells[f.dir])f.pop.cells[f.dir].classList.remove('sel');
  f.dir=d;
  if(f.pop.cells[d])f.pop.cells[d].classList.add('sel');
});
function endFlick(e,commit){
  var f=flicks[e.pointerId];
  if(!f)return;
  delete flicks[e.pointerId];
  f.btn.classList.remove('down');
  if(f.pop){
    f.pop.pop.parentNode.removeChild(f.pop.pop);
    if(commit){var ch=f.cands[f.dir];if(ch)emit(ch,f.btn)}
  }
}
pad.addEventListener('pointerup',function(e){endFlick(e,true)});
pad.addEventListener('pointercancel',function(e){endFlick(e,false)});
/* 長押しのメニューを出さない */
document.addEventListener('contextmenu',function(e){e.preventDefault()});

/* ---------- 次に押すキーの表示とガイド文 ---------- */
function clearNext(){
  if(nextEl){nextEl.classList.remove('next');nextEl.removeAttribute('data-dir');nextEl.removeAttribute('data-n')}
  nextEl=null;
}
function setNextRoman(ch){
  clearNext();
  if(ch&&keyEls[ch]){nextEl=keyEls[ch];nextEl.classList.add('next')}
}
/* nx は kana.js の kview().next */
function setNextKana(nx){
  clearNext();
  if(!nx)return;
  var el,dir=0;
  if(nx.t==='cyc'){el=padEls.cyc;if(nx.left>1)el.setAttribute('data-n',nx.left)}
  else{var r=REV[nx.ch];el=padEls[r.key];dir=r.dir}
  if(!el)return;
  nextEl=el;el.classList.add('next');el.setAttribute('data-dir',dir);
}
function guide(nx){
  if(nx.t==='cyc')return '「小゛゜」をあと'+nx.left+'回（いま「'+nx.shown+'」）';
  var r=REV[nx.ch],t=r.dir===0?'「'+nx.ch+'」をタップ':nx.ch+': 「'+KEYLAB[r.key]+'」'+DT[r.dir];
  return nx.left>0?t+' → 小゛゜×'+nx.left:t;
}

api.clearNext=clearNext;
api.setNextRoman=setNextRoman;
api.setNextKana=setNextKana;
api.guide=guide;
api.romanEl=function(k){return keyEls[k]};
return api;
})();
