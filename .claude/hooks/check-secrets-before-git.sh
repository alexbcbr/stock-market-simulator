#!/usr/bin/env bash
# PreToolUse hook: blocks Claude's own `git commit` / `git push` Bash calls
# if staged changes (commit) or unpushed commits (push) look like they
# contain secrets or env files. Independent of the repo's git pre-commit
# hook - this one covers Claude specifically, as a second layer.
set -euo pipefail

input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')

case "$command" in
  *"git commit"*) mode="commit" ;;
  *"git push"*) mode="push" ;;
  *) exit 0 ;;
esac

secret_pattern='(AKIA[0-9A-Z]{16})|(ARIZE_API_KEY\s*=\s*[^$."][^\s]+)|(api[_-]?key["'\'' ]*[:=]["'\'' ]*[^$"'\'' .][A-Za-z0-9_\-]{15,})|(secret["'\'' ]*[:=]["'\'' ]*[^$"'\'' .][A-Za-z0-9_\-]{15,})|(-----BEGIN [A-Z ]*PRIVATE KEY-----)|(ghp_[A-Za-z0-9]{36})|(sk-[A-Za-z0-9]{20,})'

issues=""

if [ "$mode" = "commit" ]; then
  staged=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    base=$(basename "$f")
    case "$base" in
      .env|.env.*)
        case "$base" in
          .env.example|.env.sample|.env.template) ;;
          *) issues="${issues}env file staged: $f\n" ;;
        esac
        ;;
    esac
    if [ -f "$f" ] && git diff --cached -- "$f" 2>/dev/null | grep -E -i -q "$secret_pattern"; then
      issues="${issues}possible secret in staged diff: $f\n"
    fi
  done <<< "$staged"
else
  range="HEAD@{upstream}..HEAD"
  if ! git rev-parse --verify "HEAD@{upstream}" >/dev/null 2>&1; then
    range=""
  fi
  if [ -n "$range" ]; then
    if git log -p "$range" 2>/dev/null | grep -E -i -q "$secret_pattern"; then
      issues="${issues}possible secret found in commits about to be pushed\n"
    fi
  fi
fi

if [ -n "$issues" ]; then
  reason=$(printf 'Secret check before git %s flagged:\n%b\nReview before proceeding. If this is a false positive, proceed manually outside this hook.' "$mode" "$issues")
  jq -n --arg reason "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
fi

exit 0
