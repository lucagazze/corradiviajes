// ── Supabase & Config ─────────────────────────────
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const USE_LOCAL = false; // Usar Supabase directo
const LOCAL_API = 'http://localhost:5000/api';

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

function isOffer(p) {
  return p.badge || (p.price_original_usd && Number(p.price_original_usd) > Number(p.price_usd));
}

async function loadPackages() {
  const grid = document.getElementById('searchResultsGrid');
  try {
    if (USE_LOCAL) {
      const res = await fetch(`${LOCAL_API}/packages`);
      const data = await res.json();
      allOffers = data.filter(isOffer);
    } else {
      const { data, error } = await db
        .from('corradi_packages')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('featured', { ascending: false })
        .order('id');
      if (error) throw error;
      allOffers = data.filter(isOffer);
    }
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
    infoEl.classList.remove('hidden');
  }

  if (!filtered.length) {
    grid.innerHTML = '<div class="col-span-full text-center py-20 font-medium" style="color:rgba(255,255,255,0.4)">No se encontraron ofertas con esos filtros.</div>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const hasDiscount = p.price_original_usd && Number(p.price_original_usd) > Number(p.price_usd);
    const discountPct = hasDiscount ? Math.round((1 - p.price_usd / p.price_original_usd) * 100) : null;
    const showBadge = p.badge || hasDiscount;
    return `
    <article class="rounded-[16px] overflow-hidden flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 20px rgba(0,0,0,0.15)"
      onclick="window.location.href='paquete.html?id=${p.id}'">
      <div class="relative overflow-hidden" style="aspect-ratio:4/3">
        <img alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          src="${p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'}"
          onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"/>
        <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)"></div>
        ${p.featured ? '<span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#3778b8;color:#fff">Destacado</span>' : ''}
        ${showBadge ? `<span class="absolute top-3 ${p.featured ? 'left-[110px]' : 'left-3'} px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#ef4444;color:#fff">Oferta</span>` : ''}
        ${discountPct ? `<span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:rgba(239,68,68,0.9);color:#fff">-${discountPct}%</span>` : ''}
        <span class="absolute bottom-3 right-3 text-[11px] font-medium px-2.5 py-1 rounded-full" style="background:rgba(255,255,255,0.15);color:#ffffff;backdrop-filter:blur(8px)">${p.country}</span>
      </div>
      <div class="p-4 flex flex-col flex-grow">
        <h3 class="font-bold text-[17px] text-white line-clamp-1 leading-tight mb-1">${p.name}</h3>
        <p class="text-sm mb-4 line-clamp-2" style="color:rgba(255,255,255,0.5)">${p.description || p.destination || ''}</p>
        <div class="mt-auto flex justify-between items-center">
          <div>
            <span class="uppercase tracking-wider text-[10px] font-medium block mb-0.5" style="color:rgba(255,255,255,0.4)">Desde</span>
            ${hasDiscount ? `<span class="font-medium text-[14px] line-through mr-2" style="color:rgba(255,255,255,0.6)">USD ${Number(p.price_original_usd).toLocaleString('es-AR')}</span>` : ''}
            <span class="font-bold text-[20px]" style="color:#3778b8">USD ${Number(p.price_usd).toLocaleString('es-AR')}</span>
          </div>
          <div class="text-white text-sm font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-80" style="background:#3778b8">Ver detalle</div>
        </div>
      </div>
    </article>`;
  }).join('');
}

loadPackages();
