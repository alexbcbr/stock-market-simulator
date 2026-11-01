<template>
  <div class="trades-view">
    <div class="form-container">
      <TradeForm />
    </div>
    <div class="list-container">
      <TradeList />
    </div>
  </div>
</template>

<script setup lang="ts">
import TradeList from '../components/TradeList.vue';
import TradeForm from '../components/TradeForm.vue';
</script>
