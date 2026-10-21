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
