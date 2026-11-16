/* ============================================================================
   Saisie › Dépôt des documents et saisie en masse pré-comptabilisée
   - 3 cartes de dépôt : factures fournisseurs, factures clients (+ créer), autres documents
     (glisser-déposer sur la carte, plusieurs fichiers, photo depuis le téléphone)
   - moteur de nature : catégories modifiables (couleur, compte, TVA, mots-clés) alimentées par
     la fiche du tiers, les corrections apprises, les règles, les lignes de la facture, le nom
     du fournisseur, le code APE, le texte et l'IA ; immobilisations ; TVA non récupérable ;
     autoliquidation intracommunautaire
   - contrôles « zéro anomalie » : rien n'est comptabilisé tant qu'un contrôle bloque
   - onglet « Saisie en masse » : toutes les pièces pré-comptabilisées, modifiables en ligne,
     catégories, corrections appliquées aux factures du même tiers, comptabilisation groupée,
     corbeille avec restauration (suppression définitive réservée à l'éditeur)
   ========================================================================== */
const SD_DEF = { depot: "1", auto: "0", seuil: 80, immo: "1", immoSeuil: 50000, tvaNd: "1", vehic: "tourisme", autoliq: "1", learn: "1", tiersAuto: "1", propag: "1" };
function sdCfg() { return Object.assign({}, SD_DEF, (S && S.sdCfg) || {}); }
const sdNorm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ");
const sdKey = s => sdNorm(s).replace(/\b(sas|sarl|sa|eurl|sasu|sci|snc|selarl|ets|ste|societe|groupe|france|fr)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 40);
const sdWho = () => { try { return typeof bkWho === "function" ? bkWho() : "Utilisateur"; } catch (e) { return "Utilisateur"; } };

/* ---------- catégories (modifiables par l'utilisateur) ---------- */
const SD_CAT0 = [
  ["nc", "Non catégorisé", "#E5E7EB", "", "A"],
  ["mar", "Marchandises", "#FDE2C8", "607000", "A"], ["mat", "Matières premières", "#FCE7D6", "601000", "A"], ["appro", "Emballages et approvisionnements", "#FBEBDD", "602000", "A"],
  ["st", "Sous-traitance", "#E0E7FF", "611000", "A"], ["presta", "Prestations et études", "#E7E5FF", "604000", "A"],
  ["alim", "Alimentaire et repas", "#FADBD8", "625700", "A"], ["ass", "Assurance", "#DDE3FB", "616000", "A", 0],
  ["bur", "Bureaux et fournitures", "#FBF1C7", "606400", "A"], ["equip", "Petit équipement et outillage", "#F7EDC0", "606300", "A"],
  ["depl", "Déplacements", "#D4F5EA", "625100", "A"], ["hotel", "Hébergement", "#D9F3EC", "625100", "A"], ["carb", "Carburant", "#E3F2DF", "606100", "A"],
  ["energ", "Énergie et eau", "#E6F4D7", "606100", "A"], ["tel", "Télécom et internet", "#DCEBFA", "626000", "A"], ["poste", "Frais postaux et envois", "#E2EEF8", "626000", "A"],
  ["loyer", "Loyer", "#F3E1F5", "613200", "A"], ["charg", "Charges locatives", "#F1E6F4", "614000", "A"], ["loc", "Locations de matériel et véhicules", "#EFE3F7", "613500", "A"], ["cb", "Crédit-bail", "#ECE1F6", "612200", "A"],
  ["entr", "Entretien et réparations", "#E9F0DA", "615000", "A"],
  ["fin", "Finance et compta", "#FAD9E3", "622600", "A"], ["jur", "Juridique", "#EFE6DA", "622600", "A"], ["actes", "Frais d'actes et formalités", "#EDE4D8", "622700", "A"],
  ["pub", "Publicité et marketing", "#FDE6D2", "623000", "A"], ["cad", "Cadeaux clients", "#FCE1E9", "623400", "A"],
  ["trans", "Transport de marchandises", "#E4ECF5", "624100", "A"], ["bank", "Frais bancaires", "#DCE8FB", "627000", "A", 0], ["cotis", "Cotisations", "#E9E4F7", "628100", "A", 0],
  ["log", "Logiciels et abonnements", "#DDF0F7", "651000", "A"], ["doc", "Documentation", "#EEF2E1", "618100", "A"], ["form", "Formation et séminaires", "#E3F1F0", "618500", "A"],
  ["interim", "Personnel intérimaire", "#E8E6F4", "621000", "A"], ["taxe", "Impôts et taxes", "#F2E2E2", "635400", "A", 0], ["amende", "Amendes et pénalités", "#F8DADA", "658200", "A", 0], ["don", "Dons et pourboires", "#F6E3EE", "623800", "A", 0],
  ["immoinf", "Matériel informatique (immobilisation)", "#D7E9F7", "218300", "A"], ["immomob", "Mobilier (immobilisation)", "#E6E1F3", "218400", "A"], ["immoveh", "Véhicule (immobilisation)", "#DDEFE9", "218200", "A"], ["immomat", "Matériel industriel (immobilisation)", "#E4E9D8", "215400", "A"], ["immolog", "Logiciel acquis (immobilisation)", "#DCEFF3", "205000", "A"],
  ["vmar", "Ventes de marchandises", "#D8F0DF", "707000", "V"], ["vpres", "Prestations de services", "#DCEEF9", "706000", "V"], ["vtrav", "Travaux", "#F1EAD8", "704000", "V"], ["vprod", "Produits finis", "#E9E2F5", "701000", "V"], ["vport", "Frais de port facturés", "#E6EEF5", "708500", "V"], ["vloc", "Locations facturées", "#F2E6F2", "708300", "V"], ["vcom", "Commissions", "#F7EBD8", "708200", "V"]];
function sdCats() { const C = S.sdCats ||= []; if (!C.length || C._v !== 1) { const have = new Map(C.map(c => [c.id, c])); SD_CAT0.forEach(([id, lib, col, compte, sens, tx]) => { if (!have.has(id)) C.push({ id, lib, col, compte, sens, tx: tx === 0 ? 0 : null, kw: "", sys: true }); }); Object.defineProperty(C, "_v", { value: 1, enumerable: false, writable: true }); } return C; }
const sdCat = id => sdCats().find(c => c.id === id) || sdCats()[0];
function sdCatByAcc(c, sens) { return sdCats().find(x => x.compte === c && (x.sens || "A") === sens && !x.off) || null; }

/* ---------- règles de nature : [motif, catégorie, options] (textes normalisés sans accents) ---------- */
const SD_R = [
  [/\b(carburant|gazole|gasoil|diesel|sp ?95|sp ?98|sans plomb|e10|e85|superethanol|adblue)\b|station[ -]service|total ?energies? (relais|station|access)|\besso\b|\bavia\b/, "carb", { carb: 1 }],
  [/\b(edf|engie|enercoop|ekwateur|direct energie|grdf|enedis|electricite|kwh|gaz naturel|fioul|ilek|vattenfall|totalenergies electricite)\b/, "energ"], [/\b(veolia|suez|saur|eau de paris|consommation d eau|assainissement)\b/, "energ"],
  [/\b(orange|sfr|bouygues telecom|free pro|free mobile|freebox|nordnet|telephone|telephonie|forfait mobile|fibre|internet pro|ligne fixe|standard telephonique|ringover|aircall)\b/, "tel"],
  [/\b(la poste|colissimo|chronopost|lettre recommandee|recommande|affranchissement|timbres?|dhl|ups|fedex|dpd|gls|mondial relay|sendcloud|boxtal)\b/, "poste"],
  [/\b(loyer|bail commercial|quittance|avis d echeance|foncia|nexity|citya|square habitat|orpi gestion)\b/, "loyer"], [/\b(charges locatives|charges de copropriete|syndic)\b/, "charg"],
  [/\b(credit[ -]bail|leasing financier|loyer de credit[ -]bail)\b/, "cb"],
  [/\b(location (de )?(materiel|vehicule|engin|nacelle|photocopieur|copieur|voiture|utilitaire)|\blld\b|loueur|kiloutou|loxam|hertz|europcar|\bavis\b location|sixt|\bada\b|rent a car|leasys|arval|ayvens|ald automotive)\b/, "loc"],
  [/\b(maintenance|contrat d entretien|reparation|depannage|sav|revision|vidange|garage|norauto|feu vert|midas|speedy|pneus?|carrosserie|controle technique|nettoyage|menage|proprete|desinsectisation|elagage|plomberie|plombier|electricien|serrurier)\b/, "entr"],
  [/\b(assurances?|rc pro|responsabilite civile|multirisque|cotisation d assurance|prime d assurance|prime annuelle|taxes? d assurance|contrat d assurance|police d assurance)\b/, "ass", { notva: 1 }],
  [/\b(axa|allianz|maif|macif|maaf|mma|groupama|generali|hiscox|matmut|swisslife|swiss life|april|covea|aviva|abeille)\b/, "ass", { notva: 1, vend: 1 }],
  [/\b(expert[ -]comptable|cabinet comptable|expertise comptable|commissaire aux comptes|tenue comptable|bilan annuel|lettre de mission|paie externalisee|gestion de la paie)\b/, "fin"],
  [/\b(avocats?|selarl d avocats|cabinet d avocats|conseil juridique|juriste|protection juridique|honoraires? d avocat|contentieux|redaction (de |d )?(contrat|statuts|acte)s?|mise en demeure)\b/, "jur"],
  [/\b(notaire|huissier|commissaire de justice|greffe|infogreffe|kbis|formalites|annonce legale|annonces legales|depot des comptes|legalstart|captain contrat|inpi)\b/, "actes"],
  [/\b(publicite|annonce|campagne|google ads|facebook ads|meta platforms|linkedin ads|flyers?|imprimerie|vistaprint|cartes de visite|salon professionnel|stand|sponsoring|signaletique|enseigne|goodies|objets publicitaires)\b/, "pub"],
  [/\b(cadeaux?|coffrets?|panier garni|chocolats? offerts?)\b/, "cad", { cad: 1 }],
  [/\b(transport de marchandises|messagerie|fret|affretement|transporteur|geodis|schenker|kuehne|xpo logistics|dachser|heppner)\b/, "trans"],
  [/\b(sncf|ouigo|tgv|ter|air france|easyjet|ryanair|transavia|vueling|lufthansa|billet d avion|billet de train|taxi|uber(?! eats)|bolt|g7|vtc|heetch|blablacar)\b/, "depl", { pax: 1 }],
  [/\b(peage|vinci autoroutes|sanef|aprr|area|asf|cofiroute|parking|indigo|q park|effia|onepark|stationnement)\b/, "depl"],
  [/\b(hotel|ibis|novotel|mercure|accor|booking|airbnb|kyriad|campanile|b&b hotels?|best western|premiere classe|nuitee|hebergement)\b/, "hotel"],
  [/\b(restaurant|brasserie|bistrot?|traiteur|pizzeria|mcdonald|burger king|kfc|sushi|deliveroo|uber eats|just eat|repas|dejeuner|diner|boulangerie|patisserie|cafe|bar tabac|cantine|sandwich)\b/, "alim"],
  [/\b(papeterie|fournitures de bureau|lyreco|bureau vallee|office depot|jpg|top office|raja|cartouches?|toners?|ramettes?|stylos?|enveloppes|classeurs?|agendas?)\b/, "bur"],
  [/\b(outillage|outils?|leroy merlin|castorama|brico depot|bricomarche|mr bricolage|wurth|manutan|petit materiel|consommables|quincaillerie|visserie|equipements? de protection|epi)\b/, "equip"],
  [/\b(logiciels?|licences?|abonnement (mensuel|annuel)|saas|microsoft 365|office 365|google workspace|g suite|adobe|canva|notion|slack|zoom|dropbox|salesforce|hubspot|shopify|wix|squarespace|sage|cegid|quickbooks|ovh|ovhcloud|ionos|o2switch|gandi|hostinger|aws|amazon web services|heroku|github|atlassian|jira|openai|chatgpt|anthropic|claude|mailchimp|brevo|sendinblue|calendly|docusign|yousign|nom de domaine|hebergement web|serveur dedie|cloud)\b/, "log"],
  [/\b(frais bancaires|commission(s)? (bancaires?|d intervention|de mouvement)|agios|cotisation carte|tenue de compte|frais de tenue|frais de virement|interets debiteurs|releve de frais)\b/, "bank", { notva: 1 }],
  [/\b(qonto|shine|bnp paribas|credit agricole|societe generale|lcl|caisse d epargne|banque populaire|credit mutuel|cic|boursorama|revolut|stripe|sumup|paypal|lydia pro|la banque postale|hsbc)\b/, "bank", { notva: 1, vend: 1 }],
  [/\b(cotisations?|adhesion|syndicat|chambre de commerce|cci|cma|ordre des|federation|association professionnelle)\b/, "cotis"],
  [/\b(abonnement (presse|journal|magazine)|journaux|magazines?|revues?|livres?|ouvrages?|documentation|dalloz|lefebvre|editions legislatives|les echos|le monde|le figaro)\b/, "doc"],
  [/\b(formation|seminaire|colloque|conference|e[ -]learning|stage de|certification|cpf)\b/, "form"],
  [/\b(interim|travail temporaire|adecco|manpower|randstad|synergie|start people|crit|proman|gojob|staffme)\b/, "interim"],
  [/\b(sous[ -]traitance|sous[ -]traitant)\b/, "st"],
  [/\b(prestation de services?|etude|developpement web|graphisme|design graphique|conseil en|consultant|consulting|audit (energetique|informatique)|traduction)\b/, "presta"],
  [/\b(marchandises?|achat pour revente|grossiste|metro cash|promocash|transgourmet|centrale d achat)\b/, "mar"],
  [/\b(matieres? premieres?|acier|toles?|aluminium|inox|bois de construction|planches?|farine|tissus?|resines?|composants electroniques|granules)\b/, "mat"],
  [/\b(emballages?|cartons?|palettes?|films? etirables?|sacs? kraft)\b/, "appro"],
  [/\b(cfe|cotisation fonciere|taxe fonciere|impots\.gouv|dgfip|droits d enregistrement|taxe sur les vehicules|tvs|vignette)\b/, "taxe", { notva: 1 }],
  [/\b(amende|contravention|antai|majoration|penalites? de retard)\b/, "amende", { notva: 1 }],
  [/\b(don|dons|pourboire|mecenat)\b/, "don", { notva: 1 }]];
/* type de document lu dans le titre */
const SD_TITLE = [
  [/quittance( de loyer)?\b/, "loyer"],
  [/avis d ?echeance|appel de loyer|appel de fonds/, "", (t) => /assurance|prime|police|contrat n|garantie|sinistre/.test(t) ? "ass" : /credit[ -]bail|leasing/.test(t) ? "cb" : /charges de copropriete|syndic/.test(t) ? "charg" : /loyer|bail|locataire|local|lot n/.test(t) ? "loyer" : ""],
  [/note d ?honoraires|releve d ?honoraires/, "", (t) => /avocat|juridique|contentieux|barreau/.test(t) ? "jur" : /notaire|huissier|commissaire de justice/.test(t) ? "actes" : "fin"],
  [/releve de frais( bancaires)?|frais bancaires|tarification bancaire/, "bank"],
  [/appel de cotisation|avis de cotisation|bulletin d adhesion/, "", (t) => /assurance|prime/.test(t) ? "ass" : "cotis"],
  [/avis d ?imposition|taxe fonciere|cotisation fonciere|avis de taxe/, "taxe"],
  [/echeancier de credit[ -]bail|contrat de credit[ -]bail/, "cb"],
  [/avis de contravention|amende forfaitaire/, "amende"],
  [/facture d ?(electricite|energie|gaz)|votre facture (edf|engie)/, "energ"],
  [/facture (de )?(telephone|mobile|internet|telecom)/, "tel"],
  [/billet electronique|e-billet|carte d embarquement|justificatif de voyage/, "depl"],
  [/note de restaurant|addition\b/, "alim"]];
/* biens durables : immobilisation au-delà du seuil */
const SD_IMMO = [[/\b(ordinateur|pc portable|laptop|macbook|imac|ecran|moniteur|serveur|imprimante multifonction|ipad|tablette|smartphone|iphone|station de travail|nas)\b/, "immoinf", "equip"], [/\b(mobilier|bureau (assis debout|droit|d angle)|fauteuil|chaise|armoire|rayonnages?|etageres?|caisson|canape|table de reunion)\b/, "immomob", "equip"], [/\b(vehicule|voiture|camion|utilitaire|fourgon|scooter|moto|immatriculation|carte grise)\b/, "immoveh", ""], [/\b(machine|compresseur|tour a metaux|fraiseuse|chariot elevateur|transpalette electrique|four professionnel|centrale|presse|groupe electrogene|nacelle)\b/, "immomat", "equip"], [/\b(licence perpetuelle|logiciel (acquis|achete|sur mesure))\b/, "immolog", "log"]];
/* ventes */
const SD_RV = [[/\b(marchandises?|articles?|produits? revendus?|negoce|revente)\b/, "vmar"], [/\b(travaux|chantier|pose|installation|renovation|maconnerie|peinture|electricite|plomberie|menuiserie)\b/, "vtrav"], [/\b(produits? finis?|fabrication|production vendue)\b/, "vprod"], [/\b(frais de port|port facture|livraison facturee|transport facture)\b/, "vport"], [/\b(location|loyer)\b/, "vloc"], [/\b(commission|courtage|apport d affaires)\b/, "vcom"], [/\b(prestation|service|honoraires|conseil|formation|maintenance|abonnement|mission|accompagnement|audit|developpement|usinage|faconnage|travail a facon|decoupe|soudure|sur plan|reparation)\b/, "vpres"]];
/* code APE / NAF du fournisseur */
const SD_NAF = [[/^47\.?30/, "carb"], [/^35/, "energ"], [/^36|^37/, "energ"], [/^61/, "tel"], [/^53/, "poste"], [/^68\.?2/, "loyer"], [/^68\.?3/, "charg"], [/^65/, "ass"], [/^66\.?2/, "ass"], [/^69\.?20/, "fin"], [/^69\.?10/, "jur"], [/^56/, "alim"], [/^55/, "hotel"], [/^49\.?3[12]|^51/, "depl"], [/^49\.?4|^52\.?29/, "trans"], [/^58\.?29|^62|^63\.?1/, "log"], [/^73/, "pub"], [/^78/, "interim"], [/^85\.?59/, "form"], [/^64/, "bank"], [/^45\.?20/, "entr"], [/^77/, "loc"], [/^81\.?2/, "entr"], [/^43/, "entr"], [/^46/, "mar"], [/^94/, "cotis"], [/^58\.?1/, "doc"]];

/* ---------- texte de la pièce ---------- */
function sdDesig(it) { return sdDesigA(it).map(x => x.d); }
function sdDesigA(it) { const inv = it.inv || {}; const D = (inv.lignes || []).filter(l => l.des).map(l => ({ d: l.des, a: Math.abs(l.ht || 0) })); if (D.length) return D;
  const t = String(it.text || ""); const out = []; t.split(/\n/).forEach(l => { const x = l.trim(); if (x.length < 6 || out.length >= 25) return; if (/total|t\.?v\.?a|sous[- ]total|net a payer|net à payer|acompte|deja regle|déjà réglé|reste a payer|montant|base h|iban|bic|capital|siret|siren|page \d|rcs|echeance|échéance|reglement|règlement|penalit|indemnit/i.test(x)) return; if (!/[a-zA-ZÀ-ÿ]{4}/.test(x)) return; const am = typeof amountsIn === "function" ? amountsIn(x) : []; if (!am.length) return; out.push({ d: x.replace(/\s{2,}/g, " ").replace(/-?\d[\d \u00a0.]*,\d{2}\s*(€|eur)?/gi, "").trim(), a: Math.abs(am[am.length - 1] || 0) }); }); return out; }
function sdDesigOld(it) { const inv = it.inv || {}; const D = (inv.lignes || []).map(l => l.des).filter(Boolean); if (D.length) return D;
  const t = String(it.text || ""); const out = []; t.split(/\n/).forEach(l => { const x = l.trim(); if (x.length < 6 || out.length >= 25) return; if (/total|t\.?v\.?a|sous[- ]total|net a payer|net à payer|acompte|deja regle|déjà réglé|reste a payer|montant|base h|iban|bic|capital|siret|siren|page \d|rcs|echeance|échéance|reglement|règlement|penalit|indemnit/i.test(x)) return; if (!/[a-zA-ZÀ-ÿ]{4}/.test(x)) return; if (typeof amountsIn === "function" && !amountsIn(x).length) return; out.push(x.replace(/\s{2,}/g, " ").replace(/-?\d[\d  .]*,\d{2}\s*(€|eur)?/gi, "").trim()); }); return out; }
function sdParty(it) { return ((it.sens === "V" ? it.inv.acheteur : it.inv.vendeur) || {}); }
function sdNaf(it) { const m = String(it.text || "").match(/\b(?:ape|naf|code ape|code naf)\s*(?:n°|:|-)?\s*(\d{2}\.?\d{2}\s?[a-z])\b/i); return m ? m[1].replace(/\s/g, "").toUpperCase() : ""; }
function sdLearn() { return (S.sdLearn ||= {}); }

/* ---------- moteur : la catégorie la plus sûre, avec ses raisons ---------- */
function sdClassify(it) {
  const sens = it.sens === "V" ? "V" : "A"; const C = sdCats(); const cfg = sdCfg(); const sc = {}; const why = {};
  const add = (cat, pts, w) => { if (!cat) return; const c = C.find(x => x.id === cat); if (!c || c.off || (c.sens || "A") !== sens) return; sc[cat] = (sc[cat] || 0) + pts; (why[cat] ||= []).push(w); };
  const t = it.tiers ? tiersBy(it.tiers) : null; const party = sdParty(it); const vname = sdNorm((t && t.nom) || party.nom || ""); const desA = sdDesigA(it).map(x => ({ d: sdNorm(x.d), a: x.a })); const des = desA.map(x => x.d); const sumA = desA.reduce((s0, x) => s0 + x.a, 0) || 1; const txt = sdNorm(String(it.text || "").split(/\n/).filter(l => !/iban|bic|rib\b|swift|domiciliation|titulaire du compte|virement|prelevement|prélèvement|paiement (re[çc]u|par)|r[èe]glement par|payable|banque|bank|cr[ée]dit agricole|cic\b|lcl\b/i.test(l)).join("\n").slice(0, 5000)); const lib = sdNorm(it.lib || "");
  const L = sdLearn(); const keys = [it.tiers && "t:" + it.tiers, sdKey(party.nom) && "n:" + sdKey(party.nom)].filter(Boolean);
  /* 1. corrections apprises */
  keys.forEach(k => { const m = L[k]; if (!m || !m.c) return; const best = Object.entries(m.c).sort((a, b) => b[1] - a[1])[0]; if (!best) return; const n = best[1], tot = Object.values(m.c).reduce((a, b) => a + b, 0); add(best[0], n >= 2 && n / tot >= .7 ? 95 : 82, "appris sur " + n + " facture(s) de ce " + (sens === "V" ? "client" : "fournisseur")); });
  /* 1 bis. autres pièces du même tiers (déjà classées avec certitude) */
  if (it.tiers && typeof XS !== "undefined" && XS.inbox) { const m = {}; XS.inbox.forEach(x => { if (x === it || x.id === it.id || x.tiers !== it.tiers || x.sens !== it.sens || x.statut === "supprimee") return; const c = (x.lignes[0] || {}).cat || (x.nc || {}).cat; if (c && c !== "nc" && (x.ncOk || x.statut === "comptabilisee" || ((x.nc || {}).conf || 0) >= (+sdCfg().seuil || 80))) m[c] = (m[c] || 0) + 1; }); const b = Object.entries(m).sort((a, b) => b[1] - a[1])[0]; if (b) add(b[0], 85, "comme les autres pièces de ce " + (sens === "V" ? "client" : "fournisseur")); }
  /* 2. fiche du tiers (compte par défaut explicite) */
  if (t && t.defaut && !t.auto && !/^(607000|601000|706000|707000)$/.test(t.defaut)) { const c = sdCatByAcc(t.defaut, sens); if (c) add(c.id, 90, "compte par défaut de la fiche " + (sens === "V" ? "client" : "fournisseur")); }
  /* 3. vos mots-clés de catégorie et règles d'imputation */
  C.forEach(c => { if ((c.sens || "A") !== sens || !c.kw) return; c.kw.split(",").map(k => sdNorm(k).trim()).filter(k => k.length >= 3).forEach(k => { if (vname.includes(k) || des.some(d => d.includes(k)) || lib.includes(k)) add(c.id, 92, "mot-clé « " + k + " »"); else if (txt.includes(k)) add(c.id, 60, "mot-clé « " + k + " » dans la pièce"); }); });
  try { (inboxCfg().regles || []).forEach(r => { const m = sdNorm(r.mot).trim(); if (m && r.compte && (vname + " " + txt).includes(m)) { const c = sdCatByAcc(r.compte, sens); if (c) add(c.id, 90, "règle « " + r.mot + " »"); } }); } catch (e) { }
  /* 4. règles de nature : lignes de la facture, nom, libellé, texte */
  /* titre du document (quittance, avis d'échéance, note d'honoraires…) : signal le plus fort */
  const head = sdNorm((it.nom || "") + "\n" + String(it.text || "").split(/\n/).slice(0, 14).join("\n")); const full = sdNorm(String(it.text || "").slice(0, 6000));
  if (sens === "A") SD_TITLE.forEach(([re, cat, ctx]) => { if (re.test(head)) { const c = typeof ctx === "function" ? ctx(full, vname) : cat; if (c) add(c, 97, "type de document : « " + (head.match(re) || [""])[0].trim() + " »"); } });
  const R = sens === "V" ? SD_RV.map(([re, c]) => [re, c, {}]) : SD_R;
  R.forEach(([re, cat, o]) => { if (o && o.vend) { if (re.test(vname)) add(cat, 78, "nom du fournisseur"); return; } const hit = desA.filter(x => re.test(x.d)); const hd = hit.length; if (hd) { const sh = desA.length > 1 ? hit.reduce((s0, x) => s0 + x.a, 0) / sumA : 1; add(cat, Math.round(48 + 32 * sh + Math.min(8, hd * 3)), "désignation de la facture" + (sh < .5 ? " (ligne secondaire)" : "")); } if (re.test(vname)) add(cat, sens === "V" ? 30 : 74, "nom du " + (sens === "V" ? "client" : "fournisseur")); if (re.test(lib)) add(cat, 50, "libellé"); if (!hd && re.test(txt)) { const n = (txt.match(new RegExp(re.source, "g")) || []).length; add(cat, 34 + Math.min(16, n * 4), "texte de la pièce"); } });
  /* 5. code APE du fournisseur */
  if (sens === "A") { const naf = sdNaf(it); if (naf) { const m = SD_NAF.find(([re]) => re.test(naf)); if (m) add(m[1], 72, "code APE " + naf); } }
  /* 6. proposition de l'IA */
  const ia = it.inv && it.inv.ia; if (ia && ia.compte) { const c = sdCatByAcc(ia.compte, sens); if (c) add(c.id, 66, "lecture IA"); }
  /* arbitrage par l'IA (lecture complète de la pièce) */
  if (it.ncIA && it.ncIA.cat) add(it.ncIA.cat, it.ncIA.conf >= 80 ? 91 : 70, "lecture IA" + (it.ncIA.why ? " : " + it.ncIA.why : ""));
  /* défaut */
  if (sens === "V") { const d = sdCatByAcc((t && t.defaut) || (typeof MC === "function" && MC("factu", "compteDefaut")) || "706000", "V"); add(d ? d.id : "vpres", 40, "compte de vente habituel"); }
  let rank = Object.entries(sc).sort((a, b) => b[1] - a[1]);
  let cat = rank[0] ? rank[0][0] : "nc", top = rank[0] ? rank[0][1] : 0; const second = rank[1] ? rank[1][1] : 0;
  /* immobilisation : bien durable au-delà du seuil */
  const T = typeof inboxTotals === "function" ? inboxTotals(it) : { ht: 0 }; let immo = null;
  if (sens === "A" && cfg.immo === "1" && Math.abs(T.ht) >= (+cfg.immoSeuil || 50000)) { for (const [re, ic, fromCat] of SD_IMMO) { if (des.some(d => re.test(d)) || re.test(lib) || (!des.length && re.test(txt.slice(0, 2500)))) { if (!fromCat || !cat || cat === "nc" || cat === fromCat || top < 80) { immo = ic; break; } } } }
  if (immo && !(keys.some(k => L[k] && L[k].c && !String(Object.keys(L[k].c)[0]).startsWith("immo")) && top >= 90)) { why[immo] = ["bien durable de plus de " + eur(+cfg.immoSeuil || 50000) + " € HT"].concat(why[cat] || []); cat = immo; top = Math.max(top, 86); }
  let conf = Math.min(99, top + Math.max(0, (why[cat] || []).length - 1) * 6); if (second && second >= top * .85 && rank[1][0] !== cat) conf = Math.min(conf, 64);
  if (cat === "nc") conf = 0;
  const opts = (SD_R.find(r => r[1] === cat) || [])[2] || {};
  return { cat, conf: Math.round(conf), why: (why[cat] || []).slice(0, 4), alt: rank.filter(r => r[0] !== cat).slice(0, 3).map(r => r[0]), opts, naf: sens === "A" ? sdNaf(it) : "" };
}
/* applique la nature aux lignes (sans toucher aux lignes corrigées à la main) */
function sdApply(it, force) {
  const R = sdClassify(it); const c = sdCat(R.cat); const cfg = sdCfg();
  it.nc = { cat: R.cat, conf: R.conf, why: R.why, alt: R.alt, naf: R.naf, at: new Date().toISOString(), v: 2 };
  if (!force && it.ncLock) return it;
  (it.lignes || []).forEach(l => { if (l.manual && !force) return; if (c && c.compte) l.compte = c.compte; l.cat = R.cat;
    l.nd = 0; if (it.sens !== "V" && cfg.tvaNd === "1") { if (R.opts.pax) l.nd = 1; else if (R.opts.carb && cfg.vehic === "tourisme") l.nd = 0.2; else if (R.cat === "immoveh" && cfg.vehic === "tourisme") l.nd = 1; } });
  /* autoliquidation : fournisseur de l'Union européenne hors France, ou mention sur la facture */
  const p = sdParty(it); const tv = String(p.tva || "").toUpperCase(); const txt = sdNorm(it.text || "");
  it.autoliq = it.sens !== "V" && cfg.autoliq === "1" && ((/^[A-Z]{2}/.test(tv) && !tv.startsWith("FR")) || /autoliquidation|reverse charge|article 283|art\. ?283|article 196|vat reverse|tva due par le preneur/.test(txt)) && !(it.lignes || []).some(l => l.tva);
  return it;
}
/* ---------- contrôles : bloquants (rien n'est passé) et avertissements ---------- */
function sdChecks(it) {
  const B = [], W = []; const T = inboxTotals(it); const cfg = sdCfg(); const inv = it.inv || {};
  if (it.sensDoute) B.push(it.sensDoute);
  if (!it.date) B.push("Date de la facture manquante.");
  if (it.date && it.date > addDays(todayISO(), 31)) W.push("Date dans le futur : vérifiez.");
  if (!it.piece) W.push("Numéro de facture non trouvé.");
  if (it.ech && it.date && it.ech < it.date) W.push("Échéance antérieure à la date de facture.");
  const okT = [0, 210, 550, 850, 1000, 2000];
  (it.lignes || []).forEach((l, i) => { const n = it.lignes.length > 1 ? " (ligne " + (i + 1) + ")" : "";
    if (!okT.includes(Number(l.taux))) B.push("Taux de TVA inconnu" + n + ".");
    if (Math.abs((l.tva || 0) - Math.round((l.ht || 0) * (l.taux || 0) / 10000)) > Math.max(3, Math.abs(l.ht || 0) * .002)) B.push("TVA incohérente avec la base et le taux" + n + " : " + eur(l.tva || 0) + " au lieu de " + eur(Math.round((l.ht || 0) * (l.taux || 0) / 10000)) + ".");
    const cl = String(l.compte || "")[0]; if (it.sens === "V" ? cl !== "7" : !/[62]/.test(cl)) B.push("Compte " + (l.compte || "?") + " incompatible avec une facture " + (it.sens === "V" ? "client (classe 7 attendue)" : "fournisseur (classe 6 ou 2 attendue)") + n + ".");
    const cat = sdCat(l.cat || (it.nc && it.nc.cat)); if (cat && cat.tx === 0 && l.tva) W.push("« " + cat.lib + " » est normalement sans TVA : vérifiez la TVA" + n + "."); });
  if (inv.ttc && Math.abs(T.ttc - inv.ttc) > 2 && !B.some(x => /total/.test(x))) B.push("Le total des lignes (" + eur(T.ttc) + ") ne correspond pas au TTC lu (" + eur(inv.ttc) + ").");
  const nc = it.nc || {}; if (!it.ncOk && !it.ncLock && (nc.cat === "nc" || (nc.conf || 0) < (+cfg.seuil || 80))) B.push(nc.cat === "nc" ? "Nature non reconnue : choisissez la catégorie." : "Nature à confirmer (confiance " + (nc.conf || 0) + " %).");
  if (it.autoliq) W.push("Autoliquidation : TVA due et déductible passée automatiquement (445200 / 445662).");
  (it.lignes || []).forEach(l => { if (l.nd === 1 && l.tva) W.push("TVA non récupérable (" + (sdCat(l.cat).lib || "") + ") : intégrée à la charge."); else if (l.nd > 0 && l.nd < 1 && l.tva) W.push("Carburant véhicule de tourisme : 80 % de la TVA récupérée."); });
  if ((it.lignes || []).some(l => l.cat === "cad") && T.ttc > 7300) W.push("Cadeaux : TVA récupérable seulement si la valeur unitaire est ≤ 73 € TTC.");
  return { B: [...new Set(B)], W: [...new Set(W)] };
}

/* ---------- branchements sur les factures reçues ---------- */
(function () {
  const _ic = inboxCheck; inboxCheck = function (it) { const P = _ic.apply(this, arguments); if (!it || it.statut === "supprimee") return P; try { if (!it.nc) sdApply(it); return P.concat(sdChecks(it).B); } catch (e) { return P; } };
  const _ie = inboxEcriture; inboxEcriture = function (it) {
    const nd = (it.lignes || []).some(l => l.nd && l.tva); let src = it;
    if (nd) { src = Object.assign({}, it, { lignes: it.lignes.map(l => { if (!l.nd || !l.tva) return l; const k = Math.round(l.tva * l.nd); return Object.assign({}, l, { ht: l.ht + k, tva: l.tva - k }); }) }); }
    const e = _ie.call(this, src);
    if (it.autoliq && it.sens !== "V") { const base = (it.lignes || []).reduce((a, l) => a + (l.ht || 0), 0); const tv = Math.round(base * 0.2); if (tv) { const av = it.inv && it.inv.type === "AV"; e.lignes.push({ id: uid(), compte: "445662", aux: "", lib: "TVA déductible autoliquidée", debit: av ? 0 : tv, credit: av ? tv : 0, lettre: "", dateLet: "", pointe: "" }, { id: uid(), compte: "445200", aux: "", lib: "TVA due intracommunautaire", debit: av ? tv : 0, credit: av ? 0 : tv, lettre: "", dateLet: "", pointe: "" }); try { ensureAcc("445662", "TVA déductible intracommunautaire"); ensureAcc("445200", "TVA due intracommunautaire"); } catch (x) { } } }
    try { ensureAcc("623400", "Cadeaux à la clientèle"); ensureAcc("708300", "Locations diverses"); ensureAcc("708200", "Commissions et courtages"); } catch (x) { }
    return e; };
  const _ip = inboxPost; inboxPost = function (it, silent) { const ok = _ip.apply(this, arguments); if (ok) { try { sdLearnFrom(it); (it.hist ||= []).push({ at: new Date().toISOString(), by: sdWho(), a: "Comptabilisée (journal " + it.journal + ")" }); xSave("inbox", it); } catch (e) { } } return ok; };
  /* le compte proposé partout (factures reçues comprises) vient du moteur */
  const _ga = guessAccount; guessAccount = function (inv, t, sens) { try { const it = { inv, sens, tiers: t ? t.code : "", text: inv.text || "", lib: "", lignes: [] }; const R = sdClassify(it); const c = sdCat(R.cat); if (c && c.compte && R.conf >= 60) return c.compte; } catch (e) { } return _ga.apply(this, arguments); };
  if (typeof INBOX_ST !== "undefined") INBOX_ST.supprimee = ["n", "Supprimée"];
})();
function sdLearnFrom(it) { if (sdCfg().learn !== "1") return; const main = (it.lignes || []).slice().sort((a, b) => Math.abs(b.ht) - Math.abs(a.ht))[0]; if (!main) return; const cat = main.cat || (it.nc && it.nc.cat); if (!cat || cat === "nc") return; const L = sdLearn(); const p = sdParty(it);
  [it.tiers && "t:" + it.tiers, sdKey(p.nom) && "n:" + sdKey(p.nom)].filter(Boolean).forEach(k => { const m = L[k] ||= { c: {} }; m.c[cat] = (m.c[cat] || 0) + 1; m.taux = main.taux; m.le = todayISO(); }); Store.touch(); }

/* ---------- dépôt : le sens vient de la carte choisie ---------- */
function sdClientName(text) { const L = String(text || "").split(/\n/).map(x => x.trim()); for (let i = 0; i < L.length; i++) { const m = L[i].match(/(?:factur[ée]e? [àa]|adress[ée]e? [àa]|client\s*:|destinataire|bill(?:ed)? to|livr[ée]e? [àa])\s*:?\s*(.*)$/i); if (!m) continue; const rest = (m[1] || "").trim(); if (/[A-Za-zÀ-ÿ]{3}/.test(rest) && rest.length < 60) return rest; for (let k = i + 1; k < Math.min(L.length, i + 4); k++) { const x = L[k]; if (x && /[A-Za-zÀ-ÿ]{3}/.test(x) && !/\b\d{5}\b|rue|avenue|bd|boulevard|chemin|route|place|siret|siren|tva|t[ée]l/i.test(x)) return x.slice(0, 60); } } return ""; }
async function sdAddFiles(kind, files) {
  if (!ensureX()) { toast("Chargement en cours, réessayez dans un instant."); return; }
  if (kind === "O") return sdAddOther(files);
  const cfg = inboxCfg(); const sv = { autoTiers: cfg.autoTiers, auto: cfg.auto }; let n = 0; const errs = []; const added = [];
  for (let i = 0; i < files.length; i++) { const f = files[i]; UI.sdBusy = `Lecture ${i + 1}/${files.length} · ${f.name}`; render();
    try { cfg.autoTiers = false; cfg.auto = false; const before = XS.inbox.length; const tb = new Set(S.tiers); await inboxAddFile(f.name, new Uint8Array(await f.arrayBuffer())); const nt = S.tiers.filter(t => !tb.has(t)); if (nt.length) { S.tiers = S.tiers.filter(t => tb.has(t)); XS.inbox.slice(before).forEach(it => { if (nt.some(t => t.code === it.tiers)) it.tiers = ""; }); } XS.inbox.slice(before).forEach(it => { sdFix(it, kind); added.push(it); }); n += XS.inbox.length - before; }
    catch (e) { console.error(e); errs.push(f.name + " : " + (e.message || e)); } finally { Object.assign(cfg, sv); } }
  UI.sdBusy = ""; let auto = 0;
  if (sdCfg().auto === "1") added.forEach(it => { if (it.statut === "a_traiter" && !inboxCheck(it).length && !sdChecks(it).W.length && inboxPost(it, true)) auto++; });
  const ready = added.filter(it => it.statut === "a_traiter" && !inboxCheck(it).length).length;
  render(); toast(`${n} ${kind === "V" ? "facture(s) client" : "facture(s) fournisseur"} pré-comptabilisée(s) · ${ready} prête(s)${auto ? " · " + auto + " comptabilisée(s) automatiquement" : ""}${n - ready - auto > 0 ? " · " + (n - ready - auto) + " à vérifier" : ""}${errs.length ? " · " + errs.length + " illisible(s) : " + errs[0] : ""}.`);
}
function sdFix(it, kind) {
  const cfg = inboxCfg(); const me = sdWho(), at = new Date().toISOString();
  it.dep = { k: kind, by: me, at }; it.hist = [{ at, by: me, a: "Déposée (" + (kind === "V" ? "facture client" : "facture fournisseur") + ")" }];
  const inv = it.inv; const our = S.siren || "";
  if (kind === "V" && it.sens !== "V") { const other = Object.assign({}, inv.vendeur || {}); const nom = sdClientName(it.text) || (inv.acheteur && inv.acheteur.nom) || ""; inv.acheteur = { nom: nom && sdKey(nom) !== sdKey(S.nom) ? nom : (other.nom && sdKey(other.nom) !== sdKey(S.nom) ? other.nom : nom), siren: other.siren || "", tva: other.tva || "", adresse: other.adresse || "" }; inv.vendeur = { nom: S.nom, siren: our }; it.sens = "V"; it.journal = cfg.journalV || "VT"; it.tiers = ""; }
  else if (kind === "A" && it.sens === "V") { it.sens = "A"; it.journal = cfg.journalA || "AC"; it.tiers = ""; it.sensDoute = "Votre SIREN figure comme émetteur : c'est sans doute une facture client. Déplacez-la vers les factures clients ou confirmez."; }
  if (it.sens !== "V") { const v = inv.vendeur ||= {}; if (!v.nom || /:|\d{2}\/\d{2}\/\d{2,4}|[ée]ch[ée]ance|^date|facture|total|page/i.test(v.nom)) { const top = String(it.text || "").split(/\n/).map(x => x.trim().split(/\s{3,}/)[0]).find(x => x && /[A-Za-zÀ-ÿ]{3}/.test(x) && x.length <= 60 && !/:|facture|invoice|date|page|^\d/i.test(x) && sdKey(x) !== sdKey(S.nom)); if (top) v.nom = top; } }
  const party = sdParty(it); const type = it.sens === "V" ? "C" : "F";
  let t = it.tiers ? tiersBy(it.tiers) : null; if (!t || t.type !== type) t = matchTiers(party || {}, type);
  if (!t && sdCfg().tiersAuto === "1" && party && party.nom && sdKey(party.nom) !== sdKey(S.nom)) { t = { type, code: genCode(type, party.nom), nom: party.nom, siren: party.siren || "", tvaIntra: party.tva || "", adresse: party.adresse || "", email: party.email || "", iban: type === "F" ? (inv.iban || "") : "", collectif: type === "C" ? "411000" : "401000", defaut: "", taux: ((inv.tva || [])[0] || {}).taux ?? cfg.tauxDefaut, delai: 30, auto: true, creePar: me, creeLe: at }; S.tiers.push(t); Store.touch(); it.hist.push({ at, by: me, a: (type === "C" ? "Client" : "Fournisseur") + " créé : " + t.nom }); }
  it.tiers = t ? t.code : ""; it.lib = ((t && t.nom) || party.nom || "") + (it.piece ? " - " + it.piece : "");
  it.lignes = proposeLines(inv, (it.lignes[0] || {}).compte || ""); it.lignes.forEach(l => delete l.manual);
  sdApply(it, true); if (it.ncLock) delete it.ncLock; sdPzSync(it); it.natDone = true; try { it.lib = pzAutoLib(it); if (!it.ech && it.date) it.ech = ["loyer", "restaurant", "carburant", "deplacement"].includes(it.nat) ? it.date : addDays(it.date, ((tiersBy(it.tiers) || {}).delai) || 30); } catch (e) { }
  it.statut = inboxDup(it) ? "doublon" : "a_traiter"; if (it.statut === "doublon" && !it.warn.some(w => /déjà/.test(w))) it.warn.push("Cette facture semble déjà enregistrée (même tiers et même numéro).");
  xSave("inbox", it);
}
/* autres documents : rangés dans la GED, type deviné */
async function sdAddOther(files) { const me = sdWho(); let n = 0; const O = S.sdOther ||= [];
  for (const f of files) { UI.sdBusy = "Classement de " + f.name; render(); try { const b = new Uint8Array(await f.arrayBuffer()); const nm = f.name.toLowerCase(); let txt = "";
      if (nm.endsWith(".pdf")) { try { txt = await pdfText(b); } catch (e) { } }
      const low = sdNorm(nm + " " + txt.slice(0, 3000)); const guess = /\.(csv|ofx|qif|xlsx?|ods)$/.test(nm) && /releve|solde|debit|credit|operation/.test(low) ? "releve" : /releve de compte|extrait de compte|solde (crediteur|debiteur)/.test(low) ? "releve" : /facture|invoice|total ttc|net a payer/.test(low) ? "facture" : /contrat|bail|avenant/.test(low) ? "contrat" : /bulletin de (paie|salaire)|dsn|urssaf/.test(low) ? "social" : /impots|dgfip|avis d imposition|cfe|tva/.test(low) ? "fiscal" : /statuts|kbis|proces[- ]verbal|assemblee/.test(low) ? "juridique" : "divers";
      const path = { releve: "Banque/Relevés déposés", facture: "Comptabilité/Pièces déposées", contrat: "Juridique/Contrats", social: "Social/Documents déposés", fiscal: "Fiscal/Documents déposés", juridique: "Juridique/Documents déposés", divers: "Comptabilité/Autres documents" }[guess];
      const fid = gdEnsurePath(path + "/" + (exCur().id || "").replace("EX", "")); const rec = await gedAddBytes(f.name, b, f.type || "application/octet-stream", fid, { tags: ["dépôt", guess], note: "Déposé depuis la saisie" });
      O.unshift({ id: rec.id, name: f.name, at: new Date().toISOString(), by: me, guess, path }); n++; } catch (e) { console.error(e); toast("Classement impossible : " + (e.message || e)); } }
  if (O.length > 40) O.length = 40; UI.sdBusy = ""; Store.touch(); render(); toast(n + " document(s) rangé(s) dans la GED."); }

/* ---------- interface : cartes de dépôt ---------- */
const SD_SVG = {
  A: `<svg viewBox="0 0 90 90" aria-hidden="true"><g fill="none" stroke="#0F3D3E" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M22 10h34l14 14v56H22z" fill="#fff"/><path d="M56 10v14h14"/><path d="M30 38h32M30 46h32M30 54h32M30 62h20M46 38v24"/></g><circle cx="27" cy="22" r="8" fill="#F5B700" stroke="#0F3D3E" stroke-width="2.2"/><path d="M27 17v10M23.5 20.5h7" stroke="#0F3D3E" stroke-width="2" stroke-linecap="round"/><path d="M60 72c-3 0-5-2-5-5s2-5 5-5M53 66h6M53 69h6" stroke="#13585A" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  V: `<svg viewBox="0 0 90 90" aria-hidden="true"><g fill="none" stroke="#0F3D3E" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M16 14h40l12 12v52H16z" fill="#fff"/><path d="M56 14v12h12"/><path d="M24 44h36M24 52h36M24 60h22"/></g><rect x="38" y="24" width="40" height="22" rx="4" fill="#F5B700" stroke="#0F3D3E" stroke-width="2.2" transform="rotate(-8 58 35)"/><circle cx="58" cy="35" r="5" fill="none" stroke="#0F3D3E" stroke-width="2" transform="rotate(-8 58 35)"/><path d="M28 70l6-6 4 4 8-9" fill="none" stroke="#13585A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  O: `<svg viewBox="0 0 90 90" aria-hidden="true"><g stroke="#0F3D3E" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M10 28h22l6 7h40v41H10z" fill="#fff"/><path d="M30 18h30v22" fill="none"/><rect x="40" y="12" width="26" height="30" rx="3" fill="#F5B700"/><path d="M46 20h14M46 26h14M46 32h9" stroke-width="2"/><path d="M10 44h68" fill="none"/></g></svg>`
};
function sdDepot(compact) {
  if (!S || !ensureX()) return ""; const P = XS.inbox.filter(x => x.statut === "a_traiter" || x.statut === "doublon"); const nA = P.filter(x => x.sens !== "V").length, nV = P.filter(x => x.sens === "V").length; const nO = (S.sdOther || []).filter(x => x.at && x.at.slice(0, 7) === todayISO().slice(0, 7)).length;
  const card = (k, t, sub, extra) => `<div class="sd-card" data-k="${k}"><div class="sd-ill">${SD_SVG[k]}</div><div class="sd-in"><b>${t}</b><span class="sd-sub">${sub}</span><div class="sd-btns"><label class="btn sm sd-add">＋ Ajouter<input type="file" multiple hidden data-ch="sdFiles" data-k="${k}" accept="${k === "O" ? "*/*" : ".pdf,.xml,.zip,.jpg,.jpeg,.png,.webp,.heic,image/*,application/pdf"}"></label>${extra || ""}</div></div><div class="sd-drop">Déposez ici</div></div>`;
  return `<section class="sd-dep ${compact ? "sm" : ""}"><div class="sd-h"><h2>Déposez vos documents</h2>${UI.sdBusy ? `<span class="sd-busy"><i></i>${esc(UI.sdBusy)}</span>` : P.length ? `<button class="lnk" data-act="sdTab" data-v="masse">${P.length} pièce(s) pré-comptabilisée(s) à valider ›</button>` : `<span class="small muted">Glissez vos fichiers sur une carte : lecture, nature, compte et TVA sont préremplis.</span>`}</div>
    <div class="sd-grid">${card("A", "Factures fournisseurs", nA ? `<b>${nA}</b> à valider` : "PDF, Factur-X, photos de tickets", `<label class="btn sm ghost sd-cam" title="Prendre en photo un ticket ou une facture">📷<input type="file" accept="image/*" capture="environment" hidden data-ch="sdFiles" data-k="A"></label>`)}
    ${card("V", "Factures clients", nV ? `<b>${nV}</b> à valider` : "Factures émises hors du logiciel", `<button class="btn sm pri" data-act="sdCreate">＋ Créer</button>`)}
    ${card("O", "Autres documents", nO ? `<b>${nO}</b> ce mois-ci` : "Relevés, contrats, courriers : rangés dans la GED")}</div>
    ${(S.sdOther || []).length && !compact ? `<div class="sd-oth">${S.sdOther.slice(0, 4).map(o => `<span class="sd-o" title="${esc(o.path)} · ${esc(o.by)} · ${new Date(o.at).toLocaleString("fr-FR")}">📄 ${esc(o.name)} <em>${esc({ releve: "relevé bancaire", facture: "facture ?", contrat: "contrat", social: "social", fiscal: "fiscal", juridique: "juridique", divers: "document" }[o.guess] || "")}</em></span>`).join("")}<button class="lnk small" data-act="go" data-v="ged">Ouvrir la GED ›</button></div>` : ""}</section>`;
}

/* ---------- onglet « Saisie en masse » ---------- */
function sdRows(f) { const L = XS.inbox.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.recu || "").localeCompare(a.recu || ""));
  return L.filter(it => { if (f.f === "corb") return it.statut === "supprimee"; if (!/a_traiter|doublon/.test(it.statut)) return false; if (f.f === "A" && it.sens === "V") return false; if (f.f === "V" && it.sens !== "V") return false; const ok = !inboxCheck(it).length; if (f.f === "ok" && !ok) return false; if (f.f === "pb" && ok) return false; if (f.q) { const t = tiersBy(it.tiers); const h = sdNorm([it.piece, it.lib, t && t.nom, it.nom].join(" ")); if (!h.includes(sdNorm(f.q))) return false; } if (f.cat && !(it.lignes || []).some(l => l.cat === f.cat)) return false; return true; }); }
function sdChip(cat, id) { const c = sdCat(cat); return `<button class="sd-chip" style="background:${esc(c.col)}" data-act="sdCatPick" data-id="${id}" title="Changer la catégorie">${esc(c.lib)}<i>▾</i></button>`; }
function sdMasse() {
  if (!ensureX()) return `<div class="panel empty">Chargement des pièces…</div>`;
  const f = UI.sub.sdm ||= { f: "tout", q: "", sel: [], cat: "" };
  XS.inbox.forEach(it => { if ((it.statut === "a_traiter" || it.statut === "doublon") && (!it.nc || it.nc.v !== 2)) { sdApply(it, false); xSave("inbox", it); } });
  const all = XS.inbox.filter(x => /a_traiter|doublon/.test(x.statut)); const ready = all.filter(x => x.statut === "a_traiter" && !inboxCheck(x).length); const corb = XS.inbox.filter(x => x.statut === "supprimee").length;
  const L = sdRows(f); const selS = new Set(f.sel.filter(id => L.some(x => x.id === id))); f.sel = [...selS];
  const tiersL = (it) => S.tiers.filter(t => t.type === (it.sens === "V" ? "C" : "F"));
  const tot = L.reduce((a, it) => { const T = inboxTotals(it); a.ht += T.ht; a.tva += T.tva; a.ttc += T.ttc; return a; }, { ht: 0, tva: 0, ttc: 0 });
  const rows = L.map(it => { const T = inboxTotals(it); const ck = f.f === "corb" ? { B: [], W: [] } : sdChecks(it); const P = f.f === "corb" ? [] : inboxCheck(it); const ok = !P.length; const l0 = it.lignes[0] || {}; const multi = it.lignes.length > 1; const t = tiersBy(it.tiers); const party = sdParty(it); const nc = it.nc || {}; const dis = f.f === "corb" ? "disabled" : "";
    const tip = (P.length ? "À corriger :\n• " + P.join("\n• ") : "Prête à comptabiliser") + (ck.W.length ? "\n\nÀ savoir :\n• " + ck.W.join("\n• ") : "") + (nc.why && nc.why.length ? "\n\nNature : " + nc.why.join(", ") : "") + ((it.hist || []).length ? "\n\nHistorique :\n" + it.hist.slice(-5).map(h => "• " + new Date(h.at).toLocaleString("fr-FR") + " · " + h.by + " · " + h.a).join("\n") : "");
    return `<tr class="sd-r ${ok ? "ok" : "ko"} ${selS.has(it.id) ? "on" : ""}" data-id="${it.id}"><td class="c"><input type="checkbox" data-act="sdSel" data-id="${it.id}" ${selS.has(it.id) ? "checked" : ""}></td>
      <td class="c"><span class="sd-st ${f.f === "corb" ? "del" : it.statut === "doublon" ? "dup" : ok ? "ok" : "ko"}" title="${esc(tip)}">${f.f === "corb" ? "🗑" : it.statut === "doublon" ? "⧉" : ok ? "✓" : "!"}</span></td>
      <td><span class="sd-sens ${it.sens === "V" ? "v" : "a"}">${it.sens === "V" ? "Client" : "Fourn."}</span>${it.source === "manuel" ? "" : `<button class="sd-eye" data-act="inboxOpen" data-id="${it.id}" title="Voir la pièce et le détail">👁</button>`}</td>
      <td><input class="in sd-i" type="date" id="sd-${it.id}-date" value="${esc(it.date || "")}" data-ch="sdF" data-id="${it.id}" data-f="date" ${dis}></td>
      <td><input class="in sd-i mono" id="sd-${it.id}-piece" value="${esc(it.piece || "")}" data-ch="sdF" data-id="${it.id}" data-f="piece" placeholder="N°" ${dis}></td>
      <td><input class="in sd-i" list="sdT-${it.sens === "V" ? "C" : "F"}" id="sd-${it.id}-tiers" value="${esc(t ? t.nom : party.nom || "")}" data-ch="sdF" data-id="${it.id}" data-f="tiers" placeholder="${it.sens === "V" ? "Client" : "Fournisseur"}" ${dis}>${t ? "" : party.nom ? `<span class="sd-new">nouveau</span>` : ""}</td>
      <td class="sd-cc-td"><div class="sd-cc">${sdChip(l0.cat || nc.cat, it.id)}<div class="sd-acc"><input class="in sd-i mono acc" list="acc-list" id="sd-${it.id}-compte" value="${esc(l0.compte || "")}" data-ch="sdF" data-id="${it.id}" data-f="compte" ${dis}><span class="sd-conf" title="${esc((nc.why || []).join(" · ") || "")}"><i style="width:${it.ncOk || it.ncLock ? 100 : nc.conf || 0}%;background:${it.ncOk || it.ncLock || (nc.conf || 0) >= 85 ? "#1F8A55" : (nc.conf || 0) >= 65 ? "#E0A800" : "#C2364B"}"></i></span></div></div><div class="sd-why">${it.ncOk || it.ncLock ? "✓ confirmée" : esc((nc.why || [])[0] || "")}${multi ? ` · ${it.lignes.length} ventilations` : ""}</div></td>
      <td><select class="in sd-i" id="sd-${it.id}-taux" data-ch="sdF" data-id="${it.id}" data-f="taux" ${multi || dis ? "disabled" : ""}>${tauxOpts.concat([[850, "8,5 %"]]).map(([a, b]) => `<option value="${a}" ${Number(a) === Number(l0.taux) ? "selected" : ""}>${b}</option>`).join("")}</select>${(it.lignes || []).some(l => l.nd) ? `<div class="sd-why">TVA non récup.</div>` : it.autoliq ? `<div class="sd-why">autoliquidée</div>` : ""}</td>
      <td><input class="in sd-i num" id="sd-${it.id}-ht" value="${toIn(T.ht)}" data-ch="sdF" data-id="${it.id}" data-f="ht" ${multi || dis ? "disabled" : ""}></td>
      <td><input class="in sd-i num" id="sd-${it.id}-tva" value="${toIn(T.tva)}" data-ch="sdF" data-id="${it.id}" data-f="tva" ${multi || dis ? "disabled" : ""}></td>
      <td><input class="in sd-i num b" id="sd-${it.id}-ttc" value="${toIn(T.ttc)}" data-ch="sdF" data-id="${it.id}" data-f="ttc" ${multi || dis ? "disabled" : ""}>${it.inv && it.inv.ttc && Math.abs(it.inv.ttc - T.ttc) > 2 ? `<div class="sd-why bad">lu : ${eur(it.inv.ttc)}</div>` : ""}</td>
      <td class="r sd-act">${f.f === "corb" ? `<button class="btn sm" data-act="sdRest" data-id="${it.id}">↺ Restaurer</button>${canPurge() ? `<button class="btn sm ghost danger" data-act="sdPurge" data-id="${it.id}" title="Suppression définitive (éditeur)">✕</button>` : ""}` : `${ok ? `<button class="btn sm pri" data-act="sdPost" data-id="${it.id}">Comptabiliser</button>` : P.some(x => /Nature/.test(x)) && P.length === 1 ? `<button class="btn sm" data-act="sdOk" data-id="${it.id}" title="Je confirme la catégorie et le compte">✓ Confirmer</button>` : `<button class="btn sm" data-act="inboxOpen" data-id="${it.id}" title="${esc(P[0] || "")}">Corriger</button>`}<button class="btn sm ghost" data-act="sdDel" data-id="${it.id}" title="Mettre à la corbeille">🗑</button>`}</td></tr>`; }).join("");
  const cnt = k => k === "tout" ? all.length : k === "ok" ? ready.length : k === "pb" ? all.length - ready.length : k === "A" ? all.filter(x => x.sens !== "V").length : k === "V" ? all.filter(x => x.sens === "V").length : corb;
  return `${sdDepot(true)}<section class="sd-m"><div class="sd-mh"><div class="seg">${[["tout", "Toutes"], ["ok", "✓ Prêtes"], ["pb", "! À vérifier"], ["A", "Fournisseurs"], ["V", "Clients"], ["corb", "🗑 Corbeille"]].map(([k, l]) => `<button class="${f.f === k ? "on" : ""}" data-act="sdFilt" data-v="${k}">${l} <span class="sd-n">${cnt(k)}</span></button>`).join("")}</div>
    <input class="in" style="max-width:220px" id="sdQ" data-ch="sdQ" value="${esc(f.q)}" placeholder="Rechercher…"><select class="in" style="width:auto" data-ch="sdCatF"><option value="">Toutes catégories</option>${sdCats().filter(c => !c.off).map(c => `<option value="${c.id}" ${f.cat === c.id ? "selected" : ""}>${esc(c.lib)}</option>`).join("")}</select>
    <span style="flex:1"></span><button class="btn sm" data-act="sdManual" title="Saisir une facture papier sans fichier">＋ Ligne manuelle</button><button class="btn sm" data-act="sdCats">🏷 Catégories</button><button class="btn sm" data-act="sdRerun" title="Relancer la reconnaissance sur les pièces non confirmées">⟳ Relire</button><button class="btn sm pri" data-act="sdPostAll" ${ready.length ? "" : "disabled"}>Comptabiliser les ${ready.length} prête(s)</button></div>
    ${selS.size ? `<div class="sd-bulk"><b>${selS.size} sélectionnée(s)</b><button class="btn sm pri" data-act="sdPostSel">Comptabiliser</button><button class="btn sm" data-act="sdOkSel">✓ Confirmer la nature</button><label class="small">Catégorie <select class="in" style="width:auto" data-ch="sdCatSel"><option value="">—</option>${sdCats().filter(c => !c.off).map(c => `<option value="${c.id}">${esc(c.lib)}${c.compte ? " · " + c.compte : ""}</option>`).join("")}</select></label><button class="btn sm ghost" data-act="sdDelSel">🗑 Corbeille</button><button class="lnk small" data-act="sdSelNone">Désélectionner</button></div>` : ""}
    <div class="tw sd-tw"><table class="t sd-t"><thead><tr><th class="c"><input type="checkbox" data-act="sdSelAll" ${L.length && L.every(x => selS.has(x.id)) ? "checked" : ""}></th><th></th><th>Type</th><th>Date</th><th>Pièce</th><th>Tiers</th><th>Catégorie · compte</th><th>TVA</th><th class="r">HT</th><th class="r">TVA</th><th class="r">TTC</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="12" class="empty">${f.f === "corb" ? "La corbeille est vide." : all.length ? "Aucune pièce pour ce filtre." : "Aucune pièce à traiter : déposez vos factures sur les cartes ci-dessus."}</td></tr>`}</tbody>
    ${L.length && f.f !== "corb" ? `<tfoot><tr><td colspan="8">${L.length} pièce(s)</td><td class="r mono">${eur(tot.ht)}</td><td class="r mono">${eur(tot.tva)}</td><td class="r mono"><b>${eur(tot.ttc)}</b></td><td></td></tr></tfoot>` : ""}</table></div>
    <datalist id="sdT-F">${S.tiers.filter(t => t.type === "F").map(t => `<option value="${esc(t.nom)}">${esc(t.code)}</option>`).join("")}</datalist><datalist id="sdT-C">${S.tiers.filter(t => t.type === "C").map(t => `<option value="${esc(t.nom)}">${esc(t.code)}</option>`).join("")}</datalist>${typeof accOptions === "function" ? accOptions() : ""}
    <div class="sd-leg small muted">✓ prête : aucun contrôle bloquant · ! à vérifier : survolez l'icône pour la raison · les corrections de catégorie sont retenues pour le tiers et appliquées à ses autres pièces en attente.</div></section>
    ${UI.sdPick ? sdPickHTML() : ""}`;
}
function sdPickHTML() { const P = UI.sdPick; const it = XS.inbox.find(x => x.id === P.id); if (!it) return ""; const sens = it.sens === "V" ? "V" : "A"; const q = sdNorm(P.q || ""); const cur = (it.lignes[0] || {}).cat;
  const L = sdCats().filter(c => !c.off && (c.sens || "A") === sens && (!q || sdNorm(c.lib + " " + c.compte + " " + (c.kw || "")).includes(q)));
  const alt = ((it.nc || {}).alt || []).filter(a => a !== cur);
  return `<div class="sd-pk-bg" data-act="sdPickX"></div><div class="sd-pk" style="top:${P.y}px;left:${P.x}px"><div class="sd-pk-s">🔍<input id="sdPkQ" data-in="sdPkQ" value="${esc(P.q || "")}" placeholder="Rechercher des catégories…" autocomplete="off"></div>
    ${alt.length && !q ? `<div class="sd-pk-h">Suggestions</div>${alt.map(a => { const c = sdCat(a); return `<button class="sd-pk-i" data-act="sdCatSet" data-id="${it.id}" data-c="${a}"><span class="sd-chip" style="background:${esc(c.col)}">${esc(c.lib)}</span><span class="mono small">${esc(c.compte)}</span></button>`; }).join("")}<div class="sd-pk-h">Toutes les catégories</div>` : ""}
    <div class="sd-pk-l">${L.map(c => `<button class="sd-pk-i ${c.id === cur ? "on" : ""}" data-act="sdCatSet" data-id="${it.id}" data-c="${c.id}"><span class="sd-chip" style="background:${esc(c.col)}">${esc(c.lib)}</span><span class="mono small">${esc(c.compte)}</span>${c.id === cur ? "✓" : ""}</button>`).join("") || `<div class="small muted" style="padding:8px">Aucune catégorie.</div>`}</div>
    <div class="sd-pk-f"><button class="lnk small" data-act="sdCats">Gérer les catégories ›</button></div></div>`; }
function sdCatsModal() { const C = sdCats(); const cols = ["#E5E7EB", "#FADBD8", "#FDE2C8", "#FBF1C7", "#E6F4D7", "#D4F5EA", "#DCEBFA", "#DDE3FB", "#E7E5FF", "#F3E1F5", "#FAD9E3", "#EFE6DA"];
  const row = (c, i) => `<tr class="${c.off ? "sd-off" : ""}"><td><input type="color" value="${esc(c.col)}" data-ch="sdCatE" data-i="${i}" data-f="col" class="sd-col" ${c.id === "nc" ? "disabled" : ""}></td><td><input class="in" value="${esc(c.lib)}" data-ch="sdCatE" data-i="${i}" data-f="lib" ${c.id === "nc" ? "disabled" : ""}></td><td><select class="in" data-ch="sdCatE" data-i="${i}" data-f="sens" ${c.sys ? "disabled" : ""}><option value="A" ${(c.sens || "A") === "A" ? "selected" : ""}>Achat</option><option value="V" ${c.sens === "V" ? "selected" : ""}>Vente</option></select></td><td><input class="in mono acc" list="acc-list" value="${esc(c.compte)}" data-ch="sdCatE" data-i="${i}" data-f="compte" style="width:96px" ${c.id === "nc" ? "disabled" : ""}><div class="small muted">${esc(c.compte ? accLib(c.compte) : "")}</div></td><td><input class="in" value="${esc(c.kw || "")}" data-ch="sdCatE" data-i="${i}" data-f="kw" placeholder="mots séparés par des virgules" ${c.id === "nc" ? "disabled" : ""}></td><td class="c">${c.id === "nc" ? "" : `<select class="in" data-ch="sdCatE" data-i="${i}" data-f="off" style="width:auto"><option value="" ${c.off ? "" : "selected"}>Oui</option><option value="1" ${c.off ? "selected" : ""}>Non</option></select>`}</td><td>${c.sys ? "" : `<button class="btn sm ghost danger" data-act="sdCatDel" data-i="${i}">✕</button>`}</td></tr>`;
  return modalFrame("Catégories de saisie", `<p class="small muted" style="margin:0 0 10px">Chaque catégorie porte un compte et des mots-clés. La reconnaissance choisit la catégorie ; modifier son compte change toutes les propositions. Vos mots-clés passent avant les règles intégrées. Désactiver (Non) masque la catégorie.</p>
    <div class="tw" style="max-height:58vh"><table class="t"><thead><tr><th></th><th>Catégorie</th><th>Sens</th><th>Compte</th><th>Mots-clés</th><th>Active</th><th></th></tr></thead><tbody>${C.map(row).join("")}</tbody></table></div>${accOptions()}`,
    `<button class="btn" data-act="sdCatAdd">＋ Nouvelle catégorie</button><button class="btn ghost" data-act="sdCatReset">↺ Catégories d'origine</button><button class="btn pri" data-act="closeModal">Fermer</button>`, true); }
(function () { const _rm = renderModal; renderModal = function () { const M = UI.modal; if (M && M.type === "sdCats") return sdCatsModal(); return _rm.apply(this, arguments); }; })();

/* ---------- Comptabilité › Saisie (pièces) : cartes de dépôt + onglet « Saisie en masse » ---------- */
const SD2PZ = { carb: "carburant", energ: "energie", tel: "telecom", poste: "poste", loyer: "loyer", charg: "loyer", alim: "restaurant", depl: "deplacement", hotel: "deplacement", ass: "assurance", fin: "honoraires", jur: "honoraires", actes: "honoraires", bur: "fournitures", immoinf: "informatique", log: "logiciel", pub: "pub", bank: "banque", entr: "entretien", st: "soustraitance", trans: "transport", equip: "outillage", cotis: "cotisation", taxe: "taxe", mar: "marchandises", vpres: "vente_serv", vmar: "vente_march" };
function sdPzSync(it) { const k = SD2PZ[(it.nc || {}).cat]; if (k && typeof pzNatBy === "function" && pzNatBy(k)) it.nat = k; it.cptWhy = ((it.nc || {}).why || []).join(", "); }
(function () {
  if (typeof VIEWS.pieces === "function") { const _v = VIEWS.pieces; VIEWS.pieces = function () { if (!S || !ensureX()) return _v.apply(this, arguments); const st = PZ(); const cfg = sdCfg();
      if (st.tab === "masse") { const save = pzPiecesHTML; pzPiecesHTML = () => "<!--SDM-->"; let h; try { st.tab = "pieces"; h = _v.apply(this, arguments); } finally { pzPiecesHTML = save; st.tab = "masse"; } return h.replace("<!--SDM-->", sdMasse()); }
      let h = _v.apply(this, arguments); if (st.tab === "tx") return h;
      if (cfg.depot === "1") h = h.replace('<div class="pz-ws">', sdDepot(false) + '<div class="pz-ws">');
      try { const it = (pzCur() || {}).it; if (it) { const l0 = it.lignes[0] || {}; const nc = it.nc || {}; const ck = sdChecks(it);
        h = h.replace(/<select class="in sm" data-ch="pzNat"[\s\S]*?<\/select>/, `<span class="small muted">Catégorie</span>${sdChip(l0.cat || nc.cat, it.id)}<span class="sd-conf" title="${esc((nc.why || []).join(" · "))}"><i style="width:${it.ncOk ? 100 : nc.conf || 0}%;background:${it.ncOk || (nc.conf || 0) >= 85 ? "#1F8A55" : (nc.conf || 0) >= 65 ? "#E0A800" : "#C2364B"}"></i></span>${!it.ncOk && it.statut !== "comptabilisee" && nc.cat && nc.cat !== "nc" ? `<button class="btn sm" data-act="sdOk" data-id="${it.id}" title="Je confirme la catégorie">✓ Confirmer</button>` : ""}`);
        if (ck.W.length && it.statut !== "comptabilisee") h = h.replace('<div class="pz-und-l">', `<div class="sd-warn">${ck.W.map(w => "ⓘ " + esc(w)).join("<br>")}</div><div class="pz-und-l">`); } } catch (e) { }
      return h + (UI.sdPick ? sdPickHTML() : ""); }; }
  try { const SP = SPACES.saisie; if (SP && !SP.tabs.some(t => /masse/i.test(t[1]))) { SP.tabs[0][3] = () => !PZ().tab || PZ().tab === "pieces"; SP.tabs.push(["pieces", "⚡ Saisie en masse", () => { PZ().tab = "masse"; }, () => PZ().tab === "masse"]); } } catch (e) { }
  /* la pré-saisie des pièces utilise le moteur de nature et les catégories */
  if (typeof pzAutoFill === "function") { const _af = pzAutoFill; pzAutoFill = function (it) { const r = _af.apply(this, arguments); try { if (it && it.statut !== "comptabilisee" && !it.ncOk) { sdApply(it, false); sdPzSync(it); xSave("inbox", it); } } catch (e) { } return r; }; }
  if (typeof pzQueue === "function") { const _q = pzQueue; pzQueue = function () { return _q.apply(this, arguments).filter(x => x.statut !== "supprimee"); }; }
})();
function sdIt(id) { return XS.inbox.find(x => x.id === id); }
function sdTouch(it, a) { (it.hist ||= []).push({ at: new Date().toISOString(), by: sdWho(), a }); if (it.hist.length > 40) it.hist.splice(0, it.hist.length - 40); xSave("inbox", it); }
/* correction de catégorie : retenue et appliquée aux autres pièces du même tiers */
function sdSetCat(it, catId, why) { const c = sdCat(catId); if (!c) return; it.lignes.forEach(l => { l.cat = c.id; if (c.compte) l.compte = c.compte; l.manual = true; }); it.ncOk = true; it.nc = Object.assign({}, it.nc || {}, { cat: c.id, conf: 100, why: [why || "choisie par " + sdWho()] }); sdPzSync(it); sdTouch(it, "Catégorie : " + c.lib + (c.compte ? " (" + c.compte + ")" : ""));
  if (sdCfg().learn === "1") { const L = sdLearn(); const p = sdParty(it); [it.tiers && "t:" + it.tiers, sdKey(p.nom) && "n:" + sdKey(p.nom)].filter(Boolean).forEach(k => { const m = L[k] ||= { c: {} }; m.c[c.id] = (m.c[c.id] || 0) + 2; m.le = todayISO(); }); Store.touch(); }
  let nb = 0; if (sdCfg().propag === "1" && (it.tiers || sdKey(sdParty(it).nom))) XS.inbox.forEach(x => { if (x === it || !/a_traiter|doublon/.test(x.statut) || x.ncOk || x.sens !== it.sens) return; if ((it.tiers && x.tiers === it.tiers) || (sdKey(sdParty(x).nom) && sdKey(sdParty(x).nom) === sdKey(sdParty(it).nom))) { x.lignes.forEach(l => { if (!l.manual) { l.cat = c.id; if (c.compte) l.compte = c.compte; } }); x.nc = Object.assign({}, x.nc || {}, { cat: c.id, conf: 96, why: ["même tiers que la pièce " + (it.piece || "corrigée")] }); sdTouch(x, "Catégorie reprise de la pièce " + (it.piece || "")); nb++; } });
  return nb; }
Object.assign(ACT, {
  sdTab: el => { PZ().tab = el.dataset.v === "masse" ? "masse" : "pieces"; if (UI.view !== "pieces") ACT.go({ dataset: { v: "pieces" } }); else render(); },
  sdCreate: () => { if (typeof ACT.venteNew === "function") ACT.venteNew({ dataset: { t: "FA" } }); else ACT.go({ dataset: { v: "ventes" } }); },
  sdFilt: el => { UI.sub.sdm.f = el.dataset.v; UI.sub.sdm.sel = []; render(); },
  sdSel: (el, ev) => { const f = UI.sub.sdm; const id = el.dataset.id; f.sel = f.sel.includes(id) ? f.sel.filter(x => x !== id) : f.sel.concat(id); render(); },
  sdSelAll: () => { const f = UI.sub.sdm; const L = sdRows(f).map(x => x.id); f.sel = L.every(id => f.sel.includes(id)) ? [] : L; render(); },
  sdSelNone: () => { UI.sub.sdm.sel = []; render(); },
  sdPost: el => { const it = sdIt(el.dataset.id); if (it && inboxPost(it)) { UI.sub.sdm.sel = UI.sub.sdm.sel.filter(x => x !== it.id); } render(); },
  sdPostAll: () => { let n = 0; XS.inbox.filter(x => x.statut === "a_traiter" && !inboxCheck(x).length).forEach(x => { if (inboxPost(x, true)) n++; }); toast(n + " pièce(s) comptabilisée(s) sans anomalie ✓"); render(); },
  sdPostSel: () => { const f = UI.sub.sdm; let n = 0, k = 0; f.sel.forEach(id => { const it = sdIt(id); if (!it) return; if (it.statut === "a_traiter" && !inboxCheck(it).length && inboxPost(it, true)) n++; else k++; }); f.sel = []; toast(n + " comptabilisée(s)" + (k ? " · " + k + " restent à vérifier (contrôle bloquant)" : "") + "."); render(); },
  sdOk: el => { const it = sdIt(el.dataset.id); if (!it) return; sdSetCat(it, (it.lignes[0] || {}).cat || (it.nc || {}).cat, "confirmée par " + sdWho()); render(); },
  sdOkSel: () => { const f = UI.sub.sdm; f.sel.forEach(id => { const it = sdIt(id); if (it && (it.nc || {}).cat !== "nc") sdSetCat(it, (it.lignes[0] || {}).cat || it.nc.cat, "confirmée par " + sdWho()); }); render(); },
  sdDel: el => { const it = sdIt(el.dataset.id); if (!it) return; it.prevSt = it.statut; it.statut = "supprimee"; it.delAt = new Date().toISOString(); it.delBy = sdWho(); sdTouch(it, "Mise à la corbeille"); toast("Pièce mise à la corbeille · restauration possible."); render(); },
  sdDelSel: () => { const f = UI.sub.sdm; f.sel.forEach(id => { const it = sdIt(id); if (it) { it.prevSt = it.statut; it.statut = "supprimee"; it.delAt = new Date().toISOString(); it.delBy = sdWho(); sdTouch(it, "Mise à la corbeille"); } }); toast(f.sel.length + " pièce(s) à la corbeille."); f.sel = []; render(); },
  sdRest: el => { const it = sdIt(el.dataset.id); if (!it) return; it.statut = it.prevSt || "a_traiter"; delete it.delAt; delete it.delBy; sdTouch(it, "Restaurée"); toast("Pièce restaurée ✓"); render(); },
  sdPurge: el => { if (!canPurge()) { toast("La suppression définitive est réservée à l'éditeur."); return; } const it = sdIt(el.dataset.id); if (!it) return; confirmBox("Supprimer définitivement", `La pièce « ${esc(it.nom || it.piece || "")} » sera effacée définitivement (aucune écriture n'est touchée).`, "Supprimer définitivement", () => { xDel("inbox", it.id); render(); }, true); },
  sdCatPick: (el) => { const r = el.getBoundingClientRect(); UI.sdPick = { id: el.dataset.id, q: "", x: Math.min(window.innerWidth - 330, r.left), y: Math.min(window.innerHeight - 380, r.bottom + 4) + window.scrollY }; render(); setTimeout(() => { const q = document.getElementById("sdPkQ"); if (q) q.focus(); }, 30); },
  sdPickX: () => { UI.sdPick = null; render(); },
  sdCatSet: el => { const it = sdIt(el.dataset.id); UI.sdPick = null; if (!it) return render(); const nb = sdSetCat(it, el.dataset.c); if (nb) toast("Catégorie retenue pour ce tiers et appliquée à " + nb + " autre(s) pièce(s) en attente."); render(); },
  sdCats: () => { UI.sdPick = null; openModal({ type: "sdCats" }); },
  sdCatAdd: () => { sdCats().push({ id: "u" + uid().slice(0, 6), lib: "Nouvelle catégorie", col: "#E0E7FF", compte: "", sens: "A", kw: "", sys: false }); Store.touch(); render(); },
  sdCatDel: el => { const C = sdCats(); const c = C[+el.dataset.i]; if (!c || c.sys) return; confirmBox("Supprimer la catégorie", `« ${esc(c.lib)} » sera retirée. Les pièces déjà comptabilisées ne changent pas.`, "Supprimer", () => { C.splice(+el.dataset.i, 1); Store.touch(); render(); }, true); },
  sdCatReset: () => confirmBox("Catégories d'origine", "Les libellés, couleurs, comptes et mots-clés des catégories intégrées reprennent leurs valeurs d'origine. Vos catégories personnelles sont conservées.", "Rétablir", () => { const C = sdCats(); SD_CAT0.forEach(([id, lib, col, compte, sens, tx]) => { const c = C.find(x => x.id === id); if (c) Object.assign(c, { lib, col, compte, sens, tx: tx === 0 ? 0 : null, kw: "", off: false }); }); Store.touch(); render(); }),
  sdManual: () => { if (!ensureX()) return; const it = { id: uid(), recu: new Date().toISOString(), nom: "Saisie manuelle", source: "manuel", format: "Manuel", inv: { type: "FA", vendeur: {}, acheteur: {}, lignes: [], tva: [], conf: 100, warn: [] }, sens: "A", tiers: "", journal: inboxCfg().journalA || "AC", piece: "", date: todayISO(), ech: "", lib: "", lignes: [{ compte: "", lib: "", ht: 0, taux: 2000, tva: 0 }], statut: "a_traiter", pa: { code: "", hist: [] }, conf: 100, warn: [], text: "" };
    sdApply(it, true); it.hist = [{ at: it.recu, by: sdWho(), a: "Saisie manuelle" }]; XS.inbox.push(it); xSave("inbox", it); const f = UI.sub.sdm ||= { f: "tout", q: "", sel: [], cat: "" }; f.f = "tout"; render(); setTimeout(() => { const x = document.getElementById("sd-" + it.id + "-tiers"); if (x) x.focus(); }, 40); },
  sdRerun: () => { let n = 0; XS.inbox.forEach(it => { if (/a_traiter|doublon/.test(it.statut) && !it.ncOk) { sdApply(it, false); xSave("inbox", it); n++; } }); toast(n + " pièce(s) relue(s)."); render(); },
  sdCfgReset: () => { S.sdCfg = {}; Store.touch(); toast("Réglages de la saisie rétablis"); render(); }
});
Object.assign(CHG, {
  sdFiles: async el => { const fs = [...el.files]; el.value = ""; if (fs.length) await sdAddFiles(el.dataset.k, fs); },
  sdQ: el => { UI.sub.sdm.q = el.value; render(); },
  sdCatF: el => { UI.sub.sdm.cat = el.value; render(); },
  sdCatSel: el => { const f = UI.sub.sdm; let nb = 0; if (!el.value) return; f.sel.forEach(id => { const it = sdIt(id); if (it) nb += sdSetCat(it, el.value); }); toast(f.sel.length + " pièce(s) classée(s)" + (nb ? " · " + nb + " autre(s) du même tiers" : "") + "."); render(); },
  sdF: el => { const it = sdIt(el.dataset.id); if (!it || it.statut === "comptabilisee") return; const f = el.dataset.f; const v = el.value; const l0 = it.lignes[0] || (it.lignes[0] = { compte: "", lib: "", ht: 0, taux: 2000, tva: 0 });
    if (f === "date" || f === "piece") { it[f] = v; if (f === "piece") it.lib = ((tiersBy(it.tiers) || {}).nom || sdParty(it).nom || "") + (v ? " - " + v : ""); sdTouch(it, (f === "date" ? "Date" : "Pièce") + " : " + v); }
    else if (f === "tiers") { const type = it.sens === "V" ? "C" : "F"; const q = sdNorm(v).trim(); let t = S.tiers.find(x => x.type === type && (sdNorm(x.nom) === q || sdNorm(x.code) === q)); if (!t && v.trim()) { t = { type, code: genCode(type, v.trim()), nom: v.trim(), collectif: type === "C" ? "411000" : "401000", defaut: "", taux: 2000, delai: 30, auto: true, creePar: sdWho(), creeLe: new Date().toISOString() }; S.tiers.push(t); Store.touch(); toast((type === "C" ? "Client" : "Fournisseur") + " « " + t.nom + " » créé."); }
      it.tiers = t ? t.code : ""; if (it.source === "manuel") (it.sens === "V" ? it.inv.acheteur : it.inv.vendeur).nom = v.trim(); it.lib = (t ? t.nom : "") + (it.piece ? " - " + it.piece : ""); if (!it.ncOk) sdApply(it, false); it.statut = inboxDup(it) ? "doublon" : "a_traiter"; sdTouch(it, "Tiers : " + (t ? t.nom : "—")); }
    else if (f === "compte") { const c = pad6(v); it.lignes.forEach(l => { l.compte = c; l.manual = true; const k = sdCatByAcc(c, it.sens === "V" ? "V" : "A"); l.cat = k ? k.id : l.cat; }); it.ncOk = true; it.nc = Object.assign({}, it.nc || {}, { conf: 100, why: ["compte saisi par " + sdWho()] }); const k = sdCatByAcc(c, it.sens === "V" ? "V" : "A"); sdTouch(it, "Compte : " + c); if (k) { const nb = sdSetCat(it, k.id, "compte saisi par " + sdWho()); it.lignes.forEach(l => l.compte = c); if (nb) toast("Appliqué aussi à " + nb + " autre(s) pièce(s) du même tiers."); } }
    else if (f === "taux") { l0.taux = Number(v); l0.tva = Math.round(l0.ht * l0.taux / 10000); sdTouch(it, "Taux de TVA : " + (TAUX_LIB[l0.taux] || v)); }
    else if (f === "ht") { l0.ht = cents(v); l0.tva = Math.round(l0.ht * l0.taux / 10000); sdTouch(it, "HT : " + eur(l0.ht)); }
    else if (f === "tva") { l0.tva = cents(v); sdTouch(it, "TVA : " + eur(l0.tva)); }
    else if (f === "ttc") { const ttc = cents(v); l0.ht = Math.round(ttc * 10000 / (10000 + Number(l0.taux || 0))); l0.tva = ttc - l0.ht; if (it.source === "manuel") it.inv.ttc = ttc; sdTouch(it, "TTC : " + eur(ttc)); }
    if (it.source === "manuel") { const T = inboxTotals(it); it.inv.ttc = T.ttc; }
    xSave("inbox", it); render(); },
  sdCatE: el => { const C = sdCats(); const c = C[+el.dataset.i]; if (!c) return; const f = el.dataset.f; c[f] = f === "compte" ? pad6(el.value) : f === "off" ? !!el.value : el.value; Store.touch(); render(); },
  sdCfg: el => { (S.sdCfg ||= {})[el.dataset.f] = /^(seuil|immoSeuil)$/.test(el.dataset.f) ? (el.dataset.f === "immoSeuil" ? cents(el.value) : Number(el.value)) : el.value; Store.touch(); toast("Réglage enregistré"); render(); }
});
/* recherche dans le sélecteur de catégories (sans perdre le focus) */
document.addEventListener("input", ev => { if (ev.target && ev.target.id === "sdPkQ") { UI.sdPick.q = ev.target.value; const pos = ev.target.selectionStart; render(); const q = document.getElementById("sdPkQ"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (e) { } } } });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && UI.sdPick) { UI.sdPick = null; render(); } });
/* glisser-déposer sur les cartes */
document.addEventListener("dragover", ev => { const c = ev.target.closest && ev.target.closest(".sd-card"); if (!c) return; ev.preventDefault(); document.querySelectorAll(".sd-card.over").forEach(x => x !== c && x.classList.remove("over")); c.classList.add("over"); });
document.addEventListener("dragleave", ev => { const c = ev.target.closest && ev.target.closest(".sd-card"); if (c && !c.contains(ev.relatedTarget)) c.classList.remove("over"); });
document.addEventListener("drop", ev => { const c = ev.target.closest && ev.target.closest(".sd-card"); if (!c) return; ev.preventDefault(); c.classList.remove("over"); const fs = [...(ev.dataTransfer.files || [])]; if (fs.length) sdAddFiles(c.dataset.k, fs); });

/* ---------- Paramètres ---------- */
(function () {
  const _p = VIEWS.params; if (typeof _p !== "function") return;
  VIEWS.params = function () { const h = _p.apply(this, arguments); if (!S) return h; const c = sdCfg();
    const yn = (f, l, help) => `<label class="f">${l}<select class="in" data-ch="sdCfg" data-f="${f}"><option value="1" ${c[f] === "1" ? "selected" : ""}>Oui</option><option value="0" ${c[f] !== "1" ? "selected" : ""}>Non</option></select>${help ? `<small class="muted">${help}</small>` : ""}</label>`;
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>⚡ Saisie : dépôt et pré-comptabilisation</h2></div><div class="panel-b"><div class="grid g2">
      ${yn("depot", "Afficher le dépôt de documents dans la saisie")}
      ${yn("auto", "Comptabiliser automatiquement les pièces sans aucune anomalie", "Seules les pièces sans contrôle bloquant ni avertissement, nature confirmée ou certaine, sont passées dès le dépôt.")}
      <label class="f">Confiance minimale pour passer sans confirmation<select class="in" data-ch="sdCfg" data-f="seuil">${[[95, "95 % (très prudent)"], [90, "90 %"], [80, "80 % (recommandé)"], [70, "70 %"]].map(([v, l]) => `<option value="${v}" ${+c.seuil === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      ${yn("learn", "Apprendre de mes corrections", "La catégorie choisie pour un tiers est retenue pour ses prochaines factures.")}
      ${yn("propag", "Appliquer une correction aux autres pièces du même tiers en attente")}
      ${yn("tiersAuto", "Créer automatiquement les fournisseurs et clients inconnus", "Nom, SIREN, TVA intracommunautaire, adresse et IBAN repris de la facture.")}
      ${yn("immo", "Détecter les immobilisations")}
      <label class="f">Seuil d'immobilisation (HT)<input class="in num" data-ch="sdCfg" data-f="immoSeuil" value="${toIn(+c.immoSeuil)}"></label>
      ${yn("tvaNd", "Appliquer la TVA non récupérable", "Transport de personnes, véhicule de tourisme, carburant (80 %).")}
      <label class="f">Véhicules de l'entreprise<select class="in" data-ch="sdCfg" data-f="vehic"><option value="tourisme" ${c.vehic === "tourisme" ? "selected" : ""}>Véhicules de tourisme (TVA carburant 80 %)</option><option value="utilitaire" ${c.vehic === "utilitaire" ? "selected" : ""}>Véhicules utilitaires (TVA 100 %)</option></select></label>
      ${yn("autoliq", "Autoliquidation des achats intracommunautaires", "Fournisseur de l'UE hors France ou mention d'autoliquidation : 445662 / 445200.")}
      </div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="sdCats">🏷 Gérer les catégories</button><button class="btn sm ghost" data-act="sdCfgReset">↺ Réglages par défaut</button></div></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
})();

(function () { const st = document.createElement("style"); st.textContent = `
.sd-tabs{display:flex;gap:4px;margin:0 0 12px;border-bottom:1px solid var(--rule,#D2D9E6)}.sd-tabs button{border:0;background:none;font:inherit;font-weight:700;font-size:14px;padding:9px 14px;cursor:pointer;color:#5A6B6A;border-bottom:3px solid transparent;margin-bottom:-1px}.sd-tabs button.on{color:#0F3D3E;border-color:#F5B700}.sd-tabs button:hover{color:#0F3D3E}
.sd-n{display:inline-block;min-width:18px;padding:0 6px;border-radius:999px;background:#0F3D3E;color:#fff;font-size:11px;line-height:18px;text-align:center}.seg .sd-n{background:rgba(15,61,62,.12);color:#0F3D3E}.seg .on .sd-n{background:rgba(255,255,255,.25);color:#fff}
.sd-dep{margin:0 0 16px}.sd-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap}.sd-h h2{margin:0;font-size:18px;font-weight:800;color:#14202B}
.sd-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.sd-card{position:relative;display:flex;align-items:center;gap:16px;padding:16px 18px;border:2px dashed #C8D2D0;border-radius:14px;background:#fff;transition:border-color .15s,background .15s,box-shadow .15s,transform .15s;min-height:118px}
.sd-card:hover{border-color:#13585A;box-shadow:0 8px 20px -14px rgba(15,61,62,.45)}
.sd-card.over{border-color:#F5B700;background:#FFFBEA;transform:scale(1.01)}
.sd-ill svg{width:74px;height:74px;display:block}.sd-dep.sm .sd-ill svg{width:52px;height:52px}.sd-dep.sm .sd-card{min-height:84px;padding:10px 14px}
.sd-in{display:flex;flex-direction:column;gap:5px;min-width:0}.sd-in b{font-size:15px;color:#14202B}.sd-sub{font-size:12.5px;color:#6B7B7B}.sd-sub b{font-size:12.5px;color:#C77700}
.sd-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:3px}.sd-add{border-color:#13585A!important;color:#13585A!important;font-weight:700;cursor:pointer}
.sd-drop{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-weight:800;color:#8A5A00;border-radius:12px;background:rgba(255,251,234,.85)}.sd-card.over .sd-drop{display:flex}
.sd-busy{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#0F3D3E;background:#EEF6F5;border-radius:999px;padding:4px 12px}.sd-busy i{width:14px;height:14px;border-radius:50%;border:2px solid #B8D4D0;border-top-color:#0F3D3E;animation:sdSpin .7s linear infinite}@keyframes sdSpin{to{transform:rotate(360deg)}}
.sd-oth{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:center}.sd-o{font-size:12px;background:#F4F7F6;border-radius:999px;padding:3px 10px}.sd-o em{font-style:normal;color:#8590A8}
.sd-m{display:flex;flex-direction:column;gap:10px}.sd-mh{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sd-bulk{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#0F3D3E;color:#fff;border-radius:10px;padding:7px 12px}.sd-bulk .btn{background:#fff}.sd-bulk .btn.pri{background:#F5B700;color:#0F1B33;border-color:#F5B700}.sd-bulk .lnk{color:#fff}.sd-bulk select{color:#14202B}
.sd-tw{max-height:calc(100vh - 330px);overflow:auto;border:1px solid var(--rule,#D2D9E6);border-radius:12px}
.sd-t{font-size:12.5px}.sd-t thead th{position:sticky;top:0;background:#F7F9FC;z-index:2}.sd-t td{padding:4px 4px;vertical-align:top}.sd-t tfoot td{position:sticky;bottom:0;background:#F7F9FC;font-weight:700}
.sd-r.on td{background:#FFFBEA}.sd-r.ko td:first-child{box-shadow:inset 3px 0 0 #E0A800}.sd-r.ok td:first-child{box-shadow:inset 3px 0 0 #1F8A55}
.sd-i{padding:4px 6px!important;font-size:12.5px!important;min-width:0;width:100%}.sd-i.num{text-align:right;width:84px}.sd-i.b{font-weight:700}.sd-t input[type=date].sd-i{width:122px}.sd-t .mono.sd-i{width:84px}.sd-t .acc.sd-i{width:100px}.sd-t select.sd-i{width:74px}
.sd-st{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;font-weight:800;font-size:12px;cursor:help}.sd-st.ok{background:#DDF3E6;color:#145C3A}.sd-st.ko{background:#FFF0C7;color:#8A5A00}.sd-st.dup{background:#F3E4E6;color:#A12A3B}.sd-st.del{background:#EEF1F6}
.sd-sens{display:inline-block;font-size:11px;font-weight:700;border-radius:6px;padding:1px 6px}.sd-sens.a{background:#E6EEF8;color:#2B4A7A}.sd-sens.v{background:#E3F4EA;color:#1F6B44}
.sd-eye{border:0;background:none;cursor:pointer;font-size:13px;padding:0 3px;opacity:.7}.sd-eye:hover{opacity:1}
.sd-new{display:inline-block;font-size:10.5px;color:#8A5A00;background:#FFF4D6;border-radius:5px;padding:0 5px;margin-top:2px}
.sd-chip{display:inline-flex;align-items:center;gap:4px;border:0;border-radius:999px;padding:2px 10px;font:inherit;font-size:12px;font-weight:600;color:#1F2D2D;cursor:pointer;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis}.sd-chip i{font-style:normal;opacity:.5;font-size:10px}
.sd-cc{display:flex;align-items:center;gap:6px}.sd-cc-td{min-width:0}.sd-acc{display:flex;align-items:center;gap:6px}.sd-t input[list^="sdT"]{min-width:150px;max-width:190px}.sd-t td{white-space:nowrap}.sd-why{white-space:normal}.sd-conf{width:34px;height:5px;border-radius:5px;background:#E3EBEA;overflow:hidden;flex:none}.sd-conf i{display:block;height:100%}
.sd-why{font-size:11px;color:#6B7B7B;margin-top:2px;max-width:240px}.sd-why.bad{color:#C2364B}
.sd-act{white-space:nowrap}.sd-act .btn{margin-left:3px}
.sd-leg{padding:0 2px}.sd-warn{font-size:12px;color:#6B5300;background:#FFF8E1;border-radius:8px;padding:6px 10px;margin:6px 0}
.sd-pk-bg{position:fixed;inset:0;z-index:30}.sd-pk{position:absolute;z-index:31;width:320px;background:#fff;border:1px solid #DCE3EF;border-radius:12px;box-shadow:0 20px 50px rgba(15,27,51,.22);overflow:hidden}
.sd-pk-s{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #EEF1F6}.sd-pk-s input{border:0;outline:none;font:inherit;font-size:14px;flex:1}
.sd-pk-h{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#8590A8;padding:6px 12px 2px}
.sd-pk-l{max-height:300px;overflow:auto}.sd-pk-i{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:6px 12px;cursor:pointer;font:inherit;text-align:left}.sd-pk-i:hover,.sd-pk-i.on{background:#F4F7F6}.sd-pk-i .mono{margin-left:auto;color:#8590A8}
.sd-pk-f{border-top:1px solid #EEF1F6;padding:6px 12px}
.sd-col{width:34px;height:28px;border:0;background:none;padding:0;cursor:pointer}.sd-off td{opacity:.5}
@media (max-width:1000px){.sd-grid{grid-template-columns:1fr}.sd-tw{max-height:none}}`; document.head.appendChild(st); })();

/* ============================================================================
   Visionneuse de validation : le document à gauche, la pré-saisie à droite
   (saisie en masse, import depuis la saisie des journaux), navigation pièce par pièce
   ========================================================================== */
UI.sdImg ||= {};
async function sdLoadPv(it) { const C = UI.sdImg; if (C[it.id] && !C[it.id].err) return; C[it.id] = { loading: true };
  try { if (it.source === "manuel") { C[it.id] = { none: true }; return; } const b = await inboxBytes(it); const head = latin1(b.subarray(0, 5));
    if (head.startsWith("%PDF")) { const url = URL.createObjectURL(new Blob([b], { type: "application/pdf" })); let pages = [];
      try { const lib = await ensurePdfJs(); const pdf = await lib.getDocument({ data: b.slice() }).promise; for (let p = 1; p <= Math.min(pdf.numPages, 6); p++) { const pg = await pdf.getPage(p); const vp = pg.getViewport({ scale: 1.6 }); const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; pages.push(c.toDataURL("image/jpeg", .86)); } } catch (e) { pages = []; }
      C[it.id] = { pages, url }; }
    else if (/^\xFF\xD8|^\x89PNG|^RIFF|^GIF/.test(head) || (it.inv && it.inv.photo)) C[it.id] = { pages: [URL.createObjectURL(new Blob([b], { type: "image/jpeg" }))], url: URL.createObjectURL(new Blob([b])) };
    else C[it.id] = { xml: utf8(b).slice(0, 30000) };
  } catch (e) { C[it.id] = { err: e.message || String(e) }; }
  if (UI.modal && UI.modal.type === "sdView") render(); }
function sdPvHTML(it) { const P = UI.sdImg[it.id]; const z = UI.sdZoom || 100; const rot = UI.sdRot || 0;
  if (!P || P.loading) { if (!P) setTimeout(() => sdLoadPv(it), 0); return `<div class="sdv-wait"><span class="sd-busy"><i></i>Chargement du document…</span></div>`; }
  if (P.none) return `<div class="sdv-wait"><div style="font-size:34px">✍</div><b>Saisie manuelle</b><span class="small muted">Aucun document : joignez la pièce depuis l'écriture une fois comptabilisée.</span></div>`;
  if (P.err) return `<div class="sdv-wait"><div style="font-size:34px">📄</div><b>Document indisponible</b><span class="small muted">${esc(P.err)}</span>${it.text ? `<pre class="sdv-txt">${esc(it.text)}</pre>` : ""}</div>`;
  if (P.xml) return `<pre class="sdv-txt">${esc(P.xml)}</pre>`;
  if (P.pages && P.pages.length) return `<div class="sdv-pages" style="transform:rotate(${rot}deg)">${P.pages.map((u, i) => `<img src="${u}" alt="Page ${i + 1}" style="width:${z}%">`).join("")}</div>`;
  return `<div class="sdv-fw"><iframe class="sdv-frame" src="${P.url}#toolbar=0&view=FitH" title="Document"></iframe>${it.text ? `<details class="sdv-pv"><summary>Texte lu sur la pièce</summary><pre class="sdv-txt">${esc(it.text)}</pre></details>` : ""}</div>`; }
function sdViewHTML(M) {
  const ids = (M.q || []).filter(id => XS.inbox.some(x => x.id === id)); if (!ids.length) return modalFrame("Pièce", "Plus aucune pièce à afficher.", `<button class="btn" data-act="closeModal">Fermer</button>`);
  M.i = Math.max(0, Math.min(M.i || 0, ids.length - 1)); M.q = ids; const it = XS.inbox.find(x => x.id === ids[M.i]); const lock = it.statut === "comptabilisee"; const dis = lock || it.statut === "supprimee" ? "disabled" : "";
  const T = inboxTotals(it); const ck = lock ? { B: [], W: [] } : sdChecks(it); const P = lock ? [] : inboxCheck(it); const nc = it.nc || {}; const t = tiersBy(it.tiers); const party = sdParty(it); const l0 = it.lignes[0] || {}; const multi = it.lignes.length > 1;
  const lines = it.lignes.map((l, i) => `<tr><td><input class="in mono acc sd-i" list="acc-list" value="${esc(l.compte)}" data-ch="sdL" data-id="${it.id}" data-i="${i}" data-f="compte" ${dis}><div class="small muted">${esc(accLib(l.compte))}</div></td><td><select class="in sd-i" data-ch="sdL" data-id="${it.id}" data-i="${i}" data-f="taux" ${dis}>${tauxOpts.concat([[850, "8,5 %"]]).map(([a, b]) => `<option value="${a}" ${Number(a) === Number(l.taux) ? "selected" : ""}>${b}</option>`).join("")}</select></td><td><input class="in sd-i num" value="${toIn(l.ht)}" data-ch="sdL" data-id="${it.id}" data-i="${i}" data-f="ht" ${dis}></td><td><input class="in sd-i num" value="${toIn(l.tva)}" data-ch="sdL" data-id="${it.id}" data-i="${i}" data-f="tva" ${dis}></td><td class="r mono">${eur((l.ht || 0) + (l.tva || 0))}</td></tr>`).join("");
  let prev = []; try { prev = inboxEcriture(it).lignes; } catch (e) { }
  const body = `<div class="sdv-body"><div class="sdv-l"><div class="sdv-bar"><b class="small">${esc(it.nom || "Document")}</b><span class="sp"></span><button class="btn sm ghost" data-act="sdZoom" data-v="-20" title="Réduire">－</button><span class="small mono">${UI.sdZoom || 100} %</span><button class="btn sm ghost" data-act="sdZoom" data-v="20" title="Agrandir">＋</button><button class="btn sm ghost" data-act="sdRot" title="Pivoter">⟳</button>${(UI.sdImg[it.id] || {}).url ? `<a class="btn sm ghost" href="${UI.sdImg[it.id].url}" target="_blank" rel="noopener" title="Ouvrir dans un nouvel onglet">↗</a>` : ""}</div><div class="sdv-doc">${sdPvHTML(it)}</div></div>
    <div class="sdv-r"><div class="sdv-und"><div class="row" style="gap:8px;align-items:center"><span class="sd-sens ${it.sens === "V" ? "v" : "a"}">${it.sens === "V" ? "Facture client" : "Facture fournisseur"}</span>${lock ? '<span class="pill ok">✓ Comptabilisée</span>' : P.length ? `<span class="pill warn">À vérifier</span>` : '<span class="pill ok">Prête</span>'}<span class="sp"></span><span class="small muted">Lecture ${it.conf || 0} %</span></div>
      <div class="sdv-cat"><span class="small muted">Catégorie</span>${sdChip(l0.cat || nc.cat, it.id)}<span class="sd-conf"><i style="width:${it.ncOk ? 100 : nc.conf || 0}%;background:${it.ncOk || (nc.conf || 0) >= 85 ? "#1F8A55" : (nc.conf || 0) >= 65 ? "#E0A800" : "#C2364B"}"></i></span><span class="small">${it.ncOk ? "✓ confirmée" : (nc.conf || 0) + " %"}</span></div>${(nc.why || []).length ? `<div class="small muted">Pourquoi : ${esc(nc.why.join(", "))}</div>` : ""}</div>
      ${P.length ? `<div class="sdv-ko">${P.map(x => "• " + esc(x)).join("<br>")}</div>` : ""}${ck.W.length ? `<div class="sd-warn">${ck.W.map(x => "ⓘ " + esc(x)).join("<br>")}</div>` : ""}
      <div class="sdv-g"><label class="f">${it.sens === "V" ? "Client" : "Fournisseur"}<input class="in" list="sdT-${it.sens === "V" ? "C" : "F"}" value="${esc(t ? t.nom : party.nom || "")}" data-ch="sdF" data-id="${it.id}" data-f="tiers" ${dis}></label><label class="f">N° de facture<input class="in mono" value="${esc(it.piece || "")}" data-ch="sdF" data-id="${it.id}" data-f="piece" ${dis}></label>
        <label class="f">Date<input class="in" type="date" value="${esc(it.date || "")}" data-ch="sdF" data-id="${it.id}" data-f="date" ${dis}></label><label class="f">Échéance<input class="in" type="date" value="${esc(it.ech || "")}" data-ch="sdV" data-id="${it.id}" data-f="ech" ${dis}></label>
        <label class="f" style="grid-column:1/-1">Libellé<input class="in" value="${esc(it.lib || "")}" data-ch="sdV" data-id="${it.id}" data-f="lib" ${dis}></label>
        <label class="f">Journal<select class="in" data-ch="sdV" data-id="${it.id}" data-f="journal" ${dis}>${S.journaux.map(j => `<option value="${esc(j.code)}" ${j.code === it.journal ? "selected" : ""}>${esc(j.code)} · ${esc(j.lib)}</option>`).join("")}</select></label>
        <label class="f">Type<select class="in" data-ch="sdV" data-id="${it.id}" data-f="type" ${dis}><option value="FA" ${it.inv.type !== "AV" ? "selected" : ""}>Facture</option><option value="AV" ${it.inv.type === "AV" ? "selected" : ""}>Avoir</option></select></label></div>
      <table class="t sdv-t"><thead><tr><th>Compte</th><th>TVA</th><th class="r">HT</th><th class="r">TVA</th><th class="r">TTC</th></tr></thead><tbody>${lines}</tbody><tfoot><tr><td colspan="2">Total${it.inv.ttc ? ` <span class="small ${Math.abs(it.inv.ttc - T.ttc) > 2 ? "bad" : "ok"}">· lu sur la facture ${eur(it.inv.ttc)}</span>` : ""}</td><td class="r mono">${eur(T.ht)}</td><td class="r mono">${eur(T.tva)}</td><td class="r mono"><b>${eur(T.ttc)}</b></td></tr></tfoot></table>
      ${lock ? "" : `<div class="row" style="gap:6px"><button class="btn sm ghost" data-act="sdLAdd" data-id="${it.id}">＋ Ventiler sur un autre compte</button>${multi ? `<button class="btn sm ghost" data-act="sdLDel" data-id="${it.id}">− Retirer la dernière ligne</button>` : ""}</div>`}
      <details class="sdv-pv" ${lock ? "open" : ""}><summary>Écriture ${lock ? "passée" : "qui sera passée"} · journal ${esc(it.journal)}</summary><table class="t"><tbody>${prev.map(l => `<tr><td class="mono">${esc(l.compte)}${l.aux ? " · " + esc(l.aux) : ""}<div class="small muted">${esc(accLib(l.compte))}</div></td><td class="r mono">${l.debit ? eur(l.debit) : ""}</td><td class="r mono">${l.credit ? eur(l.credit) : ""}</td></tr>`).join("")}</tbody></table></details>
      ${(it.hist || []).length ? `<details class="sdv-pv"><summary>Historique (${it.hist.length})</summary>${it.hist.slice().reverse().map(h => `<div class="small"><b>${esc(h.by)}</b> · ${new Date(h.at).toLocaleString("fr-FR")} · ${esc(h.a)}</div>`).join("")}</details>` : ""}
    </div></div>${typeof accOptions === "function" ? accOptions() : ""}<datalist id="sdT-F">${S.tiers.filter(x => x.type === "F").map(x => `<option value="${esc(x.nom)}">`).join("")}</datalist><datalist id="sdT-C">${S.tiers.filter(x => x.type === "C").map(x => `<option value="${esc(x.nom)}">`).join("")}</datalist>${UI.sdPick ? sdPickHTML() : ""}`;
  const foot = `<button class="btn" data-act="sdVNav" data-v="-1" ${M.i ? "" : "disabled"} title="Pièce précédente (Alt + ←)">◀</button><span class="small mono">${M.i + 1} / ${ids.length}</span><button class="btn" data-act="sdVNav" data-v="1" ${M.i < ids.length - 1 ? "" : "disabled"} title="Pièce suivante (Alt + →)">▶</button><span style="flex:1"></span>
    ${lock ? `<button class="btn" data-act="viewEcr" data-id="${it.ecrId}">Voir l'écriture</button>` : `<button class="btn ghost" data-act="sdVDel">🗑 Corbeille</button><button class="btn ghost" data-act="sdVFull" title="Fenêtre complète : statut plateforme, lecture IA, contrepartie">Détail complet</button>${!it.ncOk && nc.cat !== "nc" ? `<button class="btn" data-act="sdOk" data-id="${it.id}">✓ Confirmer la nature</button>` : ""}<button class="btn pri" data-act="sdVPost" ${P.length ? "disabled" : ""} title="Ctrl + Entrée">Comptabiliser${ids.length > 1 ? " et suivante" : ""}</button>`}`;
  return modalFrame((it.sens === "V" ? "Vérifier la facture client" : "Vérifier la facture fournisseur") + (it.piece ? " " + esc(it.piece) : ""), body, foot, true);
}
(function () { const _rm = renderModal; renderModal = function () { const M = UI.modal; if (M && M.type === "sdView") return sdViewHTML(M); return _rm.apply(this, arguments); }; })();
function sdOpenView(ids, id) { UI.sdPick = null; openModal({ type: "sdView", q: ids, i: Math.max(0, ids.indexOf(id)) }); }
Object.assign(ACT, {
  sdView: el => { const f = UI.sub.sdm ||= { f: "tout", q: "", sel: [], cat: "" }; const ids = sdRows(f).map(x => x.id); if (!ids.includes(el.dataset.id)) ids.unshift(el.dataset.id); sdOpenView(ids, el.dataset.id); },
  sdVNav: el => { const M = UI.modal; M.i = (M.i || 0) + Number(el.dataset.v); UI.sdPick = null; render(); },
  sdZoom: el => { UI.sdZoom = Math.max(40, Math.min(250, (UI.sdZoom || 100) + Number(el.dataset.v))); render(); },
  sdRot: () => { UI.sdRot = ((UI.sdRot || 0) + 90) % 360; render(); },
  sdVFull: () => { const M = UI.modal; const id = M.q[M.i]; openModal({ type: "inboxItem", id, tab: "lecture" }); },
  sdVDel: () => { const M = UI.modal; const it = sdIt(M.q[M.i]); if (!it) return; it.prevSt = it.statut; it.statut = "supprimee"; it.delAt = new Date().toISOString(); it.delBy = sdWho(); sdTouch(it, "Mise à la corbeille"); M.q = M.q.filter(x => x !== it.id); toast("Pièce mise à la corbeille · restauration possible."); if (!M.q.length) closeModal(); else render(); },
  sdVPost: () => { const M = UI.modal; const it = sdIt(M.q[M.i]); if (!it) return; if (!inboxPost(it)) { render(); return; } const rest = M.q.filter(id => { const x = sdIt(id); return x && x.statut !== "comptabilisee"; }); if (!rest.length) { closeModal(); toast("Toutes les pièces sont comptabilisées ✓"); return; } const nx = M.q.slice(M.i + 1).find(id => rest.includes(id)) || rest[0]; M.q = rest; M.i = rest.indexOf(nx); render(); },
  sdLAdd: el => { const it = sdIt(el.dataset.id); if (!it) return; const l0 = it.lignes[0] || {}; it.lignes.push({ compte: l0.compte || "", cat: l0.cat, lib: "", ht: 0, taux: l0.taux ?? 2000, tva: 0, manual: true }); sdTouch(it, "Ventilation ajoutée"); render(); },
  sdLDel: el => { const it = sdIt(el.dataset.id); if (!it || it.lignes.length < 2) return; it.lignes.pop(); sdTouch(it, "Ventilation retirée"); render(); }
});
Object.assign(CHG, {
  sdV: el => { const it = sdIt(el.dataset.id); if (!it || it.statut === "comptabilisee") return; const f = el.dataset.f; if (f === "type") { it.inv.type = el.value; sdTouch(it, el.value === "AV" ? "Marquée comme avoir" : "Marquée comme facture"); } else { it[f] = el.value; sdTouch(it, ({ ech: "Échéance", lib: "Libellé", journal: "Journal" })[f] + " : " + el.value); } render(); },
  sdL: el => { const it = sdIt(el.dataset.id); if (!it || it.statut === "comptabilisee") return; const l = it.lignes[+el.dataset.i]; if (!l) return; const f = el.dataset.f;
    if (f === "compte") { l.compte = pad6(el.value); l.manual = true; const k = sdCatByAcc(l.compte, it.sens === "V" ? "V" : "A"); if (k) l.cat = k.id; it.ncOk = true; }
    else if (f === "taux") { l.taux = Number(el.value); l.tva = Math.round(l.ht * l.taux / 10000); } else if (f === "ht") { l.ht = cents(el.value); l.tva = Math.round(l.ht * l.taux / 10000); } else if (f === "tva") l.tva = cents(el.value);
    sdTouch(it, "Ligne " + (+el.dataset.i + 1) + " : " + f + " " + el.value); render(); }
});
document.addEventListener("keydown", ev => { const M = UI.modal; if (!M || M.type !== "sdView") return; if (ev.altKey && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")) { ev.preventDefault(); const n = (M.i || 0) + (ev.key === "ArrowRight" ? 1 : -1); if (n >= 0 && n < M.q.length) { M.i = n; render(); } } else if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); ACT.sdVPost(); } });

/* le 👁 de la saisie en masse ouvre la visionneuse ; « Corriger » aussi */
(function () { const _m = sdMasse; sdMasse = function () { return _m.apply(this, arguments).replace(/data-act="inboxOpen" data-id="([^"]+)"/g, 'data-act="sdView" data-id="$1"'); }; })();

/* ---------- Saisie des journaux (vue détaillée) : importer des PDF et voir la pièce de chaque écriture ---------- */
async function sdJImport(files, journal) {
  if (!files.length) return; for (let k = 0; k < 100 && !ensureX(); k++) await new Promise(r => setTimeout(r, 100));
  const j = journalBy(journal) || {}; const kind = j.type === "VEN" ? "V" : "A"; const before = XS.inbox.length; await sdAddFiles(kind, files);
  const added = XS.inbox.slice(before); added.forEach(it => { it.journal = journal; xSave("inbox", it); });
  if (added.length) sdOpenView(added.map(x => x.id), added[0].id);
}
(function () {
  if (typeof ecrBlock === "function") { const _eb = ecrBlock; ecrBlock = function (e) { const h = _eb.apply(this, arguments); const has = (e.docs || []).length || e.pj || e.inboxId; const lock = typeof isLocked === "function" && isLocked(e);
    const btn = has ? `<button class="btn sm sd-pj" data-act="sdEDoc" data-id="${e.id}" title="Voir la pièce justificative">📎 Pièce${(e.docs || []).length + (e.pj ? 1 : 0) > 1 ? "s" : ""}</button>` : lock ? "" : `<label class="btn sm ghost sd-pj" title="Joindre la pièce justificative (PDF, photo)">📎 Joindre<input type="file" hidden accept=".pdf,image/*" data-ch="sdEAtt" data-id="${e.id}"></label>`;
    return h.replace('<div class="row">', '<div class="row">' + btn); }; }
  const _vs = VIEWS.saisie; VIEWS.saisie = function () { const h = _vs.apply(this, arguments); if (!S) return h; const st = UI.sub.saisie || {};
    return h.replace('<button class="btn" data-act="reglement">', `<label class="btn" title="Importer des factures PDF, Factur-X ou photos : lues, pré-saisies et affichées à côté pour validation">⇪ Importer des PDF<input type="file" multiple hidden accept=".pdf,.xml,.zip,image/*,application/pdf" data-ch="sdJImp" data-j="${esc(st.journal || "")}"></label><button class="btn" data-act="reglement">`); };
})();
Object.assign(ACT, {
  sdEDoc: el => { const e = E.find(x => x.id === el.dataset.id); if (!e) return; if (e.inboxId && ensureX() && XS.inbox.some(x => x.id === e.inboxId)) return sdOpenView([e.inboxId], e.inboxId); openModal({ type: "gDocs", e: e.id, mode: "open" }); setTimeout(() => { try { gPreview(e, 0); } catch (x) { } }, 50); }
});
Object.assign(CHG, {
  sdJImp: async el => { const fs = [...el.files]; el.value = ""; await sdJImport(fs, el.dataset.j || (UI.sub.saisie || {}).journal || "AC"); },
  sdEAtt: async el => { const e = E.find(x => x.id === el.dataset.id); const fs = [...el.files]; el.value = ""; if (!e || !fs.length) return; if (typeof gAttach === "function") return gAttach(e, fs); toast("Ajout de pièce indisponible."); }
});
/* la vue « Écriture » (consultation) propose aussi la pièce */
(function () { const _rm = renderModal; renderModal = function () { const h = _rm.apply(this, arguments); const M = UI.modal; if (!M || M.type !== "viewEcr") return h; const e = E.find(x => x.id === M.id); if (!e || !((e.docs || []).length || e.pj || e.inboxId)) return h; return h.replace(/(<button class="btn[^"]*" data-act="closeModal"[^>]*>)/, `<button class="btn" data-act="sdEDoc" data-id="${e.id}">📎 Voir la pièce</button>$1`); }; })();
(function () { const st = document.createElement("style"); st.textContent = `
.modal:has(.sdv-body){width:min(1500px,97vw)!important;max-width:97vw;height:94vh;display:flex;flex-direction:column}.modal:has(.sdv-body)>.panel-b{flex:1;min-height:0;padding:0;overflow:hidden}
.sdv-body{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(380px,.85fr);height:100%;min-height:0}
.sdv-l{display:flex;flex-direction:column;min-height:0;background:#EEF1F5;border-right:1px solid var(--rule,#D2D9E6)}
.sdv-bar{display:flex;align-items:center;gap:4px;padding:6px 10px;background:#fff;border-bottom:1px solid var(--rule,#D2D9E6)}.sdv-bar .sp{flex:1}
.sdv-doc{flex:1;min-height:0;overflow:auto;padding:14px;display:flex;justify-content:center}
.sdv-pages{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;transition:transform .2s}.sdv-pages img{max-width:none;box-shadow:0 4px 18px rgba(15,27,51,.18);background:#fff;border-radius:3px}
.sdv-fw{width:100%;display:flex;flex-direction:column;gap:8px}.sdv-frame{width:100%;height:100%;min-height:72vh;border:0;background:#fff;border-radius:4px}
.sdv-wait{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:#33405C;width:100%}
.sdv-txt{white-space:pre-wrap;font-size:11.5px;background:#fff;border-radius:6px;padding:12px;width:100%;max-height:100%;overflow:auto;text-align:left}
.sdv-r{overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.sdv-und{border:1px solid #DCE7E5;background:#F6FAF9;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}.sdv-und .sp{flex:1}
.sdv-cat{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sdv-ko{font-size:12.5px;color:#8F1F31;background:#FDECEE;border-radius:8px;padding:7px 10px}
.sdv-g{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sdv-g .f{font-size:12.5px}
.sdv-t{font-size:12.5px}.sdv-t td{padding:4px}.sdv-t .sd-i.num{width:96px}.sdv-t .acc{width:110px}.sdv-t .ok{color:#1F8A55}.sdv-t .bad{color:#C2364B}
.sdv-pv summary{cursor:pointer;font-weight:700;font-size:12.5px;color:#13585A;padding:4px 0}.sdv-pv table{font-size:12px}
.sd-pj{margin-right:4px}body:has(.sdv-body) .ai-fab{display:none!important}body:has(.sdv-body) #toast{top:16px!important;bottom:auto!important}
@media (max-width:900px){.sdv-body{grid-template-columns:1fr;grid-template-rows:45vh auto}.modal:has(.sdv-body){height:96vh}.modal:has(.sdv-body)>.panel-b{overflow:auto}}`; document.head.appendChild(st); })();

/* ============================================================================
   Lecture renforcée des pièces : vrai émetteur (pas le titre du document),
   montants sans centimes (« 750 € »), TVA ne portant que sur une partie (loyer + charges)
   ========================================================================== */
const SD_TITLES = /^(quittance|avis d.?[ée]ch[ée]ance|note d.?honoraires|relev[ée]|facture|avoir|devis|bon de|ticket|re[çc]u|appel de|avis de|[ée]ch[ée]ancier|attestation|contrat|bulletin|note de|invoice|duplicata|page)(?![a-z])/i;
function sdVendorFix(inv, text) {
  const L = String(text || "").split(/\n/).map(x => x.trim()).filter(Boolean); const ours = sdKey((S && S.nom) || "");
  const bad = n => !n || n.length < 3 || SD_TITLES.test(n) || /:|\d{2}\/\d{2}\/\d{2,4}|^(date|p[ée]riode|locataire|client|factur[ée]|adresse|tel|t[ée]l[ée]phone|email|siret|siren|tva|total|montant)\b/i.test(n) || (ours && sdKey(n) === ours);
  const v = inv.vendeur ||= {}; if (!bad(v.nom)) return;
  for (const l of L.slice(0, 25)) { const m = l.match(/^(?:bailleur|[ée]metteur|fournisseur|vendeur|prestataire|soci[ée]t[ée]|raison sociale|cabinet|propri[ée]taire|gestionnaire|exp[ée]diteur|assureur|organisme)\s*:\s*(.{3,60})$/i); if (m && !(ours && sdKey(m[1]) === ours)) { v.nom = m[1].trim(); return; } }
  const c = L.slice(0, 12).map(l => l.split(/\s{3,}/)[0].trim()).find(x => !bad(x) && /[A-Za-zÀ-ÿ]{3}/.test(x) && x.length <= 60 && !/^\d/.test(x) && !/\b\d{5}\b/.test(x)); if (c) v.nom = c;
}
function sdAmtFix(inv, text) {
  if (inv.ttc && inv.ttc > 0) return; const L = String(text || "").split(/\n/);
  const amt = s => { const m = String(s).match(/(-?\d{1,3}(?:[  .]\d{3})*(?:,\d{1,2})?|-?\d+(?:[.,]\d{1,2})?)\s*(?:€|\beur(?:os)?\b)/i) || String(s).match(/(-?\d{1,3}(?:[  .]\d{3})*,\d{2})\s*$/); if (!m) return null; let x = m[1].replace(/[  ]/g, ""); if (/,\d{1,2}$/.test(x)) x = x.replace(/\./g, "").replace(",", "."); return Math.round(parseFloat(x) * 100); };
  let ttc = null; L.forEach(l => { if (/total|net [àa] payer|montant (total|d[ûu]|re[çc]u)|somme de|[àa] payer/i.test(l)) { const a = amt(l); if (a) ttc = a; } });
  if (!ttc) { const all = L.map(amt).filter(x => x > 0); if (all.length) ttc = Math.max(...all); }
  if (ttc) { inv.ttc = ttc; const tv = /t\.?v\.?a\.?\s*(20|10|5,5)\s*%/i.test(text) ? null : 0; if (tv === 0) { inv.ht = ttc; inv.tvaTot = 0; inv.tva = [{ taux: 0, base: ttc, montant: 0 }]; } (inv.warn ||= []).push("Montants lus sans centimes : vérifiez le total."); inv.conf = Math.max(inv.conf || 0, 60); }
}
(function () { if (typeof parseInvoiceText !== "function") return; const _p = parseInvoiceText; parseInvoiceText = function (text) { const inv = _p.apply(this, arguments); try { sdVendorFix(inv, text); sdAmtFix(inv, text); if (/quittance|loyer d.?habitation/i.test(String(text).slice(0, 800)) && !/t\.?v\.?a\.?\s*(20|10)/i.test(text) && inv.ttc) { inv.tva = [{ taux: 0, base: inv.ttc, montant: 0 }]; inv.ht = inv.ttc; inv.tvaTot = 0; } } catch (e) { } return inv; }; })();
/* TVA qui ne porte que sur une partie de la base : la ligne est scindée (base taxable + part sans TVA) */
function sdTvaSplit(it) { if (!it || it.statut === "comptabilisee" || (it.lignes || []).length !== 1) return false; const l = it.lignes[0]; if (l.manual || !l.tva || !l.ht) return false; const exp = Math.round(l.ht * l.taux / 10000); if (Math.abs(exp - l.tva) <= Math.max(3, l.ht * .002)) return false;
  for (const r of [l.taux, 2000, 1000, 550, 210].filter((x, i, a) => x && a.indexOf(x) === i)) { const base = Math.round(l.tva * 10000 / r); if (base > 0 && base < l.ht && Math.abs(Math.round(base * r / 10000) - l.tva) <= 1) { const rest = l.ht - base; it.lignes = [Object.assign({}, l, { ht: base, taux: r, tva: l.tva }), Object.assign({}, l, { ht: rest, taux: 0, tva: 0, lib: l.lib || "Part sans TVA" })]; (it.hist ||= []).push({ at: new Date().toISOString(), by: "Speedix", a: "TVA " + (r / 100).toString().replace(".", ",") + " % sur " + eur(base) + " seulement ; " + eur(rest) + " sans TVA" }); return true; } }
  return false; }
(function () { const _a = sdApply; sdApply = function (it) { try { sdTvaSplit(it); } catch (e) { } const r = _a.apply(this, arguments);
  try { const c = sdCat((it.nc || {}).cat); const noTvaTxt = !/t\.?\s?v\.?\s?a\b|taxe sur la valeur/i.test(String(it.text || "")); if (c && c.tx === 0 && it.sens !== "V" && it.statut !== "comptabilisee" && noTvaTxt && it.text) { it.lignes.forEach(l => { if (l.manual || !l.tva) return; l.ht = l.ht + l.tva; l.tva = 0; l.taux = 0; }); } } catch (e) { } return r; }; })();

/* ============================================================================
   IA : relit la pièce quand la reconnaissance n'est pas certaine et choisit la catégorie
   ========================================================================== */
async function sdIA(it) {
  if (!it || it.ncIATried || it.statut !== "a_traiter" || it.ncOk) return; const nc = it.nc || {}; if (nc.cat !== "nc" && (nc.conf || 0) >= 90) return;
  let sample = null; try { sample = typeof iainSample === "function" ? await iainSample() : null; } catch (e) { } if (!sample) return; if (typeof aboOK === "function" && !aboOK("ia")) return;
  it.ncIATried = true; const sens = it.sens === "V" ? "V" : "A"; const C = sdCats().filter(c => !c.off && (c.sens || "A") === sens && c.id !== "nc");
  const p = sdParty(it); const prompt = `Tu es expert-comptable français. Détermine la nature comptable de cette pièce (${sens === "V" ? "facture de vente" : "pièce d'achat ou de dépense"}). Lis le type de document (quittance, avis d'échéance, note d'honoraires, facture…), l'émetteur et les lignes.
Catégories possibles (id : libellé, compte PCG) :
${C.map(c => c.id + " : " + c.lib + " (" + c.compte + ")").join("\n")}
Réponds UNIQUEMENT avec un objet JSON : {"cat":"id","confiance":0-100,"raison":"5 à 10 mots"}
Émetteur lu : ${p.nom || "?"} · fichier : ${it.nom || ""} · total TTC : ${eur(inboxTotals(it).ttc)} €
Texte de la pièce :
${String(it.text || (it.inv && it.inv.ia && it.inv.ia.des) || "").slice(0, 6000)}`;
  try { const j = await sample.json(prompt, { modelTier: "default" }); if (j && C.some(c => c.id === j.cat)) { it.ncIA = { cat: j.cat, conf: Math.max(0, Math.min(100, +j.confiance || 70)), why: String(j.raison || "").slice(0, 80) }; sdApply(it, false); sdPzSync(it); (it.hist ||= []).push({ at: new Date().toISOString(), by: "IA", a: "Nature confirmée par l'IA : " + sdCat(j.cat).lib }); xSave("inbox", it); if (UI.view === "pieces") render(); } } catch (e) { console.warn("IA nature", e); }
}
(function () { const _f = sdFix; sdFix = function (it) { const r = _f.apply(this, arguments); setTimeout(() => sdIA(it), 30); return r; };
  if (typeof pzAutoFill === "function") { const _af = pzAutoFill; pzAutoFill = function (it) { const r = _af.apply(this, arguments); if (it && !it.ncIATried) setTimeout(() => sdIA(it), 60); return r; }; } })();

/* ============================================================================
   Comptabilisation en lot après vérification
   ========================================================================== */
function sdBatchPost(ids) { let n = 0; const ko = []; ids.forEach(id => { const it = sdIt(id); if (!it || it.statut !== "a_traiter") return;
    if (!it.ncOk && (it.nc || {}).cat && it.nc.cat !== "nc") { it.ncOk = true; it.nc.why = ["validée en lot par " + sdWho()].concat(it.nc.why || []).slice(0, 4); sdLearnFrom(it); sdTouch(it, "Nature validée en lot"); }
    const P = inboxCheck(it); if (P.length) { ko.push((pzTiersNom ? pzTiersNom(it) : it.piece) + " : " + P[0]); return; } if (inboxPost(it, true)) n++; });
  toast(n + " pièce(s) comptabilisée(s)" + (ko.length ? " · " + ko.length + " non passée(s) (" + ko[0] + (ko.length > 1 ? "…" : "") + ")" : " ✓")); return { n, ko }; }
Object.assign(ACT, {
  sdValPostSel: () => { const f = UI.sub.sdm; confirmBox("Valider et comptabiliser", `${f.sel.length} pièce(s) sélectionnée(s) : leur catégorie est validée telle qu'affichée, puis elles sont comptabilisées. Celles qui ont encore un contrôle bloquant (TVA, total, date, tiers…) restent à vérifier.`, "Valider et comptabiliser", () => { sdBatchPost(f.sel); f.sel = []; render(); }); },
  sdSelReady: () => { const f = UI.sub.sdm; f.sel = sdRows(f).filter(x => x.statut === "a_traiter" && !inboxCheck(x).filter(p => !/^Nature/.test(p)).length).map(x => x.id); render(); },
  pzCk: (el, ev) => { if (ev) { ev.stopPropagation(); } const S0 = UI.pzSel ||= []; const id = el.dataset.id; UI.pzSel = S0.includes(id) ? S0.filter(x => x !== id) : S0.concat(id); render(); },
  pzCkAll: () => { const L = pzQueue().filter(x => x.statut === "a_traiter").map(x => x.id); UI.pzSel = (UI.pzSel || []).length === L.length ? [] : L; render(); },
  pzCkNone: () => { UI.pzSel = []; render(); },
  pzCkPost: () => { const ids = (UI.pzSel || []).slice(); confirmBox("Valider et comptabiliser", `${ids.length} pièce(s) : la pré-saisie est validée telle qu'affichée puis comptabilisée. Les pièces avec un contrôle bloquant restent à traiter.`, "Valider et comptabiliser", () => { sdBatchPost(ids); UI.pzSel = []; render(); }); },
  sdMode: el => { PZ().tab = el.dataset.v; render(); }
});
(function () {
  const _m = sdMasse; sdMasse = function () { let h = _m.apply(this, arguments); const f = UI.sub.sdm || {};
    h = h.replace('<button class="btn sm pri" data-act="sdPostSel">Comptabiliser</button>', '<button class="btn sm pri" data-act="sdValPostSel" title="Valide la catégorie affichée puis comptabilise">✓ Valider et comptabiliser</button><button class="btn sm" data-act="sdPostSel">Comptabiliser les prêtes</button>');
    return h.replace('<button class="btn sm" data-act="sdManual"', '<button class="btn sm" data-act="sdSelReady" title="Sélectionne les pièces sans autre anomalie que la nature à confirmer">☑ Sélectionner les vérifiables</button><button class="btn sm" data-act="sdManual"'); };
  const _v = VIEWS.pieces; VIEWS.pieces = function () { let h = _v.apply(this, arguments); if (!S || !ensureX()) return h; const st = PZ(); const sel = new Set(UI.pzSel || []);
    let sp = ""; try { sp = curSpace(); } catch (e) { }
    if (sp !== "saisie") h = h.replace(/(<div class="fin-k pz-k">)/, `<div class="seg sd-modes">${[["pieces", "Pièces à traiter"], ["tx", "Paiements en attente de facture"], ["masse", "⚡ Saisie en masse"]].map(([k, l]) => `<button class="${(st.tab || "pieces") === k ? "on" : ""}" data-act="sdMode" data-v="${k}">${l}</button>`).join("")}</div>$1`);
    if (st.tab === "tx" || st.tab === "masse") return h;
    h = h.replace(/<a class="pz-qi ([^"]*)" data-act="pzPick" data-id="([^"]+)">/g, (m, c, id) => { const it = sdIt(id); const ok = it && it.statut === "a_traiter"; return m + (ok ? `<input type="checkbox" class="pz-ck" data-act="pzCk" data-id="${id}" ${sel.has(id) ? "checked" : ""} title="Sélectionner pour comptabiliser en lot">` : `<span class="pz-ck0"></span>`); });
    const bar = sel.size ? `<div class="pz-lot"><b>${sel.size} sélectionnée(s)</b><button class="btn sm pri" data-act="pzCkPost">✓ Valider et comptabiliser</button><button class="lnk small" data-act="pzCkNone">Annuler</button></div>` : `<div class="pz-lot0"><button class="lnk small" data-act="pzCkAll">☑ Tout sélectionner pour comptabiliser en lot</button></div>`;
    return h.replace('<div class="pz-ql">', bar + '<div class="pz-ql">'); };
  /* Comptabilité › Vue d'ensemble : la saisie y figure aussi */
  try { const T = SPACES.jrn.tabs; if (!T.some(t => t[0] === "pieces")) T.splice(2, 0, ["pieces", "Saisie des pièces", () => { if (!PZ().tab) PZ().tab = "pieces"; }, () => UI.view === "pieces"]); } catch (e) { }
  const _c = VIEWS.compta; if (typeof _c === "function") VIEWS.compta = function () { const h = _c.apply(this, arguments); if (!S || !ensureX()) return h; const A = XS.inbox.filter(x => /a_traiter|doublon/.test(x.statut)); const ready = A.filter(x => x.statut === "a_traiter" && !inboxCheck(x).length); const mt = A.reduce((a, x) => a + inboxTotals(x).ttc, 0); const done = XS.inbox.filter(x => x.statut === "comptabilisee" && (x.postedAt || "").slice(0, 7) === todayISO().slice(0, 7)).length;
    const card = `<section class="sd-sum"><div class="sd-sum-h"><b>✍ Saisie des pièces</b><span class="sp"></span><button class="btn sm" data-act="sdMode2" data-v="pieces">Pièces à traiter</button><button class="btn sm" data-act="sdMode2" data-v="masse">⚡ Saisie en masse</button></div><div class="sd-sum-k">${[["À traiter", A.length, A.length ? "ko" : "ok"], ["Prêtes à comptabiliser", ready.length, ""], ["Montant en attente", eur0(mt), ""], ["Comptabilisées ce mois", done, "ok"]].map(([l, v, c]) => `<div><span>${l}</span><b class="mono ${c}">${v}</b></div>`).join("")}</div></section>`;
    const i = h.indexOf('<div class="grid'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
  ACT.sdMode2 = el => { PZ().tab = el.dataset.v; UI.space = "jrn"; go("pieces"); };
  const st = document.createElement("style"); st.textContent = `.pz-ql .pz-qi{position:relative;padding-left:32px!important}.pz-ck{position:absolute;left:9px;top:50%;transform:translateY(-50%);margin:0;width:16px;height:16px;cursor:pointer;accent-color:#0F3D3E;z-index:1}.pz-ck0{display:none}
.pz-lot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#0F3D3E;color:#fff;border-radius:10px;padding:6px 10px;margin:6px 8px}.pz-lot .btn.pri{background:#F5B700;color:#0F1B33;border-color:#F5B700}.pz-lot .lnk{color:#fff}.pz-lot0{padding:4px 12px}
.sd-modes{margin:4px 0 10px}.sd-sum{border:1px solid var(--rule,#D2D9E6);border-radius:14px;background:#fff;padding:12px 14px;margin:0 0 14px}.sd-sum-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}.sd-sum-h .sp{flex:1}.sd-sum-k{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.sd-sum-k div{background:#F7F9FC;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:2px}.sd-sum-k span{font-size:12px;color:#6B7690}.sd-sum-k b{font-size:18px}.sd-sum-k .ko{color:#C77700}.sd-sum-k .ok{color:#1F8A55}@media (max-width:800px){.sd-sum-k{grid-template-columns:1fr 1fr}}`; document.head.appendChild(st);
})();

/* « déclare avoir reçu » n'est pas un avoir : seul un vrai avoir (titre, n° d'avoir, note de crédit) inverse l'écriture */
function sdIsAvoir(text, ttc) { const h = String(text || "").split(/\n/).slice(0, 8).join("\n"); return (ttc || 0) < 0 || /^\s*(facture d.?)?avoir\b|avoir\s*(n[°o]|num)|note de cr[ée]dit|credit note|facture rectificative/im.test(h); }
(function () { const _p = parseInvoiceText; parseInvoiceText = function (text) { const inv = _p.apply(this, arguments); try { if (inv.type === "AV" && !sdIsAvoir(text, inv.ttc)) inv.type = "FA"; } catch (e) { } return inv; };
  if (typeof pzAutoFill === "function") { const _af = pzAutoFill; pzAutoFill = function (it) { const r = _af.apply(this, arguments); try { if (it && it.inv && it.inv.type === "AV" && it.text && !sdIsAvoir(it.text, it.inv.ttc)) { it.inv.type = "FA"; it.auto = (it.auto || []).filter(x => !/^Avoir détecté/.test(x)); try { it.lib = pzAutoLib(it); } catch (e) { } xSave("inbox", it); } } catch (e) { } return r; }; } })();
