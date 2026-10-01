'use strict';
const videos = Array.from(document.querySelectorAll('.project-card video, .short-card video'));
videos.forEach(video => {
  video.addEventListener('play', () => {
    document.getElementById('hero-preview')?.pause();
    videos.forEach(other => { if (other !== video) other.pause(); });
  });
});
const buttons = Array.from(document.querySelectorAll('[data-filter]'));
const projects = Array.from(document.querySelectorAll('.project-card'));
const grid = document.getElementById('project-grid');
const count = document.getElementById('project-count');
buttons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  let visible = 0;
  projects.forEach(project => {
    const show = filter === 'all' || project.dataset.category.split(' ').includes(filter);
    project.hidden = !show;
    if (show) visible++;
    else project.querySelector('video').pause();
  });
  grid.classList.toggle('is-filtered', filter !== 'all');
  count.textContent = `${visible} exemple${visible > 1 ? 's' : ''}`;
}));
// A deep link must keep its project visible even after using a filter.
function revealLinkedProject() {
  const id = location.hash.slice(1);
  const project = projects.find(item => item.id === id);
  if (project && project.hidden) {
    buttons.find(button => button.dataset.filter === 'all').click();
    project.scrollIntoView({ block: 'start' });
  }
}
window.addEventListener('hashchange', revealLinkedProject);
revealLinkedProject();

// One quiet preview on arrival; full examples keep their native controls and sound.
const preview = document.getElementById('hero-preview');
const previewToggle = document.getElementById('preview-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let previewDismissed = false;
if (preview && previewToggle) {
  previewToggle.hidden = false;
  function reflectPreviewState() {
    const playing = !preview.paused;
    previewToggle.setAttribute('aria-pressed', String(playing));
    previewToggle.setAttribute('aria-label', playing ? 'Mettre l’aperçu 3D en pause' : 'Animer l’aperçu 3D');
    previewToggle.innerHTML = playing ? 'Pause <span aria-hidden="true">Ⅱ</span>' : 'Animer l’aperçu <span aria-hidden="true">▷</span>';
  }
  function startPreview() {
    if (!preview.getAttribute('src')) preview.src = preview.dataset.preview;
    preview.muted = true;
    preview.play().catch(() => { reflectPreviewState(); });
  }
  preview.addEventListener('timeupdate', () => { if (preview.currentTime >= 8) preview.currentTime = .25; });
  preview.addEventListener('play', reflectPreviewState);
  preview.addEventListener('pause', reflectPreviewState);
  previewToggle.addEventListener('click', () => {
    if (preview.paused) { previewDismissed = false; preview.style.display = 'block'; startPreview(); }
    else { previewDismissed = true; preview.pause(); }
  });
  const previewObserver = new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    if (!visible) preview.pause();
    else if (!previewDismissed && !reducedMotion.matches && !navigator.connection?.saveData && !videos.some(video => !video.paused)) startPreview();
  }, { threshold: .35 });
  previewObserver.observe(preview);
  document.addEventListener('visibilitychange', () => { if (document.hidden) preview.pause(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) preview.pause(); });
}
