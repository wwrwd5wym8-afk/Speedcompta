/* ============================================================
   Modules indépendants de la comptabilité.
   - Chiffres clés saisis hors comptabilité (compte de résultat, bilan, CA mensuel) :
     quand un exercice n'a aucune écriture, ils alimentent tous les modules
     (contrôle de gestion, conseil, bilan imagé, gestion d'entreprise, patrimoine…)
     comme une balance simplifiée. Dès que la comptabilité existe, elle reprend la main.
   - Offres : vente d'un module seul (ex. Conseil sans la comptabilité).
   ============================================================ */
const MANU_F = [["Compte de résultat", [["ca", "Chiffre d'affaires HT"], ["achats", "Achats consommés (marchandises, matières)"], ["ext", "Charges externes (loyers, honoraires, sous-traitance…)"], ["imp", "Impôts et taxes"], ["pers", "Charges de personnel (salaires et charges)"], ["sub", "Subventions d'exploitation"], ["dot", "Dotations aux amortissements et provisions"], ["fin", "Résultat financier (négatif si charge)"], ["exc", "Résultat exceptionnel (négatif si charge)"], ["is", "Impôt sur les bénéfices"]]],
  ["Bilan à la clôture", [["immo", "Immobilisations nettes"], ["stocks", "Stocks"], ["cli", "Créances clients"], ["autC", "Autres créances"], ["dispo", "Trésorerie (banques, caisse)"], ["capital", "Capital social"], ["cpx", "Réserves et report à nouveau"], ["df", "Emprunts et dettes financières"], ["fou", "Dettes fournisseurs"], ["fisc", "Dettes fiscales et sociales"], ["autD", "Autres dettes"], ["conc", "Concours bancaires (découverts)"]]]];
const MANU_MOIS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const manuN = v => Math.round((Number(String(v == null ? "" : v).replace(/[\s  ]/g, "").replace(",", ".")) || 0) * 100);
function manuOf(ex) { return ex && S && S.manu && S.manu[ex.id]; }
function manuHasE(ex) { const k = ex.id + "|" + E.length + "|" + (S.majE || ""); if (manuHasE.k === k) return manuHasE.v; manuHasE.k = k; manuHasE.v = E.some(e => e.date >= ex.debut && e.date <= ex.fin); return manuHasE.v; }
function manuOn(ex) { const M = manuOf(ex); if (!M || M.off) return false; const has = MANU_F.some(([, L]) => L.some(([k]) => manuN(M[k]))); if (!has) return false; return M.force || !manuHasE(ex); }
/* balance simplifiée équivalente aux chiffres saisis, au prorata de la période demandée */
function manuMap(ex, from, to) { const M = manuOf(ex); const g = k => manuN(M[k]); const days = (a, b) => Math.max(0, (new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5 + 1);
  const a = from > ex.debut ? from : ex.debut, b = to < ex.fin ? to : ex.fin; if (a > b) return {}; const tot = days(ex.debut, ex.fin) || 365; const f = days(a, b) / tot;
  let ca = g("ca") * f; const mo = (M.mois || []).map(manuN); if (mo.some(Boolean)) { ca = 0; let y = +ex.debut.slice(0, 4), m = +ex.debut.slice(5, 7); for (let i = 0; i < 24; i++) { const z = n => String(n).padStart(2, "0"); const d1 = y + "-" + z(m) + "-01", d2 = y + "-" + z(m) + "-" + z(new Date(y, m, 0).getDate()); if (d1 > ex.fin) break; const lo = d1 > a ? d1 : a, hi = d2 < b ? d2 : b; if (lo <= hi) ca += (mo[m - 1] || 0) * days(lo, hi) / days(d1, d2); m++; if (m > 12) { m = 1; y++; } } }
  const r = v => Math.round(v); const P = { "706000": -r(ca), "601000": r(g("achats") * f), "622600": r(g("ext") * f), "635000": r(g("imp") * f), "641000": r(g("pers") * f * 0.7), "645000": r(g("pers") * f * 0.3), "740000": -r(g("sub") * f), "681100": r(g("dot") * f), "695000": r(g("is") * f) };
  const fi = g("fin") * f, xc = g("exc") * f; if (fi >= 0) P["768000"] = -r(fi); else P["661100"] = r(-fi); if (xc >= 0) P["778000"] = -r(xc); else P["678000"] = r(-xc);
  if (to >= ex.fin) Object.assign(P, { "218000": g("immo"), "370000": g("stocks"), "411000": g("cli"), "467100": g("autC"), "512000": g("dispo"), "101000": -g("capital"), "106000": -g("cpx"), "164000": -g("df"), "401000": -g("fou"), "437000": -g("fisc"), "455000": -g("autD"), "519000": -g("conc") });
  Object.keys(P).forEach(k => { if (!P[k]) delete P[k]; }); return P; }
const _soldeMapManu = soldeMap;
soldeMap = function (from, to) { try { if (S && S.manu && to) { const ex = S.exercices.find(x => to >= x.debut && to <= x.fin) || S.exercices.find(x => from <= x.fin && to >= x.fin); if (ex && manuOn(ex)) return manuMap(ex, from || ex.debut, to); } } catch (e) { } return _soldeMapManu.apply(this, arguments); };
/* ---------- fenêtre de saisie ---------- */
Object.assign(F2ACT, {
  manuOpen: () => { const ex = exCur(); const M = deep(manuOf(ex) || {}); M.mois ||= []; openModal({ type: "manu", ex: ex.id, d: M }); },
  manuSave: () => { const Mo = UI.modal; S.manu ||= {}; const d = Mo.d; if (!d.mois.some(v => String(v || "").trim())) delete d.mois; S.manu[Mo.ex] = d; if (typeof CDG_C !== "undefined") CDG_C = null; S.majE = Date.now(); Store.touch(); closeModal(); toast(manuOn(S.exercices.find(x => x.id === Mo.ex)) ? "Chiffres clés enregistrés : ils alimentent maintenant les modules de ce dossier." : "Chiffres clés enregistrés (la comptabilité de l'exercice reste prioritaire)."); render(); },
  manuDel: () => { const Mo = UI.modal; if (S.manu) delete S.manu[Mo.ex]; if (typeof CDG_C !== "undefined") CDG_C = null; S.majE = Date.now(); Store.touch(); closeModal(); toast("Chiffres clés supprimés."); render(); },
  manuSplit: () => { const d = UI.modal.d; const ca = manuN(d.ca); if (!ca) { toast("Saisissez d'abord le chiffre d'affaires annuel."); return; } d.mois = MANU_MOIS.map(() => String(Math.round(ca / 12) / 100).replace(".", ",")); render(); }
});
Object.assign(F2CHG, {
  manuF: el => { const d = UI.modal.d; if (el.dataset.m != null) { d.mois[+el.dataset.m] = el.value; } else if (el.type === "checkbox") d[el.dataset.f] = el.checked; else d[el.dataset.f] = el.value; if (el.dataset.m == null) render(); },
  manuEx: el => { const ex = S.exercices.find(x => x.id === el.value); if (!ex) return; const M = deep(manuOf(ex) || {}); M.mois ||= []; UI.modal = { type: "manu", ex: ex.id, d: M }; render(); }
});
const _rmManu = renderModal;
renderModal = function () { const Mo = UI.modal; if (!Mo || Mo.type !== "manu") return _rmManu.apply(this, arguments);
  const d = Mo.d; const ex = S.exercices.find(x => x.id === Mo.ex) || exCur(); const has = manuHasE(ex);
  const tot = k => MANU_F[1][1].filter(([f]) => k.includes(f)).reduce((a, [f]) => a + manuN(d[f]), 0); const rn = manuN(d.ca) - manuN(d.achats) - manuN(d.ext) - manuN(d.imp) - manuN(d.pers) + manuN(d.sub) - manuN(d.dot) + manuN(d.fin) + manuN(d.exc) - manuN(d.is);
  const act = tot(["immo", "stocks", "cli", "autC", "dispo"]), pas = tot(["capital", "cpx", "df", "fou", "fisc", "autD", "conc"]) + rn;
  return modalFrame("Chiffres clés hors comptabilité", `<p class="small muted" style="margin-top:0">Pour un client sans comptabilité dans le logiciel (ou en attendant la saisie) : ces montants alimentent le contrôle de gestion, le conseil, le bilan imagé, la gestion d'entreprise et le patrimoine. ${has ? "<b>Cet exercice contient des écritures : la comptabilité reste prioritaire</b>, sauf si vous forcez l'utilisation des chiffres saisis." : "Dès que des écritures sont saisies sur l'exercice, la comptabilité reprend la main automatiquement."}</p>
    <div class="row" style="gap:10px;margin-bottom:10px"><label class="f" style="min-width:220px">Exercice<select class="in" data-ch="manuEx">${S.exercices.map(x => `<option value="${esc(x.id)}" ${x.id === ex.id ? "selected" : ""}>${esc(x.id)} · ${frDate(x.debut)} au ${frDate(x.fin)}</option>`).join("")}</select></label>${has ? `<label class="chk"><input type="checkbox" data-ch="manuF" data-f="force" ${d.force ? "checked" : ""}> Utiliser ces chiffres plutôt que la comptabilité</label>` : ""}</div>
    ${MANU_F.map(([g, L]) => `<h3 style="margin:14px 0 6px">${g}</h3><div class="grid g3">${L.map(([k, l]) => `<label class="f">${l}<input class="in mono" inputmode="decimal" data-ch="manuF" data-f="${k}" value="${esc(d[k] || "")}" placeholder="0 €"></label>`).join("")}</div>`).join("")}
    <div class="fin-k" style="margin-top:12px"><div><span>Résultat net calculé</span><b class="mono ${rn < 0 ? "ko" : ""}">${eur0(rn)}</b></div><div><span>Total actif</span><b class="mono">${eur0(act)}</b></div><div><span>Total passif (avec résultat)</span><b class="mono">${eur0(pas)}</b>${act && Math.abs(act - pas) > 100 ? `<small class="ko">écart ${eur0(act - pas)}</small>` : act ? '<small class="ok">bilan équilibré</small>' : ""}</div></div>
    <details style="margin-top:10px" ${(d.mois || []).some(Boolean) ? "open" : ""}><summary><b>Chiffre d'affaires mensuel</b> <span class="small muted">(facultatif : sinon réparti au prorata)</span></summary><div class="grid g4" style="margin-top:8px">${MANU_MOIS.map((m, i) => `<label class="f">${m}<input class="in mono" data-ch="manuF" data-m="${i}" value="${esc((d.mois || [])[i] || "")}"></label>`).join("")}</div><button class="btn sm" style="margin-top:8px" data-act="manuSplit">Répartir le CA annuel en 12 mois</button></details>`,
    `${manuOf(ex) ? '<button class="btn ghost danger" data-act="manuDel">Supprimer</button>' : ""}<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="manuSave">Enregistrer</button>`, true); };

/* bandeau dans les modules d'analyse quand l'exercice n'a pas de comptabilité */
const MANU_VIEWS = /^(cdg|gem(Board|Obj)|pat(Bil|Fisc)|fin(IA|Ana|Eval)|cns(Hub|Rem|Fisc|Prix)|bud|budget|audEsg|strat)/;
const _marManu = modAfterRender;
modAfterRender = function () { _marManu.apply(this, arguments); try { if (!S || !MANU_VIEWS.test(UI.view)) return; const ex = exCur(); if (manuHasE(ex) && !(manuOf(ex) || {}).force) return; const main = $(".main-in"); if (!main || main.querySelector(".manu-ban")) return; const on = manuOn(ex);
  const d = document.createElement("div"); d.className = "mx-al " + (on ? "ok" : "warn") + " manu-ban"; d.innerHTML = on ? `Module alimenté par les <b>chiffres clés saisis hors comptabilité</b> (exercice ${esc(ex.id)}). <button class="btn sm ghost" data-act="manuOpen">Modifier les chiffres</button>` : `Ce dossier n'a pas de comptabilité sur l'exercice ${esc(ex.id)} : le module fonctionne seul. <button class="btn sm" data-act="manuOpen">Saisir les chiffres clés</button> pour l'alimenter (CA, charges, bilan).`;
  const pg = main.querySelector(".pg-h"); if (pg) pg.after(d); else main.prepend(d); } catch (e) { } };

/* offres : vendre un module seul */
Object.assign(F2ACT, { aboSoloGo: () => { } });
Object.assign(F2CHG, { aboSolo: el => { const d = UI.modal && UI.modal.d; if (!d || !el.value) return; const k = el.value; d.modules = [k]; const M = ABO_MODS.find(m => m.k === k); toast("Offre limitée au module « " + (M ? M.lib : k) + " » : il fonctionne sans la comptabilité (chiffres clés saisis) et se relie à elle si vous l'ajoutez."); render(); } });
const _rmSolo = renderModal;
renderModal = function () { const h = _rmSolo.apply(this, arguments); const Mo = UI.modal; if (!Mo || Mo.type !== "aboMods" || typeof h !== "string") return h;
  return h.replace('<span style="flex:1"></span>', `<select class="in" style="width:auto;height:30px;font-size:13px" data-ch="aboSolo" title="Vendre un seul module, indépendamment de la comptabilité"><option value="">Module seul…</option>${ABO_MODS.map(m => `<option value="${esc(m.k)}">${esc(m.lib)}</option>`).join("")}</select><span style="flex:1"></span>`); };
/* contrôle de gestion : sans écriture, le cumul porte sur les mois écoulés de l'exercice */
if (typeof cdgData === "function") { const _cdM = cdgData; cdgData = function () { const C = _cdM.apply(this, arguments); try { if (C && !C._manu && manuOn(C.ex)) { const t = todayISO(); let last = C.M.findIndex(m => m.a <= t && m.b >= t); if (last < 0) last = t > C.ex.fin ? C.M.length - 1 : 0; C.last = last; C.ytd = C.cum(C.M, last); C.ytd1 = C.P.length ? C.cum(C.P, Math.min(last, C.P.length - 1)) : null; C._manu = 1; } } catch (e) { } return C; }; }
