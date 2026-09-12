/* ===== 男孩線：改裝愛車渲染（重用 character.js 的 ASSET_PATH / SHABBY_FILTER，
   必須在 index.html 中排在 character.js 之後、game.js 之前載入）===== */
const CAR_COLORS = [
  { id: 'red', name: '熱情紅' },
  { id: 'blue', name: '海洋藍' },
  { id: 'yellow', name: '陽光黃' },
];
const BOY_IDS = new Set(['boy', 'boy2', 'boy3']);
const CAR_MAX_STAGE = 6;
const CAR_STAGE_LABELS = [
  '待修的老爺車', '修好了，但還很髒', '洗得亮晶晶', '換上新輪胎',
  '烤上你選的顏色', '加裝運動空力套件', '全新跑車登場！',
];

function carColorId(color) {
  return CAR_COLORS.some(c => c.id === color) ? color : 'red';
}

function carImageForStage(boyId, stage, color) {
  const id = BOY_IDS.has(boyId) ? boyId : 'boy';
  const s = Math.max(0, Math.min(CAR_MAX_STAGE, Number(stage) || 0));
  if (s === 4 || s === 5) return `car_${id}_stage${s}_${carColorId(color)}.png`;
  return `car_${id}_stage${s}.png`;
}

function carStageLabel(stage) {
  const s = Math.max(0, Math.min(CAR_MAX_STAGE, Number(stage) || 0));
  return CAR_STAGE_LABELS[s];
}

/**
 * @param {HTMLElement} el 容器（需具備 char-stack 樣式所依附的尺寸）
 * @param {object} opts { boyId, stage, color, shabby }
 */
function renderCar(el, opts) {
  if (!el) return;
  const { boyId, stage, color, shabby } = opts || {};
  const file = carImageForStage(boyId, stage, color);
  const filter = shabby ? SHABBY_FILTER : '';
  el.innerHTML = `<div class="char-stack"><img class="layer-base" src="${ASSET_PATH}${file}" alt=""${filter ? ` style="filter:${filter}"` : ''}></div>`;
}

/**
 * 建立角色/選故事畫面用的頭像裁切，重用 stage6（最終獎勵跑車、笑得最開心）圖
 * + 既有 .avatar-head CSS。頭部位置跟其他階段一致，裁切窗口不用另外調。
 * @param {HTMLElement} el
 * @param {string} boyId
 */
function renderCarHeadshot(el, boyId) {
  if (!el) return;
  const file = carImageForStage(boyId, CAR_MAX_STAGE, null);
  el.style.backgroundImage = `url(${ASSET_PATH}${file})`;
}
