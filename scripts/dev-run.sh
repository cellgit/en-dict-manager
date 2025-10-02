#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

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

pg_ready() {
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" exec -T db pg_isready -U dict_admin >/dev/null 2>&1
}

DEFAULT_DATABASE_URL="postgresql://dict_admin:dict_admin@localhost:55432/en_dict_manager?schema=public"

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

export DATABASE_URL="$DEFAULT_DATABASE_URL"

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

echo "生成 Prisma Client..."
npx prisma generate

if [[ "${ENABLE_SEED:-0}" == "1" ]]; then
  echo "执行数据库种子数据..."
  npx prisma db seed
else
  echo "跳过种子数据 (设置 ENABLE_SEED=1 启用)"
fi

echo "启动 Next.js 开发服务器..."
npm run dev:next
