/* ============================================================
   LETTRAGE : clients, fournisseurs et comptes généraux
   Liste des comptes à lettrer · lignes ouvertes · sélection avec totaux · lettrage total,
   partiel, avec écart (OD automatique) · propositions automatiques (pièce, montant,
   combinaisons) · délettrage.
   ============================================================ */
function ltState() { return UI.sub.let ||= { type: "C", k: "", f: "open", q: "", sel: [], per: "all" }; }
function ltAccounts(st) {
  const out = {}; const isT = st.type !== "G";
  for (const { e, l } of flat()) {
    let k;
    if (isT) { if (!l.aux) continue; const t = tiersBy(l.aux); const typ = t ? t.type : (l.compte.startsWith("41") ? "C" : l.compte.startsWith("40") ? "F" : ""); if (typ !== st.type) continue; k = "T:" + l.aux; }
    else { if (l.aux) continue; if (!/^(4|5[18]|47)/.test(l.compte) && !/^(16|26|27)/.test(l.compte)) continue; k = l.compte; }
    const a = out[k] ||= { k, n: 0, s: 0, open: 0, nOpen: 0 }; a.n++; a.s += l.debit - l.credit; if (!l.lettre) { a.open += l.debit - l.credit; a.nOpen++; }
  }
  return Object.values(out).map(a => { if (a.k.startsWith("T:")) { const t = tiersBy(a.k.slice(2)); a.code = a.k.slice(2); a.nom = t ? t.nom : a.code; a.col = t ? t.collectif : ""; } else { a.code = a.k; a.nom = accLib(a.k); } return a; })
    .filter(a => !st.q || (a.code + " " + a.nom).toUpperCase().includes(st.q.toUpperCase())).sort((a, b) => (b.nOpen ? 1 : 0) - (a.nOpen ? 1 : 0) || a.code.localeCompare(b.code));
}
function ltLines(k) { const isT = k.startsWith("T:"); const code = isT ? k.slice(2) : k; return flat().filter(({ l }) => isT ? l.aux === code : (l.compte === code && !l.aux)).sort((a, b) => a.e.date.localeCompare(b.e.date) || (a.e.piece || "").localeCompare(b.e.piece || "")); }
/* propositions : même pièce, montants égaux, combinaison de 2 à 4 lignes */
function ltSuggest(k) {
  const open = ltLines(k).filter(x => !x.l.lettre); const out = []; const used = new Set();
  const add = (g, why) => { if (g.some(x => used.has(x.l.id))) return; g.forEach(x => used.add(x.l.id)); out.push({ ids: g.map(x => x.l.id), why, tot: g.reduce((a, x) => a + x.l.debit + x.l.credit, 0) / 2 }); };
  const byRef = {}; open.forEach(x => { const r = (x.e.piece || "").trim().toUpperCase(); if (r) (byRef[r] ||= []).push(x); });
  for (const r in byRef) { const g = byRef[r]; if (g.length > 1 && g.reduce((a, x) => a + x.l.debit - x.l.credit, 0) === 0) add(g, "Même pièce « " + r + " »"); }
  const rest = () => open.filter(x => !used.has(x.l.id));
  for (const a of rest()) { if (used.has(a.l.id) || !a.l.debit) continue; const b = rest().find(y => y !== a && y.l.credit === a.l.debit); if (b) add([a, b], "Même montant (" + eur(a.l.debit) + " €)"); }
  const R = rest().slice(0, 40); const D = R.filter(x => x.l.debit), C = R.filter(x => x.l.credit);
  const combos = (arr, max) => { const res = []; const rec = (i, cur, s) => { if (cur.length && cur.length <= max) res.push({ g: cur.slice(), s }); if (cur.length === max) return; for (let j = i; j < arr.length && res.length < 4000; j++) { cur.push(arr[j]); rec(j + 1, cur, s + arr[j].l.debit + arr[j].l.credit); cur.pop(); } }; rec(0, [], 0); return res; };
  const cD = combos(D, 3), cC = combos(C, 3); const mapC = {}; cC.forEach(c => (mapC[c.s] ||= []).push(c));
  for (const d of cD) { if (d.g.length + 1 > 5) continue; const m = (mapC[d.s] || []).find(c => !c.g.some(x => used.has(x.l.id)) && !d.g.some(x => used.has(x.l.id)) && c.g.length + d.g.length > 2); if (m) add(d.g.concat(m.g), "Combinaison de " + (d.g.length + m.g.length) + " lignes (" + eur(d.s) + " €)"); }
  return out;
}
function ltLetter(ids, partial) {
  if (!partial) return lettrer(ids);
  const items = flat().filter(x => ids.includes(x.l.id)); if (items.length < 2) return "Sélectionnez au moins deux lignes.";
  const code = letCode(S.letSeq++).toLowerCase(); items.forEach(x => { x.l.lettreP = code; saveEcr(x.e); }); Store.touch(); return "";
}
VIEWS.lettrage = () => {
  const st = ltState(); const accs = ltAccounts(st); if (!st.k || !accs.some(a => a.k === st.k)) { st.k = (accs.find(a => a.nOpen) || accs[0] || {}).k || ""; st.sel = []; }
  const cur = accs.find(a => a.k === st.k);
  const L = st.k ? ltLines(st.k) : []; const vis = L.filter(x => st.f === "all" || (st.f === "open" ? !x.l.lettre : !!x.l.lettre));
  let run = 0; const selSet = new Set(st.sel); let sd = 0, sc = 0; L.forEach(x => { if (selSet.has(x.l.id)) { sd += x.l.debit; sc += x.l.credit; } });
  const ecart = sd - sc; const today = todayISO(); const seuil = Math.round((Number(MC("compta", "letEcart") ?? 5)) * 100);
  const rows = vis.map(x => { run += x.l.debit - x.l.credit; const ech = x.e.ech || ""; const late = !x.l.lettre && ech && ech < today && ((st.type === "C" && x.l.debit) || (st.type === "F" && x.l.credit));
    return `<tr class="lt-r ${selSet.has(x.l.id) ? "on" : ""} ${x.l.lettre ? "lt-done" : ""}" data-act="ltTog" data-id="${x.l.id}"><td class="c">${x.l.lettre ? "" : `<input type="checkbox" ${selSet.has(x.l.id) ? "checked" : ""} tabindex="-1">`}</td><td class="mono">${frDate(x.e.date)}</td><td class="mono small">${esc(x.e.journal)}</td><td class="mono small">${esc(x.e.piece || "")}</td><td class="lt-lib" title="${esc(x.l.lib || x.e.libelle || "")}">${esc(x.l.lib || x.e.libelle || "")}</td><td class="mono small ${late ? "lt-late" : ""}">${ech ? frDate(ech) : ""}</td><td class="r mono">${x.l.debit ? eur(x.l.debit) : ""}</td><td class="r mono">${x.l.credit ? eur(x.l.credit) : ""}</td>
      <td class="c">${x.l.lettre ? `<a href="#" class="lt-code" data-act="ltDel" data-c="${esc(x.l.lettre)}" title="Délettrer ${esc(x.l.lettre)}">${esc(x.l.lettre)}</a>` : x.l.lettreP ? `<span class="lt-codep" title="Lettrage partiel">${esc(x.l.lettreP)}</span>` : ""}</td><td class="r mono small">${eur(run)}</td></tr>`; }).join("");
  const sugg = st.k ? ltSuggest(st.k) : [];
  const typeLab = { C: "Clients", F: "Fournisseurs", G: "Comptes généraux" };
  return `<div class="topbar"><div><div class="eyebrow">Comptabilité · lettrage</div><h1>Lettrage</h1><p class="lead">Rapprochez factures et règlements : cochez des lignes dont le solde est nul, ou acceptez les propositions automatiques.</p></div><div class="row"><button class="btn" data-act="ltAutoAll">⚡ Lettrage automatique (${typeLab[st.type].toLowerCase()})</button></div></div>
  <div class="lt-wrap">
    <aside class="lt-side"><div class="seg" style="margin-bottom:8px">${Object.entries(typeLab).map(([k, l]) => `<button class="${st.type === k ? "on" : ""}" data-act="ltType" data-v="${k}">${l}</button>`).join("")}</div>
      <input class="in" placeholder="🔎 Rechercher" value="${esc(st.q)}" data-ltq="1" id="ltQ" autocomplete="off">
      <div class="lt-list">${accs.map(a => `<a href="#" class="lt-acc ${a.k === st.k ? "on" : ""}" data-act="ltPick" data-k="${esc(a.k)}"><span><b class="mono">${esc(a.code)}</b><small>${esc(a.nom)}</small></span><span class="r">${a.nOpen ? `<span class="lt-badge">${a.nOpen}</span>` : `<span class="lt-ok">✓</span>`}<small class="mono">${eur(a.open)}</small></span></a>`).join("") || `<div class="empty small">Aucun compte.</div>`}</div></aside>
    <section class="lt-main">${!cur ? `<div class="empty">Aucun compte à lettrer.</div>` : `
      <div class="lt-head"><div><b class="mono">${esc(cur.code)}</b> ${esc(cur.nom)}${cur.col ? ` <span class="small muted">· ${esc(cur.col)}</span>` : ""}<div class="small muted">Solde ${eur(cur.s)} € · non lettré ${eur(cur.open)} € (${cur.nOpen} ligne(s))</div></div>
        <div class="row"><div class="seg">${[["open", "Non lettrées"], ["done", "Lettrées"], ["all", "Toutes"]].map(([k, l]) => `<button class="${st.f === k ? "on" : ""}" data-act="ltF" data-v="${k}">${l}</button>`).join("")}</div><button class="btn sm" data-act="ltAuto">⚡ Lettrer automatiquement</button></div></div>
      ${sugg.length ? `<div class="lt-sugg"><b>💡 ${sugg.length} proposition(s)</b>${sugg.slice(0, 6).map((s, i) => `<span class="lt-sg"><span>${esc(s.why)}</span><button class="btn sm" data-act="ltSugSel" data-i="${i}">Voir</button><button class="btn sm pri" data-act="ltSugOk" data-i="${i}">Lettrer</button></span>`).join("")}${sugg.length > 1 ? `<button class="btn sm pri" data-act="ltSugAll">Tout accepter</button>` : ""}</div>` : ""}
      <div class="lt-grid"><table class="t lt-t"><thead><tr><th style="width:30px"><input type="checkbox" data-act="ltAll" ${vis.filter(x => !x.l.lettre).length && vis.filter(x => !x.l.lettre).every(x => selSet.has(x.l.id)) ? "checked" : ""}></th><th>Date</th><th>Jal</th><th>Pièce</th><th>Libellé</th><th>Échéance</th><th class="r">Débit</th><th class="r">Crédit</th><th class="c">Lettre</th><th class="r">Solde</th></tr></thead><tbody>${rows || `<tr><td colspan="10" class="empty">${st.f === "open" ? "Tout est lettré sur ce compte ✓" : "Aucune ligne."}</td></tr>`}</tbody></table></div>
      <div class="lt-bar ${st.sel.length ? "on" : ""}"><span><b>${st.sel.length}</b> ligne(s) · Débit <b class="mono">${eur(sd)}</b> · Crédit <b class="mono">${eur(sc)}</b> · Écart <b class="mono ${ecart ? "lt-ko" : "lt-okc"}">${eur(ecart)}</b></span><span class="row">
        <button class="btn sm ghost" data-act="ltClear" ${st.sel.length ? "" : "disabled"}>Désélectionner</button>
        <button class="btn sm" data-act="ltPart" ${st.sel.length > 1 && ecart && sd && sc ? "" : "disabled"} title="Marque les lignes comme partiellement rapprochées (lettre minuscule), elles restent ouvertes">Lettrage partiel</button>
        ${ecart && Math.abs(ecart) <= seuil ? `<button class="btn sm" data-act="ltEcart" title="Passe une OD d'écart de règlement (${ecart > 0 ? "658000" : "758000"}) puis lettre">Lettrer avec écart (${eur(Math.abs(ecart))} €)</button>` : ""}
        <button class="btn sm pri" data-act="ltGo" ${st.sel.length > 1 && !ecart ? "" : "disabled"}>✓ Lettrer</button></span></div>`}
    </section></div>`;
};
let ltQT; document.addEventListener("input", ev => { if (!ev.target.dataset || !ev.target.dataset.ltq) return; clearTimeout(ltQT); const v = ev.target.value; ltQT = setTimeout(() => { ltState().q = v; render(); }, 200); });
const LTACT = {
  ltType: el => { const st = ltState(); st.type = el.dataset.v; st.k = ""; st.sel = []; render(); },
  ltPick: el => { const st = ltState(); st.k = el.dataset.k; st.sel = []; render(); },
  ltF: el => { ltState().f = el.dataset.v; render(); },
  ltTog: el => { const st = ltState(); const id = el.dataset.id; const x = flat().find(y => y.l.id === id); if (!x || x.l.lettre) return; st.sel = st.sel.includes(id) ? st.sel.filter(i => i !== id) : st.sel.concat(id); render(); },
  ltAll: () => { const st = ltState(); const ids = ltLines(st.k).filter(x => !x.l.lettre).map(x => x.l.id); st.sel = ids.every(i => st.sel.includes(i)) ? [] : ids; render(); },
  ltClear: () => { ltState().sel = []; render(); },
  ltGo: () => { const st = ltState(); const err = lettrer(st.sel); if (err) { toast(err); return; } toast("Lignes lettrées ✓"); st.sel = []; render(); },
  ltPart: () => { const st = ltState(); const err = ltLetter(st.sel, true); if (err) { toast(err); return; } toast("Lettrage partiel enregistré."); st.sel = []; render(); },
  ltEcart: () => { const st = ltState(); const items = flat().filter(x => st.sel.includes(x.l.id)); const ec = items.reduce((a, x) => a + x.l.debit - x.l.credit, 0); if (!ec) return; const x0 = items[0].l; const ex = exCur(); const date = items.reduce((a, x) => x.e.date > a ? x.e.date : a, ""); const d = canWriteAt(date) ? (todayISO() > ex.fin ? ex.fin : todayISO()) : date;
    const lib = "Écart de règlement " + (x0.aux || x0.compte); const L = ec > 0 ? [[x0.compte, x0.aux, lib, 0, ec], ["658000", "", lib, ec, 0]] : [[x0.compte, x0.aux, lib, -ec, 0], ["758000", "", lib, 0, -ec]];
    const e = addEcr(mkEcr({ journal: jByType ? jByType("OD", "OD") : "OD", date: d, piece: "ECART", libelle: lib, lignes: L })); const nl = e.lignes[0]; const err = lettrer(st.sel.concat(nl.id)); if (err) { toast(err); return; } toast("OD d'écart passée (" + eur(Math.abs(ec)) + " €) et lignes lettrées ✓"); st.sel = []; render(); },
  ltDel: (el, ev) => { if (ev) ev.stopPropagation(); const st = ltState(); const c = el.dataset.c; confirmBox("Délettrer", `Le lettrage <b>${esc(c)}</b> sera supprimé : les lignes redeviennent ouvertes.`, "Délettrer", () => { flat().forEach(x => { if (x.l.lettre === c) { x.l.lettre = ""; x.l.dateLet = ""; saveEcr(x.e); } }); Store.touch(); toast("Lettrage " + c + " supprimé."); render(); }); },
  ltSugSel: el => { const st = ltState(); const s = ltSuggest(st.k)[Number(el.dataset.i)]; if (s) { st.sel = s.ids; st.f = "open"; render(); } },
  ltSugOk: el => { const st = ltState(); const s = ltSuggest(st.k)[Number(el.dataset.i)]; if (!s) return; const err = lettrer(s.ids); toast(err || "Lettré ✓ (" + s.why + ")"); st.sel = []; render(); },
  ltSugAll: () => { const st = ltState(); let n = 0; for (let g = 0; g < 50; g++) { const s = ltSuggest(st.k)[0]; if (!s || lettrer(s.ids)) break; n++; } toast(n + " lettrage(s) effectué(s) ✓"); st.sel = []; render(); },
  ltAuto: () => { const st = ltState(); let n = 0; for (let g = 0; g < 200; g++) { const s = ltSuggest(st.k)[0]; if (!s || lettrer(s.ids)) break; n++; } toast(n ? n + " lettrage(s) effectué(s) ✓" : "Aucune correspondance trouvée sur ce compte."); render(); },
  ltAutoAll: () => { const st = ltState(); let n = 0; for (const a of ltAccounts(Object.assign({}, st, { q: "" }))) { if (!a.nOpen) continue; for (let g = 0; g < 200; g++) { const s = ltSuggest(a.k)[0]; if (!s || lettrer(s.ids)) break; n++; } } toast(n ? n + " lettrage(s) effectué(s) automatiquement ✓" : "Aucune nouvelle correspondance trouvée."); render(); }
};

/* l'ancien écran de lettrage renvoie vers les balances (lettrage intégré) */
VIEWS.lettrage = () => { const t = (UI.sub.let || {}).type || "C"; const st = brState(); st.type = t === "F" ? "fou" : t === "C" ? "cli" : "gen"; st.lf = "open"; UI.view = "balrev"; try { localStorage.setItem("sc:view", "balrev"); } catch (e) { } return VIEWS.balrev(); };
