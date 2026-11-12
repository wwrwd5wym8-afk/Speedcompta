#!/usr/bin/env bash
# Speedix – restauration d'une sauvegarde de la base (mode complet).  Usage : restaurer.sh /var/backups/speedix/base-AAAA-MM-JJ_HHMM.sql.gz.enc
set -euo pipefail
F="${1:-}"; [ -f "$F" ] || { echo "Indiquez le fichier à restaurer (ls /var/backups/speedix)"; exit 1; }
read -r -p "La base actuelle sera remplacée par $F. Taper OUI pour confirmer : " R; [ "$R" = "OUI" ] || exit 1
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:/root/.speedix-backup.key -in "$F" | gunzip | docker exec -i supabase-db psql -q -U postgres -d postgres
echo "Restauration terminée."
