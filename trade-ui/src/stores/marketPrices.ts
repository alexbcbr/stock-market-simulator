import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { MarketPrice } from '../services/api';

export const useMarketPriceStore = defineStore('marketPrices', () => {
  const marketPrices = ref<MarketPrice[]>([]);

  const fetchMarketPrices = async () => {
    const rawPrices = await api.getMarketPrices();
    marketPrices.value = rawPrices;
  };

  return { marketPrices, fetchMarketPrices };
});
