<template>
  <div>
    <MarketVolumeChart v-if="tradeStore.isAvailable" class="lb-chart" />
    <div v-else class="lb-chart lb-chart-unavailable">This operation is not available at this moment.</div>
    <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Customer</th>
          <th>Symbol</th>
          <th class="col-open-price">Open Price</th>
          <th>Purchase Price</th>
          <th>Sell Price</th>
          <th>Profit</th>
          <th>Source</th>
          <th class="col-timestamp">Timestamp</th>
          <th class="col-id">ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(trade, index) in sortedTrades" :key="trade.trade_id">
          <td
            class="col-rank"
            :class="{ 'rank-1': index === 0, 'rank-2': index === 1, 'rank-3': index === 2 }"
          >
            {{ index + 1 }}
          </td>
          <td class="col-customer">{{ trade.customer_name }}</td>
          <td class="col-symbol">{{ trade.symbol }}</td>
          <td class="col-price col-open-price">${{ trade.open_price.toFixed(2) }}</td>
          <td class="col-price">${{ trade.executed_price.toFixed(2) }}</td>
          <td class="col-price">${{ trade.close_price.toFixed(2) }}</td>          
          <td :class="getPnlClass(trade.price_difference)">
            <span class="pnl-arrow">{{ getPnlArrow(trade.price_difference) }}</span>
            {{ formatPriceDiff(trade.price_difference) }}
          </td>
          <td class="col-source">
            <!-- Manual: person -->
            <svg v-if="trade.trade_source === 'manual'" class="source-svg source-manual" title="Manual" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="7" r="4" />
              <path d="M12 13c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
            </svg>
            <!-- Market: chart -->
            <svg v-else-if="trade.trade_source === 'market'" class="source-svg source-market" title="Market" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.5 18.5l6-6 4 4L22 6.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              <path d="M17 6.5h5v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </svg>
            <!-- Agent Conservative: robot purple -->
            <svg v-else-if="trade.trade_source === 'agent_conservative'" class="source-svg source-agent-conservative" title="Agent Conservative" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="8" width="14" height="12" rx="3" />
              <circle cx="9" cy="14" r="1.5" fill="#fff" />
              <circle cx="15" cy="14" r="1.5" fill="#fff" />
              <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
              <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <!-- Agent Moderate: robot yellow -->
            <svg v-else-if="trade.trade_source === 'agent_moderate'" class="source-svg source-agent-moderate" title="Agent Moderate" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="8" width="14" height="12" rx="3" />
              <circle cx="9" cy="14" r="1.5" fill="#fff" />
              <circle cx="15" cy="14" r="1.5" fill="#fff" />
              <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
              <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <!-- Agent Aggressive (+ legacy 'agent'): robot red -->
            <svg v-else-if="trade.trade_source === 'agent_aggressive' || trade.trade_source === 'agent'" class="source-svg source-agent-aggressive" title="Agent Aggressive" viewBox="0 0 24 24" fill="currentColor">
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
          <td class="col-dim col-timestamp">{{ trade.trade_timestamp }}</td>
          <td class="col-dim col-id">{{ trade.trade_id }}</td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTradeStore } from '../stores/trades';
import MarketVolumeChart from './MarketVolumeChart.vue';

const tradeStore = useTradeStore();

const sortedTrades = computed(() =>
  tradeStore.trades
    .filter((t) => t.status_trade && t.status_sell)
    .sort((a, b) => b.price_difference - a.price_difference)
);

const formatPriceDiff = (diff: number): string => {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}$${diff.toFixed(2)}`;
};

const getPnlClass = (diff: number): string => {
  if (diff > 0) return 'pnl-positive';
  if (diff < 0) return 'pnl-negative';
  return 'pnl-neutral';
};

const getPnlArrow = (diff: number): string => {
  if (diff > 0) return '▲';
  if (diff < 0) return '▼';
  return '';
};

</script>

<style scoped>
.lb-chart {
  margin-bottom: 1.25rem;
}

.lb-chart-unavailable {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  background: #080c10;
  border-radius: 6px;
  color: #5a6a7a;
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
}

.source-svg {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

.source-manual { color: #17a2b8; }
.source-market { color: #28a745; }
.source-agent-conservative { color: #6f42c1; }
.source-agent-moderate { color: #f5a623; }
.source-agent-aggressive { color: #dc3545; }

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
  .col-id,
  .col-open-price,
  .col-timestamp {
    display: none;
  }
}
</style>
