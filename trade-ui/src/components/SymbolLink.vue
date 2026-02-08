<template>
  <div>
    <button @click="handleClick" class="symbol-link">
      {{ symbol }}
    </button>
    <MarketSymbolModal ref="symbolModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MarketSymbolModal from './MarketSymbolModal.vue';

const props = defineProps<{
  symbol: string;
}>();

const symbolModal = ref<InstanceType<typeof MarketSymbolModal>>();

const handleClick = () => {
  symbolModal.value?.openModal(props.symbol);
};
</script>

<style scoped>
.symbol-link {
  background: none;
  border: none;
  color: #2563eb;
  text-decoration: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  font-weight: 600;
}

.symbol-link:hover {
  text-decoration: underline;
  color: #1d4ed8;
}

.symbol-link:active {
  color: #1e40af;
}
</style>
