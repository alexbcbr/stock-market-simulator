import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Same tables and keys as the DynamoDB design (see TradeDbStack).

export const marketPrice = sqliteTable('market_price', {
  symbol: text('symbol').primaryKey(),
  open_price: real('open_price').notNull(),
  close_price: real('close_price').notNull(),
  highest_price: real('highest_price').notNull(),
  lowest_price: real('lowest_price').notNull(),
  volume: real('volume').notNull(),
});

export const marketSymbol = sqliteTable('market_symbol', {
  symbol: text('symbol').primaryKey(),
  name: text('name').notNull(),
  lastSale: text('lastSale').notNull(),
  marketCap: text('marketCap').notNull(),
  ipoYear: text('ipoYear').notNull(),
  sector: text('sector').notNull(),
  industry: text('industry').notNull(),
  summaryQuote: text('summaryQuote').notNull(),
});

export const trade = sqliteTable(
  'trade',
  {
    trade_id: text('trade_id').notNull(),
    trade_timestamp: text('trade_timestamp').notNull(),
    symbol: text('symbol').notNull(),
    customer_name: text('customer_name').notNull(),
    executed_price: real('executed_price').notNull(),
    open_price: real('open_price').notNull(),
    close_price: real('close_price').notNull(),
    price_difference: real('price_difference').notNull(),
    status_trade: integer('status_trade', { mode: 'boolean' }).notNull(),
    status_sell: integer('status_sell', { mode: 'boolean' }).notNull(),
    trade_source: text('trade_source').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.trade_id, t.trade_timestamp] }),
    index('idx_trade_customer_name').on(t.customer_name, t.trade_timestamp),
  ]
);
