"""Assemble le contenu de l'application dans appli/www/ : une copie de app/ (la page, ses modules et les images d'exemple).

À lancer depuis appli/ : python3 assembler.py
Option --verifier : contrôle seulement que tout est là, sans rien écrire.
"""
import pathlib
import shutil
import sys

ICI = pathlib.Path(__file__).resolve().parent
APP = ICI.parent / "app"
WWW = ICI / "www"
OBLIGATOIRES = ["index.html", "modules/icones.js", "modules/previsions.js", "modules/decors.js", "modules/infos.js", "modules/echelles.js"]

manquants = [f for f in OBLIGATOIRES if not (APP / f).exists()]
if manquants:
    sys.exit(f"Fichiers de l'application introuvables dans app/ : {', '.join(manquants)}")
if "--verifier" in sys.argv:
    print("app/ complète :", len(list(APP.rglob('*'))), "éléments")
    sys.exit(0)

shutil.rmtree(WWW, ignore_errors=True)
shutil.copytree(APP, WWW)
taille = sum(f.stat().st_size for f in WWW.rglob("*") if f.is_file()) / 1e6
print(f"appli/www prêt : {sum(1 for f in WWW.rglob('*') if f.is_file())} fichiers, {taille:.1f} Mo")
