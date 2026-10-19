/* start.js: index.html。路線の選択と自己ベストの表示。出発は play.html へのリンクです。 */
(function(){
'use strict';
var E=Ekitype;
var segs=Array.prototype.slice.call(document.querySelectorAll('.seg'));

function showLine(){
  var l=E.getLine();
  segs.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.line===l?'true':'false')});
}
function showBest(){
  var b=E.getBest(E.getLine());
  document.getElementById('bestLine').innerHTML=b?'この路線の自己ベスト <b>'+E.fmt(b)+'</b> 点':'この路線はまだ記録がありません';
}

E.initMode(showBest);
segs.forEach(function(b){
  b.addEventListener('click',function(){E.setLine(b.dataset.line);showLine();showBest()});
});
showLine();
showBest();

/* PC版: Enter / Space で出発 */
document.addEventListener('keydown',function(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  var tag=document.activeElement?document.activeElement.tagName:'';
  if((e.key==='Enter'||e.key===' ')&&tag!=='BUTTON'&&tag!=='A'){e.preventDefault();location.href='play.html'}
});
})();
