'use strict';

CryptoAilend.rsa = {
  isPrime(number) {
    if (number < 2n) return false;
    for (let divisor = 2n; divisor * divisor <= number; divisor += 1n) {
      if (number % divisor === 0n) return false;
    }
    return true;
  },

  findInverse(number, modulus) {
    let remainder = modulus;
    let nextRemainder = number;
    let coefficient = 0n;
    let nextCoefficient = 1n;
    const steps = [];

    while (nextRemainder !== 0n) {
      const quotient = remainder / nextRemainder;
      const newRemainder = remainder - quotient * nextRemainder;
      const newCoefficient = coefficient - quotient * nextCoefficient;

      steps.push({
        input: remainder.toString(),
        output: newRemainder.toString(),
        detail: `${remainder} = ${quotient} × ${nextRemainder} + ${newRemainder}`,
        explanation: 'Алгоритм Евкліда ділить попередню остачу на наступну. Остання ненульова остача має дорівнювати 1, щоб обернений елемент існував.'
      });
      remainder = nextRemainder;
      nextRemainder = newRemainder;
      coefficient = nextCoefficient;
      nextCoefficient = newCoefficient;
    }

    if (remainder !== 1n) {
      throw new Error('d та φ(N) мають бути взаємно простими.');
    }
    return {
      value: CryptoAilend.positiveModulo(coefficient, modulus),
      steps
    };
  },

  createKeys(pValue, qValue, dValue) {
    const readInteger = CryptoAilend.validation.readInteger;
    const p = readInteger(pValue, 'p');
    const q = readInteger(qValue, 'q');
    const d = readInteger(dValue, 'd');

    if (p > 10000000n || q > 10000000n) {
      throw new Error('Для навчального режиму p та q не більше 10 000 000.');
    }
    if (p === q || !this.isPrime(p) || !this.isPrime(q)) {
      throw new Error('p та q мають бути різними простими числами.');
    }

    const modulus = p * q;
    const phi = (p - 1n) * (q - 1n);
    if (d <= 1n || d >= phi) {
      throw new Error('Потрібно 1 < d < φ(N).');
    }
    const inverse = this.findInverse(d, phi);
    return { p, q, d, e: inverse.value, modulus, phi, steps: inverse.steps };
  },

  power(base, exponent, modulus) {
    let factor = base % modulus;
    let remainingExponent = exponent;
    let result = 1n;
    const steps = [];

    while (remainingExponent > 0n) {
      const bit = remainingExponent % 2n;
      const previousResult = result;
      if (bit === 1n) {
        result = result * factor % modulus;
      }
      steps.push({
        input: remainingExponent.toString(),
        output: result.toString(),
        detail: `Біт ${bit}; r=${previousResult}; a=${factor}; нове r=${result}`,
        explanation: bit === 1n
          ? `Молодший біт дорівнює 1. Множимо ${previousResult} на ${factor} за модулем ${modulus}: отримуємо ${result}. Далі підносимо основу до квадрата й ділимо показник на 2.`
          : `Молодший біт дорівнює 0. Результат ${result} залишаємо без змін. Далі підносимо основу до квадрата за модулем ${modulus} й ділимо показник на 2.`
      });
      factor = factor * factor % modulus;
      remainingExponent /= 2n;
    }
    return { value: result, steps };
  },

  calculate(input, keys, decrypt = false, savedLengths = null) {
    CryptoAilend.validation.checkRsaInput(input);
    const blockWidth = keys.modulus.toString().length - 1;
    if (blockWidth < 1) {
      throw new Error('Модуль надто малий для десяткового блокового кодування.');
    }

    let blocks;
    if (decrypt) {
      blocks = input.split(/\s+/);
    } else {
      if (/\s/.test(input)) throw new Error('Введіть M одним числом.');
      blocks = [];
      if (BigInt(input) < keys.modulus) {
        blocks.push(input);
      } else {
        for (let index = 0; index < input.length; index += blockWidth) {
          blocks.push(input.slice(index, index + blockWidth));
        }
      }
    }

    const exponent = decrypt ? keys.d : keys.e;
    const reverseExponent = decrypt ? keys.e : keys.d;
    const output = [];
    const steps = [...keys.steps];

    for (let index = 0; index < blocks.length; index += 1) {
      const number = BigInt(blocks[index]);
      if (number >= keys.modulus) {
        throw new Error('Кожний блок має бути меншим за N.');
      }
      const calculation = this.power(number, exponent, keys.modulus);
      let outputBlock = calculation.value.toString();
      if (decrypt && savedLengths) {
        outputBlock = outputBlock.padStart(savedLengths[index], '0');
      }
      output.push(outputBlock);
      steps.push({
        input: blocks[index],
        output: outputBlock,
        detail: `Блок ${index + 1}: ${number} ^ ${exponent} mod ${keys.modulus}`,
        explanation: `Обчислюємо ${decrypt ? 'відкритий текст' : 'шифротекст'} блока ${index + 1} за допомогою швидкого модульного піднесення до степеня.`
      });
      steps.push(...calculation.steps);
    }

    const reverseBlocks = output.map(block => {
      return this.power(BigInt(block), reverseExponent, keys.modulus).value.toString();
    });
    const verified = reverseBlocks.every((block, index) => BigInt(block) === BigInt(blocks[index]));
    const lengths = decrypt ? savedLengths : blocks.map(block => block.length);
    const reverseText = decrypt
      ? reverseBlocks.join(' ')
      : reverseBlocks.map((block, index) => block.padStart(lengths[index], '0')).join('');

    let result = output.join(' ');
    if (decrypt && savedLengths) result = output.join('');
    return {
      result,
      steps,
      verified,
      reverseText,
      blocks,
      blockLengths: lengths,
      blockWidth,
      outputBlocks: output
    };
  }
};
