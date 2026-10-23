/* play.js: play.html のゲーム本体。
   発車標に3本の列車を並べ、先頭の行き先を「◯秒発」までに入力すると乗車できます。
   乗り遅れが3回で終了し、結果を保存して result.html へ移動します。
   依存: data.js / romaji.js / kana.js / common.js / keys.js */
(function(){
'use strict';
var E=Ekitype;
var LIVES=3,CARRY=2000;            /* 乗り遅れ上限 / 余った時間の持ち越し上限(ms) */
var $=function(id){return document.getElementById(id)};
var isPc=E.isPc,flash=E.flash,fmt=E.fmt;
var board=$('board');

var state='play',started=false,t0=0,timer=null,hiddenAt=0;
var W=null,queue=[],line=E.getLine(),frontDep=0;
var combo=0,maxCombo=0,score=0,correct=0,wrong=0,boarded=0,late=0,recent=[];
var evMsg='',evCls='',evUntil=0;

/* タイムアタック: URL の ?c=コースID で指定。なければ通常のスコアアタック */
var course=(function(){var m=/[?&]c=([a-z]+)/.exec(location.search);return m?findCourse(m[1]):null})();
var TA=!!course,list=[],total=0,nextIdx=0;

/* 最初のキーを押すまで時計は止まっている */
function clock(){return started?performance.now()-t0:0}
function strokeCount(w){return w.chars?w.chars.reduce(function(n,c){return n+1+c.idx},0):view(w).rest.length}
function mult(){return 1+Math.min(Math.floor(combo/10),4)*0.25}

/* ---------- 表示 ---------- */
function updateHud(){
  if(TA){
    $('scoreEl').textContent=E.fmtTime(clock());
    $('comboEl').textContent=boarded+'/'+total;
    $('multEl').textContent='';
    $('missEl').textContent=wrong;
    return;
  }
  $('scoreEl').textContent=fmt(score);
  $('comboEl').textContent=combo;
  $('multEl').textContent=mult()>1?'×'+mult().toFixed(2):'';
  var ls=$('lives').children;
  for(var i=0;i<ls.length;i++)ls[i].className=i<late?'x':'';
}
function event(msg,cls){evMsg=msg;evCls=cls;evUntil=performance.now()+1300}
function updateHint(){
  var h=$('hint'),txt='',cls='';
  if(evMsg&&performance.now()<evUntil){txt=evMsg;cls=evCls}
  else if(!TA&&started&&queue.length&&frontDep-clock()<=3000){txt='まもなく発車します';cls='bad'}
  else if(!isPc()){var nx=W?kview(W).next:null;txt=nx?Keys.guide(nx):''}
  else if(!started)txt=TA?'最初のキーでタイム計測が始まります':'最初のキーで発車標が動き出します';
  h.textContent=txt||' ';
  h.className='hint'+(cls?' '+cls:'');
}
function render(){
  var h='';
  if(isPc()){
    var v=view(W);
    if(v.typed)h+='<span class="done">'+v.typed+'</span>';
    if(v.rest)h+='<span class="cur">'+v.rest.charAt(0)+'</span><span class="rest">'+v.rest.slice(1)+'</span>';
    Keys.setNextRoman(v.rest?v.rest.charAt(0):null);
  }else{
    var k=kview(W);
    if(k.done)h+='<span class="done">'+k.done+'</span>';
    if(k.cur)h+='<span class="cur'+(k.comp!==null?' part':'')+'">'+k.cur+'</span>';
    if(k.rest)h+='<span class="rest">'+k.rest+'</span>';
    Keys.setNextKana(k.next);
  }
  $('romaji').innerHTML=h;
  updateHint();
}

/* ---------- 発車標 ---------- */
function typeOf(w){
  if(w[2]==='jr')return '普通';
  var o=['こだま'];
  if(NOZOMI[w[0]]||HIKARI[w[0]])o.push('ひかり');
  if(NOZOMI[w[0]])o.push('のぞみ');
  return o[Math.floor(Math.random()*o.length)];
}
function pickWord(){
  var all=WORDS.filter(function(w){return line==='both'||w[2]===line});
  var maxLen=4+boarded;                      /* 乗車するほど長い駅名が出る */
  var pool=all.filter(function(w){return w[1].length<=maxLen&&recent.indexOf(w[0])<0});
  if(!pool.length)pool=all.filter(function(w){return recent.indexOf(w[0])<0});
  if(!pool.length)pool=all;
  var w=pool[Math.floor(Math.random()*pool.length)];
  recent.push(w[0]);if(recent.length>8)recent.shift();
  return w;
}
function makeEntry(){
  var w=pickWord();
  var eng=isPc()?makeWord(w[0],w[1]):makeKana(w[0],w[1]);
  var f=Math.max(0.4,1-0.025*boarded);       /* 乗車するほど次の列車までの間隔が詰まる */
  var a=Math.max(3,Math.round((2.2+strokeCount(eng)*(isPc()?0.55:1.0))*f*2)/2);
  return {k:w[0],y:w[1],ty:typeOf(w),w:eng,a:a};
}
/* タイムアタック: コースの駅を順番に並べる */
function taEntry(i){
  var w=list[i];
  return {k:w[0],y:w[1],ty:course.ty,w:isPc()?makeWord(w[0],w[1]):makeKana(w[0],w[1]),a:0,idx:i};
}
function fill(){
  if(TA){while(queue.length<3&&nextIdx<total)queue.push(taEntry(nextIdx++));return}
  while(queue.length<3)queue.push(makeEntry());
}
function setTy(el,t){el.textContent=t;el.setAttribute('data-t',t)}
function renderBoard(){
  var f=queue[0];
  W=f.w;
  setTy($('fTy'),f.ty);
  $('dest').textContent=f.k;
  $('yomi').textContent=f.y;
  [1,2].forEach(function(i){
    var row=$('row'+(i+1)),e=queue[i];
    row.hidden=!e;                          /* 終点が近いと次の列車の行はなくなる */
    if(!e)return;
    setTy(row.children[0],e.ty);
    row.children[1].textContent=e.k;
  });
  updateTimes();
  render();
}
function updateTimes(){
  if(TA){                                   /* 発車時刻の代わりに「何駅目か」を出す */
    $('fTm').textContent=(queue[0].idx+1)+'/'+total;
    $('sig').setAttribute('data-s','g');
    board.classList.remove('urgent');
    [1,2].forEach(function(i){if(queue[i])$('row'+(i+1)).children[2].textContent=(queue[i].idx+1)+'/'+total});
    return;
  }
  var rem=Math.max(0,frontDep-clock());
  $('fTm').textContent=Math.ceil(rem/1000)+'秒発';
  $('sig').setAttribute('data-s',rem<=2500?'r':rem<=5000?'y':'g');
  board.classList.toggle('urgent',started&&rem<=3000);
  var t=rem;
  [1,2].forEach(function(i){
    t+=queue[i].a*1000;
    $('row'+(i+1)).children[2].textContent=Math.ceil(t/1000)+'秒発';
  });
}

/* ---------- 進行 ---------- */
function startGame(){
  clearInterval(timer);
  state='play';started=false;
  combo=maxCombo=score=correct=wrong=boarded=late=0;recent=[];queue=[];
  evMsg='';
  if(TA)setupTA();
  fill();
  frontDep=TA?Infinity:queue[0].a*1000;     /* タイムアタックに発車時刻はない */
  updateHud();
  renderBoard();
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
}
/* 途中でやめる: スタート画面へ戻る */
function quit(){
  clearInterval(timer);state='idle';
  location.href='index.html';
}
/* 終了: 結果を保存して結果画面へ（戻るボタンでプレイ画面に戻らないよう replace） */
function finish(){
  clearInterval(timer);state='over';Keys.clearNext();
  var tries=correct+wrong;
  var isBest=E.saveBest(line,score);
  E.setResult({
    boarded:boarded,score:score,
    acc:tries?Math.round(correct/tries*100):0,
    maxCombo:maxCombo,secs:Math.round(clock()/1000),
    isBest:isBest,best:E.getBest(line),
    mode:isPc()?'pc':'mobile',line:line
  });
  location.replace('result.html');
}
/* タイムアタックの表示切り替え（HUD のラベルなど） */
function setupTA(){
  list=course.stops();total=list.length;nextIdx=0;
  document.title='駅名タイピング タイムアタック';
  $('courseEl').hidden=false;
  $('courseEl').textContent=course.label+' '+course.route;
  $('hud').classList.add('ta');
  $('lab1').textContent='タイム';
  $('lab2').textContent='乗車';
  $('lab3').textContent='ミス';
  $('lives').hidden=true;
  $('missEl').hidden=false;
}
/* 完走: 最後の駅を打ち終えた時刻をタイムにして結果画面へ */
function finishTA(ms){
  clearInterval(timer);state='over';Keys.clearNext();
  var tries=correct+wrong;
  var isBest=E.saveBestTime(course.id,ms);
  E.setResult({
    game:'ta',course:course.id,label:course.label,route:course.route,
    boarded:total,ms:ms,wrong:wrong,
    acc:tries?Math.round(correct/tries*100):0,
    isBest:isBest,best:E.getBestTime(course.id),
    mode:isPc()?'pc':'mobile'
  });
  location.replace('result.html');
}
function departMiss(){
  late++;combo=0;
  var old=frontDep;
  queue.shift();
  fill();
  frontDep=old+queue[0].a*1000;
  event('発車しました 乗り遅れ','bad');
  flash(board,'miss',280);
  try{if(navigator.vibrate)navigator.vibrate(40)}catch(e){}
  updateHud();
  if(late>=LIVES){finish();return}
  renderBoard();
}
function tick(){
  if(TA){if(state==='play'){updateHud();updateHint()}return}
  var now=clock();
  while(state==='play'&&frontDep<=now)departMiss();
  if(state!=='play')return;
  updateTimes();
  updateHint();
}
/* k: ローマ字1文字 / かな / 'cyc'(小゛゜) / 'del'(削除) */
function input(k,btn){
  if(state!=='play')return;
  var pc=isPc();
  if(pc!==(k.length===1&&/[a-z]/.test(k)))return;     /* 他モードの入力は無視 */
  if(!started){started=true;t0=performance.now();timer=setInterval(tick,50)}
  if(frontDep<=clock()){tick();return}
  var r=pc?press(W,k):kpress(W,k);
  var el=pc?Keys.romanEl(k):btn;
  if(r==='undo'||r==='noop'){render();return}
  if(r==='miss'){
    wrong++;combo=0;
    if(el)flash(el,'bad',140);
    flash(board,'miss',260);
    try{if(navigator.vibrate)navigator.vibrate(15)}catch(e){}
    updateHud();
    return;
  }
  correct++;combo++;if(combo>maxCombo)maxCombo=combo;
  score+=Math.round(10*mult());
  if(pc&&el)flash(el,'down',100);
  if(r==='done'&&TA){
    var arrived=queue[0];
    boarded++;
    if(boarded>=total){finishTA(clock());return}
    queue.shift();
    fill();
    event(arrived.k+' 到着','ok');
    flash(board,'arrive',320);
    updateHud();
    renderBoard();
    return;
  }
  if(r==='done'){
    var left=Math.max(0,frontDep-clock()),bonus=50+Math.ceil(left/1000)*10;
    score+=bonus;boarded++;
    queue.shift();
    fill();
    frontDep=clock()+queue[0].a*1000+Math.min(left,CARRY);
    event('乗車 +'+bonus,'ok');
    flash(board,'arrive',320);
    updateHud();
    renderBoard();
  }else{
    updateHud();
    render();
  }
}

/* ---------- イベント ---------- */
Keys.onInput=input;
E.initMode(quit);                       /* プレイ中にモードを変えたらスタートへ戻る */
document.addEventListener('keydown',function(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(state!=='play')return;
  if(e.key==='Escape'){quit();return}
  if(!isPc())return;
  var k=null;
  if(e.key&&e.key.length===1&&/[a-zA-Z]/.test(e.key))k=e.key.toLowerCase();
  else if(e.code&&/^Key[A-Z]$/.test(e.code))k=e.code.charAt(3).toLowerCase();
  if(k){e.preventDefault();if(!e.repeat)input(k)}
});
/* タブを離れている間は時計を止める */
document.addEventListener('visibilitychange',function(){
  if(state!=='play'||!started)return;
  if(document.hidden){hiddenAt=performance.now();clearInterval(timer)}
  else if(hiddenAt){t0+=performance.now()-hiddenAt;hiddenAt=0;timer=setInterval(tick,50)}
});

startGame();
})();
