document.addEventListener('DOMContentLoaded', () => {
  const groups = [
    ['Object detection', [
      ['object-detection-1', 'object-detection-1'],
      ['object-detection-2', 'object-detection-2'],
      ['object-detection-3', 'object-detection-3']
    ]],
    ['Object detection practice', [
      ['object-det-2', 'same-class NMS'],
      ['object-det-3', 'same-class · 5 boxes'],
      ['object-det-4', 'multi-class · 5 boxes'],
      ['object-det-5', 'multi-class · 6 boxes'],
      ['object-det-6', 'multiple ground truths']
    ]],
    ['ANN', [['ANN-1','ANN-1 · forward + backprop'],['ANN-2','ANN-2 · 3→2→2 · sigmoid+CCE'],['ANN-3','ANN-3 · 2→3→2 · tanh+softmax'],['ANN-4','ANN-4 · 3→3→3 · softmax backprop']]],
    ['ANN regression', [['ANN-5','ANN-5 · all-linear + MSE'],['ANN-6','ANN-6 · ReLU + linear'],['ANN-7','ANN-7 · tanh + linear'],['ANN-8','ANN-8 · ReLU + sigmoid']]],
    ['LSTM', [['lstm-1','lstm-1'],['lstm-2','lstm-2'],['lstm-3','lstm-3']]],
    ['CNN', [['cnn-1','cnn-1'],['cnn-2','cnn-2'],['cnn-3','cnn-3'],['cnn-4','cnn-4'],['cnn-5','cnn-5'],['cnn-6','cnn-6'],['cnn-theory','cnn-theory']]],
    ['Extra', [['macs','macs · computational cost'],['receptive-field','receptive-field · theory']]]
  ];
  const current = location.pathname.split('/').pop() || 'index.html';
  const sidebar = document.createElement('aside');
  sidebar.className = 'study-sidebar';
  sidebar.id = 'study-sidebar';
  sidebar.setAttribute('aria-label', 'All problems');
  const home = document.createElement('a');
  home.className = 'study-home';
  home.href = 'index.html';
  home.textContent = 'ML exam · Index';
  if (current === 'index.html') home.setAttribute('aria-current', 'page');
  sidebar.append(home);
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Problems');
  for (const [name, pages] of groups) {
    const heading = document.createElement('div');
    heading.className = 'study-group';
    heading.textContent = name;
    nav.append(heading);
    for (const [page, label] of pages) {
      const link = document.createElement('a');
      link.className = 'study-link';
      link.href = `${page}.html`;
      link.textContent = label;
      if (current === `${page}.html`) link.setAttribute('aria-current', 'page');
      nav.append(link);
    }
  }
  sidebar.append(nav);
  const content = document.querySelector('body > .wrap');
  if (!content) return;
  const shell = document.createElement('main');
  shell.className = 'study-shell';
  const toggle = document.createElement('button');
  toggle.className = 'study-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', 'study-sidebar');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = '☰  Problems';
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('study-nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  const backdrop = document.createElement('div');
  backdrop.className = 'study-backdrop';
  backdrop.addEventListener('click', close);
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  function close() {
    document.body.classList.remove('study-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  content.before(sidebar, backdrop, shell);
  shell.append(toggle, content);
});
