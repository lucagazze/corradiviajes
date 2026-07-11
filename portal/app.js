// ══════════════════════════════════════════════════════════
// Portal de Pasajeros — Corradi Viajes
// ══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44';
const BUCKET = 'pv-docs';
const CATS = ['Voucher', 'Pasaporte / DNI', 'Seguro', 'Vuelos', 'Info del destino', 'Otro'];

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
function openModal(html, wide) {
  $('modalRoot').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal ${wide ? 'wide' : ''}">${html}</div></div>`;
}
function closeModal() { $('modalRoot').innerHTML = ''; }

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
  const { error } = await db.auth.signInWithPassword({ email: `${dni}@pasajero.corradi`, password: dni });
  if (error) { loginErr('DNI incorrecto o todavía no registrado. Consultá con Corradi.'); return; }
  loginErr(''); await afterLogin();
}
async function loginAdmin() {
  const email = $('admEmail').value.trim(), pass = $('admPass').value;
  if (!email || !pass) { loginErr('Completá email y contraseña.'); return; }
  loginErr('Ingresando…');
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { loginErr('Email o contraseña incorrectos.'); return; }
  loginErr(''); await afterLogin();
}
async function logout() { await db.auth.signOut(); me = null; A = {}; showLogin(); showPaxLogin(); $('dniInput').value = ''; $('admPass').value = ''; }

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
}
async function renderPassenger() {
  const [{ data: trips }, { data: docs }, { data: reqs }] = await Promise.all([
    db.from('pv_trips').select('*').order('depart_date', { nullsFirst: false }),
    db.from('pv_documents').select('*').order('created_at', { ascending: false }),
    db.from('pv_required_docs').select('*'),
  ]);
  const T = trips || [], D = docs || [], R = reqs || [];
  const myCats = new Set(D.map(d => d.category));

  // Alertas
  let alerts = '';
  T.forEach(t => {
    const du = daysUntil(t.depart_date);
    if (du !== null && du >= 0 && du <= 10) {
      alerts += `<div class="alert alert-warn"><span class="ms">flight_takeoff</span><div><div class="at">Tu viaje a ${esc(t.destination || t.title)} ${du === 0 ? 'sale hoy' : du === 1 ? 'sale mañana' : 'sale en ' + du + ' días'}</div><div class="as">Revisá que tengas toda la documentación lista.</div></div></div>`;
    }
  });
  const reqCats = [...new Set(R.map(r => r.category))];
  const missing = reqCats.filter(c => !myCats.has(c));
  if (missing.length) {
    alerts += `<div class="alert alert-red"><span class="ms">description</span><div><div class="at">Te falta subir documentación</div><div class="as">Pendiente: ${missing.map(esc).join(' · ')}. Podés subirla abajo.</div></div></div>`;
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
    const tdocs = D.filter(d => d.trip_id === t.id);
    html += `<div class="card" style="padding:18px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div class="avatar" style="background:rgba(242,179,82,.15);color:var(--gold)"><span class="ms">luggage</span></div>
        <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:17px">${esc(t.title)}</div>
          <div class="sub-mut">${esc(t.destination || '')}${t.country ? ' · ' + esc(t.country) : ''}${t.depart_date ? ' · ' + fmtDate(t.depart_date) + (t.return_date ? ' → ' + fmtDate(t.return_date) : '') : ''}</div></div>
        ${badge}
      </div>
      ${t.notes ? `<p class="sub-mut" style="margin-top:12px;white-space:pre-wrap">${esc(t.notes)}</p>` : ''}
      <div class="section-t" style="margin:16px 0 10px">Documentación de este viaje</div>
      ${tdocs.length ? `<div class="rowlist">${tdocs.map(docRow).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">Sin documentos de este viaje todavía.</p>`}
    </div>`;
  });

  const general = D.filter(d => !d.trip_id);
  html += `<div class="section-t">Otros documentos ${general.length ? '' : ''}</div>
    ${general.length ? `<div class="rowlist">${general.map(docRow).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">No hay otros documentos.</p>`}`;

  html += `<div style="margin-top:22px"><button class="btn btn-primary" onclick="paxUpload()"><span class="ms">upload</span>Subir un documento</button></div>`;
  $('paxContent').innerHTML = html;
}
function docRow(d) {
  const lib = d.source === 'library';
  return `<div class="doc"><div class="di ${lib ? 'lib' : ''}"><span class="ms">${lib ? 'menu_book' : 'description'}</span></div>
    <div class="info"><div class="t">${esc(d.title)}</div><div class="s">${esc(d.category || 'Documento')}${d.source === 'passenger' ? ' · subido por vos' : ''}</div></div>
    <button class="btn btn-ghost btn-sm" onclick="openDoc('${esc(d.file_path)}')"><span class="ms">visibility</span>Ver</button>
    ${(me.role === 'admin' || (d.source === 'passenger' && d.passenger_id === me.id)) ? `<button class="btn btn-icon btn-danger" title="Borrar" onclick='deleteDocById(${d.id}, ${JSON.stringify(d.file_path)}, "${d.source}")'><span class="ms">delete</span></button>` : ''}</div>`;
}
function paxUpload() {
  openModal(`<div class="modal-h"><h3>Subir documento</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Título</label><input id="udTitle" placeholder="Ej: Pasaporte, Seguro…"></div>
    <div class="fg"><label class="fl">Tipo</label><select id="udCat">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div class="fg"><label class="fl">Archivo (PDF o imagen)</label><input type="file" id="udFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" id="udBtn" onclick="doPaxUpload()">Subir</button></div>`);
}
async function doPaxUpload() {
  const file = $('udFile').files[0], title = $('udTitle').value.trim() || (file && file.name) || 'Documento', cat = $('udCat').value;
  if (!file) { toast('Elegí un archivo', 'err'); return; }
  const btn = $('udBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const path = await uploadFileTo(me.id, file);
    const { error } = await db.from('pv_documents').insert({ passenger_id: me.id, title, category: cat, file_path: path, file_name: file.name, source: 'passenger', uploaded_by: me.id });
    if (error) throw error;
    closeModal(); toast('Documento subido ✓', 'ok'); renderPassenger();
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Subir'; }
}
async function deleteDocById(id, file_path, source) {
  if (!confirm('¿Borrar este documento?')) return;
  await db.from('pv_documents').delete().eq('id', id);
  if (source !== 'library') { await db.storage.from(BUCKET).remove([file_path]).catch(() => {}); }
  toast('Documento borrado', 'ok');
  if (me.role === 'admin') { await loadAll(); const pid = window._openPax; if (pid) openPassengerDetail(pid); } else renderPassenger();
}

// ══════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════
async function startAdmin() {
  $('appAdmin').classList.remove('hidden'); $('appPassenger').classList.add('hidden');
  await loadAll(); adminView('dashboard');
}
async function loadAll() {
  const [pax, trips, tp, docs, lib, reqs] = await Promise.all([
    db.from('pv_profiles').select('*').eq('role', 'passenger').order('full_name'),
    db.from('pv_trips').select('*').order('depart_date', { nullsFirst: false }),
    db.from('pv_trip_passengers').select('*'),
    db.from('pv_documents').select('*').order('created_at', { ascending: false }),
    db.from('pv_library').select('*').order('created_at', { ascending: false }),
    db.from('pv_required_docs').select('*'),
  ]);
  A = { pax: pax.data || [], trips: trips.data || [], tp: tp.data || [], docs: docs.data || [], lib: lib.data || [], reqs: reqs.data || [] };
}
function adminView(v) {
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
    al += `<div class="section-t">Pasajeros con documentación faltante</div>`;
    missingPax.forEach(p => {
      al += `<div class="alert alert-red"><span class="ms">person</span><div style="flex:1"><div class="at">${esc(p.full_name)} <span class="sub-mut">(DNI ${esc(p.dni)})</span></div><div class="as">Falta: ${missingForPax(p.id).map(esc).join(' · ')}</div></div><button class="btn btn-ghost btn-sm" onclick="openPassengerDetail('${p.id}')">Ver</button></div>`;
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
    // crear usuario auth en cliente aislado (no toca la sesión del admin)
    const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'pv_tmp_' + Date.now() } });
    const { data, error } = await tmp.auth.signUp({ email: `${dni}@pasajero.corradi`, password: dni });
    if (error) throw new Error(error.message.includes('already') ? 'Ya existe un usuario con ese DNI' : error.message);
    if (!data.user || (data.user.identities && data.user.identities.length === 0)) throw new Error('Ya existe un pasajero con ese DNI');
    const uid = data.user.id;
    const { error: pErr } = await db.from('pv_profiles').insert({ id: uid, role: 'passenger', full_name, dni, email: email || null, phone: phone || null });
    try { await tmp.auth.signOut(); } catch (e) {}
    if (pErr) throw new Error(pErr.message);
    closeModal(); toast('Pasajero creado ✓', 'ok'); await loadAll(); renderPaxList();
  } catch (e) { toast(e.message || 'Error al crear', 'err'); btn.disabled = false; btn.textContent = 'Crear pasajero'; }
}
function openPassengerDetail(pid) {
  window._openPax = pid;
  const p = A.pax.find(x => x.id === pid); if (!p) return;
  const trips = tripsOfPax(pid), docs = docsOfPax(pid), miss = missingForPax(pid);
  const html = `<div class="modal-h"><div class="avatar">${esc(initials(p.full_name))}</div><h3 style="flex:1">${esc(p.full_name)}</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="sub-mut" style="margin-bottom:14px">DNI ${esc(p.dni)}${p.email ? ' · ' + esc(p.email) : ''}${p.phone ? ' · ' + esc(p.phone) : ''}</div>
    ${miss.length ? `<div class="alert alert-red" style="margin-bottom:14px"><span class="ms">warning</span><div><div class="at">Falta documentación</div><div class="as">${miss.map(esc).join(' · ')}</div></div></div>` : ''}
    <div class="section-t" style="margin-top:0">Viajes asignados</div>
    ${trips.length ? `<div class="rowlist">${trips.map(t => `<div class="rowitem"><div class="info"><div class="t">${esc(t.title)}</div><div class="s">${esc(t.destination || '')}${t.depart_date ? ' · ' + fmtDate(t.depart_date) : ''}</div></div></div>`).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">Sin viajes. Asignalo desde la pestaña Viajes.</p>`}
    <div class="section-t">Documentación (${docs.length})</div>
    ${docs.length ? `<div class="rowlist">${docs.map(docRow).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">Sin documentos.</p>`}
  </div>
  <div class="modal-f" style="flex-wrap:wrap">
    <button class="btn btn-ghost" onclick="openAttachLibrary('${pid}')"><span class="ms">library_add</span>Adjuntar de biblioteca</button>
    <button class="btn btn-primary" onclick="openUploadForPax('${pid}')"><span class="ms">upload</span>Subir documento</button>
  </div>`;
  openModal(html, true);
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
      <div class="avatar" style="background:rgba(242,179,82,.15);color:var(--gold)"><span class="ms">luggage</span></div>
      <div class="info"><div class="t">${esc(t.title)}</div><div class="s">${esc(t.destination || '')}${t.depart_date ? ' · ' + fmtDate(t.depart_date) : ''}</div></div>
      <div class="end">${badge}<span class="chip chip-mut">${px.length} pax</span><span class="ms" style="color:var(--mut2)">chevron_right</span></div></div>`;
  }).join('');
}
function openNewTrip(edit) {
  const t = edit ? A.trips.find(x => x.id === edit) : null;
  openModal(`<div class="modal-h"><h3>${t ? 'Editar viaje' : 'Nuevo viaje'}</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Título del viaje *</label><input id="ntTitle" value="${esc(t?.title || '')}" placeholder="Ej: Madrid — Marzo 2027"></div>
    <div class="grid2"><div class="fg"><label class="fl">Destino</label><input id="ntDest" value="${esc(t?.destination || '')}" placeholder="Ciudad"></div>
    <div class="fg"><label class="fl">País</label><input id="ntCountry" value="${esc(t?.country || '')}" placeholder="País"></div></div>
    <div class="grid2"><div class="fg"><label class="fl">Fecha de salida</label><input id="ntDep" type="date" value="${t?.depart_date || ''}"></div>
    <div class="fg"><label class="fl">Fecha de regreso</label><input id="ntRet" type="date" value="${t?.return_date || ''}"></div></div>
    <div class="fg"><label class="fl">Notas (opcional)</label><textarea id="ntNotes" rows="3" placeholder="Info del viaje…">${esc(t?.notes || '')}</textarea></div>
    <div class="fg"><label class="fl">Documentación requerida a los pasajeros</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${CATS.map(c => `<label class="chip chip-mut" style="cursor:pointer;user-select:none"><input type="checkbox" class="ntReq" value="${c}" style="width:auto;margin-right:6px;vertical-align:-2px" ${t && A.reqs.some(r => r.trip_id === t.id && r.category === c) ? 'checked' : ''}>${c}</label>`).join('')}</div>
    </div>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" id="ntBtn" onclick="doSaveTrip(${t ? t.id : 'null'})">${t ? 'Guardar' : 'Crear viaje'}</button></div>`);
}
async function doSaveTrip(id) {
  const payload = {
    title: $('ntTitle').value.trim(), destination: $('ntDest').value.trim() || null, country: $('ntCountry').value.trim() || null,
    depart_date: $('ntDep').value || null, return_date: $('ntRet').value || null, notes: $('ntNotes').value.trim() || null,
  };
  if (!payload.title) { toast('Poné un título', 'err'); return; }
  const reqCats = [...document.querySelectorAll('.ntReq:checked')].map(c => c.value);
  const btn = $('ntBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    let tripId = id;
    if (id) { const { error } = await db.from('pv_trips').update(payload).eq('id', id); if (error) throw error; }
    else { const { data, error } = await db.from('pv_trips').insert(payload).select().single(); if (error) throw error; tripId = data.id; }
    // required docs: reset
    await db.from('pv_required_docs').delete().eq('trip_id', tripId);
    if (reqCats.length) await db.from('pv_required_docs').insert(reqCats.map(c => ({ trip_id: tripId, category: c })));
    closeModal(); toast('Viaje guardado ✓', 'ok'); await loadAll(); renderTripList();
    if (id) openTripDetail(tripId);
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Guardar'; }
}
function openTripDetail(tid) {
  const t = A.trips.find(x => x.id === tid); if (!t) return;
  const px = paxOfTrip(tid), req = A.reqs.filter(r => r.trip_id === tid).map(r => r.category);
  const du = daysUntil(t.depart_date);
  const html = `<div class="modal-h"><div class="avatar" style="background:rgba(242,179,82,.15);color:var(--gold)"><span class="ms">luggage</span></div><h3 style="flex:1">${esc(t.title)}</h3>
    <button class="btn btn-icon btn-ghost" title="Editar" onclick="openNewTrip(${tid})"><span class="ms">edit</span></button>
    <button class="btn btn-icon btn-danger" title="Eliminar" onclick="deleteTrip(${tid})"><span class="ms">delete</span></button>
    <button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="sub-mut" style="margin-bottom:6px">${esc(t.destination || '')}${t.country ? ' · ' + esc(t.country) : ''}</div>
    <div class="sub-mut">${t.depart_date ? 'Salida ' + fmtDate(t.depart_date) : 'Sin fecha'}${t.return_date ? ' → ' + fmtDate(t.return_date) : ''}${du !== null && du >= 0 && du <= 10 ? ` · <span style="color:var(--gold);font-weight:700">sale en ${du} día(s)</span>` : ''}</div>
    ${t.notes ? `<p class="sub-mut" style="margin-top:10px;white-space:pre-wrap">${esc(t.notes)}</p>` : ''}
    ${req.length ? `<div class="section-t">Documentación requerida</div><div style="display:flex;flex-wrap:wrap;gap:7px">${req.map(c => `<span class="chip chip-blue">${esc(c)}</span>`).join('')}</div>` : ''}
    <div class="section-t">Pasajeros (${px.length})</div>
    ${px.length ? `<div class="rowlist">${px.map(p => { const m = missingForPax(p.id).length; return `<div class="rowitem"><div class="avatar">${esc(initials(p.full_name))}</div><div class="info click" onclick="openPassengerDetail('${p.id}')"><div class="t">${esc(p.full_name)}</div><div class="s">DNI ${esc(p.dni)}${m ? ' · ⚠ ' + m + ' doc. pendiente(s)' : ''}</div></div><button class="btn btn-icon btn-danger" title="Quitar del viaje" onclick="removePaxFromTrip(${tid},'${p.id}')"><span class="ms">person_remove</span></button></div>`; }).join('')}</div>` : `<p class="sub-mut" style="font-size:13px">Sin pasajeros asignados.</p>`}
  </div>
  <div class="modal-f" style="flex-wrap:wrap">
    ${A.lib.length ? `<button class="btn btn-ghost" onclick="openAttachTripLib(${tid})"><span class="ms">library_add</span>Enviar doc de biblioteca a todos</button>` : ''}
    <button class="btn btn-primary" onclick="openAssignPax(${tid})"><span class="ms">group_add</span>Asignar pasajeros</button>
  </div>`;
  openModal(html, true);
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
  const rows = A.pax.map(p => `<div class="msel-row ${assigned.has(p.id) ? 'sel' : ''}" data-id="${p.id}" onclick="toggleAssign('${p.id}',this)"><div class="cb"><span class="ms">check</span></div><div class="avatar" style="width:34px;height:34px;font-size:13px">${esc(initials(p.full_name))}</div><div style="flex:1;min-width:0"><div style="font-weight:600">${esc(p.full_name)}</div><div class="sub-mut" style="font-size:12px">DNI ${esc(p.dni)}</div></div></div>`).join('');
  openModal(`<div class="modal-h"><h3>Asignar pasajeros</h3><button class="btn btn-icon btn-ghost" onclick="openTripDetail(${tid})"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="searchbox" style="max-width:none;margin-bottom:12px"><span class="ms">search</span><input id="asgSearch" placeholder="Buscar pasajero…" oninput="filterAssign()"></div>
    ${A.pax.length ? `<div class="msel" id="asgList">${rows}</div>` : `<p class="sub-mut">No hay pasajeros. Creá pasajeros primero.</p>`}
    <p class="sub-mut" style="font-size:12.5px;margin-top:10px">Tocá los pasajeros que van en este viaje.</p>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="openTripDetail(${tid})">Cancelar</button><button class="btn btn-primary" id="asgBtn" onclick="doAssign(${tid})">Guardar</button></div>`, true);
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

// ── Biblioteca ──
function renderLib() {
  const w = $('libListWrap');
  if (!A.lib.length) { w.innerHTML = `<div class="empty"><span class="ms">folder_open</span>Biblioteca vacía. Subí documentos reutilizables.</div>`; return; }
  w.innerHTML = A.lib.map(l => `<div class="rowitem"><div class="di lib" style="width:44px;height:44px;border-radius:12px;background:rgba(242,179,82,.14);color:var(--gold);display:flex;align-items:center;justify-content:center"><span class="ms">menu_book</span></div>
    <div class="info"><div class="t">${esc(l.title)}</div><div class="s">${esc(l.category || 'Documento')} · ${fmtDate(l.created_at ? l.created_at.slice(0, 10) : '')}</div></div>
    <div class="end"><button class="btn btn-ghost btn-sm" onclick="openDoc('${esc(l.file_path)}')"><span class="ms">visibility</span>Ver</button><button class="btn btn-icon btn-danger" onclick="deleteLib(${l.id},'${esc(l.file_path)}')"><span class="ms">delete</span></button></div></div>`).join('');
}
let _pendingLibFile = null;
function uploadLibrary(ev) {
  const file = ev.target.files[0]; if (!file) return; _pendingLibFile = file; ev.target.value = '';
  openModal(`<div class="modal-h"><h3>Nuevo documento de biblioteca</h3><button class="btn btn-icon btn-ghost" onclick="closeModal()"><span class="ms">close</span></button></div>
  <div class="modal-b">
    <div class="fg"><label class="fl">Título *</label><input id="lbTitle" value="${esc(file.name.replace(/\.[^.]+$/, ''))}"></div>
    <div class="fg"><label class="fl">Tipo</label><select id="lbCat">${CATS.map(c => `<option ${c === 'Info del destino' ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <p class="sub-mut" style="font-size:12.5px">Archivo: ${esc(file.name)}</p>
  </div>
  <div class="modal-f"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" id="lbBtn" onclick="doUploadLibrary()">Subir</button></div>`);
}
async function doUploadLibrary() {
  const file = _pendingLibFile, title = $('lbTitle').value.trim(), cat = $('lbCat').value;
  if (!file) { toast('Elegí un archivo', 'err'); return; }
  if (!title) { toast('Poné un título', 'err'); return; }
  const btn = $('lbBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const path = await uploadFileTo('library', file);
    const { error } = await db.from('pv_library').insert({ title, category: cat, file_path: path, file_name: file.name });
    if (error) throw error;
    _pendingLibFile = null; closeModal(); toast('Subido a biblioteca ✓', 'ok'); await loadAll(); renderLib();
  } catch (e) { toast('Error: ' + (e.message || e), 'err'); btn.disabled = false; btn.textContent = 'Subir'; }
}
async function deleteLib(id, path) {
  if (!confirm('¿Borrar de la biblioteca? (los que ya lo tienen adjuntado lo conservan)')) return;
  await db.from('pv_library').delete().eq('id', id);
  await db.storage.from(BUCKET).remove([path]).catch(() => {});
  toast('Borrado', 'ok'); await loadAll(); renderLib();
}

// ── Go ──
init();
