/* ============================================================
   SpeedCompta en ligne (version autonome) : connexion des clients par e-mail + code d'accès,
   le client ne crée pas de société (c'est le cabinet qui la prépare), sociétés visibles
   dans la liste des accès, récupération des sociétés placées par l'ancien système d'espaces.
   ============================================================ */
if (window.SC_CLOUD_ON) (function () {
  const low = s => String(s || "").trim().toLowerCase();
  const cli = () => !isAdmin();

  /* ---------- le client ne crée pas de société ---------- */
  const NO = "[data-act=newSoc],[data-act=welNew],[data-act=welDemo],[data-act=dsNew]";
  document.addEventListener("click", e => { if (!cli()) return; const t = e.target.closest && e.target.closest(NO); if (!t) return;
    e.preventDefault(); e.stopPropagation(); toast("Votre société est préparée par votre cabinet : contactez-le pour en ajouter une."); }, true);
  const st = document.createElement("style");
  st.textContent = `.sc-cli ${NO.split(",").join(",.sc-cli ")}{display:none!important}.sc-cli .banner [data-v=dossiers]{display:none!important}
  .cl-wait{max-width:520px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #E3E8E8;border-radius:16px;text-align:center;font-family:inherit}
  .cl-wait img{width:64px;height:64px;border-radius:14px}.cl-wait h1{font-size:22px;margin:14px 0 8px;color:#0F3D3E}.cl-wait p{color:#4A5B5B;line-height:1.6}
  .lic-soc{font-size:12px;color:#13585A;margin-bottom:6px}`;
  document.head.appendChild(st);
  const _rn = renderNow; renderNow = function () { document.documentElement.classList.toggle("sc-cli", cli()); return _rn.apply(this, arguments); };
  const _wel = welHTML;
  welHTML = function () { if (!cli() || UI._welcome === "preview") return _wel.apply(this, arguments); document.documentElement.classList.add("sc-cli");
    const ico = window.SCLOGO ? SCLOGO.iconURL() : ""; const a = UI.access || {};
    return `<div class="cl-wait"><img src="${ico}" alt=""><h1>Bienvenue${UI.userEmail ? "" : ""}</h1>
      <p>${a.statut === "attente" ? "Votre accès n'est pas encore activé par votre cabinet." : "Votre cabinet prépare votre société : elle apparaîtra ici dès qu'elle sera prête."}</p>
      <p class="small">Connecté avec <b>${esc(UI.userEmail || "")}</b></p>
      <p><a href="#" onclick="SC_LOGOUT();return false">Se déconnecter</a></p></div>`; };

  /* ---------- message et fenêtre de fin : e-mail + code ---------- */
  licMessage = function (l, code) { const V = venteCfg(); const o = V.offres.find(x => x.id === l.offre) || {}; const nom = (CONFIG.branding && CONFIG.branding.nom) || "SpeedCompta";
    const c = code || (UI.licCodes || {})[l.id] || "[votre code]"; const link = location.href.split("#")[0].split("?")[0];
    return { sujet: "Votre accès " + nom, corps: `Bonjour${l.client ? " " + l.client : ""},\n\nVotre espace ${nom} est prêt (offre ${o.nom || l.offre}${l.expire ? ", valable jusqu'au " + frDate(l.expire) : ""}).\n\nPour vous connecter :\n1. Ouvrez ${link}\n2. Adresse e-mail : ${l.email || "[votre e-mail]"}\n3. Code d'accès : ${c}\n\nVous arrivez directement dans votre société, avec les fonctionnalités de votre offre. Gardez ce code : il vous sert à chaque connexion.\n\nPour l'installer comme une application :\n- iPhone : dans Safari, Partager puis « Sur l'écran d'accueil »\n- Android et ordinateur : « Installer l'application »\n\nBien cordialement,\n${V.societe || nom}${V.email ? "\n" + V.email : ""}${V.tel ? "\n" + V.tel : ""}` }; };
  const _rm = renderModal;
  renderModal = function () { let h = _rm.apply(this, arguments); const M = UI.modal; if (!M || !isAdmin()) return h;
    if (M.type === "licNew") { const d = M.d; const F = ["SARL", "SAS", "SASU", "EURL", "EI", "SCI", "Association"];
      const nb = `<div class="cl-dos cl-new"><b>Société du client</b><p class="small muted" style="margin:4px 0 8px">Pas besoin de la créer avant : indiquez son nom, elle est créée avec l'accès. Ou cochez ci-dessous une société déjà créée.</p><div class="row" style="gap:8px;flex-wrap:wrap"><input class="in" data-ch="clSoc" data-f="socNom" placeholder="Nom de la société (ex. SARL ANNE)" value="${esc(d.socNom || "")}" style="flex:1;min-width:200px"><select class="in" data-ch="clSoc" data-f="socForme" style="width:140px">${F.map(f => `<option ${f === (d.socForme || "SARL") ? "selected" : ""}>${f}</option>`).join("")}</select></div></div>`;
      const i = h.indexOf('<div class="cl-dos">'); h = i > 0 ? h.slice(0, i) + nb + h.slice(i) : h; }
    if (M.type === "licNew" || M.type === "licEdit") h = h.replace(/Le client ouvre le lien, touche « Première connexion » et crée son mot de passe avec <b>cet e-mail<\/b> : il obtient automatiquement les accès de l'offre\./, "Le client se connecte avec <b>cet e-mail</b> et le <b>code d'accès</b> généré : il arrive directement dans sa société, avec les accès de l'offre.");
    if (M.type === "licDone") h = h.replace("Code d'activation</span>", "Code d'accès du client (avec son e-mail)</span>");
    if (M.type === "licDone" && M.code && !/lic-code/.test(h)) { const box = `<div class="lic-code" style="margin:10px 0;padding:12px;border-radius:10px;background:#F2F7F7;text-align:center"><div class="small muted">Code d'accès du client (à utiliser avec son e-mail)</div><b class="mono" style="font-size:20px;letter-spacing:1px">${esc(M.code)}</b></div>`;
      const i = h.indexOf('<div class="modal-b'); const j = i >= 0 ? h.indexOf(">", i) + 1 : -1; h = j > 0 ? h.slice(0, j) + box + h.slice(j) : box + h; }
    return h; };

  /* ---------- liste des accès : la société de chaque client ---------- */
  const NM = {}; let nmT = 0;
  async function loadNames() { if (!isAdmin() || loadNames.busy) return; const miss = licList().some(l => l.uid && !NM[l.uid]); if (!miss && Date.now() - nmT < 20000) return; loadNames.busy = true; setTimeout(() => loadNames.busy = false, 3000); nmT = Date.now(); let ch = false;
    for (const l of licList()) { if (!l.uid) continue; try { const s = await Store.db.doc("data/users/" + l.uid + "/index").get(); const n = s.exists ? ((plain(s.data()).dossiers) || []).map(x => x.nom).filter(Boolean) : [];
      if (JSON.stringify(NM[l.uid] || []) !== JSON.stringify(n)) { NM[l.uid] = n; ch = true; } } catch (e) { } }
    if (ch && UI.view === "licences" && !UI.modal) render(); }
  const _vl = VIEWS.licences;
  VIEWS.licences = function () { loadNames(); const own = {}; ((INDEX && INDEX.dossiers) || []).forEach(d => own[d.id] = d.nom);
    return _vl.apply(this, arguments).replace(/(<td[^>]*>)((?:<button class="btn sm pri" data-act="clOpen"[^>]*>[^<]*<\/button>)?<button class="btn sm" data-act="licMsg" data-id="([^"]+)">)/g, (m, td, rest, id) => {
      const l = licList().find(x => x.id === id) || {}; const n = l.uid ? (NM[l.uid] || []) : (l.dossiers || []).map(x => own[x]).filter(Boolean);
      return td + `<div class="lic-soc">🏢 ${n.length ? n.map(esc).join(", ") : '<span class="muted">aucune société</span>'}</div>` + rest; }); };


  /* ---------- la société du client doit être cochée ; ajout d'une société à un client déjà connecté ---------- */
  const _lc = LICACT.licCreate;
  LICACT.licCreate = async function () { const d = UI.modal && UI.modal.d;
    if (d && /@/.test(d.email || "") && !(d.dossiers || []).length) { const nom = String(d.socNom || d.client || "").trim(); if (!nom) { toast("Indiquez le nom de la société du client."); return; }
      /* société créée en même temps que l'accès : un seul formulaire */
      const keep = UI.modal; if (Store.as) { try { await Store.flush(); } catch (e) { } Store.as = null; Store.asLabel = ""; INDEX = (await Store.getIndex()) || { dossiers: [] }; INDEX.dossiers ||= []; }
      const y = new Date().getFullYear(); const n = newDossier({ nom, forme: d.socForme || "SARL", debut: y + "-01-01", fin: y + "-12-31" }); setDossier(n, []); INDEX.dossiers.push({ id: n.id, nom: n.nom }); INDEX.current = n.id; saveAll();
      try { await Store.flush(); await saveIndex(); } catch (e) { } UI.modal = keep; d.dossiers = [n.id]; }
    return _lc.apply(this, arguments); };
  async function place(l, ids) { if (Store.as) { try { await Store.flush(); } catch (e) { } Store.as = null; Store.asLabel = ""; INDEX = (await Store.getIndex()) || { dossiers: [] }; }
    const me = "data/users/" + Store.uid, to = "data/users/" + l.uid, db = Store.db; try { if (Store.flush) await Store.flush(); } catch (e) { }
    const s = await db.doc(to + "/index").get(); const ix = s.exists ? plain(s.data()) : { dossiers: [] }; ix.dossiers ||= []; const moved = [];
    for (const id of ids) { const d = await db.doc(me + "/d_" + id).get(); if (!d.exists) continue; const meta = d.data(); await db.doc(to + "/d_" + id).set(meta);
      for (const c of ["m", "ventes", "inbox"]) { const q = await db.doc(me + "/d_" + id).collection(c).get(); for (const x of q.docs) { await db.doc(to + "/d_" + id).collection(c).doc(x.id).set(x.data()); await db.doc(me + "/d_" + id).collection(c).doc(x.id).delete(); } }
      await db.doc(me + "/d_" + id).delete(); moved.push({ id, nom: meta.nom || "Société" }); if (!ix.dossiers.some(x => x.id === id)) ix.dossiers.push({ id, nom: meta.nom || "Société" }); }
    if (!moved.length) return 0; ix.current = moved[0].id; await db.doc(to + "/index").set(ix);
    const em = low(l.email); try { const r = db.doc("invites/" + em); const v = await r.get(); if (v.exists) { const x = plain(v.data()); x.dossiers = [...new Set((x.dossiers || []).concat(moved.map(m => m.id)))]; await r.set(x); } } catch (e) { }
    INDEX.dossiers = (INDEX.dossiers || []).filter(x => !moved.some(m => m.id === x.id)); if (moved.some(m => m.id === INDEX.current)) INDEX.current = (INDEX.dossiers[0] || {}).id || null;
    if (S && moved.some(m => m.id === S.id)) { const id = INDEX.current; const r = id ? await Store.loadDossier(id) : null; if (r && r.meta) setDossier(r.meta, r.ecr); }
    try { await saveIndex(); } catch (e) { } nmT = 0; return moved.length; }
  const _rm2 = renderModal;
  renderModal = function () { let h = _rm2.apply(this, arguments); const M = UI.modal; if (!M || !isAdmin() || M.type !== "licEdit") return h; const l = licList().find(x => x.id === M.id) || {}; if (!l.uid) return h;
    const own = ((INDEX && INDEX.dossiers) || []).filter(x => !x.demo); M.pl ||= [];
    const box = `<div class="cl-dos" style="margin-top:10px"><b>Ajouter une société dans son espace</b><p class="small muted" style="margin:4px 0 8px">La société cochée passe dans l'espace du client : il la retrouve à sa prochaine connexion, vous l'ouvrez avec « Ouvrir sa société ».</p>${own.length ? own.map(x => `<label class="chk"><input type="checkbox" data-ch="clPl" data-id="${esc(x.id)}" ${M.pl.includes(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("") + `<div style="margin-top:8px"><button class="btn sm pri" data-act="clPlace">Placer chez le client</button></div>` : '<span class="small muted">Créez d\'abord la société dans « Dossiers ».</span>'}</div>`;
    const i = h.lastIndexOf('<div class="modal-f'); return i > 0 ? h.slice(0, i) + box + h.slice(i) : h + box; };
  Object.assign(LICCHG, { clSoc: el => { UI.modal.d[el.dataset.f] = el.value; }, clPl: el => { const M = UI.modal; M.pl = (M.pl || []).filter(x => x !== el.dataset.id); if (el.checked) M.pl.push(el.dataset.id); } });
  Object.assign(LICACT, { clPlace: async () => { const M = UI.modal; const l = licList().find(x => x.id === M.id); if (!l || !(M.pl || []).length) { toast("Cochez la société à placer."); return; }
    toast("Placement de la société chez le client…"); try { const n = await place(l, M.pl); M.pl = []; toast(n ? "Société placée dans l'espace de " + (l.client || "votre client") + "." : "Société introuvable."); render(); } catch (e) { toast("Placement impossible : " + (e.message || e)); } } });
  /* ---------- récupération : sociétés placées dans un espace chiffré par l'ancien système ---------- */
  async function restore() { if (!isAdmin() || !Store.rawDb || typeof eqDerive !== "function") return; const raw = Store.rawDb; const ref = raw.doc("data/users/" + Store.uid + "/espaces");
    let m; try { const s = await ref.get(); if (!s.exists) return; m = plain(s.data()); } catch (e) { return; } const lic = m.lic || {}; const back = []; const me = "data/users/" + Store.uid;
    for (const k of Object.keys(lic)) { const E0 = lic[k]; if (!E0 || !E0.secret || !(E0.dossiers || []).length) continue;
      try { const T = await eqDerive(E0.secret); EQ.keys[T.h] = T.key; const db = Store.db;
        for (const id of E0.dossiers) { const d = await db.doc(T.base + "/d_" + id).get(); if (!d.exists) continue; const meta = d.data(); await raw.doc(me + "/d_" + id).set(meta);
          for (const c of EQ_SUB) { const q = await db.doc(T.base + "/d_" + id).collection(c).get(); for (const x of q.docs) await raw.doc(me + "/d_" + id).collection(c).doc(x.id).set(x.data()); }
          back.push({ id, nom: meta.nom || "Société" }); }
        await eqWipe(T.base, E0.dossiers); } catch (e) { console.warn("restore", e); } }
    if (back.length) { INDEX.dossiers = INDEX.dossiers || []; back.forEach(b => { if (!INDEX.dossiers.some(x => x.id === b.id)) INDEX.dossiers.push(b); }); try { await saveIndex(); } catch (e) { }
      toast("Société récupérée dans votre liste : " + back.map(b => b.nom).join(", ")); try { render(); } catch (e) { } }
    try { await ref.delete(); } catch (e) { } }
  (function wait() { if (!window.__SC_READY) return setTimeout(wait, 500); setTimeout(() => restore().catch(() => { }), 800); })();
})();
