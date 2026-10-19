/* かなフリック入力の判定（スマホ版）。濁点・半濁点・小書きは「小゛゜」キーを押す回数で切り替える */
var FLICK={
'あ':['あ','い','う','え','お'],'か':['か','き','く','け','こ'],'さ':['さ','し','す','せ','そ'],
'た':['た','ち','つ','て','と'],'な':['な','に','ぬ','ね','の'],'は':['は','ひ','ふ','へ','ほ'],
'ま':['ま','み','む','め','も'],'や':['や',null,'ゆ',null,'よ'],'ら':['ら','り','る','れ','ろ'],
'わ':['わ','を','ん','ー',null],'p':['、','。','？','！',null]
};
var REV={};
Object.keys(FLICK).forEach(function(k){FLICK[k].forEach(function(c,d){if(c)REV[c]={key:k,dir:d}})});
var CYC={
'あ':['あ','ぁ'],'い':['い','ぃ'],'う':['う','ぅ','ゔ'],'え':['え','ぇ'],'お':['お','ぉ'],
'か':['か','が'],'き':['き','ぎ'],'く':['く','ぐ'],'け':['け','げ'],'こ':['こ','ご'],
'さ':['さ','ざ'],'し':['し','じ'],'す':['す','ず'],'せ':['せ','ぜ'],'そ':['そ','ぞ'],
'た':['た','だ'],'ち':['ち','ぢ'],'つ':['つ','っ','づ'],'て':['て','で'],'と':['と','ど'],
'は':['は','ば','ぱ'],'ひ':['ひ','び','ぴ'],'ふ':['ふ','ぶ','ぷ'],'へ':['へ','べ','ぺ'],'ほ':['ほ','ぼ','ぽ'],
'や':['や','ゃ'],'ゆ':['ゆ','ゅ'],'よ':['よ','ょ'],'わ':['わ','ゎ']
};
var VB={};
Object.keys(CYC).forEach(function(b){CYC[b].forEach(function(c,i){if(i>0)VB[c]={base:b,idx:i}})});
function makeKana(k,y){
  var chars=[];
  for(var i=0;i<y.length;i++){var ch=y.charAt(i),v=VB[ch]||{base:ch,idx:0};chars.push({ch:ch,base:v.base,idx:v.idx})}
  return {kanji:k,yomi:y,chars:chars,ci:0,comp:null};
}
function kadvance(w){w.ci++;w.comp=null;return w.ci>=w.chars.length?'done':'ok'}
function kpress(w,s){
  var c=w.chars[w.ci];
  if(!c)return 'miss';
  if(s==='del'){if(w.comp===null)return 'noop';w.comp=null;return 'undo'}
  if(s==='cyc'){
    var cyc=CYC[c.base]||[c.base];
    if(w.comp===null||cyc.length<2)return 'miss';
    w.comp=(w.comp+1)%cyc.length;
    return w.comp===c.idx?kadvance(w):'ok';
  }
  if(w.comp!==null||s!==c.base)return 'miss';
  w.comp=0;
  return c.idx===0?kadvance(w):'ok';
}
function kview(w){
  var done='',cur='',rest='',i,c=w.chars[w.ci],nx=null;
  for(i=0;i<w.ci;i++)done+=w.chars[i].ch;
  if(c){
    cur=c.ch;
    for(i=w.ci+1;i<w.chars.length;i++)rest+=w.chars[i].ch;
    nx=w.comp===null?{t:'flick',ch:c.base,left:c.idx}:{t:'cyc',left:c.idx-w.comp,shown:(CYC[c.base]||[c.base])[w.comp]};
  }
  return {done:done,cur:cur,rest:rest,next:nx,comp:w.comp};
}
