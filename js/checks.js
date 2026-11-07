'use strict';

CryptoAilend.runChecks = function () {
  const lab = CryptoAilend;
  const checks = [];

  function check(name, expected, calculate) {
    try {
      const actual = String(calculate());
      checks.push({ name, expected: String(expected), actual, passed: actual === String(expected) });
    } catch (error) {
      checks.push({ name, expected: String(expected), actual: error.message, passed: false });
    }
  }

  function rejects(calculate) {
    try {
      calculate();
      return false;
    } catch {
      return true;
    }
  }

  check('Цезар: АБВ, зсув 3', 'ГҐД', () => lab.caesar('АБВ', 3).result);
  check('Цезар: перехід через кінець абетки', 'В', () => lab.caesar('Я', 3).result);
  check('Віженер ROT2: А, ключ А', 'В', () => lab.vigenere('А', 'А').result);
  check('Віженер: зворотне перетворення ПІБ', lab.config.fullName, () => {
    const encrypted = lab.vigenere(lab.config.fullName, 'КРИПТО').result;
    return lab.vigenere(encrypted, 'КРИПТО', true).result;
  });
  check('Полібій: перша й остання літери', '11 63', () => lab.polybius('АЯ').result);
  check('Полібій: збереження пробілу', 'А Я', () => lab.polybius('11 / 63', true).result);
  check('Полібій: відхилення порожньої клітинки', true, () => rejects(() => lab.polybius('66', true)));

  const keys = lab.rsa.createKeys('154799', '1093', '22305175');
  check('RSA: N = p × q', '169195307', () => keys.modulus);
  check('RSA: e × d mod φ = 1', '1', () => keys.e * keys.d % keys.phi);
  check('RSA: заданий шифротекст', '863804', () => lab.rsa.power(20979746n, keys.d, keys.modulus).value);
  check('RSA: блокове шифрування M', '124031897 66937552', () => lab.rsa.calculate('2897878135', keys).result);
  check('RSA: повідомлення, кратне p', '154799', () => {
    const ciphertext = lab.rsa.power(keys.p, keys.e, keys.modulus).value;
    return lab.rsa.power(ciphertext, keys.d, keys.modulus).value;
  });
  check('RSA: відхилення складеного p', true, () => rejects(() => lab.rsa.createKeys('4', '7', '5')));
  check('RSA: відхилення необоротного d', true, () => rejects(() => lab.rsa.createKeys('7', '11', '6')));
  return checks;
};
