<template>
  <div class="market-price-list">
    <div class="header">
      <h2>Trading Day: January 21, 2026</h2>
      <button @click="handleRefresh" class="refresh-btn">Refresh Prices</button>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Open Price</th>
            <th>Highest Price</th>
            <th>Lowest Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="price in marketPriceStore.marketPrices" :key="price.symbol">
            <td class="symbol-cell">
              <SymbolLink :symbol="price.symbol" />
              <button
                class="copy-btn"
                :title="'Copy ' + price.symbol"
                @click.stop="copySymbol(price.symbol)"
              >
                <svg v-if="copiedSymbol !== price.symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </td>
            <td>
              <button class="price-link" @click="openPriceChart(price)">
                ${{ price.open_price.toFixed(2) }}
              </button>
            </td>
            <td>${{ price.highest_price.toFixed(2) }}</td>
            <td>${{ price.lowest_price.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <OpenPriceModal ref="openPriceModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMarketPriceStore } from '../stores/marketPrices';
import SymbolLink from './SymbolLink.vue';
import OpenPriceModal from './OpenPriceModal.vue';

const marketPriceStore = useMarketPriceStore();
const copiedSymbol = ref('');
const openPriceModal = ref<InstanceType<typeof OpenPriceModal>>();

interface MarketPrice {
  symbol: string;
  open_price: number;
  highest_price: number;
  lowest_price: number;
}

const copySymbol = async (symbol: string) => {
  await navigator.clipboard.writeText(symbol);
  copiedSymbol.value = symbol;
  setTimeout(() => { copiedSymbol.value = ''; }, 1500);
};

const handleRefresh = () => {
  marketPriceStore.fetchMarketPrices();
};

const openPriceChart = (price: MarketPrice) => {
  openPriceModal.value?.openModal(
    price.symbol,
    price.open_price,
    price.highest_price,
    price.lowest_price,
  );
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

.symbol-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: #888;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  line-height: 0;
}

.copy-btn svg {
  width: 13px;
  height: 13px;
}

tr:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: #ccc;
}

.price-link {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  font-weight: 500;
  text-decoration: none;
}

.price-link:hover {
  text-decoration: underline;
  color: #1d4ed8;
}

.price-link:active {
  color: #1e40af;
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (hover: none) {
  .copy-btn {
    opacity: 1;
  }
}
</style>
