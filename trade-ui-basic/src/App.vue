<template>
  <div class="app-container">
    <Toast />
    <Sidebar />
    <div class="main-content">
      <header>
        <div class="header-content">
          <div class="header-left">
            <img src="/logo/gartner.png" alt="Gartner logo" class="company-logo" />
            <h1>{{ title }}</h1>
          </div>
        </div>
      </header>
      <main>
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Toast from './components/Toast.vue';

const route = useRoute();

const title = computed(() => {
  if (route.name === 'trades') return 'Trade Management';
  if (route.name === 'marketPrices') return 'Stock Market Agentic AI Simulator';
  if (route.name === 'leaderboard') return 'Trade Leaderboard';
  return 'Stock Market Simulator';
});
</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.company-logo {
  height: 40px;
  width: auto;
}

.user-picture {
  height: 40px;
  width: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
</style>
