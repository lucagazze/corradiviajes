"""Regenera sitemap.xml con las paginas fijas + todos los paquetes activos.

Los paquetes viven en Supabase, asi que el sitemap hay que regenerarlo cuando
cambia el catalogo. Correr:  python generar_sitemap.py
"""
import json
import pathlib
import sys
import urllib.request
from datetime import date

sys.stdout.reconfigure(encoding="utf-8")

SITE = "https://www.corradiviajes.com.ar"
SUPABASE = "https://czocbnyoenjbpxmcqobn.supabase.co"
KEY = "sb_publishable_qqTTCyfpaM3SIM15AH_O8Q_fPoHatiI"
ROOT = pathlib.Path(__file__).parent

FIJAS = [
    ("/", "weekly", "1.0"),
    ("/salidas-grupales", "weekly", "0.9"),
    ("/busqueda", "weekly", "0.8"),
    ("/ofertas", "weekly", "0.8"),
    ("/nosotros", "monthly", "0.6"),
    ("/contacto", "monthly", "0.6"),
]


def paquetes():
    url = (f"{SUPABASE}/rest/v1/corradi_packages"
           "?select=id,name,active,expires_at&active=eq.true&order=sort_order")
    req = urllib.request.Request(url)
    req.add_header("apikey", KEY)
    req.add_header("User-Agent", "curl/8.7.1")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    hoy = date.today().isoformat()
    pkgs = paquetes()
    # Un paquete vencido no tiene que quedar en el sitemap
    vivos = [p for p in pkgs if not p.get("expires_at") or p["expires_at"] >= hoy]

    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, freq, prio in FIJAS:
        out += ["  <url>",
                f"    <loc>{SITE}{path}</loc>",
                f"    <lastmod>{hoy}</lastmod>",
                f"    <changefreq>{freq}</changefreq>",
                f"    <priority>{prio}</priority>",
                "  </url>"]
    for p in vivos:
        out += ["  <url>",
                f"    <loc>{SITE}/paquete?id={p['id']}</loc>",
                f"    <lastmod>{hoy}</lastmod>",
                "    <changefreq>weekly</changefreq>",
                "    <priority>0.7</priority>",
                "  </url>"]
    out.append("</urlset>")

    (ROOT / "sitemap.xml").write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"sitemap.xml: {len(FIJAS)} fijas + {len(vivos)} paquetes "
          f"({len(pkgs) - len(vivos)} vencidos afuera) = {len(FIJAS) + len(vivos)} URLs")


if __name__ == "__main__":
    main()
