export interface Trade {
  trade_id: string;
  symbol: string;
  customer_name: string;
  executed_price: number;
  open_price: number;
  close_price: number;
  price_difference: number;
  status_trade: boolean;
}

export interface BuyStockRequest {
  symbol: string;
  customer_name: string;
  executed_price: number;
  open_price: number;
  close_price: number;
}
