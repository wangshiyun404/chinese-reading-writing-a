/* Page-local, session-only annotations. Coordinates use the slide's 1280 x 720 space. */
(function () {
  'use strict';
  var deck = window.HTDeck, stage = document.getElementById('stage');
  if (!deck || !stage) return;
  function $(id) { return document.getElementById(id); }
  var canvas = document.createElement('canvas');
  canvas.id = 'penCanvas';
  canvas.setAttribute('aria-label', '课件圈画层，开启画笔后可用鼠标或触屏书写');
  stage.appendChild(canvas);
  var ctx = canvas.getContext('2d'), pages = {}, current = deck.page();
  var active = false, tool = 'draw', color = '#e53835', width = 5;
  var pending = null, pointer = null, scheduled = 0;
  function sheet() { return pages[current] || (pages[current] = { actions: [], redo: [] }); }
  function hasInk() {
    var a = sheet().actions;
    for (var i = a.length - 1; i >= 0; i--) {
      if (a[i].tool === 'clear') return false;
      if (a[i].tool === 'draw') return true;
    }
    return false;
  }
  function buttons() {
    $('penUndo').disabled = !sheet().actions.length;
    $('penRedo').disabled = !sheet().redo.length;
    $('penClear').disabled = !hasInk();
    $('penToggle').setAttribute('aria-pressed', String(active));
    $('penToggle').textContent = active ? '画笔已开启' : '画笔';
    $('penDraw').setAttribute('aria-pressed', String(tool === 'draw'));
    $('penErase').setAttribute('aria-pressed', String(tool === 'erase'));
    canvas.dataset.active = String(active);
    canvas.dataset.tool = tool;
    document.querySelectorAll('[data-color]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.color === color)); });
    document.querySelectorAll('[data-pen-width]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.penWidth === width)); });
  }
  function paint(action) {
    if (action.tool === 'clear') { ctx.clearRect(0, 0, 1280, 720); return; }
    var p = action.points;
    if (!p.length) return;
    ctx.globalCompositeOperation = action.tool === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = action.color;
    ctx.lineWidth = action.width;
    ctx.lineCap = ctx.lineJoin = 'round';
    if (p.length === 1) {
      ctx.beginPath(); ctx.arc(p[0][0], p[0][1], action.width / 2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
      for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.stroke();
    }
  }
  function render() {
    scheduled = 0;
    ctx.setTransform(canvas.width / 1280, 0, 0, canvas.height / 720, 0, 0);
    ctx.clearRect(0, 0, 1280, 720);
    var a = sheet().actions, start = 0;
    for (var i = a.length - 1; i >= 0; i--) if (a[i].tool === 'clear') { start = i + 1; break; }
    for (var j = start; j < a.length; j++) paint(a[j]);
    if (pending) paint(pending);
    ctx.globalCompositeOperation = 'source-over';
  }
  function redraw() { if (!scheduled) scheduled = requestAnimationFrame(render); }
  function resize() {
    var r = stage.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 3);
    var w = Math.max(1, Math.round(r.width * ratio)), h = Math.max(1, Math.round(r.height * ratio));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    if (scheduled) cancelAnimationFrame(scheduled);
    render();
  }
  function commit() {
    if (pending) { sheet().actions.push(pending); sheet().redo = []; pending = null; }
    var old = pointer; pointer = null;
    if (old !== null && canvas.hasPointerCapture(old)) canvas.releasePointerCapture(old);
    buttons(); redraw();
  }
  function point(e) {
    var r = canvas.getBoundingClientRect();
    return [Math.max(0, Math.min(1280, (e.clientX - r.left) * 1280 / r.width)), Math.max(0, Math.min(720, (e.clientY - r.top) * 720 / r.height))];
  }
  function addPoint(e) {
    var p = point(e), last = pending.points[pending.points.length - 1];
    if (!last || Math.abs(last[0] - p[0]) + Math.abs(last[1] - p[1]) > 0.5) pending.points.push(p);
  }
  canvas.addEventListener('pointerdown', function (e) {
    if (!active || e.button !== 0 || pointer !== null) return;
    e.preventDefault(); e.stopPropagation(); deck.wake();
    pointer = e.pointerId;
    pending = { tool: tool, color: color, width: tool === 'erase' ? 32 : width, points: [point(e)] };
    canvas.setPointerCapture(pointer); redraw();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!active) return;
    e.stopPropagation(); deck.wake();
    if (!pending || e.pointerId !== pointer) return;
    if (document.querySelector('.ht-modal:not([hidden]), .country-modal:not([hidden])')) { commit(); return; }
    e.preventDefault();
    var samples = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!samples.length) samples = [e];
    samples.forEach(addPoint); redraw();
  });
  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerId !== pointer) return;
    e.preventDefault(); e.stopPropagation(); addPoint(e); commit();
  });
  canvas.addEventListener('pointercancel', function (e) { if (e.pointerId === pointer) commit(); });
  canvas.addEventListener('lostpointercapture', function () { if (pending) commit(); });
  canvas.addEventListener('click', function (e) { if (active) { e.preventDefault(); e.stopPropagation(); } });
  // Pointer events alone do not suppress the slide's separate touch-swipe handler.
  ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(function (name) {
    canvas.addEventListener(name, function (e) { if (active) { e.preventDefault(); e.stopPropagation(); } }, { passive: false });
  });
  window.addEventListener('blur', commit);
  function toggle(on) {
    commit(); active = on; $('penTools').hidden = !on;
    buttons(); deck.layout(); resize(); deck.wake();
  }
  function undo() {
    commit(); var p = sheet();
    if (p.actions.length) p.redo.push(p.actions.pop());
    buttons(); redraw();
  }
  function redo() {
    commit(); var p = sheet();
    if (p.redo.length) p.actions.push(p.redo.pop());
    buttons(); redraw();
  }
  $('penToggle').onclick = function () { toggle(!active); };
  $('penDone').onclick = function () { toggle(false); $('penToggle').focus(); };
  $('penDraw').onclick = function () { commit(); tool = 'draw'; buttons(); };
  $('penErase').onclick = function () { commit(); tool = 'erase'; buttons(); };
  $('penUndo').onclick = undo; $('penRedo').onclick = redo;
  $('penClear').onclick = function () {
    commit(); if (!hasInk()) return;
    sheet().actions.push({ tool: 'clear' }); sheet().redo = []; buttons(); redraw();
    deck.toast('本页圈画已清空，可点“撤销”恢复。', 2400);
  };
  document.querySelectorAll('[data-color]').forEach(function (b) { b.onclick = function () { commit(); color = b.dataset.color; tool = 'draw'; buttons(); }; });
  document.querySelectorAll('[data-pen-width]').forEach(function (b) { b.onclick = function () { commit(); width = +b.dataset.penWidth; buttons(); }; });
  function blocked(e) {
    var t = e.target;
    return e.isComposing || e.defaultPrevented || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) ||
      !$('blank').hidden || !$('help').hidden || !$('grid').hidden || $('side').classList.contains('open') ||
      !!document.querySelector('.ht-modal:not([hidden]), .country-modal:not([hidden])');
  }
  document.addEventListener('keydown', function (e) {
    if (blocked(e) || e.altKey) return;
    var key = e.key && e.key.toLowerCase();
    if (key === 'd' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) toggle(!active); return;
    }
    if (!active) return;
    if (key === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); toggle(false); return; }
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
      e.preventDefault(); e.stopImmediatePropagation(); if (e.shiftKey) redo(); else undo(); return;
    }
    if (pending) commit();
  }, true);
  $('penTools').addEventListener('pointermove', function () { deck.wake(); });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', resize);
  window.RWPen = { pageChanged: function (page) { if (page !== current) { commit(); current = page; buttons(); redraw(); } } };
  buttons(); resize();
})();
