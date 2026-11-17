/* Échelles de couleurs de la page Météo (température, pluie, rafales).
   Une seule définition, lue par les tableaux et par la légende de la page Infos. */

/* Seuils provisoires, à valider avec les vraies prévisions. */
export const TEMPERATURES = [
  {max: 5,        couleur: "#5aa9f0", libelle: "5 °C et moins"},
  {max: 18,       couleur: "#3ac47d", libelle: "6 à 18 °C"},
  {max: 27,       couleur: "#f2b52e", libelle: "19 à 27 °C"},
  {max: Infinity, couleur: "#e0452a", libelle: "28 °C et plus"}
];
export const PLUIE = [
  {max: 0,        fond: "transparent", texte: "#a99fc4", libelle: "0 mm"},
  {max: 1,        fond: "#cfe6fa",     texte: "#10304e", libelle: "moins de 1 mm"},
  {max: 5,        fond: "#6bb4ee",     texte: "#08233d", libelle: "1 à 5 mm"},
  {max: 10,       fond: "#2f7fd6",     texte: "#ffffff", libelle: "5 à 10 mm"},
  {max: Infinity, fond: "#7a1230",     texte: "#ffffff", libelle: "10 mm et plus"}
];
export const RAFALES = [
  {min: 0,  couleur: "#a99fc4", libelle: "moins de 50 km/h"},
  {min: 50, couleur: "#f2b52e", libelle: "50 à 69 km/h"},
  {min: 70, couleur: "#f08a2c", libelle: "70 à 89 km/h"},
  {min: 90, couleur: "#e0452a", libelle: "90 km/h et plus"}
];

export const couleurT = t => TEMPERATURES.find(x => t <= x.max).couleur;
export const couleurG = g => [...RAFALES].reverse().find(x => g >= x.min).couleur;
export function pastillePluie(mm) {
  const e = mm === 0 ? PLUIE[0] : PLUIE.find((x, i) => i > 0 && mm < x.max);
  const txt = String(mm).replace(".", ",");
  return mm === 0 ? `<span style="color:${e.texte}">0</span>`
    : `<span class="mm" style="background:${e.fond};color:${e.texte}">${txt}</span>`;
}
