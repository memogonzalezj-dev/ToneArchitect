// ── Device configuration registry ────────────────────────────────────────────
//
// To add a new device:
//   1. Export a preset from HX Edit on that device
//   2. Run: python3 -c "import json; d=json.load(open('preset.hlx')); print(d['data']['device'], d['data']['device_version'])"
//   3. Add an entry below

export interface DeviceConfig {
  id:                string;          // Internal key
  label:             string;          // Display name in UI
  fileFormat:        'hlx' | 'hsp';  // Output file format (.hlx = Helix, .hsp = Stadium)
  deviceId:          number;          // data.device / meta.device_id in output JSON
  deviceVersion:     number;          // data.device_version / meta.device_version
  appVersion:        number;          // data.meta.appversion (hlx only)
  maxBlocks:         number;          // DSP block hard limit (AI-visible cap)
  snapshotCount:     number;          // How many snapshots to write
  hasAmpCab:         boolean;         // Whether amp/cab blocks are supported
  dualDsp:           boolean;         // Whether device has two DSP chips (hlx only)
  inputModel:        string;          // @model for inputA (hlx only)
  inputModelB?:      string;          // @model for inputB if different from inputA (hlx only)
  outputMainModel:   string;          // @model for outputA (hlx only)
  outputSendModel:   string;          // @model for outputB (hlx only)
  available:         boolean;         // false = "Coming Soon" in dropdown
}

export const DEVICES: DeviceConfig[] = [
  // ── Helix Stadium (.hsp format — next-gen platform) ─────────────────────
  {
    // Verified from two real .hsp exports. device_id and device_version confirmed.
    // File format is .hsp (not .hlx) with completely different schema —
    // uses Agoura_ amp models, HX2_ EQ, HD2_*Mono/Stereo effects, P35_ I/O.
    id:              "helix_stadium",
    label:           "Helix Stadium",
    fileFormat:      "hsp",
    deviceId:        2490368,
    deviceVersion:   302056738,
    appVersion:      0,               // not used in .hsp format
    maxBlocks:       9,               // 4 pre-amp + amp + cab + 3 post-amp = 9 typical
    snapshotCount:   8,
    hasAmpCab:       true,
    dualDsp:         false,           // not applicable to .hsp format
    inputModel:      "",              // not applicable to .hsp format
    outputMainModel: "",
    outputSendModel: "",
    available:       true,
  },

  // ── Full Helix floor units (.hlx, dual DSP, HD2_ models) ────────────────
  {
    // Verified from real Floor export: helix_example_Floor.hlx (Disintegrated Chime)
    id:              "helix_floor",
    label:           "Helix Floor",
    fileFormat:      "hlx",
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
    fileFormat:      "hlx",
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
  // ⚠️  Helix Stadium uses a completely different file format (.hsp, not .hlx).
  //    device_id: 2490368, device_version: 302056738
  //    Block structure: flow[n].b00 (not dsp0.block0)
  //    Model prefixes: P35_, Agoura_, HX2_ (not HD2_/HelixStomp_)
  //    Params wrapped: { "Drive": { "value": 0.45 } } (not flat values)
  //    Snapshots inline per-param, not separate snapshot0..N objects
  //    File has binary header prefix before JSON ("rpshnosj{")
  //    Supporting Stadium requires a new generator — this is v2.0 scope.
  //    Do NOT enable until stadiumService.ts is built and tested.

  // ── HX compact units (.hlx, single DSP) ────────────────────────────────
  {
    id:              "hx_stomp",
    label:           "HX Stomp",
    fileFormat:      "hlx",
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
    fileFormat:      "hlx",
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
