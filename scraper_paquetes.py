"""
Scraper de paquetes turísticos para Corradi Viajes
Fuentes: OLA, Amichi, Freeway
Sube imágenes a Supabase Storage y registros a corradi_packages
"""

import requests
import re
import json
import os
import time
import unicodedata
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import mimetypes

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'
BUCKET = 'corradi-media'
FOLDER = 'packages'
ARS_TO_USD = 1250  # tasa aproximada

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

IMG_DIR = os.path.join(os.path.dirname(__file__), '_img_temp')
os.makedirs(IMG_DIR, exist_ok=True)

# ── Mapa destino → país ──────────────────────────────────────
COUNTRY_MAP = {
    'playa del carmen': 'México', 'cancún': 'México', 'cancun': 'México',
    'riviera maya': 'México', 'costa mujeres': 'México', 'méxico': 'México',
    'punta cana': 'Rep. Dominicana', 'la romana': 'Rep. Dominicana',
    'miches': 'Rep. Dominicana', 'rep. dominicana': 'Rep. Dominicana',
    'búzios': 'Brasil', 'buzios': 'Brasil', 'maragogi': 'Brasil',
    'río de janeiro': 'Brasil', 'rio de janeiro': 'Brasil',
    'maceió': 'Brasil', 'maceio': 'Brasil', 'porto de galinhas': 'Brasil',
    'salvador': 'Brasil', 'natal': 'Brasil', 'recife': 'Brasil',
    'ipioca': 'Brasil', 'pratagy': 'Brasil', 'praia do francês': 'Brasil',
    'barra de santo antonio': 'Brasil', 'foz de iguazú': 'Brasil',
    'aruba': 'Aruba',
    'mendoza': 'Argentina', 'puerto iguazú': 'Argentina', 'iguazú': 'Argentina',
    'bariloche': 'Argentina', 'el calafate': 'Argentina', 'calafate': 'Argentina',
    'ushuaia': 'Argentina', 'salta': 'Argentina', 'san martín de los andes': 'Argentina',
    'puerto madryn': 'Argentina', 'esteros del iberá': 'Argentina',
    'campo de tulipanes': 'Argentina', 'calafate & ushuaia': 'Argentina',
    'cruce andino': 'Argentina / Chile',
    'madrid': 'España', 'barcelona': 'España', 'europa': 'Europa',
    'península ibérica': 'España',
}

CATEGORY_MAP = {
    'México': 'Caribe', 'Rep. Dominicana': 'Caribe', 'Aruba': 'Caribe',
    'Brasil': 'Brasil', 'Argentina': 'Nacional', 'Argentina / Chile': 'Nacional',
    'España': 'Europa', 'Europa': 'Europa',
}


def country_for(dest: str) -> str:
    d = dest.lower().strip()
    for k, v in COUNTRY_MAP.items():
        if k in d:
            return v
    return 'Internacional'


def category_for(country: str) -> str:
    return CATEGORY_MAP.get(country, 'Internacional')


def clean(text: str) -> str:
    """Normaliza texto con caracteres corruptos."""
    try:
        fixed = text.encode('latin-1').decode('utf-8')
    except Exception:
        fixed = text
    return fixed.strip()


def slugify(text: str) -> str:
    s = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')


# ── Supabase Storage ──────────────────────────────────────────
def upload_image(img_url: str, pkg_name: str) -> str | None:
    try:
        r = requests.get(img_url, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            return None
        ext = os.path.splitext(img_url.split('?')[0])[-1] or '.jpg'
        filename = f"{slugify(pkg_name)}{ext}"
        path = f"{FOLDER}/{filename}"
        ct = r.headers.get('Content-Type', 'image/jpeg').split(';')[0]

        upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
        res = requests.post(
            upload_url,
            headers={
                'Authorization': f'Bearer {SUPABASE_KEY}',
                'Content-Type': ct,
            },
            data=r.content,
            params={'upsert': 'true'},
            timeout=30
        )
        if res.status_code in (200, 201):
            pub = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
            print(f"  OK imagen subida: {filename}")
            return pub
        else:
            print(f"  ✗ error subida imagen: {res.status_code} {res.text[:80]}")
            return img_url  # fallback: usar URL original
    except Exception as e:
        print(f"  ✗ excepción subida: {e}")
        return img_url


# ── Supabase DB ───────────────────────────────────────────────
def insert_package(pkg: dict) -> bool:
    try:
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/corradi_packages",
            headers={
                'Authorization': f'Bearer {SUPABASE_KEY}',
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            json=pkg,
            timeout=15
        )
        if res.status_code in (200, 201):
            return True
        else:
            print(f"  ✗ DB error: {res.status_code} {res.text[:120]}")
            return False
    except Exception as e:
        print(f"  ✗ DB excepción: {e}")
        return False


# ── Scraper: Amichi (nacional) ────────────────────────────────
def scrape_amichi() -> list[dict]:
    print("\n=== Scrapeando Amichi (nacional) ===")
    r = requests.get('https://www.amichi.com.ar/', headers=HEADERS, timeout=15)
    soup = BeautifulSoup(r.text, 'html.parser')
    packages = []

    for a in soup.select('a'):
        img = a.find('img')
        if not img: continue
        src = img.get('src', '')
        if 'Fotos-pqt-front' not in src and 'fotos' not in src.lower(): continue

        text = clean(a.get_text(' ', strip=True))
        img_url = 'https://www.amichi.com.ar' + src if src.startswith('/') else src
        img_url = img_url.replace(' ', '%20')

        days_match = re.search(r'(\d+)\s*[Dd]', text)
        price_match = re.search(r'([\d.,]+)\s*ARS', text)
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        raw_name = lines[0] if lines else text[:60]

        # Limpiar nombre
        name = re.sub(r'\s*\d+\s*[Dd].*', '', raw_name).strip()
        if not name or len(name) < 3: continue

        days = int(days_match.group(1)) if days_match else 4
        price_ars = float(price_match.group(1).replace('.', '').replace(',', '.')) if price_match else None
        price_usd = round(price_ars / ARS_TO_USD) if price_ars else 450

        # Descripción
        hotel_match = re.search(r'Hotel[:\s]+(.+?)(?:\||$|\n)', text, re.I)
        desc = hotel_match.group(1).strip() if hotel_match else f'Paquete {days} días / {days-1} noches'

        country = country_for(name)
        packages.append({
            'name': name,
            'destination': name,
            'country': country,
            'category': category_for(country),
            'days': days,
            'price_usd': price_usd,
            'image_url_raw': img_url,
            'description': desc,
            'departure_city': 'Rosario',
            'active': False,
            'featured': False,
            'difficulty': 'Fácil',
        })

    print(f"  → {len(packages)} paquetes encontrados")
    return packages


# ── Scraper: OLA ──────────────────────────────────────────────
def scrape_ola() -> list[dict]:
    print("\n=== Scrapeando OLA ===")
    r = requests.get('https://www.ola.com.ar', headers=HEADERS, timeout=15)
    soup = BeautifulSoup(r.text, 'html.parser')

    seen_dest = set()
    packages = []

    for a in soup.select('a'):
        img = a.find('img')
        if not img: continue
        src = img.get('src', '')
        if 'admin.ola.com.ar' not in src: continue

        text = clean(a.get_text(' ', strip=True))
        if len(text) < 10: continue

        price_match = re.search(r'USD\s*([\d.,]+)', text)
        nights_match = re.search(r'(\d+)\s*noches?', text, re.I)

        # Extraer nombre destino — busca "Paquetes <Destino>"
        dest_match = re.search(r'Paquetes\s+([A-ZÁÉÍÓÚÑ][^\n\-–]+?)(?:\s*[-–]|\s*Salida|\s*Desde|\s*VER)', text, re.I)
        if not dest_match:
            continue
        dest = dest_match.group(1).strip()

        # Deduplicar por destino
        dest_key = dest.lower()
        if dest_key in seen_dest:
            continue
        seen_dest.add(dest_key)

        nights = int(nights_match.group(1)) if nights_match else 7
        days = nights + 1
        price_usd = float(price_match.group(1).replace(',', '.')) if price_match else 800

        country = country_for(dest)

        packages.append({
            'name': dest,
            'destination': dest,
            'country': country,
            'category': category_for(country),
            'days': days,
            'price_usd': price_usd,
            'image_url_raw': src,
            'description': f'{nights} noches • Aéreo + traslados + alojamiento',
            'departure_city': 'Rosario',
            'active': False,
            'featured': False,
            'difficulty': 'Fácil',
        })

    print(f"  → {len(packages)} paquetes encontrados")
    return packages


# ── Scraper: Freeway ──────────────────────────────────────────
def scrape_freeway() -> list[dict]:
    print("\n=== Scrapeando Freeway ===")
    r = requests.get('https://www.freeway.com.ar/', headers=HEADERS, timeout=15)
    soup = BeautifulSoup(r.text, 'html.parser')

    # Destinos ya cubiertos por OLA (evitar duplicados obvios)
    skip_keywords = ['mundial', 'copa', 'final', 'partido', 'fase de grupo', 'dallas', 'kansas', 'f1']
    seen_dest = set()
    packages = []

    for a in soup.select('a'):
        img = a.find('img')
        if not img: continue
        src = img.get('src', '')
        if 'Recomendados' not in src: continue

        text = clean(a.get_text(' ', strip=True))
        if len(text) < 5: continue

        # Saltar paquetes deportivos
        text_lower = text.lower()
        if any(k in text_lower for k in skip_keywords):
            continue

        price_match = re.search(r'USD\s*([\d,]+)', text)
        if not price_match:
            continue

        # Primera palabra en mayúsculas = destino
        dest_match = re.match(r'([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\-]+?)(?:\s+[A-Z][a-z]|\s+Salida)', text)
        if not dest_match:
            dest_match = re.match(r'([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\-]+)', text)
        dest = dest_match.group(1).strip().title() if dest_match else text[:30].strip()

        dest_key = dest.lower()
        if dest_key in seen_dest:
            continue
        seen_dest.add(dest_key)

        # Hotel / descripción
        hotel_match = re.search(r'([A-Z][a-z].{5,40}?(?:hotel|resort|by |pousada|inn|beach|palace|riu|viva|wyndham|grand|sandos|iberostar)[^\n]*)', text, re.I)
        desc = hotel_match.group(1).strip() if hotel_match else f'Paquete todo incluido'

        price_usd = float(price_match.group(1).replace(',', '.'))
        country = country_for(dest)

        packages.append({
            'name': dest,
            'destination': dest,
            'country': country,
            'category': category_for(country),
            'days': 8,
            'price_usd': price_usd,
            'image_url_raw': src,
            'description': desc,
            'departure_city': 'Rosario',
            'active': False,
            'featured': False,
            'difficulty': 'Fácil',
        })

    print(f"  → {len(packages)} paquetes encontrados")
    return packages


# ── Main ──────────────────────────────────────────────────────
def main():
    all_packages = []
    all_packages += scrape_amichi()
    all_packages += scrape_ola()
    all_packages += scrape_freeway()

    # Deduplicar globalmente por nombre
    seen = set()
    unique = []
    for p in all_packages:
        key = slugify(p['name'])
        if key not in seen:
            seen.add(key)
            unique.append(p)

    print(f"\nTotal únicos: {len(unique)} paquetes")
    print("=" * 50)

    ok = 0
    fail = 0
    for i, pkg in enumerate(unique, 1):
        name = pkg['name']
        raw_img = pkg.pop('image_url_raw')
        print(f"\n[{i}/{len(unique)}] {name}")

        # Upload imagen
        img_url = upload_image(raw_img, name)
        pkg['image_url'] = img_url
        pkg['images'] = []

        # Insert en Supabase
        if insert_package(pkg):
            print(f"  ✓ insertado en DB")
            ok += 1
        else:
            fail += 1

        time.sleep(0.3)

    print(f"\n{'='*50}")
    print(f"Resultado: {ok} OK | {fail} errores")
    print("Todos los paquetes están en active=false — revisarlos en el admin antes de publicar.")


if __name__ == '__main__':
    main()
