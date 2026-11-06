/* ============================================================
   Interface — TVA, IS, comptes annuels, clôture, FEC, plan, paramètres
   ============================================================ */
const cl = (code, lib, a, b, cls = "") => `<div class="cl ${cls}"><div class="code">${code}</div><div>${lib}</div><div class="r">${a ?? ""}</div><div class="r">${b ?? ""}</div></div>`;

VIEWS.tva = () => {
  const ex = exCur(); const pers = periodesTVA(ex);
  const st = UI.sub.tva ||= {};
  if (!st.p || !pers.find(p => p.id === st.p)) { const cur = pers.filter(p => p.to < todayISO()).pop() || pers[0]; st.p = cur.id; }
  const p = pers.find(x => x.id === st.p); const t = calcTVA(p.from, p.to); const dec = S.tvaDecl.find(x => x.id === p.id);
  const decE = dec && E.find(e => e.id === dec.ecr);
  const regLib = { RN_M: "Réel normal — CA3 mensuelle", RN_T: "Réel normal — CA3 trimestrielle", RSI: "Réel simplifié — CA12 annuelle" }[S.regimeTVA];
  const list = pers.map(x => { const tt = calcTVA(x.from, x.to); const dd = S.tvaDecl.find(d => d.id === x.id); return `<tr class="${x.id === st.p ? "sel" : ""}" style="cursor:pointer" data-act="tvaP" data-v="${x.id}"><td>${esc(x.lib.replace(/^CA\d+ — /, ""))}</td><td class="r mono">${eur(tt.net)}</td><td>${dd ? (dd.paye || dd.net <= 0 ? '<span class="pill ok">Soldée</span>' : '<span class="pill warn">À payer</span>') : x.to < todayISO() ? '<span class="pill bad">À déclarer</span>' : '<span class="pill n">En cours</span>'}</td></tr>`; }).join("");
  const isCA12 = p.type === "CA12";
  const acomptesN1 = isCA12 ? Math.max(0, t.net + t.dImmo) : 0;
  const form = `<div class="cerfa">
    <div class="ch">A · Montant des opérations réalisées (base hors taxe)</div>
    ${cl("01", "Ventes, prestations de services", "", eur(Object.values(t.coll).reduce((a, c) => a + c.base, 0)))}
    ${t.autoliq ? cl("03", "Acquisitions intracommunautaires", "", eur(t.baseAutoliq)) : ""}
    <div class="ch">B · Décompte de la TVA à payer</div>
    <div class="cl hl"><div></div><div>TVA brute — opérations réalisées en France métropolitaine</div><div class="r">Base HT</div><div class="r">Taxe due</div></div>
    ${cl("08", "Taux normal 20 %", eur(t.coll[2000].base), eur(t.coll[2000].tva))}
    ${cl("9B", "Taux réduit 10 %", eur(t.coll[1000].base), eur(t.coll[1000].tva))}
    ${cl("09", "Taux réduit 5,5 %", eur(t.coll[550].base), eur(t.coll[550].tva))}
    ${t.coll[210].tva ? cl("T2", "Taux particulier 2,1 %", eur(t.coll[210].base), eur(t.coll[210].tva)) : ""}
    ${t.autoliq ? cl("17", "dont TVA sur acquisitions intracommunautaires", "", eur(t.autoliq)) : ""}
    ${cl("16", "Total de la TVA brute due", "", eur(t.brute), "hl")}
    <div class="cl hl"><div></div><div>TVA déductible</div><div></div><div></div></div>
    ${cl("19", "Biens constituant des immobilisations", "", eur(t.dImmo))}
    ${cl("20", "Autres biens et services", "", eur(t.dABS))}
    ${cl("22", "Report du crédit de la déclaration précédente", "", eur(t.credAnt))}
    ${cl("23", "Total TVA déductible", "", eur(t.ded), "hl")}
    ${isCA12 ? cl("—", "Acomptes versés au titre de l'exercice", "", eur(t.acomptes)) : ""}
    ${t.net < 0 ? cl("25", "Crédit de TVA (ligne 23 − ligne 16)", "", eur(t.credit), "big") : cl("28", "TVA nette due (ligne 16 − ligne 23)", "", eur(t.net), "big")}
    ${t.net >= 0 ? cl("32", "Total à payer", "", eur(isCA12 ? t.net - t.acomptes : t.net), "big") : cl("27", "Crédit à reporter", "", eur(t.credit), "big")}
  </div>`;
  return topbar("Fiscalité · " + regLib, "Déclarations de TVA", exSelect()) +
    `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,2fr)" id="tvaGrid">
      <div class="panel"><div class="panel-h"><h2>Périodes</h2></div><div class="tw"><table class="t"><thead><tr><th>Période</th><th class="r">Net</th><th>État</th></tr></thead><tbody>${list}</tbody></table></div></div>
      <div class="stack"><div class="panel"><div class="panel-h"><div><h2>${esc(p.lib)}</h2><div class="small muted">Du ${frDate(p.from)} au ${frDate(p.to)} · échéance indicative ${frDate(echeanceTVA(p))}</div></div>
        <div class="row">${decE ? statutPill(decE) + ` <button class="btn sm" data-act="viewEcr" data-id="${decE.id}">Écriture</button>` : ""}
        ${decE && decE.statut === "valide" ? "" : `<button class="btn pri" data-act="tvaLiq">${decE ? "Recalculer la liquidation" : "Générer l'écriture de liquidation"}</button>`}
        ${dec && dec.net > 0 && !dec.paye ? `<button class="btn go" data-act="tvaPay">Enregistrer le paiement</button>` : ""}</div></div>
      <div class="panel-b">${form}
      <p class="small muted" style="margin-top:10px">Chiffre d'affaires HT comptabilisé sur la période (comptes 70) : <b class="mono">${eur(t.ca)} €</b>. La base taxable est recalculée à partir de la TVA collectée par taux ; un écart avec le CA signale des opérations exonérées ou un taux mal affecté. Option pour la TVA sur les débits supposée.</p>
      ${isCA12 ? `<div class="banner" style="margin-top:10px">Acomptes de l'exercice suivant (base ${eur(acomptesN1)} €) : juillet 55 % = <b>${eur(Math.round(acomptesN1 * .55))} €</b>, décembre 40 % = <b>${eur(Math.round(acomptesN1 * .4))} €</b>${acomptesN1 < 100000 ? " — dispense : base inférieure à 1 000 €" : ""}.</div>` : ""}
      </div></div>
      <div class="panel panel-b small"><b>Télédéclaration.</b> Reportez ces montants sur le formulaire ${isCA12 ? "3517-S-SD (CA12)" : "3310-CA3-SD"} de votre espace professionnel impots.gouv.fr ou via votre partenaire EDI. Les numéros de lignes sont donnés comme repères : vérifiez-les sur le millésime en vigueur.</div></div>
    </div><style>@media (max-width:1000px){#tvaGrid{grid-template-columns:minmax(0,1fr)!important}}</style>`;
};

VIEWS.is = () => {
  const ex = exCur(); const r = calcIS(ex); const P = r.P;
  const isE = E.find(e => e.tag === "IS" && e.date >= ex.debut && e.date <= ex.fin);
  const rowsEdit = (arr, k) => arr.map((x, i) => `<div class="row" style="flex-wrap:nowrap"><input class="in" id="${k}-${i}-lib" value="${esc(x.lib)}" data-ch="isRow" data-k="${k}" data-i="${i}" data-f="lib" placeholder="Nature"><input class="in num" style="width:130px" id="${k}-${i}-m" value="${toIn(x.montant)}" data-ch="isRow" data-k="${k}" data-i="${i}" data-f="montant"><button class="btn ghost sm" aria-label="Supprimer" data-act="isDel" data-k="${k}" data-i="${i}">✕</button></div>`).join("");
  return topbar("Fiscalité · " + ex.id.replace("EX", "exercice "), "Impôt sur les sociétés", exSelect() + (isE && isE.statut === "valide" ? statutPill(isE) : `<button class="btn pri" data-act="isBook">${isE ? "Recomptabiliser" : "Comptabiliser"} l'IS (${eur(r.is + r.cs)} €)</button>`)) +
    `<div class="grid g2">
      <div class="panel"><div class="panel-h"><h2>Détermination du résultat fiscal</h2><span class="small muted">repères 2058-A / 2033-B</span></div><div class="panel-b stack">
        <div class="cerfa">
          ${cl("—", "Résultat net comptable (bénéfice ou perte)", "", eur(r.resAvIS), "hl")}
          ${r.reint.map(x => cl("+", esc(x.lib) + (x.auto ? ' <span class="pill n">auto</span>' : ""), "", eur(x.montant))).join("")}
          ${cl("+", "Total des réintégrations", "", eur(r.totR), "hl")}
          ${P.deduc.map(x => cl("−", esc(x.lib), "", eur(x.montant))).join("")}
          ${cl("−", "Total des déductions", "", eur(r.totD), "hl")}
          ${cl("—", "Résultat fiscal avant imputation des déficits", "", eur(r.avantDef))}
          ${cl("−", "Déficits antérieurs imputés", "", eur(r.imputDef))}
          ${cl(r.rf >= 0 ? "BÉN." : "DÉF.", r.rf >= 0 ? "Résultat fiscal imposable" : "Déficit fiscal reportable", "", eur(Math.abs(r.rf)), "big")}
        </div>
        <div><h3 style="margin-bottom:6px">Réintégrations extra-comptables</h3>${rowsEdit(P.reint, "reint")}<button class="btn sm" data-act="isAdd" data-k="reint">+ Réintégration</button><p class="small muted">Exemples : amortissements excédentaires des véhicules de tourisme, taxe annuelle sur les véhicules, quote-part de frais à caractère personnel.</p></div>
        <div><h3 style="margin-bottom:6px">Déductions extra-comptables</h3>${rowsEdit(P.deduc, "deduc")}<button class="btn sm" data-act="isAdd" data-k="deduc">+ Déduction</button></div>
        <div class="row"><label class="f">Déficits reportables à l'ouverture<input class="in num" id="isDef" value="${toIn(P.deficitAnt)}" data-ch="isP" data-f="deficitAnt"></label><label class="f">IS de l'exercice précédent (base des acomptes)<input class="in num" id="isN1" value="${toIn(P.isN1)}" data-ch="isP" data-f="isN1"></label></div>
      </div></div>
      <div class="stack">
        <div class="panel"><div class="panel-h"><h2>Liquidation de l'impôt</h2><span class="small muted">relevé de solde 2572</span></div><div class="panel-b"><div class="cerfa">
          ${cl("15 %", "Taux réduit PME, dans la limite de " + eur(r.plafondReduit) + " €", "", eur(r.isReduit))}
          ${cl("25 %", "Taux normal sur le surplus", "", eur(r.isNormal))}
          ${cl("IS", "Impôt sur les sociétés dû", "", eur(r.is), "hl")}
          ${r.cs ? cl("3,3 %", "Contribution sociale", "", eur(r.cs)) : ""}
          ${cl("−", "Acomptes versés (débits du compte 444)", "", eur(r.acomptes))}
          ${cl(r.solde >= 0 ? "SOLDE" : "EXC.", r.solde >= 0 ? "Solde à payer au " + frDate(r.soldeDate) : "Excédent à imputer ou rembourser", "", eur(Math.abs(r.solde)), "big")}
        </div>
        <div class="small" style="margin-top:10px">${r.eligible ? '<span class="pill ok">Taux réduit applicable</span>' : '<span class="pill bad">Taux réduit non applicable</span>'} CA HT ramené à 12 mois inférieur à 10 M€, capital entièrement libéré et détenu à 75 % au moins par des personnes physiques (réglage dans Paramètres). Exercice de ${r.mois} mois.</div></div></div>
        <div class="panel"><div class="panel-h"><h2>Acomptes</h2></div><div class="panel-b">
          <h3 style="margin-bottom:6px">Exercice ${ex.id.replace("EX", "")} — base IS précédent ${eur(P.isN1)} €</h3>
          ${r.acCourant ? r.acDates.map((d, i) => `<div class="deadline"><div class="dt">${d.slice(8)}<small>${MOIS[Number(d.slice(5, 7)) - 1]}</small></div><div>Acompte n°${i + 1} (relevé 2571)</div><div class="mono">${eur(r.acCourant)}</div></div>`).join("") : `<p class="muted small">Pas d'acompte : IS de référence inférieur ou égal à 3 000 €.</p>`}
          <h3 style="margin:12px 0 6px">Exercice suivant</h3><p class="small">${r.acompteN1 ? `Quatre acomptes de <b>${eur(r.acompteN1)} €</b> (25 % de l'IS ${ex.id.replace("EX", "")}).` : "Dispense d'acomptes si l'IS de cet exercice reste inférieur ou égal à 3 000 €."}</p>
        </div></div>
        <div class="panel panel-b small"><b>Déclaration de résultat.</b> Formulaire 2065-SD accompagné des tableaux ${S.regimeIS === "RS" ? "2033-A à 2033-G (régime simplifié)" : "2050 à 2059 (régime normal)"} : voir <a href="#" data-act="goEtats" data-t="2033a">Comptes annuels › Liasse</a>.</div>
      </div></div>`;
};

/* ---------------- Comptes annuels ---------------- */
VIEWS.etats = () => {
  const ex = exCur(); const st = UI.sub.etats ||= { tab: "bilan" };
  const prev = S.exercices.filter(x => x.fin < ex.debut).sort((a, b) => b.fin.localeCompare(a.fin))[0];
  const tabs = [["bilan", "Bilan"], ["cr", "Compte de résultat"], ["sig", "Soldes intermédiaires"], ["2033a", "Liasse 2033-A"], ["2033b", "Liasse 2033-B"], ["annexe", "Annexe"]];
  let body = "";
  if (st.tab === "bilan") body = bilanView(ex, prev);
  if (st.tab === "cr") body = crView(ex, prev);
  if (st.tab === "sig") body = sigView(ex, prev);
  if (st.tab === "2033a") body = l2033a(ex);
  if (st.tab === "2033b") body = l2033b(ex);
  if (st.tab === "annexe") body = annexeView(ex);
  return topbar("Comptes annuels · " + esc(S.nom), st.tab.startsWith("2033") ? "Liasse fiscale" : "États financiers", exSelect() + `<button class="btn" data-act="exportEtats">Exporter (CSV)</button>`) +
    `<div class="tabs">${tabs.map(([k, l]) => `<button class="${st.tab === k ? "on" : ""}" data-act="eTab" data-v="${k}">${l}</button>`).join("")}</div>` +
    (ex.cloture ? "" : `<div class="banner"><b>Comptes provisoires.</b> L'exercice n'est pas clôturé : les états reflètent les écritures saisies à ce jour, brouillard compris.</div>`) + body;
};
function bilanView(ex, prev) {
  const b = bilan(ex); const bp = prev ? bilan(prev) : null;
  const secA = ACTIF.map(([t, items]) => { const rows = items.filter(([k]) => b.B[k] || (bp && bp.B[k])); if (!rows.length) return ""; const s = rows.reduce((a, [k]) => ({ br: a.br + b.get(k).brut, am: a.am + b.get(k).am, n: a.n + b.get(k).val, p: a.p + (bp ? bp.get(k).val : 0) }), { br: 0, am: 0, n: 0, p: 0 }); return `<tr class="grp"><td colspan="5">${t}</td></tr>${rows.map(([k, l]) => `<tr><td class="ind1" title="${esc(b.get(k).comptes.join(", "))}">${l}</td><td class="r mono">${eur(b.get(k).brut)}</td><td class="r mono">${eurz(b.get(k).am)}</td><td class="r mono"><b>${eur(b.get(k).val)}</b></td><td class="r mono muted">${bp ? eur(bp.get(k).val) : ""}</td></tr>`).join("")}<tr class="sub"><td>Total ${t.toLowerCase()}</td><td class="r mono">${eur(s.br)}</td><td class="r mono">${eur(s.am)}</td><td class="r mono">${eur(s.n)}</td><td class="r mono">${bp ? eur(s.p) : ""}</td></tr>`; }).join("");
  const secP = PASSIF.map(([t, items]) => { const rows = items.filter(([k]) => b.B[k] || (bp && bp.B[k]) || k === "P_res"); const s = rows.reduce((a, [k]) => ({ n: a.n + b.get(k).val, p: a.p + (bp ? bp.get(k).val : 0) }), { n: 0, p: 0 }); return `<tr class="grp"><td colspan="3">${t}</td></tr>${rows.map(([k, l]) => `<tr><td class="ind1" title="${esc(b.get(k).comptes.join(", "))}">${l}</td><td class="r mono"><b>${eur(b.get(k).val)}</b></td><td class="r mono muted">${bp ? eur(bp.get(k).val) : ""}</td></tr>`).join("")}<tr class="sub"><td>Total ${t.toLowerCase()}</td><td class="r mono">${eur(s.n)}</td><td class="r mono">${bp ? eur(s.p) : ""}</td></tr>`; }).join("");
  const ecart = b.totA - b.totP;
  return (ecart ? `<div class="banner" style="background:var(--bad-soft)"><b style="color:var(--bad)">Bilan déséquilibré</b> : écart de ${eur(ecart)} €. Vérifiez les écritures déséquilibrées et les comptes non reconnus.</div>` : "") +
    `<div class="grid g2"><div class="panel"><div class="panel-h"><h2>Actif</h2><span class="small muted">au ${frDate(ex.fin)}</span></div><div class="tw"><table class="t"><thead><tr><th></th><th class="r">Brut</th><th class="r">Amort. & dépréc.</th><th class="r">Net ${ex.fin.slice(0, 4)}</th><th class="r">${prev ? "Net " + prev.fin.slice(0, 4) : ""}</th></tr></thead><tbody>${secA}<tr class="tot"><td>Total actif</td><td></td><td></td><td class="r mono">${eur(b.totA)}</td><td class="r mono">${bp ? eur(bp.totA) : ""}</td></tr></tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h2>Passif</h2><span class="small muted">au ${frDate(ex.fin)}</span></div><div class="tw"><table class="t"><thead><tr><th></th><th class="r">${ex.fin.slice(0, 4)}</th><th class="r">${prev ? prev.fin.slice(0, 4) : ""}</th></tr></thead><tbody>${secP}<tr class="tot"><td>Total passif</td><td class="r mono">${eur(b.totP)}</td><td class="r mono">${bp ? eur(bp.totP) : ""}</td></tr></tbody></table></div></div></div>`;
}
function crView(ex, prev) {
  const c = compteResultat(ex.debut, ex.fin); const p = prev ? compteResultat(prev.debut, prev.fin) : null;
  const L = (lib, f, cls = "", ind = "ind1") => `<tr class="${cls}"><td class="${cls ? "" : ind}">${lib}</td><td class="r mono">${eur(f(c))}</td><td class="r mono muted">${p ? eur(f(p)) : ""}</td></tr>`;
  const v = k => x => x.v(k);
  return `<div class="panel" style="max-width:860px"><div class="tw"><table class="t"><thead><tr><th>Du ${frDate(ex.debut)} au ${frDate(ex.fin)}</th><th class="r">${ex.fin.slice(0, 4)}</th><th class="r">${prev ? prev.fin.slice(0, 4) : ""}</th></tr></thead><tbody>
  <tr class="grp"><td colspan="3">Produits d'exploitation</td></tr>${L("Ventes de marchandises", v("P_vm"))}${L("Production vendue de biens", v("P_pvb"))}${L("Production vendue de services", v("P_pvs"))}${L("<b>Chiffre d'affaires net</b>", x => x.CA)}${L("Production stockée", v("P_pst"))}${L("Production immobilisée", v("P_pim"))}${L("Subventions d'exploitation", v("P_sub"))}${L("Reprises sur amortissements, dépréciations et provisions", v("P_rep"))}${L("Autres produits", v("P_apr"))}${c.v("P_coti") || S.activite === "association" ? L("Cotisations", v("P_coti")) : ""}${c.v("P_gen") || S.activite === "association" ? L("Ressources liées à la générosité du public", v("P_gen")) : ""}${c.v("P_ufd") ? L("Utilisations des fonds dédiés", v("P_ufd")) : ""}${L("Total produits d'exploitation (I)", x => x.PE, "sub")}
  <tr class="grp"><td colspan="3">Charges d'exploitation</td></tr>${L("Achats de marchandises", v("C_am"))}${L("Variation de stock de marchandises", v("C_vsm"))}${L("Achats de matières premières et approvisionnements", v("C_amp"))}${L("Variation de stock de matières premières", v("C_vsmp"))}${L("Autres achats et charges externes", v("C_ace"))}${L("Impôts, taxes et versements assimilés", v("C_imp"))}${L("Salaires et traitements", v("C_sal"))}${L("Charges sociales", v("C_soc"))}${L("Dotations aux amortissements", v("C_dam"))}${L("Dotations aux provisions et dépréciations", v("C_dpr"))}${L("Autres charges", v("C_ach"))}${c.v("C_rfd") ? L("Reports en fonds dédiés", v("C_rfd")) : ""}${L("Total charges d'exploitation (II)", x => x.CE, "sub")}
  ${L("Résultat d'exploitation (I − II)", x => x.RE, "sub")}
  <tr class="grp"><td colspan="3">Résultat financier</td></tr>${L("Produits financiers", v("P_fin"))}${L("Charges financières", v("C_fin"))}${L("Résultat financier", x => x.RF, "sub")}
  ${L("Résultat courant avant impôts", x => x.RCAI, "sub")}
  <tr class="grp"><td colspan="3">Résultat exceptionnel</td></tr>${L("Produits exceptionnels", v("P_exc"))}${L("Charges exceptionnelles", v("C_exc"))}${L("Résultat exceptionnel", x => x.RX, "sub")}
  ${L("Participation des salariés", v("C_part"))}${L("Impôts sur les bénéfices", v("C_is"))}
  <tr class="tot"><td>${c.RN >= 0 ? "Bénéfice" : "Perte"}</td><td class="r mono">${eur(c.RN)}</td><td class="r mono">${p ? eur(p.RN) : ""}</td></tr></tbody></table></div></div>`;
}
function sigView(ex, prev) {
  const c = compteResultat(ex.debut, ex.fin); const g = c.sig; const pct = x => c.CA ? (x / c.CA * 100).toFixed(1).replace(".", ",") + " %" : "";
  const R = (lib, val, cls = "") => `<tr class="${cls}"><td class="${cls ? "" : "ind1"}">${lib}</td><td class="r mono">${eur(val)}</td><td class="r mono muted">${cls ? pct(val) : ""}</td></tr>`;
  return `<div class="panel" style="max-width:820px"><div class="tw"><table class="t"><thead><tr><th>Soldes intermédiaires de gestion</th><th class="r">${ex.fin.slice(0, 4)}</th><th class="r">% du CA</th></tr></thead><tbody>
  ${R("Ventes de marchandises", c.v("P_vm"))}${R("− Coût d'achat des marchandises vendues", -(c.v("C_am") + c.v("C_vsm")))}${R("Marge commerciale", g.marge, "sub")}
  ${R("Production vendue", c.v("P_pvb") + c.v("P_pvs"))}${R("Production stockée et immobilisée", c.v("P_pst") + c.v("P_pim"))}${R("Production de l'exercice", g.prod, "sub")}
  ${R("− Consommations en provenance de tiers", -g.conso)}${R("Valeur ajoutée", g.VA, "sub")}
  ${R("+ Subventions d'exploitation", c.v("P_sub"))}${R("− Impôts et taxes", -c.v("C_imp"))}${R("− Charges de personnel", -(c.v("C_sal") + c.v("C_soc")))}${R("Excédent brut d'exploitation", g.EBE, "sub")}
  ${R("+ Reprises et autres produits", c.v("P_rep") + c.v("P_apr"))}${R("− Dotations et autres charges", -(c.v("C_dam") + c.v("C_dpr") + c.v("C_ach")))}${R("Résultat d'exploitation", c.RE, "sub")}
  ${R("+/− Résultat financier", c.RF)}${R("Résultat courant avant impôts", c.RCAI, "sub")}${R("+/− Résultat exceptionnel", c.RX)}${R("− Participation et impôts sur les bénéfices", -(c.v("C_part") + c.v("C_is")))}
  <tr class="tot"><td>Résultat net de l'exercice</td><td class="r mono">${eur(c.RN)}</td><td class="r mono">${pct(c.RN)}</td></tr>
  ${R("Capacité d'autofinancement (méthode additive simplifiée)", c.RN + c.v("C_dam") + c.v("C_dpr") - c.v("P_rep"), "sub")}</tbody></table></div></div>`;
}
function l2033a(ex) {
  const b = bilan(ex); const g = k => b.get(k); const s = (...k) => k.reduce((a, x) => ({ br: a.br + g(x).brut, am: a.am + g(x).am, n: a.n + g(x).val }), { br: 0, am: 0, n: 0 });
  const A = (code, lib, o, cls = "") => `<div class="cl cl5 ${cls}"><div class="code">${code}</div><div>${lib}</div><div class="r">${eur(o.br)}</div><div class="r">${eur(o.am)}</div><div class="r">${eur(o.n)}</div></div>`;
  const P = (code, lib, v, cls = "") => cl(code, lib, "", eur(v), cls);
  const inc = s("A_fe", "A_conc", "A_ainc"), fc = s("A_fc"), cor = s("A_terr", "A_cons", "A_mat", "A_acor", "A_enc"), fin = s("A_part", "A_afin");
  const t1 = { br: inc.br + fc.br + cor.br + fin.br, am: inc.am + fc.am + cor.am + fin.am, n: inc.n + fc.n + cor.n + fin.n };
  const stM = s("A_smp", "A_sec", "A_spf"), stMa = s("A_sm"), av = s("A_avv"), cli = s("A_cli"), acr = s("A_acre", "A_csna"), vmp = s("A_vmp"), dis = s("A_disp"), cca = s("A_cca");
  const t2 = [stM, stMa, av, cli, acr, vmp, dis, cca].reduce((a, o) => ({ br: a.br + o.br, am: a.am + o.am, n: a.n + o.n }), { br: 0, am: 0, n: 0 });
  const pv = k => g(k).val;
  const t1p = pv("P_cap") + pv("P_prim") + pv("P_ecre") + pv("P_rl") + pv("P_rreg") + pv("P_rst") + pv("P_raut") + pv("P_ran") + pv("P_res") + pv("P_preg") + pv("P_subv");
  const t3 = pv("P_ecr") + pv("P_edv") + pv("P_avr") + pv("P_fou") + pv("P_fisc") + pv("P_dimm") + pv("P_adet") + pv("P_pca");
  return `<div class="grid g2"><div class="cerfa"><div class="ch">2033-A · Bilan simplifié — Actif</div>
    <div class="cl cl5 hl"><div></div><div></div><div class="r">Brut</div><div class="r">Amort.</div><div class="r">Net</div></div>
    ${A("010", "Fonds commercial", fc)}${A("014", "Autres immobilisations incorporelles", inc)}${A("028", "Immobilisations corporelles", cor)}${A("040", "Immobilisations financières", fin)}${A("044", "Total I", t1, "hl")}
    ${A("050", "Stocks : matières premières, en-cours, produits", stM)}${A("060", "Stocks : marchandises", stMa)}${A("064", "Avances et acomptes versés sur commandes", av)}${A("068", "Créances clients", cli)}${A("072", "Autres créances", acr)}${A("080", "Valeurs mobilières de placement", vmp)}${A("084", "Disponibilités", dis)}${A("092", "Charges constatées d'avance", cca)}${A("096", "Total II", t2, "hl")}
    ${A("110", "Total général (I + II)", { br: t1.br + t2.br, am: t1.am + t2.am, n: t1.n + t2.n }, "big")}</div>
    <div class="cerfa"><div class="ch">2033-A · Bilan simplifié — Passif</div>
    ${P("120", "Capital social ou individuel", pv("P_cap"))}${P("124", "Écarts de réévaluation", pv("P_ecre") + pv("P_prim"))}${P("126", "Réserve légale", pv("P_rl"))}${P("130", "Réserves réglementées", pv("P_rreg"))}${P("132", "Autres réserves", pv("P_raut") + pv("P_rst"))}${P("134", "Report à nouveau", pv("P_ran"))}${P("136", "Résultat de l'exercice", pv("P_res"))}${P("140", "Provisions réglementées et subventions d'investissement", pv("P_preg") + pv("P_subv"))}${P("142", "Total I", t1p, "hl")}
    ${P("154", "Provisions pour risques et charges (II)", pv("P_prov"), "hl")}
    ${P("156", "Emprunts et dettes assimilées", pv("P_ecr") + pv("P_edv"))}${P("164", "Avances et acomptes reçus sur commandes en cours", pv("P_avr"))}${P("166", "Fournisseurs et comptes rattachés", pv("P_fou"))}${P("169", "Autres dettes (dont dettes fiscales et sociales)", pv("P_fisc") + pv("P_dimm") + pv("P_adet"))}${P("174", "Produits constatés d'avance", pv("P_pca"))}${P("176", "Total III", t3, "hl")}
    ${P("180", "Total général (I + II + III)", t1p + pv("P_prov") + t3, "big")}</div></div>
    <p class="small muted">Codes de cases donnés comme repères pour la saisie de l'imprimé 2033-A ; vérifiez-les sur le millésime publié par l'administration fiscale.</p>`;
}
function l2033b(ex) {
  const c = compteResultat(ex.debut, ex.fin); const v = k => c.v(k); const r = calcIS(ex);
  const P = (code, lib, x, cls = "") => cl(code, lib, "", eur(x), cls);
  return `<div class="grid g2"><div class="cerfa"><div class="ch">2033-B · A — Résultat comptable</div>
    ${P("210", "Ventes de marchandises", v("P_vm"))}${P("214", "Production vendue — biens", v("P_pvb"))}${P("218", "Production vendue — services", v("P_pvs"))}${P("222", "Production stockée", v("P_pst"))}${P("224", "Production immobilisée", v("P_pim"))}${P("226", "Subventions d'exploitation reçues", v("P_sub"))}${P("230", "Autres produits", v("P_rep") + v("P_apr"))}${P("232", "Total des produits d'exploitation", c.PE, "hl")}
    ${P("234", "Achats de marchandises", v("C_am"))}${P("236", "Variation de stock (marchandises)", v("C_vsm"))}${P("238", "Achats de matières premières et approvisionnements", v("C_amp"))}${P("240", "Variation de stock (matières)", v("C_vsmp"))}${P("242", "Autres charges externes", v("C_ace"))}${P("244", "Impôts, taxes et versements assimilés", v("C_imp"))}${P("250", "Rémunérations du personnel", v("C_sal"))}${P("252", "Charges sociales", v("C_soc"))}${P("254", "Dotations aux amortissements", v("C_dam"))}${P("256", "Dotations aux provisions", v("C_dpr"))}${P("262", "Autres charges", v("C_ach"))}${P("264", "Total des charges d'exploitation", c.CE, "hl")}
    ${P("270", "Résultat d'exploitation", c.RE, "hl")}${P("280", "Produits financiers", v("P_fin"))}${P("290", "Produits exceptionnels", v("P_exc"))}${P("294", "Charges financières", v("C_fin"))}${P("300", "Charges exceptionnelles", v("C_exc"))}${P("306", "Impôts sur les bénéfices", v("C_is"))}${P("310", "Bénéfice ou perte", c.RN, "big")}</div>
    <div class="cerfa"><div class="ch">2033-B · B — Résultat fiscal</div>
    ${P("312", "Résultat comptable", c.RN)}${P("—", "Réintégrations (dont IS comptabilisé)", r.totR)}${P("—", "Déductions", r.totD)}${P("—", "Déficits antérieurs imputés", r.imputDef)}${P(r.rf >= 0 ? "352" : "354", r.rf >= 0 ? "Résultat fiscal — bénéfice" : "Résultat fiscal — déficit", Math.abs(r.rf), "big")}
    <div class="ch">Rappels</div>${P("—", "Effectif moyen du personnel (à compléter)", 0)}${P("—", "Chiffre d'affaires net", c.CA)}</div></div>
    <p class="small muted">Codes de cases indicatifs ; reportez les montants sur l'imprimé 2033-B en vigueur. Pour le régime réel normal, utilisez Bilan et Compte de résultat (2050 à 2053) et le tableau 2058-A via le module IS.</p>`;
}
function annexeView(ex) {
  const rows = S.immos.map(im => { const p = planAmort(im); const ant = p.filter(r => r.fin < ex.debut).reduce((a, r) => a + r.dot, 0); const dot = (p.find(r => r.ex === ex.id) || {}).dot || 0; const acq = im.dateMES >= ex.debut && im.dateMES <= ex.fin; return { im, ant, dot, acq }; });
  const debut = rows.filter(r => !r.acq).reduce((a, r) => a + r.im.valeur, 0), aug = rows.filter(r => r.acq).reduce((a, r) => a + r.im.valeur, 0);
  return `<div class="stack" style="max-width:900px"><div class="panel panel-b"><h2>Règles et méthodes comptables</h2><p>Les comptes annuels de l'exercice clos le ${frDate(ex.fin)} sont établis conformément au règlement ANC n° 2014-03 relatif au plan comptable général, dans le respect des principes de prudence, de continuité d'exploitation, de permanence des méthodes et d'indépendance des exercices. Durée de l'exercice : ${monthsBetween(ex.debut, ex.fin)} mois.</p><p>Les immobilisations sont évaluées à leur coût d'acquisition. Les amortissements sont calculés suivant le mode linéaire ou dégressif selon la durée d'utilisation prévue. Les créances sont valorisées à leur valeur nominale.</p></div>
  <div class="panel"><div class="panel-h"><h2>Immobilisations (état 2033-C, cadre I)</h2></div><div class="tw"><table class="t"><thead><tr><th></th><th class="r">Valeur brute début</th><th class="r">Augmentations</th><th class="r">Diminutions</th><th class="r">Valeur brute fin</th></tr></thead><tbody><tr><td>Immobilisations corporelles et incorporelles</td><td class="r mono">${eur(debut)}</td><td class="r mono">${eur(aug)}</td><td class="r mono">0,00</td><td class="r mono">${eur(debut + aug)}</td></tr></tbody></table></div></div>
  <div class="panel"><div class="panel-h"><h2>Amortissements (état 2033-C, cadre II)</h2></div><div class="tw"><table class="t"><thead><tr><th>Bien</th><th class="r">Début d'exercice</th><th class="r">Dotations</th><th class="r">Fin d'exercice</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.im.lib)}</td><td class="r mono">${eur(r.ant)}</td><td class="r mono">${eur(r.dot)}</td><td class="r mono">${eur(r.ant + r.dot)}</td></tr>`).join("")}<tr class="tot"><td>Total</td><td class="r mono">${eur(rows.reduce((a, r) => a + r.ant, 0))}</td><td class="r mono">${eur(rows.reduce((a, r) => a + r.dot, 0))}</td><td class="r mono">${eur(rows.reduce((a, r) => a + r.ant + r.dot, 0))}</td></tr></tbody></table></div></div></div>`;
}

/* ---------------- Clôture ---------------- */
VIEWS.cloture = () => {
  const ex = exCur(); const C = preClotureChecks(ex); const blocking = C.filter(c => c.block && !c.ok).length;
  const res120 = -sumPref(soldeMap(ex.debut, ex.fin), ["120"]), res129 = sumPref(soldeMap(ex.debut, ex.fin), ["129"]);
  const inv = E.filter(e => e.tag && e.tag.startsWith("INV") && e.date >= ex.debut && e.date <= addDays(ex.fin, 1));
  return topbar("Fin d'exercice · " + ex.id.replace("EX", "exercice "), "Clôture", exSelect()) +
    `<div class="grid g2">
      <div class="stack"><div class="panel"><div class="panel-h"><h2>1 · Travaux d'inventaire</h2></div><div class="panel-b">
        <p class="small muted" style="margin-top:0">Chaque assistant passe une écriture d'OD au ${frDate(ex.fin)} et, si vous le souhaitez, son extourne au ${frDate(addDays(ex.fin, 1))}.</p>
        <div class="row">${[["CCA", "Charge constatée d'avance"], ["PCA", "Produit constaté d'avance"], ["FNP", "Facture non parvenue"], ["FAE", "Facture à établir"], ["STOCK", "Variation de stock"], ["CP", "Congés payés"]].map(([k, l]) => `<button class="btn" data-act="inv" data-t="${k}">${l}</button>`).join("")}</div>
        ${inv.length ? `<div class="tw" style="margin-top:12px"><table class="t"><tbody>${inv.map(e => `<tr><td class="mono">${frDate(e.date)}</td><td>${esc(e.libelle)}</td><td class="r mono">${eur(ecrTotals(e).d)}</td><td>${statutPill(e)}</td></tr>`).join("")}</tbody></table></div>` : ""}
        <div class="row" style="margin-top:12px"><button class="btn sm" data-act="go" data-v="immos">Dotations aux amortissements →</button><button class="btn sm" data-act="go" data-v="tva">Liquidation de TVA →</button><button class="btn sm" data-act="go" data-v="is">Impôt sur les sociétés →</button></div>
      </div></div>
      <div class="panel"><div class="panel-h"><h2>Affectation du résultat précédent</h2></div><div class="panel-b">
        ${res120 || res129 ? `<p>Résultat à affecter (compte ${res120 ? "120" : "129"}) : <b class="mono">${eur(res120 || -res129)} €</b></p><button class="btn" data-act="affect">Passer l'affectation…</button>` : `<p class="muted small" style="margin:0">Aucun résultat en attente d'affectation sur cet exercice.</p>`}
      </div></div></div>
      <div class="stack"><div class="panel"><div class="panel-h"><h2>2 · Contrôles avant clôture</h2>${blocking ? `<span class="pill bad">${blocking} bloquant(s)</span>` : '<span class="pill ok">Prêt</span>'}</div><div class="panel-b">${C.map(c => `<div class="check"><span class="pill ${c.ok ? "ok" : c.block ? "bad" : "warn"}">${c.ok ? "OK" : c.block ? "Bloquant" : "À vérifier"}</span><div><div>${c.lib}</div>${c.det ? `<div class="small muted">${esc(c.det)}</div>` : ""}</div></div>`).join("")}</div></div>
      <div class="panel"><div class="panel-h"><h2>3 · Clôturer l'exercice</h2></div><div class="panel-b">
        ${ex.cloture ? `<p><span class="pill ok">Clôturé le ${frDate(ex.clotureLe)}</span> Les écritures sont figées et les à-nouveaux ont été générés sur l'exercice suivant.</p>` : `<p class="small">La clôture fige définitivement l'exercice, crée l'exercice suivant et génère les à-nouveaux (comptes de bilan, détail non lettré des tiers, résultat en 120 ou 129).</p><button class="btn go" data-act="cloturer" ${blocking ? "disabled" : ""}>Clôturer ${ex.id.replace("EX", "l'exercice ")}</button>${blocking ? `<p class="small bal-ko">Résolvez d'abord les contrôles bloquants.</p>` : ""}`}
      </div></div></div></div>`;
};

/* ---------------- FEC ---------------- */
VIEWS.fec = () => {
  const ex = exCur(); const st = UI.sub.fec ||= { sep: "\t" };
  const C = fecChecks(ex); const f = buildFEC(ex, st.sep);
  const prev = f.text.split("\r\n").slice(0, 10).join("\n");
  return topbar("Obligation légale · art. L47 A et A47 A-1 du LPF", "Fichier des écritures comptables", exSelect()) +
    `<div class="grid g2"><div class="stack"><div class="panel"><div class="panel-h"><h2>Export du FEC</h2><span class="mono small">${esc(fecFilename(ex))}</span></div><div class="panel-b stack">
      <div class="row"><span class="small">Séparateur</span><div class="seg"><button class="${st.sep === "\t" ? "on" : ""}" data-act="fecSep" data-v="tab">Tabulation</button><button class="${st.sep === "|" ? "on" : ""}" data-act="fecSep" data-v="pipe">Barre verticale</button></div></div>
      <div class="kv"><span>Écritures validées exportées</span><b class="mono">${f.n}</b><span>Lignes (hors en-tête)</span><b class="mono">${f.nl}</b><span>Écritures en brouillard exclues</span><b class="mono" style="color:${f.brouillard ? "var(--warn)" : "inherit"}">${f.brouillard}</b></div>
      <div class="row"><button class="btn pri" data-act="fecDl">Télécharger le FEC</button><button class="btn" data-act="fecCopy">Copier le contenu</button></div>
      <pre class="fec">${esc(prev)}</pre>
      <p class="small muted" style="margin:0">18 champs dans l'ordre réglementaire, dates AAAAMMJJ, montants en euros avec virgule décimale, encodage UTF-8, à-nouveaux en tête. À remettre à l'administration en cas de contrôle fiscal.</p>
    </div></div></div>
    <div class="stack"><div class="panel"><div class="panel-h"><h2>Contrôles de conformité</h2></div><div class="panel-b">${C.map(c => `<div class="check"><span class="pill ${c.ok ? "ok" : c.warn ? "warn" : "bad"}">${c.ok ? "Conforme" : c.warn ? "Attention" : "Anomalie"}</span><div><div>${esc(c.lib)}</div>${c.det ? `<div class="small muted">${esc(c.det)}</div>` : ""}</div></div>`).join("")}</div></div>
    <div class="panel"><div class="panel-h"><h2>Importer un FEC</h2></div><div class="panel-b"><p class="small" style="margin-top:0">Reprenez l'historique d'un autre logiciel : écritures, journaux, comptes et tiers sont recréés. Formats Débit/Crédit et Montant/Sens acceptés.</p><input type="file" id="fecFile" accept=".txt,.csv,text/plain" data-ch="fecFile"></div></div></div></div>`;
};

/* ---------------- Plan comptable & journaux ---------------- */
VIEWS.plan = () => {
  const st = UI.sub.plan ||= { q: "", cls: "" };
  const m = soldeMap(); const used = new Set(Object.keys(m));
  const list = allAccounts().filter(a => (!st.cls || a.num[0] === st.cls) && (!st.q || (a.num + " " + a.lib).toLowerCase().includes(st.q.toLowerCase())));
  const extra = [...used].filter(c => !PCG[c] && !S.comptes[c]).map(c => ({ num: c, lib: accLib(c) }));
  const all = list.concat(extra.filter(a => (!st.cls || a.num[0] === st.cls) && (!st.q || (a.num + " " + a.lib).toLowerCase().includes(st.q.toLowerCase())))).sort((a, b) => a.num.localeCompare(b.num));
  return topbar("Dossier · référentiel", "Plan comptable & journaux", `<button class="btn pri" data-act="newCompte">+ Nouveau compte</button>`) +
    `<div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)" id="planGrid"><div class="panel"><div class="panel-h"><div class="row"><input class="in" style="width:240px" id="pq" placeholder="Rechercher un compte" value="${esc(st.q)}" data-in="pq"><select class="in" style="width:auto" id="pcls" data-ch="pcls"><option value="">Toutes les classes</option>${Object.entries(CLASSES).slice(0, 7).map(([k, l]) => `<option value="${k}" ${st.cls === k ? "selected" : ""}>${k} · ${l}</option>`).join("")}</select></div><span class="small muted">${all.length} comptes</span></div>
    <div class="tw" style="max-height:70vh;overflow:auto"><table class="t"><thead><tr><th>Compte</th><th>Intitulé</th><th class="r">Solde</th><th></th></tr></thead><tbody>${all.map(a => `<tr><td class="acc">${a.num}</td><td>${esc(a.lib)}${S.comptes[a.num] ? ' <span class="pill n">personnalisé</span>' : ""}</td><td class="r mono">${used.has(a.num) ? eur(m[a.num]) : ""}</td><td class="r"><button class="btn sm ghost" data-act="editCompte" data-c="${a.num}">Renommer</button></td></tr>`).join("")}</tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h2>Journaux</h2><button class="btn sm" data-act="newJournal">+ Journal</button></div><div class="tw"><table class="t"><thead><tr><th>Code</th><th>Libellé</th><th>Type</th><th class="r">Écritures</th></tr></thead><tbody>${S.journaux.map(j => `<tr><td class="acc">${j.code}</td><td>${esc(j.lib)}</td><td><span class="pill n">${{ ACH: "Achats", VEN: "Ventes", BQ: "Banque", CAI: "Caisse", OD: "Opérations diverses", AN: "À-nouveaux" }[j.type] || j.type}</span></td><td class="r mono">${E.filter(e => e.journal === j.code).length}</td></tr>`).join("")}</tbody></table></div></div></div>
    <style>@media (max-width:1000px){#planGrid{grid-template-columns:minmax(0,1fr)!important}}</style>`;
};

/* ---------------- Paramètres ---------------- */
VIEWS.params = () => {
  const f = (k, lib, extra = "", type = "text") => `<label class="f">${lib}<input class="in" type="${type}" id="p-${k}" value="${esc(S[k])}" data-ch="param" data-f="${k}" ${extra}></label>`;
  return topbar("Dossier · " + esc(S.nom), "Paramètres", `<button class="btn" data-act="dossiers">Changer de dossier</button>`) +
    `<div class="grid g2"><div class="panel"><div class="panel-h"><h2>Identité de l'entreprise</h2></div><div class="panel-b grid g2">
      ${f("nom", "Dénomination")}
      <label class="f">Forme juridique<select class="in" id="p-forme" data-ch="param" data-f="forme">${["SAS", "SASU", "SARL", "EURL", "SA", "SNC", "SCI à l'IS", "SELARL"].map(x => `<option ${S.forme === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      ${f("siren", "SIREN", 'inputmode="numeric" maxlength="9" class="in mono"')}${f("siret", "SIRET du siège", 'inputmode="numeric" maxlength="14"')}
      ${f("naf", "Code NAF")}<label class="f">Capital social (€)<input class="in num" id="p-capital" value="${toIn(S.capital)}" data-ch="paramAmt" data-f="capital"></label>
      <label class="f" style="grid-column:1/-1">Adresse du siège<input class="in" id="p-adresse" value="${esc(S.adresse)}" data-ch="param" data-f="adresse"></label>
      <label class="chk"><input type="checkbox" id="p-cl" data-ch="paramB" data-f="capitalLibere" ${S.capitalLibere ? "checked" : ""}> Capital entièrement libéré</label>
      <label class="chk"><input type="checkbox" id="p-pp" data-ch="paramB" data-f="pp75" ${S.pp75 ? "checked" : ""}> Détenu à 75 % au moins par des personnes physiques</label>
    </div></div>
    <div class="stack"><div class="panel"><div class="panel-h"><h2>Régimes fiscaux</h2></div><div class="panel-b grid g2">
      <label class="f">Régime de TVA<select class="in" id="p-rtva" data-ch="param" data-f="regimeTVA"><option value="RN_M" ${S.regimeTVA === "RN_M" ? "selected" : ""}>Réel normal — CA3 mensuelle</option><option value="RN_T" ${S.regimeTVA === "RN_T" ? "selected" : ""}>Réel normal — CA3 trimestrielle (TVA ≤ 4 000 €/an)</option><option value="RSI" ${S.regimeTVA === "RSI" ? "selected" : ""}>Réel simplifié — CA12 annuelle</option></select></label>
      <label class="f">Régime d'imposition des bénéfices<select class="in" id="p-ris" data-ch="param" data-f="regimeIS"><option value="RS" ${S.regimeIS === "RS" ? "selected" : ""}>IS — réel simplifié (liasse 2033)</option><option value="RN" ${S.regimeIS === "RN" ? "selected" : ""}>IS — réel normal (liasse 2050)</option></select></label>
    </div></div>
    <div class="panel"><div class="panel-h"><h2>Exercices</h2><button class="btn sm" data-act="newEx">+ Exercice</button></div><div class="tw"><table class="t"><tbody>${S.exercices.map(x => `<tr><td class="acc">${x.id}</td><td class="mono">${frDate(x.debut)} → ${frDate(x.fin)}</td><td>${monthsBetween(x.debut, x.fin)} mois</td><td>${x.cloture ? '<span class="pill ok">Clôturé</span>' : '<span class="pill n">Ouvert</span>'}</td></tr>`).join("")}</tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h2>Sauvegarde</h2></div><div class="panel-b stack">
      <p class="small" style="margin:0">${Store.mode === "db" ? "Vos dossiers sont enregistrés automatiquement dans votre espace personnel, visible de vous seul." : "Vos dossiers sont enregistrés dans ce navigateur. Exportez régulièrement une sauvegarde."}</p>
      <div class="row"><button class="btn" data-act="backup">Exporter une sauvegarde (.json)</button><label class="btn">Restaurer une sauvegarde<input type="file" accept=".json,application/json" id="restoreFile" data-ch="restore" hidden></label></div>
      <button class="btn danger" data-act="delDossier" style="align-self:flex-start">Supprimer ce dossier</button>
    </div></div></div></div>`;
};
