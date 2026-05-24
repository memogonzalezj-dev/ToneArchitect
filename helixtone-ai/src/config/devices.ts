// ── Device configuration registry ────────────────────────────────────────────
//
// To add a new device:
//   1. Export a preset from HX Edit on that device
//   2. Run: python3 -c "import json; d=json.load(open('preset.hlx')); print(d['data']['device'], d['data']['device_version'])"
//   3. Add an entry below

export interface DeviceConfig {
  id:                string;   // Internal key
  label:             string;   // Display name in UI
  deviceId:          number;   // data.device in HLX JSON
  deviceVersion:     number;   // data.device_version in HLX JSON
  appVersion:        number;   // data.meta.appversion in HLX JSON
  maxBlocks:         number;   // DSP block hard limit (per dsp0 for dual-DSP devices)
  snapshotCount:     number;   // How many snapshots to write
  hasAmpCab:         boolean;  // Whether amp/cab blocks are supported
  dualDsp:           boolean;  // Whether device has two DSP chips (Helix LT/Floor/etc.)
  inputModel:        string;   // @model for inputA
  inputModelB?:      string;   // @model for inputB (if different from inputA)
  outputMainModel:   string;   // @model for outputA
  outputSendModel:   string;   // @model for outputB
  available:         boolean;  // false = "Coming Soon" in dropdown
}

export const DEVICES: DeviceConfig[] = [
  // ── Full Helix floor units (dual DSP, HD2_ models) ──────────────────────
  {
    // Verified from real Floor export: helix_example_Floor.hlx (Disintegrated Chime)
    id:              "helix_floor",
    label:           "Helix Floor",
    deviceId:        2162689,
    deviceVersion:   58720256,
    appVersion:      58720256,
    maxBlocks:       8,        // dsp1 join @position 8 confirmed in real export
    snapshotCount:   8,
    hasAmpCab:       true,
    dualDsp:         true,
    inputModel:      "HD2_AppDSPFlow1Input",
    inputModelB:     "HD2_AppDSPFlow2Input",
    outputMainModel: "HD2_AppDSPFlowOutput",
    outputSendModel: "HD2_AppDSPFlowOutput",
    available:       true,
  },
  {
    // Verified from real LT export: Black_Album_Thrash_LT.hlx
    id:              "helix_lt",
    label:           "Helix LT",
    deviceId:        2162692,
    deviceVersion:   58720256,
    appVersion:      58720256,
    maxBlocks:       8,
    snapshotCount:   8,
    hasAmpCab:       true,
    dualDsp:         true,
    inputModel:      "HD2_AppDSPFlow1Input",
    inputModelB:     "HD2_AppDSPFlow2Input",
    outputMainModel: "HD2_AppDSPFlowOutput",
    outputSendModel: "HD2_AppDSPFlowOutput",
    available:       true,
  },
  {
    // TODO: need a real .hlx export from a Helix Stadium to confirm device ID
    id:              "helix_stadium",
    label:           "Helix Stadium",
    deviceId:        0,
    deviceVersion:   0,
    appVersion:      0,
    maxBlocks:       8,
    snapshotCount:   8,
    hasAmpCab:       true,
    dualDsp:         true,
    inputModel:      "HD2_AppDSPFlow1Input",
    inputModelB:     "HD2_AppDSPFlow2Input",
    outputMainModel: "HD2_AppDSPFlowOutput",
    outputSendModel: "HD2_AppDSPFlowOutput",
    available:       false,
  },

  // ── HX compact units (single DSP) ───────────────────────────────────────
  {
    id:              "hx_stomp",
    label:           "HX Stomp",
    deviceId:        2162694,
    deviceVersion:   58720256,
    appVersion:      58851328,
    maxBlocks:       6,
    snapshotCount:   3,
    hasAmpCab:       true,
    dualDsp:         false,
    inputModel:      "HelixStomp_AppDSPFlowInput",
    outputMainModel: "HelixStomp_AppDSPFlowOutputMain",
    outputSendModel: "HelixStomp_AppDSPFlowOutputSend",
    available:       true,
  },
  {
    // Verified from real XL export: helix_example_StompXL.hlx (Texas Flood & Cold Shot)
    id:              "hx_stomp_xl",
    label:           "HX Stomp XL",
    deviceId:        2162699,
    deviceVersion:   58720256,
    appVersion:      58720256,
    maxBlocks:       8,
    snapshotCount:   4,
    hasAmpCab:       true,
    dualDsp:         false,
    inputModel:      "HelixStomp_AppDSPFlowInput",
    outputMainModel: "HelixStomp_AppDSPFlowOutputMain",
    outputSendModel: "HelixStomp_AppDSPFlowOutputSend",
    available:       true,
  },
];

export const DEFAULT_DEVICE = DEVICES[0];
