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
          <th>Reference Price</th>
          <th>Price Diff</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trade in tradeStore.trades" :key="trade.trade_id">
          <td>{{ trade.trade_id }}</td>
          <td>{{ trade.symbol }}</td>
          <td>{{ trade.customer_name }}</td>
          <td>${{ trade.executed_price.toFixed(2) }}</td>
          <td>${{ trade.open_price.toFixed(2) }}</td>
          <td>${{ trade.close_price.toFixed(2) }}</td>
          <td :class="getPriceDiffClass(trade.price_difference)">
            {{ formatPriceDiff(trade.price_difference) }}
          </td>
          <td>
            <span v-if="trade.status_trade" class="status-complete" title="Complete">&#10004;</span>
            <span v-else class="status-pending" title="Pending">&#9711;</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useTradeStore } from '../stores/trades';

const tradeStore = useTradeStore();

const handleRefresh = () => {
  if (tradeStore.customerName) {
    tradeStore.fetchTradesByCustomerName(tradeStore.customerName);
  } else {
    tradeStore.fetchTrades();
  }
};

const handleDelete = (id: number) => {
  tradeStore.removeTrade(id);
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

.refresh-btn {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  line-height: 1;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.refresh-btn:hover {
  background-color: #0056b3;
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
</style>
