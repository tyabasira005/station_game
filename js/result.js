/* result.js: result.html。play.html が保存した結果を表示します。結果がなければ index.html へ戻ります。 */
(function(){
'use strict';
var E=Ekitype;
var $=function(id){return document.getElementById(id)};
var r=E.getResult();
if(!r){location.replace('index.html');return}

/* 乗車した駅の数で称号を決める。スマホ版は入力が遅くなる分、基準を甘くしている */
function rank(n,mode){
  var f=mode==='pc'?1:0.8;
  if(n>=30*f)return ['のぞみ','終点まで一気に走り抜けました。'];
  if(n>=20*f)return ['ひかり','主要駅を確実に結ぶ速さです。'];
  if(n>=12*f)return ['特急','安定したペースで走れました。'];
  if(n>=6*f)return ['快速','あと少しで特急です。'];
  return ['各駅停車','ゆっくり確実に進みました。'];
}

var k=rank(r.boarded,r.mode);
$('rRank').textContent=k[0];
$('rSub').textContent=k[1]+' 運転時間は '+r.secs+' 秒でした。';
$('rWords').textContent=r.boarded;
$('rScore').textContent=E.fmt(r.score);
$('rAcc').textContent=r.acc;
$('rCombo').textContent=r.maxCombo;
$('rBest').innerHTML=r.isBest&&r.score>0
  ?'<b>この路線の自己ベストを更新しました</b>'
  :'この路線の自己ベスト <b>'+E.fmt(r.best)+'</b> 点';

/* 結果を見ているうちにモードを切り替えたら、結果は古くなるのでスタートへ戻る */
E.initMode(function(){location.href='index.html'});

document.addEventListener('keydown',function(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  var tag=document.activeElement?document.activeElement.tagName:'';
  if((e.key==='Enter'||e.key===' ')&&tag!=='BUTTON'&&tag!=='A'){e.preventDefault();location.href='play.html'}
});
})();
