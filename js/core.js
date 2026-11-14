"use strict";
/* ============================================================
   Speedcompta — moteur comptable (partie double, montants en centimes)
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const plain = v => v == null ? v : JSON.parse(JSON.stringify(v)); // copie modifiable des données lues (elles arrivent en lecture seule)
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const NF = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NF0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const eur = c => NF.format((c || 0) / 100);
const eur0 = c => NF0.format(Math.round((c || 0) / 100)) + " €";
const eurz = c => c ? NF.format(c / 100) : "";
const cents = v => { if (v === "" || v == null) return 0; if (typeof v === "number") return Math.round(v * 100); let s = String(v).replace(/\s| |€/g, ""); if (s.includes(",") && s.includes(".") && s.lastIndexOf(".") > s.lastIndexOf(",")) s = s.replace(/,/g, ""); else if (s.includes(",")) s = s.replace(/\./g, ""); else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ""); s = s.replace(",", "."); const n = parseFloat(s); return isNaN(n) ? 0 : Math.round(n * 100); };
const toIn = c => c ? (c / 100).toFixed(2).replace(".", ",") : "";
const todayISO = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const frDate = iso => iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : "";
const fecDate = iso => iso ? iso.replace(/-/g, "") : "";
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOISL = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const addMonths = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1 + n, 1)); const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); return t.getUTCFullYear() + "-" + String(t.getUTCMonth() + 1).padStart(2, "0") + "-" + String(Math.min(d, last)).padStart(2, "0"); };
const endOfMonth = iso => { const [y, m] = iso.split("-").map(Number); const l = new Date(Date.UTC(y, m, 0)).getUTCDate(); return iso.slice(0, 8) + String(l).padStart(2, "0"); };
const monthsBetween = (a, b) => { const [y1, m1] = a.split("-").map(Number); const [y2, m2] = b.split("-").map(Number); return (y2 - y1) * 12 + (m2 - m1) + 1; };
const days360 = (a, b) => { // convention année commerciale (30/360) — b inclus
  let [y1, m1, d1] = a.split("-").map(Number); let [y2, m2, d2] = b.split("-").map(Number);
  d1 = Math.min(d1, 30); d2 = Math.min(d2, 30); if (d2 === 30 && m2 === 2) d2 = 30;
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1) + 1;
};

/* ---------------- Plan comptable général (extrait PCG) ---------------- */
const PCG_RAW = `101000 Capital
104000 Primes liées au capital
105000 Écarts de réévaluation
106100 Réserve légale
106300 Réserves statutaires
106400 Réserves réglementées
106800 Autres réserves
108000 Compte de l'exploitant
109000 Actionnaires : capital souscrit non appelé
110000 Report à nouveau (solde créditeur)
119000 Report à nouveau (solde débiteur)
120000 Résultat de l'exercice (bénéfice)
129000 Résultat de l'exercice (perte)
131000 Subventions d'équipement
139000 Subventions inscrites au compte de résultat
145000 Amortissements dérogatoires
151000 Provisions pour risques
152700 Autres provisions pour charges
164000 Emprunts auprès des établissements de crédit
165000 Dépôts et cautionnements reçus
164800 Intérêts courus sur emprunts auprès des établissements de crédit
201000 Frais d'établissement
205000 Concessions, brevets, licences, logiciels
207000 Fonds commercial
211000 Terrains
213000 Constructions
215400 Matériel industriel
218100 Installations générales, agencements
218200 Matériel de transport
218300 Matériel de bureau et informatique
218400 Mobilier
231000 Immobilisations corporelles en cours
261000 Titres de participation
275000 Dépôts et cautionnements versés
280500 Amort. concessions, logiciels
280600 Amort. droit au bail
290100 Dépréciation des frais d'établissement
281300 Amort. constructions
281540 Amort. matériel industriel
281810 Amort. installations, agencements
281820 Amort. matériel de transport
281830 Amort. matériel de bureau et informatique
281840 Amort. mobilier
290700 Dépréciation du fonds commercial
310000 Stocks de matières premières
355000 Stocks de produits finis
370000 Stocks de marchandises
391000 Dépréciation des stocks de matières
397000 Dépréciation des stocks de marchandises
401000 Fournisseurs
403000 Fournisseurs - effets à payer
404000 Fournisseurs d'immobilisations
408100 Fournisseurs - factures non parvenues
409100 Fournisseurs - avances et acomptes versés
409800 Fournisseurs - RRR à obtenir
411000 Clients
413000 Clients - effets à recevoir
416000 Clients douteux ou litigieux
418100 Clients - factures à établir
419100 Clients - avances et acomptes reçus
421000 Personnel - rémunérations dues
425000 Personnel - avances et acomptes
428200 Dettes provisionnées pour congés payés
431000 Sécurité sociale (URSSAF)
437100 Retraite complémentaire
437200 Mutuelle et prévoyance
438200 Charges sociales sur congés payés
442100 Prélèvement à la source (impôt sur le revenu)
444000 État - impôt sur les bénéfices
445200 TVA due intracommunautaire
445510 TVA à décaisser
445620 TVA déductible sur immobilisations
445660 TVA déductible sur autres biens et services
445662 TVA déductible intracommunautaire
445670 Crédit de TVA à reporter
445711 TVA collectée 20 %
445712 TVA collectée 10 %
445713 TVA collectée 5,5 %
445714 TVA collectée 2,1 %
445810 Acomptes de TVA - régime simplifié
445830 Remboursement de TVA demandé
445860 TVA sur factures non parvenues
445870 TVA sur factures à établir
447000 Autres impôts, taxes et versements assimilés
455000 Associés - comptes courants
457000 Associés - dividendes à payer
467000 Divers comptes débiteurs et produits à recevoir
468000 Divers comptes créditeurs et charges à payer
471000 Compte d'attente
481000 Frais d'émission des emprunts
486000 Charges constatées d'avance
487000 Produits constatés d'avance
491000 Dépréciation des comptes clients
503000 Valeurs mobilières de placement - actions
508000 Autres valeurs mobilières
512000 Banque
512100 Banque - compte secondaire
530000 Caisse
580000 Virements internes
590000 Dépréciation des VMP
601000 Achats de matières premières
602000 Achats d'autres approvisionnements
603100 Variation des stocks de matières premières
603700 Variation des stocks de marchandises
604000 Achats d'études et prestations de services
606100 Fournitures non stockables (eau, énergie)
606300 Fournitures d'entretien et petit équipement
606400 Fournitures administratives
607000 Achats de marchandises
609000 Rabais, remises, ristournes obtenus sur achats
611000 Sous-traitance générale
612200 Crédit-bail mobilier
613200 Locations immobilières
613500 Locations mobilières
614000 Charges locatives et de copropriété
615000 Entretien et réparations
616000 Primes d'assurance
618100 Documentation générale
618500 Frais de colloques, séminaires
621000 Personnel extérieur à l'entreprise
622600 Honoraires
622700 Frais d'actes et de contentieux
623000 Publicité, publications, relations publiques
623800 Divers (pourboires, dons courants)
624100 Transports sur achats
624200 Transports sur ventes
625100 Voyages et déplacements
625600 Missions
625700 Réceptions
626000 Frais postaux et de télécommunications
627000 Services bancaires et assimilés
628100 Concours divers (cotisations)
631100 Taxe sur les salaires
633300 Contribution unique à la formation professionnelle et à l'alternance
635110 Cotisation foncière des entreprises (CFE)
635120 Cotisation sur la valeur ajoutée (CVAE)
635400 Droits d'enregistrement et de timbre
637800 Taxes diverses
638000 Rappels d'impôts (autres qu'impôts sur les bénéfices)
641000 Rémunérations du personnel
641200 Congés payés
641400 Indemnités et avantages divers
644000 Rémunération du travail de l'exploitant
645100 Cotisations URSSAF
645300 Cotisations aux caisses de retraite
645400 Cotisations à France Travail
645800 Cotisations aux autres organismes sociaux
646000 Cotisations sociales personnelles de l'exploitant
647500 Médecine du travail, pharmacie
649000 Remboursements de charges de personnel
651000 Redevances pour concessions, brevets, licences
653000 Rémunérations de l'activité des administrateurs et des gérants
654000 Pertes sur créances irrécouvrables
654100 Créances devenues irrécouvrables dans l'exercice
657000 Valeurs comptables des immobilisations incorporelles et corporelles cédées
658000 Pénalités et autres charges
658100 Pénalités sur marchés
658200 Pénalités, amendes fiscales et pénales
658800 Charges diverses de gestion courante
661100 Intérêts des emprunts et dettes
661600 Intérêts bancaires et sur opérations de financement
665000 Escomptes accordés
666000 Pertes de change
667000 Charges sur cessions d'éléments financiers
671800 Autres charges exceptionnelles sur opérations de gestion
681110 Dotations aux amortissements des immobilisations incorporelles
681120 Dotations aux amortissements des immobilisations corporelles
681500 Dotations aux provisions d'exploitation
681730 Dotations aux dépréciations des stocks
681740 Dotations aux dépréciations des créances
686200 Dotations aux amortissements des frais d'émission des emprunts
687100 Dotations aux amortissements exceptionnels
687250 Dotations aux amortissements dérogatoires
691000 Participation des salariés aux résultats
695000 Impôts sur les bénéfices
699000 Produits - report en arrière des déficits
701000 Ventes de produits finis
704000 Travaux
706000 Prestations de services
707000 Ventes de marchandises
708400 Mise à disposition de personnel facturée
708500 Ports et frais accessoires facturés
708800 Autres produits d'activités annexes
709000 Rabais, remises, ristournes accordés
713500 Variation des stocks de produits
721000 Production immobilisée - incorporelle
722000 Production immobilisée - corporelle
740000 Subventions d'exploitation
747000 Quote-part des subventions d'investissement virée au résultat
751000 Redevances pour concessions, brevets
757000 Produits des cessions d'immobilisations incorporelles et corporelles
758000 Produits divers de gestion courante
758700 Indemnités d'assurance
758800 Autres produits divers de gestion courante
761000 Produits de participations
764000 Revenus des valeurs mobilières de placement
765000 Escomptes obtenus
766000 Gains de change
767000 Produits sur cessions d'éléments financiers
768000 Autres produits financiers
771800 Autres produits exceptionnels sur opérations de gestion
781100 Reprises sur amortissements des immobilisations incorporelles et corporelles
781500 Reprises sur provisions pour risques et charges d'exploitation
781700 Reprises sur dépréciations des actifs circulants
786000 Reprises financières sur provisions
787250 Reprises sur amortissements dérogatoires`;
const PCG = {};
PCG_RAW.split("\n").forEach(l => { const i = l.indexOf(" "); PCG[l.slice(0, i)] = l.slice(i + 1); });
/* Comptes de l'ancien plan (PCG 2024 et antérieur) : libellés conservés pour l'historique et table de correspondance PCG 2025 */
const PCG_LEGACY = { "168800": "Intérêts courus sur emprunts (ancien PCG)", "158000": "Autres provisions pour charges (ancien PCG)", "671200": "Pénalités, amendes fiscales et pénales (ancien PCG)", "671100": "Dédits et pénalités sur marchés (ancien PCG)", "671300": "Dons, libéralités (ancien PCG)", "671400": "Créances irrécouvrables de l'exercice (ancien PCG)", "671700": "Rappels d'impôts (ancien PCG)", "675000": "Valeurs comptables des éléments d'actif cédés (ancien PCG)", "775000": "Produits des cessions d'éléments d'actif (ancien PCG)", "777000": "Quote-part des subventions virée au résultat (ancien PCG)", "791000": "Transferts de charges d'exploitation (supprimé)", "796000": "Transferts de charges financières (supprimé)", "797000": "Transferts de charges exceptionnelles (supprimé)", "631200": "Taxe d'apprentissage (ancien PCG)", "631300": "Formation professionnelle continue (ancien PCG)", "448600": "État - charges à payer (ancien PCG)", "448700": "État - produits à recevoir (ancien PCG)", "468600": "Divers - charges à payer (ancien PCG)", "468700": "Divers - produits à recevoir (ancien PCG)", "438700": "Organismes sociaux - produits à recevoir (ancien PCG)" };
const PCG2025_MAP = { "168800": "164800", "158000": "152700", "671100": "658100", "671200": "658200", "671300": "623800", "671400": "654100", "671700": "638000", "675000": "657000", "775000": "757000", "777000": "747000", "631200": "633300", "631300": "633300", "448600": "448120", "448700": "448200", "468600": "468000", "468700": "467000", "438700": "439000" };
/* Plan comptable des associations (règlement ANC n° 2018-06 modifié) */
const PCG_ASSO_RAW = `102000 Fonds propres sans droit de reprise
103000 Fonds propres avec droit de reprise
191000 Fonds reportés liés aux legs ou donations
194000 Fonds dédiés sur subventions de fonctionnement
195000 Fonds dédiés sur contributions financières d'autres organismes
197000 Fonds dédiés sur ressources liées à la générosité du public
689400 Reports en fonds dédiés sur subventions de fonctionnement
689700 Reports en fonds dédiés sur ressources liées à la générosité du public
741000 Subventions d'exploitation (État, collectivités)
754100 Dons manuels
754200 Mécénats
754300 Legs, donations et assurances-vie
756100 Cotisations sans contrepartie
756200 Cotisations avec contrepartie
789400 Utilisations des fonds dédiés sur subventions de fonctionnement
789700 Utilisations des fonds dédiés sur ressources liées à la générosité du public
860000 Secours en nature, alimentaires, vestimentaires
861000 Mise à disposition gratuite de biens
862000 Prestations en nature
864000 Personnel bénévole
870000 Bénévolat
871000 Prestations en nature reçues
875000 Dons en nature`;
const PCG_ASSO = {}; PCG_ASSO_RAW.split("\n").forEach(l => { const i = l.indexOf(" "); PCG_ASSO[l.slice(0, i)] = l.slice(i + 1); });
const CLASSES = { 1: "Comptes de capitaux", 2: "Comptes d'immobilisations", 3: "Comptes de stocks et en-cours", 4: "Comptes de tiers", 5: "Comptes financiers", 6: "Comptes de charges", 7: "Comptes de produits", 8: "Contributions volontaires en nature" };
const TVA_COLL = { 2000: "445711", 1000: "445712", 550: "445713", 210: "445714" };
const TAUX_LIB = { 2000: "20 %", 1000: "10 %", 550: "5,5 %", 210: "2,1 %", 0: "Exonéré" };

/* ---------------- État ---------------- */
let S = null;          // dossier courant (méta)
let E = [];            // écritures du dossier courant
const UI = { view: "dashboard", sub: {}, filters: {}, sel: new Set(), modal: null, toast: null, draft: null };

function cfgPCG() { return (typeof CONFIG !== "undefined" && CONFIG.pcg) || { ajouts: {}, libelles: {}, desactives: [] }; }
function baseAccounts() { const g = cfgPCG(); const m = Object.assign({}, PCG, (S && S.activite === "association") ? PCG_ASSO : {}, g.ajouts || {}); for (const k in (g.libelles || {})) if (m[k]) m[k] = g.libelles[k]; return m; }
function accLib(num) {
  if (!num) return "";
  if (S && S.comptes && S.comptes[num]) return S.comptes[num];
  const B = baseAccounts(); if (B[num]) return B[num]; if (PCG_ASSO[num]) return PCG_ASSO[num]; if (PCG_LEGACY[num]) return PCG_LEGACY[num];
  for (let l = num.length - 1; l >= 2; l--) { const p = num.slice(0, l).padEnd(6, "0"); if (S && S.comptes && S.comptes[p]) return S.comptes[p]; if (B[p]) return B[p]; }
  return "Compte " + num;
}
function allAccounts() {
  const g = cfgPCG(); const off = new Set(g.desactives || []);
  const m = Object.assign({}, baseAccounts(), S ? S.comptes : {});
  return Object.keys(m).filter(n => !off.has(n)).sort().map(n => ({ num: n, lib: m[n] }));
}
const tiersBy = code => S.tiers.find(t => t.code === code);
const journalBy = code => S.journaux.find(j => j.code === code);
const exCur = () => S.exercices.find(x => x.id === S.exCourant) || S.exercices[S.exercices.length - 1];
const exOf = date => S.exercices.find(x => date >= x.debut && date <= x.fin);

/* lignes à plat */
function flat(filter = {}) {
  const out = [];
  for (const e of E) {
    if (filter.from && e.date < filter.from) continue;
    if (filter.to && e.date > filter.to) continue;
    if (filter.journal && e.journal !== filter.journal) continue;
    if (filter.validOnly && e.statut !== "valide") continue;
    if (filter.noAN && e.journal === "AN") continue;
    for (const l of e.lignes) out.push({ e, l });
  }
  return out;
}
function balance(from, to, opts = {}) {
  const map = {};
  for (const { e, l } of flat({ from, to, noAN: opts.noAN })) {
    const k = opts.aux && l.aux ? l.compte + "|" + l.aux : l.compte;
    const r = map[k] || (map[k] = { compte: l.compte, aux: opts.aux ? l.aux || "" : "", d: 0, c: 0, dAN: 0, cAN: 0 });
    if (e.journal === "AN") { r.dAN += l.debit; r.cAN += l.credit; }
    r.d += l.debit; r.c += l.credit;
  }
  return Object.values(map).sort((a, b) => (a.compte + a.aux).localeCompare(b.compte + b.aux));
}
/* solde (débit - crédit) des comptes commençant par un préfixe */
function soldeMap(from, to) {
  const m = {};
  for (const { l } of flat({ from, to })) m[l.compte] = (m[l.compte] || 0) + l.debit - l.credit;
  return m;
}
const sumPref = (m, prefs, excl = []) => { let s = 0; for (const k in m) { if (prefs.some(p => k.startsWith(p)) && !excl.some(p => k.startsWith(p))) s += m[k]; } return s; };
const sumPrefSign = (m, prefs, sign, excl = []) => { let s = 0; for (const k in m) { if (prefs.some(p => k.startsWith(p)) && !excl.some(p => k.startsWith(p))) { const v = m[k]; if (sign > 0 && v > 0) s += v; if (sign < 0 && v < 0) s += v; } } return s; };

function ecrTotals(e) { let d = 0, c = 0; for (const l of e.lignes) { d += l.debit || 0; c += l.credit || 0; } return { d, c, ok: d === c && d > 0 }; }

/* résultat de la période (classes 6/7) */
function resultat(from, to) { const m = soldeMap(from, to); return -(sumPref(m, ["6", "7"])); }

/* ---------------- Stockage : base de l'artefact (privée par utilisateur) + secours navigateur ---------------- */
const Store = {
  db: null, uid: null, mode: "local", status: "ok", pending: new Set(), metaDirty: false, timer: null,
  async init() {
    try {
      if (window.claude && window.claude.use) {
        const tmo = new Promise(r => setTimeout(() => r([null, null]), 8000));
        const [db, user] = await Promise.race([Promise.all([claude.use("db"), claude.use("user")]), tmo]);
        this.user = user || null; if (db && user) { const id = await user.id(); if (id) { this.db = db; this.uid = id; this.mode = "db"; } }
      }
    } catch (e) { this.mode = "local"; }
  },
  base() { return "data/users/" + this.uid; },
  async getIndex() {
    if (this.mode === "db") { try { const s = await this.db.doc(this.base() + "/index").get(); if (s.exists) return plain(s.data()); } catch (e) { } try { const l = JSON.parse(localStorage.getItem("sc:index") || "null"); if (l) { this.mode = "local"; return l; } } catch (e) { } return null; }
    try { return JSON.parse(localStorage.getItem("sc:index") || "null"); } catch (e) { return null; }
  },
  async setIndex(ix) {
    if (this.mode === "db") return this.db.doc(this.base() + "/index").set(ix);
    try { localStorage.setItem("sc:index", JSON.stringify(ix)); } catch (e) { }
  },
  async loadDossier(id) {
    if (this.mode === "db") {
      const s = await this.db.doc(this.base() + "/d_" + id).get(); if (!s.exists) return null;
      const meta = plain(s.data()); const q = await this.db.doc(this.base() + "/d_" + id).collection("m").get();
      let ecr = []; q.docs.forEach(d => { const b = d.data(); if (b && b.e) ecr = ecr.concat(plain(b.e)); });
      return { meta, ecr };
    }
    try { const meta = JSON.parse(localStorage.getItem("sc:d:" + id) || "null"); if (!meta) return null; const ecr = JSON.parse(localStorage.getItem("sc:e:" + id) || "[]"); return { meta, ecr }; } catch (e) { return null; }
  },
  touch(month) { if (month) this.pending.add(month); this.metaDirty = true; this.schedule(); },
  touchAll() { E.forEach(e => this.pending.add(e.date.slice(0, 7))); this.metaDirty = true; this.schedule(); },
  schedule() { clearTimeout(this.timer); this.setStatus("busy"); this.timer = setTimeout(() => this.flush(), 700); },
  setStatus(s) { this.status = s; const gs = $("#grSave"); if (gs) { gs.textContent = s === "busy" ? "Enregistrement…" : s === "err" ? "⚠ Échec d'enregistrement" : "✓ Enregistré automatiquement"; gs.className = "gr-save " + s; } const d = $("#saveDot"); if (d) { d.className = "save-dot " + (s === "ok" ? "" : s); } const t = $("#saveTxt"); if (t) t.textContent = s === "busy" ? "Enregistrement…" : s === "err" ? "Échec d'enregistrement" : (this.mode === "db" ? "Enregistré dans votre espace" : "Enregistré sur ce navigateur"); },
  async flush() {
    if (!S) return;
    const id = S.id, months = [...this.pending]; this.pending.clear();
    try {
      if (this.mode === "db") {
        const base = this.base() + "/d_" + id;
        if (this.metaDirty) { this.metaDirty = false;
          /* un autre onglet ou appareil a pu modifier le dossier : on fusionne les projets au lieu de les écraser */
          if (typeof scMergeRemote === "function" && S.id === id) { try { const r = await this.db.doc(base).get(); if (r.exists) { const n = scMergeRemote(S, plain(r.data())); if (n && typeof toast === "function") { toast(n + " élément(s) modifié(s) dans un autre onglet ou appareil ont été conservés."); if (typeof render === "function") setTimeout(render, 50); } } } catch (e) { } }
          await this.db.doc(base).set(S); }
        for (const m of months) {
          const list = E.filter(e => e.date.slice(0, 7) === m);
          const ref = this.db.doc(base).collection("m").doc(m);
          if (list.length) await ref.set({ e: list }); else await ref.delete();
        }
      } else {
        localStorage.setItem("sc:d:" + id, JSON.stringify(S));
        localStorage.setItem("sc:e:" + id, JSON.stringify(E));
      }
      this.setStatus("ok");
      clearTimeout(this.ixT); this.ixT = setTimeout(() => { try { saveIndex(); } catch (e) { } }, 1500);
    } catch (e) {
      console.error(e); months.forEach(m => this.pending.add(m));
      if (this.mode === "db" && e && !["unavailable", "resource_exhausted", "quota_exceeded"].includes(e.code)) { this.mode = "local"; this.metaDirty = true; this.touchAll(); toast("Votre accès ne permet pas l'enregistrement en ligne : vos données sont conservées sur ce navigateur. Demandez à l'administrateur un accès « contributeur »."); return; }
      this.setStatus("err");
      toast(e && e.code === "quota_exceeded" ? "Espace de stockage plein : exportez une sauvegarde puis supprimez un ancien dossier." : "L'enregistrement a échoué. Nouvel essai à la prochaine modification.");
    }
  },
  async deleteDossier(id) {
    if (this.mode === "db") {
      const base = this.base() + "/d_" + id;
      try { for (const c of ["m", "ventes", "inbox"]) { const q = await this.db.doc(base).collection(c).get(); for (const d of q.docs) await this.db.doc(base).collection(c).doc(d.id).delete(); } await this.db.doc(base).delete(); } catch (e) { }
    } else { try { localStorage.removeItem("sc:d:" + id); localStorage.removeItem("sc:e:" + id); } catch (e) { } }
  }
};
function saveAll() { Store.touchAll(); }
function saveEcr(e) { Store.touch(e.date.slice(0, 7)); }

/* ---------------- Nouveau dossier ---------------- */
function newDossier(o) {
  const debut = o.debut, fin = o.fin;
  return {
    id: uid(), nom: o.nom, siren: o.siren || "", siret: o.siret || "", forme: o.forme || "SAS", adresse: o.adresse || "", naf: o.naf || "",
    capital: o.capital || 0, capitalLibere: true, pp75: true, regimeTVA: o.regimeTVA || "RN_M", regimeIS: o.regimeIS || "RS", optionTVA: "debits",
    demo: !!o.demo, creeLe: todayISO(), activite: o.activite || "tpe", fiscal: o.fiscal || "", naturePro: o.naturePro || "BIC", modeles: o.modeles || null, parcours: [],
    exercices: [{ id: "EX" + fin.slice(0, 4), debut, fin, cloture: false }], exCourant: "EX" + fin.slice(0, 4),
    comptes: {}, tiers: [],
    journaux: [
      { code: "AC", lib: "Achats", type: "ACH" }, { code: "VT", lib: "Ventes", type: "VEN" },
      { code: "BQ", lib: "Banque", type: "BQ", compte: "512000" }, { code: "CA", lib: "Caisse", type: "CAI", compte: "530000" },
      { code: "OD", lib: "Opérations diverses", type: "OD" }, { code: "AN", lib: "À-nouveaux", type: "AN" }
    ],
    immos: [], releves: [], seq: {}, letSeq: 0, isParams: {}, tvaDecl: []
  };
}

/* ---------- Journal des erreurs (consultable par le support) ---------- */
const ERRLOG = { items: [], t: null };
function logErr(where, e) {
  try {
    const it = { t: new Date().toISOString(), where: String(where || ""), view: (typeof UI !== "undefined" && UI.view) || "", msg: String((e && (e.message || e.code)) || e || "").slice(0, 400), stack: String((e && e.stack) || "").replace(/https?:\/\/[^\s)]*\//g, "").slice(0, 900), dossier: (typeof S !== "undefined" && S && S.id) || "", ver: (typeof CONFIG !== "undefined" && CONFIG && CONFIG.version) || 0, ua: navigator.userAgent.slice(0, 120), w: window.innerWidth };
    ERRLOG.items.push(it); ERRLOG.items = ERRLOG.items.slice(-40); console.error("[SC]", where, e);
    clearTimeout(ERRLOG.t); ERRLOG.t = setTimeout(async () => { try { let prev = []; if (Store.mode === "db" && Store.db && Store.uid) { const ref = Store.db.doc(Store.base() + "/journal"); try { const s = await ref.get(); if (s.exists) prev = (s.data().items || []); } catch (x) { } const all = prev.concat(ERRLOG.items.splice(0)).slice(-60); await ref.set({ items: all }); } else { prev = JSON.parse(localStorage.getItem("sc:journal") || "[]"); localStorage.setItem("sc:journal", JSON.stringify(prev.concat(ERRLOG.items.splice(0)).slice(-60))); } } catch (x) { } }, 800);
  } catch (x) { }
}
