/**
 * Reference data about a listed company.
 *
 * @remarks
 * All fields are text, including `lastSale` and `marketCap`, which keep the
 * formatting of the source file (for example a leading dollar sign). Do not
 * compute with them.
 */
export interface MarketSymbol {
  symbol: string;
  name: string;
  lastSale: string;
  marketCap: string;
  ipoYear: string;
  sector: string;
  industry: string;
  summaryQuote: string;
}
