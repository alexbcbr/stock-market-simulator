<template>
  <div class="trade-list">
    <h2>Trade List</h2>
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
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trade in tradeStore.trades" :key="trade.trade_id">
          <td>{{ trade.trade_id }}</td>
          <td>{{ trade.symbol }}</td>
          <td>{{ trade.customer_name }}</td>
          <td>${{ trade.executed_price.toFixed(2) }}</td>
          <td>${{ trade.open_price_at_execution.toFixed(2) }}</td>
          <td>${{ trade.reference_price_at_execution.toFixed(2) }}</td>
          <td :class="getPriceDiffClass(trade.price_difference)">
            {{ formatPriceDiff(trade.price_difference) }}
          </td>
          <td>
            <button @click="handleDelete(trade.trade_id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTradeStore } from '../stores/trades';

const tradeStore = useTradeStore();

onMounted(() => {
  tradeStore.fetchTrades();
});

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
</style>
