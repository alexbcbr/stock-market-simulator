#!/usr/bin/env bash
# Builds the Function App package and uploads it. Run AFTER `terraform apply`.
# Needs: az login. Reads the Function App name and resource group from terraform outputs.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
"$HERE/build-function.sh"
APP="$(cd "$HERE" && terraform output -raw function_app_name)"
RG="$(cd "$HERE" && terraform output -raw resource_group_name)"
# Flex Consumption: config-zip is the documented CLI route (`az functionapp deploy --type zip` answered 415).
az functionapp deployment source config-zip --resource-group "$RG" --name "$APP" --src "$HERE/function/dist/function.zip"
echo "Published to $APP. Next: seed data with scripts/seed-cosmos.ts, then scripts/smoke.sh <api_base_url>"
