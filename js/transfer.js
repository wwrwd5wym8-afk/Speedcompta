/* ============================================================
   Transfert d'une société entre versions (Claude ↔ autonome) ou entre cabinets :
   export complet (fiche, écritures, factures, pièces reçues) dans un fichier .speedcompta,
   import en une étape dans « Dossiers ».
   ============================================================ */
const TR_SUB = ["m", "ventes", "inbox"];
async function trExport(id) { if (!Store.db) throw new Error("Stockage en ligne indisponible."); const base = Store.base() + "/d_" + id; const s = await Store.db.doc(base).get(); if (!s.exists) throw new Error("Société introuvable.");
  const docs = { "": plain(s.data()) }; for (const c of TR_SUB) { const q = await Store.db.doc(base).collection(c).get(); q.docs.forEach(d => { docs[c + "/" + d.id] = plain(d.data()); }); }
  return { format: "speedcompta-societe", v: 1, exporte: new Date().toISOString(), id, nom: docs[""].nom || "Société", docs }; }
async function trImport(F) { if (!Store.db) throw new Error("Stockage en ligne indisponible."); if (!F || F.format !== "speedcompta-societe" || !F.docs || !F.docs[""]) throw new Error("Ce fichier n'est pas un export de société SpeedCompta.");
  INDEX.dossiers ||= []; let id = F.id || uid(); const exists = INDEX.dossiers.some(d => d.id === id) || (await Store.db.doc(Store.base() + "/d_" + id).get()).exists; if (exists) id = uid();
  const base = Store.base() + "/d_" + id; const meta = Object.assign({}, F.docs[""], { id }); let nom = meta.nom || "Société"; if (INDEX.dossiers.some(d => d.nom === nom)) { nom += " (import)"; meta.nom = nom; }
  await Store.db.doc(base).set(meta); for (const k of Object.keys(F.docs)) { if (!k) continue; const [c, d] = k.split("/"); if (!TR_SUB.includes(c) || !d) continue; await Store.db.doc(base).collection(c).doc(d).set(F.docs[k]); }
  INDEX.dossiers.push({ id, nom }); await saveIndex(); return { id, nom }; }
Object.assign(F2ACT, {
  trExp: async el => { const id = el.dataset.id || (S && S.id); try { if (Store.flush) await Store.flush(); toast("Préparation de l'export…"); const F = await trExport(id); const n = Object.keys(F.docs).length - 1;
      deliverFile((F.nom || "societe").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "_") + ".speedcompta", new TextEncoder().encode(JSON.stringify(F)), "json", null, { cat: "Sauvegardes", lib: "Export de " + F.nom });
      toast("Export prêt : " + F.nom + " (" + n + " documents)."); } catch (e) { toast("Export impossible : " + (e.message || e)); } },
  trImp: () => { if (window.SC_CLOUD_ON && !isAdmin()) { toast("L'import de société est réservé au cabinet."); return; } const i = document.createElement("input"); i.type = "file"; i.accept = ".speedcompta,.json,application/json";
    i.onchange = async () => { const f = i.files && i.files[0]; if (!f) return; try { toast("Import en cours…"); const F = JSON.parse(await f.text()); if (Store.flush) await Store.flush(); const r = await trImport(F); const d = await Store.loadDossier(r.id); if (d && d.meta) setDossier(d.meta, d.ecr); toast("Société importée : " + r.nom); go("dashboard"); } catch (e) { toast("Import impossible : " + (e.message || e)); } };
    i.click(); }
});
/* boutons dans « Dossiers » */
(function () { const _v = VIEWS.dossiers; if (!_v) return; VIEWS.dossiers = function () { const h = _v.apply(this, arguments); if (window.SC_CLOUD_ON && !isAdmin()) return h;
  const bar = `<div class="tr-bar"><span>🔁 <b>Transférer une société</b> entre la version Claude et la version autonome, ou vers un autre cabinet.</span><div class="row"><button class="btn sm" data-act="trImp">⬆ Importer une société</button>${S && !S.demo ? `<button class="btn sm" data-act="trExp" data-id="${esc(S.id)}">⬇ Exporter ${esc(S.nom)}</button>` : ""}</div></div>`;
  const i = h.indexOf("</h1>"); if (i < 0) return bar + h; const j = h.indexOf("</div></div>", i); return j > 0 ? h.slice(0, j + 12) + bar + h.slice(j + 12) : h + bar; };
  const st = document.createElement("style"); st.textContent = `.tr-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:#F5F8F8;border:1px solid #E3EBEA;border-radius:12px;padding:10px 14px;margin:0 0 14px;font-size:13.5px}`; document.head.appendChild(st); })();
