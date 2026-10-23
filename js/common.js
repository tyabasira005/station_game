/* common.js: 全ページ共通。モード切り替えボタン、路線・自己ベストの保存、画面間で渡す結果。
   他のスクリプトからは window.Ekitype として使います。 */
var Ekitype=(function(){
'use strict';
var root=document.documentElement;
var modeBtn=document.getElementById('modeBtn');
var LINES={jr:1,sk:1,both:1};

/* 保存先: 'local'=ずっと残す設定と記録、'session'=この画面遷移の間だけ渡す結果 */
function read(kind,key){try{return window[kind+'Storage'].getItem(key)}catch(e){return null}}
function write(kind,key,val){try{window[kind+'Storage'].setItem(key,val)}catch(e){}}

/* ---------- モード ---------- */
function isPc(){return root.getAttribute('data-mode')==='pc'}
function applyMode(m){
  root.setAttribute('data-mode',m);
  if(modeBtn)modeBtn.textContent=m==='pc'?'スマホ版に切り替え':'PC版に切り替え';
}
/* ボタンの文言を合わせ、押されたらモードを切り替える。onChange はページごとの後処理 */
function initMode(onChange){
  applyMode(isPc()?'pc':'mobile');
  if(!modeBtn)return;
  modeBtn.addEventListener('click',function(){
    var m=isPc()?'mobile':'pc';
    applyMode(m);
    write('local','ekitype.mode',m);
    modeBtn.blur();
    if(onChange)onChange(m);
  });
}

/* ---------- 路線: 'jr'(東海道線) / 'sk'(東海道新幹線) / 'both'(両方) ---------- */
function getLine(){var l=read('local','ekitype.line');return LINES.hasOwnProperty(l)?l:'both'}
function setLine(l){if(LINES.hasOwnProperty(l))write('local','ekitype.line',l)}

/* ---------- 自己ベスト（モード×路線ごと） ---------- */
function loadBests(){try{return JSON.parse(read('local','ekitype.bests')||'{}')||{}}catch(e){return {}}}
function bestKey(line){return (isPc()?'pc':'mobile')+'.'+line}
function getBest(line){return loadBests()[bestKey(line)]||0}
/* 更新したら true */
function saveBest(line,score){
  var b=loadBests(),k=bestKey(line);
  if(score>(b[k]||0)){b[k]=score;write('local','ekitype.bests',JSON.stringify(b));return true}
  return false;
}

/* ---------- タイムアタックの自己ベスト（モード×コースごと、短いほど良い） ---------- */
function loadTimes(){try{return JSON.parse(read('local','ekitype.times')||'{}')||{}}catch(e){return {}}}
function getBestTime(id){return loadTimes()[bestKey(id)]||0}
/* 更新したら true（初めての完走も true） */
function saveBestTime(id,ms){
  var b=loadTimes(),k=bestKey(id);
  if(!b[k]||ms<b[k]){b[k]=ms;write('local','ekitype.times',JSON.stringify(b));return true}
  return false;
}
/* ミリ秒 → 12.34 / 1:02.34 */
function fmtTime(ms){
  var t=Math.floor(ms/10),cs=t%100,s=Math.floor(t/100)%60,m=Math.floor(t/6000);
  return (m?m+':'+(s<10?'0':'')+s:String(s))+'.'+(cs<10?'0':'')+cs;
}

/* ---------- プレイ→結果の受け渡し ---------- */
function setResult(o){write('session','ekitype.result',JSON.stringify(o))}
function getResult(){try{return JSON.parse(read('session','ekitype.result'))}catch(e){return null}}

/* ---------- 小さな道具 ---------- */
function fmt(n){return n.toLocaleString('ja-JP')}
function flash(el,cls,ms){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(function(){el.classList.remove(cls)},ms)}

return {isPc:isPc,initMode:initMode,getLine:getLine,setLine:setLine,getBest:getBest,saveBest:saveBest,
        getBestTime:getBestTime,saveBestTime:saveBestTime,fmtTime:fmtTime,
        setResult:setResult,getResult:getResult,fmt:fmt,flash:flash};
})();
