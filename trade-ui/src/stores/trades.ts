import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { Trade, BuyStockRequest } from '../services/api';

export const useTradeStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([]);
  const customerName = ref('');

  const fetchTrades = async () => {
    const fetched = await api.getTrades();
    // Sort by trade_timestamp in descending order (newest first)
    trades.value = fetched.sort((a, b) => b.trade_timestamp.localeCompare(a.trade_timestamp));
  };

  const fetchTradesByCustomerName = async (name: string) => {
    const fetched = await api.listTradesByCustomerName(name);
    // Backends return newest first; sort again for consistency
    trades.value = fetched.sort((a, b) => b.trade_timestamp.localeCompare(a.trade_timestamp));
  };

  const setCustomerName = (name: string) => {
    customerName.value = name;
  };

  const addTrade = async (request: BuyStockRequest) => {
    await api.buyStock(request);
    if (customerName.value) {
      await fetchTradesByCustomerName(customerName.value);
    } else {
      await fetchTrades();
    }
  };

  return { trades, customerName, fetchTrades, fetchTradesByCustomerName, setCustomerName, addTrade };
});
