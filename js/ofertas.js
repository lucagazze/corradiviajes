// ── Supabase & Config ─────────────────────────────
// Cliente único compartido (js/config.js)
const db = getDb();

let allOffers = []; // solo paquetes en oferta
let liveQuery = '';
let sortBy = 'price_asc';
let priceMin = null;
let priceMax = null;
let activeCategory = 'all';
let activeFeature = 'all';

const urlParams = new URLSearchParams(window.location.search);
const urlQ = urlParams.get('q') ? urlParams.get('q').toLowerCase() : '';
if (urlQ) {
  liveQuery = urlQ;
  const si = document.getElementById('searchInput');
  if (si) si.value = urlParams.get('q');
}

document.getElementById('searchInput')?.addEventListener('input', function() {
  liveQuery = this.value.toLowerCase().trim();
  renderResults();
});

function isLive(p) {
  if (!p.expires_at) return true;
  const exp = new Date(p.expires_at);
  return isNaN(exp) || exp.getTime() >= Date.now();
}

function isOffer(p) {
  if (!isLive(p)) return false;
  return p.section !== 'salida_grupal' && p.price_original_usd && Number(p.price_original_usd) > Number(p.price_usd);
}

async function loadPackages() {
  const grid = document.getElementById('searchResultsGrid');
  try {
    allOffers = (await fetchPackages()).filter(isOffer);
    if (window.populateCountrySelect) window.populateCountrySelect();
    renderResults();
  } catch(e) {
    if (grid) grid.innerHTML = '<div class="col-span-full text-center py-10 font-medium" style="color:rgba(255,100,100,0.8)">Error al cargar ofertas. Verificá la conexión.</div>';
    console.error(e);
  }
}

function renderResults() {
  const grid = document.getElementById('searchResultsGrid');
  let filtered = [...allOffers];

  // Búsqueda por texto
  if (liveQuery) {
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(liveQuery) ||
      p.destination?.toLowerCase().includes(liveQuery) ||
      p.country?.toLowerCase().includes(liveQuery) ||
      p.description?.toLowerCase().includes(liveQuery)
    );
  }

  // Rango de precio
  if (priceMin !== null) filtered = filtered.filter(p => Number(p.price_usd) >= priceMin);
  if (priceMax !== null) filtered = filtered.filter(p => Number(p.price_usd) <= priceMax);

  // Categoría (País)
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => p.country === activeCategory);
  }

  // Feature (Destacados)
  if (activeFeature === 'destacados') {
    filtered = filtered.filter(p => p.featured);
  }

  // Ordenamiento
  if (sortBy === 'price_asc') filtered.sort((a, b) => Number(a.price_usd) - Number(b.price_usd));
  else if (sortBy === 'price_desc') filtered.sort((a, b) => Number(b.price_usd) - Number(a.price_usd));
  else if (sortBy === 'az') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  else if (sortBy === 'za') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  else if (sortBy === 'newest') filtered.sort((a, b) => b.id - a.id);

  // Contador de resultados
  const infoEl = document.getElementById('resultsInfo');
  if (infoEl) {
    infoEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}`;
    // Si no hay resultados el contador sobra: manda el empty state
    infoEl.classList.toggle('hidden', filtered.length === 0);
  }

  if (!filtered.length) {
    // Dos estados distintos: "todavía no hay ofertas cargadas" vs "los filtros no dan resultado"
    const sinOfertas = allOffers.length === 0;
    const wa = typeof whatsappLink === 'function'
      ? whatsappLink('las próximas ofertas', 'topic')
      : 'https://wa.me/5493416057588';
    grid.innerHTML = `
      <div class="col-span-full flex flex-col items-center text-center py-16 md:py-20 px-6">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style="background:rgba(55,120,184,0.12);border:1px solid rgba(55,120,184,0.25)">
          <span class="material-symbols-outlined text-[36px]" style="color:#7ab3e0">${sinOfertas ? 'local_offer' : 'search_off'}</span>
        </div>
        <h3 class="font-bold text-[21px] md:text-[24px] mb-2">
          ${sinOfertas ? 'Todavía no hay ofertas publicadas' : 'No encontramos ofertas con esos filtros'}
        </h3>
        <p class="text-[15px] max-w-md mb-7 leading-relaxed" style="color:rgba(255,255,255,0.55)">
          ${sinOfertas
            ? 'Estamos cerrando las próximas promociones. Mientras tanto podés ver todos nuestros destinos o escribirnos y te avisamos apenas salga una.'
            : 'Probá ampliando el rango de precio o eligiendo otro destino.'}
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="busqueda.html" class="btn-solid inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-full transition-all hover:scale-105" style="background:#3778b8;color:#fff">
            <span class="material-symbols-outlined text-[18px]">travel_explore</span>
            Ver todos los destinos
          </a>
          <a href="${wa}" target="_blank" rel="noopener" class="btn-solid inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-full transition-all hover:scale-105" style="background:#25D366;color:#fff">
            <span class="material-symbols-outlined text-[18px]">chat</span>
            Avisame por WhatsApp
          </a>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const hasDiscount = p.price_original_usd && Number(p.price_original_usd) > Number(p.price_usd);
    const discountPct = hasDiscount ? Math.round((1 - p.price_usd / p.price_original_usd) * 100) : null;
    const showBadge = p.badge || hasDiscount;

    const badgeRight = p.badge
      ? `<span class="ml-auto bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">${p.badge}</span>`
      : (discountPct ? `<span class="discount-badge ml-auto bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">-${discountPct}%</span>` : '');

    const highlights = p.highlights 
      ? p.highlights.split(/\n|·/).map(h => h.trim().replace(/^⭐\s*|^•\s*/, '')).filter(Boolean).slice(0, 3) 
      : [];

    return `
    <article class="rounded-[24px] overflow-hidden bg-white border border-slate-100 flex flex-col cursor-pointer group transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.28)] hover:-translate-y-1"
      data-id="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-has-desc="${!!(p.description || '').trim()}"
      onclick="handlePkgCardClick(this)">
      <div class="relative overflow-hidden" style="height:220px">
        <img alt="${p.name}" class="w-full h-full object-cover pointer-events-none"
          src="${p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'}"
          onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"/>
        <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)"></div>
        <div class="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
          ${showBadge ? `<span class="offer-label-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0" style="background:#ef4444;color:#ffffff;box-shadow:0 4px 14px rgba(239,68,68,0.4)">
            <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">local_fire_department</span>
            Oferta
          </span>` : ''}
          ${p.featured ? `<span class="featured-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0" style="background:#3778b8;color:#ffffff;box-shadow:0 4px 14px rgba(55,120,184,0.4)">Destacado</span>` : ''}
        </div>
        ${badgeRight ? `<div class="absolute top-3 right-3 z-10 pointer-events-none">${badgeRight.replace('ml-auto ', '')}</div>` : ''}
        <span class="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full px-3 py-1 text-[12px] font-semibold">${p.country || ''}${p.days ? ' · '+p.days+' días' : ''}</span>
      </div>
      <div class="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 class="font-['Geomanist'] font-semibold text-[17px] text-slate-900 leading-tight mb-1.5">${p.name}</h3>
          <p class="text-slate-500 text-[13px] font-light line-clamp-2 mb-4">${p.description ? p.description.replace(/<[^>]*>/g, ' ') : p.destination || ''}</p>
          ${highlights.length ? `<div class="flex flex-wrap gap-1.5 -mt-2 mb-4">${highlights.map(h => `<span class="text-[10.5px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">${h}</span>`).join('')}</div>` : ''}
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
