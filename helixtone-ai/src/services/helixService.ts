import { TonePreset, HelixBlock } from "../types";
import { DeviceConfig, DEFAULT_DEVICE } from "../config/devices";
import { downloadStadiumPreset } from "./stadiumService";

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
  "drive","ch1drive","ch2drive","nrmdrive","brtdrive","leadgain","leaddrive","drive 1","drive 2","drive trem",
  "gain","bass","mid","treble","presence","master","chvol","level",
  "mix","tone","sustain","attack","release","balance","sag","hum","bias","biasx",
  "ripple","sensitivity","depth","rate","speed","feedback","decay","wet","dry",
  "volume","pan","balanceb","balancea","amount","headroom","clarity","warmth",
  "resonance","boost","bright","emphasis","knee","gainmod","voltage","clipping",
  "vibratorate","vibratodepth","chorusintensity","wowflutter","noise","cut",
]);

function sanitizeParameters(
  params: Record<string, number | boolean | string>
): Record<string, number | boolean | string> {
  const out: Record<string, number | boolean | string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "number" && UNIT_PARAMS.has(k.toLowerCase())) {
      // If the AI outputs a percentage-style value (e.g. Mix: 50 instead of 0.5),
      // normalize it to 0–1 before clamping. Applies when value is in (1, 100].
      const normalized = v > 1.0 && v <= 100 ? v / 100 : v;
      out[k] = Math.max(0, Math.min(1, normalized));
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

function buildSnapshots(
  blockKeys: string[],
  count: number,
  dualDsp: boolean,
): Record<string, unknown> {
  const enabledMap: Record<string, boolean> = {};
  blockKeys.forEach((k) => { enabledMap[k] = true; });

  const snapshot = (name: string, valid: boolean) => ({
    "@name":        name,
    "@tempo":       120,
    "@valid":       valid,
    "@pedalstate":  0,
    "@ledcolor":    0,
    "@custom_name": false,
    "blocks": dualDsp
      ? { "dsp0": { ...enabledMap }, "dsp1": {} }
      : { "dsp0": { ...enabledMap } },
  });

  const result: Record<string, unknown> = {};
  for (let i = 0; i < count; i++) {
    result[`snapshot${i}`] = snapshot(`Snapshot ${i + 1}`, i === 0);
  }
  return result;
}

// Empty-but-valid DSP chain for dual-DSP devices (dsp1 carries no AI blocks)
function buildEmptyDsp1(device: DeviceConfig): Record<string, unknown> {
  return {
    inputA: {
      "@input":    0,
      "@model":    device.inputModel,
      "noiseGate": false,
      "decay":     0.5,
      "threshold": -48,
    },
    inputB: {
      "@input":    0,
      "@model":    device.inputModelB ?? device.inputModel,
      "noiseGate": false,
      "decay":     0.5,
      "threshold": -48,
    },
    outputA: {
      "@model":  device.outputMainModel,
      "@output": 1,
      "pan":     0.5,
      "gain":    0,
    },
    outputB: {
      "@model":  device.outputSendModel,
      "@output": 0,
      "pan":     0.5,
      "gain":    0,
    },
    split: {
      "@model":               "HD2_AppDSPFlowSplitY",
      "@enabled":             true,
      "@no_snapshot_bypass":  false,
      "@position":            0,
      "BalanceA":             0.5,
      "BalanceB":             0.5,
      "bypass":               false,
    },
    join: {
      "@model":               "HD2_AppDSPFlowJoin",
      "@enabled":             true,
      "@no_snapshot_bypass":  false,
      "@position":            1,
      "A Level":              0,
      "A Pan":                0,
      "B Level":              0,
      "B Pan":                1,
      "B Polarity":           false,
      "Level":                0,
    },
  };
}

// dt / powercab sections required by Helix LT/Floor devices
function buildDtSections(): Record<string, unknown> {
  const dtEntry = {
    "@model":          "@dt",
    "@dt_12ax7boost":  0,
    "@dt_bplusvoltage": 0,
    "@dt_channel":     0,
    "@dt_feedbackcap": 0,
    "@dt_poweramp":    1,
    "@dt_reverb":      true,
    "@dt_revmix":      0.25,
    "@dt_topology":    0,
    "@dt_tubeconfig":  0,
  };
  const pcEntry = {
    "@model":                    "@powercab",
    "@powercab_color":           0,
    "@powercab_distance":        3.5,
    "@powercab_flatlevel":       0,
    "@powercab_hicut":           20100,
    "@powercab_irlevel":         -18,
    "@powercab_lowcut":          19.9,
    "@powercab_mic":             0,
    "@powercab_speaker":         0,
    "@powercab_speakerlevel":    -15,
    "@powercab_userir":          0,
  };
  return {
    dt0:          { ...dtEntry },
    dt1:          { ...dtEntry },
    dtdual:       { ...dtEntry },
    powercab0:    { ...pcEntry },
    powercab1:    { ...pcEntry },
    powercabdual: { ...pcEntry },
  };
}

export function generateHlxJson(preset: TonePreset, device: DeviceConfig = DEFAULT_DEVICE): string {
  // ── dsp0: all AI-generated blocks go here ────────────────────────────────
  const dsp0: Record<string, unknown> = {
    inputA: {
      "@input":    1,
      "@model":    device.inputModel,
      "noiseGate": false,
      "decay":     0.5,
      "threshold": -48,
    },
    inputB: {
      "@input":    0,
      "@model":    device.inputModelB ?? device.inputModel,
      "noiseGate": false,
      "decay":     0.5,
      "threshold": -48,
    },
  };

  const blockKeys: string[] = [];

  // Separate cab from the numbered block sequence — it lives as "cab0" linked to the amp
  const allBlocks   = sortBlocks(preset.blocks).slice(0, device.maxBlocks);
  const cabBlock    = allBlocks.find((b) => b.type.toLowerCase() === "cab") ?? null;
  const nonCabBlocks = allBlocks.filter((b) => b.type.toLowerCase() !== "cab");

  let blockIndex = 0;
  nonCabBlocks.forEach((b) => {
    const isAmp = b.type.toLowerCase() === "amp";
    const key   = `block${blockIndex}`;
    blockKeys.push(key);

    dsp0[key] = {
      "@enabled":             true,
      "@model":               b.model,
      "@no_snapshot_bypass":  false,
      "@path":                0,
      "@position":            blockIndex,
      "@stereo":              false,
      // @type: 3 = amp with linked cab, 0 = everything else
      "@type":                isAmp && cabBlock ? 3 : 0,
      ...(isAmp && cabBlock ? { "@cab": "cab0", "@bypassvolume": 1 } : {}),
      ...sanitizeParameters(b.parameters),
    };

    // Attach cab as "cab0" immediately after the amp entry
    if (isAmp && cabBlock) {
      const { level: _l, pan: _p, ...cabParams } = sanitizeParameters(
        cabBlock.parameters as Record<string, number | boolean | string>
      ) as Record<string, number | boolean | string>;
      dsp0["cab0"] = {
        "@model":   cabBlock.model,
        "@enabled": true,
        "@mic":     0,
        ...cabParams,
      };
    }

    blockIndex++;
  });

  // If there was no amp but a cab exists, emit it as a standalone block (rare)
  if (cabBlock && !nonCabBlocks.some((b) => b.type.toLowerCase() === "amp")) {
    const key = `block${blockIndex}`;
    blockKeys.push(key);
    dsp0[key] = {
      "@enabled":            true,
      "@model":              cabBlock.model,
      "@no_snapshot_bypass": false,
      "@path":               0,
      "@position":           blockIndex,
      "@stereo":             false,
      "@type":               2,
      ...sanitizeParameters(cabBlock.parameters),
    };
    blockIndex++;
  }

  dsp0["outputA"] = {
    "@model":  device.outputMainModel,
    "@output": 1,
    "pan":     0.5,
    "gain":    0,
  };
  dsp0["outputB"] = {
    "@model":  device.outputSendModel,
    "@output": 0,
    "Type":    true,
    "pan":     0.5,
    "gain":    0,
  };

  // Dual-DSP devices (Helix LT/Floor) require split/join on dsp0 too
  if (device.dualDsp) {
    dsp0["split"] = {
      "@model":               "HD2_AppDSPFlowSplitY",
      "@enabled":             true,
      "@no_snapshot_bypass":  false,
      "@position":            0,
      "BalanceA":             0.5,
      "BalanceB":             0.5,
      "bypass":               false,
    };
    dsp0["join"] = {
      "@model":               "HD2_AppDSPFlowJoin",
      "@enabled":             true,
      "@no_snapshot_bypass":  false,
      "@position":            blockIndex + 1,
      "A Level":              0,
      "A Pan":                0,
      "B Level":              0,
      "B Pan":                1,
      "B Polarity":           false,
      "Level":                0,
    };
  }

  const snapshots = buildSnapshots(blockKeys, device.snapshotCount, device.dualDsp);

  // ── Tone object ───────────────────────────────────────────────────────────
  const tone: Record<string, unknown> = {
    dsp0,
    dsp1: device.dualDsp ? buildEmptyDsp1(device) : {},
    global: {
      "@model":            "@global_params",
      "@topology0":        "A",
      "@topology1":        device.dualDsp ? "A" : 0,
      "@cursor_dsp":       0,
      "@cursor_path":      0,
      "@cursor_position":  0,
      "@cursor_group":     blockKeys[0] ?? "block0",
      "@tempo":            120,
      "@current_snapshot": 0,
      "@pedalstate":       2,
      "@guitarpad":        0,
      "@guitarinputZ":     0,
      "@DtSelect":         2,
      "@PowercabMode":     0,
      "@PowercabSelect":   2,
      "@PowercabVoicing":  0,
    },
    irUuidTable: buildIrUuidTable(),
    variax: {
      "@variax_model":        0,
      "@variax_customtuning": true,
      "@variax_lockctrls":    0,
      "@variax_magmode":      true,
      "@variax_str1level":    1,
      "@variax_str1tuning":   0,
      "@variax_str2level":    1,
      "@variax_str2tuning":   0,
      "@variax_str3level":    1,
      "@variax_str3tuning":   0,
      "@variax_str4level":    1,
      "@variax_str4tuning":   0,
      "@variax_str5level":    1,
      "@variax_str5tuning":   0,
      "@variax_str6level":    1,
      "@variax_str6tuning":   0,
      "@variax_toneknob":     -0.1,
      "@variax_volumeknob":   -0.1,
    },
    ...snapshots,
  };

  // dt/powercab sections are expected by Helix LT/Floor devices
  if (device.dualDsp) {
    Object.assign(tone, buildDtSections());
  }

  const hlx = {
    version: 6,
    data: {
      device:         device.deviceId,
      device_version: device.deviceVersion,
      meta: {
        name:         preset.name.substring(0, 24),
        application:  "HX Edit",
        build_sha:    "",
        modifieddate: Math.floor(Date.now() / 1000),
        appversion:   device.appVersion,
      },
      tone,
    },
    meta: {
      original: 0,
      pbn:      0,
      premium:  0,
    },
    schema: "L6Preset",
  };

  return JSON.stringify(hlx, null, 2);
}

export async function downloadPreset(preset: TonePreset, device: DeviceConfig = DEFAULT_DEVICE): Promise<void> {
  // Route to the correct generator based on file format
  if (device.fileFormat === "hsp") {
    return downloadStadiumPreset(preset, device);
  }

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
