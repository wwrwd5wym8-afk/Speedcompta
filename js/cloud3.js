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
  const _wr = welRender; welRender = function () { const r = _wr.apply(this, arguments); if (UI._welcome === "preview" && window.SC_OFFRES) { pubOffres().then(() => SC_OFFRES(true)); } return r; };
  welHTML = function () {
    if (UI._welcome === "preview") { const ico = window.SCLOGO ? SCLOGO.iconURL() : "";
      return `<div class="wel"><div class="wel-prev">👁 <b>Aperçu</b> : voici ce que voit votre client en ouvrant votre lien. <button class="btn sm" data-act="welBack">⟵ Revenir à l'Espace éditeur</button> <button class="btn sm" onclick="SC_INTRO&&SC_INTRO()">▶ Revoir le message de bienvenue</button></div>
      <div class="cl-wrap" style="min-height:auto;padding:24px 0"><div class="cl-card"><div class="cl-brand"><img src="${ico}" alt="" width="56" height="56"><div><b>Speed<i>Compta</i></b><span>Simple · Rapide · Efficace</span></div></div>
      <h1>Connexion</h1><label>Adresse e-mail<input disabled placeholder="email-du-client@exemple.fr"></label><label>Code d'accès ou mot de passe<input disabled placeholder="SC-XXX-XXXX-XXXX"></label>
      <button class="cl-btn" type="button" disabled>Se connecter</button><p class="cl-sub" style="margin-top:12px">Client : saisissez l'e-mail et le <b>code d'accès</b> reçus de votre cabinet.</p></div></div>
      <div class="panel" style="padding:16px;max-width:560px;margin:0 auto"><b>Ensuite</b><ol class="small" style="line-height:1.8;margin:6px 0 0">
      <li>Le client tape son e-mail et le code que vous lui avez envoyé.</li><li>Il arrive directement dans <b>sa société</b>, avec uniquement les modules de son offre.</li><li>Il ne peut pas créer de société ni voir vos réglages (Administration, Studio créateur, offres).</li></ol></div><div class="cl-wrap" style="min-height:auto;padding:10px 0 30px"><div id="clOffres"></div></div></div>`; }
    if (!cli()) return _wel.apply(this, arguments); document.documentElement.classList.add("sc-cli");
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
  /* ---------- réinitialiser l'accès d'un client (compte d'essai, mot de passe oublié, mauvaise adresse) ---------- */
  async function resetClient(em) { const A = window.SC_AUTH, C = window.SC_CLOUD; const t = await A.token();
    const r = await fetch(C.url + "/rest/v1/rpc/sc_reset_client", { method: "POST", headers: { apikey: C.key, Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify({ p_email: em }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) { const m = (j && (j.message || j.hint)) || r.status; throw new Error(/SC_IS_EDITOR/.test(m) ? "C'est l'adresse de votre compte éditeur : choisissez une autre adresse pour le client." : /function|404|PGRST202/i.test(String(m) + r.status) ? "Mettez à jour la base : recollez supabase_setup.sql dans Supabase › SQL Editor puis « Run »." : String(m)); } return j; }
  Object.assign(LICACT, { clReset: async el => { const M = UI.modal; const l = licList().find(x => x.id === (el.dataset.id || (M && M.id))); if (!l || !/@/.test(l.email || "")) { toast("Indiquez d'abord l'e-mail du client."); return; }
    if (!confirm("Réinitialiser l'accès de " + (l.client || l.email) + " ?\n\nSon compte de connexion est supprimé, ses sociétés reviennent dans votre espace (rien n'est perdu), et il se reconnecte avec " + l.email + " + son code d'accès.")) return;
    toast("Réinitialisation…"); try { const r = await resetClient(l.email); const C = (await Store.db.doc("app/config").get()); if (C.exists) { const c = plain(C.data()); if (c.licences) CONFIG.licences = c.licences; }
      const I = await Store.getIndex(); if (I && !Store.as) INDEX = I; nmT = 0; toast(r === "none" ? "Aucun compte n'existait : le client peut se connecter avec son e-mail + son code." : "Accès réinitialisé : le client se connecte avec " + l.email + " + son code."); closeModal(); render(); }
    catch (e) { toast(e.message || String(e)); } } });
  const _rm3 = renderModal;
  renderModal = function () { let h = _rm3.apply(this, arguments); const M = UI.modal; if (!M || !isAdmin() || M.type !== "licEdit") return h; const l = licList().find(x => x.id === M.id) || {}; if (!/@/.test(l.email || "")) return h;
    const box = `<div class="cl-dos" style="margin-top:10px;border-color:#F3D9D6"><b>Le client n'arrive pas à se connecter ?</b><p class="small muted" style="margin:4px 0 8px">Compte créé lors d'un essai, mot de passe oublié, mauvaise adresse : réinitialisez son accès. Ses sociétés reviennent chez vous puis repartent chez lui à sa reconnexion avec <b>${esc(l.email)}</b> + son code.</p><button class="btn sm" data-act="clReset" data-id="${esc(l.id)}">↺ Réinitialiser l'accès</button></div>`;
    const i = h.lastIndexOf('<div class="modal-f'); return i > 0 ? h.slice(0, i) + box + h.slice(i) : h + box; };
  const _lc2 = LICACT.licCreate;
  LICACT.licCreate = async function () { const d = UI.modal && UI.modal.d; if (d && UI.userEmail && low(d.email) === low(UI.userEmail)) { toast("C'est l'adresse de votre compte éditeur : indiquez l'e-mail du client."); return; } return _lc2.apply(this, arguments); };
  const _rm2 = renderModal;
  renderModal = function () { let h = _rm2.apply(this, arguments); const M = UI.modal; if (!M || !isAdmin() || M.type !== "licEdit") return h; const l = licList().find(x => x.id === M.id) || {}; if (!l.uid) return h;
    const own = ((INDEX && INDEX.dossiers) || []).filter(x => !x.demo); M.pl ||= [];
    const box = `<div class="cl-dos" style="margin-top:10px"><b>Ajouter une société dans son espace</b><p class="small muted" style="margin:4px 0 8px">La société cochée passe dans l'espace du client : il la retrouve à sa prochaine connexion, vous l'ouvrez avec « Ouvrir sa société ».</p>${own.length ? own.map(x => `<label class="chk"><input type="checkbox" data-ch="clPl" data-id="${esc(x.id)}" ${M.pl.includes(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("") + `<div style="margin-top:8px"><button class="btn sm pri" data-act="clPlace">Placer chez le client</button></div>` : '<span class="small muted">Créez d\'abord la société dans « Dossiers ».</span>'}</div>`;
    const i = h.lastIndexOf('<div class="modal-f'); return i > 0 ? h.slice(0, i) + box + h.slice(i) : h + box; };
  Object.assign(LICCHG, { clSoc: el => { UI.modal.d[el.dataset.f] = el.value; }, clPl: el => { const M = UI.modal; M.pl = (M.pl || []).filter(x => x !== el.dataset.id); if (el.checked) M.pl.push(el.dataset.id); } });
  Object.assign(LICACT, { clPlace: async () => { const M = UI.modal; const l = licList().find(x => x.id === M.id); if (!l || !(M.pl || []).length) { toast("Cochez la société à placer."); return; }
    toast("Placement de la société chez le client…"); try { const n = await place(l, M.pl); M.pl = []; toast(n ? "Société placée dans l'espace de " + (l.client || "votre client") + "." : "Société introuvable."); render(); } catch (e) { toast("Placement impossible : " + (e.message || e)); } } });

  /* ---------- vitrine : les offres publiées pour l'écran de connexion ---------- */
  async function pubOffres() { if (!isAdmin() || !Store.db) return; try { const V = venteCfg(); const b = CONFIG.branding || {};
    const doc = { nom: b.nom || "SpeedCompta", slogan: b.slogan || "", actif: V.actif !== false, essai: V.essai || "", email: V.email || "", tel: V.tel || "", societe: V.societe || "",
      offres: (V.offres || []).map(o => ({ id: o.id, nom: o.nom, prix: o.prix, periode: o.periode, desc: o.desc || "", inclus: o.inclus || [], top: !!o.top, lien: o.lien || "" })), maj: new Date().toISOString() };
    const raw = Store.rawDb || Store.db; const ref = raw.doc("public/offres"); const s = await ref.get(); const old = s.exists ? plain(s.data()) : null;
    if (!old || JSON.stringify(Object.assign({}, old, { maj: 0 })) !== JSON.stringify(Object.assign({}, doc, { maj: 0 }))) await ref.set(doc); } catch (e) { console.warn("offres", e); } }
  const _save = ADM.save; ADM.save = async function () { const r = await _save.apply(this, arguments); pubOffres(); return r; };
  (function wait2() { if (!window.__SC_READY) return setTimeout(wait2, 600); setTimeout(pubOffres, 1500); })();
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
