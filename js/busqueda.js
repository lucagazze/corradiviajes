// ── Supabase & Config ─────────────────────────────
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const USE_LOCAL = false; // Usar Supabase directo para mostrar los paquetes cargados en admin
const LOCAL_API = 'http://localhost:5000/api';

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
    if (USE_LOCAL) {
      const res = await fetch(`${LOCAL_API}/packages`);
      allPackages = await res.json();
    } else {
      const { data, error } = await db
        .from('corradi_packages')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('id');
      if (error) throw error;
      allPackages = (data || []).filter(p => {
        if (!p.expires_at) return true;
        const exp = new Date(p.expires_at);
        return isNaN(exp) || exp.getTime() >= Date.now();
      });
    }
    populateCountrySelect();
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

function renderResults() {
  const grid = document.getElementById('searchResultsGrid');
  let filtered = allPackages;

  if (liveQuery) {
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(liveQuery) ||
      p.destination?.toLowerCase().includes(liveQuery) ||
      p.country?.toLowerCase().includes(liveQuery)
    );
  }

  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => (p.country || '').trim() === activeCategory);
  }

  if (activeFeature !== 'all') {
    if (activeFeature === 'destacados') {
      filtered = filtered.filter(p => p.featured);
    } else if (activeFeature === 'oferta') {
      filtered = filtered.filter(p => p.section !== 'salida_grupal' && p.price_original_usd && Number(p.price_original_usd) > Number(p.price_usd));
    }
  }

  if (priceMin !== null) filtered = filtered.filter(p => Number(p.price_usd) >= priceMin);
  if (priceMax !== null) filtered = filtered.filter(p => Number(p.price_usd) <= priceMax);

  if (sortBy === 'price_asc') filtered.sort((a, b) => Number(a.price_usd) - Number(b.price_usd));
  else if (sortBy === 'price_desc') filtered.sort((a, b) => Number(b.price_usd) - Number(a.price_usd));
  else if (sortBy === 'az') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  else if (sortBy === 'za') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  else if (sortBy === 'newest') filtered.sort((a, b) => b.id - a.id);

  // Results count
  const infoEl = document.getElementById('resultsInfo');
  if (infoEl) {
    infoEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'destino encontrado' : 'destinos encontrados'}`;
    if (filtered.length || liveQuery || activeCategory !== 'all') infoEl.classList.remove('hidden');
    else infoEl.classList.add('hidden');
  }

  if (!filtered.length) {
    grid.innerHTML = '<div class="col-span-full text-center py-20 font-medium" style="color:rgba(255,255,255,0.4)">No se encontraron paquetes con esos filtros.</div>';
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

    let leftBadge = '';
    if (isGroup) {
      leftBadge += `<span class="group-label-badge absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#f2b352;color:#0d1b2e;box-shadow:0 4px 14px rgba(242,179,82,0.4)">
          <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">groups</span>
          Grupal
         </span>`;
      if (p.featured) {
        leftBadge += `<span class="featured-badge absolute top-3 left-[92px] inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#3778b8;color:#ffffff;box-shadow:0 4px 14px rgba(55,120,184,0.4)">Destacado</span>`;
      }
    } else {
      if (p.featured) {
        leftBadge += `<span class="featured-badge absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#3778b8;color:#ffffff;box-shadow:0 4px 14px rgba(55,120,184,0.4)">Destacado</span>`;
        if (isOffer) {
          leftBadge += `<span class="offer-label-badge absolute top-3 left-[110px] inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#ef4444;color:#ffffff;box-shadow:0 4px 14px rgba(239,68,68,0.4)">
              <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">local_fire_department</span>
              Oferta
             </span>`;
        }
      } else if (isOffer) {
        leftBadge += `<span class="offer-label-badge absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#ef4444;color:#ffffff;box-shadow:0 4px 14px rgba(239,68,68,0.4)">
            <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">local_fire_department</span>
            Oferta
           </span>`;
      }
    }

    const badgeRight = p.badge 
      ? `<span class="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">${p.badge}</span>`
      : (discountPct ? `<span class="discount-badge absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">-${discountPct}%</span>` : '');

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
        ${leftBadge}
        ${badgeRight}
        <span class="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full px-3 py-1 text-[12px] font-semibold">${p.country || ''}${p.days ? ' · '+p.days+' días' : ''}</span>
      </div>
      <div class="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 class="font-['Geomanist'] font-semibold text-[17px] text-slate-900 leading-tight mb-1.5">${p.name}</h3>
          <p class="text-slate-500 text-[13px] font-light line-clamp-2 mb-4">${p.description ? p.description.replace(/<[^>]*>/g, ' ') : p.destination || ''}</p>
          ${highlights.length ? `<div class="flex flex-wrap gap-1.5 mb-4">
            ${highlights.map(h => `<span class="text-[10.5px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">${h}</span>`).join('')}
          </div>` : ''}
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

loadPackages();
