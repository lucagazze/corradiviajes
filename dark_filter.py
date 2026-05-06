import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract the Global Search Bar 2 block
pattern = re.compile(r'(<!-- Global Search Bar 2 -->\s*<div class="w-full )(bg-white/90)( backdrop-blur-xl p-1\.5 md:p-2 md:rounded-full rounded-\[32px\] flex flex-col md:flex-row items-center gap-1\.5 md:gap-2 transition-all border )(border-white/40)(.*?)(<button onclick="triggerSearch2\(\)")', re.DOTALL)

match = pattern.search(html)
if match:
    # We found the block
    prefix = match.group(1)
    bg = "bg-black/40" # changed from bg-white/90
    middle = match.group(3)
    border = "border-white/20" # changed from border-white/40
    content = match.group(5)
    suffix = match.group(6)
    
    # Now replace classes inside the content
    # Backgrounds
    content = content.replace('md:bg-white hover:bg-slate-50', 'md:bg-white/10 hover:bg-white/20')
    
    # Text colors
    content = content.replace('text-slate-800', 'text-white')
    content = content.replace('text-slate-500', 'text-white/70')
    content = content.replace('text-slate-400', 'text-white/50')
    content = content.replace('placeholder-slate-400', 'placeholder-white/50')
    content = content.replace('text-outline', 'text-white/70')
    
    # Hover colors
    content = content.replace('group-hover:text-primary', 'group-hover:text-white')
    
    new_block = prefix + bg + middle + border + content + suffix
    
    html = html[:match.start()] + new_block + html[match.end():]
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Done")
else:
    print("Not found")
