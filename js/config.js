// ══════════════════════════════════════════════
// CONFIGURACIÓN SUPABASE — Corradi Viajes
// ══════════════════════════════════════════════
const SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44';

// ─────────────────────────────────────────────
// 🎬 VIDEOS — URLs de Supabase Storage
// Bucket: corradi-media  (público)
// Completar después de subir los archivos al bucket
// ─────────────────────────────────────────────
const SUPABASE_STORAGE = `${SUPABASE_URL}/storage/v1/object/public/corradi-media`;

const VIDEOS = {
  hero:    `${SUPABASE_STORAGE}/Video%20Project.mp4`,    // Hero principal (index)
  section: `${SUPABASE_STORAGE}/Video%20Project%201.mp4`, // Sección secundaria (index)
};

// ─────────────────────────────────────────────
// 🔌 CLIENTE SUPABASE ÚNICO + CACHÉ DE PAQUETES
// Antes cada página creaba 2 clientes (uno en la página y otro en
// components.js) y hacía 2 consultas completas con select('*').
// Con muchas visitas simultáneas eso multiplica innecesariamente los
// pedidos y podés chocar contra los límites del plan de Supabase.
// ─────────────────────────────────────────────
let _corradiDb = null;
function getDb() {
  if (_corradiDb) return _corradiDb;
  if (typeof supabase === 'undefined') return null;
  _corradiDb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _corradiDb;
}

// Columnas mínimas para los listados (sin itinerary/description largos)
const PKG_LIST_COLUMNS =
  'id,name,country,destination,category,section,days,price_usd,price_original_usd,' +
  'badge,featured,active,expires_at,sort_order,image_url,description,highlights,departure_city';

const _PKG_CACHE_KEY = 'corradi_pkgs_v1';
const _PKG_CACHE_TTL = 60 * 1000; // 60 s: alcanza para navegar el sitio sin re-consultar
let _pkgPromise = null;

// Devuelve todos los paquetes activos y NO vencidos.
// - Una sola consulta por sesión de navegación (caché en sessionStorage).
// - Si dos partes de la página piden a la vez, comparten la misma promesa.
async function fetchPackages() {
  try {
    const raw = sessionStorage.getItem(_PKG_CACHE_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && Date.now() - c.t < _PKG_CACHE_TTL && Array.isArray(c.d)) return c.d;
    }
  } catch (e) {}

  if (_pkgPromise) return _pkgPromise;

  _pkgPromise = (async () => {
    const db = getDb();
    if (!db) return [];
    const { data, error } = await db
      .from('corradi_packages')
      .select(PKG_LIST_COLUMNS)
      .eq('active', true)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('id');
    if (error) throw error;
    const now = Date.now();
    const live = (data || []).filter(p => {
      if (!p.expires_at) return true;
      const exp = new Date(p.expires_at);
      return isNaN(exp) || exp.getTime() >= now;
    });
    try { sessionStorage.setItem(_PKG_CACHE_KEY, JSON.stringify({ t: now, d: live })); } catch (e) {}
    return live;
  })();

  try { return await _pkgPromise; }
  finally { _pkgPromise = null; }
}

// ─────────────────────────────────────────────
// 🏳️ BANDERAS — diccionario ÚNICO para todo el sitio
// Antes cada página tenía su propia copia y se desincronizaban:
// "Aruba" existía en la base pero en ninguna copia, así que salía sin bandera.
// Si agregás un país nuevo en el admin, sumalo SOLO acá.
// ─────────────────────────────────────────────
const COUNTRY_FLAGS = {
  // América
  'argentina':'ar','brasil':'br','brazil':'br','chile':'cl','uruguay':'uy','paraguay':'py',
  'bolivia':'bo','perú':'pe','peru':'pe','colombia':'co','ecuador':'ec','venezuela':'ve',
  'méxico':'mx','mexico':'mx','cuba':'cu','jamaica':'jm','aruba':'aw','curazao':'cw',
  'antillas holandesas':'cw','bahamas':'bs','barbados':'bb',
  'república dominicana':'do','republica dominicana':'do','rep. dominicana':'do',
  'costa rica':'cr','panamá':'pa','panama':'pa','guatemala':'gt','honduras':'hn',
  'nicaragua':'ni','el salvador':'sv','belice':'bz','puerto rico':'pr',
  'estados unidos':'us','usa':'us','eeuu':'us','canadá':'ca','canada':'ca',
  // Europa
  'españa':'es','espana':'es','francia':'fr','italia':'it','portugal':'pt','grecia':'gr',
  'alemania':'de','suiza':'ch','austria':'at','bélgica':'be','belgica':'be',
  'holanda':'nl','países bajos':'nl','paises bajos':'nl',
  'reino unido':'gb','inglaterra':'gb','escocia':'gb','irlanda':'ie',
  'croacia':'hr','eslovenia':'si','hungría':'hu','hungria':'hu','polonia':'pl',
  'rep. checa':'cz','república checa':'cz','republica checa':'cz','chequia':'cz',
  'noruega':'no','suecia':'se','dinamarca':'dk','finlandia':'fi','islandia':'is',
  'rusia':'ru','turquía':'tr','turquia':'tr','malta':'mt','chipre':'cy',
  // África / Medio Oriente
  'egipto':'eg','marruecos':'ma','túnez':'tn','tunez':'tn','sudáfrica':'za','sudafrica':'za',
  'kenia':'ke','kenya':'ke','tanzania':'tz','namibia':'na','botsuana':'bw',
  'israel':'il','jordania':'jo','emiratos árabes':'ae','emiratos arabes':'ae',
  'emiratos árabes unidos':'ae','emiratos arabes unidos':'ae','dubai':'ae','qatar':'qa',
  // Asia / Oceanía
  'japón':'jp','japon':'jp','china':'cn','hong kong':'hk','corea del sur':'kr',
  'tailandia':'th','vietnam':'vn','camboya':'kh','cambodia':'kh','laos':'la',
  'indonesia':'id','malasia':'my','singapur':'sg','filipinas':'ph',
  'india':'in','nepal':'np','sri lanka':'lk','maldivas':'mv',
  'australia':'au','nueva zelanda':'nz','polinesia francesa':'pf','fiji':'fj'
};

// Código ISO del país (o null si no está en el diccionario)
function countryIso(country) {
  return COUNTRY_FLAGS[(country || '').trim().toLowerCase()] || null;
}
// URL de la bandera. width: 20 | 40 | 80 | 160 | 320 | 640
function countryFlagUrl(country, width) {
  const iso = countryIso(country);
  return iso ? `https://flagcdn.com/w${width || 40}/${iso}.png` : null;
}
// <img> de la bandera, o un ícono genérico de globo si el país no está mapeado
function countryFlagImg(country, opts) {
  const o = opts || {};
  const url = countryFlagUrl(country, o.width || 40);
  const cls = o.className || '';
  const style = o.style || 'width:20px;height:15px;object-fit:cover;border-radius:3px;flex-shrink:0;box-shadow:0 0 0 1px rgba(0,0,0,.12) inset';
  if (url) return `<img src="${url}" alt="${country || ''}" class="${cls}" style="${style}" loading="lazy">`;
  return `<span class="material-symbols-outlined ${cls}" style="font-size:16px;opacity:.45;flex-shrink:0">public</span>`;
}

// ─────────────────────────────────────────────
// 📱 NÚMERO DE WHATSAPP — actualizar con el real
// Formato: código país + área + número sin guiones
// ─────────────────────────────────────────────
const WHATSAPP_NUMBER = '5493416057588';

// whatsappLink(target?, kind?)
//   target: nombre del paquete o tema (ej. "Egipto Crucero Nilo" o "Salidas Grupales")
//   kind:   'package' (default si hay target) | 'topic' | 'general'
function whatsappLink(target, kind) {
  if (!target) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola Corradi 👋 Quisiera recibir información sobre un viaje. ¡Gracias!')}`;
  }
  const isTopic = kind === 'topic';
  const msg = isTopic
    ? `Hola Corradi 👋 Quisiera recibir información sobre *${target}*. ¡Gracias!`
    : `Hola Corradi 👋 Me interesa el paquete *${target}*. ¿Me pasan más info? ¡Gracias!`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─────────────────────────────────────────────
// 💬 BOTÓN FLOTANTE WHATSAPP — se inyecta en todas las páginas
// Llamar setWAFabPackage('Nombre') para personalizar el mensaje
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #waFab {
      position:fixed; bottom:15px; right:12px; z-index:500;
      width:58px; height:58px; border-radius:50%;
      background:#25D366; color:#fff;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 20px rgba(37,211,102,0.5);
      transition:transform .2s, box-shadow .2s;
      text-decoration:none;
      animation: waPulse 2.5s ease-in-out infinite;
    }
    #waFab:hover {
      transform:scale(1.1);
      box-shadow:0 8px 30px rgba(37,211,102,0.7);
      animation:none;
    }
    @media(min-width:768px){ #waFab { bottom:28px; right:28px; } }
    @keyframes waPulse {
      0%,100%{ box-shadow:0 4px 20px rgba(37,211,102,0.5); }
      50%{ box-shadow:0 4px 30px rgba(37,211,102,0.85), 0 0 0 10px rgba(37,211,102,0.12); }
    }
    .waFab-tooltip {
      position:absolute; right:calc(100% + 14px); top:50%;
      transform:translateY(-50%);
      background:#ffffff; color:#475569;
      font-family:'Geomanist',sans-serif;
      font-size:13px; font-weight:500;
      white-space:nowrap; padding:6px 14px;
      border-radius:20px; opacity:1; pointer-events:none;
      box-shadow:0 4px 14px rgba(0,0,0,0.08);
      border: 1px solid #f8fafc;
    }
    .waFab-tooltip::after {
      content:''; position:absolute;
      left:100%; top:50%; transform:translateY(-50%);
      border:5px solid transparent; border-left-color:#ffffff;
    }
    /* En mobile el globito tapa contenido: solo el ícono */
    @media(max-width:767px){ .waFab-tooltip { display:none; } }
  `;
  document.head.appendChild(style);

  // Inject button
  const fab = document.createElement('a');
  fab.id = 'waFab';
  fab.href = whatsappLink();
  fab.target = '_blank';
  fab.rel = 'noopener';
  fab.setAttribute('aria-label', 'Contactar por WhatsApp');
  fab.innerHTML = `
    <span class="waFab-tooltip" id="waFabLabel">¿Tenés una consulta?</span>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.556 4.122 1.528 5.855L.057 23.882a.75.75 0 0 0 .923.923l6.042-1.464A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.524-5.225-1.435l-.374-.223-3.878.94.965-3.87-.245-.385A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>`;
  document.body.appendChild(fab);

  // ── Inyectar URLs de video desde Supabase Storage ──
  document.querySelectorAll('source[data-src]').forEach(source => {
    const key = source.dataset.src;
    if (typeof VIDEOS !== 'undefined' && VIDEOS[key]) {
      source.src = VIDEOS[key];
      // re-trigger video load
      if (source.parentElement && typeof source.parentElement.load === 'function') {
        source.parentElement.load();
      }
    }
  });

  // ── Reproducción robusta de videos autoplay ──
  // Arranca apenas puede reproducir y reintenta (evita el "congelado hasta scrollear")
  document.querySelectorAll('video[autoplay]').forEach(v => {
    v.muted = true;
    v.setAttribute('muted', '');
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    tryPlay();
    ['loadedmetadata', 'loadeddata', 'canplay'].forEach(ev => v.addEventListener(ev, tryPlay));
    // Reintento cuando la pestaña vuelve a estar visible o al primer toque/scroll
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tryPlay(); });
    window.addEventListener('scroll', tryPlay, { once: true, passive: true });
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
  });
});

// Personalizar el FAB con el nombre del paquete (llamar desde paquete.js)
function setWAFabPackage(packageName) {
  const fab = document.getElementById('waFab');
  if (fab) {
    fab.href = whatsappLink(packageName);
    const label = document.getElementById('waFabLabel');
    if (label) label.textContent = `Consultar este viaje`;
  }
}
