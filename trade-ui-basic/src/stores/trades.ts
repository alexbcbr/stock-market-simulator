import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { Trade, BuyStockRequest } from '../services/api';
import { useNotificationStore } from './notifications';

export const useTradeStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([]);
  const customerName = ref('');
  const isAvailable = ref(true);

  const fetchTrades = async () => {
    try {
      const fetched = await api.getTrades();
      // Sort by trade_timestamp in descending order (newest first)
      trades.value = fetched.sort((a, b) => b.trade_timestamp.localeCompare(a.trade_timestamp));
      isAvailable.value = true;
    } catch {
      isAvailable.value = false;
      useNotificationStore().showError('This operation is not available at this moment.');
    }
  };

  const fetchTradesByCustomerName = async (name: string) => {
    try {
      const fetched = await api.listTradesByCustomerName(name);
      // Backends return newest first; sort again for consistency
      trades.value = fetched.sort((a, b) => b.trade_timestamp.localeCompare(a.trade_timestamp));
      isAvailable.value = true;
    } catch {
      isAvailable.value = false;
      useNotificationStore().showError('This operation is not available at this moment.');
    }
  };

  const setCustomerName = (name: string) => {
    customerName.value = name;
  };

  const addTrade = async (request: BuyStockRequest) => {
    try {
      await api.buyStock(request);
    } catch (error) {
      useNotificationStore().showError('This operation is not available at this moment.');
      throw error;
    }
    if (customerName.value) {
      await fetchTradesByCustomerName(customerName.value);
    } else {
      await fetchTrades();
    }
  };

  const sellTrade = async (tradeId: string, tradeTimestamp: string) => {
    try {
      await api.sellStock(tradeId, tradeTimestamp);
    } catch (error) {
      useNotificationStore().showError('This operation is not available at this moment.');
      throw error;
    }
    if (customerName.value) {
      await fetchTradesByCustomerName(customerName.value);
    } else {
      await fetchTrades();
    }
  };

  return {
    trades,
    customerName,
    isAvailable,
    fetchTrades,
    fetchTradesByCustomerName,
    setCustomerName,
    addTrade,
    sellTrade,
  };
});
