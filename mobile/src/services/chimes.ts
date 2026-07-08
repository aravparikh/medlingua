import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/**
 * The recording chimes — the same audible grammar as voicemail prompts, which
 * every senior already knows: rising tones = start talking, falling tones =
 * done. Purely additive feedback (haptics + the recording panel carry the
 * state too), so every failure here is swallowed: a chime must never break
 * a recording.
 */
const START_SOURCE = require('../../assets/chime-start.wav');
const STOP_SOURCE = require('../../assets/chime-stop.wav');

let startPlayer: AudioPlayer | null = null;
let stopPlayer: AudioPlayer | null = null;

function play(which: 'start' | 'stop'): void {
  try {
    if (which === 'start') {
      startPlayer = startPlayer ?? createAudioPlayer(START_SOURCE);
    } else {
      stopPlayer = stopPlayer ?? createAudioPlayer(STOP_SOURCE);
    }
    const player = which === 'start' ? startPlayer : stopPlayer;
    if (!player) return;
    player.seekTo(0);
    player.play();
  } catch {
    // Best-effort by design.
  }
}

/** Rising two-tone: recording has started, speak now. */
export function playStartChime(): void {
  play('start');
}

/** Falling two-tone: recording finished. */
export function playStopChime(): void {
  play('stop');
}

/** Releases the cached players (conversation screen unmount). */
export function releaseChimes(): void {
  try {
    startPlayer?.remove();
    stopPlayer?.remove();
  } catch {
    // Best-effort by design.
  }
  startPlayer = null;
  stopPlayer = null;
}
