/* ============================================================
   Accueil › Application mobile et ordinateur
   Installation de SpeedCompta sur l'écran d'accueil (iPhone, Android) et sur l'ordinateur,
   kit d'application avec l'icône SpeedCompta à déposer sur votre nom de domaine.
   L'application ouvre toujours la version en ligne : les modifications publiées sont visibles à l'ouverture suivante.
   ============================================================ */
const MOB_DEF_URL = "https://claude.ai/artifact/ANKbBV6iJDKWa4GXA8EqMb";
let mobAppUrl = () => { try { const s = venteCfg().site || {}; return (s.appUrl || "").trim() || MOB_DEF_URL; } catch (e) { return MOB_DEF_URL; } };
const MOB_SITE = "https://wwrwd5wym8-afk.github.io/Speedcompta/";
let mobLink = () => { try { const s = venteCfg().site || {}; return (s.lien || "").trim() || MOB_SITE; } catch (e) { return MOB_SITE; } };
const mobStandalone = () => { try { return window.matchMedia("(display-mode: standalone)").matches || !!window.navigator.standalone; } catch (e) { return false; } };
const mobOS = () => { const u = navigator.userAgent || ""; return /iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(u) ? "android" : "desk"; };
const mobNom = () => (CONFIG.branding && CONFIG.branding.nom) || "SpeedCompta";

/* icône carrée pleine (iOS arrondit lui-même les coins) ; pad > 0 : zone de sécurité Android */
function mobIconSVG(pad) { const T = SCLOGO.TEAL, k = 0.7083 * (1 - pad), o = 48 - 48 * k; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${T}"/><g transform="translate(${o.toFixed(2)} ${o.toFixed(2)}) scale(${k.toFixed(4)})">${SCLOGO.mark(SCLOGO.CREAM, SCLOGO.GOLD)}</g></svg>`; }
function mobPNG(size, pad = 0) { return new Promise((res, rej) => { const L = typeof scLogo === "function" ? scLogo() : { custom: false }; const img = new Image();
  img.onload = () => { const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d");
    if (L.custom) { x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, size, size); const m = size * (0.14 + pad * 0.5); const w = size - 2 * m; const r = img.width / img.height; const dw = r >= 1 ? w : w * r, dh = r >= 1 ? w / r : w; x.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh); }
    else x.drawImage(img, 0, 0, size, size);
    c.toBlob(b => b ? b.arrayBuffer().then(a => res(new Uint8Array(a))) : rej(new Error("png")), "image/png"); };
  img.onerror = () => rej(new Error("icône")); img.src = L.custom ? L.img : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(mobIconSVG(pad)); }); }
function mobIndex(url) { const n = esc(mobNom()); const s = esc((CONFIG.branding && CONFIG.branding.slogan) || "");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${n}</title>
<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<meta name="apple-mobile-web-app-title" content="${n}"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="${SCLOGO.TEAL}">
<meta property="og:site_name" content="${n}"><meta property="og:title" content="${n} · Espace client"><meta property="og:image" content="icon-512.png">
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#0F1B33;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px}.c{text-align:center;max-width:420px}img{width:96px;height:96px;border-radius:22px;box-shadow:0 10px 30px rgba(15,61,62,.25)}h1{margin:18px 0 6px;font-size:28px}p{margin:0 0 18px;color:#4E6362}a{display:inline-block;padding:13px 24px;border-radius:12px;background:${SCLOGO.TEAL};color:#fff;font-weight:700;text-decoration:none}.t{margin-top:22px;font-size:13px;color:#5F7473;line-height:1.6;background:#F7FAF9;border:1px solid #E3EBEA;border-radius:12px;padding:12px 14px;text-align:left}</style></head>
<body><div class="c"><img src="icon-512.png" alt=""><h1>${n}</h1><p>${s}</p><a id="go" href="${esc(url)}">Ouvrir ${n}</a>
<div class="t"><b>Mettre ${n} sur votre écran :</b><br>iPhone (Safari) : Partager ⬆︎ puis « Sur l'écran d'accueil ».<br>Android (Chrome) : menu ⋮ puis « Installer l'application ».<br>Ordinateur (Chrome, Edge) : icône « Installer » dans la barre d'adresse.</div></div>
<script>if(window.matchMedia("(display-mode: standalone)").matches||navigator.standalone)location.replace(document.getElementById("go").href);</script></body></html>`; }
function mobManifest() { const n = mobNom(); return JSON.stringify({ name: n, short_name: n, description: "Logiciel de comptabilité en ligne", start_url: "./", display: "standalone", background_color: SCLOGO.TEAL, theme_color: SCLOGO.TEAL, lang: "fr",
  icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }, { src: "icon-512.png", sizes: "512x512", type: "image/png" }, { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] }, null, 2); }

VIEWS.mobApp = () => { const os = mobOS(); const inst = mobStandalone(); const url = mobAppUrl(); const lien = mobLink(); const adm = isAdmin(); const n = esc(mobNom());
  const ico = typeof scIconURL === "function" ? scIconURL() : SCLOGO.iconURL();
  const step = (k, t, d) => `<div class="mob-st"><span>${k}</span><div><b>${t}</b>${d ? `<div class="small muted">${d}</div>` : ""}</div></div>`;
  const ios = `<section class="card mob-c ${os === "ios" ? "here" : ""}"><div class="card-h"><h3>📱 iPhone et iPad</h3>${os === "ios" ? '<span class="pill ok">Votre appareil</span>' : ""}</div><div class="card-b">
    ${step(1, "Ouvrez le lien dans Safari", "Pas dans l'application Claude ni dans un autre navigateur : seul Safari propose l'ajout à l'écran d'accueil.")}${step(2, "Touchez Partager ⬆︎", "En bas de l'écran (ou en haut sur iPad).")}${step(3, "Choisissez « Sur l'écran d'accueil »", "Faites défiler la liste si besoin.")}${step(4, "Nommez-la « " + n + " » puis Ajouter", "L'icône apparaît sur votre écran comme une application.")}</div></section>`;
  const and = `<section class="card mob-c ${os === "android" ? "here" : ""}"><div class="card-h"><h3>🤖 Android</h3>${os === "android" ? '<span class="pill ok">Votre appareil</span>' : ""}</div><div class="card-b">
    ${step(1, "Ouvrez le lien dans Chrome", "")}${step(2, "Menu ⋮ en haut à droite", "")}${step(3, "« Installer l'application » ou « Ajouter à l'écran d'accueil »", "")}${step(4, "Confirmez", "L'icône apparaît dans vos applications.")}</div></section>`;
  const desk = `<section class="card mob-c ${os === "desk" ? "here" : ""}"><div class="card-h"><h3>💻 Ordinateur</h3>${os === "desk" ? '<span class="pill ok">Votre appareil</span>' : ""}</div><div class="card-b">
    ${step("PC", "Chrome ou Edge : icône « Installer » dans la barre d'adresse", "Ou menu ⋮ › « Caster, enregistrer et partager » › « Installer la page en tant qu'application ». SpeedCompta s'ouvre dans sa propre fenêtre, avec une icône sur le bureau et dans la barre des tâches.")}${step("Mac", "Safari : menu Fichier › « Ajouter au Dock »", "Chrome sur Mac : même procédure que sur PC.")}</div></section>`;
  return `<div class="pg-h"><div><div class="eyebrow">Accueil</div><h1>Application mobile et ordinateur</h1><p class="lead">Installez ${n} sur l'écran d'accueil de votre iPhone, de votre téléphone Android ou sur votre ordinateur. L'application ouvre toujours la dernière version : chaque modification que vous demandez à Claude est visible à l'ouverture suivante, sans rien réinstaller.</p></div></div>
  <section class="card mob-hero"><img src="${ico}" alt="" width="84" height="84"><div style="flex:1;min-width:0"><b class="mob-nm">${n}</b><div class="small muted">${inst ? "✓ Vous utilisez actuellement l'application installée." : "Lien de l'application :"}</div>${inst ? "" : `<div class="mob-url mono">${esc(lien || url)}</div>`}</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-act="mobCopy">Copier le lien</button><a class="btn pri" href="${esc(lien || url)}" target="_blank" rel="noopener">Ouvrir dans le navigateur ↗</a></div></section>
  <div class="mob-g">${ios}${and}${desk}</div>
  <section class="card"><div class="card-h"><h3>Avec l'icône ${n} sur l'écran</h3>${adm ? '<span class="pill n">Éditeur</span>' : ""}</div><div class="card-b">
    <p class="small" style="margin-top:0">L'écran d'accueil reprend l'icône de la page ajoutée. Depuis le lien claude.ai, c'est l'icône de Claude qui s'affiche. Pour afficher l'icône ${n}, l'ajout doit se faire depuis une page de <b>votre nom de domaine</b> qui ouvre ensuite le logiciel : c'est ce que contient le kit.</p>
    ${adm ? `<ol class="small mob-ol"><li>Téléchargez le kit : page d'ouverture, icônes iPhone, Android et ordinateur, fichier d'installation.</li><li>Déposez son contenu sur votre site, par exemple dans <span class="mono">https://www.votredomaine.fr/app/</span>.</li><li>Indiquez cette adresse dans « Lien envoyé aux clients » (Espace éditeur › Site) : elle devient le lien affiché ci-dessus et dans vos messages d'accès.</li></ol>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="mobKit">⇩ Kit application (ZIP)</button><button class="btn" data-act="scIconDl">⇩ Icône seule (PNG)</button><button class="btn ghost" data-act="go" data-v="venteSite">Lien client et site →</button></div>` : `<p class="small muted" style="margin:0">Demandez à votre éditeur le lien de l'application à son nom.</p>`}</div></section>
  <section class="card"><div class="card-h"><h3>Modifications avec Claude</h3></div><div class="card-b small" style="line-height:1.65">Demandez vos évolutions à Claude, sur ordinateur ou dans l'application Claude de votre iPhone. Une fois publiées, elles sont en ligne pour tout le monde : fermez puis rouvrez ${n} (ou tirez la page vers le bas) pour voir la nouvelle version. Vos données restent enregistrées dans votre espace et ne sont pas modifiées par les mises à jour.</div></section>`; };
Object.assign(LICACT, {
  mobCopy: async () => { const u = mobLink() || mobAppUrl(); try { await navigator.clipboard.writeText(u); toast("Lien copié : collez-le dans Safari ou envoyez-le par message."); } catch (e) { toast(u); } },
  mobKit: async () => { if (!isAdmin()) return; toast("Préparation du kit…"); try { const enc = s => new TextEncoder().encode(s);
    const [a180, i192, i512, m512, f32, big] = await Promise.all([mobPNG(180), mobPNG(192), mobPNG(512), mobPNG(512, 0.2), mobPNG(32), mobPNG(1024)]);
    const files = [{ name: "app/index.html", data: enc(mobIndex(mobAppUrl())) }, { name: "app/manifest.webmanifest", data: enc(mobManifest()) }, { name: "app/apple-touch-icon.png", data: a180 }, { name: "app/icon-192.png", data: i192 }, { name: "app/icon-512.png", data: i512 }, { name: "app/icon-maskable-512.png", data: m512 }, { name: "app/favicon-32.png", data: f32 }, { name: "speedcompta-icone.png", data: i512 }, { name: "speedcompta-icone-1024.png", data: big },
      { name: "LISEZMOI.txt", data: enc("Kit application " + mobNom() + "\n\n1. Déposez le dossier app/ sur votre site (ex. https://www.votredomaine.fr/app/).\n2. Déposez speedcompta-icone.png à la racine du site (aperçu des liens).\n3. Envoyez à vos clients l'adresse https://www.votredomaine.fr/app/ : ils l'ajoutent à leur écran d'accueil (iPhone : Safari > Partager > Sur l'écran d'accueil ; Android et ordinateur : Installer l'application).\n\nLe bouton de la page ouvre : " + mobAppUrl() + "\n") }];
    deliverFile((mobNom().replace(/\W+/g, "") || "SpeedCompta") + "_application.zip", zipStore(files), "zip", null, { cat: "Site", lib: "Kit application" }); } catch (e) { toast("Kit indisponible dans cette vue : " + (e.message || e)); } }
});
/* menu Accueil */
(function () { const n = NAV2.find(x => x[0] === "accueil"); if (!n) return; if (!n[2].includes("mobApp")) n[2].push("mobApp"); if (Array.isArray(n[3]) && !n[3].some(s => s[0] === "mobApp")) n[3].push(["mobApp", "Application mobile"]); })();
/* Paramètres : raccourci */
const _paramsMob = VIEWS.params;
VIEWS.params = function () { const h = _paramsMob.apply(this, arguments); const box = `<section class="card mob-hero" style="margin-bottom:16px"><img src="${typeof scIconURL === "function" ? scIconURL() : SCLOGO.iconURL()}" alt="" width="52" height="52"><div style="flex:1"><b>Application mobile et ordinateur</b><div class="small muted">Installez ${esc(mobNom())} sur l'écran de votre iPhone, de votre téléphone Android ou de votre ordinateur.</div></div><button class="btn pri" data-act="go" data-v="mobApp">Installer →</button></section>`; const i = h.indexOf('<section class="card sc-logo-card"'); return i < 0 ? box + h : h.slice(0, i) + box + h.slice(i); };

/* ---------- Installer sur un autre appareil : QR code, partage par message ---------- */
function mobQRDraw() { const box = document.getElementById("mobQR"); if (!box || box.dataset.ok) return; const u = mobLink() || mobAppUrl();
  try { box.innerHTML = window.SCQR(u, { size: 168, dark: SCLOGO.TEAL, margin: 2 }); box.dataset.ok = "1"; } catch (e) { box.innerHTML = '<div class="small muted" style="padding:20px;text-align:center">QR code indisponible : utilisez les boutons d\'envoi.</div>'; } }
function mobShareCard() { const u = mobLink() || mobAppUrl(); const n = mobNom(); const msg = "Installe " + n + " sur ton téléphone ou ton ordinateur : " + u;
  return `<section class="card mob-share"><div class="card-h"><h3>📲 Installer sur un autre téléphone ou ordinateur</h3></div><div class="card-b mob-sh">
    <div class="mob-qr"><div id="mobQR"></div><div class="small muted" style="text-align:center;margin-top:6px">Scannez avec l'appareil photo</div></div>
    <div style="flex:1;min-width:220px"><ol class="small mob-ol" style="margin-top:0"><li><b>Scannez le QR code</b> avec l'appareil photo de l'autre téléphone, ou envoyez-vous le lien ci-dessous.</li><li>Ouvrez le lien (sur iPhone, dans <b>Safari</b>) et connectez-vous avec le même compte.</li><li>Ajoutez-le à l'écran d'accueil : iPhone Partager ⬆︎ › « Sur l'écran d'accueil » ; Android et ordinateur : « Installer l'application ».</li></ol>
      <div class="mob-url mono" style="margin-bottom:10px">${esc(u)}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap">${navigator.share ? `<button class="btn pri" data-act="mobShare">Partager…</button>` : ""}<a class="btn" href="sms:?&body=${encodeURIComponent(msg)}">💬 SMS</a><a class="btn" href="mailto:?subject=${encodeURIComponent(n)}&body=${encodeURIComponent(msg)}">✉ E-mail</a><a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">WhatsApp</a><button class="btn" data-act="mobCopy">Copier le lien</button><button class="btn ghost" data-act="go" data-v="mobApp">Guide détaillé →</button></div></div></div></section>`; }
LICACT.mobShare = async () => { const u = mobLink() || mobAppUrl(); try { await navigator.share({ title: mobNom(), text: "Installe " + mobNom() + " : ", url: u }); } catch (e) { } };
const _paramsMob2 = VIEWS.params;
VIEWS.params = function () { const h = _paramsMob2.apply(this, arguments); setTimeout(mobQRDraw, 0); return h.replace(/<section class="card mob-hero" style="margin-bottom:16px">[\s\S]*?<\/section>/, m => m + mobShareCard()); };
const _mobAppV = VIEWS.mobApp;
VIEWS.mobApp = function () { const h = _mobAppV.apply(this, arguments); setTimeout(mobQRDraw, 0); const i = h.indexOf('<div class="mob-g">'); return i < 0 ? h + mobShareCard() : h.slice(0, i) + mobShareCard() + h.slice(i); };
