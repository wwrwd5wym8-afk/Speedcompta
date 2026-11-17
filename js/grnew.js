/* ============================================================================
   Saisie moderne d'une écriture (journal du mois) : volet « Nouvelle écriture »
   - en-tête : journal, date, n° de pièce automatique, libellé, échéance
   - lignes : compte ou tiers (comptes les plus utilisés, création à la volée), libellé,
     débit / crédit, TVA calculée en un clic, ligne d'équilibre automatique
   - contrepartie suggérée selon le journal et le tiers, compte de charge appris du tiers
   - justificatif : dépôt d'un PDF / photo, lu pour préremplir, aperçu de l'original
   - modèles (récupérer une écriture précédente du même tiers), raccourcis clavier :
     Ctrl+Entrée enregistrer, Ctrl+Maj+Entrée enregistrer et nouvelle, Ctrl+L ligne,
     = solder, Ctrl+B équilibrer, Alt+T TVA, Échap fermer, F1 aide
   - brouillon conservé si le volet est fermé par erreur
   ========================================================================== */
function gnJ() { return (UI.gne && UI.gne.journal) || gState().j; }
function gnLine(o) { return Object.assign({ id: uid(), compte: "", lib: "", d: "", c: "", taux: "" }, o || {}); }
function gnBlank() { const g = gState(); const j = g.j; const date = typeof gDefDate === "function" ? gDefDate(g) : todayISO();
  return { journal: j, date, piece: typeof jrNextPiece === "function" ? jrNextPiece(j, date) : "", lib: "", ech: "", lines: [gnLine(), gnLine()], docs: [], edit: null, help: false }; }
function gnTot(N) { let d = 0, c = 0; N.lines.forEach(l => { d += cents(l.d); c += cents(l.c); }); return { d, c, s: d - c }; }
function gnRes(v) { return v ? resolveCompte(v) : { compte: "", aux: "" }; }
function gnTypeJ() { return (journalBy(gnJ()) || {}).type; }
/* contrepartie par défaut du journal (banque, caisse) */
function gnCp() { const j = journalBy(gnJ()) || {}; return j.compte || (j.type === "BQ" ? "512000" : j.type === "CAI" ? "530000" : ""); }
/* après le choix d'un tiers : compte de charge / produit appris et TVA */
function gnAutoFromTiers(N, i) { const l = N.lines[i]; const r = gnRes(l.compte); if (!r.aux) return; const t = tiersBy(r.aux); const jt = gnTypeJ(); if (!t) return;
  if (!N.lib) N.lib = t.nom + (N.piece ? " - " + N.piece : "");
  if (!l.lib) l.lib = t.nom;
  if (jt !== "ACH" && jt !== "VEN") return; const vente = jt === "VEN"; const others = N.lines.filter((x, k) => k !== i && x.compte); if (others.length) return;
  const cpt = (typeof learnedAccount === "function" && learnedAccount(t.code, vente ? "V" : "A")) || (t.defaut && !/^(607000|601000|706000|707000)$/.test(t.defaut) ? t.defaut : "") || t.defaut || (vente ? "706000" : "607000");
  const tx = t.taux != null ? Number(t.taux) : 2000;
  const rest = N.lines.slice(i + 1).filter(x => !x.compte); if (!rest.length) N.lines.push(gnLine());
  const k = N.lines.findIndex((x, n) => n > i && !x.compte); N.lines[k].compte = cpt; N.lines[k].lib = t.nom; N.lines[k].taux = String(tx); N._auto = { t: t.code, k, tx };
}
/* le montant TTC saisi sur le tiers ventile automatiquement HT + TVA */
function gnVentile(N) { const a = N._auto; if (!a) return; const tl = N.lines.find(l => gnRes(l.compte).aux === a.t); if (!tl) return; const jt = gnTypeJ(); const ttc = cents(jt === "VEN" ? tl.d : tl.c); if (!ttc) return;
  const ht = Math.round(ttc * 10000 / (10000 + a.tx)), tva = ttc - ht; const hl = N.lines[a.k]; if (!hl) return; if (jt === "VEN") { hl.c = toIn(ht); hl.d = ""; } else { hl.d = toIn(ht); hl.c = ""; }
  N.lines = N.lines.filter(l => !l._tva); if (tva) { const acc = jt === "VEN" ? (TVA_COLL[a.tx] || "445710") : (String(hl.compte).startsWith("2") ? "445620" : "445660"); const tvl = gnLine({ compte: acc, lib: "TVA " + (TAUX_LIB[a.tx] || ""), _tva: true }); if (jt === "VEN") tvl.c = toIn(tva); else tvl.d = toIn(tva); N.lines.splice(a.k + 1, 0, tvl); }
  if (!N.lines.some(l => !l.compte && !l.d && !l.c)) N.lines.push(gnLine()); }
function gnCheck(N) { const P = []; const T = gnTot(N); const L = N.lines.filter(l => l.compte || cents(l.d) || cents(l.c));
  if (!N.date) P.push("Date manquante."); else { const w = canWriteAt(N.date); if (w) P.push(w); }
  if (L.length < 2) P.push("Au moins deux lignes."); if (L.some(l => !l.compte)) P.push("Compte manquant sur une ligne."); if (L.some(l => !cents(l.d) && !cents(l.c))) P.push("Montant manquant sur une ligne.");
  if (T.s) P.push("Écriture déséquilibrée : écart de " + eur(Math.abs(T.s)) + " €."); return P; }
function gnDocHTML(N) { if (!N.docs.length) return `<label class="gn-drop" id="gnDrop"><input type="file" multiple hidden accept=".pdf,image/*,.xml" data-ch="gnFile"><b>📎 Justificatif</b><span>Déposez la facture (PDF, photo) : elle est lue et préremplit l'écriture</span></label>`;
  const d = N.docs[N.di || 0]; return `<div class="gn-doc"><div class="gn-dbar">${N.docs.map((x, i) => `<button class="gn-dt ${i === (N.di || 0) ? "on" : ""}" data-act="gnDoc" data-i="${i}">📄 ${esc(x.nom)}</button>`).join("")}<label class="gn-dt" title="Ajouter un autre fichier">＋<input type="file" multiple hidden accept=".pdf,image/*" data-ch="gnFile"></label><span style="flex:1"></span><a class="gn-dt" href="${d.url}" target="_blank" rel="noopener" title="Ouvrir en grand">↗</a><button class="gn-dt" data-act="gnDocDel" data-i="${N.di || 0}" title="Retirer">✕</button></div>${d.pdf ? `<iframe src="${d.url}#view=FitH" title="Justificatif"></iframe>` : `<img src="${d.url}" alt="Justificatif">`}${d.lu ? `<div class="gn-lu">✨ ${esc(d.lu)}</div>` : ""}</div>`; }
function gnHTML() { const N = UI.gne; if (!N) return ""; const T = gnTot(N); const P = gnCheck(N); const j = journalBy(N.journal) || {}; const ok = !P.length;
  const prev = !N.edit && N.lines.some(l => gnRes(l.compte).aux) ? (() => { const a = N.lines.map(l => gnRes(l.compte).aux).find(Boolean); const last = E.filter(e => e.journal === N.journal && e.lignes.some(l => l.aux === a)).sort((x, y) => y.date.localeCompare(x.date))[0]; return last ? `<button class="gn-chip" data-act="gnCopy" data-id="${last.id}" title="Reprendre les comptes et la répartition de la dernière écriture de ce tiers">↺ Comme le ${frDate(last.date)} (${eur(ecrTotals(last).d)} €)</button>` : ""; })() : "";
  return `<div class="gn-bg" data-act="gnClose"></div><section class="gn" role="dialog" aria-label="${N.edit ? "Modifier l'écriture" : "Nouvelle écriture"}">
  <header class="gn-h"><div><b>${N.edit ? "Modifier l'écriture" : "Nouvelle écriture"}</b><span class="gn-sub">${esc(S.nom)} · ${esc(j.code || "")} ${esc(j.lib || "")}</span></div><span style="flex:1"></span><button class="gn-k" data-act="gnHelp" title="Raccourcis (F1)">⌨ Raccourcis <kbd>F1</kbd></button><button class="btn ghost sm" data-act="gnClose" title="Fermer (Échap) : le brouillon est conservé">✕</button></header>
  ${N.help ? `<div class="gn-help">${[["Ctrl+Entrée", "Enregistrer"], ["Ctrl+Maj+Entrée", "Enregistrer et nouvelle"], ["Ctrl+L", "Ajouter une ligne"], ["=", "Solder (dans Débit / Crédit)"], ["Ctrl+B", "Équilibrer sur la dernière ligne"], ["Alt+T", "Ajouter la TVA de la ligne"], ["Ctrl+D", "Dupliquer la ligne"], ["Ctrl+Suppr", "Supprimer la ligne"], ["Tab / Entrée", "Champ suivant"], ["Échap", "Fermer (brouillon gardé)"]].map(([k, l]) => `<span><kbd>${k}</kbd>${l}</span>`).join("")}</div>` : ""}
  <div class="gn-body"><div class="gn-main">
    <div class="gn-hd"><label class="f">Journal<select class="in" data-ch="gnH" data-f="journal">${S.journaux.filter(x => !x.ferme || x.code === N.journal).map(x => `<option value="${esc(x.code)}" ${x.code === N.journal ? "selected" : ""}>${esc(x.code)} · ${esc(x.lib)}</option>`).join("")}</select></label>
      <label class="f">Date<input class="in" type="date" id="gn2-date" value="${esc(N.date)}" data-ch="gnH" data-f="date"></label>
      <label class="f">N° de pièce<input class="in mono" id="gn2-piece" value="${esc(N.piece)}" data-ch="gnH" data-f="piece" placeholder="auto"></label>
      <label class="f">Échéance<input class="in" type="date" value="${esc(N.ech)}" data-ch="gnH" data-f="ech"></label>
      <label class="f gn-libh">Libellé<input class="in" id="gn2-lib" value="${esc(N.lib)}" data-ch="gnH" data-f="lib" placeholder="ex. Facture EDF mars"></label></div>
    
    <table class="gn-t"><thead><tr><th style="width:30px"></th><th style="width:220px">Compte ou tiers</th><th>Libellé de ligne</th><th class="r" style="width:120px">Débit</th><th class="r" style="width:120px">Crédit</th><th style="width:76px"></th></tr></thead><tbody>
    ${N.lines.map((l, i) => { const r = gnRes(l.compte); const t = r.aux ? tiersBy(r.aux) : null; const lab = l.compte ? (t ? t.nom + " · " + r.compte : accLib(r.compte)) : ""; const ac = /^[267]/.test(r.compte) && (cents(l.d) || cents(l.c));
      return `<tr class="${l._tva ? "gn-tva" : ""}"><td class="gn-n">${i + 1}</td><td><input class="in mono gi-acc gn-acc" autocomplete="off" id="gn2-${i}-compte" value="${esc(l.compte)}" data-ch="gnL" data-i="${i}" data-f="compte" placeholder="401, EDF, 6061…"><div class="gn-lab">${esc(lab)}</div></td>
      <td><input class="in" id="gn2-${i}-lib" value="${esc(l.lib)}" data-ch="gnL" data-i="${i}" data-f="lib" placeholder="${esc(N.lib || "Libellé")}"></td>
      <td><input class="in num" inputmode="decimal" id="gn2-${i}-d" value="${esc(l.d)}" data-ch="gnL" data-i="${i}" data-f="d" data-gn="1"></td><td><input class="in num" inputmode="decimal" id="gn2-${i}-c" value="${esc(l.c)}" data-ch="gnL" data-i="${i}" data-f="c" data-gn="1"></td>
      <td class="gn-act">${ac ? `<button class="gn-ib" data-act="gnTva" data-i="${i}" title="Ajouter la TVA 20 % (Alt+T)">+TVA</button>` : ""}<button class="gn-ib" data-act="gnDup" data-i="${i}" title="Dupliquer (Ctrl+D)">⧉</button>${N.lines.length > 2 ? `<button class="gn-ib" data-act="gnDel" data-i="${i}" title="Supprimer (Ctrl+Suppr)">✕</button>` : ""}</td></tr>`; }).join("")}
    </tbody></table>
    <div class="gn-row"><button class="btn sm" data-act="gnAdd">＋ Ligne <kbd>Ctrl+L</kbd></button>${T.s ? `<button class="btn sm" data-act="gnBal">⚖ Équilibrer ${eur(Math.abs(T.s))} <kbd>Ctrl+B</kbd></button>` : ""}${gnCp() && T.s ? `<button class="btn sm ghost" data-act="gnCpl">Contrepartie ${esc(gnCp())}</button>` : ""}<span style="flex:1"></span>
      <div class="gn-tot"><span>Débit <b class="mono">${eur(T.d)}</b></span><span>Crédit <b class="mono">${eur(T.c)}</b></span><span class="${T.s ? "ko" : T.d ? "ok" : ""}">${T.s ? "Écart <b class='mono'>" + eur(Math.abs(T.s)) + "</b>" : T.d ? "✓ Équilibrée" : "—"}</span></div></div>
    ${P.length && (T.d || T.c) ? `<div class="gn-ko">${P.map(esc).join(" · ")}</div>` : ""}
  </div><aside class="gn-side">${gnDocHTML(N)}</aside></div>
  <footer class="gn-f"><span class="small muted">${N.edit ? "Modification de l'écriture " + esc(N.piece || "") : "Brouillon conservé automatiquement"}</span><span style="flex:1"></span><button class="btn" data-act="gnClose">Annuler</button>${N.edit ? "" : `<button class="btn" data-act="gnSave" data-n="1" ${ok ? "" : "disabled"} title="Ctrl+Maj+Entrée">Enregistrer et nouvelle</button>`}<button class="btn pri" data-act="gnSave" ${ok ? "" : "disabled"} title="Ctrl+Entrée">✓ Enregistrer</button></footer></section>`; }
function gnSave(again) { const N = UI.gne; if (!N) return; const P = gnCheck(N); if (P.length) { toast(P[0]); return; }
  const L = N.lines.filter(l => l.compte || cents(l.d) || cents(l.c)).map(l => { const r = gnRes(l.compte); if (r.compte && !accLib(r.compte).startsWith("Compte ") === false) { try { ensureAcc(r.compte); } catch (e) { } } return [r.compte, r.aux, l.lib || "", cents(l.d), cents(l.c)]; });
  let e; if (N.edit) { e = E.find(x => x.id === N.edit); if (!e) return; Object.assign(e, { journal: N.journal, date: N.date, piece: N.piece, libelle: N.lib, ech: N.ech }); e.lignes = mkEcr({ journal: N.journal, date: N.date, lignes: L }).lignes; saveEcr(e); }
  else { e = addEcr(mkEcr({ journal: N.journal, date: N.date, piece: N.piece, libelle: N.lib, ech: N.ech, lignes: L })); e.cree = new Date().toISOString(); }
  N.docs.forEach(d => { if (d.ged) (e.docs ||= []).push({ id: uid(), ged: d.ged, nom: d.nom, type: d.pdf ? "application/pdf" : "image/jpeg", le: todayISO() }); else if (d.asset) (e.docs ||= []).push({ id: uid(), url: d.asset, nom: d.nom, type: d.pdf ? "application/pdf" : "image/jpeg", le: todayISO() }); }); if (N.docs.length) saveEcr(e);
  const g = gState(); if (g.j !== N.journal) g.j = N.journal; if (g.m !== "all" && g.m !== N.date.slice(0, 7)) g.m = N.date.slice(0, 7); g.sel = { e: e.id, l: e.lignes[0].id };
  try { localStorage.removeItem("sc:gnDraft:" + S.id); } catch (x) { }
  toast((N.edit ? "Écriture modifiée" : "Écriture enregistrée") + " · " + e.journal + " " + (e.piece || "") + " · " + eur(ecrTotals(e).d) + " € ✓");
  if (again) { const nb = gnBlank(); nb.journal = N.journal; nb.date = N.date; nb.piece = typeof jrNextPiece === "function" ? jrNextPiece(N.journal, N.date) : ""; UI.gne = nb; render(); setTimeout(() => { const x = $("#gn2-0-compte"); x && x.focus(); }, 30); }
  else { UI.gne = null; render(); } }
function gnDraft() { try { if (UI.gne && !UI.gne.edit) localStorage.setItem("sc:gnDraft:" + S.id, JSON.stringify(Object.assign({}, UI.gne, { docs: [] }))); } catch (e) { } }
function gnOpen(edit) { if (edit) { const e = E.find(x => x.id === edit); if (!e) return; UI.gne = { journal: e.journal, date: e.date, piece: e.piece || "", lib: e.libelle || "", ech: e.ech || "", lines: e.lignes.map(l => gnLine({ compte: l.aux || l.compte, lib: l.lib || "", d: l.debit ? toIn(l.debit) : "", c: l.credit ? toIn(l.credit) : "" })), docs: [], edit: e.id }; }
  else { let d = null; try { d = JSON.parse(localStorage.getItem("sc:gnDraft:" + S.id) || "null"); } catch (e) { } UI.gne = d && d.lines && d.lines.some(l => l.compte || l.d || l.c) ? Object.assign(d, { docs: [], edit: null }) : gnBlank(); if (d && UI.gne === d) toast("Brouillon repris · « Annuler » pour repartir de zéro"); }
  render(); setTimeout(() => { const x = $(edit ? "#gn2-lib" : "#gn2-0-compte"); x && x.focus(); }, 40); }
/* lecture d'un justificatif pour préremplir */
async function gnFiles(files) { const N = UI.gne; if (!N) return; for (const f of files) { const b = new Uint8Array(await f.arrayBuffer()); const head = latin1(b.subarray(0, 5)); const pdf = head.startsWith("%PDF"); const doc = { nom: f.name, pdf, url: URL.createObjectURL(new Blob([b], { type: pdf ? "application/pdf" : f.type || "image/jpeg" })) };
    try { if (Store.assets) { const up = await Store.assets.upload(new Blob([b], { type: pdf ? "application/pdf" : f.type })); doc.asset = up.url; } else { const fid = gdEnsurePath("Comptabilité/Pièces des écritures/" + (exCur().id || "").replace("EX", "")); const rec = await gedAddBytes(f.name, b, pdf ? "application/pdf" : f.type || "image/jpeg", fid, { tags: ["justificatif"] }); doc.ged = rec.id; } } catch (e) { console.warn(e); }
    N.docs.push(doc); N.di = N.docs.length - 1; render();
    if (N.docs.length === 1 && !N.lines.some(l => l.compte || l.d || l.c)) { try { const inv = await readInvoiceFile(f.name, b); gnFill(N, inv, doc); } catch (e) { doc.lu = "Lecture automatique impossible : saisissez l'écriture."; } render(); } } }
function gnFill(N, inv, doc) { const jt = gnTypeJ(); const vente = jt === "VEN" || (inv.vendeur && S.siren && inv.vendeur.siren === S.siren); const party = (vente ? inv.acheteur : inv.vendeur) || {}; const type = vente ? "C" : "F";
  let t = party.nom ? matchTiers(party, type) : null; if (!t && party.nom) { t = { type, code: genCode(type, party.nom), nom: party.nom, siren: party.siren || "", tvaIntra: party.tva || "", adresse: party.adresse || "", iban: vente ? "" : inv.iban || "", ...tiersDefaults(type), auto: true }; S.tiers.push(t); Store.touch(); }
  const it = { inv, sens: vente ? "V" : "A", tiers: t ? t.code : "", text: inv.text || "", lib: "", lignes: [], nom: doc.nom };
  let cpt = vente ? "706000" : "607000"; try { if (typeof sdClassify === "function") { const R = sdClassify(it); const c = sdCat(R.cat); if (c && c.compte) cpt = c.compte; doc.lu = "Lu : " + (party.nom || "?") + (inv.num ? " · n° " + inv.num : "") + " · " + (c ? c.lib : "") + " · TTC " + eur(inv.ttc || 0) + " €"; } } catch (e) { }
  if (inv.date) N.date = inv.date; if (inv.num) N.piece = inv.num; if (inv.ech) N.ech = inv.ech; N.lib = (t ? t.nom : party.nom || "") + (inv.num ? " - " + inv.num : "");
  const groups = (inv.tva || []).filter(x => x.base || x.montant); const L = [];
  if (groups.length) groups.forEach(g0 => { L.push(gnLine(vente ? { compte: cpt, lib: N.lib, c: toIn(g0.base) } : { compte: cpt, lib: N.lib, d: toIn(g0.base) })); if (g0.montant) { const acc = vente ? (TVA_COLL[g0.taux] || "445710") : (cpt.startsWith("2") ? "445620" : "445660"); L.push(gnLine(vente ? { compte: acc, lib: "TVA", c: toIn(g0.montant), _tva: true } : { compte: acc, lib: "TVA", d: toIn(g0.montant), _tva: true })); } });
  else if (inv.ttc) L.push(gnLine(vente ? { compte: cpt, lib: N.lib, c: toIn(inv.ttc) } : { compte: cpt, lib: N.lib, d: toIn(inv.ttc) }));
  const tot = L.reduce((a, l) => a + cents(l.d) - cents(l.c), 0); const tl = gnLine({ compte: t ? t.code : (vente ? "411000" : "401000"), lib: N.lib }); if (tot > 0) tl.c = toIn(tot); else tl.d = toIn(-tot);
  N.lines = vente ? [tl].concat(L) : L.concat([tl]); }
Object.assign(ACT, {
  gnClose: () => { gnDraft(); UI.gne = null; acClose && acClose(); render(); },
  gnHelp: () => { UI.gne.help = !UI.gne.help; render(); },
  gnAdd: () => { UI.gne.lines.push(gnLine()); render(); setTimeout(() => { const x = $("#gn2-" + (UI.gne.lines.length - 1) + "-compte"); x && x.focus(); }, 20); },
  gnDel: el => { const N = UI.gne; N.lines.splice(+el.dataset.i, 1); if (N.lines.length < 2) N.lines.push(gnLine()); render(); },
  gnDup: el => { const N = UI.gne; const l = N.lines[+el.dataset.i]; N.lines.splice(+el.dataset.i + 1, 0, gnLine({ compte: l.compte, lib: l.lib, d: l.d, c: l.c })); render(); },
  gnBal: () => { const N = UI.gne; const s = gnTot(N).s; if (!s) return; let k = N.lines.length - 1; while (k > 0 && (N.lines[k].d || N.lines[k].c) && N.lines[k].compte) k--; if (N.lines[k].d || N.lines[k].c) { N.lines.push(gnLine()); k = N.lines.length - 1; } const l = N.lines[k]; if (s > 0) { l.c = toIn(s); l.d = ""; } else { l.d = toIn(-s); l.c = ""; } if (!l.lib) l.lib = N.lib; render(); setTimeout(() => { const x = $("#gn2-" + k + "-compte"); x && !x.value && x.focus(); }, 20); },
  gnCpl: () => { const N = UI.gne; const s = gnTot(N).s; const l = gnLine({ compte: gnCp(), lib: N.lib }); if (s > 0) l.c = toIn(s); else l.d = toIn(-s); const k = N.lines.findIndex(x => !x.compte && !x.d && !x.c); if (k >= 0) N.lines[k] = l; else N.lines.push(l); render(); },
  gnTva: el => { const N = UI.gne; const i = +el.dataset.i; const l = N.lines[i]; const r = gnRes(l.compte); const base = cents(l.d) || cents(l.c); if (!base) return; const v = Math.round(base * 0.2); const vente = r.compte.startsWith("7"); const t = gnLine({ compte: vente ? "445711" : r.compte.startsWith("2") ? "445620" : "445660", lib: "TVA 20 %", _tva: true }); if (cents(l.d)) t.d = toIn(v); else t.c = toIn(v); N.lines.splice(i + 1, 0, t); render(); },
  gnSave: el => gnSave(el && el.dataset.n === "1"),
  gnDoc: el => { UI.gne.di = +el.dataset.i; render(); },
  gnDocDel: el => { const N = UI.gne; N.docs.splice(+el.dataset.i, 1); N.di = 0; render(); },
  gnCopy: el => { const e = E.find(x => x.id === el.dataset.id); const N = UI.gne; if (!e) return; N.lines = e.lignes.map(l => gnLine({ compte: l.aux || l.compte, lib: l.lib || "", d: l.debit ? toIn(l.debit) : "", c: l.credit ? toIn(l.credit) : "" })); if (!N.lib) N.lib = e.libelle; toast("Répartition reprise : ajustez les montants."); render(); }
});
Object.assign(CHG, {
  gnH: el => { const N = UI.gne; const f = el.dataset.f; N[f] = el.value; if (f === "journal" || f === "date") { if (!N.edit && (f === "journal" || !N.piece || N._pAuto)) { N.piece = typeof jrNextPiece === "function" ? jrNextPiece(N.journal, N.date) : N.piece; N._pAuto = true; } } if (f === "piece") N._pAuto = false; gnDraft(); render(); },
  gnL: el => { const N = UI.gne; const i = +el.dataset.i; const l = N.lines[i]; const f = el.dataset.f; if (!l) return; l[f] = f === "d" || f === "c" ? el.value.trim() : el.value;
    if ((f === "d" || f === "c") && cents(l[f])) { l[f === "d" ? "c" : "d"] = ""; l[f] = toIn(cents(l[f])); }
    if (f === "compte") { const r = gnRes(l.compte); if (r.aux) gnAutoFromTiers(N, i); }
    if ((f === "d" || f === "c") && N._auto) gnVentile(N);
    if (i === N.lines.length - 1 && l.compte && (cents(l.d) || cents(l.c)) && gnTot(N).s) N.lines.push(gnLine());
    gnDraft(); const id = document.activeElement && document.activeElement.id; render(); if (id) setTimeout(() => { const x = document.getElementById(id); if (x && document.activeElement !== x) x.focus(); }, 0); },
  gnFile: async el => { const fs = [...el.files]; el.value = ""; if (fs.length) await gnFiles(fs); }
});
document.addEventListener("keydown", ev => { if (!UI.gne || UI.modal) return; const k = ev.key; const t = ev.target; const N = UI.gne;
  if (k === "F1") { ev.preventDefault(); ACT.gnHelp(); return; } if (k === "Escape" && !(typeof AC !== "undefined" && AC.box && AC.box.style.display !== "none" && AC.items && AC.items.length && t.classList && t.classList.contains("gi-acc"))) { ev.preventDefault(); ACT.gnClose(); return; }
  if ((ev.ctrlKey || ev.metaKey) && k === "Enter") { ev.preventDefault(); if (t && t.dispatchEvent) t.dispatchEvent(new Event("change", { bubbles: true })); setTimeout(() => gnSave(ev.shiftKey), 0); return; }
  if ((ev.ctrlKey || ev.metaKey) && (k === "l" || k === "L")) { ev.preventDefault(); ACT.gnAdd(); return; }
  if ((ev.ctrlKey || ev.metaKey) && (k === "b" || k === "B")) { ev.preventDefault(); ACT.gnBal(); return; }
  const i = t && t.dataset && t.dataset.i != null && t.dataset.ch === "gnL" ? +t.dataset.i : -1;
  if (i >= 0 && ev.altKey && (k === "t" || k === "T")) { ev.preventDefault(); ACT.gnTva({ dataset: { i: String(i) } }); return; }
  if (i >= 0 && (ev.ctrlKey || ev.metaKey) && (k === "d" || k === "D")) { ev.preventDefault(); ACT.gnDup({ dataset: { i: String(i) } }); return; }
  if (i >= 0 && (ev.ctrlKey || ev.metaKey) && k === "Delete") { ev.preventDefault(); ACT.gnDel({ dataset: { i: String(i) } }); return; }
  if (k === "=" && t.dataset && t.dataset.gn) { ev.preventDefault(); const s = gnTot(N).s + cents(N.lines[i][t.dataset.f]) * (t.dataset.f === "d" ? -1 : 1); const f = s > 0 ? "c" : "d"; N.lines[i].d = ""; N.lines[i].c = ""; N.lines[i][f] = toIn(Math.abs(s)); render(); setTimeout(() => { const x = $("#gn2-" + i + "-" + f); x && x.focus(); }, 0); return; }
  if (k === "Enter" && t.tagName === "INPUT" && t.dataset.ch && /^gn/.test(t.dataset.ch) && !(t.classList.contains("gi-acc") && typeof AC !== "undefined" && AC.box && AC.items && AC.items.length && AC.box.style.display !== "none")) { ev.preventDefault(); const F = [...document.querySelectorAll(".gn input.in:not([type=file]), .gn select.in")]; const n = F.indexOf(t); if (n >= 0 && F[n + 1]) F[n + 1].focus(); } }, true);
/* glisser-déposer sur le volet */
document.addEventListener("dragover", ev => { const p = ev.target.closest && ev.target.closest(".gn"); if (p) { ev.preventDefault(); p.classList.add("over"); } });
document.addEventListener("dragleave", ev => { const p = ev.target.closest && ev.target.closest(".gn"); if (p && !p.contains(ev.relatedTarget)) p.classList.remove("over"); });
document.addEventListener("drop", ev => { const p = ev.target.closest && ev.target.closest(".gn"); if (!p) return; ev.preventDefault(); ev.stopPropagation(); p.classList.remove("over"); const fs = [...(ev.dataTransfer.files || [])]; if (fs.length) gnFiles(fs); }, true);
/* branchement : « ＋ Nouvelle », « ✎ Modifier », double-clic, raccourci N */
(function () {
  const _n = ACT.gNew; ACT.gNew = function () { if (localStorage.getItem("sc:gnMode") === "ligne") return _n.apply(this, arguments); gnOpen(); };
  ACT.gnEdit = () => { const g = gState(); const e = gSelEntry(g); if (!e) { toast("Cliquez d'abord sur une écriture."); return; } if (e.statut === "valide" || (typeof isLocked === "function" && isLocked(e))) { if (typeof gEdOpen === "function") return gEdOpen(e, true); return; } gnOpen(e.id); };
  ACT.gnMode = () => { const m = localStorage.getItem("sc:gnMode") === "ligne" ? "volet" : "ligne"; try { localStorage.setItem("sc:gnMode", m); } catch (e) { } toast(m === "volet" ? "Nouvelle écriture dans le volet de saisie" : "Nouvelle écriture sur la ligne ★ de la grille"); render(); };
  const _v = VIEWS.grille; VIEWS.grille = function () { let h = _v.apply(this, arguments); if (!S) return h; const volet = localStorage.getItem("sc:gnMode") !== "ligne";
    h = h.replace(/(<button class="gr-tb[^"]*" data-act="gNew"[^>]*>)[^<]*(<\/button>)/, `$1＋ Nouvelle écriture <kbd class="gn-kb">N</kbd>$2<button class="gr-tb" data-act="gnMode" title="Saisie dans le volet moderne ou directement sur la ligne de la grille">${volet ? "▤ Volet" : "▭ Ligne"}</button>`);
    return h + gnHTML(); };
  document.addEventListener("dblclick", ev => { if (UI.view !== "grille" || UI.modal || UI.gne) return; const tr = ev.target.closest && ev.target.closest(".gr-r"); if (!tr || ev.target.closest("input,select,textarea")) return; const e = E.find(x => x.id === tr.dataset.e); if (!e || e.statut === "valide" || (typeof isLocked === "function" && isLocked(e)) || localStorage.getItem("sc:gnMode") === "ligne") return; ev.stopImmediatePropagation(); gState().sel = { e: e.id, l: tr.dataset.l }; gnOpen(e.id); }, true);
  document.addEventListener("keydown", ev => { if (UI.view !== "grille" || UI.modal || UI.gne || ev.ctrlKey || ev.metaKey || ev.altKey) return; const t = ev.target; if (t && t.closest && t.closest("input,textarea,select,[contenteditable]")) return; if (ev.key === "n" || ev.key === "N") { ev.preventDefault(); ACT.gNew(); } });
  /* le panneau Détails ouvre aussi le volet pour modifier */
  if (typeof grdTabEcr === "function") { const _t = grdTabEcr; grdTabEcr = function (e) { return _t.apply(this, arguments).replace('<button class="btn sm" data-act="gEdit">✎ Modifier</button>', '<button class="btn sm" data-act="gnEdit">✎ Modifier</button>'); }; }
})();
(function () { const st = document.createElement("style"); st.textContent = `
.gn-bg{position:fixed;inset:0;z-index:38;background:rgba(15,27,51,.28);animation:gnF .15s}
.gn{position:fixed;right:0;top:0;bottom:0;z-index:39;width:min(1180px,96vw);background:#fff;display:flex;flex-direction:column;box-shadow:-20px 0 50px rgba(15,27,51,.25);animation:gnS .2s ease-out}
.gn.over{outline:4px dashed #F5B700;outline-offset:-10px}
@keyframes gnS{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}@keyframes gnF{from{opacity:0}}
.gn-h{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #EEF1F6;background:linear-gradient(90deg,#0F3D3E,#13585A);color:#fff}.gn-h b{font-size:18px;display:block}.gn-sub{font-size:12.5px;opacity:.8}.gn-h .btn{color:#fff}
.gn-k{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:8px;padding:5px 10px;font:inherit;font-size:12.5px;cursor:pointer}.gn kbd,.gn-kb{font:10.5px "IBM Plex Mono",monospace;background:rgba(15,27,51,.08);border-radius:4px;padding:1px 5px;margin-left:4px}.gn-h kbd{background:rgba(255,255,255,.2)}
.gn-help{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 18px;background:#FFFBEA;border-bottom:1px solid #F5E3A8;font-size:12.5px}.gn-help span{display:inline-flex;gap:6px;align-items:center}
.gn-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.9fr)}
.gn-main{overflow:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px}
.gn-hd{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:10px}.gn-hd .f{font-size:12px;font-weight:600;color:#4E6362}.gn-libh{grid-column:1/-1}.gn-hd .in{font-size:14px}
.gn-chips{display:flex;gap:6px;flex-wrap:wrap}.gn-chip{border:1px solid #DCE7E5;background:#F6FAF9;border-radius:999px;padding:4px 12px;font:inherit;font-size:12.5px;color:#13585A;cursor:pointer}.gn-chip:hover{border-color:#13585A}
.gn-t{width:100%;border-collapse:separate;border-spacing:0 4px}.gn-t th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#8590A8;text-align:left;padding:0 4px}.gn-t th.r{text-align:right}
.gn-t td{padding:0 4px;vertical-align:top}.gn-t .in{width:100%;font-size:14px;padding:8px 9px}.gn-t .num{text-align:right;font-family:"IBM Plex Mono",monospace}
.gn-t tr:focus-within td .in{border-color:#13585A}.gn-tva .in{background:#F7F9FC}.gn-n{color:#A0AABA;font-size:12px;padding-top:12px!important;text-align:center}
.gn-lab{font-size:11px;color:#6B7B7B;padding:2px 2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.gn-act{white-space:nowrap;padding-top:6px!important}.gn-ib{border:0;background:none;color:#5A6B6A;cursor:pointer;font:inherit;font-size:12px;padding:3px 5px;border-radius:6px}.gn-ib:hover{background:#EEF4F3;color:#0F3D3E}
.gn-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.gn-tot{display:flex;gap:14px;align-items:center;font-size:13px;background:#F7F9FC;border-radius:10px;padding:8px 12px}.gn-tot .ko{color:#C2364B}.gn-tot .ok{color:#1F8A55;font-weight:700}
.gn-ko{font-size:12.5px;color:#8F1F31;background:#FDECEE;border-radius:8px;padding:6px 10px}
.gn-side{border-left:1px solid #EEF1F6;background:#F4F6FA;padding:14px;display:flex;flex-direction:column;min-height:0}
.gn-drop{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:2px dashed #C8D2D0;border-radius:14px;background:#fff;cursor:pointer;text-align:center;padding:20px;color:#13585A}.gn-drop span{font-size:12.5px;color:#6B7B7B;max-width:240px}.gn-drop:hover{border-color:#13585A}
.gn-doc{flex:1;display:flex;flex-direction:column;gap:8px;min-height:0}.gn-doc iframe{flex:1;width:100%;border:0;background:#fff;border-radius:8px;min-height:60vh}.gn-doc img{max-width:100%;border-radius:8px;background:#fff}
.gn-dbar{display:flex;gap:4px;flex-wrap:wrap;align-items:center}.gn-dt{border:1px solid #DCE3EF;background:#fff;border-radius:8px;padding:3px 8px;font:inherit;font-size:12px;cursor:pointer;text-decoration:none;color:#14202B;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gn-dt.on{border-color:#0F3D3E;background:#EEF6F5}
.gn-lu{font-size:12px;background:#EEF6F5;color:#0F3D3E;border-radius:8px;padding:6px 9px}
.gn-f{display:flex;align-items:center;gap:8px;padding:12px 18px;border-top:1px solid #EEF1F6;background:#fff}
.ac-pop{z-index:60!important}body:has(.gn) .ai-fab{display:none!important}body:has(.gn) #toast{top:16px!important;bottom:auto!important}
@media (max-width:900px){.gn-body{grid-template-columns:1fr}.gn-side{border-left:0;border-top:1px solid #EEF1F6;min-height:260px}.gn-hd{grid-template-columns:1fr 1fr}}`; document.head.appendChild(st); })();

/* ============================================================================
   Reconnaissance automatique à la saisie d'un compte (remplace les modèles de saisie)
   - charge ou immobilisation (achats) / produit (ventes) + montant : la TVA est ajoutée
     au taux habituel (catégorie, tiers, compte) et la ligne du tiers est ajustée au TTC
   - compte de tiers saisi en premier : compte de charge / produit appris proposé
   ========================================================================== */
function gnRateFor(N, compte) { if (/^(616|627|6354|635|637|6411|645|658|6712|625[16]|654)/.test(compte)) return 0;
  try { const c = sdCatByAcc(compte, gnTypeJ() === "VEN" ? "V" : "A"); if (c && c.tx === 0) return 0; } catch (e) { }
  const tl = N.lines.map(l => gnRes(l.compte)).find(r => r.aux); const t = tl ? tiersBy(tl.aux) : null; if (t && t.taux != null && t.defaut === compte) return Number(t.taux);
  const last = E.slice().reverse().find(e => e.journal === N.journal && e.lignes.some(l => l.compte === compte) && e.lignes.some(l => /^4456|^4457/.test(l.compte))); if (last) { const b = last.lignes.find(l => l.compte === compte), v = last.lignes.find(l => /^4456|^4457/.test(l.compte)); const base = b.debit + b.credit, tv = v.debit + v.credit; if (base) { const r = Math.round(tv / base * 10000); const k = [2000, 1000, 550, 210, 0].reduce((a, x) => Math.abs(x - r) < Math.abs(a - r) ? x : a, 2000); return k; } }
  return /^625[67]/.test(compte) ? 1000 : 2000; }
function gnAutoRec(N, i) { const jt = gnTypeJ(); if (jt !== "ACH" && jt !== "VEN") return; const l = N.lines[i]; if (!l || l._tva) return; const r = gnRes(l.compte); const vente = jt === "VEN";
  const isBase = vente ? /^7/.test(r.compte) : /^[62]/.test(r.compte); const amt = cents(vente ? l.c : l.d); if (!isBase || !amt || N._auto) return;
  const tx = gnRateFor(N, r.compte); const next = N.lines[i + 1];
  if (next && next._tva) N.lines.splice(i + 1, 1);
  if (tx) { const v = Math.round(amt * tx / 10000); const acc = vente ? (TVA_COLL[tx] || "445710") : (r.compte.startsWith("2") ? "445620" : "445660"); const t = gnLine({ compte: acc, lib: "TVA " + (TAUX_LIB[tx] || ""), _tva: true, _for: l.id }); if (vente) t.c = toIn(v); else t.d = toIn(v); N.lines.splice(i + 1, 0, t); }
  /* ligne du tiers : ajustée au TTC total ; sinon créée vide pour choisir le tiers */
  let tk = N.lines.findIndex(x => gnRes(x.compte).aux || /^4[01]/.test(gnRes(x.compte).compte)); const tot = N.lines.reduce((a, x, k) => k === tk ? a : a + cents(x.d) - cents(x.c), 0);
  if (tk < 0) { const tl = gnLine({ compte: "", lib: N.lib }); N.lines = N.lines.filter((x, k) => x.compte || cents(x.d) || cents(x.c) || k <= i); N.lines.push(tl); tk = N.lines.length - 1; N._askT = tk; }
  const T = N.lines[tk]; if (tot > 0) { T.c = toIn(tot); T.d = ""; } else { T.d = toIn(-tot); T.c = ""; }
  if (!N.lines.some(x => !x.compte && !x.d && !x.c)) N.lines.push(gnLine()); }
(function () { const _l = CHG.gnL; CHG.gnL = function (el) { const N = UI.gne; const i = +el.dataset.i; const f = el.dataset.f; const r = _l.apply(this, arguments); try { if (N && (f === "d" || f === "c" || f === "compte")) { gnAutoRec(N, i); if (f === "compte" && N._askT === i) delete N._askT; gnDraft(); const id = document.activeElement && document.activeElement.id; render(); if (N._askT != null) setTimeout(() => { const x = $("#gn2-" + N._askT + "-compte"); x && x.focus(); delete N._askT; }, 20); else if (id) setTimeout(() => { const x = document.getElementById(id); x && x.focus(); }, 0); } } catch (e) { console.warn(e); } return r; }; })();
/* plus de bandeau de modèles dans la saisie du journal */
(function () { const _v = VIEWS.grille; VIEWS.grille = function () { return _v.apply(this, arguments).replace(/<button[^>]*data-act="gTpl"[^>]*>[^<]*<\/button>/g, ""); };
  const st = document.createElement("style"); st.textContent = `.gr-wrap .gr-tpl{display:none!important}`; document.head.appendChild(st); })();
