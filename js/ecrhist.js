/* ============================================================================
   Historique détaillé des écritures
   - chaque modification d'une écriture est mémorisée (auteur, date, heure, état avant)
   - réimputation, montants, libellés, validation, lettrage, pointage, suppression, restauration
   - Balance de révision › onglet « Historique » : ce compte ou toute la balance,
     chronologie avec détails dépliables (avant / après), filtres, recherche, export Excel
   ========================================================================== */
const ERH_DEF = { on: "1", open: "0" };
function erhCfg() { return Object.assign({}, ERH_DEF, (S && S.erhCfg) || {}); }
const ERH_SNAP = new Map(); let ERH_E = null, ERH_T0 = 0;
const erhWho = () => { try { return typeof bkWho === "function" ? bkWho() : (typeof ecrMe === "function" ? ecrMe() : "Utilisateur"); } catch (e) { return "Utilisateur"; } };
function erhSnap(e) { return { j: e.journal, d: e.date, p: e.piece || "", l: e.libelle || "", s: e.statut || "", L: (e.lignes || []).map(x => [x.compte || "", x.aux || "", x.lib || "", x.debit || 0, x.credit || 0, x.lettre || "", x.pointe ? 1 : 0]) }; }
function erhSync() { if (typeof E === "undefined" || !Array.isArray(E)) return; if (E !== ERH_E || ERH_SNAP.size === 0 && E.length) { ERH_E = E; ERH_T0 = Date.now(); ERH_SNAP.clear(); E.forEach(e => { try { ERH_SNAP.set(e.id, JSON.stringify(erhSnap(e))); } catch (x) { } }); } }
function erhKind(a, b) {
  const acc = s => s.L.map(x => x[0] + "|" + x[1]).sort().join(","), amt = s => s.L.map(x => x[3] + "/" + x[4]).sort().join(","), let_ = s => s.L.filter(x => x[5]).length, pt = s => s.L.filter(x => x[6]).length;
  if (acc(a) !== acc(b)) return "reimp";
  if (amt(a) !== amt(b) || a.L.length !== b.L.length) return "montant";
  if (a.s !== b.s) return b.s === "valide" ? "valide" : "devalide";
  if (let_(a) !== let_(b)) return let_(b) > let_(a) ? "lettre" : "delettre";
  if (a.L.map(x => x[5]).join() !== b.L.map(x => x[5]).join()) return "lettre";
  if (pt(a) !== pt(b)) return pt(b) > pt(a) ? "pointe" : "depointe";
  return "modif";
}
function erhRecord(e) {
  if (!e || !e.lignes || !e.id || erhCfg().on !== "1") return; erhSync();
  let now; try { now = JSON.stringify(erhSnap(e)); } catch (x) { return; }
  const prev = ERH_SNAP.get(e.id); ERH_SNAP.set(e.id, now); if (!prev || prev === now || !E.includes(e)) return; if (Date.now() - ERH_T0 < 4000) return; /* chargement ou création du dossier */
  const H = e.hv ||= []; const me = erhWho(), at = new Date().toISOString(); const last = H[H.length - 1];
  const k = erhKind(JSON.parse(prev), JSON.parse(now));
  if (last && last.by === me && Date.now() - Date.parse(last.at) < 90000 && last.k === k) { last.at = at; return; }
  H.push({ at, by: me, k, b: prev }); if (H.length > 30) H.splice(0, H.length - 30);
}
(function () {
  const _se = saveEcr; saveEcr = function (e) { try { erhRecord(e); } catch (x) { } return _se.apply(this, arguments); };
  const _ae = addEcr; addEcr = function (e) { const r = _ae.apply(this, arguments); try { if (e && e.id) ERH_SNAP.set(e.id, JSON.stringify(erhSnap(e))); } catch (x) { } return r; };
  if (typeof ecrRestore === "function") { const _rs = ecrRestore; ecrRestore = function (id) { const r = _rs.apply(this, arguments); try { const rec = (S.ecrDel || []).find(x => x.id === id); (rec && rec.ecr || []).forEach(x => { const e = E.find(y => y.id === x.id); if (e) { (e.hv ||= []).push({ at: new Date().toISOString(), by: erhWho(), k: "rest", b: JSON.stringify(erhSnap(e)) }); } }); Store.touch(); } catch (x) { } return r; }; }
  setInterval(() => { try { if (S) erhSync(); } catch (x) { } }, 1500);
})();

const ERH_LIB = { cree: "a créé l'écriture", imp: "a importé l'écriture", fac: "a comptabilisé la facture", reimp: "a réimputé l'écriture", montant: "a modifié les montants", modif: "a modifié l'écriture", valide: "a validé l'écriture", devalide: "a remis l'écriture en brouillard", lettre: "a lettré l'écriture", delettre: "a délettré l'écriture", pointe: "a rapproché l'écriture (banque)", depointe: "a annulé le rapprochement", supp: "a supprimé l'écriture", rest: "a restauré l'écriture", orig: "Écriture d'origine" };
const ERH_GRP = { tout: ["Tout", null], cree: ["Créations", ["cree", "imp", "fac", "orig"]], modif: ["Modifications", ["modif", "montant"]], reimp: ["Réimputations", ["reimp"]], let: ["Lettrage et banque", ["lettre", "delettre", "pointe", "depointe"]], val: ["Validations", ["valide", "devalide"]], supp: ["Suppressions", ["supp", "rest"]] };
const ERH_COL = { cree: "#1F8A55", imp: "#1F8A55", fac: "#1F8A55", orig: "#8A9A98", reimp: "#C77700", montant: "#4C3FB5", modif: "#4C3FB5", valide: "#0F6E5C", devalide: "#8A5A00", lettre: "#13585A", delettre: "#8A5A00", pointe: "#13585A", depointe: "#8A5A00", supp: "#C2364B", rest: "#1F8A55" };

/* tous les événements touchant un compte (ou toute la balance) */
function erhEvents(acc) {
  const hit = s => !acc || s.L.some(x => x[0] === acc || x[1] === acc);
  const out = [];
  E.forEach(e => { let cur; try { cur = erhSnap(e); } catch (x) { return; } const H = e.hv || [];
    const states = H.map(h => { try { return JSON.parse(h.b); } catch (x) { return cur; } });
    const first = states[0] || cur; const ever = hit(cur) || states.some(hit); if (!ever) return;
    const k0 = e.releveId ? "imp" : e.inboxId ? "fac" : "cree";
    if (e.auteur || e.creeLe) out.push({ at: e.creeLe || (e.date + "T00:00:00"), by: e.auteur || "?", k: k0, e, st: first, eid: e.id, noTime: !e.creeLe });
    else out.push({ at: e.date + "T00:00:00", by: "", k: "orig", e, st: first, eid: e.id, noTime: true });
    H.forEach((h, i) => { const after = states[i + 1] || cur; if (h.k === "rest" || hit(states[i]) || hit(after)) out.push({ at: h.at, by: h.by, k: h.k, e, st: h.k === "rest" ? states[i] : after, before: h.k === "rest" ? null : states[i], eid: e.id }); });
  });
  (S.ecrDel || []).forEach(rec => (rec.ecr || []).forEach(x => { let s; try { s = erhSnap(x); } catch (z) { return; } if (!hit(s)) return; const back = E.some(y => y.id === x.id); out.push({ at: rec.at, by: rec.user || "?", k: "supp", st: s, eid: x.id, rec, gone: !back, why: rec.label || "" }); }));
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
const erhIni = s => String(s || "?").split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
const erhHue = s => { let h = 0; String(s || "").split("").forEach(c => h = (h * 31 + c.charCodeAt(0)) % 360); return h; };
function erhRel(iso) { const d = Date.parse(iso); if (!d) return ""; const s = (Date.now() - d) / 1000; if (s < 60) return "à l'instant"; if (s < 3600) return "il y a " + Math.round(s / 60) + " min"; if (s < 86400) return "il y a " + Math.round(s / 3600) + " h"; const j = Math.round(s / 86400); if (j < 31) return "il y a " + j + " j"; const m = Math.round(j / 30.4); if (m < 12) return "il y a " + m + " mois"; return "il y a " + Math.round(m / 12) + " an" + (m >= 24 ? "s" : ""); }
function erhWhen(ev) { const d = new Date(ev.at); if (isNaN(d)) return ""; const dd = d.toLocaleDateString("fr-FR"); return ev.noTime ? "date de l'écriture : " + dd : erhRel(ev.at) + " · " + dd + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
function erhDay(iso) { const d = new Date(iso); const t = new Date(); const y = new Date(Date.now() - 864e5); const same = (a, b) => a.toDateString() === b.toDateString(); if (same(d, t)) return "Aujourd'hui"; if (same(d, y)) return "Hier"; return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
/* carte de l'écriture : état après l'événement, valeurs modifiées surlignées, ancienne valeur barrée */
function erhCard(ev, acc) {
  const s = ev.st, b = ev.before; const ch = (x, y) => b && String(x) !== String(y);
  const head = `<div class="erh-ch"><span class="erh-j">${esc(s.j)}</span><span class="${ch(s.d, b && b.d) ? "erh-new" : ""}">${frDate(s.d)}${ch(s.d, b && b.d) ? ` <s>${frDate(b.d)}</s>` : ""}</span><span class="mono ${ch(s.p, b && b.p) ? "erh-new" : ""}">${esc(s.p)}${ch(s.p, b && b.p) ? ` <s>${esc(b.p)}</s>` : ""}</span><span class="erh-st">${s.s === "valide" ? "Validée" : "Brouillard"}</span></div>
    <div class="erh-lib ${ch(s.l, b && b.l) ? "erh-new" : ""}">${esc(s.l || "—")}${ch(s.l, b && b.l) ? `<s>${esc(b.l)}</s>` : ""}</div>`;
  const bl = b ? b.L : [];
  const rows = s.L.map((x, i) => { const o = bl[i]; const c = (k) => o && String(o[k]) !== String(x[k]); const mine = acc && (x[0] === acc || x[1] === acc);
    return `<tr class="${mine ? "erh-me" : ""}"><td><span class="mono ${c(0) || c(1) ? "erh-new" : ""}">${esc(x[0])}${x[1] ? " · " + esc(x[1]) : ""}</span>${c(0) || c(1) ? `<s class="mono">${esc(o[0])}${o[1] ? " · " + esc(o[1]) : ""}</s>` : ""}<div class="small muted">${esc(x[2] || accLib(x[0]))}</div></td>
      <td class="r mono ${c(3) ? "erh-new" : ""}">${x[3] ? eur(x[3]) : ""}${c(3) ? `<s>${o[3] ? eur(o[3]) : "0,00"}</s>` : ""}</td><td class="r mono ${c(4) ? "erh-new" : ""}">${x[4] ? eur(x[4]) : ""}${c(4) ? `<s>${o[4] ? eur(o[4]) : "0,00"}</s>` : ""}</td>
      <td class="c">${x[5] ? `<span class="erh-let ${c(5) ? "erh-new" : ""}">${esc(x[5])}</span>` : c(5) ? `<s class="erh-let">${esc(o[5])}</s>` : ""}${x[6] ? ' <span title="Rapprochée">🏦</span>' : ""}</td></tr>`; }).join("");
  const gone = b ? bl.slice(s.L.length).map(o => `<tr class="erh-del"><td><s class="mono">${esc(o[0])}</s></td><td class="r"><s>${o[3] ? eur(o[3]) : ""}</s></td><td class="r"><s>${o[4] ? eur(o[4]) : ""}</s></td><td></td></tr>`).join("") : "";
  const D = s.L.reduce((a, x) => a + (+x[3] || 0), 0), C = s.L.reduce((a, x) => a + (+x[4] || 0), 0);
  return `<div class="erh-card">${head}<table class="erh-t"><tbody>${rows}${gone}</tbody><tfoot><tr><td>Total</td><td class="r mono">${eur(D)}</td><td class="r mono">${eur(C)}</td><td></td></tr></tfoot></table>
    <div class="erh-acts">${ev.k === "supp" ? (ev.gone ? `<button class="btn sm" data-act="erhRest" data-id="${ev.rec.id}">↺ Restaurer</button>${ev.why ? `<span class="small muted">${esc(ev.why)}</span>` : ""}` : `<span class="small muted">Restaurée depuis</span>`) : E.some(e => e.id === ev.eid) ? `<button class="btn sm ghost" data-act="viewEcr" data-id="${ev.eid}">Ouvrir l'écriture</button>` : ""}</div></div>`;
}
function erhChanges(ev) { const a = ev.before, b = ev.st; if (!a) return ""; const L = [];
  const accA = a.L.map(x => x[0]), accB = b.L.map(x => x[0]); accB.forEach((c, i) => { if (accA[i] && accA[i] !== c) L.push(`${accA[i]} → <b>${c}</b>`); });
  if (a.d !== b.d) L.push("date"); if (a.p !== b.p) L.push("pièce"); if (a.l !== b.l) L.push("libellé"); if (a.j !== b.j) L.push("journal " + a.j + " → " + b.j);
  const amt = s => s.L.reduce((t, x) => t + (+x[3] || 0), 0); if (amt(a) !== amt(b)) L.push(eur(amt(a)) + " → <b>" + eur(amt(b)) + "</b>");
  return L.length ? `<span class="erh-chg">${L.slice(0, 4).join(" · ")}</span>` : ""; }

function erhPanel(sel) {
  const st = brState(); const f = st.erhf ||= { scope: "cpt", g: "tout", u: "", q: "", n: 40 };
  const acc = f.scope === "cpt" ? sel.num : "";
  let L = erhEvents(acc);
  const users = [...new Set(L.map(x => x.by).filter(Boolean))].sort();
  const G = ERH_GRP[f.g] && ERH_GRP[f.g][1]; if (G) L = L.filter(x => G.includes(x.k));
  if (f.u) L = L.filter(x => x.by === f.u);
  if (f.q) { const q = f.q.toLowerCase(); L = L.filter(x => [x.st.p, x.st.l, x.by, x.st.j, ...x.st.L.map(y => y[0] + " " + y[2])].join(" ").toLowerCase().includes(q)); }
  const tot = L.length; const shown = L.slice(0, f.n); const open = UI._ehOpen ||= new Set(); const allOpen = erhCfg().open === "1";
  let day = "";
  const items = shown.map((ev, i) => { const key = ev.eid + "|" + ev.at + "|" + ev.k; const isOpen = allOpen ? !open.has(key) : open.has(key); const d = ev.noTime ? "" : erhDay(ev.at); const dh = d && d !== day ? `<div class="erh-day">${esc(d)}</div>` : ""; if (d) day = d;
    const who = ev.by || "Auteur non enregistré";
    return `${dh}<div class="erh-it"><span class="erh-av" style="background:hsl(${erhHue(who)} 35% 38%)" title="${esc(who)}">${esc(ev.by ? erhIni(who) : "?")}</span><span class="erh-dot" style="background:${ERH_COL[ev.k] || "#8A9A98"}"></span>
      <div class="erh-b"><div class="erh-h">${ev.k === "orig" ? `<b>${ERH_LIB.orig}</b> <span class="muted">(auteur non enregistré)</span>` : `<b>${esc(who)}</b> ${ERH_LIB[ev.k] || "a modifié l'écriture"}`}</div>
      <div class="erh-m"><span>${esc(erhWhen(ev))}</span><span class="erh-pc mono">${esc(ev.st.j)} ${esc(ev.st.p || "")}</span>${erhChanges(ev)}</div>
      <button class="erh-tg" data-act="erhT" data-k="${esc(key)}">${isOpen ? "▴ Masquer les détails" : "▾ Afficher les détails"}</button>${isOpen ? erhCard(ev, acc) : ""}</div></div>`; }).join("");
  const nE = new Set(L.map(x => x.eid)).size;
  return `<div class="erh"><div class="erh-top"><div class="seg erh-sc"><button class="${f.scope === "cpt" ? "on" : ""}" data-act="erhScope" data-v="cpt">Ce compte</button><button class="${f.scope === "all" ? "on" : ""}" data-act="erhScope" data-v="all">Toute la balance</button></div>
    <button class="btn sm ghost" data-act="erhXls" title="Exporter l'historique filtré (Excel)">⇩ Excel</button></div>
    <div class="erh-f"><input class="in" id="erhQ" data-ch="erhF" data-f="q" value="${esc(f.q)}" placeholder="Pièce, libellé, compte, auteur…"><select class="in" data-ch="erhF" data-f="u"><option value="">Tous les auteurs</option>${users.map(u => `<option ${f.u === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select></div>
    <div class="erh-chips">${Object.entries(ERH_GRP).map(([k, [l]]) => `<button class="${f.g === k ? "on" : ""}" data-act="erhG" data-v="${k}">${l}</button>`).join("")}</div>
    <div class="erh-sum">${tot} événement(s) · ${nE} écriture(s) · ${users.length} auteur(s)${f.scope === "cpt" ? ` · compte <b class="mono">${esc(sel.num)}</b>` : ""} <button class="lnk small" data-act="erhAll">${allOpen ? "Tout replier" : "Tout déplier"}</button></div>
    <div class="erh-tl">${items || `<div class="br-empty">Aucun événement${f.g !== "tout" || f.u || f.q ? " pour ces filtres" : ""}.</div>`}</div>
    ${tot > f.n ? `<button class="btn sm" style="align-self:center;margin-top:6px" data-act="erhMore">Afficher ${Math.min(40, tot - f.n)} de plus (${tot - f.n} restants)</button>` : ""}</div>`;
}

/* onglet dans le panneau de révision de la balance */
(function () {
  const _v = VIEWS.balrev; if (typeof _v !== "function") return;
  VIEWS.balrev = function () {
    let h = _v.apply(this, arguments); const st = brState();
    h = h.replace(/(<button class="[^"]*" data-act="brTab" data-v="cpt">Compte<\/button>)/, (m) => m + `<button class="${st.tab === "hist" ? "on" : ""}" data-act="brTab" data-v="hist" title="Qui a créé, modifié, réimputé, lettré ou supprimé les écritures, et quand">🕘 Historique</button>`);
    if (st.tab === "hist" && h.indexOf('<div class="br-tb"></div>') >= 0) { const sel = UI._brSel; if (sel) h = h.replace('<div class="br-tb"></div>', `<div class="br-tb">${erhPanel(sel)}</div>`); }
    return h;
  };
  /* le compte sélectionné : lu dans l'en-tête du panneau */
  const _vb = VIEWS.balrev; VIEWS.balrev = function () { const st = brState(); UI._brSel = null; if (st.sel && st.tab === "hist") { try { const r = brRows(st).rows.find(x => x.k === st.sel); UI._brSel = r ? { num: r.num, k: r.k } : { num: String(st.sel), k: st.sel }; } catch (x) { UI._brSel = { num: String(st.sel), k: st.sel }; } } return _vb.apply(this, arguments); };
})();
function erhXls() { const st = brState(); const f = st.erhf || {}; const sel = UI._brSel || {}; let L = erhEvents(f.scope === "cpt" ? sel.num : ""); const G = ERH_GRP[f.g] && ERH_GRP[f.g][1]; if (G) L = L.filter(x => G.includes(x.k)); if (f.u) L = L.filter(x => x.by === f.u);
  const rows = [{ style: "h", cells: ["Date", "Heure", "Auteur", "Action", "Journal", "Pièce", "Date écriture", "Libellé", "Comptes", "Débit", "Crédit", "Détail"] }];
  L.forEach(ev => { const d = new Date(ev.at); const D = ev.st.L.reduce((a, x) => a + (+x[3] || 0), 0), C = ev.st.L.reduce((a, x) => a + (+x[4] || 0), 0);
    rows.push({ cells: [ev.noTime ? "" : d.toLocaleDateString("fr-FR"), ev.noTime ? "" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), ev.by || "", (ERH_LIB[ev.k] || "").replace(/^a /, ""), ev.st.j, ev.st.p, frDate(ev.st.d), ev.st.l, [...new Set(ev.st.L.map(x => x[0]))].join(", "), D / 100, C / 100, erhChanges(ev).replace(/<[^>]+>/g, "")] }); });
  deliverFile("historique_ecritures_" + (f.scope === "cpt" && sel.num ? sel.num + "_" : "") + todayISO().replace(/-/g, "") + ".xlsx", buildXLSX([{ name: "Historique", rows }]), "xlsx"); }
Object.assign(ACT, {
  erhT: el => { const s = UI._ehOpen ||= new Set(); const k = el.dataset.k; s.has(k) ? s.delete(k) : s.add(k); render(); },
  erhAll: () => { const c = S.erhCfg ||= {}; c.open = erhCfg().open === "1" ? "0" : "1"; UI._ehOpen = new Set(); Store.touch(); render(); },
  erhScope: el => { brState().erhf.scope = el.dataset.v; brState().erhf.n = 40; render(); },
  erhG: el => { brState().erhf.g = el.dataset.v; brState().erhf.n = 40; render(); },
  erhMore: () => { brState().erhf.n += 40; render(); },
  erhXls: () => { try { erhXls(); } catch (e) { toast("Export impossible : " + (e.message || e)); } },
  erhRest: el => { const rec = (S.ecrDel || []).find(x => x.id === el.dataset.id); if (!rec) return; confirmBox("Restaurer les écritures", `Les ${rec.n || rec.ecr.length} écriture(s) de « ${esc(rec.label || "suppression")} » du ${new Date(rec.at).toLocaleString("fr-FR")} reviennent dans la comptabilité (journaux, grand livre, balance).`, "Restaurer", () => { const n = ecrRestore(rec.id) || 0; toast(n + " écriture(s) restaurée(s) ✓"); render(); }); }
});
Object.assign(CHG, {
  erhF: el => { const f = brState().erhf; f[el.dataset.f] = el.value; f.n = 40; render(); },
  erhCfg: el => { (S.erhCfg ||= {})[el.dataset.f] = el.value; Store.touch(); toast("Réglage enregistré"); render(); }
});
/* Paramètres : réglages Oui/Non */
(function () {
  const _p = VIEWS.params; if (typeof _p !== "function") return;
  VIEWS.params = function () { const h = _p.apply(this, arguments); if (!S) return h; const c = erhCfg();
    const yn = (f, l, help) => `<label class="f">${l}<select class="in" data-ch="erhCfg" data-f="${f}"><option value="1" ${c[f] === "1" ? "selected" : ""}>Oui</option><option value="0" ${c[f] !== "1" ? "selected" : ""}>Non</option></select>${help ? `<small class="muted">${help}</small>` : ""}</label>`;
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>🕘 Historique des écritures</h2></div><div class="panel-b"><div class="grid g2">${yn("on", "Mémoriser chaque modification d'écriture", "Auteur, date, heure et état avant modification : réimputation, montants, libellés, validation, lettrage, rapprochement. Consultable dans Balance de révision › Historique.")}${yn("open", "Afficher les détails dépliés par défaut")}</div></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
})();
(function () { const st = document.createElement("style"); st.textContent = `
.erh{display:flex;flex-direction:column;gap:8px}
.erh-top{display:flex;justify-content:space-between;align-items:center;gap:6px}.erh-sc button{font-size:12px;padding:4px 10px}
.erh-f{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px}.erh-f .in{font-size:12.5px;padding:5px 8px}
.erh-chips{display:flex;flex-wrap:wrap;gap:4px}.erh-chips button{border:1px solid #DCE3EF;background:#fff;border-radius:999px;padding:2px 9px;font:inherit;font-size:11.5px;cursor:pointer;color:#33405C}.erh-chips button.on{background:#1B2A52;color:#fff;border-color:#1B2A52}
.erh-sum{font-size:11.5px;color:#6B7690;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.erh-sum .lnk{margin-left:auto}
.erh-tl{position:relative;padding-left:4px}.erh-tl::before{content:"";position:absolute;left:16px;top:6px;bottom:6px;width:2px;background:#E4E8F0;border-radius:2px}
.erh-day{position:relative;margin:10px 0 4px 34px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#8590A8}
.erh-it{position:relative;display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;padding:6px 0}
.erh-av{position:relative;z-index:1;width:28px;height:28px;border-radius:50%;color:#fff;font-size:10.5px;font-weight:800;display:grid;place-items:center;box-shadow:0 0 0 3px #fff}
.erh-dot{position:absolute;left:20px;top:26px;width:9px;height:9px;border-radius:50%;box-shadow:0 0 0 2px #fff;z-index:2}
.erh-h{font-size:13px;line-height:1.35}.erh-h b{font-weight:800;color:#14202B}
.erh-m{display:flex;flex-wrap:wrap;gap:4px 8px;font-size:11.5px;color:#8590A8;margin-top:2px;align-items:center}
.erh-pc{background:#F1F4FA;border-radius:5px;padding:0 5px;color:#33405C}.erh-chg{color:#6B5300;background:#FFF6DA;border-radius:5px;padding:0 6px}.erh-chg b{color:#3B2F00}
.erh-tg{border:0;background:none;color:#13585A;font:inherit;font-size:12px;font-weight:700;cursor:pointer;padding:3px 0;margin-top:2px}
.erh-card{border:1px solid #DCE3EF;border-radius:10px;background:#fff;overflow:hidden;margin-top:4px;font-size:12px;box-shadow:0 2px 8px rgba(15,27,51,.05)}
.erh-ch{display:flex;gap:8px;align-items:center;padding:6px 9px;border-bottom:1px solid #EEF1F6;flex-wrap:wrap}.erh-j{background:#F1F4FA;border-radius:6px;padding:1px 7px;font-weight:700;color:#4B5876}.erh-st{margin-left:auto;background:#EEF1F6;border-radius:999px;padding:1px 8px;font-size:11px;color:#4B5876}
.erh-lib{padding:6px 9px;background:#F7F9FC;border-bottom:1px solid #EEF1F6;font-weight:600}
.erh-t{width:100%;border-collapse:collapse}.erh-t td{padding:5px 9px;border-bottom:1px solid #F1F3F8;vertical-align:top}.erh-t tfoot td{font-weight:700;background:#F7F9FC;border-bottom:0}
.erh-t .r{text-align:right;white-space:nowrap}.erh-t .c{text-align:center;white-space:nowrap}.erh-me td{background:#FFFBEA}
.erh-new{color:#0F6E5C;font-weight:700}.erh-card s{display:block;color:#C2364B;opacity:.8;font-weight:400;font-size:11px}.erh-lib s{display:inline;margin-left:8px}.erh-ch s{display:inline}
.erh-let{display:inline-block;background:#DDF3E6;color:#145C3A;border-radius:6px;padding:0 6px;font-weight:700;font-size:11px}
.erh-del td{opacity:.6}
.erh-acts{display:flex;gap:8px;align-items:center;padding:6px 9px;flex-wrap:wrap}`; document.head.appendChild(st); })();
