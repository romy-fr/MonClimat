/* Icônes météo de MonClimat : dessin SVG (48×48) et signification de chacune.
   Utilisé par la page Météo (tableaux horaires) et par la page Infos (légende). */

const K = {sun:"#f5a623", moon:"#5b4fd0", cl:"#cfd4da", cd:"#8a929d", blue:"#3c9ae8", pink:"#e8479b", snow:"#9a6af5", bolt:"#e0283c", fog:"#a7afb9"};

const sun = (x, y, r) =>
  `<g stroke="${K.sun}" stroke-width="2" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a => {
    const c = Math.cos(a*Math.PI/180), s = Math.sin(a*Math.PI/180);
    return `<line x1="${x+c*(r+3)}" y1="${y+s*(r+3)}" x2="${x+c*(r+6)}" y2="${y+s*(r+6)}"/>`;
  }).join("")}</g><circle cx="${x}" cy="${y}" r="${r}" fill="${K.sun}"/>`;
const moon = (x, y) => `<path transform="translate(${x-12} ${y-12})" d="M16 2a11 11 0 1 0 6 20A9 9 0 0 1 16 2z" fill="${K.moon}"/>`;
const cloud = (c, dx = 0, dy = 0, s = 1) =>
  `<path transform="translate(${dx} ${dy}) scale(${s})" d="M13 32a7.5 7.5 0 0 1 .8-15A10 10 0 0 1 33 19.2 6.5 6.5 0 0 1 34 32z" fill="${c}"/>`;
const XS = {1:[24], 2:[18,30], 3:[14,24,34]};
function precip(type, n, col, y) {
  return XS[n].map(x => {
    if (type === "drizzle") return `<circle cx="${x}" cy="${y+3}" r="1.7" fill="${col}"/><circle cx="${x+3}" cy="${y+8}" r="1.7" fill="${col}"/>`;
    if (type === "rain") return `<line x1="${x+2}" y1="${y}" x2="${x-1.5}" y2="${y+8}" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/>`;
    return `<g stroke="${col}" stroke-width="1.8" stroke-linecap="round" transform="translate(${x} ${y+4})"><line x1="-3.5" y1="0" x2="3.5" y2="0"/><line x1="-1.8" y1="-3" x2="1.8" y2="3"/><line x1="1.8" y1="-3" x2="-1.8" y2="3"/></g>`;
  }).join("");
}
const bolt = (x, y) => `<path transform="translate(${x} ${y})" d="M3 0L-3 7h4l-2 6 7-8H1z" fill="${K.bolt}"/>`;
const hail = () => `<g fill="none" stroke="${K.cd}" stroke-width="1.3"><circle cx="16" cy="40" r="2"/><circle cx="25" cy="43" r="2"/><circle cx="34" cy="40" r="2"/></g>`;
const fog = c => [30,36,42].map((y, i) => `<line x1="${9+i*2}" y1="${y}" x2="${39-i*2}" y2="${y}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`).join("");

/* s = soleil, m = lune, c = nuage (l clair, d sombre, d2 couvert), p = précipitation [type, nombre, couleur], b = éclair, h = grêle, f = couleur du brouillard.
   groupe : sert à ranger la légende de la page Infos. */
export const ICONES = {
  ensoleille: {nom:"Ensoleillé", groupe:"Ciel", sens:"Ciel dégagé, en journée.", s:1},
  nuitclaire: {nom:"Nuit claire", groupe:"Ciel", sens:"Ciel dégagé, de nuit.", m:1},
  peu:        {nom:"Peu nuageux", groupe:"Ciel", sens:"Quelques nuages, le soleil domine.", s:1, c:"l"},
  peunuit:    {nom:"Peu nuageux (nuit)", groupe:"Ciel", sens:"Quelques nuages, la lune reste visible.", m:1, c:"l"},
  eclaircies: {nom:"Éclaircies", groupe:"Ciel", sens:"Nuages dominants avec des passages de soleil.", s:1, c:"d"},
  couvert:    {nom:"Couvert", groupe:"Ciel", sens:"Ciel entièrement nuageux, sans soleil.", c:"d2"},
  brouillard: {nom:"Brouillard", groupe:"Brouillard", sens:"Visibilité réduite, sans gel au sol.", c:"d", f:K.fog},
  givrant:    {nom:"Brouillard givrant", groupe:"Brouillard", sens:"Brouillard par température négative : dépôt de givre, routes glissantes.", c:"d", f:K.pink},
  bruinef:    {nom:"Bruine faible", groupe:"Pluie", sens:"Fines gouttes, très peu de cumul.", c:"l", p:["drizzle",2,K.blue]},
  bruine:     {nom:"Bruine", groupe:"Pluie", sens:"Fines gouttes persistantes, sol mouillé.", c:"d", p:["drizzle",2,K.blue]},
  bruinefo:   {nom:"Bruine forte", groupe:"Pluie", sens:"Bruine dense, visibilité réduite.", c:"d", p:["drizzle",3,K.blue]},
  pluief:     {nom:"Pluie faible", groupe:"Pluie", sens:"Pluie légère, peu de cumul.", c:"d", p:["rain",1,K.blue]},
  pluie:      {nom:"Pluie", groupe:"Pluie", sens:"Pluie modérée.", c:"d", p:["rain",2,K.blue]},
  pluiefo:    {nom:"Pluie forte", groupe:"Pluie", sens:"Pluie soutenue, cumul important.", c:"d", p:["rain",3,K.blue]},
  avf:        {nom:"Averses faibles", groupe:"Averses", sens:"Pluie brève et légère, avec des éclaircies entre deux.", s:1, c:"d", p:["rain",1,K.blue]},
  av:         {nom:"Averses", groupe:"Averses", sens:"Pluie par intermittence, éclaircies entre les averses.", s:1, c:"d", p:["rain",2,K.blue]},
  avfo:       {nom:"Fortes averses", groupe:"Averses", sens:"Averses intenses et brèves, cumul rapide.", s:1, c:"d", p:["rain",3,K.blue]},
  orage:      {nom:"Orage", groupe:"Orage", sens:"Éclairs et pluie intense, rafales possibles.", c:"d", b:1},
  orageg:     {nom:"Orage avec grêle", groupe:"Orage", sens:"Orage avec risque de grêle. Aucun modèle ne prévoit la grêle : c'est un indice de risque estimé (forte instabilité, averses dominantes, cumul important).", c:"d", b:1, h:1},
  neigef:     {nom:"Neige faible", groupe:"Neige", sens:"Quelques flocons, peu de cumul.", c:"d", p:["snow",1,K.snow]},
  neige:      {nom:"Neige", groupe:"Neige", sens:"Chute de neige modérée.", c:"d", p:["snow",2,K.snow]},
  neigefo:    {nom:"Neige forte", groupe:"Neige", sens:"Neige abondante, accumulation rapide.", c:"d", p:["snow",3,K.snow]},
  avneige:    {nom:"Averses de neige", groupe:"Neige", sens:"Neige par intermittence, avec des éclaircies.", s:1, c:"d", p:["snow",2,K.snow]},
  grains:     {nom:"Grains de neige", groupe:"Neige", sens:"Petits grains de neige ou de grésil, souvent brefs.", c:"d", p:["snow",3,K.snow]},
  bruinev:    {nom:"Bruine verglaçante", groupe:"Verglas", sens:"Bruine qui gèle au contact du sol : verglas, danger pour la route.", c:"d", p:["drizzle",2,K.pink]},
  pluiev:     {nom:"Pluie verglaçante", groupe:"Verglas", sens:"Pluie qui gèle au contact du sol : verglas, danger pour la route.", c:"d", p:["rain",2,K.pink]},
  pluievfo:   {nom:"Pluie verglaçante forte", groupe:"Verglas", sens:"Pluie verglaçante intense : verglas généralisé, déplacements déconseillés.", c:"d", p:["rain",3,K.pink]}
};
export const GROUPES = ["Ciel", "Brouillard", "Pluie", "Averses", "Orage", "Neige", "Verglas"];

/** Dessin SVG d'une icône (à insérer dans la page). */
export function icone(k) {
  const {s, m, c, p, b, h, f} = ICONES[k];
  let g = "";
  const hasP = p || b;
  if (f) return `<svg viewBox="0 0 48 48">${cloud(K.cd, 0, -8, .9)}${fog(f)}</svg>`;
  if (s && !c) g += sun(24, 24, 10);
  if (m && !c) g += moon(24, 24);
  if (m && c) g += moon(17, 16) + cloud(K.cl, 6, 10, .85);
  if (s && c) g += sun(16, 15, 6.5) + cloud(c === "l" ? K.cl : K.cd, 5, hasP ? -1 : 7, .85);
  if (!s && !m && c) {
    if (c === "d2") g += cloud(K.cl, 8, -6, .8) + cloud(K.cd, -2, 2, .95);
    else g += cloud(c === "l" ? K.cl : K.cd, 0, hasP ? -6 : 2, 1);
  }
  if (p) g += precip(p[0], p[1], p[2], hasP ? (s ? 33 : 34) : 0);
  if (b) g += bolt(24, 26);
  if (h) g += hail();
  return `<svg viewBox="0 0 48 48">${g}</svg>`;
}
