import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../services/api';
import type { MarketPrice } from '../services/api';

interface DynamoDBMarketPriceItem {
  symbol: { S: string };
  open_price: { N: string };
  close_price: { N: string };
  highest_price: { N: string };
  lowest_price: { N: string };
  volume: { N: string };
}

const transformDynamoDBItem = (item: DynamoDBMarketPriceItem): MarketPrice => ({
  symbol: item.symbol.S,
  open_price: Number(item.open_price.N),
  close_price: Number(item.close_price.N),
  highest_price: Number(item.highest_price.N),
  lowest_price: Number(item.lowest_price.N),
  volume: Number(item.volume.N),
});

export const useMarketPriceStore = defineStore('marketPrices', () => {
  const marketPrices = ref<MarketPrice[]>([]);

  const fetchMarketPrices = async () => {
    const rawPrices = await api.getMarketPrices();
    marketPrices.value = (rawPrices as unknown as DynamoDBMarketPriceItem[]).map(transformDynamoDBItem);
  };

  return { marketPrices, fetchMarketPrices };
});
