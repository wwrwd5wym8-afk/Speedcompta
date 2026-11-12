#!/usr/bin/env bash
# Speedix – sauvegarde chiffrée (AES-256) de la base (mode complet) et de la configuration.
set -euo pipefail
D=/opt/speedix; . $D/speedix.conf; K=/root/.speedix-backup.key; B=/var/backups/speedix; T=$(date +%Y-%m-%d_%H%M); mkdir -p $B
enc() { openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:$K; }
tar -C $D -czf - speedix.conf Caddyfile docker-compose.yml config $( [ -f $D/supabase/.env ] && echo supabase/.env ) | enc > $B/config-$T.tgz.enc
if [ "${MODE:-app}" = "complet" ] && docker ps --format '{{.Names}}' | grep -q '^supabase-db$'; then
  docker exec supabase-db pg_dumpall -U postgres --clean --if-exists | gzip -9 | enc > $B/base-$T.sql.gz.enc
  [ -d $D/supabase/volumes/storage ] && tar -C $D/supabase/volumes -czf - storage | enc > $B/fichiers-$T.tgz.enc || true
fi
find $B -type f -name '*.enc' -mtime +30 -delete
# copie hors du serveur (facultatif) : configurez rclone avec un « remote » nommé speedix-externe
if command -v rclone >/dev/null && rclone listremotes 2>/dev/null | grep -q '^speedix-externe:'; then rclone copy $B speedix-externe:speedix-sauvegardes --max-age 2d -q; fi
echo "$(date -Is) sauvegarde OK ($(du -sh $B | cut -f1))"
