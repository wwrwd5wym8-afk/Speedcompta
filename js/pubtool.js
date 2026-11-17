/* ============================================================================
   Publications : barre d'outils (Recalculer · Imprimer · Filigrane · Périodicité · Excel)
   - présente sur toutes les pages de Publications (publications, situation, états, flux, exports…)
   - Imprimer : la publication ou la situation ouverte, sinon le choix d'une publication
   - Filigrane : texte appliqué aux éditions de ce type, modifiable en un clic
   - Périodicité : situations mensuelles, trimestrielles, semestrielles ou annuelles ;
     crée en une fois les situations manquantes de l'exercice (rien n'est remplacé) ou, dans une
     publication de situation, place la date de fin sur la période choisie
   ========================================================================== */
const PUB_PER = [["m", "Mensuelle", 1], ["t", "Trimestrielle", 3], ["s", "Semestrielle", 6], ["a", "Annuelle", 12]];
function pubPerEnds(ex, step) { const out = []; const d0 = new Date(ex.debut + "T12:00:00"); for (let k = step; k <= 24; k += step) { const d = new Date(d0.getFullYear(), d0.getMonth() + k, 0, 12); const iso = d.toISOString().slice(0, 10); if (iso > ex.fin) break; out.push(iso); } if (!out.includes(ex.fin) && step === 12) out.push(ex.fin); return out; }
function pubToolHTML() { const v = UI.view; const u = pubUI(); const ed = v === "pubs" && u.edit ? pubSt().list.find(x => x.id === u.edit) : null; const sit = v === "pubSit" ? (typeof sitCur === "function" ? sitCur() : null) : null;
  const per = (S.sits || {}).per || ""; const perL = (PUB_PER.find(x => x[0] === per) || [, ""])[1];
  const ic = (d, l, act, extra, dis) => `<button class="ptb-b" data-act="${act}" ${dis ? "disabled" : ""} ${extra || ""}>${d}<span>${l}</span></button>`;
  return `<div class="pb-tool">${ic(`<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>`, "Recalculer", "pubRecalc")}${ic(`<svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z"/></svg>`, "Imprimer", "pubPrint")}${typeof wmChipHTML === "function" ? wmChipHTML().replace('class="wm-chip"', 'class="wm-chip pb-wm"') : ""}
    <button class="ptb-b" data-act="pubPer"><svg viewBox="0 0 24 24"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/></svg><span>Périodicité</span>${perL ? `<em>${esc(perL)}</em>` : ""}<i>▾</i></button>
    ${ed || sit ? ic(`<svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5zM9 12l6 6M15 12l-6 6"/></svg>`, "Excel", ed ? "pubXls" : "sitBalX", ed ? `data-id="${ed.id}"` : "") : ""}
    <span class="pb-sp"></span><span class="pb-ctx small muted">${ed ? "Publication : <b>" + esc(ed.nom) + "</b>" : sit ? "Situation : <b>" + esc(sit.nom) + "</b>" : ""}</span></div>`; }
(function () {
  const _m = pubMenuHTML; pubMenuHTML = function () { return _m.apply(this, arguments) + pubToolHTML(); };
  Object.assign(ACT, {
    pubRecalc: () => { if (typeof bumpV === "function") bumpV(); render(); toast("Recalculé à partir de la comptabilité du " + new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })); },
    pubPrint: el => { const u = pubUI(); if (UI.view === "pubs" && u.edit) return ACT.pubPdf({ dataset: { id: u.edit } }); if (UI.view === "pubSit" && typeof sitCur === "function" && sitCur()) return ACT.sitPdf();
      const L = pubSt().list; const r = el.getBoundingClientRect(); const it = [{ h: "Imprimer" }].concat(L.slice(0, 12).map(p => ({ ic: (PUB_KIND[p.kind] || PUB_KIND.an)[2], l: p.nom, run: () => ACT.pubPdf({ dataset: { id: p.id } }) })));
      if (!L.length) it.push({ ic: "＋", l: "Créer une plaquette annuelle", run: () => ACT.pubNew({ dataset: { k: "an" } }) });
      it.push("-", { ic: "📘", l: "Comptes annuels complets", run: () => go("compAnn") }, { ic: "⇩", l: "Exports PDF et Excel (états)", run: () => go("exports") }); kxMenu(r.left, r.bottom + 4, it, ""); },
    pubPer: el => { const r = el.getBoundingClientRect(); const u = pubUI(); const ed = UI.view === "pubs" && u.edit ? pubSt().list.find(x => x.id === u.edit) : null; const ex = exCur(); const T = S.sits ||= {}; const it = [];
      if (ed && ed.kind !== "an") { it.push({ h: "Fin de la période de « " + ed.nom + " »" }); PUB_PER.slice(0, 3).forEach(([k, l, st]) => { it.push({ h: l }); pubPerEnds(ex, st).forEach(d => it.push({ ic: ed.au === d ? "✓" : "", l: "Au " + frDate(d), run: () => { const o = ed.au; ed.au = d; ed.du = ex.debut; if (ed.nom === "Situation au " + frDate(o)) ed.nom = "Situation au " + frDate(d); pubLog("Période : du " + frDate(ex.debut) + " au " + frDate(d), ed); render(); } })); }); kxMenu(r.left, r.bottom + 4, it.slice(0, 40), ""); return; }
      it.push({ h: "Situations de l'exercice " + ex.fin.slice(0, 4) });
      PUB_PER.forEach(([k, l, st]) => { const ends = pubPerEnds(ex, st); const today = todayISO(); const due = ends.filter(d => d <= today); const list = due.length ? due : ends; const have = new Set(sitSt().list.map(s => s.au)); const miss = list.filter(d => !have.has(d));
        it.push({ ic: T.per === k ? "✓" : "", l: l + " · " + (miss.length ? miss.length + " situation(s) à créer" : "à jour"), run: () => { T.per = k; let n = 0; miss.forEach(d => { const s = sitNew(d); s.nom = "Situation " + l.toLowerCase() + " au " + frDate(d); s.per = k; sitSt().list.push(s); n++; }); if (n) sitLog(n + " situation(s) " + l.toLowerCase() + "(s) créée(s) : " + miss.map(frDate).join(", "), null); Store.touch(); const s0 = sitSt().list.filter(s => miss.includes(s.au)).sort((a, b) => b.au.localeCompare(a.au))[0]; if (s0) sitUI().id = s0.id; toast(n ? n + " situation(s) créée(s) — les situations existantes sont conservées." : "Périodicité " + l.toLowerCase() + " : toutes les situations existent déjà."); if (UI.view !== "pubSit") go("pubSit"); else render(); } }); });
      it.push("-", { ic: "✕", l: "Aucune périodicité", run: () => { delete T.per; Store.touch(); render(); } }); kxMenu(r.left, r.bottom + 4, it, ""); } });
  const st = document.createElement("style"); st.textContent = `
.pb-tool{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:-4px 0 12px;padding:6px 8px;border:1px solid #E3EBEA;border-radius:12px;background:#fff;box-shadow:0 1px 0 rgba(15,61,62,.03)}
.ptb-b{display:inline-flex;align-items:center;gap:7px;border:0;background:none;border-radius:9px;padding:6px 11px;font:inherit;font-size:13.5px;font-weight:600;color:#1F3D3D;cursor:pointer;transition:background .12s}.ptb-b:hover:not(:disabled){background:#EEF5F4}.ptb-b:disabled{opacity:.45;cursor:default}
.ptb-b svg{width:17px;height:17px;fill:none;stroke:#13585A;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.ptb-b em{font-style:normal;font-size:10.5px;font-weight:800;background:#E8F0FB;color:#2C5AA0;border-radius:999px;padding:1px 7px}.ptb-b i{font-style:normal;font-size:9px;opacity:.6}
.pb-tool .wm-chip{margin:0}.pb-tool .wm-tb{border:0;background:none;padding:6px 11px;font-size:13.5px}.pb-tool .wm-tb:hover{background:#EEF5F4}.pb-ctx b{color:#0F3D3E}`; document.head.appendChild(st);
})();
