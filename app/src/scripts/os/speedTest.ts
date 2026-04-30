import { notify, getNotifI18n } from './notifications';
import { track } from './achievements';
import { getEl } from './utils';
import { registerReset } from './window/lifecycle';
import { W } from '../../data/os-apps';

type TestState = 'idle' | 'running' | 'complete' | 'error';

const MEASUREMENTS = [
  { type: 'latency' as const, numPackets: 1 },
  { type: 'download' as const, bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: 'latency' as const, numPackets: 20 },
  { type: 'download' as const, bytes: 1e6, count: 4 },
  { type: 'download' as const, bytes: 1e7, count: 2 },
  { type: 'upload' as const, bytes: 1e5, count: 4 },
  { type: 'upload' as const, bytes: 1e6, count: 2 },
];

// Quality thresholds for bar fill percentage
const DL_MAX = 500; // Mbps — bar at 100% if >= 500
const UL_MAX = 100; // Mbps
const LAT_GOOD = 10; // ms — bar at 100% if <= 10, 0% if >= 200
const LAT_MAX = 200;
const JIT_GOOD = 2;
const JIT_MAX = 50;

const QUALITY_COLORS: Record<string, string> = {
  bad: '#ef4444',
  poor: '#f97316',
  average: '#eab308',
  good: '#22c55e',
  great: '#06b6d4',
};

let engine: any = null;
let state: TestState = 'idle';

function setStatus(text: string) {
  const el = getEl('st-status');
  if (el) el.textContent = text;
}

function setMetricValue(metricId: string, value: string) {
  const container = getEl(metricId);
  if (!container) return;
  const valEl = container.querySelector('.st-metric-value');
  if (valEl) valEl.textContent = value;
}

function setBarFill(barId: string, pct: number, color?: string) {
  const bar = getEl(barId) as HTMLElement | null;
  if (!bar) return;
  const clamped = Math.max(0, Math.min(100, pct));
  bar.style.width = `${clamped}%`;
  if (color) bar.style.background = color;
}

function getBarColor(pct: number): string {
  if (pct >= 80) return QUALITY_COLORS.good;
  if (pct >= 50) return QUALITY_COLORS.average;
  if (pct >= 25) return QUALITY_COLORS.poor;
  return QUALITY_COLORS.bad;
}

function updateDownload(bps: number | undefined) {
  if (bps === undefined) return;
  const mbps = bps / 1e6;
  setMetricValue('st-download', mbps.toFixed(1));
  const pct = (mbps / DL_MAX) * 100;
  setBarFill('st-download-bar', pct, getBarColor(pct));
}

function updateUpload(bps: number | undefined) {
  if (bps === undefined) return;
  const mbps = bps / 1e6;
  setMetricValue('st-upload', mbps.toFixed(1));
  const pct = (mbps / UL_MAX) * 100;
  setBarFill('st-upload-bar', pct, getBarColor(pct));
}

function updateLatency(ms: number | undefined) {
  if (ms === undefined) return;
  setMetricValue('st-latency', Math.round(ms).toString());
  // Invert: low latency = good = high bar
  const pct =
    ms <= LAT_GOOD
      ? 100
      : ms >= LAT_MAX
        ? 5
        : ((LAT_MAX - ms) / (LAT_MAX - LAT_GOOD)) * 100;
  setBarFill('st-latency-bar', pct, getBarColor(pct));
}

function updateJitter(ms: number | undefined) {
  if (ms === undefined) return;
  setMetricValue('st-jitter', Math.round(ms).toString());
  const pct =
    ms <= JIT_GOOD
      ? 100
      : ms >= JIT_MAX
        ? 5
        : ((JIT_MAX - ms) / (JIT_MAX - JIT_GOOD)) * 100;
  setBarFill('st-jitter-bar', pct, getBarColor(pct));
}

function showQuality(
  scores:
    | Record<string, { classificationName: string; classificationIdx: number }>
    | undefined
) {
  const container = getEl('st-quality');
  if (!container || !scores) return;
  container.style.display = '';

  const t = getI18n();

  // Use 'streaming' score as primary, fallback to first available
  const score = scores.streaming || scores[Object.keys(scores)[0]];
  if (!score) return;

  const { classificationName, classificationIdx } = score;
  const dots = container.querySelectorAll('.st-dot');
  const color = QUALITY_COLORS[classificationName] || QUALITY_COLORS.average;

  dots.forEach((dot, i) => {
    (dot as HTMLElement).style.background =
      i <= classificationIdx ? color : 'rgba(255,255,255,0.1)';
  });

  // Use translated label
  const label = container.querySelector('.st-quality-label');
  if (label) {
    label.textContent = t.quality[classificationName] || classificationName;
    (label as HTMLElement).style.color = color;
  }

  // Update menubar WiFi (no color, just level) and persist
  updateMenuBarWifi('quality', classificationIdx);
  saveWifiState({ mode: 'quality', qualityIdx: classificationIdx });
}

function resetUI() {
  ['st-download', 'st-upload', 'st-latency', 'st-jitter'].forEach((id) => {
    setMetricValue(id, '\u2014');
  });
  [
    'st-download-bar',
    'st-upload-bar',
    'st-latency-bar',
    'st-jitter-bar',
  ].forEach((id) => {
    setBarFill(id, 0);
  });
  const quality = getEl('st-quality');
  if (quality) quality.style.display = 'none';
}

/** Read i18n strings from data attributes on the window element. */
function getI18n() {
  const win = getEl('speed-test-window');
  if (!win)
    return {
      ready: '',
      testing: '',
      complete: '',
      failed: '',
      btnRun: '',
      btnRunning: '',
      btnRetry: '',
      quality: {} as Record<string, string>,
    };
  const d = (win as HTMLElement).dataset;
  return {
    ready: d.stReady || '',
    testing: d.stTesting || '',
    complete: d.stComplete || '',
    failed: d.stFailed || '',
    btnRun: d.stBtnRun || '',
    btnRunning: d.stBtnRunning || '',
    btnRetry: d.stBtnRetry || '',
    quality: {
      bad: d.stQBad || 'Bad',
      poor: d.stQPoor || 'Poor',
      average: d.stQAverage || 'Average',
      good: d.stQGood || 'Good',
      great: d.stQGreat || 'Great',
    } as Record<string, string>,
  };
}

/* ---- LocalStorage persistence for menubar WiFi state ---- */
const WIFI_STORAGE_KEY = 'os-wifi-quality';

interface WifiState {
  mode: 'unknown' | 'error' | 'quality';
  qualityIdx?: number;
}

function saveWifiState(ws: WifiState) {
  try {
    localStorage.setItem(WIFI_STORAGE_KEY, JSON.stringify(ws));
  } catch {
    /* ignore */
  }
}

function loadWifiState(): WifiState | null {
  try {
    const raw = localStorage.getItem(WIFI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Update the menubar WiFi icon arcs and badge.
 * - unknown: all arcs dim, badge "?" (initial, no data)
 * - error: all arcs dim, badge "!"
 * - running: all arcs dim, badge hidden
 * - quality: arcs lit by level (no color change, just opacity), badge hidden
 */
/** Map classificationIdx back to key name for i18n lookup. */
const IDX_TO_KEY = ['bad', 'poor', 'average', 'good', 'great'];

function updateMenuBarWifi(
  mode: 'unknown' | 'error' | 'running' | 'quality',
  qualityIdx?: number
) {
  const badge = getEl('mb-wifi-badge');
  const tooltip = getEl('mb-wifi-tooltip');
  const arcs = document.querySelectorAll<SVGElement>('.mb-wifi-arc');
  const t = getI18n();

  if (mode === 'unknown') {
    arcs.forEach((a) => {
      a.style.opacity = '0.25';
    });
    if (badge) {
      badge.style.opacity = '1';
      badge.textContent = '?';
    }
    if (tooltip) tooltip.textContent = t.ready || 'Wi-Fi';
  } else if (mode === 'error') {
    arcs.forEach((a) => {
      a.style.opacity = '0.25';
    });
    if (badge) {
      badge.style.opacity = '1';
      badge.textContent = '!';
    }
    if (tooltip) tooltip.textContent = t.failed || 'Error';
  } else if (mode === 'running') {
    arcs.forEach((a) => {
      a.style.opacity = '0.25';
    });
    if (badge) badge.style.opacity = '0';
    if (tooltip) tooltip.textContent = t.testing || '...';
  } else if (mode === 'quality' && qualityIdx !== undefined) {
    const thresholds = [3, 2, 0];
    arcs.forEach((a, i) => {
      a.style.opacity = qualityIdx >= thresholds[i] ? '1' : '0.15';
    });
    if (badge) badge.style.opacity = '0';
    const key = IDX_TO_KEY[qualityIdx] || 'average';
    if (tooltip) tooltip.textContent = `Wi-Fi — ${t.quality[key] || key}`;
  }
}

function setState(newState: TestState) {
  state = newState;
  const btn = getEl('st-btn') as HTMLButtonElement | null;
  const icon = document.querySelector('.st-icon') as HTMLElement | null;
  const quality = getEl('st-quality');
  const t = getI18n();

  switch (state) {
    case 'idle':
      setStatus(t.ready);
      if (btn) {
        btn.textContent = t.btnRun;
        btn.disabled = false;
        btn.style.display = '';
      }
      if (icon) icon.classList.remove('st-icon--pulse');
      if (quality) quality.style.display = 'none';
      // Don't touch menubar WiFi — keep last known state
      break;
    case 'running':
      setStatus(t.testing);
      if (btn) {
        btn.textContent = t.btnRunning;
        btn.disabled = true;
        btn.style.display = '';
      }
      if (icon) icon.classList.add('st-icon--pulse');
      if (quality) quality.style.display = 'none';
      updateMenuBarWifi('running');
      break;
    case 'complete':
      setStatus(t.complete);
      if (btn) btn.style.display = 'none';
      if (icon) icon.classList.remove('st-icon--pulse');
      // Menubar WiFi updated by showQuality()
      break;
    case 'error':
      setStatus(t.failed);
      if (btn) {
        btn.textContent = t.btnRetry;
        btn.disabled = false;
        btn.style.display = '';
      }
      if (icon) icon.classList.remove('st-icon--pulse');
      if (quality) quality.style.display = 'none';
      updateMenuBarWifi('error');
      saveWifiState({ mode: 'error' });
      break;
  }
}

export function resetSpeedTest() {
  // Stop any running engine
  if (engine) {
    try {
      engine.pause();
    } catch {
      /* ignore */
    }
    engine = null;
  }
  resetUI();
  setState('idle');
  // Note: does NOT reset menubar WiFi — it keeps the last known result
}

async function runTest() {
  if (state === 'running') return;

  resetUI();
  setState('running');

  let SpeedTest: any;
  try {
    const mod = await import('@cloudflare/speedtest');
    SpeedTest = mod.default;
  } catch {
    setState('error');
    return;
  }

  engine = new SpeedTest({
    autoStart: true,
    measurements: MEASUREMENTS,
    logAimApiUrl: '',
  });

  // Safety timeout — abort if the test takes too long (e.g. localhost/CORS issues)
  const timeout = setTimeout(() => {
    if (engine && state === 'running') {
      try {
        engine.pause();
      } catch {
        /* ignore */
      }
      engine = null;
      setState('error');
    }
  }, 60_000);

  engine.onResultsChange = ({ type }: { type: string }) => {
    if (!engine) return;
    const summary = engine.results.getSummary();

    if (type === 'latency') {
      updateLatency(summary.latency);
      updateJitter(summary.jitter);
    }
    if (type === 'download') {
      updateDownload(summary.download);
      if (summary.downLoadedLatency) updateLatency(summary.downLoadedLatency);
    }
    if (type === 'upload') {
      updateUpload(summary.upload);
    }
  };

  engine.onFinish = (results: any) => {
    clearTimeout(timeout);
    const summary = results.getSummary();
    updateDownload(summary.download);
    updateUpload(summary.upload);
    updateLatency(summary.latency);
    updateJitter(summary.jitter);

    try {
      const scores = results.getScores();
      showQuality(scores);
    } catch {
      // Scores may not be available — that's ok
    }

    setState('complete');
    track('speedtest-run');
    engine = null;

    // Notify on completion
    const qualityEl = document.querySelector('.st-quality-label');
    const qualityLabel = qualityEl?.textContent || '';
    const nt = getNotifI18n();
    if (nt.speedTestTitle) {
      notify(
        nt.speedTestTitle,
        (nt.speedTestBody || '').replace('{quality}', qualityLabel),
        undefined,
        'speed-test-window'
      );
    }
  };

  engine.onError = () => {
    clearTimeout(timeout);
    setState('error');
    engine = null;
  };
}

export function initSpeedTest() {
  const btn = getEl('st-btn');
  if (btn) btn.addEventListener('click', runTest);

  const retry = getEl('st-retry');
  if (retry) retry.addEventListener('click', runTest);

  // Restore menubar WiFi from saved state
  const saved = loadWifiState();
  if (saved) {
    updateMenuBarWifi(saved.mode, saved.qualityIdx);
  } else {
    updateMenuBarWifi('unknown');
  }

  registerReset(W.SPEED_TEST, resetSpeedTest);
}
