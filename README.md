# stock-market-simulator
Stock market game simulation for education purpose

#setup trade-ui (Vite v7.3.1 + Vue 3)

bun create vue@latest

cd trade-ui
bun install
bun run dev

# setup deploy in CDK para AWS
brew install oven-sh/bun/bun

bunx cdk init app --language typescript
bun install
bunx cdk bootstrap

bunx cdk synth
bunx cdk deploy
bunx cdk destroy


bunx cdk deploy TradeUiStack --context bucketExists=true




# git hooks (run once per clone)
make setup-hooks   # enables .githooks/pre-commit: blocks env files and secrets at commit time
