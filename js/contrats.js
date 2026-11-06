/* ============================================================
   Espace éditeur : « Contrats et CGV » — modèles modifiables par type de client
   (contrat d'abonnement / CGV-CGU, RGPD, mentions légales, lettre de mission), génération par client
   ============================================================ */
const CT_TYPES = { societe: "Société commerciale (SARL, SAS, SA…)", ei: "Entrepreneur individuel / micro-entreprise", asso: "Association", sci: "SCI / société civile", cabinet: "Cabinet d'expertise comptable" };
const ctTypeOf = forme => { const f = String(forme || ""); if (/SCI|SCCV|civile|SCM|SCP/i.test(f)) return "sci"; if (/asso/i.test(f)) return "asso"; if (/\bEI\b|micro|EIRL|entrepreneur/i.test(f)) return "ei"; if (/expert|cabinet/i.test(f)) return "cabinet"; return "societe"; };
const CT_PARTIE = {
  societe: "{{client}}, {{client_forme}} au capital de {{client_capital}} euros, immatriculée sous le numéro SIREN {{client_siren}}, dont le siège est situé {{client_adresse}}, représentée par {{representant}} en qualité de {{qualite}}, dûment habilité(e),",
  ei: "{{client}}, entrepreneur individuel, immatriculé(e) sous le numéro SIREN {{client_siren}}, domicilié(e) professionnellement {{client_adresse}},",
  asso: "{{client}}, association régie par la loi du 1er juillet 1901, identifiée sous le numéro RNA / SIREN {{client_siren}}, dont le siège est situé {{client_adresse}}, représentée par {{representant}} en qualité de {{qualite}}, dûment habilité(e) par une décision de ses organes statutaires,",
  sci: "{{client}}, société civile immobilière au capital de {{client_capital}} euros, immatriculée sous le numéro SIREN {{client_siren}}, dont le siège est situé {{client_adresse}}, représentée par son gérant {{representant}},",
  cabinet: "{{client}}, société d'expertise comptable inscrite au tableau de l'Ordre des experts-comptables, immatriculée sous le numéro SIREN {{client_siren}}, dont le siège est situé {{client_adresse}}, représentée par {{representant}} en qualité de {{qualite}},"
};
const CT_SPEC = {
  societe: "Le Client agit pour les besoins de son activité professionnelle. Il ne bénéficie pas du droit de rétractation prévu par le Code de la consommation.",
  ei: "Le Client agit pour les besoins de son activité professionnelle. Lorsque le contrat est conclu hors établissement, que son objet n'entre pas dans le champ de l'activité principale du Client et que celui-ci emploie au plus cinq salariés, le Client bénéficie d'un délai de rétractation de quatorze (14) jours (article L221-3 du Code de la consommation). Le patrimoine professionnel de l'entrepreneur individuel est seul engagé au titre du présent contrat.",
  asso: "L'Association utilise le Logiciel pour la tenue de sa comptabilité associative (plan comptable des associations, règlement ANC n° 2018-06). Lorsque l'Association n'exerce aucune activité économique, le contrat peut être résilié à tout moment avec un préavis d'un (1) mois, sans pénalité. Les prix sont exprimés TTC lorsque l'Association n'est pas assujettie à la TVA.",
  sci: "La société civile utilise le Logiciel pour la gestion comptable de son patrimoine immobilier (loyers, quittances, charges, emprunts, déclaration 2072 ou liasse IS). Les quittances et avis d'échéance générés par le Logiciel sont établis sous la seule responsabilité du bailleur.",
  cabinet: "Le Client est autorisé à utiliser le Logiciel pour la tenue des dossiers de ses propres clients, dans la limite du nombre de dossiers prévu par son Offre. Il demeure seul responsable de ses missions envers ses clients, conformément aux règles de sa profession (Ordre des experts-comptables), et du respect du secret professionnel. L'Éditeur n'a aucune relation contractuelle avec les clients du Cabinet ; il agit en qualité de sous-traitant du Cabinet au sens du RGPD."
};
/* Balises des modèles : « # » titre du document · « ## » article · « ### » sous-titre · « - » liste
   « > » encadré · « | a | b | » tableau · « --- » séparateur · [[SIGNATURES]] bloc de signatures · {{#si x}}…{{/si}} condition */
function ctCGV(type) { return `# Conditions générales de vente et d'utilisation
### Contrat d'abonnement au logiciel {{logiciel}} · ${CT_TYPES[type]}

> Le présent contrat se compose des Conditions particulières ci-dessous, des présentes Conditions générales et de leurs annexes (accord de traitement des données). En cas de contradiction, les Conditions particulières prévalent.

## Conditions particulières
| Éditeur | {{editeur}} · SIREN {{editeur_siren}} |
| Client | {{client}} · SIREN {{client_siren}} |
| Représentant du Client | {{representant}}, {{qualite}} |
| Offre souscrite | {{offre}} |
| Prix | {{prix}} HT {{periode}} |
| Sociétés (dossiers) incluses | {{nb_societes}} |
| Date d'effet | {{date_debut}} |
{{#si date_fin}}| Fin de la période en cours | {{date_fin}} |
{{/si}}{{#si essai}}| Période d'essai | {{essai}} jours, sans engagement |
{{/si}}| Support | {{editeur_email}}{{#si editeur_tel}} · {{editeur_tel}}{{/si}} |

## Les parties
{{editeur}}, {{editeur_forme}}{{#si editeur_capital}} au capital de {{editeur_capital}} euros{{/si}}, immatriculée sous le numéro SIREN {{editeur_siren}}, dont le siège est situé {{editeur_adresse}}, éditeur du logiciel {{logiciel}}, ci-après « l'Éditeur » ;

et ${CT_PARTIE[type]} ci-après « le Client ».

## Article 1 - Définitions
- « Logiciel » : la solution de comptabilité en ligne {{logiciel}}, ses mises à jour et sa documentation.
- « Service » : l'accès au Logiciel en mode SaaS, l'hébergement des données, la maintenance et l'assistance.
- « Données du Client » : l'ensemble des informations saisies, importées ou générées par le Client dans le Logiciel.
- « Offre » : la formule d'abonnement choisie par le Client, décrite dans les Conditions particulières.

## Article 2 - Objet
Le contrat a pour objet de définir les conditions dans lesquelles l'Éditeur fournit le Service au Client. Il prévaut sur tout autre document du Client, notamment ses conditions générales d'achat.

## Article 3 - Souscription et accès
Le contrat est formé lors de l'activation du code d'accès remis par l'Éditeur, du paiement de l'Offre ou de la signature du présent document. Les identifiants sont personnels et confidentiels ; le Client répond de toute utilisation de son compte et informe sans délai l'Éditeur de toute utilisation non autorisée.

## Article 4 - Description du Service et niveaux de service
- Disponibilité cible du Service : 99,5 % par mois, hors maintenance programmée annoncée au moins 48 heures à l'avance.
- Sauvegarde des Données du Client au moins une fois par jour, avec conservation des sauvegardes pendant 30 jours.
- Mises à jour légales et fiscales (formulaires, taux, plan comptable) incluses dans l'abonnement.
- Assistance par e-mail les jours ouvrés, avec un premier retour sous 2 jours ouvrés.
> L'Éditeur est tenu d'une obligation de moyens. Il met en œuvre les meilleurs standards du marché pour assurer la continuité et la sécurité du Service.

## Article 5 - Prix, facturation et paiement
Les prix sont ceux des Conditions particulières, payables d'avance par carte bancaire ou par virement. Ils peuvent être révisés à chaque renouvellement, sous réserve d'en informer le Client au moins un mois à l'avance ; le Client peut alors résilier sans frais avant l'échéance.
Tout retard de paiement entraîne de plein droit des pénalités au taux de trois fois le taux d'intérêt légal, une indemnité forfaitaire pour frais de recouvrement de 40 euros (article L441-10 du Code de commerce) et, huit jours après une mise en demeure restée sans effet, la suspension de l'accès.

## Article 6 - Durée, renouvellement et résiliation
Le contrat est conclu pour la durée de l'Offre et se renouvelle tacitement par périodes identiques. Chaque partie peut y mettre fin au moins quinze jours avant l'échéance, par e-mail. En cas de manquement grave non réparé dans les quinze jours d'une mise en demeure, l'autre partie peut résilier le contrat de plein droit.

## Article 7 - Dispositions propres au Client
${CT_SPEC[type]}

## Article 8 - Engagements de l'Éditeur
L'Éditeur fournit un Logiciel conforme à sa documentation, en assure la maintenance corrective et évolutive, informe le Client des évolutions importantes et met à sa disposition une assistance dans les conditions de l'article 4.

## Article 9 - Engagements du Client
Le Client utilise le Service conformément à sa destination. Il reste seul responsable de l'exactitude des Données qu'il saisit, de ses déclarations fiscales et sociales, du respect de ses obligations comptables et de la conservation de ses pièces justificatives.

## Article 10 - Intelligence artificielle et outils d'assistance
Le Logiciel propose des contrôles automatiques, des cadrages et une analyse assistée par intelligence artificielle. Ces fonctions sont des aides à la décision : leurs résultats doivent être vérifiés par le Client et ne se substituent pas à l'intervention d'un professionnel de l'expertise comptable. Les Données du Client ne sont pas utilisées pour entraîner des modèles d'intelligence artificielle.

## Article 11 - Données, sécurité et réversibilité
Le Client reste propriétaire de ses Données. Il peut les exporter à tout moment, notamment au format du fichier des écritures comptables (FEC) et dans des formats ouverts (CSV, Excel, PDF).
À la fin du contrat, les Données restent accessibles en lecture et en export pendant trente jours, puis sont supprimées définitivement, sauf obligation légale de conservation.
> Les échanges sont chiffrés, l'accès aux données est réservé aux personnes autorisées et chaque compte est protégé par une authentification personnelle.

## Article 12 - Accès de l'Éditeur pour assistance
Pour les besoins de l'assistance, de la correction d'anomalies et de la maintenance, le Client autorise l'Éditeur à accéder à sa comptabilité et, à sa demande, à y effectuer des corrections. Ces accès sont limités à ce but et couverts par l'obligation de confidentialité de l'article 14.

## Article 13 - Données personnelles
Chaque partie respecte le Règlement (UE) 2016/679 (RGPD) et la loi Informatique et Libertés. Pour les données personnelles contenues dans la comptabilité, l'Éditeur agit en qualité de sous-traitant au sens de l'article 28 du RGPD, selon l'accord de traitement des données annexé au contrat.

## Article 14 - Confidentialité
Chaque partie s'engage à garder confidentielles les informations de l'autre partie dont elle a connaissance à l'occasion du contrat, pendant toute sa durée et cinq ans après son terme.

## Article 15 - Propriété intellectuelle
L'Éditeur est et reste titulaire de tous les droits sur le Logiciel. Le Client bénéficie, pour la durée du contrat, d'un droit d'utilisation personnel, non exclusif et non cessible, limité à ses besoins propres{{#si cabinet}} et à ceux des clients de son cabinet{{/si}}.

## Article 16 - Responsabilité
La responsabilité de l'Éditeur ne peut être engagée qu'en cas de faute prouvée. Elle est limitée, tous préjudices confondus, aux sommes payées par le Client au cours des douze mois précédant le fait générateur. L'Éditeur ne répond pas des dommages indirects (perte de chiffre d'affaires, pénalités fiscales, perte de chance) ni des conséquences d'une erreur de saisie ou d'une utilisation non conforme.

## Article 17 - Force majeure
Aucune partie n'est responsable d'un manquement résultant d'un cas de force majeure au sens de l'article 1218 du Code civil. Si l'empêchement dure plus de trente jours, chaque partie peut résilier le contrat sans indemnité.

## Article 18 - Évolution des conditions générales
L'Éditeur peut faire évoluer les présentes conditions. Les nouvelles conditions sont notifiées au Client et s'appliquent au renouvellement suivant ; le Client qui les refuse peut résilier sans frais avant cette date.

## Article 19 - Preuve et signature électronique
Les parties reconnaissent la valeur probante des e-mails, des journaux de connexion et de l'acceptation en ligne des présentes conditions. Le contrat peut être signé électroniquement (article 1367 du Code civil).

## Article 20 - Droit applicable et litiges
Le contrat est soumis au droit français. Les parties recherchent une solution amiable avant toute action{{#si asso}} et l'Association peut recourir gratuitement à un médiateur de la consommation lorsqu'elle agit à des fins non professionnelles{{/si}}. À défaut d'accord, compétence est attribuée au tribunal {{tribunal}}.

---
Fait à {{ville}}, le {{date}}, en deux exemplaires.

[[SIGNATURES|{{editeur}}|{{client}} · {{representant}}]]`; }
const CT_DEFAUT = () => { const o = {}; Object.keys(CT_TYPES).forEach(t => o["cgv_" + t] = { titre: "CGV / contrat d'abonnement · " + CT_TYPES[t], cat: "cgv", type: t, texte: ctCGV(t) });
  o.dpa = { titre: "Accord de traitement des données (RGPD · art. 28)", cat: "annexe", type: "", texte: `# Accord de traitement des données personnelles
### Annexe au contrat d'abonnement {{logiciel}} · article 28 du RGPD

| Responsable de traitement | {{client}} |
| Sous-traitant | {{editeur}} |
| Contact protection des données | {{editeur_email}} |
| Date d'effet | {{date_debut}} |

## Article 1 - Objet
Le présent accord définit les conditions dans lesquelles le Sous-traitant traite, pour le compte du Responsable de traitement, les données personnelles contenues dans la comptabilité, aux seules fins de fournir le Logiciel, son hébergement, son assistance et sa maintenance.

## Article 2 - Description du traitement
| Nature des opérations | Hébergement, sauvegarde, consultation pour assistance, export |
| Catégories de personnes | Clients, fournisseurs, salariés, dirigeants et associés |
| Catégories de données | Identité, coordonnées, facturation, références bancaires, paie le cas échéant |
| Durée | Durée du contrat, puis 30 jours de réversibilité |

## Article 3 - Obligations du Sous-traitant
- traiter les données uniquement sur instruction documentée du Responsable de traitement ;
- garantir la confidentialité des données et sensibiliser les personnes autorisées à les traiter ;
- mettre en œuvre des mesures de sécurité appropriées : chiffrement des échanges, contrôle des accès, sauvegardes quotidiennes ;
- ne faire appel à un sous-traitant ultérieur (hébergement) qu'après information préalable du Responsable de traitement ;
- aider le Responsable de traitement à répondre aux demandes d'exercice des droits et à réaliser ses analyses d'impact ;
- notifier toute violation de données dans un délai maximal de 48 heures après en avoir pris connaissance ;
- restituer ou supprimer les données à la fin du contrat, au choix du Responsable de traitement.

## Article 4 - Obligations du Responsable de traitement
Le Responsable de traitement fournit au Sous-traitant les données nécessaires, documente ses instructions et veille au respect du RGPD à l'égard des personnes concernées.

## Article 5 - Audit
Le Sous-traitant met à disposition les informations nécessaires pour démontrer le respect de ses obligations et permet la réalisation d'audits, moyennant un préavis raisonnable.

---
Fait à {{ville}}, le {{date}}.

[[SIGNATURES|{{editeur}} (sous-traitant)|{{client}} (responsable de traitement)]]` };
  o.mentions = { titre: "Mentions légales du site", cat: "site", type: "", texte: `# Mentions légales
### Site et logiciel {{logiciel}}

## Éditeur
| Raison sociale | {{editeur}} |
| Forme juridique | {{editeur_forme}} |
| SIREN | {{editeur_siren}} |
| Siège | {{editeur_adresse}} |
| Contact | {{editeur_email}}{{#si editeur_tel}} · {{editeur_tel}}{{/si}} |
| Directeur de la publication | {{representant_editeur}} |

## Hébergement
Le site et le logiciel {{logiciel}} sont hébergés par leur prestataire d'hébergement, dont les coordonnées sont communiquées sur simple demande.

## Propriété intellectuelle
L'ensemble des contenus du site (textes, marques, logos, interfaces, logiciel) est la propriété exclusive de {{editeur}}. Toute reproduction ou représentation sans autorisation écrite est interdite.

## Données personnelles et cookies
Les données collectées servent uniquement à la gestion des demandes et des abonnements. Vous disposez de droits d'accès, de rectification, d'effacement et d'opposition auprès de {{editeur_email}}, et pouvez saisir la CNIL (www.cnil.fr). Le site n'utilise que des cookies strictement nécessaires à son fonctionnement.` };
  o.confid = { titre: "Politique de confidentialité", cat: "site", type: "", texte: `# Politique de confidentialité
### {{logiciel}} · mise à jour le {{date}}

> Vos données comptables vous appartiennent. Nous ne les vendons pas, ne les utilisons pas à des fins publicitaires et ne les utilisons pas pour entraîner des modèles d'intelligence artificielle.

## Responsable de traitement
{{editeur}}, {{editeur_adresse}} · {{editeur_email}}.

## Données traitées
| Données de compte | Nom, e-mail · création et gestion de l'accès · durée du contrat + 3 ans |
| Données de facturation | Offre, paiements · gestion de l'abonnement · 10 ans (obligation légale) |
| Données comptables | Traitées en qualité de sous-traitant · fourniture du service · durée du contrat + 30 jours |

## Sécurité
Échanges chiffrés, accès restreints aux personnes habilitées, sauvegardes quotidiennes et journalisation des accès.

## Vos droits
Accès, rectification, effacement, limitation, portabilité et opposition : {{editeur_email}}. Vous pouvez introduire une réclamation auprès de la CNIL.` };
  o.lm = { titre: "Lettre de mission (si vous êtes expert-comptable)", cat: "lm", type: "", texte: `# Lettre de mission
### Mission de présentation des comptes annuels · {{client}}

À l'attention de {{representant}}, {{qualite}}

Madame, Monsieur,
Nous vous remercions de la confiance que vous nous témoignez. La présente lettre, établie conformément aux normes professionnelles de l'Ordre des experts-comptables, a pour objet de confirmer les termes et les objectifs de notre intervention.

## 1. Votre entité
| Dénomination | {{client}} |
| Forme juridique | {{client_forme}} |
| SIREN | {{client_siren}} |
| Siège | {{client_adresse}} |

## 2. Nature et étendue de la mission
Nous effectuerons une mission de présentation des comptes annuels. Cette mission n'est ni un audit ni un examen limité ; elle a pour objectif d'exprimer une opinion sur la cohérence et la vraisemblance des comptes.

## 3. Répartition des travaux
| Tenue de la comptabilité via {{logiciel}} | Cabinet, à partir des pièces transmises |
| Transmission des pièces et relevés | Client, chaque mois |
| Déclarations de TVA | Cabinet |
| Comptes annuels et liasse fiscale | Cabinet |
| Autres travaux | {{missions}} |

## 4. Honoraires
| Honoraires annuels | {{prix}} HT |
| Modalités | {{periode}}, par prélèvement ou virement |
Les travaux non prévus par la présente lettre feront l'objet d'un accord préalable.

## 5. Lutte contre le blanchiment
Conformément aux articles L561-1 et suivants du Code monétaire et financier, nous procédons à l'identification de votre entité, de ses représentants et de ses bénéficiaires effectifs, et vous nous informez de toute modification.

## 6. Durée
La mission prend effet à la date de signature, pour l'exercice en cours. Elle se renouvelle tacitement chaque année, sauf dénonciation trois mois avant la date de clôture.

> Les conditions générales d'intervention ci-annexées font partie intégrante de la présente lettre de mission.

---
Fait à {{ville}}, le {{date}}.

[[SIGNATURES|{{editeur}} · l'expert-comptable|{{client}} · bon pour accord]]` };
  return o; };

function ctModeles() { const C = ((isAdmin() && UI.cfg && UI.cfg.contrats) || CONFIG.contrats || {}); const D = CT_DEFAUT(); const out = {}; for (const id in D) if (!(C.supprimes || []).includes(id)) out[id] = Object.assign({ id, origine: "defaut" }, D[id]); for (const id in (C.modeles || {})) out[id] = Object.assign({ id }, D[id] || {}, C.modeles[id], { origine: D[id] ? "modifie" : "ajoute" }); return out; }
async function ctPublish(mut, note) { const C = deep(CONFIG.contrats || { modeles: {}, supprimes: [] }); C.modeles ||= {}; C.supprimes ||= []; mut(C); CONFIG.contrats = C; if (UI.cfg) UI.cfg.contrats = deep(C); await ADM.save(note || "Contrats et CGV"); }
function ctVars(l, x) { const V = venteCfg(); const d = Object.assign({}, (l && l.ct) || {}, x || {}); const o = (V.offres || []).find(z => z.id === ((l && l.offre) || d.offre)) || {}; const t = d.type || "societe";
  const r = { logiciel: (CONFIG.branding && CONFIG.branding.nom) || "SpeedCompta", editeur: ctEditeur(), editeur_forme: V.forme || "", editeur_capital: V.capital || "", editeur_siren: (V.siret || "").replace(/\s/g, "").slice(0, 9), editeur_adresse: V.adresse || "", editeur_email: V.email || "", editeur_tel: V.tel || "", representant_editeur: V.rep || "", site: (V.site && (V.site.lien || V.site.domaine)) || "", ville: d.ville || V.ville || "", tribunal: V.tribunal || "de commerce du siège de l'Éditeur", date: frDate(todayISO()),
    client: (l && l.client) || d.client || "", client_forme: d.forme || "", client_capital: d.capital || "", client_siren: d.siren || "", client_adresse: d.adresse || "", representant: d.rep || "", qualite: d.qualite || (t === "sci" ? "gérant" : t === "asso" ? "président" : "représentant légal"),
    offre: o.nom || (l && l.offre) || d.offre || "", prix: o.prix ? eur(o.prix) + " €" : "", periode: o.periode ? perLib(o.periode) : "", nb_societes: (l && l.maxSoc) || o.maxSoc ? String((l && l.maxSoc) || o.maxSoc) : "illimité", date_debut: l && l.cree ? frDate(l.cree) : frDate(todayISO()), date_fin: l && l.expire ? frDate(l.expire) : "", essai: l && l.essai ? String(V.essai || 14) : "", missions: d.missions || "établissement des déclarations fiscales annuelles", cabinet: t === "cabinet" ? "1" : "", asso: t === "asso" ? "1" : "" }; for (const k in r) if (r[k] === "" && !["essai", "date_fin", "cabinet", "asso", "editeur_tel", "editeur_capital"].includes(k)) delete r[k]; return r; }
VIEWS.contrats = () => { if (!isAdmin()) return `<div class="card empty">Réservé à l'éditeur du logiciel.</div>`;
  const M = ctModeles(); const st = UI.sub.ct ||= { id: "cgv_societe", mode: "edit", lic: "" }; if (!M[st.id]) st.id = Object.keys(M)[0]; const m = M[st.id]; const L = licList();
  const groups = [["cgv", "📜 CGV / contrat d'abonnement par type de client"], ["annexe", "🔐 Annexes"], ["site", "🌐 Site internet"], ["lm", "✍️ Lettre de mission"], ["", "Autres modèles"]];
  const list = groups.map(([g, lab]) => { const it = Object.values(M).filter(x => (x.cat || "") === g); return it.length ? `<div class="ct-g">${lab}</div>${it.map(x => `<button class="ct-it ${x.id === st.id ? "on" : ""}" data-act="ctPick" data-id="${x.id}"><span>${esc(x.titre)}</span>${x.origine !== "defaut" ? `<span class="pill ${x.origine === "ajoute" ? "act" : "warn"}">${x.origine === "ajoute" ? "ajouté" : "modifié"}</span>` : ""}</button>`).join("")}` : ""; }).join("");
  const dr = (UI.ctDraft || {})[m.id]; const txt = dr != null ? dr : m.texte; const l = L.find(x => x.id === st.lic); const x = st.x || {};
  const vars = ctVars(l, x); const out = jurRender(txt, vars); const miss = [...new Set((out.match(/\[([\w.]+)\]/g) || []))];
  return `<div class="topbar"><div><div class="eyebrow">Espace éditeur</div><h1>Contrats et CGV</h1><p class="lead">Vos modèles de contrat d'abonnement (CGV / CGU) par type de client, l'accord RGPD, les mentions légales et la lettre de mission. Modifiez-les, puis générez le contrat d'un client en PDF ou Word.</p></div><div class="row"><button class="btn" data-act="ctNew">＋ Nouveau modèle</button></div></div>
  ${ctEdPanel()}<div class="ct-grid"><aside class="panel ct-side">${list}</aside><div class="stack">
  <div class="panel"><div class="panel-h"><div><h2 style="margin:0">${esc(m.titre)}</h2><div class="small muted">${m.type ? "Pour : " + esc(CT_TYPES[m.type]) + " · " : ""}${m.origine === "defaut" ? "modèle d'origine" : m.origine === "modifie" ? "modèle modifié par vous" : "modèle ajouté"}${CONFIG.contrats && CONFIG.contrats.majLe ? "" : ""}</div></div><div class="seg"><button class="${st.mode === "edit" ? "on" : ""}" data-act="ctMode" data-v="edit">✎ Modifier le modèle</button><button class="${st.mode === "gen" ? "on" : ""}" data-act="ctMode" data-v="gen">📄 Générer pour un client</button></div></div>
  ${st.mode === "edit" ? `<div class="panel-b"><div class="ct-vars small">Variables : ${["client", "client_forme", "client_siren", "client_adresse", "representant", "qualite", "offre", "prix", "periode", "nb_societes", "date_debut", "date_fin", "editeur", "editeur_siren", "editeur_adresse", "editeur_email", "logiciel", "ville", "date", "tribunal"].map(v => `<button class="ct-var" data-act="ctIns" data-v="{{${v}}}">{{${v}}}</button>`).join("")} <span class="muted">· « # » titre · « ## » article · « - » liste · « > » encadré · « | a | b | » tableau · « --- » séparateur · [[SIGNATURES]] · {{#si x}}…{{/si}}</span></div>
    <textarea class="in mono ct-ta" id="ctTa" data-ch="ctTxt" data-id="${m.id}" rows="26">${esc(txt)}</textarea>
    <div class="row" style="margin-top:10px">${dr != null ? `<span class="pill warn">modifications non publiées</span><button class="btn ghost sm" data-act="ctCancel">Annuler</button>` : ""}<button class="btn pri" data-act="ctSave" ${dr != null ? "" : "disabled"}>💾 Enregistrer et publier</button>${m.origine === "modifie" ? `<button class="btn ghost sm" data-act="ctReset">↺ Revenir au modèle d'origine</button>` : ""}${m.origine !== "defaut" || !CT_DEFAUT()[m.id] ? "" : ""}<button class="btn ghost sm danger" data-act="ctDel">Supprimer le modèle</button><span class="xs-sp"></span><button class="btn sm" data-act="ctDl" data-k="pdf">⇩ PDF (modèle)</button><button class="btn sm" data-act="ctDl" data-k="docx">⇩ Word</button></div>
    ${m.cat === "cgv" ? `<p class="small muted" style="margin-bottom:0">Les CGV publiées sont consultables par vos clients depuis leur page Abonnement (version correspondant à leur type de société).</p>` : ""}</div>`
  : `<div class="panel-b"><div class="grid g3"><label class="f">Client<select class="in" data-ch="ctLic"><option value="">— Saisie libre —</option>${L.length ? `<optgroup label="Accès clients (licences)">${L.map(z => `<option value="${z.id}" ${z.id === st.lic ? "selected" : ""}>${esc(z.client)} · ${esc(z.offre)}</option>`).join("")}</optgroup>` : ""}${ctSocOpts(st.soc)}</select></label>${[["client", "Nom du client (si non créé)"], ["forme", "Forme juridique"], ["siren", "SIREN / RNA"], ["capital", "Capital (€)"], ["adresse", "Adresse du siège"], ["rep", "Représentant"], ["qualite", "Qualité"], ["ville", "Fait à (ville)"]].map(([k, lab]) => `<label class="f">${lab}<input class="in" value="${esc(x[k] ?? (l && l.ct && l.ct[k]) ?? "")}" data-ch="ctX" data-k="${k}"></label>`).join("")}${l ? "" : `<label class="f">Offre<select class="in" data-ch="ctX" data-k="offre"><option value="">—</option>${(venteCfg().offres || []).map(o => `<option value="${o.id}" ${x.offre === o.id ? "selected" : ""}>${esc(o.nom)} · ${eur0(o.prix)}</option>`).join("")}</select></label>`}<label class="f">Type de client<select class="in" data-ch="ctX" data-k="type">${Object.entries(CT_TYPES).map(([k, v]) => `<option value="${k}" ${(x.type || (l && l.ct && l.ct.type) || ctTypeOf(x.forme)) === k ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
    ${miss.length ? `<div class="banner" style="margin:8px 0">À compléter : ${miss.map(esc).join(", ")}</div>` : `<div class="small" style="color:#0E6B3A;margin:6px 0">✓ Toutes les variables sont renseignées.</div>`}
    <div class="row"><button class="btn pri" data-act="ctGen" data-k="pdf">⇩ Contrat en PDF</button><button class="btn" data-act="ctGen" data-k="docx">⇩ Contrat en Word</button><button class="btn ghost" data-act="ctUseType">Choisir le modèle de son type</button>${l ? `<button class="btn ghost" data-act="ctSaveCli">Enregistrer ces informations sur le client</button>` : ""}</div>
    <div class="ct-pv">${ctHTML(out)}</div></div>`}</div></div></div>`; };
const CTACT = {
  ctPick: el => { UI.sub.ct.id = el.dataset.id; render(); }, ctMode: el => { UI.sub.ct.mode = el.dataset.v; render(); },
  ctIns: el => { const ta = $("#ctTa"); if (!ta) return; const s = ta.selectionStart || 0; ta.value = ta.value.slice(0, s) + el.dataset.v + ta.value.slice(ta.selectionEnd || s); (UI.ctDraft ||= {})[UI.sub.ct.id] = ta.value; render(); setTimeout(() => { const t = $("#ctTa"); if (t) { t.focus(); t.selectionStart = t.selectionEnd = s + el.dataset.v.length; } }, 20); },
  ctCancel: () => { if (UI.ctDraft) delete UI.ctDraft[UI.sub.ct.id]; render(); },
  ctSave: async () => { const id = UI.sub.ct.id; const m = ctModeles()[id]; const t = (UI.ctDraft || {})[id]; if (t == null) return; try { await ctPublish(C => { C.modeles[id] = { titre: m.titre, cat: m.cat, type: m.type, texte: t, le: new Date().toISOString() }; }, "Modèle : " + m.titre); delete UI.ctDraft[id]; toast("✓ Modèle enregistré et publié."); } catch (e) { toast("Publication impossible : " + (e.message || e)); } render(); },
  ctReset: () => { const id = UI.sub.ct.id; confirmBox("Revenir au modèle d'origine", "Vos modifications de ce modèle seront supprimées.", "Rétablir", async () => { await ctPublish(C => { delete C.modeles[id]; }, "Modèle rétabli"); render(); }); },
  ctDel: () => { const id = UI.sub.ct.id; const m = ctModeles()[id]; confirmBox("Supprimer « " + m.titre + " »", "Le modèle ne sera plus proposé.", "Supprimer", async () => { await ctPublish(C => { delete C.modeles[id]; if (CT_DEFAUT()[id]) C.supprimes.push(id); }, "Modèle supprimé"); UI.sub.ct.id = ""; render(); }, true); },
  ctNew: () => openModal({ type: "ctNew", d: { titre: "", cat: "cgv", type: "societe", base: "cgv_societe" } }),
  ctNewOk: async () => { const d = UI.modal.d; if (!d.titre.trim()) { toast("Donnez un titre."); return; } const id = "m" + uid(); const base = ctModeles()[d.base]; await ctPublish(C => { C.modeles[id] = { titre: d.titre.trim(), cat: d.cat, type: d.cat === "cgv" ? d.type : "", texte: base ? base.texte : "# " + d.titre.trim().toUpperCase() + "\n\n" }; }, "Nouveau modèle"); closeModal(); UI.sub.ct.id = id; UI.sub.ct.mode = "edit"; render(); },
  ctDl: el => { const m = ctModeles()[UI.sub.ct.id]; const t = (UI.ctDraft || {})[m.id] ?? m.texte; const n = m.titre.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_").slice(0, 60); deliverFile(n + "_modele." + el.dataset.k, el.dataset.k === "pdf" ? ctPDF(m.titre, t) : ctDOCX(m.titre, t), el.dataset.k, null, { cat: "Contrats", lib: m.titre }); },
  ctGen: el => { const st = UI.sub.ct; const m = ctModeles()[st.id]; const l = licList().find(x => x.id === st.lic); const txt = jurRender((UI.ctDraft || {})[m.id] ?? m.texte, ctVars(l, st.x)); const cli = (l && l.client) || (st.x || {}).client || "client"; const n = (m.cat === "cgv" ? "Contrat_" : m.titre.split(" ")[0] + "_") + cli.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_"); deliverFile(n + "." + el.dataset.k, el.dataset.k === "pdf" ? ctPDF(m.titre, txt, cli) : ctDOCX(m.titre, txt), el.dataset.k, null, { cat: "Contrats", lib: m.titre + " - " + cli }); },
  ctUseType: () => { const st = UI.sub.ct; const l = licList().find(x => x.id === st.lic); const t = (st.x || {}).type || (l && l.ct && l.ct.type) || ctTypeOf((st.x || {}).forme); if (ctModeles()["cgv_" + t]) { st.id = "cgv_" + t; toast("Modèle : " + CT_TYPES[t]); } render(); },
  ctSaveCli: async () => { const st = UI.sub.ct; const L = deep(licList()); const l = L.find(x => x.id === st.lic); if (!l) return; l.ct = Object.assign({}, l.ct || {}, st.x || {}); try { await licPublish(L, "Informations contrat : " + l.client); toast("Informations enregistrées sur le client."); } catch (e) { toast("Enregistrement impossible."); } render(); },
  ctCgvShow: async () => { const reg = await (typeof myReg === "function" ? myReg() : Promise.resolve({})); const t = ctTypeOf(S && S.forme); const M = ctModeles(); const m = M["cgv_" + t] || Object.values(M).find(x => x.cat === "cgv"); if (!m) { toast("Aucune condition générale publiée."); return; } const l = (licList() || []).find(x => x.uid === Store.uid || (reg.licence && reg.licence.id === x.id)); openModal({ type: "ctCgv", t: m.titre, txt: jurRender(m.texte, ctVars(l, { client: (l && l.client) || S.nom, forme: S.forme, siren: S.siren, adresse: S.adresse, type: t })), acc: reg.cgvLe }); },
  ctCgvOk: async () => { try { if (typeof saveMyReg === "function") await saveMyReg({ cgvLe: new Date().toISOString() }); } catch (e) { } closeModal(); toast("Merci : conditions générales acceptées."); },
  ctCgvDl: () => { const M = UI.modal; deliverFile("Conditions_generales.pdf", ctPDF(M.t, M.txt), "pdf", null, { cat: "Contrats", lib: M.t }); }
};
const CTCHG = {
  ctTxt: el => { (UI.ctDraft ||= {})[el.dataset.id] = el.value; render(); },
  ctLic: async el => { const v = el.value; const st = UI.sub.ct; if (v.startsWith("D:") || v.startsWith("U:")) { st.lic = ""; st.soc = v; st.x = await ctSocInfo(v); render(); return; } st.soc = ""; st.lic = v; const l = licList().find(x => x.id === v); st.x = Object.assign({}, (l && l.ct) || {}); render(); },
  ctX: el => { const x = UI.sub.ct.x ||= {}; x[el.dataset.k] = el.value; if (el.dataset.k === "forme" && !x.typeSet) x.type = ctTypeOf(el.value); if (el.dataset.k === "type") x.typeSet = true; render(); }
};
const _rmCt = renderModal;
renderModal = function () { const M = UI.modal; if (M && M.type === "ctNew") { const d = M.d; return modalFrame("Nouveau modèle de contrat", `${mIn("titre", "Titre", d.titre, "data-autofocus")}<div class="grid g2"><label class="f">Catégorie<select class="in" data-m="cat">${[["cgv", "CGV / contrat d'abonnement"], ["annexe", "Annexe"], ["site", "Site internet"], ["lm", "Lettre de mission"], ["", "Autre"]].map(([k, v]) => `<option value="${k}" ${d.cat === k ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="f">Type de client<select class="in" data-m="type">${Object.entries(CT_TYPES).map(([k, v]) => `<option value="${k}" ${d.type === k ? "selected" : ""}>${v}</option>`).join("")}</select></label></div><label class="f">Partir du modèle<select class="in" data-m="base"><option value="">Page blanche</option>${Object.values(ctModeles()).map(x => `<option value="${x.id}" ${d.base === x.id ? "selected" : ""}>${esc(x.titre)}</option>`).join("")}</select></label>`, `<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="ctNewOk">Créer</button>`); }
  if (M && M.type === "ctCgv") return modalFrame(M.t, `<div class="ct-pv" style="max-height:60vh;overflow:auto">${ctHTML(M.txt)}</div>${M.acc ? `<p class="small" style="color:#0E6B3A">✓ Acceptées le ${frDate(M.acc.slice(0, 10))}.</p>` : ""}`, `<button class="btn" data-act="ctCgvDl">⇩ PDF</button><button class="btn" data-act="closeModal">Fermer</button>${M.acc || isAdmin() ? "" : `<button class="btn pri" data-act="ctCgvOk">J'accepte les conditions générales</button>`}`, true);
  return _rmCt(); };
/* menu de l'espace éditeur */
(function () { const n = NAV2.find(x => x[0] === "vente"); if (!n) return; if (!n[2].includes("contrats")) n[2].push("contrats"); const d = Object.getOwnPropertyDescriptor(n, 3); const g = d && d.get; Object.defineProperty(n, 3, { get() { const s = g ? g() : d && d.value; if (!isAdmin() || !s) return s; const o = s.slice(); const i = o.findIndex(x => x[0] === "venteAdm"); o.splice(i < 0 ? o.length : i, 0, ["contrats", "Contrats et CGV"]); return o; }, enumerable: true, configurable: true }); })();
/* côté client : consulter / accepter les CGV depuis l'abonnement */
const _aboCt = VIEWS.abonnement;
VIEWS.abonnement = () => { const h = _aboCt(); if (isAdmin()) return h.replace('<div class="vt-btns">', '<div class="small" style="margin:0 0 6px"><a href="#" class="lnk" data-act="go" data-v="contrats">✎ Modifier les CGV</a></div><div class="vt-btns">'); return h + `<p class="small" style="margin-top:12px">📄 <a href="#" class="lnk" data-act="ctCgvShow">Conditions générales de vente et d'utilisation</a></p>`; };

/* ---------- identité de l'éditeur (vous) ---------- */
const CT_ED = [["societe", "Raison sociale de l'éditeur", "SpeedCompta SAS"], ["forme", "Forme juridique", "SAS"], ["capital", "Capital (€)", "1 000"], ["siret", "SIREN / SIRET", ""], ["adresse", "Adresse du siège", ""], ["rep", "Représentant légal", "Prénom Nom, Président"], ["email", "E-mail de contact", ""], ["tel", "Téléphone", ""], ["ville", "Ville (« Fait à »)", ""], ["tribunal", "Tribunal compétent", "de commerce de …"]];
function ctEdPanel() { const V = venteCfg(); const st = UI.sub.ct; const ok = V.societe && V.siret && V.adresse && V.email; const open = st.ed ?? !ok; const dr = UI.ctEd || {};
  return `<section class="panel ct-ed ${ok ? "" : "ct-ed-ko"}"><div class="panel-h"><div><h2 style="margin:0">🏢 Votre société d'éditeur : <span style="color:var(--pri,#2563EB)">${esc(ctEditeur())}</span></h2><div class="small muted">${ok ? "Apparaît comme « l'Éditeur » dans tous vos contrats, PDF et Word." : "À compléter : ces informations apparaissent comme « l'Éditeur » dans vos contrats (et non la société de comptabilité ouverte)."}</div></div><button class="btn sm" data-act="ctEdT">${open ? "Masquer" : "Modifier"}</button></div>
  ${open ? `<div class="panel-b"><div class="grid g3">${CT_ED.map(([k, l, ph]) => `<label class="f">${l}<input class="in" value="${esc(dr[k] ?? V[k] ?? "")}" placeholder="${esc(ph)}" data-ch="ctEd" data-k="${k}"></label>`).join("")}</div><div class="row" style="margin-top:8px"><button class="btn pri" data-act="ctEdSave" ${Object.keys(dr).length ? "" : "disabled"}>💾 Enregistrer et publier</button><span class="small muted">Partagé avec Paramètres de vente (virements, site internet).</span></div></div>` : ""}</section>`; }
Object.assign(CTACT, {
  ctEdT: () => { const st = UI.sub.ct; const V = venteCfg(); const ok = V.societe && V.siret && V.adresse && V.email; st.ed = !(st.ed ?? !ok); render(); },
  ctEdSave: async () => { const dr = UI.ctEd || {}; const v = Object.assign({}, deep(CONFIG.vente || {}), dr); CONFIG.vente = v; if (UI.cfg) UI.cfg.vente = Object.assign({}, UI.cfg.vente || {}, dr); try { await ADM.save("Identité de l'éditeur"); UI.ctEd = null; UI.sub.ct.ed = false; toast("✓ Identité de l'éditeur enregistrée."); } catch (e) { toast("Enregistrement impossible : " + (e.message || e)); } render(); }
});
Object.assign(CTCHG, { ctEd: el => { (UI.ctEd ||= {})[el.dataset.k] = el.value; render(); } });
/* ---------- sociétés créées (vos dossiers et ceux de vos clients) ---------- */
function ctSocOpts(sel) { const own = ((typeof INDEX !== "undefined" && INDEX.dossiers) || []).filter(d => !d.demo); const C = UI.ctSocs; if (!C && !UI.ctSocLoad) ctLoadSocs();
  return (own.length ? `<optgroup label="Sociétés créées dans mon espace">${own.map(d => `<option value="D:${d.id}" ${sel === "D:" + d.id ? "selected" : ""}>${esc(d.nom)}</option>`).join("")}</optgroup>` : "") + (C || []).filter(g => g.ds.length).map(g => `<optgroup label="Sociétés de ${esc(g.name || "client " + g.uid.slice(0, 6))}">${g.ds.map(d => `<option value="U:${g.uid}:${d.id}" ${sel === "U:" + g.uid + ":" + d.id ? "selected" : ""}>${esc(d.nom)}</option>`).join("")}</optgroup>`).join(""); }
async function ctLoadSocs() { if (Store.mode !== "db" || !Store.db) { UI.ctSocs = []; return; } UI.ctSocLoad = true; const out = []; try { const q = await Store.db.collection("registry").get(); for (const d of q.docs) { const u = plain(d.data()); if (!u || !u.id || u.id === Store.uid) continue; try { const ix = await supIndex(u.id); out.push({ uid: u.id, name: u.name || "", ds: ix.dossiers.filter(x => !x.demo) }); } catch (e) { } } } catch (e) { } UI.ctSocs = out; UI.ctSocLoad = false; if (UI.view === "contrats") render(); }
async function ctSocInfo(v) { let meta = null; try { if (v.startsWith("D:")) { const id = v.slice(2); if (S && S.id === id) meta = S; else { const r = await Store.loadDossier(id); meta = r && r.meta; } } else { const [, uid, id] = v.split(":"); const sd = await Store.db.doc("data/users/" + uid + "/d_" + id).get(); meta = sd.exists ? plain(sd.data()) : null; } } catch (e) { }
  if (!meta) { toast("Impossible de lire la fiche de cette société."); return {}; } const dp = meta.dp || {}; const d0 = (dp.dirigeants || [])[0] || {}; const J = meta.juri || {};
  return { client: meta.nom || "", forme: meta.forme || "", siren: meta.siren || "", capital: meta.capital ? NF0.format(Math.round(meta.capital / 100)) : "", adresse: meta.adresse || "", rep: d0.nom || J.dirigeant || "", qualite: d0.fonction || J.qualite || "", type: ctTypeOf(meta.forme) }; }
