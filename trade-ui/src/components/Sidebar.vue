<template>
  <aside class="sidebar">
    <div class="sidebar-top">
      <router-link
        to="/market-prices"
        class="sidebar-item"
        :class="{ active: $route.name === 'marketPrices' }"
        title="Market Prices"
      >
        <div class="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="icon"
          >
            <path
              d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"
            />
          </svg>
        </div>
      </router-link>
      <router-link
        to="/trades"
        class="sidebar-item"
        :class="{ active: $route.name === 'trades' }"
        title="Trade Management"
      >
        <div class="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="icon"
          >
            <path
              d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
            />
          </svg>
        </div>
      </router-link>
      <router-link
        to="/leaderboard"
        class="sidebar-item"
        :class="{ active: $route.name === 'leaderboard' }"
        title="Trade Leaderboard"
      >
        <div class="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="icon"
          >
            <path
              d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
            />
          </svg>
        </div>
      </router-link>
    </div>

    <div class="sidebar-bottom">
      <div class="sidebar-item" title="Settings">
        <div class="icon-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="icon"
          >
            <path
              d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
          </svg>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const $route = useRoute();
</script>

<style scoped>
.sidebar {
  width: 56px;
  flex-shrink: 0;
  background-color: #333333;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  position: sticky;
  top: 0;
  z-index: 100;
}

.sidebar-item {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition:
    color 0.2s,
    background-color 0.2s;
  text-decoration: none;
  border-left: 2px solid transparent;
  box-sizing: border-box;
}

.sidebar-item:hover {
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-item.active {
  color: white;
  border-left-color: white;
}

.icon-container {
  width: 28px;
  height: 28px;
}

.icon {
  width: 100%;
  height: 100%;
}

.sidebar-bottom {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: 56px;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
  }

  .sidebar-top {
    display: flex;
    flex-direction: row;
  }

  .sidebar-bottom {
    margin-bottom: 0;
  }

  .sidebar-item {
    border-left: none;
    border-top: 2px solid transparent;
  }

  .sidebar-item.active {
    border-left-color: transparent;
    border-top-color: white;
  }
}
</style>
