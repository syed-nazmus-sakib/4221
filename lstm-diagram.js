document.addEventListener('DOMContentLoaded', () => {
  const names={forget:'Forget gate → old memory',input:'Input gate → write amount',candidate:'Candidate → new content',cell:'Cell state → merge memory',output:'Output gate → exposure',hidden:'Hidden state → final output'};
  const svg=`<div class="lstm-visual-head"><strong>LSTM architecture for this solution</strong><span class="lstm-now" aria-live="polite">Forget gate → old memory</span></div><div class="lstm-canvas"><svg class="lstm-svg" viewBox="0 0 960 390" role="img" aria-label="LSTM cell architecture with highlighted calculation path"><defs><marker id="lstm-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="context-stroke"/></marker></defs>
  <text x="18" y="62">C(t−1)</text><path class="wire flow" d="M85 57H260"/>
  <g class="stage active" data-stage="forget"><rect class="node" x="150" y="185" width="105" height="54" rx="10"/><text x="180" y="218">fₜ · σ</text><path class="wire flow" d="M202 185V120H285"/><circle class="op" cx="310" cy="120" r="25"/><text x="301" y="127">×</text><path class="wire flow" d="M310 95V57H455"/></g>
  <g class="stage" data-stage="input"><rect class="node" x="310" y="280" width="105" height="54" rx="10"/><text x="341" y="313">iₜ · σ</text><path class="wire flow" d="M363 280V220H475"/></g>
  <g class="stage" data-stage="candidate"><rect class="node" x="460" y="280" width="125" height="54" rx="10"/><text x="476" y="313">C̃ₜ · tanh</text><path class="wire flow" d="M523 280V245"/></g>
  <g class="stage" data-stage="cell"><circle class="op" cx="500" cy="220" r="25"/><text x="491" y="227">×</text><path class="wire flow" d="M500 195V145H525"/><circle class="op" cx="550" cy="120" r="25"/><text x="542" y="127">+</text><path class="wire flow" d="M575 120H700"/><rect class="node" x="610" y="30" width="88" height="54" rx="10"/><text x="632" y="63">Cₜ</text><path class="wire flow" d="M655 84V120"/></g>
  <g class="stage" data-stage="output"><rect class="node" x="650" y="280" width="105" height="54" rx="10"/><text x="680" y="313">oₜ · σ</text><path class="wire flow" d="M703 280V220H790"/></g>
  <g class="stage" data-stage="hidden"><rect class="node" x="690" y="158" width="90" height="45" rx="10"/><text class="small" x="706" y="186">tanh</text><path class="wire flow" d="M700 120V158"/><circle class="op" cx="815" cy="180" r="25"/><text x="806" y="187">×</text><path class="wire flow" d="M780 180H790M840 180H925"/><text x="866" y="164">hₜ</text></g>
  <text x="18" y="365">h(t−1), x(t)</text><path class="wire" d="M135 358H202V239M202 358H363V334M363 358H523V334M523 358H703V334"/><text class="small" x="380" y="382">shared inputs feed all four computations</text></svg></div><div class="lstm-legend"><span>σ = sigmoid gate</span><span>× = element-wise multiply</span><span>+ = combine memory</span><span>animated blue = current path</span></div>`;
  const visuals=[...document.querySelectorAll('.lstm-visual')];
  visuals.forEach(v=>{v.dataset.current='forget';v.innerHTML=svg});
  const stageFor=text=>{text=text.toLowerCase();if(text.includes('forget'))return'forget';if(text.includes('input gate'))return'input';if(text.includes('candidate'))return'candidate';if(text.includes('cell state')||text.includes('updated cell'))return'cell';if(text.includes('output gate'))return'output';if(text.includes('hidden state')||text.includes('final hidden'))return'hidden';return null};
  function precedingVisual(el){let pick=null;for(const v of visuals){if(v.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING)pick=v}return pick}
  function activate(v,stage){if(!v||!stage)return;v.dataset.current=stage;v.querySelectorAll('.stage').forEach(g=>g.classList.toggle('active',g.dataset.stage===stage));v.querySelector('.lstm-now').textContent=names[stage]}
  const headings=[...document.querySelectorAll('h2.sec,h3')].filter(h=>stageFor(h.textContent));
  let queued=false;
  function followScroll(){
    queued=false;
    const focusLine=innerHeight*.38;
    for(const v of visuals){
      const next=visuals[visuals.indexOf(v)+1];
      const local=headings.filter(h=>(v.compareDocumentPosition(h)&Node.DOCUMENT_POSITION_FOLLOWING)&&(!next||(h.compareDocumentPosition(next)&Node.DOCUMENT_POSITION_FOLLOWING)));
      if(!local.length)continue;
      let active=local[0];
      for(const h of local)if(h.getBoundingClientRect().top<=focusLine)active=h;
      activate(v,stageFor(active.textContent));
    }
  }
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(followScroll)}},{passive:true});
  addEventListener('resize',followScroll);
  followScroll();
});
