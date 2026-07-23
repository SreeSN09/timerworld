/* ============================================
   TimerWorld — script.js
   - Local clock (hero)
   - Stopwatch with lap tracking
   - World clocks with SVG ring animation
   ============================================ */

/* ── Helpers ─────────────────────────────── */

function pad(n, digits = 2) {
  return String(n).padStart(digits, '0');
}

function msToHMS(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h   = Math.floor(totalSec / 3600);
  const m   = Math.floor((totalSec % 3600) / 60);
  const s   = totalSec % 60;
  const mil = ms % 1000;
  return { h, m, s, mil };
}

function formatHMS(ms) {
  const { h, m, s } = msToHMS(ms);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatMs(ms) {
  return pad(ms % 1000, 3);
}

/* ── Local Hero Clock ─────────────────────── */

function updateMainClock() {
  const now = new Date();

  // Time
  const h   = pad(now.getHours());
  const m   = pad(now.getMinutes());
  const s   = pad(now.getSeconds());
  document.getElementById('mainClock').textContent = `${h}:${m}:${s}`;

  // Date — e.g. "Thursday, July 23, 2026"
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('mainDate').textContent = dateStr;

  // Timezone name — e.g. "UTC+5:30 · Asia/Calcutta"
  const tzName  = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset  = -now.getTimezoneOffset();
  const sign    = offset >= 0 ? '+' : '-';
  const offH    = pad(Math.floor(Math.abs(offset) / 60));
  const offM    = pad(Math.abs(offset) % 60);
  document.getElementById('mainTimezone').textContent =
    `UTC${sign}${offH}:${offM}  ·  ${tzName}`;
}

// Tick every second, aligned to the next full second
function startMainClock() {
  updateMainClock();
  const delay = 1000 - (Date.now() % 1000);
  setTimeout(() => {
    updateMainClock();
    setInterval(updateMainClock, 1000);
  }, delay);
}

/* ── Stopwatch ────────────────────────────── */

let swStartTime   = 0;   // timestamp when last started
let swElapsed     = 0;   // ms accumulated before latest start
let swRunning     = false;
let swRAF         = null; // requestAnimationFrame id
let swLaps        = [];
let swLastLapMs   = 0;   // total ms at last lap

const swDisplay   = document.getElementById('stopwatchDisplay');
const btnStart    = document.getElementById('btnStart');
const btnPause    = document.getElementById('btnPause');
const btnReset    = document.getElementById('btnReset');
const btnLap      = document.getElementById('btnLap');
const lapBody     = document.getElementById('lapBody');
const lapContainer= document.getElementById('lapContainer');

function swTick() {
  if (!swRunning) return;
  const total = swElapsed + (Date.now() - swStartTime);
  swDisplay.innerHTML =
    `${formatHMS(total)}<span class="sw-ms">.${formatMs(total)}</span>`;
  swRAF = requestAnimationFrame(swTick);
}

function swStart() {
  if (swRunning) return;
  swRunning   = true;
  swStartTime = Date.now();
  swDisplay.classList.remove('paused');
  swDisplay.classList.add('running');
  btnStart.disabled = true;
  btnPause.disabled = false;
  btnLap.disabled   = false;
  swRAF = requestAnimationFrame(swTick);
}

function swPause() {
  if (!swRunning) return;
  swRunning  = false;
  swElapsed += Date.now() - swStartTime;
  cancelAnimationFrame(swRAF);
  swDisplay.classList.remove('running');
  swDisplay.classList.add('paused');
  btnStart.disabled = false;
  btnPause.disabled = true;
  btnLap.disabled   = true;
}

function swReset() {
  swRunning  = false;
  swElapsed  = 0;
  swLastLapMs= 0;
  swLaps     = [];
  cancelAnimationFrame(swRAF);
  swDisplay.innerHTML = `00:00:00<span class="sw-ms">.000</span>`;
  swDisplay.classList.remove('running', 'paused');
  btnStart.disabled = false;
  btnPause.disabled = true;
  btnLap.disabled   = true;
  lapBody.innerHTML = '';
}

function swLap() {
  if (!swRunning) return;
  const total   = swElapsed + (Date.now() - swStartTime);
  const lapTime = total - swLastLapMs;
  swLastLapMs   = total;
  swLaps.unshift({ num: swLaps.length + 1, lapTime, total }); // newest first

  // Rebuild table
  lapBody.innerHTML = '';
  swLaps.forEach((lap, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${swLaps.length - i}</td>
      <td>${formatHMS(lap.lapTime)}.${formatMs(lap.lapTime)}</td>
      <td>${formatHMS(lap.total)}.${formatMs(lap.total)}</td>
    `;
    lapBody.appendChild(tr);
  });

  // Auto-scroll to top (newest lap)
  lapContainer.scrollTop = 0;
}

/* ── World Clocks ─────────────────────────── */

// Each card has data-tz attribute set by Jinja
const clockCards = document.querySelectorAll('.clock-card');

function updateWorldClocks() {
  clockCards.forEach((card, idx) => {
    const tz = card.getAttribute('data-tz');
    const now = new Date();

    // Locale string for this timezone
    const timeStr = now.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour12: false,
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const dateStr = now.toLocaleDateString('en-US', {
      timeZone: tz,
      weekday: 'short',
      month:   'short',
      day:     'numeric'
    });

    card.querySelector('.world-time').textContent = timeStr;
    card.querySelector('.world-date').textContent = dateStr;

    // ── Ring progress: seconds of the minute (0–59 → 0–283 offset) ──
    const secNow = parseInt(
      now.toLocaleString('en-US', { timeZone: tz, second: '2-digit' })
    );
    const progress = (secNow / 60); // 0..1
    const circumference = 283;
    const offset = circumference - progress * circumference;
    const ring = document.getElementById(`ring-${idx + 1}`);
    if (ring) ring.style.strokeDashoffset = offset.toFixed(2);
  });
}

/* ── Day/Night tint on cards ─────────────── */

function applyDayNightTint() {
  clockCards.forEach(card => {
    const tz = card.getAttribute('data-tz');
    const hourStr = new Date().toLocaleString('en-US', {
      timeZone: tz, hour: '2-digit', hour12: false
    });
    const hour = parseInt(hourStr);
    const isNight = hour < 6 || hour >= 20;
    card.style.background = isNight
      ? 'linear-gradient(135deg, #0a1128, #0d1040)'
      : 'linear-gradient(135deg, #0d1b38, #1a2a50)';
  });
}

/* ── Init ─────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Hero clock
  startMainClock();

  // World clocks — tick every second
  updateWorldClocks();
  applyDayNightTint();
  setInterval(() => {
    updateWorldClocks();
    applyDayNightTint();
  }, 1000);
});
