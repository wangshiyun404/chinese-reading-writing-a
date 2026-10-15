/* Teacher-selected names stay in this browser. No network requests are made. */
(function () {
  'use strict';
  var source = window.TEACHING_SOURCE;
  if (!source || !Array.isArray(source.students)) return;
  var KEY = 'sie1671a-local-roster-v1', FORMAT = 'sie1671a-local-roster';
  var defaults = source.students.map(function (s) { return { id: s.id, name: s.name }; });
  var ids = defaults.map(function (s) { return s.id; });
  var info = { mode: 'numbered', message: '当前使用学生编号。导入教师本机名单后，可在此浏览器显示姓名。' };

  function validate(obj) {
    if (!obj || obj.format !== FORMAT || !Array.isArray(obj.students) || obj.students.length !== ids.length) {
      throw new Error('请使用本课完整的 ' + ids.length + ' 人名单文件，当前名单未更改。');
    }
    var names = Object.create(null);
    obj.students.forEach(function (s) {
      if (!s || typeof s.id !== 'string' || ids.indexOf(s.id) < 0 || Object.prototype.hasOwnProperty.call(names, s.id) ||
          typeof s.name !== 'string' || !s.name.trim() || s.name.length > 60 || /[\u0000-\u001f\u007f]/.test(s.name)) {
        throw new Error('名单包含未知或重复编号、空姓名或过长姓名，当前名单未更改。');
      }
      names[s.id] = s.name.trim();
    });
    return { format: FORMAT, students: ids.map(function (id) { return { id: id, name: names[id] }; }) };
  }
  function parse(text) {
    if (typeof text !== 'string' || text.length > 32768) throw new Error('名单文件过大或无法读取，当前名单未更改。');
    var obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('名单不是有效的 JSON 文件，当前名单未更改。'); }
    return validate(obj);
  }
  function apply(list, mode, message) {
    var names = Object.create(null);
    list.forEach(function (s) { names[s.id] = s.name; });
    source.students.forEach(function (s) { s.name = names[s.id]; });
    info = { mode: mode, message: message };
    window.dispatchEvent(new Event('rw:roster-change'));
  }
  function hydrate(raw) {
    if (!raw) {
      apply(defaults, 'numbered', '当前使用学生编号。导入教师本机名单后，可在此浏览器显示姓名。');
      return;
    }
    var roster = parse(raw);
    apply(roster.students, 'local', '已使用本机名单（' + ids.length + ' 人）。姓名仅保存在当前浏览器，不会上传。');
  }
  try { hydrate(localStorage.getItem(KEY)); }
  catch (e) { info.message = '当前使用学生编号。本机名单暂时无法读取，请重新导入完整名单或检查浏览器存储设置。'; }

  window.RWLocalRoster = {
    storageKey: KEY,
    getInfo: function () { return { mode: info.mode, message: info.message, count: ids.length }; },
    importText: function (text) {
      var roster = parse(text), serialized = JSON.stringify(roster);
      try {
        localStorage.setItem(KEY, serialized);
        if (localStorage.getItem(KEY) !== serialized) throw new Error('Storage verification failed');
      } catch (e) { throw new Error('浏览器未能保存名单，本次未切换姓名。请检查浏览器存储设置后重试。'); }
      apply(roster.students, 'local', '已导入并保存本机名单（' + ids.length + ' 人）。姓名仅保存在当前浏览器，不会上传。');
      return this.getInfo();
    },
    reset: function () {
      try {
        localStorage.removeItem(KEY);
        if (localStorage.getItem(KEY) !== null) throw new Error('Storage verification failed');
      } catch (e) { throw new Error('浏览器未能清除本机名单，本次未切换。请检查浏览器存储设置后重试。'); }
      apply(defaults, 'numbered', '已恢复学生编号，并清除当前浏览器保存的姓名；抽问记录和授课进度保留。');
      return this.getInfo();
    }
  };
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY && event.key !== null) return;
    try { hydrate(localStorage.getItem(KEY)); }
    catch (e) { apply(defaults, 'numbered', '本机名单暂时无法读取，已使用学生编号。请重新导入本课完整名单。'); }
  });
})();
