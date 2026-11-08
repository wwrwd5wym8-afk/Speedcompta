/* ============================================================
   Transfert d'une société entre versions (Claude ↔ autonome) ou entre cabinets :
   export complet (fiche, écritures, factures, pièces reçues) dans un fichier .speedcompta,
   import en une étape dans « Dossiers ».
   ============================================================ */
const TR_SUB = ["m", "ventes", "inbox"];
async function trExport(id) { if (!Store.db) throw new Error("Stockage en ligne indisponible."); const base = Store.base() + "/d_" + id; const s = await Store.db.doc(base).get(); if (!s.exists) throw new Error("Société introuvable.");
  const docs = { "": plain(s.data()) }; for (const c of TR_SUB) { const q = await Store.db.doc(base).collection(c).get(); q.docs.forEach(d => { docs[c + "/" + d.id] = plain(d.data()); }); }
  const ent = ((INDEX && INDEX.dossiers) || []).find(d => d.id === id) || {};
  return { format: "speedcompta-societe", v: 1, exporte: new Date().toISOString(), id, nom: docs[""].nom || "Société", sum: ent.sum || null, docs }; }
async function trImport(F) { if (!Store.db) throw new Error("Stockage en ligne indisponible."); if (!F || F.format !== "speedcompta-societe" || !F.docs || !F.docs[""]) throw new Error("Ce fichier n'est pas un export de société SpeedCompta.");
  INDEX.dossiers ||= []; let id = F.id || uid(); const same = INDEX.dossiers.find(d => d.id === id); let replace = false;
  if (same) replace = confirm("« " + (same.nom || F.nom) + " » existe déjà dans votre liste.\n\nOK : la remplacer par le fichier importé.\nAnnuler : l'importer comme une nouvelle société.");
  if (!replace && (same || (await Store.db.doc(Store.base() + "/d_" + id).get()).exists)) id = uid();
  const base = Store.base() + "/d_" + id; const meta = Object.assign({}, F.docs[""], { id }); let nom = meta.nom || "Société"; if (!replace && INDEX.dossiers.some(d => d.nom === nom)) { nom += " (import)"; meta.nom = nom; }
  await Store.db.doc(base).set(meta); for (const k of Object.keys(F.docs)) { if (!k) continue; const [c, d] = k.split("/"); if (!TR_SUB.includes(c) || !d) continue; await Store.db.doc(base).collection(c).doc(d).set(F.docs[k]); }
  const ent = { id, nom }; if (F.sum) ent.sum = F.sum; if (replace) Object.assign(same, ent); else INDEX.dossiers.push(ent); INDEX.current = id; await saveIndex(); return { id, nom }; }
Object.assign(F2ACT, {
  trExp: async el => { const id = el.dataset.id || (S && S.id); try { if (Store.flush) await Store.flush(); toast("Préparation de l'export…"); const F = await trExport(id); const n = Object.keys(F.docs).length - 1;
      const name = (F.nom || "societe").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, "_") + ".speedcompta"; const bytes = new TextEncoder().encode(JSON.stringify(F));
      openModal({ type: "trReady", name, bytes, nom: F.nom, n, size: bytes.length }); } catch (e) { toast("Export impossible : " + (e.message || e)); } },
  trDl: async () => { const M = UI.modal; if (!M || !M.bytes) return; const b = M.bytes, name = M.name;
    /* téléchargement direct (navigateur), sinon canal de téléchargement de l'application */
    let ok = false; if (!Store.dl || window.SC_CLOUD_ON || !window.claude) { try { const u = URL.createObjectURL(new Blob([b], { type: "application/json" })); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); ok = true; } catch (e) { } }
    if (!ok && Store.dl) { try { await Store.dl.save({ filename: name, data: new Blob([b], { type: "application/json" }) }); ok = true; } catch (e) { if (e && e.code === "declined") { toast("Téléchargement annulé."); return; } } }
    if (ok) { closeModal(); toast("« " + name + " » enregistré dans vos téléchargements."); } else toast("Le téléchargement n'a pas abouti : réessayez."); },
  trImp: () => { if (window.SC_CLOUD_ON && !isAdmin()) { toast("L'import de société est réservé au cabinet."); return; } const i = document.createElement("input"); i.type = "file"; i.style.display = "none"; document.body.appendChild(i);
    i.onchange = async () => { const f = i.files && i.files[0]; i.remove(); if (!f) return; let F;
      try { const txt = await f.text(); try { F = JSON.parse(txt); } catch (e) { throw new Error("le fichier « " + f.name + " » n'est pas un export de société SpeedCompta (fichier .speedcompta)."); }
        openModal({ type: "trWait", nom: F && F.nom || f.name }); render();
        if (Store.as) { try { await Store.flush(); } catch (e) { } Store.as = null; Store.asLabel = ""; INDEX = (await Store.getIndex()) || { dossiers: [] }; }
        if (Store.flush) await Store.flush(); const r = await trImport(F); const d = await Store.loadDossier(r.id); if (d && d.meta) setDossier(d.meta, d.ecr);
        closeModal(); toast("✓ Société importée : " + r.nom); go("dashboard"); }
      catch (e) { console.warn(e); openModal({ type: "trErr", msg: (e && e.message) || String(e) }); } };
    i.click(); }
});
/* boutons dans « Dossiers » */
(function () { const _v = VIEWS.dossiers; if (!_v) return; VIEWS.dossiers = function () { const h = _v.apply(this, arguments); if (window.SC_CLOUD_ON && !isAdmin()) return h;
  const bar = `<div class="tr-bar"><span>🔁 <b>Transférer une société</b> entre la version Claude et la version autonome, ou vers un autre cabinet.</span><div class="row"><button class="btn sm" data-act="trImp">⬆ Importer une société</button>${S && !S.demo ? `<button class="btn sm" data-act="trExp" data-id="${esc(S.id)}">⬇ Exporter ${esc(S.nom)}</button>` : ""}</div></div>`;
  const i = h.indexOf("</h1>"); if (i < 0) return bar + h; const j = h.indexOf("</div></div>", i); return j > 0 ? h.slice(0, j + 12) + bar + h.slice(j + 12) : h + bar; };
  const st = document.createElement("style"); st.textContent = `.tr-spin{width:36px;height:36px;margin:0 auto 12px;border-radius:50%;border:4px solid #E3EBEA;border-top-color:#13585A;animation:trS .8s linear infinite}@keyframes trS{to{transform:rotate(360deg)}}.tr-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:#F5F8F8;border:1px solid #E3EBEA;border-radius:12px;padding:10px 14px;margin:0 0 14px;font-size:13.5px}`; document.head.appendChild(st); })();

const _rmTr = renderModal;
renderModal = function () { const M = UI.modal; if (M && M.type === "trWait") return `<div class="modal-bg"><div class="modal" style="max-width:420px"><div class="modal-b" style="text-align:center;padding:28px"><div class="tr-spin"></div><p><b>Import de ${esc(M.nom || "la société")}…</b><br><span class="small muted">Écritures, factures et paramètres : quelques secondes.</span></p></div></div></div>`;
  if (M && M.type === "trErr") return `<div class="modal-bg"><div class="modal" style="max-width:460px"><div class="modal-h"><h3>Import impossible</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-b"><p>${esc(M.msg)}</p><p class="small muted">Vérifiez que vous avez choisi le fichier <b>.speedcompta</b> exporté depuis SpeedCompta, et que vous êtes connecté en tant que cabinet. Si le problème persiste, envoyez une capture de ce message.</p></div><div class="modal-f"><button class="btn pri" data-act="trImp">Choisir un autre fichier</button></div></div></div>`;
  if (!M || M.type !== "trReady") return _rmTr.apply(this, arguments);
  return `<div class="modal-bg"><div class="modal" style="max-width:460px"><div class="modal-h"><h3>Export prêt</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-b" style="text-align:center">
    <div style="font-size:40px">📦</div><p><b>${esc(M.nom)}</b><br><span class="small muted">${M.n} documents · ${Math.max(1, Math.round(M.size / 1024))} Ko</span></p>
    <button class="btn pri" style="font-size:15px;padding:12px 22px" data-act="trDl">⬇ Télécharger ${esc(M.name)}</button>
    <p class="small muted" style="margin-top:14px">Ensuite, dans l'autre version : <b>Dossiers › ⬆ Importer une société</b>, puis choisissez ce fichier.</p></div></div></div>`; };
