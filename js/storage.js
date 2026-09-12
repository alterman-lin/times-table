/* ===== localStorage 存讀 ===== */
const Storage = (() => {
  const KEY = 'mult99_game_v1';

  function blank() {
    return { players: {}, currentPlayer: null };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !data.players) return blank();
      return data;
    } catch (e) {
      return blank();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage 不可用（無痕模式等）時安靜略過，遊戲仍可在記憶體中運作一局
    }
  }

  function defaultLevels() {
    const levels = {};
    for (let i = 1; i <= 6; i++) levels[i] = { passed: false, bestScore: 0 };
    return levels;
  }

  function defaultEquipped() {
    return { topId: 'none', skirtId: 'none', pantsId: 'none', bagId: 'none', accessoryId: 'none', shoesId: 'none' };
  }

  function defaultInventory() {
    return { topId: [], skirtId: [], pantsId: [], bagId: [], accessoryId: [], shoesId: [] };
  }

  function listPlayers() {
    const data = load();
    return Object.values(data.players);
  }

  function getCurrentPlayerName() {
    return load().currentPlayer;
  }

  function getPlayer(name) {
    return load().players[name] || null;
  }

  function createPlayer(name, avatar) {
    const data = load();
    data.players[name] = {
      name,
      avatar,
      coins: 0,
      inventory: defaultInventory(),
      equipped: defaultEquipped(),
      levels: defaultLevels(),
      completedAll: false,
      abandoned: false,
    };
    data.currentPlayer = name;
    save(data);
    return data.players[name];
  }

  function ensurePlayer(name, avatar) {
    const data = load();
    if (!data.players[name]) {
      return createPlayer(name, avatar);
    }
    data.currentPlayer = name;
    save(data);
    return data.players[name];
  }

  function setCurrentPlayer(name) {
    const data = load();
    data.currentPlayer = name;
    save(data);
  }

  function deletePlayer(name) {
    const data = load();
    delete data.players[name];
    if (data.currentPlayer === name) data.currentPlayer = null;
    save(data);
  }

  function updatePlayer(name, updater) {
    const data = load();
    const p = data.players[name];
    if (!p) return null;
    updater(p);
    save(data);
    return p;
  }

  function resetProgress(name) {
    return updatePlayer(name, p => {
      p.coins = 0;
      p.inventory = defaultInventory();
      p.equipped = defaultEquipped();
      p.levels = defaultLevels();
      p.completedAll = false;
      p.abandoned = false;
    });
  }

  return {
    listPlayers, getCurrentPlayerName, getPlayer, createPlayer, ensurePlayer,
    setCurrentPlayer, deletePlayer, updatePlayer, resetProgress,
  };
})();
