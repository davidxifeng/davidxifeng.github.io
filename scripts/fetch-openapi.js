#!/usr/bin/env node

/**
 * 下载 OpenAPI Schema 脚本
 * 从远程 URL 下载 OpenAPI 规范文件到本地
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const OPENAPI_URL = 'http://localhost:8089/schema/openapi.json';
const OUTPUT_FILE = path.join(__dirname, '..', 'openapi-schema.json');
const RETRY_COUNT = 3;
const TIMEOUT = 10000; // 10 秒超时

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 下载文件函数
async function downloadOpenAPI(url, outputFile, retries = RETRY_COUNT) {
  try {
    log(`🚀 正在下载 OpenAPI Schema...`, 'cyan');
    log(`📍 源地址: ${url}`, 'blue');
    log(`💾 输出文件: ${path.relative(process.cwd(), outputFile)}`, 'blue');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'playground-openapi-downloader/1.0.0',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 验证是否是有效的 OpenAPI 文件
    if (!data.openapi && !data.swagger) {
      log('⚠️  警告: 下载的文件可能不是有效的 OpenAPI 规范', 'yellow');
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');

    const fileSize = (fs.statSync(outputFile).size / 1024).toFixed(2);
    log(`✅ OpenAPI Schema 下载成功!`, 'green');
    log(`📊 文件大小: ${fileSize} KB`, 'green');
    log(`📁 文件位置: ${path.relative(process.cwd(), outputFile)}`, 'green');

    return true;

  } catch (error) {
    if (retries > 0) {
      log(`❌ 下载失败，剩余重试次数: ${retries}`, 'yellow');
      log(`⏳ 等待 2 秒后重试...`, 'yellow');
      await delay(2000);
      return downloadOpenAPI(url, outputFile, retries - 1);
    } else {
      log(`💥 下载失败: ${error.message}`, 'red');

      if (error.name === 'AbortError') {
        log('🕐 请求超时，请检查网络连接或服务器状态', 'red');
      } else if (error.code === 'ECONNREFUSED') {
        log('🔌 连接被拒绝，请确保服务器正在运行', 'red');
      } else if (error.code === 'ENOTFOUND') {
        log('🌐 域名解析失败，请检查 URL 地址', 'red');
      }

      return false;
    }
  }
}

// 检查本地文件是否存在
function checkLocalFile(outputFile) {
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    const fileSize = (stats.size / 1024).toFixed(2);
    const lastModified = stats.mtime.toLocaleString('zh-CN');

    log(`📋 本地 OpenAPI Schema 文件信息:`, 'blue');
    log(`📁 文件位置: ${path.relative(process.cwd(), outputFile)}`, 'blue');
    log(`📊 文件大小: ${fileSize} KB`, 'blue');
    log(`🕒 最后修改: ${lastModified}`, 'blue');

    return true;
  }
  return false;
}

// 验证 OpenAPI 文件
function validateOpenAPI(outputFile) {
  try {
    const content = fs.readFileSync(outputFile, 'utf8');
    const data = JSON.parse(content);

    const version = data.openapi || data.swagger;
    const title = data.info?.title || 'Unknown';
    const versionNumber = data.info?.version || 'Unknown';

    log(`📋 OpenAPI 规范信息:`, 'magenta');
    log(`📚 规范版本: ${version}`, 'magenta');
    log(`📖 API 标题: ${title}`, 'magenta');
    log(`🔢 API 版本: ${versionNumber}`, 'magenta');

    if (data.paths) {
      const pathCount = Object.keys(data.paths).length;
      log(`🛤️  API 路径数量: ${pathCount}`, 'magenta');
    }

    return true;
  } catch (error) {
    log(`❌ OpenAPI 文件验证失败: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const forceDownload = args.includes('--force') || args.includes('-f');
  const checkOnly = args.includes('--check') || args.includes('-c');

  log('🔧 OpenAPI Schema 管理工具', 'bright');
  log('=' .repeat(50), 'cyan');

  // 检查本地文件
  const fileExists = checkLocalFile(OUTPUT_FILE);

  if (checkOnly) {
    if (fileExists) {
      validateOpenAPI(OUTPUT_FILE);
    } else {
      log('❌ 本地 OpenAPI Schema 文件不存在', 'red');
      process.exit(1);
    }
    return;
  }

  // 如果文件存在且不是强制下载，询问用户
  if (fileExists && !forceDownload) {
    log('⚠️  本地 OpenAPI Schema 文件已存在', 'yellow');
    log('💡 使用 --force 或 -f 参数强制重新下载', 'yellow');
    log('💡 使用 --check 或 -c 参数检查本地文件', 'yellow');

    // 验证现有文件
    validateOpenAPI(OUTPUT_FILE);
    return;
  }

  // 下载文件
  const success = await downloadOpenAPI(OPENAPI_URL, OUTPUT_FILE);

  if (success) {
    // 验证下载的文件
    validateOpenAPI(OUTPUT_FILE);
    log('\n🎉 操作完成! 现在可以运行以下命令生成 API 客户端:', 'green');
    log('   bun run generate:api', 'bright');
  } else {
    log('\n💥 操作失败! 请检查错误信息并重试', 'red');
    process.exit(1);
  }
}

// 显示帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('🔧 OpenAPI Schema 管理工具', 'bright');
  log('');
  log('用法:', 'cyan');
  log('  bun run fetch:api           下载 OpenAPI Schema (如果本地不存在)');
  log('  bun run fetch:api --force   强制重新下载 OpenAPI Schema');
  log('  bun run fetch:api --check   检查本地 OpenAPI Schema 文件');
  log('');
  log('参数:', 'cyan');
  log('  --force, -f    强制重新下载，覆盖本地文件');
  log('  --check, -c    检查本地文件，不下载');
  log('  --help, -h     显示此帮助信息');
  process.exit(0);
}

// 运行主函数
main().catch(error => {
  log(`💥 未处理的错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});