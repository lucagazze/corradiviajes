import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'

img = 'https://corradiviajes.vercel.app/img/paquete-china.png'

itinerary = [
    {'day': '02 Sep — BEIJING', 'desc': 'Llegada a Beijing y traslado al hotel.'},
    {'day': '03 Sep — BEIJING', 'desc': 'Calle Peatonal Wangfujing y zona comercial Qiamen. Barrio Sanlitun con almuerzo buffet.'},
    {'day': '04 Sep — BEIJING', 'desc': 'Plaza Tian An Men y Palacio Imperial — La Ciudad Prohibida. Almuerzo chino en restaurante local. Palacio de Verano con paseo en barco incluido.'},
    {'day': '05 Sep — BEIJING', 'desc': 'Gran Muralla China — Paso Juyongguan. Almuerzo en montaña. Templo del Cielo.'},
    {'day': '06 Sep — BEIJING › XIAN', 'desc': 'Vuelo en clase económica Beijing–Xian (tasas e impuestos incluidos). Llegada a Xian y traslado al hotel.'},
    {'day': '07 Sep — XIAN', 'desc': 'Museo de los Guerreros de Terracota (cine dentro del museo incluido). Almuerzo chino en restaurante local. Fuente de Huaqing y Muralla Original de la ciudad.'},
    {'day': '08 Sep — XIAN › CHENGDU', 'desc': 'Tren de alta velocidad segunda clase Xian–Chengdu. Visita al Parque El Pueblo y Kuan Zhai Alley.'},
    {'day': '09 Sep — CHENGDU', 'desc': 'Centro de Investigación del Oso Panda. Almuerzo chino incluido. Gruta de Leshan con paseo en barco incluido.'},
    {'day': '10 Sep — CHENGDU › CHONGQING', 'desc': 'Tren de alta velocidad segunda clase Chengdu–Chongqing. Llegada y traslado al hotel.'},
    {'day': '11 Sep — CHONGQING', 'desc': "Parque E'Ling, Mountain City Footpath y Liziba Light Rail Observation Platform. Jiefangbei CBD y Chongqing Eye. Almuerzo chino incluido."},
    {'day': '12 Sep — CHONGQING', 'desc': 'Día libre.'},
    {'day': '13 Sep — CHONGQING › ZHANGJIAJIE', 'desc': 'Tren de alta velocidad segunda clase hacia Zhangjiajie. Llegada. Cena de bienvenida en el hotel.'},
    {'day': '14 Sep — ZHANGJIAJIE', 'desc': 'National Forest Park — Montaña de Tianzi (funicular incluido). Almuerzo incluido. Shuttle bus a Yuan Jia Jie — bajada en Bailong Elevator.'},
    {'day': '15 Sep — ZHANGJIAJIE', 'desc': 'Gran Cañón con visita al famoso Puente de Cristal. Montaña Tianmen con funicular incluido.'},
    {'day': '16 Sep — ZHANGJIAJIE › FURONG', 'desc': 'Traslado por tierra a Furong. Visita al Pueblo Antiguo de Furong. Almuerzo chino incluido. Alojamiento en Furong.'},
    {'day': '17 Sep — FURONG › FENGHUANG', 'desc': 'Traslado por tierra a Fenghuang. Visita al Pueblo Antiguo de Fenghuang. Almuerzo chino incluido. Alojamiento en Fenghuang.'},
    {'day': '18 Sep — FENGHUANG › SHANGHAI', 'desc': 'Mañana libre. Traslado al aeropuerto de Zhangjiajie. Vuelo económico Zhangjiajie–Shanghai (tasas incluidas). Llegada a Shanghai y traslado al hotel.'},
    {'day': '19 Sep — SHANGHAI', 'desc': 'Templo de Buda de Jade, casco antiguo y Malecón del Río Huangpu. Calle Peatonal Nanjing Road. Almuerzo buffet. Crucero nocturno por el Río Huangpu.'},
    {'day': '20 Sep — SHANGHAI › SUZHOU › SHANGHAI', 'desc': 'Traslado a Suzhou — La Venecia Oriental. Jardín del Administrador Humilde y Colina del Tigre. Almuerzo chino incluido. Regreso a Shanghai.'},
    {'day': '21 Sep — SHANGHAI', 'desc': 'Día libre.'},
    {'day': '22 Sep — SHANGHAI', 'desc': 'Día libre.'},
    {'day': '23 Sep — SHANGHAI', 'desc': 'Traslado al aeropuerto. Fin de los servicios. (Sin late check-out incluido.)'},
]

highlights = json.dumps([
    'Beijing: Guo Ji Yi Yuan Hotel 5★',
    'Xian: Bell Tower Grande Century Hotel 5★',
    'Chengdu: Lido Sheraton Hotel 5★',
    'Chongqing: Glenview ITC Plaza',
    'Zhangjiajie: Jingwu Pullman Hotel 5★',
    'Furong: Annai Xizhou Ji Hotel 5★',
    'Fenghuang: Phoenix City Boutique Hotel 5★',
    'Shanghai: Intercity Hotel The Bund 5★',
], ensure_ascii=False)

includes = json.dumps([
    'Hoteles indicados con desayuno buffet en todos los destinos',
    'Traslados y visitas en privado con guías locales en español',
    'Entradas a todas las visitas y comidas indicadas en el programa',
    'Vuelos en clase económica con tasas: Beijing/Xian y Zhangjiajie/Shanghai',
    'Tren de alta velocidad segunda clase: Xian – Chengdu – Chongqing – Zhangjiajie',
], ensure_ascii=False)

pkg = {
    'name': 'China Imperial — Un Mundo de Servicios',
    'destination': 'Beijing · Xian · Chengdu · Chongqing · Zhangjiajie · Furong · Fenghuang · Shanghai',
    'country': 'China',
    'category': 'Asia',
    'description': '22 días / 21 noches recorriendo los destinos más fascinantes de China: la Gran Muralla, los Guerreros de Terracota, las montañas Avatar de Zhangjiajie, los pandas de Chengdu y el skyline de Shanghai. Todo en hoteles 5★ con guías en español.',
    'price_usd': 4500,
    'days': 22,
    'image_url': img,
    'images': json.dumps([img], ensure_ascii=False),
    'itinerary': json.dumps(itinerary, ensure_ascii=False),
    'highlights': highlights,
    'includes': includes,
    'active': True,
    'featured': True,
}

headers = {
    'apikey': ANON_KEY,
    'Authorization': 'Bearer ' + ANON_KEY,
    'Content-Type': 'application/json; charset=utf-8',
    'Prefer': 'return=representation',
}

body = json.dumps(pkg, ensure_ascii=False).encode('utf-8')
req = urllib.request.Request(SUPABASE_URL + '/rest/v1/corradi_packages', data=body, headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as r:
        result = json.loads(r.read())
        print('OK — ID:', result[0]['id'])
except urllib.error.HTTPError as e:
    print('ERROR', e.code, e.read().decode('utf-8'))
