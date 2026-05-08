# stock-market-simulator
Stock market game simulation for education purpose

#setup trade-ui (Vite v7.3.1 + Vue 3)

npm create vue
cd trade-ui
npm install
npm run format
npm run dev

# setup deploy in CDK para AWS
cdk init app --language typescript
npm install
cdk bootstrap

cdk synth
cdk deploy
cdk destroy


cdk deploy TradeUiStack --context bucketExists=true



