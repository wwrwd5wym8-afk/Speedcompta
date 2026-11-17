/* ============================================================================
   Arrondi cohérent à l'euro dans les états présentés sans centimes
   Problème : chaque ligne était arrondie à l'euro à l'affichage, mais les totaux étaient calculés
   au centime puis arrondis : un total pouvait différer d'1 € (ou plus) de l'addition des lignes.
   Solution (méthode des logiciels de production de comptes) : pour les états en euros, chaque
   solde de compte est d'abord arrondi à l'euro, puis tous les postes, sous-totaux et totaux sont
   calculés à partir de ces soldes arrondis. Si l'arrondi crée un écart entre l'actif et le passif,
   il est porté en « autres créances » ou « autres dettes » (écart d'arrondi), comme le prévoit
   l'usage. Les montants au centime restent intacts dans la comptabilité, la TVA et le FEC.
   S'applique : analyse financière, tableaux de bord financiers, états flash, bilan imagé,
   plaquettes et publications sans centimes, liasse fiscale (montants en euros).
   ========================================================================== */
const ARR = { on: 0 };
function arrCfg() { try { return localStorage.getItem("sc:arr") !== "0"; } catch (e) { return true; } }
function arrWith(fn) { if (!arrCfg() || ARR.on) return fn(); const bv = () => { if (typeof bumpV === "function") bumpV(); }; ARR.on = 1; bv(); try { return fn(); } finally { ARR.on = 0; bv(); } }
(function () {
  const _s = soldeMap; soldeMap = function () { const m = _s.apply(this, arguments); if (!ARR.on || (typeof PUB !== "undefined" && /^det/.test(PUB.cur || ""))) return m; const o = {}; for (const k in m) { const v = Math.round((m[k] || 0) / 100) * 100; if (v) o[k] = v; } return o; };
  const _b = bilan; bilan = function () { const B = _b.apply(this, arguments); if (!ARR.on || !B || !B.B) return B; const d = (B.totA || 0) - (B.totP || 0); if (d) { const k = d > 0 ? "P_adet" : "A_acre"; B.B[k] ||= { brut: 0, am: 0, val: 0, comptes: [] }; if (d > 0) B.B[k].val += d; else { B.B[k].brut -= d; B.B[k].val -= d; } if (d > 0) B.totP += d; else B.totA -= d; B.ecartArrondi = d; } return B; };
  /* écrans financiers */
  const wrapV = k => { const f = VIEWS[k]; if (typeof f !== "function" || f._arr) return; const g = function () { return arrWith(() => f.apply(this, arguments)); }; g._arr = 1; VIEWS[k] = g; };
  const L = () => Object.keys(VIEWS).filter(k => /^fin(?!Prev)|^flash$|^bilanImg$|^cnsDash$|^rapGest|^l2033|^liasseEdit$|^liasseApc$|^gestTab|^cdgDash/.test(k));
  L().forEach(wrapV); setTimeout(() => L().forEach(wrapV), 0);
  /* plaquettes et publications sans centimes, liasse */
  if (typeof cq2Report === "function") { const _r = cq2Report; cq2Report = function () { const Q = typeof cq2St === "function" ? cq2St() : {}; if ((Q.opt || {}).round === "1") return arrWith(() => _r.apply(this, arguments)); return _r.apply(this, arguments); }; }
  if (typeof liasseReport === "function") { const _l = liasseReport; liasseReport = function () { return arrWith(() => _l.apply(this, arguments)); }; }
  /* réglage */
  CHG.arrCfg = el => { try { localStorage.setItem("sc:arr", el.value); } catch (e) { } if (typeof bumpV === "function") bumpV(); toast("Réglage enregistré"); render(); };
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); const on = arrCfg();
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>🧮 Arrondi des états en euros</h2></div><div class="panel-b"><label class="f" style="max-width:640px">Arrondi cohérent : les totaux sont toujours la somme des lignes affichées<select class="in" data-ch="arrCfg"><option value="1" ${on ? "selected" : ""}>Oui (recommandé)</option><option value="0" ${on ? "" : "selected"}>Non</option></select><small class="muted">Pour les états présentés sans centimes (analyse financière, états flash, plaquettes, liasse), chaque compte est arrondi à l'euro avant les totaux ; un écart éventuel entre actif et passif est porté en écart d'arrondi (autres créances ou autres dettes). La comptabilité, la TVA et le FEC restent au centime.</small></label></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
})();
