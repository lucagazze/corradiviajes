# -*- coding: utf-8 -*-
"""
Batch 1 — 4 paquetes Mediterránea
Fuente: mailchimp scrapeado el 2026-06-14
"""
import requests, json

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'
H = {
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

PACKAGES = [

    # ── 1. EGIPTO ──────────────────────────────────────────────
    {
        'name':           'Egipto — Crucero por el Nilo y El Cairo',
        'destination':    'Egipto',
        'country':        'Egipto',
        'category':       'internacional',
        'days':           8,
        'price_usd':      1521,
        'price_original_usd': None,
        'departure_city': 'Madrid',
        'active':         True,
        'badge':          None,
        'featured':       True,
        'image_url': 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1400&q=90',
        'images': json.dumps([
            'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1400&q=90',
            'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1400&q=90',
            'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=1400&q=90',
            'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1400&q=90',
        ]),
        'description': (
            'Viví la experiencia de cruzar el Nilo en crucero con vuelo directo Madrid/Luxor — '
            'sin escalas intermedias en El Cairo ni vuelos internos innecesarios. '
            '4 noches navegando entre templos milenarios y 3 noches en El Cairo con las Pirámides de Giza. '
            'Salidas todos los sábados de Junio a Septiembre con guía en español incluido.'
        ),
        'highlights': '\n'.join([
            '⭐ Vuelo directo Madrid/Luxor — sin escala en El Cairo',
            '⭐ 4 noches de crucero por el Nilo en pensión completa',
            '⭐ Valle de los Reyes y Templo de Karnak en Luxor',
            '⭐ Pirámides de Giza y Gran Esfinge',
            '⭐ Templo de Philae — Patrimonio UNESCO',
            '⭐ Abu Simbel (excursión opcional disponible)',
            '⭐ Mercado Khan El Khalili y Ciudadela de Saladino',
            '⭐ Guía de habla hispana durante todo el recorrido',
            '⭐ Salidas todos los sábados de Junio a Septiembre',
            '⭐ 7 noches de alojamiento en categoría superior',
        ]),
        'includes': '\n'.join([
            '• Vuelo directo Madrid/Luxor + Aswan/El Cairo + El Cairo/Madrid',
            '• 4 noches de crucero por el Nilo en pensión completa',
            '• 3 noches en El Cairo con desayuno incluido',
            '• Visitas guiadas: Templo de Karnak, Valle de los Reyes, Edfu, Kom Ombo, Philae, Asuán, Pirámides de Giza',
            '• Gran Esfinge y Pirámide de Keops (exterior)',
            '• Traslados privados aeropuerto-crucero-hotel',
            '• Guía de habla hispana durante todo el circuito',
            '• Ciudadela de Saladino y Mezquita de Alabastro',
            '• Asistencia al viajero durante todo el viaje',
        ]),
        'excludes': '\n'.join([
            '• Impuestos y tasas aeroportuarias (USD 197 aprox.)',
            '• Visa de ingreso a Egipto',
            '• Propinas (USD 197 aprox. — incluidas en pack opcional)',
            '• Excursión a Abu Simbel (opcional USD 615 todo incluido)',
            '• Gastos personales y compras',
            '• Bebidas en restaurantes',
            '• Suplemento habitación single (USD 412)',
        ]),
        'itinerary': json.dumps([
            {'day': 'Día 1 — Llegada a Luxor', 'desc': 'Vuelo directo desde Madrid con llegada a Luxor. Recepción en el aeropuerto y traslado al crucero en el Nilo. Tarde libre para acomodarse en el barco y disfrutar del primer atardecer sobre el río más famoso del mundo. Cena de bienvenida a bordo.'},
            {'day': 'Día 2 — Templos de Luxor: Karnak y Valle de los Reyes', 'desc': 'Mañana: visita al Templo de Karnak, el mayor complejo religioso del mundo antiguo con columnas de 21 metros. Tarde: Valle de los Reyes, donde reposan los faraones del Imperio Nuevo, incluyendo la tumba de Tutankamón. Pensión completa a bordo del crucero.'},
            {'day': 'Día 3 — Edfu y Kom Ombo', 'desc': 'Navegación hacia el sur con escala en Edfu para visitar el Templo de Horus, el mejor conservado de Egipto (más de 2.000 años). Tarde: Templo de Kom Ombo, único en Egipto por estar dedicado a dos dioses: Sobek el cocodrilo y Horus el halcón. Pensión completa en crucero.'},
            {'day': 'Día 4 — Asuán: Philae y la Gran Presa', 'desc': 'Llegada a Asuán, la joya del Alto Egipto. Visita a la Gran Presa de Asuán y al Templo de Philae (Patrimonio UNESCO), trasladado piedra a piedra para salvarlo de las aguas del Nilo. Tarde libre para recorrer el mercado nubio o dar un paseo en feluka por el río. Pensión completa.'},
            {'day': 'Día 5 — Abu Simbel (opcional) + Vuelo a El Cairo', 'desc': 'Excursión opcional al amanecer a los Templos de Abu Simbel, mandados construir por Ramsés II y considerados la mayor hazaña de la arqueología moderna por su traslado de 65 metros. Por la tarde: vuelo desde Asuán a El Cairo. Check-in en hotel. Desayuno incluido.'},
            {'day': 'Día 6 — Pirámides de Giza y Gran Esfinge', 'desc': 'Día completo en las Pirámides de Giza: la única Maravilla del Mundo Antiguo que sobrevive. La Pirámide de Keops, la de Kefrén, la de Micerinos y la majestuosa Gran Esfinge. Almuerzo en restaurante local. Tarde libre en El Cairo. Desayuno incluido.'},
            {'day': 'Día 7 — Gran Museo Egipcio y Khan El Khalili', 'desc': 'Mañana: visita al Gran Museo Egipcio (GEM), inaugurado en 2023, el mayor museo de antigüedades del mundo con la colección completa de Tutankamón y 100.000 piezas. Almuerzo incluido. Tarde: Ciudadela de Saladino, Mezquita de Alabastro y el mítico Mercado Khan El Khalili, el más antiguo de El Cairo. Desayuno incluido.'},
            {'day': 'Día 8 — Regreso a Madrid', 'desc': 'Desayuno en el hotel y traslado al aeropuerto internacional de El Cairo (CAI). Vuelo de regreso a Madrid. Fin de los servicios de Corradi Viajes.'},
        ], ensure_ascii=False),
    },

    # ── 2. COSTA RICA ──────────────────────────────────────────
    {
        'name':           'Costa Rica — Aventura Natural Grupal desde Rosario',
        'destination':    'Costa Rica',
        'country':        'Costa Rica',
        'category':       'internacional',
        'days':           9,
        'price_usd':      2649,
        'price_original_usd': None,
        'departure_city': 'Rosario',
        'active':         True,
        'badge':          None,
        'featured':       True,
        'image_url': 'https://images.unsplash.com/photo-1518182170546-07661fd94144?w=1400&q=90',
        'images': json.dumps([
            'https://images.unsplash.com/photo-1518182170546-07661fd94144?w=1400&q=90',
            'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=1400&q=90',
            'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=1400&q=90',
            'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=90',
        ]),
        'description': (
            'El viaje soñado para amantes de la naturaleza: 9 días de aventura pura en uno de '
            'los países con mayor biodiversidad del planeta. Salida grupal el 4 de Diciembre '
            'desde Rosario con LATAM, acompañante Corradi Viajes incluido. '
            'Tortuguero, Volcán Arenal, Monteverde y Manuel Antonio — los 4 íconos de Costa Rica en un solo viaje.'
        ),
        'highlights': '\n'.join([
            '⭐ Salida grupal 4 de Diciembre desde Rosario con LATAM',
            '⭐ Acompañante Corradi Viajes incluido durante todo el viaje',
            '⭐ Canales de Tortuguero — el Amazonas de Costa Rica',
            '⭐ Volcán Arenal activo + Catarata La Fortuna (70 m)',
            '⭐ Reserva Biológica de Monteverde — bosque nuboso',
            '⭐ Parque Nacional Manuel Antonio con monos y playas',
            '⭐ 8 noches de alojamiento (6 con desayuno + 2 pensión completa)',
            '⭐ Traslados privados en todo el recorrido',
            '⭐ Pura Vida garantizada',
        ]),
        'includes': '\n'.join([
            '• Vuelo LATAM desde Rosario (carry-on 10 kg incluido)',
            '• 6 noches de alojamiento con desayuno incluido',
            '• 2 noches con pensión completa',
            '• Traslados privados en todo el recorrido',
            '• Caminata al Pueblo de Tortuguero',
            '• Tour en bote por los Canales de Tortuguero',
            '• Caminata Volcán 1968 + Catarata La Fortuna (Arenal 2 en 1)',
            '• Tour Reserva Biológica de Monteverde (bosque nuboso)',
            '• Caminata Parque Nacional Manuel Antonio',
            '• Acompañante Corradi Viajes desde Rosario (mínimo 11 pasajeros)',
            '• Asistencia al viajero durante todo el viaje',
        ]),
        'excludes': '\n'.join([
            '• Impuesto aéreo (USD 444 aprox.)',
            '• Gastos personales y propinas',
            '• Actividades opcionales no detalladas (aguas termales, canopy, kayak)',
            '• Seguro de viaje',
            '• Suplemento habitación single (USD 597)',
            '• Bebidas durante las comidas',
        ]),
        'itinerary': json.dumps([
            {'day': 'Día 1 — Salida desde Rosario a Costa Rica', 'desc': 'Vuelo LATAM desde el Aeropuerto Internacional Rosario. Llegada a San José de Costa Rica. Traslado privado al hotel. Noche de descanso para aclimatarse a la selva centroamericana. Pensión completa.'},
            {'day': 'Día 2 — Tortuguero: Pueblo y Canales', 'desc': 'Traslado hacia el Caribe costarricense. Caminata por el pintoresco Pueblo de Tortuguero, rodeado de canales y sin calles vehiculares. Por la tarde, navegación en bote por los Canales de Tortuguero — el "Amazonas de Costa Rica" — con avistamiento de monos, caimanes, loros y tucanes. Pensión completa.'},
            {'day': 'Día 3 — Tortuguero: Fauna y Selva', 'desc': 'Día libre en el Parque Nacional de Tortuguero. En temporada (Julio-Octubre), avistamiento nocturno de tortugas gigantes que desovan en la playa. Kayak por los canales entre naturaleza virgen. Desayuno incluido.'},
            {'day': 'Día 4 — Arenal: Volcán 1968 y Catarata La Fortuna', 'desc': 'Traslado a La Fortuna de San Carlos, al pie del imponente Volcán Arenal. Caminata por el histórico sendero Volcán 1968, que recorre la colada de lava que arrasó el pueblo. Tarde: bajada a la espectacular Catarata La Fortuna, una cascada de 70 metros rodeada de selva tropical. Desayuno incluido.'},
            {'day': 'Día 5 — Arenal: Aguas Termales y Lago', 'desc': 'Día libre en la zona de Arenal. Opciones: aguas termales naturales calentadas por el volcán (uno de los mejores spas naturales del mundo), kayak en el Lago Arenal, canopy sobre la selva o tour de chocolate artesanal. Desayuno incluido.'},
            {'day': 'Día 6 — Monteverde: Reserva Biológica del Bosque Nuboso', 'desc': 'Traslado a Monteverde, el corazón del bosque nuboso costarricense. Tour guiado en la Reserva Biológica de Monteverde: orquídeas, bromelias, quetzales, serpientes de terciopelo y más de 400 especies de aves en un ecosistema único en el mundo. Desayuno incluido.'},
            {'day': 'Día 7 — Monteverde: Puentes y Canopy', 'desc': 'Día libre en Monteverde. Opciones: canopy sobre el bosque nuboso con tirolesas de más de 1 km, puentes colgantes entre los árboles a 100 metros de altura, o tour de café y chocolate orgánico con degustación. Desayuno incluido.'},
            {'day': 'Día 8 — Parque Nacional Manuel Antonio', 'desc': 'Traslado al Pacífico costarricense. Caminata guiada en el Parque Nacional Manuel Antonio: monos cariblancos que te roban la mochila, perezosos colgando de los árboles, tortugas marinas y playas vírgenes de arena blanca rodeadas de selva tropical. Desayuno incluido.'},
            {'day': 'Día 9 — Regreso a Rosario', 'desc': 'Traslado al Aeropuerto Internacional Juan Santamaría de San José. Vuelo LATAM de regreso a Rosario. Fin de los servicios. ¡Pura Vida!'},
        ], ensure_ascii=False),
    },

    # ── 3. JAPÓN KUMANO KODO ───────────────────────────────────
    {
        'name':           'Japón — Camino de Kumano: Peregrinación Sagrada',
        'destination':    'Japón',
        'country':        'Japón',
        'category':       'asia',
        'days':           14,
        'price_usd':      5800,
        'price_original_usd': None,
        'departure_city': 'Rosario',
        'active':         True,
        'badge':          None,
        'featured':       True,
        'image_url': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90',
        'images': json.dumps([
            'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1400&q=90',
            'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=1400&q=90',
            'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1400&q=90',
            'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1400&q=90',
        ]),
        'description': (
            '14 días en el Japón más profundo: desde los templos dorados de Kioto hasta la ruta de '
            'peregrinación Kumano Kodo (Patrimonio UNESCO de 1.300 años), las termas en el río, '
            'el Tren Bala y Tokio. Exclusivo en español, grupo reducido, hoteles categoría superior. '
            'Salida 6 de Octubre 2025. Precio en Yenes: ¥872.666 por persona base doble.'
        ),
        'highlights': '\n'.join([
            '⭐ Kumano Kodo — ruta de peregrinación Patrimonio UNESCO (1.300 años de historia)',
            '⭐ Pernocte en templo budista Koyasan (experiencia única en el mundo)',
            '⭐ Tren Bala Shinkansen en 3 tramos incluidos',
            '⭐ 13 desayunos + 7 almuerzos (lunch box) + 3 cenas incluidos',
            '⭐ Kioto, Hiroshima, Isla Miyajima, Osaka, Kanazawa, Takayama y Tokio',
            '⭐ Shirakawago — aldeas medievales Patrimonio UNESCO',
            '⭐ Monte Fuji y mini crucero en el Lago Ashi',
            '⭐ Exclusivo en español — guía hispanohablante todo el circuito',
            '⭐ Hoteles de categoría superior — 13 noches',
            '⭐ Salida 6 de Octubre 2025 — grupo reducido',
        ]),
        'includes': '\n'.join([
            '• 13 noches en hoteles de categoría superior',
            '• 1 noche en shukubo (monasterio budista) en Koyasan',
            '• 1 noche en ryokan con onsen en Kawayu',
            '• 13 desayunos + 7 almuerzos (lunch box) + 3 cenas',
            '• Tren Bala Shinkansen: Kyoto/Himeji, Hiroshima/Osaka y Nagoya/Odawara',
            '• Tren Expreso Osaka/Kanazawa',
            '• Traslados aeropuerto de entrada y salida',
            '• Guía de habla española durante todo el circuito',
            '• Todas las visitas detalladas en el itinerario',
            '• Mini crucero en el Lago Ashi (Fuji-Hakone)',
        ]),
        'excludes': '\n'.join([
            '• Vuelo internacional ida y vuelta (consultar)',
            '• IVA y gastos administrativos (3,2%)',
            '• Impuesto al turismo (pagar en destino)',
            '• Gastos personales y propinas',
            '• Seguro de viaje',
            '• Actividades opcionales no detalladas',
            '• Bebidas durante comidas',
        ]),
        'itinerary': json.dumps([
            {'day': 'Día 1 — Llegada a Kioto', 'desc': 'Llegada al aeropuerto y traslado a Kioto, la antigua capital imperial. Check-in en hotel categoría superior. Tarde libre para el primer paseo por el barrio de Gion con sus ochaya (casas de té) y geishas al anochecer. Cena de bienvenida incluida.'},
            {'day': 'Día 2 — Kioto: Kinkakuji, Ryoanji y Arashiyama', 'desc': 'Pabellón Dorado Kinkakuji reflejado en el estanque Kyokochi. Jardín Zen de Ryoanji con sus 15 piedras enigmáticas (solo se pueden ver 14 desde cualquier punto). Bosque de Bambú de Arashiyama, el más fotografiado de Japón. Almuerzo incluido.'},
            {'day': 'Día 3 — Kioto: Fushimi Inari y Castillo Nijo', 'desc': 'Madrugada en el Santuario Fushimi Inari: miles de torii naranjas serpenteando por el Monte Inari, el lugar más visitado de Japón. Barrio de Nishiki — el mercado de la comida de Kioto. Castillo Nijo con sus "suelos de ruiseñor" que chirrían para detectar intrusos. Almuerzo incluido.'},
            {'day': 'Día 4 — Hiroshima e Isla de Miyajima', 'desc': 'Tren Bala a Hiroshima. Parque Memorial de la Paz y el Genbaku Domu (Cúpula de la Bomba Atómica, Patrimonio UNESCO). Ferry a la Isla Miyajima: el Gran Torii naranja flotando sobre el mar y el Templo Itsukushima con sus ciervos sagrados. Almuerzo incluido.'},
            {'day': 'Día 5 — Hiroshima: Kurashiki', 'desc': 'Excursión a Kurashiki: canal histórico de la era Edo bordeado de sauces llorones y almacenes blancos convertidos en galerías de arte (Museo de Arte de Ohara). El barrio más bohemio del Japón feudal. Almuerzo incluido.'},
            {'day': 'Día 6 — Koyasan: Monasterio Budista', 'desc': 'Viaje en tren y teleférico al Monte Koya (Koyasan), centro espiritual del budismo esotérico Shingon fundado en 816. Pernocte en shukubo (monasterio budista) con comida vegetariana shojin-ryori ceremonial. Al amanecer, meditación con los monjes en el cementerio Okunoin entre cipreses milenarios. Cena incluida.'},
            {'day': 'Día 7 — Kumano Kodo: Ruta de Peregrinación (Patrimonio UNESCO)', 'desc': 'Inicio de la legendaria ruta Kumano Kodo, declarada Patrimonio Mundial de la UNESCO: la única ruta de peregrinación del mundo junto con el Camino de Santiago que tiene este reconocimiento. Caminata entre bosques de cipreses japoneses, templos ocultos en la niebla y piedras cubiertas de musgo de 1.300 años de historia. Almuerzo lunch box incluido.'},
            {'day': 'Día 8 — Kawayu Onsen: El Río que es un Baño Termal', 'desc': 'Llegada a Kawayu Onsen, donde el río mismo es un onsen natural a 42°C gracias a las fuentes geotérmicas que brotan del lecho del río. Experiencia única: bañarse en el río con aguas termales curativas rodeado de montañas. Alojamiento en ryokan tradicional japonés. Cena incluida.'},
            {'day': 'Día 9 — Osaka: Ciudad de la Gastronomía', 'desc': 'Traslado a Osaka, la ciudad más golosa de Japón. Castillo de Osaka con sus murallas de 400 años. Barrio de Dotonbori con sus letreros de neón y la mejor comida callejera del país: takoyaki (pulpo), okonomiyaki (panqueque japonés) y ramen. Almuerzo incluido.'},
            {'day': 'Día 10 — Kanazawa: El Kioto sin Turistas', 'desc': 'Tren expreso a Kanazawa, la ciudad que los bombardeos de la Segunda Guerra Mundial nunca alcanzaron. Jardín Kenrokuen — uno de los tres jardines más bellos de Japón. Barrio de Geishas Higashi Chaya con sus casas de madera originales. Mercado Omicho con los mejores mariscos del Mar del Japón. Almuerzo incluido.'},
            {'day': 'Día 11 — Takayama y Shirakawago', 'desc': 'Viaje a Takayama en los Alpes Japoneses. Barrio histórico Sanmachi Suji con sake breweries del siglo XVIII. Excursión a Shirakawago: aldea medieval con casas gasshō-zukuri ("manos en oración") de techos de paja de 5 metros, Patrimonio UNESCO preservado en los Alpes japoneses. Almuerzo incluido.'},
            {'day': 'Día 12 — Tokio: Templo Senso-ji y Modernidad', 'desc': 'Tren Bala a Tokio, la megaciudad del futuro. Templo Senso-ji en Asakusa, el más antiguo de Tokio (645 d.C.). Barrio retro de Yanaka que sobrevivió al terremoto de 1923. Akihabara, la meca mundial del anime y la electrónica. Cena incluida.'},
            {'day': 'Día 13 — Tokio: Shibuya y Monte Fuji', 'desc': 'Cruce de Shibuya, el cruce peatonal más transitado del mundo (hasta 3.000 personas por verde). Harajuku y su moda callejera extrema. Parque Nacional Fuji-Hakone: panorámica del Monte Fuji (3.776 m, el ícono de Japón) y mini crucero en el Lago Ashi con el Fuji de fondo. Almuerzo incluido.'},
            {'day': 'Día 14 — Regreso desde Tokio', 'desc': 'Desayuno en el hotel y traslado al aeropuerto internacional de Narita o Haneda. Vuelo de regreso. Fin de los servicios de Corradi Viajes. Sayonara Japón.'},
        ], ensure_ascii=False),
    },

    # ── 4. IGUAZÚ LODGE ────────────────────────────────────────
    {
        'name':           'Iguazú — Lodge de Selva con Cenas Incluidas',
        'destination':    'Puerto Iguazú',
        'country':        'Argentina',
        'category':       'nacional',
        'days':           4,
        'price_usd':      490,
        'price_original_usd': None,
        'departure_city': 'Córdoba / Buenos Aires',
        'active':         True,
        'badge':          None,
        'featured':       False,
        'image_url': 'https://images.unsplash.com/photo-1474823350699-2b2da3fbb04b?w=1400&q=90',
        'images': json.dumps([
            'https://images.unsplash.com/photo-1474823350699-2b2da3fbb04b?w=1400&q=90',
            'https://images.unsplash.com/photo-1618328847747-5e21ca4a2d61?w=1400&q=90',
            'https://images.unsplash.com/photo-1504870712357-65ea720d6078?w=1400&q=90',
            'https://images.unsplash.com/photo-1573481078493-a3b0fe5db3f1?w=1400&q=90',
        ]),
        'description': (
            'La mejor forma de vivir las Cataratas del Iguazú: durmiendo en la selva misionera. '
            '3 noches en La Aldea de la Selva Lodge con desayuno buffet y cenas incluidas, '
            'cataratas lado argentino y brasileño. '
            'Vuelo directo desde Córdoba o Buenos Aires. Válido Agosto–Noviembre 2025.'
        ),
        'highlights': '\n'.join([
            '⭐ Lodge boutique en medio de la selva misionera — La Aldea de la Selva',
            '⭐ Desayuno buffet + Cenas incluidas las 3 noches',
            '⭐ Cataratas del Iguazú lado Argentino — Garganta del Diablo',
            '⭐ Cataratas del Iguazú lado Brasileño — vista panorámica completa',
            '⭐ Vuelo directo desde Córdoba o Buenos Aires',
            '⭐ Patrimonio Natural de la Humanidad UNESCO',
            '⭐ Fauna nativa: monos, tucanes, yacutingas y mariposas',
            '⭐ Válido 1 Agosto al 30 Noviembre 2025',
        ]),
        'includes': '\n'.join([
            '• 3 noches en La Aldea de la Selva Lodge — habitación standard',
            '• Desayuno buffet diario',
            '• Cenas incluidas las 3 noches',
            '• Traslados aeropuerto-lodge-aeropuerto',
            '• Visita a las Cataratas lado Argentino (entrada aparte — online obligatorio)',
            '• Visita a las Cataratas lado Brasileño (entrada aparte — online obligatorio)',
            '• Asistencia de Corradi Viajes durante todo el viaje',
        ]),
        'excludes': '\n'.join([
            '• Vuelo (se reserva por separado — VUELO DIRECTO desde Córdoba o Buenos Aires)',
            '• Entradas al Parque Nacional — solo online: corredores.conicet.gov.ar',
            '• Entradas al lado Brasileño — solo online: cataratasdoiguacu.com.br',
            '• Gastos personales y propinas',
            '• Excursiones opcionales (bote a las cataratas, vuelo en helicóptero)',
            '• Bebidas en almuerzos y excursiones',
            '• No aplica feriados ni fines de semana largos',
        ]),
        'itinerary': json.dumps([
            {'day': 'Día 1 — Llegada y Selva Misionera', 'desc': 'Vuelo directo desde Córdoba o Buenos Aires. Llegada al Aeropuerto Internacional Cataratas. Traslado al Lodge La Aldea de la Selva, un refugio ecológico de categoría en medio de la selva subtropical misionera. Check-in, tarde libre con el sonido de los monos y los tucanes de fondo. Cena buffet incluida en el lodge.'},
            {'day': 'Día 2 — Cataratas Lado Argentino', 'desc': 'Día completo en el Parque Nacional Iguazú (Patrimonio Natural UNESCO). Circuito Superior: vista aérea de las cataratas. Circuito Inferior: el spray del agua en la cara. Garganta del Diablo: el punto más impresionante — 150 metros de caída libre y el rugido del agua que se escucha desde kilómetros. Una de las maravillas naturales más imponentes del planeta. Desayuno buffet y cena incluidos.'},
            {'day': 'Día 3 — Cataratas Lado Brasileño', 'desc': 'Excursión al Parque Nacional do Iguaçu del lado brasileño, donde se puede apreciar la vista panorámica completa de las 275 cataratas en toda su extensión. Pasarela frente a la Garganta del Diablo desde el otro ángulo. Opcional: bote a motor que se mete entre las cataratas (adrenalina total). Tarde libre para relajarse en el lodge o hacer el sendero de aves. Desayuno buffet y cena incluidos.'},
            {'day': 'Día 4 — Selva y Regreso', 'desc': 'Último desayuno buffet en el lodge con vista a la selva. Mañana libre para el sendero de la biodiversidad del lodge o compras en el centro de Puerto Iguazú. Traslado al aeropuerto y vuelo de regreso a Córdoba o Buenos Aires. ¡Una experiencia que no se olvida más!'},
        ], ensure_ascii=False),
    },

]


def main():
    print('Insertando', len(PACKAGES), 'paquetes...\n')
    ok = fail = 0
    for pkg in PACKAGES:
        res = requests.post(
            SUPABASE_URL + '/rest/v1/corradi_packages',
            headers=H,
            json=pkg
        )
        if res.status_code in (200, 201):
            inserted = res.json()
            pid = inserted[0]['id'] if isinstance(inserted, list) else inserted.get('id', '?')
            print(f'  OK  [{pid}] {pkg["name"]}')
            ok += 1
        else:
            print(f'  ERR {res.status_code}: {res.text[:120]}')
            fail += 1
    print(f'\nResultado: {ok} OK | {fail} errores')


if __name__ == '__main__':
    main()
