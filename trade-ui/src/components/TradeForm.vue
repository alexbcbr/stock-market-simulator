<template>
  <div class="trade-form">
    <h2>Submit New Trade</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="symbol">Symbol</label>
        <input
          type="text"
          id="symbol"
          v-model="trade.symbol"
          required
          maxlength="4"
          placeholder="e.g. AAPL"
          @input="trade.symbol = trade.symbol.toUpperCase()"
        />
        <small class="field-hint">4-character uppercase symbol</small>
      </div>
      <div class="form-group">
        <label for="customer_name">Customer Name</label>
        <input
          type="text"
          id="customer_name"
          v-model="trade.customer_name"
          required
          placeholder="Enter customer name"
        />
      </div>
      <div class="form-group">
        <label for="executed_price">Executed Price</label>
        <input
          type="number"
          id="executed_price"
          v-model.number="trade.executed_price"
          required
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>
      <div class="form-group">
        <label for="open_price_at_execution">Open Price at Execution</label>
        <input
          type="number"
          id="open_price_at_execution"
          v-model.number="trade.open_price_at_execution"
          required
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>
      <div class="form-group">
        <label for="reference_price_at_execution">Reference Price at Execution</label>
        <input
          type="number"
          id="reference_price_at_execution"
          v-model.number="trade.reference_price_at_execution"
          required
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>
      <button type="submit">Submit Trade</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTradeStore } from '../stores/trades';
import type { Trade } from '../services/api';

const tradeStore = useTradeStore();
const trade = ref<Omit<Trade, 'trade_id' | 'price_difference'>>({
  symbol: '',
  customer_name: '',
  executed_price: 0,
  open_price_at_execution: 0,
  reference_price_at_execution: 0,
});

const handleSubmit = async () => {
  // Validation checks
  if (trade.value.symbol.length !== 4) {
    alert('Symbol must be exactly 4 characters.');
    return;
  }

  if (trade.value.symbol !== trade.value.symbol.toUpperCase()) {
    alert('Symbol must be uppercase.');
    return;
  }

  if (!trade.value.customer_name.trim()) {
    alert('Customer name is required.');
    return;
  }

  if (trade.value.executed_price < 0) {
    alert('Executed price cannot be negative.');
    return;
  }

  if (trade.value.open_price_at_execution < 0) {
    alert('Open price at execution cannot be negative.');
    return;
  }

  if (trade.value.reference_price_at_execution < 0) {
    alert('Reference price at execution cannot be negative.');
    return;
  }

  await tradeStore.addTrade({ ...trade.value });

  // Reset form
  trade.value = {
    symbol: '',
    customer_name: '',
    executed_price: 0,
    open_price_at_execution: 0,
    reference_price_at_execution: 0,
  };
};
</script>

<style scoped>
.field-hint {
  display: block;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}
</style>
