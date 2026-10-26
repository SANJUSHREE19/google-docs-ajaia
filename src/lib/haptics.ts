/**
 * Tactile feedback & Web Haptics engine.
 * Supports:
 * - Device vibration via navigator.vibrate (phones / tablets / trackpads)
 * - Micro-acoustic tactile feedback via Web Audio API (soft clicks on desktop & mobile)
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('app_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_sound_enabled', String(soundEnabled));
  }
  return soundEnabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playMicroSound(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.04) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.4), ctx.currentTime + duration);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function triggerHaptic(type: 'tap' | 'toggle' | 'success' | 'delete' | 'pop' | 'light' = 'tap') {
  if (typeof window === 'undefined') return;

  // 1. Hardware Vibration Haptics
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'tap':
        case 'light':
          navigator.vibrate(8);
          break;
        case 'toggle':
          navigator.vibrate([12, 40, 12]);
          break;
        case 'pop':
          navigator.vibrate(18);
          break;
        case 'success':
          navigator.vibrate([15, 30, 25]);
          break;
        case 'delete':
          navigator.vibrate([35, 40, 45]);
          break;
      }
    } catch {
      // Ignore vibration error
    }
  }

  // 2. Micro-tactile sound feedback (felt on desktop & headphones)
  switch (type) {
    case 'tap':
    case 'light':
      playMicroSound(420, 0.025, 'sine', 0.03);
      break;
    case 'toggle':
      playMicroSound(650, 0.035, 'triangle', 0.04);
      break;
    case 'pop':
      playMicroSound(880, 0.04, 'sine', 0.05);
      break;
    case 'success':
      playMicroSound(587, 0.04, 'triangle', 0.04);
      setTimeout(() => playMicroSound(880, 0.07, 'sine', 0.05), 45);
      break;
    case 'delete':
      playMicroSound(220, 0.06, 'sawtooth', 0.04);
      break;
  }
}
