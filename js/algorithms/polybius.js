'use strict';

CryptoAilend.polybius = function (text, decrypt = false) {
  const alphabet = CryptoAilend.config.alphabet;
  const steps = [];
  const output = [];

  if (decrypt) {
    for (const pair of text.trim().split(/\s+/)) {
      if (pair === '/') {
        output.push(' ');
        continue;
      }
      if (!/^[1-6][1-6]$/.test(pair)) {
        throw new Error('Вводьте пари цифр 1–6 через пробіл; / між словами.');
      }

      const row = Number(pair[0]) - 1;
      const column = Number(pair[1]) - 1;
      const letter = alphabet[row * 6 + column];
      if (!letter) {
        throw new Error('Ця клітинка квадрата Полібія порожня.');
      }
      output.push(letter);
      steps.push(createStep(pair, letter, row, column));
    }
    return { result: output.join(''), steps };
  }

  for (const letter of text.toUpperCase()) {
    if (letter === ' ') {
      output.push('/');
      continue;
    }
    const index = alphabet.indexOf(letter);
    if (index === -1) {
      throw new Error('Для Полібія використовуйте українські літери та пробіли.');
    }

    const row = Math.floor(index / 6);
    const column = index % 6;
    const pair = `${row + 1}${column + 1}`;
    output.push(pair);
    steps.push(createStep(letter, pair, row, column));
  }

  return { result: output.join(' '), steps };

  function createStep(input, output, row, column) {
    return {
      input,
      output,
      row,
      column,
      detail: `Рядок ${row + 1}, стовпець ${column + 1}`,
      explanation: `Клітинка розміщена в рядку ${row + 1} та стовпці ${column + 1}. Першою записуємо цифру рядка, другою — стовпця: ${row + 1}${column + 1}.`
    };
  }
};
