import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

search_bar_match = re.search(r'<!-- Global Search Bar -->(.*?)</button>\s*</div>\s*</div>', html, re.DOTALL)
search_bar = search_bar_match.group(1) + "</button>\n        </div>"

def make_search_bar(suffix):
    s = search_bar
    s = s.replace('id="destContainer"', f'id="destContainer{suffix}"')
    s = s.replace('id="searchDest"', f'id="searchDest{suffix}"')
    s = s.replace('id="searchDestHidden"', f'id="searchDestHidden{suffix}"')
    s = s.replace('id="destPopover"', f'id="destPopover{suffix}"')
    s = s.replace('id="monthContainer"', f'id="monthContainer{suffix}"')
    s = s.replace('id="searchMonthDisplay"', f'id="searchMonthDisplay{suffix}"')
    s = s.replace('id="searchMonth"', f'id="searchMonth{suffix}"')
    s = s.replace('id="monthPopover"', f'id="monthPopover{suffix}"')
    s = s.replace('id="monthGrid"', f'id="monthGrid{suffix}"')
    s = s.replace('id="priceContainer"', f'id="priceContainer{suffix}"')
    s = s.replace('id="searchPriceDisplay"', f'id="searchPriceDisplay{suffix}"')
    s = s.replace('id="searchPrice"', f'id="searchPrice{suffix}"')
    s = s.replace('id="pricePopover"', f'id="pricePopover{suffix}"')
    s = s.replace('triggerSearch()', f'triggerSearch{suffix}()')
    return s

search_bar2 = make_search_bar('2')
search_bar3 = make_search_bar('3')

old_sections = r"""  <!-- Cinematic Video Section -->
  <section class="w-full relative h-\[50vh\] md:h-\[60vh\] min-h-\[300px\] max-h-\[500px\] overflow-hidden">
    <video autoplay="" muted="" loop="" playsinline="" preload="none" poster="img/hero_travel_new.png" class="absolute inset-0 w-full h-full object-cover" style="transform:scale\(1\.05\);">
      <source data-src="hero" type="video/mp4" src="https://czocbnyoenjbpxmcqobn\.supabase\.co/storage/v1/object/public/corradi-media/Video%20Project\.mp4">
    </video>
    <div class="absolute inset-0 pointer-events-none" style="background:rgba\(0,0,0,0\.35\)"></div>
  </section>

  <!-- Cinematic Video Section 2 -->
  <section class="w-full relative h-\[50vh\] md:h-\[60vh\] min-h-\[300px\] max-h-\[500px\] overflow-hidden">
    <video autoplay="" muted="" loop="" playsinline="" preload="none" poster="img/hero_travel_new.png" class="absolute inset-0 w-full h-full object-cover" style="transform:scale\(1\.05\);">
      <source data-src="hero" type="video/mp4" src="https://czocbnyoenjbpxmcqobn\.supabase\.co/storage/v1/object/public/corradi-media/Video%20Project\.mp4">
    </video>
    <div class="absolute inset-0 pointer-events-none" style="background:rgba\(0,0,0,0\.35\)"></div>
  </section>"""

new_sections = f"""  <!-- Cinematic Video Section -->
  <section class="w-full relative h-[50vh] md:h-[60vh] min-h-[300px] max-h-[500px] overflow-hidden flex flex-col justify-center items-center">
    <video autoplay="" muted="" loop="" playsinline="" preload="none" poster="img/hero_travel_new.png" class="absolute inset-0 w-full h-full object-cover" style="transform:scale(1.05);">
      <source data-src="hero" type="video/mp4" src="https://czocbnyoenjbpxmcqobn.supabase.co/storage/v1/object/public/corradi-media/Video%20Project.mp4">
    </video>
    <div class="absolute inset-0 pointer-events-none" style="background:rgba(0,0,0,0.35)"></div>
    <div class="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">
      <!-- Global Search Bar 2 -->
      {search_bar2}
    </div>
  </section>

  <!-- Cinematic Video Section 2 -->
  <section class="w-full relative h-[50vh] md:h-[60vh] min-h-[300px] max-h-[500px] overflow-hidden flex flex-col justify-center items-center">
    <video autoplay="" muted="" loop="" playsinline="" preload="none" poster="img/hero_travel_new.png" class="absolute inset-0 w-full h-full object-cover" style="transform:scale(1.05);">
      <source data-src="hero" type="video/mp4" src="https://czocbnyoenjbpxmcqobn.supabase.co/storage/v1/object/public/corradi-media/Video%20Project.mp4">
    </video>
    <div class="absolute inset-0 pointer-events-none" style="background:rgba(0,0,0,0.35)"></div>
    <div class="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">
      <!-- Global Search Bar 3 -->
      {search_bar3}
    </div>
  </section>"""

html = re.sub(old_sections, new_sections, html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
