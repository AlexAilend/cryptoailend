'use strict';

CryptoAilend.visuals = {
  escape(value) {
    const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value).replace(/[&<>"']/g, character => replacements[character]);
  },

  drawAlphabet(shift, decrypt, step) {
    const alphabet = CryptoAilend.config.alphabet;
    const escape = this.escape;
    let originalCells = '';
    let shiftedCells = '';

    for (let index = 0; index < alphabet.length; index += 1) {
      const letter = alphabet[index];
      const outputIndex = CryptoAilend.positiveModulo(index + (decrypt ? -shift : shift), 33);
      const outputLetter = alphabet[outputIndex];
      const selected = step && letter === step.input ? 'focus' : '';
      originalCells += `<div class="cell ${selected}">${escape(letter)}<small>${index}</small></div>`;
      shiftedCells += `<div class="cell ${selected}">${escape(outputLetter)}<small>${outputIndex}</small></div>`;
    }

    return `
      <div class="row-label">ВХІДНИЙ АЛФАВІТ</div>
      <div class="alphabet-row">${originalCells}</div>
      <div class="row-label">АЛФАВІТ ПІСЛЯ ЗСУВУ</div>
      <div class="alphabet-row">${shiftedCells}</div>
    `;
  },

  drawSquare(mode, step) {
    const alphabet = CryptoAilend.config.alphabet;
    const isVigenere = mode === 'vigenere';
    const size = isVigenere ? 33 : 6;
    let table = `<table class="square ${isVigenere ? '' : 'poly'}"><tr><th>↓ / →</th>`;

    for (let column = 0; column < size; column += 1) {
      table += `<th>${isVigenere ? alphabet[column] : column + 1}</th>`;
    }
    table += '</tr>';

    for (let row = 0; row < size; row += 1) {
      table += `<tr><th>${isVigenere ? alphabet[row] : row + 1}</th>`;
      for (let column = 0; column < size; column += 1) {
        let className = '';
        if (step && row === step.row && column === step.column) {
          className = 'hit';
        } else if (step && (row === step.row || column === step.column)) {
          className = 'lit';
        }
        const letter = isVigenere
          ? alphabet[(row + column + 2) % 33]
          : alphabet[row * 6 + column] || '·';
        table += `<td class="${className}">${letter}</td>`;
      }
      table += '</tr>';
    }
    table += '</table>';

    let selection = '';
    if (step) {
      const rowLabel = isVigenere ? alphabet[step.row] : step.row + 1;
      const columnLabel = isVigenere ? alphabet[step.column] : step.column + 1;
      selection = `<div class="square-selection">Рядок <b>${rowLabel}</b> · стовпець <b>${columnLabel}</b> · ${this.escape(step.input)} → <b>${this.escape(step.output)}</b></div>`;
    }
    return `${selection}<div class="grid-scroll">${table}</div>`;
  },

  drawRsa(keys) {
    const parameters = [
      ['МОДУЛЬ N', keys.modulus],
      ['ФУНКЦІЯ φ(N)', keys.phi],
      ['ВІДКРИТИЙ e', keys.e],
      ['ЗАКРИТИЙ d', keys.d]
    ];
    return '<div class="rsa-stats">' + parameters.map(([label, value]) => {
      return `<div class="stat"><span>${label}</span><b>${value}</b></div>`;
    }).join('') + '</div>';
  },

  focusSelectedCell(container) {
    const square = container.querySelector('.grid-scroll');
    const selectedCell = container.querySelector('.hit');
    if (square && selectedCell) {
      const cellBounds = selectedCell.getBoundingClientRect();
      const squareBounds = square.getBoundingClientRect();
      square.scrollLeft += cellBounds.left - squareBounds.left - square.clientWidth / 2 + cellBounds.width / 2;
      square.scrollTop += cellBounds.top - squareBounds.top - square.clientHeight / 2 + cellBounds.height / 2;
    }
    for (const row of container.querySelectorAll('.alphabet-row')) {
      const selectedLetter = row.querySelector('.focus');
      if (selectedLetter) {
        row.scrollLeft = selectedLetter.offsetLeft - row.offsetLeft - row.clientWidth / 2;
      }
    }
  },

  drawTrace(steps) {
    return steps.map((step, index) => {
      return `<tr><td>${index + 1}</td><td>${this.escape(step.input)}</td><td>${this.escape(step.detail)}</td><td>${this.escape(step.output)}</td></tr>`;
    }).join('');
  }
};
