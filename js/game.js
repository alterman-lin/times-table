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
  let selectedTrack = 'girl';
  let quiz = null; // { levelId, questions, index, correctCount, results[], timerId, timeLeft, answered }

  const TRACK_COPY = {
    girl: {
      title: '甜心少女的九九乘法大冒險', sub: '和可愛的小白兔與小熊一起，快樂學數學！', startLabel: '開始可愛冒險 →',
      nameLabel: '輸入你的可愛名字', namePlaceholder: '例如：草莓小公主...',
    },
    boy: {
      title: '改裝小車手的九九乘法大冒險', sub: '每破一關，就把你的愛車修得更帥一點！', startLabel: '開始改裝大冒險 →',
      nameLabel: '輸入你的帥氣名字', namePlaceholder: '例如：帥氣小王子',
    },
  };

  const HOWTO_COPY = {
    girl: {
      title: '遊戲玩法',
      steps: [
        { icon: '✏️', label: '答對題目' },
        { icon: '⭐', label: '過關拿金幣' },
        { icon: '👚', label: '買衣服打扮' },
      ],
    },
    boy: {
      title: '遊戲玩法',
      steps: [
        { icon: '✏️', label: '答對題目' },
        { icon: '⭐', label: '過關升級' },
        { icon: '🔧', label: '改裝你的愛車' },
      ],
    },
  };

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
  }

  function currentPlayer() {
    const name = Storage.getCurrentPlayerName();
    return name ? Storage.getPlayer(name) : null;
  }

  function trackOf(player) {
    return player && player.track === 'boy' ? 'boy' : 'girl';
  }

  function isBoy(player) {
    return trackOf(player) === 'boy';
  }

  // 切換整個 app 的底色主題（女生粉色格紋 / 男孩車庫冷色調）
  function applyTheme(track) {
    $('.app-frame').classList.toggle('theme-boy', track === 'boy');
  }

  function carStageOf(player) {
    return LEVELS.reduce((n, l) => n + (player.levels[l.id]?.passed ? 1 : 0), 0);
  }

  // 角色/車子的唯一渲染入口：依故事線分派給 renderCharacter 或 renderCar
  function renderPlayerStage(el, player, { mood = 'happy', shabby = false } = {}) {
    if (isBoy(player)) {
      renderCar(el, { boyId: player.avatar, stage: carStageOf(player), color: player.carColor, shabby });
    } else {
      renderCharacter(el, { base: player.avatar, state: shabby ? 'shabby' : 'dressed', mood, equipped: player.equipped });
    }
  }

  // 烤漆顏色選色列，車庫畫面與過關結算卡片共用
  function buildColorRow(player, onPick) {
    const row = document.createElement('div');
    row.className = 'color-row';
    const current = carColorId(player.carColor);
    CAR_COLORS.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch' + (c.id === current ? ' selected' : '');
      btn.dataset.color = c.id;
      btn.title = c.name;
      btn.addEventListener('click', () => {
        Storage.updatePlayer(player.name, p => { p.carColor = c.id; });
        onPick();
      });
      row.appendChild(btn);
    });
    return row;
  }

  // ---------- 選故事畫面 ----------
  function initLandingScreen() {
    $$('#story-picker .avatar-card').forEach(card => {
      const track = card.dataset.track;
      const head = card.querySelector('.avatar-head');
      if (track === 'boy') renderCarHeadshot(head, 'boy'); else renderHeadshot(head, 'girl');
      card.addEventListener('click', () => goToCreate(track));
    });
  }

  function goToLanding() {
    renderPlayerList();
    showScreen('screen-landing');
  }

  // ---------- 建立角色畫面 ----------
  function goToCreate(track) {
    selectedTrack = track;
    applyTheme(track);
    const cards = $$('#avatar-picker .avatar-card');
    cards.forEach(c => { c.hidden = c.dataset.track !== track; c.classList.remove('selected'); });
    const visible = cards.filter(c => c.dataset.track === track);
    if (visible.length) {
      visible[0].classList.add('selected');
      selectedAvatar = visible[0].dataset.avatar;
    }
    const copy = TRACK_COPY[track] || TRACK_COPY.girl;
    $('#create-title').textContent = copy.title;
    $('#create-sub').textContent = copy.sub;
    $('#start-btn').textContent = copy.startLabel;
    $('#name-label').textContent = copy.nameLabel;
    $('#name-input').placeholder = copy.namePlaceholder;
    $('#name-input').value = '';
    $('#create-hint').textContent = '';
    showScreen('screen-create');
  }

  function initCreateScreen() {
    $$('#avatar-picker .avatar-card').forEach(card => {
      const head = card.querySelector('.avatar-head');
      if (card.dataset.track === 'boy') renderCarHeadshot(head, card.dataset.avatar);
      else renderHeadshot(head, card.dataset.avatar);
      card.addEventListener('click', () => {
        selectedAvatar = card.dataset.avatar;
        $$('#avatar-picker .avatar-card').forEach(c => {
          if (c.dataset.track === card.dataset.track) c.classList.toggle('selected', c === card);
        });
      });
    });

    $('#create-back-btn').addEventListener('click', goToLanding);

    $('#start-btn').addEventListener('click', () => {
      const nameInput = $('#name-input');
      const name = nameInput.value.trim();
      if (!name) {
        $('#create-hint').textContent = '請先輸入名字唷！';
        return;
      }
      const existing = Storage.getPlayer(name);
      if (existing) {
        if (trackOf(existing) !== selectedTrack) {
          $('#create-hint').textContent = `「${name}」已經有一段${trackOf(existing) === 'boy' ? '改裝小車手' : '甜心少女'}的故事囉，選擇繼續會接回原本的故事～`;
        }
        Storage.setCurrentPlayer(name);
      } else {
        $('#create-hint').textContent = '';
        Storage.createPlayer(name, selectedAvatar, selectedTrack);
      }
      goToHowTo(selectedTrack);
    });
  }

  // ---------- 玩法說明畫面 ----------
  function goToHowTo(track) {
    const copy = HOWTO_COPY[track] || HOWTO_COPY.girl;
    $('#howto-title').textContent = copy.title;
    const wrap = $('#howto-steps');
    wrap.innerHTML = '';
    copy.steps.forEach((step, i) => {
      if (i > 0) wrap.insertAdjacentHTML('beforeend', '<div class="howto-arrow">→</div>');
      const el = document.createElement('div');
      el.className = 'howto-step';
      el.innerHTML = `<div class="howto-icon">${step.icon}</div><div class="howto-label">${step.label}</div>`;
      wrap.appendChild(el);
    });
    showScreen('screen-howto');
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
      const progress = isBoy(p) ? `🚗 ${carStageOf(p)}/6` : `${ICONS.coin} ${p.coins}`;
      row.innerHTML = `
        <span class="p-name">${escapeHtml(p.name)}</span>
        <span class="p-coins">${progress}</span>
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
    if (!player) { goToLanding(); return; }
    const boy = isBoy(player);
    applyTheme(player.track);
    $('#map-player-name').textContent = player.name;
    $('#map-gold').hidden = boy;
    $('#map-coins').textContent = player.coins;
    renderPlayerStage($('#map-shop-btn').querySelector('div'), player);
    $('#map-shop-btn').title = boy ? '我的車庫' : '前往商店';
    $('#goto-shop-btn').textContent = boy ? '查看我的改裝車庫 🚗' : '前往甜心商店 🛍';
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

  function openSideScreen() {
    if (isBoy(currentPlayer())) goToGarage(); else goToShop();
  }

  $ready(() => {
    $('#map-shop-btn').addEventListener('click', openSideScreen);
    $('#goto-shop-btn').addEventListener('click', openSideScreen);
    $('#shop-back-btn').addEventListener('click', goToMap);
    $('#map-ending-btn').addEventListener('click', showVictoryEnding);
    $('#shop-ending-btn').addEventListener('click', showVictoryEnding);
    $('#garage-back-btn').addEventListener('click', goToMap);
    $('#garage-ending-btn').addEventListener('click', showVictoryEnding);
    $('#switch-player-btn').addEventListener('click', goToLanding);
    $('#howto-start-btn').addEventListener('click', goToMap);
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
    $('#quiz-gold').hidden = isBoy(player);
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
    const boy = isBoy(player);
    const card = $('#result-card');
    const stageId = 'result-stage';
    if (passed) {
      const stage = boy ? carStageOf(player) : 0;
      const secondStat = boy
        ? `<div class="r-stat"><div class="num">${stage}/6</div><div class="lab">改裝進度</div></div>`
        : `<div class="r-stat"><div class="num">+${coinsEarned}</div><div class="lab">獲得金幣</div></div>`;
      const carNoteHtml = boy
        ? `<div class="r-car-note">🔧 車子變化：${carStageLabel(stage)}</div>`
        : '';
      let buttonsHtml;
      if (boy) {
        buttonsHtml = allDone
          ? `<button class="btn btn-ghost" id="r-garage-btn">查看改裝車庫</button><button class="btn" id="r-ending-btn">查看結局 →</button>`
          : `<button class="btn btn-ghost" id="r-garage-btn">查看改裝車庫</button><button class="btn" id="r-next-btn">下一關 →</button>`;
      } else {
        buttonsHtml = allDone
          ? `<button class="btn btn-ghost" id="r-shop-btn">前往商店</button><button class="btn" id="r-ending-btn">查看結局 →</button>`
          : `<button class="btn btn-ghost" id="r-shop-btn">前往商店</button><button class="btn" id="r-next-btn">下一關 →</button>`;
      }
      card.innerHTML = `
        <div class="r-stage" id="${stageId}"></div>
        <div class="r-title">過關成功！🎉</div>
        <div class="r-sub">${level.name}</div>
        ${carNoteHtml}
        <div class="r-stats">
          <div class="r-stat"><div class="num">${quiz.correctCount}/10</div><div class="lab">答對題數</div></div>
          ${secondStat}
        </div>
        <div class="btn-row">${buttonsHtml}</div>
      `;
      renderPlayerStage($('#' + stageId), player, { mood: 'happy' });
      if (!boy) $('#r-shop-btn').addEventListener('click', goToShop);
      if (boy) $('#r-garage-btn').addEventListener('click', goToGarage);
      if (allDone) {
        $('#r-ending-btn').addEventListener('click', showVictoryEnding);
      } else {
        const nextLevel = LEVELS.find(l => l.id === level.id + 1);
        $('#r-next-btn').addEventListener('click', () => enterLevel(nextLevel.id));
      }

      if (boy && stage >= 4 && stage <= 5) {
        const wrap = document.createElement('div');
        if (stage === 4) wrap.innerHTML = `<div class="r-sub">選擇你的烤漆顏色！</div>`;
        const row = buildColorRow(currentPlayer(), () => {
          renderPlayerStage($('#' + stageId), currentPlayer(), { mood: 'happy' });
        });
        wrap.appendChild(row);
        card.insertBefore(wrap, card.querySelector('.btn-row'));
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
      renderPlayerStage($('#' + stageId), player, { mood: 'sad' });
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
    renderPlayerStage($('#shop-char-preview'), player);

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

  // ---------- 改裝車庫（男孩線） ----------
  function goToGarage() {
    renderGarage();
    showScreen('screen-garage');
  }

  function renderGarage() {
    const player = currentPlayer();
    const stage = carStageOf(player);
    $('#garage-ending-btn').hidden = !player.completedAll;
    renderPlayerStage($('#garage-car-preview'), player);

    const panels = $('#garage-panels');
    panels.innerHTML = '';

    const statusBox = document.createElement('div');
    statusBox.className = 'shop-cat';
    statusBox.innerHTML = `<div class="cat-title">目前狀態</div><p class="hint-text" style="color:#5a4a42;">${carStageLabel(stage)}（${stage}/6）</p>`;
    panels.appendChild(statusBox);

    const colorBox = document.createElement('div');
    colorBox.className = 'shop-cat';
    colorBox.innerHTML = `<div class="cat-title">烤漆顏色</div>`;
    if (stage >= 4) {
      colorBox.appendChild(buildColorRow(player, renderGarage));
    } else {
      colorBox.insertAdjacentHTML('beforeend', `<p class="hint-text">通過第四關就能自訂烤漆顏色囉！</p>`);
    }
    panels.appendChild(colorBox);
  }

  // ---------- 結局 ----------
  function showVictoryEnding() {
    const player = currentPlayer();
    const content = $('#ending-content');
    content.className = 'ending-content';

    if (isBoy(player)) {
      content.innerHTML = `
        <div class="e-stage" id="e-stage"></div>
        <div class="e-title">全部過關！你的夢想跑車到手了！👑</div>
        <div class="e-msg">你的努力被看見了，這是給你的全新跑車！<br>九九乘法，你已經完全征服了！</div>
        <div class="ending-stats">
          <div class="r-stat"><div class="num">6/6</div><div class="lab">關卡全破</div></div>
        </div>
        <div class="btn-row"><button class="btn" id="e-restart-btn">重新開始新的一局</button></div>
      `;
      renderPlayerStage($('#e-stage'), player, { mood: 'happy' });
      $('#e-restart-btn').addEventListener('click', restartRun);
      showScreen('screen-ending');
      return;
    }

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
    const msg = isBoy(player)
      ? '沒關係，你的車先停在車庫裡等你唷！<br>下次再一起挑戰九九乘法，把它修得更帥吧！'
      : '沒關係，下次再一起挑戰九九乘法吧！<br>小熊在這裡等你回來唷。';
    content.innerHTML = `
      <div class="e-stage" id="e-stage"></div>
      <div class="e-title">中途放棄了嗎……</div>
      <div class="e-msg">${msg}</div>
      <div class="btn-row"><button class="btn" id="e-restart-btn">重新開始</button></div>
    `;
    renderPlayerStage($('#e-stage'), player, { shabby: true });
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
    initLandingScreen();
    initCreateScreen();
    const startingPlayer = Storage.getCurrentPlayerName();
    if (startingPlayer && Storage.getPlayer(startingPlayer)) {
      goToMap();
    } else {
      goToLanding();
    }
  });
})();
