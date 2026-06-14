// ── Supabase & Config ─────────────────────────────
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const USE_LOCAL = SUPABASE_ANON_KEY.includes('REEMPLAZAR');
const LOCAL_API = 'http://localhost:5000/api';

const urlParams = new URLSearchParams(window.location.search);
const pkgId = urlParams.get('id');

// ── Shared state ──────────────────────────────────
let _images = [];
let _currentImg = 0;
let _lbIndex = 0;

// ── Slug helper ───────────────────────────────────
function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Load ──────────────────────────────────────────
async function loadPackage() {
  if (!pkgId) { showError(); return; }
  try {
    let pkg = null;
    if (USE_LOCAL) {
      const res = await fetch(`${LOCAL_API}/packages`);
      const all = await res.json();
      pkg = all.find(p => p.id == pkgId);
    } else {
      const { data, error } = await db
        .from('corradi_packages').select('*').eq('id', pkgId).single();
      if (error) throw error;
      pkg = data;
    }
    if (!pkg) { showError(); return; }
    renderPackage(pkg);
  } catch (e) { console.error(e); showError(); }
}

// ── Render ────────────────────────────────────────
function renderPackage(pkg) {
  const main = document.getElementById('mainContainer');
  main.style.display = 'block';
  main.id = `paquete-${slugify(pkg.name)}`;

  document.title = `${pkg.name} - Corradi Viajes`;
  document.getElementById('pkgTitle').textContent = pkg.name;
  document.getElementById('pkgLocation').textContent = `${pkg.destination}, ${pkg.country}`;
  document.getElementById('pkgCategory').textContent = pkg.category || 'Paquete';
  document.getElementById('pkgDesc').textContent = pkg.description || '';

  const price = `USD ${Number(pkg.price_usd).toLocaleString('es-AR')}`;
  document.getElementById('pkgPrice').textContent = price;
  const mp = document.getElementById('mobilePrice');
  if (mp) mp.textContent = price;

  const destField = document.getElementById('destination');
  if (destField) destField.value = pkg.name;

  // Auto-fill message
  const searchDate = urlParams.get('date');
  const searchGuests = urlParams.get('guests');
  if (searchDate || searchGuests) {
    let msg = 'Hola, quisiera consultar por este paquete';
    if (searchGuests) msg += ` para ${searchGuests} persona(s)`;
    if (searchDate) msg += ` en la fecha ${searchDate}`;
    msg += '.';
    const msgEl = document.getElementById('message');
    if (msgEl) msgEl.value = msg;
  }

  // Update global WA FAB with package name
  setWAFabPackage(pkg.name);

  // ── Images ────────────────────────────────────
  const fallback = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
  try {
    if (pkg.images) {
      const parsed = typeof pkg.images === 'string' ? JSON.parse(pkg.images) : pkg.images;
      if (Array.isArray(parsed) && parsed.length > 0) _images = parsed;
    }
  } catch(e) {}
  if (!_images.length && pkg.image_url) _images = [pkg.image_url];
  if (!_images.length) _images = [fallback];

  renderGallery(pkg);
  renderLightboxThumbs();

  // ── Itinerary ──────────────────────────────────
  const itBlock = document.getElementById('pkgItineraryBlock');
  const itEl = document.getElementById('pkgItinerary');
  if (itBlock && itEl && pkg.itinerary) {
    try {
      let days = typeof pkg.itinerary === 'string' ? JSON.parse(pkg.itinerary) : pkg.itinerary;
      if (Array.isArray(days) && days.length > 0) {
        itBlock.style.display = 'block';
        itEl.innerHTML = days.map((d) => {
          const raw = d.desc || d.description || '';
          const parts = raw.split(' | ');
          const desc = parts[0].trim();
          const meals = parts[1] ? parts[1].replace(/\.$/, '').trim() : '';
          return `
          <div class="py-5 border-b border-white/10 last:border-0 last:pb-0">
            <h4 class="font-semibold text-white text-[15px] mb-2 leading-snug">${d.day}</h4>
            <p class="text-[13.5px] leading-relaxed" style="color:rgba(255,255,255,0.7)">${desc}</p>
            ${meals ? `<span class="inline-flex items-center gap-1.5 mt-3 text-[12px] font-medium px-3 py-1 rounded-full" style="background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.08)">🍽 ${meals}</span>` : ''}
          </div>`;
        }).join('');
      } else if (typeof pkg.itinerary === 'string' && pkg.itinerary.trim()) {
        itBlock.style.display = 'block';
        itEl.innerHTML = typeof marked !== 'undefined'
          ? marked.parse(pkg.itinerary)
          : `<p>${pkg.itinerary.replace(/\n/g, '<br>')}</p>`;
      }
    } catch(e) { console.warn('Itinerary parse error:', e); }
  }
}

// ── Gallery: hero image + paginación + miniaturas ─────────
function renderGallery(pkg) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const total = _images.length;
  const price = pkg.price_usd ? `USD ${Number(pkg.price_usd).toLocaleString('es-AR')}` : 'Consultar precio';

  grid.innerHTML = `
    <div class="relative overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_28px_90px_rgba(0,0,0,0.35)]" style="aspect-ratio:4/3">
      <img id="heroImage" src="${_images[_currentImg]}" alt="${pkg.name}" class="w-full h-full object-cover transition-transform duration-700" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent"></div>
      <div class="absolute inset-x-0 bottom-0 px-6 pb-6 pt-16 md:px-10 md:pb-10 md:pt-20 text-white">
        <span class="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] mb-3" style="color:rgba(255,255,255,0.75)">
          <span class="material-symbols-outlined text-[18px]">location_on</span>
          ${pkg.destination || ''}${pkg.country ? ` · ${pkg.country}` : ''}
        </span>
        <h1 class="font-bold text-[32px] md:text-[44px] leading-tight max-w-3xl">${pkg.name}</h1>
        <p class="mt-4 max-w-2xl text-sm md:text-base leading-7" style="color:rgba(255,255,255,0.78)">${pkg.description || 'Disfrutá de esta experiencia única con todo el estilo Corradi Viajes.'}</p>
        <div class="mt-6 flex flex-wrap gap-3 items-center">
          <span class="inline-flex items-center gap-2 rounded-full bg-slate-950/80 border border-white/10 px-4 py-2 text-sm font-semibold" style="backdrop-filter:blur(12px)">${price}</span>
          <button onclick="openLightbox(_currentImg)" class="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-semibold px-5 py-2.5 transition hover:bg-slate-100">
            <span class="material-symbols-outlined text-[18px]">photo_library</span>
            Ver galería
          </button>
        </div>
      </div>
      ${total > 1 ? `
      <button onclick="event.stopPropagation();prevImg()" class="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white focus:outline-none">
        <span class="material-symbols-outlined text-[22px]">chevron_left</span>
      </button>
      <button onclick="event.stopPropagation();nextImg()" class="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white focus:outline-none">
        <span class="material-symbols-outlined text-[22px]">chevron_right</span>
      </button>` : ''}
    </div>`;

  const pager = document.getElementById('galleryPager');
  if (pager) {
    pager.classList.remove('hidden');
    pager.innerHTML = `
      <div class="font-semibold">Imagen ${_currentImg + 1} de ${total}</div>
      <div class="flex gap-2">
        <button onclick="prevImg()" class="rounded-full border border-white/15 bg-slate-950/75 px-4 py-2 text-sm transition hover:bg-slate-900">Anterior</button>
        <button onclick="nextImg()" class="rounded-full border border-white/15 bg-slate-950/75 px-4 py-2 text-sm transition hover:bg-slate-900">Siguiente</button>
      </div>`;
  }

  const thumbs = document.getElementById('galleryThumbs');
  if (thumbs) {
    thumbs.classList.remove('hidden');
    thumbs.innerHTML = _images.map((img, i) => `
      <button onclick="setMainImg(${i})" id="thumb${i}" class="shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${i===_currentImg ? 'border-blue-500 opacity-100 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}" style="width:94px;height:64px;">
        <img src="${img}" alt="Imagen ${i+1}" class="w-full h-full object-cover" />
      </button>`).join('');
  }
}

function setMainImg(idx) {
  _currentImg = idx;
  const img = document.getElementById('heroImage');
  const counter = document.querySelector('#galleryPager div.font-semibold');
  if (img) {
    img.style.opacity = '0.75';
    setTimeout(() => {
      img.src = _images[idx];
      img.style.opacity = '1';
    }, 120);
  }
  if (counter) counter.textContent = `Imagen ${idx + 1} de ${_images.length}`;
  _images.forEach((_, i) => {
    const t = document.getElementById(`thumb${i}`);
    if (!t) return;
    t.className = `shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${i===idx ? 'border-blue-500 opacity-100 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`;
    t.style.cssText = 'width:94px;height:64px;';
  });
}

function nextImg() { setMainImg((_currentImg + 1) % _images.length); }
function prevImg() { setMainImg((_currentImg - 1 + _images.length) % _images.length); }

function mobileGoTo(idx) {
  const car = document.getElementById('mobileCarousel');
  if (car) car.scrollTo({ left: idx * car.clientWidth, behavior: 'smooth' });
  updateMobileThumbs(idx);
}

function updateMobileThumbs(idx) {
  _images.forEach((_, i) => {
    const t = document.getElementById(`mThumb${i}`);
    if (!t) return;
    t.className = `shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i===idx ? 'border-blue-600 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`;
  });
}

// ── Lightbox ──────────────────────────────────────
function renderLightboxThumbs() {
  const thumbsEl = document.getElementById('lbThumbs');
  if (!thumbsEl) return;
  thumbsEl.innerHTML = _images.map((img, i) => `
    <button onclick="lbGoTo(${i})" id="lbThumb${i}"
      class="shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i===0 ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-70'}"
      style="width:60px;height:46px;">
      <img src="${img}" class="w-full h-full object-cover" alt=""/>
    </button>`).join('');
}

function openLightbox(idx) {
  _lbIndex = idx;
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lbShow(idx);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.add('hidden');
  document.body.style.overflow = '';
}

function closeLightboxIfBg(e) {
  if (e.target.id === 'lightbox') closeLightbox();
}

function lbShow(idx) {
  _lbIndex = Math.max(0, Math.min(idx, _images.length - 1));
  const img = document.getElementById('lbImg');
  const counter = document.getElementById('lbCounter');
  if (img) {
    img.style.opacity = '0';
    setTimeout(() => { img.src = _images[_lbIndex]; img.style.opacity = '1'; }, 120);
  }
  if (counter) counter.textContent = `${_lbIndex + 1} / ${_images.length}`;
  _images.forEach((_, i) => {
    const t = document.getElementById(`lbThumb${i}`);
    if (!t) return;
    const active = i === _lbIndex;
    t.className = `shrink-0 rounded-lg overflow-hidden border-2 transition-all ${active ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-70'}`;
    t.style.cssText = 'width:60px;height:46px;';
  });
  const at = document.getElementById(`lbThumb${_lbIndex}`);
  if (at) at.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function lbGoTo(idx) { lbShow(idx); }
function lbNext() { lbShow((_lbIndex + 1) % _images.length); }
function lbPrev() { lbShow((_lbIndex - 1 + _images.length) % _images.length); }

// Keyboard
document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb || lb.classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') lbNext();
  if (e.key === 'ArrowLeft') lbPrev();
  if (e.key === 'Escape') closeLightbox();
});

// Touch swipe on lightbox
let _tsx = 0;
document.addEventListener('touchstart', e => {
  if (document.getElementById('lightbox')?.classList.contains('hidden')) return;
  _tsx = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', e => {
  if (document.getElementById('lightbox')?.classList.contains('hidden')) return;
  const dx = e.changedTouches[0].clientX - _tsx;
  if (Math.abs(dx) > 50) dx < 0 ? lbNext() : lbPrev();
}, { passive: true });

function showError() {
  const mc = document.getElementById('mainContainer');
  const ec = document.getElementById('errorContainer');
  if (mc) mc.style.display = 'none';
  if (ec) ec.style.display = 'block';
}

// ── Contact Form ──────────────────────────────────
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formMsg = document.getElementById('formMsg');
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Enviando...';
  const data = Object.fromEntries(new FormData(e.target).entries());
  try {
    if (USE_LOCAL) {
      await fetch(`${LOCAL_API}/inquiries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      const { error } = await db.from('corradi_contacts').insert([{
        name: data.name, email: data.email,
        destination: data.destination, message: data.message
      }]);
      if (error) throw error;
    }
    formMsg.textContent = '¡Consulta enviada! Nos pondremos en contacto pronto.';
    formMsg.className = 'text-center font-caption text-caption mt-2 text-green-600 block';
    e.target.reset();
  } catch (err) {
    console.error(err);
    formMsg.textContent = 'Hubo un error. Intentá nuevamente.';
    formMsg.className = 'text-center font-caption text-caption mt-2 text-red-600 block';
  } finally {
    btn.disabled = false; btn.textContent = 'Enviar Consulta →';
  }
});

loadPackage();
