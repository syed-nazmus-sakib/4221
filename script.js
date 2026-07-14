/* ===============================================================
   4221 Exam Prep — interactivity
   TOC build, scroll-spy, search filter, mobile menu, back-to-top
   =============================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content');
  const tocRoot = document.getElementById('toc-root');
  const sections = [...content.querySelectorAll('section.card')];

  /* ---- Build the Table of Contents grouped by part ---- */
  let currentGroupList = null;

  content.querySelectorAll('.part, section.card').forEach(node => {
    if (node.classList.contains('part')) {
      const title = node.querySelector('h1').textContent.trim();
      const group = document.createElement('div');
      group.className = 'toc-group';
      const gt = document.createElement('div');
      gt.className = 'toc-group-title';
      gt.textContent = title;
      const ul = document.createElement('ul');
      ul.className = 'toc';
      group.appendChild(gt);
      group.appendChild(ul);
      tocRoot.appendChild(group);
      currentGroupList = ul;
    } else {
      const h2 = node.querySelector('h2');
      if (!h2 || !currentGroupList) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + node.id;
      a.textContent = h2.textContent.trim();
      a.dataset.target = node.id;
      li.appendChild(a);
      currentGroupList.appendChild(li);
    }
  });

  const tocLinks = [...tocRoot.querySelectorAll('a')];

  /* ---- Scroll-spy ---- */
  const byId = {};
  tocLinks.forEach(a => (byId[a.dataset.target] = a));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(a => a.classList.remove('active'));
        const link = byId[entry.target.id];
        if (link) {
          link.classList.add('active');
          link.scrollIntoView({ block: 'nearest' });
        }
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));

  /* ---- TOC search filter ---- */
  const search = document.getElementById('toc-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    tocRoot.querySelectorAll('.toc-group').forEach(group => {
      let visibleInGroup = 0;
      group.querySelectorAll('li').forEach(li => {
        const match = li.textContent.toLowerCase().includes(q);
        li.style.display = match ? '' : 'none';
        if (match) visibleInGroup++;
      });
      group.style.display = visibleInGroup ? '' : 'none';
    });
  });

  /* ---- Mobile menu ---- */
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menu-btn');
  const scrim = document.getElementById('scrim');
  const toggle = (open) => {
    sidebar.classList.toggle('open', open);
    scrim.classList.toggle('show', open);
  };
  menuBtn.addEventListener('click', () => toggle(!sidebar.classList.contains('open')));
  scrim.addEventListener('click', () => toggle(false));
  tocLinks.forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 900) toggle(false);
  }));

  /* ---- Back to top ---- */
  const toTop = document.getElementById('to-top');
  window.addEventListener('scroll', () => {
    toTop.classList.toggle('show', window.scrollY > 600);
  });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
