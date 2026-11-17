/* Prévisions de la page Météo : données d'exemple (J+0 → J+6) et tableau horaire.
   Remplacé plus tard par les vraies données (AROME pour J+0 et J+1, ECMWF IFS ensuite).
   Les 4 esquisses partagent ce module : seul l'habillage change. */
import {ICONES, icone} from "./icones.js";
import {couleurT, couleurG, pastillePluie} from "./echelles.js";

export const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
export const JOURS = ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
export const JOURS_L = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
export const AUJOURDHUI = new Date(2026, 10, 17);   // date de l'exemple

function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const SC = [ {tm:5,ta:3,rain:[20,23],r:12,th:1,w:30}, {tm:2,ta:6,rain:[5,11],r:3.5,w:22}, {tm:6,ta:3,rain:[12,18],r:2,w:28},
             {tm:8,ta:3,w:18}, {tm:3,ta:4,rain:[0,6],r:1.5,w:24}, {tm:3,ta:5,w:16}, {tm:5,ta:4,rain:[15,21],r:5,w:34} ];
function choisir(h,t,mm,th,gr,r){
  const nuit = h<7||h>=19;
  if(th) return gr?"orageg":"orage";
  if(mm>0){ const f = mm<1?0:mm<5?1:2; return (t<=0?["neigef","neige","neigefo"]:["pluief","pluie","pluiefo"])[f]; }
  const c = r();
  if(c<.25) return nuit?"nuitclaire":"ensoleille"; if(c<.5) return nuit?"peunuit":"peu";
  if(c<.7) return nuit?"peunuit":"eclaircies"; return "couvert";
}

/** Un jour de prévision : d = 0 (aujourd'hui) … 6. Pas horaire (AROME) pour d < 2, toutes les 3 h (ECMWF IFS) ensuite. */
export function jour(d){
  const date = new Date(AUJOURDHUI.getFullYear(), AUJOURDHUI.getMonth(), AUJOURDHUI.getDate()+d), sc = SC[d], r = rng(7+d*13);
  const step = d<2?1:3, h0 = d===0?20:0, rows=[];
  for(let h=h0; h<24; h+=step){
    const t = Math.round(sc.tm + sc.ta*Math.sin(2*Math.PI*(h-9)/24) + (r()-.5)*2);
    const dedans = sc.rain && h>=sc.rain[0] && h<=sc.rain[1];
    const mm = dedans ? Math.round(sc.r*(.3+r()*1.3)*(step===3?2:1)*10)/10 : 0;
    const th = sc.th && h>=21 && h<=22, vent = Math.round(sc.w*(.7+r()*.6)), g = Math.round(vent*(1.4+r()*.5)+(th?45:0));
    rows.push({h,t,mm:th?Math.max(mm,20):mm,vent,g,ic:choisir(h,t,mm,th,th&&h===22,r)});
  }
  const pire = rows.reduce((a,b)=>b.mm>a.mm?b:a), repr = pire.mm>0?pire:rows[Math.min(rows.length-1,Math.floor(rows.length*.55))];
  const premier = rows[0];
  return {d, date, rows, ic:repr.ic, icLibelle:ICONES[repr.ic].nom, t0:premier.t,
    tmin:Math.min(...rows.map(x=>x.t)), tmax:Math.max(...rows.map(x=>x.t)),
    mm:Math.round(rows.reduce((s,x)=>s+x.mm,0)*10)/10, g:Math.max(...rows.map(x=>x.g))};
}
export const jours = () => [0,1,2,3,4,5,6].map(jour);

/** « Aujourd'hui », « Demain », puis « Jeudi »… */
export const nomJour = j => j.d===0 ? "Aujourd'hui" : j.d===1 ? "Demain" : JOURS_L[j.date.getDay()].replace(/^./, c=>c.toUpperCase());
/** « mar. 17 nov. » */
export const dateCourte = j => `${JOURS[j.date.getDay()]} ${j.date.getDate()} ${MOIS[j.date.getMonth()].slice(0,3)}.`;
/** « mardi 17 novembre » */
export const dateLongue = j => `${JOURS_L[j.date.getDay()]} ${j.date.getDate()} ${MOIS[j.date.getMonth()]}`;

/** Tableau horaire d'un jour. Classes : table.h, .t (température), .mm (pastille de pluie). Vent et rafales en km/h. */
export function tableauHoraire(j){
  return `<table class="h"><thead><tr><th style="text-align:left">Heure</th><th>Temps</th><th>Temp.</th><th>mm</th><th>Vent <small>km/h</small></th><th>Rafales <small>km/h</small></th></tr></thead><tbody>
    ${j.rows.map(x=>`<tr><td>${String(x.h).padStart(2,"0")}h</td><td>${icone(x.ic)}</td><td class="t" style="color:${couleurT(x.t)}">${x.t}°</td><td>${pastillePluie(x.mm)}</td><td>${x.vent}</td><td class="t" style="color:${couleurG(x.g)}">${x.g}</td></tr>`).join("")}
    </tbody></table>`;
}
export {icone, ICONES, couleurT, couleurG, pastillePluie};
