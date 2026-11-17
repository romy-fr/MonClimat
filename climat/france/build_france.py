#!/usr/bin/env python3
"""
Onglet France : température moyenne mensuelle de la France depuis 1958, et cartes du mois passé
(anomalie de température, rapport des précipitations à la normale), dans la charte des cartes J+6.

Donnée : Météo-France, « Données changement climatique – SIM mensuelle » (meteo.data.gouv.fr /
data.gouv.fr), Licence Ouverte Etalab 2.0. Analyse Safran-Isba sur une grille de 8 km couvrant la
métropole (et les bassins versants voisins), un fichier par an depuis 1958 :
    https://meteofrance.s3.sbg.io.cloud.ovh.net/data/REF_CC/SIM_MENS/MENS_SIM2_<année>.csv.gz
Colonnes utilisées : LAMBX, LAMBY (Lambert II étendu, en hectomètres), DATE (AAAAMM),
T (température moyenne, °C), PRETOTM (précipitations totales, mm).

Calculs :
  - température de la France = moyenne des points de grille situés en France (même surface chacun) ;
  - normale = moyenne 1991-2020 du même mois (point par point pour les cartes) ;
  - précipitations : rapport à la normale, en % (100 % = normal).

Usage :
    python build_france.py                      # télécharge les fichiers SIM et produit tout
    python build_france.py --test DOSSIER       # test hors ligne : nat_T.txt et blk.txt (cases de 24 km)

Sorties (dossier OUT_DIR) :
    france_temperature_mensuelle.png, france_carte_temperature.png, france_carte_precipitations.png,
    france.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import gzip
import io
import json
import os
import pathlib

import numpy as np
import pandas as pd
import requests

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.colors import BoundaryNorm, LinearSegmentedColormap  # noqa: E402

# --------------------------------------------------------------------------
# Réglages
# --------------------------------------------------------------------------
SIM = "https://meteofrance.s3.sbg.io.cloud.ovh.net/data/REF_CC/SIM_MENS/MENS_SIM2_{annee}.csv.gz"
PREMIERE_ANNEE = 1958          # la série SIM commence en août 1958
REF = (1991, 2020)             # normale OMM actuelle (celle de Météo-France)
REF2 = (1961, 1990)            # ancienne normale, tracée en pointillés
CASE_HM = 80                   # pas de la grille SIM : 80 hm = 8 km
INTERP_HM = 20                 # grille d'affichage interpolée : 20 hm = 2 km
LISSAGE_MOIS = 12
OUT_DIR = pathlib.Path(os.environ.get("OUT_DIR", "sortie"))
TIMEOUT = 120
HTTP = requests.Session()
HTTP.headers["User-Agent"] = "veille-climat-france/1.0 (usage personnel, non commercial)"
NE_GITHUB = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master"

MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]

# Palettes : mêmes teintes que les cartes et les graphiques de climat
CMAP_T = LinearSegmentedColormap.from_list("anomalie_t", [
    (0.00, "#2b0b3f"), (0.17, "#3b2fbf"), (0.33, "#1f62d6"), (0.40, "#25c7d9"),
    (0.45, "#c4c4bf"), (0.55, "#c4c4bf"),
    (0.60, "#e6e22e"), (0.67, "#f7b733"), (0.75, "#f2762e"), (0.83, "#e0412c"),
    (0.92, "#b81f2a"), (1.00, "#7c0f1e")])
T_LEVELS = np.round(np.arange(-4, 4.01, 0.5), 1)
# précipitations : brun (sec) -> gris (normal) -> bleus/violets (très arrosé)
P_LEVELS = [0, 25, 50, 75, 90, 110, 125, 150, 200, 300, 400]
CMAP_P = LinearSegmentedColormap.from_list("rapport_p", [
    "#7c3d0e", "#b8742a", "#e0b05a", "#efdc9c", "#c4c4bf", "#a8dcd1", "#3fd18b",
    "#25c7d9", "#1f62d6", "#3b2fbf", "#5a1d7a"], N=len(P_LEVELS) + 1)


def fr(x: float, nd: int = 1, signe: bool = True) -> str:
    s = f"{x:+.{nd}f}" if signe else f"{x:.{nd}f}"
    return s.replace(".", ",").replace("-", "−")


# --------------------------------------------------------------------------
# Fond de carte et masque France (Natural Earth, domaine public)
# --------------------------------------------------------------------------
def ne_fichier(cat: str, nom: str) -> pathlib.Path:
    """Télécharge (une fois) un shapefile Natural Earth 50m depuis le dépôt GitHub officiel."""
    import cartopy

    dossier = pathlib.Path(cartopy.config["data_dir"]) / "shapefiles" / "natural_earth" / cat
    dossier.mkdir(parents=True, exist_ok=True)
    if not (dossier / f"{nom}.shp").exists():
        for ext in ("shp", "shx", "dbf", "prj"):
            r = HTTP.get(f"{NE_GITHUB}/50m_{cat}/{nom}.{ext}", timeout=TIMEOUT)
            r.raise_for_status()
            (dossier / f"{nom}.{ext}").write_bytes(r.content)
    return dossier / f"{nom}.shp"


def fonds_de_carte() -> None:
    """Précharge les couches Natural Earth utilisées (le serveur habituel de cartopy peut être injoignable)."""
    for cat, nom in (("physical", "ne_50m_coastline"), ("physical", "ne_50m_land"), ("physical", "ne_50m_ocean"),
                     ("cultural", "ne_50m_admin_0_boundary_lines_land"), ("cultural", "ne_50m_admin_0_countries")):
        ne_fichier(cat, nom)


def polygone_france():
    import cartopy.io.shapereader as shpreader

    for rec in shpreader.Reader(str(ne_fichier("cultural", "ne_50m_admin_0_countries"))).records():
        if rec.attributes.get("ADM0_A3") == "FRA":
            return rec.geometry
    raise RuntimeError("France absente du fichier Natural Earth")


def lonlat(x_hm: np.ndarray, y_hm: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    from pyproj import Transformer

    t = Transformer.from_crs(27572, 4326, always_xy=True)   # Lambert II étendu -> WGS84
    return t.transform(np.asarray(x_hm) * 100.0, np.asarray(y_hm) * 100.0)


def dans_france(lon: np.ndarray, lat: np.ndarray) -> np.ndarray:
    from shapely import contains_xy

    fra = polygone_france()
    return contains_xy(fra, lon, lat)


# --------------------------------------------------------------------------
# Données SIM
# --------------------------------------------------------------------------
def lire_sim(annee: int) -> pd.DataFrame:
    r = HTTP.get(SIM.format(annee=annee), timeout=TIMEOUT)
    r.raise_for_status()
    with gzip.open(io.BytesIO(r.content), "rt") as f:
        df = pd.read_csv(f, sep=";", usecols=["LAMBX", "LAMBY", "DATE", "T", "PRETOTM"])
    return df


def telecharger() -> tuple[pd.Series, pd.DataFrame, pd.Timestamp]:
    """Série nationale mensuelle (°C) et grille du dernier mois (x, y, dT, rapport P en %)."""
    annees = range(PREMIERE_ANNEE, dt.date.today().year + 1)
    frames = []
    for a in annees:
        try:
            frames.append(lire_sim(a))
        except requests.HTTPError:
            if a < dt.date.today().year:
                raise
    df = pd.concat(frames, ignore_index=True)
    pts = df[["LAMBX", "LAMBY"]].drop_duplicates()
    lon, lat = lonlat(pts["LAMBX"].values, pts["LAMBY"].values)
    pts = pts[dans_france(lon, lat)]
    df = df.merge(pts, on=["LAMBX", "LAMBY"])
    df["mois"] = pd.to_datetime(df["DATE"].astype(str), format="%Y%m")
    nat = df.groupby("mois")["T"].mean()

    dernier = df["mois"].max()
    m = df[df["mois"].dt.month == dernier.month]
    norm = (m[(m["mois"].dt.year >= REF[0]) & (m["mois"].dt.year <= REF[1])]
            .groupby(["LAMBX", "LAMBY"])[["T", "PRETOTM"]].mean())
    cur = m[m["mois"] == dernier].set_index(["LAMBX", "LAMBY"])[["T", "PRETOTM"]]
    g = cur.join(norm, rsuffix="_n").dropna().reset_index()
    grille = pd.DataFrame({"x": g["LAMBX"], "y": g["LAMBY"], "dT": g["T"] - g["T_n"],
                           "rP": 100 * g["PRETOTM"] / g["PRETOTM_n"].clip(lower=1)})
    return nat, grille, dernier


def lire_test(dossier: str) -> tuple[pd.Series, pd.DataFrame, pd.Timestamp, int]:
    """Données pré-calculées : nat_T.txt ('AAAAMM|t1,t2,...') et blk.txt (cases de 3 x 3 points :
    'bx,by,dT x10,rapport %,nb points;...'). Renvoie aussi le pas de grille en hm."""
    d = pathlib.Path(dossier)
    debut, vals = (d / "nat_T.txt").read_text().strip().split("|")
    v = [float(x) for x in vals.split(",")]
    nat = pd.Series(v, index=pd.date_range(pd.to_datetime(debut, format="%Y%m"), periods=len(v), freq="MS"))
    rows = [list(map(int, r.split(","))) for r in (d / "blk.txt").read_text().strip().split(";")]
    b = pd.DataFrame(rows, columns=["bx", "by", "dT", "rP", "n"])
    pas = 3 * CASE_HM
    grille = pd.DataFrame({"x": b["bx"] * pas + pas / 2, "y": b["by"] * pas + pas / 2,
                           "dT": b["dT"] / 10, "rP": b["rP"].astype(float)})
    return nat, grille, nat.index[-1], pas


# --------------------------------------------------------------------------
# Graphique de la température nationale (gabarit de la température mondiale)
# --------------------------------------------------------------------------
def render_serie(nat: pd.Series, path: pathlib.Path) -> dict:
    per = nat[(nat.index.year >= REF[0]) & (nat.index.year <= REF[1])]
    clim = per.groupby(per.index.month).mean()
    a = nat - clim.reindex(nat.index.month).values
    per2 = nat[(nat.index.year >= REF2[0]) & (nat.index.year <= REF2[1])]
    decal = float((per2.groupby(per2.index.month).mean() - clim).mean())   # 1961-1990 sur cet axe
    liss = a.rolling(LISSAGE_MOIS, center=True, min_periods=LISSAGE_MOIS).mean()
    dernier, rec = a.index[-1], a.idxmax()
    x = a.index.year + (a.index.month - 0.5) / 12
    norm = BoundaryNorm(T_LEVELS, CMAP_T.N, extend="both")

    W, top, bottom, plot_h = 9.6, 1.0, 1.15, 4.6
    H = top + plot_h + bottom
    fig = plt.figure(figsize=(W, H), dpi=110)
    yf = lambda inches_from_top: 1 - inches_from_top / H  # noqa: E731
    ax = fig.add_axes([0.075, (bottom + 0.30) / H, 0.85, (plot_h - 0.30) / H])
    ax.axhline(0, color="#1a1a1a", lw=0.8, zorder=1)
    ax.axhline(decal, color="#6b6b6b", lw=0.8, ls=(0, (1, 2)), zorder=1)
    pts = ax.scatter(x, a.values, c=a.values, cmap=CMAP_T, norm=norm, s=7, lw=0, zorder=2)
    ax.plot(x, liss.values, color="#1a1a1a", lw=1.4, zorder=3)
    from matplotlib.lines import Line2D
    ax.legend(handles=[Line2D([], [], color="#1a1a1a", lw=0.8, label=f"normale {REF[0]}-{REF[1]}"),
                       Line2D([], [], color="#6b6b6b", lw=0.8, ls=(0, (1, 2)), label=f"normale {REF2[0]}-{REF2[1]}")],
              loc="upper left", frameon=False, fontsize=8, labelcolor="#333333")
    x_rec = rec.year + (rec.month - 0.5) / 12
    ax.annotate(f"record : {MOIS[rec.month - 1]} {rec.year}\n{fr(a[rec])} °C", xy=(x_rec, a[rec]),
                xytext=(x_rec - 14, a[rec] + 0.2), fontsize=8.5, color="#1a1a1a", ha="right", va="center",
                arrowprops=dict(arrowstyle="-", color="#6b6b6b", lw=0.7), zorder=5)
    lim = np.ceil(max(abs(a.min()), abs(a.max())) + 0.5)
    ax.set_xlim(PREMIERE_ANNEE - 1, dernier.year + 2)
    ax.set_ylim(-lim, lim)
    ax.set_xticks(range(1960, dernier.year + 1, 10))
    ax.set_yticks(np.arange(-lim, lim + 0.01, 1))
    ax.yaxis.set_major_formatter(lambda v, _: fr(v, 0) if abs(v) > 1e-9 else "0")
    ax.set_ylabel(f"écart à {REF[0]}-{REF[1]} (°C)", fontsize=9, color="#333333")
    ax.grid(axis="y", color="#e3e3df", lw=0.6, zorder=0)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color("#9a9a96")
    ax.tick_params(labelsize=8.5, colors="#333333")

    m = MOIS[dernier.month - 1]
    fig.text(0.02, yf(0.18), "France", fontsize=22, fontweight="bold", va="top")
    fig.text(0.02, yf(0.62),
             f"Température moyenne mensuelle, août {PREMIERE_ANNEE} → {m} {dernier.year}  ·  {m} {dernier.year} : "
             f"{fr(nat.iloc[-1], 1, False)} °C ({fr(a.iloc[-1])})  ·  12 derniers mois : {fr(a.iloc[-12:].mean())} °C",
             fontsize=10.5, va="top", color="#333333")
    fig.text(0.98, yf(0.18), f"Écart à la normale {REF[0]}-{REF[1]} (°C)\npoints : mois  ·  trait : moyenne sur 12 mois",
             fontsize=9, ha="right", va="top", color="#333333")
    cax = fig.add_axes([0.10, 0.70 / H, 0.80, 0.17 / H])
    cb = fig.colorbar(pts, cax=cax, orientation="horizontal", ticks=T_LEVELS[::2])
    cb.minorticks_off()
    cb.ax.tick_params(labelsize=7)
    cb.ax.xaxis.set_major_formatter(lambda v, _: fr(v, 0) if abs(v) > 1e-9 else "0")
    fig.text(0.5, 0.06 / H,
             "Données : Météo-France, SIM mensuelle (Safran, grille 8 km), Licence Ouverte Etalab 2.0"
             "\nMoyenne des points de grille situés en France métropolitaine, Corse comprise",
             fontsize=7.5, ha="center", color="#555555")
    fig.savefig(path, facecolor="white")
    plt.close(fig)
    return {"dernier": {"mois": dernier.strftime("%Y-%m"), "t": round(float(nat.iloc[-1]), 2),
                        "ecart": round(float(a.iloc[-1]), 2)},
            "record": {"mois": rec.strftime("%Y-%m"), "ecart": round(float(a[rec]), 2)},
            "mois": [d.strftime("%Y-%m") for d in a.index], "ecart": [round(float(v), 2) for v in a.values]}


# --------------------------------------------------------------------------
# Cartes du mois passé (gabarit des cartes J+6)
# --------------------------------------------------------------------------
_CADRE = {}


def cadre():
    if not _CADRE:
        import cartopy.crs as ccrs

        proj = ccrs.LambertConformal(central_longitude=2.5, central_latitude=46.5, standard_parallels=(44, 49))
        pts = proj.transform_points(ccrs.PlateCarree(), np.array([-5.3, 9.8, -1.8, 8.4]),
                                    np.array([46.5, 42.3, 41.2, 51.2]))
        x0, x1, y0, y1 = pts[:, 0].min(), pts[:, 0].max(), pts[:, 1].min(), pts[:, 1].max()
        dx, dy = (x1 - x0) * 0.03, (y1 - y0) * 0.03
        _CADRE.update(proj=proj, extent=[x0 - dx, x1 + dx, y0 - dy, y1 + dy])
    return _CADRE["proj"], _CADRE["extent"]


def render_carte(grille: pd.DataFrame, champ: str, pas_hm: float, mois: pd.Timestamp, path: pathlib.Path,
                 resume: str) -> None:
    import cartopy.crs as ccrs
    import cartopy.feature as cfeature

    # Interpolation sur une grille fine de 2 km (Lambert II étendu), puis découpage à la frontière :
    # rendu continu comme les cartes des modèles, sans changer les valeurs aux points de mesure.
    from scipy.interpolate import griddata

    fin = INTERP_HM
    xs = np.arange(grille["x"].min() - pas_hm, grille["x"].max() + pas_hm + fin, fin)
    ys = np.arange(grille["y"].min() - pas_hm, grille["y"].max() + pas_hm + fin, fin)
    XF, YF = np.meshgrid(xs, ys)
    pts, vals = grille[["x", "y"]].values, grille[champ].values
    Z = griddata(pts, vals, (XF, YF), method="cubic")
    trou = np.isnan(Z)                                    # bords (côtes, frontières) : plus proche voisin
    Z[trou] = griddata(pts, vals, (XF[trou], YF[trou]), method="nearest")
    LON, LAT = lonlat(XF, YF)
    Z[~dans_france(LON.ravel(), LAT.ravel()).reshape(Z.shape)] = np.nan

    proj, (x0, x1, y0, y1) = cadre()
    W = 9.6
    map_w = W * 0.96
    map_h = map_w * (y1 - y0) / (x1 - x0)
    top, bottom = 1.0, 0.95
    H = map_h + top + bottom
    fig = plt.figure(figsize=(W, H), dpi=110)
    ax = fig.add_axes([0.02, bottom / H, 0.96, map_h / H], projection=proj)
    ax.set_extent([x0, x1, y0, y1], crs=proj)
    yf = lambda inches_from_top: 1 - inches_from_top / H  # noqa: E731

    if champ == "dT":
        levels, cmap, unite, titre = T_LEVELS, CMAP_T, "°C", "Anomalie de température"
        norm = BoundaryNorm(levels, cmap.N, extend="both")
        ticks, fmt = levels[::2], (lambda v, _: fr(v, 0) if abs(v) > 1e-9 else "0")
        etiquette = f"Écart à la normale {REF[0]}-{REF[1]} (°C)"
    else:
        levels, cmap, unite, titre = P_LEVELS, CMAP_P, "%", "Précipitations"
        norm = BoundaryNorm(levels, cmap.N, extend="max")
        ticks, fmt = levels, (lambda v, _: f"{v:.0f}")
        etiquette = f"Rapport à la normale {REF[0]}-{REF[1]} (%)"
    pc = ccrs.PlateCarree()
    bornes = list(levels) + ([levels[-1] + 1000] if champ == "rP" else [])
    mesh = ax.contourf(LON, LAT, np.ma.masked_invalid(np.clip(Z, levels[0] - 1, bornes[-1] - 1)),
                       levels=bornes if champ == "rP" else levels, cmap=cmap, norm=norm,
                       extend="neither" if champ == "rP" else "both", transform=pc)
    ax.add_feature(cfeature.LAND.with_scale("50m"), facecolor="#f1f1ee", zorder=0)
    ax.add_feature(cfeature.OCEAN.with_scale("50m"), facecolor="#e4eef5", zorder=0)
    ax.add_feature(cfeature.COASTLINE.with_scale("50m"), linewidth=0.6, edgecolor="#1a1a1a")
    ax.add_feature(cfeature.BORDERS.with_scale("50m"), linewidth=0.5, edgecolor="#1a1a1a")
    for nom, lo, la in (("Paris", 2.35, 48.86), ("Lyon", 4.84, 45.76), ("Marseille", 5.37, 43.30),
                        ("Toulouse", 1.44, 43.60), ("Bordeaux", -0.58, 44.84), ("Nantes", -1.55, 47.22),
                        ("Lille", 3.06, 50.63), ("Strasbourg", 7.75, 48.58), ("Brest", -4.49, 48.39)):
        ax.plot(lo, la, "o", ms=2.5, color="#1a1a1a", transform=pc, zorder=5)
        ax.text(lo + 0.12, la + 0.08, nom, fontsize=7.5, color="#1a1a1a", transform=pc, zorder=5)

    m = f"{MOIS[mois.month - 1]} {mois.year}"
    fig.text(0.02, yf(0.18), f"{titre} · {m}", fontsize=22, fontweight="bold", va="top")
    fig.text(0.02, yf(0.62), resume, fontsize=10.5, va="top", color="#333333")
    fig.text(0.98, yf(0.18), etiquette + "\nmoyenne du mois, grille 8 km interpolée", fontsize=9, ha="right", va="top",
             color="#333333")
    cax = fig.add_axes([0.10, 0.50 / H, 0.80, 0.17 / H])
    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
    cb = fig.colorbar(sm, cax=cax, orientation="horizontal", ticks=ticks,
                      extend="both" if champ == "dT" else "max")
    cb.minorticks_off()
    cb.ax.tick_params(labelsize=7)
    cb.ax.xaxis.set_major_formatter(fmt)
    fig.text(0.5, 0.10 / H, "Données : Météo-France, SIM mensuelle (Safran, grille 8 km), Licence Ouverte Etalab 2.0"
             "  ·  fonds de carte Natural Earth", fontsize=7.5, ha="center", color="#555555")
    fig.savefig(path, facecolor="white")
    plt.close(fig)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", help="dossier de données pré-calculées (test hors ligne)")
    args = ap.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fonds_de_carte()
    if args.test:
        nat, grille, dernier, pas = lire_test(args.test)
        lon, lat = lonlat(grille["x"].values, grille["y"].values)
        grille = grille[dans_france(lon, lat)]
    else:
        nat, grille, dernier = telecharger()
        pas = CASE_HM
    info = {"source": "Météo-France SIM mensuelle", "licence": "Licence Ouverte Etalab 2.0",
            "normale": f"{REF[0]}-{REF[1]}"}
    info["serie"] = render_serie(nat, OUT_DIR / "france_temperature_mensuelle.png")
    e = info["serie"]["dernier"]["ecart"]
    m = f"{MOIS[dernier.month - 1]} {dernier.year}"
    render_carte(grille, "dT", pas, dernier, OUT_DIR / "france_carte_temperature.png",
                 f"Température moyenne de {m} comparée à la normale 1991-2020  ·  France : {fr(e)} °C")
    p_moy = float(grille["rP"].median())
    sec = float((grille["rP"] < 75).mean() * 100)
    render_carte(grille, "rP", pas, dernier, OUT_DIR / "france_carte_precipitations.png",
                 f"Cumul de {m} en % de la normale 1991-2020  ·  médiane : {p_moy:.0f} %  ·  "
                 f"{sec:.0f} % du territoire sous 75 %")
    info["carte"] = {"mois": dernier.strftime("%Y-%m"), "ecart_t_france": e,
                     "precip_mediane_pct": round(p_moy), "part_territoire_sous_75pct": round(sec)}
    (OUT_DIR / "france.json").write_text(json.dumps(info, ensure_ascii=False))
    print(info["serie"]["dernier"], info["serie"]["record"], info["carte"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
