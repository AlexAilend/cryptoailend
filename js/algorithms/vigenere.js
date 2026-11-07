'use strict';

CryptoAilend.vigenere = function (text, key, decrypt = false) {
  const alphabet = CryptoAilend.config.alphabet;
  const normalizedKey = key.toUpperCase();
  CryptoAilend.validation.checkKey(normalizedKey);

  const steps = [];
  let result = '';
  let keyPosition = 0;

  for (const letter of text.toUpperCase()) {
    const inputIndex = alphabet.indexOf(letter);
    if (inputIndex === -1) {
      result += letter;
      continue;
    }

    const keyLetter = normalizedKey[keyPosition % normalizedKey.length];
    const keyIndex = alphabet.indexOf(keyLetter);
    const shift = keyIndex + 2;
    const offset = decrypt ? -shift : shift;
    const outputIndex = CryptoAilend.positiveModulo(inputIndex + offset, alphabet.length);
    const outputLetter = alphabet[outputIndex];
    const operator = decrypt ? '−' : '+';

    steps.push({
      input: letter,
      output: outputLetter,
      key: keyLetter,
      row: keyIndex,
      column: decrypt ? outputIndex : inputIndex,
      detail: `(${inputIndex} ${operator} (${keyIndex} + 2)) mod 33 = ${outputIndex}`,
      explanation: `Літера ключа ${keyLetter} має індекс ${keyIndex}. ROT2 додає до нього 2, тому зсув дорівнює ${shift}. Для ${letter} після ${decrypt ? 'віднімання' : 'додавання'} зсуву отримуємо ${outputLetter}.`
    });
    result += outputLetter;
    keyPosition += 1;
  }

  return { result, steps };
};
