/* ================= Espace éditeur : entrer dans la comptabilité d'un client abonné ================= */
Store.base = function () { return "data/users/" + (this.asUid || this.uid); };
async function supIndex(uid) {
  /* index des sociétés d'un client (lecture directe, sans repli local) */
  const base = "data/users/" + uid; let ix = null;
  try { const s = await Store.db.doc(base + "/index").get(); if (s.exists) ix = plain(s.data()); } catch (e) { }
  ix = ix || { dossiers: [], current: null }; ix.dossiers ||= [];
  try { const q = await Store.db.collection(base).get(); q.docs.forEach(d => { if (!d.id.startsWith("d_")) return; const id = d.id.slice(2); const v = d.data() || {}; if (!ix.dossiers.some(x => x.id === id) && v.nom) ix.dossiers.push({ id, nom: v.nom, demo: !!v.demo }); }); } catch (e) { }
  return ix;
}
function supLoad(uid) { const st = UI.sub.lic ||= {}; st.ix ||= {}; if (st.ix[uid] || Store.mode !== "db" || !Store.db) return st.ix[uid]; st.ix[uid] = { load: true, dossiers: [] }; supIndex(uid).then(ix => { st.ix[uid] = ix; render(); }); return st.ix[uid]; }
async function supEnter(uid, name, did) {
  if (Store.mode !== "db" || !Store.db) { toast("Disponible uniquement dans le logiciel en ligne (avec vos clients connectés)."); return; }
  toast("Ouverture de la comptabilité de " + (name || "ce client") + "…");
  try { await Store.flush(); } catch (e) { }
  const ix = await supIndex(uid); const list = ix.dossiers.filter(d => !d.demo || ix.dossiers.length === 1);
  if (!list.length) { toast((name || "Ce client") + " n'a pas encore créé de société."); return; }
  const id = did || (list.find(d => d.id === ix.current) || list[0]).id;
  Store.asUid = uid; let r = null;
  try { r = await withTO(Store.loadDossier(id), 15000, null); } catch (e) { }
  if (!r || !r.meta) { Store.asUid = null; toast("Impossible d'ouvrir cette société (droits de lecture ou délai dépassé)."); return; }
  UI.asClient = { uid, name: name || "", soc: r.meta.nom }; INDEX = ix; INDEX.current = id; setDossier(r.meta, r.ecr);
  UI.view = "dashboard"; UI.modal = null; render(); try { window.scrollTo(0, 0); } catch (e) { }
  toast("Vous êtes dans la comptabilité de " + (name || r.meta.nom) + " : vos modifications sont enregistrées dans son dossier.");
}
async function supExit() { try { await Store.flush(); } catch (e) { } Store.asUid = null; UI.asClient = null; try { localStorage.setItem("sc:view", "licences"); } catch (e) { } location.hash = ""; location.reload(); }

/* bandeau permanent pendant la supervision */
const _renderSup = render;
render = function () { const r = _renderSup.apply(this, arguments); const a = UI.asClient; let bar = document.getElementById("supBar");
  if (!a) { if (bar) bar.remove(); return r; }
  if (!bar) { bar = document.createElement("div"); bar.id = "supBar"; bar.className = "sup-bar"; document.body.appendChild(bar); }
  const others = (INDEX.dossiers || []).filter(d => d.id !== (S && S.id) && !d.demo);
  bar.innerHTML = `<span class="sup-dot"></span><span>👁 Comptabilité de <b>${esc(a.name || "client")}</b> · ${esc(S ? S.nom : "")} <span class="sup-st">${esc(Store.status === "busy" ? "enregistrement…" : "mode éditeur : accès complet")}</span></span>${others.length ? `<select class="in sm" data-ch="supSoc"><option value="">Autre société (${others.length})…</option>${others.map(d => `<option value="${d.id}">${esc(d.nom)}</option>`).join("")}</select>` : ""}<button class="btn sm" data-act="supExit">⟵ Quitter et revenir à mon espace</button>`;
  return r; };

/* Clients et accès : colonne « Comptabilité » + comptes sans code */
function supCell(u) { const ix = supLoad(u.id); if (!ix || ix.load) return `<span class="muted small">…</span>`; const ds = ix.dossiers.filter(d => !d.demo);
  const last = u.dernier ? `<div class="small muted">vu le ${frDate(u.dernier.slice(0, 10))}</div>` : "";
  if (!ds.length) return `<span class="small muted">${ix.dossiers.length ? "démonstration seulement" : "aucune société"}</span>${last}`;
  return `<button class="btn sm pri" data-act="supOpen" data-u="${u.id}" data-n="${esc(u.name || "")}">📂 Ouvrir sa compta</button><div class="small muted">${ds.length} société${ds.length > 1 ? "s" : ""} · <a href="#" class="lnk" data-act="supSuivi" data-u="${u.id}" data-n="${esc(u.name || "")}">suivi</a></div>${last}`; }
const _licViewSup = VIEWS.licences;
VIEWS.licences = () => { let h = _licViewSup(); if (!isAdmin()) return h; const st = UI.sub.lic || {}; const users = (st.reg || []).filter(u => u.id !== Store.uid); const L = licList(); const byLic = {}; users.forEach(u => { if (u.licence && u.licence.id) (byLic[u.licence.id] ||= []).push(u); });
  h = h.replace("<th>Compte relié</th><th></th>", "<th>Compte relié</th><th>Comptabilité</th><th></th>").replace('colspan="8"', 'colspan="9"');
  let i = 0; const lst = (() => { const q = (st.q || "").toLowerCase(); return L.filter(l => (!st.f || licStatut(l)[1] === st.f || (st.f === "Actif" && licStatut(l)[1] === "Expire bientôt")) && (!q || (l.client + " " + (l.email || "") + " " + l.offre).toLowerCase().includes(q))); })();
  h = h.replace(/<td class="r" style="white-space:nowrap"><button class="btn sm" data-act="licMsg"/g, m => { const l = lst[i++]; const ub = l ? (byLic[l.id] || []) : []; return `<td>${ub.length ? ub.map(supCell).join("") : `<span class="sup-wait" title="Le bouton « Ouvrir sa compta » apparaîtra dès que le client aura ouvert le lien et saisi son code d'activation">⏳ Code non activé</span><div class="small muted">le client ne s'est pas encore connecté</div>`}</td>` + m; });
  const free = users.filter(u => !(u.licence && u.licence.id && L.some(l => l.id === u.licence.id)));
  const tbl = `<div class="panel"><div class="panel-h" style="padding:12px 14px"><b>Tous les comptes clients</b> <span class="muted small">· chaque personne qui a ouvert le logiciel, avec ou sans code (${users.length})</span></div><div class="tw"><table class="t"><thead><tr><th>Compte</th><th>Première visite</th><th>Dernière visite</th><th>Accès</th><th>Comptabilité</th></tr></thead><tbody>${(free.length ? free : []).map(u => `<tr><td><b>${esc(u.name || "Compte " + u.id.slice(0, 8))}</b><div class="small muted mono">${esc(u.id.slice(0, 12))}</div></td><td class="mono">${u.premier ? frDate(u.premier.slice(0, 10)) : "—"}</td><td class="mono">${u.dernier ? frDate(u.dernier.slice(0, 10)) : "—"}</td><td class="small">${u.licence && u.licence.code ? "code saisi" : "sans code"}</td><td>${supCell(u)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">${!st.reg ? "Chargement…" : users.length ? "Tous les comptes ouverts sont reliés à un accès ci-dessus." : "Aucun client ne s'est encore connecté au logiciel."}</td></tr>`}</tbody></table></div></div>`;
  const linked = users.filter(u => supLoad(u.id) && !(supLoad(u.id) || {}).load && ((supLoad(u.id) || {}).dossiers || []).some(d => !d.demo)).length;
  const mine = (INDEX.dossiers || []).filter(d => !d.demo && !UI.asClient);
  const note = !st.reg ? "" : !users.length ? `<div class="sup-note sup-warn"><b>🔐 Ouvrir la comptabilité d'un client</b><p>Aucun client ne s'est encore connecté à SpeedCompta : le bouton <b>« 📂 Ouvrir sa compta »</b> apparaît automatiquement, sur la ligne du client, dès qu'il a <b>ouvert le lien</b> du logiciel, <b>saisi son code d'activation</b> et créé sa société.</p>
      <ol><li><b>Partagez le logiciel</b> : menu <b>Partager</b> de la page, accès <b>Contributeur</b> (sans partage, vos clients ne peuvent pas l'ouvrir).</li><li><b>Envoyez le code</b> au client avec le bouton « ✉ Envoyer » de sa ligne.</li><li>Dès sa première connexion, sa comptabilité apparaît ici et s'ouvre en un clic.</li></ol>
      ${mine.length ? `<p class="small">Les sociétés créées dans <b>votre propre espace</b> (${mine.map(d => esc(d.nom)).join(", ")}) ne sont pas des comptes clients : elles s'ouvrent directement. ${mine.map(d => `<button class="btn sm" data-act="openDossier" data-id="${esc(d.id)}">📂 Ouvrir ${esc(d.nom)}</button>`).join(" ")}</p>` : ""}</div>`
    : `<div class="sup-note">🔐 <b>Accès complet à la comptabilité de vos clients</b> : ${users.length} compte(s) client connecté(s)${linked ? ", dont " + linked + " avec une société" : ""}. Cliquez sur « 📂 Ouvrir sa compta » pour entrer dans son dossier, consulter et corriger. Un bandeau orange vous rappelle chez qui vous êtes ; « Quitter » vous ramène ici.</div>`;
  return h.replace('<div class="panel" style="padding:14px"><h3 style="margin-top:0">Comment le client', note + tbl + '<div class="panel" style="padding:14px"><h3 style="margin-top:0">Comment le client'); };

const SUPACT = {
  supOpen: el => supEnter(el.dataset.u, el.dataset.n),
  supSoc: el => supEnter(el.dataset.u, el.dataset.n, el.dataset.d),
  supExit: () => supExit(),
  supSuivi: el => { const ix = (UI.sub.lic && UI.sub.lic.ix || {})[el.dataset.u]; openModal({ type: "supSuivi", d: { uid: el.dataset.u, name: el.dataset.n, ix } }); }
};
const SUPCHG = { supSoc: el => { if (!el.value || !UI.asClient) return; supEnter(UI.asClient.uid, UI.asClient.name, el.value); } };
Object.assign(LICACT, SUPACT); Object.assign(LICCHG, SUPCHG);
const _rmSup = renderModal;
renderModal = function () { const M = UI.modal; if (!M || M.type !== "supSuivi") return _rmSup();
  const d = M.d; const ds = ((d.ix && d.ix.dossiers) || []).filter(x => !x.demo);
  const rows = ds.map(x => { const s = x.sum || {}; return `<tr><td><b>${esc(x.nom)}</b><div class="small muted">${esc(s.forme || "")}${s.siren ? " · " + esc(s.siren) : ""}</div></td><td class="r mono">${s.ca != null ? eur0(s.ca) : "—"}</td><td class="r mono">${s.rn != null ? eur0(s.rn) : "—"}</td><td class="r mono">${s.treso != null ? eur0(s.treso) : "—"}</td><td class="r">${s.br != null ? s.br : "—"}</td><td class="r">${s.rel != null ? s.rel : "—"}</td><td class="r">${s.late != null ? s.late : "—"}</td><td class="mono small">${s.maj ? frDate(s.maj.slice(0, 10)) : "—"}</td><td><button class="btn sm pri" data-act="supSoc" data-u="${d.uid}" data-n="${esc(d.name || "")}" data-d="${x.id}">Ouvrir</button></td></tr>`; }).join("");
  return modalFrame("📊 Suivi de " + esc(d.name || "ce client"), `<p class="small muted" style="margin-top:0">Activité de chaque société (mise à jour à chaque enregistrement du client).</p><div class="tw"><table class="t"><thead><tr><th>Société</th><th class="r">Chiffre d'affaires</th><th class="r">Résultat</th><th class="r">Trésorerie</th><th class="r">Écritures en brouillard</th><th class="r">Relevés à pointer</th><th class="r">Factures en retard</th><th>Dernière modif.</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="9" class="empty">Aucune société.</td></tr>`}</tbody></table></div>`, `<button class="btn" data-act="closeModal">Fermer</button>`, true); };
