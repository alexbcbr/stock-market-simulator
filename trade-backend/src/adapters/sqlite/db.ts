import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

/**
 * The Drizzle database handle returned by `openDatabase`.
 */
export type SqliteDb = ReturnType<typeof openDatabase>;

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS market_price (
  symbol TEXT PRIMARY KEY, open_price REAL NOT NULL, close_price REAL NOT NULL,
  highest_price REAL NOT NULL, lowest_price REAL NOT NULL, volume REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS market_symbol (
  symbol TEXT PRIMARY KEY, name TEXT NOT NULL, lastSale TEXT NOT NULL, marketCap TEXT NOT NULL,
  ipoYear TEXT NOT NULL, sector TEXT NOT NULL, industry TEXT NOT NULL, summaryQuote TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS trade (
  trade_id TEXT NOT NULL, trade_timestamp TEXT NOT NULL, symbol TEXT NOT NULL, customer_name TEXT NOT NULL,
  executed_price REAL NOT NULL, open_price REAL NOT NULL, close_price REAL NOT NULL, price_difference REAL NOT NULL,
  status_trade INTEGER NOT NULL, status_sell INTEGER NOT NULL, trade_source TEXT NOT NULL,
  PRIMARY KEY (trade_id, trade_timestamp)
);
CREATE INDEX IF NOT EXISTS idx_trade_customer_name ON trade (customer_name, trade_timestamp);
CREATE TABLE IF NOT EXISTS customers (
  customer_name TEXT PRIMARY KEY, fullname TEXT, email TEXT, date_of_birth TEXT, state_residence TEXT,
  allowed_contact INTEGER NOT NULL, crm_managed INTEGER NOT NULL
);
`;

/**
 * Opens the SQLite database and makes sure the tables exist.
 *
 * @remarks
 * Creates the parent directory and the file when they are missing, switches the journal to WAL, and runs
 * `CREATE TABLE IF NOT EXISTS`, then adds the customer columns `date_of_birth` and `state_residence` to a database
 * that predates them. It is safe to call on every start and never changes existing rows.
 * Uses `bun:sqlite`, so it runs only under Bun, not Node.
 *
 * @param path - File path, or `:memory:` for a throw-away database in tests.
 * @returns A Drizzle handle bound to the file.
 * @throws If the directory cannot be created or the file cannot be opened.
 */
export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path, { create: true });
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec(CREATE_TABLES);
  // Databases created before these columns existed: add them in place (CREATE TABLE IF NOT EXISTS does not).
  const customerColumns = (sqlite.query('PRAGMA table_info(customers)').all() as { name: string }[]).map((c) => c.name);
  for (const column of ['date_of_birth', 'state_residence']) {
    if (!customerColumns.includes(column)) sqlite.exec(`ALTER TABLE customers ADD COLUMN ${column} TEXT;`);
  }
  return drizzle(sqlite, { schema });
}
