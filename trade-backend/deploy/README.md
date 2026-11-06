# Deploying trade-backend

One business-logic core, four ways to run it. All of them expose the same API
(`api-contract/openapi.yaml`, plain JSON) and are checked with the same script:

```bash
bash scripts/smoke.sh <base-url>        # 15 checks; SYMBOL=AAON by default (must exist in market_price)
```

| Target | Stack | Folder | Base URL for the smoke test |
|---|---|---|---|
| Local | Bun + Hono + SQLite | `src/entrypoints/server.ts` | `http://localhost:8080` (`make run-local`) |
| Kubernetes (Docker Desktop) | `deploy/k8s/` | `http://localhost:8081` (`make k8s-build k8s-apply k8s-forward`) |
| AWS | API Gateway + Lambda + DynamoDB (CDK) | `deploy/aws-cdk/` | `https://<id>.execute-api.<region>.amazonaws.com/prod` |
| Azure | API Management + Functions + Cosmos DB (Terraform) | `deploy/azure-terraform/` | `terraform output api_base_url` |

## Offline checks (safe: no resources are created)
From `trade-backend/`:

| Command | What it checks |
|---|---|
| `make validate-aws` | `tsc`, all tests, `cdk synth` |
| `make validate-k8s` | `kubectl apply --dry-run=client` and `--dry-run=server` against the current context |
| `make validate-azure` | `terraform fmt/validate` (Docker image if terraform is not installed) and the Function App bundle |
| `make validate-all` | all of the above, plus `docker build` of the image |
| `make aws-diff` | what a deploy would change in AWS (read-only, but uploads the template asset to the CDK bootstrap bucket) |

Optional, needs Docker: `COSMOS_EMULATOR_URL=http://localhost:8083 COSMOS_EMULATOR_KEY=<emulator key> bun test tests/cosmos.contract.test.ts` runs the Cosmos adapter against the local emulator. The key is the public one in Microsoft's emulator docs (not stored in the repo, so secret scanners stay quiet); see the file header for the `docker run`.

## Deployment order and what to check at each provider
Do one target at a time; run the smoke test after each.