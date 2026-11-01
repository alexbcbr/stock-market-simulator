<template>
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h2>Intraday Price Range: {{ symbol }}</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="chart-meta">
          <span class="meta-item"><span class="meta-label">Open</span><span class="meta-value">${{ openPrice.toFixed(2) }}</span></span>
          <span class="meta-sep">|</span>
          <span class="meta-item"><span class="meta-label">High</span><span class="meta-value high">${{ highestPrice.toFixed(2) }}</span></span>
          <span class="meta-sep">|</span>
          <span class="meta-item"><span class="meta-label">Low</span><span class="meta-value low">${{ lowestPrice.toFixed(2) }}</span></span>
        </div>
        <div class="chart-wrapper" ref="chartWrapper">
          <canvas
            ref="canvasRef"
            @mousemove="onMouseMove"
            @mouseleave="onMouseLeave"
          ></canvas>
          <div
            v-if="tooltip.visible"
            class="tooltip"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
          >
            ${{ tooltip.value.toFixed(2) }}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="refreshChart" class="btn-refresh">Refresh</button>
        <button @click="closeModal" class="btn-close">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

const showModal = ref(false);
const symbol = ref('');
const openPrice = ref(0);
const highestPrice = ref(0);
const lowestPrice = ref(0);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartWrapper = ref<HTMLElement | null>(null);

const POINT_COUNT = 60;
const PL = 64, PR = 16, PT = 20, PB = 38;

let dataPoints: number[] = [];
let hoverIndex = -1;

const tooltip = ref({ visible: false, x: 0, y: 0, value: 0 });

function generateData(low: number, high: number, start: number): number[] {
  const mid = (low + high) / 2;
  const range = high - low;
  const pts: number[] = [start];
  for (let i = 1; i < POINT_COUNT; i++) {
    const last = pts[i - 1]!;
    const reversion = (mid - last) * 0.05;
    const noise = (Math.random() * 2 - 1) * range * 0.06;
    const next = last + reversion + noise;
    pts.push(Math.min(high, Math.max(low, next)));
  }
  return pts;
}

function px(i: number, CW: number): number {
  return PL + (i / (POINT_COUNT - 1)) * CW;
}

function py(v: number, CH: number, low: number, high: number): number {
  const norm = (v - low) / (high - low);
  return PT + CH - norm * CH;
}

function draw(hIdx: number) {
  const canvas = canvasRef.value;
  if (!canvas || dataPoints.length < 2) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const low = lowestPrice.value;
  const high = highestPrice.value;

  ctx.fillStyle = '#080c10';
  ctx.fillRect(0, 0, W, H);

  // Horizontal grid lines
  ctx.strokeStyle = '#151c24';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PT + (CH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(PL, y);
    ctx.lineTo(W - PR, y);
    ctx.stroke();
  }

  // Vertical grid lines
  ctx.strokeStyle = '#111820';
  for (let i = 0; i <= 6; i++) {
    const x = PL + (i / 6) * CW;
    ctx.beginPath();
    ctx.moveTo(x, PT);
    ctx.lineTo(x, PT + CH);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PL, PT + CH); ctx.lineTo(W - PR, PT + CH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, PT + CH); ctx.stroke();

  // Y-axis labels (5 ticks)
  ctx.fillStyle = '#5a6a7a';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const fraction = i / 4;
    const price = low + fraction * (high - low);
    const y = PT + CH - fraction * CH;
    ctx.fillText('$' + price.toFixed(2), PL - 5, y + 3);
  }

  // Filled gradient under line
  const grad = ctx.createLinearGradient(0, PT, 0, PT + CH);
  grad.addColorStop(0, '#00e67655');
  grad.addColorStop(0.6, '#00e67618');
  grad.addColorStop(1, '#00e67600');
  ctx.beginPath();
  ctx.moveTo(px(0, CW), py(dataPoints[0]!, CH, low, high));
  for (let i = 1; i < dataPoints.length; i++) {
    ctx.lineTo(px(i, CW), py(dataPoints[i]!, CH, low, high));
  }
  ctx.lineTo(px(dataPoints.length - 1, CW), PT + CH);
  ctx.lineTo(px(0, CW), PT + CH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Glow
  ctx.beginPath();
  for (let i = 0; i < dataPoints.length; i++) {
    const x = px(i, CW);
    const y = py(dataPoints[i]!, CH, low, high);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#00e67640';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Main line
  ctx.beginPath();
  for (let i = 0; i < dataPoints.length; i++) {
    const x = px(i, CW);
    const y = py(dataPoints[i]!, CH, low, high);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#00e676';
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Cursor
  if (hIdx >= 0 && hIdx < dataPoints.length) {
    const cx = px(hIdx, CW);
    const cy = py(dataPoints[hIdx]!, CH, low, high);

    // Vertical crosshair line
    ctx.beginPath();
    ctx.moveTo(cx, PT);
    ctx.lineTo(cx, PT + CH);
    ctx.strokeStyle = '#ffffff30';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Horizontal crosshair line
    ctx.beginPath();
    ctx.moveTo(PL, cy);
    ctx.lineTo(W - PR, cy);
    ctx.strokeStyle = '#ffffff20';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#00e67633';
    ctx.fill();
    // Dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00e676';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function resize() {
  const canvas = canvasRef.value;
  const wrapper = chartWrapper.value;
  if (!canvas || !wrapper) return;
  canvas.width = wrapper.clientWidth;
  canvas.height = Math.round(wrapper.clientWidth * 0.32);
  draw(hoverIndex);
}

function onMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas || dataPoints.length === 0) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const CW = canvas.width - PL - PR;
  const rawIndex = ((mouseX - PL) / CW) * (POINT_COUNT - 1);
  const idx = Math.round(Math.max(0, Math.min(POINT_COUNT - 1, rawIndex)));
  hoverIndex = idx;
  draw(idx);

  const scaleY = canvas.height / rect.height;
  const CH = canvas.height - PT - PB;
  const cy = py(dataPoints[idx]!, CH, lowestPrice.value, highestPrice.value);
  const canvasY = cy / scaleY;

  // Position tooltip to the right of cursor, flip if too close to right edge
  const tipX = e.clientX - rect.left + 12;
  const tipY = canvasY - 14;
  tooltip.value = {
    visible: true,
    x: tipX,
    y: tipY,
    value: dataPoints[idx]!,
  };
}

function onMouseLeave() {
  hoverIndex = -1;
  tooltip.value.visible = false;
  draw(-1);
}

const openModal = async (sym: string, open: number, high: number, low: number) => {
  symbol.value = sym;
  openPrice.value = open;
  highestPrice.value = high;
  lowestPrice.value = low;
  dataPoints = generateData(low, high, open);
  hoverIndex = -1;
  showModal.value = true;
  await nextTick();
  resize();
  window.addEventListener('resize', resize);
};

const refreshChart = () => {
  dataPoints = generateData(lowestPrice.value, highestPrice.value, openPrice.value);
  hoverIndex = -1;
  tooltip.value.visible = false;
  draw(-1);
};

const closeModal = () => {
  showModal.value = false;
  window.removeEventListener('resize', resize);
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
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #0d1117;
  border: 1px solid #1e2d3d;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  max-width: 680px;
  width: 92%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #1e2d3d;
  background-color: #0a0f16;
  border-radius: 10px 10px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #c9d1d9;
  font-family: monospace;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #5a6a7a;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  color: #c9d1d9;
}

.modal-body {
  padding: 1.2rem 1.5rem;
}

.chart-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-family: monospace;
  font-size: 0.85rem;
}

.meta-item {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.meta-label {
  color: #5a6a7a;
}

.meta-value {
  color: #c9d1d9;
  font-weight: 600;
}

.meta-value.high {
  color: #00e676;
}

.meta-value.low {
  color: #ef4444;
}

.meta-sep {
  color: #2a3a4a;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  background: #080c10;
  border-radius: 6px;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  cursor: crosshair;
}

.tooltip {
  position: absolute;
  background: #1a2535;
  border: 1px solid #2a3a4a;
  color: #00e676;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #1e2d3d;
  background-color: #0a0f16;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  border-radius: 0 0 10px 10px;
}

.btn-refresh {
  background-color: #0d2a1a;
  color: #00e676;
  border: 1px solid #00e67640;
  padding: 0.4rem 1.2rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: monospace;
}

.btn-refresh:hover {
  background-color: #0f3520;
  border-color: #00e676;
}

.btn-close {
  background-color: #1e2d3d;
  color: #8a9aaa;
  border: 1px solid #2a3a4a;
  padding: 0.4rem 1.2rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: monospace;
}

.btn-close:hover {
  background-color: #2a3a4a;
  color: #c9d1d9;
}
</style>
