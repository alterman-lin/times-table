/* ===== 九九乘法題目產生器 ===== */
const Questions = (() => {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 乘數、被乘數都不出現 1（1 × N 太簡單、缺乏練習價值），只出 2~9 的組合
  function allPairs() {
    const pairs = [];
    for (let a = 2; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) pairs.push([a, b]);
    }
    return pairs;
  }

  function pickPairs(n) {
    return shuffle(allPairs()).slice(0, n);
  }

  // 產生一個「看起來合理」但錯誤的乘積，模擬常見計算失誤
  function wrongProduct(correct, a, b) {
    const offsets = [a, -a, b, -b, a + b, -(a + b), Math.abs(a - b) || 1, -(Math.abs(a - b) || 1), 9, -9];
    const candidates = shuffle(offsets)
      .map(o => correct + o)
      .filter(v => v > 0 && v !== correct && v <= 90);
    if (candidates.length) return candidates[0];
    // fallback：任意鄰近正整數
    let v = correct + (Math.random() < 0.5 ? 1 : -1);
    if (v <= 0) v = correct + 1;
    return v;
  }

  function genTrueFalse(n = 10) {
    return pickPairs(n).map(([a, b]) => {
      const correct = a * b;
      const isTrue = Math.random() < 0.5;
      const shown = isTrue ? correct : wrongProduct(correct, a, b);
      return { type: 'tf', a, b, shown, correctAnswer: shown === correct };
    });
  }

  function genChoiceDistractors(correct, a, b, count) {
    const raw = [
      (a - 1) * b, (a + 1) * b, a * (b - 1), a * (b + 1),
      correct + a, correct - a, correct + b, correct - b,
      correct + 1, correct - 1,
    ];
    const seen = new Set([correct]);
    const out = [];
    for (const v of shuffle(raw)) {
      if (v > 0 && v <= 90 && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
      if (out.length >= count) break;
    }
    // 若還不夠（極少數邊角組合），用隨機鄰近值補滿
    let guard = 0;
    while (out.length < count && guard < 50) {
      guard++;
      const v = correct + (Math.floor(Math.random() * 10) - 5);
      if (v > 0 && v <= 90 && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  }

  function genMultipleChoice(n = 10) {
    return pickPairs(n).map(([a, b]) => {
      const correct = a * b;
      const distractors = genChoiceDistractors(correct, a, b, 3);
      const options = shuffle([correct, ...distractors]);
      return { type: 'mc', a, b, correct, options };
    });
  }

  function genInput(n = 10) {
    return pickPairs(n).map(([a, b]) => ({ type: 'input', a, b, correct: a * b }));
  }

  function generate(type, n = 10) {
    if (type === 'tf') return genTrueFalse(n);
    if (type === 'mc') return genMultipleChoice(n);
    if (type === 'input') return genInput(n);
    throw new Error('unknown question type: ' + type);
  }

  return { generate, genTrueFalse, genMultipleChoice, genInput, shuffle };
})();
