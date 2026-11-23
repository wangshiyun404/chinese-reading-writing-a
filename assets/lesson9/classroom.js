'use strict';

const byId = id => document.getElementById(id);
const stages = Array.from(document.querySelectorAll('nav [data-stage]'));
const sound = byId('dictAudio');
let currentStage = 0;

function showStage(index, moveFocus = true) {
  if (!stages[index]) return;
  document.querySelectorAll('video, audio').forEach(media => media.pause());
  currentStage = index;
  stages.forEach((button, position) => {
    const active = position === index;
    button.setAttribute('aria-pressed', active);
    byId(button.dataset.stage).hidden = !active;
  });
  byId('prevStage').disabled = index === 0;
  byId('nextStage').disabled = index === stages.length - 1;
  byId('stageProgress').textContent = (index + 1) + ' / ' + stages.length;
  if (moveFocus) byId(stages[index].dataset.stage + '-title').focus();
}

stages.forEach((button, index) => {
  button.addEventListener('click', () => showStage(index));
});
byId('prevStage').onclick = () => showStage(currentStage - 1);
byId('nextStage').onclick = () => showStage(currentStage + 1);

function setReveal(button, visible) {
  byId(button.dataset.reveal).hidden = !visible;
  button.setAttribute('aria-expanded', visible);
}

document.querySelectorAll('[data-reveal]').forEach(button => {
  button.setAttribute('aria-controls', button.dataset.reveal);
  button.onclick = () => setReveal(button, byId(button.dataset.reveal).hidden);
});
document.querySelectorAll('[data-choice]').forEach(button => {
  button.onclick = () => {
    byId(button.dataset.feedback).textContent = button.dataset.choice === 'correct'
      ? '对了。跟同桌说说你怎么知道的。'
      : '再看看题目里的线索，换一个试试。';
  };
});

const dictation = [
  ['send', '发', 'fā · 发邮件'],
  ['mail', '邮件', 'yóujiàn · 发一封邮件'],
  ['melon', '西瓜', 'xīguā · 这个西瓜又大又甜。'],
  ['cola', '可乐', 'kělè · 一瓶可乐'],
  ['phrase', '发邮件', 'fā yóujiàn · 这个词组由“发”和“邮件”组成。']
];
let dictIndex = 0;

function showDictation(index) {
  const [clip, word, hint] = dictation[index];
  dictIndex = index;
  byId('dictIndex').textContent = index === 4 ? '加试 · 听写一个词组' : '第 ' + (index + 1) + ' / 4 题';
  byId('dictWord').textContent = word;
  byId('dictHint').textContent = hint;
  byId('dictStatus').textContent = '';
  byId('dictPrev').disabled = index === 0;
  byId('dictNext').disabled = index === dictation.length - 1;
  byId('dictNext').textContent = index === 3 ? '加试词组' : '下一题';
  setReveal(byId('dictReveal'), false);
  sound.pause();
  sound.src = 'media/lesson9/' + clip + '.mp3';
}

byId('dictPrev').onclick = () => showDictation(dictIndex - 1);
byId('dictNext').onclick = () => showDictation(dictIndex + 1);
byId('dictPlay').onclick = async () => {
  try {
    sound.currentTime = 0;
    await sound.play();
    byId('dictStatus').textContent = '听完再写。';
  } catch {
    byId('dictStatus').textContent = '声音暂时播不了。请老师读这一题。';
  }
};

const writing = [
  ['一位同学正在笔记本上写字', '她在＿＿汉字。', 'xiě', '写', '5画。上面是冖，下面是与。'],
  ['两位同学面对面交接礼物', '他＿＿朋友一份礼物。', 'sòng', '送', '9画。先写里面的“关”，再写走之。'],
  ['一位同学抱着书走出宿舍', '她＿＿着书去上课。', 'dài', '带', '9画。注意下面的“巾”。'],
  ['背书包的同学走到教学楼门口', '他＿＿学校了。', 'dào', '到', '8画。左边是“至”，右边是立刀旁。']
];
let writeIndex = 0;

function showWriting(index) {
  const [imageLabel, sentence, pinyin, word, hint] = writing[index];
  writeIndex = index;
  byId('writeIndex').textContent = '图 ' + (index + 1) + ' / ' + writing.length;
  const photo = byId('writePhoto');
  photo.setAttribute('aria-label', imageLabel);
  photo.style.backgroundPosition = (index % 2 * 100) + '% ' + (Math.floor(index / 2) * 100) + '%';
  byId('writeSentence').textContent = sentence;
  byId('writePinyin').textContent = pinyin;
  byId('writeWord').textContent = word;
  byId('writeHint').textContent = hint;
  byId('writePrev').disabled = index === 0;
  byId('writeNext').disabled = index === writing.length - 1;
  ['writePinyin', 'writeAnswer'].forEach(id => setReveal(document.querySelector('[data-reveal="' + id + '"]'), false));
}

byId('writePrev').onclick = () => showWriting(writeIndex - 1);
byId('writeNext').onclick = () => showWriting(writeIndex + 1);

const products = [
  {image: 1, noun: '书', classifier: '本', count: '两', price: '十二块'},
  {image: 2, noun: '笔', classifier: '支', count: '三', price: '一块五'},
  {image: 4, noun: '茶', classifier: '杯', count: '一', price: '五块五'},
  {image: 5, noun: '水', classifier: '瓶', count: '两', price: '三块五'}
];
let productIndex = 0;

function showProduct(index) {
  const {image, noun, classifier, count, price} = products[index];
  const photo = byId('productPhoto');
  photo.style.backgroundPosition = (image % 4 * 100 / 3) + '% ' + (Math.floor(image / 4) * 50) + '%';
  photo.setAttribute('aria-label', noun);
  byId('productPrompt').textContent = '订单：' + count + '＿＿' + noun;
  const model = byId('marketAnswer');
  model.replaceChildren();
  [
    '标签：一' + classifier + noun + ' ' + price + '（练习价格）',
    '顾客：我要' + count + classifier + noun + '。一' + classifier + '多少钱？',
    '店员：一' + classifier + price + '。'
  ].forEach(line => {
    const part = document.createElement('p');
    part.textContent = line;
    model.append(part);
  });
  setReveal(document.querySelector('[data-reveal="marketAnswer"]'), false);
}

byId('marketNext').onclick = () => {
  productIndex = (productIndex + 1) % products.length;
  showProduct(productIndex);
};
document.querySelectorAll('video').forEach(video => {
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => {
      if (other !== video) other.pause();
    });
  });
});

const params = new URLSearchParams(location.search);
const fromPage = Number(params.get('from'));
const returnPage = Number.isInteger(fromPage) && fromPage >= 264 && fromPage <= 310 ? fromPage : 264;
const deckUrl = location.protocol === 'file:' ? '打开课件.html' : 'index.html';
byId('backToDeck').href = deckUrl + '#p=' + returnPage;

showDictation(0);
showWriting(0);
showProduct(0);
showStage(Math.max(0, stages.findIndex(button => button.dataset.stage === params.get('stage'))), false);
