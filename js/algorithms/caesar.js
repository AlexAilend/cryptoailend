'use strict';

CryptoAilend.caesar = function (text, shift, decrypt = false) {
  const alphabet = CryptoAilend.config.alphabet;
  const steps = [];
  const offset = decrypt ? -shift : shift;
  let result = '';

  for (const letter of text.toUpperCase()) {
    const inputIndex = alphabet.indexOf(letter);
    if (inputIndex === -1) {
      result += letter;
      continue;
    }

    const outputIndex = CryptoAilend.positiveModulo(inputIndex + offset, alphabet.length);
    const outputLetter = alphabet[outputIndex];
    const operator = decrypt ? '−' : '+';

    steps.push({
      input: letter,
      output: outputLetter,
      inputIndex,
      outputIndex,
      detail: `(${inputIndex} ${operator} ${shift}) mod 33 = ${outputIndex}`,
      explanation: `Літера ${letter} має індекс ${inputIndex}. ${decrypt ? 'Віднімаємо' : 'Додаємо'} зсув ${shift}. Після приведення за модулем 33 отримуємо індекс ${outputIndex} — літеру ${outputLetter}.`
    });
    result += outputLetter;
  }

  return { result, steps };
};
