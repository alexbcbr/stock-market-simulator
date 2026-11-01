<template>
  <transition name="toast-fade">
    <div v-if="notificationStore.message" class="toast-banner" role="alert">
      {{ notificationStore.message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../stores/notifications';

const notificationStore = useNotificationStore();
</script>

<style scoped>
.toast-banner {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #dc3545;
  color: #fff;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 1000;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}
</style>
