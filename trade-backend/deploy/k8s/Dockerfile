# Build from the repository root (the seed CSVs live outside trade-backend/):
#   docker build -f trade-backend/deploy/k8s/Dockerfile -t trade-backend-ts:latest .
FROM oven/bun:1

WORKDIR /app/trade-backend
COPY trade-backend/package.json trade-backend/bun.lock ./
RUN bun install --frozen-lockfile --production

COPY trade-backend/src ./src
COPY trade-backend/scripts/seed.ts ./scripts/seed.ts
# Market data used to seed SQLite on first start
COPY yahoo-finance-stocks/prod-data/2026-01-21.csv /seed/prices.csv
COPY yahoo-finance-stocks/prod-data/nasdaq.csv /seed/symbols.csv

ENV PORT=8080 DB_PATH=/data/trade.db
EXPOSE 8080
# Seeding is idempotent (existing rows are kept), so it is safe on every start.
CMD ["sh", "-c", "bun scripts/seed.ts /seed/prices.csv /seed/symbols.csv && exec bun src/entrypoints/server.ts"]
