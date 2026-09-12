/* ===== 九九乘法大冒險 · 遊戲狀態機 ===== */
(() => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  const ICONS = {
    coin: `<svg width="16" height="16" viewBox="0 0 30 30"><path d="M15 27 C4 19 4 8 12 5 C14.5 4 15 7 15 9 C15 7 15.5 4 18 5 C26 8 26 19 15 27 Z" fill="#ff5c7a"/></svg>`,
    star: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 1 l2.6 7.4 L22 11 l-7.4 2.6 L12 21 l-2.6-7.4 L2 11 l7.4-2.6 Z" fill="#ffd93d"/></svg>`,
    lock: `<svg width="20" height="20" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="3" fill="#c9b6c9"/><path d="M8 10 V7 a4 4 0 0 1 8 0 v3" fill="none" stroke="#c9b6c9" stroke-width="2.4"/></svg>`,
    heartFilled: color => `<svg class="heart" viewBox="0 0 20 20"><path d="M10 18 C2 12 2 4 7 3 C9 2.5 10 5 10 6 C10 5 11 2.5 13 3 C18 4 18 12 10 18 Z" fill="${color}"/></svg>`,
    heartOutline: `<svg class="heart" viewBox="0 0 20 20"><path d="M10 18 C2 12 2 4 7 3 C9 2.5 10 5 10 6 C10 5 11 2.5 13 3 C18 4 18 12 10 18 Z" fill="none" stroke="#ffc7d3" stroke-width="1.6"/></svg>`,
  };

  const LEVELS = [
    { id: 1, name: '第一關 · 新手試煉', sub: '不限時 · 是非題', type: 'tf', timed: false, timeLimit: null, base: 15, perCorrect: 2 },
    { id: 2, name: '第二關 · 選擇挑戰', sub: '不限時 · 選擇題', type: 'mc', timed: false, timeLimit: null, base: 18, perCorrect: 2 },
    { id: 3, name: '第三關 · 實力考驗', sub: '不限時 · 輸入題', type: 'input', timed: false, timeLimit: null, base: 20, perCorrect: 3 },
    { id: 4, name: '第四關 · 極速對決', sub: '限時 15 秒 · 是非題', type: 'tf', timed: true, timeLimit: 15, base: 20, perCorrect: 3 },
    { id: 5, name: '第五關 · 極速選擇', sub: '限時 15 秒 · 選擇題', type: 'mc', timed: true, timeLimit: 15, base: 22, perCorrect: 3 },
    { id: 6, name: '第六關 · 極速輸入', sub: '限時 20 秒 · 輸入題', type: 'input', timed: true, timeLimit: 20, base: 25, perCorrect: 4 },
  ];
  const PASS_THRESHOLD = 7;
  const QUESTIONS_PER_LEVEL = 10;
  const RING_CIRC = 2 * Math.PI * 32;

  let selectedAvatar = 'girl';
  let quiz = null; // { levelId, questions, index, correctCount, results[], timerId, timeLeft, answered }

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
  }

  function currentPlayer() {
    const name = Storage.getCurrentPlayerName();
    return name ? Storage.getPlayer(name) : null;
  }

  // ---------- 建立角色畫面 ----------
  function initCreateScreen() {
    renderPlayerList();
    $$('#avatar-picker .avatar-card').forEach(card => {
      renderHeadshot(card.querySelector('.avatar-head'), card.dataset.avatar);
      card.addEventListener('click', () => {
        selectedAvatar = card.dataset.avatar;
        $$('#avatar-picker .avatar-card').forEach(c => c.classList.toggle('selected', c === card));
      });
    });
    $$('#avatar-picker .avatar-card')[0].classList.add('selected');

    $('#start-btn').addEventListener('click', () => {
      const nameInput = $('#name-input');
      const name = nameInput.value.trim();
      if (!name) {
        $('#create-hint').textContent = '請先輸入名字唷！';
        return;
      }
      $('#create-hint').textContent = '';
      const existing = Storage.getPlayer(name);
      if (existing) {
        Storage.setCurrentPlayer(name);
      } else {
        Storage.createPlayer(name, selectedAvatar);
      }
      goToMap();
    });
  }

  function renderPlayerList() {
    const players = Storage.listPlayers();
    const wrap = $('#player-list');
    const items = $('#player-list-items');
    if (!players.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    items.innerHTML = '';
    players.forEach(p => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML = `
        <span class="p-name">${escapeHtml(p.name)}</span>
        <span class="p-coins">${ICONS.coin} ${p.coins}</span>
        <button class="p-select">選擇</button>
        <button class="p-delete">刪除</button>
      `;
      row.querySelector('.p-select').addEventListener('click', () => {
        Storage.setCurrentPlayer(p.name);
        goToMap();
      });
      row.querySelector('.p-delete').addEventListener('click', () => {
        if (confirm(`確定要刪除「${p.name}」的遊戲紀錄嗎？`)) {
          Storage.deletePlayer(p.name);
          renderPlayerList();
        }
      });
      items.appendChild(row);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- 關卡地圖 ----------
  function goToMap() {
    renderMap();
    showScreen('screen-map');
  }

  function renderMap() {
    const player = currentPlayer();
    if (!player) { showScreen('screen-create'); return; }
    $('#map-player-name').textContent = player.name;
    $('#map-coins').textContent = player.coins;
    renderCharacter($('#map-shop-btn').querySelector('div'), {
      base: player.avatar, state: 'dressed', mood: 'happy', equipped: player.equipped,
    });
    $('#map-ending-btn').hidden = !player.completedAll;

    const path = $('#level-path');
    path.innerHTML = '';
    LEVELS.forEach(level => {
      const passed = player.levels[level.id]?.passed;
      const unlocked = level.id === 1 || player.levels[level.id - 1]?.passed;
      const node = document.createElement('button');
      node.className = 'level-node' + (unlocked ? '' : ' locked');
      node.innerHTML = `
        <span class="lv-badge">${passed ? ICONS.star : (unlocked ? '' : ICONS.lock)}</span>
        <span class="lv-num">LV ${level.id}</span>
        <span class="lv-name">${level.name}</span>
        <span class="lv-sub">${level.sub}</span>
      `;
      if (unlocked) {
        node.addEventListener('click', () => enterLevel(level.id));
      } else {
        node.disabled = true;
      }
      path.appendChild(node);
    });
  }

  $ready(() => {
    $('#map-shop-btn').addEventListener('click', goToShop);
    $('#goto-shop-btn').addEventListener('click', goToShop);
    $('#shop-back-btn').addEventListener('click', goToMap);
    $('#map-ending-btn').addEventListener('click', showVictoryEnding);
    $('#shop-ending-btn').addEventListener('click', showVictoryEnding);
    $('#switch-player-btn').addEventListener('click', () => {
      $('#name-input').value = '';
      $('#create-hint').textContent = '';
      renderPlayerList();
      showScreen('screen-create');
    });
  });

  // ---------- 作答畫面 ----------
  function enterLevel(levelId) {
    const level = LEVELS.find(l => l.id === levelId);
    quiz = {
      levelId,
      questions: Questions.generate(level.type, QUESTIONS_PER_LEVEL),
      index: 0,
      correctCount: 0,
      results: [],
      timerId: null,
      timeLeft: 0,
      answered: false,
      inputBuffer: '',
    };
    showScreen('screen-quiz');
    renderQuizChrome();
    renderQuestion();
  }

  function renderQuizChrome() {
    const level = LEVELS.find(l => l.id === quiz.levelId);
    const player = currentPlayer();
    $('#quiz-level-name').textContent = level.name;
    $('#quiz-coins').textContent = player.coins;
  }

  function renderDots() {
    const dots = $('#quiz-dots');
    dots.innerHTML = '';
    for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
      let icon;
      if (i < quiz.results.length) {
        icon = ICONS.heartFilled(quiz.results[i] ? '#ff69b4' : '#c9c9c9');
      } else if (i === quiz.index) {
        icon = ICONS.heartFilled('#ffd93d');
      } else {
        icon = ICONS.heartOutline;
      }
      dots.insertAdjacentHTML('beforeend', icon);
    }
  }

  function renderQuestion() {
    clearTimer();
    quiz.answered = false;
    quiz.inputBuffer = '';
    const level = LEVELS.find(l => l.id === quiz.levelId);
    const q = quiz.questions[quiz.index];

    $('#quiz-counter').textContent = `第 ${quiz.index + 1} / ${QUESTIONS_PER_LEVEL} 題`;
    renderDots();

    const timerWrap = $('#quiz-timer');
    const untimedBadge = $('#quiz-untimed-badge');
    if (level.timed) {
      untimedBadge.hidden = true;
      timerWrap.hidden = false;
      quiz.timeLeft = level.timeLimit;
      updateTimerDisplay(level.timeLimit);
      quiz.timerId = setInterval(() => tickTimer(level), 250);
    } else {
      timerWrap.hidden = true;
      untimedBadge.hidden = false;
    }

    const inputPad = $('#quiz-input-pad');
    const choices = $('#quiz-choices');
    choices.innerHTML = '';
    inputPad.hidden = true;

    if (q.type === 'tf') {
      $('#quiz-label').textContent = '這個算式對不對呢？';
      $('#quiz-equation').textContent = `${q.a} × ${q.b} = ${q.shown}`;
      choices.innerHTML = `
        <button class="choice-btn btn-true" data-val="true">${ICONS_CHECK} 對</button>
        <button class="choice-btn btn-false" data-val="false">${ICONS_CROSS} 錯</button>
      `;
      choices.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => answerTF(btn, btn.dataset.val === 'true', q));
      });
    } else if (q.type === 'mc') {
      $('#quiz-label').textContent = '答案是多少呢？';
      $('#quiz-equation').textContent = `${q.a} × ${q.b} = ?`;
      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => answerMC(btn, opt, q));
        choices.appendChild(btn);
      });
    } else if (q.type === 'input') {
      $('#quiz-label').textContent = '請輸入答案';
      $('#quiz-equation').textContent = `${q.a} × ${q.b} = ?`;
      inputPad.hidden = false;
      renderInputDisplay();
      renderKeypad(q);
    }
  }

  const ICONS_CHECK = `<svg width="20" height="20" viewBox="0 0 30 30"><path d="M6 16 L12 22 L24 8" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICONS_CROSS = `<svg width="18" height="18" viewBox="0 0 28 28"><path d="M6 6 L22 22 M22 6 L6 22" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;

  function renderInputDisplay() {
    $('#quiz-input-display').textContent = quiz.inputBuffer || '請輸入';
  }

  function renderKeypad(q) {
    const pad = $('#quiz-keypad');
    pad.innerHTML = '';
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'submit'];
    keys.forEach(k => {
      const btn = document.createElement('button');
      if (k === 'clear') {
        btn.className = 'key-btn key-clear';
        btn.textContent = '清除';
        btn.addEventListener('click', () => { quiz.inputBuffer = ''; renderInputDisplay(); });
      } else if (k === 'submit') {
        btn.className = 'key-btn key-submit';
        btn.textContent = '送出';
        btn.addEventListener('click', () => submitInputAnswer(q));
      } else {
        btn.className = 'key-btn';
        btn.textContent = k;
        btn.addEventListener('click', () => {
          if (quiz.inputBuffer.length >= 3) return;
          quiz.inputBuffer += k;
          renderInputDisplay();
        });
      }
      pad.appendChild(btn);
    });
  }

  function submitInputAnswer(q) {
    if (quiz.answered) return;
    if (quiz.inputBuffer === '') return;
    const val = parseInt(quiz.inputBuffer, 10);
    const correct = val === q.correct;
    finalizeAnswer(correct);
    if (!correct) {
      $('#quiz-input-display').textContent = `${val}（正確：${q.correct}）`;
      $('#quiz-input-display').style.color = '#ff7a6e';
    } else {
      $('#quiz-input-display').style.color = '';
    }
  }

  function answerTF(btn, userSaysTrue, q) {
    if (quiz.answered) return;
    const correct = userSaysTrue === q.correctAnswer;
    highlightTFButtons(q);
    finalizeAnswer(correct);
  }

  function highlightTFButtons(q) {
    $$('#quiz-choices .choice-btn').forEach(btn => {
      const btnIsTrue = btn.dataset.val === 'true';
      if (btnIsTrue === q.correctAnswer) btn.classList.add('is-correct');
      btn.disabled = true;
    });
  }

  function answerMC(btn, value, q) {
    if (quiz.answered) return;
    const correct = value === q.correct;
    $$('#quiz-choices .choice-btn').forEach(b => {
      b.disabled = true;
      if (parseInt(b.textContent, 10) === q.correct) b.classList.add('is-correct');
      else if (b === btn) b.classList.add('is-wrong');
    });
    finalizeAnswer(correct);
  }

  function tickTimer(level) {
    quiz.timeLeft -= 0.25;
    if (quiz.timeLeft <= 0) {
      updateTimerDisplay(0);
      clearTimer();
      handleTimeout();
      return;
    }
    updateTimerDisplay(quiz.timeLeft);
  }

  function updateTimerDisplay(t) {
    const ring = $('#timer-ring');
    const level = LEVELS.find(l => l.id === quiz.levelId);
    const frac = Math.max(0, t / level.timeLimit);
    ring.setAttribute('stroke-dasharray', RING_CIRC.toFixed(1));
    ring.setAttribute('stroke-dashoffset', (RING_CIRC * (1 - frac)).toFixed(1));
    $('#timer-text').textContent = Math.ceil(t);
  }

  function clearTimer() {
    if (quiz.timerId) {
      clearInterval(quiz.timerId);
      quiz.timerId = null;
    }
  }

  function handleTimeout() {
    if (quiz.answered) return;
    const q = quiz.questions[quiz.index];
    if (q.type === 'tf') {
      highlightTFButtons(q);
    } else if (q.type === 'mc') {
      $$('#quiz-choices .choice-btn').forEach(b => {
        b.disabled = true;
        if (parseInt(b.textContent, 10) === q.correct) b.classList.add('is-correct');
      });
    } else if (q.type === 'input') {
      $('#quiz-input-display').textContent = `時間到！（正確：${q.correct}）`;
      $('#quiz-input-display').style.color = '#ff7a6e';
    }
    finalizeAnswer(false);
  }

  function finalizeAnswer(correct) {
    if (quiz.answered) return;
    quiz.answered = true;
    clearTimer();
    quiz.results.push(correct);
    if (correct) quiz.correctCount++;
    setTimeout(() => {
      quiz.index++;
      if (quiz.index >= QUESTIONS_PER_LEVEL) {
        finishLevel();
      } else {
        renderQuestion();
      }
    }, 900);
  }

  // ---------- 關卡結算 ----------
  function finishLevel() {
    const level = LEVELS.find(l => l.id === quiz.levelId);
    const passed = quiz.correctCount >= PASS_THRESHOLD;
    const player = currentPlayer();
    let coinsEarned = 0;
    let allDone = false;

    if (passed) {
      coinsEarned = level.base + level.perCorrect * quiz.correctCount;
      Storage.updatePlayer(player.name, p => {
        const rec = p.levels[level.id] || { passed: false, bestScore: 0 };
        rec.passed = true;
        rec.bestScore = Math.max(rec.bestScore || 0, quiz.correctCount);
        p.levels[level.id] = rec;
        p.coins += coinsEarned;
        allDone = LEVELS.every(l => p.levels[l.id]?.passed);
        p.completedAll = allDone;
      });
    }

    renderResult(level, passed, coinsEarned, allDone);
    showScreen('screen-result');
  }

  function renderResult(level, passed, coinsEarned, allDone) {
    const player = currentPlayer();
    const card = $('#result-card');
    const stageId = 'result-stage';
    if (passed) {
      card.innerHTML = `
        <div class="r-stage" id="${stageId}"></div>
        <div class="r-title">過關成功！🎉</div>
        <div class="r-sub">${level.name}</div>
        <div class="r-stats">
          <div class="r-stat"><div class="num">${quiz.correctCount}/10</div><div class="lab">答對題數</div></div>
          <div class="r-stat"><div class="num">+${coinsEarned}</div><div class="lab">獲得金幣</div></div>
        </div>
        <div class="btn-row">
          ${allDone
            ? `<button class="btn btn-ghost" id="r-shop-btn">前往商店</button><button class="btn" id="r-ending-btn">查看結局 →</button>`
            : `<button class="btn btn-ghost" id="r-shop-btn">前往商店</button><button class="btn" id="r-next-btn">下一關 →</button>`}
        </div>
      `;
      renderCharacter($('#' + stageId), { base: player.avatar, state: 'dressed', mood: 'happy', equipped: player.equipped });
      $('#r-shop-btn').addEventListener('click', goToShop);
      if (allDone) {
        $('#r-ending-btn').addEventListener('click', showVictoryEnding);
      } else {
        const nextLevel = LEVELS.find(l => l.id === level.id + 1);
        $('#r-next-btn').addEventListener('click', () => enterLevel(nextLevel.id));
      }
    } else {
      card.innerHTML = `
        <div class="r-stage" id="${stageId}"></div>
        <div class="r-title">再試一次！</div>
        <div class="r-sub">這關需要答對 7 題以上才能過關唷</div>
        <div class="r-stats">
          <div class="r-stat"><div class="num">${quiz.correctCount}/10</div><div class="lab">答對題數</div></div>
        </div>
        <div class="btn-row">
          <button class="btn" id="r-retry-btn">重新挑戰本關</button>
          <button class="btn btn-ghost" id="r-end-btn">結束本局</button>
        </div>
      `;
      renderCharacter($('#' + stageId), { base: player.avatar, state: 'dressed', mood: 'sad', equipped: player.equipped });
      $('#r-retry-btn').addEventListener('click', () => enterLevel(level.id));
      $('#r-end-btn').addEventListener('click', showAbandonEnding);
    }
  }

  // ---------- 商店 ----------
  function goToShop() {
    renderShop();
    showScreen('screen-shop');
  }

  function renderShop() {
    const player = currentPlayer();
    $('#shop-coins').textContent = player.coins;
    $('#shop-ending-btn').hidden = !player.completedAll;
    renderCharacter($('#shop-char-preview'), { base: player.avatar, state: 'dressed', mood: 'happy', equipped: player.equipped });

    const cats = $('#shop-categories');
    cats.innerHTML = '';
    SHOP_SLOTS.forEach(slot => {
      const box = document.createElement('div');
      box.className = 'shop-cat';
      box.innerHTML = `<div class="cat-title">${slot.label}</div><div class="cat-items"></div>`;
      const itemsWrap = box.querySelector('.cat-items');
      SHOP[slot.key].forEach(item => {
        const owned = player.inventory[slot.key].includes(item.id);
        const equipped = player.equipped[slot.key] === item.id;
        const affordable = player.coins >= item.price;
        const el = document.createElement('div');
        el.className = 'shop-item' + (owned ? ' owned' : '') + (equipped ? ' equipped' : '') + (!owned && !affordable ? ' cant-afford' : '');
        el.innerHTML = `
          <div class="thumb"><img src="${ASSET_PATH}${item.img}" alt="" style="width:100%;height:100%;object-fit:contain;"></div>
          <div class="i-name">${item.name}</div>
          ${owned ? `<div class="i-tag">${equipped ? '已穿上' : '已擁有'}</div>` : `<div class="i-price">${ICONS.coin} ${item.price}</div>`}
          ${owned ? `<button type="button" class="i-return">退貨</button>` : ''}
        `;
        el.addEventListener('click', () => onShopItemClick(slot.key, item));
        if (owned) {
          el.querySelector('.i-return').addEventListener('click', (e) => {
            e.stopPropagation();
            onReturnItemClick(slot.key, item);
          });
        }
        itemsWrap.appendChild(el);
      });
      cats.appendChild(box);
    });
  }

  function onShopItemClick(slotKey, item) {
    const player = currentPlayer();
    const owned = player.inventory[slotKey].includes(item.id);
    if (!owned) {
      if (player.coins < item.price) return;
      if (!confirm(`要花 ${item.price} 金幣買下「${item.name}」嗎？`)) return;
      Storage.updatePlayer(player.name, p => {
        p.coins -= item.price;
        p.inventory[slotKey].push(item.id);
        p.equipped[slotKey] = item.id;
      });
    } else {
      Storage.updatePlayer(player.name, p => {
        p.equipped[slotKey] = p.equipped[slotKey] === item.id ? 'none' : item.id;
      });
    }
    renderShop();
  }

  function onReturnItemClick(slotKey, item) {
    const player = currentPlayer();
    if (!confirm(`確定要退貨「${item.name}」嗎？將退還 ${item.price} 金幣。`)) return;
    Storage.updatePlayer(player.name, p => {
      p.inventory[slotKey] = p.inventory[slotKey].filter(id => id !== item.id);
      if (p.equipped[slotKey] === item.id) p.equipped[slotKey] = 'none';
      p.coins += item.price;
    });
    renderShop();
  }

  // ---------- 結局 ----------
  function showVictoryEnding() {
    const player = currentPlayer();
    const content = $('#ending-content');
    content.className = 'ending-content';
    content.innerHTML = `
      <div class="e-stage" id="e-stage"></div>
      <div class="e-title">恭喜全部過關！👑</div>
      <div class="e-msg">你已經完全征服九九乘法了！<br>小兔子和小熊都好為你驕傲～</div>
      <div class="ending-stats">
        <div class="r-stat"><div class="num">${player.coins}</div><div class="lab">總金幣</div></div>
      </div>
      <div class="btn-row"><button class="btn" id="e-restart-btn">重新開始新的一局</button></div>
    `;
    const stage = $('#e-stage');
    stage.style.display = 'flex';
    stage.style.gap = '4px';
    stage.style.alignItems = 'flex-end';
    stage.style.justifyContent = 'center';
    const mainWrap = document.createElement('div');
    mainWrap.style.width = '150px'; mainWrap.style.aspectRatio = '282 / 420'; mainWrap.style.position = 'relative';
    const rabbitWrap = document.createElement('div');
    rabbitWrap.style.width = '90px'; rabbitWrap.style.aspectRatio = '282 / 420'; rabbitWrap.style.position = 'relative';
    const bearWrap = document.createElement('div');
    bearWrap.style.width = '100px'; bearWrap.style.aspectRatio = '282 / 420'; bearWrap.style.position = 'relative';
    stage.appendChild(rabbitWrap); stage.appendChild(mainWrap); stage.appendChild(bearWrap);
    renderCharacter(mainWrap, { base: player.avatar, state: 'dressed', mood: 'happy', equipped: player.equipped });
    renderCharacter(rabbitWrap, { base: 'rabbit', state: 'dressed', mood: 'happy' });
    renderCharacter(bearWrap, { base: 'bear', state: 'dressed', mood: 'happy' });
    $('#e-restart-btn').addEventListener('click', restartRun);
    showScreen('screen-ending');
  }

  function showAbandonEnding() {
    const player = currentPlayer();
    Storage.updatePlayer(player.name, p => { p.abandoned = true; });
    const content = $('#ending-content');
    content.className = 'ending-content abandon';
    content.innerHTML = `
      <div class="e-stage" id="e-stage"></div>
      <div class="e-title">中途放棄了嗎……</div>
      <div class="e-msg">沒關係，下次再一起挑戰九九乘法吧！<br>小熊在這裡等你回來唷。</div>
      <div class="btn-row"><button class="btn" id="e-restart-btn">重新開始</button></div>
    `;
    renderCharacter($('#e-stage'), { base: player.avatar, state: 'shabby', equipped: player.equipped });
    $('#e-restart-btn').addEventListener('click', restartRun);
    showScreen('screen-ending');
  }

  function restartRun() {
    const player = currentPlayer();
    Storage.resetProgress(player.name);
    goToMap();
  }

  // ---------- 初始化 ----------
  function $ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  $ready(() => {
    initCreateScreen();
    const startingPlayer = Storage.getCurrentPlayerName();
    if (startingPlayer && Storage.getPlayer(startingPlayer)) {
      goToMap();
    } else {
      showScreen('screen-create');
    }
  });
})();
