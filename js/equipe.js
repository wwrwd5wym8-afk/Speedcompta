/* ============================================================
   Équipe : collaborateurs, rôles et droits (offre avec le module « equipe »)
   - espace d'équipe partagé et chiffré (AES-GCM, clé contenue dans les invitations)
   - rôles, droits par module (aucun / lecture / modification), dossiers attribués,
     droits de validation, de clôture et de création de dossiers
   - révocation avec renouvellement de la clé, sauvegarde privée de l'administrateur
   ============================================================ */
const EQ = { keys: {}, team: null, me: null, cache: {} };
const EQ_MODS = [["compta", "Comptabilité générale"], ["cli", "Clients et facturation"], ["fou", "Fournisseurs et achats"], ["bq", "Banque"], ["fisc", "Fiscalité"], ["immo", "Immobilisations et emprunts"], ["rap", "Rapports et liasse"], ["clo", "Clôture et FEC"], ["budget", "Budget"], ["finance", "Finance"], ["pa", "PA (plateforme agréée)"], ["juridique", "Juridique"], ["dp", "Dossier permanent"], ["crm", "CRM"], ["ia", "Assistant IA"], ["params", "Paramètres du dossier"]];
const EQ_FLAGS = [["valider", "Valider et dévalider les écritures"], ["cloturer", "Clôturer un exercice"], ["creer", "Créer et supprimer des dossiers"], ["equipe", "Gérer l'équipe et les droits"]];
const EQ_ROLES = {
  admin: { lib: "Administrateur du cabinet", all: "write", over: {}, flags: { valider: 1, cloturer: 1, creer: 1, equipe: 1 } },
  expert: { lib: "Expert-comptable", all: "write", over: {}, flags: { valider: 1, cloturer: 1, creer: 1 } },
  collab: { lib: "Collaborateur comptable", all: "write", over: { clo: "read", juridique: "read", params: "read" }, flags: {} },
  assist: { lib: "Assistant(e) de saisie", all: "read", over: { compta: "write", cli: "write", fou: "write", bq: "write", crm: "write", ia: "none", params: "none", juridique: "none" }, flags: {} },
  lecteur: { lib: "Lecture seule", all: "read", over: { ia: "none" }, flags: {} }
};
const EQ_LV = { none: "Aucun accès", read: "Lecture", write: "Modification" };
/* ---------- chiffrement ---------- */
const eqB64 = { enc(u8) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }, dec(b) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; } };
const eqU = { enc: u8 => eqB64.enc(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), dec: s => eqB64.dec(String(s).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s).length + 3) % 4)) };
async function eqDerive(secret) { const raw = eqU.dec(secret); if (raw.length !== 32) throw new Error("code d'invitation invalide"); const dg = new Uint8Array(await crypto.subtle.digest("SHA-256", raw)); const h = [...dg].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32); const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]); return { h, key, base: "eq/" + h + "/w", secret }; }
async function eqEnc(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)))); const all = new Uint8Array(12 + ct.length); all.set(iv); all.set(ct, 12); return { _x: eqB64.enc(all), _v: 1 }; }
async function eqDec(key, data) { if (!data || typeof data._x !== "string") return null; try { const all = eqB64.dec(data._x); const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.subarray(0, 12) }, key, all.subarray(12)); return JSON.parse(new TextDecoder().decode(pt)); } catch (e) { return null; } }
/* ---------- base de données : chiffrement transparent de l'espace d'équipe ---------- */
function eqKeyFor(path) { const m = /^eq\/([0-9a-f]{32})\/w(\/|$)/.exec(path); return m ? EQ.keys[m[1]] || null : null; }
function eqDocRef(raw, path) {
  const key = eqKeyFor(path); const r = raw.doc(path); if (!key) return r; const self = {
    id: path.split("/").pop(), path,
    async get() { const s = await r.get(); if (!s.exists) return { exists: false, id: self.id, data: () => undefined }; const d = await eqDec(key, s.data()); return { exists: d != null, id: self.id, data: () => d }; },
    async set(o) { return r.set(await eqEnc(key, JSON.parse(JSON.stringify(o)))); },
    async update(o) { const s = await self.get(); return self.set(Object.assign({}, s.exists ? s.data() : {}, o)); },
    delete() { return r.delete(); }, collection: c => eqColRef(raw, path + "/" + c) };
  return self;
}
function eqColRef(raw, path) {
  const key = eqKeyFor(path); const c = raw.collection(path); if (!key) return c;
  return { path, doc: id => eqDocRef(raw, path + "/" + id),
    async get() { const q = await c.get(); const docs = []; for (const d of q.docs) { const v = await eqDec(key, d.data()); if (v != null) docs.push({ id: d.id, exists: true, data: () => v }); } return { docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) }; } };
}
function eqProxy(raw) { return { _raw: raw, doc: p => eqDocRef(raw, p), collection: p => eqColRef(raw, p) }; }
/* ---------- état de l'équipe ---------- */
const eqPriv = () => "data/users/" + Store.uid + "/equipe";
const eqOn = () => !!(Store.team && Store.team.on);
const eqLeader = () => eqOn() && Store.team.leader;
const eqMembers = () => (EQ.team && EQ.team.members) || [];
function eqRole(m) { return EQ_ROLES[(m && m.role) || "lecteur"] || EQ_ROLES.lecteur; }
function eqRight(mod) { if (!eqOn() || eqLeader() || UI.asClient || !EQ.me) return "write"; const m = EQ.me; const R = eqRole(m); return (m.droits && m.droits[mod]) || R.over[mod] || R.all; }
function eqFlag(f) { if (!eqOn() || eqLeader() || UI.asClient || !EQ.me) return true; const m = EQ.me; return !!((m.flags && m.flags[f] != null) ? m.flags[f] : eqRole(m).flags[f]); }
function eqDossierOK(id) { if (!eqOn() || eqLeader() || UI.asClient || !EQ.me) return true; const d = EQ.me.dossiers; return !d || d === "*" || (Array.isArray(d) && d.includes(id)); }
const eqTeamRef = () => Store.db.doc(Store.team.base + "/equipe");
async function eqLoadTeam() {
  const s = await eqTeamRef().get(); if (!s.exists) throw new Error("espace d'équipe introuvable ou clé renouvelée");
  EQ.team = s.data(); EQ.me = eqMembers().find(m => m.uid === Store.uid) || null;
  if (!Store.team.leader && (!EQ.me || EQ.me.retire)) throw new Error("votre accès à l'équipe a été retiré");
  if (EQ.me && !EQ.me.vu) { EQ.me.vu = new Date().toISOString(); }
}
async function eqSaveTeam(note) { EQ.team.maj = new Date().toISOString(); EQ.team.majPar = UI.userName || ""; await eqTeamRef().set(EQ.team); }
/* ---------- démarrage : espace d'équipe ---------- */
const _storeInitEq = Store.init;
Store.init = async function () {
  await _storeInitEq.apply(this, arguments); if (this.mode !== "db" || !this.db) return;
  this.rawDb = this.db; this.db = eqProxy(this.rawDb);
  try { const s = await this.rawDb.doc(eqPriv()).get(); if (!s.exists) return; const c = plain(s.data()); if (!c.on || !c.secret) return;
    const T = await eqDerive(c.secret); EQ.keys[T.h] = T.key; this.team = Object.assign(T, { on: true, leader: !!c.leader, nom: c.nom || "" });
    try { await eqLoadTeam(); } catch (e) { const why = e.message || String(e); this.team = null; UI.eqLost = why; if (!c.leader) { try { await this.rawDb.doc(eqPriv()).set(Object.assign(c, { on: false, perdu: why, le: new Date().toISOString() })); } catch (x) { } } }
  } catch (e) { logErr("espace d'équipe", e); this.team = null; }
};
Store.base = function () { if (this.asTeam) return this.asTeam.base; if (this.asUid) return "data/users/" + this.asUid; if (this.team && this.team.on) return this.team.base; return "data/users/" + this.uid; };
/* les collaborateurs héritent des modules de l'abonnement de l'administrateur */
const _loadAccessEq = loadAccess;
loadAccess = async function () { await _loadAccessEq.apply(this, arguments);
  try { if (!eqOn() || !EQ.team) return; if (eqLeader()) { const mods = UI.access && Array.isArray(UI.access.modules) ? UI.access.modules : null; if (JSON.stringify(mods) !== JSON.stringify(EQ.team.mods || null) || !EQ.team.offre) { EQ.team.mods = mods; EQ.team.offre = (UI.access || {}).offre || ""; eqSaveTeam().catch(() => { }); } }
    else { UI.access = Object.assign({}, UI.access || {}, { role: (UI.access || {}).role === "admin" ? "admin" : "client", modules: EQ.team.mods || null, offre: EQ.team.offre || "", equipe: EQ.team.nom }); if (EQ.me) { EQ.me.vu = new Date().toISOString(); eqSaveTeam().catch(() => { }); } } } catch (e) { logErr("équipe : accès", e); }
};
/* ---------- copie d'un espace à l'autre (migration, sauvegarde, renouvellement de clé) ---------- */
const EQ_SUB = ["m", "ventes", "inbox"];
async function eqCopy(from, to, ids, onStep) {
  const db = Store.db; let n = 0;
  const ix = await db.doc(from + "/index").get(); if (ix.exists) { await db.doc(to + "/index").set(ix.data()); n++; }
  const list = ids || ((ix.exists && ix.data().dossiers) || []).map(d => d.id);
  for (const id of list) { if (onStep) onStep(id); const d = await db.doc(from + "/d_" + id).get(); if (!d.exists) continue; await db.doc(to + "/d_" + id).set(d.data()); n++;
    for (const c of EQ_SUB) { const q = await db.doc(from + "/d_" + id).collection(c).get(); for (const x of q.docs) { await db.doc(to + "/d_" + id).collection(c).doc(x.id).set(x.data()); n++; } } }
  return { n, ids: list };
}
async function eqWipe(base, ids) { const raw = Store.rawDb; for (const id of ids) { for (const c of EQ_SUB) { try { const q = await raw.doc(base + "/d_" + id).collection(c).get(); for (const x of q.docs) await raw.doc(base + "/d_" + id).collection(c).doc(x.id).delete(); } catch (e) { } } try { await raw.doc(base + "/d_" + id).delete(); } catch (e) { } } for (const k of ["index", "equipe", "journal"]) { try { await raw.doc(base + "/" + k).delete(); } catch (e) { } } }
const eqNewSecret = () => eqU.enc(crypto.getRandomValues(new Uint8Array(32)));
const eqCode = (secret, invId) => "EQ1." + secret + "." + invId;
function eqParse(code) { const m = /^EQ1\.([A-Za-z0-9_-]{43})\.([a-z0-9]{6,20})$/.exec(String(code || "").trim().replace(/\s+/g, "")); return m ? { secret: m[1], inv: m[2] } : null; }
/* activation par l'administrateur (titulaire de l'abonnement) */
async function eqActivate(nom, opts = {}) {
  if (Store.mode !== "db" || !Store.rawDb) throw new Error("disponible uniquement dans le logiciel en ligne");
  if (typeof aboOK === "function" && !aboOK("equipe")) throw new Error("votre abonnement n'inclut pas les collaborateurs (offre illimitée)");
  await Store.flush(); try { await saveIndex(); } catch (e) { }
  const secret = eqNewSecret(); const T = await eqDerive(secret); EQ.keys[T.h] = T.key; const own = "data/users/" + Store.uid;
  const r = await eqCopy(own, T.base, null, opts.onStep);
  const team = { nom: nom || S.nom || "Mon cabinet", leader: Store.uid, leaderNom: UI.userName || "", cree: new Date().toISOString(), members: [{ uid: Store.uid, nom: UI.userName || "Administrateur", role: "admin", dossiers: "*", ajoute: todayISO() }], invites: [], mods: UI.access && Array.isArray(UI.access.modules) ? UI.access.modules : null, offre: (UI.access || {}).offre || "" };
  await Store.db.doc(T.base + "/equipe").set(team);
  await Store.rawDb.doc(eqPriv()).set({ on: true, leader: true, secret, h: T.h, nom: team.nom, le: new Date().toISOString(), bk: new Date().toISOString() });
  return { n: r.n, T };
}
/* rejoindre une équipe avec un code d'invitation */
async function eqJoin(code) {
  if (Store.mode !== "db" || !Store.rawDb) throw new Error("disponible uniquement dans le logiciel en ligne");
  const p = eqParse(code); if (!p) throw new Error("code d'invitation invalide (il commence par « EQ1. »)");
  const T = await eqDerive(p.secret); EQ.keys[T.h] = T.key; const ref = Store.db.doc(T.base + "/equipe"); const s = await ref.get();
  if (!s.exists) throw new Error("équipe introuvable : le code a peut-être été renouvelé, demandez une nouvelle invitation");
  const team = s.data(); const inv = (team.invites || []).find(x => x.id === p.inv); if (!inv) throw new Error("cette invitation a déjà été utilisée ou a été annulée");
  if (team.leader === Store.uid) throw new Error("vous êtes l'administrateur de cette équipe");
  team.members = (team.members || []).filter(m => m.uid !== Store.uid);
  team.members.push({ uid: Store.uid, nom: UI.userName || inv.nom || "Collaborateur", email: inv.email || "", role: inv.role || "collab", dossiers: inv.dossiers || "*", droits: inv.droits || null, flags: inv.flags || null, ajoute: todayISO(), invite: inv.id });
  team.invites = team.invites.filter(x => x.id !== inv.id); team.maj = new Date().toISOString(); await ref.set(team);
  await Store.rawDb.doc(eqPriv()).set({ on: true, leader: false, secret: p.secret, h: T.h, nom: team.nom, le: new Date().toISOString() });
  return team;
}
/* quitter / désactiver */
async function eqLeave() { await Store.rawDb.doc(eqPriv()).set({ on: false, quitte: new Date().toISOString() }); if (EQ.me && !eqLeader()) { EQ.team.members = eqMembers().filter(m => m.uid !== Store.uid); try { await eqSaveTeam(); } catch (e) { } } }
async function eqDeactivate() { /* l'administrateur revient à son espace privé, mis à jour depuis l'espace d'équipe */
  await Store.flush(); const T = Store.team; const r = await eqCopy(T.base, "data/users/" + Store.uid); EQ.team.ferme = new Date().toISOString(); EQ.team.members = eqMembers().filter(m => m.uid === Store.uid); EQ.team.invites = []; await eqSaveTeam(); await eqWipe(T.base, r.ids.filter(Boolean)); await Store.rawDb.doc(eqPriv()).set({ on: false, ferme: new Date().toISOString() }); }
/* renouvellement de la clé (après le retrait d'un collaborateur) */
async function eqRotate(removedUid) {
  await Store.flush(); const old = Store.team; const secret = eqNewSecret(); const T = await eqDerive(secret); EQ.keys[T.h] = T.key;
  const r = await eqCopy(old.base, T.base); const team = JSON.parse(JSON.stringify(EQ.team)); const keep = team.members.filter(m => m.uid !== removedUid && !m.retire);
  team.members = keep.filter(m => m.uid === Store.uid); team.invites = keep.filter(m => m.uid !== Store.uid).map(m => ({ id: uid(), nom: m.nom, email: m.email || "", role: m.role, dossiers: m.dossiers, droits: m.droits || null, flags: m.flags || null, cree: todayISO(), renouvele: true, code: "" }));
  team.invites.forEach(i => { i.code = eqCode(secret, i.id); }); team.cle = new Date().toISOString(); await Store.db.doc(T.base + "/equipe").set(team);
  await Store.rawDb.doc(eqPriv()).set({ on: true, leader: true, secret, h: T.h, nom: team.nom, le: new Date().toISOString(), bk: new Date().toISOString() });
  await eqWipe(old.base, r.ids.filter(Boolean)); Store.team = Object.assign(T, { on: true, leader: true, nom: team.nom }); EQ.team = team; EQ.me = team.members[0]; return team.invites;
}
/* sauvegarde quotidienne de l'espace d'équipe dans l'espace privé de l'administrateur */
async function eqBackup(force) {
  if (!eqLeader() || UI.asClient) return; try { const s = await Store.rawDb.doc(eqPriv()).get(); const c = s.exists ? plain(s.data()) : {}; if (!force && c.bk && Date.now() - Date.parse(c.bk) < 864e5) return;
    await eqCopy(Store.team.base, "data/users/" + Store.uid); await Store.rawDb.doc(eqPriv()).set(Object.assign(c, { bk: new Date().toISOString() })); if (force) toast("Sauvegarde de l'espace d'équipe effectuée ✓"); } catch (e) { logErr("sauvegarde d'équipe", e); if (force) toast("Sauvegarde impossible : " + (e.message || e)); }
}
setTimeout(() => { if (eqLeader()) eqBackup(false); }, 20000);
/* ---------- supervision par l'éditeur d'un client en mode équipe ---------- */
async function eqTeamOf(uid) { if (EQ.cache[uid] !== undefined) return EQ.cache[uid]; let T = null; try { const s = await Store.rawDb.doc("data/users/" + uid + "/equipe").get(); if (s.exists) { const c = plain(s.data()); if (c.on && c.secret) { T = await eqDerive(c.secret); EQ.keys[T.h] = T.key; } } } catch (e) { } EQ.cache[uid] = T; return T; }
if (typeof supIndex === "function") {
  const _supIndexEq = supIndex;
  supIndex = async function (uid) { const T = Store.rawDb ? await eqTeamOf(uid) : null; if (!T) return _supIndexEq(uid); let ix = null; try { const s = await Store.db.doc(T.base + "/index").get(); if (s.exists) ix = s.data(); } catch (e) { } ix = ix || { dossiers: [], current: null }; ix.dossiers ||= []; ix.equipe = true; return ix; };
  const _supEnterEq = supEnter;
  supEnter = async function (uid, name, did) { const T = Store.rawDb ? await eqTeamOf(uid) : null; Store.asTeam = T ? { base: T.base } : null; await _supEnterEq(uid, name, did); if (!UI.asClient) Store.asTeam = null; };
}
/* ---------- application des droits ---------- */
const eqLockHTML = (lib) => `<div class="abo-lock"><div class="abo-lock-ic">${ico("lock")}</div><div class="eyebrow">Accès non autorisé</div><h1>${esc(lib)}</h1><p class="lead">L'administrateur de l'équipe « ${esc((EQ.team || {}).nom || "")} » ne vous a pas ouvert ce module.<br>Votre rôle : <b>${esc(eqRole(EQ.me).lib)}</b>.</p><div class="row" style="justify-content:center;margin-top:16px"><button class="btn pri" data-act="go" data-v="dashboard">Retour à l'accueil</button></div></div>`;
const eqModOfView = v => v === "params" ? "params" : (typeof aboViewMod === "function" ? aboViewMod(v) : null);
(function () {
  const libOf = k => (EQ_MODS.find(x => x[0] === k) || [k, k])[1];
  const wrap = v => { const f = VIEWS[v]; if (typeof f !== "function" || f._eq) return; const g = function () { const k = eqModOfView(v); if (k && eqRight(k) === "none") return eqLockHTML(libOf(k)); return f.apply(this, arguments); }; g._eq = true; VIEWS[v] = g; };
  const all = () => Object.keys(typeof ABO_V2M !== "undefined" ? ABO_V2M : {}).concat(["grille", "params"]); all().forEach(wrap); setTimeout(() => all().forEach(wrap), 0);
})();
/* écriture interdite en lecture seule : on annule la modification et on recharge le dossier */
let _eqRevT = 0;
function eqCanWriteNow() { if (!eqOn() || eqLeader() || UI.asClient) return true; const k = eqModOfView(UI.view) || "compta"; return eqRight(k) === "write"; }
function eqRevert() { clearTimeout(_eqRevT); _eqRevT = setTimeout(async () => { toast("Lecture seule : votre rôle ne permet pas de modifier ce module. La modification a été annulée."); try { const r = await Store.loadDossier(S.id); if (r && r.meta) { const v = UI.view; setDossier(r.meta, r.ecr); UI.view = v; if (typeof XS !== "undefined") { XS.sid = null; XS.dirty = {}; } render(); } } catch (e) { } }, 60); }
(function () { const t = Store.touch, ta = Store.touchAll; Store.touch = function () { if (!eqCanWriteNow()) { this.pending.clear(); this.metaDirty = false; eqRevert(); return; } return t.apply(this, arguments); }; Store.touchAll = function () { if (!eqCanWriteNow()) { this.pending.clear(); this.metaDirty = false; eqRevert(); return; } return ta.apply(this, arguments); }; })();
if (typeof xSave === "function") { const _xs = xSave; xSave = function () { if (!eqCanWriteNow()) { eqRevert(); return; } return _xs.apply(this, arguments); }; }
/* droits spéciaux : validation, clôture, création de dossiers, dossiers attribués */
setTimeout(() => { if (typeof ACT === "undefined") return;
  const g = (re, flag, msg) => Object.keys(ACT).filter(n => re.test(n)).forEach(n => { const f = ACT[n]; if (f._eqf) return; const w = function () { if (!eqFlag(flag)) { toast(msg); return; } return f.apply(this, arguments); }; w._eqf = true; ACT[n] = w; });
  g(/valid|Valid|^js(Tog|Row|Col|All)$|^gReopen|Devalid|devalid/, "valider", "Votre rôle ne permet pas de valider ou dévalider des écritures.");
  g(/clotur|Clotur|^clo(Prov|Def|Go|Ok)|cloturer|^exDel$/, "cloturer", "Votre rôle ne permet pas de clôturer un exercice.");
  g(/^(newSoc|createDossier|askDelSoc|delDossier|doDelDossier|loadDemo|restore)$/, "creer", "Votre rôle ne permet pas de créer ou de supprimer des dossiers.");
  const od = ACT.openDossier; if (od && !od._eqd) { const w = function (el) { if (el && el.dataset && !eqDossierOK(el.dataset.id)) { toast("Ce dossier ne vous est pas attribué."); return; } return od.apply(this, arguments); }; w._eqd = true; ACT.openDossier = w; }
}, 0);
/* listes de dossiers filtrées selon les attributions */
(function () { const f = VIEWS.dossiers; VIEWS.dossiers = function () { if (!eqOn() || eqLeader() || !EQ.me) return f.apply(this, arguments); const keep = INDEX.dossiers; INDEX.dossiers = keep.filter(x => eqDossierOK(x.id)); try { return f.apply(this, arguments); } finally { INDEX.dossiers = keep; } }; })();
setTimeout(async () => { try { if (eqOn() && !eqLeader() && S && !eqDossierOK(S.id)) { const d = (INDEX.dossiers || []).find(x => eqDossierOK(x.id)); if (d) { const r = await Store.loadDossier(d.id); if (r && r.meta) { setDossier(r.meta, r.ecr); INDEX.current = d.id; render(); } } } } catch (e) { } }, 1500);
/* bandeau d'équipe pour les collaborateurs */
const _shellEq = shell;
shell = function () { const h = _shellEq.apply(this, arguments); if (!eqOn() || UI.asClient) return h; const lead = eqLeader(); const r = eqRole(EQ.me);
  return h.replace('<div class="main-in">', `<div class="main-in"><div class="eq-bar">👥 Espace d'équipe <b>${esc((EQ.team || {}).nom || "")}</b> · ${lead ? "vous êtes administrateur" : "votre rôle : <b>" + esc(r.lib) + "</b>"}<a href="#" class="lnk" data-act="go" data-v="equipe">${lead ? "Gérer l'équipe" : "Voir mes droits"}</a></div>`); };
const _bootLostEq = render; render = function () { const r = _bootLostEq.apply(this, arguments); if (UI.eqLost) { const w = UI.eqLost; UI.eqLost = null; setTimeout(() => toast("Espace d'équipe indisponible : " + w + ". Vous travaillez dans votre espace personnel."), 600); } return r; };

/* ---------- écran « Équipe et droits » ---------- */
function eqMemberDroits(m) { const R = eqRole(m); return EQ_MODS.map(([k, l]) => [k, l, (m.droits && m.droits[k]) || R.over[k] || R.all]); }
VIEWS.equipe = () => {
  const okMod = typeof aboOK !== "function" || aboOK("equipe"); const online = Store.mode === "db" && !!Store.rawDb;
  const st = UI.sub.eq ||= {};
  if (!eqOn()) return `<div class="pg-h"><div><h1>Équipe et droits</h1><p class="lead">Travaillez à plusieurs sur les mêmes dossiers : invitez vos collaborateurs, attribuez-leur des dossiers et choisissez précisément ce que chacun peut voir et modifier.</p></div></div>
    <div class="grid g2" style="align-items:start"><section class="card"><div class="card-h"><h2>${ico("contacts")} Créer l'espace de mon cabinet</h2></div><div class="card-b">
      ${!okMod ? `<div class="banner">Les collaborateurs sont réservés à l'offre illimitée. <button class="btn sm" data-act="go" data-v="abonnement">Voir les offres</button></div>` : !online ? `<div class="banner">Disponible dans le logiciel en ligne.</div>` : `
      <p>Vos sociétés sont copiées dans un <b>espace d'équipe chiffré</b> : seules les personnes que vous invitez peuvent l'ouvrir. Votre espace personnel est conservé et sert de sauvegarde quotidienne.</p>
      <label class="f">Nom du cabinet ou de l'équipe<input class="in" id="eqNom" value="${esc(st.nom ?? S.nom ?? "")}" data-ch="eqNom"></label>
      <ul class="small" style="line-height:1.7"><li>Rôles prêts à l'emploi : expert-comptable, collaborateur, assistant(e), lecture seule.</li><li>Droits par module (aucun accès, lecture, modification) et dossiers attribués.</li><li>Droits de valider, de clôturer et de créer des dossiers.</li><li>Retrait d'un collaborateur avec renouvellement de la clé de chiffrement.</li></ul>
      <button class="btn pri" data-act="eqActivate" ${st.busy ? "disabled" : ""}>${st.busy ? esc(st.busy) : "Créer l'espace d'équipe"}</button>`}</div></section>
    <section class="card"><div class="card-h"><h2>${ico("lock")} Rejoindre une équipe</h2></div><div class="card-b"><p class="small">Vous avez reçu un code d'invitation de votre cabinet ? Collez-le ici.</p><label class="f">Code d'invitation<input class="in mono" id="eqCodeIn" placeholder="EQ1.…" value="${esc(st.code || "")}" data-ch="eqCodeIn"></label><button class="btn" data-act="eqJoin" ${!online || st.busy ? "disabled" : ""}>Rejoindre l'équipe</button>${!online ? '<p class="small muted">Disponible dans le logiciel en ligne.</p>' : ""}</div></section></div>`;
  const T = EQ.team || {}; const lead = eqLeader(); const can = eqFlag("equipe"); const ds = INDEX.dossiers || [];
  if (!lead && !can) { const m = EQ.me || {}; return `<div class="pg-h"><div><h1>Mes droits</h1><p class="lead">Équipe « ${esc(T.nom || "")} » · administrateur : ${esc(T.leaderNom || "")}</p></div></div>
    <section class="card"><div class="card-h"><h2>${esc(eqRole(m).lib)}</h2></div><div class="card-b"><div class="eq-mx">${eqMemberDroits(m).map(([k, l, v]) => `<div class="eq-mxr"><span>${esc(l)}</span><span class="pill ${v === "write" ? "ok" : v === "read" ? "n" : "bad"}">${EQ_LV[v]}</span></div>`).join("")}</div>
      <p class="small" style="margin-top:10px">${EQ_FLAGS.map(([k, l]) => `${eqFlag(k) ? "✓" : "✕"} ${esc(l)}`).join(" · ")}</p><p class="small">Dossiers : ${!m.dossiers || m.dossiers === "*" ? "tous" : ds.filter(x => m.dossiers.includes(x.id)).map(x => esc(x.nom)).join(", ") || "aucun"}</p>
      <button class="btn ghost danger" data-act="eqLeave">Quitter l'équipe</button></div></section>`; }
  const mem = eqMembers().filter(m => !m.retire); const inv = T.invites || [];
  return `<div class="pg-h"><div><h1>Équipe et droits</h1><p class="lead">Équipe « ${esc(T.nom || "")} » · ${mem.length} membre(s)${inv.length ? " · " + inv.length + " invitation(s) en attente" : ""}. Les données sont chiffrées : seules les personnes invitées peuvent les lire.</p></div><div class="row"><button class="btn" data-act="eqBackupNow">Sauvegarder maintenant</button><button class="btn pri" data-act="eqInvite">${ico("plus")} Inviter un collaborateur</button></div></div>
  <section class="card"><div class="card-h"><h2>${ico("contacts")} Membres</h2></div><div class="tw"><table class="t"><thead><tr><th>Membre</th><th>Rôle</th><th>Dossiers</th><th>Droits particuliers</th><th>Dernière connexion</th><th></th></tr></thead><tbody>
    ${mem.map(m => { const isL = m.uid === T.leader; const nD = !m.dossiers || m.dossiers === "*" ? "Tous" : m.dossiers.length + " dossier(s)"; const fl = EQ_FLAGS.filter(([k]) => (m.flags && m.flags[k] != null ? m.flags[k] : eqRole(m).flags[k])).map(x => x[1].split(" ")[0]).join(", ");
      return `<tr><td><b>${esc(m.nom || "Membre")}</b>${isL ? ' <span class="pill ok">administrateur</span>' : ""}${m.uid === Store.uid ? ' <span class="pill n">vous</span>' : ""}<div class="small muted">${esc(m.email || "")}</div></td><td>${esc(eqRole(m).lib)}</td><td>${nD}</td><td class="small">${esc(fl || "—")}</td><td class="mono small">${m.vu ? frDate(m.vu.slice(0, 10)) : "—"}</td><td class="r" style="white-space:nowrap">${isL ? "" : `<button class="btn sm" data-act="eqEdit" data-u="${esc(m.uid)}">Droits</button><button class="btn sm ghost danger" data-act="eqRemove" data-u="${esc(m.uid)}">Retirer</button>`}</td></tr>`; }).join("")}</tbody></table></div></section>
  ${inv.length ? `<section class="card" style="margin-top:14px"><div class="card-h"><h2>${ico("clock")} Invitations en attente</h2></div><div class="tw"><table class="t"><thead><tr><th>Pour</th><th>Rôle</th><th>Code d'invitation</th><th></th></tr></thead><tbody>${inv.map(i => `<tr><td><b>${esc(i.nom || "—")}</b><div class="small muted">${esc(i.email || "")}${i.renouvele ? " · nouvelle clé : à renvoyer" : ""}</div></td><td>${esc((EQ_ROLES[i.role] || EQ_ROLES.collab).lib)}</td><td class="mono small eq-code">${esc(i.code || "")}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="eqCopy" data-i="${esc(i.id)}">📋 Copier le message</button><button class="btn sm ghost danger" data-act="eqInvDel" data-i="${esc(i.id)}">Annuler</button></td></tr>`).join("")}</tbody></table></div></section>` : ""}
  <section class="card" style="margin-top:14px"><div class="card-h"><h2>${ico("lock")} Sécurité</h2></div><div class="card-b small" style="line-height:1.7">Chiffrement AES-256 de chaque document de l'espace d'équipe ; la clé n'est transmise que dans les codes d'invitation. Retirer un collaborateur renouvelle la clé : les autres membres reçoivent automatiquement une nouvelle invitation à leur envoyer. Sauvegarde quotidienne dans votre espace personnel${T.maj ? " · dernière modification de l'équipe le " + frDate(T.maj.slice(0, 10)) : ""}.
    <div style="margin-top:8px"><button class="btn sm ghost danger" data-act="eqClose">Fermer l'espace d'équipe</button></div></div></section>`;
};
function eqInviteMsg(i) { const nom = (CONFIG.branding && CONFIG.branding.nom) || "Speedix"; const url = (venteCfg().site || {}).appUrl || ""; return `Bonjour${i.nom ? " " + i.nom : ""},\n\nJe vous invite à rejoindre l'équipe « ${(EQ.team || {}).nom || ""} » sur ${nom}${i.role ? " en tant que " + (EQ_ROLES[i.role] || EQ_ROLES.collab).lib.toLowerCase() : ""}.\n\n1. Ouvrez le logiciel : ${url}\n2. Allez dans Dossiers › Équipe et droits, rubrique « Rejoindre une équipe ».\n3. Collez ce code d'invitation (personnel, à usage unique) :\n\n${i.code}\n\nÀ bientôt,\n${UI.userName || ""}`; }
const EQACT = {
  eqActivate: async () => { const st = UI.sub.eq ||= {}; const nom = (st.nom ?? S.nom ?? "").trim(); if (!nom) { toast("Indiquez le nom de l'équipe."); return; }
    confirmBox("Créer l'espace d'équipe « " + nom + " »", "Vos " + (INDEX.dossiers || []).length + " société(s) vont être copiées dans l'espace d'équipe chiffré. Votre espace personnel est conservé comme sauvegarde. Le logiciel se rechargera à la fin.", "Créer l'espace", async () => { st.busy = "Copie des dossiers…"; render();
      try { const r = await eqActivate(nom, { onStep: id => { st.busy = "Copie de " + (((INDEX.dossiers || []).find(x => x.id === id) || {}).nom || "…"); render(); } }); toast("Espace d'équipe créé (" + r.n + " documents) ✓ Rechargement…"); try { localStorage.setItem("sc:view", "equipe"); } catch (e) { } setTimeout(() => location.reload(), 900); } catch (e) { st.busy = null; render(); toast("Création impossible : " + (e.message || e)); } }); },
  eqJoin: async () => { const st = UI.sub.eq ||= {}; st.busy = "Connexion…"; render(); try { const t = await eqJoin(st.code); toast("Bienvenue dans l'équipe « " + t.nom + " » ✓ Rechargement…"); try { localStorage.setItem("sc:view", "dossiers"); } catch (e) { } setTimeout(() => location.reload(), 900); } catch (e) { st.busy = null; render(); toast("Impossible de rejoindre : " + (e.message || e)); } },
  eqInvite: () => openModal({ type: "eqMember", d: { nom: "", email: "", role: "collab", dossiers: "*", droits: null, flags: null }, isNew: true }),
  eqEdit: el => { const m = eqMembers().find(x => x.uid === el.dataset.u); if (m) openModal({ type: "eqMember", uid: m.uid, d: JSON.parse(JSON.stringify(m)) }); },
  eqMSave: async () => { const M = UI.modal; const d = M.d; if (M.isNew) { const i = Object.assign({ id: uid(), cree: todayISO() }, d); i.code = eqCode(Store.team.secret, i.id); (EQ.team.invites ||= []).push(i); try { await eqSaveTeam(); openModal({ type: "eqInvDone", i }); } catch (e) { toast("Enregistrement impossible : " + (e.message || e)); } return; }
    const m = eqMembers().find(x => x.uid === M.uid); Object.assign(m, { role: d.role, dossiers: d.dossiers, droits: d.droits, flags: d.flags, nom: d.nom, email: d.email }); try { await eqSaveTeam(); closeModal(); toast("Droits mis à jour ✓ Ils s'appliquent à la prochaine ouverture du logiciel par ce membre."); } catch (e) { toast("Enregistrement impossible : " + (e.message || e)); } },
  eqRole: el => { const d = UI.modal.d; d.role = el.dataset.v; d.droits = null; d.flags = null; render(); },
  eqAllD: () => { UI.modal.d.dossiers = "*"; render(); },
  eqSomeD: () => { UI.modal.d.dossiers = []; render(); },
  eqCopy: async el => { const i = (EQ.team.invites || []).find(x => x.id === el.dataset.i) || (UI.modal && UI.modal.i); if (!i) return; try { await navigator.clipboard.writeText(eqInviteMsg(i)); toast("Message d'invitation copié ✓"); } catch (e) { toast("Copie impossible : sélectionnez le code manuellement."); } },
  eqInvDel: async el => { EQ.team.invites = (EQ.team.invites || []).filter(x => x.id !== el.dataset.i); await eqSaveTeam(); render(); },
  eqRemove: el => { const m = eqMembers().find(x => x.uid === el.dataset.u); if (!m) return; openModal({ type: "eqRemove", uid: m.uid, nom: m.nom, rot: true }); },
  eqRemoveGo: async () => { const M = UI.modal; try { if (M.rot) { toast("Renouvellement de la clé et copie des dossiers…"); const inv = await eqRotate(M.uid); closeModal(); render(); toast(M.nom + " a été retiré(e). Nouvelle clé en place" + (inv.length ? " : renvoyez les " + inv.length + " nouvelle(s) invitation(s) aux autres membres." : ".")); }
      else { const m = eqMembers().find(x => x.uid === M.uid); m.retire = todayISO(); await eqSaveTeam(); closeModal(); render(); toast(M.nom + " ne peut plus ouvrir l'espace d'équipe."); } } catch (e) { toast("Opération impossible : " + (e.message || e)); } },
  eqLeave: () => confirmBox("Quitter l'équipe", "Vous n'aurez plus accès aux dossiers de l'équipe. Vos propres sociétés personnelles restent disponibles.", "Quitter", async () => { await eqLeave(); location.reload(); }, true),
  eqClose: () => confirmBox("Fermer l'espace d'équipe", "Les dossiers sont recopiés dans votre espace personnel, l'espace d'équipe est effacé et les collaborateurs perdent leur accès.", "Fermer l'espace", async () => { try { toast("Copie des dossiers dans votre espace personnel…"); await eqDeactivate(); location.reload(); } catch (e) { toast("Opération impossible : " + (e.message || e)); } }, true),
  eqBackupNow: () => eqBackup(true)
};
const EQCHG = {
  eqNom: el => { (UI.sub.eq ||= {}).nom = el.value; },
  eqCodeIn: el => { (UI.sub.eq ||= {}).code = el.value.trim(); },
  eqMF: el => { UI.modal.d[el.dataset.f] = el.value; },
  eqDr: el => { const d = UI.modal.d; d.droits = Object.assign({}, d.droits || {}, { [el.dataset.k]: el.value }); render(); },
  eqFl: el => { const d = UI.modal.d; d.flags = Object.assign({}, d.flags || {}, { [el.dataset.k]: el.checked ? 1 : 0 }); },
  eqD: el => { const d = UI.modal.d; let L = Array.isArray(d.dossiers) ? d.dossiers.slice() : []; L = L.filter(x => x !== el.dataset.id); if (el.checked) L.push(el.dataset.id); d.dossiers = L; },
  eqRot: el => { UI.modal.rot = el.checked; }
};
const _rmEq = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "eqMember") { const d = M.d; const R = EQ_ROLES[d.role] || EQ_ROLES.collab; const ds = INDEX.dossiers || []; const all = !d.dossiers || d.dossiers === "*";
    return modalFrame(M.isNew ? "Inviter un collaborateur" : "Droits de " + esc(d.nom || "ce membre"), `<div class="grid g2"><label class="f">Nom<input class="in" data-ch="eqMF" data-f="nom" value="${esc(d.nom || "")}" data-autofocus></label><label class="f">E-mail<input class="in" data-ch="eqMF" data-f="email" value="${esc(d.email || "")}"></label></div>
      <h3 style="margin:12px 0 6px">Rôle</h3><div class="eq-roles">${Object.entries(EQ_ROLES).filter(([k]) => k !== "admin" || !M.isNew).map(([k, r]) => `<button class="${d.role === k ? "on" : ""}" data-act="eqRole" data-v="${k}"><b>${esc(r.lib)}</b></button>`).join("")}</div>
      <h3 style="margin:12px 0 6px">Droits par module</h3><div class="eq-mx">${EQ_MODS.map(([k, l]) => { const v = (d.droits && d.droits[k]) || R.over[k] || R.all; return `<div class="eq-mxr"><span>${esc(l)}</span><select class="in sm" data-ch="eqDr" data-k="${k}">${Object.entries(EQ_LV).map(([a, b]) => `<option value="${a}" ${a === v ? "selected" : ""}>${b}</option>`).join("")}</select></div>`; }).join("")}</div>
      <h3 style="margin:12px 0 6px">Droits particuliers</h3>${EQ_FLAGS.map(([k, l]) => `<label class="chk"><input type="checkbox" data-ch="eqFl" data-k="${k}" ${(d.flags && d.flags[k] != null ? d.flags[k] : R.flags[k]) ? "checked" : ""}> ${esc(l)}</label>`).join("")}
      <h3 style="margin:12px 0 6px">Dossiers accessibles</h3><div class="seg" style="margin-bottom:6px"><button class="${all ? "on" : ""}" data-act="eqAllD">Tous les dossiers</button><button class="${all ? "" : "on"}" data-act="eqSomeD">Dossiers choisis</button></div>
      ${all ? "" : `<div class="eq-ds">${ds.map(x => `<label class="chk"><input type="checkbox" data-ch="eqD" data-id="${x.id}" ${d.dossiers.includes(x.id) ? "checked" : ""}> ${esc(x.nom)}</label>`).join("")}</div>`}`,
      cancelBtn + `<button class="btn pri" data-act="eqMSave">${M.isNew ? "Créer l'invitation" : "Enregistrer les droits"}</button>`, true); }
  if (M && M.type === "eqInvDone") { const i = M.i;
    return modalFrame("Invitation créée", `<p>Envoyez ce message à <b>${esc(i.nom || "votre collaborateur")}</b>. Le code est personnel et ne sert qu'une fois.</p><div class="lic-code"><span class="small muted">Code d'invitation</span><b class="mono" style="font-size:12px;word-break:break-all">${esc(i.code)}</b></div><textarea class="in" rows="11" readonly>${esc(eqInviteMsg(i))}</textarea>`,
      `<button class="btn" data-act="eqCopy" data-i="${esc(i.id)}">📋 Copier le message</button>${i.email ? `<a class="btn pri" href="mailto:${esc(i.email)}?subject=${encodeURIComponent("Invitation à rejoindre l'équipe " + ((EQ.team || {}).nom || ""))}&body=${encodeURIComponent(eqInviteMsg(i))}">✉ Ouvrir ma messagerie</a>` : ""}<button class="btn" data-act="closeModal">Fermer</button>`, true); }
  if (M && M.type === "eqRemove") return modalFrame("Retirer " + esc(M.nom || "ce membre"), `<p>Ce membre ne pourra plus ouvrir les dossiers de l'équipe.</p><label class="chk"><input type="checkbox" data-ch="eqRot" ${M.rot ? "checked" : ""}> <b>Renouveler la clé de chiffrement</b> (recommandé) : l'ancien code ne permettra plus de lire les données. Les autres membres recevront une nouvelle invitation à leur renvoyer.</label>`, cancelBtn + `<button class="btn danger" data-act="eqRemoveGo">Retirer</button>`);
  return _rmEq.apply(this, arguments);
};
/* menu Dossiers : onglet « Équipe et droits » */
(function () { const n = NAV2.find(x => x[0] === "dossiers"); if (!n) return; n[2].push("equipe"); const base = Array.isArray(n[3]) ? n[3] : [["dossiers", "Mes sociétés"]];
  Object.defineProperty(n, 3, { get() { const ok = eqOn() || typeof aboOK !== "function" || aboOK("equipe"); return ok ? base.concat([["equipe", eqOn() && !eqLeader() && !eqFlag("equipe") ? "Mes droits" : "Équipe et droits"]]) : base; }, set(v) { base.splice(0, base.length, ...v); }, enumerable: true, configurable: true }); })();
