'use strict';

window.CryptoAilend = {};

CryptoAilend.config = {
  alphabet: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ',
  fullName: 'ХЕЙЛЕНКО ОЛЕКСІЙ ОЛЕКСАНДРОВИЧ',
  variant: 29,
  defaultKey: 'КРИПТО',
  defaultShift: 3,
  rsa: {
    p: '154799',
    q: '1093',
    d: '22305175',
    message: '2897878135',
    ciphertext: '20979746'
  }
};

CryptoAilend.positiveModulo = function (value, divisor) {
  return ((value % divisor) + divisor) % divisor;
};
