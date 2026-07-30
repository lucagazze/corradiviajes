// ── Corradi Viajes — Theme Toggle ──────────────
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('corradiTheme', next);
  _updateThemeBtn();
}

function _updateThemeBtn() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const isLight = (document.documentElement.getAttribute('data-theme') === 'light');
  btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:20px">${isLight ? 'dark_mode' : 'light_mode'}</span>`;
  btn.title = isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';
}

// Update button icon once DOM is ready
document.addEventListener('DOMContentLoaded', _updateThemeBtn);
// Also try immediately in case component already rendered
_updateThemeBtn();
