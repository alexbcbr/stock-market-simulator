import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notifications', () => {
  const message = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const showError = (text: string) => {
    message.value = text;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      message.value = null;
    }, 4000);
  };

  const clear = () => {
    message.value = null;
    if (timer) clearTimeout(timer);
  };

  return { message, showError, clear };
});
