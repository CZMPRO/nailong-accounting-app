#!/usr/bin/env node
/**
 * 奶龙记账 — push 成功后删除双通行证（一次一检，用完作废）
 */
const fs = require('fs')
const path = require('path')

function findRoot(start) {
  let dir = path.resolve(start || process.cwd())
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(dir, '.git')) && fs.existsSync(path.join(dir, 'package.json'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

const root = process.env.NAILONG_ROOT || findRoot(process.cwd())
const states = path.join(root, '.claude', 'states')
for (const name of ['tester-pass.json', 'quality-pass.json']) {
  const p = path.join(states, name)
  try {
    fs.unlinkSync(p)
  } catch {
    // 文件不存在则忽略
  }
}
console.log('[门禁] 已删除本地通行证（下次提交需重新检查）。')
process.exit(0)
