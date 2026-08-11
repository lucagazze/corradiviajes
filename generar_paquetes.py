"""Pre-genera una pagina estatica por paquete: paquete/<slug>.html

Por que existe esto
-------------------
paquete.html es una sola pagina que carga el paquete por JS desde Supabase. En
el HTML servido los 30 paquetes eran identicos: mismo <title>, misma
description y mismo canonical. Google los veia como 30 copias de la misma
pagina y no indexaba casi ninguna. Los scrapers sociales (WhatsApp, Facebook,
Twitter) directamente nunca ejecutan JS, asi que todos los previews de link
mostraban "Detalle del Paquete".

Este script escribe un archivo por paquete con el <head> real ya resuelto y un
bloque de contenido legible sin JS. El JS despues hidrata la pagina igual que
siempre y borra ese bloque.

Que toca
--------
  paquete/<slug>.html   una por paquete activo
  js/slugs.js           mapa id -> slug para los links de las tarjetas
  slugs.json            mapa congelado (versionado en git)
  vercel.json           bloque "redirects": /paquete?id=N -> /paquete/<slug>
  sitemap.xml           delegado en generar_sitemap.py

Correr despues de cualquier alta, baja o cambio de paquete en el admin:
    python -u generar_paquetes.py
"""
import html
import json
import pathlib
import re
import shutil
import sys
import urllib.request
from datetime import date

import slugs as slugmap

sys.stdout.reconfigure(encoding="utf-8")

SITE = "https://www.corradiviajes.com.ar"
SUPABASE = "https://czocbnyoenjbpxmcqobn.supabase.co"
KEY = "sb_publishable_qqTTCyfpaM3SIM15AH_O8Q_fPoHatiI"
ROOT = pathlib.Path(__file__).parent
SALIDA = ROOT / "paquete"

CATEGORIAS = {
    "europa": "Europa", "caribe": "Caribe", "america_del_sur": "América del Sur",
    "asia": "Asia", "africa": "África", "oceania": "Oceanía",
    "norteamerica": "Norteamérica", "nacional": "Argentina",
    "brasil": "Brasil", "internacional": "Internacional",
}


# ── helpers de texto ────────────────────────────────────────────────────────

def texto_plano(valor):
    """Saca etiquetas y entidades. 4 descripciones vienen con <p> del admin."""
    t = re.sub(r"<[^>]+>", " ", str(valor or ""))
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def esc(valor):
    return html.escape(str(valor or ""), quote=True)


def lineas(valor):
    """Replica parseLines() del front: acepta JSON array o texto con saltos."""
    if not valor:
        return []
    if isinstance(valor, list):
        return [str(v).strip() for v in valor if str(v).strip()]
    txt = str(valor)
    try:
        arr = json.loads(txt)
        if isinstance(arr, list):
            return [str(v).strip() for v in arr if str(v).strip()]
    except (ValueError, TypeError):
        pass
    return [re.sub(r"^[•\-\*]\s*", "", l).strip()
            for l in txt.split("\n") if l.strip()]


def itinerario(valor):
    if not valor:
        return []
    dias = valor
    if isinstance(dias, str):
        try:
            dias = json.loads(dias)
        except ValueError:
            return []
    if not isinstance(dias, list):
        return []
    return [d for d in dias if isinstance(d, dict)]


# ── textos SEO ──────────────────────────────────────────────────────────────

MARCA = " | Corradi Viajes"
TITLE_MAX = 65        # Google corta el title alrededor de 60-65 caracteres


def armar_title(pkg, sufijo=""):
    """El title mas completo que entre en TITLE_MAX, sin perder nunca la marca.

    `sufijo` lo usa main() para desambiguar dos paquetes que generarian el
    mismo title (hoy: ids 96 y 111, el mismo hotel de Punta Cana cargado dos
    veces con distinta ciudad de salida).

    Se prueban variantes de mas a menos informacion y gana la primera que
    entra. Antes esto concatenaba todo y, si no entraba, devolvia el string
    sin marca — que podia ser MAS largo que el limite: varios paquetes tienen
    un destination con lista de ciudades y salian titles de 128 caracteres,
    truncados en el SERP y en el preview de WhatsApp, y encima sin marca.
    """
    nombre = str(pkg.get("name") or "").strip()
    # El sufijo va aparte y no se recorta nunca: es lo unico que distingue este
    # title del de otro paquete, asi que perderlo al truncar devolveria los dos
    # titles duplicados, que es justo lo que se quiere evitar.
    extra = f" {sufijo}".rstrip() if sufijo else ""
    if extra:
        extra = " " + extra.strip()
    # destination a veces trae "Beijing, Xian, Chengdu, ..." — alcanza el primero
    lugar = str(pkg.get("destination") or pkg.get("country") or "").split(",")[0].strip()
    dias = pkg.get("days")

    con_lugar = lugar and lugar.lower() not in nombre.lower()
    # \b y no substring: con days=6 y nombre "Ski 2026", el 6 de 2026 hacia
    # creer que la duracion ya estaba y se perdia la keyword "6 días"
    con_dias = dias and not re.search(rf"\b{dias}\b", nombre)

    candidatos = []
    if con_lugar and con_dias:
        candidatos.append(f"{nombre}{extra} — {lugar}, {dias} días")
    if con_lugar:
        candidatos.append(f"{nombre}{extra} — {lugar}")
    if con_dias:
        candidatos.append(f"{nombre}{extra}, {dias} días")
    candidatos.append(f"{nombre}{extra}")

    for base in candidatos:
        if len(base) + len(MARCA) <= TITLE_MAX:
            return base + MARCA

    # Ni el nombre solo entra: recortar el nombre sin partir palabras,
    # conservando el sufijo desambiguador y la marca
    tope = max(TITLE_MAX - len(MARCA) - len(extra) - 1, 15)
    corto = nombre[:tope].rsplit(" ", 1)[0].rstrip(" ,—–-")
    return f"{corto}…{extra}{MARCA}"


def armar_desc(pkg):
    """OJO: sin precio, a proposito.

    Esto se congela en el HTML al generar, pero el precio que ve el usuario lo
    trae el JS en vivo desde Supabase. Si el cliente lo cambia en el admin y
    nadie regenera, el HTML servido (y por lo tanto Google y el preview de
    WhatsApp) anunciaria un precio que ya no es. Mas vale no prometer precio
    que prometer uno viejo.
    """
    lugar = pkg.get("destination") or pkg.get("country") or pkg.get("name")
    partes = [f"Viajá a {lugar} con Corradi Viajes, agencia de Rosario."]
    if pkg.get("days"):
        partes.append(f"{pkg['days']} días")
    if pkg.get("departure_city"):
        partes.append(f"salida desde {pkg['departure_city']}")
    cuerpo = texto_plano(pkg.get("description"))
    if cuerpo:
        partes.append(cuerpo)
    desc = " · ".join(partes)
    if len(desc) <= 158:
        return desc
    return desc[:157].rsplit(" ", 1)[0] + "…"


def json_ld(pkg, url, sufijo=""):
    """Sin nodo `offers`, a proposito.

    Un Offer horneado en build declara un precio que solo se actualiza cuando
    alguien vuelve a correr este script. Si el cliente lo cambia en el admin,
    el structured data pasa a contradecir el precio que la pagina muestra en
    pantalla, y eso es causal documentada de accion manual de Google por spam
    de datos estructurados. Ademas hoy 27 de 30 paquetes tienen price_usd = 0,
    asi que el rich snippet de precio se perderia igual en casi todos.
    """
    lugar = pkg.get("destination") or pkg.get("country") or ""
    ld = {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": (pkg.get("name") + " " + sufijo).strip() if sufijo else pkg.get("name"),
        "description": armar_desc(pkg),
        "url": url,
        "image": pkg.get("image_url") or f"{SITE}/assets/logo.png",
        "provider": {"@type": "TravelAgency", "@id": f"{SITE}/#agency",
                     "name": "Corradi Viajes"},
    }
    if lugar:
        ld["itinerary"] = {"@type": "Place", "name": lugar}
    return ld


def bloque_head(pkg, url, sufijo=""):
    t, d = armar_title(pkg, sufijo), armar_desc(pkg)
    img = pkg.get("image_url") or f"{SITE}/assets/logo.png"
    ld = json.dumps(json_ld(pkg, url, sufijo), ensure_ascii=False,
                    separators=(",", ":"))
    return f"""<title>{esc(t)}</title>
<meta name="description" content="{esc(d)}">
<meta name="author" content="Corradi Viajes">
<meta name="robots" content="index, follow">
<meta name="language" content="Spanish">
<link rel="canonical" href="{esc(url)}">
<!-- Open Graph / Facebook -->
<meta property="og:type" content="product">
<meta property="og:site_name" content="Corradi Viajes">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="{esc(url)}">
<meta property="og:title" content="{esc(t)}">
<meta property="og:description" content="{esc(d)}">
<meta property="og:image" content="{esc(img)}">
<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="{esc(url)}">
<meta property="twitter:title" content="{esc(t)}">
<meta property="twitter:description" content="{esc(d)}">
<meta property="twitter:image" content="{esc(img)}">
<script type="application/ld+json" data-pkg>{ld}</script>"""


# ── bloque visible sin JS ───────────────────────────────────────────────────

def bloque_seo(pkg, url, vecinos):
    """Contenido real en el HTML servido, con estilos propios porque Tailwind
    llega por CDN y todavia no pinto. El JS lo elimina al hidratar, asi que no
    hace falta replicar el markup del front ni queda duplicado en pantalla."""
    lugar = pkg.get("destination") or pkg.get("country") or ""
    partes = [f'<h1>{esc(pkg.get("name"))}</h1>']

    # Sin precio: es el unico dato que puede quedar viejo entre dos corridas del
    # generador, y aca convivira en pantalla con el precio en vivo que pinta el
    # JS. Ver el docstring de armar_desc().
    meta = []
    if lugar:
        meta.append(esc(lugar))
    if pkg.get("days"):
        meta.append(f'{esc(pkg["days"])} días')
    if pkg.get("departure_city"):
        meta.append(f'salida desde {esc(pkg["departure_city"])}')
    if meta:
        partes.append(f'<p class="seo-meta">{" · ".join(meta)}</p>')

    cuerpo = texto_plano(pkg.get("description"))
    if cuerpo:
        partes.append(f"<p>{esc(cuerpo)}</p>")

    inc = lineas(pkg.get("includes"))
    if inc:
        items = "".join(f"<li>{esc(l)}</li>" for l in inc)
        partes.append(f"<h2>Qué incluye</h2><ul>{items}</ul>")

    exc = lineas(pkg.get("excludes"))
    if exc:
        items = "".join(f"<li>{esc(l)}</li>" for l in exc)
        partes.append(f"<h2>No incluye</h2><ul>{items}</ul>")

    dias = itinerario(pkg.get("itinerary"))
    if dias:
        bloques = "".join(
            f'<h3>{esc(d.get("day"))}</h3>'
            f'<p>{esc(texto_plano(d.get("desc") or d.get("description")))}</p>'
            for d in dias)
        partes.append(f"<h2>Itinerario</h2>{bloques}")

    # Enlaces reales: hasta este cambio el sitio no tenia ni un <a> hacia el
    # detalle de un paquete, asi que Google solo llegaba por el sitemap.
    otros = "".join(
        f'<li><a href="/paquete/{v["slug"]}">{esc(v["name"])}</a></li>'
        for v in vecinos)
    partes.append(
        '<h2>Otros paquetes</h2><ul class="seo-links">' + otros + "</ul>"
        '<p class="seo-links"><a href="/">Inicio</a> · '
        '<a href="/ofertas">Ofertas</a> · '
        '<a href="/salidas-grupales">Salidas grupales</a> · '
        '<a href="/contacto">Contacto</a></p>')

    return ('<div id="seoPrerender">\n  <div class="seo-wrap">\n    '
            + "\n    ".join(partes) + "\n  </div>\n</div>")


CSS_SEO = """
<style id="seoPrerenderCss">
  /* Estilos propios: Tailwind entra por CDN y todavia no aplico cuando esto se
     pinta. El bloque lo borra el JS apenas hidrata la pagina real.

     Los colores van con !important y duplicados por tema porque css/theme.css
     declara `html[data-theme="light"] h1,h2,h3,h4 { color:#0f172a !important }`
     y le ganaba a este bloque por especificidad: el titulo del paquete quedaba
     #0f172a sobre un fondo #0e1620 (contraste 1.02:1, ilegible) durante toda la
     espera de Supabase. Y el tema por defecto del sitio es el claro, asi que le
     pegaba a todo el trafico nuevo. */
  #seoPrerender { font-family:'Geomanist','Plus Jakarta Sans',system-ui,sans-serif;
    padding:96px 20px 64px; min-height:100vh;
    background:#ffffff !important; color:#334155 !important; }
  #seoPrerender .seo-wrap { max-width:760px; margin:0 auto; }
  #seoPrerender h1 { font-size:30px; line-height:1.2; font-weight:700;
    margin:0 0 10px; color:#0f172a !important; }
  #seoPrerender h2 { font-size:19px; font-weight:600; margin:32px 0 10px;
    color:#0f172a !important; }
  #seoPrerender h3 { font-size:15px; font-weight:600; margin:20px 0 4px;
    color:#1d5f96 !important; }
  #seoPrerender p { line-height:1.75; margin:0 0 12px; font-size:15px; }
  #seoPrerender .seo-meta { font-weight:500; color:#1d5f96 !important; }
  #seoPrerender ul { margin:0 0 12px; padding-left:20px; }
  #seoPrerender li { line-height:1.7; margin-bottom:5px; font-size:15px; }
  #seoPrerender a { color:#1d5f96 !important; }
  #seoPrerender .seo-links { font-size:14px; }

  html[data-theme="dark"] #seoPrerender {
    background:#0e1620 !important; color:rgba(255,255,255,.92) !important; }
  html[data-theme="dark"] #seoPrerender h1,
  html[data-theme="dark"] #seoPrerender h2 { color:#ffffff !important; }
  html[data-theme="dark"] #seoPrerender h3,
  html[data-theme="dark"] #seoPrerender .seo-meta,
  html[data-theme="dark"] #seoPrerender a { color:#7ab3e0 !important; }
</style>
"""


# ── reescritura de rutas ────────────────────────────────────────────────────

_ATTR = re.compile(r'\b(src|href)="(?!https?:|//|/|#|data:|mailto:|tel:|javascript:)([^"]+)"')
_CSSURL = re.compile(r"url\((['\"]?)(?!https?:|//|/|data:)([^)'\"]+)\1\)")
_SCRIPT = re.compile(r"(<script\b[^>]*>)(.*?)(</script>)", re.S)


def absolutizar(doc):
    """Las paginas generadas viven un nivel abajo (/paquete/<slug>), asi que
    toda ruta relativa del template (css/, js/, assets/, las .woff del
    @font-face) apuntaria a /paquete/... y daria 404.

    Se reescribe todo MENOS el cuerpo de los <script>: ahi adentro hay markup
    armado con template literals (src="${u}") y la regex, que no puede saber
    que ${u} ya trae una URL absoluta, lo dejaba en src="/${u}" y rompia la
    galeria. El tag de apertura si se reescribe, porque es donde vive el
    src="js/config.js" de los scripts externos.
    """
    def fix(txt):
        txt = _ATTR.sub(lambda m: f'{m.group(1)}="/{m.group(2)}"', txt)
        return _CSSURL.sub(lambda m: f"url({m.group(1)}/{m.group(2)}{m.group(1)})",
                           txt)

    # split con 3 grupos -> [texto, apertura, cuerpo, cierre, texto, ...]
    partes = _SCRIPT.split(doc)
    for i in range(len(partes)):
        if i % 4 in (0, 1):        # texto suelto y tag de apertura
            partes[i] = fix(partes[i])
    return "".join(partes)


# ── generacion ──────────────────────────────────────────────────────────────

def traer_paquetes():
    url = (f"{SUPABASE}/rest/v1/corradi_packages"
           "?select=*&active=eq.true&order=sort_order")
    req = urllib.request.Request(url)
    req.add_header("apikey", KEY)
    req.add_header("User-Agent", "curl/8.7.1")
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode())


def render(template, pkg, slug, vecinos, sufijo="", canonical=None):
    url = f"{SITE}/paquete/{slug}"
    # canonical distinto de la propia URL = esta pagina es un duplicado y le
    # cede las senales a la principal
    canon = canonical or url

    doc = re.sub(r"<!-- SEO:START.*?SEO:END -->",
                 lambda _: bloque_head(pkg, canon, sufijo), template, flags=re.S)
    doc = absolutizar(doc)

    # El spinner sobra: la pagina ya trae contenido. Se fusiona en el class que
    # ya existe (dos atributos class -> el parser descarta el segundo) y ademas
    # va display:none inline, porque .hidden la genera el CDN de Tailwind en
    # runtime y hasta que no baja habria un flash del spinner.
    doc = doc.replace('<div id="loadingState" class="',
                      '<div id="loadingState" style="display:none" class="hidden ',
                      1)
    doc = doc.replace('<main id="mainContainer" class="hidden',
                      f'<main id="mainContainer" data-pkg-id="{pkg["id"]}" '
                      f'data-pkg-slug="{esc(slug)}" class="hidden', 1)
    doc = doc.replace("</head>", CSS_SEO + "</head>", 1)
    doc = doc.replace('<main id="mainContainer"',
                      bloque_seo(pkg, url, vecinos) + '\n<main id="mainContainer"', 1)
    return doc


def escribir_redirects(mapa_vivos):
    """/paquete?id=82 -> /paquete/<slug>, 301.

    El sufijo "?id=" del destination NO es un typo: Vercel re-appendea la query
    original al Location, asi que sin eso el redirect termina en
    /paquete/<slug>?id=82 — una URL sucia, indexable y duplicada de la limpia.
    Vaciando el parametro se elimina, y las UTMs que vengan se conservan.
    """
    vj = ROOT / "vercel.json"
    cfg = json.loads(vj.read_text(encoding="utf-8"))
    cfg["redirects"] = [
        {"source": "/paquete",
         "has": [{"type": "query", "key": "id", "value": str(pid)}],
         "destination": f"/paquete/{slug}?id=",
         "statusCode": 301}
        for pid, slug in sorted(mapa_vivos.items())
    ]
    vj.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n",
                  encoding="utf-8")
    return len(cfg["redirects"])


def main():
    hoy = date.today().isoformat()
    pkgs = traer_paquetes()
    vivos = [p for p in pkgs
             if not p.get("expires_at") or p["expires_at"] >= hoy]

    mapa, nuevos = slugmap.resolver(pkgs)      # incluye vencidos: el slug no se recicla
    slugmap.guardar(mapa)
    slugmap.escribir_js(mapa, ROOT / "js" / "slugs.js")

    template = (ROOT / "paquete.html").read_text(encoding="utf-8")
    if "SEO:START" not in template:
        sys.exit("ERROR: paquete.html perdio los marcadores SEO:START/SEO:END")

    # Se borra y se rehace: si un paquete se desactiva, su archivo tiene que
    # desaparecer del deploy o queda una pagina huerfana viva para siempre.
    if SALIDA.exists():
        shutil.rmtree(SALIDA)
    SALIDA.mkdir()

    resumen = [{"id": p["id"], "slug": mapa[p["id"]], "name": p["name"]}
               for p in vivos]

    # Dos paquetes con el mismo title son dos paginas que compiten entre si en
    # Google. Hoy pasa con los ids 96 y 111: el mismo hotel de Punta Cana
    # cargado dos veces. Primero se intenta distinguirlos por ciudad de salida;
    # si ni eso alcanza (es el caso: las dos salen de Cordoba) son duplicados de
    # verdad, y se consolidan apuntando el canonical del secundario al
    # principal. La pagina sigue viva y navegable, pero las senales se suman en
    # una sola URL en vez de repartirse.
    por_title = {}
    for p in vivos:
        por_title.setdefault(armar_title(p), []).append(p)

    sufijos, canonicos, chocados, duplicados = {}, {}, [], []
    for grupo in por_title.values():
        if len(grupo) < 2:
            continue
        chocados.append([p["id"] for p in grupo])
        for p in grupo:
            ciudad = str(p.get("departure_city") or "").split(",")[0].strip()
            if ciudad:
                sufijos[p["id"]] = f"desde {ciudad}"
        # ¿alcanzo el sufijo para que los titles queden distintos?
        titles = {armar_title(p, sufijos.get(p["id"], "")) for p in grupo}
        if len(titles) == len(grupo):
            continue
        for p in grupo:
            sufijos.pop(p["id"], None)
        # principal = el que el cliente muestra mas arriba en el listado
        principal = sorted(grupo, key=lambda p: (p.get("sort_order") or 999,
                                                 -p["id"]))[0]
        for p in grupo:
            if p["id"] != principal["id"]:
                canonicos[p["id"]] = f"{SITE}/paquete/{mapa[principal['id']]}"
        duplicados.append((principal["id"], [p["id"] for p in grupo
                                             if p["id"] != principal["id"]]))

    for i, p in enumerate(vivos):
        # 6 vecinos rotando: reparte enlaces internos sin que todos apunten
        # siempre a los mismos paquetes
        vecinos = [resumen[(i + k) % len(resumen)] for k in range(1, 7)
                   if len(resumen) > 1]
        slug = mapa[p["id"]]
        (SALIDA / f"{slug}.html").write_text(
            render(template, p, slug, vecinos, sufijos.get(p["id"], ""),
                   canonicos.get(p["id"])),
            encoding="utf-8")

    n_redirects = escribir_redirects({p["id"]: mapa[p["id"]] for p in vivos})

    print(f"paquete/: {len(vivos)} paginas | slugs nuevos: {len(nuevos)} | "
          f"redirects: {n_redirects} | vencidos fuera: {len(pkgs) - len(vivos)}")
    for ids in chocados:
        print(f"  AVISO: los paquetes {ids} generan el mismo title.")
    for principal, otros in duplicados:
        print(f"  AVISO: {otros} son duplicados de {principal}; su canonical "
              f"apunta a {principal} y quedan fuera del sitemap. "
              "Conviene unificarlos desde el admin.")


if __name__ == "__main__":
    main()
