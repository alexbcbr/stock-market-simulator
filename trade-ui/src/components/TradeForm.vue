<template>
  <div class="trade-form">
    <h2>Submit a Buy Order</h2>
    <form @submit.prevent="handleSubmit">
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
        <label for="symbol">Symbol</label>
        <input
          type="text"
          id="symbol"
          v-model="trade.symbol"
          required
          :disabled="submitting"
          maxlength="4"
          placeholder="e.g. NVDA"
          @input="trade.symbol = trade.symbol.toUpperCase(); symbolError = ''"
        />
        <small class="field-hint">4-character uppercase symbol</small>
        <small v-if="symbolError" class="field-error">{{ symbolError }}</small>
      </div>
      <div class="form-group">
        <label>Trading Strategy</label>
        <div class="radio-group-box">
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" value="manual" v-model="priceMode" :disabled="submitting" />
            Manual
            <svg class="mode-svg mode-manual" viewBox="0 0 24 24" fill="currentColor" title="Manual">
              <circle cx="12" cy="7" r="4" />
              <path d="M12 13c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
            </svg>
          </label>
          <label class="radio-label">
            <input type="radio" value="market" v-model="priceMode" :disabled="submitting" />
            Market
            <svg class="mode-svg mode-market" viewBox="0 0 24 24" fill="currentColor" title="Market">
              <path d="M3.5 18.5l6-6 4 4L22 6.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              <path d="M17 6.5h5v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </svg>
          </label>
          <label class="radio-label">
            <input type="radio" value="agent_conservative" v-model="priceMode" :disabled="submitting" />
            AI Agent Conservative
            <svg class="mode-svg mode-agent-conservative" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="8" width="14" height="12" rx="3" />
              <circle cx="9" cy="14" r="1.5" fill="#fff" />
              <circle cx="15" cy="14" r="1.5" fill="#fff" />
              <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
              <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="agent-tooltip">
              <strong>System prompt:</strong> You are a cautious trading agent. Always place bids well below the current market price. Prioritize capital preservation over execution speed. Avoid risk at all costs.
            </span>
          </label>
          <label class="radio-label">
            <input type="radio" value="agent_moderate" v-model="priceMode" :disabled="submitting" />
            AI Agent Moderate
            <svg class="mode-svg mode-agent-moderate" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="8" width="14" height="12" rx="3" />
              <circle cx="9" cy="14" r="1.5" fill="#fff" />
              <circle cx="15" cy="14" r="1.5" fill="#fff" />
              <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
              <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="agent-tooltip">
              <strong>System prompt:</strong> You are a balanced trading agent. Place bids at a fair market price, weighing both opportunity and risk equally. Aim for consistent, steady returns.
            </span>
          </label>
          <label class="radio-label">
            <input type="radio" value="agent_aggressive" v-model="priceMode" :disabled="submitting" />
            AI Agent Aggressive
            <svg class="mode-svg mode-agent-aggressive" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="8" width="14" height="12" rx="3" />
              <circle cx="9" cy="14" r="1.5" fill="#fff" />
              <circle cx="15" cy="14" r="1.5" fill="#fff" />
              <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
              <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="agent-tooltip">
              <strong>System prompt:</strong> You are an assertive trading agent. Bid at the most competitive price to maximize trade execution. Prioritize capturing every opportunity over minimizing risk.
            </span>
          </label>
        </div>
        </div>
      </div>
      <div v-if="priceMode === 'manual'" class="form-group">
        <label for="bid_price">Bid Price ($)</label>
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
const priceMode = ref<'manual' | 'market' | 'agent_conservative' | 'agent_moderate' | 'agent_aggressive'>('manual');
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
    const isAgent = priceMode.value.startsWith('agent_');
    if (isAgent) await new Promise(resolve => setTimeout(resolve, 2000));
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

.radio-group-box {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: #fafafa;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.mode-svg {
  width: 18px;
  height: 18px;
  vertical-align: middle;
}

.mode-manual {
  color: #17a2b8;
}

.mode-market {
  color: #28a745;
}

.mode-agent-conservative {
  color: #6f42c1;
}

.radio-label {
  position: relative;
}

.agent-tooltip {
  display: none;
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  width: 280px;
  background: #1e1e2e;
  color: #cdd6f4;
  border: 1px solid #45475a;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.radio-label:hover .agent-tooltip,
.radio-label:focus-within .agent-tooltip {
  display: block;
}

.mode-agent-moderate {
  color: #f5a623;
}

.mode-agent-aggressive {
  color: #dc3545;
}
</style>
