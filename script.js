const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Navbar + active section
const navbar = $('#navbar');
const navLinks = $$('.nav-link');
const sections = $$('main section[id]');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 35);
  let current = '';
  sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - 140) current = sec.id; });
  navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
  $('#backToTop').classList.toggle('visible', window.scrollY > 500);
});

// Mobile navigation
const hamburger = $('#hamburger'), nav = $('#navLinks');
hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
  hamburger.innerHTML = nav.classList.contains('open') ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
});
navLinks.forEach(l => l.addEventListener('click', () => {
  nav.classList.remove('open');
  hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
}));

// Theme
const themeToggle = $('#themeToggle'), themeIcon = $('#themeIcon');
const savedTheme = localStorage.getItem('sajid-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
function updateThemeIcon(){
  themeIcon.className = document.documentElement.dataset.theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}
updateThemeIcon();
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('sajid-theme', next);
  updateThemeIcon();
});

// Reveal animation
const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if(entry.isIntersecting){
      entry.target.style.transitionDelay = `${Math.min(i * 45, 180)}ms`;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12});
$$('.reveal').forEach(el => observer.observe(el));

// Back to top
$('#backToTop').addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

// GitHub repository auto-sync
const GITHUB_USER = 'SajidTusan';
const repoContainer = $('#githubRepos');
const repoCount = $('#repoCount');
const repoError = $('#repoError');
const repoSort = $('#repoSort');
let repositories = [];

function escapeHTML(value=''){
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function repoCard(repo){
  const desc = repo.description || 'No description added yet. Open the repository to explore the code.';
  const lang = repo.language || 'Code';
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  return `<article class="repo-card">
    <div class="repo-head">
      <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener"><i class="fa-regular fa-folder-open"></i>${escapeHTML(repo.name)}</a>
      <span class="repo-stars">★ ${stars}</span>
    </div>
    <p class="repo-desc">${escapeHTML(desc)}</p>
    <div class="repo-footer">
      <span class="lang"><i class="lang-dot"></i>${escapeHTML(lang)}</span>
      <span>${forks} fork${forks===1?'':'s'} · ${new Date(repo.updated_at).toLocaleDateString(undefined,{month:'short',year:'numeric'})}</span>
    </div>
  </article>`;
}
function renderRepos(){
  const mode = repoSort.value;
  const sorted = [...repositories].sort((a,b)=>{
    if(mode==='stars') return (b.stargazers_count||0)-(a.stargazers_count||0);
    if(mode==='name') return a.name.localeCompare(b.name);
    return new Date(b.updated_at)-new Date(a.updated_at);
  });
  repoContainer.innerHTML = sorted.map(repoCard).join('');
  repoCount.textContent = `${sorted.length} public repositories`;
}
repoSort.addEventListener('change', renderRepos);

async function loadGitHubRepos(){
  try{
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
    if(!response.ok) throw new Error(`GitHub API ${response.status}`);
    repositories = (await response.json()).filter(r => !r.fork);
    renderRepos();
  }catch(error){
    console.warn('GitHub sync failed:', error);
    repoCount.textContent = 'GitHub sync unavailable';
    repoError.hidden = false;
  }
}
loadGitHubRepos();

// Cursor
const cursor = $('#cursor'), follower = $('#cursorFollower');
let mx=0,my=0,fx=0,fy=0;
if(matchMedia('(pointer:fine)').matches){
  document.addEventListener('mousemove', e=>{mx=e.clientX;my=e.clientY;cursor.style.left=mx+'px';cursor.style.top=my+'px';});
  function follow(){fx+=(mx-fx)*.12;fy+=(my-fy)*.12;follower.style.left=fx+'px';follower.style.top=fy+'px';requestAnimationFrame(follow)} follow();
  document.addEventListener('mouseover', e=>{
    if(e.target.closest('a,button,.featured-project,.repo-card')){follower.style.width='48px';follower.style.height='48px'}
  });
  document.addEventListener('mouseout', e=>{
    if(e.target.closest('a,button,.featured-project,.repo-card')){follower.style.width='32px';follower.style.height='32px'}
  });
}
