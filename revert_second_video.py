import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The regex matches everything from "<!-- Cinematic Video Section 2 -->" to its closing "</section>"
# The closing section tag is followed by "<!-- Preguntas Frecuentes Section -->"
# We want to replace it with the simple video block.

simple_section = """  <!-- Cinematic Video Section 2 -->
  <section class="w-full relative h-[50vh] md:h-[60vh] min-h-[300px] max-h-[500px] overflow-hidden">
    <video autoplay="" muted="" loop="" playsinline="" preload="none" poster="img/hero_travel_new.png" class="absolute inset-0 w-full h-full object-cover" style="transform:scale(1.05);">
      <source data-src="hero" type="video/mp4" src="https://czocbnyoenjbpxmcqobn.supabase.co/storage/v1/object/public/corradi-media/Video%20Project.mp4">
    </video>
    <div class="absolute inset-0 pointer-events-none" style="background:rgba(0,0,0,0.35)"></div>
  </section>"""

# Using re.sub with DOTALL to replace the entire block
html = re.sub(r'  <!-- Cinematic Video Section 2 -->.*?  </section>', simple_section, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
