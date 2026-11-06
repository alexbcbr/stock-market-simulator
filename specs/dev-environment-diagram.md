# Development Environment Diagram

Tools, CI/CD and how they relate in the day-to-day workflow. CI is currently limited to secret scanning; deployments are run manually from the developer machine.

## Tooling and workflow

```mermaid
flowchart TD
    DEV(["Developer<br/>macOS + IDE"])

    subgraph Local["Local toolchain"]
        BUN["bun / bunx<br/>JS/TS: trade-backend, CDK, trade-ui, trade-ui-basic"]
        UV["uv<br/>Python: FastAPI, console, AI, evals"]
        DOCKER["Docker + kubectl<br/>trade-backend-k8s and trade-backend-ts containers"]
        TF["terraform + az CLI<br/>Azure deploys"]
        MAKE["Makefiles<br/>root: CDK deploys<br/>trade-backend: run-local, test, smoke,<br/>k8s-*, validate-*"]
        TESTS["pytest / eslint / prettier / tsc"]
    end

    subgraph AIDEV["AI-assisted development"]
        CC["Claude Code<br/>CLAUDE.md, skills, plugins"]
        HOOK["PreToolUse hook<br/>check-secrets-before-git.sh"]
        SKILLS[".claude/skills + .agents/skills<br/>Arize, frontend-design"]
    end

    subgraph Guard["Secret guardrails"]
        PRE[".githooks/pre-commit<br/>(make setup-hooks, once per clone)"]
    end

    GIT[("Git repo (local)")]

    subgraph GH["GitHub"]
        REPO[("Remote repo")]
        CI["GitHub Actions: Secret scan<br/>1. block committed .env files<br/>2. gitleaks (full history)"]
    end

    WIKI["DeepWiki<br/>auto-generated repo wiki<br/>(app.devin.ai)"]

    subgraph Deploy["Manual deploy targets"]
        CDK["cdk deploy<br/>TradeDbStack, TradeControllerStack, TradeUiStack"]
        AWS["AWS<br/>DynamoDB, API Gateway, Lambda,<br/>S3 + CloudFront"]
        TFA["terraform apply +<br/>publish-function.sh"]
        AZ["Azure<br/>Cosmos DB, Functions (Flex), API Management"]
        K8S["Kubernetes (Docker Desktop)<br/>make k8s-apply (trade-backend-ts)<br/>kubectl apply (trade-backend-k8s)"]
        LOC["Local server<br/>make run-local (Bun + SQLite)"]
        SMK["scripts/smoke.sh &lt;base-url&gt;<br/>same check on every target"]
    end

    subgraph LLMOps["LLM ops"]
        BED["AWS Bedrock"]
        ARIZE["Arize<br/>tracing, datasets, experiments"]
        EVAL["evals pipeline<br/>llm-as-judge-pipeline-automation.sh"]
    end

    DEV -->|edits code| CC
    DEV --> BUN & UV & DOCKER & TF
    CC --> SKILLS
    CC -->|runs commands| BUN & UV & MAKE & TF
    BUN & UV --> TESTS
    MAKE --> BUN & UV

    DEV -->|git commit| PRE
    CC -->|git commit / push| HOOK
    HOOK -->|allow| PRE
    PRE -->|clean| GIT
    GIT -->|git push| REPO
    REPO -->|push / PR / manual| CI
    CI -.->|fail: fix and re-push| DEV
    REPO -->|indexed, branch main| WIKI
    WIKI -.->|documentation for| DEV

    MAKE -->|deploy-db / controller / ui / all| CDK
    CDK --> AWS
    TF --> TFA
    TFA --> AZ
    DOCKER -->|build + apply| K8S
    MAKE -->|run-local| LOC
    SMK -.->|verifies| AWS & AZ & K8S & LOC

    UV -->|agents| BED
    UV -->|traces| ARIZE
    UV --> EVAL
    EVAL <-->|export dataset, experiments| ARIZE
```

## Commit-to-deploy sequence

```mermaid
sequenceDiagram
    actor D as Developer
    participant C as Claude Code
    participant H as PreToolUse hook
    participant P as .githooks/pre-commit
    participant G as GitHub
    participant A as GitHub Actions
    participant X as CDK / terraform / kubectl

    D->>C: request change
    C->>C: edit, bun/uv run, tests
    C->>H: git commit / git push
    H-->>C: block if secrets or env files found
    C->>P: git commit
    P-->>C: block if env files or secret patterns staged
    D->>G: git push
    G->>A: trigger Secret scan
    A-->>G: pass / fail (.env check + gitleaks)
    Note over D,X: No automated CD yet — deploys are manual
    D->>X: make deploy-all (cdk), terraform apply + publish-function.sh, or make k8s-apply
```

## Notes

- **Three secret layers:** Claude Code hook (Claude-initiated commits/pushes), tracked `pre-commit` (anyone), GitHub Actions (after push).
- **Wiki:** the project wiki lives in DeepWiki: <https://app.devin.ai/org/alexbcbr/wiki/alexbcbr/stock-market-simulator?branch=main>
- **Package managers:** bun for JS/TS, uv for Python. Don't reintroduce `package-lock.json` (two lockfiles break CDK synth).
- **Four targets, one check.** AWS (CDK), Azure (Terraform + `publish-function.sh`), local (`make run-local`) and Kubernetes (`make k8s-apply`) are all verified with `scripts/smoke.sh <base-url>`. Details: `trade-backend/deploy/README.md`.
- **Not automated today:** build, tests and deploys have no CI; they run locally. CD could be added as a workflow that runs `bun run build` + `cdk deploy`, or `terraform apply` for Azure.
