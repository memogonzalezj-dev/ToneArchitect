import { AudioAnalysis } from "../types";

// ── Radix-2 Cooley-Tukey FFT (in-place) ──────────────────────────────────────

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < len >> 1; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i + j + (len >> 1)] * curRe - im[i + j + (len >> 1)] * curIm;
        const vIm = re[i + j + (len >> 1)] * curIm + im[i + j + (len >> 1)] * curRe;
        re[i + j]              = uRe + vRe;  im[i + j]              = uIm + vIm;
        re[i + j + (len >> 1)] = uRe - vRe;  im[i + j + (len >> 1)] = uIm - vIm;
        [curRe, curIm] = [curRe * wRe - curIm * wIm, curRe * wIm + curIm * wRe];
      }
    }
  }
}

function applyHann(buf: Float32Array): Float64Array {
  const out = new Float64Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (buf.length - 1)));
  }
  return out;
}

interface SpectralFrame {
  centroid:  number;
  bassRatio: number;
  midRatio:  number;
  trebRatio: number;
  zcr:       number;
  rms:       number;
}

function analyseFrame(samples: Float32Array, sampleRate: number): SpectralFrame {
  const N = samples.length;
  const re = applyHann(samples);
  const im = new Float64Array(N);
  fft(re, im);

  const halfN = N >> 1;
  const binHz = sampleRate / N;
  const mag = new Float64Array(halfN);
  let totalPower = 0;
  for (let k = 1; k < halfN; k++) {
    mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    totalPower += mag[k];
  }

  let weightedSum = 0;
  for (let k = 1; k < halfN; k++) weightedSum += k * binHz * mag[k];
  const centroidHz = totalPower > 0 ? weightedSum / totalPower : 0;
  const centroid = Math.min(1, centroidHz / 8000);

  let bass = 0, mids = 0, treb = 0;
  for (let k = 1; k < halfN; k++) {
    const hz = k * binHz;
    if      (hz < 300)  bass += mag[k];
    else if (hz < 3000) mids += mag[k];
    else                treb += mag[k];
  }
  const bandSum = bass + mids + treb || 1;

  let zc = 0;
  for (let i = 1; i < N; i++) {
    if ((samples[i] >= 0) !== (samples[i - 1] >= 0)) zc++;
  }
  const zcr = Math.min(1, zc / N / 0.5);

  let sumSq = 0;
  for (let i = 0; i < N; i++) sumSq += samples[i] * samples[i];
  const rms = Math.sqrt(sumSq / N);

  return { centroid, bassRatio: bass / bandSum, midRatio: mids / bandSum, trebRatio: treb / bandSum, zcr, rms };
}

function envelopeFeatures(pcm: Float32Array, sampleRate: number) {
  const hopSize = Math.floor(sampleRate * 0.02);
  const envelope: number[] = [];
  for (let i = 0; i < pcm.length - hopSize; i += hopSize) {
    let sumSq = 0;
    for (let j = 0; j < hopSize; j++) sumSq += pcm[i + j] ** 2;
    envelope.push(Math.sqrt(sumSq / hopSize));
  }
  let peak = 1e-9;
  for (let i = 0; i < envelope.length; i++) if (envelope[i] > peak) peak = envelope[i];
  const norm = envelope.map((v) => v / peak);
  const tail = norm.slice(Math.floor(norm.length * 0.5));
  const tailMean = tail.reduce((a, b) => a + b, 0) / (tail.length || 1);
  const reverb = Math.min(1, tailMean * 3);
  let delayPresent = false;
  const maxLag = Math.min(150, Math.floor(norm.length / 2));
  for (let lag = 20; lag < maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < norm.length - lag; i++) corr += norm[i] * norm[i + lag];
    corr /= (norm.length - lag);
    if (corr > 0.15) { delayPresent = true; break; }
  }
  return { reverb, delayPresent };
}

function compressionEstimate(pcm: Float32Array): number {
  let peak = 1e-9;
  let sumSq = 0;
  for (let i = 0; i < pcm.length; i++) {
    const a = Math.abs(pcm[i]);
    if (a > peak) peak = a;
    sumSq += a * a;
  }
  const rms = Math.sqrt(sumSq / pcm.length);
  const crest = peak / (rms || 1e-9);
  return Math.max(0, Math.min(1, 1 - (crest - 1) / 15));
}

function saturationEstimate(frames: SpectralFrame[]): number {
  const avgZcr      = frames.reduce((a, f) => a + f.zcr,      0) / (frames.length || 1);
  const avgCentroid = frames.reduce((a, f) => a + f.centroid,  0) / (frames.length || 1);
  return Math.min(1, avgZcr * 0.6 + avgCentroid * 0.4);
}

function buildDescription(a: Omit<AudioAnalysis, "description">): string {
  const parts: string[] = [];
  if      (a.distortion > 0.65) parts.push("heavily saturated / high-gain tone");
  else if (a.distortion > 0.4)  parts.push("moderate overdrive / crunch");
  else                          parts.push("clean or lightly driven tone");
  if      (a.brightness > 0.65) parts.push("bright and trebly character");
  else if (a.brightness < 0.3)  parts.push("dark / warm character");
  else                          parts.push("balanced mid-range character");
  if (a.bass > 0.45)            parts.push("prominent low end");
  if (a.treble > 0.35)          parts.push("elevated high-frequency content");
  if      (a.compression > 0.65) parts.push("heavily compressed / sustained");
  else if (a.compression > 0.35) parts.push("moderately compressed");
  if      (a.reverb > 0.55)     parts.push("significant reverb / ambience");
  else if (a.reverb > 0.25)     parts.push("light reverb");
  if (a.delayPresent)           parts.push("delay / echo present");
  if (a.saturation > 0.6)       parts.push("rich harmonic distortion");
  return parts.join(", ") + ".";
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function analyzeAudio(source: File | ArrayBuffer): Promise<AudioAnalysis> {
  const ctx = new AudioContext();
  const arrayBuffer = source instanceof File ? await source.arrayBuffer() : source;
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();

  const pcm = audioBuffer.getChannelData(0);
  const sr  = audioBuffer.sampleRate;

  const frameSize = 4096;
  const hop = frameSize >> 1;
  const frames: SpectralFrame[] = [];
  for (let start = 0; start + frameSize < pcm.length; start += hop) {
    frames.push(analyseFrame(pcm.slice(start, start + frameSize), sr));
  }
  if (frames.length === 0) throw new Error("Audio file too short to analyse.");

  const avg = (key: keyof SpectralFrame) =>
    frames.reduce((a, f) => a + (f[key] as number), 0) / frames.length;

  const distortion  = avg("zcr");
  const brightness  = avg("centroid");
  const bass        = avg("bassRatio");
  const mids        = avg("midRatio");
  const treble      = avg("trebRatio");
  const compression = compressionEstimate(pcm);
  const saturation  = saturationEstimate(frames);
  const { reverb, delayPresent } = envelopeFeatures(pcm, sr);

  const partial = { distortion, brightness, bass, mids, treble, reverb, delayPresent, compression, saturation };
  return { ...partial, description: buildDescription(partial) };
}

export async function analyzeYoutubeAudio(url: string): Promise<AudioAnalysis> {
  const uint8 = await window.electronAPI.downloadYoutubeAudio(url);
  const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
  return analyzeAudio(arrayBuffer);
}
