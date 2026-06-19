# -*- coding: utf-8 -*-
"""
Enriquece todos los paquetes con:
- Imagen de alta calidad (Unsplash)
- Itinerario completo dia a dia
- Highlights, includes, excludes
- Descripcion detallada
"""

import requests, json, re, unicodedata

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'
H = {'Authorization': 'Bearer '+SUPABASE_KEY, 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json'}

# ── Imagenes Unsplash de alta calidad por destino ─────────────
# Formato: photo-[ID]?w=1400&q=90
IMAGES = {
    # Argentina
    'bariloche':          'https://images.unsplash.com/photo-1586348417648-f7bf3f71b350?w=1400&q=90',
    'calafate':           'https://images.unsplash.com/photo-1531512073830-ba890ca4eba2?w=1400&q=90',
    'ushuaia':            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&q=90',
    'salta':              'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1400&q=90',
    'mendoza':            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=90',
    'iguazu':             'https://images.unsplash.com/photo-1474823350699-2b2da3fbb04b?w=1400&q=90',
    'puerto iguazu':      'https://images.unsplash.com/photo-1474823350699-2b2da3fbb04b?w=1400&q=90',
    'foz de iguazu':      'https://images.unsplash.com/photo-1618328847747-5e21ca4a2d61?w=1400&q=90',
    'madryn':             'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1400&q=90',
    'san martin':         'https://images.unsplash.com/photo-1578894382983-a98c88dc5a04?w=1400&q=90',
    'esteros':            'https://images.unsplash.com/photo-1504870712357-65ea720d6078?w=1400&q=90',
    'tulipanes':          'https://images.unsplash.com/photo-1586348417648-f7bf3f71b350?w=1400&q=90',
    'cruce andino':       'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1400&q=90',
    'el calafate':        'https://images.unsplash.com/photo-1531512073830-ba890ca4eba2?w=1400&q=90',
    'ushuaia + el calafate': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1400&q=90',

    # Brasil
    'buzios':             'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=90',
    'maragogi':           'https://images.unsplash.com/photo-1548697785-c77bd6e1e3da?w=1400&q=90',
    'rio de janeiro':     'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1400&q=90',
    'maceio':             'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
    'salvador':           'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=1400&q=90',
    'salvador de bahia':  'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=1400&q=90',
    'natal':              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
    'recife':             'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=1400&q=90',
    'porto de galinhas':  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
    'ipioca':             'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
    'pratagy':            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
    'praia do frances':   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
    'barra de santo antonio': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',

    # Caribe
    'cancun':             'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1400&q=90',
    'playa del carmen':   'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1400&q=90',
    'riviera maya':       'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1400&q=90',
    'punta cana':         'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1400&q=90',
    'punta cana riu':     'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1400&q=90',
    'la romana':          'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1400&q=90',
    'miches':             'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=90',
    'costa mujeres':      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1400&q=90',
    'republica dominicana': 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1400&q=90',
    'mexico':             'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1400&q=90',
    'aruba':              'https://images.unsplash.com/photo-1564424224827-cd24b8915874?w=1400&q=90',
    'palm-eagle beach':   'https://images.unsplash.com/photo-1564424224827-cd24b8915874?w=1400&q=90',
}

def get_image(name: str) -> str:
    n = name.lower()
    for k, v in IMAGES.items():
        if k in n:
            return v
    return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=90'


# ── Itinerarios detallados ────────────────────────────────────
def make_itinerary(name: str, days: int) -> list:
    n = name.lower()

    # ── ARGENTINA ──
    if 'bariloche' in n and 'cruce' not in n:
        return [
            {'day':1,'title':'Llegada a Bariloche','description':'Recepción en el aeropuerto y traslado al hotel. Tarde libre para ambientarse. Paseo por el Centro Cívico y la Costanera del Lago Nahuel Huapi. Cena de bienvenida.','meals':'Cena incluida'},
            {'day':2,'title':'Circuito Chico','description':'Recorrido por los puntos más emblemáticos: Cerro Campanario (trekking o aerosilla), Puerto Pañuelo, Colonia Suiza y Playa Serena. Degustación de chocolates artesanales en el regreso.','meals':'Desayuno incluido'},
            {'day':3,'title':'Cerro Catedral','description':'Mañana en el centro de ski más grande de América del Sur (o trekking en verano). Tarde libre para explorar la zona de tiendas, fondues y cervecerías artesanales.','meals':'Desayuno incluido'},
            {'day':4,'title':'Villa la Angostura y Lago Correntoso','description':'Excursión opcional a Villa la Angostura con paradas en miradores y la pasarela de ñires. Tarde libre y traslado al aeropuerto.','meals':'Desayuno incluido'},
        ][:days]

    if 'calafate & ushuaia' in n or ('calafate' in n and 'ushuaia' in n):
        return [
            {'day':1,'title':'Llegada a El Calafate','description':'Bienvenida y traslado al hotel. Tarde libre para recorrer la avenida del Libertador con sus tiendas y restaurantes. Introducción a la Patagonia.','meals':'Cena incluida'},
            {'day':2,'title':'Glaciar Perito Moreno','description':'Excursión al Parque Nacional Los Glaciares. Caminata en pasarelas con vista privilegiada al Glaciar Perito Moreno y su imponente frente de 60 metros. Posibilidad de trekking sobre el hielo.','meals':'Desayuno incluido'},
            {'day':3,'title':'Vuelo a Ushuaia','description':'Traslado al aeropuerto y vuelo a Ushuaia. Check-in en el hotel y paseo por el centro de la ciudad más austral del mundo. Visita al Museo del Fin del Mundo.','meals':'Desayuno incluido'},
            {'day':4,'title':'Parque Nacional Tierra del Fuego','description':'Mañana en el Parque Nacional: Bahía Lapataia, Lago Roca y el hito de la ruta 3. Tarde: tren del fin del mundo con paisajes únicos.','meals':'Desayuno incluido'},
            {'day':5,'title':'Canal Beagle','description':'Navegación por el Canal Beagle hasta la Isla de los Lobos, Isla de los Pájaros y el Faro Les Éclaireurs. Tarde libre y cena patagónica.','meals':'Desayuno y Cena incluidos'},
            {'day':6,'title':'Día libre en Ushuaia','description':'Mañana libre para actividades opcionales: ski en Cerro Castor (invierno), kayak en el canal o visita al Glacier Martial. Compras de souvenirs.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso','description':'Traslado al aeropuerto y vuelo de regreso. Fin de los servicios.','meals':'Desayuno incluido'},
        ][:days]

    if 'calafate' in n:
        return [
            {'day':1,'title':'Llegada a El Calafate','description':'Traslado al hotel a orillas del Lago Argentino. Paseo por la avenida del Libertador, la costanera y degustación de cordero patagónico.','meals':'Cena incluida'},
            {'day':2,'title':'Glaciar Perito Moreno','description':'Excursión imperdible al Parque Nacional Los Glaciares. Recorrido por pasarelas con vista al glaciar, posibilidad de trekking sobre el hielo y mini-trekking. Un espectáculo natural único.','meals':'Desayuno incluido'},
            {'day':3,'title':'Lago Argentino & Upsala','description':'Navegación por el Lago Argentino hasta los glaciares Upsala y Spegazzini. Paisajes de témpanos azules y montañas nevadas que cortan el aliento.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre en El Calafate. Traslado al aeropuerto y vuelo de regreso.','meals':'Desayuno incluido'},
        ][:days]

    if 'el calafate' in n:
        return [
            {'day':1,'title':'Llegada a El Calafate','description':'Traslado al hotel a orillas del Lago Argentino. Paseo por la avenida del Libertador, la costanera y degustación de cordero patagónico.','meals':'Cena incluida'},
            {'day':2,'title':'Glaciar Perito Moreno','description':'Excursión imperdible al Parque Nacional Los Glaciares. Recorrido por pasarelas con vista al glaciar, posibilidad de trekking sobre el hielo. Un espectáculo natural único.','meals':'Desayuno incluido'},
            {'day':3,'title':'Lago Argentino & Upsala','description':'Navegación por el Lago Argentino hasta los glaciares Upsala y Spegazzini. Paisajes de témpanos azules y montañas nevadas.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre. Traslado al aeropuerto y vuelo de regreso.','meals':'Desayuno incluido'},
        ][:days]

    if 'ushuaia + el calafate' in n:
        return [
            {'day':1,'title':'Llegada a Ushuaia','description':'Traslado al hotel. Paseo por el centro y visita al puerto. La ciudad más austral del mundo.','meals':'Cena incluida'},
            {'day':2,'title':'Parque Nacional Tierra del Fuego','description':'Bahía Lapataia, Lago Roca, hito km 0. Tren del fin del mundo opcional.','meals':'Desayuno incluido'},
            {'day':3,'title':'Canal Beagle','description':'Navegación por el canal: Isla de los Lobos, Isla de los Pájaros, Faro Les Éclaireurs.','meals':'Desayuno incluido'},
            {'day':4,'title':'Vuelo a El Calafate','description':'Vuelo y check-in. Tarde libre en la costanera del Lago Argentino.','meals':'Desayuno incluido'},
            {'day':5,'title':'Glaciar Perito Moreno','description':'Excursión al Parque Nacional Los Glaciares. Caminata en pasarelas frente al glaciar.','meals':'Desayuno incluido'},
            {'day':6,'title':'Regreso','description':'Traslado al aeropuerto y vuelo de regreso.','meals':'Desayuno incluido'},
        ][:days]

    if 'ushuaia' in n:
        return [
            {'day':1,'title':'Llegada a Ushuaia','description':'Traslado al hotel. Paseo por el centro histórico y el puerto. Primera impresión de la ciudad más austral del mundo.','meals':'Cena incluida'},
            {'day':2,'title':'Parque Nacional Tierra del Fuego','description':'Día completo en el parque: Bahía Lapataia, Lago Roca, senderos del bosque subantártico. Tren del fin del mundo opcional.','meals':'Desayuno incluido'},
            {'day':3,'title':'Canal Beagle y Glaciar Martial','description':'Mañana: navegación por el Canal Beagle hasta la Isla de los Lobos y el Faro Les Éclaireurs. Tarde: subida al Glaciar Martial con vistas panorámicas.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre para compras o actividades opcionales. Traslado al aeropuerto.','meals':'Desayuno incluido'},
        ][:days]

    if 'salta' in n and 'cielo' in n:
        return [
            {'day':1,'title':'Llegada a Salta','description':'Recepción y traslado al hotel. Recorrida a pie por el centro histórico: Plaza 9 de Julio, Cabildo, Catedral y Convento San Bernardo.','meals':'Cena incluida'},
            {'day':2,'title':'Tren a las Nubes y Quebrada del Toro','description':'Experiencia única a bordo del famoso Tren a las Nubes, que atraviesa viaductos y túneles hasta los 4.220 m.s.n.m. en La Polvorilla. Una de las travesías ferroviarias más espectaculares del mundo.','meals':'Desayuno incluido'},
            {'day':3,'title':'Cachi y Valles Calchaquíes','description':'Excursión por los Valles Calchaquíes: Payogasta, Cachi y el Museo Arqueológico. Paisajes de viñedos de altura y cardones centenarios.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Regreso','description':'Mañana libre en Salta. Traslado al aeropuerto y vuelo de regreso.','meals':'Desayuno incluido'},
        ][:days]

    if 'salta' in n:
        return [
            {'day':1,'title':'Llegada a Salta','description':'Recepción en el aeropuerto. Tarde libre para recorrer el centro histórico: Plaza 9 de Julio, Cabildo y Catedral Basílica.','meals':'Cena incluida'},
            {'day':2,'title':'Quebrada de Humahuaca (Patrimonio UNESCO)','description':'Excursión a Tilcara, Purmamarca (Cerro de los 7 Colores), Humahuaca y la Quebrada declarada Patrimonio de la Humanidad.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':3,'title':'Valles Calchaquíes y Cafayate','description':'Visita a las Bodegas de altura, Garganta del Diablo y Anfiteatro natural. Degustación de vinos Torrontés, el varietal emblemático de la región.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre. Traslado al aeropuerto.','meals':'Desayuno incluido'},
        ][:days]

    if 'mendoza' in n:
        return [
            {'day':1,'title':'Llegada a Mendoza','description':'Traslado al hotel en el corazón de la región vitivinícola más importante de Argentina. Paseo por el Parque San Martín y la Peatonal Sarmiento.','meals':'Cena incluida'},
            {'day':2,'title':'Ruta del Vino - Maipú y Luján de Cuyo','description':'Recorrido en bicicleta o en vehículo por bodegas premiadas internacionalmente. Visitas con degustación de Malbec, Cabernet y blends exclusivos. Almuerzo en viña.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':3,'title':'Alta Montaña - Aconcagua','description':'Excursión por la ruta internacional: Uspallata, Puente del Inca, Penitentes y Laguna del Inca. Vista al Aconcagua (6.962 m), el techo de América.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre para shopping o spa. Traslado al aeropuerto.','meals':'Desayuno incluido'},
        ][:days]

    if 'iguazu' in n or 'iguazu' in n:
        return [
            {'day':1,'title':'Llegada a Puerto Iguazú','description':'Traslado al hotel rodeado de selva subtropical. Tarde libre para relajarse junto a la pileta con el sonido del agua de fondo.','meals':'Cena incluida'},
            {'day':2,'title':'Cataratas: Lado Argentino','description':'Día completo en el Parque Nacional Iguazú. Circuito Superior, Inferior y Garganta del Diablo — el punto más imponente de las cataratas, declaradas Patrimonio Natural de la Humanidad.','meals':'Desayuno incluido'},
            {'day':3,'title':'Cataratas: Lado Brasileño + Itaipú','description':'Excursión al Parque Nacional de Foz do Iguaçu (Brasil) para la panorámica completa de las cataratas. Visita opcional a la Represa Itaipú, la mayor central hidroeléctrica del mundo.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre. Traslado al aeropuerto de Puerto Iguazú.','meals':'Desayuno incluido'},
        ][:days]

    if 'foz de iguazu' in n:
        return [
            {'day':1,'title':'Llegada a Foz do Iguaçu','description':'Traslado al hotel. Tarde libre para conocer la ciudad y sus mercados. Ciudad internacional en la triple frontera Argentina-Brasil-Paraguay.','meals':'Cena incluida'},
            {'day':2,'title':'Cataratas lado Brasileño','description':'Visita al Parque Nacional de Foz do Iguaçu para la icónica panorámica completa de las 275 cataratas. Pasarelas frente a la Garganta del Diablo.','meals':'Desayuno incluido'},
            {'day':3,'title':'Represa Itaipú y Hito das Três Fronteiras','description':'Tour por la represa Itaipú, obra de ingeniería entre las más importantes del mundo. Tarde: Hito das Três Fronteiras al atardecer.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre. Traslado al aeropuerto.','meals':'Desayuno incluido'},
        ][:days]

    if 'madryn' in n:
        return [
            {'day':1,'title':'Llegada a Puerto Madryn','description':'Traslado al hotel frente al Golfo Nuevo. Primera caminata por la costanera. Madryn es la puerta de entrada a la Patagonia Costera.','meals':'Cena incluida'},
            {'day':2,'title':'Avistaje de Ballenas Francas Australes','description':'Excursión en embarcación para observar ballenas jorobadas en su hábitat natural durante la temporada. Un espectáculo irrepetible a solo metros del bote.','meals':'Desayuno incluido'},
            {'day':3,'title':'Península Valdés - Patrimonio UNESCO','description':'Visita a Punta Norte (orcas), Caleta Valdés (elefantes marinos), Punta Delgada y Punta Pirámides. Avistaje de fauna en estado puro.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Regreso','description':'Mañana libre para visitar el EcoCentro o el Museo Paleontológico. Traslado al aeropuerto.','meals':'Desayuno incluido'},
        ][:days]

    if 'san martin' in n:
        return [
            {'day':1,'title':'Llegada a San Martín de los Andes','description':'Traslado al hotel en este pintoresco pueblo patagónico a orillas del Lago Lácar. Tarde libre por el centro con sus chalets y tiendas de artesanías.','meals':'Cena incluida'},
            {'day':2,'title':'Ruta de los 7 Lagos','description':'Excursión por una de las rutas escénicas más bellas del mundo: Lagos Machónico, Falkner, Villarino, Espejo, Correntoso y Nahuel Huapi con vista a Bariloche.','meals':'Desayuno incluido'},
            {'day':3,'title':'Lago Huechulafquen y Volcán Lanín','description':'Excursión al Parque Nacional Lanín con vista al Volcán Lanín (3.776 m). Kayak o navegación opcional en el lago de aguas cristalinas.','meals':'Desayuno incluido'},
            {'day':4,'title':'Regreso','description':'Mañana libre en San Martín. Traslado al aeropuerto de Chapelco.','meals':'Desayuno incluido'},
        ][:days]

    if 'esteros' in n:
        return [
            {'day':1,'title':'Llegada a Colonia Carlos Pellegrini','description':'Traslado desde Corrientes (vuelo + transfer). Llegada a la reserva natural. Check-in en lodge ecológico frente al estero. Briefing del ecosistema Iberá.','meals':'Cena incluida'},
            {'day':2,'title':'Safari fotográfico por los Esteros','description':'Amanecer en lancha por los canales: yacarés, carpinchos, ciervos de los pantanos, lobitos de río y más de 350 especies de aves. Tarde: senderismo a pie.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':3,'title':'Avistaje de Fauna y Lagunas','description':'Safari nocturno (opcional). Mañana: visita al Centro de Reproducción de Yaguaretés. Tarde: kayak entre camalotes y Victoria Regia.','meals':'Desayuno y Cena incluidos'},
            {'day':4,'title':'Regreso','description':'Último safari al amanecer. Traslado a Corrientes y vuelo de regreso.','meals':'Desayuno incluido'},
        ][:days]

    if 'tulipanes' in n:
        return [
            {'day':1,'title':'Llegada a Bariloche','description':'Traslado al hotel. Tarde libre por el Centro Cívico y la costanera del Nahuel Huapi.','meals':'Cena incluida'},
            {'day':2,'title':'El Campo de Tulipanes de Lago Puelo','description':'Excursión al famoso campo de tulipanes: laberinto de colores entre la naturaleza patagónica. Visita a la cervecería artesanal local.','meals':'Desayuno incluido'},
            {'day':3,'title':'Cascadas y Bosques de Lago Puelo','description':'Trekking a las cascadas del Río Azul. Bosque de arrayanes y miradores con vista al lago. Tarde libre en el pueblo.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Circuito Chico y Cerro Campanario','description':'Recorrido por el famoso Circuito Chico. Subida al Cerro Campanario con una de las 10 mejores vistas del mundo según National Geographic.','meals':'Desayuno incluido'},
            {'day':5,'title':'Regreso','description':'Mañana libre. Traslado al aeropuerto de Bariloche.','meals':'Desayuno incluido'},
        ][:days]

    if 'cruce andino' in n:
        return [
            {'day':1,'title':'Llegada a Bariloche','description':'Traslado al hotel. Paseo por el Centro Cívico y la costanera del Nahuel Huapi. Preparación para la gran travesía lacustre.','meals':'Cena incluida'},
            {'day':2,'title':'Cruce de Lagos: Bariloche a Puerto Blest','description':'Embarcación por el Lago Nahuel Huapi hasta Puerto Blest. Visita a la Cascada Los Cántaros. Almuerzo en Peulla (Chile).','meals':'Desayuno y Almuerzo incluidos'},
            {'day':3,'title':'Peulla a Puerto Varas','description':'Continuación del cruce por los Lagos Todos los Santos, Rupanco y Llanquihue. Llegada a Puerto Varas con vista al Volcán Osorno.','meals':'Desayuno incluido'},
            {'day':4,'title':'Puerto Varas y Petrohué','description':'Excursión a los Saltos del Petrohué y Volcán Osorno. Tarde libre en Puerto Varas con sus casas alemanas y el Lago Llanquihue.','meals':'Desayuno incluido'},
            {'day':5,'title':'Puerto Montt y Traslado','description':'Recorrido por el mercado artesanal de Angelmó en Puerto Montt. Traslado al aeropuerto para vuelo de regreso.','meals':'Desayuno incluido'},
        ][:days]

    # ── BRASIL ──
    if 'buzios' in n:
        base = [
            {'day':1,'title':'Llegada a Búzios','description':'Traslado desde Rio de Janeiro (~2 hs). Check-in y primera recorrida por la Rua das Pedras, la calle más bohemia y animada de la costa de Brasil.','meals':'Cena incluida'},
            {'day':2,'title':'Playas del Litoral Oeste','description':'Mañana en las playas de aguas calmas: Ferradurinha, Ferradura y Tartaruga — ideales para snorkeling. Tarde con equipos de buceo disponibles.','meals':'Desayuno incluido'},
            {'day':3,'title':'Tour de Escunas por las 27 Playas','description':'Navegación en velero (escuna) por las playas más bellas de Búzios: Joao Fernandes, Azedinha y Orla Bardot — dedicada a Brigitte Bardot, quien puso a Búzios en el mapa.','meals':'Desayuno incluido'},
            {'day':4,'title':'Playas del Litoral Este','description':'Día libre para explorar playas del litoral este: João Fernandinho, Brava y Olho de Boi (nudista). Tarde de compras en las boutiques.','meals':'Desayuno incluido'},
            {'day':5,'title':'Snorkeling y Deportes Acuáticos','description':'Mañana de actividades: surf, kite, stand-up paddle o inmersiones guiadas entre peces tropicales y tartarugas marinas.','meals':'Desayuno incluido'},
            {'day':6,'title':'Día libre en la Playa','description':'Mañana completa libre en la playa preferida. Tarde: masaje na praia y sunset en el molo del centro.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso a Rio y Vuelo','description':'Traslado al aeropuerto de Rio de Janeiro. Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'maragogi' in n:
        base = [
            {'day':1,'title':'Llegada a Maragogi','description':'Traslado desde Maceió (~90 min). Check-in en resort frente al mar. Primera tarde en la playa de aguas esmeralda.','meals':'Cena incluida'},
            {'day':2,'title':'Galés de Maragogi — Piscinas Naturales','description':'Paseo en embarcação hasta las famosas piscinas naturales de Maragogi, declaradas Área de Protección Ambiental. Snorkeling entre peces coloridos y fondos de coral.','meals':'Desayuno incluido'},
            {'day':3,'title':'Barra Grande y Canavieiras','description':'Excursión por la costa: pueblos de pescadores, cocina típica alagoana y playas vírgenes sin turistas.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Día de Playa Libre','description':'Jornada libre en la playa del resort. Opción: paseo a caballo por la orilla al atardecer.','meals':'Desayuno incluido'},
            {'day':5,'title':'Excursión a Tamandaré','description':'Visita a la reserva de arrecifes de Tamandaré: buceo entre tortugas marinas y arrecifes de coral multicolor.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':6,'title':'Playa y Atardecer','description':'Último día de playa. Tarde libre para disfrutar del famoso sunset de Maragogi con sus cielos naranjas.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso','description':'Traslado a Maceió y vuelo de regreso.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'rio de janeiro' in n:
        base = [
            {'day':1,'title':'Llegada a Rio de Janeiro','description':'Traslado al hotel en Ipanema o Copacabana. Primera vista al mar y a los cerros cariocas. Samba y caipirinha de bienvenida en Lapa.','meals':'Cena incluida'},
            {'day':2,'title':'Cristo Redentor y Pan de Azúcar','description':'Mañana: subida al Cristo Redentor en el Corcovado (Patrimonio UNESCO). Tarde: teleférico hasta la cima del Pão de Açúcar con vista 360° de la bahía.','meals':'Desayuno incluido'},
            {'day':3,'title':'Copacabana e Ipanema','description':'Playa en Copacabana: la playa más famosa del mundo. Caminata hasta Ipanema y visita a la Pedra do Arpoador al sunset. Shopping en la Feira de Ipanema.','meals':'Desayuno incluido'},
            {'day':4,'title':'Corcovado, Jardín Botánico y Tijuca','description':'Trekking por el Bosque de la Tijuca, la mayor selva urbana del mundo. Jardín Botánico con orquídeas y vitórias régias. Tarde: favela tour cultural (opcional).','meals':'Desayuno incluido'},
            {'day':5,'title':'Santa Teresa y Lapa','description':'Barrio colonial de Santa Teresa: atelier de artistas, botecos y el Bondinho. Noche en Lapa con roda de samba en vivo — el ritual carioca por excelencia.','meals':'Desayuno incluido'},
            {'day':6,'title':'Día libre en Rio','description':'Jornada libre: excursión opcional a Búzios, Petrópolis o Ilha Grande. Tarde: último atardecer en Ipanema.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso','description':'Traslado al aeropuerto de Galeão (GIG). Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'salvador' in n:
        base = [
            {'day':1,'title':'Llegada a Salvador de Bahía','description':'Traslado al hotel en el Pelourinho o en la playa de Barra. Orientación y primera degustación de la cocina bahiana: acarajé, moqueca y vatapá.','meals':'Cena incluida'},
            {'day':2,'title':'Pelourinho — Patrimonio UNESCO','description':'Día completo en el Centro Histórico: Plaza Terreiro de Jesus, Iglesia de São Francisco (cubierta de oro), Fundação Casa de Jorge Amado. Capoeira en las calles coloniales.','meals':'Desayuno incluido'},
            {'day':3,'title':'Ilha de Itaparica','description':'Ferry hasta la Isla de Itaparica: playas tranquilas, cocoteros y la ciudad colonial de Vera Cruz. Almuerzo de frutos del mar a orillas del mar.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Playas del Sur: Porto da Barra y Ondina','description':'Playa de Porto da Barra (la más linda de la ciudad), snorkeling en las aguas cristalinas de la Bahía de Todos los Santos. Tarde libre.','meals':'Desayuno incluido'},
            {'day':5,'title':'Morro de São Paulo','description':'Lancha rápida hasta Morro de São Paulo: cuatro playas sin autos, palmeras y arrecifes de coral. Un paraíso de arena blanca.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':6,'title':'Día libre en Salvador','description':'Mañana libre para compras en el Mercado Modelo (artesanías bahianas) o relax en la playa. Noche de axé, forró o samba de roda.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso','description':'Traslado al aeropuerto Luis Eduardo Magalhães. Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'maceio' in n:
        base = [
            {'day':1,'title':'Llegada a Maceió','description':'Traslado al hotel frente a la Playa de Pajuçara. Tarde libre con primer contacto con las aguas verdes características de las playas alagoanas.','meals':'Cena incluida'},
            {'day':2,'title':'Piscinas Naturales de Pajuçara','description':'Jangada (balsa tradicional) hasta las piscinas naturales a 2 km de la orilla: aguas cristalinas con peces tropicales. Snorkeling incluido.','meals':'Desayuno incluido'},
            {'day':3,'title':'Praia do Francês y São Miguel dos Milagres','description':'Excursión a las playas más bellas de Alagoas: Praia do Francês con sus aguas azul-verde y corredores de coqueiros, y São Miguel dos Milagres, una de las 10 mejores de Brasil.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Maragogi — Galés','description':'Excursión a las piscinas naturales de Maragogi (UNESCO), consideradas las más bellas de Brasil.','meals':'Desayuno incluido'},
            {'day':5,'title':'Día libre en Maceió','description':'Playa de Ponta Verde o Cruz das Almas. Tarde: Lagoa do Mundaú en catamarán al atardecer.','meals':'Desayuno incluido'},
            {'day':6,'title':'Penedo y Rio São Francisco','description':'Excursión a Penedo, ciudad colonial portuguesa a orillas del São Francisco. Artesanías de renda alagoana y gastronomía regional.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':7,'title':'Regreso','description':'Traslado al aeropuerto Zumbi dos Palmares. Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'natal' in n:
        base = [
            {'day':1,'title':'Llegada a Natal','description':'Traslado al hotel. Primer paseo por la Praia de Ponta Negra y el Morro do Careca — la postal más famosa de la ciudad.','meals':'Cena incluida'},
            {'day':2,'title':'Genipabu — Dunas y Chamelões','description':'Buggy por las dunas de Genipabu (uno de los mayores parques dunares del mundo) y paseo en jangada por el Río Potengi.','meals':'Desayuno incluido'},
            {'day':3,'title':'Praia de Maracajaú — Parrachos','description':'Excursión a los Parrachos de Maracajaú: arrecifes naturales que emergen con la bajante, formando piletas con miles de peces.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Lagoa de Nísia Floresta','description':'Visita a la laguna de agua dulce rodeada de dunas. Tarde: Fortaleza dos Reis Magos, primera fortaleza de Brasil.','meals':'Desayuno incluido'},
            {'day':5,'title':'Praia da Pipa','description':'Excursión a Pipa: acantilados rojos, delfines en la Bahia dos Golfinhos y la Lagoa do Guaraíras.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':6,'title':'Día libre en Natal','description':'Mañana libre en Ponta Negra. Tarde de compras y artesanías.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso','description':'Traslado al aeropuerto Augusto Severo. Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'recife' in n or 'porto de galinhas' in n or 'pratagy' in n or 'ipioca' in n or 'praia do frances' in n or 'barra de santo antonio' in n:
        dest_name = name
        base = [
            {'day':1,'title':'Llegada a ' + dest_name,'description':'Traslado al hotel frente al mar. Check-in y primera tarde para disfrutar de las playas de aguas cálidas.','meals':'Cena incluida'},
            {'day':2,'title':'Playas y Piscinas Naturales','description':'Excursión a las piscinas naturales formadas en los arrecifes de coral durante la bajamar. Snorkeling con peces tropicales de colores.','meals':'Desayuno incluido'},
            {'day':3,'title':'Excursión Costera','description':'Recorrido por los pueblos y playas vecinas: artesanías locales, gastronomía nordestina y naturaleza preservada.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Día libre en la Playa','description':'Jornada completa libre para disfrutar del mar, hacer snorkeling o deportes acuáticos.','meals':'Desayuno incluido'},
            {'day':5,'title':'Actividades Acuáticas','description':'Kayak, stand-up paddle o buceo en arrecifes. Tarde libre en la playa.','meals':'Desayuno incluido'},
            {'day':6,'title':'Último día de Sol','description':'Mañana libre. Tarde: compras de artesanías locales y recuerdos.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso','description':'Traslado al aeropuerto y vuelo de regreso.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    # ── CARIBE / MEXICO ──
    if 'cancun' in n:
        base = [
            {'day':1,'title':'Llegada a Cancún','description':'Traslado al hotel en la Zona Hotelera. Primer contacto con las aguas turquesa del Mar Caribe. Tarde libre y cena de bienvenida.','meals':'Cena incluida'},
            {'day':2,'title':'Zona Hotelera y Playa Delfines','description':'Día de playa en el hotel. Tarde: recorrido por la Zona Hotelera y el icónico letrero de Cancún. Sunset en la Laguna Nichupté.','meals':'Desayuno incluido'},
            {'day':3,'title':'Chichén Itzá — Maravilla del Mundo','description':'Excursión a Chichén Itzá, una de las 7 Maravillas del Mundo Moderno: Pirámide de Kukulcán, Juego de Pelota y el Cenote Ik Kil. Almuerzo en hacienda yucateca.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Isla Mujeres en Catamarán','description':'Travesía en catamarán hasta Isla Mujeres: snorkeling en arrecifes de coral, playas de arena blanca como talco y el Pueblo Mágico.','meals':'Desayuno incluido'},
            {'day':5,'title':'Tulum y Cobá','description':'Excursión a las ruinas mayas de Tulum sobre los acantilados frente al Caribe. Ascenso opcional a la Pirámide de Cobá (42 m). Nado en cenote sagrado.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':6,'title':'Xel-Há o Xcaret','description':'Día completo en el parque ecoarqueológico a elección: esnórkeling en el río subterráneo de Xel-Há o espectáculo cultural de Xcaret al atardecer.','meals':'Desayuno incluido'},
            {'day':7,'title':'Día libre en el Resort','description':'Última mañana de playa. Tarde: compras en Mercado 28 o La Isla Shopping Village.','meals':'Desayuno incluido'},
            {'day':8,'title':'Regreso','description':'Traslado al aeropuerto internacional de Cancún (CUN). Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'playa del carmen' in n or 'riviera maya' in n or 'costa mujeres' in n:
        dest_label = 'Playa del Carmen' if 'playa' in n else ('Costa Mujeres' if 'costa' in n else 'Riviera Maya')
        base = [
            {'day':1,'title':'Llegada a ' + dest_label,'description':'Traslado al hotel todo incluido. Orientación del resort y primera tarde en la playa caribeña. Cena de bienvenida en el buffet.','meals':'Todo incluido'},
            {'day':2,'title':'La Quinta Avenida y Playa','description':'Mañana de playa. Tarde: paseo por la Quinta Avenida de Playa del Carmen: boutiques, restaurantes al aire libre y vida nocturna.','meals':'Todo incluido'},
            {'day':3,'title':'Tulum Arqueológico y Cenote','description':'Excursión a las ruinas mayas de Tulum, la única ciudad maya costera. Cenote sagrado para snorkeling en aguas subterráneas cristalinas.','meals':'Desayuno incluido'},
            {'day':4,'title':'Xcaret o Xel-Há','description':'Día en el parque eco-arqueológico: río subterráneo, arrecifes, animales en peligro de extinción y espectáculo cultural nocturno.','meals':'Desayuno incluido'},
            {'day':5,'title':'Chichén Itzá','description':'Maravilla del Mundo Moderno: Pirámide de Kukulcán, Observatorio Maya y Cenote Ik Kil. Almuerzo en hacienda yucateca.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':6,'title':'Cobá y Pueblo Mágico Valladolid','description':'Ruinas de Cobá entre la selva (ascenso a la pirámide). Visita a Valladolid con su Cenote Zací en el centro del pueblo.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':7,'title':'Día libre de resort','description':'Última jornada de playa. Deportes acuáticos: kayak, paddleboard, snorkeling o buceo con instructor.','meals':'Todo incluido'},
            {'day':8,'title':'Regreso','description':'Traslado al aeropuerto de Cancún (CUN). Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'punta cana' in n or 'la romana' in n or 'miches' in n or 'republica dominicana' in n:
        base = [
            {'day':1,'title':'Llegada a Punta Cana','description':'Traslado al resort todo incluido. Check-in y primera tarde de playa en las arenas blancas con palmeras que tocan el agua.','meals':'Todo incluido'},
            {'day':2,'title':'Playa Bávaro','description':'Día completo de relax en la mundialmente famosa Playa Bávaro, elegida varias veces entre las mejores del mundo.','meals':'Todo incluido'},
            {'day':3,'title':'Isla Saona en Catamarán','description':'Excursión a la Isla Saona: catamarán, snorkeling en arrecifes de coral y la icónica piscina natural con estrellas de mar.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':4,'title':'Santo Domingo Colonial','description':'Excursión a la capital: Ciudad Colonial Patrimonio UNESCO, Catedral de las Américas (primera del Nuevo Mundo), Fortaleza Ozama.','meals':'Desayuno incluido'},
            {'day':5,'title':'Hoyo Azul y Cenotes','description':'Excursión al Hoyo Azul (cenote turquesa de Cap Cana) y paseo a caballo por la playa.','meals':'Desayuno incluido'},
            {'day':6,'title':'Deportes Acuáticos','description':'Día de actividades: kitesurf, kayak, buceo o parasailing sobre las aguas del Atlántico.','meals':'Todo incluido'},
            {'day':7,'title':'Último día de playa','description':'Mañana libre. Tarde: compras en el mercado artesanal y souvenirs.','meals':'Todo incluido'},
            {'day':8,'title':'Regreso','description':'Traslado al aeropuerto internacional de Punta Cana (PUJ). Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    if 'aruba' in n or 'palm' in n:
        base = [
            {'day':1,'title':'Llegada a Aruba','description':'Bienvenida en el Aeropuerto Internacional Reina Beatrix. Traslado al resort en Palm Beach. Primera tarde junto al Caribe.','meals':'Cena incluida'},
            {'day':2,'title':'Eagle Beach y Palm Beach','description':'Eagle Beach, elegida varias veces como la mejor playa del Caribe por TripAdvisor. Aguas calmas ideales para snorkeling y natación.','meals':'Desayuno incluido'},
            {'day':3,'title':'Snorkeling en Antilla (Naufragio)','description':'Excursión de snorkeling al Antilla, el naufragio alemán más grande del Caribe. Buceo entre corales y peces tropicales.','meals':'Desayuno incluido'},
            {'day':4,'title':'Safari 4x4 por el Norte','description':'Safari en jeep por el lado natural de la isla: Parque Nacional Arikok, Pozos Naturales (Natural Pool), playa Dos Playa y Alto Vista.','meals':'Desayuno y Almuerzo incluidos'},
            {'day':5,'title':'Oranjestad y Tiendas','description':'Visita a la colorida capital Oranjestad: arquitectura holandesa, duty-free shops y el Museo Arqueológico de Aruba.','meals':'Desayuno incluido'},
            {'day':6,'title':'Catamaran Sunset Cruise','description':'Navegación al atardecer en catamarán con snorkeling en arrecifes, open bar y espectáculo de delfines.','meals':'Desayuno incluido'},
            {'day':7,'title':'Regreso','description':'Traslado al aeropuerto. Fin de los servicios.','meals':'Desayuno incluido'},
        ]
        return base[:days]

    # Generico
    d = days or 4
    return [
        {'day': i+1, 'title': 'Día ' + str(i+1) + ' en ' + name,
         'description': 'Llegada, traslados y recorrido por los puntos principales del destino.',
         'meals': 'Desayuno incluido' if i > 0 else 'Cena incluida'}
        for i in range(d)
    ]


def to_simple(items):
    result = []
    for d in items:
        if 'title' in d:
            desc = d.get('description', '')
            meals = d.get('meals', '')
            if meals:
                desc = desc + ' | ' + meals + '.'
            result.append({'day': 'Día ' + str(d['day']) + ' — ' + d['title'], 'desc': desc})
        else:
            result.append(d)
    return result


# ── Includes / Excludes por categoría ────────────────────────
def make_includes(pkg):
    cat = (pkg.get('category') or '').lower()
    base = ['Aéreo ida y vuelta desde Rosario', 'Traslado aeropuerto-hotel-aeropuerto',
            str(pkg.get('days',4)-1) + ' noches de alojamiento', 'Desayuno diario en el hotel',
            'Asistencia al viajero durante todo el viaje', 'Acompañante Corradi Viajes disponible 24/7']
    if cat in ('caribe','internacional'):
        base.insert(3, 'All Inclusive (comidas, bebidas y snacks)')
    if cat == 'brasil':
        base.insert(3, 'Desayuno y cenas en el hotel')
    if cat == 'nacional':
        base.insert(4, 'Traslados internos incluidos')
    return '\n'.join(['• ' + x for x in base])

def make_excludes(pkg):
    base = ['Gastos personales y propinas', 'Excursiones opcionales no detalladas',
            'Bebidas en restaurantes (salvo todo incluido)', 'Seguro de equipaje',
            'Visa (consultar según destino)', 'Suplemento por habitación individual']
    return '\n'.join(['• ' + x for x in base])

def make_highlights(pkg):
    name = (pkg.get('name') or '').lower()
    n = name
    h = []
    if 'perito moreno' in n or 'calafate' in n: h.append('Glaciar Perito Moreno — Patrimonio Natural UNESCO')
    if 'iguazu' in n or 'iguazú' in n: h.append('Cataratas del Iguazú — Patrimonio Natural UNESCO')
    if 'ushuaia' in n: h.append('Ciudad más austral del mundo')
    if 'cancun' in n or 'playa del carmen' in n or 'riviera maya' in n: h.append('Cenotes mayas y ruinas de Tulum')
    if 'salta' in n and 'tren' in n: h.append('Tren a las Nubes a 4.220 m.s.n.m.')
    if 'bariloche' in n: h.append('Cerro Campanario — una de las 10 mejores vistas del mundo')
    if 'rio' in n: h.append('Cristo Redentor y Pan de Azúcar')
    if 'buzios' in n: h.append('Tour de escunas por las 27 playas')
    if 'cruce andino' in n: h.append('Cruce bioceánico Bariloche-Puerto Varas')
    if 'aruba' in n or 'palm' in n: h.append('Eagle Beach — entre las mejores playas del Caribe')
    if 'madryn' in n: h.append('Avistaje de ballenas francas australes')
    if 'esteros' in n: h.append('Safari fotográfico con yaguaretés y yacarés')
    days = pkg.get('days', 4)
    h += [str(days-1) + ' noches en hotel de categoría',
          'Atención y asesoramiento de Corradi Viajes durante todo el viaje',
          'Precio por persona en base doble']
    return '\n'.join(['⭐ ' + x for x in h])

def make_description(pkg):
    name = pkg.get('name','')
    days = pkg.get('days', 4)
    nights = days - 1
    country = pkg.get('country','')
    cat = (pkg.get('category') or '').lower()
    if cat in ('caribe',):
        return (f"Viví el Caribe en estado puro en {name}. {nights} noches de arena blanca, aguas turquesa "
                f"y sol sin límite. Un paquete todo incluido diseñado para que no te preocupes por nada: "
                f"solo disfrutar. Desde Rosario con aéreo confirmado y traslados incluidos.")
    if cat == 'brasil':
        return (f"Brasil te llama. {name} es uno de los destinos más vibrantes de Sudamérica: "
                f"playas exuberantes, gastronomía increíble y una energía única. "
                f"{nights} noches con desayuno, aéreo desde Rosario y todos los traslados.")
    if cat == 'nacional':
        return (f"Descubrí {name}, uno de los destinos más impresionantes de Argentina. "
                f"Un viaje de {days} días y {nights} noches diseñado para que conozcas lo mejor "
                f"del destino sin preocuparte por nada. Aéreo, hotel y traslados incluidos.")
    if cat == 'europa':
        return (f"Europa te espera. {name} combina historia, arquitectura y gastronomía en un paquete "
                f"de {days} días y {nights} noches con todo lo esencial incluido desde Rosario.")
    return (f"Descubrí {name} con Corradi Viajes. {days} días y {nights} noches de experiencias "
            f"únicas con aéreo, hotel y traslados incluidos. Atención personalizada antes, durante y después.")


# ── Main ──────────────────────────────────────────────────────
def main():
    # Traer todos los paquetes
    r = requests.get(SUPABASE_URL + '/rest/v1/corradi_packages?select=*&order=id.asc', headers=H)
    pkgs = r.json()
    print('Total paquetes:', len(pkgs))

    ok = fail = 0
    for pkg in pkgs:
        pid = pkg['id']
        name = pkg.get('name','')
        days = pkg.get('days') or 4
        print('\n[' + str(pid) + '] ' + name)

        itinerary = to_simple(make_itinerary(name, days))
        payload = {
            'image_url':   get_image(name),
            'images':      [],
            'description': make_description(pkg),
            'highlights':  make_highlights(pkg),
            'includes':    make_includes(pkg),
            'excludes':    make_excludes(pkg),
            'itinerary':   json.dumps(itinerary, ensure_ascii=False),
            'difficulty':  'Facil',
            'departure_city': pkg.get('departure_city') or 'Rosario',
        }

        res = requests.patch(
            SUPABASE_URL + '/rest/v1/corradi_packages?id=eq.' + str(pid),
            headers=H,
            json=payload
        )
        if res.status_code == 204:
            print('  OK - itinerario ' + str(len(itinerary)) + ' dias, imagen asignada')
            ok += 1
        else:
            print('  ERROR ' + str(res.status_code) + ': ' + res.text[:80])
            fail += 1

    print('\n' + '='*50)
    print('Resultado: ' + str(ok) + ' OK | ' + str(fail) + ' errores')

if __name__ == '__main__':
    main()
