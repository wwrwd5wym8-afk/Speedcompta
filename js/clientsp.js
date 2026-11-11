/* ============================================================
   Espaces clients (version Claude) : la société préparée par l'éditeur est placée dans un
   espace chiffré propre au client (une clé par client). Le client reçoit un lien et un code :
   il arrive directement dans sa société, avec les modules de son offre. L'éditeur garde la clé
   et ouvre la société du client quand il veut.
   ============================================================ */
const CS = { map: null, loading: false };
const csPrivRef = () => Store.rawDb.doc("data/users/" + Store.uid + "/espaces");
const csOK = () => Store.mode === "db" && !!Store.rawDb && typeof eqDerive === "function";
async function csLoadMap(force) { if (!csOK()) return {}; if (CS.map && !force) return CS.map; try { const s = await csPrivRef().get(); CS.map = s.exists ? plain(s.data()) : {}; } catch (e) { CS.map = {}; } CS.map.lic ||= {}; return CS.map; }
async function csSaveMap() { if (!csOK()) return; await csPrivRef().set(CS.map); }
const csCode = secret => "SC2." + secret;
const csParse = code => { const m = /^SC2\.([A-Za-z0-9_-]{43})$/.exec(String(code || "").trim().replace(/\s+/g, "")); return m ? m[1] : null; };
const csAppUrl = () => { try { return (typeof scClientLink === "function" && scClientLink()) || (typeof mobAppUrl === "function" && mobAppUrl()) || ""; } catch (e) { return ""; } };

/* ---------- base : l'espace du client passe avant l'espace personnel ---------- */
const _csBase = Store.base;
Store.base = function () { if (this.asTeam) return this.asTeam.base; if (this.asUid) return "data/users/" + this.asUid; if (this.cs) return this.cs.base; if (this.team && this.team.on) return this.team.base; return "data/users/" + this.uid; };

/* ---------- démarrage côté client : clé de son espace ---------- */
const _csInit = Store.init;
Store.init = async function () { await _csInit.apply(this, arguments); if (!csOK()) return;
  try { const s = await this.rawDb.doc("data/users/" + this.uid + "/espace").get(); if (!s.exists) return; const c = plain(s.data()); if (!c.secret) return; const T = await eqDerive(c.secret); EQ.keys[T.h] = T.key; this.cs = Object.assign(T, { licence: c.licence || "" }); } catch (e) { logErr("espace client", e); } };
/* accès du client : celui de l'offre liée à son espace (l'accès écrit par l'éditeur reste prioritaire) */
const _csAccess = loadAccess;
loadAccess = async function () { await _csAccess.apply(this, arguments); if (!Store.cs || isAdmin()) return;
  const l = (CONFIG.licences || []).find(x => x.esp === Store.cs.h); if (!l) { UI.access = { role: "client", statut: "suspendu", offres: [] }; return; }
  if (!UI.access || UI.access.auto || UI.access.licence !== l.id) UI.access = Object.assign(licAccessFor(l), { espace: true }); };

/* ---------- activation par le code (ou le lien) ---------- */
const _csRedeem = licRedeem;
licRedeem = async function (code) { const secret = csParse(code); if (!secret) return _csRedeem.apply(this, arguments);
  if (!csOK()) return { err: "Ouvrez le logiciel en ligne pour activer votre espace." };
  let T; try { T = await eqDerive(secret); } catch (e) { return { err: "Code d'accès invalide." }; }
  const l = (CONFIG.licences || []).find(x => x.esp === T.h); if (!l) return { err: "Ce code ne correspond à aucun accès actif. Contactez votre cabinet." };
  if (l.statut === "suspendu") return { err: "Cet accès a été suspendu par votre cabinet." };
  await Store.rawDb.doc("data/users/" + Store.uid + "/espace").set({ secret, h: T.h, licence: l.id, le: new Date().toISOString() });
  try { await saveMyReg({ licence: { id: l.id, esp: T.h, le: todayISO() } }); } catch (e) { }
  return { ok: true, l }; };
/* lien d'accès : #acces=SC2.… active l'espace automatiquement à l'ouverture */
(function () { const m = /acces=(SC2\.[A-Za-z0-9_-]{43})/.exec(location.hash || ""); if (m) { try { sessionStorage.setItem("sc:acces", m[1]); } catch (e) { } try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { } } })();
(function wait() { if (!window.__SC_READY) return setTimeout(wait, 400); let c = null; try { c = sessionStorage.getItem("sc:acces"); } catch (e) { } if (!c || Store.cs || isAdmin()) return;
  try { sessionStorage.removeItem("sc:acces"); } catch (e) { } licRedeem(c).then(r => { if (r.err) toast(r.err); else { toast("Votre espace est activé ✓ Ouverture de votre société…"); setTimeout(() => location.reload(), 900); } }); })();
const _csRedBox = licRedeemBox; licRedeemBox = function () { return _csRedBox.apply(this, arguments).replace('placeholder="SC-XXX-XXXX-XXXX"', 'placeholder="Collez le code reçu (SC-… ou SC2.…)"'); };

/* ---------- éditeur : placer la société du client dans son espace ---------- */
async function csMove(l, ids) { await csLoadMap(); let E0 = CS.map.lic[l.id]; let T;
  if (E0 && E0.secret) T = await eqDerive(E0.secret); else { const secret = eqNewSecret(); T = await eqDerive(secret); E0 = CS.map.lic[l.id] = { secret, h: T.h, client: l.client, dossiers: [], cree: new Date().toISOString() }; }
  EQ.keys[T.h] = T.key; const src = Store.base(); const db = Store.db; const moved = [];
  for (const id of ids) { if (E0.dossiers.includes(id)) continue; const d = await db.doc(src + "/d_" + id).get(); if (!d.exists) continue; const meta = d.data();
    await db.doc(T.base + "/d_" + id).set(meta);
    for (const c of EQ_SUB) { const q = await db.doc(src + "/d_" + id).collection(c).get(); for (const x of q.docs) await db.doc(T.base + "/d_" + id).collection(c).doc(x.id).set(x.data()); }
    moved.push({ id, nom: meta.nom || "Société" }); }
  if (moved.length) { const s = await db.doc(T.base + "/index").get(); const ix = s.exists ? plain(s.data()) : { dossiers: [] }; ix.dossiers ||= []; moved.forEach(m => { if (!ix.dossiers.some(x => x.id === m.id)) ix.dossiers.push(m); }); ix.current ||= moved[0].id; await db.doc(T.base + "/index").set(ix);
    E0.dossiers = [...new Set(E0.dossiers.concat(moved.map(m => m.id)))]; E0.client = l.client; await csSaveMap();
    /* retrait de l'espace de l'éditeur (après copie vérifiée) */
    const raw = Store.rawDb; for (const m of moved) { for (const c of EQ_SUB) { try { const q = await raw.doc(src + "/d_" + m.id).collection(c).get(); for (const x of q.docs) await raw.doc(src + "/d_" + m.id).collection(c).doc(x.id).delete(); } catch (e) { } } try { await raw.doc(src + "/d_" + m.id).delete(); } catch (e) { } }
    INDEX.dossiers = (INDEX.dossiers || []).filter(x => !moved.some(m => m.id === x.id)); if (moved.some(m => m.id === INDEX.current)) INDEX.current = (INDEX.dossiers[0] || {}).id || null;
    try { await Store.setIndex(INDEX); } catch (e) { } }
  return { h: T.h, moved }; }
async function csEnter(l) { await csLoadMap(); const E0 = CS.map.lic[l.id]; if (!E0) { toast("Aucune société n'est encore placée dans l'espace de ce client."); return; }
  try { await Store.flush(); } catch (e) { } const T = await eqDerive(E0.secret); EQ.keys[T.h] = T.key;
  const s = await Store.db.doc(T.base + "/index").get(); const ix = s.exists ? plain(s.data()) : null; if (!ix || !(ix.dossiers || []).length) { toast("L'espace de ce client est vide."); return; }
  Store.asTeam = { base: T.base }; const id = ix.current || ix.dossiers[0].id; let r = null; try { r = await withTO(Store.loadDossier(id), 15000, null); } catch (e) { }
  if (!r || !r.meta) { Store.asTeam = null; toast("Impossible d'ouvrir la société de ce client."); return; }
  UI.asClient = { uid: l.uid || "", name: l.client || "", soc: r.meta.nom }; INDEX = ix; INDEX.current = id; setDossier(r.meta, r.ecr); UI.view = "dashboard"; UI.modal = null; render();
  toast("Vous êtes dans la société de " + (l.client || r.meta.nom) + " : vos modifications sont enregistrées dans son espace."); }

/* ---------- fenêtres « accès client » : choix de la société ---------- */
function csPicker(d, lic) { const E0 = lic && CS.map && CS.map.lic[lic.id]; const sel = new Set(d.dossiers || []); const own = ((typeof INDEX !== "undefined" && INDEX && INDEX.dossiers) || []).filter(x => !x.demo);
  const placed = E0 && E0.dossiers.length ? `<p class="small" style="margin:0 0 6px">Déjà dans l'espace du client : <b>${E0.dossiers.length} société(s)</b> <button class="btn sm" data-act="csOpen" data-id="${esc(lic.id)}">Ouvrir →</button></p>` : "";
  return `<div class="cl-dos"><b>Société du client</b><p class="small muted" style="margin:4px 0 8px">La société cochée passe dans l'espace chiffré de ce client : il y arrive directement avec son code, et vous l'ouvrez depuis « Clients et accès ».</p>${placed}${own.length ? own.map(x => `<label class="chk"><input type="checkbox" data-ch="csDos" data-id="${esc(x.id)}" ${sel.has(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("") : '<span class="small muted">Créez d\'abord la société du client dans « Dossiers », puis revenez ici.</span>'}</div>`; }
const _csRM = renderModal;
renderModal = function () { let h = _csRM.apply(this, arguments); const M = UI.modal; if (!M || !isAdmin() || !csOK()) return h;
  if (M.type === "licNew" || M.type === "licEdit") { if (!CS.map && !CS.loading) { CS.loading = true; csLoadMap().then(() => { CS.loading = false; if (UI.modal === M) render(); }); }
    if (!Array.isArray(M.d.dossiers)) M.d.dossiers = []; const lic = M.type === "licEdit" ? licList().find(x => x.id === M.id) : null;
    h = h.replace(/<p class="small muted">Un code d'activation unique est généré[^<]*<\/p>/, `<p class="small muted">Si vous cochez sa société ci-dessous, le client reçoit un lien et un code : il arrive directement dans sa société, avec les modules de l'offre.</p>`);
    const i = h.lastIndexOf('<div class="modal-f'); if (i > 0) h = h.slice(0, i) + csPicker(M.d, lic) + h.slice(i); }
  if (M.type === "licDone") { const l = licList().find(x => x.id === M.id) || {}; const E0 = CS.map && CS.map.lic[l.id];
    if (E0) h = h.replace(/<div class="lic-code">[\s\S]*?<\/div>/, `<div class="lic-code"><span class="small muted">Code d'accès à son espace</span><b class="mono" style="word-break:break-all;font-size:13px">${esc(csCode(E0.secret))}</b></div>`); }
  return h; };
Object.assign(LICCHG, { csDos: el => { const d = UI.modal.d; d.dossiers = (d.dossiers || []).filter(x => x !== el.dataset.id); if (el.checked) d.dossiers.push(el.dataset.id); } });
/* enregistrement : déplacement de la société puis lien entre l'accès et l'espace */
const _csPub = licPublish;
licPublish = async function (list, note) { const M = UI.modal; const ids = M && M.d && Array.isArray(M.d.dossiers) ? M.d.dossiers.slice() : [];
  if (ids.length && csOK() && isAdmin()) { const t = list.find(x => (M.id && x.id === M.id) || (!M.id && x.client === M.d.client && (x.email || "") === (M.d.email || "")));
    if (t) { toast("Placement de la société dans l'espace du client…"); try { const r = await csMove(t, ids); t.esp = r.h; M.d.dossiers = []; } catch (e) { logErr("espace client", e); toast("La société n'a pas pu être placée : " + (e.message || e)); } } }
  return _csPub.apply(this, arguments); };
/* message au client : lien d'accès direct + code */
const _csMsg = licMessage;
licMessage = function (l, code) { const E0 = CS.map && CS.map.lic[l.id]; if (!E0) return _csMsg.apply(this, arguments);
  const V = venteCfg(); const o = V.offres.find(x => x.id === l.offre) || {}; const nom = (CONFIG.branding && CONFIG.branding.nom) || "Speedix"; const c = csCode(E0.secret); const url = csAppUrl();
  return { sujet: "Votre espace " + nom + " est prêt", corps: `Bonjour${l.client ? " " + l.client : ""},\n\nVotre espace ${nom} est prêt, avec votre société déjà créée (offre ${o.nom || l.offre}${l.expire ? ", valable jusqu'au " + frDate(l.expire) : ""}).\n\n1. Ouvrez ${nom} : ${url || "[lien du logiciel]"}\n2. Connectez-vous (compte gratuit, 1 minute).\n3. Dans « J'ai un code d'activation », collez votre code d'accès :\n\n   ${c}\n\nVous arrivez directement dans votre société. Ce code est personnel : ne le partagez pas.\n\nBien cordialement,\n${V.societe || nom}${V.email ? "\n" + V.email : ""}${V.tel ? "\n" + V.tel : ""}` }; };
/* liste des accès : ouvrir la société du client, liaison automatique des comptes */
Object.assign(LICACT, { csOpen: el => { const l = licList().find(x => x.id === el.dataset.id); if (l) csEnter(l); } });
const _csLicV = VIEWS.licences;
VIEWS.licences = function () { if (isAdmin() && csOK() && !CS.map && !CS.loading) { CS.loading = true; csLoadMap().then(() => { CS.loading = false; if (UI.view === "licences") render(); }); }
  const h = _csLicV.apply(this, arguments); return h.replace(/(<button class="btn sm" data-act="licMsg" data-id="([^"]+)">)/g, (m, a, id) => { const l = licList().find(x => x.id === id); return (l && l.esp ? `<button class="btn sm pri" data-act="csOpen" data-id="${esc(id)}">Ouvrir sa société</button>` : "") + a; }); };
const _csSync = licSync;
licSync = async function () { await _csSync.apply(this, arguments); const st = UI.sub.lic; if (!st || !st.reg || !csOK()) return; const L = deep(licList()); let ch = false;
  for (const u of st.reg) { const lr = u.licence; if (!lr || !lr.esp) continue; const l = L.find(x => x.esp === lr.esp); if (!l) continue; if (!l.uid) { l.uid = u.id; l.nomCompte = u.name || ""; ch = true; }
    if (l.uid === u.id) { try { await Store.db.doc("access/" + u.id).set(Object.assign(licAccessFor(l), { maj: new Date().toISOString() })); } catch (e) { } } }
  if (ch) { try { await _csPub(L, "Liaison des espaces clients"); } catch (e) { } } };
