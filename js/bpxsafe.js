/* ============================================================================
   Business plan : protection du travail et comparaison des versions
   - version automatique « Avant mise à jour des calculs » dès que le moteur de calcul change
     (une mise à jour du logiciel ne fait jamais perdre l'état précédent)
   - version automatique avant chaque action groupée (apport ajouté, version banque, dédoublonnage du CA…)
   - version automatique quand on quitte la page si le projet a changé depuis la dernière version
   - « Comparer » sur chaque version : liste précise des montants et textes qui diffèrent de l'état actuel,
     puis « Restaurer cette version » (l'état actuel est d'abord gardé)
   - l'affichage d'un projet ne modifie jamais ses données
   ========================================================================== */
(function () {
  const engSig = () => { const s = [bpxCalc, bpxMonthly, bpxBlocks, bpxGen].map(f => String(f)).join("|"); let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ":" + h; };
  const SIG = engSig(); const done = new Set();
  const snapAll = lib => { try { (bpxSt().pvs || []).forEach(p => pjSnap("bpx", p, lib, false)); } catch (e) { console.warn("bpx version", e); } };
  const snapCur = lib => { try { const p = bpxCur(); if (p) pjSnap("bpx", p, lib, false); } catch (e) { } };
  /* moteur de calcul mis à jour : on garde l'état de chaque projet avant toute action */
  const _mar = modAfterRender; modAfterRender = function () { _mar.apply(this, arguments); try { if (UI.view !== "finPrev" || !S || !S.id || done.has(S.id)) return; done.add(S.id); const k = "sc:bpxEng:" + S.id; let prev = null; try { prev = localStorage.getItem(k); } catch (e) { }
      if (prev && prev !== SIG && (bpxSt().pvs || []).length) { snapAll("Avant mise à jour des calculs du " + new Date().toLocaleDateString("fr-FR")); (S.bpxEng ||= []).unshift({ at: new Date().toISOString() }); toast("Mise à jour des calculs : l'état de vos projets avant la mise à jour est gardé dans l'historique des versions."); }
      try { localStorage.setItem(k, SIG); } catch (e) { } } catch (e) { } };
  /* avant chaque action groupée */
  [["bpaApply", "Avant ajout de l'apport estimé"], ["bpaRemove", "Avant retrait de l'apport estimé"], ["bpcBank", "Avant « version banque »"], ["bpdKeep", "Avant dédoublonnage du chiffre d'affaires"], ["bpeAll", "Avant cocher / décocher toutes les parties"], ["bpxRegen", "Avant retour à la rédaction automatique"]].forEach(([a, lib]) => {
    [ACT, typeof F2ACT !== "undefined" ? F2ACT : null].forEach(O => { if (O && typeof O[a] === "function" && !O[a]._safe) { const f = O[a]; const g = function () { snapCur(lib); return f.apply(this, arguments); }; g._safe = 1; O[a] = g; } }); });
  /* en quittant la page : version si le projet a changé depuis la dernière */
  const onLeave = () => { try { if (!S || !S.id) return; (bpxSt().pvs || []).forEach(p => { const L = pjVers("bpx", p.id); if (!L.length || L[0].sig !== pjSig(p)) pjSnap("bpx", p, "Version automatique (fermeture)", true); }); } catch (e) { } };
  addEventListener("pagehide", onLeave); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") onLeave(); });
  /* comparaison d'une version avec l'état actuel */
  const LAB = { id_: "Projet", h: "Hypothèses", ca: "Chiffre d'affaires", chg: "Charges", inv: "Investissements", emp: "Emprunts", app: "Apports", pers: "Personnel", tax: "Impôts et taxes", loc: "Locations", txt: "Textes rédigés", lay: "Mise en page", sec: "Parties exclues", order: "Ordre des parties", y0: "1re année", n: "Durée", m0: "Mois de démarrage", nom: "Nom" };
  const EUR = /^(v|montant|prix|treso0|stock0|apLibre|b|c|vb|vo|mt|cout|loyer|sal|brut)$/;
  const flat = (o, p, out, lab) => { if (o == null || typeof o !== "object") { out.push([p, o, lab]); return out; } if (Array.isArray(o)) { o.forEach((v, i) => flat(v, p + "[" + i + "]", out, lab + (v && typeof v === "object" && (v.lib || v.nom) ? " › " + (v.lib || v.nom) : " › " + (/\.v$|\]\.v$/.test(p) || /(^|\.)v$/.test(p) ? "année " + (i + 1) : "n°" + (i + 1))))); return out; } Object.keys(o).forEach(k => { if (k === "maj" || k === "cree") return; flat(o[k], p ? p + "." + k : k, out, lab ? lab + (o.lib && k !== "lib" ? "" : "") + " · " + k : (LAB[k] || k)); }); return out; };
  const fmt = (k, v) => v == null || v === "" ? "—" : typeof v === "number" && EUR.test(k) ? eur0(v) : typeof v === "string" && v.length > 80 ? esc(v.slice(0, 80)) + "…" : esc(String(v));
  function bpxDiff(a, b) { const A = new Map(flat(a, "", []).map(x => [x[0], x])), B = new Map(flat(b, "", []).map(x => [x[0], x])); const keys = new Set([...A.keys(), ...B.keys()]); const D = [];
    keys.forEach(k => { const x = A.get(k), y = B.get(k); const va = x ? x[1] : undefined, vb = y ? y[1] : undefined; if (JSON.stringify(va) === JSON.stringify(vb)) return; const last = /\.v\[\d+\]$/.test(k) ? "v" : k.split(/[.\[]/).pop().replace("]", ""); D.push({ lab: (y || x)[2].replace(/ · v › /, " › "), k: last, va, vb }); }); return D; }
  ACT.pjxCmp = el => { const v = pjFind("bpx", el.dataset.v); const p = bpxCur(); if (!v || !p) return; const cur = p.id === v.pid ? p : (bpxSt().pvs || []).find(x => x.id === v.pid) || p; openModal({ type: "pjxCmp", v, cur }); };
  const _rm = renderModal; renderModal = function () { const M = UI.modal; if (!M || M.type !== "pjxCmp") return _rm.apply(this, arguments);
    const D = bpxDiff(M.v.data, M.cur); const grp = {}; D.forEach(d => { const g = d.lab.split(" › ")[0].split(" · ")[0]; (grp[g] ||= []).push(d); }); const kf = x => { try { const C = bpxCalc(x); return [["CA 1re année", C.CA[0]], ["Résultat 1re année", C.rn[0]], ["Trésorerie fin", C.treso[C.n - 1]], ["Investissements", C.totInv]]; } catch (e) { return []; } }; const K1 = kf(M.v.data), K2 = kf(M.cur);
    const body = `<p class="small muted" style="margin:0 0 10px">Version du <b>${new Date(M.v.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</b>${M.v.lib ? " · " + esc(M.v.lib) : ""}, comparée à l'état actuel de « ${esc(M.cur.nom)} ». Les résultats sont recalculés avec les calculs actuels.</p>
      <table class="t" style="margin-bottom:12px"><thead><tr><th>Résultat</th><th class="r">Version</th><th class="r">Actuel</th><th class="r">Écart</th></tr></thead><tbody>${K1.map(([l, a], i) => { const b = (K2[i] || [])[1] || 0; return `<tr><td>${l}</td><td class="r mono">${eur0(a)}</td><td class="r mono">${eur0(b)}</td><td class="r mono ${a !== b ? "neg" : ""}">${a === b ? "=" : eur0(b - a)}</td></tr>`; }).join("")}</tbody></table>
      ${D.length ? Object.entries(grp).map(([g, L]) => `<h3 class="fin-h3">${esc(g)} (${L.length} différence${L.length > 1 ? "s" : ""})</h3><table class="t"><thead><tr><th>Élément</th><th class="r">Dans la version</th><th class="r">Actuellement</th></tr></thead><tbody>${L.slice(0, 60).map(d => `<tr><td>${esc(d.lab.replace(/^[^›·]*[›·]\s*/, "") || d.lab)}</td><td class="r mono">${fmt(d.k, d.va)}</td><td class="r mono">${fmt(d.k, d.vb)}</td></tr>`).join("")}</tbody></table>`).join("") : `<div class="banner">Aucune différence de saisie : les données sont identiques. Si les résultats affichés ont changé, cela vient de la mise à jour des calculs, pas de vos montants.</div>`}`;
    return modalFrame("Comparer avec l'état actuel", body, `<button class="btn" data-act="closeModal">Fermer</button><button class="btn pri" data-act="pjxRestore" data-p="bpx" data-v="${M.v.id}">Restaurer cette version</button>`, true); };
  /* bouton « Comparer » dans l'historique des versions */
  const _v = VIEWS.finPrev; VIEWS.finPrev = function () { let h = _v.apply(this, arguments); try { h = h.replace(/(<button[^>]*data-act="pjxRestore" data-p="bpx" data-v="([^"]+)"[^>]*>[\s\S]*?<\/button>)/g, (m, b, id) => `<button class="btn sm ghost" data-act="pjxCmp" data-v="${id}" title="Voir ce qui diffère de l'état actuel">Comparer</button>` + b); } catch (e) { } return h; };
})();
