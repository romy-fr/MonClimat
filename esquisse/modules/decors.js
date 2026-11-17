/* Décors météo de MonClimat : un fond par icône de la page Infos (27 icônes), dessiné en SVG à plat.
   Style : ciel dégradé avec fines bandes horizontales, grand disque de soleil ou croissant de lune, nuages plats,
   paysage en couches (montagnes, collines, mer, plaine, ville, forêt, dunes) et bande sombre en bas.
   decor("pluie", {paysage:"mer"}) → {svg, texte, accent}.  Le SVG fait 300 × 232 (rapport de la zone haute des cartes). */

/* ---------- palettes : ciel [haut, milieu, bas], trois couches de relief, bande du bas ---------- */
const PAL = {
  bleu:    {sky:["#6fc8f5","#a9e0fb","#dff4fe"], far:"#7c97ee", mid:"#4f73dc", near:"#2f4bb0", strip:"#101a4a", nuage:"#ffffff", accent:["#4cc5cf","#2184d9"]},
  rose:    {sky:["#f2849f","#f6b5b8","#fbe3d4"], far:"#f06292", mid:"#e0206a", near:"#a3154f", strip:"#1c1440", nuage:"#fff4ec", accent:["#ff9bb0","#e0206a"]},
  gris:    {sky:["#8e98b4","#b9c0d2","#dde1ea"], far:"#7681a0", mid:"#5d6988", near:"#444f6e", strip:"#1d2240", nuage:"#e6e9f1", accent:["#9aa3c8","#5d6988"]},
  sombre:  {sky:["#465170","#66708f","#97a0b8"], far:"#4d5878", mid:"#3b4666", near:"#2b3453", strip:"#14182e", nuage:"#79829f", accent:["#7d88b0","#3b4666"]},
  orage:   {sky:["#1f1747","#392874","#6648a2"], far:"#3a2a78", mid:"#2b2060", near:"#1c1544", strip:"#0d0a24", nuage:"#51468a", accent:["#ffd84d","#8a5cc9"]},
  nuit:    {sky:["#1a1150","#3a2480","#7a52c0"], far:"#5a3aa6", mid:"#432a88", near:"#2d1c66", strip:"#0f0a30", nuage:"#8d79c8", accent:["#ff7bd0","#a14fe0"]},
  neige:   {sky:["#aebfe2","#d3def2","#f1f5fc"], far:"#c2d0ea", mid:"#a4b6dc", near:"#7f96c6", strip:"#1b2350", nuage:"#ffffff", accent:["#b8c9e6","#7f96c6"]},
  brume:   {sky:["#b6c0d6","#d3dae7","#eef1f6"], far:"#9aa6c0", mid:"#8592b0", near:"#6b789a", strip:"#222947", nuage:"#f4f6fa", accent:["#c3cbe0","#8592b0"]},
  givre:   {sky:["#c3b3e6","#e2cfee","#f7ecf6"], far:"#a994d8", mid:"#8f7ac6", near:"#6f5aa8", strip:"#231a52", nuage:"#fbf4fb", accent:["#f3b6dc","#8f7ac6"]},
  verglas: {sky:["#6f7cc4","#b196d6","#f0bddf"], far:"#6d6fc0", mid:"#5558a8", near:"#3c3f86", strip:"#171a45", nuage:"#d9d0f0", accent:["#ff8fd0","#6d6fc0"]}
};

/* ---------- ce que montre chaque icône ---------- */
/* pal : palette · astre : soleil | soleilBas | voile | lune · nuages : [nombre, teinte] · precip : [type, intensité] · texte : clair | sombre */
const SPEC = {
  ensoleille: {pal:"bleu",   astre:"soleil",    nuages:[1,"nuage"]},
  nuitclaire: {pal:"nuit",   astre:"lune", etoiles:1, nuages:[0]},
  peu:        {pal:"bleu",   astre:"soleil",    nuages:[2,"nuage"]},
  peunuit:    {pal:"nuit",   astre:"lune", etoiles:1, nuages:[2,"nuage"]},
  eclaircies: {pal:"rose",   astre:"soleilBas", nuages:[3,"nuage"]},
  couvert:    {pal:"gris",   astre:null,        nuages:[6,"nuage"]},
  brouillard: {pal:"brume",  astre:null,        nuages:[1,"nuage"], brume:1, texte:"sombre"},
  givrant:    {pal:"givre",  astre:null,        nuages:[1,"nuage"], brume:2, texte:"sombre"},
  bruinef:    {pal:"gris",   astre:"voile",     nuages:[3,"nuage"], precip:["bruine",1]},
  bruine:     {pal:"gris",   astre:null,        nuages:[4,"nuage"], precip:["bruine",2]},
  bruinefo:   {pal:"sombre", astre:null,        nuages:[5,"nuage"], precip:["bruine",3]},
  pluief:     {pal:"gris",   astre:null,        nuages:[4,"nuage"], precip:["pluie",1]},
  pluie:      {pal:"sombre", astre:null,        nuages:[5,"nuage"], precip:["pluie",2]},
  pluiefo:    {pal:"sombre", astre:null,        nuages:[6,"nuage"], precip:["pluie",3]},
  avf:        {pal:"bleu",   astre:"voile",     nuages:[3,"nuage"], precip:["pluie",1]},
  av:         {pal:"gris",   astre:"voile",     nuages:[4,"nuage"], precip:["pluie",2]},
  avfo:       {pal:"sombre", astre:"voile",     nuages:[5,"nuage"], precip:["pluie",3]},
  orage:      {pal:"orage",  astre:null,        nuages:[6,"nuage"], precip:["pluie",2], eclair:1},
  orageg:     {pal:"orage",  astre:null,        nuages:[6,"nuage"], precip:["pluie",2], eclair:1, grele:1},
  neigef:     {pal:"neige",  astre:null,        nuages:[3,"nuage"], precip:["neige",1], neige:1, texte:"sombre"},
  neige:      {pal:"neige",  astre:null,        nuages:[4,"nuage"], precip:["neige",2], neige:1, texte:"sombre"},
  neigefo:    {pal:"neige",  astre:null,        nuages:[5,"nuage"], precip:["neige",3], neige:1, texte:"sombre"},
  avneige:    {pal:"neige",  astre:"voile",     nuages:[3,"nuage"], precip:["neige",2], neige:1, texte:"sombre"},
  grains:     {pal:"neige",  astre:null,        nuages:[4,"nuage"], precip:["grains",3], neige:1, texte:"sombre"},
  bruinev:    {pal:"verglas",astre:null,        nuages:[4,"nuage"], precip:["bruineV",2]},
  pluiev:     {pal:"verglas",astre:null,        nuages:[5,"nuage"], precip:["pluieV",2]},
  pluievfo:   {pal:"verglas",astre:null,        nuages:[6,"nuage"], precip:["pluieV",3]}
};
export const PAYSAGES = ["montagnes","collines","mer","ville","foret","plaine","dunes"];

/* ---------- petits outils ---------- */
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let uid = 0;
const NUAGE = (x, y, s, c, o = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 22a10 10 0 0 1 8-9.8A14 14 0 0 1 35 8a11 11 0 0 1 20 6 8 8 0 0 1-2 8z" fill="${c}" opacity="${o}"/>`;
const PINS = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -26 L9 -8 H4 L12 6 H-12 L-4 -8 H-9z M-2 6 h4 v8 h-4z" fill="${c}"/>`;
const NUAGES_POS = [[196,26,.95],[14,40,1.05],[118,74,.8],[226,92,.85],[58,106,.7],[150,22,.7],[262,56,.6]];

/* ---------- paysages : trois couches, sol en bas ---------- */
const PAYSAGE = {
  montagnes: (c, neige) => `
    <path fill="${c.far}" d="M0 152L38 108 68 138 110 96 152 142 192 112 236 144 270 118 300 140V232H0z"/>
    ${neige ? `<path fill="#fff" opacity=".9" d="M110 96l-10 12 6-3 4 5 4-5 6 3zM38 108l-8 10 5-2 3 4 4-4 5 2zM192 112l-9 11 5-2 4 4 4-4 5 2zM270 118l-8 10 5-2 3 4 4-4 5 2z"/>` : ""}
    <path fill="${c.mid}" d="M0 178L36 144 78 172 122 132 168 174 212 148 256 178 300 152V232H0z"/>
    <path fill="${c.near}" d="M0 204L52 174 98 200 152 170 206 202 252 182 300 200V232H0z"/>`,
  collines: (c, neige) => `
    <path fill="${c.far}" d="M0 142C40 100 92 110 132 136S224 152 300 118V232H0z"/>
    <path fill="${c.mid}" d="M0 172C52 140 112 162 162 170S252 150 300 166V232H0z"/>
    ${PINS(40,170,.8,c.near)}${PINS(54,176,.6,c.near)}${PINS(246,168,.9,c.near)}
    <path fill="${c.near}" d="M0 200C60 182 120 202 182 194S270 186 300 198V232H0z"/>
    ${neige ? `<path fill="#fff" opacity=".85" d="M0 200C60 182 120 202 182 194S270 186 300 198V204C270 192 230 198 182 200S60 188 0 206z"/>` : ""}`,
  mer: (c) => `
    <rect y="150" width="300" height="82" fill="${c.far}"/>
    <path fill="${c.mid}" d="M0 168q25-9 50 0t50 0 50 0 50 0 50 0 50 0V232H0z"/>
    <path fill="${c.near}" d="M0 192q25-9 50 0t50 0 50 0 50 0 50 0 50 0V232H0z"/>
    <path fill="#fff" opacity=".9" d="M92 156l20 2-3 10-17-2zM108 128l-2 26 22-4z"/>
    <path fill="#fff" opacity=".35" d="M20 178h46M180 184h70M236 200h40M70 208h64" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  ville: (c, neige, id) => { const r = rng(id * 7 + 3); let far = "", near = "", fen = "";
    for (let x = -4; x < 300; x += 26) { const h = 40 + r() * 46; far += `<rect x="${x}" y="${190 - h}" width="${22 + r() * 8}" height="${h + 40}" fill="${c.far}"/>`; }
    for (let x = 6; x < 300; x += 34) { const h = 34 + r() * 56, w = 26 + r() * 8; near += `<rect x="${x}" y="${204 - h}" width="${w}" height="${h + 30}" fill="${c.mid}"/>`;
      for (let yy = 204 - h + 7; yy < 200; yy += 11) for (let xx = x + 5; xx < x + w - 4; xx += 9) if (r() > .55) fen += `<rect x="${xx}" y="${yy}" width="3.5" height="4.5" rx="1" fill="#ffe9a0" opacity=".85"/>`; }
    return `${far}${near}${fen}<rect y="208" width="300" height="24" fill="${c.near}"/>`; },
  foret: (c) => { const r = rng(11); let a = "", b = "";
    for (let x = -6; x < 306; x += 16) a += PINS(x + r() * 6, 150 + r() * 14, 1.5 + r() * .5, c.far);
    for (let x = 4; x < 306; x += 20) b += PINS(x + r() * 8, 184 + r() * 12, 1.8 + r() * .7, c.mid);
    return `<path fill="${c.far}" d="M0 152C80 138 160 150 300 138V232H0z"/>${a}<path fill="${c.mid}" d="M0 184C90 170 170 186 300 176V232H0z"/>${b}<path fill="${c.near}" d="M0 210C80 200 180 214 300 204V232H0z"/>`; },
  plaine: (c) => { let champs = ""; for (let i = 0; i < 7; i++) { const y = 158 + i * 11; champs += `<path fill="${i % 2 ? c.mid : c.far}" d="M0 ${y}C100 ${y - 5} 200 ${y + 3} 300 ${y - 3}V232H0z"/>`; }
    return `<path fill="${c.far}" d="M0 150C60 132 130 146 210 136S280 138 300 134V232H0z"/>${champs}
      ${PINS(52,170,.8,c.near)}${PINS(250,172,.7,c.near)}<path stroke="${c.near}" stroke-width="2" d="M150 120v36M142 128h16M145 136h10"/><path fill="${c.near}" d="M0 208C100 198 200 212 300 202V232H0z"/>`; },
  dunes: (c) => `
    <path fill="${c.far}" d="M0 160C60 128 120 152 180 140S270 124 300 140V232H0z"/>
    <path fill="${c.mid}" d="M0 188C70 160 130 190 200 176S270 162 300 176V232H0z"/>
    <path fill="${c.near}" d="M0 212C90 196 170 220 300 204V232H0z"/>
    <path fill="#fff" opacity=".25" d="M0 160C60 128 120 152 180 140V144C120 156 60 134 0 166z"/>`
};

/* ---------- météo par-dessus ---------- */
function astre(kind, p) {
  if (kind === "soleil") return `<circle cx="232" cy="62" r="44" fill="#fff6e0" opacity=".28"/><circle cx="232" cy="62" r="28" fill="#fff3ea"/>`;
  if (kind === "soleilBas") return `<circle cx="150" cy="128" r="46" fill="#fff0e6" opacity=".3"/><circle cx="150" cy="128" r="30" fill="#fff4ee"/>`;
  if (kind === "voile") return `<circle cx="238" cy="58" r="30" fill="#fff6dc" opacity=".35"/><circle cx="238" cy="58" r="19" fill="#ffeeb8" opacity=".9"/>`;
  if (kind === "lune") return `<circle cx="232" cy="60" r="34" fill="#ffe9a0" opacity=".16"/><path d="M232 40a22 22 0 1 0 11 40 18 18 0 0 1-11-40z" fill="#ffd66b"/>`;
  return "";
}
const ETOILES = id => { const r = rng(id + 5); let s = ""; for (let i = 0; i < 18; i++) s += `<circle cx="${r() * 300}" cy="${r() * 120}" r="${0.7 + r() * 1.1}" fill="#fff" opacity="${0.5 + r() * 0.5}"/>`; return `<g>${s}</g>`; };
function precip(type, n, id) {
  const r = rng(id * 13 + 1); let s = "";
  if (type === "pluie" || type === "pluieV") { const col = type === "pluieV" ? "#ffb3e6" : "#ffffff", N = [0, 20, 36, 56][n];
    for (let i = 0; i < N; i++) { const x = r() * 320 - 10, y = r() * 200, l = 12 + r() * 10; s += `<line x1="${x}" y1="${y}" x2="${x - l * .32}" y2="${y + l}" stroke="${col}" stroke-opacity="${0.35 + r() * 0.3}" stroke-width="${n === 3 ? 2 : 1.5}" stroke-linecap="round"/>`; } }
  else if (type === "bruine" || type === "bruineV") { const col = type === "bruineV" ? "#ffb3e6" : "#ffffff", N = [0, 26, 46, 70][n];
    for (let i = 0; i < N; i++) s += `<circle cx="${r() * 300}" cy="${r() * 215}" r="1.4" fill="${col}" opacity="${0.45 + r() * 0.35}"/>`; }
  else { const N = type === "grains" ? 70 : [0, 22, 40, 64][n], rad = type === "grains" ? 1.4 : 2.6;
    for (let i = 0; i < N; i++) s += `<circle cx="${r() * 300}" cy="${r() * 215}" r="${rad * (0.7 + r() * 0.7)}" fill="#fff" opacity="${0.75 + r() * 0.25}"/>`; }
  return s;
}
const ECLAIR = `<g transform="translate(78 16)"><path d="M158 70l-20 40h16l-10 38 34-52h-17l14-26z" fill="#ffe14d" opacity=".3" transform="translate(-9 -8) scale(1.12)"/><path d="M158 70l-20 40h16l-10 38 34-52h-17l14-26z" fill="#ffe14d" stroke="#fff6b0" stroke-width="1.2" stroke-linejoin="round"/></g>`;
const GRELE = id => { const r = rng(id + 77); let s = ""; for (let i = 0; i < 14; i++) s += `<circle cx="${96 + r() * 120}" cy="${100 + r() * 100}" r="2.4" fill="#fff" stroke="#c9d3ff" stroke-width=".8"/>`; return s; };
function brume(k) {
  const bandes = [[118, 34, .5], [152, 40, .5], [188, 36, .55]].map(([y, h, o]) => `<rect y="${y}" width="300" height="${h}" fill="url(#bm)" opacity="${o}"/>`).join("");
  const gel = k === 2 ? `<g fill="#fff">${[[40,70],[96,96],[168,80],[236,104],[270,64],[130,128]].map(([x,y]) => `<path d="M${x} ${y-4}l1.2 2.8 2.8 1.2-2.8 1.2L${x} ${y+3}l-1.2-2.8-2.8-1.2 2.8-1.2z" opacity=".9"/>`).join("")}</g>` : "";
  return bandes + gel;
}

/** Décor d'une icône : {svg, texte ("clair" ou "sombre", pour le texte posé dessus), accent (dégradé de la barre)} */
export function decor(icone, {paysage = "montagnes", nuit = false} = {}) {
  const sp = SPEC[icone] || SPEC.peu, p = PAL[sp.pal], id = ++uid;
  const nb = sp.nuages[0], tn = sp.nuages[1];
  const couleurNuage = tn === "nuage" ? p.nuage : p.nuage;
  const nuages = NUAGES_POS.slice(0, Math.min(nb, NUAGES_POS.length)).map(([x, y, s], i) => NUAGE(x, y, s * (nb >= 5 ? 1.25 : 1), couleurNuage, nb >= 5 ? 1 : .94 - i * .03)).join("");
  const bandeCouvert = icone === "couvert" ? `<rect y="0" width="300" height="86" fill="${p.nuage}" opacity=".35"/>` : "";
  const sol = (PAYSAGE[paysage] || PAYSAGE.montagnes)(p, !!sp.neige, id);
  const bandes = `<pattern id="b${id}" width="4" height="6" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#fff" opacity=".1"/></pattern>`;
  const svg = `<svg class="pays" viewBox="0 0 300 232" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset=".55" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[2]}"/></linearGradient>
      <linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>${bandes}</defs>
    <rect width="300" height="232" fill="url(#s${id})"/><rect width="300" height="232" fill="url(#b${id})"/>
    ${sp.etoiles || nuit ? ETOILES(id) : ""}${astre(sp.astre, p)}${bandeCouvert}${nuages}
    ${sol}
    <rect y="224" width="300" height="8" fill="${p.strip}"/>
    ${sp.brume ? brume(sp.brume) : ""}
    ${sp.precip ? precip(sp.precip[0], sp.precip[1], id) : ""}${sp.eclair ? ECLAIR : ""}${sp.grele ? GRELE(id) : ""}
    ${nuit && !sp.etoiles ? `<rect width="300" height="232" fill="#0b0640" opacity=".42"/>` : ""}</svg>`;
  return {svg, texte: nuit && sp.texte === "sombre" ? "clair" : (sp.texte || "clair"), accent: `linear-gradient(180deg,${p.accent[0]},${p.accent[1]})`};
}
