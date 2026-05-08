<template>
  <div class="leaderboard-view">
    <TradeLeaderboard />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import TradeLeaderboard from '../components/TradeLeaderboard.vue';
import { useTradeStore } from '../stores/trades';
import '../assets/leaderboard.css';

const tradeStore = useTradeStore();
onMounted(() => tradeStore.fetchTrades());
</script>
