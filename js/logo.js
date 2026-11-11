/* ============================================================
   Logo du logiciel : logo SpeedCompta (compteur) ou logo importé,
   affiché dans le menu, l'écran d'ouverture, l'icône et les états PDF / Excel.
   Couleurs des états et exports reprises du logo. Réglages dans Paramètres.
   ============================================================ */
const scHex = v => (/^#[0-9a-f]{6}$/i.test(String(v || "")) ? String(v).toUpperCase() : "");
function scMix(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase(); }
function scBr() { return (CONFIG && CONFIG.branding) || {}; }
function scLogo() { const b = scBr(); const custom = b.logoUse === "perso" && !!b.logoImg; return { custom, img: custom ? b.logoImg : "", wide: custom && (+b.logoRatio || 1) >= 1.8 }; }
const scNoBrand = () => { try { return !!(S && typeof rpCfg === "function" && rpCfg().noBrand); } catch (e) { return false; } };

/* ---------- Menu, barre mobile, écrans d'accès ---------- */
function scBrandMark(dark = true, size = 30) {
  const L = scLogo();
  if (L.custom) return `<img class="sc-mk cus${L.wide ? " wide" : ""}" src="${esc(L.img)}" alt="" style="height:${size}px">`;
  return `<span class="sc-mk">${SCLOGO.markSVG(dark ? SCLOGO.CREAM : SCLOGO.TEAL, SCLOGO.GOLD, size)}</span>`;
}
function scBrandBlock(dark = true, size = 30) {
  if (scNoBrand()) return brandHTML();
  const L = scLogo(); if (L.wide) return `<span class="sc-brand">${scBrandMark(dark, size)}</span>`;
  return `<span class="sc-brand">${scBrandMark(dark, size)}<span>${brandHTML()}</span></span>`;
}
(function () { const st = document.createElement("style"); st.id = "scLogoCss";
  st.textContent = `.sc-brand{display:inline-flex;align-items:center;gap:10px;vertical-align:middle;max-width:100%}.logo-sm .sc-brand{gap:7px}.sc-mk{display:inline-flex;flex:none;line-height:0}.sc-mk svg{display:block}
.sc-mk.cus{background:#fff;border-radius:8px;padding:3px;object-fit:contain;max-width:46px;box-sizing:border-box}.sc-mk.cus.wide{max-width:190px;padding:4px 8px}
.sc-lg{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:20px}@media (max-width:760px){.sc-lg{grid-template-columns:1fr}}
.sc-lg-prev{display:grid;gap:10px;align-content:start}.sc-lg-box{border-radius:12px;padding:16px 18px;display:flex;align-items:center;min-height:44px;font-family:var(--f-display);font-weight:800;font-size:22px;letter-spacing:-.02em}
.sc-lg-box.dk{background:var(--rail,#0B1733);color:#fff}.sc-lg-box.dk i{font-style:normal;color:var(--logo,#4F8BFF)}.sc-lg-box.lt{background:#fff;color:#0F1B33;border:1px solid var(--line,#E2E8F0)}.sc-lg-box.lt i{font-style:normal;color:${SCLOGO.TEAL}}
.sc-lg-pdf{border:1px solid var(--line,#E2E8F0);border-radius:12px;overflow:hidden;background:#fff;font:600 11px/1.3 system-ui,sans-serif;color:#13201F}.sc-lg-pdf .bar{height:5px}.sc-lg-pdf .bar2{height:2px;width:35%}
.sc-lg-pdf .hd{display:flex;justify-content:space-between;align-items:center;padding:8px 12px 6px}.sc-lg-pdf .tt{padding:2px 12px 8px;font-size:13px;font-weight:800;display:flex;gap:7px;align-items:center}.sc-lg-pdf .tt b{width:3px;height:13px;display:inline-block}
.sc-lg-pdf .rw{display:flex;justify-content:space-between;padding:5px 12px;font-weight:500}.sc-lg-pdf .rw.h{color:#fff;font-weight:700}.sc-lg-pdf .rw.t{color:#fff;font-weight:800}.sc-lg-pdf .lbl{padding:6px 12px;font-size:10.5px;color:#64748B;font-weight:500;border-top:1px solid #EEF2F1}
.sc-lg-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sc-lg h3{margin:4px 0 0;font-size:14px}`;
  document.head.appendChild(st); })();

/* ---------- Couleurs des états PDF et exports Excel ---------- */
function scPdfPalette() {
  const b = scBr(); const n = scHex(b.etatFonce) || SCLOGO.TEAL, g = scHex(b.etatAccent) || SCLOGO.GOLD, W = "#FFFFFF", K = "#000000";
  Object.assign(PC, { navy: n, blue: scMix(n, W, .2), gold: g, ink: "#13201F", ink2: "#4A5B5B", ink3: "#879696", rule: scMix(n, W, .83), grid: scMix(n, W, .94), soft: scMix(n, W, .9),
    zebra: scMix(n, W, .965), grpBg: scMix(n, W, .92), bigBg: scMix(g, W, .8), totCode: scMix(n, W, .2), lineA: scMix(n, W, .9), lineB: scMix(n, W, .8),
    cov1: scMix(n, K, .18), cov2: scMix(n, W, .07), onDark: scMix(n, W, .72), kpiBg: scMix(n, W, .94) });
}
scPdfPalette();
/* dessin vectoriel du logo compteur dans un PDF (coordonnées haut-gauche, taille en points) */
function scPdfMark(p, x, y, size, stroke, needle) {
  const s = size / 96, H = p.H, f = v => v.toFixed(2), Y = v => f(H - v);
  const cx = x + 48 * s, cy = y + 48 * s, r = 34 * s; const rad = d => d * Math.PI / 180;
  let a = rad(-45); const step = rad(-67.5); const P = t => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  let d = `${f(P(a)[0])} ${Y(P(a)[1])} m`;
  for (let i = 0; i < 4; i++) { const b = a + step, k = 4 / 3 * Math.tan((b - a) / 4); const p0 = P(a), p3 = P(b);
    const c1 = [p0[0] - k * r * Math.sin(a), p0[1] + k * r * Math.cos(a)], c2 = [p3[0] + k * r * Math.sin(b), p3[1] - k * r * Math.cos(b)];
    d += ` ${f(c1[0])} ${Y(c1[1])} ${f(c2[0])} ${Y(c2[1])} ${f(p3[0])} ${Y(p3[1])} c`; a = b; }
  const hub = (R) => { const k = .5523 * R; return `${f(cx + R)} ${Y(cy)} m ${f(cx + R)} ${Y(cy + k)} ${f(cx + k)} ${Y(cy + R)} ${f(cx)} ${Y(cy + R)} c ${f(cx - k)} ${Y(cy + R)} ${f(cx - R)} ${Y(cy + k)} ${f(cx - R)} ${Y(cy)} c ${f(cx - R)} ${Y(cy - k)} ${f(cx - k)} ${Y(cy - R)} ${f(cx)} ${Y(cy - R)} c ${f(cx + k)} ${Y(cy - R)} ${f(cx + R)} ${Y(cy - k)} ${f(cx + R)} ${Y(cy)} c f`; };
  p.raw(`q 1 J 1 j ${p.col(stroke)} RG ${f(11 * s)} w ${d} S ${p.col(needle)} RG ${f(7 * s)} w ${f(cx)} ${Y(cy)} m ${f(x + 71 * s)} ${Y(y + 35 * s)} l S ${p.col(stroke)} rg ${hub(7 * s)} Q`);
}
let _scIm = null, _scImK = "";
function scPdfImg() { const j = scBr().logoJpg; if (!j || !j.d) return null; const k = j.d.length + ":" + j.d.slice(-40); if (k !== _scImK) { try { _scIm = { bin: atob(j.d), w: j.w, h: j.h }; _scImK = k; } catch (e) { return null; } } return _scIm; }
/* nom du logiciel précédé du logo, en tête des états et sur la couverture */
function scPdfBrand(p, x, base, size, c1, c2, dark) {
  const [b1, b2] = brandParts(); let tx = x;
  if (!scNoBrand()) { const L = scLogo(); const mh = size * 1.5; const top = base - size * 0.36 - mh / 2;
    if (L.custom) { const im = scPdfImg(); if (im) { let h = L.wide ? mh * 1.25 : mh, w = h * im.w / im.h; if (w > 160) { w = 160; h = w * im.h / im.w; } const ty = base - size * 0.36 - h / 2;
      if (dark) p.rect(x - 5, ty - 5, w + 10, h + 10, "#FFFFFF"); p.image(x, ty, w, h, im); if (L.wide) return; tx = x + w + (dark ? 14 : 8); } }
    else { scPdfMark(p, x, top, mh, dark ? SCLOGO.CREAM : SCLOGO.TEAL, SCLOGO.GOLD); tx = x + mh + size * 0.42; } }
  p.text(tx, base, b1, { size, bold: true, color: c1 }); if (b2) p.text(tx + textW(b1, size, true), base, b2, { size, bold: true, color: c2 });
}

/* ---------- Mémoire locale pour l'écran d'ouverture (lu avant le chargement de la configuration) ---------- */
function scBrandCache() { const b = scBr(); const L = scLogo();
  const c = { img: L.img, wide: L.wide, nom: b.nom || "Speedix", slogan: b.slogan || "", bg: L.custom ? (scHex(b.etatFonce) || SCLOGO.TEAL) : SCLOGO.TEAL, acc: L.custom ? (scHex(b.etatAccent) || SCLOGO.GOLD) : SCLOGO.GOLD };
  SCLOGO.cache = c; try { localStorage.setItem("sc:brandCache", JSON.stringify(c)); } catch (e) { } }
const _applyCfgLogo = applyConfig;
applyConfig = function () { const r = _applyCfgLogo.apply(this, arguments); try { scPdfPalette(); scBrandCache(); if (typeof scSetFavicon === "function") scSetFavicon(); } catch (e) { console.warn(e); } return r; };

/* ---------- Import d'un logo : PNG (affichage) + JPEG (PDF) ---------- */
function scReadURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); }); }
function scLoadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("image illisible")); i.src = src; }); }
async function scPrepLogo(file) {
  const img = await scLoadImg(await scReadURL(file)); let w0 = img.naturalWidth, h0 = img.naturalHeight; if (!w0 || !h0) { w0 = 512; h0 = 512; }
  const ratio = w0 / h0; const fit = m => ratio >= 1 ? [m, Math.max(1, Math.round(m / ratio))] : [Math.max(1, Math.round(m * ratio)), m];
  const draw = (m, bg) => { const [w, h] = fit(m); const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); } x.drawImage(img, 0, 0, w, h); return c; };
  let png = draw(ratio >= 1.8 ? 420 : 256).toDataURL("image/png"); if (png.length > 350000) png = draw(ratio >= 1.8 ? 300 : 180).toDataURL("image/png");
  const jc = draw(ratio >= 1.8 ? 600 : 360, "#FFFFFF"); const jpg = jc.toDataURL("image/jpeg", 0.88);
  return { png, jpg: { d: jpg.slice(jpg.indexOf(",") + 1), w: jc.width, h: jc.height }, ratio: Math.round(ratio * 100) / 100 };
}
async function scBrandSave(patch, note) {
  const b = CONFIG.branding; for (const k in patch) { if (patch[k] == null) delete b[k]; else b[k] = patch[k]; }
  await ADM.save(note || "Logo");
  if (UI.cfg && UI.cfg.branding) for (const k in patch) { if (patch[k] == null) delete UI.cfg.branding[k]; else UI.cfg.branding[k] = deep(patch[k]); }
}

/* ---------- Carte « Logo et ouverture » (Paramètres et Administration) ---------- */
const scSplashOn = () => { try { return localStorage.getItem("sc:splashOff") !== "1"; } catch (e) { return true; } };
function scLogoCard() {
  const adm = isAdmin(); const b = scBr(); const L = scLogo(); const has = !!b.logoImg;
  const n = PC.navy, g = PC.gold;
  const pdf = `<div class="sc-lg-pdf" aria-label="Aperçu des états PDF"><div class="bar" style="background:${PC.blue}"></div><div class="bar2" style="background:${g}"></div>
    <div class="hd"><span class="sc-brand" style="gap:6px">${L.custom ? scBrandMark(false, 16) : `<span class="sc-mk">${SCLOGO.markSVG(SCLOGO.TEAL, SCLOGO.GOLD, 16)}</span>`}${L.wide ? "" : `<span style="font-weight:800;color:${n}">${esc(brandParts()[0])}<span style="color:${PC.blue}">${esc(brandParts()[1])}</span></span>`}</span><span style="font-size:10px;color:#4A5B5B">Bilan · Exercice ${new Date().getFullYear()}</span></div>
    <div class="tt" style="color:${n}"><b style="background:${PC.blue}"></b>Compte de résultat</div>
    <div class="rw h" style="background:${n}"><span>Poste</span><span>Montant</span></div>
    <div class="rw"><span>Chiffre d'affaires</span><span>248 500,00</span></div><div class="rw" style="background:${PC.zebra}"><span>Charges externes</span><span>-61 200,00</span></div>
    <div class="rw" style="background:${PC.bigBg};color:${n};font-weight:700"><span>Résultat d'exploitation</span><span>42 870,00</span></div>
    <div class="lbl">Aperçu des couleurs des états et exports</div></div>`;
  const ctl = adm ? `<div class="stack" style="gap:10px">
      <div><div class="small muted" style="margin-bottom:6px">Logo affiché</div><div class="seg"><button class="${L.custom ? "" : "on"}" data-act="scLogoUse" data-v="">Logo SpeedCompta</button><button class="${L.custom ? "on" : ""}" data-act="scLogoUse" data-v="perso" ${has ? "" : "disabled title=\"Importez d'abord un logo\""}>Mon logo</button></div></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn pri">${has ? "Remplacer mon logo…" : "Importer un logo…"}<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" data-ch="scLogoFile" hidden></label>${has ? `<button class="btn ghost" data-act="scLogoDel">Supprimer mon logo</button>` : ""}</div>
      <p class="small muted" style="margin:0">PNG ou SVG à fond transparent conseillé (5 Mo max). Le logo s'affiche dans le menu, l'écran d'ouverture, l'icône du logiciel et l'en-tête des états PDF, pour tous les utilisateurs. Un logo large (plus de 1,8 fois plus large que haut) remplace aussi le nom.</p>
      <h3>Couleurs des états et exports</h3>
      <div class="sc-lg-cols"><label class="f">Couleur principale<input class="in" type="color" value="${esc(scHex(b.etatFonce) || SCLOGO.TEAL)}" data-ch="scEtatCol" data-f="etatFonce"></label><label class="f">Couleur d'accent<input class="in" type="color" value="${esc(scHex(b.etatAccent) || SCLOGO.GOLD)}" data-ch="scEtatCol" data-f="etatAccent"></label></div>
      ${scHex(b.etatFonce) || scHex(b.etatAccent) ? `<button class="btn sm ghost" style="align-self:flex-start" data-act="scEtatReset">Reprendre les couleurs du logo SpeedCompta</button>` : ""}
    </div>` : `<p class="small muted" style="margin:0">Le logo et les couleurs des états sont définis par l'éditeur du logiciel.</p>`;
  return `<section class="card sc-logo-card" style="margin-bottom:16px"><div class="card-h"><h2>${ico("check")} Logo et ouverture</h2>${adm ? `<span class="pill n">Pour tous les utilisateurs</span>` : ""}</div>
  <div class="card-b sc-lg"><div class="sc-lg-prev"><div class="sc-lg-box dk">${scBrandBlock(true, 34)}</div><div class="sc-lg-box lt">${scBrandBlock(false, 34)}</div>${pdf}</div>
  <div class="stack" style="gap:14px">${ctl}
    <div class="stack" style="gap:8px;border-top:1px solid var(--line,#E2E8F0);padding-top:12px"><label class="chk"><input type="checkbox" data-ch="scSplashT" ${scSplashOn() ? "checked" : ""}> Animation d'ouverture au lancement (sur cet appareil)</label>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="scSplashPlay">▶ Revoir l'animation</button>${adm ? `<button class="btn sm" data-act="scIconDl">⇩ Icône du logiciel (PNG)</button>` : ""}</div></div>
  </div></div></section>`;
}
const _paramsLogo = VIEWS.params;
VIEWS.params = function () { const h = _paramsLogo.apply(this, arguments); const i = h.indexOf('<div class="grid g2">'); if (!isAdmin()) return h; return i < 0 ? h + scLogoCard() : h.slice(0, i) + scLogoCard() + h.slice(i); };
if (typeof ADM_VIEWS !== "undefined" && ADM_VIEWS.marque) { const _admMarque = ADM_VIEWS.marque; ADM_VIEWS.marque = () => scLogoCard() + _admMarque(); }

const scFail = e => toast("Enregistrement impossible : " + ((e && (e.code || e.message)) || e));
Object.assign(ABOACT, {
  scLogoUse: async el => { if (!isAdmin()) return; const v = el.dataset.v || ""; if (v === "perso" && !scBr().logoImg) return; try { await scBrandSave({ logoUse: v || null }, v ? "Logo personnalisé" : "Logo SpeedCompta"); toast(v ? "Votre logo est appliqué ✓" : "Logo SpeedCompta rétabli ✓"); } catch (e) { scFail(e); } render(); },
  scLogoDel: async () => { if (!isAdmin()) return; try { await scBrandSave({ logoImg: null, logoJpg: null, logoRatio: null, logoUse: null }, "Logo supprimé"); toast("Logo supprimé : retour au logo SpeedCompta."); } catch (e) { scFail(e); } render(); },
  scEtatReset: async () => { if (!isAdmin()) return; try { await scBrandSave({ etatFonce: null, etatAccent: null }, "Couleurs des états"); toast("Couleurs du logo SpeedCompta rétablies ✓"); } catch (e) { scFail(e); } render(); },
  scSplashPlay: () => { if (window.SC_SPLASH) window.SC_SPLASH({}); }
});
Object.assign(ABOCHG, {
  scLogoFile: async el => { const f = el.files && el.files[0]; el.value = ""; if (!f || !isAdmin()) return;
    if (!/^image\//.test(f.type)) { toast("Choisissez une image PNG, JPG, SVG ou WebP."); return; } if (f.size > 5e6) { toast("Image trop lourde (5 Mo maximum)."); return; }
    toast("Préparation du logo…");
    try { const r = await scPrepLogo(f); await scBrandSave({ logoImg: r.png, logoJpg: r.jpg, logoRatio: r.ratio, logoUse: "perso" }, "Logo importé"); toast("Logo importé et appliqué ✓"); } catch (e) { scFail(e); } render(); },
  scEtatCol: async el => { if (!isAdmin()) return; const v = scHex(el.value); if (!v) return; try { await scBrandSave({ [el.dataset.f]: v }, "Couleurs des états"); toast("Couleurs des états et exports mises à jour ✓"); } catch (e) { scFail(e); } render(); },
  scSplashT: el => { try { if (el.checked) localStorage.removeItem("sc:splashOff"); else localStorage.setItem("sc:splashOff", "1"); } catch (e) { } toast(el.checked ? "Animation d'ouverture activée." : "Animation d'ouverture désactivée sur cet appareil."); }
});
