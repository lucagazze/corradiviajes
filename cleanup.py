content = open('index.html', 'r', encoding='utf-8').read()

main_tag = '<main class="w-full pt-[90px] md:pt-[100px]">'
main_tag_end = content.find(main_tag) + len(main_tag)

hero_marker = '<!-- Hero Section -->'
hero_start = content.find(hero_marker, main_tag_end)

# Replace everything between main tag end and hero marker with just a newline
new_content = content[:main_tag_end] + '\n\n  ' + content[hero_start:]

open('index.html', 'w', encoding='utf-8').write(new_content)
print('Done')
