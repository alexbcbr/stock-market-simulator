# Contributing

This is a gamification for a workshop for Gartner customers to materialize agents concepts. 

Please **open an issue before a large pull
request**, so we agree on the change first. Small fixes are welcome directly.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). For security problems, see
[SECURITY.md](SECURITY.md), not an issue.

## Setup

- JavaScript and TypeScript use **bun** (not npm). Python uses **uv** (not pip). Do not add a `package-lock.json`: a
  second lockfile breaks the CDK synth.
- Run `make setup-hooks` once after cloning. It enables a pre-commit hook that blocks env files and secrets.
- Run things locally: `cd trade-backend && make run-local`. You do not need an AWS, Azure or Databricks account, and
  those deployments are not something contributors can test.
- See `CLAUDE.md` for the project layout and commands.

## Workflow

1. Branch from `dev` and open the pull request into `main` (the PR template asks for a summary and a test plan).
2. Keep a change focused. Do not mix a refactor with a feature.
3. If you change the API, update `trade-backend/api-contract/openapi.yaml`. If you change behavior, update the
   matching feature in `specs/features/`.
4. Document behavior in code comments (Google-style docstrings for Python, TSDoc for TypeScript) and do not restate
   what the code shows.

## Checks that must pass

```bash
cd trade-backend && bun run build && bun test      # TypeScript backend
uvx ruff check . && uvx ruff format --check .      # Python lint and format, from the repo root
```

Python projects are also type-checked with Pyright in CI (`.github/workflows/ci-python.yml`). Some projects have no
unit tests yet.

## AI-assisted contributions

Using an AI tool is fine. You are responsible for the result: read it, run it, and say in the PR that you used one.
