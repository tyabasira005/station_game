/* mode.js: <head> で最初に読み込む。画面が描かれる前に PC版/スマホ版 を <html data-mode> へ反映して、ページ移動時のちらつきを防ぐ */
(function(){
  var mode='mobile';
  try{if(window.localStorage.getItem('ekitype.mode')==='pc')mode='pc'}catch(e){}
  document.documentElement.setAttribute('data-mode',mode);
})();
