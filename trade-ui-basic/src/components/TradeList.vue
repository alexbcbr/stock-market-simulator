<template>
  <div class="trade-list">
    <div class="header">
      <h2>{{ tradeStore.customerName ? `${tradeStore.customerName}'s Trades` : "All Users' Trades" }}</h2>
      <button @click="handleRefresh" class="refresh-btn">Refresh Transaction List</button>
    </div>
    <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th class="col-id">ID</th>
          <th>Symbol</th>
          <th>Customer</th>
          <th>Order Price</th>
          <th class="col-open-price">Open Price</th>
          <th>Profit</th>
          <th>Buy</th>
          <th>Sell</th>
          <th>Source</th>
          <th class="col-timestamp">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trade in tradeStore.trades" :key="trade.trade_id">
          <td class="col-id">{{ trade.trade_id }}</td>
          <td><SymbolLink :symbol="trade.symbol" /></td>
          <td>{{ trade.customer_name }}</td>
          <td>${{ trade.executed_price.toFixed(2) }}</td>
          <td class="col-open-price">${{ trade.open_price.toFixed(2) }}</td>
          <td :class="trade.status_sell ? getPriceDiffClass(trade.price_difference) : ''">
            {{ trade.status_sell ? formatPriceDiff(trade.price_difference) : '' }}
          </td>
          <td>
            <span v-if="trade.status_trade" class="status-complete" title="Complete">&#10004;</span>
            <span v-else class="status-pending" title="Pending">&#9711;</span>
          </td>
          <td>
            <span v-if="trade.status_sell" class="status-complete" title="Sold">&#10004;</span>
            <button v-else-if="trade.status_trade" class="sell-link" @click="handleSell(trade)">Sell</button>
          </td>
          <td class="source-cell">
            <button
              class="source-btn"
              :class="{ 'source-btn-inactive': !trade.status_trade, 'source-btn-no-link': trade.trade_source === 'manual' || trade.trade_source === 'market' }"
              :disabled="!trade.status_trade || trade.trade_source === 'manual' || trade.trade_source === 'market'"
              @click="openTerminal(trade)"
              :title="!trade.status_trade ? 'Transaction not completed' : trade.trade_source !== 'manual' && trade.trade_source !== 'market' ? 'View agent transaction log' : undefined"
            >
              <!-- Manual: person -->
              <svg v-if="trade.trade_source === 'manual'" class="source-svg source-manual" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="7" r="4" />
                <path d="M12 13c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
              </svg>
              <!-- Market: chart -->
              <svg v-else-if="trade.trade_source === 'market'" class="source-svg source-market" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.5 18.5l6-6 4 4L22 6.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                <path d="M17 6.5h5v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </svg>
              <!-- Agent Conservative: robot purple -->
              <svg v-else-if="trade.trade_source === 'agent_conservative'" class="source-svg source-agent-conservative" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="8" width="14" height="12" rx="3" />
                <circle cx="9" cy="14" r="1.5" fill="#fff" />
                <circle cx="15" cy="14" r="1.5" fill="#fff" />
                <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
                <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <!-- Agent Moderate: robot yellow -->
              <svg v-else-if="trade.trade_source === 'agent_moderate'" class="source-svg source-agent-moderate" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="8" width="14" height="12" rx="3" />
                <circle cx="9" cy="14" r="1.5" fill="#fff" />
                <circle cx="15" cy="14" r="1.5" fill="#fff" />
                <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
                <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <!-- Agent Aggressive (+ legacy 'agent'): robot red -->
              <svg v-else-if="trade.trade_source === 'agent_aggressive' || trade.trade_source === 'agent'" class="source-svg source-agent-aggressive" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="8" width="14" height="12" rx="3" />
                <circle cx="9" cy="14" r="1.5" fill="#fff" />
                <circle cx="15" cy="14" r="1.5" fill="#fff" />
                <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#fff" />
                <line x1="2" y1="13" x2="5" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <line x1="19" y1="13" x2="22" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <!-- Fallback -->
              <span v-else class="source-icon">&#10067;</span>
            </button>
          </td>
          <td class="col-timestamp">{{ trade.trade_timestamp }}</td>
        </tr>
      </tbody>
    </table>
    </div>

    <AgentTerminalModal ref="terminalModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTradeStore } from '../stores/trades';
import SymbolLink from './SymbolLink.vue';
import AgentTerminalModal from './AgentTerminalModal.vue';
import type { Trade } from '../services/api';

const tradeStore = useTradeStore();
const terminalModal = ref<InstanceType<typeof AgentTerminalModal>>();

const openTerminal = (trade: Trade) => {
  terminalModal.value?.openModal(trade);
};

const handleSell = async (trade: Trade) => {
  try {
    await tradeStore.sellTrade(trade.trade_id, trade.trade_timestamp);
  } catch {
    // Notification already shown by the store; nothing else to do here.
  }
};

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

.sell-link {
  background: none;
  border: none;
  padding: 0;
  color: #dc3545;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: inherit;
  font-family: inherit;
}

.sell-link:hover {
  text-decoration: underline;
}

.source-cell {
  text-align: center;
}

.source-btn {
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.source-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.08);
}

.source-btn-inactive {
  opacity: 0.35;
  cursor: default;
}

.source-btn-no-link {
  cursor: default;
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

.source-agent-conservative {
  color: #6f42c1;
}

.source-agent-moderate {
  color: #f5a623;
}

.source-agent-aggressive {
  color: #dc3545;
}

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
