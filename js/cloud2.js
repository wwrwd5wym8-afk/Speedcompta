/* ============================================================
   SpeedCompta en ligne : invitations des clients (accès selon l'offre + société préparée),
   ouverture des sociétés clientes par l'éditeur, déconnexion.
   ============================================================ */
if (window.SC_CLOUD_ON) (function () {
  const appLink = () => location.href.split("#")[0].split("?")[0];
  const low = s => String(s || "").trim().toLowerCase();

  /* ---------- invitations : écrites à chaque enregistrement des accès clients ---------- */
  async function syncInvites(list) { if (!isAdmin() || !Store.db) return; const seen = new Set();
    for (const l of list) { const em = low(l.email); if (!em || !/@/.test(em)) continue; seen.add(em); const ref = Store.db.doc("invites/" + em); let old = {}; try { const s = await ref.get(); if (s.exists) old = plain(s.data()); } catch (e) { }
      await ref.set(Object.assign({}, old, { email: em, client: l.client || "", licence: l.id, statut: l.statut || "actif", access: licAccessFor(l), dossiers: old.uid ? (old.dossiers || []) : (l.dossiers || []), editor: old.editor && old.uid ? old.editor : Store.uid, maj: new Date().toISOString() }));
      if (old.uid) { try { await Store.db.doc("access/" + old.uid).set(Object.assign(licAccessFor(l), { maj: new Date().toISOString() })); } catch (e) { } } }
    try { const q = await Store.db.collection("invites").get(); for (const d of q.docs) { const x = d.data() || {}; if (!seen.has(d.id) && !x.uid) await Store.db.doc("invites/" + d.id).delete(); } } catch (e) { } }
  const _pub = licPublish;
  licPublish = async function (list, note) { const M = UI.modal; if (M && M.d && Array.isArray(M.d.dossiers)) { const t = list.find(x => (M.id && x.id === M.id) || (!M.id && low(x.email) === low(M.d.email) && x.client === M.d.client)); if (t && !t.uid) t.dossiers = M.d.dossiers.slice(); }
    const r = await _pub.apply(this, arguments); try { await syncInvites(list); } catch (e) { console.warn(e); } return r; };

  /* ---------- message au client : lien + première connexion avec son e-mail ---------- */
  licMessage = function (l) { const V = venteCfg(); const o = V.offres.find(x => x.id === l.offre) || {}; const nom = (CONFIG.branding && CONFIG.branding.nom) || "SpeedCompta";
    return { sujet: "Votre espace " + nom + " est prêt", corps: `Bonjour${l.client ? " " + l.client : ""},\n\nVotre espace ${nom} est prêt (offre ${o.nom || l.offre}${l.expire ? ", valable jusqu'au " + frDate(l.expire) : ""}).\n\n1. Ouvrez ${nom} : ${appLink()}\n2. Touchez « Première connexion ».\n3. Saisissez votre adresse e-mail : ${l.email || "[votre e-mail]"}\n   puis choisissez votre mot de passe.\n\nVous arrivez directement dans votre société, avec les fonctionnalités de votre offre.\n\nPour l'installer comme une application :\n- iPhone : dans Safari, Partager puis « Sur l'écran d'accueil »\n- Android et ordinateur : « Installer l'application »\n\nBien cordialement,\n${V.societe || nom}${V.email ? "\n" + V.email : ""}${V.tel ? "\n" + V.tel : ""}` }; };

  /* ---------- fenêtres d'accès : choix de la société préparée pour le client ---------- */
  function dosPicker(d, claimed) { const own = ((typeof INDEX !== "undefined" && INDEX && INDEX.dossiers) || []).filter(x => !x.demo); const sel = new Set(d.dossiers || []);
    if (claimed) return `<div class="cl-dos"><b>Société du client</b><p class="small muted" style="margin:4px 0 8px">Le client a créé son compte : sa société est dans son espace.</p><button class="btn sm" data-act="clOpen" data-uid="${esc(claimed)}">Ouvrir sa société →</button></div>`;
    return `<div class="cl-dos"><b>Société(s) préparée(s) pour ce client</b><p class="small muted" style="margin:4px 0 8px">À sa première connexion, la ou les sociétés cochées passent dans son espace : il les retrouve directement, vous pouvez toujours les ouvrir.</p>${own.length ? own.map(x => `<label class="chk"><input type="checkbox" data-ch="clDos" data-id="${esc(x.id)}" ${sel.has(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("") : '<span class="small muted">Créez d\'abord la société du client dans « Dossiers », puis revenez ici.</span>'}</div>`; }
  const _rm = renderModal;
  renderModal = function () { let h = _rm.apply(this, arguments); const M = UI.modal; if (!M || !isAdmin()) return h;
    if (M.type === "licNew" || M.type === "licEdit") { const l = M.type === "licEdit" ? (licList().find(x => x.id === M.id) || {}) : {}; if (!Array.isArray(M.d.dossiers)) M.d.dossiers = (l.dossiers || []).slice();
      const box = dosPicker(M.d, l.uid);
      h = h.replace(/<p class="small muted">Un code d'activation unique est généré[^<]*<\/p>/, `<p class="small muted">Le client ouvre le lien, touche « Première connexion » et crée son mot de passe avec <b>cet e-mail</b> : il obtient automatiquement les accès de l'offre.</p>`);
      const i = h.lastIndexOf('<div class="modal-f'); h = i > 0 ? h.slice(0, i) + box + h.slice(i) : h.replace(/(<\/div>)(\s*<\/div>\s*)$/, box + "$1$2"); }
    if (M.type === "licDone") h = h.replace(/<div class="lic-code">[\s\S]*?<\/div>/, "");
    return h; };
  Object.assign(LICCHG || (window.LICCHG = {}), { clDos: el => { const d = UI.modal.d; d.dossiers = (d.dossiers || []).filter(x => x !== el.dataset.id); if (el.checked) d.dossiers.push(el.dataset.id); } });
  const _lc = LICACT.licCreate;
  LICACT.licCreate = async function () { const d = UI.modal && UI.modal.d; if (d && !/@/.test(d.email || "")) { toast("Indiquez l'e-mail du client : il s'en sert pour sa première connexion."); return; } return _lc.apply(this, arguments); };

  /* ---------- l'éditeur ouvre la société d'un client ---------- */
  const _base = Store.base; Store.base = function () { return "data/users/" + (this.as || this.uid); };
  async function openAs(uid, label) { try { if (Store.flush) await Store.flush(); } catch (e) { }
    const s = await Store.db.doc("data/users/" + uid + "/index").get(); const ix = s.exists ? plain(s.data()) : null;
    if (!ix || !(ix.dossiers || []).length) { toast("Ce client n'a pas encore de société."); return; }
    Store.as = uid; Store.asLabel = label || ""; INDEX = ix; const id = ix.current || ix.dossiers[0].id; const r = await Store.loadDossier(id);
    if (!r || !r.meta) { Store.as = null; toast("Société du client introuvable."); return; } setDossier(r.meta, r.ecr); UI.modal = null; UI.view = "dashboard"; render(); toast("Vous travaillez dans l'espace de " + (label || "votre client") + "."); }
  async function backHome() { try { if (Store.flush) await Store.flush(); } catch (e) { } Store.as = null; Store.asLabel = ""; const ix = await Store.getIndex(); INDEX = ix || { dossiers: [] };
    const id = INDEX.current || (INDEX.dossiers[0] || {}).id; const r = id ? await Store.loadDossier(id) : null; if (r && r.meta) setDossier(r.meta, r.ecr); UI.view = "licences"; render(); }
  /* sociétés passées chez un client : l'éditeur continue de travailler dans l'espace du client, sans doublon chez lui */
  let _cm = null, _cmT = 0;
  async function claimed(force) { if (!isAdmin()) return {}; if (!force && _cm && Date.now() - _cmT < 30000) return _cm; const m = {};
    try { const q = await Store.db.collection("invites").get(); q.docs.forEach(d => { const x = d.data() || {}; if (x.uid) (x.dossiers || []).forEach(id => { m[id] = { uid: x.uid, client: x.client || "" }; }); }); } catch (e) { } _cm = m; _cmT = Date.now(); return m; }
  async function guard() { if (!isAdmin() || Store.as || !S) return; const m = await claimed();
    if (INDEX && Array.isArray(INDEX.dossiers)) INDEX.dossiers = INDEX.dossiers.filter(d => !m[d.id] || d.id === S.id);
    const c = m[S.id]; if (!c) return; Store.as = c.uid; Store.asLabel = c.client;
    try { const s = await Store.db.doc("data/users/" + c.uid + "/index").get(); INDEX = s.exists ? plain(s.data()) : { current: S.id, dossiers: [{ id: S.id, nom: S.nom }] }; } catch (e) { }
    toast("« " + S.nom + " » est maintenant dans l'espace de " + (c.client || "votre client") + " : vos modifications y sont enregistrées."); setTimeout(() => { try { render(); } catch (e) { } }, 0); }
  const _flush = Store.flush; Store.flush = async function () { try { await guard(); } catch (e) { } return _flush.apply(this, arguments); };
  Object.assign(LICACT, { clOpen: el => { const l = licList().find(x => x.uid === el.dataset.uid) || {}; openAs(el.dataset.uid, l.client); }, clBack: () => backHome(), clLogout: () => window.SC_LOGOUT() });
  const _vl = VIEWS.licences;
  let _cfgT = 0;
  VIEWS.licences = function () { if (isAdmin() && Date.now() - _cfgT > 15000) { _cfgT = Date.now(); const before = JSON.stringify(CONFIG.licences || []);
      ADM.load().then(() => { try { applyConfig(); } catch (e) { } _cm = null; if (JSON.stringify(CONFIG.licences || []) !== before && UI.view === "licences" && !UI.modal) render(); }).catch(() => { }); }
    const h = _vl.apply(this, arguments); return h.replace(/(<button class="btn sm" data-act="licMsg" data-id="([^"]+)">)/g, (m, a, id) => { const l = licList().find(x => x.id === id); return (l && l.uid ? `<button class="btn sm pri" data-act="clOpen" data-uid="${esc(l.uid)}">Ouvrir sa société</button>` : "") + a; })
    .replace(/<h3 style="margin-top:0">Comment le client obtient son accès<\/h3><ol[\s\S]*?<\/ol>/, `<h3 style="margin-top:0">Comment le client obtient son accès</h3><ol class="small" style="line-height:1.8;margin:0"><li>Créez la société du client dans « Dossiers ».</li><li>Créez son accès depuis une offre, avec <b>son e-mail</b>, et cochez sa société.</li><li>Envoyez-lui le message : il ouvre le lien, touche « Première connexion » et choisit son mot de passe.</li><li>Il arrive directement dans sa société, avec uniquement les modules de son offre. Sa société passe dans son espace ; vous l'ouvrez avec « Ouvrir sa société ».</li><li>Vous gardez la main ici : changer d'offre, prolonger, suspendre.</li></ol>`); };
  /* bandeau quand l'éditeur travaille chez un client */
  const _rn = renderNow; renderNow = function () { const r = _rn.apply(this, arguments); let b = document.getElementById("clAsBar");
    if (Store.as) { if (!b) { b = document.createElement("div"); b.id = "clAsBar"; document.body.appendChild(b); } b.innerHTML = `<span>👁 Espace client : <b>${esc(Store.asLabel || "client")}</b> · vos modifications sont enregistrées dans sa société</span><button data-act="clBack">Revenir à mon espace</button>`; }
    else if (b) b.remove(); return r; };
  document.addEventListener("click", e => { const t = e.target.closest && e.target.closest("#clAsBar [data-act=clBack]"); if (t) { e.preventDefault(); backHome(); } }, true);

  /* ---------- compte : e-mail et déconnexion ---------- */
  const _vp = VIEWS.params;
  VIEWS.params = function () { const h = _vp.apply(this, arguments); return `<section class="card cl-acc"><div><b>Mon compte</b><div class="small muted">${esc(UI.userEmail || "")}${isAdmin() ? " · éditeur" : ""}</div></div><button class="btn" data-act="clLogout">Se déconnecter</button></section>` + h; };
  const _bs = blockedScreen; blockedScreen = function (msg) { return _bs.apply(this, arguments).replace(/<\/div><\/div>$/, `<div style="margin-top:16px"><a href="#" onclick="SC_LOGOUT();return false" class="small">Se déconnecter</a></div></div></div>`); };
  if (CONFIG && CONFIG.textes) { }
  const _mob = VIEWS.mobApp; if (_mob) VIEWS.mobApp = function () { return _mob.apply(this, arguments).replace(/Vos sociétés et écritures sont enregistrées <b>sur cet appareil<\/b>[^<]*(<\/div>)/, "Vos sociétés et écritures sont enregistrées en ligne, dans votre compte : connectez-vous avec le même e-mail sur n'importe quel téléphone ou ordinateur pour les retrouver.$1"); };
})();
