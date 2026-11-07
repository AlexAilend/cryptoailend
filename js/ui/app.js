'use strict';

const lab = CryptoAilend;
const getElement = id => document.getElementById(id);

const state = {
  mode: 'caesar',
  decrypt: false,
  stepIndex: 0,
  experiment: null,
  rsaPacket: null
};

const screenTitles = {
  caesar: {
    title: 'Секрет починається<br>зі <em>зсуву.</em>',
    subtitle: 'Одна ідея, що змінила історію таємного листування.<br>Побачте математику за кожною літерою.',
    tag: 'ROT / 33'
  },
  vigenere: {
    title: 'Один текст.<br><em>Безліч зсувів.</em>',
    subtitle: 'Ключ задає маршрут крізь квадрат Віженера.<br>Дослідіть кожний перетин у таблиці ROT2.',
    tag: 'ROT2 / 33 × 33'
  },
  polybius: {
    title: 'У кожної літери<br>є <em>координати.</em>',
    subtitle: 'Перетворіть повідомлення на маршрут по квадрату.<br>Рядок, стовпець — і секрет записано числами.',
    tag: 'GRID / 6 × 6'
  },
  rsa: {
    title: 'Великі числа.<br><em>Точні відповіді.</em>',
    subtitle: 'Від простих множників до пари ключів.<br>Дослідіть асиметричну криптографію крок за кроком.',
    tag: 'RSA / BIGINT'
  }
};

function showError(message) {
  getElement('error').textContent = message;
}

function updateDirectionButtons() {
  getElement('enc').classList.toggle('selected', !state.decrypt);
  getElement('dec').classList.toggle('selected', state.decrypt);
  getElement('run').textContent = state.decrypt
    ? 'Виконати розшифрування →'
    : 'Виконати шифрування →';
}

function selectMode(mode) {
  state.mode = mode;
  state.decrypt = false;
  state.rsaPacket = null;
  getElement('message').value = lab.config.fullName;
  getElement('number').value = lab.config.rsa.message;

  document.querySelectorAll('nav button').forEach(button => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  getElement('title').innerHTML = screenTitles[mode].title;
  getElement('subtitle').innerHTML = screenTitles[mode].subtitle;
  getElement('tag').textContent = screenTitles[mode].tag;
  getElement('crumb').textContent = mode === 'rsa'
    ? 'АСИМЕТРИЧНА КРИПТОГРАФІЯ'
    : 'КЛАСИЧНІ ШИФРИ';
  getElement('text-controls').hidden = mode === 'rsa';
  getElement('rsa-controls').hidden = mode !== 'rsa';
  getElement('shift-wrap').hidden = mode !== 'caesar';
  getElement('key-wrap').hidden = mode !== 'vigenere';
  getElement('rsa-packet-tools').hidden = mode !== 'rsa';
  updateDirectionButtons();
  runExperiment();
}

function selectDirection(decrypt) {
  state.decrypt = decrypt;
  state.rsaPacket = null;
  if (state.mode === 'rsa') {
    getElement('number').value = decrypt ? lab.config.rsa.ciphertext : lab.config.rsa.message;
  }
  if (state.mode === 'polybius') {
    getElement('message').value = decrypt
      ? lab.polybius(lab.config.fullName).result
      : lab.config.fullName;
  }
  updateDirectionButtons();
  runExperiment();
}

function readKeys() {
  return lab.rsa.createKeys(
    getElement('p').value,
    getElement('q').value,
    getElement('d').value
  );
}

function calculateClassical(input) {
  const shift = Number(getElement('shift').value);
  const key = getElement('key').value;
  let calculation;
  let reverseText;
  let formula;

  if (state.mode === 'caesar') {
    calculation = lab.caesar(input, shift, state.decrypt);
    reverseText = lab.caesar(calculation.result, shift, !state.decrypt).result;
    formula = `c = (x ${state.decrypt ? '−' : '+'} ${shift}) mod 33 · індексація від 0`;
  } else if (state.mode === 'vigenere') {
    calculation = lab.vigenere(input, key, state.decrypt);
    reverseText = lab.vigenere(calculation.result, key, !state.decrypt).result;
    formula = `T[r, c] = A[(r + c + 2) mod 33] · ключ ${key.toUpperCase()}`;
  } else {
    calculation = lab.polybius(input, state.decrypt);
    reverseText = lab.polybius(calculation.result, !state.decrypt).result;
    formula = 'Координата = (рядок, стовпець) · нумерація від 1';
  }

  let normalizedInput = input.toUpperCase();
  if (state.mode === 'polybius' && state.decrypt) {
    normalizedInput = input.trim().replace(/\s+/g, ' ');
  }
  calculation.reverseText = reverseText;
  calculation.verified = reverseText === normalizedInput;
  return { calculation, formula, keys: null };
}

function calculateRsa(input) {
  const keys = readKeys();
  let savedLengths = null;
  if (state.decrypt && state.rsaPacket) {
    const packet = state.rsaPacket;
    if (packet.modulus === keys.modulus.toString() && packet.ciphertext.join(' ') === input) {
      savedLengths = packet.blockLengths;
    }
  }
  const calculation = lab.rsa.calculate(input, keys, state.decrypt, savedLengths);
  let formula = `Ek = (${keys.e}, ${keys.modulus}) · Dk = (${keys.d}, ${keys.modulus})`;
  if (!state.decrypt) {
    formula += ` · Блоки M: ${calculation.blocks.join(' | ')}`;
  } else if (savedLengths) {
    formula += ` · Довжини блоків: ${savedLengths.join(', ')}; повідомлення об’єднано`;
  } else {
    formula += ' · Довжини не задано: вихідні блоки показано окремо';
  }
  return { calculation, formula, keys };
}

function runExperiment() {
  try {
    const input = state.mode === 'rsa'
      ? getElement('number').value.trim()
      : getElement('message').value;
    lab.validation.checkText(input);
    const result = state.mode === 'rsa' ? calculateRsa(input) : calculateClassical(input);
    state.experiment = { ...result, input, mode: state.mode, decrypt: state.decrypt };
    state.stepIndex = 0;
    showError('');
    getElement('result').textContent = result.calculation.result;
    getElement('verification').textContent = `${result.calculation.verified ? '✓ Перевірку пройдено' : 'Перевірте введення'} · Зворотне перетворення: ${result.calculation.reverseText}`;
    getElement('formula').textContent = result.formula;
    getElement('count').textContent = `${input.length} символів`;
    getElement('trace').innerHTML = lab.visuals.drawTrace(result.calculation.steps);
    getElement('export-rsa').disabled = state.mode !== 'rsa' || state.decrypt;
    getElement('reuse').disabled = false;
    drawStep();
  } catch (error) {
    state.experiment = null;
    showError(error.message);
    for (const id of ['result', 'verification', 'visual', 'trace', 'tokens', 'step-card', 'formula', 'position', 'explanation']) {
      getElement(id).replaceChildren();
    }
    getElement('explanation').hidden = true;
    getElement('reuse').disabled = true;
    getElement('export-rsa').disabled = true;
  }
}

function drawStep() {
  const experiment = state.experiment;
  if (!experiment) return;

  const steps = experiment.calculation.steps;
  const step = steps[state.stepIndex];
  const escape = lab.visuals.escape;
  getElement('position').textContent = `${step ? state.stepIndex + 1 : 0} / ${steps.length}`;
  getElement('prev').disabled = state.stepIndex === 0;
  getElement('next').disabled = state.stepIndex >= steps.length - 1;
  getElement('step-card').innerHTML = step
    ? `<div class="big-letter">${escape(step.input)} → ${escape(step.output)}</div><div class="step-detail">КРОК ${state.stepIndex + 1}<br>${escape(step.detail)}</div>`
    : 'Немає літер для перетворення.';
  getElement('explanation').textContent = step ? step.explanation : 'У тексті немає літер обраної абетки.';

  getElement('tokens').innerHTML = steps.slice(0, 400).map((item, index) => {
    const label = state.mode === 'rsa' ? index + 1 : item.input;
    const selected = index === state.stepIndex ? 'selected' : '';
    return `<button class="${selected}" data-step="${index}" aria-label="Крок ${index + 1}">${escape(label)}</button>`;
  }).join('');

  let visualization;
  if (state.mode === 'rsa') {
    visualization = lab.visuals.drawRsa(experiment.keys);
  } else if (state.mode === 'caesar') {
    visualization = lab.visuals.drawAlphabet(Number(getElement('shift').value), state.decrypt, step);
  } else {
    visualization = lab.visuals.drawSquare(state.mode, step);
  }
  getElement('visual').innerHTML = visualization;
  lab.visuals.focusSelectedCell(getElement('visual'));
}

function reuseResult() {
  const experiment = state.experiment;
  if (!experiment) return;
  if (state.mode === 'rsa' && state.decrypt && !experiment.calculation.blockLengths) {
    showError('Для зворотного шифрування скопіюйте один блок або імпортуйте RSA-пакет із довжинами.');
    return;
  }
  state.rsaPacket = null;
  if (state.mode === 'rsa' && !state.decrypt) {
    state.rsaPacket = {
      modulus: experiment.keys.modulus.toString(),
      ciphertext: experiment.calculation.outputBlocks,
      blockLengths: experiment.calculation.blockLengths
    };
  }
  getElement(state.mode === 'rsa' ? 'number' : 'message').value = experiment.calculation.result;
  state.decrypt = !state.decrypt;
  updateDirectionButtons();
  runExperiment();
}

async function importRsaPacket(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 100000) throw new Error('RSA-пакет завеликий: максимум 100 КБ.');
    const packet = lab.export.parseRsaPacket(await file.text(), readKeys());
    state.rsaPacket = packet;
    state.decrypt = true;
    getElement('number').value = packet.ciphertext.join(' ');
    updateDirectionButtons();
    runExperiment();
  } catch (error) {
    showError(error.message);
  }
  event.target.value = '';
}

function showChecks() {
  const checks = lab.runChecks();
  const passed = checks.filter(check => check.passed).length;
  getElement('checks-summary').textContent = `${passed} / ${checks.length} перевірок пройдено`;
  getElement('checks-results').innerHTML = checks.map(check => {
    return `<tr><td>${check.passed ? '✓' : '✕'} ${lab.visuals.escape(check.name)}</td><td>${lab.visuals.escape(check.expected)}</td><td>${lab.visuals.escape(check.actual)}</td></tr>`;
  }).join('');
  getElement('checks-dialog').showModal();
}

function connectEvents() {
  document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', () => selectMode(button.dataset.mode));
  });
  getElement('enc').addEventListener('click', () => selectDirection(false));
  getElement('dec').addEventListener('click', () => selectDirection(true));
  getElement('run').addEventListener('click', runExperiment);
  getElement('reuse').addEventListener('click', reuseResult);
  getElement('shift').addEventListener('input', () => {
    getElement('shift-value').textContent = getElement('shift').value;
    runExperiment();
  });
  getElement('example').addEventListener('click', () => {
    getElement('message').value = state.mode === 'polybius' && state.decrypt
      ? lab.polybius(lab.config.fullName).result
      : lab.config.fullName;
    runExperiment();
  });
  getElement('rsa-example').addEventListener('click', () => {
    for (const id of ['p', 'q', 'd']) getElement(id).value = lab.config.rsa[id];
    state.rsaPacket = null;
    getElement('number').value = state.decrypt ? lab.config.rsa.ciphertext : lab.config.rsa.message;
    runExperiment();
  });
  getElement('prev').addEventListener('click', () => {
    if (state.stepIndex > 0) state.stepIndex -= 1;
    drawStep();
  });
  getElement('next').addEventListener('click', () => {
    if (state.experiment && state.stepIndex < state.experiment.calculation.steps.length - 1) state.stepIndex += 1;
    drawStep();
  });
  getElement('tokens').addEventListener('click', event => {
    const button = event.target.closest('[data-step]');
    if (!button) return;
    state.stepIndex = Number(button.dataset.step);
    drawStep();
  });
  getElement('explain').addEventListener('click', () => {
    getElement('explanation').hidden = !getElement('explanation').hidden;
  });
  getElement('theme').addEventListener('click', () => document.body.classList.toggle('light'));
  getElement('help').addEventListener('click', () => getElement('dialog').showModal());
  getElement('close').addEventListener('click', () => getElement('dialog').close());
  getElement('checks').addEventListener('click', showChecks);
  getElement('close-checks').addEventListener('click', () => getElement('checks-dialog').close());
  getElement('copy').addEventListener('click', async () => {
    if (!state.experiment) return;
    try {
      await navigator.clipboard.writeText(state.experiment.calculation.result);
      getElement('copy').textContent = 'Скопійовано ✓';
      setTimeout(() => { getElement('copy').textContent = 'Копіювати'; }, 1800);
    } catch {
      showError('Копіювання недоступне. Виділіть результат вручну.');
    }
  });
  getElement('export').addEventListener('click', () => {
    if (state.experiment) lab.export.saveText(state.experiment);
  });
  getElement('export-rsa').addEventListener('click', () => {
    if (state.experiment && !state.decrypt) lab.export.saveRsaPacket(state.experiment);
  });
  getElement('import-rsa').addEventListener('click', () => getElement('rsa-file').click());
  getElement('rsa-file').addEventListener('change', importRsaPacket);
  getElement('print').addEventListener('click', () => {
    document.querySelector('details').open = true;
    window.print();
  });
}

connectEvents();
runExperiment();
