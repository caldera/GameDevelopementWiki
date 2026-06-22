// ════════════════════════════════════════════════════════════════
//  GameDevelopementWiki — 版本一致性校验（prebuild 钩子）
//  验证 docusaurus.config.ts 读取的 VERSION 与文件一致
//  如果 VERSION 文件不存在或格式异常，构建失败
// ════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const versionFile = path.resolve(__dirname, '../VERSION');

if (!fs.existsSync(versionFile)) {
  console.error('[verify-version] 错误：VERSION 文件不存在！');
  console.error('[verify-version] 请创建 VERSION 文件，内容为版本号（如 0.1.0）');
  process.exit(1);
}

const version = fs.readFileSync(versionFile, 'utf-8').trim();
const semver = /^\d+\.\d+\.\d+$/;

if (!semver.test(version)) {
  console.error(`[verify-version] 错误：VERSION 格式无效（当前: "${version}"）`);
  console.error('[verify-version] 预期格式：major.minor.patch，例如 0.1.0');
  process.exit(1);
}

// 检查 git 是否有未提交的修改（提醒但不禁用构建）
const { execSync } = require('child_process');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') });
  if (status.trim()) {
    console.warn('[verify-version] ⚠ 检出未提交的修改：');
    console.warn(status);
    console.warn('[verify-version] 建议构建前先 commit，确保版本可追溯\n');
  }
} catch {
  // 非 git 目录跳过
}

console.log(`[verify-version] ✅ v${version}`);
