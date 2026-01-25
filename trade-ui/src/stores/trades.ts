import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { Trade } from '../services/api';

export const useTradeStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([]);

  const fetchTrades = async () => {
    trades.value = await api.getTrades();
  };

  const addTrade = async (newTrade: Omit<Trade, 'trade_id' | 'price_difference'>) => {
    const createdTrade = await api.createTrade(newTrade);
    trades.value.push(createdTrade);
  };

  const removeTrade = async (tradeId: number) => {
    await api.deleteTrade(tradeId);
    trades.value = trades.value.filter((t) => t.trade_id !== tradeId);
  };

  return { trades, fetchTrades, addTrade, removeTrade };
});
