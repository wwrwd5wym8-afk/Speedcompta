/* ============================================================
   Accueil › Propositions d'amélioration du logiciel
   Chaque utilisateur écrit dans idees/{son id} ; l'éditeur (propriétaire) lit et répond à toutes.
   ============================================================ */
const ID_TYPES = [["amelio", "💡 Amélioration"], ["nouv", "✨ Nouvelle fonctionnalité"], ["bug", "🐞 Anomalie"], ["ergo", "🎨 Ergonomie / présentation"]];
const ID_MODS = ["Accueil", "Dossiers", "Comptabilité", "Saisie", "Banque", "Clients et fournisseurs", "Fiscalité", "Social", "Rapports", "Conseil", "Juridique", "Ventes et facturation", "Paramètres", "Autre"];
const ID_ST = { recu: ["Reçue", "#64748B"], etude: ["À l'étude", "#2563EB"], plan: ["Planifiée", "#7C3AED"], fait: ["Réalisée", "#059669"], refus: ["Non retenue", "#DC2626"] };
const ID_PRIO = [["1", "Souhaitable"], ["2", "Importante"], ["3", "Indispensable"]];
const idState = () => (UI.idees ||= { mine: null, all: null, f: "tous", q: "", load: false });
const idCanAll = () => !!(UI.isOwner || (typeof isAdmin === "function" && isAdmin()));
async function idLoadMine() { const st = idState();
  if (Store.mode === "db" && Store.db) { try { const s = await Store.db.doc("idees/" + Store.uid).get(); st.mine = s.exists ? plain(s.data()) : { uid: Store.uid, items: [] }; } catch (e) { st.mine = { uid: Store.uid, items: [] }; } }
  else { try { st.mine = JSON.parse(localStorage.getItem("sc:idees") || "null") || { items: [] }; } catch (e) { st.mine = { items: [] }; } }
  st.mine.items ||= []; }
async function idSaveMine() { const st = idState(); st.mine.uid = Store.uid || "local"; st.mine.name = UI.userName || st.mine.name || ""; st.mine.maj = new Date().toISOString();
  if (Store.mode === "db" && Store.db) await Store.db.doc("idees/" + Store.uid).set(st.mine); else localStorage.setItem("sc:idees", JSON.stringify(st.mine)); }
async function idLoadAll() { const st = idState(); if (!idCanAll()) { st.all = null; return; }
  if (Store.mode === "db" && Store.db) { try { const q = await Store.db.collection("idees").get(); st.all = q.docs.map(d => Object.assign({ _id: d.id }, plain(d.data()))).filter(d => d && Array.isArray(d.items)); } catch (e) { st.all = null; st.allErr = true; } }
  else st.all = st.mine ? [Object.assign({ _id: "local" }, st.mine)] : []; }
async function idRefresh() { const st = idState(); st.load = true; await idLoadMine(); await idLoadAll(); st.load = false; if (UI.view === "idees") render(); }

const idPill = s => `<span class="pill" style="background:${ID_ST[s][1]}1A;color:${ID_ST[s][1]}">${ID_ST[s][0]}</span>`;
const idType = t => (ID_TYPES.find(x => x[0] === t) || ID_TYPES[0])[1];
VIEWS.idees = () => {
  const st = idState(); if (!st.mine && !st.load) { idRefresh(); }
  const mine = (st.mine && st.mine.items) || []; const all = idCanAll() && st.all ? st.all.flatMap(d => d.items.map(it => Object.assign({ _doc: d._id, _who: d.name || "Utilisateur" }, it))) : null;
  const tab = st.tab || (all ? "all" : "new");
  let h = `<div class="pg-h"><div><div class="eyebrow">Accueil</div><h1>Propositions d'amélioration</h1><p class="lead">Une idée pour rendre SpeedCompta plus simple, plus rapide ou plus complet ? Proposez-la ici : chaque proposition est lue par l'équipe produit, et vous suivez sa prise en compte.</p></div>${all ? `<div class="row"><button class="btn" data-act="idXls">⇩ Excel</button></div>` : ""}</div>`;
  h += `<div class="f2-sub">${[["new", "✎ Nouvelle proposition"], ["mine", "Mes propositions (" + mine.length + ")"]].concat(all ? [["all", "📥 Toutes les propositions (" + all.length + ")"]] : []).map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-act="idTab" data-t="${k}">${l}</button>`).join("")}</div>`;
  if (st.load && !st.mine) return h + `<section class="card"><div class="card-b muted">Chargement…</div></section>`;
  if (tab === "new") { const d = st.draft ||= { type: "amelio", mod: UI.lastModule || "Comptabilité", prio: "2", titre: "", desc: "" };
    h += `<section class="card id-form"><div class="card-b">
      <div class="id-types">${ID_TYPES.map(([k, l]) => `<button class="${d.type === k ? "on" : ""}" data-act="idType" data-k="${k}">${l}</button>`).join("")}</div>
      <div class="ecf-g"><label class="ecf-f w2"><span>Titre de la proposition *</span><input id="idTitre" class="in" maxlength="120" placeholder="Ex. : pouvoir lettrer automatiquement les relevés bancaires" value="${esc(d.titre)}" data-ch="idDraft" data-f="titre"></label>
      <label class="ecf-f"><span>Module concerné</span><select class="in" data-ch="idDraft" data-f="mod">${ID_MODS.map(m => `<option ${d.mod === m ? "selected" : ""}>${m}</option>`).join("")}</select></label>
      <label class="ecf-f"><span>Importance pour vous</span><select class="in" data-ch="idDraft" data-f="prio">${ID_PRIO.map(([k, l]) => `<option value="${k}" ${d.prio === k ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
      <label class="ecf-f"><span>Description *</span><textarea id="idDesc" class="in" rows="6" maxlength="4000" placeholder="Décrivez le besoin, la situation dans laquelle vous le rencontrez et le résultat attendu." data-ch="idDraft" data-f="desc">${esc(d.desc)}</textarea></label>
      <div class="row" style="justify-content:space-between;margin-top:12px"><span class="small muted">Votre nom et la date sont joints à la proposition.</span><button class="btn pri" data-act="idSend">Envoyer la proposition</button></div></div></section>`; }
  const row = (it, adm) => `<div class="id-row"><div class="id-main"><div class="id-top"><b>${esc(it.titre)}</b>${idPill(it.statut || "recu")}</div><div class="small muted">${idType(it.type)} · ${esc(it.mod || "")} · ${(ID_PRIO.find(x => x[0] === it.prio) || ID_PRIO[1])[1]} · ${frDate((it.date || "").slice(0, 10))}${adm ? " · par <b>" + esc(it._who) + "</b>" : ""}</div><div class="id-desc">${esc(it.desc || "")}</div>
      ${it.reponse && !adm ? `<div class="id-rep"><b>Réponse de l'équipe</b>${it.repLe ? " · " + frDate(it.repLe.slice(0, 10)) : ""}<div>${esc(it.reponse)}</div></div>` : ""}
      ${adm ? `<div class="id-adm"><select class="in sm" data-ch="idAdm" data-doc="${esc(it._doc)}" data-id="${it.id}" data-f="statut">${Object.entries(ID_ST).map(([k, v]) => `<option value="${k}" ${(it.statut || "recu") === k ? "selected" : ""}>${v[0]}</option>`).join("")}</select><textarea class="in sm" rows="2" placeholder="Réponse visible par l'utilisateur…" data-ch="idAdm" data-doc="${esc(it._doc)}" data-id="${it.id}" data-f="reponse">${esc(it.reponse || "")}</textarea></div>` : ""}</div>
      ${!adm && (it.statut || "recu") === "recu" ? `<button class="btn sm ghost danger" data-act="idDel" data-id="${it.id}" title="Retirer">✕</button>` : ""}</div>`;
  if (tab === "mine") h += `<section class="card">${mine.length ? mine.slice().reverse().map(it => row(it, false)).join("") : `<div class="card-b muted">Vous n'avez pas encore envoyé de proposition. <a data-act="idTab" data-t="new">Proposer une amélioration</a></div>`}</section>`;
  if (tab === "all" && all) { const q = (st.q || "").toLowerCase(); let L = all.filter(it => (st.f === "tous" || (it.statut || "recu") === st.f) && (!q || (it.titre + " " + it.desc + " " + it._who + " " + it.mod).toLowerCase().includes(q))).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const n = k => all.filter(it => (it.statut || "recu") === k).length;
    h += f2Kpi([["Propositions", String(all.length)], ["Nouvelles", String(n("recu")), n("recu") ? "neg" : ""], ["Planifiées", String(n("plan"))], ["Réalisées", String(n("fait")), "ok"]]);
    h += `<div class="pz-filt"><input class="in" id="idQ" placeholder="Rechercher…" value="${esc(st.q || "")}" style="max-width:260px">${[["tous", "Toutes"]].concat(Object.entries(ID_ST).map(([k, v]) => [k, v[0]])).map(([k, l]) => `<button class="id-chip ${st.f === k ? "on" : ""}" data-act="idF" data-f="${k}">${l}</button>`).join("")}<button class="btn sm ghost" data-act="idReload">↻ Actualiser</button></div>`;
    h += `<section class="card">${L.length ? L.map(it => row(it, true)).join("") : `<div class="card-b muted">Aucune proposition${st.f !== "tous" || q ? " pour ce filtre" : " pour l'instant"}.</div>`}</section>`; }
  if (tab === "all" && st.allErr) h += `<div class="banner warn">Impossible de lire les propositions des autres utilisateurs.</div>`;
  return h;
};
const idFind = (doc, id) => { const d = (idState().all || []).find(x => x._id === doc); return d && d.items.find(x => x.id === id) && { d, it: d.items.find(x => x.id === id) }; };
const IDACT = {
  idTab: el => { idState().tab = el.dataset.t; render(); },
  idType: el => { (idState().draft ||= {}).type = el.dataset.k; render(); },
  idF: el => { idState().f = el.dataset.f; render(); },
  idReload: () => idRefresh(),
  idSend: async () => { const st = idState(); const d = st.draft || {}; const t = document.getElementById("idTitre"), ds = document.getElementById("idDesc"); if (t) d.titre = t.value.trim(); if (ds) d.desc = ds.value.trim();
    if (!d.titre || !d.desc) { toast("Indiquez un titre et une description."); return; }
    if (!st.mine) await idLoadMine(); st.mine.items.push({ id: uid(), type: d.type, mod: d.mod, prio: d.prio, titre: d.titre.slice(0, 120), desc: d.desc.slice(0, 4000), date: new Date().toISOString(), statut: "recu", dossier: S ? S.nom : "" });
    try { await idSaveMine(); st.draft = null; st.tab = "mine"; toast("Merci ! Votre proposition a bien été envoyée."); await idLoadAll(); } catch (e) { st.mine.items.pop(); toast("Envoi impossible : " + (e.message || e)); } render(); },
  idDel: el => { confirmBox("Retirer la proposition", "Cette proposition sera retirée.", "Retirer", async () => { const st = idState(); st.mine.items = st.mine.items.filter(x => x.id !== el.dataset.id); try { await idSaveMine(); } catch (e) { toast("Suppression impossible."); } await idLoadAll(); render(); }, true); },
  idXls: () => { const all = (idState().all || []).flatMap(d => d.items.map(it => [frDate((it.date || "").slice(0, 10)), d.name || "", it.dossier || "", idType(it.type).replace(/^\S+\s/, ""), it.mod || "", (ID_PRIO.find(x => x[0] === it.prio) || ID_PRIO[1])[1], it.titre, it.desc, ID_ST[it.statut || "recu"][0], it.reponse || ""]));
    try { deliverFile("Propositions_amelioration_" + todayISO().replace(/-/g, "") + ".xlsx", buildXLSX([{ name: "Propositions", widths: [12, 22, 22, 22, 18, 14, 40, 70, 14, 50], rows: [{ style: "title", cells: ["Propositions d'amélioration · " + todayISO()] }, { style: "head", cells: ["Date", "Utilisateur", "Dossier", "Type", "Module", "Importance", "Titre", "Description", "Statut", "Réponse"] }].concat(all.map(c => ({ cells: c }))) }]), "xlsx"); } catch (e) { toast("Export impossible : " + (e.message || e)); } }
};
const IDCHG = {
  idDraft: el => { (idState().draft ||= {})[el.dataset.f] = el.value; },
  idAdm: async el => { const r = idFind(el.dataset.doc, el.dataset.id); if (!r) return; r.it[el.dataset.f] = el.value; if (el.dataset.f === "reponse") r.it.repLe = new Date().toISOString();
    const body = Object.assign({}, r.d); delete body._id;
    try { if (Store.mode === "db" && Store.db) await Store.db.doc("idees/" + r.d._id).set(body); else { idState().mine = body; localStorage.setItem("sc:idees", JSON.stringify(body)); } toast("Proposition mise à jour."); } catch (e) { toast("Mise à jour impossible : " + (e.message || e)); }
    if (el.dataset.f === "statut") render(); }
};
Object.assign(F2ACT, IDACT); Object.assign(F2CHG, IDCHG);
document.addEventListener("input", ev => { if (ev.target && ev.target.id === "idQ") { idState().q = ev.target.value; clearTimeout(idState()._t); idState()._t = setTimeout(() => { render(); const i = document.getElementById("idQ"); if (i) { i.focus(); i.selectionStart = i.selectionEnd = i.value.length; } }, 250); } });
/* menu Accueil : Tableau de bord + Propositions d'amélioration */
(function () { const n = NAV2.find(x => x[0] === "accueil"); if (!n) return; if (!n[2].includes("idees")) n[2].push("idees"); n[3] = [["dashboard", "Tableau de bord"], ["idees", "Propositions d'amélioration"]]; })();
