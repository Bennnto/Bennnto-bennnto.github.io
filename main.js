// ── Pixel Rain ─────────────────────────────────────────
(function () {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '0', display: 'block'
  });
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  const BLOCK  = 8;
  const COLORS = ['#a5b4fc','#818cf8','#6366f1','#c7d2fe','#4f46e5','#8b8cf7','#7c7ef5'];
  let W, H, cols, drops;

  function setup() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols  = Math.ceil(W / BLOCK);
    drops = Array.from({length: cols}, (_, i) =>
      i % 3 === 0
        ? Math.random() * (H / BLOCK)        // start on screen
        : -Math.random() * (H / BLOCK) * 0.8 // start above
    );
  }
  setup();
  window.addEventListener('resize', setup);

  function tick() {
    ctx.fillStyle = 'rgba(10,12,16,0.18)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < cols; i++) {
      drops[i] += 0.25;
      const py = Math.floor(drops[i]) * BLOCK;
      const px = i * BLOCK;

      if (py > H) { drops[i] = -Math.random() * (H / BLOCK) * 0.5; continue; }
      if (py < 0) continue;

      ctx.fillStyle = COLORS[Math.floor(Math.random() * COLORS.length)];
      ctx.fillRect(px, py, BLOCK - 1, BLOCK - 1);

      if (i % 4 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(px, py, BLOCK - 1, BLOCK - 1);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ── Theme ──────────────────────────────────────────────
const html     = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
const saved    = localStorage.getItem('theme');
setTheme(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

function setTheme(t) {
  html.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  themeBtn.textContent = t === 'dark' ? '☀' : '☾';
}
themeBtn.addEventListener('click', () => {
  setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// ── Section nav (left → right expansion) ──────────────
const secBtns   = document.querySelectorAll('.sec-btn');
const sections  = document.querySelectorAll('.sec');
const emptyHint = document.getElementById('empty-hint');
let   active    = null;

// ── Default: open Info on load ─────────────────────────
(function () {
  const infoBtn = document.querySelector('.sec-btn[data-target="s-info"]');
  if (infoBtn) infoBtn.click();
  document.querySelectorAll('#s-info .leaf').forEach(leaf => leaf.classList.add('open'));
})();

secBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);

    if (active === target) {
      target.hidden = true;
      btn.classList.remove('active');
      active = null;
      emptyHint.hidden = false;
      return;
    }

    sections.forEach(s => { s.hidden = true; });
    secBtns.forEach(b => b.classList.remove('active'));

    target.hidden = false;
    target.style.animation = 'none';
    target.offsetHeight;
    target.style.animation = '';

    btn.classList.add('active');
    active = target;
    emptyHint.hidden = true;
  });
});

// ── Leaf accordion ─────────────────────────────────────
document.querySelectorAll('.leaf-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    btn.closest('.leaf').classList.toggle('open');
  });
});

// ── API fetch ──────────────────────────────────────────
document.querySelectorAll('.try-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const method    = btn.dataset.method;
    let   path      = btn.dataset.path;
    const bodyId    = btn.dataset.body;
    const idInputId = btn.dataset.id;
    const resEl     = document.getElementById(btn.dataset.res);

    if (idInputId) path = path.replace('{id}', document.getElementById(idInputId).value);

    const base = (document.getElementById('api-base-url')?.value || 'https://snippet-api-4irp.onrender.com').replace(/\/$/, '');
    const url  = base + path;
    const orig = btn.textContent;

    btn.textContent = '⏳ Sending…';
    btn.disabled    = true;
    resEl.hidden    = true;

    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (bodyId) opts.body = document.getElementById(bodyId).value;
      const res  = await fetch(url, opts);
      const text = await res.text();
      let out;
      try { out = JSON.stringify(JSON.parse(text), null, 2); } catch { out = text; }
      resEl.textContent = `HTTP ${res.status} ${res.statusText}\n\n${out}`;
      resEl.className   = 'try-res ' + (res.ok ? 'ok' : 'err');
    } catch (e) {
      resEl.textContent = `Error: ${e.message}`;
      resEl.className   = 'try-res err';
    }

    resEl.hidden    = false;
    btn.textContent = orig;
    btn.disabled    = false;
  });
});
