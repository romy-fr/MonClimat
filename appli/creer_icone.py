"""Icône de l'application : l'icône météo « Éclaircies » (soleil derrière un nuage gris, celle de la page Infos) sur un fond lavande,
la couleur du fond de l'application.
    python appli/creer_icone.py [icone.png]
1024 × 1024, RGB, sans transparence (exigence d'App Store Connect). Tout est dessiné par le code : aucune image ni police n'est nécessaire.
Le dessin reprend celui de app/modules/icones.js (grille de 48 unités), puis il est recadré, centré et mis à l'échelle."""
import math
import pathlib
import sys

from PIL import Image, ImageDraw

SORTIE = 1024
PART = 0.62                                     # le dessin occupe 62 % du côté de l'icône
HAUT, BAS = (214, 210, 251), (236, 232, 255)    # #d6d2fb -> #ece8ff : le fond de l'application
SOLEIL, NUAGE = (245, 166, 35), (138, 146, 157)  # #f5a623 et #8a929d, comme dans icones.js

# 1. le dessin, sur une toile transparente (4 000 px pour 48 unités)
U = 4000 / 48
calque = Image.new("RGBA", (4000, 4000), (0, 0, 0, 0))
d = ImageDraw.Draw(calque)
p = lambda x, y: (x * U, y * U)  # noqa: E731


def disque(cx, cy, r, couleur):
    d.ellipse([*p(cx - r, cy - r), *p(cx + r, cy + r)], fill=couleur)


cx, cy, r = 16, 15, 6.5                          # soleil : disque et huit rayons
for a in range(0, 360, 45):
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    d.line([p(cx + c * (r + 3), cy + s * (r + 3)), p(cx + c * (r + 6), cy + s * (r + 6))], fill=SOLEIL, width=round(2 * U))
    for k in (3, 6):
        disque(cx + c * (r + k), cy + s * (r + k), 1, SOLEIL)
disque(cx, cy, r, SOLEIL)

nuage = lambda x, y: (5 + 0.85 * x, 7 + 0.85 * y)  # noqa: E731  (échelle 0,85, décalé de 5 et 7)
for (lx, ly, lr) in ((13.4, 24.5, 7.5), (23.4, 18.0, 10.0), (33.4, 25.5, 6.5)):   # trois lobes
    disque(*nuage(lx, ly), lr * 0.85, NUAGE)
d.rectangle([*p(*nuage(13.4, 24.5)), *p(*nuage(33.4, 32))], fill=NUAGE)           # base plate

# 2. recadrage serré, mise à l'échelle et centrage sur le fond
dessin = calque.crop(calque.getbbox())
f = PART * SORTIE / max(dessin.size)
dessin = dessin.resize((round(dessin.width * f), round(dessin.height * f)), Image.LANCZOS)

img = Image.new("RGB", (SORTIE, SORTIE))
fond = ImageDraw.Draw(img)
for y in range(SORTIE):
    t = y / (SORTIE - 1)
    fond.line([(0, y), (SORTIE, y)], fill=tuple(round(HAUT[i] * (1 - t) + BAS[i] * t) for i in range(3)))
img.paste(dessin, ((SORTIE - dessin.width) // 2, (SORTIE - dessin.height) // 2), dessin)

sortie = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent / "icone.png"
img.save(sortie)
print("icône écrite :", sortie)
