#!/usr/bin/env bash
# shell-helper/batch_clean.sh
#
# 批量清洗当前目录所有 JSON 文件
# 调用 fix_dict_json.sh 逐个处理文件
#
# 用法：
#   ./batch_clean.sh [目录路径]
#
#   不提供目录参数时，默认处理当前目录

set -euo pipefail

# 颜色输出（可选）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 统计变量
TOTAL_FILES=0
SUCCESS_COUNT=0
FAILED_COUNT=0

declare -a FAILED_FILES=()
declare -a SUCCESS_FILES=()

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEAN_SCRIPT="$SCRIPT_DIR/fix_dict_json.sh"

# 检查清洗脚本是否存在
if [[ ! -x "$CLEAN_SCRIPT" ]]; then
  echo -e "${RED}✖ 错误: 找不到清洗脚本: $CLEAN_SCRIPT${NC}" >&2
  echo "  请确保 fix_dict_json.sh 存在且有执行权限" >&2
  exit 1
fi

# 目标目录（默认当前目录）
TARGET_DIR="${1:-.}"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo -e "${RED}✖ 错误: 目录不存在: $TARGET_DIR${NC}" >&2
  exit 1
fi

cd "$TARGET_DIR" || exit 1

# 创建 cleaned 输出目录
CLEANED_DIR="./cleaned"
if [[ ! -d "$CLEANED_DIR" ]]; then
  mkdir -p "$CLEANED_DIR" || {
    echo -e "${RED}✖ 错误: 无法创建输出目录: $CLEANED_DIR${NC}" >&2
    exit 1
  }
  echo -e "${GREEN}✓ 已创建输出目录: $CLEANED_DIR${NC}"
fi

# 创建日志目录
LOG_DIR="./cleaned/logs"
mkdir -p "$LOG_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}批量 JSON 数据清洗工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "工作目录: $(pwd)"
echo "清洗脚本: $CLEAN_SCRIPT"
echo "输出目录: $CLEANED_DIR"
echo ""

# 查找所有 JSON 文件（排除 cleaned 目录、脚本自身和备份文件）
# 使用兼容的方式替代 mapfile
JSON_FILES=()
while IFS= read -r file; do
  JSON_FILES+=("$file")
done < <(find . -maxdepth 1 -type f -name "*.json" ! -path "./cleaned/*" ! -name "*_backup.json" ! -name "*_cleaned.json" | sort)

TOTAL_FILES=${#JSON_FILES[@]}

if [[ $TOTAL_FILES -eq 0 ]]; then
  echo -e "${YELLOW}⚠ 当前目录没有找到 .json 文件${NC}"
  exit 0
fi

echo -e "${BLUE}找到 $TOTAL_FILES 个 JSON 文件待处理${NC}"
echo ""

# 询问是否继续
read -p "是否开始批量清洗? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "已取消"
  exit 0
fi

echo ""
echo -e "${BLUE}开始批量清洗...${NC}"
echo ""

# 记录开始时间
START_TIME=$(date +%s)

# 逐个处理文件
for i in "${!JSON_FILES[@]}"; do
  file="${JSON_FILES[$i]}"
  filename=$(basename "$file")
  current=$((i + 1))

  printf "${BLUE}[%d/%d]${NC} 清洗 ${YELLOW}%s${NC}... " "$current" "$TOTAL_FILES" "$filename"

  # 创建临时备份
  backup_file="${file}.tmp_backup"
  cp "$file" "$backup_file"

  # 执行清洗（就地覆盖）
  error_log="$LOG_DIR/${filename}.error.log"
  if "$CLEAN_SCRIPT" -i "$file" > /dev/null 2>"$error_log"; then
    echo -e "${GREEN}✓${NC}"
    SUCCESS_FILES+=("$filename")
    ((SUCCESS_COUNT++))

    # 清洗成功，移动到 cleaned 目录
    mv "$file" "$CLEANED_DIR/" || {
      echo -e "  ${YELLOW}警告: 无法移动到 cleaned 目录${NC}" >&2
    }

    # 删除备份和错误日志
    rm -f "$backup_file" "$error_log"
  else
    echo -e "${RED}✖${NC} (错误日志: $error_log)"
    FAILED_FILES+=("$filename")
    ((FAILED_COUNT++))

    # 清洗失败，恢复备份
    mv "$backup_file" "$file"
  fi
done

# 记录结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}清洗完成统计${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "总文件数: $TOTAL_FILES"
echo -e "${GREEN}成功: $SUCCESS_COUNT${NC}"
echo -e "${RED}失败: $FAILED_COUNT${NC}"
echo "用时: ${DURATION}秒"
echo ""

# 显示成功文件列表
if [[ $SUCCESS_COUNT -gt 0 ]]; then
  echo -e "${GREEN}✓ 成功清洗的文件（已移至 cleaned/ 目录）:${NC}"
  for file in "${SUCCESS_FILES[@]}"; do
    echo "  - $file"
  done
  echo ""
fi

# 显示失败文件列表
if [[ $FAILED_COUNT -gt 0 ]]; then
  echo -e "${RED}✖ 清洗失败的文件:${NC}"
  for file in "${FAILED_FILES[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo -e "${YELLOW}提示: 失败的文件已恢复原样，错误日志位于: $LOG_DIR${NC}"
  echo -e "${YELLOW}查看具体错误: ls $LOG_DIR/*.error.log${NC}"
  exit 1
fi

echo -e "${GREEN}🎉 所有文件清洗成功!${NC}"
echo -e "${BLUE}清洗后的文件位于: $CLEANED_DIR${NC}"
exit 0
