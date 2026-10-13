const $ = (s,ctx=document) => ctx.querySelector(s);
const $$ = (s,ctx=document) => ctx.querySelectorAll(s);

/* ============ BOOT SCREEN ============ */
(function boot() {
  const fill = $('#bootBarFill'), pct = $('#bootPct'), screenEl = $('#bootScreen');
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 18;
    if (p >= 100) { p = 100; clearInterval(tick); }
    if (fill) fill.style.width = p + '%';
    if (pct) pct.textContent = Math.floor(p) + '%';
  }, 90);
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (fill) fill.style.width = '100%';
      if (pct) pct.textContent = '100%';
      setTimeout(() => screenEl.classList.add('hide'), 250);
    }, 700);
  });
})();

/* ============ SCROLL PROGRESS BAR ============ */
const scrollProgressBar = $('#scrollProgressBar');
function updateScrollProgress() {
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  if (scrollProgressBar) scrollProgressBar.style.width = scrolled + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

/* ============ MAGNETIC BUTTONS ============ */
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const b = el.getBoundingClientRect();
      const relX = e.clientX - b.left - b.width / 2;
      const relY = e.clientY - b.top - b.height / 2;
      el.style.transform = `translate(${relX * .35}px, ${relY * .45}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });
}

/* ============ NAVBAR + ACTIVE SECTION ============ */
const navbar = $('#navbar');
const navLinks = $$('.nav-link');
const sections = $$('main section[id]');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 35);
  let current = '';
  sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - 160) current = sec.id; });
  navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
  $('#backToTop').classList.toggle('visible', window.scrollY > 500);
});

/* ============ MOBILE NAV ============ */
const hamburger = $('#hamburger'), nav = $('#navLinks');
hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
  hamburger.innerHTML = nav.classList.contains('open') ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
});
navLinks.forEach(l => l.addEventListener('click', () => {
  nav.classList.remove('open');
  hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
}));

/* ============ REVEAL ON SCROLL ============ */
const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${Math.min(i * 45, 180)}ms`;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
$$('.reveal').forEach(el => observer.observe(el));

/* ============ BACK TO TOP ============ */
$('#backToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ============ CUSTOM CURSOR ============ */
const cursorDot = $('#cursorDot'), cursorRing = $('#cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
if (matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursorDot.style.left = mx + 'px'; cursorDot.style.top = my + 'px';
  });
  (function followCursor() {
    rx += (mx - rx) * .16; ry += (my - ry) * .16;
    cursorRing.style.left = rx + 'px'; cursorRing.style.top = ry + 'px';
    requestAnimationFrame(followCursor);
  })();
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a,button,.tilt-card,.repo-card')) {
      cursorRing.style.width = '54px'; cursorRing.style.height = '54px';
      cursorRing.style.borderColor = 'rgba(198,255,61,.5)';
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a,button,.tilt-card,.repo-card')) {
      cursorRing.style.width = '32px'; cursorRing.style.height = '32px';
      cursorRing.style.borderColor = 'var(--line-strong)';
    }
  });
}

/* ============ 3D TILT (profile card + all glass panels) ============ */
function initTilt(el, intensity = 10) {
  let bounds;
  el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
  el.addEventListener('mousemove', e => {
    if (!bounds) bounds = el.getBoundingClientRect();
    const px = (e.clientX - bounds.left) / bounds.width;
    const py = (e.clientY - bounds.top) / bounds.height;
    const rotY = (px - .5) * intensity * 2;
    const rotX = (.5 - py) * intensity * 2;
    el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  });
}
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  initTilt($('#profileCard'), 8);
  $$('.tilt-card').forEach(el => initTilt(el, 5));
}

/* ============ THEME COLOR CONSTANTS ============ */
const COL_BLUE = 0x7C9EFF, COL_LIME = 0xC6FF3D, COL_LINE = 0x3E4A73;

/* ============ 3D CRYSTALLINE CORE ============
   A wireframe polyhedron "core" (the compiled structure of the site)
   orbited by rings of particles and a distant starfield, all mouse- and
   scroll-reactive. Built from primitives only — no external assets. */
function buildCore(canvasEl, opts = {}) {
  if (typeof THREE === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const { big = true, dim = false } = opts;

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvasEl.clientWidth / canvasEl.clientHeight, .1, 100);
  camera.position.set(0, 0, big ? 9.5 : 10.5);

  const root = new THREE.Group();
  scene.add(root);

  /* --- core: layered icosahedron wireframe with soft glow --- */
  const coreGroup = new THREE.Group();
  root.add(coreGroup);
  const coreRadius = big ? 2.5 : 2.0;
  const icoGeo = new THREE.IcosahedronGeometry(coreRadius, 1);
  const edges = new THREE.EdgesGeometry(icoGeo);
  const coreMat = new THREE.LineBasicMaterial({ color: COL_BLUE, transparent: true, opacity: dim ? .4 : .65 });
  const coreLines = new THREE.LineSegments(edges, coreMat);
  coreGroup.add(coreLines);

  // outer glow shells (additive, progressively larger + fainter)
  [1.08, 1.18].forEach((s, i) => {
    const glowMat = new THREE.LineBasicMaterial({ color: COL_BLUE, transparent: true, opacity: (dim ? .08 : .14) / (i + 1), blending: THREE.AdditiveBlending });
    const glowMesh = new THREE.LineSegments(edges, glowMat);
    glowMesh.scale.setScalar(s);
    coreGroup.add(glowMesh);
  });

  // accent vertex points (lime) at the icosahedron's vertices
  const vertGeo = new THREE.IcosahedronGeometry(coreRadius, 1);
  const vertMat = new THREE.PointsMaterial({ color: COL_LIME, size: big ? .1 : .08, transparent: true, opacity: .9, sizeAttenuation: true });
  const vertPoints = new THREE.Points(vertGeo, vertMat);
  coreGroup.add(vertPoints);

  /* --- orbit rings of particles around the core --- */
  const ringsGroup = new THREE.Group();
  root.add(ringsGroup);
  const rings = [];
  const ringCount = big ? 3 : 2;
  for (let r = 0; r < ringCount; r++) {
    const radius = coreRadius + 1.1 + r * .85;
    const count = 40 + r * 10;
    const pts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, (Math.random() - .5) * .25, Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.PointsMaterial({ color: r % 2 === 0 ? COL_BLUE : COL_LIME, size: big ? .045 : .035, transparent: true, opacity: dim ? .3 : .55, sizeAttenuation: true });
    const ring = new THREE.Points(geo, mat);
    ring.rotation.x = Math.PI / 2.4 + r * .5;
    ring.rotation.z = r * .8;
    ringsGroup.add(ring);
    rings.push({ mesh: ring, speed: .0006 * (r % 2 === 0 ? 1 : -1.3) - r * .0002 });
  }

  /* --- distant starfield for depth (slow parallax layer) --- */
  const starGroup = new THREE.Group();
  root.add(starGroup);
  const starPts = [];
  const starCount = big ? 220 : 140;
  for (let i = 0; i < starCount; i++) {
    const r = 9 + Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    starPts.push(new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)));
  }
  const starGeo = new THREE.BufferGeometry().setFromPoints(starPts);
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: .028, transparent: true, opacity: dim ? .25 : .4, sizeAttenuation: true });
  starGroup.add(new THREE.Points(starGeo, starMat));

  coreGroup.rotation.x = .3;
  coreGroup.rotation.y = .4;

  /* --- interaction state --- */
  let targetRotX = coreGroup.rotation.x, targetRotY = coreGroup.rotation.y;
  canvasEl.addEventListener('mousemove', e => {
    const b = canvasEl.getBoundingClientRect();
    const nx = ((e.clientX - b.left) / b.width) - .5;
    const ny = ((e.clientY - b.top) / b.height) - .5;
    targetRotY = .4 + nx * .9;
    targetRotX = .3 + ny * .6;
  });
  window.addEventListener('mousemove', e => {
    const nx = (e.clientX / window.innerWidth) - .5;
    camera.position.x += (nx * 1.1 - camera.position.x) * .04;
    camera.lookAt(0, 0, 0);
  });

  function resize() {
    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvasEl);
  resize();

  const clock = new THREE.Clock();
  let raf, scrollFactor = 0;
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    coreGroup.rotation.y += .0016 + scrollFactor * .01;
    coreGroup.rotation.x += (targetRotX - coreGroup.rotation.x) * .045;
    coreGroup.rotation.y += (targetRotY - coreGroup.rotation.y) * .0012;
    const breathe = 1 + Math.sin(t * .8) * .02;
    coreGroup.scale.setScalar(breathe * (1 - scrollFactor * .35));
    vertPoints.material.opacity = .7 + Math.sin(t * 1.4) * .2;
    rings.forEach(r => { r.mesh.rotation.z += r.speed; });
    starGroup.rotation.y += .00015;
    root.rotation.y = -scrollFactor * .6;
    renderer.render(scene, camera);
  }
  animate();

  return {
    renderer, scene, camera, root, coreGroup,
    setScrollFactor: v => { scrollFactor = v; },
    stop: () => cancelAnimationFrame(raf)
  };
}

const heroCanvas = $('#heroCanvas');
const heroScene = heroCanvas ? buildCore(heroCanvas, { big: true }) : null;

const contactCanvas = $('#contactCanvas');
if (contactCanvas) buildCore(contactCanvas, { big: false, dim: true });

/* scroll-linked fade/rotation for the hero core as the user scrolls past it */
if (heroScene) {
  const heroSection = $('#home');
  window.addEventListener('scroll', () => {
    const h = heroSection.offsetHeight;
    const progress = Math.min(Math.max(window.scrollY / h, 0), 1);
    heroScene.setScrollFactor(progress);
    heroCanvas.style.opacity = String(1 - progress * .9);
  }, { passive: true });
}

/* ============ GITHUB REPOSITORY AUTO-SYNC ============ */
const GITHUB_USER = 'SajidTusan';
const repoContainer = $('#githubRepos');
const repoCount = $('#repoCount');
const repoError = $('#repoError');
const repoSort = $('#repoSort');
const repoFilter = $('#repoFilter');
let repositories = [];

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
function repoCard(repo, index) {
  const desc = repo.description || 'No description added yet. Open the repository to explore the code.';
  const lang = repo.language || 'Code';
  const stars = repo.stargazers_count || 0;
  const updated = repo.updated_at ? new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently updated';
  const forkLabel = repo.fork ? '<span class="repo-badge">FORK</span>' : '';
  const archivedLabel = repo.archived ? '<span class="repo-badge archived">ARCHIVED</span>' : '';
  return `<article class="repo-card tilt-card" style="--card-index:${index}">
    <div class="repo-head">
      <a class="repo-name" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener"><i class="fa-regular fa-folder-open"></i><span>${escapeHTML(repo.name)}</span></a>
      <span class="repo-stars" aria-label="${stars} stars"><i class="fa-regular fa-star"></i> ${stars}</span>
    </div>
    <div class="repo-meta"><span class="repo-language"><i class="lang-dot"></i>${escapeHTML(lang)}</span>${forkLabel}${archivedLabel}</div>
    <p class="repo-desc">${escapeHTML(desc)}</p>
    <div class="repo-footer">
      <span>Updated ${updated}</span>
      <a class="repo-open" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener" aria-label="Open ${escapeHTML(repo.name)} on GitHub">View project <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
    </div>
  </article>`;
}
function renderRepos() {
  const mode = repoSort.value;
  const filter = repoFilter.value;
  const filtered = repositories.filter(repo => filter === 'all' || (filter === 'fork' ? repo.fork : !repo.fork));
  const sorted = filtered.sort((a, b) => {
    if (mode === 'stars') return (b.stargazers_count || 0) - (a.stargazers_count || 0);
    if (mode === 'name') return a.name.localeCompare(b.name);
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
  repoContainer.innerHTML = sorted.length
    ? sorted.map(repoCard).join('')
    : '<p class="repo-empty">No repositories in this view yet.</p>';
  repoCount.textContent = filter === 'all'
    ? `${sorted.length} public ${sorted.length === 1 ? 'repository' : 'repositories'}`
    : `${sorted.length} of ${repositories.length} public repositories`;
  if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.repo-card').forEach(el => initTilt(el, 4));
  }
}
repoSort.addEventListener('change', renderRepos);
repoFilter.addEventListener('change', renderRepos);

async function loadGitHubRepos() {
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    repositories = (await response.json()).filter(repo => !repo.private);
    renderRepos();
  } catch (error) {
    console.warn('GitHub sync failed:', error);
    repoCount.textContent = 'GitHub sync unavailable';
    repoError.hidden = false;
  }
}
loadGitHubRepos();
