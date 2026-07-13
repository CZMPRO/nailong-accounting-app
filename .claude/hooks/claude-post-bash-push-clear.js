#!/usr/bin/env node
/**
 * Claude Code PostToolUse（matcher: Bash）
 * 若刚执行的是成功的 git push，则删除双通行证。
 */
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

const raw = readStdin()
let data = {}
try {
  data = raw ? JSON.parse(raw) : {}
} catch {
  process.exit(0)
}

const toolName = data.tool_name || data.toolName || ''
const input = data.tool_input || data.toolInput || {}
const command = String(input.command || input.cmd || '')
const toolResult = data.tool_result || data.toolResult || data.response || {}

if (toolName && toolName !== 'Bash') {
  process.exit(0)
}

// 去掉引号内容，避免文案里的 git push 误触发
const bare = command
  .replace(/\\./g, ' ')
  .replace(/"[^"]*"/g, '""')
  .replace(/'[^']*'/g, "''")
const isPush = /\bgit\s+push\b/.test(bare)
if (!isPush) {
  process.exit(0)
}

// 若能读到退出码且非 0，则不删章
const exitCode =
  toolResult.exit_code ??
  toolResult.exitCode ??
  data.exit_code ??
  data.exitCode
if (exitCode !== undefined && exitCode !== null && Number(exitCode) !== 0) {
  process.exit(0)
}

function findRoot() {
  let dir = process.cwd()
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

const root = findRoot()
const clearer = path.join(root, '.claude', 'hooks', 'clear-pass-gate.js')
spawnSync(process.execPath, [clearer], {
  env: { ...process.env, NAILONG_ROOT: root },
  encoding: 'utf8',
  stdio: 'inherit',
})
process.exit(0)
