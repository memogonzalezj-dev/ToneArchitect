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
  maxBlocks:         number;   // DSP block hard limit
  snapshotCount:     number;   // How many snapshots to write
  hasAmpCab:         boolean;  // Whether amp/cab blocks are supported
  inputModel:        string;   // @model for inputA / inputB
  outputMainModel:   string;   // @model for outputA
  outputSendModel:   string;   // @model for outputB
  available:         boolean;  // false = "Coming Soon" in dropdown
}

export const DEVICES: DeviceConfig[] = [
  {
    id:              "hx_stomp",
    label:           "HX Stomp",
    deviceId:        2162694,
    deviceVersion:   58720256,
    appVersion:      58851328,
    maxBlocks:       6,
    snapshotCount:   3,
    hasAmpCab:       true,
    inputModel:      "HelixStomp_AppDSPFlowInput",
    outputMainModel: "HelixStomp_AppDSPFlowOutputMain",
    outputSendModel: "HelixStomp_AppDSPFlowOutputSend",
    available:       true,
  },
  {
    id:              "hx_effects",
    label:           "HX Effects",
    deviceId:        2162693,
    deviceVersion:   40960000,
    appVersion:      40960000,
    maxBlocks:       9,
    snapshotCount:   4,
    hasAmpCab:       false,
    inputModel:      "HelixFx_AppDSPFlowInput",
    outputMainModel: "HelixFx_AppDSPFlowOutput",
    outputSendModel: "HelixFx_AppDSPFlowOutput",
    available:       true,
  },
  {
    id:              "hx_stomp_xl",
    label:           "HX Stomp XL",
    // ⚠️  device_id NOT yet confirmed from a real XL preset with 8 blocks.
    // The file we tested only had 6 blocks / 3 snapshots — likely a mis-named Stomp preset.
    // Using shared device_id with HX Stomp risks silent import corruption on Stomp hardware.
    // Enable once we have a verified 8-block HX Stomp XL export.
    deviceId:        0,
    deviceVersion:   0,
    appVersion:      0,
    maxBlocks:       8,
    snapshotCount:   4,
    hasAmpCab:       true,
    inputModel:      "HelixStomp_AppDSPFlowInput",
    outputMainModel: "HelixStomp_AppDSPFlowOutputMain",
    outputSendModel: "HelixStomp_AppDSPFlowOutputSend",
    available:       false,
  },
  {
    id:              "hx_one",
    label:           "HX One",
    deviceId:        0,          // TODO: export any preset from HX One and read data.device
    deviceVersion:   0,
    appVersion:      0,
    maxBlocks:       1,
    snapshotCount:   1,
    hasAmpCab:       false,
    inputModel:      "HelixStomp_AppDSPFlowInput",
    outputMainModel: "HelixStomp_AppDSPFlowOutputMain",
    outputSendModel: "HelixStomp_AppDSPFlowOutputSend",
    available:       false,
  },
];

export const DEFAULT_DEVICE = DEVICES[0];
