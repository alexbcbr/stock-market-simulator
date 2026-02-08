<template>
  <div class="trade-list">
    <div class="header">
      <h2>Trade List</h2>
      <button @click="handleRefresh" class="refresh-btn">Refresh Transaction List</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Symbol</th>
          <th>Customer</th>
          <th>Executed Price</th>
          <th>Open Price</th>
          <th>Price Diff</th>
          <th>Status</th>
          <th>Source</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trade in tradeStore.trades" :key="trade.trade_id">
          <td>{{ trade.trade_id }}</td>
          <td><SymbolLink :symbol="trade.symbol" /></td>
          <td>{{ trade.customer_name }}</td>
          <td>${{ trade.executed_price.toFixed(2) }}</td>
          <td>${{ trade.open_price.toFixed(2) }}</td>
          <td :class="getPriceDiffClass(trade.price_difference)">
            {{ formatPriceDiff(trade.price_difference) }}
          </td>
          <td>
            <span v-if="trade.status_trade" class="status-complete" title="Complete">&#10004;</span>
            <span v-else class="status-pending" title="Pending">&#9711;</span>
          </td>
          <td class="source-cell">
            <!-- Manual: person -->
            <svg v-if="trade.trade_source === 'manual'" class="source-svg source-manual" :title="trade.trade_source" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="7" r="4" />
              <path d="M12 13c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
            </svg>
            <!-- Market: chart -->
            <svg v-else-if="trade.trade_source === 'market'" class="source-svg source-market" :title="trade.trade_source" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.5 18.5l6-6 4 4L22 6.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              <path d="M17 6.5h5v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </svg>
            <!-- Agent: robot -->
            <svg v-else-if="trade.trade_source === 'agent'" class="source-svg source-agent" :title="trade.trade_source" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="8" width="14" height="12" rx="3" />
              <circle cx="9" cy="14" r="1.5" fill="#fff" />
              <circle cx="15" cy="14" r="1.5" fill="#fff" />
              <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
              <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <!-- Fallback -->
            <span v-else class="source-icon">&#10067;</span>
          </td>
          <td>{{ trade.trade_timestamp }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useTradeStore } from '../stores/trades';
import SymbolLink from './SymbolLink.vue';

const tradeStore = useTradeStore();

const handleRefresh = () => {
  if (tradeStore.customerName) {
    tradeStore.fetchTradesByCustomerName(tradeStore.customerName);
  } else {
    tradeStore.fetchTrades();
  }
};

const formatPriceDiff = (diff: number): string => {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}$${diff.toFixed(2)}`;
};

const getPriceDiffClass = (diff: number): string => {
  if (diff > 0) return 'positive';
  if (diff < 0) return 'negative';
  return 'neutral';
};

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

.positive {
  color: #28a745;
  font-weight: 600;
}

.negative {
  color: #dc3545;
  font-weight: 600;
}

.neutral {
  color: #6c757d;
}

.status-complete {
  color: #28a745;
  font-size: 1.2rem;
  font-weight: bold;
}

.status-pending {
  color: #ffc107;
  font-size: 1.2rem;
  font-weight: bold;
}

.source-cell {
  text-align: center;
}

.source-svg {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

.source-manual {
  color: #17a2b8;
}

.source-market {
  color: #28a745;
}

.source-agent {
  color: #6f42c1;
}
</style>
