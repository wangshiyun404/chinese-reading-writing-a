/* Optional lesson activities live outside DECK: original page numbers and SVG frames stay intact. */
(function () {
  'use strict';
  var deck = window.HTDeck, button = document.getElementById('l07ExtensionOpen');
  if (!deck || !button) return;
  var app = document.getElementById('app'), opened = false, saved = null, previousFocus = null;
  var previousAria = null, previousInert = false, playing = [];
  var modal = document.createElement('section');
  modal.id = 'l07ExtensionModal'; modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'l07ExtensionTitle');
  modal.innerHTML = '<header class="l07-extension-header"><span class="l07-extension-title" id="l07ExtensionTitle">第7课 · 从山东到山西 · 课堂拓展</span><button class="l07-extension-return" type="button">返回课件</button></header><iframe id="l07ExtensionFrame" title="第7课课堂拓展活动" allow="autoplay; fullscreen"></iframe>';
  document.body.appendChild(modal);
  var frame = modal.querySelector('iframe'), back = modal.querySelector('button');
  function send(type) {
    if (frame.contentWindow) frame.contentWindow.postMessage({type: type, returnPage: saved && saved.page}, '*');
  }
  function open() {
    if (opened) return;
    deck.closePanels();
    if (window.HTTeaching) window.HTTeaching.closePanel();
    if (window.RWCountry) window.RWCountry.close();
    if (window.RWarmup) window.RWarmup.close();
    saved = window.RWPlayer ? window.RWPlayer.position() : {page: deck.page(), step: 0};
    previousFocus = document.activeElement;
    previousAria = app.getAttribute('aria-hidden'); previousInert = !!app.inert;
    playing = Array.prototype.filter.call(app.querySelectorAll('audio,video'), function (v) { return !v.paused; });
    var audio = document.getElementById('au');
    if (audio && !audio.paused && playing.indexOf(audio) < 0) playing.push(audio);
    playing.forEach(function (v) { v.pause(); });
    opened = true; modal.hidden = false;
    back.textContent = '返回课件 · 第 ' + saved.page + ' 页';
    back.focus(); app.inert = true; app.setAttribute('aria-hidden', 'true');
    if (!frame.getAttribute('src')) frame.src = '第7课_课堂拓展.html';
    else send('rw:l07-extension:open');
    deck.wake();
  }
  function close() {
    if (!opened) return;
    send('rw:l07-extension:hide');
    opened = false; modal.hidden = true; app.inert = previousInert;
    if (previousAria === null) app.removeAttribute('aria-hidden'); else app.setAttribute('aria-hidden', previousAria);
    // Normally the original iframe has never moved. Restore only if an automatic animation advanced behind the dialog.
    if (saved && window.RWPlayer) {
      var now = window.RWPlayer.position();
      if (deck.page() !== saved.page) deck.go(saved.page);
      if (now.page !== saved.page || now.step !== saved.step) window.RWPlayer.restoreStep(saved.step);
    }
    playing.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }); playing = [];
    if (previousFocus && previousFocus.isConnected) previousFocus.focus(); else button.focus();
    deck.wake();
  }
  button.addEventListener('click', open); back.addEventListener('click', close);
  frame.addEventListener('load', function () { if (opened) send('rw:l07-extension:open'); });
  window.addEventListener('message', function (event) {
    if (event.source !== frame.contentWindow || !event.data) return;
    if (event.data.type === 'rw:l07-extension:close') close();
  });
  // Window capture runs before the workbench's document shortcuts; the hidden deck must never consume extension keys.
  window.addEventListener('keydown', function (event) {
    if (!opened) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'F5') { event.preventDefault(); deck.fullscreen(); }
    else if (/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(event.key)) event.preventDefault();
  }, true);
  window.addEventListener('keyup', function (event) { if (opened) event.stopImmediatePropagation(); }, true);
  window.RWL07Extension = {open: open, close: close, isOpen: function () { return opened; }};
})();
