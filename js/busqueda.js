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
      allPackages = data || [];
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
      filtered = filtered.filter(p => p.badge || (p.price_original_usd && p.price_original_usd > p.price_usd));
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

  grid.innerHTML = filtered.map(p => `
    <article class="rounded-[16px] overflow-hidden flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 20px rgba(0,0,0,0.15)"
      onclick="window.location.href='paquete.html?id=${p.id}${extraParams}'">
      <div class="relative overflow-hidden" style="height:210px">
        <img alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          src="${p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'}"
          onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"/>
        <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)"></div>
        ${p.featured ? '<span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#3778b8;color:#fff">Destacado</span>' : ''}
        ${p.badge ? `<span class="absolute top-3 ${p.featured ? 'left-[110px]' : 'left-3'} px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#ef4444;color:#fff">${p.badge}</span>` : ''}
        ${p.price_original_usd && p.price_original_usd > p.price_usd ? `<span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:rgba(239,68,68,0.9);color:#fff">-${Math.round((1 - p.price_usd / p.price_original_usd) * 100)}%</span>` : ''}
        <span class="absolute bottom-3 right-3 text-[11px] font-medium px-2.5 py-1 rounded-full" style="background:rgba(255,255,255,0.15);color:#ffffff;backdrop-filter:blur(8px)">${p.country}</span>
      </div>
      <div class="p-4 flex flex-col flex-grow">
        <h3 class="font-bold text-[17px] text-white line-clamp-1 leading-tight mb-1">${p.name}</h3>
        <p class="text-sm mb-4 line-clamp-2" style="color:rgba(255,255,255,0.5)">${p.description || p.destination || ''}</p>
        <div class="mt-auto flex justify-between items-center">
          <div>
            <span class="uppercase tracking-wider text-[10px] font-medium block mb-0.5" style="color:rgba(255,255,255,0.4)">Desde</span>
            ${p.price_original_usd && p.price_original_usd > p.price_usd ? `<span class="font-medium text-[14px] line-through mr-2" style="color:rgba(255,255,255,0.6)">USD ${Number(p.price_original_usd).toLocaleString('es-AR')}</span>` : ''}
            <span class="font-bold text-[20px]" style="color:#3778b8">USD ${Number(p.price_usd).toLocaleString('es-AR')}</span>
          </div>
          <div class="text-white text-sm font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-80" style="background:#3778b8">Ver detalle</div>
        </div>
      </div>
    </article>
  `).join('');
}

loadPackages();
