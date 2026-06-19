import requests

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'

h = {
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'apikey': SUPABASE_KEY,
}

r = requests.get(
    SUPABASE_URL + '/rest/v1/corradi_packages?select=id,name,country,price_usd&active=eq.false&order=id.desc&limit=60',
    headers=h
)
pkgs = r.json()
print('Paquetes active=false:', len(pkgs))
for p in pkgs:
    print('  ID=' + str(p['id']) + ' | ' + str(p['name'])[:45] + ' | ' + str(p['country']) + ' | USD ' + str(p['price_usd']))

# Nombres claramente incorrectos para borrar
bad_keywords = ['Desde Cordoba', 'Desde Rosario 05', 'Paquete Terrestre', 'Ski - Temporada',
                'Cupos Peninsula', 'Cupos Europa', 'Cupos Espana', 'Los mejores paquetes']
to_delete = [p['id'] for p in pkgs if any(k.lower() in p['name'].lower() for k in bad_keywords)]
print('\nPara borrar:', to_delete)

if to_delete:
    for pid in to_delete:
        dr = requests.delete(
            SUPABASE_URL + '/rest/v1/corradi_packages?id=eq.' + str(pid),
            headers=h
        )
        print('  Borrado ID=' + str(pid) + ' status=' + str(dr.status_code))
