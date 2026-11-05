// Loads market prices and symbols from yahoo-finance-stocks/prod-data CSVs into SQLite.
// Usage: bun scripts/seed.ts [prices.csv] [symbols.csv]
import { openDatabase } from '../src/adapters/sqlite/db';
import { marketPrice, marketSymbol } from '../src/adapters/sqlite/schema';
import { loadSeedData } from './seedData';

const db = openDatabase(process.env.DB_PATH ?? './data/trade.db');
const { prices, symbols } = loadSeedData(process.argv[2], process.argv[3]);

db.transaction((tx) => {
  for (let i = 0; i < prices.length; i += 500) {
    tx.insert(marketPrice).values(prices.slice(i, i + 500)).onConflictDoNothing().run();
  }
  for (let i = 0; i < symbols.length; i += 500) {
    tx.insert(marketSymbol).values(symbols.slice(i, i + 500)).onConflictDoNothing().run();
  }
});

console.log(`Seeded ${prices.length} market prices and ${symbols.length} symbols`);
