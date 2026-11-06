/* Mode secours : indépendant du reste du code. Si le logiciel ne démarre plus après une modification,
   le propriétaire peut restaurer les fichiers d'avant la dernière publication. */
(function () {
  var started = Date.now();
  async function backups() {
    var db = await window.claude.use("db"); if (!db) return [];
    var q = await db.collection("src_history").get(); return q.docs.map(function (d) { return d.data(); }).sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
  }
  function el(h) { var d = document.createElement("div"); d.innerHTML = h; return d.firstElementChild; }
  window.SC_RESCUE = async function (force) {
    if (document.getElementById("scRescue")) return;
    var box = el('<div id="scRescue" style="position:fixed;inset:auto 16px 16px 16px;max-width:720px;margin:auto;background:#fff;border:2px solid #D97706;border-radius:12px;padding:18px;font:14px system-ui,sans-serif;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,.2);max-height:70vh;overflow:auto"><b style="font-size:16px">Mode secours</b><p style="margin:6px 0">Le logiciel ne s\'est pas affiché correctement. Si une modification récente du code en est la cause, restaurez la version précédente des fichiers.</p><div id="scRList">Recherche des copies de sécurité…</div><div style="margin-top:10px"><button id="scRClose" style="padding:6px 12px">Fermer</button></div></div>');
    document.body.appendChild(box); box.querySelector("#scRClose").onclick = function () { box.remove(); };
    var list = box.querySelector("#scRList");
    try {
      if (!window.claude || !window.claude.use) throw new Error("indisponible dans cette vue");
      var user = await window.claude.use("user"); if (!(user && user.isOwner && user.isOwner()) && !force) { list.textContent = "Contactez l'administrateur du logiciel."; return; }
      var B = await backups(); if (!B.length) { list.textContent = "Aucune copie de sécurité enregistrée."; return; }
      var byTs = {}; B.forEach(function (b) { (byTs[b.ts] = byTs[b.ts] || []).push(b); });
      list.innerHTML = ""; Object.keys(byTs).sort().reverse().slice(0, 12).forEach(function (ts) {
        var row = el('<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;border-top:1px solid #eee;padding:8px 0"><span>Avant la publication du ' + new Date(ts).toLocaleString("fr-FR") + ' : <code>' + byTs[ts].map(function (b) { return b.path; }).join(", ") + '</code></span><button style="padding:6px 12px;background:#2563EB;color:#fff;border:0;border-radius:6px">Restaurer</button></div>');
        row.querySelector("button").onclick = async function () {
          this.disabled = true; this.textContent = "Restauration…";
          try { var art = await window.claude.use("artifact"); var files = {}; byTs[ts].forEach(function (b) { files[b.path] = b.content; }); await art.publish(files); this.textContent = "Restauré : rechargement…"; setTimeout(function () { location.reload(); }, 1200); }
          catch (e) { this.textContent = "Échec : " + ((e && (e.code || e.message)) || e); }
        };
        list.appendChild(row);
      });
    } catch (e) { list.textContent = "Mode secours indisponible : " + ((e && e.message) || e); }
  };
  // Démarrage raté : rien d'affiché au bout de 25 s, ou erreur avant que le logiciel ne soit prêt
  setTimeout(function () { var a = document.getElementById("app"); if (!window.__SC_READY && a && !a.querySelector(".side,.sb,nav")) window.SC_RESCUE(); }, 25000);
  window.addEventListener("error", function () { if (!window.__SC_READY && Date.now() - started > 3000) setTimeout(function () { if (!window.__SC_READY) window.SC_RESCUE(); }, 4000); });
})();
