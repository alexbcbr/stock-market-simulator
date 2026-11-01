import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { Trade, BuyStockRequest } from '../services/api';
import { useNotificationStore } from './notifications';

interface DynamoDBItem {
  trade_id: { S: string };
  symbol: { S: string };
  customer_name: { S: string };
  executed_price: { N: string };
  open_price: { N: string };
  close_price: { N: string };
  price_difference: { N: string };
  status_trade: { BOOL: boolean };
  status_sell: { BOOL: boolean };
  trade_source: { S: string };
  trade_timestamp: { S: string };
}

const transformDynamoDBItem = (item: DynamoDBItem): Trade => ({
  trade_id: item.trade_id.S,
  symbol: item.symbol.S,
  customer_name: item.customer_name.S,
  executed_price: Number(item.executed_price.N),
  open_price: Number(item.open_price.N),
  close_price: Number(item.close_price.N),
  price_difference: Number(item.price_difference.N),
  status_trade: item.status_trade.BOOL,
  status_sell: item.status_sell?.BOOL ?? false,
  trade_source: (item.trade_source?.S || 'manual') as Trade['trade_source'],
  trade_timestamp: item.trade_timestamp.S,
});

export const useTradeStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([]);
  const customerName = ref('');
  const isAvailable = ref(true);

  const fetchTrades = async () => {
    try {
      const rawTrades = await api.getTrades();
      const transformedTrades = (rawTrades as unknown as DynamoDBItem[]).map(transformDynamoDBItem);
      // Sort by trade_timestamp in descending order (newest first)
      trades.value = transformedTrades.sort((a, b) => b.trade_timestamp.localeCompare(a.trade_timestamp));
      isAvailable.value = true;
    } catch {
      isAvailable.value = false;
      useNotificationStore().showError('This operation is not available at this moment.');
    }
  };

  const fetchTradesByCustomerName = async (name: string) => {
    try {
      const rawTrades = await api.listTradesByCustomerName(name);
      const transformedTrades = (rawTrades as unknown as DynamoDBItem[]).map(transformDynamoDBItem);
      // Already sorted by DynamoDB Query with ScanIndexForward: false, but sort again for consistency
      trades.value = transformedTrades.sort((a, b) => b.trade_timestamp.localeCompare(a.trade_timestamp));
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
