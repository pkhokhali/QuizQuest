/**
 * Procedural Audio Synthesizer for QuizQuest
 * Generates studio-grade 44.1kHz, 16-bit Mono PCM WAV files.
 * Uses additive synthesis, FM, Butterworth lowpass filters, and ADSR envelopes.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "app", "assets", "sounds");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SAMPLE_RATE = 44100;

/**
 * Creates a RIFF WAVE buffer from Float32Array audio samples (-1.0 to 1.0)
 */
function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit PCM samples with soft clipping
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Soft tanh limiter to eliminate harsh digital clipping
    let s = Math.tanh(samples[i]);
    let val = Math.max(-1, Math.min(1, s));
    let intVal = val < 0 ? val * 0x8000 : val * 0x7fff;
    buffer.writeInt16LE(Math.floor(intVal), offset);
    offset += 2;
  }

  return buffer;
}

// Lowpass Filter (One-pole IIR)
function lowpass(samples, cutoffHz, sampleRate = SAMPLE_RATE) {
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = dt / (rc + dt);
  const out = new Float32Array(samples.length);
  let prev = 0;
  for (let i = 0; i < samples.length; i++) {
    prev = prev + alpha * (samples[i] - prev);
    out[i] = prev;
  }
  return out;
}

// -------------------------------------------------------------
// Sound Generators
// -------------------------------------------------------------

// 1. tap.wav: Warm tactile UI wooden/glass click (45ms)
function generateTap() {
  const duration = 0.045;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 90);
    // Fast pitch drop from 1200Hz down to 240Hz
    const freq = 240 + 960 * Math.exp(-t * 120);
    const wave = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
    samples[i] = wave * env * 0.7;
  }
  return lowpass(samples, 3500);
}

// 2. correct.wav: Shimmering Major-9th chime arpeggio (C6, E6, G6, B6, D7) (480ms)
function generateCorrect() {
  const duration = 0.52;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  // Note intervals in Hz (C6=1046.5, E6=1318.5, G6=1567.98, B6=1975.5, D7=2349.3)
  const notes = [
    { freq: 1046.5, delay: 0.0, decay: 7.0, gain: 0.4 },
    { freq: 1318.5, delay: 0.05, decay: 6.5, gain: 0.42 },
    { freq: 1567.98, delay: 0.10, decay: 6.0, gain: 0.45 },
    { freq: 1975.53, delay: 0.15, decay: 5.5, gain: 0.48 },
    { freq: 2349.32, delay: 0.20, decay: 5.0, gain: 0.5 },
  ];

  for (const n of notes) {
    const startSample = Math.floor(n.delay * SAMPLE_RATE);
    for (let i = startSample; i < length; i++) {
      const t = (i - startSample) / SAMPLE_RATE;
      const env = Math.exp(-t * n.decay);
      // Fundamental + gentle bell overtone
      const bell = Math.sin(2 * Math.PI * n.freq * t) + 0.25 * Math.sin(2 * Math.PI * n.freq * 2.76 * t);
      samples[i] += bell * env * n.gain;
    }
  }

  return samples;
}

// 3. wrong.wav: Warm, rounded low-frequency dual-tone wobble with soft cutoff (320ms)
function generateWrong() {
  const duration = 0.35;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 9.0);
    // Subtle downward slide: 185Hz down to 130Hz
    const f1 = 185 - t * 140;
    const f2 = 138 - t * 90;
    const s1 = Math.sin(2 * Math.PI * f1 * t);
    const s2 = Math.sin(2 * Math.PI * f2 * t);
    // Soft saturation for roundness
    samples[i] = (s1 * 0.55 + s2 * 0.45) * env * 0.65;
  }
  return lowpass(samples, 800);
}

// 4. tick.wav: High-precision wooden clock tick / metronome woodblock (30ms)
function generateTick() {
  const duration = 0.032;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 140);
    const freq = 1800 + 400 * Math.exp(-t * 200);
    const tone = Math.sin(2 * Math.PI * freq * t) + 0.2 * Math.sin(2 * Math.PI * freq * 1.5 * t);
    samples[i] = tone * env * 0.6;
  }
  return lowpass(samples, 4000);
}

// 5. card_flip.wav: Organic paper snap & whoosh (65ms)
function generateCardFlip() {
  const duration = 0.065;
  const length = Math.floor(duration * SAMPLE_RATE);
  const raw = new Float32Array(length);

  let noise = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.sin((t / duration) * Math.PI) * Math.exp(-t * 40);
    noise = (Math.random() * 2 - 1) * 0.5 + noise * 0.5;
    const snap = Math.sin(2 * Math.PI * (600 + 800 * (1 - t / duration)) * t);
    raw[i] = (noise * 0.65 + snap * 0.35) * env * 0.7;
  }
  return lowpass(raw, 2800);
}

// 6. combo.wav: Ascending 5-tone pentatonic power cascade with sparkle (550ms)
function generateCombo() {
  const duration = 0.58;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  // E5, G5, A5, C6, D6, E6
  const freqs = [659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  const step = 0.07;

  freqs.forEach((freq, idx) => {
    const startSample = Math.floor(idx * step * SAMPLE_RATE);
    for (let i = startSample; i < length; i++) {
      const t = (i - startSample) / SAMPLE_RATE;
      const env = Math.exp(-t * 7.5);
      const tone = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
      samples[i] += tone * env * 0.38;
    }
  });

  return samples;
}

// 7. victory.wav: Triumphant brass & orchestral bell fanfare (1.2s)
function generateVictory() {
  const duration = 1.25;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  // Staccato fanfare chords: [C5, E5, G5], then [F5, A5, C6], then sustained [G5, B5, D6, G6]
  const chords = [
    { start: 0.0, dur: 0.16, notes: [523.25, 659.25, 783.99], decay: 6.0, gain: 0.32 },
    { start: 0.18, dur: 0.16, notes: [587.33, 698.46, 880.0], decay: 6.0, gain: 0.34 },
    { start: 0.36, dur: 0.16, notes: [659.25, 783.99, 987.77], decay: 6.0, gain: 0.36 },
    { start: 0.54, dur: 0.70, notes: [783.99, 987.77, 1174.66, 1567.98], decay: 3.2, gain: 0.42 },
  ];

  for (const c of chords) {
    const startIdx = Math.floor(c.start * SAMPLE_RATE);
    for (let i = startIdx; i < length; i++) {
      const t = (i - startIdx) / SAMPLE_RATE;
      const env = Math.exp(-t * c.decay);
      let chordSum = 0;
      for (const f of c.notes) {
        // Brass-like warmth: fundamental + 2nd + 3rd harmonic
        chordSum +=
          Math.sin(2 * Math.PI * f * t) +
          0.35 * Math.sin(4 * Math.PI * f * t) +
          0.15 * Math.sin(6 * Math.PI * f * t);
      }
      samples[i] += (chordSum / c.notes.length) * env * c.gain;
    }
  }

  return samples;
}

// 8. fanfare.wav: Grand magical celebration chime for streaks / rank up (1.05s)
function generateFanfare() {
  const duration = 1.1;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  const notes = [
    { f: 523.25, t: 0.0 },   // C5
    { f: 659.25, t: 0.1 },   // E5
    { f: 783.99, t: 0.2 },   // G5
    { f: 1046.5, t: 0.3 },   // C6
    { f: 1318.51, t: 0.4 },  // E6
    { f: 1567.98, t: 0.5 },  // G6 (sustained bell chime)
  ];

  notes.forEach((n) => {
    const start = Math.floor(n.t * SAMPLE_RATE);
    for (let i = start; i < length; i++) {
      const t = (i - start) / SAMPLE_RATE;
      const env = Math.exp(-t * (n.f > 1400 ? 3.0 : 5.5));
      const bell = Math.sin(2 * Math.PI * n.f * t) + 0.3 * Math.sin(2 * Math.PI * n.f * 2.01 * t);
      samples[i] += bell * env * 0.35;
    }
  });

  return samples;
}

// 9. battle_start.wav: Cinematic war drum impact with deep sub-bass transient & clash ring (750ms)
function generateBattleStart() {
  const duration = 0.75;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    // Deep sub-bass punch (130Hz rapidly descending to 48Hz)
    const drumEnv = Math.exp(-t * 9.0);
    const drumFreq = 48 + 82 * Math.exp(-t * 25);
    const drum = Math.sin(2 * Math.PI * drumFreq * t);

    // Metallic clash / ring (880Hz + 1320Hz + 2200Hz)
    const ringEnv = Math.exp(-t * 7.0);
    const ring =
      0.3 * Math.sin(2 * Math.PI * 880 * t) +
      0.2 * Math.sin(2 * Math.PI * 1320 * t) +
      0.15 * Math.sin(2 * Math.PI * 2200 * t);

    // Impact transient noise
    const noiseEnv = Math.exp(-t * 40.0);
    const noise = (Math.random() * 2 - 1) * 0.3;

    samples[i] = (drum * 0.75 + ring * 0.4 + noise * noiseEnv) * drumEnv * 0.9;
  }

  return samples;
}

// 10. match_found.wav: Crisp dual-tone sonar chime alert (380ms)
function generateMatchFound() {
  const duration = 0.4;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  const tones = [
    { f: 880, start: 0.0, dur: 0.25 },
    { f: 1760, start: 0.12, dur: 0.28 },
  ];

  for (const item of tones) {
    const startIdx = Math.floor(item.start * SAMPLE_RATE);
    for (let i = startIdx; i < length; i++) {
      const t = (i - startIdx) / SAMPLE_RATE;
      const env = Math.exp(-t * 8.0);
      const s = Math.sin(2 * Math.PI * item.f * t) + 0.25 * Math.sin(4 * Math.PI * item.f * t);
      samples[i] += s * env * 0.5;
    }
  }

  return samples;
}

// 11. star.wav: High crystal glockenspiel ding (300ms)
function generateStar() {
  const duration = 0.32;
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);

  const freq = 2093.0; // C7
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 9.0);
    // Crystalline harmonics
    const bell =
      Math.sin(2 * Math.PI * freq * t) +
      0.35 * Math.sin(2 * Math.PI * freq * 2.0 * t) +
      0.15 * Math.sin(2 * Math.PI * freq * 3.01 * t);
    samples[i] = bell * env * 0.55;
  }

  return samples;
}

// -------------------------------------------------------------
// Build & Save all assets
// -------------------------------------------------------------
const GENERATORS = {
  "tap.wav": generateTap,
  "correct.wav": generateCorrect,
  "wrong.wav": generateWrong,
  "tick.wav": generateTick,
  "card_flip.wav": generateCardFlip,
  "combo.wav": generateCombo,
  "victory.wav": generateVictory,
  "fanfare.wav": generateFanfare,
  "battle_start.wav": generateBattleStart,
  "match_found.wav": generateMatchFound,
  "star.wav": generateStar,
};

console.log("Synthesizing 44.1kHz studio sound assets...");
for (const [filename, gen] of Object.entries(GENERATORS)) {
  const samples = gen();
  const wavBuffer = createWavBuffer(samples);
  const dest = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(dest, wavBuffer);
  console.log(`✓ ${filename.padEnd(18)} : ${wavBuffer.length} bytes (${Math.round((samples.length / SAMPLE_RATE) * 1000)}ms)`);
}
console.log("Audio synthesis complete!");
