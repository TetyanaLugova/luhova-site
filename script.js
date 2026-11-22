const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Мобільне меню ----------
const burger = document.querySelector('.burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', false);
  })
);

// ---------- FAQ: відкритий лише один пункт ----------
const faqItems = document.querySelectorAll('.faq details');
faqItems.forEach((item) =>
  item.addEventListener('toggle', () => {
    if (item.open) faqItems.forEach((other) => other !== item && (other.open = false));
  })
);

// ---------- Hero: старт анімації після завантаження шрифтів ----------
const start = () => requestAnimationFrame(() => document.body.classList.add('is-loaded'));
(document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
setTimeout(start, 1200); // запасний варіант

// ---------- Заголовки секцій: розбиваємо на слова ----------
function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(part);
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.style.setProperty('--i', i++);
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else {
        walk(child);
      }
    });
  };
  walk(el);
  el.classList.add('split');
}
if (!reduceMotion) document.querySelectorAll('.h2').forEach(splitWords);

// ---------- Поява при скролі ----------
const fadeTargets = document.querySelectorAll('.card, .why__item, .work, .stat, .faq__list, .contact__inner');
const clipTargets = document.querySelectorAll('.h2, .work__img');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
          setTimeout(() => (e.target.style.transitionDelay = ''), 1200);
        }
      }),
    { threshold: 0, rootMargin: '0px 0px -8% 0px' }
  );
  fadeTargets.forEach((el, idx) => {
    el.classList.add('reveal');
    // каскад для карток в одному ряду
    el.style.transitionDelay = `${(idx % 4) * 80}ms`;
    io.observe(el);
  });
  clipTargets.forEach((el) => io.observe(el));
} else {
  [...fadeTargets, ...clipTargets].forEach((el) => el.classList.add('is-visible'));
}

// ---------- Липкі картки процесу (тільки десктоп) ----------
const steps = [...document.querySelectorAll('.step')];
const desktop = window.matchMedia('(min-width: 900px)');

function updateSteps() {
  if (!desktop.matches) return;
  steps.forEach((step, i) => {
    const next = steps[i + 1];
    if (!next) return;
    const a = step.getBoundingClientRect();
    const b = next.getBoundingClientRect();
    // 0 — наступна картка ще далеко, 1 — повністю накрила поточну
    const p = Math.min(Math.max((a.bottom - b.top) / a.height, 0), 1);
    step.style.setProperty('--p', p.toFixed(3));
  });
}

// ---------- Один спільний цикл requestAnimationFrame ----------
let ticking = false;
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateSteps();
        ticking = false;
      });
    }
  },
  { passive: true }
);
updateSteps();

// ---------- «Магнітні» кнопки (тільки миша) ----------
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.btn--accent').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.2;
      const dy = (e.clientY - r.top - r.height / 2) * 0.3;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
  });
}

// ---------- Форма (поки без відправки — підключимо пошту / Telegram-бота пізніше) ----------
const form = document.getElementById('form');
const status = form.querySelector('.form__status');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (form.website.value) return; // спам-бот

  let valid = true;
  ['name', 'contact'].forEach((name) => {
    const field = form[name].closest('.field');
    const empty = !form[name].value.trim();
    field.classList.toggle('is-invalid', empty);
    if (empty) valid = false;
  });

  if (!valid) {
    status.textContent = "Заповніть, будь ласка, ім'я та контакт.";
    return;
  }

  status.textContent = 'Дякую! Я напишу вам протягом дня.';
  form.reset();
});

// ================================================================
// Куб: маленькі куби в бігучому рядку (SVG) і великий «технічний» куб у hero (canvas)
// ================================================================
const CUBE_V = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const CUBE_E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const CUBE_F = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];

function rotate([x, y, z], ax, ay) {
  let c = Math.cos(ay), s = Math.sin(ay);
  const x1 = x * c + z * s, z1 = -x * s + z * c;
  c = Math.cos(ax); s = Math.sin(ax);
  return [x1, y * c - z1 * s, y * s + z1 * c];
}
// перспектива: z > 0 — далі від глядача
const project = (p, scale, d) => { const k = d / (d + p[2]); return [p[0] * scale * k, p[1] * scale * k, p[2], k]; };
const depthAlpha = (z) => 0.25 + 0.75 * (1 - (z + 1.8) / 3.6);

// ---------- Маленькі куби (бігучий рядок) ----------
const NS = 'http://www.w3.org/2000/svg';
const logos = [...document.querySelectorAll('svg[data-cube]')].map((svg) => {
  svg.innerHTML = '';
  const lines = CUBE_E.map(() => { const l = document.createElementNS(NS, 'line'); l.setAttribute('class', 'edge'); svg.append(l); return l; });
  const dots = CUBE_V.map((_, i) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('class', i === 0 ? 'pt pt--accent' : 'pt'); svg.append(c); return c; });
  return { lines, dots };
});

function drawLogos(t) {
  const ay = t * 0.0009, ax = -0.6 + Math.sin(t * 0.0005) * 0.25;
  const P = CUBE_V.map((v) => project(rotate(v, ax, ay), 6.4, 6));
  logos.forEach(({ lines, dots }) => {
    CUBE_E.forEach(([a, b], i) => {
      const l = lines[i];
      l.setAttribute('x1', P[a][0].toFixed(2)); l.setAttribute('y1', P[a][1].toFixed(2));
      l.setAttribute('x2', P[b][0].toFixed(2)); l.setAttribute('y2', P[b][1].toFixed(2));
      l.style.opacity = depthAlpha((P[a][2] + P[b][2]) / 2).toFixed(2);
    });
    P.forEach((p, i) => {
      const c = dots[i];
      c.setAttribute('cx', p[0].toFixed(2)); c.setAttribute('cy', p[1].toFixed(2));
      c.setAttribute('r', ((i === 0 ? 2.3 : 1.3) * p[3]).toFixed(2));
      c.style.opacity = depthAlpha(p[2]).toFixed(2);
    });
  });
}

// ---------- Великий куб у hero ----------
const orbCanvas = document.querySelector('.orb__canvas');
const rotLabel = document.querySelector('[data-rot]');
const rootStyle = getComputedStyle(document.documentElement);
const COL = {
  accent: rootStyle.getPropertyValue('--accent-text').trim() || '#c9628a',
  text: rootStyle.getPropertyValue('--text').trim() || '#f7f0f1',
  violet: rootStyle.getPropertyValue('--violet').trim() || '#8f2352',
};
const ctx = orbCanvas && orbCanvas.getContext('2d');
let W = 0, dpr = 1, orbVisible = true;
let tilt = { x: 0, y: 0 }, tiltTarget = { x: 0, y: 0 };

function sizeOrb() {
  if (!orbCanvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = orbCanvas.clientWidth;
  orbCanvas.width = W * dpr; orbCanvas.height = W * dpr;
}

function drawOrb(t) {
  if (!ctx || !W) return;
  const R = W / 2;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, W);
  ctx.save();
  ctx.translate(R, R);

  // перехрестя з рисками
  ctx.strokeStyle = 'rgba(240,228,232,.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.stroke();
  ctx.strokeStyle = 'rgba(240,228,232,.25)';
  ctx.beginPath();
  for (let i = -R * 0.9; i <= R * 0.9; i += R * 0.06) { ctx.moveTo(i, -3); ctx.lineTo(i, 3); ctx.moveTo(-3, i); ctx.lineTo(3, i); }
  ctx.stroke();

  // кільця
  ctx.strokeStyle = 'rgba(240,228,232,.14)';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.9, 0, Math.PI * 2); ctx.stroke();

  // крапкове кільце
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2 + t * 0.00004;
    ctx.fillStyle = i % 8 === 0 ? COL.accent : 'rgba(240,228,232,.35)';
    ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.97, Math.sin(a) * R * 0.97, i % 8 === 0 ? 2 : 1, 0, Math.PI * 2); ctx.fill();
  }

  // пунктир, що обертається
  ctx.save(); ctx.rotate(t * 0.00015);
  ctx.setLineDash([2, 7]); ctx.strokeStyle = 'rgba(201,98,138,.55)';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // акцентні дуги в протилежний бік
  ctx.save(); ctx.rotate(-t * 0.00025);
  ctx.strokeStyle = COL.accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.68, 0, 1.1); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.68, Math.PI, Math.PI + 0.45); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.restore();

  // супутник на орбіті
  const sa = t * 0.0005;
  ctx.fillStyle = COL.accent; ctx.shadowColor = COL.accent; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(Math.cos(sa) * R * 0.78, Math.sin(sa) * R * 0.78, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // куб
  tilt.x += (tiltTarget.x - tilt.x) * 0.05;
  tilt.y += (tiltTarget.y - tilt.y) * 0.05;
  const ay = t * 0.00035 + tilt.y, ax = -0.55 + Math.sin(t * 0.0003) * 0.15 + tilt.x;
  const S = R * 0.3, D = 5;
  const RV = CUBE_V.map((v) => rotate(v, ax, ay));
  const P = RV.map((v) => project(v, S, D));

  // напівтонові крапки на гранях
  const N = 7;
  CUBE_F.forEach((f) => {
    const [a, b, , d] = f.map((i) => RV[i]);
    for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) {
      const u = i / N, v = j / N;
      const p = [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * u + (d[k] - a[k]) * v);
      const q = project(p, S, D);
      const al = depthAlpha(q[2]);
      ctx.fillStyle = `rgba(201,98,138,${(al * 0.75).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(q[0], q[1], 1.3 * q[3], 0, Math.PI * 2); ctx.fill();
    }
  });

  // ребра
  CUBE_E.forEach(([a, b]) => {
    ctx.strokeStyle = `rgba(247,240,241,${depthAlpha((P[a][2] + P[b][2]) / 2).toFixed(2)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
  });

  // вершини
  P.forEach((p, i) => {
    ctx.globalAlpha = depthAlpha(p[2]);
    ctx.fillStyle = i === 0 ? COL.accent : COL.text;
    if (i === 0) { ctx.shadowColor = COL.accent; ctx.shadowBlur = 16; }
    ctx.beginPath(); ctx.arc(p[0], p[1], (i === 0 ? 6 : 3.5) * p[3], 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;

  // виносна лінія від акцентної вершини
  const v0 = P[0];
  ctx.strokeStyle = 'rgba(201,98,138,.5)';
  ctx.beginPath(); ctx.moveTo(v0[0], v0[1]); ctx.lineTo(v0[0] + 30, v0[1] - 30); ctx.lineTo(v0[0] + 80, v0[1] - 30); ctx.stroke();
  ctx.fillStyle = 'rgba(201,98,138,.85)';
  ctx.font = '500 10px ui-monospace, Menlo, monospace';
  ctx.fillText(`${v0[0].toFixed(0)}, ${v0[1].toFixed(0)}`, v0[0] + 34, v0[1] - 36);

  ctx.restore();

  if (rotLabel) rotLabel.textContent = String(Math.round(((ay * 180) / Math.PI) % 360)).padStart(3, '0');
}

if (orbCanvas) {
  sizeOrb();
  window.addEventListener('resize', () => { sizeOrb(); if (reduceMotion) drawOrb(1200); });
  new IntersectionObserver(([e]) => (orbVisible = e.isIntersecting)).observe(orbCanvas);
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelector('.hero').addEventListener('pointermove', (e) => {
      tiltTarget.y = (e.clientX / window.innerWidth - 0.5) * 0.8;
      tiltTarget.x = -(e.clientY / window.innerHeight - 0.5) * 0.5;
    });
  }
}

// куби в бігучому рядку крутяться лише, коли рядок видно
let cubesVisible = true;
const marqueeEl = document.querySelector('.marquee');
if (marqueeEl) new IntersectionObserver(([e]) => (cubesVisible = e.isIntersecting)).observe(marqueeEl);

if (reduceMotion) {
  drawLogos(1200);
  drawOrb(1200);
} else {
  (function cubeLoop(t) {
    if (!document.hidden) {
      if (cubesVisible) drawLogos(t);
      if (orbVisible) drawOrb(t);
    }
    requestAnimationFrame(cubeLoop);
  })(0);
}

// ---------- Картки: світло за курсором ----------
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.card, .why__item').forEach((el) =>
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    })
  );
}
