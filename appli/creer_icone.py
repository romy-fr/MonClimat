"""Icône de l'application : un soleil ambre, trois couches de montagnes et un nuage sur un ciel violet, dans la palette des graphiques.
    python appli/creer_icone.py [icone.png]
1024 × 1024, RGB, sans transparence (exigence d'App Store Connect). Tout est dessiné par le code : aucune image ni police n'est nécessaire."""
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter

T = 1024
HAUT, BAS = (43, 27, 107), (90, 99, 224)            # #2b1b6b -> #5a63e0
SOLEIL, HALO = (242, 181, 46), (255, 232, 160)
MONTS = [(33, 132, 217), (58, 80, 200), (34, 28, 100)]
NUAGE = (255, 255, 255)

img = Image.new("RGB", (T, T))
d = ImageDraw.Draw(img)
for y in range(T):
    f = y / (T - 1)
    d.line([(0, y), (T, y)], fill=tuple(round(HAUT[i] * (1 - f) + BAS[i] * f) for i in range(3)))

halo = Image.new("RGBA", (T, T), (0, 0, 0, 0))
ImageDraw.Draw(halo).ellipse([560, 150, 900, 490], fill=HALO + (120,))
img = Image.alpha_composite(img.convert("RGBA"), halo.filter(ImageFilter.GaussianBlur(26))).convert("RGB")
d = ImageDraw.Draw(img)
d.ellipse([600, 190, 860, 450], fill=SOLEIL)

def montagne(points, couleur):
    d.polygon(points + [(T, T), (0, T)], fill=couleur)

montagne([(0, 700), (170, 500), (300, 640), (470, 430), (640, 650), (780, 540), (T, 700)], MONTS[0])
montagne([(0, 800), (200, 610), (350, 760), (540, 560), (720, 780), (880, 650), (T, 790)], MONTS[1])
montagne([(0, 900), (230, 760), (420, 880), (640, 740), (820, 880), (T, 800)], MONTS[2])

# nuage plat
d.rounded_rectangle([150, 300, 470, 380], radius=40, fill=NUAGE)
d.ellipse([210, 240, 330, 360], fill=NUAGE)
d.ellipse([300, 210, 430, 340], fill=NUAGE)

sortie = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent / "icone.png"
img.save(sortie)
print("icône écrite :", sortie)
