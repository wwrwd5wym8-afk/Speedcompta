/* ============================================================
   Assistant IA conversationnel : questions sur le dossier ouvert,
   lecture des chiffres par outils, propositions d'écritures en brouillard
   (bouton flottant présent dans tous les modules)
   ============================================================ */
const AI = { open: false, turns: [], msgs: [], busy: false, ctl: null, props: {} };
const aiE = n => (Number(n) || 0) / 100;
const aiRound = v => Math.round(v * 100) / 100;
function aiOK() { return !!(S && !UI._welcome && (typeof aboOK !== "function" || aboOK("ia")) && (typeof eqRight !== "function" || eqRight("ia") !== "none")); }
function aiContext() {
  const ex = exCur(); const v = UI.view; let sel = "";
  if (v === "balrev") { const st = UI.sub.br || {}; if (st.sel) sel = "Compte sélectionné dans la balance : " + st.sel + " " + accLib(st.sel); }
  return `Dossier ouvert : ${S.nom} (${S.forme || ""}${S.siren ? ", SIREN " + S.siren : ""}), activité ${S.activite || ""}, régime de TVA ${S.regimeTVA || ""}. Exercice ${ex.id} du ${ex.debut} au ${ex.fin}${ex.cloture ? " (clôturé)" : ""}. Date du jour ${todayISO()}. Écran actuel : ${v}. ${sel}`;
}
const AI_RULES = () => `Tu es l'assistant comptable intégré au logiciel ${CONFIG.branding.nom || "SpeedCompta"}, expert-comptable français (PCG, CGI, Code de commerce). Réponds en français, de façon concise et concrète, avec des montants en euros. Utilise TOUJOURS les outils pour lire les chiffres du dossier au lieu de les supposer, et cite les comptes concernés. Quand une écriture est utile (régularisation, reclassement, cession, provision, IS…), appelle l'outil proposer_ecriture : elle sera proposée à l'utilisateur qui décidera de la créer en brouillard ; ne dis jamais qu'elle est déjà comptabilisée. Signale les points de vigilance fiscaux. Si une information manque, dis-le. Mise en forme : phrases courtes, listes avec « - », gras avec **texte**.\n\n` + aiContext();
function aiTools() {
  const ex = exCur();
  return [
    { name: "indicateurs", description: "Chiffres clés de l'exercice en cours : chiffre d'affaires, résultat, trésorerie, total du bilan, capitaux propres, TVA, écritures en brouillard, factures en retard.", inputSchema: { type: "object", properties: {} },
      execute: () => { const cr = compteResultat(ex.debut, ex.fin); const b = bilan(ex); const m = soldeMap(ex.debut, ex.fin); const cp = -sumPref(m, ["10", "11", "12", "13", "14"]) + cr.RN; return { exercice: ex.id, du: ex.debut, au: ex.fin, chiffre_affaires: aiE(cr.CA), produits: aiE(cr.PE), charges: aiE(cr.CE), resultat_net: aiE(cr.RN), tresorerie: aiE(sumPref(m, ["512", "514", "53"]) - sumPref(m, ["519"]) * 0), total_bilan: aiE(b.totA), capitaux_propres: aiE(cp), capital: aiE(S.capital || 0), ecritures_brouillard: E.filter(e => e.statut !== "valide").length, factures_vente_en_retard: invoices("V").filter(i => i.st === "late").length }; } },
    { name: "balance", description: "Balance des comptes de l'exercice (solde = débit - crédit, en euros). Filtre optionnel par début de numéro de compte (ex. '6', '41', '512').", inputSchema: { type: "object", properties: { prefixe: { type: "string" } } },
      execute: ({ prefixe } = {}) => { const m = soldeMap(ex.debut, ex.fin); const out = Object.entries(m).filter(([k, v]) => v && (!prefixe || k.startsWith(prefixe))).sort().slice(0, 120).map(([k, v]) => ({ compte: k, libelle: accLib(k), solde: aiE(v) })); return { nb: out.length, comptes: out }; } },
    { name: "ecritures_compte", description: "Lignes d'écritures d'un compte (ou de tous les comptes commençant par ce numéro) sur l'exercice, les plus récentes d'abord.", inputSchema: { type: "object", properties: { compte: { type: "string" }, limite: { type: "number" } }, required: ["compte"] },
      execute: ({ compte, limite } = {}) => { const L = flat({ from: ex.debut, to: ex.fin }).filter(({ l }) => l.compte.startsWith(String(compte || "")) || l.aux === compte).sort((a, b) => b.e.date.localeCompare(a.e.date)).slice(0, Math.min(80, limite || 40)); return L.map(({ e, l }) => ({ date: e.date, journal: e.journal, piece: e.piece || "", libelle: l.lib || e.libelle || "", compte: l.compte, tiers: l.aux || "", debit: aiE(l.debit), credit: aiE(l.credit), lettre: l.lettre || "", statut: e.statut || "" })); } },
    { name: "analyse_anomalies", description: "Résultat de l'analyse automatique de la balance : anomalies, points à vérifier, éléments manquants, par compte, et points généraux.", inputSchema: { type: "object", properties: {} },
      execute: () => { try { const st = Object.assign({}, brState(), { type: "gen", sel: "", f: {}, chk: [] }); const o = brRows(st); const rows = o.rows.filter(r => r.ia && r.ia.lvl !== "ok").slice(0, 50).map(r => ({ compte: r.k, libelle: r.lib, solde: aiE(r.sN), niveau: r.ia.lvl, points: r.ia.items.filter(x => x.lvl !== "ok").map(x => x.t) })); return { comptes: rows, generaux: iaGlobal(o.iaCtx, o.rows).map(x => x.lvl + " : " + x.t) }; } catch (e) { return { erreur: String(e.message || e) }; } } },
    { name: "tva_periode", description: "TVA collectée, déductible et nette d'une période (dates AAAA-MM-JJ).", inputSchema: { type: "object", properties: { du: { type: "string" }, au: { type: "string" } }, required: ["du", "au"] },
      execute: ({ du, au }) => { try { const t = calcTVA(du, au); return { collectee: aiE(t.coll != null ? t.coll : t.collectee), deductible: aiE(t.ded != null ? t.ded : t.deductible), nette_a_payer: aiE(t.net), detail: Object.fromEntries(Object.entries(t).filter(([k, v]) => typeof v === "number").map(([k, v]) => [k, aiE(v)])) }; } catch (e) { return { erreur: String(e.message || e) }; } } },
    { name: "impot_societes", description: "Calcul de l'impôt sur les sociétés de l'exercice tel que préparé dans la liasse : résultat fiscal, réintégrations, déductions, IS, acomptes.", inputSchema: { type: "object", properties: {} },
      execute: () => { try { const r = calcIS(ex); return { resultat_comptable: aiE(r.resAvIS), reintegrations: aiE(r.totR), deductions: aiE(r.totD), resultat_fiscal: aiE(r.rf), is_taux_reduit: aiE(r.isReduit), is_taux_normal: aiE(r.isNormal), is_total: aiE(r.is), contribution_sociale: aiE(r.cs), acomptes_verses: aiE(r.acomptes), solde: aiE(r.solde) }; } catch (e) { return { erreur: String(e.message || e) }; } } },
    { name: "tiers", description: "Recherche de clients ou fournisseurs (code, nom, compte collectif, solde).", inputSchema: { type: "object", properties: { texte: { type: "string" } } },
      execute: ({ texte } = {}) => { const q = String(texte || "").toLowerCase(); const sold = {}; flat({ from: ex.debut, to: ex.fin }).forEach(({ l }) => { if (l.aux) sold[l.aux] = (sold[l.aux] || 0) + l.debit - l.credit; }); return (S.tiers || []).filter(t => !q || (t.nom + " " + t.code).toLowerCase().includes(q)).slice(0, 30).map(t => ({ code: t.code, nom: t.nom, type: t.type === "C" ? "client" : "fournisseur", collectif: t.collectif, solde: aiE(sold[t.code] || 0) })); } },
    { name: "proposer_ecriture", description: "Propose une écriture comptable équilibrée à l'utilisateur (elle ne sera créée en brouillard que s'il clique sur « Créer »). Montants en euros. Utiliser des comptes du PCG à 6 chiffres ; pour un client ou fournisseur, mettre son code dans 'tiers' avec le compte collectif.", inputSchema: { type: "object", properties: { journal: { type: "string", description: "OD, AC, VT, BQ…" }, date: { type: "string" }, libelle: { type: "string" }, motif: { type: "string" }, lignes: { type: "array", items: { type: "object", properties: { compte: { type: "string" }, tiers: { type: "string" }, libelle: { type: "string" }, debit: { type: "number" }, credit: { type: "number" } }, required: ["compte"] } } }, required: ["libelle", "lignes"] },
      execute: p => { const L = (p.lignes || []).map(l => ({ compte: String(l.compte || "").replace(/\D/g, "").padEnd(6, "0").slice(0, 8), tiers: l.tiers || "", lib: l.libelle || p.libelle, d: Math.round((Number(l.debit) || 0) * 100), c: Math.round((Number(l.credit) || 0) * 100) })).filter(l => l.compte && (l.d || l.c));
        const D = L.reduce((a, l) => a + l.d, 0), C = L.reduce((a, l) => a + l.c, 0); if (!L.length) throw new Error("aucune ligne valide"); if (D !== C) throw new Error("écriture déséquilibrée : débit " + aiE(D) + " ≠ crédit " + aiE(C));
        const jr = S.journaux.some(j => j.code === p.journal) ? p.journal : jByType("OD", "OD"); let date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || "") ? p.date : ex.fin; if (date < ex.debut || date > ex.fin) date = ex.fin;
        const id = uid(); AI.props[id] = { id, journal: jr, date, libelle: p.libelle, motif: p.motif || "", lignes: L, st: "prop" }; AI.pendProps.push(id); return { ok: true, id, message: "Écriture proposée à l'utilisateur, en attente de sa validation." }; } }
  ];
}
function aiMd(t) { let h = esc(String(t || "")); h = h.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>"); const lines = h.split("\n"); let out = "", inL = false; for (const l of lines) { const m = l.match(/^\s*[-•]\s+(.*)$/); if (m) { if (!inL) { out += "<ul>"; inL = true; } out += "<li>" + m[1] + "</li>"; } else { if (inL) { out += "</ul>"; inL = false; } out += l.trim() ? "<p>" + l + "</p>" : ""; } } if (inL) out += "</ul>"; return out; }
function aiPropHTML(p) { const D = p.lignes.reduce((a, l) => a + l.d, 0);
  return `<div class="ai-prop ${p.st}"><div class="ai-prop-h"><b>📝 Écriture proposée</b><span class="small muted">${esc(p.journal)} · ${frDate(p.date)}</span></div><div class="small" style="margin:2px 0 6px">${esc(p.libelle)}${p.motif ? " — " + esc(p.motif) : ""}</div>
    <table class="ai-pt"><tbody>${p.lignes.map(l => `<tr><td class="mono">${esc(l.compte)}${l.tiers ? " · " + esc(l.tiers) : ""}</td><td>${esc(accLib(l.compte) || l.lib)}</td><td class="r mono">${l.d ? eur(l.d) : ""}</td><td class="r mono">${l.c ? eur(l.c) : ""}</td></tr>`).join("")}<tr class="tot"><td colspan="2">Total</td><td class="r mono">${eur(D)}</td><td class="r mono">${eur(D)}</td></tr></tbody></table>
    ${p.st === "prop" ? `<div class="ai-prop-a"><button class="btn sm pri" data-ai="mk" data-id="${p.id}">Créer en brouillard</button><button class="btn sm ghost" data-ai="no" data-id="${p.id}">Ignorer</button></div>` : p.st === "ok" ? `<div class="small" style="color:var(--ok);margin-top:6px">✓ Créée en brouillard dans le journal ${esc(p.journal)}${p.eid ? ` · <a href="#" class="lnk" data-ai="see" data-id="${p.eid}">voir l'écriture</a>` : ""}</div>` : `<div class="small muted" style="margin-top:6px">Proposition ignorée.</div>`}</div>`; }
function aiSugg() { const v = UI.view; const s = ["Fais-moi un point sur la santé financière du dossier", "Quelles anomalies dois-je corriger avant la clôture ?", "Pourquoi mon résultat évolue-t-il ainsi ?", "Prépare les écritures de clôture qui manquent"];
  if (v === "balrev" && (UI.sub.br || {}).sel) s.unshift("Analyse le compte " + UI.sub.br.sel + " et dis-moi s'il est justifié");
  if (/tva/.test(v)) s.unshift("Vérifie la cohérence de ma TVA sur la dernière période"); if (v === "is" || v === "cvae") s.unshift("Explique-moi le calcul de mon IS et les optimisations possibles"); return s.slice(0, 4); }
function aiRender() {
  let root = document.getElementById("aiRoot"); if (!aiOK()) { if (root) root.remove(); return; }
  if (!root) { root = document.createElement("div"); root.id = "aiRoot"; document.body.appendChild(root); }
  if (!AI.open) { root.innerHTML = `<button class="ai-fab" data-ai="open" title="Assistant IA : posez une question sur ce dossier">✨ <span>Assistant</span></button>`; return; }
  const act = document.activeElement && document.activeElement.id === "aiIn" ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  const keepIn = (root.querySelector("#aiIn") || {}).value || AI.draft || ""; const scroller = root.querySelector(".ai-body"); const atEnd = !scroller || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 40;
  root.innerHTML = `<section class="ai-panel" role="dialog" aria-label="Assistant IA"><header class="ai-h"><div><b>✨ Assistant comptable</b><span>${esc(S.nom)} · exercice ${esc(exCur().id.replace("EX", ""))}</span></div><div class="row" style="gap:4px">${AI.msgs.length ? `<button class="btn sm ghost" data-ai="new" title="Nouvelle conversation">↺</button>` : ""}<button class="btn sm ghost" data-ai="close" title="Fermer">✕</button></div></header>
    <div class="ai-body">${AI.msgs.length ? AI.msgs.map(m => m.role === "user" ? `<div class="ai-m u">${esc(m.text)}</div>` : `<div class="ai-m a">${m.err ? `<span class="ai-err">${esc(m.err)}</span>` : m.text ? aiMd(m.text) : `<span class="ai-dots"><i></i><i></i><i></i></span> <span class="small muted">${esc(m.step || "Analyse du dossier…")}</span>`}${(m.props || []).map(id => AI.props[id] ? aiPropHTML(AI.props[id]) : "").join("")}</div>`).join("")
      : `<div class="ai-hello"><b>Bonjour${UI.userName ? " " + esc(UI.userName.split(" ")[0]) : ""} 👋</b><p>Je lis les chiffres de <b>${esc(S.nom)}</b> pour répondre à vos questions, repérer les anomalies et préparer des écritures que vous validez.</p></div>`}
      ${!AI.busy ? `<div class="ai-sug">${aiSugg().map(s => `<button data-ai="sug">${esc(s)}</button>`).join("")}</div>` : ""}</div>
    <footer class="ai-f"><textarea id="aiIn" rows="2" placeholder="Posez votre question… (Entrée pour envoyer)" ${AI.busy ? "disabled" : ""}>${esc(keepIn)}</textarea>${AI.busy ? `<button class="btn sm" data-ai="stop">Arrêter</button>` : `<button class="btn sm pri" data-ai="send">Envoyer</button>`}</footer>
    <div class="ai-legal">Réponses générées par l'IA à partir des données du dossier : vérifiez-les avant toute décision.</div></section>`;
  const b = root.querySelector(".ai-body"); if (b && atEnd) b.scrollTop = b.scrollHeight;
  if (act) { const i = root.querySelector("#aiIn"); if (i && !i.disabled) { i.focus(); try { i.setSelectionRange(act[0], act[1]); } catch (e) { } } }
}
async function aiAsk(q) {
  q = String(q || "").trim(); if (!q || AI.busy) return; let sample = null; try { sample = window.claude && claude.use ? await claude.use("sample") : null; } catch (e) { }
  AI.msgs.push({ role: "user", text: q }); const am = { role: "assistant", text: "", props: [] }; AI.msgs.push(am); AI.busy = true; AI.draft = ""; aiRender();
  if (!sample) { am.err = "L'assistant n'est disponible que dans le logiciel en ligne."; AI.busy = false; aiRender(); return; }
  AI.turns.push({ role: "user", content: q }); AI.ctl = new AbortController(); AI.pendProps = [];
  const tools = aiTools().map(t => Object.assign({}, t, { execute: async inp => { am.step = { indicateurs: "Lecture des indicateurs…", balance: "Lecture de la balance…", ecritures_compte: "Lecture des écritures…", analyse_anomalies: "Analyse des anomalies…", tva_periode: "Calcul de la TVA…", impot_societes: "Lecture du calcul de l'IS…", tiers: "Recherche des tiers…", proposer_ecriture: "Préparation de l'écriture…" }[t.name] || "…"; aiRender(); const r = await t.execute(inp || {}); am.props = AI.pendProps.slice(); return r; } }));
  try { const { text } = await sample([{ role: "user", content: AI_RULES() }, { role: "assistant", content: "Compris. Je lis le dossier avec les outils avant de répondre." }, ...AI.turns.slice(-12)], { cache: false, signal: AI.ctl.signal, tools, modelTier: "default", onText: ({ text }) => { am.text = text; aiRender(); } });
    am.text = text; am.props = AI.pendProps.slice(); AI.turns.push({ role: "assistant", content: text + (am.props.length ? "\n[J'ai proposé " + am.props.length + " écriture(s) à l'utilisateur.]" : "") });
  } catch (e) { am.err = e && e.code === "cancelled" ? "Réponse interrompue." : e && e.code === "rate_limited" ? "Trop de demandes en peu de temps : réessayez dans une minute." : e && e.code === "not_granted" ? "L'accès à l'IA n'a pas été autorisé pour cette page." : "Réponse impossible : " + ((e && (e.message || e.code)) || e); if (e && e.text) am.text = e.text; AI.turns.pop(); }
  AI.busy = false; AI.ctl = null; aiRender();
}
function aiCreate(id) { const p = AI.props[id]; if (!p || p.st !== "prop") return; const w = canWriteAt(p.date); if (w) { toast(w); return; }
  const e = addEcr(mkEcr({ journal: p.journal, date: p.date, piece: "IA" + todayISO().slice(2, 10).replace(/-/g, ""), libelle: p.libelle, lignes: p.lignes.map(l => [l.compte, l.tiers || "", l.lib || p.libelle, l.d, l.c]) })); e.origine = "assistant IA"; saveEcr(e); p.st = "ok"; p.eid = e.id; toast("Écriture créée en brouillard ✓"); render(); aiRender(); }
document.addEventListener("click", ev => { const b = ev.target.closest && ev.target.closest("[data-ai]"); if (!b) return; ev.preventDefault(); const k = b.dataset.ai;
  if (k === "open") { AI.open = true; aiRender(); setTimeout(() => { const i = document.getElementById("aiIn"); if (i) i.focus(); }, 30); }
  else if (k === "close") { AI.open = false; aiRender(); }
  else if (k === "new") { AI.turns = []; AI.msgs = []; AI.props = {}; aiRender(); }
  else if (k === "send") { const i = document.getElementById("aiIn"); aiAsk(i && i.value); }
  else if (k === "sug") aiAsk(b.textContent);
  else if (k === "stop") { if (AI.ctl) AI.ctl.abort(); }
  else if (k === "mk") aiCreate(b.dataset.id);
  else if (k === "no") { const p = AI.props[b.dataset.id]; if (p) { p.st = "no"; aiRender(); } }
  else if (k === "see") { const e = E.find(x => x.id === b.dataset.id); if (e) { UI.sub.consult = Object.assign({}, UI.sub.consult || {}, { tab: "jrn" }); go("consult"); } }
}, true);
document.addEventListener("keydown", ev => { if (ev.target && ev.target.id === "aiIn" && ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); ev.stopPropagation(); aiAsk(ev.target.value); } }, true);
document.addEventListener("input", ev => { if (ev.target && ev.target.id === "aiIn") { AI.draft = ev.target.value; ev.stopPropagation(); } }, true);
/* nouvelle conversation au changement de dossier ; affichage après chaque rendu */
let _aiSid = null;
const _renderAI = render;
render = function () { const r = _renderAI.apply(this, arguments); try { if (S && _aiSid !== S.id) { _aiSid = S.id; AI.turns = []; AI.msgs = []; AI.props = {}; } aiRender(); } catch (e) { } return r; };
