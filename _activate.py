import requests

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'

h = {
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
}

r = requests.patch(
    SUPABASE_URL + '/rest/v1/corradi_packages?active=eq.false',
    headers=h,
    json={'active': True}
)
print('Status:', r.status_code)

# Verificar
r2 = requests.get(
    SUPABASE_URL + '/rest/v1/corradi_packages?select=id,name&active=eq.true&order=id.asc',
    headers=h
)
pkgs = r2.json()
print('Paquetes activos ahora:', len(pkgs))
