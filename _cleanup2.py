import requests

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'

h = {
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
}

# IDs a borrar manualmente (nombres sin sentido)
# 63: Desde Cordoba 05 de Noviembre... (F1)
# 66: Cupos Peninsula Iberica (demasiado generico, tiene Europa mejor)
# 68: Cupos Espana Italia Costa Azul (tiene paquete de Europa mejor)
bad_ids = [63, 66, 68]

for pid in bad_ids:
    dr = requests.delete(
        SUPABASE_URL + '/rest/v1/corradi_packages?id=eq.' + str(pid),
        headers=h
    )
    print('Borrado ID=' + str(pid) + ' status=' + str(dr.status_code))

# Renombrar algunos con nombres demasiado genericos
renames = {
    72: 'Mexico - Paquetes a Medida',
    71: 'Republica Dominicana - Paquetes',
    73: 'Aruba - Todo Incluido',
}
for pid, new_name in renames.items():
    ur = requests.patch(
        SUPABASE_URL + '/rest/v1/corradi_packages?id=eq.' + str(pid),
        headers=h,
        json={'name': new_name}
    )
    print('Renombrado ID=' + str(pid) + ' -> ' + new_name + ' | status=' + str(ur.status_code))

# Contar total final
r = requests.get(
    SUPABASE_URL + '/rest/v1/corradi_packages?select=id,name,country&active=eq.false&order=id.asc',
    headers=h
)
pkgs = r.json()
print('\nTotal paquetes en DB (active=false):', len(pkgs))
for p in pkgs:
    print('  [' + str(p['id']) + '] ' + str(p['name'])[:50] + ' (' + str(p['country']) + ')')
