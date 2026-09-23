// Simple feed-forward network sketch.
// Usage: <div class="ann-net" data-layers="3,2,1" data-act="ReLU|Sigmoid" data-loss="BCE"></div>
document.addEventListener('DOMContentLoaded', () => {
  const nets = [...document.querySelectorAll('.ann-net')];
  if (!nets.length) return;

  const SUB = ['₁','₂','₃','₄','₅','₆','₇','₈','₉'];
  const SUP = ['⁽¹⁾', '⁽²⁾', '⁽³⁾']; // ⁽¹⁾ ⁽²⁾ ⁽³⁾
  const sub = i => SUB[i] || '';

  function labelsFor(layerIndex, lastIndex, n) {
    const base = layerIndex === 0 ? 'x' : (layerIndex === lastIndex ? 'ŷ' : 'h');
    if (n === 1) return [base];
    return Array.from({length: n}, (_, i) => base + sub(i));
  }

  nets.forEach(el => {
    const counts = (el.dataset.layers || '3,2,1').split(',').map(v => parseInt(v.trim(), 10));
    const acts   = (el.dataset.act || 'ReLU|Sigmoid').split('|').map(s => s.trim());
    const loss   = (el.dataset.loss || '').trim();
    const L = counts.length, last = L - 1;

    const W = 640, H = 236, R = 21, CY = 112, VGAP = 58, X0 = 115, HGAP = 190;
    const xs = counts.map((_, i) => X0 + i * HGAP);
    const ysOf = n => Array.from({length: n}, (_, i) => CY + (i - (n - 1) / 2) * VGAP);
    const ys = counts.map(ysOf);

    let s = '';

    // edges first so nodes sit on top
    for (let i = 0; i < last; i++) {
      for (const y1 of ys[i]) for (const y2 of ys[i + 1]) {
        s += `<line class="edge" x1="${xs[i] + R}" y1="${y1}" x2="${xs[i + 1] - R}" y2="${y2}"/>`;
      }
    }

    // weight-matrix labels, sitting above the edge bundles
    for (let i = 0; i < last; i++) {
      const mx = (xs[i] + xs[i + 1]) / 2;
      s += `<text class="wlabel" x="${mx}" y="46" text-anchor="middle">W${SUP[i]} ${counts[i]}×${counts[i + 1]}</text>`;
    }

    // nodes + column captions
    const titles = counts.map((_, i) => i === 0 ? 'Input' : (i === last ? 'Output' : 'Hidden'));
    counts.forEach((n, i) => {
      const names = labelsFor(i, last, n);
      ys[i].forEach((y, j) => {
        s += `<circle class="node${i === 0 ? ' in' : ''}" cx="${xs[i]}" cy="${y}" r="${R}"/>`;
        s += `<text class="nlabel" x="${xs[i]}" y="${y + 6}" text-anchor="middle">${names[j]}</text>`;
      });
      s += `<text class="title" x="${xs[i]}" y="26" text-anchor="middle">${titles[i]}</text>`;
      let detail;
      if (i === 0) detail = `${n} input${n > 1 ? 's' : ''}`;
      else detail = `${acts[i - 1] || ''} + b${SUP[i - 1]}`;
      s += `<text class="sub" x="${xs[i]}" y="214" text-anchor="middle">${detail}</text>`;
    });

    // loss tag on the right
    if (loss) {
      const x = xs[last] + R;
      s += `<line class="edge out" x1="${x}" y1="${CY}" x2="${x + 36}" y2="${CY}"/>`;
      s += `<text class="lossL" x="${x + 46}" y="${CY + 6}">L</text>`;
      s += `<text class="sub" x="${x + 46}" y="${CY + 26}">${loss}</text>`;
    }

    const hidden = counts.slice(1, last).map((n, i) => `${n} hidden (${acts[i] || ''})`).join(' → ');
    const outAct = acts[last - 1] || '';
    const caption = `${counts[0]} inputs → ${hidden} → ${counts[last]} output${counts[last] > 1 ? 's' : ''} (${outAct})`
      + (loss ? `, scored with ${loss}` : '')
      + '. Every arrow is one weight; every hidden and output neuron also has its own bias.';

    el.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${caption}">${s}</svg>` +
      `<p class="ann-net-cap">${caption}</p>`;
  });
});
