export type PriceMode = 'manual' | 'market' | 'agent_conservative' | 'agent_moderate' | 'agent_aggressive' | 'agent';

export interface Trade {
  trade_id: string;
  symbol: string;
  customer_name: string;
  executed_price: number;
  open_price: number;
  close_price: number;
  price_difference: number;
  status_trade: boolean;
  status_sell: boolean;
  trade_source: PriceMode;
  trade_timestamp: string;
}

export interface BuyStockRequest {
  symbol: string;
  customer_name: string;
  price_mode: PriceMode;
  bid_price?: number;
}
