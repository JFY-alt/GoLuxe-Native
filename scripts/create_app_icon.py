"""Build the editable GoLuxe icon SVG with bundled, outlined title lettering.
Rasterize assets/icon.svg to assets/icon.png at 1024 x 1024 after running this.
Requires fontTools; no system fonts or network access are used.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

root = Path(__file__).resolve().parent.parent
font = TTFont(root / 'node_modules/@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf')
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
word = 'GoLuxe'
names = [cmap[ord(c)] for c in word]
units = font['head'].unitsPerEm
scale = 202 / units
width = sum(glyphs[n].width for n in names) * scale
x = (1024 - width) / 2
pen = SVGPathPen(glyphs)
for name in names:
    glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 568)))
    x += glyphs[name].width * scale
lettering = pen.getCommands()
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <title>GoLuxe</title>
  <desc>A four-by-four Go board in GoLuxe’s dark dojo palette, with warm amber inlay, polished black and pearl-white stones on opposite corners, and the app’s ivory serif lettering across a clear center.</desc>
  <defs>
    <radialGradient id="wood" cx=".38" cy=".3" r=".85"><stop stop-color="#503b29"/><stop offset=".38" stop-color="#34251b"/><stop offset=".76" stop-color="#1a1511"/><stop offset="1" stop-color="#0d0d0d"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fef3c7"/><stop offset=".3" stop-color="#e3c19a"/><stop offset=".6" stop-color="#b89a6f"/><stop offset=".84" stop-color="#fde68a"/><stop offset="1" stop-color="#b89a6f"/></linearGradient>
    <linearGradient id="letter-gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffbeb"/><stop offset=".44" stop-color="#fef3c7"/><stop offset="1" stop-color="#e8d4a8"/></linearGradient>
    <radialGradient id="black" cx=".3" cy=".22" r=".8"><stop stop-color="#615d56"/><stop offset=".25" stop-color="#36332f"/><stop offset=".6" stop-color="#141412"/><stop offset="1" stop-color="#050505"/></radialGradient>
    <radialGradient id="white" cx=".3" cy=".22" r=".85"><stop stop-color="#ffffff"/><stop offset=".4" stop-color="#f8f5ed"/><stop offset=".76" stop-color="#ded8cc"/><stop offset="1" stop-color="#b3aa99"/></radialGradient>
    <mask id="grid-clear-title"><rect width="1024" height="1024" fill="white"/><rect x="160" y="421" width="704" height="182" fill="black"/></mask>
    <filter id="stone-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="6" dy="18" stdDeviation="16" flood-color="#000000" flood-opacity=".6"/></filter>
    <filter id="text-shadow" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#090604" flood-opacity=".65"/></filter>
    <filter id="sheen"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#wood)"/>
  <g fill="none" stroke="#d0a879" stroke-opacity=".035" stroke-width="2">
    <path d="M100 0 Q130 280 104 510 T118 1024 M170 0 Q156 320 178 630 T164 1024 M365 0 Q345 370 362 640 T351 1024 M647 0 Q673 310 650 610 T665 1024 M886 0 Q870 250 891 520 T875 1024 M397 0 Q376 410 401 790 T389 1024 M680 0 Q707 350 682 700 T695 1024"/>
  </g>
  <rect x="72" y="72" width="880" height="880" rx="158" fill="none" stroke="url(#gold)" stroke-width="2" opacity=".14"/>
  <g stroke="url(#gold)" stroke-width="5" stroke-linecap="butt" opacity=".64" mask="url(#grid-clear-title)">
    <path d="M230 230H794 M230 418H794 M230 606H794 M230 794H794 M230 230V794 M418 230V794 M606 230V794 M794 230V794" fill="none"/>
  </g>
  <g filter="url(#stone-shadow)">
    <circle cx="230" cy="230" r="102" fill="url(#black)" stroke="#bca47b" stroke-opacity=".26" stroke-width="1.5"/>
    <circle cx="794" cy="794" r="102" fill="url(#white)"/>
  </g>
  <ellipse cx="199" cy="177" rx="43" ry="16" transform="rotate(-30 199 177)" fill="#fff9e9" opacity=".15" filter="url(#sheen)"/>
  <ellipse cx="764" cy="742" rx="43" ry="16" transform="rotate(-30 764 742)" fill="#ffffff" opacity=".55" filter="url(#sheen)"/>
  <path d="{lettering}" fill="url(#letter-gold)" filter="url(#text-shadow)"/>
</svg>
'''
(root / 'assets/icon.svg').write_text(svg)
print('Created assets/icon.svg; title width:', round(width))
