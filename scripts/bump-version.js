// ════════════════════════════════════════════════════════════════
//  GameDevelopementWiki — 版本升级脚本
//  用法：node scripts/bump-version.js <major|minor|patch>
//  示例：node scripts/bump-version.js minor  → 0.2.0
// ════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const versionFile = path.resolve(__dirname, '../VERSION');
const current = fs.readFileSync(versionFile, 'utf-8').trim();
const parts = current.split('.').map(Number);

if (parts.length !== 3 || parts.some(isNaN)) {
  console.error(`错误：VERSION 文件格式无效（当前内容: "${current}"）`);
  process.exit(1);
}

const type = process.argv[2] || 'patch';

let [major, minor, patch] = parts;
switch (type) {
  case 'major': major++; minor = 0; patch = 0; break;
  case 'minor': minor++; patch = 0; break;
  case 'patch': patch++; break;
  default:
    console.error(`用法：node scripts/bump-version.js <major|minor|patch>`);
    process.exit(1);
}

const next = `${major}.${minor}.${patch}`;
fs.writeFileSync(versionFile, next + '\n', 'utf-8');
console.log(`  ${current}  →  ${next}`);
