"""Envoie une notification sur l'iPhone quand une section de MonClimat est à jour (ou si sa mise à jour a échoué).

    python scripts/notifier.py <section> <statut>
    section : modeles | climat | banquise      statut : success | failure | cancelled

Service : ntfy.sh (gratuit, open source ; application « ntfy » sur l'iPhone). Chaque section a son propre sujet, pour pouvoir couper
l'une sans les autres : <NTFY_TOPIC>-modeles, <NTFY_TOPIC>-climat, <NTFY_TOPIC>-banquise (NTFY_TOPIC = secret du dépôt).
Le message ne contient que l'état de la mise à jour : aucune donnée personnelle. Cette étape ne fait jamais échouer le workflow.
"""
import datetime as dt
import json
import os
import pathlib
import sys
import time
import urllib.request

SORTIE = pathlib.Path(os.environ.get("SORTIE", "sortie"))
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]


def lire(chemin):
    try:
        return json.loads((SORTIE / chemin).read_text("utf-8"))
    except Exception:
        return None


def mois_fr(ym):
    a, m = ym.split("-")
    return f"{MOIS[int(m) - 1]} {a}"


def message_modeles():
    man = lire("manifest.json")
    if not man:
        return "Modèles météo", "Cartes J+0 à J+6 mises à jour."
    runs = {k: v.get("run") for k, v in man.get("modeles", {}).items() if v.get("run")}
    ok = [v.get("titre", k) for k, v in man["modeles"].items() if v.get("statut") == "ok"]
    base = dt.datetime.fromisoformat(man["base"].replace("Z", "+00:00"))
    decales = [v.get("titre", k) for k, v in man["modeles"].items() if v.get("decalage_h", 0) > 0]
    texte = f"Run {base:%H} UTC du {base:%d/%m} : {len(ok)} modèle(s) à jour ({', '.join(ok) or 'aucun'})."
    if decales:
        texte += f" Run décalé : {', '.join(decales)}."
    return "Modèles météo à jour", texte


def message_climat():
    fr = lire("france/france.json")
    mois = mois_fr(fr["carte"]["mois"]) if fr and fr.get("carte") else "ce mois"
    return "Climat à jour", f"Température, France, mers et cartes de {mois} mis à jour."


def message_banquise():
    b = lire("banquise/banquise.json")
    try:
        n = b["north"]["dernier"]
        return "Banquise à jour", f"Arctique : {n['ecart']:+.1f} M km² par rapport à 1981-2010 ({mois_fr(n['mois'])}, {n['jours']} jours)."
    except Exception:
        return "Banquise à jour", "Arctique et Antarctique mis à jour."


MESSAGES = {"modeles": message_modeles, "climat": message_climat, "banquise": message_banquise}


def main() -> int:
    section, statut = sys.argv[1], sys.argv[2]
    base = os.environ.get("NTFY_TOPIC", "").strip()
    if not base or section not in MESSAGES:
        print("pas de notification (secret NTFY_TOPIC absent ou section inconnue)")
        return 0
    lien = f"{os.environ.get('GITHUB_SERVER_URL', 'https://github.com')}/{os.environ.get('GITHUB_REPOSITORY', '')}/actions/runs/{os.environ.get('GITHUB_RUN_ID', '')}"
    if statut == "success":
        titre, texte = MESSAGES[section]()
        tags, priorite = ["white_check_mark"], 3
        time.sleep(int(os.environ.get("ATTENTE_PAGES", "90")))   # GitHub Pages met environ une minute à publier
    else:
        titre, texte = f"Échec : {section}", "La mise à jour n'a pas abouti. Touche pour voir le journal."
        tags, priorite = ["warning"], 4
    charge = {"topic": f"{base}-{section}", "title": f"MonClimat · {titre}", "message": texte, "tags": tags, "priority": priorite, "click": lien}
    try:
        req = urllib.request.Request("https://ntfy.sh/", data=json.dumps(charge).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as r:
            print("notification envoyée :", r.status, charge["title"])
    except Exception as e:
        print("notification impossible (sans conséquence) :", e)
    return 0


if __name__ == "__main__":
    sys.exit(main())
