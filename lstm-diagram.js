document.addEventListener('DOMContentLoaded', () => {
  const names = {
    forget: 'Forget gate → keep old memory',
    input: 'Input gate → how much to write',
    candidate: 'Candidate → what to write',
    cell: 'Cell state → merge memory',
    output: 'Output gate → how much to expose',
    hidden: 'Hidden state → final output',
    all: 'Full cell → every path'
  };
  const notes = {
    forget: 'Highlighted: the <b>σ</b> box producing <b>fₜ</b>, and the <b>×</b> sitting directly on the memory line. fₜ scales the <b>old</b> cell state element-wise — it decides how much of the previous memory survives. Nothing new is written on this path.',
    input: 'Highlighted: the <b>σ</b> box producing <b>iₜ</b> and its wire into the middle <b>×</b>. This gate carries no content — it only decides <b>how much</b> of the candidate is allowed through.',
    candidate: 'Highlighted: the <b>tanh</b> box producing <b>C̃ₜ</b>, feeding that same middle <b>×</b>. This is the <b>content</b> being proposed for writing — tanh, not sigmoid, so it may be negative.',
    cell: 'Highlighted: the middle <b>×</b> (iₜ ⊙ C̃ₜ), the <b>+</b> where it joins the kept old memory (fₜ ⊙ Cₜ₋₁), and the <b>Cₜ</b> line leaving along the top. This is the only place the two memory streams meet.',
    output: 'Highlighted: the <b>σ</b> box producing <b>oₜ</b> and its wire up into the right-hand <b>×</b>. Cₜ is already final by now — this gate only decides how much of it is <b>exposed</b> as the hidden state.',
    hidden: 'Highlighted: the tap off the memory line into <b>tanh</b>, the right-hand <b>×</b> with oₜ, and <b>hₜ</b> leaving the cell. The squash applies to a <b>copy</b> of Cₜ — the memory itself continues along the top un-squashed.',
    all: 'The whole cell. The <b>memory line</b> runs straight across the top: Cₜ₋₁ enters, one <b>×</b> erases, one <b>+</b> writes, Cₜ leaves. The <b>input bus</b> along the bottom carries hₜ₋₁, xₜ up into all four boxes. Only <b>Cₜ</b> and <b>hₜ</b> leave the cell.'
  };

  const svg = `<svg class="lstm-svg" viewBox="0 44 830 348" role="img" aria-label="LSTM cell architecture with highlighted calculation path">
<defs>
  <marker id="ar" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0,0 L11,5 L0,10 z" fill="#5c6b84"/></marker>
  <marker id="ar-on" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0,0 L11,5 L0,10 z" fill="#8ab4ff"/></marker>
</defs>

<rect class="cell-box" x="108" y="52" width="684" height="338" rx="18"/>
<text class="io" x="14" y="103">C\u209C\u208B\u2081</text>
<text class="io" x="6" y="351">h\u209C\u208B\u2081 , x\u209C</text>
<path class="wire" d="M76 110H193"/>
<path class="wire bus" d="M100 358H710"/>
<circle class="dot" cx="215" cy="358" r="4"/><circle class="dot" cx="325" cy="358" r="4"/>
<circle class="dot" cx="445" cy="358" r="4"/><circle class="dot" cx="710" cy="358" r="4"/>
<path class="wire" d="M215 358V315"/><path class="wire" d="M325 358V315"/>
<path class="wire" d="M445 358V315"/><path class="wire" d="M710 358V315"/>
<text class="cap" x="405" y="382" text-anchor="middle">the same h\u209C\u208B\u2081 , x\u209C feed all four boxes \u2014 only the weights differ</text>

<g class="stage" data-stage="forget">
  <rect class="node" x="167" y="265" width="96" height="50" rx="9"/>
  <text x="215" y="288" text-anchor="middle">\u03C3</text><text class="sub" x="215" y="306" text-anchor="middle">forget f\u209C</text>
  <path class="wire" d="M215 265V132"/>
  <circle class="op" cx="215" cy="110" r="22"/><text x="215" y="118" text-anchor="middle">\u00D7</text>
  <path class="wire" d="M237 110H363"/>
  <text class="tag" x="300" y="97" text-anchor="middle">f\u209C \u2299 C\u209C\u208B\u2081</text>
</g>

<g class="stage" data-stage="input">
  <rect class="node" x="279" y="265" width="92" height="50" rx="9"/>
  <text x="325" y="288" text-anchor="middle">\u03C3</text><text class="sub" x="325" y="306" text-anchor="middle">input i\u209C</text>
  <path class="wire" d="M325 265V200H363"/>
</g>

<g class="stage" data-stage="candidate">
  <rect class="node" x="387" y="265" width="116" height="50" rx="9"/>
  <text x="445" y="288" text-anchor="middle">tanh</text><text class="sub" x="445" y="306" text-anchor="middle">candidate C\u0303\u209C</text>
  <path class="wire" d="M445 265V200H407"/>
</g>

<g class="stage" data-stage="cell">
  <circle class="op" cx="385" cy="200" r="22"/><text x="385" y="208" text-anchor="middle">\u00D7</text>
  <path class="wire" d="M385 178V132"/>
  <text class="tag" x="399" y="162">i\u209C \u2299 C\u0303\u209C</text>
  <circle class="op" cx="385" cy="110" r="22"/><text x="385" y="119" text-anchor="middle">+</text>
  <path class="wire" d="M407 110H812"/>
  <circle class="dot" cx="610" cy="110" r="4"/>
  <text class="io" x="764" y="94">C\u209C</text>
</g>

<g class="stage" data-stage="output">
  <rect class="node" x="662" y="265" width="96" height="50" rx="9"/>
  <text x="710" y="288" text-anchor="middle">\u03C3</text><text class="sub" x="710" y="306" text-anchor="middle">output o\u209C</text>
  <path class="wire" d="M710 265V222"/>
</g>

<g class="stage" data-stage="hidden">
  <path class="wire" d="M610 110V180"/>
  <rect class="node" x="568" y="180" width="84" height="42" rx="9"/>
  <text x="610" y="207" text-anchor="middle">tanh</text>
  <path class="wire" d="M652 201H688"/>
  <circle class="op" cx="710" cy="200" r="22"/><text x="710" y="208" text-anchor="middle">\u00D7</text>
  <path class="wire" d="M732 200H812"/>
  <text class="io" x="764" y="184">h\u209C</text>
</g>
</svg>`;

  const legend = `<div class="lstm-legend"><span>σ = sigmoid, a valve in (0,1)</span><span>tanh = content in (−1,1)</span><span>× = element-wise multiply</span><span>+ = write into memory</span></div>`;

  const visuals = [...document.querySelectorAll('.lstm-visual')];
  if (!visuals.length) return;

  visuals.forEach(v => {
    const pinned = v.dataset.stage || '';
    const title = v.dataset.label || (pinned ? 'LSTM cell — path used here' : 'LSTM architecture for this solution');
    v.classList.toggle('is-pinned', Boolean(pinned));
    v.innerHTML =
      `<div class="lstm-visual-head"><strong>${title}</strong><span class="lstm-now"${pinned ? '' : ' aria-live="polite"'}></span></div>` +
      `<div class="lstm-canvas">${svg}</div>` +
      `<p class="lstm-note"></p>` + legend;
    activate(v, pinned || 'forget');
  });

  function activate(v, stage) {
    if (!v || !stage) return;
    v.dataset.current = stage;
    v.querySelectorAll('.stage').forEach(g => {
      g.classList.toggle('active', stage === 'all' || g.dataset.stage === stage);
    });
    v.querySelector('.lstm-now').textContent = names[stage] || '';
    const note = v.querySelector('.lstm-note');
    if (note) note.innerHTML = v.dataset.note || notes[stage] || '';
  }

  // Instances without a pinned stage keep following the solution as you scroll.
  const roaming = visuals.filter(v => !v.dataset.stage);
  if (!roaming.length) return;
  const stageFor = text => {
    text = text.toLowerCase();
    if (text.includes('forget')) return 'forget';
    if (text.includes('input gate')) return 'input';
    if (text.includes('candidate')) return 'candidate';
    if (text.includes('cell state') || text.includes('updated cell')) return 'cell';
    if (text.includes('output gate')) return 'output';
    if (text.includes('hidden state') || text.includes('final hidden')) return 'hidden';
    return null;
  };
  const headings = [...document.querySelectorAll('h2.sec,h3')].filter(h => stageFor(h.textContent));
  let queued = false;
  function followScroll() {
    queued = false;
    const focusLine = innerHeight * .38;
    for (const v of roaming) {
      const next = roaming[roaming.indexOf(v) + 1];
      const local = headings.filter(h =>
        (v.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        (!next || (h.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING)));
      if (!local.length) continue;
      let active = local[0];
      for (const h of local) if (h.getBoundingClientRect().top <= focusLine) active = h;
      activate(v, stageFor(active.textContent));
    }
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(followScroll) } }, { passive: true });
  addEventListener('resize', followScroll);
  followScroll();
});
