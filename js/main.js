// ── Supabase & Config ─────────────────────────────
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const USE_LOCAL = SUPABASE_ANON_KEY.includes('REEMPLAZAR');
const LOCAL_API = 'http://localhost:5000/api';

let allPackages = [];
let groupTrips = [];
let inspirationalTrips = [];
let offerTrips = [];
let visibleCount = 5;

// Filtro: paquete activo y no expirado
function isLive(p) {
  if (!p.active) return false;
  if (p.expires_at) {
    const exp = new Date(p.expires_at);
    if (!isNaN(exp) && exp.getTime() < Date.now()) return false;
  }
  return true;
}

// ── Load packages ────────────────────────────────
async function loadPackages() {
  const grid = document.getElementById('pkgGrid');
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
        .order('featured', { ascending: false })
        .order('id');
      if (error) throw error;
      allPackages = (data || []).filter(isLive);
    }
    // Segmentar por section
    groupTrips         = allPackages.filter(p => p.section === 'salida_grupal');
    offerTrips         = allPackages.filter(p => p.section === 'oferta');
    inspirationalTrips = allPackages.filter(p => !p.section || p.section === 'inspirador');

    window.allPackages = allPackages;
    window.groupTrips = groupTrips;
    window.inspirationalTrips = inspirationalTrips;
    window.offerTrips = offerTrips;
    window.dispatchEvent(new CustomEvent('corradiPackagesLoaded'));
    renderPackages();
    renderOffersCarousel();
    renderPromoOffers();
    setupAutocomplete();
  } catch (e) {
    if (grid) grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">No se pudieron cargar los destinos.</div>`;
    console.error(e);
  }
}

// ── Render bento carousel (desktop: groups of 5 bento, mobile: snap scroll) ─
let _bentoPage = 0;

function renderPackages() {
  const container = document.getElementById('pkgGrid');
  if (!container) return;

  const sorted = [...inspirationalTrips].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  if (!sorted.length) {
    container.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">No hay destinos disponibles.</div>';
    return;
  }

  const totalGroups = Math.ceil(sorted.length / 5);
  _bentoPage = Math.max(0, Math.min(_bentoPage, totalGroups - 1));
  const slice = sorted.slice(_bentoPage * 5, _bentoPage * 5 + 5);

  container.className = '';
  container.innerHTML = `
    <!-- MOBILE: horizontal snap carousel (all packages) -->
    <div class="md:hidden flex flex-col gap-3">
      <div id="destinosTrackMobile" class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2" onscroll="updateMobileDots()" style="scroll-behavior:smooth;scrollbar-width:none;-webkit-overflow-scrolling:touch;">
        ${sorted.map((p, i) => {
          const img = p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
          return `
          <div class="group shrink-0 snap-start w-[78vw] rounded-[18px] overflow-hidden cursor-pointer relative pkg-card-mobile" style="aspect-ratio:3/4;"
            onclick="window.location.href='paquete.html?id=${p.id}'">
            <img alt="${p.name}" src="${img}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>
            ${p.featured ? `<span class="absolute top-3 left-3 px-2.5 py-1 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wide rounded-full">Destacado</span>` : ''}
            <div class="absolute bottom-0 left-0 right-0 p-4">
              <span class="text-white/70 text-[11px] font-medium uppercase tracking-wider">${p.country}</span>
              <h3 class="text-white font-bold text-[16px] font-['Plus_Jakarta_Sans'] leading-tight mt-0.5">${p.name}</h3>
              <span class="text-white/90 font-semibold text-sm block mt-1">Desde USD ${Number(p.price_usd).toLocaleString('es-AR')}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
      <!-- Mobile Dots -->
      <div id="mobileDots" class="flex justify-center gap-1.5 mt-1">
        ${sorted.map((_, i) => `<div class="w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-blue-600 w-4' : 'bg-slate-300'}"></div>`).join('')}
      </div>
    </div>

    <!-- DESKTOP: Bento grid (group of 5) with nav arrows -->
    <div class="hidden md:block relative">
      ${totalGroups > 1 ? `
      <button onclick="_bentoPage=Math.max(0,_bentoPage-1);renderPackages()" id="bentoPrev"
        class="absolute -left-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 text-blue-600 hover:text-blue-700 hover:scale-105 ${_bentoPage === 0 ? 'opacity-30 pointer-events-none' : ''}">
        <span class="material-symbols-outlined font-bold text-[24px]">chevron_left</span>
      </button>
      <button onclick="_bentoPage=Math.min(${totalGroups-1},_bentoPage+1);renderPackages()" id="bentoNext"
        class="absolute -right-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 text-blue-600 hover:text-blue-700 hover:scale-105 ${_bentoPage === totalGroups - 1 ? 'opacity-30 pointer-events-none' : ''}">
        <span class="material-symbols-outlined font-bold text-[24px]">chevron_right</span>
      </button>` : ''}

      <div class="grid grid-cols-3 gap-gutter" style="grid-template-rows: repeat(2, 240px);">
        ${slice.map((p, i) => {
          const img = p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
          if (i === 0) return `
            <div class="group relative col-span-1 row-span-2 rounded-[18px] overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition-all transform hover:-translate-y-1"
              onclick="window.location.href='paquete.html?id=${p.id}'">
              <img alt="${p.name}" src="${img}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              ${p.featured ? `<span class="absolute top-4 left-4 px-3 py-1 text-white text-[11px] font-bold uppercase tracking-wide rounded-full" style="background:#3778b8">Destacado</span>` : ''}
              <div class="absolute bottom-0 left-0 p-6 w-full">
                <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[11px] font-medium mb-2">${p.country}</span>
                <h3 class="text-white font-bold text-[22px] font-['Plus_Jakarta_Sans'] leading-tight">${p.name}</h3>
                <div class="flex items-baseline gap-1.5 mt-2">
                  <span class="text-white/80 text-sm">Desde</span>
                  <span class="text-white font-bold text-xl font-['Plus_Jakarta_Sans'] drop-shadow-sm">USD ${Number(p.price_usd).toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>`;
          return `
            <div class="group relative col-span-1 row-span-1 rounded-[18px] overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition-all transform hover:-translate-y-1"
              onclick="window.location.href='paquete.html?id=${p.id}'">
              <img alt="${p.name}" src="${img}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
              <div class="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div>
              <div class="absolute bottom-0 left-0 p-4 w-full">
                <h3 class="text-white font-semibold text-[15px] font-['Plus_Jakarta_Sans'] leading-tight">${p.name}</h3>
                <span class="text-white text-sm font-bold drop-shadow-sm">Desde USD ${Number(p.price_usd).toLocaleString('es-AR')}</span>
              </div>
            </div>`;
        }).join('')}
      </div>

      ${totalGroups > 1 ? `
      <div class="flex justify-center gap-2 mt-5">
        ${Array.from({length: totalGroups}, (_, i) => `
          <button onclick="_bentoPage=${i};renderPackages()"
            class="w-2 h-2 rounded-full transition-all ${i === _bentoPage ? 'w-5' : 'bg-slate-300 hover:bg-slate-400'}" style="${i === _bentoPage ? 'background:#3778b8' : ''}"></button>`).join('')}
      </div>` : ''}
    </div>`;
}

// Update active dot in mobile view
window.updateMobileDots = function() {
  const track = document.getElementById('destinosTrackMobile');
  const dotsContainer = document.getElementById('mobileDots');
  if (!track || !dotsContainer) return;
  
  const cards = track.querySelectorAll('.pkg-card-mobile');
  if (!cards.length) return;
  
  const trackRect = track.getBoundingClientRect();
  const trackCenter = trackRect.left + trackRect.width / 2;
  
  let activeIndex = 0;
  let minDistance = Infinity;
  
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const distance = Math.abs(trackCenter - cardCenter);
    if (distance < minDistance) {
      minDistance = distance;
      activeIndex = i;
    }
  });
  
  const dots = dotsContainer.children;
  for (let i = 0; i < dots.length; i++) {
    if (i === activeIndex) {
      dots[i].className = "w-4 h-1.5 rounded-full transition-all duration-300 bg-blue-600";
    } else {
      dots[i].className = "w-1.5 h-1.5 rounded-full transition-all duration-300 bg-slate-300";
    }
  }
}



// ── Offers Mobile Dots ───────────────────────────────────────────
window.updateOffersDots = function() {
  const track = document.getElementById('offersTrackMobile');
  const dotsContainer = document.getElementById('offersDotsMobile');
  if (!track || !dotsContainer) return;
  const cards = track.querySelectorAll('.offer-card-mobile');
  if (!cards.length) return;
  const trackRect = track.getBoundingClientRect();
  const trackCenter = trackRect.left + trackRect.width / 2;
  let activeIndex = 0, minDistance = Infinity;
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const dist = Math.abs(trackCenter - (rect.left + rect.width / 2));
    if (dist < minDistance) { minDistance = dist; activeIndex = i; }
  });
  [...dotsContainer.children].forEach((dot, i) => {
    dot.className = i === activeIndex
      ? 'w-4 h-1.5 rounded-full transition-all duration-300 bg-[#3778b8]'
      : 'w-1.5 h-1.5 rounded-full transition-all duration-300 bg-slate-300';
  });
};

// ── Infinite Center-Focused Offers Carousel ─────────────────────
function renderOffersCarousel() {
  const track = document.getElementById('offersCarouselTrack');
  const viewport = document.getElementById('offersViewport');
  const prevBtn = document.getElementById('offersPrev');
  const nextBtn = document.getElementById('offersNext');
  if (!track || !viewport) return;

  if (!groupTrips.length) {
    track.innerHTML = '<div class="flex items-center justify-center h-72 w-full text-white/40">Próximamente nuevas salidas grupales.</div>';
    const mt = document.getElementById('offersTrackMobile');
    if (mt) mt.innerHTML = '<div class="flex items-center justify-center h-72 w-[78vw] shrink-0 text-white/40">Próximamente.</div>';
    return;
  }

  // ── Populate MOBILE snap carousel ──────────────────────────────
  const mobileTrack = document.getElementById('offersTrackMobile');
  const mobileDots  = document.getElementById('offersDotsMobile');
  if (mobileTrack) {
    mobileTrack.innerHTML = groupTrips.map(p => {
      const img = p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
      return `
      <div class="offer-card-mobile group shrink-0 snap-start w-[78vw] rounded-[18px] overflow-hidden cursor-pointer relative"
        style="aspect-ratio:3/4;" onclick="window.location.href='paquete.html?id=${p.id}'">
        <img alt="${p.name}" src="${img}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>
        <span class="absolute top-3 left-3 px-2.5 py-1 text-white text-[11px] font-bold uppercase tracking-wide rounded-full" style="background:#f2b352;color:#0d1b2e">Grupal</span>
        <div class="absolute bottom-0 left-0 right-0 p-4">
          <span class="text-white/70 text-[11px] font-medium uppercase tracking-wider">${p.country}</span>
          <h3 class="text-white font-bold text-[16px] font-['Plus_Jakarta_Sans'] leading-tight mt-0.5">${p.name}</h3>
          <span class="text-white/90 font-semibold text-sm block mt-1">Desde USD ${Number(p.price_usd).toLocaleString('es-AR')}</span>
        </div>
      </div>`;
    }).join('');
    if (mobileDots) {
      mobileDots.innerHTML = groupTrips.map((_, i) =>
        `<div class="w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-[#3778b8] w-4' : 'bg-slate-300'}"></div>`
      ).join('');
    }
  }

  // Build card HTML
  function buildCard(p) {
    const img = p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
    const badgeColor = 'background:#f2b352;color:#0d1b2e;font-weight:700;text-shadow:none;box-shadow:0 2px 8px rgba(242,179,82,0.4)';
    return `
    <div class="offer-card flex-shrink-0 rounded-[24px] overflow-hidden bg-white border border-slate-100 flex flex-col cursor-pointer group transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.28)] hover:-translate-y-1"
      style="width:340px" data-id="${p.id}">
      <div class="relative overflow-hidden" style="height:220px">
        <img src="${img}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'" alt="${p.name}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none">
        <div class="absolute inset-0" style="background:linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)"></div>
        <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="${badgeColor}">Salida Grupal</span>
        <span class="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 rounded-full px-3 py-1 text-[12px] font-semibold">${p.country}</span>
      </div>
      <div class="p-5 flex flex-col flex-1 justify-between pointer-events-none">
        <div>
          <h3 class="font-['Geomanist'] font-medium text-[17px] text-slate-900 leading-tight mb-1.5">${p.name}</h3>
          <p class="text-slate-400 text-[13px] font-light line-clamp-2">${p.description || ''}</p>
        </div>
        <div class="flex items-center justify-between mt-5 gap-3">
          <div>
            <span class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Desde</span>
            <span class="font-['Geomanist'] font-bold text-[22px]" style="color:#3778b8">USD ${Number(p.price_usd).toLocaleString('es-AR')}</span>
          </div>
          <div class="flex items-center gap-1.5 text-white text-[13px] font-medium px-4 py-2 rounded-full whitespace-nowrap" style="background:#3778b8">
            Ver paquete
            <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  const origCards = groupTrips;
  const total = origCards.length;

  // ── Modo simple: pocos paquetes → centrar estático sin scale carousel ──
  if (total <= 3) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    track.style.transition = 'none';
    track.style.transform = 'none';
    track.style.justifyContent = 'center';
    track.style.gap = '24px';
    track.innerHTML = origCards.map(p => buildCard(p)).join('');
    // Click → ir al paquete
    track.querySelectorAll('.offer-card').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = `paquete.html?id=${el.dataset.id}`;
      });
    });
    return;
  }

  // ── Modo carrusel: 4+ paquetes ──
  if (prevBtn) prevBtn.style.display = '';
  if (nextBtn) nextBtn.style.display = '';
  track.style.justifyContent = '';
  const CARD_W = 340;
  const GAP = 20;
  const STEP = CARD_W + GAP;

  // Triple the cards for infinite illusion
  const tripled = [...origCards, ...origCards, ...origCards];
  track.innerHTML = tripled.map(p => buildCard(p)).join('');
  track.style.transition = 'none';

  const cardEls = [...track.querySelectorAll('.offer-card')];
  let idx = total; // start at the middle set

  function getOffset() {
    const vpW = viewport.offsetWidth;
    return idx * STEP - (vpW / 2 - CARD_W / 2);
  }

  function applyStyles(animated) {
    if (!animated) track.style.transition = 'none';
    else track.style.transition = 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)';
    track.style.transform = `translateX(-${getOffset()}px)`;
    cardEls.forEach((el, i) => {
      const isCenter = i === idx;
      el.style.transform = isCenter ? 'scale(1.15)' : 'scale(0.85)';
      el.style.opacity = isCenter ? '1' : '0.55';
      el.style.boxShadow = isCenter ? '0 24px 60px rgba(55,120,184,0.22)' : '0 2px 12px rgba(0,0,0,0.06)';
      el.style.zIndex = isCenter ? '10' : '1';
    });
  }

  // Initial position without animation
  requestAnimationFrame(() => { applyStyles(false); });

  function navigate(dir) {
    idx += dir;
    applyStyles(true);
    // Silent jump when near edges
    setTimeout(() => {
      if (idx >= total * 2) { idx -= total; applyStyles(false); }
      if (idx < total) { idx += total; applyStyles(false); }
    }, 460);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

  let startX = 0;
  let isDragging = false;
  let didDrag = false;
  let currentTranslate = 0;
  let dragOffset = 0;

  function handleDragStart(e) {
    isDragging = true;
    didDrag = false;
    startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    track.style.transition = 'none';
    currentTranslate = -getOffset();
  }

  function handleDragMove(e) {
    if (!isDragging) return;
    const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    dragOffset = currentX - startX;
    if (Math.abs(dragOffset) > 5) didDrag = true;
    track.style.transform = `translateX(${currentTranslate + dragOffset}px)`;
  }

  function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    if (Math.abs(dragOffset) > 40) {
      navigate(dragOffset > 0 ? -1 : 1);
    } else {
      applyStyles(true);
    }
    dragOffset = 0;
  }

  // Mouse events
  viewport.addEventListener('mousedown', handleDragStart);
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', handleDragEnd);

  // Touch events
  viewport.addEventListener('touchstart', handleDragStart, { passive: true });
  viewport.addEventListener('touchmove', handleDragMove, { passive: true });
  viewport.addEventListener('touchend', handleDragEnd);

  // Card click behavior
  cardEls.forEach((el, i) => {
    el.addEventListener('click', (e) => {
      if (didDrag) return; // Prevent click if we were dragging
      if (i === idx) {
        window.location.href = `paquete.html?id=${el.dataset.id}`;
      } else {
        idx = i;
        applyStyles(true);
        // Silent jump if needed
        setTimeout(() => {
          if (idx >= total * 2) { idx -= total; applyStyles(false); }
          if (idx < total) { idx += total; applyStyles(false); }
        }, 460);
      }
    });
  });
}

// ── Render Paquetes en Oferta (3ra sección) ──────
function renderPromoOffers() {
  const grid = document.getElementById('promoGrid');
  const actions = document.getElementById('promoActions');
  if (!grid) return;

  const sec = document.getElementById('ofertas');
  if (!offerTrips.length) {
    if (sec) sec.style.display = 'none';
    return;
  }
  if (sec) sec.style.display = '';

  if (actions) actions.style.display = 'flex';

  grid.innerHTML = offerTrips.slice(0, 6).map(p => {
    const img = p.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
    const orig = Number(p.price_original_usd) || 0;
    const price = Number(p.price_usd) || 0;
    const discount = orig > price && orig > 0 ? Math.round((1 - price / orig) * 100) : 0;
    const expiresLabel = p.expires_at ? (() => {
      const d = new Date(p.expires_at);
      if (isNaN(d)) return '';
      const diff = Math.ceil((d - Date.now()) / 86400000);
      if (diff <= 0) return '';
      if (diff === 1) return 'Termina mañana';
      if (diff <= 7) return `Termina en ${diff} días`;
      return `Hasta ${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`;
    })() : '';

    return `
      <div class="group relative rounded-[22px] overflow-hidden cursor-pointer hover:border-red-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(239,68,68,0.18)]"
        style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 20px rgba(0,0,0,0.15)"
        onclick="window.location.href='paquete.html?id=${p.id}'">
        <div class="relative overflow-hidden" style="height:220px">
          <img src="${img}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'" alt="${p.name}"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
          <div class="absolute inset-0" style="background:linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)"></div>
          ${discount > 0 ? `<span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#ef4444;color:#fff;box-shadow:0 4px 14px rgba(239,68,68,0.45)">-${discount}%</span>` : `<span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style="background:#ef4444;color:#fff;box-shadow:0 4px 14px rgba(239,68,68,0.45)">Oferta</span>`}
          <span class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 rounded-full px-3 py-1 text-[11px] font-semibold">${p.country || ''}</span>
          ${expiresLabel ? `<span class="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white rounded-full px-2.5 py-1 text-[11px] font-medium"><span class="material-symbols-outlined text-[13px]">schedule</span>${expiresLabel}</span>` : ''}
        </div>
        <div class="p-5">
          <h3 class="font-['Geomanist'] font-medium text-[17px] text-white leading-tight mb-1">${p.name}</h3>
          <p class="text-white/50 text-[13px] font-light line-clamp-2 mb-4">${p.description || ''}</p>
          <div class="flex items-end justify-between">
            <div>
              <span class="block text-white/40 text-[10px] uppercase tracking-wider font-semibold">Desde</span>
              <div class="flex items-baseline gap-2">
                ${orig > price && orig > 0 ? `<span class="text-white/40 text-[13px] line-through">USD ${orig.toLocaleString('es-AR')}</span>` : ''}
                <span class="font-['Geomanist'] font-bold text-[22px]" style="color:#f2b352">USD ${price.toLocaleString('es-AR')}</span>
              </div>
            </div>
            <span class="inline-flex items-center gap-1 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
              Ver <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Search ──────────────────────────────────────
function triggerSearch() {
  const hiddenDest = document.getElementById('searchDestHidden');
  let q = hiddenDest ? hiddenDest.value : (document.getElementById('searchDest')?.value || '');
  if (q === 'all' || q === 'Todos los destinos') q = '';

  const price = document.getElementById('searchPrice')?.value || '';

  const params = new URLSearchParams();
  if (q) params.append('country', q);
  if (price) params.append('price', price);

  window.location.href = 'busqueda.html' + (params.toString() ? '?' + params.toString() : '');
}

// ── Autocomplete ────────────────────────────────
const countryCodes = {
  'argentina': 'ar', 'brasil': 'br', 'chile': 'cl', 'uruguay': 'uy', 'perú': 'pe', 'peru': 'pe',
  'colombia': 'co', 'méxico': 'mx', 'mexico': 'mx', 'españa': 'es', 'espana': 'es', 'italia': 'it',
  'francia': 'fr', 'inglaterra': 'gb', 'reino unido': 'gb', 'alemania': 'de', 'portugal': 'pt',
  'estados unidos': 'us', 'canadá': 'ca', 'canada': 'ca', 'emiratos árabes': 'ae', 'emiratos arabes': 'ae',
  'japón': 'jp', 'japon': 'jp', 'china': 'cn', 'tailandia': 'th', 'indonesia': 'id', 'marruecos': 'ma',
  'egipto': 'eg', 'sudáfrica': 'za', 'sudafrica': 'za', 'australia': 'au', 'nueva zelanda': 'nz',
  'turquía': 'tr', 'turquia': 'tr', 'grecia': 'gr', 'suiza': 'ch', 'holanda': 'nl',
  'países bajos': 'nl', 'paises bajos': 'nl', 'india': 'in', 'vietnam': 'vn', 'maldivas': 'mv',
  'seychelles': 'sc', 'cuba': 'cu', 'república dominicana': 'do', 'republica dominicana': 'do',
  'costa rica': 'cr', 'kenya': 'ke', 'croacia': 'hr'
};

function renderAutocompleteList(q, list, input) {
  list.innerHTML = '';
  
  // Extract unique countries
  const countries = [...new Set(allPackages.map(p => p.country ? p.country.trim() : '').filter(Boolean))].sort();
  
  const matches = q
    ? countries.filter(c => c.toLowerCase().includes(q))
    : countries;

  if (!matches.length) {
    list.innerHTML = '<li class="px-4 py-3 text-slate-500 cursor-default text-center">No se encontraron destinos</li>';
    list.classList.remove('hidden');
    return;
  }

  matches.slice(0, 6).forEach(country => {
    const li = document.createElement('li');
    li.className = 'py-2 px-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-2.5 border-b border-slate-50 last:border-0';
    
    // Normalize string to match dictionary even if trailing spaces or slight variations
    const cleanCountry = country.trim().toLowerCase();
    const isoCode = countryCodes[cleanCountry];
    
    let flagHtml = '🌍';
    if (isoCode) {
      flagHtml = `<img src="https://flagcdn.com/w40/${isoCode}.png" alt="${country}" class="w-full h-auto object-contain rounded-[2px]">`;
    }
    
    li.innerHTML = `
      <div class="w-7 h-7 rounded-md bg-blue-50/50 flex items-center justify-center shrink-0 text-lg shadow-sm border border-slate-100 p-1">
        ${flagHtml}
      </div>
      <span class="text-[15px] text-slate-700 font-medium">${country}</span>
    `;
    li.addEventListener('mousedown', () => { 
      input.value = country; 
      list.classList.add('hidden'); 
    });
    list.appendChild(li);
  });

  list.classList.remove('hidden');
}

function setupAutocomplete() {
  const input = document.getElementById('searchDest');
  const list = document.getElementById('autocompleteList');
  if (!input || !list) return;
  function positionList() {
    const r = input.getBoundingClientRect();
    list.style.top = (window.scrollY + r.bottom + 6) + 'px';
    list.style.left = r.left + 'px';
    list.style.width = Math.max(r.width, 260) + 'px';
    list.style.maxWidth = (window.innerWidth - r.left - 12) + 'px';
  }
  input.addEventListener('focus', function() { positionList(); renderAutocompleteList(this.value.toLowerCase().trim(), list, input); });
  input.addEventListener('input', function() { positionList(); renderAutocompleteList(this.value.toLowerCase().trim(), list, input); });
  input.addEventListener('blur', () => { setTimeout(() => list.classList.add('hidden'), 150); });
  window.addEventListener('resize', () => { if (!list.classList.contains('hidden')) positionList(); });
}

// ── Guests Popover ──────────────────────────────
let adults = 2, children = 0;

function updateGuestsDisplay() {
  const display = document.getElementById('searchGuestsDisplay');
  if (!display) return;
  document.getElementById('searchAdults').value = adults;
  document.getElementById('searchChildren').value = children;
  document.getElementById('countAdults').textContent = adults;
  document.getElementById('countChildren').textContent = children;
  document.getElementById('btnAdultsMinus').disabled = adults <= 1;
  document.getElementById('btnChildrenMinus').disabled = children <= 0;
  let text = `${adults} Adulto${adults > 1 ? 's' : ''}`;
  if (children > 0) text += `, ${children} Niñ${children > 1 ? 'os' : 'o'}`;
  display.value = text;
}

window.updateGuests = function(type, delta) {
  if (type === 'adults') adults = Math.max(1, adults + delta);
  else children = Math.max(0, children + delta);
  updateGuestsDisplay();
};

const guestsContainer = document.getElementById('guestsContainer');
const guestsPopover = document.getElementById('guestsPopover');
if (guestsContainer && guestsPopover) {
  guestsContainer.addEventListener('click', (e) => {
    if (!e.target.closest('#guestsPopover')) guestsPopover.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    if (!guestsContainer.contains(e.target)) guestsPopover.classList.add('hidden');
  });
}

// ── Smooth Scroll ────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── Contact Form ────────────────────────────────
const mainContactForm = document.getElementById('mainContactForm');
if (mainContactForm) {
  mainContactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = mainContactForm.querySelector('button');
    const orig = btn.innerHTML;
    btn.innerHTML = 'Enviando...'; btn.disabled = true;
    setTimeout(() => {
      mainContactForm.reset();
      btn.innerHTML = orig; btn.disabled = false;
      const msgEl = document.getElementById('mainFormMsg');
      msgEl.textContent = '¡Gracias! Te contactaremos pronto.';
      msgEl.classList.remove('hidden', 'text-error');
      msgEl.classList.add('text-primary');
      setTimeout(() => msgEl.classList.add('hidden'), 5000);
    }, 1500);
  });
}



// ── FAQ Accordion ───────────────────────────────
function initFAQ() {
  const faqBtns = document.querySelectorAll('.faq-btn');
  faqBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const item = btn.closest('.faq-item');
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isOpen = item.classList.contains('active');
      
      // Close all other FAQs
      faqBtns.forEach(otherBtn => {
        const otherItem = otherBtn.closest('.faq-item');
        if (otherItem !== item && otherItem.classList.contains('active')) {
          const otherContent = otherBtn.nextElementSibling;
          const otherIcon = otherBtn.querySelector('.faq-icon');
          otherItem.classList.remove('active');
          otherContent.style.maxHeight = '0';
          otherContent.style.opacity = '0';
          if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
        }
      });
      
      // Toggle current FAQ
      if (isOpen) {
        item.classList.remove('active');
        content.style.maxHeight = '0';
        content.style.opacity = '0';
        if (icon) icon.style.transform = 'rotate(0deg)';
      } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
        content.style.opacity = '1';
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// ── Init ─────────────────────────────────────────
initFAQ();
loadPackages();
