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
          :disabled="submitting"
          maxlength="4"
          placeholder="e.g. AAPL"
          @input="trade.symbol = trade.symbol.toUpperCase(); symbolError = ''"
        />
        <small class="field-hint">4-character uppercase symbol</small>
        <small v-if="symbolError" class="field-error">{{ symbolError }}</small>
      </div>
      <div class="form-group">
        <label for="customer_name">Customer Name</label>
        <input
          type="text"
          id="customer_name"
          v-model="trade.customer_name"
          required
          :disabled="submitting"
          placeholder="Enter customer name"
          @input="tradeStore.setCustomerName(trade.customer_name)"
        />
      </div>
      <div class="form-group">
        <label>Price Mode</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" value="manual" v-model="priceMode" :disabled="submitting" />
            Manual
          </label>
          <label class="radio-label">
            <input type="radio" value="market" v-model="priceMode" :disabled="submitting" />
            Market
          </label>
          <label class="radio-label">
            <input type="radio" value="agent" v-model="priceMode" :disabled="submitting" />
            Agent
          </label>
        </div>
      </div>
      <div v-if="priceMode === 'manual'" class="form-group">
        <label for="bid_price">Bid Price</label>
        <input
          type="number"
          id="bid_price"
          v-model.number="trade.bid_price"
          required
          :disabled="submitting"
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>
      <button type="submit" :disabled="submitting">{{ submitting ? 'Submitting...' : 'Submit Trade' }}</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTradeStore } from '../stores/trades';
import type { BuyStockRequest } from '../services/api';

const tradeStore = useTradeStore();
const priceMode = ref<'manual' | 'agent' | 'market'>('manual');
const symbolError = ref('');
const submitting = ref(false);
const trade = ref({
  symbol: '',
  customer_name: '',
  bid_price: 0,
});

const handleSubmit = async () => {
  if (submitting.value) return;

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

  if (priceMode.value === 'manual' && trade.value.bid_price < 0) {
    alert('Bid price cannot be negative.');
    return;
  }

  const request: BuyStockRequest = {
    symbol: trade.value.symbol,
    customer_name: trade.value.customer_name,
    price_mode: priceMode.value,
    ...(priceMode.value === 'manual' ? { bid_price: trade.value.bid_price } : {}),
  };

  submitting.value = true;
  symbolError.value = '';
  try {
    await tradeStore.addTrade(request);
    trade.value.bid_price = 0;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      symbolError.value = 'Symbol is not available';
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.field-hint {
  display: block;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.field-error {
  display: block;
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
  font-weight: 600;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
</style>
