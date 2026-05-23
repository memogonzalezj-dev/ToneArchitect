/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HelixBlock {
  key: string;
  type: string;
  model: string;
  parameters: Record<string, number | boolean | string>;
  description: string;
  position: number;
}

export interface TonePreset {
  name: string;
  artist: string;
  songOrAlbum: string;
  blocks: HelixBlock[];
  explanation: string;
  manualInstructions: string;
}

export interface ToneRequest {
  query: string;
  guitarType?: string;
  hasExtraPedals: boolean;
  pedalboardImage?: string; // base64
  audioSample?: string; // base64
}

export interface PullProgress {
  status: string;
  percent: number;
  done: boolean;
}

export interface AudioAnalysis {
  distortion:   number;   // 0-1: zero-crossing rate (high = more distortion)
  brightness:   number;   // 0-1: spectral centroid normalized
  bass:         number;   // 0-1: energy ratio below 300 Hz
  mids:         number;   // 0-1: energy ratio 300 Hz – 3 kHz
  treble:       number;   // 0-1: energy ratio above 3 kHz
  reverb:       number;   // 0-1: envelope decay tail estimate
  delayPresent: boolean;  // autocorrelation peak above threshold
  compression:  number;   // 0-1: dynamic range compression
  saturation:   number;   // 0-1: harmonic distortion estimate
  description:  string;   // human-readable text for the Llama prompt
}

export interface ElectronAPI {
  hasApiKey: () => Promise<boolean>;
  getApiKey: () => Promise<string | null>;
  setApiKey: (key: string) => Promise<boolean>;
  deleteApiKey: () => Promise<void>;
  savePreset: (filename: string, content: string) => Promise<{ success: boolean }>;
  checkLlamaReady: () => Promise<boolean>;
  checkModelAvailable: () => Promise<boolean>;
  downloadModel: () => Promise<void>;
  generatePreset: (config: {
    system: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }) => Promise<string>;
  onModelProgress: (callback: (data: PullProgress) => void) => void;
  onProgress?: (callback: (data: PullProgress) => void) => void;
  submitFeedback: (payload: {
    timestamp:       string;
    device:          string;
    query:           string;
    preset_name:     string;
    blocks:          number;
    rating:          number;
    feedback:        string;
    app_version:     string;
    trainingConsent: boolean;
    preset_json:     string;
  }) => Promise<{ success: boolean }>;
  getConsent:           () => Promise<boolean | null>;
  setConsent:           (value: boolean) => Promise<boolean>;
  downloadYoutubeAudio: (url: string) => Promise<Uint8Array>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
