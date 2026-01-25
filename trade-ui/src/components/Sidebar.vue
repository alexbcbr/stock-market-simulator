<template>
  <aside class="sidebar">
    <div class="sidebar-top">
      <router-link
        to="/"
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
              d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"
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
</style>
