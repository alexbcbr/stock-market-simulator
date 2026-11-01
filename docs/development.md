# Development Notes

## Setup Backend: FastAPI
### initialize
uv init
uv venv
source .venv/bin/activate
uv add fastapi

### Test only one test scenario
uv run pytest tests/test_trade_repository.py -s --log-cli-level=INFO -q 2>&1 | tail -40

## Start backend
cd trade-backend/
uvicorn app.main:app --reload
uv run uvicorn app.main:app --reload
curl http://127.0.0.1:8000
curl http://localhost:8000/revenue?open_price=10&close_price=14
curl -X POST http://localhost:8000/market-price -H "Content-Type: application/json" -d '{"symbol":"AAPL","open_price":10, "high_price":12,"close_price":11}'
curl http://localhost:8000/market-price
curl http://localhost:8000/market-price?symbol=AAPL
curl -X DELETE http://localhost:8000/market-price/AAPL


## Start backend on k8s
### Build the container
cd trade-backend
docker build -t trade-backend:latest .

### Deploy on Kubernetes
docker save trade-backend:latest | docker exec -i desktop-control-plane ctr -n=k8s.io images import -
kubectl apply -f k8s/deployment.yaml
kubectl get pods -w
kubectl get svc
kubectl port-forward svc/trade-backend 8000:8000
curl "http://localhost:8000/revenue?open_price=10&close_price=14"

### Deploy on Docker (optional)
docker run --rm -p 8000:8000 trade-backend
kubectl delete pod -l app=trade-backend

# Manage Kubernetes
kubectl config get-contexts
kubectl config use-context docker-desktop


# Clean-up kubernetes env
kubectl delete -f k8s/deployment.yaml

# Alternative for delete when you don't have deployment.yaml
kubectl delete deployment trade-backend
kubectl delete service trade-backend
kubectl delete pod -l app=trade-backend-py


## Start frontend
npm install
npm run dev

## Run tests
uv run pytest
pytest

## Build frontend
npm run build

## Common Git commands
git switch dev
git pull