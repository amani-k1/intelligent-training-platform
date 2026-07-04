#!/bin/bash
# Sauvegarde automatique PostgreSQL — BRN SMART
# Lancer manuellement : bash scripts/backup_postgres.sh
# Automatique (cron) : 0 2 * * * /chemin/vers/backup_postgres.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M)
FILENAME="brnsmart_backup_${DATE}.sql"
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "🔄 Sauvegarde PostgreSQL en cours..."

docker compose exec -T db pg_dump \
  -U "${POSTGRES_USER:-postgres}" \
  "${POSTGRES_DB:-ma_formation}" \
  > "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
  gzip "${BACKUP_DIR}/${FILENAME}"
  echo "✅ Sauvegarde créée : ${BACKUP_DIR}/${FILENAME}.gz"
else
  echo "❌ Erreur lors de la sauvegarde"
  exit 1
fi

# Supprimer les sauvegardes de plus de 30 jours
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${KEEP_DAYS} -delete
echo "🧹 Anciennes sauvegardes supprimées (> ${KEEP_DAYS} jours)"
echo "📦 Sauvegardes disponibles :"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  (aucune)"
