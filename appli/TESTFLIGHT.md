# Publier MonClimat sur TestFlight

Tout se fait depuis Windows et le navigateur : GitHub construit l'application sur une machine macOS, la signe et l'envoie à Apple.
Le fichier `.github/workflows/appli-testflight.yml` fait le travail ; il reste à lui donner tes identifiants Apple.

**Coût : l'inscription au programme Apple Developer est payante (99 $ par an) et obligatoire pour TestFlight.** Aucune autre dépense :
les données (NOAA, ECMWF, Météo-France, NSIDC…) sont ouvertes, et GitHub Actions est gratuit pour un dépôt public (vérifie la
tarification des minutes macOS si le dépôt est privé : elles sont décomptées plus vite).

## 0. Avant de commencer

- [ ] Un iPhone sous une version d'iOS récente, avec l'application **TestFlight** installée (App Store).
- [ ] Le dépôt est sur GitHub et les workflows sont dans `.github/workflows/` (c'est déjà le cas dans ce dossier).
- [ ] Un compte GitHub avec les droits d'administration du dépôt.

## 1. Compte Apple Developer (une fois)

- [ ] Inscris-toi sur developer.apple.com → Programs → **Apple Developer Program** (99 $/an). La validation peut prendre un à deux jours.
- [ ] Note ton **Team ID** : developer.apple.com → Account → Membership details (10 caractères).

## 2. Identifiant et fiche de l'application

- [ ] developer.apple.com → Certificates, IDs & Profiles → **Identifiers** → « + » → App IDs → App : description « MonClimat », Bundle ID
      **explicite**, par exemple `fr.tonnom.monclimat`. Aucune capacité à cocher.
- [ ] appstoreconnect.apple.com → **Apps** → « + » → Nouvelle app : plateforme iOS, nom « MonClimat », langue principale français,
      identifiant = celui de l'étape précédente, SKU au choix (par exemple `monclimat`).

## 3. Clé d'API App Store Connect

- [ ] App Store Connect → Users and Access → **Integrations** → App Store Connect API → Team Keys → « + », nom « GitHub », rôle **App Manager** (ou Admin).
- [ ] Télécharge le fichier `AuthKey_XXXXXXXX.p8` : **un seul téléchargement possible**, garde-le en lieu sûr.
- [ ] Note le **Key ID** (colonne de la liste) et l'**Issuer ID** (affiché au-dessus de la liste).

## 4. Secrets et variable dans GitHub

Dépôt → Settings → Secrets and variables → Actions :

| Où | Nom | Valeur |
|---|---|---|
| Secrets | `APPLE_TEAM_ID` | ton Team ID |
| Secrets | `ASC_KEY_ID` | le Key ID |
| Secrets | `ASC_ISSUER_ID` | l'Issuer ID |
| Secrets | `ASC_KEY_P8` | tout le contenu du fichier `.p8` (ouvre-le avec le Bloc-notes, copie tout, y compris les lignes BEGIN et END) |
| Variables | `APP_BUNDLE_ID` | `fr.tonnom.monclimat` (le même Bundle ID) |

## 5. Lancer la construction

- [ ] Onglet **Actions** → « Appli – TestFlight » → **Run workflow**. Compte 15 à 30 minutes.
- [ ] Si une étape échoue, ouvre son journal : les erreurs de versions (Xcode, signature) sont les plus probables au premier essai. Le projet
      Capacitor et le workflow sont écrits d'après la documentation : **ils n'ont jamais tourné sur un vrai build**.
- [ ] Quand le workflow est vert, le build apparaît dans App Store Connect → ton app → **TestFlight** après quelques minutes de traitement par Apple.

## 6. Installer sur ton iPhone

- [ ] App Store Connect → TestFlight → **Internal Testing** → « + » → crée un groupe, ajoute ton compte Apple (il doit être utilisateur de l'équipe), active le build.
- [ ] Sur l'iPhone, ouvre l'application **TestFlight** : MonClimat y apparaît → Installer.
- [ ] Un build TestFlight expire au bout de **90 jours** : relance le workflow avant (le numéro de build augmente tout seul).

## Ce que montre la première version

La page `app/index.html` est une **maquette** : les prévisions sont fictives et les graphiques sont les images d'exemple de `app/img/`. Avant une
vraie utilisation, il reste à brancher l'application sur les fichiers publiés par les workflows de données (branche `publication`,
fichiers `manifest.json` de chaque bloc) et sur les prévisions AROME / ECMWF IFS de la ville.
