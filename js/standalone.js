/* ============================================================
   Version autonome de SpeedCompta (hors Claude) : application installable,
   données enregistrées sur l'appareil, mises à jour automatiques depuis le site.
   Ce fichier n'est chargé que dans la version autonome.
   ============================================================ */
window.SC_STANDALONE = true;
document.documentElement.classList.add("sc-sa");
/* téléchargements : directement par le navigateur (sur iPhone installé, via le menu Partager) */
const SA_DL = { save: async ({ filename, data }) => { const blob = data instanceof Blob ? data : new Blob([data]);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1); const inst = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (ios && inst && navigator.canShare) { try { const f = new File([blob], filename, { type: blob.type || "application/octet-stream" }); if (navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: filename }); return; } } catch (e) { if (e && e.name === "AbortError") { const er = new Error("declined"); er.code = "declined"; throw er; } } }
  const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = filename; a.rel = "noopener"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 4000); } };
/* chaque utilisateur est client de sa propre comptabilité : pas d'Espace éditeur, d'administration ni de studio */
const _loadAccessSA = loadAccess;
loadAccess = async function () { await _loadAccessSA.apply(this, arguments); Store.dl = SA_DL; UI.isOwner = false; UI.access = { role: "client", statut: "actif", offres: ["*"], standalone: true }; };
const _navVisibleSA = navVisible;
navVisible = k => k === "vente" ? false : _navVisibleSA(k);
/* l'assistant IA et les analyses par l'IA ont besoin de Claude */
if (typeof aiOK === "function") aiOK = () => false;
/* lien de l'application = adresse du site */
mobAppUrl = () => location.href.split("#")[0].split("?")[0];
mobLink = () => mobAppUrl();
/* sauvegarde : rappel tous les 7 jours (les données ne vivent que sur cet appareil) */
function saBackupDue() { try { const t = Number(localStorage.getItem("sc:lastBackup") || 0); return Date.now() - t > 7 * 864e5; } catch (e) { return false; } }
const _dashSA = VIEWS.dashboard;
VIEWS.dashboard = function () { const h = _dashSA.apply(this, arguments); if (!saBackupDue()) return h;
  const box = `<div class="banner sa-bk"><span>💾 Vos données sont enregistrées sur cet appareil. Pensez à faire une sauvegarde régulière (fichier à conserver ou à ouvrir sur un autre appareil).</span><button class="btn sm pri" data-act="saBackup">Sauvegarder maintenant</button><button class="btn sm ghost" data-act="saBackupLater">Plus tard</button></div>`;
  return box + h; };
Object.assign(LICACT, {
  saBackup: () => { try { localStorage.setItem("sc:lastBackup", String(Date.now())); } catch (e) { } if (ACT.backup) return ACT.backup({ dataset: {} }); if (ACT.saveDossier) return ACT.saveDossier({ dataset: {} }); toast("Utilisez Paramètres › Exporter une sauvegarde."); },
  saBackupLater: () => { try { localStorage.setItem("sc:lastBackup", String(Date.now() - 4 * 864e5)); } catch (e) { } render(); }
});
/* page « Application mobile » : la version autonome a déjà son icône */
const _mobSA = VIEWS.mobApp;
VIEWS.mobApp = function () { return _mobSA.apply(this, arguments).replace(/<section class="card"><div class="card-h"><h3>Avec l'icône[\s\S]*?<\/section>/, "").replace(/<section class="card"><div class="card-h"><h3>Modifications avec Claude[\s\S]*?<\/section>/,
  `<section class="card"><div class="card-h"><h3>Mises à jour et données</h3></div><div class="card-b small" style="line-height:1.65">${esc(mobNom())} se met à jour tout seul : chaque nouvelle version publiée est installée à l'ouverture suivante. Vos sociétés et écritures sont enregistrées <b>sur cet appareil</b> : pour les retrouver sur un autre téléphone ou ordinateur, faites une sauvegarde (Paramètres › Exporter une sauvegarde) puis restaurez-la sur l'autre appareil.</div></section>`); };
/* hors connexion et mises à jour : service worker */
(function () { if (!("serviceWorker" in navigator) || location.protocol !== "https:") return;
  let reloaded = false; navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloaded) return; reloaded = true; try { Store.flush && Store.flush(); } catch (e) { } setTimeout(() => location.reload(), 300); });
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").then(reg => { setInterval(() => reg.update().catch(() => { }), 30 * 60 * 1000); }).catch(() => { }); }); })();
