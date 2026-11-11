/* ============================================================
   Affectation automatique du compte selon la nature de la facture.
   Saisie en grille (journaux d'achats et de ventes) : dès que le tiers est saisi, le compte de
   charge ou de produit est détecté dans cet ordre :
     1. compte par défaut propre au fournisseur ou au client ;
     2. compte utilisé sur ses dernières factures (apprentissage) ;
     3. nature détectée dans le libellé, la pièce et le nom du tiers (énergie, télécom, loyer,
        honoraires, assurance, transport, logiciels…), y compris les règles personnalisées ;
     4. profil DAS2 du fournisseur (honoraires, commissions) ;
     5. compte par défaut du dossier.
   Le taux de TVA suit la nature (assurances, frais bancaires, timbres : sans TVA).
   Factures de vente : le compte de chaque ligne suit la désignation.
   ============================================================ */
const AC_MORE = [[/\bcadeaux?\b|coffrets?/i, "623400"], [/messagerie|fret|transporteur|livraison|\bgeodis\b|schenker|\btnt\b|kuehne/i, "624100"], [/s[ée]minaire|colloque|formation|conf[ée]rence/i, "618500"], [/documentation|presse|journal|magazine|revue/i, "618100"], [/int[ée]rim|travail temporaire|adecco|manpower|randstad/i, "621100"], [/cr[ée]dit[- ]bail/i, "612200"], [/emballages?|cartons?/i, "602600"], [/mati[èe]res? premi[èe]res?/i, "601000"], [/marchandises?|grossiste|r[ée]assort/i, "607000"], [/timbres? fiscaux|amende|p[ée]nalit[ée]/i, "671200"], [/commissions? sur ventes|apporteur d'affaires|courtage/i, "622200"]];
const AC_VEN = [[/location|loyer/i, "708300"], [/transport|livraison|port factur[ée]|frais de port/i, "708500"], [/commission|courtage/i, "708200"], [/marchandise|n[ée]goce|revente/i, "707000"], [/produits? finis?|fabrication|production vendue/i, "701000"], [/prestation|service|honoraires|conseil|mission|main[- ]d'?œ?oeuvre|maintenance|installation|pose|intervention|formation|abonnement|forfait/i, "706000"]];
const AC_NOTVA = /^(616|627|6354|6713|6712|625[16]|6411|65[18])/;
const AC_LIB = { "606100": "Énergie, eau, carburant", "626000": "Télécom et frais postaux", "613200": "Loyer", "613500": "Location", "616000": "Assurance", "622600": "Honoraires", "625700": "Réceptions et repas", "625100": "Déplacements", "606400": "Fournitures de bureau", "627000": "Frais bancaires", "651000": "Logiciels et licences", "623000": "Publicité", "611000": "Sous-traitance", "615000": "Entretien et réparations", "628100": "Cotisations", "606300": "Petit équipement", "623400": "Cadeaux", "624100": "Transport sur achats", "618500": "Séminaires et formations", "618100": "Documentation", "621100": "Intérim", "612200": "Crédit-bail", "602600": "Emballages", "601000": "Matières premières", "607000": "Marchandises", "671200": "Pénalités et amendes", "622200": "Commissions et courtages" };
(function () { try { AC_MORE.forEach(r => { if (!KW_CPT.some(k => k[1] === r[1] && String(k[0]) === String(r[0]))) KW_CPT.push(r); }); } catch (e) { } })();
function acDetect(t, vente, hay) { const gen = new Set(["607000", "601000", "604000", "706000", "707000", ""]);
  if (t && t.defaut && !gen.has(t.defaut)) return { c: t.defaut, why: "compte par défaut du " + (vente ? "client" : "fournisseur") };
  if (t && typeof learnedAccount === "function") { const l = learnedAccount(t.code, vente ? "V" : "A"); if (l && !gen.has(l)) return { c: l, why: "compte utilisé sur ses dernières factures" }; }
  const h = [t && t.nom, hay, t && t.prof].filter(Boolean).join(" ");
  if (vente) { for (const [re, c] of AC_VEN) if (re.test(h)) return { c, why: "nature détectée dans le libellé" }; return { c: (t && t.defaut) || (typeof MC === "function" && MC("factu", "compteDefaut")) || "706000", why: "" }; }
  if (t && t.das2) { const m = { honoraires: "622600", commissions: "622200", droits: "651600", autres: "622800" }[t.das2Nat || "honoraires"]; if (m) return { c: m, why: "prestataire DAS2" }; }
  const r = typeof ruleAccount === "function" ? ruleAccount(h) : null; if (r && r.compte) return { c: r.compte, why: "nature détectée : " + (AC_LIB[r.compte] || accLib(r.compte) || r.compte).toLowerCase() };
  if (t && t.defaut) return { c: t.defaut, why: "" }; const learned = t && typeof learnedAccount === "function" ? learnedAccount(t.code, "A") : ""; if (learned) return { c: learned, why: "compte utilisé sur ses dernières factures" };
  return { c: (typeof inboxCfg === "function" && inboxCfg().compteDefaut) || "607000", why: "" }; }
/* saisie en grille : le tiers déclenche la ventilation avec le compte détecté */
(function () { const _a = autoSaisie; autoSaisie = function (e, l) { const j = journalBy(e.journal); const t = l && l.aux ? tiersBy(l.aux) : null; if (!j || !t || (j.type !== "ACH" && j.type !== "VEN")) return _a.apply(this, arguments);
  const vente = j.type === "VEN"; const hay = [e.libelle, l.lib, e.piece].filter(Boolean).join(" "); const D = acDetect(t, vente, hay); const keep = { defaut: t.defaut, taux: t.taux, had: "taux" in t };
  t.defaut = D.c; if (!vente && AC_NOTVA.test(D.c) && (t.taux == null || keep.taux === 2000)) t.taux = 0;
  let r; try { r = _a.apply(this, arguments); } finally { t.defaut = keep.defaut; if (keep.had) t.taux = keep.taux; else delete t.taux; }
  if (r) { e.autoCpt = { c: D.c, why: D.why }; if (D.why) setTimeout(() => { try { toast("Compte " + D.c + " · " + (accLib(D.c) || "") + " affecté automatiquement (" + D.why + ")."); } catch (x) { } }, 60); }
  return r; }; })();
/* factures de vente : compte de la ligne selon la désignation */
(function () { const _v = typeof VCHG !== "undefined" && VCHG.vl; if (!_v) return; const wrap = function (el) { const r = _v.apply(this, arguments); try { if (el.dataset.f !== "des") return r; const d = venteById(UI.facId); if (!d || d.statut !== "brouillon") return r; const l = d.lignes[+el.dataset.i]; if (!l || l.texte || l.compteManuel) return r; const t = tiersBy(d.client); const D = acDetect(t && t.defaut && !/^70[67]0{3}$/.test(t.defaut) ? t : null, true, l.des || ""); if (D.c && D.c !== l.compte) { l.compte = D.c; xSave("ventes", d); render(); } } catch (x) { } return r; };
  VCHG.vl = wrap; })();
/* un compte saisi à la main sur une ligne de vente n'est plus modifié automatiquement */
document.addEventListener("change", ev => { const el = ev.target; if (!el || !el.dataset || el.dataset.ch !== "vl" || el.dataset.f !== "compte") return; try { const d = venteById(UI.facId); const l = d && d.lignes[+el.dataset.i]; if (l) l.compteManuel = true; } catch (x) { } }, true);
