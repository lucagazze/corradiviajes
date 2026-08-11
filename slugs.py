"""Mapa id -> slug de los paquetes. Es la fuente de verdad de las URLs limpias.

El mapa vive en slugs.json (versionado en git) y es INMUTABLE: una vez que un
paquete tiene slug, no se recalcula aunque le cambien el nombre desde el admin.
Si se recalculara, cada edicion del titulo romperia una URL ya indexada.

Se importa desde generar_paquetes.py y generar_sitemap.py.
"""
import json
import pathlib
import re
import unicodedata

ROOT = pathlib.Path(__file__).parent
MAPA = ROOT / "slugs.json"

# Slugs que no se pueden usar porque chocan con rutas o archivos reales del sitio.
# "index" es el caso critico: paquete/index.html queda inalcanzable porque el
# hermano paquete.html gana en el filesystem de Vercel.
RESERVADOS = {"index", "admin", "portal", "assets", "img", "css", "js", "video"}


def slugify(texto):
    t = unicodedata.normalize("NFKD", str(texto or ""))
    t = "".join(c for c in t if not unicodedata.combining(c))
    # El & se descarta en vez de pasarlo a "y": en nombres de hotel y marca
    # ("Ocean Blue & Sand", "Disney & Universal") el "y" ensucia la URL.
    t = t.replace("&", " ").replace("ñ", "n").replace("Ñ", "n")
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", "-", t)
    return re.sub(r"-+", "-", t).strip("-")


def _acortar(slug, limite=62):
    """Recorta sin partir una palabra al medio."""
    if len(slug) <= limite:
        return slug
    out = []
    for p in slug.split("-"):
        if len("-".join(out + [p])) > limite:
            break
        out.append(p)
    return "-".join(out) or slug[:limite].rstrip("-")


def _base(pkg):
    """El name ya suele traer el destino, asi que alcanza con name + duracion.

    No se filtran stopwords a proposito: en los nombres de destino el articulo
    es parte de la keyword real que la gente busca ("playa del carmen",
    "el calafate", "dia de los muertos"). Sacarlo empeora el slug.
    """
    base = _acortar(slugify(pkg.get("name"))) or f"paquete-{pkg['id']}"
    dias = pkg.get("days")
    return f"{base}-{dias}-dias" if dias else base


def cargar():
    if MAPA.exists():
        return {int(k): v for k, v in json.loads(MAPA.read_text(encoding="utf-8")).items()}
    return {}


def guardar(mapa):
    ordenado = {str(k): mapa[k] for k in sorted(mapa)}
    MAPA.write_text(json.dumps(ordenado, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")


def resolver(pkgs):
    """Devuelve (mapa_completo, nuevos). Los slugs ya existentes no se tocan."""
    mapa = cargar()
    usados = {v: k for k, v in mapa.items()}
    nuevos = {}

    for pkg in sorted(pkgs, key=lambda p: p["id"]):
        pid = pkg["id"]
        if pid in mapa:
            continue

        base = _base(pkg)
        cand = base

        # Dos paquetes con el mismo nombre y duracion: desambiguar por ciudad de salida
        if cand in usados or cand in RESERVADOS:
            ciudad = slugify(str(pkg.get("departure_city") or "")
                             .split(",")[0].split("/")[0])
            if ciudad:
                cand = _acortar(f"{base}-desde-{ciudad}", 78)
        # Ultimo recurso: el id, que es unico por definicion
        if cand in usados or cand in RESERVADOS:
            cand = f"{base}-{pid}"

        mapa[pid] = cand
        usados[cand] = pid
        nuevos[pid] = cand

    return mapa, nuevos


def escribir_js(mapa, destino):
    """Mapa para el front: las tarjetas necesitan el slug para armar el href."""
    pares = ",".join(f'"{k}":"{mapa[k]}"' for k in sorted(mapa))
    destino.write_text(
        "// GENERADO por generar_paquetes.py — no editar a mano.\n"
        "// Mapa id -> slug para que las tarjetas linkeen a la URL limpia.\n"
        f"window.PKG_SLUGS = {{{pares}}};\n",
        encoding="utf-8")
