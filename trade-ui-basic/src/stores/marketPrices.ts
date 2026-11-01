import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { MarketPrice } from '../services/api';
import { useNotificationStore } from './notifications';

interface MarketPriceResponse {
  symbol: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
}

const transformMarketPrice = (item: MarketPriceResponse): MarketPrice => ({
  symbol: item.symbol,
  open_price: item.open_price,
  highest_price: item.high_price,
  lowest_price: item.low_price,
});

export const useMarketPriceStore = defineStore('marketPrices', () => {
  const marketPrices = ref<MarketPrice[]>([]);

  const fetchMarketPrices = async () => {
    try {
      const rawPrices = await api.getMarketPrices();
      marketPrices.value = (rawPrices as unknown as MarketPriceResponse[]).map(transformMarketPrice);
    } catch {
      useNotificationStore().showError('This operation is not available at this moment.');
    }
  };

  return { marketPrices, fetchMarketPrices };
});
