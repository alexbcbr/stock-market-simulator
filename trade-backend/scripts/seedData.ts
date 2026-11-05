// Shared by seed.ts (SQLite) and seed-cosmos.ts: reads the market CSVs from yahoo-finance-stocks/prod-data.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(__dirname, '../../yahoo-finance-stocks/prod-data/');
export const DEFAULT_PRICES_CSV = `${dataDir}2026-01-21.csv`;
export const DEFAULT_SYMBOLS_CSV = `${dataDir}nasdaq.csv`;

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

export function loadSeedData(pricesCsv = DEFAULT_PRICES_CSV, symbolsCsv = DEFAULT_SYMBOLS_CSV) {
  const prices = parseCsv(readFileSync(pricesCsv, 'utf8'))
    .filter((r) => r.Ticker && [r.Close, r.High, r.Low, r.Open, r.Volume].every((v) => v !== '' && !isNaN(Number(v))))
    .map((r) => ({
      symbol: r.Ticker.toUpperCase(),
      open_price: Number(r.Open),
      close_price: Number(r.Close),
      highest_price: Number(r.High),
      lowest_price: Number(r.Low),
      volume: Math.trunc(Number(r.Volume)),
    }));

  const symbols = parseCsv(readFileSync(symbolsCsv, 'utf8'))
    .filter((r) => r.Symbol)
    .map((r) => ({
      symbol: r.Symbol.toUpperCase(),
      name: r.Name,
      lastSale: r.LastSale,
      marketCap: r.MarketCap,
      ipoYear: r.IPOyear,
      sector: r.Sector,
      industry: r.industry,
      summaryQuote: r['Summary Quote'],
    }));
  return { prices, symbols };
}
