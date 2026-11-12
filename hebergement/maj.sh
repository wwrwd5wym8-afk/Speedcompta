#!/usr/bin/env bash
# Speedix – mise à jour du logiciel (fichiers de l'application uniquement ; la base n'est pas touchée).
set -euo pipefail
D=/opt/speedix; . $D/speedix.conf
A=$(git -C $D/app rev-parse HEAD); git -C $D/app fetch -q --depth 1 origin "${BRANCHE:-main}"; N=$(git -C $D/app rev-parse FETCH_HEAD)
[ "$A" = "$N" ] && exit 0
git -C $D/app reset -q --hard FETCH_HEAD
cp $D/app/hebergement/speedix /usr/local/bin/speedix 2>/dev/null && chmod +x /usr/local/bin/speedix || true
for f in sauvegarde.sh restaurer.sh maj.sh; do cp $D/app/hebergement/$f $D/bin/$f 2>/dev/null && chmod +x $D/bin/$f || true; done
echo "$(date -Is) mise à jour ${A:0:7} → ${N:0:7} (version $(cat $D/app/version.txt 2>/dev/null))"
