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
        <label for="executed_price">Bid Price</label>
        <input
          type="number"
          id="executed_price"
          v-model.number="trade.executed_price"
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
import { getMarketPrice } from '../services/api';
import type { BuyStockRequest } from '../services/api';

const tradeStore = useTradeStore();
const priceMode = ref<'manual' | 'agent' | 'market'>('manual');
const symbolError = ref('');
const submitting = ref(false);
const trade = ref({
  symbol: '',
  customer_name: '',
  executed_price: 0,
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

  if (priceMode.value === 'manual' && trade.value.executed_price < 0) {
    alert('Executed price cannot be negative.');
    return;
  }

  // Fetch market price for the symbol
  let openPrice: number;
  let closePrice: number;
  let highestPrice: number;
  let lowestPrice: number;
  try {
    const marketPrice = await getMarketPrice(trade.value.symbol);
    openPrice = marketPrice.open_price;
    closePrice = marketPrice.close_price;
    highestPrice = marketPrice.highest_price;
    lowestPrice = marketPrice.lowest_price;
  } catch {
    symbolError.value = 'Symbol is not available';
    return;
  }

  let executedPrice: number;
  let statusTrade: boolean;

  if (priceMode.value === 'agent') {
    // Agent: random between 70% and 100% of highest_price
    executedPrice = +(highestPrice * (0.7 + Math.random() * 0.3)).toFixed(2);
    statusTrade = true;
  } else if (priceMode.value === 'market') {
    // Market: random between lowest_price and 72% of highest_price
    const ceiling = highestPrice * 0.72;
    executedPrice = +(lowestPrice + Math.random() * (ceiling - lowestPrice)).toFixed(2);
    statusTrade = true;
  } else {
    // Manual: adjust price and status based on thresholds
    const threshold = lowestPrice + 0.45 * (highestPrice - lowestPrice);
    if (trade.value.executed_price < lowestPrice) {
      executedPrice = lowestPrice;
      statusTrade = true;
    } else if (trade.value.executed_price <= threshold) {
      executedPrice = trade.value.executed_price;
      statusTrade = true;
    } else {
      executedPrice = trade.value.executed_price;
      statusTrade = false;
    }
  }

  const request: BuyStockRequest = {
    symbol: trade.value.symbol,
    customer_name: trade.value.customer_name,
    executed_price: executedPrice,
    open_price: openPrice,
    close_price: closePrice,
    status_trade: statusTrade,
  };

  submitting.value = true;
  try {
    await tradeStore.addTrade(request);
    trade.value.executed_price = 0;
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
