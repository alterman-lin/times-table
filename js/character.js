/* ===== 角色分層渲染（沿用設計稿 Character.dc.html 驗證過的疊圖邏輯與 CSS 修正）===== */
const ASSET_PATH = 'assets/final/';
const LAYER_ORDER = ['pantsId', 'skirtId', 'topId', 'bagId', 'shoesId', 'accessoryId'];
const SHABBY_FILTER = 'grayscale(0.65) brightness(0.88) contrast(0.92)';

// 可換裝／可選擇的少女角色（新增角色只要準備好 base_<id>_happy/sad/upset.png 三張圖即可）
const DRESSABLE_BASES = new Set(['girl', 'girl2', 'girl3']);

/**
 * @param {HTMLElement} el 容器（需具備 char-stack 樣式所依附的尺寸）
 * @param {object} opts
 *   base: 'girl' | 'girlb' | 'girlc' | 'rabbit' | 'bear'
 *   state: 'bare' | 'dressed' | 'shabby'
 *   mood: 'happy' | 'sad'
 *   equipped: { topId, skirtId, pantsId, bagId, accessoryId, shoesId }
 */
function renderCharacter(el, opts) {
  if (!el) return;
  const base = opts.base || 'girl';
  const state = opts.state || 'dressed';
  const mood = opts.mood || 'happy';
  const equipped = opts.equipped || {};

  const isDressableBase = DRESSABLE_BASES.has(base);
  const isDressed = state === 'dressed';
  const isShabby = state === 'shabby';

  let baseImg, filter = '';
  if (base === 'bear') {
    baseImg = 'companion_bear.png';
  } else if (base === 'rabbit') {
    baseImg = 'companion_rabbit.png';
  } else if (isDressableBase) {
    if (isShabby) {
      baseImg = `base_${base}_upset.png`;
      filter = SHABBY_FILTER;
    } else if (isDressed && mood === 'sad') {
      baseImg = `base_${base}_sad.png`;
    } else {
      baseImg = `base_${base}_happy.png`;
    }
  } else {
    baseImg = 'base_girl_happy.png'; // 安全預設值
  }

  const wearing = isDressed && isDressableBase;

  let html = `<div class="char-stack">`;
  html += `<img class="layer-base" src="${ASSET_PATH}${baseImg}" alt=""${filter ? ` style="filter:${filter}"` : ''}>`;
  if (wearing) {
    for (const slot of LAYER_ORDER) {
      const id = equipped[slot];
      if (!id || id === 'none') continue;
      const item = shopItem(slot, id);
      if (item) html += `<img class="layer" src="${ASSET_PATH}${item.img}" alt="">`;
    }
  }
  html += `</div>`;
  el.innerHTML = html;
}

/**
 * 建立角色畫面用的「頭像」裁切 — 直接用同一張全身立繪，透過 CSS 背景圖
 * 放大＋只顯示頭部區域，不需要另外準備專屬的大頭照素材。
 * @param {HTMLElement} el 容器（套用 .avatar-head 樣式）
 * @param {string} base 'girl' | 'girlb' | 'girlc' | 'rabbit' | 'bear'
 */
function renderHeadshot(el, base) {
  if (!el) return;
  let img;
  if (base === 'bear') img = 'companion_bear.png';
  else if (base === 'rabbit') img = 'companion_rabbit.png';
  else if (DRESSABLE_BASES.has(base)) img = `base_${base}_happy.png`;
  else img = 'base_girl_happy.png';
  el.style.backgroundImage = `url(${ASSET_PATH}${img})`;
}
