/* Page Infos : légende des icônes météo avec leur signification, échelles de couleurs, sources et mises à jour. */
import {ICONES, GROUPES, icone} from "./icones.js";
import {TEMPERATURES, PLUIE, RAFALES} from "./echelles.js";

const SOURCES = [
  ["GFS", "NOAA / NCEP", "domaine public"],
  ["AIGFS", "NOAA / NCEP", "domaine public"],
  ["ECMWF IFS et AIFS", "ECMWF Open Data", "CC BY 4.0, mention « Source : ECMWF »"],
  ["AROME", "Météo-France", "Licence Ouverte Etalab 2.0"],
  ["Fonds de carte", "Natural Earth", "domaine public"],
  ["Température mondiale", "Met Office Hadley Centre, CRU/UEA (HadCRUT5)", "Open Government Licence"],
  ["Terre / mer, mers, Niño", "NOAA (NCEI, ERSST v5)", "licence à confirmer, source citée sur chaque graphique"],
  ["Banquise", "NSIDC / NOAA", "licence à confirmer, source citée sur chaque graphique"],
  ["France (cartes, série)", "Météo-France, SIM mensuelle", "Licence Ouverte Etalab 2.0"]
];

const lignes = (rows) => rows.map(r => `<li>${r}</li>`).join("");

export function rendreInfos(el) {
  const icones = GROUPES.map(g => `
    <h3>${g}</h3>
    <ul class="ic-list">${Object.entries(ICONES).filter(([, v]) => v.groupe === g).map(([k, v]) =>
      `<li><span class="ic">${icone(k)}</span><span><b>${v.nom}</b><small>${v.sens}</small></span></li>`).join("")}</ul>`).join("");

  el.innerHTML = `
    <div class="card"><h2>Icônes météo</h2><p class="sub">Ce que chaque pictogramme veut dire dans les tableaux de la page Météo.</p>${icones}</div>

    <div class="card"><h2>Couleurs du tableau</h2>
      <h3>Température</h3><ul class="key">${TEMPERATURES.map(x => `<li><i style="background:${x.couleur}"></i>${x.libelle}</li>`).join("")}</ul>
      <h3>Pluie par échéance</h3><ul class="key">${PLUIE.map(x => `<li><i style="background:${x.fond === "transparent" ? "#4a3b86" : x.fond}"></i>${x.libelle}</li>`).join("")}</ul>
      <h3>Rafales</h3><ul class="key">${RAFALES.map(x => `<li><i style="background:${x.couleur}"></i>${x.libelle}</li>`).join("")}</ul>
      <p class="src">Seuils provisoires, à valider avec les vraies prévisions.</p></div>

    <div class="card"><h2>Mises à jour</h2>
      <ul class="plain">${lignes([
        "<b>Modèles :</b> chaque modèle est actualisé dès que son run est publié. Le run utilisé est affiché sous son nom ; un point orange signale un run décalé.",
        "<b>Météo :</b> AROME pour aujourd'hui et demain, avec une ligne par heure ; ECMWF IFS de J+2 à J+6, avec une ligne toutes les 3 heures. Vent et rafales en km/h, pluie en mm par ligne.",
        "<b>Climat :</b> graphiques recalculés chaque nuit à minuit, même téléphone éteint, puis lus à l'ouverture de l'application."
      ])}</ul></div>

    <div class="card"><h2>Sources et licences</h2>
      <ul class="src-list">${SOURCES.map(([a, b, c]) => `<li><b>${a}</b><span>${b}</span><small>${c}</small></li>`).join("")}</ul></div>`;
}
