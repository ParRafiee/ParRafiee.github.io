document.documentElement.classList.add('js');

// Profile links from window.LINKS; dim any button whose link is not set yet.
document.querySelectorAll('[data-link]').forEach((a) => {
  const url = (window.LINKS || {})[a.dataset.link];
  if (url) a.href = url;
  else a.classList.add('is-missing');
});

// Nav: hairline border once scrolled, mobile menu toggle.
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// Publications: show all / show fewer.
const pubList = document.getElementById('pubList');
const pubToggle = document.getElementById('pubToggle');
pubToggle.addEventListener('click', () => {
  const expanded = pubList.classList.toggle('expanded');
  pubToggle.setAttribute('aria-expanded', expanded);
  pubToggle.firstChild.textContent = expanded ? 'Show fewer ' : 'Show all publications ';
  pubList.querySelectorAll('.is-extra').forEach((el) => el.classList.add('in'));
});

// Fade-in on scroll.
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

document.getElementById('year').textContent = new Date().getFullYear();

// Featured project charts: grouped bars by sample size, hover tooltip per bar.
const PROJECT_DATA = {
  methods: [
    { key: 'bcov', label: 'B-Cov' },
    { key: 'fiml', label: 'FIML' },
    { key: 'breg', label: 'B-Reg' },
  ],
  groups: ['50', '100', '200'],
  conv: { max: 1, label: true, ticks: [0, 0.5, 1], fmt: (v) => Math.round(v * 100) + '%',
          values: { bcov: [0.94, 0.97, 0.96], fiml: [0.37, 0.45, 0.52], breg: [0.85, 0.93, 0.93] } },
  mse:  { max: 2, ticks: [0, 1, 2], fmt: (v) => v.toFixed(2),
          values: { bcov: [0.09, 0.08, 0.06], fiml: [0.45, 0.88, 1.74], breg: [0.81, 0.18, 0.11] } },
};

document.querySelectorAll('.chart[data-chart]').forEach((el) => {
  const spec = PROJECT_DATA[el.dataset.chart];
  const { methods, groups } = PROJECT_DATA;
  const W = 420, H = 190, L = 40, R = 6, T = 18, B = 26;
  const iw = W - L - R, ih = H - T - B;
  const gw = iw / groups.length, bw = 24, gap = 2;
  const y = (v) => T + ih - (v / spec.max) * ih;
  const ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => { const n = document.createElementNS(ns, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  const title = document.createElement('div');
  title.className = 'chart-title';
  title.textContent = el.dataset.title;
  el.appendChild(title);

  const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': el.getAttribute('aria-label') });
  spec.ticks.forEach((t) => {
    svg.appendChild(mk('line', { class: 'grid', x1: L, x2: W - R, y1: y(t), y2: y(t) }));
    const lab = mk('text', { class: 'tick', x: L - 6, y: y(t) + 4, 'text-anchor': 'end' });
    lab.textContent = spec.fmt(t);
    svg.appendChild(lab);
  });

  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  el.appendChild(tip);

  groups.forEach((g, gi) => {
    const cx = L + gw * gi + gw / 2;
    const x0 = cx - (methods.length * bw + (methods.length - 1) * gap) / 2;
    methods.forEach((m, mi) => {
      const v = spec.values[m.key][gi];
      const x = x0 + mi * (bw + gap), top = y(v), h = T + ih - top;
      const r = Math.min(4, h);
      // Bar with 4px rounded top, square at the baseline.
      const d = `M${x},${T + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${T + ih} Z`;
      const bar = mk('path', { class: 'bar', d, fill: `var(--m-${m.key})` });
      svg.appendChild(bar);
      if (spec.label && m.key === 'bcov') {
        const val = mk('text', { class: 'val', x: x + bw / 2, y: top - 5, 'text-anchor': 'middle' });
        val.textContent = spec.fmt(v);
        svg.appendChild(val);
      }
      const hit = mk('rect', { class: 'bar-hit', x: x - 1, y: T, width: bw + 2, height: ih });
      hit.addEventListener('mouseenter', () => {
        svg.querySelectorAll('.bar').forEach((b) => b.classList.toggle('dim', b !== bar));
        tip.innerHTML = `<b>${m.label}</b> · N = ${g}<br>${el.dataset.title.split(' (')[0]}: <b>${spec.fmt(v)}</b>`;
        const box = svg.getBoundingClientRect(), scale = box.width / W;
        tip.style.left = (x + bw / 2) * scale + 'px';
        tip.style.top = title.offsetHeight + 6 + top * scale + 'px';
        tip.classList.add('on');
      });
      hit.addEventListener('mouseleave', () => {
        svg.querySelectorAll('.bar').forEach((b) => b.classList.remove('dim'));
        tip.classList.remove('on');
      });
      svg.appendChild(hit);
    });
    const xl = mk('text', { class: 'xlab', x: cx, y: H - 6, 'text-anchor': 'middle' });
    xl.textContent = 'N = ' + g;
    svg.appendChild(xl);
  });
  el.appendChild(svg);
});
