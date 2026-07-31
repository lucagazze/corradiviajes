// ── Supabase & Config ─────────────────────────────
// Cliente único compartido (js/config.js)
const db = getDb();

let allPackages = [];
let activeCategory = 'all';
let activeFeature = 'all';
let liveQuery = '';
let sortBy = 'relevance';
let priceMin = null;
let priceMax = null;

const urlParams = new URLSearchParams(window.location.search);
const searchDate = urlParams.get('date') || '';
const searchGuests = urlParams.get('guests') || '';
const searchMonth = urlParams.get('month') || '';
const searchPrice = urlParams.get('price') || '';

const urlQ = urlParams.get('q') ? urlParams.get('q').toLowerCase() : '';
if (urlQ) {
  liveQuery = urlQ;
  const si = document.getElementById('searchInput');
  if (si) si.value = urlParams.get('q');
}

const urlCountry = urlParams.get('country');
if (urlCountry) {
  activeCategory = urlCountry;
  // Label will be set dynamically inside populateCountrySelect
}

// Process initial price filter from Hero Search
if (searchPrice) {
  if (searchPrice.includes('+')) {
    priceMin = Number(searchPrice.replace('+', ''));
  } else if (searchPrice.includes('-')) {
    const parts = searchPrice.split('-');
    if (parts[0]) priceMin = Number(parts[0]);
    if (parts[1]) priceMax = Number(parts[1]);
  }
  
  // Set the UI inputs
  window.addEventListener('DOMContentLoaded', () => {
    if (priceMin !== null) document.getElementById('priceMin').value = priceMin;
    if (priceMax !== null) document.getElementById('priceMax').value = priceMax;
  });
}

document.getElementById('searchInput')?.addEventListener('input', function() {
  liveQuery = this.value.toLowerCase().trim();
  renderResults();
});

async function loadPackages() {
  const grid = document.getElementById('searchResultsGrid');
  try {
    allPackages = await fetchPackages();
    if (window.populateCountrySelect) window.populateCountrySelect();
    renderResults();
  } catch(e) {
    if (grid) grid.innerHTML = '<div class="col-span-full text-center py-10 font-medium" style="color:rgba(255,100,100,0.8)">Error al cargar destinos. Verificá la conexión.</div>';
    console.error(e);
  }
}

function setupFilters() {
  const chips = document.querySelectorAll('#regionChips button, #tagChips button');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.style.cssText = 'background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.12)';
      });
      chip.style.cssText = 'background:#3778b8;color:#fff;border:1px solid transparent';
      activeCategory = chip.dataset.cat;
      renderResults();
    });
  });
}

// Limpia todos los filtros y vuelve al listado completo
window.clearAllFilters = function() {
  liveQuery = ''; activeCategory = 'all'; activeFeature = 'all';
  priceMin = null; priceMax = null; sortBy = 'relevance';
  const si = document.getElementById('searchInput'); if (si) si.value = '';
  const pMin = document.getElementById('priceMin'); if (pMin) pMin.value = '';
  const pMax = document.getElementById('priceMax'); if (pMax) pMax.value = '';
  const cv = document.getElementById('cddCountryValue'); if (cv) cv.textContent = 'Todos';
  const fv = document.getElementById('cddFeatureValue'); if (fv) fv.textContent = 'Todos';
  document.querySelectorAll('#cddCountryPanel .cdd-option, #cddFeaturePanel .cdd-option').forEach(o => {
    o.classList.toggle('selected', o.dataset.value === 'all');
  });
  if (window.populateCountrySelect) window.populateCountrySelect();
  renderResults();
};

function renderResults() {
  const grid = document.getElementById('searchResultsGrid');
  let filtered = [...allPackages];

  if (liveQuery) {
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(liveQuery) ||
      p.destination?.toLowerCase().includes(liveQuery) ||
      p.country?.toLowerCase().includes(liveQuery)
    );
  }

  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => (p.country || '').trim().toLowerCase() === activeCategory.toLowerCase());
  }

  if (activeFeature !== 'all') {
    if (activeFeature === 'destacados') {
      filtered = filtered.filter(p => p.featured);
    } else if (activeFeature === 'grupal') {
      filtered = filtered.filter(p => p.section === 'salida_grupal');
    } else if (activeFeature === 'oferta') {
      filtered = filtered.filter(p => p.section !== 'salida_grupal' && p.price_original_usd && Number(p.price_original_usd) > Number(p.price_usd));
    }
  }

  // Filtro de precio: los viajes "A consultar" (sin precio cargado) no se descartan,
  // porque no sabemos su valor y esconderlos vaciaba la búsqueda entera.
  const sinPrecio = p => !(Number(p.price_usd) > 0);
  if (priceMin !== null) filtered = filtered.filter(p => sinPrecio(p) || Number(p.price_usd) >= priceMin);
  if (priceMax !== null) filtered = filtered.filter(p => sinPrecio(p) || Number(p.price_usd) <= priceMax);

  // Al ordenar por precio, los "A consultar" van siempre al final
  const priceRank = (p, dir) => (Number(p.price_usd) > 0 ? Number(p.price_usd) : (dir === 'asc' ? Infinity : -Infinity));
  if (sortBy === 'price_asc') filtered.sort((a, b) => priceRank(a, 'asc') - priceRank(b, 'asc'));
  else if (sortBy === 'price_desc') filtered.sort((a, b) => priceRank(b, 'desc') - priceRank(a, 'desc'));
  else if (sortBy === 'az') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  else if (sortBy === 'za') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  else if (sortBy === 'newest') filtered.sort((a, b) => b.id - a.id);

  // Results count
  const infoEl = document.getElementById('resultsInfo');
  if (infoEl) {
    infoEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'destino encontrado' : 'destinos encontrados'}`;
    infoEl.classList.toggle('hidden', filtered.length === 0);
  }

  if (!filtered.length) {
    const wa = typeof whatsappLink === 'function'
      ? whatsappLink('un viaje a medida', 'topic')
      : 'https://wa.me/5493416057588';
    grid.innerHTML = `
      <div class="col-span-full flex flex-col items-center text-center py-16 md:py-20 px-6">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style="background:rgba(55,120,184,0.12);border:1px solid rgba(55,120,184,0.25)">
          <span class="material-symbols-outlined text-[36px]" style="color:#7ab3e0">search_off</span>
        </div>
        <h3 class="font-bold text-[21px] md:text-[24px] mb-2">No encontramos viajes con esa búsqueda</h3>
        <p class="text-[15px] max-w-md mb-7 leading-relaxed" style="color:rgba(255,255,255,0.55)">
          Probá con otro destino o limpiá los filtros. Y si el viaje que buscás no está en la lista, lo armamos a medida.
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <button onclick="clearAllFilters()" class="btn-solid inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-full transition-all hover:scale-105" style="background:#3778b8;color:#fff">
            <span class="material-symbols-outlined text-[18px]">restart_alt</span>
            Limpiar filtros
          </button>
          <a href="${wa}" target="_blank" rel="noopener" class="btn-solid inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-full transition-all hover:scale-105" style="background:#25D366;color:#fff">
            <span class="material-symbols-outlined text-[18px]">chat</span>
            Armar mi viaje a medida
          </a>
        </div>
      </div>`;
    return;
  }

  let extraParams = '';
  if (searchDate) extraParams += `&date=${searchDate}`;
  if (searchGuests) extraParams += `&guests=${searchGuests}`;

  grid.innerHTML = filtered.map(p => {
    const hasDiscount = p.price_original_usd && Number(p.price_original_usd) > Number(p.price_usd);
    const discountPct = hasDiscount ? Math.round((1 - p.price_usd / p.price_original_usd) * 100) : null;
    const isGroup = p.section === 'salida_grupal';
    const isOffer = !isGroup && hasDiscount;

    // Badges en una fila flex: se acomodan solos y nunca se superponen
    let leftBadge = '';
    if (isGroup) {
      leftBadge += `<span class="group-label-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0" style="background:#f2b352;color:#0d1b2e;box-shadow:0 4px 14px rgba(242,179,82,0.4)">
          <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">groups</span>
          Grupal
         </span>`;
    }
    if (p.featured) {
      leftBadge += `<span class="featured-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0" style="background:#3778b8;color:#ffffff;box-shadow:0 4px 14px rgba(55,120,184,0.4)">Destacado</span>`;
    }
    if (isOffer) {
      leftBadge += `<span class="offer-label-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0" style="background:#ef4444;color:#ffffff;box-shadow:0 4px 14px rgba(239,68,68,0.4)">
          <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">local_fire_department</span>
          Oferta
         </span>`;
    }

    const badgeRight = p.badge
      ? `<span class="ml-auto bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">${p.badge}</span>`
      : (discountPct ? `<span class="discount-badge ml-auto bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">-${discountPct}%</span>` : '');

    const highlights = p.highlights 
      ? p.highlights.split(/\n|·/).map(h => h.trim().replace(/^⭐\s*|^•\s*/, '')).filter(Boolean).slice(0, 3) 
      : [];

    return `
    <article class="rounded-[24px] overflow-hidden bg-white border border-slate-100 flex flex-col cursor-pointer group transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.28)] hover:-translate-y-1"
      data-id="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-has-desc="${!!(p.description || '').trim()}" data-extra-params="${extraParams}"
      onclick="handlePkgCardClick(this)">
      <div class="relative overflow-hidden" style="height:220px">
        <img alt="${p.name}" class="w-full h-full object-cover pointer-events-none"
          src="${p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'}"
          onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"/>
        <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)"></div>
        <div class="absolute top-3 left-3 right-3 flex flex-wrap items-start gap-2">${leftBadge}${badgeRight}</div>
        <span class="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full px-3 py-1 text-[12px] font-semibold">${p.country || ''}${p.days ? ' · '+p.days+' días' : ''}</span>
      </div>
      <div class="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 class="font-['Geomanist'] font-semibold text-[17px] text-slate-900 leading-tight mb-1.5">${p.name}</h3>
          <p class="text-slate-500 text-[13px] font-light line-clamp-2 mb-4">${p.description ? p.description.replace(/<[^>]*>/g, ' ') : p.destination || ''}</p>
        </div>
        <div class="mt-auto flex items-end justify-between gap-3 pt-2 border-t border-slate-100">
          <div class="pt-3">
            <span class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-0.5">${p.price_usd ? 'Desde' : 'Precio'}</span>
            <div class="flex items-baseline gap-1.5">
              ${hasDiscount && p.price_usd ? `<span class="text-slate-400 text-[13px] line-through">USD ${Number(p.price_original_usd).toLocaleString('es-AR')}</span>` : ''}
              <span class="font-['Geomanist'] font-bold text-[22px]" style="color:#3778b8">${p.price_usd ? `USD ${Number(p.price_usd).toLocaleString('es-AR')}` : 'A consultar'}</span>
            </div>
          </div>
          <div class="pt-3">
            <div class="flex items-center gap-1.5 text-white text-[13px] font-medium px-4 py-2 rounded-full whitespace-nowrap" style="background:#3778b8">
              Ver paquete
              <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </article>`;
  }).join('');
}

// Arrancar recién cuando el HTML terminó de parsear: los <script> inline de la
// página (populateCountrySelect, initCDD…) se definen DESPUÉS de este archivo,
// y con la caché de paquetes la carga es tan rápida que llegaba antes.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPackages);
} else {
  loadPackages();
}
