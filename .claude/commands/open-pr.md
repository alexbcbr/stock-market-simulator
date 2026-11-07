---
description: Open a PR from dev into main (optionally request the Claude review)
argument-hint: "[claude-review]"
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git fetch:*), Bash(git rev-parse:*), Bash(gh pr list:*), Bash(gh pr view:*), Bash(gh pr create:*), Bash(gh label list:*)
---

Open a pull request from `dev` into `main` for this repo. Arguments: `$ARGUMENTS`

- `claude-review`: add the `claude-review` label so the GitHub Claude review workflow (Bedrock) runs on the PR. It costs tokens, so only do this when asked.

Work through these steps in order and stop at the first failure.

## 1. Preconditions
- `git branch --show-current` must be `dev`. If not, stop and tell me.
- `git status --short`: if there are uncommitted changes, list them and stop. Never commit or stage on my behalf.
- `git fetch origin`, then confirm `dev` has no unpushed commits (`git log origin/dev..dev`). If it does, tell me to run `git push origin dev` and stop.
- `gh pr list --head dev --base main --state open`: if a PR already exists, show its URL and stop.
- `git log origin/main..dev --oneline` must be non-empty. If `dev` has nothing new, say so and stop.

## 2. Understand the change
Read `git log origin/main..dev` and `git diff origin/main...dev --stat`, then the diff itself where needed. Ignore generated or vendored files such as lockfiles and `.claude/skills/`.

## 3. Create the PR
- Title: short and imperative, under 70 characters, summarizing the whole change, not just the last commit.
- Body: a "Summary" section with 2 to 5 bullets of what changed and why, and a "Test plan" section with the checks someone should run. End the body with this exact line:
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- Run `gh pr create --base main --head dev --title "..." --body "..."` (pass the body with a heredoc). Add `--label claude-review` only if `claude-review` was passed.
- Do not use `--web`, and never force-push or merge.

## 4. Report
Print the PR URL and say whether a Claude review was requested. Remind me that CI (ruff lint and format) will run on the PR.
