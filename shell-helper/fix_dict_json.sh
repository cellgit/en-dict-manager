#!/usr/bin/env bash
# shell-helper/字典json逗号修复/fix_dict_json.sh
# 说明：
#   1) 清洗：法语字母 → 英文、去 HTML/XML 标签、解常见实体
#   2) 组装：按行 JSON 片段 → JSON 数组（自动管理逗号与空行）
#   3) 转换：所有键 camelCase → snake_case（递归）
#   4) 校验（失败则非零退出，阻断入库）：
#       - JSON 语法正确
#       - 顶层为数组，且所有元素均为对象
#       - 所有对象键均为 snake_case（^[a-z0-9_]+$）
#       - 无残留 HTML 标签
#       - 无残留法语字母
#       - 无残留未解码 HTML 实体（&word;）
#
# 用法：
#   fix_dict_json.sh [-i] <input-file> [output-file]
#   chmod +x fix_dict_json.sh
#   ./fix_dict_json.sh [-i] input.txt [output.json]
#     - 不带 -i：结果写 output-file（或 stdout）
#     - 带   -i：就地覆盖 input-file（不需要 output-file）
#
# 依赖：
#   jq（必须）


set -euo pipefail

usage() {
  echo "用法: $0 [-i] <input-file> [output-file]" >&2
  exit 1
}

INPLACE=false
while getopts ":i" opt; do
  case "$opt" in
    i) INPLACE=true ;;
    *) usage ;;
  esac
done
shift $((OPTIND-1))

[[ $# -lt 1 || $# -gt 2 ]] && usage

INPUT_FILE=$1
OUTPUT_FILE="${2:-/dev/stdout}"

if ! command -v jq >/dev/null 2>&1; then
  echo "错误: 需要 jq，请先安装（macOS: brew install jq / Ubuntu: sudo apt-get install jq）。" >&2
  exit 6
fi

export LC_ALL=C.UTF-8

tmpdir="$(mktemp -d)"
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT

jq_err="$tmpdir/jq.err"

# 中间文件
step1="$tmpdir/step1.txt"            # 去 CR
step2="$tmpdir/step2.txt"            # 法语字母清洗
step3="$tmpdir/step3.txt"            # 去标签
step4="$tmpdir/step4.txt"            # 解实体
lines_ok="$tmpdir/lines.ok"          # 每行紧凑 JSON 对象（1 行 1 个）
assembled="$tmpdir/assembled.json"   # jq -s 聚合后的数组
final_tmp="$tmpdir/final.json"       # camel->snake 后，待校验
keys_tsv="$tmpdir/keys.tsv"          # 校验键名临时表

# 0) 去 CR 统一行尾
tr -d '\r' < "$INPUT_FILE" > "$step1" || { echo "✖ 无法读取或规范换行：$INPUT_FILE" >&2; exit 100; }

# 1) 清洗法语字母
sed \
  -e 's/é/e/g' -e 's/ê/e/g' -e 's/è/e/g' -e 's/ë/e/g' \
  -e 's/à/a/g' -e 's/â/a/g' -e 's/ç/c/g' \
  -e 's/î/i/g' -e 's/ï/i/g' \
  -e 's/ô/o/g' \
  -e 's/ù/u/g' -e 's/û/u/g' -e 's/ü/u/g' \
  -e 's/ÿ/y/g' \
  -- "$step1" > "$step2" || { echo "✖ 法语字母清洗失败（sed 出错）" >&2; exit 101; }

# 2) 去标签（HTML/XML，自闭合也会去掉）
sed -E 's/<[^>]*>//g' "$step2" > "$step3" || { echo "✖ 去标签失败（sed 出错）" >&2; exit 102; }

# 3) 解常见 HTML 实体（注意安全处理 &apos;）
#    这里用三段拼接来安全地注入单引号字符
apos="'"
sed \
  -e 's/&quot;/'"\""'"/g' \
  -e "s/&apos;/${apos}/g" \
  -e 's/&lt;/</g' \
  -e 's/&gt;/>/g' \
  -e 's/&nbsp;/ /g' \
  -e 's/&amp;/\&/g' \
  -- "$step3" > "$step4" || { echo "✖ HTML 实体解码失败（sed 出错）" >&2; exit 103; }

# 4) 逐行严格解析：必须是 JSON 对象
: > "$lines_ok"
lineno=0
while IFS= read -r line || [ -n "$line" ]; do
  lineno=$((lineno+1))
  # 去首尾空白 & 去掉已有行尾逗号
  line_trimmed="$(printf '%s' "$line" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]*,[[:space:]]*$//')"
  [ -z "$line_trimmed" ] && continue

  # 紧凑解析
  if ! parsed="$(printf '%s\n' "$line_trimmed" | jq -c . 2>"$jq_err")"; then
    echo "✖ 第 $lineno 行不是合法 JSON：$(printf '%.140s' "$line_trimmed")" >&2
    echo "  解析错误原因: $(head -n1 "$jq_err")" >&2
    exit 110
  fi

  # 必须是对象
  if ! printf '%s\n' "$parsed" | jq -e 'type=="object"' >/dev/null 2>"$jq_err"; then
    echo "✖ 第 $lineno 行不是对象（object）：$(printf '%.140s' "$line_trimmed")" >&2
    echo "  判定错误原因: $(head -n1 "$jq_err")" >&2
    exit 111
  fi

  printf '%s\n' "$parsed" >> "$lines_ok"
done < "$step4"

if [ ! -s "$lines_ok" ]; then
  echo "✖ 清洗后没有任何有效的 JSON 对象行" >&2
  exit 112
fi

# 5) 用 jq -s 安全聚合为数组
if ! jq -s . "$lines_ok" > "$assembled" 2>"$jq_err"; then
  echo "✖ 聚合为数组失败（jq -s）：$(head -n1 "$jq_err")" >&2
  exit 120
fi

# 6) 先快速校验顶层是对象数组
if ! jq -e 'type=="array" and (all(.[]; type=="object"))' "$assembled" >/dev/null 2>"$jq_err"; then
  echo "✖ 聚合结果不是对象数组：$(head -n1 "$jq_err")" >&2
  echo "  提示：检查 $assembled 的对应元素。" >&2
  exit 121
fi

# 7) camelCase → snake_case（使用 explode/implode，无正则、无反向引用）
snake_filter="$tmpdir/keys_to_snake.jq"
cat > "$snake_filter" <<'JQ'
def to_snake:
  # 把大写字母前加下划线并转小写；例如 "wordID" -> "word_id"
  (explode
   | map(
       if . >= 65 and . <= 90 then          # 'A'..'Z'
         [95, (. + 32)]                     # 95: '_'；转小写
       else
         [.]
       end
     )
   | flatten
   | implode
  )
  | ltrimstr("_");                           # 去可能的前导下划线

def keys_to_snake:
  . as $in
  | if type == "object" then
      reduce (keys[]) as $k
        ({}; . + { ($k | to_snake): ($in[$k] | keys_to_snake) })
    elif type == "array" then
      map(keys_to_snake)
    else
      .
    end;

keys_to_snake
JQ

if ! jq -f "$snake_filter" "$assembled" > "$final_tmp" 2>"$jq_err"; then
  echo "✖ camelCase→snake_case 转换失败：$(head -n1 "$jq_err")" >&2
  exit 130
fi

# -----------------------
# 校验（失败即退出，并打印原因）
# -----------------------

# 1) JSON 语法
if ! jq empty "$final_tmp" >/dev/null 2>"$jq_err"; then
  echo "✖ JSON 语法错误（jq empty 失败）：$(head -n1 "$jq_err")" >&2
  exit 1
fi
echo "✓ JSON 语法通过"

# 2) 顶层为对象数组
if ! jq -e 'type=="array" and (all(.[]; type=="object"))' "$final_tmp" >/dev/null 2>"$jq_err"; then
  echo "✖ 顶层不是数组，或数组元素存在非对象项：$(head -n1 "$jq_err")" >&2
  exit 6
fi
echo "✓ 顶层为对象数组"

# 3) 键名 snake_case：提取所有对象键及路径，逐一检查（使用独立 jq 脚本，避免引号/括号问题）
keys_extract="$tmpdir/keys_extract.jq"
cat > "$keys_extract" <<'JQ'
def pstr($p): ($p | map(tostring) | join("."));
paths(objects) as $p
| getpath($p)
| to_entries[]
| [ pstr($p), .key ]
| @tsv
JQ

if ! jq -r -f "$keys_extract" "$final_tmp" > "$keys_tsv" 2>"$jq_err"; then
  echo "✖ 提取键名失败（paths/to_entries）：$(head -n1 "$jq_err")" >&2
  exit 200
fi

BAD_KEYS=false
while IFS=$'\t' read -r path key; do
  [[ -z "${path}${key}" ]] && continue
  if ! printf '%s' "$key" | grep -E '^[a-z0-9_]+$' >/dev/null; then
    BAD_KEYS=true
    echo "✖ 非 snake_case 键：key='$key' @ path='$path'" >&2
  fi
done < "$keys_tsv"
if $BAD_KEYS; then
  echo "  说明：键名需匹配 ^[a-z0-9_]+$，请修正源数据或完善转换规则。" >&2
  exit 2
fi
echo "✓ 所有键均为 snake_case"

# 4) 无残留 HTML 标签
if jq -r '.' "$final_tmp" | grep -E '<[^>]+>' >/dev/null 2>&1; then
  echo "✖ 检测到残留 HTML 标签（形如 <...>）" >&2
  exit 3
fi
echo "✓ 无残留 HTML 标签"

# 5) 无残留法语字母
if jq -r '.' "$final_tmp" | grep -E '[éêèëàâçîïôùûüÿ]' >/dev/null 2>&1; then
  echo "✖ 检测到残留法语字母（é ê è ë à â ç î ï ô ù û ü ÿ）" >&2
  exit 4
fi
echo "✓ 无残留法语字母"

# 6) 无未解码 HTML 实体（&word;）
if jq -r '.' "$final_tmp" | grep -E '&[A-Za-z]{2,};' >/dev/null 2>&1; then
  echo "✖ 可能存在未解码的 HTML 实体（例如 &xxxx;）" >&2
  exit 5
fi
echo "✓ 未发现未解码的 HTML 实体"

# -----------------------
# 校验通过 → 写出结果
# -----------------------
if $INPLACE; then
  mv "$final_tmp" "$INPUT_FILE"
  echo "🎉 处理完成并通过校验（已就地覆盖）：$INPUT_FILE"
else
  if [[ "$OUTPUT_FILE" = "/dev/stdout" ]]; then
    cat "$final_tmp"
    echo >&2 "🎉 处理完成并通过校验（输出到 stdout）"
  else
    mv "$final_tmp" "$OUTPUT_FILE"
    echo "🎉 处理完成并通过校验：$OUTPUT_FILE"
  fi
fi

exit 0







# set -euo pipefail

# usage() {
#   echo "用法: $0 [-i] <input-file> [output-file]" 1>&2
#   exit 1
# }

# INPLACE=false
# while getopts ":i" opt; do
#   case "$opt" in
#     i) INPLACE=true ;;
#     *) usage ;;
#   esac
# done
# shift $((OPTIND-1))

# [[ $# -lt 1 || $# -gt 2 ]] && usage

# INPUT_FILE=$1
# OUTPUT_FILE="${2:-/dev/stdout}"

# # 保证 UTF-8 环境
# export LC_ALL=C.UTF-8

# tmpdir="$(mktemp -d)"
# cleanup() { rm -rf "$tmpdir"; }
# trap cleanup EXIT

# clean_step1="$tmpdir/clean_fr.txt"
# clean_step2="$tmpdir/strip_tags.txt"
# clean_step3="$tmpdir/unescape_entities.txt"
# lfnorm="$tmpdir/lfnorm.txt"
# jsonout="$tmpdir/out.json"

# # 0) 统一换行到 LF，先去掉 CR
# tr -d '\r' < "$INPUT_FILE" > "$lfnorm"

# # 1) 法语字母 → 英文
# # 映射：é ê è ë → e；à â → a；ç → c；î ï → i；ô → o；ù û ü → u；ÿ → y
# sed \
#   -e 's/é/e/g' -e 's/ê/e/g' -e 's/è/e/g' -e 's/ë/e/g' \
#   -e 's/à/a/g' -e 's/â/a/g' -e 's/ç/c/g' \
#   -e 's/î/i/g' -e 's/ï/i/g' \
#   -e 's/ô/o/g' \
#   -e 's/ù/u/g' -e 's/û/u/g' -e 's/ü/u/g' \
#   -e 's/ÿ/y/g' \
#   -- "$lfnorm" > "$clean_step1"

# # 2) 去除任意 HTML/XML 标签（包含未知标签）
# #    注意：这会移除形如 <tag ...>... </tag> 的尖括号包裹内容中的标签本体，但保留内部文字。
# #    自闭合也一起去掉：<br/>、<img .../> 等
# sed -E 's/<[^>]*>//g' "$clean_step1" > "$clean_step2"

# # 3) 解常见 HTML 实体（避免保留 &amp; &quot; 这类转义）
# #    仅处理常见五个，避免引入额外依赖（perl 模块等）
# #    顺序重要：先 &lt;/&gt; 再 &amp; 会错，所以先把 &amp; 放最后
# sed \
#   -e 's/&quot;/"/g' \
#   -e "s/&apos;/'/g" \
#   -e 's/&lt;/</g' \
#   -e 's/&gt;/>/g' \
#   -e 's/&nbsp;/ /g' \
#   -e 's/&amp;/\&/g' \
#   -- "$clean_step2" > "$clean_step3"

# # 4) 生成 JSON 数组：
# #    - 去掉空白行
# #    - 去掉每行尾部已经存在的逗号（防重复逗号）
# #    - 每行之间由脚本统一加逗号
# awk '
#   BEGIN { print "[" }
#   {
#     # 去首尾空白
#     gsub(/^[ \t]+|[ \t]+$/, "", $0)
#     # 去掉可能已有的行尾逗号（和其后空白）
#     sub(/[ \t]*,[ \t]*$/, "", $0)
#     if (length($0) > 0) {
#       buf[++n] = $0
#     }
#   }
#   END {
#     if (n == 0) {
#       print "]"
#       exit
#     }
#     for (i = 1; i <= n; i++) {
#       if (i < n) {
#         print buf[i] ","
#       } else {
#         print buf[i]
#       }
#     }
#     print "]"
#   }
# ' "$clean_step3" > "$jsonout"

# # 5) 输出
# if $INPLACE; then
#   mv "$jsonout" "$INPUT_FILE"
# else
#   if [[ "$OUTPUT_FILE" = "/dev/stdout" ]]; then
#     cat "$jsonout"
#   else
#     mv "$jsonout" "$OUTPUT_FILE"
#   fi
# fi