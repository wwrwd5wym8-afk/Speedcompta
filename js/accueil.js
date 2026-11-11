/* ================= Espace client : accueil d'un nouveau client, icône SpeedCompta, kit de lien ================= */
const SC_ICON_SVG = SCLOGO.iconSVG();
const scIconURL = () => (typeof scLogo === "function" && scLogo().custom) ? scLogo().img : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SC_ICON_SVG);
function scSetFavicon() { try { let l = document.querySelector('link[rel="icon"]'); if (!l) { l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); } l.type = "image/svg+xml"; l.href = scIconURL(); document.title = (CONFIG && CONFIG.branding && CONFIG.branding.nom) || "Speedix"; } catch (e) { } }
scSetFavicon();
function scIconPNG(size = 512) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(img, 0, 0, size, size); c.toBlob(b => b ? b.arrayBuffer().then(a => res(new Uint8Array(a))) : rej(new Error("png")), "image/png"); }; img.onerror = rej; img.src = scIconURL(); }); }

/* lien à envoyer aux clients : lien court (votre domaine) sinon lien direct du logiciel */
const scClientLink = () => { const s = venteCfg().site || {}; return (s.lien || "").trim() || s.appUrl || ""; };

/* ---------- Écran d'accueil d'un nouveau client ---------- */
function welHTML() {
  const b = CONFIG.branding; const V = venteCfg(); const nom = b.nom || "Speedix"; const prev = UI._welcome === "preview"; const a = UI.access || {};
  const off = V.actif && (V.offres || []).length; const lic = a.licence && !prev; const o = lic ? (V.offres || []).find(x => x.id === a.offre) || {} : null;
  const codeBox = `<div class="row" style="gap:6px;flex-wrap:wrap"><input class="in mono" id="licIn" placeholder="SC-XXX-XXXX-XXXX" style="flex:1;min-width:180px"><button class="btn pri" data-act="licRedeemGo">Activer</button></div>`;
  return `<div class="wel">${prev ? `<div class="wel-prev">👁 <b>Aperçu</b> : voici ce que voit un nouveau client en ouvrant votre lien. <button class="btn sm" data-act="welBack">⟵ Revenir à l'Espace éditeur</button></div>` : ""}
  <div class="wel-in"><div class="wel-brand"><img src="${scIconURL()}" alt="" width="56" height="56"><div><div class="logo">${brandHTML()}</div><div class="muted small">${esc(b.slogan || "")}</div></div></div>
  <h1>Bienvenue dans votre espace ${esc(nom)}${UI.userName && !prev ? ", " + esc(UI.userName.split(" ")[0]) : ""}</h1>
  <p class="lead">Votre comptabilité en ligne : saisie, banque, TVA, révision et liasse fiscale. Choisissez comment commencer.</p>
  ${lic ? `<div class="wel-ok">✓ Accès actif : offre <b>${esc(o.nom || a.offre || "")}</b>${a.maxSoc ? " · " + a.maxSoc + " société(s)" : " · sociétés illimitées"}${a.expire ? " · jusqu'au " + frDate(a.expire) : ""}</div>` : ""}
  <div class="wel-cards">
    ${lic ? "" : `<div class="wel-c c1"><div class="wel-i">🔑</div><h3>J'ai un code d'activation</h3><p class="small muted">Saisissez le code reçu avec votre offre pour activer votre accès.</p>${codeBox}</div>`}
    <button class="wel-c c2" data-act="welNew"><div class="wel-i">🏢</div><h3>Créer ma société</h3><p class="small muted">Société, indépendant, association ou création : le plan comptable et la fiscalité s'adaptent.</p><span class="btn pri">Commencer →</span></button>
    <button class="wel-c c3" data-act="welDemo"><div class="wel-i">✨</div><h3>Découvrir le logiciel</h3><p class="small muted">Explorez une société exemple déjà remplie, sans rien saisir.</p><span class="btn">Voir la démonstration</span></button>
  </div>
  ${off ? `<div class="wel-off"><button class="lnk" data-act="welOff">${UI._welOff ? "▾" : "▸"} Voir les offres et tarifs</button>${UI._welOff ? `<div style="margin-top:12px">${VIEWS.abonnement()}</div>` : ""}</div>` : ""}
  <p class="small muted wel-foot">Besoin d'aide ? ${b.support ? "Contactez-nous : <b>" + esc(b.support) + "</b>" : esc(V.email || "")}</p></div></div>`;
}
function welRender() { const app = $("#app"); if (!app) return; app.innerHTML = welHTML(); const mr = $("#modalRoot"); if (mr) { try { mr.innerHTML = UI.modal ? renderModal() : ""; } catch (e) { mr.innerHTML = ""; } } }
const _renderWel = render;
render = function () { if (UI._welcome) return welRender(); return _renderWel.apply(this, arguments); };

const _createDossierWel = SACT.createDossier;
const _redeemWel = LICACT.licRedeemGo;
const WELACT = {
  welNew: () => SACT.newSoc(),
  welDemo: async () => { if (UI._welcome === "preview") { UI._welcome = null; render(); return; } const r = buildDemo(); setDossier(r.S, r.E); saveAll(); await withTO(saveIndex(), 5000, null); UI._welcome = null; UI.view = "dashboard"; render(); toast("Société exemple ouverte : créez la vôtre depuis « Dossiers » quand vous êtes prêt."); },
  welOff: () => { UI._welOff = !UI._welOff; render(); },
  welPrev: () => { UI._welcome = "preview"; UI._welOff = false; render(); try { window.scrollTo(0, 0); } catch (e) { } },
  welBack: () => { UI._welcome = null; UI.modal = null; render(); },
  scIconDl: async () => { try { const png = await scIconPNG(512); deliverFile("speedcompta-icone.png", png, "png", null, { cat: "Site", lib: "Icône SpeedCompta" }); } catch (e) { toast("Icône indisponible dans cette vue."); } },
  scLinkDl: () => { const V = venteCfg(); const s = V.site || {}; if (!s.appUrl) { toast("Renseignez d'abord le lien du logiciel."); return; } deliverFile("index.html", new TextEncoder().encode(scLinkPage(V)), "html", null, { cat: "Site", lib: "Page de lien SpeedCompta" }); }
};
SACT.createDossier = async function () { if (UI._welcome === "preview") { closeModal(); toast("Aperçu : rien n'est créé sur votre compte éditeur."); return; } UI._welcome = null; return _createDossierWel.apply(this, arguments); };
LICACT.licRedeemGo = async function () { if (UI._welcome === "preview") { toast("Aperçu : le code n'est pas activé sur votre compte éditeur."); return; } return _redeemWel.apply(this, arguments); };
Object.assign(LICACT, WELACT);

/* ---------- Page de lien (votre domaine) : aperçu « SpeedCompta » + icône dans WhatsApp, e-mail, SMS ---------- */
function scOG(V, title) { const s = V.site || {}; const dom = (s.domaine || "").trim().replace(/\/+$/, ""); const nom = (CONFIG.branding && CONFIG.branding.nom) || "Speedix"; const d = esc(s.sousTitre || "Logiciel de comptabilité en ligne");
  return `<link rel="icon" type="image/svg+xml" href="${scIconURL()}"><meta property="og:type" content="website"><meta property="og:site_name" content="${esc(nom)}"><meta property="og:title" content="${esc(title || nom)}"><meta property="og:description" content="${d}">${dom ? `<link rel="apple-touch-icon" href="${esc(dom)}/speedcompta-icone.png"><meta name="apple-mobile-web-app-title" content="${esc(nom)}"><meta name="theme-color" content="#0F3D3E"><meta property="og:image" content="${esc(dom)}/speedcompta-icone.png"><meta property="og:url" content="${esc(dom)}">` : ""}<meta name="twitter:card" content="summary">`; }
function scLinkPage(V) { const s = V.site || {}; const nom = (CONFIG.branding && CONFIG.branding.nom) || "Speedix"; const app = s.appUrl;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(nom)} · Espace client</title>${scOG(V, nom + " · Espace client")}<meta http-equiv="refresh" content="1;url=${esc(app)}">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#F5F7FB;color:#0F1B33}@media (prefers-color-scheme:dark){body{background:#0B1220;color:#E8EDF7}}.c{text-align:center;padding:24px}a{display:inline-block;margin-top:16px;padding:12px 22px;border-radius:10px;background:#0F3D3E;color:#fff;font-weight:700;text-decoration:none}</style></head>
<body><div class="c"><img src="${scIconURL()}" width="72" height="72" alt="" style="border-radius:16px"><h1>${esc(nom)}</h1><p>Ouverture de votre espace client…</p><a href="${esc(app)}">Ouvrir ${esc(nom)}</a></div></body></html>`; }

/* siteHTML : icône + aperçu de lien */
const _siteHTMLWel = siteHTML;
siteHTML = function (V) { const h = _siteHTMLWel(V); const nom = (CONFIG.branding && CONFIG.branding.nom) || "Speedix"; const s = V.site || {}; let out = h.replace("</title>", "</title>" + scOG(V, nom + " · logiciel de comptabilité en ligne")); if ((s.lien || "").trim()) out = out.split(esc(s.appUrl || "#none#")).join(esc(s.lien.trim())); return out; };

/* Paramètres du site : lien court, domaine, kit */
const _venteSiteWel = VIEWS.venteSite;
VIEWS.venteSite = () => { const h = _venteSiteWel(); if (!isAdmin()) return h; const S0 = venteCfg().site || {};
  const box = `<div class="wel-kit"><h3 style="margin:0 0 6px">🔗 Votre lien client « ${esc(CONFIG.branding.nom || "Speedix")} »</h3><p class="small muted" style="margin:0 0 10px">Pour que vos clients voient <b>${esc(CONFIG.branding.nom || "Speedix")}</b> et votre icône (et non « Claude Artifact ») quand vous envoyez le lien par WhatsApp, SMS ou e-mail, envoyez un lien de <b>votre nom de domaine</b> qui ouvre le logiciel.</p>
  <label class="f">Votre nom de domaine<input class="in" value="${esc(S0.domaine || "")}" placeholder="https://www.speedcompta.fr" data-ch="vsF" data-f="domaine"></label>
  <label class="f">Lien envoyé aux clients<input class="in" value="${esc(S0.lien || "")}" placeholder="https://www.speedcompta.fr/app" data-ch="vsF" data-f="lien"></label>
  <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="scIconDl"><img src="${scIconURL()}" width="16" height="16" alt=""> Icône (PNG)</button><button class="btn sm" data-act="scLinkDl">⇩ Page de lien (index.html)</button><button class="btn sm" data-act="welPrev">👁 Voir l'espace client</button></div>
  <ol class="small muted" style="margin:10px 0 0;padding-left:18px;line-height:1.7"><li>À la racine de votre domaine : le site (⇩ Télécharger le site) + <span class="mono">speedcompta-icone.png</span>.</li><li>Dans un dossier <span class="mono">/app</span> : la page de lien <span class="mono">index.html</span>.</li><li>Renseignez ci-dessus <span class="mono">…/app</span> comme lien client : il est repris dans les messages d'accès et sur le site.</li></ol></div>`;
  return h.replace('<div class="panel" style="padding:14px">', '<div class="panel" style="padding:14px">' + box); };

/* Clients et accès : aperçu de l'espace client */
const _licViewWel = VIEWS.licences;
VIEWS.licences = () => { const h = _licViewWel(); if (!isAdmin()) return h; return `<div class="wel-bar"><img src="${scIconURL()}" width="28" height="28" alt=""><span>Ce que voit votre client en ouvrant le lien : un espace d'accueil ${esc(CONFIG.branding.nom || "Speedix")} pour activer son code et créer sa société.</span><button class="btn sm" data-act="welPrev">👁 Voir l'espace client</button></div>` + h; };
