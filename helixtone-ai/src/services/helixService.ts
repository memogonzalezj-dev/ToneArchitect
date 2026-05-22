import { TonePreset, HelixBlock } from "../types";
import { DeviceConfig, DEFAULT_DEVICE } from "../config/devices";

// Correct signal chain order: pre-fx → amp → cab → post-fx
const BLOCK_TYPE_ORDER: Record<string, number> = {
  dynamics:   0,
  wah:        1,
  filter:     2,
  pitch:      3,
  distortion: 4,
  amp:        5,
  cab:        6,
  eq:         7,
  modulation: 8,
  delay:      9,
  reverb:     10,
  volume:     11,
};

function sortBlocks(blocks: HelixBlock[]): HelixBlock[] {
  return [...blocks].sort((a, b) => {
    const aOrder = BLOCK_TYPE_ORDER[a.type.toLowerCase()] ?? 5;
    const bOrder = BLOCK_TYPE_ORDER[b.type.toLowerCase()] ?? 5;
    return aOrder - bOrder;
  });
}

// Parameters that are always 0.0–1.0 internally (displayed 0–10 in HX Edit).
// Any AI-generated value outside this range for these params gets clamped.
const UNIT_PARAMS = new Set([
  "drive","gain","bass","mid","treble","presence","master","chvol","level",
  "mix","tone","sustain","attack","release","balance","sag","hum","bias","biasx",
  "ripple","sensitivity","depth","rate","speed","feedback","decay","wet","dry",
  "volume","pan","balanceb","balancea","amount","headroom","clarity","warmth",
]);

function sanitizeParameters(
  params: Record<string, number | boolean | string>
): Record<string, number | boolean | string> {
  const out: Record<string, number | boolean | string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "number" && UNIT_PARAMS.has(k.toLowerCase())) {
      // Clamp to 0–1; values like -10 or 10 from the AI are wrong for these params
      out[k] = Math.max(0, Math.min(1, v));
    } else {
      out[k] = v;
    }
  }
  return out;
}

function buildIrUuidTable(): Record<string, string> {
  const table: Record<string, string> = {};
  for (let i = 0; i < 128; i++) {
    table[String(i).padStart(3, "0")] = "";
  }
  return table;
}

function buildSnapshots(blockKeys: string[], count: number): Record<string, unknown> {
  const enabledMap: Record<string, boolean> = {};
  blockKeys.forEach((k) => { enabledMap[k] = true; });

  const snapshot = (name: string, valid: boolean) => ({
    "@name": name,
    "@tempo": 120,
    "@valid": valid,
    "blocks": { "dsp0": { ...enabledMap } },
    "@pedalstate": 0,
    "@ledcolor": 0,
    "@custom_name": false,
  });

  const result: Record<string, unknown> = {};
  for (let i = 0; i < count; i++) {
    result[`snapshot${i}`] = snapshot(`Snapshot ${i + 1}`, i === 0);
  }
  return result;
}

export function generateHlxJson(preset: TonePreset, device: DeviceConfig = DEFAULT_DEVICE): string {
  const dsp0: Record<string, unknown> = {
    inputA: {
      "@input": 1,
      "@model": device.inputModel,
      "noiseGate": false,
      "decay": 0.5,
      "threshold": -48,
    },
    inputB: {
      "@input": 0,
      "@model": device.inputModel,
      "noiseGate": false,
      "decay": 0.5,
      "threshold": -48,
    },
  };

  const blockKeys: string[] = [];
  const orderedBlocks = sortBlocks(preset.blocks).slice(0, device.maxBlocks);
  orderedBlocks.forEach((b, i) => {
    const key = `block${i}`;
    blockKeys.push(key);
    dsp0[key] = {
      "@enabled": true,
      "@model": b.model,
      "@no_snapshot_bypass": false,
      "@path": 0,
      "@position": i,
      "@type": b.type.toLowerCase() === "cab" ? 2 : b.type.toLowerCase() === "amp" ? 1 : 0,
      ...sanitizeParameters(b.parameters),
    };
  });

  dsp0["outputA"] = {
    "@model": device.outputMainModel,
    "@output": 1,
    "pan": 0.5,
    "gain": 0,
  };
  dsp0["outputB"] = {
    "@model": device.outputSendModel,
    "@output": 0,
    "Type": true,
    "pan": 0.5,
    "gain": 0,
  };

  const snapshots = buildSnapshots(blockKeys, device.snapshotCount);

  const hlx = {
    data: {
      meta: {
        name: preset.name.substring(0, 24),
        application: "HX Edit",
        build_sha: "",
        modifieddate: Math.floor(Date.now() / 1000),
        appversion: device.appVersion,
      },
      device: device.deviceId,
      device_version: device.deviceVersion,
      tone: {
        dsp1: {},
        global: {
          "@PowercabVoicing": 0,
          "@model": "@global_params",
          "@topology0": "A",
          "@cursor_dsp": 0,
          "@PowercabMode": 0,
          "@guitarpad": 0,
          "@pedalstate": 2,
          "@cursor_group": blockKeys[0] ?? "block0",
          "@DtSelect": 2,
          "@cursor_path": 0,
          "@current_snapshot": 0,
          "@tempo": 120,
          "@cursor_position": 0,
          "@topology1": 0,
          "@PowercabSelect": 2,
          "@guitarinputZ": 0,
        },
        irUuidTable: buildIrUuidTable(),
        variax: {
          "@variax_model": 0,
          "@variax_str4tuning": 0,
          "@variax_str1level": 1,
          "@variax_str5level": 1,
          "@variax_str1tuning": 0,
          "@variax_lockctrls": 0,
          "@variax_str2tuning": 0,
          "@variax_customtuning": true,
          "@variax_magmode": true,
          "@variax_str2level": 1,
          "@variax_str5tuning": 0,
          "@variax_str6level": 1,
          "@variax_toneknob": -0.1,
          "@variax_str3level": 1,
          "@variax_str3tuning": 0,
          "@variax_str6tuning": 0,
          "@variax_volumeknob": -0.1,
          "@variax_str4level": 1,
        },
        dsp0,
        ...snapshots,
      },
    },
    meta: {
      original: 0,
      pbn: 0,
      premium: 0,
    },
    schema: "L6Preset",
    version: 6,
  };

  return JSON.stringify(hlx, null, 2);
}

export async function downloadPreset(preset: TonePreset, device: DeviceConfig = DEFAULT_DEVICE): Promise<void> {
  const filename = `${preset.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")}.hlx`;
  const content  = generateHlxJson(preset, device);

  if (window.electronAPI) {
    await window.electronAPI.savePreset(filename, content);
  } else {
    // Fallback for a future web build
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
