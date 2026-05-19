<template>
  <div v-if="showModal" class="terminal-overlay" @click.self="closeModal">
    <div class="terminal-window">
      <div class="terminal-titlebar">
        <div class="terminal-dots">
          <span class="dot dot-red" @click="closeModal"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <span class="terminal-title">trade-agent -- {{ trade?.symbol }} transaction log</span>
      </div>
      <div class="terminal-body" ref="terminalBody">
        <div v-for="(line, idx) in visibleLines" :key="idx" class="terminal-line">
          <span class="prompt" :class="line.agent">{{ line.prefix }}</span>
          <span class="message" :class="line.type">{{ line.text }}</span>
        </div>
        <div v-if="isTyping" class="terminal-line">
          <span class="cursor">█</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { Trade } from '../services/api';

interface LogLine {
  prefix: string;
  text: string;
  agent: 'buyer' | 'seller' | 'system' | 'orchestrator';
  type: 'info' | 'success' | 'warning' | 'error' | 'dim';
}

const showModal = ref(false);
const trade = ref<Trade | null>(null);
const visibleLines = ref<LogLine[]>([]);
const isTyping = ref(false);
const terminalBody = ref<HTMLElement | null>(null);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const scrollToBottom = async () => {
  await nextTick();
  if (terminalBody.value) {
    terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
  }
};

const buildScript = (t: Trade): LogLine[] => {
  const d = new Date(t.trade_timestamp);
  const ts = isNaN(d.getTime()) ? t.trade_timestamp : d.toISOString().replace('T', ' ').substring(0, 19);
  const secondsMatch = t.trade_timestamp.match(/:(\d{2})(?:\.|$|\s|Z)/);
  const seconds = secondsMatch?.[1]
    ? parseInt(secondsMatch[1], 10)
    : (isNaN(d.getTime()) ? 0 : d.getSeconds());
  const n = Math.max(1, Math.floor(seconds / 3));
  const checkingLines: LogLine[] = Array.from({ length: n }, () => ({
    prefix: '[BUYER]   ',
    text: `Checking market position — symbol: ${t.symbol} | order price: $${(Math.random() * 3 * t.executed_price).toFixed(2)}`,
    agent: 'buyer' as const,
    type: 'dim' as const,
  }));

  return [
    { prefix: '[SYS]     ', text: `Session started at ${ts} UTC`, agent: 'system', type: 'dim' },
    { prefix: '[SYS]     ', text: `Trade ID: ${t.trade_id}`, agent: 'system', type: 'dim' },
    { prefix: '', text: '', agent: 'system', type: 'dim' },

    { prefix: '[BUYER]   ', text: `Buyer AI Agent connected.`, agent: 'buyer', type: 'info' },
    { prefix: '[ORCH]    ', text: `Prompt injection detection guardrail invoked.`, agent: 'orchestrator', type: 'success' },
    { prefix: '[BUYER]   ', text: `Authenticating with trade network...`, agent: 'buyer', type: 'dim' },
    { prefix: '[BUYER]   ', text: `Buyer AI Agent authenticated. Identity: ${t.customer_name}`, agent: 'buyer', type: 'success' },
    { prefix: '[BUYER]   ', text: `Buyer AI Agent Planning.`, agent: 'buyer', type: 'dim' },
    { prefix: '', text: '', agent: 'system', type: 'dim' },

    ...checkingLines,
    { prefix: '', text: '', agent: 'system', type: 'dim' },

    { prefix: '[ORCH]    ', text: `Hallucination check guardrail (output) invoked.`, agent: 'orchestrator', type: 'success' },
    { prefix: '[BUYER]   ', text: `Placing order — symbol: ${t.symbol} | order price: $${t.executed_price.toFixed(2)}`, agent: 'buyer', type: 'info' },
    { prefix: '[BUYER]   ', text: `Order submitted to Trader AI Agent.`, agent: 'buyer', type: 'dim' },
    { prefix: '', text: '', agent: 'system', type: 'dim' },

    { prefix: '[SELLER]  ', text: `Trader AI Agent received order for ${t.symbol} at $${t.executed_price.toFixed(2)}.`, agent: 'seller', type: 'info' },
    { prefix: '[SELLER]  ', text: `Validating order against market data...`, agent: 'seller', type: 'dim' },
    { prefix: '[SELLER]  ', text: `Trader AI Agent accepted the order. Order price: $${t.executed_price.toFixed(2)}`, agent: 'seller', type: 'success' },
    { prefix: '', text: '', agent: 'system', type: 'dim' },

    { prefix: '[SYS]     ', text: `Transaction finished. Trade recorded successfully.`, agent: 'system', type: 'success' },
    { prefix: '[SYS]     ', text: `AI Agent communication terminated.`, agent: 'system', type: 'dim' },
  ];
};

const openModal = async (t: Trade) => {
  trade.value = t;
  visibleLines.value = [];
  showModal.value = true;
  isTyping.value = true;

  await nextTick();

  let script: LogLine[];
  try {
    script = buildScript(t);
  } catch {
    visibleLines.value.push({ prefix: '[ERR]     ', text: 'Failed to load transaction log.', agent: 'system', type: 'error' });
    isTyping.value = false;
    return;
  }

  for (const line of script) {
    await sleep(line.text === '' ? 80 : Math.random() * 180 + 60);
    visibleLines.value = [...visibleLines.value, line];
    await scrollToBottom();
  }

  isTyping.value = false;
  await scrollToBottom();
};

const closeModal = () => {
  showModal.value = false;
  visibleLines.value = [];
  trade.value = null;
  isTyping.value = false;
};

defineExpose({ openModal });
</script>

<style scoped>
.terminal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.terminal-window {
  background: #0d0d0d;
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(0, 255, 100, 0.15), 0 8px 32px rgba(0, 0, 0, 0.8);
  width: 760px;
  max-width: 95vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  overflow: hidden;
  border: 1px solid #1a1a1a;
}

.terminal-titlebar {
  background: #1c1c1c;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.terminal-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
}

.dot-red    { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green  { background: #28c840; }

.terminal-title {
  color: #8a8a8a;
  font-size: 0.78rem;
  flex: 1;
  text-align: center;
  user-select: none;
}

.terminal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  background: #0d0d0d;
  min-height: 300px;
  max-height: 60vh;
}

.terminal-body::-webkit-scrollbar {
  width: 6px;
}
.terminal-body::-webkit-scrollbar-track {
  background: #111;
}
.terminal-body::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 3px;
}

.terminal-line {
  display: flex;
  gap: 6px;
  font-size: 0.82rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}

.prompt {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.80rem;
}

.prompt.buyer        { color: #4fc3f7; }
.prompt.seller       { color: #a5d6a7; }
.prompt.system       { color: #555; }
.prompt.orchestrator { color: #ff9800; }

.message.info    { color: #e0e0e0; }
.message.success { color: #69f0ae; }
.message.warning { color: #ffd740; }
.message.error   { color: #ff5252; }
.message.dim     { color: #555; }

.cursor {
  color: #69f0ae;
  animation: blink 0.9s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
</style>
