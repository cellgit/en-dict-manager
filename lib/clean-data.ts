/**
 * 数据清洗服务层
 * 调用 shell 脚本对原始 JSON 数据进行清洗
 */
import { promisify } from "util";
import { exec } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

export type CleanResult = {
  success: true;
  cleanedData: string;
  logs: string[];
} | {
  success: false;
  error: string;
  logs: string[];
};

/**
 * 清洗 JSON 数据
 * @param rawData 原始 JSON 数据（可能不合法）
 * @returns 清洗后的数据或错误信息
 */
export async function cleanJsonData(rawData: string): Promise<CleanResult> {
  const logs: string[] = [];
  let tmpInputFile: string | null = null;
  let tmpOutputFile: string | null = null;

  try {
    // 1. 创建临时文件
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dict-clean-"));
    tmpInputFile = path.join(tmpDir, "input.txt");
    tmpOutputFile = path.join(tmpDir, "output.json");

    logs.push(`✓ 创建临时目录: ${tmpDir}`);

    // 2. 写入原始数据
    await fs.writeFile(tmpInputFile, rawData, "utf-8");
    logs.push(`✓ 写入原始数据到临时文件 (${rawData.length} 字节)`);

    // 3. 获取脚本路径
    const scriptPath = path.join(process.cwd(), "shell-helper", "fix_dict_json.sh");

    // 检查脚本是否存在
    try {
      await fs.access(scriptPath, fs.constants.X_OK);
      logs.push(`✓ 找到清洗脚本: ${scriptPath}`);
    } catch {
      // 尝试给脚本添加执行权限
      try {
        await fs.chmod(scriptPath, 0o755);
        logs.push(`✓ 已添加脚本执行权限`);
      } catch (chmodError) {
        return {
          success: false,
          error: `清洗脚本不存在或无执行权限: ${scriptPath}`,
          logs
        };
      }
    }

    // 4. 执行清洗脚本
    logs.push(`⏳ 开始执行清洗脚本...`);

    const { stdout, stderr } = await execAsync(
      `"${scriptPath}" "${tmpInputFile}" "${tmpOutputFile}"`,
      {
        maxBuffer: 50 * 1024 * 1024, // 50MB
        timeout: 1800000, // 30分钟超时
        env: { ...process.env, LC_ALL: "C.UTF-8" }
      }
    );

    // 记录脚本输出
    if (stdout) {
      logs.push(...stdout.split("\n").filter(Boolean).map(line => `[脚本] ${line}`));
    }
    if (stderr) {
      logs.push(...stderr.split("\n").filter(Boolean).map(line => `[错误] ${line}`));
    }

    // 5. 读取清洗后的数据
    const cleanedData = await fs.readFile(tmpOutputFile, "utf-8");
    logs.push(`✓ 清洗完成，输出大小: ${cleanedData.length} 字节`);

    // 6. 验证清洗后的数据是否为有效 JSON
    try {
      const parsed = JSON.parse(cleanedData);
      if (!Array.isArray(parsed)) {
        throw new Error("清洗后的数据不是数组");
      }
      logs.push(`✓ JSON 验证通过，共 ${parsed.length} 个对象`);
    } catch (parseError) {
      return {
        success: false,
        error: `清洗后的数据不是有效的 JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        logs
      };
    }

    // 7. 清理临时文件
    await fs.rm(tmpDir, { recursive: true, force: true });
    logs.push(`✓ 清理临时文件`);

    return {
      success: true,
      cleanedData,
      logs
    };

  } catch (error) {
    // 清理临时文件（如果存在）
    if (tmpInputFile) {
      try {
        const tmpDir = path.dirname(tmpInputFile);
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // 忽略清理错误
      }
    }

    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;

      // 解析脚本的退出码错误
      if ("code" in error && typeof error.code === "number") {
        const exitCode = error.code;
        errorMessage = `清洗脚本执行失败 (退出码: ${exitCode})\n${error.message}`;

        // 根据退出码提供更友好的错误提示
        const exitCodeMessages: Record<number, string> = {
          1: "JSON 语法错误",
          2: "存在非 snake_case 键名",
          3: "存在残留 HTML 标签",
          4: "存在残留法语字母",
          5: "存在未解码的 HTML 实体（可能是不支持的实体类型，请查看日志中的具体示例）",
          6: "数据不是对象数组或缺少 jq 工具",
          100: "无法读取输入文件",
          101: "法语字母清洗失败",
          102: "去除 HTML 标签失败",
          103: "HTML 实体解码失败",
          110: "存在不合法的 JSON 行",
          111: "存在非对象类型的 JSON 行",
          112: "清洗后没有有效数据",
          120: "JSON 数组聚合失败",
          121: "聚合结果不是对象数组",
          130: "camelCase 转 snake_case 失败",
          200: "提取键名失败"
        };

        if (exitCodeMessages[exitCode]) {
          errorMessage = `${exitCodeMessages[exitCode]}\n详细: ${error.message}`;
        }
      }
    } else {
      errorMessage = String(error);
    }

    return {
      success: false,
      error: errorMessage,
      logs
    };
  }
}

/**
 * 检查数据是否需要清洗
 * 快速检查数据格式，判断是否可能需要清洗
 */
export function shouldCleanData(rawData: string): boolean {
  // 检查是否包含可能需要清洗的特征
  const needsCleaningPatterns = [
    /[éêèëàâçîïôùûüÿ]/,           // 法语字母
    /<[^>]+>/,                     // HTML 标签
    /&[A-Za-z]{2,};/,              // HTML 实体
    /[A-Z][a-z]+[A-Z]/,            // camelCase 键名
  ];

  return needsCleaningPatterns.some(pattern => pattern.test(rawData));
}
