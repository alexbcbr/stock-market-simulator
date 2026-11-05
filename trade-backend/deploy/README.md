# Deploying trade-backend

One business-logic core, four ways to run it. All of them expose the same API
(`api-contract/openapi.yaml`, plain JSON) and are checked with the same script:

```bash
bash scripts/smoke.sh <base-url>        # 15 checks; SYMBOL=AAON by default (must exist in market_price)
```

| Target | Stack | Folder | Base URL for the smoke test |
|---|---|---|---|
| Local | Bun + Hono + SQLite | `src/entrypoints/server.ts` | `http://localhost:8080` (`make run-local`) |
| Kubernetes (Docker Desktop) | same server in a container, SQLite on a PVC | `deploy/k8s/` | `http://localhost:8081` (`make k8s-forward`) |
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

Optional, needs Docker: `COSMOS_EMULATOR_URL=http://localhost:8083 bun test tests/cosmos.contract.test.ts` runs the Cosmos adapter against the local emulator (see the file header for the `docker run`).

## Deployment order and what to check at each provider
Do one target at a time; run the smoke test after each.

### 1. Local and Kubernetes (no cloud)
- [ ] `make run-local` then `make smoke`
- [ ] `kubectl config current-context` is `docker-desktop`
- [ ] `make k8s-build k8s-apply k8s-forward`, then `make smoke URL=http://localhost:8081`
- [ ] Confirm the cluster found the local image (pod not in `ErrImagePull`): `kubectl get pods -l app=trade-backend-ts`
- [ ] Cleanup: `make k8s-delete` (keeps the data volume) or `make k8s-delete-data`

### 2. AWS (account/region from your CLI profile)
- [ ] `aws sts get-caller-identity` shows the intended account; region matches `cdk.context.json`
- [ ] CDK bootstrap exists (`CDKToolkit` stack in CloudFormation)
- [ ] `deploy/aws-cdk/.env` has `BUCKET_NAME` (only needed for `TradeUiStack`)
- [ ] `make aws-diff`, then `make deploy-controller` (or `deploy-db` first on a fresh account)
- [ ] Tables `market_price`, `market_symbol`, `trade` exist; import market data with `yahoo-finance-stocks/import_to_dynamodb.py`
- [ ] **First time only:** the three DynamoDB-integrated routes (`listAllTrades`, `listTradesByCustomerName`, `listMarketPrices`) use new response templates that were only tested with a Velocity mock. The smoke test is the real proof.
- [ ] Both UIs now expect plain JSON, so point them at the new deployment only
- [ ] Cleanup: `bun run cdk destroy` (tables use `RemovalPolicy.DESTROY`; the UI bucket is retained)

### 3. Azure (nothing has been deployed yet)
- [ ] `az login`; `az account show` is the intended subscription
- [ ] Resource providers registered: `Microsoft.DocumentDB`, `Microsoft.ApiManagement`, `Microsoft.Web`, `Microsoft.Storage`
- [ ] Region (`location`, default `eastus2`) allows Cosmos serverless and Linux Consumption (Y1) for your subscription/quota
- [ ] `terraform.tfvars` filled in from `terraform.tfvars.example`
- [ ] Steps are in `deploy/azure-terraform/README.md` (apply, publish function, seed Cosmos, smoke test)
- [ ] Things only a real deploy proves: Functions host loads the bundle, APIM accepts the OpenAPI import, the managed identity can read/write Cosmos
- [ ] Cleanup: `terraform destroy`

## Known gaps to decide on after the first deploys
- `.terraform.lock.hcl` is not committed yet.
- DynamoDB has no contract test (the suite needs an empty table; add DynamoDB Local or a throwaway table if you want one).
- `Scan` routes on AWS return at most 1 MB (no paging), as before.
- `trade_timestamp` is time-of-day only (`HH:MM:SS`), so ordering ignores dates, on every target.
- `spec/system-diagram.md` still shows only the original AWS and Python backends.
