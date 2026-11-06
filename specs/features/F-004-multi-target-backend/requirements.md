---
id: F-004
title: Multi-target backend
status: implemented
---
# F-004 Multi-target backend

## Context
One TypeScript business-logic core must run on four targets with an identical plain-JSON API, so the rules are written once. Folder: `trade-backend/`. How to deploy and check each target: `trade-backend/deploy/README.md`.

## User stories
| ID | Priority | Story | Requirements |
|---|---|---|---|
| F-004-S1 | P1 | As a **developer**, I want to change a trading rule once and have every target change, so I never fix the same bug four times. | R1, R2 |
| F-004-S2 | P1 | As a **presenter**, I want to run the same app on AWS, Azure, locally and on Kubernetes, so I can show the same behavior on any platform. | R3-R8 |
| F-004-S3 | P1 | As a **developer**, I want one command that proves a deployment behaves like the others, so I trust a new target. | R9 |
| F-004-S4 | P2 | As a **developer**, I want a quick local loop with seeded data, so I can try a rule in seconds. | R3 |
| F-004-S5 | P2 | As a **developer**, I want to validate everything without creating cloud resources, so I can check a change safely. | R10 |
| F-004-S6 | P2 | As a **UI developer**, I want plain JSON from every target, so the UI has one parser. | R2 |

## Requirements
### Shared core and contract
- **R1** The pricing, validation and trade rules SHALL live in `src/core` with no AWS, Azure or SQLite imports; each target SHALL only add an entrypoint and a storage adapter.
- **R2** Every target SHALL answer the routes in `api-contract/openapi.yaml` with plain JSON (never DynamoDB-typed JSON) and the same status codes.
- **R9** `scripts/smoke.sh <base-url>` SHALL run the same 15 checks against any target and exit non-zero on any failure.

### Targets
- **R3** Local: `make run-local` SHALL seed `data/trade.db` and serve the API on port 8080 (Bun + Hono + SQLite).
- **R4** Kubernetes: `make k8s-build k8s-apply` SHALL run one replica with SQLite on a persistent volume, seeded from the CSVs baked into the image; `make k8s-forward` SHALL expose it on port 8081.
- **R5** AWS: the API SHALL be API Gateway + Lambda + DynamoDB created by three CDK stacks (`TradeDbStack`, `TradeControllerStack`, `TradeUiStack`); `listAllTrades`, `listTradesByCustomerName` and `listMarketPrices` SHALL be served by DynamoDB integrations with VTL templates that return plain JSON.
- **R6** Azure: Terraform SHALL create Cosmos DB (serverless, Entra-ID only), a Flex Consumption Function App with a managed identity that can read and write Cosmos, and API Management importing `openapi.yaml`.
- **R7** Azure: `publish-function.sh` SHALL build the Function package and upload it, separately from `terraform apply`.
- **R8** All storage adapters SHALL pass the same repository contract tests; the Cosmos ones run when the emulator variables are set.

### Verification
- **R10** `make validate-all` SHALL run every offline check (tsc, tests, `cdk synth`, kubectl dry-runs, terraform validate, Function bundle, docker build) without creating cloud resources.

## Out of scope
Multiple replicas on SQLite, automatic deploys (CI/CD), cloud-managed Kubernetes, replacing `trade-backend-k8s`.

## Decisions
- D1: Ports and adapters. Hono only for local, Kubernetes and Azure; AWS keeps API Gateway + VTL so list routes need no Lambda.
- D2: VTL response templates convert DynamoDB-typed items to plain JSON so every target answers alike.
- D3: Terraform (not Bicep) for Azure; CDK kept for AWS.
- D4: Cosmos is serverless and Entra-ID only; the Function uses a managed identity.
- D5: Function code is published separately from Terraform, with `az functionapp deployment source config-zip` (`deploy --type zip` answered 415 on Flex).
- D6: Kubernetes uses `imagePullPolicy: Always` because Docker Desktop's node keeps its own image copy.
- D7: The Python backend stays a separate implementation (F-006).

## Known gaps
- **G1** Scan-based list routes are unpaged (about 1 MB).
- **G2** Nothing deploys automatically and no CI runs the target checks.
- **G3** `deploy/aws-cdk/README.md` is stale and `.terraform.lock.hcl` is not committed.
- **G4** On Azure, trade listing by customer is a cross-partition query (acceptable for a demo).
