/* ローマ字入力の判定（PC版）。し→shi/si、ん→n/nn、っ→子音重ね など表記ゆれに対応 */
var BASE={
'あ':['a'],'い':['i'],'う':['u'],'え':['e'],'お':['o'],
'か':['ka'],'き':['ki'],'く':['ku'],'け':['ke'],'こ':['ko'],
'さ':['sa'],'し':['shi','si'],'す':['su'],'せ':['se'],'そ':['so'],
'た':['ta'],'ち':['chi','ti'],'つ':['tsu','tu'],'て':['te'],'と':['to'],
'な':['na'],'に':['ni'],'ぬ':['nu'],'ね':['ne'],'の':['no'],
'は':['ha'],'ひ':['hi'],'ふ':['fu','hu'],'へ':['he'],'ほ':['ho'],
'ま':['ma'],'み':['mi'],'む':['mu'],'め':['me'],'も':['mo'],
'や':['ya'],'ゆ':['yu'],'よ':['yo'],
'ら':['ra'],'り':['ri'],'る':['ru'],'れ':['re'],'ろ':['ro'],
'わ':['wa'],'を':['wo'],
'が':['ga'],'ぎ':['gi'],'ぐ':['gu'],'げ':['ge'],'ご':['go'],
'ざ':['za'],'じ':['ji','zi'],'ず':['zu'],'ぜ':['ze'],'ぞ':['zo'],
'だ':['da'],'ぢ':['di'],'づ':['du'],'で':['de'],'ど':['do'],
'ば':['ba'],'び':['bi'],'ぶ':['bu'],'べ':['be'],'ぼ':['bo'],
'ぱ':['pa'],'ぴ':['pi'],'ぷ':['pu'],'ぺ':['pe'],'ぽ':['po']
};
var COMBO={
'きゃ':['kya'],'きゅ':['kyu'],'きょ':['kyo'],'ぎゃ':['gya'],'ぎゅ':['gyu'],'ぎょ':['gyo'],
'しゃ':['sha','sya'],'しゅ':['shu','syu'],'しょ':['sho','syo'],
'じゃ':['ja','zya','jya'],'じゅ':['ju','zyu','jyu'],'じょ':['jo','zyo','jyo'],
'ちゃ':['cha','tya','cya'],'ちゅ':['chu','tyu','cyu'],'ちょ':['cho','tyo','cyo'],
'にゃ':['nya'],'にゅ':['nyu'],'にょ':['nyo'],'ひゃ':['hya'],'ひゅ':['hyu'],'ひょ':['hyo'],
'みゃ':['mya'],'みゅ':['myu'],'みょ':['myo'],'りゃ':['rya'],'りゅ':['ryu'],'りょ':['ryo'],
'びゃ':['bya'],'びゅ':['byu'],'びょ':['byo'],'ぴゃ':['pya'],'ぴゅ':['pyu'],'ぴょ':['pyo']
};
function tokenize(y){
  var u=[];
  for(var i=0;i<y.length;i++){
    var ch=y.charAt(i),nx=y.charAt(i+1);
    if(ch==='っ'){u.push({t:'ltsu'});continue}
    if(ch==='ん'){u.push({t:'n'});continue}
    if(nx&&'ゃゅょ'.indexOf(nx)>=0&&COMBO[ch+nx]){u.push({t:'k',c:COMBO[ch+nx]});i++;continue}
    u.push({t:'k',c:BASE[ch]});
  }
  return u;
}
function cands(units,i){
  var u=units[i],nx=units[i+1],out=[];
  if(u.t==='ltsu'){
    if(nx&&nx.t==='k'){
      nx.c.forEach(function(c){var f=c.charAt(0);if('aiueon'.indexOf(f)<0&&out.indexOf(f)<0)out.push(f)});
    }
    out.push('xtu','ltu');
    return out;
  }
  if(u.t==='n'){
    out=['nn','xn'];
    if(nx&&nx.t==='k'&&nx.c.every(function(c){return 'aiueoy'.indexOf(c.charAt(0))<0}))out.unshift('n');
    return out;
  }
  return u.c;
}
function makeWord(k,y){return {kanji:k,yomi:y,units:tokenize(y),sts:[{ui:0,buf:'',done:[]}]}}
function stepSt(w,s,k){
  var out=[],cs=cands(w.units,s.ui),nb=s.buf+k;
  if(cs.some(function(c){return c.indexOf(nb)===0})){
    var complete=cs.indexOf(nb)>=0;
    var longer=cs.some(function(c){return c.length>nb.length&&c.indexOf(nb)===0});
    if(longer||!complete)out.push({ui:s.ui,buf:nb,done:s.done});
    if(complete)out.push({ui:s.ui+1,buf:'',done:s.done.concat([nb])});
  }
  if(s.buf&&cs.indexOf(s.buf)>=0){
    var adv={ui:s.ui+1,buf:'',done:s.done.concat([s.buf])};
    if(adv.ui<w.units.length)out=out.concat(stepSt(w,adv,k));
  }
  return out;
}
function press(w,k){
  var next=[],seen={};
  w.sts.forEach(function(s){
    stepSt(w,s,k).forEach(function(t){
      var id=t.ui+'|'+t.buf+'|'+t.done.join(',');
      if(!seen[id]){seen[id]=1;next.push(t)}
    });
  });
  if(!next.length)return 'miss';
  w.sts=next;
  for(var i=0;i<next.length;i++)if(next[i].ui>=w.units.length)return 'done';
  return 'ok';
}
function viewOf(w,s){
  var typed=s.done.join('')+s.buf,rest='';
  if(s.ui<w.units.length){
    var cs=cands(w.units,s.ui),cur='';
    if(s.buf){for(var i=0;i<cs.length;i++){if(cs[i].indexOf(s.buf)===0){cur=cs[i];break}}}
    else cur=cs[0];
    rest=cur.slice(s.buf.length);
    for(var j=s.ui+1;j<w.units.length;j++)rest+=cands(w.units,j)[0];
  }
  return {typed:typed,rest:rest};
}
function view(w){
  var best=null;
  w.sts.forEach(function(s){
    var v=viewOf(w,s);
    if(!best||v.rest.length<best.rest.length)best=v;
  });
  return best;
}
