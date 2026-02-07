<template>
  <div class="market-price-list">
    <div class="header">
      <h2>Market Closing Prices</h2>
      <button @click="handleRefresh" class="refresh-btn">Refresh Prices</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Open Price</th>
          <th>Close Price</th>
          <th>Highest Price</th>
          <th>Lowest Price</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="price in marketPriceStore.marketPrices" :key="price.symbol">
          <td>{{ price.symbol }}</td>
          <td>${{ price.open_price.toFixed(2) }}</td>
          <td>${{ price.close_price.toFixed(2) }}</td>
          <td>${{ price.highest_price.toFixed(2) }}</td>
          <td>${{ price.lowest_price.toFixed(2) }}</td>
          <td>{{ price.volume.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useMarketPriceStore } from '../stores/marketPrices';

const marketPriceStore = useMarketPriceStore();

const handleRefresh = () => {
  marketPriceStore.fetchMarketPrices();
};

onMounted(() => {
  marketPriceStore.fetchMarketPrices();
});
</script>

<style scoped>
.header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1rem;
}

.header h2 {
  margin: 0;
}
</style>
