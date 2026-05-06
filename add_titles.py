import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

titles = """<h1 class="font-['Geomanist'] text-3xl md:text-[40px] font-bold text-white tracking-tight mb-1 drop-shadow-sm">
          Viajá con sentido.
        </h1>
        <p class="hero-text text-white/90 text-base md:text-lg font-light mb-8 drop-shadow-sm">
          Experiencias que no podrías planear ni aunque quisieras.
        </p>
        <!-- Global Search Bar """

html = html.replace(
    '<div class="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">\n      <!-- Global Search Bar 2',
    '<div class="relative z-10 w-full max-w-5xl flex flex-col items-center text-center px-4">\n        ' + titles + '2'
)

html = html.replace(
    '<div class="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">\n      <!-- Global Search Bar 3',
    '<div class="relative z-10 w-full max-w-5xl flex flex-col items-center text-center px-4">\n        ' + titles + '3'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
