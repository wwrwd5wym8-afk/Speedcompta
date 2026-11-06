/* ============================================================
   Profils d'activité : créateur, indépendant, association, TPE, PME/ETI, SCI
   ============================================================ */
const ACT_ICONS = {
  createur: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 12h18"/><circle cx="17.5" cy="16.5" r="3.2" fill="currentColor" stroke="none"/><path d="M17.5 15v1.6l1 .7" stroke="#fff"/>',
  independant: '<circle cx="8" cy="5.5" r="2.2"/><path d="M5 21v-6l-1.5-1.5L6 9h4l3 4h3M8 21v-5"/><rect x="13" y="4" width="8" height="6" rx="1"/><path d="M15 7h4"/>',
  association: '<path d="M12 4.5a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM10 10h4l-.5 3h-3z"/><path d="M3 13c2 0 3 1 4.5 3S10 19 12 19s3-1 4.5-3 2.5-3 4.5-3"/><path d="M3 13v3c2 3 5 5 9 5s7-2 9-5v-3"/>',
  tpe: '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5M14 14.5c.8-.3 1.6-.5 2.5-.5 2.6 0 4.4 1.5 4.9 4.5"/>',
  pme: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5M10.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/>',
  sci: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8.5 7h1M11.5 7h1M14.5 7h1M8.5 10.5h1M11.5 10.5h1M14.5 10.5h1M8.5 14h1M11.5 14h1M14.5 14h1M10.5 21v-3h3v3"/>'
};
const FISCAL_LIB = { IS_RS: "IS - réel simplifié (2065 + 2033)", IS_RN: "IS - réel normal (2065 + 2050)", BIC_RS: "IR - BIC réel simplifié (2031 + 2033)", BIC_RN: "IR - BIC réel normal (2031 + 2050)", BNC: "IR - BNC déclaration contrôlée (2035)", MICRO: "Micro-entreprise (livre des recettes, 2042-C-PRO)", SCI_IR: "SCI à l'IR - revenus fonciers (2072)", ASSO: "Association non lucrative (2070 si revenus patrimoniaux)" };
const TVA_LIB = { RN_M: "Réel normal - CA3 mensuelle", RN_T: "Réel normal - CA3 trimestrielle", RSI: "Réel simplifié - CA12 annuelle", FRANCHISE: "Franchise en base (TVA non applicable, art. 293 B du CGI)", EXO: "Non assujetti ou opérations exonérées" };
const ACTIVITES = {
  createur: { lib: "Créateur d'entreprise", desc: "Société en création ou dans sa première année : parcours guidé, capital, frais de constitution.", formes: ["SASU", "SAS", "EURL", "SARL", "EI"], fiscal: ["IS_RS", "BIC_RS", "MICRO", "BNC"], tva: ["FRANCHISE", "RSI", "RN_M", "RN_T"], def: { forme: "SASU", fiscal: "IS_RS", regimeTVA: "FRANCHISE", capital: 100000 }, masques: [],
    modeles: [["A", "Frais de constitution (greffe, annonce légale)", "622700", 2000], ["A", "Honoraires de création (avocat, expert-comptable)", "622600", 2000], ["A", "Matériel informatique (immobilisation)", "218300", 2000], ["A", "Logiciels et abonnements", "626000", 2000], ["A", "Assurance professionnelle", "616000", 0], ["V", "Prestation de services", "706000", 2000], ["V", "Vente de marchandises", "707000", 2000]] },
  independant: { lib: "Indépendant", desc: "Entrepreneur individuel, micro-entrepreneur ou profession libérale (BNC, BIC).", formes: ["EI", "Micro-entreprise", "EURL à l'IR", "SELARL"], fiscal: ["MICRO", "BNC", "BIC_RS", "BIC_RN"], tva: ["FRANCHISE", "RSI", "RN_T", "RN_M"], def: { forme: "EI", fiscal: "MICRO", regimeTVA: "FRANCHISE", capital: 0 }, masques: [],
    modeles: [["V", "Honoraires", "706000", 2000], ["V", "Honoraires (franchise de TVA)", "706000", 0], ["A", "Frais de déplacement", "625100", 2000], ["A", "Fournitures de bureau", "606400", 2000], ["A", "Téléphone et internet", "626000", 2000], ["A", "Cotisations professionnelles", "628100", 0], ["A", "Loyer du local professionnel", "613200", 0]] },
  association: { lib: "Association", desc: "Association loi 1901 : cotisations, dons, subventions, fonds dédiés, bénévolat.", formes: ["Association loi 1901", "Association reconnue d'utilité publique", "Fondation"], fiscal: ["ASSO", "IS_RN"], tva: ["EXO", "RSI", "RN_M"], def: { forme: "Association loi 1901", fiscal: "ASSO", regimeTVA: "EXO", capital: 0 }, masques: ["pa"],
    modeles: [["V", "Cotisation d'adhérent", "756100", 0], ["V", "Don manuel", "754100", 0], ["V", "Mécénat d'entreprise", "754200", 0], ["V", "Subvention de fonctionnement", "741000", 0], ["V", "Billetterie et manifestations", "706000", 0], ["A", "Achats pour activités", "606300", 2000], ["A", "Assurance de l'association", "616000", 0], ["A", "Location de salle", "613200", 0]] },
  tpe: { lib: "TPE", desc: "Très petite entreprise (moins de 10 salariés) : SARL, SAS, EURL au réel.", formes: ["SARL", "SAS", "SASU", "EURL", "SNC"], fiscal: ["IS_RS", "BIC_RS", "IS_RN"], tva: ["RN_M", "RSI", "RN_T", "FRANCHISE"], def: { forme: "SARL", fiscal: "IS_RS", regimeTVA: "RN_M", capital: 1000000 }, masques: [], modeles: null },
  pme: { lib: "PME/ETI", desc: "PME et ETI au réel normal : liasse 2050, CA3 mensuelle, multi-journaux.", formes: ["SAS", "SA", "SARL", "SCA"], fiscal: ["IS_RN", "IS_RS"], tva: ["RN_M", "RN_T"], def: { forme: "SAS", fiscal: "IS_RN", regimeTVA: "RN_M", capital: 5000000 }, masques: [], modeles: null },
  sci: { lib: "SCI", desc: "Société civile immobilière à l'IR (2072) ou à l'IS : loyers, charges, emprunts.", formes: ["SCI", "SCI à l'IS", "SCCV"], fiscal: ["SCI_IR", "IS_RS"], tva: ["EXO", "RSI", "RN_T"], def: { forme: "SCI", fiscal: "SCI_IR", regimeTVA: "EXO", capital: 100000 }, masques: ["pa"],
    modeles: [["V", "Loyer encaissé (location nue)", "706000", 0], ["V", "Loyer commercial avec TVA", "706000", 2000], ["A", "Taxe foncière", "635120", 0], ["A", "Assurance propriétaire non occupant", "616000", 0], ["A", "Travaux d'entretien", "615000", 2000], ["A", "Frais de gestion locative", "622600", 2000], ["A", "Charges de copropriété", "614000", 0]] }
};
function profil(k) { const base = ACTIVITES[k || (S && S.activite) || "tpe"] || ACTIVITES.tpe; const o = (typeof CONFIG !== "undefined" && CONFIG.profils && CONFIG.profils[k || (S && S.activite)]) || {}; return Object.assign({}, base, o, { def: Object.assign({}, base.def, o.def || {}) }); }
const actIco = (k, cls = "") => `<span class="act-ic ${cls}"><svg viewBox="0 0 24 24" aria-hidden="true">${ACT_ICONS[k] || ""}</svg></span>`;
function profilModeles(k) { const p = profil(k); const L = (CONFIG.profils && CONFIG.profils[k] && CONFIG.profils[k].modeles) || p.modeles || DEFAULT_MODELES; return L.map(([sens, nom, compte, taux]) => ({ id: uid(), sens, nom, compte, taux, base: "TTC", tiers: "", lib: "" })); }

/* Liasse selon le régime fiscal du dossier */
defaultLiasse = function () { if (S.fiscal && LIASSES[S.fiscal]) return S.fiscal; if (/SCI/.test(S.forme) && !/IS/.test(S.forme)) return "SCI_IR"; return S.regimeIS === "RN" ? "IS_RN" : "IS_RS"; };
const _periodes = periodesTVA;
periodesTVA = function (ex) { if (!["RN_M", "RN_T", "RSI"].includes(S.regimeTVA)) return []; return _periodes(ex); };

/* ---------- Micro-entreprise ---------- */
function fMicro(R, ex) {
  R.cerfa = { num: "LIVRE DES RECETTES", titre: "MICRO-ENTREPRISE - ARTICLE 50-0 DU CGI" };
  const rec = flat({ from: ex.debut, to: ex.fin, noAN: true }).filter(x => x.l.compte.startsWith("70")).sort((a, b) => a.e.date.localeCompare(b.e.date));
  R.newPage("Livre des recettes", "", "Livre des recettes");
  const tiersOf = e => { const t = e.lignes.find(l => l.aux); return t ? (tiersBy(t.aux) || {}).nom || t.aux : ""; };
  const ventes = rec.filter(x => /^70[17]/.test(x.l.compte)).reduce((a, x) => a + x.l.credit - x.l.debit, 0), serv = rec.reduce((a, x) => a + x.l.credit - x.l.debit, 0) - ventes;
  R.table([{ w: 62 }, { w: 80 }, { wrap: 1 }, { w: 70 }, { w: 84, align: "right" }], rec.map(x => [frDate(x.e.date), x.e.piece, tiersOf(x.e) + " - " + (x.l.lib || x.e.libelle), x.l.compte, pe(x.l.credit - x.l.debit)]).concat([{ style: "tot", cells: ["", "", "Total des recettes", "", pe(ventes + serv)] }]), ["Date", "Pièce", "Client et nature", "Compte", "Montant"]);
  const ach = flat({ from: ex.debut, to: ex.fin, noAN: true }).filter(x => /^60[127]/.test(x.l.compte)).sort((a, b) => a.e.date.localeCompare(b.e.date));
  R.cerfa = { num: "REGISTRE DES ACHATS", titre: "OBLIGATOIRE POUR LES ACTIVITÉS DE VENTE" }; R.newPage("Registre des achats", "", "Registre des achats");
  R.table([{ w: 62 }, { w: 80 }, { wrap: 1 }, { w: 84, align: "right" }], ach.map(x => [frDate(x.e.date), x.e.piece, x.l.lib || x.e.libelle, pe(x.l.debit - x.l.credit)]).concat([{ style: "tot", cells: ["", "", "Total des achats", pe(ach.reduce((a, x) => a + x.l.debit - x.l.credit, 0))] }]), ["Date", "Pièce", "Fournisseur et nature", "Montant"]);
  const F = cfgFiscal(); R.cerfa = { num: "2042-C-PRO", titre: "REVENUS À DÉCLARER - MICRO-ENTREPRISE" }; R.newPage("Montants à déclarer", "", "2042-C-PRO");
  R.table(tCode, [{ style: "grp", cells: ["", "Chiffre d'affaires de l'année", ""] }, ["", "Ventes de marchandises, fourniture de logement (abattement 71 %)", pe(ventes)], ["", "Prestations de services BIC (abattement 50 %)", pe(S.fiscal === "MICRO" && S.naturePro !== "BNC" ? serv : 0)], ["", "Recettes non commerciales BNC (abattement 34 %)", pe(S.naturePro === "BNC" ? serv : 0)], { style: "grp", cells: ["", "Seuils du régime micro", ""] }, ["", "Plafond ventes", pe(F.microVentes * 100)], ["", "Plafond services", pe(F.microServices * 100)]], ["", "Libellé", "Montant"]);
  R.para("Le chiffre d'affaires est aussi déclaré mensuellement ou trimestriellement à l'Urssaf (autoentrepreneur.urssaf.fr). Montants à vérifier : le régime micro retient les recettes encaissées.");
}
/* ---------- Association ---------- */
function fAsso(R, ex) {
  const c = compteResultat(ex.debut, ex.fin), v = k => c.v(k);
  R.cerfa = { num: "COMPTES ASSOCIATIFS", titre: "RÈGLEMENT ANC N° 2018-06 MODIFIÉ" }; R.newPage("Compte de résultat associatif", "", "Compte de résultat");
  const P = (l, x, st) => ({ style: st, cells: ["", l, pe(x, !st)] });
  const m = soldeMap(ex.debut, ex.fin); const cv = p => sumPref(m, p);
  R.table(tCode, [{ style: "grp", cells: ["", "PRODUITS D'EXPLOITATION", ""] }, P("Cotisations", v("P_coti")), P("Ventes de biens et de services", c.CA), P("Ressources liées à la générosité du public (dons, mécénat, legs)", v("P_gen")), P("Subventions", v("P_sub")), P("Reprises et autres produits", v("P_rep") + v("P_apr")), P("Utilisations des fonds dédiés", v("P_ufd")), P("Total des produits d'exploitation", c.PE, "sub"),
    { style: "grp", cells: ["", "CHARGES D'EXPLOITATION", ""] }, P("Achats et charges externes", v("C_am") + v("C_amp") + v("C_ace") + v("C_vsm") + v("C_vsmp")), P("Impôts et taxes", v("C_imp")), P("Salaires et charges sociales", v("C_sal") + v("C_soc")), P("Dotations aux amortissements et provisions", v("C_dam") + v("C_dpr")), P("Reports en fonds dédiés", v("C_rfd")), P("Autres charges", v("C_ach")), P("Total des charges d'exploitation", c.CE, "sub"),
    P("Résultat financier", c.RF), P("Résultat exceptionnel", c.RX), P("Impôt sur les sociétés (revenus patrimoniaux)", v("C_is")), P(c.RN >= 0 ? "EXCÉDENT DE L'EXERCICE" : "DÉFICIT DE L'EXERCICE", c.RN, "big"),
    { style: "grp", cells: ["", "CONTRIBUTIONS VOLONTAIRES EN NATURE", ""] }, P("Bénévolat", -cv(["870"])), P("Prestations et dons en nature", -cv(["871", "875"])), P("Emplois : personnel bénévole", cv(["864"])), P("Emplois : mises à disposition, prestations, secours", cv(["860", "861", "862"]))], ["", "Libellé", "Montant"]);
  const rp = sumPref(m, ["76"]) * -1; const F = cfgFiscal();
  R.cerfa = { num: "N° 2070-SD", titre: "IMPÔT SUR LES SOCIÉTÉS DES ORGANISMES SANS BUT LUCRATIF" }; R.newPage("Revenus patrimoniaux", "", "2070-SD");
  R.table(tCode, [["", "Revenus de capitaux mobiliers et intérêts (comptes 76)", pe(rp)], ["", "Revenus fonciers (loyers d'immeubles non affectés à l'activité, 752)", pe(-sumPref(m, ["752"]))], { style: "big", cells: ["", "Base imposable au taux réduit (24 %, 10 % ou 15 % selon la nature)", pe(rp - sumPref(m, ["752"]))] }]);
  R.para("Les associations dont la gestion est désintéressée et les activités non lucratives prépondérantes ne sont imposées que sur leurs revenus patrimoniaux. Les intérêts des livrets A et des comptes exonérés n'entrent pas dans la base. Une activité lucrative relève de l'IS de droit commun (formulaire 2065).");
}
LIASSES.MICRO = { lib: "Micro-entreprise (régime micro-BIC ou micro-BNC)", ex: "Entrepreneur individuel au régime micro : pas de liasse, livre des recettes et déclaration 2042-C-PRO", forms: [["Livre des recettes", fMicro]] };
LIASSES.ASSO = { lib: "Association non lucrative", ex: "Association loi 1901 non fiscalisée : comptes associatifs et 2070-SD sur les revenus patrimoniaux", forms: [["Comptes associatifs + 2070", fAsso]] };
LIASSE_LIBS["Livre des recettes"] = "Livre des recettes, registre des achats, montants 2042-C-PRO"; LIASSE_LIBS["Comptes associatifs + 2070"] = "Compte de résultat associatif, contributions volontaires, 2070-SD";

/* ---------- Vues adaptées ---------- */
const _tvaView = VIEWS.tva;
VIEWS.tva = () => {
  if (["RN_M", "RN_T", "RSI"].includes(S.regimeTVA)) return _tvaView();
  const ex = exCur(); const F = cfgFiscal(); const cr = compteResultat(ex.debut, ex.fin);
  const ventes = cr.v("P_vm") + cr.v("P_pvb"), serv = cr.v("P_pvs");
  const bar = (v, s, sm, l) => { const pct = Math.min(100, Math.round(v / (s * 100) * 100)); return `<div style="margin:10px 0"><div class="row" style="justify-content:space-between"><b>${l}</b><span class="mono">${eur(v)} / ${NF0.format(s)} € (majoré ${NF0.format(sm)} €)</span></div><div style="height:10px;border-radius:5px;background:var(--grid);overflow:hidden;margin-top:6px"><div style="height:100%;width:${pct}%;background:${pct >= 90 ? "var(--bad)" : pct >= 70 ? "var(--warn)" : "var(--ok)"}"></div></div></div>`; };
  return `<div class="pg-h"><div><h1>TVA</h1><p class="lead">${esc(TVA_LIB[S.regimeTVA] || "")}</p></div>${exSelect()}</div>
  ${S.regimeTVA === "FRANCHISE" ? `<section class="card"><div class="card-h"><h2>${ico("tva")} Suivi des seuils de la franchise en base</h2></div><div class="card-b">${bar(ventes, F.franchiseVentes, F.franchiseVentesMaj, "Ventes de marchandises, hébergement")}${bar(serv, F.franchiseServices, F.franchiseServicesMaj, "Prestations de services")}
    <p class="small">Vos factures doivent porter la mention « TVA non applicable, article 293 B du CGI ». Si le seuil majoré est dépassé, la TVA est due dès le jour du dépassement ; si seul le seuil normal est dépassé sur l'année, elle est due à compter du 1er janvier suivant.</p></div></section>`
    : `<section class="card"><div class="card-b"><p style="margin:0">${S.activite === "association" ? "L'association n'est pas assujettie à la TVA (activités non lucratives). Si elle exerce une activité lucrative au-delà de la franchise des organismes sans but lucratif, passez au régime réel dans Paramètres." : "Les opérations de la société sont exonérées de TVA (location nue d'immeubles, par exemple). Une option pour la TVA sur les loyers professionnels se paramètre dans Paramètres."}</p></div></section>`}
  <p class="small muted">Seuils modifiables par l'administrateur (Administration › Fiscalité et seuils).</p>`;
};
const _isView = VIEWS.is;
VIEWS.is = () => {
  const lt = defaultLiasse(); if (lt === "IS_RS" || lt === "IS_RN") return _isView();
  const ex = exCur(); const r = calcIS(ex);
  const txt = { BIC_RS: "Le bénéfice est imposé à l'impôt sur le revenu dans la catégorie des BIC (déclaration 2031 et report sur la 2042-C-PRO).", BIC_RN: "Le bénéfice est imposé à l'impôt sur le revenu dans la catégorie des BIC (déclaration 2031 et report sur la 2042-C-PRO).", BNC: "Le bénéfice est imposé à l'impôt sur le revenu dans la catégorie des BNC (déclaration 2035).", MICRO: "Au régime micro, l'impôt est calculé sur le chiffre d'affaires après abattement forfaitaire (ou par versement libératoire).", SCI_IR: "Les revenus de la SCI sont imposés au nom de chaque associé, dans la catégorie des revenus fonciers (déclaration 2072 puis 2044).", ASSO: "L'association n'est imposée que sur ses revenus patrimoniaux (formulaire 2070-SD), sauf activité lucrative." }[lt];
  return `<div class="pg-h"><div><h1>Imposition du résultat</h1><p class="lead">${esc(FISCAL_LIB[lt] || "")}</p></div>${exSelect()}</div>
  <section class="card"><div class="card-b"><p style="margin-top:0">${txt}</p><div class="kv"><span>Résultat comptable</span><b class="mono">${eur(r.resAvIS)}</b><span>Réintégrations</span><b class="mono">${eur(r.totR)}</b><span>Déductions</span><b class="mono">${eur(r.totD)}</b><span class="tot">Résultat fiscal</span><b class="tot mono">${eur(r.rf)}</b></div>
  <div class="row" style="margin-top:14px"><button class="btn pri" data-act="go" data-v="exports">Préparer la déclaration ${esc((LIASSES[lt] || {}).forms ? LIASSES[lt].forms[0][0] : "")}</button></div></div></section>`;
};
/* Parcours du créateur */
const PARCOURS = ["Choisir le statut juridique et le régime fiscal", "Déposer le capital social sur un compte bloqué", "Signer les statuts et publier l'annonce légale", "Immatriculer l'entreprise sur le guichet unique (INPI)", "Ouvrir un compte bancaire professionnel", "Choisir le régime de TVA (franchise, réel simplifié, réel normal)", "Souscrire les assurances professionnelles", "Comptabiliser le capital et les frais de constitution", "Choisir sa plateforme agréée de facturation électronique"];
function parcoursCard() {
  if (S.activite !== "createur") return ""; S.parcours ||= []; const n = S.parcours.filter(Boolean).length; if (n === PARCOURS.length) return "";
  return `<section class="card"><div class="card-h"><h2>${actIco("createur", "sm")} Parcours de création</h2><span class="pill ${n >= 6 ? "ok" : "warn"}">${n} / ${PARCOURS.length}</span></div><div class="card-b parcours">${PARCOURS.map((p, i) => `<label class="chk"><input type="checkbox" id="pc-${i}" data-ch="parcours" data-i="${i}" ${S.parcours[i] ? "checked" : ""}> ${p}</label>`).join("")}
  <div class="row" style="margin-top:10px"><button class="btn sm" data-act="ecrCapital">Comptabiliser le capital et les frais</button></div></div></section>`;
}
const _dash = VIEWS.dashboard;
VIEWS.dashboard = () => { const h = _dash(); const pc = parcoursCard(); return pc ? h.replace('<section class="card mods">', pc + '<section class="card mods">') : h; };
const _params = VIEWS.params;
VIEWS.params = () => {
  const p = profil(); const h = _params();
  const card = `<section class="card" style="margin-bottom:16px"><div class="card-h"><h2>${actIco(S.activite || "tpe", "sm")} Activité et régimes</h2></div><div class="card-b grid g3">
    <label class="f">Type d'activité<select class="in" id="p-act" data-ch="param" data-f="activite">${Object.entries(ACTIVITES).filter(([k]) => actAllowed(k) || k === S.activite).map(([k, a]) => `<option value="${k}" ${k === S.activite ? "selected" : ""}>${a.lib}</option>`).join("")}</select></label>
    <label class="f">Régime d'imposition du résultat<select class="in" id="p-fis" data-ch="param" data-f="fiscal">${Object.keys(FISCAL_LIB).map(k => `<option value="${k}" ${k === defaultLiasse() ? "selected" : ""}>${FISCAL_LIB[k]}</option>`).join("")}</select></label>
    <label class="f">Régime de TVA<select class="in" id="p-tva2" data-ch="param" data-f="regimeTVA">${Object.keys(TVA_LIB).map(k => `<option value="${k}" ${k === S.regimeTVA ? "selected" : ""}>${TVA_LIB[k]}</option>`).join("")}</select></label>
    ${S.fiscal === "MICRO" || S.fiscal === "BNC" ? `<label class="f">Nature de l'activité<select class="in" id="p-nat" data-ch="param" data-f="naturePro"><option value="BIC" ${S.naturePro !== "BNC" ? "selected" : ""}>Commerciale ou artisanale (BIC)</option><option value="BNC" ${S.naturePro === "BNC" ? "selected" : ""}>Libérale (BNC)</option></select></label>` : ""}
  </div><p class="small muted card-b" style="margin:0;padding-top:0">${esc(p.desc)}</p></section>`;
  return h.replace('<div class="grid g2">', card + '<div class="grid g2">');
};
function actAllowed(k) { const a = UI.access; if (!a || !a.offres || !a.offres.length || a.offres.includes("*")) return true; return a.offres.includes(k); }

/* ---------- Création d'une société : choix de l'activité ---------- */
const SACT = {
  newSoc: () => { const max = UI.access && +UI.access.maxSoc; if (max && (INDEX.dossiers || []).filter(x => !x.demo).length >= max) { toast("Votre licence est limitée à " + max + " société(s). Contactez l'administrateur."); return; } openModal({ type: "dossiers", d: { activite: "" } }); },
  pickAct: el => { const k = el.dataset.k; const p = profil(k); const y = todayISO().slice(0, 4); const debut = k === "createur" ? todayISO() : y + "-01-01"; const fin = k === "createur" && todayISO().slice(5) > "06-30" ? (+y + 1) + "-12-31" : y + "-12-31"; UI.modal.d = { activite: k, nom: "", forme: p.def.forme, fiscal: p.def.fiscal, regimeTVA: p.def.regimeTVA, capital: p.def.capital || 0, siren: "", debut, fin, naturePro: "BIC" }; render(); },
  backAct: () => { UI.modal.d = { activite: "" }; render(); },
  createDossier: async () => { const d = UI.modal.d; await Store.flush(); const n = newDossier(Object.assign({}, d, { regimeIS: d.fiscal === "IS_RN" || d.fiscal === "BIC_RN" ? "RN" : "RS", modeles: profilModeles(d.activite) })); n.capital = d.capital || 0; if (d.activite === "association") { n.tiers = []; } setDossier(n, []); saveAll(); await saveIndex(); go("params"); toast(profil(d.activite).lib + " : société créée. Complétez son identité puis saisissez vos à-nouveaux (journal AN)."); }
};
const _rm5 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "dossiers") {
    const d = M.d;
    if (!d.activite) return modalFrame("Nouvelle société - type d'activité", `<p style="margin-top:0" class="lead">Choisissez le profil : ${esc(CONFIG.branding.nom)} adapte le plan comptable, les régimes fiscaux, les déclarations et les modèles de saisie.</p>
      <div class="actgrid">${Object.keys(ACTIVITES).filter(actAllowed).map(k => { const p = profil(k); return `<button class="actcard" data-act="pickAct" data-k="${k}">${actIco(k)}<span><b>${esc(p.lib)}</b><small>${esc(p.desc)}</small></span></button>`; }).join("")}</div>`,
      `<label class="btn">Restaurer une sauvegarde<input type="file" accept=".json,application/json" id="restoreFile2" data-ch="restore" hidden></label><button class="btn" data-act="loadDemo">Recharger la démonstration</button><button class="btn" data-act="closeModal">Annuler</button>`, true);
    const p = profil(d.activite);
    return modalFrame(`${actIco(d.activite, "sm")} Nouvelle société - ${esc(p.lib)}`, `<div class="grid g2">${mIn("nom", d.activite === "association" ? "Nom de l'association" : d.activite === "independant" ? "Nom ou nom commercial" : "Dénomination", d.nom, 'data-autofocus placeholder="' + (d.activite === "association" ? "Les Amis du Quartier" : "Ma société") + '"')}${mSel("forme", "Forme", d.forme, p.formes.map(x => [x, x]))}
      ${mIn("siren", d.activite === "association" ? "SIREN ou RNA" : "SIREN", d.siren, 'maxlength="10"')}${d.activite === "association" || d.activite === "independant" ? "<div></div>" : mAmt("capital", "Capital social", d.capital)}
      ${mIn("debut", "Début du premier exercice", d.debut, 'type="date"')}${mIn("fin", "Fin du premier exercice", d.fin, 'type="date"')}
      ${mSel("fiscal", "Imposition du résultat", d.fiscal, p.fiscal.map(x => [x, FISCAL_LIB[x]]))}${mSel("regimeTVA", "Régime de TVA", d.regimeTVA, p.tva.map(x => [x, TVA_LIB[x]]))}
      ${d.fiscal === "MICRO" || d.fiscal === "BNC" ? mSel("naturePro", "Nature de l'activité", d.naturePro, [["BIC", "Commerciale ou artisanale (BIC)"], ["BNC", "Libérale (BNC)"]]) : ""}</div>
      ${d.activite === "createur" ? `<p class="small muted">Le premier exercice peut durer jusqu'à 24 mois. Un parcours de création s'affichera sur le tableau de bord.</p>` : ""}${d.activite === "association" ? `<p class="small muted">Plan comptable associatif activé : fonds propres (102, 103), fonds dédiés (19), cotisations (756), dons (754), contributions volontaires en nature (86, 87).</p>` : ""}`,
      `<button class="btn" data-act="backAct">Changer d'activité</button><button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="createDossier" ${d.nom && d.debut && d.fin && d.fin > d.debut ? "" : "disabled"}>Créer</button>`, true);
  }
  if (M && M.type === "help" && CONFIG.textes.guide) return modalFrame("Guide " + esc(CONFIG.branding.nom), `<div class="small" style="white-space:pre-wrap;font-size:13.5px;line-height:1.6">${esc(CONFIG.textes.guide)}</div>`, `<button class="btn pri" data-act="closeModal">Compris</button>`);
  return _rm5();
};
