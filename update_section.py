import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_start = """  <!-- Cinematic Video Section -->
  <section class="w-full relative h-[50vh] md:h-[60vh] min-h-[300px] max-h-[500px] overflow-hidden flex flex-col justify-center items-center">
    <video autoplay="" muted="" loop="" playsinline="" preload="none" poster="img/hero_travel_new.png" class="absolute inset-0 w-full h-full object-cover" style="transform:scale(1.05);">
      <source data-src="hero" type="video/mp4" src="https://czocbnyoenjbpxmcqobn.supabase.co/storage/v1/object/public/corradi-media/Video%20Project.mp4">
    </video>
    <div class="absolute inset-0 pointer-events-none" style="background:rgba(0,0,0,0.35)"></div>
    <div class="relative z-10 w-full max-w-5xl flex flex-col items-center text-center px-4">"""

new_start = """  <!-- Cinematic Video Section -->
  <section class="w-[90%] max-w-[1800px] mx-auto pt-0 pb-12 flex flex-col items-center">
    <div class="relative w-full h-[50vh] md:h-[60vh] min-h-[300px] max-h-[500px] flex flex-col justify-center items-center text-center rounded-[32px] overflow-hidden">
      <div class="absolute inset-0 rounded-[32px] overflow-hidden">
        <video autoplay="" muted="" loop="" playsinline="" preload="none" poster="img/hero_travel_new.png" class="absolute inset-0 w-full h-full object-cover" style="transform:scale(1.05);">
          <source data-src="hero" type="video/mp4" src="https://czocbnyoenjbpxmcqobn.supabase.co/storage/v1/object/public/corradi-media/Video%20Project.mp4">
        </video>
        <div class="absolute inset-0 pointer-events-none" style="background:rgba(0,0,0,0.35)"></div>
      </div>
      <div class="relative z-10 w-full max-w-5xl flex flex-col items-center text-center px-4">"""

html = html.replace(old_start, new_start)

# We need to add a closing </div> before the closing </section> for this specific section.
# We will use regex to find this section block and add the </div>

section_pattern = re.compile(r'(  <!-- Cinematic Video Section -->.*?)(  </section>)', re.DOTALL)
match = section_pattern.search(html)

if match:
    # Check if we already added it (by seeing if we modified the start)
    block = match.group(1)
    if 'class="w-[90%] max-w-[1800px]' in block:
        # We need to add the closing div for the new inner container
        html = html[:match.end(1)] + "    </div>\n" + match.group(2) + html[match.end(2):]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
