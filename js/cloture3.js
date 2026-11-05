/* ============================================================
   Clôture : anti-doublons des à-nouveaux (RAN) + déclôture d'un exercice
   ============================================================ */
const anSig = e => e.lignes.map(l => l.compte + "|" + (l.aux || "") + "|" + l.debit + "|" + l.credit).sort().join(";");
const anNextEx = ex => S.exercices.find(x => x.debut === addDays(ex.fin, 1));
const anPrevEx = ex => S.exercices.find(x => x.fin === addDays(ex.debut, -1));
const anOf = x => E.filter(e => e.journal === "AN" && e.tag !== "ANP" && e.date >= x.debut && e.date <= x.fin);
const anCopy = e => JSON.parse(JSON.stringify(e));
/* délettre les lignes de l'exercice x qui partageaient un code de lettrage avec des lignes d'à-nouveaux supprimées */
function anUnletter(removed, x) {
  const K = new Set(); for (const e of removed) for (const l of e.lignes) if (l.lettre) K.add(l.compte + "|" + l.lettre);
  if (!K.size) return 0; let n = 0;
  for (const e of E) { if (e.date < x.debut || e.date > x.fin) continue; let ch = false; for (const l of e.lignes) if (l.lettre && K.has(l.compte + "|" + l.lettre)) { l.lettre = ""; l.dateLet = ""; n++; ch = true; } if (ch) saveEcr(e); }
  return n;
}
function anStash(pe, list) { if (!pe || !list.length) return; const have = new Set((pe.anPrev || []).map(anSig)); for (const e of list) { const s = anSig(e); if (!have.has(s)) { (pe.anPrev ||= []).push(anCopy(e)); have.add(s); } } }
/* totaux par compte (plan 2025 appliqué) des comptes de bilan */
function anTot(list, nd) { const m = {}; for (const e of list) for (const l of e.lignes) { if (!/^[1-5]/.test(l.compte)) continue; const k = ((nd >= "2025-01-01" && PCG2025_MAP[l.compte]) || l.compte).slice(0, 6); m[k] = (m[k] || 0) + l.debit - l.credit; } return m; }
function anSame(a, b) { const ks = new Set(Object.keys(a).concat(Object.keys(b))); for (const k of ks) if (Math.abs((a[k] || 0) - (b[k] || 0)) > 100) return false; return true; }

/* recherche des doublons d'à-nouveaux d'un exercice : { rm:[écritures à supprimer], stash:[à conserver pour la déclôture], diff:[autres AN divergents] } */
function anDupScan(x) {
  const L = anOf(x); if (L.length < 2) return { rm: [], stash: [], diff: [] };
  const pe = anPrevEx(x); const rm = [], stash = []; const seen = {};
  // 1) copies strictement identiques (on garde la version générée par la clôture, validée de préférence)
  const ord = L.slice().sort((a, b) => (b.tag === "AN") - (a.tag === "AN") || (b.statut === "valide") - (a.statut === "valide"));
  for (const e of ord) { const s = anSig(e); if (seen[s]) rm.push(e); else seen[s] = e; }
  // 2) exercice précédent clôturé : les à-nouveaux générés par la clôture remplacent les reprises identiques en montants
  const gen = ord.filter(e => e.tag === "AN" && !rm.includes(e) && e.date === x.debut);
  if (gen.length > 1) gen.slice(1).forEach(e => rm.push(e));
  const diff = [];
  if (pe && pe.cloture && gen.length) {
    const others = ord.filter(e => e.tag !== "AN" && !rm.includes(e));
    if (others.length) { if (anSame(anTot(others, x.debut), anTot([gen[0]], x.debut))) { others.forEach(e => { rm.push(e); stash.push(e); }); } else diff.push(...others); }
  }
  return { rm, stash, diff, gen: gen[0] };
}
function anDupFix(x, withDiff) {
  const r = anDupScan(x); const rm = r.rm.concat(withDiff ? r.diff : []); const st = r.stash.concat(withDiff ? r.diff : []);
  if (!rm.length) return { n: 0, nl: 0 };
  anStash(anPrevEx(x), st.filter(e => e.tag !== "AN"));
  const nl = anUnletter(rm, x); rm.forEach(e => removeEcr(e.id)); saveAll();
  return { n: rm.length, nl };
}
/* correction automatique au chargement de chaque dossier */
const AN_FIXED = new WeakSet();
const _anRenderNow = renderNow;
renderNow = function () {
  if (S && !AN_FIXED.has(S)) { AN_FIXED.add(S); try { let n = 0, nl = 0; for (const x of S.exercices || []) { const r = anDupFix(x, false); n += r.n; nl += r.nl; } if (n) setTimeout(() => toast("Anomalie corrigée : " + n + " écriture(s) d'à-nouveaux en double supprimée(s)" + (nl ? " · " + nl + " ligne(s) à relettrer" : "") + "."), 300); } catch (e) { logErr("à-nouveaux en double", e); } }
  return _anRenderNow.apply(this, arguments);
};

/* clôture : remplace les à-nouveaux déjà présents (reprise, import) au lieu de les dupliquer */
const _anCloturer = cloturer;
cloturer = function (ex) {
  const nx = anNextEx(ex);
  if (nx) { const old = anOf(nx).filter(e => e.date === nx.debut || e.tag !== "AN"); anStash(ex, old.filter(e => e.tag !== "AN")); anUnletter(old, nx); old.forEach(e => removeEcr(e.id)); }
  const r = _anCloturer.apply(this, arguments);
  ex.anId = r.an && r.an.id; saveAll(); return r;
};

/* déclôture */
function decloturer(ex) {
  const nx = anNextEx(ex); let nAN = 0, nl = 0, nr = 0;
  if (nx) { const gen = E.filter(e => e.journal === "AN" && e.date === nx.debut && (e.tag === "AN" || e.id === ex.anId)); nl = anUnletter(gen, nx); gen.forEach(e => removeEcr(e.id)); nAN = gen.length;
    for (const c of ex.anPrev || []) { if (!E.some(e => e.id === c.id)) { addEcr(anCopy(c)); nr++; } } }
  delete ex.anPrev; delete ex.anId; ex.cloture = false; delete ex.clotureLe; delete ex.fecDef; delete ex.provisoire;
  (ex.declotures ||= []).push({ le: new Date().toISOString(), par: (S.user && S.user.nom) || "" });
  S.exCourant = ex.id; Store.touchAll(); saveAll();
  return { nAN, nl, nr, nx };
}
Object.assign(CLOACT, {
  decloturer: el => {
    const ex = (el && el.dataset && el.dataset.id && S.exercices.find(x => x.id === el.dataset.id)) || exCur(); if (!ex.cloture) { toast("Cet exercice n'est pas clôturé."); return; }
    const nx = anNextEx(ex); const y = ex.id.replace("EX", "");
    if (nx && nx.cloture) { toast("Déclôturez d'abord l'exercice " + nx.id.replace("EX", "") + " : on ne peut rouvrir qu'un exercice dont le suivant est ouvert."); return; }
    confirmBox("Déclôturer l'exercice " + y, `L'exercice ${y} redeviendra <b>modifiable</b>.<ul style="margin:8px 0 0;padding-left:18px;line-height:1.6"><li>Les à-nouveaux générés au ${nx ? frDate(nx.debut) : "début de l'exercice suivant"} sont supprimés (ils seront recalculés à la prochaine clôture)${(ex.anPrev || []).length ? " et les à-nouveaux de reprise d'origine sont restaurés" : ""}.</li><li>Le FEC définitif est annulé ; il sera régénéré à la nouvelle clôture.</li><li>Les écritures restent validées : pour les modifier, repassez-les en brouillard (Validation des périodes › Rouvrir).</li><li>La déclôture est tracée dans l'historique de l'exercice.</li></ul>`, "Déclôturer " + y, () => {
      const r = decloturer(ex); toast("Exercice " + y + " déclôturé" + (r.nAN ? " · à-nouveaux " + (r.nx ? r.nx.id.replace("EX", "") : "") + " supprimés" : "") + (r.nr ? " · " + r.nr + " reprise(s) restaurée(s)" : "") + (r.nl ? " · " + r.nl + " ligne(s) à relettrer" : "") + "."); render();
    }, true);
  },
  anDupFix: () => { const ex = exCur(); const r = anDupFix(ex, true); toast(r.n ? r.n + " écriture(s) d'à-nouveaux en double supprimée(s)" + (r.nl ? " · " + r.nl + " ligne(s) à relettrer" : "") + "." : "Aucun doublon d'à-nouveaux."); render(); }
});

/* écran Clôture : bouton Déclôturer + alerte doublons */
const _vClo3 = VIEWS.cloture;
VIEWS.cloture = () => {
  const ex = exCur(); let h = _vClo3(); const nx = anNextEx(ex);
  if (ex.cloture) {
    const blk = nx && nx.cloture; const hist = (ex.declotures || []).length ? `<div class="small muted" style="margin-top:6px">Déjà déclôturé ${ex.declotures.length} fois · dernière le ${frDate(ex.declotures[ex.declotures.length - 1].le.slice(0, 10))}</div>` : "";
    const box = `<div class="clo-declo"><div><b>Déclôturer l'exercice</b><div class="small muted">${blk ? "Déclôturez d'abord l'exercice " + nx.id.replace("EX", "") + "." : "Rouvre l'exercice pour corriger, supprime ses à-nouveaux sur l'exercice suivant puis permet de reclôturer."}</div>${hist}</div><button class="btn sm danger-b" data-act="decloturer" ${blk ? "disabled" : ""}>↺ Déclôturer ${ex.id.replace("EX", "")}</button></div>`;
    const k = h.indexOf('<div class="panel clo-card clo-def">'); if (k >= 0) { const j = h.indexOf('<div class="clo-fec">', k); if (j >= 0) h = h.slice(0, j) + box + h.slice(j); }
  }
  const d = anDupScan(ex);
  if (d.diff.length) h = h.replace(/(<div class="grid g2 clo-row")/, `<div class="banner warn" style="margin-top:16px">L'exercice ${ex.id.replace("EX", "")} contient, en plus des à-nouveaux générés par la clôture de ${(anPrevEx(ex) || {}).id ? anPrevEx(ex).id.replace("EX", "") : "N-1"}, ${d.diff.length} autre(s) écriture(s) d'à-nouveaux (reprise ou import) aux montants différents : les soldes d'ouverture sont comptés deux fois. <button class="btn sm" data-act="anDupFix">Ne garder que les à-nouveaux de clôture</button></div>$1`);
  return h;
};
/* liste des exercices : bouton Déclôturer sur chaque exercice clôturé */
const _vClo3x = VIEWS.exercices;
VIEWS.exercices = (...a) => _vClo3x(...a).split("<tr").map(r => { const x = S.exercices.find(z => z.cloture && r.includes("<b>" + esc(z.id.replace("EX", "Exercice ")) + "</b>")); if (!x) return r; const nx = anNextEx(x);
  return r.replace(/<\/td><\/tr>/, `<button class="btn sm ghost danger" data-act="decloturer" data-id="${x.id}" ${nx && nx.cloture ? 'disabled title="Déclôturez d\'abord ' + nx.id.replace("EX", "") + '"' : ""}>↺ Déclôturer</button></td></tr>`); }).join("<tr");
