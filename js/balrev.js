/* ============================================================
   Balances de révision (générale, fournisseurs, clients), modèle Inexweb :
   balance + mouvements du compte + panneau de révision (statut, notes, pièces),
   balances de situation, vues enregistrées, États flash paramétrables.
   ============================================================ */
const BR_ST = {
  "": { l: "À réviser", c: "warn", i: "!" }, encours: { l: "En cours", c: "info", i: "…" }, valide: { l: "Révisé", c: "ok", i: "✓" },
  modif: { l: "Modif. après révision", c: "mod", i: "↻" }, anomalie: { l: "Non conforme", c: "bad", i: "✕" }, so: { l: "Sans objet", c: "n", i: "–" }
};
const BR_TYPES = { gen: "Balance générale", fou: "Balance fournisseurs", cli: "Balance clients" };
const BR_CF = { mvt: "Mouvementés sur N ou N-1", mvtN: "Mouvementés sur N", solde: "Soldés non nuls en N", debit: "Solde débiteur en N", credit: "Solde créditeur en N", tous: "Tous les comptes du plan", nonrev: "Non révisés", modif: "Modifiés après révision" };
function brState() {
  const st = UI.sub.br ||= { type: "gen", cf: "mvt", c1: "", c2: "", sit: "ex", arr: "", mvt: false, j: "", f: {}, sel: "", chk: [], tab: "rev", n1: true, n2: true, mvN1: false, vue: "" };
  st.f ||= {}; st.chk ||= []; return st;
}
const brY = (d, n) => { const y = Number(d.slice(0, 4)) + n; let s = y + d.slice(4); if (s.slice(5) === "02-29") s = y + "-02-28"; return s; };
/* ---------- périodes : exercice, date d'arrêté ou situation enregistrée ---------- */
function brSituations() { return S.situations ||= []; }
function brPeriod(st, ex) {
  ex ||= exCur(); let du = ex.debut, au = ex.fin, lib = "Exercice " + frDate(ex.debut) + " - " + frDate(ex.fin), cmp = "same", cdu = "", cau = "";
  if (st.sit === "arr" && st.arr) { au = st.arr < ex.debut ? ex.debut : st.arr > ex.fin ? ex.fin : st.arr; lib = "Situation au " + frDate(au); }
  else if (st.sit && st.sit !== "ex") { const s = brSituations().find(x => x.id === st.sit); if (s) { du = s.du || ex.debut; au = s.au || ex.fin; lib = s.nom; cmp = s.cmp || "same"; cdu = s.cdu || ""; cau = s.cau || ""; } }
  const pe = prevEx(ex); let p1 = null;
  if (cmp === "custom" && cdu && cau) p1 = { du: cdu, au: cau };
  else if (cmp === "full" && pe) p1 = { du: pe.debut, au: pe.fin };
  else if (cmp !== "none" && pe) p1 = { du: du === ex.debut ? pe.debut : brY(du, -1), au: au === ex.fin ? pe.fin : (brY(au, -1) > pe.fin ? pe.fin : brY(au, -1)) };
  const pe2 = pe ? prevEx(pe) : null; const p2 = pe2 ? { du: pe2.debut, au: pe2.fin } : null;
  const months = Math.max(1, Math.round((new Date(au) - new Date(du)) / 2629800000));
  return { du, au, lib, p1, p2, months, an: !p1 && cmp !== "none" };
}
/* ---------- calcul des soldes ---------- */
function brAgg(du, au, opt = {}) {
  const m = {};
  for (const { e, l } of flat({ from: du, to: au })) {
    if (opt.j && e.journal !== opt.j && e.journal !== "AN") continue;
    const k = opt.aux ? (l.aux ? "T:" + l.aux : null) : l.compte; if (!k) continue;
    const r = m[k] ||= { d: 0, c: 0, nl: 0, n: 0, col: l.compte };
    r.d += l.debit; r.c += l.credit; r.n++; if (!l.lettre) r.nl += l.debit - l.credit;
  }
  return m;
}
function brRec(ex, k) { return ex ? (revStore(ex).comptes[k] || {}) : {}; }
function brStatus(r, solde) { if (r.st === "valide" && r.sv != null && r.sv !== solde) return "modif"; return r.st || ""; }
function brRows(st) {
  const ex = exCur(); const P = brPeriod(st, ex); const aux = st.type !== "gen";
  const N = brAgg(P.du, P.au, { aux, j: st.j });
  let N1 = {}; if (P.p1) N1 = brAgg(P.p1.du, P.p1.au, { aux });
  else if (P.an) { for (const e of E) if (e.journal === "AN" && e.date >= ex.debut && e.date <= ex.fin) for (const l of e.lignes) { const k = aux ? (l.aux ? "T:" + l.aux : null) : l.compte; if (!k) continue; const r = N1[k] ||= { d: 0, c: 0, nl: 0, n: 0 }; r.d += l.debit; r.c += l.credit; } }
  const N2 = P.p2 ? brAgg(P.p2.du, P.p2.au, { aux }) : {};
  let keys = new Set(Object.keys(N).concat(Object.keys(N1)));
  if (st.cf === "tous") { if (aux) S.tiers.forEach(t => keys.add("T:" + t.code)); else allAccounts().forEach(a => keys.add(a.num)); }
  const pe = prevEx(ex); const cfg = revCfg();
  const out = [];
  for (const k of keys) {
    let num = k, lib, col = "";
    if (aux) { const t = tiersBy(k.slice(2)); const typ = t ? t.type : ""; col = t ? t.collectif : ((N[k] || N1[k] || {}).col || ""); if (st.type === "fou" && !(typ === "F" || (!t && col.startsWith("40")) || (t && !typ && col.startsWith("40")))) continue; if (st.type === "cli" && !(typ === "C" || (!t && col.startsWith("41")) || (t && !typ && col.startsWith("41")))) continue; num = k.slice(2); lib = t ? t.nom : num; }
    else lib = accLib(k);
    const a = N[k] || { d: 0, c: 0, nl: 0, n: 0 }, b = N1[k] || { d: 0, c: 0 }, z = N2[k] || { d: 0, c: 0 };
    const sN = a.d - a.c, s1 = b.d - b.c, s2 = z.d - z.c; const r = brRec(ex, k); const rp = brRec(pe, k);
    const v = sN - s1; const pct = s1 ? Math.round(v / Math.abs(s1) * 1000) / 10 : (sN ? 100 : 0);
    out.push({ k, num, lib, col, d: a.d, c: a.c, n: a.n, nl: a.nl, sN, s1, s2, v, pct, sig: Math.abs(v) >= cfg.seuilMt && Math.abs(pct) >= cfg.seuilPct, r, st: brStatus(r, sN), note: r.note || "", noteP: rp.note || "", noteC: (S.noteComptes || {})[k] || "", dC: (S.pieceComptes || {})[k] || [], dR: r.docs || [], dRP: rp.docs || [] });
  }
  return { P, ex, rows: out.sort((x, y) => x.num.localeCompare(y.num)) };
}
function brFilter(st, rows) {
  const f = st.f; const inR = n => (!st.c1 || n >= st.c1) && (!st.c2 || n.slice(0, st.c2.length) <= st.c2);
  const num = (v, x) => { if (!v) return true; const s = String(v).replace(/\s/g, "").replace(",", "."); const m = s.match(/^([<>]=?)?(-?\d+(\.\d+)?)$/); if (!m) return eur(x).replace(/\s/g, "").includes(s.replace(".", ",")); const t = Math.round(Number(m[2]) * 100); return m[1] === ">" ? x > t : m[1] === ">=" ? x >= t : m[1] === "<" ? x < t : m[1] === "<=" ? x <= t : x === t; };
  return rows.filter(r => {
    if (st.cf === "mvt" && !(r.n || r.s1 || r.d || r.c)) return false;
    if (st.cf === "mvtN" && !r.n) return false;
    if (st.cf === "solde" && !r.sN) return false;
    if (st.cf === "debit" && !(r.sN > 0)) return false;
    if (st.cf === "credit" && !(r.sN < 0)) return false;
    if (st.cf === "nonrev" && (r.st === "valide" || r.st === "so")) return false;
    if (st.cf === "modif" && r.st !== "modif") return false;
    if (!inR(r.num)) return false;
    if (f.num) { const q = f.num.trim().toUpperCase(); if (q && !(/^\d/.test(q) ? r.num.toUpperCase().startsWith(q) : r.num.toUpperCase().startsWith(q) || (r.lib || "").toUpperCase().includes(q))) return false; }
    if (f.lib && !(r.lib + " " + r.col).toUpperCase().includes(f.lib.toUpperCase())) return false;
    if (!num(f.sN, r.sN) || !num(f.s1, r.s1) || !num(f.s2, r.s2)) return false;
    if (f.st && (f.st === "afaire" ? (r.st === "valide" || r.st === "so") : r.st !== (f.st === "_" ? "" : f.st))) return false;
    if (f.note && !(r.note).toUpperCase().includes(f.note.toUpperCase())) return false;
    if (f.pc && (f.pc === "oui") !== !!r.dC.length) return false;
    if (f.pr && (f.pr === "oui") !== !!r.dR.length) return false;
    if (f.sig && !r.sig) return false;
    return true;
  });
}
function brMark(k, ex) { ex ||= exCur(); const R = revStore(ex); const r = R.comptes[k] ||= {}; r.par = UI.userName || "Moi"; r.le = todayISO(); return r; }
function brSetSt(keys, v, rows) { const ex = exCur(); if (ex.cloture) { toast("Exercice clôturé : la révision n'est plus modifiable."); return; } keys.forEach(k => { const r = brMark(k, ex); r.st = v === "modif" ? "valide" : v; const row = rows.find(x => x.k === k); if (v === "valide" && row) r.sv = row.sN; else if (v !== "valide") delete r.sv; }); Store.touch(); }
function brResChip(lib, v, none) { return `<span class="br-rc ${none ? "na" : v >= 0 ? "ok" : "ko"}"><small>${lib}</small><b class="mono">${none ? "—" : (v >= 0 ? "Bénéfice " : "Perte ") + eur(Math.abs(v))}</b></span>`; }
function brStPill(s) { const d = BR_ST[s] || BR_ST[""]; return `<span class="br-st br-${d.c}"><i>${d.i}</i>${d.l}</span>`; }
/* ---------- vue principale ---------- */
VIEWS.balrev = () => {
  if (brState().mode === "edit") return brEditions();
  const st = brState(); const { P, ex, rows, iaCtx: IAC } = brRows(st); const list = brFilter(st, rows); const lock = !!ex.cloture;
  const sel = rows.find(r => r.k === st.sel) || null;
  const aux0 = st.type !== "gen"; const tot = list.reduce((a, r) => { a.d += r.d; a.c += r.c; a.sN += r.sN; a.s1 += r.s1; a.s2 += r.s2; return a; }, { d: 0, c: 0, sN: 0, s1: 0, s2: 0 });
  /* cumuls façon Inex : débit, crédit, soldes débiteurs et créditeurs, bilan / gestion et résultat */
  const cum = { sd: 0, sc: 0, bd: 0, bc: 0, gd: 0, gc: 0 }; list.forEach(r => { if (r.sN > 0) cum.sd += r.sN; else cum.sc -= r.sN; const g = !aux0 && /^[67]/.test(r.num); if (g) { cum.gd += r.d; cum.gc += r.c; } else { cum.bd += r.d; cum.bc += r.c; } });
  const resN = aux0 ? 0 : -rows.filter(r => /^[67]/.test(r.num)).reduce((a, r) => a + r.sN, 0), resN1 = aux0 ? 0 : -rows.filter(r => /^[67]/.test(r.num)).reduce((a, r) => a + r.s1, 0);
  const done = rows.filter(r => r.st === "valide" || r.st === "so").length;
  const vues = (S.balVues || []);
  const sits = brSituations();
  const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${k === v ? "selected" : ""}>${l}</option>`).join("");
  const fIn = (k, ph, w) => `<input class="in br-fi" id="brf-${k}" data-brf="${k}" value="${esc(st.f[k] || "")}" placeholder="${ph || ""}" style="${w ? "width:" + w : ""}" autocomplete="off">`;
  const fSel = (k, o) => `<select class="in br-fi" data-ch="brF" data-f="${k}"><option value="">Tous</option>${opt(o, st.f[k] || "")}</select>`;
  const pj = (D, k, kind) => D.length ? `<a href="#" class="br-pj" data-act="brDocs" data-k="${esc(k)}" data-kind="${kind}" title="${D.length} pièce(s)">🖼${D.length > 1 ? "<small>" + D.length + "</small>" : ""}</a>` : "";
  const mv = st.mvt; const aux = st.type !== "gen";
  const body = list.map((r, i) => `<tr class="br-r ${r.k === st.sel ? "on" : ""} ${r.sig ? "br-sig" : ""}" data-act="brSel" data-k="${esc(r.k)}">
    <td class="c" data-stop="1"><input type="checkbox" data-act="brChk" data-k="${esc(r.k)}" ${st.chk.includes(r.k) ? "checked" : ""}></td><td class="c muted small">${i + 1}</td>
    <td class="mono">${esc(r.num)}</td><td class="br-lib" title="${esc(r.lib)}">${esc(r.lib)}${aux ? `<small>${esc(r.col)}</small>` : ""}</td>
    ${mv ? `<td class="r mono">${r.d ? eur(r.d) : ""}</td><td class="r mono">${r.c ? eur(r.c) : ""}</td>` : ""}
    <td class="r mono">${r.sN ? eur(r.sN) : ""}</td>${st.n1 ? `<td class="r mono br-s1" data-act="brN1" data-k="${esc(r.k)}" title="Voir le détail des mouvements N-1 de ce compte">${r.s1 ? eur(r.s1) : ""}</td><td class="r mono small ${r.sig ? "bal-ko" : ""}">${r.v ? eur(r.v) : ""}</td>` : ""}
    ${aux ? `<td class="r mono">${r.nl ? eur(r.nl) : ""}</td>` : ""}
    <td data-act="brStMenu" data-k="${esc(r.k)}" title="Cliquer pour changer le statut">${brStPill(r.st)}</td><td class="ia-td" data-act="brSide" data-k="${esc(r.k)}" data-v="ia">${typeof iaPill === "function" ? iaPill(r.ia) : ""}</td>
    <td class="br-note" data-act="brSide" data-k="${esc(r.k)}" data-v="rev" title="${esc(r.note || "Ajouter une note de révision")}">${esc(r.note.split("\n")[0])}</td>
    <td class="c">${pj(r.dC, r.k, "C")}</td><td class="c">${pj(r.dR, r.k, "R")}</td><td class="c">${pj(r.dRP, r.k, "RP")}</td>
    ${st.n2 ? `<td class="r mono small">${r.s2 ? eur(r.s2) : ""}</td>` : ""}</tr>`).join("");
  const cols = 10 + (mv ? 2 : 0) + (st.n1 ? 2 : 0) + (aux ? 1 : 0) + (st.n2 ? 1 : 0) + 3;
  /* mouvements du compte sélectionné */
  let mvH = `<div class="br-empty">Cliquez sur un compte pour afficher ses mouvements et le lettrer.</div>`, mvBar = "";
  if (sel) {
    const RG = brMvRange(st, P); const from = RG.from;
    const L = flat({ from, to: RG.to }).filter(({ e, l }) => (aux ? l.aux === sel.num : l.compte === sel.k) && (!st.j || e.journal === st.j || e.journal === "AN")).sort((a, b) => a.e.date.localeCompare(b.e.date));
    const lf = st.lf || "all"; const Lv = L.filter(x => (lf === "all" || (lf === "open" ? !x.l.lettre : !!x.l.lettre)) && brMvMatch(st.mf || {}, x)); const ls = new Set(st.lsel || []);
    let D = 0, C = 0, sd = 0, sc = 0, run = 0, nLet = 0, nOpen = 0; L.forEach(x => { if (ls.has(x.l.id)) { sd += x.l.debit; sc += x.l.credit; if (x.l.lettre) nLet++; else nOpen++; } });
    const ecart = sd - sc; const seuil = Math.round((typeof pcReg === "function" ? pcReg().letEcart : Number(MC("compta", "letEcart") ?? 5)) * 100); const today = todayISO();
    const sugg = brSugg(sel, L);
    mvH = `${sugg.length ? `<div class="lt-sugg"><b>💡 ${sugg.length} lettrage(s) proposé(s)</b>${sugg.slice(0, 4).map((s, i) => `<span class="lt-sg"><span>${esc(s.why)}</span><button class="btn sm" data-act="brLSugSel" data-i="${i}">Voir</button><button class="btn sm pri" data-act="brLSugOk" data-i="${i}">Lettrer</button></span>`).join("")}<button class="btn sm pri" data-act="brLAuto">⚡ Tout lettrer</button></div>` : ""}
    <table class="t br-mv"><thead><tr><th style="width:26px"><input type="checkbox" data-act="brLAll" title="Tout sélectionner (lignes non lettrées)"></th><th>Jal</th><th>Date</th><th>Pièce</th><th>Libellé</th><th>Éch.</th><th class="r">Débit</th><th class="r">Crédit</th><th class="c">Let.</th><th class="r">Solde</th><th></th></tr>${brMvFilters(st, L)}</thead><tbody>${Lv.map(({ e, l }) => { D += l.debit; C += l.credit; run += l.debit - l.credit; const nd = (e.docs || []).length + (e.pj ? 1 : 0); const ech = e.ech || ""; const late = !l.lettre && ech && ech < today && (l.aux ? (l.compte.startsWith("41") ? l.debit : l.credit) : 0);
      return `<tr class="br-lr ${e.date < P.du ? "br-n1" : ""} ${ls.has(l.id) ? "on" : ""} ${l.lettre ? "lt-done" : ""}" data-act="brLClick" data-e="${e.id}" data-id="${l.id}" title="Clic : sélectionner pour lettrer / délettrer · Double-clic : ouvrir l'écriture et la facture"><td class="c br-chk"><input type="checkbox" ${ls.has(l.id) ? "checked" : ""} tabindex="-1"></td><td class="mono">${esc(e.journal)}</td><td class="mono">${frDate(e.date)}</td><td class="mono small">${esc(e.piece || "")}</td><td class="br-lib">${esc(l.lib || e.libelle || "")}</td><td class="mono small ${late ? "lt-late" : ""}">${ech && (l.aux || /^4/.test(l.compte)) ? frDate(ech) : ""}</td><td class="r mono">${l.debit ? eur(l.debit) : ""}</td><td class="r mono">${l.credit ? eur(l.credit) : ""}</td><td class="c">${l.lettre ? `<a href="#" class="lt-code" data-act="brLDel" data-c="${esc(l.lettre)}" title="Délettrer ${esc(l.lettre)}">${esc(l.lettre)}</a>` : l.lettreP ? `<span class="lt-codep" title="Lettrage partiel">${esc(l.lettreP)}</span>` : ""}</td><td class="r mono small">${eur(run)}</td><td><a href="#" class="br-open" data-act="brOpenE" data-e="${e.id}" data-l="${l.id}" title="Voir dans le journal de saisie">↗</a>${nd ? "📎" : ""}</td></tr>`; }).join("") || `<tr><td colspan="11" class="empty">${lf === "open" ? "Tout est lettré ✓" : "Aucune ligne correspondante"}</td></tr>`}</tbody>
      <tfoot><tr class="br-cum"><td></td><td colspan="5"><b>Cumul des mouvements</b> <span class="small muted">· ${Lv.length} ligne(s)${Lv.length !== L.length ? " affichée(s) sur " + L.length : ""}</span></td><td class="r mono"><b>${eur(D)}</b></td><td class="r mono"><b>${eur(C)}</b></td><td></td><td></td><td></td></tr>
      <tr class="br-sold"><td></td><td colspan="5"><b>Solde ${D - C > 0 ? "débiteur" : D - C < 0 ? "créditeur" : "nul"}</b>${Lv.length !== L.length ? ' <span class="small muted">(lignes affichées)</span>' : ""}</td><td class="r mono">${D - C > 0 ? `<b>${eur(D - C)}</b>` : ""}</td><td class="r mono">${D - C < 0 ? `<b>${eur(C - D)}</b>` : ""}</td><td></td><td class="r mono"><b>${eur(D - C)}</b></td><td></td></tr></tfoot></table>`;
    mvBar = `<div class="lt-bar ${ls.size ? "on" : ""}"><span class="lt-info"><span class="lt-n"><b>${ls.size}</b> ligne(s) sélectionnée(s)</span><span><small>Débit</small> <b class="mono">${eur(sd)}</b></span><span><small>Crédit</small> <b class="mono">${eur(sc)}</b></span><span><small>Écart</small> <b class="mono ${ecart ? "lt-ko" : "lt-okc"}">${eur(ecart)}</b></span></span><span class="row lt-acts" style="gap:4px">${ls.size ? `<button class="btn sm ghost lt-clr" data-act="brLClear" title="Vider la sélection">✕ Désélectionner</button>` : ""}<button class="btn sm" data-act="brLPart" ${ls.size > 1 && ecart && sd && sc && !nLet ? "" : "disabled"} title="Lettrage partiel (lettre minuscule, les lignes restent ouvertes)">Partiel</button>${ecart && Math.abs(ecart) <= seuil && sd && sc && !nLet ? `<button class="btn sm" data-act="brLEcart" title="OD d'écart de règlement puis lettrage">Avec écart</button>` : ""}<button class="btn sm" data-act="brReaff" ${ls.size ? "" : "disabled"} title="Réaffecter les lignes sélectionnées dans un autre compte">↪ Réaffecter</button><button class="btn sm danger" data-act="brLUn" ${nLet ? "" : "disabled"} title="Supprime le lettrage des lignes sélectionnées">✕ Délettrer${nLet ? " (" + nLet + ")" : ""}</button><button class="btn sm pri" data-act="brLGo" ${ls.size > 1 && !ecart && !nLet ? "" : "disabled"} title="${nLet ? "Désélectionnez les lignes déjà lettrées" : "Lettrer les lignes sélectionnées"}">✓ Lettrer</button></span></div>`;
  }
  /* panneau de révision */
  let side = `<div class="br-empty">Sélectionnez un compte.</div>`;
  if (sel) {
    const tabs = [["ia", "🤖 Analyse"], ["rev", "Révision"], ["pcs", "Pièces"], ["cpt", "Compte"]];
    const docList = (D, kind) => D.length ? D.map((d, i) => `<div class="br-doc"><span>📄</span><a href="#" data-act="brDocs" data-k="${esc(sel.k)}" data-kind="${kind}" data-i="${i}">${esc(d.nom)}</a>${kind === "RP" ? "" : `<button class="btn sm ghost danger" data-act="brDocDel" data-k="${esc(sel.k)}" data-kind="${kind}" data-i="${i}" title="Retirer">✕</button>`}</div>`).join("") : `<div class="small muted">Aucune pièce.</div>`;
    let tb = "";
    if (st.tab === "ia") tb = typeof iaPanel === "function" ? iaPanel(sel) : "";
    if (st.tab === "rev") tb = `<div class="br-stb">${Object.entries(BR_ST).filter(([k]) => k !== "modif").map(([k, d]) => `<button class="br-st br-${d.c} ${sel.st === k ? "on" : ""}" data-act="brSt" data-v="${k}" ${lock ? "disabled" : ""}><i>${d.i}</i>${d.l}</button>`).join("")}</div>
      ${sel.st === "modif" ? `<div class="banner" style="margin:8px 0">Solde modifié depuis la révision du ${frDate(sel.r.le)} (${eur(sel.r.sv)} → ${eur(sel.sN)}). <a class="lnk" data-act="brSt" data-v="valide">Confirmer la révision</a></div>` : sel.r.par ? `<div class="small muted">${esc(BR_ST[sel.st].l)} par ${esc(sel.r.par)} le ${frDate(sel.r.le)}</div>` : ""}
      <label class="f">Note de révision N<textarea class="in" rows="4" id="brNote" data-ch="brNote" data-k="${esc(sel.k)}" ${lock ? "disabled" : ""} placeholder="Travaux effectués, justificatif, conclusion…">${esc(sel.note)}</textarea></label>
      <label class="f">Note de révision N-1${sel.noteP && !lock && !sel.note ? ` <a class="lnk small" data-act="brCopyP">Reprendre en N</a>` : ""}<div class="br-np">${sel.noteP ? esc(sel.noteP) : '<span class="muted">—</span>'}</div></label>
      <label class="f">Note permanente du compte<textarea class="in" rows="2" data-ch="brNoteC" data-k="${esc(sel.k)}" placeholder="Reportée d'un exercice à l'autre">${esc(sel.noteC)}</textarea></label>
      ${!lock && !aux ? `<button class="btn sm" data-act="rvRegul" data-c="${esc(sel.k)}">Passer une écriture de régularisation (OD)</button>` : ""}`;
    if (st.tab === "pcs") tb = `<label class="br-drop" id="brDrop"><input type="file" multiple hidden data-ch="brUp" data-kind="R">⇪ Glissez-déposez vos pièces de révision ici<small>ou cliquez pour choisir (PDF, image, Excel…)</small></label>
      <h4>Pièces de révision N</h4>${docList(sel.dR, "R")}
      <h4>Pièces du compte <label class="lnk small" style="cursor:pointer">+ ajouter<input type="file" multiple hidden data-ch="brUp" data-kind="C"></label></h4><div class="small muted" style="margin-bottom:4px">Contrats, tableaux d'emprunt… conservés d'un exercice à l'autre</div>${docList(sel.dC, "C")}
      <h4>Pièces de révision N-1</h4>${docList(sel.dRP, "RP")}`;
    if (st.tab === "cpt") tb = `<div class="kv"><span>Compte</span><b class="mono">${esc(sel.num)}</b><span>Intitulé</span><b>${esc(sel.lib)}</b>${aux ? `<span>Collectif</span><b class="mono">${esc(sel.col)}</b><span>Non lettré</span><b class="mono">${eur(sel.nl)}</b>` : ""}<span>Débit N</span><b class="mono">${eur(sel.d)}</b><span>Crédit N</span><b class="mono">${eur(sel.c)}</b><span>Solde N</span><b class="mono">${eur(sel.sN)}</b><span>Solde N-1</span><b class="mono">${eur(sel.s1)}</b><span>Variation</span><b class="mono">${eur(sel.v)} (${String(sel.pct).replace(".", ",")} %)</b><span>Solde N-2</span><b class="mono">${eur(sel.s2)}</b></div>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-act="brGL">Grand livre</button>${aux ? `<button class="btn sm" data-act="brLettrage">Lettrage</button>` : ""}<button class="btn sm" data-act="brNewE">Saisir une écriture</button></div>`;
    side = `<div class="br-sh"><div class="row" style="justify-content:space-between"><span><b class="mono">${esc(sel.num)}</b> ${esc(sel.lib)}</span><button class="btn sm ghost" data-act="brSideX" title="Fermer le panneau de révision">✕</button></div><div>${brStPill(sel.st)}</div></div><div class="br-tabs">${tabs.map(([k, l]) => `<button class="${st.tab === k ? "on" : ""}" data-act="brTab" data-v="${k}">${l}${k === "pcs" && (sel.dR.length + sel.dC.length) ? ` (${sel.dR.length + sel.dC.length})` : ""}</button>`).join("")}</div><div class="br-tb">${tb}</div>`;
  }
  const head = `<tr><th class="c"><input type="checkbox" data-act="brChkAll" ${list.length && list.every(r => st.chk.includes(r.k)) ? "checked" : ""}></th><th></th><th style="width:96px">${aux ? "Code" : "Compte"}</th><th>${aux ? "Nom du tiers" : "Intitulé du compte"}</th>${mv ? `<th class="r">Débit N</th><th class="r">Crédit N</th>` : ""}<th class="r">Solde N</th>${st.n1 ? `<th class="r">Solde N-1</th><th class="r">Variation</th>` : ""}${aux ? `<th class="r">Non lettré</th>` : ""}<th>Statut de révision</th><th title="Contrôle automatique du compte : anomalies et éléments manquants">🤖 Analyse IA</th><th>Note de révision</th><th title="Pièces du compte">Pièce du cpte</th><th title="Pièces de révision N">Pièce de rév.</th><th title="Pièces de révision N-1">Pièce rév. N-1</th>${st.n2 ? `<th class="r">Solde N-2</th>` : ""}</tr>
    <tr class="br-frow"><th></th><th></th><th>${fIn("num", "ex. 4, 41, 512", "100%")}</th><th>${fIn("lib", "Filtrer…", "100%")}</th>${mv ? "<th></th><th></th>" : ""}<th>${fIn("sN", "> 1000", "100%")}</th>${st.n1 ? `<th>${fIn("s1", "", "100%")}</th><th><label class="chk small" title="Variations significatives"><input type="checkbox" data-ch="brF" data-f="sig" ${st.f.sig ? "checked" : ""}>Sig.</label></th>` : ""}${aux ? "<th></th>" : ""}<th><select class="in br-fi" data-ch="brF" data-f="st"><option value="">Tous</option><option value="afaire" ${st.f.st === "afaire" ? "selected" : ""}>Restant à réviser</option>${Object.entries(BR_ST).map(([k, d]) => `<option value="${k || "_"}" ${st.f.st === (k || "_") ? "selected" : ""}>${d.l}</option>`).join("")}</select></th><th><select class="in br-fi" data-ch="brF" data-f="ia"><option value="">Tous</option><option value="pb" ${st.f.ia === "pb" ? "selected" : ""}>Tous les points</option><option value="bad" ${st.f.ia === "bad" ? "selected" : ""}>Anomalies</option><option value="warn" ${st.f.ia === "warn" ? "selected" : ""}>À vérifier</option><option value="miss" ${st.f.ia === "miss" ? "selected" : ""}>Il manque</option><option value="ok" ${st.f.ia === "ok" ? "selected" : ""}>Conformes</option></select></th><th>${fIn("note", "", "100%")}</th><th>${fSel("pc", { oui: "Avec", non: "Sans" })}</th><th>${fSel("pr", { oui: "Avec", non: "Sans" })}</th><th></th>${st.n2 ? `<th>${fIn("s2", "", "100%")}</th>` : ""}</tr>`;
  return `${typeof admPublishBar === "function" && isAdmin() ? admPublishBar() : ""}<div class="br-wrap">
  <div class="br-title">${brModeSw(st)}<b>${BR_TYPES[st.type]}</b> : ${esc(S.siren || "")} ${esc(S.nom.toUpperCase())} ( ${frDate(P.du)} - ${frDate(P.au)} )${P.p1 ? ` · comparée au ${frDate(P.p1.du)} - ${frDate(P.p1.au)}` : ""}<span class="br-prog">${done}/${rows.length} révisé(s) · ${rows.length ? Math.round(done / rows.length * 100) : 0} %</span></div>
  <div class="br-bar">
    <label class="br-ctl"><span>Type</span><select class="in" data-ch="brSet" data-f="type">${opt(BR_TYPES, st.type)}</select></label>
    <label class="br-ctl"><span>Comptes</span><select class="in" data-ch="brSet" data-f="cf">${opt(BR_CF, st.cf)}</select></label>
    <label class="br-ctl"><span>Compte du</span><input class="in mono" style="width:86px" data-ch="brSet" data-f="c1" value="${esc(st.c1)}" placeholder="${aux ? "code" : "401"}"></label><label class="br-ctl"><span>au</span><input class="in mono" style="width:86px" data-ch="brSet" data-f="c2" value="${esc(st.c2)}" placeholder="${aux ? "code" : "409"}"></label>
    <label class="br-ctl"><span>Situation</span><select class="in" data-ch="brSit"><option value="ex" ${st.sit === "ex" ? "selected" : ""}>Exercice complet</option><option value="arr" ${st.sit === "arr" ? "selected" : ""}>À une date d'arrêté</option>${sits.length ? `<optgroup label="Mes situations">${sits.map(s => `<option value="${s.id}" ${st.sit === s.id ? "selected" : ""}>${esc(s.nom)}</option>`).join("")}</optgroup>` : ""}<option value="__new">+ Créer une situation…</option></select></label>
    ${st.sit === "arr" ? `<label class="br-ctl"><span>Date d'arrêté</span><input class="in" type="date" data-ch="brSet" data-f="arr" value="${esc(st.arr || P.au)}" min="${ex.debut}" max="${ex.fin}"></label>` : st.sit !== "ex" ? `<button class="btn sm ghost" data-act="brSitEdit" title="Modifier la situation">✎</button>` : ""}
    <label class="br-ctl"><span>Journal</span><select class="in" data-ch="brSet" data-f="j"><option value="">Tous</option>${S.journaux.map(j => `<option value="${esc(j.code)}" ${st.j === j.code ? "selected" : ""}>${esc(j.code)} · ${esc(j.lib)}</option>`).join("")}</select></label>
    <span class="br-chks"><label class="chk"><input type="checkbox" data-ch="brTog" data-f="mvt" ${mv ? "checked" : ""}> Mouvements N</label><label class="chk"><input type="checkbox" data-ch="brTog" data-f="n1" ${st.n1 ? "checked" : ""}> N-1</label><label class="chk"><input type="checkbox" data-ch="brTog" data-f="n2" ${st.n2 ? "checked" : ""}> N-2</label></span>
    <span class="gr-sp"></span>
    <label class="br-ctl"><span>Vue</span><select class="in" data-ch="brVue"><option value="">Vue standard</option>${vues.map(v => `<option value="${v.id}" ${st.vue === v.id ? "selected" : ""}>${esc(v.nom)}</option>`).join("")}<option value="__save">+ Enregistrer la vue actuelle…</option>${st.vue ? `<option value="__del">Supprimer cette vue</option>` : ""}</select></label>
    <button class="btn sm" data-act="brFiltRaz" title="Effacer les filtres">⌫ Filtres</button>
    <button class="btn sm ia-btn" data-act="iaBulk" title="Propose et applique un statut de révision à chaque compte selon l'analyse automatique">🤖 Révision assistée</button><button class="btn sm" data-act="brLAutoAll" title="Lettrer automatiquement tous les comptes de cette balance (même pièce, même montant, combinaisons)">⚡ Lettrage auto</button><button class="btn sm pri" data-act="flashOpen">États flash</button><button class="btn sm" data-act="brPdf">PDF</button><button class="btn sm" data-act="brXls">Excel</button><button class="btn sm ghost" data-act="rvSeuil" title="Seuils de variation significative">⚙</button>
  </div>
  ${IAC && typeof iaGlobal === "function" ? (() => { const G = iaGlobal(IAC, rows).filter(x => x.lvl !== "info"); const nb = rows.filter(r => r.ia && r.ia.lvl === "bad").length, nw = rows.filter(r => r.ia && (r.ia.lvl === "warn" || r.ia.lvl === "miss")).length; return `<div class="ia-glob"><span>🤖 <b>Analyse IA</b> : <span class="ia-pill ia-bad"><i>✕</i>${nb} anomalie(s)</span> <span class="ia-pill ia-warn"><i>!</i>${nw} à vérifier / manquant(s)</span> <span class="ia-pill ia-ok"><i>✓</i>${rows.length - nb - nw} conforme(s)</span></span>${G.length ? `<a href="#" class="lnk small" data-act="iaGlob">${st.iaG ? "Masquer" : "Voir"} les ${G.length} point(s) généraux</a>` : ""}<a href="#" class="lnk small" data-act="iaFiltPb">Afficher seulement les comptes à traiter</a>${st.iaG ? `<div class="ia-gl">${G.map(x => `<div class="ia-it ${IA_LV[x.lvl][2]}"><i>${IA_LV[x.lvl][0]}</i><span>${esc(x.t)}</span></div>`).join("")}</div>` : ""}</div>`; })() : ""}
  ${st.chk.length ? `<div class="br-bulk"><b>${st.chk.length} compte(s) sélectionné(s)</b>${Object.entries(BR_ST).filter(([k]) => k !== "modif").map(([k, d]) => `<button class="br-st br-${d.c}" data-act="brBulk" data-v="${k}" ${lock ? "disabled" : ""}><i>${d.i}</i>${d.l}</button>`).join("")}<a class="lnk" data-act="brChkNone">Désélectionner</a></div>` : ""}
  <div class="br-main ${st.side && sel ? "" : "noside"}">
    <div class="br-bal"><div class="br-scroll" data-sk="bal:${esc(st.type || "gen")}"><table class="t br-t"><thead>${head}</thead><tbody>${body || `<tr><td colspan="${cols}" class="empty">Aucun compte dans ce filtre.</td></tr>`}</tbody>
      <tfoot><tr class="br-tf1"><td></td><td></td><td colspan="2"><b>Cumul balance</b> <span class="small muted">${list.length} / ${rows.length} compte(s)</span></td>${mv ? `<td class="r mono"><b>${eur(tot.d)}</b></td><td class="r mono"><b>${eur(tot.c)}</b></td>` : ""}<td class="r mono"><b>${eur(tot.sN)}</b></td>${st.n1 ? `<td class="r mono"><b>${eur(tot.s1)}</b></td><td class="r mono"><b>${eur(tot.sN - tot.s1)}</b></td>` : ""}${aux ? "<td></td>" : ""}<td colspan="6"></td>${st.n2 ? `<td class="r mono"><b>${eur(tot.s2)}</b></td>` : ""}</tr>${aux0 ? "" : `<tr class="br-tf2"><td colspan="${cols}"><div class="br-tfr">${brResChip("Résultat N", resN)}${brResChip("Résultat N-1", resN1, !rows.some(r => /^[67]/.test(r.num) && r.s1))}${(() => { let rf = null; try { const r = calcIS(ex); rf = r && r.rf != null ? r.rf : null; } catch (e) { } return rf == null ? "" : `<a href="#" class="br-rc rf ${rf >= 0 ? "ok" : "ko"}" data-act="go" data-v="is" title="Résultat fiscal repris de la liasse (réintégrations et déductions) · ouvrir IS et liasse"><small>Résultat fiscal (liasse)</small><b class="mono">${rf < 0 ? "Déficit " : ""}${eur(Math.abs(rf))}</b></a>`; })()}</div></td></tr>`}</tfoot></table></div>
      <div class="br-tot"><div class="br-tot-l"><span class="br-tot-h">Cumul ${list.length === rows.length ? "de tous les comptes" : "des " + list.length + " comptes affichés"}</span><span><small>Total débit</small><b class="mono">${eur(tot.d)}</b></span><span><small>Total crédit</small><b class="mono">${eur(tot.c)}</b></span><span><small>Soldes débiteurs</small><b class="mono">${eur(cum.sd)}</b></span><span><small>Soldes créditeurs</small><b class="mono">${eur(cum.sc)}</b></span><span><small>Écart</small><b class="mono ${tot.d - tot.c ? "lt-ko" : "lt-okc"}">${eur(tot.d - tot.c)}</b></span></div>
      ${aux0 ? "" : `<div class="br-tot-l br-tot-2"><span class="br-tot-h">Bilan (classes 1 à 5)</span><span><small>Débit</small><b class="mono">${eur(cum.bd)}</b></span><span><small>Crédit</small><b class="mono">${eur(cum.bc)}</b></span><span class="br-tot-h" style="margin-left:6px">Gestion (classes 6 et 7)</span><span><small>Débit</small><b class="mono">${eur(cum.gd)}</b></span><span><small>Crédit</small><b class="mono">${eur(cum.gc)}</b></span>
        </div>`}</div></div>
    <div class="br-mvp"><div class="br-ph"><span>${(() => { const RG = brMvRange(st, P); return (RG.m === "N1" ? "Mouvements N-1" : RG.m === "both" ? "Mouvements N-1 et N" : "Mouvements N") + (sel ? " · " + esc(sel.num) : "") + (RG.m !== "N" ? ` <small class="muted" style="font-weight:500">du ${frDate(RG.from)} au ${frDate(RG.to)}</small>` : ""); })()}</span><span class="row" style="gap:6px">${sel ? `<button class="btn sm ${st.side ? "pri" : ""}" data-act="brSideT" title="Statut, notes de révision et pièces du compte">📝 Révision</button>` : ""}<span class="seg br-lf">${[["all", "Toutes"], ["open", "Non lettrées"], ["done", "Lettrées"]].map(([k, l]) => `<button class="${(st.lf || "all") === k ? "on" : ""}" data-act="brLF" data-v="${k}">${l}</button>`).join("")}</span>${P.p1 ? `<span class="seg br-lf br-per" title="Exercice des mouvements affichés">${[["N", "N"], ["N1", "N-1"], ["both", "N-1 + N"]].map(([k, l]) => `<button class="${brMvRange(st, P).m === k ? "on" : ""}" data-act="brMvP" data-v="${k}" title="${k === "N1" ? "Détail des mouvements de l'exercice précédent" : k === "both" ? "Mouvements de N-1 et de N" : "Mouvements de l'exercice"}">${l}</button>`).join("")}</span>` : ""}</span></div><div class="br-mvb"><div class="br-scroll" data-sk="mv:${esc(st.sel || "")}:${esc(st.lf || "all")}:${esc(st.mvP || "")}">${mvH}</div>${mvBar}</div></div>
    ${st.side && sel ? `<div class="br-side" data-sk="side:${esc(st.sel || "")}">${side}</div>` : ""}
  </div>
  <div class="small muted br-help" style="padding:6px 10px">Soldes en débit moins crédit. Clic droit (ou clic sur le statut) : changer le statut. Filtres numériques : « > 1000 », « < 0 », « 98,00 ». ${lock ? "<b>Exercice clôturé : révision en lecture seule.</b>" : ""}</div></div>`;
};
/* ---------- menu contextuel ---------- */
function brMenu(x, y, k) {
  document.querySelectorAll(".br-ctx").forEach(n => n.remove());
  const m = document.createElement("div"); m.className = "br-ctx"; m.style.left = Math.min(x, window.innerWidth - 240) + "px"; m.style.top = Math.min(y, window.innerHeight - 330) + "px";
  m.innerHTML = `<div class="br-ch">Statut de révision</div>${Object.entries(BR_ST).filter(([s]) => s !== "modif").map(([s, d]) => `<button data-act="brCtx" data-k="${esc(k)}" data-v="${s}"><span class="br-st br-${d.c}"><i>${d.i}</i></span>${d.l}</button>`).join("")}<hr><button data-act="brCtx" data-k="${esc(k)}" data-v="@note">✎ Note de révision</button><button data-act="brCtx" data-k="${esc(k)}" data-v="@pcs">📎 Pièces</button><button data-act="brCtx" data-k="${esc(k)}" data-v="@gl">Grand livre</button><button data-act="brCtx" data-k="${esc(k)}" data-v="@copy">Reprendre la note N-1</button>`;
  document.body.appendChild(m);
}
document.addEventListener("contextmenu", ev => { if (UI.view !== "balrev") return; const tr = ev.target.closest && ev.target.closest(".br-r"); if (!tr) return; ev.preventDefault(); brMenu(ev.clientX, ev.clientY, tr.dataset.k); });
document.addEventListener("mousedown", ev => { if (!(ev.target.closest && ev.target.closest(".br-ctx"))) document.querySelectorAll(".br-ctx").forEach(n => n.remove()); }, true);
let brT; document.addEventListener("input", ev => { const el = ev.target; if (!el.dataset || !el.dataset.brf) return; clearTimeout(brT); brT = setTimeout(() => { brState().f[el.dataset.brf] = el.value; render(); }, 220); });
/* glisser-déposer des pièces sur le panneau */
document.addEventListener("dragover", ev => { const z = UI.view === "balrev" && ev.target.closest && ev.target.closest(".br-side"); if (z) { ev.preventDefault(); z.classList.add("br-dragon"); } });
document.addEventListener("dragleave", ev => { const z = ev.target.closest && ev.target.closest(".br-side"); if (z && !z.contains(ev.relatedTarget)) z.classList.remove("br-dragon"); });
document.addEventListener("drop", ev => { const z = UI.view === "balrev" && ev.target.closest && ev.target.closest(".br-side"); if (!z) return; ev.preventDefault(); z.classList.remove("br-dragon"); const st = brState(); if (!st.sel) return; const fs = [...(ev.dataTransfer.files || [])]; if (fs.length) brUpload(st.sel, fs, "R"); });
async function brUpload(k, files, kind) {
  if (!Store.assets) { toast("L'ajout de pièces n'est pas disponible dans cette vue (ouvrez le logiciel depuis un navigateur d'ordinateur)."); return; }
  const ex = exCur(); let n = 0;
  for (const f of files) { try { const up = await Store.assets.upload(f); const d = { id: up.id || uid(), url: up.url, nom: f.name, type: f.type || "", le: todayISO() };
    if (kind === "C") ((S.pieceComptes ||= {})[k] ||= []).push(d); else (brMark(k, ex).docs ||= []).push(d); n++; } catch (err) { logErr("pièce de révision", err); toast("Pièce « " + f.name + " » refusée : " + (err.message || err.code || err)); } }
  if (n) { Store.touch(); toast(n + " pièce(s) ajoutée(s)."); render(); }
}
function brDocsOf(k, kind) { const ex = exCur(); if (kind === "C") return (S.pieceComptes || {})[k] || []; if (kind === "RP") { const pe = prevEx(ex); return pe ? brRec(pe, k).docs || [] : []; } return brRec(ex, k).docs || []; }
const BRACT = {
  brSel: (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest("[data-stop],[data-act=brStMenu],.br-pj")) return; const st = brState(); if (st.sel !== el.dataset.k) st.lsel = []; st.sel = el.dataset.k; render(); },
  brStMenu: (el, ev) => { const st = brState(); st.sel = el.dataset.k; const r = el.getBoundingClientRect(); render(); brMenu(r.left, r.bottom + 2, el.dataset.k); },
  brCtx: el => { const st = brState(); const k = el.dataset.k, v = el.dataset.v; document.querySelectorAll(".br-ctx").forEach(n => n.remove()); st.sel = k;
    if (v === "@note") { st.tab = "rev"; st.side = true; render(); setTimeout(() => { const t = $("#brNote"); t && t.focus(); }, 30); return; }
    if (v === "@pcs") { st.tab = "pcs"; st.side = true; render(); return; }
    if (v === "@gl") { BRACT.brGL(); return; }
    if (v === "@copy") { BRACT.brCopyP(); return; }
    brSetSt([k], v, brRows(st).rows); render(); },
  brSt: el => { const st = brState(); if (!st.sel) return; brSetSt([st.sel], el.dataset.v, brRows(st).rows); render(); },
  brBulk: el => { const st = brState(); brSetSt(st.chk, el.dataset.v, brRows(st).rows); toast(st.chk.length + " compte(s) : " + BR_ST[el.dataset.v].l + "."); st.chk = []; render(); },
  brChk: (el, ev) => { if (ev) ev.stopPropagation(); const st = brState(); const k = el.dataset.k; st.chk = st.chk.includes(k) ? st.chk.filter(x => x !== k) : st.chk.concat(k); render(); },
  brChkAll: () => { const st = brState(); const L = brFilter(st, brRows(st).rows).map(r => r.k); st.chk = L.every(k => st.chk.includes(k)) ? [] : L; render(); },
  brChkNone: () => { brState().chk = []; render(); },
  brTab: el => { brState().tab = el.dataset.v; render(); },
  brCopyP: () => { const st = brState(); const r = brRows(st).rows.find(x => x.k === st.sel); if (!r || !r.noteP) return; brMark(r.k).note = r.noteP; Store.touch(); render(); },
  brGL: () => { const st = brState(); const k = st.sel; if (!k) return; if (k.startsWith("T:")) { const t = tiersBy(k.slice(2)); go("consult"); Object.assign(UI.sub.consult, { tab: "gl", compte: t ? t.collectif : "", aux: k.slice(2) }); } else { go("consult"); Object.assign(UI.sub.consult, { tab: "gl", compte: k, aux: "" }); } render(); },
  brLettrage: () => { const st = brState(); st.lf = "open"; render(); },
  brNewE: () => { const g = UI.sub.grid ||= {}; Object.assign(g, { j: "OD", m: todayISO().slice(0, 7), cur: null, sel: null, nl: null }); go("grille"); },
  brOpenE: el => { const e = E.find(x => x.id === el.dataset.e); if (!e) return; const g = UI.sub.grid ||= {}; const ex = exOf(e.date); if (ex && ex.id !== S.exCourant) S.exCourant = ex.id; Object.assign(g, { j: e.journal, m: e.date.slice(0, 7), cur: null, sel: { e: e.id, l: el.dataset.l }, nl: null, aff: "all" }); go("grille"); setTimeout(() => { const r = document.querySelector(`.gr-r[data-l="${el.dataset.l}"]`); r && r.scrollIntoView({ block: "center" }); }, 60); },
  brDocs: (el, ev) => { if (ev) ev.stopPropagation(); const D = brDocsOf(el.dataset.k, el.dataset.kind); if (!D.length) return; openModal({ type: "brDocs", k: el.dataset.k, kind: el.dataset.kind, i: Number(el.dataset.i || 0) }); setTimeout(() => brPreview(), 30); },
  brDocShow: el => { UI.modal.i = Number(el.dataset.i); render(); setTimeout(() => brPreview(), 30); },
  brDocDel: el => { const k = el.dataset.k, kind = el.dataset.kind, i = Number(el.dataset.i); const D = brDocsOf(k, kind); const d = D[i]; if (!d) return; confirmBox("Retirer la pièce", `« ${esc(d.nom)} » sera retirée du compte.`, "Retirer", () => { D.splice(i, 1); Store.touch(); render(); }, true); },
  brFiltRaz: () => { const st = brState(); st.f = {}; st.c1 = ""; st.c2 = ""; st.cf = "mvt"; st.j = ""; render(); },
  brSitEdit: () => { const st = brState(); const s = brSituations().find(x => x.id === st.sit); if (s) openModal({ type: "brSit", d: deep(s) }); },
  brSitSave: () => { const d = UI.modal.d; if (!d.nom || !d.du || !d.au) { toast("Indiquez un nom et la période."); return; } if (d.au < d.du) { toast("La date de fin précède la date de début."); return; } const L = brSituations(); const i = L.findIndex(x => x.id === d.id); if (i >= 0) L[i] = d; else L.push(d); Store.touch(); brState().sit = d.id; closeModal(); toast("Situation « " + d.nom + " » enregistrée."); render(); },
  brSitDel: () => { const d = UI.modal.d; S.situations = brSituations().filter(x => x.id !== d.id); Store.touch(); brState().sit = "ex"; closeModal(); render(); },
  brVueSave: () => { const d = UI.modal.d; if (!d.nom) { toast("Nommez la vue."); return; } const st = brState(); const v = { id: uid(), nom: d.nom, cfg: { type: st.type, cf: st.cf, c1: st.c1, c2: st.c2, sit: st.sit, arr: st.arr, mvt: st.mvt, j: st.j, n1: st.n1, n2: st.n2, f: deep(st.f) } }; (S.balVues ||= []).push(v); st.vue = v.id; Store.touch(); closeModal(); toast("Vue « " + d.nom + " » enregistrée."); render(); },
  brPdf: () => { const st = brState(); try { const R = brReport(st); deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_" + BR_TYPES[st.type].replace(/\s+/g, "") + "_" + brPeriod(st).au.replace(/-/g, "") + ".pdf", R.finish(), "pdf", null, { cat: "Révision", lib: BR_TYPES[st.type] + " " + brPeriod(st).lib }); } catch (e) { logErr("balance PDF", e); toast("PDF impossible : " + e.message); } },
  brXls: () => { const st = brState(); try { const R = brReport(st); const { rows } = brRows(st); deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_" + BR_TYPES[st.type].replace(/\s+/g, "") + ".xlsx", buildXLSX(reportToSheets(R)), "xlsx", brFilter(st, rows).map(r => [r.num, r.lib, r.sN / 100, r.s1 / 100, BR_ST[r.st].l, r.note].join(";")).join("\n")); } catch (e) { logErr("balance Excel", e); toast("Export impossible : " + e.message); } }
};
const BRCHG = {
  brSet: el => { const st = brState(); const f = el.dataset.f; st[f] = el.value.trim ? el.value.trim() : el.value; if (f === "type") { st.sel = ""; st.chk = []; } st.vue = ""; render(); },
  brTog: el => { brState()[el.dataset.f] = el.checked; render(); },
  brF: el => { const st = brState(); st.f[el.dataset.f] = el.type === "checkbox" ? el.checked : el.value; render(); },
  brSit: el => { const st = brState(); if (el.value === "__new") { const ex = exCur(); openModal({ type: "brSit", isNew: true, d: { id: uid(), nom: "Situation au " + frDate(todayISO() < ex.fin ? todayISO() : ex.fin), du: ex.debut, au: todayISO() < ex.fin && todayISO() > ex.debut ? todayISO() : ex.fin, cmp: "same", cdu: "", cau: "" } }); el.value = st.sit; return; } st.sit = el.value; if (st.sit === "arr" && !st.arr) st.arr = todayISO() > exCur().fin ? exCur().fin : todayISO(); render(); },
  brVue: el => { const st = brState(); const v = el.value; if (v === "__save") { openModal({ type: "brVue", d: { nom: "" } }); el.value = st.vue; return; } if (v === "__del") { S.balVues = (S.balVues || []).filter(x => x.id !== st.vue); st.vue = ""; Store.touch(); render(); return; } if (!v) { st.vue = ""; render(); return; } const V = (S.balVues || []).find(x => x.id === v); if (V) { Object.assign(st, deep(V.cfg)); st.vue = v; st.sel = ""; st.chk = []; } render(); },
  brNote: el => { const r = brMark(el.dataset.k); r.note = el.value; if (!r.st && el.value) r.st = "encours"; Store.touch(); render(); },
  brNoteC: el => { (S.noteComptes ||= {})[el.dataset.k] = el.value; Store.touch(); },
  brUp: async el => { const fs = [...el.files]; el.value = ""; const st = brState(); if (st.sel) await brUpload(st.sel, fs, el.dataset.kind); },
  brSitF: el => { UI.modal.d[el.dataset.f] = el.value; render(); }
};
async function brPreview() {
  const M = UI.modal; if (!M || M.type !== "brDocs") return; const box = $("#brPv"); if (!box) return; const d = brDocsOf(M.k, M.kind)[M.i || 0]; if (!d) return; box.innerHTML = `<div class="empty">Chargement…</div>`;
  try { const r = await fetch(d.url); if (!r.ok) throw new Error("document indisponible (" + r.status + ")"); const b = new Uint8Array(await r.arrayBuffer());
    if (latin1(b.subarray(0, 4)) === "%PDF") { box.innerHTML = ""; await renderPdfPreview(b, box, { scale: 1.2 }); }
    else if (/^image\//.test(d.type) || /^\x89PNG|^\xFF\xD8/.test(latin1(b.subarray(0, 4)))) { const u = URL.createObjectURL(new Blob([b], { type: d.type || "image/png" })); box.innerHTML = `<img src="${u}" style="max-width:100%">`; }
    else box.innerHTML = `<div class="empty">Aperçu indisponible pour ce type de fichier. <a href="${esc(d.url)}" target="_blank" rel="noopener">Ouvrir</a></div>`;
  } catch (e) { box.innerHTML = `<div class="empty">Aperçu indisponible : ${esc(e.message)}</div>`; }
}
function brReport(st) {
  const { P, rows } = brRows(st); const L = brFilter(st, rows); const R = new Report(BR_TYPES[st.type]);
  R.newPage(BR_TYPES[st.type], P.lib + " (" + frDate(P.du) + " - " + frDate(P.au) + ")" + (P.p1 ? " · N-1 : " + frDate(P.p1.du) + " - " + frDate(P.p1.au) : ""));
  const T = L.reduce((a, r) => { a[0] += r.sN; a[1] += r.s1; return a; }, [0, 0]);
  R.table([{ w: 62 }, { wrap: 1 }, { w: 70, align: "right" }, { w: 70, align: "right" }, { w: 64, align: "right" }, { w: 70 }],
    L.map(r => ({ style: r.st === "anomalie" ? "hl" : "", cells: [r.num, r.lib + (r.note ? " - Note : " + r.note.replace(/\n/g, " ") : "") + (r.noteP ? " - N-1 : " + r.noteP.replace(/\n/g, " ") : ""), pe(r.sN, 1), pe(r.s1, 1), pe(r.v, 1), BR_ST[r.st].l] })).concat([{ style: "tot", cells: ["", "Total (" + L.length + " comptes)", pe(T[0]), pe(T[1]), pe(T[0] - T[1]), ""] }]),
    [st.type === "gen" ? "Compte" : "Code", "Intitulé et notes de révision", "Solde N", "Solde N-1", "Variation", "Statut"]);
  return R;
}
const _rmBR = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "brSit") { const d = M.d; const ex = exCur();
    return modalFrame(M.isNew ? "Nouvelle balance de situation" : "Situation · " + esc(d.nom), `<div class="grid g3"><label class="f" style="grid-column:span 3">Nom de la situation<input class="in" data-ch="brSitF" data-f="nom" value="${esc(d.nom)}" placeholder="ex. Situation semestrielle au 30/06"></label>
      <label class="f">Du<input class="in" type="date" data-ch="brSitF" data-f="du" value="${esc(d.du)}"></label><label class="f">Au (date d'arrêté)<input class="in" type="date" data-ch="brSitF" data-f="au" value="${esc(d.au)}"></label>
      <label class="f">Comparaison<select class="in" data-ch="brSitF" data-f="cmp"><option value="same" ${d.cmp === "same" ? "selected" : ""}>Même période N-1</option><option value="full" ${d.cmp === "full" ? "selected" : ""}>Exercice N-1 complet</option><option value="custom" ${d.cmp === "custom" ? "selected" : ""}>Période libre</option><option value="none" ${d.cmp === "none" ? "selected" : ""}>Aucune</option></select></label>
      ${d.cmp === "custom" ? `<label class="f">Comparer du<input class="in" type="date" data-ch="brSitF" data-f="cdu" value="${esc(d.cdu)}"></label><label class="f">au<input class="in" type="date" data-ch="brSitF" data-f="cau" value="${esc(d.cau)}"></label>` : ""}</div>
      <div class="row" style="gap:6px;margin-top:8px">${[["Fin du 1er trimestre", 3], ["Fin du 1er semestre", 6], ["Fin du 3e trimestre", 9]].map(([l, m]) => `<button class="btn sm ghost" data-act="brSitQuick" data-m="${m}">${l}</button>`).join("")}</div>
      <p class="small muted">Une balance de situation arrête les comptes à une date donnée (situation trimestrielle, semestrielle, prévisionnelle). Elle s'utilise dans les balances, les États flash et les exports. Exercice en cours : ${frDate(ex.debut)} - ${frDate(ex.fin)}.</p>`,
      (M.isNew ? "" : `<button class="btn danger" data-act="brSitDel">Supprimer</button>`) + cancelBtn + `<button class="btn pri" data-act="brSitSave">Enregistrer la situation</button>`, true); }
  if (M && M.type === "brVue") return modalFrame("Enregistrer la vue de balance", `<label class="f">Nom de la vue<input class="in" data-m="nom" value="${esc(M.d.nom)}" placeholder="ex. Comptes de TVA à réviser"></label><p class="small muted">La vue mémorise le type de balance, le filtre de comptes, la plage, la situation, le journal, les colonnes affichées et les filtres de colonnes.</p>`, cancelBtn + `<button class="btn pri" data-act="brVueSave">Enregistrer</button>`);
  if (M && M.type === "brDocs") { const D = brDocsOf(M.k, M.kind); const i = M.i || 0; const ttl = { C: "Pièces du compte", R: "Pièces de révision N", RP: "Pièces de révision N-1" }[M.kind];
    return modalFrame(ttl + " · " + esc(M.k.replace(/^T:/, "")), `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,2.4fr);gap:14px"><div class="lst">${D.map((d, k) => `<div class="ev" style="${k === i ? "background:var(--accent-soft)" : ""}"><span class="kic sm c3">${ico("doc")}</span><div><b class="small">${esc(d.nom)}</b><div class="small muted">${frDate(d.le)}</div></div><span class="row" style="flex-wrap:nowrap;gap:4px"><button class="btn sm" data-act="brDocShow" data-i="${k}">Voir</button><a class="btn sm ghost" href="${esc(d.url)}" target="_blank" rel="noopener">⇩</a></span></div>`).join("")}</div><div id="brPv" class="pv" style="max-height:62vh"></div></div>`, `<button class="btn pri" data-act="closeModal">Fermer</button>`, true); }
  return _rmBR.apply(this, arguments);
};
BRACT.brSitQuick = el => { const d = UI.modal.d; const ex = exCur(); d.du = ex.debut; d.au = addDays(addMonths(ex.debut, Number(el.dataset.m)), -1); d.nom = "Situation au " + frDate(d.au); render(); };

/* ============================================================
   ÉTATS FLASH : moteur de modèles paramétrables
   Ligne : { ty: "t" titre | "r" rubrique | "f" total, code, lib, cpt, sg, f }
   cpt : préfixes séparés par des virgules ; "a-b" plage ; "-x" exclusion ;
         suffixe ":D" (solde débiteur seulement) ou ":C" (créditeur seulement)
   sg : 1 = solde débit - crédit ; -1 = solde crédit - débit
   f  : formule de total sur les codes, ex. "AI+AC-AX"
   ============================================================ */
const FL_STD = (() => {
  const R = (code, lib, cpt, sg = 1) => ({ ty: "r", code, lib, cpt, sg }), T = lib => ({ ty: "t", lib }), F = (code, lib, f) => ({ ty: "f", code, lib, f });
  return [{ id: "std", nom: "Bilan, CR, SIG (PCG ANC 2022-06)", std: true, sections: [
    { titre: "Actif - PCG ANC 2022-06", lignes: [R("AA", "Capital souscrit non appelé (I)", "109"), T("Actif immobilisé"),
      R("AB", "Frais d'établissement", "201,2801"), R("CX", "Frais de développement", "203,2803"), R("AF", "Concessions, brevets et droits similaires", "205,2805,2905"), R("AH", "Fonds commercial", "206,207,2807,2906,2907"), R("AJ", "Autres immobilisations incorporelles", "208,2808,2908"), R("AL", "Immobilisations incorporelles en cours, avances et acomptes", "232,237,2932"),
      R("AN", "Terrains", "211,212,2811,2812,2911"), R("AP", "Constructions", "213,214,2813,2814"), R("AR", "Installations techniques, matériel, outillage industriels", "215,2815"), R("AT", "Autres immobilisations corporelles", "218,2818"), R("AV", "Immobilisations corporelles en cours, avances et acomptes", "231,238,2931"),
      R("CS", "Participations", "261,266,2961,2966"), R("CU", "Créances rattachées à des participations", "267,268,2967,2968"), R("BB", "Titres immobilisés de l'activité de portefeuille", "273,2973"), R("BD", "Autres titres immobilisés", "271,272,2971,2972"), R("BF", "Prêts", "274,2974"), R("BH", "Autres immobilisations financières", "275,276,2975,2976"),
      F("BJ", "Total actif immobilisé (II)", "AB+CX+AF+AH+AJ+AL+AN+AP+AR+AT+AV+CS+CU+BB+BD+BF+BH"), T("Actif circulant"),
      R("BL", "Matières premières et autres approvisionnements", "31,32,391,392"), R("BN", "En cours de production de biens", "33,393"), R("BP", "En cours de production de services", "34,394"), R("BR", "Produits intermédiaires et finis", "35,395"), R("BT", "Marchandises", "37,397"),
      R("BV", "Avances et acomptes versés sur commandes", "4091"), R("BX", "Clients et comptes rattachés", "411,413,416,417,418,491"), R("BZ", "Autres créances", "40:D,-4091,42:D,43:D,44:D,45:D,-4562,46:D,47:D,-476,-477,495,496"), R("CA", "Capital souscrit appelé, non versé", "4562"),
      R("CD", "Valeurs mobilières de placement", "50,590"), R("CF", "Disponibilités", "51:D,52:D,53,54,58"), R("CH", "Charges constatées d'avance", "486"),
      F("CJ", "Total actif circulant (III)", "BL+BN+BP+BR+BT+BV+BX+BZ+CA+CD+CF+CH"), R("CW", "Frais d'émission d'emprunt à étaler (IV)", "4816"), R("CM", "Primes de remboursement des obligations (V)", "169"), R("CN", "Écarts de conversion actif (VI)", "476"),
      F("CO", "TOTAL GÉNÉRAL ACTIF (I à VI)", "AA+BJ+CJ+CW+CM+CN")] },
    { titre: "Passif - PCG ANC 2022-06", lignes: [T("Capitaux propres"),
      R("DA", "Capital social ou individuel (dont versé)", "101,108", -1), R("DB", "Primes d'émission, de fusion, d'apport", "104", -1), R("DC", "Écarts de réévaluation", "105", -1), R("DD", "Réserve légale", "1061", -1), R("DE", "Réserves statutaires ou contractuelles", "1063", -1), R("DF", "Réserves réglementées", "1062,1064", -1), R("DG", "Autres réserves", "1068", -1),
      R("DH", "Report à nouveau", "11", -1), R("DI", "Résultat de l'exercice (bénéfice ou perte)", "12,6,7", -1), R("DJ", "Subventions d'investissement", "13", -1), R("DK", "Provisions réglementées", "14", -1),
      F("DL", "Total capitaux propres (I)", "DA+DB+DC+DD+DE+DF+DG+DH+DI+DJ+DK"), R("DM", "Produit des émissions de titres participatifs", "1671", -1), R("DN", "Avances conditionnées", "1674", -1), F("DO", "Total autres fonds propres (II)", "DM+DN"),
      R("DP", "Provisions pour risques", "151", -1), R("DQ", "Provisions pour charges", "15,-151", -1), F("DR", "Total provisions (III)", "DP+DQ"), T("Dettes"),
      R("DS", "Emprunts obligataires convertibles", "161", -1), R("DT", "Autres emprunts obligataires", "163", -1), R("DU", "Emprunts et dettes auprès des établissements de crédit", "164,1688,512:C,514:C,517:C,519", -1), R("DV", "Emprunts et dettes financières divers", "165,166,1675,168,-1688,17,455", -1),
      R("DW", "Avances et acomptes reçus sur commandes en cours", "4191", -1), R("DX", "Dettes fournisseurs et comptes rattachés", "401:C,403,408,-4084,-4098", -1), R("DY", "Dettes fiscales et sociales", "42:C,43:C,44:C", -1), R("DZ", "Dettes sur immobilisations et comptes rattachés", "404,405,4084", -1),
      R("EA", "Autres dettes", "4196,4197,4198,45:C,-455,46:C,47:C,-476,-477,509", -1), R("EB", "Produits constatés d'avance", "487", -1),
      F("EC", "Total dettes (IV)", "DS+DT+DU+DV+DW+DX+DY+DZ+EA+EB"), R("ED", "Écarts de conversion passif (V)", "477", -1), F("EE", "TOTAL GÉNÉRAL PASSIF (I à V)", "DL+DO+DR+EC+ED")] },
    { titre: "Compte de résultat", lignes: [T("Produits d'exploitation"),
      R("FC", "Ventes de marchandises", "707,7097", -1), R("FF", "Production vendue de biens", "701,702,703,7091,7092,7093", -1), R("FI", "Production vendue de services", "704,705,706,708,7094,7095,7096,7098", -1), F("FL", "Chiffre d'affaires net", "FC+FF+FI"),
      R("FM", "Production stockée", "713", -1), R("FN", "Production immobilisée", "72", -1), R("FO", "Subventions d'exploitation", "74", -1), R("FP", "Reprises sur amortissements et provisions, transferts de charges", "781,791", -1), R("FQ", "Autres produits", "75", -1),
      F("FR", "Total des produits d'exploitation (I)", "FL+FM+FN+FO+FP+FQ"), T("Charges d'exploitation"),
      R("FS", "Achats de marchandises", "607,6087,6097"), R("FT", "Variation de stock (marchandises)", "6037"), R("FU", "Achats de matières premières et autres approvisionnements", "601,602,6081,6082,6091,6092"), R("FV", "Variation de stock (matières premières et approvisionnements)", "6031,6032"),
      R("FW", "Autres achats et charges externes", "604,605,606,6084,6085,6086,6094,6095,6096,61,62"), R("FX", "Impôts, taxes et versements assimilés", "63"), R("FY", "Salaires et traitements", "641,644"), R("FZ", "Charges sociales", "645,646,647,648"),
      R("GA", "Dotations aux amortissements", "6811"), R("GC", "Dotations aux provisions", "6812,6815,6816,6817"), R("GE", "Autres charges", "65"),
      F("GF", "Total des charges d'exploitation (II)", "FS+FT+FU+FV+FW+FX+FY+FZ+GA+GC+GE"), F("GG", "RÉSULTAT D'EXPLOITATION (I - II)", "FR-GF"),
      R("GP", "Produits financiers", "76,786,796", -1), R("GU", "Charges financières", "66,686"), F("GV", "RÉSULTAT FINANCIER", "GP-GU"), F("GW", "RÉSULTAT COURANT AVANT IMPÔTS", "GG+GV"),
      R("HD", "Produits exceptionnels", "77,787,797", -1), R("HH", "Charges exceptionnelles", "67,687"), F("HI", "RÉSULTAT EXCEPTIONNEL", "HD-HH"),
      R("HJ", "Participation des salariés aux résultats", "691"), R("HK", "Impôts sur les bénéfices", "69,-691"), F("HN", "BÉNÉFICE OU PERTE", "GW+HI-HJ-HK")] },
    { titre: "Soldes intermédiaires de gestion", lignes: [
      R("S1", "Ventes de marchandises", "707,7097", -1), R("S2", "Coût d'achat des marchandises vendues", "607,6087,6097,6037"), F("S3", "MARGE COMMERCIALE", "S1-S2"),
      R("S4", "Production vendue", "701,702,703,704,705,706,708,7091,7092,7093,7094,7095,7096,7098", -1), R("S5", "Production stockée", "713", -1), R("S6", "Production immobilisée", "72", -1), F("S7", "PRODUCTION DE L'EXERCICE", "S4+S5+S6"),
      R("S8", "Consommations en provenance des tiers", "601,602,6031,6032,604,605,606,6081,6082,6084,6085,6086,6091,6092,6094,6095,6096,61,62"), F("S9", "VALEUR AJOUTÉE", "S3+S7-S8"),
      R("SA", "Subventions d'exploitation", "74", -1), R("SB", "Impôts, taxes et versements assimilés", "63"), R("SC", "Charges de personnel", "64"), F("SD", "EXCÉDENT BRUT D'EXPLOITATION", "S9+SA-SB-SC"),
      R("SE", "Reprises et transferts de charges", "781,791", -1), R("SF", "Autres produits", "75", -1), R("SG", "Dotations aux amortissements et provisions", "681"), R("SH", "Autres charges", "65"), F("SI", "RÉSULTAT D'EXPLOITATION", "SD+SE+SF-SG-SH"),
      R("SJ", "Produits financiers", "76,786,796", -1), R("SK", "Charges financières", "66,686"), F("SL", "RÉSULTAT COURANT AVANT IMPÔTS", "SI+SJ-SK"),
      R("SM", "Produits exceptionnels", "77,787,797", -1), R("SN", "Charges exceptionnelles", "67,687"), F("SO", "RÉSULTAT EXCEPTIONNEL", "SM-SN"),
      R("SP", "Participation des salariés", "691"), R("SQ", "Impôts sur les bénéfices", "69,-691"), F("SR", "RÉSULTAT NET", "SL+SO-SP-SQ")] }
  ] }, { id: "std_tva", nom: "Contrôle TVA et trésorerie", std: true, sections: [{ titre: "Trésorerie", lignes: [R("T1", "Banques", "512"), R("T2", "Caisse", "53"), R("T3", "Virements internes", "58"), F("T4", "Trésorerie nette", "T1+T2+T3"), R("T5", "Emprunts bancaires (capital restant dû)", "164", -1)] },
    { titre: "TVA", lignes: [R("V1", "TVA collectée", "4457", -1), R("V2", "TVA déductible sur immobilisations", "44562"), R("V3", "TVA déductible sur biens et services", "44566"), R("V4", "Crédit de TVA à reporter", "44567"), R("V5", "TVA à décaisser", "44551", -1), F("V6", "Position TVA (collectée - déductible)", "V1-V2-V3")] }] }];
})();
function flModeles() { const adm = (isAdmin() && UI.cfg && UI.cfg.flashModeles) || CONFIG.flashModeles || []; return FL_STD.concat(adm.map(m => Object.assign({}, m, { org: "logiciel" })), (S.flashModeles || []).map(m => Object.assign({}, m, { org: "dossier" }))); }
function flParse(spec) { return String(spec || "").split(/[,;\s]+/).filter(Boolean).map(t => { let neg = false; if (t[0] === "-") { neg = true; t = t.slice(1); } let s = ""; const m = t.match(/^(.*):([DC])$/i); if (m) { t = m[1]; s = m[2].toUpperCase(); } const [a, b] = t.split("-"); return { neg, a, b: b || "", s }; }); }
function flMatch(c, toks, v) {
  let inc = false;
  for (const t of toks) { const hit = t.b ? (c.slice(0, t.a.length) >= t.a && c.slice(0, t.b.length) <= t.b) : c.startsWith(t.a); if (!hit) continue; if (t.neg) return false; if (t.s === "D" && !(v > 0)) continue; if (t.s === "C" && !(v < 0)) continue; inc = true; }
  return inc;
}
function flEval(model, m) {
  const out = []; const val = {};
  for (const sec of model.sections) { const L = [];
    for (const ln of sec.lignes) {
      if (ln.ty === "t") { L.push({ ln }); continue; }
      if (ln.ty === "r") { const toks = flParse(ln.cpt); const sg = Number(ln.sg) || 1; let s = 0; const det = []; for (const c of Object.keys(m).sort()) { const v = m[c]; if (!v || !flMatch(c, toks, v)) continue; s += sg * v; det.push({ c, v: sg * v }); } if (ln.code) val[ln.code] = (val[ln.code] || 0) + s; L.push({ ln, v: s, det }); continue; }
      if (ln.ty === "f") { L.push({ ln, f: true }); }
    }
    out.push({ sec, L });
  }
  const calc = f => { let s = 0; String(f || "").replace(/\s/g, "").replace(/([+-]?)([A-Za-z0-9_]+)/g, (_, op, code) => { const x = /^\d+$/.test(code) && !(code in val) ? Number(code) * 100 : (val[code] || 0); s += op === "-" ? -x : x; return ""; }); return s; };
  for (let pass = 0; pass < 3; pass++) for (const o of out) for (const it of o.L) if (it.f) { it.v = calc(it.ln.f); if (it.ln.code) val[it.ln.code] = it.v; }
  return { out, val };
}
function flSolde(du, au) { const m = {}; for (const { l } of flat({ from: du, to: au })) m[l.compte] = (m[l.compte] || 0) + l.debit - l.credit; return m; }
function flCompute(st) {
  const P = brPeriod({ sit: st.sit, arr: st.arr }); const model = flModeles().find(x => x.id === st.mid) || FL_STD[0];
  const N = flEval(model, flSolde(P.du, P.au)); const N1 = st.cmp && P.p1 ? flEval(model, flSolde(P.p1.du, P.p1.au)) : null;
  return { P, model, N, N1 };
}
function flState() { return UI.sub.flash ||= { mid: "std", sit: (UI.sub.br || {}).sit || "ex", arr: (UI.sub.br || {}).arr || "", cmp: true, det: true, arr0: false, sec: "" }; }
function flHTML(st) {
  const { P, model, N, N1 } = flCompute(st); const fmt = v => !v ? "" : st.arr0 ? NF0.format(Math.round(v / 100)) : eur(v);
  const pct = (a, b) => b ? (((a - b) / Math.abs(b)) * 100).toFixed(2).replace(".", ",") : "";
  const hN = frDate(P.au) + "<br>N (" + P.months + " mois)"; const h1 = P.p1 ? frDate(P.p1.au) + "<br>N-1 (" + Math.max(1, Math.round((new Date(P.p1.au) - new Date(P.p1.du)) / 2629800000)) + " mois)" : "N-1";
  return N.out.filter(o => !st.sec || o.sec.titre === st.sec).map((o, si) => { const o1 = N1 ? N1.out.find(x => x.sec.titre === o.sec.titre) : null;
    return `<table class="fl-t"><thead><tr><th class="fl-h">${esc(o.sec.titre)}</th><th class="r">${hN}</th>${N1 ? `<th class="r">${h1}</th><th class="r">Var.<br>(EUR)</th><th class="r">Var.<br>(%)</th>` : ""}</tr></thead><tbody>${o.L.map((it, i) => { const ln = it.ln; if (ln.ty === "t") return `<tr class="fl-ti"><td colspan="${N1 ? 5 : 2}">${esc(ln.lib)}</td></tr>`;
      const b = o1 ? o1.L[i].v || 0 : 0; const a = it.v || 0;
      let h = `<tr class="${ln.ty === "f" ? "fl-tot" : "fl-r"}"><td>${esc(ln.lib)}</td><td class="r mono">${fmt(a)}</td>${N1 ? `<td class="r mono">${fmt(b)}</td><td class="r mono">${a - b ? (a - b > 0 ? "+" : "") + fmt(a - b) : ""}</td><td class="r mono">${a || b ? (pct(a, b) && Number(pct(a, b).replace(",", ".")) > 0 ? "+" : "") + pct(a, b) : ""}</td>` : ""}</tr>`;
      if (st.det && ln.ty === "r") { const dB = {}; if (o1) (o1.L[i].det || []).forEach(x => dB[x.c] = x.v); const cs = [...new Set((it.det || []).map(x => x.c).concat(Object.keys(dB)))].sort(); const dA = {}; (it.det || []).forEach(x => dA[x.c] = x.v);
        h += cs.map(c => `<tr class="fl-d"><td>${esc(c)} ${esc(accLib(c).toUpperCase())}</td><td class="r mono">${fmt(dA[c] || 0)}</td>${N1 ? `<td class="r mono">${fmt(dB[c] || 0)}</td><td class="r mono">${(dA[c] || 0) - (dB[c] || 0) ? fmt((dA[c] || 0) - (dB[c] || 0)) : ""}</td><td class="r mono">${pct(dA[c] || 0, dB[c] || 0)}</td>` : ""}</tr>`).join(""); }
      return h; }).join("")}</tbody></table>`; }).join("");
}
function flReport(st) {
  const { P, model, N, N1 } = flCompute(st); const R = new Report("États flash"); const fmt = v => !v ? "" : st.arr0 ? pdfClean(NF0.format(Math.round(v / 100))) : pe(v);
  for (const o of N.out) { if (st.sec && o.sec.titre !== st.sec) continue; const o1 = N1 ? N1.out.find(x => x.sec.titre === o.sec.titre) : null; R.newPage(o.sec.titre, model.nom + " · " + P.lib + " (" + frDate(P.du) + " - " + frDate(P.au) + ")" + (N1 ? " · N-1 : " + frDate(P.p1.du) + " - " + frDate(P.p1.au) : ""));
    const rows = []; o.L.forEach((it, i) => { const ln = it.ln; if (ln.ty === "t") { rows.push({ style: "grp", cells: N1 ? [ln.lib, "", "", "", ""] : [ln.lib, ""] }); return; } const a = it.v || 0, b = o1 ? o1.L[i].v || 0 : 0;
      rows.push({ style: ln.ty === "f" ? "sub" : "", cells: N1 ? [ln.lib, fmt(a), fmt(b), a - b ? fmt(a - b) : "", b ? ((a - b) / Math.abs(b) * 100).toFixed(1).replace(".", ",") : ""] : [ln.lib, fmt(a)] });
      if (st.det && ln.ty === "r") (it.det || []).forEach(x => rows.push({ ind: 1, cells: N1 ? ["   " + x.c + " " + accLib(x.c), fmt(x.v), "", "", ""] : ["   " + x.c + " " + accLib(x.c), fmt(x.v)] })); });
    R.table(N1 ? [{ wrap: 1 }, { w: 78, align: "right" }, { w: 78, align: "right" }, { w: 70, align: "right" }, { w: 44, align: "right" }] : [{ wrap: 1 }, { w: 90, align: "right" }], rows, N1 ? ["Rubrique", "N", "N-1", "Var. (EUR)", "Var. %"] : ["Rubrique", "N"]); }
  return R;
}
const FLACT = {
  flashOpen: () => { const st = flState(); const b = UI.sub.br || {}; st.sit = b.sit || st.sit; st.arr = b.arr || st.arr; openModal({ type: "flash" }); },
  flPrint: () => { const st = flState(); try { deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_EtatsFlash_" + brPeriod(st).au.replace(/-/g, "") + ".pdf", flReport(st).finish(), "pdf", null, { cat: "Révision", lib: "États flash " + brPeriod(st).lib }); } catch (e) { logErr("états flash PDF", e); toast("PDF impossible : " + e.message); } },
  flXls: () => { const st = flState(); try { deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_EtatsFlash.xlsx", buildXLSX(reportToSheets(flReport(st))), "xlsx", ""); } catch (e) { logErr("états flash Excel", e); toast("Export impossible : " + e.message); } },
  flEdit: () => { closeModal(); go("flashModeles"); },
  flSec: el => { flState().sec = el.dataset.v; render(); }
};
const FLCHG = { flF: el => { const st = flState(); const f = el.dataset.f; st[f] = el.type === "checkbox" ? el.checked : el.value; if (f === "sit" && el.value === "arr" && !st.arr) st.arr = todayISO() > exCur().fin ? exCur().fin : todayISO(); if (f === "mid") st.sec = ""; render(); } };
const _rmFL = renderModal;
renderModal = function () {
  const M = UI.modal; if (!M || M.type !== "flash") return _rmFL.apply(this, arguments);
  const st = flState(); const ms = flModeles(); const model = ms.find(x => x.id === st.mid) || ms[0]; const sits = brSituations(); let html = ""; try { html = flHTML(st); } catch (e) { logErr("états flash", e); html = `<div class="empty">Modèle invalide : ${esc(e.message)}</div>`; }
  return modalFrame("États flash", `<div class="fl-top"><b>${esc(S.nom.toUpperCase())}</b><span class="row" style="gap:4px">${model.sections.length > 1 ? [["", "Tout"]].concat(model.sections.map(s => [s.titre, s.titre.replace(/ - PCG.*/, "")])).map(([v, l]) => `<button class="btn sm ${st.sec === v ? "pri" : "ghost"}" data-act="flSec" data-v="${esc(v)}">${esc(l)}</button>`).join("") : ""}</span></div><div class="fl-box">${html}</div>`,
    `<div class="fl-foot"><label class="br-ctl"><span>État</span><select class="in" data-ch="flF" data-f="mid">${ms.map(m => `<option value="${m.id}" ${m.id === model.id ? "selected" : ""}>${esc(m.nom)}${m.org === "dossier" ? " (dossier)" : m.org === "logiciel" ? " (logiciel)" : ""}</option>`).join("")}</select></label>
      <label class="br-ctl"><span>Situation</span><select class="in" data-ch="flF" data-f="sit"><option value="ex" ${st.sit === "ex" ? "selected" : ""}>Exercice complet</option><option value="arr" ${st.sit === "arr" ? "selected" : ""}>À une date d'arrêté</option>${sits.map(s => `<option value="${s.id}" ${st.sit === s.id ? "selected" : ""}>${esc(s.nom)}</option>`).join("")}</select></label>
      ${st.sit === "arr" ? `<label class="br-ctl"><span>Arrêté au</span><input class="in" type="date" data-ch="flF" data-f="arr" value="${esc(st.arr)}"></label>` : ""}
      <label class="chk"><input type="checkbox" data-ch="flF" data-f="cmp" ${st.cmp ? "checked" : ""}> Comparaison N-1</label><label class="chk"><input type="checkbox" data-ch="flF" data-f="det" ${st.det ? "checked" : ""}> Détaillé</label><label class="chk"><input type="checkbox" data-ch="flF" data-f="arr0" ${st.arr0 ? "checked" : ""}> Arrondi</label>
      <span class="gr-sp"></span><button class="btn" data-act="flEdit">Créer / modifier mes états…</button><button class="btn" data-act="flXls">Excel</button><button class="btn pri" data-act="flPrint">Imprimer</button></div>`, true);
};

/* ---------- éditeur de modèles d'états flash ---------- */
function feState() { return UI.sub.fe ||= { id: "", m: null, org: "dossier" }; }
VIEWS.flashModeles = () => {
  const fe = feState(); const ms = flModeles(); const adm = isAdmin();
  const cur = fe.m; let ed = `<div class="card empty">Choisissez un modèle à gauche : dupliquez un modèle standard ou créez un état vide.</div>`;
  if (cur) {
    ed = `<div class="panel"><div class="card-h" style="flex-wrap:wrap;gap:8px"><input class="in" style="max-width:420px;font-weight:700" data-ch="feF" data-f="nom" value="${esc(cur.nom)}" placeholder="Nom de l'état">
      <div class="row">${adm ? `<select class="in" style="width:auto" data-ch="feOrg"><option value="dossier" ${fe.org === "dossier" ? "selected" : ""}>Enregistrer pour ce dossier</option><option value="logiciel" ${fe.org === "logiciel" ? "selected" : ""}>Modèle du logiciel (tous les dossiers)</option></select>` : ""}<button class="btn" data-act="feTest">Aperçu</button>${fe.id ? `<button class="btn danger" data-act="feDel">Supprimer</button>` : ""}<button class="btn pri" data-act="feSave">Enregistrer l'état</button></div></div>
      ${cur.sections.map((s, si) => `<div class="fe-sec"><div class="row" style="justify-content:space-between"><input class="in fe-st" data-ch="feS" data-s="${si}" value="${esc(s.titre)}" placeholder="Titre du tableau (ex. Actif)"><span class="row" style="gap:4px"><button class="btn sm ghost" data-act="feSecMv" data-s="${si}" data-d="-1" ${si ? "" : "disabled"}>↑</button><button class="btn sm ghost" data-act="feSecMv" data-s="${si}" data-d="1" ${si < cur.sections.length - 1 ? "" : "disabled"}>↓</button><button class="btn sm ghost danger" data-act="feSecDel" data-s="${si}">Supprimer le tableau</button></span></div>
        <table class="t fe-t"><thead><tr><th style="width:120px">Type</th><th style="width:70px">Code</th><th>Libellé</th><th>Comptes (rubrique) ou formule (total)</th><th style="width:150px">Signe</th><th style="width:110px"></th></tr></thead><tbody>${s.lignes.map((l, li) => `<tr class="fe-${l.ty}"><td><select class="in" data-ch="feL" data-s="${si}" data-l="${li}" data-f="ty"><option value="t" ${l.ty === "t" ? "selected" : ""}>Titre</option><option value="r" ${l.ty === "r" ? "selected" : ""}>Rubrique</option><option value="f" ${l.ty === "f" ? "selected" : ""}>Total / formule</option></select></td>
          <td>${l.ty === "t" ? "" : `<input class="in mono" data-ch="feL" data-s="${si}" data-l="${li}" data-f="code" value="${esc(l.code || "")}">`}</td><td><input class="in" data-ch="feL" data-s="${si}" data-l="${li}" data-f="lib" value="${esc(l.lib || "")}"></td>
          <td>${l.ty === "r" ? `<input class="in mono" data-ch="feL" data-s="${si}" data-l="${li}" data-f="cpt" value="${esc(l.cpt || "")}" placeholder="ex. 60,-603,6037 ou 401:C">` : l.ty === "f" ? `<input class="in mono" data-ch="feL" data-s="${si}" data-l="${li}" data-f="f" value="${esc(l.f || "")}" placeholder="ex. FR-GF">` : ""}</td>
          <td>${l.ty === "r" ? `<select class="in" data-ch="feL" data-s="${si}" data-l="${li}" data-f="sg"><option value="1" ${Number(l.sg) !== -1 ? "selected" : ""}>Débit - Crédit</option><option value="-1" ${Number(l.sg) === -1 ? "selected" : ""}>Crédit - Débit</option></select>` : ""}</td>
          <td class="r" style="white-space:nowrap"><button class="btn sm ghost" data-act="feLMv" data-s="${si}" data-l="${li}" data-d="-1">↑</button><button class="btn sm ghost" data-act="feLMv" data-s="${si}" data-l="${li}" data-d="1">↓</button><button class="btn sm ghost" data-act="feLAdd" data-s="${si}" data-l="${li}" title="Insérer une ligne dessous">+</button><button class="btn sm ghost danger" data-act="feLDel" data-s="${si}" data-l="${li}">✕</button></td></tr>`).join("")}</tbody></table>
        <button class="btn sm" data-act="feLAdd" data-s="${si}" data-l="${s.lignes.length - 1}">+ Ajouter une ligne</button></div>`).join("")}
      <div class="row" style="padding:12px"><button class="btn" data-act="feSecAdd">+ Ajouter un tableau</button><button class="btn ghost" data-act="feExport">Exporter le modèle (JSON)</button></div></div>
      ${fe.test ? `<div class="panel" style="padding:12px"><h3>Aperçu sur l'exercice en cours</h3>${(() => { try { const st = Object.assign({}, flState(), { mid: "__test", sec: "" }); const saveM = flModeles; const html = (function () { const m0 = flModeles; flModeles = () => m0().concat([Object.assign({}, cur, { id: "__test" })]); try { return flHTML(st); } finally { flModeles = m0; } })(); return html; } catch (e) { return `<div class="empty">Erreur : ${esc(e.message)}</div>`; } })()}</div>` : ""}`;
  }
  return `${adm && typeof admPublishBar === "function" ? admPublishBar() : ""}<div class="grid" style="grid-template-columns:minmax(260px,360px) minmax(0,1fr);gap:16px;align-items:start">
    <div class="panel"><div class="card-h"><h2>Mes états flash</h2></div><div class="lst">${ms.map(m => `<div class="ev ${fe.id === m.id ? "on" : ""}" style="${fe.id === m.id ? "background:var(--accent-soft)" : ""}"><div><b class="small">${esc(m.nom)}</b><div class="small muted">${m.std ? "Modèle standard" : m.org === "logiciel" ? "Modèle du logiciel" : "Modèle du dossier"} · ${m.sections.length} tableau(x)</div></div><span class="row" style="flex-wrap:nowrap;gap:4px">${m.std ? "" : `<button class="btn sm" data-act="feOpen" data-id="${m.id}">Modifier</button>`}<button class="btn sm ghost" data-act="feDup" data-id="${m.id}" title="Dupliquer pour personnaliser">Dupliquer</button></span></div>`).join("")}</div>
      <div class="row" style="padding:10px;gap:6px"><button class="btn pri sm" data-act="feNew">+ Nouvel état</button><label class="btn sm">Importer (JSON)<input type="file" accept=".json,application/json" hidden data-ch="feImp"></label><button class="btn sm" data-act="flashOpen">Ouvrir les États flash</button></div>
      <div class="small muted" style="padding:0 12px 12px;line-height:1.5"><b>Syntaxe des comptes</b><br>• <code>60</code> : tous les comptes commençant par 60<br>• <code>601-605</code> : plage de racines<br>• <code>-6037</code> : exclut une racine<br>• <code>401:C</code> : seulement si solde créditeur ; <code>:D</code> débiteur<br><b>Formules</b> : codes des lignes, ex. <code>FR-GF</code>, <code>AB+AC+AD</code></div></div>
    <div>${ed}</div></div>`;
};
const FEACT = {
  feNew: () => { const fe = feState(); fe.id = ""; fe.org = "dossier"; fe.test = false; fe.m = { id: uid(), nom: "Nouvel état flash", sections: [{ titre: "Tableau 1", lignes: [{ ty: "t", lib: "Titre" }, { ty: "r", code: "R1", lib: "Rubrique", cpt: "", sg: 1 }, { ty: "f", code: "T1", lib: "Total", f: "R1" }] }] }; render(); },
  feDup: el => { const m = flModeles().find(x => x.id === el.dataset.id); if (!m) return; const fe = feState(); fe.id = ""; fe.org = "dossier"; fe.test = false; fe.m = deep({ id: uid(), nom: m.nom + " (copie)", sections: m.sections }); render(); },
  feOpen: el => { const m = flModeles().find(x => x.id === el.dataset.id); if (!m) return; const fe = feState(); fe.id = m.id; fe.org = m.org || "dossier"; fe.test = false; const c = deep(m); delete c.org; fe.m = c; render(); },
  feTest: () => { feState().test = true; render(); },
  feSave: () => { const fe = feState(); const m = deep(fe.m); if (!m.nom) { toast("Nommez l'état."); return; }
    const codes = {}; for (const s of m.sections) for (const l of s.lignes) { if (l.code && l.ty !== "t") { if (codes[l.code]) { toast("Le code « " + l.code + " » est utilisé deux fois."); return; } codes[l.code] = 1; } }
    if (fe.org === "logiciel" && isAdmin()) { UI.cfg ||= deep(CONFIG); const L = UI.cfg.flashModeles ||= []; const i = L.findIndex(x => x.id === m.id); if (i >= 0) L[i] = m; else L.push(m); S.flashModeles = (S.flashModeles || []).filter(x => x.id !== m.id); toast("État enregistré comme modèle du logiciel : publiez pour le rendre disponible dans tous les dossiers."); }
    else { const L = S.flashModeles ||= []; const i = L.findIndex(x => x.id === m.id); if (i >= 0) L[i] = m; else L.push(m); if (UI.cfg && UI.cfg.flashModeles) UI.cfg.flashModeles = UI.cfg.flashModeles.filter(x => x.id !== m.id); toast("État « " + m.nom + " » enregistré pour ce dossier."); }
    Store.touch(); fe.id = m.id; flState().mid = m.id; render(); },
  feDel: () => { const fe = feState(); confirmBox("Supprimer l'état", "Le modèle « " + esc(fe.m.nom) + " » sera supprimé.", "Supprimer", () => { S.flashModeles = (S.flashModeles || []).filter(x => x.id !== fe.id); if (isAdmin()) { UI.cfg ||= deep(CONFIG); UI.cfg.flashModeles = (UI.cfg.flashModeles || []).filter(x => x.id !== fe.id); } Store.touch(); fe.id = ""; fe.m = null; if (flState().mid === fe.id) flState().mid = "std"; render(); }, true); },
  feSecAdd: () => { feState().m.sections.push({ titre: "Nouveau tableau", lignes: [{ ty: "r", code: "", lib: "", cpt: "", sg: 1 }] }); render(); },
  feSecDel: el => { const m = feState().m; m.sections.splice(Number(el.dataset.s), 1); render(); },
  feSecMv: el => { const L = feState().m.sections; const i = Number(el.dataset.s), j = i + Number(el.dataset.d); if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; render(); },
  feLAdd: el => { const s = feState().m.sections[Number(el.dataset.s)]; s.lignes.splice(Number(el.dataset.l) + 1, 0, { ty: "r", code: "", lib: "", cpt: "", sg: 1 }); render(); },
  feLDel: el => { const s = feState().m.sections[Number(el.dataset.s)]; s.lignes.splice(Number(el.dataset.l), 1); render(); },
  feLMv: el => { const L = feState().m.sections[Number(el.dataset.s)].lignes; const i = Number(el.dataset.l), j = i + Number(el.dataset.d); if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; render(); },
  feExport: () => { const m = feState().m; deliverFile("EtatFlash_" + m.nom.replace(/\W+/g, "_") + ".json", new TextEncoder().encode(JSON.stringify({ speedcomptaEtatFlash: 1, nom: m.nom, sections: m.sections }, null, 1)), "json", ""); }
};
const FECHG = {
  feF: el => { feState().m[el.dataset.f] = el.value; },
  feOrg: el => { feState().org = el.value; },
  feS: el => { feState().m.sections[Number(el.dataset.s)].titre = el.value; },
  feL: el => { const l = feState().m.sections[Number(el.dataset.s)].lignes[Number(el.dataset.l)]; const f = el.dataset.f; l[f] = f === "sg" ? Number(el.value) : f === "code" ? el.value.trim().toUpperCase() : el.value; if (f === "ty") render(); else if (feState().test) render(); },
  feImp: el => { const f = el.files[0]; el.value = ""; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); if (!j.sections) throw new Error("fichier sans tableaux"); const fe = feState(); fe.id = ""; fe.org = "dossier"; fe.m = { id: uid(), nom: j.nom || "État importé", sections: j.sections }; render(); toast("Modèle importé : vérifiez-le puis enregistrez."); } catch (e) { toast("Import impossible : " + e.message); } }); }
};

/* ---------- lettrage intégré à la balance (panneau des mouvements) ---------- */
/* période des mouvements affichés : N, N-1 (détail de l'exercice précédent) ou N et N-1 */
function brMvRange(st, P) { const m = st.mvP || (st.mvN1 ? "both" : "N"); if (!P.p1 || m === "N") return { from: P.du, to: P.au, m: "N" }; if (m === "N1") return { from: P.p1.du, to: P.p1.au, m }; return { from: P.p1.du, to: P.au, m: "both" }; }
function brSelLines() { const st = brState(); const { P, rows } = brRows(st); const sel = rows.find(r => r.k === st.sel); if (!sel) return { L: [], sel: null }; const aux = st.type !== "gen"; const RG = brMvRange(st, P); return { sel, L: flat({ from: RG.from, to: RG.to }).filter(({ l }) => aux ? l.aux === sel.num : l.compte === sel.k) }; }
function brSugg(sel, L) {
  if (!sel) return []; const open = L.filter(x => !x.l.lettre); const groups = {}; open.forEach(x => (groups[x.l.compte + "|" + (x.l.aux || "")] ||= []).push(x)); const out = [];
  for (const g of Object.values(groups)) { const used = new Set(); const add = (arr, why) => { if (arr.some(x => used.has(x.l.id))) return; arr.forEach(x => used.add(x.l.id)); out.push({ ids: arr.map(x => x.l.id), why }); };
    const byRef = {}; g.forEach(x => { const r = (x.e.piece || "").trim().toUpperCase(); if (r) (byRef[r] ||= []).push(x); }); for (const r in byRef) { const a = byRef[r]; if (a.length > 1 && a.reduce((s, x) => s + x.l.debit - x.l.credit, 0) === 0) add(a, "Pièce " + r); }
    for (const a of g) { if (used.has(a.l.id) || !a.l.debit) continue; const b = g.find(y => !used.has(y.l.id) && y !== a && y.l.credit === a.l.debit); if (b) add([a, b], eur(a.l.debit) + " €" + (a.l.aux ? " · " + a.l.aux : "")); }
    const R = g.filter(x => !used.has(x.l.id)).slice(0, 30); const Dd = R.filter(x => x.l.debit), Cc = R.filter(x => x.l.credit);
    const comb = arr => { const res = []; const rec = (i, cur, s) => { if (cur.length) res.push({ g: cur.slice(), s }); if (cur.length === 3) return; for (let j = i; j < arr.length && res.length < 3000; j++) { cur.push(arr[j]); rec(j + 1, cur, s + arr[j].l.debit + arr[j].l.credit); cur.pop(); } }; rec(0, [], 0); return res; };
    const mC = {}; comb(Cc).forEach(c => (mC[c.s] ||= []).push(c)); for (const d of comb(Dd)) { const m = (mC[d.s] || []).find(c => !c.g.some(x => used.has(x.l.id)) && !d.g.some(x => used.has(x.l.id)) && c.g.length + d.g.length > 2); if (m) add(d.g.concat(m.g), (d.g.length + m.g.length) + " lignes · " + eur(d.s) + " €"); } }
  return out;
}
Object.assign(BRACT, {
  brLTog: (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest(".br-open,.lt-code")) return; const st = brState(); const id = el.dataset.id; const x = flat().find(y => y.l.id === id); if (!x || x.l.lettre) return; const s = st.lsel ||= []; st.lsel = s.includes(id) ? s.filter(i => i !== id) : s.concat(id); render(); },
  brLAll: () => { const st = brState(); const { L } = brSelLines(); const lf = st.lf || "all"; const ids = L.filter(x => lf === "all" || (lf === "open" ? !x.l.lettre : !!x.l.lettre)).map(x => x.l.id); st.lsel = ids.every(i => (st.lsel || []).includes(i)) ? [] : ids; render(); },
  brLClear: () => { brState().lsel = []; render(); },
  brLF: el => { brState().lf = el.dataset.v; render(); },
  brMvP: el => { const st = brState(); st.mvP = el.dataset.v; st.mvN1 = false; st.lsel = []; render(); },
  brN1: el => { const st = brState(); st.sel = el.dataset.k; st.mvP = "N1"; st.mvN1 = false; st.lsel = []; render(); },
  brLGo: () => { const st = brState(); const err = lettrer(st.lsel || []); if (err) { toast(err); return; } toast("Lignes lettrées ✓"); st.lsel = []; render(); },
  brLPart: () => { const st = brState(); const err = ltLetter(st.lsel || [], true); if (err) { toast(err); return; } toast("Lettrage partiel enregistré."); st.lsel = []; render(); },
  brLEcart: () => { const st = brState(); ltState().sel = st.lsel || []; LTACT.ltEcart(); st.lsel = []; ltState().sel = []; render(); },
  brLDel: (el, ev) => { if (ev) ev.stopPropagation(); const c = el.dataset.c; confirmBox("Délettrer", `Le lettrage <b>${esc(c)}</b> sera supprimé : les lignes redeviennent ouvertes.`, "Délettrer", () => { flat().forEach(x => { if (x.l.lettre === c) { x.l.lettre = ""; x.l.dateLet = ""; saveEcr(x.e); } }); Store.touch(); toast("Lettrage " + c + " supprimé."); render(); }); },
  brLSugSel: el => { const st = brState(); const { sel, L } = brSelLines(); const s = brSugg(sel, L)[Number(el.dataset.i)]; if (s) { st.lsel = s.ids; render(); } },
  brLSugOk: el => { const st = brState(); const { sel, L } = brSelLines(); const s = brSugg(sel, L)[Number(el.dataset.i)]; if (!s) return; const err = lettrer(s.ids); toast(err || "Lettré ✓"); st.lsel = []; render(); },
  brLAuto: () => { const st = brState(); let n = 0; for (let g = 0; g < 200; g++) { const { sel, L } = brSelLines(); const s = brSugg(sel, L)[0]; if (!s || lettrer(s.ids)) break; n++; } toast(n ? n + " lettrage(s) effectué(s) ✓" : "Aucune correspondance."); st.lsel = []; render(); },
  brLAutoAll: () => { const st = brState(); const { rows } = brRows(st); let n = 0; const keep = st.sel; for (const r of rows) { st.sel = r.k; for (let g = 0; g < 100; g++) { const { sel, L } = brSelLines(); const s = brSugg(sel, L)[0]; if (!s || lettrer(s.ids)) break; n++; } } st.sel = keep; st.lsel = []; toast(n ? n + " lettrage(s) automatique(s) effectué(s) ✓" : "Aucune nouvelle correspondance."); render(); }
});

Object.assign(BRACT, {
  brLEdit: (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest(".br-open,.lt-code,.br-chk")) return; const e = E.find(x => x.id === el.dataset.e); if (e) gEdOpen(e); },
  brSide: (el, ev) => { if (ev) ev.stopPropagation(); const st = brState(); if (st.sel !== el.dataset.k) st.lsel = []; st.sel = el.dataset.k; st.side = true; st.tab = el.dataset.v || "rev"; render(); },
  brSideT: () => { const st = brState(); st.side = !st.side; render(); },
  brSideX: () => { brState().side = false; render(); }
});

Object.assign(BRACT, {
  brLClick: (el, ev) => {
    if (ev && ev.target && ev.target.closest && ev.target.closest(".br-open,.lt-code")) return;
    const st = brState(); const id = el.dataset.id; const now = Date.now();
    if (UI.brLast && UI.brLast.id === id && now - UI.brLast.t < 450) { UI.brLast = null; const s0 = st.lsel || []; st.lsel = UI.brLast0 || s0; const e = E.find(x => x.id === el.dataset.e); if (e) gEdOpen(e); return; }
    UI.brLast = { id, t: now }; UI.brLast0 = (st.lsel || []).slice();
    const s = st.lsel || []; st.lsel = s.includes(id) ? s.filter(i => i !== id) : s.concat(id); render();
  },
  brLUn: () => { const st = brState(); const ids = new Set(st.lsel || []); const codes = new Set(); flat().forEach(x => { if (ids.has(x.l.id) && x.l.lettre) codes.add(x.l.compte + "|" + (x.l.aux || "") + "|" + x.l.lettre); });
    if (!codes.size) return; const lab = [...codes].map(c => c.split("|")[2]).join(", ");
    confirmBox("Délettrer", `Le(s) lettrage(s) <b>${esc(lab)}</b> seront supprimés : toutes les lignes concernées redeviennent ouvertes.`, "Délettrer", () => { let n = 0; flat().forEach(x => { if (x.l.lettre && codes.has(x.l.compte + "|" + (x.l.aux || "") + "|" + x.l.lettre)) { x.l.lettre = ""; x.l.dateLet = ""; n++; saveEcr(x.e); } }); Store.touch(); st.lsel = []; toast(n + " ligne(s) délettrée(s) ✓"); render(); }); }
});

/* ---------- onglets Révision & lettrage / Éditions dans chaque balance ---------- */
function brModeSw(st) { return `<span class="br-mode"><button class="${st.mode !== "edit" ? "on" : ""}" data-act="brMode" data-v="rev">Révision</button><button class="${st.mode === "edit" ? "on" : ""}" data-act="brMode" data-v="edit">Éditions</button></span>`; }
function brEditions() {
  const st = brState(); const ex = exCur(); const P = brPeriod(st, ex);
  const c = UI.sub.consult = Object.assign({ tab: "bal", compte: "", aux: "", from: P.du, to: P.au, open: false, bal: "G", journal: "" }, UI.sub.consult || {}); c.tab = "bal"; c.bal = st.type === "cli" ? "C" : st.type === "fou" ? "F" : "G"; if (!c.from || c.from < ex.debut || c.from > ex.fin) c.from = P.du; if (!c.to || c.to > ex.fin || c.to < ex.debut) c.to = P.au;
  let body = ""; try { body = balView(c); } catch (e) { logErr("édition balance", e); body = `<div class="empty">Édition indisponible : ${esc(e.message)}</div>`; }
  return `<div class="br-wrap"><div class="br-title">${brModeSw(st)}<b>${BR_TYPES[st.type]} · éditions</b> : ${esc(S.nom.toUpperCase())}<span class="br-prog">${frDate(c.from)} - ${frDate(c.to)}</span></div>
  <div class="br-bar"><label class="br-ctl"><span>Type</span><select class="in" data-ch="brSet" data-f="type">${Object.entries(BR_TYPES).map(([k, l]) => `<option value="${k}" ${k === st.type ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="br-ctl"><span>Du</span><input class="in" type="date" value="${c.from}" data-ch="cF" data-f="from"></label><label class="br-ctl"><span>Au</span><input class="in" type="date" value="${c.to}" data-ch="cF" data-f="to"></label>
    <span class="gr-sp"></span><button class="btn sm" data-act="exportConsult">Excel (CSV)</button><button class="btn sm pri" data-act="consultPdf">${ico("doc")} Imprimer / PDF</button></div>
  <div style="padding:12px">${body}</div></div>`;
}
Object.assign(BRACT, { brMode: el => { brState().mode = el.dataset.v; render(); } });

/* ---------- filtres des colonnes du volet des mouvements ---------- */
function brNumMatch(v, x) { if (!v) return true; const s = String(v).replace(/\s/g, "").replace(",", "."); const m = s.match(/^([<>]=?)?(-?\d+(\.\d+)?)$/); if (!m) return eur(x).replace(/\s| /g, "").includes(s.replace(".", ",")); const t = Math.round(Number(m[2]) * 100); return m[1] === ">" ? x > t : m[1] === ">=" ? x >= t : m[1] === "<" ? x < t : m[1] === "<=" ? x <= t : x === t; }
function brMvMatch(f, x) {
  const { e, l } = x; const has = (a, b) => !b || String(a || "").toUpperCase().includes(String(b).trim().toUpperCase());
  if (f.jal && e.journal !== f.jal) return false;
  if (f.date && !has(frDate(e.date), f.date)) return false;
  if (!has(e.piece, f.piece)) return false;
  if (f.lib && !has((l.lib || "") + " " + (e.libelle || ""), f.lib)) return false;
  if (f.ech && !has(e.ech ? frDate(e.ech) : "", f.ech)) return false;
  if (f.deb && !(l.debit && brNumMatch(f.deb, l.debit))) return false;
  if (f.cre && !(l.credit && brNumMatch(f.cre, l.credit))) return false;
  if (f.let && !(f.let === "*" ? !!l.lettre : f.let === "-" ? !l.lettre : has(l.lettre, f.let))) return false;
  return true;
}
function brMvFilters(st, L) {
  const f = st.mf || {}; const jx = [...new Set(L.map(x => x.e.journal))].sort();
  const inp = (k, ph) => `<input class="in br-fi" id="mvf-${k}" data-mvf="${k}" value="${esc(f[k] || "")}" placeholder="${ph || ""}" autocomplete="off">`;
  const any = Object.values(f).some(Boolean);
  return `<tr class="br-frow br-mvf"><th>${any ? `<a href="#" data-act="brMvRaz" title="Effacer les filtres">✕</a>` : ""}</th><th><select class="in br-fi" data-ch="brMvF" data-f="jal"><option value="">Tous</option>${jx.map(j => `<option ${f.jal === j ? "selected" : ""}>${esc(j)}</option>`).join("")}</select></th><th>${inp("date", "jj/mm")}</th><th>${inp("piece")}</th><th>${inp("lib", "Filtrer…")}</th><th>${inp("ech")}</th><th>${inp("deb", "> 100")}</th><th>${inp("cre")}</th><th><select class="in br-fi" data-ch="brMvF" data-f="let"><option value="">Tous</option><option value="*" ${f.let === "*" ? "selected" : ""}>Lettrées</option><option value="-" ${f.let === "-" ? "selected" : ""}>Non lettrées</option></select></th><th></th><th></th></tr>`;
}
let brMvT; document.addEventListener("input", ev => { const el = ev.target; if (!el.dataset || !el.dataset.mvf) return; clearTimeout(brMvT); brMvT = setTimeout(() => { (brState().mf ||= {})[el.dataset.mvf] = el.value; render(); }, 250); });
Object.assign(BRCHG, { brMvF: el => { (brState().mf ||= {})[el.dataset.f] = el.value; render(); } });
Object.assign(BRACT, { brMvRaz: () => { brState().mf = {}; render(); } });
