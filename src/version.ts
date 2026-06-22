// ════════════════════════════════════════════════════════════════
//  GameDevelopementWiki — 版本信息
//  版本号唯一来源：根目录 VERSION 文件
//  更新版本请使用：npm run version -- <major|minor|patch>
// ════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';

const versionPath = path.resolve(__dirname, '../../VERSION');

function readVersion(): string {
  try {
    return fs.readFileSync(versionPath, 'utf-8').trim();
  } catch {
    console.error('[version] 错误：无法读取 VERSION 文件');
    process.exit(1);
  }
}

export const VERSION: string = readVersion();
export const BUILD_TIME: string = new Date().toISOString();

// 构建时检测：确认当前代码与 VERSION 文件一致（启动时调用）
export function verifyVersionBuild(expected: string): void {
  const actual = readVersion();
  if (actual !== expected) {
    console.error(
      `[version] 版本不匹配！预期: ${expected}, 实际: ${actual}\n` +
      `  请运行 npm run version 更新版本号后重新构建。`
    );
    process.exit(1);
  }
}
