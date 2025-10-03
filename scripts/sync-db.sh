#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
ENV_FILE="$ROOT_DIR/.env"
DEFAULT_DATABASE_URL="postgresql://Bear_translate:Bear_translate@pgm-uf60twss3ymh9bv4qo.pg.rds.aliyuncs.com:5432/bear_dict?schema=public"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
if [[ -z "$DATABASE_URL" ]]; then
  echo "未检测到 DATABASE_URL，请在 .env 中配置后重试。" >&2
  exit 1
fi

extract_db_host() {
  local url="$1"
  local without_scheme="${url#*//}"
  local after_auth="${without_scheme#*@}"
  if [[ "$without_scheme" == "$after_auth" ]]; then
    after_auth="$without_scheme"
  fi
  echo "${after_auth%%[:/?]*}"
}

is_local_host() {
  case "$1" in
    localhost|127.0.0.1|0.0.0.0|"host.docker.internal")
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

DB_HOST="$(extract_db_host "$DATABASE_URL")"
MODE="${DB_SYNC_MODE:-migrate}"
RUN_SEED="${RUN_DB_SEED:-0}"

cd "$ROOT_DIR"

echo "📦 数据库同步脚本"
echo "  - 模式: $MODE"
echo "  - Host: $DB_HOST"

declare -a prisma_command
case "$MODE" in
  migrate)
    prisma_command=(npx prisma migrate deploy)
    ;;
  push)
    prisma_command=(npx prisma db push)
    ;;
  *)
    echo "不支持的 DB_SYNC_MODE: $MODE (允许: migrate|push)" >&2
    exit 1
    ;;
 esac

if ! is_local_host "$DB_HOST"; then
  if [[ "${FORCE_REMOTE_DB_SYNC:-0}" != "1" ]]; then
    cat <<EOF
⚠️ 检测到远程数据库 (host=$DB_HOST)。为避免误操作，请显式设置：
  FORCE_REMOTE_DB_SYNC=1 ${MODE^^} 用于确认同步。
示例： FORCE_REMOTE_DB_SYNC=1 DB_SYNC_MODE=$MODE npm run db:sync
EOF
    exit 1
  fi

  echo "✅ 已确认远程数据库同步。"
fi

# shellcheck disable=SC2068
${prisma_command[@]}

echo "✅ Prisma schema 同步完成"

if [[ "$RUN_SEED" == "1" ]]; then
  echo "🌱 执行 Prisma seed..."
  npx prisma db seed
  echo "✅ Seed 完成"
else
  echo "ℹ️ 跳过 Prisma seed (设置 RUN_DB_SEED=1 可启用)"
fi
