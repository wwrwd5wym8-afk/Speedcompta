/* ============================================================
   Fiscalité › ECF — Examen de conformité fiscale
   (décret n° 2021-25 et arrêté du 13 janvier 2021 : cahier des charges en 10 points)
   ============================================================ */
const ECF_PTS = [
  [1, "Conformité du fichier des écritures comptables (FEC)", "Art. L. 47 A-I du LPF et A. 47 A-1 : structure, champs obligatoires, séquentialité, écritures validées.", "Contrôler la structure du FEC (18 champs), la numérotation continue, les dates de validation, l'équilibre de chaque écriture et l'absence d'écritures en brouillard à la clôture."],
  [2, "Qualité comptable du FEC au regard des principes comptables", "Respect du PCG : soldes anormaux, comptes d'attente, rapprochement bancaire.", "Analyser les soldes anormaux (classes 6 et 7, banques, tiers), les comptes d'attente 47 non soldés, les écritures sans pièce et le rapprochement bancaire."],
  [3, "Logiciel ou système de caisse certifié", "Art. 286 I 3° bis du CGI : certificat ou attestation individuelle de l'éditeur.", "Obtenir le certificat (NF 525, LNE…) ou l'attestation individuelle de l'éditeur pour chaque logiciel ou système de caisse utilisé pour des clients non assujettis."],
  [4, "Règles de délai et de mode de conservation des documents", "Art. L. 102 B du LPF : 6 ans, forme électronique pour les documents établis électroniquement.", "Vérifier les modalités d'archivage (factures, pièces, FEC), la durée de conservation et la forme électronique des documents dématérialisés."],
  [5, "Régime d'imposition (IS et TVA) au regard de l'activité et du chiffre d'affaires", "Seuils du régime simplifié, régime réel, franchise en base de TVA.", "Rapprocher le chiffre d'affaires et l'activité des seuils légaux et des régimes déclarés (IS et TVA), vérifier les options exercées."],
  [6, "Règles de détermination des amortissements et traitement fiscal", "Art. 39-1-2° du CGI : base, durée d'usage, mode, amortissements excédentaires (39-4).", "Rapprocher le tableau des immobilisations des comptes 2x/28x et des dotations 681x ; contrôler durées, modes et réintégrations (véhicules de tourisme)."],
  [7, "Règles de détermination des provisions et traitement fiscal", "Art. 39-1-5° du CGI : perte probable, précisément indiquée, constatée en comptabilité.", "Lister les provisions (15x, 29x, 39x, 49x) et dotations, vérifier leur justification et identifier les provisions non déductibles à réintégrer."],
  [8, "Règles de détermination des charges à payer et traitement fiscal", "Charges certaines dans leur principe et leur montant (rattachement à l'exercice).", "Contrôler les comptes 408, 428, 438, 4486, 4686 : justification, rattachement à l'exercice et déductibilité."],
  [9, "Qualification et déductibilité des charges exceptionnelles", "Comptes 67x : pénalités et amendes non déductibles (art. 39-2 du CGI).", "Analyser les comptes 67x, isoler les amendes, pénalités et charges non déductibles et vérifier leur réintégration extra-comptable."],
  [10, "Respect des règles d'exigibilité en matière de TVA", "Art. 269 du CGI : livraisons de biens à la livraison, prestations de services à l'encaissement (sauf option débits).", "Contrôler l'exigibilité de la TVA collectée (biens / services, option sur les débits), la TVA sur encaissements en attente et la concordance CA / TVA déclarée."]
];
const ECF_ST = { nc: ["À examiner", "#64748B"], ok: ["Conforme", "#059669"], ko: ["Non conforme", "#DC2626"], na: ["Non applicable", "#7C8DB5"] };
const ECF_QUAL = ["Expert-comptable", "Commissaire aux comptes", "Organisme de gestion agréé (OGA)", "Centre de gestion agréé", "Association de gestion et de comptabilité (AGC)"];

const ECF_TPL0 = {
  lm: ["Lettre de mission ECF", `LETTRE DE MISSION — EXAMEN DE CONFORMITÉ FISCALE

{{prestataire}}
{{qualite}}
{{prest_adresse}}

À l'attention de la direction de {{societe}}
SIREN {{siren}} — {{adresse}}

Fait à {{ville}}, le {{date_lettre}}

Objet : examen de conformité fiscale de l'exercice du {{debut}} au {{fin}}

Madame, Monsieur,

Vous avez souhaité nous confier la réalisation d'un examen de conformité fiscale (ECF) portant sur l'exercice ouvert le {{debut}} et clos le {{fin}}, dans le cadre du décret n° 2021-25 du 13 janvier 2021 et de l'arrêté du même jour fixant le cahier des charges.

1. Nature et étendue de la mission
Notre mission porte exclusivement sur les dix points du cahier des charges :
{{liste_points}}

Il ne s'agit ni d'un audit, ni d'une mission de certification des comptes. Les diligences sont mises en œuvre par sondages, sur la base des documents et informations que vous nous communiquerez.

2. Vos engagements
Vous vous engagez à mettre à notre disposition l'ensemble des documents nécessaires (FEC, pièces justificatives, contrats, certificats de logiciel de caisse, déclarations fiscales) et à nous informer de tout fait susceptible d'avoir une incidence sur la mission.

3. Restitution
À l'issue de nos travaux, nous établirons un compte rendu de mission, conforme au modèle fixé par l'arrêté, que nous vous remettrons et que nous transmettrons à l'administration fiscale par voie dématérialisée au plus tard le 31 octobre suivant le dépôt de la déclaration de résultats (exercices clos au 31 décembre) ou dans les six mois suivant ce dépôt dans les autres cas. Le recours à l'ECF sera mentionné sur votre déclaration de résultats.

4. Honoraires
Nos honoraires sont fixés à {{honoraires}} HT, payables à réception de facture.

5. Durée
La présente mission est conclue pour l'exercice mentionné ci-dessus. Elle est reconductible chaque année par accord exprès.

Nous vous remercions de bien vouloir nous retourner un exemplaire de la présente lettre revêtu de votre signature et de la mention « Bon pour accord ».

Pour {{prestataire}}                         Pour {{societe}}
{{signataire}}                               Le représentant légal`],
  cr: ["Compte rendu de mission", `COMPTE RENDU DE MISSION — EXAMEN DE CONFORMITÉ FISCALE
(décret n° 2021-25 et arrêté du 13 janvier 2021)

Prestataire : {{prestataire}} — {{qualite}}
{{prest_adresse}}

Entreprise examinée : {{societe}} — SIREN {{siren}}
Adresse : {{adresse}}
Exercice examiné : du {{debut}} au {{fin}}
Lettre de mission signée le : {{date_lettre}}

Résultat des diligences sur les dix points du cahier des charges :
{{tableau_points}}

Points de non-conformité relevés :
{{points_nc}}

Conclusion :
{{conclusion}}

Le présent compte rendu est remis à l'entreprise et transmis à l'administration fiscale.

Fait le {{date}}
{{signataire}}, pour {{prestataire}}`],
  mention: ["Mention sur la déclaration de résultats", `Mention à porter sur la déclaration de résultats de l'exercice clos le {{fin}} :

L'entreprise {{societe}} (SIREN {{siren}}) a fait réaliser un examen de conformité fiscale par {{prestataire}} ({{qualite}}), en application du décret n° 2021-25 du 13 janvier 2021. Cocher la case « Examen de conformité fiscale » du formulaire de déclaration de résultats et indiquer l'identité du prestataire dans le cadre prévu.`],
  reco: ["Lettre de recommandations", `{{prestataire}}
{{prest_adresse}}

{{societe}}
À l'attention de la direction

Le {{date}}

Objet : examen de conformité fiscale — exercice clos le {{fin}} — recommandations

Madame, Monsieur,

À l'issue de nos travaux d'examen de conformité fiscale, nous avons relevé les points suivants, qui appellent de votre part des mesures correctives :

{{points_nc}}

Nous vous recommandons de régulariser ces situations avant le dépôt de la déclaration de résultats ou, le cas échéant, au moyen d'une déclaration rectificative. Nous restons à votre disposition pour vous accompagner dans leur mise en œuvre.

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

{{signataire}}`],
  pieces: ["Liste des documents à fournir", `EXAMEN DE CONFORMITÉ FISCALE — DOCUMENTS À NOUS TRANSMETTRE
{{societe}} — exercice du {{debut}} au {{fin}}

1. Fichier des écritures comptables (FEC) de l'exercice
2. Certificat ou attestation individuelle de l'éditeur du logiciel ou du système de caisse
3. Description des modalités d'archivage et de conservation des pièces (papier et électronique)
4. Déclarations de TVA de l'exercice et justificatif de l'option sur les débits, le cas échéant
5. Tableau des immobilisations et des amortissements
6. Justificatifs des provisions (litiges, créances douteuses, dépréciations de stocks)
7. Justificatifs des charges à payer (factures non parvenues, congés payés, primes, organismes sociaux)
8. Détail et justificatifs des charges exceptionnelles (comptes 67)
9. Dernière déclaration de résultats et ses annexes
10. Statuts à jour et procès-verbaux d'approbation des comptes

Merci de nous transmettre ces éléments avant le {{date_limite}}.`]
};

/* ---------------- état ---------------- */
function ECF() { const ex = exCur(); const A = S.ecf ||= {}; const M = A[ex.id] ||= {}; M.mission ||= {}; M.pts ||= {}; M.cr ||= {}; return M; }
function ECFT() { const T = S.ecfTpl ||= {}; for (const k in ECF_TPL0) T[k] ||= { titre: ECF_TPL0[k][0], txt: ECF_TPL0[k][1], base: true }; return T; }
const ecfY = () => exCur().id.replace("EX", "");
const ecfDeadline = ex => { const y = Number(ex.fin.slice(0, 4)); return ex.fin.slice(5) === "12-31" ? (y + 1) + "-10-31" : addMonths(addMonths(ex.fin, 3), 6); };

/* ---------------- diligences automatiques (liées à la comptabilité) ---------------- */
function ecfAuto(ex) {
  const m = soldeMap(ex.debut, ex.fin); const L = E.filter(e => e.date >= ex.debut && e.date <= ex.fin);
  const sp = p => Object.keys(m).filter(c => c.startsWith(p)).reduce((a, c) => a + m[c], 0);
  const any = p => Object.keys(m).some(c => c.startsWith(p) && m[c]);
  const ca = -Object.keys(m).filter(c => /^70/.test(c)).reduce((a, c) => a + m[c], 0);
  const out = {};
  // 1. FEC
  const br = L.filter(e => e.statut !== "valide").length; const desq = L.filter(e => { const d = e.lignes.reduce((a, l) => a + l.debit - l.credit, 0); return d !== 0; }).length;
  const noPiece = L.filter(e => !e.piece).length; const hors = E.filter(e => e.statut === "valide" && (e.date < ex.debut || e.date > ex.fin) && false).length;
  out[1] = { items: [[br ? "ko" : "ok", br ? br + " écriture(s) non validée(s) (brouillard) : le FEC doit être produit à partir d'écritures validées." : "Toutes les écritures de l'exercice sont validées."], [desq ? "ko" : "ok", desq ? desq + " écriture(s) déséquilibrée(s)." : "Toutes les écritures sont équilibrées."], [noPiece ? "warn" : "ok", noPiece ? noPiece + " écriture(s) sans référence de pièce (champ PieceRef)." : "Chaque écriture porte une référence de pièce."], [ex.fecDef ? "ok" : "warn", ex.fecDef ? "FEC définitif généré à la clôture." : "FEC définitif non encore généré (clôture à réaliser)."]], sugg: br || desq ? "ko" : "ok" };
  // 2. Qualité comptable
  const ab = []; for (const c in m) { const v = m[c]; if (!v) continue; if (c[0] === "6" && v < -100) ab.push(c + " créditeur"); if (c[0] === "7" && v > 100) ab.push(c + " débiteur"); if (/^53/.test(c) && v < 0) ab.push(c + " (caisse) créditeur"); }
  const att = sp("47"); out[2] = { items: [[ab.length ? "warn" : "ok", ab.length ? ab.length + " solde(s) anormal(aux) : " + ab.slice(0, 6).join(", ") + (ab.length > 6 ? "…" : "") : "Aucun solde anormal sur les classes 5, 6 et 7."], [att ? "ko" : "ok", att ? "Comptes d'attente 47 non soldés : " + eur(Math.abs(att)) + "." : "Comptes d'attente 47 soldés."], [sp("512") < 0 ? "warn" : "ok", sp("512") < 0 ? "Banque créditrice : " + eur(-sp("512")) + " (à reclasser en concours bancaires)." : "Soldes bancaires débiteurs."]], sugg: att ? "ko" : ab.length ? "nc" : "ok" };
  // 3. Caisse
  const cash = L.some(e => e.lignes.some(l => /^53/.test(l.compte))); const M = ECF();
  out[3] = { items: [[cash ? (M.pts[3] && M.pts[3].cert ? "ok" : "warn") : "ok", cash ? "Mouvements de caisse (53x) constatés : un certificat ou une attestation d'éditeur est requis si des ventes sont encaissées auprès de particuliers." : "Aucun mouvement de caisse : point probablement non applicable."]], sugg: cash ? "nc" : "na", cash };
  // 4. Conservation
  const docs = (S.documents || []).length; const withDoc = L.filter(e => e.doc || e.docId || (e.pj && e.pj.length)).length;
  out[4] = { items: [["warn", docs + " document(s) archivé(s) dans le dossier ; " + withDoc + " écriture(s) sur " + L.length + " liées à une pièce numérisée."], ["warn", "Durée légale de conservation : 6 ans (art. L. 102 B du LPF), 10 ans pour les documents comptables (Code de commerce)."]], sugg: "nc" };
  // 5. Régime
  const reg = S.regimeTVA || ""; const isr = S.regimeIS || ""; const serv = sp("706") && Math.abs(sp("706")) > Math.abs(sp("707"));
  const seuil = serv ? 25400000 : 84000000; const it5 = [["ok", "Chiffre d'affaires de l'exercice : " + eur(ca) + " (activité " + (serv ? "de prestations de services" : "de ventes") + ")."]];
  if (reg === "FRANCHISE" && ca > (serv ? 3750000 : 8500000)) it5.push(["ko", "Franchise en base de TVA déclarée alors que le CA dépasse le seuil de franchise."]);
  if ((reg === "RSI" || isr === "RS") && ca > seuil) it5.push(["ko", "Régime simplifié déclaré alors que le CA dépasse " + eur0(seuil) + " : passage au réel normal."]);
  else it5.push(["ok", "Régimes déclarés : TVA " + ({ RN_M: "réel normal mensuel", RN_T: "réel normal trimestriel", RSI: "réel simplifié", FRANCHISE: "franchise en base" }[reg] || reg || "non renseigné") + " · IS " + ({ RS: "réel simplifié", RN: "réel normal" }[isr] || isr || "non renseigné") + "."]);
  out[5] = { items: it5, sugg: it5.some(x => x[0] === "ko") ? "ko" : "ok" };
  // 6. Amortissements
  const im = (S.immos || []); const imBrut = im.reduce((a, x) => a + (x.valeur || 0), 0); const c2 = Object.keys(m).filter(c => /^2[0-3]/.test(c)).reduce((a, c) => a + m[c], 0);
  const dot = sp("6811"); const vt = im.filter(x => /^2182/.test(x.compte || "")).length;
  out[6] = { items: [[Math.abs(imBrut - c2) > 100 && im.length ? "warn" : "ok", im.length ? "Tableau des immobilisations : " + eur(imBrut) + " · comptes 20-23 : " + eur(c2) + (Math.abs(imBrut - c2) > 100 ? " (écart " + eur(c2 - imBrut) + ")." : " (concordant).") : "Aucune immobilisation au registre ; comptes 20-23 : " + eur(c2) + "."], ["ok", "Dotations aux amortissements (6811) : " + eur(dot) + "."], [vt ? "warn" : "ok", vt ? vt + " véhicule(s) (2182) : vérifier le plafond de déductibilité et la réintégration sur l'imprimé 2058-A / 2033-B." : "Aucun véhicule de tourisme identifié."]], sugg: "nc" };
  // 7. Provisions
  const pv = ["15", "29", "39", "49"].map(p => [p, sp(p)]).filter(x => x[1]); const dp = sp("6815") + sp("6816") + sp("6817") + sp("6865") + sp("6866") + sp("6875");
  out[7] = { items: [[pv.length ? "warn" : "ok", pv.length ? "Provisions et dépréciations au bilan : " + pv.map(([p, v]) => p + "x " + eur(Math.abs(v))).join(" · ") + "." : "Aucune provision ni dépréciation constatée."], ["ok", "Dotations de l'exercice : " + eur(dp) + "."]], sugg: pv.length ? "nc" : "na" };
  // 8. Charges à payer
  const cap = ["408", "428", "438", "4486", "4686"].map(p => [p, sp(p)]).filter(x => x[1]);
  out[8] = { items: [[cap.length ? "warn" : "ok", cap.length ? "Charges à payer : " + cap.map(([p, v]) => p + " " + eur(Math.abs(v))).join(" · ") + " — justificatifs à rapprocher." : "Aucune charge à payer comptabilisée : vérifier l'exhaustivité (factures non parvenues, congés payés)."]], sugg: "nc" };
  // 9. Charges exceptionnelles
  const ce = Object.keys(m).filter(c => /^67/.test(c) && m[c]).map(c => [c, m[c]]); const pen = ce.filter(([c]) => /^6712/.test(c)).reduce((a, x) => a + x[1], 0);
  out[9] = { items: [[ce.length ? "warn" : "ok", ce.length ? "Charges exceptionnelles : " + ce.map(([c, v]) => c + " " + eur(v)).join(" · ") + "." : "Aucune charge exceptionnelle (67x)."], [pen ? "ko" : "ok", pen ? "Pénalités et amendes (6712) : " + eur(pen) + " — non déductibles, à réintégrer." : "Aucune pénalité ou amende identifiée."]], sugg: pen ? "ko" : ce.length ? "nc" : "na" };
  // 10. Exigibilité TVA
  const col = -sp("4457"); const enAtt = sp("44574") + sp("44587"); const opt = !!S.optionTVA;
  const it10 = [["ok", "TVA collectée de l'exercice (4457) : " + eur(col) + (ca ? " · soit " + (col / ca * 100).toFixed(1).replace(".", ",") + " % du CA HT." : ".")]];
  if (serv && !opt) it10.push([enAtt ? "ok" : "warn", enAtt ? "TVA sur encaissements en attente suivie (44574 / 44587)." : "Prestations de services sans option sur les débits : la TVA est exigible à l'encaissement — vérifier la TVA sur créances clients non encaissées."]);
  else it10.push(["ok", opt ? "Option pour le paiement de la TVA d'après les débits exercée." : "Livraisons de biens : TVA exigible à la livraison."]);
  out[10] = { items: it10, sugg: "nc" };
  return out;
}

/* ---------------- variables des modèles ---------------- */
function ecfVars() { const ex = exCur(); const M = ECF(); const mi = M.mission; const A = ecfAuto(ex);
  const st = n => (M.pts[n] && M.pts[n].st) || A[n].sugg || "nc";
  const nc = ECF_PTS.filter(p => st(p[0]) === "ko").map(p => "- Point " + p[0] + " — " + p[1] + (M.pts[p[0]] && M.pts[p[0]].obs ? " : " + M.pts[p[0]].obs : "")).join("\n") || "Aucun point de non-conformité n'a été relevé.";
  return { societe: S.nom || "", siren: S.siren || "", adresse: S.adresse || "", exercice: ecfY(), debut: frDate(ex.debut), fin: frDate(ex.fin), prestataire: mi.prest || "[Nom du prestataire]", qualite: mi.qualite || ECF_QUAL[0], prest_adresse: mi.prestAdr || "", ville: mi.ville || "", date_lettre: mi.dateLM ? frDate(mi.dateLM) : "[date]", honoraires: mi.hono ? eur(mi.hono) : "[montant]", signataire: mi.sign || "[Signataire]", date: frDate(todayISO()), date_limite: frDate(addDays(todayISO(), 21)), conclusion: M.cr.conclusion || ecfConcl(),
    liste_points: ECF_PTS.map(p => "  " + p[0] + ". " + p[1]).join("\n"), tableau_points: ECF_PTS.map(p => "  " + p[0] + ". " + p[1] + " : " + ECF_ST[st(p[0])][0] + (M.pts[p[0]] && M.pts[p[0]].obs ? " — " + M.pts[p[0]].obs : "")).join("\n"), points_nc: nc }; }
function ecfConcl() { const M = ECF(); const A = ecfAuto(exCur()); const ko = ECF_PTS.filter(p => ((M.pts[p[0]] && M.pts[p[0]].st) || A[p[0]].sugg) === "ko").length;
  return ko ? "Sur la base des diligences mises en œuvre, " + ko + " point(s) de non-conformité ont été relevé(s) ; ils sont détaillés ci-dessus et ont fait l'objet d'une lettre de recommandations." : "Sur la base des diligences mises en œuvre, aucun point de non-conformité n'a été relevé sur les dix points du cahier des charges."; }
const ecfFill = t => { const V = ecfVars(); return String(t || "").replace(/\{\{(\w+)\}\}/g, (a, k) => V[k] != null ? V[k] : a); };

/* ---------------- vue ---------------- */
const ECF_TABS = [["mission", "📋 Mission"], ["pts", "✓ Cahier des charges · 10 points"], ["cr", "📨 Compte rendu"], ["tpl", "✎ Modèles"]];
VIEWS.ecf = () => {
  const ex = exCur(); const M = ECF(); const st = (UI.sub.ecf ||= { t: "mission" }); const A = ecfAuto(ex); const T = ECFT();
  const stOf = n => (M.pts[n] && M.pts[n].st) || A[n].sugg || "nc"; const cnt = k => ECF_PTS.filter(p => stOf(p[0]) === k).length;
  const dl = ecfDeadline(ex); const done = ECF_PTS.filter(p => M.pts[p[0]] && M.pts[p[0]].st).length;
  let h = `<div class="pg-h"><div><div class="eyebrow">Fiscalité · ${esc(S.nom)}</div><h1>ECF — Examen de conformité fiscale</h1><p class="lead">Mission sur les 10 points du cahier des charges (décret n° 2021-25 et arrêté du 13 janvier 2021), exercice ${ecfY()}. Les contrôles sont calculés depuis la comptabilité ; vous gardez la main sur chaque conclusion et chaque modèle.</p></div><div class="row"><button class="btn" data-act="ecfXls">⇩ Excel</button><button class="btn" data-act="ecfDoc" data-k="cr" data-f="docx">⇩ Word</button><button class="btn pri" data-act="ecfDoc" data-k="cr" data-f="pdf">⇩ Compte rendu PDF</button></div></div>`;
  h += f2Kpi([["Points revus", done + " / 10", done === 10 ? "ok" : ""], ["Conformes", String(cnt("ok")), "ok"], ["Non conformes", String(cnt("ko")), cnt("ko") ? "neg" : ""], ["Compte rendu à transmettre avant le", frDate(dl), M.cr.envoye ? "ok" : ""]]);
  h += `<div class="f2-sub">${ECF_TABS.map(([k, l]) => `<button class="${st.t === k ? "on" : ""}" data-act="ecfTab" data-t="${k}">${l}</button>`).join("")}</div>`;
  const inp = (f, lab, o = {}) => `<label class="ecf-f ${o.w || ""}"><span>${lab}</span>${o.sel ? `<select class="in" data-ch="ecfMi" data-f="${f}">${o.sel.map(x => `<option ${M.mission[f] === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>` : `<input class="in ${o.num ? "num" : ""}" type="${o.type || "text"}" value="${esc(o.num ? (M.mission[f] ? toIn(M.mission[f]) : "") : M.mission[f] || "")}" placeholder="${esc(o.ph || "")}" data-ch="ecfMi" data-f="${f}">`}</label>`;
  if (st.t === "mission") {
    h += `<section class="card"><div class="card-h"><h3>Prestataire et lettre de mission</h3></div><div class="ecf-g">${inp("prest", "Prestataire (cabinet)", { ph: "Cabinet …" })}${inp("qualite", "Qualité", { sel: ECF_QUAL })}${inp("sign", "Signataire", { ph: "Nom, fonction" })}${inp("prestAdr", "Adresse du prestataire", { w: "w2" })}${inp("ville", "Ville de signature")}${inp("dateLM", "Lettre de mission signée le", { type: "date" })}${inp("hono", "Honoraires HT", { num: 1 })}</div></section>`;
    h += `<section class="card"><div class="card-h"><h3>Calendrier de la mission ${ecfY()}</h3></div><div class="tw"><table class="t"><tbody>
      <tr><td>Lettre de mission signée</td><td class="r">${M.mission.dateLM ? `<span class="pill ok">${frDate(M.mission.dateLM)}</span>` : `<span class="pill warn">À signer</span>`}</td><td class="r"><button class="btn sm" data-act="ecfDoc" data-k="lm" data-f="docx">Word</button> <button class="btn sm" data-act="ecfDoc" data-k="lm" data-f="pdf">PDF</button></td></tr>
      <tr><td>Clôture de l'exercice</td><td class="r">${ex.cloture ? `<span class="pill ok">Clôturé</span>` : frDate(ex.fin)}</td><td></td></tr>
      <tr><td>Revue des 10 points</td><td class="r">${done}/10</td><td class="r"><button class="btn sm" data-act="ecfTab" data-t="pts">Ouvrir</button></td></tr>
      <tr><td>Mention sur la déclaration de résultats</td><td class="r"><label class="chk"><input type="checkbox" data-ch="ecfCr" data-f="mention" ${M.cr.mention ? "checked" : ""}> Cochée</label></td><td class="r"><button class="btn sm" data-act="ecfDoc" data-k="mention" data-f="pdf">Texte</button></td></tr>
      <tr><td>Compte rendu transmis à la DGFiP <div class="small muted">Au plus tard le ${frDate(dl)}</div></td><td class="r"><input class="in sm" type="date" value="${esc(M.cr.envoye || "")}" data-ch="ecfCr" data-f="envoye"></td><td class="r"><button class="btn sm" data-act="ecfTab" data-t="cr">Préparer</button></td></tr>
    </tbody></table></div></section>`;
  }
  if (st.t === "pts") {
    h += ECF_PTS.map(([n, lib, ref, dil]) => { const P = M.pts[n] || {}; const s = stOf(n); const a = A[n];
      return `<section class="card ecf-pt"><div class="ecf-pt-h"><span class="ecf-n">${n}</span><div style="flex:1"><b>${esc(lib)}</b><div class="small muted">${esc(ref)}</div></div><select class="in sm ecf-st" style="border-color:${ECF_ST[s][1]};color:${ECF_ST[s][1]}" data-ch="ecfPt" data-n="${n}" data-f="st">${Object.entries(ECF_ST).map(([k, v]) => `<option value="${k}" ${s === k ? "selected" : ""}>${v[0]}</option>`).join("")}</select></div>
        <div class="ecf-auto">${a.items.map(([c, t]) => `<div class="ecf-i ${c}"><span>${c === "ok" ? "✓" : c === "ko" ? "✕" : "!"}</span>${esc(t)}</div>`).join("")}${!P.st ? `<div class="small muted" style="margin-top:4px">Statut proposé d'après la comptabilité : <b>${ECF_ST[a.sugg][0]}</b> — modifiable.</div>` : ""}</div>
        ${n === 3 ? `<label class="chk" style="margin:6px 0"><input type="checkbox" data-ch="ecfPt" data-n="3" data-f="cert" ${P.cert ? "checked" : ""}> Certificat ou attestation de l'éditeur obtenu</label>` : ""}
        <div class="ecf-g2"><label class="ecf-f"><span>Diligences réalisées</span><textarea class="in" rows="3" data-ch="ecfPt" data-n="${n}" data-f="dil">${esc(P.dil != null ? P.dil : dil)}</textarea></label><label class="ecf-f"><span>Observations / constat</span><textarea class="in" rows="3" placeholder="Constat, pièces examinées, régularisation demandée…" data-ch="ecfPt" data-n="${n}" data-f="obs">${esc(P.obs || "")}</textarea></label></div></section>`; }).join("");
  }
  if (st.t === "cr") {
    h += `<section class="card"><div class="card-h"><h3>Synthèse des 10 points</h3><div class="row"><button class="btn sm" data-act="ecfDoc" data-k="reco" data-f="docx">Lettre de recommandations (Word)</button></div></div><div class="tw"><table class="t"><thead><tr><th>#</th><th>Point du cahier des charges</th><th>Conclusion</th><th>Observations</th></tr></thead><tbody>${ECF_PTS.map(([n, lib]) => { const s = stOf(n); return `<tr><td>${n}</td><td>${esc(lib)}</td><td><span class="pill" style="background:${ECF_ST[s][1]}1A;color:${ECF_ST[s][1]}">${ECF_ST[s][0]}</span></td><td class="small">${esc((M.pts[n] || {}).obs || "")}</td></tr>`; }).join("")}</tbody></table></div></section>
      <section class="card"><div class="card-h"><h3>Conclusion du compte rendu</h3><button class="btn sm ghost" data-act="ecfConclReset">Proposer automatiquement</button></div><div class="card-b"><textarea class="in" rows="4" style="width:100%" data-ch="ecfCr" data-f="conclusion">${esc(M.cr.conclusion || ecfConcl())}</textarea></div></section>
      <section class="card"><div class="card-h"><h3>Aperçu du compte rendu</h3><div class="row"><button class="btn sm" data-act="ecfDoc" data-k="cr" data-f="docx">⇩ Word</button><button class="btn sm pri" data-act="ecfDoc" data-k="cr" data-f="pdf">⇩ PDF</button></div></div><pre class="ecf-prev">${esc(ecfFill(T.cr.txt))}</pre></section>`;
  }
  if (st.t === "tpl") {
    const k = st.k && T[st.k] ? st.k : "lm"; const t = T[k];
    h += `<div class="ecf-tpl"><aside class="card">${Object.entries(T).map(([kk, x]) => `<button class="ecf-tl ${kk === k ? "on" : ""}" data-act="ecfTpl" data-k="${kk}">${esc(x.titre)}${x.base ? "" : ' <span class="small muted">· perso</span>'}</button>`).join("")}<button class="btn sm" style="margin:8px" data-act="ecfTplNew">+ Nouveau modèle</button></aside>
      <section class="card"><div class="card-h"><input class="in" style="font-weight:600;flex:1;max-width:420px" value="${esc(t.titre)}" data-ch="ecfTplT" data-k="${k}"><div class="row">${t.base ? `<button class="btn sm ghost" data-act="ecfTplReset" data-k="${k}">↺ Modèle d'origine</button>` : `<button class="btn sm ghost danger" data-act="ecfTplDel" data-k="${k}">Supprimer</button>`}<button class="btn sm" data-act="ecfDoc" data-k="${k}" data-f="docx">⇩ Word</button><button class="btn sm pri" data-act="ecfDoc" data-k="${k}" data-f="pdf">⇩ PDF</button></div></div>
        <div class="card-b"><div class="small muted" style="margin-bottom:6px">Variables remplies automatiquement : ${Object.keys(ecfVars()).map(v => `<code class="ecf-v" data-act="ecfVar" data-v="${v}">{{${v}}}</code>`).join(" ")}</div><textarea id="ecfTxt" class="in mono" rows="22" style="width:100%;font-size:12.5px;line-height:1.5" data-ch="ecfTplX" data-k="${k}">${esc(t.txt)}</textarea>
        <details style="margin-top:10px"><summary class="small">Aperçu avec les données du dossier</summary><pre class="ecf-prev">${esc(ecfFill(t.txt))}</pre></details></div></section></div>`;
  }
  return h;
};

/* ---------------- exports ---------------- */
function ecfBlocks(k) { const T = ECFT(); const t = T[k]; const txt = ecfFill(t.txt); const blocks = [{ t: "page", title: t.titre, sub: S.nom + " · exercice " + ecfY() }];
  txt.split(/\n{2,}/).forEach(p => { const s = p.trim(); if (!s) return; if (/^[0-9]+\.\s+[^\n]{3,80}$/.test(s.split("\n")[0]) && s.split("\n").length > 1) { blocks.push({ t: "h", text: s.split("\n")[0] }); blocks.push({ t: "p", text: s.split("\n").slice(1).join("\n") }); } else blocks.push({ t: "p", text: s }); });
  if (k === "cr") { const M = ECF(); const A = ecfAuto(exCur()); blocks.push({ t: "h", text: "Tableau des diligences" }); blocks.push({ t: "table", head: ["Point", "Conclusion", "Diligences / observations"], cols: [{ wrap: 1, w: 190 }, { w: 80 }, { wrap: 1, w: 220 }], rows: ECF_PTS.map(([n, lib, , dil]) => { const P = M.pts[n] || {}; return [n + ". " + lib, ECF_ST[P.st || A[n].sugg][0], (P.dil != null ? P.dil : dil) + (P.obs ? " — " + P.obs : "")]; }) }); }
  return { title: t.titre, blocks }; }
const ecfFile = (k, ext) => (S.siren || S.nom.replace(/\W+/g, "")) + "_ECF_" + ecfY() + "_" + k + "." + ext;
Object.assign(F2ACT, {
  ecfTab: el => { (UI.sub.ecf ||= {}).t = el.dataset.t; render(); },
  ecfTpl: el => { (UI.sub.ecf ||= {}).k = el.dataset.k; render(); },
  ecfTplNew: () => { const T = ECFT(); const k = "p" + uid(); T[k] = { titre: "Nouveau modèle", txt: "{{societe}} — exercice du {{debut}} au {{fin}}\n\n" }; (UI.sub.ecf ||= {}).k = k; Store.touch(); render(); },
  ecfTplDel: el => { const T = ECFT(); confirmBox("Supprimer le modèle", "Le modèle « " + esc(T[el.dataset.k].titre) + " » sera supprimé.", "Supprimer", () => { delete T[el.dataset.k]; UI.sub.ecf.k = "lm"; Store.touch(); render(); }, true); },
  ecfTplReset: el => { const k = el.dataset.k; confirmBox("Revenir au modèle d'origine", "Vos modifications de ce modèle seront remplacées par le texte d'origine.", "Rétablir", () => { S.ecfTpl[k] = { titre: ECF_TPL0[k][0], txt: ECF_TPL0[k][1], base: true }; Store.touch(); render(); }); },
  ecfVar: el => { const ta = document.getElementById("ecfTxt"); if (!ta) return; const v = "{{" + el.dataset.v + "}}"; const a = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, a) + v + ta.value.slice(ta.selectionEnd ?? a); ta.focus(); ta.selectionStart = ta.selectionEnd = a + v.length; ECFT()[ta.dataset.k].txt = ta.value; Store.touch(); },
  ecfConclReset: () => { delete ECF().cr.conclusion; Store.touch(); render(); },
  ecfDoc: el => { const k = el.dataset.k, f = el.dataset.f; const d = ecfBlocks(k); try { if (f === "docx") deliverFile(ecfFile(k, "docx"), finDOCX(d.title + " · " + S.nom, d.blocks.slice(1)), "docx", null, { cat: "Fiscalité", lib: d.title }); else deliverFile(ecfFile(k, "pdf"), finPDF(d.title, d.blocks), "pdf", null, { cat: "Fiscalité", lib: d.title }); } catch (e) { toast("Export impossible : " + (e.message || e)); } },
  ecfXls: () => { const M = ECF(); const A = ecfAuto(exCur()); try { deliverFile(ecfFile("diligences", "xlsx"), buildXLSX([{ name: "ECF " + ecfY(), widths: [6, 52, 16, 60, 50, 70], rows: [{ style: "title", cells: ["Examen de conformité fiscale · " + S.nom + " · exercice " + ecfY()] }, { style: "head", cells: ["N°", "Point du cahier des charges", "Conclusion", "Diligences", "Observations", "Contrôles automatiques"] }].concat(ECF_PTS.map(([n, lib, , dil]) => { const P = M.pts[n] || {}; return { cells: [n, lib, ECF_ST[P.st || A[n].sugg][0], P.dil != null ? P.dil : dil, P.obs || "", A[n].items.map(x => x[1]).join(" | ")] }; })) }]), "xlsx"); } catch (e) { toast("Export impossible : " + (e.message || e)); } }
});
Object.assign(F2CHG, {
  ecfMi: el => { const f = el.dataset.f; ECF().mission[f] = f === "hono" ? cents(el.value) : el.value; Store.touch(); if (f === "dateLM" || f === "qualite") render(); },
  ecfPt: el => { const n = el.dataset.n, f = el.dataset.f; const P = ECF().pts[n] ||= {}; P[f] = el.type === "checkbox" ? el.checked : el.value; Store.touch(); if (f === "st" || f === "cert") render(); },
  ecfCr: el => { const f = el.dataset.f; ECF().cr[f] = el.type === "checkbox" ? el.checked : el.value; Store.touch(); if (f !== "conclusion") render(); },
  ecfTplT: el => { ECFT()[el.dataset.k].titre = el.value || "Modèle"; Store.touch(); render(); },
  ecfTplX: el => { ECFT()[el.dataset.k].txt = el.value; Store.touch(); }
});
SPACES.fisc.tabs.push(["ecf", "ECF - Conformité fiscale"]);
/* échéance du compte rendu dans les échéances fiscales */
const _deadlinesEcf = deadlines;
deadlines = function (ex) { const out = _deadlinesEcf.apply(this, arguments); try { const M = (S.ecf || {})[ex.id]; if (M && M.mission && (M.mission.dateLM || M.mission.prest)) out.push({ date: ecfDeadline(ex), lib: "ECF · transmission du compte rendu de mission à la DGFiP", det: M.cr && M.cr.envoye ? "Transmis le " + frDate(M.cr.envoye) : "Examen de conformité fiscale de l'exercice " + ex.id.replace("EX", ""), v: "ecf", done: !!(M.cr && M.cr.envoye) }); } catch (e) { } return out; };
