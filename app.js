// ── STATE ──
let allVideos = [];

// ── INIT ──
document.addEventListener('DOMContentLoaded', loadVideos);

// ── LOAD VIDEOS FROM BACKEND ──
async function loadVideos() {
  showState('loading');

  try {
    const res = await fetch('/api/videos');
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    allVideos = data.videos || [];

    document.getElementById('videoCounter').textContent =
      `${allVideos.length} video${allVideos.length !== 1 ? 's' : ''}`;

    renderVideos(allVideos);
  } catch (err) {
    console.error(err);
    document.getElementById('errorMsg').textContent = err.message;
    showState('error');
  }
}

// ── RENDER ──
function renderVideos(videos) {
  const grid = document.getElementById('videoGrid');

  if (videos.length === 0) {
    grid.innerHTML = '';
    showState('empty');
    return;
  }

  showState('grid');

  grid.innerHTML = videos.map((v, i) => `
    <div class="video-card" onclick="openPlayer(${i})" style="animation-delay:${Math.min(i * 0.05, 0.5)}s">
      <div class="card-thumb">
        <img
          src="${v.thumbnail}"
          alt="${v.title}"
          loading="lazy"
          onerror="this.src='https://placehold.co/640x360/111/333?text=Video'"
        />
        <div class="card-overlay">
          <div class="play-btn">▶</div>
        </div>
        ${v.duration ? `<span class="card-duration">${formatDuration(v.duration)}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-title">${v.title}</div>
        <div class="card-meta">
          <span>${v.format ? v.format.toUpperCase() : 'VIDEO'}</span>
          <span>${formatDate(v.created_at)}</span>
          ${v.bytes ? `<span>${formatBytes(v.bytes)}</span>` : ''}
        </div>
        ${v.tags.length ? `<div class="card-tags">${v.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ── FILTER + SORT ──
function filterVideos() {
  const q     = document.getElementById('searchInput').value.toLowerCase();
  const sort  = document.getElementById('sortSelect').value;

  let filtered = allVideos.filter(v =>
    v.title.toLowerCase().includes(q) ||
    v.tags.some(t => t.toLowerCase().includes(q))
  );

  filtered = sortVideos(filtered, sort);
  renderVideos(filtered);
}

function sortVideos(list, sort) {
  return [...list].sort((a, b) => {
    if (sort === 'newest')   return new Date(b.created_at) - new Date(a.created_at);
    if (sort === 'oldest')   return new Date(a.created_at) - new Date(b.created_at);
    if (sort === 'az')       return a.title.localeCompare(b.title);
    if (sort === 'duration') return (b.duration || 0) - (a.duration || 0);
    return 0;
  });
}

// ── PLAYER ──
function openPlayer(index) {
  const sort   = document.getElementById('sortSelect').value;
  const q      = document.getElementById('searchInput').value.toLowerCase();

  let filtered = allVideos.filter(v =>
    v.title.toLowerCase().includes(q) ||
    v.tags.some(t => t.toLowerCase().includes(q))
  );
  filtered = sortVideos(filtered, sort);

  const video = filtered[index];
  if (!video) return;

  const player = document.getElementById('videoPlayer');
  player.src = video.url;

  document.getElementById('playerTitle').textContent    = video.title;
  document.getElementById('playerDuration').textContent = video.duration ? formatDuration(video.duration) : '';
  document.getElementById('playerFormat').textContent   = video.format ? video.format.toUpperCase() : '';
  document.getElementById('playerDate').textContent     = formatDate(video.created_at);
  document.getElementById('playerTags').innerHTML       = video.tags.map(t => `<span class="tag">${t}</span>`).join('');

  document.getElementById('playerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  player.play();
}

function closePlayer() {
  const modal  = document.getElementById('playerModal');
  const player = document.getElementById('videoPlayer');
  player.pause();
  player.src = '';
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function handleModalClick(e) {
  if (e.target === document.getElementById('playerModal')) closePlayer();
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePlayer();
});

// ── STATE HELPERS ──
function showState(state) {
  document.getElementById('videoGrid').style.display      = state === 'grid'    ? 'grid'  : 'none';
  document.getElementById('loadingState').style.display   = state === 'loading' ? 'grid'  : 'none';
  document.getElementById('emptyState').style.display     = state === 'empty'   ? 'flex'  : 'none';
  document.getElementById('errorState').style.display     = state === 'error'   ? 'flex'  : 'none';
}

// ── FORMATTERS ──
function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
