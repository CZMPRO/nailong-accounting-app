#!/bin/sh
# Claude Code PostToolUse / Git post-push 共用：push 成功后删除通行证

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$ROOT" ]; then
  ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fi

export NAILONG_ROOT="$ROOT"
node "$ROOT/.claude/hooks/clear-pass-gate.js"
exit 0
