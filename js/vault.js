/* ============================================================
   Contacts › Mots de passe : liste des accès de la société
   (impôts, URSSAF, banque, fournisseurs, plateformes, personnels…)
   - liste directe : ajout, modification, recherche, catégories, copie, affichage masqué
   - générateur, indicateur de robustesse, mots de passe faibles, réutilisés ou anciens
   - enregistrée avec la société (mêmes accès que ses autres données), export Excel
   ============================================================ */
const VLT_CAT = [["impots", "Impôts", "🏛"], ["social", "URSSAF et social", "🛡"], ["banque", "Banque", "🏦"], ["fourn", "Fournisseurs", "📦"], ["plateforme", "Plateformes et clients", "🌐"], ["admin", "Administratif", "📋"], ["perso", "Personnel", "👤"], ["autre", "Autre", "🔑"]];
const VLT_SUGG = [["Espace professionnel impots.gouv", "impots", "https://cfspro.impots.gouv.fr"], ["Net-entreprises (DSN)", "social", "https://www.net-entreprises.fr"], ["URSSAF", "social", "https://www.urssaf.fr"], ["Guichet unique INPI", "admin", "https://procedures.inpi.fr"], ["Banque en ligne", "banque", ""], ["Plateforme agréée (factures)", "plateforme", ""], ["Chorus Pro", "plateforme", "https://chorus-pro.gouv.fr"], ["Espace personnel impots.gouv", "perso", "https://www.impots.gouv.fr"]];
function vltScore(pw) { pw = String(pw || ""); if (!pw) return 0; let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^\w]/.test(pw)) pool += 30; let bits = pw.length * Math.log2(Math.max(pool, 2));
  if (/^(.)\1+$/.test(pw) || /(password|motdepasse|azerty|qwerty|123456|admin)/i.test(pw)) bits = Math.min(bits, 20); return bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4; }
const VLT_SC = [["", ""], ["Faible", "ko"], ["Moyen", "warn"], ["Bon", "ok"], ["Excellent", "ok"]];
function vltGen(o) { o = Object.assign({ n: 20, up: true, dig: true, sym: true }, o || {}); let cs = "abcdefghijkmnopqrstuvwxyz"; if (o.up) cs += "ABCDEFGHJKLMNPQRSTUVWXYZ"; if (o.dig) cs += "23456789"; if (o.sym) cs += "!#$%&*+-=?@_"; const r = crypto.getRandomValues(new Uint32Array(o.n)); let s = ""; for (let i = 0; i < o.n; i++) s += cs[r[i] % cs.length]; return s; }

const vlL = () => (S.mdp ||= []);
function vltHealth() { const L = vlL(); const cnt = {}; L.forEach(x => { if (x.pw) cnt[x.pw] = (cnt[x.pw] || 0) + 1; }); const yr = Date.now() - 365 * 864e5;
  const weak = L.filter(x => x.pw && vltScore(x.pw) <= 1), reu = L.filter(x => x.pw && cnt[x.pw] > 1), old = L.filter(x => x.maj && new Date(x.maj).getTime() < yr); return { weak, reu, old }; }

VIEWS.vault = () => { const U = (UI.sub.vlt ||= {}); const L0 = vlL(); const H = vltHealth(); const q = (U.q || "").toLowerCase(); const cat = U.cat || "";
  const L = L0.filter(x => (!cat || (cat === "!" ? (H.weak.includes(x) || H.reu.includes(x) || H.old.includes(x)) : x.cat === cat)) && (!q || [x.titre, x.login, x.url, x.notes].join(" ").toLowerCase().includes(q))).sort((a, b) => (a.titre || "").localeCompare(b.titre || ""));
  const catN = k => L0.filter(x => x.cat === k).length; const nW = new Set(H.weak.concat(H.reu, H.old)).size;
  return `<div class="pg-h"><div><div class="eyebrow">Contacts · ${esc(S.nom)}</div><h1>Mots de passe</h1><p class="lead">Tous les accès de la société au même endroit : impôts, URSSAF, banque, fournisseurs, plateformes et accès personnels.</p></div>
    <div class="row"><button class="btn" data-act="vlGenOpen">⚄ Générer un mot de passe</button>${L0.length ? `<button class="btn" data-act="vlXls">⇩ Excel</button>` : ""}<button class="btn pri" data-act="vlNew">＋ Ajouter un accès</button></div></div>
  <div class="vl-top"><div class="vl-stats"><div><b>${L0.length}</b><span>accès</span></div><div class="${H.weak.length ? "ko" : ""}"><b>${H.weak.length}</b><span>faibles</span></div><div class="${H.reu.length ? "warn" : ""}"><b>${H.reu.length}</b><span>réutilisés</span></div><div class="${H.old.length ? "warn" : ""}"><b>${H.old.length}</b><span>de plus d'un an</span></div></div>
    <div class="vl-srch">🔍<input class="in" placeholder="Rechercher un accès, un identifiant, un site…" value="${esc(U.q || "")}" data-in="vlQ" id="vlQ"></div></div>
  <div class="vl-cats"><button class="${!cat ? "on" : ""}" data-act="vlCat" data-k="">Tous <span>${L0.length}</span></button>${VLT_CAT.map(([k, l, i]) => catN(k) ? `<button class="${cat === k ? "on" : ""}" data-act="vlCat" data-k="${k}">${i} ${l} <span>${catN(k)}</span></button>` : "").join("")}${nW ? `<button class="${cat === "!" ? "on" : ""} w" data-act="vlCat" data-k="!">⚠ À renforcer <span>${nW}</span></button>` : ""}</div>
  ${L0.length ? `<section class="card"><div class="tw"><table class="t vl-t"><thead><tr><th>Accès</th><th>Identifiant</th><th>Mot de passe</th><th>Site</th><th>Notes</th><th class="r">Modifié</th><th></th></tr></thead><tbody>${L.map(x => { const c = VLT_CAT.find(c => c[0] === x.cat) || VLT_CAT[7]; const sc = vltScore(x.pw); const show = (U.show || []).includes(x.id);
      const flags = [H.weak.includes(x) ? '<span class="pill ko">Faible</span>' : "", H.reu.includes(x) ? '<span class="pill warn">Réutilisé</span>' : "", H.old.includes(x) ? '<span class="pill warn">À changer</span>' : ""].join(" ");
      return `<tr><td><div class="vl-n"><span class="vl-av">${c[2]}</span><div><b>${esc(x.titre || "Sans titre")}</b><small>${esc(c[1])} ${flags}</small></div></div></td>
        <td><span class="mono">${esc(x.login || "")}</span>${x.login ? ` <button class="vl-b" data-act="vlCopy" data-id="${x.id}" data-f="login" title="Copier l'identifiant">⧉</button>` : ""}</td>
        <td class="nowrap">${x.pw ? `<span class="mono">${show ? esc(x.pw) : "••••••••••"}</span> <button class="vl-b" data-act="vlShow" data-id="${x.id}" title="${show ? "Masquer" : "Afficher"}">${show ? "🙈" : "👁"}</button><button class="vl-b" data-act="vlCopy" data-id="${x.id}" data-f="pw" title="Copier le mot de passe">⧉</button><span class="vl-sc s${sc}" title="Robustesse : ${VLT_SC[sc][0]}"><i></i><i></i><i></i><i></i></span>` : '<span class="muted">—</span>'}</td>
        <td>${x.url ? `<a href="${esc(/^https?:/.test(x.url) ? x.url : "https://" + x.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(x.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : ""}</td>
        <td class="small muted vl-no">${esc(x.notes || "")}</td><td class="r small muted">${x.maj ? frDate(x.maj.slice(0, 10)) : ""}</td>
        <td class="r nowrap"><button class="btn sm" data-act="vlEdit" data-id="${x.id}">Modifier</button></td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Aucun accès ne correspond.</td></tr>`}</tbody></table></div></section>`
    : `<section class="card"><div class="card-b"><h3 style="margin-top:0">Ajoutez les accès de la société</h3><p class="muted">Cliquez sur un accès courant pour le préremplir, ou sur « Ajouter un accès ».</p><div class="vl-sugg">${VLT_SUGG.map(([t, c, u], i) => `<button data-act="vlSugg" data-i="${i}">${(VLT_CAT.find(x => x[0] === c) || [])[2]} ${esc(t)}</button>`).join("")}</div></div></section>`}
  <div class="vl-foot small muted">Les mots de passe sont masqués à l'écran et la copie est effacée du presse-papiers après 30 secondes. Ils sont enregistrés avec la société et visibles par les personnes qui y ont accès.</div>`; };

const _rmVlt = renderModal;
renderModal = function () { const M = UI.modal; if (!M || !/^vl/.test(M.type)) return _rmVlt.apply(this, arguments);
  if (M.type === "vlGen") { const o = M.o ||= { n: 16, up: true, dig: true, sym: true }; M.pw ||= vltGen(o); const sc = vltScore(M.pw);
    return `<div class="modal-bg"><div class="modal" style="max-width:480px"><div class="modal-h"><h3>Générateur de mot de passe</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-b">
      <div class="vl-gen mono">${esc(M.pw)}</div><div class="vl-meter"><i class="s${sc}" style="width:${sc * 25}%"></i></div><p class="small muted" style="margin:4px 0 12px">Robustesse : <b>${VLT_SC[sc][0]}</b></p>
      <label class="f">Longueur : <b>${o.n}</b><input type="range" min="8" max="40" value="${o.n}" data-ch="vlGenO" data-f="n"></label>
      <div class="row" style="gap:14px;flex-wrap:wrap">${[["up", "Majuscules"], ["dig", "Chiffres"], ["sym", "Symboles"]].map(([k, l]) => `<label class="chk"><input type="checkbox" data-ch="vlGenO" data-f="${k}" ${o[k] ? "checked" : ""}> ${l}</label>`).join("")}</div></div>
      <div class="modal-f"><button class="btn" data-act="vlGenNew">↻ Autre</button>${M.back ? `<button class="btn pri" data-act="vlGenUse">Utiliser</button>` : `<button class="btn pri" data-act="vlGenCopy">⧉ Copier</button>`}</div></div></div>`; }
  const d = M.d; const sc = vltScore(d.pw);
  return `<div class="modal-bg"><div class="modal" style="max-width:560px"><div class="modal-h"><h3>${M.id ? "Modifier l'accès" : "Nouvel accès"}</h3><button class="x" data-act="closeModal" aria-label="Fermer">×</button></div><div class="modal-b">
    <div class="grid g2"><label class="f">Nom de l'accès<input class="in" data-in="vlF" data-f="titre" value="${esc(d.titre || "")}" placeholder="Ex. Espace professionnel impots.gouv"></label>
    <label class="f">Catégorie<select class="in" data-ch="vlF" data-f="cat">${VLT_CAT.map(([k, l, i]) => `<option value="${k}" ${d.cat === k ? "selected" : ""}>${i} ${l}</option>`).join("")}</select></label></div>
    <label class="f">Identifiant / e-mail / n° client<input class="in" data-in="vlF" data-f="login" value="${esc(d.login || "")}" autocomplete="off"></label>
    <label class="f">Mot de passe<div class="row" style="gap:6px"><input class="in mono" style="flex:1" type="${M.show ? "text" : "password"}" data-in="vlF" data-f="pw" value="${esc(d.pw || "")}" autocomplete="new-password"><button class="btn sm" data-act="vlMShow" title="Afficher / masquer">${M.show ? "🙈" : "👁"}</button><button class="btn sm" data-act="vlMGen" title="Générer">⚄</button></div></label>
    <div class="vl-meter"><i id="vlMM" class="s${sc}" style="width:${sc * 25}%"></i></div><p class="small muted" id="vlMML" style="margin:4px 0 8px">${d.pw ? "Robustesse : " + VLT_SC[sc][0] : ""}</p>
    <label class="f">Adresse du site<input class="in" data-in="vlF" data-f="url" value="${esc(d.url || "")}" placeholder="https://"></label>
    <label class="f">Notes<textarea class="in" rows="3" data-in="vlF" data-f="notes">${esc(d.notes || "")}</textarea></label></div>
    <div class="modal-f">${M.id ? `<button class="btn ghost" data-act="vlDel" style="margin-right:auto;color:#B42318">Supprimer</button>` : ""}<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="vlSave">Enregistrer</button></div></div></div>`; };

let vlClipT = null;
async function vlCopy(txt, lib) { try { await navigator.clipboard.writeText(txt); toast(lib + " copié (effacé du presse-papiers dans 30 s)"); clearTimeout(vlClipT); vlClipT = setTimeout(() => { try { navigator.clipboard.writeText(""); } catch (e) { } }, 30000); }
  catch (e) { const t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); toast(lib + " copié"); } catch (x) { toast("Copie impossible : sélectionnez et copiez manuellement."); } t.remove(); } }
Object.assign(F2ACT, {
  vlNew: () => { const c = (UI.sub.vlt || {}).cat; openModal({ type: "vlEdit", d: { cat: c && c !== "!" ? c : "autre" } }); },
  vlSugg: el => { const [t, c, u] = VLT_SUGG[+el.dataset.i]; openModal({ type: "vlEdit", d: { titre: t, cat: c, url: u } }); },
  vlEdit: el => { const x = vlL().find(y => y.id === el.dataset.id); if (x) openModal({ type: "vlEdit", id: x.id, d: Object.assign({}, x) }); },
  vlMShow: () => { UI.modal.show = !UI.modal.show; render(); },
  vlMGen: () => { const M = UI.modal; openModal({ type: "vlGen", back: { type: M.type, id: M.id, d: M.d } }); },
  vlGenOpen: () => openModal({ type: "vlGen" }),
  vlGenNew: () => { UI.modal.pw = vltGen(UI.modal.o); render(); },
  vlGenCopy: () => vlCopy(UI.modal.pw, "Mot de passe"),
  vlGenUse: () => { const M = UI.modal; const b = M.back; b.d.pw = M.pw; b.show = true; UI.modal = b; render(); },
  vlSave: () => { const M = UI.modal; const d = M.d; if (!String(d.titre || "").trim()) { toast("Donnez un nom à cet accès (ex. « impots.gouv »)."); return; } const now = new Date().toISOString(); const L = vlL();
    if (M.id) { const x = L.find(y => y.id === M.id); if (x) Object.assign(x, d, { maj: x.pw !== d.pw ? now : (x.maj || now) }); } else L.push(Object.assign({ id: uid(), maj: now }, d));
    Store.touch(); try { saveAll(); } catch (e) { } closeModal(); toast("Accès enregistré."); render(); },
  vlDel: () => { if (!confirm("Supprimer cet accès ?")) return; S.mdp = vlL().filter(x => x.id !== UI.modal.id); Store.touch(); closeModal(); render(); },
  vlShow: el => { const U = UI.sub.vlt ||= {}; const s = new Set(U.show || []); s.has(el.dataset.id) ? s.delete(el.dataset.id) : s.add(el.dataset.id); U.show = [...s]; render(); },
  vlCopy: el => { const x = vlL().find(y => y.id === el.dataset.id); if (x) vlCopy(x[el.dataset.f] || "", el.dataset.f === "pw" ? "Mot de passe" : "Identifiant"); },
  vlCat: el => { (UI.sub.vlt ||= {}).cat = el.dataset.k; render(); },
  vlXls: () => { try { deliverFile("Mots_de_passe_" + (S.nom || "").replace(/\W+/g, "_") + ".xlsx", buildXLSX([{ name: "Mots de passe", widths: [34, 22, 30, 26, 40, 40], rows: [{ style: "title", cells: ["Mots de passe · " + S.nom] }, { style: "head", cells: ["Accès", "Catégorie", "Identifiant", "Mot de passe", "Site", "Notes"] }].concat(vlL().map(x => ({ cells: [x.titre || "", (VLT_CAT.find(c => c[0] === x.cat) || [])[1] || "", x.login || "", x.pw || "", x.url || "", x.notes || ""] }))) }]), "xlsx"); } catch (e) { toast("Export impossible : " + (e.message || e)); } }
});
Object.assign(F2CHG, {
  vlF: el => { if (UI.modal && UI.modal.d) UI.modal.d[el.dataset.f] = el.value; },
  vlGenO: el => { const o = UI.modal.o; o[el.dataset.f] = el.type === "checkbox" ? el.checked : +el.value; UI.modal.pw = vltGen(o); render(); }
});
/* saisie en direct (sans attendre la sortie du champ) */
document.addEventListener("input", e => { const t = e.target; if (!t || !t.dataset) return;
  if (t.dataset.in === "vlF" && UI.modal && UI.modal.d) { UI.modal.d[t.dataset.f] = t.value; if (t.dataset.f === "pw") { const s = vltScore(t.value); const m = $("#vlMM"), l = $("#vlMML"); if (m) { m.className = "s" + s; m.style.width = s * 25 + "%"; } if (l) l.textContent = t.value ? "Robustesse : " + VLT_SC[s][0] : ""; } }
  if (t.dataset.in === "vlQ") { (UI.sub.vlt ||= {}).q = t.value; const pos = t.selectionStart; render(); const n = $("#vlQ"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { } } } });

(function () { const st = document.createElement("style"); st.textContent = `
.vl-meter{height:6px;background:#EEF2F2;border-radius:99px;overflow:hidden}.vl-meter i{display:block;height:100%;width:0;transition:width .2s,background .2s}.vl-meter i.s1{background:#D92D20}.vl-meter i.s2{background:#F5B700}.vl-meter i.s3{background:#13A36B}.vl-meter i.s4{background:#0E7A4F}
.vl-top{display:flex;gap:14px;align-items:stretch;flex-wrap:wrap;margin-bottom:12px}
.vl-stats{display:flex;gap:10px;flex-wrap:wrap}.vl-stats>div{background:#fff;border:1px solid #E3EBEA;border-radius:14px;padding:10px 14px;min-width:96px}.vl-stats b{display:block;font-size:22px;color:#0F3D3E}.vl-stats span{font-size:12px;color:#6B7B7B}.vl-stats .ko b{color:#B42318}.vl-stats .warn b{color:#B76E00}
.vl-srch{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E3EBEA;border-radius:14px;padding:0 12px}.vl-srch .in{border:0;box-shadow:none;flex:1}
.vl-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.vl-cats button{border:1px solid #DCE5E4;background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}.vl-cats button span{color:#8A9999;margin-left:4px}.vl-cats button.on{background:#0F3D3E;border-color:#0F3D3E;color:#fff}.vl-cats button.on span{color:#CFE3E1}.vl-cats button.w{border-color:#F3C77A}
.vl-t td{vertical-align:middle}.vl-n{display:flex;gap:10px;align-items:center}.vl-n b{display:block;font-size:14px}.vl-n small{display:block;font-size:12px;color:#6B7B7B}
.vl-av{width:34px;height:34px;border-radius:10px;background:#F2F7F7;display:grid;place-items:center;font-size:17px;flex:none}
.vl-t a{color:#13585A;font-weight:600;text-decoration:none}.vl-no{max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nowrap{white-space:nowrap}
.vl-b{border:0;background:#F2F5F5;border-radius:7px;width:26px;height:26px;cursor:pointer;font-size:13px;vertical-align:middle}.vl-b:hover{background:#E3EEEC}
.vl-sc{display:inline-flex;gap:2px;margin-left:6px;vertical-align:middle}.vl-sc i{width:8px;height:5px;border-radius:2px;background:#E3E9E9}.vl-sc.s1 i:nth-child(-n+1){background:#D92D20}.vl-sc.s2 i:nth-child(-n+2){background:#F5B700}.vl-sc.s3 i:nth-child(-n+3){background:#13A36B}.vl-sc.s4 i{background:#0E7A4F}
.vl-sugg{display:flex;flex-wrap:wrap;gap:8px}.vl-sugg button{border:1px dashed #BFD3D0;background:#FAFCFC;border-radius:12px;padding:10px 14px;font:inherit;font-size:13.5px;cursor:pointer}.vl-sugg button:hover{border-style:solid;border-color:#13585A}
.vl-gen{font-size:20px;background:#0F3D3E;color:#F5B700;padding:14px;border-radius:12px;word-break:break-all;margin-bottom:10px;text-align:center}
.vl-foot{margin-top:14px;text-align:center}`; document.head.appendChild(st); })();

(function () { const n = NAV2.find(x => x[0] === "contacts"); if (!n) return; if (!n[2].includes("vault")) n[2].push("vault"); const sub = Array.isArray(n[3]) ? n[3] : (n[3] = [["tiers", "Fiches clients et fournisseurs"]]); if (!sub.some(s => s[0] === "vault")) sub.push(["vault", "Mots de passe"]); })();
