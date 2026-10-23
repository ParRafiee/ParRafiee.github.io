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

// EMA project: coefficient plots (estimate + 95% CI), filled when p < .05.
const FOREST_ROWS = ['Home', 'Work/school', 'Party', 'Restaurant/bar', 'Alone', 'Partner', 'Friend', 'Family'];
const FOREST_DATA = {
  within: { range: [-0.12, 0.08], ticks: [-0.1, -0.05, 0, 0.05], digits: 3, rows: [
    [-0.079, -0.101, -0.056, '<.001'], [-0.027, -0.053, -0.001, '.042'], [0.020, -0.029, 0.068, '.422'], [-0.007, -0.051, 0.037, '.766'],
    [-0.088, -0.112, -0.064, '<.001'], [-0.009, -0.040, 0.021, '.539'], [0.002, -0.026, 0.029, '.905'], [-0.031, -0.062, -0.000, '.050']] },
  between: { range: [-1.6, 2.2], ticks: [-1, 0, 1, 2], digits: 2, rows: [
    [0.317, -0.037, 0.670, '.083'], [0.242, -0.120, 0.603, '.194'], [1.147, 0.221, 2.073, '.017'], [-0.425, -1.472, 0.623, '.429'],
    [0.178, -0.136, 0.492, '.269'], [0.235, -0.149, 0.618, '.234'], [0.197, -0.150, 0.544, '.270'], [0.058, -0.354, 0.471, '.782']] },
};

document.querySelectorAll('.chart[data-forest]').forEach((el) => {
  const spec = FOREST_DATA[el.dataset.forest];
  const W = 420, L = 112, R = 10, T = 8, rowH = 21, groupGap = 14;
  const H = T + rowH * 8 + groupGap + 26;
  const [lo, hi] = spec.range;
  const x = (v) => L + ((v - lo) / (hi - lo)) * (W - L - R);
  const rowY = (i) => T + rowH * i + rowH / 2 + (i >= 4 ? groupGap : 0);
  const ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => { const n = document.createElementNS(ns, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  const fmt = (v) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(3);

  const title = document.createElement('div');
  title.className = 'chart-title';
  title.textContent = el.dataset.title;
  el.appendChild(title);

  const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': el.getAttribute('aria-label') });
  const axisY = H - 22;
  spec.ticks.forEach((t) => {
    svg.appendChild(mk('line', { class: t === 0 ? 'zero' : 'grid', x1: x(t), x2: x(t), y1: T, y2: axisY }));
    const lab = mk('text', { class: 'tick', x: x(t), y: axisY + 15, 'text-anchor': 'middle' });
    lab.textContent = t === 0 ? '0' : (t < 0 ? '−' : '') + Math.abs(t);
    svg.appendChild(lab);
  });
  svg.appendChild(mk('line', { class: 'grid', x1: 8, x2: W - R, y1: rowY(4) - rowH / 2 - groupGap / 2, y2: rowY(4) - rowH / 2 - groupGap / 2 }));

  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  el.appendChild(tip);

  spec.rows.forEach(([est, cl, cu, p], i) => {
    const y = rowY(i), sig = p === '<.001' || parseFloat(p) < 0.05;
    const name = mk('text', { class: 'tick rowlab', x: L - 10, y: y + 4, 'text-anchor': 'end' });
    name.textContent = FOREST_ROWS[i];
    svg.appendChild(name);
    svg.appendChild(mk('line', { class: 'ci' + (sig ? ' sig' : ''), x1: x(cl), x2: x(cu), y1: y, y2: y }));
    const dot = mk('circle', { class: 'est' + (sig ? ' sig' : ''), cx: x(est), cy: y, r: 5 });
    svg.appendChild(dot);
    const hit = mk('rect', { class: 'bar-hit', x: 0, y: y - rowH / 2, width: W, height: rowH });
    hit.addEventListener('mouseenter', () => {
      tip.innerHTML = `<b>${FOREST_ROWS[i]}</b><br>${fmt(est)} [${fmt(cl)}, ${fmt(cu)}], p ${p.startsWith('<') ? p : '= ' + p}`;
      const scale = svg.getBoundingClientRect().width / W;
      tip.style.left = x(est) * scale + 'px';
      tip.style.top = title.offsetHeight + 6 + (y - 6) * scale + 'px';
      tip.classList.add('on');
    });
    hit.addEventListener('mouseleave', () => tip.classList.remove('on'));
    svg.appendChild(hit);
  });
  const g1 = mk('text', { class: 'grp', x: 8, y: rowY(0) + 4 }); g1.textContent = 'Location';
  const g2 = mk('text', { class: 'grp', x: 8, y: rowY(4) + 4 }); g2.textContent = 'Social';
  svg.appendChild(g1); svg.appendChild(g2);
  el.appendChild(svg);
});
