# MonClimat

Application iPhone avec quatre pages : **Modèles météo** (cartes J+0 → J+6 de GFS, ECMWF IFS, AIGFS et ECMWF AIFS, avec le run affiché),
**Météo** (prévisions d'un lieu, J+0 → J+6 : AROME pour J+0 et J+1, ECMWF IFS ensuite), **Climat** (température, France, banquise, mers) et **Infos**
(icônes, couleurs, sources et licences). Toutes les données sont ouvertes.

Les agents automatiques (GitHub Actions) téléchargent les données, dessinent les cartes et les graphiques et les publient dans la branche
**`publication`** ; l'application les lit à l'ouverture, sans serveur ni abonnement.

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| `app/` | L'application : page `index.html` et ses modules (`modules/icones.js` pour les icônes, `decors.js` pour les fonds météo, `infos.js` pour la page Infos…). **Maquette à ce stade** : prévisions fictives, images d'exemple dans `app/img/`. |
| `appli/` | La coque iPhone (Capacitor) : `assembler.py`, `icone.png`, `TESTFLIGHT.md` (publication pas à pas). |
| `meteo/cartes_j6/` | Cartes Z500 et précipitations J+0 → J+6 (`build_maps.py`, `precip.py`). Les chefs-lieux de France y sont tracés (`data/prefectures.json`). |
| `climat/` | Graphiques de température, banquise, mers et France (un dossier par thème). |
| `data/` | Données partagées : liste des chefs-lieux (Paris seul pour l'Île-de-France). |
| `.github/workflows/` | `meteo-cartes-j6.yml`, `climat-banquise.yml`, `climat-mensuel.yml`, `appli-testflight.yml`. |
| `esquisse/` | Les quatre esquisses de design et la galerie des fonds météo (`esquisse/index.html`). Retenue : l'esquisse 2. |

## Mise en place

1. Crée un dépôt GitHub (par exemple `MonClimat`) et envoie-y tout ce dossier.
2. Onglet **Actions** : lance une fois « Météo – cartes J+0 à J+6 », « Climat – mise à jour mensuelle » et « Climat – banquise ».
   Les résultats arrivent dans la branche `publication`.
3. Active GitHub Pages sur la branche `publication` (dépôt public, ou abonnement GitHub pour un dépôt privé).
4. Pour l'iPhone : suis `appli/TESTFLIGHT.md`.

## Ce qui reste à faire

- Brancher `app/` sur les `manifest.json` publiés (runs, échéances) et sur les images de la branche `publication` à la place de `app/img/`.
- Prévisions de la ville : calcul sur le serveur à partir des champs AROME (Météo-France, Licence Ouverte Etalab 2.0) et ECMWF IFS, publication d'un fichier par ville.
- Graphique de banquise global (Arctique + Antarctique) et cartes France mois par mois depuis 1959 (le script ne produit aujourd'hui que le mois en cours).
- Le tracé des chefs-lieux dans `precip.py` est écrit mais n'a pas encore été exécuté (il faut cartopy et le téléchargement des données).

## Sources et licences

GFS et AIGFS : NOAA / NCEP (domaine public) · ECMWF IFS et AIFS : ECMWF Open Data (CC BY 4.0, « Source : ECMWF ») · AROME : Météo-France
(Licence Ouverte Etalab 2.0) · fonds de carte : Natural Earth (domaine public) · HadCRUT5 : Met Office Hadley Centre et CRU/UEA (Open Government Licence) ·
NOAA NCEI et NSIDC : licence à confirmer, source citée sur chaque graphique.
