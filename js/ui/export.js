'use strict';

CryptoAilend.export = {
  download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  saveText(experiment) {
    const lines = [
      'CryptoAilend — варіант 29',
      'Хейленко Олексій Олександрович',
      `Модуль: ${experiment.mode}`,
      `Режим: ${experiment.decrypt ? 'Розшифрування' : 'Шифрування'}`,
      `Вхід: ${experiment.input}`,
      `Параметри: ${experiment.formula}`,
      `Результат: ${experiment.calculation.result}`,
      `Зворотна перевірка: ${experiment.calculation.reverseText}`
    ];
    if (experiment.calculation.blockLengths) {
      lines.push(`Довжини блоків: ${experiment.calculation.blockLengths.join(', ')}`);
    }
    lines.push('');
    experiment.calculation.steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.input} → ${step.output}; ${step.detail}`);
    });
    this.download(`CryptoAilend-${experiment.mode}.txt`, '\ufeff' + lines.join('\n'), 'text/plain;charset=utf-8');
  },

  saveRsaPacket(experiment) {
    const packet = {
      format: 'CryptoAilend-RSA-1',
      modulus: experiment.keys.modulus.toString(),
      ciphertext: experiment.calculation.outputBlocks,
      blockLengths: experiment.calculation.blockLengths
    };
    this.download('CryptoAilend-RSA.json', JSON.stringify(packet, null, 2), 'application/json');
  },

  parseRsaPacket(text, keys) {
    let packet;
    try {
      packet = JSON.parse(text);
    } catch {
      throw new Error('Файл не містить правильний JSON.');
    }
    if (!packet || packet.format !== 'CryptoAilend-RSA-1' || packet.modulus !== keys.modulus.toString()) {
      throw new Error('Це не пакет CryptoAilend або його модуль N не збігається.');
    }
    if (!Array.isArray(packet.ciphertext) || !Array.isArray(packet.blockLengths) ||
        packet.ciphertext.length === 0 || packet.ciphertext.length !== packet.blockLengths.length) {
      throw new Error('Некоректні блоки або їхні довжини.');
    }
    const maximumWidth = keys.modulus.toString().length;
    packet.ciphertext.forEach((block, index) => {
      if (typeof block !== 'string' || !/^\d{1,100}$/.test(block) || BigInt(block) >= keys.modulus) {
        throw new Error('Некоректний блок шифротексту.');
      }
      const length = packet.blockLengths[index];
      if (!Number.isInteger(length) || length < 1 || length > maximumWidth) {
        throw new Error('Некоректна довжина блока.');
      }
      const restored = CryptoAilend.rsa.power(BigInt(block), keys.d, keys.modulus).value.toString();
      if (restored.length > length) {
        throw new Error('Довжини блоків не відповідають розшифрованому повідомленню.');
      }
    });
    return packet;
  }
};
