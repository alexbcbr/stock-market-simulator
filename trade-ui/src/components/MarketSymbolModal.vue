<template>
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h2>Symbol Information: {{ symbolData?.symbol }}</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading">Loading symbol information...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="symbolData" class="symbol-details">
          <div class="detail-row">
            <span class="label">Symbol:</span>
            <span class="value">{{ symbolData.symbol }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Name:</span>
            <span class="value">{{ symbolData.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Last Sale:</span>
            <span class="value">${{ symbolData.lastSale }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Market Cap:</span>
            <span class="value">{{ symbolData.marketCap }}</span>
          </div>
          <div class="detail-row">
            <span class="label">IPO Year:</span>
            <span class="value">{{ symbolData.ipoYear }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Sector:</span>
            <span class="value">{{ symbolData.sector }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Industry:</span>
            <span class="value">{{ symbolData.industry }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Source:</span>
            <a :href="symbolData.summaryQuote" target="_blank" class="value link">{{ symbolData.summaryQuote }}</a>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="closeModal" class="btn-close">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import * as api from '../services/api';
import type { MarketSymbol } from '../services/api';

const showModal = ref(false);
const selectedSymbol = ref<string>('');
const symbolData = ref<MarketSymbol | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const openModal = async (symbol: string) => {
  selectedSymbol.value = symbol;
  showModal.value = true;
  loading.value = true;
  error.value = null;
  
  try {
    symbolData.value = await api.getMarketSymbol(symbol);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    if (errorMessage.includes('404')) {
      error.value = `We don't have additional information about the symbol ${symbol}.`;
    } else {
      error.value = `Failed to load symbol information for ${symbol}. ${errorMessage}`;
    }
  } finally {
    loading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  symbolData.value = null;
  error.value = null;
};

defineExpose({ openModal });
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.error {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #dc2626;
}

.symbol-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #374151;
}

.value {
  color: #1f2937;
}

.link {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}

.link:hover {
  text-decoration: underline;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  text-align: right;
}

.btn-close {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-close:hover {
  background-color: #4b5563;
}
</style>
