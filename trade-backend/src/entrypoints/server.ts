/**
 * Local and Kubernetes entrypoint: Hono on Bun with a SQLite file.
 *
 * @remarks
 * Run with `make run-local` (after seeding) or as the container command. Reads `DB_PATH` (default
 * `./data/trade.db`) and `PORT` (default 8080). Starting it opens the database, creates the tables if
 * needed and begins serving; it does not load market data, which the seed script does. There is no graceful
 * shutdown handling.
 *
 * @packageDocumentation
 */
import { openDatabase } from '../adapters/sqlite/db';
import { createSqliteRepositories } from '../adapters/sqlite/repositories';
import { createApp } from '../api/app';
import { TradeService } from '../core/tradeService';

const dbPath = process.env.DB_PATH ?? './data/trade.db';
const port = Number(process.env.PORT ?? 8080);

const repos = createSqliteRepositories(openDatabase(dbPath));
const app = createApp({
  tradeService: new TradeService(repos.trades, repos.prices),
  prices: repos.prices,
  symbols: repos.symbols,
});

Bun.serve({ port, fetch: app.fetch });
console.log(`trade-backend listening on http://localhost:${port} (db: ${dbPath})`);
