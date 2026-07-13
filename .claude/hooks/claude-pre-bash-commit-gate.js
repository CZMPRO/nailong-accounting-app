#!/usr/bin/env node
/**
 * Claude Code PreToolUse（matcher: Bash）
 * 若即将执行 git commit，则校验双通行证；否则放行。
 * 输入：stdin JSON（含 tool_name / tool_input）
 * 拒绝：exit 2 + stderr（Claude Code 约定）
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

// 非 Bash 或非 commit：放行
if (toolName && toolName !== 'Bash') {
  process.exit(0)
}

// 去掉引号字符串后再匹配，避免 echo 'git commit' 误触发
function stripQuoted(s) {
  return s
    .replace(/\\./g, ' ')
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''")
}

const bare = stripQuoted(command)

// 按 shell 语句切开，仅当某条语句真正以 git commit 执行时才拦截
// （避免 echo git commit、文档字符串等误报）
function statementIsGitCommit(stmt) {
  const t = stmt.trim().replace(/^\s*\d+\s*<\s*/, '') // 简单去掉重定向前缀噪声
  if (/^(echo|printf|cat|grep|rg|sed|awk|head|tail|less|more)\b/i.test(t)) {
    return false
  }
  return /(?:^|[;&|]\s*)git(?:\s+-c\s+\S+)?\s+commit\b/.test(t) ||
    /^git(?:\s+-c\s+\S+)?\s+commit\b/.test(t)
}

const isCommit = bare.split(/(?:&&|\|\||;|\n)/).some(statementIsGitCommit)

if (!isCommit) {
  process.exit(0)
}

// 禁止 --no-verify 绕过
if (/(--no-verify|\s-n\b)/.test(bare)) {
  console.error('[错误] 禁止使用 --no-verify / -n 绕过提交门禁。请先取得 tester 与 quality 通行证。')
  process.exit(2)
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
const checker = path.join(root, '.claude', 'hooks', 'check-pass-gate.js')
const result = spawnSync(process.execPath, [checker], {
  env: { ...process.env, NAILONG_ROOT: root },
  encoding: 'utf8',
})

if (result.stdout) process.stderr.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)

if (result.status !== 0) {
  process.exit(2)
}
process.exit(0)
