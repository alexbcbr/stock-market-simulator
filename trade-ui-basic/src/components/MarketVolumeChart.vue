<template>
  <div class="chart-wrapper">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);

const POINT_COUNT = 78;
const TICK_MS = 80;

// Rolling buffers — always POINT_COUNT entries each
let points: number[] = [];
let pricePoints: number[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

function generateInitial(): number[] {
  return Array.from({ length: POINT_COUNT }, (_, i) => {
    const t = i / (POINT_COUNT - 1);
    const base = Math.pow(2 * t - 1, 2) * 0.55 + 0.2;
    const openSpike = i < 6 ? (1 - i / 6) * 0.35 : 0;
    const noise = (Math.random() * 2 - 1) * 0.12;
    return Math.min(1, Math.max(0.04, base + openSpike + noise));
  });
}

function generateInitialPrice(): number[] {
  return Array.from({ length: POINT_COUNT }, (_, i) => {
    const t = i / (POINT_COUNT - 1);
    const base = 0.3 + Math.sin(t * Math.PI * 1.5) * 0.2;
    const noise = (Math.random() * 2 - 1) * 0.1;
    return Math.min(1, Math.max(0.04, base + noise));
  });
}

function nextPoint(last: number, mean: number): number {
  const reversion = (mean - last) * 0.06;
  const noise = (Math.random() * 2 - 1) * 0.11;
  return Math.min(1, Math.max(0.04, last + reversion + noise));
}

function px(i: number, CW: number, PL: number): number {
  return PL + (i / (POINT_COUNT - 1)) * CW;
}

function py(v: number, CH: number, PT: number): number {
  return PT + CH - v * CH;
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx || points.length < 2 || pricePoints.length < 2) return;

  const W = canvas.width;
  const H = canvas.height;
  const PL = 52, PR = 16, PT = 20, PB = 38;
  const CW = W - PL - PR;
  const CH = H - PT - PB;

  // Background
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
  const vLines = [0, 12, 24, 36, 48, 60, 72, 77];
  ctx.strokeStyle = '#111820';
  for (const b of vLines) {
    const x = px(b, CW, PL);
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

  // Legend
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  const legendItems = [
    { color: '#a855f7', label: 'Volume' },
    { color: '#00e676', label: 'Price' },
  ];
  let lx = PL;
  for (const { color, label } of legendItems) {
    ctx.fillStyle = color;
    ctx.fillRect(lx, 4, 12, 8);
    ctx.fillStyle = '#8a9aaa';
    ctx.fillText(label, lx + 16, 12);
    lx += ctx.measureText(label).width + 36;
  }

  function drawLine(data: number[], color: string, filled: boolean) {
    if (data.length < 2) return;
    const last = data[data.length - 1] ?? 0;

    if (filled) {
      const grad = ctx!.createLinearGradient(0, PT, 0, PT + CH);
      grad.addColorStop(0,   color + '55');
      grad.addColorStop(0.6, color + '18');
      grad.addColorStop(1,   color + '00');
      ctx!.beginPath();
      ctx!.moveTo(px(0, CW, PL), PT + CH);
      for (let i = 0; i < data.length; i++) {
        ctx!.lineTo(px(i, CW, PL), py(data[i] ?? 0, CH, PT));
      }
      ctx!.lineTo(px(data.length - 1, CW, PL), PT + CH);
      ctx!.closePath();
      ctx!.fillStyle = grad;
      ctx!.fill();
    }

    // Glow
    ctx!.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = px(i, CW, PL);
      const y = py(data[i] ?? 0, CH, PT);
      i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
    }
    ctx!.strokeStyle = color + '40';
    ctx!.lineWidth = 6;
    ctx!.lineJoin = 'round';
    ctx!.stroke();

    // Main line
    ctx!.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = px(i, CW, PL);
      const y = py(data[i] ?? 0, CH, PT);
      i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
    }
    ctx!.strokeStyle = color;
    ctx!.lineWidth = 1.8;
    ctx!.lineJoin = 'round';
    ctx!.stroke();

    // Live dot
    const lx = px(data.length - 1, CW, PL);
    const ly = py(last, CH, PT);
    ctx!.beginPath(); ctx!.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx!.fillStyle = color + '33'; ctx!.fill();
    ctx!.beginPath(); ctx!.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx!.fillStyle = color; ctx!.fill();
  }

  // Volume line (purple, filled) drawn first so price line sits on top
  drawLine(points, '#a855f7', true);
  // Market price line (green, no fill)
  drawLine(pricePoints, '#00e676', false);


  // Y-axis rotated label
  ctx.save();
  ctx.translate(13, PT + CH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#3a4a5a';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VOLUME', 0, 0);
  ctx.restore();

  // Y-axis ticks
  ctx.fillStyle = '#3a4a5a';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  [['HIGH', 0], ['MID', CH / 2], ['LOW', CH]].forEach(([label, offset]) => {
    ctx.fillText(label as string, PL - 6, PT + (offset as number) + 3);
  });
}

function startRolling() {
  points = generateInitial();
  pricePoints = generateInitialPrice();
  draw();

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    const lastVol   = points[points.length - 1] ?? 0.38;
    const lastPrice = pricePoints[pricePoints.length - 1] ?? 0.5;
    points.shift();
    points.push(nextPoint(lastVol, 0.38));
    pricePoints.shift();
    pricePoints.push(nextPoint(lastPrice, 0.5));
    draw();
  }, TICK_MS);
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const container = canvas.parentElement;
  if (!container) return;
  canvas.width = container.clientWidth;
  canvas.height = Math.round(container.clientWidth * 0.22);
  draw();
}

onMounted(() => {
  resize();
  window.addEventListener('resize', resize);
  startRolling();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  window.removeEventListener('resize', resize);
});
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  background: #080c10;
  border-radius: 6px;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
}
</style>
