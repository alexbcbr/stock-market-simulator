#!/usr/bin/env bash
# Offline checks, no Azure access and no changes to your machine or subscription:
#   terraform fmt -check, terraform init -backend=false, terraform validate, and the Function App bundle build.
# Uses a local `terraform` if installed, otherwise the official Docker image.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/../.."
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

# Work in a copy so .terraform/ and lock files never land in the repo.
mkdir -p "$WORK/trade-backend/deploy"
cp -R "$HERE" "$WORK/trade-backend/deploy/azure-terraform"
cp -R "$ROOT/api-contract" "$WORK/trade-backend/api-contract"
rm -rf "$WORK/trade-backend/deploy/azure-terraform/function/dist"

if command -v terraform >/dev/null 2>&1; then
  tf() { (cd "$WORK/trade-backend/deploy/azure-terraform" && terraform "$@"); }
else
  tf() { docker run --rm -v "$WORK":/w -w /w/trade-backend/deploy/azure-terraform hashicorp/terraform:latest "$@"; }
fi

tf fmt -check -diff
tf init -backend=false -input=false >/dev/null
tf validate -no-color
"$HERE/build-function.sh"
echo "Azure checks passed"
