/* ============================================================
   Dossiers rédigés : vues et onglets dans chaque module
   ============================================================ */
const RDX_VIEWS = [["rdxEval", "eval", "finance", "📘 Rapport d'évaluation", "fin", "finEval"], ["rdxCns", "cns", "finance", "📘 Rapport de conseil", "cnsd", "cnsPlan"], ["rdxCdg", "cdg", "cdg", "📘 Rapport de gestion", "cdg", null], ["rdxPp", "pp", "pp", "📘 Bilan et préconisations", "ppSt", "ppStab"], ["rdxPat", "pat", "pat", "📘 Bilan patrimonial rédigé", "pat", null]];
RDX_VIEWS.forEach(([v, m, nav, lab, sp, after]) => { if (!RDX[m]) return; VIEWS[v] = () => rdxView(m); rdxNav(nav, v, lab, sp, after); });
