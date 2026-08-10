// ══════════════════════════════════════════════════════════
// Portal de Pasajeros — Corradi Viajes
// ══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co';
// Publishable key nueva. Las legacy (anon/service_role) se desactivaron el 2026-08-07
// en este project y devuelven 401 "Legacy API keys are disabled".
const SUPABASE_ANON_KEY = 'sb_publishable_qqTTCyfpaM3SIM15AH_O8Q_fPoHatiI';
const BUCKET = 'pv-docs';
// Categorías de documentos. El admin carga todo lo del viaje (voucher, vuelos, etc.)
const CATS = ['Voucher', 'Vuelos', 'Hotel', 'Seguro', 'Itinerario', 'Info del destino', 'Pasaporte', 'DNI', 'Visa', 'Otro'];
// Checklist del viaje: qué documentación tiene que tener cargada el pasajero
const REQ_CATS = CATS.filter(c => c !== 'Otro');
const IMG_BUCKET = 'corradi-images';   // bucket público (imágenes de viaje)
// País → código ISO para la bandera
const COUNTRY_ISO = { 'argentina': 'ar', 'brasil': 'br', 'brazil': 'br', 'chile': 'cl', 'uruguay': 'uy', 'paraguay': 'py', 'perú': 'pe', 'peru': 'pe', 'bolivia': 'bo', 'colombia': 'co', 'ecuador': 'ec', 'venezuela': 've', 'méxico': 'mx', 'mexico': 'mx', 'estados unidos': 'us', 'usa': 'us', 'canadá': 'ca', 'canada': 'ca', 'españa': 'es', 'espana': 'es', 'italia': 'it', 'francia': 'fr', 'portugal': 'pt', 'alemania': 'de', 'reino unido': 'gb', 'inglaterra': 'gb', 'países bajos': 'nl', 'paises bajos': 'nl', 'holanda': 'nl', 'suiza': 'ch', 'grecia': 'gr', 'croacia': 'hr', 'turquía': 'tr', 'turquia': 'tr', 'egipto': 'eg', 'marruecos': 'ma', 'sudáfrica': 'za', 'sudafrica': 'za', 'emiratos árabes unidos': 'ae', 'emiratos arabes unidos': 'ae', 'tailandia': 'th', 'japón': 'jp', 'japon': 'jp', 'china': 'cn', 'india': 'in', 'indonesia': 'id', 'vietnam': 'vn', 'australia': 'au', 'nueva zelanda': 'nz', 'cuba': 'cu', 'república dominicana': 'do', 'republica dominicana': 'do', 'panamá': 'pa', 'panama': 'pa', 'costa rica': 'cr', 'aruba': 'aw' };
function flagUrl(country) { const iso = COUNTRY_ISO[(country || '').trim().toLowerCase()]; return iso ? `https://flagcdn.com/w640/${iso}.png` : null; }
// Imagen del viaje: la cargada, o la bandera del país, o null
function tripImg(t) { return t.image_url || flagUrl(t.country) || null; }
// ¿El banner es una bandera de fallback? Una bandera recortada con object-fit:cover
// queda espantosa (el escudo cortado por la mitad), así que se muestra entera.
function tripImgIsFlag(t) { return !t.image_url && !!flagUrl(t.country); }
function tripBannerImgStyle(t) {
  return tripImgIsFlag(t)
    ? 'width:100%;height:100%;object-fit:contain;padding:18px'
    : 'width:100%;height:100%;object-fit:cover';
}
function tripThumb(t, size) {
  const u = tripImg(t), s = size || 44;
  if (u) return `<img src="${esc(u)}" alt="" style="width:${s}px;height:${s}px;border-radius:12px;object-fit:cover;flex-shrink:0" onerror="this.outerHTML='<div class=\\'avatar\\' style=\\'background:rgba(242,179,82,.15);color:var(--gold)\\'><span class=\\'ms\\'>luggage</span></div>'">`;
  return `<div class="avatar" style="background:rgba(242,179,82,.15);color:var(--gold)"><span class="ms">luggage</span></div>`;
}
// Países frecuentes para autocompletar
const COUNTRIES = ['Argentina', 'Brasil', 'Chile', 'Uruguay', 'Paraguay', 'Perú', 'Bolivia', 'Colombia', 'Ecuador', 'Venezuela', 'México', 'Estados Unidos', 'Canadá', 'España', 'Italia', 'Francia', 'Portugal', 'Alemania', 'Reino Unido', 'Países Bajos', 'Suiza', 'Grecia', 'Croacia', 'Turquía', 'Egipto', 'Marruecos', 'Sudáfrica', 'Emiratos Árabes Unidos', 'Tailandia', 'Japón', 'China', 'India', 'Indonesia', 'Vietnam', 'Australia', 'Nueva Zelanda', 'Cuba', 'República Dominicana', 'Panamá', 'Costa Rica', 'Aruba'];

const { createClient } = supabase;
// Sesión compartida con el admin de paquetes (/admin) → un solo login para todo (SSO)
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

let me = null;                 // perfil logueado
let A = {};                    // cache de datos admin

// ── Helpers ──────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '' + Math.floor(Math.random() * 1e6));
const safeName = n => (n || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function fmtDate(d) { if (!d) return ''; const x = new Date(d + 'T00:00:00'); if (isNaN(x)) return ''; return x.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function daysUntil(d) { if (!d) return null; const x = new Date(d + 'T00:00:00'); if (isNaN(x)) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.ceil((x - t) / 86400000); }

let _toastT;
function toast(msg, type) {
  const el = $('toast'); el.textContent = msg; el.className = 'show ' + (type || '');
  clearTimeout(_toastT); _toastT = setTimeout(() => el.className = el.className.replace('show', ''), 3200);
}
// ══════════════════════════════════════════════════════════
//  MODALES + HISTORIAL ("volver")
// ══════════════════════════════════════════════════════════
// Antes cada modal era un callejón sin salida: desde un viaje entrabas a un
// pasajero y la única salida era cerrar todo y volver a empezar. Ahora se
// guarda qué vista abrió cada modal para poder rehacerla.
//
// Se registra la LLAMADA (función + argumentos), no el HTML, así al volver la
// vista se vuelve a dibujar con los datos frescos (si borraste un documento,
// al volver ya no está).

let _modalHist = [];      // [{ name:'openTripDetail', args:[12] }, …]
let _modalStates = 0;     // entradas que metimos en el historial del navegador
let _navBack = false;     // true mientras volvemos: no re-apilar ni re-pushear

function openModal(html, wide) {
  $('modalRoot').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal ${wide ? 'wide' : ''}">${html}</div></div>`;
  // El banner de "Instalá la app" quedaba flotando por encima de los botones
  // del modal, y el fondo seguía scrolleando detrás.
  document.body.classList.add('modal-open');
  _injectBackBtn();
  if (!_navBack) {
    try { history.pushState({ pvModal: 1 }, ''); _modalStates++; } catch (e) {}
  }
  hydrateThumbs();
}

function closeModal() {
  $('modalRoot').innerHTML = '';
  document.body.classList.remove('modal-open');
  _modalHist = [];
  const n = _modalStates;
  _modalStates = 0;
  // Devolvemos al navegador las entradas que metimos, para no dejarle al
  // usuario que apretar "atrás" cinco veces para salir del portal.
  if (n > 0) {
    _navBack = true;
    try { history.go(-n); } catch (e) {}
    setTimeout(() => { _navBack = false; }, 120);
  }
}

// Vuelve una vista atrás. Si no hay a dónde volver, cierra.
function modalBack() {
  _modalHist.pop();                  // la vista actual
  const prev = _modalHist.pop();     // la anterior (el wrapper la reinserta)
  if (!prev) { closeModal(); return; }
  const fn = window[prev.name];
  if (typeof fn !== 'function') { closeModal(); return; }
  fn.apply(null, prev.args);
}

// Flecha de volver en el encabezado, solo si hay a dónde volver.
function _injectBackBtn() {
  if (_modalHist.length < 2) return;
  const h = document.querySelector('#modalRoot .modal-h');
  if (!h || h.querySelector('.modal-back')) return;
  const b = document.createElement('button');
  b.className = 'btn btn-icon btn-ghost modal-back';
  b.type = 'button';
  b.title = 'Volver';
  b.setAttribute('aria-label', 'Volver');
  b.innerHTML = '<span class="ms">arrow_back</span>';
  b.addEventListener('click', modalBack);
  h.insertBefore(b, h.firstChild);
}

// Las vistas que forman parte de la navegación. Se envuelven para que cada
// una se anote sola en el historial, sin tocar los cientos de onclick que ya
// existen en el HTML.
const _MODAL_VIEWS = [
  'openPassengerDetail', 'openTripDetail', 'openEditPassenger', 'openNewPassenger',
  'openNewTrip', 'openEditDest', 'openUploadForPax', 'openAttachLibrary',
  'openUploadTripDoc', 'openUploadPaxDoc', 'openAssignPax', 'openQuickNewPassenger',
  'openAttachTripLib', 'openPastTripModal', 'openPassengerUploadModal',
];

function _wrapModalViews() {
  _MODAL_VIEWS.forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function' || orig._histWrapped) return;
    const wrapped = function () {
      const args = Array.prototype.slice.call(arguments);
      if (!_navBack) {
        const top = _modalHist[_modalHist.length - 1];
        // Volver a dibujar la MISMA vista (después de guardar, de borrar un
        // documento) no es navegar: si no, "volver" te dejaría en el mismo lugar.
        const igual = top && top.name === name &&
          JSON.stringify(top.args) === JSON.stringify(args);
        if (!igual) _modalHist.push({ name: name, args: args });
        if (_modalHist.length > 25) _modalHist.shift();   // tope de seguridad
      }
      return orig.apply(this, args);
    };
    wrapped._histWrapped = true;
    window[name] = wrapped;
  });
}

// El botón "atrás" del celular (y el gesto de deslizar) tienen que volver una
// vista, no sacarte del portal en la mitad de una carga.
window.addEventListener('popstate', function () {
  if (_navBack) return;
  if (!$('modalRoot').innerHTML) return;
  _modalStates = Math.max(0, _modalStates - 1);   // el navegador ya consumió una
  _navBack = true;
  modalBack();
  _navBack = false;
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (!$('modalRoot').innerHTML) return;
  modalBack();
});

// ── Miniaturas y previsualización de documentos ──
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
const extOf = n => ((n || '').split('.').pop() || '').toLowerCase();
const kindOf = n => { const e = extOf(n); return IMG_EXT.includes(e) ? 'img' : e === 'pdf' ? 'pdf' : 'file'; };
function thumbBox(path, name) {
  const k = kindOf(name || path);
  const ic = k === 'pdf' ? 'picture_as_pdf' : k === 'img' ? 'image' : 'description';
  return `<div class="thumb ${k}" data-thumb="${esc(path)}" data-kind="${k}"><span class="ms">${ic}</span></div>`;
}
// Firma las URLs de los archivos visibles y pinta la miniatura (imagen o primera página del PDF)
async function hydrateThumbs() {
  const els = [...document.querySelectorAll('[data-thumb]:not([data-done])')].filter(e => e.dataset.kind !== 'file');
  if (!els.length) return;
  els.forEach(e => e.dataset.done = '1');
  const paths = [...new Set(els.map(e => e.dataset.thumb))];
  const { data } = await db.storage.from(BUCKET).createSignedUrls(paths, 3600);
  const map = {}; (data || []).forEach(d => { if (d.signedUrl) map[d.path] = d.signedUrl; });
  els.forEach(el => {
    const url = map[el.dataset.thumb]; if (!url) return;
    if (el.dataset.kind === 'img') { el.innerHTML = `<img src="${url}" alt="" onerror="this.remove()">`; el.classList.add('ok'); }
    else if (el.dataset.kind === 'pdf') pdfThumb(url, el);
  });
}
async function pdfThumb(url, el) {
  if (!window.pdfjsLib) return;
  try {
    const pdf = await pdfjsLib.getDocument({ url }).promise;
    const page = await pdf.getPage(1);
    const v1 = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 160 / v1.width });
    const c = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    el.innerHTML = ''; el.appendChild(c); el.classList.add('ok');
  } catch (e) { /* si falla, queda el ícono */ }
}
async function openPreview(path, title) {
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) { toast('No se pudo abrir el documento', 'err'); return; }
  const url = data.signedUrl, k = kindOf(path);
  const body = k === 'img' ? `<img src="${url}" alt="" style="max-width:100%;border-radius:12px;display:block;margin:0 auto">`
    : k === 'pdf' ? `<iframe src="${url}" style="width:100%;height:66vh;border:0;border-radius:12px;background:#fff"></iframe>`
      : `<div class="empty"><span class="ms">description</span>Este tipo de archivo no se previsualiza.<br>Abrilo para descargarlo.</div>`;
  $('previewRoot').innerHTML = `<div class="modal-bg" style="z-index:300" onclick="if(event.target===this)closePreview()">
    <div class="modal wide">
      <div class="modal-h"><h3 style="flex:1">${esc(title || 'Documento')}</h3>
        <a class="btn btn-ghost btn-sm" href="${url}" target="_blank" rel="noopener"><span class="ms">open_in_new</span>Abrir</a>
        <button class="btn btn-icon btn-ghost" onclick="closePreview()"><span class="ms">close</span></button></div>
      <div class="modal-b">${body}</div>
    </div></div>`;
}
function closePreview() { $('previewRoot').innerHTML = ''; }

function loginErr(m) { $('loginErr').textContent = m || ''; }
function showAdminLogin() { $('paxLogin').classList.add('hidden'); $('adminLogin').classList.remove('hidden'); $('loginSub').textContent = 'Acceso para administradores de Corradi'; loginErr(''); }
function showPaxLogin() { $('adminLogin').classList.add('hidden'); $('paxLogin').classList.remove('hidden'); $('loginSub').textContent = 'Ingresá con tu DNI para ver tu viaje'; loginErr(''); }
function showLogin() { $('appAdmin').classList.add('hidden'); $('appPassenger').classList.add('hidden'); $('loginScreen').classList.remove('hidden'); }

// ── Auth ─────────────────────────────────────────
async function init() {
  const { data: { session } } = await db.auth.getSession();
  if (session) await afterLogin(); else showLogin();
}
async function afterLogin() {
  closeModal();
  const { data: { user } } = await db.auth.getUser();
  if (!user) { showLogin(); return; }
  const { data: prof } = await db.from('pv_profiles').select('*').eq('id', user.id).maybeSingle();
  if (!prof) { await db.auth.signOut(); showLogin(); loginErr('Este usuario no está habilitado en el portal.'); return; }
  me = prof;
  $('loginScreen').classList.add('hidden');
  if (prof.role === 'admin') startAdmin(); else startPassenger();
}
async function loginPassenger() {
  const dni = $('dniInput').value.trim();
  if (!/^\d{5,}$/.test(dni)) { loginErr('Ingresá un DNI válido (solo números).'); return; }
  loginErr('Ingresando…');
  // El login está desacoplado del DNI: buscamos las credenciales internas del pasajero.
  // Así Corradi puede corregir el DNI sin romperle la cuenta.
  const { data, error: rErr } = await db.rpc('pv_login', { p_dni: dni });
  const cred = data && data[0];
  if (rErr || !cred) { loginErr('DNI incorrecto o todavía no registrado. Consultá con Corradi.'); return; }
  const { error } = await db.auth.signInWithPassword({ email: cred.email, password: cred.pw });
  if (error) { loginErr('No pudimos ingresar. Consultá con Corradi.'); return; }
  loginErr(''); await afterLogin();
}
async function loginAdmin() {
  let email = $('admEmail').value.trim(); const pass = $('admPass').value;
  if (email && !email.includes('@')) email = email.toLowerCase() + '@corradiviajes.com.ar';  // alias 'admin'
  if (!email || !pass) { loginErr('Completá email y contraseña.'); return; }
  loginErr('Ingresando…');
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { loginErr('Email o contraseña incorrectos.'); return; }
  loginErr(''); await afterLogin();
}
async function logout() { closeModal(); await db.auth.signOut(); me = null; A = {}; showLogin(); showPaxLogin(); $('dniInput').value = ''; $('admPass').value = ''; }

// ── Documentos: subir / abrir / borrar ───────────
async function openDoc(file_path) {
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(file_path, 3600);
  if (error || !data) { toast('No se pudo abrir el documento', 'err'); return; }
  window.open(data.signedUrl, '_blank');
}
async function uploadFileTo(folder, file) {
  const path = `${folder}/${rid()}_${safeName(file.name)}`;
  const { error } = await db.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

// ══════════════════════════════════════════════════════════
//  PASAJERO
// ══════════════════════════════════════════════════════════
async function startPassenger() {
  $('appPassenger').classList.remove('hidden'); $('appAdmin').classList.add('hidden');
  $('paxName').textContent = me.full_name || 'Mi cuenta';
  await renderPassenger();
  if (typeof switchPaxTab === 'function') switchPaxTab('next');
}

function openPastTripModal(title, date, duration, hotel, img) {
  openModal(`
    <div class="modal-h">
      <h3 style="flex:1;color:#0f172a;font-weight:800">${esc(title)}</h3>
      <button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button>
    </div>
    <div class="modal-b" style="padding-top:0">
      ${img ? `<div style="height:200px;margin:0 -22px 18px;overflow:hidden"><img src="${esc(img)}" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span class="chip chip-green">Viaje Realizado</span>
        <span style="font-size:13.5px;color:#475569;font-weight:600">${esc(date)} (${esc(duration)})</span>
      </div>
      
      <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:14px;padding:16px;margin-bottom:16px">
        <div style="font-weight:800;font-size:14px;color:#0f172a;margin-bottom:6px">🏨 Alojamiento de la Estadía</div>
        <div style="font-size:13.5px;color:#334155;font-weight:600">${esc(hotel)}</div>
      </div>

      <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;padding:16px;margin-bottom:20px">
        <div style="font-weight:800;font-size:14px;color:#0052cc;margin-bottom:4px">🌟 Recuerdos & Resumen</div>
        <div style="font-size:13.5px;color:#1e40af;line-height:1.5">Un viaje inolvidable coordinado y gestionado por Corradi Viajes. Incluyó vuelos, traslados privados, vouchers y asistencia médica las 24 hs.</div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <a href="https://wa.me/5493416057588?text=${encodeURIComponent('Hola Corradi! Quería volver a cotizar un viaje similar a: ' + title)}" target="_blank" class="btn btn-primary" style="border-radius:50px">
          <i class="ri-whatsapp-line"></i> Volver a Cotizar por WhatsApp
        </a>
      </div>
    </div>
  `, true);
}
let P = { trips: [], docs: [], reqs: [], dests: [] };   // cache del pasajero
async function renderPassenger() {
  const [{ data: trips }, { data: docs }, { data: reqs }, { data: dests }] = await Promise.all([
    db.from('pv_trips').select('*').order('depart_date', { nullsFirst: false }),
    db.from('pv_documents').select('*').order('created_at', { ascending: false }),
    db.from('pv_required_docs').select('*'),
    db.from('pv_destinations').select('*'),
  ]);
  P = { trips: trips || [], docs: docs || [], reqs: reqs || [], dests: dests || [] };
  const T = P.trips, D = P.docs, R = P.reqs;
  const myCats = new Set(D.map(d => d.category));

  // Alertas
  let alerts = '';
  T.forEach(t => {
    const du = daysUntil(t.depart_date);
    if (du !== null && du >= 0 && du <= 10) {
      alerts += `<div class="alert alert-warn"><span class="ms">flight_takeoff</span><div><div class="at">Tu viaje a ${esc(t.destination || t.title)} ${du === 0 ? 'sale hoy' : du === 1 ? 'sale mañana' : 'sale en ' + du + ' días'}</div><div class="as">Revisá que tengas toda la documentación a mano.</div></div></div>`;
    }
  });
  const reqCats = [...new Set(R.map(r => r.category))];
  const missing = reqCats.filter(c => !myCats.has(c));
  if (missing.length) {
    alerts += `<div class="alert alert-red"><span class="ms">description</span><div><div class="at">Documentación pendiente</div><div class="as">Todavía falta: ${missing.map(esc).join(' · ')}. Corradi la va a cargar acá.</div></div></div>`;
  }
  $('paxAlerts').innerHTML = alerts;

  // Contenido
  let html = '';
  if (!T.length) {
    html += `<div class="empty"><span class="ms">luggage</span>Todavía no tenés viajes cargados.<br>Corradi te los va a asignar cuando esté todo listo.</div>`;
  }
  T.forEach(t => {
    const du = daysUntil(t.depart_date);
    const badge = (du !== null && du >= 0 && du <= 10) ? `<span class="chip chip-gold">${du === 0 ? 'Sale hoy' : du === 1 ? 'Mañana' : 'En ' + du + ' días'}</span>` : '';
    const nd = D.filter(d => d.trip_id === t.id).length;
    const bimg = tripImg(t);
    html += `<div class="card click" onclick="openPaxTrip(${t.id})" style="overflow:hidden;margin-bottom:16px;cursor:pointer">
      ${bimg ? `<div style="height:170px;background:${tripImgIsFlag(t) ? '#0f1e34' : '#0a1525'};position:relative"><img src="${esc(bimg)}" alt="" style="${tripBannerImgStyle(t)}" onerror="this.parentElement.remove()">${tripImgIsFlag(t) ? '' : '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,18,32,0) 45%,rgba(8,18,32,.85) 100%)"></div>'}</div>` : ''}
      <div style="padding:18px 20px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:17px">${esc(t.title)}</div>
            <div class="sub-mut">${esc(t.destination || '')}${t.country ? ' · ' + esc(t.country) : ''}${t.depart_date ? ' · ' + fmtDate(t.depart_date) + (t.return_date ? ' → ' + fmtDate(t.return_date) : '') : ''}</div></div>
          ${badge}
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap">
          <span class="chip chip-blue"><span class="ms" style="font-size:15px">description</span>&nbsp;${nd} documento${nd === 1 ? '' : 's'}</span>
          ${destOfTrip(t) ? `<span class="chip chip-gold"><span class="ms" style="font-size:15px">travel_explore</span>&nbsp;Guía del destino</span>` : ''}
          <div style="flex:1"></div>
          <span class="btn btn-ghost btn-sm">Ver mi viaje<span class="ms">chevron_right</span></span>
        </div>
      </div>
    </div>`;
  });

  const general = D.filter(d => !d.trip_id);
  if (general.length) {
    html += `<div class="section-t">Otros documentos</div><div class="rowlist">${general.map(docRow).join('')}</div>`;
  }
  $('paxContent').innerHTML = html;

  // Render Bóveda de Documentación
  const docsContainer = $('paxDocsList');
  if (docsContainer) {
    if (D.length) {
      docsContainer.innerHTML = D.map(docRow).join('');
    } else {
      docsContainer.innerHTML = `
        <div class="empty" style="padding:24px;text-align:center">
          <span class="ms" style="font-size:36px;color:#0052cc;display:block;margin-bottom:8px">cloud_upload</span>
          <div style="font-weight:700;font-size:15px;color:#0f172a">Todavía no tenés documentos cargados</div>
          <div class="sub-mut" style="margin-top:4px;margin-bottom:16px;color:#475569">Tocá en 'Subir Mi Documento' para enviar tu Pasaporte, DNI o comprobante.</div>
          <button class="btn btn-primary btn-sm" onclick="openPassengerUploadModal()" style="border-radius:10px">
            <i class="ri-upload-cloud-2-line"></i> Cargar mi primer documento
          </button>
        </div>`;
    }
  }
  hydrateThumbs();
}

function openPassengerUploadModal() {
  openModal(`
    <div class="modal-h">
      <h3 style="color:#0f172a;font-weight:800">📤 Subir Documentación de Viaje</h3>
      <button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button>
    </div>
    <div class="modal-b">
      <p class="sub-mut" style="margin-bottom:16px;color:#475569">Cargá fotos o archivos PDF de tus documentos para que el equipo de Corradi los revise y confirme.</p>

      <div class="fg">
        <label class="fl">Tipo de Documento *</label>
        <select id="paxDocCat" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a;font-weight:600">
          <option value="Pasaporte">🛂 Foto / Copia de Pasaporte</option>
          <option value="DNI">🪪 DNI (Frente / Dorso)</option>
          <option value="Voucher">🎟️ Voucher / Pasaje de Vuelo</option>
          <option value="Seguro">🛡️ Seguro de Viaje / Asistencia Médica</option>
          <option value="Visa">📄 Visa / Permiso de Ingreso</option>
          <option value="Otro">📁 Otro documento</option>
        </select>
      </div>

      <div class="fg">
        <label class="fl">Título o Nombre del Archivo *</label>
        <input id="paxDocTitle" placeholder="Ej: Mi Pasaporte Vigente" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a;font-weight:600">
      </div>

      <div class="fg">
        <label class="fl">Seleccionar Archivo (PDF, JPG, PNG) *</label>
        <input type="file" id="paxDocFile" accept=".pdf,.jpg,.jpeg,.png,.webp" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a">
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="paxUpBtn" onclick="doPassengerUploadDoc()">Cargar Documento</button>
    </div>
  `, true);
}

async function doPassengerUploadDoc() {
  const title = $('paxDocTitle').value.trim(), cat = $('paxDocCat').value;
  const file = $('paxDocFile').files[0];

  if (!title) { toast('Ingresá un título para el documento', 'err'); return; }
  if (!file) { toast('Seleccioná un archivo para subir', 'err'); return; }

  const btn = $('paxUpBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const path = await uploadFileTo(`passengers/${me.id}`, file);
    const firstTrip = P.trips[0] ? P.trips[0].id : null;

    const { error } = await db.from('pv_documents').insert({
      passenger_id: me.id,
      trip_id: firstTrip,
      title: title,
      category: cat,
      file_path: path,
      file_name: file.name,
      source: 'passenger',
      uploaded_by: me.id
    });
    if (error) throw error;

    closeModal();
    toast('¡Documento cargado correctamente! ✓', 'ok');
    await renderPassenger();
    if (typeof switchPaxTab === 'function') switchPaxTab('docs');
  } catch (e) {
    toast('Error al subir: ' + (e.message || e), 'err');
    btn.disabled = false;
    btn.textContent = 'Cargar Documento';
  }
}
// Vista completa del viaje para el pasajero: documentación + guía del destino
function openPaxTrip(tid) {
  const t = P.trips.find(x => x.id === tid); if (!t) return;
  const tdocs = P.docs.filter(d => d.trip_id === tid);
  const du = daysUntil(t.depart_date), bimg = tripImg(t), dest = destOfTrip(t);
  openModal(`<div class="modal-h"><h3 style="flex:1">${esc(t.title)}</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b" style="padding-top:16px">
    ${bimg ? `<div style="height:200px;margin-bottom:18px;border-radius:16px;overflow:hidden;background:#f8fafc;border:1px solid #e2e8f0"><img src="${esc(bimg)}" alt="" style="${tripBannerImgStyle(t)}" onerror="this.parentElement.remove()"></div>` : '<div style="height:10px"></div>'}
    <div style="font-size:16px;font-weight:800;color:#0f172a">${esc(t.destination || '')}${t.country ? ' · ' + esc(t.country) : ''}</div>
    <div class="sub-mut" style="margin-top:4px">${t.depart_date ? 'Salís el ' + fmtDate(t.depart_date) : 'Fecha a confirmar'}${t.return_date ? ' · volvés el ' + fmtDate(t.return_date) : ''}${du !== null && du >= 0 && du <= 10 ? ` · <b style="color:#d97706">${du === 0 ? 'sale hoy' : du === 1 ? 'sale mañana' : 'faltan ' + du + ' días'}</b>` : ''}</div>
    ${t.notes ? `<p class="sub-mut" style="margin-top:12px;white-space:pre-wrap;color:#334155">${esc(t.notes)}</p>` : ''}
    <div class="section-t">Tu documentación (${tdocs.length})</div>
    ${tdocs.length ? `<div class="rowlist">${tdocs.map(docRow).join('')}</div>` : `<p class="sub-mut" style="font-size:13.5px">Todavía no hay documentos cargados. Corradi los va a subir acá.</p>`}
    ${dest ? destInfoHtml(dest, t) : `<div class="section-t">Sobre el destino</div><p class="sub-mut" style="font-size:13.5px">Corradi está preparando la guía de este destino.</p>`}
  </div>`, true);
}
function docRow(d) {
  return `<div class="doc click" style="cursor:pointer" onclick='openPreview(${JSON.stringify(d.file_path)}, ${JSON.stringify(d.title || '')})'>
    ${thumbBox(d.file_path, d.file_name || d.file_path)}
    <div class="info"><div class="t">${esc(d.title)}</div><div class="s">${esc(d.category || 'Documento')}</div></div>
    <button class="btn btn-ghost btn-sm"><span class="ms">visibility</span>Ver</button>
    ${me.role === 'admin' ? `<button class="btn btn-icon btn-danger" title="Borrar" onclick='event.stopPropagation();deleteDocById(${d.id}, ${JSON.stringify(d.file_path)}, "${d.source}")'><span class="ms">delete</span></button>` : ''}</div>`;
}
async function deleteDocById(id, file_path, source) {
  if (!confirm('¿Borrar este documento?')) return;
  await db.from('pv_documents').delete().eq('id', id);
  if (source !== 'library') { await db.storage.from(BUCKET).remove([file_path]).catch(() => {}); }
  toast('Documento borrado', 'ok');
  if (me.role === 'admin') { await loadAll(); const pid = window._openPax; if (pid) openPassengerDetail(pid); } else renderPassenger();
}

// ══════════════════════════════════════════════════════════
//  INFO DEL DESTINO (generada con IA, editable a mano)
// ══════════════════════════════════════════════════════════
const allDests = () => (me && me.role === 'admin' ? (A.dests || []) : (P.dests || []));
const norm = s => (s || '').trim().toLowerCase();
function destOfTrip(t) {
  const L = allDests();
  if (t.destination_id) { const d = L.find(x => x.id === t.destination_id); if (d) return d; }
  return L.find(x => norm(x.country) === norm(t.country) && norm(x.city) === norm(t.destination)) || null;
}
// Acepta ["texto"] o [{nombre, desc}] y devuelve siempre {n, d}
function normList(v) {
  if (!Array.isArray(v)) return [];
  return v.map(x => typeof x === 'string' ? { n: x, d: '' } : { n: x.nombre || x.n || x.titulo || '', d: x.desc || x.descripcion || x.d || '' }).filter(x => x.n || x.d);
}
function destSection(icon, title, items) {
  const L = normList(items); if (!L.length) return '';
  return `<h4><span class="ms" style="font-size:18px">${icon}</span>${title}</h4><ul>${L.map(x => `<li>${x.n ? `<b>${esc(x.n)}</b>${x.d ? ' — ' : ''}` : ''}${esc(x.d)}</li>`).join('')}</ul>`;
}
function destInfoHtml(dest, trip) {
  const c = dest.content || {};
  const place = dest.city || dest.country || (trip && (trip.destination || trip.country)) || 'el destino';
  const facts = [['Moneda', c.moneda], ['Idioma', c.idioma], ['Huso horario', c.huso], ['Enchufe', c.enchufe], ['Mejor época', c.mejor_epoca], ['Clima', c.clima]].filter(f => f[1]);
  return `<div class="section-t">Guía de ${esc(place)}</div>
  <div class="dinfo">
    ${c.resumen ? `<p>${esc(c.resumen)}</p>` : ''}
    ${facts.length ? `<div class="dfacts">${facts.map(f => `<div class="dfact"><div class="k">${esc(f[0])}</div><div class="v">${esc(f[1])}</div></div>`).join('')}</div>` : ''}
    ${destSection('location_on', 'Qué visitar', c.lugares)}
    ${destSection('restaurant', 'Qué comer', c.gastronomia)}
    ${destSection('theater_comedy', 'Cultura y costumbres', c.cultura)}
    ${destSection('tips_and_updates', 'Tips para el viajero', c.tips)}
  </div>
  <p class="sub-mut" style="font-size:11.5px;margin-top:18px">Información general de referencia. Ante cualquier duda, consultanos.</p>`;
}

// ── Generación con IA ──
// La clave de OpenAI vive en el servidor (Supabase Edge Function "dest-ia"),
// nunca en el navegador. Solo un admin logueado puede invocarla.
async function genDest(tid) {
  const t = A.trips.find(x => x.id === tid); if (!t) return;
  if (!t.country && !t.destination) { toast('Primero cargale el país o la ciudad al viaje', 'err'); return; }
  const place = [t.destination, t.country].filter(Boolean).join(', ');
  const btn = $('genBtn'); if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Generando…'; }
  toast('Generando la guía de ' + place + '…');
  try {
    const { data, error } = await db.functions.invoke('dest-ia', { body: { place } });
    if (error) {
      let msg = 'No se pudo generar la guía';
      try { const b = await error.context.json(); if (b && b.error) msg = b.error; } catch (e) {}
      throw new Error(msg);
    }
    if (!data || !data.content) throw new Error((data && data.error) || 'La IA no devolvió información');
    await saveDestContent(t, data.content);
    toast('Guía del destino generada ✓', 'ok');
    await loadAll(); openTripDetail(tid);
  } catch (e) {
    toast('Error: ' + (e.message || e), 'err');
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="ms">auto_awesome</span>Generar con IA'; }
  }
}
// Guarda/actualiza el destino y lo asocia al viaje (se reutiliza en otros viajes al mismo lugar)
async function saveDestContent(t, content) {
  const country = (t.country || '').trim(), city = (t.destination || '').trim();
  const ex = (A.dests || []).find(x => norm(x.country) === norm(country) && norm(x.city) === norm(city));
  let did;
  if (ex) {
    const { error } = await db.from('pv_destinations').update({ content, updated_at: new Date().toISOString() }).eq('id', ex.id);
    if (error) throw error; did = ex.id;
  } else {
    const { data, error } = await db.from('pv_destinations').insert({ country, city, content }).select().single();
    if (error) throw error; did = data.id;
  }
  const { error: tErr } = await db.from('pv_trips').update({ destination_id: did }).eq('id', t.id);
  if (tErr) throw tErr;
  return did;
}
// Editor manual de la guía (texto simple: una línea por ítem, "Nombre: descripción")
const linesToList = s => (s || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i > 0 ? { nombre: l.slice(0, i).trim(), desc: l.slice(i + 1).trim() } : { nombre: '', desc: l }; });
const listToLines = v => normList(v).map(x => x.n ? `${x.n}: ${x.d}` : x.d).join('\n');
function openEditDest(tid) {
  const t = A.trips.find(x => x.id === tid); if (!t) return;
  const d = destOfTrip(t), c = (d && d.content) || {};
  openModal(`<div class="modal-h"><h3>Guía de ${esc(t.destination || t.country || 'el destino')}</h3><button class="btn btn-icon btn-ghost" onclick="openTripDetail(${tid})"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <p class="sub-mut" style="margin-bottom:14px">Esto es lo que ve el pasajero al entrar a su viaje. En las listas escribí <b>un ítem por línea</b>, con el formato <b>Nombre: descripción</b>.</p>
    <div class="fg"><label class="fl">Resumen del destino</label><textarea id="dsRes" rows="3">${esc(c.resumen || '')}</textarea></div>
    <div class="grid2">
      <div class="fg"><label class="fl">Moneda</label><input id="dsMon" value="${esc(c.moneda || '')}"></div>
      <div class="fg"><label class="fl">Idioma</label><input id="dsIdi" value="${esc(c.idioma || '')}"></div>
    </div>
    <div class="grid2">
      <div class="fg"><label class="fl">Huso horario</label><input id="dsHus" value="${esc(c.huso || '')}"></div>
      <div class="fg"><label class="fl">Enchufe</label><input id="dsEnc" value="${esc(c.enchufe || '')}"></div>
    </div>
    <div class="grid2">
      <div class="fg"><label class="fl">Mejor época</label><input id="dsEpo" value="${esc(c.mejor_epoca || '')}"></div>
      <div class="fg"><label class="fl">Clima</label><input id="dsCli" value="${esc(c.clima || '')}"></div>
    </div>
    <div class="fg"><label class="fl">Qué visitar</label><textarea id="dsLug" rows="6" placeholder="Coliseo: El anfiteatro más grande del imperio romano.">${esc(listToLines(c.lugares))}</textarea></div>
    <div class="fg"><label class="fl">Qué comer</label><textarea id="dsGas" rows="5">${esc(listToLines(c.gastronomia))}</textarea></div>
    <div class="fg"><label class="fl">Cultura y costumbres</label><textarea id="dsCul" rows="4">${esc(listToLines(c.cultura))}</textarea></div>
    <div class="fg"><label class="fl">Tips para el viajero</label><textarea id="dsTip" rows="5">${esc(listToLines(c.tips))}</textarea></div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="openTripDetail(${tid})">Cancelar</button><button class="btn btn-primary" id="dsBtn" onclick="doSaveDest(${tid})">Guardar guía</button></div>`, true);
}
async function doSaveDest(tid) {
  const t = A.trips.find(x => x.id === tid); if (!t) return;
  const content = {
    resumen: $('dsRes').value.trim(), moneda: $('dsMon').value.trim(), idioma: $('dsIdi').value.trim(),
    huso: $('dsHus').value.trim(), enchufe: $('dsEnc').value.trim(), mejor_epoca: $('dsEpo').value.trim(), clima: $('dsCli').value.trim(),
    lugares: linesToList($('dsLug').value), gastronomia: linesToList($('dsGas').value),
    cultura: linesToList($('dsCul').value), tips: linesToList($('dsTip').value),
  };
  const btn = $('dsBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    await saveDestContent(t, content);
    toast('Guía guardada ✓', 'ok'); await loadAll(); openTripDetail(tid);
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Guardar guía'; }
}

// ══════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════
async function startAdmin() {
  $('appAdmin').classList.remove('hidden'); $('appPassenger').classList.add('hidden');
  await loadAll(); adminView('dashboard');
}
async function loadAll() {
  const [pax, trips, tp, docs, lib, reqs, dests, folders] = await Promise.all([
    db.from('pv_profiles').select('*').eq('role', 'passenger').order('full_name'),
    db.from('pv_trips').select('*').order('depart_date', { nullsFirst: false }),
    db.from('pv_trip_passengers').select('*'),
    db.from('pv_documents').select('*').order('created_at', { ascending: false }),
    db.from('pv_library').select('*').order('created_at', { ascending: false }),
    db.from('pv_required_docs').select('*'),
    db.from('pv_destinations').select('*'),
    db.from('pv_lib_folders').select('*').order('name'),
  ]);
  A = {
    pax: pax.data || [], trips: trips.data || [], tp: tp.data || [], docs: docs.data || [],
    lib: lib.data || [], reqs: reqs.data || [], dests: dests.data || [], folders: folders.data || [],
  };
}
function adminView(v) {
  closeModal();
  document.querySelectorAll('.anav button').forEach(b => b.classList.toggle('active', b.dataset.v === v));
  ['dashboard', 'pax', 'trips', 'lib'].forEach(x => $('view' + x[0].toUpperCase() + x.slice(1)).classList.toggle('active', x === v));
  if (v === 'dashboard') renderDashboard();
  if (v === 'pax') renderPaxList();
  if (v === 'trips') renderTripList();
  if (v === 'lib') renderLib();
}

// helper: pasajeros de un viaje / viajes de un pasajero
const paxOfTrip = tid => A.tp.filter(x => x.trip_id === tid).map(x => A.pax.find(p => p.id === x.passenger_id)).filter(Boolean);
const tripsOfPax = pid => A.tp.filter(x => x.passenger_id === pid).map(x => A.trips.find(t => t.id === x.trip_id)).filter(Boolean);
const docsOfPax = pid => A.docs.filter(d => d.passenger_id === pid);
function missingForPax(pid) {
  const cats = new Set(docsOfPax(pid).map(d => d.category));
  const req = new Set();
  tripsOfPax(pid).forEach(t => A.reqs.filter(r => r.trip_id === t.id).forEach(r => req.add(r.category)));
  return [...req].filter(c => !cats.has(c));
}

// ── Dashboard ──
function renderDashboard() {
  const upcoming = A.trips.filter(t => { const d = daysUntil(t.depart_date); return d !== null && d >= 0 && d <= 10; });
  const missingPax = A.pax.filter(p => missingForPax(p.id).length);
  let al = '';
  if (upcoming.length) {
    al += `<div class="section-t">Viajes que salen pronto (≤10 días)</div>`;
    upcoming.forEach(t => {
      const du = daysUntil(t.depart_date); const px = paxOfTrip(t.id);
      al += `<div class="alert alert-warn"><span class="ms">flight_takeoff</span><div style="flex:1"><div class="at">${esc(t.title)} — ${du === 0 ? 'sale hoy' : du === 1 ? 'sale mañana' : 'en ' + du + ' días'}</div><div class="as">${esc(t.destination || '')} · ${px.length} pasajero(s)${px.some(p => missingForPax(p.id).length) ? ' · ⚠ hay documentación pendiente' : ' · documentación OK'}</div></div><button class="btn btn-ghost btn-sm" onclick="openTripDetail(${t.id})">Ver</button></div>`;
    });
  }
  if (missingPax.length) {
    al += `<div class="section-t">Pasajeros a los que falta cargarles documentación</div>`;
    missingPax.forEach(p => {
      al += `<div class="alert alert-red"><span class="ms">person</span><div style="flex:1"><div class="at">${esc(p.full_name)} <span class="sub-mut">(DNI ${esc(p.dni)})</span></div><div class="as">Falta cargar: ${missingForPax(p.id).map(esc).join(' · ')}</div></div><button class="btn btn-ghost btn-sm" onclick="openPassengerDetail('${p.id}')">Cargar</button></div>`;
    });
  }
  if (!al) al = `<div class="empty"><span class="ms">check_circle</span>Todo en orden. No hay alertas.</div>`;
  $('viewDashboard').innerHTML = `<div class="page-h"><h2>Inicio</h2></div>
    <div class="stats">
      <div class="stat"><div class="n">${A.pax.length}</div><div class="l">Pasajeros</div></div>
      <div class="stat"><div class="n">${A.trips.length}</div><div class="l">Viajes</div></div>
      <div class="stat"><div class="n" style="color:var(--gold)">${upcoming.length}</div><div class="l">Salen ≤10 días</div></div>
      <div class="stat"><div class="n" style="color:${missingPax.length ? 'var(--red)' : 'var(--green)'}">${missingPax.length}</div><div class="l">Con docs pendientes</div></div>
    </div>${al}`;
}

// ── Pasajeros ──
function renderPaxList() {
  const q = ($('paxSearch')?.value || '').toLowerCase().trim();
  let list = A.pax;
  if (q) list = list.filter(p => (p.full_name || '').toLowerCase().includes(q) || (p.dni || '').includes(q));
  const w = $('paxListWrap');
  if (!list.length) { w.innerHTML = `<div class="empty"><span class="ms">group</span>${q ? 'Sin resultados.' : 'Todavía no hay pasajeros. Creá el primero.'}</div>`; return; }
  w.innerHTML = list.map(p => {
    const miss = missingForPax(p.id).length, nt = tripsOfPax(p.id).length;
    return `<div class="rowitem click" onclick="openPassengerDetail('${p.id}')">
      <div class="avatar">${esc(initials(p.full_name))}</div>
      <div class="info"><div class="t">${esc(p.full_name)}</div><div class="s">DNI ${esc(p.dni)}${p.phone ? ' · ' + esc(p.phone) : ''}</div></div>
      <div class="end"><span class="chip chip-mut">${nt} viaje${nt === 1 ? '' : 's'}</span>${miss ? `<span class="chip chip-red">${miss} pendiente${miss === 1 ? '' : 's'}</span>` : `<span class="chip chip-green">OK</span>`}<span class="ms" style="color:var(--mut2)">chevron_right</span></div></div>`;
  }).join('');
}
function openNewPassenger() {
  openModal(`<div class="modal-h"><h3>Nuevo pasajero</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Nombre completo *</label><input id="npName" placeholder="Nombre y apellido"></div>
    <div class="fg"><label class="fl">DNI * (es el usuario y la contraseña)</label><input id="npDni" inputmode="numeric" placeholder="Solo números"></div>
    <div class="grid2"><div class="fg"><label class="fl">Email (opcional)</label><input id="npEmail" type="email" placeholder="Contacto"></div>
    <div class="fg"><label class="fl">Teléfono (opcional)</label><input id="npPhone" placeholder="Contacto"></div></div>
    <p class="sub-mut" style="font-size:12.5px">El pasajero va a entrar al portal poniendo <b>su DNI</b>.</p>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" id="npBtn" onclick="doNewPassenger()">Crear pasajero</button></div>`);
}
async function doNewPassenger() {
  const full_name = $('npName').value.trim(), dni = $('npDni').value.trim(), email = $('npEmail').value.trim(), phone = $('npPhone').value.trim();
  if (!full_name) { toast('Poné el nombre', 'err'); return; }
  if (!/^\d{5,}$/.test(dni)) { toast('DNI inválido (mínimo 5 números)', 'err'); return; }
  const btn = $('npBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    // ¿ya existe?
    const { data: ex } = await db.from('pv_profiles').select('id').eq('dni', dni).maybeSingle();
    if (ex) throw new Error('Ya existe un pasajero con ese DNI');
    // Credenciales internas, independientes del DNI (para poder corregirlo después)
    const auth_email = `pv-${rid()}@pasajero.corradi`, auth_pw = 'k' + rid().replace(/-/g, '');
    // crear usuario auth en cliente aislado (no toca la sesión del admin)
    const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'pv_tmp_' + Date.now() } });
    const { data, error } = await tmp.auth.signUp({ email: auth_email, password: auth_pw });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el acceso del pasajero');
    const uid = data.user.id;
    const { error: pErr } = await db.from('pv_profiles').insert({ id: uid, role: 'passenger', full_name, dni, email: email || null, phone: phone || null, auth_email, auth_pw });
    try { await tmp.auth.signOut(); } catch (e) {}
    if (pErr) throw new Error(pErr.message);
    closeModal(); toast('Pasajero creado ✓', 'ok'); await loadAll(); renderPaxList();
  } catch (e) { toast(e.message || 'Error al crear', 'err'); btn.disabled = false; btn.textContent = 'Crear pasajero'; }
}
// ── Acceso del pasajero ──────────────────────────────────────────────
// El pasajero NO tiene contraseña propia: entra solo con el DNI (pv_login
// resuelve credenciales internas). O sea que no hay contraseña que pueda
// cambiar ni olvidarse. Lo único que necesita Corradi es poder mandarle el
// link y el DNI sin tener que escribirlo a mano cada vez.
const PORTAL_URL = 'https://www.corradiviajes.com.ar/portal';

function accessMessage(p) {
  return `¡Hola ${(p.full_name || '').split(' ')[0]}! Ya tenés tu viaje cargado en el portal de Corradi Viajes.\n\n` +
    `Entrá acá: ${PORTAL_URL}\n` +
    `Tu usuario es tu DNI: ${p.dni}\n\n` +
    `Ahí vas a ver toda la documentación de tu viaje y la guía del destino. ¡Cualquier cosa escribinos!`;
}

function accessBox(p) {
  const wa = (p.phone || '').replace(/\D/g, '');
  return `<div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;padding:14px 16px;margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
      <span class="ms" style="color:#0052cc;font-size:19px">key</span>
      <span style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#0052cc">Acceso al portal</span>
    </div>
    <div style="font-size:13.5px;color:#334155;font-weight:500;margin-bottom:4px">Entra con su DNI. No usa contraseña.</div>
    <div style="font-family:ui-monospace,monospace;font-size:21px;font-weight:800;color:#0f172a;letter-spacing:.04em;margin-bottom:12px">${esc(p.dni)}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" onclick="copyAccess('${p.id}')"><span class="ms">content_copy</span>Copiar instrucciones</button>
      ${wa ? `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener"
        href="https://wa.me/${wa}?text=${encodeURIComponent(accessMessage(p))}"><span class="ms">send</span>Enviar por WhatsApp</a>` : ''}
    </div>
  </div>`;
}

async function copyAccess(pid) {
  const p = A.pax.find(x => x.id === pid); if (!p) return;
  const txt = accessMessage(p);
  try {
    await navigator.clipboard.writeText(txt);
    toast('Instrucciones copiadas ✓', 'ok');
  } catch (e) {
    // clipboard falla si la pestaña no está enfocada o el navegador es viejo
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Instrucciones copiadas ✓', 'ok'); }
    catch (e2) { toast('No se pudo copiar', 'err'); }
    ta.remove();
  }
}

function openPassengerDetail(pid) {
  window._openPax = pid;
  const p = A.pax.find(x => x.id === pid); if (!p) return;
  const trips = tripsOfPax(pid), docs = docsOfPax(pid), miss = missingForPax(pid);
  const html = `<div class="modal-h"><div class="avatar">${esc(initials(p.full_name))}</div><h3 style="flex:1">${esc(p.full_name)}</h3>
    <button class="btn btn-icon btn-ghost" title="Editar datos" onclick="openEditPassenger('${pid}')"><span class="ms">edit</span></button>
    <button class="btn btn-icon btn-danger" title="Eliminar pasajero" onclick="deletePassenger('${pid}')"><span class="ms">delete</span></button>
    <button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="sub-mut" style="margin-bottom:14px">${p.email ? esc(p.email) : ''}${p.email && p.phone ? ' · ' : ''}${p.phone ? esc(p.phone) : ''}</div>
    ${p.notes ? `<p class="sub-mut" style="margin:-6px 0 14px;white-space:pre-wrap">${esc(p.notes)}</p>` : ''}
    ${accessBox(p)}
    ${miss.length ? `<div class="alert alert-red" style="margin-bottom:14px"><span class="ms">warning</span><div><div class="at">Falta documentación</div><div class="as">${miss.map(esc).join(' · ')}</div></div></div>` : ''}
    <div class="section-t" style="margin-top:0">Viajes asignados</div>
    ${trips.length ? `<div class="rowlist">${trips.map(t => `<div class="rowitem click" onclick="openTripDetail(${t.id})">${tripThumb(t, 38)}<div class="info"><div class="t">${esc(t.title)}</div><div class="s">${esc(t.destination || '')}${t.depart_date ? ' · ' + fmtDate(t.depart_date) : ''}</div></div><span class="ms" style="color:var(--mut2)">chevron_right</span></div>`).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">Sin viajes. Asignalo desde la pestaña Viajes.</p>`}
    <div class="section-t">Documentación (${docs.length})</div>
    ${docs.length ? `<div class="rowlist">${docs.map(docRow).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">Sin documentos.</p>`}
  </div>
  <div class="modal-f" style="flex-wrap:wrap">
    <button class="btn btn-ghost" onclick="openAttachLibrary('${pid}')"><span class="ms">library_add</span>Adjuntar de biblioteca</button>
    <button class="btn btn-primary" onclick="openUploadForPax('${pid}')"><span class="ms">upload</span>Subir documento</button>
  </div>`;
  openModal(html, true);
}
function openEditPassenger(pid) {
  const p = A.pax.find(x => x.id === pid); if (!p) return;
  openModal(`<div class="modal-h"><h3>Editar pasajero</h3><button class="btn btn-icon btn-ghost" onclick="openPassengerDetail('${pid}')"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Nombre completo *</label><input id="epName" value="${esc(p.full_name || '')}"></div>
    <div class="fg"><label class="fl">DNI * (con esto entra al portal)</label><input id="epDni" inputmode="numeric" value="${esc(p.dni || '')}"></div>
    <div class="grid2">
      <div class="fg"><label class="fl">Email</label><input id="epEmail" type="email" value="${esc(p.email || '')}"></div>
      <div class="fg"><label class="fl">Teléfono</label><input id="epPhone" value="${esc(p.phone || '')}"></div>
    </div>
    <div class="fg"><label class="fl">Notas internas (no las ve el pasajero)</label><textarea id="epNotes" rows="3">${esc(p.notes || '')}</textarea></div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="openPassengerDetail('${pid}')">Cancelar</button><button class="btn btn-primary" id="epBtn" onclick="doSavePassenger('${pid}')">Guardar</button></div>`);
}
async function doSavePassenger(pid) {
  const full_name = $('epName').value.trim(), dni = $('epDni').value.trim();
  if (!full_name) { toast('Poné el nombre', 'err'); return; }
  if (!/^\d{5,}$/.test(dni)) { toast('DNI inválido (mínimo 5 números)', 'err'); return; }
  const dup = A.pax.find(x => x.dni === dni && x.id !== pid);
  if (dup) { toast('Ya hay otro pasajero con ese DNI', 'err'); return; }
  const btn = $('epBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  const { error } = await db.from('pv_profiles').update({
    full_name, dni, email: $('epEmail').value.trim() || null,
    phone: $('epPhone').value.trim() || null, notes: $('epNotes').value.trim() || null,
  }).eq('id', pid);
  if (error) { toast('Error: ' + error.message, 'err'); btn.disabled = false; btn.textContent = 'Guardar'; return; }
  toast('Pasajero actualizado ✓', 'ok'); await loadAll(); renderPaxList(); openPassengerDetail(pid);
}
async function deletePassenger(pid) {
  const p = A.pax.find(x => x.id === pid); if (!p) return;
  if (!confirm(`¿Eliminar a ${p.full_name}? Se borran sus documentos y pierde el acceso al portal.`)) return;
  const docs = docsOfPax(pid).filter(d => d.source !== 'library').map(d => d.file_path);
  await db.from('pv_documents').delete().eq('passenger_id', pid);
  await db.from('pv_trip_passengers').delete().eq('passenger_id', pid);
  const { error } = await db.from('pv_profiles').delete().eq('id', pid);
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  if (docs.length) await db.storage.from(BUCKET).remove(docs).catch(() => {});
  closeModal(); toast('Pasajero eliminado', 'ok'); await loadAll(); renderPaxList();
}
function openUploadForPax(pid) {
  const trips = tripsOfPax(pid);
  openModal(`<div class="modal-h"><h3>Subir documento al pasajero</h3><button class="btn btn-icon btn-ghost" onclick="openPassengerDetail('${pid}')"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Título *</label><input id="udTitle" placeholder="Ej: Voucher Hotel Madrid"></div>
    <div class="grid2">
      <div class="fg"><label class="fl">Tipo</label><select id="udCat">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="fg"><label class="fl">Viaje (opcional)</label><select id="udTrip"><option value="">— General —</option>${trips.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select></div>
    </div>
    <div class="fg"><label class="fl">Archivo *</label><input type="file" id="udFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="openPassengerDetail('${pid}')">Volver</button><button class="btn btn-primary" id="udBtn" onclick="doUploadForPax('${pid}')">Subir</button></div>`, false);
}
async function doUploadForPax(pid) {
  const file = $('udFile').files[0], title = $('udTitle').value.trim(), cat = $('udCat').value, trip = $('udTrip').value || null;
  if (!title) { toast('Poné un título', 'err'); return; }
  if (!file) { toast('Elegí un archivo', 'err'); return; }
  const btn = $('udBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const path = await uploadFileTo(pid, file);
    const { error } = await db.from('pv_documents').insert({ passenger_id: pid, trip_id: trip, title, category: cat, file_path: path, file_name: file.name, source: 'admin', uploaded_by: me.id });
    if (error) throw error;
    toast('Documento subido ✓', 'ok'); await loadAll(); openPassengerDetail(pid);
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Subir'; }
}
function openAttachLibrary(pid, tripId) {
  if (!A.lib.length) { toast('La biblioteca está vacía. Subí documentos en la pestaña Biblioteca.', 'err'); return; }
  const trips = tripsOfPax(pid);
  openModal(`<div class="modal-h"><h3>Adjuntar de biblioteca</h3><button class="btn btn-icon btn-ghost" onclick="${pid ? `openPassengerDetail('${pid}')` : 'closeModal()'}"><span class="ms">close</span></button></div>
  <div class="modal-b">
    ${pid ? `<div class="fg"><label class="fl">Asociar a viaje (opcional)</label><select id="alTrip"><option value="">— General —</option>${trips.map(t => `<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select></div>` : ''}
    <div class="section-t" style="margin-top:6px">Elegí un documento</div>
    <div class="rowlist">${A.lib.map(l => `<div class="rowitem click" onclick="doAttachLibrary('${pid || ''}', ${l.id})"><div class="doc" style="border:none;background:none;padding:0;flex:1"><div class="di lib"><span class="ms">menu_book</span></div><div class="info"><div class="t">${esc(l.title)}</div><div class="s">${esc(l.category || '')}</div></div></div><span class="chip chip-blue">Adjuntar</span></div>`).join('')}</div>
  </div>`, true);
}
async function doAttachLibrary(pid, libId) {
  const l = A.lib.find(x => x.id === libId); if (!l) return;
  const trip = $('alTrip') ? ($('alTrip').value || null) : null;
  const { error } = await db.from('pv_documents').insert({ passenger_id: pid, trip_id: trip, title: l.title, category: l.category, file_path: l.file_path, file_name: l.file_name, source: 'library', uploaded_by: me.id });
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  toast('Adjuntado ✓', 'ok'); await loadAll(); openPassengerDetail(pid);
}

// ── Viajes ──
function renderTripList() {
  const q = ($('tripSearch')?.value || '').toLowerCase().trim();
  let list = A.trips;
  if (q) list = list.filter(t => (t.title || '').toLowerCase().includes(q) || (t.destination || '').toLowerCase().includes(q));
  const w = $('tripListWrap');
  if (!list.length) { w.innerHTML = `<div class="empty"><span class="ms">luggage</span>${q ? 'Sin resultados.' : 'Todavía no hay viajes. Creá el primero.'}</div>`; return; }
  w.innerHTML = list.map(t => {
    const px = paxOfTrip(t.id), du = daysUntil(t.depart_date);
    const badge = (du !== null && du >= 0 && du <= 10) ? `<span class="chip chip-gold">En ${du} día${du === 1 ? '' : 's'}</span>` : (du !== null && du < 0 ? `<span class="chip chip-mut">Pasado</span>` : '');
    return `<div class="rowitem click" onclick="openTripDetail(${t.id})">
      ${tripThumb(t)}
      <div class="info"><div class="t">${esc(t.title)}</div><div class="s">${esc(t.destination || '')}${t.country ? ' · ' + esc(t.country) : ''}${t.depart_date ? ' · ' + fmtDate(t.depart_date) : ''}</div></div>
      <div class="end">${badge}<span class="chip chip-mut">${px.length} pax</span><span class="ms" style="color:var(--mut2)">chevron_right</span></div></div>`;
  }).join('');
}
function openNewTrip(edit) {
  const t = edit ? A.trips.find(x => x.id === edit) : null;
  openModal(`<div class="modal-h"><h3>${t ? 'Editar viaje' : 'Nuevo viaje'}</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Título del viaje *</label><input id="ntTitle" value="${esc(t?.title || '')}" placeholder="Ej: Madrid — Marzo 2027"></div>
    <div class="grid2"><div class="fg"><label class="fl">Destino (ciudad)</label><input id="ntDest" value="${esc(t?.destination || '')}" placeholder="Ej: Madrid" autocomplete="off"></div>
    <div class="fg"><label class="fl">País</label><input id="ntCountry" list="pvCountries" value="${esc(t?.country || '')}" placeholder="Elegí o escribí" autocomplete="off">
      <datalist id="pvCountries">${COUNTRIES.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div></div>
    <div class="grid2"><div class="fg"><label class="fl">Fecha de salida</label><input id="ntDep" type="date" value="${t?.depart_date || ''}"></div>
    <div class="fg"><label class="fl">Fecha de regreso</label><input id="ntRet" type="date" value="${t?.return_date || ''}"></div></div>
    <div class="fg"><label class="fl">Notas (opcional)</label><textarea id="ntNotes" rows="3" placeholder="Info del viaje…">${esc(t?.notes || '')}</textarea></div>
    <div class="fg"><label class="fl">Imagen del viaje (opcional)</label>
      <div style="display:flex;align-items:center;gap:12px">
        <div id="ntImgPrev" style="width:84px;height:56px;border-radius:10px;overflow:hidden;border:1px solid var(--line);flex-shrink:0;background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center">
          ${t && tripImg(t) ? `<img src="${esc(tripImg(t))}" style="width:100%;height:100%;object-fit:cover">` : `<span class="ms" style="color:var(--mut2)">image</span>`}
        </div>
        <input type="file" id="ntImg" accept="image/*" onchange="previewTripImg(event)" style="flex:1">
        ${t && t.image_url ? `<button type="button" class="btn btn-icon btn-danger" title="Quitar imagen" onclick="rmTripImg()"><span class="ms">delete</span></button>` : ''}
      </div>
      <input type="hidden" id="ntImgDel" value="">
      <p class="sub-mut" style="font-size:12px;margin-top:6px">Si no cargás imagen, se usa la <b>bandera del país</b> automáticamente.</p>
    </div>
    <div class="fg"><label class="fl">Checklist de documentación del viaje</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${REQ_CATS.map(c => `<button type="button" class="chip chip-mut reqchip ${t && A.reqs.some(r => r.trip_id === t.id && r.category === c) ? 'sel' : ''}" data-c="${esc(c)}" onclick="this.classList.toggle('sel')">${esc(c)}</button>`).join('')}</div>
      <p class="sub-mut" style="font-size:12px;margin-top:8px">Marcá lo que cada pasajero tiene que tener cargado. Si falta algo, te avisamos en Inicio para que lo subas.</p>
    </div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" id="ntBtn" onclick="doSaveTrip(${t ? t.id : 'null'})">${t ? 'Guardar' : 'Crear viaje'}</button></div>`);
}
function previewTripImg(ev) {
  const f = ev.target.files[0]; if (!f) return;
  $('ntImgDel').value = '';
  const url = URL.createObjectURL(f);
  $('ntImgPrev').innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
}
function rmTripImg() {
  $('ntImgDel').value = '1'; $('ntImg').value = '';
  $('ntImgPrev').innerHTML = `<span class="ms" style="color:var(--mut2)">flag</span>`;
  toast('Se va a usar la bandera del país');
}
async function doSaveTrip(id) {
  const payload = {
    title: $('ntTitle').value.trim(), destination: $('ntDest').value.trim() || null, country: $('ntCountry').value.trim() || null,
    depart_date: $('ntDep').value || null, return_date: $('ntRet').value || null, notes: $('ntNotes').value.trim() || null,
  };
  if (!payload.title) { toast('Poné un título', 'err'); return; }
  const reqCats = [...document.querySelectorAll('.reqchip.sel')].map(c => c.dataset.c);
  const btn = $('ntBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    // Imagen del viaje (bucket público) — si no hay, se usa la bandera del país
    const imgFile = $('ntImg') && $('ntImg').files[0];
    if ($('ntImgDel') && $('ntImgDel').value === '1') payload.image_url = null;
    if (imgFile) {
      const ipath = `portal-trips/${rid()}_${safeName(imgFile.name)}`;
      const { error: iErr } = await db.storage.from(IMG_BUCKET).upload(ipath, imgFile, { upsert: false, contentType: imgFile.type || undefined });
      if (iErr) throw new Error('No se pudo subir la imagen: ' + iErr.message);
      payload.image_url = `${SUPABASE_URL}/storage/v1/object/public/${IMG_BUCKET}/${ipath}`;
    }
    let tripId = id;
    if (id) { const { error } = await db.from('pv_trips').update(payload).eq('id', id); if (error) throw error; }
    else { const { data, error } = await db.from('pv_trips').insert(payload).select().single(); if (error) throw error; tripId = data.id; }
    // required docs: reset
    await db.from('pv_required_docs').delete().eq('trip_id', tripId);
    if (reqCats.length) await db.from('pv_required_docs').insert(reqCats.map(c => ({ trip_id: tripId, category: c })));
    closeModal(); toast('Viaje guardado ✓', 'ok'); await loadAll(); renderTripList();
    const t = A.trips.find(x => x.id === tripId);
    if (t) {
      openTripDetail(tripId);
      // Viaje nuevo a un destino sin guía → la generamos sola con IA
      if (!id && !destOfTrip(t) && (t.country || t.destination)) genDest(tripId);
    }
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Guardar'; }
}
function openTripDetail(tid) {
  const t = A.trips.find(x => x.id === tid); if (!t) return;
  const px = paxOfTrip(tid), req = A.reqs.filter(r => r.trip_id === tid).map(r => r.category);
  const du = daysUntil(t.depart_date), dest = destOfTrip(t);
  // Documentacion ya cargada en este viaje, agrupada: el mismo archivo subido
  // 'a todos' aparece una sola vez con la lista de pasajeros que lo tienen.
  const tripDocs = A.docs.filter(d => d.trip_id === tid);
  const grupos = {};
  tripDocs.forEach(d => {
    const k = d.file_path + '|' + (d.title || '');
    (grupos[k] = grupos[k] || []).push(d);
  });
  const docsHtml = Object.values(grupos).map(g => {
    const d = g[0];
    const noms = g.map(x => (A.pax.find(p => p.id === x.passenger_id) || {}).full_name || '¿?');
    const quien = (px.length > 1 && g.length >= px.length) ? `Todos (${g.length})` : noms.join(', ');
    const ids = g.map(x => x.id).join(',');
    return `<div class="doc click" style="cursor:pointer" onclick='openPreview(${JSON.stringify(d.file_path)}, ${JSON.stringify(d.title || '')})'>
      ${thumbBox(d.file_path, d.file_name || d.file_path)}
      <div class="info"><div class="t">${esc(d.title)}</div><div class="s">${esc(d.category || 'Documento')} · ${esc(quien)}</div></div>
      <button class="btn btn-ghost btn-sm"><span class="ms">visibility</span>Ver</button>
      <button class="btn btn-icon btn-danger" title="Borrar" onclick='event.stopPropagation();deleteTripDocGroup("${ids}", ${JSON.stringify(d.file_path)}, "${d.source}", ${tid})'><span class="ms">delete</span></button>
    </div>`;
  }).join('');
  const html = `<div class="modal-h">${tripThumb(t)}<h3 style="flex:1">${esc(t.title)}</h3>
    <button class="btn btn-icon btn-ghost" title="Editar" onclick="openNewTrip(${tid})"><span class="ms">edit</span></button>
    <button class="btn btn-icon btn-danger" title="Eliminar" onclick="deleteTrip(${tid})"><span class="ms">delete</span></button>
    <button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="sub-mut" style="margin-bottom:6px">${esc(t.destination || '')}${t.country ? ' · ' + esc(t.country) : ''}</div>
    <div class="sub-mut">${t.depart_date ? 'Salida ' + fmtDate(t.depart_date) : 'Sin fecha'}${t.return_date ? ' → ' + fmtDate(t.return_date) : ''}${du !== null && du >= 0 && du <= 10 ? ` · <span style="color:var(--gold);font-weight:700">sale en ${du} día(s)</span>` : ''}</div>
    ${t.notes ? `<p class="sub-mut" style="margin-top:10px;white-space:pre-wrap">${esc(t.notes)}</p>` : ''}
    ${req.length ? `<div class="section-t">Documentación requerida</div><div style="display:flex;flex-wrap:wrap;gap:7px">${req.map(c => `<span class="chip chip-blue">${esc(c)}</span>`).join('')}</div>` : ''}
    <div class="section-t">Guía del destino <span class="sub-mut" style="font-weight:400;font-size:12px">— la ve el pasajero al entrar</span></div>
    ${dest ? `<div class="alert" style="background:rgba(58,124,214,.08);border-color:rgba(58,124,214,.28)"><span class="ms" style="color:var(--blue)">travel_explore</span>
        <div style="flex:1"><div class="at">Guía cargada</div><div class="as">${esc((dest.content && dest.content.resumen ? dest.content.resumen : '').slice(0, 110))}${(dest.content && dest.content.resumen || '').length > 110 ? '…' : ''}</div></div>
        <button class="btn btn-ghost btn-sm" onclick="openEditDest(${tid})"><span class="ms">edit</span>Editar</button>
        <button class="btn btn-ghost btn-sm" id="genBtn" onclick="genDest(${tid})"><span class="ms">autorenew</span>Regenerar</button></div>`
      : `<div class="alert" style="background:rgba(242,179,82,.08);border-color:rgba(242,179,82,.28)"><span class="ms" style="color:var(--gold)">travel_explore</span>
        <div style="flex:1"><div class="at">Sin guía del destino</div><div class="as">Generá con IA la info de ${esc(t.destination || t.country || 'el destino')}: qué visitar, qué comer, cultura y tips.</div></div>
        <button class="btn btn-primary btn-sm" id="genBtn" onclick="genDest(${tid})"><span class="ms">auto_awesome</span>Generar con IA</button>
        <button class="btn btn-ghost btn-sm" onclick="openEditDest(${tid})"><span class="ms">edit</span>A mano</button></div>`}
    <div class="section-t">Pasajeros (${px.length})</div>
    ${px.length ? `<div class="rowlist">${px.map(p => { const m = missingForPax(p.id).length; return `<div class="rowitem click" onclick="openPassengerDetail('${p.id}')"><div class="avatar">${esc(initials(p.full_name))}</div><div class="info"><div class="t">${esc(p.full_name)}</div><div class="s">DNI ${esc(p.dni)}${m ? ' · ⚠ ' + m + ' doc. pendiente(s)' : ''}</div></div><span class="ms" style="color:var(--mut2)">chevron_right</span><button class="btn btn-icon btn-danger" title="Quitar del viaje" onclick="event.stopPropagation();removePaxFromTrip(${tid},'${p.id}')"><span class="ms">person_remove</span></button></div>`; }).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">Sin pasajeros asignados.</p>`}
    <div class="section-t">Documentación del viaje (${Object.keys(grupos).length})</div>
    ${docsHtml ? `<div class="rowlist">${docsHtml}</div>` : `<p class="sub-mut" style="font-size:13px">Todavía no hay archivos. Subí acá el voucher, pasaporte, DNI, seguro, visa o lo que necesite el pasajero.</p>`}
  </div>
  <div class="modal-f" style="flex-wrap:wrap">
    ${A.lib.length ? `<button class="btn btn-ghost" onclick="openAttachTripLib(${tid})"><span class="ms">library_add</span>De biblioteca a todos</button>` : ''}
    <button class="btn btn-ghost" onclick="openUploadTripDoc(${tid})"><span class="ms">upload_file</span>Subir doc a todos</button>
    ${px.length ? `<button class="btn btn-ghost" onclick="openUploadPaxDoc(${tid})"><span class="ms">person</span>Subir a un pasajero</button>` : ''}
    <button class="btn btn-primary" onclick="openAssignPax(${tid})"><span class="ms">group_add</span>Asignar pasajeros</button>
  </div>`;
  openModal(html, true);
}
// Subir un documento y dárselo a TODOS los pasajeros del viaje (ej: itinerario, guía)
function openUploadTripDoc(tid) {
  const px = paxOfTrip(tid);
  if (!px.length) { toast('Primero asigná pasajeros al viaje', 'err'); return; }
  openModal(`<div class="modal-h"><h3>Subir documento a los ${px.length} pasajeros</h3><button class="btn btn-icon btn-ghost" onclick="openTripDetail(${tid})"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <p class="sub-mut" style="margin-bottom:14px">El mismo archivo queda cargado en la documentación de todos los pasajeros de este viaje.</p>
    <div class="fg"><label class="fl">Título *</label><input id="tdTitle" placeholder="Ej: Itinerario del viaje"></div>
    <div class="fg"><label class="fl">Tipo</label><select id="tdCat">${CATS.map(c => `<option ${c === 'Itinerario' ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="fg"><label class="fl">Archivo *</label><input type="file" id="tdFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="openTripDetail(${tid})">Volver</button><button class="btn btn-primary" id="tdBtn" onclick="doUploadTripDoc(${tid})">Subir a todos</button></div>`);
}
async function doUploadTripDoc(tid) {
  const px = paxOfTrip(tid);
  const file = $('tdFile').files[0], title = $('tdTitle').value.trim(), cat = $('tdCat').value;
  if (!title) { toast('Poné un título', 'err'); return; }
  if (!file) { toast('Elegí un archivo', 'err'); return; }
  const btn = $('tdBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const path = await uploadFileTo(`trips/${tid}`, file);   // carpeta compartida del viaje
    const rows = px.map(p => ({ passenger_id: p.id, trip_id: tid, title, category: cat, file_path: path, file_name: file.name, source: 'admin', uploaded_by: me.id }));
    const { error } = await db.from('pv_documents').insert(rows);
    if (error) throw error;
    toast(`Cargado a ${px.length} pasajero(s) ✓`, 'ok'); await loadAll(); openTripDetail(tid);
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Subir a todos'; }
}
// Subir un documento a UN pasajero puntual del viaje (pasaporte, DNI, visa…)
function openUploadPaxDoc(tid) {
  const px = paxOfTrip(tid);
  if (!px.length) { toast('Primero asigná pasajeros al viaje', 'err'); return; }
  openModal(`<div class="modal-h"><h3>Subir documento a un pasajero</h3><button class="btn btn-icon btn-ghost" onclick="openTripDetail(${tid})"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Pasajero *</label><select id="pdPax">${px.map(p => `<option value="${p.id}">${esc(p.full_name)} — DNI ${esc(p.dni)}</option>`).join('')}</select></div>
    <div class="fg"><label class="fl">Tipo *</label><select id="pdCat" onchange="if(!$('pdTitle').dataset.tocado)$('pdTitle').value=this.value">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div class="fg"><label class="fl">Título *</label><input id="pdTitle" value="Voucher" oninput="this.dataset.tocado='1'"></div>
    <div class="fg"><label class="fl">Archivo *</label><input type="file" id="pdFile" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"></div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="openTripDetail(${tid})">Volver</button><button class="btn btn-primary" id="pdBtn" onclick="doUploadPaxDoc(${tid})">Subir</button></div>`);
}
async function doUploadPaxDoc(tid) {
  const pid = $('pdPax').value, file = $('pdFile').files[0];
  const title = $('pdTitle').value.trim(), cat = $('pdCat').value;
  if (!title) { toast('Poné un título', 'err'); return; }
  if (!file) { toast('Elegí un archivo', 'err'); return; }
  const btn = $('pdBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const path = await uploadFileTo(pid, file);
    const { error } = await db.from('pv_documents').insert({ passenger_id: pid, trip_id: tid, title, category: cat, file_path: path, file_name: file.name, source: 'admin', uploaded_by: me.id });
    if (error) throw error;
    toast('Documento cargado ✓', 'ok'); await loadAll(); openTripDetail(tid);
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Subir'; }
}
// Borrar un doc del viaje (todas sus copias si se subio 'a todos')
async function deleteTripDocGroup(idsCsv, file_path, source, tid) {
  const ids = String(idsCsv).split(',').map(Number).filter(Boolean);
  if (!ids.length) return;
  if (!confirm(ids.length > 1 ? `¿Borrar este documento de los ${ids.length} pasajeros?` : '¿Borrar este documento?')) return;
  await db.from('pv_documents').delete().in('id', ids);
  if (source !== 'library') { await db.storage.from(BUCKET).remove([file_path]).catch(() => {}); }
  toast('Documento borrado', 'ok'); await loadAll(); openTripDetail(tid);
}

async function deleteTrip(tid) {
  if (!confirm('¿Eliminar este viaje? Se quitará a los pasajeros (sus documentos no se borran).')) return;
  const { error } = await db.from('pv_trips').delete().eq('id', tid);
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  closeModal(); toast('Viaje eliminado', 'ok'); await loadAll(); renderTripList();
}
async function removePaxFromTrip(tid, pid) {
  await db.from('pv_trip_passengers').delete().eq('trip_id', tid).eq('passenger_id', pid);
  toast('Pasajero quitado', 'ok'); await loadAll(); openTripDetail(tid);
}
function openAssignPax(tid) {
  const assigned = new Set(paxOfTrip(tid).map(p => p.id));
  window._assignSel = new Set(assigned);
  const rows = A.pax.map(p => `<div class="msel-row ${assigned.has(p.id) ? 'sel' : ''}" data-id="${p.id}" onclick="toggleAssign('${p.id}',this)"><div class="cb"><span class="ms">check</span></div><div class="avatar" style="width:34px;height:34px;font-size:13px">${esc(initials(p.full_name))}</div><div style="flex:1;min-width:0"><div style="font-weight:600;color:#0f172a">${esc(p.full_name)}</div><div class="sub-mut" style="font-size:12px;color:#475569">DNI ${esc(p.dni)}</div></div></div>`).join('');
  openModal(`<div class="modal-h">
    <h3 style="flex:1;color:#0f172a;font-weight:800">Asignar Pasajeros al Viaje</h3>
    <button class="btn btn-icon btn-ghost" onclick="openTripDetail(${tid})"><span class="ms">close</span></button>
  </div>
  <div class="modal-b">
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div class="searchbox" style="flex:1;max-width:none;background:#ffffff;border:1.5px solid #cbd5e1"><span class="ms">search</span><input id="asgSearch" placeholder="Buscar pasajero por DNI o nombre…" oninput="filterAssign()"></div>
      <button class="btn btn-primary" onclick="openQuickNewPassenger(${tid})" style="border-radius:12px;white-space:nowrap">
        <span class="ms">person_add</span>➕ Cargar Pasajero Nuevo
      </button>
    </div>
    ${A.pax.length ? `<div class="msel" id="asgList">${rows}</div>` : `<p class="sub-mut" style="color:#64748b">No hay pasajeros cargados aún. Usá el botón "Cargar Pasajero Nuevo" para agregar uno.</p>`}
    <p class="sub-mut" style="font-size:12.5px;margin-top:10px;color:#475569;font-weight:500">Tocá sobre los pasajeros que querés incluir en este viaje.</p>
  </div>
  <div class="modal-f">
    <button class="btn btn-ghost" onclick="openTripDetail(${tid})">Cancelar</button>
    <button class="btn btn-primary" id="asgBtn" onclick="doAssign(${tid})">Guardar Asignación</button>
  </div>`, true);
}

function openQuickNewPassenger(tid) {
  openModal(`
    <div class="modal-h">
      <h3 style="color:#0f172a;font-weight:800">➕ Cargar Pasajero Nuevo</h3>
      <button class="btn btn-icon btn-ghost" onclick="openAssignPax(${tid})"><span class="ms">close</span></button>
    </div>
    <div class="modal-b">
      <p class="sub-mut" style="margin-bottom:16px;color:#475569">Ingresá los datos del nuevo pasajero. Se guardará en la base de datos y quedará asignado al viaje automáticamente.</p>
      
      <div class="grid2">
        <div class="fg">
          <label class="fl">DNI / Documento *</label>
          <input id="qnpDni" inputmode="numeric" placeholder="Ej: 38942109" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a;font-weight:600">
        </div>
        <div class="fg">
          <label class="fl">Nombre y Apellido *</label>
          <input id="qnpName" placeholder="Ej: Sofía Martínez" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a;font-weight:600">
        </div>
      </div>

      <div class="grid2">
        <div class="fg">
          <label class="fl">Email (Opcional)</label>
          <input id="qnpEmail" type="email" placeholder="sofia@ejemplo.com" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a">
        </div>
        <div class="fg">
          <label class="fl">Teléfono / WhatsApp (Opcional)</label>
          <input id="qnpPhone" placeholder="+54 9 341 555-0192" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a">
        </div>
      </div>

      <div class="grid2">
        <div class="fg">
          <label class="fl">Ciudad / Origen (Opcional)</label>
          <input id="qnpCity" placeholder="Ej: Rosario, Santa Fe" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a">
        </div>
        <div class="fg">
          <label class="fl">Fecha Nacimiento (Opcional)</label>
          <input id="qnpBirth" type="date" style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a">
        </div>
      </div>

      <div class="fg">
        <label class="fl">Notas internas (Opcional)</label>
        <textarea id="qnpNotes" rows="2" placeholder="Ej: Pasajero frecuente, prefiere asiento en pasillo..." style="background:#ffffff;border:1.5px solid #cbd5e1;color:#0f172a"></textarea>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn btn-ghost" onclick="openAssignPax(${tid})">Volver</button>
      <button class="btn btn-primary" id="qnpBtn" onclick="doQuickNewPassenger(${tid})">Crear y Asignar al Viaje</button>
    </div>
  `, true);
}

async function doQuickNewPassenger(tid) {
  const full_name = $('qnpName').value.trim(), dni = $('qnpDni').value.trim();
  const email = $('qnpEmail').value.trim(), phone = $('qnpPhone').value.trim();
  const city = $('qnpCity').value.trim(), birth = $('qnpBirth').value;
  const notesStr = $('qnpNotes').value.trim();

  if (!full_name) { toast('Ingresá el Nombre y Apellido', 'err'); return; }
  if (!/^\d{5,}$/.test(dni)) { toast('DNI inválido (mínimo 5 números)', 'err'); return; }

  const btn = $('qnpBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const { data: ex } = await db.from('pv_profiles').select('id').eq('dni', dni).maybeSingle();
    if (ex) throw new Error('Ya existe un pasajero cargado con ese DNI');

    const auth_email = `pv-${rid()}@pasajero.corradi`, auth_pw = 'k' + rid().replace(/-/g, '');
    const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'pv_tmp_' + Date.now() } });
    const { data, error } = await tmp.auth.signUp({ email: auth_email, password: auth_pw });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear la cuenta del pasajero');

    const uid = data.user.id;
    const notesCombined = [city ? `Origen: ${city}` : '', birth ? `Nacimiento: ${birth}` : '', notesStr].filter(Boolean).join(' · ');

    const { error: pErr } = await db.from('pv_profiles').insert({
      id: uid, role: 'passenger', full_name, dni,
      email: email || null, phone: phone || null,
      notes: notesCombined || null, auth_email, auth_pw
    });
    try { await tmp.auth.signOut(); } catch (e) {}
    if (pErr) throw new Error(pErr.message);

    // Asignar al viaje
    await db.from('pv_trip_passengers').insert({ trip_id: tid, passenger_id: uid });

    toast('¡Pasajero creado y asignado al viaje! ✓', 'ok');
    await loadAll();
    openAssignPax(tid);
  } catch (e) {
    toast(e.message || 'Error al crear pasajero', 'err');
    btn.disabled = false;
    btn.textContent = 'Crear y Asignar al Viaje';
  }
}
function toggleAssign(pid, el) { if (window._assignSel.has(pid)) { window._assignSel.delete(pid); el.classList.remove('sel'); } else { window._assignSel.add(pid); el.classList.add('sel'); } }
function filterAssign() { const q = $('asgSearch').value.toLowerCase().trim(); document.querySelectorAll('#asgList .msel-row').forEach(r => { const p = A.pax.find(x => x.id === r.dataset.id); r.style.display = (!q || (p.full_name || '').toLowerCase().includes(q) || (p.dni || '').includes(q)) ? '' : 'none'; }); }
async function doAssign(tid) {
  const sel = window._assignSel, before = new Set(paxOfTrip(tid).map(p => p.id));
  const toAdd = [...sel].filter(id => !before.has(id)), toRemove = [...before].filter(id => !sel.has(id));
  const btn = $('asgBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    if (toAdd.length) { const { error } = await db.from('pv_trip_passengers').insert(toAdd.map(pid => ({ trip_id: tid, passenger_id: pid }))); if (error) throw error; }
    for (const pid of toRemove) await db.from('pv_trip_passengers').delete().eq('trip_id', tid).eq('passenger_id', pid);
    toast('Pasajeros actualizados ✓', 'ok'); await loadAll(); openTripDetail(tid);
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Guardar'; }
}
function openAttachTripLib(tid) {
  const px = paxOfTrip(tid);
  if (!px.length) { toast('El viaje no tiene pasajeros asignados', 'err'); return; }
  openModal(`<div class="modal-h"><h3>Enviar doc a los ${px.length} pasajeros</h3><button class="btn btn-icon btn-ghost" onclick="openTripDetail(${tid})"><span class="ms">close</span></button></div>
  <div class="modal-b"><p class="sub-mut" style="margin-bottom:12px">Se adjunta el mismo documento de biblioteca a todos los pasajeros del viaje.</p>
    <div class="rowlist">${A.lib.map(l => `<div class="rowitem click" onclick="doAttachTripLib(${tid}, ${l.id})"><div class="di lib" style="width:40px;height:40px;border-radius:10px;background:rgba(242,179,82,.14);color:var(--gold);display:flex;align-items:center;justify-content:center"><span class="ms">menu_book</span></div><div class="info"><div class="t">${esc(l.title)}</div><div class="s">${esc(l.category || '')}</div></div><span class="chip chip-blue">Enviar</span></div>`).join('')}</div>
  </div>`, true);
}
async function doAttachTripLib(tid, libId) {
  const l = A.lib.find(x => x.id === libId), px = paxOfTrip(tid); if (!l) return;
  const rows = px.map(p => ({ passenger_id: p.id, trip_id: tid, title: l.title, category: l.category, file_path: l.file_path, file_name: l.file_name, source: 'library', uploaded_by: me.id }));
  const { error } = await db.from('pv_documents').insert(rows);
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  toast(`Enviado a ${px.length} pasajero(s) ✓`, 'ok'); await loadAll(); openTripDetail(tid);
}

// ══════════════════════════════════════════════════════════
//  BIBLIOTECA — carpetas + arrastrar y soltar
// ══════════════════════════════════════════════════════════
let _libFolder = null;   // carpeta abierta (null = raíz)
const foldersIn = pid => (A.folders || []).filter(f => (f.parent_id || null) === (pid || null));
const filesIn = pid => (A.lib || []).filter(l => (l.folder_id || null) === (pid || null));
function folderPath(id) { const out = []; let cur = (A.folders || []).find(f => f.id === id); let guard = 0; while (cur && guard++ < 20) { out.unshift(cur); cur = (A.folders || []).find(f => f.id === cur.parent_id); } return out; }
function openFolder(id) { _libFolder = id; renderLib(); }

function renderLib() {
  const path = folderPath(_libFolder);
  $('libCrumb').innerHTML =
    `<a onclick="openFolder(null)" ondragover="fdOver(event)" ondragleave="fdLeave(event)" ondrop="fdDrop(event,null)"><span class="ms" style="font-size:17px">folder_shared</span>Biblioteca</a>` +
    path.map((f, i) => `<span class="ms" style="font-size:16px;color:var(--mut2)">chevron_right</span>` +
      (i === path.length - 1 ? `<span class="cur">${esc(f.name)}</span>`
        : `<a onclick="openFolder(${f.id})" ondragover="fdOver(event)" ondragleave="fdLeave(event)" ondrop="fdDrop(event,${f.id})">${esc(f.name)}</a>`)).join('');

  const subs = foldersIn(_libFolder), files = filesIn(_libFolder), w = $('libListWrap');
  if (!subs.length && !files.length) {
    w.innerHTML = `<div class="empty"><span class="ms">folder_open</span>${_libFolder ? 'Esta carpeta está vacía.' : 'La biblioteca está vacía.'}<br>Arrastrá archivos acá para subirlos.</div>`;
    return;
  }
  const fic = 'width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0';
  w.innerHTML = subs.map(f => {
    const n = filesIn(f.id).length + foldersIn(f.id).length;
    return `<div class="rowitem click" onclick="openFolder(${f.id})" ondragover="fdOver(event)" ondragleave="fdLeave(event)" ondrop="fdDrop(event,${f.id})">
      <div style="${fic};background:rgba(242,179,82,.14);color:var(--gold)"><span class="ms">folder</span></div>
      <div class="info"><div class="t">${esc(f.name)}</div><div class="s">${n} elemento${n === 1 ? '' : 's'}</div></div>
      <div class="end" onclick="event.stopPropagation()">
        <button class="btn btn-icon btn-ghost" title="Renombrar" onclick="renameFolder(${f.id})"><span class="ms">edit</span></button>
        <button class="btn btn-icon btn-danger" title="Eliminar carpeta" onclick="deleteFolder(${f.id})"><span class="ms">delete</span></button>
        <span class="ms" style="color:var(--mut2)">chevron_right</span>
      </div></div>`;
  }).join('') + files.map(l => `<div class="rowitem click" draggable="true" ondragstart="fileDragStart(event,${l.id})" ondragend="fileDragEnd(event)" onclick='openPreview(${JSON.stringify(l.file_path)}, ${JSON.stringify(l.title || '')})'>
      ${thumbBox(l.file_path, l.file_name || l.file_path)}
      <div class="info"><div class="t">${esc(l.title)}</div><div class="s">${esc(l.category || 'Documento')} · ${esc(fmtDate(l.created_at ? l.created_at.slice(0, 10) : ''))}</div></div>
      <div class="end" onclick="event.stopPropagation()">
        <span class="ms" style="color:var(--mut2);cursor:grab" title="Arrastralo a una carpeta">drag_indicator</span>
        <button class="btn btn-ghost btn-sm" onclick='openPreview(${JSON.stringify(l.file_path)}, ${JSON.stringify(l.title || '')})'><span class="ms">visibility</span>Ver</button>
        <button class="btn btn-icon btn-ghost" title="Renombrar" onclick="editLib(${l.id})"><span class="ms">edit</span></button>
        <button class="btn btn-icon btn-danger" title="Borrar" onclick='deleteLib(${l.id}, ${JSON.stringify(l.file_path)})'><span class="ms">delete</span></button>
      </div></div>`).join('');
  hydrateThumbs();
}

// ── Carpetas ──
function newFolder() {
  const name = prompt('Nombre de la carpeta:'); if (!name || !name.trim()) return;
  db.from('pv_lib_folders').insert({ name: name.trim(), parent_id: _libFolder }).then(async ({ error }) => {
    if (error) { toast('Error: ' + error.message, 'err'); return; }
    toast('Carpeta creada ✓', 'ok'); await loadAll(); renderLib();
  });
}
async function renameFolder(id) {
  const f = (A.folders || []).find(x => x.id === id); if (!f) return;
  const name = prompt('Nuevo nombre:', f.name); if (!name || !name.trim()) return;
  const { error } = await db.from('pv_lib_folders').update({ name: name.trim() }).eq('id', id);
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  toast('Renombrada ✓', 'ok'); await loadAll(); renderLib();
}
async function deleteFolder(id) {
  const n = filesIn(id).length + foldersIn(id).length;
  if (!confirm(n ? `La carpeta tiene ${n} elemento(s). Los documentos vuelven a la raíz de la biblioteca. ¿Eliminar la carpeta?` : '¿Eliminar la carpeta?')) return;
  await db.from('pv_library').update({ folder_id: null }).eq('folder_id', id);   // los archivos no se pierden
  await db.from('pv_lib_folders').update({ parent_id: null }).eq('parent_id', id);
  const { error } = await db.from('pv_lib_folders').delete().eq('id', id);
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  toast('Carpeta eliminada', 'ok'); await loadAll(); renderLib();
}

// ── Drag & drop ──
const hasFiles = ev => [...(ev.dataTransfer.types || [])].includes('Files');
function fileDragStart(ev, id) { window._dragLib = id; ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', 'lib:' + id); ev.currentTarget.classList.add('dragging'); }
function fileDragEnd(ev) { ev.currentTarget.classList.remove('dragging'); window._dragLib = null; document.querySelectorAll('.dropok').forEach(e => e.classList.remove('dropok')); }
function fdOver(ev) { if (!window._dragLib && !hasFiles(ev)) return; ev.preventDefault(); ev.dataTransfer.dropEffect = hasFiles(ev) ? 'copy' : 'move'; ev.currentTarget.classList.add('dropok'); }
function fdLeave(ev) { ev.currentTarget.classList.remove('dropok'); }
async function fdDrop(ev, fid) {
  ev.preventDefault(); ev.stopPropagation();
  ev.currentTarget.classList.remove('dropok'); $('libDrop').classList.remove('over');
  if (hasFiles(ev)) { await uploadFilesToLib([...ev.dataTransfer.files], fid); return; }
  const id = window._dragLib; window._dragLib = null;
  if (!id) return;
  const { error } = await db.from('pv_library').update({ folder_id: fid }).eq('id', id);
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  const f = (A.folders || []).find(x => x.id === fid);
  toast(fid ? `Movido a ${f ? f.name : 'la carpeta'} ✓` : 'Movido a Biblioteca ✓', 'ok');
  await loadAll(); renderLib();
}
function dzOver(ev) { if (!hasFiles(ev)) return; ev.preventDefault(); $('libDrop').classList.add('over'); }
function dzLeave(ev) { if (ev.currentTarget.contains(ev.relatedTarget)) return; $('libDrop').classList.remove('over'); }
async function dzDrop(ev) {
  $('libDrop').classList.remove('over');
  if (!hasFiles(ev)) return;
  ev.preventDefault();
  await uploadFilesToLib([...ev.dataTransfer.files], _libFolder);
}

// ── Subida ──
function uploadLibrary(ev) { const files = [...ev.target.files]; ev.target.value = ''; uploadFilesToLib(files, _libFolder); }
async function uploadFilesToLib(files, folderId) {
  files = files.filter(f => f && f.size);
  if (!files.length) return;
  toast(`Subiendo ${files.length} archivo${files.length === 1 ? '' : 's'}…`);
  let ok = 0;
  for (const file of files) {
    try {
      const path = await uploadFileTo('library', file);
      const { error } = await db.from('pv_library').insert({
        title: file.name.replace(/\.[^.]+$/, ''), category: guessCat(file.name),
        file_path: path, file_name: file.name, folder_id: folderId || null,
      });
      if (error) throw error;
      ok++;
    } catch (e) { toast('Error con ' + file.name + ': ' + (e.message || e), 'err'); }
  }
  if (ok) toast(`${ok} documento${ok === 1 ? '' : 's'} en la biblioteca ✓`, 'ok');
  await loadAll(); renderLib();
}
function guessCat(name) {
  const n = (name || '').toLowerCase();
  const hit = CATS.find(c => n.includes(c.toLowerCase().split(' ')[0]));
  return hit || 'Otro';
}
function editLib(id) {
  const l = A.lib.find(x => x.id === id); if (!l) return;
  const opts = [{ id: '', name: 'Biblioteca (raíz)' }, ...(A.folders || [])];
  openModal(`<div class="modal-h"><h3>Editar documento</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Título *</label><input id="elTitle" value="${esc(l.title)}"></div>
    <div class="grid2">
      <div class="fg"><label class="fl">Tipo</label><select id="elCat">${CATS.map(c => `<option ${c === l.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="fg"><label class="fl">Carpeta</label><select id="elFolder">${opts.map(f => `<option value="${f.id}" ${String(l.folder_id || '') === String(f.id) ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div>
    </div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" id="elBtn" onclick="doEditLib(${id})">Guardar</button></div>`);
}
async function doEditLib(id) {
  const title = $('elTitle').value.trim();
  if (!title) { toast('Poné un título', 'err'); return; }
  const { error } = await db.from('pv_library').update({ title, category: $('elCat').value, folder_id: $('elFolder').value || null }).eq('id', id);
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  closeModal(); toast('Guardado ✓', 'ok'); await loadAll(); renderLib();
}
async function deleteLib(id, path) {
  if (!confirm('¿Borrar de la biblioteca? (los pasajeros que ya lo tienen adjuntado lo conservan)')) return;
  await db.from('pv_library').delete().eq('id', id);
  await db.storage.from(BUCKET).remove([path]).catch(() => {});
  toast('Borrado', 'ok'); await loadAll(); renderLib();
}

// ── Go ──
// Se envuelven acá, con todas las vistas ya definidas.
_wrapModalViews();
init();
