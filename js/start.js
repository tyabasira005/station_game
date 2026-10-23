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

/* タイムアタックのコース一覧。data.js の COURSES から作る */
function buildCourses(){
  COURSES.forEach(function(c){
    var a=document.createElement('a');
    a.className='seg tac';a.href='play.html?c='+c.id;a.dataset.course=c.id;
    a.innerHTML='<span class="ty" data-t="'+c.ty+'">'+c.name+'</span>'+
      '<small>'+(c.grp==='jr'?c.route:c.stops().length+'駅')+'</small>'+
      '<small class="bt"></small>';
    document.getElementById(c.grp==='jr'?'taJr':'taSk').appendChild(a);
  });
}
function showTimes(){
  Array.prototype.forEach.call(document.querySelectorAll('.tac'),function(a){
    var t=E.getBestTime(a.dataset.course);
    a.querySelector('.bt').textContent=t?E.fmtTime(t):'--';
  });
}

E.initMode(function(){showBest();showTimes()});
buildCourses();
showTimes();
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
