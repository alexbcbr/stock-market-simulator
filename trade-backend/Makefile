# Local development shortcuts for trade-backend (bun + Hono + SQLite).
PORT ?= 8080

install:
	bun install

run-local: seed   ## start the API on http://localhost:$(PORT) (seeds the SQLite file on first run)
	PORT=$(PORT) bun src/entrypoints/server.ts

seed:             ## load market data from yahoo-finance-stocks/prod-data (safe to repeat)
	bun scripts/seed.ts

test:
	bun test

smoke:            ## usage: make smoke URL=http://localhost:8080
	bash scripts/smoke.sh $(or $(URL),http://localhost:$(PORT))

reset-local:      ## delete the local SQLite database
	rm -f data/trade.db data/trade.db-*

.PHONY: install run-local seed test smoke reset-local

# --- Local Kubernetes (Docker Desktop cluster, plain kubectl) ---
K8S_PORT ?= 8081
IMAGE ?= trade-backend-ts:latest

k8s-build:        ## build the image (context = repository root)
	docker build -f deploy/k8s/Dockerfile -t $(IMAGE) ..

k8s-apply:        ## create/update PVC, Deployment and Service; restarts the pod so a rebuilt :latest image is picked up
	kubectl apply -f deploy/k8s/deployment.yaml
	kubectl rollout restart deployment/trade-backend-ts
	kubectl rollout status deployment/trade-backend-ts --timeout=120s

k8s-image-check:  ## run the image's startup seeding once (no cluster needed); catches files missing from the image
	docker run --rm -e DB_PATH=/tmp/check.db $(IMAGE) bun scripts/seed.ts /seed/prices.csv /seed/symbols.csv

k8s-forward:      ## expose the Service on http://localhost:$(K8S_PORT) (Ctrl-C to stop)
	kubectl port-forward svc/trade-backend-ts $(K8S_PORT):8080

k8s-logs:
	kubectl logs deployment/trade-backend-ts --tail=50

k8s-delete:       ## remove Deployment and Service; keeps the PVC (data). k8s-delete-data removes it too
	kubectl delete deployment/trade-backend-ts service/trade-backend-ts --ignore-not-found

k8s-delete-data:  ## also delete the SQLite volume
	kubectl delete -f deploy/k8s/deployment.yaml --ignore-not-found

validate-k8s:     ## no changes to the cluster: client + server dry-run, and an image build check
	kubectl apply --dry-run=client -f deploy/k8s/deployment.yaml
	kubectl apply --dry-run=server -f deploy/k8s/deployment.yaml

.PHONY: k8s-image-check k8s-build k8s-apply k8s-forward k8s-logs k8s-delete k8s-delete-data validate-k8s

# --- AWS (read-only: build, tests, cdk synth; nothing is deployed) ---
validate-aws:     ## tsc + bun test + cdk synth (no AWS calls). `make aws-diff` also compares with the deployed stacks
	bun run build
	bun test
	bun run cdk synth --quiet

aws-deploy:
	bun run cdk deploy TradeDbStack
	bun run cdk deploy TradeControllerStack

aws-diff:         ## read-only against your AWS account, but cdk uploads the template asset to the CDK bootstrap bucket
	bun run cdk diff

azure-deploy:
	az login
	terraform apply
# --- Azure (nothing here talks to Azure until you run terraform apply yourself) ---
validate-azure:   ## terraform fmt/validate (via Docker if terraform is missing) + Function App bundle build
	bash deploy/azure-terraform/validate.sh

build-function:   ## bundle the Function App into deploy/azure-terraform/function/dist/function.zip
	bash deploy/azure-terraform/build-function.sh

.PHONY: validate-azure build-function validate-aws aws-diff validate-all

# Every offline check in one go: AWS build/synth, k8s dry-run + image build, Azure terraform validate.
validate-all: validate-aws k8s-build k8s-image-check validate-k8s validate-azure
	@echo "All offline checks passed"

