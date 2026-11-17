/* Chefs-lieux (préfectures) de France métropolitaine, tracés sur les cartes de précipitations des modèles
   comme sur les cartes France du Climat : un point et le nom à droite (à gauche sur la façade ouest).
   Source unique de la liste : [nom, longitude, latitude]. Le script de cartes (Python) lira la même liste. */
export const PREFECTURES = [
  ["Bourg-en-Bresse",5.23,46.21],["Laon",3.62,49.56],["Moulins",3.33,46.57],["Digne-les-Bains",6.24,44.09],["Gap",6.08,44.56],
  ["Nice",7.27,43.70],["Privas",4.60,44.74],["Charleville-Mézières",4.72,49.77],["Foix",1.61,42.97],["Troyes",4.08,48.30],
  ["Carcassonne",2.35,43.21],["Rodez",2.57,44.35],["Marseille",5.37,43.30],["Caen",-0.37,49.18],["Aurillac",2.44,44.93],
  ["Angoulême",0.16,45.65],["La Rochelle",-1.15,46.16],["Bourges",2.40,47.08],["Tulle",1.77,45.27],["Ajaccio",8.74,41.92],
  ["Bastia",9.45,42.70],["Dijon",5.04,47.32],["Saint-Brieuc",-2.76,48.51],["Guéret",1.87,46.17],["Périgueux",0.72,45.18],
  ["Besançon",6.02,47.24],["Valence",4.89,44.93],["Évreux",1.15,49.02],["Chartres",1.49,48.45],["Quimper",-4.10,48.00],
  ["Nîmes",4.36,43.84],["Toulouse",1.44,43.60],["Auch",0.59,43.65],["Bordeaux",-0.58,44.84],["Montpellier",3.88,43.61],
  ["Rennes",-1.68,48.11],["Châteauroux",1.69,46.81],["Tours",0.69,47.39],["Grenoble",5.72,45.19],["Lons-le-Saunier",5.55,46.67],
  ["Mont-de-Marsan",-0.50,43.89],["Blois",1.33,47.59],["Saint-Étienne",4.39,45.44],["Le Puy-en-Velay",3.88,45.04],["Nantes",-1.55,47.22],
  ["Orléans",1.91,47.90],["Cahors",1.44,44.45],["Agen",0.62,44.20],["Mende",3.50,44.52],["Angers",-0.55,47.47],
  ["Saint-Lô",-1.09,49.12],["Châlons-en-Champagne",4.37,48.96],["Chaumont",5.14,48.11],["Laval",-0.77,48.07],["Nancy",6.18,48.69],
  ["Bar-le-Duc",5.16,48.77],["Vannes",-2.76,47.66],["Metz",6.18,49.12],["Nevers",3.16,46.99],["Lille",3.06,50.63],
  ["Beauvais",2.08,49.43],["Alençon",0.09,48.43],["Arras",2.78,50.29],["Clermont-Ferrand",3.08,45.78],["Pau",-0.37,43.30],
  ["Tarbes",0.07,43.23],["Perpignan",2.90,42.70],["Strasbourg",7.75,48.58],["Colmar",7.36,48.08],["Lyon",4.84,45.76],
  ["Vesoul",6.15,47.62],["Mâcon",4.83,46.31],["Le Mans",0.20,48.00],["Chambéry",5.92,45.57],["Annecy",6.13,45.90],
  ["Paris",2.35,48.86],["Rouen",1.10,49.44],["Niort",-0.46,46.32],
  ["Amiens",2.30,49.89],["Albi",2.15,43.93],["Montauban",1.35,44.02],["Toulon",5.93,43.12],["Avignon",4.81,43.95],
  ["La Roche-sur-Yon",-1.43,46.67],["Poitiers",0.34,46.58],["Limoges",1.26,45.83],["Épinal",6.45,48.17],["Auxerre",3.57,47.80],
  ["Belfort",6.86,47.64]
];
/* noms placés à gauche du point (façade ouest et Corse) */
const A_GAUCHE = new Set(["Quimper","Vannes","Saint-Brieuc","La Rochelle","La Roche-sur-Yon","Ajaccio","Nantes","Rennes","Bordeaux","Mont-de-Marsan","Pau"]);

/* Projection de Lambert (même que les scripts : méridien central 2,5°, latitude 46,5°, parallèles 44° et 49°). */
const R = Math.PI / 180;
function lambert({lon0 = 2.5, lat0 = 46.5, p1 = 44, p2 = 49} = {}) {
  const t = f => Math.tan(Math.PI / 4 + f * R / 2);
  const n = Math.log(Math.cos(p1 * R) / Math.cos(p2 * R)) / Math.log(t(p2) / t(p1));
  const F = Math.cos(p1 * R) * Math.pow(t(p1), n) / n, rho = f => F / Math.pow(t(f), n), rho0 = rho(lat0);
  return (lon, lat) => { const a = n * (lon - lon0) * R, r = rho(lat); return [r * Math.sin(a), rho0 - r * Math.cos(a)]; };
}
/* cadre des cartes de précipitations (FRAME_POINTS et FRAME_PAD de precip.py) */
const CADRE = [[-5.2,48.4],[2.5,51.1],[8.3,49.0],[7.6,43.7],[9.6,41.9],[-1.8,43.3]], PAD = 0.10;

/** Chefs-lieux d'une carte de précipitations (cadre de 8,06 in de large). Renvoie {W, H, svg} : le calque à placer
    dans un viewBox de W × H superposé exactement au cadre de la carte. */
export function calquePrefectures({police = 7.5, decalage = [0, 0]} = {}) {
  const proj = lambert(), pts = CADRE.map(([lo, la]) => proj(lo, la));
  let x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
  const dx = (x1 - x0) * PAD, dy = (y1 - y0) * PAD; x0 -= dx; x1 += dx; y0 -= dy; y1 += dy;
  const Win = 8.4, mapW = Win * 0.96, mapH = mapW * (y1 - y0) / (x1 - x0), Hin = mapH + 1.0 + 1.15;
  /* coordonnées relatives au cadre de la carte (les axes), en unités de 1/100 in */
  const pos = (lo, la) => { const [x, y] = proj(lo, la); return [100 * mapW * (x - x0) / (x1 - x0) + decalage[0], 100 * mapH * (y1 - y) / (y1 - y0) + decalage[1]]; };
  const fs = police / 72 * 100;                     // points -> unités
  const g = PREFECTURES.map(([nom, lo, la]) => {
    const [px, py] = pos(lo, la), [tx, ty] = pos(lo + (A_GAUCHE.has(nom) ? -0.12 : 0.12), la + 0.08), gauche = A_GAUCHE.has(nom);
    return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(2.5 / 72 * 100).toFixed(1)}" fill="#1a1a1a"/>` +
      `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="${fs.toFixed(1)}" fill="#1a1a1a" text-anchor="${gauche ? "end" : "start"}" font-family="Nunito,Inter,sans-serif" paint-order="stroke" stroke="#ffffffb0" stroke-width="${(fs * .22).toFixed(1)}">${nom}</text>`;
  }).join("");
  return {W: mapW * 100, H: mapH * 100, svg: g};
}
