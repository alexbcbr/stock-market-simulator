const API_BASE_URL = import.meta.env.VITE_URL_TRADE_SERVICES;

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    console.error('API Error:', error);
    throw new Error(`API request failed with status ${response.status}`);
  }
  // A 204 No Content response from a DELETE request will not have a body to parse.
  if (response.status === 204) {
    return Promise.resolve({} as T);
  }
  return response.json();
}

export const getTrades = async (): Promise<Trade[]> => {
  const response = await fetch(`${API_BASE_URL}listAllTrades`);
  return handleResponse<Trade[]>(response);
};

export const getTrade = async (id: string): Promise<Trade> => {
  const response = await fetch(`${API_BASE_URL}trades/${id}`);
  return handleResponse<Trade>(response);
};

export const createTrade = async (
  trade: Omit<Trade, 'trade_id' | 'price_difference'>
): Promise<Trade> => {
  const response = await fetch(`${API_BASE_URL}trades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trade),
  });
  return handleResponse<Trade>(response);
};

export const deleteTrade = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}trades/${id}`, {
    method: 'DELETE',
  });
  // We don't expect a JSON response from a successful delete, so we just check if the call was successful.
  if (!response.ok) {
    const error = await response.text();
    console.error('API Error:', error);
    throw new Error(`API request failed with status ${response.status}`);
  }
};

export const listTradesByCustomerName = async (customerName: string): Promise<Trade[]> => {
  const response = await fetch(`${API_BASE_URL}listTradesByCustomerName`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customer_name: customerName }),
  });
  return handleResponse<Trade[]>(response);
};

export interface BuyStockRequest {
  symbol: string;
  customer_name: string;
  price_mode: PriceMode;
  bid_price?: number;
}

export const buyStock = async (request: BuyStockRequest): Promise<Trade> => {
  const response = await fetch(`${API_BASE_URL}buyStock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return handleResponse<Trade>(response);
};

export interface MarketPrice {
  symbol: string;
  open_price: number;
  highest_price: number;
  lowest_price: number;
}

export const getMarketPrices = async (): Promise<MarketPrice[]> => {
  const response = await fetch(`${API_BASE_URL}market-price`);
  return handleResponse<MarketPrice[]>(response);
};

export const getMarketPrice = async (symbol: string): Promise<MarketPrice> => {
  const response = await fetch(`${API_BASE_URL}market-price?symbol=${encodeURIComponent(symbol)}`);
  return handleResponse<MarketPrice>(response);
};

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

export const getMarketSymbol = async (symbol: string): Promise<MarketSymbol> => {
  const response = await fetch(`${API_BASE_URL}getMarketSymbol?symbol=${encodeURIComponent(symbol)}`);
  return handleResponse<MarketSymbol>(response);
};

export const sellStock = async (trade_id: string, trade_timestamp: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}sellStock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trade_id, trade_timestamp }),
  });
  return handleResponse<void>(response);
};
