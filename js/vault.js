/* ============================================================
   Contacts › Mots de passe : coffre-fort chiffré de la société
   (impôts, URSSAF, banque, fournisseurs, plateformes, personnels…)
   - chiffrement de bout en bout dans le navigateur : AES-GCM 256, clé dérivée du mot de passe maître (PBKDF2-SHA-256, 310 000 itérations)
   - seul le coffre chiffré est enregistré : ni le cabinet, ni l'éditeur, ni l'hébergeur ne peuvent le lire
   - verrouillage automatique (5 min d'inactivité, changement de société), copie effacée du presse-papiers après 30 s
   - générateur, indicateur de robustesse, détection des mots de passe faibles, réutilisés ou anciens
   ============================================================ */
const VLT_CAT = [["impots", "Impôts", "🏛"], ["social", "URSSAF et social", "🛡"], ["banque", "Banque", "🏦"], ["fourn", "Fournisseurs", "📦"], ["plateforme", "Plateformes et clients", "🌐"], ["admin", "Administratif", "📋"], ["perso", "Personnel", "👤"], ["autre", "Autre", "🔑"]];
const VLT_SUGG = [["Espace professionnel impots.gouv", "impots", "https://cfspro.impots.gouv.fr"], ["Net-entreprises (DSN)", "social", "https://www.net-entreprises.fr"], ["URSSAF", "social", "https://www.urssaf.fr"], ["Guichet unique INPI", "admin", "https://procedures.inpi.fr"], ["Banque en ligne", "banque", ""], ["Plateforme agréée (factures)", "plateforme", ""], ["Chorus Pro", "plateforme", "https://chorus-pro.gouv.fr"], ["Espace personnel impots.gouv", "perso", "https://www.impots.gouv.fr"]];
const VLT_IT = 310000;
let VAULT = null; /* { sid, key, items, t } en mémoire seulement */
const b64e = u => { let s = ""; const a = new Uint8Array(u); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function vltKey(pw, salt, it) { const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: it, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); }
async function vltEnc(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj))); return b64e(iv) + "." + b64e(ct); }
async function vltDec(key, s) { const [iv, ct] = s.split("."); const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(iv) }, key, b64d(ct)); return JSON.parse(new TextDecoder().decode(pt)); }
const vltOpen = () => VAULT && S && VAULT.sid === S.id;
function vltLock(msg) { VAULT = null; if (UI.view === "vault") render(); if (msg) toast(msg); }
async function vltSave() { if (!vltOpen()) return; S.vault.data = await vltEnc(VAULT.key, VAULT.items); S.vault.maj = new Date().toISOString(); Store.touch(); }
function vltScore(pw) { pw = String(pw || ""); if (!pw) return 0; let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^\w]/.test(pw)) pool += 30; let bits = pw.length * Math.log2(Math.max(pool, 2));
  if (/^(.)\1+$/.test(pw) || /(password|motdepasse|azerty|qwerty|123456|admin)/i.test(pw)) bits = Math.min(bits, 20); return bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4; }
const VLT_SC = [["", ""], ["Faible", "ko"], ["Moyen", "warn"], ["Bon", "ok"], ["Excellent", "ok"]];
function vltGen(o) { o = Object.assign({ n: 20, up: true, dig: true, sym: true }, o || {}); let cs = "abcdefghijkmnopqrstuvwxyz"; if (o.up) cs += "ABCDEFGHJKLMNPQRSTUVWXYZ"; if (o.dig) cs += "23456789"; if (o.sym) cs += "!#$%&*+-=?@_"; const r = crypto.getRandomValues(new Uint32Array(o.n)); let s = ""; for (let i = 0; i < o.n; i++) s += cs[r[i] % cs.length]; return s; }
function vltHealth() { const L = VAULT.items; const cnt = {}; L.forEach(x => { if (x.pw) cnt[x.pw] = (cnt[x.pw] || 0) + 1; }); const yr = Date.now() - 365 * 864e5;
  const weak = L.filter(x => x.pw && vltScore(x.pw) <= 1), reu = L.filter(x => x.pw && cnt[x.pw] > 1), old = L.filter(x => x.maj && new Date(x.maj).getTime() < yr);
  const score = L.length ? Math.max(0, Math.round(100 - (weak.length * 25 + reu.length * 15 + old.length * 5) * 100 / (L.length * 25))) : 100; return { weak, reu, old, score, cnt }; }

/* ---------- vue ---------- */
VIEWS.vault = () => { const V = S.vault; const U = (UI.sub.vlt ||= {});
  const head = (tools) => `<div class="pg-h"><div><div class="eyebrow">Contacts · ${esc(S.nom)}</div><h1>Mots de passe</h1><p class="lead">Coffre-fort chiffré pour les accès de la société : impôts, URSSAF, banque, fournisseurs, plateformes et accès personnels.</p></div>${tools ? `<div class="row">${tools}</div>` : ""}</div>`;
  const sec = `<div class="vl-sec">🔐 <b>Chiffré de bout en bout dans votre navigateur</b> (AES-256). Seul le mot de passe maître ouvre le coffre : ni votre cabinet, ni l'éditeur, ni l'hébergeur ne peuvent lire son contenu.</div>`;
  if (!V || !V.chk) return head() + sec + `<section class="card vl-setup"><div class="card-b"><div class="vl-ic">🗝</div><h2>Créer le coffre-fort de ${esc(S.nom)}</h2><p class="muted">Choisissez un mot de passe maître long et unique (une phrase de plusieurs mots, par exemple). Il n'est envoyé nulle part.</p>
    <label class="f">Mot de passe maître<input class="in" type="password" id="vlP1" autocomplete="new-password" data-in="vlMeter"></label><div class="vl-meter"><i id="vlMeter"></i></div>
    <label class="f">Confirmer<input class="in" type="password" id="vlP2" autocomplete="new-password"></label>
    <label class="chk vl-ack"><input type="checkbox" id="vlAck"> J'ai compris qu'un mot de passe maître oublié <b>ne peut pas être récupéré</b> : le contenu du coffre serait perdu.</label>
    <button class="btn pri" data-act="vlCreate">Créer le coffre-fort</button></div></section>`;
  if (!vltOpen()) return head() + sec + `<section class="card vl-setup"><div class="card-b"><div class="vl-ic">🔒</div><h2>Coffre-fort verrouillé</h2><p class="muted">Saisissez le mot de passe maître pour afficher les accès de ${esc(S.nom)}.</p>
    <form data-vl-unlock onsubmit="return false"><label class="f">Mot de passe maître<input class="in" type="password" id="vlUn" autocomplete="current-password" autofocus></label><div id="vlErr" class="small" style="color:#B42318;min-height:18px"></div><button class="btn pri" data-act="vlUnlock">Déverrouiller</button></form></div></section>`;
  const H = vltHealth(); const q = (U.q || "").toLowerCase(); const cat = U.cat || "";
  const L = VAULT.items.filter(x => (!cat || (cat === "!" ? (H.weak.includes(x) || H.reu.includes(x) || H.old.includes(x)) : x.cat === cat)) && (!q || [x.titre, x.login, x.url, x.notes].join(" ").toLowerCase().includes(q))).sort((a, b) => (a.titre || "").localeCompare(b.titre || ""));
  const catN = k => VAULT.items.filter(x => x.cat === k).length;
  return head(`<button class="btn" data-act="vlGenOpen">⚄ Générer</button><button class="btn" data-act="vlLock">🔒 Verrouiller</button><button class="btn pri" data-act="vlNew">＋ Ajouter un accès</button>`) +
    `<div class="vl-top"><div class="vl-health ${H.score >= 80 ? "ok" : H.score >= 50 ? "warn" : "ko"}"><b>${H.score}</b><span>Santé du coffre</span></div>
      <div class="vl-stats"><div><b>${VAULT.items.length}</b><span>accès enregistrés</span></div><div class="${H.weak.length ? "ko" : ""}"><b>${H.weak.length}</b><span>faibles</span></div><div class="${H.reu.length ? "warn" : ""}"><b>${H.reu.length}</b><span>réutilisés</span></div><div class="${H.old.length ? "warn" : ""}"><b>${H.old.length}</b><span>de plus d'un an</span></div></div>
      <div class="vl-srch">🔍<input class="in" placeholder="Rechercher un accès…" value="${esc(U.q || "")}" data-in="vlQ" id="vlQ"></div></div>
    <div class="vl-cats"><button class="${!cat ? "on" : ""}" data-act="vlCat" data-k="">Tous <span>${VAULT.items.length}</span></button>${VLT_CAT.map(([k, l, i]) => catN(k) ? `<button class="${cat === k ? "on" : ""}" data-act="vlCat" data-k="${k}">${i} ${l} <span>${catN(k)}</span></button>` : "").join("")}${H.weak.length + H.reu.length + H.old.length ? `<button class="${cat === "!" ? "on" : ""} w" data-act="vlCat" data-k="!">⚠ À renforcer <span>${new Set(H.weak.concat(H.reu, H.old)).size}</span></button>` : ""}</div>` +
    (VAULT.items.length ? `<div class="vl-list">${L.map(x => { const c = VLT_CAT.find(c => c[0] === x.cat) || VLT_CAT[7]; const sc = vltScore(x.pw); const show = U.show === x.id; const flags = [H.weak.includes(x) ? '<span class="pill ko">Faible</span>' : "", H.reu.includes(x) ? '<span class="pill warn">Réutilisé</span>' : "", H.old.includes(x) ? '<span class="pill warn">À changer</span>' : ""].join("");
      return `<div class="vl-it"><div class="vl-av">${c[2]}</div><div class="vl-main"><div class="vl-t"><b>${esc(x.titre || "Sans titre")}</b>${flags}</div>
        <div class="vl-row"><span class="k">Identifiant</span><span class="mono v">${esc(x.login || "—")}</span>${x.login ? `<button class="vl-b" data-act="vlCopy" data-id="${x.id}" data-f="login" title="Copier l'identifiant">⧉</button>` : ""}</div>
        <div class="vl-row"><span class="k">Mot de passe</span><span class="mono v">${x.pw ? (show ? esc(x.pw) : "•".repeat(Math.min(14, x.pw.length))) : "—"}</span>${x.pw ? `<button class="vl-b" data-act="vlShow" data-id="${x.id}" title="${show ? "Masquer" : "Afficher"}">${show ? "🙈" : "👁"}</button><button class="vl-b" data-act="vlCopy" data-id="${x.id}" data-f="pw" title="Copier le mot de passe">⧉</button><span class="vl-sc s${sc}" title="Robustesse : ${VLT_SC[sc][0]}"><i></i><i></i><i></i><i></i></span>` : ""}</div>
        ${x.url || x.notes ? `<div class="vl-row small">${x.url ? `<a href="${esc(/^https?:/.test(x.url) ? x.url : "https://" + x.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(x.url.replace(/^https?:\/\//, ""))}</a>` : ""}${x.notes ? `<span class="muted"> ${esc(x.notes)}</span>` : ""}</div>` : ""}</div>
        <div class="vl-act"><small class="muted">${x.maj ? "modifié le " + frDate(x.maj.slice(0, 10)) : ""}</small><button class="btn sm" data-act="vlEdit" data-id="${x.id}">Modifier</button></div></div>`; }).join("") || `<div class="muted" style="padding:20px;text-align:center">Aucun accès ne correspond.</div>`}</div>`
      : `<section class="card"><div class="card-b"><h3 style="margin-top:0">Pour commencer, ajoutez les accès essentiels</h3><div class="vl-sugg">${VLT_SUGG.map(([t, c, u], i) => `<button data-act="vlSugg" data-i="${i}">${(VLT_CAT.find(x => x[0] === c) || [])[2]} ${esc(t)}</button>`).join("")}</div></div></section>`) +
    `<div class="vl-foot small muted">Verrouillage automatique après 5 minutes d'inactivité · copie effacée du presse-papiers après 30 secondes · <a href="#" data-act="vlChange">Changer le mot de passe maître</a> · <a href="#" data-act="vlCsv">Exporter (CSV non chiffré)</a></div>`; };

/* ---------- fenêtre d'édition et générateur ---------- */
const _rmVlt = renderModal;
renderModal = function () { const M = UI.modal; if (!M || !/^vl/.test(M.type)) return _rmVlt.apply(this, arguments);
  if (M.type === "vlGen") { const o = M.o ||= { n: 20, up: true, dig: true, sym: true }; M.pw ||= vltGen(o); const sc = vltScore(M.pw);
    return `<div class="modal-bg"><div class="modal" style="max-width:480px"><div class="modal-h"><h3>Générateur de mot de passe</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-b">
      <div class="vl-gen mono">${esc(M.pw)}</div><div class="vl-meter"><i class="s${sc}" style="width:${sc * 25}%"></i></div><p class="small muted" style="margin:4px 0 12px">Robustesse : <b>${VLT_SC[sc][0]}</b></p>
      <label class="f">Longueur : <b>${o.n}</b><input type="range" min="10" max="40" value="${o.n}" data-ch="vlGenO" data-f="n"></label>
      <div class="row" style="gap:14px;flex-wrap:wrap">${[["up", "Majuscules"], ["dig", "Chiffres"], ["sym", "Symboles"]].map(([k, l]) => `<label class="chk"><input type="checkbox" data-ch="vlGenO" data-f="${k}" ${o[k] ? "checked" : ""}> ${l}</label>`).join("")}</div></div>
      <div class="modal-f"><button class="btn" data-act="vlGenNew">↻ Autre</button>${M.back ? `<button class="btn pri" data-act="vlGenUse">Utiliser</button>` : `<button class="btn pri" data-act="vlGenCopy">⧉ Copier</button>`}</div></div></div>`; }
  if (M.type === "vlChange") return `<div class="modal-bg"><div class="modal" style="max-width:440px"><div class="modal-h"><h3>Changer le mot de passe maître</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-b">
      <label class="f">Nouveau mot de passe maître<input class="in" type="password" id="vlC1" autocomplete="new-password"></label><label class="f">Confirmer<input class="in" type="password" id="vlC2" autocomplete="new-password"></label><div id="vlCErr" class="small" style="color:#B42318"></div></div>
      <div class="modal-f"><button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="vlChangeGo">Enregistrer</button></div></div></div>`;
  const d = M.d; const sc = vltScore(d.pw);
  return `<div class="modal-bg"><div class="modal" style="max-width:560px"><div class="modal-h"><h3>${M.id ? "Modifier l'accès" : "Nouvel accès"}</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-b">
    <div class="grid g2"><label class="f">Nom de l'accès<input class="in" data-ch="vlF" data-f="titre" value="${esc(d.titre || "")}" placeholder="Ex. Espace professionnel impots.gouv"></label>
    <label class="f">Catégorie<select class="in" data-ch="vlF" data-f="cat">${VLT_CAT.map(([k, l, i]) => `<option value="${k}" ${d.cat === k ? "selected" : ""}>${i} ${l}</option>`).join("")}</select></label></div>
    <label class="f">Identifiant / e-mail / n° client<input class="in" data-ch="vlF" data-f="login" value="${esc(d.login || "")}" autocomplete="off"></label>
    <label class="f">Mot de passe<div class="row" style="gap:6px"><input class="in mono" style="flex:1" type="${M.show ? "text" : "password"}" data-ch="vlF" data-f="pw" data-in="vlPw" value="${esc(d.pw || "")}" autocomplete="new-password"><button class="btn sm" data-act="vlMShow">${M.show ? "🙈" : "👁"}</button><button class="btn sm" data-act="vlMGen" title="Générer">⚄</button></div></label>
    <div class="vl-meter"><i id="vlMM" class="s${sc}" style="width:${sc * 25}%"></i></div><p class="small muted" id="vlMML" style="margin:4px 0 8px">${d.pw ? "Robustesse : " + VLT_SC[sc][0] : ""}</p>
    <label class="f">Adresse du site<input class="in" data-ch="vlF" data-f="url" value="${esc(d.url || "")}" placeholder="https://"></label>
    <label class="f">Notes<textarea class="in" rows="3" data-ch="vlF" data-f="notes">${esc(d.notes || "")}</textarea></label></div>
    <div class="modal-f">${M.id ? `<button class="btn ghost" data-act="vlDel" style="margin-right:auto;color:#B42318">Supprimer</button>` : ""}<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="vlSave">Enregistrer</button></div></div></div>`; };

/* ---------- actions ---------- */
let vlClipT = null;
async function vlCopy(txt, lib) { try { await navigator.clipboard.writeText(txt); toast(lib + " copié · effacé du presse-papiers dans 30 s"); clearTimeout(vlClipT); vlClipT = setTimeout(() => { try { navigator.clipboard.writeText(""); } catch (e) { } }, 30000); } catch (e) { toast("Copie impossible : sélectionnez et copiez manuellement."); } }
Object.assign(F2ACT, {
  vlCreate: async () => { const a = $("#vlP1").value, b = $("#vlP2").value; if (a.length < 10) { toast("Mot de passe maître : 10 caractères minimum."); return; } if (vltScore(a) < 2) { toast("Mot de passe maître trop faible : allongez-le."); return; } if (a !== b) { toast("Les deux saisies ne correspondent pas."); return; } if (!$("#vlAck").checked) { toast("Cochez la case pour confirmer."); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await vltKey(a, salt, VLT_IT); S.vault = { v: 1, salt: b64e(salt), it: VLT_IT, chk: await vltEnc(key, "ok"), data: await vltEnc(key, []), cree: new Date().toISOString() }; VAULT = { sid: S.id, key, items: [], t: Date.now() }; Store.touch(); toast("Coffre-fort créé."); render(); },
  vlUnlock: async () => { const pw = $("#vlUn").value; const e = $("#vlErr"); if (!pw) return; e.textContent = "Ouverture…"; try { const V = S.vault; const key = await vltKey(pw, b64d(V.salt), V.it || VLT_IT); if (await vltDec(key, V.chk) !== "ok") throw 0; const items = V.data ? await vltDec(key, V.data) : []; VAULT = { sid: S.id, key, items, t: Date.now() }; render(); }
    catch (x) { e.textContent = "Mot de passe maître incorrect."; const i = $("#vlUn"); if (i) { i.value = ""; i.focus(); } } },
  vlLock: () => vltLock("Coffre-fort verrouillé."),
  vlNew: () => openModal({ type: "vlEdit", d: { cat: (UI.sub.vlt || {}).cat && (UI.sub.vlt || {}).cat !== "!" ? UI.sub.vlt.cat : "autre" } }),
  vlSugg: el => { const [t, c, u] = VLT_SUGG[+el.dataset.i]; openModal({ type: "vlEdit", d: { titre: t, cat: c, url: u } }); },
  vlEdit: el => { const x = VAULT.items.find(y => y.id === el.dataset.id); if (x) openModal({ type: "vlEdit", id: x.id, d: Object.assign({}, x) }); },
  vlMShow: () => { UI.modal.show = !UI.modal.show; render(); },
  vlMGen: () => { const d = UI.modal.d; openModal({ type: "vlGen", back: { type: UI.modal.type, id: UI.modal.id, d } }); },
  vlGenOpen: () => openModal({ type: "vlGen" }),
  vlGenNew: () => { UI.modal.pw = vltGen(UI.modal.o); render(); },
  vlGenCopy: () => vlCopy(UI.modal.pw, "Mot de passe"),
  vlGenUse: () => { const M = UI.modal; const b = M.back; b.d.pw = M.pw; b.show = true; UI.modal = b; render(); },
  vlSave: async () => { const M = UI.modal; const d = M.d; if (!String(d.titre || "").trim()) { toast("Donnez un nom à cet accès."); return; } const now = new Date().toISOString();
    if (M.id) { const x = VAULT.items.find(y => y.id === M.id); const pwCh = x.pw !== d.pw; Object.assign(x, d, { maj: pwCh ? now : (x.maj || now) }); } else VAULT.items.push(Object.assign({ id: uid(), maj: now }, d));
    await vltSave(); closeModal(); toast("Accès enregistré (chiffré)."); render(); },
  vlDel: async () => { if (!confirm("Supprimer cet accès du coffre-fort ?")) return; VAULT.items = VAULT.items.filter(x => x.id !== UI.modal.id); await vltSave(); closeModal(); render(); },
  vlShow: el => { const U = UI.sub.vlt ||= {}; U.show = U.show === el.dataset.id ? null : el.dataset.id; render(); if (U.show) setTimeout(() => { if ((UI.sub.vlt || {}).show === el.dataset.id) { UI.sub.vlt.show = null; if (UI.view === "vault") render(); } }, 20000); },
  vlCopy: el => { const x = VAULT.items.find(y => y.id === el.dataset.id); if (x) vlCopy(x[el.dataset.f] || "", el.dataset.f === "pw" ? "Mot de passe" : "Identifiant"); },
  vlCat: el => { (UI.sub.vlt ||= {}).cat = el.dataset.k; render(); },
  vlChange: () => openModal({ type: "vlChange" }),
  vlChangeGo: async () => { const a = $("#vlC1").value, b = $("#vlC2").value, e = $("#vlCErr"); if (a.length < 10 || vltScore(a) < 2) { e.textContent = "10 caractères minimum, plus robuste."; return; } if (a !== b) { e.textContent = "Les deux saisies ne correspondent pas."; return; }
    const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await vltKey(a, salt, VLT_IT); VAULT.key = key; S.vault.salt = b64e(salt); S.vault.it = VLT_IT; S.vault.chk = await vltEnc(key, "ok"); await vltSave(); closeModal(); toast("Mot de passe maître changé."); },
  vlCsv: () => { if (!confirm("Le fichier exporté contiendra vos mots de passe EN CLAIR. Conservez-le en lieu sûr et supprimez-le après usage. Continuer ?")) return; const q = s => '"' + String(s || "").replace(/"/g, '""') + '"';
    const csv = "﻿" + ["Nom;Catégorie;Identifiant;Mot de passe;Site;Notes"].concat(VAULT.items.map(x => [x.titre, (VLT_CAT.find(c => c[0] === x.cat) || [])[1], x.login, x.pw, x.url, x.notes].map(q).join(";"))).join("\r\n");
    deliverFile("Mots_de_passe_" + (S.nom || "").replace(/\W+/g, "_") + ".csv", new TextEncoder().encode(csv), "csv"); }
});
Object.assign(F2CHG, {
  vlF: el => { UI.modal.d[el.dataset.f] = el.value; },
  vlGenO: el => { const o = UI.modal.o; o[el.dataset.f] = el.type === "checkbox" ? el.checked : +el.value; UI.modal.pw = vltGen(o); render(); }
});
/* saisie en direct : recherche, robustesse */
document.addEventListener("input", e => { const t = e.target; if (!t.dataset) return;
  if (t.dataset.in === "vlQ") { (UI.sub.vlt ||= {}).q = t.value; const pos = t.selectionStart; render(); const n = $("#vlQ"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { } } }
  if (t.dataset.in === "vlMeter") { const s = vltScore(t.value); const m = $("#vlMeter"); if (m) { m.className = "s" + s; m.style.width = s * 25 + "%"; } }
  if (t.dataset.in === "vlPw") { UI.modal.d.pw = t.value; const s = vltScore(t.value); const m = $("#vlMM"), l = $("#vlMML"); if (m) { m.className = "s" + s; m.style.width = s * 25 + "%"; } if (l) l.textContent = t.value ? "Robustesse : " + VLT_SC[s][0] : ""; } });
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "vlUn") { e.preventDefault(); F2ACT.vlUnlock(); } });
/* verrouillage automatique : inactivité 5 min, changement de société */
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (VAULT) VAULT.t = Date.now(); }, { passive: true, capture: true }));
setInterval(() => { if (!VAULT) return; if (!S || VAULT.sid !== S.id) { VAULT = null; return; } if (Date.now() - VAULT.t > 5 * 60000) vltLock("Coffre-fort verrouillé après 5 minutes d'inactivité."); }, 10000);
document.addEventListener("visibilitychange", () => { if (document.hidden && VAULT) VAULT.hid = Date.now(); else if (VAULT && VAULT.hid && Date.now() - VAULT.hid > 5 * 60000) vltLock(); });

(function () { const st = document.createElement("style"); st.textContent = `
.vl-sec{background:#EEF7F5;border:1px solid #CFE6E1;border-radius:12px;padding:10px 14px;font-size:13.5px;color:#0F3D3E;margin-bottom:14px}
.vl-setup{max-width:520px;margin:10px auto}.vl-setup .card-b{display:flex;flex-direction:column;gap:10px}.vl-setup h2{margin:0}.vl-ic{font-size:40px}.vl-ack{font-size:13px;line-height:1.5;display:flex;gap:8px;align-items:flex-start}
.vl-meter{height:6px;background:#EEF2F2;border-radius:99px;overflow:hidden}.vl-meter i{display:block;height:100%;width:0;transition:width .2s,background .2s}.vl-meter i.s1{background:#D92D20}.vl-meter i.s2{background:#F5B700}.vl-meter i.s3{background:#13A36B}.vl-meter i.s4{background:#0E7A4F}
.vl-top{display:flex;gap:14px;align-items:stretch;flex-wrap:wrap;margin-bottom:12px}
.vl-health{width:110px;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;color:#fff}.vl-health b{font-size:30px;line-height:1}.vl-health span{font-size:11.5px;opacity:.9;text-align:center}.vl-health.ok{background:#0E7A4F}.vl-health.warn{background:#C98A00}.vl-health.ko{background:#B42318}
.vl-stats{display:flex;gap:10px;flex-wrap:wrap}.vl-stats>div{background:#fff;border:1px solid #E3EBEA;border-radius:14px;padding:10px 14px;min-width:100px}.vl-stats b{display:block;font-size:22px;color:#0F3D3E}.vl-stats span{font-size:12px;color:#6B7B7B}.vl-stats .ko b{color:#B42318}.vl-stats .warn b{color:#B76E00}
.vl-srch{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E3EBEA;border-radius:14px;padding:0 12px}.vl-srch .in{border:0;box-shadow:none;flex:1}
.vl-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.vl-cats button{border:1px solid #DCE5E4;background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}.vl-cats button span{color:#8A9999;margin-left:4px}.vl-cats button.on{background:#0F3D3E;border-color:#0F3D3E;color:#fff}.vl-cats button.on span{color:#CFE3E1}.vl-cats button.w{border-color:#F3C77A}
.vl-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:12px}
.vl-it{display:flex;gap:12px;background:#fff;border:1px solid #E3EBEA;border-radius:14px;padding:14px;align-items:flex-start;transition:box-shadow .15s}.vl-it:hover{box-shadow:0 10px 26px -10px rgba(15,61,62,.25)}
.vl-av{width:40px;height:40px;border-radius:12px;background:#F2F7F7;display:grid;place-items:center;font-size:20px;flex:none}.vl-main{flex:1;min-width:0}
.vl-t{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px}.vl-t b{font-size:14.5px;color:#13262A}
.vl-row{display:flex;align-items:center;gap:6px;font-size:13px;margin:3px 0;min-width:0}.vl-row .k{width:92px;color:#8A9999;font-size:12px;flex:none}.vl-row .v{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vl-row a{color:#13585A;font-weight:600;text-decoration:none}
.vl-b{border:0;background:#F2F5F5;border-radius:7px;width:26px;height:26px;cursor:pointer;font-size:13px;flex:none}.vl-b:hover{background:#E3EEEC}
.vl-sc{display:inline-flex;gap:2px;margin-left:4px}.vl-sc i{width:8px;height:5px;border-radius:2px;background:#E3E9E9}.vl-sc.s1 i:nth-child(-n+1){background:#D92D20}.vl-sc.s2 i:nth-child(-n+2){background:#F5B700}.vl-sc.s3 i:nth-child(-n+3){background:#13A36B}.vl-sc.s4 i{background:#0E7A4F}
.vl-act{display:flex;flex-direction:column;align-items:flex-end;gap:6px}.vl-act small{font-size:11px;white-space:nowrap}
.vl-sugg{display:flex;flex-wrap:wrap;gap:8px}.vl-sugg button{border:1px dashed #BFD3D0;background:#FAFCFC;border-radius:12px;padding:10px 14px;font:inherit;font-size:13.5px;cursor:pointer}.vl-sugg button:hover{border-style:solid;border-color:#13585A}
.vl-gen{font-size:20px;background:#0F3D3E;color:#F5B700;padding:14px;border-radius:12px;word-break:break-all;margin-bottom:10px;text-align:center}
.vl-foot{margin-top:16px;text-align:center}.vl-foot a{color:#13585A}
@media (max-width:760px){.vl-list{grid-template-columns:1fr}.vl-row .k{width:80px}}`; document.head.appendChild(st); })();

/* ---------- branchement dans Contacts ---------- */
(function () { const n = NAV2.find(x => x[0] === "contacts"); if (!n) return; if (!n[2].includes("vault")) n[2].push("vault"); const sub = Array.isArray(n[3]) ? n[3] : (n[3] = [["tiers", "Fiches clients et fournisseurs"]]); if (!sub.some(s => s[0] === "vault")) sub.push(["vault", "Mots de passe"]);
  if (typeof IC !== "undefined" && !IC.vault) IC.vault = IC.lock || IC.contacts; })();
/* garde : actions du coffre inopérantes s'il est verrouillé */
["vlEdit", "vlSave", "vlDel", "vlCopy", "vlShow", "vlChangeGo", "vlCsv", "vlMGen", "vlMShow"].forEach(k => { const f = F2ACT[k]; F2ACT[k] = function () { if (!vltOpen()) { closeModal && UI.modal && /^vl/.test(UI.modal.type) && closeModal(); toast("Coffre-fort verrouillé."); render(); return; } return f.apply(this, arguments); }; });
