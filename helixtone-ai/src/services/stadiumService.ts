// ── Helix Stadium preset generator (.hsp format) ──────────────────────────────
//
// The Stadium uses a completely different schema from .hlx (Helix LT/Floor/Stomp).
// Key differences:
//   • File prefix: "rpshnosj" (fixed magic bytes, verified from two real exports)
//   • Block keys: b00–b13 inside a flow[] array (not dsp0.block0)
//   • Params wrapped: { "Drive": { "value": 0.5 } } (not flat values)
//   • Snapshots: 8-element arrays inline per param, plus top-level snapshots array
//   • Amp models: Agoura_ prefix   (not HD2_)
//   • FX models:  HD2_*Mono/Stereo  (not plain HD2_)
//   • EQ models:  HX2_ prefix
//   • Cab models: HD2_CabMicIr_*WithPan
//   • I/O models: P35_ prefix
//   • flow[0]: main signal chain  (b00 input → FX → amp → cab → FX → b13 output)
//   • flow[1]: always fixed       (no-input → looper → matrix output)

import { TonePreset, HelixBlock } from "../types";
import { DeviceConfig } from "../config/devices";

const HSP_MAGIC = "rpshnosj";

// ── Slot positions in flow[0] ─────────────────────────────────────────────────
const PRE_AMP_SLOTS  = [1, 2, 3, 4];          // b01–b04
const AMP_SLOT       = 5;                      // b05 (always)
const CAB_SLOT       = 6;                      // b06 (always, linked to amp)
const POST_AMP_SLOTS = [7, 8, 9, 10, 11];     // b07–b11
const FS_SOURCE_BASE = 16843008;               // first footswitch source ID

// ── Block type routing ────────────────────────────────────────────────────────
const PRE_AMP_TYPES  = new Set(["dynamics", "wah", "filter", "pitch", "distortion"]);

// ── Param helpers ─────────────────────────────────────────────────────────────
type HspValue    = { value: number | boolean | string };
type HspParams   = Record<string, HspValue>;

function wrapParams(raw: Record<string, number | boolean | string>): HspParams {
  const out: HspParams = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = { value: v };
  }
  return out;
}

// ── Signal chain partitioning ─────────────────────────────────────────────────
function partitionBlocks(blocks: HelixBlock[]): {
  preAmp:  HelixBlock[];
  amp:     HelixBlock | null;
  cab:     HelixBlock | null;
  postAmp: HelixBlock[];
} {
  const preAmp:  HelixBlock[] = [];
  const postAmp: HelixBlock[] = [];
  let amp: HelixBlock | null = null;
  let cab: HelixBlock | null = null;

  for (const b of blocks) {
    const t = b.type.toLowerCase();
    if      (t === "amp") amp = b;
    else if (t === "cab") cab = b;
    else if (PRE_AMP_TYPES.has(t)) preAmp.push(b);
    else postAmp.push(b);
  }
  return { preAmp, amp, cab, postAmp };
}

// ── Block builders ────────────────────────────────────────────────────────────

function makeFxBlock(
  position:    number,
  block:       HelixBlock,
  sourceIndex: number,
): Record<string, unknown> {
  return {
    "@enabled": {
      value: true,
      snapshots: [true, true, true, true, true, true, true, true],
      controller: {
        type:       "targetbypass",
        source:     FS_SOURCE_BASE + sourceIndex,
        behavior:   "latching",
        min:        false,
        max:        true,
        curve:      "linear",
        delay:      0,
        threshold:  0,
        bypassed:   false,
        midisource: 0,
        goid:       0,
      },
    },
    favorite: 0,
    harness: {
      "@enabled": { value: true },
      params: {
        EvtIdx: { value: -1 },
        bypass: { value: false },
        upper:  { value: true },
      },
    },
    path:     0,
    position,
    slot: [{
      "@enabled": { value: true },
      model:   block.model,
      params:  wrapParams(block.parameters as Record<string, number | boolean | string>),
      version: 0,
    }],
    type: "fx",
  };
}

function makeAmpBlock(amp: HelixBlock, hasCab: boolean): Record<string, unknown> {
  return {
    "@enabled": {
      value:     true,
      snapshots: [true, true, true, true, true, true, true, true],
    },
    favorite: 0,
    harness: {
      "@enabled": { value: true },
      params: { EvtIdx: { value: -1 } },
    },
    path:     0,
    position: AMP_SLOT,
    slot: [{
      "@enabled": { value: true },
      model:   amp.model,
      params:  wrapParams(amp.parameters as Record<string, number | boolean | string>),
      version: 0,
    }],
    type: "amp",
    ...(hasCab ? { linkedblock: { block: "b06", flow: 0 } } : {}),
  };
}

function makeCabBlock(cab: HelixBlock): Record<string, unknown> {
  // Stadium cabs always use two slots (stereo mic pair)
  const slot = {
    "@enabled": { value: true },
    model:   cab.model,
    params:  wrapParams(cab.parameters as Record<string, number | boolean | string>),
    version: 0,
  };
  return {
    "@enabled": { value: true },
    favorite:   0,
    harness: {
      "@enabled": { value: true },
      params: {
        EvtIdx: { value: -1 },
        bypass: { value: false },
        upper:  { value: true },
      },
    },
    path:     0,
    position: CAB_SLOT,
    slot:     [{ ...slot }, { ...slot }],    // stereo pair
    type:     "cab",
    linkedblock: { block: "b05", flow: 0 },
  };
}

// ── Fixed structures ──────────────────────────────────────────────────────────

function buildFlow1(): Record<string, unknown> {
  return {
    "@enabled": { value: true },
    b00: {
      "@enabled": { value: true },
      endpoint:   "b13",
      favorite:   0,
      harness: { "@enabled": { value: true } },
      path:     0,
      position: 0,
      slot: [{
        "@enabled": { value: true },
        model:   "P35_InputNone",
        params: {
          Trim:       { value: 0 },
          decay:      { value: 0.1 },
          noiseGate:  { value: false },
          threshold:  { value: -48 },
        },
        version: 0,
      }],
      type: "input",
    },
    b12: {
      "@enabled": {
        controller: {
          behavior:   "latching",
          bypassed:   false,
          curve:      "linear",
          delay:      0,
          goid:       0,
          max:        true,
          midisource: 0,
          min:        false,
          source:     16843274,
          threshold:  0,
          type:       "targetbypass",
        },
        snapshots: [true, true, true, true, true, true, true, true],
        value:     true,
      },
      favorite: 0,
      harness: {
        "@enabled": { value: true },
        params: {
          EvtIdx: { value: -1 },
          bypass: { value: false },
          upper:  { value: true },
        },
      },
      path:     0,
      position: 12,
      slot: [{
        "@enabled": { value: true },
        model:   "P35_LooperHelixStereo",
        params: {
          Clear:          { value: 0 },
          ForwardReverse: { value: 0 },
          FullHalfSpeed:  { value: 0 },
          Overdub:        { value: 0 },
          PlayStop:       { value: 0 },
          UndoRedo:       { value: 0 },
        },
        version: 0,
      }],
      type: "looper",
    },
    b13: {
      "@enabled": { value: true },
      endpoint:   "b00",
      favorite:   0,
      harness: { "@enabled": { value: true } },
      path:     0,
      position: 13,
      slot: [{
        "@enabled": { value: true },
        model:   "P35_OutputMatrix",
        params: { gain: { value: 0 }, pan: { value: 0.5 } },
        version: 0,
      }],
      type: "output",
    },
  };
}

/** Fixed sources section — identical in every real .hsp export */
function buildSources(): Record<string, unknown> {
  const src: Record<string, unknown> = {};
  // FX footswitch sources (16843008–16843019)
  for (let i = 0; i < 12; i++) {
    src[String(FS_SOURCE_BASE + i)] = { bypass: false, fs_color: "auto", fs_label: "", fs_topidx: 0 };
  }
  // Snapshot sources (16843264–16843275)
  for (let i = 0; i < 12; i++) {
    src[String(16843264 + i)] = { fs_color: "auto", fs_label: "", fs_topidx: 0 };
  }
  // Misc bypass sources (16843776–16843785)
  for (let i = 0; i < 10; i++) {
    src[String(16843776 + i)] = { bypass: false };
  }
  src["16844032"] = { bypass: false };
  src["16908544"] = { bypass: false };
  src["16908545"] = { bypass: false };
  return src;
}

function buildSnapshots(tempo = 120): unknown[] {
  const names = ["CLEAN", "SNAPSHOT 2", "SNAPSHOT 3", "SNAPSHOT 4",
                 "SNAPSHOT 5", "SNAPSHOT 6", "SNAPSHOT 7", "SNAPSHOT 8"];
  return names.map((name, i) => ({
    color:  "auto",
    expsw:  i === 0 ? 1 : -1,
    name,
    source: 0,
    tempo,
    valid:  true,
  }));
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateHspJson(preset: TonePreset, device: DeviceConfig): string {
  const { preAmp, amp, cab, postAmp } = partitionBlocks(preset.blocks);

  const preAmpBlocks  = preAmp.slice(0,  PRE_AMP_SLOTS.length);
  const postAmpBlocks = postAmp.slice(0, POST_AMP_SLOTS.length);

  // ── Build flow[0] ─────────────────────────────────────────────────────────
  const flow0: Record<string, unknown> = {
    "@enabled": { value: true },

    // Input (always fixed)
    b00: {
      "@enabled": { value: true },
      endpoint:   "b13",
      favorite:   0,
      harness: { "@enabled": { value: true } },
      path:     0,
      position: 0,
      slot: [{
        "@enabled": { value: true },
        model:   "P35_InputInst1",
        params: {
          Pad:       { value: 1 },
          Trim:      { value: 0 },
          decay:     { value: 0.1 },
          noiseGate: { value: false },
          threshold: { value: -48 },
        },
        version: 0,
      }],
      type: "input",
    },
  };

  // Pre-amp FX
  let sourceIndex = 0;
  preAmpBlocks.forEach((block, i) => {
    const pos = PRE_AMP_SLOTS[i];
    flow0[`b${String(pos).padStart(2, "0")}`] = makeFxBlock(pos, block, sourceIndex++);
  });

  // Amp + Cab
  if (amp) flow0["b05"] = makeAmpBlock(amp, cab !== null);
  if (cab) flow0["b06"] = makeCabBlock(cab);

  // Post-amp FX
  postAmpBlocks.forEach((block, i) => {
    const pos = POST_AMP_SLOTS[i];
    flow0[`b${String(pos).padStart(2, "0")}`] = makeFxBlock(pos, block, sourceIndex++);
  });

  // Output (always fixed)
  flow0["b13"] = {
    "@enabled": { value: true },
    endpoint:   "b00",
    favorite:   0,
    harness: { "@enabled": { value: true } },
    path:     0,
    position: 13,
    slot: [{
      "@enabled": { value: true },
      model:   "P35_OutputPath2A",
      params: { gain: { value: 6 }, pan: { value: 0.5 } },
      version: 0,
    }],
    type: "output",
  };

  // ── Assemble preset ───────────────────────────────────────────────────────
  const hsp = {
    meta: {
      color:          "auto",
      device_id:      device.deviceId,
      device_version: device.deviceVersion,
      info:           "",
      name:           preset.name.substring(0, 24),
    },
    preset: {
      clip: { end: 10, filename: "<EMPTY>", path: "USER CLIPS", start: 0 },
      cursor: { flow: 0, path: 0, position: 0 },
      flow:   [flow0, buildFlow1()],
      params: {
        activeexpsw:    1,
        activesnapshot: 0,
        inst1Z:         "FirstEnabled",
        inst2Z:         "FirstEnabled",
        tempo:          120,
      },
      snapshots: buildSnapshots(),
      sources:   buildSources(),
      xyctrl:    { rbtime: 0.5, rubberband: 1, x: 0, y: 0 },
    },
  };

  return HSP_MAGIC + JSON.stringify(hsp, null, 2);
}

// ── Download ──────────────────────────────────────────────────────────────────

export async function downloadStadiumPreset(
  preset: TonePreset,
  device: DeviceConfig,
): Promise<void> {
  const filename = `${preset.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")}.hsp`;
  const content  = generateHspJson(preset, device);

  if (window.electronAPI) {
    await window.electronAPI.savePreset(filename, content);
  } else {
    const blob = new Blob([content], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
