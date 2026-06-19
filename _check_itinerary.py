import requests, json

SUPABASE_URL = 'https://czocbnyoenjbpxmcqobn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b2NibnlvZW5qYnB4bWNxb2JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDI5MTMsImV4cCI6MjA2ODQxODkxM30.pNgJnwAY8uxb6yCQilJfD92VNwsCkntr4Ie_os2lI44'
H = {'Authorization': 'Bearer '+SUPABASE_KEY, 'apikey': SUPABASE_KEY}

r = requests.get(SUPABASE_URL+'/rest/v1/corradi_packages?select=id,name,itinerary&id=eq.32', headers=H)
pkg = r.json()[0]
print('Type:', type(pkg['itinerary']))
print('Value raw repr:')
print(repr(str(pkg['itinerary'])[:300]))
