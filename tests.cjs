const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const context = vm.createContext({ window: null });
context.window = context;
const files = [
  'config.js',
  'validation.js',
  'algorithms/caesar.js',
  'algorithms/vigenere.js',
  'algorithms/polybius.js',
  'algorithms/rsa.js',
  'checks.js',
  'ui/export.js'
];
for (const file of files) {
  vm.runInContext(fs.readFileSync(`${__dirname}/js/${file}`, 'utf8'), context);
}
const lab = context.CryptoAilend;
const checks = lab.runChecks();
for (const check of checks) {
  assert.equal(check.passed, true, `${check.name}: ${check.actual}`);
}

for (let shift = 0; shift < 33; shift += 1) {
  const encrypted = lab.caesar(lab.config.alphabet, shift).result;
  assert.equal(lab.caesar(encrypted, shift, true).result, lab.config.alphabet);
}

const keys = lab.rsa.createKeys('154799', '1093', '22305175');
for (const message of ['0', '1', '001', '2897878135', '123456780001', '154799', '1093', '169195306']) {
  const encrypted = lab.rsa.calculate(message, keys);
  const packet = {
    format: 'CryptoAilend-RSA-1',
    modulus: keys.modulus.toString(),
    ciphertext: encrypted.outputBlocks,
    blockLengths: encrypted.blockLengths
  };
  const imported = lab.export.parseRsaPacket(JSON.stringify(packet), keys);
  const decrypted = lab.rsa.calculate(imported.ciphertext.join(' '), keys, true, imported.blockLengths);
  assert.equal(decrypted.result, message);
  assert.equal(decrypted.verified, true);
}
assert.throws(() => lab.export.parseRsaPacket('{}', keys));
assert.throws(() => lab.validation.readInteger('1.2', 'p'));
assert.throws(() => lab.validation.checkText(''));
assert.throws(() => lab.rsa.calculate(keys.modulus.toString(), keys, true));
console.log(`${checks.length} демонстраційних перевірок і додаткові граничні випадки пройдено.`);
