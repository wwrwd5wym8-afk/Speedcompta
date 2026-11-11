/* ============================================================
   1. Déconnexion automatique après 2 heures d'inactivité.
   2. Mes sociétés : choix de l'exercice (en cours / clôturés) sur chaque carte.
   ============================================================ */
/* Déconnexion automatique après 2 heures d'inactivité : sur le site, la session est fermée et
   le mot de passe est redemandé ; dans l'artefact, l'application se verrouille.
   (L'ancien retour automatique à l'accueil après 2 minutes d'absence est supprimé.) */
const SES_MAX = 2 * 60 * 60 * 1000, SES_WARN = 60 * 1000;
const sesSeen = () => { try { return Number(localStorage.getItem("sc:act")) || 0; } catch (e) { return 0; } };
let sesLastW = 0; const sesMark = () => { const n = Date.now(); if (n - sesLastW < 5000) return; sesLastW = n; try { localStorage.setItem("sc:act", String(n)); } catch (e) { } const w = document.getElementById("sesWarn"); if (w) w.remove(); };
let sesOff = false;
let sesTry = 0; async function sesExpire() { if (sesOff) return; if (window.SC_CLOUD_ON && !window.SC_LOGOUT && sesTry++ < 40) { setTimeout(sesExpire, 300); return; } sesOff = true; try { await Store.flush(); } catch (e) { } try { localStorage.removeItem("sc:act"); localStorage.removeItem("sc:view"); } catch (e) { }
  if (window.SC_LOGOUT) { try { sessionStorage.setItem("sc:expired", "1"); } catch (e) { } window.SC_LOGOUT(); return; }
  let ov = document.getElementById("sesOv"); if (!ov) { ov = document.createElement("div"); ov.id = "sesOv"; ov.className = "ses-ov"; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="ses-box"><b>🔒 Session verrouillée</b><small>Vous êtes resté inactif plus de 2 heures : par sécurité, l'application a été verrouillée.</small><button class="btn pri" id="sesBack" style="margin-top:12px">Se reconnecter</button></div>`;
  ov.querySelector("#sesBack").onclick = () => { try { localStorage.setItem("sc:act", String(Date.now())); history.replaceState(null, "", location.pathname + location.search); } catch (e) { } location.reload(); }; }
function sesCheck() { if (sesOff) return; const last = sesSeen(); if (!last) { sesMark(); return; } const idle = Date.now() - last;
  if (idle >= SES_MAX) { sesExpire(); return; }
  if (idle >= SES_MAX - SES_WARN && !document.getElementById("sesWarn")) { const w = document.createElement("div"); w.id = "sesWarn"; w.className = "ses-warn"; w.innerHTML = `<span>⏱ Déconnexion automatique dans moins d'une minute pour inactivité.</span><button class="btn sm pri">Rester connecté</button>`; w.querySelector("button").onclick = () => { sesLastW = 0; sesMark(); }; document.body.appendChild(w); } }
(function () { const last = sesSeen(); if (last && Date.now() - last > SES_MAX) { try { localStorage.removeItem("sc:view"); } catch (e) { } UI.view = "dashboard"; UI.space = ""; setTimeout(sesExpire, window.SC_LOGOUT ? 0 : 50); } else sesMark();
  ["pointerdown", "keydown", "wheel", "touchstart", "mousemove"].forEach(ev => document.addEventListener(ev, () => { if (!sesOff) sesMark(); }, { passive: true, capture: true }));
  setInterval(sesCheck, 20000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sesCheck(); else { try { Store.flush(); } catch (e) { } } });
  const st = document.createElement("style"); st.textContent = `.ses-warn{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:10001;display:flex;gap:12px;align-items:center;background:#0F3D3E;color:#fff;padding:10px 14px;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.25);font-size:13px}`; document.head.appendChild(st);
  try { if (sessionStorage.getItem("sc:expired")) { sessionStorage.removeItem("sc:expired"); setTimeout(() => { try { toast("Session expirée après 2 heures d'inactivité : reconnectez-vous."); } catch (e) { } }, 1500); } } catch (e) { } })();

/* ---------------- Mes sociétés : exercices ---------------- */
const _dsSumX = dossierSummary;
function dsExMetrics(ex) { const inEx = d => d >= ex.debut && d <= ex.fin; const br = E.filter(e => inEx(e.date) && e.statut !== "valide").length; const rel = (S.releves || []).filter(r => !r.pointe && inEx(r.date)).length;
  let att = 0; for (const { l } of flat({ from: ex.debut, to: ex.fin })) if (/^47/.test(l.compte)) att += l.debit - l.credit; let deseq = 0; try { const b = bilan(ex); deseq = b.totA - b.totP; } catch (e) { }
  let revN = 0, revD = 0, ano = 0; try { const R = revRows(ex); revN = R.length; revD = R.filter(r => r.st === "valide" || r.st === "so").length; ano = R.filter(r => r.st === "anomalie").length; } catch (e) { }
  return { br, rel, att, deseq, revN, revD, ano }; }
dossierSummary = function () { const s = _dsSumX.apply(this, arguments); try { Object.assign(s, dsExMetrics(exCur())); } catch (e) { } try { s.exs = S.exercices.slice().sort((a, b) => b.fin.localeCompare(a.fin)).map(ex => { const cr = compteResultat(ex.debut, ex.fin); const m = soldeMap(ex.debut, ex.fin); return Object.assign({ id: ex.id, debut: ex.debut, fin: ex.fin, cloture: !!ex.cloture, ca: cr.CA, rn: cr.RN, treso: sumPref(m, ["512", "514", "53"]) }, dsExMetrics(ex)); }); s.exCur = S.exCourant || s.ex; } catch (e) { } return s; };
function dsCardEx(id, s) { const st = UI.sub.dsx ||= {}; const o = st[id] ||= {}; const exs = s.exs && s.exs.length ? s.exs : (s.ex ? [{ id: s.ex, fin: s.exFin || "", debut: "", cloture: !!s.cloture, ca: s.ca, rn: s.rn, treso: s.treso }] : []);
  if (!exs.length) return null; const open = exs.filter(x => !x.cloture), clos = exs.filter(x => x.cloture);
  const tab = o.tab || (open.length ? "open" : "clos"); const L = tab === "clos" ? clos : open; const sel = exs.find(x => x.id === o.ex) || L.find(x => x.id === s.exCur) || L[0] || exs[0];
  const html = `<div class="ds-ex"><div class="ds-tabs"><button class="${tab === "open" ? "on" : ""}" data-act="dsTab" data-id="${id}" data-v="open">En cours <em>${open.length}</em></button><button class="${tab === "clos" ? "on" : ""}" data-act="dsTab" data-id="${id}" data-v="clos">Clôturés <em>${clos.length}</em></button></div>
    <div class="ds-chips">${L.map(x => `<button class="ds-chip ${x.id === sel.id ? "on" : ""}" data-act="dsPick" data-id="${id}" data-ex="${x.id}" title="${x.debut ? "Du " + frDate(x.debut) + " au " + frDate(x.fin) : ""}">${esc(x.id.replace("EX", ""))}${x.cloture ? " 🔒" : ""}</button>`).join("") || `<span class="small muted">${tab === "clos" ? "Aucun exercice clôturé" : "Aucun exercice en cours"}</span>`}</div></div>`;
  const k = `<div class="soc-k"><div><span>CA ${esc(sel.id.replace("EX", ""))}</span><b>${sel.ca != null ? eur0(sel.ca) : "—"}</b></div><div><span>Résultat</span><b style="color:${(sel.rn || 0) >= 0 ? "var(--ok)" : "var(--bad)"}">${sel.rn != null ? eur0(sel.rn) : "—"}</b></div><div><span>Trésorerie</span><b>${sel.treso != null ? eur0(sel.treso) : "—"}</b></div></div>`;
  return { html, k, sel }; }
const _vDossiersX = VIEWS.dossiers;
const DS_COL = ["#2F6BFF", "#7C3AED", "#0EA5E9", "#16A34A", "#F59E0B", "#E11D48", "#0D9488", "#9333EA"];
const dsCol = n => DS_COL[[...(n || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % DS_COL.length];
/* statut du dossier : « Traité » uniquement quand tout est fait sur l'exercice */
function dsHealth(s) { if (s.ca == null && s.br == null) return { sc: null, lib: "Jamais ouverte", cls: "n", todo: [] };
  const known = s.att != null; const T = [];
  if (s.br) T.push(["📝", s.br + " en brouillard", "écritures à valider"]); if (s.rel) T.push(["🏦", s.rel + " à rapprocher", "opérations bancaires à pointer"]);
  if (known && s.att) T.push(["⏳", "attente " + eur0(Math.abs(s.att)), "comptes d'attente 47 à solder"]); if (known && s.deseq) T.push(["⚖", "bilan déséquilibré", "écart de " + eur0(Math.abs(s.deseq))]);
  if (s.ano) T.push(["⚠", s.ano + " anomalie(s)", "anomalies de révision à corriger"]);
  const revPct = s.revN ? Math.round(s.revD / s.revN * 100) : (known ? 0 : null); const revOk = s.revN ? s.revD === s.revN : false;
  if (known && !revOk) T.push(["🔍", "révision " + (revPct || 0) + " %", "comptes restant à réviser"]);
  const crit = known ? [!s.br, !s.rel, !s.att, !s.deseq, !s.ano, revOk] : [!s.br, !s.rel]; const sc = Math.round(crit.filter(Boolean).length / crit.length * 100);
  const blocking = s.br || s.rel || (known && (s.att || s.deseq)) || s.ano;
  if (!blocking && known && revOk) return { sc: 100, lib: s.cloture ? "Traité · clôturé" : "Traité", cls: "ok", todo: [], done: true };
  if (!blocking) return { sc, lib: known ? "En révision" : "À vérifier", cls: "warn", todo: T };
  return { sc, lib: "À traiter", cls: "bad", todo: T }; }
const dsAgo = d => { if (!d) return ""; const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 2 ? "à l'instant" : m < 60 ? "il y a " + m + " min" : m < 1440 ? "il y a " + Math.round(m / 60) + " h" : "il y a " + Math.round(m / 1440) + " j"; };
VIEWS.dossiers = function () { if (typeof eqOn === "function" && eqOn() && !eqLeader() && typeof EQ !== "undefined" && EQ.me) return _vDossiersX.apply(this, arguments);
  const st = UI.sub.dossiers ||= { q: "" }; st.f ||= "all"; st.sort ||= "nom"; st.mode ||= (function () { try { return localStorage.getItem("sc:dsmode2") || "list"; } catch (e) { return "list"; } })();
  const rows = (INDEX.dossiers || []).map(x => { const s = S && x.id === S.id ? dossierSummary() : (x.sum || {}); const r = dsCardEx(x.id, s); const sel = r ? r.sel : { id: s.ex || "", ca: s.ca, rn: s.rn, treso: s.treso }; return { x, s, r, sel, h: dsHealth(Object.assign({}, s, sel.br != null || sel.att != null ? sel : {}, { cloture: sel.cloture != null ? sel.cloture : s.cloture })), on: S && x.id === S.id }; });
  const q = (st.q || "").toLowerCase(); let L = rows.filter(o => !q || [o.x.nom, o.s.siren, o.s.forme].join(" ").toLowerCase().includes(q)).filter(o => st.f === "all" || (st.f === "ok" ? o.h.done : st.f === "todo" ? !o.h.done : st.f === "clos" ? (o.s.exs || []).some(e => e.cloture) === false && o.s.cloture === false : true));
  const sk = { nom: o => (o.x.nom || "").toLowerCase(), ca: o => -(o.sel.ca || 0), rn: o => -(o.sel.rn || 0), sante: o => o.h.sc == null ? 999 : o.h.sc }[st.sort]; L.sort((a, b) => { const x = sk(a), y = sk(b); return x < y ? -1 : x > y ? 1 : 0; });
  const tot = rows.reduce((a, o) => ({ ca: a.ca + (o.sel.ca || 0), rn: a.rn + (o.sel.rn || 0), tr: a.tr + (o.sel.treso || 0), al: a.al + (o.s.late || 0) + (o.s.rel ? 1 : 0) }), { ca: 0, rn: 0, tr: 0, al: 0 });
  const todo = rows.filter(o => !o.h.done).length;
  const kpi = `<div class="ds-kpis">${[["🏢", "Sociétés", String(rows.length), rows.filter(o => o.h.done).length + " traité(s)"], ["⚠", "Dossiers à traiter", String(todo), todo ? "saisie, rapprochement, attente, révision" : "tout est traité", todo ? "bad" : "ok"]].map(([i, l, v, sub, c]) => `<div class="ds-kpi"><span class="ds-ki">${i}</span><div><small>${l}</small><b class="${c || ""}">${v}</b><em>${sub}</em></div></div>`).join("")}</div>`;
  const tools = `<div class="ds-tools"><div class="pz-srch">🔍<input class="in" id="dq" placeholder="Rechercher une société, un SIREN…" value="${esc(st.q)}" data-in="dq"></div><div class="pz-chips">${[["all", "Toutes", rows.length], ["ok", "Traités", rows.filter(o => o.h.done).length], ["todo", "À traiter", todo]].map(([k, l, n]) => `<button class="${st.f === k ? "on" : ""}" data-act="dsF" data-v="${k}">${l} <small>${n}</small></button>`).join("")}</div><span class="sp"></span><label class="pz-fc on"><span>Trier</span><select data-ch="dsSort">${[["nom", "Nom"], ["ca", "Chiffre d'affaires"], ["rn", "Résultat"], ["sante", "Statut du dossier"]].map(([k, l]) => `<option value="${k}" ${st.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select></label><div class="seg"><button class="${st.mode === "grid" ? "on" : ""}" data-act="dsMode" data-v="grid" title="Cartes">▦</button><button class="${st.mode === "list" ? "on" : ""}" data-act="dsMode" data-v="list" title="Liste">☰</button></div><button class="btn pri" data-act="newSoc">${ico("plus")} Nouvelle société</button></div>`;
  const openBtn = (o, cls) => `<button class="btn ${cls || "pri"}" data-act="dsOpen" data-id="${o.x.id}" data-ex="${esc(o.sel.id || "")}">Ouvrir${o.sel.id ? " · " + esc(o.sel.id.replace("EX", "")) : ""} ${ico("arrow")}</button>`;
  const card = o => { const s = o.s, h = o.h, c = dsCol(o.x.nom); return `<article class="ds-card ${o.on ? "on" : ""}">
    <div class="ds-top"><span class="ds-av" style="background:${c}">${initials(o.x.nom)}</span><div class="ds-id"><h2 title="${esc(o.x.nom)}">${esc(o.x.nom)}</h2><div class="ds-meta">${s.activite && ACTIVITES[s.activite] ? `<span class="ds-tag">${esc(profil(s.activite).lib)}</span>` : ""}${s.forme ? `<span>${esc(s.forme)}</span>` : ""}${s.siren ? `<span class="mono">${esc(s.siren)}</span>` : ""}${o.x.demo ? `<span class="ds-demo">Démo</span>` : ""}</div></div>${menu(o)}</div>
    ${o.r ? o.r.html : ""}
    <div class="ds-k"><div><small>CA ${esc((o.sel.id || "").replace("EX", ""))}</small><b>${o.sel.ca != null ? eur0(o.sel.ca) : "—"}</b></div><div><small>Résultat</small><b class="${(o.sel.rn || 0) >= 0 ? "ok" : "bad"}">${o.sel.rn != null ? eur0(o.sel.rn) : "—"}</b>${o.sel.ca ? `<em>${((o.sel.rn || 0) / o.sel.ca * 100).toFixed(1).replace(".", ",")} % du CA</em>` : ""}</div><div><small>Trésorerie</small><b class="${(o.sel.treso || 0) < 0 ? "bad" : ""}">${o.sel.treso != null ? eur0(o.sel.treso) : "—"}</b></div></div>
    <div class="ds-h"><div class="ds-hb"><i class="${h.cls}" style="width:${h.sc == null ? 0 : h.sc}%"></i></div><span class="ds-hl ${h.cls}">${h.lib}${h.sc != null ? " · " + h.sc + " %" : ""}</span></div>
    <div class="ds-todo">${h.done ? `<span class="ok">✓ Tout est fait : dossier traité</span>` : h.todo.map(t => `<span title="${esc(t[2])}">${t[0]} ${esc(t[1])}</span>`).join("")}</div>
    <div class="ds-foot"><span class="small muted">${o.on ? '<span class="ds-live">● Ouverte</span>' : s.maj ? "Mise à jour " + dsAgo(s.maj) : ""}</span>${openBtn(o)}</div></article>`; };
  const menu = o => `<div class="ds-menu"><button class="ds-dots" data-act="dsMenu" data-id="${o.x.id}" title="Plus d'actions" aria-haspopup="true">⋯</button>${UI.sub.dsMenu === o.x.id ? `<div class="ds-pop" role="menu"><button data-act="dsOpen" data-id="${o.x.id}" data-ex="${esc(o.sel.id || "")}">↗ Ouvrir le dossier</button><button data-act="dsMenuClose">✕ Fermer ce menu</button><button class="danger" data-act="askDelSoc" data-id="${o.x.id}">🗑 Supprimer la société…</button></div>` : ""}</div>`;
  const exInline = o => { const exs = o.s.exs && o.s.exs.length ? o.s.exs : (o.sel.id ? [{ id: o.sel.id, cloture: !!o.s.cloture }] : []); return exs.length ? `<div class="dl-ex">${exs.slice(0, 4).map(e => `<button class="ds-chip ${e.id === o.sel.id ? "on" : ""}" data-act="dsPick" data-id="${o.x.id}" data-ex="${e.id}" title="${e.cloture ? "Exercice clôturé" : "Exercice en cours"}">${esc(e.id.replace("EX", ""))}${e.cloture ? " 🔒" : ""}</button>`).join("")}${exs.length > 4 ? `<select class="in sm dl-more" data-ch="dsExSel" data-id="${o.x.id}"><option value="">+${exs.length - 4}</option>${exs.slice(4).map(e => `<option value="${e.id}">${e.id.replace("EX", "")}${e.cloture ? " (clôturé)" : ""}</option>`).join("")}</select>` : ""}</div>` : `<span class="muted small">—</span>`; };
  const list = `<div class="dl"><div class="dl-h"><span>Société</span><span>Exercice</span><span class="r">CA</span><span class="r">Résultat</span><span class="r">Trésorerie</span><span>Statut</span><span>À traiter</span><span></span></div>${L.map(o => `<div class="dl-r ${o.on ? "on" : ""}" data-act="dsRow" data-id="${o.x.id}" data-ex="${esc(o.sel.id || "")}">
    <div class="ds-row"><span class="ds-av sm" style="background:${dsCol(o.x.nom)}">${initials(o.x.nom)}</span><div class="dl-n"><b title="${esc(o.x.nom)}">${esc(o.x.nom)}</b><small>${[o.s.forme, o.s.siren].filter(Boolean).map(esc).join(" · ")}${o.on ? ' · <span class="ds-live">● ouverte</span>' : o.x.demo ? " · démo" : ""}</small></div></div>
    <div>${exInline(o)}</div><div class="r mono" data-l="CA">${o.sel.ca != null ? eur0(o.sel.ca) : "—"}</div><div class="r mono ${(o.sel.rn || 0) >= 0 ? "pz-pos" : "rp-dn"}" data-l="Résultat">${o.sel.rn != null ? eur0(o.sel.rn) : "—"}</div><div class="r mono ${(o.sel.treso || 0) < 0 ? "rp-dn" : ""}" data-l="Trésorerie">${o.sel.treso != null ? eur0(o.sel.treso) : "—"}</div>
    <div class="dl-h2"><div class="ds-hb"><i class="${o.h.cls}" style="width:${o.h.sc == null ? 0 : o.h.sc}%"></i></div><span class="ds-hl ${o.h.cls}">${o.h.lib}</span></div>
    <div class="ds-todo" title="${esc(o.h.todo.map(t => t[1] + " : " + t[2]).join("\n"))}">${o.h.done ? `<span class="ok">✓ tout est fait</span>` : o.h.todo.slice(0, 1).map(t => `<span title="${esc(t[2])}">${t[0]} ${esc(t[1])}</span>`).join("") + (o.h.todo.length > 1 ? `<span title="${esc(o.h.todo.slice(1).map(t => t[1]).join(", "))}">+${o.h.todo.length - 1}</span>` : "")}</div>
    <div class="dl-a">${openBtn(o, "sm pri")}${menu(o)}</div></div>`).join("") || `<div class="pz-empty">Aucune société ne correspond.</div>`}<button class="dl-new" data-act="newSoc">${ico("plus")} Ajouter une société <span class="small muted">création, import FEC ou restauration</span></button></div>`;
  return `<div class="pg-h"><div><div class="eyebrow">Portefeuille</div><h1>Mes sociétés</h1><p class="lead">Choisissez une société et un exercice, en cours ou clôturé, pour travailler dessus.</p></div></div>${kpi}${tools}
    ${st.mode === "list" ? list : `<div class="ds-grid">${L.map(card).join("")}<button class="ds-card ds-new" data-act="newSoc"><span class="ds-plus">${ico("plus")}</span><b>Ajouter une société</b><span class="small muted">Création, reprise par import FEC ou restauration d'une sauvegarde</span></button></div>`}`; };
const SESACT = {
  dsMenuClose: () => { UI.sub.dsMenu = ""; render(); },
  dsRow: async (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest("button,select,a,input,.ds-menu")) return; await SESACT.dsOpen(el); },
  dsF: el => { (UI.sub.dossiers ||= {}).f = el.dataset.v; render(); },
  dsMode: el => { (UI.sub.dossiers ||= {}).mode = el.dataset.v; try { localStorage.setItem("sc:dsmode2", el.dataset.v); } catch (e) { } render(); },
  dsMenu: el => { UI.sub.dsMenu = UI.sub.dsMenu === el.dataset.id ? "" : el.dataset.id; render(); },
  dsTab: el => { const o = (UI.sub.dsx ||= {})[el.dataset.id] ||= {}; o.tab = el.dataset.v; o.ex = ""; render(); },
  dsPick: el => { const o = (UI.sub.dsx ||= {})[el.dataset.id] ||= {}; o.ex = el.dataset.ex; render(); },
  dsOpen: async el => { const id = el.dataset.id, exId = el.dataset.ex;
    if (!(S && S.id === id)) { await ACT.openDossier({ dataset: { id } }); if (!S || S.id !== id) return; }
    if (exId && S.exercices.some(x => x.id === exId) && S.exCourant !== exId) { S.exCourant = exId; Store.touch(); try { await saveIndex(); } catch (e) { } }
    go("dashboard"); toast("« " + S.nom + " » · exercice " + exCur().id.replace("EX", "") + (exCur().cloture ? " (clôturé)" : "") + " ouvert."); }
};

const SESCHG = { dsSort: el => { (UI.sub.dossiers ||= {}).sort = el.value; render(); }, dsExSel: el => { const o = (UI.sub.dsx ||= {})[el.dataset.id] ||= {}; o.ex = el.value; const x = (INDEX.dossiers || []).find(d => d.id === el.dataset.id); const s = x && (S && x.id === S.id ? dossierSummary() : x.sum || {}); const e = s && (s.exs || []).find(y => y.id === el.value); o.tab = e && e.cloture ? "clos" : "open"; render(); } };

/* fermeture du menu ⋯ : clic à l'extérieur ou touche Échap */
document.addEventListener("click", ev => { if (!UI.sub || !UI.sub.dsMenu) return; if (ev.target.closest && ev.target.closest(".ds-menu")) return; UI.sub.dsMenu = ""; ev.stopPropagation(); ev.preventDefault(); render(); }, true);
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && UI.sub && UI.sub.dsMenu) { UI.sub.dsMenu = ""; render(); } });
