#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

DEFAULT_DATABASE_URL="postgresql://Bear_translate:Bear_translate@pgm-uf60twss3ymh9bv4qo.pg.rds.aliyuncs.com:5432/bear_dict?schema=public"
LOCAL_DB_USER="dict_admin"

ensure_docker() {
  if [[ ${DOCKER_AVAILABLE:-0} -eq 1 ]]; then
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker 未安装或未添加到 PATH，请先安装 Docker Desktop。" >&2
    exit 1
  fi

  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker-compose)
  else
    echo "无法找到 docker compose 命令，请安装 Docker Compose v2。" >&2
    exit 1
  fi

  DOCKER_AVAILABLE=1
}

pg_ready() {
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" exec -T db pg_isready -U "$LOCAL_DB_USER" >/dev/null 2>&1
}

extract_db_host() {
  local url="$1"
  local without_scheme="${url#*//}"
  local after_auth="${without_scheme#*@}"
  if [[ "$without_scheme" == "$after_auth" ]]; then
    after_auth="$without_scheme"
  fi
  echo "${after_auth%%[:/?]*}"
}

if [[ -f "$ENV_FILE" ]]; then
  echo "✓ .env 文件已存在，跳过生成"
else
  cat >"$ENV_FILE" <<EOF
# 自动生成的本地开发环境变量
NODE_ENV=development
DATABASE_URL="$DEFAULT_DATABASE_URL"
EOF
  echo "✓ 已创建 .env 文件"
fi

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
export DATABASE_URL

DB_HOST="$(extract_db_host "$DATABASE_URL")"

case "$DB_HOST" in
  localhost|127.0.0.1|0.0.0.0|"host.docker.internal")
    USE_LOCAL_DB=1
    ;;
  *)
    USE_LOCAL_DB=0
    ;;
esac

if [[ "$USE_LOCAL_DB" -eq 1 ]]; then
  ensure_docker
  echo "启动 Postgres（Docker Compose）..."
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" up -d

  echo "等待 Postgres 就绪..."
  until pg_ready; do
    sleep 1
    echo "  数据库尚未就绪，继续等待..."
  done

  echo "Postgres 已就绪，推送 Prisma schema..."
  cd "$ROOT_DIR"
  npx prisma db push

  if [[ "${ENABLE_SEED:-0}" == "1" ]]; then
    echo "执行数据库种子数据..."
    npx prisma db seed
  else
    echo "跳过种子数据 (设置 ENABLE_SEED=1 启用)"
  fi
else
  echo "检测到远程数据库 ($DB_HOST)，跳过本地 Docker Postgres。"
  echo "为避免意外修改线上数据，已跳过 prisma db push 与 seed。"
  echo "如需在远程数据库上应用最新 Schema，请运行：FORCE_REMOTE_DB_SYNC=1 npm run db:sync"
  cd "$ROOT_DIR"
fi

echo "生成 Prisma Client..."
npx prisma generate

echo "启动 Next.js 开发服务器..."
npm run dev:next
