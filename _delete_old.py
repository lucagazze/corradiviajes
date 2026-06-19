import requests

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'

h = {
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
}

# Ver paquetes viejos (ID < 29)
r = requests.get(
    SUPABASE_URL + '/rest/v1/corradi_packages?select=id,name&id=lt.29&order=id.asc',
    headers=h
)
old = r.json()
print('Paquetes viejos a borrar:', len(old))
for p in old:
    print('  ID=' + str(p['id']) + ' | ' + str(p['name']))

# Borrar todos con ID < 29
dr = requests.delete(
    SUPABASE_URL + '/rest/v1/corradi_packages?id=lt.29',
    headers=h
)
print('\nBorrado status:', dr.status_code)

# Verificar total restante
r2 = requests.get(
    SUPABASE_URL + '/rest/v1/corradi_packages?select=id,name&order=id.asc',
    headers=h
)
print('Paquetes restantes:', len(r2.json()))
