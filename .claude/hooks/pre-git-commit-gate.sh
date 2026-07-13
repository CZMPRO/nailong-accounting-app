#!/bin/sh
# Claude Code PreToolUse / Git pre-commit 共用：校验双通行证
# 官方项目钩子脚本目录：.claude/hooks/

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$ROOT" ]; then
  ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fi

export NAILONG_ROOT="$ROOT"
node "$ROOT/.claude/hooks/check-pass-gate.js"
exit $?
