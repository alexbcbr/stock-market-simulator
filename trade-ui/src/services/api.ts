const API_BASE_URL = import.meta.env.VITE_URL_TRADE_SERVICES;

export interface Trade {
  trade_id: number;
  symbol: string;
  customer_name: string;
  executed_price: number;
  open_price_at_execution: number;
  reference_price_at_execution: number;
  price_difference: number;
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
  const response = await fetch(`${API_BASE_URL}/trades/`);
  return handleResponse<Trade[]>(response);
};

export const getTrade = async (id: number): Promise<Trade> => {
  const response = await fetch(`${API_BASE_URL}/trades/${id}/`);
  return handleResponse<Trade>(response);
};

export const createTrade = async (
  trade: Omit<Trade, 'trade_id' | 'price_difference'>
): Promise<Trade> => {
  const response = await fetch(`${API_BASE_URL}/trades/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trade),
  });
  return handleResponse<Trade>(response);
};

export const deleteTrade = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/trades/${id}/`, {
    method: 'DELETE',
  });
  // We don't expect a JSON response from a successful delete, so we just check if the call was successful.
  if (!response.ok) {
    const error = await response.text();
    console.error('API Error:', error);
    throw new Error(`API request failed with status ${response.status}`);
  }
};
