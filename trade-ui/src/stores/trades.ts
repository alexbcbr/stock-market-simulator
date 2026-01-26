import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { Trade, BuyStockRequest } from '../services/api';

interface DynamoDBItem {
  trade_id: { S: string };
  symbol: { S: string };
  customer_name: { S: string };
  executed_price: { N: string };
  open_price: { N: string };
  close_price: { N: string };
  price_difference: { N: string };
  status_trade: { BOOL: boolean };
}

const transformDynamoDBItem = (item: DynamoDBItem): Trade => ({
  trade_id: Number(item.trade_id.S),
  symbol: item.symbol.S,
  customer_name: item.customer_name.S,
  executed_price: Number(item.executed_price.N),
  open_price: Number(item.open_price.N),
  close_price: Number(item.close_price.N),
  price_difference: Number(item.price_difference.N),
  status_trade: item.status_trade.BOOL,
});

export const useTradeStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([]);
  const customerName = ref('');

  const fetchTrades = async () => {
    const rawTrades = await api.getTrades();
    trades.value = (rawTrades as unknown as DynamoDBItem[]).map(transformDynamoDBItem);
  };

  const fetchTradesByCustomerName = async (name: string) => {
    const rawTrades = await api.listTradesByCustomerName(name);
    trades.value = (rawTrades as unknown as DynamoDBItem[]).map(transformDynamoDBItem);
  };

  const setCustomerName = (name: string) => {
    customerName.value = name;
  };

  const addTrade = async (request: BuyStockRequest) => {
    const createdTrade = await api.buyStock(request);
    trades.value.push(createdTrade);
  };

  return { trades, customerName, fetchTrades, fetchTradesByCustomerName, setCustomerName, addTrade };
});
