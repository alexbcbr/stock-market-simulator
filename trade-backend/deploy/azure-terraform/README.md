# Azure deployment (Terraform)

Azure version of the AWS stacks: Cosmos DB (serverless) + Azure Functions running the Hono app + API Management
importing `api-contract/openapi.yaml`. The Function App reaches Cosmos DB with its managed identity (no keys).

## Check without touching Azure
```bash
make validate-azure      # from trade-backend/: terraform fmt + validate (Docker image if terraform is missing) + bundle build
```

## Deploy (we do this together; it creates billable resources)
```bash
az login
az account show --query id -o tsv            # -> subscription_id
cp terraform.tfvars.example terraform.tfvars # fill in subscription_id and publisher_email
terraform init
terraform plan
terraform apply
./publish-function.sh                        # builds the bundle and uploads it to the Function App
COSMOS_ENDPOINT=$(terraform output -raw cosmos_endpoint) bun ../../scripts/seed-cosmos.ts
bash ../../scripts/smoke.sh "$(terraform output -raw api_base_url)"
```
The smoke test must pass exactly as it does for local, Kubernetes and AWS.

## Remove everything
`terraform destroy`

## Notes
- Cosmos partition keys: `/symbol` for prices and symbols, `/trade_id` for trades (create and sell are point operations; listing by customer is a cross-partition query, fine at demo scale).
- Cosmos account keys are disabled; the seed script and the app use Entra ID. Terraform grants the data role to you and to the Function App.
- The Function App allows anonymous calls, so it is reachable without going through API Management. Acceptable for a demo; restrict it for anything real.
- APIM Consumption tier is used so the deploy is fast; Developer/Basic tiers can take 30-45 minutes.
- No `.terraform.lock.hcl` is committed yet; run `terraform init` once and commit it after the first real deploy.
- Status: verified offline only. The Cosmos adapter passes the shared contract and the 15-step smoke test against the local Cosmos emulator; the Functions host, APIM import and role assignments are only proven by a real deploy.
