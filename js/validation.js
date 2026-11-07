'use strict';

CryptoAilend.validation = {
  checkText(text) {
    if (!text.trim()) {
      throw new Error('Введіть текст повідомлення.');
    }
    if (text.length > 5000) {
      throw new Error('Максимальна довжина повідомлення — 5000 символів.');
    }
  },

  checkKey(key) {
    const alphabet = CryptoAilend.config.alphabet;
    if (!key || [...key].some(letter => !alphabet.includes(letter))) {
      throw new Error('Ключ має містити лише літери української абетки.');
    }
  },

  readInteger(value, label) {
    const text = String(value).trim();
    if (!/^\d{1,100}$/.test(text)) {
      throw new Error(`${label}: введіть ціле невід’ємне число, до 100 цифр.`);
    }
    return BigInt(text);
  },

  checkRsaInput(text) {
    if (text.length > 5000 || !/^\d+(\s+\d+)*$/.test(text)) {
      throw new Error('Введіть число або блоки через пробіл, до 5000 символів.');
    }
  }
};
